
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PROVINCES, LOCATIONS } from '../constants';
import { Location, GameMode } from '../types';
import { Plus, Minus } from 'lucide-react';

const WHITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const SCHOOL_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
const MAP_STYLE_STORAGE_KEY = 'topo_map_school_colors';
const NL_BOUNDS: L.LatLngBoundsExpression = [[50.75, 3.35], [53.55, 7.22]];
const EUROPE_BOUNDS: L.LatLngBoundsExpression = [[34.5, -24.5], [71.5, 45.5]];
const WORLD_BOUNDS: L.LatLngBoundsExpression = [[-85, -180], [85, 180]];
const WORLD_AREA_IDS = new Set(['world', 'europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania', 'arctic', 'antarctica']);

const EUROPE_CLUSTER_COLORS: Record<string, string> = {
  'eu-west': '#60A5FA',
  'eu-north': '#93C5FD',
  'eu-south': '#FBBF24',
  'eu-east': '#A78BFA',
  'eu-balkan': '#F472B6',
};

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
    case 'country': return '#22C55E';
    default: return '#EAB308';
  }
};

const getLocationColor = (loc: Location) => {
  if (loc.type === 'country' && loc.clusterId) {
    return EUROPE_CLUSTER_COLORS[loc.clusterId] ?? getTypeColor(loc.type);
  }
  return getTypeColor(loc.type);
};

