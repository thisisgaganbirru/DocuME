const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const PROCESSED_DIR = path.join(process.cwd(), 'processed');

// Parse page range string like "1,3,5-7" into qpdf format
const parsePageRange = (rangeStr) => {
  return rangeStr.trim().split(',').map(part => {
    part = part.trim();
    if (part.includes('-')) return part;
    return part;
  }).join(',');
};

const splitPdf = async (inputPath, pageRange) => {
  const outputName = `${uuidv4()}.pdf`;
  const outputPath = path.join(PROCESSED_DIR, outputName);
  const pages = parsePageRange(pageRange);

  const cmd = `qpdf "${inputPath}" --pages "${inputPath}" ${pages} -- "${outputPath}"`;
  await execAsync(cmd);

  if (!fs.existsSync(outputPath)) throw new Error('Split failed');
  return { outputPath, outputName, size: fs.statSync(outputPath).size };
};

module.exports = { splitPdf };
