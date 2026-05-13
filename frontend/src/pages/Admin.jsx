import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Users, ShoppingBag, Flag, BarChart3, ShieldOff, Trash2, RotateCcw, CheckCircle, Search } from "lucide-react";

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");

  const loadStats = () => api.get("/admin/stats").then(r => setStats(r.data));
  const loadUsers = () => api.get(`/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`).then(r => setUsers(r.data));
  const loadListings = () => api.get("/admin/listings").then(r => setListings(r.data));
  const loadReports = () => api.get("/admin/reports").then(r => setReports(r.data));

  useEffect(() => {
    if (!user?.is_admin) return;
    loadStats(); loadUsers(); loadListings(); loadReports();
  }, [user]);

  if (loading) return <div className="p-20 text-center text-[#6E6B68]">Loading…</div>;
  if (!user || !user.is_admin) return <Navigate to="/" replace />;

  const act = async (fn, msg) => {
    try { await fn(); toast.success(msg); }
    catch (e) { toast.error(e.response?.data?.detail || "Action failed"); }
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-overline text-[#9C4154]">Super Admin</span>
            <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Restyle Control Center.</h1>
            <p className="text-sm text-[#6E6B68] mt-2">Manage users, listings, bookings, and reports.</p>
          </div>
          <div className="dc-badge bg-[#1A1A1A] text-[#C9A661]">Admin · {user.name}</div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8" data-testid="admin-stats">
            <StatCard icon={Users} label="Users" value={stats.users} />
            <StatCard icon={ShoppingBag} label="Active Listings" value={stats.listings_active} />
            <StatCard icon={BarChart3} label="Bookings" value={stats.bookings_pending + stats.bookings_approved + stats.bookings_completed} />
            <StatCard icon={Flag} label="Open Reports" value={stats.reports_open} highlight={stats.reports_open > 0} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-10 bg-[#F5F2EB] p-1 rounded-full w-fit overflow-x-auto">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} testId="admin-tab-overview">Overview</TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} testId="admin-tab-users">Users ({users.length})</TabBtn>
          <TabBtn active={tab === "listings"} onClick={() => setTab("listings")} testId="admin-tab-listings">Listings ({listings.length})</TabBtn>
          <TabBtn active={tab === "reports"} onClick={() => setTab("reports")} testId="admin-tab-reports">Reports ({reports.length})</TabBtn>
        </div>

        <div className="mt-8">
          {tab === "overview" && stats && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} className="dc-card p-5">
                  <div className="text-overline text-[#6E6B68]">{k.replace(/_/g, " ")}</div>
                  <div className="font-serif-display text-3xl mt-1">{v}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div>
              <div className="relative max-w-md mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6B68]" />
                <input data-testid="admin-user-search" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadUsers()} className="dc-input pl-10" />
              </div>
              <div className="dc-card overflow-hidden" data-testid="admin-users-table">
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F2EB] text-overline text-[#6E6B68]">
                    <tr><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">City</th><th className="text-left px-4 py-3">Listings</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Action</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-[#E8E3DA]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={fileUrl(u.avatar)} alt="" className="w-8 h-8 rounded-full object-cover bg-[#F2E8EB]" />
                            <div>
                              <div className="font-medium">{u.name} {u.is_admin && <span className="dc-badge ml-1 text-[9px]">admin</span>}</div>
                              <div className="text-xs text-[#6E6B68]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#6E6B68]">{u.city}</td>
                        <td className="px-4 py-3">{u.listings_count}</td>
                        <td className="px-4 py-3">{u.suspended ? <span className="dc-badge bg-[#FEEAEA] text-[#A53030]">suspended</span> : <span className="dc-badge bg-[#E6F4EA] text-[#2D6A2D]">active</span>}</td>
                        <td className="px-4 py-3 text-right">
                          {u.is_admin ? <span className="text-xs text-[#6E6B68]">—</span> : (
                            u.suspended ? (
                              <button data-testid={`unsuspend-${u.id}`} onClick={() => act(() => api.post(`/admin/users/${u.id}/unsuspend`).then(loadUsers), "User unsuspended")} className="text-xs text-[#2D6A2D] hover:underline flex items-center gap-1 ml-auto"><RotateCcw size={12} /> Unsuspend</button>
                            ) : (
                              <button data-testid={`suspend-${u.id}`} onClick={() => act(() => api.post(`/admin/users/${u.id}/suspend`).then(loadUsers), "User suspended")} className="text-xs text-[#A53030] hover:underline flex items-center gap-1 ml-auto"><ShieldOff size={12} /> Suspend</button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "listings" && (
            <div className="dc-card overflow-hidden" data-testid="admin-listings-table">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F2EB] text-overline text-[#6E6B68]">
                  <tr><th className="text-left px-4 py-3">Listing</th><th className="text-left px-4 py-3">Owner</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Rented</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Action</th></tr>
                </thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id} className="border-t border-[#E8E3DA]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={fileUrl(l.images?.[0])} alt="" className="w-10 h-12 rounded object-cover bg-[#F2E8EB]" />
                          <div>
                            <div className="font-medium line-clamp-1">{l.title}</div>
                            <div className="text-xs text-[#6E6B68]">₹{l.rent_price} · {l.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6E6B68]">{l.owner_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-xs uppercase">{l.item_type || "dress"}</td>
                      <td className="px-4 py-3">{l.times_rented || 0}×</td>
                      <td className="px-4 py-3">{l.status === "active" ? <span className="dc-badge bg-[#E6F4EA] text-[#2D6A2D]">active</span> : <span className="dc-badge bg-[#FEEAEA] text-[#A53030]">removed</span>}</td>
                      <td className="px-4 py-3 text-right">
                        {l.status === "active" ? (
                          <button data-testid={`remove-listing-${l.id}`} onClick={() => act(() => api.post(`/admin/listings/${l.id}/remove`).then(loadListings), "Listing removed")} className="text-xs text-[#A53030] hover:underline flex items-center gap-1 ml-auto"><Trash2 size={12} /> Remove</button>
                        ) : (
                          <button data-testid={`restore-listing-${l.id}`} onClick={() => act(() => api.post(`/admin/listings/${l.id}/restore`).then(loadListings), "Listing restored")} className="text-xs text-[#2D6A2D] hover:underline flex items-center gap-1 ml-auto"><RotateCcw size={12} /> Restore</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-3" data-testid="admin-reports-list">
              {reports.length === 0 && <div className="text-[#6E6B68] py-10 text-center">No reports yet.</div>}
              {reports.map(r => (
                <div key={r.id} className="dc-card p-5 flex flex-wrap items-start gap-4" data-testid={`admin-report-${r.id}`}>
                  <Flag size={18} className="text-[#9C4154] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="dc-badge">{r.target_type}</span>
                      <span className={`dc-badge ${r.status === "open" ? "bg-[#FFF7E6] text-[#9A7C1A]" : "bg-[#E6F4EA] text-[#2D6A2D]"}`}>{r.status}</span>
                    </div>
                    <div className="font-medium mt-2">{r.reason}</div>
                    {r.details && <div className="text-sm text-[#6E6B68] mt-1">{r.details}</div>}
                    <div className="text-xs text-[#6E6B68] mt-2">By {r.reporter_name} · {new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  {r.status === "open" && (
                    <button data-testid={`resolve-${r.id}`} onClick={() => act(() => api.post(`/admin/reports/${r.id}/resolve`).then(loadReports), "Report resolved")} className="dc-btn-primary text-sm"><CheckCircle size={14} /> Resolve</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`dc-card p-5 ${highlight ? "border-l-4 border-l-[#9C4154]" : ""}`}>
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-[#9C4154]" />
        <div className="text-overline text-[#6E6B68]">{label}</div>
      </div>
      <div className="font-serif-display text-3xl mt-2">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children, testId }) {
  return <button onClick={onClick} data-testid={testId} className={`px-5 py-2 text-sm rounded-full whitespace-nowrap transition ${active ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>{children}</button>;
}
