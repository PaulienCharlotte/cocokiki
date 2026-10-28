import { PLANT_SPECIES, type PlantSpecies } from '../data/plants/species';
import { reconcilePlantFamily, type PlantFamilyState } from './plantFamily';
import { loadClinic, STAMPS_NEEDED, type ClinicState } from './plantClinic';

/**
 * Hoeveel een kind van een plant weet.
 *
 * De encyclopedie vult zich door te spelen, niet door te studeren: je krijgt
 * een pagina door een plant in huis te halen, je vult hem door voor hem te
 * zorgen, en je maakt hem compleet door hem in het spreekuur te herkennen.
 */
export type KnowledgeLevel = 0 | 1 | 2 | 3;

export const KNOWLEDGE_LABEL: Record<KnowledgeLevel, string> = {
  0: 'Nog niet ontdekt',
  1: 'In huis gehaald',
  2: 'Zelf verzorgd',
  3: 'Compleet',
};

/** Wat je bij dit niveau te zien krijgt. */
export const KNOWLEDGE_HINT: Record<KnowledgeLevel, string> = {
  0: '',
  1: 'Zorg een keer voor deze plant om te zien wat hij nodig heeft.',
  2: 'Herken hem drie keer in het spreekuur voor zijn stempel.',
  3: '',
};

export interface PlantKnowledge {
  species: PlantSpecies;
  level: KnowledgeLevel;
  /** Hoe vaak hij al goed herkend is in het spreekuur. */
  diagnoses: number;
}

/**
 * Het niveau van één soort.
 *
 * In huis: je hebt er minstens één geadopteerd. Verzorgd: je hebt hem water
 * gegeven, of je hebt hem al eens goed gediagnosticeerd. Compleet: de stempel.
 */
export function levelFor(speciesId: string, family: PlantFamilyState, clinic: ClinicState): KnowledgeLevel {
  const diagnoses = clinic.correct[speciesId] ?? 0;
  if (diagnoses >= STAMPS_NEEDED) return 3;
  const eigen = family.plants.filter(plant => plant.speciesId === speciesId);
  const verzorgd = diagnoses > 0 || eigen.some(plant => Boolean(plant.lastWateredAt));
  if (verzorgd && (eigen.length > 0 || diagnoses > 0)) return 2;
  if (eigen.length > 0) return 1;
  return 0;
}

/** Alle soorten met hun niveau, de verst gevorderde bovenaan. */
export function plantKnowledge(
  family: PlantFamilyState = reconcilePlantFamily(),
  clinic: ClinicState = loadClinic(),
): PlantKnowledge[] {
  return PLANT_SPECIES
    .map(species => ({ species, level: levelFor(species.id, family, clinic), diagnoses: clinic.correct[species.id] ?? 0 }))
    .sort((a, b) => b.level - a.level || a.species.commonName.localeCompare(b.species.commonName, 'nl'));
}

/** Hoeveel pagina's er open staan en hoeveel er compleet zijn. */
export function knowledgeProgress(paginas: PlantKnowledge[]): { open: number; compleet: number; totaal: number } {
  return {
    open: paginas.filter(item => item.level > 0).length,
    compleet: paginas.filter(item => item.level === 3).length,
    totaal: paginas.length,
  };
}
