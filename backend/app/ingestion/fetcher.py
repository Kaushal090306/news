import time
import json
import uuid
import httpx
import feedparser
from datetime import datetime, timezone
from app.config import settings
from app.database import db_session, get_db_connection
from app.ingestion.sources_config import SOURCE_REGISTRY
from app.ingestion.parsers import (
    normalize_url,
    hash_string,
    normalize_title,
    clean_html_to_text,
    extract_image_from_feed_entry,
    upgrade_image_url_to_hd,
    parse_published_date,
    extract_entities_and_topics
)
from app.clustering.engine import ClusteringEngine, slugify
from app.ai.editorial import AIEditorialEngine

class IngestionPipeline:

    @staticmethod
    def sync_source_registry():
        """Ensure all 25-30 registered sources exist in the PostgreSQL database."""
        with db_session() as conn:
            cursor = conn.cursor()
            source_data = [
                (
                    src['id'], src['name'], src['type'], src['base_url'], src['feed_url'],
                    src.get('country', 'Global'), src.get('language', 'en'),
                    src.get('category', 'World'), src.get('fetch_interval', 15),
                    src.get('rate_limit', 100), src.get('logo_url', ''), 1
                )
                for src in SOURCE_REGISTRY
            ]
            from psycopg2.extras import execute_values
            execute_values(cursor, """
                INSERT INTO sources (id, name, type, base_url, feed_url, country, language, category, fetch_interval, rate_limit, logo_url, active)
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    feed_url = EXCLUDED.feed_url,
                    country = EXCLUDED.country,
                    category = EXCLUDED.category,
                    logo_url = EXCLUDED.logo_url;
            """, source_data)

    @staticmethod
    async def fetch_source_feed(source: dict, client: httpx.AsyncClient) -> dict:
        """Fetch and parse feed for a given source."""
        source_id = source['id']
        feed_url = source['feed_url']
        start_time = time.time()
        
        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml, */*"
        }
        
        try:
            response = await client.get(feed_url, headers=headers, timeout=12.0, follow_redirects=True)
            duration_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code != 200:
                return {
                    "source_id": source_id,
                    "status": "failed",
                    "error": f"HTTP {response.status_code}",
                    "duration_ms": duration_ms,
                    "entries": []
                }
                
            parsed = feedparser.parse(response.content)
            entries = parsed.entries or []
            
            status = "healthy"
            if duration_ms > 3500:
                status = "slow"
                
            return {
                "source_id": source_id,
                "status": status,
                "duration_ms": duration_ms,
                "entries": entries[:25]
            }
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "source_id": source_id,
                "status": "failed",
                "error": str(e),
                "duration_ms": duration_ms,
                "entries": []
            }

    @staticmethod
    async def run_ingestion_cycle(target_source_id: str = None) -> dict:
        """Runs a complete ingestion cycle across active sources."""
        IngestionPipeline.sync_source_registry()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if target_source_id:
            cursor.execute("SELECT * FROM sources WHERE id = %s AND active = 1", (target_source_id,))
        else:
            cursor.execute("SELECT * FROM sources WHERE active = 1")
        sources = [dict(row) for row in cursor.fetchall()]
        
        # Load active stories from the last 72 hours for story clustering
        cursor.execute("""
            SELECT id, canonical_title, summary, category, country, first_published_at, cluster_hash 
            FROM stories 
            ORDER BY last_updated_at DESC LIMIT 200
        """)
        raw_stories = cursor.fetchall()
        active_stories = []
        for r in raw_stories:
            d = dict(r)
            if isinstance(d.get('first_published_at'), datetime):
                d['first_published_at'] = d['first_published_at'].isoformat()
            active_stories.append(d)
        
        total_found = 0
        total_added = 0
        total_duplicates = 0
        total_clusters_updated = 0
        
        async with httpx.AsyncClient(verify=False) as client:
            for src in sources:
                result = await IngestionPipeline.fetch_source_feed(src, client)
                source_id = src['id']
                entries = result.get('entries', [])
                status = result.get('status', 'healthy')
                duration_ms = result.get('duration_ms', 0)
                error_msg = result.get('error')
                
                src_added = 0
                src_dups = 0
                now_dt = datetime.now(timezone.utc)
                
                for entry in entries:
                    raw_url = getattr(entry, 'link', '') or getattr(entry, 'id', '')
                    if not raw_url:
                        continue
                        
                    clean_url = normalize_url(raw_url)
                    url_hash = hash_string(clean_url)
                    raw_title = getattr(entry, 'title', '').strip()
                    if not raw_title:
                        continue
                        
                    total_found += 1
                    
                    # Check Level 1: URL Hash deduplication
                    cursor.execute("SELECT id FROM articles WHERE url_hash = %s", (url_hash,))
                    if cursor.fetchone():
                        total_duplicates += 1
                        src_dups += 1
                        continue
                        
                    # Extract article metadata (check for full content:encoded, content, or summary)
                    norm_title = normalize_title(raw_title)
                    content_candidates = []
                    if hasattr(entry, 'content') and entry.content:
                        for c in entry.content:
                            if isinstance(c, dict) and 'value' in c:
                                content_candidates.append(c['value'])
                    if hasattr(entry, 'content_encoded'):
                        content_candidates.append(entry.content_encoded)
                    if hasattr(entry, 'summary'):
                        content_candidates.append(entry.summary or '')
                    if hasattr(entry, 'description'):
                        content_candidates.append(entry.description or '')

                    longest_html = max(content_candidates, key=len) if content_candidates else ''
                    clean_content = clean_html_to_text(longest_html)
                    image_url = extract_image_from_feed_entry(entry)
                    pub_date = parse_published_date(entry)
                    entities = extract_entities_and_topics(raw_title, clean_content)
                    
                    authors = []
                    if hasattr(entry, 'author') and entry.author:
                        authors.append(entry.author)
                    elif hasattr(entry, 'authors'):
                        authors = [a.get('name', '') for a in entry.authors if a.get('name')]
                    if not authors:
                        authors = [src['name']]

                    # Perform Clustering & Deduplication against existing active stories
                    match_result = ClusteringEngine.match_article_to_story(
                        raw_title, clean_content, entities, pub_date, active_stories
                    )
                    
                    article_id = str(uuid.uuid4())
                    
                    if match_result:
                        matched_story_id, match_reason, confidence = match_result
                        
                        cursor.execute("""
                        INSERT INTO articles (
                            id, source_id, url, url_hash, title, normalized_title, authors,
                            published_at, fetched_at, content_text, summary, category,
                            tags, entities, image_url, canonical_url, story_id
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (url) DO NOTHING
                        """, (
                            article_id, source_id, clean_url, url_hash, raw_title, norm_title,
                            json.dumps(authors), pub_date, now_dt, clean_content, clean_content[:280],
                            src['category'], json.dumps([src['category']]), json.dumps(entities),
                            image_url, clean_url, matched_story_id
                        ))
                        
                        cursor.execute("SELECT sources_count, hero_image FROM stories WHERE id = %s", (matched_story_id,))
                        story_row = cursor.fetchone()
                        if story_row:
                            new_sources_count = (story_row['sources_count'] or 1) + 1
                            hero_img = upgrade_image_url_to_hd(image_url or story_row['hero_image'] or '')
                            if not hero_img and story_row['hero_image']:
                                hero_img = upgrade_image_url_to_hd(story_row['hero_image'])
                            importance = ClusteringEngine.calculate_importance_score(new_sources_count, False, src['category'])
                            is_live = 1 if (new_sources_count >= 3 or importance >= 75) else 0
                            
                            cursor.execute("""
                            UPDATE stories SET 
                                last_updated_at = %s,
                                sources_count = %s,
                                importance_score = %s,
                                hero_image = %s,
                                is_live = %s
                            WHERE id = %s
                            """, (now_dt, new_sources_count, importance, hero_img, is_live, matched_story_id))
                        
                        total_clusters_updated += 1
                        src_added += 1
                        total_added += 1
                    else:
                        story_id = str(uuid.uuid4())
                        base_slug = slugify(raw_title)
                        slug = f"{src['category'].lower()}/{datetime.now().strftime('%Y/%m/%d')}/{base_slug}-{story_id[:6]}"
                        
                        article_stub = [{
                            'source_name': src['name'],
                            'content_text': clean_content,
                            'summary': clean_content[:280]
                        }]
                        
                        editorial = AIEditorialEngine.generate_story_editorial(
                            raw_title, article_stub, src['category']
                        )
                        
                        cursor.execute("""
                        INSERT INTO stories (
                            id, canonical_title, slug, summary, ai_takeaways,
                            ai_what_happened, ai_why_it_matters, category, country,
                            is_live, is_breaking, importance_score, hero_image,
                            first_published_at, last_updated_at, sources_count,
                            cluster_hash, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'published')
                        ON CONFLICT (slug) DO NOTHING
                        """, (
                            story_id, raw_title, slug, editorial['summary'],
                            json.dumps(editorial['ai_takeaways']),
                            editorial['ai_what_happened'],
                            editorial['ai_why_it_matters'],
                            src['category'], src.get('country', 'Global'),
                            0, 0, 50, image_url, pub_date, now_dt, 1,
                            hash_string(norm_title)
                        ))
                        
                        cursor.execute("""
                        INSERT INTO articles (
                            id, source_id, url, url_hash, title, normalized_title, authors,
                            published_at, fetched_at, content_text, summary, category,
                            tags, entities, image_url, canonical_url, story_id
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (url) DO NOTHING
                        """, (
                            article_id, source_id, clean_url, url_hash, raw_title, norm_title,
                            json.dumps(authors), pub_date, now_dt, clean_content, clean_content[:280],
                            src['category'], json.dumps([src['category']]), json.dumps(entities),
                            image_url, clean_url, story_id
                        ))
                        
                        active_stories.append({
                            'id': story_id,
                            'canonical_title': raw_title,
                            'summary': editorial['summary'],
                            'category': src['category'],
                            'country': src.get('country', 'Global'),
                            'first_published_at': pub_date,
                            'cluster_hash': hash_string(norm_title)
                        })
                        
                        src_added += 1
                        total_added += 1

                # Update source status & log
                cursor.execute("""
                UPDATE sources SET
                    last_fetch_at = %s,
                    status = %s,
                    error_count = CASE WHEN %s = 'failed' THEN error_count + 1 ELSE 0 END,
                    last_error = %s,
                    total_articles = total_articles + %s
                WHERE id = %s
                """, (now_dt, status, status, error_msg, src_added, source_id))
                
                cursor.execute("""
                INSERT INTO ingestion_logs (source_id, status, articles_found, articles_added, duplicates_found, duration_ms, error_message, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (source_id, status, len(entries), src_added, src_dups, duration_ms, error_msg, now_dt))
                
                conn.commit()
                
        conn.close()
        
        try:
            from app.api.stories import clear_feed_cache
            clear_feed_cache()
        except Exception:
            pass
        
        return {
            "sources_processed": len(sources),
            "articles_found": total_found,
            "articles_added": total_added,
            "duplicates_filtered": total_duplicates,
            "clusters_updated": total_clusters_updated
        }
