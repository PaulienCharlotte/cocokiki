import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const publicRoot = path.join(projectRoot, 'public');
const outputPath = path.join(publicRoot, 'assets', 'library', 'inventory.json');
const assetExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  }));
  return files.flat();
}

const assets = (await walk(publicRoot))
  .filter(file => assetExtensions.has(path.extname(file).toLowerCase()))
  .map(file => {
    const relative = path.relative(publicRoot, file).split(path.sep).join('/');
    const parts = relative.split('/');
    return {
      id: relative.replace(/\.[^.]+$/, '').replaceAll('/', ':'),
      path: `/${relative}`,
      category: parts[0] === 'assets' && parts[1] === 'library' ? parts[2] ?? 'library' : parts[0],
      format: path.extname(relative).slice(1).toLowerCase(),
    };
  })
  .sort((left, right) => left.path.localeCompare(right.path));

await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: assets.length, assets }, null, 2)}\n`);
console.log(`Assetinventaris bijgewerkt: ${assets.length} bestanden`);
