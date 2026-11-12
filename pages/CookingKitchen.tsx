import React, { useEffect, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { IconButton } from '../design-system';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { loadCookingProgress } from '../services/cookingProgress';
import InteractiveKitchen from '../components/treehouse/InteractiveKitchen';

/** De vaste bereidingsplek staat los van de kamers die je zelf inricht. */
export default function CookingKitchen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const viewportRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [progress] = useState(loadCookingProgress);
  useEffect(() => {
    const center = () => {
      const viewport = viewportRef.current;
      if (viewport) viewport.scrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth) / 2;
    };
    const frame = requestAnimationFrame(center);
    window.addEventListener('resize', center);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', center); };
  }, []);

  return <main ref={viewportRef} className="treehouse-interior cooking-studio-kitchen" aria-label="De keuken">
    <div ref={sceneRef} className="treehouse-interior__scene">
      <img className="treehouse-interior__background" src={ASSET_LIBRARY.treehouse.rooms.kitchen} alt="De ingerichte keuken in Coco’s kookstudio" />
      <h1 className="sr-only">De keuken</h1>
      <InteractiveKitchen progress={progress} sceneRef={sceneRef} onNavigate={onNavigate} />
    </div>
    <IconButton className="cooking-studio-kitchen__cookbook" label="Mijn Kookboek openen" icon={<BookOpen />} onClick={() => onNavigate('/treehouse/cookbook?from=coco')} />
  </main>;
}
