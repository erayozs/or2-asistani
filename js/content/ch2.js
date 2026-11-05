/* Chapter 2 (2.1 – 2.8) learning content: summaries + concept questions.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, Ch.2 (pages 21–40 of the notes). 2.9 Cutting Planes is out of scope. */
(function () {
  const OR = window.OR;

  // Joe State distance matrix (Example 10, symmetric). null = diagonal (c_ii = M in the assignment problem)
  const JOE = [
    [null, 132, 217, 164, 58],
    [132, null, 290, 201, 79],
    [217, 290, null, 113, 303],
    [164, 201, 113, null, 196],
    [58, 79, 303, 196, null],
  ];
  // small 5-city matrix used in the questions (symmetric)
  const SMALL = [
    [null, 6, 11, 32, 16],
    [6, null, 15, 20, 37],
    [11, 15, null, 17, 37],
    [32, 20, 17, null, 20],
    [16, 37, 37, 20, null],
  ];
  const mtx = (M) =>
    '<table class="mtx"><tr><th></th>' +
    M.map((_, j) => `<th>${j + 1}</th>`).join('') +
    '</tr>' +
    M.map((r, i) => `<tr><th>${i + 1}</th>` + r.map((v) => (v === null ? '<td class="dim">–</td>' : `<td>${v}</td>`)).join('') + '</tr>').join('') +
    '</table>';

  /* ====================================================================== 2.1 */
  OR.content.summaries['2.1'] = `
<h2>2.1 Categorization — IP çözüm yöntemlerinin sınıflandırılması</h2>
<p>LP için <b>general purpose</b> (çözülen LP'den bağımsız) ve hesaplama açısından <b>etkili</b> algoritmalar vardır (simplex, interior point). IP için böyle bir <i>genel amaçlı ve etkili</i> algoritma <b>yoktur</b>. IP'yi çözmek için iki yaygın yaklaşım:</p>
<ul>
  <li>Problemi daha küçük alt problemlere bölen ağaç araması: <b>branch and bound</b> (bu bölümün ana konusu);</li>
  <li><b>cutting planes</b> (integrality'yi zorlayan kısıtlar ekleme; 2.9, kapsam dışı).</li>
</ul>
<p>İkisi de aslında bir <b>dizi LP</b> çözer.</p>

<h3>Amaca göre (w.r.t. purpose)</h3>
<ul>
  <li><b>General purpose</b>: her IP'yi çözer, ama hesaplama açısından verimsiz olabilir (yalnızca nispeten küçük problemleri çözer).</li>
  <li><b>Special purpose</b>: tek bir IP tipi için tasarlanmıştır; potansiyel olarak daha etkilidir.</li>
</ul>
<h3>Algoritmaya göre (w.r.t. algorithm)</h3>
<ul>
  <li><b>Optimal algorithm</b>: optimal çözümü bulmayı matematiksel olarak <b>garanti</b> eder.</li>
  <li><b>Heuristic algorithm</b>: optimal algoritma pratik olmadığında deneme-yanılma ile kullanılır; <i>umulur ki</i> amaç fonksiyonu açısından optimal'e yakın iyi bir <i>feasible</i> çözüm bulur. Optimalite garantisi <b>yoktur</b>.</li>
</ul>

<h3>Dört sınıf (notlardaki liste)</h3>
<table>
  <tr><th></th><th>Optimal</th><th>Heuristic</th></tr>
  <tr><th>General purpose</th><td>Enumeration, <b>branch and bound</b>, cutting plane</td><td>General purpose optimal algoritmayı belirli bir süre sonunda durdurmak</td></tr>
  <tr><th>Special purpose</th><td>Dual ascent, Lagrangean relaxation ile bound üreten tree search yaklaşımları</td><td>Bound based heuristics, tabu search, simulated annealing, population heuristics (genetic algorithms), interchange</td></tr>
</table>

<h3>Neden heuristic?</h3>
<ul>
  <li>Problemin boyutu, bilinen optimal algoritmaların eldeki sürede çözebileceği sınırı aşıyordur.</li>
  <li>Optimal çözüm bulunabilir ama bunun için harcanacak çaba (zaman, para) buna değmiyordur.</li>
  <li>İyi tasarlanmış bir heuristic çoğu zaman iyi kaliteli (near-optimal) sonuç verir.</li>
</ul>
<div class="box">TSP için nearest-neighbor ve cheapest-insertion (2.7) yalnızca TSP'ye özel ve optimalite garantisi olmayan yöntemlerdir: <b>special purpose, heuristic</b>.</div>
<div class="warnbox"><b>Tuzak:</b> "Special purpose = heuristic, general purpose = optimal" diye bir kural yoktur. İki eksen birbirinden bağımsızdır (örn. Lagrangean tabanlı tree search: special purpose <i>optimal</i>; B&amp;B'yi süre limitiyle durdurmak: general purpose <i>heuristic</i>).</div>
`;

  OR.content.concepts['2.1'] = [
    {
      q: `Aşağıdakilerden hangisi <b>general purpose, optimal</b> bir algoritmadır?`,
      options: [`Branch and bound`, `Tabu search`, `Simulated annealing`, `Nearest-neighbor heuristic`],
      answer: 0,
      explain: `Notlardaki listeye göre enumeration, branch and bound ve cutting plane <b>general purpose, optimal</b> sınıfındadır. Tabu search ve simulated annealing <b>special purpose heuristic</b> sınıfında sayılır; nearest-neighbor heuristic ise yalnızca TSP için tasarlanmış bir heuristic'tir.`,
    },
    {
      q: `Notlara göre <b>tabu search, simulated annealing</b> ve <b>genetic algorithms</b> (population heuristics) hangi sınıfa girer?`,
      options: [`General purpose, optimal`, `General purpose, heuristic`, `Special purpose, optimal`, `Special purpose, heuristic`],
      answer: 3,
      explain: `Bunlar optimalite garantisi vermeyen (heuristic) ve probleme göre uyarlanan yöntemlerdir: notlarda <b>special purpose, heuristic</b> başlığı altında (bound based heuristics, tabu search, simulated annealing, population heuristics, interchange) sayılırlar. "General purpose heuristic" ise notlarda başka bir şey demektir: genel amaçlı bir optimal algoritmayı belirli bir süre sonunda durdurmak.`,
    },
    {
      q: `Bir branch and bound algoritmasını çalıştırıp <b>önceden belirlenen bir süre dolunca durdurmak</b> ve o ana kadar bulunan en iyi feasible çözümü önermek hangi sınıfa girer?`,
      options: [`General purpose, optimal`, `General purpose, heuristic`, `Special purpose, optimal`, `Special purpose, heuristic`],
      answer: 1,
      explain: `Algoritma (B&amp;B) her IP'ye uygulanabildiği için <b>general purpose</b>; süre dolunca durdurulduğundan optimalite garantisi kaybolur, yani <b>heuristic</b> olur. Notlardaki tanım birebir budur: "Running a general-purpose optimal algorithm and terminating after a specified time".`,
    },
    {
      q: `<b>Dual ascent</b> veya <b>Lagrangean relaxation</b> ile bound üreten tree search yaklaşımları notlarda hangi sınıftadır?`,
      options: [`General purpose, optimal`, `General purpose, heuristic`, `Special purpose, optimal`, `Special purpose, heuristic`],
      answer: 2,
      explain: `Bunlar belirli problem yapılarından yararlanan (special purpose) ama tree search ile optimalite garantisi veren (optimal) yöntemlerdir. Heuristic sınıfındaki special purpose örnekler ise bound based heuristics, tabu search, simulated annealing, genetic algorithms, interchange'dir.`,
    },
    {
      q: `<b>Heuristic</b> algoritmalar hakkında hangileri doğrudur?`,
      options: [
        `Optimal çözümü garanti etmezler; amaç, amaç fonksiyonu değeri açısından optimal'e yakın iyi bir feasible çözüm bulmaktır.`,
        `Problem boyutu, optimal algoritmaların eldeki hesaplama süresi içindeki sınırını aştığında kullanılırlar.`,
        `İyi tasarlanmış bir heuristic bile asla near-optimal sonuç veremez.`,
        `Heuristic kullanmanın tek nedeni, optimal çözümün matematiksel olarak var olmamasıdır.`,
      ],
      answer: [0, 1],
      explain: `Doğrular: heuristic'ler optimalite garantisi vermez ve problem optimal algoritmaların sınırını aştığında (veya optimal çözmek çabaya değmediğinde) kullanılır. Yanlışlar: notlar tam tersini söyler, iyi tasarlanmış bir heuristic çoğu zaman near-optimal sonuç verir; ayrıca nedenler arasında "optimal çözüm var ama bulmak çok pahalı" durumu vardır, optimal çözümün var olmaması değil.`,
    },
    {
      q: `<b>Special purpose</b> ve <b>general purpose</b> yöntemler arasındaki fark hangisinde doğru verilmiştir?`,
      options: [
        `Special purpose yöntem tek bir IP tipi için tasarlanır ve potansiyel olarak daha etkilidir; general purpose yöntem her IP'yi çözer ama potansiyel olarak etkisiz kalabilir.`,
        `Special purpose yöntemler her zaman heuristic, general purpose yöntemler her zaman optimal'dir.`,
        `General purpose yöntemler yalnızca LP problemlerini çözer.`,
        `Special purpose yöntemler her IP'yi çözebilir ama daha yavaştır.`,
      ],
      answer: 0,
      explain: `Notlardaki tanım: general purpose = her IP'yi çözer ama hesaplama açısından verimsiz olabilir; special purpose = tek bir IP tipi için tasarlanmıştır ve potansiyel olarak daha etkilidir. İkinci seçenek yanlıştır çünkü "purpose" ekseni ile "optimal/heuristic" ekseni bağımsızdır (örn. general purpose heuristic ve special purpose optimal sınıfları vardır).`,
    },
    {
      q: `Notlara göre <b>IP'leri çözmek için iki yaygın yaklaşım</b> hangileridir?`,
      options: [
        `Branch and bound ve cutting planes`,
        `Simplex ve interior point`,
        `Nearest-neighbor ve cheapest-insertion`,
        `Enumeration ve Hungarian method`,
      ],
      answer: 0,
      explain: `Notlar iki yaklaşım sayar: problemi alt problemlere bölen ağaç araması (<b>branch and bound</b>) ve integrality'yi zorlayan kısıtlar ekleyen <b>cutting planes</b>. Simplex ve interior point LP algoritmalarıdır (LP için genel amaçlı ve etkili algoritmalar var, IP için yok). Nearest-neighbor/cheapest-insertion TSP heuristic'leridir. Enumeration bir general purpose optimal yöntemdir ama iki yaygın yaklaşımdan biri olarak sayılmaz.`,
    },
    {
      q: `<b>Nearest-neighbor heuristic</b> yalnızca TSP için tasarlanmıştır ve optimal turu garanti etmez. Hangi sınıftadır?`,
      options: [`General purpose, optimal`, `General purpose, heuristic`, `Special purpose, optimal`, `Special purpose, heuristic`],
      answer: 3,
      explain: `Tek bir problem tipine (TSP) özel olduğu için <b>special purpose</b>; optimalite garantisi vermediği için <b>heuristic</b>. General purpose olsaydı her IP'ye uygulanabilmesi gerekirdi.`,
    },
  ];

  /* ====================================================================== 2.2 */
  OR.content.summaries['2.2'] = `
<h2>2.2 LP Relaxation (LR)</h2>
<p>Bir IP'den, <b>aynı amaç fonksiyonu ve aynı kısıtlar</b> alınıp "değişkenler integer olsun" koşulları uygun sürekli kısıtlarla değiştirilerek elde edilen LP'ye <b>LP relaxation (LR)</b> denir.</p>
<table>
  <tr><th>IP'deki koşul</th><th>LR'de karşılığı</th></tr>
  <tr><td>x<sub>i</sub> = 0 or 1 (binary)</td><td>x<sub>i</sub> ≥ 0 <b>ve</b> x<sub>i</sub> ≤ 1</td></tr>
  <tr><td>x<sub>i</sub> ≥ 0 and integer (pure integer)</td><td>x<sub>i</sub> ≥ 0</td></tr>
  <tr><td>Mixed: bir kısmı integer, bir kısmı continuous</td><td>Integer koşulları kalkar, continuous olanlar zaten sürekli; binary olana x<sub>i</sub> ≤ 1 eklenir</td></tr>
</table>

<h3>Notlardaki örnekler</h3>
<p><b>Example 1 (pure IP)</b></p>
<div class="model">IP: max 8x<sub>1</sub> + 5x<sub>2</sub>
    s.t. x<sub>1</sub> + x<sub>2</sub> ≤ 6;  9x<sub>1</sub> + 5x<sub>2</sub> ≤ 45;  x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer
LR: aynı model, yalnızca  x<sub>1</sub>, x<sub>2</sub> ≥ 0</div>
<p><b>Example 2 (binary IP)</b> — 4 değişken, 3 kısıt, x<sub>j</sub> = 0 or 1.</p>
<div class="model">LR: aynı amaç ve aynı 3 kısıt, ayrıca
    x<sub>1</sub> ≤ 1, x<sub>2</sub> ≤ 1, x<sub>3</sub> ≤ 1, x<sub>4</sub> ≤ 1  ve  tüm x<sub>i</sub> ≥ 0</div>
<p><b>Example 3 (mixed IP)</b>: x<sub>1</sub> ≥ 0, x<sub>2</sub> ≥ 0 and integer, x<sub>3</sub> binary.</p>
<div class="model">LR: aynı amaç ve kısıtlar, ayrıca  x<sub>3</sub> ≤ 1  ve  x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> ≥ 0</div>

<h3>Naturally integer LP</h3>
<p>LR'nin optimal çözümünde tüm değişkenler zaten integer çıkarsa, bu çözüm IP için de <b>feasible ve optimal</b>'dir (LR daha az kısıtlı olduğu için IP'nin değeri bundan daha iyi olamaz, bu çözüm ise IP-feasible).</p>

<h3>LR – IP ilişkisi</h3>
<p>LR, IP'den <b>daha az kısıtlıdır</b> (IP'nin feasible bölgesi LR'ninkinin alt kümesi):</p>
<table>
  <tr><th>IP tipi</th><th>z<sub>LR</sub> ile z<sub>IP</sub></th><th>LR'nin rolü</th></tr>
  <tr><td><b>max</b></td><td>z<sub>LR</sub> ≥ z<sub>IP</sub></td><td><b>upper bound</b></td></tr>
  <tr><td><b>min</b></td><td>z<sub>LR</sub> ≤ z<sub>IP</sub></td><td><b>lower bound</b></td></tr>
  <tr><td>LR <b>infeasible</b></td><td>IP de infeasible</td><td>—</td></tr>
</table>
<p>Yani LR'yi çözmek optimal değer hakkında bir <i>bound</i> verir, şanslıysak (naturally integer) IP'nin optimal çözümünü de verir.</p>
<div class="warnbox"><b>Tuzaklar:</b>
<ul>
  <li>Binary değişkenin LR'sinde sadece x ≥ 0 yazmak <b>yetmez</b>; x ≤ 1 de gerekir.</li>
  <li>LR çözümünü yuvarlamak her zaman feasible bir IP çözümü vermez; feasible olsa bile optimal olmak zorunda değildir (2.5'te örnek).</li>
  <li>LR infeasible ⇒ IP infeasible; ama LR feasible iken IP infeasible olabilir.</li>
</ul></div>
`;

  OR.content.concepts['2.2'] = [
    {
      q: `Aşağıdaki binary IP'nin LP relaxation'ı (LR) hangisidir?
<div class="model">max z = 3x<sub>1</sub> + 2x<sub>2</sub> + x<sub>3</sub>
s.t. 2x<sub>1</sub> + 3x<sub>2</sub> + x<sub>3</sub> ≤ 4
     x<sub>j</sub> = 0 or 1   (j = 1, 2, 3)</div>`,
      options: [
        `Aynı amaç ve aynı kısıt; "x<sub>j</sub> = 0 or 1" yerine 0 ≤ x<sub>j</sub> ≤ 1 (j = 1, 2, 3)`,
        `Aynı amaç ve aynı kısıt; yalnızca x<sub>j</sub> ≥ 0 (üst sınır yok)`,
        `Aynı amaç ve aynı kısıt; x<sub>j</sub> ≥ 0 and integer`,
        `Yalnızca 0 ≤ x<sub>j</sub> ≤ 1 kısıtları kalır; 2x<sub>1</sub> + 3x<sub>2</sub> + x<sub>3</sub> ≤ 4 kısıtı çıkarılır`,
      ],
      answer: 0,
      explain: `LR, aynı amaç ve <b>aynı kısıtlarla</b> yalnızca integer/binary koşulunu kaldırır: "x<sub>j</sub> = 0 or 1" → "x<sub>j</sub> ≥ 0 ve x<sub>j</sub> ≤ 1". Sadece x<sub>j</sub> ≥ 0 yazmak üst sınırı kaybettirir (relaxation fazla gevşer). "x<sub>j</sub> ≥ 0 and integer" hâlâ bir IP'dir, relaxation değildir. Asıl kısıtı çıkarmak da yanlıştır; kaldırılan şey integrality'dir, kısıtlar değil.`,
    },
    {
      q: `Aşağıdaki mixed IP'nin LR'sinde değişkenlerle ilgili koşullar ne olur?
<div class="model">max z = 2x<sub>1</sub> + x<sub>2</sub> + 3x<sub>3</sub>
s.t. x<sub>1</sub> + 2x<sub>2</sub> + x<sub>3</sub> ≤ 10
     3x<sub>1</sub> + x<sub>2</sub> + 4x<sub>3</sub> ≤ 12
     x<sub>1</sub> ≥ 0;  x<sub>2</sub> ≥ 0 and integer;  x<sub>3</sub> binary</div>`,
      options: [
        `Aynı kısıtlar; x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> ≥ 0 ve ayrıca x<sub>3</sub> ≤ 1`,
        `Aynı kısıtlar; yalnızca x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> ≥ 0`,
        `Aynı kısıtlar; x<sub>2</sub> integer kalır, yalnızca 0 ≤ x<sub>3</sub> ≤ 1 yapılır`,
        `x<sub>3</sub> = 0 ve x<sub>3</sub> = 1 için iki ayrı LP yazılır`,
      ],
      answer: 0,
      explain: `LR'de <b>tüm</b> integer koşulları kalkar: x<sub>2</sub> ≥ 0 ve x<sub>3</sub> için 0 ≤ x<sub>3</sub> ≤ 1. x<sub>3</sub> ≤ 1 unutulursa binary'nin üst sınırı kaybolur. x<sub>2</sub>'nin integer kalması LR'yi hâlâ bir MIP yapar. İki ayrı LP (x<sub>3</sub> = 0 / 1) ise relaxation değil, branch'ten sonraki subproblem'lerdir.`,
    },
    {
      q: `Bir <b>max</b> IP'nin LR'si çözülmüş ve z = 41.3 bulunmuştur (çözüm kesirlidir). Hangileri doğrudur?`,
      options: [
        `IP'nin optimal z-değeri ≤ 41.3'tür.`,
        `IP'nin optimal z-değeri ≥ 41.3'tür.`,
        `LR çözümünde tüm değişkenler integer çıksaydı, o çözüm IP için de optimal olurdu.`,
        `LR çözümünü en yakın tam sayılara yuvarlamak her zaman feasible bir IP çözümü verir.`,
      ],
      answer: [0, 2],
      explain: `Max problemde LR daha az kısıtlı olduğu için z<sub>LR</sub> ≥ z<sub>IP</sub>: 41.3 bir <b>upper bound</b>'dur. LR çözümü tamamen integer çıkarsa (naturally integer LP) IP için de feasible ve optimaldir. "≥ 41.3" yanlıştır (yön ters). Yuvarlama feasibility'yi bozabilir (örn. 2.5'teki Example 5'te (15/4, 9/4) → (4, 2) infeasible'dır).`,
    },
    {
      q: `Bir <b>min</b> IP'nin LR'sinin optimal değeri z = 17.5'tir. IP'nin optimal değeri z* için ne söylenebilir?`,
      options: [
        `z* ≥ 17.5 (LR bir lower bound verir)`,
        `z* ≤ 17.5 (LR bir upper bound verir)`,
        `z* = 17.5`,
        `Hiçbir şey söylenemez`,
      ],
      answer: 0,
      explain: `Min problemde LR daha az kısıtlı olduğu için daha küçük (veya eşit) değer verir: z<sub>LR</sub> ≤ z<sub>IP</sub>. Dolayısıyla 17.5 bir <b>lower bound</b>'dur. (Max'ta yön tersine döner: upper bound.) Eşitlik ancak LR çözümü integer çıkarsa olur; bu bilinmediği için "z* = 17.5" kesin değildir.`,
    },
    {
      q: `Bir IP'nin LR'si <b>infeasible</b> çıkmıştır. IP hakkında ne söylenebilir?`,
      options: [
        `IP de infeasible'dır.`,
        `IP'nin LR'den daha kötü değerli ama feasible bir çözümü olabilir.`,
        `IP feasible olabilir; yalnızca integer çözümlere bakmak gerekir.`,
        `Bir sonuç çıkarılamaz; branch and bound başlatılmalıdır.`,
      ],
      answer: 0,
      explain: `IP'nin feasible bölgesi LR'ninkinin alt kümesidir. LR'de hiç feasible nokta yoksa IP'de de yoktur. Dolayısıyla branch etmeye gerek kalmaz (bu, B&amp;B'de "infeasible ⇒ fathomed" kuralının nedenidir). Tersi doğru değildir: LR feasible iken IP infeasible olabilir.`,
    },
    {
      q: `Bir max IP'nin LR'si çözülüyor: x = (3, 2, 0), z = 17 (tüm değişkenler integer). Ne yapılır?`,
      options: [
        `Bu çözüm IP için de feasible ve optimaldir; branch gerekmez.`,
        `17 yalnızca bir upper bound'dur; mutlaka branch edilmelidir.`,
        `17 bir lower bound'dur; daha iyi çözüm aramak için branch edilmelidir.`,
        `Çözüm IP için feasible'dır ama optimal olduğu garanti değildir.`,
      ],
      answer: 0,
      explain: `Naturally integer LP: LR'nin optimal çözümü integer ise IP için feasible'dır; LR max IP için upper bound verdiğinden (z<sub>IP</sub> ≤ 17) ve bu çözüm IP'de 17 sağladığından optimaldir. Branch gerekmez.`,
    },
    {
      q: `Max bir IP için LR'nin optimal değerinin IP'nin optimal değerinden <b>büyük veya eşit</b> olmasının nedeni nedir?`,
      options: [
        `LR daha az kısıtlıdır: IP'nin feasible bölgesi LR'nin feasible bölgesinin alt kümesidir.`,
        `LR'de değişkenlerin negatif değer almasına izin verilir.`,
        `LR'nin amaç fonksiyonu katsayıları IP'ninkinden büyüktür.`,
        `LR'de kısıtların sağ taraf değerleri artırılır.`,
      ],
      answer: 0,
      explain: `LR aynı amaç ve aynı kısıtlara sahiptir, yalnızca integer koşulları kalkar; bu yüzden feasible bölge büyür. Daha geniş bölgede max alırsanız değer en az IP'ninki kadar olur. Diğer seçenekler LR'nin tanımına aykırıdır (amaç ve kısıtlar değişmez; x ≥ 0 korunur).`,
    },
    {
      q: `Bir max IP'nin LR'si z = 23.6 vermiştir (x = (2.6, 1.2)). Biri z = 21 olan integer bir feasible çözüm bulmuştur. IP'nin optimal değeri z* için ne söylenebilir?`,
      options: [`21 ≤ z* ≤ 23.6`, `z* ≥ 23.6`, `z* ≤ 21`, `z* = 21`],
      answer: 0,
      explain: `Feasible her çözüm max problemde z*'a <b>lower bound</b> verir (z* ≥ 21); LR değeri ise <b>upper bound</b>'dur (z* ≤ 23.6). B&amp;B'nin temel mantığı budur: LB ile UB arasındaki boşluğu daraltmak. z* = 21 kesin değildir; daha iyi bir integer çözüm 21 ile 23.6 arasında olabilir.`,
    },
  ];

  /* ====================================================================== 2.3 */
  OR.content.summaries['2.3'] = `
<h2>2.3 Enumeration</h2>
<p>IP'de her değişken yalnızca <b>sonlu sayıda</b> integer değer alabildiği için en açık yöntem: tüm olasılıkları say, her birinde amaç fonksiyonunu hesapla, <b>feasible</b> olanlar arasından en iyisini seç.</p>

<h3>Example 4 (multi-period capital budgeting, 4 binary değişken)</h3>
<p>2<sup>4</sup> = <b>16</b> olası çözüm vardır:</p>
<table>
  <tr><th>Seçilen proje sayısı</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>Toplam</th></tr>
  <tr><td>Çözüm sayısı</td><td>1</td><td>4</td><td>6</td><td>4</td><td>1</td><td><b>16</b></td></tr>
</table>
<p>Küçük problemde yalnızca 16 olasılığı inceleyip optimal çözümü kesin olarak biliriz.</p>

<h3>Neden patlar?</h3>
<table>
  <tr><th>n (binary)</th><th>10</th><th>20</th><th>30</th><th>50</th><th>100</th></tr>
  <tr><td>2<sup>n</sup></td><td>1 024</td><td>≈ 10<sup>6</sup></td><td>≈ 10<sup>9</sup></td><td>≈ 1.1 × 10<sup>15</sup></td><td>≈ 10<sup>30</sup></td></tr>
</table>
<ul>
  <li>Değişken sayısı <b>bir</b> artınca olasılık sayısı <b>2 katına</b> çıkar (üssel büyüme).</li>
  <li>Bir çözümü <i>üretmeden</i> feasible olup olmadığını kontrol edemeyiz; infeasible olanların çoğu olsa bile hepsini üretmek zorundayız.</li>
  <li>Örnek: saniyede 10<sup>9</sup> çözüm incelense bile 50 binary değişken ≈ 1.1 × 10<sup>6</sup> s ≈ <b>13 gün</b>; 100 değişken pratikte imkânsız.</li>
</ul>
<div class="box">"Problem küçükken kolay olmasının nedeni, büyüdükçe çok hızlı zorlaşmasının da nedenidir." Kavramsal olarak sorun yok (hepsini say), ama <b>hesaplama</b> açısından imkânsız. Bu yüzden B&amp;B gibi <i>implicit</i> yöntemler gerekir.</div>
<div class="tip">Hızlı hesaplar: n binary değişken ⇒ 2<sup>n</sup> olasılık; tam k tanesinin 1 olduğu çözüm sayısı C(n, k) (Example 4: C(4,2) = 6).</div>
`;

  OR.content.concepts['2.3'] = [
    {
      q: `7 binary değişkenli bir IP'de complete enumeration ile kaç farklı 0/1 vektörü incelenir?`,
      options: [`14`, `49`, `128`, `256`],
      answer: 2,
      explain: `Her değişken iki değer alabildiği için 2<sup>7</sup> = <b>128</b>. 14 (2·7) ve 49 (7²) doğrusal/ikinci derece büyümeyi varsayan hatalardır; 256 = 2<sup>8</sup> bir değişken fazlası içindir.`,
    },
    {
      q: `Her biri yalnızca 0 veya 1 değeri alabilen <b>100</b> değişkenli bir IP'de olasılık sayısı yaklaşık kaçtır?`,
      options: [`2<sup>100</sup> ≈ 10<sup>30</sup>`, `100² = 10 000`, `2 · 100 = 200`, `10<sup>100</sup>`],
      answer: 0,
      explain: `Her değişken 2 değer aldığı için 2×2×…×2 = 2<sup>100</sup> ≈ 1.27 × 10<sup>30</sup> ≈ 10<sup>30</sup>. Notlardaki örnek de budur. 10 000 ve 200 üssel büyümeyi gözden kaçırır; 10<sup>100</sup> ise çok fazladır (taban 10 değil 2).`,
    },
    {
      q: `Complete enumeration kullanan bir çözümde binary değişken sayısı 20'den 21'e çıkarsa incelenecek çözüm sayısı nasıl değişir?`,
      options: [`2 katına çıkar`, `1 artar`, `21/20 oranında artar`, `21 katına çıkar`],
      answer: 0,
      explain: `2<sup>21</sup> = 2 · 2<sup>20</sup>: her yeni binary değişken olasılık sayısını <b>iki katına</b> çıkarır. Bu üssel büyüme, enumeration'ın büyük problemlerde neden uygulanamadığının özüdür.`,
    },
    {
      q: `5 değişkenli bir IP'de her değişken yalnızca 0, 1 veya 2 değerini alabiliyor. Complete enumeration kaç olasılığı üretmek zorundadır?`,
      options: [`15`, `125`, `243`, `32`],
      answer: 2,
      explain: `Her değişken 3 değer alabildiği için 3<sup>5</sup> = <b>243</b>. 125 = 5<sup>3</sup> (taban-üs karıştırılmış), 32 = 2<sup>5</sup> (yalnızca binary için), 15 = 3·5.`,
    },
    {
      q: `Enumeration'ın büyük problemlerde uygulanamamasının asıl nedeni hangisidir?`,
      options: [
        `Olasılık sayısı değişken sayısıyla üssel artar ve bir çözüm üretilmeden feasible olup olmadığı kontrol edilemediği için infeasible olanlar da üretilmek zorundadır.`,
        `Enumeration optimal çözümü garanti etmez.`,
        `Enumeration kavramsal olarak mümkün değildir.`,
        `Enumeration yalnızca continuous değişkenli problemlerde çalışır.`,
      ],
      answer: 0,
      explain: `Notlara göre sorun kavramsal değil <b>hesaplamalıdır</b>: tüm olasılıkları sayıp feasible olanlar arasında en iyiyi seçmek optimal çözümü garanti eder (yani optimal bir yöntemdir), ama olasılık sayısı üssel büyür. Continuous değişkenlerde olasılık sonsuz olurdu; enumeration IP'nin sonlu olmasına dayanır.`,
    },
    {
      q: `5 projeli bir binary bütçeleme probleminde (Example 4'ün 5 projelik hali) <b>tam olarak 2 projenin</b> seçildiği kaç olası çözüm vardır?`,
      options: [`5`, `10`, `20`, `32`],
      answer: 1,
      explain: `5 projeden 2'sini seçmenin yolu C(5,2) = 10'dur. Example 4'te de 4 projeden 2'si için C(4,2) = 6 çözüm listelenmişti. 32 = 2<sup>5</sup> tüm çözümlerin sayısıdır; 20 = 5·4 sıralı seçimdir (sıra önemsiz).`,
    },
    {
      q: `Saniyede 10<sup>9</sup> çözümü inceleyebilen bir bilgisayar, 50 binary değişkenli bir problemi complete enumeration ile yaklaşık ne kadar sürede tarar?`,
      options: [`≈ 13 gün`, `≈ 18 dakika`, `≈ 50 saniye`, `≈ 36 yıl`],
      answer: 0,
      hint: `2<sup>50</sup> ≈ 1.13 × 10<sup>15</sup>.`,
      explain: `2<sup>50</sup> ≈ 1.13 × 10<sup>15</sup> çözüm; 10<sup>9</sup> çözüm/s ile ≈ 1.13 × 10<sup>6</sup> s ≈ <b>13 gün</b>. 18 dakika yaklaşık 2<sup>40</sup> için, 36 yıl ise yaklaşık 2<sup>60</sup> içindir; 10 değişken artınca süre ≈ 1000 katına çıkar. 50 saniye doğrusal büyümeyi varsayan bir hatadır.`,
    },
  ];
})();
