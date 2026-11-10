/**
 * Het taartenatelier: wat er op tafel staat en wat een kind ervan maakt.
 *
 * Een ontwerp bewaart geen pixels van de versieringen, maar waar ze staan.
 * Daardoor kun je een taart later openen en verder bewerken, en blijft alles
 * op zijn plek als het scherm een andere maat heeft.
 */

export interface TaartBodem {
  id: string;
  naam: string;
  beeld: string;
}

/** Waar een versiering bij hoort in de bibliotheek. */
export type VersieringSoort = 'slagroom' | 'fruit' | 'snoep' | 'chocolade' | 'versiering';

export interface Versiering {
  id: string;
  naam: string;
  soort: VersieringSoort;
  /** Breedte gedeeld door hoogte, zodat schalen niet vervormt. */
  verhouding: number;
  beeld: string;
}

/** Eén versiering die op de taart ligt. */
export interface GeplaatsteVersiering {
  /** Uniek binnen dit ontwerp. */
  id: string;
  versieringId: string;
  /** Midden van de versiering, 0 tot 1 ten opzichte van het taartvlak. */
  x: number;
  y: number;
  /** 0.25 tot 2. De breedte is dit maal een vaste basismaat. */
  schaal: number;
  /** Graden, met de klok mee. */
  draai: number;
}

export interface TaartOntwerp {
  versie: 1;
  bodemId: string;
  /** De tekenlaag als afbeelding, of null als er nog niet getekend is. */
  tekening: string | null;
  versieringen: GeplaatsteVersiering[];
  /** Kleine afbeelding van het geheel, voor op de kaart. */
  voorbeeld: string | null;
  bewerktOp: string;
}

export type Penseel = 'lijn' | 'spuitzak' | 'stippen' | 'gum';
export type Dikte = number;
