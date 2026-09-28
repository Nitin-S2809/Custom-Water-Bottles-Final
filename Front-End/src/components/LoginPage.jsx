import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authRequest } from "../utils/authApi";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authRequest("/users/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      login({ user: data.user, token: data.token });
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[32px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 sm:p-10 p-8">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
            <p className="text-sm text-slate-900">Login to your AquaBrand account</p>
          </div>

          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <div>
              <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                <label htmlFor="email">Email Address</label>
              </div>
              <div className="relative mt-3">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16v16H4z" opacity="0.1" />
                    <path d="M4 6l8 6 8-6" />
                    <path d="M4 18V8l8 6 8-6v10" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                <label htmlFor="password">Password</label>
              </div>
              <div className="relative mt-3">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  required
                />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 flex items-center px-1 text-slate-400 transition hover:text-slate-700"><span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-sky-600 hover:text-sky-700">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-sky-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">Don&apos;t have an account? <Link to="/usersignup" className="font-semibold text-sky-700 transition hover:text-sky-900 hover:underline">Create account</Link></p>
          <p className="mt-4 text-center text-xs text-slate-500">Your data is 100% secure with us.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
