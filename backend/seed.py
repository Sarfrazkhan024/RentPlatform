"""Seed script for Restyle demo data."""
import asyncio
import os
import uuid
import bcrypt
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

DRESS_IMAGES = [
    "https://images.pexels.com/photos/33343580/pexels-photo-33343580.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
    "https://images.pexels.com/photos/19588679/pexels-photo-19588679.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
    "https://images.pexels.com/photos/37013921/pexels-photo-37013921.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
    "https://images.unsplash.com/photo-1704775990248-4c1c1a276b4f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1601859574492-8658b6f7f990?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.pexels.com/photos/12062663/pexels-photo-12062663.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
]

ACCESSORY_IMAGES = [
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1612722432474-b971cdcea546?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1635767798638-3e25273a8236?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
]

PROFILE_IMAGES = [
    "https://images.unsplash.com/photo-1663560455456-7c2fb0c8cfca?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1713296134277-6917ab5b752f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1638296986007-98f1e7bb2601?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
]

CITIES = [
    ("Mumbai", 19.0760, 72.8777),
    ("Delhi", 28.7041, 77.1025),
    ("Bangalore", 12.9716, 77.5946),
    ("Pune", 18.5204, 73.8567),
    ("Hyderabad", 17.3850, 78.4867),
    ("Jaipur", 26.9124, 75.7873),
]

USERS = [
    ("Aanya Kapoor", "aanya@restyle.in", "+919876543210"),
    ("Riya Sharma", "riya@restyle.in", "+919876543211"),
    ("Meera Iyer", "meera@restyle.in", "+919876543212"),
    ("Priya Nair", "priya@restyle.in", "+919876543213"),
    ("Sara Khan", "sara@restyle.in", "+919876543214"),
    ("Diya Patel", "diya@restyle.in", "+919876543215"),
]

CONDITIONS = ["New", "Like New", "Good", "Fair", "Well Loved"]

