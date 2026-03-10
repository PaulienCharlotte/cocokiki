
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
    case 'city': return '#ff4d94';
    case 'water': return '#00b4d8';
    case 'region': return '#4ade80';
    default: return '#fb7185';
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
    fetch('https://raw.githubusercontent.com/highcharts/map-collection-dist/master/countries/nl/nl-all.geo.json')
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.1, 5.2],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[50.5, 3.0], [54.0, 7.5]],
      minZoom: 7,
      tap: true,
      dragging: true,
      touchZoom: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 200);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    const handleResize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    let targetCenter: [number, number] = [52.1, 5.2];
    let targetZoom = 8;
    if (selectedProvince !== 'all') {
      const prov = PROVINCES.find(p => p.id === selectedProvince);
      if (prov) { targetCenter = prov.center; targetZoom = prov.zoom; }
    }
    const last = lastViewRef.current;
    if (!last || last.center[0] !== targetCenter[0] || last.zoom !== targetZoom) {
      mapRef.current.flyTo(targetCenter, targetZoom, { duration: 1.2 });
      lastViewRef.current = { center: targetCenter, zoom: targetZoom };
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (!mapRef.current || !geoData) return;
    mapRef.current.eachLayer((layer) => { if (layer instanceof L.GeoJSON) mapRef.current?.removeLayer(layer); });
    L.geoJSON(geoData, {
      style: (feature) => {
        const provinceName = feature?.properties?.name;
        const provData = PROVINCES.find(p => p.name === provinceName);
        const isSelected = provData?.id === selectedProvince;
        return {
          fillColor: isSelected ? '#ffc2d1' : '#f8fafc',
          fillOpacity: isSelected ? 0.7 : 0.5,
          color: isSelected ? '#ff4d94' : '#cbd5e1', 
          weight: isSelected ? 3 : 1
        };
      }
    }).addTo(mapRef.current).bringToBack();
  }, [geoData, selectedProvince]);

  useEffect(() => {
    if (!mapRef.current) return;
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    const filteredLocations = LOCATIONS.filter(loc => {
      const provMatch = selectedProvince === 'all' || loc.provinceId === selectedProvince;
      const clusterMatch = selectedCluster === 'all' || loc.clusterId === selectedCluster;
      return provMatch && clusterMatch;
    });

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

      const icon = L.divIcon({
        className: 'custom-label-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="marker-dot ${isHighlighted ? 'highlighted' : ''}" style="background-color: ${displayColor} !important;"></div>
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
