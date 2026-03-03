import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPageView, trackClick, trackSubmit } from '../analytics';

function JournalStart() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('choice'); // 'choice', 'new', 'join'

  useEffect(() => {
    trackPageView('journal_start');
  }, []);
  const [partnerAName, setPartnerAName] = useState('');
  const [partnerBName, setPartnerBName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdJournal, setCreatedJournal] = useState(null);

  const createJournal = async () => {
    if (!partnerAName.trim()) {
      setError('Please enter your name');
      return;
    }

    trackSubmit('create_journal');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerAName: partnerAName.trim(),
          partnerBName: partnerBName.trim() || 'Partner',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create journal');
      }

      setCreatedJournal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinJournal = async () => {
    if (!joinCode.trim() || joinCode.trim().length < 8) {
      setError('Please enter a valid 8-character code');
      return;
    }

    trackSubmit('join_journal');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/journals/by-code/${joinCode.trim().toUpperCase()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Journal not found');
      }

      // Navigate to partner B's journal URL
      navigate(data.partnerBUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Show created journal info
  if (createdJournal) {
    return (
      <div className="journal-start-page">
        <div className="journal-start-container">
          <div className="journal-start-card success">
            <h1>Your Journal is Ready!</h1>
            <p>Share the code below with your partner so they can join.</p>

            <div className="journal-created-code">
              <code>{createdJournal.code}</code>
              <div className="journal-code-actions">
                <a
                  href={`mailto:?subject=Your RepairCoach Journal Code&body=Your RepairCoach Journal Code is: ${createdJournal.code}%0A%0ASave this code to return to your journal at https://repaircoach.ai`}
                  className="btn btn-ghost btn-sm"
                >
                  Email Code to Myself
                </a>
              </div>
            </div>

            <div className="journal-links">
              <div className="journal-link-item">
                <span>Your journal link:</span>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(createdJournal.partnerAUrl)}
                >
                  Go to My Journal
                </button>
              </div>

              <div className="journal-link-item">
                <span>Partner's link:</span>
                <div className="journal-link-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyLink(createdJournal.partnerBUrl)}
                  >
                    Copy Link
                  </button>
                  <a
                    href={`mailto:?subject=Join our RepairCoach Journal&body=I've started a relationship journal for us on RepairCoach. The app lets us have our own private journals, while a coach provides feedback based on what both of us say.%0A%0AClick this link to join:%0A${window.location.origin}${createdJournal.partnerBUrl}%0A%0AOr enter this code at repaircoach.ai: ${createdJournal.code}`}
                    className="btn btn-ghost"
                  >
                    Email Link to Partner
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-start-page">
      <div className="journal-start-container">
        {mode === 'choice' && (
          <div className="journal-start-card">
            <h1>Side-by-Side Journaling</h1>
            <p className="journal-start-subtitle">
              A private space for couples to reflect on their relationship. Once either partner
              has written 200+ words, the AI starts providing insights based on both perspectives.
            </p>

            <div className="journal-start-options">
              <button
                className="journal-start-option"
                onClick={() => setMode('new')}
              >
                <span className="journal-option-icon">✨</span>
                <span className="journal-option-title">Start New Journal</span>
                <span className="journal-option-desc">Create a journal and invite your partner</span>
              </button>

              <button
                className="journal-start-option"
                onClick={() => setMode('join')}
              >
                <span className="journal-option-icon">🔗</span>
                <span className="journal-option-title">Join Partner's Journal</span>
                <span className="journal-option-desc">I have a code from my partner</span>
              </button>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        )}

        {mode === 'new' && (
          <div className="journal-start-card">
            <button
              type="button"
              className="journal-back-btn"
              onClick={() => setMode('choice')}
            >
              ← Back
            </button>

            <h1>Start Your Journal</h1>
            <p className="journal-start-subtitle">
              Enter your names to create your couple's journal.
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="journal-start-form">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={partnerAName}
                  onChange={(e) => setPartnerAName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Partner's Name (optional)</label>
                <input
                  type="text"
                  value={partnerBName}
                  onChange={(e) => setPartnerBName(e.target.value)}
                  placeholder="Enter your partner's name"
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={createJournal}
                disabled={loading || !partnerAName.trim()}
              >
                {loading ? 'Creating...' : 'Create Journal'}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="journal-start-card">
            <button
              type="button"
              className="journal-back-btn"
              onClick={() => setMode('choice')}
            >
              ← Back
            </button>

            <h1>Join Your Partner</h1>
            <p className="journal-start-subtitle">
              Enter the code your partner shared with you.
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="journal-start-form">
              <div className="form-group">
                <label>Journal Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  autoFocus
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={joinJournal}
                disabled={loading || joinCode.trim().length < 8}
              >
                {loading ? 'Joining...' : 'Join Journal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalStart;
