import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

   /* Auto redirect */
   useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate("/");
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf9f7] via-[#f3efe9] to-[#e8e2d6] relative overflow-hidden">

      {/* Soft background glow */}
      <div className="absolute w-80 h-80 bg-[#d6c7a1]/30 rounded-full blur-3xl -top-24 -left-24" />
      <div className="absolute w-80 h-80 bg-[#d6c7a1]/30 rounded-full blur-3xl bottom-0 right-0" />

      {/* Card */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-[#e6dcc8] rounded-2xl shadow-xl p-10 max-w-md w-full text-center">

        {/* Illustration */}
        <div className="flex justify-center mb-6 animate-[float_4s_ease-in-out_infinite]">
          <svg
            width="140"
            height="140"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ring */}
            <circle
              cx="100"
              cy="120"
              r="45"
              stroke="#bfa76f"
              strokeWidth="6"
              fill="none"
            />

            {/* Diamond */}
            <polygon
              points="100,25 125,60 100,95 75,60"
              fill="#f5f1e8"
              stroke="#bfa76f"
              strokeWidth="4"
            />
            <line x1="100" y1="25" x2="100" y2="95" stroke="#bfa76f" />
            <line x1="75" y1="60" x2="125" y2="60" stroke="#bfa76f" />
          </svg>
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-extrabold text-[#6b5e3c] tracking-widest mb-2">
          404
        </h1>

        <p className="text-xl text-gray-700 mb-2">
          Page Not Found
        </p>

        <p className="text-gray-500 mb-8">
          Looks like this jewel is missing from our collection.
        <br />
        Redirecting to home page in {countdown} seconds...</p>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#bfa76f] text-white hover:bg-[#a9925e] transition"
          >
            <Home size={18} />
            Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-gray-500 text-sm">
      <div className="text-center text-gray-500 text-xs">Made with ❤️ by <a href="https://www.platify.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Platify</a>. Copyright © 2025 Your Custom Jewelry. All rights reserved.</div>
      </div>

      {/* Floating animation */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

    </div>
  );
};

export default NotFound;
