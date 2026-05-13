"""Iteration 4: Listing approval workflow + admin CRUD on users/listings."""
import os
import time
import uuid
import requests
import pytest
from datetime import date, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://wardrobe-loop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@restyle.in"
ADMIN_PASS = "admin1234"
DEMO_EMAIL = "demo@restyle.in"
DEMO_PASS = "demo1234"
OWNER_EMAIL = "aanya@restyle.in"
OWNER_PASS = "password123"


def _login(email, password):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASS)
    assert r.status_code == 200, f"admin login failed: {r.text}"
    return r.json()["token"]


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


def _create_listing(token, title_suffix=""):
    payload = {
        "title": f"TEST_iter4 {title_suffix}".strip(),
        "description": "iter4 test listing",
        "category": "Western",
        "size": "M",
        "color": "Red",
        "rent_price": 500,
        "security_deposit": 500,
        "images": ["https://example.com/x.jpg"]
    }
    return requests.post(f"{API}/listings", headers=H(token), json=payload, timeout=30)


# ----------- Listing under_review flow -----------
class TestListingApprovalFlow:
    def test_create_listing_is_under_review(self, owner_token):
        r = _create_listing(owner_token, "create_under_review")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "under_review", f"expected under_review, got {data['status']}"
        TestListingApprovalFlow._under_review_id = data["id"]

    def test_under_review_not_in_public_listings(self, owner_token):
        lid = TestListingApprovalFlow._under_review_id
        r = requests.get(f"{API}/listings", timeout=30)
        assert r.status_code == 200
        ids = [l["id"] for l in r.json()]
        assert lid not in ids, "under_review listing should NOT appear in public GET /api/listings"

    def test_owner_sees_own_under_review_in_profile(self, owner_token):
        me = requests.get(f"{API}/auth/me", headers=H(owner_token), timeout=30).json()
        r = requests.get(f"{API}/users/{me['id']}/listings", headers=H(owner_token), timeout=30)
        assert r.status_code == 200
        ids = [l["id"] for l in r.json()]
        assert TestListingApprovalFlow._under_review_id in ids, "owner should see own under_review listings"

    def test_other_viewer_does_not_see_under_review(self, owner_token, demo_token):
        me = requests.get(f"{API}/auth/me", headers=H(owner_token), timeout=30).json()
        # viewer = demo (not owner)
        r = requests.get(f"{API}/users/{me['id']}/listings", headers=H(demo_token), timeout=30)
        assert r.status_code == 200
        ids = [l["id"] for l in r.json()]
        assert TestListingApprovalFlow._under_review_id not in ids, \
            "non-owner viewer should NOT see under_review listings"

    def test_admin_notified_on_listing_create(self, admin_token):
        # Admin should receive a notification when a listing is created
        r = requests.get(f"{API}/notifications", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        notifs = r.json()
        # Some notification with type indicating new listing/under_review
        has_new_listing_notif = any(
            n.get("type") in ("listing_pending", "new_listing", "listing_under_review")
            or "review" in (n.get("title", "").lower() + n.get("body", "").lower())
            or "approval" in (n.get("title", "").lower() + n.get("body", "").lower())
            for n in notifs
        )
        assert has_new_listing_notif, f"admin should receive notification about new listing. Got: {[n.get('type') for n in notifs[:10]]}"

    def test_admin_approve_listing(self, admin_token):
        lid = TestListingApprovalFlow._under_review_id
        r = requests.post(f"{API}/admin/listings/{lid}/approve", headers=H(admin_token), timeout=30)
        assert r.status_code == 200, r.text
        # Verify status changed to active
        l = requests.get(f"{API}/listings/{lid}", timeout=30).json()
        assert l["status"] == "active"

    def test_approved_listing_now_visible_publicly(self):
        lid = TestListingApprovalFlow._under_review_id
        r = requests.get(f"{API}/listings", timeout=30).json()
        ids = [l["id"] for l in r]
        assert lid in ids, "approved listing should appear in public listings"

    def test_owner_receives_approval_notification(self, owner_token):
        r = requests.get(f"{API}/notifications", headers=H(owner_token), timeout=30)
        assert r.status_code == 200
        notifs = r.json()
        assert any(n.get("type") == "listing_approved" for n in notifs), \
            f"owner should receive listing_approved notification. Got types: {[n.get('type') for n in notifs[:10]]}"

    def test_approve_already_active_returns_400(self, admin_token):
        lid = TestListingApprovalFlow._under_review_id
        r = requests.post(f"{API}/admin/listings/{lid}/approve", headers=H(admin_token), timeout=30)
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text}"

    def test_admin_reject_listing(self, admin_token, owner_token):
        # create a fresh listing and reject it
        c = _create_listing(owner_token, "to_reject")
        assert c.status_code == 200
        lid = c.json()["id"]
        r = requests.post(f"{API}/admin/listings/{lid}/reject", headers=H(admin_token),
                          json={"reason": "TEST_iter4 reject reason"}, timeout=30)
        assert r.status_code == 200, r.text
        l = requests.get(f"{API}/listings/{lid}", timeout=30).json()
        assert l["status"] == "rejected"

    def test_owner_receives_reject_notification(self, owner_token):
        r = requests.get(f"{API}/notifications", headers=H(owner_token), timeout=30).json()
        assert any(n.get("type") == "listing_rejected" for n in r), \
            f"owner should receive listing_rejected notification"


