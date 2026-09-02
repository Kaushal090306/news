import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.database import get_db_connection, hash_pwd
from app.ingestion.fetcher import IngestionPipeline
from app.ingestion.parsers import RSSParser, HTMLScraper

router = APIRouter(prefix="/admin", tags=["Admin"])

class CreateUserAdminRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""
    role: str = "user" # 'user' or 'admin'

class UpdateUserRoleRequest(BaseModel):
    role: str

class CreateSourceRequest(BaseModel):
    name: str
    url: str
    category: str = "World"
    country: str = "Global"
    language: str = "en"
    fetch_interval_minutes: int = 15
    active: int = 1

class UpdateSourceRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = None
    fetch_interval_minutes: Optional[int] = None
    active: Optional[int] = None

class TestSourceRequest(BaseModel):
    url: str


@router.get("/stats")
def get_admin_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT COUNT(*) as total_sources,
               SUM(CASE WHEN status='healthy' THEN 1 ELSE 0 END) as healthy_sources,
               SUM(CASE WHEN status='slow' THEN 1 ELSE 0 END) as slow_sources,
               SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed_sources
        FROM sources WHERE active = 1
    """)
    src_stats = dict(cursor.fetchone())
    
    cursor.execute("SELECT COUNT(*) as total_articles FROM articles")
    total_articles = cursor.fetchone()['total_articles']
    
    cursor.execute("SELECT COUNT(*) as total_stories FROM stories")
    total_stories = cursor.fetchone()['total_stories']
    
    cursor.execute("SELECT SUM(duplicates_found) as total_dups FROM ingestion_logs")
    total_dups_row = cursor.fetchone()
    total_dups = total_dups_row['total_dups'] if total_dups_row and total_dups_row['total_dups'] else 0
    
    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']
    
    cursor.execute("SELECT COUNT(*) as total_subscribers FROM newsletter_subscribers WHERE is_active = 1")
    total_subscribers = cursor.fetchone()['total_subscribers']
    
    conn.close()
    
    dup_prevention_rate = 0.0
    if (total_articles + total_dups) > 0:
        dup_prevention_rate = round((total_dups / (total_articles + total_dups)) * 100, 1)
        
    return {
        "sources": src_stats,
        "total_articles": total_articles,
        "total_stories": total_stories,
        "total_duplicates_prevented": total_dups,
        "duplicate_prevention_rate": f"{dup_prevention_rate}%",
        "total_users": total_users,
        "total_subscribers": total_subscribers
    }

@router.post("/trigger-fetch")
async def trigger_manual_fetch(background_tasks: BackgroundTasks, source_id: str = None):
    background_tasks.add_task(IngestionPipeline.run_ingestion_cycle, source_id)
    return {"status": "started", "message": "Feed ingestion cycle started in background."}

@router.post("/sources/{source_id}/toggle")
def toggle_source(source_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT active FROM sources WHERE id = %s", (source_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Source not found")
        
    new_state = 0 if row['active'] == 1 else 1
    cursor.execute("UPDATE sources SET active = %s WHERE id = %s", (new_state, source_id))
    conn.commit()
    conn.close()
    return {"status": "success", "source_id": source_id, "active": new_state}

@router.get("/logs")
def get_ingestion_logs(limit: int = 40):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT l.*, s.name as source_name 
        FROM ingestion_logs l
        JOIN sources s ON l.source_id = s.id
        ORDER BY l.created_at DESC
        LIMIT %s
    """, (limit,))
    logs = []
    for r in cursor.fetchall():
        item = dict(r)
        if isinstance(item.get('created_at'), datetime):
            item['created_at'] = item['created_at'].isoformat()
        logs.append(item)
    conn.close()
    return {"logs": logs}

