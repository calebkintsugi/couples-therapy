import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function Waiting() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('p');

  const [checking, setChecking] = useState(false);
  const [partner, setPartner] = useState(null);
  const [partnerBToken, setPartnerBToken] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/by-token/${token}`);
        if (!response.ok) {
          navigate('/');
          return;
        }

        const data = await response.json();
        setPartner(data.partner);
        if (data.partnerBToken) {
          setPartnerBToken(data.partnerBToken);
        }

        if (data.partnerACompleted && data.partnerBCompleted) {
          navigate(`/session/${sessionId}/results?p=${token}`);
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
  }, [sessionId, token, navigate]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/by-token/${token}`);
      if (response.ok) {
        const data = await response.json();
        if (data.partnerACompleted && data.partnerBCompleted) {
          navigate(`/session/${sessionId}/results?p=${token}`);
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setChecking(false);
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

  const partnerBLink = partnerBToken ? `${window.location.origin}/session/${sessionId}?p=${partnerBToken}` : '';

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="waiting-card">
          <div className="waiting-spinner" />
          <h2>Waiting for Your Partner</h2>
          <p>
            Thank you for completing your questionnaire. We're waiting for your
            partner to finish theirs.
          </p>
          <p className="text-muted">
            Once both of you have completed the questionnaire, you'll each receive
            personalized guidance.
          </p>

          {partner === 'A' && partnerBLink && (
            <div className="waiting-share">
              <p className="waiting-share-label">Partner's link:</p>
              <div className="setup-share-link">{partnerBLink}</div>
              <button className="btn btn-secondary" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}

          <button
            className="btn btn-ghost"
            onClick={handleManualCheck}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Waiting;
