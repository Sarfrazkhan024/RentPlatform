import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import DressCard from "../components/DressCard";
import { Heart, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/wishlist").then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    await api.post("/wishlist/toggle", { listing_id: id });
    toast.success("Removed from wishlist");
    load();
  };

  const toggleNotify = async (id, current) => {
    try {
      await api.post("/wishlist/notify", { listing_id: id, notify: !current });
      toast.success(!current ? "We'll ping you when it's available" : "Notifications off for this dress");
      setItems(prev => prev.map(p => p.id === id ? { ...p, notify_when_available: !current } : p));
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="bg-[#FDFBF7]" data-testid="wishlist-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <span className="text-overline text-[#9C4154]">Saved for later</span>
        <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Your wishlist.</h1>
        <p className="text-[#6E6B68] mt-2">Dresses you've saved. Toggle "notify me" to get pinged when one is back in circulation.</p>

        <div className="mt-10">
          {loading ? <div className="text-[#6E6B68]">Loading...</div>
            : items.length === 0 ? (
              <div className="dc-card p-12 text-center text-[#6E6B68]">
                <Heart size={28} className="mx-auto mb-3 opacity-50" />
                Browse the feed and tap the heart on dresses you love.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 stagger-fade">
                {items.map(d => (
                  <div key={d.id} className="relative">
                    <DressCard dress={d} onWishlist={toggle} isWishlisted={true} />
                    <button
                      onClick={() => toggleNotify(d.id, d.notify_when_available)}
                      data-testid={`notify-toggle-${d.id}`}
                      className={`mt-2 w-full text-xs py-2 rounded-full flex items-center justify-center gap-1.5 transition ${d.notify_when_available ? "bg-[#9C4154] text-white" : "bg-[#F5F2EB] text-[#1A1A1A] hover:bg-[#F2E8EB]"}`}
                    >
                      {d.notify_when_available ? <><Bell size={12} /> You'll be notified</> : <><BellOff size={12} /> Notify me when available</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
