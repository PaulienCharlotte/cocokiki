import { Cluster, Location, Province } from '../types';

type WorldRegionId = 'world' | 'africa' | 'asia' | 'north-america' | 'south-america' | 'oceania' | 'arctic' | 'antarctica';

type CountrySeed = {
  id: string;
  country: string;
  capital: string;
  region: Exclude<WorldRegionId, 'world'>;
  countryLat: number;
  countryLng: number;
  capitalLat: number;
  capitalLng: number;
};

export const WORLD_AREAS: Province[] = [
  { id: 'world', name: 'Hele wereld', color: '#A7F3D0', capital: '', center: [18, 10], zoom: 2, isStudyArea: true },
  { id: 'africa', name: 'Afrika', color: '#FDBA74', capital: '', center: [2, 20], zoom: 3, isStudyArea: true },
  { id: 'asia', name: 'Azië', color: '#FDE047', capital: '', center: [35, 85], zoom: 3, isStudyArea: true },
  { id: 'north-america', name: 'Noord-Amerika', color: '#93C5FD', capital: '', center: [43, -100], zoom: 3, isStudyArea: true },
  { id: 'south-america', name: 'Zuid-Amerika', color: '#86EFAC', capital: '', center: [-18, -60], zoom: 3, isStudyArea: true },
  { id: 'oceania', name: 'Oceanië', color: '#C4B5FD', capital: '', center: [-22, 135], zoom: 4, isStudyArea: true },
  { id: 'arctic', name: 'Noordpoolgebied', color: '#DBEAFE', capital: '', center: [82, 0], zoom: 3, isStudyArea: true },
  { id: 'antarctica', name: 'Antarctica', color: '#E0F2FE', capital: '', center: [-82, 0], zoom: 3, isStudyArea: true },
];

export const WORLD_CLUSTERS: Cluster[] = [
  { id: 'world-countries-capitals', name: 'Landen & hoofdsteden', icon: '🏛️', provinceId: 'world' },
  { id: 'world-poles', name: 'Poolgebieden', icon: '❄️', provinceId: 'world' },
  { id: 'africa-countries-capitals', name: 'Landen & hoofdsteden', icon: '🏛️', provinceId: 'africa' },
  { id: 'asia-countries-capitals', name: 'Landen & hoofdsteden', icon: '🏛️', provinceId: 'asia' },
  { id: 'north-america-countries-capitals', name: 'Landen & hoofdsteden', icon: '🏛️', provinceId: 'north-america' },
  { id: 'south-america-countries-capitals', name: 'Landen & hoofdsteden', icon: '🏛️', provinceId: 'south-america' },
  { id: 'oceania-countries-capitals', name: 'Landen & hoofdsteden', icon: '🏛️', provinceId: 'oceania' },
];

