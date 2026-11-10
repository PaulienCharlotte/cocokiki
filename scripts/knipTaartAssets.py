"""Knipt de twee contactvellen van het taartenatelier in losse WebP-bestanden.

Eenmalig werk. De taartbodems staan in een net raster van 3 x 2; de
versieringen niet. Die laatste worden gevonden als samenhangende eilanden van
niet-doorzichtige pixels, waarna losse stukjes (de pareltjes, de sprinkles, de
kruimels) bij hun buur worden getrokken. Bij het uitknippen schrijven we
alleen de pixels van de versiering zelf, zodat een buur die toevallig in het
kader valt niet mee komt.

Gebruik:  python3 scripts/knipTaartAssets.py
"""
from collections import deque
from pathlib import Path
import json
import pathlib

from PIL import Image, ImageDraw

BRON = Path('_inbox-taartenatelier')
TAARTEN_UIT = Path('public/assets/library/cooking/taarten')
VERSIERING_UIT = Path('public/assets/library/cooking/versieringen')
DREMPEL = 30

TAARTEN = [
    ('wit', 'Witte taart'), ('roze', 'Roze taart'), ('blauw', 'Blauwe taart'),
    ('wit-rand', 'Witte taart met slagroomrand'), ('roze-rand', 'Roze taart met slagroomrand'),
    ('blauw-rand', 'Blauwe taart met slagroomrand'),
]

# De versieringen in leesvolgorde van het vel, met hun groep.
VERSIERINGEN = [
    ('slagroom-wit', 'Witte toef', 'slagroom'), ('slagroom-roze', 'Roze toef', 'slagroom'),
    ('slagroom-chocolade', 'Chocoladetoef', 'slagroom'), ('meringues', 'Meringues', 'slagroom'),
    ('pareltjes', 'Parelballetjes', 'snoep'), ('sprinkles', 'Sprinkles', 'snoep'),
    ('sterretjes', 'Sterretjes', 'snoep'), ('hartjes', 'Hartjes', 'snoep'),
    ('aardbei', 'Aardbei', 'fruit'), ('blauwe-bessen', 'Blauwe bessen', 'fruit'),
    ('framboos', 'Framboos', 'fruit'), ('banaan', 'Banaan', 'fruit'),
    ('kiwi', 'Kiwi', 'fruit'), ('mandarijn', 'Mandarijn', 'fruit'), ('kersen', 'Kersen', 'fruit'),
    ('chocoladekrullen', 'Chocoladekrullen', 'chocolade'), ('chocoladestukjes', 'Chocoladestukjes', 'chocolade'),
    ('chocoladedruppels', 'Chocoladedruppels', 'chocolade'), ('krokante-nootjes', 'Krokante nootjes', 'chocolade'),
    ('honingkorrels', 'Honingkorrels', 'chocolade'), ('chocoladekruimels', 'Chocoladekruimels', 'chocolade'),
    ('koekje-chocolade', 'Chocoladekoekje', 'chocolade'), ('chocoladehart', 'Chocoladehart', 'chocolade'),
    ('wafelrolletjes', 'Wafelrolletjes', 'chocolade'),
    ('madeliefje', 'Madeliefje', 'versiering'), ('bloem-roze', 'Roze bloem', 'versiering'),
    ('bloem-paars', 'Paarse bloem', 'versiering'), ('roos', 'Roos', 'versiering'),
    ('blaadjes', 'Blaadjes', 'versiering'), ('strik', 'Strik', 'versiering'),
    ('kroontje', 'Kroontje', 'versiering'), ('regenboog', 'Regenboog', 'versiering'),
    ('eenhoorn', 'Eenhoorn', 'versiering'),
    ('vlinder', 'Vlinder', 'versiering'), ('lolly-ster', 'Sterlolly', 'snoep'),
    ('lolly-hart', 'Hartlolly', 'snoep'), ('lolly-spiraal', 'Spiraallolly', 'snoep'),
    ('sprankel', 'Sterretje', 'versiering'), ('kaars-roze', 'Roze kaarsje', 'versiering'),
    ('kaars-blauw', 'Blauw kaarsje', 'versiering'), ('kaars-paars', 'Paars kaarsje', 'versiering'),
    ('kaars-geel', 'Geel kaarsje', 'versiering'), ('slinger', 'Slinger', 'versiering'),
    ('chocoladeglazuur', 'Chocoladeglazuur', 'chocolade'),
    ('viooltje', 'Viooltje', 'versiering'), ('bloesem', 'Bloesem', 'versiering'),
    ('muntblaadjes', 'Muntblaadjes', 'versiering'), ('snoephartjes', 'Snoephartjes', 'snoep'),
    ('snoepdruppels', 'Snoepdruppels', 'snoep'), ('macarons', 'Macarons', 'chocolade'),
    ('donut', 'Donut', 'chocolade'), ('sterkoekje', 'Sterkoekje', 'chocolade'),
    ('hartkoekje', 'Hartkoekje', 'chocolade'), ('koekje-stukjes', 'Chocolate-chipkoekje', 'chocolade'),
]


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


