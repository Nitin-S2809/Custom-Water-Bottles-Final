import { useEffect, useState } from "react";
import { Download, Eye, FileText, X } from "lucide-react";
import { adminFetch } from "../utils/adminAuth";

const API_BASE = "http://localhost:5000";

const valueOrFallback = (value) => value === undefined || value === null || value === "" ? "Not provided" : value;

const maskAccountNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "Not provided";
  return `XXXX XXXX ${digits.slice(-4)}`;
};

const formatDate = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function AdminSupplierDetails({ supplierId, token, navigate, onClose }) {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [loadingDocument, setLoadingDocument] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;
    const loadSupplier = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminFetch(`${API_BASE}/api/admin/suppliers/${encodeURIComponent(supplierId)}`, {}, navigate);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Unable to load supplier details");
        if (active) setSupplier(payload.supplier || null);
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load supplier details");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (supplierId) loadSupplier();
    return () => { active = false; };
  }, [navigate, supplierId, token]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const retrieveDocument = async (documentType, action) => {
    setLoadingDocument(`${documentType}-${action}`);
    setDocumentError("");
    try {
      const response = await adminFetch(
        `${API_BASE}/api/admin/suppliers/${encodeURIComponent(supplierId)}/documents/${documentType}`,
        {},
        navigate
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to retrieve this document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (action === "view") {
        setPreview({ url, label: `${documentType.toUpperCase()} Certificate`, type: blob.type });
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${documentType}-certificate`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch (requestError) {
      setDocumentError(requestError.message || "Unable to retrieve this document");
    } finally {
      setLoadingDocument("");
    }
  };

  const Field = ({ label, value }) => (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{valueOrFallback(value)}</p>
    </div>
  );

  const DocumentRow = ({ label, type, uploaded }) => (
    <div className="flex flex-col gap-3 border-t border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <FileText size={18} className="shrink-0 text-sky-700" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className={`mt-1 text-xs font-medium ${uploaded ? "text-emerald-700" : "text-slate-500"}`}>
            {uploaded ? "Uploaded" : "Not uploaded"}
          </p>
        </div>
      </div>
      {uploaded ? (
        <div className="flex gap-2">
          <button type="button" disabled={Boolean(loadingDocument)} onClick={() => retrieveDocument(type, "view")} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Eye size={14} /> {loadingDocument === `${type}-view` ? "Loading..." : "View"}
          </button>
          <button type="button" disabled={Boolean(loadingDocument)} onClick={() => retrieveDocument(type, "download")} className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60">
            <Download size={14} /> {loadingDocument === `${type}-download` ? "Loading..." : "Download"}
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="supplier-details-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Supplier application</p>
            <h2 id="supplier-details-title" className="mt-1 text-xl font-bold text-slate-900">{supplier?.companyName || "Supplier details"}</h2>
          </div>
          <button type="button" aria-label="Close supplier details" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </header>

        {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading supplier application...</p> : null}
        {error ? <p role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {!loading && !error && supplier ? (
          <div className="space-y-6 p-5 sm:p-6">
            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Supplier information</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Business name" value={supplier.companyName} />
                <Field label="Owner name" value={supplier.ownerName} />
                <Field label="Business email" value={supplier.businessEmail} />
                <Field label="Phone" value={supplier.phoneNumber} />
                <Field label="City" value={supplier.city} />
                <Field label="State" value={supplier.state} />
                <Field label="Production capacity" value={supplier.productionCapacity ? `${supplier.productionCapacity} bottles/month` : null} />
                <Field label="GST number" value={supplier.gstNumber} />
                <Field label="Application date" value={formatDate(supplier.requestedAt || supplier.createdAt)} />
                <Field label="Application status" value={supplier.approvalStatus || supplier.status} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Bank details</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Account holder" value={supplier.accountHolderName} />
                <Field label="Account number" value={maskAccountNumber(supplier.accountNumber)} />
                <Field label="IFSC code" value={supplier.ifscCode} />
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-700">Business documents</h3>
              <div>
                <DocumentRow label="FSSAI certificate" type="fssai" uploaded={Boolean(supplier.documents?.fssai?.uploaded)} />
                <DocumentRow label="GST certificate" type="gst" uploaded={Boolean(supplier.documents?.gst?.uploaded)} />
              </div>
              {documentError ? <p role="alert" className="mt-2 text-sm text-red-700">{documentError}</p> : null}
            </section>
          </div>
        ) : null}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
          <section role="dialog" aria-modal="true" aria-label={preview.label} className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">{preview.label}</h3>
              <button type="button" aria-label="Close preview" onClick={() => setPreview(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </header>
            {preview.type.startsWith("image/") ? <img src={preview.url} alt={preview.label} className="h-full min-h-0 w-full object-contain p-3" /> : <iframe title={preview.label} src={preview.url} className="h-full w-full" />}
          </section>
        </div>
      ) : null}
    </div>
  );
}