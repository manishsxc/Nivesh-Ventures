"use client";

import { useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { compressImage } from "@/lib/imageCompress";
import { Upload, CheckCircle2, Loader2, Link2, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";

export default function FileUploadField({
  label,
  value,
  onChange,
  onDelete,
  showWarning = true,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  showWarning?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [useLink, setUseLink] = useState(false);
  const [cloudinaryFailed, setCloudinaryFailed] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 90);
      const url = await uploadToCloudinary(compressed);
      onChange(url);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      setCloudinaryFailed(true);
      setUseLink(true);
      toast.error("Upload failed — paste a Google Drive link instead");
    } finally {
      setUploading(false);
    }
  }

  function submitLink() {
    if (!linkInput.trim()) { toast.error("Paste a link first"); return; }
    onChange(linkInput.trim());
    toast.success(`${label} link saved`);
  }

  return (
    <div>
      <label className="text-xs text-ink-muted block mb-1">{label}</label>

      {!useLink ? (
        <div className="flex items-center gap-3 flex-wrap">
          <label className="btn-ghost text-xs py-2 px-3 flex items-center gap-2 cursor-pointer">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading..." : value ? "Replace file" : "Choose file"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
          </label>
          <button type="button" onClick={() => setUseLink(true)} className="text-xs text-neon-cyan flex items-center gap-1">
            <Link2 size={12} /> Or paste Drive link
          </button>
          {value && (
            <div className="flex items-center gap-2">
              <a href={value} target="_blank" className="text-xs text-neon-green flex items-center gap-1">
                <CheckCircle2 size={13} /> Uploaded — view
              </a>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-xs text-neon-magenta hover:underline ml-2"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            className="input-field text-xs py-2"
            placeholder="Paste Google Drive (or any) shareable link"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
          />
          <button type="button" onClick={submitLink} className="btn-primary text-xs py-2 px-3">Save</button>
          {!cloudinaryFailed && (
            <button type="button" onClick={() => setUseLink(false)} className="text-xs text-ink-muted">Cancel</button>
          )}
        </div>
      )}

      {value && /\.(jpg|jpeg|png|webp)$/i.test(value) && (
        <div className="relative inline-block mt-2">
          <img src={value} alt={label} className="h-24 rounded-lg border border-white/10 object-cover" />
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="absolute -top-1.5 -right-1.5 bg-neon-magenta/90 text-white rounded-full p-1 shadow hover:bg-neon-magenta transition flex items-center justify-center"
              title="Delete image"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {showWarning && (
        <p className="text-xs text-neon-magenta font-medium mt-2 flex items-start gap-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Upload only real, unedited proof. Fake or mismatched screenshots will be rejected and payment will not be approved or refunded.
        </p>
      )}
    </div>
  );
}
