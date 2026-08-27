
import { Province, Location, Cluster } from './types';
import { EUROPE_AREA, EUROPE_CLUSTERS, EUROPE_LOCATIONS } from './data/europe';
import { POLE_LOCATIONS, WORLD_AREAS, WORLD_CLUSTERS, WORLD_LOCATIONS } from './data/world';

export const PROVINCES: Province[] = [
  { id: 'zh', name: 'Zuid-Holland', color: '#F4B183', capital: 'Den Haag', center: [52.02, 4.45], zoom: 9 },
  { id: 'nh', name: 'Noord-Holland', color: '#F6D64A', capital: 'Haarlem', center: [52.6, 4.8], zoom: 9 },
  { id: 'ut', name: 'Utrecht', color: '#7FC8F8', capital: 'Utrecht', center: [52.1, 5.2], zoom: 11 },
  { id: 'nb', name: 'Noord-Brabant', color: '#F7E65A', capital: "'s-Hertogenbosch", center: [51.6, 5.1], zoom: 9 },
  { id: 'ge', name: 'Gelderland', color: '#A8D46F', capital: 'Arnhem', center: [52.1, 5.9], zoom: 9 },
  { id: 'ov', name: 'Overijssel', color: '#D99A45', capital: 'Zwolle', center: [52.4, 6.4], zoom: 9 },
  { id: 'fl', name: 'Flevoland', color: '#6BAED6', capital: 'Lelystad', center: [52.5, 5.5], zoom: 10 },
  { id: 'fr', name: 'Friesland', color: '#E8795C', capital: 'Leeuwarden', center: [53.1, 5.8], zoom: 9 },
  { id: 'gr', name: 'Groningen', color: '#8CBF50', capital: 'Groningen', center: [53.2, 6.7], zoom: 10 },
  { id: 'dr', name: 'Drenthe', color: '#DDA23A', capital: 'Assen', center: [52.9, 6.6], zoom: 10 },
  { id: 'ze', name: 'Zeeland', color: '#C690C9', capital: 'Middelburg', center: [51.5, 3.8], zoom: 10 },
  { id: 'li', name: 'Limburg', color: '#B884C6', capital: 'Maastricht', center: [51.2, 6.0], zoom: 9 },
  { id: 'water-nl', name: 'Wateren Nederland', color: '#BAE6FD', capital: '', center: [52.05, 5.25], zoom: 8, isStudyArea: true },
  EUROPE_AREA,
  ...WORLD_AREAS,
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

  // --- NOORD-HOLLAND ---
  { id: 'nh_metropool', name: 'Metropool Amsterdam', icon: '🌆', provinceId: 'nh' },
  { id: 'nh_kust', name: 'Kust & Haarlemmermeer', icon: '🏖️', provinceId: 'nh' },
  { id: 'nh_waterland', name: 'Waterland & Zaanstreek', icon: '⛵', provinceId: 'nh' },
  { id: 'nh_westfriesland', name: "West-Friesland & 't Gooi", icon: '🏘️', provinceId: 'nh' },

  // --- GELDERLAND ---
  { id: 'ge_veluwe', name: 'Veluwe', icon: '🌲', provinceId: 'ge' },
  { id: 'ge_rivieren', name: 'Rivierengebied', icon: '🌊', provinceId: 'ge' },
  { id: 'ge_achterhoek', name: 'Achterhoek', icon: '🌾', provinceId: 'ge' },

  // --- NOORD-BRABANT ---
  { id: 'nb_baronie', name: 'Baronie van Breda', icon: '🏰', provinceId: 'nb' },
  { id: 'nb_meierij', name: 'Meierij', icon: '🏛️', provinceId: 'nb' },
  { id: 'nb_kempen', name: 'Kempen', icon: '🌳', provinceId: 'nb' },
  { id: 'nb_peel', name: 'De Peel', icon: '🌾', provinceId: 'nb' },

  // --- WATEREN NEDERLAND ---
  { id: 'water_nl_rivieren_kanalen', name: 'Rivieren & Kanalen', icon: '🌊', provinceId: 'water-nl' },
  ...EUROPE_CLUSTERS,
  ...WORLD_CLUSTERS,
];

