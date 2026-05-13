from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Query, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from pathlib import Path
from datetime import datetime, timezone, timedelta, date
import os
import logging
import uuid
import bcrypt
import jwt as pyjwt
import math
import requests as http_requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ----------- Setup -----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')
JWT_ALGO = 'HS256'
APP_NAME = os.environ.get('APP_NAME', 'dresscircle')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

app = FastAPI(title="DressCircle API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ----------- Object Storage -----------
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(500, "Storage unavailable")
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(500, "Storage unavailable")
    resp = http_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ----------- Models -----------
class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    city: str = "Mumbai"
    lat: float = 19.0760
    lng: float = 72.8777
    avatar: Optional[str] = None
    rating: float = 5.0
    rentals_count: int = 0
    listings_count: int = 0
    created_at: str

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    city: Optional[str] = "Mumbai"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    code: str
    name: Optional[str] = None
    city: Optional[str] = "Mumbai"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    avatar: Optional[str] = None

class DressListing(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    category: Literal["Western", "Ethnic", "Partywear", "Formal"]
    size: Literal["XS", "S", "M", "L", "XL", "XXL"]
    color: str
    brand: Optional[str] = None
    occasion: Optional[str] = None
    rent_price: float  # per 3 days
    security_deposit: float
    sale_price: Optional[float] = None
    images: List[str]  # list of URLs (external or our /api/files/...)
    city: str
    lat: float
    lng: float
    available_from: Optional[str] = None
    available_to: Optional[str] = None
    booked_dates: List[str] = []  # ISO date strings
    status: Literal["active", "inactive"] = "active"
    views: int = 0
    created_at: str

class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    size: str
    color: str
    brand: Optional[str] = None
    occasion: Optional[str] = None
    rent_price: float
    security_deposit: float
    sale_price: Optional[float] = None
    images: List[str]
    available_from: Optional[str] = None
    available_to: Optional[str] = None
    condition: Optional[str] = "Good"          # New | Like New | Good | Fair | Well Loved
    item_type: Optional[str] = "dress"         # dress | accessory

class BookingRequest(BaseModel):
    listing_id: str
    start_date: str
    duration_days: int  # 3, 6, or 9
    note: Optional[str] = None

class BookingAction(BaseModel):
    action: Literal["approve", "reject"]

class MessageCreate(BaseModel):
    booking_id: str
    text: str

class WishlistToggle(BaseModel):
    listing_id: str

class ReviewCreate(BaseModel):
    listing_id: str
    booking_id: str
    rating: int
    comment: Optional[str] = None

class ReportCreate(BaseModel):
    target_type: Literal["listing", "user"]
    target_id: str
    reason: str
    details: Optional[str] = None

class WishlistNotify(BaseModel):
    listing_id: str
    notify: bool

class AdminAction(BaseModel):
    reason: Optional[str] = None

# ----------- Helpers -----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def make_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

async def get_optional_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not creds:
        return None
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        return user
    except Exception:
        return None

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("is_admin"):
        raise HTTPException(403, "Admin access required")
    return user

def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def serialize_user(u: dict) -> dict:
    u.pop("password_hash", None)
    u.pop("_id", None)
    return u

def expand_dates(start: str, days: int) -> List[str]:
    d = date.fromisoformat(start)
    return [(d + timedelta(days=i)).isoformat() for i in range(days)]

async def push_notification(user_id: str, type_: str, title: str, body: str, link: Optional[str] = None):
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type_,
        "title": title,
        "body": body,
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

# ----------- Routes: Auth -----------
@api_router.get("/")
async def root():
    return {"message": "DressCircle API"}

@api_router.post("/auth/signup")
async def signup(req: SignupRequest):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    city_coords = {
        "Mumbai": (19.0760, 72.8777),
        "Delhi": (28.7041, 77.1025),
        "Bangalore": (12.9716, 77.5946),
        "Pune": (18.5204, 73.8567),
        "Hyderabad": (17.3850, 78.4867),
        "Chennai": (13.0827, 80.2707),
        "Kolkata": (22.5726, 88.3639),
        "Jaipur": (26.9124, 75.7873),
    }
    lat, lng = city_coords.get(req.city or "Mumbai", (19.0760, 72.8777))
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "city": req.city or "Mumbai",
        "lat": lat,
        "lng": lng,
        "avatar": None,
        "rating": 5.0,
        "rentals_count": 0,
        "listings_count": 0,
        "password_hash": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = make_token(user_id)
    user_doc.pop("password_hash"); user_doc.pop("_id", None)
    return {"token": token, "user": user_doc}

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    if user.get("suspended"):
        raise HTTPException(403, "Your account has been suspended. Contact support.")
    token = make_token(user["id"])
    user.pop("password_hash"); user.pop("_id", None)
    return {"token": token, "user": user}

@api_router.post("/auth/otp/send")
async def send_otp(req: OTPRequest):
    # Simulated OTP — always returns success; the code is "123456"
    return {"sent": True, "phone": req.phone, "demo_code": "123456"}

@api_router.post("/auth/otp/verify")
async def verify_otp(req: OTPVerify):
    if req.code != "123456":
        raise HTTPException(401, "Invalid OTP. Use 123456 in demo mode.")
    user = await db.users.find_one({"phone": req.phone})
    if not user:
        # auto-create
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "name": req.name or "DressCircle User",
            "email": f"{req.phone}@otp.local",
            "phone": req.phone,
            "city": req.city or "Mumbai",
            "lat": 19.0760, "lng": 72.8777,
            "avatar": None,
            "rating": 5.0,
            "rentals_count": 0,
            "listings_count": 0,
            "password_hash": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    token = make_token(user["id"])
    user.pop("password_hash", None); user.pop("_id", None)
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api_router.put("/auth/me")
async def update_me(upd: ProfileUpdate, user: dict = Depends(get_current_user)):
    payload = {k: v for k, v in upd.model_dump().items() if v is not None}
    if payload:
        await db.users.update_one({"id": user["id"]}, {"$set": payload})
    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})

