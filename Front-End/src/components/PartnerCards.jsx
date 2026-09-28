const PartnerCards = () => {
  return (
    <section className="px-16 pb-10">
      <div className="grid grid-cols-2 gap-8">
        
        {/* Become a Supplier */}
        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-xl font-bold mb-2">Become a Supplier</h3>
          <p className="text-gray-600 mb-5">
            Partner with us to supply licensed water and grow your business
            with consistent orders. Receive regular bulk demand.
          </p>

          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2">
            Apply as Supplier <span className="text-lg">→</span>
          </button>
        </div>

        {/* Join Our Membership */}
        <div className="rounded-2xl p-8 bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-xl font-bold mb-2">Join Our Membership</h3>
          <p className="text-gray-600 mb-5">
            Get exclusive pricing, priority service, and dedicated support
            designed to grow your business faster.
          </p>

          <button className="border-2 border-blue-600 text-blue-600 px-5 py-2.5 rounded-xl font-medium hover:bg-blue-50 flex items-center gap-2">
            View Membership Plans <span className="text-lg">→</span>
          </button>
        </div>

      </div>
    </section>
  );
};

export default PartnerCards;
