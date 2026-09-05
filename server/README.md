# CyberLens — Express Backend

Orchestrator for the CyberLens phishing-detection capstone. Handles auth,
scan history storage (MongoDB), and forwards scan requests to the Python
ML microservice.

## Setup

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev             # requires nodemon (installed as a devDependency)
```

MongoDB: use a free MongoDB Atlas cluster and paste its connection string
into `MONGO_URI`, or run `mongod` locally and use
`mongodb://localhost:27017/cyberlens`.

## API Reference

| Method | Route              | Auth | Description                          |
|--------|--------------------|------|--------------------------------------|
| POST   | /api/auth/register | No   | Create account, returns JWT          |
| POST   | /api/auth/login    | No   | Login, returns JWT                   |
| GET    | /api/auth/me       | Yes  | Current user profile                 |
| POST   | /api/scan          | Yes  | Submit page for scan (extension)     |
| GET    | /api/history       | Yes  | Paginated scan history (dashboard)   |
| GET    | /api/history/:id   | Yes  | Single scan detail                   |

All authenticated routes expect `Authorization: Bearer <token>`.

### POST /api/scan — request body
```json
{
  "url": "https://example.com/login",
  "domHtml": "<html>...</html>",
  "forms": [],
  "scripts": []
}
```

### POST /api/scan — response
```json
{
  "scanId": "665f...",
  "status": "complete",
  "riskScore": 82,
  "verdict": "high risk",
  "reasons": ["Domain registered 4 days ago", "Login form posts to a different domain"]
}
```

## Notes

- If `ML_SERVICE_URL` is unreachable, `utils/mlService.js` falls back to a
  keyword-based **mock** response so the extension → backend → dashboard
  flow can be built and demoed before the FastAPI service exists. Swap
  this out once the real service is live — no other file needs to change.
- Passwords are hashed with bcrypt; the hash is stripped from every JSON
  response via the User schema's `toJSON` transform.
- `domHtmlSnapshot` is stored but excluded from queries by default
  (`select: false`) to keep `/api/history` responses light.
