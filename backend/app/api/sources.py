from datetime import datetime
from fastapi import APIRouter
from app.database import db_session

router = APIRouter(prefix="/sources", tags=["Sources"])

@router.get("")
def get_sources():
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, type, base_url, country, language, category,
                   fetch_interval, rate_limit, active, last_fetch_at, status,
                   error_count, last_error, total_articles, logo_url
            FROM sources
            ORDER BY active DESC, category ASC, name ASC
        """)
        sources = []
        for r in cursor.fetchall():
            s = dict(r)
            if isinstance(s.get('last_fetch_at'), datetime):
                s['last_fetch_at'] = s['last_fetch_at'].isoformat()
            sources.append(s)
        return {"sources": sources}
