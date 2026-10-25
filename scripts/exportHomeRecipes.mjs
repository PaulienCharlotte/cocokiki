import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null, ws: false }, appType: 'custom' });
try {
  const { RECIPES } = await server.ssrLoadModule('/data/cooking/catalog.ts');
  const { HomeRecipeContent } = await server.ssrLoadModule('/components/cooking/HomeRecipe.tsx');
  await mkdir('public/recipes', { recursive: true });
  for (const recipe of RECIPES.filter(item => item.homeRecipe)) {
    const title = recipe.name.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const body = renderToStaticMarkup(React.createElement(HomeRecipeContent, { recipe }));
    await writeFile(`public/recipes/${recipe.id}.html`, `<!doctype html>\n<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | CocoKiki</title><style>body{margin:0;padding:24px;font:18px/1.6 system-ui,sans-serif;color:#37332e;background:#faf8f2}article{max-width:720px;margin:auto}h2{font-size:30px;line-height:1.2}h3{color:#50694b}li{margin-bottom:12px}ol{padding-left:26px}@media print{body{padding:0;background:white;font-size:12pt}h3{break-after:avoid}li{break-inside:avoid}}</style></head><body>${body}<footer style="max-width:720px;margin:32px auto">CocoKiki · Samen koken</footer></body></html>\n`);
  }
  console.log('Thuisrecepten geëxporteerd.');
} finally { await server.close(); }
