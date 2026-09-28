import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Banknote,
  BriefcaseBusiness,
  Building2,
  Check,
  CreditCard,
  Headphones,
  House,
  Landmark,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";

const paymentOptions = [
  {
    id: "upi",
    label: "UPI / QR Code",
    subtitle: "Pay using any UPI app",
    badge: "UPI",
    icon: "upi",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    subtitle: "Visa, Mastercard, Rupay & more",
    badge: "Card",
    icon: "card",
  },
  {
    id: "netbanking",
    label: "Net Banking",
    subtitle: "All major banks supported",
    badge: "Bank",
    icon: "bank",
  },
  {
    id: "wallet",
    label: "Wallets",
    subtitle: "Paytm, PhonePe, Google Pay & more",
    badge: "Wallet",
    icon: "wallet",
  },
  {
    id: "banktransfer",
    label: "Bank Transfer",
    subtitle: "NEFT, RTGS, IMPS",
    badge: "Transfer",
    icon: "transfer",
  },
];

const trustItems = [
  {
    title: "SSL Secured Checkout",
    subtitle: "256-bit encryption",
    icon: ShieldCheck,
  },
  {
    title: "Easy Returns",
    subtitle: "Hassle-free returns",
    icon: PackageCheck,
  },
  {
    title: "Customer Support",
    subtitle: "24/7 assistance",
    icon: Headphones,
  },
  {
    title: "Trusted by 10,000+ Businesses",
    subtitle: "Across India",
    icon: BadgeCheck,
  },
];

const whyChooseUs = [
  {
    title: "Secure Payments",
    text: "Your transactions are 100% secure",
    icon: ShieldCheck,
  },
  {
    title: "Premium Quality",
    text: "Best quality bottles with custom branding",
    icon: Sparkles,
  },
  {
    title: "Fast Delivery",
    text: "Quick and reliable delivery to your door",
    icon: Truck,
  },
  {
    title: "24/7 Support",
    text: "We're here to help anytime",
    icon: Headphones,
  },
];

const defaultBillingForm = {
  fullName: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "Unavailable";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function dataUrlToFile(dataUrl, fileName = "logo.png") {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const [metadata, encoded] = dataUrl.split(",");
  if (!metadata || !encoded) return null;
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || "image/png";
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new File([bytes], fileName, { type: mimeType });
  } catch {
    return null;
  }
}

