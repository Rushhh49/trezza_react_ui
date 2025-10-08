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
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 font-['Playfair_Display']">YOUR CUSTOM JEWELRY</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 font-['Playfair_Display'] tracking-tight mb-4">
            Welcome to YOUR CUSTOM JEWELRY
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Enter your purchase order number to view your jewelry items and specifications
          </p>
        </div>
        
        <Card className="p-8 bg-white border border-gray-200 shadow-lg max-w-md w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="purchaseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Order Number
              </label>
              <input
                id="purchaseNumber"
                type="text"
                placeholder="Enter your purchase order number"
                value={purchaseNumber}
                onChange={e => setPurchaseNumber(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-md hover:bg-black transition-colors font-medium text-lg"
            >
              View Order
            </button>
          </form>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-auto bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">© 2024 YOUR CUSTOM JEWELRY. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 