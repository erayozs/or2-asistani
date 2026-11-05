/* Generic Branch & Bound tracer for MAX problems, following the lecture-note conventions.

   OR.bnb.run(P, opts) where
     P = { c, A, b, sense?, lo?, hi?, intVars:[indices], names?:[...] }
         variables with lo=0, hi=1 that are integer are treated as binary (branch x=0 / x=1)
     opts = {
       order: 'lifo' | 'jump',       // backtracking (LIFO) or jumptracking (best z)
       firstChild: 'up' | 'down',    // LIFO: which new child is solved first (notes: "arbitrary")
       branchRule: 'first' | 'mostfrac', // which fractional variable to branch on
       floorRule: false,             // fathom if floor(z) ≤ LB (valid when obj coefs & vars integer; notes use it in knapsack P1)
       maxNodes: 80
     }

   Child numbering follows the notes: general integer -> (≥ ceil) child is created first (Subp.2: x1≥4, Subp.3: x1≤3);
   binary -> x=0 child first (P1: x2=0, P2: x2=1).

   Returns { nodes, events, best, ambiguous, aborted, nSolved }
   node = { id, parent, depth, branch:{v,op,val}|null, lo, hi, lp, t, status, children, fracVars, branchVar,
            isInteger, lbAt, prunedLater, best }
   status ∈ 'branched' | 'active' | 'infeasible' | 'candidate' | 'superseded' | 'bound' | 'unsolved'
   events (chronological):
     {type:'solve', id, t}
     {type:'infeasible', id}
     {type:'fractional', id, fracVars}       // feasible, not fathomed, must be branched (now or later)
     {type:'candidate', id, z, lbOld, lbNew, superseded:[ids]}
     {type:'bound', id, z, lb, integer}
     {type:'branch', id, v, value, children:[ids]}
     {type:'select', id, rule, pool:[ids]}     // node chosen next (LIFO: to solve; jump: to branch)
     {type:'prune', id, z, lb}                 // jumptracking: waiting node fathomed after LB improved */
