const audit = require('../utils/auditLog');

const auditMiddleware = (tool) => (req, res, next) => {
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.headers['x-forwarded-for'];
  const file = req.file || (req.files && req.files[0]);

  if (file) {
    audit.fileUploaded(userId, file.filename, file.size, file.mimetype, ip);
    audit.conversionStarted(userId, tool, file.filename, ip);
  }

  // Intercept res.download to log success
  const originalDownload = res.download.bind(res);
  res.download = (outputPath, outputName, ...args) => {
    const fs = require('fs');
    try {
      const outputSize = fs.statSync(outputPath).size;
      const inputSize = file?.size || 0;
      audit.conversionSuccess(userId, tool, file?.filename, outputName, inputSize, outputSize);
    } catch(e) {}
    return originalDownload(outputPath, outputName, ...args);
  };

  next();
};

module.exports = auditMiddleware;
