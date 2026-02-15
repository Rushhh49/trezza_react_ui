import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ItemDetailPage from "./pages/ItemDetailPage";
import NotFound from "./pages/NotFound";
import ItemDetailPage_3D from "./pages/ItemDetailPage_3D";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/order/:purchaseNumber" element={<ItemDetailPage />} />
        <Route path="/item/:itemId" element={<ItemDetailPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/order3d/:purchaseNumber" element={<ItemDetailPage_3D />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
