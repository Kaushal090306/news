import re
import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Tuple
from rapidfuzz import fuzz
from app.ingestion.parsers import normalize_title, hash_string

def slugify(text: str) -> str:
    """Creates an SEO-friendly URL slug."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    return text[:90]

def compute_tfidf_vector(text: str, vocabulary: Dict[str, int]) -> Dict[str, float]:
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    if not words:
        return {}
    tf = {}
    for w in words:
        tf[w] = tf.get(w, 0) + 1
    total = len(words)
    vec = {}
    for w, count in tf.items():
        # simple log TF
        vec[w] = (count / total) * math.log(1 + 1000 / (vocabulary.get(w, 1) + 1))
    # normalize
    norm = math.sqrt(sum(v * v for v in vec.values()))
    if norm > 0:
        return {k: v / norm for k, v in vec.items()}
    return vec

def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    common_keys = set(vec1.keys()) & set(vec2.keys())
    return sum(vec1[k] * vec2[k] for k in common_keys)

class ClusteringEngine:
    """
    5-Tier Deduplication & Story Clustering Engine
    Ensures that 25-30 different sources reporting on the same event collapse into 1 rich Story.
    """
    
    @staticmethod
    def match_article_to_story(
        article_title: str,
        article_content: str,
        article_entities: dict,
        article_pub_time: str,
        active_stories: List[dict]
    ) -> Optional[Tuple[str, str, float]]:
        """
        Attempts to match an incoming article against active stories in the last 72 hours.
        Returns (story_id, match_reason, confidence) or None.
        """
        norm_title = normalize_title(article_title)
        title_hash = hash_string(norm_title)
        
        try:
            art_dt = datetime.fromisoformat(article_pub_time.replace('Z', '+00:00'))
        except Exception:
            art_dt = datetime.now(timezone.utc)
            
        for story in active_stories:
            story_id = story['id']
            story_norm_title = normalize_title(story['canonical_title'])
            
            # Check time window (within 72 hours)
            try:
                story_dt = datetime.fromisoformat(story['first_published_at'].replace('Z', '+00:00'))
                time_diff = abs((art_dt - story_dt).total_seconds())
                if time_diff > 72 * 3600:
                    continue # outside story event window
            except Exception:
                pass

            # Level 2: Exact Normalized Title Match
            if story_norm_title == norm_title or story.get('cluster_hash') == title_hash:
                return story_id, "Exact Title Match", 1.0

            # Level 3: Fuzzy Title Similarity (RapidFuzz Token Sort & Token Set)
            ratio = fuzz.token_set_ratio(norm_title, story_norm_title) / 100.0
            partial_ratio = fuzz.partial_ratio(norm_title, story_norm_title) / 100.0
            
            if ratio >= 0.82 or (ratio >= 0.74 and partial_ratio >= 0.88):
                return story_id, f"Fuzzy Title Match ({int(ratio*100)}%)", ratio

            # Level 4: Semantic Content & Vocabulary Overlap
            combined_story_text = f"{story['canonical_title']} {story.get('summary', '')}"
            combined_art_text = f"{article_title} {article_content[:300]}"
            
            # Level 5: Named Entity Overlap
            story_entities = story.get('entities', {})
            if isinstance(story_entities, str):
                import json
                try:
                    story_entities = json.loads(story_entities)
                except Exception:
                    story_entities = {}
                    
            common_persons = set(article_entities.get('persons', [])) & set(story_entities.get('persons', []))
            common_locations = set(article_entities.get('locations', [])) & set(story_entities.get('locations', []))
            common_orgs = set(article_entities.get('orgs', [])) & set(story_entities.get('orgs', []))
            
            total_entity_overlap = len(common_persons) + len(common_locations) + len(common_orgs)
            
            # If significant fuzzy match (>= 0.65) AND high entity overlap
            if ratio >= 0.65 and total_entity_overlap >= 2:
                return story_id, f"Semantic & Entity Match (Overlap: {total_entity_overlap})", 0.85
                
            # If high entity overlap on specific key persons/locations with decent token similarity
            if (len(common_persons) >= 1 or len(common_locations) >= 1) and ratio >= 0.70:
                return story_id, f"Entity-Anchored Topic Match", 0.78
                
        return None

    @staticmethod
    def calculate_importance_score(sources_count: int, is_breaking: bool, category: str) -> int:
        """Computes dynamic importance score (0-100) based on source breadth & category."""
        base_score = 40
        # More independent sources = higher priority
        source_bonus = min(sources_count * 12, 45)
        breaking_bonus = 20 if is_breaking else 0
        cat_bonus = 5 if category in ["World", "India", "Technology"] else 0
        
        return min(base_score + source_bonus + breaking_bonus + cat_bonus, 98)
