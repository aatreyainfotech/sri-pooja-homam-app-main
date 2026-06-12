from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import random
import string
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from push_notify import send_expo_push, fire_and_forget_push
from agora_service import is_configured as agora_is_configured, build_rtc_token, get_app_id as get_agora_app_id

# ----------------------------- Config ----------------------------------------
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'sri_pooja_homam')
JWT_SECRET = os.environ.get('JWT_SECRET', 'sripoojahomam_jwt_secret_2026')
JWT_ALG = "HS256"
ADMIN_MOBILE = os.environ.get("ADMIN_MOBILE", "9999999999")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Super Admin")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Sri Pooja Homam API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ----------------------------- Helpers ---------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

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

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": now_utc() + timedelta(days=30),
        "iat": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def gen_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

def clean_user(u: dict) -> dict:
    if not u:
        return u
    u.pop("_id", None)
    u.pop("password_hash", None)
    return u

# ----------------------------- Auth dep --------------------------------------
async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account deactivated")
    user.pop("password_hash", None)
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

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

class LoginIn(BaseModel):
    mobile: str
    password: str

class TempleIn(BaseModel):
    name: str
    deity: str
    location: str
    description: str
    logo: str  # base64 or URL
    banner: str  # base64 or URL
    phone: Optional[str] = ""

class PoojaIn(BaseModel):
    temple_id: str
    name: str
    type: Literal["pooja", "homam"]
    description: str
    price: float
    duration: str  # e.g. "1 hour"
    image: str
    scheduled_at: Optional[str] = None  # ISO datetime

class BookingIn(BaseModel):
    pooja_id: str
    devotee_name: str
    gotra: Optional[str] = ""
    nakshatra: Optional[str] = ""
    notes: Optional[str] = ""

class VideoIn(BaseModel):
    temple_id: Optional[str] = None
    title: str
    caption: str
    video_url: str  # URL (YouTube/HLS)
    thumbnail: str

class LiveStreamIn(BaseModel):
    temple_id: str
    pooja_id: Optional[str] = None
    title: str
    stream_url: Optional[str] = ""  # HLS/YouTube fallback
    channel_name: Optional[str] = None  # Agora channel (auto-generated if empty)
    is_paid_only: bool = True
    is_live: bool = True
    provider: Optional[str] = "hls"  # "hls" | "agora"

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
    photo: str  # base64 data URL (data:image/jpeg;base64,...) or plain base64

class ProfileUpdateIn(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class PaymentConfirmIn(BaseModel):
    booking_id: str
    razorpay_payment_id: Optional[str] = None

# ----------------------------- Startup ---------------------------------------
_otp_store = {}  # mobile -> {otp, expires, pending_user}

@app.on_event("startup")
async def startup():
    await db.users.create_index("mobile", unique=True)
    await db.users.create_index("email", unique=True)
    await db.temples.create_index("id", unique=True)
    await db.poojas.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.videos.create_index("id", unique=True)
    await db.live_streams.create_index("id", unique=True)

    # Seed super admin
    existing = await db.users.find_one({"mobile": ADMIN_MOBILE})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "full_name": ADMIN_NAME,
            "mobile": ADMIN_MOBILE,
            "email": "admin@sripoojahomam.com",
            "address": "HQ",
            "city": "Hyderabad",
            "pincode": "500001",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "super_admin",
            "is_active": True,
            "verified": True,
            "created_at": to_iso(now_utc()),
        })
        logger.info(f"Seeded super_admin: {ADMIN_MOBILE}")
    else:
        # Refresh password if env changed
        if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.users.update_one({"mobile": ADMIN_MOBILE}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})

    # Seed demo data if empty
    if await db.temples.count_documents({}) == 0:
        await _seed_demo_data()

