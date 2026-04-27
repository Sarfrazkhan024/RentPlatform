import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Coins, Recycle, MapPin, Camera, MessageCircle, Star, Diamond } from "lucide-react";
import { api, fileUrl } from "../lib/api";
import DressCard from "../components/DressCard";

const HERO = "https://images.pexels.com/photos/19218498/pexels-photo-19218498.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1400&w=1100";
const TEXTURE = "https://images.unsplash.com/photo-1601859574492-8658b6f7f990?crop=entropy&cs=srgb&fm=jpg&q=85&w=900";
const SAMPLE_FALLBACK = [
  "https://images.pexels.com/photos/33343580/pexels-photo-33343580.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
  "https://images.pexels.com/photos/19588679/pexels-photo-19588679.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
  "https://images.unsplash.com/photo-1601859574492-8658b6f7f990?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.pexels.com/photos/12062663/pexels-photo-12062663.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
];

const TESTIMONIALS = [
  { name: "Aanya, Mumbai", text: "I rented a Sabyasachi-inspired saree for my cousin's wedding at 1/10th the price. The owner was so warm — felt like borrowing from a friend.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&q=85&w=200" },
  { name: "Riya, Bangalore", text: "Listed three lehengas I never wore again. Earned ₹14k in two months. DressCircle is genuinely brilliant.", img: "https://images.unsplash.com/photo-1663560455456-7c2fb0c8cfca?crop=entropy&cs=srgb&fm=jpg&q=85&w=200" },
  { name: "Meera, Delhi", text: "Found the most exquisite emerald anarkali for my engagement. Pickup was 2 km away. Effortless and elegant.", img: "https://images.unsplash.com/photo-1638296986007-98f1e7bb2601?crop=entropy&cs=srgb&fm=jpg&q=85&w=200" },
];

const MARQUEE = ["Pre-loved Couture", "Nearby & Verified", "Zero Waste, Full Glamour", "Free to List", "By Indian Women, For Indian Women", "Every Outfit, Once Belonged"];

