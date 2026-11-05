/* Builds interactive Steps from a B&B trace (OR.bnb.run). Shared by all B&B drills.

   OR.bnbSteps.build(trace, cfg) -> Step[]
   cfg = {
     names:      [html]   variable names, default x<sub>i</sub>
     askLP:      bool     ask the user to solve each subproblem LP (else LP results are given as info)
     lpVars:     [idx]    variables asked in LP steps (default all)
     title(nd):  string   node name used in prompts & tree, default "Subp. k"
     lpHint(nd): html     optional hint for LP steps
     lpExplain(nd): html  optional extra explanation for LP steps (e.g. knapsack ratio reasoning)
     plot(nd, solved): vizSpec|null   optional extra panel (e.g. 2-var region)
     askRootBound: bool   ask "LR value is an upper bound" question after root (default true)
     intName:    string   'tamsayı' wording for integer requirement (e.g. 'binary')
   } */
(function () {
  const OR = window.OR;
  const F = OR.F;

  function build(trace, cfg) {
    cfg = cfg || {};
    const P = trace.P;
    const n = P.c.length;
    const names = cfg.names || OR.util.range(n).map((i) => `x<sub>${i + 1}</sub>`);
    const plainNames = names.map((s) => s.replace(/<\/?sub>/g, ''));
    const lpVars = cfg.lpVars || OR.util.range(n);
    const title = cfg.title || ((nd) => `Subp. ${nd.id}`);
    const nodes = trace.nodes;
    const ev = trace.events;
    const floorRule = !!trace.opts.floorRule;
    const order = trace.opts.order;
    const node = (id) => nodes[id - 1];
    const fmt = (v) => (v == null ? '—' : F(v).show());
    const isBin = (v) => F((P.lo || [])[v] || 0).eq(0) && P.hi && P.hi[v] != null && F(P.hi[v]).eq(1);

    const lbAt = (k) => {
      let lb = null;
      for (let i = 0; i <= k && i < ev.length; i++) if (ev[i].type === 'candidate') lb = ev[i].lbNew;
      return lb;
    };
    const tree = (k) => ({
      type: 'tree',
      caption: 'B&B ağacı',
      lb: lbAt(k) === null ? null : lbAt(k).show(),
      nodes: OR.bnb.treeAt(trace, k, { title, names }),
    });
    const viz = (k, nd, solved) => {
      const t = tree(k);
      const p = cfg.plot ? cfg.plot(nd, solved) : null;
      return p ? [t, p] : t;
    };
    const desc = (nd) =>
      nd.parent ? `${title(node(nd.parent))} + {${OR.bnb.branchLabel(nd.branch, names)}}` : 'LP relaxation (tamsayı kısıtları kaldırılmış)';
    const constraintsOf = (nd) => {
      // all added branching constraints along the path
      const out = [];
      let cur = nd;
      while (cur && cur.branch) {
        out.unshift(OR.bnb.branchLabel(cur.branch, names));
        cur = cur.parent ? node(cur.parent) : null;
      }
      return out;
    };
    const solText = (nd) =>
      nd.lp.status !== 'optimal'
        ? '<b>Infeasible</b>'
        : `z = <b>${nd.lp.z.show()}</b>, ` + OR.util.range(n).map((i) => `${names[i]} = ${nd.lp.x[i].show()}`).join(', ');

    // binding constraints at an LP optimum (for explanations)
    const binding = (nd) => {
      if (nd.lp.status !== 'optimal') return '';
      const x = nd.lp.x;
      const out = [];
      (P.A || []).forEach((row, r) => {
        let s = F(0);
        row.forEach((a, i) => (s = s.add(F(a).mul(x[i]))));
        if (s.eq(F(P.b[r]))) out.push(`${OR.util.linExpr(row)} = ${F(P.b[r]).toString()}`);
      });
      OR.util.range(n).forEach((i) => {
        const lo = F(nd.lo[i]);
        const hi = nd.hi[i] == null ? null : F(nd.hi[i]);
        if (hi && lo.eq(hi)) return; // fixed var (substituted, not a "binding" constraint)
        if (!lo.isZero() && x[i].eq(lo)) out.push(`${names[i]} = ${lo.toString()}`);
        if (hi && x[i].eq(hi)) out.push(`${names[i]} = ${hi.toString()}`);
      });
      return out.length ? `Bağlayıcı (binding) kısıtlar: ${out.join(' ; ')}.` : '';
    };

    const steps = [];
    let rootBoundAsked = false;

    for (let k = 0; k < ev.length; k++) {
      const e = ev[k];
      const nd = node(e.id);

      if (e.type === 'solve') {
        const added = constraintsOf(nd);
        const base = `<b>${title(nd)}</b> = ${desc(nd)}${added.length > 1 ? `<br><span class="muted">Yoldaki tüm ek kısıtlar: ${added.join(', ')}</span>` : ''}`;
        const extra = (cfg.lpExplain ? cfg.lpExplain(nd) + ' ' : '') + binding(nd);
        if (cfg.askLP) {
          steps.push({
            kind: 'number',
            prompt: `${base}<br>Bu alt problemin LP çözümünü bul.`,
            fields:
              nd.lp.status === 'optimal'
                ? [{ label: 'z', answer: nd.lp.z }].concat(lpVars.map((i) => ({ label: names[i], answer: nd.lp.x[i] })))
                : [{ label: 'z', answer: 0 }].concat(lpVars.map((i) => ({ label: names[i], answer: 0 }))),
            infeasible: nd.lp.status !== 'optimal',
            offerInfeasible: nd.id !== 1,
            hint: cfg.lpHint ? cfg.lpHint(nd) : 'Köşe noktalarını kontrol et: kısıt doğrularının ve dal sınırlarının kesişimleri. Amaç fonksiyonunu en büyükleyen uygun köşe optimumdur.',
            explain: `${solText(nd)}. ${extra}`,
            vizDuring: viz(k - 1, nd, false),
            viz: viz(k, nd, true),
          });
        } else {
          steps.push({
            kind: 'info',
            prompt: `${base}<br>LP çözümü: ${solText(nd)}`,
            explain: extra || undefined,
            viz: viz(k, nd, true),
          });
        }
        if (nd.id === 1 && cfg.askRootBound !== false && !rootBoundAsked && nd.lp.status === 'optimal') {
          rootBoundAsked = true;
          steps.push({
            kind: 'choice',
            prompt: `LR'nin optimal değeri z = ${nd.lp.z.show()}. Bu değer (max problemi olan) IP'nin optimal değeri z<sub>IP</sub> hakkında ne söyler?`,
            options: [
              { html: `z<sub>IP</sub> ≤ ${nd.lp.z.toString()} — LR değeri bir <b>upper bound</b>'dur`, correct: true },
              { html: `z<sub>IP</sub> ≥ ${nd.lp.z.toString()} — LR değeri bir <b>lower bound</b>'dur`, correct: false },
              { html: `z<sub>IP</sub> = ${nd.lp.z.floor().toString()} (LR değerini aşağı yuvarlamak yeterli)`, correct: false },
              { html: 'Hiçbir bilgi vermez', correct: false },
            ],
            explain:
              'LR, IP\'den daha az kısıtlıdır (uygun bölgesi IP\'nin uygun noktalarını kapsar). Max probleminde LR değeri ≥ IP değeri → <b>upper bound</b>. (Min probleminde lower bound olurdu.) Yuvarlama optimal sonucu garanti etmez.',
          });
        }
        continue;
      }

      if (e.type === 'infeasible' || e.type === 'fractional' || e.type === 'candidate' || e.type === 'bound') {
        if (e.type === 'infeasible' && cfg.askLP) continue; // already identified in the LP step
        const lbBefore = lbAt(k - 1);
        const lbTxt = lbBefore === null ? 'henüz LB yok (candidate bulunmadı)' : `mevcut LB = <b>${lbBefore.show()}</b>`;
        let why;
        if (e.type === 'infeasible') why = 'Alt problem infeasible → fathomed. Bu düğümden dal üretmek anlamsızdır.';
        else if (e.type === 'fractional')
          why = `${nd.fracVars.map((i) => `${names[i]} = ${nd.lp.x[i].show()}`).join(', ')} kesirli ve z = ${nd.lp.z.show()}${lbBefore === null ? '' : ` > LB = ${lbBefore.show()}`} → dallanmalıyız.${order === 'jump' ? ' (Jumptracking: düğüm aktif listeye girer; en iyi z\'ye sahip olduğunda dallanır.)' : ''}`;
        else if (e.type === 'candidate')
          why = `Tüm tamsayı değişkenler tamsayı değerli → IP için uygun bir çözüm: <b>candidate solution</b>. z = ${nd.lp.z.show()}${lbBefore === null ? '' : ` > eski LB = ${lbBefore.show()}`} olduğundan LB güncellenir.`;
        else
          why = floorRule && !nd.lp.z.isInt()
            ? `z = ${nd.lp.z.show()}. Amaç katsayıları ve değişkenler tamsayı olduğundan bu düğümden elde edilebilecek en iyi tamsayı çözüm ⌊z⌋ = ${nd.lp.z.floor().toString()} ≤ LB = ${lbBefore.show()} → fathomed (bound).`
            : `z = ${nd.lp.z.show()} ≤ LB = ${lbBefore.show()} → bu düğüm mevcut en iyi çözümden daha iyisini veremez → fathomed (bound).${nd.isInteger ? ' (Çözüm tamsayı olsa da LB\'yi iyileştirmiyor.)' : ''}`;
        steps.push({
          kind: 'choice',
          keepOrder: true,
          prompt: `${title(nd)} çözümü: ${solText(nd)}.<br>${lbTxt}. Bu düğüm için doğru karar hangisi?`,
          options: [
            { html: '<b>Dallan</b> (branch): bir tamsayı değişken kesirli ve z, LB\'den iyi', correct: e.type === 'fractional' },
            { html: '<b>Fathom – candidate</b>: tamsayı çözüm bulundu, LB güncellenir', correct: e.type === 'candidate' },
            { html: `<b>Fathom – bound</b>: ${floorRule ? 'z (veya ⌊z⌋)' : 'z'} ≤ LB, daha iyi çözüm veremez`, correct: e.type === 'bound' },
            { html: '<b>Fathom – infeasible</b>', correct: e.type === 'infeasible' },
          ],
          explain: why,
          viz: viz(k, nd, true),
        });
        if (e.type === 'candidate') {
          steps.push({
            kind: 'number',
            prompt: `Candidate bulundu. Güncel <b>LB</b> (şimdiye kadarki en iyi tamsayı çözümün z değeri) nedir?`,
            fields: [{ label: 'LB', answer: e.lbNew }],
            explain:
              `LB = ${e.lbNew.show()}.` +
              (e.superseded.length
                ? ` Önceki candidate ${e.superseded.map((id) => title(node(id))).join(', ')} artık optimal olamaz (z değeri daha küçük).`
                : ' Optimal z-değeri ≥ LB olduğunu artık biliyoruz.'),
          });
        }
        continue;
      }

      if (e.type === 'select') {
        const pool = e.pool.filter((id) => id !== undefined);
        if (pool.length < 2) continue;
        if (order === 'lifo') {
          // ask only when backtracking (previous processing event was a fathom, not a branch)
          let prev = null;
          for (let j = k - 1; j >= 0; j--) {
            if (['branch', 'infeasible', 'candidate', 'bound'].includes(ev[j].type)) { prev = ev[j]; break; }
          }
          if (prev && prev.type === 'branch') continue;
          steps.push({
            kind: 'choice',
            prompt: `Son düğüm fathom edildi. <b>LIFO (backtracking)</b> kuralına göre sıradaki çözülecek alt problem hangisi?`,
            options: pool.map((id) => ({ html: `${title(node(id))} = ${desc(node(id))}`, correct: id === e.id })),
            explain: `LIFO: en son oluşturulmuş, henüz çözülmemiş alt problem seçilir → <b>${title(nd)}</b>. Ağacın bir tarafında aşağı inip candidate bulduktan sonra yukarı geri dönülür (backtrack).`,
            vizDuring: tree(k - 1),
          });
        } else {
          steps.push({
            kind: 'choice',
            prompt: `<b>Jumptracking</b>: aktif (dallanmayı bekleyen) düğümler arasından hangisinde dallanırız?`,
            options: pool.map((id) => ({ html: `${title(node(id))}: z = ${node(id).lp.z.show()}`, correct: id === e.id })),
            explain: `Jumptracking: aktif düğümlerden <b>en iyi z değerine</b> sahip olan seçilir → ${title(nd)} (z = ${nd.lp.z.show()}).`,
            vizDuring: tree(k - 1),
          });
        }
        continue;
      }

      if (e.type === 'branch') {
        const v = e.v;
        const val = e.value;
        const frac = nd.fracVars || [];
        const children = e.children.map(node);
        const after = tree(k);
        if (isBin(v)) {
          const intVars = P.intVars;
          steps.push({
            kind: 'choice',
            prompt: `<b>${title(nd)}</b> dallanacak: hangi değişken üzerinde dallanırız?${frac.length > 1 ? ' (Kural: kesirli olanlardan indisi en küçük olan.)' : ''}`,
            options: intVars.map((i) => ({ html: `${names[i]} (= ${nd.lp.x[i].show()})`, correct: i === v })),
            explain: `${names[v]} = ${val.show()} kesirli → ${title(children[0])}: ${names[v]} = 0 ve ${title(children[1])}: ${names[v]} = 1. (Binary değişkende dallanma her zaman x = 0 / x = 1 şeklindedir.)`,
            viz: after,
          });
        } else {
          const fl = val.floor(), ce = val.ceil();
          const nm = names[v];
          const opts = [
            { html: `${nm} ≥ ${ce} &nbsp;ve&nbsp; ${nm} ≤ ${fl}`, correct: true },
            { html: `${nm} ≥ ${ce.add(1)} &nbsp;ve&nbsp; ${nm} ≤ ${ce}`, correct: false },
            { html: `${nm} = ${fl} &nbsp;ve&nbsp; ${nm} = ${ce}`, correct: false },
          ];
          if (fl.gt(0)) opts.push({ html: `${nm} ≥ ${fl} &nbsp;ve&nbsp; ${nm} ≤ ${fl.sub(1)}`, correct: false });
          else opts.push({ html: `${nm} ≥ ${val.toString()} &nbsp;ve&nbsp; ${nm} ≤ ${val.toString()}`, correct: false });
          const ruleTxt = frac.length > 1
            ? ` Kesirli değişkenler: ${frac.map((i) => names[i]).join(', ')}; kural gereği indisi en küçük olan <b>${nm}</b> seçilir.`
            : ` Kesirli değişken: <b>${nm}</b> = ${val.show()}.`;
          steps.push({
            kind: 'choice',
            prompt: `<b>${title(nd)}</b> dallanacak.${ruleTxt} Oluşturulacak iki alt problemin ek kısıtları hangisi?`,
            options: opts,
            explain: `${nm} = ${val.show()}, ${fl} ile ${ce} arasında → ${title(children[0])} = ${title(nd)} + {${nm} ≥ ${ce}}, ${title(children[1])} = ${title(nd)} + {${nm} ≤ ${fl}}. İki alt problem de ${nm} = ${val.toString()} noktasını içermez, yani mevcut LP çözümü tekrar ortaya çıkamaz; ama hiçbir tamsayı çözüm kaybolmaz.${order === 'lifo' ? ` LIFO'da ilk olarak ${title(children[trace.opts.firstChild === 'down' ? 1 : 0])} çözülecek (${trace.opts.firstChild === 'down' ? '≤' : '≥'} dalı önce — notlarda bu seçim "arbitrary").` : ' Jumptracking: oluşturulan iki alt problemin ikisi de hemen çözülür.'}`,
            viz: after,
          });
        }
        continue;
      }

      if (e.type === 'prune') {
        if (k > 0 && ev[k - 1].type === 'prune') continue; // grouped
        const pruned = [];
        for (let j = k; j < ev.length && ev[j].type === 'prune'; j++) pruned.push(ev[j].id);
        // active set right before the prune events
        const active = [];
        const st = {};
        for (let j = 0; j < k; j++) {
          const x = ev[j];
          if (x.type === 'fractional') st[x.id] = true;
          if (x.type === 'branch' || x.type === 'prune') st[x.id] = false;
        }
        Object.keys(st).forEach((id) => { if (st[id]) active.push(+id); });
        const lb = lbAt(k);
        const opts = active.map((id) => ({ html: `${title(node(id))}: z = ${node(id).lp.z.show()}`, correct: pruned.includes(id) }));
        opts.push({ html: 'Hiçbiri', correct: false });
        steps.push({
          kind: 'multi',
          keepOrder: true,
          prompt: `LB = <b>${lb.show()}</b> oldu. Dallanmayı bekleyen aktif düğümlerden hangileri artık <b>fathom</b> edilir?`,
          options: opts,
          explain: `${pruned.map((id) => `${title(node(id))} (z = ${node(id).lp.z.show()}${floorRule && !node(id).lp.z.isInt() ? `, ⌊z⌋ = ${node(id).lp.z.floor()}` : ''})`).join(', ')} ≤ LB = ${lb.show()} → daha iyi bir çözüm veremez, fathom edilir.`,
          viz: tree(k + pruned.length - 1),
        });
      }
    }

    // final answer
    const best = trace.best;
    if (best) {
      const bn = node(best.id);
      steps.push({
        kind: 'number',
        prompt: 'Aktif düğüm kalmadı. IP\'nin <b>optimal çözümü</b> nedir?',
        fields: [{ label: 'z*', answer: best.z }].concat(OR.util.range(n).map((i) => ({ label: names[i], answer: best.x[i] }))),
        explain: `Optimal çözümü veren düğüm: <b>${title(bn)}</b> → ${solText(bn)}. Toplam ${trace.nSolved} LP çözüldü.`,
        viz: { type: 'tree', caption: 'Final B&B ağacı', lb: best.z.show(), nodes: OR.bnb.treeAt(trace, Infinity, { title, names, final: true }) },
      });
    }
    return steps;
  }

  // Model text block: max z = ... s.t. ...
  function modelHtml(P, o) {
    o = o || {};
    const names = o.names;
    const lin = (row) => {
      if (!names) return OR.util.linExpr(row);
      let out = '';
      row.forEach((c, i) => {
        c = F(c);
        if (c.isZero()) return;
        const neg = c.lt(0), abs = c.abs();
        const t = `${abs.eq(1) ? '' : abs.toString()}${names[i]}`;
        out += out === '' ? (neg ? '−' : '') + t : (neg ? ' − ' : ' + ') + t;
      });
      return out;
    };
    const sense = P.sense || P.A.map(() => '<=');
    const sym = { '<=': '≤', '>=': '≥', '=': '=' };
    let h = `max z = ${lin(P.c)}\n`;
    P.A.forEach((row, r) => {
      h += `${r === 0 ? 's.t.   ' : '       '}${lin(row)} ${sym[sense[r]]} ${F(P.b[r]).toString()}\n`;
    });
    if (o.tail) h += `       ${o.tail}`;
    return `<div class="model">${h}</div>`;
  }

  OR.bnbSteps = { build, modelHtml };
})();
