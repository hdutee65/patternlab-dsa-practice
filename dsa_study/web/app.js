const state = { challenges: [], challenge: null, category: 'All', search: '', startedAt: null, elapsed: 0, timer: null, draftKey: '' };
const $ = (id) => document.getElementById(id);
const api = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shortTime = (seconds) => {
  if (seconds == null) return '—';
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => node.classList.remove('visible'), 2600);
}
function updateLineNumbers() {
  const count = Math.max(1, $('code-editor').value.split('\n').length);
  $('line-numbers').textContent = Array.from({length: count}, (_, i) => i + 1).join('\n');
}
function renderFilters() {
  const categories = ['All', ...new Set(state.challenges.map(item => item.category))];
  const container = $('category-filters');
  container.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-button${category === state.category ? ' active' : ''}`;
    button.textContent = category;
    button.addEventListener('click', () => { state.category = category; renderFilters(); renderChallenges(); });
    container.append(button);
  });
}
function renderChallenges() {
  const list = $('challenge-list');
  list.replaceChildren();
  const filtered = state.challenges.filter((item) => {
    const matchesCategory = state.category === 'All' || item.category === state.category;
    const matchesSearch = `${item.title} ${item.category} ${item.difficulty}`.toLowerCase().includes(state.search);
    return matchesCategory && matchesSearch;
  });
  $('challenge-count').textContent = String(filtered.length).padStart(2, '0');
  filtered.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `challenge-item${state.challenge?.slug === item.slug ? ' active' : ''}`;
    button.setAttribute('aria-current', state.challenge?.slug === item.slug ? 'true' : 'false');
    button.innerHTML = `<span class="item-index">${String(item.leetcode_id).padStart(3, '0')}</span><span class="item-copy"><span class="item-title">${escapeHtml(item.title)}</span><span class="item-sub"><span>LC ${item.leetcode_id}</span><span>·</span><span>${escapeHtml(item.category)}</span></span></span><span class="item-status" aria-label="${item.solved ? 'Solved' : 'Not solved'}">${item.solved ? '✓' : ''}</span>`;
    button.addEventListener('click', () => selectChallenge(item.slug));
    list.append(button);
  });
}
async function selectChallenge(slug) {
  try {
    const challenge = await api(`/api/challenge?slug=${encodeURIComponent(slug)}`);
    state.challenge = challenge;
    state.draftKey = `patternlab:draft:${slug}`;
    $('problem-category').textContent = challenge.category.toUpperCase();
    $('problem-title').textContent = challenge.title;
    $('problem-prompt').textContent = challenge.prompt;
    $('problem-complexity').textContent = challenge.complexity;
    const difficulty = $('difficulty-pill');
    difficulty.textContent = `LEETCODE · ${challenge.difficulty.toUpperCase()}`;
    difficulty.className = `difficulty-pill ${challenge.difficulty.toLowerCase()}`;
    const source = $('source-link');
    source.href = challenge.source_url;
    source.hidden = false;
    $('file-name').textContent = `${challenge.slug}.py`;
    $('sample-input').textContent = JSON.stringify(challenge.sample_input);
    $('sample-output').textContent = JSON.stringify(challenge.sample_output);
    $('editor-hint').textContent = `The runner checks ${challenge.test_count} cases, including fresh generated inputs.`;
    $('code-editor').value = localStorage.getItem(state.draftKey) ?? challenge.starter;
    updateLineNumbers();
    resetTimer();
    clearResults();
    renderChallenges();
  } catch (error) { toast(error.message); }
}
function resetTimer() {
  clearInterval(state.timer);
  state.timer = null;
  state.startedAt = null;
  state.elapsed = 0;
  $('timer-display').textContent = '00:00';
  $('timer').classList.remove('running');
  $('start-timer').textContent = 'Start timer';
}
function startTimer() {
  if (state.startedAt !== null) {
    state.elapsed += (performance.now() - state.startedAt) / 1000;
    state.startedAt = null;
    clearInterval(state.timer);
    $('timer').classList.remove('running');
    $('start-timer').textContent = 'Resume timer';
    return;
  }
  state.startedAt = performance.now();
  $('timer').classList.add('running');
  $('start-timer').textContent = 'Pause timer';
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    $('timer-display').textContent = shortTime(state.elapsed + (performance.now() - state.startedAt) / 1000);
  }, 250);
}
function clearResults() {
  $('results-title').textContent = 'Ready when you are';
  $('result-summary').textContent = '— / —';
  $('results-list').innerHTML = '<div class="empty-result"><span class="empty-check">✓</span><span>Run your solution to see each case here.</span></div>';
}
function renderResults(data) {
  $('results-title').textContent = data.accepted ? 'All cases passed' : 'A few cases need another look';
  $('result-summary').textContent = `${data.passed} / ${data.total} passed`;
  const list = $('results-list');
  list.replaceChildren();
  data.results.forEach((item) => {
    const card = document.createElement('div');
    card.className = `case-card ${item.passed ? 'pass' : 'fail'}`;
    const copy = document.createElement('div');
    copy.className = 'case-copy';
    const name = document.createElement('div');
    name.className = 'case-name';
    name.textContent = item.name;
    const detail = document.createElement('div');
    detail.className = 'case-detail';
    detail.textContent = item.detail;
    copy.append(name, detail);
    const mark = document.createElement('span');
    mark.className = 'case-mark';
    mark.textContent = item.passed ? '✓' : '×';
    card.append(copy, mark);
    list.append(card);
  });
}
function renderProgress(progress) {
  $('stat-attempts').textContent = progress.attempts;
  $('stat-accepted').textContent = progress.accepted;
  $('stat-accuracy').textContent = progress.attempts ? `${Math.round(progress.accuracy * 100)}%` : '—';
  $('stat-time').textContent = progress.average_seconds == null ? '—' : shortTime(progress.average_seconds);
  const container = $('category-progress');
  const entries = Object.entries(progress.categories).sort((a, b) => a[0].localeCompare(b[0]));
  if (!entries.length) {
    container.innerHTML = '<div class="progress-empty">Your category stats will show here after your first attempt.</div>';
    return;
  }
  container.replaceChildren();
  entries.forEach(([category, counts]) => {
    const rate = counts.attempts ? Math.round(counts.accepted / counts.attempts * 100) : 0;
    const card = document.createElement('div');
    card.className = 'progress-card';
    card.innerHTML = `<div class="progress-card-top"><span>${escapeHtml(category)}</span><span>${counts.accepted}/${counts.attempts}</span></div><div class="progress-track" role="progressbar" aria-label="${escapeHtml(category)} accuracy" aria-valuenow="${rate}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${rate}%"></div></div>`;
    container.append(card);
  });
}
async function runSolution() {
  if (!state.challenge) { toast('Choose a challenge first.'); return; }
  const code = $('code-editor').value;
  if (!code.trim()) { toast('Add a solution before running checks.'); return; }
  const button = $('run-code');
  button.disabled = true;
  button.querySelector('span').textContent = 'Running…';
  try {
    let elapsed = state.elapsed;
    if (state.startedAt !== null) elapsed += (performance.now() - state.startedAt) / 1000;
    const data = await api('/api/run', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({slug:state.challenge.slug, code, elapsed_seconds:elapsed}) });
    renderResults(data);
    renderProgress(data.progress);
    state.challenges = await api('/api/challenges');
    renderChallenges();
    if (data.accepted) toast('Nice — every listed case passed.');
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.querySelector('span').textContent = 'Run checks'; }
}
async function init() {
  try {
    state.challenges = await api('/api/challenges');
    renderFilters();
    renderChallenges();
    renderProgress(await api('/api/progress'));
    $('challenge-search').addEventListener('input', (event) => { state.search = event.target.value.trim().toLowerCase(); renderChallenges(); });
    $('code-editor').addEventListener('input', () => { updateLineNumbers(); if (state.draftKey) localStorage.setItem(state.draftKey, $('code-editor').value); });
    $('code-editor').addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = event.target.selectionStart;
        const end = event.target.selectionEnd;
        event.target.setRangeText('    ', start, end, 'end');
        event.target.dispatchEvent(new Event('input', {bubbles:true}));
      }
    });
    $('start-timer').addEventListener('click', startTimer);
    $('run-code').addEventListener('click', runSolution);
    $('reset-code').addEventListener('click', () => {
      if (!state.challenge) return;
      $('code-editor').value = state.challenge.starter;
      if (state.draftKey) localStorage.removeItem(state.draftKey);
      updateLineNumbers();
      toast('Starter code restored.');
    });
    if (state.challenges.length) await selectChallenge(state.challenges[0].slug);
  } catch (error) { toast(`Could not load the app: ${error.message}`); }
}
document.addEventListener('DOMContentLoaded', init);
