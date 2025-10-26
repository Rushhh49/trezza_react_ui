import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Rotate3D, Image, Gem, Ruler, Palette } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

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

const JewelryLanding = () => {
  const [selectedVariation, setSelectedVariation] = useState('standard');
  const [retailerName, setRetailerName] = useState('');
  const [mainIndex, setMainIndex] = useState(0);

  // Example media data (replace with real data/fetch)
  // If no glb, omit the 3d type
  const media = [
    // Uncomment the next line to simulate a 3D model
    // { type: '3d', src: '/models/ring.glb', thumb: <Rotate3D className="w-8 h-8" /> },
    { type: 'video', src: '/videos/ring.mp4', thumb: <Play className="w-8 h-8" /> },
    { type: 'image', src: '/images/ring1.jpg', thumb: <Image className="w-8 h-8" /> },
    { type: 'image', src: '/images/ring2.jpg', thumb: <Image className="w-8 h-8" /> },
  ];

  useEffect(() => {
    setRetailerName('Nimit Parikh');
  }, []);

  const customerName = "Sarah Johnson";
  const jewelryName = "Custom Diamond Engagement Ring";
  const basePrice = 2850;

  const variations: JewelryVariation[] = [
    { id: 'standard', name: 'Standard', price: 0, changes: 'Original design' },
    { id: 'wider-band', name: 'Wider Band', price: 150, changes: '2mm wider band' },
    { id: 'larger-stone', name: 'Larger Stone', price: 800, changes: '0.5ct larger center stone' },
    { id: 'premium', name: 'Premium Set', price: 1200, changes: 'Wider band + larger stone' },
  ];

  const techSpecs: TechSpec[] = [
    { label: 'Metal', value: 'Urmum', icon: <Palette className="w-4 h-4" /> },
    { label: 'Center Stone', value: '1.5ct Rouasdand Diamond', icon: <Gem className="w-4 h-4" /> },
    { label: 'Ring Size', value: 'Size 6.5', icon: <Ruler className="w-4 h-4" /> },
    { label: 'Setting', value: 'Prong Setting', icon: <Rotate3D className="w-4 h-4" /> },
  ];

  const currentVariation = variations.find(v => v.id === selectedVariation);
  const totalPrice = basePrice + (currentVariation?.price || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4" >
          <div className="flex items-center" style={{ justifyContent: "center" }}>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Bespoke Jewellery</h1>
              <p className="text-muted-foreground">For {retailerName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Media Viewer */}
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-bold mb-2">Custom Diamond Engagement Ring</h2>
              <p className="text-muted-foreground">Crafted to perfection</p>
            </div>
            <Card className="p-0 flex flex-col items-center">
              {/* Main Media Carousel */}
              <div className="w-full max-w-2xl mx-auto">
                <Carousel
                  opts={{ loop: true }}
                  className="w-full"
                  setApi={api => {
                    if (api) {
                      api.on('select', () => setMainIndex(api.selectedScrollSnap()));
                    }
                  }}
                >
                  <CarouselContent>
                    {media.map((item, idx) => (
                      <CarouselItem key={idx} className="flex justify-center">
                        <div className="w-full aspect-[16/7] bg-gradient-to-br from-muted to-background rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20 overflow-hidden">
                          {item.type === '3d' && (
                            <div className="flex flex-col items-center justify-center w-full h-full">
                              <Rotate3D className="w-16 h-16 mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground">3D Model Viewer</p>
                              <p className="text-sm text-muted-foreground/70">Interactive 360° view</p>
                            </div>
                          )}
                          {item.type === 'video' && (
                            <video
                              src={item.src}
                              className="w-full h-full object-cover"
                              autoPlay={mainIndex === idx}
                              muted
                              loop
                              playsInline
                              controls
                            />
                          )}
                          {item.type === 'image' && (
                            <img
                              src={item.src}
                              alt="Jewelry"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {media.length > 1 && <CarouselPrevious />}
                  {media.length > 1 && <CarouselNext />}
                </Carousel>
              </div>
              {/* Thumbnails Carousel */}
              {media.length > 1 && (
                <div className="w-full max-w-2xl mx-auto mt-4">
                  <Carousel opts={{ dragFree: true, containScroll: 'trimSnaps' }} className="w-full" >
                    <CarouselContent>
                      {media.map((item, idx) => (
                        <CarouselItem key={idx} className="basis-1/6 flex justify-center cursor-pointer" onClick={() => setMainIndex(idx)}>
                          <div className={`rounded-md border-2 p-1 ${mainIndex === idx ? 'border-primary' : 'border-muted-foreground/20'}`}>{item.thumb}</div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </Card>
          </div>

          {/* Details & Variations */}
          <div className="space-y-8">
            {/* Technical Specifications */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {techSpecs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {spec.icon}
                    <div>
                      <p className="text-sm text-muted-foreground">{spec.label}</p>
                      <p className="font-medium">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Variations */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Design Variations</h3>
              <div className="space-y-3">
                {variations.map((variation) => (
                  <div
                    key={variation.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedVariation === variation.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedVariation(variation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{variation.name}</h4>
                        <p className="text-sm text-muted-foreground">{variation.changes}</p>
                      </div>
                      <div className="text-right">
                        {variation.price > 0 ? (
                          <p className="font-medium text-green-600">+${variation.price}</p>
                        ) : (
                          <p className="text-muted-foreground">Included</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            {/* Removed Approve Design and Request Modifications buttons */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelryLanding;