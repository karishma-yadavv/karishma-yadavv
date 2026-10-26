const fs = require('fs');
const USER = 'karishma_yd_0805';
const GOALS = { Easy: 100, Medium: 100, Hard: 50 };   // ring goals, apne hisaab se badlo
const W = 900, H = 545;

(async () => {
  const query = `
    query($u: String!) {
      allQuestionsCount { difficulty count }
      matchedUser(username: $u) {
        profile { ranking }
        submitStats { acSubmissionNum { difficulty count } }
        userCalendar { streak totalActiveDays submissionCalendar }
      }
    }`;
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
    body: JSON.stringify({ query, variables: { u: USER } }),
  });
  if (!res.ok) throw new Error('API failed: ' + res.status);
  const { data } = await res.json();
  const mu = data.matchedUser;

  const solved = {}, totals = {};
  mu.submitStats.acSubmissionNum.forEach(x => (solved[x.difficulty] = x.count));
  data.allQuestionsCount.forEach(x => (totals[x.difficulty] = x.count));
  const cal = JSON.parse(mu.userCalendar.submissionCalendar || '{}');
  const streak = mu.userCalendar.streak;
  const active = mu.userCalendar.totalActiveDays;
  const subs = Object.values(cal).reduce((a, b) => a + b, 0);
  const rank = mu.profile.ranking ? mu.profile.ranking.toLocaleString('en-US') : '-';

  // ---------- rings ----------
  const CX = 170, CY = 235;
  const rings = [
    { k: 'Easy',   r: 100, c1: '#00f5c8', c2: '#00b4d8', glow: '#00e0b8' },
    { k: 'Medium', r: 78,  c1: '#ffd000', c2: '#ff8a00', glow: '#ffb000' },
    { k: 'Hard',   r: 56,  c1: '#ff5d8f', c2: '#ff2e63', glow: '#ff3d6e' },
  ];
  let defsRing = '', ringSvg = '', ringCss = '', legend = '';
  rings.forEach((g, i) => {
    const n = solved[g.k] || 0;
    const circ = +(2 * Math.PI * g.r).toFixed(1);
    let frac = Math.min(n / GOALS[g.k], 1);
    if (n > 0 && frac < 0.04) frac = 0.04;
    const to = +(circ * (1 - frac)).toFixed(1);

    defsRing += `<linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.c1}"/><stop offset="1" stop-color="${g.c2}"/></linearGradient>`;
    ringCss += `@keyframes rg${i}{to{stroke-dashoffset:${to}}}
    .rg${i}{stroke:url(#g${i});stroke-dasharray:${circ};stroke-dashoffset:${circ};filter:drop-shadow(0 0 6px ${g.glow});animation:rg${i} 1.8s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.3}s forwards}`;
    ringSvg += `<circle cx="${CX}" cy="${CY}" r="${g.r}" class="track"/>
    <circle cx="${CX}" cy="${CY}" r="${g.r}" class="ring rg${i}" transform="rotate(-90 ${CX} ${CY})"/>`;

    const y = 150 + i * 66, BW = 290;
    legend += `
    <g class="fade" style="animation-delay:${0.6 + i * 0.2}s">
      <circle cx="352" cy="${y - 6}" r="6" fill="url(#g${i})"/>
      <text x="368" y="${y}" class="lab">${g.k}</text>
      <text
