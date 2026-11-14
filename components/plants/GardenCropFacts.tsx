import React from 'react';
import type { GardenCrop } from '../../data/plants/garden';
import { formatGardenNumber } from '../../data/plants/garden';
import './garden-facts.css';

export default function GardenCropFacts({ crop }: { crop: GardenCrop }) {
  return <div className="garden-facts">
    <img src={crop.image} alt={crop.name} />
    <p><strong>Groeiseizoen</strong><br />{crop.calendar}</p>
    <p><strong>Ruimte en verzorging</strong><br />{crop.care}</p>
    <p>In onze rij oefenen we met {formatGardenNumber(crop.spacing)} cm tussen de planten. De echte afstand hangt ook af van de soort en het ras: kijk op het zakje of plantenlabel.</p>
  </div>;
}
