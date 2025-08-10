
"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Search, Loader2, Route } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// This is the standard fix for the Leaflet + Next.js/Webpack icon issue.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});


interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address: {
        road?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    }
}

interface RouteGeometry {
    coordinates: [number, number][];
    type: 'LineString';
}

interface OSRMRoute {
    geometry: RouteGeometry;
}

interface OSRMResponse {
    routes: OSRMRoute[];
    code: string;
}

export default function MapPage() {
    const router = useRouter();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [30.3753, 69.3451], // Centered on Pakistan
                zoom: 5,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            markerLayerRef.current = L.layerGroup().addTo(map);
            routeLayerRef.current = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setLoadingSearch(true);
        setError(null);
        setResults([]);
        markerLayerRef.current?.clearLayers();
        routeLayerRef.current?.clearLayers();
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pk&addressdetails=1&limit=5`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data: SearchResult[] = await response.json();
            if (data.length === 0) {
              setError("کوئی نتیجہ نہیں ملا۔");
            }
            setResults(data);
        } catch (err) {
            setError("تلاش کے دوران ایک خرابی پیش آگئی۔");
            console.error(err);
        } finally {
            setLoadingSearch(false);
        }
    }
    
    const getDirections = async (destination: L.LatLng) => {
      setLoadingRoute(true);
      markerLayerRef.current?.clearLayers();
      routeLayerRef.current?.clearLayers();

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

          const start = `${userLatLng.lng},${userLatLng.lat}`;
          const end = `${destination.lng},${destination.lat}`;
          
          try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`);
            const data: OSRMResponse = await response.json();
            
            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
              throw new Error("کوئی راستہ نہیں ملا۔");
            }
            
            const route = data.routes[0].geometry;
            const routeLine = L.geoJSON(route, { style: { color: 'hsl(var(--primary))', weight: 5 } });
            
            routeLayerRef.current?.addLayer(routeLine);
            
            L.marker(userLatLng).addTo(markerLayerRef.current!).bindPopup("آپ کا مقام").openPopup();
            L.marker(destination).addTo(markerLayerRef.current!).bindPopup("منزل").openPopup();
            
            mapInstanceRef.current?.fitBounds(routeLine.getBounds());
          } catch (err) {
            console.error("Routing error:", err);
            toast({ variant: "destructive", title: "راستے میں خرابی", description: "راستہ حاصل نہیں کیا جا سکا۔ براہ کرم دوبارہ کوشش کریں۔" });
          } finally {
            setLoadingRoute(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({ variant: "destructive", title: "مقام کی خرابی", description: "راستے کے لیے آپ کے مقام تک رسائی کی ضرورت ہے۔ براہ کرم اجازت دیں۔" });
          setLoadingRoute(false);
        }
      );
    }

    const handleResultClick = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const destination = L.latLng(lat, lon);
        
        setResults([]);
        setSearchQuery('');
        
        getDirections(destination);
    }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold text-center">اے ایم آئی کے نقشہ</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-4 space-y-4 z-10 bg-background shadow-md">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                  dir="rtl"
                  placeholder="جگہ تلاش کریں..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-base h-11 text-right"
              />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={loadingSearch || loadingRoute}>
                  {loadingSearch ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
          </form>
      </div>

      <div className="relative flex-1">
        <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
        { (results.length > 0 || error || loadingSearch) && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md z-10">
                <Card>
                    <CardContent className="p-2 max-h-60 overflow-y-auto">
                        {loadingSearch && <p className="p-4 text-center text-muted-foreground">تلاش کیا جا رہا ہے...</p>}
                        {error && !loadingSearch && <p className="p-4 text-center text-destructive">{error}</p>}
                        <div className="divide-y">
                        {results.map(result => (
                            <div key={result.place_id} onClick={() => handleResultClick(result)} className="p-3 cursor-pointer hover:bg-muted rounded-md text-right flex items-center gap-3" dir="rtl">
                                <Route className="h-5 w-5 text-primary"/>
                                <div className="flex-1">
                                    <p className="font-semibold">{result.display_name.split(',')[0]}</p>
                                    <p className="text-sm text-muted-foreground">{result.display_name.substring(result.display_name.indexOf(',') + 1).trim()}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
         {loadingRoute && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4 p-4 bg-background text-foreground rounded-lg shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-semibold">راستہ حاصل کیا جا رہا ہے...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
