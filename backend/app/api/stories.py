from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.database import db_session

router = APIRouter(prefix="/stories", tags=["Stories"])

def serialize_story(story: dict) -> dict:
    if not story:
        return story
    for date_field in ['created_at', 'last_updated_at', 'first_seen_at']:
        val = story.get(date_field)
        if isinstance(val, datetime):
            story[date_field] = val.isoformat()
    return story

@router.get("")
def get_stories(
    category: Optional[str] = None,
    country: Optional[str] = None,
    search: Optional[str] = None,
    date: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    search_term = search or q
    try:
        limit_val = min(int(limit), 500)
    except Exception:
        limit_val = 100
    try:
        offset_val = int(offset)
    except Exception:
        offset_val = 0

    with db_session() as conn:
        cursor = conn.cursor()
        
        query = """
            SELECT s.*
            FROM stories s
            WHERE s.status = 'published'
        """
        params = []
        
        if category and category.lower() != 'all':
            query += " AND LOWER(s.category) = LOWER(%s)"
            params.append(category)
            
        if country and country.lower() != 'all':
            query += " AND LOWER(s.country) = LOWER(%s)"
            params.append(country)

        if date and date.lower() != 'all':
            query += " AND DATE(s.last_updated_at) = %s"
            params.append(date)
            
        if search_term:
            query += " AND (s.canonical_title ILIKE %s OR s.summary ILIKE %s)"
            term = f"%{search_term}%"
            params.extend([term, term])
            
        query += " ORDER BY s.last_updated_at DESC, s.importance_score DESC LIMIT %s OFFSET %s"
        params.extend([limit_val, offset_val])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        stories = [serialize_story(dict(r)) for r in rows]
            
        cursor.execute("SELECT COUNT(*) as total FROM stories WHERE status = 'published'")
        total_count = cursor.fetchone()['total']
        
        return {
            "total": total_count,
            "count": len(stories),
            "stories": stories
        }

@router.get("/by-category")
def get_stories_by_category(date: Optional[str] = None, country: Optional[str] = None):
    """Returns top distinct stories strictly partitioned by each individual category in 1 single fast query."""
    with db_session() as conn:
        cursor = conn.cursor()
        
        query = """
            WITH ranked_stories AS (
                SELECT s.*,
                       ROW_NUMBER() OVER(
                           PARTITION BY LOWER(s.category) 
                           ORDER BY s.last_updated_at DESC, s.importance_score DESC
                       ) as rn
                FROM stories s
                WHERE s.status = 'published'
        """
        params = []
        if date and date.lower() != 'all':
            query += " AND DATE(s.last_updated_at) = %s"
            params.append(date)

        if country and country.lower() != 'all':
            query += " AND LOWER(s.country) = LOWER(%s)"
            params.append(country)
            
        query += """
            )
            SELECT * FROM ranked_stories
            WHERE rn <= 12
            ORDER BY category, last_updated_at DESC
        """
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        categories_map = {
            "business": [],
            "technology": [],
            "science": [],
            "health": [],
            "sport": [],
            "culture": [],
            "world": [],
            "india": []
        }
        
        for r in rows:
            cat_key = (r['category'] or 'world').lower()
            if cat_key in categories_map:
                categories_map[cat_key].append(serialize_story(dict(r)))
            else:
                categories_map.setdefault(cat_key, []).append(serialize_story(dict(r)))

        # Fallback to previous latest news:
        # If country is selected, ensure every slot is filled with previous stories FROM THAT COUNTRY ONLY
        if country and country.lower() != 'all':
            cursor.execute("""
                SELECT s.*
                FROM stories s
                WHERE s.status = 'published' AND LOWER(s.country) = LOWER(%s)
                ORDER BY s.last_updated_at DESC, s.importance_score DESC
                LIMIT 60
            """, (country,))
            all_country_stories = [serialize_story(dict(row)) for row in cursor.fetchall()]
            
            # Distribute country stories to any category that is empty or has few stories
            offset = 0
            for cat_key in ["business", "technology", "science", "health", "sport", "culture", "world", "india"]:
                if len(categories_map[cat_key]) < 4 and all_country_stories:
                    existing_ids = {s['id'] for s in categories_map[cat_key]}
                    candidates = [s for s in all_country_stories if s['id'] not in existing_ids]
                    for s in candidates[offset:offset+4]:
                        categories_map[cat_key].append(s)
                    offset = (offset + 4) % max(len(all_country_stories), 1)
        else:
            # Global edition: If a category is empty, fetch previous latest news of that category
            for cat_key in list(categories_map.keys()):
                if len(categories_map[cat_key]) < 4:
                    cursor.execute("""
                        SELECT s.*
                        FROM stories s
                        WHERE s.status = 'published' AND LOWER(s.category) = %s
                        ORDER BY s.last_updated_at DESC, s.importance_score DESC
                        LIMIT 8
                    """, (cat_key,))
                    existing_ids = {s['id'] for s in categories_map[cat_key]}
                    for fb in cursor.fetchall():
                        if fb['id'] not in existing_ids:
                            categories_map[cat_key].append(serialize_story(dict(fb)))
                            existing_ids.add(fb['id'])
                
        return {"categories": categories_map}

@router.get("/dates")
def get_available_story_dates():
    """Returns all distinct dates containing published news for archive browsing."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DATE(last_updated_at)::text as date_str, COUNT(*) as story_count
            FROM stories
            WHERE status = 'published'
            GROUP BY date_str
            ORDER BY date_str DESC
            LIMIT 30
        """)
        rows = cursor.fetchall()
        return {"dates": [dict(r) for r in rows]}

