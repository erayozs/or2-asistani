/* 2.4 · Reading a finished B&B tree (concepts: fathoming rules, LB, LIFO vs jumptracking, number of LPs).
   No LP solving here: a complete B&B tree of a random pure 2-variable IP is shown (every node with its LP solution and t = order
   in which the LPs were solved) and the student answers questions that can be read off the tree.
   Uses the instance generator of the pure-IP drill (OR.drills['bnb-pure'], loaded before this file).
   Rejected instances: ambiguous LP optima, several IP optima, ties between active nodes' z (jumptracking), traces that are too small / big,
   and (when the rule is hidden) trees whose t-labelling would be identical under another search rule. */
(function () {
  const OR = window.OR;
  const bp = OR.drills['bnb-pure'];
  if (!bp) throw new Error('bnb-tree-read: bnb-pure.js must be loaded first');

  const title = (nd) => `Subp. ${nd.id}`;
  const sub = (id) => `<b>Subp. ${id}</b>`;
  const brLabel = (nd) => OR.bnb.branchLabel(nd.branch);
  const desc = (tr, nd) => (nd.parent ? `Subp. ${nd.parent} + {${brLabel(nd)}}` : 'LP relaxation');
  const zTxt = (nd) => (nd.lp.status === 'optimal' ? `z = ${nd.lp.z.show()}` : 'infeasible');

  // fingerprint of the labelled tree (structure + solve order)
  const sig = (tr) => tr.nodes.map((n) => `${n.id}:${n.parent}:${n.t}:${n.branch ? n.branch.op + n.branch.val.toString() : ''}`).join('|');

  function jumpTie(tr) {
    for (const e of tr.events) {
      if (e.type === 'select' && e.rule === 'jump' && e.pool.length > 1) {
        const zs = e.pool.map((id) => tr.nodes[id - 1].lp.z).sort((p, q) => q.cmp(p));
        if (zs[0].eq(zs[1])) return true;
      }
    }
    return false;
  }

  // other search rules that would give a different tree for the same IP
  function ruleIsHidden(P, order, firstChild, tr) {
    const alts = [
      { order: 'jump', firstChild: 'up' },
      { order: 'lifo', firstChild: 'up' },
      { order: 'lifo', firstChild: 'down' },
    ].filter((a) => !(a.order === order && (order === 'jump' || a.firstChild === firstChild)));
    const mine = sig(tr);
    return alts.every((a) => sig(OR.bnb.run(P, a)) !== mine);
  }

  // decision points for the "which node next?" questions
  function selectEvents(tr) {
    const ev = tr.events;
    const out = [];
    ev.forEach((e, k) => {
      if (e.type !== 'select' || e.pool.length < 2) return;
      if (tr.opts.order === 'lifo') {
        let prev = null;
        for (let j = k - 1; j >= 0; j--) {
          if (['branch', 'infeasible', 'candidate', 'bound'].includes(ev[j].type)) { prev = ev[j]; break; }
        }
        if (prev && prev.type === 'branch') return; // just branched: trivial
      }
      out.push(k);
    });
    return out;
  }

  const lbAtEvent = (tr, k) => {
    let lb = null;
    for (let i = 0; i <= k && i < tr.events.length; i++) if (tr.events[i].type === 'candidate') lb = tr.events[i].lbNew;
    return lb;
  };

  function genTree(rng, o) {
    let res = null;
    for (let attempt = 0; attempt < 4 && !res; attempt++) {
      let calls = 0;
      res = bp.gen2(rng, { order: o.order, firstChild: o.firstChild }, [0, 1], (tr, P) => {
        calls++;
        const strict = attempt === 0 && calls < 40;
        const n = tr.nSolved;
        if (n < (strict ? 7 : 6) || n > 11) return false;
        const kinds = new Set(tr.events.map((e) => e.type));
        if (!(kinds.has('bound') || kinds.has('prune'))) return false;
        if (strict && !kinds.has('infeasible')) return false;
        if (jumpTie(tr)) return false;
        if (strict && !selectEvents(tr).length) return false;
        if (o.askRule && !ruleIsHidden(P, o.order, o.firstChild, tr)) return false;
        return true;
      });
    }
    return res;
  }

  // ---- viz ---------------------------------------------------------------
  // final tree with neutral node colours (no fathom labels, no star) -> the student must read the reasons
  function plainTree(tr) {
    const nodes = OR.bnb.treeAt(tr, Infinity, { title }).map((n) => Object.assign({}, n, { status: 'solved', highlight: false, best: false }));
    return { type: 'tree', caption: 'Tamamlanmış B&B ağacı (t = LP\'nin çözülme sırası)', nodes };
  }
  function labelledTree(tr) {
    return {
      type: 'tree',
      caption: 'Aynı ağaç: fathom nedenleri işaretli',
      lb: tr.best.z.show(),
      nodes: OR.bnb.treeAt(tr, Infinity, { title, final: true }),
    };
  }
  function snapshot(tr, k) {
    const lb = lbAtEvent(tr, k);
    return { type: 'tree', caption: 'Ağacın o andaki hali', lb: lb === null ? null : lb.show(), nodes: OR.bnb.treeAt(tr, k, { title }) };
  }

  // ---- text ---------------------------------------------------------------
  function conventions(o) {
    const rule = o.askRule
      ? 'Arama kuralı <b>verilmedi</b> (LIFO mu, jumptracking mi — ilk soruda bulacaksın).'
      : o.order === 'lifo'
        ? `<b>LIFO (backtracking)</b>: en son oluşturulan çözülmemiş alt problem çözülür; dallanmadan sonra önce <b>${o.firstChild === 'down' ? '≤' : '≥'}</b> dalı.`
        : '<b>Jumptracking</b>: dallanınca iki alt problem de hemen çözülür; sonra aktif düğümlerden en iyi z\'li olanda dallanılır.';
    return `<ul class="conv">
      <li>Alt problemler oluşturulma sırasıyla numaralanır: önce <b>≥</b> dalı, sonra <b>≤</b> dalı. Düğümün solundaki <b>t = k</b>: o alt problemin <b>k.</b> çözülen LP olduğunu gösterir.</li>
      <li>${rule}</li>
      <li>Fathom: infeasible · tamsayı çözüm (candidate, z &gt; LB ise LB güncellenir) · z ≤ LB. Her düğüm için LP çözümü (z, x<sub>1</sub>, x<sub>2</sub>) ağaçta verilmiştir.</li>
    </ul>`;
  }

  // ---- questions ------------------------------------------------------------
  function ruleQuestion(tr, o) {
    const evi = tr.events.find((e) => e.type === 'branch' && Math.abs(tr.nodes[e.children[0] - 1].t - tr.nodes[e.children[1] - 1].t) > 1);
    let why;
    if (o.order === 'jump') {
      why = 'Her dallanmada iki yeni alt problem <b>hemen</b> çözülür → kardeş düğümlerin t numaraları hep ardışıktır; sonra dallanılan düğüm ağacın bir yanından diğerine <b>atlar</b> (jumptracking).';
    } else {
      const [a, b] = evi ? evi.children.map((c) => tr.nodes[c - 1]) : [null, null];
      why = `LIFO\'da bir çocuk çözülür ve onun altındaki her şey bitmeden kardeşine dönülmez.${evi ? ` Örneğin ${title(a)} (t = ${a.t}) ve ${title(b)} (t = ${b.t}) kardeş olduğu halde t numaraları ardışık değil: arada ilk çözülen dalın altı işlendi (backtracking).` : ''} İlk çözülen çocuk <b>${o.firstChild === 'down' ? '≤' : '≥'}</b> dalı.`;
    }
    return {
      kind: 'choice',
      keepOrder: true,
      prompt: 'Önce t numaralarına bakarak ağacın <b>hangi arama kuralıyla</b> üretildiğini bul.',
      options: [
        { html: 'LIFO (backtracking), dallanınca önce <b>≥</b> dalı', correct: o.order === 'lifo' && o.firstChild === 'up' },
        { html: 'LIFO (backtracking), dallanınca önce <b>≤</b> dalı', correct: o.order === 'lifo' && o.firstChild === 'down' },
        { html: 'Jumptracking (en iyi z\'li aktif düğümde dallan)', correct: o.order === 'jump' },
      ],
      explain: why,
      hint: 'Kardeş düğümlerin t değerlerini karşılaştır: hep ardışık mı?',
    };
  }

  function countQuestion(tr) {
    const nb = tr.events.filter((e) => e.type === 'branch').length;
    return {
      kind: 'number',
      prompt: 'Ağaca bak: B&B <b>toplam kaç LP</b> çözmüş (LR dahil) ve <b>kaç düğümde dallanmış</b>?',
      fields: [
        { label: 'Çözülen LP sayısı', answer: tr.nSolved },
        { label: 'Dallanılan düğüm sayısı', answer: nb },
      ],
      explain: `Ağaçtaki her düğüm bir LP'dir → ${tr.nSolved} LP (en büyük t = ${tr.nSolved}). Dallanılan düğümler (iki çocuğu olanlar): ${tr.events.filter((e) => e.type === 'branch').map((e) => title(tr.nodes[e.id - 1])).join(', ')} → ${nb}. Her dallanma 2 alt problem ürettiğinden LP sayısı = 1 + 2·${nb} = ${1 + 2 * nb}.`,
      hint: 'Dallanılan düğümlerin altında iki çocuk vardır; yapraklar dallanmamıştır.',
    };
  }

  function multiQuestion(tr, prompt, pred, reasonFn, extra) {
    const opts = tr.nodes.map((nd) => ({ html: `${title(nd)} (${zTxt(nd)})`, correct: pred(nd) }));
    const members = tr.nodes.filter(pred);
    return Object.assign(
      {
        kind: 'multi',
        keepOrder: true,
        prompt,
        options: opts,
        explain: members.map((nd) => `${sub(nd.id)}: ${reasonFn(nd)}`).join('<br>'),
      },
      extra || {}
    );
  }

  function candidateReason(tr, nd) {
    const e = tr.events.find((x) => x.type === 'candidate' && x.id === nd.id);
    const lbOld = e.lbOld === null ? 'henüz LB yok' : `eski LB = ${e.lbOld.show()}`;
    const later = tr.events.find((x) => x.type === 'candidate' && x.superseded.includes(nd.id));
    return `x tamsayı, z = ${nd.lp.z.show()} (${lbOld}) → candidate, LB = ${nd.lp.z.show()}.${later ? ` Sonra ${title(tr.nodes[later.id - 1])} (z = ${later.z.show()}) ile geçildi → artık optimal olamaz.` : ' Optimal çözüm bu düğümdür.'}`;
  }

  function boundReason(tr, nd) {
    const pr = tr.events.find((e) => e.type === 'prune' && e.id === nd.id);
    const intNote = nd.isInteger ? ' Çözümü tamsayı olsa da LB\'yi iyileştirmediği için candidate olmaz.' : '';
    if (pr) return `z = ${nd.lp.z.show()} ile aktif listede bekliyordu; LB = ${pr.lb.show()} olunca z ≤ LB → fathom edildi.${intNote}`;
    return `z = ${nd.lp.z.show()} ≤ LB = ${nd.lbAt.show()} → daha iyi çözüm veremez.${intNote}`;
  }

  function lbAtQuestion(tr, rng) {
    const bn = tr.nodes.filter((nd) => nd.status === 'bound');
    const direct = bn.filter((nd) => !tr.events.some((e) => e.type === 'prune' && e.id === nd.id));
    const nd = rng.pick(direct.length ? direct : bn);
    const pr = tr.events.find((e) => e.type === 'prune' && e.id === nd.id);
    const lb = nd.lbAt;
    return {
      kind: 'number',
      prompt: pr
        ? `${sub(nd.id)} (z = ${nd.lp.z.show()}) aktif düğümler arasında bekliyordu ve sonradan fathom edildi. Hangi <b>LB</b> değeri yüzünden fathom edildi?`
        : `${sub(nd.id)} (t = ${nd.t}) çözüldüğü ve fathom edildiği anda <b>LB</b> kaçtı? (Candidate'ların t numaralarına bak.)`,
      fields: [{ label: 'LB', answer: lb }],
      explain: pr
        ? `${title(nd)}: z = ${nd.lp.z.show()}; LB bir candidate ile ${lb.show()} olunca z ≤ LB oldu → fathom.`
        : `${title(nd)} çözüldüğünde en iyi candidate z = ${lb.show()} idi (z = ${nd.lp.z.show()} ≤ ${lb.show()}) → fathom (bound).`,
      hint: 'LB = o ana kadar bulunan en iyi tamsayı çözümün z değeri.',
    };
  }

  function lbHistoryQuestion(tr) {
    const lbs = tr.events.filter((e) => e.type === 'candidate').map((e) => e.lbNew);
    const nodesTxt = tr.events.filter((e) => e.type === 'candidate').map((e) => `${title(tr.nodes[e.id - 1])} (t = ${tr.nodes[e.id - 1].t}) → LB = ${e.lbNew.show()}`).join(', ');
    if (lbs.length === 1) {
      return {
        kind: 'number',
        prompt: 'Arama boyunca <b>tek bir candidate</b> bulunmuş. Bulunan LB (son LB) kaçtır?',
        fields: [{ label: 'LB', answer: lbs[0] }],
        explain: `Tek candidate: ${nodesTxt}.`,
      };
    }
    return {
      kind: 'sequence',
      prompt: 'Arama boyunca LB hangi değerleri aldı? Candidate düğümleri <b>çözülme sırasına (t)</b> göre oku ve LB değerlerini sırayla yaz (ör. <code>12-15</code>).',
      sequence: { answer: lbs.map((v) => v.toString()), placeholder: 'ör. 12-15' },
      explain: `Candidate'lar çözülme sırasıyla: ${nodesTxt}. LB hep yükselir; son LB optimal z'dir.`,
    };
  }

  function pathQuestion(tr, rng) {
    const maxD = Math.max(...tr.nodes.map((n) => n.depth));
    const nd = rng.pick(tr.nodes.filter((n) => n.depth === maxD));
    const path = [];
    for (let cur = nd; cur && cur.branch; cur = cur.parent ? tr.nodes[cur.parent - 1] : null) path.unshift(cur);
    const fmt = (arr) => '{' + arr.map((p) => OR.bnb.branchLabel(p.branch)).join(', ') + '}';
    const sibling = tr.nodes[tr.nodes[nd.parent - 1].children.find((c) => c !== nd.id) - 1];
    const last = path[path.length - 1];
    const flipOp = last.branch.op === '>=' ? '<=' : '>=';
    const cands = [
      { html: fmt(path), correct: true },
      { html: fmt(path.slice(0, -1).concat([{ branch: sibling.branch }])), correct: false }, // sibling's branch
      { html: fmt(path.slice(0, -1).concat([{ branch: Object.assign({}, last.branch, { op: flipOp }) }])), correct: false },
      { html: fmt(path.slice(1)), correct: false }, // first branch missing
      { html: fmt([last]), correct: false }, // only the last arc
    ];
    const seen = new Set();
    const opts = [];
    for (const c of cands) if (!seen.has(c.html)) { seen.add(c.html); opts.push(c); }
    return {
      kind: 'choice',
      prompt: `${sub(nd.id)} alt probleminin LP'si, LR'a hangi <b>ek kısıtlar</b> eklenerek elde edildi? (Kökten ${title(nd)}'e giden yoldaki tüm yaylar.)`,
      options: opts.slice(0, 5),
      explain: `Kökten ${title(nd)}'e yol: ${path.map((p) => `${title(tr.nodes[p.parent - 1])} → ${title(p)} (${brLabel(p)})`).join('; ')}. Alt problem, yoldaki <b>tüm</b> dal kısıtlarını birlikte taşır: ${fmt(path)}.`,
    };
  }

  function nextNodeSteps(tr, rng, finalViz) {
    const ks = selectEvents(tr);
    if (!ks.length) return [];
    const k = rng.pick(ks);
    const e = tr.events[k];
    const pool = e.pool.map((id) => tr.nodes[id - 1]);
    const snap = snapshot(tr, k - 1);
    const lb = lbAtEvent(tr, k - 1);
    const lbTxt = lb === null ? 'henüz LB yok' : `LB = <b>${lb.show()}</b>`;
    const out = [];
    if (tr.opts.order === 'lifo') {
      out.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `Ağaç t = ${tr.nodes[e.id - 1].t - 1} adımına kadar çözüldü (${lbTxt}); son düğüm fathom edildi. <b>LIFO</b> kuralına göre sıradaki çözülecek alt problem hangisi?`,
        options: pool.map((nd) => ({ html: `${title(nd)} = ${desc(tr, nd)}`, correct: nd.id === e.id })),
        explain: `LIFO: en son oluşturulan çözülmemiş düğüm → ${sub(e.id)} (t = ${tr.nodes[e.id - 1].t}). Diğer bekleyenler: ${pool.filter((p) => p.id !== e.id).map(title).join(', ')}.`,
        vizDuring: snap,
        viz: finalViz,
      });
      const feas = pool.filter((nd) => nd.lp.status === 'optimal');
      const zs = feas.map((nd) => nd.lp.z).sort((p, q) => q.cmp(p));
      if (feas.length >= 2 && !zs[0].eq(zs[1])) {
        const top = feas.slice().sort((p, q) => q.lp.z.cmp(p.lp.z))[0];
        out.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `Karşılaştırma: Bekleyen bu alt problemlerin LP değerleri ağaçta (daha sonraki t'lerde) görülüyor. <b>Jumptracking</b> hepsini çözüp <b>en iyi z</b>'ye sahip olanda dallanırdı. Bu bekleyenlerden (infeasible olmayanlar) hangisi en yüksek z'ye sahip?`,
          options: feas.map((nd) => ({ html: `${title(nd)} (${zTxt(nd)})`, correct: nd.id === top.id })),
          explain: `En yüksek z: ${sub(top.id)} (${zTxt(top)}). Jumptracking buna öncelik verirdi (aktifse); LIFO ise ${sub(e.id)}'yi seçti çünkü o en son oluşturulandı — iki kural farklı düğümleri seçebilir.`,
          vizDuring: snap,
          viz: finalViz,
        });
      }
    } else {
      out.push({
        kind: 'choice',
        keepOrder: true,
        prompt: `Şu an ${lbTxt}; aktif (dallanmayı bekleyen) düğümler ağaçta “dallanacak” etiketli. <b>Jumptracking</b>: hangi düğümde dallanılır?`,
        options: pool.map((nd) => ({ html: `${title(nd)}: z = ${nd.lp.z.show()}`, correct: nd.id === e.id })),
        explain: `Jumptracking: aktif düğümlerden <b>en iyi z</b> → ${sub(e.id)} (z = ${tr.nodes[e.id - 1].lp.z.show()}).`,
        vizDuring: snap,
        viz: finalViz,
      });
      const newest = pool.slice().sort((p, q) => q.id - p.id)[0];
      if (newest.id !== e.id) {
        out.push({
          kind: 'choice',
          keepOrder: true,
          prompt: 'Karşılaştırma: Aynı aktif düğümler arasından <b>LIFO mantığıyla</b> (en son oluşturulan = en büyük numaralı düğüm) seçim yapılsaydı hangisinde dallanılırdı?',
          options: pool.map((nd) => ({ html: `${title(nd)}: z = ${nd.lp.z.show()}`, correct: nd.id === newest.id })),
          explain: `En son oluşturulan: ${sub(newest.id)} — ama z değeri en iyi olan ${sub(e.id)} idi. Jumptracking numaraya değil z'ye bakar, bu yüzden ağacın bir yanından diğerine <b>atlar</b>.`,
          vizDuring: snap,
          viz: finalViz,
        });
      }
    }
    return out;
  }

  function finalQuestions(tr) {
    const best = tr.best;
    const root = tr.nodes[0].lp.z;
    return [
      {
        kind: 'number',
        prompt: 'Ağaç tamamlandı. IP\'nin <b>optimal çözümünü</b> ve onu veren düğümü oku.',
        fields: [
          { label: 'z*', answer: best.z },
          { label: 'x<sub>1</sub>', answer: best.x[0] },
          { label: 'x<sub>2</sub>', answer: best.x[1] },
          { label: 'Optimal çözümü veren düğüm (Subp. no)', answer: best.id },
        ],
        explain: `Son LB = optimal z = ${best.z.show()}; çözüm ${title(tr.nodes[best.id - 1])} düğümünde: x = (${best.x[0].toString()}, ${best.x[1].toString()}). Aktif düğüm kalmadığı için bu çözüm optimaldir.`,
        viz: labelledTree(tr),
      },
      {
        kind: 'number',
        prompt: `Kök düğümün LP değeri z = ${root.show()}, IP'nin <b>upper bound</b>'udur. Optimal z* bu üst sınırdan ne kadar küçük? (z<sub>LR</sub> − z*)`,
        fields: [{ label: 'z<sub>LR</sub> − z*', answer: root.sub(best.z) }],
        explain: `${root.show()} − ${best.z.show()} = ${root.sub(best.z).show()}. IP'nin optimal değeri hiçbir zaman LR değerini aşamaz (max problemi); aradaki fark "integrality gap"tir.`,
      },
    ];
  }

  const OPTIONS = [
    {
      key: 'order',
      label: 'Arama sırası',
      type: 'select',
      default: 'rand',
      choices: [
        { value: 'rand', label: 'Rastgele' },
        { value: 'lifo', label: 'LIFO (backtracking)' },
        { value: 'jump', label: 'Jumptracking (en iyi z)' },
      ],
    },
    {
      key: 'firstChild',
      label: 'LIFO\'da önce',
      type: 'select',
      default: 'up',
      choices: [
        { value: 'up', label: '≥ dalı' },
        { value: 'down', label: '≤ dalı' },
      ],
    },
    { key: 'askRule', label: 'Arama kuralını verme (ağaçtan çıkar)', type: 'checkbox', default: true },
  ];

  OR.registerDrill({
    id: 'bnb-tree-read',
    topic: '2.4',
    title: 'B&B ağacı okuma (fathom, LB, sıradaki düğüm)',
    description: 'Tamamlanmış bir B&B ağacı verilir (LP çözümleri hazır). Hangi düğümler neden fathom edildi, LB nasıl değişti, LIFO / jumptracking\'te sıradaki düğüm hangisi, kaç LP çözüldü, optimal çözüm nedir?',
    options: OPTIONS,
    generate(rng, rawOpts) {
      const opts = Object.assign({ order: 'rand', firstChild: 'up', askRule: true }, rawOpts || {});
      const order = opts.order === 'rand' ? rng.pick(['lifo', 'jump']) : opts.order;
      const o = { order, firstChild: opts.firstChild, askRule: !!opts.askRule };
      const res = genTree(rng, o);
      if (!res) throw new Error('uygun problem bulunamadı');
      const { P, trace: tr } = res;

      const finalViz = labelledTree(tr);
      const steps = [];
      if (o.askRule) steps.push(ruleQuestion(tr, o));
      steps.push(countQuestion(tr));

      const infeas = (nd) => nd.status === 'infeasible';
      const bound = (nd) => nd.status === 'bound';
      const cand = (nd) => nd.status === 'candidate' || nd.status === 'superseded';
      const cls = [];
      if (tr.nodes.some(infeas)) {
        cls.push(multiQuestion(tr, 'Hangi düğümler <b>infeasible</b> oldukları için fathom edildi?', infeas, () => 'LP infeasible → fathom (infeasible).'));
      }
      cls.push(
        multiQuestion(
          tr,
          'Hangi düğümler <b>candidate</b> oldu (tamsayı çözüm verip LB\'yi güncelledi — sonradan geçilenler dahil)?',
          cand,
          (nd) => candidateReason(tr, nd),
          { hint: 'Candidate: x<sub>1</sub>, x<sub>2</sub> tamsayı ve z o andaki LB\'den büyük.' }
        )
      );
      cls.push(
        multiQuestion(
          tr,
          'Hangi düğümler <b>z ≤ LB</b> olduğu için (bound) fathom edildi?',
          bound,
          (nd) => boundReason(tr, nd),
          { hint: 'O düğüm çözüldüğünde/fathom edildiğinde LB ne kadardı? (t numaralarını kullan.)' }
        )
      );
      cls[cls.length - 1].viz = finalViz; // reveal the labelled tree once all three classifications are done
      cls.forEach((s) => steps.push(s));

      steps.push(lbAtQuestion(tr, rng));
      steps.push(lbHistoryQuestion(tr));
      steps.push(pathQuestion(tr, rng));
      nextNodeSteps(tr, rng, finalViz).forEach((s) => steps.push(s));
      finalQuestions(tr).forEach((s) => steps.push(s));

      return {
        title: 'Branch & Bound ağacı okuma',
        statement: `<p>Aşağıdaki IP, Branch &amp; Bound ile çözülmüş ve ağaç tamamlanmıştır (her düğümde LP çözümü verilmiştir):</p>
          ${OR.bnbSteps.modelHtml(P, { tail: 'x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer' })}
          <p><b>Kurallar:</b></p>${conventions(o)}
          <p class="muted">Soruları sağdaki ağaca bakarak cevapla. Sayıları kesir (15/4) veya ondalık (3.75) olarak girebilirsin.</p>`,
        viz: plainTree(tr),
        steps,
        solution: `<b>Optimal:</b> z* = ${tr.best.z.show()}, x<sub>1</sub> = ${tr.best.x[0]}, x<sub>2</sub> = ${tr.best.x[1]} · ${tr.nSolved} LP çözüldü · kural: ${o.order === 'lifo' ? `LIFO (önce ${o.firstChild === 'down' ? '≤' : '≥'} dalı)` : 'jumptracking'}.`,
      };
    },
  });
})();
