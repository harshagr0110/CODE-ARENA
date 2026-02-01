# Socket.IO Server for Code Arena

This is the real-time socket server for Code Arena multiplayer games.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start locally:
```bash
npm start
```

Server runs on port 3001.

## Deployment

### Deploy to Railway.app (Recommended)

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project → Deploy from GitHub
4. Select this repository
5. Railway will detect Node.js automatically
6. Set environment variables:
   - `NEXT_PUBLIC_APP_URL` - Your Vercel app URL (https://your-app.vercel.app)
7. Deploy!

Railway will give you a URL like: `https://your-socket-server.railway.app`

### Deploy to Render.com

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repo
4. Set Start Command: `npm start`
5. Set Port: `3001`
6. Deploy!

## Environment Variables

- `PORT` - Port to run on (default: 3001)
- `NEXT_PUBLIC_APP_URL` - Main app URL for calling game-end API (e.g., https://your-app.vercel.app)
- `VERCEL_URL` - Auto-populated by Vercel (fallback for NEXT_PUBLIC_APP_URL)

## Events

- `join-room` - Player joins a room
- `leave-room` - Player leaves a room
- `game-started` - Game starts with countdown
- `code-submitted` - Player submits code
- `game-winner` - Winner determined
- `time-expired` - Game time expires

## Connecting from Frontend

Set this in your Vercel environment variables:
```
NEXT_PUBLIC_SOCKET_IO_URL=https://your-socket-server.railway.app
```
