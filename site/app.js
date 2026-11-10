const challenges = window.PATTERNLAB_CHALLENGES;
const state = { challenge: null, category: 'All', search: '', startedAt: null, elapsed: 0, timer: null, draftKey: '', worker: null, workerReady: null, runId: 0, activeRun: null, editedThisSession: new Set() };
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shortTime = (seconds) => {
  if (seconds == null) return '—';
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const freshProgress = () => ({ schemaVersion: 2, attempts: [], categories: {}, challengeStates: {}, activity: [] });
const PROGRESS_KEY = 'patternlab:progress:v2';
const LEGACY_PROGRESS_KEY = 'patternlab:progress:v1';
const appViews = new Set(['home','practice','patterns','progress']);
const patternDescriptions = {
  'Hash maps':'Remember values so the next lookup is fast.',
  'Sets and hash maps':'Track what appeared and how often it appeared.',
  'Arrays and running state':'Keep only the useful summary as you scan.',
  'Arrays and two pointers':'Read and write with boundaries that move deliberately.',
  'Binary search':'Use sorted order to shrink a possible answer range.',
  'Linked lists':'Follow and reconnect nodes without losing the rest of the chain.',
  'Stacks':'Use last-in, first-out order to manage nested or waiting work.',
  'Graphs and grid traversal':'Explore connected neighbors while marking what you visited.',
  'Dynamic programming':'Build a larger answer from smaller saved answers.',
  'Sorting and intervals':'Put ranges in order, then combine overlaps in one pass.',
  'Trees and recursion':'Solve a node by solving its smaller child trees.',
  'Searching':'Use an invariant to narrow the remaining possibilities.',
  'Strings / two pointers':'Compare or scan characters with clear boundaries.',
  'Sliding window':'Grow a valid range and shrink it when its rule breaks.',
  'Two pointers':'Move through ordered values without restarting the scan.',
  'Sorting':'Divide the input, then merge sorted results.'
};
const tutorGuide = {
  two_sum: { question: 'For each number, what value would complete the target, and have you seen it before?', principle: 'A hash map remembers earlier values, so you can check a complement in constant average time.', hints: ['Try scanning once and name the missing partner for the current number.', 'Before saving the current value, check whether its partner is already in your map. Why does that order handle using one item twice?', 'Store each value with its index; when the partner is found, return the two indices.'], connections: [['valid_parentheses','Both use a dictionary for quick lookup, but the map stores complements here and matching bracket pairs there.'],['merge_sorted','Both find relationships between values; sorting enables two pointers, while a hash map works without sorted input.']] },
  binary_search: { question: 'What does your current low-to-high range guarantee, and which half can you safely discard?', principle: 'The sorted order lets each comparison eliminate half the remaining candidates.', hints: ['Set low and high to the range of indices that could still contain the target.', 'Choose a midpoint and compare it to the target. Make sure the next range is strictly smaller.', 'If you use an inclusive high bound, what condition ends the loop and how do low/high change when mid is too small or too large?'], connections: [['merge_sorted','Both rely on sorted order: binary search discards a range, while merging advances the smaller next value.'],['merge_sort','Merge sort creates sorted order; binary search takes advantage of it later.']] },
  valid_palindrome: { question: 'Which two characters should be compared next, and what should happen when one is punctuation?', principle: 'Two pointers compare matching ends while skipping characters the prompt says to ignore.', hints: ['Place one pointer at each end of the text.', 'Move past non-alphanumeric characters before comparing. What if both pointers meet?', 'Compare lowercase forms; a mismatch is false, and crossing pointers means every useful pair matched.'], connections: [['longest_unique_substring','Both scan a string with boundaries. Here the ends move inward; a sliding window moves forward and shrinks when needed.'],['merge_sorted','Two pointers are useful when each pointer tracks a meaningful position in ordered data or a string.']] },
  max_subarray: { question: 'At this number, is it better to extend the previous segment or start a new one?', principle: 'Keep the best sum ending here and the best sum seen anywhere; a negative prefix can be dropped.', hints: ['Track a running segment sum and a best answer.', 'A segment ending here either includes the previous running sum or starts at this value. Which gives the larger result?', 'Update the global best after each value. Initialize carefully so an all-negative list still returns one of its values.'], connections: [['longest_unique_substring','Both keep a current candidate and a global best; the subarray can restart, while a unique-character window shrinks.'],['binary_search','Both rely on an invariant: define exactly what your running value or search range represents.']] },
  longest_unique_substring: { question: 'What must be true about every character inside your current window?', principle: 'A sliding window keeps a valid range and moves its left edge only when a duplicate makes the range invalid.', hints: ['Keep left and right boundaries for the current substring.', 'Track characters already in the window. When one repeats, how far must the left side move?', 'Only move left forward; after restoring uniqueness, update the longest length with right - left + 1.'], connections: [['valid_palindrome','Both reason about string boundaries, but palindrome compares from both ends while this keeps a forward-moving window.'],['max_subarray','Both compare a changing candidate against a global best, but the rule for changing the candidate is different.']] },
  merge_sorted: { question: 'Where can you write the largest remaining value without overwriting an unread value?', principle: 'Filling from the back preserves nums1’s unread values while two pointers choose the larger tail.', hints: ['Point to the last valid value in each input and the last output slot.', 'Write the larger tail into the output slot, then move that input pointer and the output pointer.', 'When nums2 still has values, copy them. If nums1 is exhausted, nums2 must fill the remaining front.'], connections: [['binary_search','Sorted order powers both: one shrinks a search range, the other compares two sorted streams.'],['merge_sort','Merge sort repeatedly uses this same idea of combining sorted halves.']] },
  valid_parentheses: { question: 'When a closing bracket appears, which opening bracket must match it?', principle: 'A stack remembers unmatched openers in last-in, first-out order, which mirrors nested brackets.', hints: ['Opening brackets need to wait until their matching closer appears. What structure naturally remembers the most recent one?', 'A closer fails if the stack is empty or its top is the wrong type.', 'After scanning all characters, what should be true about the stack for the string to be valid?'], connections: [['two_sum','Both use fast lookup, but a stack also preserves order so the newest unmatched opener is checked first.'],['longest_unique_substring','Both track a changing set of relevant characters/state while scanning left to right.']] },
  merge_sort: { question: 'What smaller versions of this problem can you solve, and what is the simplest input that is already sorted?', principle: 'Divide and conquer splits the list, solves smaller pieces, then merges sorted results.', hints: ['A list of zero or one values is already sorted. Use that as your base case.', 'Split into smaller lists and recursively sort each half.', 'Merge the two sorted halves with pointers; take care to include duplicates and leftover values.'] }
  ,...(window.PATTERNLAB_EXTRA_TUTOR_GUIDE || {})
};
function readProgress() {
  try {
    const current = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (current && typeof current === 'object') return {...freshProgress(), ...current, categories: current.categories || {}, attempts: current.attempts || [], challengeStates: current.challengeStates || {}, activity: current.activity || []};
    const legacy = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY) || 'null');
    return legacy ? {...freshProgress(), ...legacy} : freshProgress();
  } catch { return freshProgress(); }
}
function saveProgress(progress) {
  progress.schemaVersion = 2;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(progress));
}
function challengeMemory(progress, slug) {
  progress.challengeStates ||= {};
  progress.challengeStates[slug] ||= {hintLevel: 0, editSessions: 0, reflection: '', lastOpened: null};
  return progress.challengeStates[slug];
}
function addActivity(progress, type, slug, detail) {
  progress.activity ||= [];
  progress.activity.push({type, slug, detail, timestamp: new Date().toISOString()});
  progress.activity = progress.activity.slice(-120);
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
  const isNew = state.challenge?.slug !== slug;
  state.challenge = challenge;
  state.draftKey = `patternlab:draft:${slug}`;
  const progress = readProgress();
  const memory = challengeMemory(progress, slug);
  memory.lastOpened = new Date().toISOString();
  if (isNew) addActivity(progress, 'opened', slug, 'Opened for practice');
  try { saveProgress(progress); } catch {}
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
  $('reflection-editor').value = memory.reflection || '';
  updateLineNumbers();
  resetTimer();
  clearResults();
  renderChallenges();
  renderTutor();
  renderActivity(progress);
}
function tutorObservation(slug, code) {
  const text = code.toLowerCase();
  const patterns = {
    two_sum: [[/target\s*-|target\s*-/,'You’re thinking in terms of a complement. Check that you look for it before adding the current value, so one item cannot pair with itself.'],[/\{\}|dict\(|\bseen\b|\blookup\b/,'Good direction: a map can remember values you have already passed. Be clear about whether it stores values, indices, or both.'],[/for\s+.*\bin\b/,'You have a scan taking shape. For each value, say what fact you need from the earlier part of the list.']],
    binary_search: [[/\bmid\b/,'You have a midpoint. After each comparison, verify that the next range excludes mid and still contains every possible answer.'],[/\blow\b|\bhigh\b/,'Your bounds are in place. Decide whether high is included; that choice determines the loop condition and updates.'],[/while\s+/,'A loop fits the search. Check the empty-list case and that every pass makes the range smaller.']],
    valid_palindrome: [[/left|right/,'Your two ends are represented. Move past punctuation before comparing, and stop when the pointers meet or cross.'],[/lower\(|isalnum|isalpha|isdigit/,'You’re accounting for normalization. The prompt wants case ignored and non-alphanumeric characters skipped.'],[/while\s+/,'A loop fits the inward scan. A mismatch can return false immediately; exhausting matching pairs means true.']],
    max_subarray: [[/max\s*\(/,'You’re comparing choices. Check the two candidates: extend the previous segment or begin at this value.'],[/current|running|best/,'Separating a current sum from a global best is the key state. Initialize so all-negative input still works.'],[/for\s+.*\bin\b/,'As you scan, describe what your running variable means after each item. That definition will guide the update.']],
    longest_unique_substring: [[/left|start/,'You have a left boundary. On a duplicate, move it only forward—especially when the repeated character is already outside the window.'],[/set\(|\bseen\b|last_seen|lastseen/,'Tracking seen characters is useful. Decide whether you need membership in the current window or each character’s last index.'],[/right|enumerate|for\s+.*\bin\b/,'Your scan is underway. Keep the window valid before recording its length.']],
    merge_sorted: [[/\bi\b|\bj\b/,'You have pointer-like state. Because nums1 has spare slots, compare from the ends to avoid overwriting unread values.'],[/while\s+/,'The merge loop is forming. Remember the leftover nums2 case after nums1 runs out.'],[/sort\(|sorted\(/,'The prompt is practicing a linear merge. Try using the existing sorted order instead of sorting everything again.']],
    valid_parentheses: [[/\bstack\b|append\(|\.pop\(/,'A stack matches the nested order. Before popping, handle an empty stack; then compare the popped opener’s expected closer.'],[/\{\s*['"]\(/,'A mapping from opener to closer can make pair checks clear. Make sure the final stack is empty.'],[/for\s+.*\bin\b/,'A left-to-right scan is right. Openers wait; each closer must match the most recent unmatched opener.']],
    merge_sort: [[/return\s+.*nums|len\(.*\)\s*<=?\s*1/,'Check the base case: zero or one item is already sorted, so recursion stops there.'],[/merge|left|right/,'Keep splitting until the base case, then combine two sorted halves while preserving leftovers and duplicates.'],[/sort\(|sorted\(/,'The challenge asks you to build the sorting process yourself. Focus on splitting and merging rather than a built-in sort.']]
    ,...(window.PATTERNLAB_EXTRA_OBSERVATIONS || {})
  };
  const match = (patterns[slug] || []).find(([regex]) => regex.test(text));
  return match?.[1] || 'Keep going. As you write, name what each variable means and what should be true after every loop step.';
}
function renderTutor() {
  if (!state.challenge) return;
  const slug = state.challenge.slug;
  const guide = tutorGuide[slug];
  const progress = readProgress();
  const memory = challengeMemory(progress, slug);
  $('tutor-observation').textContent = tutorObservation(slug, $('code-editor').value);
  $('tutor-principle').textContent = guide.principle;
  $('tutor-question').textContent = guide.question;
  $('hint-count').textContent = memory.hintLevel ? `Hint ${memory.hintLevel} of ${guide.hints.length} shown` : 'No hints used';
  const hintButton = $('next-hint');
  hintButton.disabled = memory.hintLevel >= guide.hints.length;
  hintButton.textContent = hintButton.disabled ? 'All hints shown' : memory.hintLevel ? 'Next hint' : 'Give me a hint';
  if (memory.hintLevel) $('tutor-observation').textContent = `${tutorObservation(slug, $('code-editor').value)}\n\nHint ${memory.hintLevel}: ${guide.hints[memory.hintLevel - 1]}`;
  const list = $('connections');
  list.replaceChildren();
  (guide.connections || []).forEach(([related, reason]) => {
    const item = challenges.find(challenge => challenge.slug === related);
    if (!item) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'connection-card';
    button.innerHTML = `<strong>${escapeHtml(item.title)} <span aria-hidden="true">↗</span></strong><small>${escapeHtml(reason)}</small>`;
    button.addEventListener('click', () => { selectChallenge(related); $('problem-title').scrollIntoView({behavior:'smooth',block:'start'}); });
    list.append(button);
  });
  $('reflection-status').textContent = memory.reflection ? `Last saved ${new Date(memory.reflectionAt || memory.lastOpened || Date.now()).toLocaleDateString()}` : 'A quick explanation helps it stick.';
}
function renderActivity(progress = readProgress()) {
  const items = [...(progress.activity || [])].reverse().slice(0, 7);
  $('activity-count').textContent = items.length ? `${progress.activity.length} saved events` : 'No activity yet';
  $('memory-status').textContent = `Saved on this browser · Last updated ${new Date().toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}`;
  const list = $('activity-list');
  list.replaceChildren();
  if (!items.length) { list.innerHTML = '<div class="progress-empty">Your practice sessions, attempts, and saved thoughts will appear here.</div>'; return; }
  items.forEach(event => {
    const challenge = challenges.find(item => item.slug === event.slug);
    const row = document.createElement('div'); row.className = 'activity-item';
    const date = new Date(event.timestamp);
    row.innerHTML = `<span class="activity-dot"></span><div><strong>${escapeHtml(event.detail)}</strong><small>${escapeHtml(challenge?.title || 'PatternLab')} · ${date.toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}</small></div>`;
    list.append(row);
  });
}
function setView(view) {
  if (!appViews.has(view)) view = 'home';
  if (view === 'home') renderHome();
  document.querySelectorAll('[data-view-target]').forEach(section => {
    section.hidden = !section.dataset.viewTarget.split(/\s+/).includes(view);
  });
  document.querySelectorAll('.nav-link[data-page-link]').forEach(link => {
    const active = link.dataset.pageLink === view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  window.scrollTo({top:0,behavior:'auto'});
}

function renderHome() {
  const progress = readProgress();
  const latest = [...(progress.activity || [])].reverse().find(item => challenges.some(challenge => challenge.slug === item.slug));
  const challenge = challenges.find(item => item.slug === latest?.slug) || challenges[0];
  $('resume-title').textContent = challenge ? challenge.title : 'Choose a problem to start';
  const memory = progress.challengeStates?.[challenge?.slug];
  $('resume-detail').textContent = latest ? `Last activity: ${latest.detail}. Your draft and notes for this problem are saved here.` : 'Your drafts, attempts, and explanations stay saved in this browser.';
  $('continue-practice').dataset.resumeSlug = challenge?.slug || '';
  $('continue-practice').innerHTML = `${memory?.lastOpened ? 'Continue problem' : 'Open problem'} <span aria-hidden="true">→</span>`;
}
function renderPatternCatalog() {
  const catalog = $('pattern-catalog');
  catalog.replaceChildren();
  const groups = new Map();
  challenges.forEach(challenge => { if (!groups.has(challenge.category)) groups.set(challenge.category,[]); groups.get(challenge.category).push({...challenge, local:true}); });
  const interactiveIds = new Set(challenges.map(item => item.leetcode_id));
  (window.PATTERNLAB_ROADMAP || []).filter(item => !interactiveIds.has(item.id)).forEach(item => { if (!groups.has(item.category)) groups.set(item.category,[]); groups.get(item.category).push({...item, local:false}); });
  const all = [...groups.values()].flat();
  const total = $('patterns-total'); if (total) total.textContent = `${all.length} PRACTICE PROBLEMS`;
  for (const [category, items] of groups) {
    const group = document.createElement('article'); group.className = 'pattern-group';
    const heading = document.createElement('div'); heading.className = 'pattern-group-heading';
    const title = document.createElement('div'); title.innerHTML = `<span class="section-kicker">${items.length} ${items.length === 1 ? 'PROBLEM' : 'PROBLEMS'}</span><h3>${escapeHtml(category)}</h3><p>${escapeHtml(patternDescriptions[category] || 'Practice the idea, then look for it in another problem.')}</p>`;
    heading.append(title);
    const list = document.createElement('div'); list.className = 'pattern-problem-list';
    items.forEach(item => {
      const link = document.createElement('a'); link.className = 'pattern-problem';
      link.href = item.local ? `./practice.html?challenge=${encodeURIComponent(item.slug)}` : item.url;
      if (!item.local) { link.target = '_blank'; link.rel = 'noreferrer'; }
      link.innerHTML = `<span><strong>${escapeHtml(item.title)}</strong><small>${item.local ? `Guided here · LeetCode #${item.leetcode_id}` : `LeetCode #${item.id} · ${escapeHtml(item.difficulty)} · ${escapeHtml(item.focus)}`}</small></span><span aria-hidden="true">${item.local ? '→' : '↗'}</span>`;
      list.append(link);
    });
    group.append(heading,list); catalog.append(group);
  }
  const search = $('pattern-search');
  if (search) search.oninput = () => {
    const query = search.value.trim().toLowerCase();
    catalog.querySelectorAll('.pattern-group').forEach(group => {
      let visible = 0;
      group.querySelectorAll('.pattern-problem').forEach(card => { const match = card.textContent.toLowerCase().includes(query); card.hidden = !match; if(match) visible++; });
      group.hidden = visible === 0;
    });
  };
}

function exportMemory() {
  const progress = readProgress();
  const drafts = Object.fromEntries(challenges.map(item => [item.slug, localStorage.getItem(`patternlab:draft:${item.slug}`)]).filter(([, value]) => value !== null));
  const blob = new Blob([JSON.stringify({app:'PatternLab',version:2,exportedAt:new Date().toISOString(),progress,drafts}, null, 2)], {type:'application/json'});
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `patternlab-memory-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  toast('Memory backup downloaded.');
}
async function importMemory(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (backup.app !== 'PatternLab' || !backup.progress || !Array.isArray(backup.progress.attempts)) throw new Error('That file is not a PatternLab memory backup.');
    const current = readProgress();
    const incoming = backup.progress;
    const combined = {...freshProgress(), ...current, challengeStates:{...current.challengeStates,...(incoming.challengeStates || {})}, activity:[...(current.activity || []),...(incoming.activity || [])].sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).slice(-120)};
    const seen = new Set(); combined.attempts = [...current.attempts,...incoming.attempts].filter(item => { const key = `${item.slug}|${item.timestamp}|${item.passed}|${item.total}`; if(seen.has(key)) return false; seen.add(key); return true; });
    combined.categories = {};
    combined.attempts.forEach(item => { combined.categories[item.category] ||= {attempts:0,accepted:0}; combined.categories[item.category].attempts += 1; combined.categories[item.category].accepted += Number(item.accepted); });
    for (const [slug, draft] of Object.entries(backup.drafts || {})) if (challenges.some(item => item.slug === slug) && typeof draft === 'string') localStorage.setItem(`patternlab:draft:${slug}`, draft);
    saveProgress(combined); renderProgress(combined); renderChallenges(); renderActivity(combined); renderTutor(); toast('Memory imported and merged with this browser.');
  } catch (error) { toast(error.message || 'Could not read that backup.'); }
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
  const memory = challengeMemory(progress, slug);
  memory.lastOutcome = {passed, total, accepted: attempt.accepted, timestamp: attempt.timestamp};
  addActivity(progress, 'attempt', slug, `${attempt.accepted ? 'Passed' : 'Ran'} checks · ${passed}/${total}`);
  try { saveProgress(progress); } catch { toast('Could not save progress in this browser.'); }
  renderProgress(progress);
  renderActivity(progress);
  renderChallenges();
}
function renderProgress(progress = readProgress()) {
  const attempts = progress.attempts;
  const acceptedAttempts = attempts.filter(item => item.accepted);
  $('stat-attempts').textContent = attempts.length;
  $('stat-accepted').textContent = acceptedAttempts.length;
  $('stat-accuracy').textContent = attempts.length ? `${Math.round(acceptedAttempts.length / attempts.length * 100)}%` : '—';
  $('stat-time').textContent = acceptedAttempts.length ? shortTime(acceptedAttempts.reduce((sum, item) => sum + item.elapsed_seconds, 0) / acceptedAttempts.length) : '—';
  renderActivity(progress);
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
      case 'contains_duplicate': {
        const nums = randomArray(randomInt(0, 18), -8, 8);
        input = {nums}; expected = new Set(nums).size !== nums.length; break;
      }
      case 'valid_anagram': {
        const alphabet = 'abcde';
        const s = Array.from({length: randomInt(0, 16)}, () => alphabet[randomInt(0, alphabet.length - 1)]).join('');
        const t = Math.random() < .5 ? [...s].sort(() => Math.random() - .5).join('') : Array.from({length: randomInt(0, 16)}, () => alphabet[randomInt(0, alphabet.length - 1)]).join('');
        const sorted = value => [...value].sort().join('');
        input = {s,t}; expected = sorted(s) === sorted(t); break;
      }
      case 'best_time_stock': {
        const prices = randomArray(randomInt(1, 18), 1, 50); let low = Infinity; let best = 0;
        for (const price of prices) { low = Math.min(low, price); best = Math.max(best, price - low); }
        input = {prices}; expected = best; break;
      }
      case 'product_except_self': {
        const nums = randomArray(randomInt(2, 9), -4, 4);
        input = {nums}; expected = nums.map((_, i) => nums.reduce((product, value, j) => j === i ? product : product * value, 1)); break;
      }
      case 'move_zeroes': {
        const nums = randomArray(randomInt(0, 18), 0, 4);
        input = {nums}; expected = [...nums.filter(value => value !== 0), ...nums.filter(value => value === 0)]; break;
      }
      case 'search_insert': {
        const nums = [...new Set(randomArray(randomInt(0, 18), -20, 20))].sort((a,b)=>a-b); const target = randomInt(-22,22);
        input = {nums,target}; expected = nums.findIndex(value=>value>=target); if (expected < 0) expected = nums.length; break;
      }
      case 'reverse_list': {
        const values = randomArray(randomInt(0, 18), -20, 20);
        input = {values}; expected = [...values].reverse(); break;
      }
      case 'merge_two_lists': {
        const list1 = randomArray(randomInt(0, 12), -20, 20).sort((a,b)=>a-b); const list2 = randomArray(randomInt(0, 12), -20, 20).sort((a,b)=>a-b);
        input = {list1,list2}; expected = [...list1,...list2].sort((a,b)=>a-b); break;
      }
      case 'daily_temperatures': {
        const temperatures = randomArray(randomInt(1, 20), 30, 100);
        input = {temperatures}; expected = temperatures.map((value,i)=>{let j=i+1;while(j<temperatures.length&&temperatures[j]<=value)j+=1;return j<temperatures.length?j-i:0;}); break;
      }
      case 'number_of_islands': {
        const rows = randomInt(0, 7), cols = randomInt(0, 7); const grid = Array.from({length:rows},()=>Array.from({length:cols},()=>Math.random()<.4?'1':'0'));
        let count = 0; const seen = new Set();
        for(let r=0;r<rows;r+=1) for(let c=0;c<cols;c+=1) if(grid[r][c]==='1'&&!seen.has(`${r},${c}`)){count+=1;const todo=[[r,c]];seen.add(`${r},${c}`);while(todo.length){const [x,y]=todo.pop();for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(a>=0&&a<rows&&b>=0&&b<cols&&grid[a][b]==='1'&&!seen.has(`${a},${b}`)){seen.add(`${a},${b}`);todo.push([a,b]);}}}
        input = {grid}; expected = count; break;
      }
      case 'climbing_stairs': {
        const n = randomInt(1, 28); let a=1,b=1; for(let i=2;i<=n;i+=1)[a,b]=[b,a+b];
        input = {n}; expected = n===1?1:b; break;
      }
      case 'coin_change': {
        const coins = [...new Set(randomArray(randomInt(1, 5), 1, 12))]; const amount = randomInt(0, 35); const dp = Array(amount+1).fill(Infinity); dp[0]=0;
        for(let value=1;value<=amount;value+=1)for(const coin of coins)if(coin<=value)dp[value]=Math.min(dp[value],dp[value-coin]+1);
        input = {coins,amount}; expected = Number.isFinite(dp[amount])?dp[amount]:-1; break;
      }
      case 'merge_intervals': {
        const intervals = Array.from({length:randomInt(0,10)},()=>{const a=randomInt(0,30),b=randomInt(a,35);return [a,b];});
        const sorted = [...intervals].sort((a,b)=>a[0]-b[0]); expected=[];
        for(const interval of sorted){const last=expected[expected.length-1];if(!last||last[1]<interval[0])expected.push([...interval]);else last[1]=Math.max(last[1],interval[1]);}
        input = {intervals}; break;
      }
      case 'max_depth': {
        const makeTree=(depth=0)=>depth>=4||Math.random()<.28?null:[randomInt(-9,9),makeTree(depth+1),makeTree(depth+1)]; const tree=makeTree();
        const depthOf=node=>node?1+Math.max(depthOf(node[1]),depthOf(node[2])):0;
        input={tree};expected=depthOf(tree);break;
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
  const pageView = ({'practice.html':'practice','patterns.html':'patterns','progress.html':'progress'})[location.pathname.split('/').pop()] || 'home';
  renderFilters();
  renderChallenges();
  renderProgress();
  renderPatternCatalog();
  renderHome();
  $('continue-practice').addEventListener('click', event => {
    const slug = event.currentTarget.dataset.resumeSlug || challenges[0].slug;
    location.href = `./practice.html?challenge=${encodeURIComponent(slug)}`;
  });
  $('challenge-search').addEventListener('input', (event) => { state.search = event.target.value.trim().toLowerCase(); renderChallenges(); });
  $('code-editor').addEventListener('input', () => { updateLineNumbers(); if (state.draftKey) { try { localStorage.setItem(state.draftKey, $('code-editor').value); } catch {} } });
  $('code-editor').addEventListener('input', () => {
    if (!state.challenge) return;
    renderTutor();
    if (!state.editedThisSession.has(state.challenge.slug)) {
      state.editedThisSession.add(state.challenge.slug);
      const progress = readProgress(); const memory = challengeMemory(progress, state.challenge.slug);
      memory.editSessions += 1; addActivity(progress, 'edit', state.challenge.slug, 'Started working on a solution');
      try { saveProgress(progress); } catch {}
      renderActivity(progress);
    }
  });
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
  $('next-hint').addEventListener('click', () => {
    if (!state.challenge) return;
    const progress = readProgress(); const memory = challengeMemory(progress, state.challenge.slug);
    const guide = tutorGuide[state.challenge.slug];
    if (memory.hintLevel >= guide.hints.length) return;
    memory.hintLevel += 1;
    addActivity(progress, 'hint', state.challenge.slug, `Opened hint ${memory.hintLevel}`);
    try { saveProgress(progress); } catch {}
    renderTutor(); renderActivity(progress);
  });
  $('save-reflection').addEventListener('click', () => {
    if (!state.challenge) return;
    const reflection = $('reflection-editor').value.trim();
    if (!reflection) { toast('Write a sentence in your own words first.'); return; }
    const progress = readProgress(); const memory = challengeMemory(progress, state.challenge.slug);
    memory.reflection = reflection; memory.reflectionAt = new Date().toISOString();
    addActivity(progress, 'reflection', state.challenge.slug, 'Saved your explanation');
    try { saveProgress(progress); } catch { toast('Could not save that thought in this browser.'); return; }
    renderTutor(); renderActivity(progress); toast('Saved. Your explanation will be here next time.');
  });
  $('export-memory').addEventListener('click', exportMemory);
  $('import-memory').addEventListener('change', event => { if (event.target.files?.[0]) importMemory(event.target.files[0]); event.target.value = ''; });
  $('reset-code').addEventListener('click', () => {
    if (!state.challenge) return;
    $('code-editor').value = `def solve(data):\n    # TODO: implement ${state.challenge.title.toLowerCase()}\n    pass\n`;
    if (state.draftKey) localStorage.removeItem(state.draftKey);
    updateLineNumbers();
    renderTutor();
    toast('Starter code restored.');
  });
  if (pageView === 'practice') {
    const lastWorked = [...(readProgress().activity || [])].reverse().find(item => challenges.some(challenge => challenge.slug === item.slug))?.slug;
    const requestedChallenge = new URLSearchParams(location.search).get('challenge');
    const initialChallenge = challenges.some(item => item.slug === requestedChallenge) ? requestedChallenge : lastWorked || challenges[0].slug;
    selectChallenge(initialChallenge);
  }
  renderActivity();
  setView(pageView);
  if (pageView !== 'practice') return;
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
