
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

type Tab = 'login' | 'register';

const InputField: React.FC<{
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}> = ({ icon, type, placeholder, value, onChange, autoComplete }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete={autoComplete}
      required
      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 rounded-xl text-sm font-medium text-slate-700 outline-none transition-colors placeholder:text-slate-300"
    />
  </div>
);

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signIn, signUp } = useAuth();

  const [tab,         setTab]         = useState<Tab>('login');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    let err: string | null = null;

    if (tab === 'login') {
      err = await signIn(email, password);
      if (!err) onClose();
    } else {
      if (displayName.trim().length < 2) {
        setError('Vul een naam in van minimaal 2 tekens.');
        setLoading(false);
        return;
      }
      err = await signUp(email, password, displayName.trim());
      if (!err) {
        setSuccess(true); // Supabase sends a confirmation email by default
      }
    }

    if (err) {
      // Translate common Supabase error messages to Dutch
      if (err.includes('Invalid login credentials')) setError('E-mail of wachtwoord klopt niet.');
      else if (err.includes('Email already registered') || err.includes('already been registered')) setError('Dit e-mailadres is al in gebruik.');
      else if (err.includes('Password should be')) setError('Wachtwoord moet minimaal 6 tekens zijn.');
      else setError(err);
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9000]"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9001] w-full max-w-sm px-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-6 pb-8 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-3xl mb-2">🦦</div>
            <h2 className="text-white font-black text-xl leading-tight">
              {tab === 'login' ? 'Welkom terug!' : 'Account aanmaken'}
            </h2>
            <p className="text-indigo-200 text-xs font-medium mt-1">
              {tab === 'login'
                ? 'Log in om je voortgang te bewaren'
                : 'Maak een account en bewaar al je scores'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-50 border-b border-slate-100">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); reset(); }}
                className={`flex-1 py-3 text-xs font-black transition-colors ${
                  tab === t
                    ? 'text-indigo-600 border-b-2 border-indigo-500 bg-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'login' ? '🔑 Inloggen' : '✨ Registreren'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="px-6 py-5">
            {success ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📬</div>
                <p className="font-black text-slate-700">Controleer je e-mail!</p>
                <p className="text-sm text-slate-500 mt-1">
                  We hebben een bevestigingslink gestuurd naar <strong>{email}</strong>.
                  Klik op de link om je account te activeren.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-indigo-500 text-white font-black rounded-xl text-sm"
                >
                  Sluiten
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {tab === 'register' && (
                  <InputField
                    icon={<UserIcon className="w-4 h-4" />}
                    type="text"
                    placeholder="Jouw naam (bijnaam mag ook)"
                    value={displayName}
                    onChange={setDisplayName}
                    autoComplete="name"
                  />
                )}

                <InputField
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  placeholder="E-mailadres"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />

                <InputField
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  placeholder="Wachtwoord (min. 6 tekens)"
                  value={password}
                  onChange={setPassword}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 mt-1 py-3 bg-indigo-500 text-white font-black rounded-xl shadow-[0_4px_0_#4338CA] hover:brightness-105 active:translate-y-1 active:shadow-none transition-all disabled:opacity-60"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : tab === 'login'
                      ? <><LogIn className="w-4 h-4" /> Inloggen</>
                      : <><UserPlus className="w-4 h-4" /> Account aanmaken</>
                  }
                </button>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Je kunt ook gewoon spelen zonder account —<br />
                  je scores worden dan alleen lokaal bewaard.
                </p>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
