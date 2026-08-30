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
    q: Optional[str] = None,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    search_term = search or q
    with db_session() as conn:
        cursor = conn.cursor()
        
        query = """
            SELECT s.*, 
                   (SELECT COUNT(*) FROM articles a WHERE a.story_id = s.id) as actual_sources_count,
                   (SELECT COALESCE(json_agg(DISTINCT src.name), '[]'::json) 
                    FROM articles a JOIN sources src ON a.source_id = src.id 
                    WHERE a.story_id = s.id) as sources_list
            FROM stories s
            WHERE s.status = 'published'
        """
        params = []
        
        if category and category.lower() != 'all':
            query += " AND LOWER(s.category) = LOWER(%s)"
            params.append(category)
            
        if country:
            query += " AND (s.country = %s OR s.country = 'Global')"
            params.append(country)
            
        if search_term:
            query += " AND (s.canonical_title ILIKE %s OR s.summary ILIKE %s)"
            term = f"%{search_term}%"
            params.extend([term, term])
            
        query += " ORDER BY s.importance_score DESC, s.last_updated_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
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
            
        query += " ORDER BY s.is_live DESC, s.importance_score DESC, s.last_updated_at DESC LIMIT 1"
        
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
            SELECT a.id, a.title, a.original_url, a.published_at, a.image_url, 
                   a.author, a.summary as original_summary, s.name as source_name, 
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
