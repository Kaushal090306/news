import uuid
import json
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from app.config import settings
from app.database import get_db_connection, hash_pwd, verify_pwd

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""
    preferences: dict = {"categories": ["World", "Technology", "Business"], "countries": ["Global"]}

class LoginRequest(BaseModel):
    email: str
    password: str

class PreferencesRequest(BaseModel):
    categories: list[str]
    countries: list[str]

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user_optional(authorization: str = Header(None)) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, role, preferences FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        user = dict(row)
        user['preferences'] = json.loads(user['preferences']) if isinstance(user['preferences'], str) else user['preferences']
        return user
    except Exception:
        return None

@router.post("/signup")
def signup(req: SignupRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = %s", (req.email.lower(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    user_id = str(uuid.uuid4())
    hashed_password = hash_pwd(req.password)
    now_dt = datetime.now(timezone.utc)
    
    cursor.execute("""
    INSERT INTO users (id, email, password_hash, full_name, role, preferences, created_at, last_login)
    VALUES (%s, %s, %s, %s, 'user', %s, %s, %s)
    """, (user_id, req.email.lower(), hashed_password, req.full_name, json.dumps(req.preferences), now_dt, now_dt))
    conn.commit()
    conn.close()
    
    token = create_access_token({"sub": user_id, "email": req.email.lower(), "role": "user"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": req.email.lower(),
            "full_name": req.full_name,
            "role": "user",
            "preferences": req.preferences
        }
    }

@router.post("/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = %s", (req.email.lower(),))
    row = cursor.fetchone()
    if not row or not verify_pwd(req.password, row['password_hash']):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    user = dict(row)
    now_dt = datetime.now(timezone.utc)
    cursor.execute("UPDATE users SET last_login = %s WHERE id = %s", (now_dt, user['id']))
    conn.commit()
    conn.close()
    
    token = create_access_token({"sub": user['id'], "email": user['email'], "role": user['role']})
    preferences = json.loads(user['preferences']) if isinstance(user['preferences'], str) else user['preferences']
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'], # 'admin' or 'user'
            "preferences": preferences
        }
    }

class GoogleLoginRequest(BaseModel):
    email: str
    full_name: str = ""
    avatar_url: str = ""
    google_id: str = ""
    credential: str = ""

@router.post("/google")
def google_auth(req: GoogleLoginRequest):
    if not req.email:
        raise HTTPException(status_code=400, detail="Google authentication failed: email required.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = %s", (req.email.lower(),))
    row = cursor.fetchone()
    now_dt = datetime.now(timezone.utc)
    
    if row:
        user = dict(row)
        cursor.execute("UPDATE users SET last_login = %s WHERE id = %s", (now_dt, user['id']))
        conn.commit()
    else:
        user_id = str(uuid.uuid4())
        default_prefs = {"categories": ["World", "Technology", "Business"], "countries": ["Global"]}
        cursor.execute("""
        INSERT INTO users (id, email, password_hash, full_name, role, preferences, created_at, last_login)
        VALUES (%s, %s, %s, %s, 'user', %s, %s, %s)
        """, (user_id, req.email.lower(), "oauth_google", req.full_name or req.email.split('@')[0], json.dumps(default_prefs), now_dt, now_dt))
        conn.commit()
        
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = dict(cursor.fetchone())
        
    conn.close()
    
    token = create_access_token({"sub": user['id'], "email": user['email'], "role": user['role']})
    preferences = json.loads(user['preferences']) if isinstance(user['preferences'], str) else user['preferences']
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'],
            "preferences": preferences
        }
    }

@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return {"user": current_user}

class UpdateProfileRequest(BaseModel):
    full_name: str
    preferred_country: str = "Global"
    preferred_categories: list[str] = ["World", "Technology", "Business"]

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    prefs = current_user.get('preferences', {}) or {}
    prefs['categories'] = req.preferred_categories
    prefs['countries'] = [req.preferred_country]
    
    cursor.execute("""
        UPDATE users 
        SET full_name = %s, preferences = %s 
        WHERE id = %s
    """, (req.full_name, json.dumps(prefs), current_user['id']))
    
    conn.commit()
    conn.close()
    
    updated_user = {
        "id": current_user['id'],
        "email": current_user['email'],
        "full_name": req.full_name,
        "role": current_user['role'],
        "preferences": prefs
    }
    return {"status": "success", "user": updated_user}

class UpdateNotificationsRequest(BaseModel):
    email_notifications_enabled: bool = True
    daily_digest: bool = True
    breaking_alerts: bool = True
    weekly_roundup: bool = False
    digest_frequency: str = "daily"  # 'daily', 'twice_daily', 'weekly'
    digest_time: str = "08:00"
    subscribed_categories: list[str] = ["World", "Technology", "Business", "Science", "Health", "Sport"]
    notification_email: str = ""

@router.get("/notifications")
def get_notifications(current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    
    prefs = current_user.get('preferences', {}) or {}
    notifications = prefs.get('notifications', {
        "email_notifications_enabled": True,
        "daily_digest": True,
        "breaking_alerts": True,
        "weekly_roundup": False,
        "digest_frequency": "daily",
        "digest_time": "08:00",
        "subscribed_categories": ["World", "Technology", "Business", "Science", "Health", "Sport"],
        "notification_email": current_user['email']
    })
    return {"status": "success", "notifications": notifications}

@router.put("/notifications")
def update_notifications(req: UpdateNotificationsRequest, current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    prefs = current_user.get('preferences', {}) or {}
    prefs['notifications'] = req.dict()
    
    cursor.execute("""
        UPDATE users 
        SET preferences = %s 
        WHERE id = %s
    """, (json.dumps(prefs), current_user['id']))
    
    # Also sync with newsletter subscription table
    try:
        if req.email_notifications_enabled:
            cursor.execute("""
                INSERT INTO newsletter_subscribers (email, frequency, subscribed_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (email) DO UPDATE SET frequency = EXCLUDED.frequency, active = 1
            """, (req.notification_email or current_user['email'], req.digest_frequency, datetime.now(timezone.utc)))
        else:
            cursor.execute("UPDATE newsletter_subscribers SET active = 0 WHERE email = %s", (current_user['email'],))
    except Exception:
        pass
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "notifications": req.dict()}

@router.put("/preferences")
def update_preferences(req: PreferencesRequest, current_user: dict = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET preferences = %s WHERE id = %s", (json.dumps(req.dict()), current_user['id']))
    conn.commit()
    conn.close()
    return {"status": "success", "preferences": req.dict()}
