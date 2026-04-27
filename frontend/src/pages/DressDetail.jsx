import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Heart, MapPin, Calendar, Star, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { toast } from "sonner";

const DURATIONS = [3, 6, 9];

export default function DressDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [date, setDate] = useState();
  const [duration, setDuration] = useState(3);
  const [requesting, setRequesting] = useState(false);
  const [note, setNote] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/listings/${id}`).then(r => setDress(r.data)).finally(() => setLoading(false));
    if (user) api.get("/wishlist").then(r => setIsWishlisted(r.data.some(d => d.id === id))).catch(() => {});
  }, [id, user]);

  const toggleWishlist = async () => {
    if (!user) { toast.error("Sign in to save"); return; }
    const { data } = await api.post("/wishlist/toggle", { listing_id: id });
    setIsWishlisted(data.saved);
    toast.success(data.saved ? "Saved" : "Removed");
  };

  const requestRent = async () => {
    if (!user) { nav("/auth"); return; }
    if (!date) { toast.error("Pick a start date"); return; }
    setRequesting(true);
    try {
      const { data } = await api.post("/bookings", {
        listing_id: id,
        start_date: date.toISOString().slice(0, 10),
        duration_days: duration,
        note,
      });
      toast.success("Request sent! Owner will respond shortly.");
      nav(`/booking/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to request");
    } finally { setRequesting(false); }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-[#6E6B68]">Loading...</div>;
  if (!dress) return <div className="max-w-7xl mx-auto px-6 py-20 text-center">Listing not found.</div>;

  const bookedSet = new Set(dress.booked_dates || []);
  const isBooked = (d) => bookedSet.has(d.toISOString().slice(0, 10));

  return (
    <div className="bg-[#FDFBF7]" data-testid="dress-detail-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <Link to="/feed" className="text-sm text-[#6E6B68] hover:text-[#9C4154] inline-flex items-center gap-1 mb-6"><ChevronLeft size={16} /> Back to feed</Link>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="image-zoom relative aspect-[4/5] bg-[#F5F2EB] rounded-2xl overflow-hidden">
              <img src={fileUrl(dress.images[imgIdx])} alt={dress.title} className="w-full h-full object-cover" />
              {dress.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i - 1 + dress.images.length) % dress.images.length)} data-testid="img-prev" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><ChevronLeft size={16} /></button>
                  <button onClick={() => setImgIdx((i) => (i + 1) % dress.images.length)} data-testid="img-next" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><ChevronRight size={16} /></button>
                </>
              )}
              <button onClick={toggleWishlist} data-testid="wishlist-btn" className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center hover:bg-white">
                <Heart size={18} className={isWishlisted ? "fill-[#9C4154] text-[#9C4154]" : "text-[#1A1A1A]"} />
              </button>
            </div>
            {dress.images.length > 1 && (
              <div className="flex gap-3 mt-3 overflow-x-auto">
                {dress.images.map((src, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} data-testid={`thumb-${i}`} className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${i === imgIdx ? "ring-2 ring-[#9C4154]" : "opacity-70 hover:opacity-100"}`}>
                    <img src={fileUrl(src)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 text-sm text-[#6E6B68]">
              <span className="dc-badge">{dress.category}</span>
              {dress.distance_km !== undefined && <span className="flex items-center gap-1"><MapPin size={12} /> {dress.distance_km} km · {dress.city}</span>}
            </div>
            <h1 className="font-serif-display text-4xl sm:text-5xl mt-3 leading-tight">{dress.title}</h1>
            <p className="text-[#6E6B68] mt-3 leading-relaxed">{dress.description}</p>

            <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
              <Spec label="Size" value={dress.size} />
              <Spec label="Color" value={dress.color} />
              <Spec label="Brand" value={dress.brand || "—"} />
              {dress.occasion && <Spec label="Occasion" value={dress.occasion} />}
            </div>

            <div className="dc-card p-6 mt-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-overline text-[#6E6B68]">Rent</div>
                  <div className="font-serif-display text-3xl text-[#1A1A1A]">₹{dress.rent_price.toLocaleString("en-IN")}<span className="text-sm text-[#6E6B68]"> / 3 days</span></div>
                </div>
                <div className="text-right">
                  <div className="text-overline text-[#6E6B68]">Deposit</div>
                  <div className="text-lg">₹{dress.security_deposit.toLocaleString("en-IN")}</div>
                </div>
              </div>
              {dress.sale_price && (
                <>
                  <div className="dc-divider my-4" />
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-overline text-[#6E6B68]">Buy outright</div>
                      <div className="font-serif-display text-2xl text-[#9C4154]">₹{dress.sale_price.toLocaleString("en-IN")}</div>
                    </div>
                    <button data-testid="buy-now-btn" onClick={() => nav(user ? `/booking/buy?id=${dress.id}` : "/auth")} className="dc-btn-secondary text-sm">Buy Now</button>
                  </div>
                </>
              )}

              <div className="dc-divider my-5" />

              <label className="text-overline text-[#6E6B68] block mb-2">Choose start date</label>
              <div className="rounded-xl border border-[#E8E3DA] p-2">
                <CalendarUI
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => isBooked(d) || d < new Date(new Date().toDateString())}
                  data-testid="rent-calendar"
                />
              </div>

              <label className="text-overline text-[#6E6B68] block mb-2 mt-5">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)} data-testid={`duration-${d}`} className={`py-3 rounded-full text-sm transition ${duration === d ? "bg-[#9C4154] text-white" : "bg-[#F5F2EB] text-[#1A1A1A] hover:bg-[#F2E8EB]"}`}>
                    {d} days
                  </button>
                ))}
              </div>

              <label className="text-overline text-[#6E6B68] block mb-2 mt-5">Message to owner (optional)</label>
              <textarea data-testid="rent-note" value={note} onChange={(e) => setNote(e.target.value)} className="dc-input" style={{ height: "auto", minHeight: "5rem", padding: "0.75rem 1rem" }} placeholder="Hi! I'd love to rent this for..." />

              <button data-testid="request-rent-btn" disabled={requesting} onClick={requestRent} className="dc-btn-primary w-full mt-5">
                {requesting ? "Sending..." : `Request to Rent · ₹${(dress.rent_price * (duration / 3)).toLocaleString("en-IN")}`}
              </button>

              <div className="text-xs text-[#6E6B68] mt-3 flex items-start gap-2"><ShieldCheck size={14} className="text-[#9C4154] mt-0.5" /> Contact details are revealed only after the owner approves your request.</div>
            </div>

            {/* Owner card */}
            {dress.owner && (
              <div className="dc-card p-5 mt-5 flex items-center gap-4">
                <img src={fileUrl(dress.owner.avatar)} alt={dress.owner.name} className="w-14 h-14 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-xs text-[#6E6B68]">Listed by</div>
                  <div className="font-medium">{dress.owner.name}</div>
                  <div className="flex items-center gap-1 text-xs text-[#6E6B68] mt-0.5">
                    <Star size={12} className="fill-[#9C4154] text-[#9C4154]" /> {dress.owner.rating?.toFixed(1)} · {dress.owner.rentals_count} rentals
                  </div>
                </div>
                <Link to={`/profile/${dress.owner.id}`} data-testid="owner-link" className="text-xs text-[#9C4154] hover:underline">View profile</Link>
              </div>
            )}

            {/* Late return policy */}
            <div className="dc-card p-5 mt-5 bg-[#FDF6E8] border border-[#E8E3DA]">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-[#9C4154] mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Late return policy</div>
                  <p className="text-xs text-[#6E6B68] mt-1 leading-relaxed">If the dress is returned late, ₹100 per day will be deducted from your security deposit. Damages exceeding wear and tear may forfeit the full deposit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="font-serif-display text-3xl mb-6">Reviews</h2>
          {dress.reviews?.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {dress.reviews.map(r => (
                <div key={r.id} className="dc-card p-5">
                  <div className="flex items-center gap-3">
                    <img src={fileUrl(r.user_avatar)} alt={r.user_name} className="w-10 h-10 rounded-full object-cover bg-[#F2E8EB]" />
                    <div>
                      <div className="text-sm font-medium">{r.user_name}</div>
                      <div className="flex gap-0.5 text-[#9C4154]">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-current" />)}</div>
                    </div>
                  </div>
                  <p className="text-sm text-[#6E6B68] mt-3">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#6E6B68]">No reviews yet. Be the first to rent and review.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="dc-card p-3 text-center">
      <div className="text-overline text-[#6E6B68]">{label}</div>
      <div className="text-sm mt-1 font-medium">{value}</div>
    </div>
  );
}
