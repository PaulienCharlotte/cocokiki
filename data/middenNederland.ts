import { Location, Province } from '../types';

export const MIDDEN_NEDERLAND_AREA: Province = {
  id: 'midden-nederland',
  name: 'Midden-Nederland',
  color: '#8CC8B8',
  capital: '',
  center: [52.25, 5.35],
  zoom: 9,
  isStudyArea: true,
};

export const MIDDEN_NEDERLAND_LOCATIONS: Location[] = [
  // Plaatsen 1-14 van het oefenblad
  { id: 'midden-nederland-1', name: 'Lelystad', provinceId: 'midden-nederland', type: 'city', lat: 52.5185, lng: 5.4714 },
  { id: 'midden-nederland-2', name: 'Almere', provinceId: 'midden-nederland', type: 'city', lat: 52.3508, lng: 5.2647 },
  { id: 'midden-nederland-3', name: 'Emmeloord', provinceId: 'midden-nederland', type: 'city', lat: 52.7108, lng: 5.7486 },
  { id: 'midden-nederland-4', name: 'Utrecht', provinceId: 'midden-nederland', type: 'city', lat: 52.0907, lng: 5.1214 },
  { id: 'midden-nederland-5', name: 'Amersfoort', provinceId: 'midden-nederland', type: 'city', lat: 52.1561, lng: 5.3878 },
  { id: 'midden-nederland-6', name: 'Zeist', provinceId: 'midden-nederland', type: 'city', lat: 52.0906, lng: 5.2333 },
  { id: 'midden-nederland-7', name: 'Nieuwegein', provinceId: 'midden-nederland', type: 'city', lat: 52.0250, lng: 5.0913 },
  { id: 'midden-nederland-8', name: 'De Bilt', provinceId: 'midden-nederland', type: 'city', lat: 52.1103, lng: 5.1806 },
  { id: 'midden-nederland-9', name: 'Soest', provinceId: 'midden-nederland', type: 'city', lat: 52.1733, lng: 5.2917 },
  { id: 'midden-nederland-10', name: 'Veenendaal', provinceId: 'midden-nederland', type: 'city', lat: 52.0280, lng: 5.5589 },
  { id: 'midden-nederland-11', name: 'Woerden', provinceId: 'midden-nederland', type: 'city', lat: 52.0850, lng: 4.8833 },
  { id: 'midden-nederland-12', name: 'Dronten', provinceId: 'midden-nederland', type: 'city', lat: 52.5250, lng: 5.7181 },
  { id: 'midden-nederland-13', name: 'Urk', provinceId: 'midden-nederland', type: 'city', lat: 52.6625, lng: 5.6011 },
  { id: 'midden-nederland-14', name: 'Zeewolde', provinceId: 'midden-nederland', type: 'city', lat: 52.3300, lng: 5.5417 },

  // Gebieden A-D van het oefenblad
  { id: 'midden-nederland-a', name: 'Noordoostpolder', provinceId: 'midden-nederland', type: 'region', lat: 52.7200, lng: 5.7200 },
  { id: 'midden-nederland-b', name: 'Oostelijk Flevoland', provinceId: 'midden-nederland', type: 'region', lat: 52.5000, lng: 5.6700 },
  { id: 'midden-nederland-c', name: 'Zuidelijk Flevoland', provinceId: 'midden-nederland', type: 'region', lat: 52.3700, lng: 5.4300 },
  { id: 'midden-nederland-d', name: 'Grebbeberg', provinceId: 'midden-nederland', type: 'region', lat: 51.9567, lng: 5.6000 },

  // Wateren I-IX van het oefenblad
  { id: 'midden-nederland-i', name: 'IJsselmeer', provinceId: 'midden-nederland', type: 'water', lat: 52.6800, lng: 5.3200 },
  { id: 'midden-nederland-ii', name: 'Veluwemeer', provinceId: 'midden-nederland', type: 'water', lat: 52.4100, lng: 5.7600 },
  { id: 'midden-nederland-iii', name: 'Markermeer', provinceId: 'midden-nederland', type: 'water', lat: 52.5100, lng: 5.2100 },
  { id: 'midden-nederland-iv', name: 'Gooimeer', provinceId: 'midden-nederland', type: 'water', lat: 52.3100, lng: 5.2200 },
  { id: 'midden-nederland-v', name: 'Ketelmeer', provinceId: 'midden-nederland', type: 'water', lat: 52.6000, lng: 5.7400 },
  { id: 'midden-nederland-vi', name: 'Vecht', provinceId: 'midden-nederland', type: 'water', lat: 52.1700, lng: 5.0200 },
  { id: 'midden-nederland-vii', name: 'Neder-Rijn', provinceId: 'midden-nederland', type: 'water', lat: 51.9700, lng: 5.5900 },
  { id: 'midden-nederland-viii', name: 'Lek', provinceId: 'midden-nederland', type: 'water', lat: 51.9700, lng: 5.0000 },
  { id: 'midden-nederland-ix', name: 'Amsterdam-Rijnkanaal', provinceId: 'midden-nederland', type: 'water', lat: 52.0300, lng: 5.0800 },
];
