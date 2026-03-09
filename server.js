require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./backend/config');
const logger = require('./backend/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Rate limiter (owned by Security Agent: backend/middleware/rateLimiter.js)
// app.use(require('./backend/middleware/rateLimiter'));

// JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Auth routes (owned by Auth Agent: backend/routes/auth.js)
// app.use('/api/auth', require('./backend/routes/auth'));

// Convert routes (owned by Conversion Agent: backend/routes/convert.js)
// app.use('/api/convert', require('./backend/routes/convert'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// File cleanup cron job
require('./backend/utils/fileCleanup');

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

module.exports = app;
