import os
import sys
import json
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import db_session
from app.api.stories import serialize_story

def export_seed():
    print("Connecting to Neon PostgreSQL to fetch authentic seed data...")
    with db_session() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch top published stories (250 stories)
        cursor.execute("""
            SELECT * FROM stories
            WHERE status = 'published'
            ORDER BY last_updated_at DESC, importance_score DESC
            LIMIT 250
        """)
        raw_stories = cursor.fetchall()
        stories = [serialize_story(dict(r)) for r in raw_stories]
        print(f"Fetched {len(stories)} main stories.")

        # 2. Fetch top hero story
        cursor.execute("""
            SELECT * FROM stories
            WHERE status = 'published' AND hero_image IS NOT NULL AND hero_image != ''
            ORDER BY last_updated_at DESC, importance_score DESC
            LIMIT 1
        """)
        hero_row = cursor.fetchone()
        hero_story = serialize_story(dict(hero_row)) if hero_row else (stories[0] if stories else None)

        # 3. Fetch breaking stories (top 8)
        cursor.execute("""
            SELECT id, canonical_title, slug, category, country, last_updated_at, sources_count
            FROM stories
            WHERE status = 'published'
            ORDER BY is_breaking DESC, importance_score DESC, last_updated_at DESC
            LIMIT 8
        """)
        breaking_stories = [serialize_story(dict(r)) for r in cursor.fetchall()]
        print(f"Fetched {len(breaking_stories)} breaking stories.")

        # 4. Fetch category stories map
        categories = ['business', 'technology', 'science', 'health', 'sport', 'culture', 'world', 'india']
        category_stories = {}
        for cat in categories:
            cursor.execute("""
                SELECT * FROM stories
                WHERE status = 'published' AND LOWER(category) = %s
                ORDER BY last_updated_at DESC, importance_score DESC
                LIMIT 30
            """, (cat,))
            category_stories[cat] = [serialize_story(dict(r)) for r in cursor.fetchall()]
            print(f"Category '{cat}': {len(category_stories[cat])} stories.")

        # 5. Fetch available dates
        cursor.execute("""
            SELECT DATE(last_updated_at)::text as date_str, COUNT(*) as story_count
            FROM stories
            WHERE status = 'published'
            GROUP BY date_str
            ORDER BY date_str DESC
            LIMIT 30
        """)
        available_dates = [dict(r) for r in cursor.fetchall()]

        output_data = {
            "stories": stories,
            "heroStory": hero_story,
            "breakingStories": breaking_stories,
            "categoryStories": category_stories,
            "availableDates": available_dates,
            "timestamp": int(datetime.utcnow().timestamp() * 1000)
        }

        # Write to frontend/src/services/seedFeeds.json
        target_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "services", "seedFeeds.json"))
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2, default=str)

        file_size_kb = os.path.getsize(target_path) / 1024
        print(f"Successfully exported seed data to {target_path} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    export_seed()
