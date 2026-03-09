import React from 'react';

const PrivacyPolicy = ({ onClose, token }) => {
  const handleExport = async () => {
    try {
      const response = await fetch('/api/user/export', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account and all associated data? This action cannot be undone.\n\nYour session will be cleared and any temporary files will be deleted within 1 hour.'
    );
    if (!confirmed) return;
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Deletion failed');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('gdpr_consent');
      alert('Your data deletion request has been processed. You will now be signed out.');
      window.location.reload();
    } catch (err) {
      alert('Deletion request failed. Please try again.');
    }
  };

  const overlay = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  };

  const modal = {
    background: '#ffffff',
    borderRadius: '16px',
    maxWidth: '680px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
  };

  const header = {
    padding: '28px 32px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    background: '#ffffff',
    zIndex: 1,
    borderRadius: '16px 16px 0 0',
  };

  const body = {
    padding: '28px 32px',
    flex: 1,
  };

  const section = {
    marginBottom: '28px',
  };

  const sectionTitle = {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '2px solid #667eea',
    display: 'inline-block',
  };

  const para = {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.7,
    margin: '8px 0',
  };

  const list = {
    paddingLeft: '20px',
    margin: '8px 0',
  };

  const listItem = {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.7,
    marginBottom: '4px',
  };

  const actionBar = {
    padding: '20px 32px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    background: '#f8f9ff',
    borderRadius: '0 0 16px 16px',
  };

  const btnPrimary = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  };

  const btnDanger = {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  };

  const btnClose = {
    background: 'transparent',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    padding: '10px 22px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
  };

  const closeBtn = {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#6b7280',
    lineHeight: 1,
    padding: '4px',
  };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={header}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Privacy Policy</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Last updated: March 2026</p>
          </div>
          <button style={closeBtn} onClick={onClose} aria-label="Close privacy policy">&#x2715;</button>
        </div>

        <div style={body}>
          <div style={section}>
            <span style={sectionTitle}>1. What Data We Collect</span>
            <p style={para}>
              PDF Converter Pro collects only the minimum data necessary to provide our service. When you sign in with Google OAuth, we receive:
            </p>
            <ul style={list}>
              <li style={listItem}><strong>Google profile ID</strong> — used as a unique identifier for your session</li>
              <li style={listItem}><strong>Email address</strong> — displayed in the application interface</li>
              <li style={listItem}><strong>Display name</strong> — used to personalise your experience</li>
              <li style={listItem}><strong>Profile picture URL</strong> — shown in the dashboard header</li>
            </ul>
            <p style={para}>
              We do <strong>not</strong> collect passwords, payment information, or any data beyond what Google provides via OAuth. Files you upload for conversion are processed in memory or temporary storage and never read for any purpose other than the conversion you requested.
            </p>
          </div>

          <div style={section}>
            <span style={sectionTitle}>2. How We Use Your Data</span>
            <ul style={list}>
              <li style={listItem}>Authenticating your identity via a signed JWT session token</li>
              <li style={listItem}>Displaying your name and avatar in the application</li>
              <li style={listItem}>Rate-limiting requests to prevent abuse</li>
              <li style={listItem}>Generating audit logs (user ID and action only — no file content)</li>
            </ul>
            <p style={para}>We do not use your data for advertising, profiling, or any purpose beyond operating the service.</p>
          </div>

          <div style={section}>
            <span style={sectionTitle}>3. Data Retention</span>
            <ul style={list}>
              <li style={listItem}><strong>Uploaded &amp; processed files:</strong> Automatically and permanently deleted within 1 hour of processing</li>
              <li style={listItem}><strong>Session tokens:</strong> Expire after 7 days; deleted on logout</li>
              <li style={listItem}><strong>Audit logs:</strong> Retained for 90 days; contain no file content — only action metadata (user ID, timestamp, operation type)</li>
              <li style={listItem}><strong>Google profile data:</strong> Stored only within the session JWT — not persisted to a database</li>
            </ul>
          </div>

          <div style={section}>
            <span style={sectionTitle}>4. Third Parties</span>
            <p style={para}>
              We use <strong>Google OAuth 2.0</strong> solely for authentication. No user data is sold, rented, or shared with any third party for commercial purposes. Google's handling of your data during the OAuth flow is governed by{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>Google's Privacy Policy</a>.
            </p>
          </div>

          <div style={section}>
            <span style={sectionTitle}>5. Your Rights (GDPR)</span>
            <p style={para}>If you are located in the European Economic Area, you have the following rights under the General Data Protection Regulation (GDPR):</p>
            <ul style={list}>
              <li style={listItem}><strong>Right of Access (Article 15):</strong> Request a copy of all data we hold about you — use the "Export My Data" button below</li>
              <li style={listItem}><strong>Right to Erasure (Article 17):</strong> Request deletion of your data — use the "Delete My Account" button below</li>
              <li style={listItem}><strong>Right to Portability (Article 20):</strong> Receive your data in a machine-readable JSON format via the export function</li>
              <li style={listItem}><strong>Right to Rectification (Article 16):</strong> Your profile data is sourced from Google — update it via your Google account settings</li>
              <li style={listItem}><strong>Right to Object (Article 21):</strong> Contact us to object to any processing of your personal data</li>
            </ul>
            <p style={para}>
              Deletion requests are fulfilled within <strong>30 days</strong> as required by GDPR Article 17. Because we store no persistent account data beyond session tokens, most data is effectively deleted immediately upon logout.
            </p>
          </div>

          <div style={section}>
            <span style={sectionTitle}>6. Cookies &amp; Local Storage</span>
            <p style={para}>We use the following client-side storage:</p>
            <ul style={list}>
              <li style={listItem}><strong>localStorage["token"]:</strong> Your JWT authentication token</li>
              <li style={listItem}><strong>localStorage["user"]:</strong> Your cached Google profile (name, email, picture)</li>
              <li style={listItem}><strong>localStorage["gdpr_consent"]:</strong> Records that you have accepted this privacy notice</li>
            </ul>
            <p style={para}>No third-party tracking cookies or analytics scripts are used.</p>
          </div>

          <div style={section}>
            <span style={sectionTitle}>7. Contact</span>
            <p style={para}>
              For privacy-related enquiries, data requests, or to exercise any of your GDPR rights, please contact us at:{' '}
              <a href="mailto:privacy@docume.app" style={{ color: '#667eea' }}>privacy@docume.app</a>
            </p>
            <p style={para}>We aim to respond to all privacy requests within 30 days.</p>
          </div>
        </div>

        <div style={actionBar}>
          {token && (
            <>
              <button style={btnPrimary} onClick={handleExport}>
                Export My Data
              </button>
              <button style={btnDanger} onClick={handleDelete}>
                Delete My Account
              </button>
            </>
          )}
          <button style={btnClose} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
