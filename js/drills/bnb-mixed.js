/* 2.5.1 · B&B for a MIXED IP with 2 variables (one integer, one continuous; lecture notes Example 6 style).
   Reuses the instance generator / plot helper of the pure-IP drill (OR.drills['bnb-pure'], loaded before this file):
     - intVars = [i] -> only x_i is integer; the branching, candidate and fathom logic of OR.bnb only looks at it
     - a node whose integer variable is integral is a candidate even if the continuous variable is fractional
   Rejected instances: ambiguous LP optima, several IP optima (uniqueIntOpt), aborted traces, big denominators, tiny/huge trees. */
(function () {
  const OR = window.OR;
  const bp = OR.drills['bnb-pure'];
  if (!bp) throw new Error('bnb-mixed: bnb-pure.js must be loaded first');

  const nm = (i) => `x<sub>${i + 1}</sub>`;

  const OPTIONS = [
    {
      key: 'intVar',
      label: 'Tamsayı olan değişken',
      type: 'select',
      default: 'rand',
      choices: [
        { value: 'rand', label: 'Rastgele' },
        { value: '1', label: 'x₁ tamsayı, x₂ sürekli (notlardaki gibi)' },
        { value: '2', label: 'x₂ tamsayı, x₁ sürekli' },
      ],
    },
    {
      key: 'order',
      label: 'Arama sırası',
      type: 'select',
      default: 'lifo',
      choices: [
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
    { key: 'askLP', label: 'LP çözümlerini ben hesaplayayım', type: 'checkbox', default: true },
  ];

  function conventions(opts, iv) {
    const I = nm(iv), C = nm(1 - iv);
    return `<ul class="conv">
      <li>Sadece <b>${I}</b> tamsayı olmak zorunda; <b>${C}</b> sürekli. Dallanma <b>yalnızca ${I}</b> üzerinde yapılır: ${C} kesirli çıksa bile dallanılmaz (o düğümde ${I} tamsayıysa çözüm uygundur).</li>
      <li>Alt problemler oluşturulma sırasıyla numaralanır: önce <b>≥</b> dalı, sonra <b>≤</b> dalı (Subp.2: ${I} ≥ ⌈·⌉, Subp.3: ${I} ≤ ⌊·⌋).</li>
      <li>${opts.order === 'lifo'
        ? `<b>LIFO (backtracking)</b>: en son oluşturulan çözülmemiş alt problem çözülür; dallanmadan sonra önce <b>${opts.firstChild === 'down' ? '≤' : '≥'}</b> dalı.`
        : '<b>Jumptracking</b>: dallanınca iki alt problem de hemen çözülür; sonra aktif düğümlerden en iyi z\'li olanda dallanılır.'}</li>
      <li>Fathom: infeasible · ${I} tamsayı olan çözüm (candidate) · z ≤ LB.</li>
    </ul>`;
  }

  function relaxationQuestion(iv) {
    const I = nm(iv), C = nm(1 - iv);
    return {
      kind: 'choice',
      prompt: `Bu bir <b>mixed IP</b> (yalnızca ${I} tamsayı). Önce <b>LP relaxation (LR)</b>'ı kur: hangisi doğru?`,
      options: [
        { html: `${I} için “and integer” şartı kaldırılır (${I} ≥ 0); ${C} zaten sürekli olduğundan aynen kalır`, correct: true },
        { html: `${C} da tamsayı yapılır; LR'da yalnızca ${I}, ${C} ≥ 0 kısıtları kalır`, correct: false },
        { html: `Tamsayı olmayan değişken ${C} atılır (${C} = 0 alınır)`, correct: false },
        { html: 'Kısıtların sağ taraf sabitleri tamsayıya yuvarlanır', correct: false },
      ],
      explain: `LR: integer şartı kaldırılır, geri kalan her şey (kısıtlar, sürekli değişken) aynı kalır. Burada tek fark ${I} ≥ 0 and integer → ${I} ≥ 0. Mixed IP'de sürekli değişkene hiçbir kısıt eklenmez; zaten dallanma yapılmayacak.`,
    };
  }

  function branchVarQuestion(trace, iv) {
    const I = nm(iv), C = nm(1 - iv);
    const x = trace.nodes[0].lp.x;
    return {
      kind: 'choice',
      keepOrder: true,
      prompt: `LR çözümünde ${nm(0)} = ${x[0].show()} ve ${nm(1)} = ${x[1].show()}; <b>ikisi de kesirli</b>. Mixed IP'de hangi değişken üzerinde dallanırız?`,
      options: [
        { html: `${I} üzerinde (tamsayı olması gereken değişken)`, correct: true },
        { html: `${C} üzerinde (sürekli değişken)`, correct: false },
        { html: 'İkisi üzerinde de ayrı ayrı', correct: false },
      ],
      explain: `Sadece tamsayı olması gereken değişkenler üzerinde dallanılır: <b>${I}</b> = ${x[iv].show()}. ${C} sürekli olduğundan kesirli değeri sorun değildir; ${C} üzerinde dallanmak anlamsızdır (hangi tamsayı kısıtını sağlayacak ki?).`,
    };
  }

  function conceptQuestion(trace, iv) {
    const I = nm(iv), C = nm(1 - iv);
    const best = trace.best;
    const cv = best.x[1 - iv];
    const frac = !cv.isInt();
    return {
      kind: 'choice',
      prompt: frac
        ? `Optimal çözümde ${C} = ${cv.show()} (kesirli). Bu, çözümün hatalı olduğu ya da ${C} üzerinde daha fazla dallanma gerektiği anlamına gelir mi?`
        : `Optimal çözümde ${C} = ${cv.show()} çıktı, ama ${C} sürekli bir değişken. ${C} kesirli çıksaydı bu, çözümün hatalı olduğu ya da ${C} üzerinde daha fazla dallanma gerektiği anlamına gelir miydi?`,
      options: [
        { html: `Hayır — ${C} sürekli bir değişken, kesirli olması serbest; yalnızca ${I} tamsayı olmalı`, correct: true },
        { html: `Evet — ${C} üzerinde de dallanıp ${C} tamsayı olana kadar devam etmeliyiz`, correct: false },
        { html: `Evet — ${C} kesirli olduğu için bu düğüm fathom edilemez`, correct: false },
      ],
      explain: `Mixed IP'de yalnızca tamsayı olması gereken değişkenler (burada ${I}) tamsayı olmak zorunda. ${I} = ${best.x[iv].show()} tamsayı olduğu için bu düğüm uygun bir çözümdür; ${C}'nin kesirli olması dallanma sebebi değildir. Pure IP'den fark: pure IP'de <i>tüm</i> değişkenler tamsayı olmalıdır.`,
    };
  }

  OR.registerDrill({
    id: 'bnb-mixed',
    topic: '2.5.1',
    title: 'B&B · Mixed IP (2 değişken, grafikli)',
    description: 'Bir değişkeni tamsayı, diğeri sürekli olan 2 değişkenli IP. Sadece tamsayı değişken üzerinde dallan; sürekli değişkenin kesirli çıkması dallanma sebebi değildir.',
    options: OPTIONS,
    generate(rng, rawOpts) {
      const opts = Object.assign({ intVar: 'rand', order: 'lifo', firstChild: 'up', askLP: true }, rawOpts || {});
      const iv = opts.intVar === '2' ? 1 : opts.intVar === '1' ? 0 : rng.pick([0, 1]);
      const cv = 1 - iv;
      // With ONE integer variable in 2D the tree always has exactly 3 LPs (the optimum of a child lies on the
      // branching line, so the integer variable is integral there) -> variety comes from the outcome type.
      const want = rng.pick(['bound', 'supersede', 'infeasible']);
      let res = null;
      for (let attempt = 0; attempt < 4 && !res; attempt++) {
        let calls = 0;
        res = bp.gen2(rng, opts, [iv], (tr) => {
          calls++;
          const strict = attempt === 0 && calls < 80;
          const mid = attempt <= 1;
          if (tr.nodes.some((nd) => nd.lp.status === 'optimal' && nd.lp.x.some((v) => v.d > 12n))) return false;
          const root = tr.nodes[0].lp;
          if (root.x[cv].isInt()) return false; // both variables fractional at the root: the "which variable?" question is meaningful
          if (strict) {
            const has = {
              bound: tr.events.some((e) => e.type === 'bound'),
              infeasible: tr.events.some((e) => e.type === 'infeasible'),
              supersede: tr.events.some((e) => e.type === 'candidate' && e.superseded.length > 0),
            };
            if (!has[want]) return false;
          }
          if (mid && tr.best.x[cv].isInt()) return false; // show a candidate with a fractional continuous variable
          return true;
        });
      }
      if (!res) throw new Error('uygun problem bulunamadı');
      const { P, trace } = res;
      const pf = bp.plotFor(P);
      const plot = (nd, solved) =>
        Object.assign(pf(nd, solved), {
          showInt: false,
          caption: `Subp. ${nd.id} uygun bölgesi (${nm(iv).replace(/<\/?sub>/g, '')} tamsayı: uygun noktalar x${iv + 1} = 0, 1, 2, … doğruları üzerinde)`,
        });

      const steps = [relaxationQuestion(iv)];
      let varAsked = false;
      OR.bnbSteps.build(trace, { askLP: opts.askLP, plot }).forEach((s) => {
        if (!varAsked && s.kind === 'choice' && s.prompt.indexOf('dallanacak') >= 0) {
          varAsked = true;
          steps.push(branchVarQuestion(trace, iv));
        }
        if (s.kind === 'choice' && s.explain && s.explain.indexOf('<b>candidate solution</b>') >= 0) {
          s.explain += ` <i>Mixed IP notu:</i> ${nm(cv)} kesirli olsa bile yalnızca ${nm(iv)} tamsayı olması yeterlidir.`;
        }
        steps.push(s);
      });
      steps.push(conceptQuestion(trace, iv));

      const tail = `x<sub>1</sub>, x<sub>2</sub> ≥ 0; ${nm(iv)} integer`; // notes Example 6 wording
      return {
        title: 'Branch & Bound · Mixed IP',
        statement: `<p>Aşağıdaki <b>mixed</b> IP'yi Branch &amp; Bound ile çöz:</p>
          ${OR.bnbSteps.modelHtml(P, { tail })}
          <p><b>Kurallar:</b></p>${conventions(opts, iv)}
          <p class="muted">Sayıları kesir (15/4) veya ondalık (3.75) olarak girebilirsin.</p>`,
        viz: [{ type: 'tree', caption: 'B&B ağacı', nodes: [] }, plot(trace.nodes[0], false)],
        steps,
        solution: `<b>Optimal:</b> z* = ${trace.best.z.show()}, x<sub>1</sub> = ${trace.best.x[0].show()}, x<sub>2</sub> = ${trace.best.x[1].show()} · ${trace.nSolved} LP çözüldü.`,
      };
    },
  });
})();
