const WhyChooseUs = () => {
  return (
    <section className="px-4 py-12 bg-blue-50 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      {/* Heading */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 sm:text-5xl">
          Why Choose Us
        </h2>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We make branded water bottles easy, reliable, and professional for
          businesses of all sizes.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* Card 1 */}
        <div className="border border-slate-200 rounded-3xl p-8 bg-white shadow-sm hover:shadow-lg transition duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
            <span className="text-blue-600 text-2xl">🛡️</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
            Licensed & Safe Drinking Water
          </h3>

          <p className="text-slate-600 leading-relaxed">
            All our water suppliers are fully licensed and meet the highest
            quality and safety standards.
          </p>
        </div>

        {/* Card 2 */}
        <div className="border border-slate-200 rounded-3xl p-8 bg-white shadow-sm hover:shadow-lg transition duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
            <span className="text-blue-600 text-2xl">🏅</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
            Custom Branding for Companies
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Showcase your brand with high-quality custom labels on premium water
            bottles.
          </p>
        </div>

        {/* Card 3 */}
        <div className="border border-slate-200 rounded-3xl p-8 bg-white shadow-sm hover:shadow-lg transition duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
            <span className="text-blue-600 text-2xl">⚡</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
            Local Suppliers, Fast Delivery
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Our network of local suppliers ensures quick turnaround times and
            fresh production.
          </p>
        </div>

        {/* Card 4 */}
        <div className="border border-slate-200 rounded-3xl p-8 bg-white shadow-sm hover:shadow-lg transition duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
            <span className="text-blue-600 text-2xl">💼</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
            No Factory, No Hassle
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Focus on your business while we handle production, quality control,
            and logistics.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
