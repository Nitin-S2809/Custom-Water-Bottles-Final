import { createElement, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, CircleDollarSign, FileText, PackageCheck, Settings2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const categories = ["All", "Orders", "Payments", "System"];
const notificationIcons = { PackageCheck, ClipboardList: FileText, Wallet: CircleDollarSign, Settings2, FileText };
const notificationTones = {
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-violet-50 text-violet-600",
};

function NotificationRow({ notification, onRead }) {
  const Icon = notification.icon;
  return (
    <button type="button" onClick={() => onRead(notification.id)} className={`flex w-full items-start gap-4 border-b border-slate-100 px-5 py-5 text-left transition last:border-0 hover:bg-slate-50 sm:px-6 ${notification.read ? "" : "bg-blue-50/30"}`}>
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notification.tone}`}>{createElement(Icon, { size: 18 })}</span>
      <span className="min-w-0 flex-1"><span className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><span className={`text-xs font-semibold ${notification.read ? "text-slate-700" : "text-slate-900"}`}>{notification.title}</span><span className="shrink-0 text-[10px] text-slate-400">{notification.time}</span></span><span className="mt-1 block text-xs leading-relaxed text-slate-500">{notification.message}</span></span>
      {!notification.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" /> : null}
    </button>
  );
}

function EmptyState({ category }) {
  return <div className="flex min-h-[230px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Bell size={21} /></span><p className="mt-4 text-sm font-semibold text-slate-700">No {category === "All" ? "notifications" : `${category.toLowerCase()} notifications`} yet</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">You're all caught up here. New updates will appear in this list.</p></div>;
}

export default function SupplierNotification({ onUnreadCountChange }) {
  const { token } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadNotifications = async () => {
      if (!token) {
        setError("Please sign in again to view notifications.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load notifications");
        const supplierNotifications = Array.isArray(data.notifications) ? data.notifications.map((notification) => ({
          ...notification,
          icon: notificationIcons[notification.icon] || Bell,
          tone: notificationTones[notification.tone] || notificationTones.blue,
        })) : [];
        setNotifications(supplierNotifications);
        setError("");
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message || "Unable to load notifications");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    setLoading(true);
    loadNotifications();
    return () => controller.abort();
  }, [token]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const visibleNotifications = useMemo(() => activeCategory === "All" ? notifications : notifications.filter((notification) => notification.type === activeCategory), [activeCategory, notifications]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  const markAsRead = (id) => {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-xl font-bold text-slate-900">Notifications</h1><p className="mt-1 text-xs text-slate-500">Stay updated with important alerts, order updates and announcements.</p></div><button type="button" onClick={markAllAsRead} disabled={unreadCount === 0} className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck size={14} /> Mark all as read</button></div>
      {error ? <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">{error}</p> : null}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 pt-2 sm:px-6">{categories.map((category) => { const count = category === "All" ? unreadCount : notifications.filter((notification) => notification.type === category && !notification.read).length; return <button type="button" key={category} onClick={() => setActiveCategory(category)} className={`inline-flex items-center gap-2 border-b-2 px-2 py-3 text-xs font-semibold ${activeCategory === category ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>{category}{count > 0 ? <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] ${activeCategory === category ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{count}</span> : null}</button>; })}</div>{loading ? <p className="px-6 py-12 text-center text-xs text-slate-500" role="status">Loading notifications...</p> : visibleNotifications.length ? <div>{visibleNotifications.map((notification) => <NotificationRow key={notification.id} notification={notification} onRead={markAsRead} />)}</div> : <EmptyState category={activeCategory} />}</section>
    </div>
  );
}
