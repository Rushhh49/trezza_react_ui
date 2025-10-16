// TypeScript declaration for model-viewer custom element
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'environment-image'?: string;
        'shadow-intensity'?: string | number;
        'camera-controls'?: boolean;
        'touch-action'?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

import React, { useEffect, useState } from "react";
import LoadingScreen from '@/components/ui/loading-screen';
import { useParams } from "react-router-dom";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Rotate3D, Image, Gem, Ruler, Palette, Package, Layers, FileText } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { X } from 'lucide-react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { fetchRetailerLogoUrl } from '@/lib/retailerLogo';

interface OrderData {
  customerName?: string;
  metal?: string;
  size?: number;
  description?: string;
  status?: string;
  jewelryName?: string;
  basePrice?: number;
  variations?: JewelryVariation[];
  techSpecs?: TechSpec[];
  po_no?: string;
  retailer_id?: number;
  retailer?: {
    id: number;
    retailer_name: string;
    company: string;
    email: string;
    phone: string;
    name_plus_id: string;
    logo_url?: string;
    retailer_logo?: string;
  };
  associate?: {
    id: number;
    nickname: string;
    username: string;
    email: string;
    phone: string;
  };
  [key: string]: any;
}

interface RetailerData {
  id: number;
  retailer_name: string;
  company: string;
  email: string;
  phone: string;
  name_plus_id: string;
  logo_url?: string;
  retailer_logo?: string;
}

interface JewelryVariation {
  id: string;
  name: string;
  price: number;
  changes: string;
}

interface TechSpec {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface ReferenceFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
}

interface CadFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
}

interface ItemData {
  id: number;
  item_name?: string;
  item_desc?: string;
  po_i_no: string;
  fkb_orders_to_items: string;
  Purchase_Item_Number?: string;
  Quantity?: number;
  [key: string]: any;
}

interface VersionData {
  id: number;
  version_name?: string;
  version_desc?: string;
  fkb_items_and_versions?: string;
  status?: string;
  f_s201x17a2bx?: {
    po_i_no: string;
    [key: string]: any;
  };
  references?: any[];
  [key: string]: any;
}

const API_BASE = API_CONFIG.BASE_URL;

// Dynamically load model-viewer script if not present
function useModelViewerScript() {
  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer.min.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);
}

