import React, { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import CardGrid from '../ui/CardGrid';
import ChoiceList from '../ui/ChoiceList';
import SpeechBubble from '../ui/SpeechBubble';
import CookingAssetImage from './CookingAssetImage';
import { CHARACTERS } from '../../data/characters';
import { eisInWoorden, type Bestelling } from '../../data/cooking/orders';
import { RECIPES_BY_ID } from '../../data/cooking/catalog';
import {
  keerBakken, keerOpties, keuzeRecepten, kiesAantalVoorBestelling, kiesReceptVoorBestelling,
  legBestellingTerug, lopendeBestelling, neemBestellingAan, openBestellingen, pastBijBestelling,
} from '../../services/bakeryOrders';
import type { CookingProgressState, RecipeConfig } from '../../data/cooking/types';
import './orders.css';

/**
 * De toonbank: iemand komt langs met een wens.
 *
 * Drie schermen achter elkaar, elk met één vraag: wie help je, welk recept
 * past bij de wens, en hoe vaak moet je dan bakken. Daarna begint het gewone
 * kookavontuur, maar nu met een reden en iemand die erop wacht.
 *
 * Een verkeerd recept is hier geen fout maar een antwoord: de klant zegt zelf
 * waarom het niet past, en je kiest opnieuw. Er gaat niets verloren.
 */
interface OrderFlowProps {
  progress: CookingProgressState;
  /** Opslaan; geeft `false` terug als dat even niet lukt. */
  onSave: (next: CookingProgressState) => boolean;
  /** Het recept is gekozen en het aantal klopt: begin het kookavontuur. */
  onStart: (recipe: RecipeConfig, bestelling: Bestelling) => void;
  onExit: () => void;
}

export default function OrderFlow({ progress, onSave, onStart, onExit }: OrderFlowProps) {
  const [melding, setMelding] = useState('');
  // Welke aantallen al geprobeerd zijn. Net als bij het recept blijft een
  // misser zichtbaar, zodat je niet nog eens hetzelfde aantikt.
  const [geprobeerd, setGeprobeerd] = useState<number[]>([]);
  const lopend = lopendeBestelling(progress);
  const bewaar = (next: CookingProgressState) => {
    if (next === progress) return;
    if (!onSave(next)) setMelding('Opslaan lukt even niet. Je bestelling blijft staan. Probeer het nog eens.');
    else setMelding('');
  };

  // Scherm 1: wie staat er aan de toonbank?
  if (!lopend) {
    const wachtend = openBestellingen(progress);
    if (!wachtend.length) return <main className="bestel-scherm">
      <section className="bestel-kaart">
        <IconButton className="bestel-kaart__terug" label="Terug naar het kookboek" icon={<ArrowLeft size={19} />} onClick={onExit} />
        <SpeechBubble character="coco" label="de toonbank">Er wacht nu niemand. Blader gerust in het kookboek en bak iets voor jezelf.</SpeechBubble>
        <Button size="large" onClick={onExit}>Naar het kookboek</Button>
      </section>
    </main>;
    return <main className="bestel-scherm">
      <section className="bestel-kaart">
        <IconButton className="bestel-kaart__terug" label="Terug naar het kookboek" icon={<ArrowLeft size={19} />} onClick={onExit} />
        <SpeechBubble character="coco" label="de toonbank">{wachtend.length === 1 ? 'Er staat iemand te wachten. Help je even?' : `Er staan ${wachtend.length} mensen te wachten. Wie help je het eerst?`}</SpeechBubble>
        {melding && <p className="bestel-melding" role="alert">{melding}</p>}
        <CardGrid
          label="Kies wie je helpt"
          kolommen={3}
          cards={wachtend.map(bestelling => ({
            id: bestelling.id,
            titel: CHARACTERS[bestelling.klant].naam,
            onder: bestelling.aanleiding,
            beeld: CHARACTERS[bestelling.klant].beeld,
            meta: <span className="bestel-eters"><Users size={15} aria-hidden="true" />{bestelling.eters}</span>,
          }))}
          onChoose={id => bewaar(neemBestellingAan(progress, id))}
        />
      </section>
    </main>;
  }

  const { bestelling, voortgang } = lopend;
  const gekozenRecept = voortgang.recipeId ? RECIPES_BY_ID[voortgang.recipeId] : undefined;
  const terugNaarToonbank = <IconButton className="bestel-kaart__terug" label="De bestelling terugleggen" icon={<ArrowLeft size={19} />} onClick={() => bewaar(legBestellingTerug(progress))} />;

  // Scherm 2: welk recept past bij de wens?
  if (!gekozenRecept) {
    const recepten = keuzeRecepten(progress);
    const afgewezen = voortgang.misgrepen > 0;
    return <main className="bestel-scherm">
      <section className="bestel-kaart">
        {terugNaarToonbank}
        <SpeechBubble character={bestelling.klant} label="de bestelling" aside={<span className="bestel-eters"><Users size={15} aria-hidden="true" />{bestelling.eters}</span>}>
          {bestelling.wens}
        </SpeechBubble>
        <p className="bestel-briefje"><strong>{eisInWoorden(bestelling)}</strong><span>voor {bestelling.eters} mensen</span></p>
        {melding && <p className="bestel-melding" role="alert">{melding}</p>}
        <ChoiceList
          label="Welk recept past hierbij?"
          choices={recepten.map(recipe => ({
            id: recipe.id,
            label: recipe.name,
            icoon: recipe.image,
            // Een afgewezen recept blijft zichtbaar als afgewezen, zodat je
            // ziet wat je al hebt geprobeerd in plaats van opnieuw te gokken.
            staat: afgewezen && !pastBijBestelling(bestelling, recipe) ? 'mis' as const : undefined,
          }))}
          onChoose={id => {
            const recipe = RECIPES_BY_ID[id];
            if (afgewezen && recipe && !pastBijBestelling(bestelling, recipe)) return;
            bewaar(kiesReceptVoorBestelling(progress, id));
          }}
        />
        {afgewezen && <p className="bestel-uitleg">{bestelling.afwijzing}</p>}
      </section>
    </main>;
  }

  // Scherm 3: hoe vaak moet je bakken?
  const goed = keerBakken(bestelling, gekozenRecept);
  const klaar = voortgang.keerGekozen === goed;
  const misgegokt = !voortgang.aantalInEenKeer && !klaar;
  return <main className="bestel-scherm">
    <section className="bestel-kaart">
      {terugNaarToonbank}
      <SpeechBubble character="coco" label="hoeveel maak je er" tone={klaar ? 'goed' : 'default'}>
        {klaar
          ? `${goed} keer bakken dus. Dan heb je er genoeg. Zet hem maar klaar.`
          : `Je maakt ${gekozenRecept.name.toLowerCase()}. Eén keer bakken geeft ${gekozenRecept.servings} ${gekozenRecept.servings === 1 ? 'portie' : 'porties'}, en er komen ${bestelling.eters} mensen. Hoe vaak moet je bakken?`}
      </SpeechBubble>
      <figure className="bestel-gerecht"><CookingAssetImage src={gekozenRecept.image} alt={gekozenRecept.name} /></figure>
      {melding && <p className="bestel-melding" role="alert">{melding}</p>}
      {klaar
        ? <Button size="large" onClick={() => onStart(gekozenRecept, bestelling)}>Beginnen voor {CHARACTERS[bestelling.klant].naam}</Button>
        : <>
          <ChoiceList
            label="Hoe vaak moet je bakken?"
            choices={keerOpties(bestelling, gekozenRecept).map(keer => ({
              id: String(keer),
              label: `${keer} keer bakken`,
              staat: geprobeerd.includes(keer) ? 'mis' as const : undefined,
            }))}
            onChoose={id => {
              const keer = Number(id);
              if (geprobeerd.includes(keer)) return;
              if (keer !== goed) setGeprobeerd(eerder => [...eerder, keer]);
              bewaar(kiesAantalVoorBestelling(progress, keer));
            }}
          />
          {misgegokt && <p className="bestel-uitleg">Dat is niet genoeg voor iedereen. Tel nog eens: {gekozenRecept.servings} per keer, en er komen er {bestelling.eters}.</p>}
        </>}
    </section>
  </main>;
}

/** De klant die nu op je wacht, als klein kaartje in het kookboek. */
export function OrderInvite({ bestelling, lopend = false, onOpen }: { bestelling: Bestelling; lopend?: boolean; onOpen: () => void }) {
  const klant = CHARACTERS[bestelling.klant];
  return <button type="button" className="bestel-uitnodiging" onClick={onOpen}>
    <img src={klant.beeld} alt="" />
    <span>
      <strong>{lopend ? `Je bakt voor ${klant.naam}` : `${klant.naam} wacht op je`}</strong>
      <small>{lopend ? 'Terug naar de bestelling' : bestelling.aanleiding}</small>
    </span>
  </button>;
}
