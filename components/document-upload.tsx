"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DOCUMENT_KINDS } from "@/lib/schemas";

const KIND_LABELS: Record<(typeof DOCUMENT_KINDS)[number], string> = {
  bol: "Bill of lading",
  pod: "Proof of delivery",
  invoice: "Invoice",
  weight_cert: "Weight certificate",
  other: "Other",
};

const ERRORS: Record<string, string> = {
  file_too_large: "Files must be 15 MB or smaller.",
  unsupported_type: "Upload a PDF, JPEG, PNG or TIFF.",
};

export function DocumentUpload({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<(typeof DOCUMENT_KINDS)[number]>("pod");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string }>();

  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    setMessage(undefined);
    setProgress(0);
    try {
      // axios for upload progress; fetch has no upload progress events.
      await axios.post(`/api/shipments/${encodeURIComponent(shipmentId)}/documents`, form, {
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : null),
      });
      setMessage({ tone: "ok", text: `${KIND_LABELS[kind]} uploaded.` });
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (err) {
      const code = axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined;
      setMessage({ tone: "error", text: (code && ERRORS[code]) ?? "Upload failed. Try again." });
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="field-label">Type</span>
        <select className="field-input" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          {DOCUMENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">File</span>
        <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" className="text-sm" />
      </label>
      <button type="button" className="btn-secondary" onClick={upload} disabled={progress !== null}>
        {progress !== null ? `Uploading ${progress}%` : "Upload"}
      </button>
      {message && (
        <p className={message.tone === "ok" ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{message.text}</p>
      )}
    </div>
  );
}
