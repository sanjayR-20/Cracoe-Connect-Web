# Render Deployment Guide (Meet + Full App)

This guide deploys:
- Frontend (`cracoe-connect-web`) as a Render Static Site
- Signaling backend (`cracoe-connect-signaling`) as a Render Web Service

The Meet feature needs both services.

## 1) Use this branch

This deployment setup is prepared in branch:
- `codex/render-meet-deploy`

Push branch:

```bash
cd "E:\Cracoe connect\web"
git push -u origin codex/render-meet-deploy
```

## 2) Create services in Render using Blueprint

1. Open [https://dashboard.render.com](https://dashboard.render.com)
2. Click `New` -> `Blueprint`
3. Connect GitHub and choose repo: `sanjayR-20/Cracoe-Connect-Web`
4. Select branch: `codex/render-meet-deploy`
5. Render auto-detects `render.yaml` and creates 2 services.

## 3) Fill environment variables when prompted

### Backend service: `cracoe-connect-signaling`

Required:
- `DATABASE_URL` = your Supabase Postgres connection string
- `JWT_SECRET` = any long random secret string

Recommended:
- `ALLOWED_DOMAIN=cracoe.com`
- `SIGNALING_MAX_PARTICIPANTS=12` (increase only after load testing)

Optional (only if you use these features):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `REDIS_URL`

### Frontend service: `cracoe-connect-web`

Required:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_SIGNALING_URL`

Set signaling URL exactly like:

```text
wss://<your-backend-service>.onrender.com/ws
```

Optional TURN variables for better cross-network call quality:
- `REACT_APP_TURN_URLS`
- `REACT_APP_TURN_USERNAME`
- `REACT_APP_TURN_CREDENTIAL`

## 4) Wait for deployment to finish

Render builds backend first, then frontend. After both are green:

- Backend health check: `https://<your-backend-service>.onrender.com/health`
- Frontend opens at: `https://<your-frontend-service>.onrender.com`

## 5) Final Meet wiring check

1. Open frontend app.
2. Create a meeting.
3. Share the generated meet link in messages/announcements.
4. Open link in a second browser/incognito window.
5. Confirm join works from link and both users connect.

If call connects but no media flows across strict NAT, configure TURN values.

## 6) If meeting shows "Failed to initialize meeting connection"

Check:
- `REACT_APP_SIGNALING_URL` starts with `wss://` in production
- URL includes `/ws` path
- Backend service is live and health endpoint works
- Browser console has no mixed-content block (https page cannot use ws://)

## 7) Redeploy after any env change

In each Render service:
- `Manual Deploy` -> `Deploy latest commit`

Render only injects new env values into a fresh deploy.
