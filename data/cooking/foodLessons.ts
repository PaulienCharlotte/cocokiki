/** Eén bron voor de ontdekkingen en de verwijzingen naar recepten. */
export const FOOD_LESSONS = [
  {
    id: 'wholegrain', title: 'Volkoren en je buik', image: '/assets/library/cooking/healthy/wholewheat-pasta.webp', recipeId: 'wholewheat-vegetable-pasta',
    introduction: 'Coco maakt pasta. Ontdek waarom hij voor volkoren kiest.',
    questions: [
      { question: 'Bij volkoren blijft de hele graankorrel behouden. Wat krijg je daardoor meestal meer binnen?', choices: ['Vezels', 'Water', 'Zout'], answer: 0, explanation: 'De buitenste delen van de graankorrel bevatten veel vezels. Die blijven bij volkoren behouden.' },
      { question: 'Wat doen vezels onder andere voor je lichaam?', choices: ['Ze vervangen drinken', 'Ze helpen je darmen werken', 'Ze maken je botten langer'], answer: 1, explanation: 'Vezels helpen je ontlasting soepel te houden. Genoeg drinken helpt daarbij.' },
      { question: 'Je maakt een maaltijd met volkoren pasta. Wat kun je erbij doen voor afwisseling?', choices: ['Alleen extra pasta', 'Niets anders meer', 'Groenten en kikkererwten'], answer: 2, explanation: 'Groenten en kikkererwten brengen weer andere voedingsstoffen mee. Afwisseling helpt je lichaam.' },
    ],
    source: 'https://www.voedingscentrum.nl/encyclopedie/vezels.aspx',
  },
  {
    id: 'sugar', title: 'Suiker en drinken', image: '/games/shop/products/orange.webp', recipeId: 'apple-oat-bake',
    introduction: 'Na het spelen heeft Coco dorst. Wat ontdek jij over drinken en fruit?',
    questions: [
      { question: 'Wat doet je lichaam met suiker uit eten?', choices: ['Het kan suiker als brandstof gebruiken', 'Het kan niets met suiker', 'Je wordt er altijd druk van'], answer: 0, explanation: 'Suiker levert energie, bijvoorbeeld om te bewegen en te ademen. Je krijgt ook energie uit andere voedingsstoffen.' },
      { question: 'Je hebt dorst na het spelen. Welk drankje is een fijne keuze voor elke dag?', choices: ['Water', 'Limonade', 'Vruchtensap'], answer: 0, explanation: 'Water helpt tegen de dorst zonder suiker. Je lichaam heeft elke dag vocht nodig.' },
      { question: 'Een sinaasappel bevat suiker. Wat krijg je ook binnen als je de vrucht eet?', choices: ['Alleen water', 'Vezels en vitaminen', 'Geen andere voedingsstoffen'], answer: 1, explanation: 'Fruit bevat meer dan suiker. Een hele vrucht levert ook vezels; sap bevat daar veel minder van.' },
      { question: 'Waarom kiezen we niet de hele dag voor zoete drankjes en snoep?', choices: ['Alle suiker is giftig', 'Je krijgt daarmee weinig vezels en andere voedingsstoffen binnen', 'Fruit mag dan ook niet meer'], answer: 1, explanation: 'Zoete drankjes en snoep leveren vaak wel suiker, maar weinig vezels, vitaminen en mineralen. Kies ze niet te veel en niet te vaak.' },
      { question: 'Coco viert een verjaardag met taart. Hoe past dat bij gevarieerd eten?', choices: ['Eén stukje maakt al je eten ongezond', 'Je mag alleen taart eten', 'Feestelijk eten kan er af en toe bij horen'], answer: 2, explanation: 'Je hoeft eten niet goed of fout te noemen. Het gaat om wat je over langere tijd eet en drinkt.' },
    ],
    source: 'https://www.voedingscentrum.nl/encyclopedie/suiker',
  },
  {
    id: 'variety', title: 'Een bord vol afwisseling', image: '/assets/library/cooking/healthy/brown-rice-chickpeas.webp', recipeId: 'brown-rice-chickpeas',
    introduction: 'Coco zoekt verschillende ingrediënten voor een maaltijd. Help je mee?',
    questions: [
      { question: 'Welk ingrediënt levert onder andere eiwitten en vezels?', choices: ['Olijfolie', 'Water', 'Kikkererwten'], answer: 2, explanation: 'Kikkererwten zijn peulvruchten. Ze leveren eiwitten én vezels.' },
      { question: 'Waarom wisselen we verschillende groenten af?', choices: ['Elke groente bevat precies hetzelfde', 'Verschillende groenten leveren verschillende voedingsstoffen', 'Dan hoef je nooit meer te drinken'], answer: 1, explanation: 'Geen enkel voedingsmiddel levert alles wat je nodig hebt. Daarom helpt afwisseling.' },
      { question: 'Welke combinatie geeft Coco verschillende soorten ingrediënten?', choices: ['Zilvervliesrijst met groenten en kikkererwten', 'Drie keer alleen rijst', 'Alleen saus'], answer: 0, explanation: 'Granen, groenten en peulvruchten vullen elkaar aan. Je kunt met veel combinaties variëren.' },
    ],
    source: 'https://www.voedingscentrum.nl/nl/gezond-eten-met-de-schijf-van-vijf.aspx',
  },
] as const;
