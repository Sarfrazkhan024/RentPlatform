import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import DressCard from "../components/DressCard";
import { Search, Filter, MapPin } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["All", "Western", "Ethnic", "Partywear", "Formal"];
const SIZES = ["All", "XS", "S", "M", "L", "XL", "XXL"];
const OCCASIONS = ["All", "Wedding", "Cocktail", "Brunch", "Reception", "Festival", "Sangeet", "Casual", "Office"];

export default function Feed() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState("Mumbai");
  const [coords, setCoords] = useState({ lat: 19.0760, lng: 72.8777 });
  const [filters, setFilters] = useState({ category: "All", size: "All", occasion: "All", radius: 50, q: "", min: "", max: "" });
  const [wishlist, setWishlist] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/cities").then(r => setCities(r.data));
    if (user) {
      api.get("/wishlist").then(r => setWishlist(new Set(r.data.map(d => d.id)))).catch(() => {});
      setCity(user.city);
      setCoords({ lat: user.lat, lng: user.lng });
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("lat", coords.lat); params.set("lng", coords.lng);
    params.set("radius_km", filters.radius);
    if (filters.category !== "All") params.set("category", filters.category);
    if (filters.size !== "All") params.set("size", filters.size);
    if (filters.occasion !== "All") params.set("occasion", filters.occasion);
    if (filters.min) params.set("min_price", filters.min);
    if (filters.max) params.set("max_price", filters.max);
    if (filters.q) params.set("q", filters.q);

    Promise.all([
      api.get(`/listings?${params.toString()}`),
      api.get(`/listings/trending?lat=${coords.lat}&lng=${coords.lng}`),
    ]).then(([a, b]) => {
      setListings(a.data);
      setTrending(b.data);
    }).finally(() => setLoading(false));
  }, [filters, coords]);

  const toggleWishlist = async (listing_id) => {
    if (!user) { toast.error("Sign in to save favourites"); return; }
    try {
      const { data } = await api.post("/wishlist/toggle", { listing_id });
      setWishlist(prev => {
        const next = new Set(prev);
        if (data.saved) next.add(listing_id); else next.delete(listing_id);
        return next;
      });
      toast.success(data.saved ? "Added to wishlist" : "Removed from wishlist");
    } catch { toast.error("Failed"); }
  };

  const onCity = (cname) => {
    const c = cities.find(c => c.name === cname);
    if (c) { setCity(cname); setCoords({ lat: c.lat, lng: c.lng }); }
  };

  return (
    <div className="bg-[#FDFBF7]" data-testid="feed-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-overline text-[#9C4154]">Hyperlocal feed</span>
            <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Dresses near you.</h1>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#9C4154]" />
            <select data-testid="city-selector" value={city} onChange={(e) => onCity(e.target.value)} className="bg-transparent border-b border-[#E8E3DA] focus:outline-none focus:border-[#9C4154] py-2 px-1">
              {cities.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Search bar */}
        <div className="dc-card p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6B68]" />
            <input
              data-testid="search-input"
              placeholder="Search dresses, brands, occasions..."
              value={filters.q}
              onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
              className="dc-input pl-10"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} data-testid="toggle-filters" className="dc-btn-secondary">
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* Filter row */}
        {showFilters && (
          <div className="dc-card p-5 mb-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SelectInput label="Category" testId="filter-category" value={filters.category} onChange={(v) => setFilters(f => ({ ...f, category: v }))} options={CATEGORIES} />
            <SelectInput label="Size" testId="filter-size" value={filters.size} onChange={(v) => setFilters(f => ({ ...f, size: v }))} options={SIZES} />
            <SelectInput label="Occasion" testId="filter-occasion" value={filters.occasion} onChange={(v) => setFilters(f => ({ ...f, occasion: v }))} options={OCCASIONS} />
            <div>
              <label className="text-overline text-[#6E6B68] block mb-2">Price (₹)</label>
              <div className="flex gap-2">
                <input data-testid="filter-min" type="number" placeholder="Min" value={filters.min} onChange={(e) => setFilters(f => ({ ...f, min: e.target.value }))} className="dc-input" />
                <input data-testid="filter-max" type="number" placeholder="Max" value={filters.max} onChange={(e) => setFilters(f => ({ ...f, max: e.target.value }))} className="dc-input" />
              </div>
            </div>
            <div>
              <label className="text-overline text-[#6E6B68] block mb-2">Distance ({filters.radius} km)</label>
              <input data-testid="filter-radius" type="range" min={2} max={500} value={filters.radius} onChange={(e) => setFilters(f => ({ ...f, radius: Number(e.target.value) }))} className="w-full accent-[#9C4154]" />
            </div>
          </div>
        )}

        {/* Trending strip */}
        {trending.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif-display text-2xl mb-4">Trending Near You</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {trending.map(d => (
                <div key={d.id} className="min-w-[200px]">
                  <DressCard dress={d} onWishlist={toggleWishlist} isWishlisted={wishlist.has(d.id)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main grid */}
        <h2 className="font-serif-display text-2xl mb-4" data-testid="feed-section-title">{listings.length} {listings.length === 1 ? "dress" : "dresses"} available</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="dc-card p-3"><div className="aspect-[3/4] bg-[#F5F2EB] rounded-xl animate-pulse" /></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-[#6E6B68]">No dresses match your filters. Try expanding the radius.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 stagger-fade">
            {listings.map(d => (
              <DressCard key={d.id} dress={d} onWishlist={toggleWishlist} isWishlisted={wishlist.has(d.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options, testId }) {
  return (
    <div>
      <label className="text-overline text-[#6E6B68] block mb-2">{label}</label>
      <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} className="dc-input">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
