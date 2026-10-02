import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api/orders`;
const paidStatuses = ["paid", "captured"];

function formatMoney(value, currency = "INR") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function displayStatus(status) {
  return String(status || "pending").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTimeline(order) {
  const paymentState = order.paymentStatus || "pending";
  const paymentComplete = paidStatuses.includes(paymentState);
  const currentStatus = order.status || "pending";
  const steps = [
    { key: "placed", label: "Order Placed", detail: "Your order was received." },
    { key: "payment", label: paymentComplete ? "Payment Successful" : paymentState === "failed" ? "Payment Failed" : "Payment Pending", detail: paymentComplete ? "Payment has been verified." : "Payment is not confirmed yet." },
    { key: "supplier", label: currentStatus === "pending" ? "Waiting for Supplier" : "Supplier Accepted", detail: currentStatus === "pending" ? "A supplier will review your paid order." : "A supplier has accepted your order." },
    { key: "in-production", label: "In Production", detail: "Your bottles are being prepared." },
    { key: "ready", label: "Ready for Dispatch", detail: "Your order is ready to leave the facility." },
    { key: "shipped", label: "Shipped", detail: "Your order is with the carrier." },
    { key: "out-for-delivery", label: "Out for Delivery", detail: "Your order is out for delivery." },
    { key: "delivered", label: "Delivered", detail: "Your order has been delivered." },
  ];

  const currentIndex = {
    pending: 2,
    accepted: 3,
    "in-production": 3,
    ready: 4,
    shipped: 5,
    "out-for-delivery": 6,
    delivered: 7,
  }[currentStatus] ?? 2;

  return steps.map((step, index) => {
    let state = "upcoming";
    if (index === 0) state = "complete";
    if (index === 1) state = paymentComplete ? "complete" : paymentState === "failed" ? "error" : "current";
    if (index >= 2 && paymentComplete && index < currentIndex) state = "complete";
    if (index >= 2 && paymentComplete && index === currentIndex) state = "current";
    if (currentStatus === "delivered" && index > 1) state = "complete";
    if (currentStatus === "cancelled") state = index === 0 || (index === 1 && paymentComplete) ? "complete" : "upcoming";
    return { ...step, state };
  });
}

function DetailItem({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return <div className="border-b border-slate-100 pb-3"><dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd></div>;
}

function OrderTimeline({ order }) {
  const steps = getTimeline(order);
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Truck size={19} /></div><div><h2 className="text-lg font-bold text-slate-900">Order progress</h2><p className="mt-1 text-xs text-slate-500">Status is refreshed automatically while this page is open.</p></div></div><ol className="mt-6 space-y-0">{steps.map((step, index) => <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">{index < steps.length - 1 ? <span className={`absolute left-[15px] top-8 h-full w-px ${step.state === "complete" ? "bg-emerald-300" : "bg-slate-200"}`} /> : null}<span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${step.state === "complete" ? "border-emerald-500 bg-emerald-500 text-white" : step.state === "current" ? "border-blue-600 bg-blue-50 text-blue-600" : step.state === "error" ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-300"}`}>{step.state === "complete" ? <Check size={15} strokeWidth={3} /> : step.state === "error" ? <XCircle size={16} /> : step.state === "current" ? <Clock3 size={15} /> : <Circle size={9} fill="currentColor" />}</span><div className="min-w-0 pt-1"><p className={`text-sm font-semibold ${step.state === "current" ? "text-blue-700" : step.state === "error" ? "text-red-700" : "text-slate-800"}`}>{step.label}</p><p className="mt-1 text-xs text-slate-500">{step.detail}</p></div></li>)}</ol>{order.status === "cancelled" ? <div className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><XCircle className="shrink-0" size={18} /><p>This order was cancelled or rejected{order.updatedAt ? ` on ${formatDate(order.updatedAt)}` : ""}.</p></div> : null}</section>;
}

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("unauthorized");
      return undefined;
    }

    let mounted = true;
    const loadOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const nextState = response.status === 401 ? "unauthorized" : response.status === 404 || response.status === 403 ? "not-found" : "error";
          throw Object.assign(new Error(data.message || "Unable to load order details."), { nextState });
        }
        if (mounted) {
          setOrder(data.order || null);
          setState(data.order ? "ready" : "not-found");
          setMessage("");
        }
      } catch (error) {
        if (mounted) {
          setState(error.nextState || "error");
          setMessage(error.message || "Unable to load order details.");
        }
      }
    };

    loadOrder();
    const intervalId = window.setInterval(loadOrder, 15000);
    const handleVisibility = () => { if (document.visibilityState === "visible") loadOrder(); };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", loadOrder);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", loadOrder);
    };
  }, [orderId, token]);

  if (state === "loading") return <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-16 text-center text-sm text-slate-500">Loading order details...</main>;
  if (state === "unauthorized") return <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-16 text-center"><h1 className="text-xl font-bold text-slate-900">You are not authorized to view this order.</h1><button type="button" onClick={() => navigate("/login")} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Go to Login</button></main>;
  if (state !== "ready" || !order) return <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-16 text-center"><h1 className="text-xl font-bold text-slate-900">{state === "not-found" ? "Order not found." : "Unable to load order details."}</h1><p className="mt-2 text-sm text-slate-500">{message || "Please try again."}</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} />Retry</button><button type="button" onClick={() => navigate("/user-profile")} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Back to My Orders</button></div></main>;

  const address = order.deliveryAddress || {};
  const addressLines = [address.addressLine1, address.addressLine2, [address.city, address.state].filter(Boolean).join(", "), address.pincode, address.country].filter(Boolean);
  const paymentComplete = paidStatuses.includes(order.paymentStatus);
  const customerName = order.customer?.username || address.fullName;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><button type="button" onClick={() => navigate("/user-profile")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={17} /> My Orders</button><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">AquaBrand Customized Bottles</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Order #{order._id}</h1><p className="mt-2 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p></div><span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${order.status === "cancelled" ? "bg-red-50 text-red-700" : order.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{displayStatus(order.status)}</span></div><div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><div className="space-y-5"><OrderTimeline order={order} /><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Package size={19} /></div><h2 className="text-lg font-bold text-slate-900">Order information</h2></div><dl className="mt-5 grid gap-4 sm:grid-cols-2"><DetailItem label="Product" value={`${order.bottleType || "Bottle"} Bottle`} /><DetailItem label="Quantity" value={`${Number(order.quantity || 0).toLocaleString("en-IN")} bottles`} /><DetailItem label="Brand name" value={order.brandName} /><DetailItem label="Printing" value={order.printing} /><DetailItem label="Order date" value={formatDate(order.createdAt)} /><DetailItem label="Expected delivery" value={order.deliveryDate ? formatDate(order.deliveryDate) : "Expected delivery date not available"} /><DetailItem label="Payment method" value={order.paymentMethod || "Not available"} /><DetailItem label="Payment status" value={paymentComplete ? "Payment Successful" : displayStatus(order.paymentStatus)} /><DetailItem label="Razorpay order ID" value={order.razorpayOrderId} /><DetailItem label="Special instructions" value={order.specialInstructions || "No special instructions"} /></dl></section></div><aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard size={19} /></div><h2 className="text-lg font-bold text-slate-900">Payment summary</h2></div><dl className="mt-5 space-y-3"><DetailItem label="Unit price" value={formatMoney(order.pricing?.unitPrice, order.currency || "INR")} /><DetailItem label="Subtotal" value={formatMoney(order.pricing?.subtotal, order.currency || "INR")} /><DetailItem label="Shipping" value={formatMoney(order.pricing?.shipping, order.currency || "INR")} /><div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900"><dt>Total</dt><dd>{formatMoney(order.pricing?.total, order.currency || "INR")}</dd></div></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MapPin size={19} /></div><h2 className="text-lg font-bold text-slate-900">Delivery details</h2></div><div className="mt-5 space-y-2 text-sm text-slate-600">{customerName ? <p className="font-semibold text-slate-900">{customerName}</p> : null}{addressLines.length ? addressLines.map((line) => <p key={line}>{line}</p>) : <p>Delivery address not available</p>}{address.phoneNumber ? <p className="pt-2">{address.phoneNumber}</p> : null}{address.deliveryInstructions ? <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">Note: {address.deliveryInstructions}</p> : null}</div></section>{order.supplier ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Supplier</h2><p className="mt-3 font-semibold text-slate-800">{order.supplier.companyName}</p><p className="mt-1 text-sm text-slate-500">{[order.supplier.city, order.supplier.state].filter(Boolean).join(", ") || "Supplier location not available"}</p>{order.supplier.phoneNumber ? <p className="mt-2 text-sm text-slate-600">{order.supplier.phoneNumber}</p> : null}</section> : null}</aside></div></main>;
}
