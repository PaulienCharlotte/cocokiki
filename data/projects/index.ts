import type { CharacterId } from '../characters';
import { DECOR_PRODUCTS_BY_ID } from '../decorCatalog';
import { NURSERY_ITEMS, PROJECT_BUDGET } from './nursery';

/**
 * Inrichtopdrachten. Elke opdracht loopt hetzelfde: twee keer meten, kiezen
 * binnen een budget, narekenen wat het kost en wat je overhoudt, nog één
 * keer meten, en dan de kamer inrichten. Wat per kamer verschilt staat hier;
 * een nieuwe opdracht is een nieuw item in INRICHT_PROJECTEN.
 */
export interface InrichtItem { id: string; name: string; price: number; image: string; width: number; frame: readonly number[]; required: boolean; /** Hangt aan de muur: begint hoog in plaats van op de vloer. */ muur?: boolean }
export type Kaartje = { tekst: string; x: number; y: number; kleur?: 'zon' | 'wit' };
export interface MeetVraag { prompt: string; answer: number; unit: string; hint: string; valkuilen: number[]; kaartjes: Kaartje[]; meubels?: Array<{ id: string; x: number }> }
export interface InrichtProject {
  id: string; titel: string; onder: string; path: string; beeld: string;
  klant: CharacterId; kamer: string; budget: number;
  /** Wat de klant wil, in één zin; Lua zegt het bij de start. */
  wens: string; inrichtZin: string; klaarZin: string;
  items: readonly InrichtItem[];
  vragen: { height: MeetVraag; space: MeetVraag; rug: MeetVraag };
  /** Waar meubels moeten staan: links of rechts van het midden. */
  regels: Array<{ id: string; kant: 'links' | 'rechts' }>;
  /** Startplekken in de kamer, in procenten van links. */
  start: Record<string, number>;
  key: string; beloningPrefix: string;
  /** Vrij versieren: alles mag overal staan, ook hoog aan de muur, en overlappen mag. */
  vrij?: boolean;
  /** Aan het eind verkoop je je ontwerp aan de klant voor dit aantal CocoCoins. */
  verkoop?: number;
}

const heel = (w: number, h: number) => [0, 0, w, h, w, h] as const;
const decor = (id: string) => DECOR_PRODUCTS_BY_ID[id].image;

export const LUNA_PROJECT: InrichtProject = {
  id: 'luna', titel: 'Luna’s kamer', onder: 'Meten, kiezen en inrichten met een budget van 500.', path: '/opdrachten/luna-babykamer', beeld: '/assets/library/projects/luna-crib.webp',
  klant: 'luna', kamer: '/assets/library/treehouse/rooms/blush-front-v1.webp', budget: PROJECT_BUDGET,
  wens: 'Luna wil een knusse kamer: bed links, kast rechts. Help je meten, kiezen en inrichten?',
  inrichtZin: 'Sleep het bed naar links en de kast naar rechts.', klaarZin: 'Wat een fijne kamer!',
  items: NURSERY_ITEMS,
  vragen: {
    height: { prompt: 'Van vloer tot plafond is 260 cm. Hoeveel meter is dat?', answer: 2.6, unit: 'm', hint: '100 cm is 1 m. Deel 260 door 100: 2,6 m.', valkuilen: [26, 0.26, 260], kaartjes: [{ tekst: 'plafond ↕ 260 cm', x: 72, y: 38 }] },
    space: { prompt: 'De muur is 320 cm. Het bed is 120 cm en de kast 80 cm breed. Hoeveel cm blijft over?', answer: 120, unit: 'cm', hint: 'Het bed en de kast zijn samen 120 + 80 = 200 cm. 320 − 200 = 120 cm.', valkuilen: [200, 520, 80],
      kaartjes: [{ tekst: 'muur 320 cm', x: 50, y: 22, kleur: 'wit' }, { tekst: '120 cm', x: 28, y: 60 }, { tekst: '80 cm', x: 70, y: 62 }], meubels: [{ id: 'crib', x: 28 }, { id: 'dresser', x: 70 }] },
    rug: { prompt: 'Het bedje is 120 cm breed. Hoeveel meter is dat?', answer: 1.2, unit: 'm', hint: '100 cm is 1 m. Deel 120 door 100: 1,2 m.', valkuilen: [12, 0.12, 120], kaartjes: [{ tekst: '120 cm', x: 50, y: 58 }], meubels: [{ id: 'crib', x: 50 }] },
  },
  regels: [{ id: 'crib', kant: 'links' }, { id: 'dresser', kant: 'rechts' }],
  start: { crib: 28, dresser: 52, lamp: 73, shelf: 82, chair: 82 },
  key: 'cocokiki:project:luna-nursery:v1', beloningPrefix: 'nursery:v1',
};

