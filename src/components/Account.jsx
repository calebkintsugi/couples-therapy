import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Account() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && user.couples && user.couples.length > 0) {
      loadSessions();
    } else {
      setLoadingSessions(false);
    }
  }, [user]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const allSessions = [];

    for (const couple of user.couples) {
      try {
        const response = await fetch(`/api/couples/by-code/${couple.couple_code}`);
        if (response.ok) {
          const data = await response.json();
          allSessions.push(...(data.sessions || []).map(s => ({
            ...s,
            coupleCode: couple.couple_code,
            partnerAName: data.partnerAName,
            partnerBName: data.partnerBName,
          })));
        }
      } catch (e) {
        console.error('Error loading sessions for couple:', couple.couple_code);
      }
    }

    // Sort by date, most recent first
    allSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setSessions(allSessions);
    setLoadingSessions(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1>Your Account</h1>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        <div className="account-info-card">
          <div className="account-email">
            <span className="label">Signed in as</span>
            <span className="value">{user.email}</span>
          </div>
        </div>

        <div className="account-section">
          <h2>Your Sessions</h2>

          {loadingSessions ? (
            <div className="loading-spinner" />
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet.</p>
              <Link to="/" className="btn btn-primary">
                Start Your First Session
              </Link>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-card-header">
                    <span className="session-category">{session.category || 'Session'}</span>
                    <span className="session-date">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="session-card-names">
                    {session.partnerAName || 'Partner A'} & {session.partnerBName || 'Partner B'}
                  </div>
                  {session.partnerACompleted && session.partnerBCompleted ? (
                    <div className="session-card-links">
                      <a
                        href={`/session/${session.id}/results?p=${session.partnerAToken}`}
                        className="btn btn-secondary btn-sm"
                      >
                        {session.partnerAName || 'Partner A'}'s Results
                      </a>
                      <a
                        href={`/session/${session.id}/results?p=${session.partnerBToken}`}
                        className="btn btn-secondary btn-sm"
                      >
                        {session.partnerBName || 'Partner B'}'s Results
                      </a>
                    </div>
                  ) : (
                    <div className="session-card-status">
                      <span className="status-pending">
                        Waiting for {!session.partnerACompleted && !session.partnerBCompleted
                          ? 'both partners'
                          : !session.partnerACompleted
                          ? session.partnerAName || 'Partner A'
                          : session.partnerBName || 'Partner B'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="account-section">
          <h2>Your Couple Codes</h2>
          {user.couples && user.couples.length > 0 ? (
            <div className="couple-codes-list">
              {user.couples.map((couple) => (
                <div key={couple.couple_code} className="couple-code-card">
                  <span className="couple-code">{couple.couple_code}</span>
                  <span className="couple-names">
                    {couple.partner_a_name && couple.partner_b_name
                      ? `${couple.partner_a_name} & ${couple.partner_b_name}`
                      : 'Names not set'}
                  </span>
                  {couple.subscription_status && (
                    <span className={`subscription-badge ${couple.subscription_status}`}>
                      {couple.subscription_status === 'active' ? 'Active' :
                       couple.subscription_status === 'trialing' ? 'Trial' :
                       couple.subscription_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No couple codes linked to your account yet.</p>
          )}
        </div>

        <div className="account-actions">
          <Link to="/" className="btn btn-primary">
            Start New Session
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Account;
