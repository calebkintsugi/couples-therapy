export const categories = [
  {
    id: 'infidelity',
    name: 'Betrayal',
    description: 'Healing after betrayal and rebuilding trust',
    icon: '💔',
  },
  {
    id: 'communication',
    name: 'Communication Breakdown',
    description: 'Improving how you talk, listen, and understand each other',
    icon: '🗣️',
  },
  {
    id: 'emotional_distance',
    name: 'Emotional Distance',
    description: 'Reconnecting when you feel like roommates',
    icon: '🌊',
  },
  {
    id: 'life_stress',
    name: 'Life Stress',
    description: 'Navigating external pressures together (work, family, health, finances)',
    icon: '⚡',
  },
  {
    id: 'intimacy',
    name: 'Sexual & Physical Intimacy',
    description: 'Addressing mismatched needs and reconnecting physically',
    icon: '🔥',
  },
  {
    id: 'strengthening',
    name: 'Overall Relationship Management',
    description: 'Proactively strengthening a healthy relationship',
    icon: '🌱',
  },
];

export const questionsByCategory = {
  infidelity: {
    scale: [
      {
        id: 'trust',
        question: 'How would you rate your current level of trust in the relationship?',
        lowLabel: 'None',
        highLabel: 'Complete',
      },
      {
        id: 'commitment',
        question: 'How committed are you to doing the difficult emotional work required to stay together?',
        lowLabel: 'Checking Out',
        highLabel: 'Fully All-In',
      },
      {
        id: 'transparency',
        question: 'How satisfied are you with the level of honesty and "open-book" communication right now?',
        lowLabel: 'Very Dissatisfied',
        highLabel: 'Very Satisfied',
      },
      {
        id: 'emotional_safety',
        question: 'How safe do you feel sharing a trigger or difficult thought without it becoming a fight?',
        lowLabel: 'Not Safe',
        highLabel: 'Very Safe',
      },
      {
        id: 'empathy',
        question: 'How much do you feel your partner truly understands the depth of your pain or stress?',
        lowLabel: "They Don't Get It",
        highLabel: 'They See Me Completely',
      },
    ],
    text: [
      {
        id: 'tangible_action',
        question: 'What is one specific action your partner could take this week that would help you feel more secure?',
        placeholder: 'Be as specific as possible...',
      },
      {
        id: 'biggest_wall',
        question: 'What is the single biggest obstacle preventing you from moving forward together?',
        placeholder: 'What feels like the main barrier...',
      },
      {
        id: 'unspoken',
        question: 'What thought, fear, or realization have you been hesitant to share with your partner?',
        placeholder: 'This is a safe space to be honest...',
      },
      {
        id: 'vulnerability',
        question: 'What do you need to feel safe being vulnerable with your partner again?',
        placeholder: 'What would help you open up...',
      },
      {
        id: 'understand_me',
        question: 'What is one thing you wish your partner better understood about you?',
        placeholder: 'What do you wish they could see...',
      },
    ],
  },

  communication: {
    scale: [
      {
        id: 'heard',
        question: 'How often do you feel truly heard when you share something important?',
        lowLabel: 'Never',
        highLabel: 'Always',
      },
      {
        id: 'safe_to_speak',
        question: 'How safe do you feel bringing up difficult topics?',
        lowLabel: 'Walk on Eggshells',
        highLabel: 'Completely Safe',
      },
      {
        id: 'resolution',
        question: 'When you disagree, how often do you reach a resolution both feel good about?',
        lowLabel: 'Never',
        highLabel: 'Almost Always',
      },
      {
        id: 'escalation',
        question: 'How often do small disagreements escalate into larger fights?',
        lowLabel: 'Almost Always',
        highLabel: 'Rarely',
      },
      {
        id: 'repair',
        question: 'After an argument, how well do you repair and reconnect?',
        lowLabel: 'We Don\'t',
        highLabel: 'Very Well',
      },
    ],
    text: [
      {
        id: 'avoid_topic',
        question: 'What topic do you avoid bringing up because you fear how your partner will react?',
        placeholder: 'What conversation feels too risky...',
      },
      {
        id: 'wish_understood',
        question: 'What do you wish your partner understood about how you communicate or process emotions?',
        placeholder: 'What would help them understand you better...',
      },
      {
        id: 'own_pattern',
        question: 'What communication pattern of your own do you know isn\'t working but struggle to change?',
        placeholder: 'Be honest about your own habits...',
      },
      {
        id: 'recent_conversation',
        question: 'Describe a recent conversation that went poorly. What do you wish had happened differently?',
        placeholder: 'What would you change about how it went...',
      },
      {
        id: 'understand_me',
        question: 'What is one thing you wish your partner better understood about you?',
        placeholder: 'What do you wish they could see...',
      },
    ],
  },

  emotional_distance: {
    scale: [
      {
        id: 'connection',
        question: 'How emotionally connected do you feel to your partner right now?',
        lowLabel: 'Like Strangers',
        highLabel: 'Deeply Connected',
      },
      {
        id: 'priority',
        question: 'How much of a priority does your partner make you feel in their life?',
        lowLabel: 'Last on the List',
        highLabel: 'Top Priority',
      },
      {
        id: 'quality_time',
        question: 'How satisfied are you with the quality time you spend together?',
        lowLabel: 'Very Dissatisfied',
        highLabel: 'Very Satisfied',
      },
      {
        id: 'loneliness',
        question: 'How often do you feel lonely even when your partner is present?',
        lowLabel: 'Very Often',
        highLabel: 'Never',
      },
      {
        id: 'share_life',
        question: 'How much do you share about your inner life, thoughts, and feelings with each other?',
        lowLabel: 'Nothing',
        highLabel: 'Everything',
      },
    ],
    text: [
      {
        id: 'when_close',
        question: 'Think of a time when you felt closest to your partner. What was different then?',
        placeholder: 'What made that time special...',
      },
      {
        id: 'missing',
        question: 'What do you miss most about how your relationship used to be?',
        placeholder: 'What has been lost over time...',
      },
      {
        id: 'reconnect',
        question: 'What would help you feel more emotionally connected to your partner this week?',
        placeholder: 'Something specific and actionable...',
      },
      {
        id: 'barrier_to_reaching',
        question: 'What keeps you from reaching out to connect with your partner?',
        placeholder: 'What stops you from initiating closeness...',
      },
      {
        id: 'understand_me',
        question: 'What is one thing you wish your partner better understood about you?',
        placeholder: 'What do you wish they could see...',
      },
    ],
  },

  life_stress: {
    scale: [
      {
        id: 'team',
        question: 'How much do you feel like you and your partner are on the same team facing stress together?',
        lowLabel: 'Alone',
        highLabel: 'True Partners',
      },
      {
        id: 'support',
        question: 'How supported do you feel by your partner when you\'re stressed?',
        lowLabel: 'Not At All',
        highLabel: 'Completely',
      },
      {
        id: 'burden',
        question: 'How fairly do you feel responsibilities are shared between you?',
        lowLabel: 'Very Unfairly',
        highLabel: 'Very Fairly',
      },
      {
        id: 'stress_spillover',
        question: 'How often does outside stress negatively affect how you treat each other?',
        lowLabel: 'Constantly',
        highLabel: 'Rarely',
      },
      {
        id: 'coping',
        question: 'How well do your individual coping styles work together?',
        lowLabel: 'They Clash',
        highLabel: 'They Complement',
      },
    ],
    text: [
      {
        id: 'biggest_stressor',
        question: 'What is the biggest external stressor affecting your relationship right now?',
        placeholder: 'Work, family, health, finances, etc...',
      },
      {
        id: 'need_from_partner',
        question: 'What do you most need from your partner when you\'re overwhelmed?',
        placeholder: 'What would actually help you...',
      },
      {
        id: 'own_contribution',
        question: 'How might your own stress reactions be affecting your partner or the relationship?',
        placeholder: 'Reflect honestly on your patterns...',
      },
      {
        id: 'support_wish',
        question: 'When you\'re at your most stressed, what do you wish your partner knew about how to support you?',
        placeholder: 'What would be most helpful...',
      },
      {
        id: 'understand_me',
        question: 'What is one thing you wish your partner better understood about you?',
        placeholder: 'What do you wish they could see...',
      },
    ],
  },

  intimacy: {
    scale: [
      {
        id: 'desire',
        question: 'How satisfied are you with the current level of physical intimacy?',
        lowLabel: 'Very Dissatisfied',
        highLabel: 'Very Satisfied',
      },
      {
        id: 'initiation',
        question: 'How comfortable do you feel initiating physical intimacy?',
        lowLabel: 'Very Uncomfortable',
        highLabel: 'Very Comfortable',
      },
      {
        id: 'rejection',
        question: 'How well do you handle it when one of you isn\'t in the mood?',
        lowLabel: 'Poorly',
        highLabel: 'Very Well',
      },
      {
        id: 'communication',
        question: 'How comfortable are you discussing your physical needs and desires?',
        lowLabel: 'Very Uncomfortable',
        highLabel: 'Very Comfortable',
      },
      {
        id: 'emotional_connection',
        question: 'How connected do you feel emotionally during physical intimacy?',
        lowLabel: 'Disconnected',
        highLabel: 'Deeply Connected',
      },
    ],
    text: [
      {
        id: 'barrier',
        question: 'What feels like the biggest barrier to physical intimacy right now?',
        placeholder: 'What gets in the way...',
      },
      {
        id: 'desire_for',
        question: 'What would make physical intimacy more fulfilling or connecting for you?',
        placeholder: 'What would you like more of...',
      },
      {
        id: 'unsaid',
        question: 'What have you been hesitant to express about your physical needs or desires?',
        placeholder: 'This is a safe space to be honest...',
      },
      {
        id: 'change_over_time',
        question: 'How has your physical connection changed over time, and how do you feel about that?',
        placeholder: 'Reflect on the evolution...',
      },
      {
        id: 'understand_me',
        question: 'What is one thing you wish your partner better understood about you?',
        placeholder: 'What do you wish they could see...',
      },
    ],
  },

  strengthening: {
    scale: [
      {
        id: 'values',
        question: 'How aligned do you feel on core values and life goals?',
        lowLabel: 'Very Misaligned',
        highLabel: 'Perfectly Aligned',
      },
      {
        id: 'conflict',
        question: 'How confident are you in your ability to navigate disagreements together?',
        lowLabel: 'Not Confident',
        highLabel: 'Very Confident',
      },
      {
        id: 'family',
        question: 'How aligned are you on expectations around family (kids, in-laws, etc.)?',
        lowLabel: 'Very Misaligned',
        highLabel: 'Perfectly Aligned',
      },
      {
        id: 'finances',
        question: 'How aligned are you on financial goals and money management?',
        lowLabel: 'Very Misaligned',
        highLabel: 'Perfectly Aligned',
      },
      {
        id: 'growth',
        question: 'How much do you encourage each other\'s individual growth and goals?',
        lowLabel: 'Not At All',
        highLabel: 'Very Much',
      },
    ],
    text: [
      {
        id: 'concern',
        question: 'What is your biggest concern or question about committing to this relationship long-term?',
        placeholder: 'What gives you pause...',
      },
      {
        id: 'conversation_needed',
        question: 'What important conversation do you feel you haven\'t fully had yet?',
        placeholder: 'What needs to be discussed...',
      },
      {
        id: 'strength',
        question: 'What do you see as the greatest strength of your relationship?',
        placeholder: 'What makes you confident in your partnership...',
      },
      {
        id: 'dream_unsupported',
        question: 'What is one dream or goal you have that you\'re not sure your partner fully supports?',
        placeholder: 'Something you want but haven\'t fully shared...',
      },
      {
        id: 'understand_me',
        question: 'What is one thing you wish your partner better understood about you?',
        placeholder: 'What do you wish they could see...',
      },
    ],
  },
};

// Short intake questions (universal for all categories)
export const shortIntakeQuestions = {
  scale: [
    {
      id: 'overall_happiness',
      question: 'Overall, how happy are you in your relationship right now?',
      lowLabel: 'Very Unhappy',
      highLabel: 'Very Happy',
    },
  ],
  text: [
    {
      id: 'main_challenge',
      question: 'What is the main challenge you\'re facing in your relationship right now?',
      placeholder: 'Describe what brings you here today...',
    },
    {
      id: 'ideal_outcome',
      question: 'What would a successful outcome look like for you?',
      placeholder: 'What do you hope to achieve...',
    },
  ],
};

// Helper to get questions for a category
export const getQuestionsForCategory = (categoryId, intakeType = 'long') => {
  if (intakeType === 'short') {
    return shortIntakeQuestions;
  }
  return questionsByCategory[categoryId] || null;
};

// Helper to get category info
export const getCategoryById = (categoryId) => {
  return categories.find(c => c.id === categoryId) || null;
};
