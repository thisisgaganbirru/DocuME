import React, { useState, useRef, useCallback } from 'react';

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file) {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return '📄';
  if (file.type.startsWith('image/')) return '🖼️';
  return '📁';
}

function FileUpload({ accept, multiple, onFilesSelected, label }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const inputRef = useRef(null);

  const processFiles = useCallback(
    (files) => {
      const fileList = Array.from(files);
      const newWarnings = [];

      fileList.forEach((file) => {
        if (file.size > MAX_SIZE_BYTES) {
          newWarnings.push(`"${file.name}" is ${formatBytes(file.size)} — exceeds the 50MB limit.`);
        }
      });

      setSelectedFiles(fileList);
      setWarnings(newWarnings);
      onFilesSelected(fileList);
    },
    [onFilesSelected]
  );

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleZoneClick = () => {
    inputRef.current?.click();
  };

  const zoneClass = [
    'file-upload-zone',
    dragActive ? 'drag-active' : '',
    selectedFiles.length > 0 ? 'has-files' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="file-upload">
      {label && <div className="file-upload-label">{label}</div>}

      <div
        className={zoneClass}
        onClick={handleZoneClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleZoneClick()}
        aria-label="File upload area"
      >
        <input
          ref={inputRef}
          type="file"
          className="file-upload-input"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />

        {selectedFiles.length === 0 ? (
          <>
            <span className="file-upload-icon">
              {dragActive ? '📂' : '📁'}
            </span>
            <div className="file-upload-text">
              {dragActive
                ? 'Drop your file here'
                : 'Drag & drop your file here'}
            </div>
            <div className="file-upload-hint">
              or <span className="file-upload-link">browse to choose a file</span>
              {accept && (
                <><br /><span style={{ marginTop: 4, display: 'block' }}>Accepted: {accept}</span></>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="file-upload-icon">✅</span>
            <div className="file-upload-text">
              {selectedFiles.length === 1
                ? '1 file selected'
                : `${selectedFiles.length} files selected`}
            </div>
            <div className="file-upload-hint">
              <span className="file-upload-link">Click to change</span>
            </div>
          </>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          {selectedFiles.map((file, index) => (
            <div key={index} className="selected-file-item">
              <span className="selected-file-icon">{getFileIcon(file)}</span>
              <span className="selected-file-name">{file.name}</span>
              <span className="selected-file-size">{formatBytes(file.size)}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.map((w, i) => (
        <div key={i} className="file-warning">
          ⚠️ {w}
        </div>
      ))}
    </div>
  );
}

export default FileUpload;
