const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PROCESSED_DIR = path.join(process.cwd(), 'processed');

const convertImageToPdf = async (imagePaths) => {
  const outputName = `${uuidv4()}.pdf`;
  const outputPath = path.join(PROCESSED_DIR, outputName);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    for (const imgPath of imagePaths) {
      // Use sharp to get dimensions
      const meta = await sharp(imgPath).metadata();
      const { width, height } = meta;
      // A4 = 595 x 842 pts; scale image to fit
      const pageW = 595, pageH = 842;
      const scale = Math.min(pageW / width, pageH / height);
      const w = width * scale, h = height * scale;
      const x = (pageW - w) / 2, y = (pageH - h) / 2;
      doc.addPage({ size: 'A4' });
      doc.image(imgPath, x, y, { width: w, height: h });
    }

    doc.end();
    stream.on('finish', () => resolve({ outputPath, outputName, size: fs.statSync(outputPath).size }));
    stream.on('error', reject);
  });
};

module.exports = { convertImageToPdf };
