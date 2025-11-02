import React from "react";

interface LoadingScreenProps {
  message?: string;
  fullscreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Customizing your jewelry...", fullscreen = true }) => {
  return (
    <div className={`${fullscreen ? 'min-h-screen' : ''} bg-white flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-[#E6C2FF] border-t-[#4A3C72] animate-spin"></div>
        <div className="text-sm tracking-wide uppercase text-[#837A75]">{message}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;


