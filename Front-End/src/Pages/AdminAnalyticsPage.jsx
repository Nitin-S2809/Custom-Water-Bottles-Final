import { createElement, useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminFetch } from "../utils/adminAuth";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

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

const rangeOptions = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
  { label: "All Time", value: "all" },
  { label: "Custom Range", value: "custom" },
];

const statusStyles = {
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200",
  shipped: "bg-violet-50 text-violet-700 ring-violet-200 border-violet-200",
  "out-for-delivery": "bg-purple-50 text-purple-700 ring-purple-200 border-purple-200",
  "in-production": "bg-indigo-50 text-indigo-700 ring-indigo-200 border-indigo-200",
  ready: "bg-cyan-50 text-cyan-700 ring-cyan-200 border-cyan-200",
  accepted: "bg-sky-50 text-sky-700 ring-sky-200 border-sky-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200",
};

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (val) => {
  if (!val) return "—";
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  const parts = String(name || "Admin").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

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

const buildAnalyticsCsv = (analyticsData) => {
  if (!analyticsData) return "";
  const lines = [];

  lines.push(["AQUABRAND ADMIN ANALYTICS REPORT"]);
  lines.push([
    "Date Range",
    `${analyticsData.dateRange?.start?.slice(0, 10) || ""} to ${analyticsData.dateRange?.end?.slice(0, 10) || ""}`,
  ]);
  lines.push([]);

  lines.push(["KEY PERFORMANCE INDICATORS"]);
  lines.push(["Metric", "Value"]);
  lines.push(["Total Revenue (INR)", analyticsData.summary?.totalRevenue || 0]);
  lines.push(["Total Orders", analyticsData.summary?.totalOrders || 0]);
  lines.push(["Average Order Value (INR)", analyticsData.summary?.averageOrderValue || 0]);
  lines.push(["Total Customers", analyticsData.summary?.totalCustomers || 0]);
  lines.push(["Approved Suppliers", analyticsData.summary?.totalSuppliers || 0]);
  lines.push(["Revenue Growth (%)", analyticsData.summary?.revenueGrowth || 0]);
  lines.push(["Order Growth (%)", analyticsData.summary?.orderGrowth || 0]);
  lines.push([]);

  lines.push(["DAILY TIME SERIES"]);
  lines.push(["Date", "Label", "Revenue (INR)", "Orders"]);
  (analyticsData.revenueSeries || []).forEach((rev, idx) => {
    const ord = (analyticsData.ordersSeries || [])[idx] || {};
    lines.push([rev.date, rev.label, rev.value, ord.value || 0]);
  });
  lines.push([]);

  lines.push(["TOP PRODUCTS / BOTTLE SIZES"]);
  lines.push(["Bottle Type", "Orders", "Quantity", "Revenue (INR)"]);
  (analyticsData.topProducts || []).forEach((prod) => {
    lines.push([prod.name, prod.orders, prod.quantity, prod.revenue]);
  });
  lines.push([]);

  lines.push(["TOP LOCATIONS"]);
  lines.push(["Location", "Orders", "Revenue (INR)"]);
  (analyticsData.topLocations || []).forEach((loc) => {
    lines.push([loc.name, loc.count, loc.revenue]);
  });
  lines.push([]);

  lines.push(["RECENT ORDERS"]);
  lines.push([
    "#",
    "Order ID",
    "Customer",
    "Email",
    "Product",
    "Quantity",
    "Amount (INR)",
    "Status",
    "Payment Status",
    "Date",
  ]);
  (analyticsData.recentOrders || []).forEach((ord) => {
    lines.push([
      ord.index || "",
      ord.id,
      ord.customer,
      ord.email,
      ord.product,
      ord.quantity,
      ord.amount,
      ord.status,
      ord.paymentStatus,
      ord.date ? new Date(ord.date).toLocaleDateString("en-IN") : "",
    ]);
  });

  return lines
    .map((row) => row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

// Reusable SVG Chart Component for Revenue & Orders
function AnalyticsTimeSeriesChart({ series = [], isCurrency = true, title = "Trend", activeColor = "#0284c7" }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!series || series.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-slate-400">
        No time-series data available for this range
      </div>
    );
  }

  const maxValue = Math.max(...series.map((p) => Number(p.value) || 0), 1);
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const points = series.map((point, index) => {
    const x =
      series.length === 1
        ? paddingLeft + innerWidth / 2
        : paddingLeft + (index * innerWidth) / (series.length - 1);
    const y = paddingTop + innerHeight - ((Number(point.value) || 0) / maxValue) * innerHeight;
    return { ...point, x, y };
  });

  const polylineCoords = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaCoords =
    points.length > 1
      ? `${points[0].x},${paddingTop + innerHeight} ${polylineCoords} ${points[points.length - 1].x},${paddingTop + innerHeight}`
      : "";

  const gridRatios = [0, 0.25, 0.5, 0.75, 1];

  // Pick evenly spaced x-axis labels to prevent clutter
  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="min-w-[640px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-[240px] w-full select-none"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {gridRatios.map((ratio) => {
            const y = paddingTop + innerHeight - ratio * innerHeight;
            const val = maxValue * ratio;
            const formatted = isCurrency
              ? val >= 1000
                ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`
                : `₹${Math.round(val)}`
              : Math.round(val);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  x2={chartWidth - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="500"
                >
                  {formatted}
                </text>
              </g>
            );
          })}

          {/* Bottom X-axis baseline */}
          <line
            x1={paddingLeft}
            x2={chartWidth - paddingRight}
            y1={paddingTop + innerHeight}
            y2={paddingTop + innerHeight}
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Area fill */}
          {areaCoords ? <polygon points={areaCoords} fill="url(#chartGradient)" /> : null}

          {/* Trend line */}
          {points.length > 1 ? (
            <polyline
              points={polylineCoords}
              fill="none"
              stroke={activeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Data Points and tooltips */}
          {points.map((pt, idx) => {
            const showLabel = idx % labelStep === 0 || idx === points.length - 1;
            const isHovered = hoveredPoint?.date === pt.date;

            return (
              <g
                key={pt.date || idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill="#ffffff"
                  stroke={activeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                {showLabel ? (
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {pt.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Hovered details box */}
        {hoveredPoint ? (
          <div className="mt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-1.5 text-xs text-sky-900 shadow-sm">
              <span className="font-semibold">{hoveredPoint.label}:</span>
              <span>{isCurrency ? formatCurrency(hoveredPoint.value) : `${hoveredPoint.value} orders`}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const role = decodeJwtRole(token);

  const [range, setRange] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartTab, setChartTab] = useState("revenue"); // "revenue" | "orders"

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchAnalytics = useCallback(
    async (rangeKey = range, start = customStart, end = customEnd) => {
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("range", rangeKey);
        if (rangeKey === "custom") {
          if (start) params.set("startDate", start);
          if (end) params.set("endDate", end);
        }

        const response = await adminFetch(`${API_BASE}/api/admin/analytics?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }, navigate);

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(json.message || "Unable to load analytics data. Please try again.");
        }

        setData(json);
      } catch (err) {
        setError(err.message || "Unable to load analytics data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [token, range, customStart, customEnd]
  );

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    fetchAnalytics(range, customStart, customEnd);
  }, [token, range, customStart, customEnd, fetchAnalytics, navigate]);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    if (newRange !== "custom") {
      fetchAnalytics(newRange, "", "");
    }
  };

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchAnalytics("custom", customStart, customEnd);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const csv = buildAnalyticsCsv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aquabrand-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (role && role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-3 text-sm text-slate-600">
            This admin area is restricted to authenticated AquaBrand administrators.
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/login", { replace: true })}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 font-medium text-white"
          >
            <LogOut size={16} />
            Go to login
          </button>
        </div>
      </div>
    );
  }

  // Safe KPI computations
  const summary = data?.summary || {};
  const statusBreakdown = Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const topLocations = Array.isArray(data?.topLocations) ? data.topLocations : [];
  const recentOrders = Array.isArray(data?.recentOrders) ? data.recentOrders : [];
  const revenueSeries = Array.isArray(data?.revenueSeries) ? data.revenueSeries : [];
  const ordersSeries = Array.isArray(data?.ordersSeries) ? data.ordersSeries : [];

  const maxProductRevenue = Math.max(...topProducts.map((p) => Number(p.revenue) || 0), 1);

  return (
    <div className="flex min-h-screen bg-[#eef3f8] text-slate-800">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col justify-between bg-[#0a1d2f] px-5 py-6 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold text-sky-700 shadow-sm">
              A
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">AquaBrand</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1.5">
            {adminNavItems.map(({ label, path, icon }) => (
              <NavLink
                key={label}
                to={path}
                end={path === "/admin/dashboard"}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-500/20 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
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
            navigate("/login", { replace: true });
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Mobile Sidebar Modal */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex w-72 flex-col justify-between bg-[#0a1d2f] p-6 text-white shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold text-sky-700">
                    A
                  </div>
                  <div>
                    <p className="text-xl font-bold">AquaBrand</p>
                    <p className="text-xs text-slate-400">Admin Panel</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-4 space-y-1.5">
                {adminNavItems.map(({ label, path, icon }) => (
                  <NavLink
                    key={label}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    end={path === "/admin/dashboard"}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                        isActive ? "bg-sky-500/20 text-white" : "text-slate-300 hover:bg-white/5"
                      }`
                    }
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
                navigate("/admin/admin/login", { replace: true });
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-200"
            >
              <LogOut size={16} />
              Logout
            </button>
          </aside>
        </div>
      ) : null}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">AquaBrand Admin</p>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Analytics Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-500" />
            </button>

            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700 shadow-sm">
                {getInitials(user?.username || "Admin")}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-900">
                  {user?.username || "Administrator"}
                </p>
                <p className="text-[11px] text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Analytics Hero / Toolbar */}
        <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Business Analytics</h2>
            <p className="mt-0.5 text-xs text-slate-500">Track your business performance and growth</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Range Selector */}
            <div className="relative">
              <select
                value={range}
                onChange={(e) => handleRangeChange(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {rangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              onClick={() => fetchAnalytics(range, customStart, customEnd)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-sky-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export Report Action */}
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f9ae8] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d8dd6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </section>

        {/* Custom Range Picker Drawer */}
        {range === "custom" ? (
          <form
            onSubmit={handleApplyCustomDates}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Apply Filter
            </button>
          </form>
        ) : null}

        {/* Error Alert */}
        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchAnalytics(range, customStart, customEnd)}
                className="mt-2 inline-flex items-center gap-1 font-bold underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {/* Summary Statistics Cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Revenue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Total Revenue</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <IndianRupee size={18} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-24 animate-pulse rounded bg-slate-200" />
              ) : (
                formatCurrency(summary.totalRevenue)
              )}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px]">
              {Number(summary.revenueGrowth) >= 0 ? (
                <span className="inline-flex items-center font-semibold text-emerald-600">
                  <ArrowUpRight size={13} />+{summary.revenueGrowth || 0}%
                </span>
              ) : (
                <span className="inline-flex items-center font-semibold text-rose-600">
                  <ArrowDownRight size={13} />
                  {summary.revenueGrowth}%
                </span>
              )}
              <span className="text-slate-400">vs previous period</span>
            </div>
          </div>

          {/* Total Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Total Orders</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ShoppingBag size={18} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                summary.totalOrders || 0
              )}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px]">
              {Number(summary.orderGrowth) >= 0 ? (
                <span className="inline-flex items-center font-semibold text-emerald-600">
                  <ArrowUpRight size={13} />+{summary.orderGrowth || 0}%
                </span>
              ) : (
                <span className="inline-flex items-center font-semibold text-rose-600">
                  <ArrowDownRight size={13} />
                  {summary.orderGrowth}%
                </span>
              )}
              <span className="text-slate-400">vs previous period</span>
            </div>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Avg. Order Value</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-20 animate-pulse rounded bg-slate-200" />
              ) : (
                formatCurrency(summary.averageOrderValue)
              )}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">Paid revenue / orders</p>
          </div>

          {/* Total Customers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Active Customers</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <UserRound size={18} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-200" />
              ) : (
                summary.totalCustomers || 0
              )}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">Excludes admin accounts</p>
          </div>

          {/* Approved Suppliers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Approved Suppliers</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Store size={18} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-200" />
              ) : (
                summary.totalSuppliers || 0
              )}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">Active & verified partners</p>
          </div>
        </section>

        {/* Charts Grid: Revenue/Orders Trend & Order Status Breakdown */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Time-Series Chart (2 cols on desktop) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {chartTab === "revenue" ? "Revenue Overview" : "Orders Overview"}
                </h3>
                <p className="text-xs text-slate-400">Performance trajectory for selected date range</p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setChartTab("revenue")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    chartTab === "revenue" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setChartTab("orders")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    chartTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
              </div>
            ) : chartTab === "revenue" ? (
              <AnalyticsTimeSeriesChart
                series={revenueSeries}
                isCurrency={true}
                title="Revenue Overview"
                activeColor="#0284c7"
              />
            ) : (
              <AnalyticsTimeSeriesChart
                series={ordersSeries}
                isCurrency={false}
                title="Orders Overview"
                activeColor="#6366f1"
              />
            )}
          </div>

          {/* Order Status Breakdown (1 col on desktop) */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Order Status Breakdown</h3>
              <p className="text-xs text-slate-400">Distribution across fulfillment stages</p>

              {/* Total Orders Indicator */}
              <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">Total Period Orders</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{summary.totalOrders || 0}</p>
              </div>

              {/* Status List */}
              <div className="mt-4 space-y-2.5">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-6 w-full animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : statusBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No orders recorded in this range</p>
                ) : (
                  statusBreakdown.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="capitalize text-slate-700">{item.label}</span>
                        <span className="text-slate-500">
                          {item.value} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-400">
              Real-time synchronization with AquaBrand database
            </p>
          </div>
        </section>

        {/* Top Products & Top Locations Grid */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products / Bottle Sizes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Product Sizes</h3>
                <p className="text-xs text-slate-400">Order volumes and revenue by bottle type</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {topProducts.length} Sizes
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No product sales in this period</div>
              ) : (
                topProducts.map((prod) => {
                  const percentOfMax = Math.round(((Number(prod.revenue) || 0) / maxProductRevenue) * 100);
                  return (
                    <div
                      key={prod.name}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
                            {prod.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {prod.orders} orders · {prod.quantity} bottles
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-900">{formatCurrency(prod.revenue)}</span>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-500"
                          style={{ width: `${percentOfMax}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Locations Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Geographic Distribution</h3>
                <p className="text-xs text-slate-400">Top delivery destinations from verified customer addresses</p>
              </div>
              <MapPin size={18} className="text-sky-600" />
            </div>

            <div className="mt-5 overflow-x-auto">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : topLocations.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No delivery address data available</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-semibold">Location</th>
                      <th className="pb-3 text-right font-semibold">Orders</th>
                      <th className="pb-3 text-right font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topLocations.map((loc) => (
                      <tr key={loc.name} className="transition hover:bg-slate-50/80">
                        <td className="py-3 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                            {loc.name}
                          </div>
                        </td>
                        <td className="py-3 text-right text-slate-600">{loc.count}</td>
                        <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(loc.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* Recent Orders Section */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-400">Latest transactions registered in the selected period</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 transition hover:text-sky-700"
            >
              <span>View All</span>
              <Eye size={14} />
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No orders recorded for this selected date range
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">#</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Product</th>
                    <th className="pb-3 font-semibold">Quantity</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Payment</th>
                    <th className="pb-3 text-right font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => {
                    const statusClass = statusStyles[ord.status?.toLowerCase()] || statusStyles.pending;
                    return (
                      <tr key={ord.id} className="transition hover:bg-slate-50/80">
                        <td className="py-3.5 font-medium text-slate-400">{ord.index}</td>
                        <td className="py-3.5">
                          <p className="font-semibold text-slate-900">{ord.customer}</p>
                          <p className="text-[11px] text-slate-400">{ord.email}</p>
                        </td>
                        <td className="py-3.5 font-medium text-slate-700">{ord.product}</td>
                        <td className="py-3.5 text-slate-600">{ord.quantity}</td>
                        <td className="py-3.5 font-bold text-slate-900">{formatCurrency(ord.amount)}</td>
                        <td className="py-3.5">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass}`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              ["paid", "captured"].includes(ord.paymentStatus?.toLowerCase())
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {ord.paymentStatus || "pending"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right text-slate-500">{formatDate(ord.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
