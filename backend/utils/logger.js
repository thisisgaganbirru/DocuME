const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, json, colorize, printf, errors } = format;

// Redact sensitive fields from log metadata
const redactSensitiveFields = format((info) => {
  const sensitiveKeys = ['token', 'password', 'secret', 'authorization', 'jwt'];

  const redact = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const key of Object.keys(result)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = redact(result[key]);
      }
    }
    return result;
  };

  const { message, level, timestamp: ts, stack, ...meta } = info;
  const redactedMeta = redact(meta);

  return Object.assign(info, redactedMeta);
})();

const isDev = config.nodeEnv === 'development';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  redactSensitiveFields,
  json()
);

const logger = createLogger({
  level: config.logLevel,
  format: isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'error.log',
      level: 'error',
      format: combine(timestamp(), redactSensitiveFields, json())
    }),
    new transports.File({
      filename: 'combined.log',
      format: combine(timestamp(), redactSensitiveFields, json())
    })
  ]
});

module.exports = logger;
