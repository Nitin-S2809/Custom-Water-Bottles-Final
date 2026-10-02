import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, LogOut, Package, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function formatOrderDate(value) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function UserProfile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const isAuthenticated = Boolean(user?._id && token);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/orders/user/${user._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unable to load orders."))))
      .then((data) => { setOrders(Array.isArray(data.orders) ? data.orders : []); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [isAuthenticated, token, user?._id]);

  if (!isAuthenticated) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-3xl font-semibold text-slate-900">Sign in to view your orders</h1><button type="button" onClick={() => navigate("/login")} className="mt-6 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Go to Login</button></main>;
  }

  return <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700"><UserCircle size={30} /></div><div><h1 className="text-3xl font-semibold text-slate-900">My Orders</h1><p className="mt-1 text-sm text-slate-500">{user?.username} · {user?.email}</p></div></div>
      <button type="button" onClick={() => { logout(); navigate("/login"); }} className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-red-200 hover:text-red-600"><LogOut size={16} />Sign out</button>
    </div>
    {status === "loading" ? <p className="py-12 text-center text-sm text-slate-500">Loading your orders...</p> : null}
    {status === "error" ? <p className="py-12 text-center text-sm text-red-600">We could not load your orders right now.</p> : null}
    {status === "ready" && orders.length === 0 ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm"><Package className="mx-auto text-slate-400" size={34} /><h2 className="mt-4 text-lg font-semibold text-slate-900">No orders yet</h2><p className="mt-2 text-sm text-slate-500">Your completed orders will appear here.</p><button type="button" onClick={() => navigate("/order-bottles")} className="mt-6 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Start an order</button></div> : null}
    {orders.length > 0 ? <div className="mt-8 grid gap-4">{orders.map((order) => <article key={order._id} role="link" tabIndex="0" onClick={() => navigate(`/orders/${order._id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/orders/${order._id}`); } }} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{order.bottleType} Bottle Order</h2><p className="mt-1 text-sm text-slate-500">Order #{order._id}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${order.status === "delivered" ? "bg-emerald-50 text-emerald-700" : order.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{String(order.status || "Processing").replaceAll("-", " ")}</span></div><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600"><span>Quantity: <strong className="text-slate-900">{Number(order.quantity || 0).toLocaleString("en-IN")}</strong></span><span>Total: <strong className="text-slate-900">₹{Number(order.pricing?.total || 0).toLocaleString("en-IN")}</strong></span><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatOrderDate(order.createdAt)}</span></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{order.deliveryDate ? `Expected delivery: ${formatOrderDate(order.deliveryDate)}` : "Expected delivery date not available"}</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700">View Details <ArrowRight size={14} /></span></div></article>)}</div> : null}
  </main>;
}
