import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ItemDetailPage from "./pages/ItemDetailPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/order/:purchaseNumber" element={<ItemDetailPage />} />
        <Route path="/item/:itemId" element={<ItemDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
