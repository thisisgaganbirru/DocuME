# PDF Converter Pro

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue)

A secure, privacy-first PDF conversion platform with Google OAuth authentication and five powerful conversion tools. Files are automatically deleted after one hour — no data is retained.

---

## Features

- [x] PDF to Image (PNG/JPEG, configurable quality)
- [x] Image to PDF (multi-file, ordered merge)
- [x] PDF Compression (low / medium / high levels)
- [x] PDF Split (extract a page range)
- [x] PDF Merge (combine two or more PDFs)
- [x] Google OAuth 2.0 authentication
- [x] JWT session tokens stored in httpOnly cookies
- [x] Automatic file deletion after 1 hour (cron job)
- [x] Rate limiting and security headers (Helmet)
- [x] MIME type + magic-byte file validation
- [x] UUID-based file naming (no original filenames on disk)
- [x] GDPR / CCPA / HIPAA-ready privacy model
- [x] Structured audit logging (Winston)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd DocuME

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Google OAuth credentials and a strong JWT_SECRET

# 3. Start the development server (backend + frontend concurrently)
npm run dev:full
```

> See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker and Heroku instructions.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | LTS recommended |
| npm | 8+ | Bundled with Node.js |
| ImageMagick | Any recent | PDF-to-image conversion |
| Ghostscript | Any recent | PDF rendering and compression |
| qpdf | Any recent | PDF splitting and merging |
| poppler-utils | Any recent | PDF information extraction (`pdfinfo`) |

### Install system dependencies (Ubuntu / Debian)

```bash
sudo apt-get update
sudo apt-get install -y imagemagick ghostscript qpdf poppler-utils
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment (`development` / `production`) |
| `PORT` | No | `5000` | Port the Express server listens on |
| `GOOGLE_CLIENT_ID` | Yes | — | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | — | Google OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | Yes | `http://localhost:5000/api/auth/google-callback` | OAuth redirect URI (must match Google Console) |
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens (min 32 chars in production) |
| `FRONTEND_URL` | No | `http://localhost:3000` | React dev server URL (used for CORS) |
| `LOG_LEVEL` | No | `info` | Winston log level (`error` / `warn` / `info` / `debug`) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per IP per 15-minute window |
| `MAX_FILE_SIZE` | No | `52428800` | Maximum upload size in bytes (default 50 MB) |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the production server (`node server.js`) |
| `npm run dev` | Start the backend in watch mode (`nodemon`) |
| `npm run client` | Start the React development server |
| `npm run dev:full` | Start backend + frontend concurrently (recommended for development) |

---

## Architecture Overview

```
DocuME/
├── server.js                  # Express entry point — middleware, routes, health check
├── backend/
│   ├── config/                # Centralised config (reads from .env)
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   ├── fileValidation.js  # MIME + magic-byte validation
│   │   ├── rateLimiter.js     # express-rate-limit configuration
│   │   └── security.js        # Helmet + CORS options
│   ├── routes/
│   │   ├── auth.js            # /api/auth — OAuth + JWT endpoints
│   │   ├── convert.js         # /api/convert — 5 conversion endpoints
│   │   ├── pdfInfo.js         # /api/pdf — PDF metadata
│   │   └── user.js            # /api/user — data export + deletion
│   ├── services/              # Conversion logic (pdfToImage, imageToPdf, etc.)
│   └── utils/                 # Logger, file cleanup cron, audit log
├── client/                    # React 18 frontend (Create React App)
│   └── src/
│       ├── components/        # Dashboard, ConversionTool, FileUpload, StatusDisplay
│       └── services/api.js    # Axios wrapper for all API calls
├── docker/                    # Dockerfile, docker-compose.yml, .dockerignore
├── uploads/                   # Temporary upload directory (auto-cleaned)
└── processed/                 # Temporary output directory (auto-cleaned)
```

The backend is a stateless Express API. The React frontend communicates with it over a local proxy (development) or the same origin (production, after `npm run build`). Authentication state is maintained through an httpOnly JWT cookie. All uploaded and processed files are stored temporarily on disk and purged by a cron job that runs every hour.

---

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step guides covering:
- Local production build
- Docker / docker-compose
- Heroku

---

## API Reference

See [API.md](API.md) for the full endpoint reference including request/response examples.

---

## Security

See [SECURITY.md](SECURITY.md) for details on authentication flow, file handling security, rate limiting, CORS policy, and GDPR compliance.
