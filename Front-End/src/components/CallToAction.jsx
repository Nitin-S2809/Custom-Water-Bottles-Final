import { useState } from "react";

const CallToAction = () => {
  const [email, setEmail] = useState("");

  const handleQuoteRequest = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent("AquaBrand quote request");
    const body = encodeURIComponent(`Please contact me about a quote.\nEmail: ${email}`);
    window.location.href = `mailto:hello@aquabrand.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="px-4 py-12 bg-white sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[40px] bg-gradient-to-b from-blue-600 to-cyan-500 px-5 py-12 text-center shadow-2xl sm:px-10 sm:py-16">
          {/* Heading */}
          <h2 className="text-3xl font-bold text-white mb-6 sm:text-5xl">
            Ready to Get Started?
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed mb-10">
            Request a free quote today and discover how easy it is to get premium
            custom branded water bottles for your business.
          </p>

          {/* Input + Button */}
          <form onSubmit={handleQuoteRequest} className="flex justify-center items-center gap-6 flex-wrap mb-10">
            <input
              type="email"
              aria-label="Your email address for a quote"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
              className="w-[260px] h-[52px] rounded-2xl border border-white/40 bg-white/20 placeholder-white/70 text-white px-5 outline-none focus:ring-2 focus:ring-white"
            />
            <button type="submit" className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-semibold hover:bg-blue-50 transition flex items-center gap-2">
              Request a Quote <span className="text-xl">→</span>
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-white/90">
            Questions? Email us at{" "}
            <a
              href="mailto:hello@aquabrand.com"
              className="underline font-medium hover:text-white"
            >
              hello@aquabrand.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
