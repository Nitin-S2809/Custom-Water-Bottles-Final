import { useEffect, useState } from "react";
import { Building2, Check, Edit3, LockKeyhole, MapPin, Save, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const emptyProfile = {
  companyName: "",
  ownerName: "",
  businessEmail: "",
  phoneNumber: "",
  city: "",
  state: "",
  productionCapacity: "",
  gstNumber: "",
};

const profileFields = [
  ["Company Name", "companyName"],
  ["Owner Name", "ownerName"],
  ["Business Email", "businessEmail"],
  ["Phone Number", "phoneNumber"],
  ["GST Number", "gstNumber"],
  ["Business Type", "businessType"],
  ["City", "city"],
  ["State", "state"],
  ["Production Capacity", "productionCapacity"],
];

const displayValue = (profile, key) => {
  if (key === "businessType") return "Bottled Water Supplier";
  if (key === "productionCapacity") {
    return profile[key] ? `${Number(profile[key]).toLocaleString()} bottles/month` : "Not provided";
  }
  return profile[key] || "Not provided";
};

function FieldEditor({ label, name, value, onChange, type = "text" }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export default function SupplierProfile({ supplier: initialSupplier, onSaved }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState({ ...emptyProfile, ...initialSupplier });
  const [formData, setFormData] = useState({ ...emptyProfile, ...initialSupplier });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const nextProfile = { ...emptyProfile, ...initialSupplier };
    setProfile(nextProfile);
    setFormData(nextProfile);
  }, [initialSupplier]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const startEditing = () => {
    setFormData(profile);
    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFormData(profile);
    setError("");
    setIsEditing(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("http://localhost:5000/api/suppliers/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Unable to update profile");

      setProfile({ ...emptyProfile, ...data.supplier });
      setFormData({ ...emptyProfile, ...data.supplier });
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
      onSaved?.(data.supplier);
    } catch (saveError) {
      setError(saveError.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initial = profile.companyName?.charAt(0)?.toUpperCase() || "S";
  const address = [profile.city, profile.state].filter(Boolean).join(", ") || "Address not provided";

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-xs text-slate-500">Manage your business information and keep your profile up to date.</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <button type="button" onClick={cancelEditing} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><X size={14} /> Cancel</button>
            <button type="submit" form="supplier-profile-form" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Save size={14} /> {saving ? "Saving..." : "Save Changes"}</button>
          </div>
        ) : (
          <button type="button" onClick={startEditing} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"><Edit3 size={14} /> Edit Profile</button>
        )}
      </div>

      {error ? <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</p> : null}
      {success ? <p className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"><Check className="mr-1 inline" size={14} />{success}</p> : null}

      <form id="supplier-profile-form" onSubmit={saveProfile} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-8 xl:flex-row xl:gap-12">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-800">Business Information</h2>
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {profileFields.map(([label, name]) => isEditing && name !== "businessType" ? (
                <FieldEditor key={name} label={label} name={name} value={formData[name] || ""} onChange={handleChange} type={name === "businessEmail" ? "email" : name === "productionCapacity" ? "number" : "text"} />
              ) : (
                <div key={name}>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">{displayValue(profile, name)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center border-t border-slate-100 pt-8 text-center xl:w-64 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-blue-600 ring-8 ring-blue-50/70"><span>{initial}</span></div>
            <h3 className="mt-5 max-w-full truncate text-base font-bold text-slate-800">{profile.companyName || "Your Company"}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Trusted supplier of customized bottled water for growing businesses.</p>
            <button type="button" className="mt-5 rounded-md border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">Change Logo</button>
          </div>
        </div>
      </form>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><MapPin size={17} className="text-blue-600" /><h2 className="text-sm font-bold text-slate-800">Address</h2></div><p className="mt-5 text-sm font-medium text-slate-700">{address}</p><p className="mt-1 text-xs text-slate-400">Supplier business location</p></div><button type="button" onClick={startEditing} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Edit</button></div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><LockKeyhole size={17} className="text-blue-600" /><h2 className="text-sm font-bold text-slate-800">Account Security</h2></div><p className="mt-5 text-sm font-medium tracking-[0.25em] text-slate-700">********</p><p className="mt-1 text-xs text-slate-400">Password is hidden for your security</p></div><button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Change Password</button></div>
        </section>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"><Building2 size={15} className="text-blue-600" /> Your profile information is used to match your business with suitable orders.</div>
    </div>
  );
}
