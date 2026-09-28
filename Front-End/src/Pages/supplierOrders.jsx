import { createElement, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SupplierOrderDetails from "./SupplierOrderDetails";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  KeyRound,
  PackageCheck,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  "in-production": "In Production",
  ready: "Ready for Dispatch",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const nextSupplierStatus = {
  pending: "accepted",
  accepted: "in-production",
  "in-production": "ready",
  ready: "shipped",
  shipped: "out-for-delivery",
  "out-for-delivery": null,
  delivered: null,
  cancelled: null,
};

const tabs = ["All Orders", "Pending", "In Production", "Shipped", "Delivered", "Cancelled"];
const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-100",
  Accepted: "bg-blue-50 text-blue-700 ring-blue-100",
  "In Production": "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Shipped: "bg-violet-50 text-violet-700 ring-violet-100",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Cancelled: "bg-red-50 text-red-700 ring-red-100",
};
const summaryDefaults = {
  totalOrders: 0,
  pendingOrders: 0,
  inProductionOrders: 0,
  shippedOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
};

function formatStatus(status) {
  return statusLabels[status] || "Pending";
}

function buildOrderSummary(orders) {
  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    inProductionOrders: orders.filter((order) => ["accepted", "in-production"].includes(order.status)).length,
    shippedOrders: orders.filter((order) => ["ready", "shipped", "out-for-delivery"].includes(order.status)).length,
    deliveredOrders: orders.filter((order) => order.status === "delivered").length,
    cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
  };
}

function getNextStatusAction(status) {
  if (!status || status === "cancelled" || status === "delivered") return null;
  const nextStatus = nextSupplierStatus[status];

  if (!nextStatus) return null;

  const actionMap = {
    accepted: { label: "Start Production", status: "in-production" },
    "in-production": { label: "Mark Ready for Dispatch", status: "ready" },
    ready: { label: "Mark Shipped", status: "shipped" },
    shipped: { label: "Mark Out for Delivery", status: "out-for-delivery" },
    pending: { label: "Accept Order", status: "accepted" },
  };

  return actionMap[nextStatus] || null;
}