@router.get("/breaking")
def get_breaking_news():
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, canonical_title, slug, category, country, last_updated_at, sources_count
            FROM stories
            WHERE status = 'published'
            ORDER BY is_breaking DESC, importance_score DESC, last_updated_at DESC
            LIMIT 6
        """)
        rows = cursor.fetchall()
        return {"breaking": [serialize_story(dict(r)) for r in rows]}

@router.get("/hero")
def get_hero_story(category: Optional[str] = None):
    with db_session() as conn:
        cursor = conn.cursor()
        
        query = """
            SELECT s.*,
                (SELECT COUNT(*) FROM articles a WHERE a.story_id = s.id) as actual_sources_count,
                (SELECT COALESCE(json_agg(DISTINCT src.name), '[]'::json) 
                 FROM articles a JOIN sources src ON a.source_id = src.id 
                 WHERE a.story_id = s.id) as sources_list
            FROM stories s
            WHERE s.status = 'published' AND s.hero_image IS NOT NULL AND s.hero_image != ''
        """
        params = []
        if category and category.lower() != 'all':
            query += " AND LOWER(s.category) = LOWER(%s)"
            params.append(category)
            
        query += " ORDER BY s.last_updated_at DESC, s.is_live DESC, s.importance_score DESC LIMIT 1"
        
        cursor.execute(query, params)
        row = cursor.fetchone()
        
        if not row:
            cursor.execute("SELECT * FROM stories WHERE status = 'published' ORDER BY last_updated_at DESC LIMIT 1")
            row = cursor.fetchone()
            
        if not row:
            return {"hero": None}
            
        return {"hero": serialize_story(dict(row))}

@router.get("/detail/{identifier:path}")
def get_story_detail(identifier: str):
    with db_session() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM stories 
            WHERE id = %s OR slug = %s
            LIMIT 1
        """, (identifier, identifier))
        story = cursor.fetchone()
        
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
            
        story_dict = serialize_story(dict(story))
        
        cursor.execute("""
            SELECT a.id, a.title, a.url, a.published_at, a.image_url, 
                   a.authors, a.content_text, a.summary as original_summary, s.name as source_name, 
                   s.logo_url as source_logo, s.country as source_country, s.base_url
            FROM articles a
            JOIN sources s ON a.source_id = s.id
            WHERE a.story_id = %s
            ORDER BY a.published_at DESC
        """, (story_dict['id'],))
        
        raw_articles = cursor.fetchall()
        articles = []
        for art in raw_articles:
            a = dict(art)
            if isinstance(a.get('published_at'), datetime):
                a['published_at'] = a['published_at'].isoformat()
            if isinstance(a.get('authors'), str):
                import json
                try:
                    a['authors'] = json.loads(a['authors'])
                except Exception:
                    a['authors'] = [a['authors']]
            articles.append(a)
        
        cursor.execute("""
            SELECT id, canonical_title, slug, category, hero_image, sources_count, last_updated_at
            FROM stories
            WHERE category = %s AND id != %s AND status = 'published'
            ORDER BY importance_score DESC, last_updated_at DESC
            LIMIT 4
        """, (story_dict['category'], story_dict['id']))
        
        related = [serialize_story(dict(r)) for r in cursor.fetchall()]
        
        return {
            "story": story_dict,
            "articles": articles,
            "related": related
        }
