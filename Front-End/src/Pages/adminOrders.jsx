import { createElement, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminFetch } from "../utils/adminAuth";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarRange,
  Download,
  Eye,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Settings,
  ShieldAlert,
  Store,
  UserRound,
  Users,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const ORDER_STATUS_OPTIONS = [
  "pending",
  "accepted",
  "in-production",
  "ready",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "captured"];

const adminNavItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Supplier Requests", path: "/admin/supplier-requests", icon: Users },
  { label: "Suppliers", path: "/admin/suppliers", icon: Store },
  { label: "Orders", path: "/admin/orders", icon: Package },
  { label: "Customers", path: "/admin/customers", icon: UserRound },
  { label: "Products", path: "/admin/products", icon: FileText },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const decodeJwtRole = (token) => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    return json.role || null;
  } catch {
    return null;
  }
};

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const getInitials = (name = "") => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "A";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatusLabel = (value) => {
  const status = String(value || "pending").trim();
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "delivered") return "bg-emerald-100 text-emerald-700";
  if (["cancelled", "failed"].includes(normalized)) return "bg-red-100 text-red-700";
  if (["accepted", "in-production", "ready", "shipped", "out-for-delivery"].includes(normalized)) return "bg-blue-100 text-blue-700";
  if (normalized === "pending") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const getPaymentBadgeClass = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (["paid", "captured"].includes(normalized)) return "bg-emerald-100 text-emerald-700";
  if (normalized === "failed") return "bg-red-100 text-red-700";
  if (normalized === "pending") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const getDateRangeParams = (dateFilter, customStart, customEnd) => {
  const now = new Date();
  const format = (date) => date.toISOString().split("T")[0];

  if (dateFilter === "today") {
    return { startDate: format(now), endDate: format(now) };
  }

  if (dateFilter === "7d") {
    const past = new Date(now);
    past.setDate(now.getDate() - 6);
    return { startDate: format(past), endDate: format(now) };
  }

  if (dateFilter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: format(start), endDate: format(now) };
  }

  if (dateFilter === "custom") {
    return {
      startDate: customStart || "",
      endDate: customEnd || "",
    };
  }

  return { startDate: "", endDate: "" };
};