# ----------- Routes: Files -----------
@api_router.post("/files/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = (file.filename or "img.bin").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or f"image/{'jpeg' if ext == 'jpg' else ext}"
    result = put_object(path, data, content_type)
    file_id = str(uuid.uuid4())
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "owner_id": user["id"],
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"id": file_id, "url": f"/api/files/{file_id}"}

@api_router.get("/files/{file_id}")
async def serve_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "File not found")
    data, ct = get_object(record["storage_path"])
    return Response(content=data, media_type=record.get("content_type", ct))

# ----------- Routes: Listings -----------
@api_router.post("/listings")
async def create_listing(payload: ListingCreate, user: dict = Depends(get_current_user)):
    if not payload.images:
        raise HTTPException(400, "At least one image required")
    listing = {
        "id": str(uuid.uuid4()),
        "owner_id": user["id"],
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "size": payload.size,
        "color": payload.color,
        "brand": payload.brand,
        "occasion": payload.occasion,
        "condition": payload.condition or "Good",
        "item_type": payload.item_type or "dress",
        "rent_price": payload.rent_price,
        "security_deposit": payload.security_deposit,
        "sale_price": payload.sale_price,
        "images": payload.images,
        "city": user.get("city", "Mumbai"),
        "lat": user.get("lat", 19.0760),
        "lng": user.get("lng", 72.8777),
        "available_from": payload.available_from,
        "available_to": payload.available_to,
        "booked_dates": [],
        "status": "active",
        "views": 0,
        "times_rented": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.listings.insert_one(listing)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"listings_count": 1}})
    listing.pop("_id", None)
    return listing

