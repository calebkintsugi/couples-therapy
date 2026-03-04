import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [linkedCode, setLinkedCode] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const linked = searchParams.get('linked');
    if (linked) {
      setLinkedCode(linked);
    }

    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Log the user in
      login({
        userId: data.userId,
        email: data.email,
        sessionToken: data.sessionToken,
        couples: data.couples || [],
      });

      setStatus('success');

      // If user has couples, redirect to their most recent one
      // Otherwise, redirect to home
      if (data.couples && data.couples.length > 0) {
        // Redirect to account page to show their sessions
        setTimeout(() => navigate('/account'), 1500);
      } else {
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to verify link');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="auth-verify-page">
        <div className="auth-verify-container">
          <div className="auth-verify-card">
            <div className="loading-spinner" />
            <h2>Signing you in...</h2>
            <p>Please wait while we verify your link.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-verify-page">
        <div className="auth-verify-container">
          <div className="auth-verify-card auth-verify-error">
            <div className="error-icon">!</div>
            <h2>Link expired or invalid</h2>
            <p>{error}</p>
            <p className="auth-verify-note">
              Magic links expire after 15 minutes. Please request a new one.
            </p>
            <Link to="/login" className="btn btn-primary">
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-verify-page">
      <div className="auth-verify-container">
        <div className="auth-verify-card auth-verify-success">
          <div className="success-icon">✓</div>
          <h2>You're signed in!</h2>
          {linkedCode && (
            <p>Your couple code <strong>{linkedCode}</strong> has been linked to your account.</p>
          )}
          <p>Redirecting you now...</p>
        </div>
      </div>
    </div>
  );
}

export default AuthVerify;
