// Google OAuth service
const { OAuth2Client } = require('google-auth-library');

let config;
try { config = require('../config'); } catch(e) { config = { google: {}, jwtSecret: process.env.JWT_SECRET }; }

const getOAuthClient = () => new OAuth2Client(
  config.google.clientId || process.env.GOOGLE_CLIENT_ID,
  config.google.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
  config.google.redirectUri || process.env.GOOGLE_REDIRECT_URI
);

const generateAuthUrl = () => {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
  });
};

const exchangeCodeForUserInfo = async (code) => {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.google.clientId || process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  };
};

module.exports = { generateAuthUrl, exchangeCodeForUserInfo };