const SEEDS: CountrySeed[] = [
  { id: 'dza', country: 'Algerije', capital: 'Algiers', region: 'africa', countryLat: 28.0339, countryLng: 1.6596, capitalLat: 36.7538, capitalLng: 3.0588 },
  { id: 'egy', country: 'Egypte', capital: 'Caïro', region: 'africa', countryLat: 26.8206, countryLng: 30.8025, capitalLat: 30.0444, capitalLng: 31.2357 },
  { id: 'eth', country: 'Ethiopië', capital: 'Addis Abeba', region: 'africa', countryLat: 9.145, countryLng: 40.4897, capitalLat: 8.9806, capitalLng: 38.7578 },
  { id: 'gha', country: 'Ghana', capital: 'Accra', region: 'africa', countryLat: 7.9465, countryLng: -1.0232, capitalLat: 5.6037, capitalLng: -0.187 },
  { id: 'ken', country: 'Kenia', capital: 'Nairobi', region: 'africa', countryLat: -0.0236, countryLng: 37.9062, capitalLat: -1.2921, capitalLng: 36.8219 },
  { id: 'mar', country: 'Marokko', capital: 'Rabat', region: 'africa', countryLat: 31.7917, countryLng: -7.0926, capitalLat: 34.0209, capitalLng: -6.8416 },
  { id: 'nga', country: 'Nigeria', capital: 'Abuja', region: 'africa', countryLat: 9.082, countryLng: 8.6753, capitalLat: 9.0765, capitalLng: 7.3986 },
  { id: 'sen', country: 'Senegal', capital: 'Dakar', region: 'africa', countryLat: 14.4974, countryLng: -14.4524, capitalLat: 14.7167, capitalLng: -17.4677 },
  { id: 'zaf', country: 'Zuid-Afrika', capital: 'Pretoria', region: 'africa', countryLat: -30.5595, countryLng: 22.9375, capitalLat: -25.7479, capitalLng: 28.2293 },
  { id: 'tza', country: 'Tanzania', capital: 'Dodoma', region: 'africa', countryLat: -6.369, countryLng: 34.8888, capitalLat: -6.163, capitalLng: 35.7516 },

  { id: 'chn', country: 'China', capital: 'Beijing', region: 'asia', countryLat: 35.8617, countryLng: 104.1954, capitalLat: 39.9042, capitalLng: 116.4074 },
  { id: 'ind', country: 'India', capital: 'New Delhi', region: 'asia', countryLat: 20.5937, countryLng: 78.9629, capitalLat: 28.6139, capitalLng: 77.209 },
  { id: 'idn', country: 'Indonesië', capital: 'Jakarta', region: 'asia', countryLat: -0.7893, countryLng: 113.9213, capitalLat: -6.2088, capitalLng: 106.8456 },
  { id: 'irn', country: 'Iran', capital: 'Teheran', region: 'asia', countryLat: 32.4279, countryLng: 53.688, capitalLat: 35.6892, capitalLng: 51.389 },
  { id: 'irq', country: 'Irak', capital: 'Bagdad', region: 'asia', countryLat: 33.2232, countryLng: 43.6793, capitalLat: 33.3152, capitalLng: 44.3661 },
  { id: 'isr', country: 'Israël', capital: 'Jeruzalem', region: 'asia', countryLat: 31.0461, countryLng: 34.8516, capitalLat: 31.7683, capitalLng: 35.2137 },
  { id: 'jpn', country: 'Japan', capital: 'Tokio', region: 'asia', countryLat: 36.2048, countryLng: 138.2529, capitalLat: 35.6762, capitalLng: 139.6503 },
  { id: 'kaz', country: 'Kazachstan', capital: 'Astana', region: 'asia', countryLat: 48.0196, countryLng: 66.9237, capitalLat: 51.1694, capitalLng: 71.4491 },
  { id: 'kor', country: 'Zuid-Korea', capital: 'Seoel', region: 'asia', countryLat: 35.9078, countryLng: 127.7669, capitalLat: 37.5665, capitalLng: 126.978 },
  { id: 'pak', country: 'Pakistan', capital: 'Islamabad', region: 'asia', countryLat: 30.3753, countryLng: 69.3451, capitalLat: 33.6844, capitalLng: 73.0479 },
  { id: 'phl', country: 'Filipijnen', capital: 'Manilla', region: 'asia', countryLat: 12.8797, countryLng: 121.774, capitalLat: 14.5995, capitalLng: 120.9842 },
  { id: 'rus', country: 'Rusland', capital: 'Moskou', region: 'asia', countryLat: 61.524, countryLng: 105.3188, capitalLat: 55.7558, capitalLng: 37.6173 },
  { id: 'sau', country: 'Saoedi-Arabië', capital: 'Riyad', region: 'asia', countryLat: 23.8859, countryLng: 45.0792, capitalLat: 24.7136, capitalLng: 46.6753 },
  { id: 'tha', country: 'Thailand', capital: 'Bangkok', region: 'asia', countryLat: 15.87, countryLng: 100.9925, capitalLat: 13.7563, capitalLng: 100.5018 },
  { id: 'vnm', country: 'Vietnam', capital: 'Hanoi', region: 'asia', countryLat: 14.0583, countryLng: 108.2772, capitalLat: 21.0278, capitalLng: 105.8342 },

  { id: 'can', country: 'Canada', capital: 'Ottawa', region: 'north-america', countryLat: 56.1304, countryLng: -106.3468, capitalLat: 45.4215, capitalLng: -75.6972 },
  { id: 'usa', country: 'Verenigde Staten', capital: 'Washington D.C.', region: 'north-america', countryLat: 37.0902, countryLng: -95.7129, capitalLat: 38.9072, capitalLng: -77.0369 },
  { id: 'mex', country: 'Mexico', capital: 'Mexico-Stad', region: 'north-america', countryLat: 23.6345, countryLng: -102.5528, capitalLat: 19.4326, capitalLng: -99.1332 },
  { id: 'gtm', country: 'Guatemala', capital: 'Guatemala-Stad', region: 'north-america', countryLat: 15.7835, countryLng: -90.2308, capitalLat: 14.6349, capitalLng: -90.5069 },
  { id: 'cub', country: 'Cuba', capital: 'Havana', region: 'north-america', countryLat: 21.5218, countryLng: -77.7812, capitalLat: 23.1136, capitalLng: -82.3666 },
  { id: 'hti', country: 'Haïti', capital: 'Port-au-Prince', region: 'north-america', countryLat: 18.9712, countryLng: -72.2852, capitalLat: 18.5944, capitalLng: -72.3074 },
  { id: 'dom', country: 'Dominicaanse Republiek', capital: 'Santo Domingo', region: 'north-america', countryLat: 18.7357, countryLng: -70.1627, capitalLat: 18.4861, capitalLng: -69.9312 },
  { id: 'jam', country: 'Jamaica', capital: 'Kingston', region: 'north-america', countryLat: 18.1096, countryLng: -77.2975, capitalLat: 17.9712, capitalLng: -76.7936 },

  { id: 'arg', country: 'Argentinië', capital: 'Buenos Aires', region: 'south-america', countryLat: -38.4161, countryLng: -63.6167, capitalLat: -34.6037, capitalLng: -58.3816 },
  { id: 'bol', country: 'Bolivia', capital: 'Sucre', region: 'south-america', countryLat: -16.2902, countryLng: -63.5887, capitalLat: -19.0196, capitalLng: -65.2619 },
  { id: 'bra', country: 'Brazilië', capital: 'Brasília', region: 'south-america', countryLat: -14.235, countryLng: -51.9253, capitalLat: -15.7939, capitalLng: -47.8828 },
  { id: 'chl', country: 'Chili', capital: 'Santiago', region: 'south-america', countryLat: -35.6751, countryLng: -71.543, capitalLat: -33.4489, capitalLng: -70.6693 },
  { id: 'col', country: 'Colombia', capital: 'Bogotá', region: 'south-america', countryLat: 4.5709, countryLng: -74.2973, capitalLat: 4.711, capitalLng: -74.0721 },
  { id: 'ecu', country: 'Ecuador', capital: 'Quito', region: 'south-america', countryLat: -1.8312, countryLng: -78.1834, capitalLat: -0.1807, capitalLng: -78.4678 },
  { id: 'per', country: 'Peru', capital: 'Lima', region: 'south-america', countryLat: -9.19, countryLng: -75.0152, capitalLat: -12.0464, capitalLng: -77.0428 },
  { id: 'ury', country: 'Uruguay', capital: 'Montevideo', region: 'south-america', countryLat: -32.5228, countryLng: -55.7658, capitalLat: -34.9011, capitalLng: -56.1645 },
  { id: 'ven', country: 'Venezuela', capital: 'Caracas', region: 'south-america', countryLat: 6.4238, countryLng: -66.5897, capitalLat: 10.4806, capitalLng: -66.9036 },

  { id: 'aus', country: 'Australië', capital: 'Canberra', region: 'oceania', countryLat: -25.2744, countryLng: 133.7751, capitalLat: -35.2809, capitalLng: 149.13 },
  { id: 'fji', country: 'Fiji', capital: 'Suva', region: 'oceania', countryLat: -17.7134, countryLng: 178.065, capitalLat: -18.1248, capitalLng: 178.4501 },
  { id: 'nzl', country: 'Nieuw-Zeeland', capital: 'Wellington', region: 'oceania', countryLat: -40.9006, countryLng: 174.886, capitalLat: -41.2865, capitalLng: 174.7762 },
  { id: 'png', country: 'Papoea-Nieuw-Guinea', capital: 'Port Moresby', region: 'oceania', countryLat: -6.315, countryLng: 143.9555, capitalLat: -9.4438, capitalLng: 147.1803 },
  { id: 'slb', country: 'Salomonseilanden', capital: 'Honiara', region: 'oceania', countryLat: -9.6457, countryLng: 160.1562, capitalLat: -9.4456, capitalLng: 159.9729 },
];

