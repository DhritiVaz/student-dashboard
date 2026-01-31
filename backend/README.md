# Student Dashboard API

Node.js + Express + PostgreSQL authentication backend. Passwords are hashed with bcrypt; JWT is issued on login and stored in an HTTP-only, secure cookie.

## Setup

Copy `.env.example` to `.env`, set `DATABASE_URL` and `JWT_SECRET`, then run `npm install`, `npm run db:init`, and `npm run dev`. API runs at `http://localhost:4000`; the frontend proxies `/api` when using `npm run dev` in the project root.

**Existing databases:** If you added this project before `semesters` and `property_definitions` were added, run `npm run db:init` again. The schema uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` so your data is preserved and the new columns are added.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register (body: email, password, name, studentId?, department?) |
| POST | `/api/auth/login` | No | Login (body: email, password). Sets HTTP-only cookie with JWT. |
| POST | `/api/auth/logout` | No | Clears auth cookie |
| GET | `/api/auth/me` | Cookie | Returns current user (verifies JWT) |
| PATCH | `/api/auth/profile` | Cookie | Update name, studentId, department |

Private routes require the `auth_token` cookie (set on login). All auth responses use JSON; errors use `{ error: "message" }`.
