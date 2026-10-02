import { createElement, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SupplierProfile from "../Pages/supplierProfile";
import SupplierEarning from "../Pages/supplierEarning";
import SupplierSupport from "../Pages/supplierSupport";
import SupplierInvoice from "../Pages/supplierInvoice";
import SupplierNotification from "../Pages/supplierNotification";
import SupplierOrders from "../Pages/supplierOrders";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  Headphones,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  UserRound,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Orders", icon: ClipboardList, expandable: true },
  { label: "My Profile", icon: UserRound },
  { label: "Invoices & Payments", icon: FileText },
  { label: "Earnings", icon: TrendingUp },
  { label: "Notifications", icon: Bell, badge: "3" },
  { label: "Support", icon: Headphones },
];

const toneClasses = {
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-500",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-violet-50 text-violet-600",
};

const notificationIcons = {
  PackageCheck,
  ClipboardList,
  Wallet,
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-sm bg-sky-100 text-blue-700">
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-sky-500" />
        <span className="relative text-sm font-black">A</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-slate-900">AquaBrand</span>
    </div>
  );
}

function Sidebar({ isOpen, onClose, notificationCount }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between px-2">
        <Logo />
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation">
          <X size={20} />
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {navigationItems.map(({ label, icon: Icon, expandable }) => (
          <button key={label} type="button" onClick={() => label === "Dashboard" ? navigate("/supplierlandingpage") : label === "Orders" ? navigate("/supplier-orders") : label === "My Profile" ? navigate("/supplier-profile") : label === "Earnings" ? navigate("/supplier-earnings") : label === "Support" ? navigate("/supplier-support") : label === "Invoices & Payments" ? navigate("/supplier-invoices") : label === "Notifications" ? navigate("/supplier-notifications") : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-medium transition ${((label === "Dashboard" && location.pathname === "/supplierlandingpage") || (label === "Orders" && location.pathname === "/supplier-orders") || (label === "My Profile" && location.pathname === "/supplier-profile") || (label === "Earnings" && location.pathname === "/supplier-earnings") || (label === "Support" && location.pathname === "/supplier-support") || (label === "Invoices & Payments" && location.pathname === "/supplier-invoices") || (label === "Notifications" && location.pathname === "/supplier-notifications")) ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"}`}>
            {createElement(Icon, { size: 17, strokeWidth: 1.8 })}
            <span className="flex-1">{label}</span>
            {expandable ? <ChevronDown size={14} /> : null}
            {label === "Notifications" && notificationCount > 0 ? <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notificationCount}</span> : null}
          </button>
        ))}
      </nav>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800"><CircleHelp size={16} className="text-blue-600" /> Need Help?</div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Our supplier support team is ready to help you!</p>
        <button type="button" onClick={() => navigate("/supplier-support")} className="mt-3 w-full rounded-md border border-blue-500 bg-white py-2 text-[11px] font-semibold text-blue-600 hover:bg-blue-50">Contact Support</button>
      </div>
    </aside>
  );
}

