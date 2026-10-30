import React from 'react';
import { decorViewImage, type DecorProduct } from '../../data/decorCatalog';

interface DecorAssetProps {
  product: DecorProduct;
  className?: string;
  /** Welk aanzicht te tonen; weggelaten betekent het winkelplaatje. */
  view?: number;
}

export default function DecorAsset({ product, className = '', view }: DecorAssetProps) {
  const clipId = React.useId();
  if (product.sheet) {
    const { columns, rows, width, height } = product.sheet;
    const index = ((Math.round(view ?? 0) % product.views) + product.views) % product.views;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const frame = product.sheet.frames?.[index] ?? {
      x: index % columns * cellWidth, y: Math.floor(index / columns) * cellHeight,
      width: cellWidth, height: cellHeight,
    };
    return <svg
      className={`decor-asset decor-asset--${product.id} ${className}`.trim()}
      viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
      width={frame.width} height={frame.height} role="img" aria-label={product.name}
      style={{ overflow: 'hidden' }}
    >
      <title>{product.name}</title>
      <defs><clipPath id={clipId}><rect
        x={frame.x} y={frame.y} width={frame.width} height={frame.height}
      /></clipPath></defs>
      <image href={product.image} width={width} height={height} clipPath={`url(#${clipId})`} />
    </svg>;
  }
  return <img
    className={`decor-asset decor-asset--${product.id} ${className}`.trim()}
    src={view === undefined ? product.image : decorViewImage(product, view)}
    alt={product.name}
    draggable={false}
    loading="lazy"
    decoding="async"
  />;
}

