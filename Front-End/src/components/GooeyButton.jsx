import React from "react";


export default function GooeyButton({
  
  children,
  variant = "filled", // "filled" | "outline"
  onClick,
}) {
  const isFilled = variant === "filled";
  

  return (
    <>
      {/* SVG Filter (Only once per page is best) */}
      <svg className="absolute h-0 w-0">
        <filter id="gooey-btn">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 20 -8"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <button
        onClick={onClick} 
        className={`group relative overflow-hidden rounded-xl px-6 py-3 font-medium transition duration-300
          ${isFilled ? "bg-blue-600 text-white" : "border-2 border-blue-600 text-blue-600"}
        `}
      >
        {/* Liquid Layer */}
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
          style={{ filter: "url(#gooey-btn)" }}
        >
          {/* Liquid Fill */}
          <span
            className={`absolute left-0 top-full h-full w-full transition-all duration-500 group-hover:top-0
              ${isFilled ? "bg-pink-300" : "bg-purple-400"}
            `}
          />

          {/* Floating blobs */}
          <span
            className={`blob1 absolute left-[20%] top-[70%] h-10 w-10 rounded-full
              ${isFilled ? "bg-pink-300" : "bg-purple-400"}
            `}
          />
          <span
            className={`blob2 absolute left-[50%] top-[80%] h-14 w-14 rounded-full
              ${isFilled ? "bg-pink-300" : "bg-purple-400"}
            `}
          />
          <span
            className={`blob3 absolute left-[75%] top-[75%] h-9 w-9 rounded-full
              ${isFilled ? "bg-pink-300" : "bg-purple-400"}
            `}
          />
        </span>

        {/* Text */}
        <span
          className={`relative z-10 transition duration-300
            ${isFilled ? "group-hover:text-white-600" : "group-hover:text-white"}
          `}
        >
          {children}
        </span>

        {/* Animations */}
        <style>{`
          .blob1 { animation: float1 2.2s ease-in-out infinite; }
          .blob2 { animation: float2 2.6s ease-in-out infinite; }
          .blob3 { animation: float3 2.4s ease-in-out infinite; }

          @keyframes float1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(16px, -18px); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-20px, -24px); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(12px, -16px); }
          }
        `}</style>
      </button>
    </>
  );
}
