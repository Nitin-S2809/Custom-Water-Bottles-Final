import GooeyButton from "./GooeyButton";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-16 py-10 lg:py-7 gap-10 lg:gap-16">
      
      {/* Left Content */}
      <div className="w-full lg:max-w-xl text-center lg:text-left">
        
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight mb-4 lg:mb-6">
          Premium Branded <br />
          Water Bottles for <br />
          Your Business
        </h1>

        <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-6 lg:mb-8 leading-relaxed">
          Turn every bottle into a branding opportunity with
          custom designs that bring your logo to life and
          elevate every guest experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 lg:mb-8">
          <GooeyButton variant="filled" onClick={() => navigate("/order-bottles")}>
            Order Branded Water
          </GooeyButton>

          <GooeyButton variant="outline" onClick={() => navigate("/supplier-signup")}>
            Become a Supplier
          </GooeyButton>
        </div>
      </div>

      {/* Right Content - Product Image & Badge */}
      <div className="w-full lg:max-w-[750px] flex flex-col items-center lg:items-start">
        <div className="relative w-full h-[250px] sm:h-[350px] lg:h-[500px] rounded-2xl overflow-hidden bg-white flex items-center justify-center">
          
        <img
          src="/image.png"
          alt="Office"
          className="w-full h-[470px] object-cover"
        />
          
        </div>

        {/* Certified Badge - Visible on mobile below image */}
        <div className="lg:hidden mt-6 bg-white shadow-lg rounded-xl p-4 flex items-center gap-3 w-full sm:w-auto sm:self-center">
          <div className="bg-sky-500 text-white p-2.5 rounded-lg flex-shrink-0">
            ✓
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base">Certified & Safe</p>
            <p className="text-xs text-gray-500">FDA Approved Water</p>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;