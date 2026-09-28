import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleUserRound,
  CreditCard,
  Headphones,
  Home,
  LockKeyhole,
  MapPin,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  Send,
  ShoppingBag,
  Truck,
} from "lucide-react";

const defaultOrder = {
  customerName: "Rahul",
  customerFullName: "Rahul Sharma",
  email: "rahulsharma@email.com",
  orderNumber: "#AB1234567890",
  bottleType: "250ml",
  quantity: 250,
  printing: "Single Color Logo",
  instructions: "Handle with care",
  unitPrice: 5,
  subtotal: 1250,
  shipping: 400,
  total: 1650,
  phone: "+91 98765 43210",
  address: [
    "House No. 123, Street 5, Near Park",
    "Green View Apartment, Sector 15",
    "Faridabad, Haryana - 121001",
    "India",
  ],
  paymentMethod: "UPI / QR Code",
  paymentDate: "31 May 2025, 11:45 AM",
};

const progressSteps = ["Customize Order", "Delivery Details", "Payment"];

const timelineSteps = [
  { title: "Order Confirmed", text: "We have received your order", icon: CheckCircle2 },
  { title: "Processing", text: "We are customizing your bottles", icon: PackageOpen },
  { title: "Shipped", text: "Your order will be shipped soon", icon: Send },
  { title: "Delivered", text: "Enjoy your premium bottles!", icon: PackageCheck },
];

const trustItems = [
  { title: "SSL Secured Checkout", subtitle: "256-bit encryption", icon: LockKeyhole },
  { title: "Easy Returns", subtitle: "Hassle-free returns", icon: RotateCcw },
  { title: "Customer Support", subtitle: "24/7 assistance", icon: Headphones },
  { title: "Trusted by 10,000+ Businesses", subtitle: "Across India", icon: CircleUserRound },
];

