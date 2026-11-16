import React, { useState } from 'react';
import '../../styles/cocokiki-tokens.css';
import './account.css';
import { accountsBeschikbaar, isGast, leesSessie, logIn, maakAccount, naamGeldig, speelAlsGast, startAutoBewaren } from '../../services/account';

export function AccountPoort({ children }: { children: React.ReactNode }) {
  const [binnen, setBinnen] = useState(() => !accountsBeschikbaar() || !!leesSessie() || isGast());
  const [nieuw, setNieuw] = useState(false);
  const [naam, setNaam] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [melding, setMelding] = useState('');
  const [bezig, setBezig] = useState(false);

  if (binnen) { startAutoBewaren(); return <>{children}</>; }

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naamGeldig(naam)) return setMelding('Kies een naam van 3 tot 24 letters of cijfers.');
    if (wachtwoord.length < 6) return setMelding('Je wachtwoord heeft minstens 6 tekens nodig.');
    setBezig(true); setMelding('');
    try { await (nieuw ? maakAccount(naam, wachtwoord) : logIn(naam, wachtwoord)); window.location.reload(); }
    catch (fout) { setMelding((fout as Error).message); setBezig(false); }
  };

  return (
    <div className="ck-account" data-wereld="boomhut">
      <form className="ck-account__kaart ck-papier" onSubmit={verstuur}>
        <img className="ck-account__logo" src="/images/cocokiki-logo.webp" alt="CocoKiki" />
        <h1 className="ck-account__titel">{nieuw ? 'Maak je account' : 'Welkom terug!'}</h1>
        <label className="ck-account__veld">Jouw naam
          <input value={naam} onChange={e => setNaam(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        </label>
        <label className="ck-account__veld">Wachtwoord
          <input type="password" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} autoComplete={nieuw ? 'new-password' : 'current-password'} required />
        </label>
        {melding && <p className="ck-account__melding" role="alert">{melding}</p>}
        <button className="ck-knop ck-knop--hoofd" disabled={bezig}>{bezig ? 'Even geduld…' : nieuw ? 'Account maken' : 'Inloggen'}</button>
        <button type="button" className="ck-linkje" onClick={() => { setNieuw(!nieuw); setMelding(''); }}>
          {nieuw ? 'Ik heb al een account' : 'Nieuw hier? Maak een account'}
        </button>
        <button type="button" className="ck-linkje" onClick={() => { speelAlsGast(); setBinnen(true); }}>Spelen zonder account</button>
      </form>
    </div>
  );
}
