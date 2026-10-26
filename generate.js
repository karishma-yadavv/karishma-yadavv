const fs = require('fs');
const USER = 'karishma_yd_0805';

(async () => {
  const res = await fetch(`https://alfa-leetcode-api.onrender.com/${USER}/solved`);
  if (!res.ok) throw new Error('API failed: ' + res.status);
  const d = await res.json();
  console.log(d); // shows the real field names in the Actions log

  const total  = d.solvedProblem;
  const easy   = d.easySolved;
  const medium = d.mediumSolved;
  const hard   = d.hardSolved;

  const pct = Math.min(total / 3000, 1);
  const offset = Math.round(251 * (1 - pct));

  let svg = fs.readFileSync('template.svg', 'utf8');
  svg = svg.replace('{{TOTAL}}', total)
           .replace('{{EASY}}', easy)
           .replace('{{MEDIUM}}', medium)
           .replace('{{HARD}}', hard)
           .replace('{{OFFSET}}', offset)
           .replace('{{PCT}}', Math.round(pct * 100));
  fs.writeFileSync('leetcode.svg', svg);
})();