const getCountryLocationForFeature = (feature: any) => {
  const props = feature?.properties ?? {};
  const iso = props['ISO3166-1-Alpha-3'];
  const name = props.name;
  return LOCATIONS.find(loc =>
    loc.provinceId === 'europe' && (loc.isoAlpha3 === iso || loc.geoName === name)
  );
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

const getDisplayLabel = (loc: Location, visibleLocations: Location[]) => {
  const hasSameNameCountryAndCapital = visibleLocations.some(other =>
    other.id !== loc.id &&
    other.name === loc.name &&
    ((loc.type === 'country' && other.isCapital) || (loc.isCapital && other.type === 'country'))
  );

  if (!hasSameNameCountryAndCapital) return loc.name;
  return `${loc.name} (${loc.type === 'country' ? 'land' : 'hoofdstad'})`;
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const contextLayerRef = useRef<L.GeoJSON | null>(null);
  const provinceLayerRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const lastViewRef = useRef<{center: [number, number], zoom: number} | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [europeGeoData, setEuropeGeoData] = useState<any>(null);
  const [showSchoolColors, setShowSchoolColors] = useState(() => {
    return localStorage.getItem(MAP_STYLE_STORAGE_KEY) !== 'false';
  });
  const isEuropeSelected = selectedProvince === 'europe';

  const handleZoomIn = () => { if (mapRef.current) mapRef.current.zoomIn(); };
  const handleZoomOut = () => { if (mapRef.current) mapRef.current.zoomOut(); };

  useEffect(() => {
    fetch('/data/geojson/nl-all.geo.json')
      .then(res => res.json())
      .then(data => setGeoData(data));
    fetch('/data/geojson/europe-countries.geo.json')
      .then(res => res.json())
      .then(data => setEuropeGeoData(data));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.1, 5.2],
      zoom: 8,
      zoomControl: false,
      attributionControl: true,
      maxBounds: WORLD_BOUNDS,
      minZoom: 2,
      tap: true,
      dragging: true,
      touchZoom: true
    });

    mapRef.current.attributionControl.setPrefix('');

    tileLayerRef.current = L.tileLayer(showSchoolColors ? SCHOOL_TILE_URL : WHITE_TILE_URL, {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18,
      detectRetina: true
    } as any).addTo(mapRef.current);

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        mapRef.current.fitBounds(NL_BOUNDS, { padding: [16, 16] });
      }
    }, 200);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, String(showSchoolColors));
    tileLayerRef.current?.setUrl(showSchoolColors ? SCHOOL_TILE_URL : WHITE_TILE_URL);
  }, [showSchoolColors]);

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

    if (selectedProvince === 'europe') {
      mapRef.current.flyToBounds(EUROPE_BOUNDS, { padding: [16, 16], duration: 1.2 });
      return;
    }

    if (selectedProvince === 'world') {
      mapRef.current.flyToBounds(WORLD_BOUNDS, { padding: [18, 18], duration: 1.2 });
      return;
    }

    if (selectedProvince === 'all') {
      mapRef.current.flyToBounds(NL_BOUNDS, { padding: [16, 16], duration: 1.2 });
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
    if (!mapRef.current) return;
    if (contextLayerRef.current) {
      mapRef.current.removeLayer(contextLayerRef.current);
      contextLayerRef.current = null;
    }

    if (!isEuropeSelected && europeGeoData) {
      contextLayerRef.current = L.geoJSON(europeGeoData, {
        interactive: false,
        style: {
          fillColor: '#FFFFFF',
          fillOpacity: 0.02,
          color: '#A8B5A8',
          weight: 0.8,
          opacity: 0.45
        }
      }).addTo(mapRef.current);
      contextLayerRef.current.bringToBack();
    }

    const shouldDrawNetherlands = selectedProvince === 'all' || selectedProvince === 'water-nl' || !WORLD_AREA_IDS.has(selectedProvince);
    const activeGeoData = isEuropeSelected ? europeGeoData : shouldDrawNetherlands ? geoData : null;
    if (provinceLayerRef.current) {
      mapRef.current.removeLayer(provinceLayerRef.current);
      provinceLayerRef.current = null;
    }
    if (!activeGeoData) return;
    provinceLayerRef.current = L.geoJSON(activeGeoData, {
      interactive: isEuropeSelected,
      style: (feature) => {
        if (isEuropeSelected) {
          const country = getCountryLocationForFeature(feature);
          const isSelected = country?.id === highlightedLocation;
          const isGameTarget = country?.id === activeGameLocation;
          const fillColor = showSchoolColors && country ? getLocationColor(country) : '#F8FAFC';

          return {
            fillColor: isSelected || isGameTarget ? '#f59e0b' : fillColor,
            fillOpacity: isSelected || isGameTarget ? 0.82 : showSchoolColors ? 0.66 : 0.92,
            color: isSelected || isGameTarget ? '#92400e' : showSchoolColors ? '#334155' : '#CBD5E1',
            weight: isSelected || isGameTarget ? 3.5 : 1.2,
            dashArray: '',
            opacity: 1
          };
        }

        const provinceName = feature?.properties?.name ?? feature?.properties?.statnaam;
        const hcKey = feature?.properties?.['hc-key'] as string | undefined;
        const provinceId = hcKey?.replace('nl-', '');
        const normalizedName = provinceName === 'Fryslân' ? 'Friesland' : provinceName;
        const provData = PROVINCES.find(p => p.id === provinceId || p.name === normalizedName);
        const isSelected = provData?.id === selectedProvince;
        const isGameTarget = provData?.id === activeGameLocation;
        const fillColor = showSchoolColors ? provData?.color ?? '#f8fafc' : '#F8FAFC';

        return {
          fillColor: isSelected || isGameTarget ? '#f59e0b' : fillColor,
          fillOpacity: isSelected || isGameTarget ? 0.84 : showSchoolColors ? 0.72 : 0.96,
          color: isSelected || isGameTarget ? '#92400e' : showSchoolColors ? '#475569' : '#CBD5E1',
          weight: isSelected || isGameTarget ? 3.5 : 1.8,
          dashArray: '',
          opacity: 1
        };
      },
      onEachFeature: isEuropeSelected ? (feature, layer) => {
        const country = getCountryLocationForFeature(feature);
        if (!country) return;
        layer.on('click', () => onLocationClick?.(country));
      } : undefined
    }).addTo(mapRef.current);
    provinceLayerRef.current.bringToFront();
  }, [geoData, europeGeoData, selectedProvince, highlightedLocation, activeGameLocation, showSchoolColors, isEuropeSelected, onLocationClick]);

  useEffect(() => {
    if (!mapRef.current) return;
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};
    const studyAreaIds = new Set(PROVINCES.filter(p => p.isStudyArea).map(p => p.id));

    const provinceDots = (filter?: string) => PROVINCES
      .filter(p => !p.isStudyArea && (!filter || p.id === filter))
      .map(p => ({ id: p.id, name: p.name, provinceId: p.id, type: 'province' as const, lat: p.center[0], lng: p.center[1] }));

    let filteredLocations = LOCATIONS.filter(loc => {
      if (selectedCluster === 'hoofdsteden') {
        const provMatch = selectedProvince === 'all' ? !studyAreaIds.has(loc.provinceId) : loc.provinceId === selectedProvince;
        return provMatch && loc.isCapital;
      }
      if (selectedCluster === 'provincies-en-hoofdsteden') {
        return loc.isCapital === true;
      }
      if (selectedCluster.endsWith('-countries-capitals')) {
        return loc.provinceId === selectedProvince && (loc.type === 'country' || loc.isCapital === true);
      }
      const provMatch = selectedProvince === 'all' ? !studyAreaIds.has(loc.provinceId) : loc.provinceId === selectedProvince;
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
      const baseColor = getLocationColor(loc);
      const labelText = getDisplayLabel(loc, filteredLocations);
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
            ${shouldRenderLabel || (gameMode === 'explore' && isHighlighted) ? `<div class="marker-label" style="left: ${pos.x}; top: ${pos.y}; transform: ${pos.transform}; z-index: ${isHighlighted ? '20000' : '500'}; color: ${baseColor};">${labelText}</div>` : ''}
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
      <button
        type="button"
        role="switch"
        aria-checked={showSchoolColors}
        onClick={() => setShowSchoolColors(v => !v)}
        title={showSchoolColors ? 'Witte kaart tonen' : 'Gekleurde schoolkaart tonen'}
        className="absolute top-4 right-4 z-[4000] flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-lg border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-white transition-colors"
      >
        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showSchoolColors ? 'bg-[#7C3AED]' : 'bg-slate-300'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${showSchoolColors ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </span>
        <span>{showSchoolColors ? 'Kleurkaart' : 'Witte kaart'}</span>
      </button>
      <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 flex flex-col gap-2 z-[4000]">
        <button onClick={handleZoomIn} className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl shadow-lg border-2 border-pink-50 flex items-center justify-center text-pink-400 active:translate-y-1 transition-all"><Plus className="w-6 h-6 md:w-10 md:h-10" /></button>
        <button onClick={handleZoomOut} className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl shadow-lg border-2 border-pink-50 flex items-center justify-center text-pink-400 active:translate-y-1 transition-all"><Minus className="w-6 h-6 md:w-10 md:h-10" /></button>
      </div>
    </div>
  );
};

export default InteractiveMap;
