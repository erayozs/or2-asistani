/* 2.5 · B&B for a pure IP with 2 variables (like Winston 9.3 / notes Example 5).
   Reference implementation of a drill:
     - generate(rng, opts) must be deterministic for a given rng seed
     - retry random instances until all quality checks pass (unique LP optima, sensible tree size, small denominators)
     - build steps via OR.bnbSteps.build */
(function () {
  const OR = window.OR;
  const F = OR.F;

  // True if exactly one feasible point attains the optimal value zBest. For a pure IP (both vars integer) we scan the
  // integer grid; for a MIP (one integer var) we solve the LP in the continuous var for each integer value.
  function uniqueIntOpt(P, intVars, zBest) {
    const lim = 15;
    let count = 0;
    if (intVars.length === 2) {
      for (let a = 0; a <= lim; a++) for (let b = 0; b <= lim; b++) {
        if (P.A.every((r, i) => r[0] * a + r[1] * b <= P.b[i]) && F(P.c[0] * a + P.c[1] * b).eq(zBest)) count++;
      }
      return count === 1;
    }
    const iv = intVars[0];
    for (let k = 0; k <= lim; k++) {
      const lo = [0, 0], hi = [null, null];
      lo[iv] = k; hi[iv] = k;
      const r = OR.lp.solve({ c: P.c, A: P.A, b: P.b, lo, hi });
      if (r.status === 'optimal') {
        if (r.z.eq(zBest)) count += r.alternative ? 2 : 1;
      }
    }
    return count === 1;
  }

  // Shared 2-variable instance generator (also used by the mixed-IP drill).
  // Returns {P, trace} or null.
  function gen2(rng, opts, intVars, check) {
    for (let tries = 0; tries < 600; tries++) {
      const c = [rng.int(2, 9), rng.int(2, 9)];
      // constraint 1: "capacity" style, constraint 2: steeper
      const a1 = [rng.int(1, 4), rng.int(1, 4)];
      const a2 = [rng.int(3, 9), rng.int(2, 7)];
      if (rng.chance(0.5)) a2.reverse();
      const b1 = rng.int(4, 9) * Math.max(1, Math.min(a1[0], a1[1]));
      const b2 = rng.int(15, 60);
      const A = [a1, a2], b = [b1, b2];
      // intercepts must be within plot range
      const ints = [b1 / a1[0], b1 / a1[1], b2 / a2[0], b2 / a2[1]];
      if (Math.max(...ints) > 11 || Math.min(...ints) < 2) continue;
      const P = { c, A, b, intVars };
      const root = OR.lp.solve(P);
      if (root.status !== 'optimal' || root.alternative) continue;
      const x = root.x;
      if (intVars.every((i) => x[i].isInt())) continue;
      if (x.some((v) => v.isZero())) continue; // want an interior "corner" optimum
      if (x.some((v) => v.d > 12n)) continue;
      const trace = OR.bnb.run(P, { order: opts.order, firstChild: opts.firstChild });
      if (trace.ambiguous || trace.aborted || !trace.best) continue;
      if (trace.nodes.some((nd) => nd.lp && nd.lp.status === 'optimal' && (nd.lp.x.some((v) => v.d > 20n) || nd.lp.z.d > 40n))) continue;
      if (!check(trace, P)) continue;
      if (!uniqueIntOpt(P, intVars, trace.best.z)) continue;
      return { P, trace };
    }
    return null;
  }

  function plotFor(P) {
    const xmax = Math.ceil(Math.max(...P.A.map((r, i) => (r[0] > 0 ? P.b[i] / r[0] : 0)))) + 1;
    const ymax = Math.ceil(Math.max(...P.A.map((r, i) => (r[1] > 0 ? P.b[i] / r[1] : 0)))) + 1;
    return (nd, solved) => ({
      type: 'plot',
      caption: `Subp. ${nd.id} uygun bölgesi`,
      A: P.A,
      b: P.b,
      lo: nd.lo,
      hi: nd.hi,
      c: P.c,
      point: solved && nd.lp && nd.lp.status === 'optimal' ? nd.lp.x : null,
      xmax: Math.min(xmax, 12),
      ymax: Math.min(ymax, 12),
    });
  }

  const OPTIONS = [
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

  function conventions(opts) {
    return `<ul class="conv">
      <li>Dallanma değişkeni: kesirli olanlar içinden <b>indisi en küçük</b> olan.</li>
      <li>Alt problemler oluşturulma sırasıyla numaralanır: önce <b>≥</b> dalı, sonra <b>≤</b> dalı (notlardaki gibi: Subp.2: x<sub>1</sub> ≥ 4, Subp.3: x<sub>1</sub> ≤ 3).</li>
      <li>${opts.order === 'lifo'
        ? `<b>LIFO (backtracking)</b>: en son oluşturulan çözülmemiş alt problem çözülür; dallanmadan sonra önce <b>${opts.firstChild === 'down' ? '≤' : '≥'}</b> dalı.`
        : '<b>Jumptracking</b>: dallanınca iki alt problem de hemen çözülür; sonra aktif düğümlerden en iyi z\'li olanda dallanılır.'}</li>
      <li>Fathom: infeasible · tamsayı çözüm (candidate) · z ≤ LB.</li>
    </ul>`;
  }

  OR.registerDrill({
    id: 'bnb-pure',
    topic: '2.5',
    title: 'B&B · Pure IP (2 değişken, grafikli)',
    description: 'Rastgele 2 değişkenli pure IP. Her alt problemi (grafik/köşe noktası ile) çöz, dallanma ve fathom kararlarını ver, LB\'yi takip et.',
    options: OPTIONS,
    gen2,
    plotFor,
    uniqueIntOpt,
    conventions,
    generate(rng, opts) {
      const res = gen2(rng, opts, [0, 1], (tr) => {
        const solved = tr.nSolved;
        const kinds = new Set(tr.events.map((e) => e.type));
        return solved >= 5 && solved <= 9 && (kinds.has('bound') || kinds.has('infeasible')) && tr.best.z.lt(tr.nodes[0].lp.z.floor().add(1));
      });
      if (!res) throw new Error('uygun problem bulunamadı');
      const { P, trace } = res;
      const steps = OR.bnbSteps.build(trace, {
        askLP: opts.askLP,
        plot: plotFor(P),
      });
      return {
        title: 'Branch & Bound · Pure IP',
        statement: `<p>Aşağıdaki IP'yi Branch &amp; Bound ile çöz:</p>
          ${OR.bnbSteps.modelHtml(P, { tail: 'x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer' })}
          <p><b>Kurallar:</b></p>${conventions(opts)}
          <p class="muted">Sayıları kesir (15/4) veya ondalık (3.75) olarak girebilirsin.</p>`,
        viz: [{ type: 'tree', caption: 'B&B ağacı', nodes: [] }, plotFor(P)(trace.nodes[0], false)],
        steps,
        solution: `<b>Optimal:</b> z* = ${trace.best.z.show()}, x<sub>1</sub> = ${trace.best.x[0]}, x<sub>2</sub> = ${trace.best.x[1]} · ${trace.nSolved} LP çözüldü.`,
      };
    },
  });
})();
