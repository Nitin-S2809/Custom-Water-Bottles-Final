import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

const MotionDiv = motion.div;

const bottleSections = [
  {
    size: "250 ml",
    bottles: [
      { image: "/bottle1.png", caption: "AquaBrand Design" },
      { image: "/bottle2.png", caption: "Hotel Branding" },
      { image: "/bottle3.png", caption: "Cafe Branding" },
    ],
  },
  {
    size: "500 ml",
    bottles: [
      { image: "/Bottle4.png", caption: "AquaBrand Design" },
      { image: "/bottle5.png", caption: "Corporate Branding" },
      { image: "/bottle6.png", caption: "Restaurant Branding" },
    ],
  },
  {
    size: "1 Litre",
    bottles: [
      { image: "/bottle7.png", caption: "AquaBrand Design" },
      { image: "/bottle8.png", caption: "Resort Branding" },
      { image: "/bottle9.png", caption: "Corporate Branding" },
    ],
  },
];

export default function CustomizedBottles() {
  const [selectedBottle, setSelectedBottle] = useState(null);
  const closeButtonRef = useRef(null);
  const lastTriggerRef = useRef(null);

  useEffect(() => {
    if (!selectedBottle) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedBottle(null);
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = event.currentTarget.querySelector("[role='dialog']");
      const focusableElements = dialog?.querySelectorAll("button:not([disabled])");
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [selectedBottle]);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div aria-hidden="true" className="absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm">
              AquaBrand Inspiration
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Our Customized Bottles
            </h1>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-blue-700 sm:text-3xl">
              Real Designs. Real Brands.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Get your logo, name or custom design printed on premium water bottles. Here are some examples for each size to help you visualize the possibilities.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:space-y-20 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {bottleSections.map((section, sectionIndex) => (
          <section key={section.size} aria-labelledby={`bottle-size-${sectionIndex}`}>
            <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Explore the collection
                </p>
                <h2 id={`bottle-size-${sectionIndex}`} className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {section.size} Bottles
                </h2>
              </div>
              <span className="hidden rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-blue-700 sm:inline-flex">
                Custom print, your way
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
              {section.bottles.map((bottle, bottleIndex) => (
                <article
                  key={bottle.image}
                  className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_55px_-35px_rgba(15,23,42,0.32)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_-35px_rgba(37,99,235,0.3)]"
                >
                  <button
                    type="button"
                    aria-label={`View ${section.size} ${bottle.caption} bottle image`}
                    onClick={(event) => {
                      lastTriggerRef.current = event.currentTarget;
                      setSelectedBottle({ ...bottle, size: section.size });
                    }}
                    className="group/image relative flex h-72 w-full items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 to-slate-50 p-7 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-500 sm:h-80"
                  >
                    <img
                      src={bottle.image}
                      alt={`${section.size} customized bottle, ${bottle.caption}`}
                      loading={sectionIndex === 0 && bottleIndex === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-contain transition duration-500 group-hover/image:scale-[1.04]"
                    />
                    <span className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-blue-700 opacity-0 shadow-md transition group-hover/image:opacity-100 group-focus-within/image:opacity-100">
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{section.size}</p>
                      <h3 className="mt-1.5 text-lg font-semibold text-slate-900">{bottle.caption}</h3>
                    </div>
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        {selectedBottle ? (
          <MotionDiv
            key="bottle-preview-backdrop"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedBottle(null);
            }}
          >
            <MotionDiv
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedBottle.size} ${selectedBottle.caption} bottle preview`}
              className="relative flex h-full max-h-[min(88vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white p-3 shadow-2xl sm:p-5"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close image preview"
                onClick={() => setSelectedBottle(null)}
                className="absolute right-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg outline-none transition hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-4 focus-visible:ring-blue-500 sm:right-6 sm:top-6"
              >
                <X size={24} aria-hidden="true" />
              </button>
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100 p-3 sm:p-8">
                <img
                  src={selectedBottle.image}
                  alt={`${selectedBottle.size} customized bottle, ${selectedBottle.caption}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="px-3 pb-1 pt-4 text-center sm:pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{selectedBottle.size}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{selectedBottle.caption}</p>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