async def _seed_demo_data():
    temples = [
        {
            "id": str(uuid.uuid4()),
            "name": "Sri Venkateswara Temple",
            "deity": "Lord Venkateswara",
            "location": "Tirumala, Andhra Pradesh",
            "description": "One of the most sacred and visited Hindu temples, dedicated to Lord Venkateswara, an incarnation of Vishnu.",
            "logo": "https://images.pexels.com/photos/36587847/pexels-photo-36587847.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200",
            "banner": "https://images.pexels.com/photos/36609017/pexels-photo-36609017.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "phone": "+91 877 227 7777",
            "created_at": to_iso(now_utc()),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sri Kanaka Durga Temple",
            "deity": "Goddess Durga",
            "location": "Vijayawada, Andhra Pradesh",
            "description": "Ancient temple of Goddess Kanaka Durga on Indrakeeladri Hill, overlooking the Krishna River.",
            "logo": "https://images.pexels.com/photos/36587847/pexels-photo-36587847.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200",
            "banner": "https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "phone": "+91 866 257 1427",
            "created_at": to_iso(now_utc()),
        },
    ]
    await db.temples.insert_many([dict(t) for t in temples])

    poojas = []
    for t in temples:
        poojas.append({
            "id": str(uuid.uuid4()),
            "temple_id": t["id"],
            "name": "Abhishekam",
            "type": "pooja",
            "description": "Sacred bathing ritual of the deity with milk, honey, ghee and sacred water.",
            "price": 501.0,
            "duration": "45 mins",
            "image": "https://images.unsplash.com/photo-1635778976124-f609898bafc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "scheduled_at": to_iso(now_utc() + timedelta(days=2)),
            "created_at": to_iso(now_utc()),
        })
        poojas.append({
            "id": str(uuid.uuid4()),
            "temple_id": t["id"],
            "name": "Sudarshana Homam",
            "type": "homam",
            "description": "Powerful fire ritual to invoke Lord Sudarshana for protection and removal of obstacles.",
            "price": 1501.0,
            "duration": "2 hours",
            "image": "https://images.unsplash.com/photo-1763610650650-31a72ddc77dd?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "scheduled_at": to_iso(now_utc() + timedelta(days=5)),
            "created_at": to_iso(now_utc()),
        })
        poojas.append({
            "id": str(uuid.uuid4()),
            "temple_id": t["id"],
            "name": "Archana",
            "type": "pooja",
            "description": "108 name chanting with flowers and offerings in your name and gotra.",
            "price": 251.0,
            "duration": "30 mins",
            "image": "https://images.unsplash.com/photo-1635778976124-f609898bafc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "scheduled_at": to_iso(now_utc() + timedelta(days=1)),
            "created_at": to_iso(now_utc()),
        })
    await db.poojas.insert_many(poojas)

    await db.videos.insert_many([
        {
            "id": str(uuid.uuid4()),
            "temple_id": temples[0]["id"],
            "title": "Morning Suprabhatam",
            "caption": "Experience divine morning wake-up call chants at Tirumala",
            "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "thumbnail": "https://images.pexels.com/photos/36609017/pexels-photo-36609017.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "created_at": to_iso(now_utc()),
        },
        {
            "id": str(uuid.uuid4()),
            "temple_id": temples[1]["id"],
            "title": "Kanaka Durga Aarti",
            "caption": "Witness the powerful evening aarti of Goddess Durga",
            "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "thumbnail": "https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "created_at": to_iso(now_utc()),
        },
    ])

    await db.live_streams.insert_one({
        "id": str(uuid.uuid4()),
        "temple_id": temples[0]["id"],
        "pooja_id": None,
        "title": "Live Suprabhatam Seva",
        "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "is_paid_only": True,
        "is_live": True,
        "created_at": to_iso(now_utc()),
    })
    logger.info("Seeded demo data")

# ----------------------------- Auth Routes -----------------------------------
@api.get("/")
async def root():
    return {"message": "Sri Pooja Homam API", "status": "ok"}

@api.post("/auth/register")
async def register(data: RegisterIn):
    mobile = data.mobile.strip()
    email = data.email.lower()
    if await db.users.find_one({"mobile": mobile}):
        raise HTTPException(400, "Mobile already registered")
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")

    otp = gen_otp()
    _otp_store[mobile] = {
        "otp": otp,
        "expires": now_utc() + timedelta(minutes=10),
        "pending_user": {
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
        },
    }
    logger.info(f"[MOCK WhatsApp OTP] {mobile} -> {otp}")
    # MOCKED: returning OTP in response so user can proceed without real WhatsApp
    return {"message": "OTP sent via WhatsApp (MOCKED)", "mobile": mobile, "otp_mock": otp}

