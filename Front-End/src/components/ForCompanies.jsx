import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForCompanies = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section id="about" className="px-4 py-12 bg-slate-50 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">

        {/* Left Image */}
        <div className="rounded-3xl overflow-hidden shadow-xl">
          <img
            src="/office.png"
            alt="Office"
            className="h-[280px] w-full object-cover sm:h-[360px] lg:h-[420px]"
          />
        </div>

        {/* Right Content */}
        <div>
          <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-5 sm:text-5xl">
            For Companies & <br /> Hotels
          </h2>

          <p className="text-lg text-slate-600 mb-10 max-w-xl">
            Strengthen your brand identity with custom water bottles that leave
            a lasting impression.
          </p>

          {/* Feature 1 */}
          <div className="flex gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl">
              🏢
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Corporate Offices
              </h3>
              <p className="text-slate-600 mt-1">
                Enhance your brand presence with custom water bottles at
                meetings, client visits, and daily office use.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl">
              🏨
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Hotels & Resorts
              </h3>
              <p className="text-slate-600 mt-1">
                Provide guests with premium branded water bottles that elevate
                their experience and reinforce your brand.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl">
              📅
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Events & Conferences
              </h3>
              <p className="text-slate-600 mt-1">
                Make your events memorable with custom branded bottles for
                attendees, speakers, and sponsors.
              </p>
            </div>
          </div>

          {/* Button */}
          <button type="button" onClick={() => navigate(isAuthenticated ? "/order-bottles" : "/usersignup")} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-semibold hover:bg-blue-700 transition">
            Get Started for Your Business
          </button>
        </div>

      </div>
    </section>
  );
};

export default ForCompanies;
