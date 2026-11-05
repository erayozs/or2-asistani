/* Chapter 1 (1.0 – 1.8) learning content: summaries + concept questions.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, Ch.1 "Integer Programming – Formulating IPs" (pages 1–20 of the notes). */
(function () {
  const OR = window.OR;

  /* ====================================================================== 1.0 */
  OR.content.summaries['1.0'] = `
<h2>1.0 IP Temelleri — Pure / Mixed / Binary IP ve LP Relaxation</h2>
<p>LP formüle ederken bazı değişkenlerin aslında integer olması gerektiğini ama değerlerin çok büyük olacağı varsayımıyla kesirli kısmın ihmal edilebileceğini görürdük. Birçok durumda bu kabul edilemez: karar doğası gereği <b>ayrıktır</b> (yes/no, do/do not; sonlu bir alternatif kümesinden bir veya birkaçını seç). Değişkenlerin integer olmak zorunda olduğu problemlere <b>integer program (IP)</b>, bunları çözme konusuna <b>integer programming</b> denir.</p>

<h3>IP türleri</h3>
<table>
  <tr><th>Tür</th><th>Tanım</th></tr>
  <tr><td><b>Pure IP</b></td><td><b>Tüm</b> değişkenler integer olmak zorunda.</td></tr>
  <tr><td><b>Mixed IP</b></td><td>Bazı değişkenler integer, bazıları continuous (sürekli).</td></tr>
  <tr><td><b>Pure (mixed) 0-1 / binary IP</b></td><td>Integer değişkenler yalnızca 0 veya 1 değeri alır (x<sub>i</sub> = 0 or 1). Şaşırtıcı sıklıkta karşımıza çıkar: yes/no kararları.</td></tr>
</table>

<h3>LP Relaxation (LR)</h3>
<p>Her IP için <b>aynı amaç fonksiyonu ve aynı kısıtlar</b> alınıp "integer olsun" koşulları uygun <i>continuous</i> kısıtlarla değiştirilerek bir LP elde edilir:</p>
<table>
  <tr><th>IP'deki koşul</th><th>LR'deki karşılığı</th></tr>
  <tr><td>x<sub>i</sub> ≥ 0 <b>and integer</b></td><td>x<sub>i</sub> ≥ 0</td></tr>
  <tr><td>x<sub>i</sub> = 0 <b>or</b> 1</td><td>x<sub>i</sub> ≥ 0 <b>ve</b> x<sub>i</sub> ≤ 1</td></tr>
</table>
<p>Tüm integer / 0-1 koşullarını atarak elde edilen bu LP'ye IP'nin <b>LP Relaxation</b>'ı (LR) denir. LR, simplex ile kolayca çözülebilir; ancak çözümü kesirli çıkabilir.</p>

<div class="box"><b>Neden yuvarlamak yetmez?</b> Capital budgeting örneğinde (1.1) LR çözümü x<sub>1</sub> = x<sub>2</sub> = 1, x<sub>3</sub> = 0.5 (değer 22K) kesirlidir; x<sub>3</sub>'ü aşağı yuvarlamak 19K verir, oysa gerçek IP optimumu 21K'dır (x<sub>1</sub> = 0, x<sub>2</sub> = x<sub>3</sub> = x<sub>4</sub> = 1). Yuvarlama optimal çözümü garanti etmez (ve başka örneklerde feasible bile olmayabilir).</div>

<h3>Bu bölümün yol haritası (Ch.1)</h3>
<ul>
  <li>1.1 Budgeting (binary seç/seçme, mantıksal kısıtlar) · 1.2 Knapsack · 1.3 Fixed charge (x ≤ M y)</li>
  <li>1.4 Either-or · 1.5 If-then (M ve binary y ile) · 1.6 Set covering / packing / partitioning</li>
  <li>1.7 TSP (assignment + MTZ subtour kısıtları) · 1.8 Piecewise linear fonksiyonlar</li>
</ul>

<div class="warnbox"><b>Sınav tuzakları (1.0):</b>
<ul>
  <li>Binary değişkenin LR'sinde yalnızca x ≥ 0 yazmak yetmez; <b>x ≤ 1</b> de gerekir.</li>
  <li>"x ≥ 0 and integer" kalırsa bu hâlâ bir IP'dir, relaxation değildir. LR'de <b>kısıtlar aynen kalır</b>, yalnızca integrality kalkar.</li>
  <li>"Mixed" demek için en az bir integer ve en az bir continuous değişken gerekir; hepsi integer ise (binary dahil) <b>pure</b>'dur.</li>
  <li>LR çözümünü yuvarlamak optimal (hatta bazen feasible) bir IP çözümü vermeyebilir.</li>
</ul></div>
`;

  OR.content.concepts['1.0'] = [
    {
      q: `Aşağıdaki modelin türü nedir?
<div class="model">max z = 3x<sub>1</sub> + 2x<sub>2</sub> + 4x<sub>3</sub>
s.t. x<sub>1</sub> + x<sub>2</sub> + x<sub>3</sub> ≤ 10
     x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer;  x<sub>3</sub> ≥ 0</div>`,
      options: [`Pure IP`, `Mixed IP`, `Pure binary (0-1) IP`, `LP`],
      answer: 1,
      explain: `Bazı değişkenler integer (x<sub>1</sub>, x<sub>2</sub>), bir tanesi continuous (x<sub>3</sub> ≥ 0, integer koşulu yok) olduğu için <b>mixed IP</b>'dir. Pure IP olması için tüm değişkenlerin integer olması gerekirdi; binary olması için integer değişkenlerin 0/1 ile sınırlı olması gerekirdi.`,
    },
    {
      q: `"x<sub>i</sub> = 0 or 1" koşulunun LP relaxation'daki doğru karşılığı hangisidir?`,
      options: [`x<sub>i</sub> ≥ 0 ve x<sub>i</sub> ≤ 1`, `Yalnızca x<sub>i</sub> ≥ 0`, `x<sub>i</sub> ≥ 0 and integer`, `x<sub>i</sub> = 0.5`],
      answer: 0,
      explain: `Notlara göre "x<sub>i</sub> = 0 or 1" yerine <b>x<sub>i</sub> ≥ 0 ve x<sub>i</sub> ≤ 1</b> yazılır. Sadece x<sub>i</sub> ≥ 0 üst sınırı kaybettirir; "≥ 0 and integer" hâlâ bir IP koşuludur.`,
    },
    {
      q: `"x<sub>i</sub> ≥ 0 and integer" koşulunun LP relaxation'daki karşılığı nedir?`,
      options: [`x<sub>i</sub> ≥ 0 ve x<sub>i</sub> ≤ 1`, `x<sub>i</sub> ≥ 0`, `x<sub>i</sub> ≥ 0 and integer (aynı kalır)`, `x<sub>i</sub> = 0`],
      answer: 1,
      explain: `Pure integer değişkenin integer koşulu kaldırılır, geriye <b>x<sub>i</sub> ≥ 0</b> kalır. Üst sınır 1 yalnızca binary değişkenler için eklenir; bu değişken binary değildir.`,
    },
    {
      q: `Warehouse problemindeki x<sub>ij</sub> ≥ 0 (continuous, WH-i'den müşteri j'ye taşınan miktar) ve y<sub>i</sub> ∈ {0, 1} (WH-i açılsın mı) değişkenlerini içeren model hangi türdür?`,
      options: [`Pure IP`, `Mixed (binary) IP`, `Pure binary IP`, `LP`],
      answer: 1,
      explain: `x<sub>ij</sub> continuous, y<sub>i</sub> binary olduğundan hem continuous hem integer (binary) değişken vardır: <b>mixed (binary) IP</b>. Pure binary olması için tüm değişkenlerin 0/1 olması gerekirdi.`,
    },
    {
      q: `Bir IP'nin LP relaxation'ı (LR) hakkında hangileri doğrudur?`,
      options: [
        `Aynı amaç fonksiyonu ve aynı kısıtlar kullanılır; yalnızca integer/0-1 koşulları continuous kısıtlarla değiştirilir.`,
        `Maximization problemi için LR'nin optimal değeri, IP'nin optimal değerinden küçük olamaz (upper bound).`,
        `LR'nin optimal çözümünü en yakın tam sayılara yuvarlamak her zaman optimal IP çözümünü verir.`,
        `LR bir LP olduğundan simplex ile çözülebilir.`,
      ],
      answer: [0, 1, 3],
      explain: `LR daha az kısıtlı bir LP'dir: simplex ile çözülür ve max problemde z<sub>LR</sub> ≥ z<sub>IP</sub> (upper bound) olur. Yuvarlama ise optimaliteyi (hatta feasibility'yi) garanti etmez; capital budgeting örneğinde yuvarlama 19K verirken optimum 21K'dır.`,
    },
    {
      q: `Aşağıdaki durumlardan hangilerinde değişkenleri LP gibi sürekli alıp kesirleri ihmal etmek <b>kabul edilemez</b>, yani IP gerekir?`,
      options: [
        `Bir fabrikada ayda yaklaşık 500 000 adet üretilecek ürünün miktarı belirlenirken (küçük bir kesir ihmal edilebilir).`,
        `Bir tesisin açılıp açılmayacağına yes/no olarak karar verilirken.`,
        `Bir havayolu şirketinin 2 veya 3 adet uçak alıp almayacağına karar verilirken (uçak sayısı küçük).`,
        `Bir rafinerinin günlük ham petrol (varil) miktarını belirlerken değerler çok büyük.`,
      ],
      answer: [1, 2],
      explain: `Notlara göre kesirleri ihmal etmek, değişkenlerin <b>çok büyük</b> olması durumunda kabul edilebilir. Yes/no kararları ve küçük sayıdaki ayrık nesneler (tesis, uçak) için kesirli çözüm anlamsızdır; bu yüzden IP (çoğu zaman binary değişken) gerekir.`,
    },
    {
      q: `Aşağıdaki ifadelerden hangisi <b>pure 0-1 (binary) IP</b>'yi doğru tanımlar?`,
      options: [
        `Tüm değişkenlerin 0 veya 1 değeri almak zorunda olduğu IP.`,
        `En az bir değişkenin 0 veya 1 olduğu, diğerlerinin continuous olduğu IP.`,
        `Tüm değişkenlerin ≥ 0 integer olduğu ama üst sınırı olmayan IP.`,
        `Yalnızca iki değişkeni olan IP.`,
      ],
      answer: 0,
      explain: `Pure binary IP'de integer değişkenlerin hepsi 0/1'dir ve continuous değişken yoktur. İkinci seçenek <b>mixed binary</b> IP'yi, üçüncüsü ise genel bir <b>pure IP</b>'yi anlatır.`,
    },
    {
      q: `Bir mixed IP'de x<sub>1</sub> ≥ 0 (continuous), x<sub>2</sub> ≥ 0 and integer ve y binary'dir. LR'de koşullar nasıl olur?`,
      options: [
        `x<sub>1</sub>, x<sub>2</sub>, y ≥ 0 ve ayrıca y ≤ 1; integer koşulları kalkar`,
        `x<sub>1</sub>, x<sub>2</sub>, y ≥ 0; (y ≤ 1 eklenmez)`,
        `x<sub>2</sub> integer kalır, y için 0 ≤ y ≤ 1`,
        `y = 0 ve y = 1 için iki ayrı LP yazılır`,
      ],
      answer: 0,
      explain: `LR'de <b>tüm</b> integer koşulları kalkar: x<sub>2</sub> ≥ 0, y için 0 ≤ y ≤ 1. Continuous x<sub>1</sub> zaten sürekli olduğu için değişmez. x<sub>2</sub>'nin integer kalması LR'yi hâlâ bir mixed IP yapar.`,
    },
    {
      q: `Notlardaki tanımlara göre aşağıdakilerden hangisi doğrudur?`,
      options: [
        `Tüm değişkenlerin integer olması gereken probleme pure IP, yalnızca bir kısmının integer olması gereken probleme mixed IP denir.`,
        `Bir IP'de en az bir değişken binary ise problem her zaman mixed IP'dir.`,
        `LP relaxation, IP'nin kısıtlarından integrality'yi değil asıl kısıtlardan birini çıkarır.`,
        `Integer programming yalnızca 0-1 değişkenli problemleri kapsar.`,
      ],
      answer: 0,
      explain: `Pure/mixed ayrımı integer olması gereken değişkenlerin oranına bağlıdır: hepsi → pure, bir kısmı → mixed. Binary değişken içermek tek başına "mixed" yapmaz (tüm değişkenler binary ise pure binary IP'dir). LR kısıtları atmaz, yalnızca integrality koşullarını atar; binary IP ise IP'nin özel bir türüdür.`,
    },
  ];

  /* ====================================================================== 1.1 */
  OR.content.summaries['1.1'] = `
<h2>1.1 Budgeting Problems</h2>
<p>Her yatırım/proje için bir <b>0-1 değişken</b> tanımlanır: x<sub>j</sub> = 1 ise yatırım j yapılır, 0 ise yapılmaz.</p>

<h3>Example 1 — Capital Budgeting (Winston 9.2, modified)</h3>
<p>Stockco 4 yatırımı değerlendiriyor. NPV'ler ($8K, $11K, $6K, $4K); bugünkü nakit gereksinimleri ($5K, $7K, $4K, $3K); eldeki para <b>$14K</b>.</p>
<div class="model">max z = 8x<sub>1</sub> + 11x<sub>2</sub> + 6x<sub>3</sub> + 4x<sub>4</sub>
s.t. 5x<sub>1</sub> + 7x<sub>2</sub> + 4x<sub>3</sub> + 3x<sub>4</sub> ≤ 14
     x<sub>j</sub> = 0 or 1   (j = 1,2,3,4)</div>
<ul>
  <li>"Bang for buck" oranları c/a: 8/5 = 1.6, 11/7 ≈ 1.57, 6/4 = 1.5, 4/3 ≈ 1.33 → yatırım 1 en iyi görünür.</li>
  <li><b>LR optimumu:</b> x<sub>1</sub> = x<sub>2</sub> = 1, x<sub>3</sub> = 0.5, x<sub>4</sub> = 0 → <b>22K</b> (kesirli).</li>
  <li>x<sub>3</sub>'ü 0'a yuvarlamak: (1,1,0,0) → <b>19K</b>.</li>
  <li><b>IP optimumu:</b> x<sub>1</sub> = 0, x<sub>2</sub> = x<sub>3</sub> = x<sub>4</sub> = 1 → <b>21K</b> (7+4+3 = 14).</li>
</ul>
<div class="box">Sonuç: <b>yuvarlama optimal çözümü vermez</b>. Ayrıca max problemde z<sub>LR</sub> = 22 ≥ z<sub>IP</sub> = 21 (LR = upper bound).</div>

<h3>Example 2 — Multiperiod Capital Budgeting</h3>
<p>4 proje, her biri 3 yıl sürüyor; her yıl için ayrı sermaye kısıtı vardır (yıl 1: 3.1, yıl 2: 2.5, yıl 3: 0.4 mevcut). Getiriler 0.2, 0.3, 0.5, 0.1.</p>
<div class="model">max 0.2x<sub>1</sub> + 0.3x<sub>2</sub> + 0.5x<sub>3</sub> + 0.1x<sub>4</sub>
s.t. 0.5x<sub>1</sub> + 1x<sub>2</sub> + 1.5x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 3.1   (yıl 1)
     0.3x<sub>1</sub> + 0.8x<sub>2</sub> + 1.5x<sub>3</sub> + 0.4x<sub>4</sub> ≤ 2.5   (yıl 2)
     0.2x<sub>1</sub> + 0.2x<sub>2</sub> + 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4   (yıl 3)
     x<sub>j</sub> = 0 or 1   (j = 1,…,4)</div>
<p>Her yıl için <b>bir kısıt</b> vardır (kaynak sayısı kadar). (Notlardaki tabloda proje 2'nin yıl-2 gereksinimi 0.5 yazılmış, fakat model satırında 0.8 kullanılmıştır; yukarıda modeldeki değer alınmıştır.)</p>

<h3>Example 3 — Mantıksal kısıtlar (0-1 değişkenlerle)</h3>
<table>
  <tr><th>Koşul</th><th>Kısıt</th><th>Mantık</th></tr>
  <tr><td>En fazla iki yatırım</td><td>x<sub>1</sub>+x<sub>2</sub>+x<sub>3</sub>+x<sub>4</sub> ≤ 2</td><td>—</td></tr>
  <tr><td>Üç veya dört yatırım (en az 3)</td><td>x<sub>1</sub>+x<sub>2</sub>+x<sub>3</sub>+x<sub>4</sub> ≥ 3</td><td>—</td></tr>
  <tr><td>2 yapılırsa 4 de yapılmalı</td><td>x<sub>2</sub> ≤ x<sub>4</sub> (x<sub>2</sub> − x<sub>4</sub> ≤ 0)</td><td>x<sub>2</sub>=1 ⇒ x<sub>4</sub>=1; x<sub>2</sub>=0 ise x<sub>4</sub> serbest</td></tr>
  <tr><td>1 yapılırsa 3 yapılamaz</td><td>x<sub>1</sub> + x<sub>3</sub> ≤ 1</td><td>x<sub>1</sub>=1 ⇒ x<sub>3</sub>=0; x<sub>1</sub>=0 ise x<sub>3</sub> serbest</td></tr>
  <tr><td>Ya 1 ya 2 (tam biri, ikisi birden değil)</td><td>x<sub>1</sub> + x<sub>2</sub> = 1</td><td>x<sub>1</sub>=1 ⇒ x<sub>2</sub>=0; x<sub>1</sub>=0 ⇒ x<sub>2</sub>=1</td></tr>
</table>
<p>Aynı mantıkla (notlarda yok, kalıp aynı): <b>"1 ise hem 2 hem 3"</b> → x<sub>1</sub> ≤ x<sub>2</sub> ve x<sub>1</sub> ≤ x<sub>3</sub>; <b>"1 ise 2 veya 3'ten en az biri"</b> → x<sub>1</sub> ≤ x<sub>2</sub> + x<sub>3</sub>; <b>"ya ikisi birden ya hiçbiri"</b> → x<sub>1</sub> = x<sub>2</sub>; <b>"tam k tane"</b> → Σ x<sub>j</sub> = k.</p>

<div class="warnbox"><b>Sınav tuzakları (1.1):</b>
<ul>
  <li><b>Yön hatası:</b> "2 ise 4" için x<sub>2</sub> ≤ x<sub>4</sub> doğrudur; x<sub>4</sub> ≤ x<sub>2</sub> tersini söyler. x<sub>4</sub> = 1 iken x<sub>2</sub> = 0 olabilir.</li>
  <li>"x<sub>2</sub> + x<sub>4</sub> = 2" gibi yazmak "2 ise 4" demek değil, <b>ikisini de zorunlu</b> kılmaktır.</li>
  <li>"1 ve 2'den biri" ≠ "tam biri": ≥ 1 (en az biri) ile = 1 (tam biri) farklıdır; ≤ 1 ise "en fazla biri"dir.</li>
  <li>LR çözümünü yuvarlamak optimal değildir (22K → 19K, oysa optimum 21K).</li>
  <li>Multiperiod problem tek kısıtlı olmadığı için <b>knapsack değildir</b> (her yıl ayrı kısıt).</li>
</ul></div>
`;

  OR.content.concepts['1.1'] = [
    {
      q: `Capital budgeting örneğinde (max 8x<sub>1</sub>+11x<sub>2</sub>+6x<sub>3</sub>+4x<sub>4</sub>, 5x<sub>1</sub>+7x<sub>2</sub>+4x<sub>3</sub>+3x<sub>4</sub> ≤ 14, x<sub>j</sub> binary) aşağıdakilerden hangisi doğrudur?`,
      options: [
        `LR optimumu 22K (x<sub>1</sub>=x<sub>2</sub>=1, x<sub>3</sub>=0.5); x<sub>3</sub>'ü aşağı yuvarlayınca 19K; IP optimumu 21K (x<sub>2</sub>=x<sub>3</sub>=x<sub>4</sub>=1).`,
        `LR çözümünü yuvarlamak optimal IP çözümünü verir.`,
        `IP optimumu 22K'dır.`,
        `En yüksek c/a oranına sahip yatırım (x<sub>1</sub>) optimal çözümde her zaman yer alır.`,
      ],
      answer: 0,
      explain: `LR: önce oranı en iyi olanlar alınır, x<sub>1</sub> (5) + x<sub>2</sub> (7) = 12, kalan 2 birim ile x<sub>3</sub> = 2/4 = 0.5 → 8+11+3 = 22. Yuvarlama (1,1,0,0) = 19. Enumeration ile en iyisi (0,1,1,1): 7+4+3 = 14 ≤ 14, değer 11+6+4 = 21. En iyi oranlı x<sub>1</sub> optimumda yoktur, yani "bang for buck" sezgisi de yanıltır.`,
    },
    {
      q: `"Yatırım 2 yapılırsa yatırım 4 de yapılmalıdır" koşulu hangi kısıtla modellenir?`,
      options: [`x<sub>2</sub> ≤ x<sub>4</sub>`, `x<sub>4</sub> ≤ x<sub>2</sub>`, `x<sub>2</sub> + x<sub>4</sub> ≤ 1`, `x<sub>2</sub> + x<sub>4</sub> = 2`],
      answer: 0,
      explain: `x<sub>2</sub> = 1 ise x<sub>4</sub> ≥ 1, yani x<sub>4</sub> = 1 olmak zorundadır; x<sub>2</sub> = 0 ise x<sub>4</sub> serbesttir. x<sub>4</sub> ≤ x<sub>2</sub> tersini (4 ise 2) söyler. x<sub>2</sub>+x<sub>4</sub> ≤ 1 ikisinin birlikte seçilmesini yasaklar. x<sub>2</sub>+x<sub>4</sub> = 2 ikisini de zorunlu kılar.`,
    },
    {
      q: `x<sub>2</sub> ≤ x<sub>4</sub> kısıtı altında hangileri <b>mümkündür</b> (feasible)?`,
      options: [
        `x<sub>2</sub> = 0, x<sub>4</sub> = 1`,
        `x<sub>2</sub> = 1, x<sub>4</sub> = 0`,
        `x<sub>2</sub> = 0, x<sub>4</sub> = 0`,
        `x<sub>4</sub> = 1 olması x<sub>2</sub> = 1'i zorunlu kılar`,
      ],
      answer: [0, 2],
      explain: `x<sub>2</sub> ≤ x<sub>4</sub> yalnızca (x<sub>2</sub>, x<sub>4</sub>) = (1, 0) kombinasyonunu yasaklar. (0,1) ve (0,0) serbesttir. "4 ise 2" ters yöndür ve bu kısıtın söylediği şey değildir.`,
    },
    {
      q: `"Yatırım 1 yapılırsa yatırım 3 yapılamaz" koşulu için doğru kısıt hangisidir?`,
      options: [`x<sub>1</sub> + x<sub>3</sub> ≤ 1`, `x<sub>1</sub> + x<sub>3</sub> = 1`, `x<sub>1</sub> + x<sub>3</sub> ≥ 1`, `x<sub>1</sub> ≤ x<sub>3</sub>`],
      answer: 0,
      explain: `x<sub>1</sub> = 1 ise x<sub>3</sub> = 0 zorunludur; x<sub>1</sub> = 0 ise x<sub>3</sub> serbesttir (0 ya da 1). Bunu x<sub>1</sub> + x<sub>3</sub> ≤ 1 sağlar. "= 1" ise ayrıca (0,0)'ı yasaklar, yani "ya biri ya diğeri" der; "≥ 1" (1,1)'e izin verir; x<sub>1</sub> ≤ x<sub>3</sub> "1 ise 3" anlamına gelir.`,
    },
    {
      q: `"Yatırım 1 ve yatırım 2'den <b>en az biri</b> yapılmalıdır (ikisi birden de yapılabilir)" koşulu nasıl yazılır?`,
      options: [`x<sub>1</sub> + x<sub>2</sub> ≥ 1`, `x<sub>1</sub> + x<sub>2</sub> = 1`, `x<sub>1</sub> + x<sub>2</sub> ≤ 1`, `x<sub>1</sub> = x<sub>2</sub>`],
      answer: 0,
      explain: `"En az biri" → ≥ 1 (set covering tipi). Notlardaki "either investment 1 or investment 2 must be made (only one of them, not both)" ise <b>= 1</b> ile modellenir. ≤ 1 en fazla biri demektir (hiçbiri de olabilir). x<sub>1</sub> = x<sub>2</sub> "ya ikisi birden ya hiçbiri" demektir.`,
    },
    {
      q: `"Yatırım 3 yapılacaksa, yatırım 1 ve 2'den <b>en az biri</b> de yapılmalıdır" koşulu için doğru kısıt hangisidir?`,
      options: [
        `x<sub>3</sub> ≤ x<sub>1</sub> + x<sub>2</sub>`,
        `x<sub>3</sub> ≤ x<sub>1</sub> + x<sub>2</sub> − 1`,
        `x<sub>3</sub> ≥ x<sub>1</sub> + x<sub>2</sub>`,
        `2x<sub>3</sub> ≤ x<sub>1</sub> + x<sub>2</sub>`,
      ],
      answer: 0,
      explain: `x<sub>3</sub> = 1 ise x<sub>1</sub> + x<sub>2</sub> ≥ 1 gerekir (en az biri). x<sub>3</sub> = 0 iken kısıt boştur. x<sub>3</sub> ≤ x<sub>1</sub>+x<sub>2</sub>−1 ise x<sub>3</sub>=1 iken ikisini de zorunlu kılar. 2x<sub>3</sub> ≤ x<sub>1</sub>+x<sub>2</sub> de her ikisini birden gerektirir. x<sub>3</sub> ≥ x<sub>1</sub>+x<sub>2</sub> ise ters yönde bir ilişkidir.`,
    },
    {
      q: `"Yatırım 1 yapılırsa <b>hem</b> yatırım 2 <b>hem de</b> yatırım 3 yapılmalıdır" koşulunu doğru modelleyenler hangileridir?`,
      options: [
        `x<sub>1</sub> ≤ x<sub>2</sub> ve x<sub>1</sub> ≤ x<sub>3</sub> (iki kısıt birlikte)`,
        `2x<sub>1</sub> ≤ x<sub>2</sub> + x<sub>3</sub>`,
        `x<sub>1</sub> ≤ x<sub>2</sub> + x<sub>3</sub>`,
        `x<sub>1</sub> + x<sub>2</sub> + x<sub>3</sub> ≤ 1`,
      ],
      answer: [0, 1],
      explain: `x<sub>1</sub> = 1 iken ikisi de 1 olmalıdır: x<sub>1</sub> ≤ x<sub>2</sub>, x<sub>1</sub> ≤ x<sub>3</sub> bunu sağlar; 2x<sub>1</sub> ≤ x<sub>2</sub>+x<sub>3</sub> de eşdeğerdir (x<sub>1</sub>=1 ⇒ x<sub>2</sub>+x<sub>3</sub> ≥ 2). x<sub>1</sub> ≤ x<sub>2</sub>+x<sub>3</sub> yalnızca "en az biri" der. Son seçenek ise en fazla birini seçtirir.`,
    },
    {
      q: `Multiperiod capital budgeting örneğinde (getiriler 0.2, 0.3, 0.5, 0.1; yıllık sermaye 3.1 / 2.5 / 0.4; yıl-1 gereksinimleri 0.5, 1, 1.5, 0.1; yıl-2: 0.3, 0.8, 1.5, 0.4; yıl-3: 0.2, 0.2, 0.3, 0.1) aşağıdaki proje kümelerinden hangisi <b>feasible ve en yüksek toplam getiriyi</b> sağlar?`,
      options: [
        `{1, 2, 3}: toplam getiri 1.0`,
        `{3, 4}: toplam getiri 0.6`,
        `{1, 2}: toplam getiri 0.5`,
        `{1, 3}: toplam getiri 0.7`,
      ],
      answer: 1,
      explain: `{1,2,3} yıl 2'de 0.3+0.8+1.5 = 2.6 > 2.5 olduğu için infeasible'dır; {1,3} yıl 3'te 0.2+0.3 = 0.5 > 0.4 olduğu için infeasible'dır. {1,2} feasible'dır (yıl 3: 0.4) ama getiri yalnızca 0.5. {3,4}: yıl 1 1.6 ≤ 3.1, yıl 2 1.9 ≤ 2.5, yıl 3 0.4 ≤ 0.4 → feasible ve getiri 0.6. Tüm alt kümeler denendiğinde en iyisi {3,4}'tür. Dar olan kısıt yıl 3'tür.`,
    },
    {
      q: `Multiperiod örneğinde yıl 3 kısıtı (mevcut sermaye 0.4) hangisidir?`,
      options: [
        `0.2x<sub>1</sub> + 0.2x<sub>2</sub> + 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4`,
        `0.2x<sub>1</sub> + 0.3x<sub>2</sub> + 0.5x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4`,
        `0.5x<sub>1</sub> + 1x<sub>2</sub> + 1.5x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4`,
        `0.2x<sub>1</sub> + 0.2x<sub>2</sub> + 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≥ 0.4`,
      ],
      answer: 0,
      explain: `Her yıl için o yılın sermaye gereksinimleri ≤ mevcut sermaye şeklinde yazılır. İkinci seçenek amaç fonksiyonundaki <i>getirileri</i>, üçüncüsü ise <i>yıl 1</i> gereksinimlerini kullanır. Sermaye bir <b>üst sınırdır</b> (≤), ≥ değil.`,
    },
    {
      q: `Notlarda "en fazla iki yatırım yapılabilir" (Σx<sub>j</sub> ≤ 2) ve "üç veya dört yatırım yapılacaktır" (Σx<sub>j</sub> ≥ 3) iki ayrı mantıksal koşul örneği olarak verilir. İkisini <b>aynı modele birlikte</b> eklersek ne olur?`,
      options: [
        `Model infeasible olur; Σx<sub>j</sub> hem ≤ 2 hem ≥ 3 olamaz.`,
        `Σx<sub>j</sub> = 2.5 gibi kesirli bir çözüm elde edilir.`,
        `Σx<sub>j</sub> = 3 olur.`,
        `İkinci kısıt birinciyi geçersiz kılar.`,
      ],
      answer: 0,
      explain: `Notlar bu iki mantıksal kısıtı <i>ayrı alternatifler</i> olarak verir ("any choice of three or four investments will have Σ ≥ 3"). Birlikte konulduğunda Σx<sub>j</sub> ≤ 2 ve Σx<sub>j</sub> ≥ 3 çelişir. Bu yüzden hangi mantıksal koşulun modele konacağına dikkat edilmelidir. Binary değişkenlerde toplam zaten integer olduğundan kesirli çözüm de söz konusu değildir.`,
    },
  ];

  /* ====================================================================== 1.2 */
  OR.content.summaries['1.2'] = `
<h2>1.2 Knapsack Problems</h2>
<p>Yalnızca <b>tek bir kısıtı</b> olan ve kısıt ile amaç fonksiyonu katsayılarının hepsi <b>negatif olmayan</b> IP'ye <b>knapsack problem</b> denir. Hikâye: bir sırt çantası ve her biri bir boyut (ağırlık) ve değere sahip eşyalar var; amaç çantadaki toplam değeri maksimize etmek.</p>
<div class="model">max z = c<sub>1</sub>x<sub>1</sub> + c<sub>2</sub>x<sub>2</sub> + ⋯ + c<sub>n</sub>x<sub>n</sub>
s.t. a<sub>1</sub>x<sub>1</sub> + a<sub>2</sub>x<sub>2</sub> + ⋯ + a<sub>n</sub>x<sub>n</sub> ≤ b
     x<sub>i</sub> = 0 or 1   (i = 1, 2, …, n)</div>
<p>c<sub>i</sub> = eşya i'nin <b>değeri</b>, a<sub>i</sub> = eşya i'nin <b>ağırlığı</b>, b = toplam <b>kapasite</b>.</p>
<p>Notlardaki örnek (1.1'deki capital budgeting ile aynı model):</p>
<div class="model">max 8x<sub>1</sub> + 11x<sub>2</sub> + 6x<sub>3</sub> + 4x<sub>4</sub>
s.t. 5x<sub>1</sub> + 7x<sub>2</sub> + 4x<sub>3</sub> + 3x<sub>4</sub> ≤ 14
     x<sub>j</sub> = 0 or 1   (j = 1,…,4)</div>
<p>Knapsack problemleri (genellikle) <b>çözmesi kolay</b> problemlerdir (2.5.3'te B&amp;B ile çözülür).</p>

<h3>LR ve oran (ratio) sezgisi</h3>
<ul>
  <li>LR'de x<sub>i</sub> = 0 or 1 yerine <b>0 ≤ x<sub>i</sub> ≤ 1</b> yazılır.</li>
  <li>LR çözümü: eşyalar <b>c<sub>i</sub>/a<sub>i</sub></b> oranına göre büyükten küçüğe sıralanıp kapasite dolana kadar alınır; sığmayan son eşya <b>kesirli</b> alınır. Dolayısıyla LR çözümünde en fazla <b>bir</b> kesirli değişken vardır.</li>
  <li>Örnek: oranlar 1.6 &gt; 1.57 &gt; 1.5 &gt; 1.33 → x<sub>1</sub> = x<sub>2</sub> = 1 (12 birim), kalan 2 birim ile x<sub>3</sub> = 2/4 = 0.5 → z<sub>LR</sub> = 22.</li>
  <li>Integer optimum: 21 (x<sub>2</sub> = x<sub>3</sub> = x<sub>4</sub> = 1). z<sub>LR</sub> ≥ z<sub>IP</sub> (max için upper bound).</li>
</ul>

<h3>Klasik küçük örnek</h3>
<div class="model">max 60x<sub>1</sub> + 100x<sub>2</sub> + 120x<sub>3</sub>
s.t. 10x<sub>1</sub> + 20x<sub>2</sub> + 30x<sub>3</sub> ≤ 50,  x<sub>j</sub> binary
Oranlar: 6, 5, 4 → LR: x<sub>1</sub>=x<sub>2</sub>=1, x<sub>3</sub>=2/3 → z<sub>LR</sub> = 240
IP optimumu: x<sub>2</sub>=x<sub>3</sub>=1 → z = 220   (oran-greedy tam sayı çözümü: x<sub>1</sub>=x<sub>2</sub>=1 → 160)</div>

<div class="warnbox"><b>Sınav tuzakları (1.2):</b>
<ul>
  <li>Knapsack = <b>tek kısıt</b>. Ek kısıt (örn. x<sub>2</sub> ≤ x<sub>4</sub>, ikinci bir kaynak) eklenirse artık knapsack değildir. Multiperiod budgeting de knapsack değildir.</li>
  <li>En iyi oranlı eşyanın optimal çözümde olması <b>gerekmez</b> (örnekte x<sub>1</sub> optimumda yok).</li>
  <li>LR değeri IP değerinden büyük çıkar (max). LR çözümünü yuvarlamak optimal olmayabilir (19 vs 21).</li>
  <li>Oran sırasıyla "sığdığı kadar" alıp bırakmak (greedy) optimal olmayabilir.</li>
  <li>Eğer kapasite toplam ağırlığa (Σa<sub>i</sub> = 19) eşit/fazla ise tüm eşyalar alınır (değerler ≥ 0).</li>
</ul></div>
`;

  OR.content.concepts['1.2'] = [
    {
      q: `Aşağıdaki problemlerden hangileri notlardaki anlamda bir <b>knapsack problem</b>'dir?`,
      options: [
        `max 8x<sub>1</sub>+11x<sub>2</sub>+6x<sub>3</sub>+4x<sub>4</sub> s.t. 5x<sub>1</sub>+7x<sub>2</sub>+4x<sub>3</sub>+3x<sub>4</sub> ≤ 14, x<sub>j</sub> binary`,
        `Multiperiod capital budgeting (3 yıllık sermaye kısıtı, 4 binary proje)`,
        `max 60x<sub>1</sub>+100x<sub>2</sub>+120x<sub>3</sub> s.t. 10x<sub>1</sub>+20x<sub>2</sub>+30x<sub>3</sub> ≤ 50, x<sub>j</sub> binary`,
        `Yukarıdaki ilk problem + "x<sub>1</sub> + x<sub>2</sub> ≤ 1" kısıtı`,
      ],
      answer: [0, 2],
      explain: `Knapsack: <b>yalnızca bir kısıt</b> ve tüm katsayılar negatif değil. 1. ve 3. problem bu tanıma uyar. Multiperiod modelde 3 kısıt, son seçenekte 2 kısıt vardır (x<sub>1</sub>+x<sub>2</sub> ≤ 1 ikinci bir kısıt olur), dolayısıyla ikisi de knapsack değildir.`,
    },
    {
      q: `Knapsack gösteriminde max Σ c<sub>i</sub>x<sub>i</sub> s.t. Σ a<sub>i</sub>x<sub>i</sub> ≤ b, x<sub>i</sub> = 0 or 1 için sembollerin anlamları nelerdir?`,
      options: [
        `c<sub>i</sub> = eşya i'nin değeri, a<sub>i</sub> = eşya i'nin ağırlığı, b = toplam kapasite`,
        `c<sub>i</sub> = eşya i'nin ağırlığı, a<sub>i</sub> = değeri, b = toplam değer`,
        `c<sub>i</sub> = kapasite, a<sub>i</sub> = değer, b = ağırlık`,
        `c<sub>i</sub> = x<sub>i</sub>'in üst sınırı, a<sub>i</sub> = alt sınırı, b = eşya sayısı`,
      ],
      answer: 0,
      explain: `Notlara göre c<sub>i</sub> değer (amaç katsayısı), a<sub>i</sub> ağırlık (kısıt katsayısı) ve b toplam ağırlık kapasitesidir.`,
    },
    {
      q: `Örnek knapsack (değerler 8, 11, 6, 4; ağırlıklar 5, 7, 4, 3; kapasite 14) için LP relaxation çözümü nedir?`,
      options: [
        `x<sub>1</sub> = x<sub>2</sub> = 1, x<sub>3</sub> = 0.5, x<sub>4</sub> = 0; z = 22`,
        `x<sub>2</sub> = x<sub>3</sub> = x<sub>4</sub> = 1, x<sub>1</sub> = 0; z = 21`,
        `x<sub>1</sub> = x<sub>2</sub> = 1, x<sub>3</sub> = x<sub>4</sub> = 0; z = 19`,
        `x<sub>1</sub> = 1, x<sub>2</sub> = 1, x<sub>3</sub> = 0, x<sub>4</sub> = 0.67; z = 21.67`,
      ],
      answer: 0,
      explain: `Oranlar c/a: 1.6, 1.57, 1.5, 1.33. x<sub>1</sub> ve x<sub>2</sub> tamamen alınır (5+7 = 12), kalan kapasite 2 → x<sub>3</sub> = 2/4 = 0.5. z = 8+11+3 = 22. İkinci seçenek IP optimumudur, üçüncüsü yuvarlanmış çözümdür. Son seçenekte x<sub>3</sub> (daha iyi oran) atlanıp x<sub>4</sub> kesirli alınıyor; bu LR'nin optimumu değildir (21.67 &lt; 22).`,
    },
    {
      q: `max 60x<sub>1</sub>+100x<sub>2</sub>+120x<sub>3</sub> s.t. 10x<sub>1</sub>+20x<sub>2</sub>+30x<sub>3</sub> ≤ 50, x<sub>j</sub> binary problemi için (z<sub>LR</sub>, z<sub>IP</sub>) çifti nedir?`,
      options: [`(220, 240)`, `(240, 220)`, `(240, 240)`, `(220, 220)`],
      answer: 1,
      explain: `LR: oranlar 6, 5, 4. x<sub>1</sub> = x<sub>2</sub> = 1 (30 birim), kalan 20 birim ile x<sub>3</sub> = 20/30 = 2/3 → 60+100+80 = <b>240</b>. IP: x<sub>2</sub> = x<sub>3</sub> = 1 (20+30 = 50) → <b>220</b>. Max problemde z<sub>LR</sub> ≥ z<sub>IP</sub> olmalıdır, bu yüzden (220, 240) imkânsızdır.`,
    },
    {
      q: `Aynı problemde (değerler 60, 100, 120; ağırlıklar 10, 20, 30; kapasite 50), oran sırasına göre eşyaları alıp sığmayanı atlayan greedy tam sayı çözümü kaç değer üretir ve optimumla ilişkisi nedir?`,
      options: [
        `160; optimum 220 olduğundan greedy optimal değildir`,
        `220; greedy optimaldir`,
        `240; greedy optimumdan iyidir`,
        `180; optimum 240'tır`,
      ],
      answer: 0,
      explain: `Oran sırası x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>. x<sub>1</sub> (10) ve x<sub>2</sub> (20) alınır; toplam 30, kalan 20 olduğundan x<sub>3</sub> (30) sığmaz → değer 160. Optimum x<sub>2</sub>+x<sub>3</sub> = 220'dir. Yani <b>oran-greedy tam sayı çözümü optimal olmayabilir</b>; 240 yalnızca LR değeridir ve integer çözüm değildir.`,
    },
    {
      q: `Knapsack problemi ve LR'si hakkında hangileri doğrudur?`,
      options: [
        `LR'de x<sub>i</sub> = 0 or 1 koşulu 0 ≤ x<sub>i</sub> ≤ 1 olur.`,
        `LR çözümü c<sub>i</sub>/a<sub>i</sub> oranı sıralamasıyla bulunur ve en fazla bir değişken kesirli çıkar.`,
        `LR optimum çözümü her zaman integer çıkar.`,
        `LR de bir IP'dir, çünkü kapasite kısıtı aynen kalır.`,
      ],
      answer: [0, 1],
      explain: `LR'de binary koşul 0 ≤ x<sub>i</sub> ≤ 1 olur; oran sırasıyla doldurulduğunda yalnızca sığmayan son eşya kesirli alınır. LR çözümü her zaman integer çıkmaz (örnekte x<sub>3</sub> = 0.5). Kısıt aynen kalması LR'yi IP yapmaz; LR integer koşulu olmayan bir LP'dir.`,
    },
    {
      q: `Örnek knapsack'te kapasiteyi 14 yerine <b>19</b> (= 5+7+4+3) yapsaydık optimal değer ne olurdu?`,
      options: [`29`, `22`, `21`, `19`],
      answer: 0,
      explain: `Toplam ağırlık 19 ≤ 19 olduğundan tüm eşyalar alınabilir ve tüm değerler pozitif olduğu için hepsini almak optimaldir: 8+11+6+4 = <b>29</b>.`,
    },
    {
      q: `Aynı örnekte kapasite <b>12</b> olsaydı (ağırlıklar 5, 7, 4, 3; değerler 8, 11, 6, 4) LP relaxation'ın ve IP'nin optimal değeri ne olurdu?`,
      options: [`19 (LR çözümü zaten integer)`, `18`, `20 (LR) ve 19 (IP)`, `17`],
      answer: 0,
      explain: `Oran sırasıyla x<sub>1</sub> (5) ve x<sub>2</sub> (7) alınır; toplam 12 = kapasite, dolayısıyla kesirli değişken yoktur: z<sub>LR</sub> = 8+11 = 19 ve çözüm integer'dır (naturally integer), yani IP için de optimaldir. {1,3,4} = 18, {2,3} = 17 daha kötüdür.`,
    },
    {
      q: `Aşağıdaki değişikliklerden hangileri örnek knapsack modelini <b>knapsack olarak bırakır</b>?`,
      options: [
        `Kapasiteyi 14'ten 12'ye düşürmek`,
        `"x<sub>1</sub> + x<sub>2</sub> ≤ 1" kısıtını eklemek`,
        `"x<sub>2</sub> ≤ x<sub>4</sub>" kısıtını eklemek`,
        `NPV değerlerini 9, 12, 7, 5 yapmak (negatif olmayan)`,
      ],
      answer: [0, 3],
      explain: `Knapsack'te kısıt sayısı 1 olmalı ve katsayılar negatif olmamalı. Kapasite ya da değer katsayısını (≥ 0) değiştirmek bunu bozmaz. Yeni bir kısıt eklemek (x<sub>1</sub>+x<sub>2</sub> ≤ 1 veya x<sub>2</sub> ≤ x<sub>4</sub>) problemi iki kısıtlı yapar ve knapsack olmaktan çıkarır.`,
    },
  ];

  /* ====================================================================== 1.3 */
  OR.content.summaries['1.3'] = `
<h2>1.3 Fixed Charge Problems</h2>
<p>Bir faaliyeti sıfırdan farklı bir düzeyde yapmanın, faaliyet düzeyinden <b>bağımsız bir maliyeti</b> (fixed charge) vardır (örn. makine kirası, tesis açma maliyeti). Bu, üretim ve yer seçimi problemlerinde sık görülür ve şu hileyle IP'ye çevrilir:</p>
<div class="box">y<sub>j</sub> = 1 eğer faaliyet j yapılıyorsa, 0 değilse. <b>x<sub>j</sub> ≤ M<sub>j</sub> y<sub>j</sub></b> kısıtı ile x<sub>j</sub> &gt; 0 ⇒ y<sub>j</sub> = 1 zorlanır (y<sub>j</sub> = 0 ⇒ x<sub>j</sub> = 0). M<sub>j</sub>, x<sub>j</sub>'nin alabileceği en büyük değerden büyük (veya eşit) seçilmelidir.</div>

<h3>Example 4 — Gandhi (Winston 9.2)</h3>
<p>Shirt / short / pants üretimi, işgücü ve kumaşla sınırlı; her ürün için makine kiralanmalı.</p>
<table>
  <tr><th></th><th>Shirts</th><th>Shorts</th><th>Pants</th><th>Mevcut</th></tr>
  <tr><td>Labor (saat/hafta)</td><td>3</td><td>2</td><td>6</td><td>150</td></tr>
  <tr><td>Cloth (m²/hafta)</td><td>4</td><td>3</td><td>4</td><td>160</td></tr>
  <tr><td>Makine kirası ($/hafta)</td><td>200</td><td>150</td><td>100</td><td></td></tr>
  <tr><td>Değişken birim maliyet</td><td>6</td><td>4</td><td>8</td><td></td></tr>
  <tr><td>Satış fiyatı</td><td>12</td><td>8</td><td>15</td><td></td></tr>
</table>
<p>x<sub>j</sub> = üretilen miktar, y<sub>j</sub> = 1 ise ürün j üretiliyor. Kâr = gelir − değişken maliyet − kira; birim kâr 12−6 = 6, 8−4 = 4, 15−8 = 7.</p>
<p><b>M değerleri</b> (her ürünün tek başına alabileceği en yüksek miktar):</p>
<ul>
  <li>Shirts: cloth 160/4 = 40 (labor 150/3 = 50) → <b>M<sub>1</sub> = 40</b></li>
  <li>Shorts: cloth 160/3 = 53.3 (labor 150/2 = 75) → integer olduğundan <b>M<sub>2</sub> = 53</b></li>
  <li>Pants: labor 150/6 = 25 (cloth 160/4 = 40) → <b>M<sub>3</sub> = 25</b></li>
</ul>
<div class="model">max 6x<sub>1</sub> + 4x<sub>2</sub> + 7x<sub>3</sub> − 200y<sub>1</sub> − 150y<sub>2</sub> − 100y<sub>3</sub>
s.t. 3x<sub>1</sub> + 2x<sub>2</sub> + 6x<sub>3</sub> ≤ 150      (labor)
     4x<sub>1</sub> + 3x<sub>2</sub> + 4x<sub>3</sub> ≤ 160      (cloth)
     x<sub>1</sub> ≤ 40y<sub>1</sub>,  x<sub>2</sub> ≤ 53y<sub>2</sub>,  x<sub>3</sub> ≤ 25y<sub>3</sub>
     x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> ≥ 0 and integer;  y<sub>1</sub>, y<sub>2</sub>, y<sub>3</sub> = 0 or 1</div>
<p>Notlara göre M<sub>1</sub> = 40 seçilince x<sub>1</sub> ≤ 40y<sub>1</sub> kısıtı <b>ek bir sınır getirmez</b>; M<sub>1</sub> çok küçük (örn. 10) seçilseydi x<sub>1</sub>'i <b>gereksiz yere</b> kısıtlardı.</p>

<h3>Example 5 — Warehouse problemi (ATK-White)</h3>
<p>5 olası depo (WH), 4 müşteri. WH-i'nin sabit açma/işletme maliyeti f<sub>i</sub>, kapasitesi K<sub>i</sub>; WH-i'den müşteri j'ye birim taşıma maliyeti c<sub>ij</sub>; müşteri talebi D<sub>j</sub> (D = 40 000, 30 000, 25 000, 75 000; kapasiteler 50 000, 60 000, 45 000, 80 000, 120 000).</p>
<div class="model">x<sub>ij</sub> = WH-i'den müşteri j'ye taşınan miktar (≥ 0);  y<sub>i</sub> = 1 eğer WH-i açılırsa
min Z = Σ<sub>i</sub> f<sub>i</sub>y<sub>i</sub> + Σ<sub>i</sub>Σ<sub>j</sub> c<sub>ij</sub>x<sub>ij</sub>
s.t. Σ<sub>j</sub> x<sub>ij</sub> ≤ K<sub>i</sub> y<sub>i</sub>     ∀ i   (kapasite + bağlantı: y<sub>i</sub>=0 ⇒ sevkiyat yok)
     Σ<sub>i</sub> x<sub>ij</sub> ≥ D<sub>j</sub>          ∀ j   (talep)
     x<sub>ij</sub> ≥ 0,  y<sub>i</sub> ∈ {0,1}</div>
<p>Burada M = K<sub>i</sub> (kapasite) doğal ve sıkı bir seçimdir. Model bir <b>mixed (binary) IP</b>'dir.</p>

<div class="warnbox"><b>Sınav tuzakları (1.3):</b>
<ul>
  <li>Doğru yön: <b>x ≤ M y</b>. "x ≥ M y" veya "y ≤ M x" ya da "x + y ≤ M" fixed charge'ı modellemez.</li>
  <li><b>M çok küçük</b> → feasible çözümler kesilir, optimum bozulabilir. <b>M çok büyük</b> → model doğru kalır ama LP relaxation zayıflar (y kesirli ve çok küçük olabilir), çözüm uzar. Mümkün olan en küçük geçerli M'i seç.</li>
  <li>x = 0 iken y = 1 teknik olarak feasible'dır; ancak sabit maliyet kâr/maliyete girdiğinden optimumda y = 0 olur. Zorlayan yön yalnızca x &gt; 0 ⇒ y = 1'dir.</li>
  <li>Integer değişken için M'i hesaplarken kesirli sonucu <b>aşağı yuvarla</b> (160/3 = 53.3 → 53).</li>
  <li>Birden çok kaynak varsa M, <b>tüm kaynak kısıtlarından gelen sınırların minimumu</b>dur (Gandhi'de shirts için min(40, 50) = 40).</li>
  <li>Warehouse'ta bağlantı kısıtı yazılmazsa kapalı depodan sevkiyat bedavaya yapılır (sabit maliyet ödenmez).</li>
</ul></div>
`;

  OR.content.concepts['1.3'] = [
    {
      q: `Fixed charge problemlerinde "x<sub>j</sub> &gt; 0 ise y<sub>j</sub> = 1 olmalıdır" koşulunu sağlayan doğru kısıt hangisidir? (M büyük bir sayıdır.)`,
      options: [
        `x<sub>j</sub> ≤ M y<sub>j</sub>`,
        `x<sub>j</sub> ≥ M y<sub>j</sub>`,
        `y<sub>j</sub> ≤ M x<sub>j</sub>`,
        `x<sub>j</sub> + y<sub>j</sub> ≤ M`,
      ],
      answer: 0,
      explain: `x<sub>j</sub> ≤ M y<sub>j</sub>: y<sub>j</sub> = 0 ise x<sub>j</sub> ≤ 0, yani x<sub>j</sub> = 0; dolayısıyla x<sub>j</sub> &gt; 0 olması y<sub>j</sub> = 1'i zorlar. x<sub>j</sub> ≥ M y<sub>j</sub> ise y<sub>j</sub> = 1 iken x<sub>j</sub>'in çok büyük olmasını gerektirir. y<sub>j</sub> ≤ M x<sub>j</sub> ters yönde bir bağlantıdır (x<sub>j</sub> = 0 ⇒ y<sub>j</sub> = 0). Son seçenek hiçbir bağlantı kurmaz.`,
    },
    {
      q: `Gandhi örneğinde (labor: 3, 2, 6 saat, toplam 150; cloth: 4, 3, 4 m², toplam 160) <b>shirts</b> için en uygun (sıkı) M<sub>1</sub> değeri nedir?`,
      options: [`40`, `50`, `53`, `25`],
      answer: 0,
      explain: `Tek başına en fazla shirt sayısı: cloth ile 160/4 = 40, labor ile 150/3 = 50. Her iki kısıtı da sağlamak için min(40, 50) = <b>40</b>. 50 geçerli ama gevşektir, 53 shorts'un M'idir, 25 ise pants'inkidir.`,
    },
    {
      q: `Gandhi örneğinde <b>shorts</b> (labor 2 saat, cloth 3 m²) için M<sub>2</sub> kaçtır? (x<sub>j</sub> integer.)`,
      options: [`53`, `75`, `54`, `40`],
      answer: 0,
      explain: `Labor: 150/2 = 75; cloth: 160/3 = 53.33. Minimum 53.33'tür ve x integer olduğundan aşağı yuvarlanır: <b>M<sub>2</sub> = 53</b> (notlardaki değer). 75 gevşek bir üst sınırdır, 54 ise cloth kısıtını aşar (54·3 = 162 &gt; 160).`,
    },
    {
      q: `Gandhi örneğinde <b>pants</b> (labor 6 saat, cloth 4 m²) için M<sub>3</sub> kaçtır?`,
      options: [`25`, `40`, `37`, `53`],
      answer: 0,
      explain: `Labor: 150/6 = 25; cloth: 160/4 = 40. Sıkı sınır labor'dan gelir: <b>M<sub>3</sub> = 25</b>. 40 geçerli olurdu ama gevşektir.`,
    },
    {
      q: `Gandhi modelinde pants'in amaç fonksiyonuna katkısı nasıl yazılır? (satış 15, değişken maliyet 8, makine kirası 100)`,
      options: [`7x<sub>3</sub> − 100y<sub>3</sub>`, `15x<sub>3</sub> − 100y<sub>3</sub>`, `7x<sub>3</sub> + 100y<sub>3</sub>`, `(7 − 100)x<sub>3</sub>`],
      answer: 0,
      explain: `Kâr = (15 − 8)x<sub>3</sub> − 100y<sub>3</sub>. Kira sabittir ve yalnızca y<sub>3</sub> = 1 iken ödenir, dolayısıyla y<sub>3</sub>'ün katsayısı −100'dür ve x<sub>3</sub> ile çarpılmaz. 15x<sub>3</sub> değişken maliyeti unutur; +100y<sub>3</sub> kirayı kâra ekler.`,
    },
    {
      q: `Gandhi modelinde shirts için x<sub>1</sub> ≤ M<sub>1</sub> y<sub>1</sub> kısıtında yanlışlıkla M<sub>1</sub> = <b>10</b> alınırsa ne olur?`,
      options: [
        `x<sub>1</sub> ≤ 10 olur; gereksiz yere kısıtlanır ve optimal çözüm (örn. 40 shirt üretimi) kesilebilir.`,
        `Hiçbir şey olmaz; küçük M her zaman daha iyidir.`,
        `Model infeasible olur ama başka bir etkisi olmaz.`,
        `y<sub>1</sub> otomatik olarak 1 olur.`,
      ],
      answer: 0,
      explain: `M<sub>j</sub>, x<sub>j</sub>'nin kaynak kısıtlarıyla izin verilen en büyük değerinden küçük olursa, x<sub>j</sub> ≤ M y<sub>j</sub> kendi başına yeni bir sınır olur ve feasible/optimal çözümleri keser. Notlarda da "M<sub>1</sub> = 10 olsaydı kısıt x<sub>1</sub>'in değerini gereksiz yere kısıtlardı" denir.`,
    },
    {
      q: `x<sub>j</sub> ≤ M y<sub>j</sub> kısıtında M çok <b>büyük</b> seçilirse (örn. 10<sup>6</sup>) hangileri doğrudur?`,
      options: [
        `Model hâlâ doğrudur (geçerli bir M'dir).`,
        `LP relaxation zayıflar: y<sub>j</sub> çok küçük kesirli değerler alarak x<sub>j</sub> &gt; 0'a izin verir.`,
        `Model infeasible olur.`,
        `Optimal integer çözüm değişir.`,
      ],
      answer: [0, 1],
      explain: `M yeterince büyükse geçerlidir ve integer optimum değişmez. Ancak LR'de y<sub>j</sub> ≥ x<sub>j</sub>/M çok küçük olabilir; bu sabit maliyetin LR'de neredeyse hiç ödenmemesi, yani zayıf bound demektir. Bu yüzden mümkün olan en küçük geçerli M tercih edilir.`,
    },
    {
      q: `Warehouse modelinde (min Σf<sub>i</sub>y<sub>i</sub> + ΣΣc<sub>ij</sub>x<sub>ij</sub>) kapasite/bağlantı kısıtı Σ<sub>j</sub> x<sub>ij</sub> ≤ K<sub>i</sub>y<sub>i</sub> <b>hiç yazılmazsa</b> ne olur?`,
      options: [
        `Depo açılmadan (y<sub>i</sub> = 0) bile sevkiyat yapılabilir; sabit maliyet ödenmez, model y = 0 ile tüm sabit maliyetleri atlar.`,
        `Model infeasible olur.`,
        `Depolar mutlaka açılır.`,
        `Yalnızca kapasite aşılamaz hale gelir.`,
      ],
      answer: 0,
      explain: `Kısıt iki iş yapar: y<sub>i</sub> = 0 ise sevkiyatı sıfırlar (bağlantı) ve y<sub>i</sub> = 1 ise kapasiteyi K<sub>i</sub> ile sınırlar. Kaldırılırsa kapalı depodan bedavaya taşıma mümkün olur, minimizasyon tüm y'leri 0 yapıp fixed charge'ı yok sayar.`,
    },
    {
      q: `Warehouse örneğinde toplam talep 40 000 + 30 000 + 25 000 + 75 000 = 170 000'dir. Depo 3'ün kapasitesi 45 000'dir. Müşteri 4'e (talep 75 000) gönderilebilecek miktar için x<sub>34</sub> ≤ M y<sub>3</sub> yazılırsa <b>en sıkı</b> geçerli M nedir?`,
      options: [`45 000`, `75 000`, `170 000`, `120 000`],
      answer: 0,
      explain: `x<sub>34</sub> hem K<sub>3</sub> = 45 000 ile hem de (gerekirse) talepler ile sınırlıdır: min(K<sub>3</sub>, D<sub>4</sub>) = min(45 000, 75 000) = <b>45 000</b>. 75 000 ve 170 000 geçerli ama gevşektir; 120 000 depo 5'in kapasitesidir.`,
    },
    {
      q: `Gandhi modelindeki x<sub>j</sub> ≤ M<sub>j</sub> y<sub>j</sub> kısıtları için hangileri doğrudur?`,
      options: [
        `x<sub>j</sub> &gt; 0 ise y<sub>j</sub> = 1 olmak zorundadır.`,
        `y<sub>j</sub> = 0 ise x<sub>j</sub> = 0 olur.`,
        `x<sub>j</sub> = 0 olduğunda y<sub>j</sub> = 1 olması da feasible'dır; ancak sabit maliyet nedeniyle optimumda y<sub>j</sub> = 0 olur.`,
        `x<sub>j</sub> = 0 ise y<sub>j</sub> = 0 olmak zorundadır (kısıt bunu zorlar).`,
      ],
      answer: [0, 1, 2],
      explain: `Kısıt yalnızca x &gt; 0 ⇒ y = 1 yönünü zorlar. x = 0 iken y serbesttir; y = 1 seçmek sabit kirayı ödetip kârı düşürdüğünden maksimizasyon bunu seçmez. "x = 0 ⇒ y = 0" kısıtın kendisi tarafından değil, amaç fonksiyonu tarafından sağlanır.`,
    },
  ];

  /* ====================================================================== 1.4 */
  OR.content.summaries['1.4'] = `
<h2>1.4 Either-Or Constraints</h2>
<p>İki koşuldan <b>en az birinin</b> sağlanması isteniyorsa:</p>
<div class="model">f(x<sub>1</sub>, …, x<sub>n</sub>) ≤ 0   (1)
g(x<sub>1</sub>, …, x<sub>n</sub>) ≤ 0   (2)      "(1) ya da (2)" (en az biri)
        ↓
f(x<sub>1</sub>, …, x<sub>n</sub>) ≤ M y
g(x<sub>1</sub>, …, x<sub>n</sub>) ≤ M (1 − y)        y = 0 or 1</div>
<ul>
  <li>y = 0 ⇒ (1) sağlanmak zorunda, (2) <b>belki</b> sağlanır.</li>
  <li>y = 1 ⇒ (2) sağlanmak zorunda, (1) <b>belki</b> sağlanır.</li>
  <li><b>M</b>: diğer kısıtları sağlayan tüm değişken değerleri için <b>her iki kısıt da</b> (gevşetilmiş kısıt dahil) sağlanacak kadar büyük olmalıdır.</li>
  <li>Önce her iki koşulu da <b>"≤ 0" biçimine</b> getir (≥ ise −1 ile çarp): f = b − ax gibi.</li>
</ul>

<h3>Example 1 — Warehouse: either-or uzantısı</h3>
<p>ATK-White, müşteri 1 veya müşteri 2'nin talebinden <b>birini</b> yok sayabilir (ikisinden birini karşılamak yeter). ≥ biçiminden ≤ 0'a:</p>
<div class="model">f(x) = −(x<sub>11</sub>+x<sub>21</sub>+x<sub>31</sub>+x<sub>41</sub>+x<sub>51</sub>) + 40 000 ≤ 0
g(x) = −(x<sub>12</sub>+x<sub>22</sub>+x<sub>32</sub>+x<sub>42</sub>+x<sub>52</sub>) + 30 000 ≤ 0
      ↓
−(x<sub>11</sub>+…+x<sub>51</sub>) + 40 000 ≤ 40 000·y
−(x<sub>12</sub>+…+x<sub>52</sub>) + 30 000 ≤ 30 000·(1 − y)       y ∈ {0,1}
Σ<sub>i</sub> x<sub>ij</sub> ≥ D<sub>j</sub>   yalnızca diğer müşteriler için (j = 3, 4)</div>
<p>M<sub>1</sub> = 40 000, M<sub>2</sub> = 30 000 (x ≥ 0 olduğundan f ≤ 40 000 ve g ≤ 30 000 her zaman geçerli). y = 0 ⇒ müşteri 1'in talebi karşılanır; y = 1 ⇒ müşteri 2'nin talebi karşılanır. Eşit yer çıkarsa her ikisi de karşılanabilir.</p>

<h3>Example 2 — Compact Car</h3>
<p>Bir compact car üretimi için 1.5 ton çelik ve 30 saat işgücü gerekir; 6 000 ton çelik ve 60 000 saat işgücü mevcut. Ekonomik üretim için <b>en az 1 000 araç</b> üretilmeli, aksi halde hiç üretim yapılmamalı.</p>
<div class="model">x = 0  or  x ≥ 1000   ⇒   x ≤ 0  or  1000 − x ≤ 0       (f = x, g = 1000 − x)
x ≤ M y
1000 − x ≤ M (1 − y)         y = 0 or 1,  x ≥ 0 and integer
M = min(6 000/1.5, 60 000/30) = min(4 000, 2 000) = 2 000</div>
<p>y = 0 ⇒ x ≤ 0 (x = 0), y = 1 ⇒ x ≥ 1000 (ve x ≤ 2000).</p>

<h3>Genelleme (notlarda yok; aynı kalıp)</h3>
<p><b>m kısıttan en az k'sı</b> sağlansın: f<sub>i</sub> ≤ M y<sub>i</sub> (i = 1..m), Σ y<sub>i</sub> ≤ m − k. Örn. 3 kısıttan en az 2'si: Σ y<sub>i</sub> ≤ 1.</p>

<div class="warnbox"><b>Sınav tuzakları (1.4):</b>
<ul>
  <li>Either-or = <b>en az biri</b> (inclusive). Tam biri istenirse ayrıca "ikisi birden olmasın" koşulu gerekir.</li>
  <li><b>y = 0 ↔ (1)</b>, <b>y = 1 ↔ (2)</b>: y'nin M ile çarpıldığı kısıt, y = 0'da <i>zorlanan</i> kısıttır; (1 − y) ile çarpılan, y = 1'de zorlanandır. Karıştırma!</li>
  <li>Koşulları mutlaka "≤ 0" formuna getir (≥ 0 ise işaretini değiştir); M hesabında f ve g ayrı ayrı bakılır, ortak M = <b>max</b> alınır.</li>
  <li>M çok küçükse zorlanmayan kısıt gerçekte kısıtlayıcı olur (feasible çözümler kaybolur); çok büyükse LR zayıflar.</li>
  <li>Compact Car'da M iki kaynaktan gelen sınırların <b>minimumudur</b> (2000), maksimumu (4000) değil.</li>
  <li>Warehouse örneğinde talep kısıtları <b>yalnızca</b> either-or'a girmeyen müşteriler için (j = 3, 4) kalır.</li>
</ul></div>
`;

  OR.content.concepts['1.4'] = [
    {
      q: `Compact Car problemi: "üretim x = 0 <b>veya</b> x ≥ 1000 olmalıdır". Hangi kısıt çifti bunu doğru modeller? (y binary, M büyük)`,
      options: [
        `x ≤ M y  ve  1000 − x ≤ M (1 − y)`,
        `x ≤ M y  ve  x − 1000 ≤ M (1 − y)`,
        `x ≥ 1000 y  ve  x ≤ M`,
        `x ≤ 1000 y  ve  x ≥ M (1 − y)`,
      ],
      answer: 0,
      explain: `f(x) = x, g(x) = 1000 − x alınır. y = 0 ⇒ x ≤ 0 (x = 0) ve 1000 − x ≤ M (gevşek); y = 1 ⇒ 1000 − x ≤ 0 (x ≥ 1000) ve x ≤ M (gevşek). İkinci seçenekte g yerine x − 1000 yazılmış: y = 1 iken x ≤ 1000 olur, yani "x ≥ 1000" yerine "x ≤ 1000" zorlanır (işaret hatası). Üçüncü seçenekte x ≥ 1000y, y = 0 iken x = 0'ı zorlamaz (x serbest kalır). Dördüncü seçenekte y = 1 iken x ≤ 1000 olur ve "x ≥ M(1 − y)" y = 0 iken x ≥ M'yi (çok büyük bir alt sınırı) zorlar.`,
    },
    {
      q: `Compact Car'da 1 araç için 1.5 ton çelik ve 30 saat işgücü gerekir; mevcut: 6 000 ton çelik, 60 000 saat. M değeri nedir?`,
      options: [`2 000`, `4 000`, `1 000`, `3 000`],
      answer: 0,
      explain: `Çelikle en fazla 6 000/1.5 = 4 000, işgücüyle 60 000/30 = 2 000 araç üretilebilir. İkisini de sağlamak için <b>M = min(4 000, 2 000) = 2 000</b>. 4 000 geçerli ama gevşektir; 1 000 ise alt sınırdır, x ≤ M y kısıtı için yetersizdir (x = 1 500 mümkün olmalı).`,
    },
    {
      q: `Either-or kısıtlarında (f ≤ M y, g ≤ M (1 − y)) hangileri doğrudur?`,
      options: [
        `y = 0 ise (1) kesinlikle sağlanır; (2) sağlanabilir ama zorunlu değildir.`,
        `y = 1 ise (2) kesinlikle sağlanır.`,
        `Her iki koşulun da aynı anda sağlanması yasaktır.`,
        `Koşullardan en az birinin sağlanması yeterlidir; ikisi birden de sağlanabilir.`,
      ],
      answer: [0, 1, 3],
      explain: `Either-or "(1) ya da (2)" demektir, <b>inclusive</b>: y yalnızca hangisinin <i>garanti</i> edildiğini seçer. Diğer koşul da (tesadüfen) sağlanabilir; yasak değildir. İkisinin birden olmasını yasaklamak için ek bir koşul gerekir.`,
    },
    {
      q: `"x<sub>1</sub> + x<sub>2</sub> ≥ 10 <b>veya</b> 2x<sub>1</sub> + x<sub>2</sub> ≥ 8" koşulu için hangi kısıt çifti doğrudur? (y binary, M uygun)`,
      options: [
        `10 − x<sub>1</sub> − x<sub>2</sub> ≤ M y  ve  8 − 2x<sub>1</sub> − x<sub>2</sub> ≤ M (1 − y)`,
        `x<sub>1</sub> + x<sub>2</sub> ≤ 10 + M y  ve  2x<sub>1</sub> + x<sub>2</sub> ≤ 8 + M (1 − y)`,
        `x<sub>1</sub> + x<sub>2</sub> ≥ 10 y  ve  2x<sub>1</sub> + x<sub>2</sub> ≥ 8 y`,
        `10 − x<sub>1</sub> − x<sub>2</sub> ≥ M y  ve  8 − 2x<sub>1</sub> − x<sub>2</sub> ≥ M (1 − y)`,
      ],
      answer: 0,
      explain: `Önce her koşul "≤ 0" biçimine getirilir: f = 10 − x<sub>1</sub> − x<sub>2</sub> ≤ 0, g = 8 − 2x<sub>1</sub> − x<sub>2</sub> ≤ 0. Sonra f ≤ M y, g ≤ M(1 − y). İkinci seçenek ≥ koşullarını ≤ olarak yeniden yazarken yönü çevirir (anlamı değiştirir). Üçüncü seçenekte iki kısıt da aynı y ile çarpılmıştır: y = 0 iken ikisi de x ≥ 0 gibi trivial hale gelir ve hiçbir koşul zorlanmaz. Dördüncü seçenekte eşitsizlik yönü ters kullanılmıştır (f ≥ M y, y = 0 iken f ≥ 0 gibi yanlış bir koşul verir).`,
    },
    {
      q: `Aşağıdaki either-or koşulunda, diğer kısıtlar 0 ≤ x<sub>1</sub> ≤ 4 ve 0 ≤ x<sub>2</sub> ≤ 5 olsun:
<div class="model">(1) 3x<sub>1</sub> + 2x<sub>2</sub> ≤ 18    <b>veya</b>    (2) x<sub>1</sub> + 4x<sub>2</sub> ≤ 16</div>
f = 3x<sub>1</sub> + 2x<sub>2</sub> − 18 ≤ M y, g = x<sub>1</sub> + 4x<sub>2</sub> − 16 ≤ M (1 − y) için <b>her iki kısıtı da geçerli kılan en küçük tek M</b> kaçtır?`,
      options: [`4`, `8`, `12`, `18`],
      answer: 1,
      explain: `M, gevşetilen kısıt için bile sağlanmalıdır, yani M ≥ max f ve M ≥ max g. max f = 3·4 + 2·5 − 18 = 4, max g = 4 + 4·5 − 16 = 8. Tek ortak M için <b>max(4, 8) = 8</b>. M = 4 olsaydı, (1)'i sağlayan (x<sub>1</sub>, x<sub>2</sub>) = (1, 5) noktası (3+10 = 13 ≤ 18; y = 0 olmalı) için g = 1 + 20 − 16 = 5 ≤ M (1 − 0) = 4 sağlanamaz ve bu feasible nokta kesilirdi.`,
    },
    {
      q: `Warehouse either-or uzantısında ATK-White müşteri 1 <b>veya</b> müşteri 2'nin talebinden birini yok sayabilir. Notlardaki modelde y ve talep kısıtları için hangileri doğrudur?`,
      options: [
        `y = 0 ise müşteri 1'in talebi (≥ 40 000) mutlaka karşılanır.`,
        `y = 1 ise müşteri 2'in talebi (≥ 30 000) mutlaka karşılanır.`,
        `Müşteri 3 ve 4 için Σ<sub>i</sub> x<sub>ij</sub> ≥ D<sub>j</sub> kısıtları aynen kalır.`,
        `M<sub>1</sub> = 30 000 ve M<sub>2</sub> = 40 000 alınmalıdır.`,
      ],
      answer: [0, 1, 2],
      explain: `−(Σx<sub>i1</sub>) + 40 000 ≤ 40 000 y ve −(Σx<sub>i2</sub>) + 30 000 ≤ 30 000 (1 − y): y = 0 ⇒ müşteri 1'in talebi, y = 1 ⇒ müşteri 2'nin talebi karşılanır. M'ler kendi talepleridir (M<sub>1</sub> = 40 000, M<sub>2</sub> = 30 000), çünkü Σx<sub>ij</sub> ≥ 0 olduğundan f ≤ 40 000 ve g ≤ 30 000 her zaman sağlanır. Yer değiştirmiş M'ler (30 000 ve 40 000) bu garantiyi bozabilir.`,
    },
    {
      q: `"x ≤ 2 <b>veya</b> x ≥ 5" koşulu için f = x − 2 ≤ M y, g = 5 − x ≤ M (1 − y) yazılıyor. Diğer kısıt 0 ≤ x ≤ 12 ise, her iki kısıt için geçerli <b>en küçük tek M</b> nedir?`,
      options: [`5`, `10`, `12`, `7`],
      answer: 1,
      explain: `max f = 12 − 2 = 10, max g = 5 − 0 = 5. Ortak M ≥ max(10, 5) = <b>10</b>. M = 5 olsaydı y = 1 iken f = x − 2 ≤ 5 yani x ≤ 7 olur, x = 12 (feasible) kesilirdi.`,
    },
    {
      q: `<b>Üç</b> kısıttan (f<sub>1</sub> ≤ 0, f<sub>2</sub> ≤ 0, f<sub>3</sub> ≤ 0) <b>en az ikisinin</b> sağlanmasını istiyoruz (notlardaki either-or'un genellemesi). Hangi model doğrudur? (y<sub>i</sub> binary, M büyük)`,
      options: [
        `f<sub>i</sub> ≤ M y<sub>i</sub> (i=1,2,3) ve y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> ≤ 1`,
        `f<sub>i</sub> ≤ M y<sub>i</sub> (i=1,2,3) ve y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> ≥ 2`,
        `f<sub>i</sub> ≤ M y<sub>i</sub> (i=1,2,3) ve y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> = 3`,
        `f<sub>i</sub> ≤ M (1 − y<sub>i</sub>) ve y<sub>1</sub> + y<sub>2</sub> + y<sub>3</sub> ≤ 1`,
      ],
      answer: 0,
      explain: `y<sub>i</sub> = 0 ⇒ f<sub>i</sub> ≤ 0 zorunlu. En az iki kısıtın zorlanması için en az iki y'nin 0 olması, yani Σ y<sub>i</sub> ≤ 3 − 2 = 1 gerekir. Σ y ≥ 2 ise en az iki kısıtı <i>gevşetir</i> (ters yön). Σ y = 3 hepsini gevşetir. Son seçenekte f<sub>i</sub> ≤ M(1−y<sub>i</sub>) ile y<sub>i</sub> = 1 olanlar zorlanır; Σ y ≤ 1 ise en fazla bir tanesi zorlanır.`,
    },
    {
      q: `Either-or formülasyonunda M hakkında hangileri doğrudur?`,
      options: [
        `M, gevşetilen kısıt için bile sağlanacak kadar büyük olmalıdır (diğer kısıtları sağlayan her nokta için).`,
        `M çok küçük seçilirse, gevşetilmesi gereken kısıt gerçekte kısıtlayıcı hale gelir ve feasible çözümler kesilebilir.`,
        `M çok büyük seçilirse model yanlış olur.`,
        `M, f ve g için ayrı ayrı M<sub>1</sub> ve M<sub>2</sub> olarak seçilebilir.`,
      ],
      answer: [0, 1, 3],
      explain: `M yeterince büyük olmalıdır; küçükse feasible bölge kesilir. Çok büyük M modeli <i>yanlış yapmaz</i>, yalnızca LR'yi zayıflatır (çözüm süresi uzar). Tek M yazmak zorunlu değildir; her kısıt için kendi sıkı M'i (notlardaki warehouse örneğinde 40 000 ve 30 000) kullanılabilir.`,
    },
  ];

  /* ====================================================================== 1.5 */
  OR.content.summaries['1.5'] = `
<h2>1.5 If-Then Constraints</h2>
<p><b>f(x) &gt; 0</b> koşulunun <b>g(x) ≥ 0</b> koşulunu gerektirmesini ("f &gt; 0 ⇒ g ≥ 0") sağlamak için, y binary ve M büyük pozitif bir sayı olmak üzere:</p>
<div class="model">−g(x<sub>1</sub>, …, x<sub>n</sub>) ≤ M y        (1)
 f(x<sub>1</sub>, …, x<sub>n</sub>) ≤ M (1 − y)    (2)</div>
<ul>
  <li>f &gt; 0 ise (2) ancak <b>y = 0</b> iken sağlanır. y = 0 iken (1) ⇒ −g ≤ 0 ⇒ <b>g ≥ 0</b> (istenen sonuç).</li>
  <li>f ≤ 0 ise y = 1 seçilebilir: (2) sağlanır, (1) −g ≤ M ile g üzerinde fiilen kısıt koymaz.</li>
  <li><b>M</b> yeterince büyük olmalı: tüm geçerli noktalarda <b>f &lt; M</b> ve <b>−g &lt; M</b>.</li>
  <li>(1)'in M'i −g'nin, (2)'nin M'i f'nin üst sınırından gelir; ayrı M<sub>1</sub>, M<sub>2</sub> kullanılabilir.</li>
</ul>
<div class="box">Mantıksal eşdeğerlik: "f &gt; 0 ⇒ g ≥ 0" ≡ "<b>f ≤ 0 veya g ≥ 0</b>", yani aslında bir <i>either-or</i> koşuludur; if-then formülasyonu bunun f ve g'ye göre hazır bir M-kalıbıdır.</div>

<h3>Example 3 — Warehouse: if-then uzantısı</h3>
<p>"WH-2'nin kapasitesinin <b>%40'ından fazlası</b> kullanılırsa WH-3 açılamaz."  K<sub>2</sub> = 60 000, %40 = 24 000.</p>
<div class="model">Σ<sub>j</sub> x<sub>2j</sub> &gt; 24 000  ⇒  y<sub>3</sub> = 0   ⇔   y<sub>3</sub> ≤ 0  ⇔  −y<sub>3</sub> ≥ 0
f(x) = x<sub>21</sub>+x<sub>22</sub>+x<sub>23</sub>+x<sub>24</sub>+x<sub>25</sub> − 24 000  &gt; 0
g(x) = −y<sub>3</sub>   ≥ 0
(1) −g ≤ M<sub>1</sub> y        ⇒   y<sub>3</sub> ≤ 1·y                       (M<sub>1</sub> = 1)
(2)  f ≤ M<sub>2</sub> (1 − y)   ⇒   Σ<sub>j</sub> x<sub>2j</sub> − 24 000 ≤ 36 000 (1 − y)   (M<sub>2</sub> = 60 000 − 24 000)
y ∈ {0,1}  (y yeni yardımcı binary; y<sub>i</sub> depo açma değişkenleridir)</div>
<p>Yani WH-2'den 24 000'den fazla gönderilirse y = 0 ⇒ y<sub>3</sub> = 0. 24 000 veya daha azı gönderilirse y = 1 seçilebilir ve y<sub>3</sub> serbesttir.</p>
<p>Aynı etkiyi <b>kontrapozitif</b> düşünerek tek kısıtla da yazabiliriz (notlarda yok): WH-3 açılırsa (y<sub>3</sub> = 1) WH-2 ≤ 24 000 olmalı → Σ<sub>j</sub> x<sub>2j</sub> ≤ 24 000 + 36 000 (1 − y<sub>3</sub>).</p>

<h3>Özel durum: binary değişkenler</h3>
<p>"x<sub>A</sub> = 1 ise x<sub>B</sub> = 1" (f = x<sub>A</sub>, g = x<sub>B</sub> − 1, M = 1) kısıtları toplayınca <b>x<sub>A</sub> ≤ x<sub>B</sub></b>'ye iner (1.1'deki "2 ise 4").</p>

<div class="warnbox"><b>Sınav tuzakları (1.5):</b>
<ul>
  <li>Yapı: <b>(1) −g ≤ M y</b> ve <b>(2) f ≤ M (1 − y)</b>. İkisini de aynı y ile çarpmak (−g ≤ M y ve f ≤ M y) hiçbir mantıksal bağ kurmaz.</li>
  <li>g ≥ 0 formuna getirmeyi unutma: "y<sub>3</sub> = 0" için g = −y<sub>3</sub> (≥ 0 ⇔ y<sub>3</sub> ≤ 0), −g = y<sub>3</sub>.</li>
  <li>Eşitsizlik "f &gt; 0" kesin eşitsizliktir; f = 0 iken y = 1 seçilebilir, bu bir sorun değildir (koşul tetiklenmez). "f ≥ 0 ise" gibi durumlar için ε kullanmak gerekir.</li>
  <li>If-then tek yönlüdür: f ≤ 0 iken g hakkında bir şey söylenmez. (Karşıt yönlü bağ için ayrı bir koşul gerekir.)</li>
  <li>M<sub>2</sub> = <b>f'nin üst sınırı</b> = 60 000 − 24 000 = 36 000 (60 000 değil); M<sub>1</sub> = −g'nin üst sınırı = 1.</li>
  <li>If-then ile either-or'u karıştırma: either-or'da iki koşuldan biri <i>mutlaka</i> sağlanır; if-then'de koşul f &gt; 0 tetiklenmedikçe hiçbir şey zorunlu değildir.</li>
</ul></div>
`;

  OR.content.concepts['1.5'] = [
    {
      q: `"f(x) &gt; 0 ise g(x) ≥ 0 olmalıdır" koşulunu modelleyen doğru kısıt çifti hangisidir? (y binary, M büyük)`,
      options: [
        `−g ≤ M y  ve  f ≤ M (1 − y)`,
        `g ≤ M y  ve  f ≤ M (1 − y)`,
        `−g ≤ M y  ve  f ≤ M y`,
        `−g ≤ M (1 − y)  ve  f ≥ M y`,
      ],
      answer: 0,
      explain: `Notlardaki standart biçim: (1) −g ≤ M y, (2) f ≤ M(1 − y). f &gt; 0 ise (2) yalnızca y = 0 iken sağlanır; y = 0 iken (1) −g ≤ 0, yani g ≥ 0 olur. İkinci seçenekte g ≤ M y yazılmış: y = 0 iken g ≤ 0 olur (yanlış yön). Üçüncüde iki kısıt aynı y ile çarpıldığı için y = 1 iken ikisi de gevşer, hiçbir koşul zorlanmaz.`,
    },
    {
      q: `"f &gt; 0 ⇒ g ≥ 0" koşulunun mantıksal olarak eşdeğeri aşağıdakilerden hangisidir?`,
      options: [
        `f ≤ 0 <b>veya</b> g ≥ 0`,
        `f ≥ 0 <b>ve</b> g ≤ 0`,
        `f ≤ 0 <b>ve</b> g ≥ 0`,
        `f &gt; 0 <b>veya</b> g &lt; 0`,
      ],
      answer: 0,
      explain: `"A ⇒ B" ≡ "(değil A) veya B". A: f &gt; 0, değili: f ≤ 0. Yani "f ≤ 0 veya g ≥ 0" bir either-or koşuludur; if-then bu yüzden either-or'dan türetilebilir. "ve" içeren seçenekler iki koşulu da zorunlu kılar (çok güçlüdür); sonuncu ise koşulun karşıtıdır.`,
    },
    {
      q: `Warehouse örneğinde "WH-2'nin kapasitesinin %40'ından fazlası kullanılırsa WH-3 açılamaz" (K<sub>2</sub> = 60 000) koşulunda f(x) = Σ<sub>j</sub> x<sub>2j</sub> − 24 000 ve g = −y<sub>3</sub> alındığında (2) f ≤ M<sub>2</sub>(1 − y) kısıtındaki en sıkı M<sub>2</sub> nedir?`,
      options: [`36 000`, `60 000`, `24 000`, `1`],
      answer: 0,
      explain: `f'nin alabileceği en büyük değer: Σ<sub>j</sub> x<sub>2j</sub> ≤ K<sub>2</sub> = 60 000 olduğundan f ≤ 60 000 − 24 000 = <b>36 000</b>. 60 000 geçerli ama gevşektir; 24 000 yetersizdir (f 36 000'e kadar çıkabilir); 1 ise (1) kısıtının M'idir.`,
    },
    {
      q: `Aynı örnekte (1) −g ≤ M<sub>1</sub> y kısıtı y<sub>3</sub> ≤ M<sub>1</sub> y olur. Geçerli en küçük M<sub>1</sub> nedir?`,
      options: [`1`, `24 000`, `36 000`, `60 000`],
      answer: 0,
      explain: `−g = y<sub>3</sub> binary'dir, en çok 1 olabilir; M<sub>1</sub> = 1 yeterlidir ve y<sub>3</sub> ≤ y kısıtını verir. Büyük M'ler geçerli ama gereksiz yere zayıftır.`,
    },
    {
      q: `Warehouse if-then modelinde (y<sub>3</sub> ≤ y ve Σ<sub>j</sub> x<sub>2j</sub> − 24 000 ≤ 36 000 (1 − y)) hangileri doğrudur?`,
      options: [
        `WH-2'den toplam 30 000 gönderiliyorsa y = 0 olmak zorundadır ve dolayısıyla y<sub>3</sub> = 0'dır.`,
        `WH-2'den toplam 20 000 gönderiliyorsa y = 1 seçilebilir ve y<sub>3</sub> = 1 olabilir.`,
        `WH-2'den toplam 30 000 gönderiliyorsa y = 1 olmalıdır.`,
        `WH-2'den 20 000 gönderiliyorsa y<sub>3</sub> = 0 olmak zorundadır.`,
      ],
      answer: [0, 1],
      explain: `30 000 − 24 000 = 6 000 &gt; 0 iken ikinci kısıt 6 000 ≤ 36 000 (1 − y) yalnızca y = 0 ile sağlanır ⇒ y<sub>3</sub> ≤ 0. 20 000 iken f = −4 000 ≤ 0: y = 1 seçilebilir, y<sub>3</sub> ≤ 1 hiçbir kısıt getirmez (y<sub>3</sub> = 1 mümkün).`,
    },
    {
      q: `"WH-3 açıksa (y<sub>3</sub> = 1) WH-2'den toplam en fazla 24 000 gönderilebilir (K<sub>2</sub> = 60 000)" koşulunu <b>tek kısıtla</b> modelleyen hangisidir?`,
      options: [
        `Σ<sub>j</sub> x<sub>2j</sub> ≤ 24 000 + 36 000 (1 − y<sub>3</sub>)`,
        `Σ<sub>j</sub> x<sub>2j</sub> ≤ 24 000 y<sub>3</sub>`,
        `Σ<sub>j</sub> x<sub>2j</sub> ≤ 24 000 + 36 000 y<sub>3</sub>`,
        `Σ<sub>j</sub> x<sub>2j</sub> ≥ 24 000 y<sub>3</sub>`,
      ],
      answer: 0,
      explain: `y<sub>3</sub> = 1 ⇒ Σ ≤ 24 000 (istenen); y<sub>3</sub> = 0 ⇒ Σ ≤ 60 000 (zaten kapasite). İkinci seçenek y<sub>3</sub> = 0 iken WH-2'yi tamamen kapatır (yanlış). Üçüncüsü y<sub>3</sub> = 1 iken 60 000'e izin verir, yani koşulu sağlamaz. Dördüncüsü yön olarak ters.`,
    },
    {
      q: `2x<sub>1</sub> + x<sub>2</sub> &gt; 10 ise x<sub>3</sub> ≥ 3 olmalıdır. Diğer kısıtlar: 0 ≤ x<sub>1</sub> ≤ 6, 0 ≤ x<sub>2</sub> ≤ 4, 0 ≤ x<sub>3</sub> ≤ 8. f = 2x<sub>1</sub> + x<sub>2</sub> − 10, g = x<sub>3</sub> − 3 için −g ≤ M y, f ≤ M (1 − y) kısıtlarını <b>aynı M</b> ile yazarsak en küçük geçerli M nedir?`,
      options: [`3`, `6`, `8`, `12`],
      answer: 1,
      explain: `max f = 2·6 + 4 − 10 = 6; −g = 3 − x<sub>3</sub> ≤ 3 (x<sub>3</sub> = 0 iken). Ortak M ≥ max(6, 3) = <b>6</b>. M = 3 olsaydı f ≤ 3 (1 − y) y = 0 için f ≤ 3 verir ve f = 6 olan feasible noktalar (x<sub>3</sub> ≥ 3 sağlanıyorsa) kesilirdi. (Ayrı M'ler kullanılırsa M<sub>1</sub> = 3, M<sub>2</sub> = 6 daha sıkıdır.)`,
    },
    {
      q: `"x<sub>A</sub> = 1 ise x<sub>B</sub> = 1" (iki binary) if-then koşulunu f = x<sub>A</sub>, g = x<sub>B</sub> − 1, M = 1 ile modelleyip kısıtları taraf tarafa toplayınca hangi kısıta ulaşılır?`,
      options: [`x<sub>A</sub> ≤ x<sub>B</sub>`, `x<sub>A</sub> + x<sub>B</sub> ≤ 1`, `x<sub>A</sub> + x<sub>B</sub> ≥ 1`, `x<sub>A</sub> = x<sub>B</sub>`],
      answer: 0,
      explain: `(1) −g = 1 − x<sub>B</sub> ≤ y, (2) x<sub>A</sub> ≤ 1 − y. Toplayınca 1 − x<sub>B</sub> + x<sub>A</sub> ≤ 1 ⇒ <b>x<sub>A</sub> ≤ x<sub>B</sub></b>. x<sub>A</sub> + x<sub>B</sub> ≤ 1 "ikisi birlikte olamaz" demektir; x<sub>A</sub> = x<sub>B</sub> ise iki yönlü (eşdeğerlik) daha güçlü bir koşuldur.`,
    },
    {
      q: `If-then formülasyonunda (−g ≤ M y, f ≤ M (1 − y)) hangileri doğrudur?`,
      options: [
        `f &gt; 0 ise (2) nedeniyle y = 0 olmak zorundadır.`,
        `y = 0 iken (1) kısıtı g ≥ 0 anlamına gelir.`,
        `f ≤ 0 iken y = 1 seçilebilir ve bu durumda g üzerinde fiilen kısıt kalmaz (M yeterince büyükse).`,
        `f &gt; 0 iken g'nin negatif olabilmesi için y = 1 seçilmelidir.`,
      ],
      answer: [0, 1, 2],
      explain: `f &gt; 0 ⇒ (2) y = 1'i yasaklar ⇒ y = 0 ⇒ (1) g ≥ 0. f ≤ 0 iken y = 1 ile (2) sağlanır ve (1) −g ≤ M ile bağlayıcı olmaz. Son seçenek yanlıştır: f &gt; 0 iken y = 1 seçilemez, bu yüzden g negatif olamaz.`,
    },
  ];

  /* ====================================================================== 1.6 */
  OR.content.summaries['1.6'] = `
<h2>1.6 Membership in Specified Subsets — Set Covering / Packing / Partitioning</h2>
<p>Bu modeller, nesnelerin belirli alt kümelere <b>üyeliği</b> ile ilgilenir. Karar değişkeni x<sub>j</sub> = 1 eğer nesne/alt küme j çözümün parçasıysa, 0 değilse. Uygulamalar: yer seçimi (fire/police station, warehouse), çizelgeleme (crew, airline, truck, bus), dağıtım, vehicle routing, political districting, capital budgeting.</p>
<table>
  <tr><th>Model</th><th>Her eleman...</th><th>Kısıt (her eleman için)</th></tr>
  <tr><td><b>Set covering</b></td><td><b>en az</b> bir alt kümede yer almalı</td><td>Σ<sub>j∈J</sub> x<sub>j</sub> ≥ 1</td></tr>
  <tr><td><b>Set packing</b></td><td><b>en fazla</b> bir alt kümede yer almalı</td><td>Σ<sub>j∈J</sub> x<sub>j</sub> ≤ 1</td></tr>
  <tr><td><b>Set partitioning</b></td><td><b>tam</b> bir alt kümede yer almalı</td><td>Σ<sub>j∈J</sub> x<sub>j</sub> = 1</td></tr>
</table>

<h3>Example 9 — Fire Station (set covering)</h3>
<p>Bir ilçe 11 şehirden oluşuyor. İtfaiye istasyonu herhangi bir şehre kurulabilir; kendi şehrine ve <b>komşu</b> (sınırı sıfırdan farklı) şehirlere hizmet verir. Minimum kaç istasyon ve nereye?</p>
<p>x<sub>j</sub> = 1 eğer şehir j'ye istasyon kurulursa. Her şehir için: "ya o şehirde ya da komşularından birinde istasyon olmalı".</p>
<div class="model">min x<sub>1</sub> + x<sub>2</sub> + ⋯ + x<sub>11</sub>
şehir 1:  x<sub>1</sub>+x<sub>2</sub>+x<sub>3</sub>+x<sub>4</sub> ≥ 1             şehir 7:  x<sub>4</sub>+x<sub>6</sub>+x<sub>7</sub>+x<sub>8</sub> ≥ 1
şehir 2:  x<sub>1</sub>+x<sub>2</sub>+x<sub>3</sub>+x<sub>5</sub> ≥ 1             şehir 8:  x<sub>5</sub>+x<sub>6</sub>+x<sub>7</sub>+x<sub>8</sub>+x<sub>9</sub>+x<sub>10</sub> ≥ 1
şehir 3:  x<sub>1</sub>+x<sub>2</sub>+x<sub>3</sub>+x<sub>4</sub>+x<sub>5</sub>+x<sub>6</sub> ≥ 1       şehir 9:  x<sub>5</sub>+x<sub>8</sub>+x<sub>9</sub>+x<sub>10</sub>+x<sub>11</sub> ≥ 1
şehir 4:  x<sub>1</sub>+x<sub>3</sub>+x<sub>4</sub>+x<sub>6</sub>+x<sub>7</sub> ≥ 1         şehir 10: x<sub>8</sub>+x<sub>9</sub>+x<sub>10</sub>+x<sub>11</sub> ≥ 1
şehir 5:  x<sub>2</sub>+x<sub>3</sub>+x<sub>5</sub>+x<sub>6</sub>+x<sub>8</sub>+x<sub>9</sub> ≥ 1       şehir 11: x<sub>9</sub>+x<sub>10</sub>+x<sub>11</sub> ≥ 1
şehir 6:  x<sub>3</sub>+x<sub>4</sub>+x<sub>5</sub>+x<sub>6</sub>+x<sub>7</sub>+x<sub>8</sub> ≥ 1
x<sub>j</sub> = 0 or 1</div>
<p>Kısıt matrisinin <b>j. kolonu</b>, j şehrindeki bir istasyonun hizmet verebildiği şehirler kümesini gösterir. Amaç, tüm şehirleri kapsayan en az sayıda alt küme seçmektir. (Örn. x<sub>3</sub>, x<sub>8</sub>, x<sub>9</sub> = 1 ile 3 istasyon yeterlidir; 2 istasyon yetmez.)</p>

<h3>Example 10 — Timetable Scheduling (partitioning + packing)</h3>
<p>Bir IE bölümünde Pazartesi günü 4 ders 3 sınıfa atanacak; gün 2 döneme (sabah/öğleden sonra) bölünmüş.</p>
<p>x<sub>ijk</sub> = 1 eğer ders i, sınıf j'ye, dönem k'da atanırsa (i = 1..4, j = 1..3, k = 1..2 → 24 değişken).</p>
<ul>
  <li>Her ders <b>tam bir</b> (sınıf, dönem) çiftine atanır → <b>set partitioning</b>, 4 kısıt: x<sub>i11</sub>+x<sub>i12</sub>+x<sub>i21</sub>+x<sub>i22</sub>+x<sub>i31</sub>+x<sub>i32</sub> = 1 (i = 1..4).</li>
  <li>Her (sınıf, dönem) için <b>en fazla bir</b> ders → <b>set packing</b>, 6 kısıt: örn. room 1 – morning: x<sub>111</sub>+x<sub>211</sub>+x<sub>311</sub>+x<sub>411</sub> ≤ 1.</li>
  <li>Amaç fonksiyonu problemde belirtilmemiştir ("max f (or any other objective function)").</li>
</ul>

<div class="warnbox"><b>Sınav tuzakları (1.6):</b>
<ul>
  <li><b>≥ 1 covering, ≤ 1 packing, = 1 partitioning</b>. Partitioning = covering + packing (hem en az hem en fazla bir).</li>
  <li>Set packing'de x = 0 vektörü daima feasible'dır; amaç fonksiyonu (max) olmazsa trivial çözüm çıkar.</li>
  <li>Covering'de tüm x = 1 çözümü (her eleman en az bir kümede ise) daima feasible'dır; partitioning ise infeasible olabilir.</li>
  <li>Fire station'da kısıtları "=" yazmak yanlıştır; her şehir <i>en az</i> bir istasyon tarafından kapsanmalıdır (komşuların ikisinde de istasyon olabilir).</li>
  <li>Kısıt matrisinin <b>satırı</b> = eleman (şehir), <b>kolonu</b> = seçilen alt küme (istasyon).</li>
  <li>Timetable'da indeks sırası x<sub>ijk</sub> = (ders, sınıf, dönem): "room 2 – afternoon" için j = 2, k = 2 ⇒ x<sub>i22</sub>'ler toplanır.</li>
</ul></div>
`;

  OR.content.concepts['1.6'] = [
    {
      q: `Timetable örneğinde "her ders <b>tam olarak bir</b> sınıfa ve tam olarak bir döneme atanmalıdır" kısıtları hangi tür?`,
      options: [`Set covering (≥ 1)`, `Set packing (≤ 1)`, `Set partitioning (= 1)`, `Fixed charge`],
      answer: 2,
      explain: `Her eleman (ders) kümelerden <b>tam birinde</b> bulunmalı: Σ x<sub>ijk</sub> = 1 → set partitioning. Covering "en az bir", packing "en fazla bir" demektir.`,
    },
    {
      q: `Timetable örneğinde "bir sınıfta, belirli bir dönemde <b>en fazla bir</b> ders yapılabilir" kısıtları hangi tür?`,
      options: [`Set covering`, `Set packing`, `Set partitioning`, `Either-or`],
      answer: 1,
      explain: `Her (sınıf, dönem) kaynağı en fazla bir ders tarafından kullanılabilir: Σ<sub>i</sub> x<sub>ijk</sub> ≤ 1 → <b>set packing</b>. Bu tür kısıtlardan 3 sınıf × 2 dönem = 6 tane vardır.`,
    },
    {
      q: `Fire station örneğinde (11 şehir) şehir 7'nin kapsanma kısıtı hangisidir? (Şehir 7'nin komşuları: 4, 6, 8.)`,
      options: [
        `x<sub>4</sub> + x<sub>6</sub> + x<sub>7</sub> + x<sub>8</sub> ≥ 1`,
        `x<sub>4</sub> + x<sub>6</sub> + x<sub>8</sub> ≥ 1`,
        `x<sub>4</sub> + x<sub>6</sub> + x<sub>7</sub> + x<sub>8</sub> = 1`,
        `x<sub>4</sub> + x<sub>6</sub> + x<sub>7</sub> + x<sub>8</sub> ≤ 1`,
      ],
      answer: 0,
      explain: `Şehir 7 kendi istasyonuyla (x<sub>7</sub>) veya komşularındaki istasyonlarla (x<sub>4</sub>, x<sub>6</sub>, x<sub>8</sub>) kapsanır; kısıt bir <b>set covering</b> kısıtıdır: ≥ 1. Kendi şehrini (x<sub>7</sub>) listeden çıkarmak yanlıştır. "=" ve "≤" kapsamayı sınırlar (partitioning/packing).`,
    },
    {
      q: `Fire station örneğinde x<sub>5</sub> (şehir 5'te istasyon) hangi şehirlerin kapsanma kısıtlarında yer alır? (Şehir 5'in komşuları: 2, 3, 6, 8, 9.)`,
      options: [
        `Şehir 2, 3, 5, 6, 8, 9`,
        `Yalnızca şehir 5`,
        `Şehir 1, 2, 3, 4, 5, 6`,
        `Tüm şehirler`,
      ],
      answer: 0,
      explain: `x<sub>5</sub>'in kolonu, şehir 5'teki istasyonun hizmet verebildiği şehirler kümesidir: kendisi (5) ve komşuları 2, 3, 6, 8, 9. Yani x<sub>5</sub>, bu 6 şehrin kısıtında 1 katsayısıyla yer alır.`,
    },
    {
      q: `Fire station problemi için <b>minimum</b> istasyon sayısı kaçtır?`,
      options: [`2`, `3`, `4`, `5`],
      answer: 1,
      explain: `x<sub>3</sub> (şehir 1–6'yı), x<sub>8</sub> (şehir 5–10'u) ve x<sub>9</sub> (şehir 11'i) seçilince tüm şehirler kapsanır: 3 istasyon yeterlidir. Bir istasyon en fazla 6 şehri kapsar ve iki istasyonun hiçbir çifti 11 şehrin tamamını kapsamaz (tüm çiftler denendiğinde en iyi kapsama 11'in altında kalır), dolayısıyla minimum <b>3</b>'tür (birden fazla alternatif optimum vardır, örn. {3, 8, 9}, {1, 4, 9}).`,
    },
    {
      q: `Timetable örneğinde (4 ders, 3 sınıf, 2 dönem) x<sub>ijk</sub> modelinde kaç değişken, kaç partitioning ve kaç packing kısıtı vardır?`,
      options: [
        `24 değişken, 4 partitioning, 6 packing`,
        `24 değişken, 6 partitioning, 4 packing`,
        `9 değişken, 4 partitioning, 6 packing`,
        `24 değişken, 4 partitioning, 12 packing`,
      ],
      answer: 0,
      explain: `Değişken sayısı 4 × 3 × 2 = 24. Her ders için bir "= 1" kısıtı → 4 partitioning kısıtı. Her (sınıf, dönem) için bir "≤ 1" kısıtı → 3 × 2 = 6 packing kısıtı.`,
    },
    {
      q: `Timetable örneğinde "sınıf 2 – öğleden sonra" (dönem 2) için set packing kısıtı hangisidir? (x<sub>ijk</sub>: i = ders, j = sınıf, k = dönem)`,
      options: [
        `x<sub>122</sub> + x<sub>222</sub> + x<sub>322</sub> + x<sub>422</sub> ≤ 1`,
        `x<sub>221</sub> + x<sub>222</sub> + x<sub>223</sub> + x<sub>224</sub> ≤ 1`,
        `x<sub>112</sub> + x<sub>212</sub> + x<sub>312</sub> + x<sub>412</sub> ≤ 1`,
        `x<sub>122</sub> + x<sub>222</sub> + x<sub>322</sub> + x<sub>422</sub> = 1`,
      ],
      answer: 0,
      explain: `Sınıf j = 2, dönem k = 2 sabit; dersler i = 1..4 üzerinden toplanır: x<sub>i22</sub>. Üçüncü seçenek sınıf 1 – öğleden sonra'dır (j = 1). İkinci seçenek ise indeks sırasını karıştırır (ders 2 için tüm sınıf-dönem kombinasyonları değil). "= 1" ise packing değil partitioning olurdu.`,
    },
    {
      q: `Set covering, packing ve partitioning hakkında hangileri doğrudur?`,
      options: [
        `Covering: her eleman en az bir alt kümede (≥ 1); packing: en fazla bir (≤ 1); partitioning: tam bir (= 1).`,
        `Partitioning kısıtı, covering ve packing kısıtlarının birlikte uygulanması demektir.`,
        `Set packing'de tüm değişkenlerin 0 olması her zaman feasible'dır.`,
        `Set covering'de kısıtlar "=" ile yazılır.`,
      ],
      answer: [0, 1, 2],
      explain: `Tanımlar notlardaki gibidir. "= 1", "≥ 1" ve "≤ 1"in birleşimidir. Packing kısıtlarında Σ x ≤ 1 olduğundan x = 0 vektörü feasible'dır (bu yüzden amaç fonksiyonu önemlidir). Covering kısıtları "≥ 1" ile yazılır, "=" ile değil.`,
    },
    {
      q: `Fire station modelinde tüm kapsanma kısıtlarını yanlışlıkla "= 1" olarak yazarsak ne olur?`,
      options: [
        `Problem daha kısıtlı (set partitioning) olur; her şehir tam bir istasyon tarafından kapsanmak zorunda kalır, optimum değer iyileşemez, kötüleşebilir veya model infeasible olabilir.`,
        `Hiçbir şey değişmez.`,
        `Optimum çözüm daha iyi (daha az istasyon) olur.`,
        `Model bir LP'ye dönüşür.`,
      ],
      answer: 0,
      explain: `"= 1" daha kısıtlı bir feasible bölge demektir: "≥ 1"in alt kümesidir. Min problemde amaç değeri iyileşemez; çözüm kötüleşebilir (daha fazla istasyon gerekebilir) veya hiç feasible çözüm kalmayabilir. Örneğin {3, 8, 9} çözümünde şehir 5 ve 6 hem x<sub>3</sub> hem x<sub>8</sub> ile kapsanır; "= 1" bunu yasaklar. (Bu özel örnekte {2, 7, 11} her şehri tam bir kez kapsadığından partitioning de feasible ve optimum yine 3'tür; genel kural yine de "daha kısıtlı"dır.)`,
    },
    {
      q: `Fire station'da fire/police station, warehouse yer seçimi gibi "her müşteri/şehir en az bir tesisle kapsanmalı" tipi problemlerde hangi modelleme kullanılır?`,
      options: [`Set covering (min Σ x<sub>j</sub>, her kısıt ≥ 1)`, `Set packing (max, her kısıt ≤ 1)`, `Knapsack`, `TSP/MTZ`],
      answer: 0,
      explain: `Notlara göre yer seçimi (facility, fire/police station, warehouse) tipik set covering uygulamasıdır: her talep noktası en az bir tesis tarafından kapsanmalıdır ve amaç tesis sayısını (veya maliyeti) minimize etmektir.`,
    },
  ];

  /* ====================================================================== 1.7 */
  OR.content.summaries['1.7'] = `
<h2>1.7 Traveling Salesperson Problem (TSP) — Formülasyon</h2>
<p>N şehir ve şehirler arası maliyetler (mesafeler) verilmiş; her şehri <b>bir kez</b> ziyaret edip başlangıç şehrine dönen en ucuz tur (tour) nedir? Başlayıp aynı şehirde biten ve her şehri bir kez ziyaret eden güzergâha <b>tour</b> denir.</p>
<p>c<sub>ij</sub> = i'den j'ye mesafe (i ≠ j), <b>c<sub>ii</sub> = M</b> (gerçek mesafelere göre çok büyük). x<sub>ij</sub> = 1 eğer şehir i'den j'ye gidilirse, 0 değilse.</p>
<div class="model">min  Σ<sub>i</sub> Σ<sub>j</sub> c<sub>ij</sub> x<sub>ij</sub>
s.t. Σ<sub>i</sub> x<sub>ij</sub> = 1             ∀ j        (her şehre bir kez varılır)
     Σ<sub>j</sub> x<sub>ij</sub> = 1             ∀ i        (her şehirden bir kez çıkılır)
     u<sub>i</sub> − u<sub>j</sub> + N x<sub>ij</sub> ≤ N − 1     i ≠ j;  i, j &gt; 1     (subtour elimination, MTZ)
     x<sub>ij</sub> = 0 or 1,   u<sub>i</sub> ≥ 0</div>
<ul>
  <li>İlk iki grup kısıt <b>assignment</b> kısıtlarıdır (2N tane). Tek başlarına çözüm <b>subtour</b>'lar içerebilir.</li>
  <li>Üçüncü grup (<b>Miller–Tucker–Zemlin</b>) subtour'ları engeller: subtour içeren her x<sub>ij</sub> kümesi infeasible, tur oluşturan her küme feasible olur. u<sub>i</sub> şehir i'nin turdaki sırasını temsil eder; kısıtlar yalnızca <b>1. şehir dışındaki</b> şehir çiftleri (i, j &gt; 1) için yazılır ⇒ (N − 1)(N − 2) kısıt.</li>
  <li>c<sub>ii</sub> = M, x<sub>ii</sub> = 1 (kendi kendine gitme, tek şehirlik subtour) seçeneğini maliyetle dışlar.</li>
</ul>

<h3>Notlardaki örnek (N = 5)</h3>
<p>Assignment çözümü iki subtour verebilir: <b>1-5-2-1</b> ve <b>3-4-3</b> (1 numaralı şehri içermeyen subtour). 1'i içermeyen subtour için:</p>
<div class="model">u<sub>3</sub> − u<sub>4</sub> + 5 x<sub>34</sub> ≤ 4
u<sub>4</sub> − u<sub>3</sub> + 5 x<sub>43</sub> ≤ 4
toplayınca:  5 (x<sub>34</sub> + x<sub>43</sub>) ≤ 8   ⇒   x<sub>34</sub> = x<sub>43</sub> = 1 olamaz (10 ≤ 8 çelişir)</div>
<p>Sezgi: x<sub>ij</sub> = 1 ise kısıt u<sub>j</sub> ≥ u<sub>i</sub> + 1 olur (sıralama artar). Bir döngüde bu sıralama kendini aşamaz; x<sub>ij</sub> = 0 iken (u'lar 1..N−1 aralığındaysa) kısıt boştur.</p>
<p>Notlar ayrıca şunu vurgular: TSP'yi çözen IP formülasyonu büyük TSP'lerde <b>hantal ve verimsizdir</b>; B&amp;B ile çok şehirli TSP'lerde çok uzun süre gerekebilir, bu yüzden hızlı ve iyi (ama optimal olması şart olmayan) çözümler veren <b>heuristic</b>'ler (2.7) sıkça kullanılır.</p>

<div class="warnbox"><b>Sınav tuzakları (1.7):</b>
<ul>
  <li>Assignment kısıtları (her şehre bir giriş, her şehirden bir çıkış) <b>yetmez</b>: 1-5-2-1 ve 3-4-3 gibi subtour'lar da bunları sağlar.</li>
  <li>MTZ kısıtları <b>i, j &gt; 1</b> için yazılır; 1. şehir dahil edilmez. 1'i içeren tek tur serbesttir. Sayı: (N−1)(N−2) (N = 5 için 12).</li>
  <li>Kısıtın N katsayısı ve sağ taraf N − 1: x<sub>ij</sub> = 1 ⇒ u<sub>j</sub> ≥ u<sub>i</sub> + 1.</li>
  <li>c<sub>ii</sub> = M: kendine-döngüyü engeller (diagonal maliyet çok büyük).</li>
  <li>x<sub>ij</sub> yönlüdür (i'den j'ye); x<sub>34</sub> ile x<sub>43</sub> ayrı değişkenlerdir ve 3-4-3 subtour'u ikisinin birden 1 olmasıyla oluşur.</li>
  <li>MTZ polinomsal sayıda kısıt kullanır (tüm alt kümeler için 2<sup>N</sup> kısıt gerekmez).</li>
</ul></div>
`;

  OR.content.concepts['1.7'] = [
    {
      q: `TSP formülasyonunda c<sub>ii</sub> = M (çok büyük) alınmasının amacı nedir?`,
      options: [
        `x<sub>ii</sub> = 1 (bir şehirden yine kendisine gitme) seçeneğinin minimizasyonda seçilmesini engellemek`,
        `Subtour'ları engellemek`,
        `Başlangıç şehrini belirlemek`,
        `x<sub>ij</sub> değişkenlerini integer yapmak`,
      ],
      answer: 0,
      explain: `Assignment kısıtları x<sub>ii</sub> = 1'e izin verir (şehir i'ye varıp aynı şehirden çıkmış sayılır, tek şehirlik subtour). c<sub>ii</sub> = M ile bu maliyetli hale gelir ve minimizasyonda seçilmez. Subtour'ları genel olarak engelleyen MTZ kısıtlarıdır.`,
    },
    {
      q: `N = 5 şehirli TSP'de assignment kısıtlarının sayısı kaçtır (Σ<sub>i</sub>x<sub>ij</sub> = 1 ∀ j ve Σ<sub>j</sub>x<sub>ij</sub> = 1 ∀ i)?`,
      options: [`5`, `10`, `20`, `25`],
      answer: 1,
      explain: `Her şehir için bir "varış" (Σ<sub>i</sub> x<sub>ij</sub> = 1) ve bir "çıkış" (Σ<sub>j</sub> x<sub>ij</sub> = 1) kısıtı vardır: 5 + 5 = <b>10</b> (= 2N). 25 = N² değişken sayısıdır (diyagonal dahil).`,
    },
    {
      q: `N = 5 şehirli TSP'de MTZ subtour elimination kısıtı (u<sub>i</sub> − u<sub>j</sub> + N x<sub>ij</sub> ≤ N − 1, i ≠ j, i, j &gt; 1) kaç adet yazılır?`,
      options: [`12`, `20`, `16`, `25`],
      answer: 0,
      explain: `i ve j ∈ {2, 3, 4, 5} ve i ≠ j: 4 × 3 = <b>12</b> kısıt, yani (N − 1)(N − 2). 20 = N(N − 1) tüm sıralı çiftler olurdu (1. şehir dahil); 16 = 4·4 (i = j dahil) olurdu.`,
    },
    {
      q: `5 şehirli bir TSP'de aşağıdaki x çözümlerinden hangisi <b>assignment kısıtlarını sağlar ama tur değildir</b> (subtour içerir)?`,
      options: [
        `x<sub>15</sub> = x<sub>52</sub> = x<sub>21</sub> = 1 ve x<sub>34</sub> = x<sub>43</sub> = 1 (diğerleri 0)`,
        `x<sub>12</sub> = x<sub>23</sub> = x<sub>34</sub> = x<sub>45</sub> = x<sub>51</sub> = 1 (diğerleri 0)`,
        `x<sub>13</sub> = x<sub>35</sub> = x<sub>52</sub> = x<sub>24</sub> = x<sub>41</sub> = 1 (diğerleri 0)`,
        `x<sub>12</sub> = x<sub>24</sub> = x<sub>45</sub> = x<sub>53</sub> = x<sub>31</sub> = 1 (diğerleri 0)`,
      ],
      answer: 0,
      explain: `İlk seçenekte her şehre bir kez varılıp her şehirden bir kez çıkılır, ama güzergâh 1-5-2-1 ve 3-4-3 olmak üzere <b>iki ayrı döngüdür</b> (notlardaki örnek). Diğer üç seçenek tek bir turdur: 1-2-3-4-5-1, 1-3-5-2-4-1 ve 1-2-4-5-3-1.`,
    },
    {
      q: `N = 5 için 3-4-3 subtour'unu elemek amacıyla u<sub>3</sub> − u<sub>4</sub> + 5x<sub>34</sub> ≤ 4 ve u<sub>4</sub> − u<sub>3</sub> + 5x<sub>43</sub> ≤ 4 yazılır. Taraf tarafa toplayınca ne elde edilir ve x<sub>34</sub> = x<sub>43</sub> = 1 için ne olur?`,
      options: [
        `5 (x<sub>34</sub> + x<sub>43</sub>) ≤ 8; x<sub>34</sub> = x<sub>43</sub> = 1 olursa 10 ≤ 8 çelişkisi doğar, yani bu subtour imkânsızdır.`,
        `u<sub>3</sub> + u<sub>4</sub> ≤ 8; hiçbir sonuç çıkmaz.`,
        `5 (x<sub>34</sub> + x<sub>43</sub>) ≤ 4; yalnızca biri 1 olabilir.`,
        `5 (x<sub>34</sub> + x<sub>43</sub>) ≥ 8; ikisi de 1 olmak zorundadır.`,
      ],
      answer: 0,
      explain: `u<sub>3</sub> ve u<sub>4</sub> toplamda sadeleşir: 5x<sub>34</sub> + 5x<sub>43</sub> ≤ 8. x<sub>34</sub> = x<sub>43</sub> = 1 olsaydı sol taraf 10 &gt; 8 olurdu ⇒ infeasible. Yani 3-4-3 subtour'u dışlanır. (Biri 1 olabilir: 5 ≤ 8.) Bu, MTZ'nin subtour'ları nasıl elediğinin notlardaki örneğidir.`,
    },
    {
      q: `MTZ kısıtları neden yalnızca i, j &gt; 1 (1. şehir hariç) çiftleri için yazılır?`,
      options: [
        `1. şehir başlangıç noktası olduğu için 1'i içeren tek tur serbest bırakılır; 1'i içermeyen her subtour elenir.`,
        `1. şehre hiç gidilmediği için`,
        `u<sub>1</sub> negatif olabileceği için`,
        `1. şehir için assignment kısıtları yazıldığından MTZ ek olarak zorunludur`,
      ],
      answer: 0,
      explain: `Başlangıç şehri 1'dir; 1'i içeren döngü geçerli olmalıdır (u<sub>1</sub> için sıralama kısıtı yazılmaz). MTZ kısıtları 1'i <b>içermeyen</b> her döngüyü (subtour) imkânsız kılar. Assignment kısıtlarıyla birlikte 1'i içermeyen hiçbir döngü kalmazsa, 1'i içeren döngü tüm şehirleri kapsamak zorundadır, yani tek bir tur elde edilir.`,
    },
    {
      q: `N = 5 ve tur 1 → 3 → 5 → 2 → 4 → 1 olsun. u<sub>3</sub>, u<sub>5</sub>, u<sub>2</sub>, u<sub>4</sub> değerleri için MTZ kısıtını (x<sub>ij</sub> = 1 olan yaylarda u<sub>j</sub> ≥ u<sub>i</sub> + 1) sağlayan atama hangisidir?`,
      options: [
        `u<sub>3</sub> = 1, u<sub>5</sub> = 2, u<sub>2</sub> = 3, u<sub>4</sub> = 4`,
        `u<sub>3</sub> = 4, u<sub>5</sub> = 3, u<sub>2</sub> = 2, u<sub>4</sub> = 1`,
        `u<sub>3</sub> = 1, u<sub>5</sub> = 1, u<sub>2</sub> = 1, u<sub>4</sub> = 1`,
        `u<sub>3</sub> = 2, u<sub>5</sub> = 1, u<sub>2</sub> = 4, u<sub>4</sub> = 3`,
      ],
      answer: 0,
      explain: `1'i içermeyen yaylar: 3→5, 5→2, 2→4. Her biri için u<sub>j</sub> ≥ u<sub>i</sub> + 1 gerekir: u<sub>5</sub> ≥ u<sub>3</sub> + 1, u<sub>2</sub> ≥ u<sub>5</sub> + 1, u<sub>4</sub> ≥ u<sub>2</sub> + 1. Ziyaret sırası (1, 2, 3, 4) bunu sağlar. Ters sıra ve eşit değerler bu kısıtları bozar; son seçenekte u<sub>5</sub> = 1 &lt; u<sub>3</sub> + 1 = 3 olur.`,
    },
    {
      q: `Notlardaki TSP formülasyonu hakkında hangileri doğrudur?`,
      options: [
        `Assignment kısıtları yalnızca her şehre bir kez varılmasını ve her şehirden bir kez çıkılmasını sağlar; subtour'ları engellemez.`,
        `Subtour elimination için MTZ tipi kısıtlar kullanılır: u<sub>i</sub> − u<sub>j</sub> + N x<sub>ij</sub> ≤ N − 1 (i ≠ j; i, j &gt; 1).`,
        `Bu IP formülasyonu büyük TSP'lerde de verimlidir; bu yüzden heuristic'lere ihtiyaç yoktur.`,
        `Her olası subtour için ayrı bir kısıt yazmak zorunludur (2<sup>N</sup> mertebesinde).`,
      ],
      answer: [0, 1],
      explain: `Notlar: assignment kısıtları subtour'ları elemez, MTZ kısıtları u<sub>i</sub> değişkenleriyle polinomsal sayıda kısıtla bunu yapar. Formülasyonun büyük TSP'lerde <b>hantal ve verimsiz</b> olduğu, bu yüzden heuristic'lerin sıkça kullanıldığı özellikle vurgulanır.`,
    },
    {
      q: `TSP modelinde x<sub>ij</sub> değişkeninin anlamı nedir ve x<sub>34</sub> ile x<sub>43</sub> aynı değişken midir?`,
      options: [
        `x<sub>ij</sub> = 1 eğer i'den j'ye gidilirse; x<sub>34</sub> ve x<sub>43</sub> farklı (yönlü) değişkenlerdir.`,
        `x<sub>ij</sub> = i ile j arasındaki mesafe; aynı değişkenlerdir.`,
        `x<sub>ij</sub> = 1 eğer i ve j aynı turdaysa; aynı değişkenlerdir.`,
        `x<sub>ij</sub> = i'nin turdaki sırasıdır.`,
      ],
      answer: 0,
      explain: `Notlarda x<sub>ij</sub> = 1 ise i'den j'ye gidilir; yaylar yönlüdür. x<sub>34</sub> = x<sub>43</sub> = 1 olması 3-4-3 subtour'unu verir, MTZ bunu eler. Mesafe c<sub>ij</sub>, sıra ise u<sub>i</sub>'dir.`,
    },
  ];

  /* ====================================================================== 1.8 */
  OR.content.summaries['1.8'] = `
<h2>1.8 Piecewise Linear Functions</h2>
<p><b>Piecewise linear</b> fonksiyon birkaç doğru parçasından oluşur; eğimin değiştiği noktalara <b>break point</b> denir. Doğrusal olmadığı için doğrudan LP ile çözülemez; ancak 0-1 değişkenlerle doğrusal biçimde gösterilebilir.</p>

<h3>Genel formülasyon (break points b<sub>1</sub>, …, b<sub>n</sub>)</h3>
<div class="model">Adım 1: f(x) yerine  z<sub>1</sub> f(b<sub>1</sub>) + z<sub>2</sub> f(b<sub>2</sub>) + ⋯ + z<sub>n</sub> f(b<sub>n</sub>)  yaz.
Adım 2: ekle
   z<sub>1</sub> ≤ y<sub>1</sub>,  z<sub>2</sub> ≤ y<sub>1</sub> + y<sub>2</sub>,  z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub>, …,  z<sub>n−1</sub> ≤ y<sub>n−2</sub> + y<sub>n−1</sub>,  z<sub>n</sub> ≤ y<sub>n−1</sub>
   y<sub>1</sub> + y<sub>2</sub> + ⋯ + y<sub>n−1</sub> = 1
   z<sub>1</sub> + z<sub>2</sub> + ⋯ + z<sub>n</sub> = 1
   x = z<sub>1</sub> b<sub>1</sub> + z<sub>2</sub> b<sub>2</sub> + ⋯ + z<sub>n</sub> b<sub>n</sub>
   y<sub>i</sub> = 0 or 1 (i = 1..n−1);   z<sub>i</sub> ≥ 0 (i = 1..n)</div>
<ul>
  <li>n break point ⇒ <b>n tane z (ağırlık, ≥ 0)</b> ve <b>n − 1 tane y (binary, segment seçici)</b>.</li>
  <li>y<sub>i</sub> = 1 ise yalnızca <b>z<sub>i</sub> ve z<sub>i+1</sub></b> (komşu iki break point) pozitif olabilir, diğer z'ler 0'dır. Böylece x, [b<sub>i</sub>, b<sub>i+1</sub>] segmentinde konveks kombinasyonla ifade edilir.</li>
  <li>(Machine tool örneğinde aynı yapı λ (ağırlık) ve z (binary) isimleriyle yazılır.)</li>
</ul>

<h3>Example 14 — Euing Gas (Winston)</h3>
<p>Gas 1 (≥ %50 oil 1, satış 12¢) ve gas 2 (≥ %60 oil 1, satış 14¢) iki yağdan üretilir. Mevcut: 500 gal oil 1, 1000 gal oil 2. En fazla 1500 gal daha oil 1 alınabilir: ilk 500 gal 25¢, sonraki 500 gal 20¢, sonraki 500 gal 15¢. Maksimum kâr (gelir − satın alma)?</p>
<div class="model">x = satın alınan oil 1;  x<sub>ij</sub> = gas j için kullanılan oil i
z = 12(x<sub>11</sub>+x<sub>21</sub>) + 14(x<sub>12</sub>+x<sub>22</sub>) − c(x)
        ⎧ 25x            0 ≤ x ≤ 500
c(x) =  ⎨ 20x + 2500   500 ≤ x ≤ 1000
        ⎩ 15x + 7500  1000 ≤ x ≤ 1500
Break point'ler: 0, 500, 1000, 1500;  c(0)=0, c(500)=12 500, c(1000)=22 500, c(1500)=30 000
c(x) = z<sub>1</sub>c(0) + z<sub>2</sub>c(500) + z<sub>3</sub>c(1000) + z<sub>4</sub>c(1500)
x = 0z<sub>1</sub> + 500z<sub>2</sub> + 1000z<sub>3</sub> + 1500z<sub>4</sub>
z<sub>1</sub> ≤ y<sub>1</sub>, z<sub>2</sub> ≤ y<sub>1</sub>+y<sub>2</sub>, z<sub>3</sub> ≤ y<sub>2</sub>+y<sub>3</sub>, z<sub>4</sub> ≤ y<sub>3</sub>
z<sub>1</sub>+z<sub>2</sub>+z<sub>3</sub>+z<sub>4</sub> = 1,   y<sub>1</sub>+y<sub>2</sub>+y<sub>3</sub> = 1,  y<sub>i</sub> binary, z<sub>i</sub> ≥ 0
Problem kısıtları:
 x<sub>11</sub> + x<sub>12</sub> ≤ x + 500      (oil 1 kullanımı)
 x<sub>21</sub> + x<sub>22</sub> ≤ 1000          (oil 2)
 0.5x<sub>11</sub> − 0.5x<sub>21</sub> ≥ 0       (gas 1 ≥ %50 oil 1)
 0.4x<sub>12</sub> − 0.6x<sub>22</sub> ≥ 0       (gas 2 ≥ %60 oil 1)</div>
<p><b>Sonuç:</b> z = 12 500 (¢) → kâr $125; x = 1000 gal oil 1 satın alınır (y<sub>2</sub> = z<sub>3</sub> = 1), toplam 2500 gal gas 2 üretilir (oil 1: 1500, oil 2: 1000).</p>
<p><b>Neden çalışır? (x = 800 örneği):</b> 500 ≤ 800 ≤ 1000 ⇒ yalnızca y<sub>2</sub> = 1 mümkün. Bu durumda z<sub>1</sub> = z<sub>4</sub> = 0, 800 = 500z<sub>2</sub> + 1000z<sub>3</sub>, z<sub>2</sub> + z<sub>3</sub> = 1 ⇒ z<sub>2</sub> = 2/5, z<sub>3</sub> = 3/5 ve c(800) = (2/5)c(500) + (3/5)c(1000) = 5000 + 13 500 = 18 500 (= 20·800 + 2500).</p>

<h3>Ne zaman binary'siz (basit) formülasyon yeter? — Dorian Auto</h3>
<p>$20 000 bütçe; her tam sayfa reklam $1 000. Inside Jocks (IJ): ads 1–6 → 10 000, 7–10 → 3 000, 11–15 → 2 500, 16+ → 0 exposure. Family Square (FS): ads 1–4 → 8 000, 5–12 → 6 000, 13–15 → 2 000, 16+ → 0. Exposure'ı maksimize et.</p>
<div class="model">x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> = IJ'de 10 000 / 3 000 / 2 500 exposure getiren reklam sayısı
y<sub>1</sub>, y<sub>2</sub>, y<sub>3</sub> = FS'de 8 000 / 6 000 / 2 000 exposure getiren reklam sayısı
max z = 10x<sub>1</sub> + 3x<sub>2</sub> + 2.5x<sub>3</sub> + 8y<sub>1</sub> + 6y<sub>2</sub> + 2y<sub>3</sub>   (bin exposure)
s.t. x<sub>1</sub>+x<sub>2</sub>+x<sub>3</sub>+y<sub>1</sub>+y<sub>2</sub>+y<sub>3</sub> ≤ 20     (bütçe, bin $)
     x<sub>1</sub> ≤ 6, x<sub>2</sub> ≤ 4, x<sub>3</sub> ≤ 5,  y<sub>1</sub> ≤ 4, y<sub>2</sub> ≤ 8, y<sub>3</sub> ≤ 3
     x<sub>i</sub>, y<sub>i</sub> ≥ 0 and integer</div>
<p>Optimum: z = 146 (146 000 exposure), x<sub>1</sub> = 6, x<sub>2</sub> = 2, y<sub>1</sub> = 4, y<sub>2</sub> = 8 → IJ'de 8, FS'de 12 reklam. Bu formülasyon, <b>diminishing returns</b> (sonraki reklamların getirisi azalan) olduğu için doğrudur: maksimizasyon, x<sub>2</sub>'nin ancak x<sub>1</sub> maksimumdayken pozitif olmasını kendiliğinden sağlar.</p>
<div class="box"><b>Kural:</b> Piecewise linear f(x)'in eğimi, x arttıkça karar verici açısından <b>daha az elverişli</b> hale geliyorsa (max'ta azalan getiri, min'de artan marjinal maliyet), binary'li tedious formülasyona gerek yoktur. Eğim <b>daha elverişli</b> hale geliyorsa (artan getiri / azalan marjinal maliyet) binary'li formülasyon (Euing Gas tarzı) zorunludur.</div>

<h3>Example 13 — Modified Dorian (artan getiri → basit formülasyon yanlış)</h3>
<p>IJ: ads 1–6 → 2 500, 7–10 → 3 000, 11–15 → 10 000; FS: ads 1–4 → 2 000, 5–12 → 6 000, 13–15 → 8 000. Dorian'daki gibi yazılırsa çözüm x<sub>3</sub> = 5, x<sub>2</sub> = 4, x<sub>1</sub> = 0, y<sub>3</sub> = 3, y<sub>2</sub> = 8, y<sub>1</sub> = 0 çıkar; bu <b>mantıksızdır</b> (10 000'lik reklamlar ilk 10 reklam alınmadan geçerli değildir). Çünkü artan getirili durumda maksimizasyon x<sub>i</sub>'nin ancak x<sub>i−1</sub> maksimumdayken pozitif olmasını sağlamaz. Doğru çözüm Euing Gas tarzı z/y formülasyonudur.</p>

<h3>Example 14 (ikinci) — Machine Tool Design (Bazaraa)</h3>
<p>Çelik mil tornalama: hız x<sub>1</sub> (600–800 rpm), depth feed x<sub>2</sub>, length feed x<sub>3</sub>; kesim süresi 36/(x<sub>2</sub>x<sub>3</sub>) minimize edilir; compression stress 30x<sub>1</sub> + 4500x<sub>2</sub> ≤ 150 000, side stress 40x<sub>1</sub> + 5000x<sub>2</sub> + 5000x<sub>3</sub> ≤ 100 000, sıcaklık 200 + 0.5x<sub>1</sub>² + 70x<sub>2</sub>³ + 150x<sub>3</sub> ≤ 800. Doğrusal yaklaşım:</p>
<ul>
  <li>36/(x<sub>2</sub>x<sub>3</sub>) minimum ⇔ x<sub>2</sub>x<sub>3</sub> maksimum. Bunun yerine <b>max min(x<sub>2</sub>, x<sub>3</sub>)</b>: δ tanımla, <b>max δ, x<sub>2</sub> ≥ δ, x<sub>3</sub> ≥ δ</b> (yaklaşıklık).</li>
  <li>Sıcaklıktaki doğrusal olmayan terimler f<sub>1</sub> = 0.5x<sub>1</sub>² ve f<sub>2</sub> = 70x<sub>2</sub>³ piecewise linear yapılır. x<sub>1</sub> ∈ [600, 800] 4 parçaya bölünür: break point'ler 600, 650, 700, 750, 800; f<sub>1</sub> = 180 000, 211 250, 245 000, 281 250, 320 000.</li>
</ul>
<div class="model">f<sub>1</sub> = 180000λ<sub>1</sub> + 211250λ<sub>2</sub> + 245000λ<sub>3</sub> + 281250λ<sub>4</sub> + 320000λ<sub>5</sub>
x<sub>1</sub> = 600λ<sub>1</sub> + 650λ<sub>2</sub> + 700λ<sub>3</sub> + 750λ<sub>4</sub> + 800λ<sub>5</sub>
λ<sub>1</sub>+…+λ<sub>5</sub> = 1;  λ<sub>1</sub> ≤ z<sub>1</sub>, λ<sub>2</sub> ≤ z<sub>1</sub>+z<sub>2</sub>, λ<sub>3</sub> ≤ z<sub>2</sub>+z<sub>3</sub>, λ<sub>4</sub> ≤ z<sub>3</sub>+z<sub>4</sub>, λ<sub>5</sub> ≤ z<sub>4</sub>
z<sub>1</sub>+z<sub>2</sub>+z<sub>3</sub>+z<sub>4</sub> = 1,  z<sub>i</sub> ∈ {0,1},  λ<sub>i</sub> ≥ 0</div>
<p>f<sub>2</sub> için x<sub>2</sub> ∈ [0, 2.26] (sıcaklık kısıtından [800/70]<sup>1/3</sup> ≈ 2.252) 4 parçaya bölünür ve aynı yapı α (ağırlık) ve k (binary) ile kurulur. Notlardaki f<sub>2</sub> tablosunda 4. nokta sırası (3.39 / 2727.08) bir baskı hatasına benziyor (tutarlı seri: 0, 0.565, 1.13, 1.695, 2.26). Daha fazla parça ⇒ daha iyi yaklaşıklık. Yorum olarak: max-min amaç da 36/(x<sub>2</sub>x<sub>3</sub>) ile aynı çözümü vermeyebilir (yalnızca bir yaklaşıklık).</p>
<p>Not (notlarda yok): f<sub>1</sub>, f<sub>2</sub> konveks ve "≤ 800" kısıtında yer aldığı için (eğim daha az elverişli hale geliyor) binary'ler aslında gerekmeyebilir; notlar genel (güvenli) formülasyonu kullanır.</p>

<div class="warnbox"><b>Sınav tuzakları (1.8):</b>
<ul>
  <li><b>Sayım:</b> n break point ⇒ n z (≥ 0) ve n − 1 y (binary). Euing'de 4 z ve 3 y; Machine tool'da 5 λ ve 4 z.</li>
  <li><b>Kenar kısıtlar:</b> z<sub>1</sub> ≤ y<sub>1</sub> ve z<sub>n</sub> ≤ y<sub>n−1</sub> (tek terim); aradakiler z<sub>i</sub> ≤ y<sub>i−1</sub> + y<sub>i</sub> (iki terim).</li>
  <li>Hem Σ z = 1 hem de Σ y = 1 yazılmalı; x ve f(x) aynı z ağırlıklarıyla ifade edilir.</li>
  <li>y<sub>i</sub> = 1 ⇒ [b<sub>i</sub>, b<sub>i+1</sub>] segmenti; yalnızca bitişik z<sub>i</sub>, z<sub>i+1</sub> pozitif olabilir.</li>
  <li>Eğim daha az elverişli hale geliyorsa (Dorian) binary gerekmez; <b>artan getiri / azalan marjinal maliyet</b> (Modified Dorian, Euing'in azalan alış fiyatı) varsa gerekir. Euing'de alış fiyatı azaldığı için (25¢ → 20¢ → 15¢) basit formülasyon yanlış olurdu.</li>
  <li>Dorian'da reklam sayısı (integer) bir sayım değişkenidir; Euing'deki z ağırlıkları ise sürekli (≥ 0) ve y binary'dir; karıştırma.</li>
  <li>c(x) değerlendirirken doğru segmenti bul: c(800) = 20·800 + 2500 = 18 500, c(1200) = 15·1200 + 7500 = 25 500.</li>
</ul></div>
`;

  OR.content.concepts['1.8'] = [
    {
      q: `Bir piecewise linear fonksiyonun <b>n</b> break point'i varsa, notlardaki z/y formülasyonunda kaç z (ağırlık) ve kaç y (binary) değişkeni kullanılır?`,
      options: [`n tane z, n − 1 tane y`, `n − 1 tane z, n tane y`, `n tane z, n tane y`, `n − 1 tane z, n − 1 tane y`],
      answer: 0,
      explain: `Her break point için bir ağırlık z<sub>i</sub> (n tane), her segment (iki break point arası) için bir binary y<sub>i</sub> (n − 1 tane) vardır. Euing Gas: break point 0, 500, 1000, 1500 ⇒ 4 z, 3 y. Machine tool'da 5 λ ve 4 z.`,
    },
    {
      q: `Euing Gas'te break point'ler 0, 500, 1000, 1500 (z<sub>1</sub>…z<sub>4</sub>; y<sub>1</sub>…y<sub>3</sub>). z<sub>3</sub> için doğru bağlantı kısıtı hangisidir?`,
      options: [
        `z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub>`,
        `z<sub>3</sub> ≤ y<sub>3</sub>`,
        `z<sub>3</sub> ≤ y<sub>1</sub> + y<sub>2</sub>`,
        `z<sub>3</sub> ≤ y<sub>2</sub>`,
      ],
      answer: 0,
      explain: `b<sub>3</sub> = 1000 break point'i, 2. segment [500, 1000] (y<sub>2</sub>) ile 3. segment [1000, 1500] (y<sub>3</sub>) arasındadır: z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub>. Genel kural z<sub>i</sub> ≤ y<sub>i−1</sub> + y<sub>i</sub>; yalnızca uçlarda (z<sub>1</sub> ≤ y<sub>1</sub>, z<sub>n</sub> ≤ y<sub>n−1</sub>) tek terim vardır.`,
    },
    {
      q: `Euing Gas'te x = 800 gal oil 1 satın alınıyorsa y, z değerleri ve c(800) ne olur? (c(500) = 12 500, c(1000) = 22 500)`,
      options: [
        `y<sub>2</sub> = 1; z<sub>2</sub> = 2/5, z<sub>3</sub> = 3/5; c(800) = 18 500`,
        `y<sub>1</sub> = 1; z<sub>1</sub> = 1/5, z<sub>2</sub> = 4/5; c(800) = 10 000`,
        `y<sub>2</sub> = 1; z<sub>2</sub> = 3/5, z<sub>3</sub> = 2/5; c(800) = 16 500`,
        `y<sub>3</sub> = 1; z<sub>3</sub> = 2/5, z<sub>4</sub> = 3/5; c(800) = 27 000`,
      ],
      answer: 0,
      explain: `500 ≤ 800 ≤ 1000 ⇒ y<sub>2</sub> = 1. 800 = 500z<sub>2</sub> + 1000z<sub>3</sub>, z<sub>2</sub> + z<sub>3</sub> = 1 ⇒ z<sub>3</sub> = 0.6, z<sub>2</sub> = 0.4. c(800) = 0.4·12 500 + 0.6·22 500 = 5000 + 13 500 = 18 500 (= 20·800 + 2500). Ağırlıkları ters almak (3/5, 2/5) x'i 700 yapardı.`,
    },
    {
      q: `Euing Gas'te x = 1200 için hangi segment/binary seçilir ve c(1200) kaçtır? (c(1000) = 22 500, c(1500) = 30 000)`,
      options: [
        `y<sub>3</sub> = 1; z<sub>3</sub> = 0.6, z<sub>4</sub> = 0.4; c(1200) = 25 500`,
        `y<sub>2</sub> = 1; z<sub>2</sub> = 0.6, z<sub>3</sub> = 0.4; c(1200) = 25 500`,
        `y<sub>3</sub> = 1; z<sub>3</sub> = 0.4, z<sub>4</sub> = 0.6; c(1200) = 27 000`,
        `y<sub>3</sub> = 1; z<sub>3</sub> = 0.6, z<sub>4</sub> = 0.4; c(1200) = 18 000`,
      ],
      answer: 0,
      explain: `1000 ≤ 1200 ≤ 1500 ⇒ y<sub>3</sub> = 1. 1200 = 1000z<sub>3</sub> + 1500z<sub>4</sub>, z<sub>3</sub> + z<sub>4</sub> = 1 ⇒ z<sub>4</sub> = 0.4, z<sub>3</sub> = 0.6. c(1200) = 0.6·22 500 + 0.4·30 000 = 13 500 + 12 000 = 25 500 (= 15·1200 + 7500 ✓).`,
    },
    {
      q: `Euing Gas modelinde y<sub>2</sub> = 1 ise z değişkenleri hakkında ne söylenebilir?`,
      options: [
        `z<sub>2</sub> ve z<sub>3</sub> pozitif olabilir (toplamları 1), z<sub>1</sub> = z<sub>4</sub> = 0'dır.`,
        `Yalnızca z<sub>2</sub> pozitif olabilir.`,
        `z<sub>1</sub> ve z<sub>2</sub> pozitif olabilir.`,
        `Tüm z'ler pozitif olabilir.`,
      ],
      answer: 0,
      explain: `y<sub>2</sub> = 1 ⇒ y<sub>1</sub> = y<sub>3</sub> = 0. O zaman z<sub>1</sub> ≤ y<sub>1</sub> = 0, z<sub>4</sub> ≤ y<sub>3</sub> = 0, z<sub>2</sub> ≤ y<sub>1</sub> + y<sub>2</sub> = 1, z<sub>3</sub> ≤ y<sub>2</sub> + y<sub>3</sub> = 1. Yani yalnızca [500, 1000] segmentinin iki ucu (z<sub>2</sub>, z<sub>3</sub>) pozitif olabilir.`,
    },
    {
      q: `Dorian Auto'da (IJ: ilk 6 reklam 10 000, 7–10. reklamlar 3 000, 11–15. reklamlar 2 500 exposure; sonrası 0) IJ'de <b>12 reklam</b> kaç exposure üretir?`,
      options: [`77 000`, `72 000`, `66 000`, `82 000`],
      answer: 0,
      explain: `6·10 000 + 4·3 000 + 2·2 500 = 60 000 + 12 000 + 5 000 = <b>77 000</b>. (Notlardaki örnekler: IJ'de 8 reklam = 66 000, FS'de 13 reklam = 82 000.)`,
    },
    {
      q: `Dorian Auto (azalan getiri) modelinde neden binary değişkenli z/y formülasyonuna gerek yoktur?`,
      options: [
        `Sonraki reklamların getirisi azaldığı için maksimizasyon, x<sub>i</sub>'nin ancak x<sub>i−1</sub> maksimumdayken pozitif olmasını kendiliğinden sağlar.`,
        `Çünkü tüm değişkenler zaten binary'dir.`,
        `Çünkü fonksiyon doğrusaldır.`,
        `Çünkü bütçe kısıtı bağlayıcı değildir.`,
      ],
      answer: 0,
      explain: `Daha yüksek exposure getiren segmentler daha önce (x<sub>1</sub>, y<sub>1</sub>) tanımlandığı için maksimizasyon onları önce doldurur. Bu, eğimin x arttıkça daha az elverişli hale geldiği durumlarda geçerlidir. Reklam sayıları integer'dır ama binary değildir ve fonksiyon doğrusal değildir; bütçe de bağlayıcıdır (toplam 20).`,
    },
    {
      q: `Modified Dorian'da (IJ: 1–6. reklam 2 500, 7–10. 3 000, 11–15. 10 000 exposure; artan getiri) Dorian'daki basit formülasyon neden <b>yanlış</b> çözüm üretir?`,
      options: [
        `Artan getiri durumunda maksimizasyon, x<sub>i</sub>'nin ancak x<sub>i−1</sub> maksimumdayken pozitif olmasını sağlamaz; model 10 000'lik reklamları önce seçer (x<sub>3</sub> = 5, x<sub>2</sub> = 4, x<sub>1</sub> = 0 gibi mantıksız çözüm).`,
        `Çünkü bütçe kısıtı yanlış yazılmıştır.`,
        `Çünkü x<sub>i</sub> değişkenleri integer olmalıdır.`,
        `Çünkü modelin optimal çözümü yoktur.`,
      ],
      answer: 0,
      explain: `Artan getirili durumda en yüksek exposure veren (11–15. reklamlar) segment sonraki sıradadır, ama basit model onu 1–6. reklamlar yapılmadan seçebilir. Sonuç: x<sub>3</sub> = 5, x<sub>2</sub> = 4, y<sub>3</sub> = 3, y<sub>2</sub> = 8 (toplam 134 bin) — fiziksel olarak imkânsızdır. Çözüm: Euing Gas tarzı (z/y ağırlıklı, binary'li) formülasyon.`,
    },
    {
      q: `Machine tool örneğinde x<sub>1</sub> ∈ [600, 800] aralığı break point'ler 600, 650, 700, 750, 800 ile bölünüp f<sub>1</sub> = 0.5x<sub>1</sub>² piecewise linear yapılıyor (λ<sub>1</sub>…λ<sub>5</sub>, z<sub>1</sub>…z<sub>4</sub>). x<sub>1</sub> = 725 için f<sub>1</sub>'in yaklaşık değeri nedir? (f<sub>1</sub>(700) = 245 000, f<sub>1</sub>(750) = 281 250)`,
      options: [`263 125`, `262 812.5`, `281 250`, `245 000`],
      answer: 0,
      explain: `725, 700 ile 750'nin tam ortasıdır ⇒ z<sub>3</sub> = 1, λ<sub>3</sub> = λ<sub>4</sub> = 0.5. f<sub>1</sub> ≈ 0.5·245 000 + 0.5·281 250 = <b>263 125</b>. Gerçek 0.5·725² = 262 812.5'tir; fark yaklaşıklık hatasıdır (konveks fonksiyonun kirişi eğrinin üstünde kalır). Daha fazla parça hatayı azaltır.`,
    },
    {
      q: `Machine tool örneğinde "36/(x<sub>2</sub>x<sub>3</sub>)'ü minimize et" amacı nasıl doğrusal hale getirilir?`,
      options: [
        `max δ; x<sub>2</sub> ≥ δ, x<sub>3</sub> ≥ δ (yani max min(x<sub>2</sub>, x<sub>3</sub>), yaklaşıklık)`,
        `min δ; x<sub>2</sub> ≤ δ, x<sub>3</sub> ≤ δ`,
        `max x<sub>2</sub> + x<sub>3</sub> (tam eşdeğerdir)`,
        `min x<sub>2</sub>x<sub>3</sub>`,
      ],
      answer: 0,
      explain: `36/(x<sub>2</sub>x<sub>3</sub>) minimum ⇔ x<sub>2</sub>x<sub>3</sub> maksimum. Çarpım doğrusal olmadığından, notlar bunu max min(x<sub>2</sub>, x<sub>3</sub>) ile yaklaşık temsil eder: δ ≤ x<sub>2</sub>, δ ≤ x<sub>3</sub>, max δ. Bu tam eşdeğer değil, bir <b>yaklaşıklıktır</b>; max x<sub>2</sub> + x<sub>3</sub> de farklı bir amaçtır.`,
    },
  ];
})();
