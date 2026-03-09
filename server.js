require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./backend/config');
const logger = require('./backend/utils/logger');
const { corsOptions, helmetConfig, cors } = require('./backend/middleware/security');
const { limiter } = require('./backend/middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(limiter);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/convert', require('./backend/routes/convert'));
app.use('/api/pdf', require('./backend/routes/pdfInfo'));
app.use('/api/user', require('./backend/routes/user'));

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
