import { useNavigate } from "react-router-dom";

const ForSuppliers = () => {
  const navigate = useNavigate();
  return (
    <section id="suppliers" className="px-4 py-12 bg-white sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
        
        {/* LEFT SIDE */}
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 sm:text-5xl lg:text-6xl">
            For Water Suppliers
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed mb-12 max-w-xl">
            Join our network of licensed water suppliers and get connected with
            businesses looking for custom branded water bottles.
          </p>

          {/* FEATURES GRID */}
          <div className="grid grid-cols-1 gap-x-14 gap-y-8 mb-10 sm:grid-cols-2 sm:gap-y-14 lg:mb-14">

            {/* Feature 1 */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Grow Your Business
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Access new corporate clients and increase your order volume
                through our platform.
              </p>
            </div>

            {/* Feature 2 */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Qualified Leads
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Receive verified orders from hotels, companies, and event
                organizers in your area.
              </p>
            </div>

            {/* Feature 3 */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">⏱️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Streamlined Operations
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Our platform handles client communication, design approvals, and
                order management.
              </p>
            </div>

            {/* Feature 4 */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">💲</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Fair Pricing
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Set your own prices and margins. We only charge a small platform
                fee per order.
              </p>
            </div>

          </div>

          {/* BUTTON */}
          <button 
            onClick={() => navigate("/supplier-signup")}
            className="bg-cyan-600 text-white px-12 py-4 rounded-2xl font-semibold hover:bg-cyan-700 transition"
          >
            Become a Supplier Partner
          </button>
        </div>

        {/* RIGHT SIDE IMAGE */}
      <div className="relative h-[260px] w-full overflow-hidden rounded-2xl bg-white sm:h-[380px] lg:mt-27 lg:h-[500px] lg:w-[750px]">
        <video
          src="/conveyerbelt-bottles.mp4"
          autoPlay
          loop
          muted
          playsInline    
          className="absolute inset-0 w-full h-full object-cover block scale-[1.01]"
        />
        
      </div>
    

      </div>
    </section>
  );
};

export default ForSuppliers;
