/* Chapter 6 (Deterministic Dynamic Programming) learning content: summaries + concept questions + cheatsheet section.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, Ch.6 (notes pages 83–117). Topics: 6.1 Two puzzles, 6.2 Network problem (Joe Cougar),
   6.3 Characteristics, 6.4 Inventory, 6.5 Resource allocation (+6.5.1 generalized), 6.5.2 Knapsack by DP, 6.6 Equipment replacement,
   6.7 Formulating recursions (6.7.1 discounting, 6.7.2 solving recursions, 6.7.3 nonadditive), 6.8 Wagner-Whitin & Silver-Meal.
   DP tables in the summaries are COMPUTED here by small solvers (see "solvers" below) and were cross-checked against the notes' values
   (f1(1)=2870, f1(0)=20, f1(6)=49, f1(10)=25, g(0)=1280, f1=900 ...). Numeric answers of the questions were verified by an independent script.
   Anything not in the notes is labeled "notlarda yok". The notes' figures (network arc lengths) are images: arc lengths below are the
   standard Winston 18.2 data and reproduce every f-value printed in the notes. */
(function () {
  const OR = window.OR;

  /* ------------------------------------------------------------------ helpers */
  const tbl = (head, rows, cls) =>
    `<table${cls ? ` class="${cls}"` : ''}><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>` +
    rows
      .map(
        (r) =>
          `<tr>${r
            .map((c) => (c && typeof c === 'object' ? `<td class="${c.cls}">${c.v}</td>` : `<td>${c}</td>`))
            .join('')}</tr>`
      )
      .join('') +
    '</table>';
  const hl = (v) => ({ cls: 'hl', v });

  /* ------------------------------------------------------------------ solvers (for summary tables) */
  // --- Inventory (Example 6.4): d = [1,3,2,4], c(x) = 3 + x (x>0), h = 1/2, x <= 5, ending inventory <= 4
  const INV = { d: [null, 1, 3, 2, 4], cap: 5, imax: 4, h: 0.5 };
  const cprod = (x) => (x === 0 ? 0 : 3 + x);
  const invF = { 5: [0, 0, 0, 0, 0] };
  const invRows = {};
  for (let t = 4; t >= 1; t--) {
    invF[t] = [];
    invRows[t] = [];
    for (let i = 0; i <= INV.imax; i++) {
      let best = Infinity;
      const rows = [];
      for (let x = 0; x <= INV.cap; x++) {
        const e = i + x - INV.d[t];
        if (e < 0 || e > INV.imax) continue;
        const own = INV.h * e + cprod(x);
        const tot = own + invF[t + 1][e];
        rows.push({ i, x, e, own, nxt: invF[t + 1][e], tot });
        if (tot < best) best = tot;
      }
      rows.forEach((r) => (r.min = Math.abs(r.tot - best) < 1e-9));
      invF[t][i] = best;
      invRows[t].push(...rows);
    }
  }
  const invTable = (t) => {
    const nm = t === 3 ? 2 : t === 2 ? 3 : 1;
    const head = ['i', 'x', `(½)(i+x−${nm}) + c(x)`, `f<sub>${t + 1}</sub>(i+x−${nm})`, `Total cost (months ${t}–4)`, `f<sub>${t}</sub>(i)`];
    const rows = invRows[t].map((r) => {
      const first = invRows[t].find((q) => q.i === r.i && q.min) === r;
      const own = `${INV.h * r.e} + ${cprod(r.x)} = ${r.own}`;
      const row = [r.i, r.x, own, r.nxt, r.min ? hl(r.tot + ' *') : r.tot];
      if (first) row.push({ cls: 'hl', v: `f<sub>${t}</sub>(${r.i}) = ${invF[t][r.i]}` });
      else row.push('');
      return row;
    });
    return tbl(head, rows, 'mtx');
  };

  // --- Resource allocation (Example 6.5)
  const RA = {
    r: [null, [0, 9, 16, 23, 30, 37, 44], [0, 10, 13, 16, 19, 22, 25], [0, 9, 13, 17, 21, 25, 29]],
  };
  const raF = { 4: [0, 0, 0, 0, 0, 0, 0] };
  const raX = {};
  for (let t = 3; t >= 1; t--) {
    raF[t] = [];
    raX[t] = [];
    for (let d = 0; d <= 6; d++) {
      let b = -1,
        bx = 0;
      for (let k = 0; k <= d; k++) {
        const v = RA.r[t][k] + raF[t + 1][d - k];
        if (v > b) {
          b = v;
          bx = k;
        }
      }
      raF[t][d] = b;
      raX[t][d] = bx;
    }
  }
  const raTable = (t, ds) => {
    const rows = [];
    ds.forEach((d) => {
      for (let k = 0; k <= d; k++) {
        const v = RA.r[t][k] + raF[t + 1][d - k];
        const isMax = v === raF[t][d];
        rows.push([d, k, RA.r[t][k], raF[t + 1][d - k], isMax ? hl(v + ' *') : v, k === raX[t][d] ? `f<sub>${t}</sub>(${d}) = ${raF[t][d]}, x<sub>${t}</sub>(${d}) = ${raX[t][d]}` : '']);
      }
    });
    return tbl([`d<sub>${t}</sub>`, `x<sub>${t}</sub>`, `r<sub>${t}</sub>(x<sub>${t}</sub>)`, `f<sub>${t + 1}</sub>(d<sub>${t}</sub>−x<sub>${t}</sub>)`, `NPV (inv. ${t}–3)`, `f<sub>${t}</sub>, x<sub>${t}</sub>`], rows, 'mtx');
  };

  // --- Knapsack (Example 6.6): weights 4,3,5, benefits 11,7,12, W = 10
  const KS = { w: [4, 3, 5], b: [11, 7, 12] };
  const ksF = { 4: Array(11).fill(0) };
  const ksX = {};
  for (let t = 3; t >= 1; t--) {
    ksF[t] = [];
    ksX[t] = [];
    for (let d = 0; d <= 10; d++) {
      let best = -1,
        bx = 0;
      for (let k = 0; k * KS.w[t - 1] <= d; k++) {
        const v = KS.b[t - 1] * k + ksF[t + 1][d - k * KS.w[t - 1]];
        if (v > best) {
          best = v;
          bx = k;
        }
      }
      ksF[t][d] = best;
      ksX[t][d] = bx;
    }
  }
  const ksG = [0];
  for (let W = 1; W <= 10; W++) {
    let best = 0;
    for (let j = 0; j < 3; j++) if (KS.w[j] <= W) best = Math.max(best, KS.b[j] + ksG[W - KS.w[j]]);
    ksG[W] = best;
  }

  // --- Wagner-Whitin (Example 6.14): K=30, c=5, h=1, d = 40,60,10,20,25
  const WW = { K: 30, c: 5, h: 1, d: [null, 40, 60, 10, 20, 25] };
  const wwCost = (t, j) => {
    let q = 0,
      hc = 0;
    for (let k = t; k <= j; k++) {
      q += WW.d[k];
      hc += WW.h * (k - t) * WW.d[k];
    }
    return { q, hc, tot: WW.K + WW.c * q + hc };
  };
  const wwF = { 6: 0 };
  const wwJ = {};
  for (let t = 5; t >= 1; t--) {
    let best = Infinity;
    for (let j = t; j <= 5; j++) best = Math.min(best, wwCost(t, j).tot + wwF[j + 1]);
    wwF[t] = best;
    wwJ[t] = [];
    for (let j = t; j <= 5; j++) if (wwCost(t, j).tot + wwF[j + 1] === best) wwJ[t].push(j);
  }
  const wwTable = () => {
    const rows = [];
    for (let t = 5; t >= 1; t--)
      for (let j = t; j <= 5; j++) {
        const c = wwCost(t, j);
        const tot = c.tot + wwF[j + 1];
        const isMin = tot === wwF[t];
        rows.push([t, j, `${WW.K} + ${WW.c}(${c.q}) + ${c.hc} = ${c.tot}`, wwF[j + 1], isMin ? hl(tot + ' *') : tot, isMin && j === wwJ[t][0] ? `f<sub>${t}</sub> = ${wwF[t]}` : '']);
      }
    return tbl(['t', 'j (period t produces for t…j)', 'c<sub>tj</sub> = K + c·Σd + holding', `f<sub>j+1</sub>`, 'c<sub>tj</sub> + f<sub>j+1</sub>', ''], rows, 'mtx');
  };

  /* ====================================================================== 6.1 */
  OR.content.summaries['6.1'] = `
<h2>6. Deterministic Dynamic Programming · 6.1 Two Puzzles</h2>
<p><b>Dynamic Programming (DP)</b>, birçok optimizasyon problemini çözmekte kullanılan bir tekniktir. Çoğu uygulamada DP, problemin <b>sonundan başına doğru geriye çalışarak (working backward)</b> çözüm üretir: büyük ve hantal problemi, daha küçük ve kolay çözülür bir dizi alt probleme böler. Bu bölüm, geriye çalışmanın "zor görünen" bir problemi nasıl neredeyse trivial yaptığını iki bulmacayla gösterir.</p>

<h3>Example 6.1 – Match Puzzle (Winston 18.1)</h3>
<div class="box">Masada <b>30 kibrit</b> var. İki oyuncu (rakibim ve ben) sırayla <b>1, 2 veya 3 kibrit</b> alır. Ben başlarım. <b>Son kibriti alan oyuncu kaybeder ("loser")</b>. Kazanmayı nasıl garantilerim?</div>
<ul>
  <li>Sonda: rakibin sırası geldiğinde masada <b>1 kibrit</b> kalmışsa kesin kazanırım (son kibriti almak zorunda).</li>
  <li>Bir adım geriye: rakibin sırası geldiğinde <b>5 kibrit</b> kalmışsa kazanırım. Örn. rakip 2 alırsa ben 2 alırım (rakip 1 alırsa ben 3, 3 alırsa ben 1): her turda toplam 4 kibrit gider, rakip yine 1 kibritle baş başa kalır.</li>
  <li>Aynı mantıkla rakibi <b>5, 9, 13, 17, 21, 25, 29</b> kibritle oynamaya zorlarsam zaferim kesindir. (Kalan sayı ≡ 1 mod 4.)</li>
  <li>30 − 29 = 1 ⇒ <b>ilk hamlede 1 kibrit almalıyım</b>; sonra rakibin aldığı a için ben 4 − a alırım.</li>
</ul>
<table class="mtx"><tr><th>Sıradaki oyuncunun önündeki kibrit</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>…</th><th>29</th><th>30</th></tr>
<tr><td>Sıradaki oyuncu</td><td class="m">kaybeder</td><td>kazanır (1 alır)</td><td>kazanır (2 alır)</td><td>kazanır (3 alır)</td><td class="m">kaybeder</td><td>kazanır (1)</td><td>…</td><td class="m">kaybeder</td><td>kazanır (1 alır)</td></tr></table>
<div class="tip">Not: Bu bölümde "state/stage" sözcükleri kullanılmaz; yalnızca <b>sondan başa çalışmanın</b> gücü vurgulanır. İleriye doğru deneme-yanılma ile 30 kibritli oyunu çözmek çok zordur.</div>

<h3>Example 6.2 – Milk Puzzle (Winston 18.1)</h3>
<div class="box">9 litrelik ve 4 litrelik iki kabım var. Annem tam <b>6 litre</b> süt getirmemi istedi. Nasıl yaparım?</div>
<ul>
  <li>Sondan başlarsak: <b>4 litrelik kapta tam 1 litre</b> süt elde edersem iş biter. Çünkü 9 litrelik kabı doldurur, 4 litrelik kaptaki 1 litrenin üstüne 3 litre boşaltırım (4 litrelik kap dolar); 9 litrelik kapta <b>6 litre</b> kalır.</li>
  <li>Notların tablosu (sütunlar: 9 L kabındaki, 4 L kabındaki litre) <b>başlangıç en altta, son çözüm en üstte</b> yazılır. Aşağıdan yukarı okuyunca:</li>
</ul>
<table class="mtx"><tr><th>Hamle</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th></tr>
<tr><td>9 L kap</td><td>0</td><td>9</td><td>5</td><td>5</td><td>1</td><td>1</td><td>0</td><td>9</td><td>6</td><td class="hl">6</td></tr>
<tr><td>4 L kap</td><td>0</td><td>0</td><td>4</td><td>0</td><td>4</td><td>0</td><td>1</td><td>1</td><td>4</td><td class="hl">0</td></tr>
<tr><td>Ne yapıldı</td><td>başlangıç</td><td>9'u doldur</td><td>9'dan 4'e aktar</td><td>4'ü boşalt</td><td>9'dan 4'e aktar</td><td>4'ü boşalt</td><td>9'daki 1 L'yi 4'e aktar</td><td>9'u doldur</td><td>9'dan 4'ü dolana dek aktar</td><td>4'ü boşalt</td></tr></table>
<p>Toplam <b>10 durum, 9 hamle</b>. Çözüm tablosu önce <i>hedef durumu (6, 0)</i> sonra onu mümkün kılan bir önceki durumları bularak (geriye doğru) kurulur.</p>

<div class="warnbox"><b>Sınavda dikkat:</b> Match puzzle'da <b>son kibriti alan KAYBEDER</b> (kazanan değil!) – bu yüzden "güvenli" kalan sayılar 1, 5, 9, …, 29'dur (1 mod 4). Son kibriti alanın kazandığı varyantta güvenli sayılar 4, 8, 12, … olurdu (notlarda yok). Milk puzzle'da hedef alt-hedef: <b>4 L kapta 1 L</b>.</div>
`;

  OR.content.concepts['6.1'] = [
    {
      q: 'Match puzzle (30 kibrit, her seferinde 1–3 kibrit alınır, <b>son kibriti alan kaybeder</b>). Rakibim oynarken masada kaç kibrit kalmışsa kazanmam garantidir?',
      options: ['1, 5, 9, 13, 17, 21, 25, 29', '4, 8, 12, 16, 20, 24, 28', '2, 6, 10, 14, 18, 22, 26, 30', '3, 6, 9, 12, 15, 18, 21, 24, 27'],
      answer: 0,
      explain: 'Sondan başlanır: rakibin sırasında 1 kibrit varsa o kaybeder. Bir tur (benim + rakibin hamlesi) toplam 4 kibrit götürecek şekilde oynarsam rakibin önündeki sayı 4 azalır: 1, 5, 9, …, 29 (1 mod 4).',
    },
    {
      q: 'Aynı oyunda 30 kibritle <b>ben başlıyorsam</b> ilk hamlede kaç kibrit almalıyım?',
      options: ['1', '2', '3', 'Fark etmez, ilk oyuncu her zaman kazanır'],
      answer: 0,
      keepOrder: true,
      explain: '30 − 1 = 29 kibrit bırakmalıyım (29 ≡ 1 mod 4). Sonra rakip a alırsa ben 4 − a alırım ve rakip hep 25, 21, …, 5, 1 ile karşılaşır.',
    },
    {
      q: 'Notlardaki çözümün temel fikri nedir?',
      options: [
        'Problemin <b>sonundan başlayıp başa doğru</b> (working backward) basit bir alt problemden karmaşığa ilerlemek',
        'Tüm olası oyunları sırayla (enumeration) denemek',
        'Başlangıçtan ileriye doğru greedy seçim yapmak',
        'Problemi LP olarak yazıp simplex ile çözmek',
      ],
      answer: 0,
      explain: 'Notlar: "We have solved this puzzle by working backward from the end of the problem toward the beginning." Son durum (1 kibrit) kolay çözülür, ondan önceki durumlar ona dayanır.',
    },
    {
      q: 'Match puzzle\'ı <b>27 kibritle</b> ben başlatıyorsam kazanmak için ilk hamlem ne olmalı?',
      options: ['2 kibrit (25 bırakırım)', '1 kibrit (26 bırakırım)', '3 kibrit (24 bırakırım)', 'Kazanmayı garantileyemem'],
      answer: 0,
      explain: 'Rakibe 1 mod 4 sayıda kibrit bırakmalıyım: 27 − 2 = 25 ≡ 1 (mod 4). (27 için bu hesap notlarda yok; 30 kibrit örneğinin aynı mantıkla genellenmesi.)',
    },
    {
      q: '<b>29 kibritle</b> ben başlıyorsam (rakip optimal oynar) durum nedir?',
      options: [
        'Kaybederim: 29 zaten güvenli (1 mod 4) sayı, rakip her hamleme 4−a ile cevap verir',
        'Kazanırım: 1 kibrit alırım',
        'Kazanırım: 3 kibrit alırım',
        'Oyun berabere biter',
      ],
      answer: 0,
      explain: '29 ≡ 1 (mod 4): hamle sırası kimdeyse (ben) o oyuncu kaybeder, çünkü hangi a ∈ {1,2,3} alırsam alayım rakip 4 − a alıp bana tekrar 1 mod 4 bırakır (25, 21, …, 1).',
    },
    {
      q: 'Milk puzzle\'da (9 L ve 4 L kap, tam 6 L istiyoruz) sondan başlayınca hangi <b>ara hedef</b> bulunur?',
      options: ['4 litrelik kapta tam 1 L süt', '9 litrelik kapta tam 5 L süt', '4 litrelik kapta tam 3 L süt', '9 litrelik kabın boş, 4 litrelik kabın dolu olması'],
      answer: 0,
      explain: '4 L kapta 1 L varsa, 9 L kabı doldurup 4 L kabı doldurana kadar (3 L) boşaltırım; 9 L kapta 9 − 3 = 6 L kalır.',
    },
    {
      q: 'Notlardaki milk puzzle tablosu (başlangıç en altta, son çözüm en üstte) 10 satırdır: (6,0), (6,4), (9,1), (0,1), (1,0), (1,4), (5,0), (5,4), (9,0), (0,0). Başlangıçtan hedefe <b>kaç hamle</b> yapılır?',
      options: ['9', '10', '8', '6'],
      answer: 0,
      explain: '10 durum arasında 9 geçiş (hamle) vardır: 9\'u doldur, 4\'e aktar, 4\'ü boşalt, 4\'e aktar, 4\'ü boşalt, 1 L\'yi 4\'e aktar, 9\'u doldur, 4\'ü tamamla, 4\'ü boşalt.',
    },
    {
      q: '(Notlarda yok – genelleme) Son kibriti alanın kaybettiği oyunda her seferinde <b>1, 2, 3 veya 4</b> kibrit alınabiliyorsa rakibi hangi sayılarla karşılaştırmak güvenlidir?',
      options: ['1, 6, 11, 16, … (1 mod 5)', '1, 5, 9, 13, … (1 mod 4)', '5, 10, 15, … (0 mod 5)', '4, 9, 14, … (4 mod 5)'],
      answer: 0,
      explain: 'Bir turda toplam 5 kibrit gidecek şekilde cevap verebilirim (a ve 5 − a), dolayısıyla güvenli sayılar 1 mod 5\'tir. Mantık aynı geriye çalışmadır (bu varyant notlarda yok).',
    },
  ];

  /* ====================================================================== 6.2 */
  const ARCS = [
    ['1→2', 550, '1→3', 900, '1→4', 770],
    ['2→5', 680, '2→6', 790, '2→7', 1050],
    ['3→5', 580, '3→6', 760, '3→7', 660],
    ['4→5', 510, '4→6', 700, '4→7', 830],
    ['5→8', 610, '5→9', 790, '6→8', 540],
    ['6→9', 940, '7→8', 790, '7→9', 270],
    ['8→10', 1030, '9→10', 1390, '', ''],
  ];
  OR.content.summaries['6.2'] = `
<h2>6.2 A Network Problem (Joe Cougar, Winston 18.2)</h2>
<p>DP'nin birçok uygulaması, bir ağda (network) iki nokta arasındaki <b>en kısa (veya en uzun) yolu</b> bulmaya indirgenir. Büyük ağlarda DP, tüm yolları tek tek sayma (explicit enumeration) yönteminden çok daha etkilidir.</p>
<div class="box"><b>Example 6.3 – Shortest Path.</b> Joe New York'tan Los Angeles'a gidecek; her geceyi bir arkadaşında geçirecek. 1 günde Columbus, Nashville veya Louisville'e; 2 günde Kansas City, Omaha veya Dallas'a; 3 günde San Antonio veya Denver'a; 4 günde Los Angeles'a varabilir. Toplam mil minimum olsun.</div>
<p>Şehirler 1…10 ile numaralanır: 1 = New York, 2 = Columbus, 3 = Nashville, 4 = Louisville, 5 = Kansas City, 6 = Omaha, 7 = Dallas, 8 = Denver, 9 = San Antonio, 10 = Los Angeles. c<sub>ij</sub> = i ile j arasındaki mesafe (örn. c<sub>35</sub> = 580). Şekil notlarda resim olarak verildiği için mesafeler burada tablo olarak yazılmıştır (notlardaki tüm f değerlerini üretir):</p>
${tbl(['arc', 'c', 'arc', 'c', 'arc', 'c'], ARCS, 'mtx')}

<h3>Stage, state, f<sub>t</sub>(i)</h3>
<ul>
  <li><b>Stage t</b> = Joe'nun t. günün <i>başında</i> bulunabileceği şehirler: stage 1 = {1}, stage 2 = {2,3,4}, stage 3 = {5,6,7}, stage 4 = {8,9}, stage 5 = {10}.</li>
  <li><b>State</b> = o stage'deki şehir (nereden geldiği önemsiz). <b>Decision</b> = bir sonraki şehir.</li>
  <li><b>f<sub>t</sub>(i)</b> = i şehri stage t'de iken i'den Los Angeles'a en kısa yolun uzunluğu.</li>
  <li><b>Recursion:</b> f<sub>t</sub>(i) = min<sub>j</sub> { c<sub>ij</sub> + f<sub>t+1</sub>(j) },  j ∈ stage t+1 şehirleri, <b>f<sub>5</sub>(10) = 0</b>. Çözüm <b>geriye</b> doğru: f<sub>4</sub> → f<sub>3</sub> → f<sub>2</sub> → f<sub>1</sub>.</li>
</ul>

<h3>Backward computations</h3>
<p><b>Stage 4:</b> Tek yol vardır: f<sub>4</sub>(8) = 1030, f<sub>4</sub>(9) = 1390.</p>
<p><b>Stage 3:</b></p>
<ul>
  <li>f<sub>3</sub>(5) = min{ c<sub>58</sub> + f<sub>4</sub>(8) = 610 + 1030 = <b>1640*</b>, c<sub>59</sub> + f<sub>4</sub>(9) = 790 + 1390 = 2180 } = 1640 (5-8-10)</li>
  <li>f<sub>3</sub>(6) = min{ 540 + 1030 = <b>1570*</b>, 940 + 1390 = 2330 } = 1570 (6-8-10)</li>
  <li>f<sub>3</sub>(7) = min{ 790 + 1030 = 1820, 270 + 1390 = <b>1660*</b> } = 1660 (7-9-10)</li>
</ul>
<p><b>Stage 2:</b></p>
<ul>
  <li>f<sub>2</sub>(2) = min{ 680 + 1640 = <b>2320*</b>, 790 + 1570 = 2360, 1050 + 1660 = 2710 } = 2320 (2-5-8-10)</li>
  <li>f<sub>2</sub>(3) = min{ 580 + 1640 = <b>2220*</b>, 760 + 1570 = 2330, 660 + 1660 = 2320 } = 2220 (3-5-8-10)</li>
  <li>f<sub>2</sub>(4) = min{ 510 + 1640 = <b>2150*</b>, 700 + 1570 = 2270, 830 + 1660 = 2490 } = 2150 (4-5-8-10)</li>
</ul>
<p><b>Stage 1:</b> f<sub>1</sub>(1) = min{ c<sub>12</sub> + f<sub>2</sub>(2) = 550 + 2320 = <b>2870*</b>, c<sub>13</sub> + f<sub>2</sub>(3) = 900 + 2220 = 3120, c<sub>14</sub> + f<sub>2</sub>(4) = 770 + 2150 = 2920 } = <b>2870</b>.</p>

${tbl(
  ['Stage', 'State i', 'f<sub>t</sub>(i)', 'Optimal next city'],
  [
    [4, 8, 1030, 10],
    [4, 9, 1390, 10],
    [3, 5, 1640, 8],
    [3, 6, 1570, 8],
    [3, 7, 1660, 9],
    [2, 2, 2320, 5],
    [2, 3, 2220, 5],
    [2, 4, 2150, 5],
    [1, 1, hl(2870), 2],
  ],
  'mtx'
)}
<div class="tip"><b>Optimal Solution and Report:</b> Retrace: 1 → 2 → 5 → 8 → 10, yani New York → Columbus → Kansas City → Denver → Los Angeles, toplam <b>2870 mil</b> (550 + 680 + 610 + 1030).</div>
<p>Bu ağda 1'den 10'a toplam 3·3·2 = 18 yol vardır; DP ise her arc'ı yalnızca <b>bir kez</b> değerlendirir (3 + 9 + 6 + 2 = 20 hesaplanan arc toplamı). Ağ büyüdükçe bu fark çok büyür.</p>
<div class="warnbox"><b>Sınavda dikkat:</b> c<sub>ij</sub> + f<sub>t+1</sub>(j) toplanır, f<sub>t</sub> için <b>her state'te tüm j seçenekleri</b> yazılır; geriye giderken f<sub>t+1</sub> tablosunu kullanırsın (ileriye değil). En <b>uzun</b> yol isteniyorsa min yerine max alınır (aynı tablo: f<sub>1</sub>(1) = 3990, notlarda yok).</div>
`;

  OR.content.concepts['6.2'] = [
    {
      q: 'Joe Cougar örneğinde <b>stage 3</b> şehirleri hangileridir?',
      options: ['Kansas City, Omaha, Dallas (5, 6, 7)', 'Columbus, Nashville, Louisville (2, 3, 4)', 'Denver, San Antonio (8, 9)', 'Los Angeles (10)'],
      answer: 0,
      explain: 'Stage t = Joe\'nun t. günün başında bulunabileceği şehirler. 2 gün yol sonrası (3. günün başı) Kansas City, Omaha veya Dallas\'tayız.',
    },
    {
      q: 'f<sub>t</sub>(i) neyi gösterir?',
      options: [
        'i şehri stage t\'de iken, i\'den Los Angeles\'a en kısa yolun uzunluğu',
        'New York\'tan i şehrine en kısa yolun uzunluğu',
        'Stage t\'deki tüm şehirlerin mesafeleri toplamı',
        'i şehrinden bir sonraki şehre giden arc\'ın uzunluğu',
      ],
      answer: 0,
      explain: 'Notlarda: "ft(i) the length of the shortest path from city i to Los Angeles, given that city i is a stage t city." Backward DP\'de f hep <i>kalan</i> maliyeti verir.',
    },
    {
      q: 'Joe probleminin recursion\'ı hangisidir?',
      options: [
        'f<sub>t</sub>(i) = min<sub>j</sub>{ c<sub>ij</sub> + f<sub>t+1</sub>(j) },  f<sub>5</sub>(10) = 0',
        'f<sub>t</sub>(i) = min<sub>j</sub>{ c<sub>ij</sub> + f<sub>t−1</sub>(j) },  f<sub>0</sub>(1) = 0',
        'f<sub>t</sub>(i) = max<sub>j</sub>{ c<sub>ij</sub> + f<sub>t+1</sub>(j) },  f<sub>5</sub>(10) = 0',
        'f<sub>t</sub>(i) = min<sub>j</sub>{ c<sub>ij</sub> · f<sub>t+1</sub>(j) },  f<sub>5</sub>(10) = 1',
      ],
      answer: 0,
      explain: 'Kalan en kısa mesafe = i\'den j\'ye giden arc + j\'den LA\'ya en kısa mesafe; j stage t+1 şehridir ve LA\'da kalan mesafe 0 olduğu için f<sub>5</sub>(10) = 0.',
    },
    {
      q: 'f<sub>3</sub>(5) (Kansas City → LA) kaçtır? (c<sub>58</sub> = 610, c<sub>59</sub> = 790, f<sub>4</sub>(8) = 1030, f<sub>4</sub>(9) = 1390)',
      options: ['1640', '2180', '1030', '1570'],
      answer: 0,
      explain: 'f<sub>3</sub>(5) = min{610 + 1030, 790 + 1390} = min{1640, 2180} = 1640; en kısa yol 5-8-10.',
    },
    {
      q: 'f<sub>3</sub>(7) (Dallas → LA) için en kısa yol ve uzunluğu? (c<sub>78</sub> = 790, c<sub>79</sub> = 270)',
      options: ['7-9-10, 1660', '7-8-10, 1820', '7-9-10, 1390', '7-8-10, 1030'],
      answer: 0,
      explain: 'c<sub>78</sub> + f<sub>4</sub>(8) = 790 + 1030 = 1820; c<sub>79</sub> + f<sub>4</sub>(9) = 270 + 1390 = 1660. Küçük olan 1660 (7-9-10).',
    },
    {
      q: 'f<sub>2</sub>(3) (Nashville → LA) kaçtır ve Nashville\'den sonra hangi şehre gidilir? (c<sub>35</sub> = 580, c<sub>36</sub> = 760, c<sub>37</sub> = 660; f<sub>3</sub>(5) = 1640, f<sub>3</sub>(6) = 1570, f<sub>3</sub>(7) = 1660)',
      options: ['2220, şehir 5 (Kansas City)', '2330, şehir 6 (Omaha)', '2320, şehir 7 (Dallas)', '2150, şehir 5 (Kansas City)'],
      answer: 0,
      explain: '580 + 1640 = 2220, 760 + 1570 = 2330, 660 + 1660 = 2320. Minimum 2220, şehir 5 üzerinden (3-5-8-10).',
    },
    {
      q: 'Joe\'nun New York\'tan LA\'ya <b>optimal yolu ve uzunluğu</b>?',
      options: [
        '1-2-5-8-10, 2870 mil',
        '1-3-5-8-10, 3120 mil',
        '1-4-5-8-10, 2920 mil',
        '1-2-6-8-10, 2360 mil',
      ],
      answer: 0,
      explain: 'f<sub>1</sub>(1) = min{550 + 2320, 900 + 2220, 770 + 2150} = 2870 (Columbus üzerinden). Geri izlenince 2→5→8→10: New York–Columbus–Kansas City–Denver–Los Angeles.',
    },
    {
      q: 'Joe Louisville (4) üzerinden gitmek <b>zorunda</b> olsaydı en kısa toplam mesafe ne olurdu? (c<sub>14</sub> = 770, f<sub>2</sub>(4) = 2150)',
      options: ['2920', '2870', '2150', '3120'],
      answer: 0,
      explain: 'c<sub>14</sub> + f<sub>2</sub>(4) = 770 + 2150 = 2920 (yol 1-4-5-8-10). Bu, notlardaki stage-1 hesabındaki üçüncü seçenektir.',
    },
    {
      q: 'Bu ağda New York\'tan Los Angeles\'a (1→10) toplam <b>kaç farklı yol</b> vardır? (Stage 1→2: 3 arc, stage 2→3: her şehirden 3 arc, stage 3→4: her şehirden 2 arc, stage 4→5: 1 arc)',
      options: ['18', '9', '12', '27'],
      answer: 0,
      explain: '3 · 3 · 2 · 1 = 18. DP bu 18 yolu tek tek saymak yerine f<sub>t</sub> tablolarıyla yalnızca 20 arc toplamı hesaplar; ağ büyüdükçe fark çok büyür.',
    },
    {
      q: 'DP bu problemde hesapları hangi <b>sırayla</b> yapar?',
      options: ['f<sub>4</sub> → f<sub>3</sub> → f<sub>2</sub> → f<sub>1</sub> (geriye doğru)', 'f<sub>1</sub> → f<sub>2</sub> → f<sub>3</sub> → f<sub>4</sub> (ileriye doğru)', 'Rastgele sırayla', 'Önce f<sub>2</sub>, sonra f<sub>4</sub>, sonra f<sub>1</sub>'],
      answer: 0,
      explain: 'Notlarda: kolay problemle başlanır (tek günlük yol kalan stage 4 şehirleri), her stage bir sonraki stage\'in f değerlerini kullanır.',
    },
    {
      q: 'Principle of optimality bu ağda ne söyler? En kısa yol R (1→10) 5. şehirden geçiyorsa…',
      options: [
        'R\'nin 5→10 kısmı da 5\'ten 10\'a en kısa yoldur (5-8-10)',
        'R\'nin 1→5 kısmı mutlaka 1→5 arasındaki en uzun yoldur',
        '5\'ten sonraki karar, 5\'e hangi yoldan gelindiğine bağlıdır',
        'Hiçbir alt yolun optimal olması gerekmez',
      ],
      answer: 0,
      explain: 'Aksi olsaydı 5→10 kısmını daha kısa bir yolla değiştirip R\'den daha kısa bir 1→10 yolu elde ederdik; bu R\'nin en kısa olmasıyla çelişir.',
    },
    {
      q: '(Notlarda yok – kendi hesabımız) Aynı ağda 1→10 <b>en uzun</b> yolu istersek recursion\'da ne değişir ve sonuç ne olur?',
      options: ['min yerine max; f<sub>1</sub>(1) = 3990 (1-3-6-9-10)', 'min yerine max; f<sub>1</sub>(1) = 3670 (1-2-6-9-10)', 'Hiçbir şey değişmez; sonuç 2870', 'c<sub>ij</sub> işaretleri değişir; sonuç −2870'],
      answer: 0,
      explain: 'Max recursion: f<sub>3</sub> = (2180, 2330, 1820), f<sub>2</sub> = (3120, 3090, 3030); f<sub>1</sub>(1) = max{550 + 3120, 900 + 3090, 770 + 3030} = 3990, yol 1-3-6-9-10 (900 + 760 + 940 + 1390 = 3990).',
    },
  ];

  /* ====================================================================== 6.3 */
  OR.content.summaries['6.3'] = `
<h2>6.3 Characteristics of DP Applications</h2>
<p>Network probleminin özellikleri çoğu DP uygulamasında ortaktır:</p>
<ol>
  <li><b>Stage'ler ve her stage'de karar.</b> Problem stage'lere bölünür. Network'te stage t = Joe'nun t. günün başında bulunabileceği şehirler. Çoğu DP'de <b>stage = problemin başından beri geçen zaman</b>tır. Bazı durumlarda her stage'de karar gerekmeyebilir.</li>
  <li><b>State'ler.</b> Her stage'in birkaç state'i vardır. <b>State</b> = o stage'de optimal kararı verebilmek için gereken bilgi. Network'te state = Joe'nun bulunduğu şehir; oraya <i>nasıl</i> geldiği gerekli değildir (Kansas City'deyse kalan kararlar nasıl geldiğine değil, Kansas City'de olmasına bağlıdır).</li>
  <li><b>Decision.</b> Stage'deki karar, o stage'in state'inin bir sonraki stage'in state'ine nasıl dönüşeceğini belirler. Network'te karar = gidilecek sonraki şehir. Bazı problemlerde karar, sonraki state'i kesin belirlemez, yalnızca onun <b>olasılık dağılımını</b> belirler (stochastic DP; bu ders deterministik DP).</li>
  <li><b>Principle of optimality.</b> Mevcut state verilmişken, kalan stage'ler için optimal karar <b>önceden ulaşılan state'lere ve önceki kararlara bağlı olmamalıdır.</b> Network'te: 1→10 en kısa yolu R, i şehrinden geçiyorsa R'nin i→10 kısmı da i→10 en kısa yoludur. (Aksi halde i→10 kısmını daha kısa bir yolla değiştirip R'den kısa bir yol elde ederdik; çelişki.) Örn. 1→10 en kısa yolu 2'den geçiyorsa bu yolun 2→10 kısmı 2-5-8-10'dur.</li>
  <li><b>Recursion.</b> State'ler T stage'e ayrılmışsa, stage t, t+1, …, T'de kazanılan/ödenen maliyet ile stage t+1, …, T'dekini ilişkilendiren bir recursion olmalıdır. Recursion "working backward" yöntemini formülleştirir. Network için: <div class="model">f<sub>t</sub>(i) = min<sub>j</sub> { c<sub>ij</sub> + f<sub>t+1</sub>(j) },   j stage t+1 şehri,   f<sub>5</sub>(10) = 0</div></li>
</ol>
${tbl(
  ['Bileşen', 'Joe (network)', 'Inventory (6.4)', 'Resource allocation (6.5)'],
  [
    ['Stage', 'gün t (şehir katmanı)', 'ay t', 'yatırım t (t, …, 3 mevcut)'],
    ['State', 'bulunulan şehir i', 'başlangıç stok i', 'dağıtılabilir para d'],
    ['Decision', 'sonraki şehir j', 'üretim x', 'yatırım miktarı x<sub>t</sub>'],
    ['Maliyet/getiri (stage t)', 'c<sub>ij</sub>', 'c(x) + ½(i+x−d<sub>t</sub>)', 'r<sub>t</sub>(x<sub>t</sub>)'],
    ['Sonraki state', 'j', 'i + x − d<sub>t</sub>', 'd − x<sub>t</sub>'],
  ],
  'mtx'
)}
<div class="tip"><b>Stage nasıl seçilir?</b> Notlar: Stage öyle seçilmeli ki <i>bir stage kaldığında problem kolay</i> çözülebilsin. Çoğu problemde stage zamanla ilgilidir (inventory: aylar), ama resource allocation'da stage = "kaç yatırım seçeneği kaldığı", refinery örneğinde "kaç site mevcut".</div>
<div class="warnbox"><b>Sınavda dikkat:</b> "State = problem hakkında bilinen her şey" <b>değildir</b>; yalnızca kalan kararları vermek için <i>gerekli</i> bilgidir. Principle of optimality, gelecekteki optimal kararların geçmişten bağımsız olmasıdır. Forward ve backward DP aynı problemi çözer; notlar backward (sondan başa) yöntemi kullanır ve f<sub>T+1</sub> = 0 ile başlar.</div>
`;

  OR.content.concepts['6.3'] = [
    {
      q: 'DP\'de bir <b>state</b> nedir?',
      options: [
        'O stage\'de optimal kararı verebilmek için gereken bilgi',
        'Problemin başlangıcından beri alınan tüm kararların listesi',
        'Bir stage\'deki karar sayısı',
        'Amaç fonksiyonunun o stage\'deki değeri',
      ],
      answer: 0,
      explain: 'Notlar: "the information that is needed at any stage to make an optimal decision". Joe için bulunulan şehir; geçmiş yol gerekmez.',
    },
    {
      q: 'Principle of optimality hangisini söyler?',
      options: [
        'Mevcut state verilmişse kalan stage\'ler için optimal karar önceki state\'lere ve kararlara bağlı olmamalıdır',
        'Her stage\'de en ucuz (greedy) karar seçilmelidir',
        'Optimal çözümde tüm stage\'ler eşit maliyetlidir',
        'Optimal çözüm başlangıç state\'ine bağlı olamaz',
      ],
      answer: 0,
      explain: 'Bu, geriye doğru recursion\'ın dayanağıdır: i\'ye nasıl gelinirse gelinsin, i\'den sonraki en iyi karar dizisi f<sub>t</sub>(i) ile aynıdır. Greedy yaklaşımla karıştırma.',
    },
    {
      q: 'Joe\'nun problemi için hangi ifade <b>doğrudur</b>?',
      options: [
        'Stage 3\'te Kansas City\'deyse sonraki kararlar oraya nasıl gelindiğine bağlı değildir',
        'Joe\'nun kararı daha önce hangi şehirlerden geçtiğine bağlıdır',
        'Stage 3\'ün state\'leri Columbus, Nashville ve Louisville\'dir',
        'Karar, sonraki state\'i olasılıksal olarak belirler',
      ],
      answer: 0,
      explain: 'State yeterli istatistiktir: sadece mevcut şehir önemlidir. Stage 3 state\'leri Kansas City, Omaha, Dallas; karar sonraki şehri kesin belirler (deterministik).',
    },
    {
      q: 'Notlara göre birçok DP probleminde <b>stage</b> neye karşılık gelir?',
      options: ['Problemin başından beri geçen zamana', 'Karar değişkenlerinin sayısına', 'Kısıt sayısına', 'Amaç fonksiyonunun katsayılarına'],
      answer: 0,
      explain: 'Notlar: "in many DP problems, the stage is the amount of time that has elapsed since the beginning of the problem." (Ama bazı problemlerde stage zaman değildir: resource allocation\'da yatırım indeksi.)',
    },
    {
      q: 'Hangisi DP uygulamalarının <b>ortak özelliği değildir</b>?',
      options: [
        'Amaç fonksiyonu mutlaka lineer olmalıdır',
        'Problem stage\'lere bölünebilir',
        'Her stage\'in state\'leri vardır',
        'Stage t ile t+1 arasında bir recursion yazılabilir',
      ],
      answer: 0,
      explain: 'DP\'nin avantajı lineerlik (proportionality) gerektirmemesidir; resource allocation örneğinde r<sub>1</sub>(2) = 16 ≠ 2 r<sub>1</sub>(1) olsa da DP çalışır. Stage, state, decision, optimality ve recursion ortak özelliklerdir.',
    },
    {
      q: 'Karar (decision) ile sonraki stage\'in state\'i arasındaki ilişki nedir (deterministik DP)?',
      options: [
        'Karar, mevcut state\'in sonraki stage\'in state\'ine nasıl dönüşeceğini belirler',
        'Karar, mevcut state\'i değiştirmeden bırakır',
        'Karar yalnızca maliyeti belirler, state\'i etkilemez',
        'Sonraki state rastgele seçilir',
      ],
      answer: 0,
      explain: 'Joe: karar = sonraki şehir, bu da sonraki state\'i kesin belirler. Stochastic DP\'de ise karar sadece sonraki state\'in olasılık dağılımını belirler (notlarda belirtilir, ders kapsamında deterministik).',
    },
    {
      q: 'Notlardaki gibi recursion yazarken terminal koşul olarak ne kullanılır (min problem)?',
      options: ['f<sub>T+1</sub> = 0 (Joe için f<sub>5</sub>(10) = 0)', 'f<sub>0</sub> = ∞', 'f<sub>1</sub> = 0', 'f<sub>T</sub> = ∞'],
      answer: 0,
      explain: 'Son stage\'den sonra ek maliyet yoktur; böylece f<sub>T</sub> doğrudan hesaplanabilir ve geriye doğru devam edilir.',
    },
    {
      q: 'Inventory örneğinde zamanın stage olarak seçilmesinin gerekçesi nedir?',
      options: [
        'Son aya 1 ay kala (ay 4) problem trivialdir: sadece talebi karşılayacak kadar üretilir',
        'Ay sayısı en küçük olduğu için',
        'Zamansal olmayan stage seçmek yasak olduğu için',
        'Başlangıç stoğu sıfır olduğu için',
      ],
      answer: 0,
      explain: 'Stage, "bir stage kaldığında problem kolay çözülsün" diye seçilir: ay 4\'te üretim = talep − başlangıç stoğu. Sonra ay 3, 2, 1 geriye doğru çözülür.',
    },
    {
      q: 'Joe\'nun 1→10 en kısa yolu 2. şehirden geçiyorsa bu yolun 2→10 kısmı nedir?',
      options: ['2-5-8-10 (en kısa 2→10 yolu)', '2-6-9-10', '2-7-8-10', 'Fark etmez'],
      answer: 0,
      explain: 'Principle of optimality: yolun 2→10 parçası da 2\'den 10\'a en kısa yol olmalıdır; f<sub>2</sub>(2) = 2320 ve yol 2-5-8-10.',
    },
  ];

  /* ====================================================================== 6.4 */
  OR.content.summaries['6.4'] = `
<h2>6.4 An Inventory Problem (Winston 18.3)</h2>
<p><b>Model özellikleri:</b> (1) Zaman dönemlere bölünür; dönem 1 şimdi, T son dönem; talepler dönem 1'in başında biliniyor. (2) Her dönem başında kaç birim üretileceği belirlenir; üretim kapasitesi sınırlıdır. (3) Talep zamanında stoktan veya o dönemin üretiminden karşılanır; üretim yapılan dönemde <b>sabit (setup) maliyet + birim değişken maliyet</b> oluşur. (4) Depo sınırlı: dönem sonu stok üst sınırlıdır; dönem sonu stoğa birim başına <b>holding cost</b> uygulanır. (5) Amaç, 1…T talebini zamanında karşılayan toplam maliyeti minimize etmek. Stok, dönem sonunda gözlenip üretim kararı verildiği için bu bir <b>periodic review</b> modelidir (continuous review'ün tersi).</p>
<div class="box"><b>Example 6.4.</b> Talepler: ay 1 = 1, ay 2 = 3, ay 3 = 2, ay 4 = 4 birim. Üretim yapılan ayda setup <b>$3</b> + birim başına <b>$1</b>; ay sonu stokta birim başına <b>50¢</b>; ayda en çok <b>5</b> birim üretilebilir; ay sonu stok en çok <b>4</b>; başlangıç stoğu 0.</div>
<h3>Tanımlar</h3>
<ul>
  <li><b>Stage</b> = ay t. <b>State</b> = ayın başındaki stok i (= bir önceki ay sonu stoğu); mümkün state'ler 0, 1, 2, 3, 4.</li>
  <li><b>f<sub>t</sub>(i)</b> = ay t'nin başında i birim stok varken ay t, t+1, …, 4 talebini karşılamanın min maliyeti. <b>x<sub>t</sub>(i)</b> = bunu sağlayan üretim.</li>
  <li><b>c(x)</b> = x birim üretim maliyeti: c(0) = 0, x &gt; 0 için c(x) = 3 + x.</li>
  <li><b>Recursion:</b> f<sub>t</sub>(i) = min<sub>x</sub> { (½)(i + x − d<sub>t</sub>) + c(x) + f<sub>t+1</sub>(i + x − d<sub>t</sub>) }, burada x ∈ {0, 1, …, 5} ve <b>0 ≤ i + x − d<sub>t</sub> ≤ 4</b> (talep karşılanmalı, ay sonu stok ≤ 4). Ay 4: f<sub>4</sub>(i) = c(4 − i).</li>
</ul>
<p>Terimlerin anlamı: (½)(i+x−d<sub>t</sub>) = ay t holding cost'u (ay sonu stoğu = i + x − d<sub>t</sub>), c(x) = ay t üretim maliyeti, f<sub>t+1</sub>(·) = <i>principle of optimality</i> gereği gelecekte optimal izlenen maliyet.</p>

<h3>Month 4</h3>
<p>Ay 4'te tam talep (4) kadar üretilir (ek stok gereksiz):</p>
${tbl(
  ['i', 'x<sub>4</sub>(i) = 4 − i', 'f<sub>4</sub>(i) = c(4 − i)'],
  [[0, 4, 'c(4) = 3 + 4 = 7'], [1, 3, 'c(3) = 6'], [2, 2, 'c(2) = 5'], [3, 1, 'c(1) = 4'], [4, 0, 'c(0) = 0']],
  'mtx'
)}
<h3>Month 3 (d<sub>3</sub> = 2): x ∈ {0,…,5}, 0 ≤ i+x−2 ≤ 4</h3>
${invTable(3)}
<p>Özet: f<sub>3</sub>(0) = 12 (x=2), f<sub>3</sub>(1) = 10 (x=5), f<sub>3</sub>(2) = 7 (x=0), f<sub>3</sub>(3) = 6.5 (x=0), f<sub>3</sub>(4) = 6 (x=0).</p>
<h3>Month 2 (d<sub>2</sub> = 3): 0 ≤ i+x−3 ≤ 4</h3>
${invTable(2)}
<p>Özet: f<sub>2</sub>(0) = 16 (x=5), f<sub>2</sub>(1) = 15 (x=4), f<sub>2</sub>(2) = 14 (x=3), f<sub>2</sub>(3) = 12 (x=0), f<sub>2</sub>(4) = 10.5 (x=0). <small>(Notlardaki f<sub>2</sub>(3) satırında "x<sub>3</sub>(3)=0" baskı hatası: doğrusu x<sub>2</sub>(3) = 0.)</small></p>
<h3>Month 1 (d<sub>1</sub> = 1), yalnızca başlangıç stoğu i = 0 gerekir</h3>
${(() => {
    const rows = invRows[1].filter((r) => r.i === 0).map((r, idx) => [r.i, r.x, `${INV.h * r.e} + ${cprod(r.x)} = ${r.own}`, r.nxt, r.min ? hl(r.tot + ' *') : r.tot, idx === 0 ? 'f<sub>1</sub>(0) = 20, x<sub>1</sub>(0) = 1' : '']);
    return tbl(['i', 'x', '(½)(i+x−1) + c(x)', 'f<sub>2</sub>(i+x−1)', 'Total cost', 'f<sub>1</sub>(i)'], rows, 'mtx');
  })()}
<p>Not: x = 2, 4, 5 için toplam 20.5'tir (20'den büyük); tek optimum x<sub>1</sub>(0) = 1.</p>
<div class="tip"><b>Optimal Solution and Report:</b> f<sub>1</sub>(0) = <b>$20</b>. x<sub>1</sub>(0) = 1 ⇒ ay 2 başı stok 0 + 1 − 1 = 0 ⇒ x<sub>2</sub>(0) = 5 ⇒ ay 3 başı stok 0 + 5 − 3 = 2 ⇒ x<sub>3</sub>(2) = 0 ⇒ ay 4 başı stok 2 − 2 = 0 ⇒ x<sub>4</sub>(0) = 4. Plan: <b>1, 5, 0, 4</b> birim; toplam 3 setup ($9) + 10 birim ($10) + holding ½·2 = $1 = <b>$20</b>.</div>
<div class="warnbox"><b>Sınavda dikkat:</b> (1) x'in feasible aralığı hem x ≤ 5 hem de 0 ≤ i+x−d<sub>t</sub> ≤ 4 ile belirlenir (ör. ay 3, i=0 ⇒ x ∈ {2,3,4,5}). (2) Holding cost <b>ay sonu</b> stoğuna uygulanır. (3) Setup cost yalnızca x &gt; 0 ise: c(0) = 0. (4) f<sub>1</sub>'de sadece i = 0 hesaplanır. (5) Yeni state = i + x − d<sub>t</sub> ve f<sub>t+1</sub>(bu state) kullanılır.</div>
`;

  OR.content.concepts['6.4'] = [
    {
      q: 'Inventory örneğinde (Example 6.4) <b>state</b> ve <b>stage</b> nedir?',
      options: [
        'Stage = ay; state = ayın başındaki stok',
        'Stage = stok seviyesi; state = ay',
        'Stage = üretim miktarı; state = talep',
        'Stage = maliyet; state = ay sonu stoğu',
      ],
      answer: 0,
      explain: 'Üretim kararı için yalnızca ayın başındaki stoğu bilmek yeterlidir; zaman (ay) stage\'dir, son ay kolayca çözülür.',
    },
    {
      q: 'c(x) üretim maliyet fonksiyonu için x = 3 birimde maliyet kaçtır? (setup $3, birim $1)',
      options: ['6', '3', '4', '9'],
      answer: 0,
      explain: 'x > 0 için c(x) = 3 + x ⇒ c(3) = 6; x = 0 ise setup da yok: c(0) = 0.',
    },
    {
      q: 'Ay 3 (d<sub>3</sub> = 2), başlangıç stoğu i = 0 iken feasible üretim miktarları nelerdir? (kapasite 5, ay sonu stok ≤ 4)',
      options: ['x ∈ {2, 3, 4, 5}', 'x ∈ {0, 1, 2, 3, 4, 5}', 'x ∈ {0, 1, 2, 3, 4}', 'x ∈ {2, 3, 4, 5, 6}'],
      answer: 0,
      explain: '0 ≤ 0 + x − 2 ≤ 4 ⇒ 2 ≤ x ≤ 6, üretim kapasitesi x ≤ 5 ⇒ {2,3,4,5} (notlardaki f<sub>3</sub>(0) tablosundaki satırlar).',
    },
    {
      q: 'Ay 4\'te f<sub>4</sub>(1) ve x<sub>4</sub>(1) nedir? (d<sub>4</sub> = 4)',
      options: ['f<sub>4</sub>(1) = 6, x<sub>4</sub>(1) = 3', 'f<sub>4</sub>(1) = 7, x<sub>4</sub>(1) = 4', 'f<sub>4</sub>(1) = 4, x<sub>4</sub>(1) = 1', 'f<sub>4</sub>(1) = 5, x<sub>4</sub>(1) = 3'],
      answer: 0,
      explain: 'Son ayda tam talep kadar üretilir: x = 4 − 1 = 3, f<sub>4</sub>(1) = c(3) = 3 + 3 = 6.',
    },
    {
      q: 'f<sub>3</sub>(2) kaçtır ve optimal x<sub>3</sub>(2) nedir? (d<sub>3</sub> = 2; f<sub>4</sub> = 7, 6, 5, 4, 0)',
      options: ['f<sub>3</sub>(2) = 7, x<sub>3</sub>(2) = 0', 'f<sub>3</sub>(2) = 10.5, x<sub>3</sub>(2) = 1', 'f<sub>3</sub>(2) = 5, x<sub>3</sub>(2) = 2', 'f<sub>3</sub>(2) = 6.5, x<sub>3</sub>(2) = 3'],
      answer: 0,
      explain: 'x = 0: ay sonu stok 0 ⇒ holding 0 + c(0) = 0, f<sub>4</sub>(0) = 7 ⇒ 7. x = 1: 0.5 + 4 + f<sub>4</sub>(1) = 4.5 + 6 = 10.5. x = 2: ½·2 + 5 + f<sub>4</sub>(2) = 6 + 5 = 11. Minimum 7 (x = 0): mevcut 2 birim stok ay 3 talebini tam karşılar.',
    },
    {
      q: 'f<sub>3</sub>(1) için hangi üretim optimaldir ve değeri kaçtır?',
      options: ['x = 5, f<sub>3</sub>(1) = 10', 'x = 1, f<sub>3</sub>(1) = 11', 'x = 2, f<sub>3</sub>(1) = 11.5', 'x = 3, f<sub>3</sub>(1) = 10'],
      answer: 0,
      explain: 'i = 1: x=1 → 0 stok: c(1) + f<sub>4</sub>(0) = 4 + 7 = 11; x=2 → 0.5 + 5 + 6 = 11.5; x=3 → 1 + 6 + 5 = 12 (c(3)=6, ending 2: holding 1, f<sub>4</sub>(2) = 5); x=4 → 1.5+7+4 = 12.5; x=5 → ending 4: 2 + 8 + 0 = 10. En küçük 10 (x = 5): son ay üretim setup\'ını tamamen kaldırır.',
    },
    {
      q: 'f<sub>2</sub>(4) = ? ve x<sub>2</sub>(4) = ? (d<sub>2</sub> = 3; f<sub>3</sub> = 12, 10, 7, 6.5, 6)',
      options: ['10.5 ve 0', '13 ve 2', '14 ve 3', '12 ve 0'],
      answer: 0,
      explain: 'i = 4, x = 0: ay sonu stok 1 ⇒ holding 0.5, c(0) = 0, f<sub>3</sub>(1) = 10 ⇒ 10.5. Diğer seçenekler (x = 2: 6.5 + 6.5 = 13 …) daha pahalı.',
    },
    {
      q: 'f<sub>2</sub>(2) = 14 değerini hangi x veriyor? (d<sub>2</sub> = 3)',
      options: ['x = 3', 'x = 1', 'x = 2', 'x = 5'],
      answer: 0,
      explain: 'i = 2, x = 3 ⇒ ay sonu stok 2: (½)(2) + c(3) = 1 + 6 = 7, f<sub>3</sub>(2) = 7 ⇒ 14. Diğerleri: x = 1: c(1) + f<sub>3</sub>(0) = 4 + 12 = 16; x = 2: 0.5 + 5 + f<sub>3</sub>(1) = 5.5 + 10 = 15.5; x = 4: 1.5 + 7 + f<sub>3</sub>(3) = 8.5 + 6.5 = 15; x = 5: 2 + 8 + f<sub>3</sub>(4) = 10 + 6 = 16. Minimum 14.',
    },
    {
      q: 'f<sub>1</sub>(0) = 20 ve optimal x<sub>1</sub>(0) nedir? (diğer x değerleri toplam 20.5 verir)',
      options: ['x<sub>1</sub>(0) = 1', 'x<sub>1</sub>(0) = 2', 'x<sub>1</sub>(0) = 5', 'x<sub>1</sub>(0) = 0'],
      answer: 0,
      explain: 'x = 1: ay 1 sonu stok 0 ⇒ c(1) = 4, f<sub>2</sub>(0) = 16 ⇒ 20. x = 2: 0.5 + 5 + f<sub>2</sub>(1) = 5.5 + 15 = 20.5; x = 3: 1 + 6 + f<sub>2</sub>(2) = 7 + 14 = 21; x = 4: 1.5 + 7 + 12 = 20.5; x = 5: 2 + 8 + 10.5 = 20.5. x = 0 ise infeasible (talep 1 karşılanamaz). Tek optimum x = 1.',
    },
    {
      q: 'Optimal üretim planı (ay 1, 2, 3, 4) nedir?',
      options: ['1, 5, 0, 4 birim', '1, 3, 2, 4 birim (talebe eşit)', '5, 0, 0, 4 birim', '0, 5, 0, 5 birim'],
      answer: 0,
      explain: 'x<sub>1</sub>(0)=1 → ay 2 başı stok 0; x<sub>2</sub>(0)=5 → ay 3 başı stok 2; x<sub>3</sub>(2)=0 → ay 4 başı stok 0; x<sub>4</sub>(0)=4. Talebe eşit üretmek 4 setup (12) + 10 değişken = 22 olurdu.',
    },
    {
      q: 'Optimal plandaki (1, 5, 0, 4) <b>toplam holding cost</b> kaçtır? (50¢/birim, ay sonu stoğuna)',
      options: ['$1', '$0', '$2', '$0.5'],
      answer: 0,
      explain: 'Ay sonu stoklar: ay 1: 0 + 1 − 1 = 0; ay 2: 0 + 5 − 3 = 2; ay 3: 2 + 0 − 2 = 0; ay 4: 0. Holding = ½ · 2 = $1. Toplam: setup 3·3 = 9, değişken 10, holding 1 ⇒ $20.',
    },
    {
      q: 'Recursion\'daki f<sub>t+1</sub>(i + x − d<sub>t</sub>) terimi neden kullanılır?',
      options: [
        'Ay t sonunda stok i + x − d<sub>t</sub> olur ve bundan sonra optimal oynandığı için (principle of optimality) kalan maliyet f<sub>t+1</sub> ile hesaplanır',
        'Çünkü ay t+1\'in talebi ay t\'de karşılanır',
        'Çünkü ay t+1\'de üretim yapılmaz',
        'Çünkü holding cost iki kez sayılır',
      ],
      answer: 0,
      explain: 'Ay t+1 state\'i i + x − d<sub>t</sub>\'dir; o noktadan sonrası f<sub>t+1</sub> ile optimal çözülür, böylece ay t kararı yalnızca bugünkü maliyet + f<sub>t+1</sub> toplamını minimize eder.',
    },
  ];

  /* ====================================================================== 6.5 */
  OR.content.summaries['6.5'] = `
<h2>6.5 Resource Allocation Problems (+ 6.5.1 Generalized Resource Allocation)</h2>
<p>Sınırlı kaynakların faaliyetlere dağıtılması problemleri DP ile sıkça çözülür. LP ile çözmek için üç varsayım gerekir: (1) bir faaliyete ayrılan kaynak herhangi bir <b>negatif olmayan</b> sayı olabilir; (2) faaliyetten gelen getiri, kaynakla <b>orantılı (proportional)</b>; (3) birden fazla faaliyetin getirisi tekil getirilerin <b>toplamı</b>. 1. ve 2. varsayım geçersiz olsa bile, 3. varsayım geçerli ve her faaliyete ayrılan kaynak <b>sonlu bir kümeden</b> geliyorsa DP etkilidir.</p>
<div class="box"><b>Example 6.5 – Finco.</b> $6000 (bin $ cinsinden 6) ve üç yatırım: d<sub>j</sub> bin $ yatırılırsa NPV r<sub>j</sub>(d<sub>j</sub>). Her yatırım 1000'in tam katı olmalı. Maksimum NPV?</div>
${tbl(
  ['d', 0, 1, 2, 3, 4, 5, 6],
  [
    ['r<sub>1</sub>(d)'].concat(RA.r[1]),
    ['r<sub>2</sub>(d)'].concat(RA.r[2]),
    ['r<sub>3</sub>(d)'].concat(RA.r[3]),
  ],
  'mtx'
)}
<p>(r<sub>1</sub>(1) = 9, r<sub>1</sub>(2) = 16; notlar: 16 = r<sub>1</sub>(2) ≠ 2 r<sub>1</sub>(1) = 18 ⇒ orantısız ⇒ LP kullanılamaz. Bu getiri tablosu notlarda resimdir; değerler notlardaki hesap tablolarındaki r<sub>j</sub> sütunlarından derlenmiştir.) Model: max r<sub>1</sub>(d<sub>1</sub>) + r<sub>2</sub>(d<sub>2</sub>) + r<sub>3</sub>(d<sub>3</sub>), d<sub>1</sub> + d<sub>2</sub> + d<sub>3</sub> = 6, d<sub>j</sub> ≥ 0 ve integer. r<sub>j</sub> lineer olsaydı bu bir <b>knapsack</b> problemi olurdu.</p>
<h3>Stage, state, f<sub>t</sub>(d<sub>t</sub>)</h3>
<ul>
  <li><b>Stage t</b> = t, t+1, …, 3 numaralı yatırımlara para dağıtılacak durum (1 yatırım kalınca problem kolay).</li>
  <li><b>State</b> = t, …, 3 yatırımlarına ayrılabilecek para (bin $): 0, 1, …, 6.</li>
  <li><b>f<sub>t</sub>(d<sub>t</sub>)</b> = d<sub>t</sub> bin $'ı yatırım t, …, 3'e dağıtarak elde edilen maks NPV. <b>x<sub>t</sub>(d<sub>t</sub>)</b> = yatırım t'ye ayrılan optimal miktar.</li>
  <li><b>Recursion (5):</b> f<sub>t</sub>(d) = max<sub>x</sub> { r<sub>t</sub>(x) + f<sub>t+1</sub>(d − x) }, x ∈ {0, 1, …, d}; f<sub>4</sub> ≡ 0.</li>
</ul>
<h3>Stage 3</h3>
<p>Tüm para yatırım 3'e gider: f<sub>3</sub>(d) = r<sub>3</sub>(d): f<sub>3</sub> = 0, 9, 13, 17, 21, 25, 29 (d = 0…6), x<sub>3</sub>(d) = d.</p>
<h3>Stage 2</h3>
${raTable(2, [0, 1, 2, 3, 4, 5, 6])}
<h3>Stage 1 (yalnızca f<sub>1</sub>(6))</h3>
${raTable(1, [6])}
<div class="tip"><b>Optimal Solution and Report:</b> x<sub>1</sub>(6) = 4 ⇒ yatırım 1'e $4000. Kalan 6 − 4 = 2 ⇒ x<sub>2</sub>(2) = 1 ⇒ yatırım 2'ye $1000. Kalan 1 ⇒ x<sub>3</sub>(1) = 1 ⇒ yatırım 3'e $1000. Maks NPV = f<sub>1</sub>(6) = <b>$49 000</b> (30 + 10 + 9).</div>

<h3>6.5.1 Generalized Resource Allocation</h3>
<p>w birim kaynak, T faaliyet. Faaliyet t, x<sub>t</sub> (negatif olmayan integer) seviyesinde yürütülürse <b>g<sub>t</sub>(x<sub>t</sub>)</b> birim kaynak kullanır ve <b>r<sub>t</sub>(x<sub>t</sub>)</b> getiri sağlar:</p>
<div class="model">max Σ<sub>t=1..T</sub> r<sub>t</sub>(x<sub>t</sub>)    s.t.  Σ<sub>t</sub> g<sub>t</sub>(x<sub>t</sub>) ≤ w,    x<sub>t</sub> ∈ {0, 1, 2, …}      (6)

f<sub>T+1</sub>(d) = 0  ∀d
f<sub>t</sub>(d) = max { r<sub>t</sub>(x<sub>t</sub>) + f<sub>t+1</sub>(d − g<sub>t</sub>(x<sub>t</sub>)) },  x<sub>t</sub> ≥ 0 integer, g<sub>t</sub>(x<sub>t</sub>) ≤ d      (7)</div>
<p>Önce f<sub>T</sub>, x<sub>T</sub> bulunur; sonra (7) ile f<sub>T−1</sub>, …, f<sub>2</sub> ve son olarak f<sub>1</sub>(w) hesaplanır. Faaliyet 1 x<sub>1</sub>(w) seviyesinde yürütülür; kalan kaynak w − g<sub>1</sub>(x<sub>1</sub>(w)); faaliyet 2 için x<sub>2</sub>[w − g<sub>1</sub>(x<sub>1</sub>(w))] kullanılır… Yorumlar:</p>
${tbl(
  ['r<sub>t</sub>(x<sub>t</sub>)', 'g<sub>t</sub>(x<sub>t</sub>)', 'w'],
  [
    ['Sırt çantasına x<sub>t</sub> adet tip t eşya koymanın faydası', 'x<sub>t</sub> adet tip t eşyanın ağırlığı', 'Çantanın maks ağırlığı'],
    ['t dersine haftada x<sub>t</sub> saat çalışınca alınan not', 'ders t için harcanan saat x<sub>t</sub>', 'Haftalık toplam çalışma saati'],
    ['Bölge t\'ye x<sub>t</sub> satış elemanı atanırsa satışlar', 'x<sub>t</sub> elemanı bölge t\'ye atamanın maliyeti', 'Satış gücü bütçesi'],
    ['t bölgesine x<sub>t</sub> itfaiye aracı verilirse 1 dakikada cevaplanan alarm sayısı', 'x<sub>t</sub> aracı t bölgesinde tutmanın haftalık maliyeti', 'Haftalık bakım bütçesi'],
  ],
  'mtx'
)}
<div class="warnbox"><b>Sınavda dikkat:</b> f<sub>t+1</sub>(d − x) kullanılır (kalan para), tabloda x<sub>t</sub> ∈ {0,…,d}. f<sub>3</sub>(d) = r<sub>3</sub>(d) çünkü son stage'de tüm parayı vermek optimaldir (getiriler artan). f<sub>1</sub> için sadece toplam kaynağın (6) satırları hesaplanır. Optimum tek değilse (ör. f<sub>1</sub>(2) = 19 için x<sub>1</sub> = 0 veya 1, tie) tüm optimal x değerleri yazılabilir; f<sub>1</sub>(6) = 49 ise tektir. Print notu: notlardaki model "d<sub>j</sub> &gt; 0 and integer" yazar, doğrusu d<sub>j</sub> ≥ 0.</div>
`;

  OR.content.concepts['6.5'] = [
    {
      q: 'Resource allocation problemini LP ile çözebilmek için hangi varsayım(lar) gerekir?',
      options: [
        'Kaynak herhangi negatif olmayan sayı olabilmeli, getiri orantılı olmalı, getiriler toplanabilir olmalı',
        'Yalnızca kaynak integer olmalı',
        'Getiriler konkav olmalı ve kaynak integer olmalı',
        'Hiçbir varsayım gerekmez, LP her zaman uygulanır',
      ],
      answer: 0,
      explain: 'Notlar üç varsayım sayar: (1) herhangi nonneg miktar, (2) proportionality, (3) additivity. DP ise 3 geçerliyken ve miktarlar sonlu kümedeyse 1 ve 2 olmadan da kullanılabilir.',
    },
    {
      q: 'Finco örneğinde LP neden kullanılamaz?',
      options: [
        'Getiri yatırımla orantılı değildir (r<sub>1</sub>(2) = 16 ≠ 2 r<sub>1</sub>(1) = 18)',
        'Üç yatırım olduğu için',
        'Toplam para 6 bin $ olduğu için',
        'Hedef fonksiyonu minimizasyon olduğu için',
      ],
      answer: 0,
      explain: 'LP için proportionality gerekir; r<sub>1</sub>(2) = 16, 2·r<sub>1</sub>(1) = 18, yani doğrusal değil. Additivity ve integer miktarlar DP için uygundur.',
    },
    {
      q: 'Finco\'da <b>stage</b> ve <b>state</b> tanımı nedir?',
      options: [
        'Stage t = yatırım t, …, 3\'e para dağıtılan durum; state = bu yatırımlara ayrılabilen para',
        'Stage = yatırılan para; state = yatırım numarası',
        'Stage = NPV; state = yatırım türü',
        'Stage = ay; state = faiz oranı',
      ],
      answer: 0,
      explain: 'Bir yatırım kalınca problem kolay (tüm para ona); state = o stage\'de dağıtılabilir para miktarı: 0, 1, …, 6.',
    },
    {
      q: 'f<sub>3</sub>(4) kaçtır? (r<sub>3</sub>(4) = 21)',
      options: ['21', '25', '17', '29'],
      answer: 0,
      explain: 'Stage 3\'te yalnız yatırım 3 kalır; tüm 4 bin $ ona gider: f<sub>3</sub>(4) = r<sub>3</sub>(4) = 21, x<sub>3</sub>(4) = 4.',
    },
    {
      q: 'f<sub>2</sub>(3) kaçtır ve x<sub>2</sub>(3)? (r<sub>2</sub>(x) = 0, 10, 13, 16 (x = 0…3); f<sub>3</sub>(3) = 17, f<sub>3</sub>(2) = 13, f<sub>3</sub>(1) = 9, f<sub>3</sub>(0) = 0)',
      options: ['f<sub>2</sub>(3) = 23, x<sub>2</sub>(3) = 1', 'f<sub>2</sub>(3) = 22, x<sub>2</sub>(3) = 2', 'f<sub>2</sub>(3) = 17, x<sub>2</sub>(3) = 0', 'f<sub>2</sub>(3) = 16, x<sub>2</sub>(3) = 3'],
      answer: 0,
      explain: 'x=0: 0+17 = 17; x=1: 10+13 = 23; x=2: 13+9 = 22; x=3: 16+0 = 16. Max 23 (x = 1).',
    },
    {
      q: 'f<sub>2</sub>(5) kaçtır? (r<sub>2</sub> = 0, 10, 13, 16, 19, 22; f<sub>3</sub>(5…0) = 25, 21, 17, 13, 9, 0)',
      options: ['31', '30', '29', '25'],
      answer: 0,
      explain: 'x=0: 25; x=1: 10 + 21 = 31; x=2: 13 + 17 = 30; x=3: 16 + 13 = 29; x=4: 19 + 9 = 28; x=5: 22. Max 31 (x = 1).',
    },
    {
      q: 'f<sub>1</sub>(6) = ? ve x<sub>1</sub>(6) = ? (r<sub>1</sub> = 0, 9, 16, 23, 30, 37, 44; f<sub>2</sub>(6…0) = 35, 31, 27, 23, 19, 10, 0 — yani f<sub>2</sub>(6 − x))',
      options: ['49 ve 4', '47 ve 5', '46 ve 3', '44 ve 6'],
      answer: 0,
      explain: 'x=0: 35; x=1: 9+31 = 40; x=2: 16+27 = 43; x=3: 23+23 = 46; x=4: 30+19 = 49 *; x=5: 37+10 = 47; x=6: 44. Max 49 (x = 4).',
    },
    {
      q: 'Finco\'nun optimal dağılımı (yatırım 1, 2, 3, bin $) nedir?',
      options: ['4, 1, 1  (NPV 49 bin $)', '3, 2, 1  (NPV 45 bin $)', '6, 0, 0  (NPV 44 bin $)', '2, 2, 2  (NPV 42 bin $)'],
      answer: 0,
      explain: 'x<sub>1</sub>(6) = 4; kalan 2 ⇒ x<sub>2</sub>(2) = 1; kalan 1 ⇒ x<sub>3</sub>(1) = 1. NPV: 30 + 10 + 9 = 49. (3,2,1): 23+13+9 = 45; (6,0,0): 44; (2,2,2): 16+13+13 = 42.',
    },
    {
      q: 'Generalized resource allocation recursion\'ı (7) hangisidir?',
      options: [
        'f<sub>t</sub>(d) = max{ r<sub>t</sub>(x<sub>t</sub>) + f<sub>t+1</sub>(d − g<sub>t</sub>(x<sub>t</sub>)) },  g<sub>t</sub>(x<sub>t</sub>) ≤ d,  f<sub>T+1</sub>(d) = 0',
        'f<sub>t</sub>(d) = max{ r<sub>t</sub>(x<sub>t</sub>) · f<sub>t+1</sub>(d − x<sub>t</sub>) }',
        'f<sub>t</sub>(d) = min{ g<sub>t</sub>(x<sub>t</sub>) + f<sub>t−1</sub>(d + x<sub>t</sub>) }',
        'f<sub>t</sub>(d) = max{ r<sub>t</sub>(x<sub>t</sub>) + f<sub>t+1</sub>(d + g<sub>t</sub>(x<sub>t</sub>)) }',
      ],
      answer: 0,
      explain: 'Faaliyet t, x<sub>t</sub> seviyesinde r<sub>t</sub>(x<sub>t</sub>) getirir ve g<sub>t</sub>(x<sub>t</sub>) kaynak harcar; kalan d − g<sub>t</sub>(x<sub>t</sub>) kaynak t+1…T faaliyetlerine optimal dağıtılır.',
    },
    {
      q: 'Finco\'da x<sub>1</sub>(6) = 4 bulunduktan sonra yatırım 2 miktarı hangi tablodan okunur?',
      options: ['x<sub>2</sub>(2) (kalan 6 − 4 = 2 bin $)', 'x<sub>2</sub>(6)', 'x<sub>3</sub>(4)', 'x<sub>1</sub>(2)'],
      answer: 0,
      explain: 'Yatırım 1\'e 4 verilince 2 bin $ kalır; yatırım 2\'nin optimal payı x<sub>2</sub>(2) = 1. Sonra kalan 1 ⇒ x<sub>3</sub>(1) = 1 (retrace).',
    },
    {
      q: 'Yatırım getirileri <b>lineer</b> olsaydı (r<sub>j</sub>(d) = a<sub>j</sub> d) bu problem hangi probleme dönüşürdü?',
      options: ['Knapsack problemine', 'Assignment problemine', 'TSP\'ye', 'Minimum spanning tree problemine'],
      answer: 0,
      explain: 'Notlar: "if rj(dj)\'s were linear, then we would have a knapsack problem." Bu da DP bölümünün sonraki konusudur (6.5.2).',
    },
  ];

  /* ====================================================================== 6.5.2 */
  OR.content.summaries['6.5.2'] = `
<h2>6.5.2 Solution of Knapsack Problems by DP</h2>
<div class="box"><b>Example 6.6 – Unbounded Knapsack (Winston 18.4).</b> 10 lb'lik çanta; aynı tip eşyadan birden fazla konabilir. Maks toplam fayda?
${tbl(['Item', 'Weight', 'Benefit'], [[1, 4, 11], [2, 3, 7], [3, 5, 12]], 'mtx')}</div>
<p>r<sub>1</sub>(x<sub>1</sub>) = 11x<sub>1</sub>, r<sub>2</sub>(x<sub>2</sub>) = 7x<sub>2</sub>, r<sub>3</sub>(x<sub>3</sub>) = 12x<sub>3</sub>; g<sub>1</sub>(x<sub>1</sub>) = 4x<sub>1</sub>, g<sub>2</sub>(x<sub>2</sub>) = 3x<sub>2</sub>, g<sub>3</sub>(x<sub>3</sub>) = 5x<sub>3</sub> (generalized resource allocation özel hâli). <b>f<sub>t</sub>(d)</b> = d lb'lik çantayı tip t, t+1, …, 3 eşyalarla doldurarak kazanılabilecek maks fayda. Recursion (7):</p>
<div class="model">f<sub>4</sub>(d) = 0;   f<sub>t</sub>(d) = max { b<sub>t</sub> x<sub>t</sub> + f<sub>t+1</sub>(d − w<sub>t</sub> x<sub>t</sub>) },   w<sub>t</sub> x<sub>t</sub> ≤ d,  x<sub>t</sub> nonneg integer</div>
<h3>Stage 3 / 2 / 1 sonuçları</h3>
${tbl(
  ['d', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [
    ['f<sub>3</sub>(d)'].concat(ksF[3]),
    ['x<sub>3</sub>(d)'].concat(ksX[3]),
    ['f<sub>2</sub>(d)'].concat(ksF[2]),
    ['x<sub>2</sub>(d)'].concat(ksX[2]),
    ['f<sub>1</sub>(d)'].concat(ksF[1].map((v, d) => (d === 10 ? hl(v) : v))),
    ['x<sub>1</sub>(d)'].concat(ksX[1].map((v, d) => (d === 10 ? hl(v) : v))),
  ],
  'mtx'
)}
<p>Örnekler. <b>Stage 3:</b> f<sub>3</sub>(10) = max{12·0, 12·1 (5 ≤ 10), 12·2} = 24, x<sub>3</sub>(10) = 2; 5 ≤ d ≤ 9 için f<sub>3</sub>(d) = 12 (x<sub>3</sub> = 1); d &lt; 5 için 0. <b>Stage 2:</b> f<sub>2</sub>(9) = max{7x<sub>2</sub> + f<sub>3</sub>(9 − 3x<sub>2</sub>)}: x<sub>2</sub> = 0: f<sub>3</sub>(9) = 12; x<sub>2</sub> = 1: 7 + f<sub>3</sub>(6) = 19; x<sub>2</sub> = 2: 14 + f<sub>3</sub>(3) = 14; x<sub>2</sub> = 3: 21 + f<sub>3</sub>(0) = <b>21</b> ⇒ f<sub>2</sub>(9) = 21, x<sub>2</sub>(9) = 3. f<sub>2</sub>(8) = max{12, 7 + f<sub>3</sub>(5) = 19, 14 + f<sub>3</sub>(2) = 14} = 19 (x<sub>2</sub> = 1). f<sub>2</sub>(10) = max{24, 7 + f<sub>3</sub>(7) = 19, 14 + f<sub>3</sub>(4) = 14, 21 + f<sub>3</sub>(1) = 21} = 24 (x<sub>2</sub> = 0).</p>
<h3>Stage 1</h3>
<p>f<sub>1</sub>(10) = max{ 11x<sub>1</sub> + f<sub>2</sub>(10 − 4x<sub>1</sub>) } : x<sub>1</sub> = 0 → f<sub>2</sub>(10) = 24; x<sub>1</sub> = 1 → 11 + f<sub>2</sub>(6) = 11 + 14 = <b>25</b>; x<sub>1</sub> = 2 → 22 + f<sub>2</sub>(2) = 22. ⇒ <b>f<sub>1</sub>(10) = 25, x<sub>1</sub>(10) = 1</b>.</p>
<div class="tip"><b>Optimal Solution and Report:</b> 1 adet tip 1 (4 lb). Kalan 10 − 4 = 6 lb ⇒ x<sub>2</sub>(6) = 2 adet tip 2 (6 lb). Kalan 6 − 6 = 0 ⇒ x<sub>3</sub>(0) = 0. Toplam fayda = 11 + 2·7 = <b>25</b>. (Notlardaki son cümlede "f<sub>3</sub>(10) = 25" yazılmış: baskı hatası, doğrusu f<sub>1</sub>(10) = 25.)</div>
<h3>Alternatif formülasyon: g(w)</h3>
<p>g(w) = w ağırlıklı çantanın maks faydası olsun (stage indeksi yok):</p>
<div class="model">g(w) = max<sub>j: w<sub>j</sub> ≤ w</sub> { b<sub>j</sub> + g(w − w<sub>j</sub>) },   g(0) = 0      (8)</div>
<p>j = eşya, b<sub>j</sub> = faydası, w<sub>j</sub> = ağırlığı. Aynı örnekte (hiçbir eşya sığmıyorsa g = 0):</p>
${tbl(['w', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [['g(w)'].concat(ksG.map((v, d) => (d === 10 ? hl(v) : v)))], 'mtx')}
<p>Örn. g(7) = max{11 + g(3) = 18, 7 + g(4) = 18, 12 + g(2) = 12} = 18; g(10) = max{11 + g(6) = 25, 7 + g(7) = 25, 12 + g(5) = 24} = 25.</p>
<div class="warnbox"><b>Sınavda dikkat:</b> (1) Bu <i>unbounded</i> knapsack'tir (x<sub>t</sub> ≥ 0 integer, her tipten istediğin kadar). 0-1 knapsack'te x<sub>t</sub> ∈ {0,1} olurdu (bu kısım notlarda yok). (2) State = <b>kalan kapasite</b> d; f<sub>t+1</sub>(d − w<sub>t</sub> x<sub>t</sub>). (3) Bu örnekte LP relaxation üst sınırı 10 · 11/4 = 27.5'tir (notlarda yok), DP optimumu 25. (4) Retrace: x<sub>1</sub>(10) → x<sub>2</sub>(10 − 4x<sub>1</sub>) → x<sub>3</sub>(kalan).</div>
`;

  OR.content.concepts['6.5.2'] = [
    {
      q: 'Knapsack\'i generalized resource allocation (7) ile çözerken r<sub>t</sub>, g<sub>t</sub> ve w neye karşılık gelir?',
      options: [
        'r<sub>t</sub>(x<sub>t</sub>) = b<sub>t</sub> x<sub>t</sub> (fayda), g<sub>t</sub>(x<sub>t</sub>) = w<sub>t</sub> x<sub>t</sub> (ağırlık), w = çanta kapasitesi',
        'r<sub>t</sub> = ağırlık, g<sub>t</sub> = fayda',
        'r<sub>t</sub> = çanta kapasitesi, w = fayda',
        'g<sub>t</sub> = stage sayısı',
      ],
      answer: 0,
      explain: 'Notlardaki Example 6.6: r<sub>1</sub> = 11x<sub>1</sub>, g<sub>1</sub> = 4x<sub>1</sub> vb. Fayda getiri, ağırlık harcanan kaynaktır.',
    },
    {
      q: 'Example 6.6\'da f<sub>3</sub>(10) ve x<sub>3</sub>(10) nedir? (tip 3: ağırlık 5, fayda 12)',
      options: ['24 ve 2', '12 ve 1', '24 ve 1', '36 ve 3'],
      answer: 0,
      explain: 'Stage 3\'te yalnız tip 3 var: 5 x<sub>3</sub> ≤ 10 ⇒ x<sub>3</sub> ≤ 2; max 12·2 = 24.',
    },
    {
      q: 'f<sub>3</sub>(7) ve x<sub>3</sub>(7)?',
      options: ['12 ve 1', '24 ve 2', '0 ve 0', '12 ve 2'],
      answer: 0,
      explain: 'd = 7: 5 x<sub>3</sub> ≤ 7 ⇒ x<sub>3</sub> ∈ {0, 1}. x<sub>3</sub> = 1 ⇒ 12.',
    },
    {
      q: 'f<sub>2</sub>(9) kaçtır ve x<sub>2</sub>(9)? (tip 2: ağırlık 3, fayda 7; f<sub>3</sub>(9) = 12, f<sub>3</sub>(6) = 12, f<sub>3</sub>(3) = 0, f<sub>3</sub>(0) = 0)',
      options: ['21 ve 3', '19 ve 1', '14 ve 2', '12 ve 0'],
      answer: 0,
      explain: 'x<sub>2</sub>=0: 12; x<sub>2</sub>=1: 7 + f<sub>3</sub>(6) = 19; x<sub>2</sub>=2: 14 + f<sub>3</sub>(3) = 14; x<sub>2</sub>=3: 21 + f<sub>3</sub>(0) = 21. Max 21 (x<sub>2</sub> = 3).',
    },
    {
      q: 'f<sub>2</sub>(8) = ? (f<sub>3</sub>(8) = 12, f<sub>3</sub>(5) = 12, f<sub>3</sub>(2) = 0)',
      options: ['19 (x<sub>2</sub> = 1)', '14 (x<sub>2</sub> = 2)', '12 (x<sub>2</sub> = 0)', '21 (x<sub>2</sub> = 3)'],
      answer: 0,
      explain: 'x<sub>2</sub> = 0: 12; x<sub>2</sub> = 1: 7 + f<sub>3</sub>(5) = 19; x<sub>2</sub> = 2: 14 + f<sub>3</sub>(2) = 14; x<sub>2</sub> = 3 sığmaz (9 > 8). Max 19.',
    },
    {
      q: 'f<sub>1</sub>(10) ve optimal x<sub>1</sub>(10)? (tip 1: ağırlık 4, fayda 11; f<sub>2</sub>(10) = 24, f<sub>2</sub>(6) = 14, f<sub>2</sub>(2) = 0)',
      options: ['25 ve 1', '24 ve 0', '22 ve 2', '26 ve 1'],
      answer: 0,
      explain: 'x<sub>1</sub> = 0: 24; x<sub>1</sub> = 1: 11 + f<sub>2</sub>(6) = 25; x<sub>1</sub> = 2: 22 + f<sub>2</sub>(2) = 22. Max 25.',
    },
    {
      q: '10 lb\'lik çanta için optimal doldurma nedir?',
      options: [
        '1 adet tip 1 + 2 adet tip 2 (fayda 25)',
        '2 adet tip 3 (fayda 24)',
        '2 adet tip 1 (fayda 22)',
        '1 adet tip 1 + 1 adet tip 3 (fayda 23)',
      ],
      answer: 0,
      explain: 'x<sub>1</sub>(10) = 1 ⇒ kalan 6 lb ⇒ x<sub>2</sub>(6) = 2 ⇒ kalan 0 ⇒ x<sub>3</sub>(0) = 0. Ağırlık 4 + 6 = 10, fayda 11 + 14 = 25. 4 + 5 = 9 lb olan 1 tip 1 + 1 tip 3 ise 23 verir.',
    },
    {
      q: 'Alternatif formülasyonda g(w) = max<sub>j</sub>{ b<sub>j</sub> + g(w − w<sub>j</sub>) }. g(7) kaçtır? (items: (w, b) = (4, 11), (3, 7), (5, 12); g(0..4) = 0, 0, 0, 7, 11)',
      options: ['18', '14', '12', '22'],
      answer: 0,
      explain: 'g(7) = max{11 + g(3) = 18, 7 + g(4) = 7 + 11 = 18, 12 + g(2) = 12} = 18.',
    },
    {
      q: 'g(w) formülasyonunun f<sub>t</sub>(d) formülasyonuna göre farkı nedir?',
      options: [
        'g(w) tek bir fonksiyondur (stage indeksi yok); her adımda bir eşya seçilir',
        'g(w) yalnızca 0-1 knapsack için geçerlidir',
        'g(w) ileriye doğru çözülemez',
        'g(w) fayda yerine maliyet minimize eder',
      ],
      answer: 0,
      explain: 'Notlardaki (8): her eşya tipi için tekrar kullanılabildiğinden stage kullanmadan g(w) = max{ b<sub>j</sub> + g(w − w<sub>j</sub>) } yazılır; sonuç aynıdır (g(10) = 25).',
    },
    {
      q: '(Notlarda yok) Bu örnekte LP relaxation üst sınırı kaçtır? (en iyi fayda/ağırlık oranı 11/4)',
      options: ['27.5', '25', '24', '30'],
      answer: 0,
      explain: 'Oranlar: 11/4 = 2.75, 7/3 ≈ 2.33, 12/5 = 2.4. Tüm 10 lb en iyi orana verilince 27.5 (LP relaxation). IP (DP) optimumu 25 ≤ 27.5.',
    },
    {
      q: 'Notlardaki Example 6.6 özetinde "maximum benefit … f<sub>3</sub>(10) = 25" ifadesi neden bir baskı hatasıdır?',
      options: [
        'Çünkü f<sub>3</sub>(10) = 24; 25 değeri f<sub>1</sub>(10)\'dur',
        'Çünkü f<sub>3</sub>(10) = 12',
        'Çünkü optimum 24\'tür',
        'Çünkü f<sub>3</sub>(10) = 36',
      ],
      answer: 0,
      explain: 'Stage 3 tablosu f<sub>3</sub>(10) = 24 verir (2 adet tip 3). Tüm eşya tipleri kullanılabildiği stage-1 değeri f<sub>1</sub>(10) = 25\'tir.',
    },
  ];

  /* ====================================================================== 6.6 */
  OR.content.summaries['6.6'] = `
<h2>6.6 Equipment Replacement Problems</h2>
<p>Bir makinenin yenisiyle değiştirilmeden (trade-in) önce ne kadar kullanılacağı problemleri equipment-replacement problemleridir ve DP ile çözülür.</p>
<div class="box"><b>Example 6.7 (Winston 18.5).</b> Yeni bir engine analyzer $1000. İşletim yılı i'deki bakım maliyeti: m<sub>1</sub> = $60, m<sub>2</sub> = $80, m<sub>3</sub> = $120. Makine 1, 2 veya 3 yıl kullanılıp trade-in edilebilir; i yaşındaki makinenin salvage value'su s<sub>1</sub> = $800, s<sub>2</sub> = $600, s<sub>3</sub> = $500. Şimdi (t = 0) yeni makine alınmalı. Önümüzdeki 5 yılda net maliyet = <b>maintenance + replacement − salvage</b> minimize edilsin.</div>
<h3>Tanımlar</h3>
<ul>
  <li><b>g(t)</b> = t anında yeni makine alınmışsa, t'den 5'e kadar oluşan min net maliyet (t'de alınan makinenin alış ve satış değeri dahil). <b>g(5) = 0.</b></li>
  <li><b>c<sub>tx</sub></b> = t'de alınan makineyi x'e kadar kullanıp satmanın net maliyeti = <b>$1000 + m<sub>1</sub> + … + m<sub>x−t</sub> − s<sub>x−t</sub></b>. Maliyetler zamanla değişmediği için c<sub>tx</sub> yalnızca x − t'ye bağlıdır.</li>
  <li><b>Recursion (9):</b> g(t) = min<sub>x</sub> { c<sub>tx</sub> + g(x) },  t + 1 ≤ x ≤ t + 3,  x ≤ 5.</li>
</ul>
<p>Burada <b>state</b> = "yeni bir makine alınan zaman t" (makinenin yaşı 0), <b>decision</b> = makineyi hangi zamanda (x) değiştireceğiz. Bu, 0…5 düğümlü bir <b>network'te en kısa yol</b> problemidir: düğüm = zaman, arc (t → x) = makineyi t'den x'e kadar tutmak, maliyeti c<sub>tx</sub>; x − t ≤ 3.</p>
${tbl(
  ['Tutma süresi (yıl)', 'c = 1000 + Σm − s', 'Değer'],
  [
    [1, '1000 + 60 − 800', 260],
    [2, '1000 + 60 + 80 − 600', 540],
    [3, '1000 + 60 + 80 + 120 − 500', 760],
  ],
  'mtx'
)}
<p>Yani c<sub>t,t+1</sub> = 260, c<sub>t,t+2</sub> = 540, c<sub>t,t+3</sub> = 760.</p>
<h3>Backward (g(4) → g(0))</h3>
<ul>
  <li>g(4) = c<sub>45</sub> + g(5) = 260 + 0 = <b>260</b> (tek mantıklı karar: 5'te sat).</li>
  <li>g(3) = min{ c<sub>34</sub> + g(4) = 260 + 260 = <b>520*</b>, c<sub>35</sub> + g(5) = 540 + 0 = 540 } = 520 ⇒ 4'te değiştir.</li>
  <li>g(2) = min{ c<sub>23</sub> + g(3) = 260 + 520 = 780, c<sub>24</sub> + g(4) = 540 + 260 = 800, c<sub>25</sub> + g(5) = <b>760*</b> } = 760 ⇒ 5'e kadar tut.</li>
  <li>g(1) = min{ c<sub>12</sub> + g(2) = 260 + 760 = <b>1020*</b>, c<sub>13</sub> + g(3) = 540 + 520 = 1060, c<sub>14</sub> + g(4) = 760 + 260 = <b>1020*</b> } = 1020 ⇒ 2 veya 4'te değiştir.</li>
  <li>g(0) = min{ c<sub>01</sub> + g(1) = 260 + 1020 = <b>1280*</b>, c<sub>02</sub> + g(2) = 540 + 760 = 1300, c<sub>03</sub> + g(3) = 760 + 520 = <b>1280*</b> } = 1280 ⇒ 1 veya 3'te değiştir.</li>
</ul>
${tbl(
  ['t', 'g(t)', 'Optimal x'],
  [[5, 0, '—'], [4, 260, '5'], [3, 520, '4'], [2, 760, '5'], [1, 1020, '2 veya 4'], [0, hl(1280), '1 veya 3']],
  'mtx'
)}
<div class="tip"><b>Optimal Solution and Report:</b> g(0) = <b>$1280</b>. Notlardaki seçim: 0'daki makineyi 1'de, 1'deki makineyi 2'de değiştir, 2'deki makineyi 5'e kadar tut (satış 5'te). Diğer optimal politikalar: <b>1, 4, 5</b> ve <b>3, 4, 5</b>'te trade-in. Toplam <b>3 optimal politika</b>: (0-1-2-5), (0-1-4-5), (0-3-4-5).</div>
<p><b>Review (notlar):</b> Maliyetlerin zamanla sabit olması yalnızca c<sub>tx</sub> hesabını kolaylaştırır; sabit olmasaydı c<sub>tx</sub> daha karmaşık hesaplanırdı. Kısa planlama ufkunda optimal politika ufuk uzunluğuna çok duyarlı olabilir; daha anlamlı sonuç için <b>uzun planlama ufku</b> kullanılmalıdır.</p>
<div class="warnbox"><b>Sınavda dikkat:</b> c<sub>tx</sub>'te satın alma ($1000) <b>bir kez</b> eklenir, bakım maliyetleri <b>yaşa göre</b> (m<sub>1</sub>, m<sub>2</sub>, …) toplanır ve salvage <b>çıkarılır</b>. x ≤ 5 ve x ≤ t + 3 sınırları unutulmamalı (g(4) ve g(3)'te seçenekler azalır). Tie'lar varsa tüm optimal politikalar yazılabilir (g(1) ve g(0)'da tie var).</div>
`;

  OR.content.concepts['6.6'] = [
    {
      q: 'Equipment replacement örneğinde g(t) neyi gösterir?',
      options: [
        'Zaman t\'de yeni makine alınmışsa t\'den 5\'e kadar oluşan minimum net maliyet (alış ve satış dahil)',
        'Makinenin t yaşındaki bakım maliyeti',
        'Makinenin t yılındaki salvage value\'su',
        'Zaman 0\'dan t\'ye kadar harcanan toplam maliyet',
      ],
      answer: 0,
      explain: 'Notlar: "g(t) minimum net cost incurred from time t until time 5 (including purchase cost and salvage value for the newly purchased machine) given that a new machine has been purchased at time t". g(5) = 0.',
    },
    {
      q: 'c<sub>tx</sub> formülü hangisidir? (x − t = k yıl kullanım)',
      options: [
        '1000 + m<sub>1</sub> + … + m<sub>k</sub> − s<sub>k</sub>',
        '1000 + m<sub>k</sub> + s<sub>k</sub>',
        '1000 · k + m<sub>1</sub> + … + m<sub>k</sub>',
        'm<sub>1</sub> + … + m<sub>k</sub> + s<sub>k</sub> − 1000',
      ],
      answer: 0,
      explain: 'Net maliyet = satın alma (bir kez) + k yıllık bakım − satışta elde edilen salvage value.',
    },
    {
      q: 'Notlardaki veriyle (m<sub>1</sub> = 60, m<sub>2</sub> = 80, m<sub>3</sub> = 120; s<sub>1</sub> = 800, s<sub>2</sub> = 600, s<sub>3</sub> = 500; yeni makine 1000) makineyi 2 yıl tutmanın net maliyeti c<sub>t,t+2</sub> kaçtır?',
      options: ['540', '260', '760', '600'],
      answer: 0,
      explain: 'c = 1000 + 60 + 80 − 600 = 540. (1 yıl: 260; 3 yıl: 1000 + 60 + 80 + 120 − 500 = 760.)',
    },
    {
      q: 'Recursion (9)\'daki x için doğru kısıtlar hangileridir?',
      options: [
        't + 1 ≤ x ≤ t + 3 ve x ≤ 5',
        't ≤ x ≤ t + 3 ve x ≤ 5',
        't + 1 ≤ x ≤ 5 (3 yıl sınırı yok)',
        '1 ≤ x ≤ 3',
      ],
      answer: 0,
      explain: 'Makine en az 1, en çok 3 yıl tutulabilir (x ≥ t+1, x ≤ t+3); planlama ufku 5 olduğu için x ≤ 5. Bu yüzden g(4)\'te yalnızca x = 5, g(3)\'te x ∈ {4, 5} kalır.',
    },
    {
      q: 'g(4), g(3) ve g(2) değerleri sırasıyla nedir?',
      options: ['260, 520, 760', '260, 540, 780', '260, 520, 780', '540, 520, 760'],
      answer: 0,
      explain: 'g(4) = c<sub>45</sub> = 260. g(3) = min{260 + 260, 540} = 520 (x = 4). g(2) = min{260 + 520, 540 + 260, 760} = min{780, 800, 760} = 760 (x = 5).',
    },
    {
      q: 'g(1) hesaplanırken optimal x değerleri nedir?',
      options: ['x = 2 veya x = 4 (tie, g(1) = 1020)', 'yalnızca x = 3', 'yalnızca x = 2', 'x = 2, 3 veya 4'],
      answer: 0,
      explain: 'c<sub>12</sub> + g(2) = 260 + 760 = 1020; c<sub>13</sub> + g(3) = 540 + 520 = 1060; c<sub>14</sub> + g(4) = 760 + 260 = 1020. Minimum 1020, iki yerde.',
    },
    {
      q: 'g(0) kaçtır ve bu hangi karar(lar) ile sağlanır?',
      options: ['1280; x = 1 veya x = 3', '1300; x = 2', '1020; x = 4', '1280; yalnızca x = 1'],
      answer: 0,
      explain: 'c<sub>01</sub> + g(1) = 260 + 1020 = 1280; c<sub>02</sub> + g(2) = 540 + 760 = 1300; c<sub>03</sub> + g(3) = 760 + 520 = 1280. İki seçenek tie.',
    },
    {
      q: 'Bu problemde toplam kaç <b>farklı optimal replacement politikası</b> vardır? (Trade-in zamanlarını 0 ile 5 arasında düşün)',
      options: ['3: (1,2,5), (1,4,5), (3,4,5)', '1', '2', '4'],
      answer: 0,
      explain: 'g(0): x = 1 veya 3. x = 1 ise g(1): x = 2 (sonra g(2): x = 5) veya x = 4 (sonra 5). x = 3 ise g(3): x = 4, sonra 5. Üç politika; hepsi 1280. (Notlar da ilk ikisini ve (3,4,5)\'i belirtir.)',
    },
    {
      q: 'Her yıl makineyi değiştirmek (0-1-2-3-4-5) toplam kaça mal olur?',
      options: ['1300', '1280', '1020', '1560'],
      answer: 0,
      explain: 'Beş kez c<sub>t,t+1</sub> = 260 ⇒ 5 · 260 = 1300 > g(0) = 1280. Optimal politika bundan 20 $ daha ucuz.',
    },
    {
      q: 'Equipment replacement problemi hangi problemin özel bir halidir/hangi şekilde modellenebilir?',
      options: [
        'Düğümleri zaman noktaları (0,…,5), arc\'ları (t → x) c<sub>tx</sub> uzunluklu bir network\'te 0\'dan 5\'e en kısa yol',
        'Transportation problemi',
        'Knapsack problemi',
        'TSP',
      ],
      answer: 0,
      explain: 'g(t) = min{c<sub>tx</sub> + g(x)} tam olarak şebekede en kısa yol recursion\'ıdır (shortest path); g(0) 0\'dan 5\'e en kısa yol uzunluğudur.',
    },
    {
      q: 'Notlardaki "Review" kısmına göre kısa planlama ufuklu replacement analizi için ne önerilir?',
      options: [
        'Optimal politika ufuk uzunluğuna çok duyarlı olabileceğinden daha uzun bir planlama ufku kullanmak',
        'Planlama ufkunu mümkün olduğunca kısa tutmak',
        'Maliyetleri sabit varsaymak',
        'Salvage value\'yu ihmal etmek',
      ],
      answer: 0,
      explain: 'Notlar: "if a short planning horizon is used, the optimal replacement policy may be extremely sensitive to the length of the planning horizon. Thus, more meaningful results can be obtained by using a longer planning horizon."',
    },
  ];

  /* ====================================================================== 6.7 */
  OR.content.summaries['6.7'] = `
<h2>6.7 Formulating DP Recursions</h2>
<p>Birçok DP probleminde (inventory, shortest path) bir stage, sistemin o stage'de bulunabileceği tüm state'lerden oluşur. Bu durumda min problemi için recursion çoğunlukla şu formdadır:</p>
<div class="model">f<sub>t</sub>(i) = min { (cost during stage t) + f<sub>t+1</sub>(new state at stage t+1) }      (10)</div>
<p>min, state i iken <b>feasible</b> olan tüm kararlar üzerindendir; f<sub>t</sub>(i), stage t'den problemin sonuna (T) kadar olan min maliyettir. Recursion yazmak için üç şey belirlenir:</p>
<ol>
  <li><b>Feasible kararlar kümesi</b> (t ve i'ye bağlı). Inventory: 0 ≤ i<sub>t</sub> + x<sub>t</sub> − d<sub>t</sub> ≤ 4, x<sub>t</sub> ∈ {0,…,5}.</li>
  <li><b>Stage t'de oluşan maliyet</b> (t, state ve kararın fonksiyonu): inventory'de c(x<sub>t</sub>) + ½(i<sub>t</sub> + x<sub>t</sub> − d<sub>t</sub>).</li>
  <li><b>Stage t+1 state'i</b> (t, state ve karara bağlı): i<sub>t+1</sub> = i<sub>t</sub> + x<sub>t</sub> − d<sub>t</sub>.</li>
</ol>
<div class="warnbox">Dikkat: Her recursion (10) formunda <b>değildir</b> (aşağıda çarpımsal ve minimax örnekleri).</div>

<h3>Example 6.8 – A Fishery (Winston 18.6)</h3>
<p>Göl sahibi her yıl x levrek yakalayıp satar: gelir r(x); yakalama maliyeti c(x, b), b = yıl başındaki levrek sayısı. Yıl başında levrek sayısı, bir önceki yıl sonunda kalanın <b>%20 fazlası</b>. T yıllık net kârı max.</p>
<ul>
  <li><b>Stage</b> = yıl t (yıl T'de gelecek yok ⇒ kolay). <b>State</b> b<sub>t</sub> = yıl başındaki levrek. <b>Decision</b> x<sub>t</sub> = yakalanan levrek.</li>
  <li>(1) Feasible: <b>0 ≤ x<sub>t</sub> ≤ b<sub>t</sub></b>. (2) Yıl t kârı: <b>r(x<sub>t</sub>) − c(x<sub>t</sub>, b<sub>t</sub>)</b>. (3) Sonraki state: <b>1.2 (b<sub>t</sub> − x<sub>t</sub>)</b>.</li>
</ul>
<div class="model">f<sub>T</sub>(b) = max { r(x) − c(x, b) },   0 ≤ x ≤ b
f<sub>t</sub>(b) = max { r(x) − c(x, b) + f<sub>t+1</sub>(1.2(b − x)) },   0 ≤ x ≤ b      (11)</div>
<p>(Maksimizasyon problemi olduğu için (10)'daki min yerine max.)</p>

<h3>6.7.1 Incorporating the Time Value of Money</h3>
<p>Yukarıdaki formülasyonda sonraki yılların kârı bugünküyle aynı ağırlıktadır; oysa sonraki kâr daha az ağırlıklandırılmalıdır. <b>β &lt; 1</b> için "t+1. yılın başında alınan $1, t. yılın başında alınan β dolara eşdeğerdir" (discount factor). Recursion'da f<sub>t+1</sub> terimi β ile çarpılır:</p>
<div class="model">f<sub>t</sub>(b) = max { r(x) − c(x, b) + β f<sub>t+1</sub>(1.2(b − x)) },   0 ≤ x ≤ b      (12)</div>
<p>(Notlarda "replacing (12) with (12)" yazar; kast edilen: (11)'i (12) ile değiştirmek. β = 1/(1 + faiz oranı) gösterimi notlarda açık yazılmaz.)</p>

<h3>Example 6.9 – Power Plant (Winston 18.6)</h3>
<p>Yıl t'de r<sub>t</sub> kWh kapasite gerekli; x kWh genişletme maliyeti c<sub>t</sub>(x) (x negatif de olabilir). Her yıl eski kapasitenin %10'u kullanılamaz hâle gelir (yeni kapasite ilk yıl eskimez). i birim kapasitenin yıllık bakımı m<sub>t</sub>(i). Başlangıç kapasitesi 100 000 kWh.</p>
<ul>
  <li><b>State</b> i<sub>t</sub> = yıl başındaki kapasite. <b>Decision</b> x<sub>t</sub> = eklenen kapasite.</li>
  <li>(1) Feasible: i<sub>t</sub> + x<sub>t</sub> ≥ r<sub>t</sub> ⇒ <b>x<sub>t</sub> ≥ r<sub>t</sub> − i<sub>t</sub></b>. (2) Maliyet: <b>c<sub>t</sub>(x<sub>t</sub>) + m<sub>t</sub>(x<sub>t</sub> + i<sub>t</sub>)</b>. (3) Sonraki state: <b>0.9 i<sub>t</sub> + x<sub>t</sub></b>.</li>
</ul>
<div class="model">f<sub>T</sub>(i<sub>T</sub>) = min { c<sub>T</sub>(x<sub>T</sub>) + m<sub>T</sub>(x<sub>T</sub> + i<sub>T</sub>) },   x<sub>T</sub> ≥ r<sub>T</sub> − i<sub>T</sub>      (13)
f<sub>t</sub>(i<sub>t</sub>) = min { c<sub>t</sub>(x<sub>t</sub>) + m<sub>t</sub>(x<sub>t</sub> + i<sub>t</sub>) + f<sub>t+1</sub>(0.9 i<sub>t</sub> + x<sub>t</sub>) },   x<sub>t</sub> ≥ r<sub>t</sub> − i<sub>t</sub>      (14)</div>

<h3>Example 6.10 – Wheat Sale (Winston 18.6): iki boyutlu state</h3>
<p>Çiftçi Jones $5000 nakit ve 1000 bushel buğdaya sahip; ay t'de fiyat p<sub>t</sub>. Kısıtlar: (1) harcanan para eldeki nakdi aşamaz, (2) eldekinden fazla satılamaz, (3) ay sonu stoğu ≤ 1000 bushel. 6 ay sonunda nakit max.</p>
<ul>
  <li><b>Decision</b> Δw<sub>t</sub> (≥ 0 alım, ≤ 0 satım). <b>State</b> iki boyutlu: (c<sub>t</sub>, w<sub>t</sub>) = nakit ve buğday stoğu. f<sub>t</sub>(c<sub>t</sub>, w<sub>t</sub>) = 6. ay sonunda elde edilebilecek maks nakit.</li>
  <li>Feasible: <b>−w<sub>t</sub> ≤ Δw<sub>t</sub> ≤ min{ c<sub>t</sub>/p<sub>t</sub>, 1000 − w<sub>t</sub> }</b> (p<sub>t</sub>Δw<sub>t</sub> ≤ c<sub>t</sub>; satış ≤ stok; w<sub>t</sub> + Δw<sub>t</sub> ≤ 1000).</li>
  <li>Aylar 1–5'te anlık kazanç yoktur (sadece "bookkeeping"); sonraki state: (c<sub>t</sub> − Δw<sub>t</sub> p<sub>t</sub>, w<sub>t</sub> + Δw<sub>t</sub>).</li>
</ul>
<div class="model">f<sub>6</sub>(c<sub>6</sub>, w<sub>6</sub>) = c<sub>6</sub> + w<sub>6</sub> p<sub>6</sub>      (15)    (ay 6'da tüm buğday satılır, Δw<sub>6</sub> = −w<sub>6</sub>)
f<sub>t</sub>(c<sub>t</sub>, w<sub>t</sub>) = max<sub>Δw<sub>t</sub></sub> f<sub>t+1</sub>(c<sub>t</sub> − Δw<sub>t</sub> p<sub>t</sub>, w<sub>t</sub> + Δw<sub>t</sub>),   t &lt; 6      (16)</div>

<h3>Example 6.11 – Refinery Capacity: stage = site sayısı</h3>
<p>Sunco günde 5000 varil petrol ve 10 000 varil benzin rafine edecek kapasiteyi 4 sahada kurabilir; t sahasında x varil/gün petrol, y varil/gün benzin kapasitesi maliyeti c<sub>t</sub>(x, y). Burada <b>stage = kullanılabilir saha sayısı</b>; f<sub>t</sub>(o<sub>t</sub>, g<sub>t</sub>) = t, …, 4 sahalarında o<sub>t</sub> petrol + g<sub>t</sub> benzin kapasitesi kurmanın min maliyeti.</p>
<div class="model">f<sub>4</sub>(o<sub>4</sub>, g<sub>4</sub>) = c<sub>4</sub>(o<sub>4</sub>, g<sub>4</sub>)
f<sub>t</sub>(o<sub>t</sub>, g<sub>t</sub>) = min { c<sub>t</sub>(x<sub>t</sub>, y<sub>t</sub>) + f<sub>t+1</sub>(o<sub>t</sub> − x<sub>t</sub>, g<sub>t</sub> − y<sub>t</sub>) },   0 ≤ x<sub>t</sub> ≤ o<sub>t</sub>, 0 ≤ y<sub>t</sub> ≤ g<sub>t</sub>   (t = 1, 2, 3)      (17)</div>

<h3>6.7.2 Solving Recursions</h3>
<p>DP formülasyonu Python, Matlab, C++ gibi dillerle çözülebilir; problemde tanımlı parametre ve fonksiyonlar verilir. <b>Example 6.12 (Fishery'nin devamı):</b> r(x) = 40 x<sup>0.5</sup>, c(x, b) = 120x/b, β = 0.95; x bin cinsinden; sonraki yılın levreği round(1.2 (b − x)); T = 10, b<sub>1</sub> = 20. Notlardaki Python kodu <b>memoization ile özyinelemeli</b> recursion'dır:</p>
<ul>
  <li><code>bassprofit(t, b, T, beta)</code>: <b>t == T + 1</b> ise 0 döndürür (f<sub>T+1</sub> = 0, taban durum).</li>
  <li><code>fonk[t, b]</code> sözlüğü daha önce hesaplanmış f<sub>t</sub>(b) değerini saklar; varsa <b>tekrar hesaplamadan</b> döndürür (memoization).</li>
  <li>Aksi hâlde <code>for x in range(b+1)</code> ile tüm feasible x denenir: <code>revenue(x) − cost(x, b) + beta · bassprofit(t+1, round(1.2(b−x)), …)</code>; en büyük değer, karar x ve sonraki state <code>decisionx</code> / <code>nextb</code> sözlüklerine kaydedilir. cost(x, b) = 0 eğer b = 0 veya x = 0.</li>
  <li>Sonda <code>nextb</code> zinciri izlenerek yıl yıl "başlangıç levreği / yakalanan" yazdırılır (retrace).</li>
</ul>

<h3>6.7.3 Nonadditive Recursions</h3>
<p><b>Example 6.13a – Multiplicative Recursion.</b> max g<sub>1</sub>(x<sub>1</sub>) g<sub>2</sub>(x<sub>2</sub>) g<sub>3</sub>(x<sub>3</sub>), x<sub>1</sub> + x<sub>2</sub> + x<sub>3</sub> = 4, x<sub>j</sub> ≥ 0 integer; g<sub>1</sub>(x) = x, g<sub>2</sub>(x) = 2 − x, g<sub>3</sub>(x) = x². Recursion: <b>f<sub>t</sub>(s) = max<sub>x</sub> { g<sub>t</sub>(x) · f<sub>t+1</sub>(s − x) }</b> (toplam yerine <i>çarpım</i>). Stage 3: f<sub>3</sub>(s) = s² ⇒ f<sub>3</sub>(0..4) = 0, 1, 4, 9, 16. Stage 2: f<sub>2</sub>(4) = 32, f<sub>2</sub>(3) = 18, f<sub>2</sub>(2) = 8, f<sub>2</sub>(1) = 2, f<sub>2</sub>(0) = 0 (hepsi x<sub>2</sub> = 0, çünkü g<sub>2</sub>(0) = 2 en büyük çarpandır). Stage 1: f<sub>1</sub>(4) = max{0, 1·f<sub>2</sub>(3) = 18, 2·f<sub>2</sub>(2) = 16, 3·f<sub>2</sub>(1) = 6, 4·f<sub>2</sub>(0) = 0} = <b>18</b> ⇒ x<sub>1</sub> = 1, sonra x<sub>2</sub>(3) = 0, x<sub>3</sub> = 3: <b>(x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>) = (1, 0, 3)</b>, çarpım 1·2·9 = 18. (Notlarda "Stage 2 calculation: f<sub>1</sub>(4) = 18" başlığı baskı hatası: bu stage 1 hesabıdır.)</p>
<p><b>Example 6.13b – Minimax Shortest Route (Winston 18.6).</b> Joe 1'den 10'a giderken yol uzunluğu değil, karşılaştığı <b>maksimum yüksekliği</b> minimize etmek ister; c<sub>ij</sub> = i→j arcında karşılaşılan maks yükseklik (bin feet). t stage'inden itibaren maks yükseklik = max{ (1) stage t+1, …, 5 arasındaki maks yükseklik, (2) stage t'deki arc'ın yüksekliği }:</p>
<div class="model">f<sub>t</sub>(i) = min<sub>j</sub> { max( c<sub>ij</sub>, f<sub>t+1</sub>(j) ) },    f<sub>4</sub>(i) = c<sub>i,10</sub>      (18)</div>
<p>j, i'den bir arc ile bağlı herhangi bir şehirdir. Notlardaki sonuç: f<sub>1</sub>(1) = 8 (8000 ft); optimal yollar 1-3-5-8-10 (ve 1-4-6-8-10). (Arc yüksekliklerinin şekli notlarda resimdir.) Burada toplama yerine <b>max</b> kullanıldığı için recursion nonadditive'dir ama aynı geriye çalışma mantığı geçerlidir.</p>
<div class="warnbox"><b>Sınavda dikkat:</b> (1) State'i doğru seçmek zor kısımdır: Wheat'te (c, w) iki boyutlu, Refinery'de (o, g); stage de zaman olmayabilir (Refinery: saha sayısı). (2) Feasible karar kümesi hem state'e hem stage'e bağlıdır. (3) β ile discount: yalnızca <i>gelecek</i> terim β f<sub>t+1</sub>; bugünün kârı ağırlıklandırılmaz. (4) Çarpımsal recursion'da min/max-çarpım için tablo yine geriye doğru kurulur; ama formun f<sub>t</sub>(s) = max{g<sub>t</sub>(x) f<sub>t+1</sub>(s−x)} geçerli olması g'lerin işaretine bağlıdır (negatif çarpan riski; notlarda yok). (5) Notlardaki "(11)/(12)" numaraları metinde karışmıştır.</div>
`;

  OR.content.concepts['6.7'] = [
    {
      q: 'Min problemi için (10) numaralı genel recursion formu hangisidir?',
      options: [
        'f<sub>t</sub>(i) = min{ (stage t maliyeti) + f<sub>t+1</sub>(stage t+1\'deki yeni state) }, min feasible kararlar üzerinden',
        'f<sub>t</sub>(i) = min{ (stage t maliyeti) · f<sub>t−1</sub>(i) }',
        'f<sub>t</sub>(i) = max{ f<sub>t+1</sub>(i) } − (stage t maliyeti)',
        'f<sub>t</sub>(i) = f<sub>t+1</sub>(i) + f<sub>t−1</sub>(i)',
      ],
      answer: 0,
      explain: 'Notlar (10): ft(i) = min{(cost during stage t) + ft+1(new state at stage t+1)}; f<sub>t</sub>(i) stage t\'den sona kadar min maliyettir.',
    },
    {
      q: 'Recursion yazarken belirlenmesi gereken üç unsur hangileridir?',
      options: [
        'Feasible kararlar kümesi; stage t maliyeti; stage t+1 state\'i',
        'Amaç fonksiyonu katsayıları; kısıt matrisi; baz değişkenler',
        'Başlangıç çözümü; step size; durma kuralı',
        'Alt sınır; üst sınır; branching değişkeni',
      ],
      answer: 0,
      explain: 'Notlardaki aspect 1–3: allowable decisions (t ve i\'ye bağlı), cost during stage t, state at stage t+1.',
    },
    {
      q: 'Fishery örneğinde (Example 6.8) allowable karar kümesi ve sonraki yılın state\'i nedir?',
      options: [
        '0 ≤ x<sub>t</sub> ≤ b<sub>t</sub>; b<sub>t+1</sub> = 1.2 (b<sub>t</sub> − x<sub>t</sub>)',
        '0 ≤ x<sub>t</sub> ≤ b<sub>t+1</sub>; b<sub>t+1</sub> = 1.2 b<sub>t</sub> − x<sub>t</sub>',
        'x<sub>t</sub> ≥ b<sub>t</sub>; b<sub>t+1</sub> = 0.8 (b<sub>t</sub> − x<sub>t</sub>)',
        '0 ≤ x<sub>t</sub> ≤ 1.2 b<sub>t</sub>; b<sub>t+1</sub> = b<sub>t</sub> − x<sub>t</sub>',
      ],
      answer: 0,
      explain: 'Gölde olandan fazla levrek yakalanamaz. Yıl sonunda b<sub>t</sub> − x<sub>t</sub> kalır ve %20 çoğalır ⇒ 1.2 (b<sub>t</sub> − x<sub>t</sub>).',
    },
    {
      q: 'Fishery\'de son yıl T için recursion nedir?',
      options: [
        'f<sub>T</sub>(b) = max{ r(x) − c(x, b) }, 0 ≤ x ≤ b (gelecek kâr yok)',
        'f<sub>T</sub>(b) = max{ r(x) − c(x, b) + f<sub>T+1</sub>(1.2(b − x)) } ile f<sub>T+1</sub> ≠ 0',
        'f<sub>T</sub>(b) = 0',
        'f<sub>T</sub>(b) = min{ r(x) + c(x, b) }',
      ],
      answer: 0,
      explain: 'Yıl T\'den sonra gelecek kâr yoktur (f<sub>T+1</sub> = 0), dolayısıyla yalnız o yılın kârı maksimize edilir. Notlar: "At time T, there is no future!"',
    },
    {
      q: 'Fishery örneğinde r(x) = 40√x, c(x, b) = 120x/b olsun. Son yılda (T) b = 4 levrek varken f<sub>T</sub>(4) ve optimal x<sub>T</sub>(4)? (x integer)',
      options: ['10 ve x = 1', '0 ve x = 0', '≈ −3.43 ve x = 2', '−40 ve x = 4'],
      answer: 0,
      explain: 'x = 0: 0; x = 1: 40 − 120/4 = 10; x = 2: 56.57 − 60 = −3.43; x = 3: 69.28 − 90 = −20.7; x = 4: 80 − 120 = −40. Maks 10 (x = 1).',
    },
    {
      q: 'Discount factor β (Section 6.7.1) fishery recursion\'ında nasıl kullanılır?',
      options: [
        'f<sub>t</sub>(b) = max{ r(x) − c(x, b) + β f<sub>t+1</sub>(1.2(b − x)) }',
        'f<sub>t</sub>(b) = max{ β [r(x) − c(x, b)] + f<sub>t+1</sub>(1.2(b − x)) }',
        'f<sub>t</sub>(b) = max{ r(x) − c(x, b) } / β',
        'f<sub>t</sub>(b) = β · max{ r(x) − c(x, b) } − f<sub>t+1</sub>',
      ],
      answer: 0,
      explain: 'β &lt; 1 için t+1. yıl başındaki $1, t. yıl başındaki β dolara eşdeğerdir; bu yüzden gelecek yılların değeri f<sub>t+1</sub> β ile çarpılır, bugünün kârı çarpılmaz.',
    },
    {
      q: 'Power plant örneğinde (Example 6.9) i<sub>t</sub> = 100 000 kWh ve x<sub>t</sub> = 20 000 kWh ekleniyorsa bir sonraki yılın state\'i (kapasite) nedir?',
      options: ['110 000', '120 000', '100 000', '90 000'],
      answer: 0,
      explain: 'Eski kapasitenin %10\'u eskir; yeni eklenen kapasite ilk yıl eskimez: 0.9 · 100 000 + 20 000 = 110 000.',
    },
    {
      q: 'Power plant örneğinde yıl t için <b>feasibility koşulu</b> ve <b>yıl maliyeti</b> hangisidir?',
      options: [
        'x<sub>t</sub> ≥ r<sub>t</sub> − i<sub>t</sub>;  c<sub>t</sub>(x<sub>t</sub>) + m<sub>t</sub>(x<sub>t</sub> + i<sub>t</sub>)',
        'x<sub>t</sub> ≥ 0;  c<sub>t</sub>(x<sub>t</sub>) + m<sub>t</sub>(i<sub>t</sub>)',
        'x<sub>t</sub> ≤ r<sub>t</sub> − i<sub>t</sub>;  c<sub>t</sub>(x<sub>t</sub>)',
        'x<sub>t</sub> = r<sub>t</sub>;  m<sub>t</sub>(x<sub>t</sub>)',
      ],
      answer: 0,
      explain: 'Talep r<sub>t</sub> karşılanmalı: i<sub>t</sub> + x<sub>t</sub> ≥ r<sub>t</sub>. Maliyet: genişletme c<sub>t</sub>(x<sub>t</sub>) + (i<sub>t</sub> + x<sub>t</sub>) birim kapasitenin bakımı. x negatif olabilir (kapasite azaltma).',
    },
    {
      q: 'Wheat sale örneğinde (Example 6.10) state ve decision nedir?',
      options: [
        'State = (c<sub>t</sub>, w<sub>t</sub>) nakit ve buğday stoğu; decision = Δw<sub>t</sub> (alım/satım)',
        'State = ay t; decision = fiyat p<sub>t</sub>',
        'State = buğday fiyatı; decision = nakit',
        'State = w<sub>t</sub> yalnız; decision = c<sub>t</sub>',
      ],
      answer: 0,
      explain: 'Δw<sub>t</sub>\'yi seçmek için hem eldeki nakit (harcama sınırı) hem de buğday stoğu (satış sınırı) bilinmelidir ⇒ iki boyutlu state. Stage = ay.',
    },
    {
      q: 'Wheat sale: p<sub>t</sub> = 10 $/bushel, c<sub>t</sub> = $5000, w<sub>t</sub> = 1000 bushel (ambar kapasitesi 1000). Bu ay <b>en fazla kaç bushel satın alınabilir</b> (Δw<sub>t</sub> üst sınırı)?',
      options: ['0', '500', '1000', '5000'],
      answer: 0,
      explain: 'Δw<sub>t</sub> ≤ min{ c<sub>t</sub>/p<sub>t</sub> = 500, 1000 − w<sub>t</sub> = 0 } = 0: ambar zaten dolu. Alt sınır −w<sub>t</sub> = −1000 (hepsini satabilir).',
    },
    {
      q: 'Wheat sale: ay t\'de (c<sub>t</sub>, w<sub>t</sub>) = (5000, 1000), p<sub>t</sub> = 10 ve Δw<sub>t</sub> = −200 seçilirse sonraki state nedir?',
      options: ['(7000, 800)', '(3000, 800)', '(7000, 1200)', '(5000, 800)'],
      answer: 0,
      explain: 'State: [c<sub>t</sub> − Δw<sub>t</sub> p<sub>t</sub>, w<sub>t</sub> + Δw<sub>t</sub>] = [5000 + 200·10, 1000 − 200] = (7000, 800).',
    },
    {
      q: 'Refinery capacity örneğinde (Example 6.11) stage nedir?',
      options: [
        'Kullanılabilir saha sayısı (t, …, 4 sahaları); state (o<sub>t</sub>, g<sub>t</sub>) = kurulması gereken petrol ve benzin kapasitesi',
        'Gün sayısı; state = varil fiyatı',
        'Her varil; state = saha numarası',
        'Yıl; state = faiz',
      ],
      answer: 0,
      explain: 'Notlar: "we let the stage represent the number of available oil sites". f<sub>4</sub>(o, g) = c<sub>4</sub>(o, g) çünkü tek saha varsa tüm kapasite orada kurulmalı.',
    },
    {
      q: 'Notlardaki Python (Example 6.12) kodunda <code>if fonk[t,b] is not None: return fonk[t,b]</code> satırının amacı nedir?',
      options: [
        'Memoization: daha önce hesaplanan f<sub>t</sub>(b) değerini tekrar hesaplamamak',
        'T+1. yıla ulaşıldığında 0 döndürmek',
        'β\'yı güncellemek',
        'Levrek sayısını yuvarlamak',
      ],
      answer: 0,
      explain: 'Özyinelemeli recursion aynı (t, b) çiftine birçok yoldan ulaşır; sonuçlar sözlükte saklanarak tekrar hesaplama engellenir. T+1 taban durumu ayrı bir if ile (return 0) ele alınır.',
    },
    {
      q: 'Çarpımsal recursion (Example 6.13): g<sub>1</sub>(x) = x, g<sub>2</sub>(x) = 2 − x, g<sub>3</sub>(x) = x², x<sub>1</sub> + x<sub>2</sub> + x<sub>3</sub> = 4. f<sub>2</sub>(3) kaçtır? (f<sub>3</sub>(s) = s²)',
      options: ['18', '9', '4', '2'],
      answer: 0,
      explain: 'f<sub>2</sub>(3) = max<sub>x</sub> g<sub>2</sub>(x) f<sub>3</sub>(3 − x): x = 0: 2·9 = 18; x = 1: 1·4 = 4; x = 2: 0·1 = 0; x = 3: (−1)·0 = 0. Max 18 (x<sub>2</sub>(3) = 0).',
    },
    {
      q: 'Aynı çarpımsal problemin optimal çözümü ve değeri nedir?',
      options: [
        '(x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>) = (1, 0, 3), çarpım 18',
        '(2, 0, 2), çarpım 16',
        '(0, 0, 4), çarpım 0',
        '(1, 1, 2), çarpım 4',
      ],
      answer: 0,
      explain: 'f<sub>1</sub>(4) = max{ 0, 1·f<sub>2</sub>(3) = 18, 2·f<sub>2</sub>(2) = 16, 3·f<sub>2</sub>(1) = 6, 4·f<sub>2</sub>(0) = 0 } = 18 (x<sub>1</sub> = 1); x<sub>2</sub>(3) = 0 ⇒ x<sub>3</sub> = 3: 1·2·9 = 18.',
    },
    {
      q: 'Minimax shortest route recursion\'ı (18) hangisidir?',
      options: [
        'f<sub>t</sub>(i) = min<sub>j</sub> { max( c<sub>ij</sub>, f<sub>t+1</sub>(j) ) },  f<sub>4</sub>(i) = c<sub>i,10</sub>',
        'f<sub>t</sub>(i) = min<sub>j</sub> { c<sub>ij</sub> + f<sub>t+1</sub>(j) }',
        'f<sub>t</sub>(i) = max<sub>j</sub> { min( c<sub>ij</sub>, f<sub>t+1</sub>(j) ) }',
        'f<sub>t</sub>(i) = min<sub>j</sub> { c<sub>ij</sub> · f<sub>t+1</sub>(j) }',
      ],
      answer: 0,
      explain: 'Bir yoldaki maksimum yükseklik = max(bu arc\'ın yüksekliği, kalan yoldaki maks yükseklik). Bunu minimize ederiz. Son stage\'de (stage 4 şehirleri) f<sub>4</sub>(i) = c<sub>i,10</sub>.',
    },
    {
      q: '(Kendi küçük örneğimiz) Bir şehirden iki arc var: j<sub>1</sub>\'e c = 7 (bin ft) ve f<sub>t+1</sub>(j<sub>1</sub>) = 9; j<sub>2</sub>\'ye c = 10 ve f<sub>t+1</sub>(j<sub>2</sub>) = 6. Minimax recursion ile f<sub>t</sub>(i) kaçtır?',
      options: ['9', '10', '6', '16'],
      answer: 0,
      explain: 'j<sub>1</sub>: max(7, 9) = 9; j<sub>2</sub>: max(10, 6) = 10. min{9, 10} = 9. (Toplam almak yanlış olurdu: nonadditive.)',
    },
    {
      q: 'Notlardaki minimax örneğinde Joe\'nun karşılaştığı en küçük maksimum yükseklik ve optimal yol nedir?',
      options: [
        '8000 ft; 1-3-5-8-10 (1-4-6-8-10 de optimal)',
        '13 000 ft; 1-2-5-8-10',
        '6000 ft; 1-3-5-9-10',
        '11 000 ft; 1-4-7-9-10',
      ],
      answer: 0,
      explain: 'Notlar: f<sub>1</sub>(1) = 8 (8000 ft); 1-3-5-8-10 optimaldir ve 1-4-6-8-10 de optimaldir.',
    },
  ];

  /* ====================================================================== 6.8 */
  OR.content.summaries['6.8'] = `
<h2>6.8 Wagner-Whitin Algorithm and Silver-Meal Heuristic</h2>
<p>6.4'teki inventory örneği, <b>dynamic lot-size model</b>'in özel bir halidir.</p>
<h3>6.8.1 Dynamic Lot-Size Model</h3>
<ol>
  <li>Dönem t'nin (t = 1, …, T) talebi d<sub>t</sub>, dönem 1'in başında bilinir.</li>
  <li>Talep zamanında stoktan veya dönem t üretiminden karşılanır. x birim üretim maliyeti: c(0) = 0, x &gt; 0 için <b>c(x) = K + c x</b> (K = setup, c = birim değişken maliyet).</li>
  <li>Dönem t sonunda stok i<sub>t</sub> gözlenir ve <b>h i<sub>t</sub></b> holding cost oluşur. i<sub>0</sub> = dönem 1 öncesi stok.</li>
  <li>Amaç: 1…T taleplerini zamanında karşılayan toplam maliyeti minimize eden x<sub>t</sub> üretim düzeylerini bulmak.</li>
  <li>(Genel modelde) dönem sonu stok için bir üst sınır, ve üretim için bir kapasite sınırı r<sub>t</sub> bulunabilir. Aşağıdaki Wagner–Whitin yöntemi <b>kapasitesiz</b> modeldir (6.4'teki 5 birim kapasite/4 birim depo sınırı olan örneğe doğrudan uygulanmaz; bu açık cümle notlarda yok).</li>
</ol>
<div class="box"><b>Example 6.14 (Winston 18.7).</b> 5 dönem, K = $30, c = $5, h = $1, d<sub>1</sub> = 40, d<sub>2</sub> = 60, d<sub>3</sub> = 10, d<sub>4</sub> = 20, d<sub>5</sub> = 25; başlangıç stoğu 0.</div>
<h3>6.8.2 Wagner-Whitin Algorithm</h3>
<p>Standart DP ile dönem 1'de 0…d<sub>1</sub> + … + d<sub>5</sub> = 155 birim üretmek düşünülmeli; dönem 2 state'leri 0, 1, …, 155 − d<sub>1</sub> = 115 olur ve f<sub>2</sub>(0), …, f<sub>2</sub>(115) hesaplanmalıdır: çok iş. Wagner & Whitin (1958) bunu kolaylaştırdı. İki lemma:</p>
<ul>
  <li><b>Lemma 1:</b> t döneminde pozitif üretim optimalse, bir j ∈ {0, 1, …, T − t} için üretim miktarı <b>d<sub>t</sub> + d<sub>t+1</sub> + … + d<sub>t+j</sub></b>'ye tam eşittir (üretim, t…t+j dönemlerinin talebini <i>tam</i> karşılar).</li>
  <li><b>Lemma 2:</b> t döneminde bir şey üretmek optimalse <b>i<sub>t−1</sub> &lt; d<sub>t</sub></b> (yani stok, dönem t talebini karşılamaya yetmiyorsa üretilir; <i>zero-inventory property</i> ile uyumlu: üretim yapılan dönemin başında stok yoktur, i<sub>t−1</sub> · x<sub>t</sub> = 0; "zero-inventory" adlandırması notlarda yok).</li>
</ul>
<h3>Wagner-Whitin recursion</h3>
<p>Başlangıç stoğu 0 olsun. <b>f<sub>t</sub></b> = dönem t başında stok <b>sıfır</b> iken t, t+1, …, T dönemlerinin min maliyeti. Stok sıfırsa en az d<sub>t</sub> üretilmelidir. Lemma 1 gereği üretim "t'den j'ye kadar olan taleplerin toplamı"dır:</p>
<div class="model">f<sub>T+1</sub> = 0
f<sub>t</sub> = min<sub>j = t, …, T</sub> { c<sub>tj</sub> + f<sub>j+1</sub> }      (20)
c<sub>tj</sub> = K + c (d<sub>t</sub> + … + d<sub>j</sub>) + h [ d<sub>t+1</sub> + 2 d<sub>t+2</sub> + … + (j − t) d<sub>j</sub> ]</div>
<p>(Notlarda (20) ve c<sub>tj</sub> denklemleri resim olduğundan buradaki açık hâli, notların f<sub>5</sub> = 155, "f<sub>1</sub> = $900" gibi değerleriyle doğrulandı.) c<sub>tj</sub> = t'de üretip t…j taleplerini karşılamanın maliyeti: setup + değişken + holding; holding terimi: d<sub>k</sub> birimi (k &gt; t) k − t dönem boyunca stokta bekler. Önce f<sub>T+1</sub> = 0, sonra f<sub>T</sub>, f<sub>T−1</sub>, …, f<sub>1</sub> hesaplanır.</p>
<h3>Example 6.14 – Çözüm</h3>
${wwTable()}
<ul>
  <li>f<sub>6</sub> = 0; <b>f<sub>5</sub> = 30 + 5(25) + f<sub>6</sub> = 155</b> (dönem 5 başında stok 0 ise yalnız dönem 5 için üretilir).</li>
  <li>f<sub>4</sub> = min{ c<sub>44</sub> + f<sub>5</sub> = 130 + 155 = 285, c<sub>45</sub> + f<sub>6</sub> = (30 + 5·45 + 1·25 = 280) + 0 = <b>280*</b> } ⇒ dönem 4'te 4 ve 5'i birlikte üret.</li>
  <li>f<sub>3</sub> = min{ 80 + 280 = 360, 200 + 155 = <b>355*</b>, 375 + 0 = 375 } ⇒ dönem 3'te 3 ve 4 için üret.</li>
  <li>f<sub>2</sub> = min{ 330 + 355 = 685, 390 + 280 = <b>670*</b>, 530 + 155 = 685, 730 } ⇒ dönem 2'de 2 ve 3 için üret.</li>
  <li>f<sub>1</sub> = min{ 230 + 670 = <b>900*</b>, 590 + 355 = 945, 660 + 280 = 940, 820 + 155 = 975, 1045 } ⇒ dönem 1'de yalnızca dönem 1 için üret. (5 seçenek.)</li>
</ul>
<div class="tip"><b>Optimal production schedule (ileriye doğru okunur):</b> x<sub>1</sub> = d<sub>1</sub> = 40; dönem 2 stok 0 ⇒ f<sub>2</sub> ⇒ x<sub>2</sub> = d<sub>2</sub> + d<sub>3</sub> = 70; dönem 3'ü atla (dönem 2 üretimi karşılar), dönem 4 stok 0 ⇒ x<sub>4</sub> = d<sub>4</sub> + d<sub>5</sub> = 45; x<sub>3</sub> = x<sub>5</sub> = 0. Toplam <b>f<sub>1</sub> = $900</b>. Her optimal plan toplam 155 birim üretir: değişken maliyet 5 · 155 = $775 <b>sabit</b>'tir ⇒ hesaplarda değişken üretim maliyeti ihmal edilebilir (900 − 775 = 125 = 3 · 30 + holding 10 + 25).</div>
<h3>6.8.3 Silver-Meal Heuristic</h3>
<p>S-M, Wagner–Whitin'den daha az iş gerektirir ve <b>near-optimal</b> plan verir. Amaç, <b>dönem başına ortalama maliyeti</b> minimize etmektir (değişken maliyet ihmal edilir). Dönem 1'in başında, dönem 1'in üretimi sonraki t dönemin talebini karşılıyorsa:</p>
<div class="model">TC(t) = K + HC(t),      AC(t) = TC(t) / t</div>
<p>HC(t) = t dönem boyunca holding cost. K/t, t arttıkça azalır; HC(t)/t genellikle artar ⇒ bir t* vardır: t &lt; t* için AC(t+1) ≤ AC(t) ve AC(t* + 1) ≥ AC(t*). S-M: dönem 1 üretimi d<sub>1</sub> + … + d<sub>t*</sub> birim olsun (t* yoksa tüm T dönem). Sonra başlangıç dönemi t* + 1 alınarak aynen devam edilir.</p>
<ul>
  <li><b>Dönem 1:</b> TC(1) = 30 ⇒ AC(1) = 30; TC(2) = 30 + 60 = 90 ⇒ AC(2) = 45. AC(2) &gt; AC(1) ⇒ t* = 1 ⇒ x<sub>1</sub> = d<sub>1</sub> = 40.</li>
  <li><b>Dönem 2:</b> TC(1) = 30, AC(1) = 30; TC(2) = 30 + 10 = 40, AC(2) = 20; TC(3) = 30 + 10 + 2(20) = 80, AC(3) = 26.67. AC(3) &gt; AC(2) ⇒ t* = 2 ⇒ x<sub>2</sub> = d<sub>2</sub> + d<sub>3</sub> = 70.</li>
  <li><b>Dönem 4:</b> TC(1) = 30, AC(1) = 30; TC(2) = 30 + 25 = 55, AC(2) = 27.5. Dönem 6 yok ⇒ dur; AC(2) ≤ AC(1) ⇒ x<sub>4</sub> = d<sub>4</sub> + d<sub>5</sub> = 45.</li>
</ul>
<p>Sonuç Wagner–Whitin ile <b>aynıdır</b> (40, 70, 0, 45, 0). Notlara göre S-M çoğu problemde optimal planı verir; geniş denemelerde optimalden genellikle %1'den az pahalı plan üretmiştir (Peterson & Silver, 1998).</p>
<div class="warnbox"><b>Sınavda dikkat:</b> (1) W-W'de holding terimi: d<sub>t+1</sub> 1 dönem, d<sub>t+2</sub> 2 dönem, … beklediği için çarpanlar (k − t). (2) c<sub>tj</sub> + f<sub>j+1</sub> — bir sonraki sıfır-stok dönemi j + 1'dir. (3) f<sub>t</sub> hesaplanırken tüm j = t…T denenir (T − t + 1 seçenek). (4) S-M'de AC ilk <b>artınca</b> durulur ve önceki t seçilir; eşitlikte (AC(t+1) = AC(t)) notlar net değildir (formül AC(t* + 1) ≥ AC(t*) der). (5) S-M heuristiktir: optimal garanti etmez. (6) Notlardaki başlık "Wagner-Within" yazım hatasıdır: Wagner–Whitin.</div>
`;

  OR.content.concepts['6.8'] = [
    {
      q: 'Dynamic lot-size modelde x &gt; 0 birim üretimin maliyeti nedir?',
      options: ['c(x) = K + c x  (K: setup, c: birim değişken maliyet)', 'c(x) = c x', 'c(x) = K x', 'c(x) = K + c x², c(0) = K'],
      answer: 0,
      explain: 'Notlar: c(0) = 0 ve x > 0 için c(x) = K + cx. Üretim yapılmayan dönemde setup maliyeti yoktur.',
    },
    {
      q: 'Wagner-Whitin <b>Lemma 1</b> ne söyler?',
      options: [
        'Dönem t\'de üretim pozitifse miktar tam olarak d<sub>t</sub> + d<sub>t+1</sub> + … + d<sub>t+j</sub> olmalıdır (bir j için)',
        'Her dönem üretim yapılmalıdır',
        'Üretim miktarı her zaman d<sub>t</sub>\'ye eşittir',
        'Üretim, stok varken de yapılabilir ve optimaldir',
      ],
      answer: 0,
      explain: 'Üretim yapılıyorsa t, …, t+j dönemlerinin talebini tam karşılar (ne eksik ne fazla). Böylece her dönem için "kaç dönemlik talep" kararı yeterlidir ve state sayısı küçülür.',
    },
    {
      q: 'Wagner-Whitin <b>Lemma 2</b> ne söyler?',
      options: [
        'Dönem t\'de üretim optimalse i<sub>t−1</sub> &lt; d<sub>t</sub> (stok dönem t talebine yetmiyorsa üretilir)',
        'Her dönem sonunda stok sıfır olmalıdır',
        'Üretim yalnız ilk dönemde yapılır',
        'i<sub>t−1</sub> ≥ d<sub>t</sub> iken üretim yapılmalıdır',
      ],
      answer: 0,
      explain: 'Stok talebi karşılıyorsa yeni setup maliyeti ödemek gereksizdir; bu yüzden üretim ancak stok yetersizse yapılır.',
    },
    {
      q: 'Wagner-Whitin recursion (20) hangisidir? (c<sub>tj</sub> = t\'de üretip t…j taleplerini karşılayan maliyet)',
      options: [
        'f<sub>t</sub> = min<sub>j = t..T</sub> { c<sub>tj</sub> + f<sub>j+1</sub> },  f<sub>T+1</sub> = 0',
        'f<sub>t</sub> = min<sub>j = 1..t</sub> { c<sub>jt</sub> + f<sub>j−1</sub> }',
        'f<sub>t</sub> = max<sub>j</sub> { c<sub>tj</sub> + f<sub>j+1</sub> }',
        'f<sub>t</sub> = c<sub>tt</sub> + f<sub>t+1</sub> (yalnız tek dönemlik üretim)',
      ],
      answer: 0,
      explain: 'f<sub>t</sub> dönem t başında stok sıfırken kalan min maliyettir. t\'de j dönemine kadar üretirsek j+1 başında stok sıfır olur ve f<sub>j+1</sub> devreye girer; j = t, …, T denenir.',
    },
    {
      q: 'Example 6.14\'te f<sub>5</sub> kaçtır? (K = 30, c = 5, d<sub>5</sub> = 25)',
      options: ['155', '125', '30', '180'],
      answer: 0,
      explain: 'Dönem 5 başında stok sıfırsa yalnız dönem 5 için üretilir: 30 + 5·25 + f<sub>6</sub> = 155 (holding yok).',
    },
    {
      q: 'f<sub>4</sub> = ? ve dönem 4\'te kaç dönemlik üretim yapılır? (d<sub>4</sub> = 20, d<sub>5</sub> = 25; f<sub>5</sub> = 155, h = 1)',
      options: ['280, dönem 4 ve 5 için', '285, yalnız dönem 4 için', '155, hiç üretim yok', '130, yalnız dönem 4 için'],
      answer: 0,
      explain: 'Yalnız dönem 4: c<sub>44</sub> + f<sub>5</sub> = (30 + 100) + 155 = 285. Dönem 4+5: 30 + 5·45 + 1·25 = 280, f<sub>6</sub> = 0 ⇒ 280. Minimum 280.',
    },
    {
      q: 'f<sub>3</sub> kaçtır ve dönem 3\'te hangi dönemler için üretilir? (d<sub>3</sub> = 10, d<sub>4</sub> = 20, d<sub>5</sub> = 25; f<sub>4</sub> = 280, f<sub>5</sub> = 155)',
      options: ['355, dönem 3 ve 4 için', '360, yalnız dönem 3 için', '375, dönem 3, 4, 5 için', '280, dönem 3 üretim yapmaz'],
      answer: 0,
      explain: 'j = 3: (30 + 50) + f<sub>4</sub> = 360. j = 4: 30 + 5·30 + 20 = 200, + f<sub>5</sub> = 355. j = 5: 30 + 5·55 + (20 + 2·25) = 375, + 0 = 375. Minimum 355.',
    },
    {
      q: 'f<sub>2</sub> kaçtır? (d<sub>2</sub> = 60; f<sub>3</sub> = 355, f<sub>4</sub> = 280, f<sub>5</sub> = 155; c<sub>22</sub> = 330, c<sub>23</sub> = 390, c<sub>24</sub> = 530, c<sub>25</sub> = 730)',
      options: ['670', '685', '730', '700'],
      answer: 0,
      explain: 'j = 2: 330 + 355 = 685; j = 3: 390 + 280 = 670; j = 4: 530 + 155 = 685; j = 5: 730 + 0 = 730. Minimum 670: dönem 2\'de 2 ve 3 için üretilir (70 birim).',
    },
    {
      q: 'f<sub>1</sub> ve optimal ilk karar nedir?',
      options: ['900; yalnız dönem 1 için üret (x<sub>1</sub> = 40)', '940; dönem 1, 2, 3 için üret', '945; dönem 1 ve 2 için üret', '1045; tüm dönemler için üret'],
      answer: 0,
      explain: 'Beş seçenek: 230 + 670 = 900, 590 + 355 = 945, 660 + 280 = 940, 820 + 155 = 975, 1045 + 0 = 1045. En küçük 900.',
    },
    {
      q: 'Example 6.14\'ün optimal üretim planı (x<sub>1</sub>, …, x<sub>5</sub>) nedir?',
      options: ['(40, 70, 0, 45, 0)', '(40, 60, 10, 20, 25)', '(100, 0, 0, 45, 0)', '(40, 130, 0, 0, 0)'],
      answer: 0,
      explain: 'f<sub>1</sub> → j = 1 (40), f<sub>2</sub> → j = 3 (d<sub>2</sub> + d<sub>3</sub> = 70), dönem 4 başı stok 0, f<sub>4</sub> → j = 5 (d<sub>4</sub> + d<sub>5</sub> = 45). Dönem 3 ve 5 üretim yapmaz.',
    },
    {
      q: 'Optimal plan toplam kaç birim üretir ve neden değişken üretim maliyeti ihmal edilebilir?',
      options: [
        '155 birim (= Σd<sub>t</sub>); toplam değişken maliyet 5 · 155 = $775 her optimal planda aynı olduğu için',
        '160 birim; çünkü ek stok gerekir',
        '100 birim; çünkü kapasite sınırı vardır',
        'Değişken maliyet ihmal edilemez, plana göre değişir',
      ],
      answer: 0,
      explain: 'Başlangıç stoğu 0 ve sonda stok gerekmez; her plan tam Σd<sub>t</sub> = 155 üretir ⇒ değişken maliyet sabit $775 (900 − 775 = 125 = setup + holding).',
    },
    {
      q: 'Standart DP ile Example 6.14 çözülseydi dönem 2 state\'leri (başlangıç stoğu) kaç değer alabilirdi ve W-W bunu nasıl azaltır?',
      options: [
        '0, 1, …, 115 (116 değer); W-W yalnızca "stok sıfır" state\'lerini ve üretim miktarı olarak talep toplamlarını dikkate alır',
        '0 ile 5 arası (6 değer); W-W bunu 3\'e indirir',
        'Yalnızca 0 ve 155',
        'W-W state sayısını artırır ama hızlıdır',
      ],
      answer: 0,
      explain: 'Dönem 1\'de 0…155 üretilebilir ⇒ dönem 2 stoğu 0…155 − d<sub>1</sub> = 115. Lemma 1–2 sayesinde üretim yalnızca stok sıfırken ve talep toplamları kadar yapılır; f<sub>t</sub> tek boyutlu (T değer).',
    },
    {
      q: 'Silver-Meal heuristic\'in kararı nedir (dönem başlangıcında)?',
      options: [
        'AC(t) = TC(t)/t ortalama maliyeti ilk kez artmadan önceki t* dönemi için üret (AC(t*+1) ≥ AC(t*))',
        'TC(t) toplam maliyetini minimize eden t\'yi seç',
        'Her zaman yalnızca bir dönem için üret',
        'AC(t) maksimum olan t\'yi seç',
      ],
      answer: 0,
      explain: 'Dönem başına ortalama maliyet AC(t) = (K + HC(t))/t izlenir; K/t azalır, HC(t)/t artar; ilk yerel minimum t* seçilir ve üretim d<sub>1</sub> + … + d<sub>t*</sub> olur.',
    },
    {
      q: 'Example 6.14\'te S-M ile dönem 1 için kaç dönemlik üretim yapılır? (AC(1) = 30, AC(2) = 90/2 = 45)',
      options: ['1 dönemlik (x<sub>1</sub> = 40)', '2 dönemlik (x<sub>1</sub> = 100)', '3 dönemlik (x<sub>1</sub> = 110)', '5 dönemlik (x<sub>1</sub> = 155)'],
      answer: 0,
      explain: 'AC(2) = 45 > AC(1) = 30 ⇒ t* = 1 ⇒ yalnız d<sub>1</sub> = 40 üretilir.',
    },
    {
      q: 'S-M, dönem 2\'de başlarken AC(1), AC(2), AC(3) değerleri ne verir? (K = 30, h = 1, d<sub>2</sub> = 60, d<sub>3</sub> = 10, d<sub>4</sub> = 20)',
      options: [
        '30, 20, 26.67 ⇒ t* = 2, x<sub>2</sub> = 70',
        '30, 20, 15 ⇒ t* = 3, x<sub>2</sub> = 90',
        '30, 45, 60 ⇒ t* = 1, x<sub>2</sub> = 60',
        '30, 40, 80 ⇒ t* = 1',
      ],
      answer: 0,
      explain: 'TC(1) = 30 ⇒ 30; TC(2) = 30 + 1·10 = 40 ⇒ 20; TC(3) = 30 + 10 + 2·20 = 80 ⇒ 26.67 > 20 ⇒ durulur, t* = 2: x<sub>2</sub> = d<sub>2</sub> + d<sub>3</sub> = 70.',
    },
    {
      q: 'S-M, dönem 4\'te (son iki dönem kaldığında) neden durur ve ne üretir?',
      options: [
        'Dönem 6 olmadığı için 2 dönemle sınırlıdır; AC(2) = 27.5 ≤ AC(1) = 30 ⇒ x<sub>4</sub> = 45',
        'AC(2) arttığı için x<sub>4</sub> = 20',
        'Üretim yapmaz',
        'x<sub>4</sub> = 55',
      ],
      answer: 0,
      explain: 'TC(2) = 30 + 25 = 55 ⇒ AC(2) = 27.5 < AC(1) = 30 ve T\'ye ulaşıldığı için dur. x<sub>4</sub> = 20 + 25 = 45; sonuç W-W ile aynıdır.',
    },
    {
      q: '(Kendi örneğimiz, notlarda yok) K = 60, h = 2, d = (30, 20, 50). Dönem 1\'de S-M için AC(1), AC(2), AC(3)?',
      options: ['60, 50, 100 ⇒ t* = 2', '60, 70, 100 ⇒ t* = 1', '60, 50, 40 ⇒ t* = 3', '30, 50, 100 ⇒ t* = 1'],
      answer: 0,
      explain: 'TC(1) = 60; TC(2) = 60 + 2·20 = 100 ⇒ 50; TC(3) = 100 + 2·2·50 = 300 ⇒ 100. AC(3) artıyor ⇒ t* = 2 ⇒ x<sub>1</sub> = 50, sonra dönem 3 için x<sub>3</sub> = 50.',
    },
    {
      q: '(Kendi örneğimiz) Aynı veriyle (K = 60, h = 2, d = 30, 20, 50; değişken maliyet ihmal) Wagner-Whitin f<sub>1</sub> kaçtır?',
      options: ['160', '180', '220', '300'],
      answer: 0,
      explain: 'f<sub>4</sub> = 0; f<sub>3</sub> = 60; f<sub>2</sub> = min{60 + 60, 60 + 2·50} = 120; f<sub>1</sub> = min{60 + 120, 100 + 60, 300} = 160 (üret 50, 0, 50). S-M de aynı planı verir.',
    },
    {
      q: 'Silver-Meal heuristic hakkında hangisi doğrudur?',
      options: [
        'Wagner-Whitin\'den daha az iş gerektirir; çoğu zaman optimal plana eşit veya optimalden %1\'den az pahalı plan verir; fakat optimal garanti etmez',
        'Her zaman optimal planı bulur',
        'Wagner-Whitin\'den daha çok hesap gerektirir',
        'Yalnızca K = 0 iken kullanılabilir',
      ],
      answer: 0,
      explain: 'Notlar: S-M, W-W\'den az iş gerektirir, near-optimal plan bulur; Peterson & Silver (1998) denemelerinde çoğunlukla optimalin %1\'inden az üzerindedir. Garanti yoktur.',
    },
  ];

  /* ====================================================================== cheatsheet */
  OR.content.cheatsheet += `
<h3>Ch.6 Deterministic Dynamic Programming</h3>
<table>
  <tr><th>Konu</th><th>Recursion / formül</th><th>Not</th></tr>
  <tr><td><b>Genel (10)</b></td><td>f<sub>t</sub>(i) = min { (stage t maliyeti) + f<sub>t+1</sub>(yeni state) }</td><td>3 unsur: feasible karar kümesi, stage t maliyeti, sonraki state. Backward: f<sub>T</sub> → f<sub>1</sub>; f<sub>T+1</sub> = 0</td></tr>
  <tr><td><b>6.2 Shortest path</b><br><small>Joe Cougar</small></td><td>f<sub>t</sub>(i) = min<sub>j</sub> { c<sub>ij</sub> + f<sub>t+1</sub>(j) },  f<sub>5</sub>(10) = 0</td><td>f<sub>4</sub>(8) = 1030, f<sub>4</sub>(9) = 1390; f<sub>3</sub> = 1640, 1570, 1660; f<sub>2</sub> = 2320, 2220, 2150; <b>f<sub>1</sub>(1) = 2870</b>, yol 1-2-5-8-10</td></tr>
  <tr><td><b>6.3 Özellikler</b></td><td>stage · state · decision · principle of optimality · recursion</td><td>State = karar için gereken bilgi; optimality: geçmişten bağımsız kalan karar</td></tr>
  <tr><td><b>6.4 Inventory</b></td><td>f<sub>t</sub>(i) = min<sub>x</sub> { c(x) + h (i + x − d<sub>t</sub>) + f<sub>t+1</sub>(i + x − d<sub>t</sub>) },  c(x) = K + c x (x &gt; 0), c(0) = 0<br>feasible: 0 ≤ x ≤ kap., 0 ≤ i + x − d<sub>t</sub> ≤ depo</td><td>K = 3, c = 1, h = ½, d = (1, 3, 2, 4); f<sub>4</sub>(i) = c(4 − i) = 7, 6, 5, 4, 0; f<sub>3</sub> = 12, 10, 7, 6.5, 6; f<sub>2</sub> = 16, 15, 14, 12, 10.5; <b>f<sub>1</sub>(0) = 20</b>; plan 1, 5, 0, 4</td></tr>
  <tr><td><b>6.5 Resource allocation</b></td><td>f<sub>t</sub>(d) = max<sub>x ≤ d</sub> { r<sub>t</sub>(x) + f<sub>t+1</sub>(d − x) },  f<sub>T+1</sub> = 0<br><b>Generalized (7):</b> f<sub>t</sub>(d) = max { r<sub>t</sub>(x<sub>t</sub>) + f<sub>t+1</sub>(d − g<sub>t</sub>(x<sub>t</sub>)) },  g<sub>t</sub>(x<sub>t</sub>) ≤ d</td><td>Finco: f<sub>3</sub> = 0, 9, 13, 17, 21, 25, 29; f<sub>2</sub> = 0, 10, 19, 23, 27, 31, 35; <b>f<sub>1</sub>(6) = 49</b>, (4, 1, 1)</td></tr>
  <tr><td><b>6.5.2 Knapsack</b></td><td>f<sub>t</sub>(d) = max { b<sub>t</sub> x<sub>t</sub> + f<sub>t+1</sub>(d − w<sub>t</sub> x<sub>t</sub>) }<br><b>(8):</b> g(w) = max<sub>j</sub> { b<sub>j</sub> + g(w − w<sub>j</sub>) }, g(0) = 0</td><td>(w, b) = (4, 11), (3, 7), (5, 12), W = 10: <b>f<sub>1</sub>(10) = g(10) = 25</b> (1 × tip 1 + 2 × tip 2)</td></tr>
  <tr><td><b>6.6 Equipment replacement</b></td><td>g(t) = min<sub>t+1 ≤ x ≤ t+3, x ≤ 5</sub> { c<sub>tx</sub> + g(x) },  g(5) = 0<br>c<sub>tx</sub> = P + m<sub>1</sub> + … + m<sub>x−t</sub> − s<sub>x−t</sub></td><td>P = 1000: c = 260, 540, 760; g(4) = 260, g(3) = 520, g(2) = 760, g(1) = 1020, <b>g(0) = 1280</b>; 3 optimal politika</td></tr>
  <tr><td><b>6.7 Discount (12)</b></td><td>f<sub>t</sub>(b) = max { r(x) − c(x, b) + β f<sub>t+1</sub>(1.2(b − x)) },  0 ≤ x ≤ b</td><td>Fishery: yalnızca gelecek terim β ile çarpılır</td></tr>
  <tr><td><b>6.7 Power plant</b></td><td>f<sub>t</sub>(i) = min { c<sub>t</sub>(x) + m<sub>t</sub>(x + i) + f<sub>t+1</sub>(0.9 i + x) },  x ≥ r<sub>t</sub> − i</td><td>(13): son yıl f<sub>T+1</sub> terimi yok</td></tr>
  <tr><td><b>6.7 Wheat / Refinery</b></td><td>f<sub>6</sub>(c, w) = c + w p<sub>6</sub>;  f<sub>t</sub>(c, w) = max f<sub>t+1</sub>(c − Δw p<sub>t</sub>, w + Δw), −w ≤ Δw ≤ min(c/p<sub>t</sub>, 1000 − w)<br>f<sub>4</sub>(o, g) = c<sub>4</sub>(o, g);  f<sub>t</sub>(o, g) = min { c<sub>t</sub>(x, y) + f<sub>t+1</sub>(o − x, g − y) }</td><td>İki boyutlu state; refinery'de stage = saha sayısı</td></tr>
  <tr><td><b>6.7.3 Nonadditive</b></td><td>Çarpımsal: f<sub>t</sub>(s) = max<sub>x</sub> { g<sub>t</sub>(x) · f<sub>t+1</sub>(s − x) }<br>Minimax: f<sub>t</sub>(i) = min<sub>j</sub> { max( c<sub>ij</sub>, f<sub>t+1</sub>(j) ) }</td><td>Çarpım örneği: f<sub>1</sub>(4) = 18, (1, 0, 3). Minimax: f<sub>1</sub>(1) = 8 (1-3-5-8-10)</td></tr>
  <tr><td><b>6.8 Wagner-Whitin</b></td><td>f<sub>T+1</sub> = 0;  f<sub>t</sub> = min<sub>j = t..T</sub> { c<sub>tj</sub> + f<sub>j+1</sub> }<br>c<sub>tj</sub> = K + c Σ<sub>k=t..j</sub> d<sub>k</sub> + h Σ<sub>k=t+1..j</sub> (k − t) d<sub>k</sub></td><td>K = 30, c = 5, h = 1, d = (40, 60, 10, 20, 25): f<sub>5</sub> = 155, f<sub>4</sub> = 280, f<sub>3</sub> = 355, f<sub>2</sub> = 670, <b>f<sub>1</sub> = 900</b>; plan (40, 70, 0, 45, 0). Lemma 1: üretim = d<sub>t</sub> + … + d<sub>t+j</sub>; Lemma 2: i<sub>t−1</sub> &lt; d<sub>t</sub></td></tr>
  <tr><td><b>6.8 Silver-Meal</b></td><td>TC(t) = K + HC(t),  AC(t) = TC(t)/t;  AC(t* + 1) ≥ AC(t*) olan ilk t* için d<sub>1</sub> + … + d<sub>t*</sub> üret, sonra t* + 1'den devam</td><td>Aynı örnek: AC = 30, 45 → x<sub>1</sub> = 40; 30, 20, 26.67 → x<sub>2</sub> = 70; 30, 27.5 → x<sub>4</sub> = 45 (W-W ile aynı). Heuristic, optimal garanti yok</td></tr>
</table>
<div class="warnbox"><b>DP sınav tuzakları:</b> f<sub>t+1</sub> hep <i>sonraki</i> state ile çağrılır (inventory: i + x − d<sub>t</sub>; resource: d − x; knapsack: d − w<sub>t</sub> x<sub>t</sub>) · holding cost <b>ay/dönem sonu</b> stoğuna · setup yalnızca x &gt; 0 iken · feasible x hem kapasiteden hem state sınırından gelir · retrace: x<sub>1</sub> → kalan state → x<sub>2</sub> … · tie'larda tüm optimal politikaları yazabilirsin (equipment: 3 politika) · W-W'de holding çarpanı (k − t), S-M'de ilk AC artışında dur.</div>
`;
})();
