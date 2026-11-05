/* App shell: layout, hash router, topic pages, drill pages, mixed quiz, progress. Loaded LAST. */
(function () {
  const OR = window.OR;
  const esc = (s) => OR.util.esc(s);

  // ------------------------------------------------------------ progress (localStorage)
  const PKEY = 'or2.progress.v1';
  const OKEY = 'or2.drillopts.v1';
  const store = {
    read(k) {
      try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; }
    },
    write(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ }
    },
  };
  OR.progress = {
    all: () => store.read(PKEY),
    get: (key) => store.read(PKEY)[key],
    add(key, c, t) {
      const p = store.read(PKEY);
      const e = p[key] || { c: 0, t: 0, n: 0 };
      e.c += c; e.t += t; e.n += 1; e.last = Date.now();
      p[key] = e;
      store.write(PKEY, p);
      renderNav();
    },
    reset() { store.write(PKEY, {}); renderNav(); },
  };
  OR.drillOpts = {
    get(id) {
      const d = OR.drills[id];
      const saved = store.read(OKEY)[id] || {};
      const out = {};
      (d.options || []).forEach((o) => { out[o.key] = saved[o.key] !== undefined ? saved[o.key] : o.default; });
      return out;
    },
    set(id, opts) {
      const all = store.read(OKEY);
      all[id] = opts;
      store.write(OKEY, all);
    },
  };
  const pct = (e) => (e && e.t ? Math.round((100 * e.c) / e.t) : null);
  const topicScore = (t) => {
    const p = OR.progress.all();
    let c = 0, tt = 0;
    const keys = ['concept:' + t.id].concat(t.drills.map((d) => 'drill:' + d));
    keys.forEach((k) => { if (p[k]) { c += p[k].c; tt += p[k].t; } });
    return tt ? Math.round((100 * c) / tt) : null;
  };

  // ------------------------------------------------------------ layout
  let side, main;
  function shell() {
    document.body.innerHTML = `
      <header class="top">
        <button class="menu" aria-label="Menü">☰</button>
        <a href="#/" class="brand"><span class="logo">OR 2</span><span class="bt">Asistanı <small>Bölüm 1 – 6</small></span></a>
        <nav class="topnav">
          <a href="#/quiz">🎯 Karışık Quiz</a>
          <a href="#/cheat">📇 Formül Kartı</a>
        </nav>
      </header>
      <div class="layout">
        <aside class="side"></aside>
        <main class="main" id="main"></main>
      </div>`;
    side = document.querySelector('.side');
    main = document.querySelector('#main');
    document.querySelector('.menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  }

  function renderNav() {
    if (!side) return;
    const cur = location.hash;
    let h = `<a class="nav-home" href="#/">🏠 Ana sayfa</a>`;
    Object.keys(OR.chapters).map(Number).forEach((ch) => {
      h += `<div class="nav-ch">${OR.chapters[ch]}</div>`;
      OR.topics.filter((t) => t.ch === ch).forEach((t) => {
        const sc = topicScore(t);
        const badge = sc === null ? '' : `<span class="badge ${sc >= 80 ? 'hi' : sc >= 50 ? 'mid' : 'lo'}">%${sc}</span>`;
        const focus = '';
        const active = cur.startsWith('#/t/' + t.id + '/') || cur === '#/t/' + t.id || (cur.startsWith('#/d/') && t.drills.includes(cur.split('/')[2]));
        h += `<a class="nav-t${focus}${active ? ' active' : ''}" href="#/t/${t.id}"><span class="tid">${OR.topicLabel(t)}</span><span class="tt">${esc(t.title)}</span>${badge}</a>`;
      });
    });
    h += `<div class="nav-ch">Diğer</div>
      <a class="nav-t${cur.startsWith('#/quiz') ? ' active' : ''}" href="#/quiz"><span class="tid">🎯</span><span class="tt">Karışık Quiz</span></a>
      <a class="nav-t${cur.startsWith('#/cheat') ? ' active' : ''}" href="#/cheat"><span class="tid">📇</span><span class="tt">Formül Kartı</span></a>`;
    side.innerHTML = h;
  }

  // ------------------------------------------------------------ pages
  function home() {
    const drillCards = Object.keys(OR.chapters).map(Number).map((ch) => {
      const ids = OR.topics.filter((t) => t.ch === ch).flatMap((t) => t.drills).filter((id) => OR.drills[id]);
      return ids.length ? `<h3 class="subsec">${OR.chapters[ch]}</h3><div class="cards">${ids.map((id) => drillCard(OR.drills[id])).join('')}</div>` : '';
    }).join('');
    const p = OR.progress.all();
    const rows = OR.topics
      .map((t) => {
        const c = p['concept:' + t.id];
        const ds = t.drills.map((d) => p['drill:' + d]).filter(Boolean);
        const dc = ds.reduce((s, e) => s + e.c, 0), dt = ds.reduce((s, e) => s + e.t, 0);
        const cell = (v, n) => (v === null ? '<td class="muted">—</td>' : `<td><span class="badge ${v >= 80 ? 'hi' : v >= 50 ? 'mid' : 'lo'}">%${v}</span> <small class="muted">${n}</small></td>`);
        return `<tr><td><a href="#/t/${t.id}">${OR.topicLabel(t)} ${esc(t.title)}</a></td>${cell(pct(c), c ? c.t + ' soru' : '')}${cell(dt ? Math.round((100 * dc) / dt) : null, dt ? dt + ' adım' : '')}</tr>`;
      })
      .join('');
    main.innerHTML = `
      <section class="hero">
        <h1>OR 2 Asistanı</h1>
        <p>Ders notlarının (Topcu &amp; Kabak) tamamı: <b>IP formülasyonu ve çözümü</b>, <b>Goal Programming</b>,
        <b>Nonlinear Programming</b>, <b>Interior Point</b> ve <b>Dynamic Programming</b>.</p>
        <div class="how">
          <div><b>1 · Özet</b><br>Her konunun kısa, Türkçe özeti (terimler İngilizce, sınavdaki gibi).</div>
          <div><b>2 · Kavram Testi</b><br>Notlardaki tanım ve formülasyonlara dayalı çoktan seçmeli sorular.</div>
          <div><b>3 · Alıştırma</b><br>Her seferinde <b>yeni sayılarla üretilen</b> problemler, adım adım çözülür ve anında kontrol edilir.</div>
          <div><b>4 · Karışık Quiz</b><br>Seçtiğin konulardan rastgele soru + üretilmiş problemlerle deneme sınavı.</div>
        </div>
        <div class="herobtns"><a class="btn primary" href="#/t/2.4">B&amp;B'ye başla →</a><a class="btn ghost" href="#/quiz">🎯 Karışık quiz</a><a class="btn ghost" href="#/t/1.0">Baştan başla</a><a class="btn ghost" href="#/t/3.0">GP</a><a class="btn ghost" href="#/t/4.1">NLP</a><a class="btn ghost" href="#/t/6.1">DP</a></div>
        <p class="disclaimer">Prof. Dr. Y. İlker Topcu &amp; Prof. Dr. Özgür Kabak'ın <i>Operations Research II</i> ders notlarına dayanan, <b>gayriresmî</b> bir çalışma aracıdır; hocalar veya İTÜ ile bağlantılı değildir. Notlardaki örneklerin çoğu Winston, <i>Operations Research: Applications and Algorithms</i> kaynaklıdır. Bu sitedeki özet ve sorularda hata olabilir; bir yerde emin olamazsan ders notlarını esas al.</p>
      </section>
      <h2 class="sec">🧮 Problem üreticileri</h2>
      ${drillCards || '<p class="muted">Yükleniyor…</p>'}
      <h2 class="sec">📈 İlerleme</h2>
      <table class="prog"><tr><th>Konu</th><th>Kavram testi</th><th>Alıştırmalar</th></tr>${rows}</table>
      <p><button class="btn ghost sm" id="resetp">İlerlemeyi sıfırla</button></p>`;
    document.getElementById('resetp').addEventListener('click', () => {
      if (confirm('Tüm ilerleme kaydı silinsin mi?')) { OR.progress.reset(); home(); }
    });
  }

  function drillCard(d) {
    const t = OR.topicById(d.topic);
    return `<a class="dcard" href="#/d/${d.id}">
      <div class="dtop"><span class="dtopic">${t ? t.id : ''}</span>${(() => { const e = OR.progress.get('drill:' + d.id); return e ? `<span class="badge ${pct(e) >= 80 ? 'hi' : pct(e) >= 50 ? 'mid' : 'lo'}">%${pct(e)} · ${e.n}×</span>` : ''; })()}</div>
      <div class="dtitle">${esc(d.title)}</div>
      <div class="ddesc">${d.description || ''}</div>
      <div class="dgo">Başla →</div></a>`;
  }

  function topicNavLinks(t) {
    const i = OR.topics.indexOf(t);
    const prev = OR.topics[i - 1], next = OR.topics[i + 1];
    return `<div class="pn">${prev ? `<a class="btn ghost" href="#/t/${prev.id}">← ${OR.topicLabel(prev)} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn ghost" href="#/t/${next.id}">${next.id} ${esc(next.title)} →</a>` : ''}</div>`;
  }

  function topicPage(id, tab) {
    const t = OR.topicById(id);
    if (!t) return home();
    const concepts = OR.content.concepts[id] || [];
    const drills = t.drills.filter((d) => OR.drills[d]);
    tab = tab || 'ozet';
    const tabs = `
      <div class="tabs">
        <a class="tab ${tab === 'ozet' ? 'active' : ''}" href="#/t/${id}/ozet">📖 Özet</a>
        <a class="tab ${tab === 'kavram' ? 'active' : ''}" href="#/t/${id}/kavram">✅ Kavram Testi <span class="cnt">${concepts.length}</span></a>
        ${drills.length ? `<a class="tab ${tab === 'alistirma' ? 'active' : ''}" href="#/t/${id}/alistirma">🧮 Alıştırma <span class="cnt">${drills.length}</span></a>` : ''}
      </div>`;
    main.innerHTML = `
      <div class="crumb">${OR.chapters[t.ch]} › ${OR.topicLabel(t)}</div>
      <h1 class="ttl">${OR.topicLabel(t)} · ${esc(t.title)} <small>ders notu s. ${t.page}</small></h1>
      ${tabs}
      <div class="tabbody"></div>`;
    const body = main.querySelector('.tabbody');
    if (tab === 'ozet') {
      const s = OR.content.summaries[id];
      body.innerHTML = `<article class="summary card">${s || '<p class="muted">Bu konunun özeti henüz eklenmedi.</p>'}</article>
        <div class="after">
          ${concepts.length ? `<a class="btn primary" href="#/t/${id}/kavram">Kavram testine geç (${concepts.length} soru) →</a>` : ''}
          ${drills.map((d) => `<a class="btn ${concepts.length ? 'ghost' : 'primary'}" href="#/d/${d}">🧮 ${esc(OR.drills[d].title)}</a>`).join('')}
        </div>
        ${topicNavLinks(t)}`;
    } else if (tab === 'kavram') {
      if (!concepts.length) {
        body.innerHTML = '<p class="muted">Bu konu için kavram sorusu yok.</p>';
        return;
      }
      const ex = OR.runner.mcqExercise(`Kavram Testi · ${OR.topicLabel(t)}`, `${concepts.length} soru. Her sorunun ardından açıklama gösterilir. Puan, <b>ilk denemedeki</b> doğrulara göre hesaplanır.`, concepts);
      const host = document.createElement('div');
      body.appendChild(host);
      OR.runner.mount(host, ex, {
        onDone: (r) => { if (!r.revealed) OR.progress.add('concept:' + id, r.correct, r.total); },
        onNew: () => topicPage(id, 'kavram'),
        noFocus: true,
      });
      body.insertAdjacentHTML('beforeend', topicNavLinks(t));
    } else {
      body.innerHTML = `<div class="cards">${drills.map((d) => drillCard(OR.drills[d])).join('')}</div>${topicNavLinks(t)}`;
    }
  }

  function optionsForm(d, opts) {
    if (!d.options || !d.options.length) return '';
    return `<form class="dopts">${d.options
      .map((o) => {
        if (o.type === 'checkbox')
          return `<label class="dopt"><input type="checkbox" name="${o.key}" ${opts[o.key] ? 'checked' : ''}> ${o.label}</label>`;
        return `<label class="dopt">${o.label} <select name="${o.key}">${o.choices
          .map((c) => `<option value="${esc(c.value)}" ${String(opts[o.key]) === String(c.value) ? 'selected' : ''}>${esc(c.label)}</option>`)
          .join('')}</select></label>`;
      })
      .join('')}</form>`;
  }

  function drillPage(id, seedStr) {
    const d = OR.drills[id];
    if (!d) {
      main.innerHTML = `<p>Alıştırma bulunamadı: ${esc(id)}</p>`;
      return;
    }
    const seed = seedStr ? parseInt(seedStr, 10) : OR.newSeed();
    if (!seedStr) {
      history.replaceState(null, '', `#/d/${id}/${seed}`);
    }
    const t = OR.topicById(d.topic);
    const opts = OR.drillOpts.get(id);
    main.innerHTML = `
      <div class="crumb">${t ? `<a href="#/t/${t.id}">${OR.topicLabel(t)} ${esc(t.title)}</a> › Alıştırma` : ''}</div>
      ${d.description ? `<p class="ddesc-top">${d.description}</p>` : ''}
      ${optionsForm(d, opts)}
      <div class="drillhost"></div>`;
    const form = main.querySelector('.dopts');
    if (form)
      form.addEventListener('change', () => {
        const o = {};
        d.options.forEach((op) => {
          const el = form.elements[op.key];
          o[op.key] = op.type === 'checkbox' ? el.checked : el.value;
        });
        OR.drillOpts.set(id, o);
        drillPage(id, String(seed));
      });
    const host = main.querySelector('.drillhost');
    let ex;
    try {
      ex = d.generate(OR.rng(seed), opts);
    } catch (e) {
      console.error(e);
      host.innerHTML = `<div class="card err">Problem üretilemedi (${esc(e.message)}). <a href="#/d/${id}/${OR.newSeed()}">Tekrar dene</a></div>`;
      return;
    }
    OR.runner.mount(host, ex, {
      meta: `<span class="seed" title="Bu bağlantı aynı problemi tekrar açar">#${seed}</span>`,
      onDone: (r) => { if (!r.revealed) OR.progress.add('drill:' + id, r.correct, r.total); },
      onNew: () => { location.hash = `#/d/${id}/${OR.newSeed()}`; },
    });
  }

  // ------------------------------------------------------------ mixed quiz
  let quizSession = null;
  function quizPage() {
    const tIdx = (id) => OR.topics.findIndex((t) => t.id === id);
    const allDrills = Object.values(OR.drills).sort((a, b) => tIdx(a.topic) - tIdx(b.topic));
    main.innerHTML = `
      <h1 class="ttl">🎯 Karışık Quiz</h1>
      <p class="muted">Seçtiğin konulardan rastgele kavram soruları + (istersen) üretilmiş problemler. Deneme sınavı gibi kullan.</p>
      <form class="card quizform">
        <div class="qcol">
          <div class="qh">Konular <button type="button" class="btn ghost sm" data-sel="all">Tümü</button><button type="button" class="btn ghost sm" data-sel="bnb">B&amp;B (2.4–2.8)</button>${Object.keys(OR.chapters).map((ch) => `<button type="button" class="btn ghost sm" data-sel="ch${ch}">Bölüm ${ch}</button>`).join('')}<button type="button" class="btn ghost sm" data-sel="none">Hiçbiri</button></div>
          ${OR.topics
            .map((t) => `<label class="qt"><input type="checkbox" name="topic" value="${t.id}" checked> ${OR.topicLabel(t)} ${esc(t.title)} <small class="muted">(${(OR.content.concepts[t.id] || []).length})</small></label>`)
            .join('')}
        </div>
        <div class="qcol">
          <div class="qh">Ayarlar</div>
          <label class="dopt">Kavram sorusu sayısı <input type="number" name="n" value="12" min="0" max="80"></label>
          <div class="qh" style="margin-top:14px">Eklenecek üretilmiş problemler</div>
          ${allDrills
            .map((d) => `<label class="qt"><input type="checkbox" name="drill" value="${d.id}" ${['bnb-pure', 'bnb-knapsack', 'tsp-nnh'].includes(d.id) ? 'checked' : ''}> ${esc(d.title)} <small class="muted">(${d.topic})</small></label>`)
            .join('')}
          <button class="btn primary" type="submit" style="margin-top:16px">Quiz'i başlat →</button>
        </div>
      </form>`;
    const form = main.querySelector('form');
    form.querySelectorAll('[data-sel]').forEach((b) =>
      b.addEventListener('click', () => {
        const m = b.dataset.sel;
        form.querySelectorAll('input[name=topic]').forEach((c) => {
          const t = OR.topicById(c.value), i = OR.topics.indexOf(t);
          c.checked = m === 'all' || (m === 'bnb' && i >= tIdx('2.4') && i <= tIdx('2.8')) || m === 'ch' + t.ch;
        });
      })
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const topics = [...form.querySelectorAll('input[name=topic]:checked')].map((c) => c.value);
      const drills = [...form.querySelectorAll('input[name=drill]:checked')].map((c) => c.value);
      const n = Math.max(0, parseInt(form.elements.n.value, 10) || 0);
      const rng = OR.rng(OR.newSeed());
      const pool = [];
      topics.forEach((id) => (OR.content.concepts[id] || []).forEach((q) => pool.push(Object.assign({ _t: id }, q))));
      const picked = rng.shuffle(pool).slice(0, n);
      const items = [];
      if (picked.length) items.push({ key: 'quiz:mcq', make: () => OR.runner.mcqExercise(`Kavram soruları (${picked.length})`, 'Karışık konulardan.', picked, rng) });
      rng.shuffle(drills).forEach((id) =>
        items.push({ key: 'drill:' + id, make: () => OR.drills[id].generate(OR.rng(OR.newSeed()), OR.drillOpts.get(id)) })
      );
      if (!items.length) return alert('En az bir konu/soru ya da problem seç.');
      quizSession = { items, i: 0, scores: [] };
      runQuizItem();
    });
  }
  function runQuizItem() {
    const s = quizSession;
    if (!s) return quizPage();
    if (s.i >= s.items.length) {
      const c = s.scores.reduce((a, r) => a + r.correct, 0), t = s.scores.reduce((a, r) => a + r.total, 0);
      const p = t ? Math.round((100 * c) / t) : 0;
      main.innerHTML = `<h1 class="ttl">🎯 Quiz sonucu</h1>
        <div class="card endcard"><div class="score ${p >= 80 ? 'hi' : p >= 50 ? 'mid' : 'lo'}">${c}/${t} <small>%${p}</small></div>
        <table class="prog">${s.scores.map((r) => `<tr><td>${esc(r.title)}</td><td>${r.correct}/${r.total}</td></tr>`).join('')}</table>
        <div class="endbtns"><a class="btn primary" href="#/quiz">Yeni quiz</a><a class="btn ghost" href="#/">Ana sayfa</a></div></div>`;
      quizSession = null;
      return;
    }
    const item = s.items[s.i];
    let ex;
    try { ex = item.make(); } catch (e) { console.error(e); s.i++; return runQuizItem(); }
    main.innerHTML = `<div class="crumb">🎯 Karışık Quiz › Bölüm ${s.i + 1}/${s.items.length}</div><div class="drillhost"></div>`;
    OR.runner.mount(main.querySelector('.drillhost'), ex, {
      noFocus: true,
      onDone: (r) => {
        s.scores[s.i] = { title: ex.title, correct: r.correct, total: r.total };
        if (item.key.startsWith('drill:') && !r.revealed) OR.progress.add(item.key, r.correct, r.total);
      },
      nextLabel: s.i + 1 < s.items.length ? 'Sonraki bölüm →' : 'Sonucu gör →',
      onNext: () => { s.i++; runQuizItem(); window.scrollTo(0, 0); },
    });
  }

  function cheatPage() {
    main.innerHTML = `<h1 class="ttl">📇 Formül Kartı</h1><article class="summary card">${OR.content.cheatsheet || '<p class="muted">Henüz eklenmedi.</p>'}</article>`;
  }

  // ------------------------------------------------------------ router
  function route() {
    const parts = (location.hash.slice(1) || '/').split('/').filter(Boolean);
    document.body.classList.remove('nav-open');
    if (!parts.length) home();
    else if (parts[0] === 't') topicPage(parts[1], parts[2]);
    else if (parts[0] === 'd') drillPage(parts[1], parts[2]);
    else if (parts[0] === 'quiz') { if (quizSession && parts[1] === 'run') runQuizItem(); else quizPage(); }
    else if (parts[0] === 'cheat') cheatPage();
    else home();
    renderNav();
    window.scrollTo(0, 0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    shell();
    window.addEventListener('hashchange', route);
    route();
  });
})();