(function () {
  const OR = window.OR;
  const F = OR.F;

  function run(P, opts) {
    opts = Object.assign({ order: 'lifo', firstChild: 'up', branchRule: 'first', floorRule: false, maxNodes: 80 }, opts || {});
    const n = P.c.length;
    const lo0 = (P.lo || P.c.map(() => 0)).map(F);
    const hi0 = (P.hi || P.c.map(() => null)).map((h) => (h == null ? null : F(h)));
    const isBin = (v) => lo0[v].eq(0) && hi0[v] && hi0[v].eq(1);

    const nodes = [];
    const events = [];
    let t = 0;
    let LB = null;
    let bestId = null;
    let ambiguous = false;
    let aborted = false;

    const node = (id) => nodes[id - 1];
    const mk = (parent, branch, lo, hi) => {
      const nd = {
        id: nodes.length + 1,
        parent: parent ? parent.id : null,
        depth: parent ? parent.depth + 1 : 0,
        branch,
        lo,
        hi,
        lp: null,
        t: null,
        status: 'unsolved',
        children: [],
      };
      nodes.push(nd);
      if (parent) parent.children.push(nd.id);
      return nd;
    };
    const solve = (nd) => {
      nd.t = ++t;
      nd.lp = OR.lp.solve({ c: P.c, A: P.A, b: P.b, sense: P.sense, lo: nd.lo, hi: nd.hi });
      if (nd.lp.status === 'optimal' && nd.lp.alternative) ambiguous = true;
      events.push({ type: 'solve', id: nd.id, t: nd.t });
    };
    const cut = (z) => LB !== null && (opts.floorRule ? z.floor().le(LB) : z.le(LB));

    // returns 'branch' if node must be branched (fractional & promising), else 'done'
    const classify = (nd) => {
      nd.lbAt = LB;
      if (nd.lp.status !== 'optimal') {
        nd.status = 'infeasible';
        events.push({ type: 'infeasible', id: nd.id });
        return 'done';
      }
      const fv = P.intVars.filter((i) => !nd.lp.x[i].isInt());
      nd.fracVars = fv;
      nd.isInteger = fv.length === 0;
      if (cut(nd.lp.z)) {
        nd.status = 'bound';
        events.push({ type: 'bound', id: nd.id, z: nd.lp.z, lb: LB, integer: nd.isInteger });
        return 'done';
      }
      if (nd.isInteger) {
        const lbOld = LB;
        const sup = [];
        if (bestId) {
          node(bestId).status = 'superseded';
          sup.push(bestId);
        }
        LB = nd.lp.z;
        bestId = nd.id;
        nd.status = 'candidate';
        events.push({ type: 'candidate', id: nd.id, z: nd.lp.z, lbOld, lbNew: LB, superseded: sup });
        return 'done';
      }
      nd.status = 'active';
      events.push({ type: 'fractional', id: nd.id, fracVars: fv.slice() });
      return 'branch';
    };

    const pickVar = (nd) => {
      const fv = nd.fracVars;
      if (opts.branchRule === 'mostfrac') {
        let best = fv[0];
        let bd = 2;
        for (const v of fv) {
          const d = Math.abs(nd.lp.x[v].frac().toNumber() - 0.5);
          if (d < bd - 1e-12) { bd = d; best = v; }
        }
        return best;
      }
      return fv[0];
    };

    const branch = (nd) => {
      const v = pickVar(nd);
      const val = nd.lp.x[v];
      nd.branchVar = v;
      nd.status = 'branched';
      let up, down, created;
      if (isBin(v)) {
        const loD = nd.lo.slice(), hiD = nd.hi.slice();
        loD[v] = F(0); hiD[v] = F(0);
        const loU = nd.lo.slice(), hiU = nd.hi.slice();
        loU[v] = F(1); hiU[v] = F(1);
        down = mk(nd, { v, op: '=', val: F(0) }, loD, hiD);
        up = mk(nd, { v, op: '=', val: F(1) }, loU, hiU);
        created = [down, up];
      } else {
        const loU = nd.lo.slice(), hiU = nd.hi.slice();
        loU[v] = val.ceil();
        const loD = nd.lo.slice(), hiD = nd.hi.slice();
        hiD[v] = val.floor();
        up = mk(nd, { v, op: '>=', val: val.ceil() }, loU, hiU);
        down = mk(nd, { v, op: '<=', val: val.floor() }, loD, hiD);
        created = [up, down];
      }
      events.push({ type: 'branch', id: nd.id, v, value: val, children: created.map((c) => c.id) });
      return { up, down, created };
    };

    const root = mk(null, null, lo0, hi0);
    solve(root);

    if (opts.order === 'lifo') {
      const stack = [];
      const process = (nd) => {
        if (classify(nd) === 'branch') {
          const { up, down } = branch(nd);
          const first = opts.firstChild === 'up' ? up : down;
          const second = first === up ? down : up;
          stack.push(second, first);
        }
      };
      process(root);
      while (stack.length) {
        if (nodes.length > opts.maxNodes) { aborted = true; break; }
        const pool = stack.map((s) => s.id);
        const nd = stack.pop();
        events.push({ type: 'select', id: nd.id, rule: 'lifo', pool });
        solve(nd);
        process(nd);
      }
    } else {
      const active = [];
      if (classify(root) === 'branch') active.push(root);
      while (active.length) {
        if (nodes.length > opts.maxNodes) { aborted = true; break; }
        active.sort((a, b) => b.lp.z.cmp(a.lp.z) || a.id - b.id);
        const pool = active.map((a) => a.id);
        const nd = active.shift();
        events.push({ type: 'select', id: nd.id, rule: 'jump', pool });
        const { created } = branch(nd);
        created.forEach(solve);
        created.forEach((ch) => { if (classify(ch) === 'branch') active.push(ch); });
        for (const a of active.slice()) {
          if (cut(a.lp.z)) {
            a.status = 'bound';
            a.prunedLater = true;
            a.lbAt = LB;
            active.splice(active.indexOf(a), 1);
            events.push({ type: 'prune', id: a.id, z: a.lp.z, lb: LB });
          }
        }
      }
    }

    if (bestId) node(bestId).best = true;
    return {
      P,
      opts,
      nodes,
      events,
      best: bestId ? { id: bestId, x: node(bestId).lp.x, z: node(bestId).lp.z } : null,
      ambiguous,
      aborted,
      nSolved: t,
    };
  }

  // Human-readable constraint for a branch, e.g. "x<sub>1</sub> ≥ 4"
  function branchLabel(br, names) {
    if (!br) return '';
    const nm = names ? names[br.v] : `x<sub>${br.v + 1}</sub>`;
    const op = br.op === '>=' ? '≥' : br.op === '<=' ? '≤' : '=';
    return `${nm} ${op} ${br.val.toString()}`;
  }
  function branchText(br, names) {
    if (!br) return '';
    const nm = names ? names[br.v].replace(/<\/?sub>/g, '') : `x${br.v + 1}`;
    const op = br.op === '>=' ? '≥' : br.op === '<=' ? '≤' : '=';
    return `${nm} ${op} ${br.val.toString()}`;
  }

  /* Tree snapshot for OR.viz.tree after replaying events[0..k] (inclusive; k = Infinity -> final).
     o: { names, title:(nd)=>'Subp. 2', showT:true, showVars:[idx], final:bool (mark best ★) }
     Returns [{id,parent,title,edge,lines,status,t,highlight,best}] */
  function treeAt(trace, k, o) {
    o = o || {};
    const names = o.names;
    const title = o.title || ((nd) => `Subp. ${nd.id}`);
    const st = {};
    st[1] = { created: true, solved: false, status: 'pending' };
    let highlight = null;
    const last = Math.min(k == null ? Infinity : k, trace.events.length - 1);
    for (let i = 0; i <= last; i++) {
      const ev = trace.events[i];
      const s = st[ev.id] || (st[ev.id] = { created: true, solved: false, status: 'pending' });
      switch (ev.type) {
        case 'solve': s.solved = true; s.status = 'solved'; highlight = ev.id; break;
        case 'infeasible': s.status = 'infeasible'; break;
        case 'fractional': s.status = 'active'; break;
        case 'candidate':
          s.status = 'candidate';
          ev.superseded.forEach((id) => { st[id].status = 'superseded'; });
          break;
        case 'bound': case 'prune': s.status = 'bound'; break;
        case 'branch':
          s.status = 'branched';
          ev.children.forEach((c) => { st[c] = { created: true, solved: false, status: 'pending' }; });
          break;
        case 'select': highlight = ev.id; break;
      }
    }
    const isFinal = last >= trace.events.length - 1;
    const out = [];
    for (const nd of trace.nodes) {
      const s = st[nd.id];
      if (!s) continue;
      const lines = [];
      if (s.solved) {
        if (nd.lp.status !== 'optimal') lines.push('Infeasible');
        else {
          lines.push(`z = ${nd.lp.z.toString()}`);
          nd.lp.x.forEach((xi, i) => {
            if (o.showVars && !o.showVars.includes(i)) return;
            lines.push(`${names ? names[i].replace(/<\/?sub>/g, '') : 'x' + (i + 1)} = ${xi.toString()}`);
          });
        }
      }
      out.push({
        id: nd.id,
        parent: nd.parent,
        title: title(nd),
        edge: branchText(nd.branch, names),
        lines,
        status: s.status,
        t: s.solved && o.showT !== false ? nd.t : null,
        highlight: !isFinal && highlight === nd.id,
        best: (isFinal || o.final) && !!nd.best,
      });
    }
    return out;
  }

  // index of the first event matching pred (or -1)
  function evIndex(trace, pred) {
    return trace.events.findIndex(pred);
  }

  OR.bnb = { run, branchLabel, branchText, treeAt, evIndex };
})();
