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

  const systemPrompt = `You are a compassionate relationship coach specializing in helping couples navigate the difficult process of healing after infidelity. Your role is to provide supportive, non-judgmental guidance that acknowledges pain while encouraging hope and healthy communication.

Important guidelines:
- You are NOT a licensed therapist or mental health professional
- Your advice is for educational and coaching purposes only
- Always recommend seeking professional help from a licensed therapist
- Be empathetic and validate feelings without taking sides
- Focus on actionable communication strategies
- Acknowledge the complexity of the situation
- Emphasize that healing is a process that takes time
- Personalize your advice based on the specific answers provided`;

  const userPrompt = `Based on the following questionnaire responses from both partners in a relationship dealing with infidelity, please provide personalized, supportive advice for ${targetPartner === 'A' ? 'Partner A' : 'Partner B'}.

${partnerAFormatted}

${partnerBFormatted}

Please provide advice specifically for ${targetPartner === 'A' ? 'Partner A' : 'Partner B'} that:
1. Acknowledges their specific feelings and concerns
2. Offers 3-4 concrete suggestions for moving forward
3. Highlights areas of alignment with their partner (if any)
4. Addresses their specific fears or concerns mentioned
5. Encourages professional support

Keep the tone warm, supportive, and hopeful while being realistic about the challenges ahead. The advice should be approximately 400-500 words.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}
