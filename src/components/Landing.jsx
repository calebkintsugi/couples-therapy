import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from './Disclaimer';
import { categories } from '../questions';

function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReturning, setShowReturning] = useState(false);
  const [coupleCode, setCoupleCode] = useState('');
  const [coupleData, setCoupleData] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const navigate = useNavigate();

  const createSession = async (existingCoupleCode = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleCode: existingCoupleCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const { sessionId, partnerAToken } = await response.json();
      navigate(`/session/${sessionId}?p=${partnerAToken}`);
    } catch (err) {
      setError(err.message || 'Failed to create session. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lookupCouple = async () => {
    if (!coupleCode.trim()) return;

    setLookingUp(true);
    setError('');

    try {
      const response = await fetch(`/api/couples/by-code/${coupleCode.trim().toUpperCase()}`);

      if (!response.ok) {
        throw new Error('Couple code not found');
      }

      const data = await response.json();
      setCoupleData(data);
    } catch (err) {
      setError(err.message || 'Failed to look up couple code.');
      setCoupleData(null);
    } finally {
      setLookingUp(false);
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
          onClick={() => createSession()}
          disabled={loading}
        >
          {loading ? 'Creating Session...' : 'Get Started'}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => setShowReturning(!showReturning)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline',
            }}
          >
            {showReturning ? 'Hide' : 'Returning couple? Enter your code'}
          </button>
        </div>

        {showReturning && (
          <div style={{
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'var(--background)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Enter your couple code to continue your journey or start a new session linked to your history.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={coupleCode}
                onChange={(e) => {
                  setCoupleCode(e.target.value.toUpperCase());
                  setCoupleData(null);
                }}
                placeholder="Enter code (e.g., ABC123)"
                maxLength={6}
                style={{
                  flex: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '600',
                }}
              />
              <button
                className="btn btn-secondary"
                onClick={lookupCouple}
                disabled={lookingUp || coupleCode.trim().length < 6}
              >
                {lookingUp ? '...' : 'Look Up'}
              </button>
            </div>

            {coupleData && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  Welcome back{coupleData.partnerAName ? `, ${coupleData.partnerAName}` : ''}
                  {coupleData.partnerBName ? ` & ${coupleData.partnerBName}` : ''}!
                </p>

                {coupleData.sessions.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Previous sessions: {coupleData.sessions.length}
                    </p>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {coupleData.sessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          style={{
                            padding: '0.5rem',
                            background: 'var(--surface)',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{session.category || 'Session'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {session.partnerACompleted && session.partnerBCompleted && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <a
                                href={`/session/${session.id}/results?p=${session.partnerAToken}`}
                                style={{ color: 'var(--primary)', fontSize: '0.8rem', marginRight: '1rem' }}
                              >
                                {session.partnerAName || 'Partner A'}&apos;s Results
                              </a>
                              <a
                                href={`/session/${session.id}/results?p=${session.partnerBToken}`}
                                style={{ color: 'var(--primary)', fontSize: '0.8rem' }}
                              >
                                {session.partnerBName || 'Partner B'}&apos;s Results
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary btn-block"
                  onClick={() => createSession(coupleData.code)}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Start New Session'}
                </button>
              </div>
            )}
          </div>
        )}

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
