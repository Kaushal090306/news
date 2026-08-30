from datetime import datetime
from app.database import get_db_connection

class MailAutomation:

    @staticmethod
    def generate_daily_digest() -> dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT s.*, 
                   (SELECT COUNT(*) FROM articles a WHERE a.story_id = s.id) as real_source_count,
                   (SELECT COALESCE(json_agg(json_build_object('name', src.name, 'url', a.url)), '[]'::json) 
                    FROM articles a JOIN sources src ON a.source_id = src.id 
                    WHERE a.story_id = s.id) as source_links
            FROM stories s
            WHERE s.status = 'published'
            ORDER BY s.importance_score DESC, s.last_updated_at DESC
            LIMIT 10
        """)
        raw_stories = cursor.fetchall()
        top_stories = []
        for r in raw_stories:
            item = dict(r)
            if isinstance(item.get('last_updated_at'), datetime):
                item['last_updated_at'] = item['last_updated_at'].isoformat()
            top_stories.append(item)
        
        world_news = [s for s in top_stories if s['category'] == 'World'][:3]
        india_news = [s for s in top_stories if s['category'] == 'India'][:3]
        tech_news = [s for s in top_stories if s['category'] in ['Technology', 'Business']][:3]
        
        today_str = datetime.now().strftime("%A, %B %d, %Y")
        
        digest_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #121212; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 620px; margin: 0 auto; background: #ffffff; padding: 28px; border-top: 4px solid #B80000; border-radius: 4px; }}
                .header {{ border-bottom: 2px solid #121212; padding-bottom: 15px; margin-bottom: 25px; }}
                .logo {{ font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }}
                .date {{ font-size: 13px; color: #666; margin-top: 4px; }}
                .section-title {{ font-size: 16px; font-weight: 800; text-transform: uppercase; color: #B80000; border-bottom: 1px solid #e2e2e2; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; }}
                .story-card {{ margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px dotted #ccc; }}
                .story-title {{ font-size: 18px; font-weight: 700; color: #121212; text-decoration: none; display: block; margin-bottom: 6px; }}
                .story-title:hover {{ color: #B80000; text-decoration: underline; }}
                .story-summary {{ font-size: 14px; color: #444; margin-bottom: 8px; }}
                .story-meta {{ font-size: 12px; color: #777; }}
                .sources-tag {{ background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-weight: 600; }}
                .footer {{ text-align: center; font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #e2e2e2; padding-top: 15px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">WORLD NEWS INTELLIGENCE</div>
                    <div class="date">{today_str} • Morning Executive Briefing</div>
                </div>
        """
        
        def render_section(title, stories_list):
            if not stories_list:
                return ""
            html = f'<div class="section-title">{title}</div>'
            for st in stories_list:
                html += f"""
                <div class="story-card">
                    <a href="https://worldnews.ai/news/{st['slug']}" class="story-title">{st['canonical_title']}</a>
                    <div class="story-summary">{st['summary']}</div>
                    <div class="story-meta">
                        <span class="sources-tag">Covered by {st['sources_count']} sources</span> • Updated {st['last_updated_at'][:16].replace('T', ' ')} UTC
                    </div>
                </div>
                """
            return html

        digest_html += render_section("Top World Stories", world_news or top_stories[:3])
        digest_html += render_section("India & South Asia", india_news)
        digest_html += render_section("Technology & Business", tech_news)
        
        digest_html += """
                <div class="footer">
                    You received this email because you subscribed to World News Intelligence Daily Digest.<br>
                    <a href="https://worldnews.ai/settings/preferences" style="color: #666;">Manage Preferences</a> • 
                    <a href="https://worldnews.ai/unsubscribe" style="color: #666;">Unsubscribe</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        conn.close()
        
        return {
            "subject": f"World News Briefing: {top_stories[0]['canonical_title'] if top_stories else 'Today\'s Top Developments'}",
            "date": today_str,
            "stories_count": len(top_stories),
            "html_content": digest_html
        }
