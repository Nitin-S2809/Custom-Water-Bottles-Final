import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

const decodeJwtRole = (token) => {
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
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
  const [adminExists, setAdminExists] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = useMemo(() => decodeJwtRole(token), [token]);
  const isExpired = Boolean(token && isTokenExpired(token));

  if (isExpired) {
    logout();
    return <Navigate to="/admin/login" replace state={{ message: "Your admin session expired. Please log in again." }} />;
  }

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/status`);
        const data = await response.json().catch(() => ({ adminExists: false }));
        if (active) {
          setAdminExists(Boolean(data.adminExists));
        }
      } catch {
        if (active) {
          setAdminExists(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading admin access...
      </div>
    );
  }

  if (!adminExists) {
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
  const [adminExists, setAdminExists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/status`);
        const data = await response.json().catch(() => ({ adminExists: false }));
        if (active) {
          setAdminExists(Boolean(data.adminExists));
        }
      } catch {
        if (active) {
          setAdminExists(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading admin access...
      </div>
    );
  }

  if (adminExists) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminSignupPage />;
}

function ProtectedAdminRoute({ children }) {
  const { token, logout } = useAuth();
  const [adminExists, setAdminExists] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = useMemo(() => decodeJwtRole(token), [token]);
  const isExpired = Boolean(token && isTokenExpired(token));

  if (isExpired) {
    logout();
    return <Navigate to="/admin/login" replace state={{ message: "Your admin session expired. Please log in again." }} />;
  }

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/status`);
        const data = await response.json().catch(() => ({ adminExists: false }));
        if (active) {
          setAdminExists(Boolean(data.adminExists));
        }
      } catch {
        if (active) {
          setAdminExists(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading admin access...
      </div>
    );
  }

  if (!adminExists) {
    return <AdminSignupPage />;
  }

  if (!token || role !== "admin") {
    return <AdminAccessDenied />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const isSupplierRoute = location.pathname.startsWith("/supplier") && location.pathname !== "/suppliers";
  const isAdminRoute = location.pathname.startsWith("/admin");

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
        <Route path="/order-bottles" element={<OrderBottle />} />
        <Route path="/delivery-details" element={<DeliveryDetail />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/order-successful" element={<OrderSuccessfull />} />

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