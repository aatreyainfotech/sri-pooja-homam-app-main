# Build: 2026-06-14-wa-btn-fix (touch to force Azure redeploy)
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Build: 2026-06-14  (touch to force Azure redeploy)

import os
import uuid
import logging
import random
import string
import re
import json
import asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Literal

import time
import bcrypt
import jwt
import pymssql
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

from push_notify import send_expo_push, fire_and_forget_push
from agora_service import is_configured as agora_is_configured, build_rtc_token, get_app_id as get_agora_app_id
from whatsapp_service import (
    send_otp as whatsapp_send_otp,
    send_welcome as whatsapp_send_welcome,
    send_booking_confirmation as whatsapp_send_booking,
    is_configured as whatsapp_is_configured,
    test_send as whatsapp_test_send,
)

try:
    import razorpay as _razorpay
    _rzp_client = _razorpay.Client(auth=(
        os.getenv("RAZORPAY_KEY_ID", ""),
        os.getenv("RAZORPAY_KEY_SECRET", ""),
    ))
    RAZORPAY_ENABLED = bool(os.getenv("RAZORPAY_KEY_ID") and os.getenv("RAZORPAY_KEY_SECRET"))
except Exception:
    _rzp_client = None
    RAZORPAY_ENABLED = False

# ----------------------------- Config ----------------------------------------
SQL_SERVER = os.environ.get('SQL_SERVER', r'DESKTOP-JGCUNUE\SQLEXPRESS')
SQL_DATABASE = os.environ.get('SQL_DATABASE', 'SriPoojaHomam')
SQL_USERNAME = os.environ.get('SQL_USERNAME', 'sriaatreya')
SQL_PASSWORD = os.environ.get('SQL_PASSWORD', 'Aatreya@2022')
JWT_SECRET = os.environ.get('JWT_SECRET', 'sripoojahomam_jwt_secret_2026')
JWT_ALG = "HS256"
ADMIN_MOBILE = os.environ.get("ADMIN_MOBILE", "9999999999")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Super Admin")

# pymssql bundles FreeTDS — no system ODBC driver required on Azure App Service
_ODBC_DRIVER = "pymssql"  # kept for logging only

app = FastAPI(title="Sri Pooja Homam API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ----------------------------- DB Helpers ------------------------------------
def _get_conn():
    """Connect to Azure SQL with up to 3 retries — handles Serverless auto-resume (~30s)."""
    last_err = None
    for attempt in range(3):
        try:
            return pymssql.connect(
                server=SQL_SERVER,
                user=SQL_USERNAME,
                password=SQL_PASSWORD,
                database=SQL_DATABASE,
                as_dict=True,
                timeout=30,
                login_timeout=30,
            )
        except Exception as e:
            last_err = e
            logger.warning(f"DB connection attempt {attempt + 1}/3 failed: {e}")
            if attempt < 2:
                time.sleep(8)
    logger.error(f"DB connection failed after 3 attempts: {last_err}")
    raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again.")

def _normalise_row(row):
    """Convert pymssql dict row: datetimes → ISO strings, Decimals → floats."""
    if row is None:
        return None
    out = {}
    for k, v in row.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out

def _pyodbc_to_pymssql(query: str) -> str:
    """Replace ? placeholders with %s for pymssql."""
    return query.replace('?', '%s')

async def sql_fetch_one(query, params=None):
    def _run():
        conn = _get_conn()
        try:
            cur = conn.cursor()
            cur.execute(_pyodbc_to_pymssql(query), params or ())
            return _normalise_row(cur.fetchone())
        finally:
            conn.close()
    return await asyncio.to_thread(_run)

async def sql_fetch_all(query, params=None):
    def _run():
        conn = _get_conn()
        try:
            cur = conn.cursor()
            cur.execute(_pyodbc_to_pymssql(query), params or ())
            return [_normalise_row(r) for r in cur.fetchall()]
        finally:
            conn.close()
    return await asyncio.to_thread(_run)

async def sql_execute(query, params=None):
    def _run():
        conn = _get_conn()
        try:
            cur = conn.cursor()
            cur.execute(_pyodbc_to_pymssql(query), params or ())
            conn.commit()
            return cur.rowcount
        finally:
            conn.close()
    return await asyncio.to_thread(_run)

async def sql_scalar(query, params=None):
    def _run():
        conn = _get_conn()
        try:
            cur = conn.cursor()
            cur.execute(_pyodbc_to_pymssql(query), params or ())
            row = cur.fetchone()
            if row is None:
                return 0
            # row is a dict when as_dict=True
            val = list(row.values())[0] if isinstance(row, dict) else row[0]
            return float(val) if isinstance(val, Decimal) else (val or 0)
        finally:
            conn.close()
    return await asyncio.to_thread(_run)

# ----------------------------- Helpers ---------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def now_naive() -> datetime:
    """UTC now without tzinfo — safe for SQL Server DATETIME2."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

def to_iso(dt) -> str:
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, role: str, user: dict | None = None) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": now_utc() + timedelta(days=30),
        "iat": now_utc(),
    }
    if user:
        # Embed safe user fields so /auth/me can return without a DB round-trip
        payload["u"] = {
            "id": user.get("id", user_id),
            "mobile": user.get("mobile", ""),
            "full_name": user.get("full_name", ""),
            "email": user.get("email", ""),
            "address": user.get("address", ""),
            "city": user.get("city", ""),
            "pincode": user.get("pincode", ""),
            "role": user.get("role", role),
            "is_active": user.get("is_active", True),
            "verified": user.get("verified", False),
            "photo_url": user.get("photo_url"),
            "created_at": user.get("created_at"),
        }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def gen_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

def safe_parse_dt(value) -> Optional[str]:
    """Return value only if it parses as a valid ISO datetime, else None."""
    if not value:
        return None
    try:
        s = str(value).strip()
        datetime.fromisoformat(s.replace('Z', '+00:00'))
        return s
    except (ValueError, TypeError):
        return None

def clean_user(u: dict) -> dict:
    if not u:
        return u
    u.pop("password_hash", None)
    return u

# ----------------------------- Auth dep --------------------------------------
USER_COLS = ("id, mobile, role, full_name, email, address, city, pincode, "
             "is_active, verified, photo_url, created_at, "
             "ISNULL(wallet_balance, 0) AS wallet_balance, "
             "ISNULL(notify_pooja, 1) AS notify_pooja, "
             "ISNULL(notify_video, 1) AS notify_video, "
             "ISNULL(notify_live, 1) AS notify_live, "
             "ISNULL(notify_booking, 1) AS notify_booking")

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    # Fast path: use user data embedded in JWT (avoids DB hit on every request)
    embedded = payload.get("u")
    if embedded and embedded.get("id"):
        if not embedded.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        return embedded
    # Fallback: look up user in DB (old tokens without embedded data)
    user = await sql_fetch_one(
        f"SELECT {USER_COLS} FROM dbo.users WHERE id = ?", (payload["sub"],)
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account deactivated")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

async def require_poojari_or_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] not in ("super_admin", "admin", "poojari"):
        raise HTTPException(status_code=403, detail="Admin or Poojari access required")
    return user

async def require_hotel_manager_or_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] not in ("super_admin", "admin", "hotel_manager"):
        raise HTTPException(status_code=403, detail="Hotel manager or admin access required")
    return user

_optional_bearer = HTTPBearer(auto_error=False)

def _is_privileged(creds: Optional[HTTPAuthorizationCredentials]) -> bool:
    """Check JWT role without DB — returns True for admin/poojari."""
    if not creds or not creds.credentials:
        return False
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        role = (payload.get("u") or {}).get("role") or payload.get("role", "")
        return role in ("super_admin", "admin", "poojari")
    except Exception:
        return False


# ----------------------------- Push helpers ----------------------------------
async def _tokens_for_topic(topic: str) -> List[str]:
    """Return Expo push tokens for users who have the given topic enabled.
    topic: 'pooja' | 'video' | 'live' | 'booking'
    """
    col = {
        "pooja": "notify_pooja",
        "video": "notify_video",
        "live":  "notify_live",
        "booking": "notify_booking",
    }.get(topic, "notify_pooja")
    try:
        rows = await sql_fetch_all(
            f"SELECT TOP 2000 pt.token FROM dbo.push_tokens pt "
            f"LEFT JOIN dbo.users u ON u.id = pt.user_id "
            f"WHERE ISNULL(u.{col}, 1) = 1"
        )
        return [r["token"] for r in rows if r.get("token")]
    except Exception as e:
        logger.warning("topic token query failed (%s): %s", topic, e)
        # Fallback: send to all
        rows = await sql_fetch_all("SELECT TOP 2000 token FROM dbo.push_tokens")
        return [r["token"] for r in rows if r.get("token")]

# ----------------------------- Models ----------------------------------------
class RegisterIn(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    address: str
    city: str
    pincode: str
    password: str

class VerifyOtpIn(BaseModel):
    mobile: str
    otp: str

class ResendOtpIn(BaseModel):
    mobile: str

class LoginIn(BaseModel):
    mobile: str
    password: str

class TempleIn(BaseModel):
    name: str
    deity: str
    location: str
    description: str
    logo: str
    banner: str
    phone: Optional[str] = ""
    opening_hours: Optional[str] = ""

class PoojaIn(BaseModel):
    temple_id: str
    name: str
    type: Literal["pooja", "homam"]
    description: str
    price: float
    duration: str
    image: str
    scheduled_at: Optional[str] = None

class BookingIn(BaseModel):
    pooja_id: str
    devotee_name: str
    gotra: Optional[str] = ""
    nakshatra: Optional[str] = ""
    notes: Optional[str] = ""
    scheduled_at: Optional[str] = None

class VideoIn(BaseModel):
    temple_id: Optional[str] = None
    title: str
    caption: str
    video_url: str
    thumbnail: str

class LiveStreamIn(BaseModel):
    temple_id: str
    pooja_id: Optional[str] = None
    title: str
    stream_url: Optional[str] = ""
    channel_name: Optional[str] = None
    is_paid_only: bool = True
    is_live: bool = True
    provider: Optional[str] = "hls"

class UserStatusIn(BaseModel):
    is_active: bool

class PushTokenIn(BaseModel):
    token: str
    platform: Optional[str] = "expo"

class PushTokenDeleteIn(BaseModel):
    token: str

class TestPushIn(BaseModel):
    title: Optional[str] = "🙏 Test Notification"
    body: Optional[str] = "If you can read this, push is working."

class ProfilePhotoIn(BaseModel):
    photo: str

class ProfileUpdateIn(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class PaymentConfirmIn(BaseModel):
    booking_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

class AgoraTokenIn(BaseModel):
    channel_name: Optional[str] = None
    role: str = "subscriber"
    uid: Optional[int] = None

# ----------------------------- SQL OTP helpers --------------------------------
async def otp_save(mobile: str, otp: str, otp_type: str, pending_user: dict = None) -> None:
    """Upsert an OTP record into SQL — survives server restarts and multi-worker deployments."""
    expires = now_naive() + timedelta(minutes=10)
    pending_json = json.dumps(pending_user) if pending_user else None
    await sql_execute(
        "DELETE FROM dbo.otp_store WHERE mobile = ? AND otp_type = ?", (mobile, otp_type)
    )
    await sql_execute(
        "INSERT INTO dbo.otp_store (mobile, otp_type, otp_code, otp_expires, pending_data) VALUES (?, ?, ?, ?, ?)",
        (mobile, otp_type, otp, expires, pending_json)
    )


async def otp_get(mobile: str, otp_type: str):
    """Fetch OTP record. Returns dict with 'otp', 'expired', optional 'pending_user'; or None."""
    rec = await sql_fetch_one(
        "SELECT otp_code, otp_expires, pending_data FROM dbo.otp_store WHERE mobile = ? AND otp_type = ?",
        (mobile, otp_type)
    )
    if not rec:
        return None
    exp_raw = rec["otp_expires"]
    if isinstance(exp_raw, str):
        exp_dt = datetime.fromisoformat(exp_raw)
    else:
        exp_dt = exp_raw.replace(tzinfo=None) if getattr(exp_raw, "tzinfo", None) else exp_raw
    result = {"otp": rec["otp_code"], "expires": exp_dt, "expired": exp_dt < now_naive()}
    if rec.get("pending_data"):
        result["pending_user"] = json.loads(rec["pending_data"])
    return result


async def otp_delete(mobile: str, otp_type: str) -> None:
    """Remove OTP record (best-effort — ignore failure)."""
    try:
        await sql_execute(
            "DELETE FROM dbo.otp_store WHERE mobile = ? AND otp_type = ?", (mobile, otp_type)
        )
    except Exception:
        pass


# ----------------------------- Startup ---------------------------------------

@app.on_event("startup")
async def startup():
    # Fire DB init in background — do NOT await, so gunicorn worker boots instantly
    asyncio.create_task(_startup_init_safe())


async def _startup_init_safe():
    try:
        await _startup_init()
    except Exception as e:
        logger.error("Startup DB init failed (non-fatal): %s", e)


async def _startup_init():
    # Add columns the app needs that may be missing from the SQL schema
    alters = [
        "IF COL_LENGTH('dbo.temples','logo') IS NULL ALTER TABLE dbo.temples ADD logo NVARCHAR(MAX) NULL",
        "IF COL_LENGTH('dbo.temples','banner') IS NULL ALTER TABLE dbo.temples ADD banner NVARCHAR(MAX) NULL",
        "IF COL_LENGTH('dbo.temples','phone') IS NULL ALTER TABLE dbo.temples ADD phone NVARCHAR(30) NULL",
        "IF COL_LENGTH('dbo.temples','opening_hours') IS NULL ALTER TABLE dbo.temples ADD opening_hours NVARCHAR(200) NULL",
        "IF COL_LENGTH('dbo.poojas','duration') IS NULL ALTER TABLE dbo.poojas ADD duration NVARCHAR(50) NULL",
        "IF COL_LENGTH('dbo.poojas','scheduled_at') IS NULL ALTER TABLE dbo.poojas ADD scheduled_at DATETIME2 NULL",
        "IF COL_LENGTH('dbo.bookings','user_name') IS NULL ALTER TABLE dbo.bookings ADD user_name NVARCHAR(120) NULL",
        "IF COL_LENGTH('dbo.bookings','user_mobile') IS NULL ALTER TABLE dbo.bookings ADD user_mobile NVARCHAR(15) NULL",
        "IF COL_LENGTH('dbo.bookings','nakshatra') IS NULL ALTER TABLE dbo.bookings ADD nakshatra NVARCHAR(120) NULL",
        "IF COL_LENGTH('dbo.bookings','notes') IS NULL ALTER TABLE dbo.bookings ADD notes NVARCHAR(MAX) NULL",
        "IF COL_LENGTH('dbo.bookings','razorpay_order_id') IS NULL ALTER TABLE dbo.bookings ADD razorpay_order_id NVARCHAR(100) NULL",
        "IF COL_LENGTH('dbo.videos','is_approved') IS NULL ALTER TABLE dbo.videos ADD is_approved BIT NOT NULL DEFAULT 1",
        "IF COL_LENGTH('dbo.live_streams','is_approved') IS NULL ALTER TABLE dbo.live_streams ADD is_approved BIT NOT NULL DEFAULT 1",
        "IF COL_LENGTH('dbo.bookings','pujari_id') IS NULL ALTER TABLE dbo.bookings ADD pujari_id NVARCHAR(50) NULL",
        "IF COL_LENGTH('dbo.bookings','pujari_amount') IS NULL ALTER TABLE dbo.bookings ADD pujari_amount FLOAT NULL",
        "IF COL_LENGTH('dbo.bookings','company_amount') IS NULL ALTER TABLE dbo.bookings ADD company_amount FLOAT NULL",
        # --- Pujari completion + wallet flow ---
        "IF COL_LENGTH('dbo.bookings','completed_at') IS NULL ALTER TABLE dbo.bookings ADD completed_at DATETIME2 NULL",
        "IF COL_LENGTH('dbo.bookings','completion_video_url') IS NULL ALTER TABLE dbo.bookings ADD completion_video_url NVARCHAR(500) NULL",
        "IF COL_LENGTH('dbo.bookings','pujari_paid') IS NULL ALTER TABLE dbo.bookings ADD pujari_paid BIT NOT NULL DEFAULT 0",
        "IF COL_LENGTH('dbo.users','wallet_balance') IS NULL ALTER TABLE dbo.users ADD wallet_balance FLOAT NOT NULL DEFAULT 0",
        # --- Notification topic preferences (default ON) ---
        "IF COL_LENGTH('dbo.users','notify_pooja') IS NULL ALTER TABLE dbo.users ADD notify_pooja BIT NOT NULL DEFAULT 1",
        "IF COL_LENGTH('dbo.users','notify_video') IS NULL ALTER TABLE dbo.users ADD notify_video BIT NOT NULL DEFAULT 1",
        "IF COL_LENGTH('dbo.users','notify_live') IS NULL ALTER TABLE dbo.users ADD notify_live BIT NOT NULL DEFAULT 1",
        "IF COL_LENGTH('dbo.users','notify_booking') IS NULL ALTER TABLE dbo.users ADD notify_booking BIT NOT NULL DEFAULT 1",
        # --- SQL-backed OTP store (replaces in-memory dicts, survives restarts/multi-worker) ---
        """IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'otp_store' AND schema_id = SCHEMA_ID('dbo'))
           CREATE TABLE dbo.otp_store (
               mobile NVARCHAR(20) NOT NULL,
               otp_type NVARCHAR(20) NOT NULL,
               otp_code NVARCHAR(10) NOT NULL,
               otp_expires DATETIME2 NOT NULL,
               pending_data NVARCHAR(MAX) NULL,
               CONSTRAINT PK_otp_store PRIMARY KEY (mobile, otp_type)
           )""",
        # --- PhonePe / UPI payout system ---
        "IF COL_LENGTH('dbo.users','upi_id') IS NULL ALTER TABLE dbo.users ADD upi_id NVARCHAR(100) NULL",
        """IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'wallet_payouts' AND schema_id = SCHEMA_ID('dbo'))
           CREATE TABLE dbo.wallet_payouts (
               id NVARCHAR(36) NOT NULL,
               pujari_id NVARCHAR(36) NOT NULL,
               booking_id NVARCHAR(36) NULL,
               amount FLOAT NOT NULL DEFAULT 0,
               description NVARCHAR(200) NULL,
               status NVARCHAR(20) NOT NULL DEFAULT 'pending',
               payment_ref NVARCHAR(200) NULL,
               admin_id NVARCHAR(36) NULL,
               created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
               paid_at DATETIME2 NULL,
               CONSTRAINT PK_wallet_payouts PRIMARY KEY (id)
           )""",
        # ─── Accommodation system ───────────────────────────────────────────
        """IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accommodation_properties' AND schema_id = SCHEMA_ID('dbo'))
           CREATE TABLE dbo.accommodation_properties (
               id NVARCHAR(36) NOT NULL,
               temple_id NVARCHAR(36) NULL,
               name NVARCHAR(200) NOT NULL,
               type NVARCHAR(50) NOT NULL DEFAULT 'hotel',
               address NVARCHAR(500) NULL,
               city NVARCHAR(100) NULL,
               phone NVARCHAR(30) NULL,
               description NVARCHAR(MAX) NULL,
               images NVARCHAR(MAX) NULL,
               amenities NVARCHAR(MAX) NULL,
               check_in_time NVARCHAR(20) NULL DEFAULT '12:00',
               check_out_time NVARCHAR(20) NULL DEFAULT '11:00',
               rating FLOAT NULL DEFAULT 0,
               total_rooms INT NULL DEFAULT 0,
               is_active BIT NOT NULL DEFAULT 0,
               manager_id NVARCHAR(36) NULL,
               upi_id NVARCHAR(100) NULL,
               created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
               CONSTRAINT PK_accommodation_properties PRIMARY KEY (id)
           )""",
        "IF COL_LENGTH('dbo.accommodation_properties','upi_id') IS NULL ALTER TABLE dbo.accommodation_properties ADD upi_id NVARCHAR(100) NULL",
        """IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'room_categories' AND schema_id = SCHEMA_ID('dbo'))
           CREATE TABLE dbo.room_categories (
               id NVARCHAR(36) NOT NULL,
               property_id NVARCHAR(36) NOT NULL,
               name NVARCHAR(100) NOT NULL,
               description NVARCHAR(500) NULL,
               price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
               capacity INT NOT NULL DEFAULT 2,
               total_rooms INT NOT NULL DEFAULT 10,
               amenities NVARCHAR(MAX) NULL,
               images NVARCHAR(MAX) NULL,
               is_active BIT NOT NULL DEFAULT 1,
               created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
               CONSTRAINT PK_room_categories PRIMARY KEY (id)
           )""",
        """IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'room_quotas' AND schema_id = SCHEMA_ID('dbo'))
           CREATE TABLE dbo.room_quotas (
               id NVARCHAR(36) NOT NULL,
               room_category_id NVARCHAR(36) NOT NULL,
               quota_date DATE NOT NULL,
               total_quota INT NOT NULL DEFAULT 0,
               booked INT NOT NULL DEFAULT 0,
               CONSTRAINT PK_room_quotas PRIMARY KEY (id),
               CONSTRAINT UQ_room_quotas UNIQUE (room_category_id, quota_date)
           )""",
        """IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accommodation_bookings' AND schema_id = SCHEMA_ID('dbo'))
           CREATE TABLE dbo.accommodation_bookings (
               id NVARCHAR(36) NOT NULL,
               user_id NVARCHAR(36) NOT NULL,
               property_id NVARCHAR(36) NOT NULL,
               room_category_id NVARCHAR(36) NOT NULL,
               check_in DATE NOT NULL,
               check_out DATE NOT NULL,
               guests INT NOT NULL DEFAULT 1,
               rooms INT NOT NULL DEFAULT 1,
               total_nights INT NOT NULL DEFAULT 1,
               amount DECIMAL(10,2) NOT NULL DEFAULT 0,
               status NVARCHAR(20) NOT NULL DEFAULT 'pending_payment',
               payment_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
               razorpay_order_id NVARCHAR(200) NULL,
               razorpay_payment_id NVARCHAR(200) NULL,
               razorpay_signature NVARCHAR(500) NULL,
               pooja_booking_id NVARCHAR(36) NULL,
               guest_name NVARCHAR(200) NOT NULL,
               guest_mobile NVARCHAR(20) NOT NULL,
               special_requests NVARCHAR(500) NULL,
               property_name NVARCHAR(200) NULL,
               room_category_name NVARCHAR(100) NULL,
               created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
               CONSTRAINT PK_accommodation_bookings PRIMARY KEY (id)
           )""",
    ]
    for stmt in alters:
        try:
            await sql_execute(stmt)
        except Exception as e:
            logger.warning("ALTER TABLE: %s", e)

    # Remove any stale super_admin accounts that are not the current ADMIN_MOBILE
    await sql_execute(
        "DELETE FROM dbo.users WHERE role = 'super_admin' AND mobile != ?", (ADMIN_MOBILE,)
    )
    logger.info("Removed stale super_admin accounts (if any)")

    # Seed super admin
    existing = await sql_fetch_one(
        "SELECT id, password_hash FROM dbo.users WHERE mobile = ?", (ADMIN_MOBILE,)
    )
    if not existing:
        await sql_execute(
            "INSERT INTO dbo.users (id, full_name, mobile, email, address, city, pincode, "
            "password_hash, role, is_active, verified, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), ADMIN_NAME, ADMIN_MOBILE, "admin@sripoojahomam.com",
             "HQ", "Hyderabad", "500001", hash_password(ADMIN_PASSWORD),
             "super_admin", 1, 1, now_naive())
        )
        logger.info(f"Seeded super_admin: {ADMIN_MOBILE}")
    else:
        if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await sql_execute(
                "UPDATE dbo.users SET password_hash = ? WHERE mobile = ?",
                (hash_password(ADMIN_PASSWORD), ADMIN_MOBILE)
            )

    # Seed demo data if empty
    count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.temples")
    if count == 0:
        await _seed_demo_data()

    logger.info("SQL Server startup complete — using pymssql (no ODBC driver required)")


async def _seed_demo_data():
    t1_id, t2_id = str(uuid.uuid4()), str(uuid.uuid4())
    now = now_naive()

    await sql_execute(
        "INSERT INTO dbo.temples (id, name, deity, location, description, logo, banner, phone, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (t1_id, "Sri Venkateswara Temple", "Lord Venkateswara", "Tirumala, Andhra Pradesh",
         "One of the most sacred and visited Hindu temples, dedicated to Lord Venkateswara, an incarnation of Vishnu.",
         "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Tirumala_Tirupati_Balaji_Temple.jpg/400px-Tirumala_Tirupati_Balaji_Temple.jpg",
         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Tirumala_temple_1.jpg/1024px-Tirumala_temple_1.jpg",
         "+91 877 227 7777", now)
    )
    await sql_execute(
        "INSERT INTO dbo.temples (id, name, deity, location, description, logo, banner, phone, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (t2_id, "Sri Kanaka Durga Temple", "Goddess Durga", "Vijayawada, Andhra Pradesh",
         "Ancient temple of Goddess Kanaka Durga on Indrakeeladri Hill, overlooking the Krishna River.",
         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Kanaka_Durga_Temple.jpg/400px-Kanaka_Durga_Temple.jpg",
         "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Kanaka_durga_temple_vijayawada.jpg/1024px-Kanaka_durga_temple_vijayawada.jpg",
         "+91 866 257 1427", now)
    )

    for tid in (t1_id, t2_id):
        for name, ptype, desc, price, dur, img, days in [
            ("Abhishekam", "pooja",
             "Sacred bathing ritual of the deity with milk, honey, ghee and sacred water.",
             501.0, "45 mins",
             "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Abhishekam_ritual.jpg/640px-Abhishekam_ritual.jpg", 2),
            ("Sudarshana Homam", "homam",
             "Powerful fire ritual to invoke Lord Sudarshana for protection and removal of obstacles.",
             1501.0, "2 hours",
             "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Yajna_Homa_fire.jpg/640px-Yajna_Homa_fire.jpg", 5),
            ("Archana", "pooja",
             "108 name chanting with flowers and offerings in your name and gotra.",
             251.0, "30 mins",
             "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Hindu_temple_offerings.jpg/640px-Hindu_temple_offerings.jpg", 1),
        ]:
            await sql_execute(
                "INSERT INTO dbo.poojas (id, temple_id, name, pooja_type, description, price, "
                "duration, image_url, scheduled_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), tid, name, ptype, desc, price, dur, img,
                 now + timedelta(days=days), now)
            )

    await sql_execute(
        "INSERT INTO dbo.videos (id, temple_id, title, caption, url, thumbnail, created_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), t1_id, "Morning Suprabhatam",
         "Experience divine morning wake-up call chants at Tirumala",
         "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
         "https://images.pexels.com/photos/36609017/pexels-photo-36609017.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         now)
    )
    await sql_execute(
        "INSERT INTO dbo.videos (id, temple_id, title, caption, url, thumbnail, created_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), t2_id, "Kanaka Durga Aarti",
         "Witness the powerful evening aarti of Goddess Durga",
         "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
         "https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         now)
    )

    await sql_execute(
        "INSERT INTO dbo.live_streams (id, temple_id, title, stream_url, is_paid_only, is_live, created_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), t1_id, "Live Suprabhatam Seva",
         "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
         1, 1, now)
    )
    logger.info("Seeded demo data")

# ----------------------------- Auth Routes -----------------------------------
@api.get("/")
async def root():
    return {"message": "Sri Pooja Homam API", "status": "ok"}

@api.post("/auth/register")
async def register(data: RegisterIn):
    mobile = data.mobile.strip()
    # Normalize: remove +91, strip to 10 digits
    mobile = re.sub(r"\D", "", mobile)  # remove all non-digits
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]  # strip country code
    if len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")
    
    email = data.email.lower()
    if await sql_fetch_one("SELECT id FROM dbo.users WHERE mobile = ?", (mobile,)):
        raise HTTPException(400, "Mobile already registered")
    if await sql_fetch_one("SELECT id FROM dbo.users WHERE email = ?", (email,)):
        raise HTTPException(400, "Email already registered")

    otp = gen_otp()
    pending_user = {
        "id": str(uuid.uuid4()),
        "full_name": data.full_name,
        "mobile": mobile,
        "email": email,
        "address": data.address,
        "city": data.city,
        "pincode": data.pincode,
        "password_hash": hash_password(data.password),
        "role": "devotee",
        "is_active": True,
        "verified": False,
        "created_at": to_iso(now_utc()),
    }
    await otp_save(mobile, otp, 'register', pending_user)
    logger.info("[WhatsApp OTP] Sending for %s", mobile)
    if whatsapp_is_configured():
        ok = await whatsapp_send_otp(mobile, otp)
        if ok:
            return {"message": "OTP sent via WhatsApp", "mobile": mobile}
        # WhatsApp configured but delivery failed (expired token / template error)
        logger.error("[WhatsApp OTP] DELIVERY FAILED for %s — check META_WHATSAPP_TOKEN in Azure App Settings", mobile)
        return {"message": "OTP generated but WhatsApp delivery failed. Tap Resend OTP.", "mobile": mobile, "delivery_failed": True}
    else:
        # Fallback for dev/staging — WhatsApp not yet configured
        logger.warning("[WhatsApp OTP] FALLBACK: %s -> %s (META_* env vars not set)", mobile, otp)
        return {"message": "OTP sent (test mode — WhatsApp not configured)", "mobile": mobile, "otp_mock": otp}

@api.post("/auth/verify-otp")
async def verify_otp(data: VerifyOtpIn):
    # Normalize: remove +91, strip to 10 digits (MUST MATCH register normalization)
    mobile = data.mobile.strip()
    mobile = re.sub(r"\D", "", mobile)  # remove all non-digits
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]  # strip country code
    if len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")
    
    rec = await otp_get(mobile, 'register')
    if not rec:
        raise HTTPException(400, "No OTP requested for this mobile")
    if rec["expired"]:
        await otp_delete(mobile, 'register')
        raise HTTPException(400, "OTP expired")
    if data.otp != rec["otp"]:
        raise HTTPException(400, "Invalid OTP")
    user = rec["pending_user"]
    user["verified"] = True
    await sql_execute(
        "INSERT INTO dbo.users (id, full_name, mobile, email, address, city, pincode, "
        "password_hash, role, is_active, verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (user["id"], user["full_name"], user["mobile"], user["email"],
         user["address"], user["city"], user["pincode"], user["password_hash"],
         user["role"], 1, 1, now_naive())
    )
    await otp_delete(mobile, 'register')
    token = create_token(user["id"], user["role"], user)

    # Send WhatsApp welcome message (non-blocking — failure won't break login)
    try:
        await whatsapp_send_welcome(user["mobile"], user["full_name"])
    except Exception as exc:
        logger.warning("[WhatsApp] Welcome message error (ignored): %s", exc)

    return {"token": token, "user": clean_user(user)}

@api.post("/auth/resend-otp")
async def resend_otp(data: ResendOtpIn):
    """Regenerate and resend OTP for the registration flow."""
    mobile = data.mobile.strip()
    mobile = re.sub(r"\D", "", mobile)
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]
    rec = await otp_get(mobile, 'register')
    if not rec:
        raise HTTPException(400, "No registration in progress. Please start registration again.")
    new_otp = gen_otp()
    await otp_save(mobile, new_otp, 'register', rec.get("pending_user"))
    logger.info("[Resend OTP] New OTP for %s", mobile)
    if whatsapp_is_configured():
        ok = await whatsapp_send_otp(mobile, new_otp)
        if ok:
            return {"message": "OTP resent via WhatsApp"}
        return {"message": "WhatsApp delivery failed. Please check META_WHATSAPP_TOKEN in Azure settings.", "delivery_failed": True}
    return {"message": "OTP resent (test mode)", "otp_mock": new_otp}

@api.post("/auth/login")
async def login(data: LoginIn):
    u = await sql_fetch_one(
        f"SELECT {USER_COLS}, password_hash FROM dbo.users WHERE mobile = ?",
        (data.mobile.strip(),)
    )
    if not u or not verify_password(data.password, u.get("password_hash", "")):
        raise HTTPException(401, "Invalid mobile or password")
    if not u.get("is_active", True):
        raise HTTPException(403, "Account deactivated. Contact admin.")
    token = create_token(u["id"], u["role"], u)
    return {"token": token, "user": clean_user(u)}

@api.get("/auth/me")
async def me(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Fast path: decode JWT and return embedded user — no DB round-trip."""
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    # Return embedded user data if present (new tokens), otherwise fall back to DB
    if "u" in payload:
        return payload["u"]
    # Legacy tokens without embedded user — hit DB once, will be replaced on next login
    user = await sql_fetch_one(
        f"SELECT {USER_COLS} FROM dbo.users WHERE id = ?", (payload["sub"],)
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _normalise_row(user)

# ----------------------------- Profile ---------------------------------------
@api.put("/users/me/photo")
async def update_profile_photo(data: ProfilePhotoIn, user: dict = Depends(get_current_user)):
    photo = (data.photo or "").strip()
    if not photo:
        raise HTTPException(400, "photo required")
    if not photo.startswith("data:"):
        photo = f"data:image/jpeg;base64,{photo}"
    if len(photo) > 2_800_000:
        raise HTTPException(413, "Photo too large (max ~2MB). Please pick a smaller image.")
    await sql_execute("UPDATE dbo.users SET photo_url = ? WHERE id = ?", (photo, user["id"]))
    return await sql_fetch_one(f"SELECT {USER_COLS} FROM dbo.users WHERE id = ?", (user["id"],))

@api.delete("/users/me/photo")
async def delete_profile_photo(user: dict = Depends(get_current_user)):
    await sql_execute("UPDATE dbo.users SET photo_url = NULL WHERE id = ?", (user["id"],))
    return {"ok": True}

@api.put("/users/me")
async def update_profile(data: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    allowed = {"full_name", "email", "address", "city", "pincode"}
    fields = {k: v for k, v in data.dict().items() if v is not None and v != "" and k in allowed}
    if not fields:
        raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    params = list(fields.values()) + [user["id"]]
    await sql_execute(f"UPDATE dbo.users SET {set_clause} WHERE id = ?", params)
    return await sql_fetch_one(f"SELECT {USER_COLS} FROM dbo.users WHERE id = ?", (user["id"],))

# ----------------------------- Temples ---------------------------------------
TEMPLE_COLS = "id, name, deity, location, description, logo, banner, phone, opening_hours, image_url, gallery, created_at"

@api.get("/temples")
async def list_temples():
    return await sql_fetch_all(f"SELECT TOP 500 {TEMPLE_COLS} FROM dbo.temples")

@api.get("/temples/{temple_id}")
async def get_temple(temple_id: str):
    t = await sql_fetch_one(f"SELECT {TEMPLE_COLS} FROM dbo.temples WHERE id = ?", (temple_id,))
    if not t:
        raise HTTPException(404, "Temple not found")
    return t

@api.post("/temples")
async def create_temple(data: TempleIn, user: dict = Depends(require_admin)):
    t_id = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.temples (id, name, deity, location, description, logo, banner, phone, opening_hours, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        (t_id, data.name, data.deity, data.location, data.description,
         data.logo, data.banner, data.phone, data.opening_hours, now_naive())
    )
    return {"id": t_id, **data.dict(), "created_at": to_iso(now_utc())}

@api.put("/temples/{temple_id}")
async def update_temple(temple_id: str, data: TempleIn, user: dict = Depends(require_admin)):
    rc = await sql_execute(
        "UPDATE dbo.temples SET name=?, deity=?, location=?, description=?, logo=?, banner=?, phone=?, opening_hours=? WHERE id=?",
        (data.name, data.deity, data.location, data.description, data.logo, data.banner, data.phone, data.opening_hours, temple_id)
    )
    if rc == 0:
        raise HTTPException(404, "Temple not found")
    return await sql_fetch_one(f"SELECT {TEMPLE_COLS} FROM dbo.temples WHERE id = ?", (temple_id,))

@api.delete("/temples/{temple_id}")
async def delete_temple(temple_id: str, user: dict = Depends(require_super_admin)):
    await sql_execute("DELETE FROM dbo.bookings WHERE temple_id = ?", (temple_id,))
    await sql_execute("DELETE FROM dbo.live_streams WHERE temple_id = ?", (temple_id,))
    await sql_execute("DELETE FROM dbo.videos WHERE temple_id = ?", (temple_id,))
    await sql_execute("DELETE FROM dbo.poojas WHERE temple_id = ?", (temple_id,))
    await sql_execute("DELETE FROM dbo.temples WHERE id = ?", (temple_id,))
    return {"ok": True}

# ----------------------------- Poojas ----------------------------------------
POOJA_COLS = ("id, temple_id, name, pooja_type AS [type], description, price, "
              "duration, image_url AS image, scheduled_at, is_active, created_at")

@api.get("/poojas")
async def list_poojas(temple_id: Optional[str] = None, type: Optional[str] = None):
    conditions, params = [], []
    if temple_id:
        conditions.append("temple_id = ?")
        params.append(temple_id)
    if type:
        conditions.append("pooja_type = ?")
        params.append(type)
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    return await sql_fetch_all(f"SELECT TOP 500 {POOJA_COLS} FROM dbo.poojas{where}", params)

@api.get("/poojas/{pooja_id}")
async def get_pooja(pooja_id: str):
    p = await sql_fetch_one(f"SELECT {POOJA_COLS} FROM dbo.poojas WHERE id = ?", (pooja_id,))
    if not p:
        raise HTTPException(404, "Pooja not found")
    return p

@api.post("/poojas")
async def create_pooja(data: PoojaIn, user: dict = Depends(require_admin)):
    p_id = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.poojas (id, temple_id, name, pooja_type, description, price, "
        "duration, image_url, scheduled_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (p_id, data.temple_id, data.name, data.type, data.description,
         data.price, data.duration, data.image, safe_parse_dt(data.scheduled_at), now_naive())
    )
    try:
        tokens = await _tokens_for_topic("pooja")
        fire_and_forget_push(
            tokens,
            title=f"\u0950 New Pooja — {data.name}",
            body=f"Book now: {data.name} at \u20b9{data.price}. Limited slots available.",
            data={"type": "pooja", "url": "/temples"},
        )
    except Exception as e:
        logger.warning("push (new pooja) failed: %s", e)
    return {"id": p_id, **data.dict(), "created_at": to_iso(now_utc())}

@api.put("/poojas/{pooja_id}")
async def update_pooja(pooja_id: str, data: PoojaIn, user: dict = Depends(require_admin)):
    rc = await sql_execute(
        "UPDATE dbo.poojas SET temple_id=?, name=?, pooja_type=?, description=?, "
        "price=?, duration=?, image_url=?, scheduled_at=? WHERE id=?",
        (data.temple_id, data.name, data.type, data.description,
         data.price, data.duration, data.image, safe_parse_dt(data.scheduled_at), pooja_id)
    )
    if rc == 0:
        raise HTTPException(404, "Pooja not found")
    return await sql_fetch_one(f"SELECT {POOJA_COLS} FROM dbo.poojas WHERE id = ?", (pooja_id,))

@api.delete("/poojas/{pooja_id}")
async def delete_pooja(pooja_id: str, user: dict = Depends(require_admin)):
    await sql_execute("DELETE FROM dbo.bookings WHERE pooja_id = ?", (pooja_id,))
    await sql_execute("DELETE FROM dbo.poojas WHERE id = ?", (pooja_id,))
    return {"ok": True}

# ----------------------------- Bookings --------------------------------------
COMPANY_PERCENTAGE = 0.30  # Company deducts 30%; Pujari receives 70%

BOOKING_COLS = ("id, user_id, user_name, user_mobile, pooja_id, pooja_name, pooja_type, "
                "temple_id, (SELECT TOP 1 name FROM dbo.temples t WHERE t.id = dbo.bookings.temple_id) AS temple_name, "
                "amount, devotee_name, gotra, nakshatra, notes, status, payment_status, "
                "razorpay_order_id, razorpay_payment_id, scheduled_at, paid_at, created_at, "
                "pujari_id, pujari_amount, company_amount, "
                "completed_at, completion_video_url, pujari_paid, "
                "(SELECT TOP 1 full_name FROM dbo.users u2 WHERE u2.id = dbo.bookings.pujari_id) AS pujari_name, "
                "(SELECT TOP 1 mobile FROM dbo.users u3 WHERE u3.id = dbo.bookings.pujari_id) AS pujari_mobile")

@api.post("/bookings")
async def create_booking(data: BookingIn, user: dict = Depends(get_current_user)):
    pooja = await sql_fetch_one(
        "SELECT id, temple_id, name, pooja_type AS [type], price, scheduled_at FROM dbo.poojas WHERE id = ?",
        (data.pooja_id,)
    )
    if not pooja:
        raise HTTPException(404, "Pooja not found")
    b_id = str(uuid.uuid4())
    # Create real Razorpay order if credentials are available
    order_id = None
    if RAZORPAY_ENABLED and _rzp_client:
        try:
            rzp_order = _rzp_client.order.create({
                "amount": int(float(pooja["price"]) * 100),  # paise
                "currency": "INR",
                "receipt": b_id[:40],
            })
            order_id = rzp_order["id"]
        except Exception as e:
            logger.warning("Razorpay order creation failed: %s", e)
    await sql_execute(
        "INSERT INTO dbo.bookings (id, user_id, user_name, user_mobile, pooja_id, pooja_name, "
        "pooja_type, temple_id, amount, devotee_name, gotra, nakshatra, notes, status, "
        "payment_status, razorpay_order_id, scheduled_at, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (b_id, user["id"], user["full_name"], user["mobile"], data.pooja_id,
         pooja["name"], pooja["type"], pooja["temple_id"], pooja["price"],
         data.devotee_name, data.gotra, data.nakshatra, data.notes,
         "pending_payment", "pending", order_id,
         data.scheduled_at or pooja.get("scheduled_at"), now_naive())
    )
    return await sql_fetch_one(f"SELECT {BOOKING_COLS} FROM dbo.bookings WHERE id = ?", (b_id,))

@api.post("/bookings/confirm-payment")
async def confirm_payment(data: PaymentConfirmIn, user: dict = Depends(get_current_user)):
    booking = await sql_fetch_one(
        f"SELECT {BOOKING_COLS} FROM dbo.bookings WHERE id = ? AND user_id = ?",
        (data.booking_id, user["id"])
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    # Verify Razorpay signature when present (real Razorpay order, not null)
    rzp_order_id = booking.get("razorpay_order_id") or ""
    is_real_razorpay_order = bool(rzp_order_id) and rzp_order_id.startswith("order_") and len(rzp_order_id) <= 25
    if (RAZORPAY_ENABLED and _rzp_client
            and data.razorpay_signature
            and data.razorpay_payment_id
            and is_real_razorpay_order):
        try:
            _rzp_client.utility.verify_payment_signature({
                "razorpay_order_id": rzp_order_id,
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature,
            })
        except Exception as e:
            logger.warning("Razorpay signature verification failed: %s", e)
            raise HTTPException(400, "Payment signature verification failed")
    payment_id = data.razorpay_payment_id or f"pay_{uuid.uuid4().hex[:16]}"
    amount = float(booking.get("amount") or 0)
    company_amount = round(amount * COMPANY_PERCENTAGE, 2)
    pujari_amount = round(amount - company_amount, 2)
    await sql_execute(
        "UPDATE dbo.bookings SET status=?, payment_status=?, razorpay_payment_id=?, paid_at=?, company_amount=?, pujari_amount=? WHERE id=?",
        ("confirmed", "paid", payment_id, now_naive(), company_amount, pujari_amount, data.booking_id)
    )
    updated = await sql_fetch_one(f"SELECT {BOOKING_COLS} FROM dbo.bookings WHERE id = ?", (data.booking_id,))
    try:
        tokens = await sql_fetch_all(
            "SELECT TOP 20 token FROM dbo.push_tokens WHERE user_id = ?", (user["id"],)
        )
        fire_and_forget_push(
            [t["token"] for t in tokens],
            title="🙏 Booking Confirmed",
            body=f"Your {updated.get('pooja_name','pooja')} booking is confirmed. ₹{updated.get('amount',0)}",
            data={"type": "booking_confirmation", "bookingId": data.booking_id, "url": "/bookings"},
        )
    except Exception as e:
        logger.warning("push (booking) failed: %s", e)

    # WhatsApp booking confirmation (non-blocking)
    try:
        await whatsapp_send_booking(
            mobile=user.get("mobile", ""),
            full_name=user.get("full_name", "Devotee"),
            pooja_name=updated.get("pooja_name", "Pooja"),
            booking_id=data.booking_id,
            payment_id=payment_id,
            amount=float(updated.get("amount") or 0),
        )
    except Exception as exc:
        logger.warning("[WhatsApp] Booking confirmation error (ignored): %s", exc)

    return updated

@api.get("/bookings/mine")
async def my_bookings(user: dict = Depends(get_current_user)):
    return await sql_fetch_all(
        f"SELECT {BOOKING_COLS} FROM dbo.bookings WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],)
    )

@api.get("/bookings")
async def list_bookings(user: dict = Depends(require_admin)):
    return await sql_fetch_all(
        f"SELECT TOP 1000 {BOOKING_COLS} FROM dbo.bookings ORDER BY created_at DESC"
    )

# ----------------------------- Videos ----------------------------------------
VIDEO_COLS = "id, temple_id, title, caption, url AS video_url, thumbnail, is_approved, created_at"

@api.get("/videos")
async def list_videos(
    temple_id: Optional[str] = None,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer)):
    approved_clause = "" if _is_privileged(creds) else "AND is_approved = 1"
    if temple_id:
        return await sql_fetch_all(
            f"SELECT TOP 500 {VIDEO_COLS} FROM dbo.videos WHERE temple_id = ? {approved_clause} ORDER BY created_at DESC",
            (temple_id,)
        )
    return await sql_fetch_all(
        f"SELECT TOP 500 {VIDEO_COLS} FROM dbo.videos WHERE 1=1 {approved_clause} ORDER BY created_at DESC"
    )

@api.post("/videos")
async def create_video(data: VideoIn, user: dict = Depends(require_poojari_or_admin)):
    v_id = str(uuid.uuid4())
    # Poojari uploads require super_admin approval; admin uploads are auto-approved
    is_approved = 0 if user["role"] == "poojari" else 1
    await sql_execute(
        "INSERT INTO dbo.videos (id, temple_id, title, caption, url, thumbnail, is_approved, created_at) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (v_id, data.temple_id, data.title, data.caption, data.video_url, data.thumbnail, is_approved, now_naive())
    )
    if is_approved:
        try:
            tokens = await _tokens_for_topic("video")
            fire_and_forget_push(
                tokens,
                title=f"\U0001f3ac New Video — {data.title}",
                body=data.caption or "A new devotional video has been added. Tap to watch.",
                data={"type": "video", "url": "/live"},
            )
        except Exception as e:
            logger.warning("push (new video) failed: %s", e)
    return {"id": v_id, **data.dict(), "is_approved": bool(is_approved), "created_at": to_iso(now_utc())}

@api.patch("/videos/{video_id}/approve")
async def approve_video(video_id: str, user: dict = Depends(require_super_admin)):
    rc = await sql_execute("UPDATE dbo.videos SET is_approved = 1 WHERE id = ?", (video_id,))
    if rc == 0:
        raise HTTPException(404, "Video not found")
    return {"ok": True}

@api.delete("/videos/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(require_admin)):
    await sql_execute("DELETE FROM dbo.videos WHERE id = ?", (video_id,))
    return {"ok": True}

# ----------------------------- Live Streams ----------------------------------
STREAM_COLS = ("id, temple_id, pooja_id, title, description, stream_url, channel_name, "
               "provider, is_paid_only, is_live, is_approved, created_at")

@api.get("/live-streams")
async def list_live_streams(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer)):
    privileged = _is_privileged(creds)
    approved_clause = "" if privileged else "AND is_approved = 1"
    rows = await sql_fetch_all(
        f"SELECT TOP 100 {STREAM_COLS} FROM dbo.live_streams WHERE is_live = 1 {approved_clause}"
    )
    if privileged:
        return rows
    # Non-privileged caller: hide paid-only streams unless devotee has a paid booking in that temple
    user_id = None
    try:
        if creds and creds.credentials:
            payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
            user_id = payload.get("sub") or (payload.get("u") or {}).get("id")
    except Exception:
        user_id = None
    if not user_id:
        return [s for s in rows if not s.get("is_paid_only")]
    paid_temple_ids = set()
    try:
        pr = await sql_fetch_all(
            "SELECT DISTINCT temple_id FROM dbo.bookings WHERE user_id = ? AND payment_status = ?",
            (user_id, "paid")
        )
        paid_temple_ids = {r.get("temple_id") for r in pr if r.get("temple_id")}
    except Exception:
        pass
    return [s for s in rows if (not s.get("is_paid_only")) or s.get("temple_id") in paid_temple_ids]

@api.get("/live-streams/config")
async def live_stream_config():
    return {
        "agora_configured": agora_is_configured(),
        "agora_app_id": get_agora_app_id() if agora_is_configured() else None,
    }

@api.get("/live-streams/{stream_id}")
async def get_live_stream(stream_id: str, user: dict = Depends(get_current_user)):
    s = await sql_fetch_one(f"SELECT {STREAM_COLS} FROM dbo.live_streams WHERE id = ?", (stream_id,))
    if not s:
        raise HTTPException(404, "Live stream not found")
    if s.get("is_paid_only") and user["role"] == "devotee":
        has_paid = await sql_fetch_one(
            "SELECT TOP 1 id FROM dbo.bookings WHERE user_id = ? AND temple_id = ? AND payment_status = ?",
            (user["id"], s["temple_id"], "paid")
        )
        if not has_paid:
            raise HTTPException(403, "Live stream available only for paid devotees of this temple. Book any pooja to unlock.")
    return s

@api.patch("/live-streams/{stream_id}/approve")
async def approve_live_stream(stream_id: str, user: dict = Depends(require_super_admin)):
    rc = await sql_execute("UPDATE dbo.live_streams SET is_approved = 1 WHERE id = ?", (stream_id,))
    if rc == 0:
        raise HTTPException(404, "Stream not found")
    return {"ok": True}

@api.post("/live-streams")
async def create_live_stream(data: LiveStreamIn, user: dict = Depends(require_poojari_or_admin)):
    s_id = str(uuid.uuid4())
    # Poojari uploads require super_admin approval; admin uploads are auto-approved
    is_approved = 0 if user["role"] == "poojari" else 1
    await sql_execute(
        "INSERT INTO dbo.live_streams (id, temple_id, pooja_id, title, stream_url, channel_name, "
        "provider, is_paid_only, is_live, is_approved, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (s_id, data.temple_id, data.pooja_id, data.title, data.stream_url,
         data.channel_name, data.provider, 1 if data.is_paid_only else 0,
         1 if data.is_live else 0, is_approved, now_naive())
    )
    result = {"id": s_id, **data.dict(), "created_at": to_iso(now_utc())}
    if data.is_live:
        try:
            tokens = await _tokens_for_topic("live")
            fire_and_forget_push(
                tokens,
                title=f"🔴 LIVE — {data.title}",
                body="A live stream has started. Tap to watch.",
                data={"type": "live_stream_started", "streamId": s_id, "url": f"/live-stream/{s_id}"},
            )
        except Exception as e:
            logger.warning("push (livestream) failed: %s", e)
    return result

@api.put("/live-streams/{stream_id}")
async def update_live_stream(stream_id: str, data: LiveStreamIn, user: dict = Depends(require_poojari_or_admin)):
    prev = await sql_fetch_one(f"SELECT {STREAM_COLS} FROM dbo.live_streams WHERE id = ?", (stream_id,))
    await sql_execute(
        "UPDATE dbo.live_streams SET temple_id=?, pooja_id=?, title=?, stream_url=?, "
        "channel_name=?, provider=?, is_paid_only=?, is_live=? WHERE id=?",
        (data.temple_id, data.pooja_id, data.title, data.stream_url,
         data.channel_name, data.provider, 1 if data.is_paid_only else 0,
         1 if data.is_live else 0, stream_id)
    )
    updated = await sql_fetch_one(f"SELECT {STREAM_COLS} FROM dbo.live_streams WHERE id = ?", (stream_id,))
    if updated and updated.get("is_live") and prev and not prev.get("is_live"):
        try:
            tokens = await _tokens_for_topic("live")
            fire_and_forget_push(
                tokens,
                title=f"🔴 LIVE — {updated.get('title','Live Darshan')}",
                body=updated.get("description") or "A live stream just went live.",
                data={"type": "live_stream_started", "streamId": stream_id, "url": f"/live-stream/{stream_id}"},
            )
        except Exception as e:
            logger.warning("push (livestream update) failed: %s", e)
    return updated

@api.delete("/live-streams/{stream_id}")
async def delete_live_stream(stream_id: str, user: dict = Depends(require_admin)):
    await sql_execute("DELETE FROM dbo.live_streams WHERE id = ?", (stream_id,))
    return {"ok": True}

# ---------- Agora live-streaming token ----------
@api.post("/live-streams/{stream_id}/token")
async def get_live_stream_token(stream_id: str, data: AgoraTokenIn, user: dict = Depends(get_current_user)):
    if not agora_is_configured():
        raise HTTPException(503, "Live broadcasting is not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE.")
    stream = await sql_fetch_one(f"SELECT {STREAM_COLS} FROM dbo.live_streams WHERE id = ?", (stream_id,))
    if not stream:
        raise HTTPException(404, "Stream not found")
    role = (data.role or "subscriber").lower()
    if role == "publisher" and user.get("role") not in ("admin", "super_admin", "poojari"):
        raise HTTPException(403, "Only pujaris and admins can publish (broadcast)")
    channel = data.channel_name or stream.get("channel_name") or f"stream_{stream_id[:12]}"
    if not stream.get("channel_name"):
        await sql_execute("UPDATE dbo.live_streams SET channel_name = ? WHERE id = ?", (channel, stream_id))
    uid = int(data.uid) if data.uid is not None else 0
    tok = build_rtc_token(channel_name=channel, uid=uid, role=role, ttl_seconds=3600)
    if not tok:
        raise HTTPException(503, "Could not build Agora token")
    return tok

# ----------------------------- User Management -------------------------------
@api.get("/users")
async def list_users(role: Optional[str] = None, user: dict = Depends(require_admin)):
    if role:
        return await sql_fetch_all(
            f"SELECT TOP 1000 {USER_COLS} FROM dbo.users WHERE role = ? ORDER BY created_at DESC",
            (role,)
        )
    return await sql_fetch_all(
        f"SELECT TOP 1000 {USER_COLS} FROM dbo.users ORDER BY created_at DESC"
    )

@api.put("/users/{user_id}/status")
async def set_user_status(user_id: str, data: UserStatusIn, user: dict = Depends(require_super_admin)):
    target = await sql_fetch_one("SELECT id, role FROM dbo.users WHERE id = ?", (user_id,))
    if not target:
        raise HTTPException(404, "User not found")
    if target["role"] == "super_admin":
        raise HTTPException(400, "Cannot deactivate super admin")
    await sql_execute("UPDATE dbo.users SET is_active = ? WHERE id = ?", (1 if data.is_active else 0, user_id))
    return {"ok": True, "is_active": data.is_active}

@api.put("/users/{user_id}/role")
async def set_user_role(user_id: str, role: str, user: dict = Depends(require_super_admin)):
    if role not in ("devotee", "admin", "poojari"):
        raise HTTPException(400, "Role must be devotee, admin, or poojari")
    target = await sql_fetch_one("SELECT id, role FROM dbo.users WHERE id = ?", (user_id,))
    if not target:
        raise HTTPException(404, "User not found")
    if target["role"] == "super_admin":
        raise HTTPException(400, "Cannot change super admin role")
    await sql_execute("UPDATE dbo.users SET role = ? WHERE id = ?", (role, user_id))
    return {"ok": True, "role": role}

class ResetPasswordIn(BaseModel):
    new_password: str

class ForgotPasswordIn(BaseModel):
    mobile: str

class ResetPasswordOtpIn(BaseModel):
    mobile: str
    otp: str
    new_password: str

@api.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordIn):
    # Normalize: remove +91, strip to 10 digits
    mobile = data.mobile.strip()
    mobile = re.sub(r"\D", "", mobile)  # remove all non-digits
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]  # strip country code
    if len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")
    
    u = await sql_fetch_one("SELECT id FROM dbo.users WHERE mobile = ?", (mobile,))
    if not u:
        raise HTTPException(404, "No account found with this mobile number")
    otp = gen_otp()
    await otp_save(mobile, otp, 'reset')
    logger.info("[ForgotPw OTP] Sending for %s", mobile)
    if whatsapp_is_configured():
        ok = await whatsapp_send_otp(mobile, otp)
        if ok:
            return {"message": "OTP sent via WhatsApp", "mobile": mobile}
        logger.error("[ForgotPw OTP] DELIVERY FAILED for %s — check META_WHATSAPP_TOKEN", mobile)
        return {"message": "OTP generated but WhatsApp delivery failed. Tap Resend OTP.", "mobile": mobile, "delivery_failed": True}
    else:
        logger.warning("[ForgotPw OTP] FALLBACK: %s -> %s", mobile, otp)
        return {"message": "OTP sent (test mode)", "mobile": mobile, "otp_debug": otp}

@api.post("/auth/reset-password-otp")
async def reset_password_otp(data: ResetPasswordOtpIn):
    # Normalize: remove +91, strip to 10 digits (MUST MATCH forgot_password normalization)
    mobile = data.mobile.strip()
    mobile = re.sub(r"\D", "", mobile)  # remove all non-digits
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]  # strip country code
    if len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")
    
    rec = await otp_get(mobile, 'reset')
    if not rec:
        raise HTTPException(400, "No OTP requested for this mobile. Please request forgot password again.")
    if rec["expired"]:
        await otp_delete(mobile, 'reset')
        raise HTTPException(400, "OTP expired. Request a new one.")
    if data.otp != rec["otp"]:
        raise HTTPException(400, "Invalid OTP")
    if not data.new_password or len(data.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    await sql_execute(
        "UPDATE dbo.users SET password_hash = ? WHERE mobile = ?",
        (hash_password(data.new_password), mobile)
    )
    await otp_delete(mobile, 'reset')
    return {"ok": True, "message": "Password reset successfully"}

@api.post("/auth/resend-reset-otp")
async def resend_reset_otp(data: ResendOtpIn):
    """Regenerate and resend OTP for the forgot-password flow."""
    # Normalize: remove +91, strip to 10 digits (MUST MATCH forgot_password normalization)
    mobile = data.mobile.strip()
    mobile = re.sub(r"\D", "", mobile)  # remove all non-digits
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]  # strip country code
    if len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")
    
    rec = await otp_get(mobile, 'reset')
    if not rec:
        raise HTTPException(400, "No reset OTP found. Please request forgot password again.")
    new_otp = gen_otp()
    await otp_save(mobile, new_otp, 'reset')
    logger.info("[Resend Reset OTP] New OTP for %s", mobile)
    if whatsapp_is_configured():
        ok = await whatsapp_send_otp(mobile, new_otp)
        if ok:
            return {"message": "OTP resent via WhatsApp"}
        return {"message": "WhatsApp delivery failed.", "delivery_failed": True}
    return {"message": "OTP resent (test mode)", "otp_mock": new_otp}

@api.put("/users/{user_id}/password")
async def reset_user_password(user_id: str, data: ResetPasswordIn, user: dict = Depends(require_super_admin)):
    if not data.new_password or len(data.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    target = await sql_fetch_one("SELECT id, role FROM dbo.users WHERE id = ?", (user_id,))
    if not target:
        raise HTTPException(404, "User not found")
    await sql_execute(
        "UPDATE dbo.users SET password_hash = ? WHERE id = ?",
        (hash_password(data.new_password), user_id)
    )
    return {"ok": True}

# ----------------------------- Push Tokens -----------------------------------
@api.post("/users/push-token")
async def register_push_token(data: PushTokenIn, user: dict = Depends(get_current_user)):
    token = (data.token or "").strip()
    if not token:
        raise HTTPException(400, "token required")
    now = now_naive()
    existing = await sql_fetch_one("SELECT token FROM dbo.push_tokens WHERE token = ?", (token,))
    if existing:
        await sql_execute(
            "UPDATE dbo.push_tokens SET user_id=?, platform=?, updated_at=? WHERE token=?",
            (user["id"], data.platform or "expo", now, token)
        )
    else:
        await sql_execute(
            "INSERT INTO dbo.push_tokens (token, user_id, platform, created_at, updated_at) VALUES (?,?,?,?,?)",
            (token, user["id"], data.platform or "expo", now, now)
        )
    return {"ok": True}

@api.delete("/users/push-token")
async def delete_push_token(data: PushTokenDeleteIn, user: dict = Depends(get_current_user)):
    await sql_execute("DELETE FROM dbo.push_tokens WHERE token = ? AND user_id = ?", (data.token, user["id"]))
    return {"ok": True}

@api.post("/users/push-test")
async def push_test(data: TestPushIn, user: dict = Depends(get_current_user)):
    tokens = await sql_fetch_all(
        "SELECT TOP 20 token FROM dbo.push_tokens WHERE user_id = ?", (user["id"],)
    )
    if not tokens:
        return {"ok": False, "sent": 0, "reason": "no tokens registered"}
    result = await send_expo_push(
        [t["token"] for t in tokens],
        title=data.title or "🙏 Test Notification",
        body=data.body or "If you can read this, push is working.",
        data={"type": "test", "url": "/(tabs)/profile"},
    )
    return {"ok": True, **result}

# ----------------------------- Notifications feed ----------------------------
@api.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Return a combined feed of recent live streams, videos, poojas, and bookings
    as notification cards ordered by created_at DESC."""
    rows = []

    # Recent live streams (last 7 days, approved)
    streams = await sql_fetch_all(
        "SELECT TOP 10 id, title, created_at FROM dbo.live_streams "
        "WHERE is_approved = 1 AND created_at >= DATEADD(day, -7, GETUTCDATE()) ORDER BY created_at DESC"
    )
    for s in streams:
        rows.append({
            "id": f"ls_{s['id']}",
            "type": "live_stream",
            "title": f"\U0001f534 LIVE \u2014 {s['title']}",
            "body": "A live stream is available. Tap to watch.",
            "created_at": to_iso(s["created_at"]),
            "data": {"streamId": s["id"], "url": f"/live-stream/{s['id']}"},
        })

    # Recent videos (last 7 days, approved)
    videos = await sql_fetch_all(
        "SELECT TOP 10 id, title, caption, created_at FROM dbo.videos "
        "WHERE is_approved = 1 AND created_at >= DATEADD(day, -7, GETUTCDATE()) ORDER BY created_at DESC"
    )
    for v in videos:
        rows.append({
            "id": f"vid_{v['id']}",
            "type": "video",
            "title": f"\U0001f3ac New Video \u2014 {v['title']}",
            "body": v.get("caption") or "A new devotional video has been added.",
            "created_at": to_iso(v["created_at"]),
            "data": {"url": "/live"},
        })

    # Recent poojas (last 7 days)
    poojas = await sql_fetch_all(
        "SELECT TOP 10 id, name, price, created_at FROM dbo.poojas "
        "WHERE created_at >= DATEADD(day, -7, GETUTCDATE()) ORDER BY created_at DESC"
    )
    for p in poojas:
        rows.append({
            "id": f"pooja_{p['id']}",
            "type": "pooja",
            "title": f"\u0950 New Pooja \u2014 {p['name']}",
            "body": f"Book now: {p['name']} at \u20b9{p.get('price', 0):.0f}.",
            "created_at": to_iso(p["created_at"]),
            "data": {"poojaId": p["id"], "url": "/temples"},
        })

    # User's own bookings (last 30 days)
    bookings = await sql_fetch_all(
        "SELECT TOP 5 id, pooja_name, status, created_at FROM dbo.bookings "
        "WHERE user_id = ? AND created_at >= DATEADD(day, -30, GETUTCDATE()) ORDER BY created_at DESC",
        (user["id"],)
    )
    for b in bookings:
        rows.append({
            "id": f"bk_{b['id']}",
            "type": "booking",
            "title": f"\U0001f64f Booking {b.get('status','').replace('_',' ').title()} \u2014 {b.get('pooja_name','')}",
            "body": "Your booking status has been updated.",
            "created_at": to_iso(b["created_at"]),
            "data": {"bookingId": b["id"], "url": "/bookings"},
        })

    rows.sort(key=lambda r: r["created_at"], reverse=True)
    return rows[:30]


# ----------------------------- Donations ------------------------------------
class DonationOrderIn(BaseModel):
    amount: float
    stream_id: Optional[str] = None
    temple_name: Optional[str] = None

class DonationConfirmIn(BaseModel):
    payment_id: str
    order_id: str

@api.post("/donations/order")
async def donation_order(data: DonationOrderIn, user: dict = Depends(get_current_user)):
    """Create a Razorpay-style donation order. In production replace with real Razorpay call."""
    if data.amount <= 0:
        raise HTTPException(400, "amount must be positive")
    order_id = f"order_don_{uuid.uuid4().hex[:16]}"
    # Persist donation intent
    try:
        await sql_execute(
            "IF OBJECT_ID('dbo.donations','U') IS NULL "
            "CREATE TABLE dbo.donations (id NVARCHAR(64) PRIMARY KEY, user_id NVARCHAR(64), "
            "amount DECIMAL(10,2), order_id NVARCHAR(128), payment_id NVARCHAR(128) NULL, "
            "stream_id NVARCHAR(64) NULL, status NVARCHAR(32) DEFAULT 'pending', created_at DATETIME2)"
        )
        await sql_execute(
            "INSERT INTO dbo.donations (id, user_id, amount, order_id, stream_id, status, created_at) "
            "VALUES (?,?,?,?,?,'pending',?)",
            (str(uuid.uuid4()), user["id"], data.amount, order_id, data.stream_id, now_naive())
        )
    except Exception as e:
        logger.warning("donation insert failed: %s", e)
    return {"order_id": order_id, "amount": data.amount, "currency": "INR"}

@api.post("/donations/confirm")
async def donation_confirm(data: DonationConfirmIn, user: dict = Depends(get_current_user)):
    try:
        await sql_execute(
            "UPDATE dbo.donations SET payment_id=?, status='paid' WHERE order_id=? AND user_id=?",
            (data.payment_id, data.order_id, user["id"])
        )
    except Exception as e:
        logger.warning("donation confirm failed: %s", e)
    return {"ok": True}


# ----------------------------- Admin Stats -----------------------------------
@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    total_users = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.users")
    total_devotees = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.users WHERE role = ?", ("devotee",))
    total_admins = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.users WHERE role = ?", ("admin",))
    total_pujaris = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.users WHERE role = ?", ("poojari",))
    total_temples = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.temples")
    total_poojas = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.poojas")
    total_bookings = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings")
    paid_bookings = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE payment_status = ?", ("paid",))
    revenue_val = await sql_scalar("SELECT ISNULL(SUM(amount), 0) AS v FROM dbo.bookings WHERE payment_status = ?", ("paid",))
    company_rev = await sql_scalar("SELECT ISNULL(SUM(company_amount), 0) AS v FROM dbo.bookings WHERE payment_status = ?", ("paid",))
    live_count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.live_streams WHERE is_live = 1")
    return {
        "total_users": total_users,
        "total_devotees": total_devotees,
        "total_admins": total_admins,
        "total_pujaris": total_pujaris,
        "total_temples": total_temples,
        "total_poojas": total_poojas,
        "total_bookings": total_bookings,
        "paid_bookings": paid_bookings,
        "revenue": float(revenue_val) if isinstance(revenue_val, Decimal) else revenue_val,
        "company_revenue": float(company_rev) if isinstance(company_rev, Decimal) else company_rev,
        "live_count": live_count,
    }

# ----------------------------- WhatsApp Test ---------------------------------

class WhatsAppTestIn(BaseModel):
    mobile: str
    otp: str = "123456"

@api.get("/health/whatsapp")
async def health_whatsapp():
    """Public endpoint to check WhatsApp configuration status."""
    return {
        "configured": whatsapp_is_configured(),
        "token_set": bool(os.environ.get("WHATSAPP_TOKEN") or os.environ.get("META_WHATSAPP_TOKEN")),
        "phone_id_set": bool(os.environ.get("WHATSAPP_PHONE_NUMBER_ID") or os.environ.get("META_PHONE_NUMBER_ID")),
        "token_prefix": (os.environ.get("WHATSAPP_TOKEN") or os.environ.get("META_WHATSAPP_TOKEN") or "")[:20] + "...",
        "phone_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID") or os.environ.get("META_PHONE_NUMBER_ID") or "NOT SET",
        "message": "WhatsApp is ready" if whatsapp_is_configured() else "WhatsApp not configured - check credentials",
    }

@api.post("/admin/whatsapp-test")
async def admin_whatsapp_test(data: WhatsAppTestIn, user: dict = Depends(require_admin)):
    """Send a test OTP via WhatsApp and return the full Meta API response for debugging."""
    result = await whatsapp_test_send(data.mobile, data.otp)
    return result

# ----------------------------- Pujari Endpoints ------------------------------

class CreateDevoteeIn(BaseModel):
    full_name: str
    mobile: str
    password: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

@api.post("/admin/create-devotee")
async def create_devotee(data: CreateDevoteeIn, user: dict = Depends(require_admin)):
    """Create a pre-verified devotee account (used for Google Play review test accounts)."""
    mobile = data.mobile.strip()
    existing = await sql_fetch_one("SELECT id FROM dbo.users WHERE mobile = ?", (mobile,))
    if existing:
        raise HTTPException(400, "A user with this mobile already exists")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    u_id = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.users (id, full_name, mobile, email, address, city, pincode, "
        "password_hash, role, is_active, verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (u_id, data.full_name, mobile, data.email or "", data.address or "", data.city or "", "",
         hash_password(data.password), "devotee", 1, 1, now_naive())
    )
    return {"ok": True, "id": u_id, "role": "devotee", "full_name": data.full_name, "mobile": mobile}

class CreatePujariIn(BaseModel):
    full_name: str
    mobile: str
    email: Optional[str] = None
    password: str
    address: Optional[str] = None
    city: Optional[str] = None

@api.post("/admin/create-pujari")
async def create_pujari(data: CreatePujariIn, user: dict = Depends(require_admin)):
    mobile = data.mobile.strip()
    existing = await sql_fetch_one("SELECT id FROM dbo.users WHERE mobile = ?", (mobile,))
    if existing:
        raise HTTPException(400, "A user with this mobile already exists")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    u_id = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.users (id, full_name, mobile, email, address, city, pincode, "
        "password_hash, role, is_active, verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (u_id, data.full_name, mobile, data.email or "", data.address or "", data.city or "", "",
         hash_password(data.password), "poojari", 1, 1, now_naive())
    )
    return {"ok": True, "id": u_id, "role": "poojari", "full_name": data.full_name}

class CreateAdminIn(BaseModel):
    full_name: str
    mobile: str
    email: Optional[str] = None
    password: str
    city: Optional[str] = None

@api.post("/admin/create-admin")
async def create_admin_user(data: CreateAdminIn, user: dict = Depends(require_admin)):
    if user.get("role") != "super_admin":
        raise HTTPException(403, "Only super admins can create admin accounts")
    mobile = data.mobile.strip()
    existing = await sql_fetch_one("SELECT id FROM dbo.users WHERE mobile = ?", (mobile,))
    if existing:
        raise HTTPException(400, "A user with this mobile already exists")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    u_id = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.users (id, full_name, mobile, email, address, city, pincode, "
        "password_hash, role, is_active, verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (u_id, data.full_name, mobile, data.email or "", "", data.city or "", "",
         hash_password(data.password), "admin", 1, 1, now_naive())
    )
    return {"ok": True, "id": u_id, "role": "admin", "full_name": data.full_name}

@api.get("/admin/pujari-summary")
async def admin_pujari_summary(user: dict = Depends(require_admin)):
    pujaris = await sql_fetch_all(
        f"SELECT {USER_COLS} FROM dbo.users WHERE role = ? ORDER BY created_at DESC", ("poojari",)
    )
    result = []
    for p in pujaris:
        t_assigned = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ?", (p["id"],))
        t_paid = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ? AND payment_status = ?", (p["id"], "paid"))
        t_earned = await sql_scalar("SELECT ISNULL(SUM(pujari_amount), 0) AS v FROM dbo.bookings WHERE pujari_id = ? AND payment_status = ?", (p["id"], "paid"))
        p_count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ? AND pooja_type = ?", (p["id"], "pooja"))
        h_count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ? AND pooja_type = ?", (p["id"], "homam"))
        result.append({
            **p,
            "total_assigned": t_assigned,
            "total_paid": t_paid,
            "total_earned": float(t_earned) if isinstance(t_earned, Decimal) else (t_earned or 0),
            "pooja_count": p_count,
            "homam_count": h_count,
        })
    return result

@api.get("/pujari/stats")
async def pujari_stats(user: dict = Depends(require_poojari_or_admin)):
    uid = user["id"]
    t_assigned = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ?", (uid,))
    t_paid = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ? AND payment_status = ?", (uid, "paid"))
    t_earned = await sql_scalar("SELECT ISNULL(SUM(pujari_amount), 0) AS v FROM dbo.bookings WHERE pujari_id = ? AND payment_status = ?", (uid, "paid"))
    p_count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ? AND pooja_type = ?", (uid, "pooja"))
    h_count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.bookings WHERE pujari_id = ? AND pooja_type = ?", (uid, "homam"))
    return {
        "total_assigned": t_assigned,
        "total_paid": t_paid,
        "total_earned": float(t_earned) if isinstance(t_earned, Decimal) else (t_earned or 0),
        "pooja_count": p_count,
        "homam_count": h_count,
    }

@api.get("/pujari/bookings")
async def pujari_bookings(user: dict = Depends(require_poojari_or_admin)):
    return await sql_fetch_all(
        f"SELECT TOP 500 {BOOKING_COLS} FROM dbo.bookings WHERE pujari_id = ? ORDER BY created_at DESC",
        (user["id"],)
    )

@api.post("/pujari/start-live/{booking_id}")
async def pujari_start_live(booking_id: str, user: dict = Depends(require_poojari_or_admin)):
    """Create (or return existing) Agora live stream for a pujari's assigned booking."""
    booking = await sql_fetch_one(
        "SELECT id, pooja_id, pooja_name, devotee_name, temple_id "
        "FROM dbo.bookings WHERE id = ? AND pujari_id = ?",
        (booking_id, user["id"])
    )
    if not booking:
        raise HTTPException(404, "Booking not found or not assigned to you")

    channel_name = f"book_{booking_id.replace('-', '')[:12]}"

    # Return existing stream if already created for this booking
    existing = await sql_fetch_one(
        f"SELECT {STREAM_COLS} FROM dbo.live_streams WHERE channel_name = ?",
        (channel_name,)
    )
    if existing:
        # Re-mark as live in case it was stopped
        await sql_execute("UPDATE dbo.live_streams SET is_live = 1 WHERE id = ?", (existing["id"],))
        existing["is_live"] = True
        return existing

    s_id = str(uuid.uuid4())
    title = f"Live Pooja: {booking.get('pooja_name', 'Pooja')} — {booking.get('devotee_name', 'Devotee')}"
    temple_id = booking.get("temple_id") or ""

    await sql_execute(
        "INSERT INTO dbo.live_streams (id, temple_id, pooja_id, title, stream_url, channel_name, "
        "provider, is_paid_only, is_live, is_approved, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (s_id, temple_id, booking.get("pooja_id"), title, "", channel_name,
         "agora", 0, 1, 1, now_naive())
    )
    try:
        tokens = await _tokens_for_topic("live")
        fire_and_forget_push(
            tokens,
            title=f"\U0001f534 LIVE — {title}",
            body="A live pooja has started. Tap to watch.",
            data={"type": "live_stream_started", "streamId": s_id, "url": f"/live-stream/{s_id}"},
        )
    except Exception as e:
        logger.warning("push (pujari livestream) failed: %s", e)
    return await sql_fetch_one(f"SELECT {STREAM_COLS} FROM dbo.live_streams WHERE id = ?", (s_id,))

@api.put("/bookings/{booking_id}/assign-pujari")
async def assign_pujari_to_booking(booking_id: str, pujari_id: str, user: dict = Depends(require_admin)):
    booking = await sql_fetch_one(
        "SELECT id, amount, payment_status, pujari_amount FROM dbo.bookings WHERE id = ?", (booking_id,)
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    pujari = await sql_fetch_one(
        "SELECT id, full_name FROM dbo.users WHERE id = ? AND role = ?", (pujari_id, "poojari")
    )
    if not pujari:
        raise HTTPException(404, "Pujari not found")

    # If booking is already paid but amounts not set (assigned after payment), calculate now
    if booking.get("payment_status") == "paid" and not booking.get("pujari_amount"):
        amt = float(booking.get("amount") or 0)
        co_amt = round(amt * COMPANY_PERCENTAGE, 2)
        pu_amt = round(amt - co_amt, 2)
        await sql_execute(
            "UPDATE dbo.bookings SET pujari_id=?, pujari_amount=?, company_amount=? WHERE id=?",
            (pujari_id, pu_amt, co_amt, booking_id)
        )
    else:
        await sql_execute("UPDATE dbo.bookings SET pujari_id = ? WHERE id = ?", (pujari_id, booking_id))

    logger.info("[Assign] Booking %s → Pujari %s (%s) by admin %s",
                booking_id[:8], pujari["full_name"], pujari_id[:8], user.get("full_name"))
    return {"ok": True, "pujari_name": pujari["full_name"]}

# ----------------------------- Pujari Wallet & Complete ----------------------
class CompleteBookingIn(BaseModel):
    video_url: Optional[str] = ""

@api.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, data: CompleteBookingIn, user: dict = Depends(require_poojari_or_admin)):
    b = await sql_fetch_one(f"SELECT {BOOKING_COLS} FROM dbo.bookings WHERE id = ?", (booking_id,))
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["role"] == "poojari" and b.get("pujari_id") != user["id"]:
        raise HTTPException(403, "Not your booking")
    if b.get("payment_status") != "paid":
        raise HTTPException(400, "Booking not paid yet")
    if b.get("pujari_paid"):
        raise HTTPException(400, "Already completed")
    pujari_amt = float(b.get("pujari_amount") or 0)
    await sql_execute(
        "UPDATE dbo.bookings SET status='completed', completed_at=?, completion_video_url=?, pujari_paid=1 WHERE id=?",
        (now_naive(), data.video_url, booking_id)
    )
    if b.get("pujari_id") and pujari_amt > 0:
        await sql_execute(
            "UPDATE dbo.users SET wallet_balance = ISNULL(wallet_balance, 0) + ? WHERE id = ?",
            (pujari_amt, b["pujari_id"])
        )
        payout_id = str(uuid.uuid4())
        desc = f"Earnings: {b.get('pooja_name','Pooja')} — {b.get('devotee_name', '')}"
        await sql_execute(
            "INSERT INTO dbo.wallet_payouts (id, pujari_id, booking_id, amount, description, status, created_at) VALUES (?,?,?,?,?,'pending',?)",
            (payout_id, b["pujari_id"], booking_id, pujari_amt, desc, now_naive())
        )
    return {"ok": True, "credited": pujari_amt}

@api.get("/pujari/wallet")
async def pujari_wallet(user: dict = Depends(require_poojari_or_admin)):
    bal = await sql_scalar("SELECT ISNULL(wallet_balance, 0) AS bal FROM dbo.users WHERE id = ?", (user["id"],))
    payouts = await sql_fetch_all(
        "SELECT TOP 100 id, booking_id, amount, description, status, payment_ref, created_at, paid_at "
        "FROM dbo.wallet_payouts WHERE pujari_id = ? ORDER BY created_at DESC",
        (user["id"],)
    )
    pending_amt = sum(float(p.get("amount") or 0) for p in payouts if p.get("status") == "pending")
    paid_amt = sum(float(p.get("amount") or 0) for p in payouts if p.get("status") == "paid")
    return {
        "balance": float(bal) if isinstance(bal, Decimal) else float(bal or 0),
        "pending_payout": pending_amt,
        "total_paid_out": paid_amt,
        "transactions": payouts,
    }

class UpiIn(BaseModel):
    upi_id: str

@api.put("/pujari/profile/upi")
async def update_upi(data: UpiIn, user: dict = Depends(require_poojari_or_admin)):
    upi = data.upi_id.strip()
    if not upi:
        raise HTTPException(400, "UPI ID required")
    await sql_execute("UPDATE dbo.users SET upi_id = ? WHERE id = ?", (upi, user["id"]))
    return {"ok": True}

@api.get("/pujari/profile/upi")
async def get_upi(user: dict = Depends(require_poojari_or_admin)):
    rec = await sql_fetch_one("SELECT upi_id FROM dbo.users WHERE id = ?", (user["id"],))
    return {"upi_id": rec.get("upi_id") if rec else None}

# ----------------------------- Admin Pujari Payouts --------------------------
@api.get("/admin/pujari-payouts")
async def admin_pujari_payouts(user: dict = Depends(require_admin)):
    rows = await sql_fetch_all(
        """SELECT u.id AS pujari_id, u.full_name, u.mobile, u.upi_id,
                  ISNULL(u.wallet_balance, 0) AS wallet_balance,
                  COUNT(wp.id) AS pending_count,
                  ISNULL(SUM(CASE WHEN wp.status='pending' THEN wp.amount ELSE 0 END), 0) AS pending_amount
           FROM dbo.users u
           LEFT JOIN dbo.wallet_payouts wp ON wp.pujari_id = u.id AND wp.status = 'pending'
           WHERE u.role = 'poojari'
           GROUP BY u.id, u.full_name, u.mobile, u.upi_id, u.wallet_balance
           ORDER BY pending_amount DESC""",
        ()
    )
    return rows

@api.get("/admin/pujari-payouts/{pujari_id}/history")
async def admin_payout_history(pujari_id: str, user: dict = Depends(require_admin)):
    rows = await sql_fetch_all(
        "SELECT id, booking_id, amount, description, status, payment_ref, created_at, paid_at "
        "FROM dbo.wallet_payouts WHERE pujari_id = ? ORDER BY created_at DESC",
        (pujari_id,)
    )
    return rows

class PayoutMarkIn(BaseModel):
    payment_ref: str
    amount: Optional[float] = None

@api.post("/admin/pujari-payouts/{pujari_id}/pay")
async def admin_mark_payout(pujari_id: str, data: PayoutMarkIn, user: dict = Depends(require_admin)):
    ref = data.payment_ref.strip()
    if not ref:
        raise HTTPException(400, "PhonePe/UPI reference required")
    pending = await sql_fetch_all(
        "SELECT id, amount FROM dbo.wallet_payouts WHERE pujari_id = ? AND status = 'pending'",
        (pujari_id,)
    )
    if not pending:
        raise HTTPException(400, "No pending payouts for this pujari")
    total = sum(float(p.get("amount") or 0) for p in pending)
    ids = [p["id"] for p in pending]
    now = now_naive()
    for pid in ids:
        await sql_execute(
            "UPDATE dbo.wallet_payouts SET status='paid', payment_ref=?, admin_id=?, paid_at=? WHERE id=?",
            (ref, user["id"], now, pid)
        )
    await sql_execute(
        "UPDATE dbo.users SET wallet_balance = ISNULL(wallet_balance,0) - ? WHERE id = ?",
        (total, pujari_id)
    )
    pujari = await sql_fetch_one("SELECT full_name, mobile FROM dbo.users WHERE id = ?", (pujari_id,))
    logger.info("[Payout] ₹%.2f → pujari %s by admin %s ref:%s", total, pujari_id[:8], user["id"][:8], ref)
    return {"ok": True, "paid_amount": total, "pujari_name": pujari.get("full_name") if pujari else ""}

# ----------------------------- Admin broadcast notification ------------------
class BroadcastNotifIn(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/(tabs)/index"

@api.post("/admin/broadcast-notification")
async def admin_broadcast_notification(data: BroadcastNotifIn, user: dict = Depends(require_admin)):
    """Send a push notification to ALL registered devices."""
    rows = await sql_fetch_all("SELECT TOP 5000 token FROM dbo.push_tokens")
    tokens = [r["token"] for r in rows if r.get("token")]
    if not tokens:
        return {"ok": False, "sent": 0, "reason": "no tokens registered"}
    result = await send_expo_push(tokens, title=data.title, body=data.body, data={"url": data.url or "/(tabs)/index"})
    return {"ok": True, "total_tokens": len(tokens), **result}

# ----------------------------- Notification Prefs ----------------------------
class NotifPrefsIn(BaseModel):
    notify_pooja: bool = True
    notify_video: bool = True
    notify_live: bool = True
    notify_booking: bool = True

@api.get("/users/notification-prefs")
async def get_notif_prefs(user: dict = Depends(get_current_user)):
    r = await sql_fetch_one(
        "SELECT ISNULL(notify_pooja,1) AS notify_pooja, ISNULL(notify_video,1) AS notify_video, "
        "ISNULL(notify_live,1) AS notify_live, ISNULL(notify_booking,1) AS notify_booking "
        "FROM dbo.users WHERE id = ?",
        (user["id"],)
    )
    if not r:
        return {"notify_pooja": True, "notify_video": True, "notify_live": True, "notify_booking": True}
    return {k: bool(v) for k, v in r.items()}

@api.put("/users/notification-prefs")
async def set_notif_prefs(data: NotifPrefsIn, user: dict = Depends(get_current_user)):
    await sql_execute(
        "UPDATE dbo.users SET notify_pooja=?, notify_video=?, notify_live=?, notify_booking=? WHERE id=?",
        (1 if data.notify_pooja else 0, 1 if data.notify_video else 0,
         1 if data.notify_live else 0, 1 if data.notify_booking else 0, user["id"])
    )
    return {"ok": True}

# ═══════════════════════════════════════════════════════════════════════════════
# ACCOMMODATION SYSTEM — Models + Routes
# ═══════════════════════════════════════════════════════════════════════════════

class PropertyIn(BaseModel):
    temple_id: Optional[str] = None
    name: str
    type: str = "hotel"
    address: str
    city: Optional[str] = ""
    phone: Optional[str] = ""
    description: str
    images: Optional[str] = ""
    amenities: Optional[str] = ""
    check_in_time: Optional[str] = "12:00"
    check_out_time: Optional[str] = "11:00"
    total_rooms: int = 0
    upi_id: Optional[str] = ""

class RoomCategoryIn(BaseModel):
    property_id: str
    name: str
    description: Optional[str] = ""
    price_per_night: float
    capacity: int = 2
    total_rooms: int = 10
    amenities: Optional[str] = ""
    images: Optional[str] = ""

class QuotaSetIn(BaseModel):
    room_category_id: str
    dates: list
    quota: int

class AccommodationBookingIn(BaseModel):
    property_id: str
    room_category_id: str
    check_in: str
    check_out: str
    guests: int = 1
    rooms: int = 1
    guest_name: str
    guest_mobile: str
    special_requests: Optional[str] = ""
    pooja_booking_id: Optional[str] = None

class AccomPaymentConfirmIn(BaseModel):
    booking_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

class UpiBookingPaymentIn(BaseModel):
    booking_id: str
    utr_number: str

class PropertyManagerIn(BaseModel):
    manager_id: str

_PROP_COLS = (
    "p.id, p.temple_id, p.name, p.type, p.address, p.city, p.phone, "
    "p.description, p.images, p.amenities, p.check_in_time, p.check_out_time, "
    "p.rating, p.total_rooms, p.is_active, p.manager_id, p.upi_id, p.created_at, "
    "t.name AS temple_name, t.location AS temple_location, "
    "(SELECT MIN(rc.price_per_night) FROM dbo.room_categories rc WHERE rc.property_id=p.id AND rc.is_active=1) AS min_price"
)

_ABOOKING_COLS = (
    "ab.id, ab.user_id, ab.property_id, ab.room_category_id, ab.check_in, ab.check_out, "
    "ab.guests, ab.rooms, ab.total_nights, ab.amount, ab.status, ab.payment_status, "
    "ab.razorpay_order_id, ab.guest_name, ab.guest_mobile, ab.special_requests, "
    "ab.property_name, ab.room_category_name, ab.pooja_booking_id, ab.created_at, "
    "u.full_name AS user_full_name, u.mobile AS user_mobile_no"
)

# ── Properties (public + admin) ───────────────────────────────────────────────

@api.get("/properties")
async def list_properties(temple_id: Optional[str] = None, type: Optional[str] = None, active_only: bool = False):
    wheres = ["1=1"]
    params: list = []
    if temple_id:
        wheres.append("p.temple_id = ?")
        params.append(temple_id)
    if type:
        wheres.append("p.type = ?")
        params.append(type)
    if active_only:
        wheres.append("p.is_active = 1")
    rows = await sql_fetch_all(
        f"SELECT {_PROP_COLS} FROM dbo.accommodation_properties p "
        f"LEFT JOIN dbo.temples t ON t.id = p.temple_id "
        f"WHERE {' AND '.join(wheres)} ORDER BY p.created_at DESC",
        params if params else None
    )
    return rows

@api.get("/properties/{property_id}")
async def get_property(property_id: str):
    prop = await sql_fetch_one(
        f"SELECT {_PROP_COLS} FROM dbo.accommodation_properties p "
        f"LEFT JOIN dbo.temples t ON t.id = p.temple_id WHERE p.id = ?",
        (property_id,)
    )
    if not prop:
        raise HTTPException(404, "Property not found")
    cats = await sql_fetch_all(
        "SELECT * FROM dbo.room_categories WHERE property_id = ? AND is_active = 1 ORDER BY price_per_night",
        (property_id,)
    )
    prop["room_categories"] = cats
    return prop

@api.post("/properties")
async def create_property(data: PropertyIn, user: dict = Depends(require_admin)):
    pid = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.accommodation_properties "
        "(id, temple_id, name, type, address, city, phone, description, images, amenities, "
        "check_in_time, check_out_time, total_rooms, is_active, upi_id, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)",
        (pid, data.temple_id, data.name, data.type, data.address, data.city or "",
         data.phone or "", data.description, data.images or "", data.amenities or "",
         data.check_in_time or "12:00", data.check_out_time or "11:00",
         data.total_rooms, data.upi_id or "", now_naive())
    )
    return {"id": pid, "ok": True}

@api.put("/properties/{property_id}")
async def update_property(property_id: str, data: PropertyIn, user: dict = Depends(require_hotel_manager_or_admin)):
    if user["role"] == "hotel_manager":
        prop = await sql_fetch_one("SELECT manager_id FROM dbo.accommodation_properties WHERE id = ?", (property_id,))
        if not prop or prop.get("manager_id") != user["id"]:
            raise HTTPException(403, "You can only manage your assigned property")
    await sql_execute(
        "UPDATE dbo.accommodation_properties SET name=?, type=?, address=?, city=?, phone=?, "
        "description=?, images=?, amenities=?, check_in_time=?, check_out_time=?, total_rooms=?, upi_id=? WHERE id=?",
        (data.name, data.type, data.address, data.city or "", data.phone or "",
         data.description, data.images or "", data.amenities or "",
         data.check_in_time or "12:00", data.check_out_time or "11:00", data.total_rooms,
         data.upi_id or "", property_id)
    )
    return {"ok": True}

@api.put("/properties/{property_id}/activate")
async def activate_property(property_id: str, body: dict, user: dict = Depends(require_super_admin)):
    is_active = 1 if body.get("is_active") else 0
    await sql_execute("UPDATE dbo.accommodation_properties SET is_active=? WHERE id=?", (is_active, property_id))
    return {"ok": True}

@api.put("/properties/{property_id}/manager")
async def assign_manager(property_id: str, data: PropertyManagerIn, user: dict = Depends(require_admin)):
    mgr = await sql_fetch_one("SELECT id FROM dbo.users WHERE id = ? AND role = 'hotel_manager'", (data.manager_id,))
    if not mgr:
        raise HTTPException(404, "Hotel manager user not found — assign role first")
    await sql_execute("UPDATE dbo.accommodation_properties SET manager_id=? WHERE id=?", (data.manager_id, property_id))
    return {"ok": True}

@api.delete("/properties/{property_id}")
async def delete_property(property_id: str, user: dict = Depends(require_super_admin)):
    await sql_execute("DELETE FROM dbo.room_categories WHERE property_id = ?", (property_id,))
    await sql_execute("DELETE FROM dbo.accommodation_properties WHERE id = ?", (property_id,))
    return {"ok": True}

# ── Room Categories ───────────────────────────────────────────────────────────

@api.get("/properties/{property_id}/categories")
async def list_room_categories(property_id: str):
    rows = await sql_fetch_all(
        "SELECT * FROM dbo.room_categories WHERE property_id = ? ORDER BY price_per_night",
        (property_id,)
    )
    return rows

@api.post("/room-categories")
async def create_room_category(data: RoomCategoryIn, user: dict = Depends(require_hotel_manager_or_admin)):
    if user["role"] == "hotel_manager":
        prop = await sql_fetch_one("SELECT manager_id FROM dbo.accommodation_properties WHERE id = ?", (data.property_id,))
        if not prop or prop.get("manager_id") != user["id"]:
            raise HTTPException(403, "Not your property")
    cid = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.room_categories (id, property_id, name, description, price_per_night, "
        "capacity, total_rooms, amenities, images, is_active, created_at) VALUES (?,?,?,?,?,?,?,?,?,1,?)",
        (cid, data.property_id, data.name, data.description or "", data.price_per_night,
         data.capacity, data.total_rooms, data.amenities or "", data.images or "", now_naive())
    )
    return {"id": cid, "ok": True}

@api.put("/room-categories/{cat_id}")
async def update_room_category(cat_id: str, data: RoomCategoryIn, user: dict = Depends(require_hotel_manager_or_admin)):
    await sql_execute(
        "UPDATE dbo.room_categories SET name=?, description=?, price_per_night=?, capacity=?, "
        "total_rooms=?, amenities=?, images=? WHERE id=?",
        (data.name, data.description or "", data.price_per_night, data.capacity,
         data.total_rooms, data.amenities or "", data.images or "", cat_id)
    )
    return {"ok": True}

