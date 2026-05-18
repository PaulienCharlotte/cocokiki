
import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, Play, Pause, Trash2, Camera,
  ChevronLeft, ChevronRight, BookOpen, Pencil,
  CheckCircle2, ImagePlus,
} from 'lucide-react';
import { LOCATIONS, PROVINCES } from '../constants';
import { Location } from '../types';
import { LOCATION_FACTS } from '../data/locationFacts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MnemonicEntry {
  text:          string;
  audioBase64?:  string;
  audioMime?:    string;
  photoDataUrl?: string;
  savedAt?:      number;
}

interface SavedItem {
  loc:   Location;
  entry: MnemonicEntry;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'topo_ezelsbruggetjes_v1';

function loadAll(): Record<string, MnemonicEntry> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); }
  catch { return {}; }
}

function persistAll(data: Record<string, MnemonicEntry>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { /* quota exceeded – skip */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function base64ToDataUrl(base64: string, mime: string) {
  return `data:${mime};base64,${base64}`;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const MAX_REC_SECONDS = 60;

function AudioSection({
  entry,
  onSave,
  onDelete,
}: {
  entry: MnemonicEntry;
  onSave: (base64: string, mime: string) => void;
  onDelete: () => void;
}) {
  const [state, setState]     = useState<'idle' | 'recording' | 'done'>(
    entry.audioBase64 ? 'done' : 'idle',
  );
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const streamRef   = useRef<MediaStream | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  // Sync when entry changes (navigating to different location)
  useEffect(() => {
    setState(entry.audioBase64 ? 'done' : 'idle');
    setSeconds(0);
    setPlaying(false);
  }, [entry.audioBase64]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const rec  = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      chunksRef.current   = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob   = new Blob(chunksRef.current, { type: mime });
        const base64 = await blobToBase64(blob);
        onSave(base64, mime);
        setState('done');
        stream.getTracks().forEach(t => t.stop());
      };

      rec.start(200);
      setState('recording');
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_REC_SECONDS) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch {
      alert('Geen microfoon gevonden of toestemming geweigerd.');
    }
  }, [onSave]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const togglePlay = useCallback(() => {
    if (!entry.audioBase64 || !entry.audioMime) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(base64ToDataUrl(entry.audioBase64, entry.audioMime));
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setPlaying(true);
    }
  }, [entry.audioBase64, entry.audioMime, playing]);

  const handleDelete = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setState('idle');
    setPlaying(false);
    onDelete();
  }, [onDelete]);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-black text-[#5D4E60]">
        <Mic className="w-4 h-4 text-rose-400" />
        Jouw stem
      </label>

      {state === 'idle' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-3 bg-rose-50 border-2 border-rose-200 text-rose-600 font-black rounded-2xl hover:bg-rose-100 transition-colors text-sm"
        >
          <Mic className="w-4 h-4" />
          Start opname
        </motion.button>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-500 rounded-2xl">
          <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
          <span className="font-black text-white text-sm flex-1">Opnemen… {fmt(seconds)}</span>
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 bg-white text-rose-600 font-black text-xs px-3 py-1.5 rounded-xl"
          >
            <Square className="w-3 h-3 fill-current" />
            Stop
          </button>
        </div>
      )}

      {state === 'done' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-2xl">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="font-bold text-green-700 text-sm flex-1">Opname opgeslagen!</span>
          <button
            onClick={togglePlay}
            className="p-2 bg-white rounded-xl border border-green-200 text-green-600 hover:bg-green-50"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-white rounded-xl border border-rose-100 text-rose-400 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoSection({
  entry,
  onSave,
  onDelete,
}: {
  entry: MnemonicEntry;
  onSave: (dataUrl: string) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSave(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-black text-[#5D4E60]">
        <Camera className="w-4 h-4 text-violet-400" />
        Jouw foto of tekening
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {!entry.photoDataUrl ? (
        <div className="flex gap-2">
          {/* Camera (mobile) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute('capture');
                inputRef.current.setAttribute('capture', 'environment');
                inputRef.current.click();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-50 border-2 border-violet-200 text-violet-600 font-black rounded-2xl hover:bg-violet-100 transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            Maak foto
          </motion.button>

          {/* Upload */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute('capture');
                inputRef.current.click();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-50 border-2 border-violet-200 text-violet-600 font-black rounded-2xl hover:bg-violet-100 transition-colors text-sm"
          >
            <ImagePlus className="w-4 h-4" />
            Upload
          </motion.button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border-2 border-violet-200">
          <img
            src={entry.photoDataUrl}
            alt="Ezelsbruggetje"
            className="w-full max-h-48 object-cover"
          />
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-xl text-rose-500 hover:bg-white shadow"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({
  locationName,
  entry,
  emoji,
  onClick,
}: {
  locationName: string;
  entry: MnemonicEntry;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="text-left bg-white rounded-2xl border-2 border-amber-100 shadow-sm p-3 flex flex-col gap-2"
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl">{emoji}</span>
        <div className="font-black text-[#5D4E60] text-sm leading-tight">{locationName}</div>
      </div>

      {entry.photoDataUrl && (
        <img
          src={entry.photoDataUrl}
          alt=""
          className="w-full h-20 object-cover rounded-xl"
        />
      )}

      {entry.text && (
        <p className="text-xs text-[#6B5E80] italic leading-snug line-clamp-2">
          "{entry.text}"
        </p>
      )}

      <div className="flex gap-1.5">
        {entry.text      && <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">📝 Tekst</span>}
        {entry.audioBase64 && <span className="text-[10px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full">🎤 Stem</span>}
        {entry.photoDataUrl && <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">📸 Foto</span>}
      </div>
    </motion.button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface MnemonicGameProps {
  provinceId: string;
}

const MnemonicGame: React.FC<MnemonicGameProps> = ({ provinceId }) => {
  const [view,    setView]    = useState<'create' | 'gallery'>('create');
  const [locIdx,  setLocIdx]  = useState(0);
  const [entries, setEntries] = useState<Record<string, MnemonicEntry>>(loadAll);
  const [text,    setText]    = useState('');

  const locations = useMemo(() =>
    LOCATIONS
      .filter(l => provinceId === 'all' || l.provinceId === provinceId)
      .filter(l => l.type === 'city'),
    [provinceId],
  );

  // Reset location index when province changes
  useEffect(() => { setLocIdx(0); }, [provinceId]);

  const loc   = locations[locIdx];
  const entry = (loc ? entries[loc.id] : null) ?? {};
  const emoji = loc ? (LOCATION_FACTS[loc.name]?.emoji ?? '📍') : '📍';

  const provinceName = provinceId === 'all'
    ? 'heel Nederland'
    : PROVINCES.find(p => p.id === provinceId)?.name ?? 'Nederland';

  // Sync text field when navigating
  useEffect(() => {
    setText(entry.text ?? '');
  }, [loc?.id]);

  // Persist after every change
  useEffect(() => {
    persistAll(entries);
  }, [entries]);

  const updateEntry = useCallback((locId: string, patch: Partial<MnemonicEntry>) => {
    setEntries(prev => ({
      ...prev,
      [locId]: { ...prev[locId], ...patch, savedAt: Date.now() },
    }));
  }, []);

  const saveText = useCallback(() => {
    if (!loc) return;
    updateEntry(loc.id, { text });
  }, [loc, text, updateEntry]);

  const savedCount = Object.values(entries).filter(e =>
    (e as MnemonicEntry).text || (e as MnemonicEntry).audioBase64 || (e as MnemonicEntry).photoDataUrl,
  ).length;

  const gallerySaved: SavedItem[] = locations.reduce<SavedItem[]>((acc, l) => {
    const e = entries[l.id] as MnemonicEntry | undefined;
    if (e && (e.text || e.audioBase64 || e.photoDataUrl)) acc.push({ loc: l, entry: e });
    return acc;
  }, []);

  if (!loc) {
    return (
      <div className="flex items-center justify-center h-full text-[#9B8EAA] font-bold">
        Geen plaatsen gevonden voor deze provincie.
      </div>
    );
  }

  // ── Gallery view ────────────────────────────────────────────────────────────
  if (view === 'gallery') {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-black text-[#5D4E60] text-lg">Mijn Ezelsbruggetjes</h2>
            <p className="text-xs text-[#9B8EAA]">{savedCount} opgeslagen · {provinceName}</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 font-black text-sm rounded-xl hover:bg-amber-200 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Maak
          </button>
        </div>

        {gallerySaved.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl">📖</span>
            <p className="font-black text-[#5D4E60]">Nog geen ezelsbruggetjes!</p>
            <p className="text-sm text-[#9B8EAA]">Ga naar 'Maak' om er een te verzinnen.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallerySaved.map((item: SavedItem) => (
                <div key={item.loc.id}>
                  <GalleryCard
                    locationName={item.loc.name}
                    entry={item.entry}
                    emoji={LOCATION_FACTS[item.loc.name]?.emoji ?? '📍'}
                    onClick={() => {
                      const idx = locations.findIndex(x => x.id === item.loc.id);
                      if (idx >= 0) { setLocIdx(idx); setView('create'); }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Create view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top: nav + gallery button */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2 gap-3">
        {/* Prev / counter / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocIdx(i => Math.max(0, i - 1))}
            disabled={locIdx === 0}
            className="p-2 rounded-xl bg-amber-50 text-amber-600 disabled:opacity-30 hover:bg-amber-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-[#5D4E60] text-sm min-w-[60px] text-center">
            {locIdx + 1} / {locations.length}
          </span>
          <button
            onClick={() => setLocIdx(i => Math.min(locations.length - 1, i + 1))}
            disabled={locIdx === locations.length - 1}
            className="p-2 rounded-xl bg-amber-50 text-amber-600 disabled:opacity-30 hover:bg-amber-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Gallery button */}
        <button
          onClick={() => setView('gallery')}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 font-black text-sm rounded-xl hover:bg-amber-200 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Boekje</span>
          {savedCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      {/* Location card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={loc.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mx-4 mb-4"
        >
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-4xl">{emoji}</span>
            <div>
              <div className="font-black text-2xl text-[#5D4E60] leading-none">{loc.name}</div>
              <div className="text-xs text-amber-600 font-bold mt-0.5">
                {PROVINCES.find(p => p.id === loc.provinceId)?.name}
                {loc.isCapital && ' · hoofdstad'}
              </div>
              {LOCATION_FACTS[loc.name] && (
                <div className="text-[11px] text-[#8B7A9A] mt-1 italic leading-snug max-w-xs">
                  "{LOCATION_FACTS[loc.name].fact}"
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Inputs */}
      <div className="flex flex-col gap-5 px-4 pb-6">

        {/* Text */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-black text-[#5D4E60]">
            <Pencil className="w-4 h-4 text-amber-500" />
            Jouw tekst-ezelsbruggetje
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={saveText}
            placeholder={`Verzin een leuke zin om "${loc.name}" te onthouden…`}
            rows={3}
            className="w-full px-4 py-3 bg-white border-2 border-amber-100 focus:border-amber-300 rounded-2xl text-sm text-[#5D4E60] font-medium resize-none outline-none transition-colors placeholder:text-amber-200"
          />
          {text && text !== (entry.text ?? '') && (
            <button
              onClick={saveText}
              className="self-end text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors"
            >
              Opslaan ✓
            </button>
          )}
          {entry.text && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Tekst opgeslagen
            </div>
          )}
        </div>

        {/* Audio */}
        <AudioSection
          entry={entry}
          onSave={(b64, mime) => updateEntry(loc.id, { audioBase64: b64, audioMime: mime })}
          onDelete={() => updateEntry(loc.id, { audioBase64: undefined, audioMime: undefined })}
        />

        {/* Photo */}
        <PhotoSection
          entry={entry}
          onSave={url => updateEntry(loc.id, { photoDataUrl: url })}
          onDelete={() => updateEntry(loc.id, { photoDataUrl: undefined })}
        />

        {/* Next button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setLocIdx(i => Math.min(locations.length - 1, i + 1))}
          disabled={locIdx === locations.length - 1}
          className="flex items-center justify-center gap-2 py-3 bg-amber-400 text-white font-black rounded-2xl shadow-[0_4px_0_#C97B00] hover:brightness-105 active:translate-y-1 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Volgende plaatsnaam
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default MnemonicGame;
