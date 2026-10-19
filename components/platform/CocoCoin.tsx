import React from 'react';

export default function CocoCoin({ size = 20 }: { size?: number }) {
  return <img className="coco-coin" src="/images/logo-compas-geel.svg" width={size} height={size} alt="" />;
}
