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
import partnerQuestionsRouter from './routes/partnerQuestions.js';
import journalsRouter from './routes/journals.js';
import analyticsRouter from './routes/analytics.js';
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
app.use('/api/partner-questions', partnerQuestionsRouter);
app.use('/api/journals', journalsRouter);
app.use('/api/analytics', analyticsRouter);

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
      { questionId: 'trust', type: 'scale', answer: '1' },
      { questionId: 'commitment', type: 'scale', answer: '3' },
      { questionId: 'transparency', type: 'scale', answer: '2' },
      { questionId: 'emotional_safety', type: 'scale', answer: '2' },
      { questionId: 'empathy_gap', type: 'scale', answer: '3' },
      { questionId: 'hope', type: 'scale', answer: '2' },
      { questionId: 'tangible_action', type: 'text', answer: 'I need complete access to his phone and accounts. Not forever, but for now. And I need him to actually initiate conversations about what happened instead of waiting for me to bring it up.' },
      { questionId: 'biggest_wall', type: 'text', answer: 'I keep imagining them together. The mental images won\'t stop. Every time he touches me, I wonder if he touched her the same way. It\'s making me physically sick.' },
      { questionId: 'hesitant_thought', type: 'text', answer: 'Part of me wants to hurt him back. I\'ve thought about reaching out to an old boyfriend just so he knows what it feels like. I know that\'s destructive but the urge is there.' },
      { questionId: 'own_struggle', type: 'text', answer: 'I\'ve become obsessive. I check his location constantly, I go through his phone when he\'s sleeping, I interrogate him about every detail of his day. I\'m turning into someone I don\'t recognize.' },
      { questionId: 'do_differently', type: 'text', answer: 'I need to stop researching the other woman online. I\'ve memorized her social media. It\'s torture but I can\'t stop. I think I\'m addicted to the pain.' },
    ];

    // Sample responses for Michael (unfaithful partner)
    const michaelResponses = [
      { questionId: 'trust', type: 'scale', answer: '3' },
      { questionId: 'commitment', type: 'scale', answer: '5' },
      { questionId: 'transparency', type: 'scale', answer: '5' },
      { questionId: 'emotional_safety', type: 'scale', answer: '2' },
      { questionId: 'empathy_gap', type: 'scale', answer: '4' },
      { questionId: 'hope', type: 'scale', answer: '3' },
      { questionId: 'tangible_action', type: 'text', answer: 'I need her to eventually see me as more than just "the person who cheated." I\'m trying so hard to be a better husband but sometimes I feel like I\'ll always be defined by my worst mistake.' },
      { questionId: 'biggest_wall', type: 'text', answer: 'The constant surveillance is suffocating. I understand why she needs it, but living under a microscope 24/7 makes me feel like a prisoner. I\'m afraid to even talk to a female coworker about work stuff.' },
      { questionId: 'hesitant_thought', type: 'text', answer: 'There were real problems in our marriage before this happened. I\'m not using that as an excuse, but I wish we could also talk about the loneliness I felt for years. It doesn\'t justify what I did, but it\'s part of the story.' },
      { questionId: 'own_struggle', type: 'text', answer: 'Sometimes I minimize what I did. I catch myself thinking "it was only three months" or "at least I didn\'t leave." That\'s me trying to feel less guilty and it\'s not fair to her.' },
      { questionId: 'do_differently', type: 'text', answer: 'I need to stop getting frustrated when she has a bad day about this. Six months later and I still expect her to be "over it." That\'s unrealistic and selfish of me.' },
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

    // Create session with default test PINs
    const testPin = '123456';
    await db.query(
      `INSERT INTO sessions (id, category, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed, partner_a_token, partner_b_token, partner_a_pin, partner_b_pin)
       VALUES ($1, $2, $3, $4, $5, true, true, $6, $7, $8, $9)`,
      [sessionId, category, unfaithfulPartner, partnerAName, partnerBName, partnerAToken, partnerBToken, testPin, testPin]
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
