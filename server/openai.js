import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

const categoryDescriptions = {
  infidelity: {
    name: 'Betrayal',
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
    name: 'Overall Relationship Management',
    context: 'proactively strengthening an already healthy relationship',
    roleInfo: false,
  },
};

// Call OpenAI
async function callOpenAI(systemPrompt, userPrompt, maxTokens = 2500) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return response.choices[0].message.content;
}

// Call Gemini
async function callGemini(systemPrompt, userPrompt) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}

// Unified AI call
async function callAI(systemPrompt, userPrompt, aiModel = 'openai', maxTokens = 2500) {
  if (aiModel === 'gemini') {
    return callGemini(systemPrompt, userPrompt);
  }
  return callOpenAI(systemPrompt, userPrompt, maxTokens);
}

export async function generateAdvice(partnerAResponses, partnerBResponses, targetPartner, category, unfaithfulPartner = null, partnerAName = 'Partner A', partnerBName = 'Partner B', aiModel = 'openai', intakeType = 'long', coupleMemory = '', previousSessions = []) {
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

  // Build memory context if available
  let memoryContext = '';
  if (coupleMemory && coupleMemory.trim()) {
    memoryContext = `\n\nYOU HAVE HISTORY WITH THIS COUPLE. Here is what you know about them from previous sessions:\n${coupleMemory}\n\nUse this context to provide more personalized, continuous guidance. Reference their progress, patterns, and previous insights where relevant.`;
  }

  // Build previous sessions context
  let sessionsContext = '';
  if (previousSessions && previousSessions.length > 0) {
    const sessionSummaries = previousSessions.slice(0, 5).map((s, i) => {
      const date = new Date(s.created_at).toLocaleDateString();
      return `Session ${i + 1} (${date}): ${s.category || 'General'} - ${s.partner_a_completed && s.partner_b_completed ? 'Completed' : 'In progress'}`;
    }).join('\n');
    sessionsContext = `\n\nThis couple has ${previousSessions.length} previous session(s):\n${sessionSummaries}`;
  }

  const systemPrompt = `You are a direct, insightful relationship coach specializing in helping couples with ${categoryInfo.context}. You provide honest, specific guidance - not generic platitudes. You analyze the actual data provided and give real, actionable insights.${memoryContext}${sessionsContext}

Critical guidelines:
- You are NOT a licensed therapist - recommend professional help
- Be honest and direct, even when the truth is uncomfortable
- Analyze the specific numbers and words provided - don't be generic
- Compare partners' responses to surface real dynamics
- Ground every insight in what they actually wrote
${coupleMemory ? '- Reference their history and progress when relevant - you know this couple!' : ''}

Guardrails for balanced honesty:
- AVOID NEUTRALITY FOR NEUTRALITY'S SAKE: If one partner is putting in more effort, gently acknowledge that. True advice isn't always 50/50.
- THE "WE" VS "I" CHECK: Look at how they use collective vs individual language in their open-ended responses. If one says "we" and the other says "I/me," flag this as a blind spot about shared vs individual framing.`;

  let userPrompt;

  if (intakeType === 'short') {
    // Condensed prompt for short intake (3 questions)
    userPrompt = `Analyze these brief questionnaire responses from a couple focused on: ${categoryInfo.name} (${categoryInfo.context}).

Write a report specifically for ${targetName}. Address them directly by name.${roleContext}

${partnerAFormatted}

${partnerBFormatted}

Write a personalized report. IMPORTANT: Do NOT use any markdown formatting - no asterisks, no hashtags, no bold, no headers. Just plain text with section titles in ALL CAPS on their own line.

Use this exact structure with these exact headers (including emojis):

📍 QUICK ASSESSMENT

Write 3-4 sentences that cut to the core of what's happening. Be punchy, observant, and insightful. What's the real dynamic here based on what they shared? If there's something positive to note, include it.

End with: "Here's one thing that might surprise you about your partner:" followed by a specific insight from their response.

🗺️ THREE STEPS FORWARD

Write 3 numbered action items (1. 2. 3.):
1. Something specific to do THIS WEEK
2. A conversation starter or script to use with your partner
3. A longer-term mindset or habit to develop

💬 CONVERSATION PROMPT

Write one specific question they should ask their partner to deepen understanding, based on what both partners shared.

Be warm but direct. Since this is a quick check-in, keep the total response to approximately 300-400 words.

CRITICAL: Output plain text only. No markdown, no asterisks (*), no hashtags (#), no bold formatting.`;

    return callAI(systemPrompt, userPrompt, aiModel, 1200);
  }

  // Full prompt for long intake (10 questions)
  userPrompt = `Analyze these questionnaire responses from a couple focused on: ${categoryInfo.name} (${categoryInfo.context}).

Write a report specifically for ${targetName}. Address them directly by name.${roleContext}

${partnerAFormatted}

${partnerBFormatted}

Write a personalized report using numbered lists. IMPORTANT: Do NOT use any markdown formatting - no asterisks, no hashtags, no bold, no headers. Just plain text with section titles in ALL CAPS on their own line.

Use this exact structure with these exact headers (including emojis):

📍 TLDR

Write 4-5 sentences that cut to the core of what's happening in this relationship. Be punchy, observant, and insightful. No sugarcoating, no harshness—just an honest diagnosis. What's the real issue here? What pattern are they stuck in? Name it directly. Highlight the intersections between both partners—where they want the same things but are going about it in ways that create conflict. If the data shows something genuinely positive—real effort, shared values, or a foundation worth building on—name that too. This should feel like a friend who sees them clearly saying "Here's what I'm noticing..."

Then end with: "Here's one thing that might surprise you about your partner:" followed by a specific insight from their responses that the reader likely doesn't fully realize, and one concrete thing they could do about it.

🌊 WHAT'S HAPPENING UNDER THE SURFACE

Write 3 numbered insights (1. 2. 3.) that read between the lines. Use the open-ended questions to identify the internal narratives each person is carrying. Surface the deeper emotional currents. Be insightful and specific to what they wrote.

🔦 POSSIBLE BLIND SPOTS

Write 3 numbered possible blind spots (1. 2. 3.) drawing from your expertise on relationships, the open-ended responses, and the numeric scale responses. Look for:
- Perception gaps (where their view differs from their partner's)
- The "we" vs "I" language patterns
- Common relationship patterns they may not recognize in themselves
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

  return callAI(systemPrompt, userPrompt, aiModel, 2500);
}

export async function chatFollowUp(initialAdvice, conversationHistory, userMessage, category, targetRole = null, aiModel = 'openai') {
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

  const userPrompt = conversationHistory.length > 0
    ? `Previous conversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}`
    : userMessage;

  return callAI(systemPrompt, userPrompt, aiModel, 800);
}

// Generate a followup question for both partners
export async function generateFollowupQuestion(partnerAResponses, partnerBResponses, initialAdvice, category, partnerAName, partnerBName, previousFollowups = [], aiModel = 'openai') {
  const categoryInfo = categoryDescriptions[category] || categoryDescriptions.communication;

  // Build full context of previous followups including answers
  let previousContext = '';
  if (previousFollowups.length > 0) {
    const followupSummaries = previousFollowups.map((f, i) => {
      let summary = `Q${i + 1}: "${f.question_text}"`;
      if (f.partner_a_answer && f.partner_b_answer) {
        summary += `\n   ${partnerAName}: "${f.partner_a_answer}"`;
        summary += `\n   ${partnerBName}: "${f.partner_b_answer}"`;
        if (f.ai_response) {
          summary += `\n   Your insight: "${f.ai_response.substring(0, 200)}..."`;
        }
      }
      return summary;
    }).join('\n\n');
    previousContext = `\n\nPREVIOUS FOLLOWUP CONVERSATIONS (build on these, do NOT repeat similar questions):\n${followupSummaries}`;
  }

  const systemPrompt = `You are a relationship coach who has been working with a couple on ${categoryInfo.context}. Based on their questionnaire responses, the advice you provided, and any previous followup conversations, you want to ask ONE followup question that both partners will answer separately.

