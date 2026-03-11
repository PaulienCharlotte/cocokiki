
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!ai) {
    try {
      ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch {
      return null;
    }
  }
  return ai;
}

interface LocationData {
  mnemonic: string;
  fact: string;
  emoji: string;
}

// Volledige database voor Zuid-Holland
const FALLBACK_DATA: Record<string, LocationData> = {
  "Rotterdam": {
    emoji: "🚢",
    mnemonic: "Rotterdam heeft de grootste haven waar boten varen. 🚢",
    fact: "Wist je dat Rotterdam de grootste haven van Europa heeft? 🏗️ En kijk eens naar de Euromast, die is superhoog!"
  },
  "Den Haag": {
    emoji: "👑",
    mnemonic: "In Den Haag staat de troon van de koning heel graag. 👑",
    fact: "Hier woont onze Koning en werkt de regering. 🏛️ Het is de enige grote stad aan zee! 🌊"
  },
  "Delft": {
    emoji: "🏺",
    mnemonic: "In Delft zie je overal wit en blauw op de plank. 🎨",
    fact: "Deze stad is beroemd om het 'Delfts Blauw'. 🏺 Dat is prachtig wit aardewerk met blauwe tekeningen."
  },
  "Gouda": {
    emoji: "🧀",
    mnemonic: "Gouda is de stad van kaas en stroopwafels op je bord. 🧀",
    fact: "Kaaaaas! 🧀 Gouda staat wereldwijd bekend om de lekkere ronde kazen die daar vroeger op de markt werden verkocht. 🍪"
  },
  "Leiden": {
    emoji: "🔑",
    mnemonic: "In Leiden kun je door de oudste straatjes glijden. 🔑",
    fact: "Dit is een echte sleutelstad. 🔑 In Leiden staat ook de oudste universiteit van Nederland. 🎓"
  },
  "Dordrecht": {
    emoji: "🏘️",
    mnemonic: "Dordrecht is de oudste stad, vergeet dat niet! 🏘️",
    fact: "Dit is de oudste stad van Holland. 🏘️ Het ligt op een eiland en is omringd door water. 💧"
  },
  "Noordwijk (aan zee)": {
    emoji: "🚀",
    mnemonic: "In Noordwijk aan zee zie je de golven in de snee. 🏖️",
    fact: "Hier vind je niet alleen strand, maar ook de Space Expo! 🚀 Alles over raketten en de ruimte."
  },
  "Katwijk aan Zee": {
    emoji: "🏖️",
    mnemonic: "Kat-wijk aan zee, neem je emmertje mee. 🏖️",
    fact: "Katwijk heeft een supergroot strand en een heel bijzonder 'ondergronds' parkeergebouw in de duinen! 🚗"
  },
  "Kinderdijk": {
    emoji: "💨",
    mnemonic: "Molen op een rij, water aan de zij. 💨",
    fact: "Hier staan 19 prachtige molens op een rij die vroeger het water wegmaalden. 🏗️"
  },
  "Hoek van Holland": {
    emoji: "⚓",
    mnemonic: "Bij de Hoek varen boten om de koek. ⚓",
    fact: "Hier varen de allergrootste schepen de haven van Rotterdam binnen. ⛴️ Een soort poort naar de zee!"
  },
  "Goeree-Overflakkee (A)": {
    emoji: "🦭",
    mnemonic: "Op Goeree zie je de zee, dat is oké! 🏖️",
    fact: "Dit is een groot eiland waar je heerlijk kunt fietsen 🚴 en zelfs zeehonden kunt spotten in de buurt van de Brouwersdam! 🦭"
  },
  "Westland (B)": {
    emoji: "🍅",
    mnemonic: "In het Westland staan de kassen in een heel groot land. 🍅",
    fact: "Dit noemen we ook wel de 'Glazen Stad' omdat er duizenden kassen staan waar het hele jaar door tomaten, paprika's en bloemen groeien. 🪴"
  },
  "Haringvliet (I)": {
    emoji: "🦅",
    mnemonic: "Haring in het vliet, die zie je hier niet. 🐦",
    fact: "Vroeger was dit een zeearm met zout water, maar door de Deltawerken is het nu een prachtig gebied met veel rust en vogels. 🦅"
  },
  "Hollands Diep (II)": {
    emoji: "🌉",
    mnemonic: "Diep en breed, waar de schipper van weet. 🚢",
    fact: "Dit is een heel breed water waar veel grote schepen overheen varen op weg naar het zuiden van Europa. 🌉"
  },
  "Nieuwe Maas (III)": {
    emoji: "🏙️",
    mnemonic: "Maas langs de stad, wat een watervat. 🌉",
    fact: "Dit water stroomt midden door Rotterdam! 🏙️ Wist je dat de Erasmusbrug over dit water heen is gebouwd? 🌉"
  },
  "Schiedam": {
    emoji: "🧊",
    mnemonic: "Schiedam heeft de hoogste molens. 🏗️",
    fact: "Wist je dat in Schiedam de allerhoogste windmolens van de hele wereld staan! 🧊"
  },
  "Vlaardingen": {
    emoji: "🐟",
    mnemonic: "In Vlaardingen vingen ze vissen met de vleet. 🐟",
    fact: "Vlaardingen was vroeger dé haringstad van Nederland! Er kwamen honderden schepen met vis aan land. ⚓"
  },
  "Maassluis": {
    emoji: "⚓",
    mnemonic: "Maas-sluis, de boten varen naar huis. ⚓",
    fact: "Maassluis is een historische stad die vroeger erg belangrijk was voor de zeesleepvaart! ⛴️"
  },
  "Zoetermeer": {
    emoji: "⛷️",
    mnemonic: "Zoetermeer, daar skien we een keer. 🏙️",
    fact: "Vroeger was dit een klein dorpje, maar nu is het een grote stad met een echte skibaan! ⛷️"
  },
  "Alphen aan den Rijn": {
    emoji: "🦜",
    mnemonic: "Bij Alphen stroomt de Rijn. 🦜",
    fact: "Hier vind je vogelpark Avifauna, waar je duizenden bijzondere vogels kunt zien. 🦢"
  },
  "Wassenaar": {
    emoji: "🎢",
    mnemonic: "Wassenaar, daar staat Duinrell klaar. 🎢",
    fact: "In Wassenaar woonden vroeger de koning en koningin in villa Eikenhorst! 🏰"
  },
  "Spijkenisse": {
    emoji: "📚",
    mnemonic: "Spijkenisse bij de brug. 📚",
    fact: "De Boekenberg in Spijkenisse is een bibliotheek die eruitziet als een grote glazen berg vol boeken. ⛰️"
  },
  "Hellevoetsluis": {
    emoji: "⚓",
    mnemonic: "Sluis bij de zee. ⚓",
    fact: "Dit was vroeger een heel belangrijke haven voor de oorlogsschepen van Nederland. 🏰"
  },
  "Scheveningen": {
    emoji: "🎡",
    mnemonic: "Sch-even-ingen, visjes zingen. 🎡",
    fact: "Scheveningen is de beroemdste badplaats van Nederland met een enorme pier! 🏖️"
  },
  "Gorinchem": {
    emoji: "🏰",
    mnemonic: "Gor-in-chem, wees stil en stem. 🏰",
    fact: "Gorinchem is de mooiste vestingsstad van Nederland, je kunt er wandelen over de oude stadswallen! 🏰"
  },
  
  // --- FRIESLAND ---
  "Leeuwarden": {
    emoji: "🦁",
    mnemonic: "Een leeuw met een zwaard dat is wel wat waard! 🦁",
    fact: "Leeuwarden is de hoofdstad van Friesland en staat bekend om de scheve toren: de Oldehove! ⛪"
  },
  "Drachten": {
    emoji: "🎭",
    mnemonic: "Dracht-en, je hoeft niet op de kunst te wachten! 🎭",
    fact: "Drachten is de op één na grootste 'plaats' van Friesland, stiekem is het geen stad maar een heel groot dorp! 🏘️"
  },
  "Sneek": {
    emoji: "⛵",
    mnemonic: "In de Sneekweek, vaar je door de kreek! ⛵",
    fact: "Sneek is beroemd om de Waterpoort en het grote zeilfeest dat de 'Sneekweek' heet! 🚤"
  },
  "Heerenveen": {
    emoji: "⛸️",
    mnemonic: "Heren in het veen die schaatsen op één been. ⛸️",
    fact: "Hier ligt Thialf, het allergrootste en bekendste schaatsstadion van Nederland! 🧊"
  },
  "Harlingen": {
    emoji: "⛴️",
    mnemonic: "Harlingen is fris, hier vangen we een boel vis! 🐟",
    fact: "Harlingen is de belangrijkste havenstad van Friesland, vanaf hier varen de boten naar Terschelling en Vlieland! ⛴️"
  },
  "Dokkum": {
    emoji: "⛪",
    mnemonic: "In Dokkum stopten ze ermee, voor Bonifatius aan zee! ⛪",
    fact: "Dokkum is de noordelijkste stad van Nederland en bekend omdat lang geleden de heilige Bonifatius hier werd vermoord! ⚔️"
  },
  "Lemmer": {
    emoji: "🏖️",
    mnemonic: "Zwemmer, neem een duik in Lemmer! 🛟",
    fact: "Lemmer is een bekende watersportplaats en ligt direct aan het grote IJsselmeer! ⛵"
  },
  "Stavoren": {
    emoji: "🌾",
    mnemonic: "Sta van voren, kijk naar het vrouwtje van graan en koren! 🌾",
    fact: "In Stavoren staat een standbeeld van het 'Vrouwtje van Stavoren', een oud volksverhaal over een rijke koopmansvrouw. 👑"
  },
  "Franeker": {
    emoji: "🪐",
    mnemonic: "In de stad Franeker staan boeken in de grote kamer! 📚",
    fact: "In Franeker vind je het oudste werkende planetarium ter wereld, gemaakt door Eise Eisinga in z'n eigen woonkamer! 🌟"
  },
  "Bolsward": {
    emoji: "🚴",
    mnemonic: "Bols-ward is hard, speciaal op het kaatspart! 🎾",
    fact: "Bolsward is een oude handelsstad en staat bekend om de start van de 'Fietselfstedentocht'! 🚲"
  },
  "Joure": {
    emoji: "☕",
    mnemonic: "Jouw koffie krijg je puur in Joure! ☕",
    fact: "In Joure is Douwe Egberts ontstaan, hier werd vroeger de allereerste koffie gebrand! ☕"
  },
  "Wolvega": {
    emoji: "🐎",
    mnemonic: "De grote wolf die at heel snel in Wolvega. 🐺",
    fact: "Wolvega was vroeger heel beroemd om zijn paardenraces (draf- en rensport) op een grote zandbaan! 🐎"
  },
  "Appelscha": {
    emoji: "🌲",
    mnemonic: "Appels eten in de scha van het grote Drentse bos! 🍎",
    fact: "Appelscha ligt prachtig op de grens van Friesland en Drenthe en wordt omringd door enorme bossen! 🌲"
  },
  "Gaasterland": {
    emoji: "⛰️",
    mnemonic: "In het Gaasterland is zand voor iedereen charmant! 🏖️",
    fact: "Gaasterland is heel bijzonder in Friesland omdat het geen plat landschap is, maar juist heuvels met bossen heeft! 🌲"
  },
  "Vlieland": {
    emoji: "🦅",
    mnemonic: "Vlieg met je deken over het strand van Vlieland heen. 🦅",
    fact: "Vlieland is hét eiland met de grootste zandvlakte van Nederland, genaamd de 'Vliehors', waar militaire oefeningen zijn! 🪖"
  },
  "Terschelling": {
    emoji: "🔥",
    mnemonic: "Ter-schelling, hier klinkt een bel aan een grote lier. 🔔",
    fact: "Terschelling heeft de beroemde vuurtoren genaamd de Brandaris, dat is de oudste vuurtoren van heel Nederland! 🗼"
  },
  "Ameland": {
    emoji: "🚲",
    mnemonic: "Ame-land is fijn en ligt verborgen achter het schiereiland. 🏖️",
    fact: "Ameland heeft prachtige stranden en duinen, waar in het voorjaar duizenden vogels broeden! 🐦"
  },
  "Schiermonnikoog": {
    emoji: "🙏",
    mnemonic: "Schier-monnik-oog is stil en hoog, de vogels vliegen in de boog. 🙏",
    fact: "Dit was ooit een eiland waar monniken woonden (zij hadden 'schiere' oftewel grijze kleren aan)! Het is ook nog eens het kleinste waddeneiland! 🏝️"
  },
  "Waddenzee": {
    emoji: "🦭",
    mnemonic: "De Wad-den-zee is nat net als het theekopje in je schoot. ☕",
    fact: "Als de zee hier laag water is (eb), dan kun je letterlijk over de zeebodem wandelen ('wadlopen')! 🥾"
  },
  "Noordzee": {
    emoji: "🌊",
    mnemonic: "Noord-zee met golven zo breed als een matras! 🌊",
    fact: "De Noordzee zit vol met bijzondere dieren! Van kabeljauwen en haaien, tot zeehonden en makrelen. 🦈"
  },
  "IJsselmeer": {
    emoji: "🦆",
    mnemonic: "IJssel-meer hier is overal wel water als een beer. 🐻",
    fact: "Vroeger was dit meer nóg groter en zout. Toen de Afsluitdijk in 1932 gebouwd werd veranderde het langzaam in zacht, zoet water! 💧"
  },
  "Sneekermeer": {
    emoji: "🚤",
    mnemonic: "Sneeker-meer met bootjes in de nacht kletsnat als een veertje! 🪶",
    fact: "Het Sneekermeer is één van de belangrijkste watergebieden voor sportvissers en watersporters (denk aan zeilen & suppen)! 🎣"
  },
  "Fluessen": {
    emoji: "🦢",
    mnemonic: "De Flu-essen zit vol zwanen wit. 🦢",
    fact: "De Fluessen is na het Tjeukemeer het op één na grootste meer van Friesland, de bodem werd gevormd in de ijstijd! 🧊"
  },
  "Slotermeer": {
    emoji: "⛵",
    mnemonic: "Op het Sloter-meer vaar je heen en weer. ⛵",
    fact: "Dit meer is uniek omdat het bijna helemaal cirkelvormig is! ⭕"
  },
  "Tjeukemeer": {
    emoji: "💧",
    mnemonic: "Tjeuke-meer daar is zoveel te doen, de natuur zo groen! 🌲",
    fact: "Dit oppervlaktewater is zelfs het állergrootste natuurlijke binnenmeer in Friesland! En stiekem is het nergens heel diep! 🤿"
  }
};