# ----------- Admin User CRUD -----------
class TestAdminUserCRUD:
    def test_admin_create_user(self, admin_token):
        email = f"TEST_iter4_user_{uuid.uuid4().hex[:6]}@restyle.in"
        payload = {"name": "TEST iter4 user", "email": email, "password": "testpass123",
                   "city": "Pune", "phone": "+919999999999", "is_admin": False}
        r = requests.post(f"{API}/admin/users", headers=H(admin_token), json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["city"] == "Pune"
        assert data["is_admin"] is False
        assert "id" in data
        TestAdminUserCRUD._uid = data["id"]
        TestAdminUserCRUD._email = email

        # Verify can login with created password
        lr = _login(email, "testpass123")
        assert lr.status_code == 200, f"created user should be able to log in: {lr.text}"

    def test_admin_create_user_duplicate_email_400(self, admin_token):
        payload = {"name": "dup", "email": TestAdminUserCRUD._email, "password": "x", "city": "Mumbai"}
        r = requests.post(f"{API}/admin/users", headers=H(admin_token), json=payload, timeout=30)
        assert r.status_code == 400

    def test_admin_update_user(self, admin_token):
        uid = TestAdminUserCRUD._uid
        r = requests.put(f"{API}/admin/users/{uid}", headers=H(admin_token),
                         json={"name": "TEST iter4 updated", "city": "Delhi", "is_admin": True}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST iter4 updated"
        assert data["city"] == "Delhi"
        assert data["is_admin"] is True

    def test_admin_delete_user_cascades(self, admin_token):
        # Create another user with a listing to verify cascade
        email = f"TEST_iter4_cascade_{uuid.uuid4().hex[:6]}@restyle.in"
        cr = requests.post(f"{API}/admin/users", headers=H(admin_token),
                           json={"name": "cascade", "email": email, "password": "p", "city": "Mumbai"}, timeout=30)
        assert cr.status_code == 200
        uid = cr.json()["id"]
        # Login as that user and create a listing
        tok = _login(email, "p").json()["token"]
        l = _create_listing(tok, "cascade")
        assert l.status_code == 200
        lid = l.json()["id"]
        # Delete user via admin
        d = requests.delete(f"{API}/admin/users/{uid}", headers=H(admin_token), timeout=30)
        assert d.status_code == 200, d.text
        # Verify listing is gone
        lr = requests.get(f"{API}/listings/{lid}", timeout=30)
        assert lr.status_code == 404, f"listing should be cascade-deleted, got {lr.status_code}"
        # Verify user is gone (login fails)
        login_after = _login(email, "p")
        assert login_after.status_code in (401, 403), f"deleted user should not login, got {login_after.status_code}"

    def test_admin_cannot_delete_self(self, admin_token):
        me = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=30).json()
        r = requests.delete(f"{API}/admin/users/{me['id']}", headers=H(admin_token), timeout=30)
        assert r.status_code == 400, f"admin should not be able to delete self, got {r.status_code}"

    def test_admin_delete_user_cleanup(self, admin_token):
        # Cleanup the user created in test_admin_create_user
        uid = TestAdminUserCRUD._uid
        r = requests.delete(f"{API}/admin/users/{uid}", headers=H(admin_token), timeout=30)
        assert r.status_code == 200


# ----------- Admin Listing CRUD -----------
class TestAdminListingCRUD:
    def test_admin_listings_enriched_with_owner(self, admin_token):
        r = requests.get(f"{API}/admin/listings", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) > 0
        # Each should have owner snippet
        with_owner = [l for l in rows if l.get("owner") is not None]
        assert len(with_owner) > 0, "admin listings should be enriched with owner data"
        sample = with_owner[0]["owner"]
        assert "name" in sample, f"owner snippet missing 'name': {sample}"
        assert "email" in sample, f"owner snippet missing 'email': {sample}"

    def test_admin_update_listing(self, admin_token, owner_token):
        c = _create_listing(owner_token, "to_update")
        assert c.status_code == 200
        lid = c.json()["id"]
        r = requests.put(f"{API}/admin/listings/{lid}", headers=H(admin_token),
                         json={"title": "TEST_iter4 ADMIN_UPDATED", "rent_price": 1234}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == "TEST_iter4 ADMIN_UPDATED"
        assert data["rent_price"] == 1234
        TestAdminListingCRUD._update_lid = lid

    def test_admin_delete_listing_cascades(self, admin_token, owner_token, demo_token):
        c = _create_listing(owner_token, "to_delete")
        assert c.status_code == 200
        lid = c.json()["id"]
        # Approve so it becomes active
        ar = requests.post(f"{API}/admin/listings/{lid}/approve", headers=H(admin_token), timeout=30)
        assert ar.status_code == 200

        # Demo user adds to wishlist
        w = requests.post(f"{API}/wishlist/toggle", headers=H(demo_token),
                          json={"listing_id": lid}, timeout=30)
        assert w.status_code == 200

        # Get owner listings_count before
        me_owner = requests.get(f"{API}/auth/me", headers=H(owner_token), timeout=30).json()
        owner_id = me_owner["id"]
        # Use admin/users to get listings_count (no public GET /users/{id})
        admin_users = requests.get(f"{API}/admin/users", headers=H(admin_token), timeout=30).json()
        owner_before = next((u for u in admin_users if u["id"] == owner_id), {})
        count_before = owner_before.get("listings_count", 0)

        # Demo creates a pending booking
        offset = 900 + int(time.time()) % 100
        start = (date.today() + timedelta(days=offset)).isoformat()
        br = requests.post(f"{API}/bookings", headers=H(demo_token),
                           json={"listing_id": lid, "start_date": start, "duration_days": 2}, timeout=30)
        bid = br.json().get("id") if br.status_code == 200 else None

        # Admin deletes
        d = requests.delete(f"{API}/admin/listings/{lid}", headers=H(admin_token), timeout=30)
        assert d.status_code == 200, d.text

        # Verify listing gone
        gr = requests.get(f"{API}/listings/{lid}", timeout=30)
        assert gr.status_code == 404

        # Owner listings_count decremented
        admin_users2 = requests.get(f"{API}/admin/users", headers=H(admin_token), timeout=30).json()
        owner_after = next((u for u in admin_users2 if u["id"] == owner_id), {})
        assert owner_after.get("listings_count", 0) == count_before - 1, \
            f"listings_count should decrement: before={count_before}, after={owner_after.get('listings_count')}"

        # Wishlist refs cleared (demo user)
        wl = requests.get(f"{API}/wishlist", headers=H(demo_token), timeout=30).json()
        assert all(l.get("id") != lid for l in wl), "wishlist refs should be cleared after listing delete"

        # Pending booking rejected
        if bid:
            br2 = requests.get(f"{API}/bookings/{bid}", headers=H(demo_token), timeout=30)
            if br2.status_code == 200:
                assert br2.json()["status"] == "rejected", "pending booking should be rejected on listing delete"

    def test_admin_listings_status_filter_under_review(self, admin_token, owner_token):
        # ensure at least one under_review exists
        _create_listing(owner_token, "filter_test")
        r = requests.get(f"{API}/admin/listings", headers=H(admin_token),
                         params={"status": "under_review"}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) > 0
        for l in rows:
            assert l["status"] == "under_review"

    def test_admin_endpoints_require_admin(self, demo_token):
        for method, path in [
            ("post", "/admin/listings/x/approve"),
            ("post", "/admin/listings/x/reject"),
            ("put", "/admin/listings/x"),
            ("delete", "/admin/listings/x"),
            ("post", "/admin/users"),
            ("put", "/admin/users/x"),
            ("delete", "/admin/users/x"),
        ]:
            fn = getattr(requests, method)
            r = fn(f"{API}{path}", headers=H(demo_token),
                   json={"reason": "x"} if method in ("post", "put") else None, timeout=30)
            assert r.status_code == 403, f"{method.upper()} {path} should 403 for non-admin, got {r.status_code}"


# ----------- Cleanup leftover TEST_iter4 listings -----------
class TestCleanup:
    def test_cleanup_test_listings(self, admin_token):
        # find and delete any leftover TEST_iter4 listings
        r = requests.get(f"{API}/admin/listings", headers=H(admin_token), timeout=30)
        if r.status_code != 200:
            pytest.skip("cannot list")
        for l in r.json():
            if l.get("title", "").startswith("TEST_iter4"):
                requests.delete(f"{API}/admin/listings/{l['id']}", headers=H(admin_token), timeout=30)
