import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Results() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('p');

  const [partner, setPartner] = useState(null);
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

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    setLoading(false);
  }, [token, navigate]);

  const verifyPin = async () => {
    if (!pinInput || !/^\d{4,6}$/.test(pinInput)) {
      setPinError('Please enter your 4-6 digit PIN');
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
          disabled={verifyingPin || !/^\d{4,6}$/.test(pinInput)}
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
          <h2>Generating Your Guidance</h2>
          <p>
            Please wait while we prepare personalized advice based on both
            partners&apos; responses...
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
          Try a different AI coach:
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
