import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Coins, Recycle, MapPin, Camera, MessageCircle } from "lucide-react";

const HERO = "https://images.pexels.com/photos/19218498/pexels-photo-19218498.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1500";
const SAMPLES = [
  "https://images.pexels.com/photos/33343580/pexels-photo-33343580.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
  "https://images.pexels.com/photos/19588679/pexels-photo-19588679.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
  "https://images.unsplash.com/photo-1601859574492-8658b6f7f990?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.pexels.com/photos/12062663/pexels-photo-12062663.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900",
];

export default function Landing() {
  return (
    <div className="bg-[#FDFBF7]" data-testid="landing-page">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 stagger-fade">
            <span className="dc-badge" data-testid="hero-badge">For the Indian Woman, By Her Closet</span>
            <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.05] tracking-tight text-[#1A1A1A]">
              Rent a look.<br />
              <em className="text-[#9C4154] font-light">List yours.</em>
            </h1>
            <p className="mt-6 text-base lg:text-lg text-[#6E6B68] max-w-lg leading-relaxed">
              A boutique circle of women trading the dresses you've loved once — for weddings, parties, and every moment in-between. Hyperlocal. Trusted. Beautifully curated.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/feed" data-testid="hero-cta-discover" className="dc-btn-primary">
                Discover Nearby <ArrowRight size={16} />
              </Link>
              <Link to="/auth" data-testid="hero-cta-list" className="dc-btn-secondary">
                List Your Dress
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-8 text-xs text-[#6E6B68]">
              <div><div className="font-serif-display text-3xl text-[#1A1A1A]">2.4k+</div><div className="mt-1">Looks shared</div></div>
              <div className="w-px h-10 bg-[#E8E3DA]" />
              <div><div className="font-serif-display text-3xl text-[#1A1A1A]">8</div><div className="mt-1">Indian cities</div></div>
              <div className="w-px h-10 bg-[#E8E3DA]" />
              <div><div className="font-serif-display text-3xl text-[#1A1A1A]">4.9★</div><div className="mt-1">Avg owner rating</div></div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="image-zoom rounded-2xl overflow-hidden aspect-[4/5] shadow-[0_30px_80px_rgb(0,0,0,0.12)]">
              <img src={HERO} alt="DressCircle hero" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:block absolute -bottom-8 -left-8 dc-card p-5 max-w-[230px]">
              <div className="text-overline text-[#9C4154]">Trending</div>
              <div className="font-serif-display text-2xl mt-1">Wedding season</div>
              <div className="text-sm text-[#6E6B68] mt-1">42 new lehengas this week</div>
            </div>
            <div className="hidden lg:flex absolute -top-6 -right-6 dc-card px-5 py-4 items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F2E8EB] flex items-center justify-center">
                <Sparkles size={16} className="text-[#9C4154]" />
              </div>
              <div>
                <div className="text-xs font-medium">Zero waste</div>
                <div className="text-[10px] text-[#6E6B68]">100% pre-loved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-[#F5F2EB] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-overline text-[#9C4154]">Why DressCircle</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl mt-3">A wardrobe that pays you back.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {[
              { icon: Coins, title: "Earn from your closet", body: "Every dress hanging unworn is potential rent. List it once, earn for years." },
              { icon: Sparkles, title: "Access infinite variety", body: "Borrow from your neighbour's wardrobe. New look every event, no commitment." },
              { icon: Recycle, title: "Zero waste fashion", body: "Wear it ten times, not once. The most beautiful sustainability story is shared." },
            ].map((v, i) => (
              <div key={i} className="dc-card p-8" data-testid={`value-prop-${i}`}>
                <div className="w-12 h-12 rounded-2xl bg-[#F2E8EB] flex items-center justify-center mb-5">
                  <v.icon size={20} className="text-[#9C4154]" />
                </div>
                <h3 className="font-serif-display text-2xl">{v.title}</h3>
                <p className="text-sm text-[#6E6B68] mt-3 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-end mb-12">
          <div>
            <span className="text-overline text-[#9C4154]">How it works</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl mt-3">Three steps to a perfect fit.</h2>
          </div>
          <p className="text-[#6E6B68] leading-relaxed">No payment gateway, no shipping logistics, no friction. Discover within your city, request a rental, and meet over coffee.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", icon: MapPin, t: "Browse nearby", b: "Filter by occasion, size and distance. See what's available within 2-10 km." },
            { n: "02", icon: Camera, t: "Request to rent", b: "Pick your dates, send a request. Owner approves and unlocks contact details." },
            { n: "03", icon: MessageCircle, t: "Meet & swap", b: "Coordinate offline. Wear it, return it. Leave a review for the next girl." },
          ].map((s, i) => (
            <div key={i} className="relative" data-testid={`how-step-${i}`}>
              <div className="font-serif-display text-7xl text-[#F2E8EB] leading-none">{s.n}</div>
              <s.icon size={24} className="text-[#9C4154] -mt-8 ml-2" />
              <h3 className="font-serif-display text-2xl mt-6">{s.t}</h3>
              <p className="text-sm text-[#6E6B68] mt-2 leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample listings */}
      <section className="bg-[#F5F2EB] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-overline text-[#9C4154]">A peek inside</span>
              <h2 className="font-serif-display text-4xl sm:text-5xl mt-3">Trending in The Circle.</h2>
            </div>
            <Link to="/feed" data-testid="see-all-link" className="text-sm text-[#9C4154] hover:underline">See all listings →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {SAMPLES.map((src, i) => (
              <div key={i} className="dc-card p-3 image-zoom">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#FDFBF7]">
                  <img src={src} alt="dress" className="w-full h-full object-cover" />
                </div>
                <div className="pt-3 px-1">
                  <div className="text-overline text-[#6E6B68]">{["Wedding","Cocktail","Brunch","Festival"][i]}</div>
                  <div className="font-serif-display text-lg mt-1">Curated piece</div>
                  <div className="text-sm text-[#9C4154] mt-1">From ₹{[2400,1200,700,1100][i]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 text-center">
        <h2 className="font-serif-display text-4xl sm:text-5xl">Your closet, in circulation.</h2>
        <p className="text-[#6E6B68] mt-4 max-w-xl mx-auto">Join thousands of Indian women earning from what they already own. Free to join, no commission in Phase 1.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth" data-testid="bottom-cta-join" className="dc-btn-primary">Join the Circle</Link>
          <Link to="/feed" data-testid="bottom-cta-browse" className="dc-btn-secondary">Browse First</Link>
        </div>
      </section>
    </div>
  );
}
