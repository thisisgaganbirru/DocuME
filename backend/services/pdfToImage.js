const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const execAsync = util.promisify(exec);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PROCESSED_DIR = path.join(process.cwd(), 'processed');

const qualityMap = { high: 90, medium: 75, low: 60 };
const dpiMap = { high: 300, medium: 150, low: 72 };

const convertPdfToImage = async (inputPath, quality = 'high', format = 'png') => {
  const outputName = `${uuidv4()}.${format}`;
  const outputPath = path.join(PROCESSED_DIR, outputName);
  const dpi = dpiMap[quality] || 150;
  const q = qualityMap[quality] || 75;

  // ImageMagick convert command
  const cmd = `convert -density ${dpi} -quality ${q} "${inputPath}[0]" "${outputPath}"`;
  await execAsync(cmd);

  if (!fs.existsSync(outputPath)) throw new Error('Conversion failed - output not created');

  const stats = fs.statSync(outputPath);
  return { outputPath, outputName, size: stats.size };
};

// Add new function: convertPdfAllPages
const convertPdfAllPages = async (inputPath, quality = 'medium', format = 'png') => {
  // Get page count first
  const { stdout } = await execAsync(`pdfinfo "${inputPath}" | grep Pages | awk '{print $2}'`);
  const pageCount = parseInt(stdout.trim()) || 1;

  const results = [];
  for (let i = 0; i < pageCount; i++) {
    const outputName = `${uuidv4()}-page${i + 1}.${format}`;
    const outputPath = path.join(process.cwd(), 'processed', outputName);
    const dpi = dpiMap[quality] || 150;
    const q = qualityMap[quality] || 75;
    const cmd = `convert -density ${dpi} -quality ${q} "${inputPath}[${i}]" "${outputPath}"`;
    await execAsync(cmd);
    if (fs.existsSync(outputPath)) {
      results.push({ outputPath, outputName, page: i + 1, size: fs.statSync(outputPath).size });
    }
  }
  return results; // array of converted pages
};

module.exports = { convertPdfToImage, convertPdfAllPages };
