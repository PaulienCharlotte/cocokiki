import React from 'react';
import { AnswerChoices } from './ChoiceChallenge';
import { mathAssets } from './assets';
import type { StoryQuestion } from './storyProblems';

export default function StoryChallenge({ question, locked, selected, onAnswer }: {
  question: StoryQuestion; locked: boolean; selected?: number; onAnswer: (value: number) => void;
}) {
  return <div className="story-challenge">
    <div className="story-scene" aria-hidden="true">
      <img src={mathAssets.squirrel} alt="" />
      <div className="story-scene__harvest"><img src={mathAssets.basket} alt="" /><img className="story-scene__fruit" src={question.scene === 'acorns' ? mathAssets.acorn : mathAssets.strawberry} alt="" /></div>
      <img src={question.scene === 'acorns' ? mathAssets.treeHollow : mathAssets.blueberryPlant} alt="" />
    </div>
    <span className="story-unit">{question.unit}</span>
    <AnswerChoices question={question} locked={locked} selected={selected} onAnswer={onAnswer} />
    {locked && <p className="story-explanation">{question.explanation}</p>}
  </div>;
}
