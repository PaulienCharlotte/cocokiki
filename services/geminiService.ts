
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

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
  "Groningen": {
    emoji: "⛪",
    mnemonic: "Groningen is de stad waar we de Martinitoren begroeten. ⛪",
    fact: "In Groningen staat de Martinitoren, die door de mensen daar 'D'Olle Grieze' (De Oude Grijze) wordt genoemd! ⛪"
  },
  "Assen": {
    emoji: "🏍️",
    mnemonic: "In Assen laten de motors hun kracht vlassen. 🏍️",
    fact: "Assen is wereldberoemd om de TT! Dat is een grote motorrace waar de snelste coureurs ter wereld rijden. 🏁"
  },
  "Zwolle": {
    emoji: "🧂",
    mnemonic: "In Zwolle luiden de klokken met veel lolle. 🧂",
    fact: "In Zwolle staat de 'Peperbus', een grote kerktoren die eruitziet als... jawel, een peperbus! 🧂"
  },
  "Arnhem": {
    emoji: "🦁",
    mnemonic: "Arnhem heeft de dieren in de kooien van de zon. 🦁",
    fact: "Hier vind je Burgers' Zoo, een van de mooiste dierentuinen van Nederland met een echte 'Bush' en 'Desert'! 🌵"
  },
  "Lelystad": {
    emoji: "🚢",
    mnemonic: "Lelystad is gebouwd op de bodem van de zee. 🌊",
    fact: "Lelystad ligt in Flevoland, een provincie die vroeger helemaal onder water stond! Nu staat er een replica van een echt VOC-schip. ⚓"
  },
  "Utrecht": {
    emoji: "⛪",
    mnemonic: "In Utrecht staat de Dom, daar kom je niet omheen! ⛪",
    fact: "De Domtoren in Utrecht is de hoogste kerktoren van Nederland. Je moet meer dan 400 treden klimmen om boven te komen! 🧗"
  },
  "Haarlem": {
    emoji: "🌷",
    mnemonic: "Haarlem is de stad van bloemen en mooie hofjes. 🌷",
    fact: "Haarlem wordt ook wel 'Bloemenstad' genoemd omdat het midden in de bollenstreek ligt. Je vindt er ook prachtige verborgen binnentuintjes. 🏡"
  },
  "Middelburg": {
    emoji: "⛪",
    mnemonic: "Middelburg is het hart van Zeeland aan de kust. 🌊",
    fact: "Middelburg heeft een prachtige abdij en een heel hoge toren die de 'Lange Jan' wordt genoemd! ⛪"
  },
  "’s-Hertogenbosch": {
    emoji: "😋",
    mnemonic: "In Den Bosch eet je een bol die niemand kon. 🍩",
    fact: "Deze stad is beroemd om de 'Bossche Bol', een enorme soes gevuld met slagroom en een dikke laag chocolade. Jammie! 😋"
  },
  "Maastricht": {
    emoji: "⛰️",
    mnemonic: "In Maastricht vieren we carnaval met veel gepraat. 🎭",
    fact: "Dit is een van de oudste steden van Nederland. Onder de grond zijn kilometers lange gangen gegraven in de mergelberg! ⛰️"
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
  },

  // --- GELDERLAND ---
  "Nijmegen": {
    emoji: "🏛️",
    mnemonic: "Nij-me-gen, de oudste stad die je ooit zult zien! 🏛️",
    fact: "Nijmegen is de oudste stad van Nederland! De Romeinen bouwden er al meer dan 2000 jaar geleden een grote legerplaats. 🦅"
  },
  "Apeldoorn": {
    emoji: "👑",
    mnemonic: "Appel-doorn, in het bos groeit de troon! 👑",
    fact: "In Apeldoorn staat Paleis Het Loo, het zomerpaleis van de Nederlandse koninklijke familie. En vlakbij vind je Apenheul, een dierentuin vol apen! 🐒"
  },
  "Harderwijk": {
    emoji: "🐬",
    mnemonic: "Harder-wijk, een dolfijn zwom de haven wijk! 🐬",
    fact: "In Harderwijk vind je het Dolfinarium, de grootste dolfijnenshow van Nederland. Hier kun je dolfijnen en zeehonden van heel dichtbij zien! 🌊"
  },
  "Ede": {
    emoji: "🌲",
    mnemonic: "E-de, diep in de Veluwe bos! 🌲",
    fact: "Ede ligt midden op de Veluwe, het grootste aaneengesloten natuurgebied van Nederland. Er lopen echt herten en wilde zwijnen rond! 🦌"
  },
  "Doetinchem": {
    emoji: "🧀",
    mnemonic: "Doe-tin-chem, kaas op de markt met een gem! 🧀",
    fact: "Doetinchem is het hart van de Achterhoek. Vroeger was hier een grote kaasmarkt. De naam betekent zoiets als 'huizen aan het water'. 💧"
  },
  "Zutphen": {
    emoji: "⚓",
    mnemonic: "Zut-phen, de Hanzestad aan de IJssel heen! ⚓",
    fact: "Zutphen is een echte Hanzestad met een prachtig middeleeuws centrum. De Walburgiskerk heeft zelfs een kettingbibliotheek: boeken vastgeketend aan de kast! 📚"
  },
  "Winterswijk": {
    emoji: "🌿",
    mnemonic: "Win-ters-wijk, in de winter ook een uniek zicht! 🌿",
    fact: "Winterswijk ligt vlak bij de Duitse grens en heeft een heel bijzonder landschap met oude holle wegen en kalksteengroeven. 🪨"
  },
  "Wageningen": {
    emoji: "🌾",
    mnemonic: "Wage-ning-en, waar eten en planten worden bestuurd! 🌾",
    fact: "In Wageningen werd op 5 mei 1945 de capitulatie van de Duitsers getekend: de bevrijding van Nederland! 🕊️ En de universiteit daar is wereldberoemd voor voedselonderzoek."
  },
  "Tiel": {
    emoji: "🍎",
    mnemonic: "Tiel in de fruitstreek, boomgaarden zoveel! 🍎",
    fact: "Tiel ligt midden in de Betuwe, de fruitschuur van Nederland. In het voorjaar staan duizenden fruitbomen in bloei — een echt sprookjesgezicht! 🌸"
  },
  "Barneveld": {
    emoji: "🥚",
    mnemonic: "Barn-e-veld, miljoenen eieren in het veld! 🥚",
    fact: "Barneveld is de eierstad van Nederland! Nergens in ons land worden meer eieren geproduceerd. Er staat zelfs een standbeeld van een kip! 🐓"
  },
  "Elst": {
    emoji: "🏺",
    mnemonic: "Elst, diep in de grond de Romeinen gerust! 🏺",
    fact: "Onder de straten van Elst liggen resten van een grote Romeinse tempel! Die is meer dan 2000 jaar oud en werd teruggevonden tijdens de Tweede Wereldoorlog. ⚔️"
  },
  "Zevenaar": {
    emoji: "🌉",
    mnemonic: "Ze-ven-aar, zeven bruggen bij de grens zo naar! 🌉",
    fact: "Zevenaar ligt vlak bij de grens met Duitsland. Vroeger was hier een beroemde paardenmarkt en nu rijdt hier de Betuweroute voor de goederentreinen. 🚂"
  },
  "Nijkerk": {
    emoji: "🍪",
    mnemonic: "Nij-kerk, de pijpkoek smaakt er echt! 🍪",
    fact: "Nijkerk is beroemd om de 'Nijkerkse pijp', een speculaaskoekje in de vorm van een pijp. Een echte streeklekkernij! 😋"
  },
  "Nunspeet": {
    emoji: "🦌",
    mnemonic: "Nun-speet, herten springen door het bos compleet! 🦌",
    fact: "Nunspeet ligt midden op de Veluwe. Hier leven echt vrij rondlopende edelherten, reeën en wilde zwijnen in het bos! 🌲"
  },
  "Groenlo": {
    emoji: "⚔️",
    mnemonic: "Groen-lo, de slag bij Groenlo was groot zo! ⚔️",
    fact: "In Groenlo werd in 1627 een beroemde veldslag uitgevochten (de Slag bij Grolle). Nu wordt dit elk jaar nagespeeld met honderden mensen in historische kostuums! 🏰"
  },
  "Veluwe": {
    emoji: "🌲",
    mnemonic: "Ve-lu-we, het grootste bos waar dieren lopen vrije! 🌲",
    fact: "De Veluwe is het grootste aaneengesloten natuurgebied van Nederland. Er leven edelherten, reeën, wilde zwijnen én zelfs wolven! 🐺"
  },
  "Betuwe": {
    emoji: "🍐",
    mnemonic: "Be-tu-we, fruitbomen zover je kijkt in de rij! 🍐",
    fact: "De Betuwe heet ook wel de 'Fruitschuur van Nederland'. In de lente staan duizenden appel- en perenboombloesems in bloei. 🌸"
  },
  "Achterhoek": {
    emoji: "🐄",
    mnemonic: "Ach-ter-hoek, ver achter de heuvels zoek! 🐄",
    fact: "De Achterhoek is een rustige streek met veel boerderijen, oude vakwerkhuizen en een eigen dialect. Mensen zeggen er 'n'ao huus' in plaats van 'naar huis'! 🗣️"
  },
  "Waal": {
    emoji: "🚢",
    mnemonic: "De Waal, de brede rivier voor boten groot en smal! 🚢",
    fact: "De Waal is de grootste en drukste rivier van Nederland. Meer dan de helft van alle Rijnwater stroomt via de Waal naar zee. 🌊"
  },
  "IJssel": {
    emoji: "🏞️",
    mnemonic: "IJ-ssel, de rivier die lekker kronkelt naar boven! 🏞️",
    fact: "De IJssel is de mooiste hanzeriviertak van de Rijn. Langs de oevers liggen prachtige oude Hanzesteden zoals Zutphen en Deventer! ⚓"
  },
  "Rijn": {
    emoji: "🌍",
    mnemonic: "Rijn, de allergrootste rivier van het vasteland fijn! 🌍",
    fact: "De Rijn begint hoog in de Zwitserse Alpen en stroomt door Duitsland naar Nederland. Het is een van de drukste vrachtroutes van Europa! 🚢"
  },
  "Nieuwe Waterweg": {
    emoji: "🚢",
    mnemonic: "Nieuwe Waterweg, schepen varen naar zee weg! 🚢",
    fact: "De Nieuwe Waterweg is de directe toegang van de Rotterdamse haven naar de Noordzee. Hier varen enorme zeeschepen van en naar de haven. 🌊"
  },
  "Lek": {
    emoji: "🌉",
    mnemonic: "Lek, de rivier stroomt langs de dijk heel gek! 🌉",
    fact: "De Lek is een belangrijke rivier in Midden-Nederland. Langs de Lek liggen dijken, pontjes en oude stadjes zoals Vianen en Schoonhoven. 🛶"
  },
  "Nederrijn": {
    emoji: "🏞️",
    mnemonic: "Neder-rijn, bij Arnhem stroomt hij fijn! 🏞️",
    fact: "De Nederrijn stroomt langs Arnhem en Wageningen. Bij Driel ligt een stuw die helpt om het water goed te verdelen. 💧"
  },

  // --- NOORD-BRABANT ---
  "Helmond": {
    emoji: "⚙️",
    mnemonic: "Hel-mond, machines draaien in de mond van de fabriek! ⚙️",
    fact: "Helmond is een echte industriestad. Hier vind je het Kasteel van Helmond, één van de mooiste waterkasteeltjes van Nederland! 🏰"
  },
  "Oss": {
    emoji: "🌭",
    mnemonic: "Oss, de worst ruikt lekker bij de bos! 🌭",
    fact: "Oss is beroemd om de Ossenworst! En wist je dat het grote chemieconcern AKZO Nobel hier zijn wortels heeft? 🧪"
  },
  "Roosendaal": {
    emoji: "🚂",
    mnemonic: "Roosen-daal, treinen rijden door het dal! 🚂",
    fact: "Roosendaal is een belangrijk spoorwegknooppunt. Van hieruit rijden treinen naar België en heel Nederland. 🇧🇪"
  },
  "Bergen op Zoom": {
    emoji: "🎭",
    mnemonic: "Bergen op Zoom, het carnaval klinkt als een droom! 🎭",
    fact: "Bergen op Zoom viert elk jaar het beroemde Krabbegat-carnaval! De stad heeft ook eeuwenoude vestingwerken. 🏰"
  },
  "Waalwijk": {
    emoji: "👟",
    mnemonic: "Waal-wijk, schoenen lopen hier wijk voor wijk! 👟",
    fact: "Waalwijk was vroeger de schoenenhoofdstad van Nederland. Er is zelfs een Schoenenmuseum! 👞 Nog steeds een centrum voor de leerindustrie."
  },
  "Oosterhout": {
    emoji: "⛪",
    mnemonic: "Oos-ter-hout, de abdij staat in het woud! ⛪",
    fact: "In Oosterhout staat de prachtige abdij van Sint-Paulusabdij. Hier wonen nog altijd monniken die bier brouwen. 🍺"
  },
  "Uden": {
    emoji: "🕊️",
    mnemonic: "U-den, de oorlog eindigde hier met veel vrede! 🕊️",
    fact: "Vlak bij Uden ligt het grote oorlogskerkhof Groesbeek, waar meer dan 2000 geallieerde soldaten begraven liggen uit de Tweede Wereldoorlog. ✌️"
  },
  "Veghel": {
    emoji: "🛡️",
    mnemonic: "Ve-ghel, de slag was er gevaarlijk en snel! 🛡️",
    fact: "Tijdens Operatie Market Garden in 1944 was Veghel een belangrijk punt. Parachutisten landden hier om de weg vrij te maken. 🪂"
  },
  "Boxmeer": {
    emoji: "🍺",
    mnemonic: "Box-meer, bier brouwen aan het meer! 🍺",
    fact: "In Boxmeer staat de Bavaria-brouwerij, een van de bekendste bierbrouwerijen van Nederland! En het ligt mooi aan de rivier de Maas. 🌊"
  },
  "Boxtel": {
    emoji: "🚉",
    mnemonic: "Box-tel, het treinstation is nooit te ver! 🚉",
    fact: "Boxtel heeft een heel belangrijk treinstation. De lijn van 's-Hertogenbosch naar Eindhoven gaat er dwars doorheen. 🚆"
  },
  "Valkenswaard": {
    emoji: "🦅",
    mnemonic: "Valken-swaard, valken vliegen boven het waard! 🦅",
    fact: "De naam Valkenswaard komt van 'valk' — vroeger werd hier op koninklijk bevel met valken gejaagd! Nu is het bekend om de MotoGP-races op het circuit. 🏍️"
  },
  "Etten-Leur": {
    emoji: "🌻",
    mnemonic: "Et-ten-leur, bloemen en markt bij het uur! 🌻",
    fact: "Etten-Leur heeft een gezellige historische markt. De beroemde schilder Vincent van Gogh woonde hier een tijdje en schilderde de mooie omgeving. 🎨"
  },
  "Kempen": {
    emoji: "🌿",
    mnemonic: "Kem-pen, heide en bossen bij de pennen! 🌿",
    fact: "De Kempen is een prachtig heuvelachtig heide- en bosgebied in het zuiden van Brabant, net als in België. Er leven zeldzame planten en vlinders! 🦋"
  },
  "De Peel": {
    emoji: "🦢",
    mnemonic: "De Peel, nat en vol vogels bij het wiel! 🦢",
    fact: "De Peel is een groot veengebied vol bijzondere vogels. Vroeger werd er turf gestoken om huizen mee te verwarmen. Nu is het een uniek natuurgebied! 🌿"
  },
  "Meierij": {
    emoji: "🏛️",
    mnemonic: "Mei-e-rij, het land rond de Bosch is blij! 🏛️",
    fact: "De Meierij is het historische gebied rondom 's-Hertogenbosch. Hier lagen vroeger veel boerderijen en kloosters. 🌾"
  },
  "Baronie van Breda": {
    emoji: "🏰",
    mnemonic: "Ba-ro-nie van Bre-da, het kasteel staat klaar! 🏰",
    fact: "De Baronie van Breda is een eeuwenoud gebied rondom Breda. Vroeger was dit land van de Nassau's, de voorouders van ons koningshuis! 👑"
  },
  "Maas": {
    emoji: "🌊",
    mnemonic: "Maas, de rivier stroomt als een glas! 🌊",
    fact: "De Maas begint in Frankrijk, stroomt door België en heel Brabant naar de zee. Het is een van de langste rivieren van West-Europa! 🗺️"
  },
  "Dommel": {
    emoji: "🌿",
    mnemonic: "Dom-mel, het beekje stroomt door 't dal! 🌿",
    fact: "De Dommel is een schilderachtig riviertje dat dwars door de stad Eindhoven stroomt. Langs de oevers kun je prachtig wandelen! 🚶"
  },
  "Aa": {
    emoji: "💧",
    mnemonic: "Aa, een kleine naam maar een grote stroom! 💧",
    fact: "De Aa is een klein maar belangrijk stroompje in de Peel. Het water is helder en er leven zeldzame vissen en libellen! 🐟"
  },
  "Mark": {
    emoji: "🦆",
    mnemonic: "Mark, eenden zwemmen door de Park! 🦆",
    fact: "De Mark is een sierlijke rivier die door Breda stroomt en het stadspark een bijzonder groen karakter geeft. 🌳"
  },
  "Donge": {
    emoji: "🏞️",
    mnemonic: "Don-ge, het water stroomt in de longe! 🏞️",
    fact: "De Donge is een rustig riviertje in de Baronie van Breda. De naam is heel oud en stamt uit de tijd van de Kelten! 🏺"
  },
  "Zuid-Willemsvaart": {
    emoji: "⛵",
    mnemonic: "Zuid-Wil-lems-vaart, Willems boot vaart recht! ⛵",
    fact: "Dit kanaal werd gegraven op bevel van Koning Willem I. Het verbindt 's-Hertogenbosch met de Belgische stad Maastricht! 🇧🇪"
  },
  "Wilhelminakanaal": {
    emoji: "🚢",
    mnemonic: "Wil-hel-mi-na-ka-naal, Wilhelmina's kanaal staat pal! 🚢",
    fact: "Het Wilhelminakanaal is vernoemd naar Koningin Wilhelmina. Vroeger werden er enorme ladingen veen en turf overheen vervoerd. 🌾"
  },

  // --- NOORD-HOLLAND ---
  "Den Helder": {
    emoji: "⚓",
    mnemonic: "Den Hel-der, het schip vaart in het helder water! ⚓",
    fact: "Den Helder is de marinestad van Nederland! Hier ligt de grootste marinehaven. Van hier varen ook de boten naar het eiland Texel. ⛴️"
  },
  "Hilversum": {
    emoji: "📺",
    mnemonic: "Hil-ver-sum, televisie kijk je hier tot de som! 📺",
    fact: "Hilversum is de mediastad van Nederland! Bijna alle grote tv-zenders en radiostations zijn hier gevestigd. 🎙️ En het heeft prachtige art-deco gebouwen."
  },
  "Purmerend": {
    emoji: "🐄",
    mnemonic: "Pur-me-rend, koeien lopen hier in 't weiland rend! 🐄",
    fact: "Purmerend is een marktstad in het midden van de Beemster en Purmer polders. Vroeger kwamen boeren hier hun vee verkopen op de grote veemarkt! 🐮"
  },
  "Amstelveen": {
    emoji: "🌸",
    mnemonic: "Am-stel-veen, het veen langs de Amstel is groen! 🌸",
    fact: "Amstelveen heeft een van de mooiste Japanse tuinen van Europa! Er woont ook een grote Japanse gemeenschap. 🇯🇵"
  },
  "Aalsmeer": {
    emoji: "🌹",
    mnemonic: "Aals-meer, bloemen ruiken hier zo ver en meer! 🌹",
    fact: "In Aalsmeer staat de grootste bloemenveiling van de wereld! Elke dag worden hier miljoenen bloemen verkocht en naar alle hoeken van de wereld gestuurd. 🌺"
  },
  "IJmuiden": {
    emoji: "🐟",
    mnemonic: "IJ-mui-den, vissen komen uit het water rijden! 🐟",
    fact: "IJmuiden heeft de grootste zeesluizen van de wereld! Die laten zeeschepen van de Noordzee naar Amsterdam varen. Er is ook een grote vissershaven. 🚢"
  },
  "Volendam": {
    emoji: "🎣",
    mnemonic: "Vo-len-dam, de visser draagt een klederdracht sam! 🎣",
    fact: "Volendam is beroemd om de kleurrijke klederdracht met de witte kanten kap. Vroeger waren er hier heel veel vissers op het Zuiderzee! 🐟"
  },
  "Zandvoort": {
    emoji: "🏎️",
    mnemonic: "Zand-voort, de Formule 1 rijdt als een sport! 🏎️",
    fact: "In Zandvoort staat het beroemde Circuit Zandvoort waar de Formule 1 Grand Prix van Nederland wordt verreden! En er is een prachtig strand. 🏖️"
  },
  "Bussum": {
    emoji: "🌳",
    mnemonic: "Bus-sum, in het bos wonen mensen met het gum! 🌳",
    fact: "Bussum ligt in het Gooi, een bosrijke regio. Veel bekende Nederlanders wonen hier vanwege de mooie natuur en rustige sfeer. 🏡"
  },
  "Het Gooi": {
    emoji: "🌲",
    mnemonic: "Het Gooi, bossen en villa's in een mooi! 🌲",
    fact: "Het Gooi is een zandige heuvelstreek tussen Amsterdam en Utrecht. Hier wonen veel bekende Nederlanders, en ook de mediastad Hilversum ligt hier! 📺"
  },
  "Beemster": {
    emoji: "🏆",
    mnemonic: "Beem-ster, de polder is een kampioen! 🏆",
    fact: "De Beemster is een UNESCO Werelderfgoed! Het was in 1612 het eerste grote meer dat drooggelegd werd. De rechte wegen en sloten zijn nog altijd perfect bewaard. 🗺️"
  },
  "Wieringermeer": {
    emoji: "🌾",
    mnemonic: "Wie-ring-er-meer, het land is hier geweer! 🌾",
    fact: "De Wieringermeer was vroeger de bodem van de Zuiderzee. In 1930 werd het drooggelegd. Het is nu vruchtbaar landbouwland! 🚜"
  },
  "Texel": {
    emoji: "🐑",
    mnemonic: "Tex-el, schapen grazen op het eiland snel! 🐑",
    fact: "Texel is het grootste Waddeneiland van Nederland. Er leven meer schapen dan mensen! De Texelse kaas en het Texelse bier zijn heel beroemd. 🧀"
  },
  "Haarlemmermeer": {
    emoji: "✈️",
    mnemonic: "Haar-lem-mer-meer, vliegtuigen landen hier zo leeg! ✈️",
    fact: "De Haarlemmermeer was vroeger een groot meer. Na drooglegging in 1852 werd het landbouwgrond — en later de locatie van luchthaven Schiphol! ✈️"
  },
  "Schiphol": {
    emoji: "✈️",
    mnemonic: "Schi-phol, vliegtuigen vliegen over het hol! ✈️",
    fact: "Schiphol is de grootste luchthaven van Nederland en een van de drukste van Europa. Elke dag landen en vertrekken er honderden vliegtuigen! 🌍"
  },
  "IJmeer": {
    emoji: "⛵",
    mnemonic: "IJ-meer, zeilen op het IJ is zeker weet! ⛵",
    fact: "Het IJmeer ligt tussen Amsterdam en Flevoland. Op winderige dagen varen hier veel kleine zeilbootjes. 🌬️"
  },
  "Noordhollands Kanaal": {
    emoji: "🚢",
    mnemonic: "Noord-hollands ka-naal, de boot vaart pal! 🚢",
    fact: "Dit kanaal werd gegraven in opdracht van Koning Willem I om Amsterdam bereikbaar te houden voor grote schepen, vóór de Noordzeekanaal er was! ⚓"
  },
  "Noordzeekanaal": {
    emoji: "🌊",
    mnemonic: "Noord-zee-ka-naal, het schip vaart naar zee pal! 🌊",
    fact: "Het Noordzeekanaal verbindt Amsterdam direct met de Noordzee via IJmuiden. Elke dag varen er enorme vrachtschepen overheen. 🚢"
  },
  "Loosdrechtse Plassen": {
    emoji: "⛵",
    mnemonic: "Loos-drecht-se plas-sen, zeilen in de massen! ⛵",
    fact: "De Loosdrechtse Plassen zijn ontstaan doordat hier vroeger turf werd gegraven. Nu zijn het prachtige meren vol watersporters en zwemmers! 🏊"
  },
  "Amsterdam-Rijnkanaal": {
    emoji: "⚓",
    mnemonic: "Am-ster-dam-Rijn-ka-naal, de Rijn loopt er pal! ⚓",
    fact: "Dit kanaal verbindt Amsterdam rechtstreeks met de Rijn in Duitsland. Elke dag varen hier honderden vrachtschepen met goederen. 🚢"
  },
  "Markermeer": {
    emoji: "🦆",
    mnemonic: "Mar-ker-meer, eenden zwemmen hier vrij meer! 🦆",
    fact: "Het Markermeer werd ooit gepland als droog land, maar dat plan ging niet door. Nu is het een groot meer vol vogels en vissers. 🐦"
  },

  // --- OVERIGE STEDEN ---
  "Amsterdam": {
    emoji: "🚲",
    mnemonic: "Am-ster-dam, de dam in de rivier Amstel staat vast! 🚲",
    fact: "Amsterdam heeft meer fietsen dan inwoners en meer dan 100 kilometer aan grachten. De grachtengordel staat op de Werelderfgoedlijst! 🏛️"
  },
  "Eindhoven": {
    emoji: "💡",
    mnemonic: "Eind-hoven, in het zuiden shijnt het licht van de lof! 💡",
    fact: "Eindhoven is de designstad van Nederland! Hier begon Philips met gloeilampen maken. Nu woont hier de meest creatieve industrie. 🎨"
  },
  "Tilburg": {
    emoji: "🎭",
    mnemonic: "Til-burg, de carnavalsstad met veel sturm! 🎭",
    fact: "Tilburg viert elk jaar het allergrootste carnaval van Noord-Brabant. De stad heet dan even 'Kruikenstad' en iedereen draagt een kostuum! 🎪"
  },
  "Breda": {
    emoji: "🏰",
    mnemonic: "Bre-da, de breedte van het fort daar! 🏰",
    fact: "In Breda staat het imposante Kasteel van Breda. Hier sloot Spanje in 1625 een beroemde beleg — geschilderd door de schilder Velázquez! 🎨"
  },
  "Deventer": {
    emoji: "📜",
    mnemonic: "De-ven-ter, de koek is heer en meester! 📜",
    fact: "Deventer is beroemd om de Deventer koek, een kruidige ontbijtkoek! En elke kerst is er de beroemde Dickens Festijn met meer dan 950 figuren in victoriaanse kleding. 🎄"
  },
  "Enschede": {
    emoji: "🧵",
    mnemonic: "En-sche-de, textiel uit de fabriek hier! 🧵",
    fact: "Enschede was vroeger de textielstad van Nederland, vol met spinnerijen en weverijen. Nu is het een moderne studentenstad aan de grens met Duitsland! 🇩🇪"
  },
  "Almelo": {
    emoji: "🏭",
    mnemonic: "Al-me-lo, fabrieken naast het kanaal zo! 🏭",
    fact: "Almelo was ooit een heel belangrijke textielstad. Het Overijssels Kanaal loopt er dwars doorheen. 🚢"
  },
  "Venlo": {
    emoji: "🌹",
    mnemonic: "Ven-lo, bloemen en groente groeien hier zo! 🌹",
    fact: "Venlo is de tuinbouwstad van Limburg! Hier worden enorme hoeveelheden bloemen en groenten geteeld in kassen. 🥦"
  },
  "Roermond": {
    emoji: "🛍️",
    mnemonic: "Roer-mond, designer-outlet aan de Roer-mond! 🛍️",
    fact: "Roermond heeft het grootste designer outlet-centrum van de Benelux: miljoenen mensen komen er elk jaar shoppen! 🛒"
  },
  "Alkmaar": {
    emoji: "🧀",
    mnemonic: "Al-kmaar, kaas op de markt dat is waar! 🧀",
    fact: "Alkmaar heeft de beroemdste kaasmarkt van Nederland! Elke vrijdag in de zomer dragen kaasdragers in witte pakken enorme ronde kazen over het marktplein. 🧀"
  },
  "Hoorn": {
    emoji: "⚓",
    mnemonic: "Hoorn, de haven waar de VOC-schepen zijn geboren! ⚓",
    fact: "Hoorn was in de Gouden Eeuw een van de rijkste steden van Nederland. Van hier vertrokken VOC-schepen naar verre landen. Kaap Hoorn in Zuid-Amerika is ernaar vernoemd! 🌍"
  },
  "Enkhuizen": {
    emoji: "🐟",
    mnemonic: "En-khui-zen, haringen in de kuizen! 🐟",
    fact: "Enkhuizen was vroeger de belangrijkste haringstad van Nederland. Nu staat er het Zuiderzeemuseum, met oude vissersbootjes en huizen. 🏠"
  },
  "Zaandam": {
    emoji: "⚙️",
    mnemonic: "Zaan-dam, molens en cacao in het programma! ⚙️",
    fact: "In de Zaanstreek stonden ooit honderden windmolens. Hier leerde de Russische tsaar Peter de Grote hoe je schepen bouwt! 🚢"
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
      model: 'gemini-2.0-flash',
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
      model: 'gemini-2.0-flash',
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
