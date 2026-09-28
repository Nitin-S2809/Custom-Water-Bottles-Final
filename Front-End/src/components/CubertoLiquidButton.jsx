import React from "react";

export default function CubertoLiquidButton() {
  return (
    <div className="flex items-center justify-center">
      {/* SVG Gooey Filter */}
      <svg className="absolute w-0 h-0">
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      {/* Button */}
      <button className="group relative overflow-hidden rounded-full border border-black bg-white px-10 py-4 font-semibold text-black transition duration-300">
        
        {/* Gooey Liquid Layer */}
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
          style={{ filter: "url(#gooey)" }}
        >
          {/* Liquid blobs */}
          <span className="liquidBlob absolute left-[20%] top-[60%] h-12 w-12 rounded-full bg-black"></span>
          <span className="liquidBlob2 absolute left-[50%] top-[70%] h-16 w-16 rounded-full bg-black"></span>
          <span className="liquidBlob3 absolute left-[75%] top-[65%] h-10 w-10 rounded-full bg-black"></span>

          {/* Liquid base that fills */}
          <span className="absolute left-0 top-full h-full w-full bg-black transition-all duration-500 group-hover:top-0"></span>
        </span>

        {/* Text */}
        <span className="relative z-10 transition duration-300 group-hover:text-white">
          Click Me
        </span>

        {/* Extra CSS (inside component) */}
        <style>{`
          .liquidBlob {
            animation: float1 2.2s ease-in-out infinite;
          }
          .liquidBlob2 {
            animation: float2 2.6s ease-in-out infinite;
          }
          .liquidBlob3 {
            animation: float3 2.4s ease-in-out infinite;
          }

          @keyframes float1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(15px, -18px); }
          }

          @keyframes float2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-18px, -22px); }
          }

          @keyframes float3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(10px, -16px); }
          }
        `}</style>
      </button>
    </div>
  );
}
