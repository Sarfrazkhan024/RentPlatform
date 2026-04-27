import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Bell, Heart, Plus, User as UserIcon, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const NavItem = ({ to, label, testId }) => (
    <NavLink
      to={to}
      data-testid={testId}
      className={({ isActive }) =>
        `text-sm tracking-wide transition-colors hover:text-[#9C4154] ${isActive ? "text-[#9C4154]" : "text-[#1A1A1A]"}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FDFBF7]/80 border-b border-[#E8E3DA]" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link to="/" data-testid="brand-logo" className="flex items-baseline gap-1">
          <span className="font-serif-display text-3xl tracking-tight text-[#1A1A1A]">DressCircle</span>
          <span className="w-1.5 h-1.5 bg-[#9C4154] rounded-full mb-1.5" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <NavItem to="/feed" label="Discover" testId="nav-discover" />
          <NavItem to="/upload" label="List a Dress" testId="nav-upload" />
          <NavItem to="/wishlist" label="Wishlist" testId="nav-wishlist" />
          <NavItem to="/dashboard" label="Dashboard" testId="nav-dashboard" />
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/notifications" data-testid="notif-link" className="p-2 rounded-full hover:bg-[#F5F2EB] transition">
                <Bell size={18} />
              </Link>
              <Link to="/wishlist" data-testid="heart-link" className="p-2 rounded-full hover:bg-[#F5F2EB] transition">
                <Heart size={18} />
              </Link>
              <Link to="/profile" data-testid="profile-link" className="flex items-center gap-2 group">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#9C4154] transition" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#F2E8EB] flex items-center justify-center text-[#9C4154] font-medium">
                    {user.name?.[0] || "U"}
                  </div>
                )}
              </Link>
              <button onClick={() => { logout(); nav("/"); }} data-testid="logout-btn" className="text-[#6E6B68] hover:text-[#9C4154] transition" title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" data-testid="login-link" className="text-sm hover:text-[#9C4154] transition">Sign In</Link>
              <Link to="/auth" data-testid="signup-cta" className="dc-btn-primary text-sm px-5 py-2">Join DressCircle</Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          data-testid="mobile-menu-toggle"
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#E8E3DA] bg-[#FDFBF7] px-6 py-4 flex flex-col gap-4">
          <NavItem to="/feed" label="Discover" testId="m-nav-discover" />
          <NavItem to="/upload" label="List a Dress" testId="m-nav-upload" />
          <NavItem to="/wishlist" label="Wishlist" testId="m-nav-wishlist" />
          <NavItem to="/dashboard" label="Dashboard" testId="m-nav-dashboard" />
          <NavItem to="/notifications" label="Notifications" testId="m-nav-notif" />
          {user ? (
            <>
              <NavItem to="/profile" label="Profile" testId="m-nav-profile" />
              <button onClick={() => { logout(); nav("/"); setOpen(false); }} data-testid="m-logout" className="text-left text-sm text-[#9C4154]">Logout</button>
            </>
          ) : (
            <Link to="/auth" data-testid="m-login" className="dc-btn-primary text-sm w-full justify-center">Sign In / Join</Link>
          )}
        </div>
      )}
    </header>
  );
}
