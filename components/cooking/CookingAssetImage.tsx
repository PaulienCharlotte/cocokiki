import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';

interface CookingAssetImageProps {
  src: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export default function CookingAssetImage({ src, alt = '', className, loading }: CookingAssetImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <span className={`cooking-asset-fallback ${className ?? ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}><ChefHat aria-hidden="true" /></span>;
  return <img className={className} src={src} alt={alt} loading={loading} decoding="async" draggable={false} onError={() => setFailed(true)} />;
}
