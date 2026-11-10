"""Knipt de twee contactvellen van het taartenatelier in losse WebP-bestanden.

Eenmalig werk. De taartbodems staan in een net raster van 3 x 2; de
versieringen niet. Die laatste worden gevonden als samenhangende eilanden van
niet-doorzichtige pixels, waarna losse stukjes (de pareltjes, de sprinkles, de
kruimels) bij hun buur worden getrokken. Bij het uitknippen schrijven we
alleen de pixels van de versiering zelf, zodat een buur die toevallig in het
kader valt niet mee komt.

Gebruik:  python3 scripts/knipTaartAssets.py

Een nieuw contactvel inladen: zie docs/taartenatelier-assets.md. De
versieringen worden gevonden met de kaders in de lijst VERSIERINGEN;
bij een ander vel horen andere kaders.
"""
from collections import deque
from pathlib import Path
import json
import pathlib

from PIL import Image, ImageDraw

BRON = Path('_inbox-taartenatelier')
VERSIERINGEN_VEL = 'versieringen-bovenaanzicht-contactvel.webp'
VORMEN_VEL = 'taartvormen-contactvel.webp'
TAARTEN_UIT = Path('public/assets/library/cooking/taarten')
VERSIERING_UIT = Path('public/assets/library/cooking/versieringen')
DREMPEL = 30

TAARTEN = [
    ('wit', 'Witte taart'), ('roze', 'Roze taart'), ('blauw', 'Blauwe taart'),
    ('wit-rand', 'Witte taart met slagroomrand'), ('roze-rand', 'Roze taart met slagroomrand'),
    ('blauw-rand', 'Blauwe taart met slagroomrand'),
]

# Het tweede vel met taartvormen. De stukken raken elkaar niet, dus hier is
# geen kaderlijst nodig: ze worden van links naar rechts en van boven naar
# beneden gevonden. Wel de namen in die volgorde.
VORMEN = [
    ('schulp-chocolade', 'Ronde chocoladetaart'), ('schulp-geel', 'Ronde gele taart'),
    ('schulp-paars', 'Ronde paarse taart'), ('schulp-groen', 'Ronde groene taart'),
    ('reep-chocolade', 'Lange chocoladetaart'), ('reep-wit', 'Lange witte taart'),
    ('reep-roze', 'Lange roze taart'), ('reep-paars', 'Lange paarse taart'),
    ('ovaal-chocolade', 'Ovale chocoladetaart'), ('ovaal-wit', 'Ovale witte taart'),
    ('ovaal-roze', 'Ovale roze taart'), ('ovaal-groen', 'Ovale groene taart'),
    ('vierkant-chocolade', 'Vierkante chocoladetaart'), ('vierkant-wit', 'Vierkante witte taart'),
    ('vierkant-geel', 'Vierkante gele taart'), ('vierkant-roze', 'Vierkante roze taart'),
    ('vierkant-blauw', 'Vierkante blauwe taart'), ('vierkant-paars', 'Vierkante paarse taart'),
]
# Stukken die dichter bij elkaar liggen dan dit horen bij dezelfde rij.
RIJHOOGTE = 120

