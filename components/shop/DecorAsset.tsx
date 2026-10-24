import React from 'react';
import type { DecorProduct } from '../../data/decorCatalog';

interface DecorAssetProps {
  product: DecorProduct;
  className?: string;
}

export default function DecorAsset({ product, className = '' }: DecorAssetProps) {
  return <img
    className={`decor-asset decor-asset--${product.id} ${className}`.trim()}
    src={product.image}
    alt={product.name}
    draggable={false}
  />;
}

