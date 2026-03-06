# ⚡ QuizBlitz – Kahoot-like Real-time Quiz Game

A fully-featured multiplayer quiz game inspired by Kahoot, built with **Node.js**, **Express**, and **Socket.io**.

---

## Features

- 🎮 **Host a game** – create custom quizzes with multiple-choice questions
- 🙋 **Players join** with a 6-digit PIN and a nickname
- ⏱ **Live countdown timer** per question
- 🎯 **Scoring** – faster correct answers earn more points
- 📊 **Live leaderboard** after each question
- 🏆 **Final results** screen at the end

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (≥ 16) |
| Web framework | Express 4 |
| Real-time | Socket.io 4 |
| Frontend | Vanilla HTML/CSS/JS |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (auto-reload)
npm run dev

# 3. Or start normally
npm start
```

Open **http://localhost:3000** in your browser.

---

## How to Play

### Hosting a game
1. Go to `http://localhost:3000` and click **Host a Game**.
2. Add questions (text, four answer options, pick the correct one, set a time limit).
3. Click **Create Game** – you'll get a **6-digit PIN**.
4. Share the PIN with players, then click **▶ Start Game**.
5. After each question, review the leaderboard and click **Next Question**.

### Joining a game
1. Go to `http://localhost:3000` and click **Join a Game**.
2. Enter the PIN and choose a nickname.
3. Wait in the lobby until the host starts.
4. Tap an answer before the timer runs out – faster = more points!

---

## Deploying to a Free Host

### Render.com (recommended)

1. Push this repository to GitHub.
2. Sign up at [render.com](https://render.com) (free tier available).
3. Click **New → Web Service** and connect your GitHub repo.
4. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Click **Deploy** – Render will give you a public URL.

### Railway.app

1. Sign up at [railway.app](https://railway.app).
2. Click **New Project → Deploy from GitHub repo**.
3. Select the repository – Railway auto-detects Node.js and runs `npm start`.

---

## Project Structure

```
.
├── server.js           # Express + Socket.io server (game logic)
├── package.json
└── public/
    ├── index.html      # Player landing / join page
    ├── host.html       # Host: create & run games
    ├── css/
    │   └── style.css   # All styles
    └── js/
        ├── play.js     # Player client logic
        └── host.js     # Host client logic
```

---

## License

MIT
