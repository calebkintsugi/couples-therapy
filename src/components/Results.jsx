import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Results() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('p');

  const [partner, setPartner] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [advice, setAdvice] = useState('');
  const [coupleCode, setCoupleCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiModel, setAiModel] = useState('openai');

  // PIN verification state
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinRequired, setPinRequired] = useState(true);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Followup questions state
  const [followups, setFollowups] = useState([]);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [suggestedQuestion, setSuggestedQuestion] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeFollowupId, setActiveFollowupId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    setLoading(false);
  }, [token, navigate]);

  const verifyPin = async () => {
    if (!pinInput || !/^\d{6}$/.test(pinInput)) {
      setPinError('Please enter your 6 digit PIN');
      return;
    }

    setVerifyingPin(true);
    setPinError('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin: pinInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setPinError('Incorrect PIN. Please try again.');
        } else {
          throw new Error(data.error || 'Failed to verify PIN');
        }
        return;
      }

      if (data.verified) {
        setPinVerified(true);
        setPinRequired(data.pinRequired !== false);
        if (data.partnerName) {
          setPartnerName(data.partnerName);
        }
        fetchAdvice();
      }
    } catch (err) {
      setPinError(err.message);
    } finally {
      setVerifyingPin(false);
    }
  };

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/advice-by-token/${token}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.partnerACompleted === false || data.partnerBCompleted === false) {
          navigate(`/session/${sessionId}/waiting?p=${token}`);
          return;
        }
        throw new Error(data.error || 'Failed to load advice');
      }

      setPartner(data.partner);
      setAdvice(data.advice);
      if (data.coupleCode) {
        setCoupleCode(data.coupleCode);
      }
      if (data.aiModel) {
        setAiModel(data.aiModel);
      }
      if (data.partnerName) {
        setPartnerName(data.partnerName);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAdvice = async () => {
    setRegenerating(true);
    setError('');
    setChatMessages([]); // Clear chat on regenerate
    try {
      const response = await fetch(`/api/sessions/${sessionId}/advice-by-token/${token}?regenerate=true&aiModel=${aiModel}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate advice');
      }

      setAdvice(data.advice);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setRegenerating(false);
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
      const response = await fetch(`/api/sessions/${sessionId}/chat-by-token/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages
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

  // Followup question functions
  const fetchFollowups = async () => {
    setLoadingFollowups(true);
    try {
      const response = await fetch(`/api/followup/${sessionId}/by-token/${token}`);
      const data = await response.json();
      if (response.ok) {
        setFollowups(data.followups || []);
        setCanCreateMore(data.canCreateMore);
      }
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setLoadingFollowups(false);
    }
  };

  const generateSuggestedQuestion = async () => {
    setGeneratingQuestion(true);
    setSuggestedQuestion('');
    try {
      const response = await fetch(`/api/followup/${sessionId}/generate-question/${token}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setSuggestedQuestion(data.question);
      }
    } catch (err) {
      console.error('Error generating question:', err);
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const acceptSuggestedQuestion = async () => {
    if (!suggestedQuestion) return;
    setCreatingQuestion(true);
    try {
      const response = await fetch(`/api/followup/${sessionId}/create/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: suggestedQuestion, createdBy: 'AI' }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuggestedQuestion('');
        setShowCustomInput(false);
        await fetchFollowups();
      }
    } catch (err) {
      console.error('Error creating question:', err);
    } finally {
      setCreatingQuestion(false);
    }
  };

  const submitCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    setCreatingQuestion(true);
    try {
      const response = await fetch(`/api/followup/${sessionId}/create/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: customQuestion.trim(), createdBy: partner }),
      });
      const data = await response.json();
      if (response.ok) {
        setCustomQuestion('');
        setSuggestedQuestion('');
        setShowCustomInput(false);
        await fetchFollowups();
      }
    } catch (err) {
      console.error('Error creating question:', err);
    } finally {
      setCreatingQuestion(false);
    }
  };

  const submitFollowupAnswer = async (questionId) => {
    if (!followupAnswer.trim()) return;
    setSubmittingAnswer(true);
    try {
      const response = await fetch(`/api/followup/${sessionId}/answer/${questionId}/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: followupAnswer.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setFollowupAnswer('');
        setActiveFollowupId(null);
        await fetchFollowups();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Load followups after advice loads
  useEffect(() => {
    if (pinVerified && advice && token) {
      fetchFollowups();
    }
  }, [pinVerified, advice, token]);

  // PIN verification screen
  if (!pinVerified) {
    return (
      <div className="card">
        <h2>Enter Your PIN</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Your results are protected. Please enter the PIN you created when completing the questionnaire.
        </p>

        {pinError && <div className="error-message">{pinError}</div>}

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter your PIN"
            style={{ width: '100%', maxWidth: '200px' }}
            onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
            autoFocus
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={verifyPin}
          disabled={verifyingPin || !/^\d{6}$/.test(pinInput)}
        >
          {verifyingPin ? 'Verifying...' : 'View Results'}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="waiting-container">
          <div className="waiting-spinner" />
          <h2>You&apos;re All Set</h2>
          <p>
            Both you and {partnerName || 'your partner'} have completed your questionnaires.
          </p>
          <p>
            Please wait while we generate your personalized guidance. This may take up to a minute.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Something Went Wrong</h2>
        <div className="error-message">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Your Personalized Guidance</h2>

      <div className="disclaimer">
        <h4>Reminder</h4>
        <p>
          This guidance is for educational purposes only and is not a substitute
          for professional therapy. We strongly encourage working with a licensed
          therapist for the best support in your healing journey.
        </p>
      </div>

      {coupleCode && (
        <div style={{
          background: 'var(--background)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Couple Code: </span>
            <code style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'var(--primary)',
            }}>
              {coupleCode}
            </code>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Save this to access your history later
          </span>
        </div>
      )}

      <div
        className="results-content"
        style={{
          background: 'var(--background)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          whiteSpace: 'pre-wrap',
        }}
      >
        {advice}
      </div>

      {/* Follow-up Chat Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Have follow-up questions?</h3>

        {chatMessages.length > 0 && (
          <div
            style={{
              background: 'var(--background)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  marginLeft: msg.role === 'user' ? '2rem' : '0',
                  marginRight: msg.role === 'assistant' ? '2rem' : '0',
                }}
              >
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                  {msg.role === 'user' ? 'You' : 'Coach'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                Thinking...
              </div>
            )}
          </div>
        )}

        <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={chatLoading}
            style={{ flex: 1 }}
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

      {/* Followup Questions Section */}
      <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Deeper Dive Questions</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Explore your relationship further with questions that both you and {partnerName || 'your partner'} answer.
          The AI will then provide insights based on both responses.
        </p>

        {/* Previous Followups */}
        {followups.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {followups.map((followup, index) => {
              const myAnswer = partner === 'A' ? followup.partner_a_answer : followup.partner_b_answer;
              const theirAnswer = partner === 'A' ? followup.partner_b_answer : followup.partner_a_answer;
              const needsMyAnswer = !myAnswer;
              const needsTheirAnswer = !theirAnswer;
              const isComplete = myAnswer && theirAnswer && followup.ai_response;

              return (
                <div
                  key={followup.id}
                  style={{
                    background: 'var(--background)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    border: needsMyAnswer ? '2px solid var(--primary)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Question {followup.question_number} • {followup.created_by === 'AI' ? 'AI suggested' : `Suggested by ${followup.created_by === partner ? 'you' : partnerName}`}
                    </span>
                    {needsMyAnswer && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        Your turn
                      </span>
                    )}
                    {!needsMyAnswer && needsTheirAnswer && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        Waiting for {partnerName}
                      </span>
                    )}
                  </div>

                  <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{followup.question_text}</p>

                  {/* Answer input if needed */}
                  {needsMyAnswer && (
                    <div style={{ marginBottom: '1rem' }}>
                      <textarea
                        value={activeFollowupId === followup.id ? followupAnswer : ''}
                        onChange={(e) => {
                          setActiveFollowupId(followup.id);
                          setFollowupAnswer(e.target.value);
                        }}
                        onFocus={() => setActiveFollowupId(followup.id)}
                        placeholder="Share your thoughts..."
                        rows={3}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => submitFollowupAnswer(followup.id)}
                        disabled={submittingAnswer || !followupAnswer.trim() || activeFollowupId !== followup.id}
                      >
                        {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    </div>
                  )}

                  {/* Show answers and AI response if complete */}
                  {isComplete && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>Your answer:</div>
                        <div style={{ fontSize: '0.9rem' }}>{myAnswer}</div>
                      </div>
                      <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>{partnerName}&apos;s answer:</div>
                        <div style={{ fontSize: '0.9rem' }}>{theirAnswer}</div>
                      </div>
                      <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>AI Insights:</div>
                        <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{followup.ai_response}</div>
                      </div>
                    </div>
                  )}

                  {/* Show my answer if waiting for partner */}
                  {myAnswer && !theirAnswer && (
                    <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>Your answer:</div>
                      <div style={{ fontSize: '0.9rem' }}>{myAnswer}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create new followup question */}
        {canCreateMore && (
          <div style={{ background: 'var(--background)', borderRadius: '12px', padding: '1.25rem' }}>
            {!suggestedQuestion && !showCustomInput ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={generateSuggestedQuestion}
                  disabled={generatingQuestion}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  {generatingQuestion ? 'Generating...' : 'Get AI-Suggested Question'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCustomInput(true)}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  Suggest Your Own Question
                </button>
              </div>
            ) : suggestedQuestion ? (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  The AI suggests asking both of you:
                </p>
                <p style={{ fontWeight: '600', fontStyle: 'italic', marginBottom: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                  &ldquo;{suggestedQuestion}&rdquo;
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={acceptSuggestedQuestion}
                    disabled={creatingQuestion}
                    style={{ flex: 1 }}
                  >
                    {creatingQuestion ? 'Creating...' : 'Use This Question'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={generateSuggestedQuestion}
                    disabled={generatingQuestion}
                    style={{ flex: 1 }}
                  >
                    {generatingQuestion ? 'Generating...' : 'Try Another'}
                  </button>
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                    onClick={() => {
                      setSuggestedQuestion('');
                      setShowCustomInput(true);
                    }}
                  >
                    Or suggest your own question instead
                  </button>
                </div>
              </div>
            ) : showCustomInput ? (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  What question would you like both of you to answer?
                </p>
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Enter a question for both partners to answer..."
                  rows={2}
                  style={{ width: '100%', marginBottom: '0.75rem' }}
                />
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={submitCustomQuestion}
                    disabled={creatingQuestion || !customQuestion.trim()}
                    style={{ flex: 1 }}
                  >
                    {creatingQuestion ? 'Creating...' : 'Submit Question'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomQuestion('');
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                    onClick={() => {
                      setShowCustomInput(false);
                      generateSuggestedQuestion();
                    }}
                  >
                    Or get an AI-suggested question instead
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {!canCreateMore && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            You&apos;ve reached the maximum of 10 followup questions for this session.
          </p>
        )}
      </div>

      <div className="crisis-resources">
        <h4>Professional Resources</h4>
        <p>
          Consider seeking support from a licensed therapist or counselor who
          specializes in relationship trauma and infidelity recovery.
        </p>
        <p>
          <strong>Psychology Today Therapist Finder:</strong>{' '}
          <a
            href="https://www.psychologytoday.com/us/therapists"
            target="_blank"
            rel="noopener noreferrer"
          >
            Find a Therapist
          </a>
        </p>
        <p>
          <strong>National Suicide Prevention Lifeline:</strong> 988
        </p>
        <p>
          <strong>Crisis Text Line:</strong> Text HOME to 741741
        </p>
      </div>

      {/* AI Model Toggle */}
      <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
          Choose your preferred AI model:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setAiModel('openai')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              border: aiModel === 'openai' ? '2px solid var(--primary)' : '2px solid var(--border)',
              borderRadius: '8px',
              background: aiModel === 'openai' ? 'var(--primary-light)' : 'var(--surface)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ChatGPT
          </button>
          <button
            type="button"
            onClick={() => setAiModel('gemini')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              border: aiModel === 'gemini' ? '2px solid var(--primary)' : '2px solid var(--border)',
              borderRadius: '8px',
              background: aiModel === 'gemini' ? 'var(--primary-light)' : 'var(--surface)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Gemini
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={regenerateAdvice}
          disabled={regenerating}
          style={{ flex: 1 }}
        >
          {regenerating ? 'Regenerating...' : 'Regenerate Advice'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ flex: 1 }}
        >
          Start a New Session
        </button>
      </div>
    </div>
  );
}

export default Results;
