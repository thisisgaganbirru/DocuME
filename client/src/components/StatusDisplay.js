import React from 'react';

function StatusDisplay({ message, type, downloadUrl, filename, onDismiss }) {
  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'converted-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke blob URL after use
    if (downloadUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(downloadUrl);
    }
  };

  const classMap = {
    success: 'status-success',
    error: 'status-error',
    loading: 'status-loading',
  };

  const statusClass = classMap[type] || 'status-info';

  return (
    <div className={`status-display ${statusClass}`} role="alert">
      <div className="status-content">
        <span className="status-message">{message}</span>
        <div className="status-actions">
          {downloadUrl && type === 'success' && (
            <button className="download-btn" onClick={handleDownload}>
              Download {filename || 'file'}
            </button>
          )}
          {onDismiss && type !== 'loading' && (
            <button className="dismiss-btn" onClick={onDismiss} aria-label="Dismiss">
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusDisplay;
