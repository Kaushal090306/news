import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.database import get_db_connection
from app.email.mailer import MailAutomation

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])

class SubscribeRequest(BaseModel):
    email: str
    frequency: str = "daily"

@router.post("/subscribe")
def subscribe(req: SubscribeRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM newsletter_subscribers WHERE email = %s", (req.email.lower(),))
    existing = cursor.fetchone()
    
    now_dt = datetime.now(timezone.utc)
    if existing:
        cursor.execute("UPDATE newsletter_subscribers SET is_active = 1, frequency = %s WHERE email = %s", (req.frequency, req.email.lower()))
    else:
        cursor.execute("""
            INSERT INTO newsletter_subscribers (id, email, frequency, subscribed_at, is_active)
            VALUES (%s, %s, %s, %s, 1)
        """, (str(uuid.uuid4()), req.email.lower(), req.frequency, now_dt))
        
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Successfully subscribed {req.email} to the {req.frequency} digest."}

@router.get("/preview")
def preview_daily_newsletter():
    return MailAutomation.generate_daily_digest()
