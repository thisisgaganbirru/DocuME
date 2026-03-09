const queue = require('../services/queue');

// Returns middleware that wraps the next handler in the queue
const enqueue = (req, res, next) => {
  // For files > 10MB, use queue. Otherwise process directly.
  const fileSize = req.file?.size || (req.files?.[0]?.size) || 0;
  const TEN_MB = 10 * 1024 * 1024;

  if (fileSize > TEN_MB) {
    // Add queue position header
    res.setHeader('X-Queue-Position', queue.size + 1);
    res.setHeader('X-Queue-Active', queue.active);
    // Continue - actual queuing happens in route handler via queue.add()
  }
  next();
};

module.exports = { enqueue };
