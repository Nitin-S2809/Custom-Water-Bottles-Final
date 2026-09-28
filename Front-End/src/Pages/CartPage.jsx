import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, removeItem } = useCart();
  const navigate = useNavigate();

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-900">Your Cart</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">Your cart is empty.</p>
          <button type="button" onClick={() => navigate("/order-bottles")} className="mt-5 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Start an order</button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="font-semibold text-slate-900">{item.bottleType} Bottle</p><p className="text-sm text-slate-500">{item.quantity} bottles</p></div><button type="button" aria-label="Remove item" onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-600"><Trash2 size={18} /></button></div>)}</div>
      )}
    </main>
  );
}