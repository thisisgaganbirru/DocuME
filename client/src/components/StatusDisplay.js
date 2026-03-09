import React, { useEffect, useRef } from 'react';

const TYPE_CONFIG = {
  success: {
    icon: '✅',
    label: 'Success',
  },
  error: {
    icon: '❌',
    label: 'Error',
  },
  loading: {
    icon: null, // spinner
    label: 'Processing',
  },
  info: {
    icon: 'ℹ️',
    label: 'Info',
  },
};

function StatusDisplay({ message, type = 'info', downloadUrl, filename, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    // Auto-dismiss success messages after 5 seconds (only if no download available)
    if (type === 'success' && !downloadUrl) {
      timerRef.current = setTimeout(() => {
        onDismiss && onDismiss();
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [type, downloadUrl, onDismiss]);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'converted-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke object URL if it was created via URL.createObjectURL
    if (downloadUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(downloadUrl);
    }
  };

  return (
    <div className={`status-display ${type}`} role="alert" aria-live="polite">
      <div className="status-icon">
        {type === 'loading' ? (
          <div
            className="spinner"
            style={{ width: 20, height: 20, borderWidth: 2 }}
          ></div>
        ) : (
          config.icon
        )}
      </div>

      <div className="status-content">
        <div className="status-message">{message}</div>

        {downloadUrl && (
          <button className="status-download-btn" onClick={handleDownload}>
            ⬇️ Download {filename || 'File'}
          </button>
        )}
      </div>

      {type !== 'loading' && (
        <button
          className="status-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default StatusDisplay;