LISTINGS = [
    {"title": "Blush Pink Lehenga with Mirror Work", "category": "Ethnic", "size": "M", "color": "Blush Pink", "brand": "Anita Dongre", "occasion": "Wedding", "rent": 2400, "deposit": 8000, "sale": None, "cond": "Like New", "desc": "A dreamy blush pink lehenga with intricate mirror and zardozi work. Perfect for sangeet or reception."},
    {"title": "Ivory Silk Saree with Gold Border", "category": "Ethnic", "size": "S", "color": "Ivory", "brand": "Sabyasachi Inspired", "occasion": "Wedding", "rent": 1800, "deposit": 6000, "sale": None, "cond": "Good", "desc": "Hand-loomed ivory silk saree with elegant gold zari border. A timeless classic."},
    {"title": "Emerald Green Anarkali", "category": "Ethnic", "size": "L", "color": "Emerald", "brand": "Manish Malhotra", "occasion": "Reception", "rent": 2100, "deposit": 7000, "sale": 12000, "cond": "Like New", "desc": "Floor length emerald anarkali with delicate floral embroidery. Worn once at a reception."},
    {"title": "Black Sequin Cocktail Dress", "category": "Partywear", "size": "S", "color": "Black", "brand": "Zara", "occasion": "Cocktail", "rent": 1200, "deposit": 4000, "sale": 5500, "cond": "Like New", "desc": "Sleek bodycon dress with all-over sequin shimmer. Worn once."},
    {"title": "Champagne Slip Dress", "category": "Partywear", "size": "M", "color": "Champagne", "brand": "H&M", "occasion": "Cocktail", "rent": 900, "deposit": 3000, "sale": None, "cond": "Good", "desc": "Satin slip dress with thin straps. Pair with statement heels."},
    {"title": "Red Tulle Gown", "category": "Partywear", "size": "M", "color": "Red", "brand": "Forever New", "occasion": "Gala", "rent": 1600, "deposit": 5000, "sale": None, "cond": "Good", "desc": "Floor length red tulle gown with corset bodice."},
    {"title": "Pastel Blue Floral Maxi", "category": "Western", "size": "S", "color": "Pastel Blue", "brand": "Vero Moda", "occasion": "Brunch", "rent": 700, "deposit": 2000, "sale": 2800, "cond": "Good", "desc": "Flowy floral maxi dress, perfect for daytime events and brunches."},
    {"title": "Beige Linen Co-ord Set", "category": "Western", "size": "M", "color": "Beige", "brand": "Mango", "occasion": "Casual", "rent": 800, "deposit": 2500, "sale": None, "cond": "Like New", "desc": "Linen blazer + wide-leg pants set. Office to evening."},
    {"title": "Ruby Velvet Sherwani Set", "category": "Ethnic", "size": "L", "color": "Ruby", "brand": "Tarun Tahiliani", "occasion": "Wedding", "rent": 2800, "deposit": 9000, "sale": None, "cond": "New", "desc": "Rich ruby velvet anarkali with hand embroidery on yoke."},
    {"title": "White Lace Midi Dress", "category": "Western", "size": "XS", "color": "White", "brand": "Forever 21", "occasion": "Brunch", "rent": 600, "deposit": 1800, "sale": 2200, "cond": "Fair", "desc": "Delicate white lace midi for daytime occasions."},
    {"title": "Royal Blue Velvet Gown", "category": "Formal", "size": "M", "color": "Royal Blue", "brand": "Aza", "occasion": "Gala", "rent": 1900, "deposit": 6000, "sale": None, "cond": "Like New", "desc": "Elegant royal blue velvet gown with sweetheart neckline."},
    {"title": "Mustard Yellow Saree", "category": "Ethnic", "size": "M", "color": "Mustard", "brand": "Fabindia", "occasion": "Festival", "rent": 1100, "deposit": 3500, "sale": None, "cond": "Good", "desc": "Handwoven mustard saree with traditional border."},
    {"title": "Rose Gold Sequin Saree", "category": "Partywear", "size": "S", "color": "Rose Gold", "brand": "Manish Malhotra", "occasion": "Reception", "rent": 2200, "deposit": 7500, "sale": None, "cond": "Like New", "desc": "Pre-stitched rose gold sequin saree with belt. Glam everywhere."},
    {"title": "Olive Green Jumpsuit", "category": "Western", "size": "M", "color": "Olive", "brand": "AND", "occasion": "Cocktail", "rent": 950, "deposit": 3000, "sale": 3800, "cond": "Good", "desc": "Sleeveless olive jumpsuit. Sleek silhouette."},
    {"title": "Lavender Embroidered Sharara", "category": "Ethnic", "size": "L", "color": "Lavender", "brand": "Ritu Kumar", "occasion": "Sangeet", "rent": 1700, "deposit": 5500, "sale": None, "cond": "Like New", "desc": "Lavender sharara set with delicate thread work."},
    {"title": "Black Off-Shoulder Gown", "category": "Formal", "size": "S", "color": "Black", "brand": "Aza", "occasion": "Gala", "rent": 1500, "deposit": 5000, "sale": None, "cond": "Good", "desc": "Classic black off-shoulder mermaid gown."},
    {"title": "Coral Pink Kurti Set", "category": "Ethnic", "size": "L", "color": "Coral", "brand": "W", "occasion": "Festival", "rent": 500, "deposit": 1500, "sale": 1800, "cond": "Fair", "desc": "Coral pink straight kurti with palazzo and dupatta."},
    {"title": "Silver Sequin Bodycon", "category": "Partywear", "size": "XS", "color": "Silver", "brand": "Forever New", "occasion": "Cocktail", "rent": 1100, "deposit": 3500, "sale": None, "cond": "Like New", "desc": "Bling silver bodycon for the night out queen."},
    {"title": "Mint Green Floor Length Anarkali", "category": "Ethnic", "size": "M", "color": "Mint", "brand": "Aza", "occasion": "Sangeet", "rent": 1900, "deposit": 6500, "sale": None, "cond": "Good", "desc": "Mint anarkali with delicate sequin floral motifs."},
    {"title": "Burgundy Velvet Blazer Dress", "category": "Formal", "size": "M", "color": "Burgundy", "brand": "Mango", "occasion": "Office Party", "rent": 850, "deposit": 2800, "sale": None, "cond": "Good", "desc": "Velvet blazer dress for power dressing."},
    {"title": "Peach Saree with Pearl Work", "category": "Ethnic", "size": "M", "color": "Peach", "brand": "Sabyasachi Inspired", "occasion": "Wedding", "rent": 2000, "deposit": 6500, "sale": None, "cond": "Like New", "desc": "Peach georgette saree with delicate pearl work."},
    {"title": "Navy Blue Wrap Dress", "category": "Formal", "size": "S", "color": "Navy", "brand": "Zara", "occasion": "Office", "rent": 700, "deposit": 2000, "sale": 2500, "cond": "Good", "desc": "Classic navy wrap dress, never goes out of style."},
    {"title": "Fuchsia Pink Gown", "category": "Partywear", "size": "L", "color": "Fuchsia", "brand": "Aza", "occasion": "Engagement", "rent": 2300, "deposit": 7500, "sale": None, "cond": "Like New", "desc": "Fuchsia gown with feather hem detailing."},
    {"title": "Beige Embellished Lehenga", "category": "Ethnic", "size": "S", "color": "Beige", "brand": "Tarun Tahiliani", "occasion": "Wedding", "rent": 2600, "deposit": 8500, "sale": None, "cond": "New", "desc": "Pearl-encrusted beige lehenga set with intricate dupatta."},
]

