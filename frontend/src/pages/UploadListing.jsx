import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { Camera, X, ImagePlus, Shirt, Gem } from "lucide-react";
import { toast } from "sonner";

const DRESS_CATEGORIES = ["Western", "Ethnic", "Partywear", "Formal"];
const ACCESSORY_CATEGORIES = ["Jewellery", "Bags", "Shoes", "Belts", "Scarves", "Hair Accessories"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const OCCASIONS = ["Wedding", "Cocktail", "Brunch", "Reception", "Festival", "Sangeet", "Casual", "Office", "Engagement", "Gala"];
const CONDITIONS = [
  { value: "New", label: "New — with tags, never worn" },
  { value: "Like New", label: "Like New — worn 1-2 times" },
  { value: "Good", label: "Good — gently used, no flaws" },
  { value: "Fair", label: "Fair — minor wear visible" },
  { value: "Well Loved", label: "Well Loved — visible wear, still beautiful" },
];

export default function UploadListing() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    item_type: "dress",
    title: "", description: "",
    category: "Ethnic",
    size: "M", color: "", brand: "", occasion: "Wedding",
    condition: "Good",
    rent_price: 1500, security_deposit: 5000, sale_price: "",
    available_from: "", available_to: ""
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const switchType = (t) => setForm(f => ({
    ...f, item_type: t,
    category: t === "dress" ? "Ethnic" : "Jewellery"
  }));

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setImages(prev => [...prev, { url: data.url, id: data.id }]);
      }
      toast.success(`${files.length} image(s) uploaded`);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const removeImg = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    if (images.length === 0) { toast.error("Add at least 1 image (3 recommended)"); return; }
    setBusy(true);
    try {
      const payload = {
        ...form,
        rent_price: Number(form.rent_price),
        security_deposit: Number(form.security_deposit),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        images: images.map(i => i.url),
      };
      const { data } = await api.post("/listings", payload);
      toast.success("Listing submitted! It will be live once our team approves it.", { duration: 5000 });
      nav(`/profile`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  const cats = form.item_type === "dress" ? DRESS_CATEGORIES : ACCESSORY_CATEGORIES;

  return (
    <div className="bg-[#FDFBF7] min-h-screen" data-testid="upload-page">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12">
        <span className="text-overline text-[#9C4154]">List on Restyle</span>
        <h1 className="font-serif-display text-4xl sm:text-5xl mt-2">Share your closet.</h1>
        <p className="text-[#6E6B68] mt-2">Rent or resell pre-loved dresses and accessories.</p>

        <form onSubmit={submit} className="mt-10 space-y-8">
          {/* Type toggle */}
          <section>
            <h3 className="font-serif-display text-2xl mb-3">What are you listing?</h3>
            <div className="grid grid-cols-2 gap-3" data-testid="item-type-toggle">
              <button type="button" onClick={() => switchType("dress")} data-testid="type-dress" className={`p-5 rounded-2xl border-2 text-left transition ${form.item_type === "dress" ? "border-[#9C4154] bg-[#F2E8EB]" : "border-[#E8E3DA] hover:border-[#9C4154]/40"}`}>
                <Shirt size={20} className="text-[#9C4154]" />
                <div className="font-serif-display text-lg mt-2">Dress / Outfit</div>
                <div className="text-xs text-[#6E6B68]">Lehengas, sarees, gowns, western wear</div>
              </button>
              <button type="button" onClick={() => switchType("accessory")} data-testid="type-accessory" className={`p-5 rounded-2xl border-2 text-left transition ${form.item_type === "accessory" ? "border-[#9C4154] bg-[#F2E8EB]" : "border-[#E8E3DA] hover:border-[#9C4154]/40"}`}>
                <Gem size={20} className="text-[#9C4154]" />
                <div className="font-serif-display text-lg mt-2">Accessory</div>
                <div className="text-xs text-[#6E6B68]">Jewellery, bags, shoes, belts</div>
              </button>
            </div>
          </section>

          {/* Photos */}
          <section>
            <h3 className="font-serif-display text-2xl mb-3">Photos</h3>
            <p className="text-xs text-[#6E6B68] mb-4">Min 1 image, 3+ recommended. Show front, back, and detail shots.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F2EB]">
                  <img src={fileUrl(img.url)} alt="upload" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImg(i)} data-testid={`remove-img-${i}`} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center hover:bg-white"><X size={14} /></button>
                </div>
              ))}
              <label data-testid="image-uploader" className="aspect-square rounded-xl border-2 border-dashed border-[#E8E3DA] flex flex-col items-center justify-center text-[#6E6B68] cursor-pointer hover:border-[#9C4154] hover:text-[#9C4154] transition">
                {uploading ? <Camera className="animate-pulse" size={20} /> : <ImagePlus size={20} />}
                <span className="text-xs mt-2">{uploading ? "Uploading..." : "Add photo"}</span>
                <input type="file" accept="image/*" multiple onChange={onPick} className="hidden" disabled={uploading} />
              </label>
            </div>
          </section>

          {/* Description */}
          <section className="space-y-4">
            <h3 className="font-serif-display text-2xl">The story</h3>
            <input data-testid="up-title" className="dc-input" placeholder={form.item_type === "dress" ? "Title (e.g. Blush Pink Lehenga with Mirror Work)" : "Title (e.g. Polki Diamond Choker Set)"} required value={form.title} onChange={(e) => set("title", e.target.value)} />
            <textarea data-testid="up-description" className="dc-input" style={{ height: "auto", minHeight: "6rem", padding: "0.75rem 1rem" }} placeholder="Describe the piece, fit, fabric/material, what it's perfect for..." required value={form.description} onChange={(e) => set("description", e.target.value)} />
          </section>

          {/* Specs */}
          <section className="grid sm:grid-cols-2 gap-4">
            <Field label="Category" testId="up-category"><select value={form.category} onChange={(e) => set("category", e.target.value)} className="dc-input">{cats.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Size" testId="up-size"><select value={form.size} onChange={(e) => set("size", e.target.value)} className="dc-input">{SIZES.map(s => <option key={s}>{s}</option>)}<option value="One Size">One Size</option></select></Field>
            <Field label="Color" testId="up-color"><input value={form.color} onChange={(e) => set("color", e.target.value)} className="dc-input" placeholder="e.g. Blush Pink" required /></Field>
            <Field label="Brand (optional)" testId="up-brand"><input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="dc-input" placeholder="e.g. Anita Dongre" /></Field>
            <Field label="Occasion" testId="up-occasion"><select value={form.occasion} onChange={(e) => set("occasion", e.target.value)} className="dc-input">{OCCASIONS.map(o => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Condition" testId="up-condition">
              <select value={form.condition} onChange={(e) => set("condition", e.target.value)} className="dc-input">
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </section>

          {/* Pricing */}
          <section>
            <h3 className="font-serif-display text-2xl mb-4">Pricing</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Rent / 3 days (₹)" testId="up-rent"><input type="number" required min={100} value={form.rent_price} onChange={(e) => set("rent_price", e.target.value)} className="dc-input" /></Field>
              <Field label="Security Deposit (₹)" testId="up-deposit"><input type="number" required min={500} value={form.security_deposit} onChange={(e) => set("security_deposit", e.target.value)} className="dc-input" /></Field>
              <Field label="Sale Price (optional ₹)" testId="up-sale"><input type="number" min={0} value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} className="dc-input" placeholder="Leave empty if not for sale" /></Field>
            </div>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <Field label="Available from" testId="up-from"><input type="date" value={form.available_from} onChange={(e) => set("available_from", e.target.value)} className="dc-input" /></Field>
            <Field label="Available till" testId="up-to"><input type="date" value={form.available_to} onChange={(e) => set("available_to", e.target.value)} className="dc-input" /></Field>
          </section>

          <button data-testid="publish-btn" disabled={busy || uploading} className="dc-btn-primary w-full">
            {busy ? "Publishing..." : "Publish listing"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, testId }) {
  return (
    <label className="block" data-testid={testId}>
      <span className="text-overline text-[#6E6B68] block mb-2">{label}</span>
      {children}
    </label>
  );
}
