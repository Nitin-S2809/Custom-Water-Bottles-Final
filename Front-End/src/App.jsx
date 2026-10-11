import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustBadge from "./components/TrustBadge";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import ForCompanies from "./components/ForCompanies";
import ForSuppliers from "./components/ForSuppliers";
import WhyChooseUs from "./components/WhyChooseUs";
import CallToAction from "./components/CallToAction";
import UserSignup from "./components/SignupPage";
import LoginPage from "./components/LoginPage";
import SupplierSignup from "./components/SupplierSignup";
import SupplierSignin from "./Pages/SupplierSignin";
import { useAuth } from "./context/AuthContext";
import { decodeJwtPayload, isTokenExpired } from "./utils/adminAuth";

import OrderBottle from "./Pages/OrderBottle";
import DeliveryDetail from "./Pages/DeliveryDetail";
import PaymentPage from "./Pages/PaymentPage";
import OrderSuccessfull from "./Pages/OrderSuccessfull";
import SupplierLandingPage from "./Pages/supplierlandingpage";
import UserProfile from "./Pages/userProfile";
import CartPage from "./Pages/CartPage";
import OrderDetails from "./Pages/OrderDetails";
import SupplierOrderDetails from "./Pages/SupplierOrderDetails";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminSupplierPage from "./Pages/adminSupplier";
import AdminCustomersPage from "./Pages/adminCustomers";
import AdminSectionPage from "./Pages/AdminSectionPage";
import AdminAnalyticsPage from "./Pages/AdminAnalyticsPage";
import AdminSignupPage from "./Pages/AdminSignupPage";
import AdminLoginPage from "./Pages/AdminLoginPage";
import AdminAccessDenied from "./Pages/AdminAccessDenied";
import AdminOrdersPage from "./Pages/adminOrders";
import AboutUs from "./Pages/aboutUs";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";

const PUBLIC_ROUTE_METADATA = {
  "/": {
    title: "AquaBrand | Customized Water Bottles for Businesses",
    description: "AquaBrand creates premium customized water bottles for businesses, hotels, restaurants, events, and bulk buyers across India.",
  },
  "/how-it-works": {
    title: "How It Works | AquaBrand",
    description: "See how AquaBrand helps businesses upload a logo, connect with a licensed local water plant, and get custom branded bottles delivered.",
  },
  "/suppliers": {
    title: "For Water Suppliers | AquaBrand",
    description: "Join AquaBrand's network of licensed water suppliers and connect with businesses looking for custom branded water bottles.",
  },
  "/about": {
    title: "About AquaBrand | Customized Water Bottles for Businesses",
    description: "Learn about AquaBrand, the platform connecting businesses with trusted and licensed local water suppliers for custom-branded bottles.",
  },
  "/contact": {
    title: "Contact AquaBrand | Customized Water Bottles",
    description: "Contact AquaBrand about custom branded bottled water for hotels, companies, events, and growing businesses.",
  },
};

const CANONICAL_BASE_URL = "https://custom-water-bottles-final-8w8c.vercel.app";

const restoreAttribute = (element, attribute, value) => {
  if (!element) return;
  if (value === null) {
    element.removeAttribute(attribute);
  } else {
    element.setAttribute(attribute, value);
  }
};

const decodeJwtRole = (token) => {
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
};

