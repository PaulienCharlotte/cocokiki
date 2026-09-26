import { Location, Province } from '../types';

export const BENELUX_AREA: Province = {
  id: 'benelux',
  name: 'Benelux',
  color: '#8CC8B8',
  capital: '',
  center: [50.9, 5.1],
  zoom: 7,
  isStudyArea: true,
};

export const BENELUX_LOCATIONS: Location[] = [
  // Plaatsen 1-16 van het oefenblad
  { id: 'benelux-1', name: 'Rotterdam', provinceId: 'benelux', type: 'city', lat: 51.9225, lng: 4.4792 },
  { id: 'benelux-2', name: 'Antwerpen', provinceId: 'benelux', type: 'city', lat: 51.2194, lng: 4.4025 },
  { id: 'benelux-3', name: 'Mechelen', provinceId: 'benelux', type: 'city', lat: 51.0259, lng: 4.4776 },
  { id: 'benelux-4', name: 'Leuven', provinceId: 'benelux', type: 'city', lat: 50.8798, lng: 4.7005 },
  { id: 'benelux-5', name: 'Brussel', provinceId: 'benelux', type: 'city', lat: 50.8503, lng: 4.3517, isCapital: true },
  { id: 'benelux-6', name: 'Hasselt', provinceId: 'benelux', type: 'city', lat: 50.9307, lng: 5.3325 },
  { id: 'benelux-7', name: 'Maastricht', provinceId: 'benelux', type: 'city', lat: 50.8514, lng: 5.6910 },
  { id: 'benelux-8', name: 'Luik', provinceId: 'benelux', type: 'city', lat: 50.6326, lng: 5.5797 },
  { id: 'benelux-9', name: 'Bastenaken', provinceId: 'benelux', type: 'city', lat: 50.0005, lng: 5.7153 },
  { id: 'benelux-10', name: 'Luxemburg (stad)', provinceId: 'benelux', type: 'city', lat: 49.6116, lng: 6.1319, isCapital: true },
  { id: 'benelux-11', name: 'Namen', provinceId: 'benelux', type: 'city', lat: 50.4674, lng: 4.8718 },
  { id: 'benelux-12', name: 'Charleroi', provinceId: 'benelux', type: 'city', lat: 50.4108, lng: 4.4446 },
  { id: 'benelux-13', name: 'Bergen', provinceId: 'benelux', type: 'city', lat: 50.4542, lng: 3.9523 },
  { id: 'benelux-14', name: 'Gent', provinceId: 'benelux', type: 'city', lat: 51.0543, lng: 3.7174 },
  { id: 'benelux-15', name: 'Brugge', provinceId: 'benelux', type: 'city', lat: 51.2093, lng: 3.2247 },
  { id: 'benelux-16', name: 'Oostende', provinceId: 'benelux', type: 'city', lat: 51.2300, lng: 2.9200 },

  // Gebied en wateren 17-21
  { id: 'benelux-17', name: 'Ardennen', provinceId: 'benelux', type: 'region', lat: 50.1300, lng: 5.6500 },
  { id: 'benelux-18', name: 'Maas', provinceId: 'benelux', type: 'water', lat: 50.7350, lng: 5.6900 },
  // Op het oefenblad staat de Rijn zichtbaar in Duitsland, ten oosten van de Benelux.
  { id: 'benelux-19', name: 'Rijn', provinceId: 'benelux', type: 'water', lat: 51.2300, lng: 6.7700 },
  { id: 'benelux-20', name: 'Schelde', provinceId: 'benelux', type: 'water', lat: 51.1000, lng: 4.2500 },
  { id: 'benelux-21', name: 'Noordzee', provinceId: 'benelux', type: 'water', lat: 52.0000, lng: 3.1500 },

  // Landen en gebieden 22-26
  { id: 'benelux-22', name: 'Luxemburg (land)', provinceId: 'benelux', type: 'country', lat: 49.8153, lng: 6.1296 },
  { id: 'benelux-23', name: 'Wallonië', provinceId: 'benelux', type: 'region', lat: 50.3500, lng: 4.8500 },
  { id: 'benelux-24', name: 'Vlaanderen', provinceId: 'benelux', type: 'region', lat: 51.0000, lng: 4.3000 },
  { id: 'benelux-25', name: 'België', provinceId: 'benelux', type: 'country', lat: 50.7000, lng: 4.6500 },
  { id: 'benelux-26', name: 'Nederland', provinceId: 'benelux', type: 'country', lat: 52.2500, lng: 5.4500 },
];
