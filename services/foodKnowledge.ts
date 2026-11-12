import { FOOD_LESSONS } from '../data/cooking/foodLessons';
import { commitLocalState, readDocument } from './localState';
export const FOOD_KNOWLEDGE_KEY = 'cocokiki:food-discoveries:v1';
export function loadFoodKnowledge(): string[] {
  try {
    const value = JSON.parse(readDocument(FOOD_KNOWLEDGE_KEY) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter(id => FOOD_LESSONS.some(lesson => lesson.id === id)))] : [];
  } catch { return []; }
}
export function completeFoodLesson(id: string): boolean {
  if (!FOOD_LESSONS.some(lesson => lesson.id === id)) return false;
  return commitLocalState({ [FOOD_KNOWLEDGE_KEY]: JSON.stringify([...new Set([...loadFoodKnowledge(), id])]) }).status === 'applied';
}
