/* 2.5.3 · B&B for the 0-1 knapsack problem (lecture notes Example 8).
   - Before B&B: ratios r_i = c_i / a_i (number fields) and the ratio ordering (sequence).
   - Every LR is solved "by inspection" (greedy fill by ratio); lpExplain spells out the fill at each node.
   - Default: jumptracking + floor rule (fathom when floor(z) <= LB since all c_i are integers), exactly as in the notes.
   - Exposes genKnap / title / conventions so that bnb-tree-read can reuse them. */
(function () {
  const OR = window.OR;
  const F = OR.F;

  const NOTES = { c: [8, 11, 6, 4], a: [5, 7, 4, 3], b: 14 }; // Example 8

  // The notes call the LR "LR" and the subproblems P1, P2, ...
  const title = (nd) => (nd.id === 1 ? 'LR' : `P${nd.id - 1}`);
  const xs = (i) => `x<sub>${i + 1}</sub>`;
  // "8/5 = 1.6" or "11/7 ≈ 1.57"
  const ratioTxt = (c, a) => {
    const q = F(c).div(a);
    const d = q.dec(2);
    return `${c}/${a} ${F(d).eq(q) ? '=' : '≈'} ${d}`;
  };
  const range = OR.util.range;

  // item indices sorted by ratio c/a, best first (ties impossible in generated instances)
  const ratioOrder = (c, a) => range(c.length).sort((i, j) => c[j] * a[i] - c[i] * a[j] || i - j);

  // brute force over all 2^n selections -> best value and how many selections reach it
  function ipOpt(c, a, b) {
    const n = c.length;
    let best = null;
    let count = 0;
    for (let m = 0; m < 1 << n; m++) {
      let w = 0, z = 0;
      for (let j = 0; j < n; j++) if ((m >> j) & 1) { w += a[j]; z += c[j]; }
      if (w > b) continue;
      if (best === null || z > best) { best = z; count = 1; } else if (z === best) count++;
    }
    return { z: best, count };
  }

  // jumptracking: the best-z active node must be unique, otherwise "which node next?" has two answers
  function jumpTie(tr) {
    for (const e of tr.events) {
      if (e.type === 'select' && e.rule === 'jump' && e.pool.length > 1) {
        const zs = e.pool.map((id) => tr.nodes[id - 1].lp.z).sort((p, q) => q.cmp(p));
        if (zs[0].eq(zs[1])) return true;
      }
    }
    return false;
  }

  // Greedy fill at a node (the LR "by inspection").
  function fillInfo(c, a, b, nd, ord) {
    const n = c.length;
    const st = range(n).map((i) => (nd.lo[i].eq(1) ? 'in' : nd.hi[i] != null && nd.hi[i].eq(0) ? 'out' : 'free'));
    const used = range(n).reduce((s, i) => s + (st[i] === 'in' ? a[i] : 0), 0);
    const info = { st, used, infeasible: used > b, steps: [], left: b - used };
    if (info.infeasible) return info;
    let left = b - used;
    for (const i of ord) {
      if (st[i] !== 'free') continue;
      if (left >= a[i] && left > 0) { info.steps.push({ i, x: F(1), before: left, after: left - a[i], kind: 'full' }); left -= a[i]; }
      else if (left > 0) { info.steps.push({ i, x: new OR.Frac(left, a[i]), before: left, after: 0, kind: 'frac' }); left = 0; }
      else info.steps.push({ i, x: F(0), before: 0, after: 0, kind: 'none' });
    }
    return info;
  }

  function lpExplainFor(P, ord) {
    const c = P.c, a = P.A[0], b = P.b[0];
    return (nd) => {
      const f = fillInfo(c, a, b, nd, ord);
      const ins = range(c.length).filter((i) => f.st[i] === 'in');
      const outs = range(c.length).filter((i) => f.st[i] === 'out');
      const parts = [];
      if (ins.length) {
        const sum = ins.map((i) => a[i]).join(' + ');
        if (f.infeasible) {
          return `<b>Inspection:</b> x = 1 olarak sabitlenen itemler ${ins.map(xs).join(', ')} kapasiteden ${ins.length > 1 ? sum + ' = ' : ''}${f.used} birim kullanır; ${f.used} &gt; b = ${b} → kısıt daha sabit itemlerle bile sağlanamıyor → <b>infeasible</b> (notlardaki P6 gibi).`;
        }
        parts.push(`x = 1 sabit: ${ins.map(xs).join(', ')} kapasiteden ${ins.length > 1 ? sum + ' = ' : ''}${f.used} kullanır → kalan kapasite ${b} − ${f.used} = ${b - f.used}`);
      } else parts.push(`Kalan kapasite b = ${b}`);
      if (outs.length) parts.push(`x = 0 sabit: ${outs.map(xs).join(', ')} çantaya girmez`);
      const fills = f.steps.map((s) => {
        const r = F(c[s.i]).div(a[s.i]).dec(2);
        if (s.kind === 'full') return `${xs(s.i)} (r = ${r}, a = ${a[s.i]} ≤ ${s.before}) → 1, kalan ${s.after}`;
        if (s.kind === 'frac') return `${xs(s.i)} (r = ${r}, a = ${a[s.i]} &gt; ${s.before}) → ${s.before}/${a[s.i]}${s.x.toString() === `${s.before}/${a[s.i]}` ? '' : ' = ' + s.x.toString()} (kesirli, son item), kalan 0`;
        return `${xs(s.i)} → 0 (kapasite doldu)`;
      });
      if (fills.length) parts.push(`Serbest itemleri r sırasıyla doldur: ${fills.join('; ')}`);
      const terms = range(c.length)
        .filter((i) => nd.lp.x[i].gt(0))
        .map((i) => (nd.lp.x[i].eq(1) ? `${c[i]}` : `${c[i]}·(${nd.lp.x[i].toString()})`));
      return `<b>Inspection:</b> ${parts.join('. ')}. z = ${terms.join(' + ')} = ${nd.lp.z.toString()}.`;
    };
  }

  // Item table shown beside the tree: fixed/free status of every item at the node (+ the LR solution once solved)
  function itemViz(P, ord) {
    const c = P.c, a = P.A[0], b = P.b[0];
    return (nd, solved) => {
      const ok = nd.lp && nd.lp.status === 'optimal';
      const showX = solved && ok;
      const cells = [];
      const cls = [];
      ord.forEach((i) => {
        const fixed1 = nd.lo[i].eq(1);
        const fixed0 = nd.hi[i] != null && nd.hi[i].eq(0);
        const row = [String(c[i]), String(a[i]), F(c[i]).div(a[i]).dec(2), fixed1 ? 'x = 1 (sabit)' : fixed0 ? 'x = 0 (sabit)' : 'serbest'];
        const rc = ['', '', '', fixed1 ? 'hl' : fixed0 ? 'dim' : ''];
        if (solved) {
          if (showX) {
            const x = nd.lp.x[i];
            row.push(x.toString());
            rc.push(x.eq(1) ? 'hl' : x.isZero() ? 'dim' : 'sel');
          } else { row.push('—'); rc.push('dim'); }
        }
        cells.push(row);
        cls.push(rc);
      });
      return {
        type: 'matrix',
        caption: `${title(nd)} · kapasite b = ${b}${showX ? ` · x* ile kullanılan kapasite = ${a.reduce((s, ai, i) => s.add(F(ai).mul(nd.lp.x[i])), F(0)).toString()}` : ''}${solved && !ok ? ' · infeasible' : ''}`,
        corner: 'item (r büyükten küçüğe)',
        rowLabels: ord.map((i) => `${i + 1}`),
        colLabels: ['c', 'a', 'r = c/a', 'bu düğümde'].concat(solved ? ['x*'] : []),
        cells,
        cls,
      };
    };
  }

  // Plain data table (no node information): optionally with ratios, in the given row order
  function baseTable(P, ord, withR) {
    const c = P.c, a = P.A[0];
    return {
      type: 'matrix',
      caption: `Itemler · kapasite b = ${P.b[0]}`,
      corner: 'item',
      rowLabels: ord.map((i) => `${i + 1}`),
      colLabels: ['c', 'a'].concat(withR ? ['r = c/a'] : []),
      cells: ord.map((i) => [String(c[i]), String(a[i])].concat(withR ? [F(c[i]).div(a[i]).dec(2)] : [])),
    };
  }

  function mkP(c, a, b) {
    return { c, A: [a], b: [b], lo: c.map(() => 0), hi: c.map(() => 1), intVars: range(c.length) };
  }

  // Random instance + trace. o = {n, order, firstChild}. check(trace, P) optional extra filter.
  function genKnap(rng, o, check) {
    const n = o.n || 4;
    for (let tries = 0; tries < 1500; tries++) {
      const a = range(n).map(() => rng.int(2, 9));
      const c = range(n).map(() => rng.int(3, 14));
      const sa = a.reduce((s, x) => s + x, 0);
      const b = Math.round(sa * (0.45 + 0.3 * rng()));
      if (b < Math.max(...a) + 1 || b >= sa) continue;
      // pairwise distinct ratios, at least 0.04 apart (so rounded ratios never tie)
      let okR = true;
      for (let i = 0; i < n && okR; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(c[i] / a[i] - c[j] / a[j]) < 0.04) { okR = false; break; }
      }
      if (!okR) continue;
      const P = mkP(c, a, b);
      const tr = OR.bnb.run(P, { order: o.order, firstChild: o.firstChild, floorRule: true, maxNodes: 24 });
      if (tr.aborted || tr.ambiguous || !tr.best) continue;
      const minLP = tries < 200 ? 7 : 5;
      if (tr.nSolved < minLP || tr.nSolved > 11) continue;
      const kinds = new Set(tr.events.map((e) => e.type));
      if (!(kinds.has('infeasible') || kinds.has('bound') || kinds.has('prune'))) continue;
      if (!kinds.has('candidate')) continue;
      if (ipOpt(c, a, b).count !== 1) continue;
      if (jumpTie(tr)) continue;
      if (check && !check(tr, P)) continue;
      // small trees are more useful for hand work: keep 11-LP trees less often
      if (rng() > { 5: 1, 7: 1, 9: 0.6, 11: 0.3 }[tr.nSolved]) continue;
      return { P, trace: tr };
    }
    return null;
  }

  const OPTIONS = [
    {
      key: 'order',
      label: 'Arama sırası',
      type: 'select',
      default: 'jump',
      choices: [
        { value: 'jump', label: 'Jumptracking (notlardaki gibi)' },
        { value: 'lifo', label: 'LIFO (backtracking)' },
      ],
    },
    {
      key: 'firstChild',
      label: 'LIFO\'da önce',
      type: 'select',
      default: 'up',
      choices: [
        { value: 'up', label: 'x = 1 dalı' },
        { value: 'down', label: 'x = 0 dalı' },
      ],
    },
    {
      key: 'n',
      label: 'Item sayısı',
      type: 'select',
      default: '4',
      choices: [
        { value: '4', label: '4' },
        { value: '5', label: '5' },
      ],
    },
    { key: 'askLP', label: 'LP çözümlerini (inspection) ben hesaplayayım', type: 'checkbox', default: true },
    { key: 'useNotes', label: 'Ders notundaki örnek (Example 8)', type: 'checkbox', default: false },
  ];

  function conventions(opts) {
    return `<ul class="conv">
      <li>Her alt problemin LR'ı (0 ≤ x<sub>j</sub> ≤ 1) <b>inspection</b> ile çözülür: r<sub>i</sub> = c<sub>i</sub>/a<sub>i</sub> sırasıyla doldur, sığmayan ilk item kesirli girer.</li>
      <li>Dallanma: kesirli x<sub>j</sub> için <b>x<sub>j</sub> = 0</b> ve <b>x<sub>j</sub> = 1</b>. Alt problemler oluşturulma sırasıyla numaralanır (LR → P1, P2, …); önce x<sub>j</sub> = 0 dalı numaralanır (notlardaki gibi). Kesirli olanlar içinden indisi en küçük olan seçilir.</li>
      <li>${opts.order === 'lifo'
        ? `<b>LIFO (backtracking)</b>: en son oluşturulan çözülmemiş alt problem çözülür; dallanmadan sonra önce <b>x = ${opts.firstChild === 'down' ? '0' : '1'}</b> dalı.`
        : '<b>Jumptracking</b>: dallanınca iki alt problem de hemen çözülür; sonra aktif düğümlerden en iyi z\'li olanda dallanılır.'}</li>
      <li>Fathom: infeasible · tamsayı çözüm (candidate) · <b>⌊z⌋ ≤ LB</b> (c<sub>i</sub> tamsayı olduğundan her tamsayı çözümün z'si tamsayıdır; notlardaki P1 gibi).</li>
    </ul>`;
  }

  OR.registerDrill({
    id: 'bnb-knapsack',
    topic: '2.5.3',
    title: 'B&B · 0-1 Knapsack (inspection ile)',
    description: 'Önce r = c/a oranlarını hesapla ve sırala, sonra Branch & Bound: her LR\'ı inspection (oran sırasıyla doldurma) ile çöz, dallan, fathom et. Notlardaki Example 8 gibi.',
    options: OPTIONS,
    genKnap,
    fillInfo,
    ratioOrder,
    titleOf: title,
    conventions,
    generate(rng, rawOpts) {
      const opts = Object.assign({ order: 'jump', firstChild: 'up', n: '4', askLP: true, useNotes: false }, rawOpts || {});
      const n = Number(opts.n) === 5 ? 5 : 4;
      let P, trace;
      if (opts.useNotes) {
        P = mkP(NOTES.c.slice(), NOTES.a.slice(), NOTES.b);
        trace = OR.bnb.run(P, { order: opts.order, firstChild: opts.firstChild, floorRule: true });
      } else {
        const res = genKnap(rng, { n, order: opts.order, firstChild: opts.firstChild });
        if (!res) throw new Error('uygun problem bulunamadı');
        ({ P, trace } = res);
      }
      const c = P.c, a = P.A[0], b = P.b[0];
      const N = c.length;
      const ord = ratioOrder(c, a);
      const best = trace.best;
      const chosen = range(N).filter((i) => best.x[i].eq(1));

      const steps = [];
      steps.push({
        kind: 'number',
        prompt: 'Önce her item için <b>r<sub>i</sub> = c<sub>i</sub> / a<sub>i</sub></b> oranını hesapla (kaynağın her birimi başına kazanç).',
        fields: range(N).map((i) => ({ label: `r<sub>${i + 1}</sub> = ${c[i]}/${a[i]}`, answer: F(c[i]).div(a[i]) })),
        hint: 'Her oran c<sub>i</sub> ÷ a<sub>i</sub>; kesir ya da ondalık yazabilirsin.',
        explain: `Oranlar: ${range(N).map((i) => `r<sub>${i + 1}</sub> = ${ratioTxt(c[i], a[i])}`).join(' · ')}.`,
        viz: baseTable(P, range(N), true),
      });
      steps.push({
        kind: 'sequence',
        prompt: 'Items\'ı orana göre <b>en iyiden (en büyük r) en kötüye</b> sırala. Item numaralarını tire ile yaz (ör. 2-1-3-4).',
        sequence: { answer: ord.map((i) => String(i + 1)), placeholder: 'ör. 2-1-3-4' },
        explain: `Sıralama: ${ord.map((i) => `${i + 1} (r = ${F(c[i]).div(a[i]).dec(2)})`).join(' › ')}. En iyi item en büyük r\'ye sahip olandır; LR çözümünde itemler bu sırayla çantaya konur, sığmayan ilk item kısmen (kesirli) alınır.`,
        viz: baseTable(P, ord, true),
      });

      const bb = OR.bnbSteps.build(trace, {
        askLP: opts.askLP,
        title,
        lpHint: () => 'Önce x = 1 sabit itemleri yerleştir (kapasiteyi düşer), x = 0 olanları at; kalanları r sırasıyla doldur. Sığmayan ilk item kesirli girer. Sabit itemler bile sığmıyorsa infeasible.',
        lpExplain: lpExplainFor(P, ord),
        plot: itemViz(P, ord),
      });
      bb.forEach((s) => steps.push(s));
      steps.push({
        kind: 'number',
        prompt: `B&B toplam kaç LP çözdü (LR dahil)? (Karşılaştırma: tam enumerasyonda 2<sup>${N}</sup> = ${1 << N} aday çözüm var.)`,
        fields: [{ label: 'çözülen LP sayısı', answer: trace.nSolved }],
        explain: `${trace.nSolved} LP çözüldü; tam enumerasyon ${1 << N} çözümü tek tek kontrol ederdi. Notlardaki gibi: fathom edilen düğümlerin altındaki çözümler hiç incelenmeden elenir (implicit enumeration).`,
      });

      return {
        title: 'Branch & Bound · 0-1 Knapsack',
        statement: `<p>Aşağıdaki knapsack problemini Branch &amp; Bound ile çöz:</p>
          ${OR.bnbSteps.modelHtml(P, { tail: `x<sub>j</sub> = 0 or 1, j = 1, …, ${N}` })}
          <p><b>Kurallar:</b></p>${conventions(opts)}
          <p class="muted">Sayıları kesir (153/7) veya ondalık (21.86) olarak girebilirsin.${opts.useNotes ? ' (Bu, ders notlarındaki Example 8\'in aynısıdır.)' : ''}</p>`,
        viz: baseTable(P, range(N), false),
        steps,
        solution: `<b>Optimal:</b> z* = ${best.z.show()}, x = (${best.x.map((v) => v.toString()).join(', ')}) → item ${chosen.map((i) => i + 1).join(', ')} çantaya girer (toplam ağırlık ${chosen.reduce((s, i) => s + a[i], 0)} ≤ ${b}). ${trace.nSolved} LP çözüldü (2<sup>${N}</sup> = ${1 << N} aday yerine).`,
      };
    },
  });
})();
