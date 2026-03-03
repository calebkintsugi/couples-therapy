// Analytics tracking utility

export const track = async (eventType, eventName, metadata = {}) => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        eventName,
        page: window.location.pathname,
        metadata,
      }),
    });
  } catch (err) {
    // Silently fail - don't interrupt user experience
    console.error('Analytics error:', err);
  }
};

// Track page view
export const trackPageView = (pageName) => {
  track('page_view', pageName);
};

// Track button click
export const trackClick = (buttonName, metadata = {}) => {
  track('button_click', buttonName, metadata);
};

// Track form submission
export const trackSubmit = (formName, metadata = {}) => {
  track('form_submit', formName, metadata);
};
