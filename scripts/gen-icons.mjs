// Regenerates the static Tomato (red rabbit) icons from src/lib/rabbit.ts.
// Usage: node scripts/gen-icons.mjs   (Node 22.18+, which strips the TS types on import)
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { rabbitDoc, rabbitSvg } from '../src/lib/rabbit.ts';

const sharp = createRequire(import.meta.url)('sharp');
const root = new URL('..', import.meta.url);
const out = (p, data) => { writeFileSync(new URL(p, root), data); console.log('wrote', p); };

const mark = rabbitDoc() + '\n';
out('public/tomato.svg', mark);
out('public/favicon.svg', mark);
out('src/app/icon.svg', mark);

// App icon: rabbit on a warm tile, padded for the maskable safe zone.
const tile = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs><radialGradient id="bg" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#fff4ec"/><stop offset="1" stop-color="#ffd9c7"/></radialGradient></defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <svg x="96" y="92" width="320" height="320" viewBox="0 0 128 128">${rabbitSvg({ face: true, mood: 'happy', whiskers: true })}</svg>
</svg>\n`;
out('public/icon.svg', tile(512));
for (const [file, size] of [['public/icon-192.png', 192], ['public/icon-512.png', 512], ['public/apple-touch-icon.png', 180]]) {
  await sharp(Buffer.from(tile(size))).png().toFile(new URL(file, root).pathname);
  console.log('wrote', file);
}
