import React from 'react';
import { decorViewImage, type DecorProduct } from '../../data/decorCatalog';

interface DecorAssetProps {
  product: DecorProduct;
  className?: string;
  /** Welk aanzicht te tonen; weggelaten betekent het winkelplaatje. */
  view?: number;
}

export default function DecorAsset({ product, className = '', view }: DecorAssetProps) {
  return <img
    className={`decor-asset decor-asset--${product.id} ${className}`.trim()}
    src={view === undefined ? product.image : decorViewImage(product, view)}
    alt={product.name}
    draggable={false}
    loading="lazy"
    decoding="async"
  />;
}

