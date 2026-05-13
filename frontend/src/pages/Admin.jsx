import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Users, ShoppingBag, Flag, BarChart3, ShieldOff, Trash2, RotateCcw, CheckCircle, Search, Plus, Edit, X as XIcon, Eye, Clock } from "lucide-react";
import Modal, { ConfirmDialog } from "../components/Modal";

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata", "Jaipur"];

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal state
  const [editUser, setEditUser] = useState(null);          // user object or null
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editListing, setEditListing] = useState(null);    // listing object or null
  const [previewListing, setPreviewListing] = useState(null);
  const [rejectListing, setRejectListing] = useState(null);
  const [confirm, setConfirm] = useState(null);            // {title,message,onConfirm,danger}

  const loadStats = () => api.get("/admin/stats").then(r => setStats(r.data));
  const loadUsers = () => api.get(`/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`).then(r => setUsers(r.data));
  const loadListings = () => api.get(`/admin/listings${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => setListings(r.data));
  const loadReports = () => api.get("/admin/reports").then(r => setReports(r.data));
  const reloadAll = () => { loadStats(); loadUsers(); loadListings(); loadReports(); };

  useEffect(() => { if (user?.is_admin) reloadAll(); }, [user]);
  useEffect(() => { if (user?.is_admin) loadListings(); }, [statusFilter]);

  if (loading) return <div className="p-20 text-center text-[#6E6B68]">Loading…</div>;
  if (!user || !user.is_admin) return <Navigate to="/" replace />;

  const act = async (fn, msg) => {
    try { await fn(); toast.success(msg); }
    catch (e) { toast.error(e.response?.data?.detail || "Action failed"); }
  };

  const pendingCount = listings.filter(l => l.status === "under_review").length;

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
            <StatCard icon={Clock} label="Pending Review" value={stats.listings_under_review || 0} highlight={stats.listings_under_review > 0} />
            <StatCard icon={Flag} label="Open Reports" value={stats.reports_open} highlight={stats.reports_open > 0} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-10 bg-[#F5F2EB] p-1 rounded-full w-fit overflow-x-auto">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} testId="admin-tab-overview">Overview</TabBtn>
          <TabBtn active={tab === "pending"} onClick={() => { setTab("pending"); setStatusFilter("under_review"); }} testId="admin-tab-pending">
            Pending {stats?.listings_under_review > 0 && <span className="ml-1 bg-[#9C4154] text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.listings_under_review}</span>}
          </TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} testId="admin-tab-users">Users ({users.length})</TabBtn>
          <TabBtn active={tab === "listings"} onClick={() => { setTab("listings"); setStatusFilter(""); }} testId="admin-tab-listings">All Listings</TabBtn>
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

          {tab === "pending" && (
            <PendingListings listings={listings.filter(l => l.status === "under_review")} onApprove={(id) => act(() => api.post(`/admin/listings/${id}/approve`).then(reloadAll), "Listing approved & live")} onReject={(l) => setRejectListing(l)} onPreview={setPreviewListing} />
          )}

          {tab === "users" && (
            <div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6B68]" />
                  <input data-testid="admin-user-search" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadUsers()} className="dc-input pl-10" />
                </div>
                <button onClick={() => setNewUserOpen(true)} data-testid="admin-new-user-btn" className="dc-btn-primary text-sm"><Plus size={14} /> New User</button>
              </div>
              <div className="dc-card overflow-x-auto" data-testid="admin-users-table">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-[#F5F2EB] text-overline text-[#6E6B68]">
                    <tr><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">City</th><th className="text-left px-4 py-3">Listings</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-[#E8E3DA] hover:bg-[#FDFBF7]/50">
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
                        <td className="px-4 py-3">{u.listings_count || 0}</td>
                        <td className="px-4 py-3">{u.suspended ? <span className="dc-badge bg-[#FEEAEA] text-[#A53030]">suspended</span> : <span className="dc-badge bg-[#E6F4EA] text-[#2D6A2D]">active</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3 justify-end items-center text-xs">
                            <button onClick={() => setEditUser(u)} data-testid={`edit-user-${u.id}`} className="text-[#6E6B68] hover:text-[#9C4154] flex items-center gap-1"><Edit size={12} /> Edit</button>
                            {!u.is_admin && (
                              u.suspended ? (
                                <button data-testid={`unsuspend-${u.id}`} onClick={() => act(() => api.post(`/admin/users/${u.id}/unsuspend`).then(reloadAll), "User unsuspended")} className="text-[#2D6A2D] hover:underline flex items-center gap-1"><RotateCcw size={12} /> Unsuspend</button>
                              ) : (
                                <button data-testid={`suspend-${u.id}`} onClick={() => act(() => api.post(`/admin/users/${u.id}/suspend`).then(reloadAll), "User suspended")} className="text-[#A53030] hover:underline flex items-center gap-1"><ShieldOff size={12} /> Suspend</button>
                              )
                            )}
                            {u.id !== user.id && (
                              <button data-testid={`delete-user-${u.id}`} onClick={() => setConfirm({ title: "Delete user", message: `Permanently delete ${u.name}? This removes their listings, bookings, wishlist, and notifications. Cannot be undone.`, danger: true, onConfirm: () => act(() => api.delete(`/admin/users/${u.id}`).then(reloadAll), "User deleted") })} className="text-[#A53030] hover:underline flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "listings" && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap text-sm">
                {["", "under_review", "active", "inactive", "rejected"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} data-testid={`filter-${s || "all"}`}
                    className={`px-4 py-2 rounded-full transition ${statusFilter === s ? "bg-[#9C4154] text-white" : "bg-[#F5F2EB] hover:bg-[#F2E8EB]"}`}>
                    {s === "" ? "All" : s.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="dc-card overflow-x-auto" data-testid="admin-listings-table">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-[#F5F2EB] text-overline text-[#6E6B68]">
                    <tr><th className="text-left px-4 py-3">Listing</th><th className="text-left px-4 py-3">Owner</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Rented</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {listings.map(l => (
                      <tr key={l.id} className="border-t border-[#E8E3DA] hover:bg-[#FDFBF7]/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={fileUrl(l.images?.[0])} alt="" className="w-10 h-12 rounded object-cover bg-[#F2E8EB]" />
                            <div>
                              <div className="font-medium line-clamp-1">{l.title}</div>
                              <div className="text-xs text-[#6E6B68]">₹{l.rent_price} · {l.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>{l.owner?.name || "—"}</div>
                          <div className="text-[10px] text-[#6E6B68]">{l.owner?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs uppercase">{l.item_type || "dress"}</td>
                        <td className="px-4 py-3">{l.times_rented || 0}×</td>
                        <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3 justify-end items-center text-xs">
                            <button onClick={() => setPreviewListing(l)} data-testid={`view-listing-${l.id}`} className="text-[#6E6B68] hover:text-[#9C4154] flex items-center gap-1"><Eye size={12} /> View</button>
                            <button onClick={() => setEditListing(l)} data-testid={`edit-listing-${l.id}`} className="text-[#6E6B68] hover:text-[#9C4154] flex items-center gap-1"><Edit size={12} /> Edit</button>
                            {l.status === "under_review" && (
                              <button data-testid={`approve-${l.id}`} onClick={() => act(() => api.post(`/admin/listings/${l.id}/approve`).then(reloadAll), "Listing approved")} className="text-[#2D6A2D] hover:underline flex items-center gap-1"><CheckCircle size={12} /> Approve</button>
                            )}
                            {l.status === "active" ? (
                              <button data-testid={`remove-listing-${l.id}`} onClick={() => act(() => api.post(`/admin/listings/${l.id}/remove`).then(reloadAll), "Listing removed")} className="text-[#A53030] hover:underline flex items-center gap-1"><XIcon size={12} /> Remove</button>
                            ) : l.status === "inactive" && (
                              <button data-testid={`restore-listing-${l.id}`} onClick={() => act(() => api.post(`/admin/listings/${l.id}/restore`).then(reloadAll), "Listing restored")} className="text-[#2D6A2D] hover:underline flex items-center gap-1"><RotateCcw size={12} /> Restore</button>
                            )}
                            <button data-testid={`delete-listing-${l.id}`} onClick={() => setConfirm({ title: "Delete listing", message: `Permanently delete "${l.title}"? Cannot be undone.`, danger: true, onConfirm: () => act(() => api.delete(`/admin/listings/${l.id}`).then(reloadAll), "Listing deleted") })} className="text-[#A53030] hover:underline flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* User Edit Modal */}
      <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); reloadAll(); }} />
      <UserCreateModal open={newUserOpen} onClose={() => setNewUserOpen(false)} onSaved={() => { setNewUserOpen(false); reloadAll(); }} />
      <ListingEditModal listing={editListing} onClose={() => setEditListing(null)} onSaved={() => { setEditListing(null); reloadAll(); }} />
      <ListingPreviewModal listing={previewListing} onClose={() => setPreviewListing(null)} />
      <RejectModal listing={rejectListing} onClose={() => setRejectListing(null)} onDone={() => { setRejectListing(null); reloadAll(); }} />
      <ConfirmDialog open={!!confirm} {...confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

// ---------- Sub-components ----------

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
  return <button onClick={onClick} data-testid={testId} className={`px-5 py-2 text-sm rounded-full whitespace-nowrap transition flex items-center ${active ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>{children}</button>;
}

function StatusBadge({ status }) {
  const map = {
    active: "bg-[#E6F4EA] text-[#2D6A2D]",
    under_review: "bg-[#FFF7E6] text-[#9A7C1A]",
    inactive: "bg-[#F5F2EB] text-[#6E6B68]",
    rejected: "bg-[#FEEAEA] text-[#A53030]",
  };
  return <span className={`dc-badge ${map[status] || ""}`}>{status?.replace("_", " ")}</span>;
}

function PendingListings({ listings, onApprove, onReject, onPreview }) {
  if (listings.length === 0) {
    return <div className="dc-card p-12 text-center text-[#6E6B68]" data-testid="pending-empty"><Clock size={28} className="mx-auto mb-3 opacity-50" />No listings awaiting review. All caught up.</div>;
  }
  return (
    <div className="grid md:grid-cols-2 gap-4" data-testid="pending-list">
      {listings.map(l => (
        <div key={l.id} className="dc-card p-4 flex gap-4" data-testid={`pending-card-${l.id}`}>
          <img src={fileUrl(l.images?.[0])} alt="" className="w-24 h-32 rounded-lg object-cover bg-[#F5F2EB]" />
          <div className="flex-1 min-w-0">
            <div className="font-serif-display text-lg leading-tight">{l.title}</div>
            <div className="text-xs text-[#6E6B68] mt-1">{l.category} · {l.size} · {l.condition} · ₹{l.rent_price}</div>
            <div className="text-xs text-[#6E6B68] mt-1">By {l.owner?.name} · {l.city}</div>
            <p className="text-xs text-[#6E6B68] mt-2 line-clamp-2">{l.description}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={() => onPreview(l)} data-testid={`preview-${l.id}`} className="dc-btn-secondary text-xs"><Eye size={12} /> Preview</button>
              <button onClick={() => onApprove(l.id)} data-testid={`pending-approve-${l.id}`} className="dc-btn-primary text-xs"><CheckCircle size={12} /> Approve</button>
              <button onClick={() => onReject(l)} data-testid={`pending-reject-${l.id}`} className="text-xs text-[#A53030] hover:underline px-2"><XIcon size={12} className="inline" /> Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserCreateModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "Mumbai", phone: "", is_admin: false });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/users", form);
      toast.success("User created");
      onSaved();
      setForm({ name: "", email: "", password: "", city: "Mumbai", phone: "", is_admin: false });
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create new user">
      <form onSubmit={submit} className="space-y-3" data-testid="new-user-form">
        <input required data-testid="nu-name" placeholder="Full name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="dc-input" />
        <input required type="email" data-testid="nu-email" placeholder="Email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="dc-input" />
        <input required type="password" minLength={6} data-testid="nu-password" placeholder="Password (min 6)" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="dc-input" />
        <input data-testid="nu-phone" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="dc-input" />
        <select data-testid="nu-city" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="dc-input">{CITIES.map(c => <option key={c}>{c}</option>)}</select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" data-testid="nu-is-admin" checked={form.is_admin} onChange={(e) => setForm(f => ({ ...f, is_admin: e.target.checked }))} className="accent-[#9C4154]" /> Grant admin privileges
        </label>
        <button type="submit" disabled={busy} data-testid="nu-submit" className="dc-btn-primary w-full">{busy ? "Creating..." : "Create user"}</button>
      </form>
    </Modal>
  );
}

function UserEditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setForm({ name: user.name || "", email: user.email || "", city: user.city || "Mumbai", phone: user.phone || "", is_admin: !!user.is_admin, suspended: !!user.suspended }); }, [user]);
  if (!user || !form) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/admin/users/${user.id}`, form);
      toast.success("User updated");
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title={`Edit ${user.name}`}>
      <form onSubmit={submit} className="space-y-3" data-testid="edit-user-form">
        <input data-testid="eu-name" placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="dc-input" />
        <input data-testid="eu-email" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="dc-input" />
        <input data-testid="eu-phone" placeholder="Phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="dc-input" />
        <select data-testid="eu-city" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="dc-input">{CITIES.map(c => <option key={c}>{c}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" data-testid="eu-is-admin" checked={form.is_admin} onChange={(e) => setForm(f => ({ ...f, is_admin: e.target.checked }))} className="accent-[#9C4154]" /> Admin</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" data-testid="eu-suspended" checked={form.suspended} onChange={(e) => setForm(f => ({ ...f, suspended: e.target.checked }))} className="accent-[#9C4154]" /> Suspended</label>
        <button type="submit" disabled={busy} data-testid="eu-submit" className="dc-btn-primary w-full">{busy ? "Saving..." : "Save changes"}</button>
      </form>
    </Modal>
  );
}

function ListingEditModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (listing) setForm({
      title: listing.title, description: listing.description, category: listing.category, size: listing.size,
      color: listing.color, brand: listing.brand || "", occasion: listing.occasion || "",
      condition: listing.condition || "Good", rent_price: listing.rent_price, security_deposit: listing.security_deposit,
      sale_price: listing.sale_price || "", status: listing.status,
    });
  }, [listing]);
  if (!listing || !form) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, rent_price: Number(form.rent_price), security_deposit: Number(form.security_deposit), sale_price: form.sale_price ? Number(form.sale_price) : null };
      await api.put(`/admin/listings/${listing.id}`, payload);
      toast.success("Listing updated");
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={!!listing} onClose={onClose} title={`Edit listing`} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-3" data-testid="edit-listing-form">
        <input required data-testid="el-title" placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="dc-input" />
        <textarea required data-testid="el-description" placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="dc-input" style={{ height: "auto", minHeight: "5rem", padding: "0.75rem 1rem" }} />
        <div className="grid grid-cols-2 gap-3">
          <input data-testid="el-color" placeholder="Color" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} className="dc-input" />
          <input data-testid="el-brand" placeholder="Brand" value={form.brand} onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))} className="dc-input" />
          <input data-testid="el-occasion" placeholder="Occasion" value={form.occasion} onChange={(e) => setForm(f => ({ ...f, occasion: e.target.value }))} className="dc-input" />
          <select data-testid="el-condition" value={form.condition} onChange={(e) => setForm(f => ({ ...f, condition: e.target.value }))} className="dc-input">
            {["New", "Like New", "Good", "Fair", "Well Loved"].map(c => <option key={c}>{c}</option>)}
          </select>
          <input data-testid="el-rent" type="number" placeholder="Rent/3d" value={form.rent_price} onChange={(e) => setForm(f => ({ ...f, rent_price: e.target.value }))} className="dc-input" />
          <input data-testid="el-deposit" type="number" placeholder="Deposit" value={form.security_deposit} onChange={(e) => setForm(f => ({ ...f, security_deposit: e.target.value }))} className="dc-input" />
          <input data-testid="el-sale" type="number" placeholder="Sale price (optional)" value={form.sale_price} onChange={(e) => setForm(f => ({ ...f, sale_price: e.target.value }))} className="dc-input" />
          <select data-testid="el-status" value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="dc-input">
            {["active", "under_review", "inactive", "rejected"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <button type="submit" disabled={busy} data-testid="el-submit" className="dc-btn-primary w-full">{busy ? "Saving..." : "Save changes"}</button>
      </form>
    </Modal>
  );
}

function ListingPreviewModal({ listing, onClose }) {
  if (!listing) return null;
  return (
    <Modal open={!!listing} onClose={onClose} title={listing.title} maxWidth="max-w-2xl">
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        {listing.images?.map((src, i) => (
          <img key={i} src={fileUrl(src)} alt="" className="aspect-[3/4] object-cover rounded-lg bg-[#F5F2EB]" />
        ))}
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-[#6E6B68]">{listing.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-[#6E6B68] mt-3">
          <Row label="Category" v={listing.category} />
          <Row label="Size" v={listing.size} />
          <Row label="Color" v={listing.color} />
          <Row label="Brand" v={listing.brand} />
          <Row label="Condition" v={listing.condition} />
          <Row label="Occasion" v={listing.occasion} />
          <Row label="Rent / 3 days" v={`₹${listing.rent_price}`} />
          <Row label="Deposit" v={`₹${listing.security_deposit}`} />
          <Row label="City" v={listing.city} />
          <Row label="Owner" v={listing.owner?.name} />
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ listing, onClose, onDone }) {
  const [reason, setReason] = useState("");
  if (!listing) return null;
  const submit = async () => {
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    try {
      await api.post(`/admin/listings/${listing.id}/reject`, { reason });
      toast.success("Listing rejected");
      onDone();
    } catch (e) { toast.error("Failed"); }
  };
  return (
    <Modal open={!!listing} onClose={onClose} title="Reject listing">
      <p className="text-sm text-[#6E6B68] mb-3">Tell the owner why their listing wasn't approved.</p>
      <textarea data-testid="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Photos are blurry, item violates policy, etc." className="dc-input" style={{ height: "auto", minHeight: "5rem", padding: "0.75rem 1rem" }} />
      <button onClick={submit} data-testid="reject-submit" className="dc-btn-primary w-full mt-3">Reject & notify owner</button>
    </Modal>
  );
}

function Row({ label, v }) {
  return (
    <div>
      <div className="text-overline text-[10px]">{label}</div>
      <div className="text-[#1A1A1A] font-medium">{v || "—"}</div>
    </div>
  );
}
