const jwt = require('jsonwebtoken');
const authMiddleware = require('../../backend/middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only';

const mockReq = (token, cookieToken) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
  cookies: cookieToken ? { token: cookieToken } : {},
  ip: '127.0.0.1'
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should pass with valid Bearer token', () => {
    const token = jwt.sign({ id: '123', email: 'test@test.com' }, JWT_SECRET, { expiresIn: '7d' });
    const req = mockReq(token);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('123');
  });

  test('should pass with valid cookie token', () => {
    const token = jwt.sign({ id: '456' }, JWT_SECRET, { expiresIn: '7d' });
    const req = mockReq(null, token);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('should reject missing token with 401', () => {
    const req = mockReq(null, null);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should reject expired token with 401', () => {
    const token = jwt.sign({ id: '789' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq(token);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('expired') }));
  });

  test('should reject invalid token with 401', () => {
    const req = mockReq('invalid.token.here');
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should set req.user with decoded token payload', () => {
    const payload = { id: 'user_abc', email: 'user@example.com', name: 'Test User' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq(token);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(req.user).toMatchObject({ id: 'user_abc', email: 'user@example.com', name: 'Test User' });
  });

  test('should reject token signed with wrong secret', () => {
    const token = jwt.sign({ id: '999' }, 'wrong_secret', { expiresIn: '7d' });
    const req = mockReq(token);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should prefer Authorization header over cookie when both present', () => {
    const headerToken = jwt.sign({ id: 'header_user' }, JWT_SECRET, { expiresIn: '1h' });
    const cookieToken = jwt.sign({ id: 'cookie_user' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq(headerToken, cookieToken);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.user.id).toBe('header_user');
  });
});
