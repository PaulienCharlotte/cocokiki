import { RefObject, useEffect, useState } from 'react';

/** Volg de werkelijke balkhoogte, ook bij browserzoom en grotere tekst. */
export function useTopoHeaderBottom(root: RefObject<HTMLDivElement | null>) {
  const [bottom, setBottom] = useState<number>();
  useEffect(() => {
    const shell = root.current?.closest('.world-shell');
    const header = shell?.querySelector<HTMLElement>('.world-shell__header .world-hud')
      ?? root.current?.querySelector<HTMLElement>('.world-hud');
    if (!header) return;
    const measure = () => setBottom(Math.ceil(header.getBoundingClientRect().bottom));
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect(); window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [root]);
  return bottom;
}
