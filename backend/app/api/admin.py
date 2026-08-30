from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.database import get_db_connection
from app.ingestion.fetcher import IngestionPipeline

router = APIRouter(prefix="/admin", tags=["Admin"])

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
