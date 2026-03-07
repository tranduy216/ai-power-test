/* host.js – host client */
const socket = io();

const SHAPES = ['▲', '◆', '●', '■'];
const COLORS = ['a0', 'a1', 'a2', 'a3'];

let currentPin = null;
let currentTimeLimit = 20;
let timerInterval = null;
let timeLeft = 0;
let answerCount = 0;
let playerCount = 0;

// ── Screen helpers ─────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Quiz builder ───────────────────────────────────────────────────────────
let questionIndex = 0;

function addQuestion() {
  questionIndex++;
  const container = document.getElementById('questions-container');
  const block = document.createElement('div');
  block.className = 'q-block';
  block.dataset.idx = questionIndex;
  block.innerHTML = `
    <button class="remove-btn" title="Remove" onclick="this.closest('.q-block').remove()">✕</button>
    <h4>Question ${container.children.length + 1}</h4>
    <input class="inp q-text" type="text" placeholder="Question text…" />
    <div class="options-grid">
      ${[0,1,2,3].map(i => `
        <div class="opt-row">
          <input type="radio" name="correct-${questionIndex}" class="opt-radio" value="${i}" ${i === 0 ? 'checked' : ''} />
          <input class="inp opt-text" type="text" placeholder="Option ${i + 1}" />
        </div>`).join('')}
    </div>
    <div class="time-row">
      ⏱ Time limit:
      <select class="time-sel">
        <option value="10">10s</option>
        <option value="20" selected>20s</option>
        <option value="30">30s</option>
        <option value="60">60s</option>
      </select>
    </div>`;
  container.appendChild(block);
}

// Add first question by default
addQuestion();

function gatherQuestions() {
  const blocks = document.querySelectorAll('.q-block');
  const questions = [];
  for (const block of blocks) {
    const question = block.querySelector('.q-text').value.trim();
    const optInputs = block.querySelectorAll('.opt-text');
    const options = Array.from(optInputs).map(i => i.value.trim());
    const correctRadio = block.querySelector('.opt-radio:checked');
    const correctIndex = correctRadio ? parseInt(correctRadio.value) : 0;
    const timeLimit = parseInt(block.querySelector('.time-sel').value) || 20;

    if (!question) return null; // validation
    if (options.some(o => !o)) return null;

    questions.push({ question, options, correctIndex, timeLimit });
  }
  return questions.length > 0 ? questions : null;
}

// ── Create game ────────────────────────────────────────────────────────────
function createGame() {
  const questions = gatherQuestions();
  if (!questions) {
    document.getElementById('create-error').textContent =
      'Please fill in all question texts and answer options.';
    return;
  }
  document.getElementById('create-error').textContent = '';
  socket.emit('create_game', { questions });
}

// ── Start game ─────────────────────────────────────────────────────────────
function startGame() {
  if (!currentPin) return;
  document.getElementById('start-error').textContent = '';
  socket.emit('start_game', { pin: currentPin });
}

// ── Next question ──────────────────────────────────────────────────────────
function nextQuestion() {
  if (!currentPin) return;
  socket.emit('next_question', { pin: currentPin });
}

// ── Socket events ──────────────────────────────────────────────────────────

socket.on('game_created', ({ pin }) => {
  currentPin = pin;
  document.getElementById('host-pin').textContent = pin;
  showScreen('screen-lobby');
});

socket.on('error_msg', (msg) => {
  document.getElementById('create-error').textContent = msg;
  document.getElementById('start-error').textContent = msg;
});

socket.on('player_list', ({ players }) => {
  playerCount = players.length;
  document.getElementById('player-count').textContent =
    `${playerCount} player${playerCount !== 1 ? 's' : ''} joined`;
  const grid = document.getElementById('host-player-grid');
  grid.innerHTML = '';
  players.forEach(n => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.textContent = n;
    grid.appendChild(chip);
  });
});

socket.on('game_started', () => {
  // will immediately receive question_start
});

socket.on('question_start', ({ index, total, question, options, timeLimit, correctIndex }) => {
  answerCount = 0;
  currentTimeLimit = timeLimit;
  timeLeft = timeLimit;

  document.getElementById('host-q-index').textContent = `${index + 1} / ${total}`;
  document.getElementById('host-q-text').textContent = question;
  document.getElementById('host-answer-count').textContent = `0 / ${playerCount} answered`;

  const grid = document.getElementById('host-answer-grid');
  grid.innerHTML = '';
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = `answer-btn ${COLORS[i]}${i === correctIndex ? ' host-correct' : ''}`;
    btn.disabled = true;
    btn.innerHTML = `<span class="shape">${SHAPES[i]}</span> ${escapeHtml(opt)}`;
    grid.appendChild(btn);
  });

  startTimer('host-timer-val', 'host-timer-arc', timeLimit, () => {});
  showScreen('screen-question');
});

socket.on('question_end', ({ correctIndex, correctAnswer, leaderboard }) => {
  stopTimer();
  renderLeaderboard('host-q-end-board', leaderboard);
  showScreen('screen-q-end');
});

socket.on('game_over', ({ leaderboard }) => {
  stopTimer();
  renderLeaderboard('host-final-board', leaderboard);
  showScreen('screen-gameover');
});

// Track answer count by listening to players submitting (host receives question_end on all answered)
// We approximate by watching player_list changes during question phase, but simplest is:
// The server tells host via question_end when all answered. For live count we'd need a separate event.
// For now display is updated when question_end fires.

// ── Timer ──────────────────────────────────────────────────────────────────
function startTimer(valId, arcId, duration, onEnd) {
  stopTimer();
  timeLeft = duration;
  const valEl = document.getElementById(valId);
  const arcEl = document.getElementById(arcId);
  const circumference = 100;

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
