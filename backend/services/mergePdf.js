const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const PROCESSED_DIR = path.join(process.cwd(), 'processed');

const mergePdfs = async (inputPaths) => {
  if (inputPaths.length < 2) throw new Error('Need at least 2 PDFs to merge');
  const outputName = `${uuidv4()}.pdf`;
  const outputPath = path.join(PROCESSED_DIR, outputName);

  // qpdf merge: qpdf --empty --pages file1.pdf file2.pdf ... -- output.pdf
  const filesStr = inputPaths.map(f => `"${f}" --pages "${f}" 1-z`).join(' ');
  const cmd = `qpdf --empty ${filesStr} -- "${outputPath}"`;
  await execAsync(cmd);

  if (!fs.existsSync(outputPath)) throw new Error('Merge failed');
  return { outputPath, outputName, size: fs.statSync(outputPath).size };
};

module.exports = { mergePdfs };
