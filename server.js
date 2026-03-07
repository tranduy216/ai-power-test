const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory game state ─────────────────────────────────────────────────────
// games[pin] = { hostId, questions, players, state, currentQ, timer }
const games = {};

function generatePin() {
  let pin;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (games[pin]);
  return pin;
}

function calcScore(timeLeft, maxTime) {
  const BASE = 1000;
  return Math.round(BASE * (timeLeft / maxTime));
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // ── HOST: create a new game ──────────────────────────────────────────────
  socket.on('create_game', ({ questions }) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      socket.emit('error_msg', 'You must provide at least one question.');
      return;
    }
    const pin = generatePin();
    games[pin] = {
      hostId: socket.id,
      questions,
      players: {},   // { socketId: { name, score, answered } }
      state: 'lobby',
      currentQ: -1,
      timer: null
    };
    socket.join(pin);
    socket.emit('game_created', { pin });
    console.log(`Game created: PIN=${pin}`);
  });

  // ── PLAYER: join a game ──────────────────────────────────────────────────
  socket.on('join_game', ({ pin, name }) => {
    const game = games[pin];
    if (!game) {
      socket.emit('join_error', 'Game not found. Check the PIN and try again.');
      return;
    }
    if (game.state !== 'lobby') {
      socket.emit('join_error', 'This game has already started.');
      return;
    }
    const trimmed = String(name).trim().slice(0, 20);
    if (!trimmed) {
      socket.emit('join_error', 'Please enter a valid nickname.');
      return;
    }
    const nameTaken = Object.values(game.players).some(p => p.name === trimmed);
    if (nameTaken) {
      socket.emit('join_error', 'That nickname is already taken.');
      return;
    }

    game.players[socket.id] = { name: trimmed, score: 0, answered: false };
    socket.join(pin);
    socket.emit('joined_game', { pin, name: trimmed });

    const playerList = Object.values(game.players).map(p => p.name);
    io.to(pin).emit('player_list', { players: playerList });
    console.log(`${trimmed} joined PIN=${pin}`);
  });

  // ── HOST: start the game ─────────────────────────────────────────────────
  socket.on('start_game', ({ pin }) => {
    const game = games[pin];
    if (!game || game.hostId !== socket.id) return;
    if (Object.keys(game.players).length === 0) {
      socket.emit('error_msg', 'Wait for at least one player to join.');
      return;
    }
    game.state = 'playing';
    io.to(pin).emit('game_started');
    sendNextQuestion(pin);
  });

  // ── HOST: kick off the next question ─────────────────────────────────────
  socket.on('next_question', ({ pin }) => {
    const game = games[pin];
    if (!game || game.hostId !== socket.id) return;
    sendNextQuestion(pin);
  });

  // ── PLAYER: submit an answer ──────────────────────────────────────────────
  socket.on('submit_answer', ({ pin, answerIndex, timeLeft }) => {
    const game = games[pin];
    if (!game || game.state !== 'question') return;
    const player = game.players[socket.id];
    if (!player || player.answered) return;

    player.answered = true;
    const q = game.questions[game.currentQ];
    const correct = answerIndex === q.correctIndex;
    const maxTime = q.timeLimit || 20;

    if (correct) {
      const earned = calcScore(timeLeft, maxTime);
      player.score += earned;
      socket.emit('answer_result', { correct: true, earned, score: player.score });
    } else {
      socket.emit('answer_result', { correct: false, earned: 0, score: player.score });
    }

    // check if all players answered
    const allAnswered = Object.values(game.players).every(p => p.answered);
    if (allAnswered) {
      endQuestion(pin);
    }
  });

  // ── Disconnect cleanup ───────────────────────────────────────────────────
  socket.on('disconnect', () => {
    for (const [pin, game] of Object.entries(games)) {
      if (game.hostId === socket.id) {
        io.to(pin).emit('host_disconnected');
        clearTimeout(game.timer);
        delete games[pin];
        console.log(`Game PIN=${pin} ended (host disconnected)`);
        break;
      }
      if (game.players[socket.id]) {
        const name = game.players[socket.id].name;
        delete game.players[socket.id];
        const playerList = Object.values(game.players).map(p => p.name);
        io.to(pin).emit('player_list', { players: playerList });
        console.log(`${name} left PIN=${pin}`);

        // if game is in question phase and all remaining answered, end question
        if (game.state === 'question' && Object.keys(game.players).length > 0) {
          const allAnswered = Object.values(game.players).every(p => p.answered);
          if (allAnswered) endQuestion(pin);
        }
      }
    }
  });
});

// ─── Game logic helpers ───────────────────────────────────────────────────────

function sendNextQuestion(pin) {
  const game = games[pin];
  if (!game) return;

  game.currentQ += 1;
  if (game.currentQ >= game.questions.length) {
    endGame(pin);
    return;
  }

  const q = game.questions[game.currentQ];
  const timeLimit = q.timeLimit || 20;

  // reset answered flags
  Object.values(game.players).forEach(p => { p.answered = false; });

  game.state = 'question';

  const payload = {
    index: game.currentQ,
    total: game.questions.length,
    question: q.question,
    options: q.options,
    timeLimit
  };

  // Send question to host WITH correct answer highlighted
  io.to(game.hostId).emit('question_start', { ...payload, correctIndex: q.correctIndex });
  // Send question to players WITHOUT correct answer
  Object.keys(game.players).forEach(sid => {
    io.to(sid).emit('question_start', payload);
  });

  console.log(`PIN=${pin} Q${game.currentQ + 1}: ${q.question}`);

  // Auto-end question when timer runs out
  game.timer = setTimeout(() => endQuestion(pin), timeLimit * 1000);
}

function endQuestion(pin) {
  const game = games[pin];
  if (!game || game.state !== 'question') return;

  clearTimeout(game.timer);
  game.state = 'results';

  const q = game.questions[game.currentQ];
  const leaderboard = buildLeaderboard(game);

  io.to(pin).emit('question_end', {
    correctIndex: q.correctIndex,
    correctAnswer: q.options[q.correctIndex],
    leaderboard
  });
}

function endGame(pin) {
  const game = games[pin];
  if (!game) return;

  game.state = 'game_over';
  const leaderboard = buildLeaderboard(game);
  io.to(pin).emit('game_over', { leaderboard });
  console.log(`Game PIN=${pin} over`);

  // Clean up after 5 min
  setTimeout(() => { delete games[pin]; }, 5 * 60 * 1000);
}

function buildLeaderboard(game) {
  return Object.values(game.players)
    .map(p => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Kahoot Clone running on http://localhost:${PORT}`);
});
