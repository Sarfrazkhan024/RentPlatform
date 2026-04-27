"""Iteration 2: reports, wishlist/notify, geo/reverse, reviews endpoints."""
import os
import time
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@dresscircle.in"
DEMO_PASS = "demo1234"
OWNER_EMAIL = "aanya@dresscircle.in"
OWNER_PASS = "password123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def demo_headers(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def owner_headers(session):
    r = session.post(f"{API}/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASS})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


# ---------- /api/geo/reverse ----------
def test_geo_reverse_bangalore(session):
    r = session.get(f"{API}/geo/reverse", params={"lat": 12.97, "lng": 77.59})
    assert r.status_code == 200
    body = r.json()
    assert body["city"] == "Bangalore"
    assert "lat" in body and "lng" in body
    assert "distance_km" in body
    assert body["distance_km"] < 50


def test_geo_reverse_mumbai(session):
    r = session.get(f"{API}/geo/reverse", params={"lat": 19.0760, "lng": 72.8777})
    assert r.status_code == 200
    assert r.json()["city"] == "Mumbai"


def test_geo_reverse_delhi(session):
    r = session.get(f"{API}/geo/reverse", params={"lat": 28.61, "lng": 77.21})
    assert r.status_code == 200
    assert r.json()["city"] == "Delhi"


def test_geo_reverse_far_away_returns_nearest(session):
    # New York coords -> should return some Indian city (nearest)
    r = session.get(f"{API}/geo/reverse", params={"lat": 40.7128, "lng": -74.0060})
    assert r.status_code == 200
    assert "city" in r.json()


def test_geo_reverse_missing_params(session):
    r = session.get(f"{API}/geo/reverse")
    assert r.status_code in (400, 422)


# ---------- /api/reports ----------
def test_create_report_listing_requires_auth(session):
    r = session.post(f"{API}/reports", json={
        "target_type": "listing", "target_id": "abc", "reason": "spam"
    })
    assert r.status_code == 401


def test_create_report_listing_success(session, demo_headers):
    listings = session.get(f"{API}/listings").json()
    lid = listings[0]["id"]
    r = session.post(f"{API}/reports", json={
        "target_type": "listing",
        "target_id": lid,
        "reason": "Inappropriate photos",
        "details": "TEST report from automated suite"
    }, headers=demo_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["target_type"] == "listing"
    assert body["target_id"] == lid
    assert body["reason"] == "Inappropriate photos"
    assert body["status"] == "open"
    assert "id" in body
    assert "reporter_id" in body
    assert "_id" not in body


def test_create_report_user_success(session, demo_headers):
    r = session.post(f"{API}/reports", json={
        "target_type": "user",
        "target_id": "some-user-id",
        "reason": "Harassment"
    }, headers=demo_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["target_type"] == "user"
    assert body["status"] == "open"


def test_create_report_invalid_target_type(session, demo_headers):
    r = session.post(f"{API}/reports", json={
        "target_type": "post",  # invalid
        "target_id": "x",
        "reason": "spam"
    }, headers=demo_headers)
    assert r.status_code in (400, 422)


# ---------- /api/wishlist/notify ----------
def test_wishlist_notify_requires_item_in_wishlist(session, demo_headers):
    r = session.post(f"{API}/wishlist/notify",
                     json={"listing_id": "nonexistent-listing-id", "notify": True},
                     headers=demo_headers)
    assert r.status_code == 404


def test_wishlist_notify_toggle_persists(session, demo_headers):
    # Add a listing to wishlist first
    listings = session.get(f"{API}/listings").json()
    lid = listings[0]["id"]
    # Ensure it's in wishlist
    wl = session.get(f"{API}/wishlist", headers=demo_headers).json()
    if not any(w["id"] == lid for w in wl):
        session.post(f"{API}/wishlist/toggle", json={"listing_id": lid}, headers=demo_headers)

    # Set notify=True
    r1 = session.post(f"{API}/wishlist/notify",
                      json={"listing_id": lid, "notify": True},
                      headers=demo_headers)
    assert r1.status_code == 200
    assert r1.json() == {"notify": True}

    # GET /api/wishlist returns notify_when_available=true
    wl2 = session.get(f"{API}/wishlist", headers=demo_headers).json()
    item = next((w for w in wl2 if w["id"] == lid), None)
    assert item is not None
    assert item.get("notify_when_available") is True

    # Toggle off
    r2 = session.post(f"{API}/wishlist/notify",
                      json={"listing_id": lid, "notify": False},
                      headers=demo_headers)
    assert r2.status_code == 200
    assert r2.json() == {"notify": False}

    # Verify persisted
    wl3 = session.get(f"{API}/wishlist", headers=demo_headers).json()
    item3 = next((w for w in wl3 if w["id"] == lid), None)
    assert item3.get("notify_when_available") is False


# ---------- /api/wishlist returns notify flag for all ----------
def test_wishlist_returns_notify_flag_field(session, demo_headers):
    wl = session.get(f"{API}/wishlist", headers=demo_headers).json()
    if wl:
        for item in wl:
            assert "notify_when_available" in item
            assert isinstance(item["notify_when_available"], bool)


# ---------- /api/reviews (used by Booking review form) ----------
def test_create_review_requires_auth(session):
    r = session.post(f"{API}/reviews", json={
        "listing_id": "x", "booking_id": "y", "rating": 5
    })
    assert r.status_code == 401


def test_create_review_success(session, demo_headers, owner_headers):
    """End-to-end: create booking, owner approves, renter posts review."""
    # find listing owned by aanya
    me_o = session.get(f"{API}/auth/me", headers=owner_headers).json()
    lst = session.get(f"{API}/users/{me_o['id']}/listings").json()
    assert lst
    listing = lst[0]
    start = (date.today() + timedelta(days=200 + int(time.time()) % 50)).isoformat()
    bk = session.post(f"{API}/bookings", json={
        "listing_id": listing["id"],
        "start_date": start,
        "duration_days": 3,
        "note": "TEST iter2 review flow"
    }, headers=demo_headers)
    if bk.status_code == 409:
        # try a different start
        start = (date.today() + timedelta(days=300 + int(time.time()) % 50)).isoformat()
        bk = session.post(f"{API}/bookings", json={
            "listing_id": listing["id"],
            "start_date": start,
            "duration_days": 3
        }, headers=demo_headers)
    assert bk.status_code == 200, bk.text
    booking_id = bk.json()["id"]
    # owner approves
    ap = session.post(f"{API}/bookings/{booking_id}/action",
                      json={"action": "approve"}, headers=owner_headers)
    assert ap.status_code == 200

    # post review
    rv = session.post(f"{API}/reviews", json={
        "listing_id": listing["id"],
        "booking_id": booking_id,
        "rating": 5,
        "comment": "TEST iter2 great experience"
    }, headers=demo_headers)
    assert rv.status_code == 200
    body = rv.json()
    assert body["rating"] == 5
    assert body["comment"] == "TEST iter2 great experience"
    assert body["listing_id"] == listing["id"]
    assert "id" in body
    assert "_id" not in body

    # verify shows in listing detail
    detail = session.get(f"{API}/listings/{listing['id']}").json()
    assert any(r["booking_id"] == booking_id for r in detail.get("reviews", []))


def test_review_rating_clamped(session, demo_headers):
    listings = session.get(f"{API}/listings").json()
    r = session.post(f"{API}/reviews", json={
        "listing_id": listings[0]["id"],
        "booking_id": "fake-bk-id",
        "rating": 10,  # should clamp to 5
        "comment": "TEST clamp"
    }, headers=demo_headers)
    assert r.status_code == 200
    assert r.json()["rating"] == 5
