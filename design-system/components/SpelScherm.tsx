/* Het gedeelde spelscherm van CocoKiki: zeven vaste zones volgens docs/HUISSTIJL.md.
   Elk spel vult alleen de slots; de plekken, het glas en de beweging liggen hier vast. */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ClipboardList, HelpCircle, Calculator, Ruler, CalendarDays, ShoppingBasket, ShoppingBag, Volume2, VolumeX, X } from 'lucide-react';
import { geluid, geluidAan, zetGeluid } from '../geluid';
import '../spelscherm.css';

export type Wereld = 'keuken' | 'tuin' | 'school' | 'wereld' | 'boomhut';
export type GereedschapId = 'hint' | 'rekenmachine' | 'maten' | 'kalender' | 'mand';

const GEREEDSCHAP_VOLGORDE: GereedschapId[] = ['hint', 'rekenmachine', 'maten', 'kalender', 'mand'];
const GEREEDSCHAP_ICOON: Record<GereedschapId, React.ReactNode> = {
  hint: <HelpCircle size={26} strokeWidth={2.4} />,
  rekenmachine: <Calculator size={26} strokeWidth={2.4} />,
  maten: <Ruler size={26} strokeWidth={2.4} />,
  kalender: <CalendarDays size={26} strokeWidth={2.4} />,
  mand: <ShoppingBasket size={26} strokeWidth={2.4} />,
};
const GEREEDSCHAP_NAAM: Record<GereedschapId, string> = {
  hint: 'Hint', rekenmachine: 'Rekenmachine', maten: 'Maten', kalender: 'Kalender', mand: 'Mand',
};

/* ---------- Beloning: vonken en munten naar het statuseiland ---------- */
interface SchermContext {
  schermRef: React.RefObject<HTMLDivElement | null>;
  doelen: React.MutableRefObject<Map<string, HTMLElement>>;
  beloon: (vanaf: HTMLElement, munten?: number) => void;
}
const Context = createContext<SchermContext | null>(null);
const useScherm = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('Gebruik dit onderdeel binnen <SpelScherm>.');
  return ctx;
};

function vonken(scherm: HTMLElement, vanaf: HTMLElement) {
  const r = vanaf.getBoundingClientRect(), s = scherm.getBoundingClientRect();
  for (let i = 0; i < 22; i++) {
    const v = document.createElement('div');
    v.className = `ck-vonk ck-vonk--${(i % 5) + 1}`;
    v.style.left = `${r.left - s.left + r.width / 2}px`;
    v.style.top = `${r.top - s.top + r.height / 2}px`;
    scherm.appendChild(v);
    const hoek = Math.random() * Math.PI * 2, afstand = 60 + Math.random() * 120;
    v.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(hoek) * afstand}px,${Math.sin(hoek) * afstand - 40}px) scale(.2)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => v.remove();
  }
}

function vliegMunten(scherm: HTMLElement, vanaf: HTMLElement, aantal: number) {
  const munt = scherm.querySelector<HTMLElement>('.ck-zone-status .ck-munt');
  if (!munt) return;
  const r = vanaf.getBoundingClientRect(), s = scherm.getBoundingClientRect(), t = munt.getBoundingClientRect();
  for (let i = 0; i < Math.min(aantal, 5); i++) {
    const m = document.createElement('span');
    m.className = 'ck-munt ck-vliegmunt';
    m.style.left = `${r.left - s.left + r.width / 2}px`;
    m.style.top = `${r.top - s.top + r.height / 2}px`;
    scherm.appendChild(m);
    window.setTimeout(() => { m.style.left = `${t.left - s.left}px`; m.style.top = `${t.top - s.top}px`; m.style.transform = 'scale(.8)'; }, 30 + i * 90);
    window.setTimeout(() => { m.remove(); geluid.munt(i); }, 800 + i * 90);
  }
}

/* ---------- Het scherm ---------- */
export interface SpelSchermProps {
  wereld: Wereld;
  /** Achtergrondillustratie van het speelveld. */
  achtergrond?: string;
  /** Zone 1: precies één terugknop. Laat weg op het eiland. */
  onTerug?: () => void;
  terugLabel?: string;
  /** Zone 2 */
  status?: React.ReactNode;
  /** Zone 3 */
  menu?: React.ReactNode;
  /** Zone 4 */
  gereedschap?: React.ReactNode;
  /** Zone 5 */
  personage?: React.ReactNode;
  /** Zone 6: bellen of één hoofdknop */
  antwoord?: React.ReactNode;
  /** Paneel van rechts (winkel, To Do, boeken) */
  paneel?: React.ReactNode;
  /** Zone 7: het speelveld met hangkaartjes, doelen en objecten */
  children?: React.ReactNode;
}