@api.post("/auth/verify-otp")
async def verify_otp(data: VerifyOtpIn):
    rec = _otp_store.get(data.mobile)
    if not rec:
        raise HTTPException(400, "No OTP requested for this mobile")
    if rec["expires"] < now_utc():
        _otp_store.pop(data.mobile, None)
        raise HTTPException(400, "OTP expired")
    if data.otp != rec["otp"]:
        raise HTTPException(400, "Invalid OTP")
    user = rec["pending_user"]
    user["verified"] = True
    await db.users.insert_one(dict(user))
    _otp_store.pop(data.mobile, None)
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": clean_user(user)}

@api.post("/auth/login")
async def login(data: LoginIn):
    u = await db.users.find_one({"mobile": data.mobile.strip()}, {"_id": 0})
    if not u or not verify_password(data.password, u.get("password_hash", "")):
        raise HTTPException(401, "Invalid mobile or password")
    if not u.get("is_active", True):
        raise HTTPException(403, "Account deactivated. Contact admin.")
    token = create_token(u["id"], u["role"])
    return {"token": token, "user": clean_user(u)}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.put("/users/me/photo")
async def update_profile_photo(data: ProfilePhotoIn, user: dict = Depends(get_current_user)):
    photo = (data.photo or "").strip()
    # Accept data URL or plain base64; always store a data URL
    if not photo:
        raise HTTPException(400, "photo required")
    if not photo.startswith("data:"):
        photo = f"data:image/jpeg;base64,{photo}"
    # Size guard: reject > 2MB encoded
    if len(photo) > 2_800_000:
        raise HTTPException(413, "Photo too large (max ~2MB). Please pick a smaller image.")
    await db.users.update_one({"id": user["id"]}, {"$set": {"photo_url": photo}})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