# De versieringen van het bovenaanzichtvel. Per versiering een kader op het
# vel; een eilandje hoort bij de versiering waarvan het kader zijn midden
# bevat. Zo hoeft de volgorde van het zoeken niet te kloppen, en is op het
# controlevel na te kijken of elk kader het juiste stuk ving.
# (x1, y1, x2, y2) in pixels op het vel van 1125 x 750.
VERSIERINGEN = [
    ('toef-wit', 'Witte toef', 'slagroom', (5, 0, 157, 145)),
    ('toef-roze', 'Roze toef', 'slagroom', (157, 0, 303, 145)),
    ('toef-chocolade', 'Chocoladetoef', 'slagroom', (304, 0, 452, 145)),
    ('toef-paars', 'Paarse toef', 'slagroom', (453, 0, 600, 145)),
    ('toef-blauw', 'Blauwe toef', 'slagroom', (601, 0, 740, 145)),
    ('schuimpje-wit', 'Wit schuimpje', 'slagroom', (741, 0, 862, 145)),
    ('schuimpje-roze', 'Roze schuimpje', 'slagroom', (863, 0, 987, 145)),
    ('schuimpje-blauw', 'Blauw schuimpje', 'slagroom', (988, 0, 1125, 145)),

    ('parels', 'Parelballetjes', 'snoep', (0, 145, 175, 243)),
    ('hagelslag', 'Hagelslag', 'snoep', (176, 145, 365, 243)),
    ('sterretjes', 'Sterretjes', 'snoep', (366, 145, 545, 243)),
    ('hartjes', 'Hartjes', 'snoep', (546, 145, 742, 243)),
    ('bloemetjes', 'Suikerbloemetjes', 'versiering', (743, 145, 935, 243)),
    ('confetti', 'Confettistipjes', 'snoep', (936, 145, 1125, 243)),

    ('aardbei', 'Aardbei', 'fruit', (0, 243, 200, 345)),
    ('blauwe-bessen', 'Blauwe bessen', 'fruit', (201, 243, 330, 345)),
    ('framboos', 'Framboos', 'fruit', (331, 243, 497, 345)),
    ('banaan', 'Banaan', 'fruit', (498, 243, 658, 345)),
    ('kiwi', 'Kiwi', 'fruit', (659, 243, 820, 345)),
    ('sinaasappel', 'Sinaasappel', 'fruit', (821, 243, 940, 345)),
    ('kersen', 'Kersen', 'fruit', (941, 243, 1125, 345)),

    ('roomrolletjes', 'Roomrolletjes', 'slagroom', (0, 345, 160, 434)),
    ('chocoladerolletjes', 'Chocoladerolletjes', 'chocolade', (161, 345, 310, 434)),
    ('chocoladebrokjes', 'Chocoladebrokjes', 'chocolade', (311, 345, 450, 434)),
    ('witte-blokjes', 'Witte chocoladeblokjes', 'chocolade', (451, 345, 575, 434)),
    ('nootjes', 'Krokante nootjes', 'chocolade', (576, 345, 700, 434)),
    ('crispies', 'Crispies', 'chocolade', (701, 345, 840, 434)),
    ('chocoladekorrels', 'Chocoladekorrels', 'chocolade', (841, 345, 985, 434)),
    ('koekje-chocolade', 'Chocoladekoekje', 'chocolade', (986, 330, 1125, 434)),

    ('bloem-wit', 'Witte bloem', 'versiering', (0, 434, 115, 540)),
    ('bloem-roze', 'Roze bloem', 'versiering', (116, 434, 212, 540)),
    ('bloem-paars', 'Paarse bloem', 'versiering', (213, 434, 313, 540)),
    ('roos', 'Roos', 'versiering', (314, 434, 447, 540)),
    ('blaadjes', 'Blaadjes', 'versiering', (448, 434, 558, 540)),
    ('strik', 'Strik', 'versiering', (559, 434, 700, 540)),
    ('kroontje', 'Kroontje', 'versiering', (701, 434, 822, 540)),
    ('eenhoorn', 'Eenhoornkoekje', 'versiering', (823, 434, 947, 540)),
    ('regenboog', 'Regenboog', 'versiering', (948, 434, 1125, 540)),

    ('vlinder', 'Vlinderkoekje', 'versiering', (0, 540, 123, 645)),
    ('sterkoekje-geel', 'Geel sterkoekje', 'versiering', (123, 540, 211, 645)),
    ('hartkoekje-roze', 'Roze hartkoekje', 'versiering', (211, 540, 312, 645)),
    ('lolly', 'Spiraallolly', 'snoep', (313, 540, 412, 645)),
    ('suikerballetjes', 'Suikerballetjes', 'snoep', (413, 540, 542, 645)),
    ('donut', 'Donut', 'snoep', (713, 540, 816, 645)),
    ('sterkoekje-wit', 'Wit sterkoekje', 'versiering', (817, 540, 913, 645)),
    ('hartkoekje-rand', 'Hartkoekje met suikerrand', 'versiering', (914, 540, 1013, 645)),
    ('koekje-stukjes', 'Chocolate-chipkoekje', 'chocolade', (1014, 540, 1125, 645)),

    ('viooltje', 'Viooltje', 'versiering', (0, 645, 107, 750)),
    ('bloesem-roze', 'Roze bloesem', 'versiering', (108, 645, 185, 750)),
    ('bloesem-wit', 'Witte bloesem', 'versiering', (186, 645, 273, 750)),
    ('viooltje-paars', 'Paars viooltje', 'versiering', (274, 645, 370, 750)),
    ('chocoladehart-puur', 'Puur chocoladehart', 'chocolade', (598, 645, 689, 750)),
    ('chocoladehart-wit', 'Wit chocoladehart', 'chocolade', (690, 645, 775, 750)),
    ('chocoladehart-melk', 'Melkchocoladehart', 'chocolade', (776, 645, 865, 750)),
    ('goudballetjes', 'Gouden balletjes', 'snoep', (866, 645, 943, 750)),
    ('chocoladeballetjes', 'Chocoladeballetjes', 'chocolade', (944, 645, 1028, 750)),
    ('parels-wit', 'Witte parels', 'snoep', (1029, 645, 1125, 750)),
]

