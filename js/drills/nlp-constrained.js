/* Ch.4 NLP · constrained drills (notes 4.7.1 Lagrange multipliers, 4.7.2 KKT).
   Notes' conventions:
     L(x, λ) = f(x) + Σ λ_i [b_i − g_i(x)]  → ∂L/∂x_j = ∂f/∂x_j − Σ λ_i ∂g_i/∂x_j = 0, ∂L/∂λ_i = b_i − g_i(x) = 0
     λ_i* = rate of change of the optimal value per unit increase of b_i (Δz ≈ λΔb)
     KKT: gradient equation Σ ∇g_i λ_i = ∇f, complementary slackness λ_i[b_i − g_i(x)] = 0, sign restrictions
          (max: ≤ → λ ≥ 0, ≥ → λ ≤ 0; min: ≤ → λ ≤ 0, ≥ → λ ≥ 0; = → urs), primal feasibility. Cases enumerated as in
          Example 4.24 (Case 1: all λ = 0, Case 2: λ1 = 0, λ2 ≠ 0, Case 3: λ1 ≠ 0, λ2 = 0, Case 4: both ≠ 0).
   f is a concave (max) / convex (min) quadratic, constraints linear → convex program, so the stationary/KKT point is
   the global optimum. Exact fractions throughout. */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const Z = F(0);

  const mi = (s) => String(s).replace(/-/g, '−');
  const nh = (q) => mi(F(q).html());
  const both = (q) => (F(q).isInt() ? nh(q) : `${nh(q)} ≈ ${mi(F(q).dec(4))}`);
  const coefTxt = (q) => (q.d === 2n ? mi(q.dec(1)) : nh(q));
  const LAM = (i, m) => (m === 1 ? 'λ' : `λ<sub>${i + 1}</sub>`);

  function poly(terms) {
    const mp = new Map();
    for (const [c, e] of terms) {
      const k = e.join(',');
      const cur = mp.get(k);
      mp.set(k, { c: (cur ? cur.c : Z).add(F(c)), e: e.slice() });
    }
    return [...mp.values()].filter((t) => !t.c.isZero());
  }
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
      out += idx === 0 ? (neg ? '−' : '') + cs + mono : (neg ? ' − ' : ' + ') + cs + mono;
    });
    return out;
  }
  const quadPoly = (H, c, c0) => {
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
      const e1 = Array(n).fill(0);
      e1[i] = 1;
      terms.push([c[i], e1]);
    }
    terms.push([c0, Array(n).fill(0)]);
    return poly(terms);
  };
  const linPoly = (a) => poly(a.map((v, j) => [v, a.map((_, k) => (k === j ? 1 : 0))]));
  const dot = (u, v) => u.reduce((s, q, i) => s.add(F(q).mul(v[i])), Z);

  // Gaussian elimination over Frac. Returns {status:'unique'|'none'|'many', x}
  function solve(A, b) {
    const n = A[0].length;
    const M = A.map((r, i) => r.map((v) => F(v)).concat([F(b[i])]));
    const rows = M.length;
    let r = 0;
    const piv = [];
    for (let c = 0; c < n && r < rows; c++) {
      let p = -1;
      for (let i = r; i < rows; i++) if (!M[i][c].isZero()) {
        p = i;
        break;
      }
      if (p < 0) continue;
      [M[r], M[p]] = [M[p], M[r]];
      const pv = M[r][c];
      M[r] = M[r].map((v) => v.div(pv));
      for (let i = 0; i < rows; i++) if (i !== r && !M[i][c].isZero()) {
        const f = M[i][c];
        M[i] = M[i].map((v, k) => v.sub(f.mul(M[r][k])));
      }
      piv.push(c);
      r++;
    }
    for (let i = r; i < rows; i++) if (!M[i][n].isZero()) return { status: 'none' };
    if (r < n) return { status: 'many' };
    const x = Array(n).fill(Z);
    piv.forEach((c, i) => (x[c] = M[i][n]));
    return { status: 'unique', x };
  }
  const det = (M) => {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0].mul(M[1][1]).sub(M[0][1].mul(M[1][0]));
    let s = Z;
    for (let j = 0; j < n; j++) {
      const sub = M.slice(1).map((r) => r.filter((_, k) => k !== j));
      const t = M[0][j].mul(det(sub));
      s = j % 2 ? s.sub(t) : s.add(t);
    }
    return s;
  };
  // definiteness via principal minors (as in the notes)
  function pms(H) {
    const n = H.length;
    const out = [];
    for (let k = 1; k <= n; k++) {
      const lvl = [];
      (function rec(st, cur) {
        if (cur.length === k) return lvl.push(det(cur.map((i) => cur.map((j) => H[i][j]))));
        for (let i = st; i < n; i++) rec(i + 1, cur.concat([i]));
      })(0, []);
      out.push(lvl);
    }
    return out;
  }
  const isND = (H) => pms(H).every((lvl, k) => lvl.every((v) => (k % 2 === 0 ? v.lt(0) : v.gt(0))));
  const isNSD = (H) => pms(H).every((lvl, k) => lvl.every((v) => v.isZero() || (k % 2 === 0 ? v.lt(0) : v.gt(0))));
  const isPD = (H) => pms(H).every((lvl) => lvl.every((v) => v.gt(0)));
  const isPSD = (H) => pms(H).every((lvl) => lvl.every((v) => v.ge(0)));
  const pmText = (H) =>
    pms(H)
      .map((lvl, k) => `${k + 1}. principal minor${lvl.length > 1 ? "'lar" : ''}: ${lvl.map(nh).join(', ')}`)
      .join('; ');

  function randH(rng, n, sense) {
    const s = sense === 'max' ? -1 : 1;
    for (let t = 0; t < 200; t++) {
      const H = Array.from({ length: n }, () => Array(n).fill(Z));
      for (let i = 0; i < n; i++) {
        H[i][i] = F(s * 2 * rng.int(1, 3));
        for (let j = i + 1; j < n; j++) H[i][j] = H[j][i] = F(rng.chance(n === 3 ? 0.4 : 0.6) ? rng.int(-2, 2) : 0);
      }
      if (sense === 'max' ? isND(H) : isPD(H)) return H;
    }
    return null;
  }
  const smallDen = (q, D) => F(q).d <= BigInt(D);
  const NAMES = (n) => Array.from({ length: n }, (_, i) => `x<sub>${i + 1}</sub>`);
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

  // ∂L/∂x_j expression text: ∂f/∂x_j − Σ λ_i a_ij  (flip = true → wrong sign, used as distractor)
  function gradEqTxt(f, A, j, names, flip, dropI) {
    let s = pshow(pdiff(f, j), names);
    A.forEach((a, i) => {
      if (i === dropI) return;
      const c = F(a[j]).mul(flip ? -1 : 1);
      if (c.isZero()) return;
      const neg = c.gt(0); // term is −c·λ
      s += `${neg ? ' − ' : ' + '}${c.abs().eq(1) ? '' : nh(c.abs())}${LAM(i, A.length)}`;
    });
    return s + ' = 0';
  }

  // ================================================================== LAGRANGE (4.7.1)
  function lagrangeSolve(H, c, A, b) {
    const n = H.length, m = A.length;
    const rows = [];
    const rhs = [];
    for (let j = 0; j < n; j++) {
      rows.push(H[j].concat(A.map((a) => F(a[j]).neg())));
      rhs.push(F(c[j]).neg());
    }
    for (let i = 0; i < m; i++) {
      rows.push(A[i].map((v) => F(v)).concat(Array(m).fill(Z)));
      rhs.push(F(b[i]));
    }
    const r = solve(rows, rhs);
    if (r.status !== 'unique') return null;
    return { x: r.x.slice(0, n), lam: r.x.slice(n) };
  }

  function genLagrange(rng, n, m) {
    for (let t = 0; t < 5000; t++) {
      const sense = rng.pick(['max', 'min']);
      const H = randH(rng, n, sense);
      if (!H) continue;
      const c = Array.from({ length: n }, () => F(rng.int(-4, 12) * (sense === 'max' ? 1 : -1)));
      const A = Array.from({ length: m }, () => Array.from({ length: n }, () => F(rng.int(m === 2 ? 0 : 1, 4))));
      if (A.some((a) => a.filter((v) => !v.isZero()).length < 2)) continue;
      const b = A.map(() => F(rng.int(4, 16)));
      const sol = lagrangeSolve(H, c, A, b);
      if (!sol) continue;
      if (sol.x.some((q) => !smallDen(q, 12) || q.le(0) || q.gt(15))) continue;
      if (sol.lam.some((q) => q.isZero() || !smallDen(q, 12) || q.abs().gt(20))) continue;
      const f = quadPoly(H, c, F(0));
      const z = pev(f, sol.x);
      if (!smallDen(z, 200)) continue;
      return { n, m, sense, H, c, A, b, f, sol, z, names: NAMES(n) };
    }
    return null;
  }

  function lagrangeNotes() {
    const H = [[F(-4), F(1)], [F(1), F(-2)]];
    const c = [F(8), F(3)];
    const A = [[F(3), F(1)]];
    const b = [F(10)];
    const f = quadPoly(H, c, F(0));
    const sol = lagrangeSolve(H, c, A, b);
    return { n: 2, m: 1, sense: 'max', H, c, A, b, f, sol, z: pev(f, sol.x), names: ['x', 'y'], notes: true };
  }

  function lagrangeExercise(rng, inst) {
    const { n, m, sense, H, A, b, f, sol, z, names } = inst;
    const g = A.map((a) => linPoly(a));
    const gTxt = (i) => pshow(g[i], names);
    const steps = [];
    const Ltxt = `L(${names.join(', ')}, ${A.map((_, i) => LAM(i, m)).join(', ')}) = ${pshow(f, names)} ${A.map((_, i) => `+ ${LAM(i, m)}(${nh(b[i])} − ${gTxt(i).includes(' ') ? `(${gTxt(i)})` : gTxt(i)})`).join(' ')}`;
    steps.push({
      kind: 'info',
      prompt: `Notlardaki tanım: <b>L(x, λ) = f(x) + Σ λ<sub>i</sub>[b<sub>i</sub> − g<sub>i</sub>(x)]</b>.<br>${Ltxt}<br>Stationary point için ${names.map((nm) => `L<sub>${nm}</sub>`).join(' = ')} = ${A.map((_, i) => `L<sub>${LAM(i, m)}</sub>`).join(' = ')} = 0.`,
    });
    // choice: ∂L/∂x_1 = 0
    const j0 = 0;
    const good = gradEqTxt(f, A, j0, names, false);
    const opts = [good];
    const cand = [gradEqTxt(f, A, j0, names, true)];
    // derivative mistakes: forget factor 2 on the square term / drop the cross term
    const fx = pdiff(f, j0);
    const half = poly(fx.map((t) => [t.e[j0] === 1 ? t.c.div(2) : t.c, t.e]));
    const noCross = poly(fx.filter((t) => !t.e.some((e, k) => k !== j0 && e > 0)).map((t) => [t.c, t.e]));
    const withPd = (pd, flip) => {
      let s = pshow(pd, names);
      A.forEach((a, i) => {
        const cc = F(a[j0]).mul(flip ? -1 : 1);
        if (cc.isZero()) return;
        s += `${cc.gt(0) ? ' − ' : ' + '}${cc.abs().eq(1) ? '' : nh(cc.abs())}${LAM(i, m)}`;
      });
      return s + ' = 0';
    };
    cand.push(withPd(half, false), withPd(noCross, false), withPd(half, true), withPd(noCross, true));
    if (m === 2) cand.push(gradEqTxt(f, A, j0, names, false, 1));
    for (const s of rng.shuffle(cand)) if (!opts.includes(s) && opts.length < 4) opts.push(s);
    steps.push({
      kind: 'choice',
      prompt: `∂L/∂${names[j0]} = 0 denklemi hangisi?`,
      options: opts.map((h, i) => ({ html: h, correct: i === 0 })),
      hint: '∂L/∂x_j = ∂f/∂x_j − Σ λ_i ∂g_i/∂x_j (λ(b − g) teriminin türevi −λ·∂g/∂x_j).',
      explain: `${names.map((_, j) => `L<sub>${names[j]}</sub>: ${gradEqTxt(f, A, j, names, false)}`).join('<br>')}<br>${A.map((_, i) => `L<sub>${LAM(i, m)}</sub>: ${nh(b[i])} − (${gTxt(i)}) = 0 (kısıtın kendisi)`).join('<br>')}`,
    });
    // linear system viz
    const sysViz = {
      type: 'matrix',
      caption: 'Stationary point denklem sistemi (doğrusal)',
      colLabels: names.concat(A.map((_, i) => LAM(i, m)), ['= sağ taraf']),
      rowLabels: names.map((nm) => `L<sub>${nm}</sub>`).concat(A.map((_, i) => `L<sub>${LAM(i, m)}</sub>`)),
      cells: names
        .map((_, j) => H[j].map(nh).concat(A.map((a) => nh(F(a[j]).neg())), [nh(F(inst.c[j]).neg())]))
        .concat(A.map((a, i) => a.map(nh).concat(A.map(() => '0'), [nh(b[i])]))),
    };
    let elim = '';
    if (inst.notes)
      elim = `Notlardaki gibi: −4x + y + 8 − 3λ = 0 → y = 3λ − 8 + 4x; −2y + x + 3 − λ = 0 → x = λ − 3 + 2y; yerine koyunca y = 20/7 − λ, x = 19/7 − λ; kısıttan 10 − 3(19/7 − λ) − (20/7 − λ) = 0 → λ = 1/4.<br>`;
    steps.push({
      kind: 'number',
      prompt: `Denklem sistemini çöz: stationary point (x̄, λ̄) nedir?`,
      fields: sol.x.map((q, j) => ({ label: names[j], answer: q })).concat(sol.lam.map((q, i) => ({ label: LAM(i, m), answer: q }))),
      hint: n === 2 && m === 1 ? 'İlk iki denklemden x ve y\'yi λ cinsinden yaz, kısıtta yerine koy (notlardaki gibi).' : 'Doğrusal sistem: yok etme (elimination) yöntemi ile çöz.',
      explain: `${elim}Çözüm: ${sol.x.map((q, j) => `${names[j]} = <b>${both(q)}</b>`).join(', ')}; ${sol.lam.map((q, i) => `${LAM(i, m)} = <b>${both(q)}</b>`).join(', ')}.`,
      vizDuring: sysViz,
      viz: sysViz,
    });
    steps.push({
      kind: 'number',
      prompt: `Amaç fonksiyonunun bu noktadaki değeri z = f(x̄) nedir?`,
      fields: [{ label: 'z', answer: z }],
      explain: `z = f(${sol.x.map(nh).join(', ')}) = <b>${both(z)}</b>${inst.notes ? ' (notlarda z = 15.017857 → $15,017.86 gelir)' : ''}.`,
    });
    const conc = sense === 'max';
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Bulunan nokta problemin ${sense === 'max' ? 'global maksimumu' : 'global minimumu'} mu?`,
      options: [
        { html: `Evet: H'ye göre f ${conc ? 'concave' : 'convex'} ve kısıt${m > 1 ? 'lar' : ''} linear → Lagrange stationary point'i optimumdur`, correct: true },
        { html: `Hayır: Lagrange yöntemi yalnızca stationary point verir, optimallik hiçbir zaman söylenemez`, correct: false },
        { html: `Evet, çünkü λ ${sol.lam[0].gt(0) ? '> 0' : '< 0'}`, correct: false },
        { html: `Belirlenemez: H indefinite`, correct: false },
      ],
      hint: 'Hessian\'ın principal minor\'larını incele (notlarda Örnek 4.23\'teki gibi).',
      explain: `H = [${H.map((r) => r.map(nh).join(', ')).join(' ; ')}]; ${pmText(H)} → H ${conc ? 'negative' : 'positive'} definite → f ${conc ? 'concave' : 'convex'}. Kısıt${m > 1 ? 'lar' : ''} linear → x̄ = (${sol.x.map(nh).join(', ')}) <b>global ${conc ? 'maximum' : 'minimum'}</b>.`,
    });
    // interpretation of λ
    const i0 = 0;
    const delta = rng.pick([F(1), F(1), F('1/2'), F(2), F(-1)]);
    const nb = b.map((v, i) => (i === i0 ? v.add(delta) : v));
    const nsol = lagrangeSolve(H, inst.c, A, nb);
    const nz = pev(f, nsol.x);
    const approx = sol.lam[i0].mul(delta);
    steps.push({
      kind: 'number',
      prompt: `${m > 1 ? '1. kısıtın' : 'Kısıtın'} sağ tarafı b${m > 1 ? '<sub>1</sub>' : ''} = ${nh(b[i0])} değerinden ${nh(b[i0].add(delta))} değerine ${delta.gt(0) ? 'çıkarsa' : 'inerse'} (Δ = ${nh(delta)}), Lagrange çarpanı yorumuna göre optimal z yaklaşık ne kadar değişir (Δz)?`,
      fields: [{ label: 'Δz (yaklaşık)', answer: approx }],
      hint: `λ<sub>i</sub>* = b<sub>i</sub>'deki birim artışın optimal değerde yarattığı değişim oranı → Δz ≈ λ·Δ.`,
      explain: `Δz ≈ ${LAM(i0, m)}·Δ = ${nh(sol.lam[i0])}·(${nh(delta)}) = <b>${both(approx)}</b> → z ≈ ${both(z.add(approx))}. (Kontrol: problemi b${m > 1 ? '<sub>1</sub>' : ''} = ${nh(nb[i0])} ile yeniden çözünce gerçek değer z = ${both(nz)}; fark ikinci mertebe etkidir.)${inst.notes ? ' Örnekte: bütçe $1000 artarsa gelir ≈ $250 artar.' : ''}`,
    });
    const statement = `${inst.notes ? '<b>Notlardaki Örnek 4.23</b> (reklam bütçesi: x = TV dakikası, y = radyo dakikası, gelir bin $). ' : ''}Lagrange multiplier yöntemiyle çöz:<div class="box"><b>${sense}</b> z = ${pshow(f, names)}<br>s.t. ${A.map((_, i) => `${gTxt(i)} = ${nh(b[i])}`).join('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')}</div>Cevaplar kesir olarak girilebilir (ör. 69/28).`;
    return {
      title: `Lagrange multipliers · ${n} değişken, ${m} kısıt${inst.notes ? ' · Örnek 4.23' : ''}`,
      statement,
      steps,
      solution: `x̄ = (${sol.x.map(nh).join(', ')}), λ = (${sol.lam.map(nh).join(', ')}), z = ${both(z)}.`,
    };
  }

  OR.registerDrill({
    id: 'lagrange',
    topic: '4.7.1',
    title: 'Lagrange multipliers (eşitlik kısıtlı NLP)',
    description: 'L = f + λ(b − g) kur, ∂L/∂x = ∂L/∂λ = 0 sistemini çöz, Hessian ile optimalliği doğrula, λ\'yı yorumla (Δz ≈ λΔb).',
    options: [
      {
        key: 'size',
        label: 'Boyut',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık' },
          { value: '2-1', label: '2 değişken, 1 kısıt' },
          { value: '3-1', label: '3 değişken, 1 kısıt' },
          { value: '3-2', label: '3 değişken, 2 kısıt' },
        ],
      },
      SRC_OPT,
    ],
    lagrangeSolve,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') {
        const inst = lagrangeNotes();
        return Object.assign(lagrangeExercise(rng, inst), { _data: inst });
      }
      const size = opts.size && opts.size !== 'mix' ? opts.size : rng.pick(['2-1', '2-1', '3-1', '3-2']);
      const [n, m] = size.split('-').map(Number);
      const inst = genLagrange(rng, n, m);
      if (!inst) throw new Error('lagrange instance yok');
      return Object.assign(lagrangeExercise(rng, inst), { _data: inst });
    },
  });

  // ================================================================== KKT (4.7.2)
  const signReq = (sense, type) => (type === '=' ? 0 : (sense === 'max') === (type === '≤') ? 1 : -1); // +1: λ ≥ 0, −1: λ ≤ 0
  const signTxt = (s, lam) => (s === 0 ? `${lam} urs` : s > 0 ? `${lam} ≥ 0` : `${lam} ≤ 0`);

  /* Solve all complementary-slackness cases. P = {sense, H (n×n), c, c0, A (m×n), b, types}.
     Case order as in the notes: subsets of active constraints [], [m], …, [1..m] (binary counting from the last). */
  function kktCases(P) {
    const n = P.H.length, m = P.A.length;
    const cases = [];
    for (let mask = 0; mask < 1 << m; mask++) {
      // notes' order (m = 2): Case1 {} , Case2 {2}, Case3 {1}, Case4 {1,2}
      const act = [];
      for (let i = 0; i < m; i++) if (mask & (1 << (m - 1 - i))) act.push(i);
      const rows = [], rhs = [];
      for (let j = 0; j < n; j++) {
        rows.push(P.H[j].concat(act.map((i) => F(P.A[i][j]).neg())));
        rhs.push(F(P.c[j]).neg());
      }
      act.forEach((i) => {
        rows.push(P.A[i].map((v) => F(v)).concat(act.map(() => Z)));
        rhs.push(F(P.b[i]));
      });
      const r = solve(rows, rhs);
      const cs = { act, status: r.status };
      if (r.status === 'unique') {
        cs.x = r.x.slice(0, n);
        cs.lam = Array(m).fill(Z);
        act.forEach((i, k) => (cs.lam[i] = r.x[n + k]));
        cs.signViol = act.filter((i) => {
          const s = signReq(P.sense, P.types[i]);
          return (s > 0 && cs.lam[i].lt(0)) || (s < 0 && cs.lam[i].gt(0));
        });
        cs.primViol = [];
        for (let i = 0; i < m; i++) {
          if (act.includes(i)) continue;
          const gv = dot(P.A[i], cs.x);
          if ((P.types[i] === '≤' && gv.gt(P.b[i])) || (P.types[i] === '≥' && gv.lt(P.b[i]))) cs.primViol.push(i);
        }
        cs.kkt = !cs.signViol.length && !cs.primViol.length;
        cs.degenerate = act.some((i) => cs.lam[i].isZero()) || [...Array(m).keys()].some((i) => !act.includes(i) && dot(P.A[i], cs.x).eq(P.b[i]));
      }
      cases.push(cs);
    }
    return cases;
  }

  function genKKT(rng, m) {
    for (let t = 0; t < 6000; t++) {
      const n = 2;
      const sense = rng.pick(['max', 'min']);
      const H = randH(rng, n, sense);
      if (!H) continue;
      const xs = [F(rng.int(0, 8)), F(rng.int(0, 8))]; // unconstrained optimum
      const c = H.map((r) => dot(r, xs).neg());
      if (c.some((q) => !q.isInt())) continue;
      const A = [], b = [], types = [];
      for (let i = 0; i < m; i++) {
        const a = [F(rng.int(-1, 3)), F(rng.int(-1, 3))];
        if (a.every((v) => v.le(0))) break;
        A.push(a);
        b.push(F(rng.int(2, 12)));
        types.push(rng.chance(0.7) ? '≤' : '≥');
      }
      if (A.length !== m) continue;
      if (A.some((a) => a.filter((v) => !v.isZero()).length < 1)) continue;
      if (m === 2 && det([A[0], A[1]]).isZero()) continue;
      const c0 = F(0);
      const P = { sense, H, c, c0, A, b, types, n, m, names: NAMES(n) };
      const cases = kktCases(P);
      if (cases.some((cs) => cs.status !== 'unique' || cs.degenerate)) continue;
      const kk = cases.filter((cs) => cs.kkt);
      if (kk.length !== 1) continue;
      const K = kk[0];
      if (!K.act.length && rng.chance(0.85)) continue; // usually a binding constraint
      if (K.x.some((q) => !smallDen(q, 12)) || K.lam.some((q) => !smallDen(q, 12))) continue;
      if (cases.some((cs) => cs.x.some((q) => !smallDen(q, 24)) || cs.lam.some((q) => !smallDen(q, 24)))) continue;
      if (K.x.some((q) => q.abs().gt(15)) || K.lam.some((q) => q.abs().gt(30))) continue;
      const f = quadPoly(H, c, c0);
      return Object.assign(P, { cases, K, f, z: pev(f, K.x), xs });
    }
    return null;
  }

  function kktNotes() {
    // max z = x1(30 − x1) + x2(50 − 2x2) − 3x1 − 5x2 − 10x3 ; x1 + x2 − x3 ≤ 0 ; x3 ≤ 20
    const H = [[F(-2), Z, Z], [Z, F(-4), Z], [Z, Z, Z]];
    const c = [F(27), F(45), F(-10)];
    const A = [[F(1), F(1), F(-1)], [Z, Z, F(1)]];
    const P = { sense: 'max', H, c, c0: Z, A, b: [Z, F(20)], types: ['≤', '≤'], n: 3, m: 2, names: NAMES(3), notes: true };
    const cases = kktCases(P);
    const K = cases.find((cs) => cs.kkt);
    const f = quadPoly(H, c, Z);
    return Object.assign(P, { cases, K, f, z: pev(f, K.x) });
  }

  function kktExercise(rng, P) {
    const { sense, A, b, types, n, m, names, f, cases, K, H } = P;
    const g = A.map((a) => linPoly(a));
    const gTxt = (i) => pshow(g[i], names);
    const lam = (i) => LAM(i, m);
    const steps = [];
    const caseName = (cs, k) => `Case ${k + 1}: ${[...Array(m).keys()].map((i) => (cs.act.includes(i) ? `${lam(i)} ≠ 0` : `${lam(i)} = 0`)).join(', ')}`;
    const caseRes = (cs) => {
      if (cs.status === 'none') {
        const j = names.findIndex((_, jj) => pdiff(f, jj).every((t) => t.e.every((e) => e === 0)) && cs.act.every((i) => F(A[i][jj]).isZero()));
        return j >= 0
          ? `${names[j]} için gradient equation: ${gradEqTxt(f, A, j, names, false)}; bu case'de ${[...Array(m).keys()].filter((i) => !cs.act.includes(i)).map((i) => `${lam(i)} = 0`).join(', ')} → ${pshow(pdiff(f, j), names)} = 0 olur: <b>çelişki</b> (çözüm yok).`
          : 'Denklem sistemi çelişkili → çözüm yok.';
      }
      const v = `x = (${cs.x.map(nh).join(', ')})${m ? `, ${[...Array(m).keys()].map((i) => `${lam(i)} = ${nh(cs.lam[i])}`).join(', ')}` : ''}`;
      const bad = cs.signViol.map((i) => `${lam(i)} = ${nh(cs.lam[i])} sign restriction'ı (${signTxt(signReq(sense, types[i]), lam(i))}) ihlal eder`).concat(cs.primViol.map((i) => `${i + 1}. kısıt ihlal: ${gTxt(i)} = ${nh(dot(A[i], cs.x))} ${types[i] === '≤' ? '>' : '<'} ${nh(b[i])}`));
      return `${v}${bad.length ? ' → ' + bad.join('; ') : ' → tüm KKT koşulları sağlanır ✓'}`;
    };
    const tbl = (upto) => ({
      type: 'matrix',
      caption: 'Complementary slackness case\'leri',
      colLabels: ['Case', 'Varsayım', 'Sonuç'],
      cells: cases.map((cs, k) => [String(k + 1), caseName(cs, k).split(': ')[1], k < upto ? (cs.status === 'none' ? 'çelişki ✗' : cs.kkt ? 'KKT noktası ✓' : cs.signViol.length ? 'sign ihlali ✗' : 'primal ihlali ✗') : '?']),
      cls: cases.map((cs, k) => (k < upto && cs.kkt ? ['hl', 'hl', 'hl'] : k < upto ? ['dim', 'dim', 'dim'] : ['', '', ''])),
    });
    // 1) sign restrictions
    const req = types.map((ty) => signReq(sense, ty));
    let signOpts;
    if (m === 1) signOpts = [1, -1, 0].map((s) => ({ html: signTxt(s, lam(0)), correct: s === req[0] }));
    else {
      const combos = [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]];
      signOpts = combos.map((cb) => ({ html: cb.map((s, i) => signTxt(s, lam(i))).join(', &nbsp; '), correct: cb[0] === req[0] && cb[1] === req[1] }));
    }
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Lagrange çarpanlarının <b>sign restriction</b>'ları nedir? (${sense} problemi; ${types.map((ty, i) => `${i + 1}. kısıt "${ty}"`).join(', ')})`,
      options: signOpts,
      hint: 'Notlardaki tablo: Minimize → ≤: λ ≤ 0, ≥: λ ≥ 0; Maximize → ≤: λ ≥ 0, ≥: λ ≤ 0; = → urs.',
      explain: types.map((ty, i) => `${sense === 'max' ? 'Maximize' : 'Minimize'} + "${ty}" kısıt → <b>${signTxt(req[i], lam(i))}</b>`).join('<br>'),
    });
    // 2) gradient equation for x1
    const good = gradEqTxt(f, A, 0, names, false);
    const cand = [gradEqTxt(f, A, 0, names, true)];
    if (m === 2) cand.push(gradEqTxt(f, A, 0, names, false, 1), gradEqTxt(f, A, 0, names, false, 0), gradEqTxt(f, A, 0, names, true, 1));
    const fx = pdiff(f, 0);
    const half = poly(fx.map((t) => [t.e[0] === 1 ? t.c.div(2) : t.c, t.e]));
    let s2 = pshow(half, names);
    A.forEach((a, i) => {
      const cc = F(a[0]);
      if (!cc.isZero()) s2 += `${cc.gt(0) ? ' − ' : ' + '}${cc.abs().eq(1) ? '' : nh(cc.abs())}${lam(i)}`;
    });
    cand.push(s2 + ' = 0');
    const opts = [good];
    for (const s of rng.shuffle(cand)) if (!opts.includes(s) && opts.length < 4) opts.push(s);
    steps.push({
      kind: 'choice',
      prompt: `<b>Gradient equation</b> (Σ<sub>i</sub> ∇g<sub>i</sub>(x)λ<sub>i</sub> = ∇f(x)) — x<sub>1</sub> bileşeni hangisi?`,
      options: opts.map((h, i) => ({ html: h, correct: i === 0 })),
      hint: '∂f/∂x_j − Σ λ_i ∂g_i/∂x_j = 0 (notlarda Örnek 4.24: 30 − 2x₁ − 3 − λ₁ = 0).',
      explain: names.map((_, j) => gradEqTxt(f, A, j, names, false)).join('<br>'),
    });
    // 3) complementary slackness
    const par = (i) => (gTxt(i).includes(' ') ? `(${gTxt(i)})` : gTxt(i));
    const csGood = A.map((_, i) => `${lam(i)}[${nh(b[i])} − ${par(i)}] = 0`).join(', &nbsp; ');
    steps.push({
      kind: 'choice',
      prompt: `<b>Complementary slackness</b> koşulları hangisi?`,
      options: [
        { html: csGood, correct: true },
        { html: A.map((_, i) => `${lam(i)} + [${nh(b[i])} − ${par(i)}] = 0`).join(', &nbsp; '), correct: false },
        { html: A.map((_, i) => `${lam(i)} = 0`).join(', &nbsp; ') + ' (her zaman)', correct: false },
        { html: A.map((_, i) => `${gTxt(i)} = ${nh(b[i])}`).join(', &nbsp; ') + ' (tüm kısıtlar her zaman aktif)', correct: false },
      ],
      explain: `λ<sub>i</sub>[b<sub>i</sub> − g<sub>i</sub>(x)] = 0: ya kısıt aktif (binding) ya da çarpanı 0. → ${csGood}. Bu yüzden ${1 << m} case incelenir.`,
    });
    // 4) cases
    cases.forEach((cs, k) => {
      const optsC = [
        { html: 'Tüm koşullar sağlanır → <b>KKT noktası</b>', correct: cs.status === 'unique' && cs.kkt },
        { html: 'Sign restriction ihlal edilir', correct: cs.status === 'unique' && cs.signViol.length > 0 },
        { html: 'Primal kısıt ihlal edilir', correct: cs.status === 'unique' && cs.primViol.length > 0 },
        { html: 'Çözüm yok (gradient denklemleri çelişkili)', correct: cs.status === 'none' },
      ];
      const actTxt = cs.act.length ? `aktif kısıt(lar): ${cs.act.map((i) => `${gTxt(i)} = ${nh(b[i])}`).join(', ')}` : 'hiçbir kısıt aktif varsayılmaz (gradient equation λ\'sız)';
      let note = '';
      if (P.notes && k === 1) note = ' <span class="muted">(Notlar yalnızca λ<sub>2</sub> = −10 ihlalini yazıyor; bu noktada 1. kısıt da ihlal ediliyor.)</span>';
      if (P.notes && k === 3) note = ' <span class="muted">(Notlar: "no need to consider" — Case 3 zaten KKT noktası verdi.)</span>';
      steps.push({
        kind: 'multi',
        keepOrder: true,
        prompt: `<b>${caseName(cs, k)}</b> (${actTxt}). Bu case'i çöz: ne olur? (Birden fazla seçenek doğru olabilir.)`,
        options: optsC,
        hint: `${[...Array(m).keys()].filter((i) => !cs.act.includes(i)).map((i) => `${lam(i)} = 0 koy`).join(', ')}${cs.act.length ? `${m - cs.act.length ? '; ' : ''}aktif kısıtları eşitlik olarak al` : ''}; gradient equation'larıyla birlikte çöz, sonra işaretleri ve diğer kısıtları kontrol et.`,
        explain: caseRes(cs) + note,
        vizDuring: tbl(k),
        viz: tbl(k + 1),
      });
    });
    // 5) KKT point
    steps.push({
      kind: 'number',
      prompt: `KKT noktasını ve çarpanlarını yaz; amaç değeri z nedir?`,
      fields: K.x.map((q, j) => ({ label: names[j], answer: q })).concat(K.lam.map((q, i) => ({ label: lam(i), answer: q })), [{ label: 'z', answer: P.z }]),
      explain: `KKT noktası: ${K.x.map((q, j) => `${names[j]} = ${both(q)}`).join(', ')}; ${K.lam.map((q, i) => `${lam(i)} = ${both(q)}`).join(', ')}; z = <b>${both(P.z)}</b>.`,
    });
    // 6) optimality
    const concave = sense === 'max';
    const strict = concave ? isND(H) : isPD(H);
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Bu KKT noktası optimal mi?`,
      options: [
        { html: `Evet: problem bir <b>convex program</b> (f ${concave ? 'concave (max)' : 'convex (min)'}, kısıtlar linear) → KKT noktası global optimum`, correct: true },
        { html: 'Hayır: KKT koşulları yalnızca gereklidir, yeterli olamaz', correct: false },
        { html: 'Yalnızca local optimum olduğu söylenebilir', correct: false },
        { html: `Sadece tüm λ'lar 0 olsaydı optimal olurdu`, correct: false },
      ],
      explain: `H = [${H.map((r) => r.map(nh).join(', ')).join(' ; ')}]; ${pmText(H)} → H ${concave ? 'negative' : 'positive'} ${strict ? 'definite' : 'semidefinite'} → f ${concave ? 'concave' : 'convex'}. Tüm kısıtlar linear → <b>convex program</b> → "If x is a KKT point of a convex program, x is a global optimum." Kısıtlar linear olduğundan KKT koşulları ayrıca gereklidir de.`,
      viz: tbl(cases.length),
    });
    const consTxt = A.map((_, i) => `${gTxt(i)} ${types[i]} ${nh(b[i])}`).join('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    return {
      title: `KKT optimality conditions · ${m} kısıt${P.notes ? ' · Örnek 4.24' : ''}`,
      statement: `${P.notes ? '<b>Notlardaki Örnek 4.24</b> (x<sub>1</sub>, x<sub>2</sub> = ürün 1, 2 miktarı; x<sub>3</sub> = işlenen kimyasal; z = x<sub>1</sub>(30 − x<sub>1</sub>) + x<sub>2</sub>(50 − 2x<sub>2</sub>) − 3x<sub>1</sub> − 5x<sub>2</sub> − 10x<sub>3</sub>). ' : ''}KKT koşullarıyla çöz:<div class="box"><b>${sense}</b> z = ${pshow(f, names)}<br>s.t. ${consTxt}</div>${P.notes ? '' : 'Değişkenler işaretsiz (ayrıca x ≥ 0 kısıtı yok). '}Notlardaki gösterim: g<sub>i</sub>(x) ${types.includes('≥') ? '≤ / ≥' : '≤'} b<sub>i</sub>, L = f + Σλ<sub>i</sub>[b<sub>i</sub> − g<sub>i</sub>(x)].`,
      viz: tbl(0),
      steps,
      solution: `KKT noktası x = (${K.x.map(nh).join(', ')}), λ = (${K.lam.map(nh).join(', ')}), z = ${both(P.z)} (convex program → global optimum).`,
    };
  }

  OR.registerDrill({
    id: 'kkt',
    topic: '4.7.2',
    title: 'KKT koşulları · case analizi',
    description: '1–2 eşitsizlik kısıtlı NLP: sign restriction, gradient equation, complementary slackness; tüm case\'leri çöz, KKT noktasını bul ve convex program argümanıyla optimalliğe karar ver.',
    options: [
      {
        key: 'm',
        label: 'Kısıt sayısı',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık' },
          { value: '1', label: '1 kısıt (2 case)' },
          { value: '2', label: '2 kısıt (4 case)' },
        ],
      },
      SRC_OPT,
    ],
    kktCases,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') {
        const P = kktNotes();
        return Object.assign(kktExercise(rng, P), { _data: P });
      }
      const m = opts.m && opts.m !== 'mix' ? +opts.m : rng.pick([1, 2, 2]);
      const P = genKKT(rng, m);
      if (!P) throw new Error('KKT instance yok');
      return Object.assign(kktExercise(rng, P), { _data: P });
    },
  });
})();
