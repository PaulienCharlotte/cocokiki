"""Reproduceer de lokale GeoBas-kaartdata met Natural Earth v5.1.2.

Eenmalig hulpmiddel: Python + Shapely, geen runtime-dependency.
Gebruik: python scripts/prepareGeobasGeometry.py /pad/naar/ne-bronmap
Bronbestanden: ne-admin_0_countries.json, ne-geography_regions_polys.json,
ne-geography_marine_polys.json, ne-rivers_lake_centerlines.json,
ne-populated_places.json (GeoJSON uit de officiële Natural Earth-repository).
"""
import hashlib
import json
import math
import sys
from pathlib import Path
from shapely.geometry import shape, mapping, box, Point, MultiPolygon
from shapely.ops import unary_union, nearest_points

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1])
CLIP = box(-14, 34, 17, 54)
DATASET = json.loads((ROOT / 'data/topography/france-spain-portugal.json').read_text())
SOURCES = {}


def load(name):
    path = SOURCE / ('ne-' + name + '.json')
    SOURCES[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    return json.loads(path.read_text())['features']


countries = load('admin_0_countries')
regions = load('geography_regions_polys')
marine = load('geography_marine_polys')
rivers = load('rivers_lake_centerlines')
places = load('populated_places')


def named(features, name):
    return next(f for f in features if (f['properties'].get('NAME') or f['properties'].get('name')) == name)


def rounded(value):
    if isinstance(value, float):
        return round(value, 6)
    if isinstance(value, (tuple, list)):
        return [rounded(x) for x in value]
    if isinstance(value, dict):
        return {k: rounded(v) for k, v in value.items()}
    return value


def clean(geometry, tolerance=.002):
    result = geometry.intersection(CLIP).simplify(tolerance, preserve_topology=True)
    assert not result.is_empty and result.is_valid
    return result


land = unary_union([shape(f['geometry']).intersection(CLIP) for f in countries
                    if shape(f['geometry']).intersects(CLIP)])
country_names = {22: 'Andorra', 23: 'Monaco', 24: 'Spain', 25: 'Portugal',
                 26: 'France', 27: 'Luxembourg', 28: 'Belgium'}
# Ankers bepalen alleen het label; nooit de omtrek of loop van een object.
anchors = {24: [-3.7, 39.8], 25: [-8, 39.5], 26: [2, 46.6], 27: [6.1, 49.8],
           28: [4.5, 50.7], 29: [1.4, 49.1], 30: [4.7, 44.4],
           31: [-7, 46], 32: [5, 39.5], 33: [.6, 42.7], 34: [7.5, 45.6]}
features = []
audit = []
for item in DATASET['items']:
    number = item['number']
    anchor = item.get('anchor')
    point = Point(anchor['lng'], anchor['lat']) if anchor else Point(anchors[number])
    if item['geometryType'] == 'point':
        geometry = point
        nearest = min(places, key=lambda f: point.distance(shape(f['geometry'])))
        reference = shape(nearest['geometry'])
        km = math.hypot((point.x-reference.x)*math.cos(math.radians(point.y)), point.y-reference.y)*111.32
        assert km < 5, (item['name'], km)
        source_name = nearest['properties']['NAME']
        audit.append({'id': item['id'], 'reference': source_name, 'distanceKm': round(km, 2)})
    elif number in country_names:
        source_name = country_names[number]
        geometry = clean(shape(named(countries, source_name)['geometry']), .0001 if number == 23 else .002)
    elif number in [20, 21]:
        # Gebruik de kustcontour, niet het grovere fysieke labelvlak van een eiland.
        source_name = 'Spain' if number == 20 else 'France'
        country = shape(named(countries, source_name)['geometry'])
        geometry = clean(next(p for p in country.geoms if p.covers(point)))
    elif number in [29, 30]:
        source_name = 'Seine' if number == 29 else 'Rhône'
        geometry = clean(shape(named(rivers, source_name)['geometry']), .001)
        point = nearest_points(point, geometry)[1]
    elif number in [31, 32]:
        source_name = 'North Atlantic Ocean' if number == 31 else 'Mediterranean Sea'
        names = [source_name, 'Bay of Biscay'] if number == 31 else [source_name]
        # Marine labelvlakken zijn gegeneraliseerd; snijd de echte kustlijn uit.
        geometry = clean(unary_union([shape(named(marine, n)['geometry']) for n in names]).difference(land))
        if geometry.geom_type == 'GeometryCollection':
            geometry = unary_union([part for part in geometry.geoms if part.geom_type in ['Polygon', 'MultiPolygon']])
    else:
        source_name = 'PYRENEES' if number == 33 else 'ALPS'
        geometry = clean(shape(named(regions, source_name)['geometry']))
    if geometry.geom_type not in ['Point', 'MultiLineString', 'LineString'] and not geometry.covers(point):
        point = geometry.representative_point()
    properties = {'id': item['id'], 'sourceNumber': number, 'sourceName': source_name,
                  'anchor': [round(point.y, 6), round(point.x, 6)]}
    features.append({'type': 'Feature', 'properties': properties, 'geometry': rounded(mapping(geometry))})

context = [{'type': 'Feature', 'properties': {}, 'geometry': rounded(mapping(clean(shape(f['geometry']))))}
           for f in countries if shape(f['geometry']).intersects(CLIP)]
boundaries = [{'type': 'Feature', 'properties': {},
               'geometry': rounded(mapping(shape(f['geometry']).boundary.intersection(CLIP).simplify(.002)))}
              for f in countries if shape(f['geometry']).boundary.intersects(CLIP)]
output = ROOT / 'public/data/geojson/france-spain-portugal.geo.json'
output.write_text(json.dumps({'type': 'FeatureCollection', 'features': features,
                             'context': {'type': 'FeatureCollection', 'features': context},
                             'boundaries': {'type': 'FeatureCollection', 'features': boundaries}}, separators=(',', ':')) + '\n')
audit_path = ROOT / 'data/topography/france-spain-portugal-geography.json'
audit_path.write_text(json.dumps({'source': 'Natural Earth v5.1.2', 'sha256': SOURCES,
                                 'cityChecks': audit,
                                 'anchors': {f['properties']['id']: f['properties']['anchor'] for f in features}}, indent=2) + '\n')
print(f'{len(features)} onderdelen, {output.stat().st_size} bytes; {len(audit)} stadsankers gecontroleerd.')
