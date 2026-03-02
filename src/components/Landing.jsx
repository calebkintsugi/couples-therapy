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
    <div className="landing-hero">
      <div className="landing-card">
        <h1>Repair Coach</h1>
        <p className="tagline">
          A supportive space for couples to strengthen their relationship.
          Answer a few questions independently, then receive personalized, AI-powered guidance for your journey forward.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: 'var(--background)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{cat.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>


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
