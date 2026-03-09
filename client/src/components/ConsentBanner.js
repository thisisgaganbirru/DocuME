import React, { useState, useEffect } from 'react';

const ConsentBanner = ({ onAccept }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gdpr_consent');
    if (!consent) setVisible(true);
    else onAccept(); // already consented
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gdpr_consent', JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1f2937', color: '#fff', padding: '20px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 1000, gap: '16px', flexWrap: 'wrap'
    }}>
      <div style={{ flex: 1 }}>
        <strong>Privacy Notice</strong>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#d1d5db' }}>
          We use Google OAuth to authenticate you. Files are automatically deleted after 1 hour.
          No data is sold to third parties. By continuing, you agree to our{' '}
          <button onClick={() => window.dispatchEvent(new CustomEvent('showPrivacy'))}
            style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Privacy Policy
          </button>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={handleAccept} style={{
          background: '#667eea', color: '#fff', border: 'none',
          padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
        }}>
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;
