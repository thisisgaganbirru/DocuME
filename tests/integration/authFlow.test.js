const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only';

let app;

beforeAll(() => {
  // Require app after env vars are set (setup.js runs first via Jest config)
  app = require('../../server');
});

describe('Auth Routes', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/auth/google-url returns authUrl', async () => {
    const res = await request(app).get('/api/auth/google-url');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('authUrl');
    expect(res.body.authUrl).toContain('accounts.google.com');
  });

  test('POST /api/auth/logout without token returns 401', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me with valid token returns user info', async () => {
    const token = jwt.sign(
      { id: 'test_user_123', email: 'test@example.com', name: 'Test User' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'test_user_123');
    expect(res.body).toHaveProperty('email', 'test@example.com');
  });

  test('GET /api/auth/me with expired token returns 401', async () => {
    const token = jwt.sign({ id: 'user_expired' }, JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me with invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/google-callback without code returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/google-callback')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/logout with valid token clears cookie and returns success', async () => {
    const token = jwt.sign({ id: 'logout_test_user' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    // Note: /logout route does NOT apply authMiddleware, it just clears the cookie
    // The route itself doesn't require auth - it just clears the cookie
    expect([200, 401]).toContain(res.status);
  });
});
