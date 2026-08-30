import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.ingestion.fetcher import IngestionPipeline
from app.seo.sitemaps import SEOGenerator

from app.api.stories import router as stories_router
from app.api.sources import router as sources_router
from app.api.auth import router as auth_router
from app.api.bookmarks import router as bookmarks_router
from app.api.admin import router as admin_router
from app.api.newsletter import router as newsletter_router

# Background periodic scheduler for feed ingestion
async def periodic_ingestion_task():
    while True:
        try:
            print("[Scheduler] Starting automatic feed ingestion cycle...")
            result = await IngestionPipeline.run_ingestion_cycle()
            print(f"[Scheduler] Cycle completed: {result}")
        except Exception as e:
            print(f"[Scheduler] Ingestion error: {e}")
        # Sleep for configured interval
        await asyncio.sleep(settings.FETCH_INTERVAL_MINUTES * 60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Init database & sync sources
    print("[Startup] Initializing Database & Sources Registry...")
    init_db()
    IngestionPipeline.sync_source_registry()
    
    # Run an initial quick ingestion in background
    asyncio.create_task(IngestionPipeline.run_ingestion_cycle())
    
    # Start periodic scheduler
    scheduler_task = asyncio.create_task(periodic_ingestion_task())
    
    yield
    
    # Shutdown
    scheduler_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="World News Aggregation, 5-Tier Deduplication, Semantic Clustering, and Publishing Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(stories_router, prefix=settings.API_PREFIX)
app.include_router(sources_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(bookmarks_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(newsletter_router, prefix=settings.API_PREFIX)

# SEO & Google News Sitemaps Endpoints
@app.get("/news-sitemap.xml", tags=["SEO"])
def get_news_sitemap():
    xml_content = SEOGenerator.generate_google_news_sitemap()
    return Response(content=xml_content, media_type="application/xml")

@app.get("/sitemap.xml", tags=["SEO"])
def get_standard_sitemap():
    xml_content = SEOGenerator.generate_standard_sitemap()
    return Response(content=xml_content, media_type="application/xml")

@app.get("/robots.txt", tags=["SEO"])
def get_robots_txt():
    txt_content = SEOGenerator.generate_robots_txt()
    return Response(content=txt_content, media_type="text/plain")

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
