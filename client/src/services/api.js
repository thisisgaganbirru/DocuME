const API_BASE = process.env.REACT_APP_API_URL || '/api';

const getHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
});

export const getGoogleAuthUrl = () =>
  fetch(`${API_BASE}/auth/google-url`).then((r) => r.json());

export const loginWithCode = (code) =>
  fetch(`${API_BASE}/auth/google-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }).then((r) => r.json());

export const logout = (token) =>
  fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(token),
  }).then((r) => r.json());

// Conversion APIs - each takes FormData and token, returns Response (blob or json)
export const convertPdfToImage = (formData, token) =>
  fetch(`${API_BASE}/convert/pdf-to-image`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

export const convertImageToPdf = (formData, token) =>
  fetch(`${API_BASE}/convert/image-to-pdf`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

export const compressPdf = (formData, token) =>
  fetch(`${API_BASE}/convert/compress-pdf`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

export const splitPdf = (formData, token) =>
  fetch(`${API_BASE}/convert/split-pdf`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

export const mergePdfs = (formData, token) =>
  fetch(`${API_BASE}/convert/merge-pdfs`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

export const getPdfInfo = (formData, token) =>
  fetch(`${API_BASE}/pdf/info`, { method: 'POST', headers: getHeaders(token), body: formData }).then(r => r.json());

export const exportUserData = (token) => fetch(`${API_BASE}/user/export`, { headers: getHeaders(token) });
export const deleteAccount = (token) => fetch(`${API_BASE}/user/delete`, { method: 'DELETE', headers: getHeaders(token) });
