import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ScaleQuestion from './ScaleQuestion';
import TextQuestion from './TextQuestion';
import Disclaimer from './Disclaimer';
import CrisisModal from './CrisisModal';
import { categories, questionsByCategory, shortIntakeQuestions, getCategoryById } from '../questions';
import { trackPageView, trackClick, trackSubmit } from '../analytics';
import { detectCrisisInMultiple } from '../utils/crisisDetection';

function Questionnaire() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('p');
  const paymentSuccess = searchParams.get('success') === 'true';
  const [partner, setPartner] = useState(null);
  const [partnerBToken, setPartnerBToken] = useState(null);
  const [coupleCode, setCoupleCode] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showTrialStarted, setShowTrialStarted] = useState(paymentSuccess);

  // Flow state for Partner A: 'setup' -> 'share' -> 'questions'
  // Flow state for Partner B: 'name' -> 'category-display' -> 'role-display' (if infidelity) -> 'questions'
  const [step, setStep] = useState('loading');
  const [category, setCategory] = useState(null);
  const [intakeType, setIntakeType] = useState('long');
  const [role, setRole] = useState(null); // 'betrayed' or 'unfaithful' (only for infidelity)
  const [sessionData, setSessionData] = useState(null);
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  // Setup form state (for Partner A combined screen)
  const [setupCategory, setSetupCategory] = useState(null);
  const [setupIntakeType, setSetupIntakeType] = useState('long');
  const [setupRole, setSetupRole] = useState(null);
  const [pin, setPin] = useState('');
  const [aiModel, setAiModel] = useState('gemini');

  // Crisis detection state
  const [crisisModal, setCrisisModal] = useState({ show: false, type: null });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Email save state (for magic link auth)
  const [saveEmail, setSaveEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Get questions based on category and intake type
  const getQuestions = () => {
    if (intakeType === 'short') {
      return shortIntakeQuestions;
    }
    return category ? questionsByCategory[category] : null;
  };

  const categoryQuestions = getQuestions();
  const scaleQuestions = categoryQuestions?.scale || [];
  const textQuestions = categoryQuestions?.text || [];
  const allQuestions = [...scaleQuestions, ...textQuestions];
  const totalQuestions = allQuestions.length;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  const currentQ = allQuestions[currentQuestion];
  const isScale = currentQuestion < scaleQuestions.length;

  const partnerBLink = partnerBToken ? `${window.location.origin}/session/${sessionId}?p=${partnerBToken}` : '';

  // Auto-dismiss trial started message and clean up URL
  useEffect(() => {
    if (paymentSuccess) {
      // Clean up URL params
      window.history.replaceState({}, '', `${window.location.pathname}?p=${token}`);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShowTrialStarted(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, token]);

  // Start Stripe checkout
  const startCheckout = async () => {
    if (!coupleCode) return;

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleCode: coupleCode,
          returnUrl: `${window.location.origin}/session/${sessionId}?p=${token}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    }
  };

  // Open Stripe Customer Portal
  const openCustomerPortal = async () => {
    if (!coupleCode) {
      alert('No subscription found. Complete payment first.');
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/portal/${coupleCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          alert('No active subscription found. You may need to complete payment first.');
        } else {
          alert(data.error || 'Failed to open account settings');
        }
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      alert('Failed to open subscription settings. Please try again.');
    }
  };

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode.trim() || !coupleCode) return;
    setApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          coupleCode: coupleCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid promo code');
      }

      setPromoSuccess(data.message);
      // Promo applied - proceed to share step after short delay
      setTimeout(() => {
        setShowPaymentModal(false);
        setStep('share');
      }, 1500);
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setApplyingPromo(false);
    }
  };

  // Save email for easy sign-in
  const handleSaveEmail = async () => {
    if (!saveEmail.trim() || !coupleCode) return;
    if (!saveEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSavingEmail(true);
    setEmailError('');

    try {
      // Send magic link with couple code - linking happens on the server
      const response = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: saveEmail.trim(),
          coupleCode: coupleCode,
          partner: partner,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save email');
      }

      setEmailSaved(true);
    } catch (err) {
      setEmailError(err.message || 'Failed to save email');
    } finally {
      setSavingEmail(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    trackPageView('questionnaire');

    // Fetch session data using token
    fetch(`/api/sessions/${sessionId}/by-token/${token}`)
      .then((res) => {
        if (!res.ok) {
          navigate('/');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setSessionData(data);
        setPartner(data.partner);
        if (data.partnerBToken) {
          setPartnerBToken(data.partnerBToken);
        }
        if (data.coupleCode) {
          setCoupleCode(data.coupleCode);
        }

        if (data.category) {
          setCategory(data.category);
          setSetupCategory(data.category);
        }
        if (data.intakeType) {
          setIntakeType(data.intakeType);
          setSetupIntakeType(data.intakeType);
        }

        if (data.partner === 'A') {
          // Partner A flow
          if (data.partnerAName && data.category) {
            setName(data.partnerAName);
            if (data.category === 'infidelity' && data.unfaithfulPartner) {
              setRole(data.unfaithfulPartner === 'A' ? 'unfaithful' : 'betrayed');
            }
            setStep('share');
          } else {
            setStep('setup');
          }
        } else {
          // Partner B flow
          setPartnerName(data.partnerAName || 'Your partner');
          if (data.partnerBName) {
            setName(data.partnerBName);
            if (data.category === 'infidelity' && data.unfaithfulPartner) {
              setRole(data.unfaithfulPartner === 'B' ? 'unfaithful' : 'betrayed');
              setStep('role-display');
            } else if (data.category) {
              setStep('category-display');
            } else {
              setStep('questions');
            }
          } else {
            setStep('name');
          }
        }
      })
      .catch(() => navigate('/'));
  }, [sessionId, token, navigate]);

  const handleSetupSubmit = async () => {
    if (!name.trim() || !setupCategory || !setupIntakeType) return;
    if (setupCategory === 'infidelity' && !setupRole) return;
    if (!pin || !/^\d{6}$/.test(pin)) {
      setError('Please enter a 6 digit PIN');
      return;
    }

    trackClick('category_selected', { category: setupCategory, intakeType: setupIntakeType });
    setError('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/setup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: setupCategory,
          intakeType: setupIntakeType,
          unfaithfulPartner: setupCategory === 'infidelity' ? (setupRole === 'unfaithful' ? 'A' : 'B') : null,
          aiModel: aiModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save setup');
      }

      // Save PIN
      await fetch(`/api/sessions/${sessionId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });

      setCategory(setupCategory);
      setIntakeType(setupIntakeType);
      if (setupCategory === 'infidelity') {
        setRole(setupRole);
      }
      // Show payment modal after setup
      setShowPaymentModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim()) return;
    if (!pin || !/^\d{6}$/.test(pin)) {
      setError('Please enter a 6 digit PIN');
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner, name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to save name');
      }

      // Save PIN
      await fetch(`/api/sessions/${sessionId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });

      // Partner B flow
      if (sessionData?.category) {
        if (sessionData.category === 'infidelity' && sessionData.unfaithfulPartner) {
          setRole(sessionData.unfaithfulPartner === 'B' ? 'unfaithful' : 'betrayed');
          setStep('role-display');
        } else {
          setStep('category-display');
        }
      } else {
        setStep('questions');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: value,
    }));
  };

  const canProceed = () => {
    const answer = answers[currentQ.id];
    if (isScale) {
      return answer !== undefined;
    }
    return answer && answer.trim().length > 0;
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async (bypassCrisisCheck = false) => {
    // Check for crisis indicators in text answers
    if (!bypassCrisisCheck) {
      const textAnswers = Object.entries(answers)
        .filter(([key]) => textQuestions.some(q => q.id === key))
        .map(([, value]) => String(value));

      const crisis = detectCrisisInMultiple(textAnswers);
      if (crisis.detected) {
        setCrisisModal({ show: true, type: crisis.type });
        return;
      }
    }

    trackSubmit('questionnaire', { category, intakeType, partner });
    setSubmitting(true);
    setError('');

    const responses = allQuestions.map((q, index) => ({
      questionId: q.id,
      type: index < scaleQuestions.length ? 'scale' : 'text',
      answer: String(answers[q.id]),
    }));

    try {
      const response = await fetch(`/api/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner, responses }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit responses');
      }

      if (data.bothCompleted) {
        navigate(`/session/${sessionId}/results?p=${token}`);
      } else {
        navigate(`/session/${sessionId}/waiting?p=${token}`);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(partnerBLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

  // Calculate setup progress
  const getSetupProgress = () => {
    let completed = 0;
    if (name.trim()) completed++;
    if (setupCategory) completed++;
    if (setupCategory !== 'infidelity' || setupRole) completed++;
    if (setupIntakeType) completed++;
    if (/^\d{6}$/.test(pin)) completed++;
    return completed;
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="setup-loading">
            <div className="waiting-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Partner A: Combined setup screen
  if (step === 'setup') {
    const canSubmitSetup = name.trim() && setupCategory && setupIntakeType &&
      (setupCategory !== 'infidelity' || setupRole) && /^\d{6}$/.test(pin);

    const setupProgress = getSetupProgress();
    const totalSteps = setupCategory === 'infidelity' ? 5 : 4;

    return (
      <div className="setup-page">
        {/* Trial Started Banner */}
        {showTrialStarted && (
          <div className="trial-started-banner">
            <span className="trial-started-icon">✓</span>
            <span>Your 24-hour free trial has started!</span>
            <button
              className="trial-started-close"
              onClick={() => setShowTrialStarted(false)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <div className="setup-container">
          {/* Header */}
          <header className="setup-header">
            <p className="setup-step-indicator">Step 1 of 2</p>
            <h1>Let's Get Started</h1>
            <p className="setup-subtitle">Answer separately. Receive shared guidance.</p>
            <p className="setup-time">This takes about 5–10 minutes.</p>
          </header>

          {error && <div className="error-message">{error}</div>}

          {/* Section 1: Name */}
          <section className="setup-section">
            <div className="setup-card">
              <label className="setup-label">What should we call you?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name or nickname"
                className="setup-input"
              />
            </div>
          </section>

          {/* Section 2: Category */}
          <section className="setup-section setup-section-focus">
            <label className="setup-label">What issue in the relationship would you like to work on?</label>
            <p className="setup-helper">Choose the area you'd like to focus on.</p>
            <div className="setup-category-grid">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSetupCategory(cat.id);
                    if (cat.id !== 'infidelity') {
                      setSetupRole(null);
                    }
                  }}
                  className={`setup-category-card ${setupCategory === cat.id ? 'selected' : ''}`}
                >
                  <span className="setup-category-icon">{cat.icon}</span>
                  <div className="setup-category-text">
                    <strong>{cat.name}</strong>
                    <span>{cat.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Section 2b: Role (only for infidelity) */}
          {setupCategory === 'infidelity' && (
            <section className="setup-section">
              <div className="setup-card">
                <label className="setup-label">Which role applies to you?</label>
                <p className="setup-helper">This helps us personalize your guidance.</p>
                <div className="setup-role-grid">
                  <button
                    type="button"
                    onClick={() => setSetupRole('betrayed')}
                    className={`setup-role-card ${setupRole === 'betrayed' ? 'selected' : ''}`}
                  >
                    I am the <strong>betrayed</strong> partner
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupRole('unfaithful')}
                    className={`setup-role-card ${setupRole === 'unfaithful' ? 'selected' : ''}`}
                  >
                    I am the <strong>unfaithful</strong> partner
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Intake Type */}
          <section className="setup-section">
            <label className="setup-label">How much depth would you like?</label>
            <p className="setup-helper">Most couples choose the full assessment for deeper insight. The more you share in your responses, the more personalized your guidance will be.</p>
            <div className="setup-depth-grid">
              <button
                type="button"
                onClick={() => setSetupIntakeType('short')}
                className={`setup-depth-card ${setupIntakeType === 'short' ? 'selected' : ''}`}
              >
                <strong>Quick Check-In</strong>
                <span>3 questions · ~2 minutes</span>
              </button>
              <button
                type="button"
                onClick={() => setSetupIntakeType('long')}
                className={`setup-depth-card ${setupIntakeType === 'long' ? 'selected' : ''}`}
              >
                <span className="setup-badge">Recommended</span>
                <strong>Full Assessment</strong>
                <span>10 questions · ~5–10 minutes</span>
              </button>
            </div>
          </section>

          {/* Section 4: PIN */}
          <section className="setup-section">
            <div className="setup-card setup-card-pin">
              <div className="setup-pin-header">
                <span className="setup-pin-icon">🔒</span>
                <label className="setup-label">Protect Your Results</label>
              </div>
              <p className="setup-helper">
                Your guidance may include sensitive reflections. Set a 6-digit PIN that only you will know.
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN"
                className="setup-pin-input"
              />
            </div>
          </section>

          {/* CTA */}
          <section className="setup-cta">
            <button
              className={`btn btn-primary btn-large btn-block ${!canSubmitSetup ? 'btn-disabled' : ''}`}
              onClick={handleSetupSubmit}
              disabled={!canSubmitSetup}
            >
              Start My Session
            </button>
            <p className="setup-cta-helper">You can change these choices later.</p>
          </section>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2>Start Your Free Trial</h2>
              <p className="pricing-modal-subtitle">
                Try RepairCoach free for 24 hours. Cancel anytime.
              </p>

              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  <span>Personalized guidance for both partners</span>
                </div>
                <div className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  <span>Private AI chat for follow-up questions</span>
                </div>
                <div className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  <span>Couple insights and exercises</span>
                </div>
                <div className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  <span>Cancel anytime — no questions asked</span>
                </div>
              </div>

              <div className="pricing-trial-box">
                <div className="pricing-trial-header">24-Hour Free Trial</div>
                <div className="pricing-price">
                  <span className="pricing-amount">$5</span>
                  <span className="pricing-period">/month after trial</span>
                </div>
                <p className="pricing-trial-note">You won't be charged today</p>
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={startCheckout}
              >
                Start Free Trial
              </button>

              <div className="promo-section">
                <p className="promo-label">Have a promo code?</p>
                <div className="promo-input-group">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="promo-input"
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={applyPromoCode}
                    disabled={applyingPromo || !promoCode.trim()}
                  >
                    {applyingPromo ? '...' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="promo-error">{promoError}</p>}
                {promoSuccess && <p className="promo-success">{promoSuccess}</p>}
              </div>

              <p className="pricing-disclaimer">
                Secure payment via Stripe. Cancel anytime in your account settings.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Partner B: Name input
  if (step === 'name') {
    const canSubmitName = name.trim() && /^\d{6}$/.test(pin);
    return (
      <div className="setup-page">
        <div className="setup-container">
          <header className="setup-header">
            <h1>Welcome</h1>
            <p className="setup-subtitle">
              {partnerName} has invited you to complete this questionnaire together.
            </p>
          </header>

          {error && <div className="error-message">{error}</div>}

          {coupleCode && (
            <section className="setup-section">
              <div className="setup-card setup-card-code">
                <p className="setup-code-label">⚠️ Save This Code</p>
                <code className="setup-code-value">{coupleCode}</code>
                <p className="setup-code-helper">You'll need this to return to your results.</p>
                <div className="setup-code-actions">
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
            </section>
          )}

          <section className="setup-section">
            <div className="setup-card">
              <label className="setup-label">What should we call you?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name or nickname"
                className="setup-input"
              />
            </div>
          </section>

          <section className="setup-section">
            <div className="setup-card setup-card-pin">
              <div className="setup-pin-header">
                <span className="setup-pin-icon">🔒</span>
                <label className="setup-label">Protect Your Results</label>
              </div>
              <p className="setup-helper">
                Your guidance may include sensitive reflections. Set a 6-digit PIN that only you will know.
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN"
                className="setup-pin-input"
              />
            </div>
          </section>

          <section className="setup-cta">
            <button
              className={`btn btn-primary btn-large btn-block ${!canSubmitName ? 'btn-disabled' : ''}`}
              onClick={handleNameSubmit}
              disabled={!canSubmitName}
            >
              Continue
            </button>
          </section>
        </div>
      </div>
    );
  }

  // Partner B: Category display
  if (step === 'category-display') {
    const categoryInfo = getCategoryById(category);
    const intakeLabel = intakeType === 'short' ? 'Quick Check-In (3 questions)' : 'Full Assessment (10 questions)';
    return (
      <div className="setup-page">
        <div className="setup-container">
          <header className="setup-header">
            <h1>Hi, {name}</h1>
            <p className="setup-subtitle">{partnerName} has selected a focus area for your session.</p>
          </header>

          <section className="setup-section">
            <div className="setup-card setup-card-display">
              <span className="setup-display-icon">{categoryInfo?.icon}</span>
              <div className="setup-display-text">
                <strong>{categoryInfo?.name}</strong>
                <span>{categoryInfo?.description}</span>
              </div>
            </div>
            <p className="setup-format-label">Format: {intakeLabel}</p>
          </section>

          <section className="setup-cta">
            <button className="btn btn-primary btn-large btn-block" onClick={() => setStep('questions')}>
              Continue to Questionnaire
            </button>
          </section>
        </div>
      </div>
    );
  }

  // Partner A: Share link
  if (step === 'share') {
    const categoryInfo = getCategoryById(category);
    const intakeLabel = intakeType === 'short' ? 'Quick Check-In' : 'Full Assessment';
    return (
      <div className="setup-page">
        {/* Trial Started Banner */}
        {showTrialStarted && (
          <div className="trial-started-banner">
            <span className="trial-started-icon">✓</span>
            <span>Your 24-hour free trial has started!</span>
            <button
              className="trial-started-close"
              onClick={() => setShowTrialStarted(false)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <div className="setup-container">
          <header className="setup-header">
            <p className="setup-step-indicator">Step 2 of 2</p>
            <h1>Share With Your Partner</h1>
            <p className="setup-subtitle">
              Now invite your partner to join, {name}.
            </p>
          </header>

          <section className="setup-section">
            <div className="setup-card setup-card-summary">
              <p className="setup-summary-label">Your session setup:</p>
              <div className="setup-summary-items">
                <div className="setup-summary-item">
                  <span>{categoryInfo?.icon}</span>
                  <span>{categoryInfo?.name}</span>
                </div>
                <div className="setup-summary-item">
                  <span>📋</span>
                  <span>{intakeLabel}</span>
                </div>
                {role && (
                  <div className="setup-summary-item">
                    <span>👤</span>
                    <span>{role} partner</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {coupleCode && (
            <section className="setup-section">
              <div className="setup-card setup-card-code">
                <p className="setup-code-label">⚠️ Save Your Access</p>

                {!emailSaved ? (
                  <div className="save-email-section">
                    <p className="setup-code-helper" style={{ marginBottom: '12px' }}>
                      Save your email so you can sign in anytime without remembering codes.
                    </p>
                    <div className="save-email-form">
                      <input
                        type="email"
                        value={saveEmail}
                        onChange={(e) => setSaveEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="save-email-input"
                        disabled={savingEmail}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleSaveEmail}
                        disabled={savingEmail || !saveEmail.trim()}
                      >
                        {savingEmail ? 'Saving...' : 'Save Email'}
                      </button>
                    </div>
                    {emailError && <p className="save-email-error">{emailError}</p>}

                    <div className="save-email-divider">
                      <span>or save your code</span>
                    </div>
                  </div>
                ) : (
                  <div className="save-email-success">
                    <span className="success-icon">✓</span>
                    <span>Check your email for a confirmation link. Once verified, you can sign in anytime at <a href="/login">/login</a>.</span>
                  </div>
                )}

                <code className="setup-code-value">{coupleCode}</code>
                <p className="setup-code-helper">Alternative: save this code to return to your results.</p>
                <div className="setup-code-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={copyCode}>
                    {codeCopied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                  <a
                    href={`mailto:?subject=Your RepairCoach Couple Code&body=Your RepairCoach Couple Code is: ${coupleCode}%0A%0ASave this code to return to your results at https://repaircoach.ai`}
                    className="btn btn-ghost btn-sm"
                  >
                    Email Code to Myself
                  </a>
                </div>
              </div>
            </section>
          )}

          <section className="setup-section">
            <div className="setup-card">
              <label className="setup-label">Share this link with your partner</label>
              <p className="setup-helper">They'll complete their own questionnaire privately.</p>
              <div className="setup-share-link">{partnerBLink}</div>
              <button className="btn btn-secondary" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </section>

          <section className="setup-cta">
            <button className="btn btn-primary btn-large btn-block" onClick={() => setStep('questions')}>
              Continue to My Questionnaire
            </button>
          </section>

          <div className="manage-subscription-link">
            <button type="button" className="link-btn" onClick={openCustomerPortal}>
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Partner B: Role display (only for infidelity)
  if (step === 'role-display') {
    const categoryInfo = getCategoryById(category);
    const intakeLabel = intakeType === 'short' ? 'Quick Check-In (3 questions)' : 'Full Assessment (10 questions)';
    return (
      <div className="setup-page">
        <div className="setup-container">
          <header className="setup-header">
            <h1>Hi, {name}</h1>
            <p className="setup-subtitle">
              {partnerName} has selected <strong>{categoryInfo?.name}</strong> as the focus area.
            </p>
          </header>

          <section className="setup-section">
            <div className="setup-card setup-card-role-display">
              <p>Based on {partnerName}'s response, you are participating as:</p>
              <p className="setup-role-label">The <strong>{role}</strong> partner</p>
            </div>
            <p className="setup-format-label">Format: {intakeLabel}</p>
          </section>

          <section className="setup-cta">
            <button className="btn btn-primary btn-large btn-block" onClick={() => setStep('questions')}>
              Continue to Questionnaire
            </button>
          </section>
        </div>
      </div>
    );
  }

  // Questions
  if (!currentQ) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="setup-loading">
            <div className="waiting-spinner" />
            <p>Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryById(category);

  return (
    <div className="card">
      <h2>{name}&apos;s Questionnaire</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {categoryInfo?.icon} {categoryInfo?.name}
        {intakeType === 'short' && ' (Quick Check-In)'}
      </p>

      {currentQuestion === 0 && <Disclaimer />}

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {error && <div className="error-message">{error}</div>}

      {isScale ? (
        <ScaleQuestion
          question={currentQ}
          value={answers[currentQ.id]}
          onChange={handleAnswer}
          questionNumber={currentQuestion + 1}
          totalQuestions={totalQuestions}
        />
      ) : (
        <TextQuestion
          question={currentQ}
          value={answers[currentQ.id]}
          onChange={handleAnswer}
          questionNumber={currentQuestion + 1}
          totalQuestions={totalQuestions}
        />
      )}

      <div className="nav-buttons">
        {currentQuestion > 0 && (
          <button className="btn btn-secondary" onClick={handleBack}>
            Back
          </button>
        )}

        {currentQuestion < totalQuestions - 1 ? (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit()}
            disabled={!canProceed() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>

      <div className="manage-subscription-link">
        <button type="button" className="link-btn" onClick={openCustomerPortal}>
          Manage Subscription
        </button>
      </div>

      {/* Crisis Modal */}
      {crisisModal.show && (
        <CrisisModal
          type={crisisModal.type}
          onClose={() => setCrisisModal({ show: false, type: null })}
          onContinue={() => {
            setCrisisModal({ show: false, type: null });
            handleSubmit(true);
          }}
        />
      )}
    </div>
  );
}

export default Questionnaire;
