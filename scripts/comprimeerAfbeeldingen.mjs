// Maakt grote WebP-afbeeldingen in public/ lichter, zonder de afmetingen of de
// bestandsnaam te veranderen. Een plaatje wordt alleen vervangen als het
// minstens 15% kleiner wordt. De originelen staan in git.
// Gebruik: node scripts/comprimeerAfbeeldingen.mjs [--droog]
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public');
const MIN_BYTES = 250 * 1024;
const KWALITEIT = 78;
const droog = process.argv.includes('--droog');

async function* bestanden(map) {
  for (const naam of await readdir(map, { withFileTypes: true })) {
    const pad = path.join(map, naam.name);
    if (naam.isDirectory()) yield* bestanden(pad);
    else if (naam.name.endsWith('.webp')) yield pad;
  }
}

let voor = 0, na = 0, vervangen = 0;
for await (const pad of bestanden(ROOT)) {
  const { size } = await stat(pad);
  if (size < MIN_BYTES) continue;
  const bron = await readFile(pad);
  const nieuw = await sharp(bron).webp({ quality: KWALITEIT, effort: 6, alphaQuality: 90, smartSubsample: true }).toBuffer();
  voor += size;
  if (nieuw.length <= size * 0.85) {
    na += nieuw.length; vervangen++;
    if (!droog) await writeFile(pad, nieuw);
    console.log(`${Math.round(size / 1024)} → ${Math.round(nieuw.length / 1024)} kB  ${path.relative(ROOT, pad)}`);
  } else na += size;
}
console.log(`\n${vervangen} vervangen. Totaal ${(voor / 1048576).toFixed(1)} MB → ${(na / 1048576).toFixed(1)} MB${droog ? ' (droog, niets geschreven)' : ''}`);
