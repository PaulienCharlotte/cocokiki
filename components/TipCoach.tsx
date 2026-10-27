import React from 'react';
import './tip-coach.css';

export default function TipCoach({ coach, children }: { coach: 'lua' | 'seb'; children: React.ReactNode }) {
  const name = coach === 'lua' ? 'Baby Lua' : 'Seb';
  return <aside className="tip-coach" aria-label={`Tip van ${name}`} role="status">
    <img src={coach === 'lua' ? '/images/avatars/luiaard.webp' : '/images/avatars/lua.webp'} alt={name} />
    <div><strong>{name}</strong><p>{children}</p></div>
  </aside>;
}