function formatMoney(value) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Card({ children, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeading({ icon: Icon, children }) {
  const SectionIcon = Icon;
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <SectionIcon size={19} />
      </div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">{children}</h2>
    </div>
  );
}

function DetailRow({ label, value, valueClass = "font-medium text-slate-800" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
      <span>{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function OrderSuccessfull() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeOrder = location.state?.order;
  const order = routeOrder
    ? {
        customerName: routeOrder.customer?.fullName || "Customer",
        customerFullName: routeOrder.customer?.fullName || "Customer",
        email: routeOrder.customer?.email || "",
        orderNumber: routeOrder.orderId ? `#${routeOrder.orderId}` : defaultOrder.orderNumber,
        bottleType: routeOrder.bottleType,
        quantity: routeOrder.quantity,
        printing: routeOrder.printing || "Single Color Logo",
        instructions: routeOrder.specialInstructions || "None",
        unitPrice: routeOrder.pricing?.unitPrice || 0,
        subtotal: routeOrder.pricing?.subtotal || 0,
        shipping: routeOrder.pricing?.shipping || 0,
        total: routeOrder.pricing?.total || 0,
        phone: routeOrder.customer?.phoneNumber || "",
        address: [
          routeOrder.deliveryAddress?.addressLine1,
          routeOrder.deliveryAddress?.addressLine2,
          `${routeOrder.deliveryAddress?.city || ""}${routeOrder.deliveryAddress?.state ? `, ${routeOrder.deliveryAddress.state}` : ""}${routeOrder.deliveryAddress?.pincode ? ` - ${routeOrder.deliveryAddress.pincode}` : ""}`,
          routeOrder.deliveryAddress?.country,
        ].filter(Boolean),
        paymentMethod: routeOrder.paymentMethod || "Razorpay",
        paymentDate: new Date().toLocaleString("en-IN"),
      }
    : defaultOrder;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <nav aria-label="Checkout progress" className="mx-auto mb-8 max-w-4xl">
          <div className="flex items-start">
            {progressSteps.map((step, index) => (
              <div key={step} className="flex min-w-0 flex-1 items-start">
                <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm">{index + 1}</div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 sm:text-sm">
                    <span>{step}</span>
                    <Check size={14} className="shrink-0 text-emerald-500" strokeWidth={3} />
                  </div>
                </div>
                {index < progressSteps.length - 1 ? <div className="mt-[18px] h-px flex-1 bg-blue-200" /> : null}
              </div>
            ))}
          </div>
        </nav>

        <Card className="px-5 py-10 text-center sm:px-8 sm:py-14">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50">
            <span className="absolute -left-5 top-6 h-2.5 w-2.5 rotate-45 rounded-sm bg-blue-300" />
            <span className="absolute -right-4 top-9 h-3 w-3 rounded-full bg-amber-300" />
            <span className="absolute bottom-3 left-2 h-2 w-2 rotate-45 rounded-sm bg-emerald-300" />
            <span className="absolute bottom-7 right-1 h-2.5 w-2.5 rotate-45 rounded-sm bg-blue-200" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <Check size={36} strokeWidth={3} />
            </div>
          </div>
          <h1 className="mt-7 text-[30px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[38px]">Order Placed Successfully!</h1>
          <p className="mt-3 text-base text-slate-600">Thank you, {order.customerName}! Your order has been confirmed.</p>
          <p className="mt-2 text-sm text-slate-500">We've received your order and will start processing it right away.</p>
          <div className="mx-auto mt-7 max-w-md rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-slate-700">
            Your order number is <span className="ml-2 font-semibold text-emerald-700">{order.orderNumber}</span>
          </div>
          <button type="button" onClick={() => navigate("/user-profile")} className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Track Your Order <ArrowRight size={17} />
          </button>
          <p className="mt-5 text-xs text-slate-500">A confirmation email has been sent to {order.email}</p>
        </Card>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <SectionHeading icon={ShoppingBag}>Order Summary</SectionHeading>
            <div className="mt-6 flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
                <img src="/image.png" alt="250ml bottle" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold text-slate-900">{order.bottleType} Bottle</p>
                <p className="mt-1 text-sm text-slate-500">Standard</p>
                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <p>Quantity: <span className="font-semibold text-slate-800">{order.quantity} Bottles</span></p>
                  <p>Printing: <span className="font-semibold text-slate-800">{order.printing}</span></p>
                  <p>Instructions: <span className="font-semibold text-slate-800">{order.instructions}</span></p>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
              <DetailRow label={`Unit Price (${order.bottleType})`} value={formatMoney(order.unitPrice)} />
              <DetailRow label="Quantity" value={`${order.quantity} Bottles`} />
              <DetailRow label="Subtotal" value={formatMoney(order.subtotal)} />
              <DetailRow label="Shipping Charges" value={formatMoney(order.shipping)} />
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <span className="text-base font-semibold text-slate-900">Total Amount</span>
              <span className="text-2xl font-semibold text-blue-600 sm:text-3xl">{formatMoney(order.total)}</span>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <SectionHeading icon={MapPin}>Delivery Address</SectionHeading>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{order.customerFullName}</p>
                  <p>{order.phone}</p>
                  <div className="mt-3 space-y-1">
                    {order.address.map((line) => <p key={line}>{line}</p>)}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Home size={13} /> Home</span>
              </div>
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><Truck size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Expected Delivery</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">5 - 7 business days</p>
                    <p className="mt-1 text-xs text-slate-500">You will receive an email & SMS with tracking details</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeading icon={CreditCard}>Payment Information</SectionHeading>
              <div className="mt-5 space-y-4">
                <DetailRow label="Payment Method" value={order.paymentMethod} />
                <DetailRow label="Payment Status" value={<span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Paid</span>} />
                <DetailRow label="Payment Date" value={order.paymentDate} />
              </div>
            </Card>
          </div>
        </div>

        <Card className="mt-8 overflow-hidden">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">What Happens Next?</h2>
            <p className="mt-2 text-sm text-slate-500">We'll keep you updated every step of the way.</p>
          </div>
          <div className="mt-9 grid gap-7 md:grid-cols-4 md:gap-3">
            {timelineSteps.map(({ title, text, icon: Icon }, index) => {
              const ItemIcon = Icon;
              return (
              <div key={title} className="relative text-center md:px-3">
                {index < timelineSteps.length - 1 ? <div className="absolute left-1/2 top-7 hidden w-full border-t border-dashed border-blue-200 md:block" /> : null}
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-white"><ItemIcon size={22} /></div>
                <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
                <p className="mx-auto mt-1 max-w-[180px] text-xs leading-5 text-slate-500">{text}</p>
              </div>
              );
            })}
          </div>
        </Card>

        <Card className="mt-8 px-5 py-9 text-center sm:py-11">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">Thank you for choosing AquaBrand!</h2>
          <p className="mt-2 text-sm text-slate-500">We appreciate your trust in us.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => navigate("/")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"><Home size={17} /> Back to Home</button>
            <button type="button" onClick={() => navigate("/user-profile")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"><ShoppingBag size={17} /> View My Orders</button>
          </div>
        </Card>

        <footer className="mt-8 rounded-[24px] border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustItems.map(({ title, subtitle, icon: Icon }) => {
              const ItemIcon = Icon;
              return (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ItemIcon size={18} /></div>
                <div><p className="text-sm font-semibold text-slate-900">{title}</p><p className="text-xs text-slate-500">{subtitle}</p></div>
              </div>
              );
            })}
          </div>
        </footer>
      </main>
    </div>
  );
}
