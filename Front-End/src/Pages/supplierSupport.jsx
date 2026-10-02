import { useEffect, useState } from "react";
import { ChevronDown, CircleHelp, Headphones, Mail, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const subjects = ["Order Issue", "Payment Issue", "Product Issue", "Account Issue", "Technical Issue", "Other"];

const faqs = [
  {
    question: "How do I add my products?",
    answer: "Product and pricing updates are managed from the Products & Pricing section in your supplier dashboard. Add your product details, bottle sizes, and current pricing there.",
  },
  {
    question: "How will I receive payments?",
    answer: "Payments are recorded against completed orders. Your delivered-order earnings appear in Earnings once the order is completed and the payment has been processed.",
  },
  {
    question: "What are the commission charges?",
    answer: "Commission details depend on your supplier agreement. Contact Support with your account details and our team will confirm the charges that apply to your business.",
  },
  {
    question: "How long does order processing take?",
    answer: "Processing time depends on your production capacity and the order requirements. You can review current orders and their status from the Orders section.",
  },
  {
    question: "How can I update my business details?",
    answer: "Open My Profile from the sidebar, select Edit Profile, update your information, and save your changes.",
  },
];

function SupportInformation({ contact, loading, onLiveChat, onHelpCenter }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-bold text-slate-800">Support Information</h2>
      <div className="mt-5 space-y-4">
        {loading ? <p className="px-2 text-xs text-slate-500" role="status">Loading admin contact...</p> : contact ? <>
          {contact.name ? <p className="px-2 text-xs text-slate-600"><span className="font-semibold text-slate-700">Admin / Support:</span> {contact.name}</p> : null}
          {contact.email ? <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-md p-2 text-xs text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Mail size={16} /></span><span><span className="block font-semibold text-slate-700">Email Admin</span><span className="mt-1 block break-all text-[11px] text-slate-400">{contact.email}</span></span></a> : null}
          {!contact.name && !contact.email ? <p className="px-2 text-xs text-slate-500">No admin contact details are available.</p> : null}
        </> : <p className="px-2 text-xs text-slate-500">Admin contact details are currently unavailable.</p>}
        <button type="button" onClick={onLiveChat} className="flex w-full items-center gap-3 rounded-md p-2 text-left text-xs text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600"><MessageCircle size={16} /></span><span><span className="block font-semibold text-slate-700">Live Chat</span><span className="mt-1 block text-[11px] text-slate-400">Chat with our support team</span></span></button>
        <button type="button" onClick={onHelpCenter} className="flex w-full items-center gap-3 rounded-md p-2 text-left text-xs text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600"><CircleHelp size={16} /></span><span><span className="block font-semibold text-slate-700">Help Center</span><span className="mt-1 block text-[11px] text-slate-400">Browse common questions</span></span></button>
      </div>
    </section>
  );
}

function FrequentlyAskedQuestions({ openFaq, onToggle }) {
  return (
    <section id="support-faq" className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="text-sm font-bold text-slate-800">Frequently Asked Questions</h2><p className="mt-1 text-[11px] text-slate-400">Find quick answers to common supplier questions.</p></div><CircleHelp size={18} className="text-blue-500" /></div>
      <div className="px-5 sm:px-6">{faqs.map((faq, index) => <div key={faq.question} className={index < faqs.length - 1 ? "border-b border-slate-100" : ""}><button type="button" onClick={() => onToggle(index)} aria-expanded={openFaq === index} className="flex w-full items-center justify-between gap-4 py-4 text-left text-xs font-semibold text-slate-700"><span>{faq.question}</span><ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${openFaq === index ? "rotate-180 text-blue-600" : ""}`} /></button>{openFaq === index ? <p className="-mt-1 pb-4 pr-8 text-xs leading-relaxed text-slate-500">{faq.answer}</p> : null}</div>)}</div>
    </section>
  );
}

export default function SupplierSupport() {
  const { token } = useAuth();
  const [supportContact, setSupportContact] = useState(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadSupportContact = async () => {
      if (!token) {
        setContactLoading(false);
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/support-contact`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load admin contact");
        setSupportContact(data.contact || null);
      } catch (error) {
        if (error.name !== "AbortError") setSupportContact(null);
      } finally {
        if (!controller.signal.aborted) setContactLoading(false);
      }
    };
    loadSupportContact();
    return () => controller.abort();
  }, [token]);

  const submitSupportRequest = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    if (!subject) {
      setFormError("Please select an issue.");
      return;
    }
    if (!message.trim()) {
      setFormError("Please enter a message.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/suppliers/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to send your message");
      setSubject("");
      setMessage("");
      setSuccess("Your message has been sent. Our support team will get back to you soon.");
    } catch (submitError) {
      setFormError(submitError.message || "Unable to send your message");
    } finally {
      setSending(false);
    }
  };

  const scrollToFaq = () => document.getElementById("support-faq")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-xl font-bold text-slate-900">Support</h1><p className="mt-1 text-xs text-slate-500">Need help? We're here for you.</p></div><button type="button" onClick={scrollToFaq} className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50"><CircleHelp size={14} /> View FAQ</button></div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Send size={18} /></span><div><h2 className="text-sm font-bold text-slate-800">Contact Support</h2><p className="mt-1 text-[11px] text-slate-400">Send us a message and we'll help resolve your issue.</p></div></div><form onSubmit={submitSupportRequest} className="mt-6 space-y-4"><label className="block text-xs font-semibold text-slate-600">Subject<select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="">Select an issue</option>{subjects.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="block text-xs font-semibold text-slate-600">Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows="5" placeholder="Tell us how we can help..." className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>{formError ? <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600" role="alert">{formError}</p> : null}{success ? <p className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700" role="status">{success}</p> : null}<button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Send size={14} />{sending ? "Sending..." : "Send Message"}</button></form></section>
        <SupportInformation contact={supportContact} loading={contactLoading} onLiveChat={() => setChatOpen(true)} onHelpCenter={scrollToFaq} />
      </div>
      <FrequentlyAskedQuestions openFaq={openFaq} onToggle={(index) => setOpenFaq((current) => current === index ? null : index)} />
      {chatOpen ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-4" role="dialog" aria-modal="true" aria-labelledby="chat-title"><div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="chat-title" className="text-sm font-bold text-slate-800">Live Chat</h2><p className="mt-1 text-xs text-slate-500">Our team is currently available by email and phone.</p></div><button type="button" onClick={() => setChatOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Close live chat"><X size={17} /></button></div><div className="mt-5 rounded-md bg-blue-50 p-4 text-xs leading-relaxed text-slate-600">Live chat is being prepared for supplier accounts. Please use Contact Support for a tracked response.</div><button type="button" onClick={() => setChatOpen(false)} className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Close</button></div></div> : null}
    </div>
  );
}