@api_router.get("/listings")
async def list_listings(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 100000.0,         # show all by default — frontend can override
    category: Optional[str] = None,
    size: Optional[str] = None,
    occasion: Optional[str] = None,
    condition: Optional[str] = None,
    item_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    limit: int = 200,
):
    query = {"status": "active"}
    if category:
        query["category"] = category
    if size:
        query["size"] = size
    if occasion:
        query["occasion"] = occasion
    if condition:
        query["condition"] = condition
    if item_type:
        query["item_type"] = item_type
    if min_price is not None:
        query.setdefault("rent_price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("rent_price", {})["$lte"] = max_price
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.listings.find(query, {"_id": 0}).to_list(1000)
    if lat is not None and lng is not None:
        # always sort by distance ascending — show nearest first, then expand outward
        for d in docs:
            d["distance_km"] = round(haversine(lat, lng, d["lat"], d["lng"]), 2)
        docs = sorted(docs, key=lambda x: x["distance_km"])
        # Filter only when caller passed a tight radius (<100000)
        if radius_km < 100000:
            within = [d for d in docs if d["distance_km"] <= radius_km]
            if not within and docs:
                within = docs[:limit]
            docs = within
    else:
        # No location → sort by recency
        docs = sorted(docs, key=lambda x: x.get("created_at", ""), reverse=True)
    return docs[:limit]

@api_router.get("/listings/trending")
async def trending(lat: Optional[float] = None, lng: Optional[float] = None):
    docs = await db.listings.find({"status": "active"}, {"_id": 0}).sort("views", -1).limit(8).to_list(8)
    if lat is not None and lng is not None:
        for d in docs:
            d["distance_km"] = round(haversine(lat, lng, d["lat"], d["lng"]), 2)
    return docs

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    owner = await db.users.find_one({"id": listing["owner_id"]}, {"_id": 0, "password_hash": 0, "phone": 0, "email": 0})
    listing["owner"] = owner
    # reviews
    reviews = await db.reviews.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    listing["reviews"] = reviews
    return listing

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, payload: ListingCreate, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["owner_id"] != user["id"]:
        raise HTTPException(403, "Not your listing")
    await db.listings.update_one({"id": listing_id}, {"$set": payload.model_dump()})
    return await db.listings.find_one({"id": listing_id}, {"_id": 0})

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["owner_id"] != user["id"]:
        raise HTTPException(403, "Not your listing")
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "inactive"}})
    return {"ok": True}

