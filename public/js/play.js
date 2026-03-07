/* play.js – player client */
const socket = io();

const SHAPES = ['▲', '◆', '●', '■'];
const COLORS = ['a0', 'a1', 'a2', 'a3'];

let currentPin = null;
let currentTimeLimit = 20;
let timerInterval = null;
let timeLeft = 0;
let answered = false;

// ── Screen helpers ─────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Join game ──────────────────────────────────────────────────────────────
function joinGame() {
  const pin = document.getElementById('inp-pin').value.trim();
  const name = document.getElementById('inp-name').value.trim();
  document.getElementById('join-error').textContent = '';

  if (!pin || !name) {
    document.getElementById('join-error').textContent = 'Please enter both PIN and nickname.';
    return;
  }
  socket.emit('join_game', { pin, name });
}

// Enter key support
document.getElementById('inp-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinGame();
});
document.getElementById('inp-pin').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('inp-name').focus();
});

// ── Socket events ──────────────────────────────────────────────────────────

socket.on('join_error', (msg) => {
  document.getElementById('join-error').textContent = msg;
});

socket.on('joined_game', ({ pin, name }) => {
  currentPin = pin;
  document.getElementById('lobby-pin').textContent = pin;
  document.getElementById('lobby-welcome').textContent = `Welcome, ${name}!`;
  showScreen('screen-lobby');
});

socket.on('player_list', ({ players }) => {
  const grid = document.getElementById('player-grid');
  grid.innerHTML = '';
  players.forEach(n => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.textContent = n;
    grid.appendChild(chip);
  });
});

socket.on('game_started', () => {
  // will immediately get question_start
});

socket.on('question_start', ({ index, total, question, options, timeLimit }) => {
  answered = false;
  currentTimeLimit = timeLimit;
  timeLeft = timeLimit;

  document.getElementById('q-index').textContent = `${index + 1} / ${total}`;
  document.getElementById('q-text').textContent = question;

  const grid = document.getElementById('answer-grid');
  grid.innerHTML = '';
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = `answer-btn ${COLORS[i]}`;
    btn.innerHTML = `<span class="shape">${SHAPES[i]}</span> ${escapeHtml(opt)}`;
    btn.onclick = () => submitAnswer(i, btn);
    grid.appendChild(btn);
  });

  startTimer('timer-val', 'timer-arc', timeLimit, () => {});
  showScreen('screen-question');
});

socket.on('answer_result', ({ correct, earned, score }) => {
  stopTimer();
  const card = document.getElementById('result-card');
  document.getElementById('result-icon').textContent = correct ? '✅' : '❌';
  document.getElementById('result-label').textContent = correct ? 'Correct!' : 'Wrong!';
  document.getElementById('result-points').textContent = correct ? `+${earned} points` : '';
  document.getElementById('result-total').textContent = `Total: ${score} pts`;
  card.style.background = correct ? 'linear-gradient(135deg,#145214,#0f3460)' : 'linear-gradient(135deg,#5a0a0a,#0f3460)';
  showScreen('screen-answer-result');
});

socket.on('question_end', ({ correctIndex, correctAnswer, leaderboard }) => {
  stopTimer();
  renderLeaderboard('q-end-board', leaderboard);
  showScreen('screen-q-end');
});

socket.on('game_over', ({ leaderboard }) => {
  stopTimer();
  renderLeaderboard('final-board', leaderboard);
  showScreen('screen-gameover');
});

socket.on('host_disconnected', () => {
  stopTimer();
  alert('The host disconnected. Game over!');
  showScreen('screen-landing');
});

// ── Actions ────────────────────────────────────────────────────────────────
function submitAnswer(index, btn) {
  if (answered) return;
  answered = true;
  stopTimer();

  // disable all buttons
  document.querySelectorAll('.answer-btn').forEach(b => { b.disabled = true; });
  btn.style.outline = '4px solid #fff';

  socket.emit('submit_answer', { pin: currentPin, answerIndex: index, timeLeft });
}

// ── Timer ──────────────────────────────────────────────────────────────────
function startTimer(valId, arcId, duration, onEnd) {
  stopTimer();
  timeLeft = duration;
  const valEl = document.getElementById(valId);
  const arcEl = document.getElementById(arcId);
  const circumference = 100; // stroke-dasharray="100 100"

  function tick() {
    if (valEl) valEl.textContent = Math.ceil(timeLeft);
    const pct = timeLeft / duration;
    if (arcEl) {
      arcEl.style.strokeDashoffset = String((1 - pct) * circumference);
      arcEl.style.stroke = pct > 0.5 ? '#26890c' : pct > 0.25 ? '#d89e00' : '#e21b3c';
    }
    if (timeLeft <= 0) { stopTimer(); onEnd(); return; }
    timeLeft -= 0.1;
  }
  tick();
  timerInterval = setInterval(tick, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function renderLeaderboard(listId, board) {
  const el = document.getElementById(listId);
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = board.map((p, i) => `
    <li>
      <span class="rank">${medals[i] || (i + 1)}</span>
      <span class="lb-name">${escapeHtml(p.name)}</span>
      <span class="lb-score">${p.score} pts</span>
    </li>`).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
