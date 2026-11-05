// Usage: [FILES=a,b] node tests/drills.test.js [drillId|all] [seedsPerOptionCombo]
// Smoke-test every registered drill: many seeds x all option combos; validate exercise structure.
const load = require('./load');
const fs = require('fs');
const core = ['ns','rng','frac','lp','bnb','bnbsteps','viz','runner'].map(f => `js/core/${f}.js`);
// FILES=bnb-pure,bnb-mixed  -> load only these drill files (others may be mid-edit)
const want = process.env.FILES ? process.env.FILES.split(',').map(s => s.trim().replace(/\.js$/, '') + '.js') : null;
const all = fs.readdirSync(__dirname + '/../js/drills').filter(f => f.endsWith('.js'));
const ordered = ['formulation.js', 'bnb-pure.js'].filter(f => all.includes(f)).concat(all.filter(f => !['formulation.js', 'bnb-pure.js'].includes(f)));
const drills = ordered.filter(f => !want || want.includes(f)).map(f => 'js/drills/' + f);
const OR = load(core.concat(drills));
const only = process.argv[2];
const N = +(process.argv[3] || 60);
let bad = 0;
function combos(options) {
  let out = [{}];
  for (const o of options || []) {
    const vals = o.type === 'checkbox' ? [true, false] : o.choices.map(c => c.value);
    out = out.flatMap(c => vals.map(v => Object.assign({}, c, { [o.key]: v })));
  }
  return out;
}
function validate(ex, tag) {
  const errs = [];
  if (!ex || !ex.title || !Array.isArray(ex.steps) || !ex.steps.length) errs.push('missing title/steps');
  (ex.steps || []).forEach((s, i) => {
    const t = `step ${i}`;
    if (!s.prompt) errs.push(t + ' no prompt');
    if (s.kind === 'number') {
      if (!s.fields || !s.fields.length) errs.push(t + ' no fields');
      (s.fields || []).forEach(f => { try { OR.F(f.answer); } catch (e) { errs.push(t + ' bad answer ' + f.answer); } });
    } else if (s.kind === 'choice' || s.kind === 'multi') {
      const nc = (s.options || []).filter(o => o.correct).length;
      if (!s.options || s.options.length < 2) errs.push(t + ' <2 options');
      if (s.kind === 'choice' && nc !== 1) errs.push(t + ` choice with ${nc} correct`);
      if (s.kind === 'multi' && nc < 1) errs.push(t + ' multi with 0 correct');
      const htmls = (s.options || []).map(o => o.html);
      if (new Set(htmls).size !== htmls.length) errs.push(t + ' duplicate options: ' + htmls.join(' | '));
    } else if (s.kind === 'sequence') {
      if (!s.sequence || !s.sequence.answer || !s.sequence.answer.length) errs.push(t + ' no sequence answer');
    } else if (s.kind === 'text') {
      if (!s.answers || !s.answers.length) errs.push(t + ' no answers');
    } else if (s.kind !== 'info') errs.push(t + ' unknown kind ' + s.kind);
    for (const v of [s.viz, s.vizDuring].filter(Boolean)) { try { OR.viz.render(v); } catch (e) { errs.push(t + ' viz error ' + e.message); } }
  });
  try { OR.viz.render(ex.viz); } catch (e) { errs.push('ex viz error ' + e.message); }
  if (errs.length) { bad++; console.log('✗', tag, errs.slice(0, 5).join('; ')); }
}
for (const d of Object.values(OR.drills)) {
  if (only && only !== 'all' && d.id !== only) continue;
  const cs = combos(d.options);
  let ms = 0, n = 0, steps = 0, maxMs = 0, fail = 0;
  for (const opts of cs) for (let s = 1; s <= N; s++) {
    const t0 = Date.now();
    let ex;
    try { ex = d.generate(OR.rng(s * 7919), opts); } catch (e) { fail++; if (fail < 4) console.log('✗ throw', d.id, JSON.stringify(opts), s, e.message); continue; }
    const dt = Date.now() - t0; ms += dt; maxMs = Math.max(maxMs, dt); n++; steps += ex.steps.length;
    validate(ex, `${d.id} ${JSON.stringify(opts)} seed=${s}`);
  }
  console.log(`${d.id}: ${n} ok, ${fail} throws, avg ${(ms / Math.max(n,1)).toFixed(0)}ms (max ${maxMs}), avg steps ${(steps / Math.max(n,1)).toFixed(1)}`);
}
console.log(bad ? `${bad} INVALID` : 'structure OK');
