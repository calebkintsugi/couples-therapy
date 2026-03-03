import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPageView } from '../analytics';

function HowItWorks() {
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView('how_it_works');
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="how-it-works-page">
          {/* Header */}
          <div className="how-it-works-header">
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              ← Back to home
            </button>
            <h1>How Repair Coach Works</h1>
            <p className="hero-subheadline">A simple process designed for busy couples</p>
          </div>

          {/* Steps */}
          <div className="steps-section">
            <div className="step-large">
              <div className="step-large-number">1</div>
              <div className="step-large-content">
                <h2>One partner starts a session</h2>
                <p>
                  Click "Get Started" on the home page. You'll choose a focus area for your session
                  (like communication, intimacy, or working through a specific challenge) and create
                  a private link to share with your partner.
                </p>
                <div className="step-details">
                  <div className="step-detail">
                    <span className="step-detail-icon">🔒</span>
                    <span>Each partner gets a unique, private link</span>
                  </div>
                  <div className="step-detail">
                    <span className="step-detail-icon">📱</span>
                    <span>Works on any device — phone, tablet, or computer</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-large">
              <div className="step-large-number">2</div>
              <div className="step-large-content">
                <h2>Both partners answer questions privately</h2>
                <p>
                  Each partner completes a short questionnaire independently. Your answers are kept
                  completely private from your partner — this creates a safe space for honest reflection.
                </p>
                <div className="step-details">
                  <div className="step-detail">
                    <span className="step-detail-icon">⏱️</span>
                    <span>Takes 2–10 minutes depending on the format you choose</span>
                  </div>
                  <div className="step-detail">
                    <span className="step-detail-icon">👁️‍🗨️</span>
                    <span>Your partner cannot see your individual answers</span>
                  </div>
                  <div className="step-detail">
                    <span className="step-detail-icon">🔐</span>
                    <span>PIN-protected results for extra privacy</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-large">
              <div className="step-large-number">3</div>
              <div className="step-large-content">
                <h2>AI analyzes both perspectives</h2>
                <p>
                  Once both partners complete the questionnaire, our AI analyzes both sets of
                  responses together. It looks for patterns, areas of alignment, potential blind spots,
                  and opportunities for growth.
                </p>
                <div className="step-details">
                  <div className="step-detail">
                    <span className="step-detail-icon">🤖</span>
                    <span>Powered by advanced AI (GPT-4 or Gemini — your choice)</span>
                  </div>
                  <div className="step-detail">
                    <span className="step-detail-icon">🎯</span>
                    <span>Personalized insights based on your specific situation</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-large">
              <div className="step-large-number">4</div>
              <div className="step-large-content">
                <h2>Receive personalized guidance</h2>
                <p>
                  Each partner receives their own tailored guidance. The advice acknowledges both
                  perspectives while giving you specific, actionable steps you can take.
                </p>
                <div className="step-details">
                  <div className="step-detail">
                    <span className="step-detail-icon">📋</span>
                    <span>Clear sections: TL;DR, deeper insights, blind spots, and action items</span>
                  </div>
                  <div className="step-detail">
                    <span className="step-detail-icon">💬</span>
                    <span>Follow-up chat to ask questions about your guidance</span>
                  </div>
                  <div className="step-detail">
                    <span className="step-detail-icon">🔄</span>
                    <span>Deeper dive questions you can both answer for continued growth</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What makes us different */}
          <div className="features-section">
            <h2>What makes Repair Coach different</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>Both perspectives matter</h3>
                <p>
                  Unlike individual coaching, we analyze both partners' views together to find
                  the real dynamics at play.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Privacy by design</h3>
                <p>
                  Partners answer separately and can't see each other's responses. This encourages
                  honesty without fear of judgment.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Quick and accessible</h3>
                <p>
                  No scheduling, no waiting rooms. Get guidance when you need it, on your own time.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Continuous journey</h3>
                <p>
                  Your couple code lets you return for new sessions. The AI remembers your history
                  and builds on previous insights.
                </p>
              </div>
            </div>
          </div>

          {/* Important note */}
          <div className="info-callout">
            <div className="info-callout-title">
              <span className="info-callout-icon">ℹ️</span>
              <span>Important: Guidance, not therapy</span>
            </div>
            <div className="info-callout-content" style={{ paddingTop: 'var(--space-sm)' }}>
              <p>
                Repair Coach provides AI-powered relationship guidance for educational purposes.
                We are not licensed therapists. For serious concerns, trauma, or mental health issues,
                please seek help from a licensed professional.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="how-it-works-cta">
            <h2>Ready to get started?</h2>
            <p>It only takes a few minutes to begin your journey.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Start a Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
