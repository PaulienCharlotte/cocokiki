import { useEffect, useRef, useState } from 'react';
import { LuaAudio } from '../red-baby-lua/game/systems/audio';
import { commitLocalState, readDocument } from '../../services/localState';
const KEY = 'cocokiki:math-sound:v1';
export function useMathSound() {
  const audio = useRef<LuaAudio | null>(null);
  const [sound, setSound] = useState(() => { try { return readDocument(KEY) === 'true'; } catch { return false; } });
  useEffect(() => () => audio.current?.destroy(), []);
  const play = (correct: boolean) => {
    if (!sound) return;
    try { audio.current ??= new LuaAudio(); audio.current.unlock(); audio.current.play(correct ? 'success' : 'wrong'); } catch { /* Audio is optional. */ }
  };
  const toggleSound = () => { setSound(value => !value); commitLocalState({ [KEY]: String(!sound) }); };
  return { sound, toggleSound, play };
}
