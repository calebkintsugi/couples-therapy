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

  // AI Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Partner questions state
  const [partnerQuestions, setPartnerQuestions] = useState([]);
  const [sentQuestions, setSentQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchJournal();
    fetchPrompts();
    fetchPartnerQuestions();
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

  const fetchPartnerQuestions = async () => {
    try {
      const response = await fetch(`/api/journals/${journalId}/questions/${token}`);
      const data = await response.json();
      if (response.ok) {
        setPartnerQuestions(data.received || []);
        setSentQuestions(data.sent || []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch(`/api/journals/${journalId}/chat/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const sendPartnerQuestion = async () => {
    if (!newQuestion.trim() || sendingQuestion) return;

    setSendingQuestion(true);
    try {
      const response = await fetch(`/api/journals/${journalId}/questions/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion.trim() }),
      });

      if (response.ok) {
        setNewQuestion('');
        await fetchPartnerQuestions();
      }
    } catch (err) {
      console.error('Error sending question:', err);
    } finally {
      setSendingQuestion(false);
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
    ? Math.min(100, (Math.max(journalData.yourWordCount, journalData.partnerWordCount) / journalData.wordThreshold) * 100)
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
                Once either of you has written {journalData.wordThreshold} words, the AI coach will start providing personalized insights based on your reflections.
              </p>
            )}
          </div>
        </header>

        {/* Questions from Partner */}
        {partnerQuestions.length > 0 && (
          <div className="journal-partner-questions">
            <h2>Questions from {journalData.partnerName}</h2>
            {partnerQuestions.map((q) => (
              <div key={q.id} className="journal-question-card">
                <p className="journal-question-text">"{q.question_text}"</p>
                <span className="journal-question-date">
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

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

        {/* AI Chat Section */}
        {journalData.aiActivated && (
          <div className="journal-chat-section">
            <button
              type="button"
              className="journal-chat-toggle"
              onClick={() => setShowChat(!showChat)}
            >
              <span>💬</span>
              <span>Ask the AI Coach a Question</span>
              <span className="journal-chat-arrow">{showChat ? '▲' : '▼'}</span>
            </button>

            {showChat && (
              <div className="journal-chat-container">
                <p className="journal-chat-hint">
                  The AI has read both your journal and {journalData.partnerName}'s journal.
                  Ask questions about your relationship, patterns you're noticing, or advice on specific situations.
                </p>

                {chatMessages.length > 0 && (
                  <div className="journal-chat-messages">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`journal-chat-message ${msg.role}`}>
                        <div className="journal-chat-label">
                          {msg.role === 'user' ? 'You' : 'Coach'}
                        </div>
                        <div className="journal-chat-content">{msg.content}</div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="journal-chat-message assistant">
                        <div className="journal-chat-label">Coach</div>
                        <div className="journal-chat-content thinking">Thinking...</div>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={sendChatMessage} className="journal-chat-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the AI coach anything..."
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!chatInput.trim() || chatLoading}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Ask Partner a Question */}
        <div className="journal-ask-partner">
          <h3>Ask {journalData.partnerName} a Question</h3>
          <p className="journal-ask-hint">Send a question directly to your partner</p>
          <div className="journal-ask-form">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to ask your partner?"
              rows={3}
            />
            <button
              className="btn btn-primary"
              onClick={sendPartnerQuestion}
              disabled={sendingQuestion || !newQuestion.trim()}
            >
              {sendingQuestion ? 'Sending...' : 'Send Question'}
            </button>
          </div>

          {sentQuestions.length > 0 && (
            <div className="journal-sent-questions">
              <h4>Questions You've Sent</h4>
              {sentQuestions.map((q) => (
                <div key={q.id} className="journal-sent-item">
                  <p>"{q.question_text}"</p>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share code */}
        <div className="journal-share-section">
          <h3>Your Journal Code</h3>
          <p>Save this code to return to your journal, or share it with your partner:</p>
          <code className="journal-code">{journalData.code}</code>
          <div className="journal-code-actions">
            <a
              href={`mailto:?subject=Your RepairCoach Journal Code&body=Your RepairCoach Journal Code is: ${journalData.code}%0A%0ASave this code to return to your journal at https://repaircoach.ai`}
              className="btn btn-ghost btn-sm"
            >
              Email Code to Myself
            </a>
            {journalData.partnerInviteUrl && (
              <a
                href={`mailto:?subject=Join our RepairCoach Journal&body=I've started a relationship journal for us on RepairCoach. Click this link to join:%0A%0A${window.location.origin}${journalData.partnerInviteUrl}%0A%0AOr enter this code at repaircoach.ai: ${journalData.code}`}
                className="btn btn-ghost btn-sm"
              >
                Email Link to Partner
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Journal;
