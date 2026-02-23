---
name: server-restart
description: Use when the VibeLint dev server needs to be started, restarted, or when port 3847 is already in use.
---

# Server Restart

Starts (or restarts) the VibeLint development server on port 3847.

**Core principle:** Always kill before start. Never leave orphan processes.

## Trigger

`/server-restart` OR when the dev server is unresponsive, crashed, port 3847 is busy, or needs a fresh start.

## Announcement

When using this skill, state: "I'm using the server-restart skill to start the VibeLint dev server."

## Action

Run the dev script in the background:

```bash
npm run dev
```

The `dev` script handles cleanup automatically:
1. Kills any existing process on port 3847
2. Starts `tsx watch bin/vibelint.ts --no-open` on port 3847

YOU MUST run this command in the background so it does not block the conversation.

## Verification

IMMEDIATELY after starting, check the output to confirm:
- Look for: `Server listening at http://127.0.0.1:3847`
- If port is still busy after the script runs, escalate to the user

## Ports

| Service | Port | URL |
|:--------|:-----|:----|
| Fastify API server | 3847 | http://localhost:3847 |
| Vite dev server | 5173 | http://localhost:5173 |

The Vite dev server (port 5173) proxies `/api` requests to Fastify (port 3847). For full-stack dev, both must be running. To start Vite separately: `npm run dev:client`.
