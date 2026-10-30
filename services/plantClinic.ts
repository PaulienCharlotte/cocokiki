import { PATIENT_KINDS, maakGeval, type Geval } from '../data/plants/clinic';
import { PLANT_SPECIES_BY_ID } from '../data/plants/species';
import { commitLocalState, readDocument } from './localState';
import { learningReward } from './learningReward';

export const PLANT_CLINIC_KEY = 'cocokiki:plant-clinic:v1';
export const PLANT_CLINIC_CHANGE_EVENT = 'cocokiki:plant-clinic-change';

/** Zoveel goede diagnoses verdient de stempel van een soort. */
export const STAMPS_NEEDED = 3;

export interface ClinicState {
  version: 1;
  /** Per soort het aantal goede diagnoses. */
  correct: Record<string, number>;
  /** Afgeronde consulten, zodat eenzelfde beloning niet twee keer telt. */
  appliedConsults: string[];
  /** Hoeveel planten er in totaal geholpen zijn. */
  helped: number;
}

export function createEmptyClinic(): ClinicState {
  return { version: 1, correct: {}, appliedConsults: [], helped: 0 };
}

export function migrateClinic(value: unknown): ClinicState {
  const leeg = createEmptyClinic();
  if (!value || typeof value !== 'object') return leeg;
  const parsed = value as Partial<ClinicState>;
  if (parsed.version !== 1) return leeg;
  const correct: Record<string, number> = {};
  for (const [id, aantal] of Object.entries(parsed.correct ?? {})) {
    // Onbekende soorten en onzinnige aantallen horen hier niet.
    if (PLANT_SPECIES_BY_ID[id] && Number.isInteger(aantal) && aantal > 0) correct[id] = Math.min(99, aantal);
  }
  return {
    ...leeg,
    correct,
    appliedConsults: Array.isArray(parsed.appliedConsults)
      ? [...new Set(parsed.appliedConsults.filter((id): id is string => typeof id === 'string'))].slice(-200)
      : [],
    helped: Number.isInteger(parsed.helped) && parsed.helped! > 0 ? parsed.helped! : 0,
  };
}

export function loadClinic(): ClinicState {
  try {
    return migrateClinic(JSON.parse(readDocument(PLANT_CLINIC_KEY) ?? 'null'));
  } catch {
    return createEmptyClinic();
  }
}

export function saveClinic(state: ClinicState): boolean {
  try {
    if (commitLocalState({ [PLANT_CLINIC_KEY]: JSON.stringify(state) }).status !== 'applied') return false;
    window.dispatchEvent(new CustomEvent(PLANT_CLINIC_CHANGE_EVENT, { detail: state }));
    return true;
  } catch {
    return false;
  }
}

export interface Patient extends Geval {
  /** Eigen nummer van dit consult, zodat de beloning maar één keer telt. */
  consultId: string;
}

/**
 * Kies de volgende patiënt. Soorten die nog geen stempel hebben komen eerst,
 * zodat een kind niet tien keer dezelfde plant krijgt terwijl de rest wacht.
 */
export function nextPatient(
  state: ClinicState,
  kiesGetal: () => number = Math.random,
  makeId: () => string = () => crypto.randomUUID(),
): Patient | null {
  if (PATIENT_KINDS.length === 0) return null;
  const nogGeenStempel = PATIENT_KINDS.filter(kind => (state.correct[kind.speciesId] ?? 0) < STAMPS_NEEDED);
  const keuze = nogGeenStempel.length > 0 ? nogGeenStempel : PATIENT_KINDS;
  const index = Math.min(keuze.length - 1, Math.max(0, Math.floor(kiesGetal() * keuze.length)));
  // De omstandigheden horen bij het consult, niet bij de soort: dezelfde plant
  // kan de ene keer bij de verwarming staan en de andere keer in de hoek.
  return { ...maakGeval(keuze[index], kiesGetal), consultId: makeId() };
}

export interface ConsultResult {
  state: ClinicState;
  /** Munten die dit consult oplevert. */
  coins: number;
  /** Heeft deze soort nu net zijn stempel verdiend? */
  stampEarned: boolean;
}

/**
 * Denkstappen en herkansingen verlagen de gedeelde leerbeloning niet.
 */
export function finishConsult(
  state: ClinicState,
  patient: Patient,
  mistakes: number,
  hintUsed: boolean,
): ConsultResult {
  if (state.appliedConsults.includes(patient.consultId)) {
    return { state, coins: 0, stampEarned: false };
  }
  const eerder = state.correct[patient.speciesId] ?? 0;
  const nu = eerder + 1;
  const coins = learningReward();
  return {
    state: {
      ...state,
      correct: { ...state.correct, [patient.speciesId]: Math.min(99, nu) },
      appliedConsults: [...state.appliedConsults, patient.consultId].slice(-200),
      helped: state.helped + 1,
    },
    coins,
    stampEarned: eerder < STAMPS_NEEDED && nu >= STAMPS_NEEDED,
  };
}

/** Heeft deze soort zijn stempel al? */
export function hasStamp(state: ClinicState, speciesId: string): boolean {
  return (state.correct[speciesId] ?? 0) >= STAMPS_NEEDED;
}

/** Hoeveel soorten er in het paspoort kunnen staan en hoeveel er al in staan. */
export function passportProgress(state: ClinicState): { earned: number; total: number } {
  const soorten = [...new Set(PATIENT_KINDS.map(kind => kind.speciesId))];
  return { earned: soorten.filter(id => hasStamp(state, id)).length, total: soorten.length };
}
