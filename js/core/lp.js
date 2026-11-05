/* Exact LP solver for SMALL problems (n ≤ ~6) by vertex enumeration over rationals.
   max c·x  s.t.  A x (≤ | ≥ | =) b,  lo ≤ x ≤ hi  (hi null = +∞)
   Assumes the feasible region is bounded in the objective direction (true for all
   generated problems: nonnegative ≤-constraints with positive coefficients, or binary bounds).

   OR.lp.solve(P) -> { status:'optimal'|'infeasible', x:[Frac], z:Frac, alternative:bool, optima:[[Frac]] } */
(function () {
  const OR = window.OR;
  const F = OR.F;

  function combos(n, k, start = 0, acc = [], out = []) {
    if (acc.length === k) {
      out.push(acc.slice());
      return out;
    }
    for (let i = start; i <= n - (k - acc.length); i++) {
      acc.push(i);
      combos(n, k, i + 1, acc, out);
      acc.pop();
    }
    return out;
  }

  // Solve square system M y = r (Frac). Returns null if singular.
  function gauss(M, r) {
    const k = M.length;
    const a = M.map((row, i) => row.slice().concat([r[i]]));
    for (let col = 0; col < k; col++) {
      let piv = -1;
      for (let i = col; i < k; i++) if (!a[i][col].isZero()) { piv = i; break; }
      if (piv < 0) return null;
      if (piv !== col) [a[piv], a[col]] = [a[col], a[piv]];
      const p = a[col][col];
      for (let j = col; j <= k; j++) a[col][j] = a[col][j].div(p);
      for (let i = 0; i < k; i++) {
        if (i === col || a[i][col].isZero()) continue;
        const f = a[i][col];
        for (let j = col; j <= k; j++) a[i][j] = a[i][j].sub(f.mul(a[col][j]));
      }
    }
    return a.map((row) => row[k]);
  }

  function solve(P) {
    const n = P.c.length;
    const c = P.c.map(F);
    const A = (P.A || []).map((row) => row.map(F));
    const b = (P.b || []).map(F);
    const sense = P.sense || A.map(() => '<=');
    const lo = (P.lo || c.map(() => 0)).map(F);
    const hi = (P.hi || c.map(() => null)).map((h) => (h == null ? null : F(h)));

    // infeasible bounds
    for (let i = 0; i < n; i++) if (hi[i] && lo[i].gt(hi[i])) return { status: 'infeasible' };

    // substitute fixed variables
    const free = [];
    const fixedVal = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      if (hi[i] && lo[i].eq(hi[i])) fixedVal[i] = lo[i];
      else free.push(i);
    }
    let zConst = F(0);
    fixedVal.forEach((v, i) => { if (v) zConst = zConst.add(c[i].mul(v)); });

    // Build rows over free vars: ineq rows (a·y ≤ r) and eq rows (a·y = r)
    const ineq = [];
    const eqs = [];
    A.forEach((row, ri) => {
      let rhs = b[ri];
      fixedVal.forEach((v, i) => { if (v) rhs = rhs.sub(row[i].mul(v)); });
      const a = free.map((i) => row[i]);
      const s = sense[ri];
      if (s === '<=') ineq.push({ a, r: rhs });
      else if (s === '>=') ineq.push({ a: a.map((x) => x.neg()), r: rhs.neg() });
      else eqs.push({ a, r: rhs });
    });
    free.forEach((i, j) => {
      const e = free.map((_, jj) => F(jj === j ? 1 : 0));
      ineq.push({ a: e.map((x) => x.neg()), r: lo[i].neg() });
      if (hi[i]) ineq.push({ a: e, r: hi[i] });
    });

    const k = free.length;
    const feasible = (y) => {
      for (const row of ineq) {
        let s = F(0);
        for (let j = 0; j < k; j++) s = s.add(row.a[j].mul(y[j]));
        if (s.gt(row.r)) return false;
      }
      for (const row of eqs) {
        let s = F(0);
        for (let j = 0; j < k; j++) s = s.add(row.a[j].mul(y[j]));
        if (!s.eq(row.r)) return false;
      }
      return true;
    };

    const verts = [];
    const seen = new Set();
    if (k === 0) {
      if (feasible([])) verts.push([]);
    } else if (eqs.length <= k) {
      const need = k - eqs.length;
      for (const cmb of combos(ineq.length, need)) {
        const rows = eqs.concat(cmb.map((i) => ineq[i]));
        const y = gauss(rows.map((r) => r.a), rows.map((r) => r.r));
        if (!y) continue;
        const key = y.map((v) => v.key()).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        if (feasible(y)) verts.push(y);
      }
    }
    if (!verts.length) return { status: 'infeasible' };

    const full = (y) => {
      const x = new Array(n);
      for (let i = 0; i < n; i++) x[i] = fixedVal[i] || F(0);
      free.forEach((i, j) => { x[i] = y[j]; });
      return x;
    };
    const objective = (x) => x.reduce((s, xi, i) => s.add(c[i].mul(xi)), F(0));
    let best = null;
    let optima = [];
    for (const y of verts) {
      const x = full(y);
      const z = objective(x);
      if (!best || z.gt(best)) { best = z; optima = [x]; }
      else if (z.eq(best)) optima.push(x);
    }
    return { status: 'optimal', x: optima[0], z: best, alternative: optima.length > 1, optima };
  }

  OR.lp = { solve };
})();