@api_router.get("/users/{user_id}/listings")
async def user_listings(user_id: str):
    docs = await db.listings.find({"owner_id": user_id, "status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs

# ----------- Routes: Bookings -----------
@api_router.post("/bookings")
async def create_booking(req: BookingRequest, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["owner_id"] == user["id"]:
        raise HTTPException(400, "You cannot book your own listing")
    if req.duration_days not in (3, 6, 9):
        raise HTTPException(400, "Duration must be 3, 6 or 9 days")
    requested = expand_dates(req.start_date, req.duration_days)
    if any(d in listing.get("booked_dates", []) for d in requested):
        raise HTTPException(409, "Some dates are already booked")
    booking = {
        "id": str(uuid.uuid4()),
        "listing_id": req.listing_id,
        "renter_id": user["id"],
        "owner_id": listing["owner_id"],
        "start_date": req.start_date,
        "duration_days": req.duration_days,
        "dates": requested,
        "rent_total": listing["rent_price"] * (req.duration_days // 3),
        "security_deposit": listing["security_deposit"],
        "note": req.note,
        "status": "pending",  # pending|approved|rejected|completed
        "contact_revealed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking)
    await push_notification(
        listing["owner_id"], "booking_request",
        "New booking request",
        f"{user['name']} requested to rent '{listing['title']}'",
        f"/dashboard"
    )
    booking.pop("_id", None)
    return booking

@api_router.get("/bookings/mine")
async def my_bookings(user: dict = Depends(get_current_user)):
    as_renter = await db.bookings.find({"renter_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    as_owner = await db.bookings.find({"owner_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    # enrich with listing snippet
    async def enrich(arr):
        for b in arr:
            l = await db.listings.find_one({"id": b["listing_id"]}, {"_id": 0, "title": 1, "images": 1, "id": 1})
            b["listing"] = l
            r = await db.users.find_one({"id": b["renter_id"]}, {"_id": 0, "name": 1, "avatar": 1, "id": 1, "phone": 1, "rating": 1})
            o = await db.users.find_one({"id": b["owner_id"]}, {"_id": 0, "name": 1, "avatar": 1, "id": 1, "phone": 1, "rating": 1})
            # phone hidden until reveal
            if not b.get("contact_revealed"):
                if r: r.pop("phone", None)
                if o: o.pop("phone", None)
            b["renter"] = r
            b["owner"] = o
        return arr
    return {"as_renter": await enrich(as_renter), "as_owner": await enrich(as_owner)}

@api_router.get("/bookings/active")
async def active_rentals(user: dict = Depends(get_current_user)):
    """Active (on-rent) + delayed bookings for this user (as renter and as owner).

    NOTE: Must be declared BEFORE /bookings/{booking_id} or FastAPI will match 'active' as an id.
    """
    today = date.today().isoformat()
    rows = await db.bookings.find(
        {"$and": [
            {"status": "approved"},
            {"$or": [{"renter_id": user["id"]}, {"owner_id": user["id"]}]}
        ]},
        {"_id": 0}
    ).sort("start_date", 1).to_list(500)
    out = []
    for b in rows:
        end_date = (date.fromisoformat(b["start_date"]) + timedelta(days=b["duration_days"])).isoformat()
        delayed = today > end_date
        listing = await db.listings.find_one({"id": b["listing_id"]}, {"_id": 0, "title": 1, "images": 1, "id": 1})
        renter = await db.users.find_one({"id": b["renter_id"]}, {"_id": 0, "name": 1, "phone": 1, "id": 1, "avatar": 1})
        owner = await db.users.find_one({"id": b["owner_id"]}, {"_id": 0, "name": 1, "phone": 1, "id": 1, "avatar": 1})
        b["end_date"] = end_date
        b["delayed"] = delayed
        b["listing"] = listing
        b["renter"] = renter
        b["owner"] = owner
        b["role"] = "renter" if user["id"] == b["renter_id"] else "owner"
        out.append(b)
    on_rent = [b for b in out if not b["delayed"]]
    delayed_list = [b for b in out if b["delayed"]]
    return {"on_rent": on_rent, "delayed": delayed_list}


@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["id"] not in (b["renter_id"], b["owner_id"]):
        raise HTTPException(403, "Forbidden")
    listing = await db.listings.find_one({"id": b["listing_id"]}, {"_id": 0})
    renter = await db.users.find_one({"id": b["renter_id"]}, {"_id": 0, "password_hash": 0})
    owner = await db.users.find_one({"id": b["owner_id"]}, {"_id": 0, "password_hash": 0})
    if not b.get("contact_revealed"):
        if renter: renter.pop("phone", None); renter.pop("email", None)
        if owner: owner.pop("phone", None); owner.pop("email", None)
    b["listing"] = listing
    b["renter"] = renter
    b["owner"] = owner
    return b

@api_router.post("/bookings/{booking_id}/action")
async def action_booking(booking_id: str, body: BookingAction, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if b["owner_id"] != user["id"]:
        raise HTTPException(403, "Only the owner can act on this booking")
    if b["status"] != "pending":
        raise HTTPException(400, "Booking is not pending")
    if body.action == "approve":
        # lock dates
        await db.listings.update_one(
            {"id": b["listing_id"]},
            {"$addToSet": {"booked_dates": {"$each": b["dates"]}},
             "$inc": {"times_rented": 1}}
        )
        await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "approved", "contact_revealed": True}})
        await db.users.update_one({"id": b["renter_id"]}, {"$inc": {"rentals_count": 1}})
        await push_notification(b["renter_id"], "booking_approved", "Booking approved!",
                                "Your booking was approved. Contact details are now visible.", "/profile")
    else:
        await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "rejected"}})
        await push_notification(b["renter_id"], "booking_rejected", "Booking declined",
                                "Your booking request was declined.", "/profile")
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})

