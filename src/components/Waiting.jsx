import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Waiting() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partner = searchParams.get('partner') || 'A';

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          navigate('/');
          return;
        }

        const data = await response.json();
        if (data.partnerACompleted && data.partnerBCompleted) {
          navigate(`/session/${sessionId}/results?partner=${partner}`);
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [sessionId, partner, navigate]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.partnerACompleted && data.partnerBCompleted) {
          navigate(`/session/${sessionId}/results?partner=${partner}`);
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setChecking(false);
    }
  };

  const partnerBLink = `${window.location.origin}/session/${sessionId}?partner=B`;

  return (
    <div className="card">
      <div className="waiting-container">
        <div className="waiting-spinner" />
        <h2>Waiting for Your Partner</h2>
        <p>
          Thank you for completing your questionnaire. We&apos;re waiting for your
          partner to finish theirs.
        </p>
        <p>
          Once both of you have completed the questionnaire, you&apos;ll each receive
          personalized guidance.
        </p>

        {partner === 'A' && (
          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontWeight: '500' }}>Partner B&apos;s link:</p>
            <div className="share-link">{partnerBLink}</div>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={handleManualCheck}
          disabled={checking}
          style={{ marginTop: '2rem' }}
        >
          {checking ? 'Checking...' : 'Check Status'}
        </button>
      </div>
    </div>
  );
}

export default Waiting;
