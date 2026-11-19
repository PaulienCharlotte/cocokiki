/* Zachte spelgeluiden volgens de huisstijl: een tikje bij elke actie,
   een oplopend belletje bij goed, een zacht "boing" bij fout. Nooit een zoemer. */
let context: AudioContext | undefined;
let aan = true;

export function zetGeluid(waarde: boolean) { aan = waarde; }
export function geluidAan() { return aan; }

function toon(frequentie: number, duur = .12, soort: OscillatorType = 'sine', volume = .14, vertraging = 0) {
  if (!aan) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const start = context.currentTime + vertraging;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = soort;
    oscillator.frequency.value = frequentie;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + duur);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duur);
  } catch { /* geen geluid beschikbaar */ }
}

export const geluid = {
  tik: () => toon(520, .06),
  goed: () => [660, 880, 1320].forEach((f, i) => toon(f, .18, 'triangle', .14, i * .08)),
  fout: () => { toon(220, .2, 'sine', .12); toon(180, .2, 'sine', .1, .09); },
  munt: (i = 0) => toon(990 + i * 60, .07, 'triangle', .08),
};
