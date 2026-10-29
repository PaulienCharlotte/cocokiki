import { FLAG_COUNTRIES } from './flagCatalog';

export const COUNTRY_FLAGS: Record<string, string> = Object.fromEntries(FLAG_COUNTRIES.map(country => [country.name, country.flag]));
