import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { nanoid } from 'nanoid';
import db, { initDb } from './db.js';
import sessionsRouter from './routes/sessions.js';
import responsesRouter from './routes/responses.js';
import couplesRouter from './routes/couples.js';
import followupRouter from './routes/followup.js';
import { generateAdvice } from './openai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/sessions', responsesRouter);
app.use('/api/couples', couplesRouter);
app.use('/api/followup', followupRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create test session with sample data
app.post('/api/test/create-sample', async (req, res) => {
  const sessionId = nanoid(10);

  try {
    // Create session
    await db.query(
      `INSERT INTO sessions (id, category, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed)
       VALUES ($1, $2, $3, $4, $5, true, true)`,
      [sessionId, 'infidelity', 'B', 'Sarah', 'Michael']
    );

    // Sample responses for Sarah (betrayed partner)
    const sarahResponses = [
      { questionId: 'trust', type: 'scale', answer: '2' },
      { questionId: 'commitment', type: 'scale', answer: '4' },
      { questionId: 'transparency', type: 'scale', answer: '3' },
      { questionId: 'emotional_safety', type: 'scale', answer: '2' },
      { questionId: 'empathy_gap', type: 'scale', answer: '2' },
      { questionId: 'hope', type: 'scale', answer: '3' },
      { questionId: 'tangible_action', type: 'text', answer: 'I need him to check in with me during the day without me having to ask. Even a simple text saying he\'s thinking of me would help me feel like I matter.' },
      { questionId: 'biggest_wall', type: 'text', answer: 'The lies. It\'s not even the affair itself anymore—it\'s that he looked me in the eyes and lied for months. I don\'t know how to trust anything he says now.' },
      { questionId: 'hesitant_thought', type: 'text', answer: 'Sometimes I wonder if I\'m only staying because I\'m scared of being alone and starting over at 42. I haven\'t told him that.' },
      { questionId: 'own_struggle', type: 'text', answer: 'I know I\'ve been cold and withdrawn. I push him away and then get angry when he gives me space. I can\'t seem to find a middle ground.' },
      { questionId: 'do_differently', type: 'text', answer: 'I wish I could stop bringing up the affair every time we argue about something unrelated. I know it\'s not fair but I can\'t help it.' },
    ];

    // Sample responses for Michael (unfaithful partner)
    const michaelResponses = [
      { questionId: 'trust', type: 'scale', answer: '4' },
      { questionId: 'commitment', type: 'scale', answer: '5' },
      { questionId: 'transparency', type: 'scale', answer: '4' },
      { questionId: 'emotional_safety', type: 'scale', answer: '3' },
      { questionId: 'empathy_gap', type: 'scale', answer: '3' },
      { questionId: 'hope', type: 'scale', answer: '4' },
      { questionId: 'tangible_action', type: 'text', answer: 'I wish she would let me hold her sometimes without pulling away. Physical touch used to be how we connected and I miss that.' },
      { questionId: 'biggest_wall', type: 'text', answer: 'She says she wants to move forward but then won\'t let me forget the past. I feel like I\'m being punished forever and nothing I do will ever be enough.' },
      { questionId: 'hesitant_thought', type: 'text', answer: 'I\'m terrified that I broke something that can\'t be fixed. And I\'m scared that if she knew how much shame I carry, she\'d see me as weak.' },
      { questionId: 'own_struggle', type: 'text', answer: 'I get defensive too quickly when she brings things up. Instead of listening, I start making excuses or trying to "fix" things instead of just being present.' },
      { questionId: 'do_differently', type: 'text', answer: 'I need to stop waiting for her to heal on my timeline. This is going to take as long as it takes and my impatience is making it worse.' },
    ];

    // Insert Sarah's responses
    for (const r of sarahResponses) {
      await db.query(
        `INSERT INTO responses (session_id, partner, question_id, question_type, answer) VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, 'A', r.questionId, r.type, r.answer]
      );
    }

    // Insert Michael's responses
    for (const r of michaelResponses) {
      await db.query(
        `INSERT INTO responses (session_id, partner, question_id, question_type, answer) VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, 'B', r.questionId, r.type, r.answer]
      );
    }

    res.json({
      sessionId,
      sarahResults: `/session/${sessionId}/results?partner=A`,
      michaelResults: `/session/${sessionId}/results?partner=B`,
      message: 'Sample session created. Visit the results links to generate AI advice.'
    });
  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({ error: 'Failed to create test session' });
  }
});

// Create test session with dynamic data from tester
app.post('/api/test/create-session', async (req, res) => {
  const {
    category,
    partnerAName,
    partnerBName,
    partnerARole,
    partnerBRole,
    partnerAResponses,
    partnerBResponses,
  } = req.body;

  const sessionId = nanoid(10);
  const partnerAToken = nanoid(8);
  const partnerBToken = nanoid(8);

  try {
    // Determine unfaithful partner for infidelity category
    let unfaithfulPartner = null;
    if (category === 'infidelity') {
      unfaithfulPartner = partnerARole === 'unfaithful' ? 'A' : 'B';
    }

    // Create session
    await db.query(
      `INSERT INTO sessions (id, category, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed, partner_a_token, partner_b_token)
       VALUES ($1, $2, $3, $4, $5, true, true, $6, $7)`,
      [sessionId, category, unfaithfulPartner, partnerAName, partnerBName, partnerAToken, partnerBToken]
    );

    // Insert Partner A's responses
    for (const r of partnerAResponses) {
      await db.query(
        `INSERT INTO responses (session_id, partner, question_id, question_type, answer) VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, 'A', r.questionId, r.type, String(r.answer)]
      );
    }

    // Insert Partner B's responses
    for (const r of partnerBResponses) {
      await db.query(
        `INSERT INTO responses (session_id, partner, question_id, question_type, answer) VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, 'B', r.questionId, r.type, String(r.answer)]
      );
    }

    res.json({
      sessionId,
      partnerAToken,
      partnerBToken,
      partnerAResults: `/session/${sessionId}/results?p=${partnerAToken}`,
      partnerBResults: `/session/${sessionId}/results?p=${partnerBToken}`,
    });
  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({ error: 'Failed to create test session' });
  }
});

// Generate advice for test couples (no database)
app.post('/api/test/generate-advice', async (req, res) => {
  const {
    category,
    targetPartner,
    partnerAName,
    partnerBName,
    partnerARole,
    partnerBRole,
    partnerAResponses,
    partnerBResponses,
    aiModel = 'openai',
    intakeType = 'long'
  } = req.body;

  try {
    // Format responses for the AI
    const formatForAI = (responses) => {
      return responses.map(r => ({
        question_id: r.questionId,
        question_type: r.type,
        answer: r.answer
      }));
    };

    // Determine unfaithful partner for infidelity category
    let unfaithfulPartner = null;
    if (category === 'infidelity') {
      unfaithfulPartner = partnerARole === 'unfaithful' ? 'A' : 'B';
    }

    const advice = await generateAdvice(
      formatForAI(partnerAResponses),
      formatForAI(partnerBResponses),
      targetPartner,
      category,
      unfaithfulPartner,
      partnerAName,
      partnerBName,
      aiModel,
      intakeType
    );

    res.json({ advice, model: aiModel });
  } catch (error) {
    console.error('Error generating test advice:', error);
    res.status(500).json({ error: 'Failed to generate advice: ' + error.message });
  }
});

// Serve static files in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
