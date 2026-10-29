import type { MemoryPair } from './learning';
import { nextBatch, type Progress } from '../services/localProgress';

export type FlagContinent = 'europe' | 'africa' | 'asia' | 'north-america' | 'south-america' | 'oceania';
export const FLAG_CONTINENTS: Array<{ id: FlagContinent; label: string }> = [
  { id: 'europe', label: 'Europa' }, { id: 'africa', label: 'Afrika' },
  { id: 'asia', label: 'Azië' }, { id: 'north-america', label: 'Noord-Amerika' },
  { id: 'south-america', label: 'Zuid-Amerika' }, { id: 'oceania', label: 'Oceanië' },
];

// Geografische indeling: https://unstats.un.org/unsd/methodology/m49/
// Kosovo en Taiwan zijn ook opgenomen. Grenslanden staan maar in één groep.
const COUNTRIES: Record<FlagContinent, Array<[string, string]>> = {
  europe: [
    ['Albanië','AL'], ['Andorra','AD'], ['Oostenrijk','AT'], ['Wit-Rusland','BY'], ['België','BE'],
    ['Bosnië en Herzegovina','BA'], ['Bulgarije','BG'], ['Kroatië','HR'], ['Tsjechië','CZ'], ['Denemarken','DK'],
    ['Estland','EE'], ['Finland','FI'], ['Frankrijk','FR'], ['Duitsland','DE'], ['Griekenland','GR'],
    ['Hongarije','HU'], ['IJsland','IS'], ['Ierland','IE'], ['Italië','IT'], ['Kosovo','XK'],
    ['Letland','LV'], ['Liechtenstein','LI'], ['Litouwen','LT'], ['Luxemburg','LU'], ['Malta','MT'],
    ['Moldavië','MD'], ['Monaco','MC'], ['Montenegro','ME'], ['Nederland','NL'], ['Noord-Macedonië','MK'],
    ['Noorwegen','NO'], ['Polen','PL'], ['Portugal','PT'], ['Roemenië','RO'], ['Rusland','RU'],
    ['San Marino','SM'], ['Servië','RS'], ['Slowakije','SK'], ['Slovenië','SI'], ['Spanje','ES'],
    ['Zweden','SE'], ['Zwitserland','CH'], ['Oekraïne','UA'], ['Verenigd Koninkrijk','GB'], ['Vaticaanstad','VA'],
  ],
  africa: [
    ['Algerije','DZ'], ['Angola','AO'], ['Benin','BJ'], ['Botswana','BW'], ['Burkina Faso','BF'],
    ['Burundi','BI'], ['Kaapverdië','CV'], ['Kameroen','CM'], ['Centraal-Afrikaanse Republiek','CF'], ['Tsjaad','TD'],
    ['Comoren','KM'], ['Congo-Brazzaville','CG'], ['Congo-Kinshasa','CD'], ['Djibouti','DJ'], ['Egypte','EG'],
    ['Equatoriaal-Guinea','GQ'], ['Eritrea','ER'], ['Eswatini','SZ'], ['Ethiopië','ET'], ['Gabon','GA'],
    ['Gambia','GM'], ['Ghana','GH'], ['Guinee','GN'], ['Guinee-Bissau','GW'], ['Ivoorkust','CI'],
    ['Kenia','KE'], ['Lesotho','LS'], ['Liberia','LR'], ['Libië','LY'], ['Madagaskar','MG'],
    ['Malawi','MW'], ['Mali','ML'], ['Mauritanië','MR'], ['Mauritius','MU'], ['Marokko','MA'],
    ['Mozambique','MZ'], ['Namibië','NA'], ['Niger','NE'], ['Nigeria','NG'], ['Rwanda','RW'],
    ['Sao Tomé en Principe','ST'], ['Senegal','SN'], ['Seychellen','SC'], ['Sierra Leone','SL'], ['Somalië','SO'],
    ['Zuid-Afrika','ZA'], ['Zuid-Soedan','SS'], ['Soedan','SD'], ['Tanzania','TZ'], ['Togo','TG'],
    ['Tunesië','TN'], ['Oeganda','UG'], ['Zambia','ZM'], ['Zimbabwe','ZW'],
  ],
  asia: [
    ['Afghanistan','AF'], ['Armenië','AM'], ['Azerbeidzjan','AZ'], ['Bahrein','BH'], ['Bangladesh','BD'],
    ['Bhutan','BT'], ['Brunei','BN'], ['Cambodja','KH'], ['China','CN'], ['Cyprus','CY'],
    ['Georgië','GE'], ['India','IN'], ['Indonesië','ID'], ['Iran','IR'], ['Irak','IQ'],
    ['Israël','IL'], ['Japan','JP'], ['Jordanië','JO'], ['Kazachstan','KZ'], ['Koeweit','KW'],
    ['Kirgizië','KG'], ['Laos','LA'], ['Libanon','LB'], ['Maleisië','MY'], ['Maldiven','MV'],
    ['Mongolië','MN'], ['Myanmar','MM'], ['Nepal','NP'], ['Noord-Korea','KP'], ['Oman','OM'],
    ['Pakistan','PK'], ['Palestina','PS'], ['Filipijnen','PH'], ['Qatar','QA'], ['Saoedi-Arabië','SA'],
    ['Singapore','SG'], ['Zuid-Korea','KR'], ['Sri Lanka','LK'], ['Syrië','SY'], ['Taiwan','TW'],
    ['Tadzjikistan','TJ'], ['Thailand','TH'], ['Oost-Timor','TL'], ['Turkije','TR'], ['Turkmenistan','TM'],
    ['Verenigde Arabische Emiraten','AE'], ['Oezbekistan','UZ'], ['Vietnam','VN'], ['Jemen','YE'],
  ],
  'north-america': [
    ['Antigua en Barbuda','AG'], ["Bahama's",'BS'], ['Barbados','BB'], ['Belize','BZ'], ['Canada','CA'],
    ['Costa Rica','CR'], ['Cuba','CU'], ['Dominica','DM'], ['Dominicaanse Republiek','DO'], ['El Salvador','SV'],
    ['Grenada','GD'], ['Guatemala','GT'], ['Haïti','HT'], ['Honduras','HN'], ['Jamaica','JM'],
    ['Mexico','MX'], ['Nicaragua','NI'], ['Panama','PA'], ['Saint Kitts en Nevis','KN'], ['Saint Lucia','LC'],
    ['Saint Vincent en de Grenadines','VC'], ['Trinidad en Tobago','TT'], ['Verenigde Staten','US'],
  ],
  'south-america': [
    ['Argentinië','AR'], ['Bolivia','BO'], ['Brazilië','BR'], ['Chili','CL'], ['Colombia','CO'], ['Ecuador','EC'],
    ['Guyana','GY'], ['Paraguay','PY'], ['Peru','PE'], ['Suriname','SR'], ['Uruguay','UY'], ['Venezuela','VE'],
  ],
  oceania: [
    ['Australië','AU'], ['Fiji','FJ'], ['Kiribati','KI'], ['Marshalleilanden','MH'], ['Micronesië','FM'],
    ['Nauru','NR'], ['Nieuw-Zeeland','NZ'], ['Palau','PW'], ['Papoea-Nieuw-Guinea','PG'], ['Samoa','WS'],
    ['Salomonseilanden','SB'], ['Tonga','TO'], ['Tuvalu','TV'], ['Vanuatu','VU'],
  ],
};

export const FLAG_COUNTRIES = FLAG_CONTINENTS.flatMap(({ id }) => COUNTRIES[id].map(([name, code]) => ({
  name, code, continent: id,
  flag: String.fromCodePoint(...Array.from(code, letter => 0x1F1E6 + letter.charCodeAt(0) - 65)),
})));
export const FLAG_MEMORY_PAIRS: MemoryPair[] = FLAG_COUNTRIES.map(country => ({ id: `flag:${country.name}`, left: country.name, right: country.flag, kind: 'flag' }));

export function continentFlagPairs(continent: FlagContinent): MemoryPair[] {
  const names = new Set(FLAG_COUNTRIES.filter(country => country.continent === continent).map(country => country.name));
  return FLAG_MEMORY_PAIRS.filter(pair => names.has(pair.left));
}

export function nextFlagRound(continent: FlagContinent, progress: Progress): MemoryPair[] {
  return nextBatch(continentFlagPairs(continent), 6, progress, pair => pair.id);
}
