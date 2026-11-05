/* Chapter 3 · Goal Programming — summaries, concept questions, cheatsheet section.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes pp. 47–54 (Example 1 Priceler, Example 2 Modified Priceler, Example 3 Beaver Creek
   Pottery, Example 4 Preemptive Priceler). The GP-simplex tableaus of Example 4 are images in the notes; the tableaus below
   were recomputed with the goal-prog.js solver and checked against a sequential (lexicographic) LP solved with OR.lp
   (final answer x1 = 6, x2 = 0, s1+ = 2, s3- = 5, z3 = 5P3 matches the notes). */
(function () {
  const OR = window.OR;
  const m = (s, i) => `s<sub>${i}</sub><sup>${s}</sup>`; // s_i^-, s_i^+
  const d = (s, i) => `d<sub>${i}</sub><sup>${s}</sup>`;
  const P = (k) => `P<sub>${k}</sub>`;

  /* ====================================================================== 3.0 / 3.1 */
  OR.content.summaries['3.0'] = `
<h2>3. Goal Programming · 3.1 Deviational Variables</h2>
<p>Karar verici bazen <b>birden fazla amaçla (goal)</b> karşı karşıyadır ve LP'nin feasible bölgesinde <b>tüm amaçları aynı anda sağlayan nokta olmayabilir</b>. <b>Goal Programming (GP)</b>, amaç fonksiyonunda birden fazla hedefi dikkate alan bir LP varyasyonudur.</p>

<h3>Örnek 1 · Priceler (Leon Burnit reklam ajansı)</h3>
<p>x<sub>1</sub> = futbol maçlarındaki reklam dakikası, x<sub>2</sub> = soap opera'lardaki reklam dakikası. Bir dakikalık reklamın izleyicisi (milyon) ve maliyeti:</p>
<table>
  <tr><th>Reklam</th><th>HIM</th><th>LIP</th><th>HIW</th><th>Maliyet</th></tr>
  <tr><td>Football</td><td>7</td><td>10</td><td>5</td><td>$100,000</td></tr>
  <tr><td>Soap Opera</td><td>3</td><td>5</td><td>4</td><td>$60,000</td></tr>
</table>
<p>Hedefler: en az 40 milyon HIM, en az 60 milyon LIP, en az 35 milyon HIW; bütçe en fazla $600,000. Tüm hedefleri kısıt olarak yazan LP (z = 0x<sub>1</sub> + 0x<sub>2</sub>; 7x<sub>1</sub> + 3x<sub>2</sub> ≥ 40, 10x<sub>1</sub> + 5x<sub>2</sub> ≥ 60, 5x<sub>1</sub> + 4x<sub>2</sub> ≥ 35, 100x<sub>1</sub> + 60x<sub>2</sub> ≤ 600) <b>infeasible</b>dır: bütçeyi sağlayan hiçbir nokta üç hedefi birden karşılamaz.</p>
<p>Çözüm: her hedef için <b>karşılanmamanın maliyeti</b> (penalty) sorulur: HIM'de eksik kalınan her milyon için $200,000, LIP için $100,000, HIW için $50,000 (kayıp satış).</p>

<h3>Deviational variables</h3>
<p>Hile: her goal'ü temsil eden <b>eşitsizlik, eşitliğe çevrilir</b>. Bir çözümün hedefi aşıp aşmayacağı önceden bilinmediğinden:</p>
<ul>
  <li><b>${m('+', 'i')}</b> = i. goal seviyesinin <b>aşıldığı</b> (exceeded) miktar</li>
  <li><b>${m('−', 'i')}</b> = i. goal seviyesinin <b>altında kalınan</b> (underachieved) miktar</li>
</ul>
<div class="box"><b>Goal constraint:</b> (ifade) + ${m('−', 'i')} − ${m('+', 'i')} = hedef. Bir goal constraint'te deviational variable'lardan <b>en az biri (ya da ikisi) sıfırdır</b>.</div>
<div class="model">min z = 200${m('−', 1)} + 100${m('−', 2)} + 50${m('−', 3)}
s.t. 7x<sub>1</sub> + 3x<sub>2</sub> + ${m('−', 1)} − ${m('+', 1)} = 40     (HIM)
     10x<sub>1</sub> + 5x<sub>2</sub> + ${m('−', 2)} − ${m('+', 2)} = 60    (LIP)
     5x<sub>1</sub> + 4x<sub>2</sub> + ${m('−', 3)} − ${m('+', 3)} = 35     (HIW)
     100x<sub>1</sub> + 60x<sub>2</sub> ≤ 600               (Budget — hard constraint)
     tüm değişkenler ≥ 0</div>
<p><b>Optimal:</b> z = 250, x<sub>1</sub> = 6, x<sub>2</sub> = 0, ${m('+', 1)} = 2, ${m('−', 3)} = 5, diğer sapmalar 0. 6 dakika futbol reklamı: goal 1 ve 2 karşılanır, en az önemli goal 3 karşılanmaz (5 × 6 = 30 milyon HIW, 5 eksik → ceza 50 × 5 = 250).</p>

<h3>Hangi sapma amaç fonksiyonuna girer? (3.1)</h3>
<table>
  <tr><th>Goal tipi</th><th>Başarısızlık</th><th>Amaçta</th></tr>
  <tr><td>"en az" (≥ hedef)</td><td>Değer hedeften <b>küçük</b></td><td>${m('−', 'i')}</td></tr>
  <tr><td>"en fazla" (≤ hedef)</td><td>Değer hedeften <b>büyük</b></td><td>${m('+', 'i')}</td></tr>
  <tr><td>"tam olarak" (= hedef)</td><td>Her iki yönde ceza</td><td>${m('−', 'i')} ve ${m('+', 'i')}</td></tr>
</table>

<h3>Örnek 2 · Modified Priceler (bütçe de bir goal)</h3>
<p>Bütçe kısıtı da bir goal sayılır; aşılan her $1 (bin $ biriminde 1) için 1 ceza. Bütçede kötü olan <b>aşmak</b> olduğundan amaca ${m('+', 4)} girer:</p>
<div class="model">min z = 200${m('−', 1)} + 100${m('−', 2)} + 50${m('−', 3)} + ${m('+', 4)}
s.t. (HIM, LIP, HIW aynı)
     100x<sub>1</sub> + 60x<sub>2</sub> + ${m('−', 4)} − ${m('+', 4)} = 600   (Budget goal)</div>
<p><b>Optimal:</b> z = 100/3, x<sub>1</sub> = 13/3, x<sub>2</sub> = 10/3, ${m('+', 1)} = 1/3, ${m('+', 4)} = 100/3, diğerleri 0. Üç reklam goal'ü de karşılanır, bütçe $100/3 bin aşılır. (Kontrol: 7·13/3 + 3·10/3 = 121/3 = 40 + 1/3; 10·13/3 + 5·10/3 = 60; 5·13/3 + 4·10/3 = 35; 100·13/3 + 60·10/3 = 1900/3 = 600 + 100/3.)</p>
<div class="warnbox"><b>Sınavda dikkat:</b> goal constraint'te işaretler hep <b>+ s⁻ − s⁺</b>; goal'ün yönü (en az/en fazla/tam) kısıtta değil, <b>amaçta hangi sapmanın</b> cezalandırıldığında görünür. Hard constraint (bütçe, Örnek 1) sapma almaz. GP her zaman bir <b>min</b> problemidir. Ağırlıklı GP'de penalty'ler birim başınadır (milyon kişi başına bin $) — ceza = penalty × sapma.</div>
`;

  OR.content.concepts['3.0'] = [
    {
      q: `Priceler örneğinde (Örnek 1) üç reklam hedefini ve bütçeyi kısıt olarak yazan LP neden goal programming'e dönüştürülür?`,
      options: [
        `LP unbounded olduğu için`,
        `LP infeasible olduğu için: bütçeyi sağlayan hiçbir nokta üç hedefi birden karşılamaz`,
        `LP'nin alternatif optimumları olduğu için`,
        `Karar değişkenleri integer olması gerektiği için`,
      ],
      answer: 1,
      explain: `Notlar: "No point that satisfies the budget constraint meets all three of Priceler's goals → LP is infeasible." Bu yüzden her hedef için karşılanmamanın cezası sorulur ve sapmaları minimize eden bir LP kurulur.`,
    },
    {
      q: `Notlardaki tanıma göre ${m('+', 'i')} ve ${m('−', 'i')} nedir?`,
      options: [
        `${m('+', 'i')} = i. goal seviyesinin aşıldığı miktar, ${m('−', 'i')} = altında kalınan miktar`,
        `${m('+', 'i')} = altında kalınan miktar, ${m('−', 'i')} = aşıldığı miktar`,
        `${m('+', 'i')} = slack, ${m('−', 'i')} = surplus değişkeni; ikisi aynı anda pozitif olabilir`,
        `${m('+', 'i')} ve ${m('−', 'i')} goal'ün penalty katsayılarıdır`,
      ],
      answer: 0,
      explain: `s<sub>i</sub><sup>+</sup> = "amount by which the ith goal level is exceeded", s<sub>i</sub><sup>−</sup> = "amount by which the ith goal level is underachieved". Bunlara deviational variables denir; bir goal constraint'te en az biri sıfırdır.`,
    },
    {
      q: `"Reklamlar en az 40 milyon HIM tarafından görülmeli" (7x<sub>1</sub> + 3x<sub>2</sub>) goal'ünün <b>goal constraint</b>'i hangisidir?`,
      options: [
        `7x<sub>1</sub> + 3x<sub>2</sub> ≥ 40`,
        `7x<sub>1</sub> + 3x<sub>2</sub> − ${m('−', 1)} + ${m('+', 1)} = 40`,
        `7x<sub>1</sub> + 3x<sub>2</sub> + ${m('−', 1)} − ${m('+', 1)} = 40`,
        `7x<sub>1</sub> + 3x<sub>2</sub> + ${m('−', 1)} − ${m('+', 1)} ≥ 40`,
      ],
      answer: 2,
      explain: `Eşitsizlik eşitliğe çevrilir: eksik kalınan miktar s<sub>1</sub><sup>−</sup> sol tarafa eklenerek hedefe tamamlanır, fazlası s<sub>1</sub><sup>+</sup> çıkarılır. "En az" bilgisi amaç fonksiyonunda (s<sub>1</sub><sup>−</sup> cezalandırılır) kullanılır.`,
    },
    {
      q: `Bir goal'de başarısızlık, elde edilen değerin hedeften <b>büyük</b> olmasıyla oluşuyorsa amaç fonksiyonunda hangi terim yer alır?`,
      options: [`s<sub>i</sub><sup>−</sup>`, `s<sub>i</sub><sup>+</sup>`, `s<sub>i</sub><sup>−</sup> + s<sub>i</sub><sup>+</sup>`, `Hiçbiri; goal hard constraint olur`],
      answer: 1,
      keepOrder: true,
      explain: `Notlar 3.1: "If failure to meet goal i occurs when the attained value is numerically larger than the desired value of goal i, then a term involving s<sub>i</sub><sup>+</sup> will appear in the objective function." (Örn. bütçeyi aşmak → s<sub>4</sub><sup>+</sup>.)`,
    },
    {
      q: `Bir hedefin <b>tam olarak</b> tutturulması isteniyor ve hem aşma hem altında kalma cezalandırılıyor. Amaç fonksiyonunda ne bulunur?`,
      options: [`Yalnızca s<sub>i</sub><sup>−</sup>`, `Yalnızca s<sub>i</sub><sup>+</sup>`, `Hem s<sub>i</sub><sup>−</sup> hem s<sub>i</sub><sup>+</sup>`, `s<sub>i</sub><sup>−</sup> − s<sub>i</sub><sup>+</sup>`],
      answer: 2,
      keepOrder: true,
      explain: `Notlar: "if we want to meet a goal exactly and a penalty is assessed for going both over and under a goal, then terms involving s<sub>i</sub><sup>−</sup>, s<sub>i</sub><sup>+</sup> will appear." Fark (s⁻ − s⁺) yazmak yanlış olur: iki sapma birbirini götürür ve ceza sıfırlanabilir.`,
    },
    {
      q: `Priceler (Örnek 1) penalty'leri: HIM eksiği milyon başına $200,000, LIP $100,000, HIW $50,000. Doğru amaç fonksiyonu hangisi (bin $)?`,
      options: [
        `min z = 200${m('−', 1)} + 100${m('−', 2)} + 50${m('−', 3)}`,
        `min z = 200${m('+', 1)} + 100${m('+', 2)} + 50${m('+', 3)}`,
        `max z = 200${m('−', 1)} + 100${m('−', 2)} + 50${m('−', 3)}`,
        `min z = 50${m('−', 1)} + 100${m('−', 2)} + 200${m('−', 3)}`,
      ],
      answer: 0,
      explain: `Üç goal de "en az" tipinde → eksik kalma (s⁻) cezalandırılır, her biri kendi penalty'siyle çarpılır ve toplam ceza minimize edilir. s⁺'yı cezalandırmak hedefi aşmayı cezalandırırdı; ağırlıkları ters çevirmek goal'lerin önemini bozar.`,
    },
    {
      q: `Örnek 1'in optimal çözümü x<sub>1</sub> = 6, x<sub>2</sub> = 0. HIW goal'ü (5x<sub>1</sub> + 4x<sub>2</sub> + ${m('−', 3)} − ${m('+', 3)} = 35) için ${m('−', 3)} ve ${m('+', 3)} nedir?`,
      options: [`${m('−', 3)} = 5, ${m('+', 3)} = 0`, `${m('−', 3)} = 0, ${m('+', 3)} = 5`, `${m('−', 3)} = 30, ${m('+', 3)} = 0`, `${m('−', 3)} = 5, ${m('+', 3)} = 5`],
      answer: 0,
      explain: `5·6 + 4·0 = 30 < 35 → 5 milyon eksik: s<sub>3</sub><sup>−</sup> = 5, s<sub>3</sub><sup>+</sup> = 0. Notlar: "30 mio HIW sees Priceler's ads"; ceza 50 · 5 = 250 = z. İkisinin birden pozitif olması gereksizdir (en az biri sıfır).`,
    },
    {
      q: `Örnek 1'in optimal çözümünde (x<sub>1</sub> = 6, x<sub>2</sub> = 0) HIM goal'ü için ${m('+', 1)} kaçtır?`,
      options: [`0`, `2`, `6`, `42`],
      answer: 1,
      keepOrder: true,
      explain: `7·6 + 3·0 = 42 = 40 + 2 → hedef 2 milyon aşılır: s<sub>1</sub><sup>+</sup> = 2, s<sub>1</sub><sup>−</sup> = 0. s<sub>1</sub><sup>+</sup> amaçta olmadığı için cezasızdır.`,
    },
    {
      q: `Modified Priceler'de (Örnek 2) bütçe bir goal'e çevrilir ve aşılan her $1 için $1 ceza verilir. Bütçe goal'ü için modele ne eklenir?`,
      options: [
        `100x<sub>1</sub> + 60x<sub>2</sub> ≤ 600, amaçta değişiklik yok`,
        `100x<sub>1</sub> + 60x<sub>2</sub> + ${m('−', 4)} − ${m('+', 4)} = 600 ve amaçta + ${m('−', 4)}`,
        `100x<sub>1</sub> + 60x<sub>2</sub> + ${m('−', 4)} − ${m('+', 4)} = 600 ve amaçta + ${m('+', 4)}`,
        `100x<sub>1</sub> + 60x<sub>2</sub> − ${m('+', 4)} ≤ 600 ve amaçta + 600${m('+', 4)}`,
      ],
      answer: 2,
      explain: `Bütçede kötü olan aşmaktır (değer hedeften büyük) → s<sub>4</sub><sup>+</sup> cezalandırılır: min z = 200s<sub>1</sub><sup>−</sup> + 100s<sub>2</sub><sup>−</sup> + 50s<sub>3</sub><sup>−</sup> + s<sub>4</sub><sup>+</sup>. Bütçenin altında kalmak (s<sub>4</sub><sup>−</sup>) cezasızdır.`,
    },
    {
      q: `Modified Priceler'in optimal çözümü x<sub>1</sub> = 13/3, x<sub>2</sub> = 10/3. Amaç değeri z ve bütçe aşımı nedir?`,
      options: [`z = 250, aşım yok`, `z = 100/3, ${m('+', 4)} = 100/3 (bin $)`, `z = 0, tüm goal'ler karşılanır`, `z = 100/3, ${m('−', 4)} = 100/3`],
      answer: 1,
      explain: `100·13/3 + 60·10/3 = 1300/3 + 600/3 = 1900/3 = 600 + 100/3 → s<sub>4</sub><sup>+</sup> = 100/3. Üç reklam goal'ü de karşılanır (s<sub>i</sub><sup>−</sup> = 0), bu yüzden z = 1·100/3. Örnek 1'e göre ceza 250'den 100/3'e düşer çünkü bütçe artık esnek.`,
    },
    {
      q: `Bir goal constraint'in optimal çözümünde ${m('−', 'i')} ve ${m('+', 'i')} için aşağıdakilerden hangisi doğrudur?`,
      options: [
        `İkisi de her zaman pozitiftir`,
        `En az biri (ya da ikisi) sıfırdır`,
        `Toplamları her zaman hedefe eşittir`,
        `${m('−', 'i')} her zaman ${m('+', 'i')}'dan büyüktür`,
      ],
      answer: 1,
      explain: `Notlar: "At least one or both deviational variables in a goal constraint must equal zero." Aynı anda hem eksik hem fazla olmak anlamsızdır; ayrıca simplex'te iki sütun lineer bağımlı (biri diğerinin negatifi) olduğundan ikisi birden basic olamaz.`,
    },
    {
      q: `x<sub>1</sub> = 4, x<sub>2</sub> = 2 için Priceler'in LIP goal'ü (10x<sub>1</sub> + 5x<sub>2</sub> + ${m('−', 2)} − ${m('+', 2)} = 60) ve ağırlıklı amaçtaki (100${m('−', 2)}) ceza katkısı nedir?`,
      options: [`${m('−', 2)} = 10, ceza 1000`, `${m('+', 2)} = 10, ceza 1000`, `${m('−', 2)} = 10, ceza 0`, `${m('−', 2)} = 0, ceza 0`],
      answer: 0,
      explain: `10·4 + 5·2 = 50 < 60 → s<sub>2</sub><sup>−</sup> = 10, s<sub>2</sub><sup>+</sup> = 0; ceza 100 · 10 = 1000 (bin $). "En az" goal'ünün altında kalındığı için ceza oluşur.`,
    },
  ];

  /* ====================================================================== 3.2.1 */
  OR.content.summaries['3.2.1'] = `
<h2>3.2 Preemptive Goal Programming · 3.2.1 Graphical Solution</h2>
<p>Karar verici goal'lerin göreli önemini (penalty) kesin olarak belirleyemiyorsa <b>preemptive goal programming (PGP)</b> kullanılır. Goal'ler en önemliden (goal 1) en önemsize (goal n) <b>sıralanır</b>; amaçtaki P<sub>i</sub> katsayısı i. goal'ün ağırlığıdır:</p>
<div class="box"><b>P<sub>1</sub> ⋙ P<sub>2</sub> ⋙ … ⋙ P<sub>n</sub></b> — önce goal 1 olabildiğince sağlanır; goal 1'i sağlayan noktalar arasında goal 2'ye olabildiğince yaklaşılır; … Bir goal'e daha fazla yaklaşmanın <b>tek yolu daha yüksek öncelikli bir goal'ün sapmasını artırmak</b> olduğunda durulur.</div>
<p>İki karar değişkeni varsa PGP <b>grafik olarak</b> çözülebilir.</p>

<h3>Örnek 3 · Beaver Creek Pottery (Taylor)</h3>
<p>x<sub>1</sub> = bowl, x<sub>2</sub> = mug. Bowl: 1 saat işgücü, 4 pound kil, $40 kâr; Mug: 2 saat, 3 pound, $50. Klasik LP: max 40x<sub>1</sub> + 50x<sub>2</sub>, x<sub>1</sub> + 2x<sub>2</sub> ≤ 40, 4x<sub>1</sub> + 3x<sub>2</sub> ≤ 120. Firmanın önem sırasıyla hedefleri:</p>
<ol>
  <li>40 saatten <b>az</b> işgücü kullanmamak → P<sub>1</sub>${d('−', 1)}</li>
  <li>Günde <b>$1,600</b> kâra ulaşmak → P<sub>2</sub>${d('−', 2)}</li>
  <li>Elde <b>120 pound'dan fazla</b> kil bulundurmamak → P<sub>3</sub>${d('+', 3)}</li>
  <li><b>Overtime</b>'ı minimize etmek → P<sub>4</sub>${d('+', 1)} (aynı labor goal'ünün diğer sapması)</li>
</ol>
<div class="model">minimize P<sub>1</sub>${d('−', 1)}, P<sub>2</sub>${d('−', 2)}, P<sub>3</sub>${d('+', 3)}, P<sub>4</sub>${d('+', 1)}
s.t. x<sub>1</sub> + 2x<sub>2</sub> + ${d('−', 1)} − ${d('+', 1)} = 40
     40x<sub>1</sub> + 50x<sub>2</sub> + ${d('−', 2)} − ${d('+', 2)} = 1600
     4x<sub>1</sub> + 3x<sub>2</sub> + ${d('−', 3)} − ${d('+', 3)} = 120
     x<sub>1</sub>, x<sub>2</sub>, d<sub>i</sub><sup>−</sup>, d<sub>i</sub><sup>+</sup> ≥ 0</div>

<h3>Grafik çözüm adımları</h3>
<table>
  <tr><th>Öncelik</th><th>Ne yapılır?</th><th>Sonuç bölgesi</th></tr>
  <tr><td>P<sub>1</sub>: min ${d('−', 1)}</td><td>x<sub>1</sub> + 2x<sub>2</sub> = 40 doğrusunun <b>üstü</b> (orijinin karşı tarafı)</td><td>x<sub>1</sub> + 2x<sub>2</sub> ≥ 40 (${d('−', 1)} = 0)</td></tr>
  <tr><td>P<sub>2</sub>: min ${d('−', 2)}</td><td>Bu bölge 40x<sub>1</sub> + 50x<sub>2</sub> ≥ 1600 ile kesişiyor</td><td>iki yarı-düzlemin kesişimi (${d('−', 2)} = 0)</td></tr>
  <tr><td>P<sub>3</sub>: min ${d('+', 3)}</td><td>Kalan bölge 4x<sub>1</sub> + 3x<sub>2</sub> ≤ 120 ile kesişiyor</td><td>köşeleri (15, 20), (0, 32), (0, 40) olan üçgen (${d('+', 3)} = 0)</td></tr>
  <tr><td>P<sub>4</sub>: min ${d('+', 1)}</td><td>Üçgende x<sub>1</sub> + 2x<sub>2</sub>'yi minimize et: 55, 64, 80 → en küçüğü (15, 20)</td><td>tek nokta (15, 20); ${d('+', 1)} = 55 − 40 = 15 &gt; 0</td></tr>
</table>
<p><b>Optimal:</b> x<sub>1</sub> = 15, x<sub>2</sub> = 20, ${d('+', 1)} = 15. 15 bowl, 20 mug: ilk üç goal karşılanır, <b>15 saat overtime</b> oluşur (40·15 + 50·20 = 1600 tam; 4·15 + 3·20 = 120 tam). Overtime'ı azaltmak için ya kârdan ya kil goal'ünden taviz vermek gerekir — bu daha yüksek önceliği bozar, bu yüzden durulur.</p>
<p class="note">(Köşe hesapları ve "her adımdaki bölge" tablosu notlarda grafikle gösterilmiştir; burada sayısal olarak yazılmıştır.)</p>
<div class="warnbox"><b>Sınavda dikkat:</b> d⁻'yi minimize etmek = "≥" tarafı (orijinin karşısı), d⁺'yi minimize etmek = "≤" tarafı (orijin tarafı). Bir goal karşılanamıyorsa bölge bir <b>doğruya/noktaya</b> iner: önceki bölgede ifadenin en iyi (max veya min) değeri alınır ve sapma = |hedef − bu değer|. Bir alt öncelik için yüksek önceliği <b>asla</b> bozma. Aynı goal'ün iki sapması farklı önceliklerde olabilir (labor: P<sub>1</sub>${d('−', 1)}, P<sub>4</sub>${d('+', 1)}).</div>
`;

  OR.content.concepts['3.2.1'] = [
    {
      q: `<b>Preemptive goal programming</b> ne zaman kullanışlıdır?`,
      options: [
        `Karar verici goal'lerin göreli önemini (penalty) kesin belirleyemediğinde, ama sıralayabildiğinde`,
        `Tüm goal'ler aynı anda karşılanabildiğinde`,
        `Karar değişkenleri binary olduğunda`,
        `Amaç fonksiyonu nonlinear olduğunda`,
      ],
      answer: 0,
      explain: `Notlar: "a decision maker may not be able to determine precisely the relative importance of the goals. When this is the case, PGP may prove to be a useful tool." Goal'ler en önemliden en önemsize sıralanır.`,
    },
    {
      q: `P<sub>1</sub> ⋙ P<sub>2</sub> ⋙ … ⋙ P<sub>n</sub> tanımı ne anlama gelir?`,
      options: [
        `P<sub>1</sub> = 2P<sub>2</sub> gibi sabit oranlı ağırlıklar`,
        `Önce goal 1 olabildiğince sağlanır; goal 1'i sağlayan noktalar arasında goal 2'ye en çok yaklaşılır, vb.`,
        `Tüm goal'lerin sapmaları eşit ağırlıkla toplanır`,
        `Sadece en düşük öncelikli goal dikkate alınır`,
      ],
      answer: 1,
      explain: `"This definition ensures that the decision maker first tries to satisfy the most important goal. Then among all points that satisfy goal 1, the decision maker tries to come as close as possible to satisfying goal 2, and so forth." Sonlu bir ağırlık oranı değil, lexicographic bir sıralamadır.`,
    },
    {
      q: `PGP'de çözüm süreci ne zaman durur?`,
      options: [
        `Tüm goal'ler karşılandığında ya da bir goal'e daha çok yaklaşmanın tek yolu daha yüksek öncelikli bir goal'ün sapmasını artırmak olduğunda`,
        `İlk goal karşılandığında`,
        `Amaç değeri sıfır olduğunda; aksi halde problem infeasible'dır`,
        `Her goal için bir pivot yapıldığında`,
      ],
      answer: 0,
      explain: `Notlar: "We continue in this fashion until the only way we can come closer to satisfying a goal is to increase the deviation from a higher priority goal." (Tüm goal'ler sağlanırsa zaten optimal.)`,
    },
    {
      q: `Beaver Creek'te P<sub>1</sub>${d('−', 1)}'i minimize etmek (x<sub>1</sub> + 2x<sub>2</sub> + ${d('−', 1)} − ${d('+', 1)} = 40) grafikte hangi bölgeyi verir?`,
      options: [
        `x<sub>1</sub> + 2x<sub>2</sub> ≤ 40 (orijin tarafı)`,
        `x<sub>1</sub> + 2x<sub>2</sub> ≥ 40 (orijinin karşı tarafı)`,
        `Yalnızca x<sub>1</sub> + 2x<sub>2</sub> = 40 doğrusu`,
        `x<sub>1</sub> + 2x<sub>2</sub> ≥ 40 ve 4x<sub>1</sub> + 3x<sub>2</sub> ≤ 120 kesişimi`,
      ],
      answer: 1,
      explain: `${d('−', 1)} = 0 ⇔ işgücü 40 saatin altında değil ⇔ x<sub>1</sub> + 2x<sub>2</sub> ≥ 40 (yarı-düzlem, doğru dahil). Fazlası (overtime) ${d('+', 1)}'dir ve ancak P<sub>4</sub>'te dikkate alınır.`,
    },
    {
      q: `Beaver Creek'te "elde 120 pound'dan fazla kil bulundurmamak" goal'ü hangi sapmanın minimize edilmesiyle ifade edilir?`,
      options: [`${d('−', 3)}`, `${d('+', 3)}`, `${d('−', 3)} + ${d('+', 3)}`, `${d('+', 1)}`],
      answer: 1,
      keepOrder: true,
      explain: `4x<sub>1</sub> + 3x<sub>2</sub> + ${d('−', 3)} − ${d('+', 3)} = 120; 120'yi aşan kil kullanımı ${d('+', 3)}'tür → P<sub>3</sub>${d('+', 3)} minimize edilir (grafikte 4x<sub>1</sub> + 3x<sub>2</sub> ≤ 120 tarafı).`,
    },
    {
      q: `Beaver Creek'te P<sub>4</sub> (overtime'ı minimize et) neden ${d('+', 1)} ile gösterilir?`,
      options: [
        `Overtime yeni bir goal constraint gerektirir`,
        `Overtime, labor goal'ünde (x<sub>1</sub> + 2x<sub>2</sub> = 40) 40 saatin aşılan kısmıdır`,
        `Overtime, kil goal'ünün eksiğidir`,
        `${d('+', 1)} kâr fazlasıdır`,
      ],
      answer: 1,
      explain: `Aynı labor constraint'inin iki sapması farklı önceliklerdedir: P<sub>1</sub>${d('−', 1)} (40 saatten az kullanma) ve P<sub>4</sub>${d('+', 1)} (40'ı aşan = overtime). Yeni kısıt gerekmez.`,
    },
    {
      q: `Beaver Creek'te P<sub>1</sub>–P<sub>3</sub> sağlandıktan sonra bölgenin köşeleri (15, 20), (0, 32), (0, 40). P<sub>4</sub> hangi noktayı ve ${d('+', 1)} değerini verir?`,
      options: [`(0, 32), ${d('+', 1)} = 24`, `(15, 20), ${d('+', 1)} = 15`, `(0, 40), ${d('+', 1)} = 40`, `(24, 8), ${d('+', 1)} = 0`],
      answer: 1,
      explain: `x<sub>1</sub> + 2x<sub>2</sub> köşelerde: 15 + 40 = 55, 0 + 64 = 64, 0 + 80 = 80. En küçüğü 55 → (15, 20), ${d('+', 1)} = 55 − 40 = 15 saat overtime. (24, 8) labor ve kil doğrularının kesişimidir ama kârı 1360 &lt; 1600 olduğundan P<sub>2</sub>'yi bozar.`,
    },
    {
      q: `Beaver Creek'in optimal çözümü (x<sub>1</sub>, x<sub>2</sub>) = (15, 20) için hangisi <b>yanlıştır</b>?`,
      options: [
        `Kâr tam $1,600 (${d('−', 2)} = ${d('+', 2)} = 0)`,
        `Kil kullanımı tam 120 pound (${d('+', 3)} = 0)`,
        `İşgücü 55 saat, ${d('+', 1)} = 15`,
        `Dört goal'ün hepsi tam karşılanmıştır`,
      ],
      answer: 3,
      keepOrder: true,
      explain: `40·15 + 50·20 = 1600, 4·15 + 3·20 = 120, 15 + 2·20 = 55. İlk üç goal karşılanır ama P<sub>4</sub> (overtime yok) karşılanmaz: ${d('+', 1)} = 15. Notlar: "This meets the first three goals by having 15 hours overtime labor."`,
    },
    {
      q: `Grafik PGP'de k. öncelikli bir "≥ hedef" goal'ü (min d<sub>k</sub><sup>−</sup>) mevcut bölgede karşılanamıyorsa ne yapılır?`,
      options: [
        `Daha yüksek öncelikli bir goal gevşetilir`,
        `Bölgede ifadenin en büyük değerini veren nokta(lar) seçilir; sapma = hedef − bu değer`,
        `Problem infeasible ilan edilir`,
        `Goal atlanır ve bölge değişmez`,
      ],
      answer: 1,
      explain: `Yüksek öncelikler korunur; o bölge içinde hedefe en yakın noktalar (ifadenin max'ı) alınır. Bölge bu değere eşit doğru parçasına/noktaya iner ve sonraki öncelikler bu küme içinde çalışır.`,
    },
  ];

  /* ====================================================================== 3.2.2 */
  const tbl = (rows, head) =>
    `<table class="mtx"><tr><th></th>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows
      .map((r) => `<tr><th>${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`)
      .join('')}</table>`;
  const H = ['x<sub>1</sub>', 'x<sub>2</sub>', m('−', 1), m('+', 1), m('−', 2), m('+', 2), m('−', 3), m('+', 3), 's<sub>4</sub>', 'RHS'];
  const T0 = tbl(
    [
      ['Row 0 (goal 1)', `7${P(1)}`, `3${P(1)}`, 0, `−${P(1)}`, 0, 0, 0, 0, 0, `40${P(1)}`],
      ['Row 0 (goal 2)', `10${P(2)}`, `5${P(2)}`, 0, 0, 0, `−${P(2)}`, 0, 0, 0, `60${P(2)}`],
      ['Row 0 (goal 3)', `5${P(3)}`, `4${P(3)}`, 0, 0, 0, 0, 0, `−${P(3)}`, 0, `35${P(3)}`],
      [`Row 1 · ${m('−', 1)}`, 7, 3, 1, '−1', 0, 0, 0, 0, 0, 40],
      [`Row 2 · ${m('−', 2)}`, 10, 5, 0, 0, 1, '−1', 0, 0, 0, 60],
      [`Row 3 · ${m('−', 3)}`, 5, 4, 0, 0, 0, 0, 1, '−1', 0, 35],
      ['Row 4 · s<sub>4</sub>', 100, 60, 0, 0, 0, 0, 0, 0, 1, 600],
    ],
    H
  );
  const T1 = tbl(
    [
      ['Row 0 (goal 1)', 0, 0, `−${P(1)}`, 0, 0, 0, 0, 0, 0, '0'],
      ['Row 0 (goal 2)', 0, `(5/7)${P(2)}`, `−(10/7)${P(2)}`, `(10/7)${P(2)}`, 0, `−${P(2)}`, 0, 0, 0, `(20/7)${P(2)}`],
      ['Row 0 (goal 3)', 0, `(13/7)${P(3)}`, `−(5/7)${P(3)}`, `(5/7)${P(3)}`, 0, 0, 0, `−${P(3)}`, 0, `(45/7)${P(3)}`],
      ['Row 1 · x<sub>1</sub>', 1, '3/7', '1/7', '−1/7', 0, 0, 0, 0, 0, '40/7'],
      [`Row 2 · ${m('−', 2)}`, 0, '5/7', '−10/7', '10/7', 1, '−1', 0, 0, 0, '20/7'],
      [`Row 3 · ${m('−', 3)}`, 0, '13/7', '−5/7', '5/7', 0, 0, 1, '−1', 0, '45/7'],
      ['Row 4 · s<sub>4</sub>', 0, '120/7', '−100/7', '100/7', 0, 0, 0, 0, 1, '200/7'],
    ],
    H
  );
  const T2 = tbl(
    [
      ['Row 0 (goal 1)', 0, 0, `−${P(1)}`, 0, 0, 0, 0, 0, 0, '0'],
      ['Row 0 (goal 2)', 0, `−${P(2)}`, 0, 0, 0, `−${P(2)}`, 0, 0, `−(1/10)${P(2)}`, '0'],
      ['Row 0 (goal 3)', 0, `${P(3)}`, 0, 0, 0, 0, 0, `−${P(3)}`, `−(1/20)${P(3)}`, `5${P(3)}`],
      ['Row 1 · x<sub>1</sub>', 1, '3/5', 0, 0, 0, 0, 0, 0, '1/100', '6'],
      [`Row 2 · ${m('−', 2)}`, 0, '−1', 0, 0, 1, '−1', 0, 0, '−1/10', '0'],
      [`Row 3 · ${m('−', 3)}`, 0, 1, 0, 0, 0, 0, 1, '−1', '−1/20', '5'],
      [`Row 4 · ${m('+', 1)}`, 0, '6/5', '−1', 1, 0, 0, 0, 0, '7/100', '2'],
    ],
    H
  );

  OR.content.summaries['3.2.2'] = `
<h2>3.2.2 Goal Programming Simplex</h2>
<p>PGP problemleri simplex'in bir uzantısı olan <b>goal programming simplex</b> ile çözülür. Sıradan simplex'ten farkları:</p>
<ul>
  <li>Tek bir Row 0 yerine <b>n tane Row 0</b> (her goal için bir tane): amaç n parçaya ayrılır, min z<sub>i</sub> = P<sub>i</sub>·(sapma), Row 0 (goal i): z<sub>i</sub> − P<sub>i</sub>·(sapma) = 0.</li>
  <li><b>Entering variable</b> (PGP bir min problemidir):
    <ol>
      <li>Karşılanmamış <b>en yüksek öncelikli goal</b> i'yi bul (z<sub>i'</sub> &gt; 0).</li>
      <li>Row 0 (goal i')'de <b>en pozitif</b> katsayılı değişkeni sok…</li>
      <li>…<b>ama</b> bir değişkenin daha yüksek öncelikli bir goal'ün Row 0'ında <b>negatif</b> katsayısı varsa o değişken giremez (girerse o goal'ün sapması artar). Başka pozitif katsayılı değişken dene; hiçbiri giremiyorsa Row 0 (goal i'+1)'e geç.</li>
    </ol></li>
  <li>Pivotta <b>her goal'ün Row 0'ı</b> güncellenir. Leaving variable: olağan ratio test.</li>
  <li><b>Optimal:</b> tüm goal'ler karşılandıysa, ya da karşılanmamış bir goal i'nin z<sub>i</sub>'sini azaltabilecek her değişken daha yüksek öncelikli bir goal'ün sapmasını artırıyorsa.</li>
</ul>

<h3>Örnek 4 · Preemptive Priceler</h3>
<div class="model">min z = P<sub>1</sub>${m('−', 1)} + P<sub>2</sub>${m('−', 2)} + P<sub>3</sub>${m('−', 3)}
s.t. 7x<sub>1</sub> + 3x<sub>2</sub> + ${m('−', 1)} − ${m('+', 1)} = 40     (HIM)
     10x<sub>1</sub> + 5x<sub>2</sub> + ${m('−', 2)} − ${m('+', 2)} = 60    (LIP)
     5x<sub>1</sub> + 4x<sub>2</sub> + ${m('−', 3)} − ${m('+', 3)} = 35     (HIW)
     100x<sub>1</sub> + 60x<sub>2</sub> + s<sub>4</sub> = 600              (Budget, s<sub>4</sub> slack)</div>
<p>Üç Row 0: z<sub>1</sub> − P<sub>1</sub>${m('−', 1)} = 0, z<sub>2</sub> − P<sub>2</sub>${m('−', 2)} = 0, z<sub>3</sub> − P<sub>3</sub>${m('−', 3)} = 0. Başlangıç bfs: <b>BV = {${m('−', 1)}, ${m('−', 2)}, ${m('−', 3)}, s<sub>4</sub>}</b>. Basic değişkenler Row 0'lardan yok edilir: "P<sub>1</sub>×Row 1"i Row 0 (goal 1)'e, "P<sub>2</sub>×Row 2"yi Row 0 (goal 2)'ye, "P<sub>3</sub>×Row 3"ü Row 0 (goal 3)'e ekle:</p>
<div style="overflow-x:auto">${T0}</div>
<p><b>Pivot 1.</b> Goal 1 karşılanmıyor (z<sub>1</sub> = 40P<sub>1</sub>). Row 0 (goal 1)'de en pozitif: x<sub>1</sub> (7P<sub>1</sub>). Ratio test: 40/7, 60/10 = 6, 35/5 = 7, 600/100 = 6 → en küçük 40/7, <b>${m('−', 1)} çıkar</b>.</p>
<div style="overflow-x:auto">${T1}</div>
<p><b>Pivot 2.</b> Goal 1 karşılandı (z<sub>1</sub> = 0). Goal 2: z<sub>2</sub> = (20/7)P<sub>2</sub>. Row 0 (goal 2)'de pozitif olanlar x<sub>2</sub> (5/7)P<sub>2</sub> ve ${m('+', 1)} (10/7)P<sub>2</sub>; ikisinin de Row 0 (goal 1)'deki katsayısı 0 (negatif değil) → en pozitif <b>${m('+', 1)} girer</b>. (${m('−', 1)}'in goal 1 satırındaki katsayısı −P<sub>1</sub> olduğundan o zaten aday olamaz.) Ratio test: Row 2: (20/7)/(10/7) = 2, Row 3: (45/7)/(5/7) = 9, Row 4: (200/7)/(100/7) = 2 → Row 2 ile Row 4 arasında <b>eşitlik</b>. Burada s<sub>4</sub> çıkarılır (Row 4):</p>
<div style="overflow-x:auto">${T2}</div>
<p><b>Optimallik.</b> z<sub>1</sub> = z<sub>2</sub> = 0, goal 3 karşılanmıyor (z<sub>3</sub> = 5P<sub>3</sub>). Row 0 (goal 3)'te pozitif katsayılı tek değişken x<sub>2</sub> (P<sub>3</sub>); ama x<sub>2</sub>'nin Row 0 (goal 2)'deki katsayısı <b>−P<sub>2</sub></b> → girerse goal 2'nin sapması artar, <b>giremez</b>. Tablo optimaldir.</p>
<p><b>Sonuç (notlarla aynı):</b> z<sub>3</sub> = 5P<sub>3</sub>, x<sub>1</sub> = 6, x<sub>2</sub> = 0, ${m('+', 1)} = 2, ${m('−', 3)} = 5, diğer sapmalar 0. 6 dakika futbol reklamı; goal 1 ve 2 karşılanır, goal 3 karşılanmaz (30 milyon HIW).</p>
<p class="note">(Notlarda tablolar görsel olarak verilmiştir; yukarıdaki tablolar aynı yöntemle yeniden hesaplanmış ve sıralı LP çözümüyle doğrulanmıştır. Pivot 2'deki eşitlikte ${m('−', 2)} çıkarılırsa ek bir degenerate pivot (x<sub>2</sub> girer, s<sub>4</sub> çıkar, oran 0) yapılır ve aynı çözüm bulunur.)</p>
<div class="warnbox"><b>Sınavda dikkat:</b> Row 0'daki katsayılar "z<sub>j</sub> − c<sub>j</sub>" biçimindedir ve P<sub>i</sub> cinsinden yazılır (7P<sub>1</sub> gibi). Karşılanmış goal'ün satırına bakılmaz. Entering variable seçilirken <b>yalnızca daha yüksek öncelikli</b> satırlardaki negatif katsayılar engeldir; daha düşük öncelikli satırlar engel değildir. Pivotta tüm Row 0'lar güncellenir — z<sub>i</sub> değerleri RHS sütunundan okunur. Bir "≤" goal'ünün (min s<sup>+</sup>) Row 0'ı başlangıçta düzeltme gerektirmez (s<sup>+</sup> nonbasic, z = 0).</div>
`;

  OR.content.concepts['3.2.2'] = [
    {
      q: `Goal programming simplex ile sıradan simplex arasındaki temel farklardan biri hangisidir?`,
      options: [
        `GP simplex'te her goal için ayrı bir Row 0 vardır (n tane Row 0)`,
        `GP simplex'te ratio test yapılmaz`,
        `GP simplex bir max problemidir; en negatif katsayı girer`,
        `GP simplex'te pivottan sonra yalnızca en yüksek öncelikli Row 0 güncellenir`,
      ],
      answer: 0,
      explain: `Notlar: "The ordinary simplex has a single row 0, whereas the goal programming simplex requires n row 0's (one for each goal)." Ratio test aynıdır, PGP min problemidir (en pozitif girer) ve pivotta tüm Row 0'lar güncellenir.`,
    },
    {
      q: `Preemptive Priceler'de (Örnek 4) başlangıç bfs'i hangisidir?`,
      options: [
        `BV = {x<sub>1</sub>, x<sub>2</sub>, s<sub>4</sub>}`,
        `BV = {${m('+', 1)}, ${m('+', 2)}, ${m('+', 3)}, s<sub>4</sub>}`,
        `BV = {${m('−', 1)}, ${m('−', 2)}, ${m('−', 3)}, s<sub>4</sub>}`,
        `BV = {${m('−', 1)}, ${m('−', 2)}, ${m('−', 3)}}`,
      ],
      answer: 2,
      explain: `x = 0'da her goal constraint'te +1 katsayılı s<sub>i</sub><sup>−</sup> = hedef olur; bütçe satırında slack s<sub>4</sub> = 600. Dört kısıt → dört basic değişken. s<sub>i</sub><sup>+</sup>'nın katsayısı −1 olduğundan başlangıç BV olamaz.`,
    },
    {
      q: `Örnek 4'te basic değişkenleri Row 0'lardan yok etmek için Row 0 (goal 1)'e ne eklenir ve sonuç ne olur?`,
      options: [
        `P<sub>1</sub>×Row 1 → z<sub>1</sub> + 7P<sub>1</sub>x<sub>1</sub> + 3P<sub>1</sub>x<sub>2</sub> − P<sub>1</sub>${m('+', 1)} = 40P<sub>1</sub>`,
        `−P<sub>1</sub>×Row 1 → z<sub>1</sub> − 7P<sub>1</sub>x<sub>1</sub> − 3P<sub>1</sub>x<sub>2</sub> = −40P<sub>1</sub>`,
        `P<sub>1</sub>×Row 4 → z<sub>1</sub> + 100P<sub>1</sub>x<sub>1</sub> + 60P<sub>1</sub>x<sub>2</sub> = 600P<sub>1</sub>`,
        `Hiçbir şey; Row 0 (goal 1) zaten uygun formdadır`,
      ],
      answer: 0,
      explain: `Notlar: "Add P1×Row 1 to Row 0 (goal 1)". z<sub>1</sub> − P<sub>1</sub>s<sub>1</sub><sup>−</sup> = 0 satırına P<sub>1</sub>(7x<sub>1</sub> + 3x<sub>2</sub> + s<sub>1</sub><sup>−</sup> − s<sub>1</sub><sup>+</sup> = 40) eklenince s<sub>1</sub><sup>−</sup> yok olur; z<sub>1</sub> = 40P<sub>1</sub> (goal 1 başlangıçta 40 eksik).`,
    },
    {
      q: `GP simplex'te entering variable seçiminin <b>ilk adımı</b> nedir?`,
      options: [
        `Tüm Row 0'ların toplamındaki en pozitif katsayıyı bul`,
        `Karşılanmamış en yüksek öncelikli goal i''yi bul`,
        `En düşük öncelikli goal'ün satırına bak`,
        `Ratio testte en küçük oranı veren satırı bul`,
      ],
      answer: 1,
      explain: `"Find the highest priority goal (goal i') that has not been met", sonra Row 0 (goal i')'de en pozitif katsayılı değişken seçilir (kısıtla birlikte). Karşılanmış goal'lerin satırları atlanır.`,
    },
    {
      q: `Karşılanmamış goal i''nin Row 0'ında x<sub>2</sub>'nin katsayısı +P<sub>3</sub>, fakat daha yüksek öncelikli goal 2'nin Row 0'ında −P<sub>2</sub>. x<sub>2</sub> girebilir mi?`,
      options: [
        `Evet, Row 0 (goal i')'de pozitif olduğu için`,
        `Hayır: daha yüksek öncelikli bir goal satırında negatif katsayısı var; girerse goal 2'nin sapması artar`,
        `Evet, P<sub>3</sub> &gt; P<sub>2</sub> olduğu için`,
        `Yalnızca ratio test 0 verirse`,
      ],
      answer: 1,
      explain: `Notlar: "If a variable has a negative coefficient in row 0 (goal i') associated with a goal having a higher priority than i', then the variable cannot enter the basis." Örnek 4'ün son tablosu tam olarak budur ve tablo optimaldir. (P<sub>2</sub> ⋙ P<sub>3</sub>.)`,
    },
    {
      q: `Örnek 4'ün ilk pivotunda x<sub>1</sub> girer. Ratio test oranları 40/7, 6, 7, 6. Hangi değişken çıkar ve yeni z<sub>1</sub> nedir?`,
      options: [`${m('−', 1)} çıkar, z<sub>1</sub> = 0`, `${m('−', 2)} çıkar, z<sub>1</sub> = 0`, `s<sub>4</sub> çıkar, z<sub>1</sub> = 40P<sub>1</sub>/7`, `${m('−', 1)} çıkar, z<sub>1</sub> = 40P<sub>1</sub>/7`],
      answer: 0,
      explain: `En küçük oran 40/7 (Row 1) → s<sub>1</sub><sup>−</sup> çıkar; x<sub>1</sub> = 40/7. z<sub>1</sub> = 40P<sub>1</sub> − 7P<sub>1</sub>·40/7 = 0 → goal 1 karşılandı (7·40/7 = 40 HIM).`,
    },
    {
      q: `Örnek 4'te ilk pivottan sonra z<sub>1</sub> = 0 ve Row 0 (goal 2)'de x<sub>2</sub>: (5/7)P<sub>2</sub>, ${m('+', 1)}: (10/7)P<sub>2</sub>, ${m('−', 1)}: −(10/7)P<sub>2</sub>. Hangi değişken girer?`,
      options: [`x<sub>2</sub>`, `${m('+', 1)}`, `${m('−', 1)}`, `Hiçbiri; tablo optimal`],
      answer: 1,
      keepOrder: true,
      explain: `Goal 2 karşılanmıyor (z<sub>2</sub> = (20/7)P<sub>2</sub>). Pozitif katsayılılardan en büyüğü s<sub>1</sub><sup>+</sup> (10/7 &gt; 5/7); Row 0 (goal 1)'deki katsayısı 0 olduğu için engel yok. Fazla HIM gösterimi (s<sub>1</sub><sup>+</sup>) goal 1'i bozmaz.`,
    },
    {
      q: `GP simplex'te bir tablo ne zaman <b>optimaldir</b>?`,
      options: [
        `Tüm Row 0'lardaki tüm katsayılar ≤ 0 olduğunda`,
        `Tüm goal'ler karşılandığında ya da karşılanmamış goal i''nin z<sub>i'</sub>'sini azaltabilecek her değişken daha yüksek öncelikli bir goal'ün sapmasını artırıyorsa`,
        `En yüksek öncelikli goal karşılandığında`,
        `RHS sütununda negatif değer kalmadığında`,
      ],
      answer: 1,
      explain: `Notlar: "A tableau will yield the optimal solution if all goals are satisfied, or if each variable that can enter the basis and reduce the value of z<sub>i'</sub> for an unsatisfied goal i' will increase the deviation from some goal i having a higher priority." Tüm katsayıların ≤ 0 olması gerekmez (Örnek 4 son tabloda x<sub>2</sub>: +P<sub>3</sub>).`,
    },
    {
      q: `Pivot sırasında hangi Row 0'lar güncellenir?`,
      options: [`Yalnızca entering variable'ın seçildiği goal'ün Row 0'ı`, `Yalnızca karşılanmamış goal'lerin Row 0'ları`, `Her goal'ün Row 0'ı`, `Hiçbiri; Row 0'lar sadece başta düzeltilir`],
      answer: 2,
      keepOrder: true,
      explain: `Notlar: "When a pivot is performed, row 0 for each goal must be updated." Aksi halde karşılanmış bir goal'ün bozulup bozulmadığı (negatif katsayılar) ve z<sub>i</sub> değerleri yanlış okunur.`,
    },
    {
      q: `Örnek 4'ün optimal tablosundan okunan çözüm hangisidir?`,
      options: [
        `x<sub>1</sub> = 6, x<sub>2</sub> = 0, ${m('+', 1)} = 2, ${m('−', 3)} = 5, z<sub>3</sub> = 5P<sub>3</sub>`,
        `x<sub>1</sub> = 13/3, x<sub>2</sub> = 10/3, tüm goal'ler karşılanır`,
        `x<sub>1</sub> = 40/7, x<sub>2</sub> = 0, z<sub>2</sub> = (20/7)P<sub>2</sub>`,
        `x<sub>1</sub> = 0, x<sub>2</sub> = 10, ${m('−', 1)} = 10`,
      ],
      answer: 0,
      explain: `Son tablo: x<sub>1</sub> = 6, s<sub>1</sub><sup>+</sup> = 2, s<sub>3</sub><sup>−</sup> = 5, s<sub>2</sub><sup>−</sup> = 0 (basic, degenerate); z<sub>1</sub> = z<sub>2</sub> = 0, z<sub>3</sub> = 5P<sub>3</sub>. 13/3, 10/3 Modified Priceler'in (bütçe goal'ü) çözümüdür; 40/7 ilk pivottan sonraki ara çözümdür.`,
    },
  ];

  /* ====================================================================== cheatsheet */
  OR.content.cheatsheet += `
<section>
<h3>Ch.3 Goal Programming</h3>
<table>
  <tr><th>Kavram</th><th>Formül / kural</th></tr>
  <tr><td><b>Goal constraint</b></td><td>(ifade) + s<sub>i</sub><sup>−</sup> − s<sub>i</sub><sup>+</sup> = hedef; s<sub>i</sub><sup>+</sup> = aşım, s<sub>i</sub><sup>−</sup> = eksik; en az biri 0</td></tr>
  <tr><td><b>Amaçta hangi sapma?</b></td><td>"en az" → s<sup>−</sup> · "en fazla" → s<sup>+</sup> · "tam" → s<sup>−</sup> + s<sup>+</sup>. Hard constraint sapma almaz. Her zaman <b>min</b>.</td></tr>
  <tr><td><b>Weighted GP</b></td><td>min Σ (penalty × istenmeyen sapma). Priceler: min 200s<sub>1</sub><sup>−</sup> + 100s<sub>2</sub><sup>−</sup> + 50s<sub>3</sub><sup>−</sup> → x = (6, 0), z = 250. Modified (bütçe goal'ü, + s<sub>4</sub><sup>+</sup>): x = (13/3, 10/3), z = 100/3</td></tr>
  <tr><td><b>Preemptive GP</b></td><td>P<sub>1</sub> ⋙ P<sub>2</sub> ⋙ …: önce P<sub>1</sub>, onu bozmadan P<sub>2</sub>, … (lexicographic). Bir goal'e yaklaşmak üst önceliği bozuyorsa dur.</td></tr>
  <tr><td><b>Grafik (2 değişken)</b></td><td>min d<sup>−</sup> → "≥" yarı-düzlemi (orijinin karşısı); min d<sup>+</sup> → "≤" (orijin tarafı). Karşılanamazsa bölgedeki en iyi değer alınır, sapma = |hedef − değer|. Beaver Creek: (15, 20), d<sub>1</sub><sup>+</sup> = 15</td></tr>
  <tr><td><b>GP simplex</b></td><td>Her goal için Row 0: z<sub>i</sub> − P<sub>i</sub>·sapma = 0; başlangıç BV {s<sub>i</sub><sup>−</sup>, slack}; "P<sub>i</sub>×Row" ekleyerek düzelt. Entering: karşılanmamış en yüksek öncelikli goal'ün satırında <b>en pozitif</b>; daha yüksek öncelikli satırda <b>negatif</b> katsayılı değişken giremez. Ratio test olağan; tüm Row 0'lar güncellenir.</td></tr>
  <tr><td><b>Optimal (GP simplex)</b></td><td>Tüm z<sub>i</sub> = 0, ya da karşılanmamış goal'ü iyileştirecek her değişken üst öncelikli bir goal'ü bozuyor. Preemptive Priceler: x = (6, 0), s<sub>1</sub><sup>+</sup> = 2, s<sub>3</sub><sup>−</sup> = 5, z<sub>3</sub> = 5P<sub>3</sub></td></tr>
</table>
</section>
`;
})();
