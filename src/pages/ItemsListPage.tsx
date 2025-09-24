import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Eye, User } from 'lucide-react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface OrderData {
  id: number;
  po_no: string;
  description: string;
  status: string;
  retailer_id: number;
  start_date: string;
  closing_date: string;
  fedex_tracking_number: string | null;
  associate_key: string;
  retailer?: {
    id: number;
    retailer_name: string;
    company: string;
    email: string;
    phone: string;
    name_plus_id: string;
  };
}

interface ItemData {
  id: number;
  item_name: string;
  item_description: string;
  Quantity: number | null;
  po_i_no: string;
  fkb_orders_to_items: string;
  item_type?: string;
  versions?: any[];
}

interface RetailerData {
  id: number;
  retailer_name: string;
  company: string;
  email: string;
  phone: string;
  name_plus_id: string;
}

const ItemsListPage: React.FC = () => {
  const { purchaseNumber } = useParams<{ purchaseNumber: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [retailer, setRetailer] = useState<RetailerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!purchaseNumber) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError("");
      
      try {
        console.log('Fetching data for purchase number:', purchaseNumber);
        
        // Step 1: Get the order with associate and retailer using new list API and JSON filter
        const orderFilter = encodeURIComponent(JSON.stringify({
          $and: [
            { po_no: { $eq: String(purchaseNumber) } }
          ]
        }));
        const ordersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/orders:list?pageSize=1&page=1&appends[]=associate&appends[]=retailer&filter=${orderFilter}`, {
          headers: getAuthHeaders()
        });
        
        if (!ordersResponse.ok) {
          const errorText = await ordersResponse.text();
          console.error('Orders API response:', ordersResponse.status, ordersResponse.statusText);
          console.error('Error response body:', errorText);
          throw new Error(`Failed to fetch order: ${ordersResponse.status} ${ordersResponse.statusText}`);
        }
        
        const ordersData = await ordersResponse.json();
        console.log('Orders data received:', ordersData);
        
        const orderSummary = Array.isArray(ordersData.data) ? ordersData.data[0] : ordersData.data;
        console.log('Order summary:', orderSummary);
        
        if (!orderSummary) {
          throw new Error(`No order found with purchase number: ${purchaseNumber}`);
        }
        
        // We already have associate and retailer appended
        setOrder(orderSummary);
        setRetailer(orderSummary.retailer || null);
        
        // Step 2: Get all items for this order using the new list API with JSON filter and appends
        console.log('Fetching items...');
        const itemsFilter = encodeURIComponent(JSON.stringify({
          $and: [
            { order_id: { po_no: { $eq: String(purchaseNumber) } } }
          ]
        }));
        const itemsUrl = `${API_CONFIG.BASE_URL}/api/items:list?pageSize=100&page=1&sort[]=-createdAt&sort[]=po_i_no&appends[]=order_id.associate&appends[]=order_id.retailer&appends[]=order_id&filter=${itemsFilter}`;
        const itemsResponse = await fetch(itemsUrl, {
          headers: getAuthHeaders()
        });
        
        if (!itemsResponse.ok) {
          const errorText = await itemsResponse.text();
          console.error('Items API response:', itemsResponse.status, itemsResponse.statusText);
          console.error('Error response body:', errorText);
          throw new Error(`Failed to fetch items: ${itemsResponse.status} ${itemsResponse.statusText}`);
        }
        
        const itemsData = await itemsResponse.json();
        console.log('Items data received:', itemsData);
        
        const orderItems = Array.isArray(itemsData.data) ? itemsData.data : [];
        console.log('Items for this order (server-filtered):', orderItems);
        
        // Step 3: Fetch versions for this order using the new API relation via v_i_fk.order_id.po_no
        console.log('Fetching all versions...');
        let allVersions: any[] = [];
        const versionsFilter = encodeURIComponent(JSON.stringify({
          $and: [
            { v_i_fk: { order_id: { po_no: { $eq: String(purchaseNumber) } } } }
          ]
        }));
        const versionsUrl = `${API_CONFIG.BASE_URL}/api/versions:list?pageSize=200&page=1&sort[]=-updatedAt&sort[]=-fkb_items_and_versions&appends[]=v_i_fk.order_id&appends[]=v_i_fk.order_id.retailer&appends[]=v_i_fk&filter=${versionsFilter}`;
        const versionsResponse = await fetch(versionsUrl, { headers: getAuthHeaders() });
        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          console.log('Versions data received:', versionsData);
          allVersions = Array.isArray(versionsData.data) ? versionsData.data : [];
        }
        
        // Step 4: Assign versions to each item based on po_i_no linkage
        const itemsWithVersions = orderItems.map((item: any) => {
          const itemVersions = allVersions.filter((version: any) => version?.v_i_fk?.po_i_no === item.po_i_no);
          
          console.log(`Found ${itemVersions.length} versions for item ${item.id} (${item.po_i_no}):`, itemVersions);
          console.log(`Item ${item.id} versions breakdown:`, {
            itemId: item.id,
            po_i_no: item.po_i_no,
            versionsCount: itemVersions.length,
            versionIds: itemVersions.map(v => v.id)
          });
          
          return { ...item, versions: itemVersions };
        });
        
        console.log('Final items with versions:', itemsWithVersions);
        console.log('Total versions across all items:', itemsWithVersions.reduce((sum, item) => sum + (item.versions?.length || 0), 0));
        setItems(itemsWithVersions);
        
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [purchaseNumber]);

  const handleItemClick = (item: ItemData) => {
    // Pass the complete item data including versions through navigation state
    navigate(`/item/${item.id}`, { 
      state: { 
        itemData: item,
        versions: item.versions 
      } 
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl text-gray-700">Loading...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl text-red-600">Error: {error}</div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl text-red-600">No order found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col text-[#1f2937]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 font-['Playfair_Display']">BYONDJEWELRY</h1>
          </div>
          <nav className="flex items-center space-x-6"></nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10">
        {/* Order Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-semibold text-gray-900 font-['Playfair_Display'] tracking-tight">
              Purchase Order: {order.po_no}
            </h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border border-gray-200">
              {order.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 bg-white border border-gray-200 shadow-sm w-full">
              <div className="flex items-start gap-3">
                <User className="w-6 h-6 text-gray-700 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Retailer</div>
                  <div className="text-xl text-gray-900 font-semibold">
                    {retailer?.company || 'N/A'}
                  </div>
                  {/* {retailer?.company && (retailer?.retailer_name
                    <div className="text-sm text-gray-500">{retailer.company}</div>
                  )}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {retailer?.email && (
                      <div className="text-gray-900"><span className="text-gray-500">Email:</span> <span className="ml-1">{retailer.email}</span></div>
                    )}
                    {retailer?.phone && (
                      <div className="text-gray-900"><span className="text-gray-500">Phone:</span> <span className="ml-1">{retailer.phone}</span></div>
                    )}
                  </div> */}
                </div>
              </div>
            </Card>

            {order.description && (
              <Card className="p-6 bg-white border border-gray-200 shadow-sm w-full">
                <div className="text-xs text-gray-500 font-medium tracking-wide uppercase mb-2">Order Description</div>
                <p className="text-gray-800 leading-relaxed">{order.description}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Playfair_Display']">
              Items ({items.length})
            </h2>
            {/* Removed total versions across items for cleaner minimal look */}
          </div>
          
          {items.length === 0 ? (
            <Card className="p-12 bg-white border border-gray-200 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base">No items found for this purchase order</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <Card 
                  key={item.id}
                  className="bg-white border border-gray-200 shadow-sm"
                >
                  {/* Item Header */}
                  <div className="p-6 border-b bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-medium text-gray-900 mb-1 font-['Playfair_Display']">
                          {item.item_name}
                        </h3>
                      </div>
                      <div className="text-right"></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {item.Quantity || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Order Ref:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {item.fkb_orders_to_items}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Item Type:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {item.item_type || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Item Content - Simplified without tabs */}
                  <div className="p-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 font-['Playfair_Display']">Item Summary</h4>
                      <p className="text-gray-600">This item has {item.versions?.length || 0} versions.</p>
                    </div>
                  </div>
                  
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleItemClick(item)}
                      className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-auto bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">© 2024 BYONDJEWELRY. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default ItemsListPage;

