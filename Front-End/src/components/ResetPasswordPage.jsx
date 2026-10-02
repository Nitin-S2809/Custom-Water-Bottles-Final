import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { authRequest } from "../utils/authApi";

function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!password) return setError("Password is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters long.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await authRequest(`/users/reset-password/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-slate-100 via-sky-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-156px)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-blue-700">{success ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}</div>
          {success ? <div role="status" aria-live="polite" className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Password reset successfully</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">You can now log in with your new password.</p>
            <Link to="/login" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700">Back to Login</Link>
          </div> : <>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Choose a new password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Use at least 6 characters for your new password.</p>
            <form className="mt-7 space-y-5" onSubmit={handleSubmit} autoComplete="off">
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">New Password</label>
              <div className="relative -mt-2">
                <input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 flex items-center px-1 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm New Password</label>
              <div className="relative -mt-2">
                <input id="confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                <button type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute inset-y-0 right-3 flex items-center px-1 text-slate-400 hover:text-slate-700">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
              <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">{loading ? "Updating password..." : "Reset Password"}</button>
            </form>
          </>}
        </section>
      </div>
    </main>
  );
}

export default ResetPasswordPage;