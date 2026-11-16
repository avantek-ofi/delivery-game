"""Genera src/game/geo.ts a partir de GeoJSON públicos.

Uso: python3 scripts/build-geo.py <barrios_caba_epsg3857.geojson> <partidos_bsas_epsg4326.geojson>

- Barrios de CABA: dataset oficial de 48 barrios (simplificado a 50 m, EPSG:3857).
- Partidos del conurbano: click_that_hood/buenos-aires.geojson (EPSG:4326).

Salida: polígonos en "unidades de mapa" (1 unidad = 100 m reales, norte arriba),
una grilla de celdas de 300 m (≈3 cuadras) con el área a la que pertenece cada
celda, y las avenidas principales rasterizadas sobre esa grilla para el ruteo.
"""
import json
import math
import sys
import unicodedata

R = 6378137.0
LAT0 = math.radians(-34.61)
K = math.cos(LAT0)  # metros mercator -> metros reales en esta latitud
VIEW = (-6527500.0, -4135500.0, -6488500.0, -4089500.0)  # minx, miny, maxx, maxy (mercator)
CELL_M = 300.0  # metros reales por celda
UNIT_M = 100.0  # metros reales por unidad de mapa

CONURBANO = {
    'Vicente López': ('Norte', 1.3, .25), 'San Isidro': ('Norte', 1.4, .2), 'San Fernando': ('Norte', 1.05, .35),
    'General San Martín': ('Oeste', .95, .45), 'Tres De Febrero': ('Oeste', 1.0, .4), 'Hurlingham': ('Oeste', .95, .4),
    'Morón': ('Oeste', 1.05, .35), 'Ituzaingó': ('Oeste', 1.0, .35), 'La Matanza': ('Oeste', .85, .6),
    'Avellaneda': ('Sur', .95, .5), 'Lanús': ('Sur', .95, .5), 'Lomas De Zamora': ('Sur', .9, .55), 'Quilmes': ('Sur', .9, .55),
    'Tigre': ('Norte', 1.15, .3), 'Esteban Echeverría': ('Sur', .85, .55), 'Almirante Brown': ('Sur', .85, .55),
}

# Avenidas principales aproximadas (lon, lat)
AVENUES = {
    'Av. Rivadavia': [(-58.3707, -34.6083), (-58.3923, -34.6094), (-58.4180, -34.6150), (-58.4400, -34.6200), (-58.4630, -34.6283), (-58.4830, -34.6290), (-58.5050, -34.6340), (-58.5290, -34.6390)],
    'Av. 9 de Julio': [(-58.3790, -34.5900), (-58.3816, -34.6037), (-58.3818, -34.6170), (-58.3812, -34.6280)],
    'Av. del Libertador': [(-58.3760, -34.5880), (-58.3930, -34.5830), (-58.4100, -34.5750), (-58.4300, -34.5640), (-58.4470, -34.5520), (-58.4600, -34.5420), (-58.4700, -34.5330)],
    'Av. Santa Fe / Cabildo': [(-58.3790, -34.5950), (-58.3990, -34.5940), (-58.4120, -34.5880), (-58.4330, -34.5800), (-58.4500, -34.5660), (-58.4600, -34.5560), (-58.4720, -34.5440)],
    'Av. Corrientes': [(-58.3700, -34.6030), (-58.3920, -34.6040), (-58.4110, -34.6040), (-58.4330, -34.5980), (-58.4500, -34.5880)],
    'Av. Juan B. Justo': [(-58.4260, -34.5790), (-58.4400, -34.5880), (-58.4540, -34.5980), (-58.4720, -34.6100), (-58.4900, -34.6250), (-58.5150, -34.6380)],
    'Av. General Paz': [(-58.4650, -34.5340), (-58.4850, -34.5450), (-58.5050, -34.5600), (-58.5200, -34.5780), (-58.5300, -34.6050), (-58.5300, -34.6350), (-58.5180, -34.6600), (-58.4930, -34.6850), (-58.4650, -34.7030)],
    'Av. Directorio / Eva Perón': [(-58.4300, -34.6300), (-58.4550, -34.6380), (-58.4800, -34.6470), (-58.5050, -34.6600)],
    'Av. Belgrano / Independencia': [(-58.3720, -34.6130), (-58.3950, -34.6180), (-58.4200, -34.6230), (-58.4400, -34.6320)],
    'Av. Paseo Colón / Almirante Brown': [(-58.3690, -34.6090), (-58.3680, -34.6230), (-58.3640, -34.6330), (-58.3570, -34.6400)],
    'Av. Pueyrredón / Jujuy': [(-58.3950, -34.5880), (-58.4030, -34.6000), (-58.4040, -34.6180), (-58.4040, -34.6380)],
    'Av. San Martín / Triunvirato': [(-58.4500, -34.5880), (-58.4700, -34.5800), (-58.4840, -34.5680), (-58.4980, -34.5540)],
}


