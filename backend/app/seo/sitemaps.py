import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime, timezone, timedelta
from app.database import get_db_connection

class SEOGenerator:

    @staticmethod
    def generate_google_news_sitemap(base_url: str = "https://worldnews.ai") -> str:
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=2))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT canonical_title, slug, first_published_at, category, country 
            FROM stories 
            WHERE first_published_at >= %s AND status = 'published'
            ORDER BY first_published_at DESC
            LIMIT 1000
        """, (cutoff_date,))
        recent_stories = cursor.fetchall()
        conn.close()
        
        urlset = ET.Element("urlset", {
            "xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
            "xmlns:news": "http://www.google.com/schemas/sitemap-news/0.9"
        })
        
        for story in recent_stories:
            url_elem = ET.SubElement(urlset, "url")
            
            loc = ET.SubElement(url_elem, "loc")
            loc.text = f"{base_url}/news/{story['slug']}"
            
            news_elem = ET.SubElement(url_elem, "news:news")
            
            pub_elem = ET.SubElement(news_elem, "news:publication")
            name_elem = ET.SubElement(pub_elem, "news:name")
            name_elem.text = "World News Intelligence"
            lang_elem = ET.SubElement(pub_elem, "news:language")
            lang_elem.text = "en"
            
            pub_date = ET.SubElement(news_elem, "news:publication_date")
            pub_dt = story['first_published_at']
            pub_date.text = pub_dt.isoformat() if isinstance(pub_dt, datetime) else str(pub_dt)
            
            title_elem = ET.SubElement(news_elem, "news:title")
            title_elem.text = story['canonical_title']
            
        xml_str = ET.tostring(urlset, encoding="utf-8")
        parsed = minidom.parseString(xml_str)
        return parsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")

    @staticmethod
    def generate_standard_sitemap(base_url: str = "https://worldnews.ai") -> str:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT slug, last_updated_at FROM stories WHERE status = 'published' ORDER BY last_updated_at DESC LIMIT 5000")
        all_stories = cursor.fetchall()
        conn.close()
        
        urlset = ET.Element("urlset", {"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"})
        
        categories = ["", "world", "india", "business", "technology", "sport", "science", "health", "culture", "earth"]
        for cat in categories:
            url_elem = ET.SubElement(urlset, "url")
            loc = ET.SubElement(url_elem, "loc")
            loc.text = f"{base_url}/{cat}" if cat else f"{base_url}/"
            changefreq = ET.SubElement(url_elem, "changefreq")
            changefreq.text = "always" if not cat else "hourly"
            priority = ET.SubElement(url_elem, "priority")
            priority.text = "1.0" if not cat else "0.8"

        for s in all_stories:
            url_elem = ET.SubElement(urlset, "url")
            loc = ET.SubElement(url_elem, "loc")
            loc.text = f"{base_url}/news/{s['slug']}"
            lastmod = ET.SubElement(url_elem, "lastmod")
            dt = s['last_updated_at']
            lastmod.text = dt.isoformat()[:10] if isinstance(dt, datetime) else str(dt)[:10]
            priority = ET.SubElement(url_elem, "priority")
            priority.text = "0.7"

        xml_str = ET.tostring(urlset, encoding="utf-8")
        parsed = minidom.parseString(xml_str)
        return parsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")

    @staticmethod
    def generate_robots_txt(base_url: str = "https://worldnews.ai") -> str:
        return f"""User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: {base_url}/sitemap.xml
Sitemap: {base_url}/news-sitemap.xml
"""
