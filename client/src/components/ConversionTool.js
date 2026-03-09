import React, { useState } from 'react';
import FileUpload from './FileUpload';

const TOOL_ICONS = {
  'pdf-to-image': '🖼️',
  'image-to-pdf': '📋',
  'compress-pdf': '🗜️',
  'split-pdf': '✂️',
  'merge-pdfs': '🔗',
};

function ConversionTool({
  toolName,
  title,
  description,
  acceptedTypes,
  multiple,
  onConvert,
  onBack,
  isLoading,
}) {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState('medium');
  const [pageRange, setPageRange] = useState('');
  const [imageFormat, setImageFormat] = useState('png');

  const showQuality = toolName === 'pdf-to-image' || toolName === 'compress-pdf';
  const showPageRange = toolName === 'split-pdf';
  const showImageFormat = toolName === 'pdf-to-image';

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  const handleConvert = () => {
    if (files.length === 0) return;

    const formData = new FormData();

    if (multiple) {
      files.forEach((file) => formData.append('files', file));
    } else {
      formData.append('file', files[0]);
    }

    if (showQuality) {
      formData.append('quality', quality);
    }

    if (showImageFormat) {
      formData.append('format', imageFormat);
    }

    if (showPageRange && pageRange.trim()) {
      formData.append('pageRange', pageRange.trim());
    }

    onConvert(formData);
  };

  const canConvert = files.length > 0 && !isLoading;
  const icon = TOOL_ICONS[toolName] || '📄';

  return (
    <div className="conversion-tool">
      <header className="conversion-tool-header">
        <button className="back-btn" onClick={onBack} disabled={isLoading}>
          ← Back
        </button>
        <div className="conversion-tool-title">
          <h2>{icon} {title}</h2>
          <p>{description}</p>
        </div>
      </header>

      <main className="conversion-tool-main">
        <div className="conversion-tool-card">
          <FileUpload
            accept={acceptedTypes}
            multiple={multiple}
            onFilesSelected={handleFilesSelected}
            label={multiple ? 'Select files' : 'Select file'}
          />

          {(showQuality || showPageRange || showImageFormat) && (
            <div className="tool-options">
              {showImageFormat && (
                <div className="option-group">
                  <label htmlFor="image-format">Output Format</label>
                  <select
                    id="image-format"
                    className="option-select"
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value)}
                  >
                    <option value="png">PNG (lossless)</option>
                    <option value="jpg">JPG (smaller size)</option>
                  </select>
                </div>
              )}

              {showQuality && (
                <div className="option-group">
                  <label htmlFor="quality">
                    {toolName === 'compress-pdf' ? 'Compression Level' : 'Image Quality'}
                  </label>
                  <select
                    id="quality"
                    className="option-select"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                  >
                    <option value="low">
                      {toolName === 'compress-pdf' ? 'High compression (smaller file)' : 'Low quality'}
                    </option>
                    <option value="medium">
                      {toolName === 'compress-pdf' ? 'Balanced' : 'Medium quality'}
                    </option>
                    <option value="high">
                      {toolName === 'compress-pdf' ? 'Low compression (better quality)' : 'High quality'}
                    </option>
                  </select>
                </div>
              )}

              {showPageRange && (
                <div className="option-group">
                  <label htmlFor="page-range">Page Range (optional)</label>
                  <input
                    id="page-range"
                    type="text"
                    className="option-input"
                    placeholder="e.g. 1-3, 5, 7-9"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                  />
                  <span className="option-hint">
                    Leave blank to split every page into separate files.
                    Use commas and hyphens to specify ranges.
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            className="convert-btn"
            onClick={handleConvert}
            disabled={!canConvert}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Converting...
              </>
            ) : (
              <>
                {icon} Convert
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default ConversionTool;
