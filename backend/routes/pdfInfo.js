// NOTE: This router must be mounted in server.js with:
//   app.use('/api/pdf', require('./backend/routes/pdfInfo'));

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');

const auth = require('../middleware/auth');

const execAsync = util.promisify(exec);

// Multer setup with disk storage (same pattern as convert.js)
const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'uploads'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 52428800 } }); // 50MB

// Helper to clean up uploaded file
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      // Ignore cleanup errors
    }
  }
};

// Parse pdfinfo output into structured object
const parsePdfInfo = (output) => {
  const result = { pages: null, title: null, author: null, size: null, version: null };

  output.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (key === 'pages') {
      result.pages = parseInt(value, 10) || null;
    } else if (key === 'title') {
      result.title = value || null;
    } else if (key === 'author') {
      result.author = value || null;
    } else if (key === 'file size') {
      result.size = value || null;
    } else if (key === 'pdf version') {
      result.version = value || null;
    }
  });

  return result;
};

// POST /api/pdf/info
router.post('/info', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  try {
    const { stdout } = await execAsync(`pdfinfo "${filePath}"`);
    const info = parsePdfInfo(stdout);
    cleanupFile(filePath);
    return res.json(info);
  } catch (err) {
    cleanupFile(filePath);
    console.error('pdfinfo error:', err);
    return res.status(500).json({ error: 'Failed to read PDF info', details: err.message });
  }
});

module.exports = router;
