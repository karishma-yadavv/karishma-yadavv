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
      <text x="640" y="${y}" text-anchor="end" class="num">${n}<tspan class="dim"> / ${totals[g.k]}</tspan></text>
      <rect x="350" y="${y + 14}" width="${BW}" height="8" rx="4" fill="#232a36"/>
      <rect x="350" y="${y + 14}" width="${Math.max(frac * BW, n ? 8 : 0)}" height="8" rx="4" fill="url(#g${i})" class="grow" style="animation-delay:${0.7 + i * 0.25}s;filter:drop-shadow(0 0 4px ${g.glow})"/>
    </g>`;
  });

  // ---------- stat cards ----------
  const stat = (y, label, value, d, extra = '') => `
    <g class="fade" style="animation-delay:${d}s">
      <rect x="675" y="${y}" width="190" height="72" rx="16" fill="#171c25" stroke="#2c3544"/>
      <rect x="675" y="${y}" width="5" height="72" rx="2.5" fill="url(#gAcc)"/>
      <text x="696" y="${y + 27}" class="small">${label}</text>
      <text x="696" y="${y + 56}" class="stat ${extra}">${value}</text>
    </g>`;
  const stats = stat(108, 'GLOBAL RANK', '#' + rank, 0.8)
              + stat(190, 'CURRENT STREAK', streak + ' days 🔥', 0.95, 'flame')
              + stat(272, 'ACTIVE DAYS', active, 1.1);

  // ---------- heatmap ----------
  const DAY = 86400, WEEKS = 53, PITCH = 16, X0 = 28, Y0 = 408;
  const now = new Date();
  const today = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000);
  const dow = new Date(today * 1000).getUTCDay();
  const start = today - ((WEEKS - 1) * 7 + dow) * DAY;
  const colors = ['#1d232e', '#0e5a4b', '#12957b', '#1fd1a8', '#8dffe6'];
  const level = c => (c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : c <= 7 ? 3 : 4);
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let cells = '', months = '', lastM = -1;
  for (let d = 0; d <= (WEEKS - 1) * 7 + dow; d++) {
    const col = Math.floor(d / 7), row = d % 7;
    const ts = start + d * DAY;
    const c = cal[ts] || 0;
    if (row === 0) {
      const m = new Date(ts * 1000).getUTCMonth();
      if (m !== lastM) { months += `<text x="${X0 + col * PITCH}" y="${Y0 + 7 * PITCH + 14}" class="mon">${MON[m]}</text>`; lastM = m; }
    }
    cells += `<rect class="cell" x="${X0 + col * PITCH}" y="${Y0 + row * PITCH}" width="12.5" height="12.5" rx="3.5" fill="${colors[level(c)]}" style="animation-delay:${(1.1 + col * 0.025).toFixed(2)}s"/>`;
  }

  // ---------- floating particles ----------
  let particles = '';
  for (let i = 0; i < 16; i++) {
    const x = 30 + ((i * 197) % 840), y = 30 + ((i * 113) % 480);
    particles += `<circle cx="${x}" cy="${y}" r="${1.2 + (i % 3) * 0.8}" fill="#fff" class="ptc" style="animation-delay:${(i * 0.45).toFixed(2)}s;animation-duration:${4 + (i % 4)}s"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#141922"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
    <linearGradient id="gTitle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#ffd000"/><stop offset="1" stop-color="#ff7a00"/></linearGradient>
    <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd000"/><stop offset="1" stop-color="#ff5d8f"/></linearGradient>
    <linearGradient id="gBorder" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00f5c8"/><stop offset=".5" stop-color="#ffd000"/><stop offset="1" stop-color="#ff2e63"/></linearGradient>
    <radialGradient id="o1"><stop offset="0" stop-color="#ffb800" stop-opacity=".25"/><stop offset="1" stop-color="#ffb800" stop-opacity="0"/></radialGradient>
    <radialGradient id="o2"><stop offset="0" stop-color="#00d4aa" stop-opacity=".22"/><stop offset="1" stop-color="#00d4aa" stop-opacity="0"/></radialGradient>
    <radialGradient id="o3"><stop offset="0" stop-color="#ff2e63" stop-opacity=".16"/><stop offset="1" stop-color="#ff2e63" stop-opacity="0"/></radialGradient>
    ${defsRing}
  </defs>
  <style>
    text{font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
    .title{fill:url(#gTitle);font-size:28px;font-weight:800}
    .sub{fill:#7d8590;font-size:14px}
    .lab{fill:#d6dde6;font-size:17px;font-weight:600}
    .num{fill:#fff;font-size:20px;font-weight:800}
    .dim{fill:#6b7480;font-size:13px;font-weight:500}
    .small{fill:#7d8590;font-size:10.5px;font-weight:700;letter-spacing:1.4px}
    .stat{fill:#fff;font-size:23px;font-weight:800}
    .mon{fill:#6b7480;font-size:11px}
    .big{fill:#fff;font-size:48px;font-weight:800;text-anchor:middle;opacity:0;transform-box:fill-box;transform-origin:center;animation:zoom 1s cubic-bezier(.22,1,.36,1) .5s forwards}
    .center-sub{fill:#8b95a3;font-size:12px;font-weight:700;letter-spacing:3px;text-anchor:middle;opacity:0;animation:fade .8s ease 1s forwards}
    .track{fill:none;stroke:#1e2530;stroke-width:14}
    .ring{fill:none;stroke-width:14;stroke-linecap:round}
    ${ringCss}
    .spin{fill:none;stroke:#3a4556;stroke-width:1.5;stroke-dasharray:3 9;transform-box:fill-box;transform-origin:center;animation:spin 40s linear infinite}
    .spin2{fill:none;stroke:#ffd000;stroke-opacity:.5;stroke-width:2;stroke-dasharray:30 600;transform-box:fill-box;transform-origin:center;animation:spin 7s linear infinite reverse}
    .run{fill:none;stroke:url(#gBorder);stroke-width:2.5;stroke-dasharray:110 890;stroke-linecap:round;filter:drop-shadow(0 0 5px #ffd000);animation:run 6s linear infinite}
    .fade{opacity:0;animation:fade .8s ease forwards}
    .grow{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:grow 1.3s cubic-bezier(.22,1,.36,1) forwards}
    .cell{opacity:0;transform-box:fill-box;transform-origin:center;animation:pop .5s ease forwards}
    .flame{animation:glow 1.5s ease-in-out infinite alternate}
    .orb1{animation:drift1 10s ease-in-out infinite alternate}
    .orb2{animation:drift2 12s ease-in-out infinite alternate}
    .orb3{animation:drift1 14s ease-in-out infinite alternate-reverse}
    .ptc{opacity:0;animation:twinkle 5s ease-in-out infinite}
    @keyframes fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    @keyframes zoom{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
    @keyframes grow{to{transform:scaleX(1)}}
    @keyframes pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
    @keyframes glow{from{filter:drop-shadow(0 0 1px #ff7a00)}to{filter:drop-shadow(0 0 10px #ff5e00)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes run{to{stroke-dashoffset:-1000}}
    @keyframes twinkle{0%,100%{opacity:0;transform:translateY(0)}50%{opacity:.6;transform:translateY(-14px)}}
    @keyframes drift1{from{transform:translate(0,0)}to{transform:translate(70px,35px)}}
    @keyframes drift2{from{transform:translate(0,0)}to{transform:translate(-60px,-30px)}}
  </style>

  <rect width="${W}" height="${H}" rx="26" fill="url(#bg)"/>
  <circle class="orb1" cx="140" cy="130" r="200" fill="url(#o1)"/>
  <circle class="orb2" cx="760" cy="380" r="220" fill="url(#o2)"/>
  <circle class="orb3" cx="470" cy="60" r="160" fill="url(#o3)"/>
  ${particles}
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="25.5" fill="none" stroke="#2a313d"/>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="24.5" pathLength="1000" class="run"/>

  <text x="36" y="54" class="title fade" style="animation-delay:.1s">LeetCode Progress</text>
  <text x="36" y="76" class="sub fade" style="animation-delay:.2s">@${USER}  ·  ${solved.All} solved of ${totals.All}</text>

  <circle cx="${CX}" cy="${CY}" r="124" class="spin"/>
  <circle cx="${CX}" cy="${CY}" r="124" class="spin2"/>
  ${ringSvg}
  <text x="${CX}" y="${CY + 8}" class="big">${solved.All}</text>
  <text x="${CX}" y="${CY + 30}" class="center-sub">SOLVED</text>

  ${legend}
  ${stats}

  <text x="${X0}" y="392" class="small fade" style="animation-delay:1s">SUBMISSION ACTIVITY  ·  ${subs} IN THE PAST YEAR</text>
  ${cells}
  ${months}
</svg>`;

  fs.writeFileSync('leetcode.svg', svg);
  console.log('done', solved, { streak, active, subs, rank });
})();