@api.delete("/users/me/photo")
async def delete_profile_photo(user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$unset": {"photo_url": ""}})
    return {"ok": True}

@api.put("/users/me")
async def update_profile(data: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    fields = {k: v for k, v in data.dict().items() if v is not None and v != ""}
    if not fields:
        raise HTTPException(400, "No fields to update")
    await db.users.update_one({"id": user["id"]}, {"$set": fields})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

# ----------------------------- Temples ---------------------------------------
@api.get("/temples")
async def list_temples():
    items = await db.temples.find({}, {"_id": 0}).to_list(500)
    return items

@api.get("/temples/{temple_id}")
async def get_temple(temple_id: str):
    t = await db.temples.find_one({"id": temple_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Temple not found")
    return t

@api.post("/temples")
async def create_temple(data: TempleIn, user: dict = Depends(require_admin)):
    t = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "created_at": to_iso(now_utc()),
    }
    await db.temples.insert_one(dict(t))
    return t

@api.put("/temples/{temple_id}")
async def update_temple(temple_id: str, data: TempleIn, user: dict = Depends(require_admin)):
    res = await db.temples.update_one({"id": temple_id}, {"$set": data.dict()})
    if not res.matched_count:
        raise HTTPException(404, "Temple not found")
    return await db.temples.find_one({"id": temple_id}, {"_id": 0})

@api.delete("/temples/{temple_id}")
async def delete_temple(temple_id: str, user: dict = Depends(require_super_admin)):
    await db.temples.delete_one({"id": temple_id})
    await db.poojas.delete_many({"temple_id": temple_id})
    return {"ok": True}

# ----------------------------- Poojas ----------------------------------------
@api.get("/poojas")
async def list_poojas(temple_id: Optional[str] = None, type: Optional[str] = None):
    q = {}
    if temple_id:
        q["temple_id"] = temple_id
    if type:
        q["type"] = type
    return await db.poojas.find(q, {"_id": 0}).to_list(500)

@api.get("/poojas/{pooja_id}")
async def get_pooja(pooja_id: str):
    p = await db.poojas.find_one({"id": pooja_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Pooja not found")
    return p

@api.post("/poojas")
async def create_pooja(data: PoojaIn, user: dict = Depends(require_admin)):
    p = {"id": str(uuid.uuid4()), **data.dict(), "created_at": to_iso(now_utc())}
    await db.poojas.insert_one(dict(p))
    return p

@api.put("/poojas/{pooja_id}")
async def update_pooja(pooja_id: str, data: PoojaIn, user: dict = Depends(require_admin)):
    res = await db.poojas.update_one({"id": pooja_id}, {"$set": data.dict()})
    if not res.matched_count:
        raise HTTPException(404, "Pooja not found")
    return await db.poojas.find_one({"id": pooja_id}, {"_id": 0})

@api.delete("/poojas/{pooja_id}")
async def delete_pooja(pooja_id: str, user: dict = Depends(require_admin)):
    await db.poojas.delete_one({"id": pooja_id})
    return {"ok": True}

# ----------------------------- Bookings --------------------------------------
@api.post("/bookings")
async def create_booking(data: BookingIn, user: dict = Depends(get_current_user)):
    pooja = await db.poojas.find_one({"id": data.pooja_id}, {"_id": 0})
    if not pooja:
        raise HTTPException(404, "Pooja not found")
    booking = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["full_name"],
        "user_mobile": user["mobile"],
        "pooja_id": data.pooja_id,
        "pooja_name": pooja["name"],
        "pooja_type": pooja["type"],
        "temple_id": pooja["temple_id"],
        "amount": pooja["price"],
        "devotee_name": data.devotee_name,
        "gotra": data.gotra,
        "nakshatra": data.nakshatra,
        "notes": data.notes,
        "status": "pending_payment",
        "payment_status": "pending",
        "razorpay_order_id": f"order_{uuid.uuid4().hex[:16]}",
        "razorpay_payment_id": None,
        "scheduled_at": pooja.get("scheduled_at"),
        "created_at": to_iso(now_utc()),
    }
    await db.bookings.insert_one(dict(booking))
    return booking

@api.post("/bookings/confirm-payment")
async def confirm_payment(data: PaymentConfirmIn, user: dict = Depends(get_current_user)):
    # MOCKED Razorpay payment confirmation
    booking = await db.bookings.find_one({"id": data.booking_id, "user_id": user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(404, "Booking not found")
    payment_id = data.razorpay_payment_id or f"pay_{uuid.uuid4().hex[:16]}"
    await db.bookings.update_one(
        {"id": data.booking_id},
        {"$set": {
            "status": "confirmed",
            "payment_status": "paid",
            "razorpay_payment_id": payment_id,
            "paid_at": to_iso(now_utc()),
        }},
    )
    updated = await db.bookings.find_one({"id": data.booking_id}, {"_id": 0})
    # 🔔 Push notification — booking confirmation
    try:
        tokens = await db.push_tokens.find({"user_id": user["id"]}, {"_id": 0}).to_list(20)
        fire_and_forget_push(
            [t["token"] for t in tokens],
            title="🙏 Booking Confirmed",
            body=f"Your {updated.get('pooja_name','pooja')} booking is confirmed. ₹{updated.get('amount',0)}",
            data={"type": "booking_confirmation", "bookingId": data.booking_id, "url": "/bookings"},
        )
    except Exception as e:
        logger.warning("push (booking) failed: %s", e)
    return updated

@api.get("/bookings/mine")
async def my_bookings(user: dict = Depends(get_current_user)):
    items = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api.get("/bookings")
async def list_bookings(user: dict = Depends(require_admin)):
    items = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

# ----------------------------- Videos ----------------------------------------
@api.get("/videos")
async def list_videos(temple_id: Optional[str] = None):
    q = {}
    if temple_id:
        q["temple_id"] = temple_id
    return await db.videos.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.post("/videos")
async def create_video(data: VideoIn, user: dict = Depends(require_admin)):
    v = {"id": str(uuid.uuid4()), **data.dict(), "created_at": to_iso(now_utc())}
    await db.videos.insert_one(dict(v))
    return v

@api.delete("/videos/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(require_admin)):
    await db.videos.delete_one({"id": video_id})
    return {"ok": True}

# ----------------------------- Live Streams ----------------------------------
@api.get("/live-streams")
async def list_live_streams():
    items = await db.live_streams.find({"is_live": True}, {"_id": 0}).to_list(100)
    return items

@api.get("/live-streams/config")
async def live_stream_config():
    """Publicly tells the client whether Agora broadcasting is available."""
    return {
        "agora_configured": agora_is_configured(),
        "agora_app_id": get_agora_app_id() if agora_is_configured() else None,
    }

@api.get("/live-streams/{stream_id}")
async def get_live_stream(stream_id: str, user: dict = Depends(get_current_user)):
    s = await db.live_streams.find_one({"id": stream_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Live stream not found")
    # If paid-only, verify user has any confirmed booking for this temple
    if s.get("is_paid_only") and user["role"] == "devotee":
        has_paid = await db.bookings.find_one({
            "user_id": user["id"],
            "temple_id": s["temple_id"],
            "payment_status": "paid",
        })
        if not has_paid:
            raise HTTPException(403, "Live stream available only for paid devotees of this temple. Book any pooja to unlock.")
    return s

@api.post("/live-streams")
async def create_live_stream(data: LiveStreamIn, user: dict = Depends(require_admin)):
    s = {"id": str(uuid.uuid4()), **data.dict(), "created_at": to_iso(now_utc())}
    await db.live_streams.insert_one(dict(s))
    # 🔔 Push notification — live stream started (only if is_live)
    if s.get("is_live"):
        try:
            tokens = await db.push_tokens.find({}, {"_id": 0}).to_list(2000)
            fire_and_forget_push(
                [t["token"] for t in tokens],
                title=f"🔴 LIVE — {s.get('title','Live Darshan')}",
                body=s.get("description") or "A live stream has started. Tap to watch.",
                data={"type": "live_stream_started", "streamId": s["id"], "url": f"/live-stream/{s['id']}"},
            )
        except Exception as e:
            logger.warning("push (livestream) failed: %s", e)
    return s

@api.put("/live-streams/{stream_id}")
async def update_live_stream(stream_id: str, data: LiveStreamIn, user: dict = Depends(require_admin)):
    prev = await db.live_streams.find_one({"id": stream_id}, {"_id": 0}) or {}
    await db.live_streams.update_one({"id": stream_id}, {"$set": data.dict()})
    updated = await db.live_streams.find_one({"id": stream_id}, {"_id": 0})
    # 🔔 If it just went live, notify all devotees
    if updated and updated.get("is_live") and not prev.get("is_live"):
        try:
            tokens = await db.push_tokens.find({}, {"_id": 0}).to_list(2000)
            fire_and_forget_push(
                [t["token"] for t in tokens],
                title=f"🔴 LIVE — {updated.get('title','Live Darshan')}",
                body=updated.get("description") or "A live stream just went live.",
                data={"type": "live_stream_started", "streamId": stream_id, "url": f"/live-stream/{stream_id}"},
            )
        except Exception as e:
            logger.warning("push (livestream update) failed: %s", e)
    return updated

@api.delete("/live-streams/{stream_id}")
async def delete_live_stream(stream_id: str, user: dict = Depends(require_admin)):
    await db.live_streams.delete_one({"id": stream_id})
    return {"ok": True}

# ---------- Agora live-streaming token ----------
class AgoraTokenIn(BaseModel):
    channel_name: Optional[str] = None  # if empty, use stream.channel_name or id
    role: str = "subscriber"  # publisher | subscriber
    uid: Optional[int] = None  # 0 = auto-assigned by Agora

@api.get("/live-streams/config")
async def live_stream_config_duplicate_please_remove():
    # Duplicate removed — real one is above near list_live_streams
    raise HTTPException(404)

@api.post("/live-streams/{stream_id}/token")
async def get_live_stream_token(stream_id: str, data: AgoraTokenIn, user: dict = Depends(get_current_user)):
    if not agora_is_configured():
        raise HTTPException(503, "Live broadcasting is not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE.")
    stream = await db.live_streams.find_one({"id": stream_id}, {"_id": 0})
    if not stream:
        raise HTTPException(404, "Stream not found")
    # Publisher role requires admin; subscriber is open to logged-in users
    role = (data.role or "subscriber").lower()
    if role == "publisher" and user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(403, "Only admins can publish (broadcast)")
    channel = data.channel_name or stream.get("channel_name") or f"stream_{stream_id[:12]}"
    # Persist channel_name on the stream doc if it was auto-generated
    if not stream.get("channel_name"):
        await db.live_streams.update_one({"id": stream_id}, {"$set": {"channel_name": channel}})
    uid = int(data.uid) if data.uid is not None else 0  # 0 => Agora auto-assigns
    tok = build_rtc_token(channel_name=channel, uid=uid, role=role, ttl_seconds=3600)
    if not tok:
        raise HTTPException(503, "Could not build Agora token")
    return tok

# ----------------------------- User Management -------------------------------
@api.get("/users")
async def list_users(role: Optional[str] = None, user: dict = Depends(require_admin)):
    q = {}
    if role:
        q["role"] = role
    items = await db.users.find(q, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return items

@api.put("/users/{user_id}/status")
async def set_user_status(user_id: str, data: UserStatusIn, user: dict = Depends(require_super_admin)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "User not found")
    if target["role"] == "super_admin":
        raise HTTPException(400, "Cannot deactivate super admin")
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": data.is_active}})
    return {"ok": True, "is_active": data.is_active}

@api.put("/users/{user_id}/role")
async def set_user_role(user_id: str, role: str, user: dict = Depends(require_super_admin)):
    if role not in ("devotee", "admin"):
        raise HTTPException(400, "Role must be devotee or admin")
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "User not found")
    if target["role"] == "super_admin":
        raise HTTPException(400, "Cannot change super admin role")
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"ok": True, "role": role}

# ----------------------------- Push Tokens -----------------------------------
@api.post("/users/push-token")
async def register_push_token(data: PushTokenIn, user: dict = Depends(get_current_user)):
    """Register or refresh an Expo push token for the current user."""
    token = (data.token or "").strip()
    if not token:
        raise HTTPException(400, "token required")
    doc = {
        "user_id": user["id"],
        "token": token,
        "platform": data.platform or "expo",
        "updated_at": to_iso(now_utc()),
    }
    await db.push_tokens.update_one(
        {"token": token},
        {"$set": doc, "$setOnInsert": {"created_at": to_iso(now_utc())}},
        upsert=True,
    )
    return {"ok": True}

@api.delete("/users/push-token")
async def delete_push_token(data: PushTokenDeleteIn, user: dict = Depends(get_current_user)):
    await db.push_tokens.delete_one({"token": data.token, "user_id": user["id"]})
    return {"ok": True}

@api.post("/users/push-test")
async def push_test(data: TestPushIn, user: dict = Depends(get_current_user)):
    """Send a test notification to the caller's registered devices."""
    tokens = await db.push_tokens.find({"user_id": user["id"]}, {"_id": 0}).to_list(20)
    if not tokens:
        return {"ok": False, "sent": 0, "reason": "no tokens registered"}
    result = await send_expo_push(
        [t["token"] for t in tokens],
        title=data.title or "🙏 Test Notification",
        body=data.body or "If you can read this, push is working.",
        data={"type": "test", "url": "/(tabs)/profile"},
    )
    return {"ok": True, **result}

# ----------------------------- Admin Stats -----------------------------------
@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_devotees = await db.users.count_documents({"role": "devotee"})
    total_admins = await db.users.count_documents({"role": "admin"})
    total_temples = await db.temples.count_documents({})
    total_poojas = await db.poojas.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    paid_bookings = await db.bookings.count_documents({"payment_status": "paid"})
    revenue_agg = await db.bookings.aggregate([
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    revenue = revenue_agg[0]["total"] if revenue_agg else 0
    live_count = await db.live_streams.count_documents({"is_live": True})
    return {
        "total_users": total_users,
        "total_devotees": total_devotees,
        "total_admins": total_admins,
        "total_temples": total_temples,
        "total_poojas": total_poojas,
        "total_bookings": total_bookings,
        "paid_bookings": paid_bookings,
        "revenue": revenue,
        "live_count": live_count,
    }

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
async def shutdown_db_client():
    client.close()
