import React, { useState, useEffect } from 'react';
import './App.css';
import GoogleLoginButton from './components/GoogleLoginButton';
import Dashboard from './components/Dashboard';
import ConversionTool from './components/ConversionTool';
import StatusDisplay from './components/StatusDisplay';
import * as api from './services/api';

const TOOLS = {
  'pdf-to-image': {
    toolName: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages to high-quality images (PNG/JPG)',
    acceptedTypes: '.pdf',
    multiple: false,
  },
  'image-to-pdf': {
    toolName: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert images to a PDF document',
    acceptedTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
    multiple: true,
  },
  'compress-pdf': {
    toolName: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while preserving quality',
    acceptedTypes: '.pdf',
    multiple: false,
  },
  'split-pdf': {
    toolName: 'split-pdf',
    title: 'Split PDF',
    description: 'Split a PDF into multiple files by page ranges',
    acceptedTypes: '.pdf',
    multiple: false,
  },
  'merge-pdfs': {
    toolName: 'merge-pdfs',
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into one',
    acceptedTypes: '.pdf',
    multiple: true,
  },
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsValidating(false);
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setMessage({ text: `Welcome, ${userData.name || userData.email}!`, type: 'success' });
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await api.logout(token);
      } catch (e) {
        // Ignore logout errors
      }
    }
    setUser(null);
    setToken(null);
    setActiveTool(null);
    setMessage(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleToolSelect = (toolKey) => {
    setActiveTool(toolKey);
    setMessage(null);
  };

  const handleBack = () => {
    setActiveTool(null);
    setMessage(null);
  };

  const handleConvert = async (formData, toolKey) => {
    setIsLoading(true);
    setMessage({ text: 'Converting your file...', type: 'loading' });

    try {
      let response;
      switch (toolKey) {
        case 'pdf-to-image':
          response = await api.convertPdfToImage(formData, token);
          break;
        case 'image-to-pdf':
          response = await api.convertImageToPdf(formData, token);
          break;
        case 'compress-pdf':
          response = await api.compressPdf(formData, token);
          break;
        case 'split-pdf':
          response = await api.splitPdf(formData, token);
          break;
        case 'merge-pdfs':
          response = await api.mergePdfs(formData, token);
          break;
        default:
          throw new Error('Unknown tool');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Conversion failed' }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.downloadUrl) {
          setMessage({
            text: 'Conversion successful! Your file is ready.',
            type: 'success',
            downloadUrl: data.downloadUrl,
            filename: data.filename || 'converted-file',
          });
        } else {
          setMessage({ text: data.message || 'Conversion successful!', type: 'success' });
        }
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const disposition = response.headers.get('content-disposition');
        let filename = 'converted-file';
        if (disposition) {
          const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]*)\1/);
          if (match && match[2]) filename = match[2];
        } else {
          if (contentType && contentType.includes('pdf')) filename = 'output.pdf';
          else if (contentType && contentType.includes('zip')) filename = 'output.zip';
          else if (contentType && contentType.includes('image')) filename = 'output.png';
        }
        setMessage({
          text: 'Conversion successful! Your file is ready to download.',
          type: 'success',
          downloadUrl: url,
          filename,
        });
      }
    } catch (error) {
      setMessage({ text: error.message || 'An error occurred during conversion.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <span className="login-logo-icon">📄</span>
          </div>
          <h1 className="login-title">PDF Converter Pro</h1>
          <p className="login-subtitle">
            Convert, compress, split, and merge PDF files securely.
            <br />
            Sign in to get started.
          </p>
          <GoogleLoginButton onLogin={handleLogin} />
          <p className="login-footer">
            Files are automatically deleted after 1 hour.
            <br />
            Your data stays private and secure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {message && (
        <StatusDisplay
          message={message.text}
          type={message.type}
          downloadUrl={message.downloadUrl}
          filename={message.filename}
          onDismiss={() => setMessage(null)}
        />
      )}
      {activeTool ? (
        <ConversionTool
          {...TOOLS[activeTool]}
          isLoading={isLoading}
          onConvert={(formData) => handleConvert(formData, activeTool)}
          onBack={handleBack}
        />
      ) : (
        <Dashboard
          user={user}
          onToolSelect={handleToolSelect}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
