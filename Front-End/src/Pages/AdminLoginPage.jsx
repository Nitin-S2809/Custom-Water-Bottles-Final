import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { decodeJwtPayload, isTokenExpired } from "../utils/adminAuth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isValidEmail(formData.email)) {
      setError("Valid email is required.");
      return;
    }

    if (!formData.password || String(formData.password).length < 6) {
      setError("Invalid email or password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      const tokenPayload = decodeJwtPayload(data.token);
      if (tokenPayload?.role !== "admin" || isTokenExpired(data.token)) {
        throw new Error("Admin login returned an invalid session. Please try again.");
      }

      login({ user: data.user, token: data.token });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf1f3] px-4 py-10">
      <div className="w-full max-w-[520px] rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.1)] sm:p-10">
        <div className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-black text-sky-700">A</div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage AquaBrand operations</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate autoComplete="off">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@aquabrand.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#0f9ae8] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#0d8dd6] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
