import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Journal() {
  const { journalId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('p');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [journalData, setJournalData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchJournal();
    fetchPrompts();
  }, [token, journalId]);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/journals/${journalId}/by-token/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load journal');
      }

      setJournalData(data);
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/journals/prompts');
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (err) {
      console.error('Error fetching prompts:', err);
    }
  };

  const submitEntry = async () => {
    if (!newEntry.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/journals/${journalId}/entry/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newEntry.trim(),
          prompt: selectedPrompt || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save entry');
      }

      // Update state with new entry
      setEntries([data.entry, ...entries]);
      setJournalData({
        ...journalData,
        yourWordCount: data.yourWordCount,
        partnerWordCount: data.partnerWordCount,
        aiActivated: data.aiActivated,
      });
      setNewEntry('');
      setSelectedPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = newEntry.trim().split(/\s+/).filter(w => w).length;
  const progressPercent = journalData
    ? Math.min(100, ((journalData.yourWordCount + journalData.partnerWordCount) / (journalData.wordThreshold * 2)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="journal-page">
        <div className="journal-container">
          <div className="loading-card">
            <div className="waiting-spinner" />
            <p>Loading your journal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="journal-page">
        <div className="journal-container">
          <div className="error-card">
            <h2>Something Went Wrong</h2>
            <div className="error-message">{error}</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-page">
      <div className="journal-container">
        {/* Header */}
        <header className="journal-header">
          <h1>Relationship Journal</h1>
          <p className="journal-subtitle">
            A private space for you and {journalData.partnerName} to reflect
          </p>

          {/* Progress indicator */}
          <div className="journal-progress-card">
            <div className="journal-progress-header">
              <span>AI Coaching Progress</span>
              {journalData.aiActivated ? (
                <span className="journal-status active">Active</span>
              ) : (
                <span className="journal-status pending">Building context...</span>
              )}
            </div>

            <div className="journal-progress-bar">
              <div
                className="journal-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="journal-word-counts">
              <div className="journal-word-count">
                <span className="journal-word-label">Your words:</span>
                <span className="journal-word-value">
                  {journalData.yourWordCount} / {journalData.wordThreshold}
                </span>
              </div>
              <div className="journal-word-count">
                <span className="journal-word-label">{journalData.partnerName}'s words:</span>
                <span className="journal-word-value">
                  {journalData.partnerWordCount} / {journalData.wordThreshold}
                </span>
              </div>
            </div>

            {!journalData.aiActivated && (
              <p className="journal-progress-hint">
                Once both of you have written {journalData.wordThreshold} words, the AI coach will start providing personalized insights based on both of your reflections.
              </p>
            )}
          </div>
        </header>

        {/* New Entry Section */}
        <div className="journal-entry-section">
          <h2>Write a New Entry</h2>

          {/* Prompt suggestions */}
          {prompts.length > 0 && (
            <div className="journal-prompts">
              <p className="journal-prompts-label">Need inspiration? Try one of these:</p>
              <div className="journal-prompt-chips">
                {prompts.slice(0, 5).map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`journal-prompt-chip ${selectedPrompt === prompt ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setNewEntry(prompt + '\n\n');
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="What's on your mind about your relationship today?"
            rows={8}
            className="journal-textarea"
          />

          <div className="journal-entry-footer">
            <span className="journal-word-indicator">
              {wordCount} words
            </span>
            <button
              className="btn btn-primary"
              onClick={submitEntry}
              disabled={submitting || wordCount < 10}
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>

        {/* Previous Entries */}
        {entries.length > 0 && (
          <div className="journal-entries">
            <h2>Your Journal Entries</h2>
            {entries.map((entry) => (
              <div key={entry.id} className="journal-entry-card">
                <div className="journal-entry-header">
                  <span className="journal-entry-date">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="journal-entry-words">{entry.word_count} words</span>
                </div>

                {entry.prompt && (
                  <p className="journal-entry-prompt">Prompt: {entry.prompt}</p>
                )}

                <div className="journal-entry-content">
                  {entry.content}
                </div>

                {entry.ai_response && (
                  <div className="journal-ai-response">
                    <div className="journal-ai-header">
                      <span>AI Coach Response</span>
                    </div>
                    <div className="journal-ai-content">
                      {entry.ai_response}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Share code */}
        <div className="journal-share-section">
          <h3>Invite Your Partner</h3>
          <p>Share this code with your partner so they can join your journal:</p>
          <code className="journal-code">{journalData.code}</code>
        </div>
      </div>
    </div>
  );
}

export default Journal;
