import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  House,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

const initialForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  addressType: "home",
  deliveryInstructions: "",
  saveAddress: false,
};

const stateOptions = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100";

function saveOrderToSession(order) {
  try {
    sessionStorage.setItem("aquaBrandOrder", JSON.stringify(order));
  } catch {
    return;
  }
}

export default function DeliveryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();

  const previousOrder = useMemo(() => {
    const routeOrder = location.state?.orderData ?? null;
    if (routeOrder) return routeOrder;

    try {
      const saved = sessionStorage.getItem("aquaBrandDraftOrder");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, [location.state]);

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [addressId, setAddressId] = useState(location.state?.address?._id || "");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (!user?._id || !token) return;

    const applyAddress = (address) => {
      if (!address) return;
      setAddressId(address._id || "");
      setFormData((previous) => ({
        ...previous,
        fullName: address.fullName || "",
        phoneNumber: address.phoneNumber || "",
        email: address.email || "",
        addressLine1: address.addressLine1 || "",
        addressLine2: address.addressLine2 || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "India",
        addressType: address.addressType || "home",
        deliveryInstructions: address.deliveryInstructions || "",
      }));
    };

    if (location.state?.addressMode === "different") {
      setIsLoadingAddress(false);
      return;
    }

    if (location.state?.address) {
      applyAddress(location.state.address);
      return;
    }

    setIsLoadingAddress(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/addresses/${user._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => applyAddress(data?.address))
      .catch((error) => setErrors({ form: error.message }))
      .finally(() => setIsLoadingAddress(false));
  }, [location.state?.address, location.state?.addressMode, token, user?._id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    const phone = formData.phoneNumber.trim();
    if (!phone) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (!/^(?:\+91|91|0)?[6-9]\d{9}$/.test(phone)) {
      nextErrors.phoneNumber = "Please enter a valid Indian phone number.";
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.addressLine1.trim()) {
      nextErrors.addressLine1 = "Address line 1 is required.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      nextErrors.state = "State is required.";
    }

    if (!formData.pincode.trim()) {
      nextErrors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      nextErrors.pincode = "Pincode should be a valid 6-digit Indian pincode.";
    }

    if (!formData.country.trim()) {
      nextErrors.country = "Country is required.";
    }

    if (!formData.addressType) {
      nextErrors.addressType = "Please select an address type.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!user?._id || !token) {
      setErrors({ form: "Please log in before saving a delivery address." });
      return;
    }

    setIsSavingAddress(true);

    const addressData = {
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
      addressLine1: formData.addressLine1.trim(),
      addressLine2: formData.addressLine2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      country: formData.country.trim(),
      addressType: formData.addressType,
      deliveryInstructions: formData.deliveryInstructions.trim(),
    };

    try {
      const response = await fetch(
        addressId
          ? `${import.meta.env.VITE_API_URL}/api/addresses/${addressId}`
          : `${import.meta.env.VITE_API_URL}/api/addresses`,
        {
          method: addressId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressData),
        }
      );
      const result = await response.json();
      if (response.status === 401) {
        logout();
        navigate("/login", {
          state: { message: "Your session expired. Please log in again to continue." },
        });
        return;
      }
      if (!response.ok || !result.address) {
        throw new Error(result.message || "Unable to save delivery address.");
      }

      const completeOrder = {
      bottleType: previousOrder.bottleType ?? "",
      quantity: previousOrder.quantity ?? "",
      printing: previousOrder.printing ?? "",
      brandName: previousOrder.brandName ?? "",
      userId: user._id,
      logo: previousOrder.logo ?? "",
      logoFileName: previousOrder.logoFileName ?? "",
      specialInstructions: previousOrder.specialInstructions ?? "",
      pricing: previousOrder.pricing ?? {},
      customer: {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
      },
        deliveryAddress: result.address,
      };

      saveOrderToSession(completeOrder);
      navigate("/payment", { state: { order: completeOrder } });
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const instructionLength = formData.deliveryInstructions.length;

  return (
    <main className="min-h-screen bg-white px-4 py-5 sm:px-6 lg:flex lg:items-start lg:justify-center lg:px-8 lg:py-10 xl:px-10 2xl:px-12">
      <div className="mx-auto w-full max-w-[540px] lg:max-w-5xl xl:max-w-5xl 2xl:max-w-6xl lg:rounded-[28px] lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-[0_26px_80px_-42px_rgba(15,23,42,0.2)] xl:p-7 2xl:p-8">
        <div className="pt-1 lg:pt-0">
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[30px] lg:text-[32px] xl:text-[34px] 2xl:text-[36px]">
            DELIVERY DETAILS
          </h1>
          <p className="mt-2 text-[13px] text-slate-500 lg:text-[14px]">
            Please provide the address where you want your order delivered
          </p>
        </div>

        <div className="mt-4 border-t border-slate-200 lg:mt-5" />

        <form onSubmit={handleSubmit} className="mt-4 space-y-5 lg:mt-6 lg:space-y-6">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <CircleUserRound size={16} />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-800">Contact Information</h2>
            </div>

            <div className="space-y-4 lg:space-y-5">
              <div className="lg:grid lg:grid-cols-2 lg:gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(event) => handleInputChange("fullName", event.target.value)}
                    placeholder="Enter your full name"
                    className={fieldClass}
                  />
                  {errors.fullName ? (
                    <p className="mt-1 text-[11px] text-red-500">{errors.fullName}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Phone Number</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Phone size={14} />
                    </span>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(event) => handleInputChange("phoneNumber", event.target.value)}
                      placeholder="Enter your phone number"
                      className={`${fieldClass} pl-9`}
                    />
                  </div>
                  {errors.phoneNumber ? (
                    <p className="mt-1 text-[11px] text-red-500">{errors.phoneNumber}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Email Address (Optional)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange("email", event.target.value)}
                    placeholder="Enter your email address"
                    className={`${fieldClass} pl-9`}
                  />
                </div>
                {errors.email ? (
                  <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200" />

          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <MapPin size={16} />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-800">Delivery Address</h2>
            </div>

            <div className="space-y-4 lg:space-y-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Address Line 1</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(event) => handleInputChange("addressLine1", event.target.value)}
                  placeholder="House no., Building, Street"
                  className={fieldClass}
                />
                {errors.addressLine1 ? (
                  <p className="mt-1 text-[11px] text-red-500">{errors.addressLine1}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(event) => handleInputChange("addressLine2", event.target.value)}
                  placeholder="Apartment, Suite, Landmark, etc."
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-slate-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(event) => handleInputChange("city", event.target.value)}
                    placeholder="Enter your city"
                    className={fieldClass}
                  />
                  {errors.city ? <p className="mt-1 text-[11px] text-red-500">{errors.city}</p> : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-slate-700">State</label>
                  <select
                    value={formData.state}
                    onChange={(event) => handleInputChange("state", event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Enter your state</option>
                    {stateOptions.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                  {errors.state ? (
                    <p className="mt-1 text-[11px] text-red-500">{errors.state}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Pincode</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(event) => handleInputChange("pincode", event.target.value.replace(/\D/g, ""))}
                    placeholder="Enter pincode"
                    className={fieldClass}
                  />
                  {errors.pincode ? (
                    <p className="mt-1 text-[11px] text-red-500">{errors.pincode}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Country</label>
                  <select
                    value={formData.country}
                    onChange={(event) => handleInputChange("country", event.target.value)}
                    className={fieldClass}
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                  {errors.country ? (
                    <p className="mt-1 text-[11px] text-red-500">{errors.country}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200" />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <MapPin size={16} />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-800">Address Type</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-4">
              {[
                {
                  value: "home",
                  label: "HOME",
                  description: "Deliver to home address",
                  icon: House,
                },
                {
                  value: "work",
                  label: "WORK",
                  description: "Deliver to work address",
                  icon: BriefcaseBusiness,
                },
              ].map((option) => {
                const Icon = option.icon;
                const selected = formData.addressType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange("addressType", option.value)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold tracking-[0.08em] text-slate-800">
                        {option.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{option.description}</div>
                    </div>
                    {selected ? (
                      <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check size={12} />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {errors.addressType ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.addressType}</p>
            ) : null}
          </section>

          <div className="border-t border-slate-200" />

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <MapPin size={16} />
                </div>
                <h2 className="text-[15px] font-semibold text-slate-800">Delivery Instructions (Optional)</h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">{instructionLength}/200</span>
            </div>

            <textarea
              value={formData.deliveryInstructions}
              onChange={(event) =>
                handleInputChange(
                  "deliveryInstructions",
                  event.target.value.slice(0, 200)
                )
              }
              placeholder="Any special instructions for delivery"
              className="min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
            />
          </section>

          <label className="flex items-center gap-3 text-[13px] text-slate-700">
            <input
              type="checkbox"
              checked={formData.saveAddress}
              onChange={(event) => handleInputChange("saveAddress", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Save this address for future orders
          </label>

          <button
            type="submit"
            className="mt-2 flex h-[46px] w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:mt-3 lg:h-[50px] lg:text-[15px] lg:shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
          >
            {isLoadingAddress || isSavingAddress ? "Saving address..." : "Continue to Payment"} <span className="ml-1">→</span>
          </button>
          {errors.form ? <p className="text-center text-sm text-red-500">{errors.form}</p> : null}
        </form>
      </div>
    </main>
  );
}
