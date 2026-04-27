import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import DressCard from "../components/DressCard";
import { Heart } from "lucide-react";
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

  return (
    <div className="bg-[#FDFBF7]" data-testid="wishlist-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <span className="text-overline text-[#9C4154]">Saved for later</span>
        <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Your wishlist.</h1>
        <p className="text-[#6E6B68] mt-2">Dresses you've saved. We'll ping you when they're available again.</p>

        <div className="mt-10">
          {loading ? <div className="text-[#6E6B68]">Loading...</div>
            : items.length === 0 ? (
              <div className="dc-card p-12 text-center text-[#6E6B68]">
                <Heart size={28} className="mx-auto mb-3 opacity-50" />
                Browse the feed and tap the heart on dresses you love.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 stagger-fade">
                {items.map(d => <DressCard key={d.id} dress={d} onWishlist={toggle} isWishlisted={true} />)}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
