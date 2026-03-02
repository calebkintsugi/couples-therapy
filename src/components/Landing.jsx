import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from './Disclaimer';
import { categories } from '../questions';

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

      const { sessionId, partnerAToken } = await response.json();
      navigate(`/session/${sessionId}?p=${partnerAToken}`);
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-hero">
      <div className="landing-card">
        <h1>Repair Coach</h1>
        <p className="tagline">
          A supportive space for couples to strengthen their relationship.
          Answer a few questions independently, then receive personalized, AI-powered guidance for your journey forward.
        </p>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          We offer guidance for: {categories.map((cat, index) => (
            <span key={cat.id}>
              <strong>{cat.name}</strong>{index < categories.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>


        {error && <div className="error-message">{error}</div>}

        <button
          className="btn btn-primary btn-block"
          onClick={createSession}
          disabled={loading}
        >
          {loading ? 'Creating Session...' : 'Get Started'}
        </button>

        <Disclaimer />

        <div className="crisis-resources">
          <h4>Crisis Resources</h4>
          <p>
            If you or someone you know is in crisis, please reach out:
          </p>
          <p>
            <strong>National Suicide Prevention Lifeline:</strong> 988
          </p>
          <p>
            <strong>Crisis Text Line:</strong> Text HOME to 741741
          </p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