@api_router.post("/bookings/{booking_id}/reveal")
async def reveal_contact(booking_id: str, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["id"] not in (b["renter_id"], b["owner_id"]):
        raise HTTPException(403, "Forbidden")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"contact_revealed": True}})
    return {"ok": True}

@api_router.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["id"] not in (b["renter_id"], b["owner_id"]):
        raise HTTPException(403, "Forbidden")
    if b["status"] != "approved":
        raise HTTPException(400, "Only approved bookings can be marked completed")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "completed"}})
    return {"ok": True}

# ----------- Routes: Messages -----------
@api_router.post("/messages")
async def send_message(msg: MessageCreate, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": msg.booking_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["id"] not in (b["renter_id"], b["owner_id"]):
        raise HTTPException(403, "Forbidden")
    other = b["owner_id"] if user["id"] == b["renter_id"] else b["renter_id"]
    doc = {
        "id": str(uuid.uuid4()),
        "booking_id": msg.booking_id,
        "from_id": user["id"],
        "to_id": other,
        "text": msg.text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(doc)
    await push_notification(other, "message", "New message", f"{user['name']}: {msg.text[:60]}", f"/chat/{msg.booking_id}")
    doc.pop("_id", None)
    return doc

@api_router.get("/messages/{booking_id}")
async def list_messages(booking_id: str, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b or user["id"] not in (b["renter_id"], b["owner_id"]):
        raise HTTPException(403, "Forbidden")
    msgs = await db.messages.find({"booking_id": booking_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs

# ----------- Routes: Wishlist -----------
@api_router.post("/wishlist/toggle")
async def toggle_wishlist(payload: WishlistToggle, user: dict = Depends(get_current_user)):
    existing = await db.wishlist.find_one({"user_id": user["id"], "listing_id": payload.listing_id})
    if existing:
        await db.wishlist.delete_one({"user_id": user["id"], "listing_id": payload.listing_id})
        return {"saved": False}
    await db.wishlist.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "listing_id": payload.listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"saved": True}

@api_router.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    notify_map = {i["listing_id"]: i.get("notify_when_available", False) for i in items}
    listing_ids = list(notify_map.keys())
    listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(200)
    for l in listings:
        l["notify_when_available"] = notify_map.get(l["id"], False)
    return listings

@api_router.post("/wishlist/notify")
async def set_wishlist_notify(payload: WishlistNotify, user: dict = Depends(get_current_user)):
    res = await db.wishlist.update_one(
        {"user_id": user["id"], "listing_id": payload.listing_id},
        {"$set": {"notify_when_available": payload.notify}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Not in wishlist")
    return {"notify": payload.notify}

# ----------- Routes: Notifications -----------
@api_router.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs

@api_router.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}

@api_router.post("/notifications/read-all")
async def read_all(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}

# ----------- Routes: Reviews -----------
@api_router.post("/reviews")
async def create_review(r: ReviewCreate, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": r.booking_id})
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking["renter_id"] != user["id"]:
        raise HTTPException(403, "Only the renter can review this booking")
    if booking["status"] not in ("approved", "completed"):
        raise HTTPException(400, "Booking is not in a reviewable state")
    if booking["listing_id"] != r.listing_id:
        raise HTTPException(400, "Listing/booking mismatch")
    existing = await db.reviews.find_one({"booking_id": r.booking_id})
    if existing:
        raise HTTPException(409, "You've already reviewed this booking")
    doc = {
        "id": str(uuid.uuid4()),
        "listing_id": r.listing_id,
        "booking_id": r.booking_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_avatar": user.get("avatar"),
        "rating": max(1, min(5, r.rating)),
        "comment": r.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ----------- Routes: Reports -----------
@api_router.post("/reports")
async def create_report(r: ReportCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "reporter_id": user["id"],
        "reporter_name": user.get("name"),
        "target_type": r.target_type,
        "target_id": r.target_id,
        "reason": r.reason,
        "details": r.details,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ----------- Routes: Admin -----------
@api_router.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "listings_active": await db.listings.count_documents({"status": "active"}),
        "listings_removed": await db.listings.count_documents({"status": "inactive"}),
        "bookings_pending": await db.bookings.count_documents({"status": "pending"}),
        "bookings_approved": await db.bookings.count_documents({"status": "approved"}),
        "bookings_completed": await db.bookings.count_documents({"status": "completed"}),
        "reports_open": await db.reports.count_documents({"status": "open"}),
        "reports_resolved": await db.reports.count_documents({"status": "resolved"}),
    }

@api_router.get("/admin/users")
async def admin_users(_: dict = Depends(require_admin), q: Optional[str] = None):
    query = {}
    if q:
        query = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]}
    rows = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return rows

@api_router.post("/admin/users/{user_id}/suspend")
async def admin_suspend_user(user_id: str, _: dict = Depends(require_admin)):
    await db.users.update_one({"id": user_id}, {"$set": {"suspended": True}})
    await db.listings.update_many({"owner_id": user_id}, {"$set": {"status": "inactive"}})
    return {"ok": True}

@api_router.post("/admin/users/{user_id}/unsuspend")
async def admin_unsuspend_user(user_id: str, _: dict = Depends(require_admin)):
    await db.users.update_one({"id": user_id}, {"$set": {"suspended": False}})
    return {"ok": True}

@api_router.get("/admin/listings")
async def admin_listings(_: dict = Depends(require_admin), status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    rows = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows

@api_router.post("/admin/listings/{listing_id}/remove")
async def admin_remove_listing(listing_id: str, _: dict = Depends(require_admin)):
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "inactive"}})
    return {"ok": True}

@api_router.post("/admin/listings/{listing_id}/restore")
async def admin_restore_listing(listing_id: str, _: dict = Depends(require_admin)):
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "active"}})
    return {"ok": True}

