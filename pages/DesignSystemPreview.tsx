import React, { useState } from 'react';
import { ArrowLeft, Coins, Compass, Heart, Map, Pause, Sparkles } from 'lucide-react';
import CocoCoin from '../components/platform/CocoCoin';
import { Button, DestinationPortal, Dialog, GameHUD, IconButton, ProgressIndicator, Surface } from '../design-system';
import './design-system-preview.css';

interface DesignSystemPreviewProps {
  onHome: () => void;
}

const SWATCHES = [
  ['Cream', 'var(--color-cream)'],
  ['Sage', 'var(--color-sage)'],
  ['Peach', 'var(--color-peach)'],
  ['Lilac', 'var(--color-lilac)'],
  ['Honey', 'var(--color-honey)'],
  ['Brown', 'var(--color-brown)'],
  ['Sky', 'var(--color-sky)'],
] as const;

export default function DesignSystemPreview({ onHome }: DesignSystemPreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return <div className="ck-preview">
    <header className="ck-preview__header">
      <Button variant="quiet" size="small" pill startIcon={<ArrowLeft size={17} />} onClick={onHome}>Terug</Button>
      <div><small>Interne preview</small><strong>CocoKiki Design System</strong></div>
    </header>

    <main className="ck-preview__main">
      <section className="ck-preview__intro">
        <span className="ck-preview__mark"><Sparkles size={22} /></span>
        <div><p>Soft Storybook 3D</p><h1>Warm, rustig en klaar voor avontuur</h1></div>
      </section>

      <section className="ck-preview__section" aria-labelledby="preview-colors">
        <div className="ck-preview__section-heading"><span>01</span><div><h2 id="preview-colors">Kleur en vorm</h2><p>Basiskleuren en semantische oppervlakken.</p></div></div>
        <div className="ck-preview__swatches">{SWATCHES.map(([name, color]) => <div className="ck-preview__swatch" key={name}>
          <span style={{ background: color }} /><small>{name}</small>
        </div>)}</div>
        <div className="ck-preview__surface-grid">
          <Surface><strong>Standaard</strong><p>Een rustige, warme basis voor inhoud.</p></Surface>
          <Surface tone="soft"><strong>Zacht</strong><p>Voor ondersteunende informatie.</p></Surface>
          <Surface tone="tinted"><strong>Magisch accent</strong><p>Spaarzaam voor bijzondere keuzes.</p></Surface>
        </div>
      </section>

      <section className="ck-preview__section" aria-labelledby="preview-controls">
        <div className="ck-preview__section-heading"><span>02</span><div><h2 id="preview-controls">Acties</h2><p>Duidelijke knoppen met minimaal 44 pixels aanraakruimte.</p></div></div>
        <div className="ck-preview__button-row">
          <Button startIcon={<Compass size={19} />}>Begin avontuur</Button>
          <Button variant="secondary">Kies een plek</Button>
          <Button variant="reward" pill startIcon={<CocoCoin size={19} />}>12 CocoCoins</Button>
          <Button variant="quiet">Later</Button>
          <IconButton label="Pauzeren" icon={<Pause size={19} />} />
        </div>
      </section>

      <section className="ck-preview__section" aria-labelledby="preview-feedback">
        <div className="ck-preview__section-heading"><span>03</span><div><h2 id="preview-feedback">Voortgang en HUD</h2><p>Compacte feedback die de spelwereld vrij laat.</p></div></div>
        <div className="ck-preview__feedback-grid">
          <Surface tone="soft"><ProgressIndicator label="Reis door Nederland" value={6} max={10} /><ProgressIndicator label="Sterren verzameld" value={3} max={5} tone="reward" compact /></Surface>
          <GameHUD
            label="Spelstatus"
            leading={<Compass size={25} />}
            title="Topo"
            stats={<><span><Heart size={16} aria-hidden="true" /> 3</span><span><Coins size={16} aria-hidden="true" /> 42</span></>}
            actions={<IconButton size="small" label="Pauzeren" icon={<Pause size={17} />} />}
          />
        </div>
      </section>

      <section className="ck-preview__section" aria-labelledby="preview-portals">
        <div className="ck-preview__section-heading"><span>04</span><div><h2 id="preview-portals">Bestemmingen</h2><p>Herkenbare portalen met één duidelijke actie.</p></div></div>
        <div className="ck-preview__portal-grid">
          <DestinationPortal title="Reizen" badge="Aardrijkskunde" description="Ontdek kaarten en bijzondere plekken." imageSrc="/games/treehouse/world-v2/island-topo-cutout.webp" tone="sky" />
          <DestinationPortal title="Uitdagingen" badge="Korte spellen" description="Oefen wat je al hebt ontdekt." imageSrc="/games/treehouse/world-v2/island-tables-cutout.webp" tone="peach" />
        </div>
      </section>

      <section className="ck-preview__section" aria-labelledby="preview-dialog">
        <div className="ck-preview__section-heading"><span>05</span><div><h2 id="preview-dialog">Dialoog</h2><p>Eén keuze, korte uitleg en een rustige illustratie.</p></div></div>
        <Button onClick={() => setDialogOpen(true)} startIcon={<Map size={19} />}>Open voorbeeld</Button>
      </section>
    </main>

    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      title="Klaar om te reizen?"
      description="Kies één route. Je kunt daarna altijd rustig terug naar de wereld."
      illustration={<img src="/games/treehouse/world-v2/island-topo-cutout.webp" alt="Zwevend Topo-eiland" />}
      primaryAction={<Button onClick={() => setDialogOpen(false)}>Kies deze route</Button>}
      secondaryAction={<Button variant="quiet" onClick={() => setDialogOpen(false)}>Nog even kijken</Button>}
    />
  </div>;
}
