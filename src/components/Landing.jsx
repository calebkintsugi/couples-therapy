import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from './Disclaimer';

function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createSession = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const { sessionId } = await response.json();
      navigate(`/session/${sessionId}?partner=A`);
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1>Repair Coach</h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
        A supportive space for couples navigating the path to healing after infidelity.
      </p>

      <Disclaimer />

      <div style={{ marginBottom: '2rem' }}>
        <h3>How It Works</h3>
        <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            Create a new session and share the link with your partner
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Each partner answers a brief questionnaire independently
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Once both complete, receive personalized guidance for your healing journey
          </li>
        </ol>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="btn btn-primary btn-block"
        onClick={createSession}
        disabled={loading}
      >
        {loading ? 'Creating Session...' : 'Start New Session'}
      </button>

      <div className="crisis-resources">
        <h4>Crisis Resources</h4>
        <p>
          If you or someone you know is in crisis, please reach out for help:
        </p>
        <p>
          <strong>National Suicide Prevention Lifeline:</strong> 988 (call or text)
        </p>
        <p>
          <strong>Crisis Text Line:</strong> Text HOME to 741741
        </p>
        <p>
          <strong>National Domestic Violence Hotline:</strong> 1-800-799-7233
        </p>
      </div>
    </div>
  );
}

export default Landing;
