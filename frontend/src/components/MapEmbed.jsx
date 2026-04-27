import React from "react";
import { MapPin } from "lucide-react";

const KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export default function MapEmbed({ lat, lng, label, height = 240 }) {
  if (!KEY || !lat || !lng) {
    return (
      <div className="rounded-xl bg-[#F5F2EB] p-6 text-center text-sm text-[#6E6B68]">
        <MapPin size={20} className="mx-auto mb-2 text-[#9C4154]" />
        Map unavailable. Approximate area: <strong>{label}</strong>
      </div>
    );
  }
  // Use Maps Embed API. Privacy: zoom level kept rough so exact home is hidden.
  const src = `https://www.google.com/maps/embed/v1/view?key=${KEY}&center=${lat},${lng}&zoom=12&maptype=roadmap`;
  return (
    <div className="relative rounded-xl overflow-hidden border border-[#E8E3DA]" style={{ height }} data-testid="map-embed">
      <iframe
        title="Approximate location"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
      />
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs text-[#1A1A1A] flex items-center gap-1">
        <MapPin size={12} className="text-[#9C4154]" /> Approximate area · <strong className="ml-1">{label}</strong>
      </div>
    </div>
  );
}
