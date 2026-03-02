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

  const partner = searchParams.get('partner') || 'A';
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

  const partnerBLink = `${window.location.origin}/session/${sessionId}?partner=B`;

  useEffect(() => {
    // Fetch session data
    fetch(`/api/sessions/${sessionId}`)
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

        if (data.category) {
          setCategory(data.category);
          setSetupCategory(data.category);
        }
        if (data.intakeType) {
          setIntakeType(data.intakeType);
          setSetupIntakeType(data.intakeType);
        }

        if (partner === 'A') {
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
  }, [sessionId, partner, navigate]);

  const handleSetupSubmit = async () => {
    if (!name.trim() || !setupCategory || !setupIntakeType) return;
    if (setupCategory === 'infidelity' && !setupRole) return;

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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save setup');
      }

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

    try {
      const response = await fetch(`/api/sessions/${sessionId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner, name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to save name');
      }

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
        navigate(`/session/${sessionId}/results?partner=${partner}`);
      } else {
        navigate(`/session/${sessionId}/waiting?partner=${partner}`);
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

  // Loading state
  if (step === 'loading') {
    return (
      <div className="card">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Partner A: Combined setup screen
  if (step === 'setup') {
    const canSubmitSetup = name.trim() && setupCategory && setupIntakeType &&
      (setupCategory !== 'infidelity' || setupRole);

    return (
      <div className="card">
        <h2>Let&apos;s Get Started</h2>

        {error && <div className="error-message">{error}</div>}

        {/* Name */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            What should we call you?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name or nickname"
            style={{ width: '100%' }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
            What area is your relationship struggling with?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                style={{
                  padding: '0.75rem 1rem',
                  border: setupCategory === cat.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: '8px',
                  background: setupCategory === cat.id ? 'var(--primary-light)' : 'var(--surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
                <div>
                  <strong>{cat.name}</strong>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.125rem' }}>
                    {cat.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Role (only for infidelity) */}
        {setupCategory === 'infidelity' && (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              Which role applies to you?
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSetupRole('betrayed')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: setupRole === 'betrayed' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: '8px',
                  background: setupRole === 'betrayed' ? 'var(--primary-light)' : 'var(--surface)',
                  cursor: 'pointer',
                }}
              >
                I am the <strong>betrayed</strong> partner
              </button>
              <button
                type="button"
                onClick={() => setSetupRole('unfaithful')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: setupRole === 'unfaithful' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: '8px',
                  background: setupRole === 'unfaithful' ? 'var(--primary-light)' : 'var(--surface)',
                  cursor: 'pointer',
                }}
              >
                I am the <strong>unfaithful</strong> partner
              </button>
            </div>
          </div>
        )}

        {/* Intake Type */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
            How much time do you have?
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setSetupIntakeType('short')}
              style={{
                flex: 1,
                padding: '1rem',
                border: setupIntakeType === 'short' ? '2px solid var(--primary)' : '2px solid var(--border)',
                borderRadius: '8px',
                background: setupIntakeType === 'short' ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <strong>Quick Check-In</strong>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>
                3 questions (~2 min)
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSetupIntakeType('long')}
              style={{
                flex: 1,
                padding: '1rem',
                border: setupIntakeType === 'long' ? '2px solid var(--primary)' : '2px solid var(--border)',
                borderRadius: '8px',
                background: setupIntakeType === 'long' ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <strong>Full Assessment</strong>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>
                10 questions (~5-10 min)
              </div>
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleSetupSubmit}
          disabled={!canSubmitSetup}
        >
          Continue
        </button>
      </div>
    );
  }

  // Partner B: Name input
  if (step === 'name') {
    return (
      <div className="card">
        <h2>Welcome</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          {partnerName} has invited you to complete this questionnaire. How would you like to be called?
        </p>

        {error && <div className="error-message">{error}</div>}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name or nickname"
          style={{ marginBottom: '1.5rem' }}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleNameSubmit()}
        />

        <button
          className="btn btn-primary btn-block"
          onClick={handleNameSubmit}
          disabled={!name.trim()}
        >
          Continue
        </button>
      </div>
    );
  }

  // Partner B: Category display
  if (step === 'category-display') {
    const categoryInfo = getCategoryById(category);
    const intakeLabel = intakeType === 'short' ? 'Quick Check-In (3 questions)' : 'Full Assessment (10 questions)';
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p style={{ marginBottom: '1rem' }}>
          {partnerName} has selected:
        </p>
        <div style={{
          background: 'var(--background)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '2rem' }}>{categoryInfo?.icon}</span>
          <div>
            <strong style={{ fontSize: '1.25rem' }}>{categoryInfo?.name}</strong>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{categoryInfo?.description}</p>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Format: {intakeLabel}
        </p>
        <button className="btn btn-primary btn-block" onClick={() => setStep('questions')}>
          Continue to Questionnaire
        </button>
      </div>
    );
  }

  // Partner A: Share link
  if (step === 'share') {
    const categoryInfo = getCategoryById(category);
    const intakeLabel = intakeType === 'short' ? 'Quick Check-In' : 'Full Assessment';
    return (
      <div className="card">
        <h2>Share With Your Partner</h2>
        <p>
          Thanks, {name}. You selected <strong>{categoryInfo?.name}</strong> with the <strong>{intakeLabel}</strong>
          {role && <> and identified as the <strong>{role}</strong> partner</>}.
        </p>
        <p>
          Share this link with your partner so they can complete their questionnaire:
        </p>
        <div className="share-link">{partnerBLink}</div>
        <button className="btn btn-secondary copy-btn" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-primary btn-block" onClick={() => setStep('questions')}>
            Continue to Questionnaire
          </button>
        </div>
      </div>
    );
  }

  // Partner B: Role display (only for infidelity)
  if (step === 'role-display') {
    const categoryInfo = getCategoryById(category);
    const intakeLabel = intakeType === 'short' ? 'Quick Check-In (3 questions)' : 'Full Assessment (10 questions)';
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p>
          {partnerName} has selected <strong>{categoryInfo?.name}</strong> as the focus area.
        </p>
        <p>
          Based on their response, you are participating as the <strong>{role}</strong> partner.
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Format: {intakeLabel}
        </p>
        <button className="btn btn-primary btn-block" onClick={() => setStep('questions')}>
          Continue to Questionnaire
        </button>
      </div>
    );
  }

  // Questions
  if (!currentQ) {
    return (
      <div className="card">
        <div className="loading">Loading questions...</div>
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
