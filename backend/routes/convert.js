const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const auth = require('../middleware/auth');
const auditMiddleware = require('../middleware/auditLogger');
const audit = require('../utils/auditLog');
const { convertPdfToImage } = require('../services/pdfToImage');
const { convertImageToPdf } = require('../services/imageToPdf');
const { compressPdf } = require('../services/compressPdf');
const { splitPdf } = require('../services/splitPdf');
const { mergePdfs } = require('../services/mergePdf');

// Multer setup with disk storage
const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'uploads'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 52428800 } }); // 50MB

// Helper to clean up input file(s) after processing
const cleanupFiles = (filePaths) => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  paths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });
};

// POST /pdf-to-image
router.post('/pdf-to-image', auth, auditMiddleware('PDF_TO_IMAGE'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const { quality = 'high', format = 'png' } = req.body;

  try {
    const result = await convertPdfToImage(inputPath, quality, format);
    cleanupFiles(inputPath);

    res.download(result.outputPath, result.outputName, (err) => {
      if (err) {
        // Response may have already started, just log
        console.error('Download error:', err);
      }
      cleanupFiles(result.outputPath);
    });
  } catch (err) {
    cleanupFiles(inputPath);
    console.error('PDF to image error:', err);
    audit.conversionFailure(req.user?.id, 'PDF_TO_IMAGE', req.file?.filename, err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

// POST /image-to-pdf
router.post('/image-to-pdf', auth, auditMiddleware('IMAGE_TO_PDF'), upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const inputPaths = req.files.map(f => f.path);

  try {
    const result = await convertImageToPdf(inputPaths);
    cleanupFiles(inputPaths);

    res.download(result.outputPath, result.outputName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      cleanupFiles(result.outputPath);
    });
  } catch (err) {
    cleanupFiles(inputPaths);
    console.error('Image to PDF error:', err);
    audit.conversionFailure(req.user?.id, 'IMAGE_TO_PDF', req.files?.[0]?.filename, err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

// POST /compress-pdf
router.post('/compress-pdf', auth, auditMiddleware('COMPRESS_PDF'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const { level = 'medium' } = req.body;

  try {
    const result = await compressPdf(inputPath, level);
    cleanupFiles(inputPath);

    res.download(result.outputPath, result.outputName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      cleanupFiles(result.outputPath);
    });
  } catch (err) {
    cleanupFiles(inputPath);
    console.error('Compress PDF error:', err);
    audit.conversionFailure(req.user?.id, 'COMPRESS_PDF', req.file?.filename, err);
    res.status(500).json({ error: 'Compression failed', details: err.message });
  }
});

// POST /split-pdf
router.post('/split-pdf', auth, auditMiddleware('SPLIT_PDF'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const { pageRange } = req.body;

  if (!pageRange) {
    cleanupFiles(inputPath);
    return res.status(400).json({ error: 'pageRange is required' });
  }

  try {
    const result = await splitPdf(inputPath, pageRange);
    cleanupFiles(inputPath);

    res.download(result.outputPath, result.outputName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      cleanupFiles(result.outputPath);
    });
  } catch (err) {
    cleanupFiles(inputPath);
    console.error('Split PDF error:', err);
    audit.conversionFailure(req.user?.id, 'SPLIT_PDF', req.file?.filename, err);
    res.status(500).json({ error: 'Split failed', details: err.message });
  }
});

// POST /merge-pdfs
router.post('/merge-pdfs', auth, auditMiddleware('MERGE_PDFS'), upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: 'At least 2 files are required for merging' });
  }

  const inputPaths = req.files.map(f => f.path);

  try {
    const result = await mergePdfs(inputPaths);
    cleanupFiles(inputPaths);

    res.download(result.outputPath, result.outputName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      cleanupFiles(result.outputPath);
    });
  } catch (err) {
    cleanupFiles(inputPaths);
    console.error('Merge PDFs error:', err);
    audit.conversionFailure(req.user?.id, 'MERGE_PDFS', req.files?.[0]?.filename, err);
    res.status(500).json({ error: 'Merge failed', details: err.message });
  }
});

module.exports = router;
