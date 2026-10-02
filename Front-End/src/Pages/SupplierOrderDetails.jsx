import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/authApi";

const TIMELINE_STATUSES = [
  "pending",
  "accepted",
  "in-production",
  "ready",
  "shipped",
  "out-for-delivery",
  "delivered",
];

const STATUS_LABELS = {
  pending: "Order Placed",
  accepted: "Supplier Accepted",
  "in-production": "In Production",
  ready: "Ready for Dispatch",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_ACTIONS = {
  pending: [{ label: "Accept Order", status: "accepted" }],
  accepted: [{ label: "Start Production", status: "in-production" }],
  "in-production": [{ label: "Mark Ready for Dispatch", status: "ready" }],
  ready: [{ label: "Mark Shipped", status: "shipped" }],
  shipped: [{ label: "Mark Out for Delivery", status: "out-for-delivery" }],
  "out-for-delivery": [],
  delivered: [],
  cancelled: [],
};

const UNAUTHORIZED = "unauthorized";

function formatMoney(value, currency = "INR") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatStatusLabel(status) {
  return STATUS_LABELS[status] || String(status || "pending").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAddressText(address) {
  if (!address) return "Address not available";
  return [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.pincode,
    address.country,
    address.deliveryInstructions,
  ].filter(Boolean).join(" · ");
}

function useToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return [toast, setToast];
}

function DetailItem({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="border-b border-slate-100 pb-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function getOrderLogoSource(logoReference) {
  if (typeof logoReference !== "string" || !logoReference.trim()) return "";

  const reference = logoReference.trim();
  if (/^data:image\/(?:png|jpe?g|webp|svg\+xml);/i.test(reference)) return reference;
  if (/^https?:\/\//i.test(reference)) return reference;

  const normalizedPath = reference.replace(/\\/g, "/");
  const storedUpload = normalizedPath.match(/^\/?uploads\/([A-Za-z0-9._-]+)$/i);
  if (!storedUpload || storedUpload[1].includes("..")) return "";

  return `${API_BASE_URL.replace(/\/+$/, "")}/uploads/${encodeURIComponent(storedUpload[1])}`;
}

function CustomerLogo({ logoUrl }) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const source = getOrderLogoSource(logoUrl);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Customer logo</h2>
        <p className="mt-1 text-xs text-slate-500">Artwork supplied for this order.</p>
      </div>
      <div className="mt-4 flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 sm:min-h-[260px]">
        {!source || hasLoadError ? (
          <p className="text-sm text-slate-500" role="status">No custom logo uploaded</p>
        ) : (
          <img
            src={source}
            alt="Customer-uploaded logo for this order"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setHasLoadError(true)}
            className="max-h-64 max-w-full object-contain"
          />
        )}
      </div>
    </section>
  );
}

function OrderTimeline({ order }) {
  const currentStatus = order?.status || "pending";
  const currentIndex = TIMELINE_STATUSES.indexOf(currentStatus);

  const steps = TIMELINE_STATUSES.map((status, index) => {
    if (status === "cancelled") return null;

    let state = "upcoming";
    if (index < currentIndex) state = "complete";
    if (index === currentIndex) state = "current";
    if (currentStatus === "cancelled") state = "error";

    return {
      key: status,
      label: STATUS_LABELS[status],
      state,
    };
  }).filter(Boolean);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Truck size={19} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Order progress</h2>
          <p className="mt-1 text-xs text-slate-500">Timeline updates from the live backend order status.</p>
        </div>
      </div>

      <ol className="mt-6 space-y-0">
        {steps.map((step, index) => (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span className={`absolute left-[15px] top-8 h-full w-px ${step.state === "complete" ? "bg-emerald-300" : "bg-slate-200"}`} />
            ) : null}
            <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${step.state === "complete" ? "border-emerald-500 bg-emerald-500 text-white" : step.state === "current" ? "border-blue-600 bg-blue-50 text-blue-600" : step.state === "error" ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-300"}`}>
              {step.state === "complete" ? <Check size={15} strokeWidth={3} /> : step.state === "error" ? <XCircle size={16} /> : step.state === "current" ? <Clock3 size={15} /> : <Circle size={9} fill="currentColor" />}
            </span>
            <div className="min-w-0 pt-1">
              <p className={`text-sm font-semibold ${step.state === "current" ? "text-blue-700" : step.state === "error" ? "text-red-700" : "text-slate-800"}`}>{step.label}</p>
            </div>
          </li>
        ))}
      </ol>

      {order?.status === "cancelled" ? (
        <div className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="shrink-0" size={18} />
          <p>This order was cancelled and is no longer eligible for production updates.</p>
        </div>
      ) : null}
    </section>
  );
}

