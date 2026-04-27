import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Diamond, Sparkles, MapPin, Camera, MessageCircle } from "lucide-react";
import { api, fileUrl } from "../lib/api";

const HERO_COLLAGE = [
  "https://images.pexels.com/photos/33343580/pexels-photo-33343580.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=700",
  "https://images.pexels.com/photos/19588679/pexels-photo-19588679.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=700",
  "https://images.unsplash.com/photo-1601859574492-8658b6f7f990?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
  "https://images.pexels.com/photos/12062663/pexels-photo-12062663.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=700",
];

const CATEGORIES = [
  { name: "Wedding", q: "occasion=Wedding", img: "https://images.pexels.com/photos/19588679/pexels-photo-19588679.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { name: "Cocktail", q: "occasion=Cocktail", img: "https://images.unsplash.com/photo-1601859574492-8658b6f7f990?crop=entropy&cs=srgb&fm=jpg&q=85&w=400" },
  { name: "Sangeet", q: "occasion=Sangeet", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400" },
  { name: "Festival", q: "occasion=Festival", img: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?crop=entropy&cs=srgb&fm=jpg&q=85&w=400" },
  { name: "Western", q: "category=Western", img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400" },
  { name: "Ethnic", q: "category=Ethnic", img: "https://images.pexels.com/photos/33343580/pexels-photo-33343580.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { name: "Partywear", q: "category=Partywear", img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=400" },
  { name: "Formal", q: "category=Formal", img: "https://images.pexels.com/photos/12062663/pexels-photo-12062663.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
];

const MARQUEE = ["Pre-loved Couture", "Nearby & Verified", "Zero Waste, Full Glamour", "Free to List", "By Indian Women, For Indian Women", "Every Outfit, Once Belonged"];

export default function Landing() {
  const [all, setAll] = useState([]);
  const [byOcc, setByOcc] = useState({ Wedding: [], Cocktail: [], Festival: [] });
  const [under1000, setUnder1000] = useState([]);

  useEffect(() => {
    api.get("/listings?radius_km=10000&limit=60").then(r => setAll(r.data));
    Promise.all([
      api.get("/listings?occasion=Wedding&radius_km=10000&limit=10"),
      api.get("/listings?occasion=Cocktail&radius_km=10000&limit=10"),
      api.get("/listings?occasion=Festival&radius_km=10000&limit=10"),
    ]).then(([w, c, f]) => setByOcc({ Wedding: w.data, Cocktail: c.data, Festival: f.data }));
    api.get("/listings?max_price=1000&radius_km=10000&limit=10").then(r => setUnder1000(r.data));
  }, []);

  const newIn = all.slice(0, 12);

  return (
    <div className="bg-[#FDFBF7]" data-testid="landing-page">
      {/* Marquee promo bar */}
      <div className="bg-[#1A1A1A] text-[#FDFBF7] py-3 marquee">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="text-overline text-[#E8D7AE] flex items-center gap-3 whitespace-nowrap text-[10px]">
              <Diamond size={9} className="text-[#C9A661]" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Compact hero with collage */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-12">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <span className="dc-badge" data-testid="hero-badge">For the Indian Woman, By Her Closet</span>
            <h1 className="font-serif-display text-5xl sm:text-6xl mt-4 leading-[1.05] tracking-tight">
              Rent a <span className="gold-underline">look.</span> <em className="text-[#9C4154] font-light">List yours.</em>
            </h1>
            <p className="mt-4 text-sm text-[#6E6B68] max-w-md">
              Hyperlocal fashion rental & resale. Pre-loved couture from women near you.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/feed" data-testid="hero-cta-discover" className="dc-btn-primary text-sm">Shop Nearby <ArrowRight size={14} /></Link>
              <Link to="/auth" data-testid="hero-cta-list" className="dc-btn-secondary text-sm">List Your Dress</Link>
            </div>
            <div className="mt-6 flex items-center gap-6 text-xs text-[#6E6B68]">
              <span><strong className="text-[#1A1A1A] font-serif-display text-lg">2.4k+</strong> looks</span>
              <span className="w-px h-6 bg-[#E8E3DA]" />
              <span><strong className="text-[#1A1A1A] font-serif-display text-lg">8</strong> cities</span>
              <span className="w-px h-6 bg-[#E8E3DA]" />
              <span><strong className="text-[#1A1A1A] font-serif-display text-lg">4.9★</strong> rated</span>
            </div>
          </div>

          {/* Image collage */}
          <div className="lg:col-span-7 grid grid-cols-4 grid-rows-2 gap-3 h-[420px]">
            <div className="col-span-2 row-span-2 image-zoom rounded-2xl overflow-hidden bg-[#F5F2EB]">
              <img src={HERO_COLLAGE[0]} alt="hero" className="w-full h-full object-cover" />
            </div>
            <div className="col-span-2 image-zoom rounded-2xl overflow-hidden bg-[#F5F2EB]">
              <img src={HERO_COLLAGE[1]} alt="hero" className="w-full h-full object-cover" />
            </div>
            <div className="image-zoom rounded-2xl overflow-hidden bg-[#F5F2EB]">
              <img src={HERO_COLLAGE[2]} alt="hero" className="w-full h-full object-cover" />
            </div>
            <div className="image-zoom rounded-2xl overflow-hidden bg-[#F5F2EB]">
              <img src={HERO_COLLAGE[3]} alt="hero" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-10" data-testid="category-pills-section">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-overline text-[#9C4154]">Shop by occasion</span>
            <h2 className="font-serif-display text-2xl sm:text-3xl mt-1">Browse the racks.</h2>
          </div>
          <Link to="/feed" className="text-xs text-[#9C4154] hover:underline">All categories →</Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORIES.map(c => (
            <Link key={c.name} to={`/feed?${c.q}`} data-testid={`cat-${c.name.toLowerCase()}`} className="text-center group">
              <div className="aspect-square rounded-full overflow-hidden bg-[#F5F2EB] image-zoom ring-1 ring-transparent group-hover:ring-[#C9A661]/50 transition">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-xs mt-2 font-medium group-hover:text-[#9C4154] transition">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Big product grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-overline text-[#9C4154]">New in the circle</span>
            <h2 className="font-serif-display text-2xl sm:text-3xl mt-1">Just listed near you.</h2>
          </div>
          <Link to="/feed" data-testid="see-all-new" className="text-xs text-[#9C4154] hover:underline">See all →</Link>
        </div>
        {newIn.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F5F2EB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 stagger-fade" data-testid="new-in-grid">
            {newIn.map(d => <MiniDressCard key={d.id} dress={d} />)}
          </div>
        )}
      </section>

      {/* By occasion strips */}
      {["Wedding", "Cocktail", "Festival"].map((occ) => (
        <OccasionStrip key={occ} title={occ} subtitle={
          occ === "Wedding" ? "Lehengas, sarees & gowns for the big day" :
          occ === "Cocktail" ? "Sequins, slip dresses & cocktail magic" :
          "Festive ethnic for Diwali, Holi, Karwa Chauth"
        } items={byOcc[occ]} />
      ))}

      {/* Under ₹1000 deals strip */}
      <section className="bg-[#1A1A1A] py-12 my-12 relative overflow-hidden" data-testid="deals-strip">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A661] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-overline text-[#C9A661]">Steal alert</span>
              <h2 className="font-serif-display text-3xl mt-1 text-[#FDFBF7]">Under <em className="text-[#C9A661]">₹1,000.</em></h2>
              <p className="text-sm text-[#FDFBF7]/60 mt-1">Affordable rentals to refresh your wardrobe weekly.</p>
            </div>
            <Link to="/feed?max_price=1000" className="text-xs text-[#C9A661] hover:underline">View all →</Link>
          </div>
          <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-4 overflow-x-auto pb-2">
            {(under1000.length > 0 ? under1000 : Array.from({ length: 6 })).map((d, i) => (
              d?.id ? (
                <Link key={d.id} to={`/dress/${d.id}`} data-testid={`deal-${d.id}`} className="group">
                  <div className="aspect-[3/4] image-zoom rounded-xl overflow-hidden bg-[#FDFBF7]/5">
                    <img src={fileUrl(d.images?.[0])} alt={d.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 text-[#FDFBF7]">
                    <div className="text-xs text-[#FDFBF7]/60 line-clamp-1">{d.title}</div>
                    <div className="text-sm font-medium text-[#C9A661]">₹{d.rent_price?.toLocaleString("en-IN")} <span className="text-[10px] text-[#FDFBF7]/50">/3 days</span></div>
                  </div>
                </Link>
              ) : (
                <div key={i} className="aspect-[3/4] bg-[#FDFBF7]/5 rounded-xl animate-pulse" />
              )
            ))}
          </div>
        </div>
      </section>

      {/* Compact How it works */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-8" data-testid="how-it-works">
        <div className="text-center mb-8">
          <span className="text-overline text-[#9C4154]">How it works</span>
          <h2 className="font-serif-display text-3xl mt-1">Three steps to a <em className="text-[#9C4154]">perfect fit.</em></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "01", icon: MapPin, t: "Browse nearby", b: "Filter by occasion, size & distance." },
            { n: "02", icon: Camera, t: "Request to rent", b: "Pick dates. Owner approves & unlocks contact." },
            { n: "03", icon: MessageCircle, t: "Meet & swap", b: "Coordinate offline. Wear it, return it, review." },
          ].map((s, i) => (
            <div key={i} className="dc-card p-5 flex items-center gap-4" data-testid={`how-step-${i}`}>
              <div className="font-serif-display text-4xl text-[#E8D7AE] leading-none">{s.n}</div>
              <div>
                <div className="flex items-center gap-2"><s.icon size={14} className="text-[#9C4154]" /><h3 className="font-serif-display text-lg">{s.t}</h3></div>
                <p className="text-xs text-[#6E6B68] mt-1">{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#F2E8EB] via-[#FDFBF7] to-[#E8D7AE]/40 py-16 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Diamond size={18} className="mx-auto text-[#C9A661] mb-3" />
          <h2 className="font-serif-display text-3xl sm:text-4xl">Your closet, <em className="text-[#9C4154]">in circulation.</em></h2>
          <p className="text-sm text-[#6E6B68] mt-3 max-w-lg mx-auto">Free to join. No commission. Earn from every dress you've already loved.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/auth" data-testid="bottom-cta-join" className="dc-btn-primary">Join the Circle</Link>
            <Link to="/feed" data-testid="bottom-cta-browse" className="dc-btn-secondary">Browse First</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniDressCard({ dress }) {
  return (
    <Link to={`/dress/${dress.id}`} data-testid={`landing-dress-${dress.id}`} className="group block">
      <div className="image-zoom relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F5F2EB]">
        <img src={fileUrl(dress.images?.[0])} alt={dress.title} className="w-full h-full object-cover" loading="lazy" />
        {dress.sale_price && (
          <span className="absolute top-2 left-2 dc-badge text-[9px] py-0.5 px-2">For Sale</span>
        )}
      </div>
      <div className="pt-2 px-0.5">
        <div className="text-[10px] text-[#6E6B68] tracking-wide uppercase">{dress.category} · {dress.size}</div>
        <div className="text-sm font-medium text-[#1A1A1A] line-clamp-1 mt-0.5">{dress.title}</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm text-[#9C4154] font-medium">₹{dress.rent_price?.toLocaleString("en-IN")}</span>
          <span className="text-[10px] text-[#6E6B68]">/3 days</span>
        </div>
      </div>
    </Link>
  );
}

function OccasionStrip({ title, subtitle, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-12 py-8" data-testid={`strip-${title.toLowerCase()}`}>
      <div className="flex items-end justify-between mb-5">
        <div>
          <span className="text-overline text-[#9C4154]">{title}</span>
          <h2 className="font-serif-display text-2xl sm:text-3xl mt-1">{subtitle}</h2>
        </div>
        <Link to={`/feed?occasion=${title}`} className="text-xs text-[#9C4154] hover:underline whitespace-nowrap">See all →</Link>
      </div>
      <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-4 overflow-x-auto pb-2 -mx-6 px-6 lg:-mx-12 lg:px-12">
        {items.map(d => <MiniDressCard key={d.id} dress={d} />)}
      </div>
    </section>
  );
}