The question should:
- Dig deeper into a specific dynamic you noticed
- Build on insights from previous conversations if any
- Help surface something that wasn't fully explored
- Be open-ended and thought-provoking
- Be answerable by both partners from their own perspective
- Not be repetitive of previous questions

Return ONLY the question text, nothing else. No quotes, no preamble, just the question.`;

  const formatResponses = (responses, name) => {
    return responses.map(r => `${r.question_id}: "${r.answer}"`).join('\n');
  };

  const userPrompt = `${partnerAName}'s original responses:\n${formatResponses(partnerAResponses, partnerAName)}\n\n${partnerBName}'s original responses:\n${formatResponses(partnerBResponses, partnerBName)}\n\nInitial advice excerpt:\n${initialAdvice?.substring(0, 1000) || 'Not available'}${previousContext}\n\nGenerate ONE followup question for both partners to answer:`;

  return callAI(systemPrompt, userPrompt, aiModel, 200);
}

// Generate AI response after both partners answer a followup question
export async function generateFollowupResponse(question, partnerAAnswer, partnerBAnswer, category, partnerAName, partnerBName, aiModel = 'openai', previousFollowups = []) {
  const categoryInfo = categoryDescriptions[category] || categoryDescriptions.communication;

  // Build context from previous followups
  let previousContext = '';
  if (previousFollowups.length > 0) {
    const summaries = previousFollowups.map((f, i) => {
      return `Q${i + 1}: "${f.question_text}"\n${partnerAName}: "${f.partner_a_answer}"\n${partnerBName}: "${f.partner_b_answer}"`;
    }).join('\n\n');
    previousContext = `\n\nPrevious followup conversations for context:\n${summaries}\n\n`;
  }

  const systemPrompt = `You are a relationship coach working with a couple on ${categoryInfo.context}. You asked them both a followup question, and now you're providing insights based on their answers.

