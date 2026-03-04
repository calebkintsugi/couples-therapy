import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Disclaimer from './Disclaimer';

function Login() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-success-icon">✉️</div>
            <h1>Check your email</h1>
            <p className="login-description">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="login-note">
              Click the link in the email to sign in. The link expires in 15 minutes.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>Sign In</h1>
          <p className="login-description">
            Enter your email to receive a sign-in link. No password needed.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={sending || !email.trim()}
            >
              {sending ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account yet?{' '}
              <Link to="/">Start a new session</Link>
            </p>
          </div>
        </div>

        <Disclaimer variant="landing" />
      </div>
    </div>
  );
}

export default Login;
