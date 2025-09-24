import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Rotate3D, Image, Gem, Ruler, Palette, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { X } from 'lucide-react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface ItemData {
  id: number;
  item_name: string;
  item_description: string;
  Quantity: number | null;
  po_i_no: string;
  fkb_orders_to_items: string;
}

interface VersionData {
  id: number;
  version_number: number;
  version_name: string;
  item_size: string | null;
  item_description: string | null;
  metal_type: string | null;
  metal_color: string | null;
  stamp_engraving: string | null;
  melee_stones_info: string | null;
  center_stone_info: string | null;
  version_quantity: number | null;
  fkb_items_and_versions: string;
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

interface RenderFile {
  id: number;
  title: string;
  url: string;
  preview: string;
  mimetype: string;
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState<ItemData | null>(null);
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [currentVersion, setCurrentVersion] = useState<VersionData | null>(null);
  const [images, setImages] = useState<ReferenceFile[]>([]);
  const [videos, setVideos] = useState<ReferenceFile[]>([]);
  const [cads, setCads] = useState<CadFile[]>([]);
  const [renders, setRenders] = useState<RenderFile[]>([]);
  const [sketches, setSketches] = useState<SketchFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Media indices
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [mainVideoIndex, setMainVideoIndex] = useState(0);
  const [main3dIndex, setMain3dIndex] = useState(0);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'image' | 'video' | '3d' | null>(null);
  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
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
        if (navigationState?.versions && navigationState.versions.length > 0) {
          console.log('Using versions from navigation state:', navigationState.versions);
          // Sort by version number (highest first)
          const sortedVersions = [...navigationState.versions].sort((a: any, b: any) => b.version_number - a.version_number);
          setVersions(sortedVersions);
          setCurrentVersion(sortedVersions[0]); // Set to latest version
        }
        
