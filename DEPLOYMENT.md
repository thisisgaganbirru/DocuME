# Deployment Guide

This document covers three deployment targets: local development, Docker, and Heroku.

---

## Local Development

### 1. Clone and configure

```bash
git clone <repo-url>
cd DocuME
cp .env.example .env
```

Open `.env` and set at minimum:

```
GOOGLE_CLIENT_ID=<your Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<your Google OAuth client secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google-callback
JWT_SECRET=<random string, at least 32 characters>
FRONTEND_URL=http://localhost:3000
```

### 2. Install Node dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 3. Install system dependencies (Ubuntu / Debian)

```bash
sudo apt-get update
sudo apt-get install -y imagemagick ghostscript qpdf poppler-utils
```

For macOS (Homebrew):

```bash
brew install imagemagick ghostscript qpdf poppler
```

### 4. Start the development server

```bash
npm run dev:full
```

The Express API runs on `http://localhost:5000` and the React dev server on `http://localhost:3000`.

---

## Docker

### Prerequisites

- Docker 20.10+
- Docker Compose 2.x

### 1. Set environment variables

Create a `.env` file in the repository root (Docker Compose reads it automatically):

```bash
cp .env.example .env
# Edit .env — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, etc.
```

### 2. Build and start

```bash
docker-compose up --build
```

The application is accessible at `http://localhost:5000`.

To run in detached mode:

```bash
docker-compose up --build -d
```

### 3. Stop and remove containers

```bash
docker-compose down
```

To also remove the named volumes (uploads, processed, logs):

```bash
docker-compose down -v
```

### Notes

- The `docker-compose.yml` file is located in `docker/`. Run `docker-compose` from the `docker/` directory, or use `docker-compose -f docker/docker-compose.yml up --build` from the repository root.
- Named volumes (`uploads`, `processed`, `logs`) persist between container restarts but not between `docker-compose down -v` runs.
- The container runs a health check against `GET /api/health` every 30 seconds.

---

## Heroku

### Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and authenticated
- Git remote pointing at Heroku

### 1. Create the Heroku application

```bash
heroku create your-app-name
```

### 2. Add the Node.js buildpack

```bash
heroku buildpacks:add heroku/nodejs
```

### 3. Add the APT buildpack for system dependencies

ImageMagick, Ghostscript, qpdf, and poppler-utils are not available by default on Heroku dynos. Use [heroku-buildpack-apt](https://github.com/heroku/heroku-buildpack-apt):

```bash
heroku buildpacks:add --index 1 heroku-community/apt
```

Create an `Aptfile` in the repository root:

```
imagemagick
ghostscript
qpdf
poppler-utils
```

### 4. Set environment variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<strong-random-secret>
heroku config:set GOOGLE_CLIENT_ID=<your-client-id>
heroku config:set GOOGLE_CLIENT_SECRET=<your-client-secret>
heroku config:set GOOGLE_REDIRECT_URI=https://your-app-name.herokuapp.com/api/auth/google-callback
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com
heroku config:set LOG_LEVEL=info
heroku config:set RATE_LIMIT_MAX=100
heroku config:set MAX_FILE_SIZE=52428800
```

### 5. Deploy

```bash
git push heroku main
```

### 6. Open the application

```bash
heroku open
```

### Notes

- Heroku dynos have an ephemeral filesystem. Uploaded and processed files are deleted on every dyno restart. The built-in 1-hour cron cleanup ensures files are removed well before restarts, but do not rely on the filesystem for any persistent storage.
- Update your Google Cloud Console OAuth credentials to include the Heroku redirect URI.
- Scale dynos as needed: `heroku ps:scale web=1`.

---

## Environment Variables Checklist

Before deploying to any environment, verify the following variables are set:

- [ ] `NODE_ENV` — set to `production` for all non-development deployments
- [ ] `PORT` — set by Heroku automatically; override only if needed
- [ ] `GOOGLE_CLIENT_ID` — from Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- [ ] `GOOGLE_REDIRECT_URI` — must exactly match the URI registered in Google Cloud Console
- [ ] `JWT_SECRET` — strong random string (minimum 32 characters); never reuse across environments
- [ ] `FRONTEND_URL` — production domain; used for CORS origin allowlist
- [ ] `LOG_LEVEL` — `info` or `warn` recommended for production
- [ ] `RATE_LIMIT_MAX` — tune based on expected traffic
- [ ] `MAX_FILE_SIZE` — 50 MB (52428800) default; adjust as required

---

## Post-Deployment Security Checklist

- [ ] `NODE_ENV` is `production` (enables secure cookies, disables stack traces in error responses)
- [ ] `JWT_SECRET` is a cryptographically random string, not the default placeholder
- [ ] HTTPS is enforced — terminate TLS at the load balancer or reverse proxy (Heroku provides this automatically)
- [ ] Google OAuth redirect URI is restricted to the production domain in Google Cloud Console
- [ ] `FRONTEND_URL` matches the exact production origin (no trailing slash)
- [ ] Rate limiting is active — verify `RATE_LIMIT_MAX` is appropriate
- [ ] File upload directory (`uploads/`) is not served as a static directory
- [ ] Logs do not contain sensitive user data (file content, tokens)
- [ ] Health check endpoint (`GET /api/health`) returns `200 OK`
- [ ] Confirm automatic file cleanup cron is running (check logs for cleanup messages every hour)
