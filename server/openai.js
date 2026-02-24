import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAdvice(partnerAResponses, partnerBResponses, targetPartner, unfaithfulPartner) {
  // Determine roles
  const partnerARole = unfaithfulPartner === 'A' ? 'unfaithful' : 'betrayed';
  const partnerBRole = unfaithfulPartner === 'B' ? 'unfaithful' : 'betrayed';
  const targetRole = targetPartner === 'A' ? partnerARole : partnerBRole;
  const otherRole = targetPartner === 'A' ? partnerBRole : partnerARole;

  const formatResponses = (responses, label, role) => {
    const scaleAnswers = responses
      .filter(r => r.question_type === 'scale')
      .map(r => `- ${r.question_id}: ${r.answer}/5`)
      .join('\n');

    const textAnswers = responses
      .filter(r => r.question_type === 'text')
      .map(r => `- ${r.question_id}: "${r.answer}"`)
      .join('\n');

    return `${label} (${role} partner)'s Responses:\n\nScale Questions (1-5):\n${scaleAnswers}\n\nOpen-Ended Questions:\n${textAnswers}`;
  };

  const partnerAFormatted = formatResponses(partnerAResponses, 'Partner A', partnerARole);
  const partnerBFormatted = formatResponses(partnerBResponses, 'Partner B', partnerBRole);

  const systemPrompt = `You are a direct, insightful relationship coach specializing in helping couples navigate healing after infidelity. You provide honest, specific guidance - not generic platitudes. You analyze the actual data provided and give real, actionable insights.

Important guidelines:
- You are NOT a licensed therapist - recommend professional help
- Be honest and direct, even when the truth is uncomfortable
- Analyze the specific numbers and words provided - don't be generic
- Compare partners' responses to surface real dynamics
- Ground every insight in what they actually wrote`;

  const otherPartner = targetPartner === 'A' ? 'B' : 'A';

  const userPrompt = `Analyze these questionnaire responses from a couple dealing with infidelity.

Partner A is the ${partnerARole} partner. Partner B is the ${partnerBRole} partner.

Write a report specifically for Partner ${targetPartner} (the ${targetRole} partner).

${partnerAFormatted}

${partnerBFormatted}

The scale questions measure (1=low, 5=high): trust (current trust level), commitment (commitment to doing the difficult emotional work to stay together), transparency (satisfaction with honesty and open-book communication), emotional_safety (feeling safe sharing triggers or difficult thoughts without it becoming a fight), empathy_gap (how much they feel their partner understands their pain/stress), hope (belief that a "Version 2.0" of the relationship is possible).

The open-ended questions ask: tangible_action (one specific action their partner could take this week to help them feel secure), biggest_wall (the single biggest obstacle preventing them from moving forward), hesitant_thought (a thought/fear/realization they've been hesitant to share), own_struggle (an area where they've struggled to show up as the partner they want to be), do_differently (what they wish they could do differently to help healing).

Write a personalized report in paragraph form (not bullet points or numbered lists within sections). Use this exact structure:

**This is what I'm seeing in your relationship:**

Write a flowing paragraph that weaves together 5 key observations about the current state of the relationship. Ground each observation in specific scores or quotes from the responses. Address the dynamics between the ${targetRole} and ${otherRole} partner directly.

**Here are 5 things happening under the surface that you might not be naming:**

Write a paragraph that surfaces 5 deeper dynamics, unspoken tensions, or patterns that the responses reveal but the couple may not be consciously aware of. Be insightful and direct. These should be things that require reading between the lines.

**Here are 5 pieces of advice:**

Write a paragraph containing 5 specific, actionable pieces of advice tailored to this person as the ${targetRole} partner. Each piece of advice should connect to something specific from the questionnaire responses.

**If you want to improve this relationship, here are the 3 main things I would focus on:**

Write a concluding paragraph with the 3 most important priorities. Be direct about what matters most and why. If appropriate, include an honest assessment of whether continuing to work on this relationship makes sense based on what you see.

Be warm but direct throughout. Write in a conversational, empathetic tone while still being honest. Reference specific answers and scores naturally within your paragraphs. Approximately 700-900 words total.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content;
}

export async function chatFollowUp(initialAdvice, conversationHistory, userMessage, targetRole) {
  const systemPrompt = `You are a compassionate relationship coach continuing a conversation about healing after infidelity. You previously provided advice to the ${targetRole} partner, and now they have follow-up questions.

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
