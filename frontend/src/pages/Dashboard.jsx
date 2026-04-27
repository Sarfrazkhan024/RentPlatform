import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Clock, Phone } from "lucide-react";

export default function Dashboard() {
  const [bookings, setBookings] = useState({ as_renter: [], as_owner: [] });
  const [tab, setTab] = useState("incoming");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/bookings/mine").then(r => setBookings(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/bookings/${id}/action`, { action });
      toast.success(action === "approve" ? "Booking approved · contact revealed" : "Booking declined");
      load();
    } catch { toast.error("Failed"); }
  };

  const incoming = bookings.as_owner.filter(b => b.status === "pending");
  const active = bookings.as_owner.filter(b => b.status === "approved");
  const completed = bookings.as_owner.filter(b => b.status === "rejected");

  return (
    <div className="bg-[#FDFBF7]" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <span className="text-overline text-[#9C4154]">Owner dashboard</span>
        <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Your bookings.</h1>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <Stat icon={Clock} label="Pending requests" value={incoming.length} />
          <Stat icon={CheckCircle} label="Active rentals" value={active.length} />
          <Stat icon={Calendar} label="Total bookings" value={bookings.as_owner.length} />
        </div>

        <div className="flex gap-1 mt-10 bg-[#F5F2EB] p-1 rounded-full w-fit">
          <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")} testId="dash-tab-incoming">Pending ({incoming.length})</TabBtn>
          <TabBtn active={tab === "active"} onClick={() => setTab("active")} testId="dash-tab-active">Approved ({active.length})</TabBtn>
          <TabBtn active={tab === "rejected"} onClick={() => setTab("rejected")} testId="dash-tab-rejected">Declined ({completed.length})</TabBtn>
        </div>

        <div className="mt-8 space-y-4">
          {loading && <div className="text-[#6E6B68]">Loading...</div>}
          {!loading && tab === "incoming" && incoming.length === 0 && <div className="text-[#6E6B68]">No pending requests right now.</div>}
          {!loading && (tab === "incoming" ? incoming : tab === "active" ? active : completed).map(b => (
            <BookingRow key={b.id} b={b} onApprove={() => act(b.id, "approve")} onReject={() => act(b.id, "reject")} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="dc-card p-6">
      <div className="w-10 h-10 rounded-2xl bg-[#F2E8EB] flex items-center justify-center mb-3"><Icon size={18} className="text-[#9C4154]" /></div>
      <div className="text-overline text-[#6E6B68]">{label}</div>
      <div className="font-serif-display text-3xl mt-1">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children, testId }) {
  return <button onClick={onClick} data-testid={testId} className={`px-5 py-2 text-sm rounded-full transition ${active ? "bg-white shadow-sm" : "text-[#6E6B68]"}`}>{children}</button>;
}

function BookingRow({ b, onApprove, onReject }) {
  return (
    <div className="dc-card p-5 flex flex-wrap gap-4 items-center" data-testid={`booking-row-${b.id}`}>
      <img src={fileUrl(b.listing?.images?.[0])} alt="" className="w-16 h-20 rounded-lg object-cover bg-[#F5F2EB]" />
      <div className="flex-1 min-w-[200px]">
        <div className="font-serif-display text-lg">{b.listing?.title}</div>
        <div className="text-xs text-[#6E6B68] mt-1">From {b.renter?.name} · {b.start_date} · {b.duration_days} days · ₹{b.rent_total}</div>
        {b.note && <div className="text-xs text-[#1A1A1A] mt-2 italic">"{b.note}"</div>}
        {b.status === "approved" && b.renter?.phone && (
          <div className="text-xs mt-2 flex items-center gap-1 text-[#9C4154]"><Phone size={12} /> {b.renter.phone}</div>
        )}
      </div>
      {b.status === "pending" ? (
        <div className="flex gap-2">
          <button onClick={onReject} data-testid={`reject-${b.id}`} className="dc-btn-secondary text-sm"><XCircle size={14} /> Decline</button>
          <button onClick={onApprove} data-testid={`approve-${b.id}`} className="dc-btn-primary text-sm"><CheckCircle size={14} /> Approve</button>
        </div>
      ) : (
        <Link to={`/booking/${b.id}`} data-testid={`view-${b.id}`} className="text-sm text-[#9C4154] hover:underline">View →</Link>
      )}
    </div>
  );
}
