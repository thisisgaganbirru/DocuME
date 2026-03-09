import React, { useState, useCallback } from 'react';
import FileUpload from './FileUpload';
import { getPdfInfo } from '../services/api';

const TOOL_ICONS = {
  'pdf-to-image': '🖼️',
  'image-to-pdf': '📋',
  'compress-pdf': '🗜️',
  'split-pdf': '✂️',
  'merge-pdfs': '🔗',
};

// Format bytes to human-readable string
const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Parse a page range string like "1-3,5,7-9" against a total page count
// Returns an error string if invalid, or null if valid
const validatePageRange = (rangeStr, totalPages) => {
  if (!rangeStr || !rangeStr.trim()) return 'Page range is required.';

  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return 'Page range is required.';

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    const singleMatch = part.match(/^(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start < 1) return `Page number ${start} is invalid (must be >= 1).`;
      if (start > end) return `Range "${part}" is invalid (start > end).`;
      if (totalPages && end > totalPages) return `Page ${end} exceeds total page count (${totalPages}).`;
    } else if (singleMatch) {
      const page = parseInt(singleMatch[1], 10);
      if (page < 1) return `Page number ${page} is invalid (must be >= 1).`;
      if (totalPages && page > totalPages) return `Page ${page} exceeds total page count (${totalPages}).`;
    } else {
      return `"${part}" is not a valid page or range.`;
    }
  }

  return null;
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
  token,
  conversionResult,
}) {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState('medium');
  const [pageRange, setPageRange] = useState('');
  const [imageFormat, setImageFormat] = useState('png');

  // PDF info state (for compress and split tools)
  const [pdfInfo, setPdfInfo] = useState(null);
  const [pdfInfoLoading, setPdfInfoLoading] = useState(false);
  const [pdfInfoError, setPdfInfoError] = useState(null);

  // Page range validation error
  const [pageRangeError, setPageRangeError] = useState(null);

  const showQuality = toolName === 'pdf-to-image' || toolName === 'compress-pdf';
  const showPageRange = toolName === 'split-pdf';
  const showImageFormat = toolName === 'pdf-to-image';
  const needsPdfInfo = toolName === 'compress-pdf' || toolName === 'split-pdf';

  const fetchPdfInfo = useCallback(
    async (file) => {
      if (!needsPdfInfo || !file) return;
      setPdfInfoLoading(true);
      setPdfInfoError(null);
      setPdfInfo(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const info = await getPdfInfo(formData, token);
        if (info && info.error) {
          setPdfInfoError(info.error);
        } else {
          setPdfInfo(info);
        }
      } catch (err) {
        setPdfInfoError('Could not read PDF info.');
      } finally {
        setPdfInfoLoading(false);
      }
    },
    [needsPdfInfo, token]
  );

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
    setPdfInfo(null);
    setPdfInfoError(null);
    setPageRangeError(null);

    if (needsPdfInfo && selectedFiles.length > 0) {
      fetchPdfInfo(selectedFiles[0]);
    }
  };

  const handlePageRangeChange = (value) => {
    setPageRange(value);
    if (value.trim()) {
      const err = validatePageRange(value, pdfInfo ? pdfInfo.pages : null);
      setPageRangeError(err);
    } else {
      setPageRangeError(null);
    }
  };

  const handleConvert = () => {
    if (files.length === 0) return;

    // Validate page range before submitting
    if (showPageRange) {
      const err = validatePageRange(pageRange, pdfInfo ? pdfInfo.pages : null);
      if (err) {
        setPageRangeError(err);
        return;
      }
    }

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

  const canConvert =
    files.length > 0 &&
    !isLoading &&
    !(showPageRange && pageRangeError);

  const icon = TOOL_ICONS[toolName] || '📄';

  // Compute before/after size comparison for compress tool
  const compressionStats = (() => {
    if (toolName !== 'compress-pdf') return null;
    if (!conversionResult || !conversionResult.compressedSize) return null;

    const originalBytes = files[0] ? files[0].size : null;
    const compressedBytes = conversionResult.compressedSize;

    if (!originalBytes || !compressedBytes) return null;

    const reduction = Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
    return {
      original: formatBytes(originalBytes),
      compressed: formatBytes(compressedBytes),
      reduction: reduction > 0 ? reduction : 0,
    };
  })();

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

          {/* PDF Info panel for compress and split tools */}
          {needsPdfInfo && files.length > 0 && (
            <div className="pdf-info-panel">
              {pdfInfoLoading && (
                <span className="option-hint">Reading PDF info...</span>
              )}
              {pdfInfoError && (
                <span className="option-hint pdf-info-error">{pdfInfoError}</span>
              )}
              {pdfInfo && !pdfInfoLoading && (
                <div className="pdf-info-summary">
                  {pdfInfo.pages != null && (
                    <span className="pdf-info-item">
                      <strong>{pdfInfo.pages}</strong> page{pdfInfo.pages !== 1 ? 's' : ''}
                    </span>
                  )}
                  {toolName === 'compress-pdf' && files[0] && (
                    <span className="pdf-info-item">
                      Original size: <strong>{formatBytes(files[0].size)}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compression before/after result */}
          {toolName === 'compress-pdf' && compressionStats && (
            <div className="compression-stats">
              Original: <strong>{compressionStats.original}</strong>
              {' → '}
              Compressed: <strong>{compressionStats.compressed}</strong>
              {' '}
              <span className="compression-reduction">
                ({compressionStats.reduction}% reduction)
              </span>
            </div>
          )}

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
                  <label htmlFor="page-range">Page Range</label>
                  <input
                    id="page-range"
                    type="text"
                    className={`option-input${pageRangeError ? ' option-input-error' : ''}`}
                    placeholder="e.g. 1-3, 5, 7-9"
                    value={pageRange}
                    onChange={(e) => handlePageRangeChange(e.target.value)}
                  />
                  {pdfInfo && pdfInfo.pages != null && (
                    <span className="option-hint">
                      This PDF has {pdfInfo.pages} page{pdfInfo.pages !== 1 ? 's' : ''}.
                      Enter range e.g. 1-3,5,7-9
                    </span>
                  )}
                  {!pdfInfo && (
                    <span className="option-hint">
                      Use commas and hyphens to specify ranges.
                    </span>
                  )}
                  {pageRangeError && (
                    <span className="option-hint option-hint-error">{pageRangeError}</span>
                  )}
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
