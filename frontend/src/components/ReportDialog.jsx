import React, { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Flag, X } from "lucide-react";

const REASONS = [
  "Inappropriate content",
  "Misleading photos",
  "Suspicious / scam",
  "Counterfeit / not authentic",
  "Offensive owner behaviour",
  "Other",
];

export default function ReportDialog({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/reports", { target_type: targetType, target_id: targetId, reason, details });
      toast.success("Report submitted. Our team will review.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose} data-testid="report-dialog">
      <div className="bg-white rounded-2xl p-7 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#FEF1F2] flex items-center justify-center mb-3">
              <Flag size={18} className="text-[#9C4154]" />
            </div>
            <h3 className="font-serif-display text-2xl">Report this {targetType}</h3>
            <p className="text-xs text-[#6E6B68] mt-1">Help us keep DressCircle safe and trusted.</p>
          </div>
          <button onClick={onClose} data-testid="report-close" className="p-1 hover:bg-[#F5F2EB] rounded-full"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-overline text-[#6E6B68] block mb-2">Reason</span>
            <select data-testid="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="dc-input">
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-overline text-[#6E6B68] block mb-2">More details (optional)</span>
            <textarea data-testid="report-details" value={details} onChange={(e) => setDetails(e.target.value)} className="dc-input" style={{ height: "auto", minHeight: "5rem", padding: "0.75rem 1rem" }} placeholder="Share what happened..." />
          </label>
          <button type="submit" disabled={busy} data-testid="report-submit" className="dc-btn-primary w-full">
            {busy ? "Submitting..." : "Submit report"}
          </button>
        </form>
      </div>
    </div>
  );
}
