// Basemap styles built from the live Material color roles, so the map re-tints with the sky.
// Vector: OpenFreeMap (OpenMapTiles schema, keyless). Satellite: Esri World Imagery + vector labels on top.
import type { StyleSpecification, LayerSpecification, ExpressionSpecification } from 'maplibre-gl';

export type Palette = Record<'surface' | 'low' | 'container' | 'high' | 'highest' | 'onSurface' | 'onVariant' | 'outline' | 'primary' | 'primaryContainer', string>;

/** Weather overlays are inserted directly below this layer: above land/water/roads, below borders/labels. */
export const SLOT = 'boundary-state';

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(`--md-${n}`).trim() || '#808080';
  return {
    surface: v('surface'), low: v('surface-container-low'), container: v('surface-container'), high: v('surface-container-high'),
    highest: v('surface-container-highest'), onSurface: v('on-surface'), onVariant: v('on-surface-variant'), outline: v('outline-variant'),
    primary: v('primary'), primaryContainer: v('primary-container'),
  };
}

const hex = (h: string) => { const s = h.replace('#', ''); const f = s.length === 3 ? s.split('').map(x => x + x).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
export function mix(a: string, b: string, t: number) {
  const A = hex(a), B = hex(b);
  return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join('');
}

const NAME: ExpressionSpecification = ['coalesce', ['get', 'name:latin'], ['get', 'name']];
const NAME_EN: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
const REG = ['Noto Sans Regular'], BOLD = ['Noto Sans Bold'], IT = ['Noto Sans Italic'];

export function buildStyle({ dark, satellite, p }: { dark: boolean; satellite: boolean; p: Palette }): StyleSpecification {
  const land = dark ? mix(p.high, p.container, 0.35) : mix(p.low, '#ffffff', 0.35);
  const water = dark ? mix(p.surface, p.primary, 0.1) : mix(p.primaryContainer, land, 0.38);
  const green = mix(land, dark ? '#4f9a62' : '#7cc48a', dark ? 0.14 : 0.2);
  const road = mix(land, p.onSurface, dark ? 0.13 : 0.11);
  const major = mix(land, p.onSurface, dark ? 0.24 : 0.2);
  const border = mix(land, p.onVariant, 0.6);
  const ink = satellite ? '#ffffff' : p.onSurface;
  const inkSoft = satellite ? 'rgba(255,255,255,.86)' : p.onVariant;
  const halo = satellite ? 'rgba(0,0,0,.72)' : land;

  const layers: LayerSpecification[] = [];
  if (satellite) {
    layers.push({ id: 'bg', type: 'background', paint: { 'background-color': '#0b0d10' } });
    layers.push({ id: 'imagery', type: 'raster', source: 'esri', paint: { 'raster-saturation': -0.08, 'raster-contrast': 0.06, 'raster-brightness-max': dark ? 0.86 : 1 } });
    layers.push({ id: 'road-major', type: 'line', source: 'ofm', 'source-layer': 'transportation', minzoom: 6, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk']]],
      paint: { 'line-color': 'rgba(255,255,255,.32)', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 2] } });
  } else {
    layers.push(
      { id: 'bg', type: 'background', paint: { 'background-color': land } },
      { id: 'landcover', type: 'fill', source: 'ofm', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest', 'grass']]], paint: { 'fill-color': green, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 9, 0.8] } },
      { id: 'ice', type: 'fill', source: 'ofm', 'source-layer': 'landcover', filter: ['==', ['get', 'class'], 'ice'], paint: { 'fill-color': mix(land, '#ffffff', dark ? 0.08 : 0.6) } },
      { id: 'park', type: 'fill', source: 'ofm', 'source-layer': 'park', paint: { 'fill-color': green, 'fill-opacity': 0.6 } },
      { id: 'residential', type: 'fill', source: 'ofm', 'source-layer': 'landuse', minzoom: 8, filter: ['==', ['get', 'class'], 'residential'], paint: { 'fill-color': mix(land, p.onSurface, 0.05) } },
      { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': water } },
      { id: 'waterway', type: 'line', source: 'ofm', 'source-layer': 'waterway', minzoom: 6, filter: ['==', ['get', 'class'], 'river'], paint: { 'line-color': water, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 12, 2.5] } },
      { id: 'road-minor', type: 'line', source: 'ofm', 'source-layer': 'transportation', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': road, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 13, 2] } },
      { id: 'road-major', type: 'line', source: 'ofm', 'source-layer': 'transportation', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': major, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.4, 8, 1, 13, 3] } },
    );
  }
  layers.push(
    { id: SLOT, type: 'line', source: 'ofm', 'source-layer': 'boundary', minzoom: 4, filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
      paint: { 'line-color': satellite ? 'rgba(255,255,255,.35)' : border, 'line-opacity': 0.5, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.5, 10, 1.2], 'line-dasharray': [3, 2] } },
    { id: 'boundary-country', type: 'line', source: 'ofm', 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1], ['!=', ['get', 'disputed'], 1]],
      layout: { 'line-join': 'round' }, paint: { 'line-color': satellite ? 'rgba(255,255,255,.6)' : border, 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 8, 1.6] } },
    { id: 'lbl-water', type: 'symbol', source: 'ofm', 'source-layer': 'water_name', filter: ['==', ['geometry-type'], 'Point'],
      layout: { 'text-field': NAME_EN, 'text-font': IT, 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 8, 13], 'text-letter-spacing': 0.15, 'text-max-width': 6 },
      paint: { 'text-color': satellite ? 'rgba(200,225,255,.8)' : mix(water, p.primary, dark ? 0.55 : 0.7), 'text-halo-color': satellite ? 'rgba(0,0,0,.5)' : water, 'text-halo-width': 1 } },
    { id: 'lbl-village', type: 'symbol', source: 'ofm', 'source-layer': 'place', minzoom: 10, filter: ['in', ['get', 'class'], ['literal', ['village', 'suburb']]],
      layout: { 'text-field': NAME, 'text-font': REG, 'text-size': 11 }, paint: { 'text-color': inkSoft, 'text-halo-color': halo, 'text-halo-width': 1.4 } },
    { id: 'lbl-town', type: 'symbol', source: 'ofm', 'source-layer': 'place', minzoom: 7, filter: ['==', ['get', 'class'], 'town'],
      layout: { 'text-field': NAME, 'text-font': REG, 'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 12, 14] }, paint: { 'text-color': inkSoft, 'text-halo-color': halo, 'text-halo-width': 1.4 } },
    { id: 'lbl-city', type: 'symbol', source: 'ofm', 'source-layer': 'place', minzoom: 3, filter: ['==', ['get', 'class'], 'city'],
      layout: { 'text-field': NAME, 'text-font': ['step', ['zoom'], ['literal', REG], 6, ['literal', BOLD]], 'text-size': ['interpolate', ['linear'], ['zoom'], 3, ['case', ['<=', ['coalesce', ['get', 'rank'], 9], 3], 12, 10], 10, 17], 'symbol-sort-key': ['coalesce', ['get', 'rank'], 9] },
      paint: { 'text-color': ink, 'text-halo-color': halo, 'text-halo-width': 1.6 } },
    { id: 'lbl-state', type: 'symbol', source: 'ofm', 'source-layer': 'place', minzoom: 6, maxzoom: 9, filter: ['==', ['get', 'class'], 'state'],
      layout: { 'text-field': NAME, 'text-font': BOLD, 'text-size': 10, 'text-transform': 'uppercase', 'text-letter-spacing': 0.2, 'text-max-width': 8 },
      paint: { 'text-color': inkSoft, 'text-opacity': 0.45, 'text-halo-color': halo, 'text-halo-width': 1 } },
    { id: 'lbl-country', type: 'symbol', source: 'ofm', 'source-layer': 'place', maxzoom: 8, filter: ['==', ['get', 'class'], 'country'],
      layout: { 'text-field': NAME_EN, 'text-font': BOLD, 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 14], 'text-transform': 'uppercase', 'text-letter-spacing': 0.18, 'text-max-width': 7 },
      paint: { 'text-color': inkSoft, 'text-halo-color': halo, 'text-halo-width': 1.4 } },
  );

  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      ofm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' },
      ...(satellite ? { esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' } } : {}),
    } as any,
    layers,
  };
}
