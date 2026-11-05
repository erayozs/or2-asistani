/* 2.7 · TSP heuristics (notes 2.7.1 Nearest-Neighbor, 2.7.2 Cheapest-Insertion; Examples 11-12, Winston 9.6).
   - Random symmetric distance matrix (5-6 cities, all distinct off-diagonal distances, c_ii = M), given start city.
   - NNH: from the current city go to the closest unvisited city; the last city is forced, then return to the start.
   - CIH: start city s, its closest neighbour b -> subtour (s,b)-(b,s). Each step: replace an arc (i,j) of the subtour by
     (i,k)+(k,j), k outside the subtour, minimising c_ik + c_kj - c_ij. On a 2-city subtour (s,b) and (b,s) are equivalent;
     as in the notes we replace (s,b) -> subtour s-k-b-s.
   - Instances are rejected unless every decision is unique (no ties), so each answer is well defined.
   - Option `all`: also run the heuristic from every other start city (notes: last step) and compare with brute force.
   Exposes OR.drills['tsp-nnh'|'tsp-cih'].{nnh,cih,optimum,randomD} (used by verification scripts). */
(function () {
  const OR = window.OR;
  const M = Infinity;

  // ------------------------------------------------------------------ instance
  function randomD(rng, n) {
    for (let t = 0; t < 500; t++) {
      const pts = [];
      for (let i = 0; i < n; i++) pts.push([rng.int(0, 200), rng.int(0, 200)]);
      const D = [];
      const seen = {};
      let ok = true;
      for (let i = 0; i < n; i++) {
        D.push([]);
        for (let j = 0; j < n; j++) {
          if (i === j) D[i].push(M);
          else {
            const d = Math.round(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
            if (d < 25) ok = false;
            if (j > i) {
              if (seen[d]) ok = false; // all distances distinct
              seen[d] = true;
            }
            D[i].push(d);
          }
        }
      }
      if (ok) return D;
    }
    return null;
  }

  const tourLen = (D, cyc) => cyc.reduce((s, c, t) => s + D[c][cyc[(t + 1) % cyc.length]], 0);

  // optimum by brute force over all (n-1)! tours from city 0
  function optimum(D) {
    const n = D.length;
    let best = Infinity;
    let bestT = null;
    let count = 0;
    const cur = [0];
    const used = [true];
    (function rec(z) {
      if (cur.length === n) {
        const tot = z + D[cur[n - 1]][0];
        if (tot < best) {
          best = tot;
          bestT = cur.slice();
          count = 1;
        } else if (tot === best) count++;
        return;
      }
      for (let c = 1; c < n; c++) {
        if (used[c]) continue;
        used[c] = true;
        cur.push(c);
        rec(z + D[cur[cur.length - 2]][c]);
        cur.pop();
        used[c] = false;
      }
    })(0);
    return { z: best, tour: bestT, count: count / 2 }; // each undirected tour counted twice
  }

  // ------------------------------------------------------------------ heuristics
  function nnh(D, s) {
    const n = D.length;
    const visited = [];
    visited[s] = true;
    const tour = [s];
    const steps = [];
    let cur = s;
    let unique = true;
    while (tour.length < n) {
      const cand = [];
      for (let k = 0; k < n; k++) if (!visited[k]) cand.push(k);
      const byD = cand.slice().sort((a, b) => D[cur][a] - D[cur][b] || a - b);
      const next = byD[0];
      const tie = byD.length > 1 && D[cur][byD[1]] === D[cur][next];
      if (tie) unique = false;
      steps.push({ from: cur, cand, next, path: tour.slice() });
      visited[next] = true;
      tour.push(next);
      cur = next;
    }
    return { s, tour, steps, len: tourLen(D, tour), unique };
  }

  function cih(D, s) {
    const n = D.length;
    const others = [];
    for (let k = 0; k < n; k++) if (k !== s) others.push(k);
    others.sort((a, b) => D[s][a] - D[s][b] || a - b);
    const b0 = others[0];
    let unique = D[s][others[1]] > D[s][b0];
    const cycle = [s, b0];
    const steps = [];
    while (cycle.length < n) {
      const L = cycle.length;
      const inC = [];
      cycle.forEach((c) => (inC[c] = true));
      const U = [];
      for (let k = 0; k < n; k++) if (!inC[k]) U.push(k);
      const nArcs = L === 2 ? 1 : L; // 2-city subtour: (s,b) and (b,s) are equivalent
      const cands = [];
      for (let i = 0; i < nArcs; i++) {
        const a = cycle[i];
        const b = cycle[(i + 1) % L];
        for (const k of U) cands.push({ i, a, b, k, cost: D[a][k] + D[k][b] - D[a][b] });
      }
      const sorted = cands.slice().sort((x, y) => x.cost - y.cost || x.i - y.i || x.k - y.k);
      const best = sorted[0];
      if (sorted.length > 1 && sorted[1].cost === best.cost) unique = false;
      steps.push({ cycle: cycle.slice(), cands, sorted, best, U });
      cycle.splice(best.i + 1, 0, best.k);
    }
    return { s, nb: b0, nbSorted: others, tour: cycle, steps, len: tourLen(D, cycle), unique };
  }

  // ------------------------------------------------------------------ rendering helpers
  const C = (i, j) => `c<sub>${i + 1}${j + 1}</sub>`;
  const path = (arr, close) => arr.map((v) => v + 1).concat(close ? [arr[0] + 1] : []).join('–');
  const list = (arr) => arr.map((v) => v + 1).join(', ');
  const city = (k) => `Şehir <b>${k + 1}</b>`;

  function distViz(D, caption, clsFn) {
    const n = D.length;
    const lab = Array.from({ length: n }, (_, i) => i + 1);
    return {
      type: 'matrix',
      caption: caption || 'Şehirler arası mesafeler (simetrik), c<sub>ii</sub> = M',
      corner: 'i \\ j',
      rowLabels: lab,
      colLabels: lab,
      cells: D.map((r) => r.map((v) => (v === M ? 'M' : String(v)))),
      cls: D.map((r, i) =>
        r.map((v, j) => {
          const c = clsFn ? clsFn(i, j) || '' : '';
          return ((v === M ? 'm ' : '') + c).trim();
        })
      ),
    };
  }

  // schematic route picture: cities on a circle, given edges drawn (labelled with the distance)
  // edges: [[a, b, 'new'|'']] ; o: {start, cur, caption}
  function routeViz(D, edges, o) {
    o = o || {};
    const n = D.length;
    const W = 230;
    const H = 214;
    const cx = W / 2;
    const cy = H / 2;
    const R = 80;
    const P = (i) => [cx + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n), cy + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)];
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;margin:0 auto">`;
    edges.forEach(([a, b, kind]) => {
      const [x1, y1] = P(a);
      const [x2, y2] = P(b);
      const hot = kind === 'new';
      svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:var(${hot ? '--good' : '--acc'});stroke-width:${hot ? 3.4 : 2.2};stroke-linecap:round"/>`;
    });
    edges.forEach(([a, b]) => {
      const [x1, y1] = P(a);
      const [x2, y2] = P(b);
      svg += `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${((y1 + y2) / 2 + 3.5).toFixed(1)}" text-anchor="middle" style="font-size:10.5px;font-family:var(--mono);fill:var(--ink);paint-order:stroke;stroke:var(--card);stroke-width:3.5px">${D[a][b]}</text>`;
    });
    for (let i = 0; i < n; i++) {
      const [x, y] = P(i);
      let fill = 'var(--card)';
      let stroke = 'var(--muted)';
      if (i === o.start) {
        fill = 'var(--gold-soft)';
        stroke = 'var(--gold)';
      }
      if (i === o.cur) {
        fill = 'var(--acc-soft)';
        stroke = 'var(--acc)';
      }
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" style="fill:${fill};stroke:${stroke};stroke-width:2"/>`;
      svg += `<text x="${x.toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="middle" style="font-size:13px;font-weight:700;fill:var(--ink)">${i + 1}</text>`;
    }
    svg += `</svg>`;
    const cap = o.caption || '';
    return {
      type: 'html',
      html: `<div class="viz-cap">${cap}</div>${svg}<div class="muted" style="font-size:11.5px;text-align:center">Şematik çizim (mesafeler ölçekli değil); kenar etiketleri = c<sub>ij</sub>. Sarı = başlangıç şehri.</div>`,
    };
  }
  const pathEdges = (p, closeIt, hotLast) => {
    const e = [];
    for (let t = 0; t + 1 < p.length; t++) e.push([p[t], p[t + 1], hotLast && t + 2 === p.length ? 'new' : '']);
    if (closeIt && p.length > 2) e.push([p[p.length - 1], p[0], '']);
    return e;
  };

  function lengthExplain(D, cyc) {
    const t = cyc.map((c, k) => [c, cyc[(k + 1) % cyc.length]]);
    return `z = ${t.map(([a, b]) => C(a, b)).join(' + ')} = ${t.map(([a, b]) => D[a][b]).join(' + ')} = <b>${tourLen(D, cyc)}</b>`;
  }

  function startsSteps(D, results, s0, kindName, sol) {
    const n = D.length;
    const others = [];
    for (let s = 0; s < n; s++) if (s !== s0) others.push(s);
    const bestLen = Math.min(...results.map((r) => r.len));
    const rows = results.map((r) => `<li>${r.s + 1}. şehirden başla: <b>${path(r.tour, true)}</b> → ${r.len} ${r.len === bestLen ? '✓' : ''}</li>`).join('');
    const st = [];
    st.push({
      kind: 'number',
      prompt: `Notlardaki son adım: ${kindName} <b>her şehirden başlayarak</b> uygulanır ve en iyi tour önerilir. ${s0 + 1}. şehirden başlayan tour'u zaten buldun; aynı prosedürü <b>diğer başlangıç şehirleri</b> için uygula ve her tour'un uzunluğunu yaz.`,
      fields: others.map((s) => ({ label: `z (${s + 1}. şehirden başlayan)`, answer: results[s].len })),
      hint: 'Her başlangıç için aynı kuralı baştan uygula (hepsinde eşitlik yoktur); sonunda tour\'un kapanış arc\'ını da say.',
      explain: `<ul class="conv">${rows}</ul>`,
      viz: [distViz(D)],
    });
    const optsMulti = results.map((r) => ({ html: `${r.s + 1}. şehirden başlamak`, correct: r.len === bestLen }));
    st.push({
      kind: 'multi',
      keepOrder: true,
      prompt: `Hangi başlangıç şehir(ler)i en kısa ${kindName} tour'unu verir? (Birden fazla başlangıç aynı tour'u üretebilir.)`,
      options: optsMulti,
      explain: `En kısa tour uzunluğu <b>${bestLen}</b>: ${results
        .filter((r) => r.len === bestLen)
        .map((r) => `${r.s + 1}. şehirden başlayan ${path(r.tour, true)}`)
        .join('; ')}.`,
    });
    return st;
  }

  function optInfo(D, results, kindName, opt) {
    const bestLen = Math.min(...results.map((r) => r.len));
    const gap = bestLen - opt.z;
    return {
      kind: 'info',
      prompt: `<b>Heuristic ile optimal karşılaştırması.</b> Şehir sayısı küçük olduğu için tüm tour'lar denenebilir (brute force): optimal tour <b>${path(opt.tour, true)}</b>, z* = <b>${opt.z}</b>. ${kindName} ${results.length > 1 ? 'en iyi' : ''} sonucu = <b>${bestLen}</b> → ${
        gap === 0 ? 'bu örnekte heuristic <b>optimal</b> tour\'u buldu (ders notundaki Örnek 11/12 gibi).' : `optimal değil, <b>${gap}</b> (%${((100 * gap) / opt.z).toFixed(1)}) daha uzun. Heuristic'ler optimaliteyi <b>garanti etmez</b>.`
      }`,
    };
  }

  // ------------------------------------------------------------------ NNH steps
  function nnhSteps(D, r, withViz) {
    const n = D.length;
    const steps = [];
    r.steps.forEach((st, idx) => {
      const cur = st.from;
      const vis = st.path;
      const isVis = [];
      vis.forEach((v) => (isVis[v] = true));
      const during = (chosen) =>
        distViz(D, `${cur + 1}. satır: ziyaret edilmemiş şehirlere mesafeler (yeşil)${chosen != null ? '; seçilen çerçeveli' : ''}. Gri sütunlar = zaten ziyaret edildi`, (i, j) => {
          if (i === j) return '';
          if (chosen != null && i === cur && j === chosen) return 'sel';
          if (isVis[j]) return 'dim';
          return i === cur ? 'hl' : '';
        });
      const dists = st.cand.map((k) => `${C(cur, k)} = ${D[cur][k]}`).join(', ');
      if (st.cand.length >= 2) {
        const fixed = idx === 0 ? `Başlangıç şehri <b>${cur + 1}</b>.` : `Şu an <b>${cur + 1}</b>. şehirdeyiz; şimdiye kadarki rota: <b>${path(vis)}</b>.`;
        steps.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `${fixed} Ziyaret edilmemiş şehirler: ${list(st.cand)}.<br>Nearest-neighbor kuralına göre <b>sıradaki şehir</b> hangisi?`,
          options: st.cand.map((k) => ({ html: `Şehir <b>${k + 1}</b>`, correct: k === st.next })),
          hint: `${cur + 1}. şehrin satırına bak: ziyaret edilmemiş şehirlere olan mesafelerden en küçüğü hangisi?`,
          explain: `${cur + 1}. şehirden ziyaret edilmemiş şehirlere mesafeler: ${dists}. En küçüğü ${C(cur, st.next)} = ${D[cur][st.next]} → <b>${st.next + 1}</b>. şehir; arc ${cur + 1}–${st.next + 1}. Rota: <b>${path(vis.concat([st.next]))}</b>.`,
          vizDuring: [routeViz(D, pathEdges(vis), { start: r.s, cur, caption: `Rota: ${path(vis)}` }), during(null)],
          viz: [routeViz(D, pathEdges(vis.concat([st.next]), false, true), { start: r.s, cur: st.next, caption: `Rota: ${path(vis.concat([st.next]))}` }), during(st.next)],
        });
      }
    });
    const last = r.tour[n - 1];
    const closed = r.tour.concat([r.s]);
    steps.push({
      kind: 'sequence',
      prompt: `Kalan son şehir (${last + 1}) zorunludur; ardından başlangıç şehrine dönülür. NNH ile bulunan tam <b>tour</b>'u ${r.s + 1}. şehirden başlayıp ${r.s + 1}'de bitecek şekilde yaz.`,
      sequence: { answer: closed.map((v) => v + 1), allowReverse: true, placeholder: 'ör. 1-5-2-4-3-1' },
      explain: `Adımlar: ${r.steps.map((s) => `${s.from + 1}→${s.next + 1}`).join(', ')}; son şehir ${last + 1}'den ${r.s + 1}'e dönüş. Tour: <b>${path(closed)}</b>.`,
      viz: [routeViz(D, pathEdges(r.tour, true), { start: r.s, caption: `NNH tour'u: ${path(closed)}` }), distViz(D)],
    });
    steps.push({
      kind: 'number',
      prompt: `${path(closed)} tour'unun toplam uzunluğu nedir?`,
      fields: [{ label: 'z', answer: r.len }],
      hint: 'Tour\'daki ardışık şehirler arasındaki mesafeleri (dönüş arc\'ı dahil) topla.',
      explain: lengthExplain(D, r.tour),
    });
    return steps;
  }

  // ------------------------------------------------------------------ CIH steps
  function insTable(D, st) {
    const rows = st.cands
      .map((c) => {
        const best = c === st.best;
        return `<tr><td${best ? ' class="hl"' : ''}>(${c.a + 1}, ${c.b + 1})${best ? '*' : ''}</td><td>(${c.a + 1}, ${c.k + 1})–(${c.k + 1}, ${c.b + 1})</td><td>${C(c.a, c.k)}+${C(c.k, c.b)}−${C(c.a, c.b)} = ${D[c.a][c.k]}+${D[c.k][c.b]}−${D[c.a][c.b]}</td><td${best ? ' class="hl"' : ''}>${c.cost}</td></tr>`;
      })
      .join('');
    return `<div style="overflow-x:auto"><table class="mtx" style="margin:6px 0"><tr><th>Silinen arc</th><th>Eklenen arc'lar</th><th>Hesap</th><th>Artış</th></tr>${rows}</table></div>`;
  }

  function cihSteps(D, r) {
    const n = D.length;
    const steps = [];
    const s = r.s;
    const cycEdges = (cyc, hotPair) => {
      const e = [];
      for (let t = 0; t < cyc.length; t++) {
        const a = cyc[t];
        const b = cyc[(t + 1) % cyc.length];
        if (cyc.length === 2 && t === 1) break;
        e.push([a, b, hotPair && (hotPair.indexOf(a) >= 0 && hotPair.indexOf(b) >= 0) ? 'new' : '']);
      }
      return e;
    };
    const subDist = (cyc, caption) => {
      const inArc = {};
      cyc.forEach((a, t) => {
        const b = cyc[(t + 1) % cyc.length];
        inArc[a * n + b] = true;
        inArc[b * n + a] = true;
      });
      return distViz(D, caption, (i, j) => (i !== j && inArc[i * n + j] ? 'hl' : ''));
    };

    // ---- nearest neighbour of the start city
    steps.push({
      kind: 'choice',
      keepOrder: true,
      prompt: `Cheapest-insertion ${s + 1}. şehirden başlar. İlk adım: ${s + 1}. şehre <b>en yakın</b> şehri bul (onunla iki şehirli bir subtour kurulacak). En yakın komşu hangisi?`,
      options: r.nbSorted.slice().sort((a, b) => a - b).map((k) => ({ html: `Şehir <b>${k + 1}</b>`, correct: k === r.nb })),
      hint: `${s + 1}. şehrin satırındaki en küçük mesafeye bak.`,
      explain: `${s + 1}. şehirden mesafeler: ${r.nbSorted.slice().sort((a, b) => a - b).map((k) => `${C(s, k)} = ${D[s][k]}`).join(', ')}. En küçüğü ${C(s, r.nb)} = ${D[s][r.nb]} → <b>${r.nb + 1}</b>. şehir. Subtour: (${s + 1}, ${r.nb + 1})–(${r.nb + 1}, ${s + 1}).`,
      vizDuring: [distViz(D, `${s + 1}. satır = başlangıç şehrinden mesafeler`, (i, j) => (i === s && j !== s ? 'hl' : ''))],
      viz: [routeViz(D, [[s, r.nb, '']], { start: s, caption: `İlk subtour: (${s + 1}, ${r.nb + 1})–(${r.nb + 1}, ${s + 1})` }), subDist([s, r.nb], 'Subtour arc\'ları yeşil')],
    });

    r.steps.forEach((st, idx) => {
      const L = st.cycle.length;
      const cyc = st.cycle;
      const arcsTxt = L === 2 ? `(${cyc[0] + 1}, ${cyc[1] + 1}) ve (${cyc[1] + 1}, ${cyc[0] + 1})` : cyc.map((a, t) => `(${a + 1}, ${cyc[(t + 1) % L] + 1})`).join(', ');
      const newCyc = cyc.slice();
      newCyc.splice(st.best.i + 1, 0, st.best.k);

      // --- options: best + targeted distractors (same city other arc / same arc other city / runner-up)
      const key = (c) => `${c.k}/${c.i}`;
      const opts = [st.best];
      const addOpt = (c) => {
        if (c && !opts.some((o) => key(o) === key(c)) && opts.length < 4) opts.push(c);
      };
      addOpt(st.sorted.find((c) => c.k === st.best.k && c.i !== st.best.i));
      addOpt(st.sorted.find((c) => c.i === st.best.i && c.k !== st.best.k));
      for (const c of st.sorted) addOpt(c);
      const optHtml = (c) => `Şehir <b>${c.k + 1}</b>'i (${c.a + 1}, ${c.b + 1}) arc'ının yerine ekle: (${c.a + 1}, ${c.k + 1}) ve (${c.k + 1}, ${c.b + 1})`;

      const eq = L === 2 ? ` <span class="muted">(İki şehirli subtour'da (${cyc[0] + 1}, ${cyc[1] + 1}) ve (${cyc[1] + 1}, ${cyc[0] + 1}) eşdeğerdir; notlardaki gibi (${cyc[0] + 1}, ${cyc[1] + 1}) arc'ı değiştirilir.)</span>` : '';
      const nAdd = st.cands.length;
      steps.push({
        kind: 'choice',
        prompt: `<b>${idx + 1}. ekleme.</b> Mevcut subtour: <b>${path(cyc, true)}</b> (arc'lar: ${arcsTxt}). Subtour dışındaki şehirler: ${list(st.U)}.<br>Subtour'daki bir (i, j) arc'ı yerine (i, k) ve (k, j) konur; artış <b>c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub></b>. Toplam ${nAdd} olası ekleme var; <b>en küçük artışı</b> veren ekleme hangisi?${eq}`,
        options: opts.map((c) => ({ html: optHtml(c), correct: c === st.best })),
        hint: 'Her (arc, şehir) çifti için c_ik + c_kj − c_ij hesapla; en küçüğünü seç. (Tüm çiftleri tablo yapmak işi kolaylaştırır.)',
        explain: `Tüm eklemelerin artışları:${insTable(D, st)}<b>*</b> en küçük artış: ${city(st.best.k)}, (${st.best.a + 1}, ${st.best.b + 1}) arc'ının yerine → yeni subtour <b>${path(newCyc, true)}</b>.`,
        vizDuring: [routeViz(D, cycEdges(cyc), { start: s, caption: `Mevcut subtour: ${path(cyc, true)}` }), subDist(cyc, 'Subtour arc\'ları yeşil')],
        viz: [
          routeViz(D, cycEdges(newCyc, [st.best.a, st.best.k, st.best.b]).filter((e) => !(e[0] === st.best.a && e[1] === st.best.b) && !(e[0] === st.best.b && e[1] === st.best.a)), { start: s, caption: `Yeni subtour: ${path(newCyc, true)}` }),
          subDist(newCyc, 'Yeni subtour arc\'ları yeşil'),
        ],
      });
      steps.push({
        kind: 'number',
        prompt: `Bu ekleme (${city(st.best.k)}, (${st.best.a + 1}, ${st.best.b + 1}) arc'ının yerine) subtour uzunluğunu <b>ne kadar artırır</b>? (c<sub>${st.best.a + 1}${st.best.k + 1}</sub> + c<sub>${st.best.k + 1}${st.best.b + 1}</sub> − c<sub>${st.best.a + 1}${st.best.b + 1}</sub>)`,
        fields: [{ label: 'Artış', answer: st.best.cost }],
        hint: 'İki yeni arc\'ın uzunluğunu topla, silinen arc\'ın uzunluğunu çıkar.',
        explain: `${C(st.best.a, st.best.k)} + ${C(st.best.k, st.best.b)} − ${C(st.best.a, st.best.b)} = ${D[st.best.a][st.best.k]} + ${D[st.best.k][st.best.b]} − ${D[st.best.a][st.best.b]} = <b>${st.best.cost}</b>.`,
      });
    });

    const closed = r.tour.concat([s]);
    steps.push({
      kind: 'sequence',
      prompt: `Tüm şehirler subtour'a girdi → CIH bitti. Elde edilen <b>tour</b>'u ${s + 1}. şehirden başlayıp ${s + 1}'de bitecek şekilde yaz.`,
      sequence: { answer: closed.map((v) => v + 1), allowReverse: true, placeholder: 'ör. 1-3-4-2-5-1' },
      explain: `Son subtour = tour: <b>${path(closed)}</b> (ters yön de aynı tour'dur).`,
      viz: [routeViz(D, pathEdges(r.tour, true), { start: s, caption: `CIH tour'u: ${path(closed)}` }), distViz(D)],
    });
    steps.push({
      kind: 'number',
      prompt: `${path(closed)} tour'unun toplam uzunluğu nedir?`,
      fields: [{ label: 'z', answer: r.len }],
      hint: 'Tour\'daki ardışık şehirler arasındaki mesafeleri (dönüş arc\'ı dahil) topla. (İpucu: ilk subtour uzunluğu + ekleme artışları da aynı sonucu verir.)',
      explain: `${lengthExplain(D, r.tour)}. Kontrol: 2 × ${D[s][r.nb]} (ilk subtour) + eklemelerin artışları (${r.steps.map((x) => x.best.cost).join(' + ')}) = ${2 * D[s][r.nb] + r.steps.reduce((a, x) => a + x.best.cost, 0)}.`,
    });
    return steps;
  }

  // ------------------------------------------------------------------ drills
  const OPTIONS = [
    {
      key: 'n',
      label: 'Şehir sayısı',
      type: 'select',
      default: 'mix',
      choices: [
        { value: 'mix', label: '5–6 (karışık)' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
      ],
    },
    { key: 'all', label: 'Tüm başlangıç şehirlerini dene (notlardaki son adım)', type: 'checkbox', default: false },
  ];

  function build(kind, rng, opts) {
    opts = opts || {};
    const nOpt = String(opts.n == null ? 'mix' : opts.n);
    const heur = kind === 'nnh' ? nnh : cih;
    const kindName = kind === 'nnh' ? 'NNH' : 'CIH';
    for (let tries = 0; tries < 3000; tries++) {
      const n = nOpt === '5' ? 5 : nOpt === '6' ? 6 : rng.int(5, 6);
      const D = randomD(rng, n);
      if (!D) continue;
      const s0 = rng.int(0, n - 1);
      const results = [];
      for (let s = 0; s < n; s++) results.push(heur(D, s));
      if (!results[s0].unique) continue;
      if (opts.all && !results.every((r) => r.unique)) continue;
      const r = results[s0];
      const opt = optimum(D);
      const set = opts.all ? results : [r];
      const steps = kind === 'nnh' ? nnhSteps(D, r) : cihSteps(D, r);
      if (opts.all) startsSteps(D, results, s0, kindName, null).forEach((x) => steps.push(x));
      steps.push(optInfo(D, set, kindName, opt));

      const closed = r.tour.concat([s0]);
      const conv =
        kind === 'nnh'
          ? `<ul class="conv">
          <li>${s0 + 1}. şehirden başla ve her adımda <b>ziyaret edilmemiş şehirlerden en yakın olana</b> git (notlar 2.7.1).</li>
          <li>Tüm şehirler gezilince başlangıç şehrine dön. Son şehir zorunlu olduğundan onu sormuyoruz.</li>
          <li>Bu örnekte hiçbir adımda eşitlik yoktur (hep tek en yakın şehir).</li>
          ${opts.all ? '<li>Notlardaki 4. adım: prosedür <b>her şehirden başlayarak</b> uygulanır, en iyi tour önerilir.</li>' : ''}
        </ul>`
          : `<ul class="conv">
          <li>${s0 + 1}. şehirden başla, <b>en yakın komşusunu</b> bul ve bu iki şehri birleştiren subtour'u kur: (s, b)–(b, s) (notlar 2.7.2).</li>
          <li>Her adımda subtour'daki bir (i, j) arc'ı, subtour dışındaki bir k şehri ile (i, k) ve (k, j) arc'larıyla değiştirilir; artış <b>c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub></b>. <b>En küçük artışı</b> veren (arc, şehir) seçilir.</li>
          <li>Tüm şehirler subtour'a girince tour tamamdır. Bu örnekte hiçbir adımda eşitlik yoktur.</li>
          ${opts.all ? '<li>Notlardaki son adım: prosedür <b>her şehirden başlayarak</b> uygulanır, en iyi tour önerilir.</li>' : ''}
        </ul>`;

      const sol = opts.all
        ? `<b>En iyi ${kindName} tour'u:</b> ${(() => {
            const b = results.reduce((x, y) => (y.len < x.len ? y : x));
            return `${path(b.tour.concat([b.s]))} (${b.s + 1}. şehirden başlayan), uzunluk ${b.len}`;
          })()} · optimal z* = ${opt.z} (${path(opt.tour, true)}).`
        : `<b>${s0 + 1}. şehirden başlayan ${kindName} tour'u:</b> ${path(closed)}, uzunluk <b>${r.len}</b> · optimal z* = ${opt.z} (${path(opt.tour, true)}); fark ${r.len - opt.z}.`;

      return {
        title: kind === 'nnh' ? 'TSP · Nearest-Neighbor Heuristic (NNH)' : 'TSP · Cheapest-Insertion Heuristic (CIH)',
        statement: `<p>Bir satıcı ${n} şehri ziyaret edip başladığı şehre dönecek (<b>TSP</b>). Mesafeler simetriktir (sağdaki tablo), c<sub>ii</sub> = M. İyi (ama optimal olması garanti olmayan) bir tour'u <b>${kind === 'nnh' ? 'Nearest-Neighbor' : 'Cheapest-Insertion'} heuristic</b> ile bul. Başlangıç şehri: <b>${s0 + 1}</b>.</p>
          <p><b>Kurallar:</b></p>${conv}`,
        viz: distViz(D),
        steps,
        solution: sol,
      };
    }
    throw new Error('uygun TSP heuristic örneği bulunamadı');
  }

  OR.registerDrill({
    id: 'tsp-nnh',
    topic: '2.7',
    title: 'TSP · Nearest-Neighbor Heuristic',
    description:
      'Rastgele simetrik mesafe matrisi ve verilen başlangıç şehri için <b>Nearest-Neighbor</b> heuristic\'ini adım adım uygula: her adımda en yakın ziyaret edilmemiş şehri seç, tour\'u ve uzunluğunu bul; istersen tüm başlangıç şehirlerini dene ve optimal ile karşılaştır.',
    options: OPTIONS,
    nnh,
    optimum,
    randomD,
    generate: (rng, opts) => build('nnh', rng, opts),
  });

  OR.registerDrill({
    id: 'tsp-cih',
    topic: '2.7',
    title: 'TSP · Cheapest-Insertion Heuristic',
    description:
      'Rastgele simetrik mesafe matrisi ve verilen başlangıç şehri için <b>Cheapest-Insertion</b> heuristic\'ini uygula: en yakın komşuyla subtour kur, her adımda c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub> artışı en küçük olan ekleme (hangi şehir, hangi arc yerine) seçilir; tour\'u ve uzunluğunu bul, optimal ile karşılaştır.',
    options: OPTIONS,
    cih,
    optimum,
    randomD,
    generate: (rng, opts) => build('cih', rng, opts),
  });
})();
