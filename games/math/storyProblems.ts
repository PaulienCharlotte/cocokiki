import { answerChoices, evaluate, expressionText } from './engine';
import type { Expression, MathLevel, MathQuestion } from './types';

const n = (value: number): Expression => ({ value });
const op = (symbol: '+' | '-' | '*' | '/', left: Expression, right: Expression): Expression => ({ op: symbol, left, right });
export interface StoryQuestion extends MathQuestion { scene: 'berries' | 'acorns' | 'both'; unit: string; explanation: string }

export function createStoryQuestion(level: MathLevel, index: number, random = Math.random): StoryQuestion {
  const a = 4 + index + Math.floor(random() * 6), b = 3 + Math.floor(random() * 6);
  const extra = 6 + Math.floor(random() * 15), variant = index % 2;
  let expression: Expression, prompt: string, hint: string, unit = 'bessen';
  let scene: StoryQuestion['scene'] = variant ? 'acorns' : 'berries';
  if (level === 1) {
    expression = variant ? op('-', op('*', n(a), n(b)), n(b)) : op('+', op('*', n(a), n(b)), n(extra));
    prompt = variant ? `De eekhoorn heeft ${a} zakjes met elk ${b} eikels. Een vogel neemt ${b} eikels mee. Hoeveel eikels blijven er over?` : `Coco plukt ${a} mandjes met elk ${b} bessen. Kiki brengt nog ${extra} losse bessen. Hoeveel bessen hebben ze samen?`;
    hint = 'Bereken eerst hoeveel er in alle mandjes of zakjes zit. Verwerk daarna wat erbij komt of weggaat.';
  } else if (level === 2) {
    const total = a * b + extra;
    expression = variant ? op('-', n(total), op('*', n(a), n(b))) : op('/', op('-', n((a + 2) * b), n(2 * b)), n(b));
    prompt = variant ? `Er liggen ${total} eikels in de boomholte. De eekhoorn vult ${a} zakjes met elk ${b} eikels. Hoeveel eikels blijven in de boomholte?` : `Er zijn ${(a + 2) * b} bessen. Coco bewaart ${2 * b} bessen voor morgen. De rest verdeelt ze eerlijk over ${b} mandjes. Hoeveel bessen krijgt elk mandje?`;
    hint = variant ? 'Bereken eerst hoeveel eikels in de zakjes gaan. Trek dat af van de voorraad.' : 'Haal eerst de voorraad voor morgen eraf. Verdeel daarna wat overblijft.';
  } else if (level === 3) {
    const denominator = variant ? 4 : 3, total = a * denominator * 3;
    expression = op('-', n(total), op('*', op('/', n(total), n(denominator)), n(variant ? 3 : 2)));
    prompt = variant ? `De eekhoorn heeft ${total} eikels. Hij verstopt drie kwart van zijn voorraad voor de winter. Hoeveel eikels houdt hij over?` : `Van ${total} bessen gebruikt Coco twee derde voor jam. Hoeveel bessen blijven er over?`;
    hint = `Bereken eerst een ${denominator === 4 ? 'kwart' : 'derde'} van de voorraad. Bereken dan hoeveel wordt gebruikt en wat overblijft.`;
  } else if (level === 4) {
    const total = a * 20, percentage = variant ? 25 : 20;
    expression = variant ? op('-', n(total), op('/', op('*', n(total), n(percentage)), n(100))) : op('/', op('/', op('*', n(total), n(percentage)), n(100)), n(4));
    prompt = variant ? `Er liggen ${total} eikels in de boomholte. De eekhoorn deelt ${percentage}% uit aan andere dieren. Hoeveel eikels houdt hij zelf?` : `Van ${total} bessen is ${percentage}% rijp. Coco verdeelt alleen de rijpe bessen over 4 mandjes. Hoeveel rijpe bessen krijgt elk mandje?`;
    hint = variant ? '25% is een kwart. Bereken eerst het uitgedeelde deel.' : '20% is een vijfde. Bereken eerst de rijpe oogst en verdeel die daarna over vier mandjes.';
  } else {
    scene = 'both';
    const total = a * b * 4;
    expression = variant ? op('/', op('-', op('*', n(a), n(b)), n(b)), n(b)) : op('/', op('-', n(total), op('/', n(total), n(4))), n(3));
    prompt = variant ? `De eekhoorn ruilt ${a} zakjes met elk ${b} eikels voor evenveel bessen. Coco gebruikt ${b} bessen voor jam en vult met de rest mandjes van ${b} bessen. Hoeveel volle mandjes maakt ze?` : `Coco en de eekhoorn verzamelen ${total} bessen. Een kwart bewaren ze voor morgen. De rest verdelen ze eerlijk over 3 dieren. Hoeveel bessen krijgt elk dier?`;
    hint = variant ? 'Bereken eerst de voorraad na het ruilen. Trek de bessen voor jam af en bereken het aantal volle mandjes.' : 'Bereken een kwart, trek dat af van de oogst en verdeel de rest over drie dieren.';
    if (variant) unit = 'mandjes';
  }
  if (scene === 'acorns') unit = 'eikels';
  const answer = evaluate(expression);
  return {
    id: `story:${level}:${index}:${expressionText(expression)}`, kind: 'choice', left: expression, right: { blank: true },
    answer, options: answerChoices(answer, [answer + b, answer - b, a * b, extra], random),
    prompt, hint, operation: 'op' in expression ? expression.op : '+', a, b, total: answer,
    scene, unit, explanation: `${expressionText(expression)} = ${answer} ${unit}.`,
  };
}
export function createStoryDeck(level: MathLevel, random = Math.random): StoryQuestion[] {
  const deck: StoryQuestion[] = [];
  const prompts = new Set<string>();
  for (let index = 0; index < 10; index++) {
    let question = createStoryQuestion(level, index, random);
    for (let retry = 1; prompts.has(question.prompt); retry++) question = createStoryQuestion(level, index + retry * 10, random);
    prompts.add(question.prompt); deck.push(question);
  }
  return deck;
}
