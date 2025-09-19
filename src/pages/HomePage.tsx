import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from '@/components/ui/card';

const HomePage: React.FC = () => {
  const [purchaseNumber, setPurchaseNumber] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseNumber.trim()) {
      navigate(`/order/${purchaseNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fefbf8] font-['Inter'] flex flex-col">
      {/* Header */}
      <header>
        <div className="bg-[#5440a8] h-2"></div>
        <div className="bg-[#483395]">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">BYONDJEWELRY</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4A3C72] font-['Playfair_Display'] tracking-tight mb-4">
            Welcome to BYONDJEWELRY
          </h1>
          <p className="text-lg text-[#837A75] max-w-md mx-auto">
            Enter your purchase order number to view your jewelry items and specifications
          </p>
        </div>
        
        <Card className="p-8 bg-white border border-gray-200 shadow-lg max-w-md w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="purchaseNumber" className="block text-sm font-medium text-[#4A3C72] mb-2">
                Purchase Order Number
              </label>
              <input
                id="purchaseNumber"
                type="text"
                placeholder="Enter your purchase order number"
                value={purchaseNumber}
                onChange={e => setPurchaseNumber(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-[#4A3C72] focus:outline-none focus:ring-2 focus:ring-[#4A3C72] focus:border-[#4A3C72] transition-colors"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#4A3C72] text-white py-3 px-6 rounded-lg hover:bg-[#5440a8] transition-colors font-medium text-lg"
            >
              View Order
            </button>
          </form>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-[#5440a8] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-white text-sm">
            © 2024 BYONDJEWELRY. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 