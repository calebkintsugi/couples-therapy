import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { trackPageView, trackClick, trackSubmit } from '../analytics';
import { detectCrisis } from '../utils/crisisDetection';
import CrisisModal from './CrisisModal';

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
  const [startedAt, setStartedAt] = useState(null);
  const [editingSummaryId, setEditingSummaryId] = useState(null);
  const [editingSummaryText, setEditingSummaryText] = useState('');

  // AI Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Partner questions state
  const [partnerQuestions, setPartnerQuestions] = useState([]);
  const [sentQuestions, setSentQuestions] = useState([]);
  const [questionAlerts, setQuestionAlerts] = useState([]);
  const [responseAlerts, setResponseAlerts] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Crisis detection state
  const [crisisModal, setCrisisModal] = useState({ show: false, type: null, action: null });

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    trackPageView('journal');
    fetchJournal();
    fetchPrompts();
    fetchPartnerQuestions();
  }, [token, journalId]);

  const scrollToQuestion = (questionId, type) => {
    const elementId = type === 'received' ? `question-received-${questionId}` : `question-sent-${questionId}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => element.classList.remove('highlight'), 2000);
    }
  };

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
        setQuestionAlerts(data.alerts || []);
        setResponseAlerts(data.responseAlerts || []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const sendChatMessage = async (e, bypassCrisisCheck = false) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    // Check for crisis indicators
    if (!bypassCrisisCheck) {
      const crisis = detectCrisis(chatInput);
      if (crisis.detected) {
        setCrisisModal({ show: true, type: crisis.type, action: 'chat' });
        return;
      }
    }

    trackSubmit('journal_chat');
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

  const updateSummary = async (entryId) => {
    if (!editingSummaryText.trim()) return;

    try {
      const response = await fetch(`/api/journals/${journalId}/entry/${entryId}/summary/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: editingSummaryText.trim() }),
      });

      if (response.ok) {
        setEntries(entries.map(e =>
          e.id === entryId ? { ...e, summary: editingSummaryText.trim() } : e
        ));
        setEditingSummaryId(null);
        setEditingSummaryText('');
      }
    } catch (err) {
      console.error('Error updating summary:', err);
    }
  };

  const sendPartnerQuestion = async () => {
    if (!newQuestion.trim() || sendingQuestion) return;

    trackSubmit('journal_partner_question');
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

  const dismissAlert = async (questionId) => {
    try {
      await fetch(`/api/journals/${journalId}/questions/${questionId}/dismiss/${token}`, {
        method: 'PUT',
      });
      setQuestionAlerts(questionAlerts.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const dismissResponseAlert = async (questionId) => {
    try {
      await fetch(`/api/journals/${journalId}/questions/${questionId}/dismiss-response/${token}`, {
        method: 'PUT',
      });
      setResponseAlerts(responseAlerts.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Error dismissing response alert:', err);
    }
  };

  const sendReply = async (questionId) => {
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const response = await fetch(`/api/journals/${journalId}/questions/${questionId}/reply/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });

      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        await fetchPartnerQuestions();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const submitEntry = async (bypassCrisisCheck = false) => {
    if (!newEntry.trim() || submitting) return;

    // Check for crisis indicators
    if (!bypassCrisisCheck) {
      const crisis = detectCrisis(newEntry);
      if (crisis.detected) {
        setCrisisModal({ show: true, type: crisis.type, action: 'entry' });
        return;
      }
    }

    trackSubmit('journal_entry', { wordCount: newEntry.trim().split(/\s+/).filter(w => w).length });
    setSubmitting(true);
    try {
      const response = await fetch(`/api/journals/${journalId}/entry/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newEntry.trim(),
          prompt: selectedPrompt || null,
          startedAt: startedAt,
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
      setStartedAt(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteJournal = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/delete/journal/${journalId}/${token}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        navigate('/', { replace: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete journal');
      }
    } catch (err) {
      console.error('Error deleting journal:', err);
      setError('Failed to delete journal');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCrisisContinue = () => {
    const action = crisisModal.action;
    setCrisisModal({ show: false, type: null, action: null });

    if (action === 'entry') {
      submitEntry(true);
    } else if (action === 'chat') {
      sendChatMessage(null, true);
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

        {/* Question Alerts */}
        {(questionAlerts.length > 0 || responseAlerts.length > 0) && (
          <div className="journal-question-alerts">
            {questionAlerts.map((q) => (
              <div key={`q-${q.id}`} className="journal-question-alert">
                <span className="journal-alert-icon">💬</span>
                <span className="journal-alert-text">
                  You have a question from {journalData.partnerName}
                </span>
                <div className="journal-alert-buttons">
                  <button
                    className="btn btn-sm btn-primary journal-alert-btn"
                    onClick={() => {
                      scrollToQuestion(q.id, 'received');
                      dismissAlert(q.id);
                    }}
                  >
                    Show me
                  </button>
                  <button
                    className="btn btn-sm btn-ghost journal-alert-btn"
                    onClick={() => dismissAlert(q.id)}
                  >
                    Got it
                  </button>
                </div>
              </div>
            ))}
            {responseAlerts.map((q) => (
              <div key={`r-${q.id}`} className="journal-question-alert response">
                <span className="journal-alert-icon">✉️</span>
                <span className="journal-alert-text">
                  {journalData.partnerName} responded to your question
                </span>
                <div className="journal-alert-buttons">
                  <button
                    className="btn btn-sm btn-primary journal-alert-btn"
                    onClick={() => {
                      scrollToQuestion(q.id, 'sent');
                      dismissResponseAlert(q.id);
                    }}
                  >
                    Show me
                  </button>
                  <button
                    className="btn btn-sm btn-ghost journal-alert-btn"
                    onClick={() => dismissResponseAlert(q.id)}
                  >
                    Got it
                  </button>
                </div>
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
            onChange={(e) => {
              if (!startedAt && e.target.value.trim()) {
                setStartedAt(new Date().toISOString());
              }
              setNewEntry(e.target.value);
            }}
            placeholder="What's on your mind about your relationship today?"
            rows={8}
            className="journal-textarea"
          />

          <div className="journal-entry-footer">
            <div className="journal-entry-meta">
              <span className="journal-word-indicator">{wordCount} words</span>
              {startedAt && (
                <span className="journal-started-at">
                  Started: {new Date(startedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={submitEntry}
              disabled={submitting || wordCount < 10}
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>

          {/* AI Generating Indicator */}
          {submitting && journalData.aiActivated && (
            <div className="journal-ai-generating">
              <div className="journal-ai-generating-spinner" />
              <div className="journal-ai-generating-text">
                <strong>Your coach is reading and responding...</strong>
                <span>This can take up to a minute or two.</span>
              </div>
            </div>
          )}
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

                {/* Timestamps */}
                {(entry.started_at || entry.ended_at) && (
                  <div className="journal-entry-timestamps">
                    {entry.started_at && (
                      <span>Started: {new Date(entry.started_at).toLocaleTimeString()}</span>
                    )}
                    {entry.ended_at && (
                      <span>Finished: {new Date(entry.ended_at).toLocaleTimeString()}</span>
                    )}
                  </div>
                )}

                {/* Summary */}
                {entry.summary && (
                  <div className="journal-entry-summary">
                    {editingSummaryId === entry.id ? (
                      <div className="journal-summary-edit">
                        <input
                          type="text"
                          value={editingSummaryText}
                          onChange={(e) => setEditingSummaryText(e.target.value)}
                          placeholder="Enter summary..."
                        />
                        <button className="btn btn-sm btn-primary" onClick={() => updateSummary(entry.id)}>
                          Save
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingSummaryId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="journal-summary-display">
                        <span className="journal-summary-label">Summary:</span>
                        <span className="journal-summary-text">{entry.summary}</span>
                        <button
                          className="journal-summary-edit-btn"
                          onClick={() => {
                            setEditingSummaryId(entry.id);
                            setEditingSummaryText(entry.summary);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}

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

        {/* Your Questions Section */}
        <div className="journal-questions-section">
          <h2>Your Questions</h2>

          {/* Ask Partner a Question */}
          <div className="journal-ask-partner">
            <h3>Ask {journalData.partnerName} a Question</h3>
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
          </div>

          {/* Questions from Partner */}
          {partnerQuestions.length > 0 && (
            <div className="journal-question-threads">
              <h3>Questions from {journalData.partnerName}</h3>
              {partnerQuestions.map((q) => (
                <div key={q.id} id={`question-received-${q.id}`} className="journal-question-thread">
                  <div className="journal-thread-header">
                    <span className="journal-thread-from">{journalData.partnerName} asked:</span>
                    <span className="journal-thread-date">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="journal-thread-question">
                    "{q.question_text}"
                  </div>

                  {/* Messages in thread */}
                  {q.messages && q.messages.length > 0 && (
                    <div className="journal-thread-messages">
                      {q.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`journal-thread-message ${msg.from_partner === journalData.partner ? 'own' : 'partner'}`}
                        >
                          <span className="journal-message-author">
                            {msg.from_partner === journalData.partner ? 'You' : journalData.partnerName}:
                          </span>
                          <span className="journal-message-content">{msg.content}</span>
                          <span className="journal-message-time">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === q.id ? (
                    <div className="journal-reply-form">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your response..."
                        rows={3}
                      />
                      <div className="journal-reply-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => sendReply(q.id)}
                          disabled={sendingReply || !replyText.trim()}
                        >
                          {sendingReply ? 'Sending...' : 'Send'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm journal-reply-btn"
                      onClick={() => setReplyingTo(q.id)}
                    >
                      Reply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Questions You've Sent */}
          {sentQuestions.length > 0 && (
            <div className="journal-question-threads">
              <h3>Questions You've Asked</h3>
              {sentQuestions.map((q) => (
                <div key={q.id} id={`question-sent-${q.id}`} className="journal-question-thread sent">
                  <div className="journal-thread-header">
                    <span className="journal-thread-from">You asked {journalData.partnerName}:</span>
                    <span className="journal-thread-date">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="journal-thread-question">
                    "{q.question_text}"
                  </div>

                  {/* Messages in thread */}
                  {q.messages && q.messages.length > 0 ? (
                    <div className="journal-thread-messages">
                      {q.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`journal-thread-message ${msg.from_partner === journalData.partner ? 'own' : 'partner'}`}
                        >
                          <span className="journal-message-author">
                            {msg.from_partner === journalData.partner ? 'You' : journalData.partnerName}:
                          </span>
                          <span className="journal-message-content">{msg.content}</span>
                          <span className="journal-message-time">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="journal-thread-waiting">Waiting for {journalData.partnerName}'s response...</p>
                  )}

                  {/* Reply to continue conversation */}
                  {q.messages && q.messages.length > 0 && (
                    replyingTo === q.id ? (
                      <div className="journal-reply-form">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Continue the conversation..."
                          rows={3}
                        />
                        <div className="journal-reply-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => sendReply(q.id)}
                            disabled={sendingReply || !replyText.trim()}
                          >
                            {sendingReply ? 'Sending...' : 'Send'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm journal-reply-btn"
                        onClick={() => setReplyingTo(q.id)}
                      >
                        Continue Conversation
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {partnerQuestions.length === 0 && sentQuestions.length === 0 && (
            <p className="journal-no-questions">No questions yet. Ask your partner something to start a conversation!</p>
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
                href={`mailto:?subject=Join our RepairCoach Journal&body=I've started a relationship journal for us on RepairCoach. The app lets us have our own private journals, while a coach provides feedback based on what both of us say.%0A%0AClick this link to join:%0A${window.location.origin}${journalData.partnerInviteUrl}%0A%0AOr enter this code at repaircoach.ai: ${journalData.code}`}
                className="btn btn-ghost btn-sm"
              >
                Email Link to Partner
              </a>
            )}
          </div>
        </div>

        {/* Delete Data */}
        <div className="journal-delete-section">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ color: 'var(--error)' }}
          >
            Delete My Journal Data
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete All Journal Data?</h3>
              <p>This will permanently delete:</p>
              <ul style={{ textAlign: 'left', marginBottom: '16px' }}>
                <li>All your journal entries</li>
                <li>All AI coach responses</li>
                <li>All questions to/from your partner</li>
                <li>Your partner's entries too (the entire journal)</li>
              </ul>
              <p><strong>This cannot be undone.</strong></p>
              <div className="modal-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={deleteJournal}
                  disabled={deleting}
                  style={{ background: 'var(--error)', color: 'white' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Crisis Modal */}
        {crisisModal.show && (
          <CrisisModal
            type={crisisModal.type}
            onClose={() => setCrisisModal({ show: false, type: null, action: null })}
            onContinue={handleCrisisContinue}
          />
        )}
      </div>
    </div>
  );
}

export default Journal;
