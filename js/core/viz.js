/* Visualizations. Every renderer returns an HTML string.
   A "viz spec" is an object or an array of objects:
     { type:'tree',   nodes:[{id,parent,title,edge,lines:[],status,t,highlight,best}], caption? , lb? }
     { type:'plot',   A, b, sense?, lo, hi, c, point:[x1,x2]|null, xmax?, ymax?, names?, caption?,
                      origA?, origB?   // original LR (drawn lightly) if different from current A,b }
     { type:'matrix', rowLabels, colLabels, cells:[[html]], cls?:[[cssClass]], caption? }
     { type:'html',   html }
   OR.viz.render(spec) -> html string */
(function () {
  const OR = window.OR;
  const esc = (s) => OR.util.esc(s);

  // ------------------------------------------------------------------ tree
  const STATUS = {
    pending: { cls: 'st-pending', label: 'çözülmedi' },
    solved: { cls: 'st-solved', label: '' },
    active: { cls: 'st-active', label: 'dallanacak' },
    branched: { cls: 'st-branched', label: '' },
    candidate: { cls: 'st-candidate', label: 'Candidate' },
    superseded: { cls: 'st-superseded', label: 'Candidate (geçildi) ✕' },
    bound: { cls: 'st-bound', label: 'Fathomed: z ≤ LB ✕' },
    infeasible: { cls: 'st-infeasible', label: 'Infeasible ✕' },
  };

  function tree(spec) {
    const nodes = spec.nodes || [];
    if (!nodes.length) return '';
    const byId = {};
    nodes.forEach((n) => (byId[n.id] = Object.assign({ kids: [] }, n)));
    let root = null;
    nodes.forEach((n) => {
      if (n.parent != null && byId[n.parent]) byId[n.parent].kids.push(byId[n.id]);
      else if (!root) root = byId[n.id];
    });
    Object.values(byId).forEach((n) => n.kids.sort((a, b) => a.id - b.id));

    const W = spec.nodeWidth || 112;
    const GAP = 14;
    const LH = 14;
    const maxLines = Math.max(1, ...nodes.map((n) => (n.lines ? n.lines.length : 0)));
    const H = 20 + LH * maxLines + 16;
    const VGAP = 46;
    let slot = 0;
    let maxDepth = 0;
    const place = (n, d) => {
      n.depth = d;
      maxDepth = Math.max(maxDepth, d);
      if (!n.kids.length) {
        n.x = slot++ * (W + GAP);
      } else {
        n.kids.forEach((k) => place(k, d + 1));
        n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
      }
      n.y = d * (H + VGAP);
    };
    place(root, 0);
    const padL = 34, padT = 8;
    const width = slot * (W + GAP) - GAP + padL + 10;
    const height = (maxDepth + 1) * (H + VGAP) - VGAP + padT + 10;
    let svg = `<svg class="bbtree" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    // edges
    Object.values(byId).forEach((n) => {
      n.kids.forEach((k) => {
        const x1 = padL + n.x + W / 2, y1 = padT + n.y + H;
        const x2 = padL + k.x + W / 2, y2 = padT + k.y;
        svg += `<line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        if (k.edge) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const anchor = x2 < x1 ? 'end' : x2 > x1 ? 'start' : 'middle';
          const dx = x2 < x1 ? -5 : x2 > x1 ? 5 : 0;
          svg += `<text class="elabel" x="${mx + dx}" y="${my + 4}" text-anchor="${anchor}">${esc(k.edge)}</text>`;
        }
      });
    });
    // nodes
    Object.values(byId).forEach((n) => {
      const st = STATUS[n.status] || STATUS.solved;
      const x = padL + n.x, y = padT + n.y;
      const cls = `node ${st.cls}${n.highlight ? ' hl' : ''}${n.best ? ' best' : ''}`;
      svg += `<g class="${cls}"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="7"/>`;
      svg += `<text class="ntitle" x="${x + W / 2}" y="${y + 15}" text-anchor="middle">${esc(n.title || '')}${n.best ? ' ★' : ''}</text>`;
      (n.lines || []).forEach((ln, i) => {
        svg += `<text class="nline" x="${x + W / 2}" y="${y + 30 + i * LH}" text-anchor="middle">${esc(ln)}</text>`;
      });
      const label = n.best ? 'OPTIMAL ★' : st.label;
      if (label) svg += `<text class="nstatus" x="${x + W / 2}" y="${y + H - 6}" text-anchor="middle">${esc(label)}</text>`;
      if (n.t != null) svg += `<text class="nt" x="${x - 4}" y="${y + 14}" text-anchor="end">t=${n.t}</text>`;
      svg += `</g>`;
    });
    svg += `</svg>`;
    const cap = spec.caption ? `<div class="viz-cap">${spec.caption}</div>` : '';
    const lb = spec.lb !== undefined ? `<div class="viz-lb">LB = ${spec.lb === null ? '—' : esc(String(spec.lb))}</div>` : '';
    return `<div class="viz viz-tree">${cap}${lb}<div class="tree-scroll">${svg}</div></div>`;
  }

  // ------------------------------------------------------------------ 2-var LP plot
  const num = (v) => (v == null ? null : typeof v === 'number' ? v : OR.F(v).toNumber());

  function clip(poly, a, b) {
    // keep a·p ≤ b
    const out = [];
    const f = (p) => a[0] * p[0] + a[1] * p[1] - b;
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length];
      const fp = f(P), fq = f(Q);
      if (fp <= 1e-9) out.push(P);
      if ((fp < -1e-9 && fq > 1e-9) || (fp > 1e-9 && fq < -1e-9)) {
        const tt = fp / (fp - fq);
        out.push([P[0] + tt * (Q[0] - P[0]), P[1] + tt * (Q[1] - P[1])]);
      }
    }
    return out;
  }
  function region(A, b, sense, lo, hi, big) {
    let poly = [[-1, -1], [big, -1], [big, big], [-1, big]];
    const add = (a, bb) => { poly = clip(poly, a, bb); };
    A.forEach((row, i) => {
      const a = row.map(num), bb = num(b[i]);
      const s = (sense && sense[i]) || '<=';
      if (s === '<=' || s === '=') add(a, bb);
      if (s === '>=' || s === '=') add([-a[0], -a[1]], -bb);
    });
    for (let j = 0; j < 2; j++) {
      const e = j === 0 ? [1, 0] : [0, 1];
      add([-e[0], -e[1]], -num(lo ? lo[j] : 0));
      if (hi && hi[j] != null) add(e, num(hi[j]));
    }
    return poly;
  }

  function plot(spec) {
    const A = spec.A, b = spec.b;
    const names = spec.names || ['x₁', 'x₂'];
    // axis range
    let xmax = spec.xmax, ymax = spec.ymax;
    if (!xmax || !ymax) {
      let mx = 1, my = 1;
      A.forEach((row, i) => {
        const a = row.map(num), bb = num(b[i]);
        if (a[0] > 0 && bb > 0) mx = Math.max(mx, Math.min(bb / a[0], 40));
        if (a[1] > 0 && bb > 0) my = Math.max(my, Math.min(bb / a[1], 40));
      });
      xmax = xmax || Math.ceil(mx) + 1;
      ymax = ymax || Math.ceil(my) + 1;
    }
    const S = 300, pad = 30;
    const sx = (S - pad - 8) / xmax, sy = (S - pad - 8) / ymax;
    const X = (x) => pad + x * sx, Y = (y) => S - pad - y * sy;
    const big = Math.max(xmax, ymax) * 3 + 10;
    let svg = `<svg class="lpplot" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><clipPath id="pc"><rect x="${pad}" y="8" width="${S - pad - 8}" height="${S - pad - 8}"/></clipPath></defs>`;
    // grid
    for (let i = 0; i <= xmax; i++) svg += `<line class="grid" x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(ymax)}"/><text class="tick" x="${X(i)}" y="${Y(0) + 13}" text-anchor="middle">${i}</text>`;
    for (let j = 0; j <= ymax; j++) svg += `<line class="grid" x1="${X(0)}" y1="${Y(j)}" x2="${X(xmax)}" y2="${Y(j)}"/><text class="tick" x="${X(0) - 5}" y="${Y(j) + 4}" text-anchor="end">${j}</text>`;
    svg += `<g clip-path="url(#pc)">`;
    // original LR region (light)
    const oA = spec.origA || A, oB = spec.origB || b;
    const orig = region(oA, oB, spec.origSense || spec.sense, null, null, big);
    if (orig.length) svg += `<polygon class="reg-orig" points="${orig.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>`;
    // current subproblem region
    const cur = region(A, b, spec.sense, spec.lo, spec.hi, big);
    if (cur.length) svg += `<polygon class="reg-cur" points="${cur.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>`;
    // constraint lines
    A.forEach((row, i) => {
      const a = row.map(num), bb = num(b[i]);
      let p1, p2;
      if (Math.abs(a[1]) > 1e-12) { p1 = [-1, (bb + a[0]) / a[1]]; p2 = [big, (bb - a[0] * big) / a[1]]; }
      else { p1 = [bb / a[0], -1]; p2 = [bb / a[0], big]; }
      svg += `<line class="cline" x1="${X(p1[0])}" y1="${Y(p1[1])}" x2="${X(p2[0])}" y2="${Y(p2[1])}"/>`;
    });
    // branching bounds (dashed)
    for (let j = 0; j < 2; j++) {
      const l = spec.lo ? num(spec.lo[j]) : 0;
      const h = spec.hi && spec.hi[j] != null ? num(spec.hi[j]) : null;
      const draw = (v) => {
        if (j === 0) svg += `<line class="bline" x1="${X(v)}" y1="${Y(-1)}" x2="${X(v)}" y2="${Y(big)}"/>`;
        else svg += `<line class="bline" x1="${X(-1)}" y1="${Y(v)}" x2="${X(big)}" y2="${Y(v)}"/>`;
      };
      if (l > 0) draw(l);
      if (h != null) draw(h);
    }
    svg += `</g>`;
    // integer points
    const feasOrig = (x, y) => oA.every((row, i) => {
      const v = num(row[0]) * x + num(row[1]) * y, bb = num(oB[i]);
      const s = ((spec.origSense || spec.sense) && (spec.origSense || spec.sense)[i]) || '<=';
      return s === '<=' ? v <= bb + 1e-9 : s === '>=' ? v >= bb - 1e-9 : Math.abs(v - bb) < 1e-9;
    });
    if (spec.showInt !== false) {
      for (let i = 0; i <= xmax; i++) for (let j = 0; j <= ymax; j++) {
        if (feasOrig(i, j)) svg += `<circle class="ipt" cx="${X(i)}" cy="${Y(j)}" r="2.6"/>`;
      }
    }
    // axes
    svg += `<line class="axis" x1="${X(0)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}"/><line class="axis" x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(ymax)}"/>`;
    svg += `<text class="axl" x="${X(xmax) - 2}" y="${Y(0) - 5}" text-anchor="end">${esc(names[0])}</text><text class="axl" x="${X(0) + 5}" y="${Y(ymax) + 10}">${esc(names[1])}</text>`;
    // iso-objective through optimum + point
    if (spec.point) {
      const px = num(spec.point[0]), py = num(spec.point[1]);
      if (spec.c) {
        const c = spec.c.map(num);
        const zz = c[0] * px + c[1] * py;
        if (Math.abs(c[1]) > 1e-12) {
          const q1 = [-1, (zz + c[0]) / c[1]], q2 = [big, (zz - c[0] * big) / c[1]];
          svg += `<g clip-path="url(#pc)"><line class="isoline" x1="${X(q1[0])}" y1="${Y(q1[1])}" x2="${X(q2[0])}" y2="${Y(q2[1])}"/></g>`;
        }
      }
      svg += `<circle class="lpopt" cx="${X(px)}" cy="${Y(py)}" r="5"/>`;
    }
    svg += `</svg>`;
    const cap = spec.caption ? `<div class="viz-cap">${spec.caption}</div>` : '';
    const legend = `<div class="viz-legend"><span class="lg lgreg"></span>alt problem bölgesi <span class="lg lgipt"></span>IP-uygun nokta <span class="lg lgopt"></span>LP optimumu <span class="lg lgbl"></span>dal kısıtı</div>`;
    return `<div class="viz viz-plot">${cap}${svg}${legend}</div>`;
  }

  // ------------------------------------------------------------------ matrix / table
  function matrix(spec) {
    const cls = spec.cls || [];
    let h = `<table class="mtx">`;
    if (spec.colLabels) h += `<tr><th>${spec.corner || ''}</th>${spec.colLabels.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    spec.cells.forEach((row, i) => {
      h += `<tr>${spec.rowLabels ? `<th>${spec.rowLabels[i]}</th>` : ''}${row
        .map((c, j) => `<td class="${(cls[i] && cls[i][j]) || ''}">${c}</td>`)
        .join('')}</tr>`;
    });
    h += `</table>`;
    const cap = spec.caption ? `<div class="viz-cap">${spec.caption}</div>` : '';
    return `<div class="viz viz-matrix">${cap}${h}</div>`;
  }

  function render(spec) {
    if (!spec) return '';
    if (Array.isArray(spec)) return spec.map(render).join('');
    switch (spec.type) {
      case 'tree': return tree(spec);
      case 'plot': return plot(spec);
      case 'matrix': return matrix(spec);
      case 'html': return `<div class="viz viz-html">${spec.html}</div>`;
      default: return '';
    }
  }

  OR.viz = { render, tree, plot, matrix };
})();
