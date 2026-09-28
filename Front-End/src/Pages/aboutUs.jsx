import { createElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowDown,
  ArrowRight,
  Award,
  Check,
  Code2,
  Droplets,
  HeartHandshake,
  Link,
  Mail,
  ShieldCheck,
  Sprout,
  Star,
  Truck,
  Users,
} from "lucide-react";

const stats = [
  { value: "500+", label: "Businesses Served", icon: Users },
  { value: "50+", label: "Trusted Suppliers", icon: ShieldCheck },
  { value: "10M+", label: "Bottles Delivered", icon: Truck },
  { value: "99%", label: "Customer Satisfaction", icon: Star },
];

const values = [
  { title: "Quality First", text: "We ensure premium quality and hygiene standards.", icon: Award },
  { title: "Trust & Transparency", text: "We work only with licensed and verified suppliers.", icon: ShieldCheck },
  { title: "Sustainability", text: "We support eco-friendly and responsible practices.", icon: Sprout },
  { title: "Customer Focus", text: "Your brand and satisfaction are always our priority.", icon: HeartHandshake },
];

const journey = [
  { year: "2024", title: "The Idea", text: "Identified the gap in the market for easy and reliable custom branded water bottle supply." },
  { year: "2025", title: "Building AquaBrand", text: "Developed the platform and partnered with verified water suppliers." },
  { year: "2026", title: "Growing Together", text: "Serving businesses and expanding to more cities." },
  { year: "Future", title: "A Bigger Impact", text: "To become India's most trusted platform for branded water bottles and promote sustainable hydration." },
];

const coFounders = [
  {
    name: "Nitin Saraswat",
    initials: "NS",
    image: "/nitin.png",
    description: "A computer engineering student and full-stack developer, passionate about building real-world solutions. Nitin looks after product development, technology and overall platform growth at AquaBrand.",
    email: "saraswatnitin2809@gmail.com",
  },
  {
    name: "Harsh Rajput",
    initials: "HR",
    image: "/HARSH.jpeg",
    description: "Business enthusiast with a focus on operations, supplier partnerships and customer relations. Harsh works on building strong supplier networks and expanding AquaBrand across new markets.",
    email: "harsh.rajput@example.com",
  },
];

