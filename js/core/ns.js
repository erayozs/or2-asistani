/* Global namespace + topic metadata + registries.
   Loaded FIRST. All other scripts attach to window.OR. Classic scripts (no ES modules) so
   index.html works when opened directly from disk (file://). */
(function () {
  const OR = (window.OR = window.OR || {});

  // ---- Topic list (full notes: Ch.1–6) ----
  // drills: ids of generated exercises shown on the topic page (registered by js/drills/*.js)
  OR.topics = [
    { id: '1.0', ch: 1, title: 'IP Temelleri (Pure / Mixed / Binary, LR)', page: '1', drills: [] },
    { id: '1.1', ch: 1, title: 'Budgeting Problems', page: '1–3', drills: ['logic-constraints'] },
    { id: '1.2', ch: 1, title: 'Knapsack Problems', page: '3', drills: [] },
    { id: '1.3', ch: 1, title: 'Fixed Charge Problems', page: '4–5', drills: ['fixed-charge-m'] },
    { id: '1.4', ch: 1, title: 'Either-Or Constraints', page: '6–7', drills: ['either-or-m'] },
    { id: '1.5', ch: 1, title: 'If-Then Constraints', page: '7–8', drills: ['if-then'] },
    { id: '1.6', ch: 1, title: 'Set Covering / Packing / Partitioning', page: '9–11', drills: ['set-cover'] },
    { id: '1.7', ch: 1, title: 'TSP Formülasyonu (MTZ)', page: '11–12', drills: [] },
    { id: '1.8', ch: 1, title: 'Piecewise Linear Functions', page: '12–20', drills: ['pw-weights'] },
    { id: '2.1', ch: 2, title: 'Categorization (Çözüm Yöntemleri)', page: '21–22', drills: [] },
    { id: '2.2', ch: 2, title: 'LP Relaxation', page: '22–23', drills: [] },
    { id: '2.3', ch: 2, title: 'Enumeration', page: '24', drills: [] },
    { id: '2.4', ch: 2, title: 'Branch & Bound Yöntemi (Kavramlar)', page: '25', drills: ['bnb-tree-read'] },
    { id: '2.5', ch: 2, title: 'B&B – Pure IP', page: '26–28', drills: ['bnb-pure'] },
    { id: '2.5.1', ch: 2, title: 'B&B – Mixed IP', page: '28–29', drills: ['bnb-mixed'] },
    { id: '2.5.2', ch: 2, title: 'B&B – Binary IP', page: '29–31', drills: ['bnb-binary'] },
    { id: '2.5.3', ch: 2, title: 'B&B – Knapsack', page: '31–33', drills: ['bnb-knapsack'] },
    { id: '2.6.1', ch: 2, title: 'Job Shop / Single Machine Scheduling', page: '33–34', drills: ['smsched-bnb'] },
    { id: '2.6.2', ch: 2, title: 'TSP – B&B (Assignment + Subtour)', page: '34–37', drills: ['tsp-bnb'] },
    { id: '2.7', ch: 2, title: 'TSP Heuristics (NNH, CIH)', page: '37–40', drills: ['tsp-nnh', 'tsp-cih'] },
    { id: '2.8', ch: 2, title: 'Implicit Enumeration', page: '40', drills: ['implicit-enum'] },
    { id: '2.9', ch: 2, title: 'Cutting Planes (Gomory Cut)', page: '40–45', drills: ['gomory-cut'] },
    { id: '2.10', ch: 2, title: 'Branch & Cut', page: '45', drills: [] },
    { id: '2.11', ch: 2, title: 'Branch & Price', page: '46', drills: [] },
    // ---- Ch.3 Goal Programming
    { id: '3.0', ch: 3, title: 'Goal Programming & Deviational Variables', page: '47–49', drills: ['gp-formulate'] },
    { id: '3.2.1', ch: 3, title: 'Preemptive GP – Graphical Solution', page: '50–52', drills: ['gp-graphical'] },
    { id: '3.2.2', ch: 3, title: 'Goal Programming Simplex', page: '52–54', drills: ['gp-simplex'] },
    // ---- Ch.4 Nonlinear Programming
    { id: '4.1', ch: 4, title: 'NLP – Graphical Analysis', page: '55–56', drills: [] },
    { id: '4.2', ch: 4, title: 'Formulating NLP (+ NLP on a PC)', page: '57–59, 79', drills: [] },
    { id: '4.3', ch: 4, title: 'Review of Differential Calculus', page: '60–61', drills: [] },
    { id: '4.4', ch: 4, title: 'Convexity, Concavity & Extreme Points', page: '61–67', drills: ['convexity'] },
    { id: '4.5', ch: 4, title: 'One-Variable NLP & Golden Section Search', page: '68–70', drills: ['nlp-1var', 'golden-section'] },
    { id: '4.6', ch: 4, title: 'Unconstrained NLP (Hessian, Gradient, Newton)', page: '71–74', drills: ['hessian-classify', 'gradient-search', 'newton-method'] },
    { id: '4.7.1', ch: 4, title: 'Lagrange Multipliers', page: '75–77', drills: ['lagrange'] },
    { id: '4.7.2', ch: 4, title: 'KKT Optimality Conditions', page: '77–79', drills: ['kkt'] },
    // ---- Ch.5 Interior Point
    { id: '5.0', ch: 5, title: 'Interior Point Methods', page: '80–82', drills: [] },
    // ---- Ch.6 Deterministic DP
    { id: '6.1', ch: 6, title: 'DP – Two Puzzles (Backward Induction)', page: '83–84', drills: [] },
    { id: '6.2', ch: 6, title: 'DP – Network (Shortest Path) Problem', page: '84–88', drills: ['dp-network'] },
    { id: '6.3', ch: 6, title: 'Characteristics of DP Applications', page: '88–89', drills: [] },
    { id: '6.4', ch: 6, title: 'DP – Inventory Problem', page: '89–94', drills: ['dp-inventory'] },
    { id: '6.5', ch: 6, title: 'DP – Resource Allocation', page: '94–99', drills: ['dp-resource'] },
    { id: '6.5.2', ch: 6, title: 'Knapsack Problems by DP', page: '99–102', drills: ['dp-knapsack'] },
    { id: '6.6', ch: 6, title: 'Equipment Replacement', page: '102–104', drills: ['dp-equipment'] },
    { id: '6.7', ch: 6, title: 'Formulating DP Recursions (Discounting, Nonadditive)', page: '104–113', drills: [] },
    { id: '6.8', ch: 6, title: 'Wagner-Whitin & Silver-Meal', page: '113–117', drills: ['wagner-whitin', 'silver-meal'] },
  ];
  OR.chapters = {
    1: 'Bölüm 1 · IP Formülasyonu',
    2: 'Bölüm 2 · IP Çözümü',
    3: 'Bölüm 3 · Goal Programming',
    4: 'Bölüm 4 · Nonlinear Programming',
    5: 'Bölüm 5 · Interior Point Methods',
    6: 'Bölüm 6 · Deterministic Dynamic Programming',
  };
  // short label shown in nav / crumbs ('1.0' -> '1', '3.0' -> '3', '5.0' -> '5')
  OR.topicLabel = (t) => (/^\d\.0$/.test(t.id) ? t.id[0] : t.id);
  OR.topicById = (id) => OR.topics.find((t) => t.id === id);

  // ---- Content registries (filled by js/content/*.js) ----
  // summaries[topicId] = html string
  // concepts[topicId]  = [{ q, options:[html], answer: idx | [idx...], explain }]
  OR.content = { summaries: {}, concepts: {} };

  // ---- Drill registry (filled by js/drills/*.js) ----
  // OR.registerDrill({ id, topic, title, description, options?:[...], generate(rng, opts) -> Exercise })
  OR.drills = {};
  OR.registerDrill = function (d) {
    if (!d || !d.id || typeof d.generate !== 'function') throw new Error('bad drill');
    OR.drills[d.id] = d;
  };

  // ---- small shared helpers ----
  OR.util = {
    esc(s) {
      return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    },
    // "x1" -> "x<sub>1</sub>"; v(0) -> x<sub>1</sub>
    v(i, name = 'x') {
      return `${name}<sub>${i + 1}</sub>`;
    },
    range(n) {
      return Array.from({ length: n }, (_, i) => i);
    },
    // Linear expression html: coefs [3, -2, 0, 1] -> "3x₁ − 2x₂ + x₄"
    linExpr(coefs, name = 'x') {
      const F = OR.F;
      let out = '';
      coefs.forEach((c, i) => {
        c = F(c);
        if (c.isZero()) return;
        const neg = c.lt(0);
        const abs = c.abs();
        const coefStr = abs.eq(1) ? '' : abs.toString();
        const term = `${coefStr}${name}<sub>${i + 1}</sub>`;
        if (out === '') out = (neg ? '−' : '') + term;
        else out += (neg ? ' − ' : ' + ') + term;
      });
      return out || '0';
    },
  };
})();