export default function SpelScherm({ wereld, achtergrond, onTerug, terugLabel = 'Terug', status, menu, gereedschap, personage, antwoord, paneel, children }: SpelSchermProps) {
  const schermRef = useRef<HTMLDivElement>(null);
  const wereldRef = useRef<HTMLDivElement>(null);
  const doelen = useRef(new Map<string, HTMLElement>());

  const beloon = useCallback((vanaf: HTMLElement, munten = 5) => {
    const scherm = schermRef.current;
    if (!scherm) return;
    vonken(scherm, vanaf);
    window.setTimeout(() => vliegMunten(scherm, vanaf, munten), 250);
  }, []);

  // Glans en parallax volgen muis of vinger
  const beweeg = (e: React.PointerEvent) => {
    const scherm = schermRef.current;
    if (!scherm) return;
    const r = scherm.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    scherm.style.setProperty('--ck-glans-x', `${50 + x * 80}%`);
    if (wereldRef.current) wereldRef.current.style.transform = `translate(${-x * 14}px,${-y * 10}px) scale(1.02)`;
  };

  return <Context.Provider value={{ schermRef, doelen, beloon }}>
    <div ref={schermRef} className="ck-scherm ck-spelscherm" data-wereld={wereld} onPointerMove={beweeg}>
      <div ref={wereldRef} className="ck-spelscherm__wereld" aria-hidden="true">
        {achtergrond && <img src={achtergrond} alt="" />}
      </div>
      <div className="ck-spelscherm__veld">{children}</div>
      {onTerug && <button type="button" className="ck-zone-terug ck-glas" aria-label={terugLabel} onClick={() => { geluid.tik(); onTerug(); }}>
        <ChevronLeft size={28} strokeWidth={3} />
      </button>}
      {status}
      {menu}
      {gereedschap}
      {personage}
      {antwoord}
      {paneel}
    </div>
  </Context.Provider>;
}

/* ---------- Zone 2: statuseiland ---------- */
export interface StatuseilandProps {
  munten: number;
  rondes?: number;
  klaar?: number;
  niveau?: string;
  /** Tijdelijk open na een beloning: "+5", verzamelkaart, titel */
  beloning?: { munten: number; titel: string } | null;
  onStip?: (index: number) => void;
}

export function Statuseiland({ munten, rondes = 0, klaar = 0, niveau, beloning, onStip }: StatuseilandProps) {
  return <div className={`ck-zone-status ck-glas${beloning ? ' is-open' : ''}`} role="status">
    <span className="ck-munt" aria-hidden="true" />
    <b aria-label={`${munten} munten`}>{munten}</b>
    {rondes > 0 && <>
      <span className="ck-spelscherm__scheid" />
      <span className="ck-spelscherm__stippen" aria-label={`${klaar} van ${rondes} klaar`}>
        {Array.from({ length: rondes }, (_, i) => {
          const klasse = `ck-stip${i < klaar ? ' ck-stip--klaar' : ''}${i === klaar ? ' ck-stip--nu' : ''}`;
          return onStip && i < klaar
            ? <button key={i} type="button" className={klasse} aria-label={`Bekijk vraag ${i + 1}`} onClick={() => onStip(i)} />
            : <span key={i} className={klasse} />;
        })}
      </span>
    </>}
    {niveau && <span className="ck-niveau">{niveau}</span>}
    <span className="ck-status-extra" aria-live="polite">
      {beloning && <>
        <span className="ck-spelscherm__scheid" />
        <span>+{beloning.munten}</span>
        <span>{beloning.titel}</span>
      </>}
    </span>
  </div>;
}

/* ---------- Zone 3: menu (winkel · To Do · profiel) ---------- */
export interface MenuProps { onWinkel?: () => void; onToDo?: () => void; onProfiel?: () => void; profielFoto?: string }

