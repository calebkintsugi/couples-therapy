import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { generateJournalResponse, chatWithJournalAI, generateJournalSummary } from '../openai.js';
import { encrypt, decrypt, decryptFields, decryptRows } from '../encryption.js';

// Fields to encrypt in journal entries
const ENTRY_ENCRYPTED_FIELDS = ['content', 'summary', 'ai_response'];
const QUESTION_ENCRYPTED_FIELDS = ['question_text'];
const MESSAGE_ENCRYPTED_FIELDS = ['content'];

const router = Router();

const WORD_THRESHOLD = 200; // Words needed from either partner before AI advice activates

// Create a new journal
router.post('/', async (req, res) => {
  const { partnerAName, partnerBName } = req.body;

  const journalId = nanoid(10);
  const code = generateCode();
  const partnerAToken = nanoid(8);
  const partnerBToken = nanoid(8);

  try {
    await db.query(
      `INSERT INTO journals (id, code, partner_a_name, partner_b_name, partner_a_token, partner_b_token)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalId, code, partnerAName || 'Partner A', partnerBName || 'Partner B', partnerAToken, partnerBToken]
    );

    res.json({
      journalId,
      code,
      partnerAToken,
      partnerBToken,
      partnerAUrl: `/journal/${journalId}?p=${partnerAToken}`,
      partnerBUrl: `/journal/${journalId}?p=${partnerBToken}`,
    });
  } catch (error) {
    console.error('Error creating journal:', error);
    res.status(500).json({ error: 'Failed to create journal' });
  }
});

// Get journal by code
router.get('/by-code/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query('SELECT * FROM journals WHERE code = $1', [code.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = result.rows[0];
    res.json({
      journalId: journal.id,
      partnerAName: journal.partner_a_name,
      partnerBName: journal.partner_b_name,
      partnerAUrl: `/journal/${journal.id}?p=${journal.partner_a_token}`,
      partnerBUrl: `/journal/${journal.id}?p=${journal.partner_b_token}`,
    });
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

// Get journal data by token
router.get('/:journalId/by-token/:token', async (req, res) => {
  const { journalId, token } = req.params;

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    // Determine partner
    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get entries for this partner
    const entriesResult = await db.query(
      'SELECT * FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at DESC',
      [journalId, partner]
    );

    // Decrypt entries
    const decryptedEntries = decryptRows(entriesResult.rows, ENTRY_ENCRYPTED_FIELDS);

    // Calculate if AI is activated
    const aiActivated = journal.partner_a_word_count >= WORD_THRESHOLD ||
                        journal.partner_b_word_count >= WORD_THRESHOLD;

    const partnerToken = partner === 'A' ? journal.partner_b_token : journal.partner_a_token;

    res.json({
      partner,
      yourName: partner === 'A' ? journal.partner_a_name : journal.partner_b_name,
      partnerName: partner === 'A' ? journal.partner_b_name : journal.partner_a_name,
      code: journal.code,
      partnerInviteUrl: `/journal/${journalId}?p=${partnerToken}`,
      yourWordCount: partner === 'A' ? journal.partner_a_word_count : journal.partner_b_word_count,
      partnerWordCount: partner === 'A' ? journal.partner_b_word_count : journal.partner_a_word_count,
      aiActivated,
      wordThreshold: WORD_THRESHOLD,
      entries: decryptedEntries,
    });
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

// Add journal entry
router.post('/:journalId/entry/:token', async (req, res) => {
  const { journalId, token } = req.params;
  const { content, prompt, startedAt } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    // Determine partner
    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const wordCount = content.trim().split(/\s+/).filter(w => w).length;
    const endedAt = new Date();
    const trimmedContent = content.trim();

    // Generate AI summary
    let summary = null;
    try {
      summary = await generateJournalSummary(trimmedContent);
    } catch (summaryErr) {
      console.error('Error generating summary:', summaryErr);
    }

    // Insert the entry (encrypt sensitive fields)
    const entryResult = await db.query(
      `INSERT INTO journal_entries (journal_id, partner, content, prompt, word_count, started_at, ended_at, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [journalId, partner, encrypt(trimmedContent), prompt || null, wordCount, startedAt || null, endedAt, encrypt(summary)]
    );

    // Update total word count
    const wordCountField = partner === 'A' ? 'partner_a_word_count' : 'partner_b_word_count';
    await db.query(
      `UPDATE journals SET ${wordCountField} = ${wordCountField} + $1 WHERE id = $2`,
      [wordCount, journalId]
    );

    // Get updated journal to check AI activation
    const updatedJournal = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);
    const updated = updatedJournal.rows[0];

    const aiActivated = updated.partner_a_word_count >= WORD_THRESHOLD ||
                        updated.partner_b_word_count >= WORD_THRESHOLD;

    // Generate AI response if activated
    let aiResponse = null;
    if (aiActivated) {
      try {
        // Get all entries from both partners for context (decrypt for AI)
        const allEntriesA = await db.query(
          'SELECT content, created_at FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at ASC',
          [journalId, 'A']
        );
        const allEntriesB = await db.query(
          'SELECT content, created_at FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at ASC',
          [journalId, 'B']
        );

        // Decrypt entries for AI processing
        const decryptedEntriesA = allEntriesA.rows.map(e => ({ ...e, content: decrypt(e.content) }));
        const decryptedEntriesB = allEntriesB.rows.map(e => ({ ...e, content: decrypt(e.content) }));

        aiResponse = await generateJournalResponse(
          decryptedEntriesA,
          decryptedEntriesB,
          trimmedContent, // Use original plaintext, not encrypted
          partner,
          updated.partner_a_name,
          updated.partner_b_name
        );

        // Save AI response to the entry (encrypted)
        await db.query(
          'UPDATE journal_entries SET ai_response = $1 WHERE id = $2',
          [encrypt(aiResponse), entryResult.rows[0].id]
        );
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
      }
    }

    // Return decrypted entry to client
    const decryptedEntry = decryptFields(entryResult.rows[0], ENTRY_ENCRYPTED_FIELDS);
    decryptedEntry.ai_response = aiResponse; // Use plaintext AI response we just generated

    res.json({
      entry: decryptedEntry,
      yourWordCount: partner === 'A' ? updated.partner_a_word_count : updated.partner_b_word_count,
      partnerWordCount: partner === 'A' ? updated.partner_b_word_count : updated.partner_a_word_count,
      aiActivated,
      wordThreshold: WORD_THRESHOLD,
    });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// Update entry summary
router.put('/:journalId/entry/:entryId/summary/:token', async (req, res) => {
  const { journalId, entryId, token } = req.params;
  const { summary } = req.body;

  if (!summary || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Summary is required' });
  }

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    // Verify token
    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verify entry belongs to this partner
    const entryResult = await db.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND journal_id = $2 AND partner = $3',
      [entryId, journalId, partner]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Update summary (encrypted)
    await db.query(
      'UPDATE journal_entries SET summary = $1 WHERE id = $2',
      [encrypt(summary.trim()), entryId]
    );

    res.json({ success: true, summary: summary.trim() });
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({ error: 'Failed to update summary' });
  }
});

// Get suggested prompts
router.get('/prompts', (req, res) => {
  const prompts = [
    "What's the history or background on your relationship that I should know about?",
    "How are you feeling about your relationship right now?",
    "What is going well in your relationship? What isn't?",
    "What do you appreciate most about your partner lately?",
    "What's been on your mind that you haven't shared with your partner?",
    "Describe a recent moment that made you feel connected (or disconnected).",
    "What do you need more of in your relationship right now?",
    "What fears or worries do you have about your relationship?",
    "What are you grateful for in your partnership today?",
    "What conversation have you been avoiding? Why?",
    "How have you been showing up as a partner lately? How would you like to show up?",
  ];
  res.json({ prompts });
});

// Chat with AI about the journal
router.post('/:journalId/chat/:token', async (req, res) => {
  const { journalId, token } = req.params;
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    // Determine partner
    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get all entries from both partners (decrypt for AI)
    const entriesA = await db.query(
      'SELECT content, created_at FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at ASC',
      [journalId, 'A']
    );
    const entriesB = await db.query(
      'SELECT content, created_at FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at ASC',
      [journalId, 'B']
    );

    // Decrypt entries for AI processing
    const decryptedEntriesA = entriesA.rows.map(e => ({ ...e, content: decrypt(e.content) }));
    const decryptedEntriesB = entriesB.rows.map(e => ({ ...e, content: decrypt(e.content) }));

    const response = await chatWithJournalAI(
      decryptedEntriesA,
      decryptedEntriesB,
      message,
      conversationHistory || [],
      partner,
      journal.partner_a_name,
      journal.partner_b_name
    );

    res.json({ response });
  } catch (error) {
    console.error('Error in journal chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get questions sent to this partner (with messages)
router.get('/:journalId/questions/:token', async (req, res) => {
  const { journalId, token } = req.params;

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get questions sent TO this partner (with messages)
    const received = await db.query(
      `SELECT * FROM journal_questions WHERE journal_id = $1 AND to_partner = $2 ORDER BY created_at DESC`,
      [journalId, partner]
    );

    // Get questions sent BY this partner (with messages)
    const sent = await db.query(
      `SELECT * FROM journal_questions WHERE journal_id = $1 AND from_partner = $2 ORDER BY created_at DESC`,
      [journalId, partner]
    );

    // Get messages for all questions
    const allQuestionIds = [...received.rows, ...sent.rows].map(q => q.id);
    let messagesMap = {};

    if (allQuestionIds.length > 0) {
      const messages = await db.query(
        `SELECT * FROM journal_question_messages WHERE question_id = ANY($1) ORDER BY created_at ASC`,
        [allQuestionIds]
      );

      // Group messages by question_id (decrypt each message)
      messages.rows.forEach(msg => {
        if (!messagesMap[msg.question_id]) {
          messagesMap[msg.question_id] = [];
        }
        messagesMap[msg.question_id].push(decryptFields(msg, MESSAGE_ENCRYPTED_FIELDS));
      });
    }

    // Attach messages to questions (decrypt question_text)
    const receivedWithMessages = received.rows.map(q => ({
      ...decryptFields(q, QUESTION_ENCRYPTED_FIELDS),
      messages: messagesMap[q.id] || []
    }));

    const sentWithMessages = sent.rows.map(q => ({
      ...decryptFields(q, QUESTION_ENCRYPTED_FIELDS),
      messages: messagesMap[q.id] || []
    }));

    // Get undismissed questions for alert (questions sent TO this partner) - already decrypted
    const undismissedAlerts = receivedWithMessages.filter(q => !q.is_dismissed);

    // Get alerts for responses to questions this partner SENT (that have responses and asker hasn't dismissed) - already decrypted
    const responseAlerts = sentWithMessages.filter(q =>
      !q.asker_notified && q.messages && q.messages.length > 0
    );

    res.json({
      received: receivedWithMessages,
      sent: sentWithMessages,
      alerts: undismissedAlerts,
      responseAlerts: responseAlerts,
      partnerName: partner === 'A' ? journal.partner_b_name : journal.partner_a_name,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Send a question to partner
router.post('/:journalId/questions/:token', async (req, res) => {
  const { journalId, token } = req.params;
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    let fromPartner = null;
    let toPartner = null;
    if (token === journal.partner_a_token) {
      fromPartner = 'A';
      toPartner = 'B';
    } else if (token === journal.partner_b_token) {
      fromPartner = 'B';
      toPartner = 'A';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const result = await db.query(
      `INSERT INTO journal_questions (journal_id, from_partner, to_partner, question_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [journalId, fromPartner, toPartner, encrypt(question.trim())]
    );

    // Return decrypted question to client
    res.json({ question: decryptFields(result.rows[0], QUESTION_ENCRYPTED_FIELDS) });
  } catch (error) {
    console.error('Error sending question:', error);
    res.status(500).json({ error: 'Failed to send question' });
  }
});

// Dismiss a question alert (for recipient)
router.put('/:journalId/questions/:questionId/dismiss/:token', async (req, res) => {
  const { journalId, questionId, token } = req.params;

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verify this question was sent to this partner
    const questionResult = await db.query(
      'SELECT * FROM journal_questions WHERE id = $1 AND journal_id = $2 AND to_partner = $3',
      [questionId, journalId, partner]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await db.query(
      'UPDATE journal_questions SET is_dismissed = TRUE WHERE id = $1',
      [questionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing question:', error);
    res.status(500).json({ error: 'Failed to dismiss question' });
  }
});

// Dismiss a response alert (for question asker)
router.put('/:journalId/questions/:questionId/dismiss-response/:token', async (req, res) => {
  const { journalId, questionId, token } = req.params;

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verify this question was sent BY this partner
    const questionResult = await db.query(
      'SELECT * FROM journal_questions WHERE id = $1 AND journal_id = $2 AND from_partner = $3',
      [questionId, journalId, partner]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await db.query(
      'UPDATE journal_questions SET asker_notified = TRUE WHERE id = $1',
      [questionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing response alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

// Reply to a question (add message to thread)
router.post('/:journalId/questions/:questionId/reply/:token', async (req, res) => {
  const { journalId, questionId, token } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const journalResult = await db.query('SELECT * FROM journals WHERE id = $1', [journalId]);

    if (journalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const journal = journalResult.rows[0];

    let partner = null;
    if (token === journal.partner_a_token) {
      partner = 'A';
    } else if (token === journal.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verify this question belongs to this journal and involves this partner
    const questionResult = await db.query(
      'SELECT * FROM journal_questions WHERE id = $1 AND journal_id = $2 AND (from_partner = $3 OR to_partner = $3)',
      [questionId, journalId, partner]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Add the message (encrypted)
    const messageResult = await db.query(
      `INSERT INTO journal_question_messages (question_id, from_partner, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [questionId, partner, encrypt(content.trim())]
    );

    // Return decrypted message to client
    res.json({ message: decryptFields(messageResult.rows[0], MESSAGE_ENCRYPTED_FIELDS) });
  } catch (error) {
    console.error('Error replying to question:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default router;
