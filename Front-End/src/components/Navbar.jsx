import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, ShoppingCart, UserCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const isAboutPage = location.pathname === "/about";
  const previousPathname = useRef(location.pathname);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Suppliers", href: "/suppliers" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const firstName = (user?.firstName || user?.username || "User").trim().split(/\s+/)[0] || "User";
  const firstLetter = firstName.charAt(0).toUpperCase();
  const loginPath = location.pathname === "/suppliers" ? "/supplier-signin" : "/login";
  const isActive = (href) => location.pathname === href;
  const goTo = (href) => {
    setIsMenuOpen(false);
    if (href === "/" && location.pathname === "/") {
      if (location.hash) navigate("/", { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(href);
  };

  useEffect(() => {
    if (previousPathname.current === location.pathname) return;
    previousPathname.current = location.pathname;
    if (!location.hash) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.hash, location.pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <button type="button" onClick={() => goTo("/")} className="flex shrink-0 items-center gap-3 text-left lg:justify-self-start">
          {isAboutPage ? <img src="/logo.png" alt="" className="h-11 w-11 shrink-0 object-contain" /> : <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-700 shadow-sm">💧</div>}
          <div className="hidden sm:block"><p className="text-sm font-semibold text-slate-900">AquaBrand</p><p className="text-xs text-slate-500">Premium bottle orders</p></div>
        </button>
        <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex lg:justify-self-center">
          {menuItems.map((item) => <button key={item.label} type="button" onClick={() => goTo(item.href)} className={`transition hover:text-blue-600 ${isActive(item.href) ? "font-semibold text-blue-600" : ""}`}>{item.label}</button>)}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 lg:justify-self-end">
          {isAboutPage ? <>
            <button type="button" onClick={() => goTo(isAuthenticated ? "/user-profile" : "/login")} className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-blue-700 sm:inline-flex">{isAuthenticated ? firstName : "Login"}</button>
            <button type="button" onClick={() => goTo(isAuthenticated ? "/order-bottles" : "/usersignup")} className="hidden rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:inline-flex">Get Started</button>
          </> : <>
            <button type="button" aria-label={`Open cart with ${itemCount} items`} onClick={() => goTo("/cart")} className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"><ShoppingCart size={18} />{itemCount > 0 ? <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white shadow-md">{itemCount}</span> : null}</button>
            <button type="button" onClick={() => goTo("/user-profile")} className="hidden rounded-full border border-slate-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 md:inline-flex">My Orders</button>
            {isAuthenticated ? <button type="button" aria-label={`Open profile for ${firstName}`} onClick={() => goTo("/user-profile")} className="inline-flex items-center gap-3 text-left"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600">{firstLetter}</span><span className="hidden leading-tight md:block"><span className="block text-[10px] text-slate-500">Welcome</span><span className="block text-sm font-semibold text-slate-800">{firstName}</span></span></button> : <button type="button" aria-label={location.pathname === "/suppliers" ? "Open supplier login" : "Open login"} onClick={() => goTo(loginPath)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"><UserCircle size={20} /></button>}
          </>}
          <button type="button" aria-label={isMenuOpen ? "Close navigation" : "Open navigation"} onClick={() => setIsMenuOpen((open) => !open)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 lg:hidden">{isMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {isMenuOpen ? <div className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden"><div className="grid gap-1">{menuItems.map((item) => <button key={item.label} type="button" onClick={() => goTo(item.href)} className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-blue-50 hover:text-blue-600 ${isActive(item.href) ? "bg-blue-50 text-blue-600" : "text-slate-700"}`}>{item.label}</button>)}{isAboutPage ? <><button type="button" onClick={() => goTo(isAuthenticated ? "/user-profile" : "/login")} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50">{isAuthenticated ? firstName : "Login"}</button><button type="button" onClick={() => goTo(isAuthenticated ? "/order-bottles" : "/usersignup")} className="rounded-xl bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white">Get Started</button></> : <button type="button" onClick={() => goTo(isAuthenticated ? "/user-profile" : loginPath)} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-blue-700 transition hover:bg-blue-50">{isAuthenticated ? "My Orders" : location.pathname === "/suppliers" ? "Supplier Login" : "Login"}</button>}</div></div> : null}
      </nav>
    </header>
  );
};

export default Navbar;