@router.get("/clusters")
def get_clusters_inspector(limit: int = 25):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id, s.canonical_title, s.category, s.sources_count, s.importance_score, s.last_updated_at,
               COALESCE(json_agg(json_build_object(
                   'title', a.title,
                   'source_name', src.name,
                   'url', a.url,
                   'published_at', a.published_at
               )), '[]'::json) as contributing_articles
        FROM stories s
        LEFT JOIN articles a ON a.story_id = s.id
        LEFT JOIN sources src ON a.source_id = src.id
        GROUP BY s.id
        ORDER BY s.sources_count DESC, s.last_updated_at DESC
        LIMIT %s
    """, (limit,))
    clusters = []
    for r in cursor.fetchall():
        item = dict(r)
        if isinstance(item.get('last_updated_at'), datetime):
            item['last_updated_at'] = item['last_updated_at'].isoformat()
        clusters.append(item)
        
    conn.close()
    return {"clusters": clusters}

# =========================================================================
# USER ACCESS & ROLE MANAGEMENT ENDPOINTS
# =========================================================================

@router.get("/users")
def get_admin_users(limit: int = 100):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, role, preferences, created_at, last_login
        FROM users
        ORDER BY created_at DESC
        LIMIT %s
    """, (limit,))
    users = []
    for r in cursor.fetchall():
        u = dict(r)
        if isinstance(u.get('created_at'), datetime):
            u['created_at'] = u['created_at'].isoformat()
        if isinstance(u.get('last_login'), datetime):
            u['last_login'] = u['last_login'].isoformat()
        if isinstance(u.get('preferences'), str):
            try:
                u['preferences'] = json.loads(u['preferences'])
            except Exception:
                pass
        users.append(u)
    conn.close()
    return {"users": users}

@router.post("/users")
def create_admin_user(req: CreateUserAdminRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s", (req.email.lower(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User with this email already exists.")
        
    user_id = str(uuid.uuid4())
    hashed_password = hash_pwd(req.password)
    now_dt = datetime.now(timezone.utc)
    default_prefs = {"categories": ["World", "Technology", "Business"], "countries": ["Global"]}
    
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, full_name, role, preferences, created_at, last_login)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (user_id, req.email.lower(), hashed_password, req.full_name, req.role, json.dumps(default_prefs), now_dt, now_dt))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "User created successfully", "user_id": user_id}

@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, req: UpdateUserRoleRequest):
    if req.role not in ['admin', 'user']:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'.")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = %s WHERE id = %s", (req.role, user_id))
    conn.commit()
    conn.close()
    return {"status": "success", "user_id": user_id, "role": req.role}

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"User {user_id} deleted."}

# =========================================================================
# SOURCE & WEB SCRAPING / API CONFIGURATOR ENDPOINTS
# =========================================================================

@router.post("/sources")
def create_new_source(req: CreateSourceRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    source_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO sources (id, name, url, category, country, language, fetch_interval_minutes, active, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'healthy')
    """, (source_id, req.name, req.url, req.category, req.country, req.language, req.fetch_interval_minutes, req.active))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Source '{req.name}' added successfully", "source_id": source_id}

@router.put("/sources/{source_id}")
def update_source(source_id: str, req: UpdateSourceRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    fields = []
    params = []
    
    if req.name is not None:
        fields.append("name = %s")
        params.append(req.name)
    if req.url is not None:
        fields.append("url = %s")
        params.append(req.url)
    if req.category is not None:
        fields.append("category = %s")
        params.append(req.category)
    if req.country is not None:
        fields.append("country = %s")
        params.append(req.country)
    if req.language is not None:
        fields.append("language = %s")
        params.append(req.language)
    if req.fetch_interval_minutes is not None:
        fields.append("fetch_interval_minutes = %s")
        params.append(req.fetch_interval_minutes)
    if req.active is not None:
        fields.append("active = %s")
        params.append(req.active)
        
    if not fields:
        conn.close()
        return {"status": "unchanged"}
        
    params.append(source_id)
    cursor.execute(f"UPDATE sources SET {', '.join(fields)} WHERE id = %s", params)
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Source updated successfully"}

@router.delete("/sources/{source_id}")
def delete_source(source_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sources WHERE id = %s", (source_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Source {source_id} deleted."}

@router.post("/sources/test")
def test_source_feed(req: TestSourceRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL required")
    try:
        import feedparser
        d = feedparser.parse(req.url)
        if d.entries and len(d.entries) > 0:
            sample = d.entries[0]
            return {
                "type": "rss_feed",
                "valid": True,
                "title": d.feed.get('title', 'Unknown Feed'),
                "entries_found": len(d.entries),
                "sample_article_title": sample.get('title', 'Untitled'),
                "sample_article_link": sample.get('link', '')
            }
        else:
            return {
                "type": "web_page",
                "valid": True,
                "message": "Direct HTML Web Scraper compatible",
                "entries_found": 0
            }
    except Exception as e:
        return {"valid": False, "error": str(e)}

