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

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="landing-container">
          <div className="hero-grid">
            {/* Left Column - Content */}
            <div className="hero-content">
              <h1>Repair Coach</h1>
              <p className="hero-subheadline">AI Coaching for the couple</p>

              <p className="hero-description">
                A supportive space for couples to strengthen their relationship.
                Answer a few questions independently, then receive personalized
                guidance for your journey forward.
              </p>

              <ul className="hero-benefits">
                <li>Each partner answers privately — no peeking</li>
                <li>AI analyzes both perspectives together</li>
                <li>Receive personalized, actionable guidance</li>
              </ul>

              {error && <div className="error-message">{error}</div>}

              <div className="hero-ctas">
                <button
                  className="btn btn-primary"
                  onClick={() => createSession()}
                  disabled={loading}
                >
                  {loading ? 'Creating Session...' : 'Get Started'}
                </button>
                <a
                  href="#how-it-works"
                  className="btn btn-secondary"
                  onClick={scrollToHowItWorks}
                >
                  See how it works
                </a>
              </div>

              <div className="trust-cues">
                <div className="trust-cue">
                  <span className="trust-cue-icon">⏱️</span>
                  <span>2–10 minutes</span>
                </div>
                <div className="trust-cue">
                  <span className="trust-cue-icon">🔒</span>
                  <span>Private by default</span>
                </div>
                <div className="trust-cue">
                  <span className="trust-cue-icon">💡</span>
                  <span>Guidance, not therapy</span>
                </div>
              </div>
            </div>

            {/* Right Column - How It Works Card */}
            <div className="how-it-works-card" id="how-it-works">
              <h3>How it works</h3>
              <div className="how-it-works-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Start a session</h4>
                    <p>One partner creates a session and shares the link with the other.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Answer independently</h4>
                    <p>Each partner answers questions privately. Your responses stay separate.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Get personalized guidance</h4>
                    <p>AI analyzes both perspectives and provides tailored advice for each of you.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>Choose a focus</h2>
            <p>Select the area where you'd like guidance</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="category-card">
                <div className="category-icon">{cat.icon}</div>
                <div className="category-text">
                  <div className="category-name">{cat.name}</div>
                  <p className="category-description">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Returning Couple & Disclaimer Section */}
      <section className="landing-section">
        <div className="landing-container">
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            {/* Returning Couple */}
            <div className="returning-section">
              <div style={{ textAlign: 'center' }}>
                <button
                  className="returning-toggle"
                  onClick={() => setShowReturning(!showReturning)}
                >
                  {showReturning ? 'Hide' : 'Returning couple? Enter your code'}
                </button>
              </div>

              {showReturning && (
                <div className="returning-content">
                  <p className="returning-description">
                    Enter your couple code to continue your journey or start a new session linked to your history.
                  </p>

                  <div className="code-input-group">
                    <input
                      type="text"
                      value={coupleCode}
                      onChange={(e) => {
                        setCoupleCode(e.target.value.toUpperCase());
                        setCoupleData(null);
                      }}
                      placeholder="Enter code (e.g., ABC123)"
                      maxLength={6}
                      className="code-input"
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
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                        Welcome back{coupleData.partnerAName ? `, ${coupleData.partnerAName}` : ''}
                        {coupleData.partnerBName ? ` & ${coupleData.partnerBName}` : ''}!
                      </p>

                      {coupleData.sessions.length > 0 && (
                        <div>
                          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                            Previous sessions: {coupleData.sessions.length}
                          </p>
                          <div className="sessions-list">
                            {coupleData.sessions.slice(0, 5).map((session) => (
                              <div key={session.id} className="session-item">
                                <div className="session-item-header">
                                  <span>{session.category || 'Session'}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {new Date(session.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {session.partnerACompleted && session.partnerBCompleted && (
                                  <div className="session-item-links">
                                    <a href={`/session/${session.id}/results?p=${session.partnerAToken}`}>
                                      {session.partnerAName || 'Partner A'}'s Results
                                    </a>
                                    <a href={`/session/${session.id}/results?p=${session.partnerBToken}`}>
                                      {session.partnerBName || 'Partner B'}'s Results
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
            </div>

            {/* Disclaimer */}
            <Disclaimer variant="landing" />

            {/* Crisis Resources */}
            <div className="crisis-resources">
              <h4>Crisis Resources</h4>
              <p>If you or someone you know is in crisis, please reach out:</p>
              <p><strong>National Suicide Prevention Lifeline:</strong> 988</p>
              <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
