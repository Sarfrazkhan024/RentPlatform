import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);

  const load = () => api.get("/notifications").then(r => setNotifs(r.data));
  useEffect(() => { load(); }, []);

  const readAll = async () => {
    await api.post("/notifications/read-all");
    toast.success("All marked as read");
    load();
  };

  return (
    <div className="bg-[#FDFBF7]" data-testid="notifications-page">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-overline text-[#9C4154]">Notifications</span>
            <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Your circle.</h1>
          </div>
          {notifs.some(n => !n.read) && (
            <button onClick={readAll} data-testid="read-all-btn" className="dc-btn-secondary text-sm"><CheckCheck size={14} /> Mark all read</button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="dc-card p-12 text-center text-[#6E6B68]">
            <Bell size={28} className="mx-auto mb-3 opacity-50" />
            <div>No notifications yet. Start browsing to get updates.</div>
          </div>
        ) : (
          <div className="space-y-3" data-testid="notifications-list">
            {notifs.map(n => (
              <Link key={n.id} to={n.link || "#"} data-testid={`notif-${n.id}`} className={`dc-card p-5 flex items-start gap-4 ${!n.read ? "border-l-4 border-l-[#9C4154]" : ""}`} onClick={() => !n.read && api.post(`/notifications/${n.id}/read`)}>
                <div className="w-10 h-10 rounded-full bg-[#F2E8EB] flex items-center justify-center flex-shrink-0">
                  <Bell size={16} className="text-[#9C4154]" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-sm text-[#6E6B68] mt-1">{n.body}</div>
                  <div className="text-xs text-[#6E6B68] mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
