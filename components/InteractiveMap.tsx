
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PROVINCES, LOCATIONS } from '../constants';
import { Location, GameMode } from '../types';
import { Plus, Minus } from 'lucide-react';

interface InteractiveMapProps {
  selectedProvince: string | 'all';
  selectedCluster?: string | 'all';
  onLocationClick?: (loc: Location) => void;
  highlightedLocation?: string | null;
  activeGameLocation?: string | null;
  showLabels?: boolean;
  gameMode?: GameMode;
  isRevealed?: boolean;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'city': return '#EAB308';
    case 'water': return '#38bdf8';
    case 'region': return '#7C3AED';
    case 'province': return '#7C3AED';
    default: return '#EAB308';
  }
};

const getSmartLabelPosition = (index: number) => {
  const positions = [
    { x: '50%', y: '-170%', transform: 'translate(-50%, 0)' },   
    { x: '140%', y: '-100%', transform: 'translate(0, 0)' },    
    { x: '140%', y: '0%', transform: 'translate(0, -50%)' },    
    { x: '140%', y: '40%', transform: 'translate(0, 0)' },      
    { x: '50%', y: '170%', transform: 'translate(-50%, 0)' },   
    { x: '-40%', y: '40%', transform: 'translate(-100%, 0)' },  
    { x: '-40%', y: '0%', transform: 'translate(-100%, -50%)' },
    { x: '-40%', y: '-100%', transform: 'translate(-100%, 0)' }, 
  ];
  return positions[index % positions.length];
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  selectedProvince,
  selectedCluster = 'all',
  onLocationClick,
  highlightedLocation,
  activeGameLocation,
  showLabels = true,
  gameMode = 'explore',
  isRevealed = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const lastViewRef = useRef<{center: [number, number], zoom: number} | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  const handleZoomIn = () => { if (mapRef.current) mapRef.current.zoomIn(); };
  const handleZoomOut = () => { if (mapRef.current) mapRef.current.zoomOut(); };

  useEffect(() => {
    fetch('/data/geojson/nl-all.geo.json')
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.1, 5.2],
      zoom: 8,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [[50.5, 3.0], [54.0, 7.5]],
      minZoom: 7,
      tap: true,
      dragging: true,
      touchZoom: true
    });

    mapRef.current.attributionControl.setPrefix('');

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true
    } as any).addTo(mapRef.current);

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        mapRef.current.fitBounds([[50.75, 3.35], [53.55, 7.22]], { padding: [16, 16] });
      }
    }, 200);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    const handleResize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Respond to container size changes (e.g. sidebar appearing/disappearing)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedProvince === 'all') {
      mapRef.current.flyToBounds([[50.75, 3.35], [53.55, 7.22]], { padding: [16, 16], duration: 1.2 });
      return;
    }

    // Fit to the actual locations in this province so eastern/edge provinces are centered properly
    const provLocations = LOCATIONS.filter(loc => loc.provinceId === selectedProvince);
    if (provLocations.length >= 2) {
      const lats = provLocations.map(l => l.lat);
      const lngs = provLocations.map(l => l.lng);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      mapRef.current.flyToBounds(bounds, { padding: [80, 80], duration: 1.2, maxZoom: 11 });
    } else {
      // Fallback to province center if too few locations
      const prov = PROVINCES.find(p => p.id === selectedProvince);
      if (prov) mapRef.current.flyTo(prov.center as L.LatLngTuple, prov.zoom, { duration: 1.2 });
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (!mapRef.current || !geoData) return;
    mapRef.current.eachLayer((layer) => { if (layer instanceof L.GeoJSON) mapRef.current?.removeLayer(layer); });
    L.geoJSON(geoData, {
      interactive: false,
      style: (feature) => {
        const provinceName = feature?.properties?.name ?? feature?.properties?.statnaam;
        const hcKey = feature?.properties?.['hc-key'] as string | undefined;
        const provinceId = hcKey?.replace('nl-', '');
        const normalizedName = provinceName === 'Fryslân' ? 'Friesland' : provinceName;
        const provData = PROVINCES.find(p => p.id === provinceId || p.name === normalizedName);
        const isSelected = provData?.id === selectedProvince;
        const isGameTarget = provData?.id === activeGameLocation;
        const fillColor = provData?.color ?? '#f8fafc';

        return {
          fillColor: isSelected || isGameTarget ? '#f59e0b' : fillColor,
          fillOpacity: isSelected || isGameTarget ? 0.84 : 0.72,
          color: isSelected || isGameTarget ? '#92400e' : '#475569',
          weight: isSelected || isGameTarget ? 3.5 : 1.8,
          dashArray: '',
          opacity: 1
        };
      }
    }).addTo(mapRef.current);
  }, [geoData, selectedProvince, activeGameLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    const provinceDots = (filter?: string) => PROVINCES
      .filter(p => !p.isStudyArea && (!filter || p.id === filter))
      .map(p => ({ id: p.id, name: p.name, provinceId: p.id, type: 'province' as const, lat: p.center[0], lng: p.center[1] }));

    let filteredLocations = LOCATIONS.filter(loc => {
      if (selectedCluster === 'hoofdsteden') {
        const provMatch = selectedProvince === 'all' ? loc.provinceId !== 'water-nl' : loc.provinceId === selectedProvince;
        return provMatch && loc.isCapital;
      }
      if (selectedCluster === 'provincies-en-hoofdsteden') {
        return loc.isCapital === true;
      }
      const provMatch = selectedProvince === 'all' ? loc.provinceId !== 'water-nl' : loc.provinceId === selectedProvince;
      const clusterMatch = selectedCluster === 'all' || loc.clusterId === selectedCluster;
      return provMatch && clusterMatch;
    });

    if (selectedCluster === 'hoofdsteden') {
      filteredLocations = [...filteredLocations, ...provinceDots(selectedProvince === 'all' ? undefined : selectedProvince)];
    }
    if (selectedCluster === 'provincies-en-hoofdsteden') {
      filteredLocations = [...filteredLocations, ...provinceDots()];
    }

    filteredLocations.forEach((loc, index) => {
      const isTarget = loc.id === activeGameLocation;
      const baseColor = getTypeColor(loc.type);
      let isHighlighted = false;
      let displayColor = baseColor;

      if (gameMode === 'explore') {
        isHighlighted = loc.id === highlightedLocation;
        if (isHighlighted) displayColor = '#f43f5e'; 
      } else if (gameMode === 'spell') {
        isHighlighted = isTarget;
        if (isHighlighted) displayColor = '#d946ef'; 
      } else if (gameMode === 'master' && isRevealed && isTarget) {
        isHighlighted = true;
        displayColor = '#d946ef'; 
      }

      const pos = getSmartLabelPosition(index);
      const shouldRenderLabel = showLabels && gameMode === 'explore';

      const capitalStar = (loc as any).isCapital
        ? `<span style="position:absolute;top:-5px;right:-5px;font-size:9px;line-height:1;pointer-events:none;">★</span>`
        : '';
      const icon = L.divIcon({
        className: 'custom-label-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="marker-dot ${isHighlighted ? 'highlighted' : ''}" style="background-color: ${displayColor} !important; position:relative;">
              ${capitalStar}
            </div>
            ${shouldRenderLabel || (gameMode === 'explore' && isHighlighted) ? `<div class="marker-label" style="left: ${pos.x}; top: ${pos.y}; transform: ${pos.transform}; z-index: ${isHighlighted ? '20000' : '500'}; color: ${baseColor};">${loc.name}</div>` : ''}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([loc.lat, loc.lng], { 
        icon, 
        zIndexOffset: isHighlighted ? 10000 : 500 
      }).addTo(mapRef.current!).on('click', () => onLocationClick?.(loc));
      
      markersRef.current[loc.id] = marker;
    });
  }, [selectedProvince, selectedCluster, highlightedLocation, activeGameLocation, showLabels, gameMode, isRevealed, onLocationClick]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 flex flex-col gap-2 z-[4000]">
        <button onClick={handleZoomIn} className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl shadow-lg border-2 border-pink-50 flex items-center justify-center text-pink-400 active:translate-y-1 transition-all"><Plus className="w-6 h-6 md:w-10 md:h-10" /></button>
        <button onClick={handleZoomOut} className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl shadow-lg border-2 border-pink-50 flex items-center justify-center text-pink-400 active:translate-y-1 transition-all"><Minus className="w-6 h-6 md:w-10 md:h-10" /></button>
      </div>
    </div>
  );
};

export default InteractiveMap;
