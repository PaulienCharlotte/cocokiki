
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, LogOut, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentSessions, fetchLocationProgress } from '../services/supabase';
import type { ScoreSession, LocationProgress } from '../services/supabase';

const MODE_LABELS: Record<string, string> = {
  find: 'Zoeken', spell: 'Spellen', master: 'Oefenmeester',
  memory: 'Memory', explore: 'Verkennen', mnemonic: 'Ezelsbruggetje',
};

interface ProfilePanelProps {
  onClose: () => void;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ onClose }) => {
  const { user, profile, signOut } = useAuth();
  const [sessions,  setSessions]  = useState<ScoreSession[]>([]);
  const [progress,  setProgress]  = useState<LocationProgress[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchRecentSessions(user.id, 5), fetchLocationProgress(user.id)])
      .then(([s, p]) => { setSessions(s); setProgress(p); setLoading(false); });
  }, [user]);

  const handleSignOut = async () => { await signOut(); onClose(); };

  if (!user || !profile) return null;

  const masteredCount = progress.filter(p => p.correct_count >= 3).length;

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[8000]"
        />
        <motion.div
          key="panel"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[8001] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-5 pt-6 pb-8 relative flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-3xl mb-2">🦦</div>
            <h2 className="text-white font-black text-lg leading-tight">{profile.display_name}</h2>
            <p className="text-indigo-200 text-xs font-medium mt-0.5">{user.email}</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 px-5 -mt-5 flex-shrink-0">
            {[
              { label: 'Punten',    value: profile.total_score, icon: '🏆' },
              { label: 'Geleerd',   value: masteredCount,        icon: '⭐' },
              { label: 'Geoefend', value: progress.length,      icon: '🎯' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-md p-3 text-center border-2 border-slate-50">
                <div className="text-xl">{stat.icon}</div>
                <div className="font-black text-slate-700 text-lg leading-none mt-1">{stat.value}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {sessions.length > 0 && (
                  <section>
                    <h3 className="font-black text-slate-600 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> Recente sessies
                    </h3>
                    <div className="space-y-1.5">
                      {sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                          <div>
                            <div className="font-bold text-xs text-slate-700">{MODE_LABELS[s.mode] ?? s.mode}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(s.created_at).toLocaleDateString('nl-NL')}
                            </div>
                          </div>
                          <div className="font-black text-indigo-600 text-sm">+{s.score}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {progress.length > 0 && (
                  <section>
                    <h3 className="font-black text-slate-600 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-green-400" /> Geoefende plaatsen
                    </h3>
                    <div className="space-y-1.5">
                      {progress.slice(0, 10).map(p => (
                        <div key={p.location_id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                          <div>
                            <div className="font-bold text-xs text-slate-700">{p.location_name}</div>
                            <div className="text-[10px] text-slate-400">{p.attempt_count}× geprobeerd</div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map(n => (
                              <Star
                                key={n}
                                className={`w-3 h-3 ${p.correct_count >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {sessions.length === 0 && progress.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="font-bold text-slate-500 text-sm">Nog geen data</p>
                    <p className="text-xs text-slate-400 mt-1">Speel een paar rondes om je voortgang te zien!</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sign out */}
          <div className="flex-shrink-0 p-5 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" /> Uitloggen
            </button>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default ProfilePanel;
