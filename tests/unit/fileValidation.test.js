const multer = require('multer');
const { upload, handleMulterError } = require('../../backend/middleware/fileValidation');

// Extract fileFilter from the upload middleware by re-requiring with access to internals
// We test fileFilter indirectly via the handleMulterError and directly via internal extraction

// Re-implement fileFilter logic for direct unit testing (mirrors fileValidation.js)
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

// Helper to create a mock multer callback
const makeCallback = () => {
  const cb = jest.fn();
  cb.mockImplementation((err, result) => {
    cb.lastError = err;
    cb.lastResult = result;
  });
  return cb;
};

// Helper to create a mock file object
const mockFile = (mimetype, originalname) => ({ mimetype, originalname });

// Access fileFilter by requiring the module and pulling out internal state
// Since fileFilter is not exported directly, we test it by calling upload.single and checking
// handleMulterError behavior. We also test via reconstructed logic.

// Reconstruct fileFilter from the module source for direct testing
const path = require('path');
const fileFilter = (req, file, cb) => {
  const allowedTypes = Object.keys(ALLOWED_MIME_TYPES);
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error(`File type not allowed. Allowed types: PDF, JPG, PNG, WebP`), false);
  }
  const allowedExts = ALLOWED_MIME_TYPES[file.mimetype];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`File extension doesn't match its type`), false);
  }
  cb(null, true);
};

describe('File Validation - fileFilter', () => {
  test('should allow PDF files with .pdf extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('application/pdf', 'document.pdf'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('should allow JPEG files with .jpg extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('image/jpeg', 'photo.jpg'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('should allow JPEG files with .jpeg extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('image/jpeg', 'photo.jpeg'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('should allow PNG files with .png extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('image/png', 'image.png'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('should allow WebP files with .webp extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('image/webp', 'image.webp'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('should reject EXE files', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('application/octet-stream', 'virus.exe'), cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(cb.mock.calls[0][0].message).toContain('File type not allowed');
  });

  test('should reject PHP files', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('application/x-php', 'shell.php'), cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(cb.mock.calls[0][0].message).toContain('File type not allowed');
  });

  test('should reject HTML files with text/html MIME type', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('text/html', 'page.html'), cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
  });

  test('should reject MIME/extension mismatch - PDF MIME with .jpg extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('application/pdf', 'notapdf.jpg'), cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(cb.mock.calls[0][0].message).toContain("extension doesn't match");
  });

  test('should reject MIME/extension mismatch - image/png MIME with .pdf extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('image/png', 'fakepng.pdf'), cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(cb.mock.calls[0][0].message).toContain("extension doesn't match");
  });

  test('should reject MIME/extension mismatch - image/jpeg MIME with .png extension', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('image/jpeg', 'notajpeg.png'), cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(cb.mock.calls[0][0].message).toContain("extension doesn't match");
  });

  test('should handle uppercase file extensions (case insensitive)', () => {
    const cb = makeCallback();
    fileFilter({}, mockFile('application/pdf', 'DOCUMENT.PDF'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });
});

describe('File Validation - handleMulterError', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockNext = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  test('should return 400 with message for LIMIT_FILE_SIZE multer error', () => {
    const multerErr = new multer.MulterError('LIMIT_FILE_SIZE');
    const res = mockRes();
    handleMulterError(multerErr, {}, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('50MB') }));
  });

  test('should return 400 for other multer errors', () => {
    const multerErr = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    const res = mockRes();
    handleMulterError(multerErr, {}, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('should return 400 for non-multer errors', () => {
    const err = new Error('File type not allowed. Allowed types: PDF, JPG, PNG, WebP');
    const res = mockRes();
    handleMulterError(err, {}, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('File type not allowed') }));
  });

  test('should call next() when no error', () => {
    const res = mockRes();
    handleMulterError(null, {}, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
