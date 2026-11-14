import React from 'react';
import { Check } from 'lucide-react';

/**
 * De stappenbalk: waar ben ik in dit avontuur?
 *
 * Het kookavontuur had deze balk al; de plantendokter had drie naamloze
 * streepjes. Dat zijn twee vormen voor hetzelfde, dus staat hij nu hier en
 * gebruiken beide hem. Een stap die klaar is krijgt een vinkje.
 */
export interface Stage {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function StageProgress({ stages, current, completed = [], label }: {
  stages: Stage[]; current: string; completed?: string[]; label: string;
}) {
  const nu = stages.findIndex(stage => stage.id === current);
  return <ol className="journey-stages" aria-label={label} style={{ ['--stappen' as string]: stages.length }}>
    {stages.map((stage, index) => {
      const bezig = stage.id === current;
      const klaar = !bezig && (completed.includes(stage.id) || (nu >= 0 && index < nu));
      return <li key={stage.id} className={bezig ? 'is-current' : klaar ? 'is-complete' : ''} aria-current={bezig ? 'step' : undefined}>
        <span className="journey-stages__icon" aria-hidden="true">{klaar ? <Check /> : stage.icon}</span>
        <span className="journey-stages__label">{stage.label}</span>
      </li>;
    })}
  </ol>;
}
