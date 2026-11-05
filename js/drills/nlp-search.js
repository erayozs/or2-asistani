/* Ch.4 NLP · numerical search drills (notes 4.5.2, 4.6.2, 4.6.3).
   - 'golden-section'  (4.5) : GSS exactly as Example 4.17 — r = 0.618, x_L = b − r(b − a), x_R = a + r(b − a), 4-decimal
                               rounding at every step, the kept point is re-used, k from L0·0.618^k < ε.
   - 'gradient-search' (4.6) : steepest ascent (max) / descent (min) on a quadratic (Example 4.21): ∇f(v), line search
                               f(v + t·d) → t*, new point; exact fractions.
   - 'newton-method'   (4.6) : Newton step H(x)Δx = −∇f(x), x(k+1) = x(k) + Δx (Example 4.22); 1–2 iterations, 2-var
                               quadratic (exact in one step), the notes' quartic family, or 1 variable.
   Exposes the solvers on the drill objects for verification scripts. */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const Z = F(0);

  // ------------------------------------------------------------------ helpers
  const mi = (s) => String(s).replace(/-/g, '−');
  const nh = (q) => mi(F(q).html());
  const dec = (x, p = 4) => mi(Number(x.toFixed(p)).toString());
  const fdec = (q, p = 4) => dec(F(q).toNumber(), p); // decimal display of a Frac
  const both = (q) => (F(q).isInt() || F(q).d <= 1000n ? nh(q) + (F(q).isInt() ? '' : ` ≈ ${fdec(q)}`) : `≈ ${fdec(q)}`);
  const coefTxt = (q) => (q.d === 2n ? mi(q.dec(1)) : nh(q));
  const XY = ['x', 'y'];
  const X12 = ['x<sub>1</sub>', 'x<sub>2</sub>'];

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
      out += idx === 0 ? (neg ? '−' : '') + cs + mono : (neg ? ' − ' : ' + ') + cs + mono;
    });
    return out;
  }
  const vec = (v) => `(${v.map(nh).join(', ')})`;
  const vecD = (v) => `(${v.map((q) => (F(q).d > 100n ? fdec(q) : nh(q))).join(', ')})`;
  const norm = (v) => Math.sqrt(v.reduce((s, q) => s + F(q).toNumber() ** 2, 0));
  const dot = (u, v) => u.reduce((s, q, i) => s.add(F(q).mul(v[i])), Z);
  const mv = (M, v) => M.map((r) => dot(r, v));
  const det2 = (M) => M[0][0].mul(M[1][1]).sub(M[0][1].mul(M[1][0]));
  const inv2 = (M) => {
    const d = det2(M);
    return [
      [M[1][1].div(d), M[0][1].neg().div(d)],
      [M[1][0].neg().div(d), M[0][0].div(d)],
    ];
  };
  const smallDen = (q, D) => F(q).d <= BigInt(D);

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

  // quadratic f(x) = ½xᵀHx + cᵀx + c0 as polynomial (2 vars)
  const quadPoly = (H, c, c0) =>
    poly([
      [H[0][0].div(2), [2, 0]],
      [H[0][1], [1, 1]],
      [H[1][1].div(2), [0, 2]],
      [c[0], [1, 0]],
      [c[1], [0, 1]],
      [c0, [0, 0]],
    ]);

  // contour + path picture for a 2-var quadratic (Q positive definite = ±H, centre xs)
  function pathViz(Q, xs, path, caption, names) {
    names = names || ['x₁', 'x₂'];
    const q = Q.map((r) => r.map((v) => F(v).toNumber()));
    const c = xs.map((v) => F(v).toNumber());
    const P = path.map((p) => p.map((v) => F(v).toNumber()));
    const all = P.concat([c]);
    let x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
    let y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
    const span = Math.max(x1 - x0, y1 - y0, 1) * 1.35;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    x0 = mx - span / 2;
    y0 = my - span / 2;
    const W = 250;
    const sx = (x) => ((x - x0) / span) * W;
    const sy = (y) => W - ((y - y0) / span) * W;
    let svg = `<svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;margin:0 auto;background:var(--card)">`;
    const levels = P.map((p) => {
      const d = [p[0] - c[0], p[1] - c[1]];
      return d[0] * (q[0][0] * d[0] + q[0][1] * d[1]) + d[1] * (q[1][0] * d[0] + q[1][1] * d[1]);
    }).filter((k) => k > 1e-9);
    levels.forEach((k) => {
      const pts = [];
      for (let i = 0; i <= 72; i++) {
        const th = (2 * Math.PI * i) / 72;
        const u = [Math.cos(th), Math.sin(th)];
        const uq = u[0] * (q[0][0] * u[0] + q[0][1] * u[1]) + u[1] * (q[1][0] * u[0] + q[1][1] * u[1]);
        const r = Math.sqrt(k / uq);
        pts.push(`${sx(c[0] + r * u[0]).toFixed(1)},${sy(c[1] + r * u[1]).toFixed(1)}`);
      }
      svg += `<polyline points="${pts.join(' ')}" style="fill:none;stroke:var(--muted);stroke-width:1;opacity:.55"/>`;
    });
    for (let i = 0; i + 1 < P.length; i++)
      svg += `<line x1="${sx(P[i][0]).toFixed(1)}" y1="${sy(P[i][1]).toFixed(1)}" x2="${sx(P[i + 1][0]).toFixed(1)}" y2="${sy(P[i + 1][1]).toFixed(1)}" style="stroke:var(--acc);stroke-width:2.4"/>`;
    svg += `<text x="${(sx(c[0]) + 6).toFixed(1)}" y="${(sy(c[1]) - 6).toFixed(1)}" style="font-size:11px;fill:var(--good);font-weight:700">x*</text><circle cx="${sx(c[0]).toFixed(1)}" cy="${sy(c[1]).toFixed(1)}" r="4" style="fill:var(--good)"/>`;
    P.forEach((p, i) => {
      svg += `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="4" style="fill:var(--acc)"/><text x="${(sx(p[0]) + 6).toFixed(1)}" y="${(sy(p[1]) + 14).toFixed(1)}" style="font-size:11px;fill:var(--ink)">${i}</text>`;
    });
    svg += `</svg>`;
    return {
      type: 'html',
      html: `<div class="viz-cap">${caption}</div>${svg}<div class="muted" style="font-size:11.5px;text-align:center">Gri elipsler: noktalardan geçen eş-değer (level) eğrileri; mavi: arama yolu (0, 1, 2… = iterasyon noktaları); yeşil x* = gerçek stationary point. Yatay eksen ${names[0]}, dikey ${names[1]}.</div>`,
    };
  }

  // ================================================================== 1) GOLDEN SECTION SEARCH (4.5.2)
  const R = 0.618;
  const r4 = (x) => Math.round(x * 1e4) / 1e4 + 0; // 4 decimals, as in Example 4.17

  /* Runs GSS exactly like the notes. f: number → number, sense 'max'|'min'.
     mode 'notes': 4-decimal rounding + re-use of the kept point; 'exact': no rounding (re-use); 'fresh': no rounding,
     both points recomputed from the formulas each iteration. Returns iterations. */
  function gss(f, a, b, sense, k, mode = 'notes') {
    const rd = mode === 'notes' ? r4 : (x) => x;
    const its = [];
    let L = rd(b - a);
    let xL = rd(b - R * L), xR = rd(a + R * L);
    let reuse = null; // 'L' | 'R'
    for (let i = 1; i <= k; i++) {
      const fL = rd(f(xL)), fR = rd(f(xR));
      const goRight = sense === 'max' ? fL < fR : fL > fR; // keep (x_L, b]
      const it = { i, a, b, L, xL, xR, fL, fR, reuse, goRight };
      if (goRight) {
        it.na = xL;
        it.nb = b;
      } else {
        it.na = a;
        it.nb = xR;
      }
      it.nL = rd(it.nb - it.na);
      its.push(it);
      const oL = xL, oR = xR;
      a = it.na;
      b = it.nb;
      L = it.nL;
      if (mode === 'fresh') {
        xL = b - R * L;
        xR = a + R * L;
        reuse = null;
      } else if (goRight) {
        xL = oR;
        xR = rd(a + R * L);
        reuse = 'L';
      } else {
        xR = oL;
        xL = rd(b - R * L);
        reuse = 'R';
      }
    }
    return its;
  }

  function gssFunc(rng) {
    const kind = rng.pick(['qmax', 'qmin', 'amax', 'amin']);
    if (kind === 'qmax' || kind === 'qmin') {
      const s = kind === 'qmax' ? -1 : 1;
      const al = rng.pick([1, 1, 2]);
      const beta = rng.int(-6, 6);
      const gam = rng.int(-5, 5);
      const opt = -beta / (2 * s * al);
      const p = poly([[s * al, [2]], [beta, [1]], [gam, [0]]]);
      return { kind, sense: s < 0 ? 'max' : 'min', f: (x) => s * al * x * x + beta * x + gam, df: (x) => 2 * s * al * x + beta, txt: pshow(p, ['x']), opt };
    }
    const s = kind === 'amax' ? -1 : 1;
    const c = rng.int(-15, 25) / 10;
    const d = kind === 'amax' ? rng.int(0, 5) : 0;
    const absT = c === 0 ? '|x|' : `|x ${c < 0 ? '+' : '−'} ${Math.abs(c)}|`;
    const txt = s < 0 ? (d ? `${d} − ${absT}` : `−${absT}`) : absT;
    return { kind, sense: s < 0 ? 'max' : 'min', f: (x) => d + s * Math.abs(x - c), df: () => 1, txt, opt: c, nondiff: true };
  }

  function genGss(rng, k) {
    for (let t = 0; t < 4000; t++) {
      const fn = gssFunc(rng);
      const a = rng.int(-6, 2) / (rng.chance(0.3) ? 2 : 1);
      const b = a + rng.pick([1.5, 2, 2.5, 3, 3.5, 4, 5]);
      if (!(fn.opt > a + 0.1 && fn.opt < b - 0.1)) continue;
      const L0 = b - a;
      // ε so that the required iteration count is exactly k (and not borderline)
      const EPS = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5];
      const okE = EPS.filter((e) => {
        const kr = Math.log(e / L0) / Math.log(R);
        return Math.ceil(kr) === k && kr - Math.floor(kr) > 0.12 && kr - Math.floor(kr) < 0.88;
      });
      if (!okE.length) continue;
      const eps = rng.pick(okE);
      const its = gss(fn.f, a, b, fn.sense, k, 'notes');
      const ex = gss(fn.f, a, b, fn.sense, k, 'exact');
      const fr = gss(fn.f, a, b, fn.sense, k, 'fresh');
      let ok = true;
      for (let i = 0; i < k; i++) {
        if (its[i].goRight !== ex[i].goRight || its[i].goRight !== fr[i].goRight) ok = false;
        if (Math.abs(its[i].fL - its[i].fR) < 0.004) ok = false;
        if (Math.abs(its[i].xL - fr[i].xL) > 0.0012 || Math.abs(its[i].xR - fr[i].xR) > 0.0012) ok = false;
        if (Math.abs(its[i].fL) > 60 || Math.abs(its[i].fR) > 60) ok = false;
      }
      if (!ok) continue;
      // the true optimum must stay inside the final interval
      const last = its[k - 1];
      if (!(fn.opt >= last.na - 1e-9 && fn.opt <= last.nb + 1e-9)) continue;
      return { fn, a, b, eps, k, its };
    }
    return null;
  }

  function gssNotes() {
    const fn = { kind: 'qmax', sense: 'max', f: (x) => -x * x - 1, df: (x) => -2 * x, txt: '−x<sup>2</sup> − 1', opt: 0 };
    const its = gss(fn.f, -1, 0.75, 'max', 5, 'notes');
    return { fn, a: -1, b: 0.75, eps: 0.25, k: 5, its, notes: true };
  }

  function gssExercise(inst) {
    const { fn, a, b, eps, k, its } = inst;
    const L0 = b - a;
    const kr = Math.log(eps / L0) / Math.log(R);
    const sense = fn.sense;
    const tolX = 0.0015;
    const tolF = (x) => 0.0015 + 0.0006 * Math.abs(fn.df(x));
    const xi = (n) => `x<sub>${n}</sub>`;
    const ivTxt = (it) => (it.goRight ? `(${dec(it.na)}, ${dec(it.nb)}]` : `[${dec(it.na)}, ${dec(it.nb)})`);
    // table: stage per row: 0 none, 1 points, 2 f, 3 interval, 4 L
    const table = (row, stage) => ({
      type: 'matrix',
      caption: `GSS tablosu (r = 0.618, 4 ondalık) — ${sense} ${fn.txt}`,
      colLabels: ['İter', 'a', 'b', 'x<sub>L</sub>', 'x<sub>R</sub>', 'f(x<sub>L</sub>)', 'f(x<sub>R</sub>)', 'Yeni aralık', 'L'],
      cells: its.map((it, i) => {
        const st = i < row ? 4 : i === row ? stage : -1;
        const q = (s, v) => (st >= s ? v : st >= 0 || i === 0 ? '?' : '');
        const lbl = (n, v) => `${xi(n)} = ${dec(v)}`;
        return [
          ['I', 'II', 'III', 'IV', 'V', 'VI'][i],
          st >= 0 || i <= row ? dec(it.a) : '',
          st >= 0 || i <= row ? dec(it.b) : '',
          q(1, lbl(2 * i + 1, it.xL)),
          q(1, lbl(2 * i + 2, it.xR)),
          q(2, dec(it.fL)),
          q(2, dec(it.fR)),
          q(3, ivTxt(it)),
          q(4, dec(it.nL)),
        ];
      }),
      cls: its.map((it, i) => {
        const st = i < row ? 4 : i === row ? stage : -1;
        const keepL = sense === 'max' ? it.fL > it.fR : it.fL < it.fR;
        return ['', '', '', st >= 2 && keepL ? 'hl' : '', st >= 2 && !keepL ? 'hl' : '', '', '', st >= 3 ? 'sel' : '', ''];
      }),
    });
    const steps = [];
    steps.push({
      kind: 'number',
      prompt: `Son interval of uncertainty'nin uzunluğu <b>ε = ${dec(eps)}</b> değerinden küçük olmalı. Kaç GSS iterasyonu (k) gerekir? (L<sub>0</sub> = b − a = ${dec(L0)}; ${dec(L0)}·(0.618)<sup>k</sup> < ${dec(eps)})`,
      fields: [{ label: 'k', answer: k }],
      hint: 'Her iterasyon aralığı 0.618 katına indirir. İki tarafın ln\'ini al; 0.618 < 1 olduğundan ln(0.618) < 0 ve eşitsizlik yön değiştirir.',
      explain: `${dec(L0)}(0.618<sup>k</sup>) < ${dec(eps)} → k·ln(0.618) < ln(${dec(eps)}/${dec(L0)}) → k > ${dec(kr, 2)} → <b>k = ${k}</b> iterasyon.${inst.notes ? ' <span class="muted">(Notlarda k > 4.06 yazıyor; tam değer 4.04 — sonuç değişmez: 5 iterasyon.)</span>' : ''}`,
      viz: table(0, 0),
    });
    its.forEach((it, i) => {
      const nL = 2 * i + 1, nR = 2 * i + 2;
      let pre, ex1;
      if (i === 0) {
        pre = `<b>Iterasyon I.</b> a = ${dec(a)}, b = ${dec(b)}, b − a = ${dec(it.L)}. İlk iki noktayı hesapla (4 ondalığa yuvarla).`;
        ex1 = `${xi(1)} = b − r(b − a) = ${dec(it.b)} − 0.618(${dec(it.L)}) = <b>${dec(it.xL)}</b><br>${xi(2)} = a + r(b − a) = ${dec(it.a)} + 0.618(${dec(it.L)}) = <b>${dec(it.xR)}</b>`;
      } else {
        const keptName = it.reuse === 'L' ? `${xi(nL)} = ${xi(2 * i)}` : `${xi(nR)} = ${xi(2 * i - 1)}`;
        pre = `<b>Iterasyon ${['I', 'II', 'III', 'IV', 'V', 'VI'][i]}.</b> Aralık ${ivTxt(its[i - 1])}, L = ${dec(it.L)}. Noktalardan biri önceki iterasyondan <b>aynen</b> alınır (GSS'nin püf noktası), diğeri yeni hesaplanır.`;
        ex1 =
          it.reuse === 'L'
            ? `Sol nokta tekrar kullanılır: ${keptName} = <b>${dec(it.xL)}</b>.<br>Yeni sağ nokta: ${xi(nR)} = a + r·L = ${dec(it.a)} + 0.618(${dec(it.L)}) = <b>${dec(it.xR)}</b>`
            : `Sağ nokta tekrar kullanılır: ${keptName} = <b>${dec(it.xR)}</b>.<br>Yeni sol nokta: ${xi(nL)} = b − r·L = ${dec(it.b)} − 0.618(${dec(it.L)}) = <b>${dec(it.xL)}</b>`;
      }
      steps.push({
        kind: 'number',
        prompt: `${pre}`,
        fields: [
          { label: `${xi(nL)} (sol nokta)`, answer: String(it.xL), tol: tolX },
          { label: `${xi(nR)} (sağ nokta)`, answer: String(it.xR), tol: tolX },
        ],
        hint: i === 0 ? 'x_L = b − 0.618(b − a), x_R = a + 0.618(b − a).' : `Yeni sol nokta: sağ uçtan r·L kadar sola (b − rL); yeni sağ nokta: sol uçtan r·L kadar sağa (a + rL). Önceki noktalardan hangisi yeni aralığın içinde kaldı?`,
        explain: ex1 + (i > 0 ? `<br><span class="muted">(Formülle yeniden hesaplasan küçük yuvarlama farkı olabilir; tolerans ±${tolX}.)</span>` : ''),
        vizDuring: table(i, 0),
        viz: table(i, 1),
      });
      const reusedF = i > 0 ? (it.reuse === 'L' ? `f(${xi(nL)}) = f(${xi(2 * i)}) önceki iterasyondan bilinir. ` : `f(${xi(nR)}) = f(${xi(2 * i - 1)}) önceki iterasyondan bilinir. `) : '';
      steps.push({
        kind: 'number',
        prompt: `f(x) = ${fn.txt} değerlerini hesapla (4 ondalık).${reusedF ? ' ' + reusedF : ''}`,
        fields: [
          { label: `f(${xi(nL)})`, answer: String(it.fL), tol: tolF(it.xL) },
          { label: `f(${xi(nR)})`, answer: String(it.fR), tol: tolF(it.xR) },
        ],
        explain: `f(${dec(it.xL)}) = <b>${dec(it.fL)}</b>, f(${dec(it.xR)}) = <b>${dec(it.fR)}</b>.`,
        viz: table(i, 2),
      });
      const optsIv = [
        { html: `(${xi(nL)}, b] = (${dec(it.xL)}, ${dec(it.b)}]`, correct: it.goRight },
        { html: `[a, ${xi(nR)}) = [${dec(it.a)}, ${dec(it.xR)})`, correct: !it.goRight },
        { html: `[${xi(nL)}, ${xi(nR)}] = [${dec(it.xL)}, ${dec(it.xR)}]`, correct: false },
      ];
      const cmp = it.fL < it.fR ? '<' : '>';
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `f(${xi(nL)}) ${cmp} f(${xi(nR)}). <b>${sense === 'max' ? 'Maksimizasyon' : 'Minimizasyon'}</b> için yeni interval of uncertainty hangisi?`,
        options: optsIv,
        hint: sense === 'max' ? 'Max: f(x_L) < f(x_R) ise optimum x_L noktasının solunda olamaz → (x_L, b]; f(x_L) > f(x_R) ise → [a, x_R).' : 'Min: daha KÜÇÜK değerli noktanın tarafı korunur. f(x_L) > f(x_R) ise → (x_L, b]; f(x_L) < f(x_R) ise → [a, x_R).',
        explain: `${sense === 'max' ? 'Max' : 'Min'} problemi, f(${xi(nL)}) = ${dec(it.fL)} ${cmp} f(${xi(nR)}) = ${dec(it.fR)} → ${it.goRight ? `optimum ${xi(nL)} noktasının sağında` : `optimum ${xi(nR)} noktasının solunda`}: I<sub>${i + 1}</sub> = <b>${ivTxt(it)}</b>.`,
        viz: table(i, 3),
      });
      steps.push({
        kind: 'number',
        prompt: `Yeni aralığın uzunluğu L<sub>${i + 1}</sub> nedir?`,
        fields: [{ label: `L<sub>${i + 1}</sub>`, answer: String(it.nL), tol: tolX }],
        explain: `L<sub>${i + 1}</sub> = ${dec(it.nb)} − (${dec(it.na)}) = <b>${dec(it.nL)}</b>${i === k - 1 ? ` < ${dec(eps)} ✓` : ''}. (Kontrol: önceki L × 0.618 = ${dec(it.L * R)}.)`,
        viz: table(i, 4),
      });
    });
    const last = its[k - 1];
    steps.push({
      kind: 'info',
      prompt: `${k} iterasyon bitti: optimum çözüm <b>${ivTxt(last)}</b> aralığında (L = ${dec(last.nL)} < ${dec(eps)}). Gerçek optimum: x = ${dec(fn.opt)}${fn.nondiff ? ' (f bu noktada türevlenemez — GSS türev kullanmadığı için sorun yok)' : ''}${inst.notes ? ' — notlardaki sonuçla aynı: (−0.0762, 0.0815], gerçek maksimum x = 0.' : '.'}`,
      viz: table(k, 0),
    });
    return {
      title: `Golden Section Search${inst.notes ? ' · Örnek 4.17' : ''}`,
      statement: `${inst.notes ? '<b>Notlardaki Örnek 4.17.</b> ' : ''}GSS ile çöz:<div class="box"><b>${sense}</b> f(x) = ${fn.txt} &nbsp; s.t. ${dec(a)} ≤ x ≤ ${dec(b)}</div>Son interval of uncertainty'nin uzunluğu <b>ε = ${dec(eps)}</b> değerinden küçük olsun. f bu aralıkta unimodal. Notlardaki gibi <b>r = 0.618</b> kullan ve her sayıyı <b>4 ondalık basamağa</b> yuvarla (tolerans ±${tolX} civarı). Noktalar notlardaki gibi numaralanır: I. iterasyonda x<sub>1</sub>, x<sub>2</sub>; II.'de x<sub>3</sub>, x<sub>4</sub>; …`,
      viz: table(0, 0),
      steps,
      solution: `Son aralık ${ivTxt(last)}, L = ${dec(last.nL)}.`,
    };
  }

  OR.registerDrill({
    id: 'golden-section',
    topic: '4.5',
    title: 'Golden Section Search (r = 0.618)',
    description: 'Unimodal f(x) için GSS: gereken iterasyon sayısı, x_L / x_R noktaları (tekrar kullanılan nokta), f değerleri, yeni interval of uncertainty — notlardaki tabloyu adım adım doldur.',
    options: [
      {
        key: 'iters',
        label: 'İterasyon sayısı',
        type: 'select',
        default: '3',
        choices: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      SRC_OPT,
    ],
    gss,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') {
        const inst = gssNotes();
        return Object.assign(gssExercise(inst), { _data: inst });
      }
      const k = +(opts.iters || 3);
      const inst = genGss(rng, k);
      if (!inst) throw new Error('GSS instance yok');
      return Object.assign(gssExercise(inst), { _data: inst });
    },
  });

  // ================================================================== 2) GRADIENT SEARCH (4.6.2)
  /* f = ½xᵀHx + cᵀx + c0 (H negative definite for max, positive definite for min).
     One iteration from v: g = ∇f(v) = Hv + c, d = ±g, φ(t) = f(v + t d) = γ + βt + αt², t* = −β/(2α), v' = v + t*d. */
  function gradIter(H, c, c0, v, sense) {
    const f = quadPoly(H, c, c0);
    const g = mv(H, v).map((q, i) => q.add(c[i]));
    const d = sense === 'max' ? g : g.map((q) => q.neg());
    const gam = pev(f, v);
    const beta = dot(g, d);
    const alpha = dot(d, mv(H, d)).div(2);
    const t = beta.neg().div(alpha.mul(2));
    const nv = v.map((q, i) => q.add(t.mul(d[i])));
    return { v, g, d, alpha, beta, gam, t, nv, fv: gam, fnv: pev(f, nv) };
  }
  function gradRun(H, c, c0, v0, sense, k) {
    const its = [];
    let v = v0;
    for (let i = 0; i < k; i++) {
      const g = mv(H, v).map((q, j) => q.add(c[j]));
      if (g.every((q) => q.isZero())) break;
      const it = gradIter(H, c, c0, v, sense);
      its.push(it);
      v = it.nv;
    }
    const gEnd = mv(H, v).map((q, j) => q.add(c[j]));
    return { its, vEnd: v, gEnd };
  }
  const stationary = (H, c) => mv(inv2(H), c).map((q) => q.neg());

  function genGrad(rng, sense, iters) {
    for (let t = 0; t < 6000; t++) {
      const s = sense === 'max' ? -1 : 1;
      const iso = iters === 1 && rng.chance(0.25);
      let H;
      if (iso) {
        const a = 2 * rng.int(1, 2);
        H = [[F(s * a), Z], [Z, F(s * a)]];
      } else {
        const a = 2 * rng.int(1, 3), b = 2 * rng.int(1, 3), off = rng.int(-2, 2);
        H = [[F(s * a), F(s * off)], [F(s * off), F(s * b)]];
        if (a * b - off * off <= 0) continue;
        if (a === b && off === 0) continue;
      }
      const xs = [F(rng.int(-3, 4)), F(rng.int(-3, 4))]; // integer stationary point
      if (!iso && rng.chance(0.4)) xs[rng.int(0, 1)] = F(rng.int(-5, 7)).div(2);
      const c = mv(H, xs).map((q) => q.neg());
      if (c.some((q) => !q.isInt())) continue;
      const v0 = [F(rng.int(-3, 3)), F(rng.int(-3, 3))];
      if (v0[0].eq(xs[0]) && v0[1].eq(xs[1])) continue;
      const c0 = rng.int(-5, 10);
      const run = gradRun(H, c, F(c0), v0, sense, iso ? 1 : iters);
      if (!run.its.length) continue;
      const it0 = run.its[0];
      if (!smallDen(it0.t, 12) || it0.nv.some((q) => !smallDen(q, 12))) continue;
      if (it0.g.some((q) => q.abs().gt(30)) || it0.alpha.abs().gt(150)) continue;
      if (it0.g.every((q) => !q.isZero()) === false && !iso && rng.chance(0.7)) continue; // prefer both components non-zero
      if (!iso && run.its.length < iters) continue;
      if (!iso && iters === 2) {
        const it1 = run.its[1];
        if (!smallDen(it1.t, 30) || it1.nv.some((q) => !smallDen(q, 60))) continue;
      }
      return { H, c, c0: F(c0), v0, sense, xs, run, iso };
    }
    return null;
  }

  function gradNotes() {
    // max z = −(x1 − 3)² − (x2 − 2)² = −x1² + 6x1 − x2² + 4x2 − 13 ; v0 = (1, 1)
    const H = [[F(-2), Z], [Z, F(-2)]];
    const c = [F(6), F(4)];
    const run = gradRun(H, c, F(-13), [F(1), F(1)], 'max', 1);
    return { H, c, c0: F(-13), v0: [F(1), F(1)], sense: 'max', xs: [F(3), F(2)], run, iso: true, notes: true, txt: '−(x<sub>1</sub> − 3)<sup>2</sup> − (x<sub>2</sub> − 2)<sup>2</sup>' };
  }

  function gradExercise(inst) {
    const { H, c, c0, sense, xs, run } = inst;
    const f = quadPoly(H, c, c0);
    const fx1 = pdiff(f, 0), fx2 = pdiff(f, 1);
    const fTxt = inst.txt || pshow(f, X12);
    const Q = sense === 'max' ? H.map((r) => r.map((q) => q.neg())) : H;
    const word = sense === 'max' ? 'steepest ascent' : 'steepest descent';
    const sgn = sense === 'max' ? '+' : '−';
    const steps = [];
    const path = [run.its[0].v];
    const pv = (pts, cap) => pathViz(Q, xs, pts, cap);
    run.its.forEach((it, i) => {
      const vi = `v<sub>${i}</sub>`, vn = `v<sub>${i + 1}</sub>`;
      steps.push({
        kind: 'number',
        prompt: `<b>Iterasyon ${i + 1}.</b> ${vi} = ${vec(it.v)}. Gradient ∇f(${vi}) nedir?`,
        fields: [
          { label: `∂f/∂x<sub>1</sub> (${vi})`, answer: it.g[0] },
          { label: `∂f/∂x<sub>2</sub> (${vi})`, answer: it.g[1] },
        ],
        hint: `∇f(x<sub>1</sub>, x<sub>2</sub>) = (${pshow(fx1, X12)}, ${pshow(fx2, X12)}).`,
        explain: `∇f(x<sub>1</sub>, x<sub>2</sub>) = (${pshow(fx1, X12)}, ${pshow(fx2, X12)}) → ∇f${vec(it.v)} = <b>${vec(it.g)}</b>.`,
        vizDuring: pv(path.slice(), `${word}: ${vi} = ${vec(it.v)}`),
      });
      const pt = `(${it.v.map((q, j) => (it.d[j].isZero() ? nh(q) : `${q.isZero() ? '' : nh(q) + ' '}${it.d[j].lt(0) ? '−' : q.isZero() ? '' : '+'} ${it.d[j].abs().eq(1) ? '' : nh(it.d[j].abs())}t`.trim())).join(', ')})`;
      steps.push({
        kind: 'number',
        prompt: `${sense === 'max' ? `${vi} + t·∇f(${vi})` : `${vi} − t·∇f(${vi})`} = ${pt} noktasını f'ye koy: f(t) = αt<sup>2</sup> + βt + γ. Katsayılar nedir?`,
        fields: [
          { label: 'α', answer: it.alpha },
          { label: 'β', answer: it.beta },
          { label: 'γ', answer: it.gam },
        ],
        hint: `γ = f(${vi}); β = ∇f(${vi})·d (d = ${sense === 'max' ? '∇f' : '−∇f'}); α = ½ dᵀHd. (İstersen doğrudan açarak da bulabilirsin.)`,
        explain: `f(t) = f${pt} = <b>${pshow(poly([[it.alpha, [2]], [it.beta, [1]], [it.gam, [0]]]), ['t'])}</b>. (β = ${sense === 'max' ? '‖∇f‖²' : '−‖∇f‖²'} = ${nh(it.beta)}.)`,
      });
      steps.push({
        kind: 'number',
        prompt: `${sense === 'max' ? 'max' : 'min'} f(t), t ≥ 0 → f′(t) = 0. t<sub>${i}</sub>* nedir?`,
        fields: [{ label: `t<sub>${i}</sub>*`, answer: it.t }],
        explain: `f′(t) = ${nh(it.alpha.mul(2))}t ${it.beta.lt(0) ? '−' : '+'} ${nh(it.beta.abs())} = 0 → t<sub>${i}</sub>* = <b>${both(it.t)}</b> (> 0 ✓).`,
      });
      path.push(it.nv);
      steps.push({
        kind: 'number',
        prompt: `Yeni nokta ${vn} = ${vi} ${sgn} t<sub>${i}</sub>*·∇f(${vi}) nedir?`,
        fields: [
          { label: `${vn} x<sub>1</sub>`, answer: it.nv[0] },
          { label: `${vn} x<sub>2</sub>`, answer: it.nv[1] },
        ],
        explain: `${vn} = ${vec(it.v)} ${sgn} ${nh(it.t)}·${vec(it.g)} = <b>${vec(it.nv)}</b>; f(${vn}) = ${both(it.fnv)} (önce ${both(it.fv)} → ${sense === 'max' ? 'arttı' : 'azaldı'}).`,
        viz: pv(path.slice(), `${vn} = ${vec(it.nv)}`),
      });
    });
    const k = run.its.length;
    const gEnd = run.gEnd;
    const zero = gEnd.every((q) => q.isZero());
    steps.push({
      kind: 'number',
      prompt: `Durma kontrolü: ∇f(v<sub>${k}</sub>) nedir?`,
      fields: [
        { label: `∂f/∂x<sub>1</sub> (v<sub>${k}</sub>)`, answer: gEnd[0] },
        { label: `∂f/∂x<sub>2</sub> (v<sub>${k}</sub>)`, answer: gEnd[1] },
      ],
      explain: `∇f${vec(run.vEnd)} = <b>${vec(gEnd)}</b>, ‖∇f‖ = ${dec(norm(gEnd), 4)}.${zero ? '' : ` (Not: ∇f(v<sub>${k - 1}</sub>)·∇f(v<sub>${k}</sub>) = ${nh(dot(run.its[k - 1].g, gEnd))} → ardışık arama yönleri birbirine dik; zigzag bundan — notlarda yok.)`}`,
    });
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Algoritma (‖∇f‖ < 0.01 kuralıyla) ne yapmalı?`,
      options: [
        { html: `Dur: v<sub>${k}</sub> stationary point${zero ? ' (∇f = 0)' : ''}`, correct: zero },
        { html: `Devam et: v<sub>${k}</sub>'dan ${sense === 'max' ? '∇f' : '−∇f'} yönünde yeni line search`, correct: !zero },
      ],
      explain: zero
        ? `∇f(v<sub>${k}</sub>) = (0, 0) → algoritma durur. f ${sense === 'max' ? 'concave' : 'convex'} (H ${sense === 'max' ? 'negative' : 'positive'} definite) olduğundan v* = ${vec(run.vEnd)} <b>global ${sense === 'max' ? 'maximum' : 'minimum'}</b>; z = ${both(pev(f, run.vEnd))}${inst.notes ? ' (notlardaki gibi v* = (3, 2), z = 0)' : ''}.`
        : `‖∇f(v<sub>${k}</sub>)‖ = ${dec(norm(gEnd), 4)} ≥ 0.01 → devam edilir. (Gerçek stationary point x* = ${vec(xs)}; gradient search zigzag yaparak yaklaşır.)`,
      viz: pv(path.slice(), zero ? 'v* bulundu' : `Gerçek optimum x* = ${vec(xs)}`),
    });
    return {
      title: `Gradient search · ${word}${inst.notes ? ' · Örnek 4.21' : ''}`,
      statement: `${inst.notes ? '<b>Notlardaki Örnek 4.21.</b> ' : ''}Method of ${word} ile yaklaşık çöz:<div class="box"><b>${sense}</b> z = f(x<sub>1</sub>, x<sub>2</sub>) = ${fTxt}, &nbsp; (x<sub>1</sub>, x<sub>2</sub>) ∈ R<sup>2</sup></div>Başlangıç noktası <b>v<sub>0</sub> = ${vec(inst.v0)}</b>. Her iterasyonda v<sub>k+1</sub> = v<sub>k</sub> ${sgn} t<sub>k</sub>∇f(v<sub>k</sub>), t<sub>k</sub> ≥ 0 tek değişkenli ${sense} f(v<sub>k</sub> ${sgn} t∇f(v<sub>k</sub>)) probleminden. ${k > 1 ? `${k} iterasyon yap.` : ''} Cevaplar kesir olarak (ör. 3/4) girilebilir.`,
      viz: pv([inst.v0], `Başlangıç v<sub>0</sub> = ${vec(inst.v0)}`),
      steps,
      solution: `Yol: ${[inst.v0].concat(run.its.map((it) => it.nv)).map(vec).join(' → ')}; x* = ${vec(xs)}.`,
    };
  }

  OR.registerDrill({
    id: 'gradient-search',
    topic: '4.6',
    title: 'Gradient search · steepest ascent / descent',
    description: 'Quadratic f için ∇f(v), line search f(v ± t∇f) → t*, yeni nokta; 1–2 iterasyon, zigzag ve durma kontrolü (notlardaki Örnek 4.21 gibi).',
    options: [
      {
        key: 'sense',
        label: 'Problem',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık' },
          { value: 'max', label: 'max (steepest ascent)' },
          { value: 'min', label: 'min (steepest descent)' },
        ],
      },
      {
        key: 'iters',
        label: 'İterasyon',
        type: 'select',
        default: '1',
        choices: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
        ],
      },
      SRC_OPT,
    ],
    gradRun,
    generate(rng, opts) {
      opts = opts || {};
      if (opts.src === 'notes') {
        const inst = gradNotes();
        return Object.assign(gradExercise(inst), { _data: inst });
      }
      const sense = opts.sense && opts.sense !== 'mix' ? opts.sense : rng.pick(['max', 'min']);
      const inst = genGrad(rng, sense, +(opts.iters || 1));
      if (!inst) throw new Error('gradient instance yok');
      return Object.assign(gradExercise(inst), { _data: inst });
    },
  });

  // ================================================================== 3) NEWTON'S METHOD (4.6.3)
  function newtonStep(f, x) {
    const n = x.length;
    const g = Array.from({ length: n }, (_, i) => pev(pdiff(f, i), x));
    const H = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => pev(pdiff(pdiff(f, i), j), x)));
    let dx;
    if (n === 1) dx = [g[0].neg().div(H[0][0])];
    else dx = mv(inv2(H), g).map((q) => q.neg());
    return { x, g, H, dx, nx: x.map((q, i) => q.add(dx[i])) };
  }
  function newtonRun(f, x0, k) {
    const its = [];
    let x = x0;
    for (let i = 0; i < k; i++) {
      const st = newtonStep(f, x);
      its.push(st);
      x = st.nx;
    }
    const n = x0.length;
    const gEnd = Array.from({ length: n }, (_, i) => pev(pdiff(f, i), x));
    return { its, xEnd: x, gEnd };
  }

  function genNewton(rng, type, iters) {
    for (let t = 0; t < 5000; t++) {
      if (type === 'quad') {
        const sense = rng.pick(['min', 'max']);
        const s = sense === 'max' ? -1 : 1;
        const a = 2 * rng.int(1, 4), b = 2 * rng.int(1, 4), off = rng.int(-3, 3);
        if (a * b - off * off <= 0 || off === 0) continue;
        const H = [[F(s * a), F(s * off)], [F(s * off), F(s * b)]];
        const c = [F(rng.int(-9, 9)), F(rng.int(-9, 9))];
        const f = quadPoly(H, c, F(rng.int(-4, 6)));
        const x0 = [F(rng.int(-2, 3)), F(rng.int(-2, 3))];
        const run = newtonRun(f, x0, 1);
        const st = run.its[0];
        if (st.g.some((q) => q.isZero())) continue;
        if (st.nx.some((q) => !smallDen(q, 8)) || st.dx.some((q) => !smallDen(q, 8))) continue;
        return { type, f, x0, run, sense, names: X12 };
      }
      if (type === 'quartic') {
        const a = rng.int(-1, 1), b = rng.int(-1, 1), k = rng.pick([1, -1, 2, -2]);
        const x = plin(2, [1, 0]), y = plin(2, [0, 1]);
        const f = padd(ppow(padd(x, pconst(2, a)), 4, 2), pscale(pmul(x, y), k), ppow(padd(y, pconst(2, b)), 4, 2));
        const x0 = [F(rng.int(-1, 1)), F(rng.int(-1, 2))];
        let run;
        try {
          run = newtonRun(f, x0, iters);
        } catch (e) {
          continue; // singular Hessian
        }
        if (run.its.some((st) => det2(st.H).le(0) || st.H[0][0].le(0))) continue; // H positive definite at every iterate
        const st = run.its[0];
        if (st.g.some((q) => q.isZero())) continue;
        if (st.nx.some((q) => q.abs().gt(3))) continue;
        // must actually make progress (gradient norm decreases)
        if (!(norm(run.gEnd) < norm(st.g))) continue;
        return { type, f, x0, run, sense: 'min', names: XY, a, b, k };
      }
      // 1 variable: f(x) = x⁴ + c3x³ + c2x² + c1x, min
      const c3 = rng.int(-4, 4), c2 = rng.int(-6, 6), c1 = rng.int(-12, 12);
      const f = poly([[1, [4]], [c3, [3]], [c2, [2]], [c1, [1]]]);
      const x0 = [F(rng.int(-3, 3))];
      let run;
      try {
        run = newtonRun(f, x0, iters);
      } catch (e) {
        continue; // f″ = 0 somewhere
      }
      if (run.its.some((st) => st.H[0][0].le(0))) continue;
      const st = run.its[0];
      if (st.g[0].isZero() || !smallDen(st.dx[0], 40)) continue;
      if (st.nx[0].abs().gt(5)) continue;
      if (!(norm(run.gEnd) < norm(st.g) / 3)) continue;
      return { type, f, x0, run, sense: 'min', names: ['x'] };
    }
    return null;
  }

  function newtonNotes(iters) {
    const x = plin(2, [1, 0]), y = plin(2, [0, 1]);
    const f = padd(ppow(padd(x, pconst(2, 1)), 4, 2), pmul(x, y), ppow(padd(y, pconst(2, 1)), 4, 2));
    const x0 = [F(0), F(1)];
    return { type: 'quartic', f, x0, run: newtonRun(f, x0, iters), sense: 'min', names: XY, notes: true, a: 1, b: 1, k: 1 };
  }

  function newtonExercise(inst) {
    const { f, run, names, type } = inst;
    const n = inst.x0.length;
    const steps = [];
    const exactOK = (q) => smallDen(q, 1000);
    const fld = (label, q) => (exactOK(q) ? { label, answer: q } : { label, answer: F(q).toNumber().toFixed(6), tol: 0.003 + 0.001 * Math.abs(F(q).toNumber()) });
    const showQ = (q) => (exactOK(q) ? both(q) : `≈ ${fdec(q)}`);
    const fTxt =
      type === 'quartic'
        ? `(x ${inst.a < 0 ? '−' : '+'} ${Math.abs(inst.a)})<sup>4</sup> ${inst.k < 0 ? '−' : '+'} ${Math.abs(inst.k) === 1 ? '' : Math.abs(inst.k)}xy + (y ${inst.b < 0 ? '−' : '+'} ${Math.abs(inst.b)})<sup>4</sup>`.replace(/\(x \+ 0\)/g, 'x').replace(/\(y \+ 0\)/g, 'y')
        : pshow(f, names);
    const grad = names.map((_, i) => pdiff(f, i));
    const hess = names.map((_, i) => names.map((__, j) => pdiff(grad[i], j)));
    const xk = (k) => (n === 1 ? `x<sup>(${k})</sup>` : `x<sup>(${k})</sup>`);
    const lbl = (i) => (n === 1 ? 'x' : names[i]);
    run.its.forEach((st, k) => {
      const P = n === 1 ? showQ(st.x[0]) : `(${st.x.map(showQ).join(', ')})`;
      steps.push({
        kind: 'number',
        prompt: `<b>Iterasyon ${k + 1}.</b> ${xk(k)} = ${P}. ${n === 1 ? `f′(${xk(k)}) ve f″(${xk(k)})` : `∇f(${xk(k)}) ve H(${xk(k)})`} nedir?${exactOK(st.x[0]) ? '' : ' (4 ondalık yeterli)'}`,
        fields:
          n === 1
            ? [fld(`f′(${xk(k)})`, st.g[0]), fld(`f″(${xk(k)})`, st.H[0][0])]
            : [fld(`∂f/∂${names[0]}`, st.g[0]), fld(`∂f/∂${names[1]}`, st.g[1]), fld(`∂²f/∂${names[0]}²`, st.H[0][0]), fld(`∂²f/∂${names[0]}∂${names[1]}`, st.H[0][1]), fld(`∂²f/∂${names[1]}²`, st.H[1][1])],
        hint: n === 1 ? `f′(x) = ${pshow(grad[0], names)}, f″(x) = ${pshow(hess[0][0], names)}.` : `∇f = (${grad.map((g) => pshow(g, names)).join(', ')}); H = [${hess.map((r) => r.map((h) => pshow(h, names)).join(', ')).join(' ; ')}].`,
        explain:
          n === 1
            ? `f′(x) = ${pshow(grad[0], names)} → f′ = <b>${showQ(st.g[0])}</b>; f″(x) = ${pshow(hess[0][0], names)} → f″ = <b>${showQ(st.H[0][0])}</b>.`
            : `∇f = (${grad.map((g) => pshow(g, names)).join(', ')}) → <b>(${st.g.map(showQ).join(', ')})</b>; H = <b>[${st.H.map((r) => r.map(showQ).join(', ')).join(' ; ')}]</b>.`,
      });
      if (n === 1) {
        steps.push({
          kind: 'number',
          prompt: `Newton adımı Δx = −f′(x)/f″(x) ve yeni nokta ${xk(k + 1)} = ${xk(k)} + Δx nedir?`,
          fields: [fld('Δx', st.dx[0]), fld(xk(k + 1), st.nx[0])],
          hint: 'H(x)Δx = −∇f(x) denkleminin tek değişkenli hâli: f″(x)Δx = −f′(x).',
          explain: `Δx = −(${showQ(st.g[0])})/(${showQ(st.H[0][0])}) = <b>${showQ(st.dx[0])}</b> → ${xk(k + 1)} = <b>${showQ(st.nx[0])}</b>.${k === 0 ? ' <span class="muted">(Notlarda "Δx = f′(x)/f″(x)" yazıyor; notlarda baskı hatası: H(x)Δx = −∇f(x)\'ten doğrusu Δx = −f′(x)/f″(x).)</span>' : ''}`,
        });
      } else {
        const d = det2(st.H);
        steps.push({
          kind: 'number',
          prompt: `Newton adımını bul: H(${xk(k)})Δx = −∇f(${xk(k)}) doğrusal sistemini çöz.`,
          fields: [fld(`Δ${names[0]}`, st.dx[0]), fld(`Δ${names[1]}`, st.dx[1])],
          hint: `2×2 için H⁻¹ = (1/det H)[h₂₂ −h₁₂; −h₂₁ h₁₁], det H = ${showQ(d)}. Δx = −H⁻¹∇f.`,
          explain: `det H = ${showQ(d)}; Δx = −H⁻¹∇f = −(1/${showQ(d)})·[${showQ(st.H[1][1])}, ${showQ(st.H[0][1].neg())}; ${showQ(st.H[1][0].neg())}, ${showQ(st.H[0][0])}]·(${st.g.map(showQ).join(', ')}) = <b>(${st.dx.map(showQ).join(', ')})</b>.`,
        });
        steps.push({
          kind: 'number',
          prompt: `Yeni nokta ${xk(k + 1)} = ${xk(k)} + Δx nedir?`,
          fields: [fld(`${names[0]}`, st.nx[0]), fld(`${names[1]}`, st.nx[1])],
          explain: `${xk(k + 1)} = (${st.x.map(showQ).join(', ')}) + (${st.dx.map(showQ).join(', ')}) = <b>(${st.nx.map(showQ).join(', ')})</b>.`,
        });
      }
    });
    const K = run.its.length;
    const gn = norm(run.gEnd);
    const stop = gn < 0.01;
    steps.push({
      kind: 'number',
      prompt: `Durma kontrolü: ‖∇f(${xk(K)})‖ nedir? (4 ondalık)`,
      fields: [{ label: `‖∇f(${xk(K)})‖`, answer: gn.toFixed(6), tol: Math.max(0.002, gn * 0.002) }],
      explain: `∇f(${xk(K)}) = (${run.gEnd.map(showQ).join(', ')}) → ‖∇f‖ = ${dec(gn, 4)}.`,
    });
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Durma toleransı ε = 0.01 ise ne yapılır?`,
      options: [
        { html: `Dur: ${xk(K)} stationary point'e yeterince yakın`, correct: stop },
        { html: `Devam: ${xk(K)}'den yeni bir Newton adımı`, correct: !stop },
      ],
      explain: stop
        ? `‖∇f‖ = ${dec(gn, 4)} < 0.01 → dur.${type === 'quad' ? ` f quadratic olduğundan ikinci mertebe Taylor yaklaşımı f'nin kendisidir → Newton <b>tek adımda</b> tam stationary point'e gider. H ${inst.sense === 'min' ? 'positive' : 'negative'} definite → bu nokta global ${inst.sense === 'min' ? 'minimum' : 'maximum'}.` : ''}`
        : `‖∇f‖ = ${dec(gn, 4)} ≥ 0.01 → bir Newton adımı daha gerekir (Newton genelde gradient search'ten çok daha az adımda yakınsar).`,
    });
    let xs = null;
    try {
      // run to convergence (for the final info), rounding to keep the fractions small
      let x = run.xEnd;
      for (let i = 0; i < 12; i++) x = newtonStep(f, x).nx.map((q) => F(q.toNumber().toFixed(12)));
      if (Array.from({ length: n }, (_, i) => pev(pdiff(f, i), x)).every((q) => Math.abs(q.toNumber()) < 1e-6)) xs = x;
    } catch (e) {
      xs = null;
    }
    if (xs && !stop)
      steps.push({
        kind: 'info',
        prompt: `Bilgi: Newton iterasyonlarına devam edilirse ${n === 1 ? 'x' : '(x, y)'} ≈ ${n === 1 ? fdec(xs[0]) : `(${xs.map((q) => fdec(q)).join(', ')})`} noktasına (stationary point) yakınsar.`,
      });
    const quadViz = type === 'quad' ? pathViz(inst.sense === 'max' ? run.its[0].H.map((r) => r.map((q) => q.neg())) : run.its[0].H, run.xEnd, [inst.x0, run.xEnd], 'Newton adımı (quadratic → tek adımda x*)', ['x₁', 'x₂']) : null;
    return {
      title: `Newton's method${inst.notes ? ' · Örnek 4.22' : n === 1 ? ' · tek değişken' : ''}`,
      statement: `${inst.notes ? '<b>Notlardaki Örnek 4.22</b> (notlarda çözümü verilmemiş; burada ilk ' + K + ' iterasyon). ' : ''}Newton's method ile çöz:<div class="box"><b>${inst.sense}</b> f(${names.join(', ')}) = ${fTxt}</div>Başlangıç noktası <b>${xk(0)} = ${n === 1 ? nh(inst.x0[0]) : vec(inst.x0)}</b>. Newton adımı: ${n === 1 ? 'f″(x)Δx = −f′(x)' : 'H(x<sup>(k)</sup>)Δx = −∇f(x<sup>(k)</sup>)'}, x<sup>(k+1)</sup> = x<sup>(k)</sup> + Δx. ${K} iterasyon yap. Cevapları kesir olarak (ör. −208/575) ya da en az 4 ondalıkla gir.`,
      viz: quadViz || undefined,
      steps,
      solution: `x<sup>(${K})</sup> = ${n === 1 ? showQ(run.xEnd[0]) : `(${run.xEnd.map(showQ).join(', ')})`}.`,
    };
  }

  OR.registerDrill({
    id: 'newton-method',
    topic: '4.6',
    title: "Newton's method (H Δx = −∇f)",
    description: 'Gradient ve Hessian\'ı noktada hesapla, H Δx = −∇f sistemini çöz, yeni noktaya geç; quadratic (tek adımda optimum), notlardaki (x+1)⁴ + xy + (y+1)⁴ ailesi veya tek değişken.',
    options: [
      {
        key: 'type',
        label: 'Fonksiyon',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: 'Karışık' },
          { value: 'quad', label: '2 değişken quadratic' },
          { value: 'quartic', label: '(x+a)⁴ + kxy + (y+b)⁴ (Örnek 4.22 gibi)' },
          { value: '1var', label: 'Tek değişken (4. derece)' },
        ],
      },
      {
        key: 'iters',
        label: 'İterasyon (quadratic hariç)',
        type: 'select',
        default: '1',
        choices: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
        ],
      },
      SRC_OPT,
    ],
    newtonRun,
    generate(rng, opts) {
      opts = opts || {};
      const iters = +(opts.iters || 1);
      if (opts.src === 'notes') {
        const inst = newtonNotes(iters);
        return Object.assign(newtonExercise(inst), { _data: inst });
      }
      const type = opts.type && opts.type !== 'mix' ? opts.type : rng.pick(['quad', 'quartic', '1var']);
      const inst = genNewton(rng, type, iters);
      if (!inst) throw new Error('newton instance yok');
      return Object.assign(newtonExercise(inst), { _data: inst });
    },
  });
})();
