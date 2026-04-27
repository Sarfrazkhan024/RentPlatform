import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const COVER = "https://images.pexels.com/photos/19218498/pexels-photo-19218498.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1400&w=1000";

export default function AuthPage() {
  const { login, signup, verifyOtp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login"); // login | signup | otp
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const onLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      nav("/feed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signup({ name, email, password, city, phone });
      toast.success("Welcome to DressCircle!");
      nav("/feed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally { setBusy(false); }
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error("Enter valid phone number"); return; }
    setBusy(true);
    try {
      const { api } = await import("../lib/api");
      await api.post("/auth/otp/send", { phone });
      setOtpSent(true);
      toast.success("OTP sent! Use 123456 (demo mode)");
    } catch (err) { toast.error("Failed to send OTP"); }
    finally { setBusy(false); }
  };

  const verifyAndLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyOtp({ phone, code: otp, name: name || "DressCircle User", city });
      toast.success("Welcome!");
      nav("/feed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FDFBF7]" data-testid="auth-page">
      <div className="relative hidden lg:block">
        <img src={COVER} alt="DressCircle" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white max-w-md">
          <span className="dc-badge bg-white/20 text-white backdrop-blur">DressCircle</span>
          <h2 className="font-serif-display text-5xl mt-4 leading-tight">A boutique closet, shared between women.</h2>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" data-testid="back-home" className="inline-flex items-center gap-2 text-sm text-[#6E6B68] hover:text-[#9C4154] transition mb-8">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="flex items-baseline gap-1">
            <span className="font-serif-display text-3xl text-[#1A1A1A]">DressCircle</span>
            <span className="w-1.5 h-1.5 bg-[#9C4154] rounded-full mb-1.5" />
          </div>

          <h1 className="font-serif-display text-4xl mt-6">
            {mode === "login" ? "Welcome back." : mode === "signup" ? "Join the circle." : "Quick sign in."}
          </h1>
          <p className="text-sm text-[#6E6B68] mt-2">
            {mode === "login" ? "Sign in to continue browsing local closets." : mode === "signup" ? "Create your account in under a minute." : "We'll send a 6-digit code to your phone."}
          </p>

          {/* Mode tabs */}
          <div className="flex gap-1 mt-6 bg-[#F5F2EB] p-1 rounded-full" role="tablist">
            <button onClick={() => setMode("login")} data-testid="tab-login" className={`flex-1 text-sm py-2 rounded-full transition ${mode === "login" ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>Sign In</button>
            <button onClick={() => setMode("signup")} data-testid="tab-signup" className={`flex-1 text-sm py-2 rounded-full transition ${mode === "signup" ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>Sign Up</button>
            <button onClick={() => setMode("otp")} data-testid="tab-otp" className={`flex-1 text-sm py-2 rounded-full transition ${mode === "otp" ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>OTP</button>
          </div>

          {mode === "login" && (
            <form onSubmit={onLogin} className="mt-7 space-y-4">
              <input data-testid="login-email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="dc-input" required />
              <input data-testid="login-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="dc-input" required />
              <button data-testid="login-submit" type="submit" disabled={busy} className="dc-btn-primary w-full">{busy ? "Signing in..." : "Sign In"}</button>
              <p className="text-xs text-[#6E6B68] text-center">
                Demo: <button type="button" data-testid="demo-login" onClick={() => { setEmail("demo@dresscircle.in"); setPassword("demo1234"); }} className="underline hover:text-[#9C4154]">use demo account</button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={onSignup} className="mt-7 space-y-4">
              <input data-testid="signup-name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="dc-input" required />
              <input data-testid="signup-email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="dc-input" required />
              <input data-testid="signup-phone" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="dc-input" />
              <select data-testid="signup-city" value={city} onChange={(e) => setCity(e.target.value)} className="dc-input">
                {["Mumbai","Delhi","Bangalore","Pune","Hyderabad","Chennai","Kolkata","Jaipur"].map(c => <option key={c}>{c}</option>)}
              </select>
              <input data-testid="signup-password" type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="dc-input" required minLength={6} />
              <button data-testid="signup-submit" type="submit" disabled={busy} className="dc-btn-primary w-full">{busy ? "Creating..." : "Create account"}</button>
            </form>
          )}

          {mode === "otp" && (
            <form onSubmit={otpSent ? verifyAndLogin : (e) => { e.preventDefault(); sendOtp(); }} className="mt-7 space-y-4">
              <input data-testid="otp-phone" type="tel" placeholder="Phone number (e.g. 9876543210)" value={phone} onChange={(e) => setPhone(e.target.value)} className="dc-input" required disabled={otpSent} />
              {otpSent && (
                <>
                  <input data-testid="otp-code" placeholder="Enter 6-digit OTP (use 123456)" value={otp} onChange={(e) => setOtp(e.target.value)} className="dc-input" required maxLength={6} />
                  <input data-testid="otp-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="dc-input" />
                </>
              )}
              <button data-testid="otp-submit" type="submit" disabled={busy} className="dc-btn-primary w-full">
                {busy ? "Please wait..." : otpSent ? "Verify & Sign In" : "Send OTP"}
              </button>
              {otpSent && <p className="text-xs text-center text-[#6E6B68]">Demo: enter <strong>123456</strong></p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
