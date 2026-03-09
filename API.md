# API Reference

## Base URL

```
http://localhost:5000
```

For production, replace with your deployment domain (e.g., `https://your-app.herokuapp.com`).

---

## Authentication

All conversion and user endpoints require a valid JWT token. The token is issued as an httpOnly cookie (`token`) after a successful Google OAuth callback. The backend reads the cookie automatically on each request.

If you are making requests from a non-browser client, pass the token as a Bearer header:

```
Authorization: Bearer <token>
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `400` | Bad request — missing or invalid parameters |
| `401` | Unauthorized — missing, invalid, or expired JWT token |
| `413` | Payload too large — file exceeds the 50 MB limit |
| `429` | Too many requests — rate limit exceeded (100 requests per 15 minutes per IP) |
| `500` | Internal server error — conversion or server failure |

All error responses share the same JSON shape:

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional context"
}
```

---

## Rate Limiting

- **Limit:** 100 requests per IP per 15-minute rolling window (configurable via `RATE_LIMIT_MAX`)
- **Headers returned:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- When exceeded, the server returns `HTTP 429` with a JSON error body.

---

## Auth Endpoints

### GET /api/auth/google-url

Returns the Google OAuth 2.0 authorization URL. Redirect the user's browser to this URL to begin the sign-in flow.

**Authentication required:** No

**Response**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

### POST /api/auth/google-callback

Exchanges the Google authorization code for a JWT token. Call this endpoint with the `code` query parameter that Google appends to the redirect URI.

**Authentication required:** No

**Request body**

```json
{
  "code": "4/0AfJohXmA..."
}
```

**Response**

Sets an httpOnly cookie (`token`) and returns:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "Jane Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | `code` not provided in the request body |
| `500` | Google token exchange failed or user info unavailable |

---

### POST /api/auth/logout

Clears the httpOnly auth cookie and ends the session.

**Authentication required:** No (works regardless of auth state)

**Request body:** None

**Response**

```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

Returns the currently authenticated user's profile.

**Authentication required:** Yes

**Response**

```json
{
  "id": "1234567890",
  "email": "user@example.com",
  "name": "Jane Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401` | Token missing or invalid |

---

## Conversion Endpoints

All conversion endpoints:
- Require authentication
- Accept `multipart/form-data`
- Return the converted file as a binary download (`Content-Disposition: attachment`)
- Maximum file size: **50 MB** per file

---

### POST /api/convert/pdf-to-image

Converts each page of a PDF into a single image (ZIP archive for multi-page PDFs, or a single image file for one-page PDFs).

**Authentication required:** Yes

**Request** (`multipart/form-data`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF file to convert |
| `quality` | String | No | `low`, `medium`, or `high` (default: `high`) |
| `format` | String | No | `png` or `jpeg` (default: `png`) |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/convert/pdf-to-image \
  -H "Cookie: token=<jwt>" \
  -F "file=@document.pdf" \
  -F "quality=high" \
  -F "format=png" \
  --output result.png
```

**Response:** Binary file download

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | No file uploaded |
| `500` | Conversion failed (ImageMagick / Ghostscript error) |

---

### POST /api/convert/image-to-pdf

Converts one or more images into a single PDF document. Images are added to the PDF in the order they are uploaded.

**Authentication required:** Yes

**Request** (`multipart/form-data`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | One or more image files (JPEG, PNG, WEBP, GIF) |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/convert/image-to-pdf \
  -H "Cookie: token=<jwt>" \
  -F "files=@page1.png" \
  -F "files=@page2.jpg" \
  --output document.pdf
```

**Response:** Binary PDF file download

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | No files uploaded |
| `500` | Conversion failed |

---

### POST /api/convert/compress-pdf

Reduces the file size of a PDF using Ghostscript.

**Authentication required:** Yes

**Request** (`multipart/form-data`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF file to compress |
| `level` | String | No | `low`, `medium`, or `high` — compression aggressiveness (default: `medium`) |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/convert/compress-pdf \
  -H "Cookie: token=<jwt>" \
  -F "file=@large.pdf" \
  -F "level=high" \
  --output compressed.pdf
```

**Response:** Binary PDF file download

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | No file uploaded |
| `500` | Compression failed |

---

### POST /api/convert/split-pdf

Extracts a page range from a PDF and returns a new PDF containing only those pages.

**Authentication required:** Yes

**Request** (`multipart/form-data`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF file to split |
| `pageRange` | String | Yes | Page range to extract, e.g. `1-3`, `2`, `4-7` |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/convert/split-pdf \
  -H "Cookie: token=<jwt>" \
  -F "file=@document.pdf" \
  -F "pageRange=2-5" \
  --output pages_2_to_5.pdf
```

**Response:** Binary PDF file download

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | No file uploaded, or `pageRange` not provided |
| `500` | Split failed |

---

### POST /api/convert/merge-pdfs

Merges two or more PDF files into a single PDF. Files are merged in the order they are uploaded.

**Authentication required:** Yes

**Request** (`multipart/form-data`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Two or more PDF files to merge |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/convert/merge-pdfs \
  -H "Cookie: token=<jwt>" \
  -F "files=@part1.pdf" \
  -F "files=@part2.pdf" \
  -F "files=@part3.pdf" \
  --output merged.pdf
```

**Response:** Binary PDF file download

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | Fewer than 2 files uploaded |
| `500` | Merge failed |

---

## User Endpoints

### GET /api/user/export

Exports all data associated with the authenticated user (GDPR data portability). Returns a JSON document.

**Authentication required:** Yes

**Response**

```json
{
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "Jane Doe"
  },
  "exportedAt": "2026-03-09T12:00:00.000Z"
}
```

---

### DELETE /api/user/delete

Permanently deletes the authenticated user's account and all associated data. This action is irreversible.

**Authentication required:** Yes

**Response**

```json
{
  "message": "Account deleted successfully"
}
```

---

## Utility Endpoints

### POST /api/pdf/info

Returns metadata about a PDF file (page count, title, author, dimensions, etc.) without converting it.

**Authentication required:** Yes

**Request** (`multipart/form-data`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF file to inspect |

**Response**

```json
{
  "pages": 12,
  "title": "Annual Report",
  "author": "Jane Doe",
  "creator": "Microsoft Word",
  "fileSize": 204800,
  "pageSize": "A4"
}
```

---

### GET /api/health

Liveness check endpoint. Used by Docker health checks and monitoring tools.

**Authentication required:** No

**Response**

```json
{
  "status": "ok",
  "timestamp": "2026-03-09T12:00:00.000Z"
}
```
