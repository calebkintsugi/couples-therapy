import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Results() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partner = searchParams.get('partner') || 'A';

  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/advice/${partner}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.partnerACompleted === false || data.partnerBCompleted === false) {
            navigate(`/session/${sessionId}/waiting?partner=${partner}`);
            return;
          }
          throw new Error(data.error || 'Failed to load advice');
        }

        setAdvice(data.advice);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [sessionId, partner, navigate]);

  if (loading) {
    return (
      <div className="card">
        <div className="waiting-container">
          <div className="waiting-spinner" />
          <h2>Generating Your Guidance</h2>
          <p>
            Please wait while we prepare personalized advice based on both
            partners&apos; responses...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Something Went Wrong</h2>
        <div className="error-message">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Your Personalized Guidance</h2>
      <p style={{ marginBottom: '1.5rem' }}>
        Based on both partners&apos; responses, here is some guidance for your
        healing journey:
      </p>

      <div className="disclaimer">
        <h4>Reminder</h4>
        <p>
          This guidance is for educational purposes only and is not a substitute
          for professional therapy. We strongly encourage working with a licensed
          therapist for the best support in your healing journey.
        </p>
      </div>

      <div
        className="results-content"
        style={{
          background: 'var(--background)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
        }}
      >
        {advice}
      </div>

      <div className="crisis-resources">
        <h4>Professional Resources</h4>
        <p>
          Consider seeking support from a licensed therapist or counselor who
          specializes in relationship trauma and infidelity recovery.
        </p>
        <p>
          <strong>Psychology Today Therapist Finder:</strong>{' '}
          <a
            href="https://www.psychologytoday.com/us/therapists"
            target="_blank"
            rel="noopener noreferrer"
          >
            Find a Therapist
          </a>
        </p>
        <p>
          <strong>National Suicide Prevention Lifeline:</strong> 988
        </p>
        <p>
          <strong>Crisis Text Line:</strong> Text HOME to 741741
        </p>
      </div>

      <button
        className="btn btn-secondary btn-block"
        onClick={() => navigate('/')}
        style={{ marginTop: '2rem' }}
      >
        Start a New Session
      </button>
    </div>
  );
}

export default Results;
