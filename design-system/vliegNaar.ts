/* Een beloning vliegt naar zijn plek in de bovenbalk: munten naar de teller,
   een ontdekt ingrediënt naar het profiel (daar zit de encyclopedie).
   Speelser dan een melding in een witte balk. */
import './vliegNaar.css';

export interface VliegOpties {
  /** Afbeelding die vliegt (bijv. het ingrediënt). Zonder afbeelding: een munt. */
  beeld?: string;
  /** Tekstje erbij, bijv. "+" of "+2". */
  label?: string;
  /** Waar het heen vliegt (CSS-selector); valt terug op rechtsboven. */
  doel?: string;
  vertraging?: number;
}

export function vliegNaar(vanaf: Element | null, { beeld, label = '+', doel, vertraging = 0 }: VliegOpties = {}) {
  if (!vanaf || typeof document === 'undefined') return;
  const start = vanaf.getBoundingClientRect();
  // Het eerste zichtbare doel (sommige tellers zijn per scherm verborgen).
  const doelEl = doel ? [...document.querySelectorAll(doel)].find(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) ?? null : null;
  const eind = doelEl?.getBoundingClientRect() ?? { left: window.innerWidth - 60, top: 20, width: 40, height: 40 } as DOMRect;
  const vlieger = document.createElement('div');
  vlieger.className = `ck-vlieger${beeld ? '' : ' ck-vlieger--munt'}`;
  vlieger.innerHTML = `${beeld ? `<img src="${beeld}" alt="" />` : '<span class="ck-munt"></span>'}<b>${label}</b>`;
  vlieger.style.left = `${start.left + start.width / 2}px`;
  vlieger.style.top = `${start.top + start.height / 2}px`;
  document.body.appendChild(vlieger);
  const dx = eind.left + eind.width / 2 - (start.left + start.width / 2);
  const dy = eind.top + eind.height / 2 - (start.top + start.height / 2);
  const stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animatie = vlieger.animate([
    { transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 },
    { transform: 'translate(-50%, -80%) scale(1.15)', opacity: 1, offset: .25 },
    { transform: `translate(calc(-50% + ${dx * .55}px), calc(-50% + ${dy * .55 - 60}px)) scale(1)`, opacity: 1, offset: .6 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35)`, opacity: .2 },
  ], { duration: stil ? 1 : 1100, delay: vertraging, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' });
  animatie.onfinish = () => {
    vlieger.remove();
    if (doelEl instanceof HTMLElement && !stil) doelEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  };
}