def merc(lon, lat):
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def to_units(x, y):
    return ((x - VIEW[0]) * K / UNIT_M, (VIEW[3] - y) * K / UNIT_M)


def slug(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return ''.join(c if c.isalnum() else '-' for c in s).strip('-').replace('--', '-')


def dp(points, eps):
    if len(points) < 4:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    best, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm if norm > 1e-9 else math.hypot(px - x1, py - y1)
        if d > best:
            best, idx = d, i
    if best > eps:
        left = dp(points[:idx + 1], eps)
        return left[:-1] + dp(points[idx:], eps)
    return [points[0], points[-1]]


def rings_of(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    return [poly[0] for poly in polys]  # solo anillo exterior


def inside(px, py, ring):
    c = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / ((yj - yi) or 1e-12) + xi:
            c = not c
        j = i
    return c


def main(barrios_path, partidos_path):
    areas = []
    for f in json.load(open(barrios_path))['features']:
        name = f['properties']['BARRIO'].title().replace('Nuñez', 'Núñez').replace('Constitucion', 'Constitución').replace('Agronomia', 'Agronomía').replace('San Nicolas', 'San Nicolás').replace('San Cristobal', 'San Cristóbal').replace('Velez Sarsfield', 'Vélez Sarsfield').replace('Villa Gral. Mitre', 'Villa Gral. Mitre').replace('Boca', 'La Boca')
        rings = [[to_units(x, y) for x, y in ring] for ring in rings_of(f['geometry'])]
        areas.append({'id': slug(name), 'name': name, 'kind': 'barrio', 'pop': int(f['properties'].get('POBLACION') or 0), 'rings': rings})
    for f in json.load(open(partidos_path))['features']:
        name = f['properties']['name']
        if name not in CONURBANO:
            continue
        rings = [[to_units(*merc(lon, lat)) for lon, lat in ring] for ring in rings_of(f['geometry'])]
        areas.append({'id': slug(name), 'name': name.replace(' De ', ' de '), 'kind': 'partido', 'pop': 0, 'rings': rings, 'region': CONURBANO[name][0]})

    W = (VIEW[2] - VIEW[0]) * K / UNIT_M
    H = (VIEW[3] - VIEW[1]) * K / UNIT_M
    cell = CELL_M / UNIT_M
    cols, rows = int(W // cell), int(H // cell)
    grid = [[-1] * cols for _ in range(rows)]
    bboxes = []
    for a in areas:
        xs = [p[0] for r in a['rings'] for p in r]
        ys = [p[1] for r in a['rings'] for p in r]
        bboxes.append((min(xs), min(ys), max(xs), max(ys)))
    for r in range(rows):
        for c in range(cols):
            px, py = (c + .5) * cell, (r + .5) * cell
            for i, a in enumerate(areas):
                bx = bboxes[i]
                if not (bx[0] <= px <= bx[2] and bx[1] <= py <= bx[3]):
                    continue
                if any(inside(px, py, ring) for ring in a['rings']):
                    # CABA tiene prioridad sobre partidos superpuestos
                    if grid[r][c] == -1 or areas[grid[r][c]]['kind'] == 'partido':
                        grid[r][c] = i
    # puentes: rellenar huecos de una celda entre áreas (Riachuelo, bordes de datasets)
    for _ in range(1):
        fill = []
        for r in range(1, rows - 1):
            for c in range(1, cols - 1):
                if grid[r][c] != -1:
                    continue
                n = [grid[r - 1][c], grid[r + 1][c], grid[r][c - 1], grid[r][c + 1]]
                land = [v for v in n if v != -1]
                if len(land) >= 3 or (grid[r][c - 1] != -1 and grid[r][c + 1] != -1) or (grid[r - 1][c] != -1 and grid[r + 1][c] != -1):
                    fill.append((r, c, land[0]))
        for r, c, v in fill:
            grid[r][c] = v

    used = sorted({v for row in grid for v in row if v != -1})
    keep = [areas[i] for i in used]
    remap = {old: new for new, old in enumerate(used)}
    mask = [''.join('.' if v == -1 else chr(192 + remap[v]) for v in row) for row in grid]

    # centro de etiqueta: celda del área más cercana al centroide de sus celdas
    out_areas = []
    for new, a in enumerate(keep):
        cells = [(r, c) for r in range(rows) for c in range(cols) if mask[r][c] == chr(192 + new)]
        my = sum(r for r, _ in cells) / len(cells)
        mx = sum(c for _, c in cells) / len(cells)
        r, c = min(cells, key=lambda rc: (rc[0] - my) ** 2 + (rc[1] - mx) ** 2)
        paths = []
        for ring in a['rings']:
            simp = dp(ring, .6 if a['kind'] == 'barrio' else 1.5)
            if len(simp) < 3:
                continue
            paths.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in simp) + 'Z')
        out_areas.append({'id': a['id'], 'name': a['name'], 'kind': a['kind'], 'region': a.get('region', ''), 'pop': a['pop'], 'cells': len(cells), 'cx': round((c + .5) * cell, 1), 'cy': round((r + .5) * cell, 1), 'path': ''.join(paths)})

    # avenidas rasterizadas
    fast = [[0] * cols for _ in range(rows)]
    avenues = []
    for name, pts in AVENUES.items():
        upts = [to_units(*merc(lon, lat)) for lon, lat in pts]
        avenues.append({'name': name, 'pts': [[round(x, 1), round(y, 1)] for x, y in upts]})
        for (x1, y1), (x2, y2) in zip(upts, upts[1:]):
            steps = int(max(abs(x2 - x1), abs(y2 - y1)) / (cell / 3)) + 1
            for k in range(steps + 1):
                x, y = x1 + (x2 - x1) * k / steps, y1 + (y2 - y1) * k / steps
                c, r = int(x // cell), int(y // cell)
                if 0 <= r < rows and 0 <= c < cols and mask[r][c] != '.':
                    fast[r][c] = 1
    fast_rows = [''.join(str(v) for v in row) for row in fast]

    data = {'w': round(W, 1), 'h': round(H, 1), 'cell': cell, 'cols': cols, 'rows': rows, 'areas': out_areas, 'avenues': avenues, 'mask': mask, 'fast': fast_rows}
    with open('src/game/geo.ts', 'w', encoding='utf-8') as fh:
        fh.write('// Archivo generado por scripts/build-geo.py. No editar a mano.\n')
        fh.write('// Fuentes: límites de barrios de CABA (datos abiertos GCBA) y partidos de la provincia de Buenos Aires (click_that_hood).\n')
        fh.write('export type GeoArea = { id: string; name: string; kind: \'barrio\' | \'partido\'; region: string; pop: number; cells: number; cx: number; cy: number; path: string }\n')
        fh.write('export const GEO: { w: number; h: number; cell: number; cols: number; rows: number; areas: GeoArea[]; avenues: { name: string; pts: [number, number][] }[]; mask: string[]; fast: string[] } = ')
        fh.write(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        fh.write('\n')
    print(f'{len(out_areas)} áreas, grilla {cols}x{rows}, {sum(r.count("1") for r in fast_rows)} celdas de avenida')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
