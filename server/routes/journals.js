import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { generateJournalResponse } from '../openai.js';

const router = Router();

const WORD_THRESHOLD = 500; // Words needed from each partner before AI advice activates

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

    // Calculate if AI is activated
    const aiActivated = journal.partner_a_word_count >= WORD_THRESHOLD &&
                        journal.partner_b_word_count >= WORD_THRESHOLD;

    res.json({
      partner,
      yourName: partner === 'A' ? journal.partner_a_name : journal.partner_b_name,
      partnerName: partner === 'A' ? journal.partner_b_name : journal.partner_a_name,
      code: journal.code,
      yourWordCount: partner === 'A' ? journal.partner_a_word_count : journal.partner_b_word_count,
      partnerWordCount: partner === 'A' ? journal.partner_b_word_count : journal.partner_a_word_count,
      aiActivated,
      wordThreshold: WORD_THRESHOLD,
      entries: entriesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

// Add journal entry
router.post('/:journalId/entry/:token', async (req, res) => {
  const { journalId, token } = req.params;
  const { content, prompt } = req.body;

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

    // Insert the entry
    const entryResult = await db.query(
      `INSERT INTO journal_entries (journal_id, partner, content, prompt, word_count)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [journalId, partner, content.trim(), prompt || null, wordCount]
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

    const aiActivated = updated.partner_a_word_count >= WORD_THRESHOLD &&
                        updated.partner_b_word_count >= WORD_THRESHOLD;

    // Generate AI response if activated
    let aiResponse = null;
    if (aiActivated) {
      try {
        // Get all entries from both partners for context
        const allEntriesA = await db.query(
          'SELECT content, created_at FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at ASC',
          [journalId, 'A']
        );
        const allEntriesB = await db.query(
          'SELECT content, created_at FROM journal_entries WHERE journal_id = $1 AND partner = $2 ORDER BY created_at ASC',
          [journalId, 'B']
        );

        aiResponse = await generateJournalResponse(
          allEntriesA.rows,
          allEntriesB.rows,
          content,
          partner,
          updated.partner_a_name,
          updated.partner_b_name
        );

        // Save AI response to the entry
        await db.query(
          'UPDATE journal_entries SET ai_response = $1 WHERE id = $2',
          [aiResponse, entryResult.rows[0].id]
        );
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
      }
    }

    res.json({
      entry: { ...entryResult.rows[0], ai_response: aiResponse },
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

// Get suggested prompts
router.get('/prompts', (req, res) => {
  const prompts = [
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

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default router;
