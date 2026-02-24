import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ScaleQuestion from './ScaleQuestion';
import TextQuestion from './TextQuestion';
import Disclaimer from './Disclaimer';
import { scaleQuestions, textQuestions } from '../questions';

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

  // Flow state: 'name' -> 'role' -> 'share' -> 'questions' (Partner A)
  // Flow state: 'name' -> 'role-display' -> 'questions' (Partner B)
  const [step, setStep] = useState('loading');
  const [role, setRole] = useState(null); // 'betrayed' or 'unfaithful'
  const [sessionData, setSessionData] = useState(null);
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  const allQuestions = [...scaleQuestions, ...textQuestions];
  const totalQuestions = allQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

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

        if (partner === 'A') {
          // Partner A
          if (data.partnerAName) {
            setName(data.partnerAName);
            if (data.unfaithfulPartner) {
              setRole(data.unfaithfulPartner === 'A' ? 'unfaithful' : 'betrayed');
              setStep('share');
            } else {
              setStep('role');
            }
          } else {
            setStep('name');
          }
        } else {
          // Partner B
          setPartnerName(data.partnerAName || 'Your partner');
          if (data.partnerBName) {
            setName(data.partnerBName);
            if (data.unfaithfulPartner) {
              setRole(data.unfaithfulPartner === 'B' ? 'unfaithful' : 'betrayed');
              setStep('role-display');
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
        setStep('role');
      } else {
        // Partner B - check if role is set
        if (sessionData?.unfaithfulPartner) {
          setRole(sessionData.unfaithfulPartner === 'B' ? 'unfaithful' : 'betrayed');
          setStep('role-display');
        } else {
          setStep('questions');
        }
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

  // Partner A: Role selection
  if (step === 'role') {
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p style={{ marginBottom: '2rem' }}>
          To provide the most relevant guidance, please indicate your role in this situation:
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
    return (
      <div className="card">
        <h2>Share With Your Partner</h2>
        <p>
          Thanks, {name}. You identified as the <strong>{role}</strong> partner.
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

  // Partner B: Role display
  if (step === 'role-display') {
    return (
      <div className="card">
        <h2>Hi {name}</h2>
        <p style={{ marginBottom: '2rem' }}>
          Based on {partnerName}&apos;s response, you are participating as the <strong>{role}</strong> partner.
        </p>
        <button className="btn btn-primary btn-block" onClick={() => setStep('questions')}>
          Continue to Questionnaire
        </button>
      </div>
    );
  }

  // Questions
  return (
    <div className="card">
      <h2>{name}&apos;s Questionnaire</h2>

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
