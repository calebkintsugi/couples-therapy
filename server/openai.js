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

The scale questions measure: trust (current trust level), commitment (how important it is to stay married and rebuild to a place of love, health, and trust), personal_change (how much they've changed their approach to the marriage since the crisis), safety (feeling safe to express feelings), partner_safety (how safe they believe their partner feels expressing feelings to them), hope (hopefulness about the future).

The open-ended questions ask: my_needs (what they need from their partner), partner_needs (what they believe their partner needs from them), understood (what they wish their partner better understood about them), fears (their fears about recovery).

Write a detailed, personalized report with these exact sections:

## 1. Where Things Stand: An Honest Assessment
Give your honest assessment of this relationship based on all the responses. How hopeful are you as a coach looking at this data? What is the overall health of this relationship right now? What do you see as the most critical thing needed for this relationship to heal? Don't just recite scores back - synthesize everything into a clear-eyed view of where they are.

## 2. What Your Partner Needs From You
Based specifically on what the ${otherRole} partner (Partner ${otherPartner}) wrote in their open-ended responses, what are they asking for? Quote their actual words. What concrete actions would address their stated needs? Be specific to what they wrote, not generic advice. Consider how their needs relate to their role as the ${otherRole} partner.

## 3. What You Both Need to Do
Based on both partners' responses, what shared work is needed? Where do your answers align or conflict? What would a path forward look like that honors both people's stated needs?

## 4. Difficult Truths
What hard realities do the responses reveal that you, as the ${targetRole} partner, need to hear? Don't shy away from uncomfortable observations. If there are concerning patterns or gaps, name them directly. Address what you specifically need to confront given your role in this situation.

## 5. Reasons for Hope — And Should You Keep Going?
What genuine positive signs exist in the responses? Where is there alignment? What strengths can be built upon? Only cite real evidence from their answers - no false optimism. Finally, give your honest opinion: based on what you see in these responses, should this couple keep working on the marriage, or is divorce worth considering? Be direct.

Be direct and specific throughout. Reference actual scores and quotes. Avoid generic relationship advice - everything should be grounded in what these two people actually wrote. Approximately 600-800 words.`;

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
