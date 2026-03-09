import React from 'react';

const TOOLS = [
  {
    key: 'pdf-to-image',
    icon: '🖼️',
    title: 'PDF to Image',
    description: 'Convert PDF pages to high-quality PNG or JPG images',
  },
  {
    key: 'image-to-pdf',
    icon: '📋',
    title: 'Image to PDF',
    description: 'Combine one or more images into a single PDF document',
  },
  {
    key: 'compress-pdf',
    icon: '🗜️',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while preserving quality',
  },
  {
    key: 'split-pdf',
    icon: '✂️',
    title: 'Split PDF',
    description: 'Extract specific pages or split into multiple files',
  },
  {
    key: 'merge-pdfs',
    icon: '🔗',
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single document',
  },
];

function Dashboard({ user, onToolSelect, onLogout }) {
  const getInitial = (u) => {
    if (u.name) return u.name.charAt(0).toUpperCase();
    if (u.email) return u.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-icon">📄</div>
          <span className="brand-name">PDF Converter Pro</span>
        </div>
        <div className="dashboard-user">
          {user.picture ? (
            <img
              className="user-avatar"
              src={user.picture}
              alt={user.name || 'User avatar'}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="user-avatar-placeholder">{getInitial(user)}</div>
          )}
          <span className="user-name">{user.name || user.email}</span>
          <button className="logout-btn" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-hero">
          <h2>What would you like to convert?</h2>
          <p>Choose a tool below to get started. Your files are processed securely.</p>
        </div>

        <div className="tool-grid">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              className="tool-card"
              onClick={() => onToolSelect(tool.key)}
            >
              <div className="tool-card-icon">{tool.icon}</div>
              <div className="tool-card-title">{tool.title}</div>
              <div className="tool-card-desc">{tool.description}</div>
              <div className="tool-card-arrow">→</div>
            </button>
          ))}
        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-badges">
          <span className="footer-badge">🕐 Files deleted after 1 hour</span>
          <span className="footer-badge">🔒 Secure</span>
          <span className="footer-badge">🛡️ Private</span>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
