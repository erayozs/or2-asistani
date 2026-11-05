/* 2.8 · Implicit enumeration for a 0-1 IP (notes p. 40).
   max z = c x   s.t.  A x <= b,  x_j in {0,1}      (c and A have mixed signs).
   Vocabulary of the notes: fixed variables / free variables / completion of a node.
   The three ideas of the notes, applied at every node (in this order):
     1. infeasibility test : give every free variable the BEST value for satisfying each constraint
                             (a_ij < 0 -> 1, otherwise 0). If some constraint is still violated, every completion is infeasible
                             -> fathom (infeasible).
     2. bound              : the best completion ignoring the constraints (c_j > 0 -> 1, otherwise 0) has value zbar. If zbar <= LB
                             the node cannot yield a better z -> fathom (bound).
     3. easy completion    : if that best completion is feasible it is the best feasible completion of the node -> candidate,
                             LB := zbar, node fathomed.   Otherwise branch.
   Branching: lowest-index free variable, x_k = 1 / x_k = 0 (which one first is an option); children numbered at creation,
   LIFO (depth first, lowest number first). LB starts at -infinity.
   Rejected instances: several optimal solutions, root trivially decided, nodes that are infeasible AND bounded at the same time
   (ambiguous label), too small / too big trees, no infeasible / bound fathom. */
