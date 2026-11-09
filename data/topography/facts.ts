import { LOCATIONS, PROVINCES } from '../../constants';
import { LOCATION_FACTS, LocationFact } from '../locationFacts';
import { Location } from '../../types';

/** Aanvulling op de centrale weetjes; bestaande teksten blijven behouden. */
export const GEOBAS_FACTS: Record<string, string> = {
  Parijs: 'Parijs is de hoofdstad van Frankrijk. De Eiffeltoren staat hier en de Seine stroomt door de stad.',
  Lissabon: 'Lissabon is de hoofdstad van Portugal. De stad ligt aan de Taag, vlak bij de Atlantische Oceaan.',
  Madrid: 'Madrid is de hoofdstad van Spanje. De stad ligt midden in het land, ver van de zee.',
  'Le Havre': 'Le Havre is een havenstad aan de noordkust van Frankrijk, bij de monding van de Seine.',
  Reims: 'Reims ligt in het noordoosten van Frankrijk. Je vindt er een grote, oude kathedraal.',
  Dijon: 'Dijon ligt in het oosten van Frankrijk. De stad is bekend om mosterd.',
  Lyon: 'In Lyon komen twee rivieren bij elkaar: de Rhône en de Saône. De stad ligt in het oosten van Frankrijk.',
  Marseille: 'Marseille is een havenstad aan de Middellandse Zee, in het zuiden van Frankrijk.',
  Nice: 'Nice ligt aan de Middellandse Zee. Het kleine land Monaco ligt iets verder naar het oosten.',
  Toulouse: 'Toulouse wordt de roze stad genoemd. Dat komt door de roodroze bakstenen van veel gebouwen.',
  Bordeaux: 'Bordeaux ligt aan de Garonne in het zuidwesten van Frankrijk. Via de rivier kunnen schepen richting zee varen.',
  Bilbao: 'Bilbao ligt in het noorden van Spanje, dicht bij de Atlantische kust. Hier staat het Guggenheim Museum.',
  Barcelona: 'Barcelona ligt aan de Middellandse Zee, in het noordoosten van Spanje. Je vindt er de beroemde Sagrada Família.',
  Valencia: 'Valencia ligt aan de oostkust van Spanje. De rijstmaaltijd paella komt uit deze streek.',
  Malaga: 'Malaga ligt aan de zuidkust van Spanje, aan de Middellandse Zee. De stad hoort bij de Costa del Sol.',
  Gibraltar: 'Gibraltar ligt op de zuidpunt van het Iberisch Schiereiland. Aan de overkant van de zeestraat ligt Afrika.',
  Sevilla: 'Sevilla ligt in het zuiden van Spanje, aan de rivier de Guadalquivir. De stad ligt niet direct aan zee.',
  Porto: 'Porto ligt aan de Douro in het noorden van Portugal. De rivier stroomt hier naar de Atlantische Oceaan.',
  Straatsburg: 'Straatsburg ligt in het oosten van Frankrijk, vlak bij de Duitse grens. De Rijn stroomt langs die grens.',
  Mallorca: 'Mallorca is een Spaans eiland in de Middellandse Zee. Het hoort bij de eilandengroep de Balearen.',
  Corsica: 'Corsica is een Frans eiland in de Middellandse Zee. Ten zuiden ervan ligt het Italiaanse eiland Sardinië.',
  Seine: 'De Seine stroomt door Parijs en mondt bij Le Havre uit in het Kanaal, dat met de Atlantische Oceaan verbonden is.',
  Rhône: 'De Rhône stroomt vanuit Zwitserland door het zuidoosten van Frankrijk naar de Middellandse Zee.',
  'Atlantische Oceaan': 'De Atlantische Oceaan ligt ten westen van Frankrijk, Spanje en Portugal. Aan de andere kant ligt Amerika.',
  'Middellandse Zee': 'De Middellandse Zee ligt tussen Europa en Afrika. Bij Gibraltar is de zee verbonden met de Atlantische Oceaan.',
  Pyreneeën: 'De Pyreneeën vormen een bergketen tussen Frankrijk en Spanje. Het kleine land Andorra ligt in deze bergen.',
  Alpen: 'De Alpen liggen in meerdere Europese landen. Ook het oosten van Frankrijk hoort bij dit berggebied.',
  Grenoble: 'Grenoble ligt in het zuidoosten van Frankrijk, in de Alpen. Rond de stad zie je hoge bergen.',
  Lille: 'Lille ligt helemaal in het noorden van Frankrijk, dicht bij de grens met België.',
};

/** Iedere selecteerbare plek krijgt informatie; een ontbrekend weetje verbergt de kaart niet. */
export function locationFact(location: Location): LocationFact {
  const existing = LOCATION_FACTS[location.name];
  if (existing?.fact) return existing;
  if (GEOBAS_FACTS[location.name]) return { fact: GEOBAS_FACTS[location.name], emoji: '' };
  const country = location.isCapital ? LOCATIONS.find(item => item.id === location.id.replace(/^cap-/, '') && item.type === 'country') : undefined;
  const capital = location.type === 'country' ? LOCATIONS.find(item => item.id === `cap-${location.id}`) : undefined;
  if (country) return { fact: `${location.name} is de hoofdstad van ${country.name}. Een hoofdstad is de stad waar meestal de regering van een land werkt.`, emoji: '' };
  if (capital) return { fact: `${capital.name} is de hoofdstad van ${location.name}. Zoek het land en de hoofdstad eens naast elkaar op de kaart.`, emoji: '' };
  const area = PROVINCES.find(item => item.id === location.provinceId);
  if (location.type === 'city' && area && !area.isStudyArea) return { fact: `${location.name} ligt in de provincie ${area.name}. Een provincie bestaat uit meerdere plaatsen en gemeenten.`, emoji: '' };
  if (location.type === 'province' && area?.capital) return { fact: `${area.capital} is de hoofdstad van de provincie ${location.name}.`, emoji: '' };
  const text = location.type === 'water' ? 'Wateren zoals rivieren, meren en zeeën verbinden gebieden met elkaar. Ze zijn belangrijk voor dieren, planten en mensen.'
    : location.type === 'country' ? 'Een land heeft grenzen met andere landen of met de zee. Op de kaart kun je ontdekken welke landen ernaast liggen.'
    : location.type === 'mountain' ? 'Berggebieden liggen hoger dan hun omgeving. Rivieren beginnen vaak hoog in de bergen.'
    : location.type === 'city' ? `Je vindt ${location.name} op deze kaart${area ? ` van ${area.name}` : ''}. Met de kust en de omringende plaatsen kun je de ligging onthouden.`
    : 'Een gebied is een deel van een land of van de wereld. Sommige gebieden lopen over landsgrenzen heen.';
  return { fact: text, emoji: '' };
}
