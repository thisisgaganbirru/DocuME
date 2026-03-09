process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.GOOGLE_CLIENT_ID = 'test_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/auth/google-callback';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '5001'; // avoid conflict with dev server
