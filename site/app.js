const challenges = window.PATTERNLAB_CHALLENGES;
const state = { challenge: null, category: 'All', search: '', startedAt: null, elapsed: 0, timer: null, draftKey: '', worker: null, workerReady: null, runId: 0, activeRun: null };
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shortTime = (seconds) => {
  if (seconds == null) return '—';
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const freshProgress = () => ({ attempts: [], categories: {} });
function readProgress() {
  try { return JSON.parse(localStorage.getItem('patternlab:progress:v1') || 'null') || freshProgress(); }
  catch { return freshProgress(); }
}
function saveProgress(progress) {
  localStorage.setItem('patternlab:progress:v1', JSON.stringify(progress));
}
function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => node.classList.remove('visible'), 2600);
}
function setRuntimeStatus(text, ready = false) {
  const status = $('runtime-status');
  status.lastChild.textContent = ` ${text}`;
  status.classList.toggle('runtime-ready', ready);
  $('run-code').disabled = !ready;
}
function updateLineNumbers() {
  const count = Math.max(1, $('code-editor').value.split('\n').length);
  $('line-numbers').textContent = Array.from({length: count}, (_, i) => i + 1).join('\n');
}
function renderFilters() {
  const categories = ['All', ...new Set(challenges.map(item => item.category))];
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
function solvedSlugs() {
  const progress = readProgress();
  return new Set(progress.attempts.filter(item => item.accepted).map(item => item.slug));
}
function renderChallenges() {
  const list = $('challenge-list');
  list.replaceChildren();
  const solved = solvedSlugs();
  const filtered = challenges.filter((item) => {
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
    button.innerHTML = `<span class="item-index">${String(item.leetcode_id).padStart(3, '0')}</span><span class="item-copy"><span class="item-title">${escapeHtml(item.title)}</span><span class="item-sub"><span>LC ${item.leetcode_id}</span><span>·</span><span>${escapeHtml(item.category)}</span></span></span><span class="item-status" aria-label="${solved.has(item.slug) ? 'Solved' : 'Not solved'}">${solved.has(item.slug) ? '✓' : ''}</span>`;
    button.addEventListener('click', () => selectChallenge(item.slug));
    list.append(button);
  });
}
function clearResults(title = 'Ready when you are') {
  $('results-title').textContent = title;
  $('result-summary').textContent = '— / —';
  $('results-list').innerHTML = '<div class="empty-result"><span class="empty-check">✓</span><span>Run your solution to see each case here.</span></div>';
}
function selectChallenge(slug) {
  const challenge = challenges.find(item => item.slug === slug);
  if (!challenge) return;
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
  $('sample-input').textContent = JSON.stringify(challenge.cases[0].input);
  $('sample-output').textContent = JSON.stringify(challenge.cases[0].expected);
  $('editor-hint').textContent = `Runs ${challenge.test_count} checks: listed examples plus fresh generated inputs.`;
  $('code-editor').value = localStorage.getItem(state.draftKey) ?? `def solve(data):\n    # TODO: implement ${challenge.title.toLowerCase()}\n    pass\n`;
  updateLineNumbers();
  resetTimer();
  clearResults();
  renderChallenges();
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
function renderResults(results) {
  const passed = results.filter(item => item.passed).length;
  const accepted = passed === results.length;
  $('results-title').textContent = accepted ? 'All cases passed' : 'A few cases need another look';
  $('result-summary').textContent = `${passed} / ${results.length} passed`;
  const list = $('results-list');
  list.replaceChildren();
  results.forEach((item) => {
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
  return { passed, accepted };
}
function recordAttempt(slug, category, passed, total, elapsed) {
  const progress = readProgress();
  const attempt = { slug, category, passed, total, accepted: passed === total, elapsed_seconds: Math.round(elapsed * 100) / 100, timestamp: new Date().toISOString() };
  progress.attempts.push(attempt);
  if (!progress.categories[category]) progress.categories[category] = { attempts: 0, accepted: 0 };
  progress.categories[category].attempts += 1;
  progress.categories[category].accepted += Number(attempt.accepted);
  try { saveProgress(progress); } catch { toast('Could not save progress in this browser.'); }
  renderProgress(progress);
  renderChallenges();
}
function renderProgress(progress = readProgress()) {
  const attempts = progress.attempts;
  const acceptedAttempts = attempts.filter(item => item.accepted);
  $('stat-attempts').textContent = attempts.length;
  $('stat-accepted').textContent = acceptedAttempts.length;
  $('stat-accuracy').textContent = attempts.length ? `${Math.round(acceptedAttempts.length / attempts.length * 100)}%` : '—';
  $('stat-time').textContent = acceptedAttempts.length ? shortTime(acceptedAttempts.reduce((sum, item) => sum + item.elapsed_seconds, 0) / acceptedAttempts.length) : '—';
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
function randomInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randomArray(count, min, max) { return Array.from({length: count}, () => randomInt(min, max)); }
function generatedCases(challenge) {
  const output = [];
  for (let k = 0; k < 6; k += 1) {
    let input, expected;
    switch (challenge.slug) {
      case 'two_sum': {
        let nums, target, pairs;
        do {
          nums = [...new Set(randomArray(9, -40, 40))];
          const i = randomInt(0, nums.length - 1), j = (i + randomInt(1, nums.length - 1)) % nums.length;
          target = nums[i] + nums[j];
          pairs = [];
          for (let a = 0; a < nums.length; a += 1) for (let b = a + 1; b < nums.length; b += 1) if (nums[a] + nums[b] === target) pairs.push([a, b]);
        } while (nums.length < 4 || pairs.length !== 1);
        input = {nums, target}; expected = pairs[0]; break;
      }
      case 'binary_search': {
        const nums = [...new Set(randomArray(randomInt(0, 19), -60, 60))].sort((a, b) => a - b);
        const target = nums.length && Math.random() < .5 ? nums[randomInt(0, nums.length - 1)] : randomInt(-70, 70);
        input = {nums, target}; expected = nums.indexOf(target); break;
      }
      case 'valid_palindrome': {
        const chars = 'abCDefg012 ,.!?';
        input = {text: Array.from({length: randomInt(0, 35)}, () => chars[randomInt(0, chars.length - 1)]).join('')};
        const normalized = [...input.text].filter(char => /[a-z0-9]/i.test(char)).join('').toLowerCase();
        expected = normalized === [...normalized].reverse().join(''); break;
      }
      case 'max_subarray': {
        const nums = randomArray(randomInt(1, 18), -25, 25);
        let best = -Infinity;
        for (let i = 0; i < nums.length; i += 1) { let sum = 0; for (let j = i; j < nums.length; j += 1) { sum += nums[j]; best = Math.max(best, sum); } }
        input = {nums}; expected = best; break;
      }
      case 'longest_unique_substring': {
        const text = Array.from({length: randomInt(0, 30)}, () => 'abcdef gh'[randomInt(0, 8)]).join('');
        let best = 0;
        for (let i = 0; i < text.length; i += 1) { const seen = new Set(); for (let j = i; j < text.length; j += 1) { if (seen.has(text[j])) break; seen.add(text[j]); best = Math.max(best, j - i + 1); } }
        input = {text}; expected = best; break;
      }
      case 'merge_sorted': {
        const m = randomInt(0, 14), n = randomInt(0, 14);
        const left = randomArray(m, -30, 30).sort((a, b) => a - b);
        const right = randomArray(n, -30, 30).sort((a, b) => a - b);
        input = {nums1: [...left, ...Array(n).fill(0)], m, nums2: right, n};
        expected = [...left, ...right].sort((a, b) => a - b); break;
      }
      case 'valid_parentheses': {
        const text = Array.from({length: randomInt(0, 35)}, () => '()[]{}'[randomInt(0, 5)]).join('');
        const pairs = {'(':')','[':']','{':'}'}; const stack = []; expected = true;
        for (const char of text) { if (pairs[char]) stack.push(char); else if (!stack.length || pairs[stack.pop()] !== char) { expected = false; break; } }
        if (stack.length) expected = false;
        input = {text}; break;
      }
      case 'merge_sort': {
        const nums = randomArray(randomInt(0, 40), -100, 100);
        input = {nums}; expected = [...nums].sort((a, b) => a - b); break;
      }
      default: throw new Error(`No generated checks for ${challenge.slug}`);
    }
    output.push({name: `generated check ${k + 1}`, input, expected});
  }
  return output;
}
function terminateWorker(message) {
  if (state.worker) state.worker.terminate();
  state.worker = null;
  state.workerReady = null;
  if (state.activeRun) {
    clearTimeout(state.activeRun.timeout);
    state.activeRun.reject(new Error(message));
    state.activeRun = null;
  }
  setRuntimeStatus('RESTARTING PYTHON');
}
function getWorker() {
  if (!state.worker) {
    setRuntimeStatus('STARTING PYTHON');
    state.worker = new Worker(new URL('./python-worker.mjs', import.meta.url), {type:'module'});
    state.workerReady = new Promise((resolve, reject) => {
      const worker = state.worker;
      worker.onmessage = ({data}) => {
        if (data.ready) { setRuntimeStatus('PYTHON READY', true); resolve(); return; }
        if (data.ready_error) { setRuntimeStatus('PYTHON ERROR'); reject(new Error(data.ready_error)); return; }
        if (state.activeRun && data.runId === state.activeRun.runId) {
          clearTimeout(state.activeRun.timeout);
          const current = state.activeRun;
          state.activeRun = null;
          if (data.error) current.reject(new Error(data.error));
          else current.resolve(data.actual);
        }
      };
      worker.onerror = (event) => {
        setRuntimeStatus('PYTHON ERROR');
        if (state.activeRun) {
          clearTimeout(state.activeRun.timeout);
          state.activeRun.reject(new Error(event.message || 'Python worker failed to load.'));
          state.activeRun = null;
        }
        reject(new Error(event.message || 'Python worker failed to load.'));
      };
    });
  }
  return state.workerReady;
}
function runOne(code, testCase, index) {
  return new Promise((resolve, reject) => {
    const runId = ++state.runId;
    const timeout = setTimeout(() => {
      if (state.activeRun?.runId !== runId) return;
      state.activeRun = null;
      terminateWorker('Timed out after 1.5 seconds; Python worker was reset.');
      reject(new Error('Timed out after 1.5 seconds; Python worker was reset.'));
    }, 1500);
    state.activeRun = {runId, timeout, resolve, reject};
    state.worker.postMessage({runId, code, testCase, index});
  });
}
async function runSolution() {
  if (!state.challenge) { toast('Choose a challenge first.'); return; }
  const code = $('code-editor').value;
  if (!code.trim()) { toast('Add a solution before running checks.'); return; }
  const button = $('run-code');
  button.disabled = true;
  button.querySelector('span').textContent = 'Running…';
  const started = state.startedAt !== null ? state.elapsed + (performance.now() - state.startedAt) / 1000 : state.elapsed;
  state.elapsed = started;
  state.startedAt = null;
  clearInterval(state.timer);
  state.timer = null;
  $('timer').classList.remove('running');
  $('timer-display').textContent = shortTime(started);
  $('start-timer').textContent = 'Resume timer';
  const cases = [...state.challenge.cases, ...generatedCases(state.challenge)];
  const results = [];
  try {
    await getWorker();
    for (let index = 0; index < cases.length; index += 1) {
      try {
        const actualText = await runOne(code, cases[index], index);
        const actual = JSON.parse(actualText);
        const passed = JSON.stringify(actual) === JSON.stringify(cases[index].expected);
        results.push({name:cases[index].name, passed, detail:passed ? 'Passed' : `Expected ${JSON.stringify(cases[index].expected)}; got ${JSON.stringify(actual)}`});
      } catch (error) {
        results.push({name:cases[index].name, passed:false, detail:error.message || String(error)});
        if (/Timed out|worker failed|load/i.test(error.message || '')) {
          for (const skipped of cases.slice(index + 1)) results.push({name:skipped.name, passed:false, detail:'Stopped after the worker failed or timed out'});
          break;
        }
      }
    }
    const summary = renderResults(results);
    recordAttempt(state.challenge.slug, state.challenge.category, summary.passed, results.length, started);
    if (summary.accepted) toast('Nice — every listed and generated case passed.');
  } catch (error) {
    clearResults('Python could not start');
    $('results-list').innerHTML = `<div class="empty-result"><span class="empty-check">!</span><span>${escapeHtml(error.message)}</span></div>`;
    toast(error.message || 'Python could not start. Check your connection and retry.');
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = 'Run checks';
  }
}
async function init() {
  renderFilters();
  renderChallenges();
  renderProgress();
  $('challenge-search').addEventListener('input', (event) => { state.search = event.target.value.trim().toLowerCase(); renderChallenges(); });
  $('code-editor').addEventListener('input', () => { updateLineNumbers(); if (state.draftKey) { try { localStorage.setItem(state.draftKey, $('code-editor').value); } catch {} } });
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
    $('code-editor').value = `def solve(data):\n    # TODO: implement ${state.challenge.title.toLowerCase()}\n    pass\n`;
    if (state.draftKey) localStorage.removeItem(state.draftKey);
    updateLineNumbers();
    toast('Starter code restored.');
  });
  selectChallenge(challenges[0].slug);
  try {
    await getWorker();
    $('results-title').textContent = 'Ready when you are';
    $('results-list').innerHTML = '<div class="empty-result"><span class="empty-check">✓</span><span>Python is ready. Run your solution to check it.</span></div>';
  } catch (error) {
    setRuntimeStatus('LOAD FAILED');
    $('results-title').textContent = 'Python could not start';
    $('results-list').innerHTML = `<div class="empty-result"><span class="empty-check">!</span><span>Check your internet connection and refresh to load Python.</span></div>`;
  }
}
document.addEventListener('DOMContentLoaded', init);