const buildCsv = (orders) => {
  const header = [
    "Order ID",
    "Customer",
    "Email",
    "Phone",
    "Product",
    "Quantity",
    "Amount",
    "Payment Status",
    "Order Status",
    "Location",
    "Order Date",
  ];

  const rows = orders.map((order) => [
    order.orderId || "",
    order.customer?.name || "",
    order.customer?.email || "",
    order.customer?.phone || "",
    order.productName || "",
    String(order.quantity || 0),
    String(order.amount || 0),
    order.paymentStatus || "pending",
    order.status || "pending",
    order.deliveryLocation || "",
    formatDate(order.createdAt),
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const role = useMemo(() => decodeJwtRole(token), [token]);

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    pageSize: PAGE_SIZE,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { replace: true, state: { message: "Please sign in to continue." } });
      return;
    }

    if (role !== "admin") {
      return;
    }

    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const { startDate, endDate } = getDateRangeParams(dateFilter, customStartDate, customEndDate);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          search,
          status: statusFilter,
          paymentStatus: paymentFilter,
          sortBy,
          sortOrder: "desc",
        });

        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const [ordersRes, statsRes] = await Promise.all([
          adminFetch(`${API_BASE}/api/admin/orders?${params.toString()}`, {
            headers: getHeaders(token),
            signal: controller.signal,
          }, navigate),
          adminFetch(`${API_BASE}/api/admin/orders/stats?${params.toString()}`, {
            headers: getHeaders(token),
            signal: controller.signal,
          }, navigate),
        ]);

        const ordersData = await ordersRes.json().catch(() => ({}));
        const statsData = await statsRes.json().catch(() => ({}));

        if (!ordersRes.ok) {
          throw new Error(ordersData.message || "Unable to load orders.");
        }

        if (!statsRes.ok) {
          throw new Error(statsData.message || "Unable to load order summary.");
        }

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setSummary(
          ordersData.summary && typeof ordersData.summary === "object"
            ? {
                totalOrders: Number(ordersData.summary.totalOrders || 0),
                pendingOrders: Number(ordersData.summary.pendingOrders || 0),
                processingOrders: Number(ordersData.summary.processingOrders || 0),
                deliveredOrders: Number(ordersData.summary.deliveredOrders || 0),
                cancelledOrders: Number(ordersData.summary.cancelledOrders || 0),
                totalRevenue: Number(ordersData.summary.totalRevenue || 0),
              }
            : {
                totalOrders: Number(statsData.summary?.totalOrders || 0),
                pendingOrders: Number(statsData.summary?.pendingOrders || 0),
                processingOrders: Number(statsData.summary?.processingOrders || 0),
                deliveredOrders: Number(statsData.summary?.deliveredOrders || 0),
                cancelledOrders: Number(statsData.summary?.cancelledOrders || 0),
                totalRevenue: Number(statsData.summary?.totalRevenue || 0),
              }
        );

        setPagination({
          currentPage: Number(ordersData.pagination?.currentPage || page),
          totalPages: Number(ordersData.pagination?.totalPages || 1),
          totalOrders: Number(ordersData.pagination?.totalOrders || ordersData.totalOrders || 0),
          pageSize: Number(ordersData.pagination?.pageSize || PAGE_SIZE),
          hasNextPage: Boolean(ordersData.pagination?.hasNextPage),
          hasPreviousPage: Boolean(ordersData.pagination?.hasPreviousPage),
        });
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError.message || "Unable to load orders.");
        setOrders([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => controller.abort();
  }, [token, role, navigate, search, statusFilter, paymentFilter, dateFilter, customStartDate, customEndDate, sortBy, page]);

  useEffect(() => {
    if (search || statusFilter !== "all" || paymentFilter !== "all" || dateFilter !== "all") {
      setPage(1);
    }
  }, [search, statusFilter, paymentFilter, dateFilter]);

  const activeSummary = useMemo(
    () => ({
      totalOrders: Number(summary.totalOrders || 0),
      pendingOrders: Number(summary.pendingOrders || 0),
      processingOrders: Number(summary.processingOrders || 0),
      deliveredOrders: Number(summary.deliveredOrders || 0),
      cancelledOrders: Number(summary.cancelledOrders || 0),
      totalRevenue: Number(summary.totalRevenue || 0),
    }),
    [summary]
  );

  const handleViewOrder = async (orderId) => {
    if (!token || !orderId) return;

    try {
      setDetailLoading(true);
      setNotice({ type: "", message: "" });

      const response = await adminFetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderId)}`, {
        headers: getHeaders(token),
      }, navigate);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load order details.");
      }

      setSelectedOrder(payload.order || null);
    } catch (loadError) {
      setNotice({ type: "error", message: loadError.message || "Unable to load order details." });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder?._id || !token) return;

    const nextStatus = document.getElementById("admin-order-status-select")?.value || selectedOrder.status;
    if (!nextStatus) return;

    try {
      setStatusSaving(true);
      const response = await adminFetch(`${API_BASE}/api/admin/orders/${selectedOrder._id}/status`, {
        method: "PATCH",
        headers: getHeaders(token),
        body: JSON.stringify({ status: nextStatus }),
      }, navigate);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Unable to update order status.");
      }

      setSelectedOrder((current) => ({ ...current, status: payload.order?.status || nextStatus }));
      setNotice({ type: "success", message: "Order status updated successfully." });
      setOrders((current) => current.map((order) => (String(order.orderId) === String(selectedOrder._id) ? { ...order, status: payload.order?.status || nextStatus } : order)));
    } catch (updateError) {
      setNotice({ type: "error", message: updateError.message || "Unable to update order status." });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleExport = async () => {
    if (!token) return;

    try {
      const { startDate, endDate } = getDateRangeParams(dateFilter, customStartDate, customEndDate);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        paymentStatus: paymentFilter,
      });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await adminFetch(`${API_BASE}/api/admin/orders/export?${params.toString()}`, {
        headers: getHeaders(token),
      }, navigate);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to export orders.");
      }

      const blob = await response.blob();
      const anchor = document.createElement("a");
      const href = URL.createObjectURL(blob);
      anchor.href = href;
      anchor.download = "aquabrand-orders.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch (exportError) {
      setNotice({ type: "error", message: exportError.message || "Unable to export orders." });
    }
  };

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-3 text-sm text-slate-600">This admin area is restricted to authenticated AquaBrand administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#eef3f8] text-slate-800">
      <aside className="hidden w-[260px] flex-col justify-between bg-[#0a1d2f] px-5 py-6 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-lg font-bold text-sky-700">A</div>
            <div>
              <p className="text-2xl font-bold">AquaBrand</p>
              <p className="text-xs text-slate-300">Admin Panel</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {adminNavItems.map(({ label, path, icon }) => (
              <NavLink
                key={label}
                to={path}
                end={path === "/admin/dashboard"}
                className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${isActive ? "bg-sky-500/20 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                {createElement(icon, { size: 18 })}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-5 lg:p-7">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">AquaBrand</p>
            <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button type="button" className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                {getInitials(user?.username || "Admin")}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.username || "Admin"}</p>
                <p className="text-[11px] text-slate-500">AquaBrand</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {[
            { label: "Total Orders", value: activeSummary.totalOrders },
            { label: "Pending Orders", value: activeSummary.pendingOrders },
            { label: "Processing Orders", value: activeSummary.processingOrders },
            { label: "Delivered Orders", value: activeSummary.deliveredOrders },
            { label: "Cancelled Orders", value: activeSummary.cancelledOrders },
            { label: "Total Revenue", value: formatCurrency(activeSummary.totalRevenue) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">All Orders</h2>
              <p className="text-sm text-slate-500">View and manage all customer orders</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full min-w-[220px] xl:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders, customers, order ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Filter size={15} className="text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none"
                >
                  <option value="all">All statuses</option>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{formatStatusLabel(status)}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Payment status</label>
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              >
                <option value="all">All payment states</option>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{formatStatusLabel(status)}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Date range</label>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="month">This month</option>
                <option value="custom">Custom date range</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Sort by</label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Custom dates</label>
              <div className="flex gap-2">
                <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none" />
                <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none" />
              </div>
            </div>
          </div>

          {notice.message ? (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
              {notice.message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-800">No orders found</h3>
              <p className="mt-2 text-sm text-slate-500">No orders match your search or filters.</p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Order ID</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Product / Bottle</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Payment</th>
                    <th className="px-3 py-2">Delivery Location</th>
                    <th className="px-3 py-2">Order Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.orderId || order._id || index} className="rounded-2xl bg-slate-50 text-sm text-slate-700 shadow-sm">
                      <td className="rounded-l-xl px-3 py-3 font-medium text-slate-500">{(pagination.currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{order.orderId ? String(order.orderId).slice(-8).toUpperCase() : "—"}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{order.customer?.name || "Unknown Customer"}</div>
                        <div className="text-xs text-slate-500">{order.customer?.email || "N/A"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{order.productName || "Custom Bottle"}</div>
                        <div className="text-xs text-slate-500">{order.brandName || "No brand name"}</div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">{order.quantity || 0}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{formatCurrency(order.amount)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPaymentBadgeClass(order.paymentStatus)}`}>
                          {formatStatusLabel(order.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{order.deliveryLocation || "Not specified"}</td>
                      <td className="px-3 py-3 text-slate-600">{formatDateOnly(order.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClass(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleViewOrder(order.orderId || order._id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && orders.length > 0 ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {(pagination.currentPage - 1) * PAGE_SIZE + 1}–{Math.min(pagination.currentPage * PAGE_SIZE, pagination.totalOrders)} of {pagination.totalOrders} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.max(1, pagination.totalPages) }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold ${pageNumber === pagination.currentPage ? "bg-sky-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!pagination.hasNextPage}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Order Details</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">#{selectedOrder.orderId ? String(selectedOrder.orderId).slice(-8).toUpperCase() : "—"}</h3>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="mt-6 animate-pulse space-y-3">
                <div className="h-12 rounded-xl bg-slate-100" />
                <div className="h-20 rounded-xl bg-slate-100" />
                <div className="h-32 rounded-xl bg-slate-100" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p className="text-lg font-bold text-slate-900">{selectedOrder.customer?.name || "Unknown Customer"}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {formatStatusLabel(selectedOrder.status)}
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Customer Information</h4>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="flex items-center gap-2"><UserRound size={15} className="text-slate-400" /><span>{selectedOrder.customer?.name || "Unknown Customer"}</span></div>
                      <div className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /><span>{selectedOrder.customer?.email || "N/A"}</span></div>
                      <div className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /><span>{selectedOrder.deliveryAddress?.phoneNumber || "N/A"}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Order Information</h4>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="flex justify-between gap-3"><span>Order date</span><span className="font-medium text-slate-900">{formatDate(selectedOrder.createdAt)}</span></div>
                      <div className="flex justify-between gap-3"><span>Order status</span><span className="font-medium text-slate-900">{formatStatusLabel(selectedOrder.status)}</span></div>
                      <div className="flex justify-between gap-3"><span>Payment status</span><span className="font-medium text-slate-900">{formatStatusLabel(selectedOrder.paymentStatus)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Products</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Bottle</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{selectedOrder.productName || "Custom Bottle"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Quantity</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{selectedOrder.quantity || 0}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Brand</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{selectedOrder.brandName || "N/A"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Printing</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{selectedOrder.printing || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Delivery Information</h4>
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 text-slate-400" /><span>{[selectedOrder.deliveryAddress?.addressLine1, selectedOrder.deliveryAddress?.addressLine2, selectedOrder.deliveryAddress?.city, selectedOrder.deliveryAddress?.state, selectedOrder.deliveryAddress?.pincode].filter(Boolean).join(", ") || "Not specified"}</span></div>
                      <p>{selectedOrder.deliveryAddress?.country || "N/A"}</p>
                      <p>{selectedOrder.deliveryAddress?.deliveryInstructions || "No delivery instructions"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Payment Information</h4>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="flex justify-between gap-3"><span>Method</span><span className="font-medium text-slate-900">{selectedOrder.paymentMethod || "N/A"}</span></div>
                      <div className="flex justify-between gap-3"><span>Payment ID</span><span className="font-medium text-slate-900">{selectedOrder.razorpayPaymentId || "N/A"}</span></div>
                      <div className="flex justify-between gap-3"><span>Amount paid</span><span className="font-medium text-slate-900">{formatCurrency(selectedOrder.amount || selectedOrder.pricing?.total)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Order Summary</h4>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between gap-3"><span>Subtotal</span><span className="font-medium text-slate-900">{formatCurrency(selectedOrder.subtotal || selectedOrder.pricing?.subtotal)}</span></div>
                    <div className="flex justify-between gap-3"><span>Shipping</span><span className="font-medium text-slate-900">{formatCurrency(selectedOrder.shipping || selectedOrder.pricing?.shipping)}</span></div>
                    <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(selectedOrder.amount || selectedOrder.pricing?.total)}</span></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Order Status</h4>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select id="admin-order-status-select" defaultValue={selectedOrder.status || "pending"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white sm:max-w-xs">
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{formatStatusLabel(status)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={statusSaving}
                      className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusSaving ? "Saving..." : "Update status"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