@api.delete("/room-categories/{cat_id}")
async def delete_room_category(cat_id: str, user: dict = Depends(require_hotel_manager_or_admin)):
    if user["role"] == "hotel_manager":
        cat = await sql_fetch_one(
            "SELECT rc.id FROM dbo.room_categories rc "
            "JOIN dbo.accommodation_properties p ON p.id = rc.property_id "
            "WHERE rc.id = ? AND p.manager_id = ?",
            (cat_id, user["id"])
        )
        if not cat:
            raise HTTPException(403, "Room category not in your property")
    await sql_execute("DELETE FROM dbo.room_quotas WHERE room_category_id = ?", (cat_id,))
    await sql_execute("DELETE FROM dbo.room_categories WHERE id = ?", (cat_id,))
    return {"ok": True}

# ── Quotas ────────────────────────────────────────────────────────────────────

@api.get("/room-categories/{cat_id}/quotas")
async def get_quotas(cat_id: str, from_date: str, to_date: str):
    rows = await sql_fetch_all(
        "SELECT CONVERT(VARCHAR(10), quota_date, 120) AS quota_date, total_quota, booked, "
        "(total_quota - booked) AS available "
        "FROM dbo.room_quotas WHERE room_category_id = ? AND quota_date BETWEEN ? AND ? ORDER BY quota_date",
        (cat_id, from_date, to_date)
    )
    return rows

@api.post("/quotas/set")
async def set_quotas(data: QuotaSetIn, user: dict = Depends(require_hotel_manager_or_admin)):
    if user["role"] == "hotel_manager":
        cat = await sql_fetch_one(
            "SELECT rc.id FROM dbo.room_categories rc "
            "JOIN dbo.accommodation_properties p ON p.id = rc.property_id "
            "WHERE rc.id = ? AND p.manager_id = ?",
            (data.room_category_id, user["id"])
        )
        if not cat:
            raise HTTPException(403, "Room category not in your property")
    for d in data.dates:
        existing = await sql_fetch_one(
            "SELECT id FROM dbo.room_quotas WHERE room_category_id = ? AND quota_date = ?",
            (data.room_category_id, d)
        )
        if existing:
            await sql_execute(
                "UPDATE dbo.room_quotas SET total_quota=? WHERE room_category_id=? AND quota_date=?",
                (data.quota, data.room_category_id, d)
            )
        else:
            await sql_execute(
                "INSERT INTO dbo.room_quotas (id, room_category_id, quota_date, total_quota, booked) VALUES (?,?,?,?,0)",
                (str(uuid.uuid4()), data.room_category_id, d, data.quota)
            )
    return {"ok": True, "dates_set": len(data.dates)}

# ── Accommodation Bookings ────────────────────────────────────────────────────

@api.post("/accommodation-bookings")
async def create_accommodation_booking(data: AccommodationBookingIn, user: dict = Depends(get_current_user)):
    from datetime import date as _date, timedelta as _td
    try:
        ci = _date.fromisoformat(data.check_in)
        co = _date.fromisoformat(data.check_out)
    except ValueError:
        raise HTTPException(400, "Invalid dates — use YYYY-MM-DD")
    if co <= ci:
        raise HTTPException(400, "Check-out must be after check-in")
    nights = (co - ci).days

    cat = await sql_fetch_one(
        "SELECT rc.price_per_night, rc.name AS cat_name, ap.name AS prop_name, ap.is_active "
        "FROM dbo.room_categories rc "
        "JOIN dbo.accommodation_properties ap ON ap.id = rc.property_id "
        "WHERE rc.id = ? AND ap.id = ? AND rc.is_active = 1",
        (data.room_category_id, data.property_id)
    )
    if not cat:
        raise HTTPException(404, "Room category not found")
    if not cat.get("is_active"):
        raise HTTPException(400, "Property is not accepting bookings")

    # Check quota for each night
    cur = ci
    while cur < co:
        dn = cur.isoformat()
        quota = await sql_fetch_one(
            "SELECT total_quota, booked FROM dbo.room_quotas WHERE room_category_id=? AND quota_date=?",
            (data.room_category_id, dn)
        )
        if quota:
            available = int(quota.get("total_quota") or 0) - int(quota.get("booked") or 0)
            if available < data.rooms:
                raise HTTPException(400, f"Not enough rooms available for {dn}")
        cur += _td(days=1)

    amount = float(cat["price_per_night"]) * nights * data.rooms
    bid = str(uuid.uuid4())
    rzp_order_id = None
    if RAZORPAY_ENABLED:
        try:
            order = _rzp_client.order.create({"amount": int(amount * 100), "currency": "INR", "receipt": f"accom_{bid[:8]}"})
            rzp_order_id = order["id"]
        except Exception as e:
            logger.warning("Razorpay accom order failed: %s", e)

    await sql_execute(
        "INSERT INTO dbo.accommodation_bookings "
        "(id,user_id,property_id,room_category_id,check_in,check_out,guests,rooms,total_nights,"
        "amount,status,payment_status,razorpay_order_id,guest_name,guest_mobile,special_requests,"
        "property_name,room_category_name,pooja_booking_id,created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (bid, user["id"], data.property_id, data.room_category_id,
         data.check_in, data.check_out, data.guests, data.rooms, nights,
         amount, "pending_payment", "pending", rzp_order_id,
         data.guest_name, data.guest_mobile, data.special_requests or "",
         cat.get("prop_name", ""), cat.get("cat_name", ""),
         data.pooja_booking_id, now_naive())
    )
    return {
        "id": bid, "amount": amount, "nights": nights,
        "razorpay_order_id": rzp_order_id,
        "razorpay_key_id": os.getenv("RAZORPAY_KEY_ID") if RAZORPAY_ENABLED else None,
    }

@api.post("/accommodation-bookings/confirm-payment")
async def confirm_accom_payment(data: AccomPaymentConfirmIn, user: dict = Depends(get_current_user)):
    booking = await sql_fetch_one(
        "SELECT * FROM dbo.accommodation_bookings WHERE id=? AND user_id=?",
        (data.booking_id, user["id"])
    )
    if not booking:
        raise HTTPException(404, "Booking not found")

    if RAZORPAY_ENABLED and data.razorpay_signature:
        import hmac, hashlib as _hl
        msg = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        sig = hmac.new(os.getenv("RAZORPAY_KEY_SECRET", "").encode(), msg.encode(), _hl.sha256).hexdigest()
        if sig != data.razorpay_signature:
            raise HTTPException(400, "Payment signature verification failed")

    await sql_execute(
        "UPDATE dbo.accommodation_bookings SET payment_status='paid', status='confirmed', "
        "razorpay_payment_id=?, razorpay_signature=? WHERE id=?",
        (data.razorpay_payment_id or "", data.razorpay_signature or "", data.booking_id)
    )

    from datetime import date as _date2, timedelta as _td2
    ci = _date2.fromisoformat(str(booking["check_in"])[:10])
    co = _date2.fromisoformat(str(booking["check_out"])[:10])
    rooms_booked = int(booking.get("rooms") or 1)
    cur = ci
    while cur < co:
        dn = cur.isoformat()
        q_row = await sql_fetch_one(
            "SELECT id FROM dbo.room_quotas WHERE room_category_id=? AND quota_date=?",
            (booking["room_category_id"], dn)
        )
        if q_row:
            await sql_execute(
                "UPDATE dbo.room_quotas SET booked=booked+? WHERE room_category_id=? AND quota_date=?",
                (rooms_booked, booking["room_category_id"], dn)
            )
        cur += _td2(days=1)

    return {"ok": True, "status": "confirmed"}

@api.post("/accommodation-bookings/upi-payment")
async def upi_accom_payment(data: UpiBookingPaymentIn, user: dict = Depends(get_current_user)):
    booking = await sql_fetch_one(
        "SELECT * FROM dbo.accommodation_bookings WHERE id=? AND user_id=?",
        (data.booking_id, user["id"])
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    utr = data.utr_number.strip().upper()
    if not utr:
        raise HTTPException(400, "UTR number required")
    await sql_execute(
        "UPDATE dbo.accommodation_bookings SET payment_status='upi_submitted', status='pending', "
        "razorpay_payment_id=? WHERE id=?",
        (f"UTR:{utr}", data.booking_id)
    )
    return {"ok": True, "status": "upi_submitted"}

@api.get("/accommodation-bookings/mine")
async def my_accommodation_bookings(user: dict = Depends(get_current_user)):
    rows = await sql_fetch_all(
        f"SELECT {_ABOOKING_COLS} FROM dbo.accommodation_bookings ab "
        f"LEFT JOIN dbo.users u ON u.id = ab.user_id "
        f"WHERE ab.user_id=? ORDER BY ab.created_at DESC",
        (user["id"],)
    )
    return rows

@api.get("/accommodation-bookings")
async def list_accommodation_bookings(
    user: dict = Depends(require_hotel_manager_or_admin),
    property_id: Optional[str] = None,
    status: Optional[str] = None,
):
    wheres = ["1=1"]
    params: list = []
    if user["role"] == "hotel_manager":
        prop = await sql_fetch_one(
            "SELECT id FROM dbo.accommodation_properties WHERE manager_id=?", (user["id"],)
        )
        if not prop:
            return []
        wheres.append("ab.property_id=?")
        params.append(prop["id"])
    elif property_id:
        wheres.append("ab.property_id=?")
        params.append(property_id)
    if status:
        wheres.append("ab.status=?")
        params.append(status)
    rows = await sql_fetch_all(
        f"SELECT {_ABOOKING_COLS} FROM dbo.accommodation_bookings ab "
        f"LEFT JOIN dbo.users u ON u.id = ab.user_id "
        f"WHERE {' AND '.join(wheres)} ORDER BY ab.created_at DESC",
        params if params else None
    )
    return rows

# ── Hotel Manager Dashboard ───────────────────────────────────────────────────

@api.get("/hotel-manager/dashboard")
async def hotel_manager_dashboard(user: dict = Depends(require_hotel_manager_or_admin)):
    prop = await sql_fetch_one(
        f"SELECT {_PROP_COLS} FROM dbo.accommodation_properties p "
        f"LEFT JOIN dbo.temples t ON t.id = p.temple_id WHERE p.manager_id=?",
        (user["id"],)
    )
    if not prop:
        return {"property": None, "stats": {}}
    pid = prop["id"]
    total_bk = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.accommodation_bookings WHERE property_id=?", (pid,))
    confirmed = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.accommodation_bookings WHERE property_id=? AND status='confirmed'", (pid,))
    revenue = await sql_scalar("SELECT ISNULL(SUM(amount),0) AS v FROM dbo.accommodation_bookings WHERE property_id=? AND payment_status='paid'", (pid,))
    cat_count = await sql_scalar("SELECT COUNT(*) AS v FROM dbo.room_categories WHERE property_id=? AND is_active=1", (pid,))
    return {
        "property": prop,
        "stats": {
            "total_bookings": total_bk,
            "confirmed_bookings": confirmed,
            "revenue": revenue,
            "room_categories": cat_count,
        }
    }

# ── Admin Properties Management ───────────────────────────────────────────────

@api.get("/admin/properties")
async def admin_list_properties(user: dict = Depends(require_admin)):
    rows = await sql_fetch_all(
        f"SELECT {_PROP_COLS}, "
        f"(SELECT COUNT(*) FROM dbo.room_categories rc WHERE rc.property_id=p.id AND rc.is_active=1) AS room_category_count, "
        f"(SELECT COUNT(*) FROM dbo.accommodation_bookings ab WHERE ab.property_id=p.id AND ab.status='confirmed') AS confirmed_bookings, "
        f"mgr.full_name AS manager_name, mgr.mobile AS manager_mobile "
        f"FROM dbo.accommodation_properties p "
        f"LEFT JOIN dbo.temples t ON t.id=p.temple_id "
        f"LEFT JOIN dbo.users mgr ON mgr.id=p.manager_id "
        f"ORDER BY p.created_at DESC"
    )
    return rows

@api.get("/admin/hotel-managers")
async def list_hotel_managers(user: dict = Depends(require_admin)):
    rows = await sql_fetch_all(
        "SELECT id, full_name, mobile, email, is_active FROM dbo.users WHERE role='hotel_manager' ORDER BY full_name"
    )
    return rows

@api.put("/admin/users/{user_id}/set-hotel-manager")
async def set_hotel_manager_role(user_id: str, user: dict = Depends(require_super_admin)):
    target = await sql_fetch_one("SELECT id, role FROM dbo.users WHERE id=?", (user_id,))
    if not target:
        raise HTTPException(404, "User not found")
    await sql_execute("UPDATE dbo.users SET role='hotel_manager' WHERE id=?", (user_id,))
    return {"ok": True}

class HotelManagerCreateIn(BaseModel):
    full_name: str
    mobile: str
    email: str
    password: str

@api.post("/admin/create-hotel-manager")
async def create_hotel_manager(data: HotelManagerCreateIn, user: dict = Depends(require_admin)):
    mobile = re.sub(r"\D", "", data.mobile.strip())
    if mobile.startswith("91") and len(mobile) > 10:
        mobile = mobile[2:]
    if len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")
    email = data.email.strip().lower()
    if await sql_fetch_one("SELECT id FROM dbo.users WHERE mobile=?", (mobile,)):
        raise HTTPException(400, "Mobile already registered")
    if await sql_fetch_one("SELECT id FROM dbo.users WHERE email=?", (email,)):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    await sql_execute(
        "INSERT INTO dbo.users (id, full_name, mobile, email, address, city, pincode, "
        "password_hash, role, is_active, verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,1,1,?)",
        (uid, data.full_name.strip(), mobile, email, "", "", "",
         hash_password(data.password), "hotel_manager", now_naive())
    )
    return {"id": uid, "ok": True, "full_name": data.full_name, "mobile": mobile}

# ----------------------------- Wire up ---------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    pass  # pymssql connections are closed after each use