        // Only fetch item details from API if none were passed from navigation state
        if (!navigationState?.itemData) {
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
        if (!navigationState?.versions || navigationState.versions.length === 0) {
          console.log('No versions from navigation state, fetching from API...');
          // Fetch versions only for this item using JSON filter and appends
          const versionsFilter = encodeURIComponent(JSON.stringify({
            $and: [
              { f_s201x17a2bx: { po_i_no: { $eq: (navigationState?.itemData?.po_i_no || itemId) } } }
            ]
          }));
          const versionsUrl = `${API_CONFIG.BASE_URL}/api/versions:list?pageSize=100&page=1&appends[]=references&appends[]=f_s201x17a2bx&filter=${versionsFilter}`;
          const versionsResponse = await fetch(versionsUrl, { headers: getAuthHeaders() });
          
          if (!versionsResponse.ok) {
            const errorText = await versionsResponse.text();
            console.error('Versions API response:', versionsResponse.status, versionsResponse.statusText);
            console.error('Error response body:', errorText);
            throw new Error(`Failed to fetch versions: ${versionsResponse.status} ${versionsResponse.statusText}`);
          }
          
          const versionsData = await versionsResponse.json();
          const itemVersions = Array.isArray(versionsData.data) ? versionsData.data : [];
          
          // Sort by version number (highest first)
          itemVersions.sort((a: any, b: any) => b.version_number - a.version_number);
          setVersions(itemVersions);
          
          if (itemVersions.length > 0) {
            setCurrentVersion(itemVersions[0]); // Set to latest version
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
    if (!currentVersion) return;
    
    const fetchVersionMedia = async () => {
      try {
        // Fetch references (images and videos)
        try {
          const refsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions/${currentVersion.id}/references:list`, {
            headers: getAuthHeaders()
          });
          
          if (refsResponse.ok) {
            const refsData = await refsResponse.json();
            const refs: ReferenceFile[] = Array.isArray(refsData.data) ? refsData.data : [];
            const imageRefs = refs.filter(f => f.mimetype.startsWith("image/"));
            const videoRefs = refs.filter(f => f.mimetype.startsWith("video/"));
            setImages(imageRefs);
            setVideos(videoRefs);
          }
        } catch (err) {
          console.warn('Failed to fetch references:', err);
        }
        
        // Fetch CAD files
        try {
          const cadsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions:get:${currentVersion.id}/cad_file`, {
            headers: getAuthHeaders()
          });
          
          if (cadsResponse.ok) {
            const cadsData = await cadsResponse.json();
            setCads(Array.isArray(cadsData.data) ? cadsData.data : []);
          }
        } catch (err) {
          console.warn('Failed to fetch CAD files:', err);
        }
        
        // Fetch render files
        try {
          const rendersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions:get:${currentVersion.id}/render_file`, {
            headers: getAuthHeaders()
          });
          
          if (rendersResponse.ok) {
            const rendersData = await rendersResponse.json();
            setRenders(Array.isArray(rendersData.data) ? rendersData.data : []);
          }
        } catch (err) {
          console.warn('Failed to fetch render files:', err);
        }
        
        // Fetch sketch files
        try {
          const sketchesResponse = await fetch(`${API_CONFIG.BASE_URL}/api/versions:get:${currentVersion.id}/sketch_file`, {
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

  if (!item || !currentVersion) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl text-red-600">No item or version data found</div>
    </div>
  );

  // Combine all media for carousel (videos first, then images, then 3D files)
  const allMedia = [
    ...videos.map(v => ({ ...v, type: 'video' as const })),
    ...images.map(i => ({ ...i, type: 'image' as const })),
    ...cads.map(c => ({ ...c, type: '3d' as const })),
    ...renders.map(r => ({ ...r, type: '3d' as const })),
    ...sketches.map(s => ({ ...s, type: 'image' as const }))
  ];

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
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
        {/* Back Button and Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="mb-4 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-semibold text-gray-900 font-['Playfair_Display'] tracking-tight">
              {item.item_name}
            </h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border border-gray-200">
              Version {currentVersion.version_number}
            </Badge>
          </div>
        </div>

        {/* Version Selector */}
        {versions.length > 1 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Version</h3>
            <div className="flex gap-2 flex-wrap">
              {versions.map((version) => (
                <Button
                  key={version.id}
                  variant={currentVersion.id === version.id ? "default" : "outline"}
                  onClick={() => handleVersionChange(version)}
                  className={currentVersion.id === version.id ? 
                    "bg-gray-900 text-white" : 
                    "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                >
                  Version {version.version_number}: {version.version_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Row: Media and Details */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Media Container */}
          <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col items-center">
            {/* Main media display */}
            <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {allMedia.length > 0 ? (
                allMedia[mainImageIndex].type === 'video' ? (
                  <video
                    src={API_CONFIG.BASE_URL + allMedia[mainImageIndex].url}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => { setModalType('video'); setModalIndex(mainImageIndex); setModalOpen(true); }}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : allMedia[mainImageIndex].type === '3d' ? (
                  <div className="w-full h-full">
                    <model-viewer
                      src={API_CONFIG.BASE_URL + allMedia[mainImageIndex].url}
                      alt={allMedia[mainImageIndex].title}
                      environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
                      shadow-intensity="1"
                      camera-controls
                      touch-action="pan-y"
                      style={{ width: '100%', height: '100%' }}
                    ></model-viewer>
                  </div>
                ) : (
                  <img
                    src={API_CONFIG.BASE_URL + allMedia[mainImageIndex].url}
                    alt={allMedia[mainImageIndex].title}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => { setModalType('image'); setModalIndex(mainImageIndex); setModalOpen(true); }}
                  />
                )
              ) : (
                <div className="text-[#837A75] text-center">
                  <Image className="w-16 h-16 mx-auto mb-2 text-[#837A75]" />
                  <p>No media available</p>
                </div>
              )}
            </div>

            {/* Media carousel */}
            {allMedia.length > 1 && (
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
                          {media.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Play className="w-6 h-6 text-[#4A3C72]" />
                            </div>
                          ) : media.type === '3d' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Rotate3D className="w-6 h-6 text-[#4A3C72]" />
                            </div>
                          ) : (
                            <img
                              src={API_CONFIG.BASE_URL + media.url}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                          )}
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

          {/* Details and Specifications */}
          <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0">
            {/* Version Information */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-medium text-gray-900 font-['Playfair_Display']">
                Version Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-lg text-gray-500 font-semibold">Version Name</div>
                  <div className="text-sm text-gray-900 font-medium">{currentVersion.version_name}</div>
                </div>
                <div>
                  <div className="text-lg text-gray-500 font-semibold">Version Number</div>
                  <div className="text-sm text-gray-900 font-medium">{currentVersion.version_number}</div>
                </div>
                {currentVersion.item_size && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Size</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.item_size}</div>
                  </div>
                )}
                {currentVersion.version_quantity && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Quantity</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.version_quantity}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Technical Specifications */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-medium text-gray-900 font-['Playfair_Display']">
                Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentVersion.metal_type && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Metal Type</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.metal_type}</div>
                  </div>
                )}
                {currentVersion.metal_color && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Metal Color</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.metal_color}</div>
                  </div>
                )}
                {currentVersion.center_stone_info && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Center Stone</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.center_stone_info}</div>
                  </div>
                )}
                {currentVersion.melee_stones_info && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Melee Stones</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.melee_stones_info}</div>
                  </div>
                )}
                {currentVersion.stamp_engraving && (
                  <div>
                    <div className="text-lg text-gray-500 font-semibold">Stamp/Engraving</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.stamp_engraving}</div>
                  </div>
                )}
                {currentVersion.item_description && (
                  <div className="md:col-span-2">
                    <div className="text-lg text-gray-500 font-semibold">Version Description</div>
                    <div className="text-sm text-gray-900 font-medium">{currentVersion.item_description}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Item Information */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 font-['Playfair_Display']">
                Item Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-lg text-gray-500 font-semibold">Item ID</div>
                  <div className="text-sm text-gray-900 font-medium">{item.po_i_no}</div>
                </div>
                <div>
                  <div className="text-lg text-gray-500 font-semibold">Quantity</div>
                  <div className="text-sm text-gray-900 font-medium">{item.Quantity || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-lg text-gray-500 font-semibold">Purchase Order</div>
                  <div className="text-sm text-gray-900 font-medium">{item.fkb_orders_to_items}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-auto bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">© 2024 BYONDJEWELRY. All rights reserved.</div>
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
            
            {modalType === 'video' && allMedia[modalIndex] && allMedia[modalIndex].type === 'video' && (
              <video
                src={API_CONFIG.BASE_URL + allMedia[modalIndex].url}
                className="max-w-full max-h-[70vh] bg-black rounded shadow mb-4"
                controls
                autoPlay
                loop
                muted
                playsInline
              />
            )}
            
            {modalType === '3d' && allMedia[modalIndex] && allMedia[modalIndex].type === '3d' && (
              <model-viewer
                src={API_CONFIG.BASE_URL + allMedia[modalIndex].url}
                alt={allMedia[modalIndex].title}
                environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
                shadow-intensity="1"
                camera-controls
                touch-action="pan-y"
                style={{ width: '100%', height: '60vh', background: 'hsl(var(--card))', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #E6C2FF' }}
              ></model-viewer>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#4A3C72] mb-2">
                {allMedia[modalIndex]?.title}
              </h3>
              <p className="text-sm text-[#837A75]">
                {modalType === 'video' ? 'Video' : modalType === '3d' ? '3D Model' : 'Image'} {modalIndex + 1} of {allMedia.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;
