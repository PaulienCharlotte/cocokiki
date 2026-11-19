/* De gereedschapsbalk is in elk spel versleepbaar aan een greep bovenaan.
   Zo staat hij nooit in de weg van een som of tekst. De plek wordt onthouden
   (voor alle spellen samen). Dubbeltik op de greep zet hem terug op zijn vaste plek.
   Werkt automatisch voor elke .ck-zone-gereedschap; spellen hoeven niets te doen. */
import './versleepbaar.css';

const PLEK_KEY = 'cocokiki:gereedschap-plek';
const KLAAR = 'ckVersleepbaar';
const GREEP_ICOON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>';

type Plek = { x: number; y: number };

function leesPlek(): Plek {
  try { const p = JSON.parse(localStorage.getItem(PLEK_KEY) ?? ''); if (typeof p?.x === 'number' && typeof p?.y === 'number') return p; } catch { /* alleen gemak */ }
  return { x: 0, y: 0 };
}
function bewaarPlek(p: Plek) { try { localStorage.setItem(PLEK_KEY, JSON.stringify(p)); } catch { /* alleen gemak */ } }

/** Houd de balk binnen het scherm, hoe groot het scherm ook is. */
function zet(balk: HTMLElement, plek: Plek): Plek {
  balk.style.translate = '0 0';
  const r = balk.getBoundingClientRect();
  const marge = 4;
  const x = Math.min(Math.max(plek.x, marge - r.left), window.innerWidth - marge - r.right);
  const y = Math.min(Math.max(plek.y, marge - r.top), window.innerHeight - marge - r.bottom);
  balk.style.translate = `${x}px ${y}px`;
  return { x, y };
}

function maakVersleepbaar(balk: HTMLElement) {
  if (balk.dataset[KLAAR]) return;
  balk.dataset[KLAAR] = '1';
  balk.classList.add('ck-versleepbaar');

  const greep = document.createElement('button');
  greep.type = 'button';
  greep.className = 'ck-greep';
  greep.setAttribute('aria-label', 'Gereedschap verplaatsen (dubbeltik: terug)');
  greep.innerHTML = GREEP_ICOON;
  balk.prepend(greep);

  let plek = zet(balk, leesPlek());
  let sleep: { id: number; sx: number; sy: number; px: number; py: number } | null = null;

  greep.addEventListener('pointerdown', e => {
    e.preventDefault();
    greep.setPointerCapture(e.pointerId);
    sleep = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: plek.x, py: plek.y };
    balk.classList.add('is-slepen');
  });
  greep.addEventListener('pointermove', e => {
    if (!sleep || sleep.id !== e.pointerId) return;
    plek = zet(balk, { x: sleep.px + e.clientX - sleep.sx, y: sleep.py + e.clientY - sleep.sy });
  });
  const stop = () => { if (!sleep) return; sleep = null; balk.classList.remove('is-slepen'); bewaarPlek(plek); };
  greep.addEventListener('pointerup', stop);
  greep.addEventListener('pointercancel', stop);
  greep.addEventListener('dblclick', () => { plek = zet(balk, { x: 0, y: 0 }); bewaarPlek(plek); });
  greep.addEventListener('keydown', e => {
    const stap = 24;
    const pijl: Record<string, Plek> = { ArrowLeft: { x: -stap, y: 0 }, ArrowRight: { x: stap, y: 0 }, ArrowUp: { x: 0, y: -stap }, ArrowDown: { x: 0, y: stap } };
    const d = pijl[e.key];
    if (!d) return;
    e.preventDefault();
    plek = zet(balk, { x: plek.x + d.x, y: plek.y + d.y });
    bewaarPlek(plek);
  });
}

export function startVersleepbareBalk() {
  if (typeof document === 'undefined') return;
  const zoek = (wortel: ParentNode) => wortel.querySelectorAll<HTMLElement>('.ck-zone-gereedschap').forEach(maakVersleepbaar);
  zoek(document);
  new MutationObserver(mutaties => {
    for (const m of mutaties) m.addedNodes.forEach(n => {
      if (!(n instanceof HTMLElement)) return;
      if (n.matches('.ck-zone-gereedschap')) maakVersleepbaar(n);
      zoek(n);
    });
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', () => document.querySelectorAll<HTMLElement>('.ck-versleepbaar').forEach(b => zet(b, leesPlek())));
}
