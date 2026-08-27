
export interface LocationFact {
  fact: string;
  emoji: string;
}

export const LOCATION_FACTS: Record<string, LocationFact> = {
  // --- NEDERLAND ALGEMEEN / CAPITALS ---
  "Rotterdam": {
    emoji: "🚢",
    fact: "Rotterdam heeft de grootste haven van Europa! 🏗️ En kijk eens naar de Euromast, die is superhoog!"
  },
  "Den Haag": {
    emoji: "👑",
    fact: "Hier woont onze Koning en werkt de regering. 🏛️ Het is de enige grote stad aan zee!"
  },
  "Amsterdam": {
    emoji: "🌷",
    fact: "Amsterdam heeft meer fietsen dan inwoners en meer dan 100 kilometer grachten! 🚲"
  },
  "Utrecht": {
    emoji: "⛪",
    fact: "De Domtoren in Utrecht is de hoogste kerktoren van Nederland. Je moet meer dan 400 treden klimmen! 🧗"
  },
  "Haarlem": {
    emoji: "🌷",
    fact: "Haarlem wordt ook wel 'Bloemenstad' genoemd. Het ligt midden in de bollenstreek! 🏡"
  },
  "Groningen": {
    emoji: "⛪",
    fact: "In Groningen staat de Martinitoren, die door iedereen 'D'Olle Grieze' (De Oude Grijze) wordt genoemd! ⛪"
  },
  "Leeuwarden": {
    emoji: "🦁",
    fact: "Leeuwarden is de hoofdstad van Friesland en staat bekend om de scheve toren: de Oldehove! ⛪"
  },
  "Zwolle": {
    emoji: "🧂",
    fact: "In Zwolle staat de 'Peperbus', een grote kerktoren die eruitziet als... jawel, een peperbus! 🧂"
  },
  "Arnhem": {
    emoji: "🦁",
    fact: "Hier vind je Burgers' Zoo, een van de mooiste dierentuinen van Nederland met een echte 'Bush' en 'Desert'! 🌵"
  },
  "Assen": {
    emoji: "🏍️",
    fact: "Assen is wereldberoemd om de TT! Dat is een grote motorrace waar de snelste coureurs ter wereld rijden. 🏁"
  },
  "Lelystad": {
    emoji: "🚢",
    fact: "Lelystad ligt in Flevoland, een provincie die vroeger helemaal onder water stond! Nu staat er een replica van een echt VOC-schip. ⚓"
  },
  "Middelburg": {
    emoji: "⛪",
    fact: "Middelburg heeft een prachtige abdij en een heel hoge toren die de 'Lange Jan' wordt genoemd! ⛪"
  },
  "'s-Hertogenbosch": {
    emoji: "😋",
    fact: "Deze stad is beroemd om de 'Bossche Bol', een enorme soes gevuld met slagroom en een dikke laag chocolade. Jammie! 😋"
  },
  "Maastricht": {
    emoji: "⛰️",
    fact: "Dit is een van de oudste steden van Nederland. Onder de grond zijn kilometers lange gangen gegraven in de mergelberg! ⛰️"
  },

  // --- ZUID-HOLLAND ---
  "Delft": {
    emoji: "🏺",
    fact: "Deze stad is beroemd om het 'Delfts Blauw'. 🏺 Dat is prachtig wit aardewerk met blauwe tekeningen."
  },
  "Gouda": {
    emoji: "🧀",
    fact: "Kaaaaas! 🧀 Gouda staat wereldwijd bekend om de lekkere ronde kazen die op de markt werden verkocht."
  },
  "Leiden": {
    emoji: "🔑",
    fact: "Dit is een echte sleutelstad. 🔑 In Leiden staat ook de oudste universiteit van Nederland! 🎓"
  },
  "Dordrecht": {
    emoji: "🏘️",
    fact: "Dit is de oudste stad van Holland. 🏘️ Het ligt op een eiland en is omringd door water. 💧"
  },
  "Scheveningen": {
    emoji: "🎡",
    fact: "Scheveningen is de beroemdste badplaats van Nederland met een enorme pier! 🏖️"
  },
  "Schiedam": {
    emoji: "🏗️",
    fact: "Wist je dat in Schiedam de allerhoogste windmolens van de hele wereld staan! 🧊"
  },
  "Hoek van Holland": {
    emoji: "⚓",
    fact: "Hier varen de allergrootste schepen de haven van Rotterdam binnen. ⛴️ Een soort poort naar de zee!"
  },
  "Zoetermeer": {
    emoji: "⛷️",
    fact: "Vroeger was dit een klein dorpje, maar nu is het een grote stad met een echte skibaan! ⛷️"
  },
  "Gorinchem": {
    emoji: "🏰",
    fact: "Gorinchem is de mooiste vestingsstad van Nederland, je kunt er wandelen over de oude stadswallen! 🏰"
  },
  "Katwijk aan Zee": {
    emoji: "🏖️",
    fact: "Katwijk heeft een supergroot strand en een heel bijzonder 'ondergronds' parkeergebouw in de duinen! 🚗"
  },
  "Noordwijk (aan zee)": {
    emoji: "🚀",
    fact: "Hier vind je niet alleen strand, maar ook de Space Expo! 🚀 Alles over raketten en de ruimte."
  },
  "Westland (B)": {
    emoji: "🍅",
    fact: "Dit noemen we ook wel de 'Glazen Stad' omdat er duizenden kassen staan voor tomaten, paprika's en bloemen. 🪴"
  },
  "Alphen aan den Rijn": {
    emoji: "🦜",
    fact: "Hier vind je vogelpark Avifauna, waar je duizenden bijzondere vogels kunt zien. 🦢"
  },
  "Wassenaar": {
    emoji: "🎢",
    fact: "In Wassenaar vind je pretpark Duinrell! En vroeger woonden de koning en koningin hier in villa Eijenhorst. 🏰"
  },

  // --- FRIESLAND ---
  "Drachten": {
    emoji: "🎭",
    fact: "Drachten is de op één na grootste 'plaats' van Friesland. Stiekem is het geen stad maar een heel groot dorp! 🏘️"
  },
  "Sneek": {
    emoji: "⛵",
    fact: "Sneek is beroemd om de Waterpoort en het grote zeilfeest dat de 'Sneekweek' heet! 🚤"
  },
  "Heerenveen": {
    emoji: "⛸️",
    fact: "Hier ligt Thialf, het allergrootste en bekendste schaatsstadion van Nederland! 🧊"
  },
  "Harlingen": {
    emoji: "⛴️",
    fact: "Harlingen is de belangrijkste havenstad van Friesland. Vanaf hier varen de boten naar de eilanden! ⛴️"
  },
  "Dokkum": {
    emoji: "⛪",
    fact: "Dokkum is de noordelijkste stad van Nederland. Lang geleden werd hier de heilige Bonifatius vermoord! ⚔️"
  },
  "Franeker": {
    emoji: "🪐",
    fact: "In Franeker vind je het oudste werkende planetarium ter wereld, gemaakt in een gewone woonkamer! 🌟"
  },
  "Joure": {
    emoji: "☕",
    fact: "In Joure is Douwe Egberts ontstaan. Hier werd vroeger de allereerste koffie voor Nederland gebrand! ☕"
  },
  "Stavoren": {
    emoji: "🌾",
    fact: "In Stavoren staat een standbeeld van het 'Vrouwtje van Stavoren', een oud volksverhaal over een rijke koopmansvrouw. 👑"
  },
  "Bolsward": {
    emoji: "🚴",
    fact: "Bolsward is een oude handelsstad en staat bekend om de start van de 'Fietselfstedentocht'! 🚲"
  },
  "Lemmer": {
    emoji: "🏖️",
    fact: "Lemmer is een bekende watersportplaats en ligt direct aan het grote IJsselmeer! ⛵"
  },

  // --- FRIESLAND EILANDEN ---
  "Terschelling": {
    emoji: "🔥",
    fact: "Terschelling heeft de beroemde vuurtoren genaamd de Brandaris. Dat is de oudste vuurtoren van heel Nederland! 🗼"
  },
  "Ameland": {
    emoji: "🚲",
    fact: "Ameland heeft prachtige stranden en duinen, waar in het voorjaar duizenden vogels broeden! 🐦"
  },
  "Vlieland": {
    emoji: "🦅",
    fact: "Vlieland is hét eiland met de grootste zandvlakte van Nederland, de 'Vliehors', waar militaire oefeningen zijn! 🪖"
  },
  "Schiermonnikoog": {
    emoji: "🙏",
    fact: "Dit was ooit een eiland waar monniken woonden. Het is ook het kleinste waddeneiland van Nederland! 🏝️"
  },
  "Texel": {
    emoji: "🐑",
    fact: "Texel is het grootste Waddeneiland! Het is beroemd om zijn schapen, stranden en heerlijke Texelse kaas. 🧀"
  },

  // --- FRIESLAND WATEREN ---
  "Waddenzee": {
    emoji: "🦭",
    fact: "Als de zee hier laag water heeft (eb), kun je letterlijk over de zeebodem wandelen. Dat heet 'wadlopen'! 🥾"
  },
  "IJsselmeer": {
    emoji: "🦆",
    fact: "Vroeger was dit meer zout en nóg groter. Toen de Afsluitdijk in 1932 gebouwd werd, werd het zoet water! 💧"
  },
  "Sneekermeer": {
    emoji: "🚤",
    fact: "Het Sneekermeer is één van de belangrijkste watergebieden voor sportvissers en zeilers! 🎣"
  },

  // --- WATEREN NEDERLAND ---
  "Noordzeekanaal": {
    emoji: "🚢",
    fact: "Het Noordzeekanaal verbindt Amsterdam met de Noordzee bij IJmuiden. Grote zeeschepen varen hierdoor naar de haven van Amsterdam. ⚓"
  },
  "Amsterdam-Rijnkanaal": {
    emoji: "⚓",
    fact: "Het Amsterdam-Rijnkanaal is een belangrijke vaarroute tussen Amsterdam, Utrecht en de grote rivieren. 🚢"
  },
  "Nieuwe Waterweg": {
    emoji: "🚢",
    fact: "De Nieuwe Waterweg is de toegang van de Rotterdamse haven naar de Noordzee. Hier varen enorme zeeschepen. 🌊"
  },
  "Lek": {
    emoji: "🌉",
    fact: "De Lek is een grote rivier in het midden van Nederland. Langs de Lek liggen dijken, pontjes en oude stadjes. 🛶"
  },
  "Nederrijn": {
    emoji: "🏞️",
    fact: "De Nederrijn stroomt langs Arnhem en Wageningen. Bij Driel ligt een stuw die helpt om het water te regelen. 💧"
  },
  "Waal": {
    emoji: "🚢",
    fact: "De Waal is de breedste en drukste rivier van Nederland. Er varen heel veel vrachtschepen overheen. 🌊"
  },
  "IJssel": {
    emoji: "🏞️",
    fact: "De IJssel stroomt langs oude Hanzesteden zoals Zutphen, Deventer en Zwolle. ⚓"
  },
  "Rijn": {
    emoji: "🌍",
    fact: "De Rijn begint in de Alpen en komt via Duitsland Nederland binnen. Daarna splitst hij zich in meerdere rivieren. 🗺️"
  },
  "Maas": {
    emoji: "🌊",
    fact: "De Maas stroomt vanuit Frankrijk door België en Nederland. In Nederland is het een belangrijke rivier in het zuiden. 🛶"
  },

  // --- NOORD-HOLLAND ---
  "Alkmaar": {
    emoji: "🧀",
    fact: "Alkmaar is de kaasstad van Noord-Holland! Elke vrijdag is er een beroemde kaasmarkt met dragers in witte kleding. 🎪"
  },
  "Zaandam": {
    emoji: "🪨",
    fact: "In de Zaanstreek staan prachtige groene houten huisjes. Zelfs de Russische tsaar Peter de Grote leerde er scheepsbouwen! ⚓"
  },
  "Den Helder": {
    emoji: "⚓",
    fact: "Den Helder is de marinehaven van Nederland. Hier liggen de grote oorlogsschepen! 🛳️"
  },
  "Hoorn": {
    emoji: "🧭",
    fact: "Hoorn was vroeger een van de rijkste steden van de wereld door de VOC-handel. De VOC was als het ware het eerste multinationale bedrijf! 🌍"
  },
  "Enkhuizen": {
    emoji: "🎣",
    fact: "Enkhuizen heeft het Zuiderzeemuseum, waar je kunt zien hoe mensen vroeger leefden aan de zee! 🏘️"
  },
  "Volendam": {
    emoji: "👗",
    fact: "Volendam is beroemd om de kleurrijke klederdracht! Mensen dragen er nog steeds het traditionele pak voor toeristen. 📸"
  },
  "Hilversum": {
    emoji: "📺",
    fact: "Hilversum is de mediastad van Nederland. Bijna alle grote tv-programma's worden hier opgenomen! 🎬"
  },

  // --- GELDERLAND ---
  "Nijmegen": {
    emoji: "👟",
    fact: "Nijmegen is de oudste stad van Nederland! En elk jaar lopen meer dan 40.000 mensen de beroemde Vierdaagse. 👟"
  },
  "Apeldoorn": {
    emoji: "👑",
    fact: "In Apeldoorn ligt Paleis Het Loo, het zomerhuis van de Nederlandse koningen en koninginnen! 🏰"
  },

  // --- NOORD-BRABANT ---
  "Eindhoven": {
    emoji: "💡",
    fact: "Eindhoven is de technologiestad van Nederland! Hier werd Philips opgericht, het bedrijf dat de gloeilamp populair maakte. 💡"
  },
  "Tilburg": {
    emoji: "🎭",
    fact: "Tilburg heeft het grootste carnaval van de Benelux! Drie dagen lang is iedereen verkleed. 🎉"
  },
  "Breda": {
    emoji: "🏰",
    fact: "In Breda staat het Kasteel van Breda. In dit kasteel zit nu de Koninklijke Militaire Academie! ⚔️"
  },

  // --- ZEELAND ---
  "Deltawerken": {
    emoji: "🌊",
    fact: "Na de watersnoodramp van 1953 bouwde Nederland de Deltawerken om zichzelf te beschermen tegen de zee. ⚙️"
  },

  // --- OVERIJSSEL ---
  "Giethoorn": {
    emoji: "⛵",
    fact: "Giethoorn wordt ook wel het 'Venetië van het Noorden' genoemd. Er zijn geen wegen, alleen maar water en bruggetjes! 🌿"
  },

  // --- DRENTHE ---
  "Hunebedden": {
    emoji: "🪨",
    fact: "In Drenthe staan de Hunebedden, grote grafstenen die 5000 jaar geleden zijn gebouwd door de eerste bewoners! 🗿"
  },

  // --- EUROPA LANDEN ---
  "Albanië": {
    emoji: "🏔️",
    fact: "Albanië heeft hoge bergen én stranden aan de Adriatische Zee. Het land werd lang heel gesloten bestuurd, maar is nu volop in ontwikkeling. 🌊"
  },
  "Andorra": {
    emoji: "⛷️",
    fact: "Andorra ligt hoog in de Pyreneeën tussen Frankrijk en Spanje. Het is een van de kleinste landen van Europa en populair bij wintersporters. 🏔️"
  },
  "Oostenrijk": {
    emoji: "🎼",
    fact: "Oostenrijk ligt in de Alpen en is bekend om bergen, skiën en klassieke muziek. Mozart werd geboren in Salzburg. 🎻"
  },
  "Wit-Rusland": {
    emoji: "🌲",
    fact: "Wit-Rusland heeft veel bossen en moerassen. Een groot deel van het oerbos Białowieża ligt in dit gebied. 🌳"
  },
  "België": {
    emoji: "🧇",
    fact: "België heeft drie officiële talen: Nederlands, Frans en Duits. Brussel is ook een belangrijke stad voor de Europese Unie. 🏛️"
  },
  "Bosnië en Herzegovina": {
    emoji: "🌉",
    fact: "In Bosnië en Herzegovina ligt de stad Mostar met een beroemde oude brug. Die brug is een symbool van verbinding. 🌉"
  },
  "Bulgarije": {
    emoji: "🌹",
    fact: "Bulgarije staat bekend om rozenolie. In de Rozenvallei worden rozen gekweekt voor parfum. 🌹"
  },
  "Kroatië": {
    emoji: "🏖️",
    fact: "Kroatië heeft een lange kust met heel veel eilanden. De stad Dubrovnik heeft beroemde oude stadsmuren. 🏰"
  },
  "Cyprus": {
    emoji: "🏝️",
    fact: "Cyprus is een eiland in de Middellandse Zee. Het ligt dicht bij Europa, Azië en Afrika. 🗺️"
  },
  "Tsjechië": {
    emoji: "🏰",
    fact: "Tsjechië heeft ontzettend veel kastelen. De hoofdstad Praag wordt ook wel de Gouden Stad genoemd. ✨"
  },
  "Denemarken": {
    emoji: "🧱",
    fact: "Denemarken bestaat uit een schiereiland en veel eilanden. LEGO komt uit Denemarken. 🧱"
  },
  "Estland": {
    emoji: "💻",
    fact: "Estland is heel digitaal. Veel dingen, zoals stemmen en papierwerk, kunnen mensen daar online regelen. 💻"
  },
  "Finland": {
    emoji: "🧊",
    fact: "Finland heeft duizenden meren en uitgestrekte bossen. In het noorden kun je soms het noorderlicht zien. 🌌"
  },
  "Frankrijk": {
    emoji: "🗼",
    fact: "Frankrijk is het grootste land van de Europese Unie. In Parijs staat de Eiffeltoren, een van de bekendste bouwwerken ter wereld. 🗼"
  },
  "Duitsland": {
    emoji: "🏭",
    fact: "Duitsland ligt midden in Europa en heeft veel buurlanden. De rivier de Rijn stroomt door het westen van het land. 🚆"
  },
  "Griekenland": {
    emoji: "🏛️",
    fact: "Griekenland bestaat uit een vasteland en heel veel eilanden. De oude Grieken bedachten veel over democratie, theater en sport. 🏛️"
  },
  "Hongarije": {
    emoji: "🌶️",
    fact: "Hongarije ligt in Midden-Europa. De hoofdstad Boedapest ligt aan de rivier de Donau en paprika is er heel bekend. 🌶️"
  },
  "IJsland": {
    emoji: "🌋",
    fact: "IJsland heeft vulkanen, geisers en gletsjers. Het eiland ligt precies op een breuklijn tussen twee aardplaten. 🌋"
  },
  "Ierland": {
    emoji: "☘️",
    fact: "Ierland wordt vaak het groene eiland genoemd. Het regent er veel, waardoor het landschap prachtig groen is. ☘️"
  },
  "Italië": {
    emoji: "🍕",
    fact: "Italië heeft de vorm van een laars. Het land is bekend om Rome, pizza, pasta en oude Romeinse gebouwen. 🍕"
  },
  "Kosovo": {
    emoji: "⭐",
    fact: "Kosovo is een jong land in de Balkan. De hoofdstad is Pristina en het land heeft een jonge bevolking. ⭐"
  },
  "Letland": {
    emoji: "🌲",
    fact: "Letland ligt aan de Oostzee. Het land heeft veel bossen, stranden en de hoofdstad Riga heeft een oude binnenstad. 🌲"
  },
  "Liechtenstein": {
    emoji: "🏰",
    fact: "Liechtenstein is piepklein en ligt tussen Zwitserland en Oostenrijk. Het heeft bergen en een prins als staatshoofd. 🏰"
  },
  "Litouwen": {
    emoji: "🟡",
    fact: "Litouwen is de zuidelijkste Baltische staat. De hoofdstad Vilnius heeft een grote oude binnenstad. 🏘️"
  },
  "Luxemburg": {
    emoji: "🏦",
    fact: "Luxemburg is klein, maar rijk en belangrijk in Europa. Er wordt Luxemburgs, Frans en Duits gesproken. 🏦"
  },
  "Malta": {
    emoji: "⛵",
    fact: "Malta is een klein eilandland in de Middellandse Zee. Er staan tempels die ouder zijn dan de piramides van Egypte. ⛵"
  },
  "Moldavië": {
    emoji: "🍇",
    fact: "Moldavië ligt tussen Roemenië en Oekraïne. Het land is bekend om wijnkelders en wijngaarden. 🍇"
  },
  "Monaco": {
    emoji: "🏎️",
    fact: "Monaco is een piepklein land aan de Middellandse Zee. Er wordt een beroemde Formule 1-race door de straten gereden. 🏎️"
  },
  "Montenegro": {
    emoji: "⛰️",
    fact: "Montenegro betekent zwarte berg. Het land heeft hoge bergen, diepe kloven en een kust aan de Adriatische Zee. ⛰️"
  },
  "Nederland": {
    emoji: "🌷",
    fact: "Nederland ligt voor een groot deel laag. Daarom zijn dijken, polders en waterbeheer hier superbelangrijk. 🌊"
  },
  "Noord-Macedonië": {
    emoji: "☀️",
    fact: "Noord-Macedonië ligt in de Balkan. Het Meer van Ohrid is heel oud en staat op de Werelderfgoedlijst. ☀️"
  },
  "Noorwegen": {
    emoji: "🏔️",
    fact: "Noorwegen heeft diepe fjorden, hoge bergen en een lange kust. In het noorden gaat de zon in de zomer bijna niet onder. 🌅"
  },
  "Polen": {
    emoji: "🧂",
    fact: "Polen ligt in Midden-Europa. Bij Krakau liggen beroemde oude zoutmijnen met zalen diep onder de grond. 🧂"
  },
  "Portugal": {
    emoji: "🌊",
    fact: "Portugal ligt aan de Atlantische Oceaan. Portugese zeevaarders maakten vroeger lange ontdekkingsreizen. ⛵"
  },
  "Roemenië": {
    emoji: "🏰",
    fact: "Roemenië heeft de Karpaten en het gebied Transsylvanië. Daar staat het kasteel dat vaak met Dracula wordt verbonden. 🦇"
  },
  "Rusland": {
    emoji: "🌍",
    fact: "Rusland is het grootste land ter wereld. Alleen het westelijke deel ligt in Europa; de rest ligt in Azië. 🗺️"
  },
  "San Marino": {
    emoji: "🛡️",
    fact: "San Marino is een van de kleinste en oudste republieken ter wereld. Het ligt helemaal binnen Italië. 🛡️"
  },
  "Servië": {
    emoji: "🎺",
    fact: "Servië ligt in de Balkan. De Donau stroomt door de hoofdstad Belgrado. 🎺"
  },
  "Slowakije": {
    emoji: "🏔️",
    fact: "Slowakije heeft veel bergen en kastelen. De Hoge Tatra is een bekend berggebied. 🏔️"
  },
  "Slovenië": {
    emoji: "🏞️",
    fact: "Slovenië heeft bergen, grotten en een klein stukje kust. Het Meer van Bled is beroemd om het eilandje met kerk. 🏞️"
  },
  "Spanje": {
    emoji: "💃",
    fact: "Spanje ligt op het Iberisch Schiereiland. Het land heeft bergen, stranden en de beroemde stad Barcelona. 💃"
  },
  "Zweden": {
    emoji: "🌲",
    fact: "Zweden heeft veel bossen en meren. Het land is bekend om elanden, design en lange zomerdagen in het noorden. 🌲"
  },
  "Zwitserland": {
    emoji: "⛰️",
    fact: "Zwitserland ligt in de Alpen. Het land is bekend om bergen, treinen, chocolade en horloges. 🚆"
  },
  "Turkije": {
    emoji: "🌉",
    fact: "Turkije ligt in Europa én Azië. De stad Istanbul ligt aan beide kanten van de Bosporus. 🌉"
  },
  "Oekraïne": {
    emoji: "🌻",
    fact: "Oekraïne is een groot land in Oost-Europa. Door de vruchtbare grond wordt het ook wel de graanschuur van Europa genoemd. 🌻"
  },
  "Verenigd Koninkrijk": {
    emoji: "👑",
    fact: "Het Verenigd Koninkrijk bestaat uit Engeland, Schotland, Wales en Noord-Ierland. Londen is de hoofdstad. 👑"
  },
  "Vaticaanstad": {
    emoji: "⛪",
    fact: "Vaticaanstad is het kleinste land ter wereld. Het ligt midden in Rome en de paus woont er. ⛪"
  },
};
