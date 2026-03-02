import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ScaleQuestion from './ScaleQuestion';
import TextQuestion from './TextQuestion';
import Disclaimer from './Disclaimer';
import { categories, questionsByCategory, shortIntakeQuestions, getCategoryById } from '../questions';

function Questionnaire() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('p');
  const [partner, setPartner] = useState(null);
  const [partnerBToken, setPartnerBToken] = useState(null);
  const [coupleCode, setCoupleCode] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
  const [aiModel, setAiModel] = useState('openai');

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

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

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
      setStep('share');
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

  const handleSubmit = async () => {
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
            <label className="setup-label">What feels most urgent right now?</label>
            <p className="setup-helper">Choose the area that feels most important to focus on first.</p>
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
            <p className="setup-helper">Most couples choose the full assessment for deeper insight.</p>
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

          {/* Section 4: AI Model */}
          <section className="setup-section">
            <div className="setup-card setup-card-subtle">
              <label className="setup-label-small">AI Model (Advanced)</label>
              <p className="setup-helper-small">You can change later.</p>
              <div className="setup-model-toggle">
                <button
                  type="button"
                  onClick={() => setAiModel('openai')}
                  className={`setup-model-btn ${aiModel === 'openai' ? 'selected' : ''}`}
                >
                  ChatGPT
                </button>
                <button
                  type="button"
                  onClick={() => setAiModel('gemini')}
                  className={`setup-model-btn ${aiModel === 'gemini' ? 'selected' : ''}`}
                >
                  Gemini
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: PIN */}
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
        <div className="setup-container">
          <header className="setup-header">
            <p className="setup-step-indicator">Step 2 of 2</p>
            <h1>Share With Your Partner</h1>
            <p className="setup-subtitle">
              Great choices, {name}. Now invite your partner to join.
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
                <p className="setup-code-label">Your Couple Code</p>
                <code className="setup-code-value">{coupleCode}</code>
                <p className="setup-code-helper">Save this to access your history later</p>
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
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}

export default Questionnaire;
