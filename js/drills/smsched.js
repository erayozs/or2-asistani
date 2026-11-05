/* 2.6.1 · Single machine scheduling solved by Branch & Bound (notes 2.6 / 2.6.1, Example 9 = Winston 9.6).
   n jobs (3-5), processing time p_j, due date d_j; no preemption. Objective: minimise TOTAL DELAY
   (total tardiness) = sum_j max(0, C_j - d_j)   -> MIN problem, so incumbent = UB, fathom if LB >= UB.
   Node = partial sequence.
     dir = 'front' : the first k positions are fixed (jobs placed from the start).
     dir = 'back'  : the last  k positions are fixed (jobs placed from the end).
   Lower bound of a node = delay of the fixed jobs (exact) + for every unscheduled job the delay it suffers even in
   its best case (front: it starts right after the fixed block; back: it finishes no earlier than p_j).
   When n-1 jobs are fixed the last job is forced -> the node is a complete schedule and LB = true cost.
   Search: depth first (LIFO), children numbered at creation in increasing job index, lowest number first.
   Rejected instances: several optimal sequences, LB = UB ties when fathoming, too small / too big trees. */
(function () {
  const OR = window.OR;
  const range = OR.util.range;
  const esc = (s) => OR.util.esc(s);

  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const J = (j) => `J<sub>${j + 1}</sub>`; // html job name
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

  // ---- exact evaluation of a partial sequence -------------------------------------------------------------
  // seq = fixed jobs in schedule order (front: positions 1..k ; back: positions n-k+1..n)
  function evalNode(inst, dir, seq) {
    const { p, d, n } = inst;
    const T = sum(p);
    const used = new Set(seq);
    const rem = range(n).filter((j) => !used.has(j));
    const fixed = [];
    let t;
    if (dir === 'front') {
      t = 0;
      seq.forEach((j) => {
        t += p[j];
        fixed.push({ j, C: t, late: Math.max(0, t - d[j]) });
      });
    } else {
      t = T;
      for (let i = seq.length - 1; i >= 0; i--) {
        const j = seq[i];
        fixed.unshift({ j, C: t, late: Math.max(0, t - d[j]) });
        t -= p[j];
      }
    }
    // t = start time of the free block (front) / latest finish of the free block (back)
    const free = rem.map((j) => {
      const Cmin = dir === 'front' ? t + p[j] : p[j];
      return { j, Cmin, late: Math.max(0, Cmin - d[j]) };
    });
    const fixedCost = sum(fixed.map((f) => f.late));
    const freeCost = sum(free.map((f) => f.late));
    const complete = rem.length <= 1;
    const full = complete ? (dir === 'front' ? seq.concat(rem) : rem.concat(seq)) : null;
    return { seq, rem, fixed, free, t, fixedCost, freeCost, lb: fixedCost + freeCost, complete, full };
  }

  function cost(inst, order) {
    let t = 0;
    let c = 0;
    order.forEach((j) => {
      t += inst.p[j];
      c += Math.max(0, t - inst.d[j]);
    });
    return c;
  }

  function perms(arr) {
    if (arr.length <= 1) return [arr];
    const out = [];
    arr.forEach((x, i) => perms(arr.filter((_, k) => k !== i)).forEach((r) => out.push([x].concat(r))));
    return out;
  }

  // ---- the B&B run (depth first) ----------------------------------------------------------------------------
  function runBB(inst, dir) {
    const nodes = [];
    const mk = (parent, edge, seq) => {
      const nd = { id: nodes.length + 1, parent, edge, ev: evalNode(inst, dir, seq), kids: [], kind: null };
      nodes.push(nd);
      return nd;
    };
    const root = mk(null, null, []);
    const stack = [root];
    const order = [];
    let ub = Infinity;
    let best = null;
    let bestNode = null;
    let ties = 0;
    while (stack.length) {
      const nd = stack.pop();
      nd.k = order.length;
      nd.ubBefore = ub;
      order.push(nd);
      if (nd.ev.lb >= ub) {
        nd.kind = 'bound';
        if (nd.ev.lb === ub) ties++;
      } else if (nd.ev.complete) {
        nd.kind = 'candidate';
        ub = nd.ev.lb;
        best = nd.ev.full;
        bestNode = nd;
      } else {
        nd.kind = 'branch';
        nd.ev.rem.forEach((j) => {
          nd.kids.push(mk(nd, j, dir === 'front' ? nd.ev.seq.concat(j) : [j].concat(nd.ev.seq)));
        });
        for (let i = nd.kids.length - 1; i >= 0; i--) stack.push(nd.kids[i]);
      }
      nd.ubAfter = ub;
    }
    return { nodes, order, ub, best, bestNode, ties };
  }

  // ---- instance generator -----------------------------------------------------------------------------------
  const WINDOW = { 3: [7, 10], 4: [11, 21], 5: [20, 46] };

  function genInst(rng, n, dir) {
    for (let tries = 0; tries < 12000; tries++) {
      const slack = tries >= 5000 ? 14 : 0; // last resort: allow a somewhat bigger tree
      const p = range(n).map(() => rng.int(2, 9));
      const T = sum(p);
      const d = range(n).map(() => rng.int(Math.max(2, Math.round(T * 0.18)), Math.max(4, Math.round(T * 0.85))));
      if (new Set(d).size < n) continue;
      const inst = { n, p, d };
      // exhaustive: unique optimal sequence
      let bestC = Infinity;
      let cnt = 0;
      let bestSeq = null;
      perms(range(n)).forEach((o) => {
        const c = cost(inst, o);
        if (c < bestC) { bestC = c; cnt = 1; bestSeq = o; } else if (c === bestC) cnt++;
      });
      if (cnt !== 1 || bestC < 1) continue;
      const tr = runBB(inst, dir);
      if (!tr.best || tr.ub !== bestC || tr.best.join() !== bestSeq.join()) continue;
      if (tries < 2500 && tr.ties > 0) continue; // LB = UB ties are ambiguous for a beginner
      const [lo, hi] = WINDOW[n];
      if (tr.nodes.length < lo || tr.nodes.length > hi + slack) continue;
      const pruned = tr.order.filter((x) => x.kind === 'bound' && !x.ev.complete).length;
      const nCand = tr.order.filter((x) => x.kind === 'candidate').length;
      if (pruned < 1 || nCand < (n === 3 ? 1 : 2)) continue;
      if (tr.order.length > (n === 3 ? 10 : n === 4 ? 18 : 40) + slack) continue;
      return { inst, tr, bestC, bestSeq };
    }
    return null;
  }

  // ---- text helpers -----------------------------------------------------------------------------------------
  const seqStr = (inst, dir, nd) => {
    const e = nd.ev;
    if (e.complete) return e.full.map((j) => j + 1).join('-');
    const stars = range(inst.n - e.seq.length).map(() => '*');
    const fx = e.seq.map((j) => j + 1);
    return (dir === 'front' ? fx.concat(stars) : stars.concat(fx)).join('-');
  };

  // detailed LB computation as html (needs inst for d,p)
  function lbExplain(inst, dir, nd) {
    const e = nd.ev;
    const parts = [];
    if (e.fixed.length) {
      const items = e.fixed.map((f) => `${J(f.j)}: C = ${f.C}, d = ${inst.d[f.j]} → ${f.late}`);
      parts.push(`sabit işler (gecikme kesin): ${items.join('; ')} ⇒ toplam <b>${e.fixedCost}</b>`);
    } else {
      parts.push('sabit iş yok ⇒ sabit kısım <b>0</b>');
    }
    if (e.free.length) {
      const items = e.free.map((f) =>
        dir === 'front'
          ? `${J(f.j)}: en erken C = ${e.t} + ${inst.p[f.j]} = ${f.Cmin}, d = ${inst.d[f.j]} → ${f.late}`
          : `${J(f.j)}: en erken C = p = ${f.Cmin}, d = ${inst.d[f.j]} → ${f.late}`
      );
      parts.push(`serbest işler (en iyi durumda bile oluşan gecikme): ${items.join('; ')} ⇒ toplam <b>${e.freeCost}</b>`);
    }
    return `${parts.join('<br>')}<br><b>LB = ${e.fixedCost} + ${e.freeCost} = ${e.lb}</b>${e.complete ? ' (çizelge tam → bu gerçek toplam gecikme)' : ''}`;
  }

  // ---- own tree renderer (min wording: LB >= UB), reuses svg.bbtree css ------------------------------------
  const ST = {
    open: { cls: 'st-pending', label: 'açık' },
    solved: { cls: 'st-solved', label: '' },
    branch: { cls: 'st-branched', label: 'dallanıldı' },
    candidate: { cls: 'st-candidate', label: 'Candidate (UB)' },
    superseded: { cls: 'st-superseded', label: 'Candidate (geçildi) ✕' },
    bound: { cls: 'st-bound', label: 'Fathomed: LB ≥ UB ✕' },
    best: { cls: 'st-candidate best', label: 'OPTIMAL ★' },
  };

  function treeViz(items, caption, ubText) {
    if (!items.length) return null;
    const byId = {};
    items.forEach((n) => (byId[n.id] = Object.assign({ kids: [] }, n)));
    let root = null;
    items.forEach((n) => {
      if (n.parent != null && byId[n.parent]) byId[n.parent].kids.push(byId[n.id]);
      else if (!root) root = byId[n.id];
    });
    Object.values(byId).forEach((n) => n.kids.sort((a, b) => a.id - b.id));
    const W = 124;
    const GAP = 12;
    const LH = 14;
    const maxLines = Math.max(1, ...items.map((n) => n.lines.length));
    const H = 20 + LH * maxLines + 16;
    const VGAP = 44;
    let slot = 0;
    let maxDepth = 0;
    const place = (n, dep) => {
      maxDepth = Math.max(maxDepth, dep);
      if (!n.kids.length) n.x = slot++ * (W + GAP);
      else {
        n.kids.forEach((k) => place(k, dep + 1));
        n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
      }
      n.y = dep * (H + VGAP);
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

  // Tree snapshot. st = { dec, kids, lbk, rootLB, hl, final }
  //   dec  : processed nodes order[0..dec-1] show their final status
  //   kids : children of processed nodes order[0..kids-1] exist (are drawn)
  //   lbk  : children of order[0..lbk-1] show their LB
  function treeAt(inst, dir, tr, st) {
    const items = [];
    tr.nodes.forEach((nd) => {
      if (nd.parent != null && nd.parent.k >= st.kids) return;
      const decided = nd.k != null && nd.k < st.dec;
      let status = 'open';
      if (decided) {
        status = nd.kind;
        if (nd.kind === 'candidate') {
          if (st.final && tr.bestNode === nd) status = 'best';
          else if (tr.order.some((o) => o.kind === 'candidate' && o.k > nd.k && o.k < st.dec)) status = 'superseded';
        }
      } else if (st.hl === nd.id) status = 'solved';
      const showLB = nd.parent == null ? st.rootLB : nd.parent.k < st.lbk;
      const lines = [seqStr(inst, dir, nd)];
      if (showLB) lines.push(`${nd.ev.complete ? 'maliyet' : 'LB'} = ${nd.ev.lb}`);
      items.push({
        id: nd.id,
        parent: nd.parent ? nd.parent.id : null,
        title: `Subp.${nd.id}`,
        edge: nd.edge != null ? `J${nd.edge + 1}` : '',
        lines,
        status,
        highlight: st.hl === nd.id,
      });
    });
    const ub = st.dec > 0 ? tr.order[st.dec - 1].ubAfter : Infinity;
    const ubText = ub === Infinity ? 'UB (en iyi çizelgenin gecikmesi) = —  (henüz çizelge yok)' : `UB (en iyi çizelgenin gecikmesi) = ${ub}`;
    return treeViz(items, `B&B ağacı (${dir === 'front' ? 'çizelge baştan kurulur' : 'çizelge sondan kurulur'}, LIFO)`, ubText);
  }

  function dataViz(inst) {
    const lab = range(inst.n).map((j) => `İş ${j + 1}`);
    return {
      type: 'matrix',
      caption: 'İşler',
      corner: '',
      colLabels: lab,
      rowLabels: ['İşlem süresi p<sub>j</sub>', 'Due date d<sub>j</sub>'],
      cells: [inst.p.map(String), inst.d.map(String)],
    };
  }

  function scheduleViz(inst, order) {
    let t = 0;
    const cells = [];
    let tot = 0;
    order.forEach((j, i) => {
      const s = t;
      t += inst.p[j];
      const late = Math.max(0, t - inst.d[j]);
      tot += late;
      cells.push([String(i + 1), `İş ${j + 1}`, `${s} – ${t}`, String(inst.d[j]), String(late)]);
    });
    return {
      type: 'matrix',
      caption: `Optimal çizelge · toplam gecikme = ${tot}`,
      corner: 'sıra',
      colLabels: ['iş', 'başla – bitir (C)', 'd', 'gecikme'],
      rowLabels: order.map((_, i) => String(i + 1)),
      cells: cells.map((r) => r.slice(1)),
      cls: cells.map((r) => ['', '', '', r[4] === '0' ? '' : 'm']),
    };
  }

  // ---- options / conventions --------------------------------------------------------------------------------
  const OPTIONS = [
    {
      key: 'n',
      label: 'İş sayısı',
      type: 'select',
      default: '4',
      choices: [
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
      ],
    },
    {
      key: 'dir',
      label: 'Çizelge nasıl kurulur',
      type: 'select',
      default: 'front',
      choices: [
        { value: 'front', label: 'Baştan (ilk pozisyonlar sabitlenir)' },
        { value: 'back', label: 'Sondan (son pozisyonlar sabitlenir)' },
      ],
    },
    { key: 'askLB', label: 'LB değerlerini ben hesaplayayım', type: 'checkbox', default: true },
  ];

  function conventions(dir) {
    const front = dir === 'front';
    return `<ul class="conv">
      <li>Amaç: <b>toplam gecikme</b> (total delay) = Σ<sub>j</sub> max(0, C<sub>j</sub> − d<sub>j</sub>) <b>minimize</b>. Min problem olduğu için candidate bir <b>UB</b> verir; fathom kuralı <b>LB ≥ UB</b>.</li>
      <li>Her düğüm kısmi bir sıradır (<b>*</b> = henüz yerleşmemiş pozisyon). Dallanma: ${front
        ? 'ilk boş pozisyona kalan işlerden biri konur (çizelge <b>baştan</b> kurulur)'
        : 'son boş pozisyona kalan işlerden biri konur (çizelge <b>sondan</b> kurulur)'}. Alt problemler oluşturulma sırasıyla numaralanır; işler artan iş numarasıyla (J<sub>1</sub>, J<sub>2</sub>, …) dallandırılır.</li>
      <li><b>LB</b> = sabit işlerin gecikmesi (kesin) + her serbest iş için en iyi durumdaki gecikme: ${front
        ? 'serbest iş j, sabit bloğun hemen ardından başlasa bile C<sub>j</sub> ≥ t + p<sub>j</sub> (t = sabit işlerin toplam süresi) → max(0, t + p<sub>j</sub> − d<sub>j</sub>)'
        : 'serbest iş j en erken p<sub>j</sub>\'de biter (C<sub>j</sub> ≥ p<sub>j</sub>) → max(0, p<sub>j</sub> − d<sub>j</sub>); sabit (sondaki) işlerin bitiş zamanı kesin: son iş ΣP\'de biter'}.</li>
      <li>n − 1 iş sabitlenince kalan iş zorunludur: düğüm <b>tam çizelgedir</b> ve LB = gerçek toplam gecikme.</li>
      <li><b>LIFO (backtracking)</b>: dallanınca en küçük numaralı çocuk çözülür; bir dal bitince geri dönülür. Tam çizelge UB'den iyiyse (maliyet &lt; UB) <b>candidate</b>, UB güncellenir.</li>
    </ul>`;
  }

  // ---- drill ------------------------------------------------------------------------------------------------
  OR.registerDrill({
    id: 'smsched-bnb',
    topic: '2.6.1',
    title: 'Single Machine Scheduling · B&B (toplam gecikme)',
    description:
      'Tek makinede n iş (işlem süresi + due date). Toplam gecikmeyi minimize eden sırayı Branch &amp; Bound ile bul: her düğümde LB hesapla, UB ile karşılaştırıp dallan / fathom / candidate kararını ver.',
    options: OPTIONS,
    genInst,
    runBB,
    generate(rng, rawOpts) {
      const opts = Object.assign({ n: '4', dir: 'front', askLB: true }, rawOpts || {});
      const n = [3, 4, 5].includes(Number(opts.n)) ? Number(opts.n) : 4;
      const dir = opts.dir === 'back' ? 'back' : 'front';
      const res = genInst(rng, n, dir);
      if (!res) throw new Error('uygun problem bulunamadı');
      const { inst, tr, bestC, bestSeq } = res;
      const T = sum(inst.p);
      const nd1 = tr.order[0];
      const steps = [];
      const view = (st) => treeAt(inst, dir, tr, st);

      steps.push({
        kind: 'number',
        prompt: `Önce toplam işlem süresini bul: ${dir === 'front' ? 'tüm işler bittiğinde makine ne zaman boşalır' : 'sondaki iş (ve dolayısıyla çizelge) hangi anda biter'}? ΣP<sub>j</sub> = ?`,
        fields: [{ label: 'ΣP<sub>j</sub>', answer: T }],
        explain: `ΣP = ${inst.p.join(' + ')} = <b>${T}</b>. Boşluk (idle) olmadığı için çizelgenin son işi her zaman t = ${T}'de biter${dir === 'back' ? ' — sondan kurarken bitiş zamanları buradan geriye doğru kesinleşir' : ''}.`,
        viz: dataViz(inst),
      });

      steps.push({
        kind: 'number',
        prompt: `<b>Subp.1 (kök)</b>: hiçbir iş yerleşmedi. Kök için <b>LB</b> kaçtır?`,
        fields: [{ label: 'LB (Subp.1)', answer: nd1.ev.lb }],
        explain: lbExplain(inst, dir, nd1) + `<br>Kök, tüm n! = ${fact(n)} sıranın alt sınırını verir; UB henüz yok (UB = ∞).`,
        hint: dir === 'front'
          ? 'Her iş için en iyi durum: o iş en başta çalışsın (C = p). Gecikme = max(0, p − d). Hepsini topla.'
          : 'Her iş için en iyi durum C = p. Gecikme = max(0, p − d). Hepsini topla.',
        vizDuring: view({ dec: 0, kids: 0, lbk: 0, rootLB: false, hl: 1 }),
        viz: view({ dec: 0, kids: 0, lbk: 0, rootLB: true, hl: 1 }),
      });

      const OPT = (key, html, correct) => ({ key, html, correct });
      tr.order.forEach((nd, k) => {
        const isRoot = k === 0;
        if (!isRoot) {
          const ubTxt = nd.ubBefore === Infinity ? '—' : String(nd.ubBefore);
          let why;
          if (nd.kind === 'bound') {
            why = nd.ev.complete
              ? `Çizelge tam (${seqStr(inst, dir, nd)}) ve gerçek gecikmesi ${nd.ev.lb} ≥ UB = ${nd.ubBefore}: mevcut en iyiden <b>iyi değil</b> (strict iyileşme gerekir) → <b>fathomed</b>.`
              : `LB = ${nd.ev.lb} ≥ UB = ${nd.ubBefore}. Bu düğümün altındaki her çizelge en az ${nd.ev.lb} gecikmeli → UB'yi iyileştiremez → <b>fathomed</b> (tüm alt ağaç elenir).`;
          } else if (nd.kind === 'candidate') {
            why = `Çizelge tam (${seqStr(inst, dir, nd)}), gerçek gecikme = ${nd.ev.lb} ${nd.ubBefore === Infinity ? '(henüz UB yok)' : `&lt; UB = ${nd.ubBefore}`} → <b>candidate</b>; yeni <b>UB = ${nd.ev.lb}</b>. Düğüm yapraktır, fathom edilir.`;
          } else {
            why = `LB = ${nd.ev.lb} ${nd.ubBefore === Infinity ? '(UB henüz yok → fathom edilemez)' : `&lt; UB = ${nd.ubBefore}`} ve çizelge henüz tam değil (${nd.ev.rem.length} serbest iş) → UB'den iyi bir çizelge çıkabilir → <b>dallan</b>.`;
          }
          steps.push({
            kind: 'choice',
            keepOrder: true,
            prompt: `<b>Subp.${nd.id}</b> (sıra: <b>${seqStr(inst, dir, nd)}</b>) · LB = <b>${nd.ev.lb}</b>, UB = <b>${ubTxt}</b>${nd.ev.complete ? ' · çizelge tam' : ''}. Bu düğümde ne yapılır?`,
            options: [
              OPT('branch', 'Dallan: LB &lt; UB ve çizelge tam değil', nd.kind === 'branch'),
              OPT('bound', 'Fathom: LB ≥ UB (UB\'yi iyileştiremez)', nd.kind === 'bound'),
              OPT('cand', 'Candidate: çizelge tam ve maliyeti &lt; UB → UB güncellenir', nd.kind === 'candidate'),
            ].map((o) => ({ html: o.html, correct: o.correct })),
            explain: why,
            hint: 'Sırayla sor: LB ≥ UB mi? (evetse fathom). Değilse: çizelge tam mı (candidate), değil mi (dallan)?',
            vizDuring: view({ dec: k, kids: k, lbk: k, rootLB: true, hl: nd.id }),
            viz: view({ dec: k + 1, kids: k, lbk: k, rootLB: true, hl: null }),
          });
        }
        if (nd.kind === 'branch') {
          const kidNames = nd.kids.map((c) => `Subp.${c.id}`).join(', ');
          const placed = (c) => `${J(c.edge)} ${dir === 'front' ? `${nd.ev.seq.length + 1}. pozisyona` : `${inst.n - nd.ev.seq.length}. pozisyona`}`;
          const prompt = `<b>Subp.${nd.id}</b> dallanır: ${nd.kids.map((c) => `Subp.${c.id} = ${placed(c)}`).join(' · ')}. Çocukların <b>LB</b> değerlerini hesapla (${kidNames}).`;
          const expl = nd.kids.map((c) => `<b>Subp.${c.id}</b> (${seqStr(inst, dir, c)}):<br>${lbExplain(inst, dir, c)}`).join('<hr>');
          if (opts.askLB) {
            steps.push({
              kind: 'number',
              prompt,
              fields: nd.kids.map((c) => ({ label: `LB (Subp.${c.id}, ${seqStr(inst, dir, c)})`, answer: c.ev.lb })),
              explain: expl,
              hint: 'LB = sabit işlerin gecikmesi + serbest işlerin en iyi durum gecikmeleri toplamı.',
              vizDuring: view({ dec: k + 1, kids: k + 1, lbk: k, rootLB: true, hl: null }),
              viz: view({ dec: k + 1, kids: k + 1, lbk: k + 1, rootLB: true, hl: null }),
            });
          } else {
            steps.push({
              kind: 'info',
              prompt: `<b>Subp.${nd.id}</b> dallanır. Çocukların LB değerleri:<br>${nd.kids.map((c) => `Subp.${c.id} (${seqStr(inst, dir, c)}): LB = <b>${c.ev.lb}</b>`).join('<br>')}`,
              explain: expl,
              viz: view({ dec: k + 1, kids: k + 1, lbk: k + 1, rootLB: true, hl: null }),
            });
          }
        }
      });

      const nBound = tr.order.filter((x) => x.kind === 'bound').length;
      const finalView = view({ dec: tr.order.length, kids: tr.order.length, lbk: tr.order.length, rootLB: true, hl: null, final: true });
      steps.push({
        kind: 'sequence',
        prompt: 'Ağaç tamamlandı (açık düğüm kalmadı). <b>Optimal sırayı</b> yaz (işleme sırasıyla iş numaraları, ör. 3-1-2).',
        sequence: { answer: bestSeq.map((j) => String(j + 1)), placeholder: 'ör. ' + range(n).map((j) => j + 1).join('-') },
        explain: `Optimal sıra: <b>${bestSeq.map((j) => j + 1).join('–')}</b> (Subp.${tr.bestNode.id}).`,
        viz: [finalView, scheduleViz(inst, bestSeq)],
      });
      steps.push({
        kind: 'number',
        prompt: 'Bu sıranın <b>toplam gecikmesi</b> (optimal değer) kaçtır?',
        fields: [{ label: 'toplam gecikme', answer: bestC }],
        explain: `Tamamlanma zamanları ve gecikmeler tabloda: toplam <b>${bestC}</b>. Son UB de bu değerdir.`,
        viz: [finalView, scheduleViz(inst, bestSeq)],
      });
      steps.push({
        kind: 'number',
        prompt: 'Karşılaştırma: B&B ağacında toplam kaç düğüm (kök dahil) oluşturuldu, bunların kaçı <b>LB ≥ UB</b> ile fathom edildi? Tam enumerasyonda kaç sıra (n!) değerlendirilirdi?',
        fields: [
          { label: 'Oluşturulan düğüm sayısı', answer: tr.nodes.length },
          { label: 'LB ≥ UB ile fathom edilen düğüm sayısı', answer: nBound },
          { label: `Tam enumerasyon: ${n}!`, answer: fact(n) },
        ],
        explain: `${tr.nodes.length} düğüm oluştu; ${nBound} düğüm LB ≥ UB ile elendi (bunların alt ağaçları hiç incelenmedi). Tam enumerasyon ${n}! = ${fact(n)} sırayı tek tek hesaplardı.`,
        viz: finalView,
      });

      return {
        title: 'Branch & Bound · Single Machine Scheduling',
        statement: `<p>Tek bir makinede işlenecek ${n} iş var. Her işin işlem süresi ve due date'i aşağıda verilmiştir; makine aynı anda bir işi işler, preemption yoktur ve makine hiç boş kalmaz (t = 0'da başlanır). İş j'nin tamamlanma zamanı C<sub>j</sub>, gecikmesi (delay) max(0, C<sub>j</sub> − d<sub>j</sub>)'dir. <b>Toplam gecikmeyi</b> minimize eden sırayı Branch &amp; Bound ile bul.</p>
          ${OR.viz.render(dataViz(inst))}
          <p><b>Kurallar:</b></p>${conventions(dir)}
          <p class="muted">LB değerleri tamsayıdır.</p>`,
        viz: dataViz(inst),
        steps,
        solution: `<b>Optimal sıra:</b> ${bestSeq.map((j) => j + 1).join('–')} · toplam gecikme = <b>${bestC}</b> · ${tr.nodes.length} düğüm oluştu (tam enumerasyon: ${n}! = ${fact(n)}).`,
      };
    },
  });
})();