function saveOrderToSession(order) {
  try {
    sessionStorage.setItem("aquaBrandOrder", JSON.stringify(order));
  } catch {
    return;
  }
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const order = useMemo(() => {
    const routeOrder = location.state?.order ?? location.state?.orderData ?? null;
    if (routeOrder) return routeOrder;

    try {
      const saved = sessionStorage.getItem("aquaBrandOrder");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, [location.state]);

  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress ?? {});
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    if (!user?._id || !token) return;

    setAddressLoading(true);
    setAddressError("");
    fetch(`http://localhost:5000/api/addresses/${user._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load delivery address.");
        setDeliveryAddress(data.address || {});
      })
      .catch((error) => setAddressError(error.message))
      .finally(() => setAddressLoading(false));
  }, [token, user?._id]);

  const customer = {
    ...(order.customer ?? {}),
    fullName: deliveryAddress.fullName || order.customer?.fullName || "",
    phoneNumber: deliveryAddress.phoneNumber || order.customer?.phoneNumber || "",
    email: deliveryAddress.email || order.customer?.email || "",
  };
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState({ type: "", text: "" });
  const [billingForm, setBillingForm] = useState({
    ...defaultBillingForm,
    fullName: customer.fullName || "",
    phoneNumber: customer.phoneNumber || "",
    addressLine1: deliveryAddress.addressLine1 || "",
    addressLine2: deliveryAddress.addressLine2 || "",
    city: deliveryAddress.city || "",
    state: deliveryAddress.state || "",
    pincode: deliveryAddress.pincode || "",
    country: deliveryAddress.country || "India",
  });
  const [orderStatus, setOrderStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bottleType = order.bottleType ?? "";
  const quantity = order.quantity ?? "";
  const printing = order.printing ?? "";
  const brandName = order.brandName || "YOUR BRAND";
  const instructions = order.specialInstructions || "";
  const pricing = order.pricing ?? {};

  const billingDetails = sameAsDelivery
    ? {
        fullName: customer.fullName || billingForm.fullName || "",
        phoneNumber: customer.phoneNumber || billingForm.phoneNumber || "",
        addressLine1: deliveryAddress.addressLine1 || billingForm.addressLine1 || "",
        addressLine2: deliveryAddress.addressLine2 || billingForm.addressLine2 || "",
        city: deliveryAddress.city || billingForm.city || "",
        state: deliveryAddress.state || billingForm.state || "",
        pincode: deliveryAddress.pincode || billingForm.pincode || "",
        country: deliveryAddress.country || billingForm.country || "India",
      }
    : billingForm;

  const handleCouponApply = () => {
    const normalized = coupon.trim().toUpperCase();

    if (!normalized) {
      setCouponState({ type: "error", text: "Please enter a coupon code." });
      return;
    }

    if (normalized === "AQUA10") {
      setCouponState({ type: "success", text: "Coupon applied successfully." });
      return;
    }

    setCouponState({ type: "error", text: "Invalid coupon code. Try AQUA10." });
  };

  const handleSubmitOrder = async () => {
    const hasRequiredCustomerInfo = customer.fullName || billingDetails.fullName;
    const hasRequiredAddress = billingDetails.addressLine1 && billingDetails.city && billingDetails.state && billingDetails.pincode;

    if (!selectedMethod) {
      setOrderStatus({ type: "error", text: "Please select a payment method." });
      return;
    }

    if (!hasRequiredCustomerInfo || !hasRequiredAddress) {
      setOrderStatus({ type: "error", text: "Please fill in the required customer and delivery details." });
      return;
    }

    setIsSubmitting(true);
    setOrderStatus({ type: "", text: "" });

    const finalOrder = {
      ...order,
      paymentMethod: selectedMethod,
      customer: {
        ...(order.customer ?? {}),
        fullName: customer.fullName || billingDetails.fullName,
        phoneNumber: customer.phoneNumber || billingDetails.phoneNumber,
      },
      deliveryAddress: {
        ...(order.deliveryAddress ?? {}),
        addressLine1: billingDetails.addressLine1,
        addressLine2: billingDetails.addressLine2,
        city: billingDetails.city,
        state: billingDetails.state,
        pincode: billingDetails.pincode,
        country: billingDetails.country,
        addressType: deliveryAddress.addressType || "Home",
      },
      pricing,
      couponCode: coupon.trim() || "",
    };

    try {
      const logoFile = order.logoFile ?? (order.logo instanceof File ? order.logo : dataUrlToFile(order.logoDataUrl || order.logo, order.logoFileName));
      const formData = new FormData();
      formData.append("userId", user?._id || "");
      formData.append("bottleType", finalOrder.bottleType || "");
      formData.append("quantity", String(quantity || ""));
      formData.append("specialInstructions", finalOrder.specialInstructions || "");
      formData.append("brandName", finalOrder.brandName || "");
      formData.append("printing", finalOrder.printing || "");
      formData.append("paymentMethod", selectedMethod);
      formData.append("customerName", finalOrder.customer.fullName || "");
      formData.append("customerPhone", finalOrder.customer.phoneNumber || "");
      formData.append("addressLine1", finalOrder.deliveryAddress.addressLine1 || "");
      formData.append("addressLine2", finalOrder.deliveryAddress.addressLine2 || "");
      formData.append("city", finalOrder.deliveryAddress.city || "");
      formData.append("state", finalOrder.deliveryAddress.state || "");
      formData.append("pincode", finalOrder.deliveryAddress.pincode || "");
      formData.append("country", finalOrder.deliveryAddress.country || "India");
      formData.append("totalAmount", String(pricing.total ?? ""));

      const apiUrl = "http://localhost:5000/api/orders/payment/create-order";
      if (logoFile instanceof File) {
        formData.append("logo", logoFile, logoFile.name);
      } else if (typeof order.logo === "string" && order.logo) {
        formData.append("logoUrl", order.logo);
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to start payment.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Payment checkout could not be loaded. Please check your connection and try again.");
      }

      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: result.razorpay.keyId,
          amount: result.razorpay.amount,
          currency: result.razorpay.currency,
          name: "AquaBrand",
          description: `${bottleType} customized bottle order`,
          order_id: result.razorpay.orderId,
          prefill: {
            name: finalOrder.customer.fullName,
            email: customer.email,
            contact: finalOrder.customer.phoneNumber,
          },
          notes: { paymentMethod: selectedMethod },
          handler: async (paymentResponse) => {
            try {
              const verificationResponse = await fetch("http://localhost:5000/api/orders/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentResponse),
              });
              const verificationResult = await verificationResponse.json();
              if (!verificationResponse.ok || !verificationResult.success) {
                throw new Error(verificationResult.message || "Payment verification failed.");
              }

              const paidOrder = verificationResult.order;
              const successOrder = {
                ...finalOrder,
                orderId: paidOrder?._id,
                pricing: paidOrder?.pricing || finalOrder.pricing,
                paymentMethod: selectedMethod,
                paymentStatus: paidOrder?.paymentStatus || "paid",
                razorpayPaymentId: paidOrder?.razorpayPaymentId,
              };
              saveOrderToSession({ ...successOrder, logo: undefined });
              navigate("/order-successful", { state: { order: successOrder } });
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled before completion.")),
          },
        });

        checkout.on("payment.failed", (error) => {
          reject(new Error(error?.error?.description || "Payment failed. Please try another method."));
        });
        checkout.open();
      });
    } catch (error) {
      setOrderStatus({
        type: "error",
        text: error.message || "Unable to complete payment right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentBadge = (optionId) => {
    const bij = {
      upi: "UPI",
      card: "VISA",
      netbanking: "Bank",
      wallet: "Paytm",
      banktransfer: "NEFT",
    };

    if (optionId === "card") {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          <span className="text-[10px]">VISA</span>
          <span className="text-[10px]">MC</span>
          <span className="text-[10px]">RuPay</span>
        </div>
      );
    }

    if (optionId === "wallet") {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          <span>Paytm</span>
          <span>GPay</span>
        </div>
      );
    }

    if (optionId === "banktransfer") {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          <span>NEFT</span>
          <span>RTGS</span>
        </div>
      );
    }

    return (
      <div className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        {bij[optionId]}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            {[{ step: 1, label: "Customize Order", complete: true }, { step: 2, label: "Delivery Details", complete: true }, { step: 3, label: "Payment", active: true }].map((item, index) => (
              <div key={item.step} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${item.active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600"}`}>
                    {item.complete && !item.active ? <Check size={14} /> : item.step}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <p className={`text-xs font-semibold ${item.active ? "text-blue-700" : "text-slate-600"}`}>{item.label}</p>
                    {item.step === 3 ? <p className="text-[11px] text-slate-500">Complete your order</p> : null}
                  </div>
                </div>

                {index < 2 ? <div className="hidden h-0.5 flex-1 bg-slate-200 sm:block" /> : null}
                {index < 2 ? <div className="hidden h-0.5 w-5 rounded-full bg-emerald-500 sm:block" /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-[26px] font-semibold tracking-[-0.04em] text-slate-900">Payment Details</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose your preferred payment method and complete your order</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Wallet size={16} />
                  </div>
                  Choose Payment Method
                </div>

                <div className="space-y-3">
                  {paymentOptions.map((option) => {
                    const isSelected = selectedMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedMethod(option.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-blue-400 bg-blue-50/80 shadow-[0_14px_35px_-24px_rgba(37,99,235,0.65)]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"}`}>
                          {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-900">{option.label}</p>
                              <p className="text-sm text-slate-500">{option.subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {option.id === "upi" ? (
                                <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-bold uppercase text-blue-700">
                                  <span>UPI</span>
                                  <span>QR</span>
                                </div>
                              ) : null}
                              {option.id === "card" ? renderPaymentBadge(option.id) : null}
                              {option.id === "netbanking" ? (
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                                  <Landmark size={18} />
                                </div>
                              ) : null}
                              {option.id === "wallet" ? renderPaymentBadge(option.id) : null}
                              {option.id === "banktransfer" ? renderPaymentBadge(option.id) : null}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[20px] font-semibold text-slate-900">Billing Information</h3>
                  <p className="mt-1 text-sm text-slate-500">Billing details are same as delivery address</p>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={sameAsDelivery}
                  onChange={() => setSameAsDelivery((prev) => !prev)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Same as delivery address
              </label>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{billingDetails.fullName || customer.fullName || "Address unavailable"}</p>
                    <p className="text-sm text-slate-500">{billingDetails.phoneNumber || customer.phoneNumber}</p>
                  </div>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                    Edit
                  </button>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <p>{billingDetails.addressLine1 || deliveryAddress.addressLine1}</p>
                  <p>{billingDetails.addressLine2 || deliveryAddress.addressLine2}</p>
                  <p>
                    {billingDetails.city || deliveryAddress.city}{(billingDetails.city || deliveryAddress.city) && (billingDetails.state || deliveryAddress.state) ? ", " : ""}{billingDetails.state || deliveryAddress.state}{billingDetails.pincode || deliveryAddress.pincode ? ` - ${billingDetails.pincode || deliveryAddress.pincode}` : ""}
                  </p>
                  <p>{billingDetails.country || deliveryAddress.country}</p>
                </div>
              </div>

              {!sameAsDelivery ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={billingForm.fullName}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      placeholder="Full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.phoneNumber}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                      placeholder="Phone number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.addressLine1}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
                      placeholder="Address line 1"
                      className="sm:col-span-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.addressLine2}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
                      placeholder="Address line 2"
                      className="sm:col-span-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.city}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, city: event.target.value }))}
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.state}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, state: event.target.value }))}
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.pincode}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, pincode: event.target.value }))}
                      placeholder="Pincode"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={billingForm.country}
                      onChange={(event) => setBillingForm((prev) => ({ ...prev, country: event.target.value }))}
                      placeholder="Country"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Use different billing address</span>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-7">
              <div className="mb-4">
                <p className="text-[15px] font-semibold text-slate-900">Have a Coupon?</p>
                <p className="mt-1 text-sm text-slate-500">Enter coupon code to get discounts</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleCouponApply}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>

              {couponState.text ? (
                <p className={`mt-3 text-sm ${couponState.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                  {couponState.text}
                </p>
              ) : null}
            </section>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_35px_-18px_rgba(37,99,235,0.8)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isSubmitting ? "Processing..." : "Pay Securely & Place Order"}
                <ArrowRight size={18} />
              </button>

              {orderStatus.text ? (
                <p className={`text-center text-sm ${orderStatus.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                  {orderStatus.text}
                </p>
              ) : null}

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <LockKeyhole size={14} className="text-slate-500" />
                Your payment information is secure and encrypted
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ShoppingBag size={18} />
                  </div>
                  <h2 className="text-[26px] font-semibold tracking-[-0.04em] text-slate-900">Order Summary</h2>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-24 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <img src="/image.png" alt="Bottle" className="h-full w-full object-contain" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[22px] font-semibold text-slate-900">{bottleType} Bottle</p>
                  <p className="mt-1 text-sm text-slate-500">Standard</p>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Brand: <span className="font-semibold text-slate-800">{brandName}</span></p>
                    <p>Quantity: <span className="font-semibold text-slate-800">{quantity} Bottles</span></p>
                    <p>Printing: <span className="font-semibold text-slate-800">{printing || "Unavailable"}</span></p>
                    <p>Instructions: <span className="font-semibold text-slate-800">{instructions || "None"}</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between gap-3">
                    <span>Unit Price</span>
                    <span className="font-medium text-slate-800">{formatMoney(pricing.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-800">{formatMoney(pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Shipping</span>
                    <span className="font-medium text-slate-800">{formatMoney(pricing.shipping)}</span>
                  </div>
                </div>

                <div className="my-4 border-t border-slate-200" />

                <div className="flex items-center justify-between gap-3 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(pricing.total)}</span>
                </div>

                <p className="mt-3 text-xs text-slate-500">Inclusive of all taxes</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <MapPin size={18} />
                  </div>
                  <h3 className="text-[20px] font-semibold text-slate-900">Delivery Address</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/delivery-details", {
                    state: {
                      orderData: order,
                      address: deliveryAddress,
                      addressMode: "edit",
                    },
                  })}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{addressLoading ? "Loading address..." : customer.fullName || "Address unavailable"}</p>
                    <p>{customer.phoneNumber}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                    {deliveryAddress.addressType || "Unavailable"}
                  </span>
                </div>

                <div>
                  <p>{deliveryAddress.addressLine1}</p>
                  <p>{deliveryAddress.addressLine2}</p>
                  <p>
                    {deliveryAddress.city}{deliveryAddress.city && deliveryAddress.state ? ", " : ""}{deliveryAddress.state}{deliveryAddress.pincode ? ` - ${deliveryAddress.pincode}` : ""}
                  </p>
                  <p>{deliveryAddress.country}</p>
                </div>
              </div>

              {addressError ? <p className="mt-3 text-sm text-red-500">{addressError}</p> : null}
              <button
                type="button"
                onClick={() => navigate("/delivery-details", {
                  state: { orderData: order, addressMode: "different" },
                })}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Use different delivery address
              </button>

              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">Expected Delivery</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">5 - 7 business days</p>
                    <p className="mt-1 text-xs text-slate-500">You will receive an email & SMS with tracking details</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-6">
              <h3 className="text-[20px] font-semibold text-slate-900">Why Choose Us?</h3>
              <div className="mt-5 space-y-4">
                {whyChooseUs.map(({ title, text, icon: Icon }) => {
                  const ItemIcon = Icon;
                  return (
                  <div key={title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <ItemIcon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">{text}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 rounded-[24px] border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustItems.map(({ title, subtitle, icon: Icon }) => {
              const ItemIcon = Icon;
              return (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ItemIcon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
