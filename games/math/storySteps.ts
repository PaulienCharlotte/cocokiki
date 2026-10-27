import { evaluate } from './engine';
import type { Expression } from './types';

export interface StoryStep { left: number; right: number; operation: '+' | '-' | '*' | '/'; answer: number }

export function storySteps(expression: Expression): StoryStep[] {
  if (!('op' in expression)) return [];
  // Convert a percentage into a share of the harvest, without inflating its quantity.
  if (expression.op === '/' && 'value' in expression.right && expression.right.value === 100 && 'op' in expression.left && expression.left.op === '*' && 'value' in expression.left.right && 100 % expression.left.right.value === 0) {
    return [...storySteps(expression.left.left), {
      left: evaluate(expression.left.left), right: 100 / expression.left.right.value, operation: '/', answer: evaluate(expression),
    }];
  }
  return [...storySteps(expression.left), ...storySteps(expression.right), {
    left: evaluate(expression.left), right: evaluate(expression.right), operation: expression.op, answer: evaluate(expression),
  }];
}
