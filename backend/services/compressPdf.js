const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const PROCESSED_DIR = path.join(process.cwd(), 'processed');

const settingsMap = {
  high: '/printer',    // 300dpi - high quality
  medium: '/ebook',    // 150dpi - medium
  low: '/screen'       // 72dpi - max compression
};

const compressPdf = async (inputPath, level = 'medium') => {
  const outputName = `${uuidv4()}.pdf`;
  const outputPath = path.join(PROCESSED_DIR, outputName);
  const setting = settingsMap[level] || '/ebook';

  const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${setting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
  await execAsync(cmd);

  if (!fs.existsSync(outputPath)) throw new Error('Compression failed');
  const stats = fs.statSync(outputPath);
  return { outputPath, outputName, size: stats.size };
};

module.exports = { compressPdf };
