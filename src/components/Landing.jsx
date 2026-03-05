import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from './Disclaimer';
import { categories } from '../questions';
import { trackPageView, trackClick } from '../analytics';
import { PAYMENTS_ENABLED } from '../config';

function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReturning, setShowReturning] = useState(false);
  const [coupleCode, setCoupleCode] = useState('');
  const [coupleData, setCoupleData] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView('landing');
  }, []);

  const createSessionWithEmail = async (existingCoupleCode = null) => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, create or get user account
      const authResponse = await fetch('/api/auth/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!authResponse.ok) {
        const data = await authResponse.json();
        throw new Error(data.error || 'Failed to create account');
      }

      const { userId } = await authResponse.json();

      // Store user info locally
      localStorage.setItem('auth_user', JSON.stringify({
        userId,
        email: email.trim().toLowerCase(),
        couples: [],
      }));

      // Now create the session
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
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
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="landing-container">
          <div className="hero-grid">
            {/* Left Column - Content */}
            <div className="hero-content">
              <h1>Repair Coach</h1>
              <p className="hero-subheadline">AI Coaching for Couples</p>

              <p className="hero-description">
                A supportive space for couples to strengthen their relationship.
                Answer questions independently, then receive personalized
                guidance for strengthening your relationship.
              </p>

              <ul className="hero-benefits">
                <li>Each partner answers privately</li>
                <li>AI analyzes both perspectives together</li>
                <li>Receive personalized, actionable guidance</li>
                {PAYMENTS_ENABLED && <li>Free 24-hour trial, then $5/month, cancel anytime</li>}
              </ul>

              {error && <div className="error-message">{error}</div>}

              {!showEmailForm ? (
                <div className="hero-ctas">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      trackClick('new_users_get_started');
                      setShowEmailForm(true);
                    }}
                    disabled={loading}
                  >
                    Get Started
                  </button>
                </div>
              ) : (
                <div className="hero-email-form">
                  <p className="hero-email-label">Enter your email to create an account</p>
                  <div className="hero-email-input-group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="hero-email-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          createSessionWithEmail();
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => createSessionWithEmail()}
                      disabled={loading || !email.trim()}
                    >
                      {loading ? 'Creating...' : 'Continue'}
                    </button>
                  </div>
                  <p className="hero-email-note">
                    You can sign in anytime with this email. No password needed.
                  </p>
                </div>
              )}

              <div className="returning-options">
                <button
                  className="returning-link"
                  onClick={() => {
                    trackClick('returning_users_enter_code');
                    setShowReturning(true);
                    setTimeout(() => {
                      document.getElementById('returning-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Returning user? Enter your code
                </button>
                <span className="returning-divider">or</span>
                <button
                  className="returning-link"
                  onClick={() => {
                    trackClick('sign_in_link');
                    navigate('/login');
                  }}
                >
                  Sign in with email
                </button>
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
                <div className="step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Continue the conversation</h4>
                    <p>Ask follow-up questions and go deeper with your partner with follow-up prompts.</p>
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
            <h2>Multiple areas of focus</h2>
            <p>RepairCoach helps with various types of relationship issues</p>
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

      {/* Journaling Section */}
      <section className="landing-section journal-promo-section">
        <div className="landing-container">
          <div className="journal-promo-card">
            <div className="journal-promo-icon">📓</div>
            <div className="journal-promo-content">
              <h3>Side-by-Side Journaling</h3>
              <p>
                Keep private journals about your relationship. Once either partner has written 200+ words,
                the AI gains insight into both perspectives and starts providing personalized coaching.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  trackClick('start_journaling_together');
                  navigate('/journal/start');
                }}
              >
                Start Journaling Together
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Returning Couple & Disclaimer Section */}
      <section className="landing-section">
        <div className="landing-container">
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            {/* Returning Couple */}
            {showReturning && (
              <div id="returning-section" className="returning-section returning-section-expanded">
                <div className="returning-header">
                  <h3>Welcome Back</h3>
                  <button
                    type="button"
                    className="returning-close"
                    onClick={() => setShowReturning(false)}
                  >
                    ✕
                  </button>
                </div>
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
                      placeholder="Enter code (e.g., ABCD1234)"
                      maxLength={8}
                      className="code-input"
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={lookupCouple}
                      disabled={lookingUp || coupleCode.trim().length < 8}
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
              </div>
            )}

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
