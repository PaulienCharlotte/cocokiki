import React, { useState } from 'react';
import { X } from 'lucide-react';
import ChoiceList from '../ui/ChoiceList';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import SpeechBubble from '../ui/SpeechBubble';
import type { CharacterId } from '../../data/characters';
import type { QuizBron } from '../../data/quiz/vragen';
import { QUIZ_BELONING, beantwoordGoed, loadQuiz, quizStand, vraagVanDeDag } from '../../services/quiz';

/**
 * Eén vraag per dag, gemaakt uit wat de app al weet.
 *
 * Geen nieuw spel en geen nieuwe tekeningen: de vraag komt uit de velden van
 * de planten, de ingrediënten en de voedingsstoffen. Schrijf je er een plant
 * bij, dan staan de vragen erover er vanzelf bij.
 *
 * De kaart is de standaardvorm van een meerkeuzevraag: een spraakwolk die hem
 * stelt en één blok met de antwoorden. Zie `.claude/skills/cocokiki-ui`.
 */

/** Wie de vraag stelt hangt af van waar hij over gaat; ze blijven bij hun gebied. */
const GIDS: Record<QuizBron, CharacterId> = { planten: 'kiki', eten: 'coco', voeding: 'coco' };

export default function VraagVanDeDag() {
  const [state, setState] = useState(loadQuiz);
  const [vraag] = useState(() => vraagVanDeDag());
  const [gekozen, setGekozen] = useState<string | null>(null);
  if (!vraag) return null;

  const goed = gekozen === vraag.antwoord;
  const stand = quizStand(state);
  const kies = (optie: string) => {
    if (gekozen) return;
    setGekozen(optie);
    if (optie === vraag.antwoord) setState(beantwoordGoed(vraag.id, state));
  };

  return <section className={`vraagdag${gekozen === null ? '' : goed ? ' is-goed' : ' is-mis'}`} aria-labelledby="vraag-van-de-dag">
    {/* Of het goed was moet je zien zonder te zoeken: de wolk zelf kleurt en
        zegt het, inclusief de munt die je ermee verdiend hebt. */}
    <SpeechBubble
      character={GIDS[vraag.bron]}
      tone={gekozen === null ? 'default' : goed ? 'goed' : 'alert'}
      label={gekozen === null ? 'vraag van de dag'
        : goed ? <span className="ck-zegt__uitslag"><img src={ASSET_LIBRARY.brand.coinCompass} alt="" />goed! +{QUIZ_BELONING}</span>
        : <span className="ck-zegt__uitslag"><X size={13} aria-hidden="true" />helaas</span>}
      textId="vraag-van-de-dag"
      aside={<span aria-label={`${stand.goed} van ${stand.totaal} goed`}>{stand.goed}<i>/{stand.totaal}</i></span>}
    >{vraag.vraag}</SpeechBubble>

    <ChoiceList
      label="Kies een antwoord"
      disabled={gekozen !== null}
      onChoose={kies}
      choices={vraag.opties.map(optie => ({
        id: optie,
        label: optie,
        staat: gekozen === null ? undefined : optie === vraag.antwoord ? 'goed' : gekozen === optie ? 'mis' : undefined,
      }))}
    />

    {gekozen !== null && vraag.toelichting && <p className="vraagdag__na" role="status">{vraag.toelichting}</p>}
  </section>;
}
