# ⚡ QuizBlitz — Real-time Multiplayer Quiz

## Tech Stack
- **Next.js 14** (App Router)
- **Socket.io** (real-time multiplayer)
- **Node.js** custom server

## Features
- 🎮 Host creates a room with a unique code
- 🙋 Players join with the code + nickname
- ⚡ Live competing — 15s timer per question
- 🏆 Speed bonus — faster answers = more points
- 📊 Leaderboard after each question
- 🎯 8 built-in questions (easily extendable)

## Setup & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How to Play
1. One person clicks **Host a Game** → gets a room code
2. Others click **Join a Game** → enter the code
3. Host clicks **Start Game** when everyone is in
4. Answer questions as fast as possible!
5. Leaderboard shows after each question

## Project Structure
```
quiz-app/
├── server.js          # Custom Node server + Socket.io game logic
├── app/
│   ├── page.js        # Home (host or join)
│   ├── host/page.js   # Host dashboard
│   ├── play/page.js   # Player view
│   └── globals.css    # All styles
└── lib/
    └── socket.js      # Socket.io client hook
```
