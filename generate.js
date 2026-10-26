const fs = require('fs');
const USER = 'karishma_yd_0805';
const GOALS = { Easy: 100, Medium: 100, Hard: 50 };   // ring ke goals, apne hisaab se badlo

(async () => {
  const query = `
    query($u: String!) {
      allQuestionsCount { difficulty count }
      matchedUser(username: $u) {
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

  const solved = {}, totals = {};
  data.matchedUser.submitStats.acSubmissionNum.forEach(x => (solved[x.difficulty] = x.count));
  data.allQuestionsCount.forEach(x => (totals[x.difficulty] = x.count));
  const cal = JSON.parse(data.matchedUser.userCalendar.submissionCalendar || '{}');
  const streak = data.matchedUser.userCalendar.streak;
  const active = data.matchedUser.userCalendar.totalActiveDays;
  const subs = Object.values(cal).reduce((a, b) => a + b, 0);

  // ---------- rings ----------
  const CX = 150, CY = 175;
  const rings = [
    { k: 'Easy',   r: 80, c: '#00d4aa' },
    { k: 'Medium', r: 63, c: '#ffb800' },
    { k: 'Hard',   r: 46, c: '#ff4d6d' },
  ];
  let ringSvg = '', ringCss = '', legend = '';
  rings.forEach((g, i) => {
    const n = solved[g.k] || 0;
    const circ = +(2 * Math.PI * g.r).toFixed(1);
    let frac = Math.min(n / GOALS[g.k], 1);
    if (n > 0 && frac < 0.04) frac = 0.04;
    const to = +(circ * (1 - frac)).toFixed(1);
    ringCss += `@keyframes rg${i}{to{stroke-dashoffset:${to}}}
      .rg${i}{stroke:${g.c};stroke-dasharray:${circ};stroke-dashoffset:${circ};animation:rg${i} 1.6s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.25}s forwards}`;
    ringSvg += `<circle cx="${CX}" cy="${CY}" r="${g.r}" class="track"/>
      <circle cx="${CX}" cy="${CY}" r="${g.r}" class="ring rg${i}" transform="rotate(-90 ${CX} ${CY})"/>`;

    const y = 115 + i * 52, W = 260;
    legend += `
      <g class="fade" style="animation-delay:${0.5 + i * 0.2}s">
        <circle cx="306" cy="${y - 5}" r="5" fill="${g.c}"/>
        <text x="322" y="${y}" class="lab">${g.k}</text>
        <text x="560" y="${y}" text-anchor="end" class="num">${n}<tspan class="dim"> / ${totals[g.k]}</tspan></text>
        <rect x="300" y="${y + 12}" width="${W}" height="6" rx="3" fill="#2a2f3a"/>
        <rect x="300" y="${y + 12}" width="${Math.max(frac * W, n ? 6 : 0)}" height="6" rx="3" fill="${g.c}" class="grow" style="animation-delay:${0.6 + i * 0.25}s"/>
      </g>`;
  });

  // ---------- stat cards ----------
  const stat = (y, label, value, d, extra = '') => `
    <g class="fade" style="animation-delay:${d}s">
      <rect x="610" y="${y}" width="170" height="62" rx="14" fill="#1b2029" stroke="#2c3340"/>
      <text x="628" y="${y + 24}" class="small">${label}</text>
      <text x="628" y="${y + 50}" class="stat ${extra}">${value}</text>
    </g>`;
  const stats = stat(95, 'CURRENT STREAK', streak + ' days 🔥', 0.7, 'flame')
              + stat(167, 'ACTIVE DAYS', active, 0.85)
              + stat(239, 'SUBMISSIONS (1Y)', subs, 1.0);

  // ---------- heatmap ----------
  const DAY = 86400, WEEKS = 52;
  const now = new Date();
  const today = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000);
  const dow = new Date(today * 1000).getUTCDay();
  const start = today - ((WEEKS - 1) * 7 + dow) * DAY;
  const colors = ['#232834', '#0f5c4d', '#13967c', '#19c9a4', '#7dffe0'];
  const level = c => (c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : c <= 7 ? 3 : 4);
  let cells = '';
  for (let d = 0; d <= (WEEKS - 1) * 7 + dow; d++) {
    const col = Math.floor(d / 7), row = d % 7;
    const c = cal[start + d * DAY] || 0;
    cells += `<rect class="cell" x="${46 + col * 14}" y="${318 + row * 14}" width="11" height="11" rx="3" fill="${colors[level(c)]}" style="animation-delay:${(1.0 + col * 0.02).toFixed(2)}s"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="440" viewBox="0 0 820 440">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14181f"/><stop offset="1" stop-color="#0c0f14"/>
    </linearGradient>
    <radialGradient id="o1"><stop offset="0" stop-color="#ffb800" stop-opacity=".22"/><stop offset="1" stop-color="#ffb800" stop-opacity="0"/></radialGradient>
    <radialGradient id="o2"><stop offset="0" stop-color="#00d4aa" stop-opacity=".2"/><stop offset="1" stop-color="#00d4aa" stop-opacity="0"/></radialGradient>
  </defs>
  <style>
    text{font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
    .title{fill:#fff;font-size:22px;font-weight:700}
    .sub{fill:#7d8590;font-size:13px}
    .lab{fill:#c9d1d9;font-size:15px;font-weight:600}
    .num{fill:#fff;font-size:17px;font-weight:700}
    .dim{fill:#6b7480;font-size:12px;font-weight:500}
    .small{fill:#7d8590;font-size:10.5px;font-weight:600;letter-spacing:1px}
    .stat{fill:#fff;font-size:22px;font-weight:700}
    .big{fill:#fff;font-size:40px;font-weight:800;text-anchor:middle;opacity:0;transform-box:fill-box;transform-origin:center;animation:zoom .9s cubic-bezier(.22,1,.36,1) .4s forwards}
    .center-sub{fill:#7d8590;font-size:11px;font-weight:600;letter-spacing:2px;text-anchor:middle;opacity:0;animation:fade .8s ease .9s forwards}
    .track{fill:none;stroke:#222833;stroke-width:10}
    .ring{fill:none;stroke-width:10;stroke-linecap:round;filter:drop-shadow(0 0 4px currentColor)}
    ${ringCss}
    .fade{opacity:0;animation:fade .8s ease forwards}
    .grow{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:grow 1.2s cubic-bezier(.22,1,.36,1) forwards}
    .cell{opacity:0;transform-box:fill-box;transform-origin:center;animation:pop .45s ease forwards}
    .flame{animation:glow 1.6s ease-in-out infinite alternate}
    .orb1{animation:drift1 9s ease-in-out infinite alternate}
    .orb2{animation:drift2 11s ease-in-out infinite alternate}
    @keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes zoom{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
    @keyframes grow{to{transform:scaleX(1)}}
    @keyframes pop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
    @keyframes glow{from{filter:drop-shadow(0 0 1px #ff7a00)}to{filter:drop-shadow(0 0 9px #ff5e00)}}
    @keyframes drift1{from{transform:translate(0,0)}to{transform:translate(60px,30px)}}
    @keyframes drift2{from{transform:translate(0,0)}to{transform:translate(-50px,-25px)}}
  </style>

  <rect width="820" height="440" rx="22" fill="url(#bg)"/>
  <rect x=".5" y=".5" width="819" height="439" rx="21.5" fill="none" stroke="#2a303b"/>
  <circle class="orb1" cx="120" cy="120" r="170" fill="url(#o1)"/>
  <circle class="orb2" cx="700" cy="330" r="190" fill="url(#o2)"/>

  <text x="40" y="48" class="title fade" style="animation-delay:.1s">LeetCode Progress</text>
  <text x="40" y="68" class="sub fade" style="animation-delay:.2s">@${USER}</text>

  ${ringSvg}
  <text x="${CX}" y="${CY + 8}" class="big">${solved.All}</text>
  <text x="${CX}" y="${CY + 30}" class="center-sub">SOLVED</text>

  ${legend}
  ${stats}

  <text x="46" y="306" class="small fade" style="animation-delay:.9s">SUBMISSION ACTIVITY · PAST YEAR</text>
  ${cells}
</svg>`;

  fs.writeFileSync('leetcode.svg', svg);
  console.log('done', solved, { streak, active, subs });
})();
