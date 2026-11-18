import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PLANT_SPECIES_BY_ID } from '../data/plants/species';
import { PATIENT_KINDS, baasjeTekst, clueText, maakGeval } from '../data/plants/clinic';

/** Spraakwolken blijven kort: één gedachte, geen lappen tekst. */
const MAX_WOLK = 140;

test('wat Kiki in de plantendokter zegt is kort en spreekt zichzelf niet tegen', () => {
  for (const kind of PATIENT_KINDS) {
    const species = PLANT_SPECIES_BY_ID[kind.speciesId];
    const geval = maakGeval(kind, () => 0);
    for (const tekst of [clueText(species, geval, 'blad'), clueText(species, geval, 'aarde'), baasjeTekst(species, geval)]) {
      assert.ok(tekst.length + ' Weet je genoeg?'.length <= MAX_WOLK, `Te lang voor een wolk (${species.id}): ${tekst}`);
    }
    // Wie de aarde al beschreven krijgt, hoeft niet nog eens te voelen.
    assert.doesNotMatch(clueText(species, geval, 'aarde'), /voel (nu|eens)/i);
  }
});

function cssBestanden(map: string): string[] {
  return readdirSync(map).flatMap(naam => {
    if (naam === 'node_modules' || naam.startsWith('.') || naam === 'dist') return [];
    const pad = join(map, naam);
    return statSync(pad).isDirectory() ? cssBestanden(pad) : pad.endsWith('.css') ? [pad] : [];
  });
}

test('alleen het gedeelde onderdeel bepaalt de vorm van de spraakwolk', () => {
  for (const bestand of cssBestanden('.')) {
    if (bestand.endsWith('speech-bubble.css')) continue;
    // Bewuste uitzondering: de dorpsgids gebruikt de wolk als keuzekaart.
    if (bestand.endsWith('planet-world.css')) continue;
    const css = readFileSync(bestand, 'utf8');
    assert.doesNotMatch(css, /\.ck-zegt__wolk::before/, `${bestand} verschuift het puntje van de wolk`);
    assert.doesNotMatch(css, /(^|\})\s*\.ck-zegt\s*\{/m, `${bestand} maakt een eigen variant van de wolk`);
  }
});

test('geen tekst kleiner dan 16 px in de stijlbestanden', () => {
  const klein = /font-size:\s*(0?\.\d+r?em|1[0-5](\.\d+)?px|[0-9](\.\d+)?px)/;
  for (const bestand of cssBestanden('.')) {
    if (bestand.includes('docs/')) continue;
    for (const regel of readFileSync(bestand, 'utf8').split('\n')) {
      if (regel.includes('bewuste uitzondering')) continue;
      assert.doesNotMatch(regel, klein, `${bestand}: ${regel.trim().slice(0, 90)}`);
    }
  }
});

test('zijmenu\'s met gereedschap staan altijd links', () => {
  // De basisregel in cocokiki-tokens.css wordt voor .ck-scherm al naar links gezet.
  // Een eigen 'right:' zonder 'left:' zet het menu terug naar rechts; een
  // liggende balk op een smal scherm heeft allebei.
  for (const bestand of cssBestanden('.')) {
    // treehouse-unit-test.css is een ontwikkelpagina met een actiebalk onderin, geen zijmenu.
    if (bestand.includes('docs/') || bestand.endsWith('cocokiki-tokens.css') || bestand.endsWith('treehouse-unit-test.css')) continue;
    const css = readFileSync(bestand, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selector, regels] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/gereedschap|__balk|toolbar/.test(selector)) continue;
      const rechts = /(^|;|\s)right:\s*(?!auto)/.test(regels), links = /(^|;|\s)left:\s*(?!auto)/.test(regels);
      assert.ok(!rechts || links, `${bestand}: ${selector.trim()} zet het zijmenu rechts`);
    }
  }
});