(function () {
  const OR = window.OR;
  const range = OR.util.range;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const X = (j) => `x<sub>${j + 1}</sub>`;

  // ---- node evaluation --------------------------------------------------------------------------------------
  // vals = values of x_1..x_k (fixed prefix); LB = best known z or null (= -infinity)
  function evalNode(P, vals, LB) {
    const n = P.c.length;
    const k = vals.length;
    const free = range(n).filter((j) => j >= k);
    const zFix = sum(vals.map((v, j) => P.c[j] * v));
    const posFree = sum(free.map((j) => Math.max(0, P.c[j])));
    const zbar = zFix + posFree;
    const xhat = vals.concat(free.map((j) => (P.c[j] > 0 ? 1 : 0)));
    const cons = P.A.map((row, i) => {
      const fixedL = sum(vals.map((v, j) => row[j] * v));
      const freeMin = sum(free.map((j) => Math.min(0, row[j])));
      const hatL = sum(xhat.map((v, j) => row[j] * v));
      return { fixedL, freeMin, minL: fixedL + freeMin, hatL, b: P.b[i] };
    });
    const infeasible = cons.some((c) => c.minL > c.b);
    const bounded = LB !== null && zbar <= LB;
    const feasHat = cons.every((c) => c.hatL <= c.b);
    let kind;
    if (infeasible) kind = 'infeasible';
    else if (bounded) kind = 'bound';
    else if (feasHat) kind = 'candidate';
    else kind = 'branch';
    return { vals, k, free, zFix, posFree, zbar, xhat, cons, infeasible, bounded, feasHat, kind, both: infeasible && bounded };
  }

  // ---- the search --------------------------------------------------------------------------------------------
  function run(P, firstVal) {
    const n = P.c.length;
    const nodes = [];
    const mk = (parent, edge, vals) => {
      const nd = { id: nodes.length + 1, parent, edge, vals, kids: [] };
      nodes.push(nd);
      return nd;
    };
    const root = mk(null, null, []);
    const stack = [root];
    const order = [];
    let LB = null;
    let best = null;
    let bestNode = null;
    let nCand = 0;
    while (stack.length) {
      const nd = stack.pop();
      nd.k = order.length;
      order.push(nd);
      nd.lbBefore = LB;
      nd.ev = evalNode(P, nd.vals, LB);
      nd.kind = nd.ev.kind;
      if (nd.kind === 'candidate') {
        LB = nd.ev.zbar;
        best = nd.ev.xhat;
        bestNode = nd;
        nCand++;
      } else if (nd.kind === 'branch') {
        const kk = nd.vals.length;
        const vs = firstVal === 0 ? [0, 1] : [1, 0];
        vs.forEach((v) => {
          const c = mk(nd, { j: kk, v }, nd.vals.concat(v));
          nd.kids.push(c);
        });
        for (let i = nd.kids.length - 1; i >= 0; i--) stack.push(nd.kids[i]);
      }
      nd.lbAfter = LB;
    }
    return { nodes, order, LB, best, bestNode, nCand, n };
  }

  // ---- generator ---------------------------------------------------------------------------------------------
  function bruteForce(P) {
    const n = P.c.length;
    let best = -Infinity;
    let cnt = 0;
    let arg = null;
    for (let m = 0; m < 1 << n; m++) {
      const x = range(n).map((j) => (m >> j) & 1);
      if (!P.A.every((row, i) => sum(row.map((a, j) => a * x[j])) <= P.b[i])) continue;
      const z = sum(x.map((v, j) => P.c[j] * v));
      if (z > best) { best = z; cnt = 1; arg = x; } else if (z === best) cnt++;
    }
    return { z: best, count: cnt, x: arg };
  }

  const WINDOW = { 4: [9, 15], 5: [11, 19], 6: [13, 23] };

  function gen(rng, n, firstVal) {
    for (let tries = 0; tries < 12000; tries++) {
      const m = rng.chance(0.5) ? 2 : 3;
      const c = range(n).map(() => (rng.chance(0.3) ? rng.int(-5, -1) : rng.int(1, 9)));
      if (c.filter((v) => v < 0).length < 1 || c.filter((v) => v > 0).length < 2) continue;
      const A = range(m).map(() => range(n).map(() => (rng.chance(0.22) ? rng.int(-3, -1) : rng.int(1, 8))));
      const b = A.map((row) => {
        const pos = sum(row.filter((a) => a > 0));
        return Math.max(2, Math.round(pos * rng.pick([0.3, 0.4, 0.5, 0.6])));
      });
      const P = { c, A, b };
      const bf = bruteForce(P);
      if (bf.count !== 1) continue;
      const tr = run(P, firstVal);
      if (!tr.best || tr.LB !== bf.z || tr.best.join() !== bf.x.join()) continue;
      const r0 = tr.nodes[0].ev;
      if (r0.kind !== 'branch') continue;
      const [lo, hi] = WINDOW[n];
      const slack = tries >= 6000 ? 6 : 0;
      if (tr.nodes.length < lo || tr.nodes.length > hi + slack) continue;
      const kinds = tr.order.map((x) => x.kind);
      if (!kinds.includes('infeasible') || !kinds.includes('bound')) continue;
      if (tr.nCand < (n === 4 ? 1 : 2)) continue;
      if (tries < 4000 && tr.order.some((x) => x.ev.both)) continue;
      if (tr.order.some((x) => x.ev.both) && tries < 9000) continue;
      return { P, tr, bf };
    }
    return null;
  }

  // ---- text helpers ------------------------------------------------------------------------------------------
  const part = (nd, n) => '(' + range(n).map((j) => (j < nd.vals.length ? nd.vals[j] : '*')).join(',') + ')';
  const fixedTxt = (nd) => (nd.vals.length ? nd.vals.map((v, j) => `${X(j)} = ${v}`).join(', ') : 'yok');
  const freeTxt = (nd, n) => (nd.vals.length < n ? range(n - nd.vals.length).map((i) => X(nd.vals.length + i)).join(', ') : 'yok');
  const lbTxt = (lb) => (lb === null ? '−∞' : String(lb));
  const sgn = (v) => (v < 0 ? `(${v})` : String(v));

  function modelHtml(P) {
    const n = P.c.length;
    let h = `max z = ${OR.util.linExpr(P.c)}\n`;
    P.A.forEach((row, i) => {
      h += `${i === 0 ? 's.t.   ' : '       '}${OR.util.linExpr(row)} ≤ ${P.b[i]}\n`;
    });
    h += `       x<sub>j</sub> = 0 or 1,  j = 1, …, ${n}`;
    return `<div class="model">${h}</div>`;
  }

  // explanation of the three tests at a node
  function testsHtml(P, nd) {
    const e = nd.ev;
    const n = P.c.length;
    const fixedTerms = nd.vals.map((v, j) => `${sgn(P.c[j])}·${v}`);
    const posTerms = e.free.map((j) => `max(0, ${P.c[j]})`);
    const zLine =
      `<b>Bound:</b> z̄ = (sabit kısım) ${fixedTerms.length ? fixedTerms.join(' + ') + ' = ' : ''}<b>${e.zFix}</b>` +
      (e.free.length ? ` + (serbest değişkenlerin en iyi değerleri) ${posTerms.join(' + ')} = <b>${e.posFree}</b>` : '') +
      ` ⇒ <b>z̄ = ${e.zbar}</b>`;
    const consLines = e.cons
      .map((c, i) => {
        const fx = `sabit ${c.fixedL}`;
        const fr = e.free.length ? ` + serbest (a &lt; 0 olanlar 1, diğerleri 0) ${c.freeMin}` : '';
        return `Kısıt ${i + 1}: ${fx}${fr} = <b>${c.minL}</b> ${c.minL > c.b ? `&gt; ${c.b} → ihlal` : `≤ ${c.b} → ihlal yok`}`;
      })
      .join('<br>');
    const hatLines = `<b>En iyi completion</b> x̂ = (${e.xhat.join(', ')}) → ${e.cons
      .map((c, i) => `kısıt ${i + 1}: ${c.hatL} ${c.hatL <= c.b ? '≤' : '&gt;'} ${c.b}`)
      .join('; ')} ⇒ ${e.feasHat ? 'uygun' : 'uygun değil'}`;
    return `<b>Infeasibility testi</b> (her kısıt için en uygun completion):<br>${consLines}<br>${zLine}<br>${hatLines}`;
  }

  // ---- tree ----------------------------------------------------------------------------------------------------
  function treeAt(P, tr, st) {
    const n = P.c.length;
    const items = [];
    tr.nodes.forEach((nd) => {
      if (nd.parent && nd.parent.k >= st.dec) return;
      const decided = nd.k < st.dec;
      let status = 'pending';
      if (decided) {
        status = nd.kind === 'branch' ? 'branched' : nd.kind;
        if (nd.kind === 'candidate') {
          if (tr.order.some((o) => o.kind === 'candidate' && o.k > nd.k && o.k < st.dec)) status = 'superseded';
        }
      } else if (st.hl === nd.id) status = 'solved';
      const lines = [part(nd, n)];
      if (decided && nd.kind !== 'infeasible') lines.push(`z̄ = ${nd.ev.zbar}`);
      else if (decided) lines.push('—');
      items.push({
        id: nd.id,
        parent: nd.parent ? nd.parent.id : null,
        title: `Subp.${nd.id}`,
        edge: nd.edge ? `x${nd.edge.j + 1} = ${nd.edge.v}` : '',
        lines,
        status,
        highlight: st.hl === nd.id,
        best: !!st.final && tr.bestNode === nd,
      });
    });
    const lb = st.dec > 0 ? tr.order[st.dec - 1].lbAfter : null;
    return { type: 'tree', caption: 'Implicit enumeration ağacı (LIFO)', nodes: items, lb: lb === null ? null : lb, nodeWidth: 112 };
  }

  // ---- options / conventions -----------------------------------------------------------------------------------
  const OPTIONS = [
    {
      key: 'n',
      label: 'Değişken sayısı',
      type: 'select',
      default: '5',
      choices: [
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
      ],
    },
    {
      key: 'first',
      label: 'Dallanınca önce',
      type: 'select',
      default: '1',
      choices: [
        { value: '1', label: 'x = 1 dalı' },
        { value: '0', label: 'x = 0 dalı' },
      ],
    },
    { key: 'askTests', label: 'Her düğümde z̄ ve kısıt testlerini ben hesaplayayım', type: 'checkbox', default: false },
  ];

  function conventions(first) {
    return `<ul class="conv">
      <li>Notlardaki terimler: <b>fixed</b> (değeri belirlenmiş) ve <b>free</b> (belirsiz) değişkenler; free değişkenlere değer atamaya <b>completion</b> denir. Düğüm gösterimi: (1,0,*,*,*) → x<sub>1</sub>=1, x<sub>2</sub>=0 sabit, * = free.</li>
      <li>Her düğümde sırayla üç test (LB = bilinen en iyi uygun z, başlangıçta −∞):
        <ol>
          <li><b>Infeasible?</b> Her kısıt için free değişkenlere o kısıtı <i>en çok rahatlatan</i> değeri ver (a<sub>ij</sub> &lt; 0 ise 1, değilse 0). Yine de bir kısıt ihlal ediliyorsa hiçbir completion uygun değildir → <b>fathom (infeasible)</b>.</li>
          <li><b>Bound:</b> kısıtları yok sayıp amaç için en iyi completion'ı al (c<sub>j</sub> &gt; 0 ise 1, değilse 0); değeri <b>z̄</b>. z̄ ≤ LB ise bu düğüm LB'den iyi z veremez → <b>fathom (bound)</b>.</li>
          <li><b>Easy completion:</b> bu en iyi completion kısıtları da sağlıyorsa düğümün en iyi uygun çözümüdür → <b>candidate</b>, LB = z̄, düğüm fathom. Sağlamıyorsa → <b>dallan</b>.</li>
        </ol></li>
      <li>Dallanma: en küçük indisli free değişken x<sub>k</sub> için <b>x<sub>k</sub> = ${first === '0' ? '0 (önce) ve 1' : '1 (önce) ve 0'}</b>. Alt problemler oluşturulma sırasıyla numaralanır; <b>LIFO</b>: en küçük numaralı açık düğüm çözülür.</li>
    </ul>`;
  }

  // ---- drill -----------------------------------------------------------------------------------------------------
  OR.registerDrill({
    id: 'implicit-enum',
    topic: '2.8',
    title: 'Implicit Enumeration · 0-1 IP',
    description:
      'Rastgele 0-1 IP. Her düğümde fixed/free değişkenlere bakıp infeasibility, bound ve easy-completion testlerini uygula; fathom edilen düğümlerin sırasını, optimal çözümü ve düğüm sayısını bul.',
    options: OPTIONS,
    gen,
    run,
    generate(rng, rawOpts) {
      const opts = Object.assign({ n: '5', first: '1', askTests: false }, rawOpts || {});
      const n = [4, 5, 6].includes(Number(opts.n)) ? Number(opts.n) : 5;
      const first = opts.first === '0' ? '0' : '1';
      const res = gen(rng, n, first === '0' ? 0 : 1);
      if (!res) throw new Error('uygun problem bulunamadı');
      const { P, tr, bf } = res;
      const m = P.A.length;
      const steps = [];
      const view = (st) => treeAt(P, tr, st);
      const testFields = (nd) => [{ label: 'z̄ (en iyi completion\'ın değeri)', answer: nd.ev.zbar }].concat(
        nd.ev.cons.map((c, i) => ({ label: `Kısıt ${i + 1}: en uygun completion'da sol taraf`, answer: c.minL }))
      );

      tr.order.forEach((nd, k) => {
        const lbS = lbTxt(nd.lbBefore);
        const head = `<b>Subp.${nd.id}</b> · sabit: ${fixedTxt(nd)} · free: ${freeTxt(nd, n)} · LB = <b>${lbS}</b>`;
        if (k === 0 || opts.askTests) {
          steps.push({
            kind: 'number',
            prompt: `${head}${k === 0 ? ' <i>(kök: tüm değişkenler free)</i>' : ''}.<br>Testler için gerekli değerleri hesapla: <b>z̄</b> ve her kısıtın <b>en uygun completion</b>'daki sol taraf değeri (free değişkenlerde a<sub>ij</sub> &lt; 0 olanlar 1, diğerleri 0).`,
            fields: testFields(nd),
            explain: testsHtml(P, nd),
            hint: 'z̄ = sabit kısmın değeri + free değişkenlerden sadece c_j > 0 olanların toplamı. Kısıt için: sabit kısım + free değişkenlerden sadece a_ij < 0 olanlar.',
            vizDuring: view({ dec: k, hl: nd.id }),
            viz: view({ dec: k, hl: nd.id }),
          });
        }
        let why;
        if (nd.kind === 'infeasible') {
          const ci = nd.ev.cons.findIndex((c) => c.minL > c.b);
          why = `Kısıt ${ci + 1}, free değişkenlere en uygun değerler verilse bile ${nd.ev.cons[ci].minL} &gt; ${nd.ev.cons[ci].b} → bu düğümün <b>hiçbir completion'ı uygun değil</b> → <b>fathomed (infeasible)</b>.`;
        } else if (nd.kind === 'bound') {
          why = `Infeasibility testi geçildi ama z̄ = ${nd.ev.zbar} ≤ LB = ${nd.lbBefore}: kısıtları tamamen yok saysak bile LB'den iyi z elde edilemez → <b>fathomed (bound)</b>.`;
        } else if (nd.kind === 'candidate') {
          why = `z̄ = ${nd.ev.zbar} ${nd.lbBefore === null ? '(LB henüz yok)' : `&gt; LB = ${nd.lbBefore}`} ve en iyi completion x̂ = (${nd.ev.xhat.join(', ')}) tüm kısıtları sağlıyor → düğümün en iyi uygun çözümü bu; <b>candidate</b>, yeni <b>LB = ${nd.ev.zbar}</b>. Düğüm fathom edilir.`;
        } else {
          why = `Infeasible değil, z̄ = ${nd.ev.zbar} ${nd.lbBefore === null ? '(LB henüz yok)' : `&gt; LB = ${nd.lbBefore}`}, ama en iyi completion x̂ = (${nd.ev.xhat.join(', ')}) uygun değil → fathom edemeyiz; <b>${X(nd.vals.length)}</b> üzerinden <b>dallan</b>.`;
        }
        steps.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `${k === 0 || opts.askTests ? `<b>Subp.${nd.id}</b>: testlerin sonucuna göre bu düğümde ne yapılır?` : `${head}. Üç testi (infeasible → bound → easy completion) uygula: bu düğümde ne yapılır?`}`,
          options: [
            { html: 'Fathom: infeasible (en uygun completion bile bir kısıtı ihlal ediyor)', correct: nd.kind === 'infeasible' },
            { html: 'Fathom: bound (z̄ ≤ LB)', correct: nd.kind === 'bound' },
            { html: 'Candidate: en iyi completion uygun → LB güncellenir, düğüm fathom', correct: nd.kind === 'candidate' },
            { html: 'Dallan: ilk free değişken üzerinden', correct: nd.kind === 'branch' },
          ],
          explain: `${why}<br><br>${testsHtml(P, nd)}`,
          hint: 'Sırayla: (1) bir kısıt en uygun completion\'da bile ihlalli mi? (2) z̄ ≤ LB mi? (3) en iyi completion uygun mu? Hiçbiri değilse dallan.',
          vizDuring: view({ dec: k, hl: nd.id }),
          viz: view({ dec: k + 1, hl: null }),
        });
      });

      const finalView = view({ dec: tr.order.length, hl: null, final: true });
      const leaves = tr.order.filter((x) => x.kind !== 'branch');
      steps.push({
        kind: 'sequence',
        prompt: 'Ağaç tamamlandı. <b>Fathom edilen</b> düğümleri (infeasible, bound ve candidate) fathom edildikleri sırayla yaz (alt problem numaraları, ör. 3-4-6).',
        sequence: { answer: leaves.map((x) => String(x.id)), placeholder: 'ör. ' + leaves.slice(0, 3).map((x) => x.id).join('-') + '-…' },
        explain: `Fathom sırası: ${leaves.map((x) => `Subp.${x.id} (${{ infeasible: 'infeasible', bound: 'bound', candidate: 'candidate' }[x.kind]})`).join(' → ')}. Dallanan düğümler: ${tr.order.filter((x) => x.kind === 'branch').map((x) => 'Subp.' + x.id).join(', ')}.`,
        viz: finalView,
      });
      steps.push({
        kind: 'number',
        prompt: 'Optimal çözümü ve amaç değerini yaz.',
        fields: bf.x.map((v, j) => ({ label: X(j), answer: v })).concat([{ label: 'z*', answer: bf.z }]),
        explain: `Son candidate (Subp.${tr.bestNode.id}) optimaldir: x = (${bf.x.join(', ')}), z* = <b>${bf.z}</b>. Son LB bu değerdir; açık düğüm kalmadı.`,
        viz: finalView,
      });
      steps.push({
        kind: 'number',
        prompt: `Karşılaştırma: toplam kaç düğüm (kök dahil) oluşturuldu, LB kaç kez güncellendi (candidate sayısı)? Tam enumerasyonda kaç 0-1 vektörü (2<sup>${n}</sup>) olurdu?`,
        fields: [
          { label: 'Oluşturulan düğüm sayısı', answer: tr.nodes.length },
          { label: 'Candidate sayısı (LB güncellemesi)', answer: tr.nCand },
          { label: `Tam enumerasyon: 2<sup>${n}</sup>`, answer: 1 << n },
        ],
        explain: `${tr.nodes.length} düğüm oluştu; ${tr.nCand} kez LB güncellendi. Tam ikili ağaç ${(1 << (n + 1)) - 1} düğümlü olurdu (${1 << n} yaprak = tam enumerasyon); fathom edilen düğümlerin altındaki completion'lar hiç tek tek denenmedi — “implicit” enumeration budur.`,
        viz: finalView,
      });

      return {
        title: 'Implicit Enumeration · 0-1 IP',
        statement: `<p>Aşağıdaki 0-1 IP'yi <b>implicit enumeration</b> ile çöz (n = ${n} değişken, ${m} kısıt):</p>
          ${modelHtml(P)}
          <p><b>Kurallar:</b></p>${conventions(first)}
          <p class="muted">Tüm sayılar tamsayıdır.</p>`,
        viz: view({ dec: 0, hl: 1 }),
        steps,
        solution: `<b>Optimal:</b> x = (${bf.x.join(', ')}), z* = <b>${bf.z}</b> · ${tr.nodes.length} düğüm oluşturuldu (tam enumerasyon: ${1 << n} vektör).`,
      };
    },
  });
})();
