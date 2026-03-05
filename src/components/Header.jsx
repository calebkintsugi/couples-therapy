import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user } = useAuth();

  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link to="/" className="site-logo">
          RepairCoach
        </Link>
        <nav className="site-nav">
          {user ? (
            <Link to="/account" className="profile-link" title="Your Account">
              <span className="profile-icon">
                {user.email ? user.email[0].toUpperCase() : '?'}
              </span>
            </Link>
          ) : (
            <Link to="/login" className="sign-in-link">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