export function Menu({ onWinkel, onToDo, onProfiel, profielFoto = '/images/avatars/lua-profile.webp' }: MenuProps) {
  const klik = (f?: () => void) => () => { geluid.tik(); f?.(); };
  return <nav className="ck-zone-menu ck-glas" aria-label="Menu">
    <button type="button" className="ck-spelscherm__menuknop" aria-label="Winkel" onClick={klik(onWinkel)}><ShoppingBag size={24} strokeWidth={2.4} /></button>
    <button type="button" className="ck-spelscherm__menuknop" aria-label="To Do" onClick={klik(onToDo)}><ClipboardList size={24} strokeWidth={2.4} /></button>
    <button type="button" className="ck-spelscherm__menuknop" aria-label="Profiel" onClick={klik(onProfiel)}><img src={profielFoto} alt="" /></button>
  </nav>;
}

/* ---------- Zone 4: gereedschapsbalk ---------- */
export interface GereedschapsbalkProps {
  /** Alleen wat dit spel nodig heeft; de volgorde ligt vast. */
  tonen: GereedschapId[];
  aan?: GereedschapId[];
  onKies?: (id: GereedschapId) => void;
  namen?: Partial<Record<GereedschapId, string>>;
}

export function Gereedschapsbalk({ tonen, aan = [], onKies, namen = {} }: GereedschapsbalkProps) {
  const [geluidStaatAan, setGeluid] = useState(geluidAan());
  return <div className="ck-zone-gereedschap ck-glas" role="toolbar" aria-label="Gereedschap">
    {GEREEDSCHAP_VOLGORDE.filter(id => tonen.includes(id)).map(id => {
      const naam = namen[id] ?? GEREEDSCHAP_NAAM[id];
      return <button key={id} type="button" className={`ck-gereedschap${aan.includes(id) ? ' is-aan' : ''}`} aria-label={naam} title={naam} aria-pressed={aan.includes(id)}
        onClick={() => { geluid.tik(); onKies?.(id); }}>{GEREEDSCHAP_ICOON[id]}</button>;
    })}
    <span className="ck-spelscherm__lijn" aria-hidden="true" />
    <button type="button" className="ck-gereedschap" aria-label={geluidStaatAan ? 'Geluid uit' : 'Geluid aan'} aria-pressed={geluidStaatAan}
      onClick={() => { zetGeluid(!geluidStaatAan); setGeluid(!geluidStaatAan); geluid.tik(); }}>
      {geluidStaatAan ? <Volume2 size={26} strokeWidth={2.4} /> : <VolumeX size={26} strokeWidth={2.4} />}
    </button>
  </div>;
}

/* ---------- Zone 5: personage met ballon ---------- */
export interface PersonageProps { naam: string; gezicht: string; zin: React.ReactNode; blij?: boolean }

export function Personage({ naam, gezicht, zin, blij }: PersonageProps) {
  const [nieuw, setNieuw] = useState(false);
  useEffect(() => { setNieuw(false); const t = requestAnimationFrame(() => setNieuw(true)); return () => cancelAnimationFrame(t); }, [zin]);
  return <div className={`ck-zone-personage${blij ? ' is-blij' : ''}`}>
    <img className="ck-ballon__gezicht" src={gezicht} alt={naam} />
    <div className={`ck-ballon__tekst${nieuw ? ' is-nieuw' : ''}`} aria-live="polite">
      <span className="ck-ballon__naam">{naam.toUpperCase()}</span>
      {zin}
    </div>
  </div>;
}

/* ---------- Zone 6: antwoorden ---------- */
export function Antwoorden({ uitleg, children }: { uitleg?: string; children: React.ReactNode }) {
  return <div className="ck-zone-antwoord">
    {uitleg && <span className="ck-spelscherm__uitleg">{uitleg}</span>}
    {children}
  </div>;
}

export interface BelProps {
  /** 1 t/m 4: blauw, bes, groen, druif */
  kleur: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  eenheid?: string;
  /** Het doel waar je de bel naartoe mag slepen */
  doel?: string;
  status?: 'fout' | 'weg' | null;
  /** Tikken of slepen op het doel. Geeft het element mee, voor vonken. */
  onKies: (element: HTMLElement) => void;
}

