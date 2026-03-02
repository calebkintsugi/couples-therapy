import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

// Parse advice text into sections
function parseAdviceSections(adviceText) {
  if (!adviceText) return [];

  const sectionPatterns = [
    { icon: '📍', title: 'Key Takeaways', pattern: /📍\s*(KEY TAKEAWAYS|TLDR)/i },
    { icon: '🌊', title: 'What\'s Happening Under the Surface', pattern: /🌊\s*WHAT'S HAPPENING UNDER THE SURFACE/i },
    { icon: '🔦', title: 'Possible Blind Spots', pattern: /🔦\s*POSSIBLE BLIND SPOTS/i },
    { icon: '🗺️', title: 'A Roadmap Forward', pattern: /🗺️\s*A ROADMAP FORWARD/i },
    { icon: '🎯', title: 'Focus Areas', pattern: /🎯\s*FOCUS AREAS/i },
    // Short intake sections
    { icon: '📍', title: 'Quick Assessment', pattern: /📍\s*QUICK ASSESSMENT/i },
    { icon: '🗺️', title: 'Three Steps Forward', pattern: /🗺️\s*THREE STEPS FORWARD/i },
    { icon: '💬', title: 'Conversation Prompt', pattern: /💬\s*CONVERSATION PROMPT/i },
  ];

  const sections = [];

  // Find all section positions
  const sectionPositions = [];
  sectionPatterns.forEach(({ icon, title, pattern }) => {
    const match = adviceText.match(pattern);
    if (match) {
      sectionPositions.push({
        icon,
        title,
        index: match.index,
        headerLength: match[0].length,
      });
    }
  });

  // Sort by position
  sectionPositions.sort((a, b) => a.index - b.index);

  // Extract content for each section
  sectionPositions.forEach((section, i) => {
    const startContent = section.index + section.headerLength;
    const endContent = i < sectionPositions.length - 1
      ? sectionPositions[i + 1].index
      : adviceText.length;

    const content = adviceText.slice(startContent, endContent).trim();

    sections.push({
      icon: section.icon,
      title: section.title,
      content,
    });
  });

  // If no sections found, return the whole thing as one section
  if (sections.length === 0) {
    return [{ icon: '💡', title: 'Your Guidance', content: adviceText }];
  }

  return sections;
}

// Collapsible section component
function AdviceSection({ icon, title, content, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="advice-section">
      <button
        type="button"
        className={`advice-section-header ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="advice-section-title">
          <span className="advice-section-icon">{icon}</span>
          <h3>{title}</h3>
        </div>
        <span className="advice-section-toggle">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="advice-section-content">
          {content}
        </div>
      )}
    </div>
  );
}

function Results() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('p');

  const [partner, setPartner] = useState(null);
  const [yourName, setYourName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [advice, setAdvice] = useState('');
  const [coupleCode, setCoupleCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiModel, setAiModel] = useState('gemini');
  const [originalModel, setOriginalModel] = useState('gemini');
  const [showModelChangePrompt, setShowModelChangePrompt] = useState(false);

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
  const [showChat, setShowChat] = useState(false);

  // Followup questions state
  const [followups, setFollowups] = useState([]);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [suggestedQuestion, setSuggestedQuestion] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeFollowupId, setActiveFollowupId] = useState(null);

  // Partner questions state
  const [partnerQuestions, setPartnerQuestions] = useState([]);
  const [sentQuestions, setSentQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);

  // Memoize parsed advice sections
  const adviceSections = useMemo(() => parseAdviceSections(advice), [advice]);

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
        setOriginalModel(data.aiModel);
      }
      if (data.yourName) {
        setYourName(data.yourName);
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
    setChatMessages([]);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/advice-by-token/${token}?regenerate=true&aiModel=${aiModel}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate advice');
      }

      setAdvice(data.advice);
      setOriginalModel(aiModel);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupleCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      if (response.ok) {
        setSuggestedQuestion('');
        setCustomQuestion('');
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

  // Partner questions functions
  const fetchPartnerQuestions = async () => {
    try {
      const response = await fetch(`/api/partner-questions/${sessionId}/for/${token}`);
      const data = await response.json();
      if (response.ok) {
        setPartnerQuestions(data.received || []);
        setSentQuestions(data.sent || []);
      }
    } catch (err) {
      console.error('Error fetching partner questions:', err);
    }
  };

  const sendPartnerQuestion = async () => {
    if (!newQuestion.trim() || sendingQuestion) return;

    setSendingQuestion(true);
    try {
      const response = await fetch(`/api/partner-questions/${sessionId}/send/${token}`, {
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

  // Load followups after advice loads
  useEffect(() => {
    if (pinVerified && advice && token) {
      fetchFollowups();
      fetchPartnerQuestions();
    }
  }, [pinVerified, advice, token]);

  // Auto-generate a suggested question when ready for a new one
  useEffect(() => {
    if (canCreateMore && !suggestedQuestion && !generatingQuestion && followups.length >= 0 && pinVerified && advice) {
      const hasPendingQuestion = followups.some(f => {
        const myAnswer = partner === 'A' ? f.partner_a_answer : f.partner_b_answer;
        return !myAnswer;
      });
      if (!hasPendingQuestion) {
        generateSuggestedQuestion();
      }
    }
  }, [canCreateMore, followups, pinVerified, advice, partner]);

  // Check if there's a pending question I need to answer
  const pendingQuestion = followups.find(f => {
    const myAnswer = partner === 'A' ? f.partner_a_answer : f.partner_b_answer;
    return !myAnswer;
  });

  // PIN verification screen
  if (!pinVerified) {
    return (
      <div className="guidance-page">
        <div className="guidance-container">
          <div className="pin-card">
            <h2>Enter Your PIN</h2>
            <p>Your results are protected. Please enter the PIN you created when completing the questionnaire.</p>

            {pinError && <div className="error-message">{pinError}</div>}

            <div className="pin-input-wrapper">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your PIN"
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
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="guidance-page">
        <div className="guidance-container">
          <div className="loading-card">
            <div className="waiting-spinner" />
            <h2>You're All Set</h2>
            <p>Both you and {partnerName || 'your partner'} have completed your questionnaires.</p>
            <p className="text-muted">Please wait while we generate your personalized guidance.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guidance-page">
        <div className="guidance-container">
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
    <div className="guidance-page">
      <div className="guidance-container">
        {/* Header */}
        <header className="guidance-header">
          <h1>Relationship Guidance for You{yourName ? `, ${yourName}` : ''}</h1>
          {coupleCode && (
            <div className="couple-code-section">
              <div className="couple-code-card">
                <span className="couple-code-label">⚠️ Save Your Couple Code</span>
                <code className="couple-code-value-large">{coupleCode}</code>
                <p className="couple-code-helper">You'll need this to return to your results.</p>
                <div className="couple-code-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={copyCode}>
                    {codeCopied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                  <a
                    href={`mailto:?subject=Your RepairCoach Couple Code&body=Your RepairCoach Couple Code is: ${coupleCode}%0A%0ASave this code to return to your results at https://repaircoach.ai`}
                    className="btn btn-ghost btn-sm"
                  >
                    Email to Myself
                  </a>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main two-column layout */}
        <div className="guidance-grid">
          {/* LEFT COLUMN — Guidance */}
          <div className="guidance-column">
            <div className="column-header">
              <h2>Your Guidance</h2>
              <span className="model-indicator">
                Powered by {originalModel === 'gemini' ? 'Gemini' : 'ChatGPT'}
              </span>
            </div>

            {/* Model switch option */}
            {!showModelChangePrompt && !regenerating && (
              <div className="model-switch-hint">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setAiModel(originalModel === 'gemini' ? 'openai' : 'gemini');
                    setShowModelChangePrompt(true);
                  }}
                >
                  Try {originalModel === 'gemini' ? 'ChatGPT' : 'Gemini'} instead?
                </button>
              </div>
            )}

            {/* Model change prompt */}
            {showModelChangePrompt && (
              <div className="model-change-prompt">
                <p>Regenerate your guidance using {aiModel === 'openai' ? 'ChatGPT' : 'Gemini'}?</p>
                <div className="model-change-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowModelChangePrompt(false);
                      regenerateAdvice();
                    }}
                    disabled={regenerating}
                  >
                    {regenerating ? 'Regenerating...' : 'Yes, regenerate'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowModelChangePrompt(false);
                      setAiModel(originalModel);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Advice sections */}
            <div className="advice-sections">
              {regenerating ? (
                <div className="regenerating-state">
                  <div className="waiting-spinner"></div>
                  <p>Regenerating with {aiModel === 'openai' ? 'ChatGPT' : 'Gemini'}...</p>
                </div>
              ) : (
                adviceSections.map((section, index) => (
                  <AdviceSection
                    key={index}
                    icon={section.icon}
                    title={section.title}
                    content={section.content}
                    defaultExpanded={index === 0}
                  />
                ))
              )}
            </div>

            {/* Private chat toggle */}
            <div className="chat-section">
              <button
                type="button"
                className="chat-toggle"
                onClick={() => setShowChat(!showChat)}
              >
                <span>💬</span>
                <span>Private chat with the AI</span>
                <span className="chat-toggle-arrow">{showChat ? '▲' : '▼'}</span>
              </button>

              {showChat && (
                <div className="chat-container">
                  {chatMessages.length > 0 && (
                    <div className="chat-messages">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role}`}>
                          <div className="chat-message-label">
                            {msg.role === 'user' ? 'You' : 'Coach'}
                          </div>
                          <div className="chat-message-content">{msg.content}</div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="chat-message assistant">
                          <div className="chat-message-label">Coach</div>
                          <div className="chat-message-content thinking">Thinking...</div>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={sendChatMessage} className="chat-form">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a follow-up question..."
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
          </div>

          {/* RIGHT COLUMN — Next Step */}
          <div className="next-step-column">
            {/* Questions from Partner */}
            {partnerQuestions.length > 0 && (
              <div className="partner-question-card">
                <h2>Question from {partnerName || 'Your Partner'}</h2>
                {partnerQuestions.map((q) => (
                  <div key={q.id} className="partner-question-item">
                    <p className="partner-question-text">"{q.question_text}"</p>
                    <span className="partner-question-time">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="next-step-card">
              <h2>Your Next Step Together</h2>
              <p className="next-step-subtitle">A follow-up prompt for you both to answer</p>

              {/* Show pending question that needs my answer */}
              {pendingQuestion ? (
                <div className="next-step-content">
                  <div className="suggested-prompt pending">
                    <span className="prompt-badge">Question {pendingQuestion.question_number}</span>
                    <p className="prompt-text">"{pendingQuestion.question_text}"</p>
                  </div>
                  <div className="pending-answer-form">
                    <textarea
                      value={activeFollowupId === pendingQuestion.id ? followupAnswer : ''}
                      onChange={(e) => {
                        setActiveFollowupId(pendingQuestion.id);
                        setFollowupAnswer(e.target.value);
                      }}
                      onFocus={() => setActiveFollowupId(pendingQuestion.id)}
                      placeholder="Share your thoughts..."
                      rows={4}
                    />
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => submitFollowupAnswer(pendingQuestion.id)}
                      disabled={submittingAnswer || !followupAnswer.trim() || activeFollowupId !== pendingQuestion.id}
                    >
                      {submittingAnswer ? 'Submitting...' : 'Submit Your Answer'}
                    </button>
                  </div>
                </div>
              ) : generatingQuestion ? (
                <div className="next-step-content">
                  <div className="generating-state">
                    <div className="waiting-spinner small"></div>
                    <p>Finding a meaningful question for you both...</p>
                  </div>
                </div>
              ) : suggestedQuestion && canCreateMore ? (
                <div className="next-step-content">
                  <div className="suggested-prompt">
                    <p className="prompt-text">"{suggestedQuestion}"</p>
                  </div>

                  <button
                    className="btn btn-primary btn-block"
                    onClick={acceptSuggestedQuestion}
                    disabled={creatingQuestion}
                  >
                    {creatingQuestion ? 'Creating...' : 'Use this prompt for both of you'}
                  </button>

                  {!showCustomInput ? (
                    <div className="next-step-alt-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowCustomInput(true)}
                      >
                        Write your own prompt
                      </button>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={generateSuggestedQuestion}
                        disabled={generatingQuestion}
                      >
                        Suggest another
                      </button>
                    </div>
                  ) : (
                    <div className="custom-prompt-form">
                      <label>Your custom prompt for both of you:</label>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Enter a question for both partners to answer..."
                        rows={3}
                      />
                      <div className="custom-prompt-actions">
                        <button
                          className="btn btn-primary"
                          onClick={submitCustomQuestion}
                          disabled={creatingQuestion || !customQuestion.trim()}
                        >
                          {creatingQuestion ? 'Creating...' : 'Use our prompt'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomQuestion('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !canCreateMore ? (
                <div className="next-step-content">
                  <p className="max-reached">You've completed all 10 follow-up questions for this session.</p>
                </div>
              ) : null}
            </div>

            {/* Previous followups */}
            {followups.length > 0 && (
              <div className="previous-followups">
                <h3>Previous Questions</h3>
                {followups.map((followup) => {
                  const myAnswer = partner === 'A' ? followup.partner_a_answer : followup.partner_b_answer;
                  const theirAnswer = partner === 'A' ? followup.partner_b_answer : followup.partner_a_answer;
                  const isComplete = myAnswer && theirAnswer && followup.ai_response;
                  const waitingForPartner = myAnswer && !theirAnswer;

                  // Skip the pending question - it's shown above
                  if (!myAnswer) return null;

                  return (
                    <div key={followup.id} className="followup-item">
                      <div className="followup-header">
                        <span className="followup-number">Q{followup.question_number}</span>
                        {waitingForPartner && (
                          <span className="followup-status waiting">Waiting for {partnerName}</span>
                        )}
                        {isComplete && (
                          <span className="followup-status complete">Complete</span>
                        )}
                      </div>
                      <p className="followup-question">{followup.question_text}</p>

                      {isComplete && (
                        <details className="followup-details">
                          <summary>View responses & insights</summary>
                          <div className="followup-responses">
                            <div className="response-block yours">
                              <strong>Your answer:</strong>
                              <p>{myAnswer}</p>
                            </div>
                            <div className="response-block theirs">
                              <strong>{partnerName}'s answer:</strong>
                              <p>{theirAnswer}</p>
                            </div>
                            <div className="response-block ai">
                              <strong>AI Insights:</strong>
                              <p>{followup.ai_response}</p>
                            </div>
                          </div>
                        </details>
                      )}

                      {waitingForPartner && (
                        <div className="response-block yours solo">
                          <strong>Your answer:</strong>
                          <p>{myAnswer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ask Your Partner a Question */}
            <div className="ask-partner-card">
              <h3>Ask {partnerName || 'Your Partner'} a Question</h3>
              <p className="ask-partner-subtitle">Send a question directly to your partner</p>
              <div className="ask-partner-form">
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What would you like to ask your partner?"
                  rows={3}
                />
                <button
                  className="btn btn-primary btn-block"
                  onClick={sendPartnerQuestion}
                  disabled={sendingQuestion || !newQuestion.trim()}
                >
                  {sendingQuestion ? 'Sending...' : 'Send Question'}
                </button>
              </div>

              {/* Sent questions */}
              {sentQuestions.length > 0 && (
                <div className="sent-questions">
                  <h4>Questions You've Sent</h4>
                  {sentQuestions.map((q) => (
                    <div key={q.id} className="sent-question-item">
                      <p>"{q.question_text}"</p>
                      <span className="sent-question-time">
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <footer className="guidance-footer">
          {/* Calm disclaimer */}
          <div className="info-callout guidance-disclaimer">
            <div className="info-callout-title">
              <span className="info-callout-icon">ℹ️</span>
              <span>This is guidance, not therapy</span>
            </div>
            <p>For educational purposes only. We encourage working with a licensed therapist for the best support.</p>
          </div>

          <div className="footer-actions">
            <button
              className="btn btn-secondary"
              onClick={regenerateAdvice}
              disabled={regenerating}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Advice'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/')}
            >
              Start a New Session
            </button>
          </div>

          <div className="crisis-resources-compact">
            <p>
              <strong>Need support?</strong>{' '}
              <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer">
                Find a Therapist
              </a>
              {' '} • {' '}
              <span>Crisis Line: <strong>988</strong></span>
              {' '} • {' '}
              <span>Text HOME to <strong>741741</strong></span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Results;
