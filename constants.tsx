
import { Province, Location, Cluster } from './types';

export const PROVINCES: Province[] = [
  { id: 'zh', name: 'Zuid-Holland', color: '#B9FBC0', capital: 'Den Haag', center: [52.02, 4.45], zoom: 9 },
  { id: 'nh', name: 'Noord-Holland', color: '#FFCFD2', capital: 'Haarlem', center: [52.6, 4.8], zoom: 9 },
  { id: 'ut', name: 'Utrecht', color: '#CFBAF0', capital: 'Utrecht', center: [52.1, 5.2], zoom: 11 },
  { id: 'nb', name: 'Noord-Brabant', color: '#FFD1DC', capital: "'s-Hertogenbosch", center: [51.6, 5.1], zoom: 9 },
  { id: 'ge', name: 'Gelderland', color: '#E2F0CB', capital: 'Arnhem', center: [52.1, 5.9], zoom: 9 },
  { id: 'ov', name: 'Overijssel', color: '#FFFFB5', capital: 'Zwolle', center: [52.4, 6.4], zoom: 9 },
  { id: 'fl', name: 'Flevoland', color: '#FFB7B2', capital: 'Lelystad', center: [52.5, 5.5], zoom: 10 },
  { id: 'fr', name: 'Friesland', color: '#A2D2FF', capital: 'Leeuwarden', center: [53.1, 5.8], zoom: 9 },
  { id: 'gr', name: 'Groningen', color: '#B9FBC0', capital: 'Groningen', center: [53.2, 6.7], zoom: 10 },
  { id: 'dr', name: 'Drenthe', color: '#FFCCAC', capital: 'Assen', center: [52.9, 6.6], zoom: 10 },
  { id: 'ze', name: 'Zeeland', color: '#A2D2FF', capital: 'Middelburg', center: [51.5, 3.8], zoom: 10 },
  { id: 'li', name: 'Limburg', color: '#FFDAC1', capital: 'Maastricht', center: [51.2, 6.0], zoom: 9 },
];

export const CLUSTERS: Cluster[] = [
  // --- ZUID-HOLLAND ---
  { id: 'kust', name: 'De Kust', icon: '🏖️', provinceId: 'zh' },
  { id: 'maas', name: 'Rond de Maas', icon: '🚢', provinceId: 'zh' },
  { id: 'groen', name: 'Steden & Groen', icon: '🌳', provinceId: 'zh' },
  { id: 'wateren', name: 'Water & Eilanden', icon: '⚓', provinceId: 'zh' },

  // --- FRIESLAND ---
  { id: 'wadden', name: 'Waddeneilanden e.o.', icon: '⛴️', provinceId: 'fr' },
  { id: 'meren', name: 'Friese Meren', icon: '⛵', provinceId: 'fr' },
  { id: 'wouden', name: 'Friese Wouden', icon: '🌳', provinceId: 'fr' },
  { id: 'steden', name: 'Noordwest / Terpenland', icon: '🏙️', provinceId: 'fr' },
];

