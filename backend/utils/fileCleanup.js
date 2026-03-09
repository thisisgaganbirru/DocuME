const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

/**
 * Deletes files in the given directory that are older than the retention period.
 * @param {string} dirPath - Absolute path to the directory to scan.
 */
const cleanDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    logger.warn(`Cleanup: directory does not exist, skipping: ${dirPath}`);
    return;
  }

  const now = Date.now();
  let entries;

  try {
    entries = fs.readdirSync(dirPath);
  } catch (err) {
    logger.error(`Cleanup: failed to read directory ${dirPath}`, { error: err.message });
    return;
  }

  for (const entry of entries) {
    // Skip .gitkeep and hidden files used to preserve empty dirs
    if (entry.startsWith('.')) continue;

    const filePath = path.join(dirPath, entry);

    try {
      const stat = fs.statSync(filePath);
      const ageMs = now - stat.mtimeMs;

      if (ageMs > config.upload.fileRetentionMs) {
        fs.unlinkSync(filePath);
        logger.info(`Cleanup: deleted expired file`, { file: filePath, ageMs });
      }
    } catch (err) {
      logger.error(`Cleanup: failed to process file ${filePath}`, { error: err.message });
    }
  }
};

/**
 * Runs the cleanup across the uploads and processed directories.
 */
const runCleanup = () => {
  logger.info('Cleanup: starting scheduled file cleanup');

  const uploadsDir = path.resolve(config.upload.uploadDir);
  const processedDir = path.resolve(config.upload.processedDir);

  cleanDirectory(uploadsDir);
  cleanDirectory(processedDir);

  logger.info('Cleanup: file cleanup complete');
};

// Schedule cleanup every 5 minutes
const cleanupJob = cron.schedule('*/5 * * * *', runCleanup, {
  scheduled: true,
  timezone: 'UTC'
});

logger.info('Cleanup: file cleanup cron job scheduled (every 5 minutes)');

module.exports = cleanupJob;
