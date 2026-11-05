/* Ch.6 · 6.8 Dynamic lot-size model: Wagner-Whitin algorithm and Silver-Meal heuristic (Example 6.14, Winston 18.7).
   - wagner-whitin: f_{T+1} = 0,  f_t = min_{j=0..T−t} { c_tj + f_{t+j+1} },
       c_tj = K + c(d_t + … + d_{t+j}) + h(d_{t+1} + 2d_{t+2} + … + j·d_{t+j})   (produce in t for periods t..t+j).
       Backward f_T, …, f_1, then the schedule forward. Variable cost included as in the notes (f_1 = 900 in Ex. 6.14).
   - silver-meal: from the current period s, TC(k) = K + HC(k) (variable cost ignored), AC(k) = TC(k)/k for k = 1, 2, …
       until AC(k+1) > AC(k) (or no more periods); produce d_s + … + d_{s+t*−1}, continue from s + t*.
   Instances: unique WW decision in every period; no AC(k+1) = AC(k) ties in S-M. Option `notes` = Example 6.14.
   Exposes OR.drills['wagner-whitin'|'silver-meal'].{ww, sm, gen} for verification scripts. */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const S = (t) => `<sub>${t}</sub>`;
  const NOTES = { T: 5, d: [40, 60, 10, 20, 25], K: 30, c: 5, h: 1 };
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  // ------------------------------------------------------------------ Wagner-Whitin
  function cost(P, t, j) {
    // t 1-based, produce in t for t..t+j
    let hold = 0;
    for (let m = 1; m <= j; m++) hold += m * P.d[t - 1 + m];
    const q = sum(P.d.slice(t - 1, t + j));
    return { K: P.K, var: P.c * q, hold, q, v: P.K + P.c * q + P.h * hold };
  }
  function ww(P) {
    const T = P.T;
    const f = { [T + 1]: 0 };
    const jb = {};
    const cand = {};
    let unique = true;
    for (let t = T; t >= 1; t--) {
      const o = [];
      for (let j = 0; j <= T - t; j++) {
        const c = cost(P, t, j);
        o.push({ j, c, v: c.v + f[t + j + 1] });
      }
      const m = Math.min(...o.map((x) => x.v));
      const best = o.filter((x) => x.v === m);
      if (best.length > 1) unique = false;
      f[t] = m;
      jb[t] = best[0].j;
      cand[t] = o;
    }
    const x = Array(T).fill(0);
    const setups = [];
    let t = 1;
    while (t <= T) {
      const j = jb[t];
      x[t - 1] = sum(P.d.slice(t - 1, t + j));
      setups.push([t, t + j]);
      t = t + j + 1;
    }
    return { f, jb, cand, x, setups, z: f[1], unique, zNoVar: f[1] - P.c * sum(P.d) };
  }

  // ------------------------------------------------------------------ Silver-Meal
  function sm(P) {
    const T = P.T;
    const cycles = [];
    let s = 1;
    let tie = false;
    while (s <= T) {
      const rows = [];
      let hc = 0;
      let k = 1;
      let tstar = null;
      for (; s + k - 1 <= T; k++) {
        if (k > 1) hc += (k - 1) * P.d[s + k - 2];
        const tc = P.K + P.h * hc;
        const ac = F(tc).div(k);
        rows.push({ k, hc: P.h * hc, tc, ac, add: k > 1 ? `${P.h === 1 ? '' : P.h + '·'}${k - 1 === 1 ? '' : k - 1 + '·'}${P.d[s + k - 2]}` : '' });
        if (k > 1) {
          const cmp = ac.cmp(rows[k - 2].ac);
          if (cmp === 0) tie = true;
          if (cmp > 0) {
            tstar = k - 1;
            break;
          }
        }
      }
      if (tstar == null) tstar = rows.length; // ran out of periods
      const q = sum(P.d.slice(s - 1, s - 1 + tstar));
      cycles.push({ s, rows, tstar, q, stoppedByEnd: rows.length === tstar });
      s += tstar;
    }
    const x = Array(T).fill(0);
    let hold = 0;
    cycles.forEach((c) => {
      x[c.s - 1] = c.q;
      for (let m = 1; m < c.tstar; m++) hold += m * P.d[c.s - 1 + m];
    });
    const setupCost = cycles.length * P.K;
    return { cycles, x, tie, cost: setupCost + P.h * hold, setupCost, hold: P.h * hold };
  }

  function gen(rng, T) {
    const d = [];
    for (let t = 0; t < T; t++) d.push(rng.int(1, 12) * 5);
    return { T, d, K: rng.int(3, 12) * 10, c: rng.int(1, 5), h: rng.pick([1, 1, 2]) };
  }

  function dataViz(P, x) {
    const cols = OR.util.range(P.T).map((t) => t + 1);
    return {
      type: 'matrix',
      caption: x ? 'Talepler ve üretim planı' : 'Talepler',
      corner: 'Dönem t',
      rowLabels: x ? ['d<sub>t</sub>', 'x<sub>t</sub>'] : ['d<sub>t</sub>'],
      colLabels: cols,
      cells: x ? [P.d, x] : [P.d],
      cls: x ? [P.d.map(() => ''), x.map((v) => (v === '?' ? '' : v > 0 ? 'hl' : 'dim'))] : undefined,
    };
  }
  const per = (t, j) => (j === 0 ? `${t}` : `${t}–${t + j}`);

  // WW table: rows t, cols last covered period k; cells c_t,k-t + f_{k+1}
  function wwViz(P, R, shown) {
    const T = P.T;
    const ts = [];
    for (let t = T; t >= 1; t--) ts.push(t);
    const ks = OR.util.range(T).map((k) => k + 1);
    return {
      type: 'matrix',
      caption: 'c<sub>tj</sub> + f<sub>t+j+1</sub> (sütun = karşılanan son dönem t+j)',
      corner: 't \\ t+j',
      rowLabels: ts,
      colLabels: ks.concat(['f<sub>t</sub>', 'son dönem']),
      cells: ts.map((t) => ks.map((k) => (k < t ? '—' : shown[t] ? String(R.cand[t][k - t].v) : '?')).concat(shown[t] ? [R.f[t], t + R.jb[t]] : ['?', '?'])),
      cls: ts.map((t) => ks.map((k) => (k < t ? 'dim' : shown[t] && k - t === R.jb[t] ? 'hl' : '')).concat(shown[t] ? ['sel', 'sel'] : ['', ''])),
    };
  }

  function costLine(P, t, o, f) {
    const c = o.c;
    const holdTerms = [];
    for (let m = 1; m <= o.j; m++) holdTerms.push(`${m === 1 ? '' : m + '·'}${P.d[t - 1 + m]}`);
    const holdTxt = o.j ? ` + ${P.h === 1 ? '' : P.h + '·'}(${holdTerms.join(' + ')})` : '';
    return `j = ${o.j} (dönem ${per(t, o.j)} için üret): c<sub>${t}${o.j}</sub> + f<sub>${t + o.j + 1}</sub> = ${P.K} + ${P.c}·${c.q}${holdTxt} + ${f[t + o.j + 1]} = ${c.v} + ${f[t + o.j + 1]} = ${o.v}`;
  }

  function wwSteps(P, R) {
    const T = P.T;
    const steps = [];
    const shown = {};
    for (let t = T; t >= 1; t--) {
      const during = [dataViz(P), wwViz(P, R, Object.assign({}, shown))];
      shown[t] = true;
      const after = [dataViz(P), wwViz(P, R, Object.assign({}, shown))];
      const o = R.cand[t];
      const single = o.length === 1;
      const lines = o.map((x) => costLine(P, t, x, R.f) + (x.j === R.jb[t] && !single ? '*' : '')).join('<br>');
      steps.push({
        kind: 'number',
        prompt: single
          ? `<b>f<sub>${T}</sub></b>: Dönem ${T}'e sıfır stokla girilirse sadece dönem ${T} için üretilir (f<sub>${T + 1}</sub> = 0). f<sub>${T}</sub> nedir?`
          : `<b>f<sub>${t}</sub></b>: Dönem ${t}'e sıfır stokla giriliyor, en az d<sub>${t}</sub> üretilmeli. Dönem ${t}'de üretim ${o.map((x) => per(t, x.j)).join(' / ')} dönemleri için olabilir. f<sub>${t}</sub> = min<sub>j</sub> { c<sub>${t}j</sub> + f<sub>${t}+j+1</sub> } ve minimumu veren üretimin karşıladığı <b>son dönemi</b> (t + j) yaz.`,
        fields: single ? [{ label: `f${S(T)}`, answer: R.f[T] }] : [{ label: `f${S(t)}`, answer: R.f[t] }, { label: 'karşılanan son dönem t+j', answer: t + R.jb[t] }],
        hint: `c<sub>tj</sub> = K + c·(d<sub>t</sub> + … + d<sub>t+j</sub>) + h·(d<sub>t+1</sub> + 2d<sub>t+2</sub> + … + j·d<sub>t+j</sub>); f<sub>t+j+1</sub> değerleri tabloda.`,
        explain: lines + (single ? '' : `<br>→ f<sub>${t}</sub> = <b>${R.f[t]}</b>: dönem ${t}'de ${per(t, R.jb[t])} dönemlerinin talebi üretilir.`),
        vizDuring: during,
        viz: after,
      });
    }
    return steps;
  }

  function buildWW(rng, opts) {
    opts = opts || {};
    let P, R;
    if (opts.notes) {
      P = NOTES;
      R = ww(P);
    } else {
      const tOpt = String(opts.T || 'mix');
      for (let tries = 0; tries < 4000 && !P; tries++) {
        const T = tOpt === 'mix' ? rng.int(4, 6) : +tOpt;
        const Q = gen(rng, T);
        const r = ww(Q);
        if (!r.unique) continue;
        if (r.setups.length < 2 || r.setups.every(([a, b]) => a === b)) continue; // at least one multi-period lot, >= 2 setups
        P = Q;
        R = r;
      }
      if (!P) throw new Error('uygun lot-size örneği bulunamadı');
    }
    const T = P.T;
    const steps = wwSteps(P, R);
    // schedule
    const tr = R.setups.map(([a, b]) => `f<sub>${a}</sub> → dönem ${a}'de ${a === b ? `d<sub>${a}</sub>` : `d<sub>${a}</sub> + … + d<sub>${b}</sub>`} = ${R.x[a - 1]} üret${b < T ? `, dönem ${b + 1}'e sıfır stokla gir` : ''}`).join('; ');
    steps.push({
      kind: 'number',
      prompt: `<b>Optimal üretim planı.</b> f<sub>1</sub>'den başlayarak ileriye doğru git: her dönemin üretim miktarı x<sub>t</sub> nedir? (Üretim yapılmayan dönem için 0.)`,
      fields: R.x.map((v, k) => ({ label: `x${S(k + 1)}`, answer: v })).concat([{ label: 'Toplam maliyet f<sub>1</sub>', answer: R.z }]),
      hint: 'f₁\'i veren j → dönem 1 üretimi d₁+…+d₁₊ⱼ; sonra dönem 1+j+1\'in kararına bak; atlanan dönemlerde x = 0.',
      explain: `${tr}. Toplam maliyet f<sub>1</sub> = <b>${R.z}</b>.`,
      viz: [dataViz(P, R.x), wwViz(P, R, Object.fromEntries(OR.util.range(T).map((k) => [k + 1, true])))],
    });
    steps.push({
      kind: 'info',
      prompt: `Her optimal plan toplam d<sub>1</sub> + … + d<sub>${T}</sub> = ${sum(P.d)} birim üretir, değişken maliyet her zaman ${P.c}·${sum(P.d)} = ${P.c * sum(P.d)} olur. Bu yüzden c ihmal edilerek de hesap yapılabilir: setup + holding = ${R.z} − ${P.c * sum(P.d)} = <b>${R.zNoVar}</b> (Silver-Meal bu maliyeti kullanır).`,
    });
    const isNotes = P === NOTES;
    return {
      title: isNotes ? 'Wagner-Whitin (Örnek 6.14)' : 'Dynamic Lot-Size · Wagner-Whitin',
      statement: `<p>${T} dönemlik dynamic lot-size modeli: K = <b>${P.K}</b> (setup), c = <b>${P.c}</b> (birim üretim), h = <b>${P.h}</b> (dönem sonu stok başına holding); talepler sağdaki tabloda. Başlangıç stoğu 0, talepler zamanında karşılanmalı. Optimal üretim planını <b>Wagner-Whitin</b> algoritmasıyla bul.</p>
        <p>f<sub>t</sub> = dönem t'ye sıfır stokla girildiğinde t, …, ${T} dönemlerinin minimum maliyeti.<br>
        <b>f<sub>t</sub> = min<sub>j=0,…,${T}−t</sub> { c<sub>tj</sub> + f<sub>t+j+1</sub> }</b>, f<sub>${T + 1}</sub> = 0,<br>
        c<sub>tj</sub> = K + c(d<sub>t</sub> + … + d<sub>t+j</sub>) + h(d<sub>t+1</sub> + 2d<sub>t+2</sub> + … + j·d<sub>t+j</sub>) (dönem t'de t, …, t+j dönemleri için üretim).</p>`,
      viz: dataViz(P),
      steps,
      data: P,
      solution: `Plan: ${R.x.map((v, k) => `x${S(k + 1)} = ${v}`).join(', ')}; minimum toplam maliyet f<sub>1</sub> = <b>${R.z}</b> (setup + holding = ${R.zNoVar}).`,
    };
  }

  // ------------------------------------------------------------------ S-M steps
  function smTable(P, c, shownRows) {
    return {
      type: 'matrix',
      caption: `Dönem ${c.s}'den başlayan döngü`,
      corner: 'k',
      rowLabels: c.rows.map((r) => r.k),
      colLabels: ['kapsanan dönemler', 'TC(k)', 'AC(k) = TC/k'],
      cells: c.rows.map((r, i) => [per(c.s, r.k - 1), i < shownRows ? r.tc : '?', i < shownRows ? r.ac.html() + (r.ac.isInt() ? '' : ` ≈ ${r.ac.dec(2)}`) : '?']),
      cls: c.rows.map((r) => ['', '', shownRows && r.k === c.tstar ? 'hl' : '']),
    };
  }

  function buildSM(rng, opts) {
    opts = opts || {};
    let P, M, R;
    if (opts.notes) {
      P = NOTES;
      M = sm(P);
      R = ww(P);
    } else {
      const tOpt = String(opts.T || 'mix');
      for (let tries = 0; tries < 4000 && !P; tries++) {
        const T = tOpt === 'mix' ? rng.int(4, 6) : +tOpt;
        const Q = gen(rng, T);
        const m = sm(Q);
        if (m.tie) continue;
        if (m.cycles.length < 2 || m.cycles.every((c) => c.tstar === 1)) continue;
        const r = ww(Q);
        if (!r.unique) continue;
        // keep a mix of instances where S-M is / is not optimal
        if (m.cost === r.zNoVar && rng.chance(0.4)) continue;
        P = Q;
        M = m;
        R = r;
      }
      if (!P) throw new Error('uygun Silver-Meal örneği bulunamadı');
    }
    const T = P.T;
    const steps = [];
    let xSoFar = Array(T).fill(null);
    M.cycles.forEach((c, ci) => {
      const firstRow = c.rows[0];
      const lines = c.rows
        .map((r) => `TC(${r.k}) = ${P.K}${r.k > 1 ? ` + ${c.rows.slice(1, r.k).map((q) => q.add).join(' + ')}` : ''} = ${r.tc}, AC(${r.k}) = ${r.tc}/${r.k} = ${r.ac.html()}${r.ac.isInt() ? '' : ` ≈ ${r.ac.dec(2)}`}`)
        .join('<br>');
      const stopTxt = c.stoppedByEnd
        ? c.rows.length === 1
          ? `Dönem ${c.s} son dönem; sadece d<sub>${c.s}</sub> üretilir.`
          : `AC hiç artmadı ve dönem ${T}'ten sonra dönem yok → t* = ${c.tstar}.`
        : `AC(${c.tstar + 1}) &gt; AC(${c.tstar}) → t* = ${c.tstar}.`;
      const xv = xSoFar.slice();
      xv[c.s - 1] = c.q;
      for (let k = 1; k < c.tstar; k++) xv[c.s - 1 + k] = 0;
      const lastCycle = c.s === T;
      steps.push({
        kind: 'number',
        prompt: lastCycle
          ? `<b>Dönem ${c.s}</b> (son dönem): Başka dönem kalmadı, sadece TC(1) = K. Dönem ${c.s}'de kaç birim üretilir?`
          : `<b>Dönem ${c.s}'den başla.</b> Dönem ${c.s} üretimi k dönemi karşılarsa TC(k) = K + HC(k), AC(k) = TC(k)/k. AC(k)'yı k = 1, 2, … için, AC artana kadar (ya da dönemler bitene kadar) hesapla; sonra dönem ${c.s} üretim miktarını yaz. <span class="muted">(Kesir ya da 2 ondalık yazabilirsin.)</span>`,
        fields: lastCycle
          ? [{ label: `x${S(c.s)}`, answer: c.q }]
          : c.rows.map((r) => ({ label: `AC(${r.k})`, answer: r.ac })).concat([{ label: `x${S(c.s)}`, answer: c.q }]),
        hint: lastCycle
          ? 'Sadece kendi talebi.'
          : `HC(k): dönem ${c.s}+m'nin talebi m dönem taşınır → h·(1·d<sub>${c.s + 1}</sub> + 2·d<sub>${c.s + 2}</sub> + …). İlk artışta dur: t* = son azalan k.`,
        explain: `${lines}<br>${stopTxt} Dönem ${c.s}'de ${c.tstar === 1 ? `d<sub>${c.s}</sub>` : `d<sub>${c.s}</sub> + … + d<sub>${c.s + c.tstar - 1}</sub>`} = <b>${c.q}</b> üretilir${c.s + c.tstar <= T ? `; sıradaki başlangıç dönemi ${c.s + c.tstar}` : ''}.`,
        vizDuring: [dataViz(P, xSoFar.map((v) => (v == null ? '?' : v))), smTable(P, c, 0)],
        viz: [dataViz(P, xv.map((v) => (v == null ? '?' : v))), smTable(P, c, c.rows.length)],
      });
      xSoFar = xv;
      if (firstRow == null) throw new Error('bad cycle');
    });
    steps.push({
      kind: 'number',
      prompt: `<b>S-M planının maliyeti.</b> Değişken üretim maliyeti hariç (setup + holding) toplam maliyet nedir?`,
      fields: [{ label: 'Setup + holding', answer: M.cost }],
      hint: `${M.cycles.length} setup × K + taşınan stokların holding maliyeti.`,
      explain: `${M.cycles.length} setup × ${P.K} = ${M.setupCost}; holding = ${M.hold} → toplam <b>${M.cost}</b>${P.c ? ` (değişken maliyetle birlikte ${M.cost} + ${P.c}·${sum(P.d)} = ${M.cost + P.c * sum(P.d)})` : ''}.`,
      viz: dataViz(P, M.x),
    });
    if (opts.ww !== false) {
      const same = M.cost === R.zNoVar;
      steps.push({
        kind: 'info',
        prompt: `<b>Wagner-Whitin ile karşılaştırma.</b> Optimal (WW) plan: ${R.x.map((v, k) => `x${S(k + 1)} = ${v}`).join(', ')}; setup + holding = <b>${R.zNoVar}</b>. ${
          same
            ? 'Bu örnekte S-M heuristic <b>optimal</b> planı buldu (notlardaki Örnek 6.14 gibi).'
            : `S-M planı ${M.cost} → optimalden ${M.cost - R.zNoVar} (%${((100 * (M.cost - R.zNoVar)) / R.zNoVar).toFixed(1)}) pahalı. S-M bir heuristic'tir, optimaliteyi garanti etmez (notlar: genellikle optimalin %1'i kadar yakın).`
        }`,
      });
    }
    const isNotes = P === NOTES;
    return {
      title: isNotes ? 'Silver-Meal Heuristic (Örnek 6.14)' : 'Dynamic Lot-Size · Silver-Meal Heuristic',
      statement: `<p>${T} dönemlik dynamic lot-size problemi: K = <b>${P.K}</b> (setup), h = <b>${P.h}</b> (dönem sonu stok başına holding), c = ${P.c} (birim maliyet; S-M'de ihmal edilir), talepler sağdaki tabloda. Başlangıç stoğu 0. <b>Silver-Meal heuristic</b> ile üretim planı bul.</p>
        <p>Başlangıç dönemi s'de üretim k dönemlik talebi karşılarsa: <b>TC(k) = K + HC(k)</b>, <b>AC(k) = TC(k)/k</b>. k = 1, 2, … için AC(k) hesaplanır; AC(t*+1) &gt; AC(t*) olunca durulur ve dönem s'de d<sub>s</sub> + … + d<sub>s+t*−1</sub> üretilir (t* yoksa kalan tüm dönemler). Sonra dönem s + t*'den aynı şekilde devam edilir.</p>`,
      viz: dataViz(P),
      steps,
      data: P,
      solution: `S-M planı: ${M.x.map((v, k) => `x${S(k + 1)} = ${v}`).join(', ')}; setup + holding = <b>${M.cost}</b> (WW optimum ${R.zNoVar}).`,
    };
  }

  const T_OPT = {
    key: 'T',
    label: 'Dönem sayısı',
    type: 'select',
    default: 'mix',
    choices: [
      { value: 'mix', label: '4–6 (karışık)' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
    ],
  };
  const NOTES_OPT = { key: 'notes', label: 'Ders notundaki örneği kullan (Örnek 6.14)', type: 'checkbox', default: false };

  OR.registerDrill({
    id: 'wagner-whitin',
    topic: '6.8',
    title: 'Wagner-Whitin Algorithm',
    description: 'Dynamic lot-size modeli (K, c, h, talepler): c<sub>tj</sub> maliyetleriyle f<sub>t</sub> = min{c<sub>tj</sub> + f<sub>t+j+1</sub>} değerlerini geriye doğru hesapla, optimal üretim dönemlerini ve miktarlarını ileriye doğru bul.',
    options: [T_OPT, NOTES_OPT],
    ww,
    sm,
    gen,
    NOTES,
    generate: (rng, opts) => buildWW(rng, opts),
  });

  OR.registerDrill({
    id: 'silver-meal',
    topic: '6.8',
    title: 'Silver-Meal Heuristic',
    description: 'Aynı tür lot-size verisiyle Silver-Meal: her başlangıç döneminden AC(k) = TC(k)/k değerlerini artana kadar hesapla, üretim miktarını belirle, sonraki döngüye geç; toplam maliyeti bul ve Wagner-Whitin optimumu ile karşılaştır.',
    options: [T_OPT, { key: 'ww', label: 'Wagner-Whitin optimumu ile karşılaştır', type: 'checkbox', default: true }, NOTES_OPT],
    ww,
    sm,
    gen,
    NOTES,
    generate: (rng, opts) => buildSM(rng, opts),
  });
})();
