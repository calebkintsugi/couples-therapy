import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Results() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partner = searchParams.get('partner') || 'A';

  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/advice/${partner}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.partnerACompleted === false || data.partnerBCompleted === false) {
            navigate(`/session/${sessionId}/waiting?partner=${partner}`);
            return;
          }
          throw new Error(data.error || 'Failed to load advice');
        }

        setAdvice(data.advice);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [sessionId, partner, navigate]);

  const regenerateAdvice = async () => {
    setRegenerating(true);
    setError('');
    setChatMessages([]); // Clear chat on regenerate
    try {
      const response = await fetch(`/api/sessions/${sessionId}/advice/${partner}?regenerate=true`);
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
      const response = await fetch(`/api/sessions/${sessionId}/chat/${partner}`, {
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

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
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
