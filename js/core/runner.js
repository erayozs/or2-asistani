/* Exercise runner — renders a multi-step interactive exercise.

   Exercise = {
     title: string,
     statement: html,                  // problem text shown at top
     viz?: vizSpec,                    // initial right-panel visualization (see viz.js)
     steps: [Step],
     solution?: html                   // shown when finished
   }
   Step = {
     prompt: html,
     kind: 'number' | 'choice' | 'multi' | 'sequence' | 'text' | 'info',
     // number:
     fields?: [{ label: html, answer: Frac|number|string, tol?: number }],
     infeasible?: bool,                // true if the correct answer is "infeasible"
     offerInfeasible?: bool,           // show an "Infeasible" checkbox
     // choice / multi:
     options?: [{ html, correct: bool }],
     keepOrder?: bool,                 // do not shuffle options
     // sequence (e.g. a tour "1-5-2-4-3-1"):
     sequence?: { answer: [string|number], allowReverse?: bool, placeholder?: string },
     // text:
     answers?: [string],               // accepted answers (case/space-insensitive)
     hint?: html,
     explain?: html,                   // shown after answering / revealing
     viz?: vizSpec,                    // becomes the panel content AFTER this step is answered
     vizDuring?: vizSpec               // panel content WHILE this step is being answered
   }
   OR.runner.mount(el, exercise, { onDone({correct,total}), onNew(), meta: html, nextLabel, onNext() }) */