# Stukken die op het vel staan maar niet van bovenaf getekend zijn: de twee
# bitterkoekjes staan op hun kant en de kaarsjes staan rechtop. Die horen
# niet op een taart die je van boven ziet.
WEGGELATEN = [
    ('bitterkoekjes', (543, 540, 712, 645)),
    ('kaarsjes', (371, 645, 597, 750)),
]

# Drie koekjes en drie bloemen raken elkaar net, waardoor ze als een stuk
# gevonden worden. Hier splitsen we ze bij de lege kolommen ertussen.
SPLITSEN = [((12, 541, 309, 635), (123, 211)), ((110, 649, 366, 733), (185, 273))]


def eilanden(alfa, breedte, hoogte):
    """Samenhangende stukken niet-doorzichtige pixels, met hun pixels erbij."""
    gezien = bytearray(breedte * hoogte)
    gevonden = []
    for y0 in range(hoogte):
        for x0 in range(breedte):
            if gezien[y0 * breedte + x0] or alfa[x0, y0] < DREMPEL:
                continue
            rij = deque([(x0, y0)])
            gezien[y0 * breedte + x0] = 1
            punten = []
            while rij:
                x, y = rij.popleft()
                punten.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < breedte and 0 <= ny < hoogte and not gezien[ny * breedte + nx] and alfa[nx, ny] >= DREMPEL:
                            gezien[ny * breedte + nx] = 1
                            rij.append((nx, ny))
            gevonden.append(punten)
    return gevonden


def kader(punten):
    xs = [p[0] for p in punten]
    ys = [p[1] for p in punten]
    return min(xs), min(ys), max(xs), max(ys)


def afstand(a, b):
    dx = max(0, max(a[0], b[0]) - min(a[2], b[2]))
    dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
    return max(dx, dy)


def midden(punten):
    x1, y1, x2, y2 = kader(punten)
    return (x1 + x2) // 2, (y1 + y2) // 2


def in_kader(punt, vak):
    return vak[0] <= punt[0] < vak[2] and vak[1] <= punt[1] < vak[3]


def grootste_deel(punten):
    """Houdt alleen het grootste samenhangende stuk over.

    Na het splitsen bij een vaste kolom blijft er soms een smal randje van de
    buurman staan. Dat randje hangt nergens aan vast, dus het valt hier weg.
    """
    over = set(punten)
    beste = []
    while over:
        start = over.pop()
        rij = deque([start])
        deel = [start]
        while rij:
            x, y = rij.popleft()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    buur = (x + dx, y + dy)
                    if buur in over:
                        over.discard(buur)
                        rij.append(buur)
                        deel.append(buur)
        if len(deel) > len(beste):
            beste = deel
    return beste