function AboutUs() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative isolate overflow-hidden bg-[linear-gradient(115deg,#f8fcff_0%,#eef8ff_57%,#e4f4ff_100%)]">
        <div className="absolute -right-28 top-10 -z-10 h-80 w-80 rounded-full border border-sky-200/60" />
        <div className="absolute -right-12 top-24 -z-10 h-64 w-64 rounded-full border border-sky-200/60" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:min-h-[610px] lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase text-blue-700">
              <span className="h-px w-7 bg-blue-600" /> About AquaBrand
            </p>
            <h1 className="max-w-[660px] text-5xl font-bold leading-[1.04] text-[#102d4f] sm:text-6xl lg:text-7xl">
              Bringing Your Brand to <span className="text-blue-600">Every Drop</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              AquaBrand makes it easy for businesses to get high-quality, custom-branded water bottles. We connect you with trusted and licensed local water suppliers, ensuring premium quality, reliable service, and a seamless ordering experience.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#journey" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(29,78,216,.65)] transition hover:-translate-y-0.5 hover:bg-blue-800">
                Our Story <ArrowRight size={17} />
              </a>
              <a href="#team" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white/80 px-6 text-sm font-semibold text-[#17395d] transition hover:border-blue-300 hover:bg-white">
                Meet the Team
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Check size={16} /></span>
              Premium hydration, made personal
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px] pb-4 sm:pb-5">
            <div className="absolute inset-x-8 bottom-10 top-6 rounded-[42%] bg-[radial-gradient(ellipse_at_center,#c9eaff_0%,#eaf7ff_54%,transparent_72%)]" />
            <div className="relative flex min-h-[370px] items-center justify-center overflow-hidden rounded-[28px] border border-white/90 bg-white/55 px-5 py-8 shadow-[0_24px_70px_-42px_rgba(21,83,140,.5)] sm:min-h-[445px] sm:px-10">
              <div className="absolute left-7 top-7 rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-xs font-semibold text-blue-800 shadow-sm sm:left-10 sm:top-10">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Your Brand, Our Bottles
              </div>
              <div className="absolute right-5 top-20 h-24 w-24 rounded-full bg-white/55 blur-xl sm:right-12 sm:top-16 sm:h-36 sm:w-36" />
              <img src="/image.png" alt="AquaBrand custom-branded water bottle" className="relative z-10 h-[290px] max-w-[78%] object-contain drop-shadow-[0_25px_20px_rgba(35,91,132,.20)] transition duration-500 hover:-translate-y-1 sm:h-[370px]" />
              <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-sky-100 bg-white/95 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-md sm:bottom-9 sm:text-sm">
                <Droplets size={16} className="text-blue-600" /> Made for your brand
              </div>
              <span className="absolute left-8 top-1/2 h-2 w-2 rounded-full bg-sky-400" />
              <span className="absolute bottom-20 right-10 h-3 w-3 rounded-full bg-blue-300" />
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-[0_18px_44px_-32px_rgba(15,60,108,.48)] sm:absolute sm:-bottom-1 sm:left-6 sm:right-6 sm:mt-0 sm:grid-cols-4 sm:gap-2 sm:p-4">
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5 px-1 py-1 sm:flex-col sm:items-start sm:gap-1 sm:px-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{createElement(Icon, { size: 16 })}</span>
                  <div><p className="text-lg font-bold leading-5 text-[#123558]">{value}</p><p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-[11px]">{label}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-sky-100 bg-[#f6fbff] p-6 sm:p-8">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Droplets size={21} /></span>
            <h2 className="text-2xl font-bold text-[#123558]">Our Mission</h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">To help businesses create a stronger brand presence with high-quality, custom-branded water bottles through a simple, reliable and transparent platform.</p>
          </article>
          <article className="rounded-2xl border border-sky-100 bg-[#f6fbff] p-6 sm:p-8">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><ArrowDown size={21} /></span>
            <h2 className="text-2xl font-bold text-[#123558]">Our Vision</h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">To become the most trusted platform for customized water bottles in India, connecting businesses with verified suppliers and promoting sustainable hydration solutions.</p>
          </article>
        </div>

        <div className="mt-14 sm:mt-16">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase text-blue-700">What guides us</p><h2 className="mt-2 text-3xl font-bold text-[#123558] sm:text-4xl">Our Values</h2></div>
            <p className="hidden max-w-sm text-sm leading-6 text-slate-500 md:block">The principles behind every bottle, partnership, and promise.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ title, text, icon: Icon }) => (
              <article key={title} className="group rounded-xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_12px_28px_-20px_rgba(21,83,140,.45)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">{createElement(Icon, { size: 19 })}</span>
                <h3 className="mt-4 font-bold text-[#16395d]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="journey" className="scroll-mt-24 bg-[#eef8ff] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase text-blue-700">Our journey</p>
            <h2 className="mt-2 text-3xl font-bold text-[#123558] sm:text-4xl">A journey with purpose</h2>
            <p className="mt-4 leading-7 text-slate-600">From a simple idea to a growing platform, our journey has always been driven by one goal — making custom branded water bottles easy and accessible for every business.</p>
          </div>
          <div className="relative mt-12 grid gap-7 md:grid-cols-4 md:gap-5">
            <div className="absolute bottom-0 left-[13px] top-2 w-px bg-blue-200 md:bottom-auto md:left-[10%] md:right-[10%] md:top-[13px] md:h-px md:w-auto" />
            {journey.map((milestone) => (
              <article key={milestone.year} className="relative pl-10 md:pl-0 md:pt-10">
                <span className="absolute left-[6px] top-1 flex h-[15px] w-[15px] items-center justify-center rounded-full border-[4px] border-white bg-blue-600 shadow-[0_0_0_1px_#93c5fd] md:left-1/2 md:top-0 md:-translate-x-1/2"><span className="sr-only">{milestone.year}</span></span>
                <p className="text-sm font-bold text-blue-700">{milestone.year}</p>
                <h3 className="mt-2 text-lg font-bold text-[#16395d]">{milestone.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{milestone.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase text-blue-700">Meet our cofounders</p>
          <h2 className="mt-2 text-3xl font-bold text-[#123558] sm:text-4xl">The People Behind AquaBrand</h2>
          <p className="mt-4 leading-7 text-slate-600">A team of passionate builders working to make custom branded water bottles simple and accessible for every business.</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {coFounders.map((founder) => (
            <article key={founder.name} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_16px_46px_-40px_rgba(15,60,108,.5)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_-38px_rgba(15,60,108,.42)] sm:p-8">
              {founder.image ? founder.name === "Harsh Rajput" ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-[0_0_0_1px_#dbeafe,0_10px_24px_-14px_rgba(30,64,175,.55)]">
                  <img src={founder.image} alt={`${founder.name} profile`} className="absolute left-1/2 top-0 h-[140%] w-[140%] max-w-none -translate-x-1/2 object-cover object-top" />
                </div>
              ) : <img src={founder.image} alt={`${founder.name} profile`} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_0_0_1px_#dbeafe,0_10px_24px_-14px_rgba(30,64,175,.55)]" /> : <div role="img" aria-label={`${founder.name} profile placeholder`} className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(145deg,#dff3ff,#b9ddf7)] text-2xl font-bold text-blue-800 shadow-[0_0_0_1px_#dbeafe,0_10px_24px_-14px_rgba(30,64,175,.55)]">{founder.initials}</div>}
              <h3 className="mt-5 text-xl font-bold text-[#16395d]">{founder.name}</h3>
              <span className="mt-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Co-Founder</span>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">{founder.description}</p>
              <div className="mt-auto flex gap-2 pt-5">
                <span role="img" aria-label={`${founder.name} LinkedIn profile not provided`} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500"><Link size={16} /></span>
                <span role="img" aria-label={`${founder.name} GitHub profile not provided`} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500"><Code2 size={16} /></span>
                <a href={founder.email} aria-label={`Email ${founder.name}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Mail size={16} /></a>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-7 sm:flex-row">
          <p className="text-sm text-slate-500">Have a project in mind? Let’s make it memorable.</p>
          <button type="button" onClick={() => navigate(isAuthenticated ? "/order-bottles" : "/usersignup")} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800">Get started <ArrowRight size={16} /></button>
        </div>
      </section>
    </main>
  );
}

export default AboutUs;