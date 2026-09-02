import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "World News Aggregator & Intelligence Platform"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-news-ai-key-2026-bbc-style")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 15 # 15 days stay logged in
    
    # Neon PostgreSQL URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_GCcqhj13nowL@ep-crimson-rice-b36mvkba.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    )
    
    FETCH_INTERVAL_MINUTES: int = int(os.getenv("FETCH_INTERVAL_MINUTES", "10"))
    USER_AGENT: str = "WorldNewsAggregatorBot/1.0 (+https://worldnews.ai/bot; bot@worldnews.ai)"
    
    # News APIs
    NEWSAPI_KEY: str = os.getenv("NEWSAPI_KEY", "")
    GNEWS_KEY: str = os.getenv("GNEWS_KEY", "")
    GUARDIAN_API_KEY: str = os.getenv("GUARDIAN_API_KEY", "")
    MEDIASTACK_KEY: str = os.getenv("MEDIASTACK_KEY", "")
    
    # Admin Credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@bbcnews.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123456")

settings = Settings()
