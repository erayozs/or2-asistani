/* Ch.6 Deterministic DP — inventory and equipment replacement (notes 6.4, 6.6).
   - dp-inventory (6.4): production-inventory problem like Example 6.4 (Winston 18.3). Stage t = month, state i = inventory
       at the beginning of month t. c(0) = 0, c(x) = K + c·x (x > 0).
       f_T(i) = c(d_T − i);  f_t(i) = min_x { h(i + x − d_t) + c(x) + f_{t+1}(i + x − d_t) },
       x ∈ {0..cap}, 0 ≤ i + x − d_t ≤ storage limit (and ≤ remaining demand, so the last month ends with 0 inventory).
       States 0..min(storage, remaining demand) are computed for every month t ≥ 2 (as in the notes), f_1 only for i_0 = 0.
   - dp-equipment (6.6): equipment replacement like Example 6.7 (Winston 18.5), notes' formulation:
       g(t) = min_x { c_tx + g(x) },  t+1 ≤ x ≤ t+L, x ≤ T,  g(T) = 0,
       c_tx = p + m_1 + … + m_{x−t} − s_{x−t}  (purchase + maintenance − salvage).
   Inventory instances are rejected unless the optimal decision is unique in every state. Equipment replacement: with
   stationary costs, reordering keep lengths gives equal cost, so ties are intrinsic (the notes' Example 6.7 has them too);
   following the notes, every tied x is reported and the final step asks for ALL optimal policies (multi-select, ≤ 4). */
