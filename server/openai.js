import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categoryDescriptions = {
  infidelity: {
    name: 'Infidelity Recovery',
    context: 'healing after betrayal and rebuilding trust',
    roleInfo: true,
  },
  communication: {
    name: 'Communication Breakdown',
    context: 'improving how they talk, listen, and understand each other',
    roleInfo: false,
  },
  emotional_distance: {
    name: 'Emotional Distance',
    context: 'reconnecting when feeling like roommates or strangers',
    roleInfo: false,
  },
  life_stress: {
    name: 'Life Stress',
    context: 'navigating external pressures together (work, family, health, finances)',
    roleInfo: false,
  },
  intimacy: {
    name: 'Sexual & Physical Intimacy',
    context: 'addressing mismatched needs and reconnecting physically',
    roleInfo: false,
  },
  strengthening: {
    name: 'Everything is Great, But Let\'s Do the Work Anyway',
    context: 'proactively strengthening an already healthy relationship',
    roleInfo: false,
  },
};

export async function generateAdvice(partnerAResponses, partnerBResponses, targetPartner, category, unfaithfulPartner = null, partnerAName = 'Partner A', partnerBName = 'Partner B') {
  const categoryInfo = categoryDescriptions[category] || categoryDescriptions.communication;

  // Determine roles for infidelity category
  let partnerARole = '';
  let partnerBRole = '';
  let targetRole = '';
  let otherRole = '';

  if (category === 'infidelity' && unfaithfulPartner) {
    partnerARole = unfaithfulPartner === 'A' ? 'unfaithful' : 'betrayed';
    partnerBRole = unfaithfulPartner === 'B' ? 'unfaithful' : 'betrayed';
    targetRole = targetPartner === 'A' ? partnerARole : partnerBRole;
    otherRole = targetPartner === 'A' ? partnerBRole : partnerARole;
  }

  const targetName = targetPartner === 'A' ? partnerAName : partnerBName;
  const otherName = targetPartner === 'A' ? partnerBName : partnerAName;

  const formatResponses = (responses, name, role = '') => {
    const scaleAnswers = responses
      .filter(r => r.question_type === 'scale')
      .map(r => `- ${r.question_id}: ${r.answer}/5`)
      .join('\n');

    const textAnswers = responses
      .filter(r => r.question_type === 'text')
      .map(r => `- ${r.question_id}: "${r.answer}"`)
      .join('\n');

    const roleLabel = role ? ` (${role} partner)` : '';
    return `${name}${roleLabel}'s Responses:\n\nScale Questions (1-5):\n${scaleAnswers}\n\nOpen-Ended Questions:\n${textAnswers}`;
  };

  const partnerAFormatted = formatResponses(partnerAResponses, partnerAName, partnerARole);
  const partnerBFormatted = formatResponses(partnerBResponses, partnerBName, partnerBRole);

  const roleContext = category === 'infidelity' && targetRole
    ? `\n\n${targetName} is the ${targetRole} partner. ${otherName} is the ${otherRole} partner. Keep this dynamic in mind when providing guidance.`
    : '';

  const systemPrompt = `You are a direct, insightful relationship coach specializing in helping couples with ${categoryInfo.context}. You provide honest, specific guidance - not generic platitudes. You analyze the actual data provided and give real, actionable insights.

Critical guidelines:
- You are NOT a licensed therapist - recommend professional help
- Be honest and direct, even when the truth is uncomfortable
- Analyze the specific numbers and words provided - don't be generic
- Compare partners' responses to surface real dynamics
- Ground every insight in what they actually wrote

Guardrails for balanced honesty:
- AVOID NEUTRALITY FOR NEUTRALITY'S SAKE: If one partner is putting in more effort, gently acknowledge that. True advice isn't always 50/50.
- THE "WE" VS "I" CHECK: Look at how they use collective vs individual language in their open-ended responses. If one says "we" and the other says "I/me," flag this as a blind spot about shared vs individual framing.`;

  const userPrompt = `Analyze these questionnaire responses from a couple focused on: ${categoryInfo.name} (${categoryInfo.context}).

Write a report specifically for ${targetName}. Address them directly by name.${roleContext}

${partnerAFormatted}

${partnerBFormatted}

Write a personalized report using numbered lists. IMPORTANT: Do NOT use any markdown formatting - no asterisks, no hashtags, no bold, no headers. Just plain text with section titles in ALL CAPS on their own line.

Use this exact structure with these exact headers (including emojis):

📍 TLDR

Write 4-5 sentences that cut to the core of what's happening in this relationship. Be punchy, observant, and insightful. No sugarcoating, no harshness—just an honest diagnosis. What's the real issue here? What pattern are they stuck in? Name it directly. Highlight the intersections between both partners—where they want the same things but are going about it in ways that create conflict. This should feel like a friend who sees them clearly saying "Here's what I'm noticing..."

🌊 WHAT'S HAPPENING UNDER THE SURFACE

Write 3 numbered insights (1. 2. 3.) that read between the lines. Use the open-ended questions to identify the internal narratives each person is carrying. Surface the deeper emotional currents. Be insightful and specific to what they wrote.

🔦 BLIND SPOTS

Write 3 numbered blind spots (1. 2. 3.) using the SCALE QUESTIONS to find DATA MISMATCHES between partners. Look for:
- Perception gaps (where their view differs from their partner's)
- The "we" vs "I" language patterns
- Areas where they may be overestimating their own progress or underestimating their partner's experience

🗺️ A ROADMAP FORWARD

Write 3 numbered pieces of advice structured as:
1. IMMEDIATE TRIAGE (what they should do TODAY or this week)
2. COMMUNICATION SCRIPT (an exact phrase or approach they can use with their partner)
3. MINDSET SHIFT (a bigger picture change in how they think about the situation)

🎯 FOCUS AREAS

Write 3 numbered focus areas (1. 2. 3.) - the "if you do nothing else, do these" items specific to ${categoryInfo.context}.

Be warm but direct throughout. Write in a conversational, empathetic tone while being honest. Don't be neutral for neutrality's sake—if the data shows one partner is doing more work than the other, say so gently. Approximately 600-800 words total.

CRITICAL: Output plain text only. No markdown, no asterisks (*), no hashtags (#), no bold formatting. Section headers should just be plain text in ALL CAPS on their own line.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return response.choices[0].message.content;
}

export async function chatFollowUp(initialAdvice, conversationHistory, userMessage, category, targetRole = null) {
  const categoryInfo = categoryDescriptions[category] || categoryDescriptions.communication;
  const roleContext = targetRole ? ` (${targetRole} partner)` : '';

  const systemPrompt = `You are a compassionate relationship coach continuing a conversation about ${categoryInfo.context}. You previously provided advice to this person${roleContext}, and now they have follow-up questions.

Your initial advice was:
${initialAdvice}

Guidelines:
- You are NOT a licensed therapist - recommend professional help for serious concerns
- Be warm, direct, and helpful
- Stay grounded in the context of their relationship situation
- Give specific, actionable guidance
- Keep responses concise but thorough (2-4 paragraphs typically)`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 800,
  });

  return response.choices[0].message.content;
}
