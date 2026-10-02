import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  CheckCircle2,
  CloudUpload,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

const AnimatedDiv = motion.div;

function readSavedDraft() {
  try {
    return JSON.parse(sessionStorage.getItem("aquaBrandDraftOrder") || "null") || {};
  } catch {
    return {};
  }
}

function saveSessionValue(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function saveDraft(draft) {
  saveSessionValue("aquaBrandDraftOrder", draft);
}

export default function OrderBottle() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const readerRef = useRef(null);
  const latestLogoRequestRef = useRef(0);
  
  // Selection states - initialize as empty/null (no default selection)
  const [savedDraft] = useState(readSavedDraft);
  const [selectedType, setSelectedType] = useState(savedDraft.bottleType || null);
  const [selectedQuantity, setSelectedQuantity] = useState(savedDraft.quantity && !savedDraft.isCustomQuantity ? String(savedDraft.quantity) : null);
  const [customQuantity, setCustomQuantity] = useState(savedDraft.isCustomQuantity ? String(savedDraft.quantity) : "");
  const [instructions, setInstructions] = useState(savedDraft.specialInstructions || "");
  const [logoPreview, setLogoPreview] = useState(savedDraft.logoDataUrl || "");
  const [logoFileName, setLogoFileName] = useState(savedDraft.logoFileName || "");
  const [logoError, setLogoError] = useState("");
  const [logoProcessing, setLogoProcessing] = useState(false);
  const [brandName, setBrandName] = useState(savedDraft.brandName || "");

  // Pricing states
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);
  const [savedAddress, setSavedAddress] = useState(null);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);

  // Bottle type definitions - CORRECTED to match backend prices
  const bottleTypes = [
    { id: "250ml", label: "250ml", subtitle: "Standard" },
    { id: "500ml", label: "500ml", subtitle: "Premium" },
    { id: "1000ml", label: "1000ml", subtitle: "Large" },
    { id: "2000ml", label: "2000ml", subtitle: "Extra Large" },
  ];

  const quantities = [
    { id: "100", label: "100 Bottles" },
    { id: "250", label: "250 Bottles" },
    { id: "500", label: "500 Bottles" },
    { id: "1000", label: "1000 Bottles" },
    { id: "custom", label: "Custom Entry" },
  ];

  useEffect(() => {
    if (!user?._id || !token) return;

    setAddressLookupLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/addresses/${user._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setSavedAddress(data?.address ?? null))
      .catch(() => setSavedAddress(null))
      .finally(() => setAddressLookupLoading(false));
  }, [token, user?._id]);

  // Fetch pricing from backend whenever bottle type or quantity changes
  const fetchPricing = async (bottleType, quantity) => {
    setPricingLoading(true);
    setPricingError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/calculate-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bottleType,
          quantity: Number(quantity),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPricing(data.pricing);
      } else {
        setPricingError(data.message);
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      setPricingError("Unable to calculate price. Please try again.");
    } finally {
      setPricingLoading(false);
    }
  };

  // Recalculate only when the selected bottle or effective quantity changes.
  useEffect(() => {
    if (!selectedType || !selectedQuantity) return;
    const quantity = selectedQuantity === "custom" ? customQuantity : selectedQuantity;
    if (!quantity) return;
    fetchPricing(selectedType, quantity);
  }, [customQuantity, selectedQuantity, selectedType]);

  useEffect(() => {
    saveDraft({
      bottleType: selectedType,
      quantity: selectedQuantity === "custom" ? Number(customQuantity) : Number(selectedQuantity || 0),
      isCustomQuantity: selectedQuantity === "custom",
      brandName: brandName.trim(),
      logoDataUrl: logoPreview.length < 4_000_000 ? logoPreview : "",
      logoFileName,
      specialInstructions: instructions,
    });
  }, [brandName, customQuantity, instructions, logoFileName, logoPreview, selectedQuantity, selectedType]);

  useEffect(() => () => readerRef.current?.abort(), []);

  const removeWhiteBackground = (image) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return image.src;

    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    const visited = new Uint8Array(width * height);
    const queue = [];
    const isBackgroundPixel = (pixelIndex) => {
      const red = data[pixelIndex];
      const green = data[pixelIndex + 1];
      const blue = data[pixelIndex + 2];
      return red > 215 && green > 215 && blue > 215 && Math.max(red, green, blue) - Math.min(red, green, blue) < 35;
    };

    const enqueue = (x, y) => {
      const position = y * width + x;
      if (visited[position]) return;
      visited[position] = 1;
      const pixelIndex = position * 4;
      if (data[pixelIndex + 3] > 0 && isBackgroundPixel(pixelIndex)) {
        queue.push(position);
      }
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (let y = 1; y < height - 1; y += 1) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    for (let index = 0; index < queue.length; index += 1) {
      const position = queue[index];
      const x = position % width;
      const y = Math.floor(position / width);
      data[position * 4 + 3] = 0;

      if (x > 0) enqueue(x - 1, y);
      if (x < width - 1) enqueue(x + 1, y);
      if (y > 0) enqueue(x, y - 1);
      if (y < height - 1) enqueue(x, y + 1);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const handleRemoveLogo = () => {
    latestLogoRequestRef.current += 1;
    if (readerRef.current) {
      readerRef.current.abort();
      readerRef.current = null;
    }
    setLogoPreview("");
    setLogoFileName("");
    setLogoError("");
    setLogoProcessing(false);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg", "webp", "svg"];
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      setLogoError("Please choose a PNG, JPG, JPEG, WEBP, or SVG logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Your logo must be smaller than 5MB.");
      return;
    }

    const requestId = ++latestLogoRequestRef.current;
    setLogoError("");
    setLogoFileName(file.name);
    setLogoProcessing(true);

    if (readerRef.current) {
      readerRef.current.abort();
    }

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const image = new Image();
      image.onload = () => {
        if (requestId !== latestLogoRequestRef.current) {
          return;
        }

        const processed = removeWhiteBackground(image);
        setLogoPreview(processed);
        setLogoProcessing(false);
      };

      image.onerror = () => {
        if (requestId !== latestLogoRequestRef.current) {
          return;
        }

        setLogoError("Unable to process this image. Please try another image.");
        setLogoProcessing(false);
      };

      image.src = dataUrl;
    };

    reader.onerror = () => {
      if (requestId !== latestLogoRequestRef.current) return;
      setLogoError("Unable to process this image. Please try another image.");
      setLogoProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const normalizedBrandName = brandName.trim() || "YOUR BRAND";
  const quantity = selectedQuantity === "custom" ? Number(customQuantity) : Number(selectedQuantity || 0);

  const quantityLabel = selectedQuantity === "custom" ? (customQuantity ? `${customQuantity} Bottles` : "Enter quantity") : (selectedQuantity ? `${selectedQuantity} Bottles` : "");
  const instructionsCount = instructions.length;

  // Format currency for display
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₹0";
    return `₹${value.toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            

            <div className="grid gap-6 rounded-[28px] bg-white p-6 shadow-[0_28px_80px_-30px_rgba(15,23,42,0.15)] sm:p-8">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 px-5 py-5 sm:px-6 sm:py-6">
                <div className="mb-6 flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Step 1</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">Choose Bottle Type</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-3xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
                    Selected option
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {bottleTypes.map((item) => {
                    const isSelected = item.id === selectedType;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedType(item.id)}
                        className={`group relative flex flex-col items-center gap-4 rounded-3xl border p-5 text-left transition ${
                          isSelected
                            ? "border-blue-400 bg-blue-50/70 shadow-[0_18px_60px_-30px_rgba(59,130,246,0.45)]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100">
                          <div className="h-20 w-12 rounded-[24px] bg-gradient-to-b from-slate-200 via-slate-100 to-white shadow-inner" />
                          <span className="absolute -right-2 -top-2 text-blue-600">
                            {isSelected ? "✔" : ""}
                          </span>
                        </div>
                        <div className="space-y-1 text-left">
                          <p className="text-lg font-semibold text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 px-5 py-5 sm:px-6 sm:py-6">
                <div className="mb-6 flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Step 2</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">Choose Quantity</h2>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
                    {quantityLabel}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {quantities.map((option) => {
                    const isSelected = option.id === selectedQuantity;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => setSelectedQuantity(option.id)}
                        className={`group flex items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? "border-blue-400 bg-blue-50/70 shadow-[0_14px_45px_-18px_rgba(59,130,246,0.45)]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{option.label}</p>
                          {option.id === "custom" ? (
                            <p className="mt-1 text-sm text-slate-500">Enter qty</p>
                          ) : null}
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <CheckCircle2 size={18} />
                        </div>
                      </button>
                    );
                  })}
                  {selectedQuantity === "custom" ? (
                    <div className="col-span-full mt-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <label className="text-sm font-medium text-slate-700">Custom bottle quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={customQuantity}
                        onChange={(event) => setCustomQuantity(Number(event.target.value))}
                        className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-1 ring-transparent transition focus:border-blue-400 focus:ring-blue-100"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-6 sm:px-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Step 3</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Customize Your Bottle</h2>
                  </div>
                </div>
                <div className="mb-5">
                  <label htmlFor="brand-name" className="mb-2 block text-sm font-semibold text-slate-700">Brand Name</label>
                  <input
                    id="brand-name"
                    type="text"
                    maxLength={30}
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value.replace(/\s+/g, " ").slice(0, 30))}
                    onBlur={() => setBrandName((value) => value.trim())}
                    placeholder="Enter your brand name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">This name will appear live on your bottle preview.</p>
                </div>
                <label className="group flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-slate-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-600 shadow-sm">
                    <CloudUpload size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Click to upload your logo</p>
                    <p className="mt-2 text-sm text-slate-500">PNG, JPG, WEBP or SVG (Max. 5MB)</p>
                  </div>
                  <p className="text-xs text-slate-400">Best results with transparent background</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {logoProcessing ? (
                  <p className="mt-3 text-sm font-medium text-blue-700" role="status">Processing your logo...</p>
                ) : null}
                {logoError ? <p className="mt-3 text-sm text-red-600" role="alert">{logoError}</p> : null}
                {logoFileName ? <p className="mt-3 text-sm text-slate-500">Selected file: {logoFileName}</p> : null}
                {logoPreview ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="mt-3 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-600"
                  >
                    Remove Logo
                  </button>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 px-5 py-5 sm:px-6 sm:py-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Step 4</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Add Special Instructions</h2>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                    {instructionsCount}/200
                  </span>
                </div>
                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value.slice(0, 200))}
                  placeholder="Enter any special instructions..."
                  className="min-h-[160px] w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Review customization</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Bottle type: <span className="font-medium text-slate-900">{selectedType || "Not selected"}</span></p>
                    <p>Bottle size: <span className="font-medium text-slate-900">{selectedType || "Not selected"}</span></p>
                    <p>Quantity: <span className="font-medium text-slate-900">{quantity || "Not selected"}</span></p>
                    <p>Brand name: <span className="font-medium text-slate-900">{normalizedBrandName}</span></p>
                    <p>Logo status: <span className="font-medium text-slate-900">{logoPreview ? "Logo uploaded" : "No logo uploaded"}</span></p>
                    <p>Printing: <span className="font-medium text-slate-900">Single Color Logo</span></p>
                  </div>
                  {pricing ? <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">Subtotal: <span className="font-semibold text-slate-900">{formatCurrency(pricing.subtotal)}</span> · Total: <span className="font-semibold text-slate-900">{formatCurrency(pricing.total)}</span></div> : null}
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Step 5</p>
                <p className="mt-2 text-sm text-slate-600">Review your customization, then continue to delivery and secure checkout.</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={!pricing || pricingError || addressLookupLoading}
                  onClick={() => {
                    const orderData = {
                      bottleType: selectedType,
                      quantity,
                      isCustomQuantity: selectedQuantity === "custom",
                      printing: "Single Color Logo",
                      brandName: brandName.trim(),
                      logo: logoPreview,
                      logoFileName,
                      specialInstructions: instructions,
                      pricing: pricing,
                      userId: user?._id,
                    };
                    saveDraft(orderData);

                    if (savedAddress) {
                      const orderWithAddress = {
                        ...orderData,
                        deliveryAddress: savedAddress,
                        customer: {
                          fullName: savedAddress.fullName,
                          phoneNumber: savedAddress.phoneNumber,
                          email: savedAddress.email,
                        },
                      };
                      saveSessionValue("aquaBrandOrder", orderWithAddress);
                      navigate("/payment", { state: { order: orderWithAddress } });
                      return;
                    }

                    navigate("/delivery-details", { state: { orderData } });
                  }}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-300/30 transition hover:scale-[1.01] hover:shadow-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place Order
                </button>
                <button type="button" disabled={!pricing || !selectedType || !selectedQuantity} onClick={() => addItem({ bottleType: selectedType, quantity, brandName: brandName.trim(), logo: logoPreview, printing: "Single Color Logo", specialInstructions: instructions, pricing })} className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
                  <ShoppingCart size={18} className="mr-2 text-blue-600" />Add to Cart
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.16)] sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Preview</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">Live order preview</h2>
                </div>
                
              </div>
                  <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-[32px] bg-slate-50 p-6 sm:min-h-[200px] lg:min-h-[280px]">
                
                <AnimatedDiv
                  animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [-0.5, 0.5, -0.5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <img src="/preview.png" alt="Bottle preview" className="relative h-[380px] w-auto max-w-full object-contain drop-shadow-[0_25px_45px_rgba(37,99,235,0.18)] sm:h-[330px] lg:h-[460px]" />
                  <AnimatedDiv
                    animate={reduceMotion ? undefined : { opacity: [0.2, 0.5, 0.2], x: ["-120%", "120%"] }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-y-8 left-1/4 z-[15] w-8 rotate-12 bg-white/35 blur-md"
                  />
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Uploaded logo printed on the bottle label"
                      className="pointer-events-none absolute left-1/2 top-[49%] z-20 h-auto w-[40%] max-h-[41%] max-w-[238px] -translate-x-1/2 -translate-y-1/2 object-contain"
                    />
                  ) : null}
                </AnimatedDiv>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.14)] sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Order Summary</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {pricingLoading ? "Calculating..." : pricing?.total ? formatCurrency(pricing.total) : ""}
                </span>
              </div>

              {!selectedType || !selectedQuantity ? (
                <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-center text-sm text-slate-600">
                  <p>Select bottle type and quantity to see pricing</p>
                </div>
              ) : pricingError ? (
                <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm text-red-700">
                  <p>⚠️ {pricingError}</p>
                </div>
              ) : pricingLoading ? (
                <div className="mt-6 rounded-3xl bg-blue-50 p-4 text-center text-sm text-blue-700">
                  <p>Calculating price...</p>
                </div>
              ) : pricing ? (
                <>
                  <div className="space-y-4 pt-6 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Bottle Type</span>
                      <span>{pricing.bottleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity</span>
                      <span>{pricing.quantity} Bottles</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Printing</span>
                      <span>Single Color Logo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Price</span>
                      <span>{formatCurrency(pricing.unitPrice)}</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(pricing.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatCurrency(pricing.shipping)}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <span className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Total</span>
                    <span className="text-3xl font-semibold text-slate-900">{formatCurrency(pricing.total)}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">Secure Payment</h3>
                <p className="mt-2 text-sm text-slate-500">100% Secure</p>
              </div>
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-50 text-sky-600 shadow-sm">
                  <Sparkles size={24} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">Premium Quality</h3>
                <p className="mt-2 text-sm text-slate-500">FDA Approved</p>
              </div>
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-sm">
                  <Truck size={24} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">Fast Delivery</h3>
                <p className="mt-2 text-sm text-slate-500">5–7 Business Days</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
