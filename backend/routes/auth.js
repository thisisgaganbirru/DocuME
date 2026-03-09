const express = require('express');
const jwt = require('jsonwebtoken');
const { generateAuthUrl, exchangeCodeForUserInfo } = require('../services/googleOAuth');
const authMiddleware = require('../middleware/auth');

let logger;
try { logger = require('../utils/logger'); } catch(e) { logger = console; }

let config;
try { config = require('../config'); } catch(e) { config = { jwtSecret: process.env.JWT_SECRET }; }

const JWT_SECRET = (config && config.jwtSecret) || process.env.JWT_SECRET || 'dev_secret';

const router = express.Router();

// GET /google-url - returns Google OAuth URL
router.get('/google-url', (req, res) => {
  try {
    const authUrl = generateAuthUrl();
    res.json({ authUrl });
  } catch (err) {
    logger.error ? logger.error('Failed to generate auth URL', err) : logger.error('Failed to generate auth URL', err);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// POST /google-callback - exchanges code for user info and JWT
router.post('/google-callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const user = await exchangeCodeForUserInfo(code);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, picture: user.picture },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    logger.info
      ? logger.info('Login success', { email: user.email, id: user.id })
      : logger.log('Login success', { email: user.email, id: user.id });

    res.json({ token, user });
  } catch (err) {
    logger.error
      ? logger.error('Login failure', err)
      : logger.error('Login failure', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /logout - clears auth cookie and returns success
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    logger.info
      ? logger.info('Logout', { user: req.user || 'unknown' })
      : logger.log('Logout', { user: req.user || 'unknown' });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error
      ? logger.error('Logout error', err)
      : logger.error('Logout error', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /me - protected route, returns current user
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
