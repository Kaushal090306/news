import re
import hashlib
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import feedparser

def normalize_url(url: str) -> str:
    """Strip marketing query parameters (utm_*, fbclid, ref, etc.) for clean canonical hashing."""
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        query_params = parse_qs(parsed.query)
        # Drop tracking parameters
        clean_params = {
            k: v for k, v in query_params.items()
            if not k.lower().startswith(('utm_', 'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'))
        }
        clean_query = urlencode(clean_params, doseq=True)
        # Remove trailing slashes and default ports
        path = parsed.path.rstrip('/')
        clean_url = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            path,
            parsed.params,
            clean_query,
            '' # drop fragments
        ))
        return clean_url
    except Exception:
        return url.strip()

def hash_string(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def normalize_title(title: str) -> str:
    """Lowercases, removes punctuation, symbols, and extra whitespace for exact & fuzzy title match."""
    if not title:
        return ""
    # Strip common publication suffixes (e.g. "- BBC News", "| The Guardian", "- NDTV")
    clean = re.sub(r'(\s*[-|–—]\s*(BBC News|The Guardian|NDTV|Reuters|CNN|The Hindu|Times of India|TechCrunch|The Verge|Forbes|CNBC|Bloomberg)).*$', '', title, flags=re.IGNORECASE)
    # Remove punctuation
    clean = re.sub(r'[^\w\s]', ' ', clean.lower())
    # Remove extra spaces
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def clean_html_to_text(html_content: str) -> str:
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, 'html.parser')
    for elem in soup(['script', 'style', 'noscript', 'header', 'footer', 'nav', 'form', 'aside']):
        elem.extract()
    text = soup.get_text(separator=' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_image_from_feed_entry(entry) -> str:
    """Extracts best available image from feed entry enclosures, media tags, or content."""
    # 1. Check media_content
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if 'url' in media and (media.get('medium') == 'image' or any(ext in media['url'].lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', '.avif'])):
                return media['url']
                
    # 2. Check media_thumbnail
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        if isinstance(entry.media_thumbnail, list) and len(entry.media_thumbnail) > 0:
            return entry.media_thumbnail[0].get('url', '')
            
    # 3. Check enclosures
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get('type', '').startswith('image/') or any(ext in enc.get('href', '').lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                return enc.get('href', '')
                
    # 4. Check HTML in description or summary
    summary_html = getattr(entry, 'summary', '') or getattr(entry, 'description', '')
    if summary_html:
        soup = BeautifulSoup(summary_html, 'html.parser')
        img = soup.find('img')
        if img and img.get('src'):
            src = img['src']
            if not src.endswith('.gif') and 'beacon' not in src and 'tracking' not in src:
                return src
                
    return ""

def parse_published_date(entry) -> str:
    """Parse publication date to ISO 8601 string."""
    if hasattr(entry, 'published_parsed') and entry.published_parsed:
        try:
            dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            pass
    if hasattr(entry, 'updated_parsed') and entry.updated_parsed:
        try:
            dt = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            pass
    return datetime.now(timezone.utc).isoformat()

def extract_entities_and_topics(title: str, content: str) -> dict:
    """Lightweight rule-based and regex NER for organizations, places, and people."""
    combined = f"{title} {content}"
    
    # Common global locations & countries
    countries = ["US", "USA", "UK", "Britain", "India", "China", "Ukraine", "Russia", "Israel", "Gaza", 
                 "Japan", "Germany", "France", "Canada", "Australia", "Iran", "Taiwan", "Nepal", "Tibet",
                 "London", "Washington", "New Delhi", "Beijing", "Kyiv", "Moscow", "Tokyo", "Paris", "Berlin"]
    
    # Common top organizations
    orgs = ["BBC", "UN", "United Nations", "NATO", "EU", "European Union", "NASA", "ISRO", "WHO", 
            "Apple", "Google", "Microsoft", "OpenAI", "Meta", "Tesla", "Nvidia", "SpaceX", "Amazon", 
            "Federal Reserve", "RBI", "White House", "Kremlin", "Pentagon", "Supreme Court"]
    
    # Prominent figures regex / list
    persons_keywords = ["Biden", "Trump", "Harris", "Modi", "Xi Jinping", "Putin", "Zelensky", "Starmer",
                        "Sunak", "Elon Musk", "Sam Altman", "Jensen Huang", "Tim Cook", "Sundar Pichai", 
                        "Netanyahu", "Macron", "Scholz", "Dolly Parton", "Pope Francis"]
    
    found_locations = [loc for loc in countries if re.search(r'\b' + re.escape(loc) + r'\b', combined, re.IGNORECASE)]
    found_orgs = [org for org in orgs if re.search(r'\b' + re.escape(org) + r'\b', combined, re.IGNORECASE)]
    found_persons = [p for p in persons_keywords if re.search(r'\b' + re.escape(p) + r'\b', combined, re.IGNORECASE)]
    
    return {
        "persons": list(set(found_persons)),
        "orgs": list(set(found_orgs)),
        "locations": list(set(found_locations))
    }