const getCache = (key: string): string | null => {
  return localStorage.getItem(`topo_cache_${key}`);
};

const setCache = (key: string, value: string) => {
  localStorage.setItem(`topo_cache_${key}`, value);
};

export const getMnemonic = async (cityName: string): Promise<string> => {
  const cacheKey = `mnemonic_${cityName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (FALLBACK_DATA[cityName]) {
    return FALLBACK_DATA[cityName].mnemonic;
  }

  try {
    const client = getAI();
    if (!client) throw new Error('No API key');
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Geef een kort ezelsbruggetje voor de spelling van de Nederlandse topografische plek "${cityName}". Voor een kind van 9 jaar. Voeg 1 relevante emoji toe. Max 2 zinnen, geen markdown.`,
      config: { temperature: 0.5 }
    });

    const text = (response.text || "Oefen de letters van deze plek goed! ✍️").replace(/\*/g, '');
    setCache(cacheKey, text);
    return text;
  } catch (error: any) {
    return "Blijf de letters goed oefenen, je doet het super! ⭐";
  }
};

export const getFunFact = async (location: string): Promise<{ text: string, emoji: string }> => {
  const cacheKey = `fact_v2_${location}`;
  const cached = getCache(cacheKey);

  if (FALLBACK_DATA[location]) {
    return {
      text: FALLBACK_DATA[location].fact,
      emoji: FALLBACK_DATA[location].emoji
    };
  }

  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const client = getAI();
    if (!client) throw new Error('No API key');
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Vertel een leuk feitje over ${location} voor een kind van 9. Gebruik 1 of 2 emoji's. Kort, geen markdown.`,
      config: { temperature: 0.6 }
    });

    const text = (response.text || "Dit is een bijzondere plek in Nederland! ✨").replace(/\*/g, '');
    const result = { text, emoji: "📍" };
    setCache(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    return {
      text: "Wist je dat deze plek heel erg belangrijk is voor onze geschiedenis? 📚",
      emoji: "📍"
    };
  }
};