@api_router.get("/admin/reports")
async def admin_reports(_: dict = Depends(require_admin)):
    rows = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows

@api_router.post("/admin/reports/{report_id}/resolve")
async def admin_resolve_report(report_id: str, _: dict = Depends(require_admin)):
    await db.reports.update_one({"id": report_id}, {"$set": {"status": "resolved"}})
    return {"ok": True}

@api_router.get("/admin/bookings")
async def admin_bookings(_: dict = Depends(require_admin)):
    rows = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows

# ----------- Routes: Geo / Cities -----------
@api_router.get("/geo/reverse")
async def reverse_geo(lat: float, lng: float):
    cs = [
        {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
        {"name": "Delhi", "lat": 28.7041, "lng": 77.1025},
        {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946},
        {"name": "Pune", "lat": 18.5204, "lng": 73.8567},
        {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
        {"name": "Chennai", "lat": 13.0827, "lng": 80.2707},
        {"name": "Kolkata", "lat": 22.5726, "lng": 88.3639},
        {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873},
    ]
    best = min(cs, key=lambda c: haversine(lat, lng, c["lat"], c["lng"]))
    return {"city": best["name"], "lat": best["lat"], "lng": best["lng"], "distance_km": round(haversine(lat, lng, best["lat"], best["lng"]), 1)}

@api_router.get("/cities")
async def cities():
    return [
        {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
        {"name": "Delhi", "lat": 28.7041, "lng": 77.1025},
        {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946},
        {"name": "Pune", "lat": 18.5204, "lng": 73.8567},
        {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
        {"name": "Chennai", "lat": 13.0827, "lng": 80.2707},
        {"name": "Kolkata", "lat": 22.5726, "lng": 88.3639},
        {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873},
    ]

# ----------- Mount -----------
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_storage()
    # indexes
    try:
        await db.users.create_index("email", unique=True, sparse=True)
        await db.listings.create_index("owner_id")
        await db.bookings.create_index("renter_id")
        await db.bookings.create_index("owner_id")
        await db.notifications.create_index("user_id")
    except Exception as e:
        logger.warning(f"Index create warn: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
