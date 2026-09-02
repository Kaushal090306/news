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

def upgrade_image_url_to_hd(url: str) -> str:
    """
    Transforms thumbnail or low-res news image URLs into crystal-clear Full HD / high-resolution URLs.
    Supports BBC, France24, The Guardian, NDTV, Times of India, CNN, TechCrunch, Wired, Ars Technica, etc.
    """
    if not url:
        return ""
    
    hd_url = url.strip()
    
    # 1. BBC: upgrade /standard/240/ or /news/240/ to /standard/1024/ or /standard/1280/
    if "ichef.bbci.co.uk" in hd_url:
        hd_url = re.sub(r'/(standard|ws|news|wwhp)/\d+/', r'/\1/1024/', hd_url)
        
    # 2. France 24: upgrade /w:320/ or /w:1024/ to /w:1920/
    elif "france24.com" in hd_url:
        hd_url = re.sub(r'/w:\d+/', r'/w:1920/', hd_url)
        
    # 3. NDTV: add HD resize query parameter or upscale dimensions
    elif "ndtvimg.com" in hd_url:
        if "?im=" in hd_url:
            hd_url = re.sub(r'width=\d+,height=\d+', 'width=1280,height=720', hd_url)
            hd_url = re.sub(r'width=\d+', 'width=1280', hd_url)
        else:
            hd_url = f"{hd_url}?im=Resize,width=1280"
            
    # 4. Times of India / Economic Times: upscale width and height params
    elif "toiimg.com" in hd_url or "etimg.com" in hd_url:
        if "width-" in hd_url:
            hd_url = re.sub(r'width-\d+,height-\d+', 'width-1200,height-900', hd_url)
            hd_url = re.sub(r'width-\d+', 'width-1200', hd_url)
            
    # 5. CNN: upgrade from low-res crops to super-169 (1100x619)
    elif "cnn.com" in hd_url:
        hd_url = re.sub(r'-(medium|small|large|exlarge|hp-video|story-body|t1-main|large-11)(-\d+)?\.jpg', '-super-169.jpg', hd_url)
        hd_url = hd_url.replace("medium-169", "super-169").replace("small-169", "super-169").replace("exlarge-169", "super-169")
        
    # 6. WordPress / TechCrunch / Variety / Ars Technica / The Verge: strip crop suffixes (-150x150, -300x200, etc.)
    elif any(domain in hd_url for domain in ["techcrunch.com", "variety.com", "wp.com", "arstechnica.net", "theverge.com"]):
        hd_url = re.sub(r'-\d+x\d+(\.(jpg|jpeg|png|webp|avif))', r'\1', hd_url, flags=re.IGNORECASE)

    # 7. Unsplash: ensure max HD width & crisp quality
    elif "images.unsplash.com" in hd_url:
        hd_url = re.sub(r'w=\d+', 'w=1600', hd_url)
        hd_url = re.sub(r'q=\d+', 'q=90', hd_url)

    return hd_url

def extract_image_from_feed_entry(entry) -> str:
    """Extracts highest resolution image available from feed entry enclosures, media tags, or content."""
    candidates = []

    # 1. media_content (sort and pick highest resolution/dimensions)
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if not isinstance(media, dict):
                continue
            u = media.get('url', '')
            if not u:
                continue
            width = int(media.get('width', 0)) if str(media.get('width', '')).isdigit() else 0
            height = int(media.get('height', 0)) if str(media.get('height', '')).isdigit() else 0
            score = (width * height) if (width and height) else (width or 200)
            candidates.append((score, u))

    # 2. media_thumbnail
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        thumbnails = entry.media_thumbnail if isinstance(entry.media_thumbnail, list) else [entry.media_thumbnail]
        for thumb in thumbnails:
            if not isinstance(thumb, dict):
                continue
            u = thumb.get('url', '')
            if not u:
                continue
            width = int(thumb.get('width', 0)) if str(thumb.get('width', '')).isdigit() else 0
            height = int(thumb.get('height', 0)) if str(thumb.get('height', '')).isdigit() else 0
            score = (width * height) if (width and height) else (width or 150)
            candidates.append((score, u))

    # 3. enclosures
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if not isinstance(enc, dict):
                continue
            u = enc.get('href', '')
            enc_type = enc.get('type', '').lower()
            if u and (enc_type.startswith('image/') or any(ext in u.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', '.avif'])):
                length = int(enc.get('length', 0)) if str(enc.get('length', '')).isdigit() else 0
                candidates.append((length or 100, u))

    # 4. Check HTML in content / summary / description
    contents_to_check = []
    if hasattr(entry, 'content') and entry.content:
        for c in entry.content:
            if isinstance(c, dict) and 'value' in c:
                contents_to_check.append(c['value'])
    if hasattr(entry, 'summary'):
        contents_to_check.append(entry.summary or '')
    if hasattr(entry, 'description'):
        contents_to_check.append(entry.description or '')

    for html_text in contents_to_check:
        if not html_text:
            continue
        soup = BeautifulSoup(html_text, 'html.parser')
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src and not src.endswith('.gif') and 'beacon' not in src and 'tracking' not in src and '1x1' not in src:
                w = int(img.get('width', 0)) if str(img.get('width', '')).isdigit() else 0
                h = int(img.get('height', 0)) if str(img.get('height', '')).isdigit() else 0
                candidates.append((w * h if (w and h) else (w or 50), src))

    if not candidates:
        return ""

    # Sort candidates by resolution/score descending to get the highest quality
    candidates.sort(key=lambda x: x[0], reverse=True)
    best_url = candidates[0][1]

    return upgrade_image_url_to_hd(best_url)

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
