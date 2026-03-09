import React, { useState, useEffect } from 'react';
import { getGoogleAuthUrl, loginWithCode } from '../services/api';

function GoogleLoginButton({ onLogin }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we're returning from Google OAuth with a code in the URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setIsProcessing(true);
      // Remove code from URL to prevent re-processing on refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      loginWithCode(code)
        .then((data) => {
          if (data.token && data.user) {
            onLogin(data.user, data.token);
          } else {
            setError(data.message || 'Login failed. Please try again.');
            setIsProcessing(false);
          }
        })
        .catch((err) => {
          setError('Authentication failed. Please try again.');
          setIsProcessing(false);
        });
    } else {
      // Fetch the Google auth URL
      getGoogleAuthUrl()
        .then((data) => {
          if (data.url) {
            setAuthUrl(data.url);
          } else {
            setError('Could not fetch login URL.');
          }
        })
        .catch(() => {
          setError('Could not connect to server.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [onLogin]);

  const handleClick = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  if (isProcessing) {
    return (
      <div className="google-login-processing">
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>
          Signing you in...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>
        <button
          className="google-login-btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button
      className="google-login-btn"
      onClick={handleClick}
      disabled={isLoading || !authUrl}
    >
      {isLoading ? (
        <>
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
          Loading...
        </>
      ) : (
        <>
          <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </>
      )}
    </button>
  );
}

export default GoogleLoginButton;
