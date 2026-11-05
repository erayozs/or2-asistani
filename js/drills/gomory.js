/* 2.9.1 · Gomory cutting plane algorithm (notes Example 14 Telfa / Example 15, Winston 9.8).
   - Random 2-variable pure IP: max c·x, two ≤ constraints with small integer data, x ≥ 0 and integer.
   - The optimal LR tableau is computed here with an exact-fraction tableau simplex (Dantzig rule: most negative R0
     coefficient enters, min ratio leaves). With Telfa's data this reproduces the notes' tableau exactly
     (row 1: x2, row 2: x1).
   - Cut (notes step 3–5): source row = constraint row whose RHS fractional part is closest to 1/2 (instances with ties
     are rejected; the notes break their Telfa tie "arbitrarily"). Integer parts (round down) to the left, fractional
     parts to the right:  f0 − Σ f_j N_j ≤ 0  (N_j nonbasic). Added to the tableau as  −Σ f_j N_j + s_new = −f0.
   - Dual simplex (notes): most negative RHS row leaves; for negative pivot-row coefficients compute
     |R0 coefficient / pivot-row coefficient|; smallest enters. Ties (row or ratio) → instance rejected.
   - Repeat until all basic variables are integer; final optimum verified by brute force over the integer grid.
   Exposes OR.drills['gomory-cut'].{lrTableau, gomory, bruteForce} for verification scripts. */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const half = F('1/2');

  // ------------------------------------------------------------------ formatting
  const fh = (v) => {
    v = F(v);
    const s = v.html();
    return s.startsWith('-') ? '−' + s.slice(1) : s;
  };
  const varName = (nm) => nm.replace(/^([a-z])(\d+)$/, '$1<sub>$2</sub>');

  // ------------------------------------------------------------------ tableau
  // T = { names:[..], R0:[Frac], z:Frac, rows:[{bv, a:[Frac], rhs}], expr:[{k:[Frac,Frac], c:Frac}] }
  // expr[j]: column j's variable as an affine function of (x1, x2): value = c + k·x
  const clone = (T) => ({
    names: T.names.slice(),
    R0: T.R0.slice(),
    z: T.z,
    rows: T.rows.map((r) => ({ bv: r.bv, a: r.a.slice(), rhs: r.rhs })),
    expr: T.expr.slice(),
  });

  function pivot(T, r, col) {
    const T2 = clone(T);
    const pr = T2.rows[r];
    const p = pr.a[col];
    pr.a = pr.a.map((v) => v.div(p));
    pr.rhs = pr.rhs.div(p);
    pr.bv = col;
    T2.rows.forEach((row, i) => {
      if (i === r || row.a[col].isZero()) return;
      const f = row.a[col];
      row.a = row.a.map((v, j) => v.sub(f.mul(pr.a[j])));
      row.rhs = row.rhs.sub(f.mul(pr.rhs));
    });
    const f0 = T2.R0[col];
    if (!f0.isZero()) {
      T2.R0 = T2.R0.map((v, j) => v.sub(f0.mul(pr.a[j])));
      T2.z = T2.z.sub(f0.mul(pr.rhs));
    }
    return T2;
  }

  // Optimal LR tableau by primal simplex. Returns null on degeneracy / ties / alternative optima.
  function lrTableau(P) {
    const m = P.A.length;
    const names = ['x1', 'x2'].concat(OR.util.range(m).map((i) => 's' + (i + 1)));
    const n = names.length;
    let T = {
      names,
      R0: P.c.map((c) => F(-c)).concat(OR.util.range(m).map(() => F(0))),
      z: F(0),
      rows: P.A.map((row, i) => ({
        bv: 2 + i,
        a: row.map(F).concat(OR.util.range(m).map((k) => F(k === i ? 1 : 0))),
        rhs: F(P.b[i]),
      })),
      expr: [
        { k: [F(1), F(0)], c: F(0) },
        { k: [F(0), F(1)], c: F(0) },
      ].concat(P.A.map((row, i) => ({ k: [F(-row[0]), F(-row[1])], c: F(P.b[i]) }))),
    };
    for (let it = 0; it < 10; it++) {
      let col = -1;
      for (let j = 0; j < n; j++) if (T.R0[j].lt(0) && (col < 0 || T.R0[j].lt(T.R0[col]))) col = j;
      if (col < 0) break;
      let r = -1, best = null, tie = false;
      T.rows.forEach((row, i) => {
        if (!row.a[col].gt(0)) return;
        const ratio = row.rhs.div(row.a[col]);
        if (best === null || ratio.lt(best)) { best = ratio; r = i; tie = false; }
        else if (ratio.eq(best)) tie = true;
      });
      if (r < 0 || tie) return null;
      T = pivot(T, r, col);
    }
    const basic = new Set(T.rows.map((r) => r.bv));
    if (T.R0.some((v, j) => v.lt(0) || (!basic.has(j) && v.isZero()))) return null; // not optimal / alt. optima
    if (T.rows.some((r) => !r.rhs.gt(0))) return null; // degenerate
    return T;
  }

  const solX = (T) => {
    const x = [F(0), F(0)];
    T.rows.forEach((r) => { if (r.bv < 2) x[r.bv] = r.rhs; });
    return x;
  };
  const isIntegral = (T) => T.rows.every((r) => r.rhs.isInt());
  const nonbasic = (T) => {
    const basic = new Set(T.rows.map((r) => r.bv));
    return T.names.map((_, j) => j).filter((j) => !basic.has(j));
  };

  // source row: fractional RHS with fractional part closest to 1/2. forceRow overrides (notes' "arbitrary" choice).
  function pickRow(T, forceRow) {
    if (forceRow != null) return { r: forceRow, tie: false };
    let r = -1, best = null, tie = false;
    T.rows.forEach((row, i) => {
      if (row.rhs.isInt()) return;
      const d = row.rhs.frac().sub(half).abs();
      if (best === null || d.lt(best)) { best = d; r = i; tie = false; }
      else if (d.eq(best)) tie = true;
    });
    return { r, tie };
  }

  // add the Gomory cut of row r; returns {T, cut}
  function addCut(T, r) {
    const row = T.rows[r];
    const nb = nonbasic(T);
    const f = {}, fl = {};
    nb.forEach((j) => { f[j] = row.a[j].frac(); fl[j] = row.a[j].floor(); });
    const f0 = row.rhs.frac(), fl0 = row.rhs.floor();
    const newIdx = T.names.length;
    const T2 = clone(T);
    T2.names.push('s' + (newIdx - 1)); // x1,x2,s1..sm → next slack number
    T2.R0.push(F(0));
    T2.rows.forEach((rw) => rw.a.push(F(0)));
    const a = T2.names.map((_, j) => (j === newIdx ? F(1) : f[j] !== undefined ? f[j].neg() : F(0)));
    T2.rows.push({ bv: newIdx, a, rhs: f0.neg() });
    // s_new = −f0 + Σ f_j N_j  (as a function of x)
    let k = [F(0), F(0)], c = f0.neg();
    nb.forEach((j) => {
      const e = T.expr[j];
      k = [k[0].add(f[j].mul(e.k[0])), k[1].add(f[j].mul(e.k[1]))];
      c = c.add(f[j].mul(e.c));
    });
    T2.expr.push({ k, c });
    // cut f0 − Σ f_j N_j ≤ 0  ⇔  s_new ≥ 0  ⇔  −k·x ≤ c ; scale to coprime integers
    let alpha = [k[0].neg(), k[1].neg()], beta = c;
    const den = [alpha[0], alpha[1], beta].reduce((L, v) => { const d = v.d; const g = gcdB(L, d); return (L / g) * d; }, 1n);
    let ints = [alpha[0], alpha[1], beta].map((v) => v.mul(F(den)).n);
    const g = ints.reduce((G, v) => gcdB(G, v < 0n ? -v : v), 0n) || 1n;
    ints = ints.map((v) => v / g);
    const cut = { r, bvRow: row.bv, nb, f, fl, f0, fl0, rowA: row.a.slice(), rhs: row.rhs, newIdx, xAlpha: [F(ints[0]), F(ints[1])], xBeta: F(ints[2]) };
    return { T: T2, cut };
  }
  function gcdB(a, b) {
    while (b) [a, b] = [b, a % b];
    return a < 0n ? -a : a;
  }

  // one dual simplex iteration; returns {T, info} or null if ambiguous / infeasible
  function dualStep(T) {
    let r = -1, tieR = false;
    T.rows.forEach((row, i) => {
      if (!row.rhs.lt(0)) return;
      if (r < 0 || row.rhs.lt(T.rows[r].rhs)) { r = i; tieR = false; }
      else if (row.rhs.eq(T.rows[r].rhs)) tieR = true;
    });
    if (r < 0 || tieR) return null;
    const pr = T.rows[r];
    const ratios = [];
    pr.a.forEach((v, j) => { if (v.lt(0)) ratios.push({ j, ratio: T.R0[j].div(v).abs() }); });
    if (!ratios.length) return null;
    const minR = ratios.reduce((m, q) => (q.ratio.lt(m) ? q.ratio : m), ratios[0].ratio);
    const win = ratios.filter((q) => q.ratio.eq(minR));
    if (win.length !== 1 || minR.isZero()) return null;
    const T2 = pivot(T, r, win[0].j);
    return { T: T2, info: { r, leave: pr.bv, enter: win[0].j, ratios, pivotVal: pr.a[win[0].j] } };
  }

  // full Gomory run. opts: {maxCuts, forceRows:[row per cut]}. Returns {lr, rounds:[{before, cut, withCut, iters:[{T,info}], after}], final} or {bad}
  function gomory(P, opts) {
    opts = opts || {};
    const lr = lrTableau(P);
    if (!lr) return { bad: 'lr' };
    if (isIntegral(lr)) return { bad: 'integral' };
    const rounds = [];
    let T = lr;
    for (let k = 0; k < (opts.maxCuts || 2); k++) {
      const pk = pickRow(T, opts.forceRows && opts.forceRows[k]);
      if (pk.tie || pk.r < 0) return { bad: 'rowtie' };
      const { T: Tc, cut } = addCut(T, pk.r);
      const iters = [];
      let cur = Tc;
      for (let it = 0; it < 3 && cur.rows.some((rw) => rw.rhs.lt(0)); it++) {
        const st = dualStep(cur);
        if (!st) return { bad: 'dualtie' };
        iters.push(st);
        cur = st.T;
      }
      if (cur.rows.some((rw) => rw.rhs.lt(0))) return { bad: 'dualiters' };
      rounds.push({ before: T, cut, withCut: Tc, iters, after: cur });
      T = cur;
      if (isIntegral(T)) return { lr, rounds, final: T };
    }
    return { bad: 'toomany', lr, rounds };
  }

  function bruteForce(P) {
    let best = null, arg = null, count = 0;
    for (let a = 0; a <= 40; a++) for (let b = 0; b <= 40; b++) {
      if (!P.A.every((r, i) => r[0] * a + r[1] * b <= P.b[i])) continue;
      const z = P.c[0] * a + P.c[1] * b;
      if (best === null || z > best) { best = z; arg = [a, b]; count = 1; }
      else if (z === best) count++;
    }
    return { z: best, x: arg, count };
  }

  // ------------------------------------------------------------------ instance generation
  function maxDen(T) {
    let d = 1n;
    const upd = (v) => { if (v.d > d) d = v.d; };
    T.R0.forEach(upd); upd(T.z);
    T.rows.forEach((r) => { r.a.forEach(upd); upd(r.rhs); });
    return d;
  }

  function genInstance(rng, opts) {
    const want = opts.cuts === '2' ? [2] : opts.cuts === '1' ? [1] : [1, 2];
    for (let tries = 0; tries < 3000; tries++) {
      const c = [rng.int(2, 9), rng.int(2, 9)];
      const a1 = [rng.int(1, 3), rng.int(1, 3)];
      const a2 = [rng.int(3, 9), rng.int(2, 6)];
      if (rng.chance(0.5)) a2.reverse();
      const b1 = rng.int(3, 8) * Math.max(1, Math.min(a1[0], a1[1]));
      const b2 = rng.int(12, 50);
      const P = { c, A: [a1, a2], b: [b1, b2] };
      const ints = [b1 / a1[0], b1 / a1[1], b2 / a2[0], b2 / a2[1]];
      if (Math.max(...ints) > 11 || Math.min(...ints) < 2) continue;
      if (a1[0] * a2[1] === a1[1] * a2[0]) continue;
      const run = gomory(P, { maxCuts: Math.max(...want) });
      if (run.bad) continue;
      if (solX(run.lr).some((v) => v.isZero()) && !rng.chance(0.25)) continue; // mostly interior corners (like Telfa)
      if (!want.includes(run.rounds.length)) continue;
      // nice numbers
      const tabs = [run.lr].concat(...run.rounds.map((rd) => [rd.withCut].concat(rd.iters.map((s) => s.T))));
      if (tabs.some((T) => maxDen(T) > 12n)) continue;
      if (run.rounds.some((rd) => rd.cut.xAlpha.concat([rd.cut.xBeta]).some((v) => v.abs().gt(60)))) continue;
      // the cut should actually cut: the source row must have at least one nonzero fractional coefficient (always true)
      const bf = bruteForce(P);
      const xf = solX(run.final);
      if (bf.count !== 1 || !F(bf.z).eq(run.final.z) || !xf[0].eq(bf.x[0]) || !xf[1].eq(bf.x[1])) continue;
      return { P, run, bf };
    }
    return null;
  }

  // ------------------------------------------------------------------ viz
  function tabViz(T, caption, mark) {
    mark = mark || {};
    const colLabels = T.names.map(varName).concat(['RHS']);
    const rowLabels = ['z (R0)'].concat(T.rows.map((r) => varName(T.names[r.bv])));
    const cells = [T.R0.map(fh).concat([fh(T.z)])].concat(T.rows.map((r) => r.a.map(fh).concat([fh(r.rhs)])));
    const cls = cells.map((row, i) =>
      row.map((_, j) => {
        const ri = i - 1;
        if (mark.pivot && ri === mark.pivot[0] && j === mark.pivot[1]) return 'sel';
        if (mark.row != null && ri === mark.row) return 'hl';
        if (mark.col != null && j === mark.col && i > 0) return 'hl';
        if (mark.negRhs && j === T.names.length && ri >= 0 && T.rows[ri].rhs.lt(0)) return 'm';
        return '';
      })
    );
    return { type: 'matrix', corner: 'BV', rowLabels, colLabels, cells, cls, caption };
  }

  function plotViz(P, cuts, point, caption) {
    const xmax = Math.ceil(Math.max(...P.A.map((r, i) => P.b[i] / r[0]))) + 1;
    const ymax = Math.ceil(Math.max(...P.A.map((r, i) => P.b[i] / r[1]))) + 1;
    return {
      type: 'plot',
      caption,
      A: P.A.concat(cuts.map((ct) => ct.xAlpha)),
      b: P.b.concat(cuts.map((ct) => ct.xBeta)),
      origA: P.A,
      origB: P.b,
      c: P.c,
      point,
      xmax: Math.min(xmax, 12),
      ymax: Math.min(ymax, 12),
    };
  }

  // ------------------------------------------------------------------ html helpers
  const sv = (j, T) => varName(T.names[j]);
  // "a1 N1 + a2 N2" with given coefficient map (explicit zeros kept, like the notes' "+ 0 s2")
  function termList(js, coef, T, opt) {
    opt = opt || {};
    let s = '';
    js.forEach((j, i) => {
      const v = F(coef[j]);
      const neg = v.lt(0);
      const abs = v.abs();
      const cs = abs.eq(1) && !opt.showOne ? '' : fh(abs) + ' ';
      const term = cs + sv(j, T);
      if (i === 0 && !opt.lead) s += (neg ? '− ' : '') + term;
      else s += (neg ? ' − ' : ' + ') + term;
    });
    return s;
  }
  const rowEq = (T, row) => {
    const nb = nonbasic(T);
    return `${sv(row.bv, T)}${termList(nb, row.a, T, { lead: true })} = ${fh(row.rhs)}`;
  };
  // cut "f0 − Σ f_j N_j ≤ 0" (or variants for distractors)
  const cutHtml = (T, f0, coefs, sign, rel) => {
    let s = fh(f0);
    T._nb.forEach((j) => {
      const v = coefs[j];
      if (v.isZero()) return;
      const neg = sign === '-' ? !v.lt(0) : v.lt(0);
      const abs = v.abs();
      s += (neg ? ' − ' : ' + ') + (abs.eq(1) ? '' : fh(abs) + ' ') + sv(j, T);
    });
    return `${s} ${rel} 0`;
  };
  const xIneq = (alpha, beta) => {
    let s = OR.util.linExpr(alpha);
    return `${s} ≤ ${fh(beta)}`;
  };

  const OPTIONS = [
    {
      key: 'cuts',
      label: 'Gereken cut sayısı',
      type: 'select',
      default: '1',
      choices: [
        { value: '1', label: '1 cut' },
        { value: '2', label: '2 cut' },
        { value: 'any', label: '1 veya 2 (rastgele)' },
      ],
    },
    { key: 'askDual', label: 'Dual simplex adımlarını ben yapayım', type: 'checkbox', default: true },
    { key: 'askX', label: 'Cut\'ı x<sub>1</sub>, x<sub>2</sub> cinsinden de yaz (notlarda yok)', type: 'checkbox', default: false },
  ];

  OR.registerDrill({
    id: 'gomory-cut',
    topic: '2.9',
    title: 'Gomory Cut · Cutting Plane Algorithm',
    description: 'Rastgele 2 değişkenli pure IP\'nin optimal LR tablosundan başla: kaynak satırı seç, integer/fractional parçaları ayır, Gomory cut\'ı yaz, dual simplex ile yeniden optimize et; integer olana kadar tekrar et.',
    options: OPTIONS,
    lrTableau,
    gomory,
    bruteForce,
    addCut,
    dualStep,
    generate(rng, opts) {
      opts = Object.assign({ cuts: '1', askDual: true, askX: false }, opts || {});
      const inst = genInstance(rng, opts);
      if (!inst) throw new Error('uygun problem bulunamadı');
      const { P, run, bf } = inst;
      const steps = [];
      const x0 = solX(run.lr);
      const cutsSoFar = [];

      steps.push({
        kind: 'number',
        prompt: `<b>Adım 1–2.</b> Optimal LR tablosunu oku: z, x<sub>1</sub>, x<sub>2</sub> kaç? (Tüm değişkenler integer mı?)`,
        fields: [
          { label: 'z', answer: run.lr.z },
          { label: 'x<sub>1</sub>', answer: x0[0] },
          { label: 'x<sub>2</sub>', answer: x0[1] },
        ],
        hint: 'Basic variable = kendi satırının RHS\'i, nonbasic variable = 0. z\'nin değeri R0 satırının RHS\'i.',
        explain: `z = ${fh(run.lr.z)}, x<sub>1</sub> = ${fh(x0[0])}, x<sub>2</sub> = ${fh(x0[1])}. Kesirli değer var → Gomory cut gerekli (notlarda adım 2: "Otherwise proceed to next step").`,
        vizDuring: [tabViz(run.lr, 'Optimal LR tablosu'), plotViz(P, [], null, 'LR uygun bölgesi')],
        viz: [tabViz(run.lr, 'Optimal LR tablosu'), plotViz(P, [], x0, 'LR optimumu')],
      });

      run.rounds.forEach((rd, k) => {
        const T = rd.before;
        const ct = rd.cut;
        T._nb = ct.nb;
        const row = T.rows[ct.r];
        const tag = run.rounds.length > 1 ? ` (Cut ${k + 1})` : '';
        const nbNames = ct.nb.map((j) => sv(j, T)).join(', ');

        // 3. source row
        const opts3 = T.rows.map((rw, i) => ({
          html: `BV = ${sv(rw.bv, T)} satırı · RHS = ${fh(rw.rhs)}`,
          correct: i === ct.r,
        }));
        const fracList = T.rows
          .map((rw) => `${sv(rw.bv, T)}: RHS ${fh(rw.rhs)} → ${rw.rhs.isInt() ? 'integer (aday değil)' : `kesirli kısım ${fh(rw.rhs.frac())}, |${fh(rw.rhs.frac())} − 1/2| = ${fh(rw.rhs.frac().sub(half).abs())}`}`)
          .join('<br>');
        steps.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `<b>Adım 3${tag}.</b> Cut hangi kısıt satırından üretilmeli?`,
          options: opts3,
          hint: 'Notlar: "Pick a constraint in the optimal tableau whose RHS has the fractional part closest to ½."',
          explain: `${fracList}<br>½'ye en yakın kesirli kısım <b>${sv(row.bv, T)}</b> satırında: <b>${rowEq(T, row)}</b>.`,
          vizDuring: tabViz(T, k === 0 ? 'Optimal LR tablosu' : `Cut ${k} sonrası optimal tablo`),
          viz: tabViz(T, 'Kaynak satır (yeşil)', { row: ct.r }),
        });

        // 4a. floors
        const flFields = ct.nb.map((j) => ({ label: `⌊${fh(ct.rowA[j])}⌋ &nbsp;(${sv(j, T)} katsayısı)`, answer: ct.fl[j] }));
        flFields.push({ label: `⌊${fh(ct.rhs)}⌋ &nbsp;(RHS)`, answer: ct.fl0 });
        const lhs = `${sv(row.bv, T)}${ct.nb.map((j) => (ct.fl[j].lt(0) ? ' − ' : ' + ') + fh(ct.fl[j].abs()) + ' ' + sv(j, T)).join('')} ${ct.fl0.isZero() ? '' : (ct.fl0.gt(0) ? '− ' : '+ ') + fh(ct.fl0.abs())}`.trim();
        const rhsSide = `${fh(ct.f0)}${ct.nb.map((j) => ' − ' + fh(ct.f[j]) + ' ' + sv(j, T)).join('')}`;
        steps.push({
          kind: 'number',
          prompt: `<b>Adım 4${tag}.</b> Satır: <b>${rowEq(T, row)}</b>. Integer parçaları sola almak için katsayıları ve RHS'i <b>aşağı yuvarla</b> (round down, ⌊·⌋).`,
          fields: flFields,
          hint: '⌊a⌋ = a\'dan küçük-eşit en büyük integer. Negatiflerde dikkat: ⌊−5/4⌋ = −2 (−1 değil!).',
          explain: `Her katsayı a = ⌊a⌋ + f, 0 ≤ f &lt; 1 şeklinde yazılır: ${ct.nb.map((j) => `${fh(ct.rowA[j])} = ${fh(ct.fl[j])} + ${fh(ct.f[j])}`).join(' · ')} · ${fh(ct.rhs)} = ${fh(ct.fl0)} + ${fh(ct.f0)}.<br>Integer parçalar solda, kesirli parçalar sağda (notlardaki yazım):<br><b>${lhs} = ${rhsSide}</b>`,
        });

        // 4b. fractional parts
        const frFields = ct.nb.map((j) => ({ label: `f(${fh(ct.rowA[j])}) &nbsp;(${sv(j, T)})`, answer: ct.f[j] }));
        frFields.push({ label: `f(${fh(ct.rhs)}) &nbsp;(RHS)`, answer: ct.f0 });
        const negEx = ct.nb.find((j) => ct.rowA[j].lt(0) && !ct.rowA[j].isInt());
        steps.push({
          kind: 'number',
          prompt: `<b>Adım 4 (devam)${tag}.</b> Kesirli kısımlar f = a − ⌊a⌋ nedir? (Nonbasic değişkenler: ${nbNames})`,
          fields: frFields,
          hint: `f her zaman 0 ≤ f &lt; 1. ${negEx !== undefined ? `Örn. f(${fh(ct.rowA[negEx])}) = ${fh(ct.rowA[negEx])} − (${fh(ct.fl[negEx])}) = ${fh(ct.f[negEx])}.` : 'Örn. f(−5/4) = −5/4 − (−2) = 3/4.'}`,
          explain: ct.nb.map((j) => `f(${fh(ct.rowA[j])}) = ${fh(ct.rowA[j])} − (${fh(ct.fl[j])}) = <b>${fh(ct.f[j])}</b>`).join('<br>') + `<br>f(${fh(ct.rhs)}) = ${fh(ct.rhs)} − ${fh(ct.fl0)} = <b>${fh(ct.f0)}</b>`,
        });

        // 5. cut form
        const absFr = {};
        ct.nb.forEach((j) => { absFr[j] = ct.rowA[j].abs().frac(); });
        const cand = [
          { html: cutHtml(T, ct.f0, ct.f, '-', '≤'), correct: true },
          { html: cutHtml(T, ct.f0, ct.f, '-', '≥'), correct: false },
          { html: cutHtml(T, ct.f0, ct.f, '+', '≤'), correct: false },
          { html: cutHtml(T, ct.f0, absFr, '-', '≤'), correct: false },
        ];
        const seen = new Set();
        const opts5 = cand.filter((o) => (seen.has(o.html) ? false : (seen.add(o.html), true)));
        steps.push({
          kind: 'choice',
          prompt: `<b>Adım 5${tag}.</b> Gomory cut hangisidir?`,
          options: opts5,
          hint: 'Sol taraf integer ⇒ sağ taraf da integer olmalı. Sağ taraf = (pozitif bir kesir) − (negatif olmayan terimler) ⇒ pozitif olamaz.',
          explain: `Notlardaki adım 5: "RHS of the modified constraint ≤ 0" ⇒ <b>${cutHtml(T, ct.f0, ct.f, '-', '≤')}</b>. Mevcut çözümde ${nbNames} = 0 olduğundan sol taraf ${fh(ct.f0)} &gt; 0: mevcut LR optimumu bu kısıtı sağlamaz (cut), ama her integer feasible çözüm sağlar. Kesirli kısımlar a − ⌊a⌋ ile alınır; |a|'nın kesri değil (negatiflerde fark eder).`,
        });

        // optional: cut in x
        cutsSoFar.push(ct);
        if (opts.askX) {
          const subs = ct.nb.filter((j) => T.names[j][0] === 's').map((j) => `${sv(j, T)} = ${exprHtml(T.expr[j])}`).join(', ');
          steps.push({
            kind: 'number',
            prompt: `<b>(notlarda yok)</b> Cut'ı orijinal değişkenlerle a<sub>1</sub>x<sub>1</sub> + a<sub>2</sub>x<sub>2</sub> ≤ b biçiminde yaz: slack'leri x cinsinden yerine koy, sonra yalnızca <b>pozitif</b> bir sayıyla çarparak katsayıları ortak böleni 1 olan <b>integer</b>'lara getir.`,
            fields: [
              { label: 'a<sub>1</sub>', answer: ct.xAlpha[0] },
              { label: 'a<sub>2</sub>', answer: ct.xAlpha[1] },
              { label: 'b', answer: ct.xBeta },
            ],
            hint: `Yerine koy: ${subs}. Sonra paydaları temizle.`,
            explain: `${subs} yazılıp sadeleştirilince cut: <b>${xIneq(ct.xAlpha, ct.xBeta)}</b>. Grafikte bu doğru LR optimumunu keser ama hiçbir integer noktayı dışarıda bırakmaz.`,
            viz: [tabViz(rd.withCut, 'Cut eklenmiş tablo', { negRhs: true }), plotViz(P, cutsSoFar.slice(), solX(T), `Cut: ${xIneq(ct.xAlpha, ct.xBeta)}`)],
          });
        }

        // 6. new tableau + dual simplex
        const sNew = sv(ct.newIdx, rd.withCut);
        steps.push({
          kind: 'info',
          prompt: `<b>Adım 6${tag}.</b> Cut tabloya yeni slack ${sNew} ile eklenir: ${ct.nb.map((j) => `− ${fh(ct.f[j])} ${sv(j, T)}`).join(' ')} + ${sNew} = −${fh(ct.f0)}. RHS negatif ⇒ primal infeasible ama R0 hâlâ optimal ⇒ <b>dual simplex</b>.`,
          vizDuring: [tabViz(rd.withCut, 'Cut eklenmiş tablo', { negRhs: true }), plotViz(P, cutsSoFar.slice(), solX(T), 'Cut eklendi')],
        });
        let cur = rd.withCut;
        rd.iters.forEach((st, it) => {
          const inf = st.info;
          const itTag = rd.iters.length > 1 ? ` · iterasyon ${it + 1}` : '';
          const ratioTxt = inf.ratios.map((q) => `${sv(q.j, cur)}: |${fh(cur.R0[q.j])} / ${fh(cur.rows[inf.r].a[q.j])}| = ${fh(q.ratio)}`).join('<br>');
          const xn = solX(st.T);
          const negRows = cur.rows.filter((rw) => rw.rhs.lt(0));
          if (opts.askDual) {
            steps.push({
              kind: 'choice',
              prompt: `<b>Dual simplex${itTag}${tag}.</b> Hangi basic variable basis'ten çıkar?`,
              options: cur.rows.map((rw, i) => ({ html: sv(rw.bv, cur), correct: i === inf.r })),
              hint: 'Notlar: "We choose the most negative RHS. BV of this pivot row leaves the basis."',
              explain: `Negatif RHS'ler: ${negRows.map((rw) => `${sv(rw.bv, cur)} = ${fh(rw.rhs)}`).join(', ')}. En negatif RHS'li satırın BV'si <b>${sv(inf.leave, cur)}</b> çıkar.`,
              vizDuring: tabViz(cur, 'Dual simplex', { negRhs: true }),
              viz: tabViz(cur, 'Pivot satırı', { row: inf.r }),
            });
            steps.push({
              kind: 'number',
              prompt: `Pivot satırında negatif katsayılı değişkenler için oranları hesapla: |R0 katsayısı / pivot satırı katsayısı|.`,
              fields: inf.ratios.map((q) => ({ label: `${sv(q.j, cur)}`, answer: q.ratio })),
              hint: 'Yalnızca pivot satırında katsayısı NEGATİF olan değişkenler için.',
              explain: ratioTxt,
            });
            steps.push({
              kind: 'choice',
              prompt: `Hangi değişken basis'e girer?`,
              options: inf.ratios.map((q) => ({ html: `${sv(q.j, cur)} (oran ${fh(q.ratio)})`, correct: q.j === inf.enter })).concat(
                nonbasic(cur).filter((j) => !inf.ratios.some((q) => q.j === j)).map((j) => ({ html: `${sv(j, cur)} (pivot satırında katsayı ${fh(cur.rows[inf.r].a[j])})`, correct: false }))
              ),
              hint: '"Variable with the smallest ratio (absolute value) enters basis."',
              explain: `En küçük oran ⇒ <b>${sv(inf.enter, cur)}</b> girer, ${sv(inf.leave, cur)} çıkar (pivot elemanı ${fh(inf.pivotVal)}).`,
              viz: tabViz(cur, `Pivot: ${varName(cur.names[inf.enter])} girer, ${varName(cur.names[inf.leave])} çıkar`, { pivot: [inf.r, inf.enter] }),
            });
            steps.push({
              kind: 'number',
              prompt: `Pivot sonrası yeni çözüm nedir? (Pivot satırını pivot elemanına böl, diğer satırlardan ve R0'dan uygun katını çıkar.)`,
              fields: [
                { label: 'z', answer: st.T.z },
                { label: 'x<sub>1</sub>', answer: xn[0] },
                { label: 'x<sub>2</sub>', answer: xn[1] },
              ],
              hint: `Yeni ${sv(inf.enter, cur)} = (pivot satırı RHS) / (pivot elemanı) = ${fh(cur.rows[inf.r].rhs)} / ${fh(inf.pivotVal)}.`,
              explain: `${sv(inf.enter, cur)} = ${fh(cur.rows[inf.r].rhs)} / ${fh(inf.pivotVal)} = ${fh(cur.rows[inf.r].rhs.div(inf.pivotVal))}. Yeni tablo: z = ${fh(st.T.z)}, x<sub>1</sub> = ${fh(xn[0])}, x<sub>2</sub> = ${fh(xn[1])}${st.T.rows.some((rw) => rw.rhs.lt(0)) ? ' — hâlâ negatif RHS var, dual simplex devam eder.' : ' — tüm RHS ≥ 0 ⇒ yeni LR optimal.'}`,
              viz: [tabViz(st.T, 'Dual simplex sonrası tablo'), plotViz(P, cutsSoFar.slice(), xn, 'Yeni LR optimumu')],
            });
          } else {
            steps.push({
              kind: 'info',
              prompt: `<b>Dual simplex${itTag}${tag}.</b> En negatif RHS: ${sv(inf.leave, cur)} = ${fh(cur.rows[inf.r].rhs)} ⇒ ${sv(inf.leave, cur)} çıkar. Oranlar:<br>${ratioTxt}<br>En küçük oran ⇒ <b>${sv(inf.enter, cur)}</b> girer.`,
              vizDuring: tabViz(cur, `Pivot: ${varName(cur.names[inf.enter])} girer, ${varName(cur.names[inf.leave])} çıkar`, { pivot: [inf.r, inf.enter] }),
            });
            steps.push({
              kind: 'number',
              prompt: `Pivot sonrası tablodan yeni çözümü oku.`,
              fields: [
                { label: 'z', answer: st.T.z },
                { label: 'x<sub>1</sub>', answer: xn[0] },
                { label: 'x<sub>2</sub>', answer: xn[1] },
              ],
              hint: 'Basic variable = RHS, nonbasic = 0.',
              explain: `z = ${fh(st.T.z)}, x<sub>1</sub> = ${fh(xn[0])}, x<sub>2</sub> = ${fh(xn[1])}.`,
              vizDuring: [tabViz(st.T, 'Dual simplex sonrası tablo'), plotViz(P, cutsSoFar.slice(), xn, 'Yeni LR optimumu')],
            });
          }
          cur = st.T;
        });

        // 7/8. integer?
        const done = k === run.rounds.length - 1;
        const fracVars = rd.after.rows.filter((rw) => !rw.rhs.isInt()).map((rw) => `${sv(rw.bv, rd.after)} = ${fh(rw.rhs)}`);
        steps.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `<b>Adım 7–8${tag}.</b> Şimdi ne yapılır?`,
          options: [
            { html: 'Tüm değişkenler integer ⇒ IP optimal bulundu, dur.', correct: done },
            { html: 'Kesirli değişken var ⇒ bu tablodan yeni bir Gomory cut üret (adım 3\'ten devam).', correct: !done },
          ],
          explain: done
            ? `Tüm basic variable'lar integer (${rd.after.rows.map((rw) => `${sv(rw.bv, rd.after)} = ${fh(rw.rhs)}`).join(', ')}) ⇒ IP optimal: z = ${fh(rd.after.z)}, x<sub>1</sub> = ${fh(solX(rd.after)[0])}, x<sub>2</sub> = ${fh(solX(rd.after)[1])}.`
            : `Kesirli: ${fracVars.join(', ')} ⇒ notlardaki adım 8: "Otherwise, proceed from step 3." Yeni cut bu tablodan (eski cut satırları dahil) üretilir.`,
        });
      });

      const xf = solX(run.final);
      return {
        title: 'Gomory Cut · Cutting Plane Algorithm',
        statement: `<p>Aşağıdaki IP'yi <b>Gomory cut algoritması</b> ile çöz (Telfa örneği gibi):</p>
          <div class="model">max z = ${OR.util.linExpr(P.c)}
s.t.  ${OR.util.linExpr(P.A[0])} ≤ ${P.b[0]}
      ${OR.util.linExpr(P.A[1])} ≤ ${P.b[1]}
      x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer</div>
          <p>LR'nin optimal simplex tablosu sağda verilmiştir (s<sub>1</sub>, s<sub>2</sub>: slack; satır etiketi = basic variable).</p>
          <ul class="conv">
            <li>Kaynak satır: RHS'inin kesirli kısmı <b>½'ye en yakın</b> kısıt satırı (notlar, adım 3).</li>
            <li>Cut: integer parçalar sola (round down), kesirli parçalar sağa; "sağ taraf ≤ 0". Yeni slack s<sub>3</sub>, s<sub>4</sub>, … ile tabloya eklenir.</li>
            <li>Dual simplex: en negatif RHS'li satırın BV'si çıkar; pivot satırında negatif katsayılılar için |R0 / satır| oranı en küçük olan girer.</li>
          </ul>
          <p class="muted">Sayıları kesir (15/4) veya ondalık (3.75) olarak girebilirsin.</p>`,
        viz: [tabViz(run.lr, 'Optimal LR tablosu'), plotViz(P, [], null, 'LR uygun bölgesi')],
        steps,
        solution: `<b>IP optimal:</b> z* = ${fh(run.final.z)}, x<sub>1</sub> = ${fh(xf[0])}, x<sub>2</sub> = ${fh(xf[1])} · ${run.rounds.length} Gomory cut: ${run.rounds.map((rd) => xIneq(rd.cut.xAlpha, rd.cut.xBeta)).join(' ; ')} (x cinsinden). LR optimumu z = ${fh(run.lr.z)} idi. Tamsayı ızgarasında brute force ile doğrulandı (tek optimum, z = ${bf.z}).`,
      };
    },
  });

  function exprHtml(e) {
    // c + k·x  →  "b − a1x1 − a2x2"
    const lin = OR.util.linExpr(e.k);
    if (lin === '0') return fh(e.c);
    const c = e.c.isZero() ? '' : fh(e.c) + ' ';
    const l = lin.startsWith('−') ? (c ? '− ' + lin.slice(1) : lin) : c ? '+ ' + lin : lin;
    return `(${c}${l})`.replace('( ', '(');
  }
})();
