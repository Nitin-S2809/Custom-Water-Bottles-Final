import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SupplierSignup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    businessEmail: "",
    phoneNumber: "",
    city: "",
    state: "",
    productionCapacity: "",
    gstNumber: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState({ fssaiCertificate: null, gstCertificate: null });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const normalizedValue = name === "accountNumber" ? value.replace(/\D/g, "").slice(0, 18) : name === "ifscCode" ? value.toUpperCase().slice(0, 11) : value;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : normalizedValue,
    }));
    setValidationErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleDocumentChange = (event) => {
    const { name, files } = event.target;
    const file = files?.[0] || null;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;

    if (file && (!allowedTypes.includes(file.type) || !allowedExtensions.test(file.name))) {
      setDocuments((current) => ({ ...current, [name]: null }));
      setValidationErrors((current) => ({ ...current, [name]: "Choose a PDF, JPG, JPEG, or PNG document." }));
      event.target.value = "";
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setDocuments((current) => ({ ...current, [name]: null }));
      setValidationErrors((current) => ({ ...current, [name]: "File size must be 5 MB or less." }));
      event.target.value = "";
      return;
    }

    setDocuments((current) => ({ ...current, [name]: file }));
    setValidationErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const nextErrors = {};
    if (!/^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u.test(formData.accountHolderName.trim())) nextErrors.accountHolderName = "Enter the account holder's name (at least 2 characters).";
    if (!/^\d{9,18}$/.test(formData.accountNumber)) nextErrors.accountNumber = "Enter a bank account number with 9 to 18 digits.";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim().toUpperCase())) nextErrors.ifscCode = "Enter a valid 11-character IFSC code.";
    if (!documents.fssaiCertificate) nextErrors.fssaiCertificate = "Upload the FSSAI certificate.";
    if (!documents.gstCertificate) nextErrors.gstCertificate = "Upload the GST certificate.";
    setValidationErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    if (!formData.termsAccepted) {
      setError("Please accept the terms and privacy policy");
      return;
    }

    setLoading(true);
    try {
      const signupData = new FormData();
      Object.entries(formData).forEach(([name, value]) => signupData.append(name, String(value)));
      signupData.append("fssaiCertificate", documents.fssaiCertificate);
      signupData.append("gstCertificate", documents.gstCertificate);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/signup`, {
        method: "POST",
        body: signupData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Supplier signup failed");
      }

      login({ user: data.supplier, token: data.token });
      navigate("/login", { state: { message: "Supplier application submitted successfully. Your account is pending admin approval." } });
    } catch (signupError) {
      setError(signupError.message || "Unable to create supplier account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-sky-50 to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center justify-center">
        <section className="w-full rounded-[40px] bg-white/95 p-6 shadow-[0_35px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-10 lg:p-14">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center sm:mb-10">
              <h1 className="  text-3xl font-bold text-slate-900 sm:text-4xl">
                Become a Supplier
              </h1>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                Fill in your details to create your supplier account.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Company Name
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company Name"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Owner Name
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Owner Name"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6" aria-labelledby="bank-details-title">
                <div>
                  <h2 id="bank-details-title" className="text-base font-semibold text-slate-900">Bank Details</h2>
                  <p className="mt-1 text-xs text-slate-500">Used only for supplier payout setup and kept private.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">Account Holder / Account Owner Name
                    <input type="text" name="accountHolderName" autoComplete="name" value={formData.accountHolderName || ""} onChange={handleChange} required minLength={2} maxLength={100} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" aria-invalid={Boolean(validationErrors.accountHolderName)} aria-describedby="account-holder-error" />
                    {validationErrors.accountHolderName ? <span id="account-holder-error" className="mt-1 block text-xs text-red-600">{validationErrors.accountHolderName}</span> : null}
                  </label>
                  <label className="block text-sm font-medium text-slate-700">Bank Account Number
                    <input type="password" name="accountNumber" autoComplete="off" inputMode="numeric" value={formData.accountNumber || ""} onChange={handleChange} required maxLength={18} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" aria-invalid={Boolean(validationErrors.accountNumber)} aria-describedby="account-number-error" />
                    {validationErrors.accountNumber ? <span id="account-number-error" className="mt-1 block text-xs text-red-600">{validationErrors.accountNumber}</span> : null}
                  </label>
                  <label className="block text-sm font-medium text-slate-700">IFSC Code
                    <input type="text" name="ifscCode" autoComplete="off" value={formData.ifscCode || ""} onChange={handleChange} required maxLength={11} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 uppercase text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" aria-invalid={Boolean(validationErrors.ifscCode)} aria-describedby="ifsc-code-error" />
                    {validationErrors.ifscCode ? <span id="ifsc-code-error" className="mt-1 block text-xs text-red-600">{validationErrors.ifscCode}</span> : null}
                  </label>
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="required-documents-title">
                <div>
                  <h2 id="required-documents-title" className="text-base font-semibold text-slate-900">Required Documents</h2>
                  <p className="mt-1 text-xs text-slate-500">PDF, JPG, JPEG, or PNG; maximum 5 MB each.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[{ name: "fssaiCertificate", label: "FSSAI Certificate" }, { name: "gstCertificate", label: "GST Certificate" }].map(({ name, label }) => (
                    <label key={name} className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                      {label}
                      <input type="file" name={name} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleDocumentChange} required className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100" aria-invalid={Boolean(validationErrors[name])} aria-describedby={`${name}-error`} />
                      <span className="mt-2 block truncate text-xs text-slate-500">{documents[name]?.name || "No document selected"}</span>
                      {validationErrors[name] ? <span id={`${name}-error`} className="mt-1 block text-xs text-red-600">{validationErrors[name]}</span> : null}
                    </label>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Business Email
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="Business Email"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Phone Number
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  City
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  State
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-3 w-full appearance-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Select State
                    </option>
                    <option value="andhra-pradesh">Andhra Pradesh</option>
                    <option value="assam">Assam</option>
                    <option value="bihar">Bihar</option>
                    <option value="chhattisgarh">Chhattisgarh</option>
                    <option value="goa">Goa</option>
                    <option value="gujarat">Gujarat</option>
                    <option value="haryana">Haryana</option>
                    <option value="himachal-pradesh">Himachal Pradesh</option>
                    <option value="jharkhand">Jharkhand</option>
                    <option value="karnataka">Karnataka</option>
                    <option value="kerala">Kerala</option>
                    <option value="madhya-pradesh">Madhya Pradesh</option>
                    <option value="maharashtra">Maharashtra</option>
                    <option value="odisha">Odisha</option>
                    <option value="punjab">Punjab</option>
                    <option value="rajasthan">Rajasthan</option>
                    <option value="tamil-nadu">Tamil Nadu</option>
                    <option value="telangana">Telangana</option>
                    <option value="uttar-pradesh">Uttar Pradesh</option>
                    <option value="west-bengal">West Bengal</option>
                    <option value="delhi">Delhi</option>
                    <option value="jharkhand">Jharkhand</option>
                    <option value="uttarakhand">Uttarakhand</option>
                    <option value="punjab">Punjab</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Production Capacity (Bottles/Month)
                  <input
                    type="text"
                    name="productionCapacity"
                    value={formData.productionCapacity}
                    onChange={handleChange}
                    placeholder="Production Capacity"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  GST Number
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="GST Number"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                  <div className="relative mt-3">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                      👁️
                    </span>
                  </div>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Confirm Password
                  <div className="relative mt-3">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                      👁️
                    </span>
                  </div>
                </label>
              </div>

              <label className="inline-flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I agree to the <span className="text-blue-600">Terms &amp; Conditions</span> and <span className="text-blue-600">Privacy Policy</span>
                </span>
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-blue-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                {loading ? "Creating account..." : "Become a Supplier"}
              </button>

              <p className="text-center text-sm text-slate-600">
                Already a supplier?{' '}
                <Link to="/supplier-signin" className="font-medium text-blue-600 hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupplierSignup;
