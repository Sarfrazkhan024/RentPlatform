import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Send, Phone, ArrowLeft } from "lucide-react";

export default function Chat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);
  const scroller = useRef(null);

  const load = async () => {
    const [b, m] = await Promise.all([api.get(`/bookings/${bookingId}`), api.get(`/messages/${bookingId}`)]);
    setBooking(b.data);
    setMessages(m.data);
    setRevealed(b.data.contact_revealed);
  };

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [bookingId]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const t = text;
    setText("");
    const { data } = await api.post("/messages", { booking_id: bookingId, text: t });
    setMessages(m => [...m, data]);
  };

  const reveal = async () => {
    await api.post(`/bookings/${bookingId}/reveal`);
    load();
  };

  if (!booking) return <div className="max-w-3xl mx-auto p-10 text-[#6E6B68]">Loading conversation...</div>;
  const other = user.id === booking.renter_id ? booking.owner : booking.renter;

  return (
    <div className="bg-[#FDFBF7]" data-testid="chat-page">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-8">
        <Link to="/dashboard" className="text-sm text-[#6E6B68] hover:text-[#9C4154] inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Back</Link>

        <div className="dc-card p-5 flex items-center gap-4">
          <img src={fileUrl(other?.avatar)} alt="" className="w-12 h-12 rounded-full object-cover bg-[#F2E8EB]" />
          <div className="flex-1">
            <div className="text-xs text-[#6E6B68]">Conversation with</div>
            <div className="font-medium">{other?.name}</div>
            <div className="text-xs text-[#6E6B68]">About: {booking.listing?.title}</div>
          </div>
          {revealed && other?.phone ? (
            <a href={`tel:${other.phone}`} data-testid="call-btn" className="dc-btn-primary text-sm"><Phone size={14} /> {other.phone}</a>
          ) : booking.status === "approved" ? (
            <button onClick={reveal} data-testid="reveal-btn" className="dc-btn-primary text-sm"><Phone size={14} /> Reveal contact</button>
          ) : (
            <span className="text-xs text-[#6E6B68]">Approve to reveal contact</span>
          )}
        </div>

        <div ref={scroller} className="dc-card mt-4 p-5 max-h-[60vh] overflow-y-auto space-y-3" data-testid="messages-list">
          {messages.length === 0 && <div className="text-center text-[#6E6B68] text-sm py-8">Start the conversation. Be kind, be clear.</div>}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.from_id === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${m.from_id === user.id ? "bg-[#9C4154] text-white" : "bg-[#F5F2EB] text-[#1A1A1A]"}`}>
                <div className="text-sm">{m.text}</div>
                <div className={`text-[10px] mt-1 ${m.from_id === user.id ? "text-white/70" : "text-[#6E6B68]"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2" data-testid="message-form">
          <input data-testid="message-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." className="dc-input flex-1" />
          <button data-testid="message-send" type="submit" className="dc-btn-primary"><Send size={14} /></button>
        </form>
      </div>
    </div>
  );
}
