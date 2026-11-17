import React from 'react';
/** Heldere rekentekens, onafhankelijk van de ronde tekstletter. */
export default function RekenTekst({ tekst }: { tekst: string }) {
  return <><span className="sr-only">{tekst}</span><span className="reken-tekst" aria-hidden="true">{tekst.split(/([+÷×−])/).map((part, i) => ['+', '÷', '×', '−'].includes(part) ? <svg key={i} className="reken-teken" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">{part === '+' ? <path d="M16 5v22M5 16h22" /> : part === '÷' ? <><path d="M5 16h22" /><circle cx="16" cy="5" r="2.8" fill="currentColor" stroke="none" /><circle cx="16" cy="27" r="2.8" fill="currentColor" stroke="none" /></> : part === '×' ? <path d="m7 7 18 18M25 7 7 25" /> : <path d="M5 16h22" />}</svg> : <React.Fragment key={i}>{part}</React.Fragment>)}</span></>;
}
