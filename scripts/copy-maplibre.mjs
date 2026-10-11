// MapLibre 6 resolves its web worker at runtime (new URL(..., import.meta.url)), which bundlers can't follow.
// Serve the worker + its shared chunk from /maplibre and point setWorkerUrl at it (see components/map/).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const dist = dirname(createRequire(import.meta.url).resolve('maplibre-gl/package.json')) + '/dist';
const out = join(process.cwd(), 'public', 'maplibre');
mkdirSync(out, { recursive: true });
for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) copyFileSync(join(dist, f), join(out, f));
