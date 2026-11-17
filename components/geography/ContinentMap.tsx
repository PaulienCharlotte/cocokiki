import React from 'react';
import './continent-map.css';
export type ContinentId = 'europe' | 'africa' | 'asia' | 'north-america' | 'south-america' | 'oceania';
const REGIONS: Array<{ id: ContinentId; name: string; color: string; path: string }> = [
  { id: 'north-america', name: 'Noord-Amerika', color: 'var(--ck-boomhut)', path: 'M66 92 112 62 174 58 197 35 250 43 280 68 321 72 342 100 318 119 287 117 266 141 252 165 233 184 223 210 248 241 278 251 287 270 268 276 245 260 221 251 199 223 173 215 149 189 133 154 105 143 91 118 65 120Z M302 35 351 27 377 46 361 87 335 105 315 76Z' },
  { id: 'south-america', name: 'Zuid-Amerika', color: 'var(--ck-keuken)', path: 'M275 274 308 263 341 275 358 301 385 315 381 344 358 367 348 395 327 418 321 450 296 487 281 478 280 448 267 417 267 390 251 365 249 337 240 312 250 290Z' },
  { id: 'africa', name: 'Afrika', color: 'var(--ck-tuin)', path: 'M460 210 502 197 543 205 561 231 583 250 568 271 556 290 550 324 526 364 505 379 488 354 475 323 455 310 445 283 425 274 423 247 439 224Z M581 330 588 348 579 374 569 367Z' },
  { id: 'asia', name: 'Azië', color: 'var(--ck-bes)', path: 'M552 83 591 65 638 70 670 56 709 65 745 56 780 74 829 74 856 96 899 103 926 125 901 145 867 147 856 172 829 184 810 215 786 227 773 257 758 250 745 224 724 211 699 227 683 260 666 239 655 209 634 197 612 206 588 183 567 171 553 143 536 120Z M790 267 814 276 839 278 861 292 846 302 817 294Z M870 178 880 193 869 215 861 207Z' },
  { id: 'europe', name: 'Europa', color: 'var(--ck-wereld)', path: 'M461 111 477 94 482 66 500 49 516 60 506 86 521 98 543 95 554 117 550 143 569 163 551 174 527 163 522 185 512 180 502 158 487 167 475 189 455 186 448 166 462 146 449 132Z M435 120 444 127 440 151 430 146Z M406 88 421 84 428 92 414 98Z' },
  { id: 'oceania', name: 'Oceanië', color: 'var(--ck-druif)', path: 'M787 345 811 327 837 335 858 318 877 338 888 367 905 389 894 410 862 415 840 400 810 403 787 386 777 362Z M902 311 930 317 937 329 916 334Z M951 403 961 412 952 438 937 450 933 439Z M941 457 947 466 934 480 924 478Z' },
];
/** Abstracte, herbruikbare wereldkaart; de ontvanger bepaalt wat een werelddeel opent. */
export default function ContinentMap({ onChoose }: { onChoose: (id: ContinentId) => void }) {
  return <section className="continent-map" aria-label="Kies een werelddeel">
    <svg viewBox="30 10 950 500" aria-label="Aanklikbare wereldkaart" role="group">
      <defs><pattern id="map-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="var(--ck-wit)" strokeWidth="1" /></pattern></defs>
      <rect x="30" y="10" width="950" height="500" rx="40" fill="var(--color-sky)" /><rect x="30" y="10" width="950" height="500" rx="40" fill="url(#map-grid)" />
      {REGIONS.map(region => <g key={region.id} role="button" tabIndex={0} aria-label={region.name} className="continent-map__region" style={{ '--continent-color': region.color } as React.CSSProperties} onClick={() => onChoose(region.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onChoose(region.id); } }}><title>{region.name}</title><path d={region.path} /></g>)}
    </svg>
    <nav className="continent-map__legend" aria-label="Werelddelen">{REGIONS.map(region => <button type="button" key={region.id} style={{ '--continent-color': region.color } as React.CSSProperties} onClick={() => onChoose(region.id)}><span aria-hidden="true" />{region.name}</button>)}</nav>
  </section>;
}