ACCESSORIES = [
    {"title": "Polki Diamond Choker Set", "category": "Jewellery", "size": "M", "color": "Gold", "brand": "Tribe Amrapali", "occasion": "Wedding", "rent": 1500, "deposit": 12000, "sale": None, "cond": "Like New", "desc": "Statement polki choker set with matching earrings. Wedding-ready."},
    {"title": "Embellished Potli Bag", "category": "Bags", "size": "M", "color": "Maroon", "brand": "Aldo", "occasion": "Sangeet", "rent": 350, "deposit": 1500, "sale": 800, "cond": "Good", "desc": "Maroon velvet potli with zardozi work. Holds essentials beautifully."},
    {"title": "Crystal Encrusted Clutch", "category": "Bags", "size": "S", "color": "Silver", "brand": "Steve Madden", "occasion": "Cocktail", "rent": 400, "deposit": 2000, "sale": None, "cond": "Like New", "desc": "Crystal clutch that elevates any LBD or gown."},
    {"title": "Kundan Jhumka Earrings", "category": "Jewellery", "size": "M", "color": "Gold", "brand": "Amrapali", "occasion": "Festival", "rent": 600, "deposit": 3000, "sale": None, "cond": "Like New", "desc": "Traditional gold-tone kundan jhumkas with pearl drops."},
    {"title": "Tan Suede Heels", "category": "Shoes", "size": "M", "color": "Tan", "brand": "Charles & Keith", "occasion": "Office Party", "rent": 500, "deposit": 2000, "sale": None, "cond": "Good", "desc": "Block-heel tan suede pumps. Comfortable for long evenings."},
    {"title": "Floral Embellished Belt", "category": "Belts", "size": "M", "color": "Multi", "brand": "Zara", "occasion": "Cocktail", "rent": 250, "deposit": 800, "sale": 600, "cond": "Like New", "desc": "Embellished waist belt to cinch any dress or saree."},
]


