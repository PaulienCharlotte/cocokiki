import React from 'react';
import { ArrowRight, Award, Check, Compass, Flag, LockKeyhole, Map } from 'lucide-react';
import { Progress } from '../services/localProgress';

const STAMPS = [
  { threshold: 50, label: 'Eerste route', icon: Compass }, { threshold: 150, label: 'Kaartlezer', icon: Map },
  { threshold: 300, label: 'Ontdekker', icon: Flag }, { threshold: 500, label: 'Avonturier', icon: Compass }, { threshold: 800, label: 'Wereldreiziger', icon: Award },
];
export default function Passport({ score, progress, onPlay, storageAvailable }: { score: number; progress: Progress; onPlay: () => void; storageAvailable: boolean }) {
  const next = STAMPS.find(s => score < s.threshold);
  const earned = STAMPS.filter(s => score >= s.threshold);
  const flags = Object.keys(progress).filter(key => key.startsWith('flag:')).length;
  const places = Object.keys(progress).filter(key => key.startsWith('map:')).length;
  return <main className="passport content-width">
    <div className="page-title"><div><p className="eyebrow">Jouw reis</p><h1>Paspoort</h1></div><img src="/images/logo-compas-geel.svg" width="64" height="64" alt="" /></div>
    <div className="passport-stats"><div><strong>{score}</strong><span>reispunten</span></div><div><strong>{places}</strong><span>plekken geoefend</span></div><div><strong>{flags}</strong><span>vlaggen geoefend</span></div></div>
    <section className="passport-next"><div><h2>{next ? `Op weg naar ${next.label}` : 'Wereldreiziger!'}</h2><p>{next ? `Nog ${next.threshold - score} punten tot je volgende stempel.` : 'Je hebt alle stempels verzameld.'}</p></div>
      <progress value={next ? score - (earned.at(-1)?.threshold ?? 0) : 1} max={next ? next.threshold - (earned.at(-1)?.threshold ?? 0) : 1} aria-label="Voortgang naar volgende stempel" />
    </section>
    <h2>Je stempels</h2><div className="stamp-grid">{STAMPS.map(stamp => {
      const unlocked = score >= stamp.threshold;
      return <article className={`stamp ${unlocked ? 'earned' : ''}`} key={stamp.label}><stamp.icon size={30} /><h3>{stamp.label}</h3><span>{unlocked ? <Check size={14} /> : <LockKeyhole size={14} />}{unlocked ? 'Verzameld' : `${stamp.threshold} punten`}</span></article>;
    })}</div>
    <button className="primary-button" onClick={onPlay}>Verder spelen<ArrowRight size={18} /></button>
    <p className="storage-note" role={storageAvailable ? undefined : 'status'}>{storageAvailable ? 'Je voortgang blijft in deze browser bewaard. Wis je de browsergegevens, dan begint je paspoort opnieuw.' : 'Deze browser kan je voortgang nu niet bewaren. Je kunt wel verder spelen.'}</p>
  </main>;
}
