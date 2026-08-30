# World News Aggregator & Intelligence Platform (BBC Editorial Style)

An enterprise-grade multi-source world news aggregator and intelligence platform built with **FastAPI**, **Neon PostgreSQL**, and **React (Vite)**. The platform automatically fetches, clusters, deduplicates, and synthesizes world news from 29+ international and regional sources in real-time.

---

## 🌟 Key Features

1. **Multi-Source Ingestion & 5-Tier Deduplication**:
   - Ingests feeds from BBC, Reuters, The Guardian, NDTV, Times of India, Indian Express, TechCrunch, The Verge, FT, ESPN, etc.
   - 5-Tier clustering engine: Normalized URL hash, Jaccard token similarity, named entity overlap, and temporal window clustering.
   - Prevents plagiarism and recasting issues with original multi-source attribution.

2. **BBC News Inspired Editorial Grid**:
   - Top Header with BBC 3-box logo and sticky navigation.
   - Ultra-smooth continuous infinite horizontal breaking news marquee ticker.
   - Large hero poster carousel with 100%–0% bottom dark gradient overlay, top-left floating `LIVE` badge, smooth horizontal sliding, and slow slide-up typography.
   - Scrollable "Top Developments" right sidebar.
   - Integrated search bar in category navigation with floating top-layer letterwise autocomplete suggestions.

3. **Neon PostgreSQL Database**:
   - Multi-tenant relational schema: `sources`, `stories`, `articles`, `users`, `bookmarks`, `newsletter_subscribers`, `ingestion_logs`.
   - `psycopg2.pool.ThreadedConnectionPool` for ultra-fast query execution.

4. **Authentication & Admin Control Room**:
   - Single unified login with role-based redirection (`user` vs `admin`).
   - Admin Control Room for monitoring feed health, source triggers, duplicate stats, and cluster inspectors.

5. **SEO & Sitemaps**:
   - Automated Google News XML Sitemap (`/news-sitemap.xml`) updated for last 48-hour publications.
   - Standard XML Sitemap (`/sitemap.xml`) and `robots.txt`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (e.g. Neon PostgreSQL)

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and secret keys
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.
