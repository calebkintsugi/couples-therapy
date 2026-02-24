import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAdvice(partnerAResponses, partnerBResponses, targetPartner) {
  const formatResponses = (responses, label) => {
    const scaleAnswers = responses
      .filter(r => r.question_type === 'scale')
      .map(r => `- ${r.question_id}: ${r.answer}/5`)
      .join('\n');

    const textAnswers = responses
      .filter(r => r.question_type === 'text')
      .map(r => `- ${r.question_id}: "${r.answer}"`)
      .join('\n');

    return `${label}'s Responses:\n\nScale Questions (1-5):\n${scaleAnswers}\n\nOpen-Ended Questions:\n${textAnswers}`;
  };

  const partnerAFormatted = formatResponses(partnerAResponses, 'Partner A');
  const partnerBFormatted = formatResponses(partnerBResponses, 'Partner B');

  const systemPrompt = `You are a direct, insightful relationship coach specializing in helping couples navigate healing after infidelity. You provide honest, specific guidance - not generic platitudes. You analyze the actual data provided and give real, actionable insights.

Important guidelines:
- You are NOT a licensed therapist - recommend professional help
- Be honest and direct, even when the truth is uncomfortable
- Analyze the specific numbers and words provided - don't be generic
- Compare partners' responses to surface real dynamics
- Ground every insight in what they actually wrote`;

  const otherPartner = targetPartner === 'A' ? 'B' : 'A';

  const userPrompt = `Analyze these questionnaire responses from a couple dealing with infidelity. Write a report specifically for ${targetPartner === 'A' ? 'Partner A' : 'Partner B'}.

${partnerAFormatted}

${partnerBFormatted}

The scale questions measure: trust (current trust level), commitment (willingness to work through this), understanding (how well partner understands the impact), safety (feeling safe to express feelings), hope (hopefulness about the future).

Write a detailed, personalized report with these exact sections:

## 1. Where Things Stand: An Honest Assessment
Analyze the numerical scores. Who scored higher/lower on what? What do the gaps reveal? Be specific: "You rated trust at 2 while your partner rated it 4 - this gap suggests..." Don't soften the reality. If scores are low, say so directly.

## 2. What Your Partner Needs From You
Based specifically on what Partner ${otherPartner} wrote in their open-ended responses, what are they asking for? Quote their actual words. What concrete actions would address their stated needs? Be specific to what they wrote, not generic advice.

## 3. What You Both Need to Do
Based on both partners' responses, what shared work is needed? Where do your answers align or conflict? What would a path forward look like that honors both people's stated needs?

## 4. Difficult Truths
What hard realities do the responses reveal that ${targetPartner === 'A' ? 'Partner A' : 'Partner B'} needs to hear? Don't shy away from uncomfortable observations. If there are concerning patterns or gaps, name them directly.

## 5. Reasons for Hope
What genuine positive signs exist in the responses? Where is there alignment? What strengths can be built upon? Only cite real evidence from their answers - no false optimism.

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
