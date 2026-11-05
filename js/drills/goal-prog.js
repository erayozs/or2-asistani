/* Ch.3 · Goal Programming drills (notes pages 47–54; Examples 1–4: Priceler, Modified Priceler, Beaver Creek, Preemptive Priceler).
   - gp-formulate (3.0):   word problem → goal constraint form (x-expr + s⁻ − s⁺ = target), which deviational variables are
                           penalized, the objective (weighted or preemptive), deviations / objective value of a candidate point.
   - gp-graphical (3.2.1): 2-variable preemptive GP solved priority by priority in the x₁–x₂ plane (Beaver Creek style).
                           Lexicographic solve on exact vertex sets (pairwise line intersections, exact fractions).
   - gp-simplex (3.2.2):   goal programming simplex: one Row 0 per priority (z_k − P_k·s = 0), pricing out the starting basis
                           {s_i⁻, slacks}, entering rule of the notes (highest-priority unmet goal, most positive coefficient,
                           variables with a negative coefficient in a higher-priority Row 0 may not enter), ratio test, pivot.
   Instances are rejected unless every decision is unique (no ties in entering / ratio test, no degenerate pivots, unique
   final point) and all numbers are small fractions.
   Exposes OR.drills['gp-simplex'].gpSimplex, OR.drills['gp-graphical'].lexSolve (used by verification scripts). */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const U = OR.util;
  const ZERO = F(0);

  // ------------------------------------------------------------------ formatting helpers
  const fh = (v) => F(v).html().replace(/^-/, '−');
  const dv = (name, g, side) => `${name}<sub>${g + 1}</sub><sup>${side === '-' ? '−' : '+'}</sup>`;
  const Pk = (k) => `P<sub>${k + 1}</sub>`;
  // coefficient c times P_k  ->  "7P₁", "−P₂", "0"
  const pm = (c, k) => {
    c = F(c);
    if (c.isZero()) return '0';
    if (c.eq(1)) return Pk(k);
    if (c.eq(-1)) return '−' + Pk(k);
    if (!c.isInt()) return (c.lt(0) ? '−' : '') + `(${c.abs().html()})` + Pk(k);
    return fh(c) + Pk(k);
  };
  const lin = (a) => U.linExpr(a);
  const dot = (a, x) => F(a[0]).mul(x[0]).add(F(a[1]).mul(x[1]));
  const maxDen = (arr) => arr.reduce((m, v) => Math.max(m, Number(F(v).d)), 1);
  const goodFrac = (v, den, abs) => Number(F(v).d) <= den && F(v).abs().le(abs);
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const optsList = (arr) => arr.map((o) => ({ html: o.html, correct: !!o.correct }));
  // unique options (by html), the correct one kept
  const uniqOpts = (arr) => {
    const seen = new Set();
    return arr.filter((o) => (seen.has(o.html) ? false : (seen.add(o.html), true)));
  };

  /* ====================================================================== GP SIMPLEX
     inst = { goals:[{a:[a1,a2], t}], hard:[{a, b}], prio:[{g, side}] }  (priority k minimizes the deviation prio[k])
     Columns: x1, x2, s1⁻, s1⁺, s2⁻, s2⁺, …, slacks.  Row 0 (goal k):  z_k − P_k·(dev) = 0  → after pricing out the entry of
     column j is (Σ_i c_B,i T_ij − c_j) in units of P_k (z_j − c_j form, min problem → most positive enters). */
  function gpSimplex(inst) {
    const n = 2;
    const m = inst.goals.length;
    const h = (inst.hard || []).length;
    const N = n + 2 * m + h;
    const cols = [];
    for (let j = 0; j < n; j++) cols.push({ html: U.v(j), kind: 'x', j });
    for (let g = 0; g < m; g++) {
      cols.push({ html: dv('s', g, '-'), kind: 'dev', g, side: '-' });
      cols.push({ html: dv('s', g, '+'), kind: 'dev', g, side: '+' });
    }
    for (let k = 0; k < h; k++) cols.push({ html: `s<sub>${m + k + 1}</sub>`, kind: 'slack', k });
    const colOf = (g, side) => n + 2 * g + (side === '-' ? 0 : 1);

    const T = [];
    const rhs = [];
    const basis = [];
    inst.goals.forEach((G, g) => {
      const r = Array(N).fill(ZERO);
      r[0] = F(G.a[0]);
      r[1] = F(G.a[1]);
      r[colOf(g, '-')] = F(1);
      r[colOf(g, '+')] = F(-1);
      T.push(r);
      rhs.push(F(G.t));
      basis.push(colOf(g, '-'));
    });
    (inst.hard || []).forEach((H, k) => {
      const r = Array(N).fill(ZERO);
      r[0] = F(H.a[0]);
      r[1] = F(H.a[1]);
      r[n + 2 * m + k] = F(1);
      T.push(r);
      rhs.push(F(H.b));
      basis.push(n + 2 * m + k);
    });
    const K = inst.prio.length;
    const w = inst.prio.map((p) => {
      const r = Array(N).fill(ZERO);
      r[colOf(p.g, p.side)] = F(1);
      return r;
    });
    const raw = { row0: w.map((r) => r.map((c) => c.neg())), z: w.map(() => ZERO) };
    const row0 = [];
    const z = [];
    for (let k = 0; k < K; k++) {
      const r = Array(N).fill(ZERO).map((_, j) => T.reduce((s, row, i) => s.add(w[k][basis[i]].mul(row[j])), ZERO).sub(w[k][j]));
      row0.push(r);
      z.push(T.reduce((s, row, i) => s.add(w[k][basis[i]].mul(rhs[i])), ZERO));
    }
    // which Row 0's needed pricing out (penalized var basic at start)
    const priced = w.map((wk) => basis.some((b) => !wk[b].isZero()));

    const snap = () => ({ T: T.map((r) => r.slice()), rhs: rhs.slice(), basis: basis.slice(), row0: row0.map((r) => r.slice()), z: z.slice() });
    const init = snap();
    const iters = [];
    let flags = { tie: false, degenerate: false, unbounded: false };

    function chooseEntering() {
      const skipped = [];
      for (let k = 0; k < K; k++) {
        if (z[k].isZero()) continue;
        const pos = [];
        const ok = [];
        for (let j = 0; j < N; j++) {
          if (basis.includes(j)) continue;
          if (!row0[k][j].gt(0)) continue;
          pos.push(j);
          const blockedBy = [];
          for (let i = 0; i < k; i++) if (row0[i][j].lt(0)) blockedBy.push(i);
          if (!blockedBy.length) ok.push(j);
        }
        if (!ok.length) {
          skipped.push({ k, pos });
          continue;
        }
        let best = ok[0];
        ok.forEach((j) => {
          if (row0[k][j].gt(row0[k][best])) best = j;
        });
        const tie = ok.filter((j) => row0[k][j].eq(row0[k][best])).length > 1;
        return { k, j: best, pos, ok, skipped, tie };
      }
      return { k: null, skipped };
    }

    for (let it = 0; it < 8; it++) {
      const before = snap();
      const e = chooseEntering();
      if (e.k == null) {
        return { inst, cols, N, n, m, h, K, raw, init, priced, iters, final: before, finalEnter: e, flags, colOf };
      }
      if (e.tie) flags.tie = true;
      const j = e.j;
      const ratios = [];
      T.forEach((row, i) => {
        if (row[j].gt(0)) ratios.push({ i, r: rhs[i].div(row[j]) });
      });
      if (!ratios.length) {
        flags.unbounded = true;
        return { inst, cols, N, n, m, h, K, raw, init, priced, iters, final: before, finalEnter: e, flags, colOf };
      }
      let lr = ratios[0];
      ratios.forEach((q) => {
        if (q.r.lt(lr.r)) lr = q;
      });
      if (ratios.filter((q) => q.r.eq(lr.r)).length > 1) flags.tie = true;
      if (lr.r.isZero()) flags.degenerate = true;
      const pr = lr.i;
      const pv = T[pr][j];
      T[pr] = T[pr].map((c) => c.div(pv));
      rhs[pr] = rhs[pr].div(pv);
      for (let i = 0; i < T.length; i++) {
        if (i === pr || T[i][j].isZero()) continue;
        const f = T[i][j];
        T[i] = T[i].map((c, jj) => c.sub(f.mul(T[pr][jj])));
        rhs[i] = rhs[i].sub(f.mul(rhs[pr]));
      }
      for (let k = 0; k < K; k++) {
        const f = row0[k][j];
        if (f.isZero()) continue;
        row0[k] = row0[k].map((c, jj) => c.sub(f.mul(T[pr][jj])));
        z[k] = z[k].sub(f.mul(rhs[pr]));
      }
      const leaving = basis[pr];
      basis[pr] = j;
      iters.push({ before, enter: e, ratios, pr, pivot: pv, leaving, after: snap() });
    }
    flags.cycle = true;
    return { inst, cols, N, n, m, h, K, raw, init, priced, iters, final: snap(), finalEnter: { k: null, skipped: [] }, flags, colOf };
  }

  // value of every column in a tableau snapshot
  function values(S, N) {
    const v = Array(N).fill(ZERO);
    S.basis.forEach((b, i) => (v[b] = S.rhs[i]));
    return v;
  }

  // tableau -> matrix viz. hl: {row, col} pivot element; colHl: entering column
  function tableauViz(R, S, o) {
    o = o || {};
    const rowLabels = [];
    const cells = [];
    const cls = [];
    for (let k = 0; k < R.K; k++) {
      rowLabels.push(`Row 0 (goal ${k + 1})`);
      const met = S.z[k].isZero();
      cells.push(S.row0[k].map((c) => pm(c, k)).concat([`${pm(S.z[k], k)}`]));
      cls.push(
        S.row0[k]
          .map((c, j) => {
            if (o.col === j && o.rowK === k) return 'sel';
            if (o.col === j) return 'hl';
            return '';
          })
          .concat([met ? 'hl' : 'm'])
      );
    }
    S.T.forEach((row, i) => {
      rowLabels.push(`Row ${i + 1} · BV ${R.cols[S.basis[i]].html}`);
      cells.push(row.map((c) => fh(c)).concat([fh(S.rhs[i])]));
      cls.push(
        row
          .map((c, j) => {
            if (o.row === i && o.col === j) return 'sel';
            if (o.col === j || o.row === i) return 'hl';
            return '';
          })
          .concat([o.row === i ? 'hl' : ''])
      );
    });
    return {
      type: 'matrix',
      caption: o.caption || '',
      corner: '',
      rowLabels,
      colLabels: R.cols.map((c) => c.html).concat(['RHS']),
      cells,
      cls,
    };
  }

  function modelHtml(inst, name) {
    name = name || 's';
    const obj = inst.prio.map((p, k) => `${Pk(k)}${dv(name, p.g, p.side)}`).join(' + ');
    const rows = inst.goals.map((G, g) => `${lin(G.a)} + ${dv(name, g, '-')} − ${dv(name, g, '+')} = ${G.t}   (goal ${g + 1})`);
    (inst.hard || []).forEach((H) => rows.push(`${lin(H.a)} ≤ ${H.b}   (hard constraint)`));
    return `<div class="model">min z = ${obj}\ns.t. ${rows.join('\n     ')}\n     tüm değişkenler ≥ 0</div>`;
  }

  // Lexicographic LP solved sequentially with OR.lp (vertex enumeration): min priority 1, fix it, min priority 2, …
  function lexLP(inst) {
    const m = inst.goals.length;
    const N = 2 + 2 * m;
    const A = [];
    const b = [];
    const sense = [];
    inst.goals.forEach((G, i) => {
      const r = Array(N).fill(0);
      r[0] = G.a[0];
      r[1] = G.a[1];
      r[2 + 2 * i] = 1;
      r[3 + 2 * i] = -1;
      A.push(r);
      b.push(G.t);
      sense.push('=');
    });
    (inst.hard || []).forEach((H) => {
      const r = Array(N).fill(0);
      r[0] = H.a[0];
      r[1] = H.a[1];
      A.push(r);
      b.push(H.b);
      sense.push('<=');
    });
    const opt = [];
    let res = null;
    for (const p of inst.prio) {
      const c = Array(N).fill(0);
      c[2 + 2 * p.g + (p.side === '-' ? 0 : 1)] = -1;
      res = OR.lp.solve({ c, A, b, sense });
      if (res.status !== 'optimal') return null;
      const v = res.z.neg();
      opt.push(v);
      A.push(c.map((x) => -x));
      b.push(v);
      sense.push('=');
    }
    const xs = new Set(res.optima.map((o) => o[0].key() + ',' + o[1].key()));
    return { opt, x: res.x, unique: xs.size === 1 };
  }

  // ------------------------------------------------------------------ gp-simplex instance generation
  function genSimplex(rng) {
    for (let tries = 0; tries < 4000; tries++) {
      const m = 3;
      const hasHard = rng.chance(0.75);
      const goals = [];
      const prio = [];
      for (let g = 0; g < m; g++) {
        const a = [rng.int(1, 9), rng.int(1, 9)];
        const t = rng.int(2, 12) * rng.pick([1, 2, 5]);
        const side = g === 0 ? '-' : rng.chance(0.8) ? '-' : '+';
        goals.push({ a, t });
        prio.push({ g, side });
      }
      const hard = hasHard ? [{ a: [rng.int(1, 9), rng.int(1, 9)], b: rng.int(3, 15) * rng.pick([2, 5]) }] : [];
      const inst = { goals, hard, prio };
      const R = gpSimplex(inst);
      if (R.flags.tie || R.flags.degenerate || R.flags.unbounded || R.flags.cycle) continue;
      if (R.iters.length < 2 || R.iters.length > 3) continue;
      // numbers small
      const all = [];
      [R.init].concat(R.iters.map((x) => x.after)).forEach((S) => {
        S.T.forEach((r) => r.forEach((c) => all.push(c)));
        S.rhs.forEach((c) => all.push(c));
        S.row0.forEach((r) => r.forEach((c) => all.push(c)));
        S.z.forEach((c) => all.push(c));
      });
      if (maxDen(all) > 20) continue;
      if (all.some((c) => c.abs().gt(200))) continue;
      const fin = R.final;
      const val = values(fin, R.N);
      if (!goodFrac(val[0], 12, 100) || !goodFrac(val[1], 12, 100)) continue;
      // final status classification
      const unmet = [];
      for (let k = 0; k < R.K; k++) if (!fin.z[k].isZero()) unmet.push(k);
      const cls = unmet.map((k) => {
        const pos = [];
        for (let j = 0; j < R.N; j++) if (!fin.basis.includes(j) && fin.row0[k][j].gt(0)) pos.push(j);
        return { k, pos, kind: pos.length ? 'blocked' : 'noPos' };
      });
      const kinds = new Set(cls.map((c) => c.kind));
      if (kinds.size > 1) continue;
      const status = unmet.length ? cls[0].kind : 'allmet';
      // all goals met -> the optimal x is (almost always) not unique; skip. Prefer the notes' "blocked" situation.
      if (status === 'allmet') continue;
      if (status !== 'blocked' && rng.chance(0.5)) continue;
      // independent check: sequential (lexicographic) LP over all variables, unique optimal x equal to the tableau's
      const lx = lexLP(inst);
      if (!lx || !lx.unique || !lx.x[0].eq(val[0]) || !lx.x[1].eq(val[1]) || lx.opt.some((o, k) => !o.eq(fin.z[k]))) continue;
      // every entering-row choice must be on an unmet goal with ≥ 1 candidate (by construction) — also require that the
      // decision-variable values are not all zero at the end
      if (val[0].isZero() && val[1].isZero()) continue;
      R.status = status;
      R.unmetCls = cls;
      return R;
    }
    throw new Error('uygun GP simplex örneği bulunamadı');
  }

  function simplexExercise(rng) {
    const R = genSimplex(rng);
    const inst = R.inst;
    const steps = [];
    const nb = (S) => {
      const out = [];
      for (let j = 0; j < R.N; j++) if (!S.basis.includes(j)) out.push(j);
      return out;
    };
    const rawViz = {
      type: 'matrix',
      caption: 'Başlangıç tablosu — Row 0\'lar henüz düzeltilmedi (z<sub>k</sub> − P<sub>k</sub>·sapma = 0)',
      rowLabels: R.raw.row0.map((_, k) => `Row 0 (goal ${k + 1})`).concat(R.init.T.map((_, i) => `Row ${i + 1} · BV ${R.cols[R.init.basis[i]].html}`)),
      colLabels: R.cols.map((c) => c.html).concat(['RHS']),
      cells: R.raw.row0
        .map((r, k) => r.map((c) => pm(c, k)).concat(['0']))
        .concat(R.init.T.map((r, i) => r.map(fh).concat([fh(R.init.rhs[i])]))),
    };
    const hardTxt = R.h ? ` ve hard constraint'in slack'i s<sub>${R.m + 1}</sub>` : '';
    const bvSet = R.init.basis.map((b) => R.cols[b].html).join(', ');

    // ---- step 1: starting basis
    const devMinus = inst.goals.map((_, g) => dv('s', g, '-'));
    const devPlus = inst.goals.map((_, g) => dv('s', g, '+'));
    const slackH = R.h ? [`s<sub>${R.m + 1}</sub>`] : [];
    steps.push({
      kind: 'choice',
      prompt: `Başlangıç bfs için hangi <b>BV</b> kümesi kullanılır? (x<sub>1</sub> = x<sub>2</sub> = 0 noktasından başlıyoruz.)`,
      options: uniqOpts([
        { html: `{${devMinus.concat(slackH).join(', ')}}`, correct: true },
        { html: `{${devPlus.concat(slackH).join(', ')}}` },
        { html: `{x<sub>1</sub>, x<sub>2</sub>${R.h ? ', ' + slackH[0] : ''}}` },
        { html: `{${devMinus.concat(devPlus).join(', ')}}` },
      ]),
      hint: 'x = 0 iken her goal constraint\'te hangi değişken RHS\'e eşit, nonnegatif bir değer alabilir? (+1 katsayılı olan.)',
      explain: `x<sub>1</sub> = x<sub>2</sub> = 0 iken her goal constraint a·x + s<sub>i</sub><sup>−</sup> − s<sub>i</sub><sup>+</sup> = t<sub>i</sub> için s<sub>i</sub><sup>−</sup> = t<sub>i</sub> ≥ 0 (katsayısı +1) seçilir${hardTxt ? '; hard constraint\'te slack' : ''}. Notlardaki gibi BV = {${bvSet}} (Preemptive Priceler: BV = {s<sub>1</sub><sup>−</sup>, s<sub>2</sub><sup>−</sup>, s<sub>3</sub><sup>−</sup>, s<sub>4</sub>}). s<sub>i</sub><sup>+</sup> −1 katsayılı olduğu için başlangıç BV olamaz.`,
      viz: rawViz,
    });

    // ---- step 2: pricing out
    const pricedK = [];
    for (let k = 0; k < R.K; k++) if (R.priced[k]) pricedK.push(k);
    const k0 = 0;
    const g0 = inst.prio[0].g;
    const priceExplain = inst.prio
      .map((p, k) => {
        if (R.priced[k]) {
          return `<li>Row 0 (goal ${k + 1}): ${dv('s', p.g, p.side)} başlangıçta <b>basic</b> → "${Pk(k)} × Row ${p.g + 1}" eklenir: z<sub>${k + 1}</sub> + ${pm(inst.goals[p.g].a[0], k)}x<sub>1</sub> + ${pm(inst.goals[p.g].a[1], k)}x<sub>2</sub> − ${Pk(k)}${dv('s', p.g, '+')} = ${pm(inst.goals[p.g].t, k)} → z<sub>${k + 1}</sub> = ${pm(R.init.z[k], k)} (goal karşılanmıyor).</li>`;
        }
        return `<li>Row 0 (goal ${k + 1}): cezalandırılan ${dv('s', p.g, p.side)} <b>nonbasic</b> → düzeltme gerekmez, z<sub>${k + 1}</sub> = 0 (x = 0'da ${lin(inst.goals[p.g].a)} = 0 ≤ ${inst.goals[p.g].t}, goal zaten karşılanıyor).</li>`;
      })
      .join('');
    steps.push({
      kind: 'number',
      prompt: `Basic değişkenler Row 0'larda görünmemeli. Notlardaki gibi "${Pk(0)} × Row ${g0 + 1}"i Row 0 (goal 1)'e ekle (diğer satırlar için de benzer). Düzeltilmiş tabloda <b>Row 0 (goal 1)</b>'deki x<sub>1</sub>, x<sub>2</sub> katsayılarını ve her goal'ün başlangıç <b>z<sub>k</sub></b> değerini yaz. (Hepsi ${Pk(0)}, ${Pk(1)}, … cinsinden; sadece katsayıyı gir, ör. 7P<sub>1</sub> için 7.)`,
      fields: [
        { label: `x<sub>1</sub> katsayısı (Row 0 goal 1, ${Pk(0)} cinsinden)`, answer: R.init.row0[0][0] },
        { label: `x<sub>2</sub> katsayısı (Row 0 goal 1, ${Pk(0)} cinsinden)`, answer: R.init.row0[0][1] },
      ].concat(R.init.z.map((zk, k) => ({ label: `z<sub>${k + 1}</sub> (${Pk(k)} cinsinden)`, answer: zk }))),
      hint: `z<sub>1</sub> − ${Pk(0)}${dv('s', g0, '-')} = 0 satırına ${Pk(0)} × (${lin(inst.goals[g0].a)} + ${dv('s', g0, '-')} − ${dv('s', g0, '+')} = ${inst.goals[g0].t}) ekle.`,
      explain: `<ul>${priceExplain}</ul>`,
      viz: tableauViz(R, R.init, { caption: 'Düzeltilmiş başlangıç tablosu (Row 0\'larda basic değişken yok). Kırmızı RHS = karşılanmayan goal.' }),
    });

    // ---- iterations
    R.iters.forEach((itr, t) => {
      const S = itr.before;
      const e = itr.enter;
      const k = e.k;
      const zTxt = S.z.map((zk, i) => `z<sub>${i + 1}</sub> = ${pm(zk, i)}`).join(', ');
      const skipTxt = e.skipped.length
        ? ' ' +
          e.skipped
            .map(
              (sk) =>
                `Goal ${sk.k + 1} karşılanmıyor ama Row 0 (goal ${sk.k + 1})'deki pozitif katsayılı değişkenler (${sk.pos.map((j) => R.cols[j].html).join(', ') || 'yok'}) ${sk.pos.length ? 'daha yüksek öncelikli bir Row 0\'da negatif katsayıya sahip → giremez' : ''}; bu yüzden bir sonraki goal\'e geçilir.`
            )
            .join(' ')
        : '';
      const firstUnmet = S.z.findIndex((zk) => !zk.isZero());
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `<b>${t + 1}. iterasyon.</b> Mevcut değerler: ${zTxt}. Entering variable hangi <b>Row 0</b>'a bakılarak seçilir?`,
        options: S.z.map((_, i) => ({ html: `Row 0 (goal ${i + 1})`, correct: i === k })),
        hint: 'Karşılanmayan (z > 0) en yüksek öncelikli goal\'ün satırına bak; o satırda girebilecek değişken yoksa bir sonrakine geç.',
        explain: `Karşılanan goal'ler (z = 0) atlanır. En yüksek öncelikli karşılanmayan goal: goal ${firstUnmet + 1}.${skipTxt} → <b>Row 0 (goal ${k + 1})</b>.`,
        vizDuring: tableauViz(R, S, { caption: `${t + 1}. iterasyon başı` }),
      });

      const nbs = nb(S);
      const coefTxt = nbs.map((j) => `${R.cols[j].html}: ${pm(S.row0[k][j], k)}`).join(', ');
      const blocked = e.pos.filter((j) => !e.ok.includes(j));
      const blockTxt = blocked.length
        ? ` Ancak ${blocked
            .map((j) => {
              const hi = [];
              for (let i = 0; i < k; i++) if (S.row0[i][j].lt(0)) hi.push(`Row 0 (goal ${i + 1})'de ${pm(S.row0[i][j], i)}`);
              return `${R.cols[j].html} (${hi.join(', ')})`;
            })
            .join(', ')} daha yüksek öncelikli bir goal satırında <b>negatif</b> katsayıya sahip → girerse o goal'ün sapması artar, <b>giremez</b>.`
        : '';
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `Row 0 (goal ${k + 1})'e göre <b>entering variable</b> hangisi?`,
        options: nbs.map((j) => ({ html: R.cols[j].html, correct: j === e.j })),
        hint: `PGP bir min problemidir: Row 0 (goal ${k + 1})'deki <b>en pozitif</b> katsayılı nonbasic değişken — ama daha yüksek öncelikli bir Row 0'da negatif katsayısı olan değişken giremez.`,
        explain: `Row 0 (goal ${k + 1}) katsayıları (nonbasic): ${coefTxt}.${blockTxt} Girebilenler arasında en pozitif: <b>${R.cols[e.j].html}</b> (${pm(S.row0[k][e.j], k)}).`,
        vizDuring: tableauViz(R, S, { caption: `Row 0 (goal ${k + 1})'e bak` }),
      });

      const ratioTxt = S.T.map((row, i) => {
        const q = itr.ratios.find((x) => x.i === i);
        return q ? `Row ${i + 1} (${R.cols[S.basis[i]].html}): ${fh(S.rhs[i])} / ${fh(row[e.j])} = <b>${fh(q.r)}</b>` : `Row ${i + 1} (${R.cols[S.basis[i]].html}): katsayı ${fh(row[e.j])} ≤ 0 → oran yok`;
      }).join('<br>');
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `${R.cols[e.j].html} giriyor. Ratio test ile <b>leaving variable</b> hangisi?`,
        options: S.basis.map((b) => ({ html: R.cols[b].html, correct: b === itr.leaving })),
        hint: `${R.cols[e.j].html} sütununda pozitif katsayılı satırlar için RHS / katsayı oranlarının en küçüğü.`,
        explain: `${ratioTxt}<br>En küçük oran Row ${itr.pr + 1} → <b>${R.cols[itr.leaving].html}</b> çıkar; pivot elemanı ${fh(itr.pivot)}.`,
        vizDuring: tableauViz(R, S, { col: e.j, rowK: k, caption: `Entering sütunu: ${R.cols[e.j].html}` }),
      });

      const A = itr.after;
      const vA = values(A, R.N);
      const zA = A.z.map((zk, i) => `z<sub>${i + 1}</sub> = ${pm(zk, i)}`).join(', ');
      steps.push({
        kind: 'number',
        prompt: `Pivot yap: pivot satırı (Row ${itr.pr + 1}) pivot elemanına (${fh(itr.pivot)}) bölünür, diğer tüm satırlarda — <b>tüm Row 0'lar dahil</b> — ${R.cols[e.j].html} sütunu sıfırlanır. Pivottan sonra ${R.cols[e.j].html} değişkeninin değeri ve her goal'ün <b>z<sub>k</sub></b> değeri ne olur? (z<sub>k</sub> değerlerini P<sub>k</sub> cinsinden gir.)`,
        fields: [{ label: R.cols[e.j].html, answer: vA[e.j] }].concat(A.z.map((zk, i) => ({ label: `z<sub>${i + 1}</sub> (${Pk(i)} cinsinden)`, answer: zk }))),
        hint: `Yeni RHS (Row ${itr.pr + 1}) = ${fh(S.rhs[itr.pr])} / ${fh(itr.pivot)}. Her Row 0 için: yeni z<sub>k</sub> = eski z<sub>k</sub> − (Row 0'daki ${R.cols[e.j].html} katsayısı) × (yeni Row ${itr.pr + 1} RHS).`,
        explain: `${R.cols[e.j].html} = ${fh(S.rhs[itr.pr])} / ${fh(itr.pivot)} = <b>${fh(vA[e.j])}</b>. ${S.z
          .map((zk, i) => `z<sub>${i + 1}</sub> = ${pm(zk, i)} − (${pm(S.row0[i][e.j], i)})·${fh(vA[e.j])} = <b>${pm(A.z[i], i)}</b>`)
          .join('; ')}. Yeni BV: {${A.basis.map((b) => R.cols[b].html).join(', ')}}. ${zA}.`,
        viz: tableauViz(R, A, { row: itr.pr, col: e.j, caption: `${t + 1}. pivottan sonraki tablo (pivot satırı/sütunu yeşil)` }),
      });
    });

    // ---- optimality
    const fin = R.final;
    const vF = values(fin, R.N);
    const unmet = R.unmetCls;
    let why;
    if (R.status === 'allmet') why = 'Tüm goal\'ler karşılandı (tüm z<sub>k</sub> = 0)';
    else if (R.status === 'blocked') why = 'Karşılanmayan goal\'ün Row 0\'ında pozitif katsayılı değişken var, ama hepsi daha yüksek öncelikli bir Row 0\'da negatif katsayıya sahip (girerse yüksek öncelikli goal bozulur)';
    else why = 'Karşılanmayan goal\'ün Row 0\'ında pozitif katsayılı hiçbir nonbasic değişken yok (z<sub>k</sub> daha fazla azaltılamaz)';
    const whyOpts = [
      { html: 'Tüm goal\'ler karşılandı (tüm z<sub>k</sub> = 0)', correct: R.status === 'allmet' },
      { html: 'Karşılanmayan goal\'ün Row 0\'ında pozitif katsayılı değişken var, ama hepsi daha yüksek öncelikli bir Row 0\'da negatif katsayıya sahip (girerse yüksek öncelikli goal bozulur)', correct: R.status === 'blocked' },
      { html: 'Karşılanmayan goal\'ün Row 0\'ında pozitif katsayılı hiçbir nonbasic değişken yok (z<sub>k</sub> daha fazla azaltılamaz)', correct: R.status === 'noPos' },
      { html: 'Tablo optimal değil: karşılanmayan goal\'ün satırındaki en pozitif katsayılı değişken girmeli', correct: false },
    ];
    const unmetTxt = unmet.length
      ? unmet
          .map((c) => {
            const pos = c.pos.map((j) => {
              const hi = [];
              for (let i = 0; i < c.k; i++) if (fin.row0[i][j].lt(0)) hi.push(`goal ${i + 1}: ${pm(fin.row0[i][j], i)}`);
              return `${R.cols[j].html} (${pm(fin.row0[c.k][j], c.k)}; ${hi.join(', ')})`;
            });
            return `Goal ${c.k + 1}: z<sub>${c.k + 1}</sub> = ${pm(fin.z[c.k], c.k)} > 0. ${pos.length ? `Pozitif katsayılılar ${pos.join(', ')} → daha yüksek öncelikli goal satırında negatif, giremez.` : 'Row 0\'da pozitif katsayı yok.'}`;
          })
          .join(' ')
      : 'Tüm z<sub>k</sub> = 0.';
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Yeni tabloda entering variable kuralını tekrar uygula. Tablo neden <b>optimal</b>?`,
      options: whyOpts,
      hint: 'Notlar: "A tableau will yield the optimal solution if all goals are satisfied, or if each variable that can enter the basis and reduce the value of z_i\' for an unsatisfied goal i\' will increase the deviation from some goal i having a higher priority."',
      explain: `${unmetTxt} → <b>optimal</b>: ${why}.`,
      vizDuring: tableauViz(R, fin, { caption: 'Son tablo' }),
    });

    // ---- final values
    const pen = inst.prio.map((p) => R.colOf(p.g, p.side));
    steps.push({
      kind: 'number',
      prompt: `Optimal çözümü oku: x<sub>1</sub>, x<sub>2</sub> ve amaç fonksiyonundaki deviational variable'ların değerleri.`,
      fields: [
        { label: 'x<sub>1</sub>', answer: vF[0] },
        { label: 'x<sub>2</sub>', answer: vF[1] },
      ].concat(pen.map((j) => ({ label: R.cols[j].html, answer: vF[j] }))),
      hint: 'Basic değişkenin değeri kendi satırının RHS\'idir; nonbasic değişkenler 0.',
      explain: `BV = {${fin.basis.map((b, i) => `${R.cols[b].html} = ${fh(fin.rhs[i])}`).join(', ')}}; diğerleri 0. → x<sub>1</sub> = <b>${fh(vF[0])}</b>, x<sub>2</sub> = <b>${fh(vF[1])}</b>, ${pen.map((j) => `${R.cols[j].html} = <b>${fh(vF[j])}</b>`).join(', ')}.`,
      viz: tableauViz(R, fin, { caption: 'Optimal tablo' }),
    });

    const goalsTxt = inst.prio
      .map((p, k) => {
        const G = inst.goals[p.g];
        const v = dot(G.a, [vF[0], vF[1]]);
        const met = fin.z[k].isZero();
        return `goal ${k + 1} (${lin(G.a)} ${p.side === '-' ? '≥' : '≤'} ${G.t}): ${fh(v)} → ${met ? 'karşılandı' : `<b>karşılanmadı</b>, sapma ${fh(fin.z[k])}`}`;
      })
      .join('; ');
    const statement = `<p>Aşağıdaki <b>preemptive goal programming</b> modelini notlardaki <b>goal programming simplex</b> ile çöz (${Pk(0)} ⋙ ${Pk(1)} ⋙ ${Pk(2)}).</p>
      ${modelHtml(inst, 's')}
      <p><b>Kurallar (notlar 3.2.2):</b></p>
      <ul class="conv">
        <li>Amaç n parçaya ayrılır: min z<sub>k</sub> = P<sub>k</sub>·(sapma); her goal için ayrı bir <b>Row 0</b>: z<sub>k</sub> − P<sub>k</sub>·(sapma) = 0. Başlangıç BV = {s<sub>i</sub><sup>−</sup>${R.h ? `, s<sub>${R.m + 1}</sub>` : ''}}; basic değişkenler Row 0'lardan yok edilir.</li>
        <li>Entering: karşılanmayan en yüksek öncelikli goal i' → Row 0 (goal i')'de <b>en pozitif</b> katsayılı değişken; ama daha yüksek öncelikli bir Row 0'da <b>negatif</b> katsayısı olan değişken giremez. Hiçbiri giremiyorsa Row 0 (goal i'+1)'e geç.</li>
        <li>Leaving: ratio test. Pivotta <b>tüm</b> Row 0'lar güncellenir. Tablo değerleri kesirlidir (ör. 20/7).</li>
      </ul>`;
    return {
      title: 'Goal Programming Simplex (Preemptive)',
      statement,
      viz: rawViz,
      steps,
      solution: `<b>Optimal:</b> x<sub>1</sub> = ${fh(vF[0])}, x<sub>2</sub> = ${fh(vF[1])} (${R.iters.length} pivot). ${goalsTxt}.`,
    };
  }

  OR.registerDrill({
    id: 'gp-simplex',
    topic: '3.2.2',
    title: 'Goal Programming Simplex',
    description:
      'Küçük bir preemptive GP modelini notlardaki <b>goal programming simplex</b> ile çöz: her öncelik için ayrı Row 0, başlangıç BV {s<sub>i</sub><sup>−</sup>, slack} ve Row 0\'ların düzeltilmesi, entering variable kuralı (yüksek öncelikli satırda negatif katsayı → giremez), ratio test, pivot; optimalite gerekçesi ve sonuç. 2–3 pivot, tam kesirler.',
    gpSimplex,
    values,
    genSimplex,
    lexLP,
    generate: (rng) => simplexExercise(rng),
  });

  /* ====================================================================== GRAPHICAL PGP (x-space, exact)
     cons: [{a:[F,F], op:'>='|'<=', t:F}] plus x ≥ 0 and a large box. Region vertices = feasible pairwise intersections. */
  const BOX = F(1000);
  function vertices(cons) {
    const lines = cons.map((c) => ({ a: c.a.map(F), t: F(c.t) }));
    lines.push({ a: [F(1), F(0)], t: F(0) }, { a: [F(0), F(1)], t: F(0) }, { a: [F(1), F(0)], t: BOX }, { a: [F(0), F(1)], t: BOX });
    const feas = (p) =>
      p[0].ge(0) &&
      p[1].ge(0) &&
      p[0].le(BOX) &&
      p[1].le(BOX) &&
      cons.every((c) => {
        const v = dot(c.a, p);
        return c.op === '>=' ? v.ge(c.t) : c.op === '<=' ? v.le(c.t) : v.eq(c.t);
      });
    const out = [];
    const seen = new Set();
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length; j++) {
        const A = lines[i];
        const B = lines[j];
        const det = A.a[0].mul(B.a[1]).sub(A.a[1].mul(B.a[0]));
        if (det.isZero()) continue;
        const x = A.t.mul(B.a[1]).sub(A.a[1].mul(B.t)).div(det);
        const y = A.a[0].mul(B.t).sub(A.t.mul(B.a[0])).div(det);
        const p = [x, y];
        if (!feas(p)) continue;
        const key = x.key() + ',' + y.key();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
      }
    return out;
  }

  // goals: [{a, t}], prio: [{g, side}]  -> lexicographic solve, priority by priority
  function lexSolve(goals, prio, hard) {
    const cons = (hard || []).map((H) => ({ a: H.a.map(F), op: '<=', t: F(H.b) }));
    const steps = [];
    let degenerate = false;
    for (const p of prio) {
      const G = goals[p.g];
      const a = G.a.map(F);
      const t = F(G.t);
      const before = vertices(cons);
      const vals = before.map((q) => dot(a, q));
      let best = vals[0];
      vals.forEach((v) => {
        if (p.side === '-' ? v.gt(best) : v.lt(best)) best = v;
      });
      const met = p.side === '-' ? best.ge(t) : best.le(t);
      if (met && best.eq(t)) degenerate = true;
      const dev = met ? ZERO : p.side === '-' ? t.sub(best) : best.sub(t);
      const bound = met ? t : best;
      cons.push({ a, op: p.side === '-' ? '>=' : '<=', t: bound });
      const after = vertices(cons);
      steps.push({ p, met, dev, best, bound, before, after, cons: cons.slice() });
    }
    const fin = vertices(cons);
    const unique = fin.length === 1 && fin[0][0].lt(BOX) && fin[0][1].lt(BOX);
    return { steps, final: fin, unique, degenerate, point: unique ? fin[0] : null };
  }

  // ------------------------------------------------------------------ SVG drawing
  const COLORS = ['var(--acc)', 'var(--warn)', 'var(--good)', 'var(--bad)'];
  function clipPoly(poly, xmax, ymax) {
    // Sutherland–Hodgman against [0,xmax]×[0,ymax] (floats)
    const edges = [
      (p) => p[0] >= -1e-9,
      (p) => p[0] <= xmax + 1e-9,
      (p) => p[1] >= -1e-9,
      (p) => p[1] <= ymax + 1e-9,
    ];
    const inter = [
      (P, Q) => [0, P[1] + ((0 - P[0]) * (Q[1] - P[1])) / (Q[0] - P[0])],
      (P, Q) => [xmax, P[1] + ((xmax - P[0]) * (Q[1] - P[1])) / (Q[0] - P[0])],
      (P, Q) => [P[0] + ((0 - P[1]) * (Q[0] - P[0])) / (Q[1] - P[1]), 0],
      (P, Q) => [P[0] + ((ymax - P[1]) * (Q[0] - P[0])) / (Q[1] - P[1]), ymax],
    ];
    let out = poly;
    for (let e = 0; e < 4; e++) {
      const inp = out;
      out = [];
      for (let i = 0; i < inp.length; i++) {
        const P = inp[i];
        const Q = inp[(i + 1) % inp.length];
        const pin = edges[e](P);
        const qin = edges[e](Q);
        if (pin) out.push(P);
        if (pin !== qin) out.push(inter[e](P, Q));
      }
      if (!out.length) break;
    }
    return out;
  }
  function sortPoly(pts) {
    const P = pts.map((p) => [p[0].toNumber(), p[1].toNumber()]);
    const cx = P.reduce((s, p) => s + p[0], 0) / P.length;
    const cy = P.reduce((s, p) => s + p[1], 0) / P.length;
    return P.sort((u, v) => Math.atan2(u[1] - cy, u[0] - cx) - Math.atan2(v[1] - cy, v[0] - cx));
  }
  function lineSeg(a, t, xmax, ymax) {
    a = a.map((v) => F(v).toNumber());
    t = F(t).toNumber();
    const pts = [];
    if (a[1] !== 0) {
      const y0 = t / a[1];
      const y1 = (t - a[0] * xmax) / a[1];
      if (y0 >= -1e-9 && y0 <= ymax + 1e-9) pts.push([0, y0]);
      if (y1 >= -1e-9 && y1 <= ymax + 1e-9) pts.push([xmax, y1]);
    }
    if (a[0] !== 0) {
      const x0 = t / a[0];
      const x1 = (t - a[1] * ymax) / a[0];
      if (x0 >= -1e-9 && x0 <= xmax + 1e-9) pts.push([x0, 0]);
      if (x1 >= -1e-9 && x1 <= xmax + 1e-9) pts.push([x1, ymax]);
    }
    if (pts.length < 2) return null;
    // farthest pair
    let best = [pts[0], pts[1]];
    let d = -1;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const dd = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (dd > d) {
          d = dd;
          best = [pts[i], pts[j]];
        }
      }
    return best;
  }
  const niceStep = (m) => (m <= 12 ? 1 : m <= 24 ? 2 : m <= 60 ? 5 : m <= 120 ? 10 : 20);

  function gpPlot(goals, region, o) {
    o = o || {};
    const xmax = o.xmax;
    const ymax = o.ymax;
    const S = 300;
    const pad = 30;
    const sx = (S - pad - 10) / xmax;
    const sy = (S - pad - 10) / ymax;
    const X = (x) => (pad + x * sx).toFixed(1);
    const Y = (y) => (S - pad - y * sy).toFixed(1);
    let svg = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;margin:0 auto">`;
    const stx = niceStep(xmax);
    const sty = niceStep(ymax);
    for (let i = 0; i <= xmax + 1e-9; i += stx) svg += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(ymax)}" style="stroke:var(--line);stroke-width:1"/><text x="${X(i)}" y="${(+Y(0) + 13).toFixed(1)}" text-anchor="middle" style="font-size:9.5px;fill:var(--muted)">${i}</text>`;
    for (let j = 0; j <= ymax + 1e-9; j += sty) svg += `<line x1="${X(0)}" y1="${Y(j)}" x2="${X(xmax)}" y2="${Y(j)}" style="stroke:var(--line);stroke-width:1"/><text x="${(+X(0) - 4).toFixed(1)}" y="${(+Y(j) + 3.5).toFixed(1)}" text-anchor="end" style="font-size:9.5px;fill:var(--muted)">${j}</text>`;
    // region
    if (region && region.length) {
      if (region.length >= 3) {
        const poly = clipPoly(sortPoly(region), xmax, ymax);
        if (poly.length >= 3) svg += `<polygon points="${poly.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ')}" style="fill:var(--acc);fill-opacity:0.16;stroke:var(--acc);stroke-width:1.2"/>`;
      } else if (region.length === 2) {
        const P = region.map((p) => [Math.min(p[0].toNumber(), xmax), Math.min(p[1].toNumber(), ymax)]);
        svg += `<line x1="${X(P[0][0])}" y1="${Y(P[0][1])}" x2="${X(P[1][0])}" y2="${Y(P[1][1])}" style="stroke:var(--acc);stroke-width:6;stroke-opacity:0.45;stroke-linecap:round"/>`;
      }
    }
    // goal lines
    goals.forEach((G, g) => {
      const seg = lineSeg(G.a, G.t, xmax, ymax);
      if (!seg) return;
      const col = COLORS[g % COLORS.length];
      svg += `<line x1="${X(seg[0][0])}" y1="${Y(seg[0][1])}" x2="${X(seg[1][0])}" y2="${Y(seg[1][1])}" style="stroke:${col};stroke-width:2"/>`;
      // label near the end with the larger y (or x-axis end)
      const L = seg[0][1] >= seg[1][1] ? seg[0] : seg[1];
      const lx = Math.min(Math.max(+X(L[0]) + 4, pad + 4), S - 26);
      const ly = Math.min(Math.max(+Y(L[1]) + 12, 14), S - pad - 4);
      svg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" style="font-size:11px;font-weight:700;fill:${col};paint-order:stroke;stroke:var(--card);stroke-width:3px">G${g + 1}</text>`;
    });
    svg += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}" style="stroke:var(--ink);stroke-width:1.2"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(ymax)}" style="stroke:var(--ink);stroke-width:1.2"/>`;
    svg += `<text x="${S - 12}" y="${(+Y(0) - 4).toFixed(1)}" text-anchor="end" style="font-size:11px;fill:var(--ink)">x₁</text><text x="${(+X(0) + 4).toFixed(1)}" y="16" style="font-size:11px;fill:var(--ink)">x₂</text>`;
    if (o.point) {
      const px = o.point[0].toNumber();
      const py = o.point[1].toNumber();
      svg += `<circle cx="${X(px)}" cy="${Y(py)}" r="5" style="fill:var(--gold);stroke:var(--ink);stroke-width:1.2"/>`;
      svg += `<text x="${(+X(px) + 7).toFixed(1)}" y="${(+Y(py) - 7).toFixed(1)}" style="font-size:10.5px;font-weight:700;fill:var(--ink);paint-order:stroke;stroke:var(--card);stroke-width:3px">(${fh(o.point[0])}, ${fh(o.point[1])})</text>`;
    }
    svg += '</svg>';
    const legend = goals
      .map((G, g) => `<span style="color:${COLORS[g % COLORS.length]};font-weight:700">G${g + 1}</span>: ${lin(G.a)} = ${G.t}`)
      .join(' &nbsp;·&nbsp; ');
    return { type: 'html', html: `<div class="viz-cap">${o.caption || ''}</div>${svg}<div class="muted" style="font-size:11.5px;text-align:center;margin-top:4px">${legend}<br>Mavi alan = şu ana kadarki önceliklerin optimal kümesi.</div>` };
  }

  // ------------------------------------------------------------------ gp-graphical generation
  // a goal line through intercepts (p,0) and (0,q): q x1 + p x2 = p q  (divided by gcd)
  function lineByIntercepts(p, q) {
    const g = gcd(p, q);
    return { a: [q / g, p / g], t: (p * q) / g };
  }

  const CTX = [
    {
      vars: ['bowl', 'mug'],
      goals: [
        { name: 'İşgücü (labor, saat)', ge: 'en az {t} saat işgücü kullanmak (işçiler boş kalmasın)', le: 'en fazla {t} saat işgücü kullanmak (overtime istemiyor)', opp: { '-': 'overtime\'ı (fazla mesai) minimize etmek', '+': 'işgücünü boş bırakmamak' } },
        { name: 'Kâr (profit, $10)', ge: 'en az {t} birim kâr elde etmek', le: 'kârı en fazla {t} birimde tutmak', opp: { '-': 'kâr fazlasını minimize etmek', '+': 'kâr açığını minimize etmek' } },
        { name: 'Kil (clay, pound)', ge: 'elindeki en az {t} pound kili kullanmak', le: 'en fazla {t} pound kil kullanmak (fazlasını stoklamak istemiyor)', opp: { '-': 'kil fazlasını minimize etmek', '+': 'kullanılmayan kili minimize etmek' } },
      ],
    },
  ];

  function genGraphical(rng) {
    for (let tries = 0; tries < 5000; tries++) {
      const goals = [];
      const sides = [];
      for (let g = 0; g < 3; g++) {
        const p = rng.int(4, 20);
        const q = rng.int(4, 20);
        if (p === q) continue;
        goals.push(lineByIntercepts(p, q));
        sides.push(rng.chance(0.6) ? '-' : '+');
      }
      if (goals.length < 3) continue;
      // no two parallel lines
      let par = false;
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (goals[i].a[0] * goals[j].a[1] === goals[i].a[1] * goals[j].a[0]) par = true;
      if (par) continue;
      const order = rng.shuffle([0, 1, 2]);
      const prio = order.map((g) => ({ g, side: sides[g] }));
      if (rng.chance(0.5)) {
        const g = rng.pick(order);
        prio.push({ g, side: sides[g] === '-' ? '+' : '-' });
      }
      const L = lexSolve(goals, prio);
      if (!L.unique || L.degenerate) continue;
      if (!L.steps[0].met) continue;
      const unmet = L.steps.filter((s) => !s.met);
      if (!unmet.length) continue;
      if (L.steps.filter((s) => s.met).length < 2) continue;
      const pt = L.point;
      if (!goodFrac(pt[0], 3, 40) || !goodFrac(pt[1], 3, 40)) continue;
      if (unmet.some((s) => !goodFrac(s.dev, 3, 400))) continue;
      // last step must matter (point not already fixed before the last priority)
      const prev = L.steps[L.steps.length - 1].before;
      if (prev.length < 2) continue;
      // after an unmet step that is not the last, the region must be a segment (not yet a point)
      if (L.steps.slice(0, -1).some((s) => s.after.length < 2)) continue;
      return { goals, prio, L };
    }
    throw new Error('uygun grafik GP örneği bulunamadı');
  }

  function graphicalExercise(rng) {
    const { goals, prio, L } = genGraphical(rng);
    const ctx = CTX[0];
    const pt = L.point;
    // plot window
    let mx = 0;
    let my = 0;
    goals.forEach((G) => {
      mx = Math.max(mx, G.t / G.a[0]);
      my = Math.max(my, G.t / G.a[1]);
    });
    mx = Math.max(mx, pt[0].toNumber());
    my = Math.max(my, pt[1].toNumber());
    const xmax = Math.ceil((mx * 1.1) / niceStep(mx)) * niceStep(mx);
    const ymax = Math.ceil((my * 1.1) / niceStep(my)) * niceStep(my);
    const W = { xmax, ymax };
    const steps = [];
    const devName = (p) => dv('d', p.g, p.side);
    const relTxt = (p, t) => `${lin(goals[p.g].a)} ${p.side === '-' ? '≥' : '≤'} ${t == null ? goals[p.g].t : fh(t)}`;

    // ---- first: which side satisfies P1's goal
    const p0 = prio[0];
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `${Pk(0)}: min <b>${devName(p0)}</b>. ${devName(p0)} = 0 olan noktalar G${p0.g + 1} doğrusunun (${lin(goals[p0.g].a)} = ${goals[p0.g].t}) hangi tarafındadır?`,
      options: [
        { html: `Orijini içeren taraf (${lin(goals[p0.g].a)} ≤ ${goals[p0.g].t})`, correct: p0.side === '+' },
        { html: `Orijini içermeyen taraf (${lin(goals[p0.g].a)} ≥ ${goals[p0.g].t})`, correct: p0.side === '-' },
        { html: `Yalnızca doğrunun üzeri (${lin(goals[p0.g].a)} = ${goals[p0.g].t})`, correct: false },
      ],
      hint: `${p0.side === '-' ? 'd⁻ = ulaşılamayan miktar' : 'd⁺ = aşılan miktar'}. Goal constraint: ${lin(goals[p0.g].a)} + d⁻ − d⁺ = ${goals[p0.g].t}.`,
      explain: `${devName(p0)} = 0 ⇔ ${relTxt(p0)}. ${p0.side === '-' ? 'Hedefin altında kalmamak' : 'Hedefi aşmamak'} istendiği için ${p0.side === '-' ? 'orijinin karşı tarafı' : 'orijinin bulunduğu taraf'} (doğru dahil) — eşitlik değil, yarı-düzlem. x ≥ 0 bölgesi bu yarı-düzlemle kesiştiğinden ${Pk(0)} tam karşılanır.`,
      vizDuring: gpPlot(goals, vertices([]), Object.assign({ caption: 'x ≥ 0 (başlangıç bölgesi)' }, W)),
      viz: gpPlot(goals, L.steps[0].after, Object.assign({ caption: `${Pk(0)} sonrası bölge: ${relTxt(p0)}` }, W)),
    });

    // ---- priorities 2..K
    L.steps.forEach((s, k) => {
      if (k === 0) return;
      const p = s.p;
      const G = goals[p.g];
      const before = gpPlot(goals, s.before, Object.assign({ caption: `${Pk(k)} öncesi bölge (${Pk(0)}…${Pk(k - 1)} sağlanmış)` }, W));
      const isLast = k === L.steps.length - 1;
      const after = gpPlot(goals, s.after, Object.assign({ caption: `${Pk(k)} sonrası: ${s.met ? relTxt(p) : `${lin(G.a)} = ${fh(s.best)}`}`, point: isLast ? pt : null }, W));
      const ext = p.side === '-' ? 'en büyük' : 'en küçük';
      const bestPts = s.before.filter((q) => dot(G.a, q).eq(s.best));
      const bestTxt = bestPts.map((q) => `(${fh(q[0])}, ${fh(q[1])})`).join(', ');
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `${Pk(k)}: min <b>${devName(p)}</b> (hedef: ${relTxt(p)}). Mavi bölge (daha yüksek önceliklerin optimal kümesi) içinde bu hedef <b>tam olarak</b> (${devName(p)} = 0) karşılanabilir mi?`,
        options: [
          { html: `Evet — bölge ${relTxt(p)} yarı-düzlemiyle kesişir; yeni bölge = kesişim`, correct: s.met },
          { html: `Hayır — bölgenin tamamı hedefin yanlış tarafında; ${lin(G.a)} ifadesinin ${ext} olduğu nokta(lar) seçilir, ${devName(p)} > 0`, correct: !s.met },
        ],
        hint: `Bölgenin köşe noktalarında ${lin(G.a)} değerine bak: ${ext} değer ${G.t} hedefine ulaşıyor mu?`,
        explain: `Köşe noktaları: ${s.before
          .filter((q) => q[0].lt(BOX) && q[1].lt(BOX))
          .map((q) => `(${fh(q[0])}, ${fh(q[1])}) → ${fh(dot(G.a, q))}`)
          .join('; ')}${s.before.some((q) => !q[0].lt(BOX) || !q[1].lt(BOX)) ? ' (bölge sınırsız)' : ''}. ${
          s.met
            ? `Hedefi sağlayan noktalar var → ${devName(p)} = 0; bölge ${relTxt(p)} ile daraltılır.`
            : `${ext === 'en büyük' ? 'En büyük' : 'En küçük'} değer ${fh(s.best)} (nokta(lar): ${bestTxt}) → hedefe (${G.t}) ulaşılamaz, ${devName(p)} = |${G.t} − ${fh(s.best)}| = ${fh(s.dev)}. Daha yüksek öncelikleri bozmadan yaklaşılabilecek en yakın değer budur; bölge ${lin(G.a)} = ${fh(s.best)} kümesine iner.`
        }`,
        vizDuring: before,
        viz: after,
      });
      if (!s.met) {
        steps.push({
          kind: 'number',
          prompt: `${Pk(k)} karşılanamıyor. Daha yüksek öncelikleri bozmadan ulaşılabilecek <b>minimum ${devName(p)}</b> nedir?`,
          fields: [{ label: devName(p), answer: s.dev }],
          hint: `Mavi bölgede ${lin(G.a)} ifadesinin ${ext} değerini bul (bir köşe noktasında), hedeften farkını al.`,
          explain: `${ext === 'en büyük' ? 'max' : 'min'} ${lin(G.a)} = ${fh(s.best)} (nokta(lar): ${bestTxt}) → ${devName(p)} = ${fh(s.dev)}.`,
        });
      }
    });

    // ---- final point and deviations
    const devAll = [];
    goals.forEach((G, g) => {
      const v = dot(G.a, pt);
      const dm = F(G.t).sub(v);
      devAll.push({ g, side: '-', val: dm.gt(0) ? dm : ZERO, v });
      devAll.push({ g, side: '+', val: dm.lt(0) ? dm.neg() : ZERO, v });
    });
    steps.push({
      kind: 'number',
      prompt: `Son öncelikten sonra bölge tek bir noktaya indi. Optimal noktayı ve tüm deviational variable'ları yaz.`,
      fields: [
        { label: 'x<sub>1</sub>', answer: pt[0] },
        { label: 'x<sub>2</sub>', answer: pt[1] },
      ].concat(devAll.map((d) => ({ label: dv('d', d.g, d.side), answer: d.val }))),
      hint: 'Nokta, son bölgeyi tanımlayan iki doğrunun kesişimidir. Sapmalar: d⁻ = max(0, hedef − değer), d⁺ = max(0, değer − hedef); her goal\'de en az biri 0.',
      explain: `Optimal nokta (${fh(pt[0])}, ${fh(pt[1])}). ${devAll
        .filter((d) => d.side === '-')
        .map((d) => `G${d.g + 1}: ${lin(goals[d.g].a)} = ${fh(d.v)} vs ${goals[d.g].t} → ${dv('d', d.g, '-')} = ${fh(d.val)}, ${dv('d', d.g, '+')} = ${fh(devAll.find((e) => e.g === d.g && e.side === '+').val)}`)
        .join('; ')}.`,
      viz: gpPlot(goals, [pt], Object.assign({ caption: 'Optimal nokta', point: pt }, W)),
    });

    const metPr = L.steps.map((s, k) => ({ k, met: s.met }));
    steps.push({
      kind: 'multi',
      keepOrder: true,
      prompt: `Hangi öncelik(ler) <b>tam olarak karşılandı</b>?`,
      options: metPr.map((m) => ({ html: `${Pk(m.k)}: ${devName(prio[m.k])} = 0`, correct: m.met })),
      hint: 'Optimal noktada her önceliğin minimize ettiği deviational variable\'ın değerine bak.',
      explain: L.steps.map((s, k) => `${Pk(k)}: ${devName(s.p)} = ${fh(s.dev)} ${s.met ? '✓' : '✗'}`).join(' · ') + '. Daha düşük öncelikli bir goal\'e yaklaşmanın tek yolu daha yüksek öncelikli bir goal\'ün sapmasını artırmak olduğunda durulur.',
    });

    const objTxt = prio.map((p, k) => `${Pk(k)}${devName(p)}`).join(', ');
    const rows = goals.map((G, g) => `${lin(G.a)} + ${dv('d', g, '-')} − ${dv('d', g, '+')} = ${G.t}   (G${g + 1})`);
    const words = prio
      .map((p, k) => {
        const gi = ctx.goals[p.g];
        const first = prio.findIndex((q) => q.g === p.g) === k;
        const txt = first ? (p.side === '-' ? gi.ge : gi.le).replace('{t}', goals[p.g].t) : gi.opp[p.side === '+' ? '-' : '+'];
        return `<li><b>${Pk(k)}</b> (${gi.name}): ${txt} → min ${devName(p)}</li>`;
      })
      .join('');
    const statement = `<p>Bir atölye iki ürün üretiyor: x<sub>1</sub> = ${ctx.vars[0]}, x<sub>2</sub> = ${ctx.vars[1]} sayısı (Beaver Creek tarzı, sürekli kabul). Hedefler önem sırasıyla:</p>
      <ul>${words}</ul>
      <div class="model">minimize ${objTxt}
s.t. ${rows.join('\n     ')}
     x<sub>1</sub>, x<sub>2</sub>, d<sub>i</sub><sup>−</sup>, d<sub>i</sub><sup>+</sup> ≥ 0</div>
      <p>Problemi <b>grafik olarak</b>, öncelik sırasıyla çöz: önce P<sub>1</sub> hedefini sağlayan bölge, sonra o bölge içinde P<sub>2</sub> hedefine olabildiğince yaklaş, … (P<sub>1</sub> ⋙ P<sub>2</sub> ⋙ …).</p>`;
    return {
      title: 'Preemptive GP · Grafik Çözüm',
      statement,
      viz: gpPlot(goals, vertices([]), Object.assign({ caption: 'Goal doğruları (x ≥ 0)' }, W)),
      steps,
      solution: `<b>Optimal:</b> x<sub>1</sub> = ${fh(pt[0])}, x<sub>2</sub> = ${fh(pt[1])}. ${L.steps.map((s, k) => `${Pk(k)}: ${devName(s.p)} = ${fh(s.dev)}`).join(', ')}.`,
    };
  }

  OR.registerDrill({
    id: 'gp-graphical',
    topic: '3.2.1',
    title: 'Preemptive GP · Grafik Çözüm',
    description:
      'İki değişkenli preemptive GP\'yi notlardaki Beaver Creek örneği gibi <b>grafik olarak</b> çöz: öncelik sırasıyla her goal\'ü sağlayan yarı-düzlemi mevcut bölgeyle kesiştir; karşılanamayan goal\'de en yakın noktaları bul ve sapmayı hesapla; son noktayı ve tüm d<sup>−</sup>, d<sup>+</sup> değerlerini oku.',
    lexSolve,
    vertices,
    genGraphical,
    generate: (rng) => graphicalExercise(rng),
  });

  /* ====================================================================== FORMULATION */
  const SCEN = [
    {
      key: 'ad',
      intro: 'Bir reklam ajansı bir otomobil firması için TV reklam programı hazırlıyor (notlardaki Priceler örneği gibi).',
      vars: ['futbol maçlarında gösterilen reklam dakikası', 'pembe dizilerde (soap opera) gösterilen reklam dakikası'],
      attrs: [
        { name: 'HIM (yüksek gelirli erkek, milyon)', unit: 'milyon kişi', short: 'HIM', ge: 'Reklamlar en az {t} milyon HIM tarafından görülmeli.', le: 'Reklamlar en fazla {t} milyon HIM tarafından görülmeli (reklam doygunluğu).', eq: 'Reklamlar tam olarak {t} milyon HIM tarafından görülmeli (iki yöndeki sapma da istenmiyor).' },
        { name: 'LIP (düşük gelirli, milyon)', unit: 'milyon kişi', short: 'LIP', ge: 'Reklamlar en az {t} milyon LIP tarafından görülmeli.', le: 'Reklamlar en fazla {t} milyon LIP tarafından görülmeli (marka imajı).', eq: 'Reklamlar tam olarak {t} milyon LIP tarafından görülmeli.' },
        { name: 'HIW (yüksek gelirli kadın, milyon)', unit: 'milyon kişi', short: 'HIW', ge: 'Reklamlar en az {t} milyon HIW tarafından görülmeli.', le: 'Reklamlar en fazla {t} milyon HIW tarafından görülmeli.', eq: 'Reklamlar tam olarak {t} milyon HIW tarafından görülmeli.' },
      ],
      cost: { name: 'Maliyet (bin $)', hard: 'En fazla {b} bin $ harcanabilir (kesin kısıt).', goal: 'Bütçe ({b} bin $) de bir goal: aşılan her 1 bin $ için 1 birim ceza.' },
      penUnit: 'eksik/fazla her 1 milyon kişi için ceza (bin $)',
      w: [50, 100, 150, 200, 250],
      tRange: [20, 70],
    },
    {
      key: 'pottery',
      intro: 'Bir seramik atölyesi bowl ve mug üretiyor (notlardaki Beaver Creek örneği gibi).',
      vars: ['üretilen bowl sayısı', 'üretilen mug sayısı'],
      attrs: [
        { name: 'İşgücü (saat)', unit: 'saat', short: 'labor', ge: 'Günde en az {t} saat işgücü kullanılmalı (işçiler boş kalmasın).', le: 'Günde en fazla {t} saat işgücü kullanılmalı (overtime istenmiyor).', eq: 'Günde tam olarak {t} saat işgücü kullanılmalı (ne boş kalma ne overtime).' },
        { name: 'Kâr ($10)', unit: '$10', short: 'profit', ge: 'Günde en az {t} birim ($10) kâr elde edilmeli.', le: 'Günlük kâr en fazla {t} birim ($10) olmalı (vergi dilimi).', eq: 'Günlük kâr tam olarak {t} birim ($10) olmalı.' },
        { name: 'Kil (pound)', unit: 'pound', short: 'clay', ge: 'Elde bekleyen kilin bozulmaması için günde en az {t} pound kil kullanılmalı.', le: 'Günde en fazla {t} pound kil kullanılmalı (fazlası için kil stoklamak istenmiyor).', eq: 'Günde tam olarak {t} pound kil kullanılmalı.' },
      ],
      cost: { name: 'Fırın (saat)', hard: 'Fırın günde en fazla {b} saat çalışabilir (kesin kısıt).', goal: 'Fırın süresi ({b} saat) de bir goal: aşılan her 1 saat için 1 birim ceza.' },
      penUnit: 'eksik/fazla her 1 birim için ceza',
      w: [1, 2, 3, 4, 5],
      tRange: [20, 70],
    },
  ];

  function formulateExercise(rng, opts) {
    const modeOpt = (opts && opts.mode) || 'mix';
    const mode = modeOpt === 'mix' ? rng.pick(['weighted', 'preemptive']) : modeOpt;
    const sc = rng.pick(SCEN);
    // directions: at least one "ge", at most one "eq"
    let dirs;
    for (;;) {
      dirs = [0, 1, 2].map(() => rng.pick(['ge', 'ge', 'le', 'eq']));
      if (dirs.includes('ge') && dirs.filter((d) => d === 'eq').length <= 1 && dirs.some((d) => d !== 'ge')) break;
    }
    const A = [0, 1, 2].map(() => [rng.int(2, 10), rng.int(1, 8)]);
    const T = [0, 1, 2].map(() => rng.int(sc.tRange[0] / 5, sc.tRange[1] / 5) * 5);
    const costA = [rng.int(5, 12) * 10, rng.int(3, 8) * 10];
    const budget = rng.int(5, 9) * 100;
    const budgetMode = rng.pick(['hard', 'hard', 'goal', 'none']);
    // weights distinct
    const W = rng.shuffle(sc.w).slice(0, 3);
    const rank = rng.shuffle([0, 1, 2]); // rank[k] = goal at priority k
    const devs = (g) => (dirs[g] === 'ge' ? ['-'] : dirs[g] === 'le' ? ['+'] : ['-', '+']);
    const sv = (g, s) => dv('s', g, s);
    const devSum = (g, flip) => {
      const d = devs(g).map((s) => (flip ? (s === '-' ? '+' : '-') : s));
      return d.length === 2 ? `(${sv(g, '-')} + ${sv(g, '+')})` : sv(g, d[0]);
    };
    const bg = budgetMode === 'goal';
    const bIdx = 3;

    // ---- objective strings
    const wTerm = (w, g, flip) => {
      const d = devs(g).map((s) => (flip ? (s === '-' ? '+' : '-') : s));
      return d.map((s) => `${w}${sv(g, s)}`).join(' + ');
    };
    const budgetTerm = bg ? ` + ${sv(bIdx, '+')}` : '';
    let objCorrect;
    let objWrong = [];
    if (mode === 'weighted') {
      objCorrect = `min z = ${[0, 1, 2].map((g) => wTerm(W[g], g)).join(' + ')}${budgetTerm}`;
      objWrong.push(`min z = ${[0, 1, 2].map((g) => wTerm(W[g], g, true)).join(' + ')}${bg ? ` + ${sv(bIdx, '-')}` : ''}`);
      const Wp = [W[1], W[2], W[0]];
      objWrong.push(`min z = ${[0, 1, 2].map((g) => wTerm(Wp[g], g)).join(' + ')}${budgetTerm}`);
      objWrong.push(`max z = ${[0, 1, 2].map((g) => wTerm(W[g], g)).join(' + ')}${budgetTerm}`);
      objWrong.push(`min z = ${[0, 1, 2].map((g) => `${W[g]}(${sv(g, '-')} + ${sv(g, '+')})`).join(' + ')}${budgetTerm}`);
    } else {
      const pr = (r, flip) => r.map((g, k) => `${Pk(k)}${devSum(g, flip)}`).join(' + ');
      const bT = bg ? ` + ${Pk(3)}${sv(bIdx, '+')}` : '';
      objCorrect = `min z = ${pr(rank)}${bT}`;
      objWrong.push(`min z = ${pr(rank, true)}${bg ? ` + ${Pk(3)}${sv(bIdx, '-')}` : ''}`);
      objWrong.push(`min z = ${pr(rank.slice().reverse())}${bT}`);
      objWrong.push(`max z = ${pr(rank)}${bT}`);
      objWrong.push(`min z = ${rank.map((g) => devSum(g)).join(' + ')}${bg ? ` + ${sv(bIdx, '+')}` : ''}`);
    }

    // ---- statement
    const goalLines = [0, 1, 2]
      .map((g) => {
        const txt = sc.attrs[g][dirs[g]].replace('{t}', T[g]);
        const extra = mode === 'weighted' ? ` <span class="muted">Ceza: ${dirs[g] === 'eq' ? 'her iki yönde' : dirs[g] === 'ge' ? 'eksik kalınan' : 'aşılan'} her 1 ${sc.attrs[g].unit} için ${W[g]}.</span>` : '';
        return `<li><b>Goal ${g + 1}</b>: ${txt}${extra}</li>`;
      })
      .join('');
    const tbl = `<table class="mtx" style="margin:6px 0"><tr><th></th>${sc.attrs.map((a) => `<th>${a.name}</th>`).join('')}${budgetMode !== 'none' ? `<th>${sc.cost.name}</th>` : ''}</tr>${[0, 1]
      .map((j) => `<tr><th>x<sub>${j + 1}</sub></th>${[0, 1, 2].map((g) => `<td>${A[g][j]}</td>`).join('')}${budgetMode !== 'none' ? `<td>${costA[j]}</td>` : ''}</tr>`)
      .join('')}</table>`;
    const prTxt = mode === 'preemptive' ? `<p>Karar verici goal'leri önem sırasına koyuyor (en önemliden): ${rank.map((g) => `Goal ${g + 1}`).join(' ⋙ ')}${bg ? ' ⋙ bütçe goal\'ü' : ''}.</p>` : '';
    const budTxt = budgetMode === 'hard' ? `<p>${sc.cost.hard.replace('{b}', budget)}</p>` : budgetMode === 'goal' ? `<p>${sc.cost.goal.replace('{b}', budget)}</p>` : '';
    const statement = `<p>${sc.intro} x<sub>1</sub> = ${sc.vars[0]}, x<sub>2</sub> = ${sc.vars[1]}. Birim başına katkılar:</p>${tbl}
      <ul>${goalLines}</ul>${budTxt}${prTxt}
      <p>Notlardaki gibi her goal i için s<sub>i</sub><sup>+</sup> = goal seviyesinin <b>aşıldığı</b> miktar, s<sub>i</sub><sup>−</sup> = <b>altında kalınan</b> miktar olsun${bg ? ` (bütçe goal'ü i = 4)` : ''}. ${mode === 'weighted' ? 'Toplam cezayı minimize eden GP modelini kur.' : 'Preemptive GP modelini kur (P<sub>1</sub> ⋙ P<sub>2</sub> ⋙ …).'}</p>`;

    const steps = [];
    // ---- goal constraint form (random goal)
    const gq = rng.int(0, 2);
    const ex = lin(A[gq]);
    steps.push({
      kind: 'choice',
      prompt: `Goal ${gq + 1} (${sc.attrs[gq].short}) için <b>goal constraint</b> hangisi?`,
      options: uniqOpts([
        { html: `${ex} + ${sv(gq, '-')} − ${sv(gq, '+')} = ${T[gq]}`, correct: true },
        { html: `${ex} − ${sv(gq, '-')} + ${sv(gq, '+')} = ${T[gq]}` },
        { html: `${ex} + ${sv(gq, '-')} − ${sv(gq, '+')} ${dirs[gq] === 'le' ? '≤' : '≥'} ${T[gq]}` },
        { html: `${ex} ${dirs[gq] === 'le' ? '≤' : dirs[gq] === 'ge' ? '≥' : '='} ${T[gq]}` },
      ]),
      hint: 'Goal kısıtı her zaman eşitliğe çevrilir; altında kalınırsa (s⁻) sol tarafı artırarak hedefe tamamlar, aşılırsa (s⁺) fazlayı çıkarır.',
      explain: `Notlar: "the trick is to transform each inequality constraint that represents one of the goals into an equality constraint". Hedefin altında kalırsak ${ex} &lt; ${T[gq]}, eksik ${sv(gq, '-')} ile tamamlanır (+); aşarsak fazlası ${sv(gq, '+')} çıkarılır (−): <b>${ex} + ${sv(gq, '-')} − ${sv(gq, '+')} = ${T[gq]}</b>. Goal'ün yönü (en az / en fazla / tam) kısıtta değil, <b>amaç fonksiyonunda</b> hangi sapmanın cezalandırıldığında görünür. Hard-constraint formu (sapmasız) problemi infeasible yapabilir (Priceler).`,
    });

    // ---- which deviational variables are penalized
    const allDev = [];
    [0, 1, 2].forEach((g) => ['-', '+'].forEach((s) => allDev.push({ g, s, correct: devs(g).includes(s) })));
    if (bg) ['-', '+'].forEach((s) => allDev.push({ g: bIdx, s, correct: s === '+' }));
    steps.push({
      kind: 'multi',
      keepOrder: true,
      prompt: `Amaç fonksiyonunda hangi <b>deviational variable</b>'lar yer alır (cezalandırılır)? Tümünü işaretle.`,
      options: allDev.map((d) => ({ html: sv(d.g, d.s), correct: d.correct })),
      hint: 'Notlar 3.1: hedefin altında kalmak kötü ise s⁻, üstüne çıkmak kötü ise s⁺, tam tutturmak isteniyorsa ikisi birden.',
      explain: [0, 1, 2]
        .map((g) => `Goal ${g + 1} (${dirs[g] === 'ge' ? 'en az' : dirs[g] === 'le' ? 'en fazla' : 'tam olarak'}) → ${devs(g).map((s) => sv(g, s)).join(' ve ')}`)
        .concat(bg ? [`Bütçe goal'ü (aşım cezalı) → ${sv(bIdx, '+')}`] : [])
        .join('; ') + '. Notlar: "If failure to meet goal i occurs when the attained value is numerically smaller than the desired value, s_i⁻ appears in the objective; if larger, s_i⁺; if penalty both over and under, both."',
    });

    // ---- budget handling
    if (budgetMode !== 'none') {
      const cl = lin(costA);
      steps.push({
        kind: 'choice',
        prompt: `${sc.cost.name.split(' (')[0]} kısıtı modelde nasıl yer alır?`,
        options: uniqOpts([
          { html: `${cl} ≤ ${budget}`, correct: budgetMode === 'hard' },
          { html: `${cl} + ${sv(bIdx, '-')} − ${sv(bIdx, '+')} = ${budget} (amaçta ${sv(bIdx, '+')})`, correct: budgetMode === 'goal' },
          { html: `${cl} + ${sv(bIdx, '-')} − ${sv(bIdx, '+')} = ${budget} (amaçta ${sv(bIdx, '-')})`, correct: false },
          { html: `${cl} ≥ ${budget}`, correct: false },
        ]),
        hint: 'Kesin (hard) kısıt asla ihlal edilemez → normal LP kısıtı; goal ise sapma değişkenleriyle eşitliğe çevrilir.',
        explain:
          budgetMode === 'hard'
            ? `Bütçe kesin kısıt (Priceler, Örnek 1): sapma değişkeni yok, <b>${cl} ≤ ${budget}</b>.`
            : `Modified Priceler (Örnek 2) gibi bütçe bir goal olunca eşitliğe çevrilir ve yalnızca <b>aşım</b> (${sv(bIdx, '+')}) cezalandırılır: ${cl} + ${sv(bIdx, '-')} − ${sv(bIdx, '+')} = ${budget}, amaçta ${mode === 'weighted' ? '+1·' : `${Pk(3)}`}${sv(bIdx, '+')}.`,
      });
    }

    // ---- objective
    steps.push({
      kind: 'choice',
      prompt: `Doğru <b>amaç fonksiyonu</b> hangisi?`,
      options: uniqOpts([{ html: objCorrect, correct: true }].concat(objWrong.map((h) => ({ html: h })))).slice(0, 5),
      hint: mode === 'weighted' ? 'Her cezalı sapma kendi goal\'ünün birim cezasıyla çarpılır; GP her zaman bir min problemidir.' : 'P₁ en önemli goal\'ün sapmasına verilir; P₁ ⋙ P₂ ⋙ P₃. Sadece istenmeyen sapmalar yer alır.',
      explain:
        mode === 'weighted'
          ? `Toplam ceza = Σ (birim ceza × istenmeyen sapma): <b>${objCorrect}</b>${bg ? ' (bütçe aşımında her birim için 1 ceza)' : ''}. Yanlış sapma seçmek (ör. "en az" goal'de s⁺) hedefi aşmayı cezalandırır; cezaların yerini değiştirmek goal'lerin göreli önemini bozar.`
          : `Öncelik sırası ${rank.map((g) => `Goal ${g + 1}`).join(' ⋙ ')}${bg ? ' ⋙ bütçe' : ''} → <b>${objCorrect}</b>. P<sub>k</sub> sayısal ağırlık değil; P<sub>1</sub> ⋙ P<sub>2</sub> ⋙ … yani önce P<sub>1</sub>'li sapma minimize edilir, sonra onu bozmadan P<sub>2</sub>'li, …`,
    });

    // ---- candidate point evaluation
    let cand;
    for (let t = 0; t < 200; t++) {
      cand = [rng.int(0, 8), rng.int(0, 8)];
      if (budgetMode === 'hard' && cand[0] * costA[0] + cand[1] * costA[1] > budget) continue;
      const vals = [0, 1, 2].map((g) => A[g][0] * cand[0] + A[g][1] * cand[1] - T[g]);
      if (vals.some((v) => v === 0)) continue;
      if (vals.every((v) => v > 0) || vals.every((v) => v < 0)) continue;
      break;
    }
    const lhs = [0, 1, 2].map((g) => A[g][0] * cand[0] + A[g][1] * cand[1]);
    const sm = lhs.map((v, g) => Math.max(0, T[g] - v));
    const sp = lhs.map((v, g) => Math.max(0, v - T[g]));
    const bl = costA[0] * cand[0] + costA[1] * cand[1];
    const bsp = Math.max(0, bl - budget);
    const fields = [];
    [0, 1, 2].forEach((g) => {
      fields.push({ label: sv(g, '-'), answer: sm[g] });
      fields.push({ label: sv(g, '+'), answer: sp[g] });
    });
    const devExp = [0, 1, 2].map((g) => `Goal ${g + 1}: ${lin(A[g])} = ${lhs[g]} vs ${T[g]} → ${sv(g, '-')} = ${sm[g]}, ${sv(g, '+')} = ${sp[g]}`).join('<br>');
    steps.push({
      kind: 'number',
      prompt: `Aday çözüm: x<sub>1</sub> = ${cand[0]}, x<sub>2</sub> = ${cand[1]}. Bu noktada deviational variable'ların değeri nedir?`,
      fields,
      hint: 'Önce sol tarafı hesapla. Hedefin altındaysa s⁻ = hedef − değer, s⁺ = 0; üstündeyse s⁺ = değer − hedef, s⁻ = 0 (en az biri sıfır).',
      explain: devExp + '<br>Notlar: bir goal constraint\'te deviational variable\'lardan en az biri sıfırdır.',
    });
    if (mode === 'weighted') {
      const terms = [];
      let z = 0;
      [0, 1, 2].forEach((g) =>
        devs(g).forEach((s) => {
          const v = s === '-' ? sm[g] : sp[g];
          terms.push(`${W[g]}·${v}`);
          z += W[g] * v;
        })
      );
      if (bg) {
        terms.push(`1·${bsp}`);
        z += bsp;
      }
      steps.push({
        kind: 'number',
        prompt: `Bu aday çözümün amaç fonksiyonu değeri (toplam ceza) nedir?${bg ? ` (Bütçe: ${lin(costA)} = ${bl} vs ${budget}.)` : ''}`,
        fields: [{ label: 'z', answer: z }],
        hint: 'Sadece amaçta yer alan (cezalı) sapmaları kendi cezalarıyla çarpıp topla.',
        explain: `z = ${terms.join(' + ')} = <b>${z}</b>.${bg ? ` Bütçe aşımı ${sv(bIdx, '+')} = ${bsp}.` : ''}`,
      });
    } else {
      const zk = rank.map((g) => devs(g).reduce((s, d) => s + (d === '-' ? sm[g] : sp[g]), 0));
      const fl = zk.map((v, k) => ({ label: `z<sub>${k + 1}</sub> (${Pk(k)} katsayısı)`, answer: v }));
      if (bg) fl.push({ label: `z<sub>4</sub> (${Pk(3)} katsayısı)`, answer: bsp });
      steps.push({
        kind: 'number',
        prompt: `Preemptive amaç her öncelik için ayrı bir değer verir: z<sub>k</sub> = (P<sub>k</sub> ile çarpılan sapmaların toplamı). Bu aday için z<sub>1</sub>, z<sub>2</sub>, … nedir?${bg ? ` (Bütçe: ${lin(costA)} = ${bl} vs ${budget}.)` : ''}`,
        fields: fl,
        hint: 'z_k = P_k önceliğindeki goal\'ün cezalı sapma(lar)ının değeri. Karşılaştırma lexicographic: önce z₁, eşitse z₂, …',
        explain: rank.map((g, k) => `z<sub>${k + 1}</sub> = ${devSum(g)} = <b>${zk[k]}</b>`).join(', ') + (bg ? `, z<sub>4</sub> = ${sv(bIdx, '+')} = <b>${bsp}</b>` : '') + '. İki çözüm karşılaştırılırken önce z<sub>1</sub> küçük olan tercih edilir; eşitse z<sub>2</sub>\'ye bakılır.',
      });
    }

    const sumRows = [0, 1, 2].map((g) => `${lin(A[g])} + ${sv(g, '-')} − ${sv(g, '+')} = ${T[g]}`);
    if (budgetMode === 'hard') sumRows.push(`${lin(costA)} ≤ ${budget}`);
    if (bg) sumRows.push(`${lin(costA)} + ${sv(bIdx, '-')} − ${sv(bIdx, '+')} = ${budget}`);
    return {
      title: `GP Formülasyonu · ${mode === 'weighted' ? 'Ağırlıklı (penalty)' : 'Preemptive'}`,
      statement,
      steps,
      solution: `<div class="model">${objCorrect}\ns.t. ${sumRows.join('\n     ')}\n     tüm değişkenler ≥ 0</div>`,
    };
  }

  OR.registerDrill({
    id: 'gp-formulate',
    topic: '3.0',
    title: 'GP Formülasyonu (deviational variables)',
    description:
      'Priceler / Beaver Creek tarzı bir problemde goal constraint\'leri (ifade + s<sup>−</sup> − s<sup>+</sup> = hedef) kur, hangi deviational variable\'ların cezalandırılacağını seç (en az / en fazla / tam olarak), ağırlıklı ya da preemptive amaç fonksiyonunu bul ve bir aday çözümün sapmalarını, cezasını hesapla.',
    options: [
      {
        key: 'mode',
        label: 'Amaç tipi',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık' },
          { value: 'weighted', label: 'Ağırlıklı (penalty)' },
          { value: 'preemptive', label: 'Preemptive (P₁ ⋙ P₂ ⋙ …)' },
        ],
      },
    ],
    generate: (rng, opts) => formulateExercise(rng, opts),
  });
})();
