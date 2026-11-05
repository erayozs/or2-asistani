/* Ch.4 NLP · calculus-based drills (notes 4.4, 4.5.1, 4.6.1).
   - 'convexity'        (4.4)  : quadratic f (1–3 vars) → Hessian, principal minors, convex/concave/neither (Ex. 4.8–4.14)
   - 'nlp-1var'         (4.5)  : max/min f(x) on [a,b]: Case 1 stationary points, Case 2 non-differentiable points,
                                 Case 3 endpoints (Ex. 4.16)
   - 'hessian-classify' (4.6)  : stationary points of f(x,y) (1–3 of them), Hessian test → local max/min/saddle (Ex. 4.19)
   Exact arithmetic with OR.F everywhere. Instances are re-drawn until every answer is well defined (no ties, det H ≠ 0, …).
   Exposes helpers on the drill objects (classify, solve1, stationary) for verification scripts. */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const Z = F(0);

  // ------------------------------------------------------------------ number / polynomial helpers
  const mi = (s) => String(s).replace(/-/g, '−');
  const nh = (q) => mi(F(q).html()); // exact: "69/28", "−3"
  const coefTxt = (q) => (q.d === 2n ? mi(q.dec(1)) : nh(q)); // notes style "0.5x1x2"
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const uv = (i) => 'x' + SUBS[i + 1]; // unicode "x₁"
  const NAMES = (n) => Array.from({ length: n }, (_, i) => `x<sub>${i + 1}</sub>`);
  const XY = ['x', 'y'];

  // multivariate polynomial: [{c:Frac, e:[exponents]}]
  function poly(terms) {
    const m = new Map();
    for (const [c, e] of terms) {
      const k = e.join(',');
      const cur = m.get(k);
      m.set(k, { c: (cur ? cur.c : Z).add(F(c)), e: e.slice() });
    }
    return [...m.values()].filter((t) => !t.c.isZero());
  }
  const padd = (...ps) => poly(ps.flat().map((t) => [t.c, t.e]));
  const pmul = (p, q) => poly(p.flatMap((a) => q.map((b) => [a.c.mul(b.c), a.e.map((x, j) => x + b.e[j])])));
  const pscale = (p, k) => poly(p.map((t) => [t.c.mul(F(k)), t.e]));
  const pconst = (n, c) => poly([[c, Array(n).fill(0)]]);
  const ppow = (p, k, n) => {
    let r = pconst(n, 1);
    for (let i = 0; i < k; i++) r = pmul(r, p);
    return r;
  };
  // linear polynomial  Σ coefs[j] x_j + c0
  const plin = (n, coefs, c0 = 0) => poly(coefs.map((c, j) => [c, Array.from({ length: n }, (_, k) => (k === j ? 1 : 0))]).concat([[c0, Array(n).fill(0)]]));
  const pdiff = (p, i) => poly(p.filter((t) => t.e[i] > 0).map((t) => [t.c.mul(t.e[i]), t.e.map((x, j) => (j === i ? x - 1 : x))]));
  function pev(p, x) {
    let s = Z;
    for (const t of p) {
      let v = t.c;
      t.e.forEach((k, j) => {
        for (let q = 0; q < k; q++) v = v.mul(x[j]);
      });
      s = s.add(v);
    }
    return s;
  }
  const deg = (t) => t.e.reduce((a, b) => a + b, 0);
  const cmpE = (a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  };
  function pshow(p, names) {
    const ts = p.slice().sort((a, b) => deg(b) - deg(a) || cmpE(b.e, a.e));
    if (!ts.length) return '0';
    let out = '';
    ts.forEach((t, idx) => {
      const neg = t.c.lt(0);
      const a = t.c.abs();
      const mono = t.e.map((k, j) => (k === 0 ? '' : names[j] + (k > 1 ? `<sup>${k}</sup>` : ''))).join('');
      const cs = mono && a.eq(1) ? '' : mono && !a.isInt() && a.d !== 2n ? `(${coefTxt(a)})` : coefTxt(a);
      const term = cs + mono;
      out += idx === 0 ? (neg ? '−' : '') + term : (neg ? ' − ' : ' + ') + term;
    });
    return out;
  }
  // univariate polynomial [c0, c1, c2, ...] (Frac) helpers
  const uev = (p, x) => p.reduceRight((acc, c) => acc.mul(x).add(c), Z);
  const uder = (p) => p.slice(1).map((c, i) => c.mul(i + 1));
  const ushow = (p, name = 'x') =>
    pshow(
      poly(p.map((c, i) => [c, [i]])),
      [name]
    );

  // determinants / principal minors (Frac matrices)
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0].mul(M[1][1]).sub(M[0][1].mul(M[1][0]));
    let s = Z;
    for (let j = 0; j < n; j++) {
      const sub = M.slice(1).map((r) => r.filter((_, k) => k !== j));
      const term = M[0][j].mul(det(sub));
      s = j % 2 ? s.sub(term) : s.add(term);
    }
    return s;
  }
  function subsets(n, k) {
    const out = [];
    (function rec(start, cur) {
      if (cur.length === k) return out.push(cur.slice());
      for (let i = start; i < n; i++) {
        cur.push(i);
        rec(i + 1, cur);
        cur.pop();
      }
    })(0, []);
    return out;
  }
  // pm[k-1] = [{idx:[...], val, leading}] ; order of 2nd PMs follows the notes (delete row/col n, …, 1 → reversed)
  function pminors(H) {
    const n = H.length;
    const pm = [];
    for (let k = 1; k <= n; k++) {
      const lvl = subsets(n, k).map((idx) => ({ idx, val: det(idx.map((i) => idx.map((j) => H[i][j]))), leading: idx.every((v, t) => v === t) }));
      pm.push(lvl);
    }
    return pm;
  }
  const sgn = (q) => (q.isZero() ? 0 : q.gt(0) ? 1 : -1);
  function classify(H) {
    const pm = pminors(H);
    const all = pm.flat();
    if (all.every((m) => m.val.isZero())) return 'zero';
    const want = (k) => (k % 2 === 0 ? -1 : 1); // k = index (0-based) → order k+1 ; sign of (−1)^(k+1)
    const pd = all.every((m) => m.val.gt(0));
    const psd = all.every((m) => m.val.ge(0));
    const nd = pm.every((lvl, k) => lvl.every((m) => sgn(m.val) === want(k)));
    const nsd = pm.every((lvl, k) => lvl.every((m) => m.val.isZero() || sgn(m.val) === want(k)));
    if (pd) return 'sconvex';
    if (psd) return 'convex';
    if (nd) return 'sconcave';
    if (nsd) return 'concave';
    return 'neither';
  }
  const CLS = {
    sconvex: '<b>Strictly convex</b>',
    convex: '<b>Convex</b> (ama strictly convex değil)',
    sconcave: '<b>Strictly concave</b>',
    concave: '<b>Concave</b> (ama strictly concave değil)',
    neither: '<b>Ne convex ne concave</b>',
  };
  const CLS_KEYS = ['sconvex', 'convex', 'sconcave', 'concave', 'neither'];

  const matViz = (M, caption, labels) => ({
    type: 'matrix',
    caption,
    rowLabels: labels,
    colLabels: labels,
    cells: M.map((r) => r.map((v) => (typeof v === 'string' ? v : nh(v)))),
  });

  const SRC_OPT = {
    key: 'src',
    label: 'Kaynak',
    type: 'select',
    default: 'random',
    choices: [
      { value: 'random', label: 'Rastgele problem' },
      { value: 'notes', label: 'Notlardaki örnek' },
    ],
  };

  // ================================================================== 1) CONVEXITY (4.4)
  function quadFromH(H, lin, c0) {
    const n = H.length;
    const terms = [];
    for (let i = 0; i < n; i++) {
      const e = Array(n).fill(0);
      e[i] = 2;
      terms.push([H[i][i].div(2), e]);
      for (let j = i + 1; j < n; j++) {
        const e2 = Array(n).fill(0);
        e2[i] = 1;
        e2[j] = 1;
        terms.push([H[i][j], e2]);
      }
    }
    lin.forEach((c, j) => {
      const e = Array(n).fill(0);
      e[j] = 1;
      terms.push([c, e]);
    });
    terms.push([c0, Array(n).fill(0)]);
    return poly(terms);
  }

  function genH(rng, n, target) {
    for (let t = 0; t < 4000; t++) {
      let H = Array.from({ length: n }, () => Array(n).fill(Z));
      if (target === 'convex' || target === 'concave') {
        const r = n === 2 ? 1 : rng.int(1, 2);
        for (let q = 0; q < r; q++) {
          const v = Array.from({ length: n }, () => rng.int(-2, 2));
          if (v.every((x) => x === 0)) continue;
          const k = rng.pick([1, 1, 2]);
          H = H.map((row, i) => row.map((h, j) => h.add(2 * k * v[i] * v[j])));
        }
        if (target === 'concave') H = H.map((row) => row.map((h) => h.neg()));
      } else {
        const sameSign = target !== 'neither' || rng.chance(0.6);
        const s = target === 'sconcave' ? -1 : target === 'sconvex' ? 1 : rng.pick([1, -1]);
        for (let i = 0; i < n; i++) {
          H[i][i] = F(sameSign ? s * 2 * rng.int(1, 4) : 2 * rng.int(-4, 4));
          for (let j = i + 1; j < n; j++) H[i][j] = H[j][i] = F(rng.int(-4, 4));
        }
      }
      // need some coupling: at least one non-zero off-diagonal (2 for n = 3)
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!H[i][j].isZero()) off++;
      if (off < (n === 3 ? 2 : 1)) continue;
      if (H.some((r) => r.some((h) => h.abs().gt(10)))) continue;
      if (classify(H) === target) return H;
    }
    return null;
  }

  function convexityNotes(rng) {
    const ex = rng.pick(['4.11', '4.12', '4.13', '4.14']);
    const M = (rows) => rows.map((r) => r.map((v) => F(v)));
    if (ex === '4.11') return { ex, H: M([[2, 2], [2, 2]]), lin: [0, 0], c0: 0 };
    if (ex === '4.12') return { ex, H: M([[2, -1, -1], [-1, 2, -1], [-1, -1, 4]]), lin: [0, 0, 0], c0: 0 };
    if (ex === '4.13') return { ex, H: M([[-2, '1/2', 0], ['1/2', -2, 0], [0, 0, -4]]), lin: [0, 0, 0], c0: 0 };
    return { ex, H: M([[2, -3], [-3, 4]]), lin: [0, 0], c0: 0 };
  }

  function pmName(idx, n) {
    if (idx.length === n) return 'det H';
    const del = [];
    for (let i = 0; i < n; i++) if (!idx.includes(i)) del.push(i + 1);
    return `${del.join(',')}. satır/sütun silinerek`;
  }
  const subH = (H, idx) => idx.map((i) => idx.map((j) => H[i][j]));
  const detTxt = (M) =>
    M.length === 1 ? nh(M[0][0]) : M.length === 2 ? `(${nh(M[0][0])})(${nh(M[1][1])}) − (${nh(M[0][1])})(${nh(M[1][0])})` : 'det';

  function classReason(H, cls) {
    const n = H.length;
    const pm = pminors(H);
    const lst = (k) => pm[k].map((m) => nh(m.val)).join(', ');
    const lines = pm.map((lvl, k) => `${k + 1}. principal minor${lvl.length > 1 ? "'lar" : ''}: ${lst(k)}`).join('<br>');
    let why = '';
    if (cls === 'sconvex') why = `Tüm principal minor'lar <b>pozitif</b> (> 0) → H positive definite → f <b>strictly convex</b>.`;
    else if (cls === 'convex') why = `Tüm principal minor'lar <b>≥ 0</b> (negatif yok) → H positive semidefinite → f <b>convex</b>. En az biri 0 olduğundan (H singular) notlardaki strict convexity koşulu (hepsi > 0) sağlanmaz.`;
    else if (cls === 'sconcave') why = `k. mertebeden tüm principal minor'lar (−1)<sup>k</sup> işaretinde ve sıfırdan farklı (1. < 0, 2. > 0${n === 3 ? ', 3. < 0' : ''}) → H negative definite → f <b>strictly concave</b>.`;
    else if (cls === 'concave') why = `Sıfırdan farklı principal minor'lar (−1)<sup>k</sup> işaretinde (1. ≤ 0, 2. ≥ 0${n === 3 ? ', 3. ≤ 0' : ''}) → H negative semidefinite → f <b>concave</b>. Sıfır olan minor var (H singular) → strictly concave değil.`;
    else {
      const posFirst = pm[0].some((m) => m.val.gt(0));
      const negFirst = pm[0].some((m) => m.val.lt(0));
      const bits = [];
      if (posFirst) bits.push(`pozitif 1. principal minor var → f <b>concave olamaz</b>`);
      if (negFirst) bits.push(`negatif 1. principal minor var → f <b>convex olamaz</b>`);
      const neg2 = pm[1] && pm[1].find((m) => m.val.lt(0));
      if (neg2) bits.push(`${nh(neg2.val)} < 0 olan 2. principal minor var → f ne convex (≥ 0 gerekir) ne concave (2. minor'lar ≥ 0 gerekir) olabilir`);
      if (n === 3 && !neg2) {
        const d = pm[2][0].val;
        if (pm[0].every((m) => m.val.ge(0)) && d.lt(0)) bits.push(`det H = ${nh(d)} < 0 → convex olamaz`);
        if (pm[0].every((m) => m.val.le(0)) && d.gt(0)) bits.push(`det H = ${nh(d)} > 0 → concave olamaz (3. mertebede ≤ 0 gerekir)`);
      }
      why = bits.join('; ') + ' → f <b>ne convex ne concave</b> (H indefinite).';
    }
    return `${lines}<br>${why}`;
  }

  function convexity2or3(rng, opts, n) {
    let H, lin, c0, ex;
    if (opts.src === 'notes') {
      const ne = convexityNotes(rng);
      ({ H, lin, c0, ex } = ne);
      n = H.length;
    } else {
      const target = rng.pick(CLS_KEYS);
      H = genH(rng, n, target);
      if (!H) throw new Error('H üretilemedi');
      lin = Array.from({ length: n }, () => (rng.chance(0.6) ? rng.int(-6, 6) : 0));
      c0 = rng.chance(0.3) ? rng.int(-5, 9) : 0;
    }
    const f = quadFromH(H, lin, c0);
    const names = NAMES(n);
    const grads = names.map((_, i) => pdiff(f, i));
    const cls = classify(H);
    const labels = names;
    const Hviz = matViz(H, 'Hessian H (sabit matris: f quadratic)', labels);
    const fTxt = pshow(f, names);
    const steps = [];
    const hFields = [];
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) hFields.push({ label: `H<sub>${i + 1}${j + 1}</sub> = ∂²f/∂${uv(i)}${i === j ? '²' : '∂' + uv(j)}`, answer: H[i][j] });
    steps.push({
      kind: 'number',
      prompt: `Hessian matrisinin elemanlarını bul (H<sub>ij</sub> = ∂²f/∂x<sub>i</sub>∂x<sub>j</sub>; H simetrik olduğundan H<sub>ji</sub> = H<sub>ij</sub>).`,
      fields: hFields,
      hint: `Önce birinci türevleri al: ${names.map((nm, i) => `f<sub>${uv(i)}</sub>`).join(', ')}; sonra her birini tekrar türevle.`,
      explain: `${grads.map((g, i) => `f<sub>${uv(i)}</sub> = ${pshow(g, names)}`).join(', ')}.<br>Tekrar türevleyince: ${hFields
        .map((fl, k) => `${fl.label.split(' =')[0]} = ${nh(fl.answer)}`)
        .join(', ')}. Hessian sabit (x'ten bağımsız) çünkü f ikinci dereceden.`,
      viz: Hviz,
    });
    const pm = pminors(H);
    if (n === 2) {
      steps.push({
        kind: 'number',
        prompt: `H'nin <b>principal minor</b>'larını hesapla.`,
        fields: [
          { label: '1. principal minor (leading) H<sub>11</sub>', answer: H[0][0] },
          { label: '1. principal minor H<sub>22</sub>', answer: H[1][1] },
          { label: '2. principal minor det H', answer: pm[1][0].val },
        ],
        hint: '1. mertebe: köşegen elemanları. 2. mertebe: H<sub>11</sub>H<sub>22</sub> − H<sub>12</sub>H<sub>21</sub>.',
        explain: `1. principal minor'lar ${nh(H[0][0])} (leading) ve ${nh(H[1][1])}. 2. principal minor = ${detTxt(H)} = <b>${nh(pm[1][0].val)}</b>.`,
      });
    } else {
      steps.push({
        kind: 'number',
        prompt: `1. principal minor'lar köşegen elemanlarıdır (${H.map((r, i) => nh(r[i])).join(', ')}). Şimdi <b>2. principal minor</b>'ları hesapla (notlardaki gibi bir satırı ve aynı sütunu silerek).`,
        fields: [2, 1, 0].map((del) => {
          const idx = [0, 1, 2].filter((i) => i !== del);
          const m = pm[1].find((q) => q.idx.join() === idx.join());
          return { label: `${del + 1}. satır ve sütun silinince`, answer: m.val };
        }),
        hint: 'Kalan 2×2 matrisin determinantı: ad − bc.',
        explain: [2, 1, 0]
          .map((del) => {
            const idx = [0, 1, 2].filter((i) => i !== del);
            const S = subH(H, idx);
            return `${del + 1}. satır/sütun silinince: det[${S.map((r) => r.map(nh).join(' ')).join('; ')}] = ${detTxt(S)} = <b>${nh(det(S))}</b>`;
          })
          .join('<br>'),
      });
      const d3 = pm[2][0].val;
      const c = (i, j) => H[i][j];
      const m1 = det(subH(H, [1, 2])), m2 = c(1, 0).mul(c(2, 2)).sub(c(1, 2).mul(c(2, 0))), m3 = c(1, 0).mul(c(2, 1)).sub(c(1, 1).mul(c(2, 0)));
      steps.push({
        kind: 'number',
        prompt: `<b>3. principal minor</b> = det H'yi hesapla.`,
        fields: [{ label: 'det H', answer: d3 }],
        hint: '1. satıra göre kofaktör açılımı: H₁₁·M₁₁ − H₁₂·M₁₂ + H₁₃·M₁₃.',
        explain: `det H = ${nh(c(0, 0))}·(${nh(m1)}) − (${nh(c(0, 1))})·(${nh(m2)}) + (${nh(c(0, 2))})·(${nh(m3)}) = <b>${nh(d3)}</b>. (Leading principal minor'lar: D₁ = ${nh(pm[0][0].val)}, D₂ = ${nh(pm[1].find((m) => m.leading).val)}, D₃ = ${nh(d3)}.)`,
      });
    }
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Buna göre f(${names.join(', ')}) = ${fTxt} fonksiyonu R<sup>${n}</sup> üzerinde nedir?`,
      options: CLS_KEYS.map((k) => ({ html: CLS[k], correct: k === cls })),
      hint: 'Convex: tüm principal minor\'lar ≥ 0 (strict: > 0). Concave: k. mertebeden sıfırdan farklı minor\'lar (−1)^k işaretinde (strict: hepsi sıfırdan farklı ve bu işarette). Semidefinite kontrolünde yalnızca leading minor\'lar yetmez!',
      explain: classReason(H, cls) + (ex ? `<br><span class="muted">(Notlardaki Örnek ${ex}.)</span>` : ''),
    });
    return {
      _data: { H, f, n, cls },
      title: `Convexity / Concavity · ${n} değişken`,
      statement: `${ex ? `<b>Notlardaki Örnek ${ex}.</b> ` : ''}Aşağıdaki fonksiyonun S = R<sup>${n}</sup> üzerinde convex mi, concave mi, yoksa hiçbiri mi olduğunu <b>Hessian ve principal minor'lar</b> ile belirle:<div class="box">f(${names.join(', ')}) = ${fTxt}</div>`,
      steps,
      solution: `H = [${H.map((r) => r.map(nh).join(', ')).join(' ; ')}] → ${CLS[cls]}.`,
    };
  }

  function convexity1(rng) {
    for (let t = 0; t < 500; t++) {
      const target = rng.pick(['sconvex', 'sconcave', 'neither']);
      const p = rng.pick([1, -1, 2, -2, F('1/3'), F('-1/3')]);
      const q = rng.int(-6, 6);
      const r = rng.int(-8, 8);
      const s = rng.int(-5, 5);
      const l = rng.int(-4, 3);
      const u = l + rng.int(2, 5);
      const f2 = [F(2 * q), F(p).mul(6)]; // f''(x) = 2q + 6p x
      const vl = uev(f2, F(l)), vu = uev(f2, F(u));
      if (vl.isZero() || vu.isZero()) continue;
      const cls = vl.gt(0) && vu.gt(0) ? 'sconvex' : vl.lt(0) && vu.lt(0) ? 'sconcave' : 'neither';
      if (cls !== target) continue;
      const f = [F(s), F(r), F(q), F(p)];
      const fTxt = ushow(f);
      const root = F(-2 * q).div(F(p).mul(6));
      const steps = [
        {
          kind: 'number',
          prompt: `f″(x) bir doğrusal fonksiyon: f″(x) = αx + β. α ve β nedir?`,
          fields: [
            { label: 'α', answer: f2[1] },
            { label: 'β', answer: f2[0] },
          ],
          hint: 'İki kez türev al: (x³)″ = 6x, (x²)″ = 2.',
          explain: `f′(x) = ${ushow(uder(f))}, f″(x) = <b>${ushow(f2)}</b>.`,
        },
        {
          kind: 'number',
          prompt: `f″ doğrusal olduğundan S = [${mi(l)}, ${mi(u)}] üzerindeki işareti uç noktalardan anlaşılır. f″(${mi(l)}) ve f″(${mi(u)}) nedir?`,
          fields: [
            { label: `f″(${mi(l)})`, answer: vl },
            { label: `f″(${mi(u)})`, answer: vu },
          ],
          explain: `f″(${mi(l)}) = ${nh(vl)}, f″(${mi(u)}) = ${nh(vu)}. (f″(x) = 0 ⇔ x = ${nh(root)}${cls === 'neither' ? ', bu nokta S\'nin içinde' : ', S\'nin dışında'}.)`,
        },
        {
          kind: 'choice',
          keepOrder: true,
          prompt: `f(x) = ${fTxt} fonksiyonu S = [${mi(l)}, ${mi(u)}] üzerinde nedir?`,
          options: CLS_KEYS.map((k) => ({ html: CLS[k], correct: k === cls })),
          hint: 'Notlar: f″(x) ≥ 0 ∀x∈S ⇔ convex (> 0 ise strict); f″(x) ≤ 0 ∀x∈S ⇔ concave (< 0 ise strict).',
          explain:
            cls === 'neither'
              ? `f″ S içinde işaret değiştiriyor (x = ${nh(root)}'de sıfır) → S'de hem pozitif hem negatif → <b>ne convex ne concave</b>.`
              : `f″(x) S'nin her noktasında ${cls === 'sconvex' ? '> 0' : '< 0'} → <b>strictly ${cls === 'sconvex' ? 'convex' : 'concave'}</b>.`,
        },
      ];
      return {
        _data: { f1: f, l, u, cls, n: 1 },
        title: 'Convexity / Concavity · tek değişken',
        statement: `Notlardaki tek değişkenli kural (f″(x) işareti) ile aşağıdaki fonksiyonun <b>S = [${mi(l)}, ${mi(u)}]</b> üzerinde convex/concave olup olmadığını belirle:<div class="box">f(x) = ${fTxt}</div>`,
        steps,
        solution: `f″(x) = ${ushow(f2)} → ${CLS[cls]} (S = [${mi(l)}, ${mi(u)}]).`,
      };
    }
    throw new Error('1-var instance yok');
  }

  OR.registerDrill({
    id: 'convexity',
    topic: '4.4',
    title: 'Convexity · Hessian & principal minors',
    description: 'Rastgele (çoğunlukla quadratic) fonksiyon: Hessian\'ı kur, principal minor\'ları hesapla, convex / concave / hiçbiri (strict mi?) karar ver.',
    options: [
      {
        key: 'n',
        label: 'Değişken sayısı',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık (1–3)' },
          { value: '1', label: '1 (f″ ile)' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
        ],
      },
      SRC_OPT,
    ],
    classify,
    pminors,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') return convexity2or3(rng, opts, 2);
      const n = opts.n && opts.n !== 'mix' ? +opts.n : rng.pick([1, 2, 2, 2, 3, 3]);
      return n === 1 ? convexity1(rng) : convexity2or3(rng, opts, n);
    },
  });

  // ================================================================== 2) ONE-VARIABLE NLP (4.5.1)
  /* f = pieces [{lo, hi, p:[c0,c1,c2,c3]}]; piece k covers [lo,hi) except the last which is [lo,hi].
     Returns candidate list and the optimum. */
  function solve1(model, sense) {
    const pcs = model.pieces;
    const a = pcs[0].lo, b = pcs[pcs.length - 1].hi;
    const cands = [];
    const better = (u, v) => (sense === 'max' ? u.gt(v) : u.lt(v));
    // Case 3 endpoints
    cands.push({ x: a, v: uev(pcs[0].p, a), kind: 3, piece: 0 });
    cands.push({ x: b, v: uev(pcs[pcs.length - 1].p, b), kind: 3, piece: pcs.length - 1 });
    // Case 2 breakpoints
    const limits = [];
    for (let k = 1; k < pcs.length; k++) {
      const c = pcs[k].lo;
      cands.push({ x: c, v: uev(pcs[k].p, c), kind: 2, piece: k });
      const lv = uev(pcs[k - 1].p, c);
      if (!lv.eq(uev(pcs[k].p, c))) limits.push({ x: c, v: lv, piece: k - 1 });
    }
    // Case 1 stationary points
    const stats = [];
    pcs.forEach((pc, k) => {
      for (const r of pc.stat) {
        const inside = r.gt(pc.lo) && r.lt(pc.hi);
        stats.push({ x: r, piece: k, inside, f2: uev(uder(uder(pc.p)), r) });
        if (inside) cands.push({ x: r, v: uev(pc.p, r), kind: 1, piece: k });
      }
    });
    let best = cands[0];
    for (const c of cands) if (better(c.v, best.v)) best = c;
    const ties = cands.filter((c) => c.v.eq(best.v)).length;
    const gap = Math.min(...cands.filter((c) => c !== best).map((c) => Math.abs(c.v.sub(best.v).toNumber())));
    const limitBeats = limits.some((l) => !better(best.v, l.v)); // sup not attained / ties with limit
    return { cands, stats, limits, best, unique: ties === 1, gap, limitBeats };
  }

  const pieceShow = (pc) => pc.txt || ushow(pc.p);
  const vertexPoly = (q, s, p) => [F(q + s * p * p), F(-2 * s * p), F(s), Z]; // q + s(x−p)²

  function gen1var(rng, type) {
    for (let t = 0; t < 3000; t++) {
      const sense = rng.pick(['max', 'min']);
      let model;
      if (type === 'cubic') {
        const r1 = rng.int(-3, 2);
        const r2 = r1 + rng.int(1, 4);
        const c = (r1 + r2) % 2 === 0 ? 1 : 2;
        const s = rng.pick([1, -1]);
        const m = rng.int(-6, 6);
        // f' = 3cs(x−r1)(x−r2)  →  f = cs(x³ − 3/2(r1+r2)x² + 3 r1 r2 x) + m
        const p = [F(m), F(3 * c * s * r1 * r2), F(-3 * c * s * (r1 + r2)).div(2), F(c * s)];
        let a = rng.chance(0.75) ? r1 - rng.int(1, 3) : r1 + 1;
        let b = rng.chance(0.75) ? r2 + rng.int(1, 3) : r2 - 1;
        if (b - a < 2 || a >= b) continue;
        if (!(a < r1 && r1 < b) && !(a < r2 && r2 < b)) continue;
        model = { type, pieces: [{ lo: F(a), hi: F(b), p, stat: [F(r1), F(r2)] }], f1: (x) => uev(p, x) };
      } else if (type === 'piecewise') {
        const a = rng.int(-1, 1);
        const c = a + rng.int(2, 4);
        const b = c + rng.int(2, 4);
        const p1 = rng.int(a + 1, c - 1), p2 = rng.int(c + 1, b - 1);
        const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]);
        const q1 = rng.int(-4, 5), q2 = rng.int(-4, 5);
        const P1 = vertexPoly(q1, s1, p1), P2 = vertexPoly(q2, s2, p2);
        if (uder(P1).length && uev(uder(P1), F(c)).eq(uev(uder(P2), F(c)))) continue;
        const sq = (q, s, p) => {
          const base = p === 0 ? 'x<sup>2</sup>' : `(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})<sup>2</sup>`;
          return q === 0 ? (s < 0 ? '−' : '') + base : `${mi(q)} ${s < 0 ? '−' : '+'} ${base}`;
        };
        model = {
          type,
          pieces: [
            { lo: F(a), hi: F(c), p: P1, stat: [F(p1)], txt: sq(q1, s1, p1) },
            { lo: F(c), hi: F(b), p: P2, stat: [F(p2)], txt: sq(q2, s2, p2) },
          ],
        };
      } else {
        // abs:  f(x) = s x² + βx + k|x − c| + γ
        const s = rng.pick([1, -1]);
        const c = rng.int(-1, 3);
        const k = rng.pick([2, 4, 6]) * rng.pick([1, -1]);
        const beta = 2 * rng.int(-4, 4);
        const gamma = rng.int(-4, 6);
        const a = c - rng.int(2, 4), b = c + rng.int(2, 4);
        // left: s x² + (β − k)x + γ + kc ; right: s x² + (β + k)x + γ − kc
        const L = [F(gamma + k * c), F(beta - k), F(s), Z];
        const R = [F(gamma - k * c), F(beta + k), F(s), Z];
        const st = (P) => P[1].neg().div(P[2].mul(2));
        const absPart = c === 0 ? '|x|' : `|x ${c < 0 ? '+' : '−'} ${Math.abs(c)}|`;
        const txt = `${s < 0 ? '−' : ''}x<sup>2</sup>${beta ? (beta < 0 ? ' − ' : ' + ') + Math.abs(beta) + 'x' : ''} ${k < 0 ? '−' : '+'} ${Math.abs(k)}${absPart}${gamma ? (gamma < 0 ? ' − ' : ' + ') + Math.abs(gamma) : ''}`;
        model = {
          type,
          absTxt: txt,
          absPart,
          absC: c,
          absK: k,
          pieces: [
            { lo: F(a), hi: F(c), p: L, stat: [st(L)] },
            { lo: F(c), hi: F(b), p: R, stat: [st(R)] },
          ],
        };
        // at least one stationary point should fall outside its piece sometimes; keep the mix natural
      }
      const sol = solve1(model, sense);
      if (!sol.unique || sol.gap < 0.5 || sol.limitBeats) continue;
      if (sol.cands.some((cd) => cd.v.abs().gt(60) || cd.v.d > 4n)) continue;
      if (type === 'piecewise' && rng.chance(0.5) && sol.limits.length === 0) continue; // prefer some jumps (like the notes)
      if (type === 'abs' && !sol.cands.some((cd) => cd.kind === 1)) continue;
      if (sol.best.kind === 3 && rng.chance(0.4)) continue; // more interior optima
      return { model, sense, sol };
    }
    return null;
  }

  function notes416() {
    const P1 = vertexPoly(2, -1, 1); // 2 − (x − 1)²
    const P2 = vertexPoly(-3, 1, 4); // −3 + (x − 4)²
    const model = {
      type: 'piecewise',
      notes: true,
      pieces: [
        { lo: F(0), hi: F(3), p: P1, stat: [F(1)], txt: '2 − (x − 1)<sup>2</sup>' },
        { lo: F(3), hi: F(6), p: P2, stat: [F(4)], txt: '−3 + (x − 4)<sup>2</sup>' },
      ],
    };
    return { model, sense: 'max', sol: solve1(model, 'max') };
  }

  function oneVarExercise(inst) {
    const { model, sense, sol } = inst;
    const pcs = model.pieces;
    const a = pcs[0].lo, b = pcs[pcs.length - 1].hi;
    const word = sense === 'max' ? 'maximum' : 'minimum';
    const steps = [];
    let fDef;
    if (model.type === 'cubic') fDef = `f(x) = ${ushow(pcs[0].p)}`;
    else if (model.type === 'abs') fDef = `f(x) = ${model.absTxt}`;
    else fDef = `f(x) = ${pieceShow(pcs[0])} &nbsp; (${nh(pcs[0].lo)} ≤ x < ${nh(pcs[0].hi)} için)<br>f(x) = ${pieceShow(pcs[1])} &nbsp; (${nh(pcs[1].lo)} ≤ x ≤ ${nh(pcs[1].hi)} için)`;
    const valTable = (rows) => ({
      type: 'matrix',
      caption: 'Aday noktalar (extremum candidates)',
      colLabels: ['x', 'Tür', 'f(x)'],
      cells: rows.map((r) => [nh(r.x), r.kind === 1 ? 'Case 1 (f′=0)' : r.kind === 2 ? 'Case 2 (f′ yok)' : r.kind === 'lim' ? 'limit (alınmaz)' : 'Case 3 (uç)', nh(r.v)]),
      cls: rows.map((r) => (r === sol.best ? ['hl', 'hl', 'hl'] : r.kind === 'lim' ? ['dim', 'dim', 'dim'] : ['', '', ''])),
    });

    if (model.type === 'cubic') {
      const pc = pcs[0];
      const d1 = uder(pc.p), d2 = uder(d1);
      const [r1, r2] = pc.stat;
      const fac = (r) => (r.isZero() ? 'x' : `(x ${r.lt(0) ? '+' : '−'} ${nh(r.abs())})`);
      steps.push({
        kind: 'number',
        prompt: `<b>Case 1:</b> f′(x) = 0 denkleminin köklerini bul (küçükten büyüğe).`,
        fields: [
          { label: 'küçük kök', answer: r1 },
          { label: 'büyük kök', answer: r2 },
        ],
        hint: `f′(x) = ${ushow(d1)}; ortak çarpanı dışarı al ve çarpanlarına ayır.`,
        explain: `f′(x) = ${ushow(d1)} = ${nh(d1[2])}${fac(r1)}${fac(r2)} = 0 → x = ${nh(r1)} veya x = ${nh(r2)}.`,
      });
      const ins = sol.stats.filter((s) => s.inside);
      steps.push({
        kind: 'multi',
        keepOrder: true,
        prompt: `Hangileri a < x < b koşulunu sağlayan <b>stationary point</b> (Case 1 adayı)? (Aralık [${nh(a)}, ${nh(b)}])`,
        options: sol.stats.map((s) => ({ html: `x = ${nh(s.x)}`, correct: s.inside })),
        explain: sol.stats.map((s) => `x = ${nh(s.x)}: ${s.inside ? `${nh(a)} < ${nh(s.x)} < ${nh(b)} ✓` : 'aralığın dışında ✗ (aday değil)'}`).join('<br>'),
      });
      steps.push({
        kind: 'number',
        prompt: `Aralık içindeki stationary point'lerde f″ değerini hesapla.`,
        fields: ins.map((s) => ({ label: `f″(${nh(s.x)})`, answer: s.f2 })),
        hint: `f″(x) = ${ushow(d2)}.`,
        explain: `f″(x) = ${ushow(d2)} → ${ins.map((s) => `f″(${nh(s.x)}) = ${nh(s.f2)}`).join(', ')}.`,
      });
      const lab = (s) => (s.f2.lt(0) ? 'local max' : 'local min');
      let opts;
      if (ins.length === 1) {
        opts = ['local max', 'local min', 'saddle / belirlenemez'].map((o) => ({ html: `x = ${nh(ins[0].x)}: ${o}`, correct: o === lab(ins[0]) }));
      } else {
        const combos = [['local max', 'local min'], ['local min', 'local max'], ['local max', 'local max'], ['local min', 'local min']];
        opts = combos.map((cb) => ({ html: `x = ${nh(ins[0].x)}: ${cb[0]}, &nbsp; x = ${nh(ins[1].x)}: ${cb[1]}`, correct: cb[0] === lab(ins[0]) && cb[1] === lab(ins[1]) }));
      }
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `f″ işaretine göre bu stationary point'ler nedir?`,
        options: opts,
        hint: 'f″ < 0 → local max, f″ > 0 → local min.',
        explain: ins.map((s) => `f″(${nh(s.x)}) = ${nh(s.f2)} ${s.f2.lt(0) ? '< 0 → local max' : '> 0 → local min'}`).join('; ') + '. (Polinom her yerde türevlenebilir → <b>Case 2 noktası yok</b>.)',
      });
      const rows = [sol.cands.find((c) => c.kind === 3 && c.x.eq(a))].concat(sol.cands.filter((c) => c.kind === 1), [sol.cands.find((c) => c.kind === 3 && c.x.eq(b))]);
      steps.push({
        kind: 'number',
        prompt: `<b>Case 3</b> uç noktaları dahil tüm adaylarda f(x)'i hesapla.`,
        fields: rows.map((r) => ({ label: `f(${nh(r.x)})`, answer: r.v })),
        explain: rows.map((r) => `f(${nh(r.x)}) = ${nh(r.v)}`).join(', '),
        viz: valTable(rows),
      });
      steps.push({
        kind: 'choice',
        prompt: `[${nh(a)}, ${nh(b)}] üzerinde f'nin <b>global ${word}</b>'u hangi noktada?`,
        options: rows.map((r) => ({ html: `x = ${nh(r.x)}`, correct: r === sol.best })),
        explain: `Aday değerler: ${rows.map((r) => `f(${nh(r.x)}) = ${nh(r.v)}`).join(', ')}. En ${sense === 'max' ? 'büyük' : 'küçük'}ü <b>f(${nh(sol.best.x)}) = ${nh(sol.best.v)}</b>${sol.best.kind === 3 ? ' (bir uç noktada — Case 3 adaylarını unutma!)' : ''}.`,
        viz: valTable(rows),
      });
    } else {
      const c = pcs[1].lo;
      const st = sol.stats;
      const pname = (k) => (model.type === 'abs' ? (k === 0 ? `x < ${nh(c)} parçası` : `x ≥ ${nh(c)} parçası`) : `f<sub>${k + 1}</sub>`);
      const pexpr = (k) => (model.type === 'abs' ? ushow(pcs[k].p) : pieceShow(pcs[k]));
      if (model.type === 'abs') {
        steps.push({
          kind: 'info',
          prompt: `${model.absPart} yüzünden f iki parçalı yazılır:<br>x < ${nh(c)}: f(x) = ${ushow(pcs[0].p)}<br>x ≥ ${nh(c)}: f(x) = ${ushow(pcs[1].p)}`,
        });
      }
      steps.push({
        kind: 'number',
        prompt: `<b>Case 1:</b> Her parçanın stationary point'ini bul (parçanın türevi = 0).`,
        fields: st.map((s) => ({ label: `${pname(s.piece)}: x`, answer: s.x })),
        hint: 'q + s(x − p)² biçimindeki parçanın türevi 2s(x − p) → x = p. Genel ax² + bx + c için x = −b/(2a).',
        explain: st.map((s) => `${pname(s.piece)} = ${pexpr(s.piece)} → türev = ${ushow(uder(pcs[s.piece].p))} = 0 → x = ${nh(s.x)}`).join('<br>'),
      });
      const anyIn = st.some((s) => s.inside);
      steps.push({
        kind: 'multi',
        keepOrder: true,
        prompt: `Bu stationary point'lerden hangileri <b>kendi parçasının iç bölgesinde</b> (yani gerçekten aday)?`,
        options: st
          .map((s) => ({ html: `x = ${nh(s.x)} (${pname(s.piece)}, ${nh(pcs[s.piece].lo)} < x < ${nh(pcs[s.piece].hi)})`, correct: s.inside }))
          .concat([{ html: 'Hiçbiri', correct: !anyIn }]),
        explain: st.map((s) => `x = ${nh(s.x)}: ${s.inside ? 'parçanın içinde ✓' : 'parçanın dışında ✗ → bu parçada f′ = 0 olan nokta yok'}`).join('<br>'),
      });
      const dl = uev(uder(pcs[0].p), c), dr = uev(uder(pcs[1].p), c);
      const jump = sol.limits.length > 0;
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `x = ${nh(c)} noktası hangi tür extremum adayıdır?`,
        options: [
          { html: 'Case 1: a < x < b ve f′(x) = 0', correct: false },
          { html: 'Case 2: f′(x) mevcut değil', correct: true },
          { html: 'Case 3: aralığın uç noktası', correct: false },
        ],
        explain: jump
          ? `f, x = ${nh(c)}'de sıçrama yapıyor (soldan limit ${nh(sol.limits[0].v)}, f(${nh(c)}) = ${nh(uev(pcs[1].p, c))}) → süreksiz, dolayısıyla türevlenemez → <b>Case 2</b>.`
          : `f süreklidir ama soldan türev ${nh(dl)}, sağdan türev ${nh(dr)} farklı → f′(${nh(c)}) yok → <b>Case 2</b>.`,
      });
      const rows = [sol.cands.find((q) => q.kind === 3 && q.x.eq(a))];
      sol.cands.filter((q) => q.kind === 1 && q.piece === 0).forEach((q) => rows.push(q));
      const limRows = sol.limits.map((l) => ({ x: l.x, v: l.v, kind: 'lim' }));
      limRows.forEach((l) => rows.push(l));
      rows.push(sol.cands.find((q) => q.kind === 2));
      sol.cands.filter((q) => q.kind === 1 && q.piece === 1).forEach((q) => rows.push(q));
      rows.push(sol.cands.find((q) => q.kind === 3 && q.x.eq(b)));
      steps.push({
        kind: 'number',
        prompt: `Adaylarda fonksiyon değerlerini hesapla${jump ? ` (x → ${nh(c)}<sup>−</sup> limitini de: notlardaki gibi bu değere yaklaşılır ama 1. parçada ulaşılmaz)` : ''}.`,
        fields: rows.map((r) => ({ label: r.kind === 'lim' ? `lim<sub>x→${nh(c)}⁻</sub> f(x)` : `f(${nh(r.x)})`, answer: r.v })),
        hint: `x = ${nh(c)}'de f(${nh(c)}) ${model.type === 'abs' ? 'her iki parçadan da aynı çıkar' : '2. parçadan hesaplanır'}.`,
        explain: rows.map((r) => (r.kind === 'lim' ? `x → ${nh(c)}⁻: ${nh(r.v)} (alınmaz)` : `f(${nh(r.x)}) = ${nh(r.v)}`)).join(', '),
        viz: valTable(rows),
      });
      const real = rows.filter((r) => r.kind !== 'lim');
      steps.push({
        kind: 'choice',
        prompt: `[${nh(a)}, ${nh(b)}] üzerinde f'nin <b>global ${word}</b>'u hangi noktada?`,
        options: real.map((r) => ({ html: `x = ${nh(r.x)}`, correct: r === sol.best })),
        explain: `En ${sense === 'max' ? 'büyük' : 'küçük'} (ulaşılan) değer <b>f(${nh(sol.best.x)}) = ${nh(sol.best.v)}</b>${model.notes ? ' — notlardaki gibi "the largest value overall is 2".' : '.'}${limRows.length ? ` (Limit değeri ${nh(limRows[0].v)} zaten alınmadığı için aday sayılmaz.)` : ''}`,
        viz: valTable(rows),
      });
    }
    return {
      _data: inst,
      title: `Tek değişkenli NLP · ${model.notes ? 'Örnek 4.16' : model.type === 'cubic' ? 'polinom' : 'parçalı fonksiyon'}`,
      statement: `${model.notes ? '<b>Notlardaki Örnek 4.16.</b> ' : ''}<div class="box">${fDef}</div><b>${sense} f(x)</b> &nbsp; s.t. ${nh(a)} ≤ x ≤ ${nh(b)}<br>Notlardaki 3 aday türünü incele: <b>Case 1</b> (a < x < b, f′(x) = 0), <b>Case 2</b> (f′(x) yok), <b>Case 3</b> (uç noktalar a, b).`,
      steps,
      solution: `Global ${word}: x* = ${nh(sol.best.x)}, f(x*) = ${nh(sol.best.v)}.`,
    };
  }

  OR.registerDrill({
    id: 'nlp-1var',
    topic: '4.5',
    title: 'Tek değişkenli NLP · Case 1/2/3 adayları',
    description: '[a, b] üzerinde polinom veya parçalı fonksiyon: stationary point\'ler (f″ ile sınıflandır), türevin olmadığı noktalar ve uç noktalar → global max/min.',
    options: [
      {
        key: 'type',
        label: 'Fonksiyon tipi',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık' },
          { value: 'cubic', label: 'Kübik polinom' },
          { value: 'piecewise', label: 'İki parçalı (Örnek 4.16 gibi)' },
          { value: 'abs', label: 'Mutlak değerli |x − c|' },
        ],
      },
      SRC_OPT,
    ],
    solve1,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') return oneVarExercise(notes416());
      const type = opts.type && opts.type !== 'mix' ? opts.type : rng.pick(['cubic', 'piecewise', 'abs']);
      const inst = gen1var(rng, type);
      if (!inst) throw new Error('1-var instance yok');
      return oneVarExercise(inst);
    },
  });

  // ================================================================== 3) HESSIAN CLASSIFY (4.6.1)
  const X = (n, j) => plin(n, Array.from({ length: n }, (_, k) => (k === j ? 1 : 0)));
  /* family F1 (notes Ex. 4.19): A x² + B x²y + C(y + d)² ; F2: s(x³ + Bxy + Cy² + Dx) ; F3: (x−h)³ + (y−g)³ − 3k(x−h)(y−g) */
  function genHess(rng, fam) {
    const x = X(2, 0), y = X(2, 1);
    for (let t = 0; t < 3000; t++) {
      let f, pts;
      if (fam === 'F1') {
        const B = rng.pick([1, -1, 2, -2]);
        const A = B * rng.int(-2, 2);
        const C = rng.pick([1, -1, 2, -2]);
        const d = rng.int(-2, 2);
        if (A === 0) continue;
        // f = A x² + B x² y + C (y + d)²  (+ const)
        f = padd(pscale(pmul(x, x), A), pscale(pmul(pmul(x, x), y), B), pscale(ppow(padd(y, pconst(2, d)), 2, 2), C));
        const y0 = F(-d);
        pts = [[Z, y0]];
        const y1 = F(-A).div(B);
        // fy = B x² + 2C(y + d) = 0 at y1 → x² = −2C(y1 + d)/B
        const x2 = F(-2 * C).mul(y1.add(d)).div(B);
        if (y1.eq(y0)) continue;
        if (x2.gt(0)) {
          const r = Math.round(Math.sqrt(x2.toNumber()));
          if (!F(r * r).eq(x2)) continue;
          pts.push([F(r), y1], [F(-r), y1]);
        } else if (x2.isZero()) continue;
        if (rng.chance(0.3) && pts.length === 1) continue; // prefer 3 points
      } else if (fam === 'F2') {
        const s = rng.pick([1, -1]);
        const r1 = rng.int(-3, 2), r2 = r1 + rng.int(1, 4);
        const C = rng.pick([1, -1, 2, -2, 3, -3]);
        const B2 = 6 * C * (r1 + r2);
        if (B2 <= 0) continue;
        const B = Math.round(Math.sqrt(B2));
        if (B * B !== B2 || B > 9) continue;
        const Bs = rng.pick([B, -B]);
        const D = 3 * r1 * r2;
        f = pscale(padd(ppow(x, 3, 2), pscale(pmul(x, y), Bs), pscale(pmul(y, y), C), pscale(x, D)), s);
        pts = [r1, r2].map((r) => [F(r), F(-Bs * r).div(2 * C)]);
        if (pts.some((p) => p[1].d > 2n)) continue;
      } else {
        const h = rng.int(-2, 2), g = rng.int(-2, 2), k = rng.pick([1, -1, 2, -2]);
        const u = padd(x, pconst(2, -h)), w = padd(y, pconst(2, -g));
        f = padd(ppow(u, 3, 2), ppow(w, 3, 2), pscale(pmul(u, w), -3 * k));
        pts = [[F(h), F(g)], [F(h + k), F(g + k)]];
        if (f.some((tm) => tm.c.abs().gt(30))) continue;
      }
      if (f.some((tm) => tm.c.abs().gt(40))) continue;
      const fx = pdiff(f, 0), fy = pdiff(f, 1);
      const H = [[pdiff(fx, 0), pdiff(fx, 1)], [pdiff(fy, 0), pdiff(fy, 1)]];
      const info = pts.map((p) => {
        const h = H.map((r) => r.map((q) => pev(q, p)));
        const dt = det(h);
        const kind = dt.lt(0) ? 'saddle' : dt.gt(0) ? (h[0][0].gt(0) ? 'min' : 'max') : 'zero';
        return { p, h, det: dt, kind };
      });
      if (info.some((q) => q.kind === 'zero' || q.h[0][0].isZero() && q.kind !== 'saddle')) continue;
      // sanity: gradient vanishes
      if (pts.some((p) => !pev(fx, p).isZero() || !pev(fy, p).isZero())) throw new Error('stationary point bug');
      info.sort((a, b) => a.p[0].cmp(b.p[0]) || a.p[1].cmp(b.p[1]));
      return { f, fx, fy, H, pts: info, fam };
    }
    return null;
  }

  function notes419() {
    const x = X(2, 0), y = X(2, 1);
    const f = padd(pmul(x, x), pscale(pmul(pmul(x, x), y), -1), ppow(padd(y, pconst(2, 1)), 2, 2));
    const fx = pdiff(f, 0), fy = pdiff(f, 1);
    const H = [[pdiff(fx, 0), pdiff(fx, 1)], [pdiff(fy, 0), pdiff(fy, 1)]];
    const pts = [[F(-2), F(1)], [F(0), F(-1)], [F(2), F(1)]].map((p) => {
      const h = H.map((r) => r.map((q) => pev(q, p)));
      const dt = det(h);
      return { p, h, det: dt, kind: dt.lt(0) ? 'saddle' : h[0][0].gt(0) ? 'min' : 'max' };
    });
    return { f, fx, fy, H, pts, fam: 'F1', notes: true };
  }

  const KIND = { min: 'local minimum', max: 'local maximum', saddle: 'saddle point' };

  function gradDistractors(rng, inst) {
    const show = (a, b) => `f<sub>x</sub> = ${pshow(a, XY)}, &nbsp; f<sub>y</sub> = ${pshow(b, XY)}`;
    const good = show(inst.fx, inst.fy);
    const out = [good];
    const mutate = (p) => {
      const q = p.map((t) => ({ c: t.c, e: t.e.slice() }));
      const i = rng.int(0, q.length - 1);
      const m = rng.pick(['neg', 'dbl', 'half', 'drop']);
      if (m === 'neg') q[i].c = q[i].c.neg();
      else if (m === 'dbl') q[i].c = q[i].c.mul(2);
      else if (m === 'half') q[i].c = q[i].c.div(2);
      else if (q.length > 1) q.splice(i, 1);
      return poly(q.map((t) => [t.c, t.e]));
    };
    for (let t = 0; t < 60 && out.length < 4; t++) {
      const which = rng.int(0, 2);
      const a = which !== 1 ? mutate(inst.fx) : inst.fx;
      const b = which !== 0 ? mutate(inst.fy) : inst.fy;
      const s = show(a, b);
      if (!out.includes(s)) out.push(s);
    }
    return out.map((h, i) => ({ html: h, correct: i === 0 }));
  }

  function hessExercise(rng, inst) {
    const { f, fx, fy, H, pts } = inst;
    const steps = [];
    const n = pts.length;
    const Hsym = `H(x, y) = [ ${pshow(H[0][0], XY)} &nbsp; ${pshow(H[0][1], XY)} ; ${pshow(H[1][0], XY)} &nbsp; ${pshow(H[1][1], XY)} ]`;
    const detPoly = padd(pmul(H[0][0], H[1][1]), pscale(pmul(H[0][1], H[1][0]), -1));
    const tbl = (upto) => ({
      type: 'matrix',
      caption: 'Stationary point\'ler ve Hessian testi',
      colLabels: ['(x, y)', 'f<sub>xx</sub>', 'f<sub>xy</sub>', 'f<sub>yy</sub>', 'det H', 'Sonuç'],
      cells: pts.map((q, i) => [`(${nh(q.p[0])}, ${nh(q.p[1])})`].concat(i < upto ? [nh(q.h[0][0]), nh(q.h[0][1]), nh(q.h[1][1]), nh(q.det), KIND[q.kind]] : ['?', '?', '?', '?', '?'])),
      cls: pts.map((q, i) => Array(6).fill(i < upto && q.kind !== 'saddle' ? 'hl' : '')),
    });
    steps.push({
      kind: 'choice',
      prompt: `İlk adım: ∂f/∂x = 0 ve ∂f/∂y = 0. Doğru birinci türevler hangisi?`,
      options: gradDistractors(rng, inst),
      hint: 'Her terimi diğer değişkeni sabit tutarak türevle (ör. ∂(x²y)/∂x = 2xy, ∂(x²y)/∂y = x²).',
      explain: `f<sub>x</sub> = <b>${pshow(fx, XY)}</b>, f<sub>y</sub> = <b>${pshow(fy, XY)}</b>.`,
    });
    let solveTxt;
    if (inst.fam === 'F1') {
      const B = f.find((t) => t.e[0] === 2 && t.e[1] === 1).c;
      const A = (f.find((t) => t.e[0] === 2 && t.e[1] === 0) || { c: Z }).c;
      const y1 = A.neg().div(B);
      const x2 = pev(fy, [Z, y1]).neg().div(B);
      const y0 = pts.find((q) => q.p[0].isZero()).p[1];
      solveTxt = `f<sub>x</sub> = 2x(${pshow(plin(2, [0, B], A), XY)}) = 0 → x = 0 veya y = ${nh(y1)}.<br>x = 0 → f<sub>y</sub> = ${pshow(fy.filter((t) => t.e[0] === 0), XY)} = 0 → y = ${nh(y0)}.<br>y = ${nh(y1)} → f<sub>y</sub> = 0'dan x<sup>2</sup> = ${nh(x2)}${x2.gt(0) ? ` → x = ±${nh(pts[pts.length - 1].p[0])}` : ' < 0 → reel çözüm yok'}.`;
    } else if (inst.fam === 'F2') {
      // y = k x from f_y = 0 (f_y is linear in x, y)
      const cy = fy.find((t) => t.e[1] === 1).c, cx = (fy.find((t) => t.e[0] === 1) || { c: Z }).c;
      const k = cx.neg().div(cy);
      const sub = poly(fx.map((t) => [t.c.mul(Array(t.e[1]).fill(k).reduce((a, b) => a.mul(b), F(1))), [t.e[0] + t.e[1], 0]]));
      solveTxt = `f<sub>y</sub> = ${pshow(fy, XY)} = 0 → y = ${pshow(plin(2, [k, 0]), XY)}.<br>f<sub>x</sub>'e koy: ${pshow(sub, XY)} = 0 → x = ${pts.map((q) => nh(q.p[0])).join(' veya ')}; karşılık gelen y değerleri ${pts.map((q) => nh(q.p[1])).join(', ')}.`;
    } else {
      solveTxt = `u = ${pshow(plin(2, [1, 0], pts[0].p[0].neg()), XY)}, w = ${pshow(plin(2, [0, 1], pts[0].p[1].neg()), XY)} dersen f<sub>x</sub> = 3u² − 3kw, f<sub>y</sub> = 3w² − 3ku (k = ${nh(pts[1].p[0].sub(pts[0].p[0]))}) → w = u²/k, u(u³ − k³) = 0 → u = 0 veya u = k.`;
    }
    steps.push({
      kind: 'number',
      prompt: `∇f = 0 denklem sisteminin kaç tane (reel) çözümü (stationary point) var?`,
      fields: [{ label: 'stationary point sayısı', answer: n }],
      hint: inst.fam === 'F1' ? 'f_x\'i çarpanlarına ayır: iki durum çıkar (notlardaki gibi x = 0 veya y = …).' : 'Bir denklemden bir değişkeni çek, diğerine yerleştir.',
      explain: solveTxt,
    });
    steps.push({
      kind: 'number',
      prompt: `Stationary point'leri yaz (x'e göre artan sırada; x eşitse y'ye göre).`,
      fields: pts.flatMap((q, i) => [
        { label: `${i + 1}. nokta x`, answer: q.p[0] },
        { label: `${i + 1}. nokta y`, answer: q.p[1] },
      ]),
      explain: `Stationary point'ler: ${pts.map((q) => `(${nh(q.p[0])}, ${nh(q.p[1])})`).join(', ')}.`,
      viz: tbl(0),
    });
    steps.push({
      kind: 'info',
      prompt: `İkinci türevler: f<sub>xx</sub> = ${pshow(H[0][0], XY)}, f<sub>yy</sub> = ${pshow(H[1][1], XY)}, f<sub>xy</sub> = f<sub>yx</sub> = ${pshow(H[0][1], XY)}.<br>${Hsym}<br>det H = ${pshow(detPoly, XY)}.<br>Notlardaki test: det H > 0 ve f<sub>xx</sub> > 0 → local min (positive definite); det H > 0 ve f<sub>xx</sub> < 0 → local max (negative definite); det H < 0 → saddle point.`,
      vizDuring: tbl(0),
    });
    pts.forEach((q, i) => {
      const P = `(${nh(q.p[0])}, ${nh(q.p[1])})`;
      steps.push({
        kind: 'number',
        prompt: `${P} noktasında Hessian elemanlarını ve det H'yi hesapla.`,
        fields: [
          { label: 'f<sub>xx</sub>', answer: q.h[0][0] },
          { label: 'f<sub>xy</sub>', answer: q.h[0][1] },
          { label: 'f<sub>yy</sub>', answer: q.h[1][1] },
          { label: 'det H', answer: q.det },
        ],
        explain: `${P}: f<sub>xx</sub> = ${nh(q.h[0][0])}, f<sub>xy</sub> = ${nh(q.h[0][1])}, f<sub>yy</sub> = ${nh(q.h[1][1])} → det H = (${nh(q.h[0][0])})(${nh(q.h[1][1])}) − (${nh(q.h[0][1])})<sup>2</sup> = <b>${nh(q.det)}</b>.`,
        vizDuring: tbl(i),
      });
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `${P} noktası nedir?`,
        options: [
          { html: 'local minimum', correct: q.kind === 'min' },
          { html: 'local maximum', correct: q.kind === 'max' },
          { html: 'saddle point (local extremum değil)', correct: q.kind === 'saddle' },
          { html: 'Test sonuç vermez (det H = 0)', correct: false },
        ],
        explain:
          q.kind === 'saddle'
            ? `det H = ${nh(q.det)} < 0 → H indefinite → <b>saddle point</b>.`
            : `det H = ${nh(q.det)} > 0 ve f<sub>xx</sub> = ${nh(q.h[0][0])} ${q.kind === 'min' ? '> 0 → H positive definite → <b>local minimum</b>' : '< 0 → H negative definite → <b>local maximum</b>'}.`,
        viz: tbl(i + 1),
      });
    });
    return {
      _data: inst,
      title: `Stationary point'ler & Hessian testi${inst.notes ? ' · Örnek 4.19' : ''}`,
      statement: `${inst.notes ? '<b>Notlardaki Örnek 4.19.</b> ' : ''}Aşağıdaki fonksiyonun tüm local maximum, local minimum ve saddle point'lerini bul:<div class="box">f(x, y) = ${pshow(f, XY)}</div>`,
      steps,
      viz: tbl(0),
      solution: pts.map((q) => `(${nh(q.p[0])}, ${nh(q.p[1])}): ${KIND[q.kind]}`).join('; '),
    };
  }

  OR.registerDrill({
    id: 'hessian-classify',
    topic: '4.6',
    title: 'Stationary point\'ler · local max / min / saddle',
    description: 'f(x, y) için ∇f = 0\'ı çöz (1–3 nokta), her noktada Hessian\'ı hesapla ve notlardaki testle local max / local min / saddle point olarak sınıflandır.',
    options: [SRC_OPT],
    genHess,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') return hessExercise(rng, notes419());
      const inst = genHess(rng, rng.pick(['F1', 'F1', 'F2', 'F3']));
      if (!inst) throw new Error('instance yok');
      return hessExercise(rng, inst);
    },
  });

  // shared helpers for the other NLP drill files (they also define their own copies; this is for verification only)
  OR.drills.convexity._poly = { poly, padd, pmul, pscale, pconst, ppow, plin, pdiff, pev, pshow, det, uev, uder, ushow };
})();
