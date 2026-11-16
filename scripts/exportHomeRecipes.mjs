import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Embed the existing tokens: downloaded recipes work offline without textures or external fonts.
const tokens = (await Promise.all(['design-system/tokens.css', 'styles/cocokiki-tokens.css'].map(path => readFile(path, 'utf8')))).map(css => css.match(/:root\s*\{[\s\S]*?\}/)?.[0] ?? '').join('\n');
const recipeStyles = `${tokens}
*{box-sizing:border-box}body{margin:0;padding:var(--space-6);font:var(--font-size-md)/var(--line-height-default) system-ui,sans-serif;color:var(--ck-cacao);background:var(--ck-room)}
.print-sheet{max-width:48rem;margin:auto;padding:var(--space-8);background:white;border-radius:var(--radius-card);box-shadow:var(--shadow-soft)}
.brand{display:flex;justify-content:space-between;gap:var(--space-4);padding-bottom:var(--space-4);border-bottom:2px solid var(--ck-hout-licht);color:var(--ck-hout-donker)}.brand strong{font-size:var(--font-size-xl);font-weight:900}.brand span{align-self:center}
h2{font-size:var(--font-size-2xl);line-height:var(--line-height-tight);margin:var(--space-6) 0 var(--space-3)}h3{font-size:var(--font-size-lg);color:var(--ck-hout-donker);margin:var(--space-6) 0 var(--space-2);break-after:avoid}p{margin:var(--space-2) 0}ul,ol{padding-left:var(--space-6)}li{padding-left:var(--space-1);margin-bottom:var(--space-2);break-inside:avoid}footer{margin-top:var(--space-8);padding-top:var(--space-3);border-top:1px solid var(--ck-hout-licht);font-size:var(--font-size-sm);color:var(--ck-cacao-zacht)}
@media(max-width:600px){body{padding:var(--space-3)}.print-sheet{padding:var(--space-4)}.brand{flex-wrap:wrap}}
@page{size:A4;margin:16mm}@media print{body{padding:0;color:#222;background:white;font-size:11pt}.print-sheet{max-width:none;padding:0;border-radius:0;box-shadow:none}h2{font-size:22pt}h3{font-size:13pt}p,li{orphans:3;widows:3}.brand,footer{color:#4A2A1A}a{color:inherit;text-decoration:none}}
`;
const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null, ws: false }, appType: 'custom' });
try {
  const { RECIPES } = await server.ssrLoadModule('/data/cooking/catalog.ts');
  const { HomeRecipeContent } = await server.ssrLoadModule('/components/cooking/HomeRecipe.tsx');
  await mkdir('public/recipes', { recursive: true });
  for (const recipe of RECIPES.filter(item => item.homeRecipe)) {
    const title = recipe.name.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const body = renderToStaticMarkup(React.createElement(HomeRecipeContent, { recipe }));
    await writeFile(`public/recipes/${recipe.id}.html`, `<!doctype html>\n<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | CocoKiki</title><style>${recipeStyles}</style></head><body><main class="print-sheet"><header class="brand"><strong>CocoKiki</strong><span>Uit het kookboek van Coco</span></header>${body}<footer>CocoKiki · Samen koken</footer></main></body></html>\n`);
  }
  console.log('Thuisrecepten geëxporteerd.');
} finally { await server.close(); }