export const LOCATIONS: Location[] = [
  // --- ZUID-HOLLAND COMPLEET ---
  { id: 'zh-1', name: 'Den Haag', provinceId: 'zh', type: 'city', lat: 52.0705, lng: 4.3100, clusterId: 'kust' },
  { id: 'zh-15', name: 'Scheveningen', provinceId: 'zh', type: 'city', lat: 52.1100, lng: 4.2800, clusterId: 'kust' },
  { id: 'zh-11', name: 'Wassenaar', provinceId: 'zh', type: 'city', lat: 52.1450, lng: 4.4000, clusterId: 'kust' },
  { id: 'zh-13', name: 'Noordwijk (aan zee)', provinceId: 'zh', type: 'city', lat: 52.2400, lng: 4.4400, clusterId: 'kust' },
  { id: 'zh-22', name: 'Katwijk aan Zee', provinceId: 'zh', type: 'city', lat: 52.2000, lng: 4.4000, clusterId: 'kust' },
  { id: 'zh-17', name: 'Westland (B)', provinceId: 'zh', type: 'region', lat: 51.9950, lng: 4.2200, clusterId: 'kust' },

  { id: 'zh-2', name: 'Rotterdam', provinceId: 'zh', type: 'city', lat: 51.9225, lng: 4.4792, clusterId: 'maas' },
  { id: 'zh-3', name: 'Schiedam', provinceId: 'zh', type: 'city', lat: 51.9170, lng: 4.4020, clusterId: 'maas' },
  { id: 'zh-21', name: 'Vlaardingen', provinceId: 'zh', type: 'city', lat: 51.9125, lng: 4.3417, clusterId: 'maas' },
  { id: 'zh-23', name: 'Maassluis', provinceId: 'zh', type: 'city', lat: 51.9180, lng: 4.2500, clusterId: 'maas' },
  { id: 'zh-4', name: 'Delft', provinceId: 'zh', type: 'city', lat: 52.0116, lng: 4.3571, clusterId: 'maas' },
  { id: 'zh-12', name: 'Spijkenisse', provinceId: 'zh', type: 'city', lat: 51.8450, lng: 4.3300, clusterId: 'maas' },
  { id: 'zh-20', name: 'Nieuwe Maas (III)', provinceId: 'zh', type: 'water', lat: 51.9056, lng: 4.4200, clusterId: 'maas' },

  { id: 'zh-8', name: 'Zoetermeer', provinceId: 'zh', type: 'city', lat: 52.0600, lng: 4.4950, clusterId: 'groen' },
  { id: 'zh-6', name: 'Leiden', provinceId: 'zh', type: 'city', lat: 52.1601, lng: 4.4970, clusterId: 'groen' },
  { id: 'zh-5', name: 'Gouda', provinceId: 'zh', type: 'city', lat: 52.0116, lng: 4.7105, clusterId: 'groen' },
  { id: 'zh-9', name: 'Alphen aan den Rijn', provinceId: 'zh', type: 'city', lat: 52.1294, lng: 4.6578, clusterId: 'groen' },
  
  { id: 'zh-10', name: 'Hoek van Holland', provinceId: 'zh', type: 'city', lat: 51.9774, lng: 4.1333, clusterId: 'wateren' },
  { id: 'zh-14', name: 'Hellevoetsluis', provinceId: 'zh', type: 'city', lat: 51.8320, lng: 4.1320, clusterId: 'wateren' },
  { id: 'zh-7', name: 'Dordrecht', provinceId: 'zh', type: 'city', lat: 51.8133, lng: 4.6901, clusterId: 'wateren' },
  { id: 'zh-24', name: 'Gorinchem', provinceId: 'zh', type: 'city', lat: 51.8300, lng: 4.9700, clusterId: 'wateren' },
  { id: 'zh-16', name: 'Goeree-Overflakkee (A)', provinceId: 'zh', type: 'region', lat: 51.7511, lng: 4.0970, clusterId: 'wateren' },
  { id: 'zh-18', name: 'Haringvliet (I)', provinceId: 'zh', type: 'water', lat: 51.8021, lng: 4.1500, clusterId: 'wateren' },
  { id: 'zh-19', name: 'Hollands Diep (II)', provinceId: 'zh', type: 'water', lat: 51.7214, lng: 4.5457, clusterId: 'wateren' },

  // --- OVERIGE ---
  { id: 'cap-1', name: 'Assen', provinceId: 'dr', type: 'city', lat: 52.9927, lng: 6.5642 },
  { id: 'cap-2', name: 'Lelystad', provinceId: 'fl', type: 'city', lat: 52.5185, lng: 5.4714 },
  { id: 'cap-3', name: 'Leeuwarden', provinceId: 'fr', type: 'city', lat: 53.2012, lng: 5.7999, clusterId: 'steden' },
  { id: 'cap-4', name: 'Arnhem', provinceId: 'ge', type: 'city', lat: 51.9851, lng: 5.8987 },
  { id: 'cap-5', name: 'Groningen', provinceId: 'gr', type: 'city', lat: 53.2194, lng: 6.5665 },
  { id: 'cap-6', name: 'Maastricht', provinceId: 'li', type: 'city', lat: 50.8514, lng: 5.6910 },
  { id: 'cap-7', name: "’s-Hertogenbosch", provinceId: 'nb', type: 'city', lat: 51.6978, lng: 5.3037 },
  { id: 'cap-8', name: 'Haarlem', provinceId: 'nh', type: 'city', lat: 52.3874, lng: 4.6462 },
  { id: 'cap-9', name: 'Zwolle', provinceId: 'ov', type: 'city', lat: 52.5168, lng: 6.0830 },
  { id: 'cap-10', name: 'Utrecht', provinceId: 'ut', type: 'city', lat: 52.0907, lng: 5.1214 },
  { id: 'cap-11', name: 'Middelburg', provinceId: 'ze', type: 'city', lat: 51.4988, lng: 3.6110 },
  { id: 'city-nh-1', name: 'Amsterdam', provinceId: 'nh', type: 'city', lat: 52.3676, lng: 4.9041 },

  // --- FRIESLAND ---
  // Plaatsen (Leeuwarden is al aanwezig als cap-3)
  { id: 'fr-2', name: 'Drachten', provinceId: 'fr', type: 'city', lat: 53.1100, lng: 6.0960, clusterId: 'wouden' },
  { id: 'fr-3', name: 'Sneek', provinceId: 'fr', type: 'city', lat: 53.0320, lng: 5.6600, clusterId: 'meren' },
  { id: 'fr-4', name: 'Heerenveen', provinceId: 'fr', type: 'city', lat: 52.9590, lng: 5.9220, clusterId: 'wouden' },
  { id: 'fr-5', name: 'Harlingen', provinceId: 'fr', type: 'city', lat: 53.1740, lng: 5.4260, clusterId: 'wadden' },
  { id: 'fr-6', name: 'Dokkum', provinceId: 'fr', type: 'city', lat: 53.3280, lng: 5.9960, clusterId: 'steden' },
  { id: 'fr-7', name: 'Lemmer', provinceId: 'fr', type: 'city', lat: 52.8460, lng: 5.7140, clusterId: 'meren' },
  { id: 'fr-8', name: 'Stavoren', provinceId: 'fr', type: 'city', lat: 52.8850, lng: 5.3580, clusterId: 'meren' },
  { id: 'fr-9', name: 'Franeker', provinceId: 'fr', type: 'city', lat: 53.1850, lng: 5.5420, clusterId: 'steden' },
  { id: 'fr-10', name: 'Bolsward', provinceId: 'fr', type: 'city', lat: 53.0640, lng: 5.5250, clusterId: 'steden' },
  { id: 'fr-11', name: 'Joure', provinceId: 'fr', type: 'city', lat: 52.9660, lng: 5.7950, clusterId: 'meren' },
  { id: 'fr-12', name: 'Wolvega', provinceId: 'fr', type: 'city', lat: 52.8760, lng: 6.0020, clusterId: 'wouden' },
  { id: 'fr-13', name: 'Appelscha', provinceId: 'fr', type: 'city', lat: 52.9530, lng: 6.3570, clusterId: 'wouden' },

  // Gebieden
  { id: 'fr-A', name: 'Gaasterland', provinceId: 'fr', type: 'region', lat: 52.8590, lng: 5.5560, clusterId: 'meren' },
  { id: 'fr-B', name: 'Vlieland', provinceId: 'fr', type: 'region', lat: 53.2670, lng: 4.9660, clusterId: 'wadden' },
  { id: 'fr-C', name: 'Terschelling', provinceId: 'fr', type: 'region', lat: 53.4000, lng: 5.3160, clusterId: 'wadden' },
  { id: 'fr-D', name: 'Ameland', provinceId: 'fr', type: 'region', lat: 53.4500, lng: 5.7660, clusterId: 'wadden' },
  { id: 'fr-E', name: 'Schiermonnikoog', provinceId: 'fr', type: 'region', lat: 53.4830, lng: 6.1830, clusterId: 'wadden' },

  // Wateren
  { id: 'fr-I', name: 'Waddenzee', provinceId: 'fr', type: 'water', lat: 53.3330, lng: 5.4160, clusterId: 'wadden' },
  { id: 'fr-II', name: 'Noordzee', provinceId: 'fr', type: 'water', lat: 53.5000, lng: 4.5000, clusterId: 'wadden' },
  { id: 'fr-III', name: 'IJsselmeer', provinceId: 'fr', type: 'water', lat: 52.8330, lng: 5.3330, clusterId: 'meren' },
  { id: 'fr-IV', name: 'Sneekermeer', provinceId: 'fr', type: 'water', lat: 53.0330, lng: 5.7500, clusterId: 'meren' },
  { id: 'fr-V', name: 'Fluessen', provinceId: 'fr', type: 'water', lat: 52.9330, lng: 5.5160, clusterId: 'meren' },
  { id: 'fr-VI', name: 'Slotermeer', provinceId: 'fr', type: 'water', lat: 52.9000, lng: 5.6160, clusterId: 'meren' },
  { id: 'fr-VII', name: 'Tjeukemeer', provinceId: 'fr', type: 'water', lat: 52.8830, lng: 5.8000, clusterId: 'meren' },
];