export default function SupplierOrderDetails({
  orderId: propOrderId,
  token: propToken,
}) {

  const { orderId: routeOrderId } = useParams();

  const orderId = propOrderId || routeOrderId;

  const navigate = useNavigate();

  const { token: authToken } = useAuth();

  const token = propToken || authToken;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [toast, setToast] = useToast();

  const currentStatus = order?.status || "pending";
  const nextAction = STATUS_ACTIONS[currentStatus]?.[0] || null;

  const loadOrder = useCallback(async () => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw Object.assign(new Error(data.message || "Invalid or expired token"), { status: 401 });
        }
        throw new Error(data.message || "Unable to load the order details");
      }

      setOrder(data.order || null);
    } catch (loadError) {
      const message = loadError.message || "Unable to load the order details";
      setError(message);
      if (loadError.status === 401) {
        navigate("/supplier-signin", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, orderId, token]);

  useEffect(() => {
    if (!orderId) {
      setError("Order not found");
      setLoading(false);
      return undefined;
    }

    loadOrder();
    return undefined;
  }, [loadOrder, orderId]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!orderId || !token || !nextStatus || submitting) return;

    setSubmitting(true);
    setError("");
    setToast(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update the order status");
      }

      setOrder(data.order || { ...order, status: nextStatus });
      setToast({ type: "success", message: `${formatStatusLabel(nextStatus)} status updated successfully.` });
      await loadOrder();
    } catch (updateError) {
      setError(updateError.message || "Unable to update the order status");
      setToast({ type: "error", message: updateError.message || "Unable to update the order status" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateOtp = async () => {
    if (!token || !orderId || otpLoading) return;

    setOtpLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/orders/${encodeURIComponent(orderId)}/generate-delivery-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to generate delivery OTP");
      }

      setToast({ type: "success", message: "Delivery OTP sent successfully to the customer's registered email. Ask the customer for the OTP." });
      await loadOrder();
    } catch (otpError) {
      setError(otpError.message || "Unable to generate delivery OTP");
      setToast({ type: "error", message: otpError.message || "Unable to generate delivery OTP" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!token || !orderId || !otpInput.trim() || otpLoading) return;

    setOtpLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/orders/${encodeURIComponent(orderId)}/verify-delivery-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: otpInput.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to verify delivery OTP");
      }

      setOtpInput("");
      setToast({ type: "success", message: "Delivery verified successfully. Order marked as delivered." });
      await loadOrder();
    } catch (otpError) {
      setError(otpError.message || "Unable to verify delivery OTP");
      setToast({ type: "error", message: otpError.message || "Unable to verify delivery OTP" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleInitiatePayout = async () => {
    if (!token || !orderId || payoutLoading) return;

    setPayoutLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/orders/${encodeURIComponent(orderId)}/initiate-payout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to initiate payout");
      }

      setToast({ type: "success", message: data.message || "Payout process started." });
      await loadOrder();
    } catch (payoutError) {
      const message = payoutError.message || "Unable to initiate payout";
      setError(message);
      setToast({ type: "error", message });
    } finally {
      setPayoutLoading(false);
    }
  };

  const deliveryAddress = order?.deliveryAddress || {};
  const firstAddressLine = [deliveryAddress.addressLine1, deliveryAddress.addressLine2].filter(Boolean).join(", ");
  const fullAddress = getAddressText(deliveryAddress);
  const paymentComplete = ["paid", "captured"].includes(order?.paymentStatus);
  const canGenerateOtp = currentStatus === "out-for-delivery" && !order?.deliveryOtpVerifiedAt && paymentComplete;
  const canPayout = order?.status === "delivered" && paymentComplete && Boolean(order?.deliveryOtpVerifiedAt) && !["processed", "processing"].includes(order?.supplierPayoutStatus);

  const summaryValues = useMemo(() => ({
    total: Number(order?.pricing?.total || 0),
    subtotal: Number(order?.pricing?.subtotal || 0),
    shipping: Number(order?.pricing?.shipping || 0),
    quantity: Number(order?.quantity || 0),
  }), [order]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCw size={18} className="animate-spin text-blue-600" />
            Loading order details...
          </div>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-semibold">Unable to load order</p>
              <p className="mt-1">{error}</p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={loadOrder} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Retry</button>
                <button type="button" onClick={() => navigate("/supplier-orders")} className="rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-100">Back to orders</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-900">Order not found</p>
          <p className="mt-2 text-sm text-slate-500">This order may have been removed or assigned elsewhere.</p>
          <button type="button" onClick={() => navigate("/supplier-orders")} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Back to orders</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate("/supplier-orders")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
        <ArrowLeft size={17} /> Back to orders
      </button>

      {toast ? (
        <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border p-3 text-sm shadow-lg ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status">
          {toast.message}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">AquaBrand Customized Bottles</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Order #{String(order._id).slice(0, 12)}</h1>
          <p className="mt-2 text-sm text-slate-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${order.status === "cancelled" ? "bg-red-50 text-red-700" : order.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
          {formatStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <OrderTimeline order={order} />
          <CustomerLogo key={`${order._id}-${order.logoUrl || "no-logo"}`} logoUrl={order.logoUrl} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Package size={19} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Order information</h2>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Bottle / Product" value={`${order.bottleType || "Bottle"} bottle`} />
              <DetailItem label="Bottle size" value={order.bottleType || "Not available"} />
              <DetailItem label="Quantity" value={`${summaryValues.quantity.toLocaleString("en-IN")} units`} />
              <DetailItem label="Price" value={formatMoney(order.pricing?.unitPrice || 0)} />
              <DetailItem label="Subtotal" value={formatMoney(summaryValues.subtotal)} />
              <DetailItem label="Shipping" value={formatMoney(summaryValues.shipping)} />
              <DetailItem label="Total amount" value={formatMoney(summaryValues.total)} />
              <DetailItem label="Order date" value={formatDate(order.createdAt)} />
              <DetailItem label="Expected delivery" value={order.expectedDelivery ? formatDate(order.expectedDelivery) : "Not available"} />
              <DetailItem label="Payment status" value={order.paymentStatus ? formatStatusLabel(order.paymentStatus) : "Not available"} />
              <DetailItem label="Current status" value={formatStatusLabel(order.status)} />
              <DetailItem label="Brand name" value={order.brandName || "Not available"} />
              <DetailItem label="Special instructions" value={order.specialInstructions || "No instructions provided"} />
            </dl>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <CheckCircle2 size={19} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Customer information</h2>
            </div>

            <dl className="mt-5 space-y-4">
              <DetailItem label="Name" value={order.customer?.username || order.customer?.fullName || "Not available"} />
              <DetailItem label="Email" value={order.customer?.email || deliveryAddress.email || "Not available"} />
              <DetailItem label="Mobile" value={deliveryAddress.phoneNumber || order.customer?.phoneNumber || "Not available"} />
            </dl>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MapPin size={15} className="text-blue-600" /> Delivery address
              </div>
              <p className="text-sm leading-6 text-slate-700">{fullAddress}</p>
              {firstAddressLine ? <p className="mt-2 text-xs text-slate-500">{firstAddressLine}</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CreditCard size={19} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Supplier actions</h2>
            </div>

            {order.status === "cancelled" ? (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                This order has been cancelled and cannot proceed through the production workflow.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {nextAction ? (
                  <button type="button" disabled={submitting} onClick={() => handleUpdateStatus(nextAction.status)} className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? "Updating..." : nextAction.label}
                  </button>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No further standard supplier status update is available at this stage.</div>
                )}

                {canGenerateOtp ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-amber-800">Delivery verification</p>
                      <ShieldCheck size={17} className="text-amber-600" />
                    </div>
                    <button type="button" onClick={handleGenerateOtp} disabled={otpLoading || submitting} className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">
                      {otpLoading ? "Sending OTP..." : "Generate Delivery OTP"}
                    </button>
                  </div>
                ) : null}

                {order.status === "out-for-delivery" ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Customer OTP</label>
                    <input value={otpInput} onChange={(event) => setOtpInput(event.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    <button type="button" onClick={handleVerifyOtp} disabled={otpLoading || !otpInput.trim()} className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                      {otpLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                ) : null}

                {canPayout ? (
                  <button type="button" onClick={handleInitiatePayout} disabled={payoutLoading} className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {payoutLoading ? "Processing payout..." : "Initiate Payout"}
                  </button>
                ) : null}

                {order.supplierPayoutStatus ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Payout status:</span> {formatStatusLabel(order.supplierPayoutStatus?.replace(/_/g, " ")) || "Not available"}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </aside>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
    </main>
  );
}
