// Validates summaries / concept questions / cheatsheet for every topic.
// Usage: node tests/content.test.js
const load = require('./load');
// CONTENT=ch3,ch4 -> load only these extra files (others may be mid-edit)
const fs = require('fs');
const extra = ['ch2d', 'ch3', 'ch4', 'ch5', 'ch6']
  .filter((f) => (!process.env.CONTENT || process.env.CONTENT.split(',').includes(f)) && fs.existsSync(__dirname + '/../js/content/' + f + '.js'))
  .map((f) => 'js/content/' + f + '.js');
const OR = load(['js/core/ns.js', 'js/content/ch1.js', 'js/content/ch2.js', 'js/content/ch2b.js', 'js/content/ch2c.js', 'js/content/cheatsheet.js'].concat(extra));
// CH=3,5 -> only check topics of these chapters
const CH = process.env.CH ? process.env.CH.split(',').map(Number) : null;
let bad = 0;
const err = (m) => { bad++; console.log('✗', m); };
const strip = (h) => String(h).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
let total = 0;
for (const t of OR.topics.filter((t) => !CH || CH.includes(t.ch))) {
  const s = OR.content.summaries[t.id];
  const c = OR.content.concepts[t.id] || [];
  if (!s || strip(s).length < 200) err(`${t.id}: summary missing/short`);
  if (c.length < 6) err(`${t.id}: only ${c.length} concepts`);
  c.forEach((q, i) => {
    const tag = `${t.id}#${i + 1}`;
    if (!q.q || !Array.isArray(q.options) || q.options.length < 2) return err(`${tag}: bad shape`);
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
    if (!ans.length || ans.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) err(`${tag}: answer out of range`);
    if (new Set(ans).size !== ans.length) err(`${tag}: duplicate answer idx`);
    const o = q.options.map(strip);
    if (new Set(o).size !== o.length) err(`${tag}: duplicate options`);
    if (!q.explain || strip(q.explain).length < 15) err(`${tag}: missing explain`);
    if (/hepsi|all of the above|none of the above|hiçbiri/i.test(o.join('|')) && !q.keepOrder) err(`${tag}: all/none option without keepOrder`);
  });
  total += c.length;
  console.log(`${t.id.padEnd(6)} summary ${String(strip(s || '').length).padStart(5)} chars · ${c.length} concepts`);
}
if (!OR.content.cheatsheet || strip(OR.content.cheatsheet).length < 500) err('cheatsheet missing/short');
console.log(`total concepts: ${total}`);
console.log(bad ? `${bad} PROBLEMS` : 'content OK');