export const KERST_PROJECT: InrichtProject = {
  id: 'kerst', titel: 'Coco’s kerstkamer', onder: 'Ontwerp een kerstkamer en verkoop je idee aan Coco.', path: '/opdrachten/kerstkamer', beeld: decor('christmas-japandi-tree'),
  klant: 'coco', kamer: '/assets/library/treehouse/rooms/living-room-front-v1.webp', budget: 400,
  wens: 'Coco zoekt een kerstidee voor haar woonkamer. Ontwerp jij het? Dan koopt ze het van je!',
  inrichtZin: 'Versier de kamer zoals jij het mooi vindt. Hang de ster en de krans gerust aan de muur.',
  klaarZin: 'Wat een prachtig kerstidee! Coco koopt het van je.',
  vrij: true, verkoop: 25,
  items: [
    { id: 'tree', name: 'Kerstboom', price: 85, image: decor('christmas-japandi-tree'), width: 17, frame: heel(1024, 1536), required: true },
    { id: 'gifts', name: 'Cadeautjes', price: 30, image: decor('christmas-wrapped-gifts'), width: 16, frame: heel(1536, 1024), required: true },
    { id: 'garland', name: 'Kerstslinger', price: 25, image: decor('christmas-felt-garland'), width: 26, frame: heel(2172, 724), required: false, muur: true },
    { id: 'wreath', name: 'Kerstkrans', price: 35, image: decor('christmas-fir-wreath'), width: 12, frame: heel(1536, 1024), required: false, muur: true },
    { id: 'star', name: 'Houten ster', price: 25, image: decor('christmas-oak-star'), width: 10, frame: heel(1312, 1199), required: false, muur: true },
    { id: 'lamp', name: 'Vloerlamp', price: 45, image: decor('japandi-paper-floor-lamp'), width: 8, frame: [219, 61, 584, 1430, 1024, 1536], required: false },
    { id: 'sofa', name: 'Linnen bank', price: 100, image: decor('japandi-linen-sofa'), width: 28, frame: heel(1774, 887), required: false },
    { id: 'chair', name: 'Leesstoel', price: 60, image: decor('armchair-clay-front'), width: 17, frame: [27, 52, 1257, 1107, 1312, 1199], required: false },
    { id: 'sideboard', name: 'Dressoir', price: 85, image: decor('japandi-oak-sideboard'), width: 25, frame: heel(1774, 887), required: false },
    { id: 'bookcase', name: 'Open kast', price: 75, image: decor('japandi-open-bookcase'), width: 13, frame: heel(1024, 1536), required: false },
  ],
  vragen: {
    height: { prompt: 'De kerstboom is 180 cm hoog. Hoeveel meter is dat?', answer: 1.8, unit: 'm', hint: '100 cm is 1 m. Deel 180 door 100: 1,8 m.', valkuilen: [18, 0.18, 180], kaartjes: [{ tekst: '180 cm', x: 30, y: 44 }], meubels: [{ id: 'tree', x: 30 }] },
    space: { prompt: 'De muur is 300 cm. De boom is 90 cm breed en de stoel 80 cm. Hoeveel cm blijft over?', answer: 130, unit: 'cm', hint: 'De boom en de stoel zijn samen 90 + 80 = 170 cm. 300 − 170 = 130 cm.', valkuilen: [170, 470, 80],
      kaartjes: [{ tekst: 'muur 300 cm', x: 50, y: 18, kleur: 'wit' }, { tekst: '90 cm', x: 26, y: 44 }, { tekst: '80 cm', x: 72, y: 58 }], meubels: [{ id: 'tree', x: 26 }, { id: 'chair', x: 72 }] },
    rug: { prompt: 'De kerstslinger is 24 dm lang. Hoeveel cm is dat?', answer: 240, unit: 'cm', hint: '1 dm is 10 cm. 24 × 10 = 240 cm.', valkuilen: [2.4, 24, 2400], kaartjes: [{ tekst: 'slinger 24 dm', x: 50, y: 30 }] },
  },
  regels: [],
  start: { tree: 20, gifts: 35, garland: 55, wreath: 75, star: 38, lamp: 80, sofa: 55, chair: 85, sideboard: 55, bookcase: 90 },
  key: 'cocokiki:project:kerstkamer:v1', beloningPrefix: 'kerst:v1',
};

export const INRICHT_PROJECTEN = [LUNA_PROJECT, KERST_PROJECT];
export const INRICHT_PROJECT_BY_ID: Record<string, InrichtProject> = Object.fromEntries(INRICHT_PROJECTEN.map(p => [p.id, p]));
export const projectVoorPad = (pad: string) => INRICHT_PROJECTEN.find(p => p.path === pad) ?? LUNA_PROJECT;
