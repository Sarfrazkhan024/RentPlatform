import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose} data-testid="modal-backdrop">
      <div className={`bg-white rounded-2xl p-7 w-full ${maxWidth} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-serif-display text-2xl">{title}</h3>
          <button onClick={onClose} data-testid="modal-close" className="p-1 hover:bg-[#F5F2EB] rounded-full"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onClose, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-[#6E6B68]">{message}</p>
      <div className="flex gap-3 mt-6 justify-end">
        <button onClick={onClose} data-testid="confirm-cancel" className="dc-btn-secondary text-sm">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} data-testid="confirm-ok" className={`dc-btn-primary text-sm ${danger ? "!bg-[#A53030] hover:!bg-[#8B2828]" : ""}`}>
          {danger ? "Delete" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
