const HowItWorks = () => {
  return (
    <section id="works" className="px-4 py-12 bg-blue-50 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      {/* Heading */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 sm:text-5xl">
          How It Works
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Getting your custom branded water bottles is simple. Follow these
          three easy steps.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        
        {/* Card 1 */}
        <div className="relative bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-lg transition duration-300">
          {/* Step circle */}
          <div className="absolute -top-6 -left-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            1
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6">
            <span className="text-white text-2xl">⬆️</span>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-snug">
            Upload Your Logo & Choose Bottle Size
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Simply upload your company logo and select from our range of bottle
            sizes. Our design team ensures your branding looks perfect.
          </p>

          {/* Arrow */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 text-2xl">
            ›
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-lg transition duration-300">
          {/* Step circle */}
          <div className="absolute -top-6 -left-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            2
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center mb-6">
            <span className="text-white text-2xl">📍</span>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-snug">
            We Connect You with a Licensed Local Water Plant
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Our platform matches you with certified, licensed water suppliers
            near your location for quality assurance and fast production.
          </p>

          {/* Arrow */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 text-2xl">
            ›
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-lg transition duration-300">
          {/* Step circle */}
          <div className="absolute -top-6 -left-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            3
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6">
            <span className="text-white text-2xl">🚚</span>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-snug">
            Bottles are Produced and Delivered to Your Address
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Your custom branded bottles are produced to the highest standards
            and delivered directly to your office, hotel, or event venue.
          </p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
