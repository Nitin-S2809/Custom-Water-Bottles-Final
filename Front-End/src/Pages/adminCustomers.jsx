import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../utils/adminAuth';
import {
  BarChart3,
  Bell,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Search,
  Settings,
  ShieldAlert,
  Store,
  UserRound,
  Users,
  X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Supplier Requests', path: '/admin/supplier-requests', icon: Users },
  { label: 'Suppliers', path: '/admin/suppliers', icon: Store },
  { label: 'Orders', path: '/admin/orders', icon: Package },
  { label: 'Customers', path: '/admin/customers', icon: UserRound },
  { label: 'Products', path: '/admin/products', icon: FileText },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const decodeJwtRole = (token) => {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(normalized));
    return json.role || null;
  } catch {
    return null;
  }
};

const getInitials = (name = '') => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'A';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700',
};

const buildCsv = (customers) => {
  const header = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Orders', 'Joined Date', 'Status'];
  const rows = customers.map((customer) => [
    customer.username || 'N/A',
    customer.email || 'N/A',
    customer.phone || 'N/A',
    customer.companyName || 'N/A',
    customer.location || 'N/A',
    String(customer.orderCount || 0),
    formatDate(customer.createdAt),
    customer.status || 'N/A',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csv;
};

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuth();
  const role = decodeJwtRole(token);

  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0,
    blockedCustomers: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOptionsFor, setShowOptionsFor] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState({ username: '', email: '', password: '' });
  const [addStatus, setAddStatus] = useState({ type: '', message: '' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    pageSize: PAGE_SIZE,
  });

  const fetchCustomers = async (nextPage = page, nextSearch = search, nextStatus = statusFilter) => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const query = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
        search: nextSearch,
        status: nextStatus,
      });

      const response = await adminFetch(`${API_BASE}/api/admin/customers?${query.toString()}`, {
        headers: getHeaders(token),
      }, navigate);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load customers');
      }

      setCustomers(Array.isArray(payload.customers) ? payload.customers : []);
      setSummary({
        totalCustomers: Number(payload.summary?.totalCustomers || payload.totalCustomers || 0),
        activeCustomers: Number(payload.summary?.activeCustomers || 0),
        newThisMonth: Number(payload.summary?.newThisMonth || 0),
        blockedCustomers: Number(payload.summary?.blockedCustomers || 0),
      });
      setPagination({
        currentPage: Number(payload.pagination?.currentPage || nextPage || 1),
        totalPages: Number(payload.pagination?.totalPages || 1),
        totalCustomers: Number(payload.pagination?.totalCustomers || payload.totalCustomers || 0),
        hasNextPage: Boolean(payload.pagination?.hasNextPage),
        hasPreviousPage: Boolean(payload.pagination?.hasPreviousPage),
        pageSize: Number(payload.pagination?.pageSize || PAGE_SIZE),
      });
    } catch (loadError) {
      setError(loadError.message || 'Unable to load customer data');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true, state: { message: 'Please sign in to continue.' } });
      return;
    }

    if (role !== 'admin') return;

    fetchCustomers(page, search, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role, navigate]);

  useEffect(() => {
    if (!token || role !== 'admin') return;
    setPage(1);
    fetchCustomers(1, search, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleViewCustomer = async (customerId) => {
    if (!token || !customerId) return;

    try {
      setLoading(true);
      const response = await adminFetch(`${API_BASE}/api/admin/customers/${customerId}`, {
        headers: getHeaders(token),
      }, navigate);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load customer details');
      }

      setSelectedCustomer(payload.customer || null);
      setShowOptionsFor(null);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!token || !customerId) return;
    const confirmed = window.confirm('Delete this customer and all related orders? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await adminFetch(`${API_BASE}/api/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: getHeaders(token),
      }, navigate);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete customer');
      }

      setShowOptionsFor(null);
      setSelectedCustomer(null);
      await fetchCustomers(page, search, statusFilter);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (event) => {
    event.preventDefault();
    if (!token) return;

    try {
      setAddStatus({ type: 'loading', message: 'Creating customer...' });
      const response = await adminFetch(`${API_BASE}/api/admin/customers`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(addCustomerForm),
      }, navigate);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to add customer');
      }

      setIsAddCustomerOpen(false);
      setAddCustomerForm({ username: '', email: '', password: '' });
      setAddStatus({ type: 'success', message: 'Customer added successfully.' });
      await fetchCustomers(1, search, statusFilter);
    } catch (addError) {
      setAddStatus({ type: 'error', message: addError.message || 'Unable to add customer' });
    }
  };

  const handleExport = () => {
    const csv = buildCsv(customers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aquabrand-customers.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-3 text-sm text-slate-600">This admin area is restricted to authenticated AquaBrand administrators.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/login', { replace: true })}
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
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${location.pathname === item.path ? 'bg-sky-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/admin/login', { replace: true });
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-5 lg:p-7">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner sm:gap-4">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search customers by name, email, company..."
            />
          </div>

          <div className="flex items-center gap-3 pl-4 sm:gap-4">
            <button type="button" className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">2</span>
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                {getInitials(user?.username || 'Admin')}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.username || 'Admin'}</p>
                <p className="text-[11px] text-slate-500">Admin</p>
              </div>
              <ChevronDown size={15} className="text-slate-500" />
            </div>
          </div>
        </header>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Customers</h1>
            <p className="mt-2 text-slate-600">View and manage all registered customers on AquaBrand.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            + Add Customer
          </button>
        </div>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><UserRound size={20} /></div>
            </div>
            <div className="mt-5 text-3xl font-bold text-slate-900">{summary.totalCustomers}</div>
            <p className="mt-1 text-sm text-slate-500">Total Customers</p>
            <p className="mt-3 text-xs text-slate-400">All registered customers</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Users size={20} /></div>
            </div>
            <div className="mt-5 text-3xl font-bold text-slate-900">{summary.activeCustomers}</div>
            <p className="mt-1 text-sm text-slate-500">Active Customers</p>
            <p className="mt-3 text-xs text-slate-400">Currently active</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><BarChart3 size={20} /></div>
            </div>
            <div className="mt-5 text-3xl font-bold text-slate-900">{summary.newThisMonth}</div>
            <p className="mt-1 text-sm text-slate-500">New This Month</p>
            <p className="mt-3 text-xs text-slate-400">Joined this month</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600"><X size={20} /></div>
            </div>
            <div className="mt-5 text-3xl font-bold text-slate-900">{summary.blockedCustomers}</div>
            <p className="mt-1 text-sm text-slate-500">Blocked Customers</p>
            <p className="mt-3 text-xs text-slate-400">Suspended accounts</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">All Customers</h2>
              <p className="text-sm text-slate-500">View, search and manage customer accounts</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download size={16} />
                Export
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Filter size={16} />
                Filter
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['all', 'active', 'inactive', 'blocked'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${statusFilter === status ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <button type="button" onClick={() => fetchCustomers(page, search, statusFilter)} className="ml-3 font-semibold underline">Retry</button>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 flex min-h-[220px] items-center justify-center text-sm text-slate-500">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="mt-5 flex min-h-[220px] items-center justify-center text-center text-sm text-slate-500">
              {search || statusFilter !== 'all' ? 'No customers match your search or filter.' : 'No customers found.'}
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full table-auto border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Company Name</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Orders</th>
                    <th className="px-3 py-2">Joined On</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id || customer.email || index} className="rounded-2xl bg-slate-50 text-sm text-slate-700 shadow-sm">
                      <td className="rounded-l-2xl px-3 py-4 text-slate-500">{(pagination.currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                            {getInitials(customer.username)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{customer.username || 'N/A'}</div>
                            <div className="mt-1 text-xs text-slate-500">{customer.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{customer.companyName || 'N/A'}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={13} className="text-slate-400" />
                          <span>{customer.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{customer.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{customer.orderCount ?? 0}</td>
                      <td className="px-3 py-4 text-slate-600">{formatDate(customer.createdAt)}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[customer.status] || 'bg-slate-200 text-slate-600'}`}>
                          {customer.status || 'active'}
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-3 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewCustomer(customer.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowOptionsFor(showOptionsFor === customer.id ? null : customer.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              aria-label="More options"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {showOptionsFor === customer.id ? (
                              <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                                <button type="button" onClick={() => handleViewCustomer(customer.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                                  <Eye size={14} />
                                  View customer
                                </button>
                                <button type="button" onClick={() => handleDeleteCustomer(customer.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                  <X size={14} />
                                  Delete customer
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-sm text-slate-500">
              Showing {customers.length ? (pagination.currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(pagination.currentPage * PAGE_SIZE, pagination.totalCustomers || customers.length)} of {pagination.totalCustomers || customers.length} customers
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  setPage(next);
                  fetchCustomers(next, search, statusFilter);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {'<'}
              </button>
              <button type="button" className="min-w-10 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white">
                {pagination.currentPage}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchCustomers(next, search, statusFilter);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {'>'}
              </button>
            </div>
          </div>
        </section>
      </main>

      {selectedCustomer ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Customer Details</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{selectedCustomer.username || 'N/A'}</h3>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><Mail size={16} />Email</div>
                <p className="mt-2 font-medium text-slate-800">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><Phone size={16} />Phone</div>
                <p className="mt-2 font-medium text-slate-800">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><Store size={16} />Company</div>
                <p className="mt-2 font-medium text-slate-800">{selectedCustomer.companyName || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><MapPin size={16} />Location</div>
                <p className="mt-2 font-medium text-slate-800">{selectedCustomer.location || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><Package size={16} />Orders</div>
                <p className="mt-2 font-medium text-slate-800">{selectedCustomer.orderCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><CalendarIcon />Joined</div>
                <p className="mt-2 font-medium text-slate-800">{formatDate(selectedCustomer.createdAt)}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm text-slate-600">Status</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[selectedCustomer.status] || 'bg-slate-200 text-slate-600'}`}>
                {selectedCustomer.status || 'active'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {isAddCustomerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Add Customer</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Create a customer</h3>
              </div>
              <button type="button" onClick={() => setIsAddCustomerOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <input
                  value={addCustomerForm.username}
                  onChange={(event) => setAddCustomerForm((prev) => ({ ...prev, username: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={addCustomerForm.email}
                  onChange={(event) => setAddCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={addCustomerForm.password}
                  onChange={(event) => setAddCustomerForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              {addStatus.message ? (
                <div className={`rounded-xl px-3 py-2 text-sm ${addStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : addStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-sky-50 text-sky-700'}`}>
                  {addStatus.message}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddCustomerOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                  Save customer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
