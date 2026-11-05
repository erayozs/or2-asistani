/* Ch.6 Deterministic DP — basic drills (notes 6.2, 6.5, 6.5.2).
   - dp-network  (6.2):  staged network like Example 6.3 (Joe Cougar). f_t(i) = min_j { c_ij + f_{t+1}(j) }, f_N(n) = 0,
                         solved backward stage by stage; then the shortest path is read forward.
   - dp-resource (6.5):  Finco-type resource allocation (Example 6.5). f_3(d) = r_3(d),
                         f_t(d) = max_{0<=x<=d} { r_t(x) + f_{t+1}(d - x) }, answer f_1(D).
   - dp-knapsack (6.5.2): unbounded knapsack (Example 6.6) with stages f_t(d) = max { b_t x + f_{t+1}(d - w_t x) },
                         or (option) the alternative formulation (8) g(w) = max_j { b_j + g(w - w_j) }.
   Every generated instance has a unique optimal decision in every state that is asked (retry otherwise), so each
   x_t(i) answer is well defined. Option `notes` loads the worked example of the notes.
   Exposes OR.drills[...].{solve, gen} for verification scripts. */
(function () {
  const OR = window.OR;
  const S = (t) => `<sub>${t}</sub>`;
  const fx = (t, i, n = 'f') => `${n}${S(t)}(${i})`;
  const chunk = (arr, k) => {
    const out = [];
    for (let i = 0; i < arr.length; i += k) out.push(arr.slice(i, i + k));
    // avoid a lonely last chunk of 1 when we could balance
    if (out.length > 1 && out[out.length - 1].length === 1 && k > 2) out[out.length - 1].unshift(out[out.length - 2].pop());
    return out;
  };
  // unique arg-opt of [{x, v}] ; returns {best, unique}
  const pick = (opts, max) => {
    const s = opts.slice().sort((a, b) => (max ? b.v - a.v : a.v - b.v));
    return { best: s[0], unique: s.length < 2 || s[1].v !== s[0].v };
  };
  const NOTES_OPT = { key: 'notes', label: 'Ders notundaki örneği kullan', type: 'checkbox', default: false };

  // =================================================================== 6.2 Network
  const JOE = {
    N: 5,
    stages: [[1], [2, 3, 4], [5, 6, 7], [8, 9], [10]],
    c: {
      1: { 2: 550, 3: 900, 4: 770 },
      2: { 5: 680, 6: 790, 7: 1050 },
      3: { 5: 580, 6: 760, 7: 660 },
      4: { 5: 510, 6: 700, 7: 830 },
      5: { 8: 610, 9: 790 },
      6: { 8: 540, 9: 940 },
      7: { 8: 790, 9: 270 },
      8: { 10: 1030 },
      9: { 10: 1390 },
    },
    n: 10,
  };

  function genNetwork(rng, N) {
    const sizes = [1];
    for (let s = 1; s < N - 1; s++) sizes.push(rng.int(2, 3));
    sizes.push(1);
    let id = 1;
    const stages = sizes.map((m) => Array.from({ length: m }, () => id++));
    const c = {};
    for (let s = 0; s < N - 1; s++)
      for (const i of stages[s]) {
        c[i] = {};
        for (const j of stages[s + 1]) c[i][j] = rng.int(2, 19);
      }
    return { N, stages, c, n: id - 1 };
  }

  function solveNetwork(P) {
    const f = { [P.n]: 0 };
    const nxt = {};
    const cand = {};
    let unique = true;
    for (let s = P.N - 2; s >= 0; s--)
      for (const i of P.stages[s]) {
        const o = P.stages[s + 1].map((j) => ({ x: j, v: P.c[i][j] + f[j] }));
        const r = pick(o, false);
        if (!r.unique) unique = false;
        f[i] = r.best.v;
        nxt[i] = r.best.x;
        cand[i] = o;
      }
    const path = [1];
    while (path[path.length - 1] !== P.n) path.push(nxt[path[path.length - 1]]);
    return { f, nxt, cand, path, unique };
  }

  // greedy (always the cheapest next arc) — used only to reject instances where greedy is optimal
  function greedyPath(P) {
    const path = [1];
    let len = 0;
    for (let s = 0; s < P.N - 1; s++) {
      const i = path[s];
      const j = P.stages[s + 1].reduce((a, b) => (P.c[i][b] < P.c[i][a] ? b : a));
      len += P.c[i][j];
      path.push(j);
    }
    return { path, len };
  }

  // SVG drawing of the staged network. known: set of node ids whose f is known; arcsOn: {i: j} optimal arcs; path: array
  function netViz(P, sol, o) {
    o = o || {};
    const known = o.known || {};
    const best = o.best || {};
    const onPath = {};
    (o.path || []).forEach((v, k, a) => k + 1 < a.length && (onPath[v + '-' + a[k + 1]] = true));
    const GX = P.N === 5 ? 112 : 136;
    const GY = 72;
    const maxM = Math.max(...P.stages.map((s) => s.length));
    const W = 36 * 2 + GX * (P.N - 1);
    const H = 46 + GY * (maxM - 1) + 40;
    const pos = {};
    P.stages.forEach((st, s) =>
      st.forEach((v, k) => {
        pos[v] = [36 + GX * s, 40 + (H - 66) / 2 + (k - (st.length - 1) / 2) * GY];
      })
    );
    const big = P.n === 10 && P.c[1][2] === 550;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;margin:0 auto">`;
    P.stages.forEach((st, s) => {
      svg += `<text x="${36 + GX * s}" y="13" text-anchor="middle" style="font-size:10.5px;fill:var(--muted)">Stage ${s + 1}</text>`;
    });
    const arcs = [];
    for (let s = 0; s < P.N - 1; s++) for (const i of P.stages[s]) for (const j of P.stages[s + 1]) arcs.push([i, j]);
    arcs.forEach(([i, j]) => {
      const [x1, y1] = pos[i];
      const [x2, y2] = pos[j];
      const hot = onPath[i + '-' + j];
      const opt = best[i] === j;
      const st = hot ? 'stroke:var(--gold);stroke-width:4' : opt ? 'stroke:var(--good);stroke-width:2.6' : 'stroke:var(--line);stroke-width:1.4';
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="${st};stroke-linecap:round"/>`;
    });
    arcs.forEach(([i, j]) => {
      const [x1, y1] = pos[i];
      const [x2, y2] = pos[j];
      const fr = P.stages[0].includes(i) || P.stages[P.N - 1].includes(j) ? 0.5 : 0.27;
      const x = x1 + fr * (x2 - x1);
      const y = y1 + fr * (y2 - y1);
      svg += `<text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="middle" style="font-size:${big ? 9.5 : 11}px;font-family:var(--mono);fill:var(--ink);paint-order:stroke;stroke:var(--card);stroke-width:3.5px">${P.c[i][j]}</text>`;
    });
    Object.keys(pos).forEach((v) => {
      const [x, y] = pos[v];
      const isKnown = known[v] != null;
      const fill = isKnown ? 'var(--good-soft)' : 'var(--card)';
      const stroke = isKnown ? 'var(--good)' : 'var(--muted)';
      svg += `<circle cx="${x}" cy="${y}" r="13" style="fill:${fill};stroke:${stroke};stroke-width:2"/>`;
      svg += `<text x="${x}" y="${y + 4.5}" text-anchor="middle" style="font-size:12.5px;font-weight:700;fill:var(--ink)">${v}</text>`;
      if (isKnown)
        svg += `<text x="${x}" y="${y - 18}" text-anchor="middle" style="font-size:10.5px;font-family:var(--mono);fill:var(--good);font-weight:700;paint-order:stroke;stroke:var(--card);stroke-width:3px">${known[v]}</text>`;
    });
    svg += '</svg>';
    return {
      type: 'html',
      html: `<div class="viz-cap">${o.caption || 'Ağ (arc etiketleri = c<sub>ij</sub>)'}</div>${svg}<div class="muted" style="font-size:11.5px;text-align:center">Düğüm üstündeki yeşil sayı = bulunan f<sub>t</sub>(i); yeşil arc = o düğümden optimal arc${o.path ? '; sarı = en kısa yol' : ''}.</div>`,
    };
  }

  function netStageTable(P, sol, s, filled) {
    const t = s + 1;
    const rows = P.stages[s];
    const cols = P.stages[s + 1];
    return {
      type: 'matrix',
      caption: `Stage ${t}: c<sub>ij</sub> + f${S(t + 1)}(j)`,
      corner: 'i \\ j',
      rowLabels: rows,
      colLabels: cols.map((j) => `${j}<br><span class="muted" style="font-weight:400">f${S(t + 1)}=${sol.f[j]}</span>`).concat([`f${S(t)}(i)`, 'sonraki']),
      cells: rows.map((i) => cols.map((j) => (filled ? `${P.c[i][j]}+${sol.f[j]}=${P.c[i][j] + sol.f[j]}` : '?')).concat(filled ? [sol.f[i], sol.nxt[i]] : ['?', '?'])),
      cls: rows.map((i) => cols.map((j) => (filled && sol.nxt[i] === j ? 'hl' : '')).concat(filled ? ['sel', 'sel'] : ['', ''])),
    };
  }

  function buildNetwork(rng, opts) {
    opts = opts || {};
    let P, sol;
    if (opts.notes) {
      P = JOE;
      sol = solveNetwork(P);
    } else {
      const nOpt = String(opts.stages || 'mix');
      for (let tries = 0; tries < 2000 && !P; tries++) {
        const N = nOpt === '4' ? 4 : nOpt === '5' ? 5 : rng.int(4, 5);
        const Q = genNetwork(rng, N);
        const r = solveNetwork(Q);
        if (!r.unique) continue;
        if (Q.stages.slice(1, -1).every((st) => st.length === 2)) continue; // at least one 3-node stage
        const g = greedyPath(Q);
        if (g.len === r.f[1]) continue; // greedy would already be optimal -> less instructive
        P = Q;
        sol = r;
      }
      if (!P) throw new Error('uygun ağ bulunamadı');
    }
    const N = P.N;
    const steps = [];
    const known = {};
    const best = {};
    const lastMid = N - 2; // index of the last stage that has a decision (single arc to the destination)
    const dest = P.n;
    const snap = () => Object.assign({}, known);
    const snapB = () => Object.assign({}, best);

    // ---- stage N-1: only one arc to the destination
    {
      const st = P.stages[lastMid];
      const before = snap();
      st.forEach((i) => {
        known[i] = sol.f[i];
        best[i] = dest;
      });
      steps.push({
        kind: 'number',
        prompt: `<b>Stage ${N - 1} hesapları.</b> Geriye doğru (backward) çalışıyoruz: f${S(N)}(${dest}) = 0. Stage ${N - 1} düğümlerinden hedefe (${dest}) tek bir arc var. f${S(N - 1)}(i) değerlerini yaz.`,
        fields: st.map((i) => ({ label: fx(N - 1, i), answer: sol.f[i] })),
        hint: `Stage ${N - 1}'deki her düğümden ${dest}'a yalnızca bir yol var: f${S(N - 1)}(i) = c<sub>i,${dest}</sub>.`,
        explain: st.map((i) => `${fx(N - 1, i)} = c<sub>${i},${dest}</sub> + f${S(N)}(${dest}) = ${P.c[i][dest]} + 0 = <b>${sol.f[i]}</b>`).join('<br>'),
        vizDuring: netViz(P, sol, { known: before, best: {} }),
        viz: netViz(P, sol, { known: snap(), best: snapB() }),
      });
    }
    // ---- stages N-2 .. 1
    for (let s = lastMid - 1; s >= 0; s--) {
      const t = s + 1;
      const st = P.stages[s];
      const before = snap();
      const beforeB = snapB();
      st.forEach((i) => {
        known[i] = sol.f[i];
        best[i] = sol.nxt[i];
      });
      const lines = st
        .map((i) => {
          const o = sol.cand[i];
          return `${fx(t, i)} = min{ ${o.map((c) => `c<sub>${i}${c.x}</sub> + ${fx(t + 1, c.x)}`).join(', ')} } = min{ ${o
            .map((c) => `${P.c[i][c.x]} + ${sol.f[c.x]} = ${c.v}${c.x === sol.nxt[i] ? '*' : ''}`)
            .join(', ')} } = <b>${sol.f[i]}</b> → ${i}'den sonra <b>${sol.nxt[i]}</b>'e git.`;
        })
        .join('<br>');
      const first = s === 0;
      steps.push({
        kind: 'number',
        prompt: first
          ? `<b>Stage 1 hesapları.</b> f${S(2)}(·) değerlerini kullanarak f${S(1)}(1)'i (1'den ${dest}'a en kısa yolun uzunluğu) ve 1'den sonra gidilecek düğümü bul.`
          : `<b>Stage ${t} hesapları.</b> Her stage ${t} düğümü i için f${S(t)}(i) = min<sub>j</sub> { c<sub>ij</sub> + f${S(t + 1)}(j) } (j: stage ${t + 1} düğümü). f değerini ve minimumu veren <b>sonraki düğümü</b> yaz.`,
        fields: st.flatMap((i) => [
          { label: fx(t, i), answer: sol.f[i] },
          { label: `${i}'den sonraki düğüm`, answer: sol.nxt[i] },
        ]),
        hint: `Her j için c<sub>ij</sub> + f${S(t + 1)}(j) topla (f${S(t + 1)} değerleri tablonun başlığında); en küçüğü f${S(t)}(i), onu veren j sonraki düğümdür.`,
        explain: lines + '<br><span class="muted">(* = f değerini veren arc)</span>',
        vizDuring: [netViz(P, sol, { known: before, best: beforeB }), netStageTable(P, sol, s, false)],
        viz: [netViz(P, sol, { known: snap(), best: snapB() }), netStageTable(P, sol, s, true)],
      });
    }
    // ---- forward: path
    const trace = sol.path
      .slice(0, -1)
      .map((v, k) => `${fx(k + 1, v)} değerini veren arc ${v}→${sol.path[k + 1]}`)
      .join('; ');
    steps.push({
      kind: 'sequence',
      prompt: `Şimdi <b>ileriye doğru</b> geri izle (retrace): 1'den başlayıp her düğümde f değerini veren arc'ı takip et. 1'den ${dest}'a <b>en kısa yolu</b> yaz.`,
      sequence: { answer: sol.path, placeholder: `ör. 1-3-5-8-${dest}` },
      hint: 'Önce 1\'den sonraki düğüm (Stage 1 sonucu), sonra o düğümden sonraki düğüm (kendi stage tablosu) … hedefe kadar.',
      explain: `${trace}. En kısa yol: <b>${sol.path.join('–')}</b>, uzunluğu f${S(1)}(1) = <b>${sol.f[1]}</b> = ${sol.path
        .slice(0, -1)
        .map((v, k) => P.c[v][sol.path[k + 1]])
        .join(' + ')}.`,
      viz: netViz(P, sol, { known: snap(), best: snapB(), path: sol.path, caption: `En kısa yol: ${sol.path.join('–')} (uzunluk ${sol.f[1]})` }),
    });
    const nPaths = P.stages.reduce((a, s) => a * s.length, 1);
    const g = greedyPath(P);
    steps.push({
      kind: 'info',
      prompt: `<b>Kontrol.</b> Bu ağda 1'den ${dest}'a toplam ${P.stages
        .slice(1, -1)
        .map((s) => s.length)
        .join(' × ')} = <b>${nPaths}</b> yol var; hepsini saymak (explicit enumeration) aynı sonucu verir (${sol.f[1]}). Notların dediği gibi büyük ağlarda DP, tüm yolları saymaktan çok daha verimlidir. ${
        g.len === sol.f[1]
          ? ''
          : `<br>Not (notlarda yok): her adımda en ucuz arc'ı seçen “açgözlü” yol ${g.path.join('–')} = ${g.len} olurdu; optimal değil. DP, bir arc'ın <i>gelecekteki</i> maliyetini f${S('t+1')} ile hesaba katar (principle of optimality).`
      }`,
    });

    const names = P === JOE ? ' (1 = New York, 10 = Los Angeles)' : '';
    return {
      title: P === JOE ? 'DP · Network Problem (Örnek 6.3, Joe Cougar)' : 'DP · Network (Shortest Path) Problem',
      statement: `<p>${N} stage'li ağda 1. düğümden ${dest}. düğüme <b>en kısa yolu</b> DP ile (geriye doğru) bul${names}. Stage t düğümünden yalnızca stage t+1 düğümlerine gidilebilir; arc uzunlukları c<sub>ij</sub> şekilde.</p>
        <p>f<sub>t</sub>(i) = stage t'deki i düğümünden ${dest}'a en kısa yolun uzunluğu:<br>
        <b>f<sub>t</sub>(i) = min<sub>j</sub> { c<sub>ij</sub> + f<sub>t+1</sub>(j) }</b>, j bir stage t+1 düğümü, f<sub>${N}</sub>(${dest}) = 0.</p>`,
      viz: netViz(P, sol, {}),
      steps,
      data: P,
      solution: `En kısa yol <b>${sol.path.join('–')}</b>, uzunluk f<sub>1</sub>(1) = <b>${sol.f[1]}</b>.`,
    };
  }

  OR.registerDrill({
    id: 'dp-network',
    topic: '6.2',
    title: 'DP · Network (Shortest Path)',
    description: 'Rastgele stage\'li ağda (Joe Cougar örneği gibi) f<sub>t</sub>(i) değerlerini stage stage geriye doğru hesapla, her düğümde optimal arc\'ı belirle, sonra en kısa yolu ileriye doğru oku.',
    options: [
      {
        key: 'stages',
        label: 'Stage sayısı',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: '4–5 (karışık)' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
        ],
      },
      NOTES_OPT,
    ],
    solve: solveNetwork,
    gen: genNetwork,
    JOE,
    generate: (rng, opts) => buildNetwork(rng, opts),
  });

  // =================================================================== shared stage table (rows = states, cols = decisions)
  // spec: {caption, states, decisions, cell(d,x) -> number|null, f(d), x(d), shown(d) -> bool, rowName, colName, fName}
  function stageTable(o) {
    return {
      type: 'matrix',
      caption: o.caption,
      corner: `${o.rowName} \\ ${o.colName}`,
      rowLabels: o.states,
      colLabels: o.decisions.concat([o.fName, o.xName]),
      cells: o.states.map((d) =>
        o.decisions.map((x) => {
          const v = o.cell(d, x);
          if (v == null) return '—';
          return o.shown(d) ? String(v) : '?';
        }).concat(o.shown(d) ? [o.f(d), o.x(d)] : ['?', '?'])
      ),
      cls: o.states.map((d) =>
        o.decisions.map((x) => {
          const v = o.cell(d, x);
          if (v == null) return 'dim';
          return o.shown(d) && v === o.f(d) ? 'hl' : '';
        }).concat(o.shown(d) ? ['sel', 'sel'] : ['', ''])
      ),
    };
  }

  // =================================================================== 6.5 Resource allocation
  const FINCO = {
    D: 6,
    r: [
      [0, 9, 16, 23, 30, 37, 44],
      [0, 10, 13, 16, 19, 22, 25],
      [0, 9, 13, 17, 21, 25, 29],
    ],
    affine: [
      [7, 2],
      [3, 7],
      [4, 5],
    ],
  };

  function genResource(rng, D) {
    const affine = rng.chance(0.5);
    const r = [];
    const aff = [];
    for (let j = 0; j < 3; j++) {
      const row = [0];
      if (affine) {
        const a = rng.int(2, 8);
        const b = rng.int(1, 8);
        aff.push([a, b]);
        for (let d = 1; d <= D; d++) row.push(a * d + b);
      } else {
        let cur = 0;
        for (let d = 1; d <= D; d++) {
          cur += d === 1 ? rng.int(4, 11) : rng.int(1, 7);
          row.push(cur);
        }
      }
      r.push(row);
    }
    return { D, r, affine: affine ? aff : null };
  }

  function solveResource(P) {
    const D = P.D;
    const f = [null, [], [], []];
    const x = [null, [], [], []];
    const cand = [null, [], [], []];
    let unique = true;
    for (let d = 0; d <= D; d++) {
      f[3][d] = P.r[2][d];
      x[3][d] = d;
    }
    for (let d = 0; d <= D; d++) {
      const o = [];
      for (let k = 0; k <= d; k++) o.push({ x: k, v: P.r[1][k] + f[3][d - k] });
      const r = pick(o, true);
      if (!r.unique) unique = false;
      f[2][d] = r.best.v;
      x[2][d] = r.best.x;
      cand[2][d] = o;
    }
    {
      const o = [];
      for (let k = 0; k <= D; k++) o.push({ x: k, v: P.r[0][k] + f[2][D - k] });
      const r = pick(o, true);
      if (!r.unique) unique = false;
      f[1][D] = r.best.v;
      x[1][D] = r.best.x;
      cand[1][D] = o;
    }
    const a1 = x[1][D];
    const a2 = x[2][D - a1];
    const a3 = D - a1 - a2;
    return { f, x, cand, alloc: [a1, a2, a3], z: f[1][D], unique };
  }

  function resDataViz(P, sol, upto) {
    // upto: which f columns are known: 3 -> f3, 2 -> f3,f2 ...
    const D = P.D;
    const cols = ['r<sub>1</sub>(d)', 'r<sub>2</sub>(d)', 'r<sub>3</sub>(d)'];
    if (upto <= 3) cols.push('f<sub>3</sub>(d)');
    if (upto <= 2) cols.push('f<sub>2</sub>(d)', 'x<sub>2</sub>(d)');
    return {
      type: 'matrix',
      caption: 'Getiri tablosu r<sub>j</sub>(d) (d = yatırılan birim)' + (upto <= 3 ? ' ve bulunan f değerleri' : ''),
      corner: 'd',
      rowLabels: OR.util.range(D + 1),
      colLabels: cols,
      cells: OR.util.range(D + 1).map((d) => {
        const row = [P.r[0][d], P.r[1][d], P.r[2][d]];
        if (upto <= 3) row.push(sol.f[3][d]);
        if (upto <= 2) row.push(sol.f[2][d], sol.x[2][d]);
        return row;
      }),
      cls: OR.util.range(D + 1).map(() => ['', '', ''].concat(upto <= 3 ? ['hl'] : []).concat(upto <= 2 ? ['hl', 'hl'] : [])),
    };
  }

  function buildResource(rng, opts) {
    opts = opts || {};
    let P, sol;
    if (opts.notes) {
      P = FINCO;
      sol = solveResource(P);
    } else {
      const dOpt = String(opts.D || 'mix');
      for (let tries = 0; tries < 3000 && !P; tries++) {
        const D = dOpt === 'mix' ? rng.int(4, 6) : +dOpt;
        const Q = genResource(rng, D);
        const r = solveResource(Q);
        if (!r.unique) continue;
        if (r.alloc.filter((a) => a > 0).length < 2) continue; // at least two investments used
        P = Q;
        sol = r;
      }
      if (!P) throw new Error('uygun kaynak dağıtımı örneği bulunamadı');
    }
    const D = P.D;
    const unit = P === FINCO ? '$1000' : 'birim';
    const steps = [];
    const st2 = OR.util.range(D + 1);
    let shown2 = {};
    const tbl2 = (cap) =>
      stageTable({
        caption: cap || 'Stage 2: r<sub>2</sub>(x<sub>2</sub>) + f<sub>3</sub>(d<sub>2</sub> − x<sub>2</sub>)',
        states: st2,
        decisions: st2,
        rowName: 'd<sub>2</sub>',
        colName: 'x<sub>2</sub>',
        fName: 'f<sub>2</sub>(d<sub>2</sub>)',
        xName: 'x<sub>2</sub>(d<sub>2</sub>)',
        cell: (d, x) => (x <= d ? P.r[1][x] + sol.f[3][d - x] : null),
        f: (d) => sol.f[2][d],
        x: (d) => sol.x[2][d],
        shown: ((s) => (d) => !!s[d])(Object.assign({}, shown2)),
      });

    steps.push({
      kind: 'number',
      prompt: `<b>Stage 3 hesapları.</b> Sadece 3. yatırım kaldığında, eldeki d<sub>3</sub> birimin tamamı 3. yatırıma konur: f<sub>3</sub>(d<sub>3</sub>) = r<sub>3</sub>(d<sub>3</sub>), x<sub>3</sub>(d<sub>3</sub>) = d<sub>3</sub>. Kontrol için f<sub>3</sub>(${D}) ve f<sub>3</sub>(${Math.floor(D / 2)}) değerlerini yaz.`,
      fields: [
        { label: fx(3, D), answer: sol.f[3][D] },
        { label: fx(3, Math.floor(D / 2)), answer: sol.f[3][Math.floor(D / 2)] },
      ],
      hint: 'Tablodaki r₃(d) sütununu oku.',
      explain: OR.util.range(D + 1).map((d) => `f<sub>3</sub>(${d}) = ${sol.f[3][d]}, x<sub>3</sub>(${d}) = ${d}`).join(' · '),
      viz: resDataViz(P, sol, 3),
    });

    // stage 2, rows 1..D in chunks (row 0 trivial)
    const rows = OR.util.range(D + 1).slice(1);
    shown2[0] = true;
    chunk(rows, 3).forEach((ch) => {
      const during = tbl2();
      ch.forEach((d) => (shown2[d] = true));
      const after = tbl2();
      steps.push({
        kind: 'number',
        prompt: `<b>Stage 2 hesapları</b> (d<sub>2</sub> = ${ch.join(', ')}). f<sub>2</sub>(d<sub>2</sub>) = max { r<sub>2</sub>(x<sub>2</sub>) + f<sub>3</sub>(d<sub>2</sub> − x<sub>2</sub>) }, x<sub>2</sub> ∈ {0, 1, …, d<sub>2</sub>}. Her d<sub>2</sub> için f<sub>2</sub> ve maksimumu veren x<sub>2</sub>(d<sub>2</sub>) değerini yaz.${ch[0] === 1 ? ' (d<sub>2</sub> = 0 için f<sub>2</sub>(0) = 0, x<sub>2</sub>(0) = 0.)' : ''}`,
        fields: ch.flatMap((d) => [
          { label: fx(2, d), answer: sol.f[2][d] },
          { label: `x${S(2)}(${d})`, answer: sol.x[2][d] },
        ]),
        hint: 'Her x₂ için 2. yatırımın getirisi r₂(x₂) ile kalan paranın 3. yatırımdaki en iyi getirisi f₃(d₂ − x₂) toplanır; en büyüğü seçilir.',
        explain: ch
          .map(
            (d) =>
              `${fx(2, d)} = max{ ${sol.cand[2][d].map((c) => `${P.r[1][c.x]} + ${sol.f[3][d - c.x]} = ${c.v}${c.x === sol.x[2][d] ? '*' : ''}`).join(', ')} } = <b>${sol.f[2][d]}</b>, x<sub>2</sub>(${d}) = <b>${sol.x[2][d]}</b>`
          )
          .join('<br>') + '<br><span class="muted">(sıra x₂ = 0, 1, 2, …; * = maksimum)</span>',
        vizDuring: [resDataViz(P, sol, 3), during],
        viz: [resDataViz(P, sol, 3), after],
      });
    });

    // stage 1
    const c1 = sol.cand[1][D];
    const tbl1 = (shown) => ({
      type: 'matrix',
      caption: `Stage 1: r<sub>1</sub>(x<sub>1</sub>) + f<sub>2</sub>(${D} − x<sub>1</sub>)`,
      corner: 'd<sub>1</sub> \\ x<sub>1</sub>',
      rowLabels: [D],
      colLabels: OR.util.range(D + 1).concat([`f<sub>1</sub>(${D})`, `x<sub>1</sub>(${D})`]),
      cells: [c1.map((c) => (shown ? `${P.r[0][c.x]}+${sol.f[2][D - c.x]}=${c.v}` : '?')).concat(shown ? [sol.f[1][D], sol.x[1][D]] : ['?', '?'])],
      cls: [c1.map((c) => (shown && c.x === sol.x[1][D] ? 'hl' : '')).concat(shown ? ['sel', 'sel'] : ['', ''])],
    });
    steps.push({
      kind: 'number',
      prompt: `<b>Stage 1 hesapları.</b> Başlangıçta ${D} birim var, bu yüzden sadece f<sub>1</sub>(${D}) gerekir: f<sub>1</sub>(${D}) = max { r<sub>1</sub>(x<sub>1</sub>) + f<sub>2</sub>(${D} − x<sub>1</sub>) }, x<sub>1</sub> ∈ {0, …, ${D}}.`,
      fields: [
        { label: fx(1, D), answer: sol.f[1][D] },
        { label: `x${S(1)}(${D})`, answer: sol.x[1][D] },
      ],
      hint: 'f₂ sütunu artık tabloda; her x₁ için r₁(x₁) + f₂(D − x₁) hesapla.',
      explain: `${fx(1, D)} = max{ ${c1.map((c) => `${P.r[0][c.x]} + ${sol.f[2][D - c.x]} = ${c.v}${c.x === sol.x[1][D] ? '*' : ''}`).join(', ')} } = <b>${sol.f[1][D]}</b>, x<sub>1</sub>(${D}) = <b>${sol.x[1][D]}</b>.`,
      vizDuring: [resDataViz(P, sol, 2), tbl1(false)],
      viz: [resDataViz(P, sol, 2), tbl1(true)],
    });
    const [a1, a2, a3] = sol.alloc;
    steps.push({
      kind: 'number',
      prompt: '<b>Optimal çözüm ve rapor.</b> Adımlarını geri izleyerek (retrace) her yatırıma ayrılacak miktarı bul.',
      fields: [
        { label: 'd<sub>1</sub> (1. yatırım)', answer: a1 },
        { label: 'd<sub>2</sub> (2. yatırım)', answer: a2 },
        { label: 'd<sub>3</sub> (3. yatırım)', answer: a3 },
      ],
      hint: `x₁(${D}) birimi 1. yatırıma koy; kalan ${D} − x₁ birim için x₂(·) tablosuna bak; kalan her şey 3. yatırıma.`,
      explain: `x<sub>1</sub>(${D}) = ${a1} → kalan ${D} − ${a1} = ${D - a1}; x<sub>2</sub>(${D - a1}) = ${a2} → kalan ${D - a1 - a2}; x<sub>3</sub>(${a3}) = ${a3}. Toplam getiri r<sub>1</sub>(${a1}) + r<sub>2</sub>(${a2}) + r<sub>3</sub>(${a3}) = ${P.r[0][a1]} + ${P.r[1][a2]} + ${P.r[2][a3]} = <b>${sol.z}</b> = f<sub>1</sub>(${D}) ✓.`,
    });

    const affTxt = P.affine
      ? `<p class="muted">Getiriler r<sub>j</sub>(d) = a<sub>j</sub>d + b<sub>j</sub> (d &gt; 0), r<sub>j</sub>(0) = 0 biçiminde: ${P.affine
          .map(([a, b], j) => `r<sub>${j + 1}</sub> = ${a}d + ${b}`)
          .join(', ')}. Getiri yatırımla <b>orantılı değil</b> (ör. r<sub>1</sub>(2) = ${P.r[0][2]} ≠ 2r<sub>1</sub>(1) = ${2 * P.r[0][1]}), bu yüzden LP kullanılamaz.</p>`
      : '';
    return {
      title: P === FINCO ? 'DP · Resource Allocation (Örnek 6.5, Finco)' : 'DP · Resource Allocation',
      statement: `<p>${P === FINCO ? 'Finco' : 'Bir firma'} ${D} ${unit === 'birim' ? 'birim parayı' : '× $1000 parayı'} üç yatırıma dağıtacak (tam katlar halinde; toplam tam olarak ${D}). j. yatırıma d<sub>j</sub> birim konursa net bugünkü değer r<sub>j</sub>(d<sub>j</sub>) elde edilir (sağdaki tablo). Toplam NPV'yi <b>maksimize</b> et.</p>
        ${affTxt}
        <p>Stage t = yatırımlar t, t+1, …, 3'e para dağıtılıyor; state d<sub>t</sub> = bu yatırımlar için kalan para.<br>
        <b>f<sub>t</sub>(d<sub>t</sub>) = max<sub>0≤x<sub>t</sub>≤d<sub>t</sub></sub> { r<sub>t</sub>(x<sub>t</sub>) + f<sub>t+1</sub>(d<sub>t</sub> − x<sub>t</sub>) }</b>, f<sub>3</sub>(d<sub>3</sub>) = r<sub>3</sub>(d<sub>3</sub>).</p>`,
      viz: resDataViz(P, sol, 4),
      steps,
      data: P,
      solution: `Optimal dağıtım: 1. yatırım ${a1}, 2. yatırım ${a2}, 3. yatırım ${a3} birim; maksimum NPV f<sub>1</sub>(${D}) = <b>${sol.z}</b>.`,
    };
  }

  OR.registerDrill({
    id: 'dp-resource',
    topic: '6.5',
    title: 'DP · Resource Allocation',
    description: 'Finco örneği gibi: D birim para 3 yatırıma dağıtılır, getiriler tabloyla verilir. f<sub>3</sub>, f<sub>2</sub>(d) tablolarını ve f<sub>1</sub>(D)\'yi geriye doğru doldur, optimal x<sub>t</sub>(d) kararlarını bul, dağıtımı geri izle.',
    options: [
      {
        key: 'D',
        label: 'Toplam kaynak',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: '4–6 (karışık)' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6' },
        ],
      },
      NOTES_OPT,
    ],
    solve: solveResource,
    gen: genResource,
    FINCO,
    generate: (rng, opts) => buildResource(rng, opts),
  });

  // =================================================================== 6.5.2 Knapsack by DP
  const KNAP_NOTES = { W: 10, w: [4, 3, 5], b: [11, 7, 12] };

  function genKnap(rng) {
    const ws = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 3);
    const b = ws.map((w) => rng.int(2 * w, 3 * w + 2));
    const W = rng.int(Math.max(8, Math.max(...ws) + 3), 12);
    return { W, w: ws, b };
  }

  // stage formulation f_t(d), t = 1..3 (items in the given order)
  function solveKnapStages(P) {
    const W = P.W;
    const f = [null, [], [], [], []];
    const x = [null, [], [], []];
    const cand = [null, [], [], []];
    let unique = true;
    for (let d = 0; d <= W; d++) f[4][d] = 0;
    for (let t = 3; t >= 1; t--) {
      const ds = t === 1 ? [W] : OR.util.range(W + 1);
      for (const d of ds) {
        const o = [];
        for (let k = 0; k * P.w[t - 1] <= d; k++) o.push({ x: k, v: P.b[t - 1] * k + f[t + 1][d - P.w[t - 1] * k] });
        const r = pick(o, true);
        if (!r.unique && t <= 2) unique = false; // stage 3 is always unique (single best = floor)
        f[t][d] = r.best.v;
        x[t][d] = r.best.x;
        cand[t][d] = o;
      }
    }
    const n1 = x[1][W];
    const n2 = x[2][W - P.w[0] * n1];
    const n3 = x[3][W - P.w[0] * n1 - P.w[1] * n2];
    return { f, x, cand, counts: [n1, n2, n3], z: f[1][W], unique };
  }

  // alternative formulation (8): g(w) = max_j { b_j + g(w - w_j) }
  function solveKnapG(P) {
    const g = [];
    const cand = [];
    const arg = [];
    for (let w = 0; w <= P.W; w++) {
      const o = [];
      P.w.forEach((wj, j) => wj <= w && o.push({ x: j, v: P.b[j] + g[w - wj] }));
      if (!o.length) {
        g[w] = 0;
        cand[w] = [];
        arg[w] = [];
        continue;
      }
      const m = Math.max(...o.map((c) => c.v));
      g[w] = m;
      cand[w] = o;
      arg[w] = o.filter((c) => c.v === m).map((c) => c.x);
    }
    // retrace (choose the smallest index attaining)
    const counts = [0, 0, 0];
    let w = P.W;
    while (arg[w] && arg[w].length) {
      const j = arg[w][0];
      counts[j]++;
      w -= P.w[j];
    }
    return { g, cand, arg, counts, z: g[P.W] };
  }

  function knapItemsViz(P) {
    return {
      type: 'matrix',
      caption: `Eşyalar (knapsack kapasitesi ${P.W}; her tipten istenen sayıda konabilir)`,
      corner: 'Item',
      rowLabels: [1, 2, 3],
      colLabels: ['Weight', 'Benefit'],
      cells: [0, 1, 2].map((j) => [P.w[j], P.b[j]]),
    };
  }

  function buildKnap(rng, opts) {
    opts = opts || {};
    const alt = !!opts.alt;
    let P, sol, solG;
    if (opts.notes) {
      P = KNAP_NOTES;
      sol = solveKnapStages(P);
      solG = solveKnapG(P);
    } else {
      for (let tries = 0; tries < 4000 && !P; tries++) {
        const Q = genKnap(rng);
        const r = solveKnapStages(Q);
        if (!r.unique) continue;
        if (r.counts.filter((c) => c > 0).length < 2) continue;
        // ratio-greedy should not be optimal (instructive) — most of the time
        const order = [0, 1, 2].sort((a, b) => Q.b[b] / Q.w[b] - Q.b[a] / Q.w[a]);
        let cap = Q.W;
        let gv = 0;
        order.forEach((j) => {
          const k = Math.floor(cap / Q.w[j]);
          gv += k * Q.b[j];
          cap -= k * Q.w[j];
        });
        if (gv === r.z && rng.chance(0.7)) continue;
        P = Q;
        sol = r;
        solG = solveKnapG(Q);
      }
      if (!P) throw new Error('uygun knapsack örneği bulunamadı');
    }
    const W = P.W;
    const [w1, w2, w3] = P.w;
    const [b1, b2, b3] = P.b;
    const steps = [];
    const [n1, n2, n3] = sol.counts;
    const itemsTxt = `${[0, 1, 2]
      .filter((j) => sol.counts[j] > 0)
      .map((j) => `${sol.counts[j]} adet Type ${j + 1}`)
      .join(' + ')}`;

    if (!alt) {
      // ---------- stage 3
      steps.push({
        kind: 'number',
        prompt: `<b>Stage 3 hesapları.</b> Sadece Type 3 kaldığında: f<sub>3</sub>(d) = max { ${b3}x<sub>3</sub> }, ${w3}x<sub>3</sub> ≤ d → x<sub>3</sub>(d) = ⌊d/${w3}⌋. f<sub>3</sub>(${W}) ve x<sub>3</sub>(${W}) nedir?`,
        fields: [
          { label: fx(3, W), answer: sol.f[3][W] },
          { label: `x${S(3)}(${W})`, answer: sol.x[3][W] },
        ],
        hint: `${W} kapasiteye kaç tane ${w3} ağırlıklı eşya sığar?`,
        explain: `f<sub>3</sub>(d) = ${b3}·⌊d/${w3}⌋: ${OR.util
          .range(W + 1)
          .map((d) => `f<sub>3</sub>(${d}) = ${sol.f[3][d]}`)
          .join(', ')}.`,
        viz: [knapItemsViz(P), knapFViz(P, sol, 3)],
      });
      // ---------- stage 2
      const rows = OR.util.range(W + 1).filter((d) => d >= w2);
      const trivial = OR.util.range(W + 1).filter((d) => d < w2);
      const shown = {};
      trivial.forEach((d) => (shown[d] = true));
      const maxK2 = Math.floor(W / w2);
      const tbl2 = () =>
        stageTable({
          caption: `Stage 2: ${b2}x<sub>2</sub> + f<sub>3</sub>(d − ${w2}x<sub>2</sub>)`,
          states: OR.util.range(W + 1),
          decisions: OR.util.range(maxK2 + 1),
          rowName: 'd',
          colName: 'x<sub>2</sub>',
          fName: 'f<sub>2</sub>(d)',
          xName: 'x<sub>2</sub>(d)',
          cell: (d, k) => (k * w2 <= d ? b2 * k + sol.f[3][d - w2 * k] : null),
          f: (d) => sol.f[2][d],
          x: (d) => sol.x[2][d],
          shown: ((s) => (d) => !!s[d])(Object.assign({}, shown)),
        });
      chunk(rows.slice().reverse(), 3).forEach((ch, ci) => {
        const during = tbl2();
        ch.forEach((d) => (shown[d] = true));
        const after = tbl2();
        steps.push({
          kind: 'number',
          prompt: `<b>Stage 2 hesapları</b> (d = ${ch.join(', ')}). f<sub>2</sub>(d) = max { ${b2}x<sub>2</sub> + f<sub>3</sub>(d − ${w2}x<sub>2</sub>) }, ${w2}x<sub>2</sub> ≤ d. f<sub>2</sub>(d) ve x<sub>2</sub>(d) değerlerini yaz.${
            ci === 0 && trivial.length ? ` (d &lt; ${w2} için x<sub>2</sub> = 0 zorunlu: f<sub>2</sub>(d) = f<sub>3</sub>(d).)` : ''
          }`,
          fields: ch.flatMap((d) => [
            { label: fx(2, d), answer: sol.f[2][d] },
            { label: `x${S(2)}(${d})`, answer: sol.x[2][d] },
          ]),
          hint: `x₂ = 0, 1, … (${w2}x₂ ≤ d) için ${b2}x₂ + f₃(d − ${w2}x₂) hesapla; en büyüğünü seç.`,
          explain: ch
            .map(
              (d) =>
                `${fx(2, d)} = max{ ${sol.cand[2][d].map((c) => `${b2 * c.x} + f<sub>3</sub>(${d - w2 * c.x}) = ${c.v}${c.x === sol.x[2][d] ? '*' : ''}`).join(', ')} } = <b>${sol.f[2][d]}</b>, x<sub>2</sub>(${d}) = <b>${sol.x[2][d]}</b>`
            )
            .join('<br>'),
          vizDuring: [knapFViz(P, sol, 3), during],
          viz: [knapFViz(P, sol, 3), after],
        });
      });
      // ---------- stage 1
      const c1 = sol.cand[1][W];
      steps.push({
        kind: 'number',
        prompt: `<b>Stage 1 hesapları.</b> Sadece f<sub>1</sub>(${W}) gerekir: f<sub>1</sub>(${W}) = max { ${b1}x<sub>1</sub> + f<sub>2</sub>(${W} − ${w1}x<sub>1</sub>) }, ${w1}x<sub>1</sub> ≤ ${W}.`,
        fields: [
          { label: fx(1, W), answer: sol.f[1][W] },
          { label: `x${S(1)}(${W})`, answer: sol.x[1][W] },
        ],
        hint: 'f₂ sütununu kullan.',
        explain: `${fx(1, W)} = max{ ${c1.map((c) => `${b1 * c.x} + f<sub>2</sub>(${W - w1 * c.x}) = ${b1 * c.x} + ${sol.f[2][W - w1 * c.x]} = ${c.v}${c.x === sol.x[1][W] ? '*' : ''}`).join(', ')} } = <b>${sol.f[1][W]}</b>, x<sub>1</sub>(${W}) = <b>${sol.x[1][W]}</b>.`,
        vizDuring: knapFViz(P, sol, 2),
        viz: knapFViz(P, sol, 1),
      });
      steps.push({
        kind: 'number',
        prompt: '<b>Optimal çözüm.</b> Geri izleyerek knapsack\'e her tipten kaç eşya konacağını bul.',
        fields: [
          { label: 'Type 1 sayısı', answer: n1 },
          { label: 'Type 2 sayısı', answer: n2 },
          { label: 'Type 3 sayısı', answer: n3 },
        ],
        hint: `x₁(${W}) → kalan ağırlık ${W} − ${w1}x₁ → x₂(kalan) → kalan → x₃(kalan).`,
        explain: `x<sub>1</sub>(${W}) = ${n1} → kalan ${W} − ${w1 * n1} = ${W - w1 * n1}; x<sub>2</sub>(${W - w1 * n1}) = ${n2} → kalan ${W - w1 * n1 - w2 * n2}; x<sub>3</sub>(${W - w1 * n1 - w2 * n2}) = ${n3}. Toplam fayda ${b1}·${n1} + ${b2}·${n2} + ${b3}·${n3} = <b>${sol.z}</b>.${P === KNAP_NOTES ? ' (notlarda baskı hatası: “f<sub>3</sub>(10) = 25” yazıyor; doğrusu f<sub>1</sub>(10) = 25.)' : ''}`,
      });
    } else {
      // ---------- alternative g(w)
      const g = solG;
      const wmin = Math.min(...P.w);
      const rows = OR.util.range(W + 1).filter((w) => w >= wmin);
      const shown = {};
      OR.util.range(wmin).forEach((w) => (shown[w] = true));
      const gViz = () => {
        const s = Object.assign({}, shown);
        return {
          type: 'matrix',
          caption: 'g(w) = max<sub>j</sub> { b<sub>j</sub> + g(w − w<sub>j</sub>) }',
          corner: 'w \\ j',
          rowLabels: OR.util.range(W + 1),
          colLabels: ['j = 1', 'j = 2', 'j = 3', 'g(w)'],
          cells: OR.util.range(W + 1).map((w) =>
            [0, 1, 2].map((j) => (P.w[j] > w ? '—' : s[w] ? `${P.b[j]}+${g.g[w - P.w[j]]}=${P.b[j] + g.g[w - P.w[j]]}` : '?')).concat([s[w] ? g.g[w] : '?'])
          ),
          cls: OR.util.range(W + 1).map((w) => [0, 1, 2].map((j) => (P.w[j] > w ? 'dim' : s[w] && g.arg[w].includes(j) ? 'hl' : '')).concat([s[w] ? 'sel' : ''])),
        };
      };
      chunk(rows, 4).forEach((ch, ci) => {
        const during = gViz();
        ch.forEach((w) => (shown[w] = true));
        const after = gViz();
        steps.push({
          kind: 'number',
          prompt: `g(w) değerlerini hesapla (w = ${ch.join(', ')}). g(w) = max<sub>j</sub> { b<sub>j</sub> + g(w − w<sub>j</sub>) } (sadece w<sub>j</sub> ≤ w olan j'ler).${ci === 0 ? ` w &lt; ${wmin} için hiçbir eşya sığmaz: g(w) = 0.` : ''}`,
          fields: ch.map((w) => ({ label: `g(${w})`, answer: g.g[w] })),
          hint: 'Küçük w\'den büyüğe doğru git; her j için b_j + g(w − w_j) zaten hesaplanmış g değerlerini kullanır.',
          explain: ch
            .map((w) => `g(${w}) = max{ ${g.cand[w].map((c) => `b<sub>${c.x + 1}</sub> + g(${w - P.w[c.x]}) = ${P.b[c.x]} + ${g.g[w - P.w[c.x]]} = ${c.v}`).join(', ')} } = <b>${g.g[w]}</b>`)
            .join('<br>'),
          vizDuring: [knapItemsViz(P), during],
          viz: [knapItemsViz(P), after],
        });
      });
      // retrace description
      let w = W;
      const tr = [];
      while (g.arg[w] && g.arg[w].length) {
        const j = g.arg[w][0];
        tr.push(`g(${w}) = b<sub>${j + 1}</sub> + g(${w - P.w[j]}) → Type ${j + 1}`);
        w -= P.w[j];
      }
      steps.push({
        kind: 'number',
        prompt: `<b>Optimal çözüm.</b> g(${W}) değerini veren eşyayı seçip w'yi azaltarak geri izle: knapsack'e her tipten kaç eşya konur?`,
        fields: [
          { label: 'Type 1 sayısı', answer: n1 },
          { label: 'Type 2 sayısı', answer: n2 },
          { label: 'Type 3 sayısı', answer: n3 },
        ],
        hint: 'Maksimumu veren j\'yi seç (eşitlik varsa herhangi biri aynı sonuca götürür), w ← w − w_j, g(w) = 0 olana dek tekrarla.',
        explain: `${tr.join('; ')}${w > 0 ? `; g(${w}) = 0 (hiçbir eşya sığmaz)` : ''}. Sonuç: ${itemsTxt}, toplam fayda <b>${g.z}</b>. (Eşitliklerde farklı j seçmek aynı eşya kümesini başka sırayla verir.)`,
      });
    }

    const isNotes = P === KNAP_NOTES;
    return {
      title: isNotes ? 'DP · Knapsack (Örnek 6.6)' : 'DP · Knapsack Problem',
      statement: `<p>${W} kapasiteli (ağırlık) bir knapsack, sağdaki üç tip eşya ile doldurulacak; <b>aynı tipten birden fazla</b> eşya konabilir (unbounded knapsack). Toplam faydayı <b>maksimize</b> et.</p>
        ${
          alt
            ? `<p><b>Alternatif formülasyon (8):</b> g(w) = w ağırlık kapasiteli knapsack'ten elde edilebilecek maksimum fayda.<br><b>g(w) = max<sub>j</sub> { b<sub>j</sub> + g(w − w<sub>j</sub>) }</b> (w<sub>j</sub> ≤ w), hiçbir eşya sığmıyorsa g(w) = 0.</p>`
            : `<p>r<sub>t</sub>(x<sub>t</sub>) = b<sub>t</sub>x<sub>t</sub>, g<sub>t</sub>(x<sub>t</sub>) = w<sub>t</sub>x<sub>t</sub>. f<sub>t</sub>(d) = Type t, t+1, …, 3 eşyalarıyla doldurulan d kapasiteli knapsack'in maksimum faydası:<br>
        <b>f<sub>t</sub>(d) = max { b<sub>t</sub>x<sub>t</sub> + f<sub>t+1</sub>(d − w<sub>t</sub>x<sub>t</sub>) }</b>, w<sub>t</sub>x<sub>t</sub> ≤ d, x<sub>t</sub> tamsayı ≥ 0, f<sub>4</sub>(d) = 0.</p>`
        }`,
      viz: knapItemsViz(P),
      steps,
      data: P,
      solution: `Optimal: ${itemsTxt}; maksimum fayda <b>${sol.z}</b>.`,
    };
  }

  // f table for knapsack stages: known stages >= upto
  function knapFViz(P, sol, upto) {
    const W = P.W;
    const cols = [];
    if (upto <= 3) cols.push('f<sub>3</sub>(d)', 'x<sub>3</sub>(d)');
    if (upto <= 2) cols.push('f<sub>2</sub>(d)', 'x<sub>2</sub>(d)');
    if (upto <= 1) cols.push('f<sub>1</sub>(d)', 'x<sub>1</sub>(d)');
    return {
      type: 'matrix',
      caption: 'Bulunan f<sub>t</sub>(d) ve x<sub>t</sub>(d) değerleri',
      corner: 'd',
      rowLabels: OR.util.range(W + 1),
      colLabels: cols,
      cells: OR.util.range(W + 1).map((d) => {
        const r = [];
        if (upto <= 3) r.push(sol.f[3][d], sol.x[3][d]);
        if (upto <= 2) r.push(sol.f[2][d], sol.x[2][d]);
        if (upto <= 1) r.push(d === W ? sol.f[1][d] : '', d === W ? sol.x[1][d] : '');
        return r;
      }),
    };
  }

  OR.registerDrill({
    id: 'dp-knapsack',
    topic: '6.5.2',
    title: 'DP · Knapsack Problem',
    description: 'Örnek 6.6 gibi unbounded knapsack: stage\'ler eşya tipleri, state kalan kapasite d. f<sub>3</sub>, f<sub>2</sub>(d) ve f<sub>1</sub>(W) değerlerini geriye doğru hesapla, eşya sayılarını geri izle. İstersen alternatif formülasyon g(w) = max<sub>j</sub>{b<sub>j</sub> + g(w − w<sub>j</sub>)} ile çöz.',
    options: [{ key: 'alt', label: 'Alternatif formülasyon g(w) (notlar (8))', type: 'checkbox', default: false }, NOTES_OPT],
    solve: solveKnapStages,
    solveG: solveKnapG,
    gen: genKnap,
    KNAP_NOTES,
    generate: (rng, opts) => buildKnap(rng, opts),
  });
})();
