import { createElement, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminFetch } from "../utils/adminAuth";
import AdminSupplierDetails from "../components/AdminSupplierDetails";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Users,
  X,
  FileText,
  Eye,
  UserRound,
  LayoutDashboard,
  Package,
  Store,
  BarChart3,
  Settings,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name = "") => {
  const trimmed = name.trim();
  if (!trimmed) return "A";
  const parts = trimmed.split(/\s+/).filter(Boolean);
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

const getHeaders = (token, includeJson = true) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    pendingRequests: 0,
    approvedSuppliers: 0,
    removedSuppliers: 0,
  });
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const role = decodeJwtRole(token);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { replace: true, state: { message: "Please sign in to continue." } });
      return;
    }

    if (role !== "admin") {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardRes, requestsRes, suppliersRes] = await Promise.all([
          adminFetch(`${API_BASE}/api/admin/dashboard`, { headers: getHeaders(token) }, navigate),
          adminFetch(`${API_BASE}/api/admin/supplier-requests`, { headers: getHeaders(token) }, navigate),
          adminFetch(`${API_BASE}/api/admin/suppliers`, { headers: getHeaders(token) }, navigate),
        ]);

        const dashboardData = await dashboardRes.json().catch(() => ({}));
        const requestsData = await requestsRes.json().catch(() => ({}));
        const suppliersData = await suppliersRes.json().catch(() => ({}));

        if (!dashboardRes.ok || !requestsRes.ok || !suppliersRes.ok) {
          throw new Error(
            dashboardData.message || requestsData.message || suppliersData.message || "Unable to load admin data"
          );
        }

        setStats({
          totalSuppliers: Number(dashboardData.totalSuppliers || 0),
          pendingRequests: Number(dashboardData.pendingRequests || 0),
          approvedSuppliers: Number(dashboardData.approvedSuppliers || 0),
          removedSuppliers: Number(dashboardData.removedSuppliers || 0),
        });
        setPendingSuppliers(Array.isArray(requestsData.suppliers) ? requestsData.suppliers : []);
        setSuppliers(Array.isArray(suppliersData.suppliers) ? suppliersData.suppliers : []);
      } catch (loadError) {
        setError(loadError.message || "Unable to fetch admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, role, token]);

  const filteredPending = useMemo(() => {
    return pendingSuppliers.filter((supplier) => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      const haystack = [
        supplier.name,
        supplier.ownerName,
        supplier.businessEmail,
        supplier.companyName,
        supplier.phoneNumber,
        supplier.city,
        supplier.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [pendingSuppliers, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const term = supplierSearchTerm.toLowerCase();
      if (!term) return true;
      const haystack = [
        supplier.companyName,
        supplier.ownerName,
        supplier.businessEmail,
        supplier.phoneNumber,
        supplier.city,
        supplier.state,
        supplier.approvalStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [suppliers, supplierSearchTerm]);

  const handleAction = async (endpoint, method, id, successMessage) => {
    if (!token) return;
    const confirmed = window.confirm(successMessage);
    if (!confirmed) return;

    setActioningId(id);
    try {
      const response = await adminFetch(`${API_BASE}${endpoint}`, {
        method,
        headers: getHeaders(token),
      }, navigate);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Request failed");
      }

      const refreshed = await adminFetch(`${API_BASE}/api/admin/dashboard`, { headers: getHeaders(token) }, navigate);
      const dashboardData = await refreshed.json().catch(() => ({}));
      if (refreshed.ok) {
        setStats({
          totalSuppliers: Number(dashboardData.totalSuppliers || 0),
          pendingRequests: Number(dashboardData.pendingRequests || 0),
          approvedSuppliers: Number(dashboardData.approvedSuppliers || 0),
          removedSuppliers: Number(dashboardData.removedSuppliers || 0),
        });
      }

      const requestsResponse = await fetch(`${API_BASE}/api/admin/supplier-requests`, { headers: getHeaders(token) });
      const requestPayload = await requestsResponse.json().catch(() => ({}));
      if (requestsResponse.ok) {
        setPendingSuppliers(Array.isArray(requestPayload.suppliers) ? requestPayload.suppliers : []);
      }

      const suppliersResponse = await fetch(`${API_BASE}/api/admin/suppliers`, { headers: getHeaders(token) });
      const supplierPayload = await suppliersResponse.json().catch(() => ({}));
      if (suppliersResponse.ok) {
        setSuppliers(Array.isArray(supplierPayload.suppliers) ? supplierPayload.suppliers : []);
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to complete action");
    } finally {
      setActioningId(null);
    }
  };

  const handleApprove = (supplierId) => {
    handleAction(`/api/admin/supplier-requests/${supplierId}/approve`, "PATCH", supplierId, "Approve Supplier?");
  };

  const handleReject = (supplierId) => {
    handleAction(`/api/admin/supplier-requests/${supplierId}/reject`, "PATCH", supplierId, "Reject Supplier?");
  };

  const handleRemove = (supplierId) => {
    handleAction(`/api/admin/suppliers/${supplierId}/remove`, "PATCH", supplierId, "Remove Supplier?");
  };

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-3 text-sm text-slate-600">This admin area is restricted to authenticated AquaBrand administrators.</p>
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
                {label === "Supplier Requests" && stats.pendingRequests > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {stats.pendingRequests}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
              {getInitials(user?.username || user?.email || "Admin")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.username || "Admin"}</p>
              <p className="truncate text-[11px] text-slate-300">{user?.email || "admin@aquabrand.com"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/admin/login", { replace: true });
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 lg:p-7">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden">
              <ChevronDown size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button type="button" className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {stats.pendingRequests}
              </span>
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

        <section className="mt-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back, Admin 👋</h1>
              <p className="mt-2 text-sm text-slate-600">Manage supplier requests, view suppliers, and grow your network.</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">Clear Water <span className="font-semibold">Stronger Partnerships</span></div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Suppliers", value: stats.totalSuppliers, tone: "sky", icon: Users, note: "2 this month" },
              { label: "Pending Requests", value: stats.pendingRequests, tone: "amber", icon: Clock3, note: "Needs review" },
              { label: "Approved Suppliers", value: stats.approvedSuppliers, tone: "green", icon: CheckCircle2, note: "Active" },
              { label: "Removed Suppliers", value: stats.removedSuppliers, tone: "red", icon: Trash2, note: "Total removed" },
            ].map(({ label, value, tone, icon, note }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone === "sky" ? "bg-sky-100 text-sky-600" : tone === "amber" ? "bg-amber-100 text-amber-600" : tone === "green" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                    {createElement(icon, { size: 20 })}
                  </div>
                </div>
                <div className="mt-5 text-3xl font-bold text-slate-900">{value}</div>
                <div className="mt-1 text-sm text-slate-600">{label}</div>
                <div className="mt-3 text-xs text-slate-400">{note}</div>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Pending Supplier Requests</h2>
              <p className="text-sm text-slate-500">Review and approve supplier registration requests</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email or company..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600">
                <Filter size={16} />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Supplier Details</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Requested On</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">
                      Loading supplier requests...
                    </td>
                  </tr>
                ) : filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">
                      No pending supplier requests found.
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((supplier, index) => (
                    <tr key={supplier._id || supplier.id} className="border-t border-slate-200 text-sm text-slate-800">
                      <td className="px-4 py-4">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                            {getInitials(supplier.ownerName || supplier.name || supplier.companyName || "Supplier")}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{supplier.ownerName || supplier.name || "Supplier"}</p>
                            <p className="text-xs text-slate-500">{supplier.businessEmail || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700">{supplier.companyName || "—"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>{supplier.phoneNumber || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{supplier.city || "—"}, {supplier.state || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedSupplier(supplier)}
                          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-100"
                        >
                          View Details
                        </button>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(supplier.requestedAt || supplier.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actioningId === (supplier._id || supplier.id)}
                            onClick={() => handleApprove(supplier._id || supplier.id)}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actioningId === (supplier._id || supplier.id)}
                            onClick={() => handleReject(supplier._id || supplier.id)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Suppliers List</h2>
              <p className="text-sm text-slate-500">All approved suppliers on your platform</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={supplierSearchTerm}
                  onChange={(event) => setSupplierSearchTerm(event.target.value)}
                  placeholder="Search suppliers..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600">
                <Filter size={16} />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Supplier Details</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Joined On</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">
                      No approved suppliers found.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier, index) => (
                    <tr key={supplier._id || supplier.id} className="border-t border-slate-200 text-sm text-slate-800">
                      <td className="px-4 py-4">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                            {getInitials(supplier.ownerName || supplier.companyName || "Supplier")}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{supplier.ownerName || "Supplier"}</p>
                            <p className="text-xs text-slate-500">{supplier.businessEmail || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700">{supplier.companyName || "—"}</td>
                      <td className="px-4 py-4 text-slate-600">{supplier.phoneNumber || "—"}</td>
                      <td className="px-4 py-4 text-slate-600">{supplier.city || "—"}, {supplier.state || "—"}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(supplier.approvedAt || supplier.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {supplier.approvalStatus === "approved" ? "Active" : supplier.approvalStatus || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSupplier(supplier)}
                            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            disabled={actioningId === (supplier._id || supplier.id)}
                            onClick={() => handleRemove(supplier._id || supplier.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedSupplier ? (
        <AdminSupplierDetails
          supplierId={selectedSupplier._id || selectedSupplier.id}
          token={token}
          navigate={navigate}
          onClose={() => setSelectedSupplier(null)}
        />
      ) : null}
    </div>
  );
}
