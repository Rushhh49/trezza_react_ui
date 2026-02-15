import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Image } from 'lucide-react';
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
  render_link?: string | null;
}

// Removed image/video reference files; not used anymore
interface RenderFile {
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

// Removed render files; not used in UI

interface SketchFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
}

interface ThreeDModelFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
  extname: string;
}


// Dynamically load model-viewer script if not present
// function useModelViewerScript() {
//   useEffect(() => {
//     if (!document.querySelector('script[data-model-viewer]')) {
//       const script = document.createElement("script");
//       script.type = "module";
//       script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
//       script.setAttribute("data-model-viewer", "true");
//       document.head.appendChild(script);
//     }
//   }, []);
// }


const ItemDetailPage_3D: React.FC = () => {
  // useModelViewerScript();
  const { itemId } = useParams<{ itemId: string }>();
  const { purchaseNumber } = useParams<{ purchaseNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState<ItemData | null>(null);
  const [itemsInOrder, setItemsInOrder] = useState<ItemData[]>([]);
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [currentVersion, setCurrentVersion] = useState<VersionData | null>(null);
  // No more image references
  const [renders, setRenders] = useState<RenderFile[]>([]);

  const [cads, setCads] = useState<CadFile[]>([]);
  const [sketches, setSketches] = useState<SketchFile[]>([]);

  const [threeDModels, setThreeDModels] = useState<ThreeDModelFile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Media indices
  // Index for sketch list
  const [mainImageIndex, setMainImageIndex] = useState(0); // sketches
  const [mainCadIndex, setMainCadIndex] = useState(0);     // CAD images


  const [main3dIndex, setMain3dIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'CAD' | 'Images' | 'Sketch'>('CAD');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'image' | null>(null);
  const [modalIndex, setModalIndex] = useState(0);

  // New: retailer info and logo
  const [retailerInfo, setRetailerInfo] = useState<any | null>(null);
  const [retailerLogoUrl, setRetailerLogoUrl] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(10);
  

  useEffect(() => {
    // Only start countdown if item OR version is missing
    if (item && currentVersion) return;
  
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
  }, [item, currentVersion, navigate]);

  useEffect(() => {
    if (item && currentVersion) {
      setCountdown(10);
    }
  }, [item, currentVersion]);
  
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
        setThreeDModels([]);

    

        // Fetch CAD file via get endpoint (single current CAD for version)
        try {
          const cadGetResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/cad_file:list`, {
            headers: getAuthHeaders()
          });
          if (cadGetResponse.ok) {
        const cadData = await cadGetResponse.json();
        setCads(Array.isArray(cadData.data) ? cadData.data : []);
          }
        } catch (err) {
          console.warn('Failed to fetch sketch files:', err);
        }

        
        // Fetch render files (list endpoint similar to references) for selected item
        try {
          const rendersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/render_image:list`, {
            headers: getAuthHeaders()
          });
          if (rendersResponse.ok) {
            const rendersData = await rendersResponse.json();
            setRenders(Array.isArray(rendersData.data) ? rendersData.data : []);
          }
        } catch (err) {
          console.warn('Failed to fetch render files:', err);
        }

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

        // Fetch 3D model files (GLB)
try {
  const modelResponse = await fetch(
    `${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/threed_model:list`,
    { headers: getAuthHeaders() }
  );

  if (modelResponse.ok) {
    const modelData = await modelResponse.json();
    setThreeDModels(Array.isArray(modelData.data) ? modelData.data : []);
  }
} catch (err) {
  console.warn("Failed to fetch 3D model files:", err);
}

        
      } catch (err) {
        console.error('Error fetching version media:', err);
      }
    };
    
    fetchVersionMedia();
  }, [currentVersion]);

  // Choose default tab based on availability (prefer 3D Model, then CAD, then Sketch)
  useEffect(() => {
    if (threeDModels.length > 0 || currentVersion?.ijewel_model_id || currentVersion?.render_link) {
      setActiveTab('CAD'); // 3D Model tab
      return;
    }
    if (cads.length > 0) {
      setActiveTab('Images'); // CAD files tab
      return;
    }
    if (sketches.length > 0) {
      setActiveTab('Sketch');
      return;
    }
    setActiveTab('CAD');
  }, [threeDModels.length,currentVersion?.ijewel_model_id, currentVersion?.render_link, cads.length, sketches.length]);

  // Ensure active tab remains valid when availability changes
  useEffect(() => {
    const has3DModel =
  threeDModels.length > 0 ||
  Boolean(currentVersion?.ijewel_model_id || currentVersion?.render_link);

    const hasCad = cads.length > 0;
    const hasSketch = sketches.length > 0;
    
    if (activeTab === 'CAD' && !has3DModel) {
      setActiveTab(hasCad ? 'Images' : (hasSketch ? 'Sketch' : 'CAD'));
    } else if (activeTab === 'Images' && !hasCad) {
      setActiveTab(has3DModel ? 'CAD' : (hasSketch ? 'Sketch' : 'CAD'));
    } else if (activeTab === 'Sketch' && !hasSketch) {
      setActiveTab(has3DModel ? 'CAD' : (hasCad ? 'Images' : 'CAD'));
    }
  }, [activeTab, currentVersion?.ijewel_model_id, currentVersion?.render_link, cads.length, sketches.length]);

  // Reset indices when switching tabs
  useEffect(() => {
    setMainImageIndex(0);
    setMainCadIndex(0);
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
      <div className="text-xl text-gray-600">No item or version data found. 
        <br />
        Redirecting to home page in {countdown} seconds...</div>
    </div>
  );

  // Only sketch media is used for non-CAD tab
    // Build media arrays
  // Show CAD in Images tab the same way as Sketch (simple <img>)
  const cadMedia = cads.map(c => ({ ...c, type: 'image' as const }));
  const sketchMedia = sketches.map(s => ({ ...s, type: 'image' as const }));
  
  const activeGLB =
  threeDModels.length > 0
    ? API_CONFIG.BASE_URL + threeDModels[0].url
    // : "../../public/test.glb";
    :null;

  console.log(threeDModels)

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur" style = {{boxShadow: "0px -50px 100px grey"}}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center" style={{ justifyContent: "center" }}>
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
        <div className="mb-6 text-center">
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Purchase Order: {item.fkb_orders_to_items}</div>
            {/* <h1 className="text-3xl font-semibold text-gray-900 font-['Playfair_Display'] tracking-tight">
              {item.new_name}
            </h1> */}
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
                    // Only change if it's a different item
                    if (item?.id !== itm.id) {
                      setItem(itm);
                      setVersions([]);
                      setCurrentVersion(null);
                    }
                  }}
                  className={item?.id === itm.id ? 
                    "text-white" : 
                    "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                  style={
                    item?.id === itm.id
                      ? { backgroundColor: "rgb(165 154 119 / var(--tw-bg-opacity, 1))" }
                      : { backgroundColor: "white" }
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
                  onClick={() => {
                    // Only change if it's a different version
                    if (currentVersion?.id !== version.id) {
                      handleVersionChange(version);
                    }
                  }}
                  className={
                    currentVersion && currentVersion.id === version.id
                      ? "text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                  style={
                    currentVersion && currentVersion.id === version.id
                      ? { backgroundColor: "rgb(165 154 119 / var(--tw-bg-opacity, 1))" }
                      : { backgroundColor: "white" }
                  }
                >
                  Version {version.version_number}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Row: Media and Details */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-[90vw] lg:w-full">
          {/* Media Container */}
          <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col items-center">
            {/* Media Tabs */}
            <div className="w-full mb-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="flex w-full gap-2">
                {(currentVersion?.ijewel_model_id || currentVersion?.render_link) && (
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
            {activeTab === 'CAD' && (
  <>
    {activeGLB ? (
      // Render iJewel iframe
      <div className="w-full mb-4 rounded-lg overflow-hidden border border-gray-200">
        {/* <iframe
          title="CAD Viewer"
          frameBorder={0}
          allowFullScreen
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
          width="100%"
          height="360px"
          allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
          src={`https://drive.ijewel3d.com/drive/files/${currentVersion.ijewel_model_id}/embedded`}
        /> */}
        <model-viewer
          // src="https://modelviewer.dev/shared-assets/models/silver-gold.gltf"
          // src="https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb"
          // src="public/test.glb"
          src={activeGLB || undefined}
          camera-controls
          auto-rotate
          ar
          ar-modes="webxr scene-viewer quick-look"
          style={{
            width: "100%",
            height: "360px",
            background: "#f5f5f5"
          }}
        >
        </model-viewer>


      </div>
    ) : currentVersion.render_link && !currentVersion.ijewel_model_id ? (
      // Clickable div for render link redirection
      <div
  className="relative w-full mb-4 h-96 rounded-lg border border-gray-200 overflow-hidden cursor-pointer group "
>
        {/* Background image with blur */}
        <model-viewer
        // src="https://modelviewer.dev/shared-assets/models/silver-gold.gltf"
        // src="https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb"
        // src="../../public/test.glb"
        src={activeGLB || undefined}
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-orbit="-45deg 55deg 4m"
        style={{
          width: "100%",
          height: "100%",
          background: "#f8f8f8"
        }}
      >
      <effect-composer>
        {/* <ssao-effect intensity="1.2"></ssao-effect> */}
        {/* <bloom-effect intensity="0.2" threshold="0.01"></bloom-effect> */}
        {/* <color-grade-effect saturation="0.12" contrast="0.08"></color-grade-effect> */}
      </effect-composer>
      </model-viewer>

  

</div>

    ) : (
      // Fallback if no ijewel model or render link
      <div className="w-full mb-4 h-96 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
        <div className="text-center">
          <Image className="w-12 h-12 mx-auto mb-2 text-[#837A75]" />
          <p>No CAD model, sketch or render available</p>
        </div>
      </div>
    )}
  </>
)}


            {/* Images/Sketch display: render as simple images */}

        
            {/* Media carousel for Sketch */}

            {/* MAIN IMAGE (CAD or Sketch) */}
{activeTab === 'Images' && (
  <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
    {cadMedia.length > 0 ? (
      <img
        src={API_CONFIG.BASE_URL + cadMedia[mainCadIndex].url}
        alt={cadMedia[mainCadIndex].title}
        className="w-full h-full object-contain cursor-zoom-in"
        onClick={() => {
          setModalType('image');
          setModalIndex(mainCadIndex);
          setModalOpen(true);
        }}
      />
    ) : (
      <div className="text-[#837A75] text-center">
        <Image className="w-16 h-16 mx-auto mb-2" />
        <p>No CAD images available</p>
      </div>
    )}
  </div>
)}

{activeTab === 'Sketch' && (
  <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
    {sketchMedia.length > 0 ? (
      <img
        src={API_CONFIG.BASE_URL + sketchMedia[mainImageIndex].url}
        alt={sketchMedia[mainImageIndex].title}
        className="w-full h-full object-contain cursor-zoom-in"
        onClick={() => {
          setModalType('image');
          setModalIndex(mainImageIndex);
          setModalOpen(true);
        }}
      />
    ) : (
      <div className="text-[#837A75] text-center">
        <Image className="w-16 h-16 mx-auto mb-2" />
        <p>No sketches available</p>
      </div>
    )}
  </div>
)}
{/* CAD CAROUSEL */}
{activeTab === 'Images' && cadMedia.length > 1 && (
  <Carousel className="w-full max-w-[400px]">
    <CarouselContent>
      {cadMedia.map((media, index) => (
        <CarouselItem key={media.id} className="basis-1/4">
          <div className="p-1">
            <div
              className={`aspect-square bg-white rounded border-2 overflow-hidden cursor-pointer
                ${index === mainCadIndex ? 'border-[#4A3C72]' : 'border-gray-200'}`}
              onClick={() => setMainCadIndex(index)}
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
{/* Sketch CAROUSEL */}
{activeTab === 'Sketch' && sketchMedia.length > 1 && (
  <Carousel className="w-full max-w-[400px]">
    <CarouselContent>
      {sketchMedia.map((media, index) => (
        <CarouselItem key={media.id} className="basis-1/4">
          <div className="p-1">
            <div
              className={`aspect-square bg-white rounded border-2 overflow-hidden cursor-pointer
                ${index === mainImageIndex ? 'border-[#4A3C72]' : 'border-gray-200'}`}
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
          <div className="flex-1 w-full mx-auto lg:mx-0">
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
          <div className="text-center text-gray-500 text-xs">Made with ❤️ by <a href="https://www.platify.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Platify</a>. Copyright © 2025 Your Custom Jewelry. All rights reserved.</div>
        </div>
      </footer>

  {/* Media Preview Modal */}
{modalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    onClick={() => setModalOpen(false)}
  >
    <div
      className="relative bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-6 border border-[#E6C2FF]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800"
        onClick={() => setModalOpen(false)}
        title="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {/* CAD MODAL IMAGE */}
      {activeTab === "Images" && cadMedia[modalIndex] && (
        <img
          src={API_CONFIG.BASE_URL + cadMedia[modalIndex].url}
          alt={cadMedia[modalIndex].title}
          className="max-w-full max-h-[70vh] object-contain bg-card rounded shadow mb-4"
        />
      )}

      {/* SKETCH MODAL IMAGE */}
      {activeTab === "Sketch" && sketchMedia[modalIndex] && (
        <img
          src={API_CONFIG.BASE_URL + sketchMedia[modalIndex].url}
          alt={sketchMedia[modalIndex].title}
          className="max-w-full max-h-[70vh] object-contain bg-card rounded shadow mb-4"
        />
      )}
    </div>
  </div>
)}


    </div>
  );
};

export default ItemDetailPage_3D;
