import React from 'react';

export default function CocoCoin({ size = 20 }: { size?: number }) {
  return <img className="coco-coin" src="/assets/library/ui/cococoin.webp" width={size} height={size} alt="" />;
}
