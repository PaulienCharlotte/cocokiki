import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, DestinationPortal, Dialog, GameHUD, IconButton, ProgressIndicator, Surface } from '../design-system';

test('design-system buttons expose accessible native controls and variants', () => {
  const html = renderToStaticMarkup(<>
    <Button variant="secondary" pill startIcon={<span>+</span>}>Kies een plek</Button>
    <IconButton label="Pauzeren" icon={<span>||</span>} />
  </>);
  assert.match(html, /type="button"/);
  assert.match(html, /ck-button--secondary/);
  assert.match(html, /ck-button--pill/);
  assert.match(html, /aria-label="Pauzeren"/);
});

test('surface and HUD provide reusable semantic containers', () => {
  const html = renderToStaticMarkup(<>
    <Surface as="section" tone="soft" aria-label="Opdracht">Inhoud</Surface>
    <GameHUD label="Spelstatus" title="Topo" stats={<span>3 levens</span>} />
  </>);
  assert.match(html, /class="ck-surface ck-surface--soft/);
  assert.match(html, /aria-label="Opdracht"/);
  assert.match(html, /aria-label="Spelstatus"/);
});

test('progress indicator clamps values and keeps a readable label', () => {
  const html = renderToStaticMarkup(<ProgressIndicator label="Route" value={12} max={10} tone="reward" />);
  assert.match(html, /value="10"/);
  assert.match(html, /max="10"/);
  assert.match(html, /aria-label="Route"/);
  assert.match(html, />10\/10</);
});

test('destination portal communicates its title and locked state', () => {
  const html = renderToStaticMarkup(<DestinationPortal title="Koken" imageSrc="\/koken.png" locked />);
  assert.match(html, /aria-label="Koken, vergrendeld"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /ck-destination-portal/);
});

test('dialog renders only while open and exposes its heading and close action', () => {
  const closed = renderToStaticMarkup(<Dialog open={false} title="Klaar?" onClose={() => undefined} primaryAction={<Button>Start</Button>} />);
  const open = renderToStaticMarkup(<Dialog open title="Klaar?" description="Kies een route." onClose={() => undefined} primaryAction={<Button>Start</Button>} />);
  assert.equal(closed, '');
  assert.match(open, /role="dialog"/);
  assert.match(open, /aria-modal="true"/);
  assert.match(open, />Klaar\?</);
  assert.match(open, /aria-label="Sluiten"/);
});
