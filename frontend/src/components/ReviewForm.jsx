import React, { useState } from "react";
import { api } from "../lib/api";
import { Star } from "lucide-react";
import { toast } from "sonner";

export default function ReviewForm({ listingId, bookingId, onDone }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/reviews", { listing_id: listingId, booking_id: bookingId, rating, comment });
      toast.success("Thank you for your review!");
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} data-testid="review-form" className="dc-card p-6 mt-6">
      <h3 className="font-serif-display text-2xl">Leave a review</h3>
      <p className="text-xs text-[#6E6B68] mt-1">How was your rental experience?</p>

      <div className="flex gap-1 mt-4" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            data-testid={`star-${n}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star size={28} className={(hover || rating) >= n ? "fill-[#C9A661] text-[#C9A661]" : "text-[#E8E3DA]"} />
          </button>
        ))}
      </div>

      <textarea
        data-testid="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share what made the rental wonderful (or what could be better)..."
        className="dc-input mt-4"
        style={{ height: "auto", minHeight: "5rem", padding: "0.75rem 1rem" }}
      />

      <button type="submit" disabled={busy} data-testid="review-submit" className="dc-btn-primary mt-4">
        {busy ? "Posting..." : "Post review"}
      </button>
    </form>
  );
}
