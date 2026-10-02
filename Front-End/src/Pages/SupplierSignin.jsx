import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SupplierSignin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ businessEmail: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Supplier login failed");
      }

      login({ user: data.supplier, token: data.token });
      navigate("/supplierlandingpage");
    } catch (loginError) {
      setError(loginError.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-sky-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-[40px] bg-white/95 p-6 shadow-[0_35px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Welcome Back!
              </h1>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                Login to access your supplier dashboard
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Business Email */}
              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📧</span>
                  <span>Business Email</span>
                </div>
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  placeholder="Business Email"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              {/* Password */}
              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔒</span>
                  <span>Password</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                    placeholder="Password"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="pointer-events-auto absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? "👁️" : "👁️"}
                  </button>
                </div>
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>
                <a href="mailto:hello@aquabrand.com?subject=Supplier%20password%20assistance" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-blue-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="mx-4 text-sm text-slate-500">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Create Supplier Account Button */}
              <button
                type="button"
                onClick={() => navigate("/supplier-signup")}
                className="w-full rounded-3xl border-2 border-blue-600 bg-white px-5 py-4 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                ✨ Create Supplier Account
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupplierSignin;
