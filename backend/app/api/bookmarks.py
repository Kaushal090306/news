import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.api.auth import get_current_user_optional

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])

@router.get("")
def get_user_bookmarks(current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to view bookmarks.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id as bookmark_id, b.created_at as bookmarked_at,
               s.id, s.canonical_title, s.slug, s.summary, s.category, s.country,
               s.hero_image, s.last_updated_at, s.sources_count
        FROM bookmarks b
        JOIN stories s ON b.story_id = s.id
        WHERE b.user_id = %s
        ORDER BY b.created_at DESC
    """, (current_user['id'],))
    bookmarks = []
    for r in cursor.fetchall():
        b = dict(r)
        for dkey in ['bookmarked_at', 'last_updated_at']:
            if isinstance(b.get(dkey), datetime):
                b[dkey] = b[dkey].isoformat()
        bookmarks.append(b)
    conn.close()
    return {"bookmarks": bookmarks}

@router.post("/{story_id}/toggle")
def toggle_bookmark(story_id: str, current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM bookmarks WHERE user_id = %s AND story_id = %s", (current_user['id'], story_id))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("DELETE FROM bookmarks WHERE id = %s", (existing['id'],))
        bookmarked = False
    else:
        now_dt = datetime.now(timezone.utc)
        cursor.execute("""
            INSERT INTO bookmarks (id, user_id, story_id, created_at)
            VALUES (%s, %s, %s, %s)
        """, (str(uuid.uuid4()), current_user['id'], story_id, now_dt))
        bookmarked = True
        
    conn.commit()
    conn.close()
    return {"status": "success", "bookmarked": bookmarked}
