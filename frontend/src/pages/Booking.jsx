import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { CheckCircle, Phone, MessageSquare, ArrowLeft, Star } from "lucide-react";
import ReviewForm from "../components/ReviewForm";

export default function Booking() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [reviewed, setReviewed] = useState(false);

  const load = () => api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data));
  useEffect(() => { load(); }, [bookingId]);

  if (!booking) return <div className="max-w-3xl mx-auto p-10 text-[#6E6B68]">Loading...</div>;

  const other = user.id === booking.renter_id ? booking.owner : booking.renter;
  const isOwner = user.id === booking.owner_id;

  return (
    <div className="bg-[#FDFBF7]" data-testid="booking-page">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
        <Link to={isOwner ? "/dashboard" : "/profile"} className="text-sm text-[#6E6B68] hover:text-[#9C4154] inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Back</Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-[#F2E8EB] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-[#9C4154]" />
          </div>
          <span className="text-overline text-[#9C4154]">Booking {booking.status}</span>
          <h1 className="font-serif-display text-4xl mt-2">
            {booking.status === "pending" ? "Request sent." : booking.status === "approved" ? "You're confirmed!" : "Booking declined"}
          </h1>
          <p className="text-[#6E6B68] mt-2 max-w-md mx-auto">
            {booking.status === "pending" ? "The owner has been notified. We'll let you know when they respond." :
             booking.status === "approved" ? "Contact details are now visible. Coordinate the swap with the owner." :
             "Try another dress from the feed."}
          </p>
        </div>

        <div className="dc-card p-6">
          <div className="flex gap-4 items-center">
            <img src={fileUrl(booking.listing?.images?.[0])} alt="" className="w-20 h-24 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="font-serif-display text-2xl">{booking.listing?.title}</div>
              <div className="text-sm text-[#6E6B68] mt-1">{booking.start_date} · {booking.duration_days} days</div>
            </div>
            <Link to={`/dress/${booking.listing?.id}`} className="text-xs text-[#9C4154] hover:underline">View dress</Link>
          </div>

          <div className="dc-divider my-5" />

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Row label="Rent total" value={`₹${booking.rent_total?.toLocaleString("en-IN")}`} />
            <Row label="Security deposit" value={`₹${booking.security_deposit?.toLocaleString("en-IN")}`} />
            <Row label="Status" value={booking.status} />
            <Row label={isOwner ? "Renter" : "Owner"} value={other?.name} />
          </div>

          {booking.status === "approved" && (
            <>
              <div className="dc-divider my-5" />
              <div className="bg-[#F2E8EB] p-4 rounded-xl">
                <div className="text-overline text-[#9C4154] mb-2">Contact unlocked</div>
                {other?.phone ? (
                  <a href={`tel:${other.phone}`} data-testid="contact-phone" className="text-xl font-medium flex items-center gap-2"><Phone size={18} /> {other.phone}</a>
                ) : (
                  <div className="text-sm text-[#6E6B68]">Contact will be revealed once the booking is approved.</div>
                )}
                {other?.email && <div className="text-sm text-[#6E6B68] mt-1">{other.email}</div>}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Link to={`/chat/${booking.id}`} data-testid="open-chat" className="dc-btn-secondary flex-1"><MessageSquare size={14} /> Open Chat</Link>
          {!isOwner && <Link to="/feed" className="dc-btn-primary flex-1">Browse more</Link>}
        </div>

        {/* Review form: shown to renter when booking approved */}
        {!isOwner && booking.status === "approved" && !reviewed && (
          <ReviewForm
            listingId={booking.listing?.id}
            bookingId={booking.id}
            onDone={() => setReviewed(true)}
          />
        )}
        {reviewed && (
          <div className="dc-card p-5 mt-6 text-center text-sm text-[#9C4154] flex items-center justify-center gap-2" data-testid="review-thanks">
            <Star size={14} className="fill-[#C9A661] text-[#C9A661]" /> Review posted. Thank you!
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <div className="text-overline text-[#6E6B68]">{label}</div>
      <div className="mt-1 font-medium capitalize">{value}</div>
    </div>
  );
}
