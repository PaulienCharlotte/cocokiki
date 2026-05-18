
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Trash2, X, ArrowLeft, Loader2, Image, CheckCircle, AlertCircle,
  FileImage, Copy, Check, Lock, Mail, LogOut, ShieldAlert,
} from 'lucide-react';
import {
  uploadLocationPhoto, fetchAllPhotos, deleteLocationPhoto,
  uploadSiteAsset, fetchAllSiteAssets, deleteSiteAsset,
  checkIsAdmin,
} from '../services/supabase';
import type { LocationPhoto, SiteAsset, AssetCategory } from '../services/supabase';
import { PROVINCES, LOCATIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  onExit: () => void;
}

// ─── Login screen ──────────────────────────────────────────────────────────────

const LoginScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      if (err.includes('Invalid login credentials')) setError('E-mail of wachtwoord klopt niet.');
      else setError(err);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#F5F3FF] gap-5 px-4">
      <img src="/images/logo-compas.svg" alt="" className="w-16 h-16 object-contain" />
      <div className="text-center">
        <h1 className="font-black text-2xl text-[#3B0764]">Admin Dashboard</h1>
        <p className="text-sm text-[#4B5563] mt-1">Log in met je admin-account om verder te gaan</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-mailadres"
            autoComplete="email"
            autoFocus
            required
            className="w-full pl-9 pr-4 py-3 bg-white border-2 border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl font-bold text-[#1F2937] text-sm outline-none transition-colors"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            autoComplete="current-password"
            required
            className="w-full pl-9 pr-4 py-3 bg-white border-2 border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl font-bold text-[#1F2937] text-sm outline-none transition-colors"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-600 text-xs font-bold text-center"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex items-center justify-center gap-2 py-3 bg-[#7C3AED] text-white font-black rounded-xl shadow-[0_4px_0_#5B21B6] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inloggen'}
        </button>
      </form>

      <button onClick={onExit} className="text-sm text-[#4B5563] underline">
        Terug naar app
      </button>
    </div>
  );
};

// ─── Niet-geautoriseerd scherm ─────────────────────────────────────────────────

const NotAuthorizedScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { signOut, user } = useAuth();
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#F5F3FF] gap-5 px-4">
      <ShieldAlert className="w-16 h-16 text-red-500" />
      <div className="text-center max-w-sm">
        <h1 className="font-black text-2xl text-[#3B0764]">Geen toegang</h1>
        <p className="text-sm text-[#4B5563] mt-2">
          Je bent ingelogd als <strong>{user?.email}</strong>, maar dit account heeft geen
          admin-rechten. Vraag de beheerder om je toe te voegen aan de <code className="text-xs bg-white px-1 py-0.5 rounded">admins</code> tabel in Supabase.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={signOut}
          className="flex items-center justify-center gap-2 py-3 bg-[#7C3AED] text-white font-black rounded-xl shadow-[0_4px_0_#5B21B6] active:translate-y-1 active:shadow-none transition-all"
        >
          <LogOut className="w-4 h-4" /> Uitloggen
        </button>
        <button onClick={onExit} className="py-2 text-sm text-[#4B5563] underline">
          Terug naar app
        </button>
      </div>
    </div>
  );
};

// ─── Top-level dashboard ───────────────────────────────────────────────────────

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin,   setIsAdmin]   = useState<boolean | null>(null);
  const [checking,  setChecking]  = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    setChecking(true);
    checkIsAdmin().then(ok => { setIsAdmin(ok); setChecking(false); });
  }, [user]);

  if (authLoading || (user && checking)) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F5F3FF]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  if (!user)         return <LoginScreen onExit={onExit} />;
  if (isAdmin === false) return <NotAuthorizedScreen onExit={onExit} />;
  if (isAdmin === true)  return <AdminContent onExit={onExit} />;
  return null;
};

// ─── Tab types ─────────────────────────────────────────────────────────────────

type AdminTab = 'photos' | 'assets';

// ─── Main admin content ────────────────────────────────────────────────────────

const AdminContent: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>('photos');
  const { user, signOut } = useAuth();

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F5F3FF] overflow-hidden">

      {/* Header */}
      <header className="flex-none bg-[#3B0764] px-6 py-3 flex items-center gap-4 shadow-lg">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-[#DDD6FE] hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> App
        </button>
        <div className="flex-1 flex justify-center items-center gap-3">
          <img src="/images/logo-compas.svg" alt="" className="h-9 w-9 object-contain" />
          <span className="font-black text-[#FFFFFF] text-lg">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-[#C4B5FD] font-medium">{user?.email}</span>
          <button
            onClick={signOut}
            title="Uitloggen"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4C1D95] hover:bg-[#7C3AED] text-[#DDD6FE] hover:text-white rounded-lg transition-colors text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex-none flex bg-[#4C1D95] border-b border-[#3B0764]">
        {([
          { id: 'photos', label: "Locatie foto's", icon: Image },
          { id: 'assets', label: 'Website vectoren', icon: FileImage },
        ] as { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-black transition-colors ${
              tab === id
                ? 'bg-[#F5F3FF] text-[#3B0764]'
                : 'text-[#DDD6FE] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'photos' ? <PhotosTab /> : <AssetsTab />}
      </div>
    </div>
  );
};

// ─── Photos tab ────────────────────────────────────────────────────────────────

const PhotosTab: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [photos, setPhotos] = useState<LocationPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [filterProvince, setFilterProvince] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const provinceLocations = LOCATIONS.filter(
    l => l.provinceId === selectedProvince && l.type === 'city',
  );

  const selectedLocation = LOCATIONS.find(l => l.id === selectedLocationId);

  const loadPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    setPhotos(await fetchAllPhotos());
    setLoadingPhotos(false);
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadStatus(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !selectedLocationId || !selectedProvince) return;
    setUploading(true);
    setUploadStatus(null);

    const err = await uploadLocationPhoto(
      file, selectedLocationId,
      selectedLocation?.name ?? selectedLocationId,
      selectedProvince, caption,
    );

    if (err) {
      setUploadStatus({ ok: false, msg: err });
    } else {
      setUploadStatus({ ok: true, msg: 'Foto succesvol geüpload!' });
      setFile(null);
      setPreview(null);
      setCaption('');
      await loadPhotos();
    }
    setUploading(false);
  };

  const handleDelete = async (photo: LocationPhoto) => {
    if (!confirm(`Foto van ${photo.location_name} verwijderen?`)) return;
    setDeletingId(photo.id);
    await deleteLocationPhoto(photo.id, photo.storage_path);
    await loadPhotos();
    setDeletingId(null);
  };

  const visiblePhotos = filterProvince
    ? photos.filter(p => p.province_id === filterProvince)
    : photos;

  return (
    <div className="p-6 space-y-6">
      <section className="bg-[#FFFFFF] rounded-2xl border border-[#DDD6FE] shadow-md overflow-hidden">
        <div className="bg-[#3B0764] px-5 py-3">
          <h2 className="font-black text-[#FFFFFF] text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> Foto uploaden
          </h2>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block mb-1">Provincie</label>
              <select
                value={selectedProvince}
                onChange={e => { setSelectedProvince(e.target.value); setSelectedLocationId(''); }}
                className="w-full px-3 py-2.5 bg-[#FFFFFF] border-2 border-[#DDD6FE] rounded-xl font-bold text-[#1F2937] text-sm outline-none focus:border-[#7C3AED]"
              >
                <option value="">— Kies provincie —</option>
                {PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block mb-1">Plaats</label>
              <select
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(e.target.value)}
                disabled={!selectedProvince}
                className="w-full px-3 py-2.5 bg-[#FFFFFF] border-2 border-[#DDD6FE] rounded-xl font-bold text-[#1F2937] text-sm outline-none focus:border-[#7C3AED] disabled:opacity-50"
              >
                <option value="">— Kies plaats —</option>
                {provinceLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block mb-1">Bijschrift (optioneel)</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="bv. Skyline van Rotterdam"
                className="w-full px-3 py-2.5 bg-[#FFFFFF] border-2 border-[#DDD6FE] rounded-xl font-bold text-[#1F2937] text-sm outline-none focus:border-[#7C3AED] placeholder:text-[#9CA3AF] placeholder:font-normal"
              />
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-[#7C3AED] bg-[#7C3AED]/10' : 'border-[#DDD6FE] hover:border-[#7C3AED] bg-[#FFFFFF]'
              }`}
            >
              <Image className="w-6 h-6 mx-auto mb-2 text-[#9CA3AF]" />
              <p className="text-xs font-bold text-[#4B5563]">
                {file ? file.name : 'Sleep foto hierheen of klik om te selecteren'}
              </p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">JPG, PNG, WEBP — max 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            <AnimatePresence>
              {uploadStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold ${
                    uploadStatus.ok
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {uploadStatus.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {uploadStatus.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleUpload}
              disabled={!file || !selectedLocationId || uploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#7C3AED] text-white font-black rounded-xl shadow-[0_4px_0_#5B21B6] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploaden...</> : <><Upload className="w-4 h-4" /> Upload foto</>}
            </button>
          </div>

          <div className="flex items-center justify-center bg-[#FFFFFF] rounded-xl border-2 border-[#DDD6FE] min-h-[260px] overflow-hidden">
            {preview ? (
              <div className="relative w-full h-full">
                <img src={preview} alt="Voorvertoning" className="w-full h-full object-contain max-h-72" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-[#3B0764]/70 rounded-full text-white hover:bg-[#3B0764]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center text-[#9CA3AF]">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Voorvertoning verschijnt hier</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] rounded-2xl border border-[#DDD6FE] shadow-md overflow-hidden">
        <div className="bg-[#3B0764] px-5 py-3 flex items-center justify-between">
          <h2 className="font-black text-[#FFFFFF] text-base">Geüploade foto's ({visiblePhotos.length})</h2>
          <select
            value={filterProvince}
            onChange={e => setFilterProvince(e.target.value)}
            className="text-xs px-2 py-1.5 bg-[#4C1D95] border border-[#4B5563] rounded-lg text-[#DDD6FE] font-bold outline-none"
          >
            <option value="">Alle provincies</option>
            {PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="p-5">
          {loadingPhotos ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>
          ) : visiblePhotos.length === 0 ? (
            <div className="text-center py-10">
              <Image className="w-12 h-12 mx-auto mb-2 text-[#DDD6FE]" />
              <p className="font-bold text-[#4B5563] text-sm">Nog geen foto's geüpload</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visiblePhotos.map(photo => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-xl overflow-hidden border-2 border-[#DDD6FE] bg-[#FFFFFF] aspect-square"
                >
                  <img src={photo.url} alt={photo.location_name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#3B0764]/0 group-hover:bg-[#3B0764]/60 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === photo.id}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      {deletingId === photo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-[#3B0764]/80 px-2 py-1">
                    <p className="text-[10px] font-black text-[#FFFFFF] truncate">{photo.location_name}</p>
                    <p className="text-[9px] text-[#9CA3AF] truncate">{PROVINCES.find(p => p.id === photo.province_id)?.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// ─── Assets tab ────────────────────────────────────────────────────────────────

const CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: 'logo',        label: 'Logo' },
  { id: 'icoon',       label: 'Icoon' },
  { id: 'illustratie', label: 'Illustratie' },
  { id: 'overig',      label: 'Overig' },
];

const AssetsTab: React.FC = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('logo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [filterCategory, setFilterCategory] = useState<AssetCategory | ''>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    setLoadingAssets(true);
    setAssets(await fetchAllSiteAssets());
    setLoadingAssets(false);
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const handleFile = (f: File) => {
    setFile(f);
    setUploadStatus(null);
    if (f.type === 'image/svg+xml' || f.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    setUploading(true);
    setUploadStatus(null);

    const err = await uploadSiteAsset(file, name.trim(), category);

    if (err) {
      setUploadStatus({ ok: false, msg: err });
    } else {
      setUploadStatus({ ok: true, msg: 'Asset succesvol geüpload!' });
      setFile(null);
      setPreview(null);
      setName('');
      await loadAssets();
    }
    setUploading(false);
  };

  const handleDelete = async (asset: SiteAsset) => {
    if (!confirm(`"${asset.name}" verwijderen?`)) return;
    setDeletingId(asset.id);
    await deleteSiteAsset(asset.id, asset.storage_path);
    await loadAssets();
    setDeletingId(null);
  };

  const handleCopy = (asset: SiteAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const visibleAssets = filterCategory
    ? assets.filter(a => a.category === filterCategory)
    : assets;

  return (
    <div className="p-6 space-y-6">
      <section className="bg-[#FFFFFF] rounded-2xl border border-[#DDD6FE] shadow-md overflow-hidden">
        <div className="bg-[#3B0764] px-5 py-3">
          <h2 className="font-black text-[#FFFFFF] text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> Vector / asset uploaden
          </h2>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block mb-1">Naam</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="bv. Cocokiki logo"
                className="w-full px-3 py-2.5 bg-[#FFFFFF] border-2 border-[#DDD6FE] rounded-xl font-bold text-[#1F2937] text-sm outline-none focus:border-[#7C3AED] placeholder:text-[#9CA3AF] placeholder:font-normal"
              />
            </div>

            <div>
              <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block mb-1">Categorie</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 transition-all ${
                      category === c.id
                        ? 'bg-[#7C3AED] border-[#5B21B6] text-white'
                        : 'bg-[#FFFFFF] border-[#DDD6FE] text-[#4B5563] hover:border-[#7C3AED]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-[#7C3AED] bg-[#7C3AED]/10' : 'border-[#DDD6FE] hover:border-[#7C3AED] bg-[#FFFFFF]'
              }`}
            >
              <FileImage className="w-6 h-6 mx-auto mb-2 text-[#9CA3AF]" />
              <p className="text-xs font-bold text-[#4B5563]">
                {file ? file.name : 'Sleep bestand hierheen of klik om te selecteren'}
              </p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">SVG, PNG, WEBP — max 5 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/svg+xml,.svg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            <AnimatePresence>
              {uploadStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold ${
                    uploadStatus.ok
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {uploadStatus.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {uploadStatus.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleUpload}
              disabled={!file || !name.trim() || uploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#7C3AED] text-white font-black rounded-xl shadow-[0_4px_0_#5B21B6] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploaden...</> : <><Upload className="w-4 h-4" /> Upload asset</>}
            </button>
          </div>

          <div
            className="flex items-center justify-center bg-[#FFFFFF] rounded-xl border-2 border-[#DDD6FE] min-h-[260px] overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(#DDD6FE 1px, transparent 1px)', backgroundSize: '12px 12px' }}
          >
            {preview ? (
              <div className="relative flex items-center justify-center w-full h-full p-4">
                <img src={preview} alt="Voorvertoning" className="max-w-full max-h-56 object-contain drop-shadow-md" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-[#3B0764]/70 rounded-full text-white hover:bg-[#3B0764]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center text-[#9CA3AF]">
                <FileImage className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Voorvertoning verschijnt hier</p>
                <p className="text-[10px] mt-1 opacity-60">Raster toont transparantie</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] rounded-2xl border border-[#DDD6FE] shadow-md overflow-hidden">
        <div className="bg-[#3B0764] px-5 py-3 flex items-center justify-between">
          <h2 className="font-black text-[#FFFFFF] text-base">Geüploade assets ({visibleAssets.length})</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterCategory('')}
              className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors ${
                filterCategory === '' ? 'bg-[#7C3AED] text-white' : 'bg-[#4C1D95] text-[#DDD6FE] hover:text-white'
              }`}
            >
              Alles
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(c.id)}
                className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors ${
                  filterCategory === c.id ? 'bg-[#7C3AED] text-white' : 'bg-[#4C1D95] text-[#DDD6FE] hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {loadingAssets ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>
          ) : visibleAssets.length === 0 ? (
            <div className="text-center py-10">
              <FileImage className="w-12 h-12 mx-auto mb-2 text-[#DDD6FE]" />
              <p className="font-bold text-[#4B5563] text-sm">Nog geen assets geüpload</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visibleAssets.map(asset => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-xl overflow-hidden border-2 border-[#DDD6FE] bg-[#FFFFFF] aspect-square"
                  style={{ backgroundImage: 'radial-gradient(#DDD6FE 1px, transparent 1px)', backgroundSize: '8px 8px' }}
                >
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="absolute inset-0 bg-[#3B0764]/0 group-hover:bg-[#3B0764]/70 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleCopy(asset)}
                      className="p-2 bg-[#F59E0B] text-white rounded-full hover:bg-[#A07830] transition-colors"
                      title="URL kopiëren"
                    >
                      {copiedId === asset.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      disabled={deletingId === asset.id}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      {deletingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-[#3B0764]/80 px-2 py-1">
                    <p className="text-[10px] font-black text-[#FFFFFF] truncate">{asset.name}</p>
                    <p className="text-[9px] text-[#F59E0B] capitalize">{asset.category}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
