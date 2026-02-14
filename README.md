# ShopeePilot 2026

Monorepo bootstrap for ShopeePilot MVP.

## Stack
- Mobile: React Native (Expo)
- Backend: Node.js + Express + Prisma
- Database: MySQL
- External integrations: mocked (TikTok downloader / Shopee search)

## MVP Priorities Implemented
1. User auth (register/login with JWT)
2. Shopee account setup + daily posting limits
3. Creator monitoring setup + mock "check now"
4. Video intake by TikTok URL

## Project Structure
- `backend/`: Express API + Prisma schema
- `mobile/`: React Native app scaffold consuming API

## Where to see development
This project is **mobile-first**.

### Backend (API)
Run the backend server and open:
- `http://localhost:4000/health` → should return `{ "ok": true }`

API base URL during development:
- `http://localhost:4000`

### Mobile (React Native via Expo)
Run Expo from `mobile/` and then:
- Press `w` to open **Expo Web** (browser preview)
- Scan QR with Expo Go for physical device testing
- Use Android/iOS simulator if installed

By default Expo DevTools is usually available at:
- `http://localhost:8081`

> So yes: you’ll use **localhost** for both backend and Expo local dev tooling.

## Quick Start
### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
# create DB + tables
npx prisma migrate dev --name init
npm run dev
```

### 2) Mobile
```bash
cd mobile
npm install
npm run start
```
Then press `w` for web preview, or open on a simulator/device.

## First end-to-end check
1. Confirm backend is live:
   - `GET http://localhost:4000/health`
2. Register user:
   - `POST http://localhost:4000/auth/register`
3. Login and copy JWT:
   - `POST http://localhost:4000/auth/login`
4. Use `Authorization: Bearer <token>` for:
   - `POST /accounts`
   - `POST /creators`
   - `POST /creators/:id/check`
   - `POST /videos/intake`

## Notes
- Configure a MySQL database and update `DATABASE_URL` in `backend/.env`.
- TikTok/Shopee integrations are mock services for MVP iteration.
- If you want, next step I can implement real mobile screens (Auth, Accounts, Creators, Video Intake) and connect them to these APIs.
