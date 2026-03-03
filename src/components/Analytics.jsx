import { useState, useEffect } from 'react';

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (authenticated) {
      fetchAnalytics();
    }
  }, [authenticated]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/summary', {
        headers: {
          'x-analytics-password': password,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics');
      }

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Islington8*') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!authenticated) {
    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Analytics Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: '100%', marginBottom: '16px' }}
            />
            {error && <p style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-card">
          <div className="waiting-spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="loading-card">
          <div className="waiting-spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '24px' }}>Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '48px', fontWeight: '600', color: 'var(--primary)' }}>
            {data.todayVisits}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Page Views Today</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '48px', fontWeight: '600', color: 'var(--primary)' }}>
            {data.totalVisits}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Total Page Views</div>
        </div>
      </div>

      {/* Page Views */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Page Views by Page</h2>
        {data.pageVisits.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No page views yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Page</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {data.pageVisits.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0' }}>{row.page || '(unknown)'}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Button Clicks */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Button Clicks</h2>
        {data.buttonClicks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No button clicks yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Button</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Page</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {data.buttonClicks.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0' }}>{row.event_name}</td>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{row.page || '-'}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Category Selections */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Problem Categories Selected</h2>
        {!data.categorySelections || data.categorySelections.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No category selections yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {data.categorySelections.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0' }}>{row.category}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Events */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Recent Events (Last 50)</h2>
        {data.recentEvents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No events yet</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Event</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Page</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 0' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: event.event_type === 'page_view' ? 'var(--info-bg)' : 'var(--primary-light)',
                        color: event.event_type === 'page_view' ? 'var(--info-text)' : 'var(--primary-dark)',
                      }}>
                        {event.event_type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 0' }}>{event.event_name}</td>
                    <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{event.page || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button className="btn btn-ghost" onClick={fetchAnalytics}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}

export default Analytics;
