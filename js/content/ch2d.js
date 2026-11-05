/* Chapter 2 (2.9 – 2.11) learning content: summaries + concept questions + cheatsheet section.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, Ch.2 (notes pages 40–46): 2.9 Cutting Planes (Example 13, cut classification,
   0-1 disjunctive cuts), 2.9.1 Gomory cut algorithm (Example 14 Telfa, Example 15 supplementary), 2.10 Branch & Cut,
   2.11 Branch & Price.
   Tableaus/cuts were recomputed by script with the exact-fraction simplex of js/drills/gomory.js (Telfa reproduces the
   notes' tableaus; Example 15 cut/dual simplex step also checked). Anything not in the notes is labeled "notlarda yok". */
(function () {
  const OR = window.OR;

  // small tableau helper: rows = [[label, ...cells]], head = column labels (without BV column)
  const tab = (head, rows, hl) =>
    '<table class="mtx"><tr><th>BV</th>' +
    head.map((h) => `<th>${h}</th>`).join('') +
    '</tr>' +
    rows
      .map(
        (r, i) =>
          `<tr><th>${r[0]}</th>` +
          r
            .slice(1)
            .map((c, j) => `<td${hl && hl[i] && hl[i][j] ? ` class="${hl[i][j]}"` : ''}>${c}</td>`)
            .join('') +
          '</tr>'
      )
      .join('') +
    '</table>';
  const s = (n) => `s<sub>${n}</sub>`;
  const x = (n) => `x<sub>${n}</sub>`;
  const e = (n) => `e<sub>${n}</sub>`;

  /* ====================================================================== 2.9 */
  OR.content.summaries['2.9'] = `
<h2>2.9 Cutting Planes · 2.9.1 Cutting Plane Algorithm (Gomory cut)</h2>

<h3>Valid inequality ve cutting plane</h3>
<ul>
  <li>Bir doğrusal eşitsizlik, IP'nin <b>tüm integer feasible çözümleri</b> için sağlanıyorsa o IP için bir <b>valid inequality</b>'dir.</li>
  <li>Relaxation'lar, doğru bir discrete model için <i>gerekli olmayan</i> valid inequality'ler eklenerek çok güçlendirilebilir.</li>
  <li>Relaxation'ı güçlendirmek için valid inequality, <b>mevcut LR'nin feasible olup IP'de feasible olmayan</b> bazı çözümlerini <b>kesip atmalıdır</b> (cut off, render infeasible).</li>
  <li>Integer olmayan relaxation çözümlerini kesip atma ihtiyacı yüzünden valid inequality'lere <b>cutting plane</b> denir.</li>
</ul>

<h3>Example 13 · Kavramsal</h3>
<p><b>min x + 10y</b>, (x, y) ∈ P, x, y integer. LR optimumu kesirli bir köşe; integer optimum başka bir nokta. Fikir: <b>LP'nin kesirli çözümlerini eleyen ama hiçbir integer çözümü elemeyen</b> kısıtlar eklemek. Notlarda gözle (by inspection) bulunan iki kısıt eklenir: <b>y ≥ 1</b> ve <b>y ≤ x − 1</b>.</p>
<ul>
  <li>Tam doğru eşitsizlikler eklenirse LP'nin <b>her köşe noktası integer</b> olur ve IP, LP çözülerek çözülür. Bu minimal LP'ye IP çözümlerinin <b>convex hull</b>'u denir.</li>
  <li>Büyük problemlerde bu kısıtları bulmak zordur. Mümkün olan en sıkı kısıtlar çok faydalıdır ve <b>facet</b> olarak adlandırılır.</li>
</ul>

<h3>Cut classification</h3>
<table>
  <tr><th>Tür</th><th>Açıklama</th><th>Örnek</th></tr>
  <tr><td><b>General purpose</b></td><td>Kesirli bir extreme point her zaman ayrılabilir (LP-based yaklaşım, IP için çalışır)</td><td>Disjunctive cuts, Gomory cutting planes</td></tr>
  <tr><td><b>Problem specific</b></td><td>Problem yapısından türetilir, genellikle <b>facet</b>'tir</td><td>Knapsack, Set Packing …</td></tr>
</table>
<p><b>0-1 Disjunctive cuts</b> (notlarda yalnızca şekillerle): LP relaxation → optimal "fractional" çözüm x̄ → disjunction'ın bir tarafı (x<sub>i</sub> = 0) ve diğer tarafı (x<sub>i</sub> = 1) → iki disjunctive kümenin birleşiminin convex hull'u → bu hull'un bir facet'i x̄'i dışarıda bırakır, yani aynı zamanda bir <b>cut</b>'tır → yeni "feasible" çözüm.</p>

<h3>Gomory cut algoritması (notlardaki 8 adım)</h3>
<ol>
  <li>IP'nin LR'si için <b>optimal tabloyu</b> bul.</li>
  <li>Optimal çözümde tüm değişkenler integer ise IP optimal bulundu. Değilse devam.</li>
  <li>Optimal tabloda RHS'inin <b>kesirli kısmı ½'ye en yakın</b> olan kısıtı seç.</li>
  <li>Bu kısıtta tüm <b>integer parçaları sola</b> (aşağı yuvarlayarak, round down), tüm <b>kesirli parçaları sağa</b> al.</li>
  <li>Cut'ı üret: <b>"değiştirilmiş kısıtın sağ tarafı" ≤ 0</b>.</li>
  <li>Cut ek kısıt olarak eklenmiş LR'yi <b>dual simplex</b> ile çöz.</li>
  <li>Tüm değişkenler integer ise IP optimal bulundu.</li>
  <li>Değilse adım 3'ten devam.</li>
</ol>
<div class="box"><b>Kesirli kısım:</b> a = ⌊a⌋ + f, 0 ≤ f &lt; 1, yani f = a − ⌊a⌋. Negatif sayılarda dikkat:
⌊−1.25⌋ = −2 ⇒ f(−1.25) = 0.75; ⌊−7/4⌋ = −2 ⇒ f(−7/4) = 1/4; ⌊−0.6⌋ = −1 ⇒ f(−0.6) = 0.4.<br>
Satır x<sub>B</sub> + Σ a<sub>j</sub>N<sub>j</sub> = b için cut: <b>f<sub>0</sub> − Σ f<sub>j</sub> N<sub>j</sub> ≤ 0</b> (N<sub>j</sub>: nonbasic değişkenler, f<sub>0</sub> = f(b)).</div>

<h3>Dual simplex (hatırlatma)</h3>
<ul>
  <li><b>En negatif RHS</b> seçilir; bu pivot satırının BV'si basis'ten <b>çıkar</b>.</li>
  <li>Pivot satırında <b>negatif katsayılı</b> değişkenler için oran = (R0'daki katsayı / pivot satırındaki katsayı).</li>
  <li>Oranı (mutlak değerce) <b>en küçük</b> olan değişken basis'e <b>girer</b>.</li>
</ul>

<h3>Example 14 · Telfa Co. (Winston 9.8)</h3>
<div class="model">max z = 8x<sub>1</sub> + 5x<sub>2</sub>
s.t.  x<sub>1</sub> + x<sub>2</sub> ≤ 6
      9x<sub>1</sub> + 5x<sub>2</sub> ≤ 45
      x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer</div>
<p>Integrality ihmal edilince optimal tablo:</p>
${tab([x(1), x(2), s(1), s(2), 'RHS'], [
  ['z', '0', '0', '1.25', '0.75', '41.25'],
  [x(2), '0', '1', '2.25', '−0.25', '2.25'],
  [x(1), '1', '0', '−1.25', '0.25', '3.75'],
], [null, null, ['', '', '', '', 'hl']])}
<p>RHS kesirleri 0.25 ve 0.75; ikisi de ½'ye 0.25 uzaklıkta (eşitlik) ⇒ notlar <b>keyfi olarak ikinci kısıtı</b> seçer:</p>
<div class="model">x<sub>1</sub> − 1.25 s<sub>1</sub> + 0.25 s<sub>2</sub> = 3.75
x<sub>1</sub> − 2 s<sub>1</sub> + 0 s<sub>2</sub> − 3 = 0.75 − 0.75 s<sub>1</sub> − 0.25 s<sub>2</sub>     (−1.25 = −2 + 0.75; 0.25 = 0 + 0.25; 3.75 = 3 + 0.75)
Cut:  0.75 − 0.75 s<sub>1</sub> − 0.25 s<sub>2</sub> ≤ 0</div>
<p><b>Neden geçerli?</b> Sol taraf yalnızca integer'lardan oluşur ⇒ sağ taraf da integer olmalı. Sağ taraf = pozitif bir kesir (&lt; 1) eksi negatif olmayan terimler ⇒ pozitif olamaz. Her integer feasible çözüm bu kısıtı sağlar; ama mevcut çözümde s<sub>1</sub> = s<sub>2</sub> = 0 ⇒ 0.75 ≤ 0 sağlanmaz: bu bir <b>cut</b>'tır (<b>Gomory cut</b>).</p>
<p>Cut, yeni slack s<sub>3</sub> ile tabloya eklenir: −0.75 s<sub>1</sub> − 0.25 s<sub>2</sub> + s<sub>3</sub> = −0.75.</p>
${tab([x(1), x(2), s(1), s(2), s(3), 'RHS'], [
  ['z', '0', '0', '1.25', '0.75', '0', '41.25'],
  [x(2), '0', '1', '2.25', '−0.25', '0', '2.25'],
  [x(1), '1', '0', '−1.25', '0.25', '0', '3.75'],
  [s(3), '0', '0', '−0.75', '−0.25', '1', '−0.75'],
], [null, null, null, ['', '', 'sel', '', '', 'm']])}
<p>Dual simplex: tek negatif RHS s<sub>3</sub> satırında ⇒ s<sub>3</sub> çıkar. Oranlar: s<sub>1</sub>: |1.25 / −0.75| = 5/3, s<sub>2</sub>: |0.75 / −0.25| = 3 ⇒ <b>s<sub>1</sub> girer</b>. Pivot sonrası:</p>
${tab([x(1), x(2), s(1), s(2), s(3), 'RHS'], [
  ['z', '0', '0', '0', '1/3', '5/3', '40'],
  [x(2), '0', '1', '0', '−1', '3', '0'],
  [x(1), '1', '0', '0', '2/3', '−5/3', '5'],
  [s(1), '0', '0', '1', '1/3', '−4/3', '1'],
])}
<p>Tüm değişkenler integer ⇒ IP optimal: <b>z = 40, x<sub>1</sub> = 5, x<sub>2</sub> = 0</b> (LR'de z = 41.25 idi). <i>(Pivot sonrası tablonun tamamı notlarda yok; yalnızca sonuç verilir, tablo bizim hesabımızdır.)</i></p>
<p class="muted">(notlarda yok) Cut'ı x cinsinden yazmak için s<sub>1</sub> = 6 − x<sub>1</sub> − x<sub>2</sub>, s<sub>2</sub> = 45 − 9x<sub>1</sub> − 5x<sub>2</sub> yerine konursa: 0.75 − 0.75(6 − x<sub>1</sub> − x<sub>2</sub>) − 0.25(45 − 9x<sub>1</sub> − 5x<sub>2</sub>) ≤ 0 ⇔ <b>3x<sub>1</sub> + 2x<sub>2</sub> ≤ 15</b>. LR optimumu (3.75, 2.25) için 15.75 &gt; 15 (kesildi), (5, 0) için 15 ≤ 15.</p>

<h3>Example 15 · Supplementary (min problemi)</h3>
<div class="model">min z = 6x<sub>1</sub> + 8x<sub>2</sub>
s.t.  3x<sub>1</sub> + x<sub>2</sub> ≥ 4
      x<sub>1</sub> + 2x<sub>2</sub> ≥ 4
      x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer      (e<sub>1</sub>, e<sub>2</sub>: excess variables)</div>
${tab([x(1), x(2), e(1), e(2), 'RHS'], [
  ['z', '0', '0', '−0.8', '−3.6', '17.6'],
  [x(1), '1', '0', '−0.4', '0.2', '0.8'],
  [x(2), '0', '1', '0.2', '−0.6', '1.6'],
], [null, null, ['', '', '', '', 'hl']])}
<p>Kesirler 0.8 (½'ye uzaklık 0.3) ve 0.6 (uzaklık 0.1) ⇒ <b>ikinci kısıt</b>:</p>
<div class="model">x<sub>2</sub> + 0.2 e<sub>1</sub> − 0.6 e<sub>2</sub> = 1.6
x<sub>2</sub> − e<sub>2</sub> − 1 = 0.6 − 0.2 e<sub>1</sub> − 0.4 e<sub>2</sub>      (⌊0.2⌋ = 0, ⌊−0.6⌋ = −1 ⇒ f = 0.4, ⌊1.6⌋ = 1)
Cut:  0.6 − 0.2 e<sub>1</sub> − 0.4 e<sub>2</sub> ≤ 0      → tabloya: −0.2 e<sub>1</sub> − 0.4 e<sub>2</sub> + s<sub>3</sub> = −0.6</div>
<p>Dual simplex: s<sub>3</sub> çıkar; oranlar e<sub>1</sub>: |−0.8 / −0.2| = 4, e<sub>2</sub>: |−3.6 / −0.4| = 9 ⇒ <b>e<sub>1</sub> girer</b>. e<sub>1</sub> = 3 ⇒ x<sub>1</sub> = 0.8 + 0.4·3 = 2, x<sub>2</sub> = 1.6 − 0.2·3 = 1, z = 17.6 + 0.8·3 = 20. IP optimal: <b>z = 20, x<sub>1</sub> = 2, x<sub>2</sub> = 1</b>. (Min probleminde optimal R0 katsayıları ≤ 0'dır; oran mutlak değerle alındığı için kural aynı kalır.)</p>

<div class="warnbox"><b>Sınavda dikkat:</b>
<ul>
  <li>Kaynak satır: RHS'in <b>kesirli kısmı ½'ye en yakın</b> olan (en büyük kesir değil!). Basic değişkeni integer olan satır aday değildir.</li>
  <li>Negatif katsayıların kesri: f(−1.25) = 0.75, <b>0.25 değil</b>. Her zaman 0 ≤ f &lt; 1.</li>
  <li>Cut yönü: f<sub>0</sub> − Σ f<sub>j</sub>N<sub>j</sub> <b>≤ 0</b>. Tabloya eklerken −Σ f<sub>j</sub>N<sub>j</sub> + s<sub>yeni</sub> = −f<sub>0</sub> (RHS negatif ⇒ dual simplex).</li>
  <li>Dual simplex: <b>önce çıkan</b> (en negatif RHS), sonra giren (pivot satırında negatif katsayılılar arasında en küçük |R0/katsayı|).</li>
  <li>Cut eklendikten sonra yeni LR optimumu yine kesirli olabilir ⇒ yeni tablodan (cut satırları dahil) yeni cut üretilir.</li>
</ul></div>`;

  OR.content.concepts['2.9'] = [
    {
      q: 'Bir IP için <b>valid inequality</b> nedir?',
      options: [
        'IP\'nin tüm integer feasible çözümleri tarafından sağlanan doğrusal eşitsizlik',
        'LR\'nin tüm feasible çözümleri tarafından sağlanan doğrusal eşitsizlik',
        'IP\'nin optimal çözümünü dışarıda bırakan doğrusal eşitsizlik',
        'Yalnızca LR optimumunda sıkı (binding) olan kısıt',
      ],
      answer: 0,
      explain: 'Notlar: "A linear inequality is a valid inequality for a given IP problem if it holds for all integer feasible solutions to the model." LR\'nin tüm çözümlerini sağlayan bir eşitsizlik relaxation\'ı hiç güçlendirmez; optimal integer çözümü kesen bir eşitsizlik ise valid değildir.',
    },
    {
      q: 'Bir valid inequality\'nin relaxation\'ı <b>güçlendirmesi</b> (cutting plane olması) için ne yapması gerekir?',
      options: [
        'Mevcut LR\'de feasible olup IP\'de feasible olmayan bazı çözümleri kesip atmalı',
        'En az bir integer feasible çözümü kesip atmalı',
        'LR\'nin feasible bölgesini değiştirmeden yeni bir köşe noktası eklemeli',
        'Amaç fonksiyonuna paralel olmalı',
      ],
      answer: 0,
      explain: 'Notlar: "To strengthen a relaxation, a valid inequality must cut off (render infeasible) some feasible solutions to current LR that are not feasible in the IP model." Integer çözüm kesmek valid olmayı bozar; bölgeyi değiştirmeyen kısıt işe yaramaz.',
    },
    {
      q: 'Example 13\'te (min x + 10y) LR\'ye gözle (by inspection) eklenen kısıtlar ve "tam doğru eşitsizlikler eklendiğinde" elde edilen minimal LP\'nin adı nedir?',
      options: [
        'y ≥ 1 ve y ≤ x − 1; IP çözümlerinin convex hull\'u',
        'y ≤ 1 ve y ≥ x − 1; IP çözümlerinin convex hull\'u',
        'y ≥ 1 ve y ≤ x − 1; facet',
        'x ≥ 1 ve x ≤ y − 1; LP relaxation',
      ],
      answer: 0,
      explain: 'Notlarda "add y ≥ 1" ve "add y ≤ x – 1" kısıtları eklenir. Doğru eşitsizlikler eklenince LP\'nin her köşesi integer olur; bu minimal LP\'ye IP çözümlerinin convex hull\'u denir. Facet ise mümkün olan en sıkı tekil kısıtlara verilen addır, LP\'nin kendisine değil.',
    },
    {
      q: 'Notlardaki cut sınıflandırmasına göre aşağıdakilerden hangileri <b>general purpose</b> cut\'tır? (Birden fazla seçin)',
      options: ['Disjunctive cuts', 'Gomory cutting planes', 'Knapsack yapısından türetilen facet\'ler', 'Set packing yapısından türetilen cut\'lar'],
      answer: [0, 1],
      explain: 'General purpose: "A fractional extreme point can always be separated (LP-based approach, that works for IP)" — disjunctive ve Gomory cut\'lar. Knapsack, set packing gibi yapıdan türetilenler problem specific\'tir (genellikle facet).',
    },
    {
      q: 'Gomory algoritmasının 3. adımında optimal tablodaki satırların RHS\'leri <b>2.2, 3.6, 1.9</b> (her satırın basic değişkeni kesirli). Hangi satır seçilir?',
      options: ['RHS = 3.6 olan satır', 'RHS = 1.9 olan satır', 'RHS = 2.2 olan satır', 'Herhangi biri; kural yalnızca RHS\'in kesirli olmasını ister'],
      answer: 0,
      hint: 'Kesirli kısımlar 0.2, 0.6, 0.9; ½\'ye uzaklıklarına bakın.',
      explain: 'Kesirler 0.2, 0.6, 0.9; ½\'ye uzaklıklar 0.3, 0.1, 0.4. En yakın: 0.6 ⇒ RHS = 3.6 satırı. Kural "RHS\'in kesirli kısmı ½\'ye en yakın" — en büyük RHS ya da en büyük kesir (0.9) değil.',
    },
    {
      q: 'f(a) = a − ⌊a⌋ ile <b>f(−7/4)</b> kaçtır?',
      options: ['1/4', '3/4', '−3/4', '7/4'],
      answer: 0,
      hint: '⌊−7/4⌋ = ⌊−1.75⌋ = ?',
      explain: '⌊−1.75⌋ = −2 (aşağı yuvarlama, sıfıra doğru değil) ⇒ f = −7/4 − (−2) = 1/4. 3/4, |−7/4|\'ün kesri olurdu; negatif sayılarda bu yanlıştır. Kesir her zaman 0 ≤ f < 1.',
    },
    {
      q: 'Telfa optimal tablosundaki satır <b>x<sub>1</sub> − 1.25 s<sub>1</sub> + 0.25 s<sub>2</sub> = 3.75</b>. Integer parçalar sola alınınca hangi eşitlik elde edilir?',
      options: [
        'x<sub>1</sub> − 2 s<sub>1</sub> + 0 s<sub>2</sub> − 3 = 0.75 − 0.75 s<sub>1</sub> − 0.25 s<sub>2</sub>',
        'x<sub>1</sub> − 1 s<sub>1</sub> + 0 s<sub>2</sub> − 3 = 0.75 − 0.25 s<sub>1</sub> − 0.25 s<sub>2</sub>',
        'x<sub>1</sub> − 2 s<sub>1</sub> + 0 s<sub>2</sub> − 4 = −0.25 − 0.75 s<sub>1</sub> − 0.25 s<sub>2</sub>',
        'x<sub>1</sub> − 2 s<sub>1</sub> + 1 s<sub>2</sub> − 3 = 0.75 − 0.75 s<sub>1</sub> + 0.75 s<sub>2</sub>',
      ],
      answer: 0,
      explain: '−1.25 = −2 + 0.75, 0.25 = 0 + 0.25, 3.75 = 3 + 0.75 (hepsi round down). Integer parçalar solda: x<sub>1</sub> − 2s<sub>1</sub> + 0s<sub>2</sub> − 3; kesirli parçalar sağda: 0.75 − 0.75s<sub>1</sub> − 0.25s<sub>2</sub> (notlardaki eşitliğin aynısı). −1.25\'i −1\'e yuvarlamak "round up" olur.',
    },
    {
      q: 'Optimal tablodaki satır <b>x<sub>2</sub> + 0.2 e<sub>1</sub> − 0.6 e<sub>2</sub> = 1.6</b> (Example 15). Gomory cut hangisidir?',
      options: [
        '0.6 − 0.2 e<sub>1</sub> − 0.4 e<sub>2</sub> ≤ 0',
        '0.6 − 0.2 e<sub>1</sub> − 0.6 e<sub>2</sub> ≤ 0',
        '0.6 − 0.2 e<sub>1</sub> − 0.4 e<sub>2</sub> ≥ 0',
        '0.6 + 0.2 e<sub>1</sub> − 0.6 e<sub>2</sub> ≤ 0',
      ],
      answer: 0,
      explain: 'f(0.2) = 0.2, f(−0.6) = −0.6 − (−1) = 0.4, f(1.6) = 0.6. Cut = "değiştirilmiş kısıtın sağ tarafı ≤ 0": 0.6 − 0.2e<sub>1</sub> − 0.4e<sub>2</sub> ≤ 0 (notlardaki cut). −0.6\'nın kesri 0.6 değil 0.4\'tür; yön ≥ değil ≤.',
    },
    {
      q: 'Satır <b>x<sub>1</sub> − 7/4 s<sub>1</sub> + 1/2 s<sub>2</sub> = 13/4</b> kaynak satır olarak seçildi. Gomory cut nedir?',
      options: [
        '1/4 − 1/4 s<sub>1</sub> − 1/2 s<sub>2</sub> ≤ 0',
        '1/4 − 3/4 s<sub>1</sub> − 1/2 s<sub>2</sub> ≤ 0',
        '3/4 − 1/4 s<sub>1</sub> − 1/2 s<sub>2</sub> ≤ 0',
        '1/4 + 7/4 s<sub>1</sub> − 1/2 s<sub>2</sub> ≤ 0',
      ],
      answer: 0,
      hint: '⌊−7/4⌋ = −2, ⌊13/4⌋ = 3.',
      explain: 'f(−7/4) = 1/4, f(1/2) = 1/2, f(13/4) = 13/4 − 3 = 1/4 ⇒ 1/4 − 1/4 s<sub>1</sub> − 1/2 s<sub>2</sub> ≤ 0. 3/4 katsayısı |−7/4|\'ün kesri alınarak yapılan klasik hatadır.',
    },
    {
      q: 'Gomory cut f<sub>0</sub> − Σ f<sub>j</sub> N<sub>j</sub> ≤ 0 neden <b>mevcut LR optimumunu</b> keser?',
      options: [
        'Mevcut çözümde tüm nonbasic N<sub>j</sub> = 0 olduğundan sol taraf f<sub>0</sub> > 0 olur ve kısıt sağlanmaz',
        'Mevcut çözümde tüm basic değişkenler 0 olduğundan',
        'f<sub>0</sub> her zaman 1\'den büyük olduğundan',
        'Cut, amaç fonksiyonunu sabit tuttuğundan',
      ],
      answer: 0,
      explain: 'Notlar: "in our current solution, s1 and s2 both equal 0, which is infeasible to the above constraint." Nonbasic değişkenler 0 ⇒ sol taraf = f<sub>0</sub> (kaynak satır kesirli olduğu için 0 < f<sub>0</sub> < 1) > 0.',
    },
    {
      q: 'Telfa\'da cut eklenmiş tabloda s<sub>3</sub> satırı: −0.75 s<sub>1</sub> − 0.25 s<sub>2</sub> + s<sub>3</sub> = −0.75; R0: s<sub>1</sub> katsayısı 1.25, s<sub>2</sub> katsayısı 0.75. Dual simplex ratio test sonucu nedir?',
      options: [
        'Oranlar 5/3 ve 3 ⇒ s<sub>1</sub> girer, s<sub>3</sub> çıkar',
        'Oranlar 5/3 ve 3 ⇒ s<sub>2</sub> girer, s<sub>3</sub> çıkar',
        'Oranlar 3/5 ve 1/3 ⇒ s<sub>2</sub> girer, s<sub>3</sub> çıkar',
        'Oranlar 1 ve 3 ⇒ s<sub>1</sub> girer, x<sub>1</sub> çıkar',
      ],
      answer: 0,
      explain: 'En negatif RHS s<sub>3</sub> satırı ⇒ s<sub>3</sub> çıkar. Negatif katsayılar için |R0 / satır|: s<sub>1</sub>: 1.25/0.75 = 5/3, s<sub>2</sub>: 0.75/0.25 = 3. En küçük 5/3 ⇒ s<sub>1</sub> girer (notlar: "s1 should enter the basis instead of s3"). Oranı ters almak (satır / R0) yanlış değişkeni seçtirir.',
    },
    {
      q: 'Dual simplex\'te <b>basis\'ten çıkan</b> değişken nasıl seçilir?',
      options: [
        'En negatif RHS\'li satırın basic değişkeni çıkar',
        'R0\'da en negatif katsayılı değişken çıkar',
        'Minimum ratio test ile (RHS / pozitif katsayı) çıkan seçilir',
        'En büyük RHS\'li satırın basic değişkeni çıkar',
      ],
      answer: 0,
      explain: 'Notlar: "We choose the most negative RHS. BV of this pivot row leaves the basis." R0\'daki en negatif katsayı ve RHS/pozitif katsayı oranı primal simplex kurallarıdır.',
    },
    {
      q: 'Example 15\'te cut sonrası e<sub>1</sub> girer ve e<sub>1</sub> = 3 olur (x<sub>1</sub> satırı: x<sub>1</sub> − 0.4e<sub>1</sub> + 0.2e<sub>2</sub> = 0.8; R0\'da e<sub>1</sub> katsayısı −0.8, z = 17.6). Yeni z ve x<sub>1</sub> nedir?',
      options: ['z = 20, x<sub>1</sub> = 2', 'z = 15.2, x<sub>1</sub> = −0.4', 'z = 20, x<sub>1</sub> = 0.8', 'z = 17.6, x<sub>1</sub> = 2'],
      answer: 0,
      explain: 'x<sub>1</sub> = 0.8 + 0.4·3 = 2; z − 0.8e<sub>1</sub> − … = 17.6 ⇒ z = 17.6 + 0.8·3 = 20. Notlardaki sonuç: z = 20, x<sub>1</sub> = 2, x<sub>2</sub> = 1 (min probleminde cut LR z\'sini artırır: lower bound sıkılaşır ve integer çözüme yaklaşılır).',
    },
    {
      q: 'Gomory cut eklenip dual simplex uygulandıktan sonra çözüm hâlâ kesirli. Notlara göre ne yapılır?',
      options: [
        'Yeni optimal tablodan (cut satırları dahil) yine ½ kuralıyla bir satır seçip yeni cut üretilir',
        'Kesirli değişken en yakın integer\'a yuvarlanır ve durulur',
        'Kesirli değişken üzerinde Branch & Bound\'a geçilmek zorunludur',
        'Cut yanlış türetilmiştir; LR baştan çözülür',
      ],
      answer: 0,
      explain: 'Adım 8: "Otherwise, proceed from step 3." Algoritma tüm değişkenler integer olana kadar devam eder; o çözüm IP optimaldir. Yuvarlama garanti vermez; B&B\'ye geçmek algoritmanın parçası değildir (o fikir Branch & Cut\'tır).',
    },
    {
      q: '(notlarda yok) Gomory cut türetiminde "sol taraf integer\'dır" argümanı neden geçerlidir?',
      options: [
        'Pure IP\'de kısıt katsayıları ve RHS integer olduğundan slack değişkenler de integer\'dır; satırdaki tüm değişkenler integer, ⌊a<sub>j</sub>⌋\'ler integer',
        'Simplex tablosundaki tüm katsayılar her zaman integer\'dır',
        'Nonbasic değişkenler her zaman 0 olduğu için',
        'Dual simplex integrality\'yi korur',
      ],
      answer: 0,
      explain: 'Sol taraf (basic değişken + Σ⌊a<sub>j</sub>⌋N<sub>j</sub> − ⌊b⌋) integer değişkenlerin integer katlarının toplamıdır. Bunun için slack\'lerin de integer olması gerekir; bu, orijinal kısıtların integer katsayılı olmasından gelir (notlarda açıkça söylenmez). Tablo katsayıları genelde kesirlidir; nonbasic\'lerin 0 olması yalnızca mevcut çözüm için geçerlidir.',
    },
  ];

  /* ====================================================================== 2.10 */
  OR.content.summaries['2.10'] = `
<h2>2.10 Branch &amp; Cut</h2>
<ul>
  <li>B&amp;B'nin bir varyasyonu olan <b>Branch &amp; Cut (B&amp;C)</b>, hesaplamayı hızlandırmak için <b>valid inequality</b>'lerden yararlanır.</li>
  <li>B&amp;C algoritmaları temel B&amp;B stratejisini değiştirir: bir kısmi çözümde (partial solution) <b>dallanmadan önce</b> relaxation'ı yeni eşitsizliklerle <b>güçlendirmeye</b> çalışır.</li>
  <li>Eklenen kısıtlar IP modelinin <b>tüm feasible çözümleri için sağlanmalı</b> (valid), ama <b>son relaxation optimumunu kesip atmalıdır</b> (cut off, render infeasible).</li>
</ul>

<h3>Akış (notlardaki tanımın adım adım okunuşu)</h3>
<ol>
  <li>Bir B&amp;B düğümünde LR'yi çöz.</li>
  <li>Çözüm integer ise candidate; LR infeasible ya da bound kötü ise fathom (B&amp;B'deki kurallar).</li>
  <li>Kesirli ise <b>önce</b> bu kesirli optimumu kesen valid inequality ara (ör. Gomory cut, disjunctive cut, problem-specific facet); bulunursa ekle ve LR'yi yeniden çöz.</li>
  <li>Yeterli/uygun cut kalmayınca <b>dallan</b> (B&amp;B gibi x<sub>j</sub> ≤ ⌊x̄<sub>j</sub>⌋ ve x<sub>j</sub> ≥ ⌈x̄<sub>j</sub>⌉).</li>
</ol>
<p class="muted">Cut'ların hangi sıklıkta aranacağı ve ne zaman dallanmaya geçileceği gibi ayrıntılar notlarda yoktur (notlarda yok).</p>

<h3>Neden işe yarar?</h3>
<table>
  <tr><th>Yöntem</th><th>Kesirli LR optimumunda ne yapar?</th></tr>
  <tr><td>Saf B&amp;B (2.5)</td><td>Hemen dallanır; iki alt problem oluşur.</td></tr>
  <tr><td>Saf cutting plane (2.9.1)</td><td>Yalnızca cut ekler, hiç dallanmaz; integer olana kadar devam eder (çok sayıda cut gerekebilir).</td></tr>
  <tr><td><b>Branch &amp; Cut</b></td><td>Önce cut'larla relaxation'ı sıkılaştırır, sonra gerekiyorsa dallanır.</td></tr>
</table>
<p>Güçlendirilmiş relaxation daha sıkı bound verir (max'ta LR z'si düşer, min'de yükselir) ⇒ daha çok düğüm fathom edilebilir, ağaç küçülür. (Bu yorum notlardaki "to speed computation" ifadesinin açıklamasıdır.)</p>

<h3>Example 16</h3>
<div class="box">Notlarda Example 16 için yalnızca <b>"Please refer to Rardin 12.5, p.676"</b> denir; sayısal çözüm ders notlarında yoktur.</div>

<div class="warnbox"><b>Sınavda dikkat:</b> B&amp;C'de cut'lar <b>dallanmadan önce</b> eklenir. Eklenen kısıt (1) tüm IP-feasible çözümler için geçerli olmalı, (2) <b>son relaxation optimumunu</b> kesmeli. Integer bir çözümü kesen kısıt cut değil, hatalı kısıttır. B&amp;C <b>kısıt (satır)</b> ekler; çok sayıda <b>değişken (sütun)</b> ile uğraşan yöntem Branch &amp; Price'tır.</div>`;

  OR.content.concepts['2.10'] = [
    {
      q: 'Branch &amp; Cut (B&amp;C) nedir?',
      options: [
        'Hesaplamayı hızlandırmak için valid inequality\'lerden yararlanan bir B&amp;B varyasyonu',
        'Çok sayıda değişkeni olan IP\'ler için column generation kullanan bir B&amp;B genellemesi',
        'Hiç dallanmadan yalnızca Gomory cut ekleyen algoritma',
        'Dallanmadan sonra cut\'ları silen bir heuristic',
      ],
      answer: 0,
      explain: 'Notlar: "A variation of B&B termed Branch & Cut (B&C) takes advantage of valid inequalities to speed computation." Column generation Branch &amp; Price\'tır; yalnızca cut ekleyen yöntem saf cutting plane (Gomory) algoritmasıdır.',
    },
    {
      q: 'B&amp;C algoritmaları temel B&amp;B stratejisini nasıl değiştirir?',
      options: [
        'Kısmi bir çözümde dallanmadan önce relaxation\'ı yeni eşitsizliklerle güçlendirmeye çalışır',
        'Dallandıktan sonra alt problemlerin kısıtlarını gevşetir',
        'Relaxation yerine enumeration kullanır',
        'Yalnızca kök düğümde dallanır',
      ],
      answer: 0,
      explain: 'Notlar: "B&C algorithms modify the basic B&B strategy by attempting to strengthen relaxations with new inequalities before branching a partial solution." Önce cut, sonra (gerekirse) dallanma.',
    },
    {
      q: 'B&amp;C\'de eklenen kısıtların sağlaması gereken iki özellik hangileridir? (Birden fazla seçin)',
      options: [
        'IP modelinin tüm feasible çözümleri için sağlanmalı',
        'Son relaxation optimumunu kesip atmalı (infeasible yapmalı)',
        'IP\'nin optimal çözümünü kesip atmalı',
        'Amaç fonksiyonu katsayılarını değiştirmeli',
      ],
      answer: [0, 1],
      explain: 'Notlar: "Added constraints should hold for all feasible solutions to IP model, but they should cut off (render infeasible) the last relaxation optimum." IP optimumunu kesmek kısıtı geçersiz kılar; amaç fonksiyonu değişmez.',
    },
    {
      q: 'Max probleminde B&amp;C bir düğümde geçerli bir cut eklerse o düğümün LR z değeri için ne söylenebilir?',
      options: [
        'Aynı kalır ya da azalır; bound sıkılaşır, fathom olasılığı artar',
        'Kesinlikle artar',
        'IP optimumunun altına düşebilir',
        'Değişmez, çünkü cut\'lar yalnızca integer noktaları etkiler',
      ],
      answer: 0,
      explain: 'Kısıt eklemek feasible bölgeyi daraltır ⇒ max\'ta z artamaz (son LR optimumu kesildiği için tipik olarak düşer). Cut valid olduğundan hiçbir integer çözüm kaybolmaz ⇒ LR z, IP optimumunun altına düşemez. Daha sıkı upper bound ⇒ z ≤ LB ile daha çok fathom ⇒ hızlanma.',
    },
    {
      q: 'Saf cutting plane (Gomory) algoritması ile Branch &amp; Cut arasındaki temel fark nedir?',
      options: [
        'Gomory algoritması hiç dallanmaz, integer olana kadar cut ekler; B&amp;C cut\'ları B&amp;B ağacı içinde, dallanmadan önce kullanır',
        'Gomory algoritması dallanır, B&amp;C dallanmaz',
        'B&amp;C cut kullanmaz, yalnızca bound kullanır',
        'İkisi aynı algoritmanın farklı isimleridir',
      ],
      answer: 0,
      explain: 'Gomory adımları (3–8) yalnızca cut + dual simplex döngüsüdür. B&amp;C ise B&amp;B\'nin varyasyonudur: düğümlerde cut ile relaxation güçlendirilir, sonra dallanılır.',
    },
    {
      q: 'Notlarda Example 16 (Branch &amp; Cut) için ne verilir?',
      options: [
        'Yalnızca "Please refer to Rardin 12.5, p.676" referansı',
        'Telfa problemi için tam B&amp;C ağacı',
        'Knapsack için cover inequality türetimi',
        'Joe State TSP\'sinin B&amp;C ile çözümü',
      ],
      answer: 0,
      explain: 'Notlarda Example 16\'nın sayısal çözümü yoktur; okuyucu Rardin 12.5, s. 676\'ya yönlendirilir. Diğer seçenekler notlarda bulunmaz.',
    },
    {
      q: 'B&amp;C\'de bir düğümdeki LR optimumu kesirli. Aşağıdaki eklemelerden hangisi B&amp;C anlamında bir <b>cut</b> değildir?',
      options: [
        'Optimal integer çözümü de dışarıda bırakan bir kısıt',
        'Kesirli optimumu kesen bir Gomory cut',
        'Kesirli optimumu kesen bir disjunctive cut',
        'Kesirli optimumu kesen, problem yapısından türetilmiş bir facet',
      ],
      answer: 0,
      explain: 'Cut, tüm IP-feasible çözümler için geçerli (valid) olmalıdır. Integer çözümü kesen kısıt valid değildir; IP\'nin cevabını değiştirebilir. Diğer üçü, son relaxation optimumunu kesen valid inequality örnekleridir.',
    },
  ];

  /* ====================================================================== 2.11 */
  OR.content.summaries['2.11'] = `
<h2>2.11 Branch &amp; Price</h2>
<ul>
  <li><b>Branch &amp; Price (B&amp;P)</b>, <b>çok büyük sayıda değişken</b> içeren IP'leri ele almak için özel olarak tasarlanmış, LP tabanlı B&amp;B'nin bir <b>genellemesidir</b>.</li>
  <li>Bazı <b>sütunlar (columns)</b> LR'nin dışında bırakılır, çünkü verimli şekilde işlenemeyecek kadar çoktur ve <b>çoğunun optimal çözümde ilgili değişkeni zaten 0</b>'dır.</li>
  <li>Bir LP çözümünün optimalliğini kontrol etmek için <b>pricing problem</b> çözülür: <b>kârlı reduced cost</b>'a sahip sütunlar aranır.</li>
  <li>Kârlı reduced cost'lu sütunlar bulunursa <b>eklenir</b> ve LR <b>yeniden çözülür</b>.</li>
  <li>Kârlı sütun bulunamazsa LP çözümü <b>optimaldir</b>.</li>
  <li>Optimal LP çözümü integrality koşullarını sağlamıyorsa <b>dallanma</b> yapılır.</li>
  <li>B&amp;P, B&amp;B ağacının <b>her düğümünde column generation</b> uygular.</li>
</ul>

<h3>Bir düğümdeki döngü</h3>
<div class="model">LR'yi mevcut (kısıtlı) sütun kümesiyle çöz
  → pricing problem: kârlı reduced cost'lu sütun var mı?
      evet → sütun(lar)ı ekle, LR'yi tekrar çöz (döngü)
      hayır → LP çözümü optimal
  → LP çözümü integer değil mi? → dallan (her alt düğümde aynı column generation)</div>

<h3>Branch &amp; Cut ile karşılaştırma</h3>
<table>
  <tr><th></th><th>Branch &amp; Cut (2.10)</th><th>Branch &amp; Price (2.11)</th></tr>
  <tr><td>Relaxation'a eklenen</td><td>Kısıtlar (valid inequality / cut, <b>satır</b>)</td><td>Değişkenler (<b>sütun</b>)</td></tr>
  <tr><td>Neden</td><td>Relaxation'ı güçlendirip son LR optimumunu kesmek</td><td>Değişken sayısı çok büyük; tümünü baştan LR'ye koymak verimsiz</td></tr>
  <tr><td>Ekleme kriteri</td><td>Kısıt tüm IP-feasible çözümleri sağlar, LR optimumunu keser</td><td>Pricing problem kârlı reduced cost'lu sütun bulur</td></tr>
  <tr><td>Dallanma</td><td>Cut'lardan sonra, gerekirse</td><td>LP optimal (kârlı sütun yok) ama integer değilse</td></tr>
</table>
<p class="muted">"Kârlı reduced cost" (notlarda yok, açıklama): max probleminde reduced cost'u eklenince amacı iyileştirecek yönde olan sütun — simplex'te giren değişken seçimiyle aynı mantık. Pricing problem'in somut biçimi (ör. hangi alt problem çözüldüğü) notlarda verilmez.</p>

<div class="warnbox"><b>Sınavda dikkat:</b> B&amp;P'de dışarıda bırakılan şey <b>değişkenler/sütunlar</b>dır (kısıtlar değil). "Kârlı sütun yok" ⇒ <b>LP</b> optimal (IP değil!); integrality sağlanmıyorsa dallanılır. Column generation yalnızca kökte değil <b>her düğümde</b> uygulanır.</div>`;

  OR.content.concepts['2.11'] = [
    {
      q: 'Branch &amp; Price hangi tür IP\'ler için tasarlanmıştır?',
      options: [
        'Çok büyük sayıda değişken içeren IP\'ler',
        'Çok büyük sayıda kısıt içeren ama az değişkenli IP\'ler',
        'Yalnızca iki değişkenli pure IP\'ler',
        'Nonlinear amaç fonksiyonlu problemler',
      ],
      answer: 0,
      explain: 'Notlar: "B&P is a generalization of LP based B&B specifically designed to handle IPs that contain a huge number of variables."',
    },
    {
      q: 'B&amp;P\'de bazı sütunlar neden LR\'nin dışında bırakılır? (Birden fazla seçin)',
      options: [
        'Verimli şekilde işlenemeyecek kadar çok sayıdadırlar',
        'Çoğunun ilgili değişkeni optimal çözümde zaten 0\'dır',
        'Bu sütunlar infeasible çözümlere karşılık gelir',
        'Bu sütunların değişkenleri integer olamaz',
      ],
      answer: [0, 1],
      explain: 'Notlar: "Columns are left out of the LR because there are too many to handle efficiently and most of them will have their associated variable equal to zero in an optimal solution anyway." Sütunlar infeasible ya da integer olamaz diye değil, sayıca çok oldukları için dışarıda bırakılır.',
    },
    {
      q: 'B&amp;P\'de <b>pricing problem</b> ne için çözülür?',
      options: [
        'LP çözümünün optimalliğini kontrol etmek için kârlı reduced cost\'lu sütunları aramak',
        'Dallanma değişkenini seçmek',
        'Son LR optimumunu kesen bir valid inequality bulmak',
        'Ürünlerin satış fiyatını belirlemek',
      ],
      answer: 0,
      explain: 'Notlar: "To check the optimality of an LP solution, a pricing problem is solved to try to identify columns with profitable reduced cost." Valid inequality aramak Branch &amp; Cut\'ın işidir.',
    },
    {
      q: 'Pricing problem <b>kârlı reduced cost\'lu sütun bulamazsa</b> ne sonucuna varılır?',
      options: [
        'Mevcut LP çözümü optimaldir',
        'IP infeasible\'dır',
        'Mevcut çözüm IP için optimaldir, algoritma biter',
        'Tüm sütunlar LR\'ye eklenmelidir',
      ],
      answer: 0,
      explain: 'Notlar: "If no profitable columns are found, the LP solution is optimal." Bu yalnızca LP (relaxation) optimalliğidir; çözüm integer değilse dallanma gerekir.',
    },
    {
      q: 'B&amp;P\'de dallanma ne zaman yapılır?',
      options: [
        'Optimal LP çözümü integrality koşullarını sağlamadığında',
        'Pricing problem kârlı bir sütun bulduğunda',
        'Her sütun eklemesinden hemen sonra',
        'Yalnızca LR infeasible olduğunda',
      ],
      answer: 0,
      explain: 'Notlar: "Branching occurs when the optimal LP solution does not satisfy the integrality conditions." Kârlı sütun bulunduğunda sütun eklenip LR yeniden çözülür (dallanma değil); infeasible düğüm ise fathom edilir.',
    },
    {
      q: 'B&amp;P column generation\'ı B&amp;B ağacının neresinde uygular?',
      options: ['Her düğümde', 'Yalnızca kök düğümde', 'Yalnızca yaprak düğümlerde', 'Yalnızca candidate bulunan düğümlerde'],
      answer: 0,
      explain: 'Notlar: "B&P applies column generation at every node of the B&B tree." Dallanma kısıtları reduced cost\'ları değiştirdiğinden her düğümde yeniden fiyatlama gerekir.',
    },
    {
      q: 'Branch &amp; Cut ve Branch &amp; Price\'ı doğru karşılaştıran ifade hangisidir?',
      options: [
        'B&amp;C relaxation\'a kısıt (cut) ekler; B&amp;P relaxation\'a sütun (değişken) ekler',
        'B&amp;C sütun ekler; B&amp;P kısıt ekler',
        'İkisi de dallanma yapmaz',
        'B&amp;P yalnızca 0-1 knapsack problemleri için kullanılır',
      ],
      answer: 0,
      explain: 'B&amp;C valid inequality\'lerle relaxation\'ı güçlendirir (satır ekler); B&amp;P dışarıda bırakılmış kârlı reduced cost\'lu sütunları ekler. İkisi de B&amp;B\'nin varyasyonu/genellemesidir ve dallanır.',
    },
  ];

  /* ====================================================================== cheatsheet */
  OR.content.cheatsheet += `
<h3>10. Cutting planes · Gomory cut · B&amp;C · B&amp;P (2.9–2.11)</h3>
<ul>
  <li><b>Valid inequality</b>: tüm integer feasible çözümleri sağlar. <b>Cutting plane</b>: ayrıca mevcut LR'nin (IP-infeasible) optimumunu keser. Tam doğru cut'larla LP = IP çözümlerinin <b>convex hull</b>'u; en sıkı cut'lar <b>facet</b>.</li>
  <li>Cut türleri: <b>general purpose</b> (disjunctive, Gomory) · <b>problem specific</b> (knapsack, set packing; genellikle facet).</li>
</ul>
<table>
  <tr><th>Gomory adımı</th><th>Kural</th></tr>
  <tr><td>Kaynak satır</td><td>RHS'in kesirli kısmı <b>½'ye en yakın</b> satır</td></tr>
  <tr><td>Ayırma</td><td>a = ⌊a⌋ + f, f = a − ⌊a⌋ ∈ [0, 1). f(−1.25) = 0.75, f(−7/4) = 1/4, f(−0.6) = 0.4</td></tr>
  <tr><td>Cut</td><td><b>f<sub>0</sub> − Σ f<sub>j</sub> N<sub>j</sub> ≤ 0</b> → tabloya −Σ f<sub>j</sub>N<sub>j</sub> + s<sub>yeni</sub> = −f<sub>0</sub></td></tr>
  <tr><td>Dual simplex</td><td>En negatif RHS'in BV'si çıkar; pivot satırında negatif katsayılılar için |R0 / katsayı| en küçük olan girer</td></tr>
  <tr><td>Durma</td><td>Tüm değişkenler integer ⇒ IP optimal; değilse yeni tablodan yeni cut</td></tr>
</table>
<div class="tip">Telfa: max 8x<sub>1</sub> + 5x<sub>2</sub>; LR z = 41.25 (x = 3.75, 2.25). x<sub>1</sub> − 1.25s<sub>1</sub> + 0.25s<sub>2</sub> = 3.75 ⇒ cut 0.75 − 0.75s<sub>1</sub> − 0.25s<sub>2</sub> ≤ 0 (x cinsinden 3x<sub>1</sub> + 2x<sub>2</sub> ≤ 15); oranlar 5/3, 3 ⇒ s<sub>1</sub> girer ⇒ z = 40, x = (5, 0). Example 15 (min): cut 0.6 − 0.2e<sub>1</sub> − 0.4e<sub>2</sub> ≤ 0; oranlar 4, 9 ⇒ e<sub>1</sub> girer ⇒ z = 20, x = (2, 1).</div>
<ul>
  <li><b>Branch &amp; Cut</b>: B&amp;B + valid inequality; <b>dallanmadan önce</b> relaxation'ı cut'larla güçlendir. Cut: tüm IP-feasible çözümleri sağlar, son LR optimumunu keser.</li>
  <li><b>Branch &amp; Price</b>: çok sayıda değişkenli IP; sütunlar LR dışında, <b>pricing problem</b> kârlı reduced cost'lu sütun arar → ekle, yeniden çöz; yoksa LP optimal; integer değilse dallan; column generation <b>her düğümde</b>.</li>
</ul>
`;
})();
