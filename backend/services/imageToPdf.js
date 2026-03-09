const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PROCESSED_DIR = path.join(process.cwd(), 'processed');

const PAGE_SIZES = {
  A4: [595, 842],
  Letter: [612, 792],
};

const convertImageToPdf = async (imagePaths, options = {}) => {
  const { pageSize = 'A4', onProgress = null } = options;
  const outputName = `${uuidv4()}.pdf`;
  const outputPath = path.join(PROCESSED_DIR, outputName);

  const [pageW, pageH] = PAGE_SIZES[pageSize] || PAGE_SIZES['A4'];

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const total = imagePaths.length;
    let pageCount = 0;
    const skipped = [];

    for (let i = 0; i < total; i++) {
      const imgPath = imagePaths[i];

      // Validate: check file exists
      if (!fs.existsSync(imgPath)) {
        console.warn(`[imageToPdf] Skipping missing file: ${imgPath}`);
        skipped.push(imgPath);
        if (onProgress) onProgress(i + 1, total);
        continue;
      }

      // Validate: check file has non-zero size
      const stat = fs.statSync(imgPath);
      if (stat.size === 0) {
        console.warn(`[imageToPdf] Skipping zero-size file: ${imgPath}`);
        skipped.push(imgPath);
        if (onProgress) onProgress(i + 1, total);
        continue;
      }

      try {
        // Use sharp to get dimensions
        const meta = await sharp(imgPath).metadata();
        const { width, height } = meta;
        // Scale image to fit page
        const scale = Math.min(pageW / width, pageH / height);
        const w = width * scale, h = height * scale;
        const x = (pageW - w) / 2, y = (pageH - h) / 2;
        doc.addPage({ size: pageSize });
        doc.image(imgPath, x, y, { width: w, height: h });
        pageCount++;
      } catch (err) {
        // Error recovery: skip failed image and continue
        console.warn(`[imageToPdf] Skipping file due to error (${imgPath}): ${err.message}`);
        skipped.push(imgPath);
      }

      if (onProgress) onProgress(i + 1, total);
    }

    doc.end();
    stream.on('finish', () => {
      const size = fs.statSync(outputPath).size;
      resolve({ outputPath, outputName, size, pageCount, skipped });
    });
    stream.on('error', reject);
  });
};

module.exports = { convertImageToPdf };
