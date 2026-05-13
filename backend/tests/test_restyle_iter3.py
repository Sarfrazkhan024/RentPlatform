"""Iteration 3: Restyle (renamed from DressCircle) - admin panel, condition, item_type, times_rented, active rentals."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://wardrobe-loop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@restyle.in"
ADMIN_PASS = "admin1234"
DEMO_EMAIL = "demo@restyle.in"
DEMO_PASS = "demo1234"
OWNER_EMAIL = "aanya@restyle.in"
OWNER_PASS = "password123"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    return r


@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASS)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"].get("is_admin") is True, "admin user should have is_admin=true"
    return data["token"]


@pytest.fixture(scope="module")
def demo_token():
    r = _login(DEMO_EMAIL, DEMO_PASS)
    assert r.status_code == 200, f"demo login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def owner_token():
    r = _login(OWNER_EMAIL, OWNER_PASS)
    assert r.status_code == 200, f"owner login failed: {r.text}"
    return r.json()["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------------- Auth -----------------
class TestAuth:
    def test_admin_login_is_admin(self):
        r = _login(ADMIN_EMAIL, ADMIN_PASS)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["email"] == ADMIN_EMAIL
        assert u.get("is_admin") is True

    def test_demo_login(self):
        r = _login(DEMO_EMAIL, DEMO_PASS)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == DEMO_EMAIL

    def test_owner_login(self):
        r = _login(OWNER_EMAIL, OWNER_PASS)
        assert r.status_code == 200


# ---------------- Listings: new fields & filters -----------------
class TestListings:
    def test_all_listings_have_new_fields(self):
        r = requests.get(f"{API}/listings", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 25, f"expected >=25 listings (24 dresses + 6 accessories); got {len(rows)}"
        for l in rows:
            assert "condition" in l, f"missing condition on {l.get('id')}"
            assert "item_type" in l, f"missing item_type on {l.get('id')}"
            assert "times_rented" in l, f"missing times_rented on {l.get('id')}"
            assert l["item_type"] in ("dress", "accessory")
            assert l["condition"] in ("New", "Like New", "Good", "Fair", "Well Loved")
            assert isinstance(l["times_rented"], int)

    def test_distance_sort_ascending_no_radius(self):
        r = requests.get(f"{API}/listings", params={"lat": 19.07, "lng": 72.87}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 25, "no radius cap by default should return all"
        dists = [l["distance_km"] for l in rows]
        assert dists == sorted(dists), "distances should be sorted ascending"

    def test_filter_item_type_accessory(self):
        r = requests.get(f"{API}/listings", params={"item_type": "accessory"}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) == 6, f"expected 6 accessories, got {len(rows)}"
        for l in rows:
            assert l["item_type"] == "accessory"

    def test_filter_item_type_dress(self):
        r = requests.get(f"{API}/listings", params={"item_type": "dress"}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 24
        for l in rows:
            assert l["item_type"] == "dress"

    def test_filter_condition_like_new(self):
        r = requests.get(f"{API}/listings", params={"condition": "Like New"}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        for l in rows:
            assert l["condition"] == "Like New"


# ---------------- Booking approval increments counters -----------------
class TestBookingCounters:
    def test_approval_increments_times_rented_and_rentals_count(self, demo_token, owner_token):
        # Find an owner listing (item by aanya)
        # Get owner's user id
        me_owner = requests.get(f"{API}/auth/me", headers=H(owner_token), timeout=30).json()
        me_demo = requests.get(f"{API}/auth/me", headers=H(demo_token), timeout=30).json()
        owner_id = me_owner["id"]
        demo_rentals_before = me_demo.get("rentals_count", 0)

        listings = requests.get(f"{API}/users/{owner_id}/listings", timeout=30).json()
        assert listings, "owner should have listings"
        listing = listings[0]
        times_before = listing.get("times_rented", 0)

        # Demo creates a booking with unique date (offset by time to avoid collisions)
        offset = 600 + int(time.time()) % 100
        from datetime import date, timedelta
        start = (date.today() + timedelta(days=offset)).isoformat()
        br = requests.post(f"{API}/bookings", headers=H(demo_token),
                          json={"listing_id": listing["id"], "start_date": start, "duration_days": 3},
                          timeout=30)
        assert br.status_code == 200, f"booking failed: {br.text}"
        booking = br.json()
        bid = booking["id"]

        # Owner approves
        ar = requests.post(f"{API}/bookings/{bid}/action", headers=H(owner_token),
                          json={"action": "approve"}, timeout=30)
        assert ar.status_code == 200

        # Re-fetch listing
        l_after = requests.get(f"{API}/listings/{listing['id']}", timeout=30).json()
        assert l_after["times_rented"] == times_before + 1, \
            f"times_rented should be {times_before+1}, got {l_after['times_rented']}"

        me_demo2 = requests.get(f"{API}/auth/me", headers=H(demo_token), timeout=30).json()
        assert me_demo2["rentals_count"] == demo_rentals_before + 1

        # Save bid for completion test
        TestBookingCounters._bid = bid

    def test_complete_booking(self, demo_token):
        bid = getattr(TestBookingCounters, "_bid", None)
        if not bid:
            pytest.skip("no booking from previous test")
        # Renter can complete approved booking
        r = requests.post(f"{API}/bookings/{bid}/complete", headers=H(demo_token), timeout=30)
        assert r.status_code == 200
        # Re-fetch booking
        b = requests.get(f"{API}/bookings/{bid}", headers=H(demo_token), timeout=30).json()
        assert b["status"] == "completed"

    def test_complete_non_approved_fails(self, demo_token, owner_token):
        # Create new booking, do NOT approve, try to complete -> should fail 400
        me_owner = requests.get(f"{API}/auth/me", headers=H(owner_token), timeout=30).json()
        listings = requests.get(f"{API}/users/{me_owner['id']}/listings", timeout=30).json()
        listing = listings[1] if len(listings) > 1 else listings[0]
        from datetime import date, timedelta
        offset = 800 + int(time.time()) % 100
        start = (date.today() + timedelta(days=offset)).isoformat()
        br = requests.post(f"{API}/bookings", headers=H(demo_token),
                          json={"listing_id": listing["id"], "start_date": start, "duration_days": 3},
                          timeout=30)
        if br.status_code != 200:
            pytest.skip(f"booking creation failed: {br.text}")
        bid = br.json()["id"]
        r = requests.post(f"{API}/bookings/{bid}/complete", headers=H(demo_token), timeout=30)
        assert r.status_code == 400


# ---------------- Active rentals -----------------
class TestActiveRentals:
    def test_bookings_active_shape(self, demo_token):
        r = requests.get(f"{API}/bookings/active", headers=H(demo_token), timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "on_rent" in data and "delayed" in data
        assert isinstance(data["on_rent"], list)
        assert isinstance(data["delayed"], list)
        for item in data["on_rent"] + data["delayed"]:
            assert "end_date" in item
            assert "delayed" in item
            assert "role" in item


# ---------------- Admin endpoints -----------------
class TestAdmin:
    def test_admin_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        data = r.json()
        for k in ("users", "listings_active", "listings_removed", "bookings_pending",
                  "bookings_approved", "bookings_completed", "reports_open", "reports_resolved"):
            assert k in data, f"missing stat {k}"
            assert isinstance(data[k], int)

    def test_admin_users_list_and_search(self, admin_token):
        r = requests.get(f"{API}/admin/users", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 8
        # search
        r2 = requests.get(f"{API}/admin/users", headers=H(admin_token), params={"q": "aanya"}, timeout=30)
        assert r2.status_code == 200
        assert any("aanya" in u.get("email", "") for u in r2.json())

    def test_admin_listings_filter(self, admin_token):
        r = requests.get(f"{API}/admin/listings", headers=H(admin_token), params={"status": "active"}, timeout=30)
        assert r.status_code == 200
        for l in r.json():
            assert l["status"] == "active"

    def test_admin_remove_and_restore_listing(self, admin_token):
        # Get an active listing
        all_l = requests.get(f"{API}/admin/listings", headers=H(admin_token), params={"status": "active"}, timeout=30).json()
        assert all_l
        lid = all_l[-1]["id"]
        r = requests.post(f"{API}/admin/listings/{lid}/remove", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        l = requests.get(f"{API}/listings/{lid}", timeout=30).json()
        assert l["status"] == "inactive"
        # restore
        r2 = requests.post(f"{API}/admin/listings/{lid}/restore", headers=H(admin_token), timeout=30)
        assert r2.status_code == 200
        l2 = requests.get(f"{API}/listings/{lid}", timeout=30).json()
        assert l2["status"] == "active"

    def test_admin_reports_list_and_resolve(self, admin_token, demo_token):
        # Create a fresh report
        rep = requests.post(f"{API}/reports", headers=H(demo_token),
                           json={"target_type": "listing", "target_id": "TEST_target", "reason": "TEST_iter3"},
                           timeout=30)
        assert rep.status_code == 200
        rid = rep.json()["id"]
        # List
        r = requests.get(f"{API}/admin/reports", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        assert any(x["id"] == rid for x in r.json())
        # Resolve
        rs = requests.post(f"{API}/admin/reports/{rid}/resolve", headers=H(admin_token), timeout=30)
        assert rs.status_code == 200
        r2 = requests.get(f"{API}/admin/reports", headers=H(admin_token), timeout=30).json()
        assert any(x["id"] == rid and x["status"] == "resolved" for x in r2)

    def test_non_admin_forbidden(self, demo_token):
        for path in ["/admin/stats", "/admin/users", "/admin/listings", "/admin/reports", "/admin/bookings"]:
            r = requests.get(f"{API}{path}", headers=H(demo_token), timeout=30)
            assert r.status_code == 403, f"{path} should return 403 for non-admin, got {r.status_code}"

    def test_admin_endpoints_require_auth(self):
        r = requests.get(f"{API}/admin/stats", timeout=30)
        assert r.status_code == 401


# ---------------- Suspend / unsuspend flow -----------------
class TestSuspendFlow:
    def test_suspend_and_login_blocked_then_unsuspend(self, admin_token):
        # Create a temp user to suspend
        import uuid as _uuid
        email = f"TEST_suspend_{_uuid.uuid4().hex[:6]}@restyle.in"
        r = requests.post(f"{API}/auth/signup",
                         json={"name": "TEST Suspend User", "email": email, "password": "testpass123"},
                         timeout=30)
        assert r.status_code == 200
        uid = r.json()["user"]["id"]
        tok = r.json()["token"]
        # Create a listing for that user so we can verify deactivation
        l = requests.post(f"{API}/listings", headers=H(tok),
                         json={"title": "TEST listing", "description": "x", "category": "Western",
                               "size": "M", "color": "Red", "rent_price": 100, "security_deposit": 100,
                               "images": ["https://example.com/x.jpg"]},
                         timeout=30)
        assert l.status_code == 200
        lid = l.json()["id"]
        # Suspend
        s = requests.post(f"{API}/admin/users/{uid}/suspend", headers=H(admin_token), timeout=30)
        assert s.status_code == 200
        # Listing should be deactivated
        ll = requests.get(f"{API}/listings/{lid}", timeout=30).json()
        assert ll["status"] == "inactive"
        # Login should be blocked
        lr = _login(email, "testpass123")
        assert lr.status_code == 403, f"suspended user should get 403, got {lr.status_code}"
        # Unsuspend
        u = requests.post(f"{API}/admin/users/{uid}/unsuspend", headers=H(admin_token), timeout=30)
        assert u.status_code == 200
        lr2 = _login(email, "testpass123")
        assert lr2.status_code == 200