function Header({ onMenuOpen, supplier, notificationCount }) {
  const navigate = useNavigate();

  return (
    <header className="flex min-h-[70px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <button type="button" onClick={onMenuOpen} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={21} /></button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4 sm:gap-6">
        <button type="button" onClick={() => navigate("/supplier-notifications")} className="relative text-slate-700 hover:text-blue-600" aria-label="Notifications" title="Notifications"><Bell size={19} />{notificationCount > 0 ? <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{notificationCount}</span> : null}</button>
        <button type="button" className="text-slate-700 hover:text-blue-600" aria-label="Messages"><MessageSquare size={19} /></button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden items-center gap-3 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">{supplier.companyName?.charAt(0)?.toUpperCase()}</div><div><p className="text-xs font-semibold text-slate-800">{supplier.companyName}</p><p className="mt-0.5 text-[10px] text-slate-500">Supplier ID: {supplier.id}</p></div><ChevronDown size={15} className="text-slate-600" /></div>
        <button type="button" onClick={() => navigate("/supplier-orders?status=pending")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-5"><span className="text-base leading-none">+</span> View New Orders</button>
      </div>
    </header>
  );
}

function StatCard({ card }) {
  const navigate = useNavigate();
  const Icon = card.icon;
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[card.tone]}`}><Icon size={19} /></div><div><p className="text-[11px] font-semibold text-slate-800">{card.label}</p><p className="mt-1 text-lg font-semibold text-slate-900">{card.value}</p><p className="mt-0.5 text-[10px] text-slate-500">{card.caption}</p></div></div><button type="button" onClick={() => navigate(card.path)} className="mt-3 flex items-center gap-1 pl-[52px] text-left text-[10px] font-medium text-blue-600 hover:text-blue-700">{card.link} <ChevronRight size={12} /></button></div>;
}

function StatusBadge({ status, tone }) {
  return <span className={`rounded-md px-2 py-1 text-[9px] font-medium ${toneClasses[tone]}`}>{status}</span>;
}

const formatOrderDate = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not available";

function IncomingOrdersSection({ orders, actionId, feedback, onAction }) {
  return <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-4 sm:px-5"><h2 className="text-sm font-bold text-slate-800">Incoming Orders</h2><p className="mt-1 text-[11px] text-slate-500">Paid orders waiting for supplier confirmation.</p></div>{feedback ? <p className={`mx-4 mt-4 rounded-md border px-3 py-2 text-xs ${feedback.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`} role="status">{feedback.text}</p> : null}<div className="grid gap-4 p-4 sm:p-5">{orders.length === 0 ? <div className="py-10 text-center text-xs text-slate-500">No pending orders are waiting for action.</div> : orders.map((order) => { const busy = actionId === String(order._id); const address = order.deliveryAddress; return <article key={order._id} className="rounded-lg border border-slate-200 p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Order {order._id}</p><h3 className="mt-1 text-sm font-bold text-slate-900">{order.customer?.username || "Customer"}</h3><p className="mt-1 text-[11px] text-slate-500">{formatOrderDate(order.createdAt)}</p></div><StatusBadge status={order.status} tone="orange" /></div><div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Bottle type</p><p className="mt-1 font-semibold text-slate-800">{order.bottleType}</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Quantity</p><p className="mt-1 font-semibold text-slate-800">{Number(order.quantity).toLocaleString()} bottles</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Order amount</p><p className="mt-1 font-semibold text-slate-800">₹{Number(order.pricing?.total || 0).toLocaleString("en-IN")}</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Delivery location</p><p className="mt-1 font-semibold text-slate-800">{address ? [address.city, address.state].filter(Boolean).join(", ") : "Not available"}</p></div></div>{order.specialInstructions ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-semibold text-slate-700">Customization:</span> {order.specialInstructions}</p> : null}<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => onAction(order._id, "cancelled")} disabled={busy} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50">{busy ? "Updating..." : "Reject Order"}</button><button type="button" onClick={() => onAction(order._id, "accepted")} disabled={busy} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50">{busy ? "Updating..." : "Accept Order"}</button></div></article>; })}</div></section>;
}

function OrdersTable({ orders = [], onViewAll }) {

  const formatOrderDate = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not available";

  function IncomingOrders({ orders, actionId, feedback, onAction }) {
    return <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:px-5"><h2 className="text-sm font-bold text-slate-800">Incoming Orders</h2><p className="text-[11px] text-slate-500">Paid orders waiting for supplier confirmation.</p></div>{feedback ? <p className={`mx-4 mt-4 rounded-md border px-3 py-2 text-xs ${feedback.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`} role="status">{feedback.text}</p> : null}<div className="grid gap-4 p-4 sm:p-5">{orders.length === 0 ? <div className="py-10 text-center text-xs text-slate-500">No pending orders are waiting for action.</div> : orders.map((order) => { const busy = actionId === String(order._id); const address = order.deliveryAddress; return <article key={order._id} className="rounded-lg border border-slate-200 p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Order {order._id}</p><h3 className="mt-1 text-sm font-bold text-slate-900">{order.customer?.username || "Customer"}</h3><p className="mt-1 text-[11px] text-slate-500">{formatOrderDate(order.createdAt)}</p></div><StatusBadge status={order.status} tone="orange" /></div><div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Bottle type</p><p className="mt-1 font-semibold text-slate-800">{order.bottleType}</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Quantity</p><p className="mt-1 font-semibold text-slate-800">{Number(order.quantity).toLocaleString()} bottles</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Order amount</p><p className="mt-1 font-semibold text-slate-800">₹{Number(order.pricing?.total || 0).toLocaleString("en-IN")}</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Delivery location</p><p className="mt-1 flex items-start gap-1 font-semibold text-slate-800"><MapPin size={13} className="mt-0.5 shrink-0 text-blue-600" />{address ? [address.city, address.state].filter(Boolean).join(", ") : "Not available"}</p></div></div>{order.specialInstructions ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-semibold text-slate-700">Customization:</span> {order.specialInstructions}</p> : null}<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => onAction(order._id, "cancelled")} disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"><XCircle size={14} />{busy ? "Updating..." : "Reject Order"}</button><button type="button" onClick={() => onAction(order._id, "accepted")} disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50"><Check size={14} />{busy ? "Updating..." : "Accept Order"}</button></div></article>; })}</div></section>;
  }
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-xs font-bold text-slate-800">Recent Orders</h2><button type="button" onClick={onViewAll} className="flex items-center gap-1 text-[10px] font-medium text-blue-600">View All Orders <ChevronRight size={12} /></button></div>{orders.length === 0 ? <p className="px-4 py-10 text-center text-xs text-slate-500">No orders yet</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] text-slate-400"><th className="px-4 py-2 font-medium">CLIENT</th><th className="px-2 py-2 font-medium">QUANTITY</th><th className="px-2 py-2 font-medium">STATUS</th><th className="px-2 py-2 font-medium">PRICE</th><th className="px-4 py-2 font-medium">DATE</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{order.bottleType?.charAt(0)?.toUpperCase()}</div><div><p className="text-[10px] font-semibold text-slate-800">Customer order</p><p className="text-[9px] text-slate-400">Order ID: {order._id}</p></div></div></td><td className="px-2 py-3"><p className="text-[10px] font-semibold text-slate-700">{Number(order.quantity).toLocaleString()} Bottles</p><p className="text-[9px] text-slate-400">{order.bottleType}</p></td><td className="px-2 py-3"><StatusBadge status={order.status} tone={order.status === "delivered" ? "green" : "orange"} /></td><td className="px-2 py-3"><p className="text-[10px] font-semibold text-slate-800">₹{Number(order.pricing?.total || 0).toLocaleString()}</p></td><td className="px-4 py-3 text-right"><p className="text-[9px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p></td></tr>)}</tbody></table></div>}</section>;
}

function NotificationsPanel({ notifications = [], onViewAll }) {
  return <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-xs font-bold text-slate-800">Notifications</h2><button type="button" onClick={onViewAll} className="flex items-center gap-1 text-[10px] font-medium text-blue-600">View All <ChevronRight size={12} /></button></div><div className="px-4">{notifications.length === 0 ? <p className="py-10 text-center text-xs text-slate-500">No notifications yet</p> : notifications.map(({ title, message, time, icon, tone }, index) => { const NotificationIcon = notificationIcons[icon] || Bell; return <div key={`${title}-${index}`} className={`flex gap-2 py-3 ${index < notifications.length - 1 ? "border-b border-slate-100" : ""}`}><span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>{createElement(NotificationIcon, { size: 12 })}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold leading-snug text-slate-700">{title}</p>{message ? <p className="mt-1 text-[9px] text-slate-400">{message}</p> : null}</div><span className="shrink-0 text-[9px] text-slate-400">{time}</span></div>; })}</div></section>;
}

function MiniChart({ color = "#1664f5", points = "0,45 30,25 55,33 83,5" }) {
  return <svg viewBox="0 0 90 55" className="h-14 w-24" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2" /><polyline points={`0,54 0,${points.split(" ")[0].split(",")[1]} ${points}`} fill="url(#chartFill)" opacity="0.08" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor="#ffffff" /></linearGradient></defs></svg>;
}

/* function LegacyPerformanceOverview() {
  return <section className="grid gap-4 xl:grid-cols-[1fr_250px]"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-3 text-xs font-bold text-slate-800">Performance Overview</h2><div className="grid gap-3 md:grid-cols-3"><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] text-slate-500">This Month’s Revenue</p><p className="mt-2 text-base font-semibold text-slate-800">₹1,25,000</p><p className="mt-1 text-[9px] text-emerald-600">↑ 18.5% <span className="text-slate-400">from last month</span></p></div><MiniChart /></div><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] text-slate-500">Orders Completed</p><p className="mt-2 text-base font-semibold text-slate-800">24</p><p className="mt-1 text-[9px] text-emerald-600">↑ 20% <span className="text-slate-400">from last month</span></p></div><MiniChart color="#16a34a" points="0,43 28,26 55,33 83,8" /></div><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] text-slate-500">Customer Rating</p><p className="mt-2 text-base font-semibold text-slate-800">4.8 / 5</p><div className="mt-1 text-sm tracking-tight text-amber-400">★★★★★</div><p className="text-[9px] text-slate-400">Based on 88 reviews</p></div><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm text-white">★</div></div></div></div><div className="rounded-lg bg-blue-50 p-5"><div className="flex items-start justify-between"><div><h2 className="text-xs font-bold text-slate-800">Grow Your Business</h2><p className="mt-3 max-w-[150px] text-[10px] leading-relaxed text-slate-600">Keep your profile updated and increase your capacity to get more orders.</p></div><TrendingUp className="text-blue-600" size={30} /></div><button type="button" className="mt-4 rounded-md bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-blue-700">Update Now</button></div></section>;
*/
function PerformanceOverview({ stats }) {
  return <section className="grid gap-4 xl:grid-cols-[1fr_250px]"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-3 text-xs font-bold text-slate-800">Performance Overview</h2><div className="grid gap-3 md:grid-cols-3"><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] text-slate-500">Total Revenue</p><p className="mt-2 text-base font-semibold text-slate-800">₹{Number(stats.totalEarnings).toLocaleString()}</p><p className="mt-1 text-[9px] text-slate-400">From completed orders</p></div><MiniChart /></div><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] text-slate-500">Orders Completed</p><p className="mt-2 text-base font-semibold text-slate-800">{stats.completedOrders}</p><p className="mt-1 text-[9px] text-slate-400">Delivered orders</p></div><MiniChart color="#16a34a" points="0,43 28,26 55,33 83,8" /></div><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] text-slate-500">Customer Rating</p><p className="mt-2 text-base font-semibold text-slate-800">Not available</p><p className="text-[9px] text-slate-400">No ratings yet</p></div><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm text-white">★</div></div></div></div><div className="rounded-lg bg-blue-50 p-5"><div className="flex items-start justify-between"><div><h2 className="text-xs font-bold text-slate-800">Grow Your Business</h2><p className="mt-3 max-w-[150px] text-[10px] leading-relaxed text-slate-600">Keep your profile updated and increase your capacity to get more orders.</p></div><TrendingUp className="text-blue-600" size={30} /></div><button type="button" className="mt-4 rounded-md bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-blue-700">Update Profile</button></div></section>;
}

function SupplierSettings() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    phoneNumber: "",
    city: "",
    state: "",
    productionCapacity: "",
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok && data?.supplier) {
          setForm({
            companyName: data.supplier.companyName || "",
            ownerName: data.supplier.ownerName || "",
            phoneNumber: data.supplier.phoneNumber || "",
            city: data.supplier.city || "",
            state: data.supplier.state || "",
            productionCapacity: data.supplier.productionCapacity || "",
          });
        }
      } catch (error) {
        console.error("Unable to load supplier settings", error);
      }
    };

    loadProfile();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setStatus({ type: "error", message: "Please sign in again to update your settings." });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save supplier settings");
      }

      setStatus({ type: "success", message: "Settings saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to save supplier settings" });
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Supplier Settings</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Business preferences</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-xs font-medium text-slate-600">
          Company name
          <input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-xs font-medium text-slate-600">
          Owner name
          <input value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-xs font-medium text-slate-600">
          Phone number
          <input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-xs font-medium text-slate-600">
          Production capacity
          <input value={form.productionCapacity} onChange={(event) => setForm((current) => ({ ...current, productionCapacity: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-xs font-medium text-slate-600">
          City
          <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-xs font-medium text-slate-600">
          State
          <input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500" />
        </label>

        <div className="md:col-span-2 flex flex-col items-start gap-3 pt-2">
          {status.message ? <p className={`rounded-md border px-3 py-2 text-xs ${status.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>{status.message}</p> : null}
          <button type="submit" className="rounded-md bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Save settings</button>
        </div>
      </form>
    </section>
  );
}

export default function SupplierLandingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionId, setActionId] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      if (!["/supplierlandingpage", "/supplier-orders", "/supplier-profile", "/supplier-earnings", "/supplier-support", "/supplier-invoices", "/supplier-notifications", "/supplier-settings"].includes(location.pathname)) {
        setError("Please sign in as a supplier to continue.");
        return;
      }

      if (!token) {
        setError("Session expired. Please login again.");
        navigate("/supplier-signin");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load supplier dashboard");
        }

        setDashboard(data);
        setNotificationCount(Array.isArray(data.notifications) ? data.notifications.filter((notification) => !notification.read).length : 0);
        setError("");
      } catch (dashboardError) {
        if (dashboardError.name !== "AbortError") {
          setError(dashboardError.message || "Unable to load supplier dashboard. Please try again.");
        }
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [location.pathname, refreshKey, token, navigate]);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-sm text-red-600">{error}</div>;
  }

  if (!dashboard) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">Loading...</div>;
  }

  const { supplier, stats, recentOrders, activeOrders = [], incomingOrders = [], notifications: dashboardNotifications } = dashboard;
  const orders = Array.isArray(recentOrders) ? recentOrders : [];
  const notifications = Array.isArray(dashboardNotifications) ? dashboardNotifications : [];
  const profileFields = [supplier.companyName, supplier.ownerName, supplier.businessEmail, supplier.phoneNumber, supplier.city, supplier.state, supplier.productionCapacity, supplier.gstNumber];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, caption: "All Orders", icon: ShoppingBag, tone: "blue", link: "View all", path: "/supplier-orders" },
    { label: "Pending Orders", value: stats.pendingOrders, caption: "Current Orders", icon: Package, tone: "orange", link: "View all", path: "/supplier-orders?status=pending" },
    { label: "Completed Orders", value: stats.completedOrders, caption: "Delivered Orders", icon: ClipboardList, tone: "green", link: "View all", path: "/supplier-orders?status=delivered" },
    { label: "Total Earnings", value: `₹${Number(stats.totalEarnings).toLocaleString()}`, caption: "Completed Orders", icon: Wallet, tone: "purple", link: "View details", path: "/supplier-earnings" },
  ];
  const handleProfileSaved = (updatedSupplier) => {
    setDashboard((current) => current ? { ...current, supplier: updatedSupplier } : current);
  };
  const handleOrderAction = async (orderId, status) => {
    if (status === "cancelled" && !window.confirm("Reject this order? It will no longer be available in the incoming queue.")) return;
    setActionId(String(orderId));
    setFeedback(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/orders/${orderId}/status`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update order");
      setFeedback({ type: "success", text: status === "accepted" ? "Order accepted and moved to active orders." : "Order rejected successfully." });
      setRefreshKey((current) => current + 1);
    } catch (actionError) {
      setFeedback({ type: "error", text: actionError.message || "Unable to update order" });
    } finally {
      setActionId("");
    }
  };

  if (location.pathname === "/supplier-orders") {
    return <div className="min-h-screen bg-slate-50 text-slate-900"><div className="flex min-h-screen"><Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} notificationCount={notificationCount} />{isSidebarOpen ? <button type="button" aria-label="Close navigation overlay" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" /> : null}<div className="min-w-0 flex-1"><Header onMenuOpen={() => setIsSidebarOpen(true)} supplier={supplier} notificationCount={notificationCount} onViewNewOrders={() => navigate("/supplier-orders?status=pending")} /><main className="mx-auto max-w-[1440px] space-y-4 p-4 sm:p-6 lg:p-8"><SupplierOrders /></main></div></div></div>;
  }

  if (location.pathname === "/supplierlandingpage") {
    return <div className="min-h-screen bg-slate-50 text-slate-900"><div className="flex min-h-screen"><Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} notificationCount={notificationCount} />{isSidebarOpen ? <button type="button" aria-label="Close navigation overlay" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" /> : null}<div className="min-w-0 flex-1"><Header onMenuOpen={() => setIsSidebarOpen(true)} supplier={supplier} notificationCount={notificationCount} onViewNewOrders={() => navigate("/supplier-orders?status=pending")} /><main className="mx-auto max-w-[1440px] space-y-4 p-4 sm:p-6 lg:p-8"><IncomingOrdersSection orders={incomingOrders} actionId={actionId} feedback={feedback} onAction={handleOrderAction} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <StatCard key={card.label} card={card} onNavigate={navigate} />)}</section><section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]"><OrdersTable orders={activeOrders.length ? activeOrders : orders} onViewAll={() => navigate("/supplier-orders")} /><NotificationsPanel notifications={notifications} onViewAll={() => navigate("/supplier-notifications")} /></section><PerformanceOverview stats={stats} /></main></div></div></div>;
  }

  return <div className="min-h-screen bg-slate-50 text-slate-900"><div className="flex min-h-screen"><Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} notificationCount={notificationCount} />{isSidebarOpen ? <button type="button" aria-label="Close navigation overlay" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" /> : null}<div className="min-w-0 flex-1"><Header onMenuOpen={() => setIsSidebarOpen(true)} supplier={supplier} notificationCount={notificationCount} /><main className="mx-auto max-w-[1440px] space-y-4 p-4 sm:p-6 lg:p-8">{location.pathname === "/supplier-profile" ? <SupplierProfile supplier={supplier} onSaved={handleProfileSaved} /> : location.pathname === "/supplier-earnings" ? <SupplierEarning /> : location.pathname === "/supplier-support" ? <SupplierSupport /> : location.pathname === "/supplier-invoices" ? <SupplierInvoice /> : location.pathname === "/supplier-notifications" ? <SupplierNotification onUnreadCountChange={setNotificationCount} /> : <><section className="grid gap-4 rounded-lg bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-5 shadow-sm lg:grid-cols-[1fr_310px]"><div><h1 className="text-base font-bold text-slate-900 sm:text-lg">Welcome, {supplier.companyName}! <span aria-hidden="true">👋</span></h1><p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-600">You are now a registered AquaBrand supplier.<br />Complete your profile to start receiving orders.</p><div className="mt-4 max-w-md"><div className="mb-2 flex justify-between text-[10px] font-medium text-slate-500"><span>Profile Completion</span><span>{profileCompletion}% Completed</span></div><div className="h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${profileCompletion}%` }} /></div><button type="button" className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-[10px] font-semibold text-white hover:bg-blue-700">Complete Profile <ChevronRight size={13} /></button></div></div><BottleGraphic /></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <StatCard key={card.label} card={card} />)}</section><section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]"><OrdersTable orders={orders} /><NotificationsPanel notifications={notifications} /></section><PerformanceOverview stats={stats} /></>}</main></div></div></div>;
}