(function () {
  const OR = window.OR;
  const S = (t) => `<sub>${t}</sub>`;
  const fx = (t, i) => `f${S(t)}(${i})`;
  const N = (v) => String(Math.round(v * 100) / 100);
  const chunk = (arr, k) => {
    const out = [];
    for (let i = 0; i < arr.length; i += k) out.push(arr.slice(i, i + k));
    if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 1].unshift(out[out.length - 2].pop());
    return out;
  };

  // =================================================================== 6.4 inventory
  const INV_NOTES = { T: 4, d: [1, 3, 2, 4], K: 3, c: 1, h: 0.5, cap: 5, store: 4, i0: 0 };

  const prodCost = (P, x) => (x > 0 ? P.K + P.c * x : 0);

  function solveInv(P) {
    const T = P.T;
    const R = []; // R[t] = remaining demand from month t (1-based)
    R[T + 1] = 0;
    for (let t = T; t >= 1; t--) R[t] = R[t + 1] + P.d[t - 1];
    const states = [];
    for (let t = 1; t <= T; t++) states[t] = t === 1 ? [P.i0] : OR.util.range(Math.min(P.store, R[t]) + 1);
    const f = [];
    const x = [];
    const cand = [];
    let unique = true;
    let feasible = true;
    for (let t = T; t >= 1; t--) {
      f[t] = {};
      x[t] = {};
      cand[t] = {};
      const dt = P.d[t - 1];
      const endMax = t === T ? 0 : Math.min(P.store, R[t + 1]);
      for (const i of states[t]) {
        const o = [];
        for (let q = 0; q <= P.cap; q++) {
          const j = i + q - dt;
          if (j < 0 || j > endMax) continue;
          const hold = P.h * j;
          const pc = prodCost(P, q);
          const fut = t === T ? 0 : f[t + 1][j];
          o.push({ x: q, j, hold, pc, fut, v: hold + pc + fut });
        }
        if (!o.length) {
          feasible = false;
          continue;
        }
        const s = o.slice().sort((a, b) => a.v - b.v);
        if (s.length > 1 && s[1].v === s[0].v) unique = false;
        f[t][i] = s[0].v;
        x[t][i] = s[0].x;
        cand[t][i] = o;
      }
    }
    const plan = [];
    let inv = P.i0;
    for (let t = 1; t <= T && feasible; t++) {
      const q = x[t][inv];
      plan.push(q);
      inv = inv + q - P.d[t - 1];
    }
    return { states, f, x, cand, plan, z: feasible ? f[1][P.i0] : null, unique, feasible };
  }

  function genInv(rng, T) {
    const cap = rng.int(4, 5);
    const store = rng.int(3, 4);
    const d = [];
    for (let t = 0; t < T; t++) d.push(rng.int(1, 4));
    return { T, d, K: rng.int(2, 6), c: rng.int(1, 2), h: rng.pick([0.5, 0.5, 1]), cap, store, i0: 0 };
  }

  function invDataViz(P) {
    return {
      type: 'matrix',
      caption: 'Talepler',
      corner: 'Ay t',
      rowLabels: ['d<sub>t</sub>'],
      colLabels: OR.util.range(P.T).map((t) => t + 1),
      cells: [P.d],
    };
  }
  // f_t(i) / x_t(i) found so far (stages >= from)
  function invSummaryViz(P, sol, from) {
    const ts = [];
    for (let t = P.T; t >= Math.max(from, 1); t--) ts.push(t);
    if (!ts.length) return null;
    const allI = OR.util.range(P.store + 1);
    return {
      type: 'matrix',
      caption: 'Bulunan f<sub>t</sub>(i) / x<sub>t</sub>(i)',
      corner: 'i \\ t',
      rowLabels: allI,
      colLabels: ts.map((t) => `t = ${t}`),
      cells: allI.map((i) => ts.map((t) => (sol.f[t][i] != null ? `${N(sol.f[t][i])} / ${sol.x[t][i]}` : '—'))),
      cls: allI.map((i) => ts.map((t) => (sol.f[t][i] != null ? '' : 'dim'))),
    };
  }
  function invStageViz(P, sol, t, shown) {
    const st = sol.states[t];
    const xs = OR.util.range(P.cap + 1);
    return {
      type: 'matrix',
      caption: `Ay ${t}: toplam maliyet ${P.h}(i + x − ${P.d[t - 1]}) + c(x) + f${S(t + 1)}(i + x − ${P.d[t - 1]})`,
      corner: 'i \\ x',
      rowLabels: st,
      colLabels: xs.concat([`f${S(t)}(i)`, `x${S(t)}(i)`]),
      cells: st.map((i) => {
        const o = {};
        sol.cand[t][i].forEach((c) => (o[c.x] = c));
        return xs.map((q) => (o[q] ? (shown[i] ? N(o[q].v) : '?') : '—')).concat(shown[i] ? [N(sol.f[t][i]), sol.x[t][i]] : ['?', '?']);
      }),
      cls: st.map((i) => {
        const o = {};
        sol.cand[t][i].forEach((c) => (o[c.x] = c));
        return xs.map((q) => (!o[q] ? 'dim' : shown[i] && q === sol.x[t][i] ? 'hl' : '')).concat(shown[i] ? ['sel', 'sel'] : ['', '']);
      }),
    };
  }
  // notes-style table for the explanation
  function invExplainTable(P, sol, t, rows) {
    const dt = P.d[t - 1];
    let h = `<div style="overflow-x:auto"><table class="mtx" style="margin:6px 0"><tr><th>i</th><th>x</th><th>${P.h}(i+x−${dt}) + c(x)</th><th>f${S(t + 1)}(i+x−${dt})</th><th>Toplam</th><th>f${S(t)}(i), x${S(t)}(i)</th></tr>`;
    rows.forEach((i) => {
      const o = sol.cand[t][i];
      o.forEach((c, k) => {
        const best = c.x === sol.x[t][i];
        h += `<tr><td>${i}</td><td>${c.x}</td><td>${N(c.hold)} + ${N(c.pc)} = ${N(c.hold + c.pc)}</td><td>${N(c.fut)}</td><td${best ? ' class="hl"' : ''}>${N(c.v)}${best ? '*' : ''}</td>${
          k === 0 ? `<td rowspan="${o.length}">${fx(t, i)} = ${N(sol.f[t][i])}<br>x${S(t)}(${i}) = ${sol.x[t][i]}</td>` : ''
        }</tr>`;
      });
    });
    return h + '</table></div>';
  }

  function buildInv(rng, opts) {
    opts = opts || {};
    let P, sol;
    if (opts.notes) {
      P = INV_NOTES;
      sol = solveInv(P);
    } else {
      const tOpt = String(opts.T || 'mix');
      for (let tries = 0; tries < 4000 && !P; tries++) {
        const T = tOpt === 'mix' ? rng.int(3, 4) : +tOpt;
        const Q = genInv(rng, T);
        const r = solveInv(Q);
        if (!r.feasible || !r.unique) continue;
        if (!r.plan.some((q) => q === 0)) continue; // some month uses inventory only
        if (r.plan.every((q, k) => q === Q.d[k] || q === 0) && rng.chance(0.5)) continue; // prefer non-trivial lot sizes
        P = Q;
        sol = r;
      }
      if (!P) throw new Error('uygun envanter örneği bulunamadı');
    }
    const T = P.T;
    const steps = [];
    const dT = P.d[T - 1];
    const cTxt = `c(0) = 0, c(x) = ${P.K} + ${P.c === 1 ? '' : P.c}x`;
    // ---- month T
    {
      const st = sol.states[T];
      const shown = {};
      st.forEach((i) => (shown[i] = true));
      steps.push({
        kind: 'number',
        prompt: `<b>Ay ${T} hesapları.</b> Son ayda talebi tam karşılayacak kadar üretilir (ay sonu stok 0): x${S(T)}(i) = ${dT} − i. f${S(T)}(i) değerlerini yaz (i = ${st.join(', ')}).`,
        fields: st.map((i) => ({ label: fx(T, i), answer: sol.f[T][i] })),
        hint: `f${S(T)}(i) = c(${dT} − i); ${cTxt}. Üretim 0 ise maliyet 0 (setup yok).`,
        explain: st.map((i) => `${fx(T, i)} = c(${dT} − ${i}) = c(${dT - i}) = ${dT - i > 0 ? `${P.K} + ${N(P.c * (dT - i))} = ` : ''}<b>${N(sol.f[T][i])}</b>, x${S(T)}(${i}) = ${dT - i}`).join('<br>'),
        viz: [invDataViz(P), invSummaryViz(P, sol, T)],
      });
    }
    // ---- months T-1 .. 2 (all states), then month 1 (i0)
    for (let t = T - 1; t >= 1; t--) {
      const st = sol.states[t];
      const dt = P.d[t - 1];
      const shown = {};
      const groups = t === 1 ? [st] : chunk(st, 3);
      groups.forEach((g, gi) => {
        const during = invStageViz(P, sol, t, Object.assign({}, shown));
        g.forEach((i) => (shown[i] = true));
        const after = invStageViz(P, sol, t, Object.assign({}, shown));
        const endMax = Math.min(P.store, sol.states[t + 1][sol.states[t + 1].length - 1]);
        const intro =
          gi === 0
            ? `x ∈ {0, …, ${P.cap}} ve 0 ≤ i + x − ${dt} ≤ ${endMax} olmalı (talep zamanında karşılanır; ay sonu stoğu ${
                endMax < P.store ? `kalan toplam talebi (${endMax}) aşamaz, yoksa son ay stok artar` : `depo kısıtını (${P.store}) aşamaz`
              }). `
            : '';
        steps.push({
          kind: 'number',
          prompt: `<b>Ay ${t} hesapları</b>${t === 1 ? ` (başlangıç stoğu ${P.i0} olduğundan sadece f${S(1)}(${P.i0}) gerekir)` : ` (i = ${g.join(', ')})`}. ${intro}<br>f${S(t)}(i) = min<sub>x</sub> { ${P.h}(i + x − ${dt}) + c(x) + f${S(t + 1)}(i + x − ${dt}) }. f${S(t)}(i) ve x${S(t)}(i) değerlerini yaz.`,
          fields: g.flatMap((i) => [
            { label: fx(t, i), answer: sol.f[t][i] },
            { label: `x${S(t)}(${i})`, answer: sol.x[t][i] },
          ]),
          hint: `Her uygun x için: ay sonu stok j = i + x − ${dt}; maliyet = ${P.h}·j + c(x) + f${S(t + 1)}(j). f${S(t + 1)} değerleri sağdaki özet tabloda. Ondalık yazabilirsin (ör. 12.5).`,
          explain:
            invExplainTable(P, sol, t, g) +
            '<span class="muted">(* = minimum)</span>' +
            (P === INV_NOTES && t === 2 && g.includes(3) ? ' (notlarda baskı hatası: tabloda “x3(3)=0” yazıyor; doğrusu x<sub>2</sub>(3) = 0.)' : ''),
          vizDuring: [invSummaryViz(P, sol, t + 1), during],
          viz: [invSummaryViz(P, sol, t + 1), after],
        });
      });
    }
    // ---- plan
    let inv = P.i0;
    const tr = sol.plan
      .map((q, k) => {
        const s = `x${S(k + 1)}(${inv}) = ${q} → ay ${k + 2 <= T ? k + 2 : 'sonu'} stoğu ${inv} + ${q} − ${P.d[k]} = ${inv + q - P.d[k]}`;
        inv = inv + q - P.d[k];
        return s;
      })
      .join('; ');
    steps.push({
      kind: 'number',
      prompt: `<b>Optimal üretim planı.</b> f${S(1)}(${P.i0})'dan başlayıp ileriye doğru x${S('t')}(i) kararlarını izle: her ay kaç birim üretilmeli? Toplam minimum maliyet nedir?`,
      fields: sol.plan.map((q, k) => ({ label: `x${S(k + 1)}`, answer: q })).concat([{ label: 'Toplam maliyet', answer: sol.z }]),
      hint: 'Ay 1: x₁(0). Sonraki ayın başlangıç stoğu = i + x − d. O stok için tablodaki x değerine bak.',
      explain: `${tr}. Toplam maliyet f${S(1)}(${P.i0}) = <b>${N(sol.z)}</b>.`,
      viz: [invDataViz(P), invSummaryViz(P, sol, 1)],
    });

    const isNotes = P === INV_NOTES;
    return {
      title: isNotes ? 'DP · Inventory Problem (Örnek 6.4)' : 'DP · Inventory Problem',
      statement: `<p>Bir şirket önümüzdeki ${T} ayın taleplerini biliyor: ${P.d.map((v, k) => `ay ${k + 1}: <b>${v}</b>`).join(', ')}. Üretim yapılan ayda <b>${P.K}</b> setup maliyeti ve birim başına <b>${P.c}</b> değişken maliyet oluşur; her ay sonunda eldeki birim başına <b>${P.h}</b> holding maliyeti ödenir. Aylık üretim kapasitesi en fazla <b>${P.cap}</b>, depo kısıtı nedeniyle ay sonu stoğu en fazla <b>${P.store}</b> birim. Başlangıç stoğu ${P.i0}. Tüm talepleri zamanında karşılayan minimum maliyetli üretim planını bul.</p>
        <p>Stage = ay t, state = ay başı stok i. ${cTxt}.<br>
        <b>f<sub>t</sub>(i) = min<sub>x</sub> { ${P.h}(i + x − d<sub>t</sub>) + c(x) + f<sub>t+1</sub>(i + x − d<sub>t</sub>) }</b>, f${S(T)}(i) = c(d${S(T)} − i).</p>`,
      viz: invDataViz(P),
      steps,
      data: P,
      solution: `Plan: ${sol.plan.map((q, k) => `x${S(k + 1)} = ${q}`).join(', ')}; minimum toplam maliyet <b>${N(sol.z)}</b>.`,
    };
  }

  OR.registerDrill({
    id: 'dp-inventory',
    topic: '6.4',
    title: 'DP · Inventory (Production Planning)',
    description: 'Örnek 6.4 gibi üretim-envanter problemi (setup + birim maliyet, holding, kapasite ve depo kısıtı). f<sub>t</sub>(i) tablolarını aylar boyunca geriye doğru doldur, her state için x<sub>t</sub>(i) kararını bul, sonra optimal üretim planını ileriye doğru oku.',
    options: [
      {
        key: 'T',
        label: 'Ay sayısı',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: '3–4 (karışık)' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      { key: 'notes', label: 'Ders notundaki örneği kullan', type: 'checkbox', default: false },
    ],
    solve: solveInv,
    gen: genInv,
    INV_NOTES,
    generate: (rng, opts) => buildInv(rng, opts),
  });

  // =================================================================== 6.6 equipment replacement
  const EQ_NOTES = { T: 5, L: 3, p: 1000, m: [60, 80, 120], s: [800, 600, 500] };

  const ctx = (P, k) => P.p + P.m.slice(0, k).reduce((a, b) => a + b, 0) - P.s[k - 1];

  function solveEq(P) {
    const T = P.T;
    const g = { [T]: 0 };
    const x = {};
    const cand = {};
    let unique = true;
    const ties = {};
    for (let t = T - 1; t >= 0; t--) {
      const o = [];
      for (let y = t + 1; y <= Math.min(t + P.L, T); y++) o.push({ x: y, c: ctx(P, y - t), v: ctx(P, y - t) + g[y] });
      const m = Math.min(...o.map((q) => q.v));
      const best = o.filter((q) => q.v === m);
      if (best.length > 1) unique = false;
      ties[t] = best.map((q) => q.x);
      g[t] = m;
      x[t] = best[0].x;
      cand[t] = o;
    }
    const policy = [0];
    while (policy[policy.length - 1] < T) policy.push(x[policy[policy.length - 1]]);
    return { g, x, cand, policy, z: g[0], unique, ties };
  }

  function genEq(rng, T) {
    const p = rng.int(6, 15) * 100;
    const m1 = rng.int(2, 10) * 10;
    const m2 = m1 + rng.int(1, 8) * 10;
    const m3 = m2 + rng.int(1, 12) * 10;
    const s1 = p - rng.int(2, 6) * 50;
    const s2 = s1 - rng.int(1, 5) * 50;
    const s3 = s2 - rng.int(1, 4) * 50;
    return { T, L: 3, p, m: [m1, m2, m3], s: [s1, s2, s3] };
  }

  // all policies (purchase/trade-in times 0 = t0 < t1 < … < T, keep 1..L years) with their cost, cheapest first
  function allPolicies(P) {
    const out = [];
    (function rec(p, v) {
      const t = p[p.length - 1];
      if (t === P.T) return out.push({ p: p.slice(), v });
      for (let k = 1; k <= P.L && t + k <= P.T; k++) rec(p.concat([t + k]), v + ctx(P, k));
    })([0], 0);
    return out.sort((a, b) => a.v - b.v || a.p.join(',').localeCompare(b.p.join(',')));
  }
  // all optimal policies, following every tied x(t)
  function optPolicies(sol, T) {
    const out = [];
    (function rec(p) {
      const t = p[p.length - 1];
      if (t === T) return out.push(p.slice());
      sol.ties[t].forEach((y) => rec(p.concat([y])));
    })([0]);
    return out;
  }

  // timeline picture: nodes 0..T, optimal arcs t -> x(t) (all tied ones) drawn as arcs above the line
  function eqViz(P, sol, o) {
    o = o || {};
    const T = P.T;
    const GX = 64;
    const W = 40 + GX * T + 30;
    const H = 150;
    const Y = 108;
    const X = (t) => 30 + GX * t;
    const onPath = {};
    (o.paths || []).forEach((pa) => pa.forEach((v, k, a) => k + 1 < a.length && (onPath[v + '-' + a[k + 1]] = true)));
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;margin:0 auto">`;
    svg += `<line x1="${X(0)}" y1="${Y}" x2="${X(T)}" y2="${Y}" style="stroke:var(--line);stroke-width:2"/>`;
    for (let t = 0; t < T; t++) svg += `<text x="${(X(t) + X(t + 1)) / 2}" y="${Y + 18}" text-anchor="middle" style="font-size:9.5px;fill:var(--muted)">Year ${t + 1}</text>`;
    const known = o.known || {};
    const arcs = [];
    Object.keys(known).forEach((t) => {
      t = +t;
      if (t === T || known[t] == null) return;
      sol.ties[t].forEach((y2) => arcs.push([t, y2]));
    });
    arcs.sort((a, b) => !!onPath[a[0] + '-' + a[1]] - !!onPath[b[0] + '-' + b[1]]);
    arcs.forEach(([t, y2]) => {
      const hot = onPath[t + '-' + y2];
      const x1 = X(t);
      const x2 = X(y2);
      const hgt = 18 + 18 * (y2 - t);
      svg += `<path d="M ${x1} ${Y - 12} C ${x1} ${Y - 12 - hgt}, ${x2} ${Y - 12 - hgt}, ${x2} ${Y - 12}" style="fill:none;stroke:var(${hot ? '--gold' : '--good'});stroke-width:${hot ? 3.6 : 2}"/>`;
    });
    arcs.forEach(([t, y2]) => {
      const hgt = 18 + 18 * (y2 - t);
      svg += `<text x="${(X(t) + X(y2)) / 2 + (y2 - t === 1 ? 0 : 6)}" y="${Y - 12 - 0.75 * hgt + 3}" text-anchor="middle" style="font-size:9.5px;font-family:var(--mono);fill:var(--ink);paint-order:stroke;stroke:var(--card);stroke-width:3px">c${t}${y2}=${ctx(P, y2 - t)}</text>`;
    });
    for (let t = 0; t <= T; t++) {
      const k = known[t] != null;
      svg += `<circle cx="${X(t)}" cy="${Y}" r="11" style="fill:${k ? 'var(--good-soft)' : 'var(--card)'};stroke:${k ? 'var(--good)' : 'var(--muted)'};stroke-width:2"/>`;
      svg += `<text x="${X(t)}" y="${Y + 4}" text-anchor="middle" style="font-size:11.5px;font-weight:700;fill:var(--ink)">${t}</text>`;
      if (k) svg += `<text x="${X(t)}" y="${Y + 34}" text-anchor="middle" style="font-size:10px;font-family:var(--mono);fill:var(--good);font-weight:700">g=${known[t]}</text>`;
    }
    svg += '</svg>';
    return {
      type: 'html',
      html: `<div class="viz-cap">${o.caption || 'Zaman çizelgesi (Time 0 … Time ' + T + ')'}</div>${svg}<div class="muted" style="font-size:11.5px;text-align:center">Yeşil yay: t'de alınan makine için g(t)'yi veren trade-in zamanı (eşitlikte hepsi); ${o.paths ? 'sarı = optimal politika(lar); ' : ''}g(t) düğüm altında.</div>`,
    };
  }
  function eqTable(P, sol, shown) {
    const T = P.T;
    const ts = [];
    for (let t = T - 1; t >= 0; t--) ts.push(t);
    const xs = OR.util.range(T).map((k) => k + 1);
    return {
      type: 'matrix',
      caption: 'c<sub>tx</sub> + g(x)',
      corner: 't \\ x',
      rowLabels: ts,
      colLabels: xs.concat(['g(t)', 'x*']),
      cells: ts.map((t) => {
        const o = {};
        sol.cand[t].forEach((c) => (o[c.x] = c));
        return xs.map((y) => (o[y] ? (shown[t] ? `${o[y].c}+${sol.g[y]}=${o[y].v}` : '?') : '—')).concat(shown[t] ? [sol.g[t], sol.ties[t].join(' / ')] : ['?', '?']);
      }),
      cls: ts.map((t) => {
        const o = {};
        sol.cand[t].forEach((c) => (o[c.x] = c));
        return xs.map((y) => (!o[y] ? 'dim' : shown[t] && sol.ties[t].includes(y) ? 'hl' : '')).concat(shown[t] ? ['sel', 'sel'] : ['', '']);
      }),
    };
  }

  function buildEq(rng, opts) {
    opts = opts || {};
    const tOpt = String(opts.T || 'mix');
    let P, sol, opt;
    if (opts.notes) {
      P = EQ_NOTES;
      sol = solveEq(P);
      opt = optPolicies(sol, P.T);
    }
    for (let tries = 0; tries < 4000 && !P; tries++) {
      const T = tOpt === 'mix' ? rng.int(4, 6) : +tOpt;
      const Q = genEq(rng, T);
      const r = solveEq(Q);
      const op = optPolicies(r, T);
      if (op.length > 4) continue;
      // With stationary costs any reordering of the keep lengths costs the same, so a policy mixing lengths always has
      // alternative optima (as in the notes' Example 6.7). Unique optima = one repeated length; accept those rarely.
      if (op.length === 1 && (op[0].length === T + 1 || !rng.chance(0.2))) continue;
      P = Q;
      sol = r;
      opt = op;
    }
    if (!P) throw new Error('uygun equipment replacement örneği bulunamadı');
    const T = P.T;
    const steps = [];
    const cs = [1, 2, 3].map((k) => ctx(P, k));
    steps.push({
      kind: 'number',
      prompt: `Maliyetler zamanla değişmediğinden c<sub>tx</sub> sadece x − t'ye (makinenin elde tutulduğu yıl sayısına) bağlıdır: c<sub>tx</sub> = ${P.p} + m<sub>1</sub> + … + m<sub>x−t</sub> − s<sub>x−t</sub>. c<sub>01</sub>, c<sub>02</sub>, c<sub>03</sub> değerlerini hesapla.`,
      fields: [1, 2, 3].map((k) => ({ label: `c${S('0' + k)} (= c<sub>t,t+${k}</sub>)`, answer: cs[k - 1] })),
      hint: 'Yeni makine fiyatı + ilgili yılların bakım maliyetleri − o yaştaki salvage değeri.',
      explain: [1, 2, 3]
        .map((k) => `c<sub>0${k}</sub> = ${P.p} + ${P.m.slice(0, k).join(' + ')} − ${P.s[k - 1]} = <b>${cs[k - 1]}</b>`)
        .join('<br>'),
    });
    const known = { [T]: 0 };
    const shown = {};
    for (let t = T - 1; t >= 0; t--) {
      const during = [eqViz(P, sol, { known: Object.assign({}, known) }), eqTable(P, sol, Object.assign({}, shown))];
      known[t] = sol.g[t];
      shown[t] = true;
      const after = [eqViz(P, sol, { known: Object.assign({}, known) }), eqTable(P, sol, Object.assign({}, shown))];
      const o = sol.cand[t];
      const single = o.length === 1;
      const ti = sol.ties[t];
      steps.push({
        kind: 'number',
        prompt: single
          ? `<b>g(${t})</b>: Time ${t}'de yeni makine alınırsa tek mantıklı karar onu Time ${T}'te satmaktır (g(${T}) = 0). g(${t}) nedir?`
          : `<b>g(${t})</b>: Time ${t}'de yeni makine alındı; x ∈ {${o.map((c) => c.x).join(', ')}} zamanında trade-in yapılabilir. g(${t}) = min<sub>x</sub> { c<sub>${t}x</sub> + g(x) } nedir? (Minimumu veren x'leri not et — sonra politikayı bulmak için gerekecek.)`,
        fields: [{ label: `g(${t})`, answer: sol.g[t] }],
        hint: 'c_tx değerleri sadece süreye (x − t) bağlı: c₀₁, c₀₂, c₀₃. g(x) değerleri zaman çizelgesinde.',
        explain: `g(${t}) = min{ ${o.map((c) => `c<sub>${t}${c.x}</sub> + g(${c.x}) = ${c.c} + ${sol.g[c.x]} = ${c.v}${ti.includes(c.x) ? '*' : ''}`).join(', ')} } = <b>${sol.g[t]}</b> → Time ${t}'de alınan makine ${
          ti.length > 1 ? `Time <b>${ti.join('</b> ya da <b>')}</b>'te trade-in edilmeli (<b>eşitlik</b>: ikisi de optimal)` : `Time <b>${ti[0]}</b>'te trade-in edilir`
        }.`,
        vizDuring: during,
        viz: after,
      });
    }
    // ---- policies (multi): all optimal ones + cheapest non-optimal ones as distractors
    const all = allPolicies(P);
    const key = (p) => p.join('–');
    const optKeys = new Set(opt.map(key));
    const distract = all.filter((q) => !optKeys.has(key(q.p))).slice(0, Math.max(2, 5 - opt.length));
    const options = all.filter((q) => optKeys.has(key(q.p))).concat(distract);
    const costTxt = (q) => `${key(q.p)}: ${q.p
      .slice(0, -1)
      .map((t, k) => ctx(P, q.p[k + 1] - t))
      .join(' + ')} = ${q.v}`;
    steps.push({
      kind: 'multi',
      prompt: `<b>Optimal politika(lar).</b> Time 0'dan başlayıp g(t)'yi veren x(t) kararlarını ileriye doğru izle (eşitlik varsa her dalı izle). Aşağıdaki politikalardan (makine alım/trade-in zamanları 0 → ${T}) hangileri <b>optimaldir</b>?`,
      options: options.map((q) => ({ html: `<b>${key(q.p)}</b>`, correct: optKeys.has(key(q.p)) })),
      hint: `x(0) → o zamanda yeni makine → x(x(0)) → … → ${T}. Bir g(t)'de eşitlik varsa iki yol da optimaldir.`,
      explain: `Optimal politika${opt.length > 1 ? 'lar' : ''}: <b>${opt.map(key).join('</b>, <b>')}</b> (net maliyet g(0) = ${sol.z}).<br>Seçeneklerin maliyetleri (c değerleri toplamı):<br>${options.map((q) => costTxt(q) + (optKeys.has(key(q.p)) ? ' ✓' : '')).join('<br>')}${
        opt.length > 1 ? '<br>Maliyetler zamanla değişmediği için aynı tutma sürelerinin farklı sırası aynı maliyeti verir; notlardaki gibi herhangi biri keyfi seçilebilir.' : ''
      }`,
      viz: [eqViz(P, sol, { known: Object.assign({}, known), paths: opt, caption: `Optimal politika(lar): ${opt.map(key).join(', ')}; g(0) = ${sol.z}` }), eqTable(P, sol, shown)],
    });
    if (P === EQ_NOTES)
      steps.push({
        kind: 'info',
        prompt: 'Notlarla karşılaştır: g(0) = $1280; notlar Time 0 makinesini keyfi olarak Time 1\'de, Time 1 makinesini Time 2\'de değiştirip 1-2-5 trade-in zamanlarını buluyor ve 1-4-5 ile 3-4-5\'in de optimal olduğunu söylüyor (yani 0-1-2-5, 0-1-4-5, 0-3-4-5).',
      });

    return {
      title: 'DP · Equipment Replacement',
      statement: `<p>Bir atölyenin sürekli bir makineye ihtiyacı var. Yeni makine fiyatı <b>${P.p}</b>. Makinenin i. kullanım yılındaki bakım maliyeti m<sub>i</sub>: ${P.m.map((v, k) => `m<sub>${k + 1}</sub> = ${v}`).join(', ')}. Makine 1, 2 ya da 3 yıl kullanılabilir; i yaşındaki makine trade-in edilince salvage değeri s<sub>i</sub> alınır: ${P.s.map((v, k) => `s<sub>${k + 1}</sub> = ${v}`).join(', ')}. Time 0'da yeni makine alınması zorunlu. Önümüzdeki <b>${T} yıl</b> için net maliyeti (bakım + alım − salvage) minimize eden politikayı bul.</p>
        <p>g(t) = Time t'de yeni makine alınmışsa t'den ${T}'e kadar minimum net maliyet; c<sub>tx</sub> = t'de alınıp x'te satılan makinenin net maliyeti.<br>
        <b>g(t) = min<sub>x</sub> { c<sub>tx</sub> + g(x) }</b>, t+1 ≤ x ≤ t+3, x ≤ ${T}; g(${T}) = 0.</p>`,
      viz: eqViz(P, sol, { known: { [T]: 0 } }),
      steps,
      data: P,
      solution: `Optimal politika(lar): ${opt.map((q) => q.join('–')).join(', ')}; minimum net maliyet g(0) = <b>${sol.z}</b>.`,
    };
  }

  OR.registerDrill({
    id: 'dp-equipment',
    topic: '6.6',
    title: 'DP · Equipment Replacement',
    description: 'Örnek 6.7 gibi: yeni makine fiyatı, yıllık bakım maliyetleri ve salvage değerleri verilir. c<sub>tx</sub> değerlerini hesapla, g(t) = min{c<sub>tx</sub> + g(x)} ile geriye doğru çöz, optimal trade-in politikasını bul.',
    options: [
      { key: 'notes', label: 'Ders notundaki örneği kullan (Örnek 6.7)', type: 'checkbox', default: false },
      {
        key: 'T',
        label: 'Planlama ufku (yıl)',
        type: 'select',
        default: 'mix',
        choices: [
          { value: 'mix', label: '4–6 (karışık)' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6' },
        ],
      },
    ],
    solve: solveEq,
    gen: genEq,
    ctx,
    EQ_NOTES,
    generate: (rng, opts) => buildEq(rng, opts),
  });
})();
