const path = require('path');
const winston = require('winston');

// Separate audit log transport - 90 day retention via file rotation
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'audit.log'),
      maxsize: 10 * 1024 * 1024, // 10MB per file
      maxFiles: 9, // 9 x 10MB = 90MB (~90 days at average usage)
      tailable: true
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Redact sensitive fields
const redact = (obj) => {
  const redacted = { ...obj };
  ['token', 'password', 'secret', 'authorization'].forEach(key => {
    if (redacted[key]) redacted[key] = '[REDACTED]';
  });
  // Partially redact email
  if (redacted.email) {
    const [user, domain] = redacted.email.split('@');
    redacted.email = `${user.slice(0, 2)}***@${domain}`;
  }
  return redacted;
};

const audit = {
  // Auth events
  loginSuccess: (user, ip) => auditLogger.info({ event: 'AUTH_LOGIN_SUCCESS', userId: user.id, email: redact({ email: user.email }).email, ip, timestamp: new Date().toISOString() }),
  loginFailure: (reason, ip) => auditLogger.warn({ event: 'AUTH_LOGIN_FAILURE', reason, ip, timestamp: new Date().toISOString() }),
  logout: (userId, ip) => auditLogger.info({ event: 'AUTH_LOGOUT', userId, ip, timestamp: new Date().toISOString() }),

  // File operation events
  fileUploaded: (userId, filename, size, mimetype, ip) => auditLogger.info({ event: 'FILE_UPLOADED', userId, filename, size, mimetype, ip, timestamp: new Date().toISOString() }),
  conversionStarted: (userId, tool, inputFile, ip) => auditLogger.info({ event: 'CONVERSION_STARTED', userId, tool, inputFile, ip, timestamp: new Date().toISOString() }),
  conversionSuccess: (userId, tool, inputFile, outputFile, inputSize, outputSize) => auditLogger.info({ event: 'CONVERSION_SUCCESS', userId, tool, inputFile, outputFile, inputSize, outputSize, reduction: outputSize < inputSize ? `${Math.round((1 - outputSize/inputSize)*100)}%` : null, timestamp: new Date().toISOString() }),
  conversionFailure: (userId, tool, inputFile, error) => auditLogger.error({ event: 'CONVERSION_FAILURE', userId, tool, inputFile, error: error.message, timestamp: new Date().toISOString() }),
  fileDeleted: (filename, reason) => auditLogger.info({ event: 'FILE_DELETED', filename, reason, timestamp: new Date().toISOString() }),

  // Security events
  rateLimitExceeded: (ip, endpoint) => auditLogger.warn({ event: 'SECURITY_RATE_LIMIT', ip, endpoint, timestamp: new Date().toISOString() }),
  invalidFileType: (userId, filename, mimetype, ip) => auditLogger.warn({ event: 'SECURITY_INVALID_FILE', userId: userId || 'anonymous', filename, mimetype, ip, timestamp: new Date().toISOString() }),
  invalidToken: (ip, reason) => auditLogger.warn({ event: 'SECURITY_INVALID_TOKEN', ip, reason, timestamp: new Date().toISOString() })
};

module.exports = audit;
