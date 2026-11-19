import type { Plugin } from 'vite';

const IMAGE_FOLDERS = ['assets/library', 'assets/baby-lua', 'dreamworld', 'games', 'images'];
export const IMAGE_CACHE = 'public, max-age=604800, stale-while-revalidate=86400';

/** Alleen door Vite gehashte bestanden zijn onveranderlijk. Library-URL's een week. */
export function netlifyCacheHeaders(files: string[]): string {
  const hashed = files.filter(file => /^assets\/.+-[\w-]{8,}\.(?:js|css|webp|png|svg|woff2?)$/.test(file)).sort();
  return [
    '# Automatisch gegenereerd door de lokale production build.',
    ...hashed.map(file => `/${file}\n  Cache-Control: public, max-age=31536000, immutable`),
    // Vaste afbeeldingen (geen hash in de naam): een week bewaren en op de
    // achtergrond verversen. Zo vraagt een telefoon niet bij elk bezoek elk
    // plaatje opnieuw na. Vervang je een plaatje inhoudelijk, geef het dan een
    // nieuwe naam (bijv. -v2), dan ziet iedereen het meteen.
    // HTML, JSON en de rest houden Netlify's standaard (steeds opnieuw navragen);
    // daarom geen algemene /*-regel die met deze regels zou samenvallen.
    ...IMAGE_FOLDERS.map(folder => `/${folder}/*\n  Cache-Control: ${IMAGE_CACHE}`),
    '',
  ].join('\n\n');
}

export function netlifyCaching(): Plugin {
  return {
    name: 'cocokiki-netlify-caching',
    apply: 'build',
    generateBundle(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: '_headers', source: netlifyCacheHeaders(Object.keys(bundle)) });
      // Oude links en al geopende tabbladen blijven de wereldkaart vinden.
      const worldMap = Object.keys(bundle).find(file => /^assets\/world-map-v2-[\w-]+\.webp$/.test(file));
      if (worldMap) this.emitFile({ type: 'asset', fileName: '_redirects', source: `/dreamworld/world-map-v2.png /${worldMap} 200\n` });
    },
  };
}
