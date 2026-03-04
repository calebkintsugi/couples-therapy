import { useEffect } from 'react';

function CrisisModal({ type, onClose, onContinue }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getTitle = () => {
    switch (type) {
      case 'self-harm':
        return "We're here for you";
      case 'violence':
        return 'Safety comes first';
      case 'abuse':
        return "You deserve to be safe";
      default:
        return "We're here for you";
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'self-harm':
        return "It sounds like you might be going through a really difficult time. You don't have to face this alone. Please consider reaching out to someone who can help right now.";
      case 'violence':
        return "If you or someone else is in immediate danger, please reach out for help. Safety is the priority.";
      case 'abuse':
        return "What you're describing sounds serious. You deserve to be safe, and there are people who can help you right now.";
      default:
        return "It sounds like you might need support beyond what this app can provide. Please consider reaching out to someone who can help.";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content crisis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crisis-modal-header">
          <span className="crisis-modal-icon">💙</span>
          <h2>{getTitle()}</h2>
        </div>

        <p className="crisis-modal-message">{getMessage()}</p>

        <div className="crisis-resources-box">
          <h3>Immediate Support</h3>

          <div className="crisis-resource">
            <div className="crisis-resource-name">
              <strong>988 Suicide & Crisis Lifeline</strong>
            </div>
            <div className="crisis-resource-action">
              <a href="tel:988" className="btn btn-crisis">Call 988</a>
              <span className="crisis-resource-note">Available 24/7</span>
            </div>
          </div>

          <div className="crisis-resource">
            <div className="crisis-resource-name">
              <strong>Crisis Text Line</strong>
            </div>
            <div className="crisis-resource-action">
              <a href="sms:741741&body=HOME" className="btn btn-crisis-secondary">Text HOME to 741741</a>
            </div>
          </div>

          {type === 'abuse' && (
            <div className="crisis-resource">
              <div className="crisis-resource-name">
                <strong>National Domestic Violence Hotline</strong>
              </div>
              <div className="crisis-resource-action">
                <a href="tel:1-800-799-7233" className="btn btn-crisis-secondary">1-800-799-7233</a>
              </div>
            </div>
          )}

          <div className="crisis-resource">
            <div className="crisis-resource-name">
              <strong>Emergency Services</strong>
            </div>
            <div className="crisis-resource-action">
              <a href="tel:911" className="btn btn-crisis-secondary">Call 911</a>
              <span className="crisis-resource-note">If in immediate danger</span>
            </div>
          </div>
        </div>

        <div className="crisis-modal-footer">
          <button className="btn btn-secondary" onClick={onContinue}>
            Continue anyway
          </button>
          <p className="crisis-modal-note">
            RepairCoach is not a crisis service. If you're in distress, please reach out to the resources above.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CrisisModal;
