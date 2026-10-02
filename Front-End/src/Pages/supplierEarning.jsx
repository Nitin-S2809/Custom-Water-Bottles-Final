import { createElement, useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock3, FileText, TrendingUp, WalletCards } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const emptyEarnings = {
  totalEarnings: 0,
  currentMonthEarnings: 0,
  pendingPayments: 0,
  currentMonthLabel: "",
  monthlyEarnings: [],
  transactions: [],
};

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function SummaryCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{currency(value)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>{createElement(Icon, { size: 19, "aria-hidden": true })}</span>
      </div>
    </section>
  );
}

function EarningsChart({ points }) {
  const safePoints = Array.isArray(points) && points.length ? points : [];
  const maxValue = Math.max(...safePoints.map((point) => Number(point.value) || 0), 1);
  const chartWidth = 620;
  const chartHeight = 190;
  const left = 48;
  const right = 14;
  const top = 14;
  const bottom = 32;
  const innerWidth = chartWidth - left - right;
  const innerHeight = chartHeight - top - bottom;
  const coordinates = safePoints.map((point, index) => ({
    ...point,
    x: safePoints.length === 1 ? left + innerWidth / 2 : left + (index * innerWidth) / (safePoints.length - 1),
    y: top + innerHeight - ((Number(point.value) || 0) / maxValue) * innerHeight,
  }));
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const gridLines = [0, 0.5, 1];

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[620px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[220px] w-full" role="img" aria-label="Six month earnings chart">
          {gridLines.map((ratio) => {
            const y = top + innerHeight - ratio * innerHeight;
            const label = currency(maxValue * ratio);
            return <g key={ratio}><line x1={left} x2={chartWidth - right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" /><text x={left - 9} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">{label}</text></g>;
          })}
          <line x1={left} x2={chartWidth - right} y1={top + innerHeight} y2={top + innerHeight} stroke="#cbd5e1" />
          {coordinates.length > 1 ? <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {coordinates.map(({ x, y, label, value }) => <g key={label}><circle cx={x} cy={y} r="4" fill="#fff" stroke="#2563eb" strokeWidth="2.5" /><text x={x} y={chartHeight - 8} textAnchor="middle" fill="#64748b" fontSize="10">{label}</text><title>{`${label}: ${currency(value)}`}</title></g>)}
        </svg>
      </div>
    </div>
  );
}

function TransactionsTable({ transactions }) {
  if (!transactions.length) {
    return <div className="flex min-h-[245px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><FileText size={22} /></span><p className="mt-4 text-sm font-semibold text-slate-700">No transactions yet</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">Your earnings will appear here once you complete orders.</p></div>;
  }

  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><th className="px-5 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Order ID</th><th className="px-3 py-3 font-medium">Amount</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Payment Mode</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.orderId} className="border-b border-slate-100 last:border-0"><td className="px-5 py-4 text-xs text-slate-600">{transaction.date}</td><td className="px-3 py-4 text-xs font-medium text-slate-700">{transaction.orderId}</td><td className="px-3 py-4 text-xs font-semibold text-slate-800">{currency(transaction.amount)}</td><td className="px-3 py-4"><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${transaction.status === "Delivered" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>{transaction.status}</span></td><td className="px-5 py-4 text-xs text-slate-500">{transaction.paymentMode || "Not recorded"}</td></tr>)}</tbody></table></div>;
}

export default function SupplierEarning() {
  const { token } = useAuth();
  const [earnings, setEarnings] = useState(emptyEarnings);
  const [period, setPeriod] = useState("6");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadEarnings = async () => {
      if (!token) {
        setError("Please sign in as a supplier to continue.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/earnings?months=${period}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load earnings");
        setEarnings({ ...emptyEarnings, ...data });
        setError("");
      } catch (earningsError) {
        if (earningsError.name !== "AbortError") setError(earningsError.message || "Unable to load earnings");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadEarnings();
    return () => controller.abort();
  }, [period, token]);

  const monthlyEarnings = useMemo(() => Array.isArray(earnings.monthlyEarnings) ? earnings.monthlyEarnings : [], [earnings.monthlyEarnings]);
  const transactions = Array.isArray(earnings.transactions) ? earnings.transactions : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-xl font-bold text-slate-900">Earnings</h1><p className="mt-1 text-xs text-slate-500">Track your income, orders and payment history.</p></div><label className="relative inline-flex items-center"><span className="sr-only">Earnings period</span><select value={period} onChange={(event) => setPeriod(event.target.value)} className="appearance-none rounded-md border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-medium text-slate-600 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="6">Last 6 Months</option><option value="12">Last 12 Months</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" /></label></div>
      {error ? <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</p> : null}
      {loading ? <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">Loading earnings...</div> : <>
        <section className="grid gap-4 md:grid-cols-3"><SummaryCard title="Total Earnings" value={earnings.totalEarnings} subtitle="All time" icon={WalletCards} tone="bg-blue-50 text-blue-600" /><SummaryCard title="This Month" value={earnings.currentMonthEarnings} subtitle={earnings.currentMonthLabel || "Current month"} icon={TrendingUp} tone="bg-emerald-50 text-emerald-600" /><SummaryCard title="Pending Payments" value={earnings.pendingPayments} subtitle="To be processed" icon={Clock3} tone="bg-orange-50 text-orange-600" /></section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold text-slate-800">Earnings Overview</h2><span className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-600" /> Earnings</span></div><EarningsChart points={monthlyEarnings} /></section>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-bold text-slate-800">Recent Transactions</h2></div><TransactionsTable transactions={transactions} /></section>
      </>}
    </div>
  );
}
