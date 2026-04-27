"""DressCircle backend API tests covering auth, listings, bookings, wishlist, messages, notifications, files."""
import os
import io
import time
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://wardrobe-loop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@dresscircle.in"
DEMO_PASS = "demo1234"
SECOND_EMAIL = "aanya@dresscircle.in"
SECOND_PASS = "password123"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def demo_token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def second_headers(session):
    r = session.post(f"{API}/auth/login", json={"email": SECOND_EMAIL, "password": SECOND_PASS})
    assert r.status_code == 200, f"second login failed: {r.text}"
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["message"] == "DressCircle API"


# ---------- Cities ----------
def test_cities(session):
    r = session.get(f"{API}/cities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 8
    names = [c["name"] for c in data]
    assert "Mumbai" in names and "Delhi" in names
    for c in data:
        assert "lat" in c and "lng" in c


# ---------- Auth ----------
def test_login_demo(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200
    body = r.json()
    assert "token" in body and "user" in body
    assert body["user"]["email"] == DEMO_EMAIL
    assert "password_hash" not in body["user"]


def test_login_invalid(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_signup_and_duplicate(session):
    email = f"test_{int(time.time())}@dresscircle.in"
    r = session.post(f"{API}/auth/signup", json={
        "name": "TEST User", "email": email, "password": "Pass1234", "city": "Pune"
    })
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["email"] == email
    assert body["user"]["city"] == "Pune"
    # duplicate
    r2 = session.post(f"{API}/auth/signup", json={
        "name": "TEST User", "email": email, "password": "Pass1234"
    })
    assert r2.status_code == 400


def test_otp_send_verify(session):
    phone = f"+9199999{int(time.time()) % 100000}"
    r = session.post(f"{API}/auth/otp/send", json={"phone": phone})
    assert r.status_code == 200
    assert r.json().get("sent") is True
    # bad code
    r_bad = session.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "000000"})
    assert r_bad.status_code == 401
    # good code creates user
    r_ok = session.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST OTP"})
    assert r_ok.status_code == 200
    assert "token" in r_ok.json()


def test_auth_me(session, demo_headers):
    r = session.get(f"{API}/auth/me", headers=demo_headers)
    assert r.status_code == 200
    assert r.json()["email"] == DEMO_EMAIL


def test_auth_me_no_token(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------- Listings ----------
def test_list_listings_basic(session):
    r = session.get(f"{API}/listings")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 20  # 24 seeded
    assert "title" in data[0] and "rent_price" in data[0]


def test_list_listings_with_geo_distance(session):
    r = session.get(f"{API}/listings?lat=19.0760&lng=72.8777&radius_km=5000")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert "distance_km" in data[0]
    assert isinstance(data[0]["distance_km"], (int, float))


def test_list_listings_filter_category(session):
    r = session.get(f"{API}/listings?category=Ethnic")
    assert r.status_code == 200
    data = r.json()
    assert all(d["category"] == "Ethnic" for d in data)
    assert len(data) >= 1


def test_list_listings_filter_price(session):
    r = session.get(f"{API}/listings?min_price=1000&max_price=2000")
    assert r.status_code == 200
    data = r.json()
    for d in data:
        assert 1000 <= d["rent_price"] <= 2000


def test_listings_search_q(session):
    r = session.get(f"{API}/listings?q=lehenga")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_trending(session):
    r = session.get(f"{API}/listings/trending")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) <= 8


def test_listing_detail_increments_views(session):
    listings = session.get(f"{API}/listings").json()
    lid = listings[0]["id"]
    v0 = listings[0]["views"]
    r = session.get(f"{API}/listings/{lid}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == lid
    assert "owner" in body and body["owner"] is not None
    assert "reviews" in body and isinstance(body["reviews"], list)
    # second fetch -> views increased
    r2 = session.get(f"{API}/listings/{lid}")
    assert r2.json()["views"] >= v0 + 1


def test_listing_detail_404(session):
    r = session.get(f"{API}/listings/nonexistent-id")
    assert r.status_code == 404


# ---------- Wishlist ----------
def test_wishlist_toggle_and_get(session, demo_headers):
    listings = session.get(f"{API}/listings").json()
    lid = listings[0]["id"]
    # ensure clean state by toggling twice if needed
    r1 = session.post(f"{API}/wishlist/toggle", json={"listing_id": lid}, headers=demo_headers)
    assert r1.status_code == 200
    saved1 = r1.json()["saved"]
    r2 = session.post(f"{API}/wishlist/toggle", json={"listing_id": lid}, headers=demo_headers)
    saved2 = r2.json()["saved"]
    assert saved1 != saved2
    # ensure final state is "saved"
    if not saved2:
        session.post(f"{API}/wishlist/toggle", json={"listing_id": lid}, headers=demo_headers)
    wl = session.get(f"{API}/wishlist", headers=demo_headers)
    assert wl.status_code == 200
    assert any(d["id"] == lid for d in wl.json())


# ---------- Bookings ----------
@pytest.fixture(scope="module")
def booking_ctx(session, demo_headers, second_headers):
    """Create booking: demo (renter) books an aanya-owned listing."""
    # Find listing owned by aanya (second user)
    me_second = session.get(f"{API}/auth/me", headers=second_headers).json()
    lst = session.get(f"{API}/users/{me_second['id']}/listings").json()
    assert len(lst) > 0, "aanya should have listings"
    listing = lst[0]
    start = (date.today() + timedelta(days=30)).isoformat()
    r = session.post(f"{API}/bookings", json={
        "listing_id": listing["id"],
        "start_date": start,
        "duration_days": 3,
        "note": "TEST booking"
    }, headers=demo_headers)
    assert r.status_code == 200, f"booking create failed: {r.status_code} {r.text}"
    b = r.json()
    return {"booking": b, "listing": listing, "start": start}


def test_create_booking_own_listing_rejected(session, second_headers):
    me = session.get(f"{API}/auth/me", headers=second_headers).json()
    lst = session.get(f"{API}/users/{me['id']}/listings").json()
    start = (date.today() + timedelta(days=60)).isoformat()
    r = session.post(f"{API}/bookings", json={
        "listing_id": lst[0]["id"], "start_date": start, "duration_days": 3
    }, headers=second_headers)
    assert r.status_code == 400


def test_create_booking_invalid_duration(session, demo_headers):
    listings = session.get(f"{API}/listings").json()
    # find one not owned by demo
    me = session.get(f"{API}/auth/me", headers=demo_headers).json()
    target = next(l for l in listings if l["owner_id"] != me["id"])
    r = session.post(f"{API}/bookings", json={
        "listing_id": target["id"],
        "start_date": (date.today() + timedelta(days=90)).isoformat(),
        "duration_days": 4
    }, headers=demo_headers)
    assert r.status_code == 400


def test_bookings_mine_hides_phone_before_approval(session, demo_headers, booking_ctx):
    r = session.get(f"{API}/bookings/mine", headers=demo_headers)
    assert r.status_code == 200
    data = r.json()
    assert "as_renter" in data and "as_owner" in data
    found = next((b for b in data["as_renter"] if b["id"] == booking_ctx["booking"]["id"]), None)
    assert found is not None
    assert found["status"] == "pending"
    assert found["contact_revealed"] is False
    # phone should be hidden
    assert (found.get("owner") or {}).get("phone") in (None, "")


def test_owner_approve_booking(session, second_headers, demo_headers, booking_ctx):
    bid = booking_ctx["booking"]["id"]
    r = session.post(f"{API}/bookings/{bid}/action", json={"action": "approve"}, headers=second_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "approved"
    assert body["contact_revealed"] is True
    # dates locked
    listing = session.get(f"{API}/listings/{booking_ctx['listing']['id']}").json()
    for d in booking_ctx["booking"]["dates"]:
        assert d in listing["booked_dates"]
    # phone exposed
    mine = session.get(f"{API}/bookings/mine", headers=demo_headers).json()
    found = next(b for b in mine["as_renter"] if b["id"] == bid)
    assert found.get("owner", {}).get("phone")


def test_double_booking_locked_dates_returns_409(session, demo_headers, booking_ctx):
    r = session.post(f"{API}/bookings", json={
        "listing_id": booking_ctx["listing"]["id"],
        "start_date": booking_ctx["start"],
        "duration_days": 3
    }, headers=demo_headers)
    assert r.status_code == 409


def test_non_owner_cannot_act(session, demo_headers, second_headers):
    # create new booking and try acting as renter
    me_second = session.get(f"{API}/auth/me", headers=second_headers).json()
    lst = session.get(f"{API}/users/{me_second['id']}/listings").json()
    target = lst[1] if len(lst) > 1 else lst[0]
    start = (date.today() + timedelta(days=120)).isoformat()
    bk = session.post(f"{API}/bookings", json={
        "listing_id": target["id"], "start_date": start, "duration_days": 3
    }, headers=demo_headers)
    assert bk.status_code == 200
    bid = bk.json()["id"]
    # demo (renter) tries to approve — should be 403
    r = session.post(f"{API}/bookings/{bid}/action", json={"action": "approve"}, headers=demo_headers)
    assert r.status_code == 403


# ---------- Messages ----------
def test_messages_send_and_list(session, demo_headers, second_headers, booking_ctx):
    bid = booking_ctx["booking"]["id"]
    r = session.post(f"{API}/messages", json={"booking_id": bid, "text": "TEST hello"}, headers=demo_headers)
    assert r.status_code == 200
    assert r.json()["text"] == "TEST hello"
    # list messages as owner
    r2 = session.get(f"{API}/messages/{bid}", headers=second_headers)
    assert r2.status_code == 200
    msgs = r2.json()
    assert any(m["text"] == "TEST hello" for m in msgs)


def test_messages_forbidden_for_outsider(session, booking_ctx):
    # No auth
    r = session.get(f"{API}/messages/{booking_ctx['booking']['id']}")
    assert r.status_code in (401, 403)


# ---------- Notifications ----------
def test_notifications_list_and_read(session, second_headers):
    r = session.get(f"{API}/notifications", headers=second_headers)
    assert r.status_code == 200
    notifs = r.json()
    assert isinstance(notifs, list)
    assert len(notifs) >= 1  # booking_request was pushed
    # mark read
    r2 = session.post(f"{API}/notifications/read-all", headers=second_headers)
    assert r2.status_code == 200


# ---------- Files ----------
def test_file_upload_and_serve(demo_token):
    # tiny PNG bytes
    png_bytes = bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
        "890000000A49444154789C6300010000000500010D0A2DB40000000049454E44"
        "AE426082"
    )
    files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
    r = requests.post(
        f"{API}/files/upload",
        headers={"Authorization": f"Bearer {demo_token}"},
        files=files, timeout=60,
    )
    if r.status_code == 500 and "Storage" in r.text:
        pytest.skip(f"Object storage unavailable: {r.text}")
    assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
    body = r.json()
    assert "id" in body and body["url"].startswith("/api/files/")
    # serve back
    r2 = requests.get(f"{API}/files/{body['id']}", timeout=30)
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("image/")
    assert len(r2.content) >= 50
