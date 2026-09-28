import { createElement } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const getInitials = (name = "") => {
  const parts = String(name || "Admin").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function AdminSectionPage({ section }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

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
            <h1 className="text-xl font-bold text-slate-900">{section}</h1>
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

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Admin Workspace</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{section}</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            This admin section is now routed and ready for its data workflow. Use the sidebar to move between admin areas.
          </p>
          <p className="mt-6 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
            Current route: {location.pathname}
          </p>
        </section>
      </main>
    </div>
  );
}
