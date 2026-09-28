import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { authRequest } from "../utils/authApi";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authRequest("/users/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} /> Back to Login</Link>
          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-blue-700"><Mail size={22} /></div>
          {sent ? <div role="status" aria-live="polite" className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Check your email</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">If an account exists for this email, we&apos;ve sent you a password reset link.</p>
            <Link to="/login" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700">Back to Login</Link>
          </div> : <>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Enter the email address associated with your account and we&apos;ll help you reset your password.</p>
            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">Email Address</label>
              <input id="reset-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="-mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
              {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
              <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">{loading ? "Sending..." : <>Send Reset Link <Send size={16} /></>}</button>
            </form>
          </>}
        </section>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;