import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { fileUrl } from "../lib/api";

export default function DressCard({ dress, onWishlist, isWishlisted }) {
  return (
    <Link to={`/dress/${dress.id}`} data-testid={`dress-card-${dress.id}`} className="group block">
      <div className="dc-card overflow-hidden p-3 h-full">
        <div className="image-zoom relative aspect-[3/4] bg-[#F5F2EB]">
          <img
            src={fileUrl(dress.images?.[0])}
            alt={dress.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {onWishlist && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlist(dress.id); }}
              data-testid={`wishlist-${dress.id}`}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition"
              aria-label="Add to wishlist"
            >
              <Heart size={16} className={isWishlisted ? "fill-[#9C4154] text-[#9C4154]" : "text-[#1A1A1A]"} />
            </button>
          )}
          {dress.sale_price && (
            <span className="absolute top-3 left-3 dc-badge">For Sale</span>
          )}
        </div>
        <div className="pt-4 pb-2 px-1">
          <div className="flex items-center justify-between text-xs text-[#6E6B68]">
            <span className="text-overline">{dress.category}</span>
            {typeof dress.distance_km !== "undefined" && (
              <span className="flex items-center gap-1"><MapPin size={11} /> {dress.distance_km} km</span>
            )}
          </div>
          <h3 className="font-serif-display text-xl mt-1.5 leading-tight text-[#1A1A1A] line-clamp-2">{dress.title}</h3>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-[#1A1A1A] font-medium">₹{dress.rent_price.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-[#6E6B68] tracking-wide">/ 3 days · Size {dress.size}</div>
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