const supplierProgressSteps = [
  { key: "pending", label: "Order Placed" },
  { key: "payment", label: "Payment Successful" },
  { key: "accepted", label: "Supplier Accepted" },
  { key: "in-production", label: "In Production" },
  { key: "ready", label: "Ready for Dispatch" },
  { key: "shipped", label: "Shipped" },
  { key: "out-for-delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

function formatDate(dateValue) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function SummaryCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
          {createElement(Icon, { size: 19 })}
        </span>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const label = typeof status === "string" ? status : formatStatus(status);
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusStyles[label] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>{label}</span>;
}

function OrderDetails({ order, onClose, onStatusUpdated, token }) {
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [otpGenerating, setOtpGenerating] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  if (!order) return null;

  const customerName = order.customer?.username || order.customer?.fullName || "Customer";
  const customerEmail = order.customer?.email || order.customerEmail || "Not available";
  const delivery = order.deliveryAddress || {};
  const currentStatus = order.status || "pending";
  const nextAction = getNextStatusAction(currentStatus);
  const paymentComplete = ["paid", "captured"].includes(order.paymentStatus);

  const progressIndex = Math.max(0, supplierProgressSteps.findIndex((step) => step.key === currentStatus));
  const progressSteps = supplierProgressSteps.map((step, index) => {
    let state = "upcoming";
    if (step.key === "payment") {
      state = paymentComplete ? "complete" : "current";
    } else if (index < progressIndex) {
      state = "complete";
    } else if (index === progressIndex) {
      state = "current";
    }
    if (currentStatus === "cancelled") state = "upcoming";

    return {
      ...step,
      label: step.key === "payment" && !paymentComplete ? "Payment Pending" : step.label,
      state,
    };
  });

  const visibleCurrentStatus = formatStatus(currentStatus);

  const handleStatusUpdate = async () => {
    if (!nextAction || statusUpdating) return;

    setStatusUpdating(true);
    setStatusError("");
    setStatusMessage("");

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/orders/${order._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextAction.status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update order status");
      }

      const updatedOrder = data.order || { ...order, status: nextAction.status };
      onStatusUpdated?.(updatedOrder);
      setStatusMessage(`Status updated successfully. Order is now ${formatStatus(nextAction.status)}.`);
    } catch (statusUpdateError) {
      setStatusError(statusUpdateError.message || "Unable to update order status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleGenerateOtp = async () => {
    if (currentStatus !== "out-for-delivery" || !token || otpGenerating || otpVerifying) return;

    setOtpGenerating(true);
    setStatusError("");
    setStatusMessage("");

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/orders/${order._id}/generate-delivery-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || "Unable to generate delivery OTP");

      setOtpGenerated(true);
      setStatusMessage("Delivery OTP sent successfully to the customer's registered email. Ask the customer for the OTP.");
    } catch (otpError) {
      setStatusError(otpError.message || "Unable to generate delivery OTP");
    } finally {
      setOtpGenerating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (currentStatus !== "out-for-delivery" || !token || !otpGenerated || !otpInput.trim() || otpVerifying || otpGenerating) return;

    setOtpVerifying(true);
    setStatusError("");
    setStatusMessage("");

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/orders/${order._id}/verify-delivery-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: otpInput.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || "Unable to verify delivery OTP");

      const updatedOrder = data.order || { ...order, status: "delivered", deliveryStatus: "completed", deliveryOtpVerifiedAt: new Date().toISOString() };
      onStatusUpdated?.(updatedOrder);
      setOtpInput("");
      setOtpGenerated(false);
      setStatusMessage("Delivery Verified. Order Delivered Successfully.");
    } catch (otpError) {
      setStatusError(otpError.message || "Unable to verify delivery OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  console.log("🔥 SupplierOrderDetails.jsx IS RENDERING");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Order details</p>
            <h2 id="order-details-title" className="mt-1 text-lg font-bold text-slate-900">{order._id}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close order details"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order information</p>
            </div>
            {[
              ["Order ID", order._id],
              ["Product / Bottle type", order.bottleType || "Not available"],
              ["Quantity", `${Number(order.quantity || 0).toLocaleString()} bottles`],
              ["Order date", formatDate(order.createdAt)],
              ["Expected delivery", order.expectedDelivery ? formatDate(order.expectedDelivery) : "Not available"],
              ["Current status", formatStatus(order.status)],
              ["Payment status", order.paymentStatus || "Not available"],
              ["Subtotal", `₹${Number(order.pricing?.subtotal || 0).toLocaleString("en-IN")}`],
              ["Shipping", `₹${Number(order.pricing?.shipping || 0).toLocaleString("en-IN")}`],
              ["Total", `₹${Number(order.pricing?.total || 0).toLocaleString("en-IN")}`],
              ["Customer instructions", order.specialInstructions || order.customerInstructions || "No special instructions"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-slate-100 pb-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer information</p>
            </div>
            {[
              ["Customer name", customerName],
              ["Customer email", customerEmail],
              ["Customer mobile", delivery.phoneNumber || order.customer?.phoneNumber || "Not available"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-slate-100 pb-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}

            <div className="pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Delivery address</p>
            </div>
            {[
              ["Full name", delivery.fullName || customerName],
              ["Phone number", delivery.phoneNumber || "Not available"],
              ["Address line 1", delivery.addressLine1 || "Not available"],
              ["Address line 2", delivery.addressLine2 || "Not available"],
              ["City", delivery.city || "Not available"],
              ["State", delivery.state || "Not available"],
              ["Pincode", delivery.pincode || "Not available"],
              ["Country", delivery.country || "Not available"],
              ["Delivery instructions", delivery.deliveryInstructions || "No delivery instructions"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-slate-100 pb-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">ORDER STATUS</p>
              <h3 className="text-lg font-bold text-slate-900">Order Status</h3>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <ol className="space-y-3">
              {progressSteps.map((step) => (
                <li key={step.key} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step.state === "complete" ? "bg-emerald-500 text-white" : step.state === "current" ? "bg-blue-600 text-white" : "bg-white text-slate-300 ring-1 ring-slate-200"}`}>
                    {step.state === "complete" ? <Check size={12} strokeWidth={3} /> : step.state === "current" ? <Clock3 size={12} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </span>
                  <span className={`text-sm ${step.state === "current" ? "font-semibold text-blue-700" : step.state === "complete" ? "font-medium text-slate-700" : "text-slate-400"}`}>{step.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">UPDATE ORDER STATUS</p>
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Current Status</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{visibleCurrentStatus}</p>
              </div>
              {nextAction ? (
                <button type="button" disabled={statusUpdating} onClick={handleStatusUpdate} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {statusUpdating ? "Updating..." : nextAction.label}
                </button>
              ) : currentStatus === "out-for-delivery" ? (
                <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">Delivery verification required</span>
              ) : (
                <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Order Completed</span>
              )}
            </div>

            {currentStatus === "out-for-delivery" ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900"><KeyRound size={16} /> DELIVERY VERIFICATION</div>
                <p className="mt-3 text-xs font-semibold text-amber-900">Step 1: Generate Delivery OTP</p>
                <button type="button" onClick={handleGenerateOtp} disabled={otpGenerating || otpVerifying} className="mt-2 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">
                  {otpGenerating ? "Sending OTP..." : "Generate Delivery OTP"}
                </button>
                <label className="mt-4 block text-xs font-semibold text-amber-900" htmlFor="delivery-otp">Step 2: Enter Customer OTP</label>
                <input id="delivery-otp" value={otpInput} onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, "").slice(0, 6))} disabled={!otpGenerated || otpGenerating || otpVerifying} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter 6-digit OTP" className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-amber-100" />
                <button type="button" onClick={handleVerifyOtp} disabled={!otpGenerated || otpInput.length !== 6 || otpGenerating || otpVerifying} className="mt-3 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {otpVerifying ? "Verifying OTP..." : "Verify OTP"}
                </button>
              </div>
            ) : null}

            {statusMessage ? <p className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{statusMessage}</p> : null}
            {statusError ? <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{statusError}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SupplierOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(summaryDefaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All Orders");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const pageSize = 10;

  const updateOrderInList = (updatedOrder) => {
    setOrders((currentOrders) => {
      const nextOrders = currentOrders.map((order) => order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order);
      setSummary(buildOrderSummary(nextOrders));
      return nextOrders;
    });

    setSelectedOrder((currentOrder) => (currentOrder && currentOrder._id === updatedOrder._id ? { ...currentOrder, ...updatedOrder } : currentOrder));
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Please sign in as a supplier to continue.");
      return undefined;
    }

    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("http://localhost:5000/api/suppliers/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load supplier orders");
        }

        if (!isMounted) return;

        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setSummary(data.summary || summaryDefaults);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Unable to load supplier orders");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const counts = useMemo(() => {
    const base = {
      "All Orders": orders.length,
      Pending: orders.filter((order) => formatStatus(order.status) === "Pending").length,
      "In Production": orders.filter((order) => formatStatus(order.status) === "In Production").length,
      Shipped: orders.filter((order) => formatStatus(order.status) === "Shipped").length,
      Delivered: orders.filter((order) => formatStatus(order.status) === "Delivered").length,
      Cancelled: orders.filter((order) => formatStatus(order.status) === "Cancelled").length,
    };
    return base;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const statusLabel = formatStatus(order.status);
      const matchesTab = activeTab === "All Orders" || statusLabel === activeTab;
      const matchesStatus = filterStatus === "All statuses" || statusLabel === filterStatus;
      const searchableText = [order._id, order.customer?.username, order.customer?.email, order.bottleType].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [activeTab, filterStatus, orders, search]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filteredOrders.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, filteredOrders.length);

  const handleViewDetails = async (orderId) => {
    if (!token || !orderId) return;

    setDetailsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load order details");
      }
      setSelectedOrder(data.order || null);
    } catch (detailError) {
      setError(detailError.message || "Unable to load order details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  if (loading) {
    return <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">Loading supplier orders...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Orders</h1>
        <p className="mt-1 text-xs text-slate-500">Manage and track all your orders in one place.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Total Orders" value={summary.totalOrders || orders.length} subtitle="All time" icon={ShoppingBag} tone="bg-blue-50 text-blue-600" />
        <SummaryCard title="Pending Orders" value={summary.pendingOrders || counts.Pending} subtitle="Awaiting action" icon={Clock3} tone="bg-amber-50 text-amber-600" />
        <SummaryCard title="In Production" value={summary.inProductionOrders || counts["In Production"]} subtitle="Active work" icon={PackageCheck} tone="bg-indigo-50 text-indigo-600" />
        <SummaryCard title="Shipped" value={summary.shippedOrders || counts.Shipped} subtitle="Ready to process" icon={CheckCircle2} tone="bg-violet-50 text-violet-600" />
        <SummaryCard title="Delivered" value={summary.deliveredOrders || counts.Delivered} subtitle="Completed" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600" />
        <SummaryCard title="Cancelled" value={summary.cancelledOrders || counts.Cancelled} subtitle="Rejected" icon={X} tone="bg-red-50 text-red-600" />
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 pt-3 sm:px-5">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`whitespace-nowrap border-b-2 px-2 py-2.5 text-[11px] font-semibold transition sm:px-3 ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
              >
                {tab}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                  {tab === "All Orders" ? orders.length : counts[tab] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Order list</h2>
            <p className="mt-1 text-[11px] text-slate-400">Review customer requests and production progress.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search orders</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search by Order ID, customer or product..."
                className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </label>

            <div className="relative">
              <button type="button" onClick={() => setFilterOpen((open) => !open)} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 sm:w-auto">
                <Filter size={14} /> Filter <ChevronDown size={13} />
              </button>

              {filterOpen ? (
                <div className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                  {["All statuses", ...tabs.filter((tab) => tab !== "All Orders")].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFilterStatus(status);
                        setFilterOpen(false);
                        setPage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs ${filterStatus === status ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Search size={21} /></span>
            <p className="mt-4 text-sm font-semibold text-slate-700">No orders yet</p>
            <p className="mt-1 text-xs text-slate-400">Orders assigned to your supplier account will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Order ID</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Product(s)</th>
                  <th className="px-3 py-3 font-medium">Quantity</th>
                  <th className="px-3 py-3 font-medium">Order date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const status = formatStatus(order.status);
                  return (
                    <tr key={order._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-4 text-xs font-semibold text-blue-600">{order._id}</td>
                      <td className="px-3 py-4">
                        <p className="text-xs font-semibold text-slate-800">{order.customer?.username || "Customer"}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{order.customer?.email || "No email"}</p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-xs font-medium text-slate-700">{order.bottleType || "Bottle Order"}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{order.quantity || 0} units</p>
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-600">{Number(order.quantity || 0).toLocaleString()}</td>
                      <td className="px-3 py-4 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="px-3 py-4"><StatusBadge status={status} /></td>
                      <td className="px-3 py-4 text-xs font-semibold text-slate-800">?{Number(order.pricing?.total || 0).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button type="button" onClick={() => handleViewDetails(order._id)} className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={detailsLoading}>
                            <Eye size={12} /> View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>Showing {rangeStart} to {rangeEnd} of {filteredOrders.length} orders</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft size={13} /> Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                className={`h-7 min-w-7 rounded-md px-2 text-[11px] font-semibold ${safePage === number ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {number}
              </button>
            ))}
            <button type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {selectedOrder ? (
        <SupplierOrderDetails
          orderId={selectedOrder._id}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={updateOrderInList}
          token={token}
        />
      ) : null}
    </div>
  );
}
