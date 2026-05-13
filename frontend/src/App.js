import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import Feed from "@/pages/Feed";
import DressDetail from "@/pages/DressDetail";
import UploadListing from "@/pages/UploadListing";
import Profile from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard";
import Notifications from "@/pages/Notifications";
import Wishlist from "@/pages/Wishlist";
import Chat from "@/pages/Chat";
import Booking from "@/pages/Booking";
import Admin from "@/pages/Admin";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#6E6B68]">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div className="App">
      <Navbar />
      <main className="min-h-[calc(100vh-5rem)]">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/feed" element={<Layout><Feed /></Layout>} />
          <Route path="/dress/:id" element={<Layout><DressDetail /></Layout>} />
          <Route path="/upload" element={<ProtectedRoute><Layout><UploadListing /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<Layout><Profile /></Layout>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Layout><Wishlist /></Layout></ProtectedRoute>} />
          <Route path="/chat/:bookingId" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
          <Route path="/booking/:bookingId" element={<ProtectedRoute><Layout><Booking /></Layout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