def splits(punten, grenzen):
    """Deelt een eilandje op bij vaste kolommen; voor stukken die elkaar raken."""
    delen = []
    rest = sorted(punten)
    for grens in grenzen:
        delen.append([p for p in rest if p[0] < grens])
        rest = [p for p in rest if p[0] >= grens]
    delen.append(rest)
    return [grootste_deel(d) for d in delen if d]


def schrijf(vel, punten, pad):
    x1, y1, x2, y2 = kader(punten)
    uit = Image.new('RGBA', (x2 - x1 + 1, y2 - y1 + 1), (0, 0, 0, 0))
    bron = vel.load()
    doel = uit.load()
    for x, y in punten:
        doel[x - x1, y - y1] = bron[x, y]
    uit.save(pad, 'WEBP', quality=92, method=6)
    return uit.size


def knip_taarten():
    TAARTEN_UIT.mkdir(parents=True, exist_ok=True)
    bodemvel = BRON / 'taartbodems-contactvel.webp'
    if not bodemvel.exists():
        # De taartbodems zijn al eerder uitgeknipt en het contactvel is
        # opgeruimd. Lees dan de bestaande bestanden; alleen de versieringen
        # worden opnieuw geknipt.
        uit = []
        for sleutel, naam in TAARTEN:
            stuk = Image.open(TAARTEN_UIT / f'{sleutel}.webp')
            uit.append({'id': sleutel, 'naam': naam, 'breedte': stuk.width, 'hoogte': stuk.height})
        print('taartbodems: contactvel ontbreekt, bestaande bestanden gebruikt')
        return uit
    vel = Image.open(bodemvel).convert('RGBA')
    rijen = [(9, 489), (503, 994)]
    kolommen = [(17, 491), (522, 1001), (1029, 1509)]
    uit = []
    for ri, (y1, y2) in enumerate(rijen):
        for ki, (x1, x2) in enumerate(kolommen):
            sleutel, naam = TAARTEN[ri * 3 + ki]
            stuk = vel.crop((x1, y1, x2 + 1, y2 + 1))
            stuk.save(TAARTEN_UIT / f'{sleutel}.webp', 'WEBP', quality=92, method=6)
            uit.append({'id': sleutel, 'naam': naam, 'breedte': stuk.width, 'hoogte': stuk.height})
    return uit


