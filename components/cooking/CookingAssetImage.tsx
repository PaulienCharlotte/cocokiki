import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';

interface CookingAssetImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function CookingAssetImage({ src, alt = '', className }: CookingAssetImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`cooking-asset-fallback ${className ?? ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}><ChefHat aria-hidden="true" /></span>;
  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}
