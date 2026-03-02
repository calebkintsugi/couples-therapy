import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ScaleQuestion from './ScaleQuestion';
import TextQuestion from './TextQuestion';
import Disclaimer from './Disclaimer';
import { categories, questionsByCategory, getCategoryById } from '../questions';

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

  // Flow state for Partner A: 'name' -> 'category' -> 'role' (if infidelity) -> 'share' -> 'questions'
  // Flow state for Partner B: 'name' -> 'category-display' -> 'role-display' (if infidelity) -> 'questions'
  const [step, setStep] = useState('loading');
  const [category, setCategory] = useState(null);
  const [role, setRole] = useState(null); // 'betrayed' or 'unfaithful' (only for infidelity)
  const [sessionData, setSessionData] = useState(null);
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  // Get questions for the selected category
  const categoryQuestions = category ? questionsByCategory[category] : null;
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
        }

        if (partner === 'A') {
          // Partner A flow
          if (data.partnerAName) {
            setName(data.partnerAName);
            if (data.category) {
              if (data.category === 'infidelity' && data.unfaithfulPartner) {
                setRole(data.unfaithfulPartner === 'A' ? 'unfaithful' : 'betrayed');
                setStep('share');
              } else if (data.category === 'infidelity') {
                setStep('role');
              } else {
                setStep('share');
              }
            } else {
              setStep('category');
            }
          } else {
            setStep('name');
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

      if (partner === 'A') {
        setStep('category');
      } else {
        // Partner B
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
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCategorySelect = async (selectedCategory) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      setCategory(selectedCategory);

      if (selectedCategory === 'infidelity') {
        setStep('role');
      } else {
        setStep('share');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleSelect = async (selectedRole) => {
    const unfaithfulPartner = selectedRole === 'unfaithful' ? 'A' : 'B';

    try {
      const response = await fetch(`/api/sessions/${sessionId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unfaithfulPartner }),
      });

      if (!response.ok) {
        throw new Error('Failed to save role');
      }

      setRole(selectedRole);
      setStep('share');
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

  // Name input
  if (step === 'name') {
    return (
      <div className="card">
        <h2>Welcome</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          {partner === 'A'
            ? 'Before we begin, how would you like to be called?'
            : `${partnerName} has invited you to complete this questionnaire. How would you like to be called?`}
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

  // Partner A: Category selection
  if (step === 'category') {
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          What area would you like to focus on?
        </p>

        {error && <div className="error-message">{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="btn btn-secondary btn-block"
              onClick={() => handleCategorySelect(cat.id)}
              style={{
                textAlign: 'left',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
              <div>
                <strong>{cat.name}</strong>
                <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                  {cat.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Partner B: Category display
  if (step === 'category-display') {
    const categoryInfo = getCategoryById(category);
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          {partnerName} has selected the focus area:
        </p>
        <div style={{
          background: 'var(--background)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
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
        <button className="btn btn-primary btn-block" onClick={() => setStep('questions')}>
          Continue to Questionnaire
        </button>
      </div>
    );
  }

  // Partner A: Role selection (only for infidelity)
  if (step === 'role') {
    return (
      <div className="card">
        <h2>One More Question</h2>
        <p style={{ marginBottom: '2rem' }}>
          To provide the most relevant guidance, please indicate your role:
        </p>

        {error && <div className="error-message">{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            className="btn btn-primary btn-block"
            onClick={() => handleRoleSelect('betrayed')}
          >
            I am the betrayed partner
          </button>
          <button
            className="btn btn-primary btn-block"
            onClick={() => handleRoleSelect('unfaithful')}
          >
            I am the unfaithful partner
          </button>
        </div>
      </div>
    );
  }

  // Partner A: Share link
  if (step === 'share') {
    const categoryInfo = getCategoryById(category);
    return (
      <div className="card">
        <h2>Share With Your Partner</h2>
        <p>
          Thanks, {name}. You selected <strong>{categoryInfo?.name}</strong>
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
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p>
          {partnerName} has selected <strong>{categoryInfo?.name}</strong> as the focus area.
        </p>
        <p style={{ marginBottom: '2rem' }}>
          Based on their response, you are participating as the <strong>{role}</strong> partner.
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
