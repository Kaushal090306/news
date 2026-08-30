import json
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor, execute_values
from contextlib import contextmanager
from typing import Generator
import bcrypt
from app.config import settings

def hash_pwd(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')

def verify_pwd(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8')[:72], hashed.encode('utf-8'))
    except Exception:
        return False

# Global connection pool for blazing fast connection reuse
_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=15,
            dsn=settings.DATABASE_URL
        )
    return _pool

def get_db_connection():
    pool = get_pool()
    conn = pool.getconn()
    conn.cursor_factory = RealDictCursor
    return conn

@contextmanager
def db_session() -> Generator[psycopg2.extensions.connection, None, None]:
    pool = get_pool()
    conn = pool.getconn()
    conn.cursor_factory = RealDictCursor
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)

def init_db():
    """Initializes PostgreSQL tables, indexes, and seeds the default admin account."""
    with db_session() as conn:
        cursor = conn.cursor()
        
        # Sources table (25-30 global sources)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL, -- 'RSS', 'API', 'SCRAPER'
            base_url TEXT NOT NULL,
            feed_url TEXT NOT NULL,
            api_key TEXT DEFAULT '',
            country VARCHAR(100) DEFAULT 'Global',
            language VARCHAR(20) DEFAULT 'en',
            category VARCHAR(100) DEFAULT 'World',
            fetch_interval INTEGER DEFAULT 15,
            rate_limit INTEGER DEFAULT 100,
            active INTEGER DEFAULT 1,
            last_fetch_at TIMESTAMPTZ,
            status VARCHAR(50) DEFAULT 'healthy', -- 'healthy', 'slow', 'failed'
            error_count INTEGER DEFAULT 0,
            last_error TEXT,
            total_articles INTEGER DEFAULT 0,
            logo_url TEXT
        );
        """)

        # Clustered / Canonical Stories (1 Story -> Multiple Articles)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS stories (
            id VARCHAR(100) PRIMARY KEY,
            canonical_title TEXT NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            summary TEXT NOT NULL,
            ai_takeaways TEXT DEFAULT '[]',
            ai_what_happened TEXT,
            ai_why_it_matters TEXT,
            category VARCHAR(100) DEFAULT 'World',
            country VARCHAR(100) DEFAULT 'Global',
            is_live INTEGER DEFAULT 0,
            is_breaking INTEGER DEFAULT 0,
            importance_score INTEGER DEFAULT 50,
            hero_image TEXT,
            first_published_at TIMESTAMPTZ NOT NULL,
            last_updated_at TIMESTAMPTZ NOT NULL,
            sources_count INTEGER DEFAULT 1,
            cluster_hash VARCHAR(100),
            status VARCHAR(50) DEFAULT 'published' -- 'published', 'pending', 'rejected'
        );
        """)

        # Raw Articles from ingested sources
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id VARCHAR(100) PRIMARY KEY,
            source_id VARCHAR(100) REFERENCES sources(id) ON DELETE CASCADE,
            url TEXT UNIQUE NOT NULL,
            url_hash VARCHAR(100) NOT NULL,
            title TEXT NOT NULL,
            normalized_title TEXT NOT NULL,
            authors TEXT DEFAULT '[]',
            published_at TIMESTAMPTZ NOT NULL,
            fetched_at TIMESTAMPTZ NOT NULL,
            content_text TEXT NOT NULL,
            raw_html TEXT,
            summary TEXT,
            category VARCHAR(100) DEFAULT 'World',
            tags TEXT DEFAULT '[]',
            entities TEXT DEFAULT '{"persons":[],"orgs":[],"locations":[]}',
            image_url TEXT,
            canonical_url TEXT,
            story_id VARCHAR(100) REFERENCES stories(id) ON DELETE SET NULL
        );
        """)

        # Users table for Auth & Roles
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(100) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
            preferences TEXT DEFAULT '{"categories":["World","Technology","Business"],"countries":["Global"]}',
            created_at TIMESTAMPTZ NOT NULL,
            last_login TIMESTAMPTZ
        );
        """)

        # Bookmarks
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id VARCHAR(100) PRIMARY KEY,
            user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
            story_id VARCHAR(100) REFERENCES stories(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL,
            UNIQUE(user_id, story_id)
        );
        """)

        # Newsletter Subscribers & Dispatches
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id VARCHAR(100) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            frequency VARCHAR(50) DEFAULT 'daily',
            subscribed_at TIMESTAMPTZ NOT NULL,
            is_active INTEGER DEFAULT 1
        );
        """)

        # Ingestion Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_logs (
            id SERIAL PRIMARY KEY,
            source_id VARCHAR(100) REFERENCES sources(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL,
            articles_found INTEGER DEFAULT 0,
            articles_added INTEGER DEFAULT 0,
            duplicates_found INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            error_message TEXT,
            created_at TIMESTAMPTZ NOT NULL
        );
        """)

        # Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON articles(url_hash);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_story_id ON articles(story_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(published_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stories_date ON stories(last_updated_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stories_slug ON stories(slug);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);")

        # Seed default Admin User if not exists
        admin_email = settings.ADMIN_EMAIL.lower()
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        if not cursor.fetchone():
            import uuid
            from datetime import datetime, timezone
            admin_id = str(uuid.uuid4())
            admin_pwd_hash = hash_pwd(settings.ADMIN_PASSWORD)
            now_dt = datetime.now(timezone.utc)
            cursor.execute("""
            INSERT INTO users (id, email, password_hash, full_name, role, preferences, created_at, last_login)
            VALUES (%s, %s, %s, %s, 'admin', %s, %s, %s)
            """, (
                admin_id, admin_email, admin_pwd_hash, "BBC News Administrator",
                '{"categories":["World","India","Technology","Business","Sport"],"countries":["Global"]}',
                now_dt, now_dt
            ))
            print(f"[Database] Default Admin created: {admin_email} / {settings.ADMIN_PASSWORD}")
