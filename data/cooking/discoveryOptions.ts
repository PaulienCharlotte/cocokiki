import type { DiscoveryQuestion } from './types';
import { shuffle } from './nutrientMemory';
/** Stable through rerenders/reloads; correct positions rotate across a journey. */
export function discoveryOptions(question: DiscoveryQuestion, seed: string, questionIndex: number) {
  let hash = [...seed].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 17);
  const offset = hash % question.options.length;
  const random = () => { hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0; return hash / 4294967296; };
  const others = shuffle(question.options.filter(option => option.id !== question.correctOptionId), random);
  const correct = question.options.find(option => option.id === question.correctOptionId);
  if (correct) others.splice((offset + questionIndex) % question.options.length, 0, correct);
  return others;
}
