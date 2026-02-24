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
  const [showShareLink, setShowShareLink] = useState(partner === 'A');
  const [copied, setCopied] = useState(false);

  const allQuestions = [...scaleQuestions, ...textQuestions];
  const totalQuestions = allQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const currentQ = allQuestions[currentQuestion];
  const isScale = currentQuestion < scaleQuestions.length;

  const partnerBLink = `${window.location.origin}/session/${sessionId}?partner=B`;

  useEffect(() => {
    // Verify session exists
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) {
          navigate('/');
        }
      })
      .catch(() => navigate('/'));
  }, [sessionId, navigate]);

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

  const dismissShareLink = () => {
    setShowShareLink(false);
  };

  if (showShareLink && partner === 'A' && currentQuestion === 0) {
    return (
      <div className="card">
        <h2>Share With Your Partner</h2>
        <p>
          Before you begin, share this link with your partner so they can complete
          their questionnaire:
        </p>
        <div className="share-link">{partnerBLink}</div>
        <button className="btn btn-secondary copy-btn" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-primary btn-block" onClick={dismissShareLink}>
            Continue to Questionnaire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Partner {partner}&apos;s Questionnaire</h2>

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