export const LOCATIONS: Location[] = [
  // --- ZUID-HOLLAND COMPLEET ---
  { id: 'zh-1', name: 'Den Haag', provinceId: 'zh', type: 'city', lat: 52.0705, lng: 4.3100, clusterId: 'kust', isCapital: true },
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
  { id: 'cap-1', name: 'Assen', provinceId: 'dr', type: 'city', lat: 52.9927, lng: 6.5642, isCapital: true },
  { id: 'cap-2', name: 'Lelystad', provinceId: 'fl', type: 'city', lat: 52.5185, lng: 5.4714, isCapital: true },
  { id: 'cap-3', name: 'Leeuwarden', provinceId: 'fr', type: 'city', lat: 53.2012, lng: 5.7999, clusterId: 'steden', isCapital: true },
  { id: 'cap-4', name: 'Arnhem', provinceId: 'ge', type: 'city', lat: 51.9851, lng: 5.8987, clusterId: 'ge_rivieren', isCapital: true },
  { id: 'cap-5', name: 'Groningen', provinceId: 'gr', type: 'city', lat: 53.2194, lng: 6.5665, isCapital: true },
  { id: 'cap-6', name: 'Maastricht', provinceId: 'li', type: 'city', lat: 50.8514, lng: 5.6910, isCapital: true },
  { id: 'cap-7', name: "’s-Hertogenbosch", provinceId: 'nb', type: 'city', lat: 51.6978, lng: 5.3037, clusterId: 'nb_meierij', isCapital: true },
  { id: 'cap-8', name: 'Haarlem', provinceId: 'nh', type: 'city', lat: 52.3874, lng: 4.6462, clusterId: 'nh_kust', isCapital: true },
  { id: 'cap-9', name: 'Zwolle', provinceId: 'ov', type: 'city', lat: 52.5168, lng: 6.0830, isCapital: true },
  { id: 'cap-10', name: 'Utrecht', provinceId: 'ut', type: 'city', lat: 52.0907, lng: 5.1214, isCapital: true },
  { id: 'cap-11', name: 'Middelburg', provinceId: 'ze', type: 'city', lat: 51.4988, lng: 3.6110, isCapital: true },
  { id: 'city-nh-1', name: 'Amsterdam', provinceId: 'nh', type: 'city', lat: 52.3676, lng: 4.9041, clusterId: 'nh_metropool' },

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

  // --- NOORD-HOLLAND ---
  // Plaatsen (Haarlem = cap-8, Amsterdam = city-nh-1)
  { id: 'nh-1', name: 'Alkmaar', provinceId: 'nh', type: 'city', lat: 52.6324, lng: 4.7524, clusterId: 'nh_westfriesland' },
  { id: 'nh-2', name: 'Zaandam', provinceId: 'nh', type: 'city', lat: 52.4386, lng: 4.8264, clusterId: 'nh_waterland' },
  { id: 'nh-3', name: 'Den Helder', provinceId: 'nh', type: 'city', lat: 52.9560, lng: 4.7625, clusterId: 'nh_kust' },
  { id: 'nh-4', name: 'Hoorn', provinceId: 'nh', type: 'city', lat: 52.6461, lng: 5.0591, clusterId: 'nh_westfriesland' },
  { id: 'nh-5', name: 'Hilversum', provinceId: 'nh', type: 'city', lat: 52.2215, lng: 5.1779, clusterId: 'nh_westfriesland' },
  { id: 'nh-6', name: 'Purmerend', provinceId: 'nh', type: 'city', lat: 52.5024, lng: 4.9570, clusterId: 'nh_waterland' },
  { id: 'nh-7', name: 'Amstelveen', provinceId: 'nh', type: 'city', lat: 52.3095, lng: 4.8590, clusterId: 'nh_metropool' },
  { id: 'nh-8', name: 'Aalsmeer', provinceId: 'nh', type: 'city', lat: 52.2591, lng: 4.7635, clusterId: 'nh_metropool' },
  { id: 'nh-9', name: 'Enkhuizen', provinceId: 'nh', type: 'city', lat: 52.7065, lng: 5.2944, clusterId: 'nh_westfriesland' },
  { id: 'nh-10', name: 'IJmuiden', provinceId: 'nh', type: 'city', lat: 52.4613, lng: 4.6113, clusterId: 'nh_kust' },
  { id: 'nh-11', name: 'Volendam', provinceId: 'nh', type: 'city', lat: 52.4961, lng: 5.0705, clusterId: 'nh_waterland' },
  { id: 'nh-12', name: 'Zandvoort', provinceId: 'nh', type: 'city', lat: 52.3708, lng: 4.5339, clusterId: 'nh_kust' },
  { id: 'nh-13', name: 'Bussum', provinceId: 'nh', type: 'city', lat: 52.2769, lng: 5.1613, clusterId: 'nh_westfriesland' },

  // Gebieden
  { id: 'nh-A', name: 'Het Gooi', provinceId: 'nh', type: 'region', lat: 52.2500, lng: 5.1200, clusterId: 'nh_westfriesland' },
  { id: 'nh-B', name: 'Beemster', provinceId: 'nh', type: 'region', lat: 52.5481, lng: 4.9208, clusterId: 'nh_waterland' },
  { id: 'nh-C', name: 'Wieringermeer', provinceId: 'nh', type: 'region', lat: 52.8500, lng: 5.0167, clusterId: 'nh_kust' },
  { id: 'nh-D', name: 'Texel', provinceId: 'nh', type: 'region', lat: 53.0586, lng: 4.7958, clusterId: 'nh_kust' },
  { id: 'nh-E', name: 'Haarlemmermeer', provinceId: 'nh', type: 'region', lat: 52.3050, lng: 4.6833, clusterId: 'nh_kust' },
  { id: 'nh-F', name: 'Schiphol', provinceId: 'nh', type: 'region', lat: 52.3105, lng: 4.7683, clusterId: 'nh_metropool' },

  // Wateren
  { id: 'nh-I', name: 'IJmeer', provinceId: 'nh', type: 'water', lat: 52.3667, lng: 5.0500, clusterId: 'nh_metropool' },
  { id: 'nh-II', name: 'Noordhollands Kanaal', provinceId: 'nh', type: 'water', lat: 52.7500, lng: 4.8167, clusterId: 'nh_kust' },
  { id: 'nh-III', name: 'Noordzeekanaal', provinceId: 'nh', type: 'water', lat: 52.4400, lng: 4.7167, clusterId: 'nh_kust' },
  { id: 'nh-IV', name: 'Loosdrechtse Plassen', provinceId: 'nh', type: 'water', lat: 52.2083, lng: 5.0667, clusterId: 'nh_westfriesland' },
  { id: 'nh-V', name: 'Amsterdam-Rijnkanaal', provinceId: 'nh', type: 'water', lat: 52.2500, lng: 5.0333, clusterId: 'nh_metropool' },
  { id: 'nh-VI', name: 'Markermeer', provinceId: 'nh', type: 'water', lat: 52.5500, lng: 5.1000, clusterId: 'nh_waterland' },

  // --- GELDERLAND ---
  // Plaatsen (Arnhem = cap-4)
  { id: 'ge-1', name: 'Nijmegen', provinceId: 'ge', type: 'city', lat: 51.8426, lng: 5.8528, clusterId: 'ge_rivieren' },
  { id: 'ge-2', name: 'Apeldoorn', provinceId: 'ge', type: 'city', lat: 52.2112, lng: 5.9699, clusterId: 'ge_veluwe' },
  { id: 'ge-3', name: 'Harderwijk', provinceId: 'ge', type: 'city', lat: 52.3424, lng: 5.6229, clusterId: 'ge_veluwe' },
  { id: 'ge-4', name: 'Ede', provinceId: 'ge', type: 'city', lat: 52.0415, lng: 5.6656, clusterId: 'ge_veluwe' },
  { id: 'ge-5', name: 'Doetinchem', provinceId: 'ge', type: 'city', lat: 51.9656, lng: 6.2973, clusterId: 'ge_achterhoek' },
  { id: 'ge-6', name: 'Zutphen', provinceId: 'ge', type: 'city', lat: 52.1386, lng: 6.1989, clusterId: 'ge_achterhoek' },
  { id: 'ge-7', name: 'Winterswijk', provinceId: 'ge', type: 'city', lat: 51.9760, lng: 6.7193, clusterId: 'ge_achterhoek' },
  { id: 'ge-8', name: 'Wageningen', provinceId: 'ge', type: 'city', lat: 51.9693, lng: 5.6653, clusterId: 'ge_rivieren' },
  { id: 'ge-9', name: 'Tiel', provinceId: 'ge', type: 'city', lat: 51.8847, lng: 5.4287, clusterId: 'ge_rivieren' },
  { id: 'ge-10', name: 'Barneveld', provinceId: 'ge', type: 'city', lat: 52.1196, lng: 5.5886, clusterId: 'ge_veluwe' },
  { id: 'ge-11', name: 'Elst', provinceId: 'ge', type: 'city', lat: 51.9188, lng: 5.8492, clusterId: 'ge_rivieren' },
  { id: 'ge-12', name: 'Zevenaar', provinceId: 'ge', type: 'city', lat: 51.9274, lng: 6.0761, clusterId: 'ge_rivieren' },
  { id: 'ge-13', name: 'Nijkerk', provinceId: 'ge', type: 'city', lat: 52.2179, lng: 5.4878, clusterId: 'ge_veluwe' },
  { id: 'ge-14', name: 'Nunspeet', provinceId: 'ge', type: 'city', lat: 52.3783, lng: 5.7774, clusterId: 'ge_veluwe' },
  { id: 'ge-15', name: 'Groenlo', provinceId: 'ge', type: 'city', lat: 51.9988, lng: 6.6164, clusterId: 'ge_achterhoek' },

  // Gebieden
  { id: 'ge-A', name: 'Veluwe', provinceId: 'ge', type: 'region', lat: 52.1500, lng: 5.8500, clusterId: 'ge_veluwe' },
  { id: 'ge-B', name: 'Betuwe', provinceId: 'ge', type: 'region', lat: 51.8800, lng: 5.5500, clusterId: 'ge_rivieren' },
  { id: 'ge-C', name: 'Achterhoek', provinceId: 'ge', type: 'region', lat: 51.9800, lng: 6.4500, clusterId: 'ge_achterhoek' },

  // Wateren / rivieren
  { id: 'ge-I', name: 'Waal', provinceId: 'ge', type: 'water', lat: 51.8700, lng: 5.4500, clusterId: 'ge_rivieren' },
  { id: 'ge-II', name: 'IJssel', provinceId: 'ge', type: 'water', lat: 52.1200, lng: 6.1000, clusterId: 'ge_achterhoek' },
  { id: 'ge-III', name: 'Rijn', provinceId: 'ge', type: 'water', lat: 51.9600, lng: 5.9500, clusterId: 'ge_rivieren' },

  // --- NOORD-BRABANT ---
  // Plaatsen ('s-Hertogenbosch = cap-7)
  { id: 'nb-1', name: 'Eindhoven', provinceId: 'nb', type: 'city', lat: 51.4416, lng: 5.4697, clusterId: 'nb_kempen' },
  { id: 'nb-2', name: 'Tilburg', provinceId: 'nb', type: 'city', lat: 51.5555, lng: 5.0913, clusterId: 'nb_kempen' },
  { id: 'nb-3', name: 'Breda', provinceId: 'nb', type: 'city', lat: 51.5719, lng: 4.7683, clusterId: 'nb_baronie' },
  { id: 'nb-4', name: 'Helmond', provinceId: 'nb', type: 'city', lat: 51.4793, lng: 5.6624, clusterId: 'nb_peel' },
  { id: 'nb-5', name: 'Oss', provinceId: 'nb', type: 'city', lat: 51.7654, lng: 5.5180, clusterId: 'nb_meierij' },
  { id: 'nb-6', name: 'Roosendaal', provinceId: 'nb', type: 'city', lat: 51.5306, lng: 4.4654, clusterId: 'nb_baronie' },
  { id: 'nb-7', name: 'Bergen op Zoom', provinceId: 'nb', type: 'city', lat: 51.4948, lng: 4.2872, clusterId: 'nb_baronie' },
  { id: 'nb-8', name: 'Waalwijk', provinceId: 'nb', type: 'city', lat: 51.6841, lng: 5.0739, clusterId: 'nb_baronie' },
  { id: 'nb-9', name: 'Oosterhout', provinceId: 'nb', type: 'city', lat: 51.6450, lng: 4.8579, clusterId: 'nb_baronie' },
  { id: 'nb-10', name: 'Uden', provinceId: 'nb', type: 'city', lat: 51.6611, lng: 5.6196, clusterId: 'nb_peel' },
  { id: 'nb-11', name: 'Veghel', provinceId: 'nb', type: 'city', lat: 51.6173, lng: 5.5419, clusterId: 'nb_meierij' },
  { id: 'nb-12', name: 'Boxmeer', provinceId: 'nb', type: 'city', lat: 51.6479, lng: 5.9456, clusterId: 'nb_peel' },
  { id: 'nb-13', name: 'Boxtel', provinceId: 'nb', type: 'city', lat: 51.5919, lng: 5.3253, clusterId: 'nb_meierij' },
  { id: 'nb-14', name: 'Valkenswaard', provinceId: 'nb', type: 'city', lat: 51.3502, lng: 5.4602, clusterId: 'nb_kempen' },
  { id: 'nb-15', name: 'Etten-Leur', provinceId: 'nb', type: 'city', lat: 51.5708, lng: 4.6388, clusterId: 'nb_baronie' },

  // Gebieden
  { id: 'nb-A', name: 'Kempen', provinceId: 'nb', type: 'region', lat: 51.4000, lng: 5.3000, clusterId: 'nb_kempen' },
  { id: 'nb-B', name: 'De Peel', provinceId: 'nb', type: 'region', lat: 51.5300, lng: 5.8500, clusterId: 'nb_peel' },
  { id: 'nb-C', name: 'Meierij', provinceId: 'nb', type: 'region', lat: 51.6500, lng: 5.4000, clusterId: 'nb_meierij' },
  { id: 'nb-D', name: 'Baronie van Breda', provinceId: 'nb', type: 'region', lat: 51.5500, lng: 4.8000, clusterId: 'nb_baronie' },

  // Wateren / rivieren
  { id: 'nb-I', name: 'Maas', provinceId: 'nb', type: 'water', lat: 51.7500, lng: 5.4500, clusterId: 'nb_meierij' },
  { id: 'nb-II', name: 'Dommel', provinceId: 'nb', type: 'water', lat: 51.5000, lng: 5.4500, clusterId: 'nb_kempen' },
  { id: 'nb-III', name: 'Aa', provinceId: 'nb', type: 'water', lat: 51.6000, lng: 5.6500, clusterId: 'nb_peel' },
  { id: 'nb-IV', name: 'Mark', provinceId: 'nb', type: 'water', lat: 51.5500, lng: 4.7000, clusterId: 'nb_baronie' },
  { id: 'nb-V', name: 'Donge', provinceId: 'nb', type: 'water', lat: 51.6500, lng: 4.8500, clusterId: 'nb_baronie' },
  { id: 'nb-VI', name: 'Zuid-Willemsvaart', provinceId: 'nb', type: 'water', lat: 51.5500, lng: 5.6500, clusterId: 'nb_peel' },
  { id: 'nb-VII', name: 'Wilhelminakanaal', provinceId: 'nb', type: 'water', lat: 51.5500, lng: 5.2000, clusterId: 'nb_kempen' },

  // --- WATEREN NEDERLAND ---
  { id: 'water-nl-1', name: 'Noordzeekanaal', provinceId: 'water-nl', type: 'water', lat: 52.4590, lng: 4.6420, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-2', name: 'Amsterdam-Rijnkanaal', provinceId: 'water-nl', type: 'water', lat: 52.0900, lng: 5.0550, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-3', name: 'Nieuwe Waterweg', provinceId: 'water-nl', type: 'water', lat: 51.9330, lng: 4.2110, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-4', name: 'Lek', provinceId: 'water-nl', type: 'water', lat: 51.9690, lng: 5.0270, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-5', name: 'Nederrijn', provinceId: 'water-nl', type: 'water', lat: 51.9590, lng: 5.5900, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-6', name: 'Waal', provinceId: 'water-nl', type: 'water', lat: 51.8580, lng: 5.5100, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-7', name: 'IJssel', provinceId: 'water-nl', type: 'water', lat: 52.1650, lng: 6.2050, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-8', name: 'Rijn', provinceId: 'water-nl', type: 'water', lat: 51.8500, lng: 6.1000, clusterId: 'water_nl_rivieren_kanalen' },
  { id: 'water-nl-9', name: 'Maas', provinceId: 'water-nl', type: 'water', lat: 51.3700, lng: 6.1650, clusterId: 'water_nl_rivieren_kanalen' },
  ...EUROPE_LOCATIONS,
  ...WORLD_LOCATIONS,
  ...POLE_LOCATIONS,
];
