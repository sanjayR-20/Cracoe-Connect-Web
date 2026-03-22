# Cracoe Meet Networking Blueprint

## Objective
Deliver a production-ready meeting foundation for Cracoe Connect with original in-house implementation over WebRTC + custom signaling.

## Implemented in this change
- Migrated web meeting signaling from Supabase broadcast to dedicated backend WebSocket signaling (`/ws`).
- Added room roster sync (`peers`, `peer-joined`, `peer-left`) and participant metadata/state sync (`peer-updated`).
- Added targeted and broadcast signaling messages for SDP/ICE/chat/control events.
- Added deterministic offerer selection to reduce offer-collision issues.
- Added TURN-ready ICE configuration using environment variables.
- Added server room-capacity guard (`SIGNALING_MAX_PARTICIPANTS`) and connection heartbeat.
- Added server-authoritative host controls for room locks (`lockAudio`, `lockVideo`) so non-host clients cannot override host policy.
- Added server-side host failover and settings sync broadcasts when host disconnects.
- Added screen-share state propagation so remote rendering can keep displaying shared content even when camera is off.

## Environment configuration
### Frontend (`web/.env`)
- `REACT_APP_SIGNALING_URL`
- Optional TURN:
- `REACT_APP_TURN_URLS` (comma-separated)
- `REACT_APP_TURN_USERNAME`
- `REACT_APP_TURN_CREDENTIAL`

### Backend (`web/backend/.env`)
- `SIGNALING_MAX_PARTICIPANTS=12` (adjust based on infra + client limits)

## Architecture notes
- Media path remains WebRTC peer-to-peer for now.
- Signaling path is centralized through NestJS WebSocket server.
- This gives immediate reliability improvements, but very large meetings still require SFU infrastructure for true Meet/Zoom scale.

## IP note
All newly added signaling/client integration logic in this repository is custom implementation for Cracoe Connect.
Third-party frameworks and dependencies retain their respective licenses.

## Reference documents reviewed
- Google Meet host/viewer control model: https://support.google.com/meet/answer/13658394?hl=en
- Google Meet host control for locking audio/video: https://support.google.com/meet/answer/11274707?hl=en
- Zoom in-meeting security controls: https://support.zoom.com/hc/en/article?id=zm_kb&mobile_site=true&sysparm_article=KB0061231
- WebRTC perfect negotiation pattern: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
- WebRTC candidate-pair stats for network quality: https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidatePairStats
