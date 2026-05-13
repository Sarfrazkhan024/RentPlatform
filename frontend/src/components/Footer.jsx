import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[#E8E3DA] bg-[#F5F2EB]" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-baseline gap-1">
            <span className="font-serif-display text-3xl text-[#1A1A1A]">Restyle</span>
            <span className="w-1.5 h-1.5 bg-[#9C4154] rounded-full mb-1.5" />
          </div>
          <p className="mt-3 text-sm text-[#6E6B68] max-w-sm leading-relaxed">
            Hyperlocal fashion rental and resale. Built for the Indian woman who refuses to repeat.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" data-testid="ig-link" className="p-2 rounded-full hover:bg-[#F2E8EB] transition"><Instagram size={16} /></a>
            <a href="#" data-testid="tw-link" className="p-2 rounded-full hover:bg-[#F2E8EB] transition"><Twitter size={16} /></a>
            <a href="#" data-testid="fb-link" className="p-2 rounded-full hover:bg-[#F2E8EB] transition"><Facebook size={16} /></a>
          </div>
        </div>
        <div>
          <h4 className="text-overline text-[#1A1A1A]">Discover</h4>
          <ul className="mt-4 space-y-3 text-sm text-[#6E6B68]">
            <li><Link to="/feed" className="hover:text-[#9C4154]">Browse Dresses</Link></li>
            <li><Link to="/upload" className="hover:text-[#9C4154]">List Yours</Link></li>
            <li><Link to="/wishlist" className="hover:text-[#9C4154]">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-overline text-[#1A1A1A]">Company</h4>
          <ul className="mt-4 space-y-3 text-sm text-[#6E6B68]">
            <li><a href="#" className="hover:text-[#9C4154]">About</a></li>
            <li><a href="#" className="hover:text-[#9C4154]">How it Works</a></li>
            <li><a href="#" className="hover:text-[#9C4154]">Trust & Safety</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E8E3DA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 text-xs text-[#6E6B68] flex justify-between items-center">
          <span>© 2026 Restyle. Made with care in India.</span>
          <span>Phase 1 — Beta</span>
        </div>
      </div>
    </footer>
  );
}
