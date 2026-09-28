const CallToAction = () => {
  const contact = {
    email: { display: "[saraswatnitin2809@gmail.com]", href: "mailto:saraswatnitin2809@gmail.com" },
    phone: { display: "[Not Available]", href: "tel:PUT_OUR_PHONE_NUMBER_HERE" },
    whatsapp: {
      display: "[PUT OUR WHATSAPP NUMBER HERE]",
      href: "https://wa.me/PUT_OUR_WHATSAPP_NUMBER_HERE",
    },
    location: "[Faridabad, Haryana, India]",
  };
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.location)}`;

  return (
    <section id="contact" className="px-4 py-12 bg-white sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[40px] bg-gradient-to-b from-blue-600 to-cyan-500 px-5 py-10 text-white shadow-2xl sm:px-10 sm:py-14 lg:px-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
              AquaBrand · Business partnerships
            </p>
            <h2 className="mb-5 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Let&apos;s Build Your Brand Together
          </h2>
            <p className="mx-auto mb-9 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg">
              Make every first impression count with custom branded bottled water,
              thoughtfully created for hotels, companies, events, and growing businesses.
          </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-3 border-t border-white/25 pt-7 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-5">
            <a href={contact.email.href} className="rounded-xl px-3 py-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">
              <span className="block text-xs font-semibold uppercase tracking-wide text-white/70">Email</span>
              <span className="mt-1 block break-words font-medium">{contact.email.display}</span>
            </a>
            <a href={contact.phone.href} className="rounded-xl px-3 py-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">
              <span className="block text-xs font-semibold uppercase tracking-wide text-white/70">Phone</span>
              <span className="mt-1 block break-words font-medium">{contact.phone.display}</span>
            </a>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-xl px-3 py-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white sm:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-white/70">Location</span>
              <span className="mt-1 block break-words font-medium">{contact.location} <span aria-hidden="true">↗</span></span>
            </a>
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a href={contact.phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600">
              Call Us <span aria-hidden="true">→</span>
            </a>
            <a href={contact.whatsapp.href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">
              WhatsApp Us <span aria-hidden="true">↗</span>
            </a>
            <a href={contact.email.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">
              Email Us <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
