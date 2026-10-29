import React, { useEffect, useRef, useState } from 'react';
import './amount-input.css';

export default function AmountInput({ value, onChange, label, minimum = 0, maximum = 10000 }: { value: number; onChange: (value: number) => void; label: string; minimum?: number; maximum?: number }) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(String(value)); }, [value]);
  const commit = () => {
    const number = Number(draft);
    const next = Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? Math.trunc(number) : minimum));
    focused.current = false;
    setDraft(String(next));
    onChange(next);
  };
  return <input className="cooking-amount-input" type="number" inputMode="numeric" min={minimum} max={maximum} step="1" aria-label={label}
    value={draft} onFocus={() => { focused.current = true; }} onBlur={commit}
    onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}
    onChange={event => {
      const raw = event.target.value;
      setDraft(raw);
      const number = Number(raw);
      if (raw === '') onChange(0);
      else if (Number.isFinite(number) && Number.isSafeInteger(number)) onChange(Math.min(maximum, Math.max(0, number)));
      else onChange(0);
    }} />;
}
