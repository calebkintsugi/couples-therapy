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

Critical guidelines:
- You are NOT a licensed therapist - recommend professional help
- Be honest and direct, even when the truth is uncomfortable
- Analyze the specific numbers and words provided - don't be generic
- Compare partners' responses to surface real dynamics
- Ground every insight in what they actually wrote

Guardrails for balanced honesty:
- AVOID NEUTRALITY FOR NEUTRALITY'S SAKE: If one partner is being transparent and the other is being defensive, gently call out the defensiveness. True advice isn't always 50/50.
- PRIORITIZE SAFETY: If the emotional_safety scores are very low (1-2), prioritize "Establishing Boundaries" over "Rebuilding Intimacy."
- THE "WE" VS "I" CHECK: Look at how they use collective vs individual language in their open-ended responses. If one says "we" and the other says "I/me," flag this as a blind spot about shared vs individual framing.`;

  const otherPartner = targetPartner === 'A' ? 'B' : 'A';

  const userPrompt = `Analyze these questionnaire responses from a couple dealing with infidelity.

Partner A is the ${partnerARole} partner. Partner B is the ${partnerBRole} partner.

Write a report specifically for Partner ${targetPartner} (the ${targetRole} partner).

${partnerAFormatted}

${partnerBFormatted}

The scale questions measure (1=low, 5=high): trust (current trust level), commitment (commitment to doing the difficult emotional work to stay together), transparency (satisfaction with honesty and open-book communication), emotional_safety (feeling safe sharing triggers or difficult thoughts without it becoming a fight), empathy_gap (how much they feel their partner understands their pain/stress), hope (belief that a "Version 2.0" of the relationship is possible).

The open-ended questions ask: tangible_action (one specific action their partner could take this week to help them feel secure), biggest_wall (the single biggest obstacle preventing them from moving forward), hesitant_thought (a thought/fear/realization they've been hesitant to share), own_struggle (an area where they've struggled to show up as the partner they want to be), do_differently (what they wish they could do differently to help healing).

Write a personalized report using numbered lists. Use this exact structure:

WHAT I'M SEEING

Write 3 numbered observations (1. 2. 3.) that highlight the INTERSECTIONS between both partners' responses. Don't just list facts—show how both partners may be prioritizing the same things but going about them in ways that create conflict. Use framing like: "I see that both of you are currently prioritizing X, but you are going about it in ways that are causing Y." Focus on shared goals vs. divergent methods.

WHAT'S HAPPENING UNDER-THE-SURFACE

Write 3 numbered insights (1. 2. 3.) that read between the lines. Use the open-ended questions (especially "hesitant_thought" and "own_struggle") to identify the internal narratives each person is carrying. Surface the deeper emotional currents. Example framing: "While you are asking for more space, under the surface, it appears you are actually grieving the loss of the version of yourself you were before this happened." Be insightful and specific to what they wrote.

A ROADMAP FORWARD

Write 3 numbered pieces of advice structured as:
1. IMMEDIATE TRIAGE (to stop the bleeding—what they should do TODAY)
2. COMMUNICATION SCRIPT (an exact phrase or approach they can use with their partner)
3. MINDSET SHIFT (a bigger picture change in how they think about the situation)

BLIND SPOTS

Write 3 numbered blind spots (1. 2. 3.) using the SCALE QUESTIONS to find DATA MISMATCHES between partners. If Partner A thinks trust is 3/5 but Partner B thinks it's 1/5, the blind spot is "The Perceived Progress Gap." Look for:
- Perception gaps (where their view differs from their partner's)
- The "we" vs "I" language patterns (if one uses collective language and the other doesn't)
- Areas where they may be overestimating their own progress or underestimating their partner's pain

FOCUS AREAS

Write 3 numbered focus areas (1. 2. 3.) - the "if you do nothing else, do these" items:
1. One for TRUST (rebuilding or establishing it)
2. One for INTIMACY/CONNECTION (emotional or physical closeness)
3. One for INDIVIDUAL HEALING (their own personal work, regardless of the relationship outcome)

Be warm but direct throughout. Write in a conversational, empathetic tone while being honest. Don't be neutral for neutrality's sake—if the data shows one partner is doing more work than the other, say so gently. Approximately 600-800 words total.`;

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
