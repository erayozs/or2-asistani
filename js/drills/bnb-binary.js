/* 2.5.2 · B&B for a binary IP (capital budgeting style, lecture notes Example 7).
   - 4 (or 5) binary variables, 2-3 "<=" constraints. Coefficients are small integers, or (option) one-decimal numbers like the notes.
   - First question: how to build the LP relaxation (0 <= x_j <= 1).
   - 4-variable LPs are not solved by hand: LP results are given (askLP option turns the LP questions on),
     the student makes the B&B decisions (branch / fathom / which node next / which variable).
   - Default jumptracking (as in the notes); LIFO as an option.
   - Rejected: traces with alternative LP optima (trace.ambiguous), ties for "best z", several IP optima, aborted traces. */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const range = OR.util.range;

  const title = (nd) => (nd.id === 1 ? 'LR' : `P${nd.id - 1}`);

  // brute force over the 2^n binary vectors (integer data): best value and the number of optimal vectors
  function ipOpt(P) {
    const n = P.c.length;
    let best = null;
    let count = 0;
    for (let m = 0; m < 1 << n; m++) {
      let ok = true;
      for (let r = 0; r < P.A.length && ok; r++) {
        let s = 0;
        for (let j = 0; j < n; j++) if ((m >> j) & 1) s += P.A[r][j];
        if (s > P.b[r]) ok = false;
      }
      if (!ok) continue;
      let z = 0;
      for (let j = 0; j < n; j++) if ((m >> j) & 1) z += P.c[j];
      if (best === null || z > best) { best = z; count = 1; } else if (z === best) count++;
    }
    return { z: best, count };
  }

  function jumpTie(tr) {
    for (const e of tr.events) {
      if (e.type === 'select' && e.rule === 'jump' && e.pool.length > 1) {
        const zs = e.pool.map((id) => tr.nodes[id - 1].lp.z).sort((p, q) => q.cmp(p));
        if (zs[0].eq(zs[1])) return true;
      }
    }
    return false;
  }

  /* Instance generator. o = {n, order, firstChild, dec}. Works on integer data; "dec" only changes the
     coefficient ranges (c: 1..6, a: 1..15, later shown divided by 10, like Example 7). */
  function genBin(rng, o) {
    const n = o.n;
    for (let tries = 0; tries < 2000; tries++) {
      const m = rng.int(2, 3);
      const c = range(n).map(() => (o.dec ? rng.int(1, 6) : rng.int(2, 12)));
      const A = range(m).map(() => range(n).map(() => (o.dec ? rng.int(1, 15) : rng.int(1, 9))));
      const b = A.map((r) => Math.max(2, Math.round(r.reduce((s, x) => s + x, 0) * rng.pick([0.4, 0.5, 0.6]))));
      const P = { c, A, b, lo: c.map(() => 0), hi: c.map(() => 1), intVars: range(n) };
      const root = OR.lp.solve(P);
      if (root.status !== 'optimal' || root.alternative) continue;
      const fr = root.x.filter((v) => !v.isInt()).length;
      if (fr === 0 || fr > 2) continue;
      const tr = OR.bnb.run(P, { order: o.order, firstChild: o.firstChild, maxNodes: 22 });
      if (tr.aborted || tr.ambiguous || !tr.best) continue;
      const minLP = tries < 120 ? 7 : 5;
      if (tr.nSolved < minLP || tr.nSolved > 11) continue;
      const kinds = new Set(tr.events.map((e) => e.type));
      if (!(kinds.has('infeasible') || kinds.has('bound') || kinds.has('prune'))) continue;
      if (!kinds.has('candidate')) continue;
      if (ipOpt(P).count !== 1) continue;
      if (jumpTie(tr)) continue;
      if (tr.nodes.some((nd) => nd.lp.status === 'optimal' && (nd.lp.z.d > 60n || nd.lp.x.some((v) => v.d > 30n)))) continue;
      if (rng() > { 5: 1, 7: 1, 9: 0.6, 11: 0.3 }[tr.nSolved]) continue;
      return { P, trace: tr };
    }
    return null;
  }

  // ---- model text ------------------------------------------------------
  const fmt1 = (v) => F(v).dec(1); // one decimal, trailing zeros trimmed: 0.5, 1, 1.5, 3.1
  function modelDec(P, tail) {
    const lin = (row) => {
      let out = '';
      row.forEach((c, j) => {
        c = F(c);
        if (c.isZero()) return;
        const t = `${c.eq(1) ? '' : fmt1(c) + ' '}x<sub>${j + 1}</sub>`;
        out += out === '' ? t : ' + ' + t;
      });
      return out;
    };
    let h = `max z = ${lin(P.c)}\n`;
    P.A.forEach((row, r) => {
      h += `${r === 0 ? 's.t.   ' : '       '}${lin(row)} ≤ ${fmt1(P.b[r])}\n`;
    });
    h += `       ${tail}`;
    return `<div class="model">${h}</div>`;
  }

  function relaxationQuestion(n) {
    return {
      kind: 'choice',
      prompt: `Önce <b>LP relaxation (LR)</b>'ı kur. “x<sub>j</sub> = 0 or 1 (j = 1, …, ${n})” koşulu gevşetilirken hangisi doğru (ve en sıkı) LR'dır?`,
      options: [
        { html: `0 ≤ x<sub>j</sub> ≤ 1 &nbsp;(j = 1, …, ${n})`, correct: true },
        { html: `x<sub>j</sub> ≥ 0 &nbsp;(üst sınır yok)`, correct: false },
        { html: `x<sub>j</sub> ≤ 1 &nbsp;(alt sınır yok)`, correct: false },
        { html: `0 &lt; x<sub>j</sub> &lt; 1 &nbsp;(açık aralık)`, correct: false },
      ],
      explain:
        'Notlardaki gibi: “x<sub>j</sub> = 0 or 1” yerine <b>0 ≤ x<sub>j</sub> ≤ 1</b> yazılır; sadece 0-1 (tamsayılık) şartı kalkar, aralık korunur. ' +
        '“x<sub>j</sub> ≥ 0” da geçerli bir gevşetme olurdu ama x<sub>j</sub> &gt; 1 değerlerine izin verip bound\'u gereksiz zayıflatır (en sıkı olan değil). ' +
        '“x<sub>j</sub> ≤ 1” negatif değerlere izin verir. Açık aralık 0 &lt; x<sub>j</sub> &lt; 1 ise 0 ve 1\'i dışlar: IP\'nin hiçbir uygun çözümü kalmaz, yani gevşetme bile değildir.',
    };
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
      label: 'Değişken sayısı',
      type: 'select',
      default: '4',
      choices: [
        { value: '4', label: '4' },
        { value: '5', label: '5' },
      ],
    },
    {
      key: 'coef',
      label: 'Katsayılar',
      type: 'select',
      default: 'int',
      choices: [
        { value: 'int', label: 'Tamsayı' },
        { value: 'dec', label: 'Ondalıklı (Example 7 gibi)' },
      ],
    },
    { key: 'askLP', label: 'LP çözümlerini ben bulayım', type: 'checkbox', default: false },
  ];

  function conventions(opts) {
    return `<ul class="conv">
      <li>LR: x<sub>j</sub> = 0 or 1 yerine <b>0 ≤ x<sub>j</sub> ≤ 1</b>. Alt problemlerin LP çözümleri ${opts.askLP ? 'senden istenir' : 'verilir (4 değişkenli LP\'yi elle çözmüyoruz)'}; sen B&amp;B kararlarını verirsin.</li>
      <li>Dallanma: kesirli x<sub>j</sub> için <b>x<sub>j</sub> = 0</b> ve <b>x<sub>j</sub> = 1</b>. Alt problemler oluşturulma sırasıyla numaralanır (LR → P1, P2, …); önce x<sub>j</sub> = 0 dalı numaralanır (notlardaki gibi). Kesirli olanlar içinden indisi en küçük olan seçilir.</li>
      <li>${opts.order === 'lifo'
        ? `<b>LIFO (backtracking)</b>: en son oluşturulan çözülmemiş alt problem çözülür; dallanmadan sonra önce <b>x = ${opts.firstChild === 'down' ? '0' : '1'}</b> dalı.`
        : '<b>Jumptracking</b>: dallanınca iki alt problem de hemen çözülür; sonra aktif düğümlerden en iyi z\'li olanda dallanılır.'}</li>
      <li>Fathom: infeasible · tamsayı (binary) çözüm = candidate · z ≤ LB.</li>
    </ul>`;
  }

  OR.registerDrill({
    id: 'bnb-binary',
    topic: '2.5.2',
    title: 'B&B · Binary IP (Example 7 tarzı)',
    description: 'Rastgele 4-5 değişkenli binary IP (capital budgeting). LR\'ı kur, LP sonuçlarını kullanarak dallanma / fathom / sıradaki düğüm kararlarını ver; sonunda çözülen LP sayısını 2<sup>n</sup> ile karşılaştır.',
    options: OPTIONS,
    genBin,
    generate(rng, rawOpts) {
      const opts = Object.assign({ order: 'jump', firstChild: 'up', n: '4', coef: 'int', askLP: false }, rawOpts || {});
      const n = Number(opts.n) === 5 ? 5 : 4;
      const dec = opts.coef === 'dec';
      const res = genBin(rng, { n, order: opts.order, firstChild: opts.firstChild, dec });
      if (!res) throw new Error('uygun problem bulunamadı');
      let { P, trace } = res;
      if (dec) {
        // same problem shown with one-decimal numbers (all data / 10): identical tree, z values / 10
        P = Object.assign({}, P, {
          c: P.c.map((v) => F(v).div(10)),
          A: P.A.map((r) => r.map((v) => F(v).div(10))),
          b: P.b.map((v) => F(v).div(10)),
        });
        trace = OR.bnb.run(P, { order: opts.order, firstChild: opts.firstChild, maxNodes: 22 });
        if (trace.ambiguous || trace.aborted) throw new Error('beklenmeyen: ölçekleme izi değiştirdi');
      }
      const best = trace.best;
      const total = 1 << n;

      const steps = [relaxationQuestion(n)];
      const tail = `x<sub>j</sub> = 0 or 1, j = 1, …, ${n}`;
      OR.bnbSteps
        .build(trace, { askLP: opts.askLP, title })
        .forEach((s) => {
          if (dec) {
            // the core "binding constraints" sentence prints fractions (1/2) -> drop it for one-decimal data
            if (s.explain) s.explain = s.explain.replace(/\s*Bağlayıcı \(binding\) kısıtlar:.*$/s, '');
          }
          steps.push(s);
        });
      steps.push({
        kind: 'number',
        prompt: `Karşılaştırma: B&B toplam kaç LP çözdü (LR dahil)? Tam enumerasyonda ise kaç aday çözüm (binary vektör) incelenirdi?`,
        fields: [
          { label: 'B&B\'de çözülen LP sayısı', answer: trace.nSolved },
          { label: `Tam enumerasyon: 2<sup>${n}</sup>`, answer: total },
        ],
        explain: `${trace.nSolved} LP çözüldü; ${n} binary değişkenin ${total} farklı 0-1 kombinasyonu var. Notlardaki Review gibi: B&B de ağaçta 2'nin kuvvetleriyle ilerler ama fathom edilen düğümlerin altındaki çözümler hiç incelenmeden elenir; bu yüzden tüm ${total} çözümü saymak zorunda kalmayız.`,
      });

      const chosen = range(n).filter((j) => best.x[j].eq(1));
      return {
        title: 'Branch & Bound · Binary IP',
        statement: `<p>Aşağıdaki binary IP'yi (x<sub>j</sub> = 1: j. proje seçilir) Branch &amp; Bound ile çöz:</p>
          ${dec ? modelDec(P, tail) : OR.bnbSteps.modelHtml(P, { tail })}
          <p><b>Kurallar:</b></p>${conventions(opts)}
          <p class="muted">Sayıları kesir (13/20) veya ondalık (0.65) olarak girebilirsin.</p>`,
        viz: { type: 'tree', caption: 'B&B ağacı', nodes: [] },
        steps,
        solution: `<b>Optimal:</b> z* = ${best.z.show()}, x = (${best.x.map((v) => v.toString()).join(', ')})${chosen.length ? ` → projeler ${chosen.map((j) => j + 1).join(', ')} seçilir` : ''}. ${trace.nSolved} LP çözüldü (tam enumerasyon: ${total}).`,
      };
    },
  });
})();
