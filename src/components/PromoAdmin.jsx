import { useState, useEffect } from 'react';

function PromoAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [promoCodes, setPromoCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [codeDetails, setCodeDetails] = useState(null);

  // New code form
  const [newCode, setNewCode] = useState('');
  const [newFreeMonths, setNewFreeMonths] = useState(3);
  const [newMaxUses, setNewMaxUses] = useState(50);
  const [creating, setCreating] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-password': password,
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promo/admin/list', {
        headers: { 'x-admin-password': password },
      });

      if (!response.ok) {
        throw new Error('Invalid password');
      }

      const data = await response.json();
      setPromoCodes(data.promoCodes);
      setAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/promo/admin/list', { headers });
      const data = await response.json();
      setPromoCodes(data.promoCodes);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
    }
  };

  const fetchCodeDetails = async (codeId) => {
    try {
      const response = await fetch(`/api/promo/admin/stats/${codeId}`, { headers });
      const data = await response.json();
      setCodeDetails(data);
      setSelectedCode(codeId);
    } catch (err) {
      console.error('Error fetching code details:', err);
    }
  };

  const createPromoCode = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/promo/admin/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          freeMonths: newFreeMonths,
          maxUses: newMaxUses || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setNewCode('');
      setNewFreeMonths(3);
      setNewMaxUses(50);
      fetchPromoCodes();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleCodeActive = async (codeId, currentlyActive) => {
    try {
      await fetch(`/api/promo/admin/${codeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      fetchPromoCodes();
    } catch (err) {
      console.error('Error toggling code:', err);
    }
  };

  const deleteCode = async (codeId) => {
    if (!confirm('Are you sure you want to delete this promo code? This cannot be undone.')) {
      return;
    }

    try {
      await fetch(`/api/promo/admin/${codeId}`, {
        method: 'DELETE',
        headers,
      });
      setSelectedCode(null);
      setCodeDetails(null);
      fetchPromoCodes();
    } catch (err) {
      console.error('Error deleting code:', err);
    }
  };

  if (!authenticated) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-login">
            <h2>Promo Code Admin</h2>
            <p>Enter password to access the dashboard.</p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
              />
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Checking...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <h1>Promo Code Admin</h1>

        {/* Create New Code */}
        <div className="analytics-card">
          <h3>Create New Promo Code</h3>
          <form onSubmit={createPromoCode} className="promo-create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Free Months</label>
                <input
                  type="number"
                  value={newFreeMonths}
                  onChange={(e) => setNewFreeMonths(parseInt(e.target.value))}
                  min="1"
                  max="24"
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Uses (0 = unlimited)</label>
                <input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </form>
        </div>

        {/* Promo Codes List */}
        <div className="analytics-card">
          <h3>All Promo Codes</h3>
          <table className="promo-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Free Months</th>
                <th>Uses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((code) => (
                <tr key={code.id} className={!code.is_active ? 'inactive' : ''}>
                  <td>
                    <strong>{code.code}</strong>
                  </td>
                  <td>{code.free_months} months</td>
                  <td>
                    {code.uses_count} / {code.max_uses || '∞'}
                  </td>
                  <td>
                    <span className={`status-badge ${code.is_active ? 'active' : 'inactive'}`}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => fetchCodeDetails(code.id)}
                    >
                      Details
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => toggleCodeActive(code.id, code.is_active)}
                    >
                      {code.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Code Details Modal */}
        {codeDetails && (
          <div className="modal-overlay" onClick={() => setCodeDetails(null)}>
            <div className="modal-content promo-details-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{codeDetails.promoCode.code}</h3>
              <div className="promo-stats">
                <div className="stat">
                  <span className="stat-label">Free Months</span>
                  <span className="stat-value">{codeDetails.promoCode.free_months}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Uses</span>
                  <span className="stat-value">{codeDetails.promoCode.uses_count}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Max Uses</span>
                  <span className="stat-value">{codeDetails.promoCode.max_uses || 'Unlimited'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Created</span>
                  <span className="stat-value">
                    {new Date(codeDetails.promoCode.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <h4>Redemptions ({codeDetails.redemptions.length})</h4>
              {codeDetails.redemptions.length > 0 ? (
                <table className="promo-table redemptions-table">
                  <thead>
                    <tr>
                      <th>Couple</th>
                      <th>Redeemed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codeDetails.redemptions.map((r) => (
                      <tr key={r.id}>
                        <td>
                          {r.partner_a_name && r.partner_b_name
                            ? `${r.partner_a_name} & ${r.partner_b_name}`
                            : r.couple_code}
                        </td>
                        <td>{new Date(r.redeemed_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No redemptions yet.</p>
              )}

              <div className="modal-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => setCodeDetails(null)}
                >
                  Close
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--error)', color: 'white' }}
                  onClick={() => deleteCode(codeDetails.promoCode.id)}
                >
                  Delete Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromoAdmin;
