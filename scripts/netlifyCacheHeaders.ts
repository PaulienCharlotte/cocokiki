import type { Plugin } from 'vite';

/** Alleen door Vite gehashte bestanden zijn onveranderlijk. Library-URL's niet. */
export function netlifyCacheHeaders(files: string[]): string {
  const hashed = files.filter(file => /^assets\/.+-[\w-]{8,}\.(?:js|css|webp|png|svg|woff2?)$/.test(file)).sort();
  return [
    '# Automatisch gegenereerd door de lokale production build.',
    ...hashed.map(file => `/${file}\n  Cache-Control: public, max-age=31536000, immutable`),
    '/*\n  Cache-Control: public, max-age=0, must-revalidate',
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
