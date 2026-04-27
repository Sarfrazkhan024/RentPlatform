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

## Backlog / Phase 2 (P1/P2)
- P1: Background job for "notify when available" wishlist alerts (flag stored, not yet pushed)
- P1: Rate-limit reports per user
- P2: Subscription billing UI (Free 5 listings vs Paid ₹1000/year unlimited)
- P2: Payment gateway, courier integration, AI styling recommendations

## Test Credentials
See `/app/memory/test_credentials.md`
