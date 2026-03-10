
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
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
    const response = await ai.models.generateContent({
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