const makeLocations = (seed: CountrySeed): Location[] => [
  {
    id: `${seed.region}-${seed.id}`,
    name: seed.country,
    provinceId: seed.region,
    type: 'country',
    lat: seed.countryLat,
    lng: seed.countryLng,
    clusterId: `${seed.region}-countries-capitals`,
  },
  {
    id: `cap-${seed.region}-${seed.id}`,
    name: seed.capital,
    provinceId: seed.region,
    type: 'city',
    lat: seed.capitalLat,
    lng: seed.capitalLng,
    clusterId: `${seed.region}-countries-capitals`,
    isCapital: true,
  },
  {
    id: `world-${seed.id}`,
    name: seed.country,
    provinceId: 'world',
    type: 'country',
    lat: seed.countryLat,
    lng: seed.countryLng,
    clusterId: 'world-countries-capitals',
  },
  {
    id: `cap-world-${seed.id}`,
    name: seed.capital,
    provinceId: 'world',
    type: 'city',
    lat: seed.capitalLat,
    lng: seed.capitalLng,
    clusterId: 'world-countries-capitals',
    isCapital: true,
  },
];

export const WORLD_LOCATIONS: Location[] = SEEDS.flatMap(makeLocations);

export const POLE_LOCATIONS: Location[] = [
  { id: 'world-north-pole', name: 'Noordpool', provinceId: 'world', type: 'region', lat: 85, lng: 0, clusterId: 'world-poles' },
  { id: 'world-south-pole', name: 'Zuidpool', provinceId: 'world', type: 'region', lat: -85, lng: 0, clusterId: 'world-poles' },
  { id: 'arctic-north-pole', name: 'Noordpool', provinceId: 'arctic', type: 'region', lat: 85, lng: 0 },
  { id: 'antarctica-south-pole', name: 'Zuidpool', provinceId: 'antarctica', type: 'region', lat: -85, lng: 0 },
];
