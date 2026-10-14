import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const formatCurrency = (value) => {
  const safeValue = Number(value ?? 0);

  if (!Number.isFinite(safeValue)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeValue);
};

const getShippingCost = (totalQuantity) => {
  if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) return 0;
  return totalQuantity > 500 ? 600 : 400;
};

export default function CartPage() {
  const { items, removeItem, updateItemQuantity, clearCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const cartItems = useMemo(
    () =>
      items.map((item) => {
        const bottleType = item.bottleType || "Bottle";
        const quantity = Math.max(1, Number(item.quantity || 1));
        const pricing = item.pricing || {};
        const unitPrice = Number(pricing.unitPrice ?? item.unitPrice ?? item.price ?? 0);
        const itemTotal = Number(
          pricing.subtotal !== undefined && pricing.subtotal !== null ? pricing.subtotal : unitPrice * quantity
        );

        return {
          ...item,
          bottleType,
          quantity,
          unitPrice,
          itemTotal,
          displayName: `${bottleType} Bottle`,
        };
      }),
    [items]
  );

  const totalQuantity = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const subtotal = cartItems.reduce((total, item) => total + Number(item.itemTotal || item.unitPrice * item.quantity || 0), 0);
  const shipping = totalQuantity > 0 ? getShippingCost(totalQuantity) : 0;
  const total = subtotal + shipping;

  const buildCartOrder = (savedAddress = null) => {
    const orderPayload = {
      items: cartItems.map((item) => ({
        id: item.id,
        bottleType: item.bottleType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal,
        brandName: item.brandName || "",
        logo: item.logo || "",
        specialInstructions: item.specialInstructions || "",
      })),
      bottleType: cartItems.length === 1 ? cartItems[0].bottleType : "Mixed Bottles",
      quantity: totalQuantity,
      totalQuantity,
      pricing: {
        unitPrice: totalQuantity ? subtotal / totalQuantity : 0,
        subtotal,
        shipping,
        total,
      },
      customer: {
        fullName: user?.username || user?.firstName || "",
        phoneNumber: "",
        email: user?.email || "",
      },
      deliveryAddress: savedAddress || {},
      brandName: cartItems[0]?.brandName || "",
      specialInstructions: cartItems[0]?.specialInstructions || "",
      logo: cartItems[0]?.logo || "",
      printing: cartItems[0]?.printing || "Single Color Logo",
    };

    return orderPayload;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          message: "Please log in to continue with your bottle order.",
          from: "/cart",
        },
      });
      return;
    }

    setIsPlacingOrder(true);
    setOrderError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Unable to load your saved delivery address.");
      }

      const data = await response.json();
      const address = data?.address || null;
      const orderPayload = buildCartOrder(address);

      if (address) {
        sessionStorage.setItem("aquaBrandOrder", JSON.stringify(orderPayload));
        navigate("/payment", { state: { order: orderPayload } });
        return;
      }

      navigate("/delivery-details", { state: { orderData: orderPayload } });
    } catch (error) {
      setOrderError(error.message || "Unable to continue to checkout right now.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Cart</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your Cart</h1>
        </div>
        {cartItems.length > 0 ? (
          <button type="button" onClick={clearCart} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:text-red-600">
            Clear cart
          </button>
        ) : null}
      </div>

      {orderError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {orderError}
        </div>
      ) : null}

      {cartItems.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-35px_rgba(15,23,42,0.18)] sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ShoppingCart size={28} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900">Your Cart is Empty</h2>
          <p className="mt-3 text-slate-600">Add customized bottles to your cart to continue.</p>
          <button type="button" onClick={() => navigate("/order-bottles")} className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_380px]">
          <section className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.18)] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                    <img src="/preview.png" alt={`${item.bottleType} bottle preview`} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{item.displayName}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.bottleType} size • {item.brandName ? `Brand: ${item.brandName}` : "Custom print"}</p>
                      </div>

                      <button type="button" aria-label="Remove item" onClick={() => removeItem(item.id)} className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Price / bottle</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quantity</p>
                        <p className="mt-1 font-semibold text-slate-900">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Item total</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency(item.itemTotal)}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                        <button type="button" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                          <Minus size={16} />
                        </button>
                        <span className="min-w-12 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-white">
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Subtotal</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(item.itemTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.16)] lg:sticky lg:top-24 lg:h-fit">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Order Summary</p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">{formatCurrency(shipping)}</span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <button type="button" disabled={isPlacingOrder} onClick={handlePlaceOrder} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isPlacingOrder ? "Checking address..." : "Proceed to Place Order"}
              <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}