def knip_vormen():
    """Knipt het tweede vel met taartvormen; die staan los van elkaar."""
    vel = Image.open(BRON / VORMEN_VEL).convert('RGBA')
    breedte, hoogte = vel.size
    stukken = [p for p in eilanden(vel.split()[3].load(), breedte, hoogte) if len(p) > 2000]
    # Van boven naar beneden, en binnen een rij van links naar rechts.
    stukken.sort(key=lambda punten: (kader(punten)[1] // RIJHOOGTE, kader(punten)[0]))
    if len(stukken) != len(VORMEN):
        raise SystemExit(f'{len(stukken)} vormen gevonden, {len(VORMEN)} namen in de lijst VORMEN.')
    uit = []
    for (sleutel, naam), punten in zip(VORMEN, stukken):
        maat = schrijf(vel, punten, TAARTEN_UIT / f'{sleutel}.webp')
        uit.append({'id': sleutel, 'naam': naam, 'breedte': maat[0], 'hoogte': maat[1]})
    return uit


def knip_versieringen():
    VERSIERING_UIT.mkdir(parents=True, exist_ok=True)
    vel = Image.open(BRON / VERSIERINGEN_VEL).convert('RGBA')
    breedte, hoogte = vel.size
    stukken = [p for p in eilanden(vel.split()[3].load(), breedte, hoogte) if len(p) > 120]

    # Eerst de stukken die aan elkaar vastzitten uit elkaar halen.
    uitgesplitst = []
    for punten in stukken:
        vak = kader(punten)
        grenzen = next((g for k, g in SPLITSEN if k == vak), None)
        uitgesplitst.extend(splits(punten, grenzen) if grenzen else [punten])

    # Daarna elk stuk bij zijn versiering leggen.
    bij_sleutel = {sleutel: [] for sleutel, _n, _s, _k in VERSIERINGEN}
    overgeslagen, zwevend = 0, []
    for punten in uitgesplitst:
        punt = midden(punten)
        if any(in_kader(punt, vak) for _naam, vak in WEGGELATEN):
            overgeslagen += 1
            continue
        hoort_bij = next((s for s, _n, _so, vak in VERSIERINGEN if in_kader(punt, vak)), None)
        if hoort_bij is None:
            zwevend.append((punt, len(punten)))
            continue
        bij_sleutel[hoort_bij].extend(punten)

    leeg = [s for s, punten in bij_sleutel.items() if not punten]
    if leeg or zwevend:
        raise SystemExit(
            f'Leeg gebleven: {leeg}\nBuiten elk kader: {zwevend}\n'
            'Kijk op het controlevel welk kader niet klopt; zie docs/taartenatelier-assets.md.')
    print(f'{overgeslagen} stukken overgeslagen (zijaanzicht)')

    uit = []
    for sleutel, naam, soort, _vak in VERSIERINGEN:
        maat = schrijf(vel, bij_sleutel[sleutel], VERSIERING_UIT / f'{sleutel}.webp')
        uit.append({'id': sleutel, 'naam': naam, 'soort': soort, 'breedte': maat[0], 'hoogte': maat[1]})
    return uit


def controlevel(versieringen):
    kol, cel = 9, 130
    rijen = (len(versieringen) + kol - 1) // kol
    vel = Image.new('RGB', (kol * cel, rijen * cel), (245, 240, 235))
    tekenaar = ImageDraw.Draw(vel)
    for i, item in enumerate(versieringen):
        stuk = Image.open(VERSIERING_UIT / f"{item['id']}.webp").convert('RGBA')
        stuk.thumbnail((cel - 26, cel - 26))
        cx, cy = (i % kol) * cel, (i // kol) * cel
        vel.paste(stuk, (cx + (cel - stuk.width) // 2, cy + 18 + (cel - 26 - stuk.height) // 2), stuk)
        tekenaar.rectangle([cx, cy, cx + cel - 1, cy + cel - 1], outline=(205, 195, 185))
        tekenaar.text((cx + 5, cy + 4), item['id'][:16], fill=(70, 58, 48))
    vel.save('/tmp/taart-controlevel.png')


def schrijf_catalogus(taarten, versieringen):
    """Zet de uitgeknipte bestanden om in één TypeScript-lijst."""
    regels = ["// Gemaakt door scripts/knipTaartAssets.py. Niet met de hand bijwerken.",
              "import type { TaartBodem, Versiering } from './types';", "",
              "export const TAART_BODEMS: TaartBodem[] = ["]
    for t in taarten:
        regels.append(f"  {{ id: '{t['id']}', naam: '{t['naam']}', beeld: '/assets/library/cooking/taarten/{t['id']}.webp' }},")
    regels += ["];", "", "export const VERSIERINGEN: Versiering[] = ["]
    for v in versieringen:
        verhouding = round(v['breedte'] / v['hoogte'], 3)
        regels.append(f"  {{ id: '{v['id']}', naam: '{v['naam']}', soort: '{v['soort']}', verhouding: {verhouding}, beeld: '/assets/library/cooking/versieringen/{v['id']}.webp' }},")
    regels += ["];", "",
               "export const TAART_BODEMS_BY_ID = Object.fromEntries(TAART_BODEMS.map(item => [item.id, item]));",
               "export const VERSIERINGEN_BY_ID = Object.fromEntries(VERSIERINGEN.map(item => [item.id, item]));", ""]
    pathlib.Path('data/cake/catalog.ts').write_text("\n".join(regels))


if __name__ == '__main__':
    taarten = knip_taarten()
    if (BRON / VORMEN_VEL).exists():
        taarten = taarten + knip_vormen()
    versieringen = knip_versieringen()
    controlevel(versieringen)
    schrijf_catalogus(taarten, versieringen)
    print(json.dumps({'taarten': len(taarten), 'versieringen': len(versieringen)}))
    print('controlevel: /tmp/taart-controlevel.png')