def hp(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


async def seed():
    print("Clearing collections...")
    await db.users.delete_many({})
    await db.listings.delete_many({})
    await db.bookings.delete_many({})
    await db.messages.delete_many({})
    await db.wishlist.delete_many({})
    await db.notifications.delete_many({})
    await db.reviews.delete_many({})
    await db.reports.delete_many({})

    # Admin user
    admin_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": admin_id,
        "name": "Restyle Admin",
        "email": "admin@restyle.in",
        "phone": "+910000000000",
        "city": "Mumbai",
        "lat": 19.0760, "lng": 72.8777,
        "avatar": PROFILE_IMAGES[2],
        "rating": 5.0,
        "rentals_count": 0,
        "listings_count": 0,
        "is_admin": True,
        "suspended": False,
        "password_hash": hp("admin1234"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    user_ids = []
    for i, (name, email, phone) in enumerate(USERS):
        city, lat, lng = CITIES[i % len(CITIES)]
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid,
            "name": name,
            "email": email,
            "phone": phone,
            "city": city,
            "lat": lat + (i * 0.01),
            "lng": lng + (i * 0.01),
            "avatar": PROFILE_IMAGES[i % len(PROFILE_IMAGES)],
            "rating": round(4.5 + (i % 5) * 0.1, 1),
            "rentals_count": 3 + i,
            "listings_count": 0,
            "is_admin": False,
            "suspended": False,
            "password_hash": hp("password123"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        user_ids.append(uid)

    # Demo seed user
    demo_uid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": demo_uid,
        "name": "Demo User",
        "email": "demo@restyle.in",
        "phone": "+919999999999",
        "city": "Mumbai",
        "lat": 19.0760, "lng": 72.8777,
        "avatar": PROFILE_IMAGES[0],
        "rating": 5.0,
        "rentals_count": 0, "listings_count": 0,
        "is_admin": False,
        "suspended": False,
        "password_hash": hp("demo1234"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    print(f"Created {len(user_ids) + 2} users (incl admin + demo)")

    # Listings (dresses)
    for i, item in enumerate(LISTINGS):
        owner_id = user_ids[i % len(user_ids)]
        owner = await db.users.find_one({"id": owner_id})
        imgs = [DRESS_IMAGES[i % len(DRESS_IMAGES)], DRESS_IMAGES[(i + 3) % len(DRESS_IMAGES)], DRESS_IMAGES[(i + 6) % len(DRESS_IMAGES)]]
        await db.listings.insert_one({
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "title": item["title"],
            "description": item["desc"],
            "category": item["category"],
            "size": item["size"],
            "color": item["color"],
            "brand": item["brand"],
            "occasion": item["occasion"],
            "condition": item["cond"],
            "item_type": "dress",
            "rent_price": item["rent"],
            "security_deposit": item["deposit"],
            "sale_price": item["sale"],
            "images": imgs,
            "city": owner["city"],
            "lat": owner["lat"],
            "lng": owner["lng"],
            "available_from": "2026-02-01",
            "available_to": "2026-12-31",
            "booked_dates": [],
            "status": "active",
            "views": 10 + (i * 7) % 80,
            "times_rented": (i * 3) % 12,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.users.update_one({"id": owner_id}, {"$inc": {"listings_count": 1}})

    # Accessories
    for i, item in enumerate(ACCESSORIES):
        owner_id = user_ids[i % len(user_ids)]
        owner = await db.users.find_one({"id": owner_id})
        imgs = [ACCESSORY_IMAGES[i % len(ACCESSORY_IMAGES)], ACCESSORY_IMAGES[(i + 2) % len(ACCESSORY_IMAGES)]]
        await db.listings.insert_one({
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "title": item["title"],
            "description": item["desc"],
            "category": item["category"],
            "size": item["size"],
            "color": item["color"],
            "brand": item["brand"],
            "occasion": item["occasion"],
            "condition": item["cond"],
            "item_type": "accessory",
            "rent_price": item["rent"],
            "security_deposit": item["deposit"],
            "sale_price": item["sale"],
            "images": imgs,
            "city": owner["city"],
            "lat": owner["lat"],
            "lng": owner["lng"],
            "available_from": "2026-02-01",
            "available_to": "2026-12-31",
            "booked_dates": [],
            "status": "active",
            "views": 5 + (i * 4) % 40,
            "times_rented": (i * 2) % 8,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.users.update_one({"id": owner_id}, {"$inc": {"listings_count": 1}})

    print(f"Created {len(LISTINGS)} dresses + {len(ACCESSORIES)} accessories")
    print("\n✅ Seed complete.")
    print("   Demo:  demo@restyle.in / demo1234")
    print("   Admin: admin@restyle.in / admin1234")


if __name__ == "__main__":
    asyncio.run(seed())
