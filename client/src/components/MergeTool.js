import React, { useState, useRef } from 'react';
import { mergePdfs } from '../services/api';

const MAX_FILES = 100;

// Format bytes to human-readable string
const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function MergeTool({ onBack, token }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  const handleFileInputChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setFiles((prev) => {
      const combined = [...prev, ...selected];
      // Deduplicate by name+size (best-effort), cap at MAX_FILES
      const seen = new Set();
      const deduped = combined.filter((f) => {
        const key = `${f.name}:${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return deduped.slice(0, MAX_FILES);
    });

    // Reset the input so the same file can be re-added after removal
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await mergePdfs(formData, token);

      if (!response.ok) {
        let errMsg = 'Merge failed.';
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="conversion-tool">
      <header className="conversion-tool-header">
        <button className="back-btn" onClick={onBack} disabled={isLoading}>
          ← Back
        </button>
        <div className="conversion-tool-title">
          <h2>🔗 Merge PDFs</h2>
          <p>Combine multiple PDF files into one document.</p>
        </div>
      </header>

      <main className="conversion-tool-main">
        <div className="conversion-tool-card">
          {/* File selection area */}
          <div className="merge-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <button
              className="merge-add-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={isLoading || files.length >= MAX_FILES}
            >
              + Add PDF files
            </button>
            <p className="option-hint">
              Select up to {MAX_FILES} PDF files. Files will be merged in the order listed below.
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="merge-file-list">
              <div className="merge-file-list-header">
                <span>
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                  {' — '}Total size: <strong>{formatBytes(totalSize)}</strong>
                </span>
                <span className="merge-reorder-hint">
                  Tip: Remove and re-add files to change their order.
                </span>
              </div>

              <ul className="merge-file-items">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${index}`} className="merge-file-item">
                    <span className="merge-file-index">{index + 1}</span>
                    <span className="merge-file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="merge-file-size">{formatBytes(file.size)}</span>
                    <button
                      className="merge-file-remove"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isLoading}
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation / API error */}
          {error && (
            <div className="merge-error option-hint option-hint-error">{error}</div>
          )}

          {/* Merge button */}
          <button
            className="convert-btn"
            onClick={handleMerge}
            disabled={files.length < 2 || isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Merging...
              </>
            ) : (
              <>
                🔗 Merge {files.length > 0 ? `${files.length} ` : ''}file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </button>

          {files.length === 1 && !error && (
            <p className="option-hint">Add at least one more PDF to enable merging.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default MergeTool;
