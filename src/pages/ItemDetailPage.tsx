import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { fetchRetailerLogoUrl } from '@/lib/retailerLogo';
import LoadingScreen from '@/components/ui/loading-screen';

interface ItemData {
  id: number;
  item_name: string;
  new_name: string;
  item_description: string;
  Quantity: number | null;
  po_i_no: string;
  fkb_orders_to_items: string;
  item_type?: string;
}

interface VersionData {
  id: number;
  version_number: number;
  version_name: string;
  item_size: string | null;
  item_description: string | null;
  metal_type1: string | null;
  metal_color: string | null;
  stamp_engraving: string | null;
  melee_stones_info: string | null;
  center_stone_info: string | null;
  version_quantity: number | null;
  fkb_items_and_versions: string;
  ijewel_model_id?: string | null;
}

// // Removed image/video reference files; not used anymore
// interface RenderFile {
//   id: number;
//   title: string;
//   url: string;
//   preview: string;
//   mimetype: string;
// }

interface CadFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
}

// Removed render files; not used in UI

interface SketchFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
}

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

const ItemDetailPage: React.FC = () => {
  useModelViewerScript();
  const { itemId } = useParams<{ itemId: string }>();
  const { purchaseNumber } = useParams<{ purchaseNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState<ItemData | null>(null);
  const [itemsInOrder, setItemsInOrder] = useState<ItemData[]>([]);
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [currentVersion, setCurrentVersion] = useState<VersionData | null>(null);
  // No more image references
  // const [images, setImages] = useState<ReferenceFile[]>([]);

  const [cads, setCads] = useState<CadFile[]>([]);
  const [sketches, setSketches] = useState<SketchFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Media indices
  // Index for sketch list
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [main3dIndex, setMain3dIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'CAD' | 'Images' | 'Sketch'>('Images');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'image' | null>(null);
  const [modalIndex, setModalIndex] = useState(0);

  // New: retailer info and logo
  const [retailerInfo, setRetailerInfo] = useState<any | null>(null);
  const [retailerLogoUrl, setRetailerLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // If we have a PO number, fetch the order to get retailer info
    const poNumber = purchaseNumber || item?.fkb_orders_to_items;
    if (!poNumber) return;

    const fetchRetailerFromOrder = async () => {
      try {
        const headers = getAuthHeaders();
        const filter = encodeURIComponent(JSON.stringify({ "$and": [ { po_no: { $eq: String(poNumber) } } ] }));
        const url = `${API_CONFIG.BASE_URL}/api/orders:list?pageSize=1&page=1&appends[]=retailer&filter=${filter}&fields[]=id&fields[]=po_no&fields[]=retailer_id&fields[]=retailer`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
          console.error('Retailer fetch failed:', res.status, res.statusText);
          return;
        }
        const data = await res.json();
        const orderRow = Array.isArray(data.data) ? data.data[0] : null;
        const retailer = orderRow?.retailer || null;
        setRetailerInfo(retailer);
        // console.log('Retailer from orders:list:', retailer);
        // Fetch retailer logo via users endpoints using retailer_id
        const retailerId = orderRow?.retailer_id ?? retailer?.retailer_id;
        if (retailerId) {
          try {
            const url = await fetchRetailerLogoUrl(retailerId);
            if (url) setRetailerLogoUrl(url);
          } catch (e) {
            console.warn('fetchRetailerLogoUrl failed', e);
          }
        }
      } catch (e) {
        console.error('Error fetching retailer via PO:', e);
      }
    };

    fetchRetailerFromOrder();
  }, [purchaseNumber, item?.fkb_orders_to_items]);

  useEffect(() => {
    // If navigated via PO number route, fetch items for that order
    if (purchaseNumber) {
      const fetchItemsForOrder = async () => {
        setLoading(true);
        setError("");
        try {
          const itemsFilter = encodeURIComponent(JSON.stringify({
            $and: [
              { order_id: { po_no: { $eq: String(purchaseNumber) } } }
            ]
          }));
          const itemsUrl = `${API_CONFIG.BASE_URL}/api/items:list?pageSize=50&page=1&sort[]=createdAt&appends[]=order_id&filter=${itemsFilter}&fields[]=id&fields[]=item_name&fields[]=new_name&fields[]=item_description&fields[]=Quantity&fields[]=po_i_no&fields[]=fkb_orders_to_items&fields[]=order_id`;
          const res = await fetch(itemsUrl, { headers: getAuthHeaders() });
          if (!res.ok) throw new Error('Failed to fetch items for order');
          const data = await res.json();
          const orderItems: ItemData[] = Array.isArray(data.data) ? data.data : [];
          // Sort by creation ascending (already sorted), set state
          setItemsInOrder(orderItems);
          if (orderItems.length > 0) {
            setItem(orderItems[0]);
          }
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchItemsForOrder();
      return;
    }
    if (!itemId) return;
    
    // Log the navigation state for debugging
    console.log('ItemDetailPage navigation state:', location.state);
    
    const fetchData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Check if item and versions data was passed from navigation state
        const navigationState = location.state as { itemData?: any; versions?: any[] } | null;
        
        // Use item data from navigation state if available
        if (navigationState?.itemData) {
          console.log('Using item data from navigation state:', navigationState.itemData);
          setItem(navigationState.itemData);
        }
        
        // Use versions data from navigation state if available
        if (!purchaseNumber && navigationState?.versions && navigationState.versions.length > 0) {
          console.log('Using versions from navigation state:', navigationState.versions);
          // Sort by version number (highest first)
          const sortedVersions = [...navigationState.versions].sort((a: any, b: any) => b.version_number - a.version_number);
          setVersions(sortedVersions);
          setCurrentVersion(sortedVersions[0]); // Set to latest version
        }
        
        // Only fetch item details from API if none were passed from navigation state
        if (!purchaseNumber && !navigationState?.itemData) {
          console.log('No item data from navigation state, fetching from API...');
          const itemResponse = await fetch(`${API_CONFIG.BASE_URL}/api/items:get:${itemId}`, {
            headers: getAuthHeaders()
          });
          
          if (!itemResponse.ok) {
            const errorText = await itemResponse.text();
            console.error('Item API response:', itemResponse.status, itemResponse.statusText);
            console.error('Error response body:', errorText);
            throw new Error(`Failed to fetch item: ${itemResponse.status} ${itemResponse.statusText}`);
          }
          
          const itemData = await itemResponse.json();
          setItem(itemData.data);
        }
        
        // Only fetch versions from API if none were passed from navigation state
        if (!purchaseNumber && (!navigationState?.versions || navigationState.versions.length === 0)) {
          // Only fetch versions here if we have item's po_i_no from navigation state.
          // Otherwise, we'll fetch versions in the separate effect once item is loaded.
          const po_i_no = navigationState?.itemData?.po_i_no;
          if (po_i_no) {
            console.log('Fetching versions from API using navigation item po_i_no...');
            const versionsFilter = encodeURIComponent(JSON.stringify({
              $and: [
                { v_i_fk: { po_i_no: { $eq: po_i_no } } }
              ]
            }));
            const versionsUrl = `${API_CONFIG.BASE_URL}/api/versions:list?pageSize=100&page=1&sort[]=-updatedAt&appends[]=v_i_fk&filter=${versionsFilter}`;
            const versionsResponse = await fetch(versionsUrl, { headers: getAuthHeaders() });
            if (!versionsResponse.ok) {
              const errorText = await versionsResponse.text();
              console.error('Versions API response:', versionsResponse.status, versionsResponse.statusText);
              console.error('Error response body:', errorText);
              throw new Error(`Failed to fetch versions: ${versionsResponse.status} ${versionsResponse.statusText}`);
            }
            const versionsData = await versionsResponse.json();
            const itemVersions = Array.isArray(versionsData.data) ? versionsData.data : [];
            itemVersions.sort((a: any, b: any) => b.version_number - a.version_number);
            setVersions(itemVersions);
            if (itemVersions.length > 0) {
              setCurrentVersion(itemVersions[0]);
            }
          }
        }
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [itemId, location.state]);

  useEffect(() => {
    if (!item) return;
    // When item changes (including via PO toggle), refetch versions for that item
    const fetchVersionsForItem = async () => {
      setLoading(true);
      try {
        const versionsFilter = encodeURIComponent(JSON.stringify({
          $and: [
            { v_i_fk: { po_i_no: { $eq: item.po_i_no } } }
          ]
        }));
        const versionsUrl = `${API_CONFIG.BASE_URL}/api/versions:list?pageSize=100&page=1&sort[]=-updatedAt&appends[]=v_i_fk&filter=${versionsFilter}`;
        const versionsResponse = await fetch(versionsUrl, { headers: getAuthHeaders() });
        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          const itemVersions = Array.isArray(versionsData.data) ? versionsData.data : [];
          itemVersions.sort((a: any, b: any) => b.version_number - a.version_number);
          setVersions(itemVersions);
          setCurrentVersion(itemVersions[0] || null);
        }
      } catch (e) {
        console.warn('Failed to fetch versions for item:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVersionsForItem();
  }, [item]);
  useEffect(() => {
    if (!currentVersion) return;
    
    const fetchVersionMedia = async () => {
      try {
        // Clear previous version media immediately to avoid stale tab options
        setCads([]);
        setSketches([]);
        // Keep activeTab consistent; it will be corrected by availability effects below
        // No image references needed
              // Fetch references (images and videos) for selected item
        // try {
        //   const refsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/references:list`, {
        //     headers: getAuthHeaders()
        //   });
          
        //   if (refsResponse.ok) {
        //     const refsData = await refsResponse.json();
        //     const refs: ReferenceFile[] = Array.isArray(refsData.data) ? refsData.data : [];
        //     const imageRefs = refs.filter(f => f.mimetype.startsWith("image/"));
        //     // const videoRefs = refs.filter(f => f.mimetype.startsWith("video/"));
        //     setImages(imageRefs);
        //     // setVideos(videoRefs);
        //   }
        // } catch (err) {
        //   console.warn('Failed to fetch references:', err);
        // }

        // Fetch CAD file via get endpoint (single current CAD for version)
        try {
          const cadGetResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/cad_file:get`, {
            headers: getAuthHeaders()
          });
          if (cadGetResponse.ok) {
            const cadData = await cadGetResponse.json();
            const cadItem = cadData?.data;
            setCads(cadItem ? [cadItem] : []);
          } else {
            setCads([]);
          }
        } catch (err) {
          console.warn('Failed to fetch CAD file via get:', err);
          setCads([]);
        }

        
        // Fetch render files (list endpoint similar to references) for selected item
        // try {
        //   const rendersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/render_file:list`, {
        //     headers: getAuthHeaders()
        //   });
        //   if (rendersResponse.ok) {
        //     const rendersData = await rendersResponse.json();
        //     setRenders(Array.isArray(rendersData.data) ? rendersData.data : []);
        //   }
        // } catch (err) {
        //   console.warn('Failed to fetch render files:', err);
        // }

        // Fetch sketch files (list endpoint)
        try {
          const sketchesResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/sketch_file:list`, {
            headers: getAuthHeaders()
          });
          if (sketchesResponse.ok) {
            const sketchesData = await sketchesResponse.json();
            setSketches(Array.isArray(sketchesData.data) ? sketchesData.data : []);
          }
        } catch (err) {
          console.warn('Failed to fetch sketch files:', err);
        }
        
      } catch (err) {
        console.error('Error fetching version media:', err);
      }
    };
    
    fetchVersionMedia();
  }, [currentVersion]);

  // Choose default tab based on availability (prefer CAD, then Sketch)
  useEffect(() => {
    if (currentVersion?.ijewel_model_id || cads.length > 0) {
      setActiveTab('CAD');
      return;
    }
    if (sketches.length > 0) {
      setActiveTab('Sketch');
      return;
    }
    setActiveTab('CAD');
  }, [currentVersion?.ijewel_model_id, cads.length, sketches.length]);

  // Ensure active tab remains valid when availability changes
  useEffect(() => {
    const hasCad = Boolean(currentVersion?.ijewel_model_id) || cads.length > 0;
    const hasSketch = sketches.length > 0;
    if (activeTab === 'CAD' && !hasCad) {
      setActiveTab(hasSketch ? 'Sketch' : 'CAD');
    } else if (activeTab === 'Sketch' && !hasSketch) {
      setActiveTab(hasCad ? 'CAD' : 'CAD');
    }
  }, [activeTab, currentVersion?.ijewel_model_id, cads.length, sketches.length]);

  // Reset indices when switching tabs
  useEffect(() => {
    setMainImageIndex(0);
    setMain3dIndex(0);
  }, [activeTab]);

  const handleVersionChange = (version: VersionData) => {
    setCurrentVersion(version);
    // Reset media indices
    setMainImageIndex(0);
    setMainVideoIndex(0);
    setMain3dIndex(0);
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) return (<LoadingScreen />);
  
  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl text-red-600">Error: {error}</div>
    </div>
  );

  if (!item || !currentVersion) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl text-red-600">No item or version data found</div>
    </div>
  );

  // Only sketch media is used for non-CAD tab
    // Build media arrays
  // Show CAD in Images tab the same way as Sketch (simple <img>)
  const imageMedia = [
    ...cads.map(c => ({ ...c, type: 'image' as const })),
  ];
  const sketchMedia = [
    ...sketches.map(s => ({ ...s, type: 'image' as const })),
  ];
  const allMedia = activeTab === 'Sketch' ? sketchMedia : imageMedia;

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} aria-label="Go to Home">
              <img src="/logo-yourcustomjewelry.png" alt="Your Custom Jewelry" className="h-8 md:h-10 w-auto" />
            </button>
          </div>
          <nav className="flex items-center space-x-6"></nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10">
        {/* Retailer Branding (centered at top) */}
        {(retailerInfo || retailerLogoUrl) && (
          <div className="mb-6 flex flex-col items-center text-center">
            {retailerLogoUrl && (
              <img
                src={retailerLogoUrl}
                alt={retailerInfo?.company || 'Retailer Logo'}
                className="h-16 w-auto object-contain mb-2"
              />
            )}
            {!retailerLogoUrl && (
            <div className="text-lg font-semibold text-gray-900">
              {retailerInfo?.company || ''}
            </div>
            )}
          </div>
        )}
        {/* Back Button and Header */}
        <div className="mb-6">
          {/* <Button 
            variant="ghost" 
            onClick={goBack}
            className="mb-4 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </Button> */}
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Purchase Order: {item.fkb_orders_to_items}</div>
            <h1 className="text-3xl font-semibold text-gray-900 font-['Playfair_Display'] tracking-tight">
              {item.new_name}
            </h1>
          </div>
        </div>

        {/* Item Toggle (if navigated via PO) */}
        {purchaseNumber && itemsInOrder.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Item</h3>
            <div className="flex gap-2 flex-wrap">
              {itemsInOrder.map((itm, idx) => (
                <Button
                  key={itm.id}
                  variant={item?.id === itm.id ? "default" : "outline"}
                  onClick={() => {
                    setItem(itm);
                    setVersions([]);
                    setCurrentVersion(null);
                  }}
                  className={item?.id === itm.id ? 
                    "bg-gray-900 text-white" : 
                    "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                >
                  {/* {`Item ${idx + 1}`} */}
                  {itm.new_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Version Selector */}
        {versions.length > 1 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Version</h3>
            <div className="flex gap-2 flex-wrap">
              {versions.map((version) => (
                <Button
                  key={version.id}
                  variant={currentVersion && currentVersion.id === version.id ? "default" : "outline"}
                  onClick={() => handleVersionChange(version)}
                  className={currentVersion && currentVersion.id === version.id ? 
                    "bg-gray-900 text-white" : 
                    "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                >
                  Version {version.version_number}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Row: Media and Details */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Media Container */}
          <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col items-center">
            {/* Media Tabs */}
            <div className="w-full mb-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="flex w-full gap-2">
                  {currentVersion?.ijewel_model_id && (
                    <TabsTrigger value="CAD">3D Model</TabsTrigger>
                  )}
                  {cads.length > 0 && (
                    <TabsTrigger value="Images">CAD</TabsTrigger>
                  )}
                  {sketches.length > 0 && (
                    <TabsTrigger value="Sketch">Sketch</TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>

            {/* CAD Viewer (iframe) */}
            {activeTab === 'CAD' && currentVersion.ijewel_model_id && (
              <div className="w-full mb-4 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  title="CAD Viewer"
                  frameBorder={0}
                  allowFullScreen
                  mozallowfullscreen="true"
                  webkitallowfullscreen="true"
                  width="100%"
                  height="360px"
                  allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                  src={`https://drive.ijewel3d.com/drive/files/${currentVersion.ijewel_model_id}/embedded`}
                />
              </div>
            )}
            {/* Images/Sketch display: render as simple images */}

            {activeTab !== 'CAD' && (

<div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">

  {allMedia.length > 0 ? (

    <img

      src={API_CONFIG.BASE_URL + allMedia[mainImageIndex].url}

      alt={allMedia[mainImageIndex].title}

      className="w-full h-full object-contain cursor-zoom-in"

      onClick={() => { setModalType('image'); setModalIndex(mainImageIndex); setModalOpen(true); }}

    />

  ) : (

    <div className="text-[#837A75] text-center">

      <Image className="w-16 h-16 mx-auto mb-2 text-[#837A75]" />

      <p>No media available</p>

    </div>

  )}

</div>

)}
            

            {/* Media carousel for Sketch */}

            {activeTab === 'Sketch' && allMedia.length > 1 && (

<Carousel className="w-full max-w-[400px]">

  <CarouselContent>

    {allMedia.map((media, index) => (

      <CarouselItem key={media.id} className="basis-1/4">

        <div className="p-1">

          <div 

            className={`aspect-square bg-white rounded border-2 overflow-hidden cursor-pointer hover:border-[#4A3C72] transition-colors ${

              index === mainImageIndex ? 'border-[#4A3C72]' : 'border-gray-200'

            }`}

            onClick={() => setMainImageIndex(index)}

          >
                            <img
                              src={API_CONFIG.BASE_URL + media.url}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0">
            <Card className="p-6 bg-white border border-gray-200 shadow-sm mb-6">
              {/* <h3 className="text-lg font-medium text-gray-900 font-['Playfair_Display']">Details</h3> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentVersion.item_size && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Item Size</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.item_size}</div>
                  </div>
                )}
                {currentVersion.metal_color && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Metal Color</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.metal_color}</div>
                  </div>
                )}
                {currentVersion.metal_type1 && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Metal Type</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.metal_type1}</div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-auto bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">Copyright © 2025 Your Custom Jewelry. All rights reserved.</div>
        </div>
      </footer>

      {/* Media Preview Modal (sketch images only) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-6 border border-[#E6C2FF]"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800"
              onClick={() => setModalOpen(false)}
              title="Close"
            >
              <X className="w-8 h-8" />
            </button>
            
            {modalType === 'image' && allMedia[modalIndex] && allMedia[modalIndex].type === 'image' && (

<img

  src={API_CONFIG.BASE_URL + allMedia[modalIndex].url}

  alt={allMedia[modalIndex].title}

  className="max-w-full max-h-[70vh] object-contain bg-card rounded shadow mb-4"

/>

)}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#4A3C72] mb-2">
                {allMedia[modalIndex]?.title}
              </h3>
              <p className="text-sm text-[#837A75]">
                Image {modalIndex + 1} of {allMedia.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;
