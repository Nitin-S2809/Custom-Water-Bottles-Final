import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminAccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf1f3] px-6 py-10">
      <div className="w-full max-w-[620px] rounded-[28px] border border-red-200 bg-white/90 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-red-100 bg-red-50">
            <ShieldAlert className="h-12 w-12 text-red-500" strokeWidth={2.2} />
          </div>
        </div>

        <h1 className="mt-8 text-center text-4xl font-bold tracking-tight text-slate-900">Access Denied</h1>

        <p className="mt-6 text-center text-lg leading-relaxed text-slate-600">
          This admin area is restricted to authenticated AquaBrand administrators.
        </p>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/admin/login", { replace: true })}
            className="inline-flex items-center gap-3 rounded-xl bg-[#0f9ae8] px-7 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,154,232,0.3)] transition hover:bg-[#0d8dd6]"
          >
            <ArrowLeft size={20} />
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}
