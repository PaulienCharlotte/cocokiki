export type DestinationId = 'treehouse' | 'travel' | 'shop';

export interface DestinationDefinition {
  id: DestinationId;
  path: `/${DestinationId}`;
  title: string;
  eyebrow: string;
  description: string;
  tone: 'sage' | 'sky' | 'peach' | 'lilac' | 'honey';
  illustration?: string;
  background?: string;
  backgroundAlt?: string;
  status: 'available' | 'coming-soon';
}

export const DESTINATIONS: DestinationDefinition[] = [
  {
    id: 'treehouse',
    path: '/treehouse',
    title: 'Mijn boomhut',
    eyebrow: 'Mijn plek',
    description: 'Bekijk later je verzamelingen, prestaties en ontdekkingen.',
    tone: 'sage',
    illustration: '/games/treehouse/world-v2/treehouse-central-cutout.webp',
    status: 'available',
  },
  {
    id: 'travel',
    path: '/travel',
    title: 'Reizen',
    eyebrow: 'Aardrijkskunde',
    description: 'Ontdek kaarten, plaatsen, gebieden en wateren.',
    tone: 'sky',
    illustration: '/games/treehouse/world-v2/island-topo-cutout.webp',
    background: '/games/destinations/travel-room.webp',
    backgroundAlt: 'Een lichte reiskamer met een wereldbol, kaarten en uitzicht op beroemde plekken',
    status: 'available',
  },
  {
    id: 'shop',
    path: '/shop',
    title: 'Winkel',
    eyebrow: 'Binnenkort',
    description: 'Een toekomstige plek voor ingrediënten en uitrusting.',
    tone: 'honey',
    background: '/games/destinations/shop-interior.webp',
    backgroundAlt: 'Een gezellige winkel vol potjes, groente, fruit en houten toonbanken',
    status: 'coming-soon',
  },
];

export const DESTINATIONS_BY_ID = Object.fromEntries(
  DESTINATIONS.map(destination => [destination.id, destination]),
) as Record<DestinationId, DestinationDefinition>;
