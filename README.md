# CRACOE CONNECT

Enterprise Mobile Governance & Task Management System

## Architecture Overview
Mobile App (React Native + Expo)
→ Backend API (NestJS)
→ PostgreSQL (Prisma ORM)
→ Redis (Bull)
→ SendGrid (Email)
→ Firebase (Auth + FCM)

## Monorepo Layout
- backend/ NestJS API + Prisma
- mobile/ React Native (Expo)

## Key Features
- Google Sign-In only with @cracoe.com restriction
- Firebase ID token verification, server-side JWT
- Role-based access control (CEO, COE, COO, DEV, TESTER)
- Task management, announcements, reminders
- Cron scheduler (hourly) for urgent reminders

## Deployment
### Backend
- Dockerized NestJS service
- Environment variables via .env
- PostgreSQL managed (Supabase/AWS RDS)
- Redis managed (Upstash/Elasticache)

### Mobile
- Expo EAS build and store distribution

## Environment Variables (Backend)
- DATABASE_URL=
- REDIS_URL=
- JWT_SECRET=
- FIREBASE_PROJECT_ID=
- FIREBASE_CLIENT_EMAIL=
- FIREBASE_PRIVATE_KEY=
- SENDGRID_API_KEY=
- SENDGRID_FROM_EMAIL=
- ALLOWED_DOMAIN=cracoe.com

## Notes
See backend/ for API, schema, and scheduler.
See mobile/ for screens, navigation, and services.
