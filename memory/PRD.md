# DressCircle - Product Requirement Document

## Original Problem Statement
Hyperlocal fashion rental and resale platform for women in India. Peer-to-peer marketplace where women rent unused clothes to nearby users or sell pre-owned fashion. Phase 1 is web-first (no payment gateway, no logistics — coordination happens offline). Premium, trustworthy, feminine. Inspired by Vinted, Depop, Rent the Runway, but built for the Indian urban woman.

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI + React Router 7
- **Backend**: FastAPI + Motor (MongoDB async)
- **Database**: MongoDB (UUID-based ids, no `_id` leaks)
- **Storage**: Emergent Object Storage for image uploads
- **Auth**: JWT (bcrypt for passwords) + simulated OTP (code `123456`)
- **Maps**: Google Maps API key configured (stored in env, used client-side)

## User Personas
- Indian women aged 16-40
- College students, working professionals
- Occasional outfit needs (weddings, parties, events)
- Cities: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata, Jaipur

## Core Requirements (static)
1. Splash/Landing, Auth, Home Feed, Filters, Dress Detail, Upload, Booking, Chat/Reveal, Profile, Owner Dashboard, Notifications, Wishlist
2. Location-based discovery with distance + dynamic radius expansion
3. Booking request → owner approval → contact reveal → in-app messaging
4. Availability date locking on approved booking
5. Image upload (object storage), multi-image carousel
6. Wishlist, ratings/reviews, in-app notifications
7. Late return policy displayed clearly
8. No payment gateway, no commission in Phase 1

## What's Implemented (2026-02)
- ✅ Auth: signup, login, OTP (simulated, code `123456`), JWT
- ✅ Listings CRUD with category/size/occasion/price/distance filters
- ✅ Booking request with 3/6/9 day durations + calendar with booked dates blocked
- ✅ Owner approve/reject → contact reveal → date locking
- ✅ In-app chat (polled), wishlist, in-app notifications
- ✅ Reviews scaffolded (read on dress detail)
- ✅ Object Storage backed image upload with /api/files/{id} serving
- ✅ Seed: 7 users + 24 dresses across 6 cities
- ✅ Premium editorial design (Cormorant Garamond + Outfit, ivory/rose palette)

## Iteration 2 (2026-02) — P1 features added
- ✅ Live Google Maps embed on Dress Detail (Maps Embed API)
- ✅ Review submission UI on approved bookings (validated: only renter, only approved/completed, no duplicates)
- ✅ "Notify when available" toggle on Wishlist
- ✅ Report listing/user dialog (`POST /api/reports`)
- ✅ Auto-location detection on Feed (browser geolocation → `/api/geo/reverse`)
- ✅ Top dresses section on Landing (real /trending data, bento layout)
- ✅ Glamour redesign: gold accents, marquee strip, italic serif emphasis, testimonials, gold underline highlights

## Iteration 3 (2026-05) — Rebrand to "Restyle" + 7 feature requests
- ✅ Global rename DressCircle → **Restyle** (all UI, page title, brand mark)
- ✅ Listing model: new `condition` field (New / Like New / Good / Fair / Well Loved)
- ✅ Listing model: `item_type` (dress | accessory) with category-aware UI (dress: Western/Ethnic/Partywear/Formal; accessory: Jewellery/Bags/Shoes/Belts/Scarves)
- ✅ Seeded 6 accessories alongside 24 dresses
- ✅ `times_rented` counter on each listing (bumped on booking approval); shown on card + detail
- ✅ Profile **"On Rent"** tab: live + delayed bookings, "Mark returned" action (`POST /api/bookings/{id}/complete`)
- ✅ **Super Admin Panel** at `/admin` (stats, users, listings, reports). Endpoints: `/api/admin/{stats,users,listings,reports,bookings}` with action verbs (suspend/unsuspend/remove/restore/resolve). Non-admin → 403. Suspend now tags listings as `suspended_by_admin` so unsuspend restores them. Restore-listing rejects if owner still suspended.
- ✅ Default listings sort = distance ascending, no cap (radius_km default 100000)
- ✅ Fixed route order: `/bookings/active` declared before `/bookings/{id}` (caught by testing agent)

## Iteration 4 (2026-05) — Admin CRUD + Listing approval workflow
- ✅ New listings start in `status="under_review"` → admin must approve before public
- ✅ Admin approve / reject endpoints (with reason for reject) + owner notifications
- ✅ Full **Admin CRUD for Users**: create, edit (any field incl. is_admin/suspended), hard delete with cascade (listings, bookings, wishlist, notifications, reports)
- ✅ Full **Admin CRUD for Listings**: edit any field, hard delete with cascade (wishlist clear, pending+approved bookings auto-cancelled with renter notification)
- ✅ Admin panel: new **Pending tab** with approve/reject/preview, **Pending Review** stat card, status filter chips (all/under_review/active/inactive/rejected), view-preview modal
- ✅ Owner Profile: shows their `under_review` listings with "Under review" badge + rejected/removed badges
- ✅ Upload success message: "Listing submitted! It will be live once our team approves it."

## Backlog / Phase 2 (P1/P2)
- P1: Background job to push "notify when available" wishlist alerts
- P1: Rate-limit reports per user; refactor server.py into modular routers
- P2: Subscription billing UI (Free 5 listings vs Paid ₹1000/year unlimited)
- P2: Payment gateway, courier integration, AI styling recommendations

## Test Credentials
See `/app/memory/test_credentials.md`