const OrderPage: React.FC = () => {
  useModelViewerScript();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [images, setImages] = useState<ReferenceFile[]>([]);
  const [videos, setVideos] = useState<ReferenceFile[]>([]);
  const [cads, setCads] = useState<CadFile[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [retailer, setRetailer] = useState<RetailerData | null>(null);
  const [retailerLogoUrl, setRetailerLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  // Separate main indices for each media type
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [mainVideoIndex, setMainVideoIndex] = useState(0);
  const [main3dIndex, setMain3dIndex] = useState(0);
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'image' | 'video' | '3d' | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  // Retailer edit state
  const [editingRetailer, setEditingRetailer] = useState(false);
  const [editingRetailerData, setEditingRetailerData] = useState({ name: '', email: '', company: '', phone: '' });
  const [updatingRetailer, setUpdatingRetailer] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    const headers = getAuthHeaders();
    
    // First fetch the order to get the PO number
    fetch(`${API_BASE}/api/orders/${orderId}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((orderRes) => {
        const orderData = orderRes.data || {};
        console.log('Full order response:', orderRes);
        console.log('Order data:', orderData);
        console.log('Retailer field in order:', orderData.retailer);
        setOrder(orderData);
        
        // Set retailer info from the order response
        if (orderData.retailer) {
          setRetailer(orderData.retailer);
          console.log('Retailer info from order:', orderData.retailer);
        } else {
          console.log('No retailer field found in order data');
        }
        // Fetch retailer logo via users endpoints using retailer_id from order
        if (orderData.retailer_id) {
          fetchRetailerLogoUrl(orderData.retailer_id)
            .then((url) => setRetailerLogoUrl(url))
            .catch(() => setRetailerLogoUrl(null));
        }
        
        return orderData;
      })
      .then((orderData) => {
        // Fetch items using new items:list with JSON filter
        if (orderData.po_no) {
          console.log('Fetching items for PO:', orderData.po_no);
          return fetchItemsForOrder(orderData.po_no, headers);
        }
        return null;
      })
      .then((itemsData) => {
        if (itemsData) {
          setItems(itemsData);
          console.log('Items fetched:', itemsData);
          
          // Fetch versions using :list endpoint
          if (itemsData.length > 0) {
            const po_i_nos = itemsData.map(item => item.po_i_no);
            console.log('PO Item Numbers for versions query:', po_i_nos);
            return fetchVersionsForItems(po_i_nos, headers);
          }
        }
        return null;
      })
      .then((versionsData) => {
        if (versionsData) {
          setVersions(versionsData);
          console.log('Versions fetched:', versionsData);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderId]);

  const fetchItemsForOrder = async (poNo: string, headers: HeadersInit): Promise<ItemData[]> => {
    try {
      console.log('Fetching items for order with PO:', poNo);
      
      // Use the exact filter structure
      const filter = encodeURIComponent(JSON.stringify({
        $and: [
          {
            order_id: {
              po_no: {
                $eq: poNo
              }
            }
          }
        ]
      }));
      
      const appends = ['order_id.associate', 'order_id.retailer', 'order_id'];
      const appendsParam = appends.map(append => `appends[]=${append}`).join('&');
      
      const url = `${API_BASE}/api/items:list?pageSize=100&page=1&sort[]=-createdAt&sort[]=po_i_no&${appendsParam}&filter=${filter}`;
      console.log('Fetching items with exact filter structure:', url);
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('Items API response:', data);
        
        if (Array.isArray(data.data)) {
          console.log(`Successfully fetched ${data.data.length} items`);
          return data.data;
        }
      }
      
      console.log('Failed to fetch items, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  };

  const fetchVersionsForItems = async (poINos: string[], headers: HeadersInit): Promise<VersionData[]> => {
    try {
      console.log('Fetching versions for items with PO Item Numbers:', poINos);
      
      // Use the new order-level versions API: v_i_fk.order_id.po_no
      const filter = encodeURIComponent(JSON.stringify({
        $and: [
          { v_i_fk: { order_id: { po_no: { $in: poINos.length > 0 ? [items[0]?.fkb_orders_to_items] : [] } } } }
        ]
      }));

      const url = `${API_BASE}/api/versions:list?pageSize=200&page=1&sort[]=-updatedAt&sort[]=-fkb_items_and_versions&appends[]=v_i_fk.order_id&appends[]=v_i_fk.order_id.retailer&appends[]=v_i_fk&filter=${filter}`;
      console.log('Fetching versions using order-level relation:', url);
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('Versions API response:', data);
        
        if (Array.isArray(data.data)) {
          console.log(`Successfully fetched ${data.data.length} versions`);
          return data.data;
        }
      }
      
      console.log('Failed to fetch versions, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  };

  const handleUpdateRetailer = async () => {
    if (!orderId || !retailer) return;
    
    setUpdatingRetailer(true);
    try {
      const headers = getAuthHeaders();
      
      // Update retailer information using the API endpoint you mentioned: /api/orders/{orderId}/retailer:get
      // Since the endpoint is :get, we'll try using query parameters to update
      const updateData = new URLSearchParams({
        name: editingRetailerData.name,
        email: editingRetailerData.email,
        company: editingRetailerData.company,
        phone: editingRetailerData.phone,
        action: 'update' // Add an action parameter to indicate this is an update
      });
      
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/retailer:get?${updateData.toString()}`, {
        method: 'GET',
        headers: headers,
      });

      if (response.ok) {
        const updatedRetailer = await response.json();
        console.log('Retailer updated successfully:', updatedRetailer);
        
        // Update local state
        setRetailer(updatedRetailer.data);
        setEditingRetailer(false);
        setEditingRetailerData({ name: '', email: '', company: '', phone: '' });
        
        // Show success message or handle as needed
        alert('Retailer information updated successfully!');
      } else {
        throw new Error(`Failed to update retailer: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating retailer:', error);
      alert(`Failed to update retailer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingRetailer(false);
    }
  };

  useEffect(() => {
    if (order && order.variations && order.variations.length > 0 && !selectedVariation) {
      setSelectedVariation(order.variations[0].id);
    }
  }, [order, selectedVariation]);

  if (loading) return (<LoadingScreen />);
  if (error) return <div>Error: {error}</div>;
  if (!order) return <div>No order data found.</div>;

  const currentVariation = order.variations?.find((v: JewelryVariation) => v.id === selectedVariation);
  const basePrice = order.basePrice || 0;
  const totalPrice = basePrice + (currentVariation?.price || 0);

  // Always show metal and size if present
  const techSpecs: TechSpec[] = [
    order.metal ? { label: 'Metal', value: order.metal, icon: <Palette className="w-4 h-4" /> } : null,
    order.size ? { label: 'Ring Size', value: `Size ${order.size}`, icon: <Ruler className="w-4 h-4" /> } : null,
    order.centerStone ? { label: 'Center Stone', value: order.centerStone, icon: <Gem className="w-4 h-4" /> } : null,
    order.setting ? { label: 'Setting', value: order.setting, icon: <Rotate3D className="w-4 h-4" /> } : null,
  ].filter(Boolean) as TechSpec[];

  return (
    <div className="min-h-screen bg-[#fefbf8] font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-yourcustomjewelry.png" alt="Your Custom Jewelry" className="h-8 md:h-10 w-auto" />
          </div>
          <nav className="flex items-center space-x-6"></nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10">
        {/* Retailer Branding (logo above name, centered) */}
        <div className="mb-6 flex flex-col items-center text-center">
          {retailer && (
            <>
              {(retailerLogoUrl || retailer.logo_url || (retailer as any).logo || (retailer as any).retailer_logo) ? (
                <img
                  src={(retailerLogoUrl as string) || (retailer.logo_url as string) || ((retailer as any).logo as string) || ((retailer as any).retailer_logo as string)}
                  alt={retailer.retailer_name || retailer.name_plus_id || 'Retailer Logo'}
                  className="h-16 w-auto object-contain mb-2"
                />
              ) : null}
              <div className="text-lg font-semibold text-gray-900">
                {retailer.name_plus_id || retailer.retailer_name || 'Retailer'}
              </div>
            </>
          )}
        </div>

        {/* Order ID and Status */}
        <div className="mb-6 flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900 font-['Playfair_Display'] tracking-tight">Order ID {orderId}</h2>
          {order.status && (
            <div className="bg-gray-100 border border-gray-200 rounded px-3 py-1.5">
              <span className="text-sm font-medium text-gray-800">{order.status}</span>
            </div>
          )}
          {order.po_no && (
            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
              <span className="text-sm font-medium text-gray-800">PO: {order.po_no}</span>
            </div>
          )}
        </div>
        
        {/* Retailer Info */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Retailer:</span>
                {retailer ? (
                  <>
                    <span className="text-sm font-semibold text-gray-900">
                      {retailer.name_plus_id || retailer.retailer_name || 'Unknown'}
                    </span>
                    {retailer.company && (
                      <span className="text-xs text-gray-500 ml-2">({retailer.company})</span>
                    )}
                    {retailer.email && (
                      <span className="text-xs text-gray-500 ml-3">({retailer.email})</span>
                    )}
                    {retailer.phone && (
                      <span className="text-xs text-gray-500 ml-3">({retailer.phone})</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Loading retailer info...</span>
                )}
              </div>
              {retailer && (
                <button
                  onClick={() => {
                    setEditingRetailerData({
                      name: retailer.retailer_name || '',
                      email: retailer.email || '',
                      company: retailer.company || '',
                      phone: retailer.phone || ''
                    });
                    setEditingRetailer(true);
                  }}
                  className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-black transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-500">
            Debug: retailer state = {retailer ? 'loaded' : 'null'}, order.retailer = {order?.retailer ? 'exists' : 'missing'}
          </div>
        </div>

        {/* Retailer Edit Form */}
        {editingRetailer && (
          <div className="mb-6">
            <div className="bg-white border border-[#4A3C72] rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-[#4A3C72] mb-4">Edit Retailer Information</h3>
              <div className="text-sm text-[#837A75] mb-4">
                Using API endpoint: <code className="bg-gray-100 px-2 py-1 rounded">/api/orders/{orderId}/retailer:get</code>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A3C72] mb-2">Retailer Name</label>
                  <input
                    type="text"
                    value={editingRetailerData.name || ''}
                    onChange={(e) => setEditingRetailerData({...editingRetailerData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A3C72] focus:border-transparent"
                    placeholder="Enter retailer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4A3C72] mb-2">Email</label>
                  <input
                    type="email"
                    value={editingRetailerData.email || ''}
                    onChange={(e) => setEditingRetailerData({...editingRetailerData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A3C72] focus:border-transparent"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4A3C72] mb-2">Company</label>
                  <input
                    type="text"
                    value={editingRetailerData.company || ''}
                    onChange={(e) => setEditingRetailerData({...editingRetailerData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A3C72] focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4A3C72] mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editingRetailerData.phone || ''}
                    onChange={(e) => setEditingRetailerData({...editingRetailerData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A3C72] focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateRetailer}
                    disabled={updatingRetailer}
                    className="bg-[#4A3C72] text-white px-4 py-2 rounded-md hover:bg-[#5440a8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingRetailer ? 'Updating...' : 'Update Retailer'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRetailer(false);
                      setEditingRetailerData({ name: '', email: '', company: '', phone: '' });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Main Content Row: Media and Details */}
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
          {/* Media Container */}
          <div className="w-full md:w-[380px] flex-shrink-0 flex flex-col items-center">
            {/* Main image/media (show image, video, or 3d, whichever is available) */}
            <div className="w-full aspect-square bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden mb-4">
              {/* Show image, video, or 3d preview (keep modal logic) */}
              {images.length > 0 ? (
                <img
                  src={API_BASE + images[mainImageIndex].url}
                  alt={images[mainImageIndex].title}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => { setModalType('image'); setModalIndex(mainImageIndex); setModalOpen(true); }}
                />
              ) : videos.length > 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <video
                    src={API_BASE + videos[mainVideoIndex].url}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => { setModalType('video'); setModalIndex(mainVideoIndex); setModalOpen(true); }}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onError={(e) => console.error('Video error:', e)}
                  />
                  <div className="mt-2 text-sm text-[#837A75]">Video: {videos[mainVideoIndex].title}</div>
                </div>
              ) : cads.length > 0 ? (
                <div
                  className="w-full h-full flex items-center justify-center cursor-zoom-in"
                  title="Preview 3D Model"
                  onClick={() => { setModalType('3d'); setModalIndex(main3dIndex); setModalOpen(true); }}
                >
                  <model-viewer
                    src={API_BASE + cads[main3dIndex].url}
                    alt={cads[main3dIndex].title}
                    environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
                    shadow-intensity="1"
                    camera-controls
                    touch-action="pan-y"
                    style={{ width: '100%', height: '100%' }}
                  ></model-viewer>
                </div>
              ) : (
                <div className="text-[#837A75]">No media available</div>
              )}
            </div>
            {/* Thumbnails for images/videos/3d */}
            <div className="flex gap-2 mt-2">
              {images.map((img, idx) => (
                <button key={img.id} onClick={() => setMainImageIndex(idx)} className={`rounded border-2 p-1 ${mainImageIndex === idx ? 'border-[#4A3C72] bg-[#E6C2FF]' : 'border-gray-200 bg-white'}`}>
                  <img src={API_BASE + img.url} alt={img.title} className="w-10 h-10 object-cover rounded" />
                </button>
              ))}
              {videos.map((video, idx) => (
                <button key={video.id} onClick={() => setMainVideoIndex(idx)} className={`rounded border-2 p-1 ${mainVideoIndex === idx ? 'border-[#4A3C72] bg-[#E6C2FF]' : 'border-gray-200 bg-white'}`}>
                  <Play className="w-6 h-6 text-[#4A3C72]" />
                </button>
              ))}
              {cads.map((cad, idx) => (
                <button key={cad.id} onClick={() => setMain3dIndex(idx)} className={`rounded border-2 p-1 ${main3dIndex === idx ? 'border-[#4A3C72] bg-[#E6C2FF]' : 'border-gray-200 bg-white'}`}>
                  <Rotate3D className="w-6 h-6 text-[#4A3C72]" />
                </button>
              ))}
            </div>
          </div>
          {/* Details and Designer Note */}
          <div className="flex-1 w-full max-w-xl mx-auto md:mx-0 flex flex-col gap-6">
            {/* Specs grid */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="border-b border-gray-100 pb-3 border-r border-gray-100 pr-6">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Metal</div>
                  <div className="text-lg text-gray-900 font-['Inter'] font-medium">{order.metal || '-'}</div>
                </div>
                <div className="border-b border-gray-100 pb-3 pl-6">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Stone</div>
                  <div className="text-lg text-gray-900 font-['Inter'] font-medium">{order.centerStone || '-'}</div>
                </div>
                <div className="border-b border-gray-100 pb-3 border-r border-gray-100 pr-6">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Size</div>
                  <div className="text-lg text-gray-900 font-['Inter'] font-medium">{order.size || '-'}</div>
                </div>
                <div className="border-b border-gray-100 pb-3 pl-6">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Weight</div>
                  <div className="text-lg text-gray-900 font-['Inter'] font-medium">{order.weight || '-'}</div>
                </div>
              </div>
              {/* Designer Note */}
              <div className="bg-gray-50 rounded-lg p-4 font-['Playfair_Display'] text-gray-900">
                <div className="font-bold mb-2">Designer Note</div>
                <div className="text-sm leading-relaxed text-gray-700">{order.description || "We've created a detailed 3D model based on your approved sketch. The proportions showcase the brilliant moissanite beautifully. Please review and approve to proceed crafting."}</div>
              </div>
            </div>
            {/* Variations (keep as before) */}
            {order.variations && order.variations.length > 0 && (
              <Card className="p-6 bg-white border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 font-['Playfair_Display']">Design Variations</h3>
                <div className="space-y-3">
                  {order.variations.map((variation: JewelryVariation) => (
                    <div
                      key={variation.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedVariation === variation.id
                          ? 'border-gray-900 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVariation(variation.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 font-['Inter']">{variation.name}</h4>
                          <p className="text-sm text-gray-500 font-['Inter']">{variation.changes}</p>
                        </div>
                        <div className="text-right">
                          {variation.price > 0 ? (
                            <p className="font-medium text-gray-900 font-['Inter']">+${variation.price}</p>
                          ) : (
                            <p className="text-gray-500 font-['Inter']">Included</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Items and Versions Section */}
        {items.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#4A3C72] font-['Playfair_Display']">Order Items & Versions</h3>
              <div className="flex gap-4 text-sm">
                <span className="bg-[#4A3C72] text-white px-3 py-1 rounded-full">
                  {items.length} Item{items.length !== 1 ? 's' : ''}
                </span>
                <span className="bg-[#837A75] text-white px-3 py-1 rounded-full">
                  {versions.length} Version{versions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="space-y-6">
              {items.map((item) => {
                const itemVersions = versions.filter(v => v.f_s201x17a2bx?.po_i_no === item.po_i_no);
                return (
                  <Card key={item.id} className="p-6 bg-white border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-[#4A3C72]" />
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-[#4A3C72] font-['Inter']">
                            {item.item_name || 'Unnamed Item'}
                          </h4>
                          {item.item_description && (
                            <p className="text-sm text-[#837A75] mt-1 whitespace-pre-line">
                              {item.item_description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-[#837A75] mt-2">
                            <span className="bg-[#f0f8ff] px-2 py-1 rounded border border-[#4A3C72]">
                              <strong>PO Item:</strong> {item.po_i_no}
                            </span>
                            {item.Purchase_Item_Number && (
                              <span className="bg-[#f0f8ff] px-2 py-1 rounded border border-[#4A3C72]">
                                <strong>Purchase Item:</strong> {item.Purchase_Item_Number}
                              </span>
                            )}
                            {item.Quantity && (
                              <span className="bg-[#f0f8ff] px-2 py-1 rounded border border-[#4A3C72]">
                                <strong>Qty:</strong> {item.Quantity}
                              </span>
                            )}
                            {item.emr_number && (
                              <span className="bg-[#f0f8ff] px-2 py-1 rounded border border-[#4A3C72]">
                                <strong>EMR:</strong> {item.emr_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Versions for this item */}
                    {itemVersions.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="w-5 h-5 text-[#4A3C72]" />
                          <h5 className="font-medium text-[#4A3C72]">Versions ({itemVersions.length})</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {itemVersions.map((version) => (
                            <div
                              key={version.id}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-[#4A3C72] text-sm">
                                  {version.version_name || `Version ${version.id}`}
                                </h6>
                                {version.status && (
                                  <Badge variant="secondary" className="text-xs">
                                    {version.status}
                                  </Badge>
                                )}
                              </div>
                              {version.version_desc && (
                                <p className="text-xs text-[#837A75]">{version.version_desc}</p>
                              )}
                              <div className="text-xs text-[#837A75] mt-1">
                                Item: {version.f_s201x17a2bx?.po_i_no || 'Unknown'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {itemVersions.length === 0 && (
                      <div className="mt-4 text-sm text-[#837A75] italic">
                        No versions available for this item
                      </div>
                    )}

                    {/* Order Details for this item */}
                    {item.order_id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-[#4A3C72]" />
                          <h5 className="font-medium text-[#4A3C72]">Order Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-[#f8f9fa] p-3 rounded border">
                            <span className="text-[#837A75]"><strong>Status:</strong></span>
                            <span className="ml-2 text-[#4A3C72] font-medium">{item.order_id.status}</span>
                          </div>
                          <div className="bg-[#f8f9fa] p-3 rounded border">
                            <span className="text-[#837A75]"><strong>Start Date:</strong></span>
                            <span className="ml-2 text-[#4A3C72]">{item.order_id.start_date}</span>
                          </div>
                          <div className="bg-[#f8f9fa] p-3 rounded border">
                            <span className="text-[#837A75]"><strong>Closing Date:</strong></span>
                            <span className="ml-2 text-[#4A3C72]">{item.order_id.closing_date}</span>
                          </div>
                          <div className="bg-[#f8f9fa] p-3 rounded border">
                            <span className="text-[#837A75]"><strong>Plan Ship:</strong></span>
                            <span className="ml-2 text-[#4A3C72]">{item.order_id.plan_ship_date}</span>
                          </div>
                          {item.order_id.description && (
                            <div className="bg-[#f8f9fa] p-3 rounded border md:col-span-2">
                              <span className="text-[#837A75]"><strong>Description:</strong></span>
                              <span className="ml-2 text-[#4A3C72]">{item.order_id.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="mt-12 text-center text-[#837A75]">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No items found for this order</p>
          </div>
        )}

        {/* Debug section - show raw data for troubleshooting */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <div className="text-sm">
            <p><strong>Items count:</strong> {items.length}</p>
            <p><strong>Versions count:</strong> {versions.length}</p>
            <p><strong>Order PO:</strong> {order.po_no}</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Retailer:</strong> {retailer ? `${retailer.name_plus_id || retailer.retailer_name || 'Unknown'} (${retailer.email || 'No email'})` : 'Not fetched'}</p>
            
            {/* Test buttons */}
            <div className="mt-4 space-y-2">
              <button 
                onClick={async () => {
                  const headers = getAuthHeaders();
                  console.log('Testing items API...');
                  try {
                    const response = await fetch(`${API_BASE}/api/items:list?pageSize=10`, { headers });
                    const data = await response.json();
                    console.log('Test items response:', data);
                  } catch (error) {
                    console.error('Test items error:', error);
                  }
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Test Items API
              </button>
              
              <button 
                onClick={async () => {
                  const headers = getAuthHeaders();
                  console.log('Testing versions API...');
                  try {
                    const response = await fetch(`${API_BASE}/api/versions:list?pageSize=10`, { headers });
                    const data = await response.json();
                    console.log('Test versions response:', data);
                  } catch (error) {
                    console.error('Test versions error:', error);
                  }
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs"
              >
                Test Versions API
              </button>
              
              <button 
                onClick={async () => {
                  const headers = getAuthHeaders();
                  console.log('Testing specific order...');
                  try {
                    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, { headers });
                    const data = await response.json();
                    console.log('Test order response:', data);
                  } catch (error) {
                    console.error('Test order error:', error);
                  }
                }}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs"
              >
                Test Order API
              </button>
              
              <button 
                onClick={async () => {
                  const headers = getAuthHeaders();
                  console.log('Testing retailer API...');
                  try {
                    const response = await fetch(`${API_BASE}/api/orders/${orderId}/retailer:get`, { headers });
                    const data = await response.json();
                    console.log('Test retailer response:', data);
                  } catch (error) {
                    console.error('Test retailer error:', error);
                  }
                }}
                className="px-3 py-1 bg-orange-500 text-white rounded text-xs"
              >
                Test Retailer API
              </button>
            </div>
            
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Raw Items Data</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(items, null, 2)}
              </pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Raw Versions Data</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(versions, null, 2)}
              </pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Raw Retailer Data</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(retailer, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-auto bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">© 2024 YOUR CUSTOM JEWELRY. All rights reserved.</div>
        </div>
      </footer>
      {/* Media Preview Modal (keep as before) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center p-6 border border-[#E6C2FF]"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-2xl text-[#837A75] hover:text-[#4A3C72]"
              onClick={() => setModalOpen(false)}
              title="Close"
            >
              <X className="w-8 h-8" />
            </button>
            {/* Media preview (keep as before) */}
            {modalType === 'image' && images[modalIndex] && (
              <img
                src={API_BASE + images[modalIndex].url}
                alt={images[modalIndex].title}
                className="max-w-full max-h-[70vh] object-contain bg-card rounded shadow mb-4"
              />
            )}
            {modalType === 'video' && videos[modalIndex] && (
              <video
                src={API_BASE + videos[modalIndex].url}
                className="max-w-full max-h-[70vh] bg-black rounded shadow mb-4"
                controls
                autoPlay
                loop
                muted
                playsInline
              />
            )}
            {modalType === '3d' && cads[modalIndex] && (
              <model-viewer
                src={API_BASE + cads[modalIndex].url}
                alt={cads[modalIndex].title}
                environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
                shadow-intensity="1"
                camera-controls
                touch-action="pan-y"
                style={{ width: '100%', height: '60vh', background: 'hsl(var(--card))', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #E6C2FF' }}
              ></model-viewer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage; 
