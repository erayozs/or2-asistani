/* Chapter 1 · formulation drills (generated):
   logic-constraints (1.1), fixed-charge-m (1.3), either-or-m (1.4), if-then (1.5), set-cover (1.6), pw-weights (1.8) */
(function () {
  const OR = window.OR;
  const F = OR.F;
  const v = (i) => `x<sub>${i + 1}</sub>`;

  // ------------------------------------------------------------------ 1.1 logical constraints
  // Every candidate constraint is checked against the statement's truth table over all 0-1 vectors,
  // so a distractor can never be logically equivalent to the answer.
  const CONSTRAINTS = {
    imp: (i, j) => ({ html: `${v(i)} ≤ ${v(j)}`, ok: (x) => x[i] <= x[j] }),
    impRev: (i, j) => ({ html: `${v(j)} ≤ ${v(i)}`, ok: (x) => x[j] <= x[i] }),
    nand: (i, j) => ({ html: `${v(i)} + ${v(j)} ≤ 1`, ok: (x) => x[i] + x[j] <= 1 }),
    or: (i, j) => ({ html: `${v(i)} + ${v(j)} ≥ 1`, ok: (x) => x[i] + x[j] >= 1 }),
    xor: (i, j) => ({ html: `${v(i)} + ${v(j)} = 1`, ok: (x) => x[i] + x[j] === 1 }),
    eq: (i, j) => ({ html: `${v(i)} = ${v(j)}`, ok: (x) => x[i] === x[j] }),
    both: (i, j) => ({ html: `${v(i)} + ${v(j)} = 2`, ok: (x) => x[i] + x[j] === 2 }),
    diffGe: (i, j) => ({ html: `${v(i)} − ${v(j)} ≥ 0`, ok: (x) => x[i] - x[j] >= 0 }),
    imp2: (i, j, k) => ({ html: `2${v(i)} ≤ ${v(j)} + ${v(k)}`, ok: (x) => 2 * x[i] <= x[j] + x[k] }),
    imp2or: (i, j, k) => ({ html: `${v(i)} ≤ ${v(j)} + ${v(k)}`, ok: (x) => x[i] <= x[j] + x[k] }),
    sumLe: (n, k) => ({ html: `${OR.util.range(n).map(v).join(' + ')} ≤ ${k}`, ok: (x) => x.reduce((a, b) => a + b, 0) <= k }),
    sumGe: (n, k) => ({ html: `${OR.util.range(n).map(v).join(' + ')} ≥ ${k}`, ok: (x) => x.reduce((a, b) => a + b, 0) >= k }),
    sumEq: (n, k) => ({ html: `${OR.util.range(n).map(v).join(' + ')} = ${k}`, ok: (x) => x.reduce((a, b) => a + b, 0) === k }),
  };
  function allVectors(n) {
    const out = [];
    for (let m = 0; m < 1 << n; m++) out.push(OR.util.range(n).map((i) => (m >> i) & 1));
    return out;
  }
  function logicStatement(rng, n) {
    const ids = rng.shuffle(OR.util.range(n));
    const [i, j, k] = ids;
    const C = CONSTRAINTS;
    const L = (t) => `yatırım ${t + 1}`;
    const kind = rng.pick(['atmost', 'atleast', 'exactlyk', 'imp', 'nand', 'xor', 'or', 'eq', 'imp2', 'imp2or', 'notThen']);
    const kk = rng.int(2, n - 1);
    switch (kind) {
      case 'atmost': return { text: `En fazla ${kk} yatırım yapılabilir.`, f: (x) => x.reduce((a, b) => a + b, 0) <= kk, ans: C.sumLe(n, kk), dis: [C.sumGe(n, kk), C.sumEq(n, kk), C.sumLe(n, kk - 1)], why: 'Seçilen yatırım sayısı = ∑x<sub>j</sub>; "en fazla k" → ∑x<sub>j</sub> ≤ k.' };
      case 'atleast': return { text: `En az ${kk} yatırım yapılmalıdır.`, f: (x) => x.reduce((a, b) => a + b, 0) >= kk, ans: C.sumGe(n, kk), dis: [C.sumLe(n, kk), C.sumEq(n, kk), C.sumGe(n, kk + 1 <= n ? kk + 1 : kk - 1)], why: '"En az k" → ∑x<sub>j</sub> ≥ k.' };
      case 'exactlyk': return { text: `Tam olarak ${kk} yatırım yapılmalıdır.`, f: (x) => x.reduce((a, b) => a + b, 0) === kk, ans: C.sumEq(n, kk), dis: [C.sumLe(n, kk), C.sumGe(n, kk), C.sumEq(n, kk - 1)], why: '"Tam olarak k" → ∑x<sub>j</sub> = k.' };
      case 'imp': return { text: `${L(i)} yapılırsa, ${L(j)} da yapılmalıdır.`, f: (x) => !x[i] || x[j], ans: C.imp(i, j), dis: [C.impRev(i, j), C.nand(i, j), C.eq(i, j), C.or(i, j)], why: `x<sub>${i + 1}</sub> = 1 ise ${v(j)} ≥ 1 yani ${v(j)} = 1 olmak zorunda; x<sub>${i + 1}</sub> = 0 ise ${v(j)} serbest (0 veya 1). Ters yazmak (${v(j)} ≤ ${v(i)}) "${j + 1} yapılırsa ${i + 1} yapılmalı" anlamına gelir.` };
      case 'nand': return { text: `${L(i)} yapılırsa, ${L(j)} yapılamaz.`, f: (x) => !(x[i] && x[j]), ans: C.nand(i, j), dis: [C.xor(i, j), C.imp(i, j), C.or(i, j)], why: `İkisi birden 1 olamaz → ${v(i)} + ${v(j)} ≤ 1. ${v(i)} = 0 iken ${v(j)} serbest olduğundan "= 1" yanlıştır (ikisinin de yapılmaması da mümkün).` };
      case 'xor': return { text: `${L(i)} veya ${L(j)} yapılmalı (ikisinden sadece biri, ikisi birden değil).`, f: (x) => x[i] + x[j] === 1, ans: C.xor(i, j), dis: [C.or(i, j), C.nand(i, j), C.eq(i, j)], why: 'Tam olarak biri → toplam = 1. "≥ 1" ikisinin birden yapılmasına izin verir, "≤ 1" hiçbirinin yapılmamasına izin verir.' };
      case 'or': return { text: `${L(i)} ve ${L(j)} arasından en az biri yapılmalıdır.`, f: (x) => x[i] + x[j] >= 1, ans: C.or(i, j), dis: [C.xor(i, j), C.nand(i, j), C.both(i, j)], why: 'En az biri → toplam ≥ 1 (ikisi birden de olabilir).' };
      case 'eq': return { text: `${L(i)} ve ${L(j)} ya birlikte yapılır ya da hiçbiri yapılmaz.`, f: (x) => x[i] === x[j], ans: C.eq(i, j), dis: [C.imp(i, j), C.xor(i, j), C.both(i, j)], why: `"Birlikte" → ${v(i)} = ${v(j)} (hem ${v(i)} ≤ ${v(j)} hem ${v(j)} ≤ ${v(i)}).` };
      case 'imp2': return { text: `${L(i)} yapılırsa, hem ${L(j)} hem ${L(k)} yapılmalıdır.`, f: (x) => !x[i] || (x[j] && x[k]), ans: C.imp2(i, j, k), dis: [C.imp2or(i, j, k), C.imp(i, j), C.imp2(j, i, k)], why: `${v(i)} = 1 ise ${v(j)} + ${v(k)} ≥ 2 → ikisi de 1. (Eşdeğer: ${v(i)} ≤ ${v(j)} ve ${v(i)} ≤ ${v(k)} iki ayrı kısıt.) ${v(i)} ≤ ${v(j)} + ${v(k)} sadece "en az biri" der.` };
      case 'imp2or': return { text: `${L(i)} yapılırsa, ${L(j)} ve ${L(k)} arasından en az biri yapılmalıdır.`, f: (x) => !x[i] || x[j] || x[k], ans: C.imp2or(i, j, k), dis: [C.imp2(i, j, k), C.imp(i, j), C.or(j, k)], why: `${v(i)} = 1 ise ${v(j)} + ${v(k)} ≥ 1; ${v(i)} = 0 ise kısıt bağlayıcı değil.` };
      default: return { text: `${L(i)} yapılmazsa, ${L(j)} yapılmalıdır.`, f: (x) => x[i] || x[j], ans: C.or(i, j), dis: [C.imp(i, j), C.xor(i, j), C.nand(i, j)], why: `${v(i)} = 0 ⇒ ${v(j)} = 1, yani ikisinden en az biri 1: ${v(i)} + ${v(j)} ≥ 1 ("${v(i)} = 1" iken ${v(j)} serbest).` };
    }
  }

  OR.registerDrill({
    id: 'logic-constraints',
    topic: '1.1',
    title: 'Mantıksal 0-1 kısıtları (Budgeting)',
    description: 'Capital budgeting ifadelerini 0-1 değişkenli doğrusal kısıtlara çevir (notlar Example 3 tarzı). Yanlış şıklar doğruluk tablosuyla yanlış olduğu garanti edilerek üretilir.',
    options: [{ key: 'count', label: 'Soru sayısı', type: 'select', default: '6', choices: [{ value: '4', label: '4' }, { value: '6', label: '6' }, { value: '10', label: '10' }] }],
    generate(rng, opts) {
      const n = rng.int(4, 5);
      const vecs = allVectors(n);
      const steps = [];
      const seen = new Set();
      let guard = 0;
      while (steps.length < +(opts.count || 6) && guard++ < 400) {
        const s = logicStatement(rng, n);
        if (seen.has(s.text)) continue;
        // truth-table validation
        if (!vecs.every((x) => !!s.ans.ok(x) === !!s.f(x))) continue;
        const dis = s.dis.filter((d) => d.html !== s.ans.html && !vecs.every((x) => !!d.ok(x) === !!s.f(x)));
        const uniq = [];
        dis.forEach((d) => { if (!uniq.some((u) => u.html === d.html)) uniq.push(d); });
        if (uniq.length < 3) continue;
        seen.add(s.text);
        // counterexample for the most tempting distractor
        const d0 = uniq[0];
        const ce = vecs.find((x) => !!d0.ok(x) !== !!s.f(x));
        steps.push({
          kind: 'choice',
          prompt: `“${s.text}”`,
          options: [{ html: s.ans.html, correct: true }].concat(uniq.slice(0, 3).map((d) => ({ html: d.html, correct: false }))),
          explain: `${s.why}<br><span class="muted">Örn. ${d0.html} yanlış: x = (${ce.join(', ')}) için ${d0.ok(ce) ? 'kısıt sağlanıyor ama ifade ihlal ediliyor' : 'ifade sağlanıyor ama kısıt bunu yasaklıyor'}.</span>`,
        });
      }
      return {
        title: 'Mantıksal kısıtlar · Capital budgeting',
        statement: `<p>Bir şirket ${n} yatırımı değerlendiriyor. x<sub>j</sub> = 1 ise yatırım j yapılır, 0 ise yapılmaz (j = 1,…,${n}).
          Her ifade için onu <b>tam olarak</b> modelleyen kısıtı seç.</p>`,
        steps,
      };
    },
  });

  // ------------------------------------------------------------------ 1.3 fixed charge (Gandhi style)
  OR.registerDrill({
    id: 'fixed-charge-m',
    topic: '1.3',
    title: 'Fixed charge · M değerleri (Gandhi tipi)',
    description: 'Kira/sabit maliyetli ürün planlama: kar katsayıları, x<sub>j</sub> ≤ M<sub>j</sub>y<sub>j</sub> kısıtı ve en küçük geçerli M<sub>j</sub> değerleri.',
    generate(rng) {
      const prods = ['Gömlek', 'Şort', 'Pantolon'];
      let a, b, M;
      for (let t = 0; t < 200; t++) {
        a = [OR.util.range(3).map(() => rng.int(2, 7)), OR.util.range(3).map(() => rng.int(2, 6))];
        b = [rng.int(12, 30) * 10, rng.int(12, 30) * 10];
        M = OR.util.range(3).map((j) => Math.floor(Math.min(b[0] / a[0][j], b[1] / a[1][j])));
        // want the binding resource to differ across products and at least one non-integer ratio
        const binding = OR.util.range(3).map((j) => (b[0] / a[0][j] < b[1] / a[1][j] ? 0 : 1));
        const ratiosDistinct = OR.util.range(3).every((j) => b[0] / a[0][j] !== b[1] / a[1][j]);
        if (ratiosDistinct && new Set(binding).size === 2 && OR.util.range(3).some((j) => b[binding[j]] % a[binding[j]][j] !== 0)) break;
      }
      const price = OR.util.range(3).map(() => rng.int(10, 20));
      const cost = price.map((p) => p - rng.int(2, 8));
      const rent = OR.util.range(3).map(() => rng.int(5, 25) * 10);
      const prof = price.map((p, j) => p - cost[j]);
      const tbl = `<table class="mtx"><tr><th></th>${prods.map((p) => `<th>${p}</th>`).join('')}<th>Mevcut</th></tr>
        <tr><th>İşçilik (saat/birim)</th>${a[0].map((x) => `<td>${x}</td>`).join('')}<td>${b[0]}</td></tr>
        <tr><th>Kumaş (m²/birim)</th>${a[1].map((x) => `<td>${x}</td>`).join('')}<td>${b[1]}</td></tr>
        <tr><th>Makine kirası ($/hafta)</th>${rent.map((x) => `<td>${x}</td>`).join('')}<td></td></tr>
        <tr><th>Birim değişken maliyet</th>${cost.map((x) => `<td>${x}</td>`).join('')}<td></td></tr>
        <tr><th>Satış fiyatı</th>${price.map((x) => `<td>${x}</td>`).join('')}<td></td></tr></table>`;
      const steps = [];
      steps.push({
        kind: 'number',
        prompt: `Amaç fonksiyonunda x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>'ün katsayıları (birim kâr) nedir?`,
        fields: prof.map((p, j) => ({ label: `c<sub>${j + 1}</sub>`, answer: p })),
        explain: `Birim kâr = satış fiyatı − değişken maliyet: ${prof.map((p, j) => `${price[j]} − ${cost[j]} = ${p}`).join(', ')}. Kira y<sub>j</sub> ile ayrıca düşülür: max ${prof.map((p, j) => `${p}x<sub>${j + 1}</sub>`).join(' + ')} − ${rent.map((r, j) => `${r}y<sub>${j + 1}</sub>`).join(' − ')}.`,
      });
      steps.push({
        kind: 'choice',
        prompt: `“x<sub>j</sub> > 0 ise makine kiralanmalı (y<sub>j</sub> = 1)” koşulunu hangi kısıt sağlar?`,
        options: [
          { html: 'x<sub>j</sub> ≤ M<sub>j</sub> y<sub>j</sub>', correct: true },
          { html: 'y<sub>j</sub> ≤ M<sub>j</sub> x<sub>j</sub>', correct: false },
          { html: 'x<sub>j</sub> ≥ M<sub>j</sub> y<sub>j</sub>', correct: false },
          { html: 'x<sub>j</sub> ≤ M<sub>j</sub> (1 − y<sub>j</sub>)', correct: false },
        ],
        explain: 'y<sub>j</sub> = 0 ⇒ x<sub>j</sub> ≤ 0 yani üretim yok; y<sub>j</sub> = 1 ⇒ x<sub>j</sub> ≤ M<sub>j</sub> (M yeterince büyükse bağlayıcı değil). y<sub>j</sub> = 1 iken x<sub>j</sub> = 0 olması mümkün ama maksimizasyon kira maliyetinden kaçınmak için y<sub>j</sub>\'yi 0 yapar.',
      });
      steps.push({
        kind: 'number',
        prompt: `x<sub>j</sub> ≤ M<sub>j</sub>y<sub>j</sub> kısıtlarında üretimi gereksiz yere kısıtlamayan <b>en küçük</b> M<sub>j</sub> değerleri nedir? (Kaynak kısıtlarından üretilebilecek en fazla tamsayı miktar)`,
        fields: M.map((m, j) => ({ label: `M<sub>${j + 1}</sub>`, answer: m, tol: 0 })),
        hint: 'Her ürün için: sadece o ürün üretilse her kaynaktan en fazla kaç birim yapılabilir? Küçük olanı al, aşağı yuvarla (x tamsayı).',
        explain: M.map((m, j) => `${prods[j]}: min(${b[0]}/${a[0][j]}, ${b[1]}/${a[1][j]}) = min(${F(b[0]).div(a[0][j]).show()}, ${F(b[1]).div(a[1][j]).show()}) → <b>${m}</b>`).join('<br>') + '<br>Notlarda: gömlek M<sub>1</sub> = 40 (kumaş: 160/4), şort M<sub>2</sub> = 53 (kumaş: 160/3 = 53.3), pantolon M<sub>3</sub> = 25 (işçilik: 150/6).',
      });
      const small = Math.max(1, Math.floor(M[0] / 4));
      steps.push({
        kind: 'choice',
        prompt: `M<sub>1</sub> yerine ${small} kullanılsaydı ne olurdu?`,
        options: [
          { html: `x<sub>1</sub> ≤ ${small} gereksiz bir üst sınır olur; optimal çözüm kesilebilir`, correct: true },
          { html: 'Hiçbir şey değişmez, M her zaman keyfidir', correct: false },
          { html: 'Model infeasible olur', correct: false },
          { html: 'y<sub>1</sub> her zaman 0 olmak zorunda kalır', correct: false },
        ],
        explain: `Notlar: "If M<sub>1</sub> were not chosen large (say M<sub>1</sub>=10), then the additional constraint for shirts would unnecessarily restrict the value of x<sub>1</sub>." M, diğer kısıtlardan gelen gerçek üst sınırdan küçük olmamalı.`,
      });
      // evaluate a plan
      let plan;
      for (let t = 0; t < 200; t++) {
        plan = OR.util.range(3).map((j) => (rng.chance(0.65) ? rng.int(1, Math.max(1, Math.floor(M[j] / 2))) : 0));
        const ok = [0, 1].every((r) => plan.reduce((s, x, j) => s + a[r][j] * x, 0) <= b[r]);
        if (ok && plan.some((x) => x > 0) && plan.some((x) => x === 0)) break;
      }
      const y = plan.map((x) => (x > 0 ? 1 : 0));
      const z = plan.reduce((s, x, j) => s + prof[j] * x - rent[j] * y[j], 0);
      steps.push({
        kind: 'number',
        prompt: `Plan: x = (${plan.join(', ')}). Optimalde y değerleri buna göre seçilirse haftalık kâr z kaçtır?`,
        fields: [{ label: 'z', answer: z, tol: 0 }],
        explain: `Üretilen ürünler için y<sub>j</sub> = 1, üretilmeyenler için y<sub>j</sub> = 0 (kira ödenmez): y = (${y.join(', ')}). z = ${plan.map((x, j) => `${prof[j]}·${x}`).join(' + ')} − (${rent.map((r, j) => `${r}·${y[j]}`).join(' + ')}) = <b>${z}</b>.`,
      });
      return {
        title: 'Fixed Charge · Gandhi tipi problem',
        statement: `<p>Bir firma gömlek, şort ve pantolon üretiyor; her ürün için makine haftalık kiralanmalı (sabit maliyet). x<sub>j</sub>: üretim miktarı (tamsayı), y<sub>j</sub> = 1 ürün j üretilirse.</p>${tbl}`,
        steps,
      };
    },
  });

  // ------------------------------------------------------------------ 1.4 either-or
  OR.registerDrill({
    id: 'either-or-m',
    topic: '1.4',
    title: 'Either-or kısıtları · M seçimi',
    description: '“x = 0 veya x ≥ L” (compact car) ve “iki kısıttan en az biri” durumları: f ≤ My, g ≤ M(1−y) yapısı ve en küçük geçerli M.',
    generate(rng) {
      const steps = [];
      // part A: compact car
      let s, l, S, Lh, L, M;
      for (let t = 0; t < 200; t++) {
        s = rng.pick([1, 1.5, 2, 2.5, 3]);
        l = rng.pick([10, 20, 25, 30, 40]);
        S = rng.int(4, 12) * 1000;
        Lh = rng.int(4, 12) * 10000;
        L = rng.pick([500, 800, 1000, 1200]);
        M = Math.min(S / s, Lh / l);
        if (Number.isInteger(M) && M > L && S / s !== Lh / l) break;
      }
      steps.push({
        kind: 'choice',
        prompt: `Koşul: “x = 0 veya x ≥ ${L}”. Either-or formatında (f ≤ 0 veya g ≤ 0) f ve g nedir?`,
        options: [
          { html: `f = x, &nbsp; g = ${L} − x`, correct: true },
          { html: `f = −x, &nbsp; g = x − ${L}`, correct: false },
          { html: `f = x − ${L}, &nbsp; g = x`, correct: false },
          { html: `f = x, &nbsp; g = x − ${L}`, correct: false },
        ],
        explain: `x = 0 ⇔ x ≤ 0 (x ≥ 0 iken) → f = x ≤ 0. x ≥ ${L} ⇔ ${L} − x ≤ 0 → g = ${L} − x.`,
      });
      steps.push({
        kind: 'number',
        prompt: `Bir araç ${s} ton çelik ve ${l} saat işçilik gerektiriyor; ${S.toLocaleString('en-US')} ton çelik ve ${Lh.toLocaleString('en-US')} saat işçilik var. Notlardaki gibi M = üretilebilecek en fazla araç sayısı ise M kaçtır?`,
        fields: [{ label: 'M', answer: M, tol: 0 }],
        explain: `M = min(${S}/${s}, ${Lh}/${l}) = min(${S / s}, ${Lh / l}) = <b>${M}</b> (notlarda: min(6000/1.5, 60000/30) = 2000). x ≤ M y ile x hiçbir zaman M'yi aşamaz; ${L} − x ≤ M(1 − y) için de M ≥ ${L} yeterli.`,
      });
      steps.push({
        kind: 'choice',
        prompt: 'Hangi kısıt çifti koşulu doğru modeller? (y ∈ {0,1})',
        options: [
          { html: `x ≤ ${M}y &nbsp;ve&nbsp; ${L} − x ≤ ${M}(1 − y)`, correct: true },
          { html: `x ≤ ${M}(1 − y) &nbsp;ve&nbsp; ${L} − x ≤ ${M}(1 − y)`, correct: false },
          { html: `x ≥ ${M}y &nbsp;ve&nbsp; x − ${L} ≤ ${M}(1 − y)`, correct: false },
          { html: `x ≤ ${M}y &nbsp;ve&nbsp; x − ${L} ≤ ${M}(1 − y)`, correct: false },
        ],
        explain: `y = 0 ⇒ x ≤ 0 (x = 0) ve ikinci kısıt ${L} − x ≤ ${M} (her zaman sağlanır). y = 1 ⇒ x ≤ ${M} (zaten sağlanır) ve x ≥ ${L}. İki kısıt aynı (1−y) ile yazılırsa ikisi aynı anda zorlanır.`,
      });
      // part B: two general constraints with box bounds
      let a, bb, c, dd, U;
      for (let t = 0; t < 200; t++) {
        a = [rng.int(1, 5), rng.int(1, 5)]; bb = rng.int(6, 20);
        c = [rng.int(1, 5), rng.int(1, 5)]; dd = rng.int(6, 20);
        U = [rng.int(4, 10), rng.int(4, 10)];
        if (a[0] * U[0] + a[1] * U[1] > bb + 2 && c[0] * U[0] + c[1] * U[1] > dd + 2 && (a[0] !== c[0] || a[1] !== c[1])) break;
      }
      const M1 = a[0] * U[0] + a[1] * U[1] - bb, M2 = c[0] * U[0] + c[1] * U[1] - dd;
      steps.push({
        kind: 'number',
        prompt: `Şimdi 0 ≤ x<sub>1</sub> ≤ ${U[0]}, 0 ≤ x<sub>2</sub> ≤ ${U[1]} ve şu iki kısıttan <b>en az birinin</b> sağlanması isteniyor:<br>
          (1) ${a[0]}x<sub>1</sub> + ${a[1]}x<sub>2</sub> ≤ ${bb} &nbsp;&nbsp; (2) ${c[0]}x<sub>1</sub> + ${c[1]}x<sub>2</sub> ≤ ${dd}<br>
          f = ${a[0]}x<sub>1</sub> + ${a[1]}x<sub>2</sub> − ${bb} ≤ M<sub>1</sub>y ve g = ${c[0]}x<sub>1</sub> + ${c[1]}x<sub>2</sub> − ${dd} ≤ M<sub>2</sub>(1−y). Geçerli <b>en küçük</b> M<sub>1</sub>, M<sub>2</sub> nedir?`,
        fields: [{ label: 'M<sub>1</sub>', answer: M1, tol: 0 }, { label: 'M<sub>2</sub>', answer: M2, tol: 0 }],
        hint: 'M, ilgili fonksiyonun diğer kısıtlar altında alabileceği en büyük değer olmalı (y=1 iken kısıt "boşa düşmeli").',
        explain: `f'nin en büyük değeri x = (${U[0]}, ${U[1]})'de: ${a[0]}·${U[0]} + ${a[1]}·${U[1]} − ${bb} = <b>${M1}</b>. g için: ${c[0]}·${U[0]} + ${c[1]}·${U[1]} − ${dd} = <b>${M2}</b>. Notlardaki kural: M, diğer kısıtları sağlayan tüm x için f ≤ M ve g ≤ M olacak kadar büyük seçilir.`,
      });
      steps.push({
        kind: 'choice',
        prompt: 'y = 1 olduğunda hangisi doğrudur?',
        options: [
          { html: '(2) mutlaka sağlanır, (1) sağlanabilir de sağlanmayabilir de', correct: true },
          { html: '(1) mutlaka sağlanır, (2) serbesttir', correct: false },
          { html: 'İki kısıt da mutlaka sağlanır', correct: false },
          { html: 'İki kısıt da devre dışı kalır', correct: false },
        ],
        explain: 'y = 1 ⇒ g ≤ M<sub>2</sub>·0 = 0 yani (2) zorunlu; f ≤ M<sub>1</sub> her zaman sağlandığından (1) serbest. Notlar: "If y = 1, then (2) and possibly (1) must be satisfied."',
      });
      return {
        title: 'Either-Or Constraints',
        statement: '<p>Genel kalıp: f ≤ 0 veya g ≤ 0 → <b>f ≤ My</b>, <b>g ≤ M(1 − y)</b>, y ∈ {0,1}. y = 0 ⇒ (1) zorunlu; y = 1 ⇒ (2) zorunlu.</p>',
        steps,
      };
    },
  });

  // ------------------------------------------------------------------ 1.5 if-then
  OR.registerDrill({
    id: 'if-then',
    topic: '1.5',
    title: 'If-then kısıtları (Warehouse tipi)',
    description: '“f > 0 ise g ≥ 0” → −g ≤ My, f ≤ M(1−y). Depo kapasite kullanımı örneği ve en küçük M değerleri.',
    generate(rng) {
      const K = rng.int(3, 12) * 10000;
      const p = rng.pick([25, 30, 40, 50, 60, 75]);
      const thr = (K * p) / 100;
      const i = rng.int(1, 5);
      let j = rng.int(1, 5);
      if (j === i) j = (i % 5) + 1;
      const sum = `x<sub>${i}1</sub> + x<sub>${i}2</sub> + x<sub>${i}3</sub> + x<sub>${i}4</sub>`;
      const steps = [
        {
          kind: 'choice',
          prompt: `Koşul: “WH-${i} deposunun kapasitesinin (K<sub>${i}</sub> = ${K.toLocaleString('en-US')}) %${p}'inden fazlası kullanılırsa, WH-${j} açılamaz.” If-then kalıbında f ve g nedir?`,
          options: [
            { html: `f = ${sum} − ${thr.toLocaleString('en-US')}, &nbsp; g = −y<sub>${j}</sub>`, correct: true },
            { html: `f = ${sum} − ${thr.toLocaleString('en-US')}, &nbsp; g = y<sub>${j}</sub>`, correct: false },
            { html: `f = ${thr.toLocaleString('en-US')} − (${sum}), &nbsp; g = −y<sub>${j}</sub>`, correct: false },
            { html: `f = −y<sub>${j}</sub>, &nbsp; g = ${sum} − ${thr.toLocaleString('en-US')}`, correct: false },
          ],
          explain: `“f > 0 ise g ≥ 0”: f > 0 ⇔ kullanılan miktar > ${p}%·K = ${thr.toLocaleString('en-US')}. Sonuç y<sub>${j}</sub> = 0 ⇔ y<sub>${j}</sub> ≤ 0 ⇔ −y<sub>${j}</sub> ≥ 0, yani g = −y<sub>${j}</sub>.`,
        },
        {
          kind: 'choice',
          prompt: 'Modele eklenecek kısıt çifti hangisi? (y ∈ {0,1} yeni değişken)',
          options: [
            { html: `y<sub>${j}</sub> ≤ M<sub>1</sub>y &nbsp;ve&nbsp; ${sum} − ${thr.toLocaleString('en-US')} ≤ M<sub>2</sub>(1 − y)`, correct: true },
            { html: `−y<sub>${j}</sub> ≤ M<sub>1</sub>y &nbsp;ve&nbsp; ${sum} − ${thr.toLocaleString('en-US')} ≤ M<sub>2</sub>y`, correct: false },
            { html: `y<sub>${j}</sub> ≤ M<sub>1</sub>(1 − y) &nbsp;ve&nbsp; ${sum} − ${thr.toLocaleString('en-US')} ≤ M<sub>2</sub>(1 − y)`, correct: false },
            { html: `y<sub>${j}</sub> ≥ M<sub>1</sub>y &nbsp;ve&nbsp; ${sum} − ${thr.toLocaleString('en-US')} ≥ M<sub>2</sub>(1 − y)`, correct: false },
          ],
          explain: `Kalıp: −g ≤ My ve f ≤ M(1 − y). −g = y<sub>${j}</sub>. f > 0 ise ikinci kısıt ancak y = 0 ile sağlanır; o zaman ilk kısıt y<sub>${j}</sub> ≤ 0 → WH-${j} kapalı. f ≤ 0 iken y = 1 seçilebilir ve y<sub>${j}</sub> serbest kalır.`,
        },
        {
          kind: 'number',
          prompt: `En küçük geçerli M<sub>1</sub> (y<sub>${j}</sub> ≤ M<sub>1</sub>y için) ve M<sub>2</sub> (f ≤ M<sub>2</sub>(1−y) için) nedir? (WH-${i} deposundan en fazla kapasite kadar gönderilebilir.)`,
          fields: [{ label: 'M<sub>1</sub>', answer: 1, tol: 0 }, { label: 'M<sub>2</sub>', answer: K - thr, tol: 0 }],
          explain: `−g = y<sub>${j}</sub> en fazla 1 → M<sub>1</sub> = 1. f'nin en büyük değeri: K − ${thr.toLocaleString('en-US')} = ${K.toLocaleString('en-US')} − ${thr.toLocaleString('en-US')} = <b>${(K - thr).toLocaleString('en-US')}</b>. (Notlarda K<sub>2</sub> = 60,000, %40 → 24,000, M = 1 ve 36,000.)`,
        },
        {
          kind: 'choice',
          prompt: `WH-${i} deposundan toplam ${Math.round(thr * 0.8).toLocaleString('en-US')} birim gönderildi (eşiğin altında). Ne olur?`,
          options: [
            { html: `y = 1 seçilebilir, böylece y<sub>${j}</sub> serbest kalır (WH-${j} açılabilir)`, correct: true },
            { html: `y<sub>${j}</sub> = 0 olmak zorunda`, correct: false },
            { html: `y = 0 olmak zorunda`, correct: false },
            { html: 'Model infeasible olur', correct: false },
          ],
          explain: `f = ${Math.round(thr * 0.8).toLocaleString('en-US')} − ${thr.toLocaleString('en-US')} < 0 olduğundan f ≤ M<sub>2</sub>(1−y) hem y=0 hem y=1 için sağlanır. y = 1 alınırsa y<sub>${j}</sub> ≤ 1 → kısıtlama yok. If-then sadece f > 0 durumunda devreye girer.`,
        },
      ];
      return {
        title: 'If-Then Constraints',
        statement: `<p>Genel kalıp: “f(x) > 0 ise g(x) ≥ 0” için <b>−g ≤ My</b> ve <b>f ≤ M(1 − y)</b>, y ∈ {0,1}; M, f &lt; M ve −g &lt; M olacak kadar büyük.</p><p>Warehouse problemi: x<sub>ij</sub> = WH-i deposundan müşteri j'ye gönderilen miktar, y<sub>i</sub> = 1 ise WH-i açık.</p>`,
        steps,
      };
    },
  });

  // ------------------------------------------------------------------ 1.6 set covering
  OR.registerDrill({
    id: 'set-cover',
    topic: '1.6',
    title: 'Set covering · itfaiye istasyonu',
    description: 'Rastgele bir şehir komşuluk haritası: covering kısıtlarını yaz, bir yerleşimin uygun olup olmadığını kontrol et, en az istasyon sayısını bul.',
    generate(rng) {
      const n = rng.int(6, 8);
      let adj;
      for (let t = 0; t < 300; t++) {
        adj = OR.util.range(n).map(() => new Set());
        // ring-ish planar map + random chords
        for (let i = 0; i < n; i++) {
          if (rng.chance(0.85)) { adj[i].add((i + 1) % n); adj[(i + 1) % n].add(i); }
        }
        for (let e = 0; e < Math.floor(n / 2); e++) {
          const a = rng.int(0, n - 1), b = rng.int(0, n - 1);
          if (a !== b && Math.abs(a - b) !== 1) { adj[a].add(b); adj[b].add(a); }
        }
        if (adj.every((s) => s.size >= 1 && s.size <= 4)) break;
      }
      const cover = (i) => [i].concat([...adj[i]]).sort((a, b) => a - b);
      // min cover by brute force
      let best = null;
      const sets = [];
      for (let m = 1; m < 1 << n; m++) {
        const S = OR.util.range(n).filter((i) => (m >> i) & 1);
        const ok = OR.util.range(n).every((c) => cover(c).some((j) => S.includes(j)));
        if (ok) {
          sets.push(S);
          if (!best || S.length < best.length) best = S;
        }
      }
      const minK = best.length;
      const nMin = sets.filter((S) => S.length === minK).length;
      const xs = (arr) => arr.map((j) => `x<sub>${j + 1}</sub>`).join(' + ');
      const tbl = `<table class="mtx"><tr><th>Şehir</th><th>Komşuları</th></tr>${OR.util.range(n)
        .map((i) => `<tr><th>${i + 1}</th><td>${[...adj[i]].sort((a, b) => a - b).map((x) => x + 1).join(', ')}</td></tr>`)
        .join('')}</table>`;
      const steps = [];
      const picks = rng.shuffle(OR.util.range(n)).slice(0, 2);
      picks.forEach((c) => {
        const right = cover(c);
        const nb = [...adj[c]].sort((a, b) => a - b);
        const opts = [
          { html: `${xs(right)} ≥ 1`, correct: true },
          { html: `${xs(nb)} ≥ 1`, correct: false },
          { html: `${xs(right)} = 1`, correct: false },
          { html: `${xs(right)} ≤ 1`, correct: false },
        ];
        steps.push({
          kind: 'choice',
          prompt: `Şehir ${c + 1} için covering kısıtı hangisi? (x<sub>j</sub> = 1 ise şehir j'ye istasyon kurulur; istasyon kendi şehrine ve komşu şehirlere hizmet verir.)`,
          options: opts,
          explain: `Şehir ${c + 1}'e hizmet verebilecek istasyonlar: kendisi ve komşuları {${right.map((x) => x + 1).join(', ')}}. En az biri olmalı → set covering (≥ 1). Kendi şehrini unutmak ya da “= 1” (partitioning) yazmak tipik hatadır.`,
        });
      });
      // feasibility check of a candidate placement
      let cand, candOk;
      for (let t = 0; t < 100; t++) {
        cand = rng.shuffle(OR.util.range(n)).slice(0, minK + rng.int(0, 1)).sort((a, b) => a - b);
        candOk = OR.util.range(n).every((c) => cover(c).some((j) => cand.includes(j)));
        if (t > 3 || rng.chance(0.5) === candOk) break;
      }
      const uncovered = OR.util.range(n).filter((c) => !cover(c).some((j) => cand.includes(j)));
      steps.push({
        kind: 'choice',
        prompt: `İstasyonlar {${cand.map((x) => x + 1).join(', ')}} şehirlerine kurulursa tüm kısıtlar sağlanır mı?`,
        options: [
          { html: 'Evet, her şehir en az bir istasyon tarafından karşılanıyor', correct: candOk },
          { html: 'Hayır, karşılanmayan şehir(ler) var', correct: !candOk },
        ],
        keepOrder: true,
        explain: candOk ? 'Her şehrin covering kısıtında en az bir x<sub>j</sub> = 1.' : `Karşılanmayan şehir(ler): ${uncovered.map((x) => x + 1).join(', ')} — kısıtlarında hiçbir x<sub>j</sub> 1 değil.`,
      });
      steps.push({
        kind: 'number',
        prompt: 'min ∑x<sub>j</sub> modelinin optimal değeri (gereken en az istasyon sayısı) kaçtır?',
        fields: [{ label: 'z*', answer: minK, tol: 0 }],
        hint: 'Komşu sayısı fazla olan şehirlerden başla; k istasyonla tüm şehirleri kapatabiliyor musun?',
        explain: `En az <b>${minK}</b> istasyon gerekir; örneğin {${best.map((x) => x + 1).join(', ')}}${nMin > 1 ? ` (${nMin} farklı optimal yerleşim var)` : ''}. ${minK - 1} istasyonla her şehri kapatmak mümkün değil (tüm kombinasyonlar denenerek doğrulandı).`,
      });
      steps.push({
        kind: 'choice',
        prompt: 'Her şehre <b>tam olarak bir</b> istasyonun hizmet etmesi istenseydi kısıtlar hangi türden olurdu?',
        options: [
          { html: 'Set partitioning (∑ = 1)', correct: true },
          { html: 'Set covering (∑ ≥ 1)', correct: false },
          { html: 'Set packing (∑ ≤ 1)', correct: false },
          { html: 'Knapsack', correct: false },
        ],
        explain: 'Covering: en az bir (≥ 1) · Packing: en fazla bir (≤ 1) · Partitioning: tam olarak bir (= 1).',
      });
      return {
        title: 'Set Covering · Fire station',
        statement: `<p>Bir ilçede ${n} şehir var. Bir istasyon kendi şehrine ve sınır komşusu olan şehirlere hizmet verir. Amaç: en az istasyonla her şehre hizmet (min ∑x<sub>j</sub>).</p>${tbl}`,
        steps,
      };
    },
  });

  // ------------------------------------------------------------------ 1.8 piecewise linear
  OR.registerDrill({
    id: 'pw-weights',
    topic: '1.8',
    title: 'Piecewise linear · z/y formülasyonu',
    description: 'Euing Gas tipi parçalı doğrusal maliyet: aktif segment (y<sub>i</sub>), z ağırlıkları, c(x) değeri; ayrıca Dorian tipi basit formülasyonun ne zaman geçerli olduğu.',
    generate(rng) {
      const step = rng.pick([100, 200, 250, 500]);
      const nb = 4;
      const bps = OR.util.range(nb).map((i) => i * step);
      const slopes = OR.util.range(nb - 1).map(() => rng.int(5, 30));
      const cAt = [0];
      for (let i = 1; i < nb; i++) cAt.push(cAt[i - 1] + slopes[i - 1] * step);
      let x, seg;
      for (let t = 0; t < 50; t++) {
        seg = rng.int(0, nb - 2);
        x = bps[seg] + rng.int(1, 9) * (step / 10);
        if (x > bps[seg] && x < bps[seg + 1]) break;
      }
      const w2 = F(x - bps[seg]).div(step);
      const w1 = F(1).sub(w2);
      const cx = F(cAt[seg]).mul(w1).add(F(cAt[seg + 1]).mul(w2));
      const zName = (i) => `z<sub>${i + 1}</sub>`;
      const yName = (i) => `y<sub>${i + 1}</sub>`;
      const steps = [];
      steps.push({
        kind: 'number',
        prompt: `Break point'lerdeki maliyet değerlerini hesapla: c(${bps[1]}), c(${bps[2]}), c(${bps[3]}).`,
        fields: [1, 2, 3].map((i) => ({ label: `c(${bps[i]})`, answer: cAt[i], tol: 0 })),
        explain: `Kümülatif: c(${bps[1]}) = ${slopes[0]}·${step} = ${cAt[1]}; c(${bps[2]}) = ${cAt[1]} + ${slopes[1]}·${step} = ${cAt[2]}; c(${bps[3]}) = ${cAt[2]} + ${slopes[2]}·${step} = ${cAt[3]}.`,
      });
      steps.push({
        kind: 'choice',
        prompt: `x = ${x} için hangi y değişkeni 1 olur?`,
        options: OR.util.range(nb - 1).map((i) => ({ html: `${yName(i)} = 1 (${bps[i]} ≤ x ≤ ${bps[i + 1]})`, correct: i === seg })),
        keepOrder: true,
        explain: `${bps[seg]} ≤ ${x} ≤ ${bps[seg + 1]} → ${yName(seg)} = 1. O zaman sadece ${zName(seg)} ve ${zName(seg + 1)} pozitif olabilir (diğer z'ler z<sub>i</sub> ≤ y<sub>i−1</sub> + y<sub>i</sub> kısıtlarıyla 0'a zorlanır).`,
      });
      steps.push({
        kind: 'number',
        prompt: `x = ${bps.map((b, i) => `${b}${zName(i)}`).join(' + ')} ve z'lerin toplamı 1. x = ${x} için ${zName(seg)} ve ${zName(seg + 1)} nedir?`,
        fields: [{ label: zName(seg), answer: w1 }, { label: zName(seg + 1), answer: w2 }],
        explain: `${bps[seg]}${zName(seg)} + ${bps[seg + 1]}${zName(seg + 1)} = ${x} ve ${zName(seg)} + ${zName(seg + 1)} = 1 → ${zName(seg + 1)} = (${x} − ${bps[seg]})/${step} = ${w2.show()}, ${zName(seg)} = ${w1.show()}. (Notlarda x = 800: z<sub>2</sub> = 2/5, z<sub>3</sub> = 3/5.)`,
      });
      steps.push({
        kind: 'number',
        prompt: `Modelde c(x) yerine ∑ z<sub>i</sub>c(b<sub>i</sub>) yazılır. x = ${x} için c(x) kaçtır?`,
        fields: [{ label: `c(${x})`, answer: cx }],
        explain: `c(x) = ${w1.show()}·${cAt[seg]} + ${w2.show()}·${cAt[seg + 1]} = <b>${cx.show()}</b> (= ${cAt[seg]} + ${slopes[seg]}·(${x} − ${bps[seg]}) ✓).`,
      });
      steps.push({
        kind: 'choice',
        prompt: `${nb} break point için doğru z–y kısıt kümesi hangisi?`,
        options: [
          { html: 'z<sub>1</sub> ≤ y<sub>1</sub>, z<sub>2</sub> ≤ y<sub>1</sub> + y<sub>2</sub>, z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub>, z<sub>4</sub> ≤ y<sub>3</sub>; y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> = 1; ∑z<sub>i</sub> = 1', correct: true },
          { html: 'z<sub>1</sub> ≤ y<sub>1</sub>, z<sub>2</sub> ≤ y<sub>2</sub>, z<sub>3</sub> ≤ y<sub>3</sub>, z<sub>4</sub> ≤ y<sub>4</sub>; ∑y<sub>i</sub> = 1; ∑z<sub>i</sub> = 1', correct: false },
          { html: 'z<sub>1</sub> ≤ y<sub>1</sub>, z<sub>2</sub> ≤ y<sub>1</sub> + y<sub>2</sub>, z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub>, z<sub>4</sub> ≤ y<sub>3</sub>; y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> ≥ 1; ∑z<sub>i</sub> = 1', correct: false },
          { html: 'z<sub>1</sub> ≤ y<sub>1</sub>, z<sub>2</sub> ≤ y<sub>1</sub> + y<sub>2</sub>, z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub>, z<sub>4</sub> ≤ y<sub>3</sub>; y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> = 1; ∑z<sub>i</sub> ≤ 1', correct: false },
        ],
        explain: 'n break point → n−1 segment, n−1 tane y. Tam olarak bir segment seçilir (∑y = 1) ve sadece o segmentin iki ucundaki z\'ler pozitif olabilir; z\'ler konveks kombinasyon (∑z = 1). ∑y ≥ 1 iki segmenti birden açabilir → yanlış.',
      });
      // Dorian-style validity
      const dim = rng.chance(0.5);
      const rets = dim ? [rng.int(8, 12), rng.int(5, 7), rng.int(1, 4)] : rng.shuffle([rng.int(2, 4), rng.int(6, 8), rng.int(9, 12)]);
      const isDecreasing = rets[0] > rets[1] && rets[1] > rets[2];
      steps.push({
        kind: 'choice',
        prompt: `Bir dergide reklam başına exposure (bin): ilk 5 reklam ${rets[0]}, sonraki 5 reklam ${rets[1]}, sonraki 5 reklam ${rets[2]}. Max problemi için Dorian Auto'daki basit formülasyon (x<sub>1</sub> ≤ 5, x<sub>2</sub> ≤ 5, x<sub>3</sub> ≤ 5, amaç ${rets[0]}x<sub>1</sub> + ${rets[1]}x<sub>2</sub> + ${rets[2]}x<sub>3</sub>) doğru sonuç verir mi?`,
        options: [
          { html: 'Evet — getiri azalan (diminishing returns), maksimizasyon segmentleri sırayla doldurur', correct: isDecreasing },
          { html: 'Hayır — getiri azalan değil; model daha değerli segmenti öncekiler dolmadan kullanabilir, Euing Gas (z/y) yöntemi gerekir', correct: !isDecreasing },
        ],
        keepOrder: true,
        explain: isDecreasing
          ? 'Eğimler giderek kötüleşiyor (max problemi için azalan getiri). x<sub>2</sub> ancak x<sub>1</sub> maksimumdayken pozitif olur çünkü x<sub>1</sub> daha karlı — model kendiliğinden doğru sırayı izler.'
          : `Eğimler azalan değil (${rets.join(', ')}). Model daha yüksek getirili sonraki segmenti, önceki segment dolmadan seçebilir (Modified Dorian örneğindeki gibi “which cannot be correct”). Bu durumda 0-1 değişkenli Euing Gas formülasyonu kullanılmalı.`,
      });
      return {
        title: 'Piecewise Linear Function',
        statement: `<p>Ek hammadde satın alma maliyeti c(x) parçalı doğrusal: ilk ${step} birim birim başına ${slopes[0]}, sonraki ${step} birim ${slopes[1]}, sonraki ${step} birim ${slopes[2]} (break point'ler: ${bps.join(', ')}).</p>
          <div class="model">c(x) = z₁c(b₁) + z₂c(b₂) + z₃c(b₃) + z₄c(b₄)
x = z₁b₁ + z₂b₂ + z₃b₃ + z₄b₄
+ z–y bağlantı kısıtları,  yᵢ ∈ {0,1},  zᵢ ≥ 0</div>`,
        steps,
      };
    },
  });
})();