Guidelines:
- Compare and contrast their responses
- Highlight areas of alignment and divergence
- Reference patterns from previous conversations if relevant
- Provide specific, actionable observations
- Be warm but honest
- Keep response concise (150-250 words)
- Do NOT use markdown formatting - plain text only`;

  const userPrompt = `${previousContext}Current question: "${question}"

${partnerAName}'s answer:
"${partnerAAnswer}"

${partnerBName}'s answer:
"${partnerBAnswer}"

Provide your insights based on both responses:`;

  return callAI(systemPrompt, userPrompt, aiModel, 500);
}

// Extract insights from a session to add to couple's memory
export async function extractMemoryInsights(partnerAResponses, partnerBResponses, generatedAdvice, category, partnerAName, partnerBName, existingMemory = '', sessionDate = new Date()) {
  const dateStr = sessionDate.toLocaleDateString();

  const formatResponses = (responses, name) => {
    return responses
      .filter(r => r.question_type === 'text')
      .map(r => `- ${r.question_id}: "${r.answer}"`)
      .join('\n');
  };

  const systemPrompt = `You are a relationship coach assistant helping to maintain a "memory" about a couple across multiple sessions. Your job is to extract key insights that should be remembered for future sessions.

The memory should capture:
- Key patterns or dynamics you've observed
- Important concerns or fears each partner has expressed
- Progress made or areas of growth
- Recurring themes or issues
- Specific details that would help personalize future advice (e.g., "Sarah mentioned her mother's critical voice affects how she receives feedback")
- Any breakthroughs or important realizations

Keep the memory concise but insightful. Use bullet points. Focus on information that would be valuable to reference in future sessions.`;

  const userPrompt = `Session Date: ${dateStr}
Category: ${category}

${partnerAName}'s open-ended responses:
${formatResponses(partnerAResponses, partnerAName)}

${partnerBName}'s open-ended responses:
${formatResponses(partnerBResponses, partnerBName)}

Advice that was generated:
${generatedAdvice.substring(0, 1500)}...

${existingMemory ? `\nExisting memory about this couple:\n${existingMemory}\n` : ''}

Based on this session, write 3-5 bullet points of KEY INSIGHTS to remember about this couple. These should be specific, actionable insights that would help provide better advice in future sessions.

${existingMemory ? 'Add to and refine the existing memory - note any changes, progress, or new information. Remove outdated information if things have clearly changed.' : 'This is their first session, so capture the foundational dynamics and concerns.'}

Format: Just bullet points, no headers. Keep total under 500 words.`;

  try {
    const insights = await callOpenAI(systemPrompt, userPrompt, 600);

    // Combine with existing memory, keeping most recent insights first
    if (existingMemory) {
      return `--- Updated ${dateStr} ---\n${insights}\n\n--- Previous Insights ---\n${existingMemory}`;
    }
    return `--- Session ${dateStr} ---\n${insights}`;
  } catch (error) {
    console.error('Error extracting memory insights:', error);
    return existingMemory; // Return existing memory if extraction fails
  }
}