export function Bel({ kleur, children, eenheid, doel, status, onKies }: BelProps) {
  const { doelen } = useScherm();
  const ref = useRef<HTMLButtonElement>(null);
  const sleep = useRef<{ x: number; y: number; bewogen: boolean } | null>(null);
  const [slepen, setSlepen] = useState(false);
  const [wiebel, setWiebel] = useState(0);

  useEffect(() => { if (status === 'fout') setWiebel(w => w + 1); }, [status]);

  const boven = (e: React.PointerEvent) => {
    const d = doel ? doelen.current.get(doel) : undefined;
    if (!d) return false;
    const r = d.getBoundingClientRect();
    return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
  };
  const markeer = (aan: boolean) => { if (doel) doelen.current.get(doel)?.classList.toggle('is-over', aan); };

  return <button ref={ref} type="button" key={wiebel}
    className={`ck-bel ck-glas ck-bel--${kleur}${slepen ? ' is-slepen' : ''}${status === 'fout' ? ' is-fout' : ''}${status === 'weg' ? ' is-weg' : ''}`}
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); sleep.current = { x: e.clientX, y: e.clientY, bewogen: false }; setSlepen(true); geluid.tik(); }}
    onPointerMove={e => {
      const s = sleep.current; if (!s || !ref.current) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.hypot(dx, dy) > 6) s.bewogen = true;
      ref.current.style.transform = `translate(${dx}px,${dy}px) scale(1.12) rotate(${dx / 30}deg)`;
      markeer(boven(e));
    }}
    onPointerUp={e => {
      const s = sleep.current; sleep.current = null; setSlepen(false); markeer(false);
      if (ref.current) ref.current.style.transform = '';
      if (s && (!s.bewogen || boven(e)) && ref.current) onKies(ref.current);
    }}
    onPointerCancel={() => { sleep.current = null; setSlepen(false); markeer(false); if (ref.current) ref.current.style.transform = ''; }}
    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && ref.current) { e.preventDefault(); onKies(ref.current); } }}
  >
    <span className="ck-bel__kern" aria-hidden="true" />
    {children}
    {eenheid && <small className="ck-bel__eenheid">{eenheid}</small>}
  </button>;
}

/** Eén hoofdknop in de wereldkleur, als er geen bellen zijn. */
export function Hoofdknop({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <div className="ck-zone-antwoord">
    <button type="button" className="ck-knop ck-knop--hoofd" onClick={() => { geluid.tik(); onClick(); }}>{children}</button>
  </div>;
}

/* ---------- Zone 7: onderdelen in de wereld ---------- */
export interface PlekProps { links: string; boven: string }

export function Hangkaartje({ links, boven, children, onder, vertraging }: PlekProps & { children: React.ReactNode; onder?: string; vertraging?: number }) {
  return <div className="ck-hangkaartje" style={{ left: links, top: boven, animationDelay: vertraging ? `${-vertraging}s` : undefined }}>
    <span className="ck-hangkaartje__touw" aria-hidden="true" />
    <span className="ck-hangkaartje__label ck-glas">{children}{onder && <small>{onder}</small>}</span>
  </div>;
}

export function Doel({ id, links, boven, breed, hoog, label }: PlekProps & { id: string; breed: string; hoog: string; label?: string }) {
  const { doelen } = useScherm();
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (el) doelen.current.set(id, el); else doelen.current.delete(id);
  }, [doelen, id]);
  return <div ref={ref} className="ck-doel" style={{ left: links, top: boven, width: breed, height: hoog }} role="region" aria-label={label ?? 'Doel'} />;
}

/* ---------- Paneel van rechts ---------- */
export function Paneel({ open, titel, onSluit, children }: { open: boolean; titel: string; onSluit: () => void; children: React.ReactNode }) {
  const sluit = () => { geluid.tik(); onSluit(); };
  return <>
    {open && <button type="button" className="ck-spelscherm__achter" aria-label="Sluit paneel" onClick={sluit} />}
    <aside className={`ck-paneel ck-glas${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={titel}>
      <div className="ck-spelscherm__paneelkop">
        <h2 className="ck-houtbord">{titel}</h2>
        <button type="button" className="ck-spelscherm__sluit" aria-label="Sluit" onClick={sluit}><X size={28} strokeWidth={3} /></button>
      </div>
      {children}
    </aside>
  </>;
}

/** Haal de beloning op binnen <SpelScherm> (vonken en munten naar het eiland). */
export function useBeloning() { return useScherm().beloon; }
