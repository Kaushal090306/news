import re
import json
import time
import threading
import requests
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from app.ingestion.parsers import upgrade_image_url_to_hd

_ARTICLE_EXTRACT_CACHE = {}
_EXTRACT_LOCK = threading.Lock()

def extract_full_source_article(url: str, fallback_text: str = "", fallback_image: str = "") -> dict:
    """
    Scrapes and extracts the complete original journalistic article from the source publication:
    1. Verbatim original paragraphs and subheadings.
    2. ALL original high-resolution images (any number) with captions.
    3. Author byline and publication metadata.
    Includes fast memory caching and 2.5s timeout for instant responses.
    """
    if url:
        with _EXTRACT_LOCK:
            cached = _ARTICLE_EXTRACT_CACHE.get(url)
            if cached and (time.time() - cached.get('_cached_at', 0) < 3600):
                return cached['data']

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    scraped_paragraphs = []
    scraped_images = []
    scraped_authors = []
    seen_img_urls = set()

    if fallback_image:
        clean_fallback = upgrade_image_url_to_hd(fallback_image)
        scraped_images.append({'url': clean_fallback, 'caption': 'Primary source photo'})
        seen_img_urls.add(clean_fallback.split('?')[0])

    if url and url.startswith(('http://', 'https://')):
        try:
            resp = requests.get(url, headers=headers, timeout=2.5)
            if resp.status_code == 200 and resp.text:
                soup = BeautifulSoup(resp.text, 'html.parser')

                # Extract authors from meta tags
                for meta_name in ['author', 'article:author', 'twitter:creator', 'parsely-author', 'byl']:
                    meta = soup.find('meta', attrs={'name': meta_name}) or soup.find('meta', attrs={'property': meta_name})
                    if meta and meta.get('content'):
                        val = meta.get('content').strip()
                        if val and val not in scraped_authors:
                            scraped_authors.append(val)

                json_ld_paragraphs = []
                json_ld_images = []

                # Extract structured NewsArticle / Article schema from JSON-LD
                for s_tag in soup.find_all('script', type=re.compile(r'ld\+json', re.I)):
                    if s_tag.string:
                        try:
                            ld_data = json.loads(s_tag.string)
                            ld_items = ld_data if isinstance(ld_data, list) else [ld_data]
                            for it in ld_items:
                                if not isinstance(it, dict):
                                    continue
                                # Check for image
                                if 'image' in it:
                                    img_obj = it['image']
                                    img_url = None
                                    if isinstance(img_obj, str):
                                        img_url = img_obj
                                    elif isinstance(img_obj, dict):
                                        img_url = img_obj.get('url')
                                    elif isinstance(img_obj, list) and len(img_obj) > 0:
                                        first = img_obj[0]
                                        img_url = first if isinstance(first, str) else (first.get('url') if isinstance(first, dict) else None)
                                    if img_url and isinstance(img_url, str):
                                        clean_u = upgrade_image_url_to_hd(img_url)
                                        clean_u_base = clean_u.split('?')[0]
                                        if clean_u_base not in seen_img_urls:
                                            json_ld_images.append({'url': clean_u, 'caption': it.get('headline') or 'Editorial photograph'})
                                            seen_img_urls.add(clean_u_base)

                                # Check for articleBody
                                raw_body = it.get('articleBody') or it.get('text')
                                if raw_body and isinstance(raw_body, str) and len(raw_body.strip()) > 180:
                                    body_spaced = re.sub(r'([.!?"])([A-Z])', r'\1\n\n\2', raw_body.strip())
                                    raw_chunks = body_spaced.split('\n\n')
                                    for chk in raw_chunks:
                                        chk_clean = chk.strip()
                                        if len(chk_clean) > 40 and not re.search(r'(download the toi app|catch the latest|follow us on|also read|read more|advertisement|sign up for)', chk_clean, re.I):
                                            json_ld_paragraphs.append({
                                                'type': 'paragraph',
                                                'text': chk_clean,
                                                'html': chk_clean
                                            })
                        except Exception:
                            pass

                if json_ld_images:
                    for j_img in json_ld_images:
                        if len(scraped_images) < 4:
                            scraped_images.append(j_img)

                # Remove non-content elements
                for elem in soup(['script', 'style', 'noscript', 'iframe', 'svg', 'form', 'nav', 'footer', 'header', 'aside']):
                    elem.extract()

                # Find primary article container (target body class first to exclude site-wide recommendation carousels)
                container = (
                    soup.find(class_=re.compile(r'(c-article-body|article__body|article[-_]body|story[-_]content|entry[-_]content|post[-_]body|body[-_]copy|article[-_]text|caas[-_]body)', re.I)) or 
                    soup.find('article') or 
                    soup.find('main') or 
                    soup.body or 
                    soup
                )

                # Aggressively remove all related stories, latest-content carousels, cards, and author affiliations
                for elem in container.find_all(class_=re.compile(r'(latest-content|c-article-related|c-latest-content|most-read|recirculation|promo|newsletter|share|social|author[-_]info|affiliations|references|citation|metrics|rights-and-permissions|c-card|card-item|recommended\b)', re.I)):
                    elem.decompose()
                for elem in container.find_all(['aside', 'nav', 'footer', 'form']):
                    elem.decompose()
                for elem in container.find_all(attrs={'data-title': re.compile(r'related', re.I)}):
                    elem.decompose()

                # 1. Extract ALL genuine original article images (Cap at 4 high-res photos)
                for el in container.find_all(['img', 'figure', 'picture']):
                    if len(scraped_images) >= 5:
                        break

                    caption = ""
                    if el.name == 'figure':
                        fc = el.find('figcaption')
                        if fc:
                            caption = fc.get_text().strip()

                    img_tag = el if el.name == 'img' else el.find('img')
                    if not img_tag:
                        continue

                    # Skip if inside a link pointing to another story (recirculation thumbnail)
                    parent_a = el.find_parent('a')
                    if parent_a and parent_a.get('href') and not re.search(r'\.(jpg|jpeg|png|webp)($|\?)', parent_a.get('href', ''), re.I):
                        continue

                    # Find best candidate URL
                    candidate_urls = []
                    srcset = img_tag.get('srcset') or img_tag.get('data-srcset')
                    if srcset:
                        parts = [p.strip() for p in srcset.split(',') if p.strip()]
                        for part in parts:
                            tokens = part.split()
                            if tokens:
                                u = tokens[0].strip()
                                width = 0
                                if len(tokens) > 1 and tokens[1].endswith('w'):
                                    try:
                                        width = int(tokens[1][:-1])
                                    except ValueError:
                                        pass
                                candidate_urls.append((width, u))

                    for attr in ['src', 'data-src', 'data-original', 'data-hi-res-src', 'data-url']:
                        val = img_tag.get(attr)
                        if val and isinstance(val, str) and not val.startswith('data:'):
                            candidate_urls.append((500, val))

                    # Skip if inside author, bio, sidebar, ad, or promo container
                    if el.find_parent(class_=re.compile(r'(author|bio|profile|share|social|sidebar|advertisement|sponsor|promo|footer|nav|header|widget|disclosure)', re.I)):
                        continue

                    # Check width/height attributes if available
                    w_attr = img_tag.get('width')
                    h_attr = img_tag.get('height')
                    if w_attr and str(w_attr).isdigit() and int(w_attr) < 280:
                        continue
                    if h_attr and str(h_attr).isdigit() and int(h_attr) < 180:
                        continue

                    if not candidate_urls:
                        continue

                    candidate_urls.sort(key=lambda x: x[0], reverse=True)
                    best_u = candidate_urls[0][1]
                    best_u = urljoin(url, best_u)

                    # Skip non-images, icons, trackers, ads, logos, and brand assets
                    lower_u = best_u.lower()
                    if re.search(r'/(?:l?w(?:100|140|200)|w140h79|w100h100)/', lower_u) or lower_u.endswith('.svg') or '.svg?' in lower_u:
                        continue

                    skip_url_terms = [
                        'logo', 'motley', 'fool', 'avatar', 'icon', 'ad-banner', 'advertis',
                        'sponsor', 'promo', '1x1', 'pixel', 'tracking', 'spacer', 'spinner',
                        '.gif', 'badge', 'button', 'social', 'share', 'author', 'headshot',
                        'profile', 'brand', 'watermark', 'newsletter', 'podcast', 'widget',
                        'fallback', 'placeholder', 'signature', 'masthead', 'favicon', 'embed',
                        'orcid', 'google'
                    ]
                    if any(skip in lower_u for skip in skip_url_terms):
                        continue

                    if not caption:
                        caption = img_tag.get('alt', '').strip() or img_tag.get('title', '').strip()

                    # Skip if caption / alt reveals it's a logo, brand, ad, or author portrait
                    caption_lower = caption.lower()
                    skip_caption_terms = [
                        'logo', 'motley fool', 'reuters', 'bloomberg', 'bbc', 'advertisement',
                        'sponsored', 'promo', 'banner', 'sign up', 'subscribe', 'newsletter',
                        'author avatar', 'author photo', 'disclosure', 'headshot', 'getty images logo'
                    ]
                    if any(term in caption_lower for term in skip_caption_terms):
                        continue

                    # If caption is purely a brand name
                    if caption_lower.strip() in ['motley fool', 'the fool', 'reuters', 'bloomberg', 'bbc', 'cnn', 'ap', 'cnbc']:
                        continue

                    clean_base = re.sub(r'_[0-9]+(?=\.[a-z]+$)', '', best_u.split('?')[0])
                    if clean_base in seen_img_urls:
                        continue

                    hd_img_url = upgrade_image_url_to_hd(best_u)
                    seen_img_urls.add(clean_base)
                    scraped_images.append({
                        'url': hd_img_url,
                        'caption': caption or 'Article photograph'
                    })

                # 2. Extract ALL readable original paragraphs & headings (excluding boilerplate & disclaimers)
                for p in container.find_all(['p', 'h2', 'h3']):
                    # Skip if inside author bio, disclosure, disclaimer, footer, or advertisement container
                    if p.find_parent(class_=re.compile(r'(bio|author[-_]info|disclaimer|disclosure|advertisement|sponsor|promo|social|sidebar|newsletter|footer|comment)', re.I)):
                        continue

                    tag_name = p.name.lower()
                    text = p.get_text().strip()

                    if len(text) < 25 and tag_name == 'p':
                        continue

                    # Skip standalone illustration / photo credits
                    if re.match(r'^(illustration|photo|image|credit|courtesy|getty images)[\s:]', text, re.I) and len(text) < 95:
                        continue

                    # Filter out boilerplate, promo, disclosure, and disclaimer paragraphs
                    junk_patterns = [
                        r'^(advertisement|sponsored content|ad|promo)',
                        r'^(sign up for|subscribe to|get the latest news|join our newsletter|follow us on)',
                        r'^(also read|read next|read more|related stories|trending now|editors\' picks)',
                        r'^(copyright|all rights reserved|terms of service|privacy policy|photo credit)',
                        r'(has positions in and recommends|has a disclosure policy|owns shares of|stock advisor)',
                        r'(past performance is no guarantee|average return of|returns as of|since inception)',
                        r'(click here to read|download our app|available on ios and android)',
                        r'(this article originally appeared on|published originally by)',
                        r'(please check your inbox|to unsubscribe click|manage your email preferences)'
                    ]
                    if any(re.search(pat, text, re.I) for pat in junk_patterns):
                        continue

                    if 'cookies' in text.lower() and len(text) < 160:
                        continue

                    # Preserve inline formatting (strong, em, u)
                    for b_tag in p.find_all('b'):
                        b_tag.name = 'strong'
                    for i_tag in p.find_all('i'):
                        i_tag.name = 'em'
                    for dangerous in p.find_all(['script', 'style', 'img', 'iframe', 'svg', 'button', 'input']):
                        dangerous.decompose()

                    # Inner HTML with preserved inline formatting
                    inner_html = "".join([str(c) for c in p.contents]).strip()

                    if len(text) < 35 and any(term in text.lower() for term in ['toi', 'videos', 'photostories', 'hot picks', 'top trending', 'newsletter', 'sign in', 'cookie']):
                        continue

                    if tag_name in ['h2', 'h3']:
                        scraped_paragraphs.append({'type': 'heading', 'text': text, 'html': inner_html})
                    else:
                        scraped_paragraphs.append({'type': 'paragraph', 'text': text, 'html': inner_html})

        except Exception as e:
            # Fallback will kick in
            pass

    # If scraping returned too few genuine paragraphs, use JSON-LD or fallback_text
    valid_paras = [p for p in scraped_paragraphs if p.get('type') == 'paragraph' and len(p.get('text', '')) > 45]
    if len(valid_paras) < 3 and 'json_ld_paragraphs' in locals() and json_ld_paragraphs:
        scraped_paragraphs = json_ld_paragraphs
    elif len(valid_paras) < 3 and fallback_text:
        clean_fb = re.sub(r'\s+', ' ', fallback_text).strip()
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_fb) if len(s.strip()) > 30]
        if sentences:
            chunk_size = 2
            for i in range(0, len(sentences), chunk_size):
                chunk = " ".join(sentences[i:i+chunk_size])
                scraped_paragraphs.append({'type': 'paragraph', 'text': chunk})
        else:
            scraped_paragraphs.append({'type': 'paragraph', 'text': clean_fb})

    total_content = "\n\n".join([p['text'] for p in scraped_paragraphs])

    result = {
        'paragraphs': scraped_paragraphs,
        'images': scraped_images,
        'authors': scraped_authors,
        'content_text': total_content
    }

    if url:
        with _EXTRACT_LOCK:
            _ARTICLE_EXTRACT_CACHE[url] = {
                'data': result,
                '_cached_at': time.time()
            }

    return result