export default function Landing() {
  const [top, setTop] = useState([]);

  useEffect(() => {
    api.get("/listings/trending").then(r => setTop(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="bg-[#FDFBF7] overflow-hidden" data-testid="landing-page">
      {/* Marquee strip */}
      <div className="bg-[#1A1A1A] text-[#FDFBF7] py-4 marquee">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="text-overline text-[#E8D7AE] flex items-center gap-3 whitespace-nowrap">
              <Diamond size={10} className="text-[#C9A661]" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24 lg:pt-24 lg:pb-36">
        {/* decorative gold corner */}
        <div className="hidden lg:block absolute top-12 right-12 w-24 h-24 border-t border-r border-[#C9A661]/40" />
        <div className="hidden lg:block absolute bottom-24 left-12 w-24 h-24 border-b border-l border-[#C9A661]/40" />

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 stagger-fade">
            <div className="flex items-center gap-3">
              <span className="dc-badge" data-testid="hero-badge">For the Indian Woman, By Her Closet</span>
              <span className="text-xs text-[#C9A661] flex items-center gap-1"><Diamond size={8} /> EST. 2026</span>
            </div>
            <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight text-[#1A1A1A]">
              Rent a <span className="gold-underline">look.</span><br />
              <em className="text-[#9C4154] font-light">List yours.</em>
            </h1>
            <p className="mt-6 text-base lg:text-lg text-[#6E6B68] max-w-lg leading-relaxed">
              A <span className="em-italic text-[#1A1A1A]">boutique circle</span> of women trading the dresses they've loved once — for weddings, parties, and every moment in-between. Hyperlocal. Trusted. Beautifully curated.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/feed" data-testid="hero-cta-discover" className="dc-btn-primary">
                Discover Nearby <ArrowRight size={16} />
              </Link>
              <Link to="/auth" data-testid="hero-cta-list" className="dc-btn-secondary">
                List Your Dress
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-xs text-[#6E6B68]">
              <div><div className="font-serif-display text-3xl text-[#1A1A1A] number-counter">2,400+</div><div className="mt-1">Looks shared</div></div>
              <div className="w-px h-12 bg-[#C9A661]/40" />
              <div><div className="font-serif-display text-3xl text-[#1A1A1A] number-counter">8</div><div className="mt-1">Indian cities</div></div>
              <div className="w-px h-12 bg-[#C9A661]/40" />
              <div><div className="font-serif-display text-3xl text-[#1A1A1A] flex items-center gap-1 number-counter">4.9 <Star size={14} className="fill-[#C9A661] text-[#C9A661]" /></div><div className="mt-1">Avg owner rating</div></div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="glam-frame">
              <div className="image-zoom rounded-2xl overflow-hidden aspect-[4/5] shadow-[0_40px_100px_rgb(156,65,84,0.18)]">
                <img src={HERO} alt="DressCircle hero" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="hidden lg:block absolute -bottom-10 -left-10 dc-card p-5 max-w-[260px] float-y">
              <div className="flex items-center gap-2 text-overline text-[#9C4154]">
                <Diamond size={10} className="text-[#C9A661]" /> Trending
              </div>
              <div className="font-serif-display text-2xl mt-2">Wedding season</div>
              <div className="text-sm text-[#6E6B68] mt-1">42 new lehengas this week</div>
            </div>
            <div className="hidden lg:flex absolute -top-6 -right-6 dc-card px-5 py-4 items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F2E8EB] to-[#E8D7AE]/40 flex items-center justify-center">
                <Sparkles size={16} className="text-[#9C4154]" />
              </div>
              <div>
                <div className="text-xs font-medium">Zero waste</div>
                <div className="text-[10px] text-[#6E6B68]">100% pre-loved couture</div>
              </div>
            </div>
            {/* texture watermark */}
            <div className="hidden lg:block absolute -z-10 -top-20 -right-20 w-72 h-72 rounded-full opacity-15" style={{ backgroundImage: `url(${TEXTURE})`, backgroundSize: "cover", filter: "blur(40px)" }} />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-[#1A1A1A] text-[#FDFBF7] py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A661] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-overline text-[#C9A661]">Why DressCircle</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl mt-3 text-[#FDFBF7]">
              A wardrobe that <em className="text-[#C9A661]">pays you back.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {[
              { icon: Coins, title: "Earn from your closet", body: "Every dress hanging unworn is potential rent. List it once, earn for years." },
              { icon: Sparkles, title: "Access infinite variety", body: "Borrow from your neighbour's wardrobe. New look every event, no commitment." },
              { icon: Recycle, title: "Zero waste fashion", body: "Wear it ten times, not once. The most beautiful sustainability story is shared." },
            ].map((v, i) => (
              <div key={i} className="rounded-2xl border border-[#C9A661]/25 bg-white/[0.03] p-8 backdrop-blur transition hover:border-[#C9A661]/60 hover:-translate-y-1" data-testid={`value-prop-${i}`}>
                <div className="w-12 h-12 rounded-2xl bg-[#C9A661]/15 flex items-center justify-center mb-5">
                  <v.icon size={20} className="text-[#C9A661]" />
                </div>
                <h3 className="font-serif-display text-2xl">{v.title}</h3>
                <p className="text-sm text-[#FDFBF7]/65 mt-3 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top dresses (real data) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24" data-testid="top-dresses-section">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-overline text-[#9C4154]">Editor's Picks</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl mt-3">Top dresses <em className="text-[#9C4154]">in the circle.</em></h2>
            <p className="text-[#6E6B68] mt-2 text-sm max-w-md">The most-loved pieces this week — handpicked from our most active closets.</p>
          </div>
          <Link to="/feed" data-testid="see-all-link" className="text-sm text-[#9C4154] hover:underline flex items-center gap-1">
            See all listings <ArrowRight size={14} />
          </Link>
        </div>

        {top.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6 stagger-fade">
            {top.slice(0, 6).map((d, i) => (
              <div key={d.id} className={i === 0 ? "md:col-span-2 md:row-span-2" : ""}>
                <FeaturedDressCard dress={d} large={i === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {SAMPLE_FALLBACK.map((src, i) => (
              <div key={i} className="dc-card p-3 image-zoom">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#FDFBF7]">
                  <img src={src} alt="dress" className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-[#F5F2EB] py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-end mb-12">
            <div>
              <span className="text-overline text-[#9C4154]">How it works</span>
              <h2 className="font-serif-display text-4xl sm:text-5xl mt-3">Three steps to a <em className="text-[#9C4154]">perfect fit.</em></h2>
            </div>
            <p className="text-[#6E6B68] leading-relaxed">No payment gateway, no shipping logistics, no friction. Discover within your city, request a rental, and meet over coffee.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: MapPin, t: "Browse nearby", b: "Filter by occasion, size and distance. See what's available within 2-10 km." },
              { n: "02", icon: Camera, t: "Request to rent", b: "Pick your dates, send a request. Owner approves and unlocks contact details." },
              { n: "03", icon: MessageCircle, t: "Meet & swap", b: "Coordinate offline. Wear it, return it. Leave a review for the next girl." },
            ].map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid={`how-step-${i}`}>
                <div className="font-serif-display text-7xl text-[#E8D7AE] leading-none">{s.n}</div>
                <s.icon size={22} className="text-[#9C4154] -mt-6 ml-1" />
                <h3 className="font-serif-display text-2xl mt-5">{s.t}</h3>
                <p className="text-sm text-[#6E6B68] mt-2 leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-overline text-[#9C4154]">Whispers from the circle</span>
          <h2 className="font-serif-display text-4xl sm:text-5xl mt-3">Loved by women, <em className="text-[#9C4154]">across India.</em></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="dc-card p-7 relative" data-testid={`testimonial-${i}`}>
              <div className="font-serif-display text-7xl absolute top-2 left-5 text-[#E8D7AE] leading-none select-none">"</div>
              <p className="text-sm text-[#1A1A1A] leading-relaxed pt-6 italic font-serif-display text-lg">{t.text}</p>
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#E8E3DA]">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="text-sm">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-[10px] text-[#C9A661] flex gap-0.5 mt-0.5">{Array.from({length:5}).map((_,j) => <Star key={j} size={10} className="fill-current"/>)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#F2E8EB] via-[#FDFBF7] to-[#E8D7AE]/40">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url(${TEXTURE})`, backgroundSize: "400px" }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Diamond size={20} className="mx-auto text-[#C9A661] mb-4" />
          <h2 className="font-serif-display text-5xl sm:text-6xl">Your closet, <em className="text-[#9C4154]">in circulation.</em></h2>
          <p className="text-[#6E6B68] mt-5 max-w-xl mx-auto">Join thousands of Indian women earning from what they already own. Free to join, no commission in Phase 1.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth" data-testid="bottom-cta-join" className="dc-btn-primary">Join the Circle</Link>
            <Link to="/feed" data-testid="bottom-cta-browse" className="dc-btn-secondary">Browse First</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedDressCard({ dress, large }) {
  return (
    <Link to={`/dress/${dress.id}`} data-testid={`top-dress-${dress.id}`} className="block group">
      <div className="dc-card overflow-hidden p-3 h-full">
        <div className={`image-zoom relative bg-[#F5F2EB] ${large ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
          <img src={fileUrl(dress.images?.[0])} alt={dress.title} className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute top-3 left-3 dc-badge bg-[#1A1A1A] text-[#E8D7AE] backdrop-blur"><Diamond size={8} className="mr-1" /> Featured</span>
        </div>
        <div className="pt-4 px-1">
          <div className="text-overline text-[#6E6B68]">{dress.category}</div>
          <h3 className={`font-serif-display ${large ? "text-3xl" : "text-xl"} mt-1.5 leading-tight text-[#1A1A1A] line-clamp-2`}>{dress.title}</h3>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-[#1A1A1A] font-medium">₹{dress.rent_price?.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-[#6E6B68] tracking-wide">/ 3 days · Size {dress.size} · {dress.city}</div>
            </div>
            {dress.sale_price && (
              <div className="text-right">
                <div className="text-xs text-[#6E6B68]">Buy</div>
                <div className="text-sm text-[#9C4154] font-medium">₹{dress.sale_price.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
