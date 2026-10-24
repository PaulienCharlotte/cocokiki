import React, { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import CookingAssetImage from './CookingAssetImage';

interface DragToTargetProps {
  sourceAsset: string;
  sourceLabel: string;
  targetLabel: string;
  targetAsset?: string;
  onHit: () => void;
  onMiss: () => void;
}

/**
 * Een sleepstap met één zichtbaar doel. De stap gaat alleen verder wanneer het
 * ingrediënt op het doel wordt losgelaten; ernaast loslaten veert terug.
 * Tikken doet hetzelfde als slepen, zodat het ook met toetsenbord lukt.
 */
export default function DragToTarget({ sourceAsset, sourceLabel, targetLabel, targetAsset, onHit, onMiss }: DragToTargetProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);
  const [over, setOver] = useState(false);

  const isOverTarget = (point: { x: number; y: number }) => {
    const bounds = targetRef.current?.getBoundingClientRect();
    if (!bounds) return false;
    const margin = 28;
    return point.x >= bounds.left - margin && point.x <= bounds.right + margin
      && point.y >= bounds.top - margin && point.y <= bounds.bottom + margin;
  };

  const land = () => {
    if (landed) return;
    setLanded(true);
    setOver(false);
    window.setTimeout(onHit, 520);
  };

  return <div className="cooking-drop">
    <div className="cooking-drop__source-slot">
      {!landed && <motion.button
        type="button"
        className="cooking-drop__source"
        drag
        dragSnapToOrigin
        dragMomentum={false}
        whileTap={{ scale: .97 }}
        whileDrag={{ scale: 1.1, zIndex: 3 }}
        onDrag={(_, info: PanInfo) => setOver(isOverTarget(info.point))}
        onDragEnd={(_, info: PanInfo) => {
          if (isOverTarget(info.point)) return land();
          setOver(false);
          onMiss();
        }}
        onClick={land}
        aria-label={`${sourceLabel} naar ${targetLabel.toLowerCase()}`}
      >
        <CookingAssetImage src={sourceAsset} alt="" />
      </motion.button>}
      <span className="cooking-drop__caption">{sourceLabel}</span>
    </div>

    <span className="cooking-drop__arrow" aria-hidden="true" />

    <div className="cooking-drop__target-slot">
      <div ref={targetRef} className={`cooking-drop__target${over ? ' is-over' : ''}${landed ? ' is-filled' : ''}`}>
        {targetAsset
          ? <CookingAssetImage src={targetAsset} alt="" />
          : <span className="cooking-drop__plate" aria-hidden="true" />}
        {landed && <motion.span
          className="cooking-drop__landed"
          initial={{ scale: .4, y: -40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <CookingAssetImage src={sourceAsset} alt="" />
        </motion.span>}
        {landed && <span className="cooking-drop__check" aria-hidden="true"><Check /></span>}
      </div>
      <span className="cooking-drop__caption">{targetLabel}</span>
    </div>
  </div>;
}
