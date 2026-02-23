# Backend Feature Checklist (Local Storage Mode)

This project is currently using **local in-memory storage** (no MongoDB required).

## Core Features Checklist

- [x] Google OAuth login
- [x] Logged-in users can create Events / Courses
- [x] Each Event has a Feedback Form
- [x] Questions support Ratings (core) + optional text
- [x] Public feedback submission is available

## Event Dashboard Checklist

- [x] Average rating per event
- [x] Total responses per event
- [x] Rating distribution (chart-ready analytics data)

## Important Note

- MongoDB-related setup is intentionally ignored for this mode.
- Backend runs with local in-memory data while developing locally.

## Run Credentials and Env

Use local backend env in `backend/.env`:

```env
PORT=5000
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Login options in app:

1. Demo login:
- Email: `demo@chiac.local`
- Password: `Demo@123`

2. Normal login:
- Register a new account from frontend `/register`
- Then sign in from `/login`

Google login:
- Works only when `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) are both set.

Security:
- Keep real values only in local `.env`.
- Do not commit real secrets in `.env.example` files.
