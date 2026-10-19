import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, WheelEvent } from 'react';

interface Camera { x: number; y: number; zoom: number; }
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.35;

export function useWorldCamera() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragOrigin = useRef<{ x: number; y: number; camera: Camera } | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 0.7 });

  const reset = useCallback(() => {
    const width = viewportRef.current?.clientWidth ?? 1200;
    const height = viewportRef.current?.clientHeight ?? 700;
    const zoom = Math.max(MIN_ZOOM, Math.min(1, Math.min(width / 1750, height / 1100)));
    setCamera({ x: 0, y: 0, zoom });
  }, []);

  useEffect(() => {
    reset();
    const observer = new ResizeObserver(reset);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [reset]);

  const clamp = useCallback((next: Camera): Camera => ({
    zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next.zoom)),
    x: Math.max(-920, Math.min(920, next.x)),
    y: Math.max(-580, Math.min(580, next.y)),
  }), []);

  const zoomBy = useCallback((amount: number) => {
    setCamera(current => clamp({ ...current, zoom: current.zoom + amount }));
  }, [clamp]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragOrigin.current = { x: event.clientX, y: event.clientY, camera };
  }, [camera]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const active = [...pointers.current.values()];
    if (active.length === 2) {
      const distance = Math.hypot(active[0].x - active[1].x, active[0].y - active[1].y);
      if (pinchDistance.current !== null) zoomBy((distance - pinchDistance.current) / 360);
      pinchDistance.current = distance;
      return;
    }
    if (!dragOrigin.current) return;
    const start = dragOrigin.current;
    setCamera(clamp({
      ...start.camera,
      x: start.camera.x + event.clientX - start.x,
      y: start.camera.y + event.clientY - start.y,
    }));
  }, [clamp, zoomBy]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    pinchDistance.current = null;
    dragOrigin.current = null;
  }, []);

  const onWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomBy(event.deltaY > 0 ? -0.08 : 0.08);
  }, [zoomBy]);

  return { viewportRef, camera, reset, zoomBy, onPointerDown, onPointerMove, onPointerUp, onWheel };
}
