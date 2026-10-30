import { Bath, BedDouble, Sofa, CookingPot, Flower2, BookOpen, Palette, Music, Gamepad2, Sprout, Telescope, Heart } from 'lucide-react';

export const ROOM_ICONS = [
  { id: 'sofa', label: 'Woonkamer', Icon: Sofa },
  { id: 'pot', label: 'Keuken', Icon: CookingPot },
  { id: 'bath', label: 'Badkamer', Icon: Bath },
  { id: 'bed', label: 'Slaapkamer', Icon: BedDouble },
  { id: 'flower', label: 'Terras', Icon: Flower2 },
  { id: 'book', label: 'Lezen', Icon: BookOpen },
  { id: 'paint', label: 'Tekenen', Icon: Palette },
  { id: 'music', label: 'Muziek', Icon: Music },
  { id: 'game', label: 'Spelen', Icon: Gamepad2 },
  { id: 'plant', label: 'Planten', Icon: Sprout },
  { id: 'stars', label: 'Sterren', Icon: Telescope },
  { id: 'heart', label: 'Favoriet', Icon: Heart },
] as const;
export type RoomIconId = typeof ROOM_ICONS[number]['id'];