def groepeer(stukken, gat=10, klein=2200):
    """Trekt kleine losse stukjes bij hun buur; twee hele versieringen nooit."""
    groepen = [list(s) for s in stukken]
    veranderd = True
    while veranderd:
        veranderd = False
        for i in range(len(groepen)):
            if groepen[i] is None:
                continue
            for j in range(i + 1, len(groepen)):
                if groepen[j] is None:
                    continue
                if min(len(groepen[i]), len(groepen[j])) >= klein:
                    continue
                if afstand(kader(groepen[i]), kader(groepen[j])) > gat:
                    continue
                groepen[i] = groepen[i] + groepen[j]
                groepen[j] = None
                veranderd = True
    return [g for g in groepen if g and len(g) > 300]


def splits_op_gat(punten):
    """Splitst een groep bij de dunste kolom in het midden; voor twee buren
    die elkaar net raken en daardoor in één kader belandden."""
    x1, _, x2, _ = kader(punten)
    per_kolom = {}
    for x, _y in punten:
        per_kolom[x] = per_kolom.get(x, 0) + 1
    marge = (x2 - x1) // 4
    zoek = range(x1 + marge, x2 - marge + 1)
    midden = min(zoek, key=lambda x: per_kolom.get(x, 0))
    links = [p for p in punten if p[0] <= midden]
    rechts = [p for p in punten if p[0] > midden]
    return [links, rechts] if links and rechts else [punten]


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
    vel = Image.open(BRON / 'taartbodems-contactvel.webp').convert('RGBA')
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


def knip_versieringen():
    VERSIERING_UIT.mkdir(parents=True, exist_ok=True)
    vel = Image.open(BRON / 'versieringen-contactvel.webp').convert('RGBA')
    breedte, hoogte = vel.size
    groepen = groepeer(eilanden(vel.split()[3].load(), breedte, hoogte))
    groepen.sort(key=lambda g: (kader(g)[1] // 110, kader(g)[0]))

    # Twee handmatige correcties, nagekeken op het controlevel:
    # de pareltjes vielen in twee stukken, de donut en het sterkoekje in één.
    samen = groepen[4] + groepen[5]
    groepen = groepen[:4] + [samen] + groepen[6:]
    donut_ster = next(i for i, g in enumerate(groepen) if kader(g)[1] > 630 and kader(g)[2] - kader(g)[0] > 180)
    groepen = groepen[:donut_ster] + splits_op_gat(groepen[donut_ster]) + groepen[donut_ster + 1:]

    if len(groepen) != len(VERSIERINGEN):
        raise SystemExit(f'{len(groepen)} versieringen gevonden, {len(VERSIERINGEN)} namen bekend')
    uit = []
    for groep, (sleutel, naam, soort) in zip(groepen, VERSIERINGEN):
        maat = schrijf(vel, groep, VERSIERING_UIT / f'{sleutel}.webp')
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
    versieringen = knip_versieringen()
    controlevel(versieringen)
    schrijf_catalogus(taarten, versieringen)
    print(json.dumps({'taarten': len(taarten), 'versieringen': len(versieringen)}))
    print('controlevel: /tmp/taart-controlevel.png')