(function () {
  const OR = window.OR;
  const esc = (s) => OR.util.esc(s);

  const fmt = (v) => {
    if (v == null) return '';
    if (v instanceof OR.Frac) return v.show();
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : OR.F(v).show();
    const p = OR.Frac.parse(v);
    return p ? p.show() : String(v);
  };
  const tokens = (s) => String(s).split(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü]+/).filter(Boolean).map((t) => t.toLowerCase());
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, '').replace(/−/g, '-');

  function mount(root, ex, cfg) {
    cfg = cfg || {};
    const hasViz = !!ex.viz || ex.steps.some((s) => s.viz || s.vizDuring);
    const scored = ex.steps.filter((s) => s.kind !== 'info').length;
    let currentViz = ex.viz || null;
    const results = [];

    root.innerHTML = `
      <div class="ex ${hasViz ? 'has-viz' : ''}">
        <div class="ex-head">
          <h2>${ex.title || ''}</h2>
          <div class="ex-tools">
            ${cfg.meta || ''}
            <button class="btn ghost sm" data-act="revealAll" title="Kalan tüm adımların cevabını göster">Çözümü göster</button>
          </div>
        </div>
        <div class="ex-statement card">${ex.statement || ''}</div>
        ${hasViz ? '<aside class="ex-viz"><div class="ex-viz-inner"></div></aside>' : ''}
        <ol class="ex-steps"></ol>
        <div class="ex-end"></div>
      </div>`;
    const stepsEl = root.querySelector('.ex-steps');
    const vizEl = root.querySelector('.ex-viz-inner');
    const endEl = root.querySelector('.ex-end');
    const showViz = (spec) => {
      if (vizEl) vizEl.innerHTML = spec ? OR.viz.render(spec) : '<div class="viz-empty">Görsel burada belirecek</div>';
    };
    showViz(currentViz);

    let idx = -1;
    let revealingAll = false;

    function next() {
      idx++;
      if (idx >= ex.steps.length) return finish();
      renderStep(ex.steps[idx], idx);
    }

    function renderStep(step, i) {
      const li = document.createElement('li');
      li.className = 'step cur';
      const scoredBefore = ex.steps.slice(0, i).filter((s) => s.kind !== 'info').length;
      const label = step.kind === 'info' ? 'Bilgi' : `Soru ${scoredBefore + 1}/${scored}`;
      li.innerHTML = `
        <div class="step-n">${label}</div>
        <div class="step-prompt">${step.prompt || ''}</div>
        <div class="step-input"></div>
        <div class="step-actions"></div>
        <div class="step-hint" hidden></div>
        <div class="step-fb"></div>
        <div class="step-explain" hidden></div>
        <div class="step-next" hidden><button class="btn primary next">Devam →</button></div>`;
      stepsEl.appendChild(li);
      const inputEl = li.querySelector('.step-input');
      const actEl = li.querySelector('.step-actions');
      const fbEl = li.querySelector('.step-fb');
      const hintEl = li.querySelector('.step-hint');
      const explEl = li.querySelector('.step-explain');
      const nextWrap = li.querySelector('.step-next');
      const nextBtn = li.querySelector('.next');
      if (step.vizDuring) showViz(step.vizDuring);

      let attempts = 0;
      let firstOk = null;
      let done = false;

      // ---------- build inputs
      let getState; // returns {ok, invalidMsg?, mark()}
      let showAnswer; // displays the correct answer
      if (step.kind === 'number') {
        const fields = step.fields || [];
        inputEl.innerHTML =
          `<div class="fields">${fields
            .map((f, k) => `<label class="fld"><span>${f.label} =</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-k="${k}" placeholder="ör. 15/4"></label>`)
            .join('')}</div>` +
          (step.offerInfeasible ? `<label class="infbox"><input type="checkbox" class="infchk"> Infeasible (uygun çözüm yok)</label>` : '');
        const ins = [...inputEl.querySelectorAll('input[data-k]')];
        const inf = inputEl.querySelector('.infchk');
        if (inf) inf.addEventListener('change', () => ins.forEach((x) => (x.disabled = inf.checked)));
        getState = () => {
          if (inf && inf.checked) return { ok: !!step.infeasible };
          if (step.infeasible) {
            const anyFilled = ins.some((x) => x.value.trim() !== '');
            if (!anyFilled) return { invalidMsg: 'Değer gir ya da “Infeasible” kutusunu işaretle.' };
            return { ok: false };
          }
          let ok = true;
          for (let k = 0; k < fields.length; k++) {
            const r = OR.checkNum(ins[k].value, fields[k].answer, fields[k].tol);
            if (!r.parsed) return { invalidMsg: `“${OR.util.esc(ins[k].value || ' ')}” geçerli bir sayı değil. Kesir (15/4) ya da ondalık (3.75) yaz.` };
            ins[k].classList.toggle('bad', !r.ok);
            ins[k].classList.toggle('good', r.ok);
            ok = ok && r.ok;
          }
          return { ok };
        };
        showAnswer = () =>
          step.infeasible
            ? '<b>Infeasible</b>'
            : fields.map((f) => `${f.label} = <b>${esc(fmt(f.answer))}</b>`).join(', ');
      } else if (step.kind === 'choice' || step.kind === 'multi') {
        const multi = step.kind === 'multi';
        let opts = (step.options || []).map((o, k) => Object.assign({ k }, o));
        if (!step.keepOrder) opts = OR.rng(OR.newSeed()).shuffle(opts);
        inputEl.innerHTML = `<div class="opts ${multi ? 'multi' : ''}">${opts
          .map((o) => `<button type="button" class="opt" data-k="${o.k}"><span class="box"></span><span class="otext">${o.html}</span></button>`)
          .join('')}</div>${multi ? '<div class="note">Birden fazla doğru seçenek olabilir.</div>' : ''}`;
        const btns = [...inputEl.querySelectorAll('.opt')];
        btns.forEach((b) =>
          b.addEventListener('click', () => {
            if (done) return;
            if (multi) b.classList.toggle('sel');
            else {
              btns.forEach((x) => x.classList.remove('sel'));
              b.classList.add('sel');
            }
          })
        );
        getState = () => {
          const sel = btns.filter((b) => b.classList.contains('sel')).map((b) => +b.dataset.k);
          if (!sel.length) return { invalidMsg: 'Bir seçenek seç.' };
          const correct = step.options.map((o, k) => (o.correct ? k : -1)).filter((k) => k >= 0);
          const ok = sel.length === correct.length && sel.every((k) => correct.includes(k));
          return { ok };
        };
        showAnswer = () => {
          btns.forEach((b) => {
            const o = step.options[+b.dataset.k];
            if (o.correct) b.classList.add('right');
            else if (b.classList.contains('sel')) b.classList.add('wrong');
          });
          return '';
        };
      } else if (step.kind === 'sequence') {
        const sq = step.sequence || {};
        inputEl.innerHTML = `<input type="text" class="seq" autocomplete="off" spellcheck="false" placeholder="${esc(sq.placeholder || 'ör. 1-5-2-4-3-1')}">`;
        const inp = inputEl.querySelector('input');
        getState = () => {
          const tk = tokens(inp.value);
          if (!tk.length) return { invalidMsg: 'Bir sıra gir (ör. 1-5-2-4-3-1).' };
          const ans = sq.answer.map((x) => String(x).toLowerCase());
          const same = (a, b) => a.length === b.length && a.every((x, k) => x === b[k]);
          const ok = same(tk, ans) || (sq.allowReverse && same(tk, ans.slice().reverse()));
          inp.classList.toggle('bad', !ok);
          inp.classList.toggle('good', ok);
          return { ok };
        };
        showAnswer = () => `<b>${esc(sq.answer.join('–'))}</b>${sq.allowReverse ? ' (ters yön de kabul)' : ''}`;
      } else if (step.kind === 'text') {
        inputEl.innerHTML = `<input type="text" class="txt" autocomplete="off" spellcheck="false">`;
        const inp = inputEl.querySelector('input');
        getState = () => {
          if (!inp.value.trim()) return { invalidMsg: 'Bir cevap yaz.' };
          const ok = (step.answers || []).some((a) => norm(a) === norm(inp.value));
          return { ok };
        };
        showAnswer = () => `<b>${esc((step.answers || [])[0] || '')}</b>`;
      } else {
        // info
        getState = null;
      }

      // ---------- actions
      const finalize = (ok, revealed) => {
        done = true;
        if (firstOk === null) firstOk = ok && !revealed;
        results[i] = step.kind === 'info' ? null : !!firstOk;
        li.classList.remove('cur');
        li.classList.add('done', step.kind === 'info' ? 'info' : firstOk ? 'ok' : 'nok');
        inputEl.querySelectorAll('input,button').forEach((x) => (x.disabled = true));
        actEl.innerHTML = '';
        const ans = showAnswer ? showAnswer() : '';
        if (step.kind !== 'info') {
          fbEl.innerHTML = firstOk
            ? `<span class="good">✓ Doğru</span>${ans && attempts > 1 ? '' : ''}`
            : `<span class="bad">${revealed && attempts === 0 ? '◌ Gösterildi' : '✗'}</span> ${ans ? 'Doğru cevap: ' + ans : ''}`;
          if (!firstOk && ok && attempts > 1) fbEl.innerHTML = `<span class="warn">✓ Doğru (ikinci denemede)</span>`;
        }
        if (step.explain) {
          explEl.innerHTML = step.explain;
          explEl.hidden = false;
        }
        if (step.viz) currentViz = step.viz;
        showViz(currentViz);
        if (revealingAll) return;
        nextWrap.hidden = false;
        nextBtn.focus({ preventScroll: true });
      };

      if (step.kind === 'info') {
        actEl.innerHTML = '';
        finalize(true, false);
      } else {
        actEl.innerHTML = `
          <button class="btn primary chk">Kontrol et</button>
          ${step.hint ? '<button class="btn ghost hintb">İpucu</button>' : ''}
          <button class="btn ghost rev">Cevabı göster</button>`;
        actEl.querySelector('.chk').addEventListener('click', () => {
          if (done) return;
          const s = getState();
          if (s.invalidMsg) {
            fbEl.innerHTML = `<span class="warn">${s.invalidMsg}</span>`;
            return;
          }
          attempts++;
          if (attempts === 1) firstOk = s.ok;
          if (s.ok) finalize(true, false);
          else fbEl.innerHTML = `<span class="bad">✗ Yanlış.</span> Tekrar dene ya da “Cevabı göster”e bas.`;
        });
        const hb = actEl.querySelector('.hintb');
        if (hb)
          hb.addEventListener('click', () => {
            hintEl.innerHTML = '💡 ' + step.hint;
            hintEl.hidden = false;
          });
        actEl.querySelector('.rev').addEventListener('click', () => {
          if (done) return;
          finalize(false, true);
        });
      }
      li._reveal = () => {
        if (!done) finalize(false, true);
      };
      nextBtn.addEventListener('click', () => {
        nextWrap.hidden = true;
        next();
      });
      li.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (!done) {
          const c = actEl.querySelector('.chk');
          if (c) c.click();
        } else if (!nextWrap.hidden) nextBtn.click();
      });
      const first = inputEl.querySelector('input');
      if (first && !cfg.noFocus) first.focus({ preventScroll: true });
      if (i > 0) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function finish() {
      const vals = results.filter((r) => r !== null && r !== undefined);
      const correct = vals.filter(Boolean).length;
      const total = scored;
      const pct = total ? Math.round((100 * correct) / total) : 100;
      endEl.innerHTML = `
        <div class="card endcard">
          <div class="score ${pct >= 80 ? 'hi' : pct >= 50 ? 'mid' : 'lo'}">${correct}/${total} <small>ilk denemede doğru · %${pct}</small></div>
          ${ex.solution ? `<div class="solution">${ex.solution}</div>` : ''}
          <div class="endbtns">
            ${cfg.onNext ? `<button class="btn primary" data-act="nextq">${cfg.nextLabel || 'Sonraki →'}</button>` : ''}
            ${cfg.onNew ? '<button class="btn primary" data-act="new">Yeni problem üret ↻</button>' : ''}
            <button class="btn ghost" data-act="again">Aynı problemi baştan çöz</button>
          </div>
        </div>`;
      endEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (usedRevealAll) endEl.querySelector('.score small').insertAdjacentHTML('beforeend', ' · çözüm gösterildi, ilerlemeye kaydedilmedi');
      revealBtn.disabled = true;
      if (cfg.onDone) cfg.onDone({ correct, total, revealed: usedRevealAll });
      const b1 = endEl.querySelector('[data-act=new]');
      if (b1) b1.addEventListener('click', () => cfg.onNew());
      const b2 = endEl.querySelector('[data-act=nextq]');
      if (b2) b2.addEventListener('click', () => cfg.onNext());
      endEl.querySelector('[data-act=again]').addEventListener('click', () => mount(root, ex, cfg));
    }

    let usedRevealAll = false;
    const revealBtn = root.querySelector('[data-act=revealAll]');
    revealBtn.addEventListener('click', () => {
      if (idx >= ex.steps.length) return;
      usedRevealAll = true;
      revealBtn.disabled = true;
      revealingAll = true;
      // reveal current + all remaining
      while (idx < ex.steps.length) {
        const cur = stepsEl.lastElementChild;
        if (cur && cur._reveal) cur._reveal();
        if (cur) {
          const nw = cur.querySelector('.step-next');
          if (nw) nw.hidden = true;
        }
        idx++;
        if (idx < ex.steps.length) renderStep(ex.steps[idx], idx);
      }
      revealingAll = false;
      finish();
    });

    next();
  }

  // Wrap concept MCQs as an exercise
  function mcqExercise(title, statement, items, rng) {
    const r = rng || OR.rng(OR.newSeed());
    return {
      title,
      statement,
      steps: r.shuffle(items).map((q) => {
        const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
        return {
          prompt: q.q,
          kind: Array.isArray(q.answer) ? 'multi' : 'choice',
          options: q.options.map((html, k) => ({ html, correct: ans.includes(k) })),
          keepOrder: !!q.keepOrder,
          explain: q.explain,
          hint: q.hint,
        };
      }),
    };
  }

  OR.runner = { mount, mcqExercise, fmt };
})();
