import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-grow relative px-4 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-50 lg:opacity-100"
          style={{
            backgroundImage: "url('/conveyerbelt-bottles.mp4')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            backgroundRepeat: "no-repeat"
          }}
        >
          {/* Fallback to gradient if image doesn't load */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50/80 to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-slate-900">Your Brand.</span>
                <br />
                <span className="text-blue-600">Every Bottle.</span>
              </h1>

              <p className="text-slate-700 text-base sm:text-lg mb-8 leading-relaxed">
                Custom branded water bottles for businesses, events & organizations.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 mb-12">
                <button 
                  onClick={() => navigate("/usersignup")}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-slate-800 transition text-sm sm:text-base"
                >
                  <span>Order for Your Business</span>
                  <span>→</span>
                </button>
                <button 
                  onClick={() => navigate("/supplier-signup")}
                  className="flex items-center justify-center gap-2 bg-white text-slate-900 border-2 border-slate-300 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-slate-50 transition text-sm sm:text-base"
                >
                  Become a Supplier
                </button>
              </div>

              {/* Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-lg">⭐</span>
                  </div>
                  <span className="text-slate-700 font-medium text-sm sm:text-base">Premium Quality</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-lg">⏱️</span>
                  </div>
                  <span className="text-slate-700 font-medium text-sm sm:text-base">On-Time Delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-lg">🎨</span>
                  </div>
                  <span className="text-slate-700 font-medium text-sm sm:text-base">100% Customizable</span>
                </div>
              </div>
            </div>

            {/* Right Side - Bottle Image (Hidden on mobile, shown on lg) */}
            <div className="hidden lg:flex items-center justify-end">
              <div className="relative w-full max-w-sm">
                <img
                  src="/bottle.png"
                  alt="Custom Water Bottle with Logo"
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
