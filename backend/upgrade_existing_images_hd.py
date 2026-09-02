from app.database import db_session
from app.ingestion.parsers import upgrade_image_url_to_hd
from psycopg2.extras import execute_batch

def run_hd_upgrade_migration():
    print("[HD Migration] Upgrading all existing articles and stories to HD...")
    
    with db_session() as conn:
        cursor = conn.cursor()
        
        # 1. Upgrade articles
        cursor.execute("SELECT id, image_url FROM articles WHERE image_url IS NOT NULL AND image_url != ''")
        articles = cursor.fetchall()
        print(f"[HD Migration] Found {len(articles)} articles with images.")
        
        article_updates = []
        for art in articles:
            old_url = art['image_url']
            new_url = upgrade_image_url_to_hd(old_url)
            if new_url and new_url != old_url:
                article_updates.append((new_url, art['id']))
                
        if article_updates:
            execute_batch(cursor, "UPDATE articles SET image_url = %s WHERE id = %s", article_updates, page_size=200)
            print(f"[HD Migration] Successfully upgraded {len(article_updates)} article image URLs to HD.")
        
        # 2. Upgrade stories
        cursor.execute("SELECT id, hero_image FROM stories WHERE hero_image IS NOT NULL AND hero_image != ''")
        stories = cursor.fetchall()
        print(f"[HD Migration] Found {len(stories)} stories with hero images.")
        
        story_updates = []
        for story in stories:
            old_url = story['hero_image']
            new_url = upgrade_image_url_to_hd(old_url)
            if new_url and new_url != old_url:
                story_updates.append((new_url, story['id']))
                
        if story_updates:
            execute_batch(cursor, "UPDATE stories SET hero_image = %s WHERE id = %s", story_updates, page_size=200)
            print(f"[HD Migration] Successfully upgraded {len(story_updates)} story hero image URLs to HD.")
            
        conn.commit()
        print("[HD Migration] Batch migration complete!")

if __name__ == '__main__':
    run_hd_upgrade_migration()