function useAdminStatus() {
  const [adminStatus, setAdminStatus] = useState({ state: "loading" });

  useEffect(() => {
    let active = true;

    const checkAdminStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/status`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to check admin status");
        }

        const data = await response.json();
        if (typeof data?.adminExists !== "boolean") {
          throw new Error("Invalid admin status response");
        }

        if (active) {
          setAdminStatus({ state: "success", adminExists: data.adminExists });
        }
      } catch (error) {
        if (active) {
          setAdminStatus({ state: "error", error });
        }
      }
    };

    checkAdminStatus();
    return () => {
      active = false;
    };
  }, []);

  return adminStatus;
}

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
      Loading admin access...
    </div>
  );
}

const hasInvalidAdminToken = (token) => {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return !payload || typeof payload.exp !== "number" || typeof payload.role !== "string" || isTokenExpired(token);
};

function Home() {
  const location = useLocation();

  return (
    <>
      {location.state?.authSuccess ? <p role="status" className="bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">{location.state.authSuccess}</p> : null}
      <Hero />
      <Stats />
      <TrustBadge />
      <HowItWorks />
      <ForCompanies />
      <ForSuppliers />
      <WhyChooseUs />
      <CallToAction />
    </>
  );
}

function AdminGate() {
  const { token, logout } = useAuth();
  const adminStatus = useAdminStatus();
  const invalidToken = hasInvalidAdminToken(token);
  const role = decodeJwtRole(token);

  useEffect(() => {
    if (invalidToken) logout();
  }, [invalidToken, logout]);

  if (invalidToken) {
    return <Navigate to="/admin/login" replace state={{ message: "Your admin session expired. Please log in again." }} />;
  }

  if (adminStatus.state === "loading") {
    return <AdminLoading />;
  }

  if (adminStatus.state === "error") {
    return <Navigate to="/admin/login" replace state={{ message: "Unable to verify admin status. Please log in." }} />;
  }

  if (!adminStatus.adminExists) {
    return <AdminSignupPage />;
  }

  if (!token) {
    return <AdminLoginPage />;
  }

  if (role !== "admin") {
    return <AdminAccessDenied />;
  }

  return <AdminDashboard />;
}

function AdminSignupRoute() {
  const adminStatus = useAdminStatus();

  if (adminStatus.state === "loading") {
    return <AdminLoading />;
  }

  if (adminStatus.state === "error") {
    return <Navigate to="/admin/login" replace state={{ message: "Unable to verify admin status. Please log in." }} />;
  }

  if (adminStatus.adminExists) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminSignupPage />;
}

function ProtectedAdminRoute({ children }) {
  const { token, logout } = useAuth();
  const adminStatus = useAdminStatus();
  const invalidToken = hasInvalidAdminToken(token);
  const role = decodeJwtRole(token);

  useEffect(() => {
    if (invalidToken) logout();
  }, [invalidToken, logout]);

  if (invalidToken) {
    return <Navigate to="/admin/login" replace state={{ message: "Your admin session expired. Please log in again." }} />;
  }

  if (adminStatus.state === "loading") {
    return <AdminLoading />;
  }

  if (adminStatus.state === "error") {
    return <Navigate to="/admin/login" replace state={{ message: "Unable to verify admin status. Please log in." }} />;
  }

  if (!adminStatus.adminExists) {
    return <AdminSignupPage />;
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role !== "admin") {
    return <AdminAccessDenied />;
  }

  return children;
}

function RequireAuth({ children, loginMessage, redirectTo = "/login" }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ message: loginMessage || "Please log in to continue.", from: location.pathname + location.search }} />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const isSupplierRoute = location.pathname.startsWith("/supplier") && location.pathname !== "/suppliers";
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const metadata = PUBLIC_ROUTE_METADATA[location.pathname];
    if (!metadata) return undefined;

    const createdElements = [];
    const getOrCreateElement = (selector, tagName, identifyingAttribute, identifyingValue) => {
      const existingElement = document.querySelector(selector);
      if (existingElement) return existingElement;

      const element = document.createElement(tagName);
      element.setAttribute(identifyingAttribute, identifyingValue);
      document.head.appendChild(element);
      createdElements.push(element);
      return element;
    };
    const description = getOrCreateElement('meta[name="description"]', "meta", "name", "description");
    const canonical = getOrCreateElement('link[rel="canonical"]', "link", "rel", "canonical");
    const openGraphTitle = getOrCreateElement('meta[property="og:title"]', "meta", "property", "og:title");
    const openGraphDescription = getOrCreateElement('meta[property="og:description"]', "meta", "property", "og:description");
    const twitterTitle = getOrCreateElement('meta[name="twitter:title"]', "meta", "name", "twitter:title");
    const twitterDescription = getOrCreateElement('meta[name="twitter:description"]', "meta", "name", "twitter:description");
    const previousValues = {
      title: document.title,
      description: description.getAttribute("content"),
      canonical: canonical.getAttribute("href"),
      openGraphTitle: openGraphTitle.getAttribute("content"),
      openGraphDescription: openGraphDescription.getAttribute("content"),
      twitterTitle: twitterTitle.getAttribute("content"),
      twitterDescription: twitterDescription.getAttribute("content"),
    };

    document.title = metadata.title;
    description.setAttribute("content", metadata.description);
    canonical.setAttribute("href", `${CANONICAL_BASE_URL}${location.pathname}`);
    openGraphTitle.setAttribute("content", metadata.title);
    openGraphDescription.setAttribute("content", metadata.description);
    twitterTitle.setAttribute("content", metadata.title);
    twitterDescription.setAttribute("content", metadata.description);

    return () => {
      document.title = previousValues.title;
      restoreAttribute(description, "content", previousValues.description);
      restoreAttribute(canonical, "href", previousValues.canonical);
      restoreAttribute(openGraphTitle, "content", previousValues.openGraphTitle);
      restoreAttribute(openGraphDescription, "content", previousValues.openGraphDescription);
      restoreAttribute(twitterTitle, "content", previousValues.twitterTitle);
      restoreAttribute(twitterDescription, "content", previousValues.twitterDescription);
      createdElements.forEach((element) => element.remove());
    };
  }, [location.pathname]);

  const requireAuth = (element, options = {}) => {
    const { loginMessage, redirectTo = "/login" } = options;

    return (
      <RequireAuth loginMessage={loginMessage} redirectTo={redirectTo}>
        {element}
      </RequireAuth>
    );
  };

  return (
    <>
      {!isSupplierRoute && !isAdminRoute ? <Navbar /> : null}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/suppliers" element={<ForSuppliers />} />
        <Route path="/contact" element={<CallToAction />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/usersignup" element={<UserSignup />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/supplier-signup" element={<SupplierSignup />} />
        <Route path="/supplier-signin" element={<SupplierSignin />} />
        <Route path="/order-bottles" element={requireAuth(<OrderBottle />, { loginMessage: "Please log in to continue with your bottle order." })} />
        <Route path="/delivery-details" element={requireAuth(<DeliveryDetail />, { loginMessage: "Please log in to continue to checkout." })} />
        <Route path="/payment" element={requireAuth(<PaymentPage />, { loginMessage: "Please log in to complete your payment." })} />
        <Route path="/order-successful" element={requireAuth(<OrderSuccessfull />, { loginMessage: "Please log in to view your order details." })} />

        <Route path="/supplierlandingpage" element={<SupplierLandingPage />} />
        <Route path="/supplier-orders/:orderId" element={<SupplierOrderDetails />} />
        <Route path="/supplier-orders" element={<SupplierLandingPage />} />
        <Route path="/supplier-profile" element={<SupplierLandingPage />} />
        <Route path="/supplier-earnings" element={<SupplierLandingPage />} />
        <Route path="/supplier-support" element={<SupplierLandingPage />} />
        <Route path="/supplier-invoices" element={<SupplierLandingPage />} />
        <Route path="/supplier-notifications" element={<SupplierLandingPage />} />
        <Route path="/supplier-settings" element={<SupplierLandingPage />} />

        <Route path="/admin" element={<AdminGate />} />
        <Route path="/admin/signup" element={<AdminSignupRoute />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/supplier-requests" element={<ProtectedAdminRoute><AdminSectionPage section="Supplier Requests" /></ProtectedAdminRoute>} />
        <Route path="/admin/suppliers" element={<ProtectedAdminRoute><AdminSupplierPage /></ProtectedAdminRoute>} />
        <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrdersPage /></ProtectedAdminRoute>} />
        <Route path="/admin/customers" element={<ProtectedAdminRoute><AdminCustomersPage /></ProtectedAdminRoute>} />
        <Route path="/admin/products" element={<ProtectedAdminRoute><AdminSectionPage section="Products" /></ProtectedAdminRoute>} />
        <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminAnalyticsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSectionPage section="Settings" /></ProtectedAdminRoute>} />

        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;