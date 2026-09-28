import { useEffect, useMemo, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const filters = ["All", "Paid", "Pending", "Failed"];
const emptyFinancialData = { invoices: [], payments: [] };
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "Not available";

function EmptyState({ type }) {
  const label = type === "payments" ? "payments" : "invoices";
  return <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><FileText size={22} /></span><p className="mt-4 text-sm font-semibold text-slate-700">No {label} yet</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">Your {label} will appear here once you complete orders.</p></div>;
}

function StatusBadge({ status }) {
  const tone = status === "Paid" ? "bg-emerald-50 text-emerald-600" : status === "Failed" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600";
  return <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${tone}`}>{status}</span>;
}

function InvoiceTable({ invoices, onView, onDownload }) {
  if (!invoices.length) return <EmptyState type="invoices" />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><th className="px-5 py-3 font-medium">Invoice ID</th><th className="px-3 py-3 font-medium">Order ID</th><th className="px-3 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Amount</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Action</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.invoiceId} className="border-b border-slate-100 last:border-0"><td className="px-5 py-4 text-xs font-semibold text-slate-700">{invoice.invoiceId}</td><td className="px-3 py-4 text-xs text-slate-500">{invoice.orderId}</td><td className="px-3 py-4 text-xs text-slate-500">{formatDate(invoice.date)}</td><td className="px-3 py-4 text-xs font-semibold text-slate-800">{formatCurrency(invoice.amount)}</td><td className="px-3 py-4"><StatusBadge status={invoice.status} /></td><td className="px-5 py-4 text-right"><div className="inline-flex items-center gap-3"><button type="button" onClick={() => onView(invoice)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View</button><button type="button" onClick={() => onDownload(invoice)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"><Download size={13} /> Download</button></div></td></tr>)}</tbody></table></div>;
}

function PaymentsTable({ payments }) {
  if (!payments.length) return <EmptyState type="payments" />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><th className="px-5 py-3 font-medium">Payment ID</th><th className="px-3 py-3 font-medium">Order ID</th><th className="px-3 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Amount</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Payment Method</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.paymentId} className="border-b border-slate-100 last:border-0"><td className="px-5 py-4 text-xs font-semibold text-slate-700">{payment.paymentId}</td><td className="px-3 py-4 text-xs text-slate-500">{payment.orderId}</td><td className="px-3 py-4 text-xs text-slate-500">{formatDate(payment.date)}</td><td className="px-3 py-4 text-xs font-semibold text-slate-800">{formatCurrency(payment.amount)}</td><td className="px-3 py-4"><StatusBadge status={payment.status} /></td><td className="px-5 py-4 text-xs text-slate-500">{payment.paymentMethod || "Not recorded"}</td></tr>)}</tbody></table></div>;
}

export default function SupplierInvoice() {
  const { token } = useAuth();
  const [data, setData] = useState(emptyFinancialData);
  const [tab, setTab] = useState("Invoices");
  const [filter, setFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadFinancialData = async () => {
      if (!token) {
        setError("Please sign in as a supplier to continue.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/suppliers/invoices", { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || "Unable to load invoices and payments");
        setData({ invoices: Array.isArray(responseData.invoices) ? responseData.invoices : [], payments: Array.isArray(responseData.payments) ? responseData.payments : [] });
        setError("");
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message || "Unable to load invoices and payments");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadFinancialData();
    return () => controller.abort();
  }, [token]);

  const filteredInvoices = useMemo(() => filter === "All" ? data.invoices : data.invoices.filter((invoice) => invoice.status === filter), [data.invoices, filter]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = (invoice) => {
    const csv = ["Invoice ID,Order ID,Date,Amount,Status", `${invoice.invoiceId},${invoice.orderId},${formatDate(invoice.date)},${invoice.amount},${invoice.status}`].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${invoice.invoiceId}.csv`);
  };

  const downloadStatement = async () => {
    setDownloading(true);
    try {
      const response = await fetch("http://localhost:5000/api/suppliers/statement", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Unable to download statement");
      downloadBlob(await response.blob(), "supplier-statement.csv");
    } catch (downloadError) {
      setError(downloadError.message || "Unable to download statement");
    } finally {
      setDownloading(false);
    }
  };

  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-xl font-bold text-slate-900">Invoices &amp; Payments</h1><p className="mt-1 text-xs text-slate-500">Manage your invoices and payment history.</p></div><button type="button" onClick={downloadStatement} disabled={downloading} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Download size={14} />{downloading ? "Preparing..." : "Download Statement"}</button></div>{error ? <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600" role="alert">{error}</p> : null}<section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex border-b border-slate-100 px-5 pt-2 sm:px-6"><button type="button" onClick={() => setTab("Invoices")} className={`border-b-2 px-1 py-3 text-xs font-semibold ${tab === "Invoices" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Invoices</button><button type="button" onClick={() => setTab("Payments")} className={`ml-6 border-b-2 px-1 py-3 text-xs font-semibold ${tab === "Payments" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Payments</button></div>{loading ? <div className="px-5 py-14 text-center text-sm text-slate-500">Loading invoices and payments...</div> : tab === "Invoices" ? <><div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${filter === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}>{item}</button>)}</div><InvoiceTable invoices={filteredInvoices} onView={setSelectedInvoice} onDownload={downloadInvoice} /></> : <PaymentsTable payments={data.payments} />}</section>{selectedInvoice ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-4" role="dialog" aria-modal="true" aria-labelledby="invoice-title"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Invoice details</p><h2 id="invoice-title" className="mt-1 text-lg font-bold text-slate-800">{selectedInvoice.invoiceId}</h2></div><button type="button" onClick={() => setSelectedInvoice(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Close invoice details"><X size={17} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] uppercase text-slate-400">Order ID</p><p className="mt-1 text-sm font-semibold text-slate-700">{selectedInvoice.orderId}</p></div><div><p className="text-[10px] uppercase text-slate-400">Date</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(selectedInvoice.date)}</p></div><div><p className="text-[10px] uppercase text-slate-400">Amount</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(selectedInvoice.amount)}</p></div><div><p className="text-[10px] uppercase text-slate-400">Status</p><div className="mt-1"><StatusBadge status={selectedInvoice.status} /></div></div></div><button type="button" onClick={() => downloadInvoice(selectedInvoice)} className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"><Download size={14} /> Download Invoice</button></div></div> : null}</div>;
}
