/* 2.6.2 · TSP by Branch & Bound with the assignment relaxation (Joe State, Winston 9.6 / notes Example 10).
   - 5 cities, symmetric integer distances, c_ii = M.
   - Every subproblem is an assignment problem solved here by brute force over all derangements (44 for n=5);
     M entries (diagonal + arcs forbidden by branching) are forbidden.
   - Branching: subtour with the FEWEST cities (tie -> contains the smallest city index); one child per arc of that
     subtour (in order, starting at the subtour's smallest city); child forbids that arc (x_ij = 0  <=>  c_ij = M).
   - Search: LIFO, first child first. MIN problem: a tour gives an upper bound UB; fathom if z >= UB / infeasible.
   Exposes OR.drills['tsp-bnb'].run(D) -> trace (used by verification scripts). */
(function () {
  const OR = window.OR;
  const esc = OR.util.esc;
  const M = Infinity;

  const JOE = [
    [M, 132, 217, 164, 58],
    [132, M, 290, 201, 79],
    [217, 290, M, 113, 303],
    [164, 201, 113, M, 196],
    [58, 79, 303, 196, M],
  ];

  // ------------------------------------------------------------------ combinatorics
  const derCache = {};
  function derangements(n) {
    if (derCache[n]) return derCache[n];
    const out = [];
    const used = [];
    const cur = [];
    (function rec(i) {
      if (i === n) {
        out.push(cur.slice());
        return;
      }
      for (let j = 0; j < n; j++) {
        if (used[j] || j === i) continue;
        used[j] = true;
        cur.push(j);
        rec(i + 1);
        cur.pop();
        used[j] = false;
      }
    })(0);
    derCache[n] = out;
    return out;
  }
  const invert = (p) => {
    const q = [];
    p.forEach((j, i) => (q[j] = i));
    return q;
  };
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  // cycles of a permutation; each cycle starts at its smallest city, cycles ordered by smallest city
  function cyclesOf(p) {
    const seen = [];
    const out = [];
    for (let i = 0; i < p.length; i++) {
      if (seen[i]) continue;
      const c = [];
      let j = i;
      while (!seen[j]) {
        seen[j] = true;
        c.push(j);
        j = p[j];
      }
      out.push(c);
    }
    return out;
  }

  // Optimal assignment with forbidden arcs (forb: set keyed i*n+j). Brute force.
  // Among tied optimal assignments the lexicographically largest p is reported.
  // tiesOk: every tied assignment is p itself or its inverse (= every cycle traversed backwards, same arcs reversed).
  function solveAssign(D, forbSet) {
    const n = D.length;
    let bestZ = Infinity;
    let sols = [];
    for (const p of derangements(n)) {
      let z = 0;
      let ok = true;
      for (let i = 0; i < n; i++) {
        const c = D[i][p[i]];
        if (c === M || forbSet[i * n + p[i]]) {
          ok = false;
          break;
        }
        z += c;
      }
      if (!ok) continue;
      if (z < bestZ) {
        bestZ = z;
        sols = [p];
      } else if (z === bestZ) sols.push(p);
    }
    if (!sols.length) return null;
    const p = sols[sols.length - 1];
    const inv = invert(p);
    return {
      z: bestZ,
      p,
      tiesOk: sols.every((q) => same(q, p) || same(q, inv)),
      reversedTie: sols.length > 1,
    };
  }

  // ------------------------------------------------------------------ B&B trace
  function run(D) {
    const n = D.length;
    const nodes = [];
    const mk = (parent, arc) => {
      const nd = {
        id: nodes.length + 1,
        parent: parent ? parent.id : null,
        arc,
        forb: (parent ? parent.forb : []).concat(arc ? [arc] : []),
        kids: [],
      };
      nodes.push(nd);
      if (parent) parent.kids.push(nd.id);
      return nd;
    };
    const stack = [mk(null, null)];
    const order = [];
    let UB = Infinity;
    let best = null;
    let ambiguous = false;
    while (stack.length) {
      const nd = stack.pop();
      nd.k = order.length;
      order.push(nd);
      nd.ubBefore = UB;
      const forbSet = {};
      nd.forb.forEach((a) => (forbSet[a[0] * n + a[1]] = true));
      const r = solveAssign(D, forbSet);
      if (!r) nd.kind = 'infeasible';
      else {
        nd.z = r.z;
        nd.p = r.p;
        nd.cycles = cyclesOf(r.p);
        nd.reversedTie = r.reversedTie;
        if (!r.tiesOk) ambiguous = true;
        // A tie with the incumbent is harmless only if this node's tour is the incumbent tour traversed backwards
        // (inherent in the symmetric problem: the right subtree mirrors the left one).
        if (r.z === UB) {
          const mirror = best && r.p.length > 0 && (same(r.p, invert(best.p)) || same(r.p, best.p));
          if (!mirror) ambiguous = true;
          else nd.mirrorOfUB = true;
        }
        if (nd.cycles.length === 1) {
          if (r.z < UB) {
            nd.kind = 'candidate';
            UB = r.z;
            best = nd;
          } else nd.kind = 'bound';
        } else if (r.z >= UB) nd.kind = 'bound';
        else {
          nd.kind = 'branch';
          let sub = nd.cycles[0];
          nd.cycles.forEach((c) => {
            if (c.length < sub.length) sub = c;
          });
          nd.sub = sub;
          nd.arcs = sub.map((c, t) => [c, sub[(t + 1) % sub.length]]);
          const kids = nd.arcs.map((a) => mk(nd, a));
          for (let t = kids.length - 1; t >= 0; t--) stack.push(kids[t]);
        }
      }
      nd.ubAfter = UB;
      nd.stackAfter = stack.map((x) => x.id).reverse(); // top of the stack first
    }
    return { n, D, nodes, order, UB, best, ambiguous };
  }

  // brute-force optimum over all (n-1)! directed tours from city 0 (symmetric -> every undirected tour twice)
  function bruteTours(D) {
    const n = D.length;
    const res = [];
    const rest = [];
    for (let i = 1; i < n; i++) rest.push(i);
    const cur = [0];
    const used = [];
    (function rec() {
      if (cur.length === n) {
        let z = D[cur[n - 1]][0];
        for (let i = 0; i + 1 < n; i++) z += D[cur[i]][cur[i + 1]];
        res.push({ z, t: cur.slice() });
        return;
      }
      for (const c of rest) {
        if (used[c]) continue;
        used[c] = true;
        cur.push(c);
        rec();
        cur.pop();
        used[c] = false;
      }
    })();
    return res;
  }

  // ------------------------------------------------------------------ random instance
  function randomD(rng, n) {
    for (let t = 0; t < 500; t++) {
      const pts = [];
      for (let i = 0; i < n; i++) pts.push([rng.int(0, 220), rng.int(0, 220)]);
      const D = [];
      let ok = true;
      for (let i = 0; i < n; i++) {
        D.push([]);
        for (let j = 0; j < n; j++) {
          if (i === j) D[i].push(M);
          else {
            const d = Math.round(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
            if (d < 40 || d > 320) ok = false;
            D[i].push(d);
          }
        }
      }
      if (ok) return D;
    }
    return null;
  }

  // ------------------------------------------------------------------ rendering helpers
  const X = (i, j) => `x<sub>${i + 1}${j + 1}</sub>`;
  const Cc = (i, j) => `c<sub>${i + 1}${j + 1}</sub>`;
  const cyc = (c) => c.map((v) => v + 1).concat(c[0] + 1).join('–');
  const partKey = (cs) => cs.map((c) => c.slice().sort((a, b) => a - b).join(',')).sort().join('|');

  const ST = {
    pending: { cls: 'st-pending', label: 'çözülmedi' },
    solved: { cls: 'st-solved', label: '' },
    branched: { cls: 'st-branched', label: 'dallanıldı' },
    candidate: { cls: 'st-candidate', label: 'Candidate (UB)' },
    superseded: { cls: 'st-superseded', label: 'Candidate (geçildi) ✕' },
    bound: { cls: 'st-bound', label: 'Fathomed: z ≥ UB ✕' },
    infeasible: { cls: 'st-infeasible', label: 'Infeasible ✕' },
  };

  // Own tree renderer (the core one has max-problem wording); reuses the core svg.bbtree css classes.
  function treeViz(nodes, caption, ubText) {
    if (!nodes.length) return null;
    const byId = {};
    nodes.forEach((n) => (byId[n.id] = Object.assign({ kids: [] }, n)));
    let root = null;
    nodes.forEach((n) => {
      if (n.parent != null && byId[n.parent]) byId[n.parent].kids.push(byId[n.id]);
      else if (!root) root = byId[n.id];
    });
    Object.values(byId).forEach((n) => n.kids.sort((a, b) => a.id - b.id));
    const W = 128;
    const GAP = 14;
    const LH = 14;
    const maxLines = Math.max(1, ...nodes.map((n) => n.lines.length));
    const H = 20 + LH * maxLines + 16;
    const VGAP = 46;
    let slot = 0;
    let maxDepth = 0;
    const place = (n, d) => {
      maxDepth = Math.max(maxDepth, d);
      if (!n.kids.length) n.x = slot++ * (W + GAP);
      else {
        n.kids.forEach((k) => place(k, d + 1));
        n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
      }
      n.y = d * (H + VGAP);
    };
    place(root, 0);
    const padL = 10;
    const padT = 8;
    const width = slot * (W + GAP) - GAP + padL + 10;
    const height = (maxDepth + 1) * (H + VGAP) - VGAP + padT + 10;
    let svg = `<svg class="bbtree" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    Object.values(byId).forEach((n) => {
      n.kids.forEach((k) => {
        const x1 = padL + n.x + W / 2;
        const y1 = padT + n.y + H;
        const x2 = padL + k.x + W / 2;
        const y2 = padT + k.y;
        svg += `<line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        if (k.edge) {
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const anchor = x2 < x1 ? 'end' : x2 > x1 ? 'start' : 'middle';
          const dx = x2 < x1 ? -5 : x2 > x1 ? 5 : 0;
          svg += `<text class="elabel" x="${mx + dx}" y="${my + 4}" text-anchor="${anchor}">${esc(k.edge)}</text>`;
        }
      });
    });
    Object.values(byId).forEach((n) => {
      const st = ST[n.status] || ST.solved;
      const x = padL + n.x;
      const y = padT + n.y;
      svg += `<g class="node ${st.cls}${n.highlight ? ' hl' : ''}"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="7"/>`;
      svg += `<text class="ntitle" x="${x + W / 2}" y="${y + 15}" text-anchor="middle">${esc(n.title)}</text>`;
      n.lines.forEach((ln, i) => {
        svg += `<text class="nline" x="${x + W / 2}" y="${y + 30 + i * LH}" text-anchor="middle">${esc(ln)}</text>`;
      });
      if (st.label) svg += `<text class="nstatus" x="${x + W / 2}" y="${y + H - 6}" text-anchor="middle">${esc(st.label)}</text>`;
      svg += `</g>`;
    });
    svg += `</svg>`;
    return {
      type: 'html',
      html: `<div class="viz-tree"><div class="viz-cap">${caption}</div><div class="viz-lb">${ubText}</div><div class="tree-scroll">${svg}</div></div>`,
    };
  }

  function nodeLines(nd) {
    if (nd.kind === 'infeasible') return ['atama yok'];
    return [`z = ${nd.z}`, nd.cycles.length === 1 ? cyc(nd.cycles[0]) : nd.cycles.map(cyc).join('  ')];
  }

  // phase 0: before solving order[k]; 1: solved, not yet decided; 2: decided (children appear)
  function treeAt(tr, k, phase) {
    const decided = phase === 2 ? k : k - 1;
    const out = [];
    tr.nodes.forEach((nd) => {
      if (nd.parent != null && tr.nodes[nd.parent - 1].k > decided) return;
      let status = 'pending';
      let lines = [];
      if (nd.k <= decided) {
        status = nd.kind === 'branch' ? 'branched' : nd.kind;
        if (status === 'candidate' && tr.order.some((o) => o.kind === 'candidate' && o.k > nd.k && o.k <= decided)) status = 'superseded';
        lines = nodeLines(nd);
      } else if (nd.k === k && phase === 1) {
        status = 'solved';
        lines = nodeLines(nd);
      }
      out.push({
        id: nd.id,
        parent: nd.parent,
        title: `Subp.${nd.id}`,
        edge: nd.arc ? `${'x' + (nd.arc[0] + 1) + (nd.arc[1] + 1)} = 0` : '',
        lines,
        status,
        highlight: nd.k === k,
      });
    });
    return out;
  }
  function ubAt(tr, k, phase) {
    const decided = phase === 2 ? k : k - 1;
    const ub = decided >= 0 ? tr.order[decided].ubAfter : Infinity;
    return ub === Infinity ? 'UB (en iyi tour) = —  (henüz tour yok)' : `UB (en iyi tour) = ${ub}`;
  }
  const treeFor = (tr, k, phase) => treeViz(treeAt(tr, k, phase), 'B&B ağacı (LIFO)', ubAt(tr, k, phase));

  function distViz(D) {
    const n = D.length;
    const lab = Array.from({ length: n }, (_, i) => i + 1);
    return {
      type: 'matrix',
      caption: 'Şehirler arası mesafeler (simetrik), c<sub>ii</sub> = M',
      corner: 'i \\ j',
      rowLabels: lab,
      colLabels: lab,
      cells: D.map((r) => r.map((v) => (v === M ? 'M' : String(v)))),
      cls: D.map((r) => r.map((v) => (v === M ? 'm' : ''))),
    };
  }
  function costViz(tr, nd) {
    const n = tr.n;
    const forbSet = {};
    nd.forb.forEach((a) => (forbSet[a[0] * n + a[1]] = true));
    const lab = Array.from({ length: n }, (_, i) => i + 1);
    const cells = [];
    const cls = [];
    for (let i = 0; i < n; i++) {
      cells.push([]);
      cls.push([]);
      for (let j = 0; j < n; j++) {
        const isM = i === j || forbSet[i * n + j];
        cells[i].push(isM ? 'M' : String(tr.D[i][j]));
        let c = isM ? 'm' : '';
        if (nd.arc && nd.arc[0] === i && nd.arc[1] === j) c += ' sel';
        if (nd.p && nd.p[i] === j) c += ' hl';
        cls[i].push(c.trim());
      }
    }
    return {
      type: 'matrix',
      caption: `Subp.${nd.id} maliyet matrisi — kırmızı <b>M</b> = yasak, çerçeveli M = bu düğümde yeni yasaklanan arc${nd.p ? ', yeşil = optimal atama (x<sub>ij</sub> = 1)' : ''}`,
      corner: 'i \\ j',
      rowLabels: lab,
      colLabels: lab,
      cells,
      cls,
    };
  }

  function conventions(joe) {
    return `<ul class="conv">
      <li><b>Subp.1</b> = atama problemi (subtour yasağı yok) → TSP'nin <b>relaxation</b>'ı. Hungarian method elle beklenmez: her alt problemin optimal ataması <b>verilir</b> (yeşil hücreler).</li>
      <li>Dallanma: <b>en az şehir içeren subtour</b> seçilir (eşitlikte en küçük şehir indeksini içeren). Subtour'un <b>her arc'ı</b> için bir alt problem: o arc yasaklanır (x<sub>ij</sub> = 0 ⇔ c<sub>ij</sub> = M). Alt problemler subtour'un en küçük şehrinden başlayarak arc sırasıyla numaralanır (notlardaki gibi: subtour 3–4–3 → Subp.2: x<sub>34</sub> = 0, Subp.3: x<sub>43</sub> = 0).</li>
      <li>Arama: <b>LIFO</b> (backtracking) — en son oluşturulan çözülmemiş alt problem; dallanınca önce <b>ilk çocuk</b>. Her alt problem çözülür, sonra karar verilir.</li>
      <li>Bu bir <b>min</b> problemi: bir <b>tour</b> bulununca uzunluğu <b>upper bound (UB)</b> olur (en iyi tour). Fathom: <b>infeasible</b> · tour (candidate, z &lt; UB ise UB güncellenir) · <b>z ≥ UB</b> (notlar: "z &lt; UB veremeyen düğüm elenir").</li>
      ${joe ? '<li>Bu ders notlarındaki Örnek 10 (Joe State, Winston 9.6).</li>' : ''}
    </ul>`;
  }

  // distractor structures for "what does the assignment look like" question
  function structureOptions(rng, p) {
    const n = p.length;
    const label = (cs) => (cs.length === 1 ? `Tek bir <b>tour</b>: ${cyc(cs[0])}` : `<b>${cs.length} subtour</b>: ${cs.map(cyc).join(' ve ')}`);
    const correct = cyclesOf(p);
    const pk = partKey(correct);
    const pool = rng.shuffle(derangements(n)).map(cyclesOf).filter((cs) => partKey(cs) !== pk);
    const picked = [];
    const used = { [pk]: true };
    const take = (pred) => {
      const f = pool.find((cs) => !used[partKey(cs)] && pred(cs));
      if (f) {
        used[partKey(f)] = true;
        picked.push(f);
      }
    };
    if (correct.length > 1) take((cs) => cs.length === 1);
    while (picked.length < 3 && pool.some((cs) => !used[partKey(cs)])) take(() => true);
    const opts = [{ html: label(correct), correct: true }];
    picked.forEach((cs) => opts.push({ html: label(cs), correct: false }));
    return opts;
  }

  function infeasibleReason(tr, nd) {
    const n = tr.n;
    const forbSet = {};
    nd.forb.forEach((a) => (forbSet[a[0] * n + a[1]] = true));
    const bad = (i, j) => i === j || forbSet[i * n + j];
    for (let i = 0; i < n; i++) {
      let all = true;
      for (let j = 0; j < n; j++) if (!bad(i, j)) all = false;
      if (all) return `${i + 1}. satırın tüm hücreleri M: ${i + 1}. şehirden hiçbir yere gidilemez.`;
    }
    for (let j = 0; j < n; j++) {
      let all = true;
      for (let i = 0; i < n; i++) if (!bad(i, j)) all = false;
      if (all) return `${j + 1}. sütunun tüm hücreleri M: ${j + 1}. şehre hiçbir yerden gelinemez.`;
    }
    return 'M olmayan hücrelerle her satıra/sütuna tam bir 1 yerleştirmek mümkün değil (hiçbir geçerli atama yok).';
  }

  // ------------------------------------------------------------------ steps
  function buildSteps(tr, rng) {
    const steps = [];
    const n = tr.n;
    const node = (id) => tr.nodes[id - 1];
    const forbList = (nd) => nd.forb.map((a) => `${X(a[0], a[1])} = 0`).join(', ');

    tr.order.forEach((nd, k) => {
      const par = nd.parent ? node(nd.parent) : null;
      const desc = par
        ? `Subp.${par.id} + (${X(nd.arc[0], nd.arc[1])} = 0, yani ${Cc(nd.arc[0], nd.arc[1])} = M)${nd.forb.length > 1 ? `<br><span class="muted">Yoldaki tüm yasaklar: ${forbList(nd)}</span>` : ''}`
        : 'atama problemi — TSP\'nin relaxation\'ı (yalnızca c<sub>ii</sub> = M)';
      const asgText = nd.p ? nd.p.map((j, i) => `${X(i, j)}`).join(' = ') + ' = 1' : '';

      // ---- 1. z of the assignment
      if (nd.kind === 'infeasible') {
        steps.push({
          kind: 'number',
          prompt: `<b>Subp.${nd.id}</b> — ${desc}.<br>Bu atama problemini çöz: optimal atamanın z değeri nedir? Uygun bir atama yoksa <b>Infeasible</b> kutusunu işaretle.`,
          fields: [{ label: 'z', answer: 0 }],
          infeasible: true,
          offerInfeasible: true,
          hint: 'Matristeki M olmayan hücrelere bak: her satıra ve her sütuna tam bir atama yapılabiliyor mu? Tamamen M olan bir satır ya da sütun var mı?',
          explain: `<b>Infeasible.</b> ${infeasibleReason(tr, nd)} Atama problemi çözümsüz olduğu için bu alt problemin TSP çözümü de yoktur.`,
          vizDuring: [treeFor(tr, k, 0), costViz(tr, nd)],
          viz: [treeFor(tr, k, 1), costViz(tr, nd)],
        });
      } else {
        const sumExpr = nd.p.map((j, i) => Cc(i, j)).join(' + ');
        const sumVals = nd.p.map((j, i) => tr.D[i][j]).join(' + ');
        steps.push({
          kind: 'number',
          prompt: `<b>Subp.${nd.id}</b> — ${desc}.<br>Hungarian method ile bulunan optimal atama (yeşil hücreler): ${asgText}.<br>Bu atamanın <b>z</b> değerini (seçilen hücrelerin toplamı) hesapla.`,
          fields: [{ label: 'z', answer: nd.z }],
          hint: 'Yeşil hücrelerdeki mesafeleri topla (beş hücre).',
          explain: `z = ${sumExpr} = ${sumVals} = <b>${nd.z}</b>.${
            nd.reversedTie
              ? ' <span class="muted">(Matris simetrik olduğundan bir subtour\'un ters yönü de aynı maliyetli bir atamadır; subtour\'ların şehir kümeleri ve z aynı kaldığı için karar değişmez.)</span>'
              : ''
          }`,
          vizDuring: [treeFor(tr, k, 0), costViz(tr, nd)],
          viz: [treeFor(tr, k, 1), costViz(tr, nd)],
        });
      }

      // ---- root: relaxation => lower bound
      if (k === 0 && nd.kind !== 'infeasible') {
        steps.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `Subp.1'de subtour yasağı yoktur; yani atama problemi TSP'nin bir <b>relaxation</b>'ıdır ve TSP bir <b>min</b> problemidir. z = ${nd.z} değeri TSP'nin optimal uzunluğu hakkında ne söyler?`,
          options: [
            { html: `<b>Lower bound</b>: her tour'un uzunluğu ≥ ${nd.z}`, correct: true },
            { html: `<b>Upper bound</b>: optimal tour uzunluğu ≤ ${nd.z}`, correct: false },
            { html: `${nd.z}, TSP'nin optimal uzunluğudur`, correct: false },
            { html: 'Hiçbir bilgi vermez', correct: false },
          ],
          explain:
            'Relaxation, orijinalden daha az kısıtlıdır (subtour\'lara izin verir): her tour aynı zamanda bir atamadır, bu yüzden min problemde relaxation\'ın optimumu TSP optimumundan büyük olamaz → <b>lower bound</b>. Atama çözümü bir tour çıkarsa TSP\'nin de optimumudur; çıkmazsa gerçek optimum ≥ z. Bir <b>tour</b> bulununca onun uzunluğu ise <b>upper bound</b> olur.',
        });
      }
      if (nd.kind !== 'infeasible') {
        // ---- 2. structure
        const cs = nd.cycles;
        const trace = cs
          .map((c) => c.map((v) => v + 1).concat(c[0] + 1).join(' → '))
          .join(' ; ');
        steps.push({
          kind: 'choice',
          prompt: `Subp.${nd.id}: x<sub>ij</sub> = 1 arc'larını izleyerek (şehir → gittiği şehir → …) atamanın yapısını bul. Çözüm bir <b>tour</b> mu, yoksa <b>subtour</b>'lara mı ayrılıyor?`,
          options: structureOptions(rng, nd.p),
          hint: 'Bir şehirden başla, o satırdaki yeşil hücrenin sütununa git, sonra o şehrin satırına geç… başladığın şehre dönene kadar devam et. Tüm şehirleri gezmeden dönersen bu bir subtour\'dur.',
          explain:
            cs.length === 1
              ? `İzleme: ${trace}. Tüm ${n} şehir tek döngüde → <b>tour</b>.`
              : `İzleme: ${trace}. Döngüler tüm şehirleri kapsamıyor → <b>${cs.length} subtour</b> (${cs.map((c) => c.length + ' şehir').join(' + ')}). Bu, atama problemi çözümünün TSP için <b>uygun olmadığı</b> anlamına gelir.`,
          viz: [treeFor(tr, k, 1), costViz(tr, nd)],
        });
      }

      // ---- 3. decision
      const ubTxt = nd.ubBefore === Infinity ? 'henüz tour bulunmadı (UB = ∞)' : `en iyi tour: <b>UB = ${nd.ubBefore}</b>`;
      let why;
      if (nd.kind === 'infeasible') why = 'Atama problemi infeasible → bu düğümde ve altında hiçbir tour yok → <b>fathomed (infeasible)</b>.';
      else if (nd.kind === 'branch')
        why = `Çözüm tour değil (subtour'lar var) ve z = ${nd.z} ${nd.ubBefore === Infinity ? '(UB henüz yok)' : `< UB = ${nd.ubBefore}`} → bu düğüm hâlâ UB'den daha iyi bir tour verebilir, fathom edemeyiz → <b>dallan</b> (subtour'ları kır).`;
      else if (nd.kind === 'candidate')
        why = `Çözüm bir <b>tour</b> (TSP için uygun) ve z = ${nd.z} ${nd.ubBefore === Infinity ? '' : `< UB = ${nd.ubBefore}`}. Düğümün relaxation optimumu zaten bir tour olduğundan bu düğümden daha iyi tour çıkamaz → fathom; <b>yeni UB = ${nd.z}</b> (tour ${cyc(nd.cycles[0])}). Notlar: "z &lt; ${nd.z} veremeyen düğüm elenebilir".`;
      else
        why = nd.cycles.length === 1
          ? `Çözüm bir tour (${cyc(nd.cycles[0])}) ama z = ${nd.z} ${nd.z === nd.ubBefore ? '=' : '>'} UB = ${nd.ubBefore}: mevcut en iyi tour'dan <b>daha iyi değil</b> (z &lt; UB gerekir) → <b>fathomed</b> (notlardaki Subp.5 gibi).`
          : `z = ${nd.z} ${nd.z === nd.ubBefore ? '=' : '>'} UB = ${nd.ubBefore} (yani z ≥ UB). Dallansak bile alt problemler daha kısıtlı olduğundan z azalmaz (≥ ${nd.z}) → UB'den iyi tour çıkmaz → <b>fathomed</b> (notlardaki Subp.6/7 gibi).`;
      const solTxt = nd.kind === 'infeasible' ? 'atama problemi <b>infeasible</b>' : `z = <b>${nd.z}</b>, ${nd.cycles.length === 1 ? 'çözüm bir tour' : 'çözümde subtour var'}`;
      steps.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `Subp.${nd.id}: ${solTxt}; ${ubTxt}.<br>Bu düğüm için doğru karar hangisi?`,
        options: [
          { html: '<b>Dallan</b> (branch): subtour var ve z &lt; UB', correct: nd.kind === 'branch' },
          { html: '<b>Candidate tour</b>: tour ve z &lt; UB → UB güncellenir', correct: nd.kind === 'candidate' },
          { html: '<b>Fathom</b>: z ≥ UB (UB\'den iyi tour veremez)', correct: nd.kind === 'bound' },
          { html: '<b>Fathom</b>: infeasible', correct: nd.kind === 'infeasible' },
        ],
        hint: 'Sırayla sor: infeasible mı? z ≥ UB mi? (evetse fathom) Değilse: tour mu (candidate), subtour mu (dallan)?',
        explain: why,
        viz: [treeFor(tr, k, 2), costViz(tr, nd)],
      });

      // ---- 4. which arcs to forbid
      if (nd.kind === 'branch') {
        const kids = nd.kids;
        const lab = (ids, arcs) => ids.map((id, t) => `Subp.${id}: ${X(arcs[t][0], arcs[t][1])} = 0`).join(', ');
        const others = nd.cycles.filter((c) => c !== nd.sub);
        const larger = others.slice().sort((a, b) => b.length - a.length)[0];
        const largerArcs = larger.map((c, t) => [c, larger[(t + 1) % larger.length]]);
        const opts = [{ html: lab(kids, nd.arcs), correct: true }];
        const add = (html) => {
          if (!opts.some((o) => o.html === html)) opts.push({ html, correct: false });
        };
        add(lab(kids.map((_, t) => kids[0] + t).slice(0, largerArcs.length), largerArcs));
        add(`Tek alt problem (Subp.${kids[0]}): ${nd.arcs.map((a) => `${X(a[0], a[1])} = 0`).join(' ve ')} (hepsi birden yasak)`);
        add(`Subp.${kids[0]}: ${X(nd.arcs[0][0], nd.arcs[0][1])} = 0, Subp.${kids[0] + 1}: ${X(largerArcs[0][0], largerArcs[0][1])} = 0`);
        steps.push({
          kind: 'choice',
          keepOrder: false,
          prompt: `Subp.${nd.id} çözümünde ${nd.cycles.length} subtour var: ${nd.cycles.map(cyc).join(' ve ')}. Dallanma kuralına göre hangi alt problemler oluşturulur?`,
          options: opts,
          hint: 'Kural: en az şehirli subtour\'u seç; onun her arc\'ı için bir alt problem (o arc yasak). Numaralandırma subtour\'un en küçük şehrinden başlar.',
          explain: `En az şehirli subtour: <b>${cyc(nd.sub)}</b> (${nd.sub.length} şehir; diğerleri ${others.map((c) => c.length).join(', ')} şehir). Optimal TSP çözümü bu subtour'u içeremez → arc'lardan <b>en az biri 0</b> olmalı: ${nd.arcs.map((a) => `${X(a[0], a[1])} = 0`).join(' <b>veya</b> ')}. Her arc için ayrı alt problem (c<sub>ij</sub> = M): ${lab(kids, nd.arcs)}. Hepsini birden yasaklamak (tek çocuk) bu arc'lardan yalnız birini içeren tour'ları da keserdi; diğer subtour'un arc'ları ise bu subtour'u kırmaz. <b>LIFO</b>: şimdi ilk çocuk Subp.${kids[0]} çözülür.`,
          viz: [treeFor(tr, k, 2), costViz(tr, nd)],
        });
      }

      // ---- 5. next node when backtracking
      if (nd.kind !== 'branch' && nd.stackAfter.length >= 2) {
        const open = nd.stackAfter;
        steps.push({
          kind: 'choice',
          prompt: `Subp.${nd.id} ${nd.kind === 'candidate' ? 'candidate oldu' : 'fathom edildi'} (backtracking). Açık (çözülmemiş) alt problemler: ${open.slice().sort((a, b) => a - b).map((i) => `Subp.${i}`).join(', ')}. <b>LIFO</b> kuralına göre sıradaki alt problem hangisi?`,
          options: open.map((id) => ({ html: `Subp.${id}`, correct: id === open[0] })),
          hint: 'LIFO: en son oluşturulan açık düğüm (kardeşler arasında önce ilk çocuk).',
          explain: `LIFO (stack): en son oluşturulan açık düğüm önce çözülür. Açık düğümlerin oluşturulma sırası: ${open.slice().reverse().map((i) => `Subp.${i}`).join(' → ')}; dolayısıyla <b>Subp.${open[0]}</b> sıradaki (aynı ebeveynin çocukları arasında ilk çocuk önce).`,
          viz: [treeFor(tr, k, 2), costViz(tr, nd)],
        });
      }
    });

    // ---- final answers
    const b = tr.best;
    const tour = b.cycles[0].map((v) => v + 1).concat(b.cycles[0][0] + 1);
    const lastIdx = tr.order.length - 1;
    steps.push({
      kind: 'sequence',
      prompt: `Açık alt problem kalmadı → arama bitti; UB'yi veren tour (Subp.${b.id}) <b>optimal</b>'dir. Bu tour'u, x<sub>ij</sub> = 1 arc'larının yönünü izleyerek <b>1. şehirden başlayıp 1'de bitecek</b> şekilde yaz.`,
      sequence: { answer: tour, allowReverse: true, placeholder: 'ör. 1-5-2-4-3-1' },
      explain: `Subp.${b.id}: ${b.p.map((j, i) => `${X(i, j)}`).join(' = ')} = 1 → <b>${tour.join('–')}</b>. (Mesafeler simetrik olduğundan ters yön de aynı turdur ve kabul edilir.)`,
      viz: [treeFor(tr, lastIdx, 2), costViz(tr, b)],
    });
    steps.push({
      kind: 'number',
      prompt: 'Optimal tour\'un toplam uzunluğu (z*) nedir?',
      fields: [{ label: 'z*', answer: tr.UB }],
      explain: `z* = ${tour.slice(0, -1).map((c, t) => Cc(c - 1, tour[t + 1] - 1)).join(' + ')} = ${tour.slice(0, -1).map((c, t) => tr.D[c - 1][tour[t + 1] - 1]).join(' + ')} = <b>${tr.UB}</b>.`,
    });
    return steps;
  }

  OR.registerDrill({
    id: 'tsp-bnb',
    topic: '2.6.2',
    title: 'TSP · B&B (assignment relaxation + subtour)',
    description:
      '5 şehirli TSP\'yi (Joe State örneği gibi) assignment relaxation ile Branch &amp; Bound\'la çöz: her düğümde z\'yi hesapla, subtour\'ları bul, dallanma / candidate tour / fathom (z ≥ UB) kararlarını ver, LIFO sırasını takip et.',
    options: [{ key: 'joe', label: 'Ders notundaki örnek (Joe State)', type: 'checkbox', default: false }],
    run,
    solveAssign,
    bruteTours,
    JOE,
    generate(rng, opts) {
      opts = opts || {};
      for (let tries = 0; tries < 3000; tries++) {
        const D = opts.joe ? JOE : randomD(rng, 5);
        if (!D) continue;
        const tr = run(D);
        if (!opts.joe) {
          if (tr.ambiguous || !tr.best) continue;
          const ns = tr.order.length;
          if (ns < 4 || ns > 9) continue;
          if (!tr.order.some((x) => x.kind === 'bound')) continue;
          if (tr.order[0].kind === 'candidate') continue;
        }
        // brute-force cross-check + unique optimal tour
        const all = bruteTours(D);
        const opt = Math.min(...all.map((t) => t.z));
        if (opt !== tr.UB) {
          if (opts.joe) throw new Error('B&B sonucu brute force ile uyuşmuyor');
          continue;
        }
        if (!opts.joe) {
          const optTours = all.filter((t) => t.z === opt);
          if (optTours.length > 2) continue; // a tour and its reverse only
        }
        const steps = buildSteps(tr, rng);
        const nTours = all.length / 2;
        const b = tr.best;
        const tourStr = b.cycles[0].map((v) => v + 1).concat(b.cycles[0][0] + 1).join('–');
        return {
          title: 'TSP · Branch & Bound (assignment relaxation)',
          statement: `<p>Bir satıcı 5 şehri ziyaret edip başladığı şehre dönecek (<b>TSP</b>). Mesafeler simetriktir (sağdaki tablo), c<sub>ii</sub> = M. Tour'u <b>Branch &amp; Bound</b> ile bul: her alt problemde <b>assignment problem</b> çözülür, subtour'lar dallanma ile elenir.</p>
            <p><b>Kurallar:</b></p>${conventions(!!opts.joe)}
            <p class="muted">Alt problemlerin optimal atamaları verilir; sen z'yi, yapıyı, kararları ve dallanmayı bulursun.</p>`,
          viz: distViz(D),
          steps,
          solution: `<b>Optimal tour:</b> ${tourStr}, uzunluk <b>${tr.UB}</b> · ${tr.order.length} alt problem çözüldü (${nTours} farklı tour'un tamamını denemek yerine). Brute force ile de doğrulandı.`,
        };
      }
      throw new Error('uygun TSP örneği bulunamadı');
    },
  });
})();
