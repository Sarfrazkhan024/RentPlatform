import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import DressCard from "../components/DressCard";
import { Star, MapPin } from "lucide-react";

export default function Profile() {
  const { user, refresh } = useAuth();
  const { userId } = useParams();
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState({ as_renter: [], as_owner: [] });
  const [wishlist, setWishlist] = useState([]);
  const [profileUser, setProfileUser] = useState(null);

  const targetId = userId || user?.id;
  const isMe = !userId || (user && userId === user.id);

  useEffect(() => {
    if (!targetId) return;
    api.get(`/users/${targetId}/listings`).then(r => setListings(r.data));
    if (isMe) {
      api.get("/bookings/mine").then(r => setBookings(r.data));
      api.get("/wishlist").then(r => setWishlist(r.data));
      setProfileUser(user);
    } else {
      // public profile - fetch via listings owner data
      api.get(`/listings`).then(r => {
        const found = r.data.find(l => l.owner_id === targetId);
        if (found) {
          api.get(`/listings/${found.id}`).then(rr => setProfileUser(rr.data.owner));
        }
      });
    }
  }, [targetId, isMe, user]);

  if (!profileUser) return <div className="max-w-7xl mx-auto px-6 py-20 text-[#6E6B68]">Loading profile...</div>;

  return (
    <div className="bg-[#FDFBF7]" data-testid="profile-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        {/* Profile header */}
        <div className="dc-card p-8 flex flex-wrap items-center gap-6">
          <img src={fileUrl(profileUser.avatar)} alt={profileUser.name} className="w-24 h-24 rounded-full object-cover bg-[#F2E8EB]" />
          <div className="flex-1 min-w-[240px]">
            <div className="text-overline text-[#6E6B68]">Member</div>
            <h1 className="font-serif-display text-4xl mt-1">{profileUser.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#6E6B68]">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {profileUser.city}</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="fill-[#9C4154] text-[#9C4154]" /> {profileUser.rating?.toFixed(1)} · reputation</span>
              <span>{profileUser.rentals_count || 0} rentals · {profileUser.listings_count || 0} listings</span>
            </div>
          </div>
          {isMe && (
            <Link to="/upload" data-testid="profile-upload-btn" className="dc-btn-primary text-sm">+ Add Listing</Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 bg-[#F5F2EB] p-1 rounded-full w-fit">
          <TabBtn active={tab === "listings"} onClick={() => setTab("listings")} testId="tab-listings">My Listings</TabBtn>
          {isMe && <TabBtn active={tab === "rentals"} onClick={() => setTab("rentals")} testId="tab-rentals">My Rentals</TabBtn>}
          {isMe && <TabBtn active={tab === "wishlist"} onClick={() => setTab("wishlist")} testId="tab-wishlist">Wishlist</TabBtn>}
        </div>

        <div className="mt-8">
          {tab === "listings" && (
            <Grid empty="No listings yet." data-testid="listings-grid">
              {listings.map(d => <DressCard key={d.id} dress={d} />)}
            </Grid>
          )}
          {tab === "rentals" && isMe && (
            <div className="space-y-4" data-testid="rentals-list">
              {bookings.as_renter.length === 0 && <div className="text-[#6E6B68]">You haven't rented anything yet.</div>}
              {bookings.as_renter.map(b => (
                <Link key={b.id} to={`/booking/${b.id}`} data-testid={`rental-${b.id}`} className="dc-card p-4 flex items-center gap-4 hover:border-[#E8E3DA]">
                  <img src={fileUrl(b.listing?.images?.[0])} alt="" className="w-20 h-24 rounded-lg object-cover bg-[#F5F2EB]" />
                  <div className="flex-1">
                    <div className="font-serif-display text-lg">{b.listing?.title}</div>
                    <div className="text-xs text-[#6E6B68] mt-1">{b.start_date} · {b.duration_days} days · ₹{b.rent_total}</div>
                  </div>
                  <span className={`dc-badge ${b.status === "approved" ? "" : b.status === "rejected" ? "bg-[#FEEAEA] text-[#A53030]" : "bg-[#FFF7E6] text-[#9A7C1A]"}`}>{b.status}</span>
                </Link>
              ))}
            </div>
          )}
          {tab === "wishlist" && isMe && (
            <Grid empty="No saved dresses yet." data-testid="wishlist-grid">
              {wishlist.map(d => <DressCard key={d.id} dress={d} />)}
            </Grid>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children, testId }) {
  return (
    <button onClick={onClick} data-testid={testId} className={`px-5 py-2 text-sm rounded-full transition ${active ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>{children}</button>
  );
}

function Grid({ children, empty }) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return <div className="text-[#6E6B68] py-12 text-center">{empty}</div>;
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 stagger-fade">{children}</div>;
}
