/* Chapter 2 (2.6.1 – 2.8) learning content: summaries + concept questions.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, Ch.2 (notes pages 33–40). Covers: 2.6.1 Job shop / single machine scheduling,
   2.6.2 TSP by B&B (Joe State, Example 10), 2.7 TSP heuristics (NNH, CIH; Examples 11–12), 2.8 Implicit enumeration.
   Numbers were verified by script (assignment B&B via OR.drills['tsp-bnb'].run, heuristics and sequences by brute force).
   Material that is NOT in the notes is explicitly labeled "notlarda yok" in the summaries. */
(function () {
  const OR = window.OR;

  // Joe State distance matrix (Example 10, symmetric). null = diagonal (c_ii = M)
  const JOE = [
    [null, 132, 217, 164, 58],
    [132, null, 290, 201, 79],
    [217, 290, null, 113, 303],
    [164, 201, 113, null, 196],
    [58, 79, 303, 196, null],
  ];

  // small symmetric 5-city instance (own example, not in the notes); optimal tour length 74
  const SMALL = [
    [null, 6, 11, 32, 16],
    [6, null, 15, 20, 37],
    [11, 15, null, 17, 37],
    [32, 20, 17, null, 20],
    [16, 37, 37, 20, null],
  ];

  // Cost-matrix table. forb = extra forbidden cells [i,j] (1-based, shown as M), sol = optimal assignment cells (green),
  // neu = newly forbidden cell (framed). Diagonal is always M.
  const mtxM = (D, forb, sol, neu) => {
    const has = (L, i, j) => (L || []).some((a) => a[0] === i + 1 && a[1] === j + 1);
    return (
      '<table class="mtx"><tr><th></th>' +
      D.map((_, j) => `<th>${j + 1}</th>`).join('') +
      '</tr>' +
      D.map(
        (r, i) =>
          `<tr><th>${i + 1}</th>` +
          r
            .map((v, j) => {
              const isM = v === null || has(forb, i, j);
              const cls = [isM ? 'm' : '', has(neu, i, j) ? 'sel' : '', has(sol, i, j) ? 'hl' : ''].filter(Boolean).join(' ');
              return `<td${cls ? ` class="${cls}"` : ''}>${isM ? 'M' : v}</td>`;
            })
            .join('') +
          '</tr>'
      ).join('') +
      '</table>'
    );
  };

  /* ====================================================================== 2.6.1 */
  OR.content.summaries['2.6.1'] = `
<h2>2.6 Combinatorial Optimization · 2.6.1 Job Shop / Single Machine Scheduling</h2>
<p><b>Combinatorial (discrete) optimization problem</b>: <b>sonlu sayıda feasible çözümü</b> olan her optimizasyon problemi. Notlardaki iki örnek:</p>
<ul>
  <li>Tek makinede işlenecek 10 iş; her işin işlem süresi ve due date'i biliniyor. Hangi sıralama 10 işin <b>toplam gecikmesini (total delay)</b> minimize eder?</li>
  <li>Satıcı 10 şehri gezip evine dönecek. Hangi sıralama toplam mesafeyi minimize eder? (<b>TSP</b>, 2.6.2)</li>
</ul>
<p>İki problemde de <b>çok sayıda olası çözüm</b> değerlendirilmelidir; <b>B&amp;B</b> yaklaşımı genellikle bunları çözmenin etkili bir yoludur.</p>

<h3>Job shop scheduling problem (JSP)</h3>
<ul>
  <li>Scheduling theory, OR'nin önemli araştırma alanlarından biridir; basit <i>dispatching rules</i>'dan gelişmiş <i>learning algorithms</i>'e kadar teknikler kullanılmıştır. JSP en çok çalışılan konulardan biridir ve çözmesi <b>zor</b> olduğu bilinir.</li>
  <li>İsim endüstriyel bir problemi çağrıştırsa da JSP'nin yapısı management, computing, public services gibi birçok uygulamayla ilişkilidir.</li>
  <li><b>n</b> iş, <b>m</b> makine üzerinde planlanır. <b>Capacity constraints</b>: bir makine aynı anda yalnızca bir işi işleyebilir; bir iş aynı anda yalnızca bir makinede işlenebilir.</li>
  <li>Tüm işlerin tüm operasyonlarının bittiği süre <b>makespan C<sub>max</sub></b>'tır.</li>
  <li>Scheduling cost (amaç) olarak şunlar kullanılabilir: <b>makespan, maximum lateness, maximum tardiness, maximum weighted completion time, total (weighted) completion time, total (weighted) number of tardy jobs</b>.</li>
</ul>

<h3>Single machine scheduling problem</h3>
<ul>
  <li><b>n</b> iş tek bir makinede işlenir. Her işin bir <b>processing time</b>'ı ve bir <b>due date</b>'i vardır.</li>
  <li>Makine aynı anda en fazla bir işi işler; <b>preemption yoktur</b> (başlayan iş kesilmez).</li>
  <li>Karar: makinedeki <b>işlem sırası</b> (jobs'un bir sıralaması, <i>sequence</i>). Amaç: scheduling cost'u minimize eden sıralamayı bulmak.</li>
</ul>

<h3>Example 9</h3>
<div class="box">Notlarda Example 9 <b>ayrıntılı çözülmez</b>; yalnızca <b>"Please refer to Winston 9.6., p. 528"</b> denir. Yani bu örneğin veri ve çözümü Winston'daki Section 9.6'dadır, ders notlarında adım adım B&amp;B ağacı ya da bound formülü yoktur. Bu yüzden aşağıda bound/dallanma ayrıntısı <b>uydurulmamış</b>, yalnızca genel kavramlar verilmiştir.</div>

<h3>Ek bilgi (notlarda yok): sıralama sayısı ve gecikme hesabı</h3>
<p>Aşağıdakiler notlarda yer almayan, yalnızca kavramı somutlaştıran genel bilgilerdir.</p>
<ul>
  <li><b>n</b> iş tek makinede <b>n!</b> farklı sırada işlenebilir (10 iş için 10! = 3 628 800). Bu sayı n ile çok hızlı büyür; enumeration yerine B&amp;B'nin neden aranmasının sebebi budur. B&amp;B'de bir düğüm, kısmi bir sıralamayı (örn. ilk iki işin sırası sabit) temsil edecek şekilde kurulabilir; o düğümün altında kalan tam sıralama sayısı (n − 2)! olur.</li>
  <li>İş j'nin <b>completion time</b>'ı C<sub>j</sub> = (sıradaki ilk iş dahil, j'ye kadar olan işlerin işlem sürelerinin toplamı) (makine boş beklemez). <b>Tardiness</b> T<sub>j</sub> = max(0, C<sub>j</sub> − d<sub>j</sub>). Notlardaki "total delay" bu bağlamda toplam gecikme olarak okunur; kesin tanım Winston'dadır.</li>
</ul>
<p>Örnek (bu örnek bizim hesabımızdır): 4 iş, işlem süreleri p = (4, 2, 6, 3), due date'ler d = (6, 5, 13, 9).</p>
<table>
  <tr><th>Sıralama</th><th>C<sub>j</sub> (sırayla)</th><th>T<sub>j</sub></th><th>Toplam gecikme</th><th>Geç kalan iş sayısı</th></tr>
  <tr><td>1–2–3–4</td><td>4, 6, 12, 15</td><td>0, 1, 0, 6</td><td><b>7</b></td><td>2 (iş 2, iş 4)</td></tr>
  <tr><td>2–1–4–3</td><td>2, 6, 9, 15</td><td>0, 0, 0, 2</td><td><b>2</b></td><td>1 (iş 3)</td></tr>
</table>
<p>24 sıralamanın hepsi denendiğinde minimum toplam gecikme 2'dir (2–1–4–3). Her sıralamada makespan <b>aynıdır</b>: 4 + 2 + 6 + 3 = 15.</p>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Combinatorial problem = <b>sonlu</b> sayıda feasible çözüm. LP'nin (sürekli değişken) feasible çözümü sonsuzdur, combinatorial değildir.</li>
  <li><b>Single machine</b>: karar "hangi makine" değil, <b>hangi sırada</b>. Tek makinede (boşluk bırakmadan) makespan sıralamadan bağımsızdır (= işlem sürelerinin toplamı); sıralama toplam gecikme, geç kalan iş sayısı, maksimum gecikme gibi amaçları değiştirir.</li>
  <li><b>Preemption yok</b>: bir iş başladıysa bitene kadar makineyi bırakmaz.</li>
  <li><b>Capacity constraints</b> iki yönlüdür: makine başına bir iş <i>ve</i> iş başına bir makine (aynı anda).</li>
  <li>Example 9'un çözümünü ders notlarında aramayın: kaynak <b>Winston 9.6, s. 528</b>.</li>
</ul></div>
`;

  OR.content.concepts['2.6.1'] = [
    {
      q: `Aşağıdakilerden hangileri <b>combinatorial (discrete) optimization problem</b>'dir?`,
      options: [
        `Tek makinede işlenecek 10 işin toplam gecikmesini minimize eden sıralamayı bulmak`,
        `10 şehri tam bir kez gezip başlangıca dönen minimum mesafeli turu bulmak (TSP)`,
        `max z = 3x + 2y, s.t. x + y ≤ 4, x, y ≥ 0 (sürekli değişkenli LP)`,
        `min f(x) = x² problemini tüm gerçel x değerleri üzerinde çözmek`,
      ],
      answer: [0, 1],
      explain: `Notlara göre combinatorial optimization problem, <b>sonlu sayıda feasible çözümü</b> olan problemdir. İş sıralaması ve şehir sıralaması sonlu sayıda olasılık verir. Sürekli değişkenli LP ve gerçel x üzerinde f(x) = x² minimizasyonu sonsuz sayıda feasible çözüme sahiptir; combinatorial değildir.`,
    },
    {
      q: `<b>Single machine scheduling problem</b>'in tanımı notlara göre hangisidir?`,
      options: [
        `n iş birden fazla makineye atanır; aynı iş aynı anda iki makinede işlenebilir.`,
        `n iş tek makinede işlenir; makine bir işi bitirmeden başka işe geçebilir (preemption serbesttir).`,
        `n iş tek makinede işlenir; her işin processing time'ı ve due date'i vardır, makine aynı anda en fazla bir iş işler, preemption yoktur; karar işlem sırasıdır.`,
        `n iş tek makinede işlenir; karar, her işin hangi makinede işleneceğidir.`,
      ],
      answer: 2,
      explain: `Notlardaki tanım: tek makine, her iş için processing time ve due date, aynı anda en fazla bir iş, <b>no preemption</b>; amaç, scheduling cost'u minimize eden işlem sırasını (ordering) bulmaktır. Tek makine olduğu için "hangi makine" kararı yoktur; preemption'a izin verilmez.`,
    },
    {
      q: `Job shop scheduling'de <b>makespan C<sub>max</sub></b> neyi ifade eder?`,
      options: [
        `Tüm işlerin tüm operasyonlarının tamamlandığı toplam süre`,
        `İşlerin completion time'larının aritmetik ortalaması`,
        `En uzun işlem süreli işin processing time'ı`,
        `Due date'ini en çok aşan işin gecikmesi`,
      ],
      answer: 0,
      explain: `Notlar: "The duration in which all operations for all jobs are completed is referred to as the makespan C<sub>max</sub>". Ortalama completion time, tek bir işin süresi ve maksimum gecikme (maximum tardiness) farklı performans ölçütleridir.`,
    },
    {
      q: `Tek makinede <b>10 iş</b> vardır. Olası farklı işlem sıralarının sayısı kaçtır?`,
      options: [`100`, `1 024`, `3 628 800`, `10 000 000 000`],
      answer: 2,
      hint: `Her sıralama 10 işin bir permütasyonudur.`,
      explain: `10 işin sıralaması 10! = 10·9·…·1 = <b>3 628 800</b>'dür. 100 = 10² ve 1 024 = 2<sup>10</sup> yanlış büyüme modelleridir (binary karar sayısı gibi hesaplanmıştır). Notların da söylediği gibi bu tür problemlerde "çok sayıda olası çözüm değerlendirilmelidir"; B&amp;B bunları tek tek saymadan çözmeye çalışır.`,
    },
    {
      q: `6 işin sıralanacağı bir B&amp;B ağacında (ek bilgi) bir düğümde <b>ilk iki sıradaki işler</b> belirlenmiştir. Bu düğümün altında kaç farklı <b>tam sıralama</b> kalır?`,
      options: [`4`, `12`, `24`, `720`],
      answer: 2,
      explain: `Kalan 4 iş (6 − 2) herhangi bir sırada dizilebilir: 4! = <b>24</b>. 720 = 6! düğüme hiç iş sabitlenmemişken (kök) kalan sayıdır. 4 doğrusal, 12 ise 4·3 (sıralı seçim) hatalarıdır.`,
    },
    {
      q: `4 iş: işlem süreleri p = (4, 2, 6, 3), due date'ler d = (6, 5, 13, 9). Makine boş beklemeden <b>1–2–3–4</b> sırasında çalışıyor. T<sub>j</sub> = max(0, C<sub>j</sub> − d<sub>j</sub>) olmak üzere <b>toplam gecikme</b> kaçtır?`,
      options: [`0`, `7`, `9`, `15`],
      answer: 1,
      hint: `Completion time'lar kümülatif toplamdır.`,
      explain: `C = (4, 6, 12, 15). T<sub>1</sub> = max(0, 4−6) = 0; T<sub>2</sub> = 6−5 = 1; T<sub>3</sub> = max(0, 12−13) = 0; T<sub>4</sub> = 15−9 = 6. Toplam = 0 + 1 + 0 + 6 = <b>7</b>. 15 makespan'dir (gecikme değil); 9 iş 4'ün due date'idir.`,
    },
    {
      q: `Aynı veri (p = (4, 2, 6, 3), d = (6, 5, 13, 9)), sıralama <b>2–1–4–3</b>. Hangileri doğrudur?`,
      options: [
        `Toplam gecikme 2'dir.`,
        `Yalnızca iş 3 geç kalır.`,
        `İş 1 geç kalır.`,
        `Makespan 13'tür.`,
      ],
      answer: [0, 1],
      explain: `Sıra: iş 2 (C = 2, d = 5), iş 1 (C = 6, d = 6), iş 4 (C = 9, d = 9), iş 3 (C = 15, d = 13). Gecikmeler 0, 0, 0, 2 → toplam <b>2</b>; yalnızca iş 3 geç kalır. İş 1 tam due date'inde biter (C = d = 6), yani geç değildir. Makespan her sıralamada 4 + 2 + 6 + 3 = 15'tir, 13 değil.`,
    },
    {
      q: `Tek makinede, makine hiç boş beklemeden çalışırsa, aşağıdaki amaçlardan hangisi <b>işlerin sırasına bağlı değildir</b>?`,
      options: [`Makespan C<sub>max</sub>`, `Toplam gecikme (total tardiness)`, `Geç kalan iş sayısı`, `Maksimum gecikme`],
      answer: 0,
      explain: `Boşluksuz tek makinede son iş her zaman tüm işlem sürelerinin toplamında biter: C<sub>max</sub> = Σp, sıralamadan bağımsız. Toplam gecikme, geç kalan iş sayısı ve maksimum gecikme ise due date'lere göre sıralamaya bağlıdır (örn. yukarıdaki veride 1–2–3–4 için toplam gecikme 7, 2–1–4–3 için 2).`,
    },
    {
      q: `Notlarda scheduling cost (amaç) olarak sayılanlar arasında hangileri vardır?`,
      options: [
        `Makespan`,
        `Maximum tardiness`,
        `Total (weighted) number of tardy jobs`,
        `Satın alınan makine sayısı`,
      ],
      answer: [0, 1, 2],
      explain: `Notlardaki liste: makespan, maximum lateness, maximum tardiness, maximum weighted completion time, total (weighted) completion time, total (weighted) number of tardy jobs. Satın alınan makine sayısı bir scheduling cost değildir.`,
    },
    {
      q: `Job shop scheduling'deki <b>capacity constraints</b> hangi ifadeyle doğru verilmiştir?`,
      options: [
        `Her makine aynı anda yalnızca bir işi işleyebilir ve her iş aynı anda yalnızca bir makinede işlenebilir.`,
        `Her makine en fazla m işi toplam işleyebilir.`,
        `Bir iş aynı anda birden fazla makinede işlenerek hızlandırılabilir.`,
        `Her işin işlem süresi makinenin kapasitesini aşamaz.`,
      ],
      answer: 0,
      explain: `Notlar: "Each machine can process only one job and each job can be processed by only one machine at a given time (capacity constraints)". Kısıt iki yönlüdür; bir işin aynı anda birden çok makinede işlenmesi yasaktır.`,
    },
    {
      q: `Notlarda <b>Example 9 (Single Machine Scheduling)</b> nasıl yer alır?`,
      options: [
        `Hungarian method ile atama problemi olarak adım adım çözülür.`,
        `Ayrıntılı çözülmez; "Please refer to Winston 9.6., p. 528" diye yönlendirilir.`,
        `Dört işli bir örnek, 7 alt problemli bir B&amp;B ağacıyla çözülür.`,
        `Cutting plane (Gomory) ile çözülür.`,
      ],
      answer: 1,
      explain: `Notlarda Example 9 için verilen tek şey kaynak yönlendirmesidir: Winston, Section 9.6, s. 528. Verilen B&amp;B ağaçları 2.5 (pure/mixed/binary/knapsack) ve 2.6.2 (TSP, Example 10) için vardır. 7 alt problemli ağaç Joe State TSP örneğidir.`,
    },
    {
      q: `Notlara göre combinatorial problemler (tek makine sıralama, TSP) için <b>B&amp;B</b> hakkında ne söylenir?`,
      options: [
        `Çok sayıda olası çözüm değerlendirilmesi gerektiğinden, B&amp;B çoğu zaman bunları çözmenin etkili bir yoludur.`,
        `B&amp;B bu problemleri her zaman polinom sürede çözer.`,
        `B&amp;B bu problemlerde kullanılamaz; yalnızca enumeration uygulanabilir.`,
        `B&amp;B yalnızca sürekli değişkenli problemlerde kullanılır.`,
      ],
      answer: 0,
      explain: `Notlar: "In each of these problems, many possible solutions must be considered. A B&amp;B approach is often an efficient way to solve them." "Genellikle etkili" demek polinom süre garantisi anlamına gelmez; kötü durumda ağaç yine çok büyüyebilir.`,
    },
  ];

  /* ====================================================================== 2.6.2 */
  OR.content.summaries['2.6.2'] = `
<h2>2.6.2 TSP – Branch &amp; Bound (assignment relaxation + subtour dallanması)</h2>
<h3>Hatırlatma (1.7)</h3>
<ul>
  <li>x<sub>ij</sub> = 1 eğer satıcı i şehrinden j şehrine gidiyorsa, aksi halde 0. c<sub>ij</sub> = i'den j'ye mesafe (i ≠ j); <b>c<sub>ii</sub> = M</b> (gerçek mesafelere göre çok büyük bir sayı, şehirde "kalmayı" yasaklar).</li>
  <li>Aynı şehirde başlayıp biten ve her şehri bir kez ziyaret eden güzergâh <b>tour</b>'dur.</li>
</ul>

<h3>Fikir: assignment problem = TSP'nin relaxation'ı</h3>
<ul>
  <li>Maliyet matrisi c<sub>ij</sub> olan bir <b>assignment problem</b> (her şehirden bir çıkış, her şehre bir giriş) çözülür. Optimal çözüm bir <b>tour</b> ise, TSP'nin de optimal çözümüdür.</li>
  <li>Ama assignment'ın optimal çözümü tour olmak zorunda değildir: <b>subtour</b>'lar çıkabilir. Subtour'lı çözümleri baştan dışlayabilsek TSP'yi çözmüş olurduk, bunu doğrudan yapmak kolay değildir.</li>
  <li>Bu B&amp;B yaklaşımında <b>Subp.1</b> = subtour'a karşı hiçbir önlemi olmayan assignment problemi. Bu, TSP'nin bir <b>relaxation</b>'ıdır (daha az kısıtlı). TSP bir <b>min</b> problemi olduğundan z<sub>Subp.1</sub> bir <b>lower bound</b>'dur.</li>
  <li>Subp.1'in çözümü subtour içermiyorsa TSP için de optimaldir. Subtour varsa, bu subtour'lardan biri sonraki alt problemlerde <b>tekrar çıkmasın</b> diye dallanılır.</li>
</ul>

<h3>Dallanma kuralı</h3>
<ul>
  <li>Çözümdeki bir subtour seçilir (notlarda <i>keyfî</i>: "We arbitrarily choose to exclude the subtour 3-4-3"). Optimal tour bu subtour'u içeremez, yani subtour'daki <b>arc'lardan en az biri 0</b> olmalıdır.</li>
  <li>Subtour'daki <b>her arc için bir alt problem</b> yazılır: o arc yasaklanır, <b>x<sub>ij</sub> = 0 ⇔ c<sub>ij</sub> = M</b>. Matristeki o hücre M yapılır, assignment yeniden çözülür (Hungarian method).</li>
  <li>2 şehirli subtour (3–4–3) için 2 arc → 2 çocuk. Daha uzun subtour için arc sayısı kadar çocuk.</li>
  <li>Arama sırası: <b>LIFO</b> (notlarda "Following the LIFO approach"): en son oluşturulan açık alt problem önce çözülür.</li>
  <li>Fathom / karar: alt problem <b>infeasible</b> ise; çözüm bir <b>tour</b> ise (candidate; <b>UB</b> = en iyi tour uzunluğu); ya da <b>z ≥ UB</b> ise ("z &lt; 668 veremeyen düğüm elenir") düğüm elenir. Subtour'lu ve z &lt; UB olan düğüm tekrar dallanır.</li>
</ul>

<h3>Example 10 – Joe State (Winston 9.6, s. 530)</h3>
<p>Joe State Gary, Fort Wayne, Evansville, Terre Haute ve South Bend'de sigorta acentelerine sahiptir ve her Aralık hepsini ziyaret eder. Şehirler: <b>1 = Gary, 2 = Fort Wayne, 3 = Evansville, 4 = Terre Haute, 5 = South Bend</b>. Mesafeler (mil), simetrik:</p>
${mtxM(JOE)}

<p><b>Subp.1</b> (diagonal M; Hungarian method): optimal çözüm <b>x<sub>15</sub> = x<sub>21</sub> = x<sub>34</sub> = x<sub>43</sub> = x<sub>52</sub> = 1</b>, kontrol: 58 + 132 + 113 + 113 + 79 = <b>z = 495</b>.</p>
${mtxM(JOE, [], [[1, 5], [2, 1], [3, 4], [4, 3], [5, 2]])}
<p>İki subtour: <b>1–5–2–1</b> (Gary → South Bend → Fort Wayne → Gary) ve <b>3–4–3</b>. Bu çözüm Joe'nun problemi için optimal olamaz. Notlar 3–4–3'ü dışlamayı seçer: optimal tour'da x<sub>34</sub> = 0 <i>veya</i> x<sub>43</sub> = 0 olmalıdır →</p>
<ul>
  <li><b>Subp.2</b> = Subp.1 + (x<sub>34</sub> = 0, yani c<sub>34</sub> = M)</li>
  <li><b>Subp.3</b> = Subp.1 + (x<sub>43</sub> = 0, yani c<sub>43</sub> = M)</li>
</ul>

<p><b>Subp.2</b> (notlar önce bunu çözer): c<sub>34</sub> = M.</p>
${mtxM(JOE, [[3, 4]], [[1, 4], [2, 5], [3, 1], [4, 3], [5, 2]], [[3, 4]])}
<p>Optimal: <b>x<sub>14</sub> = x<sub>25</sub> = x<sub>31</sub> = x<sub>43</sub> = x<sub>52</sub> = 1, z = 652</b> (164 + 79 + 217 + 113 + 79). Subtour'lar <b>1–4–3–1</b> ve <b>2–5–2</b>. LIFO ile Subp.2 dallanır, 2–5–2 dışlanır:</p>
<ul>
  <li><b>Subp.4</b> = Subp.2 + (x<sub>25</sub> = 0, c<sub>25</sub> = M)</li>
  <li><b>Subp.5</b> = Subp.2 + (x<sub>52</sub> = 0, c<sub>52</sub> = M)</li>
</ul>

<p><b>Subp.4</b>: c<sub>34</sub> = M ve c<sub>25</sub> = M (yasaklar birikir).</p>
${mtxM(JOE, [[3, 4], [2, 5]], [[1, 5], [2, 4], [3, 1], [4, 3], [5, 2]], [[2, 5]])}
<p>Optimal: <b>x<sub>15</sub> = x<sub>24</sub> = x<sub>31</sub> = x<sub>43</sub> = x<sub>52</sub> = 1, z = 668</b>. Subtour yok, <b>tour 1–5–2–4–3–1</b> (58 + 79 + 201 + 113 + 217 = 668). Bu bir <b>candidate</b>: UB = 668; z &lt; 668 veremeyen her düğüm elenebilir.</p>
<p><b>Subp.5</b>: x<sub>14</sub> = x<sub>43</sub> = x<sub>32</sub> = x<sub>25</sub> = x<sub>51</sub> = 1, <b>z = 704</b> (tour 1–4–3–2–5–1). 704 ≥ 668, Subp.4'ten iyi değil → <b>elenir</b>.</p>
<p>Geriye <b>Subp.3</b> kalır: x<sub>13</sub> = x<sub>25</sub> = x<sub>34</sub> = x<sub>41</sub> = x<sub>52</sub> = 1, <b>z = 652</b>, subtour'lar 1–3–4–1 ve 2–5–2. 652 &lt; 668 olduğu için bu düğüm hâlâ 668'den iyi bir tour verebilir → dallan:</p>
<ul>
  <li><b>Subp.6</b> = Subp.3 + (c<sub>25</sub> = M)</li>
  <li><b>Subp.7</b> = Subp.3 + (c<sub>52</sub> = M)</li>
</ul>
<p>Notlar: iki alt problemin de z-değeri 668'den küçük değildir → ikisi de elenir. (Bizim hesabımız, notlarda yok: Subp.6'nın optimali 704, Subp.7'nin optimali 668'dir; ikincisi bulunan tour 1–3–4–2–5–1, Subp.4 tour'unun ters yönüdür. İkisi de z ≥ 668.)</p>

<h4>Özet tablo (çözüm sırası LIFO: 1 → 2 → 4 → 5 → 3 → 6 → 7)</h4>
<table>
  <tr><th>Subp.</th><th>Yeni yasak</th><th>Optimal atama</th><th>z</th><th>Yapı</th><th>Karar</th></tr>
  <tr><td>1</td><td>–</td><td>x<sub>15</sub> x<sub>21</sub> x<sub>34</sub> x<sub>43</sub> x<sub>52</sub></td><td>495</td><td>1–5–2–1 ve 3–4–3</td><td>3–4–3'ü kır: Subp.2, 3</td></tr>
  <tr><td>2</td><td>x<sub>34</sub> = 0</td><td>x<sub>14</sub> x<sub>25</sub> x<sub>31</sub> x<sub>43</sub> x<sub>52</sub></td><td>652</td><td>1–4–3–1 ve 2–5–2</td><td>2–5–2'yi kır: Subp.4, 5</td></tr>
  <tr><td>4</td><td>x<sub>25</sub> = 0</td><td>x<sub>15</sub> x<sub>24</sub> x<sub>31</sub> x<sub>43</sub> x<sub>52</sub></td><td><b>668</b></td><td>tour 1–5–2–4–3–1</td><td>Candidate, UB = 668</td></tr>
  <tr><td>5</td><td>x<sub>52</sub> = 0</td><td>x<sub>14</sub> x<sub>43</sub> x<sub>32</sub> x<sub>25</sub> x<sub>51</sub></td><td>704</td><td>tour 1–4–3–2–5–1</td><td>704 ≥ 668, elenir</td></tr>
  <tr><td>3</td><td>x<sub>43</sub> = 0</td><td>x<sub>13</sub> x<sub>25</sub> x<sub>34</sub> x<sub>41</sub> x<sub>52</sub></td><td>652</td><td>1–3–4–1 ve 2–5–2</td><td>652 &lt; 668, dallan: Subp.6, 7</td></tr>
  <tr><td>6, 7</td><td>x<sub>25</sub> = 0 / x<sub>52</sub> = 0</td><td colspan="4">z ≥ 668 (notlar); hesap: 704 ve 668</td><td>İkisi de elenir</td></tr>
</table>

<div class="model">Subp.1 (495)
 ├─ x34=0 → Subp.2 (652)
 │           ├─ x25=0 → Subp.4 (668, TOUR → UB)
 │           └─ x52=0 → Subp.5 (704, tour, ≥ UB → elenir)
 └─ x43=0 → Subp.3 (652)
             ├─ x25=0 → Subp.6 (≥ 668 → elenir)
             └─ x52=0 → Subp.7 (≥ 668 → elenir)</div>

<div class="box"><b>Sonuç:</b> Subp.4 optimaldir. Joe: Gary (1) → South Bend (5) → Fort Wayne (2) → Terre Haute (4) → Evansville (3) → Gary (1), toplam <b>668 mil</b>. Subp.1'in 495 değeri yalnızca bir lower bound'du: 495 ≤ z* = 668.</div>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>495 bir tour uzunluğu <b>değildir</b>; relaxation'ın değeri, yani <b>lower bound</b>. Bulunan tour uzunluğu ise <b>upper bound</b>'dur.</li>
  <li>Subp.4'te tour bulunca durmayın: Subp.3 (z = 652 &lt; 668) açıktı ve daha iyi tour verebilirdi. Ancak tüm açık düğümler elenince tour optimal olur.</li>
  <li>Fathom koşulu <b>z ≥ UB</b>'dir (eşitlik dahil): z = UB olan düğüm daha iyi (z &lt; UB) bir tour veremez.</li>
  <li>Her çocuk <b>yalnızca bir arc</b> yasaklar (c<sub>ij</sub> = M). Subtour'daki tüm arc'ları aynı alt problemde yasaklamak, bu arc'lardan yalnızca birini içeren geçerli tour'ları da keser. Bir subtour'un tüm arc'ları aynı anda 1 olamayacağı için, "en az biri 0" mantığıyla her arc için ayrı çocuk gerekir.</li>
  <li>Yasaklar dala <b>birikir</b> (Subp.4'te hem c<sub>34</sub> hem c<sub>25</sub> M'dir) ve kardeş dallara geçmez (Subp.3'te c<sub>34</sub> M <i>değildir</i>, c<sub>43</sub> M'dir).</li>
  <li>Sıra <b>LIFO</b>: 1, 2, 4, 5, 3, 6, 7 (breadth-first 1, 2, 3, 4… değil). Hangi subtour'un seçileceği notlarda keyfîdir; sınavda soru yönlendirmiyorsa notlardaki seçimi izleyin.</li>
  <li>c<sub>ii</sub> = M, aksi halde assignment problemi "şehirde kal" (x<sub>ii</sub> = 1, 1 şehirli subtour) çözümünü seçerdi.</li>
</ul></div>
`;

  OR.content.concepts['2.6.2'] = [
    {
      q: `TSP için kurulan ve <b>Subp.1</b> olarak çözülen <b>assignment problemi</b> neden TSP'nin bir <b>relaxation</b>'ıdır?`,
      options: [
        `Çünkü subtour'ları yasaklayan kısıtlar yoktur; her tour bir assignment çözümüdür ama her assignment çözümü tour değildir.`,
        `Çünkü assignment problemi ek integrality kısıtları getirir.`,
        `Çünkü assignment problemi mesafeleri yuvarlar.`,
        `Çünkü assignment problemi şehir sayısını azaltır.`,
      ],
      answer: 0,
      explain: `Her şehirden bir çıkış ve her şehre bir giriş koşulları (assignment) tour'un da sağladığı koşullardır, ancak subtour'lara karşı önlem yoktur. Feasible bölge TSP'ninkinden büyüktür: bu bir <b>relaxation</b>'dır. Optimal assignment çözümü subtour içermiyorsa TSP için de optimaldir.`,
    },
    {
      q: `Joe State örneğinde Subp.1'in optimal değeri z = 495'tir. TSP (min) için bu değer ne anlama gelir?`,
      options: [
        `Joe'nun optimal tur uzunluğudur.`,
        `Her tour'un uzunluğu için bir <b>lower bound</b>'dur: z* ≥ 495.`,
        `Optimal tur uzunluğu için bir <b>upper bound</b>'dur: z* ≤ 495.`,
        `1–5–2–1 subtour'unun uzunluğudur.`,
      ],
      answer: 1,
      explain: `Subp.1 bir relaxation'dır ve TSP min problemidir; relaxation daha geniş bölgede minimum aldığı için z<sub>relax</sub> ≤ z*. Dolayısıyla 495 bir <b>lower bound</b>'dur (gerçek optimum 668). 495 tek bir tour'un uzunluğu değildir; iki subtour'un toplamıdır (1–5–2–1: 58 + 79 + 132 = 269 ve 3–4–3: 226).`,
    },
    {
      q: `Assignment maliyet matrisinde köşegen için <b>c<sub>ii</sub> = M</b> alınmasının nedeni nedir?`,
      options: [
        `Assignment problemi x<sub>ii</sub> = 1 ("şehirde kal", 1 şehirli subtour) çözümünü seçmesin.`,
        `Mesafeler simetrik olsun.`,
        `Hungarian method yalnızca M içeren matrislerde çalışır.`,
        `Tüm tour'ların uzunluğu aynı olsun.`,
      ],
      answer: 0,
      explain: `c<sub>ii</sub> küçük (ör. 0) olsaydı assignment problemi satıcıyı şehirde bırakmayı (x<sub>ii</sub> = 1) tercih ederdi. M büyük bir sayı olduğundan bu hücreler seçilmez. Simetri matrisin özelliğidir, c<sub>ii</sub> ile ilgisi yoktur.`,
    },
    {
      q: `Joe State Subp.1 çözümü: <b>x<sub>15</sub> = x<sub>21</sub> = x<sub>34</sub> = x<sub>43</sub> = x<sub>52</sub> = 1</b>. Bu çözümdeki subtour'lar hangileridir?`,
      options: [
        `1–2–1 ve 3–4–5–3`,
        `Subtour yok; tek tour 1–5–2–4–3–1`,
        `1–5–3–1 ve 2–4–2`,
        `1–5–2–1 ve 3–4–3`,
      ],
      answer: 3,
      explain: `Arc'ları izleyelim: 1 → 5 (x<sub>15</sub>), 5 → 2 (x<sub>52</sub>), 2 → 1 (x<sub>21</sub>): <b>1–5–2–1</b>. 3 → 4 (x<sub>34</sub>), 4 → 3 (x<sub>43</sub>): <b>3–4–3</b>. İki döngü tüm şehirleri tek turda kapsamaz; bu yüzden çözüm Joe'nun problemi için geçerli bir tour değildir.`,
    },
    {
      q: `Notlar Subp.1'de <b>3–4–3</b> subtour'unu dışlamayı seçer. Hangi iki alt problem oluşturulur?`,
      options: [
        `Subp.2: x<sub>13</sub> = 0; Subp.3: x<sub>14</sub> = 0`,
        `Tek alt problem: c<sub>34</sub> = M ve c<sub>43</sub> = M birlikte`,
        `Subp.2: x<sub>34</sub> = 1; Subp.3: x<sub>43</sub> = 1`,
        `Subp.2: x<sub>34</sub> = 0 (c<sub>34</sub> = M); Subp.3: x<sub>43</sub> = 0 (c<sub>43</sub> = M)`,
      ],
      answer: 3,
      explain: `Optimal bir tour hem 3→4 hem 4→3 arc'ını içeremez (3–4–3 subtour'u oluşur), yani x<sub>34</sub> = 0 <b>veya</b> x<sub>43</sub> = 0. Her biri için ayrı bir alt problem: Subp.2 (c<sub>34</sub> = M) ve Subp.3 (c<sub>43</sub> = M). İkisini aynı alt problemde yasaklamak, bu arc'lardan yalnızca birini kullanan geçerli tour'ları da keserdi. x<sub>ij</sub> = 1 dalları dallanma kuralı değildir.`,
    },
    {
      q: `TSP B&amp;B dallanması hakkında hangileri doğrudur?`,
      options: [
        `x<sub>ij</sub> = 0 yazmak, maliyet matrisinde c<sub>ij</sub> = M yapmakla aynı şeydir.`,
        `Bir subtour'daki arc'lardan en az biri 0 olmak zorundadır; bu yüzden subtour'un her arc'ı için ayrı bir çocuk oluşturulur.`,
        `Subp.2'de oluşan optimal atama yine 3 → 4 arc'ını seçebilir.`,
        `Çocuk alt problemlerde Hungarian method yerine enumeration gerekir.`,
      ],
      answer: [0, 1],
      explain: `Notlar: "Subp.2: Subp.1 + (x<sub>34</sub> = 0, or c<sub>34</sub> = M)". Arc yasaklanınca atama o hücreyi seçemez, dolayısıyla 3 → 4 Subp.2'de çıkamaz. Her çocuk yine bir assignment problemidir ve Hungarian method ile çözülür.`,
    },
    {
      q: `Subp.2 (Subp.1 + c<sub>34</sub> = M) için <b>x<sub>14</sub> = x<sub>25</sub> = x<sub>31</sub> = x<sub>43</sub> = x<sub>52</sub> = 1, z = 652</b> bulunur. Sonraki adım nedir?`,
      options: [
        `652 > 495 olduğu için Subp.2 elenir.`,
        `Çözüm bir tour'dur; 652 yeni UB olur.`,
        `1–4–3–1 ve 2–5–2 subtour'ları vardır, henüz tour yok: dallan. Notlardaki gibi 2–5–2 kırılır: Subp.4 (c<sub>25</sub> = M), Subp.5 (c<sub>52</sub> = M).`,
        `Subp.2'yi bırak ve önce Subp.3'ü çöz (breadth-first).`,
      ],
      answer: 2,
      explain: `x<sub>14</sub>: 1 → 4, x<sub>43</sub>: 4 → 3, x<sub>31</sub>: 3 → 1 → subtour <b>1–4–3–1</b>; x<sub>25</sub>, x<sub>52</sub> → <b>2–5–2</b>. Çözüm tour olmadığı için candidate olamaz; henüz hiç tour yok (UB = ∞) ve bu yüzden fathom da edilemez. 652 &gt; 495 olması elemeyi gerektirmez (lower bound daha büyük olabilir). LIFO gereği önce Subp.2'nin çocukları çözülür.`,
    },
    {
      q: `Notlardaki sırayı izleyin: Subp.4 (Subp.2 + c<sub>25</sub> = M) çözülünce <b>x<sub>15</sub> = x<sub>24</sub> = x<sub>31</sub> = x<sub>43</sub> = x<sub>52</sub> = 1, z = 668</b> bulunur. Bu düğüm için doğru karar hangisidir?`,
      options: [
        `Candidate tour 1–5–2–4–3–1, UB = 668; z ≥ 668 olan düğümler elenebilir.`,
        `Optimal çözüm ilan edilir, çünkü ilk bulunan tour'dur.`,
        `Subtour vardır, dallanılır.`,
        `Infeasible olduğu için elenir.`,
      ],
      answer: 0,
      hint: `Arc'ları izleyin: 1→5→2→4→3→1.`,
      explain: `1 → 5 → 2 → 4 → 3 → 1: tüm şehirler tek döngüde, yani bir <b>tour</b> (58 + 79 + 201 + 113 + 217 = 668). Bu bir <b>candidate</b>; UB = 668. İlk tour olması optimal olduğunu göstermez: açık düğümler (Subp.5 ve Subp.3) henüz elenmedi. İzleme: Subp.5 (z = 704) elenir, Subp.3 (z = 652 &lt; 668) dallanır ve çocukları elenince optimalite kanıtlanır.`,
    },
    {
      q: `Subp.5 (Subp.2 + c<sub>52</sub> = M) çözümü <b>x<sub>14</sub> = x<sub>43</sub> = x<sub>32</sub> = x<sub>25</sub> = x<sub>51</sub> = 1, z = 704</b>'tür (UB = 668 biliniyor). Neden elenir?`,
      options: [
        `Çünkü çözüm bir tour olduğu için tour'lar hep elenir.`,
        `Çünkü 704 ≥ 668: tour'dur ama mevcut en iyi tour'dan (668) daha iyi değildir.`,
        `Çünkü çözümde subtour vardır.`,
        `Çünkü 704 > 652 olduğu için.`,
      ],
      answer: 1,
      explain: `Çözüm tour (1–4–3–2–5–1: 164 + 113 + 290 + 79 + 58 = 704), ancak min problemde 704 &gt; 668. Notlar: "z = 704 is not as good as the subp.4 candidate's z = 668 → Subp.5 may be eliminated". Fathom koşulu z ≥ UB'dir. Tour olması tek başına eleme nedeni değildir (daha iyiyse candidate olurdu).`,
    },
    {
      q: `Subp.4 ve Subp.5 sonuçlandıktan sonra tek açık düğüm <b>Subp.3</b> kalır: z = 652, subtour'lar 1–3–4–1 ve 2–5–2, UB = 668. Doğru karar hangisidir?`,
      options: [
        `Fathom: 652 < 668 olduğu için.`,
        `Optimal çözüm 652'dir.`,
        `668'in optimal olduğu hemen ilan edilir; Subp.3'e bakılmaz.`,
        `Dallan: 652 < 668 olduğundan Subp.3 hâlâ 668'den iyi bir tour verebilir; 2–5–2 kırılır (Subp.6: c<sub>25</sub> = M, Subp.7: c<sub>52</sub> = M).`,
      ],
      answer: 3,
      explain: `Fathom koşulu <b>z ≥ UB</b>'dir; burada 652 &lt; 668 olduğundan düğüm elenemez. 652 bir tour değil, subtour'lı bir relaxation değeridir (alt problemin lower bound'u), dolayısıyla optimal değildir. Notlar: "it is still possible for this subproblem to yield a solution with no subtours that beats z = 668". Çocuklar (Subp.6, 7) çözüldüğünde ikisinin de z ≥ 668 olduğu görülür ve algoritma biter.`,
    },
    {
      q: `Joe State B&amp;B sonunda optimal tour aşağıdakilerden hangisidir?`,
      options: [
        `1–2–5–4–3–1, 737 mil`,
        `1–5–2–4–3–1, 668 mil`,
        `1–4–3–2–5–1, 704 mil`,
        `1–2–4–3–5–1, 807 mil`,
      ],
      answer: 1,
      hint: `Her seçeneğin mesafelerini tablodan toplayın.`,
      explain: `1–5–2–4–3–1: 58 + 79 + 201 + 113 + 217 = <b>668</b>. Diğerleri: 1–2–5–4–3–1: 132 + 79 + 196 + 113 + 217 = 737; 1–4–3–2–5–1: 164 + 113 + 290 + 79 + 58 = 704 (Subp.5'in tour'u); 1–2–4–3–5–1: 132 + 201 + 113 + 303 + 58 = 807. Gary → South Bend → Fort Wayne → Terre Haute → Evansville → Gary.`,
    },
    {
      q: `Bir düğümde z = UB (örn. z = 668, UB = 668) bulunmuş ve çözüm subtour içeriyor. Doğru karar nedir?`,
      options: [
        `Dallan, çünkü eşitlik durumunda daha iyi tour çıkabilir.`,
        `Candidate ilan et; UB'yi 668 yap.`,
        `Fathom: alt problemler daha kısıtlı olduğundan z azalamaz, yani z < 668 olan bir tour çıkmaz.`,
        `Infeasible say.`,
      ],
      answer: 2,
      explain: `Çocuk alt problemler daha çok kısıt (daha çok M) içerir, dolayısıyla optimal değerleri bu düğümün değerinden küçük olamaz (min problem). Düğümün z'si UB'ye eşitse altında z &lt; UB veren bir tour yoktur: fathom koşulu z ≥ UB'dir (notlarda "any node that cannot yield a z-value &lt; 668 may be eliminated"). Candidate olmak için çözümün tour olması ve z &lt; UB olması gerekir.`,
    },
    {
      q: `Joe State'te <b>Subp.4</b>'ün maliyet matrisinde köşegen dışında hangi hücreler M'dir?`,
      options: [
        `Yalnızca c<sub>25</sub>`,
        `c<sub>34</sub> ve c<sub>25</sub>`,
        `c<sub>43</sub> ve c<sub>25</sub>`,
        `c<sub>25</sub> ve c<sub>52</sub>`,
      ],
      answer: 1,
      explain: `Subp.4 = Subp.2 + (c<sub>25</sub> = M) ve Subp.2 = Subp.1 + (c<sub>34</sub> = M). Yasaklar dal boyunca <b>birikir</b>: c<sub>34</sub> = M ve c<sub>25</sub> = M. c<sub>43</sub> = M Subp.3 dalına (kardeş) aittir; c<sub>52</sub> = M ise Subp.5'tedir.`,
    },
    {
      q: `Notlardaki Joe State örneğinde alt problemlerin <b>çözülme sırası</b> (LIFO) hangisidir?`,
      options: [
        `1, 2, 3, 4, 5, 6, 7`,
        `1, 3, 2, 7, 6, 5, 4`,
        `1, 2, 4, 5, 3, 6, 7`,
        `1, 2, 4, 3, 5, 6, 7`,
      ],
      answer: 2,
      explain: `Subp.1 dallanır (2, 3 oluşur). LIFO: Subp.2 çözülür ve dallanır (4, 5 oluşur); sonra bunların altından devam edilir: 4, 5. Tüm Subp.2 alt ağacı bitince Subp.3'e dönülür; Subp.3 dallanır, 6 ve 7 çözülür. Sıra: <b>1, 2, 4, 5, 3, 6, 7</b>. Numaralar oluşturulma sırasını, LIFO çözüm sırasını belirler.`,
    },
    {
      q: `Aşağıdaki simetrik 5 şehirli TSP'de (c<sub>ii</sub> = M)
${mtxM(SMALL)}
Subp.1'in optimal ataması <b>x<sub>13</sub> = x<sub>32</sub> = x<sub>21</sub> = x<sub>45</sub> = x<sub>54</sub> = 1, z = 72</b>'dir. Dallanma ile ilgili hangisi doğrudur?`,
      options: [
        `Subtour'lar 1–3–2–1 ve 4–5–4'tür; 4–5–4 seçilirse çocuklar c<sub>45</sub> = M ve c<sub>54</sub> = M olur.`,
        `Çözüm bir tour'dur, dallanmaya gerek yoktur.`,
        `Subtour'lar 1–3–1 ve 2–4–2'dir.`,
        `Yalnızca c<sub>13</sub> = M yapılır.`,
      ],
      answer: 0,
      explain: `1 → 3 → 2 → 1 (x<sub>13</sub>, x<sub>32</sub>, x<sub>21</sub>) bir 3-şehirli subtour; 4 → 5 → 4 bir 2-şehirli subtour. Tour için tüm 5 şehir tek döngüde olmalıydı. Dışlanacak subtour'un arc'ları ayrı çocuklar olur: 4–5–4 için Subp.2 (c<sub>45</sub> = M) ve Subp.3 (c<sub>54</sub> = M). Maliyet kontrolü: c<sub>13</sub> + c<sub>32</sub> + c<sub>21</sub> + c<sub>45</sub> + c<sub>54</sub> = 11 + 15 + 6 + 20 + 20 = 72 (bu değer bir lower bound'dur).`,
    },
    {
      q: `Aynı küçük 5 şehirli örnek (Subp.1: z = 72, 4–5–4 kırılıyor). <b>Subp.2</b> (c<sub>45</sub> = M) çözülünce tour <b>1–5–4–3–2–1</b>, z = 74 bulunur (UB = 74). <b>Subp.3</b> (c<sub>54</sub> = M) çözümü de z = 74'tür (tour 1–2–3–4–5–1). Subp.3 için karar nedir?`,
      options: [
        `Fathom: z = 74 ≥ UB = 74; daha iyi tour çıkmaz.`,
        `Yeni candidate; UB 74'ten 73'e iner.`,
        `Dallan, çünkü z = UB.`,
        `Infeasible.`,
      ],
      answer: 0,
      hint: `1–5–4–3–2–1: 16 + 20 + 17 + 15 + 6.`,
      explain: `1–5–4–3–2–1: c<sub>15</sub> + c<sub>54</sub> + c<sub>43</sub> + c<sub>32</sub> + c<sub>21</sub> = 16 + 20 + 17 + 15 + 6 = 74. Subp.3'ün tour'u (1–2–3–4–5–1: 6 + 15 + 17 + 20 + 16 = 74) onun ters yönüdür (simetrik matriste aynı tur). Z, UB'den küçük değil (74 ≥ 74) → <b>fathom</b>. Tüm açık düğümler bitti: optimal tur uzunluğu 74.`,
    },
  ];

  /* ====================================================================== 2.7 */
  OR.content.summaries['2.7'] = `
<h2>2.7 Heuristics for TSP</h2>
<p>TSP bir IP olarak formüle edilebilir ama şehir sayısı büyüdükçe <b>hantal ve verimsiz</b> olur; B&amp;B ile çok şehirli TSP'lerde çok fazla hesaplama zamanı gerekir. <b>Heuristic</b>'ler hızlıca iyi (ama mutlaka optimal olmayan) bir çözüm verir. Notlarda iki yöntem:</p>
<ul>
  <li><b>Nearest-Neighbor Heuristic (NNH)</b> (2.7.1)</li>
  <li><b>Cheapest-Insertion Heuristic (CIH)</b> (2.7.2)</li>
</ul>
<h3>Heuristic'lerin değerlendirilmesi</h3>
<table>
  <tr><th>Yaklaşım</th><th>Anlamı</th></tr>
  <tr><td><b>Performance guarantees</b></td><td>Heuristic'in kurduğu tour'un optimalden en fazla ne kadar uzak olabileceğine dair <b>worst-case</b> sınır</td></tr>
  <tr><td><b>Probabilistic analysis</b></td><td>Şehirlerin konumlarının bilinen bir olasılık dağılımını izlediği varsayılarak değerlendirme</td></tr>
  <tr><td><b>Empirical analysis</b></td><td>Optimal tour'u bilinen birçok problemde heuristic'in sonuçlarını optimal ile karşılaştırma</td></tr>
</table>

<h3>2.7.1 Nearest-Neighbor Heuristic (NNH)</h3>
<ol>
  <li>Herhangi bir şehirden başla ve <b>en yakın</b> şehri ziyaret et.</li>
  <li>Sonra, <b>en son ziyaret edilen şehre en yakın</b> ziyaret edilmemiş şehre git.</li>
  <li>Tour tamamlanana kadar böyle devam et (son şehirden başlangıca dönülür).</li>
  <li>Prosedürü <b>her şehirden başlayarak</b> uygula, tour'ları ana şehirden başlayacak şekilde yeniden yaz ve <b>en iyisini</b> öner.</li>
</ol>
<p><b>Example 11</b> (Joe State, mesafe matrisi 2.6.2'dekiyle aynı):</p>
${mtxM(JOE)}
<p>Şehir 1'den başlayalım: şehir 1'e en yakın 5 (58) → 1–5; 5'e en yakın {2, 3, 4} içinde 2 (79) → 1–5–2; 2'ye en yakın {3, 4} içinde 4 (201) → 1–5–2–4; sonra 3 ve 1'e dönüş → <b>1–5–2–4–3–1</b> = 58 + 79 + 201 + 113 + 217 = <b>668</b>.</p>
<table>
  <tr><th>Başlangıç</th><th>NNH tour'u</th><th>Uzunluk</th><th>Hesap</th></tr>
  <tr><td>1</td><td>1–5–2–4–3–1</td><td><b>668</b></td><td>58 + 79 + 201 + 113 + 217</td></tr>
  <tr><td>2</td><td>2–5–1–4–3–2</td><td>704</td><td>79 + 58 + 164 + 113 + 290</td></tr>
  <tr><td>3</td><td>3–4–1–5–2–3</td><td>704</td><td>113 + 164 + 58 + 79 + 290</td></tr>
  <tr><td>4</td><td>4–3–1–5–2–4</td><td><b>668</b></td><td>113 + 217 + 58 + 79 + 201</td></tr>
  <tr><td>5</td><td>5–1–2–4–3–5</td><td>807</td><td>58 + 132 + 201 + 113 + 303</td></tr>
</table>
<p>En iyisi <b>668</b> (1 ve 4'ten başlayanlar <i>aynı</i> tour'dur). Bu örnekte NNH optimal tour'u verir (Subp.4'ün tour'u), ama notların vurguladığı gibi <b>başka problemlerde optimal vermeyebilir</b>.</p>

<h3>2.7.2 Cheapest-Insertion Heuristic (CIH)</h3>
<ol>
  <li>Herhangi bir şehirden başla ve <b>en yakın komşusunu</b> bul.</li>
  <li>Bu iki şehri birleştiren bir <b>subtour</b> oluştur (gidiş ve dönüş arc'ları).</li>
  <li>Subtour'daki bir (i, j) arc'ını, subtour'da olmayan bir k şehri için iki arc'a (i, k) ve (k, j) ile değiştir; seçim, subtour uzunluğunu <b>en az artıran</b> (k, arc) çifti olsun. <b>Artış = c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub></b>.</li>
  <li>Tour tamamlanana kadar tekrarla.</li>
  <li>Prosedürü <b>her şehirden başlayarak</b> uygula, en iyi tour'u öner.</li>
</ol>
<p><b>Example 12</b> (Joe State, şehir 1'den başlayarak). Şehir 1'e en yakın 5 → subtour (1, 5)–(5, 1), uzunluk 2·58 = 116. (1, 5) yerine (1, 2)–(2, 5), (1, 3)–(3, 5) veya (1, 4)–(4, 5) konabilir; (5, 1) yerine de (5, k)–(k, 1). Notlardaki karşılaştırma tablosu bir görüntüdür; değerleri biz hesapladık (artış = c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub>):</p>
<table>
  <tr><th>Adım</th><th>Mevcut subtour</th><th>Seçenekler (artış)</th><th>Seçim</th><th>Yeni uzunluk</th></tr>
  <tr><td>1</td><td>1–5–1 (116)</td><td>k = 2: 132 + 79 − 58 = <b>153</b>; k = 3: 217 + 303 − 58 = 462; k = 4: 164 + 196 − 58 = 302 (arc (1,5) ve (5,1) için aynı, simetrik)</td><td>(1,5) yerine (1,2)–(2,5)</td><td>269</td></tr>
  <tr><td>2</td><td>1–2–5–1 (269)</td><td>k = 4: (1,2) için 164 + 201 − 132 = <b>233</b>, (2,5) için 318, (5,1) için 302; k = 3: (1,2) için 375, (2,5) için 514, (5,1) için 462</td><td>(1,2) yerine (1,4)–(4,2)</td><td>502</td></tr>
  <tr><td>3</td><td>1–4–2–5–1 (502)</td><td>k = 3: (1,4) için 217 + 113 − 164 = <b>166</b>, (4,2) için 202, (2,5) için 514, (5,1) için 462</td><td>(1,4) yerine (1,3)–(3,4)</td><td><b>668</b></td></tr>
</table>
<p>Sonuç tour: (1,3)–(3,4)–(4,2)–(2,5)–(5,1) = <b>1–3–4–2–5–1</b>, uzunluk 217 + 113 + 201 + 79 + 58 = <b>668</b> (1–5–2–4–3–1'in ters yönü). Bu örnekte CIH de optimal tour'u verir; "in general, the CIH does not necessarily do so". Prosedür her şehirden başlayarak uygulanmalıdır. (Bizim hesabımız, notlarda yok: Joe State'te CIH beş başlangıcın hepsinden de 668 verir.)</p>

<h3>Ek örnek (notlarda yok): NNH ve CIH optimal olmayabilir</h3>
<p>Aşağıdaki simetrik 5 şehirli matriste optimal tur uzunluğu 74'tür (1–2–3–4–5–1 ve ters yönü).</p>
${mtxM(SMALL)}
<table>
  <tr><th>Başlangıç</th><th>NNH</th><th>CIH</th></tr>
  <tr><td>1</td><td>1–2–3–4–5–1 = <b>74</b></td><td>1–3–4–5–2–1 = 91 (artışlar: 20, 22, 37)</td></tr>
  <tr><td>2</td><td>2–1–3–4–5–2 = 91</td><td>91</td></tr>
  <tr><td>5</td><td>5–1–2–3–4–5 = <b>74</b></td><td>5–4–3–2–1–5 = <b>74</b></td></tr>
</table>
<p>Yani CIH şehir 1'den başlarsa 91 verir (optimalden %23 uzak); ancak şehir 5'ten başlayınca 74 bulur. Heuristic'ler başlangıç şehrine duyarlıdır, bu yüzden her şehirden denenir.</p>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>NNH'de bir sonraki şehir, <b>en son ziyaret edilen şehre</b> en yakın olandır (başlangıç şehrine değil). Son arc (son şehirden başlangıca dönüş) <b>zorunludur</b> ve uzun olabilir (şehir 5'ten başlayınca son arc 3→5 = 303 mildir; tour 807).</li>
  <li>CIH'de artış <b>c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub></b>'dir, sadece c<sub>ik</sub> + c<sub>kj</sub> <b>değil</b>. Aday: subtour'da olmayan tüm k ve subtour'daki tüm arc'lar.</li>
  <li>CIH, iki şehirli subtour'la başlar: en yakın komşu ile gidiş-dönüş (1–5–1, uzunluk 116).</li>
  <li>İki heuristic'i de <b>her şehirden</b> uygulayıp en iyiyi seçmek gerekir; tek bir başlangıç yetmez.</li>
  <li>Heuristic tour'un uzunluğu optimale bir <b>upper bound</b>'dur (tour feasible). Joe State'te assignment relaxation lower bound 495, tour 668 → 495 ≤ z* ≤ 668. Heuristic sonucun optimal olduğunu <i>kanıtlamak</i> için B&amp;B gibi bir optimal yöntem (veya lower bound = tour uzunluğu) gerekir.</li>
  <li>"NNH Joe State'te optimali buldu" demek, her problemde bulacağı anlamına gelmez (örnek yukarıda).</li>
</ul></div>
`;

  OR.content.concepts['2.7'] = [
    {
      q: `<b>Nearest-Neighbor Heuristic</b>'te ilk şehirden sonra hangi şehir seçilir?`,
      options: [
        `Başlangıç şehrine en yakın ziyaret edilmemiş şehir.`,
        `En son ziyaret edilen şehre en yakın ziyaret edilmemiş şehir.`,
        `Subtour uzunluğunu en az artıran şehir.`,
        `Başlangıçtan en uzak ziyaret edilmemiş şehir.`,
      ],
      answer: 1,
      explain: `NNH: "Go to the unvisited city closest to the city we have most recently visited." Başlangıç şehrine yakınlık ölçüt değildir. "Subtour uzunluğunu en az artıran" ifadesi Cheapest-Insertion'a aittir.`,
    },
    {
      q: `Joe State (mesafeler: c<sub>15</sub> = 58, c<sub>12</sub> = 132, c<sub>14</sub> = 164, c<sub>13</sub> = 217; c<sub>25</sub> = 79, c<sub>24</sub> = 201, c<sub>23</sub> = 290; c<sub>34</sub> = 113, c<sub>35</sub> = 303, c<sub>45</sub> = 196, c<sub>31</sub> = 217). NNH'yi <b>şehir 1</b>'den başlatırsak tour ve uzunluğu nedir?`,
      options: [
        `1–5–2–4–3–1, 668`,
        `1–5–4–3–2–1, 789`,
        `1–2–5–4–3–1, 737`,
        `1–5–2–3–4–1, 704`,
      ],
      answer: 0,
      explain: `1'e en yakın 5 (58); 5'ten {2, 3, 4} içinde en yakın 2 (79); 2'den {3, 4} içinde 4 (201) en yakın; kalan 3, sonra 1'e dönüş (217). Uzunluk 58 + 79 + 201 + 113 + 217 = <b>668</b>. 1–2–5–4–3–1 = 737 (ilk adımda en yakın şehir 5 olmalıydı, 2 değil). 1–5–2–3–4–1'de (704) 2'den 3 (290) seçilmiştir, oysa 4 (201) daha yakındır; bu NNH kuralını bozar. 1–5–4–3–2–1 (789) ise 5'ten sonra 2 (79) yerine 4 (196) seçer.`,
    },
    {
      q: `Joe State'te NNH şehir 2'den başlayınca 2–5–1–4–3–2 oluşur. 5'ten sonra neden <b>şehir 1</b> seçilir?`,
      options: [
        `Çünkü 1 başlangıç şehridir.`,
        `Ziyaret edilmemiş {1, 3, 4} içinde 5'e en yakın olan 1'dir (c<sub>51</sub> = 58 < c<sub>54</sub> = 196 < c<sub>53</sub> = 303).`,
        `Çünkü c<sub>12</sub> küçüktür.`,
        `Çünkü 5'ten 1'e gitmek her zaman zorunludur.`,
      ],
      answer: 1,
      explain: `Şehir 2'den 5'e gidildi (c<sub>25</sub> = 79 en küçük). Şimdi son ziyaret 5; ziyaret edilmemişler {1, 3, 4} ve c<sub>51</sub> = 58, c<sub>54</sub> = 196, c<sub>53</sub> = 303 olduğundan 1 seçilir. Sonra 1'den {3, 4} içinde 4 (164), sonra 3 ve 2'ye dönüş (290): 79 + 58 + 164 + 113 + 290 = 704.`,
    },
    {
      q: `Joe State'te NNH <b>şehir 5</b>'ten başlatılınca tour ve uzunluğu nedir?`,
      options: [`5–2–1–4–3–5, 668`, `5–1–2–4–3–5, 807`, `5–1–2–4–3–5, 704`, `5–4–3–1–2–5, 770`],
      answer: 1,
      hint: `5'e en yakın 1 (58); 1'den sonra 2; son arc 3 → 5.`,
      explain: `5 → 1 (58), 1 → 2 (132, {2, 3, 4} içinde en yakın), 2 → 4 (201), 4 → 3 (113), son olarak 3 → 5 (303): 58 + 132 + 201 + 113 + 303 = <b>807</b>. Bu, beş başlangıç içindeki en kötü sonuçtur. NNH'nin zorunlu son arc'ı (303) tour'u uzatmıştır.`,
    },
    {
      q: `Joe State'te NNH beş şehirden de çalıştırılınca uzunluklar 668 (1), 704 (2), 704 (3), 668 (4), 807 (5) çıkar. Hangileri doğrudur?`,
      options: [
        `En iyi NNH tour'u 668'dir.`,
        `1 ve 4'ten başlayan NNH tour'ları aynı tour'dur.`,
        `Şehir 5'ten başlayan NNH 668 verir.`,
        `Bu sonuç, 668'in optimal olduğunu NNH ile kanıtlar.`,
      ],
      answer: [0, 1],
      explain: `En iyi uzunluk 668'dir. 1–5–2–4–3–1 ve 4–3–1–5–2–4 aynı döngüdür (aynı yönde, farklı başlangıç noktası). Şehir 5'ten başlayınca 807 çıkar. Bir heuristic optimalite kanıtlamaz: 668'in optimal olduğunu B&amp;B (Subp.4'ün tour'u ve diğer düğümlerin elenmesi) gösterir. Notlar: "In this case, the NNH yields the optimal tour. However, for other problems it may not."`,
    },
    {
      q: `Joe State için assignment relaxation (Subp.1) z = 495 vermişti ve NNH ile 668 uzunluğunda bir tour bulundu. Optimal tur uzunluğu z* için ne söylenebilir?`,
      options: [`z* = 495`, `495 ≤ z* ≤ 668`, `z* ≥ 668`, `z* ≤ 495`],
      answer: 1,
      explain: `TSP min problemi: relaxation değeri 495 bir <b>lower bound</b> (z* ≥ 495), feasible bir tour'un uzunluğu 668 ise <b>upper bound</b> (z* ≤ 668). Yalnızca bu iki sayıyla optimal belirlenemez; B&amp;B ağacı tamamlanınca z* = 668 çıkar.`,
    },
    {
      q: `Joe State'te <b>Cheapest-Insertion</b> şehir 1'den başlatılıyor. İlk subtour ve uzunluğu nedir?`,
      options: [
        `1–2–1, 264 (en yakın değil, ilk şehir 2 seçilir)`,
        `1–5–1, 116`,
        `1–5–2–1, 269`,
        `1–5, 58 (tek arc)`,
      ],
      answer: 1,
      explain: `Şehir 1'e en yakın komşu 5'tir (c<sub>15</sub> = 58). CIH iki şehri birleştiren subtour'u gidiş ve dönüşle kurar: (1, 5)–(5, 1), uzunluk 58 + 58 = <b>116</b>. 1–5–2–1 (269) bir sonraki adımın sonucudur.`,
    },
    {
      q: `Joe State, CIH, subtour 1–5–1. Şehir k'yı (1,5) arc'ına eklemenin artışı c<sub>1k</sub> + c<sub>k5</sub> − c<sub>15</sub>'tir. <b>En ucuz ekleme</b> hangisidir?`,
      options: [
        `k = 3: 217 + 303 − 58 = 462`,
        `k = 4: 164 + 196 − 58 = 302`,
        `k = 2: 132 + 79 − 58 = 153`,
        `k = 2: 132 + 79 = 211`,
      ],
      answer: 2,
      explain: `Artışlar: k = 2 → 153, k = 4 → 302, k = 3 → 462. En küçüğü k = 2: (1,5) yerine (1,2)–(2,5) konur, yeni subtour 1–2–5–1, uzunluk 116 + 153 = 269. Son seçenek eklenen iki arc'ın toplamını alıp çıkarılan arc'ı unutur; doğru artış çıkarılan arc'ı düşer.`,
    },
    {
      q: `Joe State, CIH, mevcut subtour <b>1–2–5–1</b> (269). Eklenmemiş şehirler 3 ve 4. Bir sonraki ekleme hangisidir?`,
      options: [
        `Şehir 4, (1,2) yerine (1,4)–(4,2); artış 164 + 201 − 132 = 233`,
        `Şehir 3, (1,2) yerine (1,3)–(3,2); artış 217 + 290 − 132 = 375`,
        `Şehir 4, (5,1) yerine (5,4)–(4,1); artış 196 + 164 − 58 = 302`,
        `Şehir 4, (2,5) yerine (2,4)–(4,5); artış 201 + 196 − 79 = 318`,
      ],
      answer: 0,
      explain: `Tüm (k, arc) çiftlerinin artışı: şehir 4 → (1,2): 233, (2,5): 318, (5,1): 302; şehir 3 → (1,2): 375, (2,5): 514, (5,1): 462. Minimum <b>233</b> (şehir 4, arc (1,2)). Yeni subtour 1–4–2–5–1 (uzunluk 269 + 233 = 502). Notlar da (1, 2) yerine (1, 4)–(4, 2) koyar.`,
    },
    {
      q: `Joe State, CIH, şehir 1'den başlangıç. Son ekleme: subtour 1–4–2–5–1 (502), kalan şehir 3 en ucuz (1,4) arc'ının yerine (1,3)–(3,4) ile eklenir (artış 217 + 113 − 164 = 166). Tour ve uzunluğu nedir?`,
      options: [
        `1–3–4–2–5–1, 668`,
        `1–4–3–2–5–1, 704`,
        `1–3–4–2–5–1, 502 + 217 + 113 = 832`,
        `1–5–2–4–3–1, 502`,
      ],
      answer: 0,
      explain: `502 + 166 = <b>668</b>. Tour (1,3)–(3,4)–(4,2)–(2,5)–(5,1): 217 + 113 + 201 + 79 + 58 = 668. Bu tour, NNH'nin bulduğu 1–5–2–4–3–1'in ters yönüdür; yani Joe State'te CIH de optimal tour'u verir. Son seçenekte 502 hâlâ eksik bir subtour'un uzunluğudur.`,
    },
    {
      q: `Aşağıdaki simetrik 5 şehirli matriste (optimal tur 74) NNH'yi <b>şehir 2</b>'den başlatırsak tour ve uzunluğu nedir?
${mtxM(SMALL)}`,
      options: [`2–1–3–4–5–2, 91`, `2–1–5–4–3–2, 74`, `2–3–1–5–4–2, 82`, `2–1–3–4–5–2, 74`],
      answer: 0,
      explain: `2 → 1 (6, en yakın), 1 → 3 (11; {3, 4, 5} içinde en yakın), 3 → 4 (17; {4, 5} içinde en yakın, c<sub>35</sub> = 37), 4 → 5 (20), 5 → 2 (37): 6 + 11 + 17 + 20 + 37 = <b>91</b>. Optimal 74'ün (1–2–3–4–5–1) %23 üstündedir; yani NNH bu başlangıçtan optimal tour'u kaçırır. Diğer başlangıçlar (1 ve 5) 74 verdiği için tüm şehirlerden denendiğinde en iyisi optimali bulur.`,
    },
    {
      q: `Aynı 5 şehirli örnekte (optimal tur uzunluğu 74) Cheapest-Insertion şehir 1'den başlatılınca tour <b>1–3–4–5–2–1</b>, uzunluk 91 bulunur; şehir 5'ten başlatılınca 5–4–3–2–1–5 (74). Hangileri doğrudur?`,
      options: [
        `CIH her başlangıç şehrinden optimal tour'u bulur.`,
        `CIH'nin şehir 1'den verdiği tour optimalden uzaktır (91 > 74).`,
        `Tüm şehirlerden başlayıp en iyi tour'u seçmek, bu örnekte 74'ü verir.`,
        `CIH, optimal tour'u hiçbir zaman bulamaz.`,
      ],
      answer: [1, 2],
      explain: `Şehir 1'den: 1'in en yakın komşusu 2 (6) → 1–2–1 (12); 3'ü (1,2)'ye ekle (+20 → 32); 4'ü (3,2)'ye (+22 → 54); 5'i (4,2)'ye (+37 → 91). Şehir 5'ten başlayınca 74 çıkar. Notların uyarısı: CIH optimal olmak zorunda değildir ve bu yüzden her şehirden uygulanır; ancak "hiçbir zaman bulamaz" demek de yanlıştır (Joe State'te ve şehir 5'ten burada bulur).`,
    },
    {
      q: `Notlarda heuristic'lerin değerlendirilme yollarından biri: <b>"optimal tour'u bilinen birçok problemde heuristic sonuçları optimalle karşılaştırılır"</b>. Bu hangisidir?`,
      options: [`Performance guarantees`, `Probabilistic analysis`, `Empirical analysis`, `Complete enumeration`],
      answer: 2,
      explain: `Notlar üç yaklaşım sayar: <b>performance guarantees</b> (worst-case bound), <b>probabilistic analysis</b> (şehir konumlarının bilinen bir dağılımı izlediği varsayımı) ve <b>empirical analysis</b> (optimali bilinen problemlerle karşılaştırma). Complete enumeration bir değerlendirme yöntemi değil, çözüm yöntemidir.`,
    },
    {
      q: `Notlara göre TSP için neden heuristic kullanılır?`,
      options: [
        `Çok şehirli TSP'lerde B&amp;B çok hesaplama zamanı gerektirir; heuristic'ler hızlıca iyi, ama mutlaka optimal olmayan bir çözüm verir.`,
        `Heuristic'ler her zaman optimal çözümü verir ve B&amp;B'den hızlıdır.`,
        `TSP'nin IP formülasyonu hiçbir zaman yazılamaz.`,
        `Heuristic'ler yalnızca asimetrik TSP'de çalışır.`,
      ],
      answer: 0,
      explain: `Notlar: IP formülasyonu büyük TSP'lerde hantal ve verimsiz olabilir, B&amp;B çok zaman ister; heuristic'ler "good (but not necessarily optimal)" çözümü hızlıca verir. Optimalite garantisi yoktur.`,
    },
  ];

  /* ====================================================================== 2.8 */
  OR.content.summaries['2.8'] = `
<h2>2.8 Implicit Enumeration</h2>
<p><b>Implicit enumeration</b> genellikle <b>0-1 IP</b>'leri çözmek için kullanılır. Her değişkenin 0 veya 1 olması gerektiği bilgisini kullanarak B&amp;B'nin hem <b>branching</b> hem <b>bounding</b> bileşenlerini basitleştirir ve bir düğümün <b>infeasible</b> olup olmadığını verimli biçimde belirler. Kullanılan ağaç, 0-1 knapsack problemlerinde kullanılan ağaca benzer (her dallanmada x<sub>i</sub> = 0 ve x<sub>i</sub> = 1).</p>

<h3>Tanımlar</h3>
<table>
  <tr><th>Terim</th><th>Anlamı</th></tr>
  <tr><td><b>Fixed variables</b></td><td>Bir düğümde değeri belirlenmiş (0 ya da 1 verilmiş) değişkenler</td></tr>
  <tr><td><b>Free variables</b></td><td>O düğümde değeri belirlenmemiş değişkenler</td></tr>
  <tr><td><b>Completion</b></td><td>O düğümdeki tüm free değişkenlerin değerlerinin bir belirlenmesi</td></tr>
</table>
<p>f tane free değişkeni olan bir düğümün 2<sup>f</sup> completion'ı vardır.</p>

<h3>Üç ana fikir (notlardaki liste)</h3>
<ol>
  <li>Fixed değişkenleri olan bir düğümde, orijinal 0-1 problem için <b>feasible olan iyi bir completion</b>'ı kolayca bulmanın bir yolu var mı?</li>
  <li>Düğümün en iyi completion'ı feasible olmasa bile, düğümün feasible completion'larıyla elde edilebilecek amaç değeri için bir <b>bound</b> verir; bu bound düğümü elemek için kullanılabilir.</li>
  <li>Düğümün <b>tüm completion'larının infeasible</b> olduğunu kolayca anlamanın bir yolu var mı? Genel olarak: her kısıta bakılır ve her free değişkene o kısıtı <b>en iyi sağlayacak değer</b> verilerek, düğümün feasible completion'ı olup olmadığı kontrol edilir.</li>
</ol>
<div class="box">Notlarda 2.8 için sayısal bir örnek yoktur (yalnızca bu kavramlar). Notlarda "original 0-1 TSP" yazar; burada kastedilen <b>orijinal 0-1 IP</b>'dir. Aşağıdaki örnek <b>notlarda yok</b>, üç fikri somutlaştırmak için bizim hazırladığımız bir örnektir; tüm sayılar brute force ile doğrulanmıştır.</div>

<h3>Ek örnek (notlarda yok)</h3>
<div class="model">max z = 8x<sub>1</sub> + 5x<sub>2</sub> + 6x<sub>3</sub> + 3x<sub>4</sub>
s.t. 4x<sub>1</sub> + 3x<sub>2</sub> + 5x<sub>3</sub> + 2x<sub>4</sub> ≤ 8
     x<sub>j</sub> = 0 or 1</div>
<p>Optimal çözüm (16 olasılığın brute force taraması): <b>x<sub>1</sub> = x<sub>2</sub> = 1, x<sub>3</sub> = x<sub>4</sub> = 0, z = 13</b> (kısıt: 4 + 3 = 7 ≤ 8).</p>
<table>
  <tr><th>Düğüm (fixed)</th><th>Free</th><th>Ne yapılır?</th></tr>
  <tr><td>x<sub>1</sub> = 1, x<sub>3</sub> = 1</td><td>x<sub>2</sub>, x<sub>4</sub></td><td><b>Infeasibility testi:</b> kısıtı en iyi sağlayan değer free değişkenler için 0'dır (katsayılar ≥ 0, ≤ kısıt). Sol taraf ≥ 4 + 5 = 9 &gt; 8 → hiçbir completion feasible değil, düğüm elenir.</td></tr>
  <tr><td>x<sub>1</sub> = 1, x<sub>2</sub> = 1</td><td>x<sub>3</sub>, x<sub>4</sub></td><td><b>İyi feasible completion:</b> x<sub>3</sub> = x<sub>4</sub> = 0 → sol taraf 7 ≤ 8, z = 13 (candidate, LB = 13). <b>Bound:</b> amaç açısından en iyi completion x<sub>3</sub> = x<sub>4</sub> = 1 (z = 17) feasible değildir (sol taraf 14 &gt; 8) ama z ≤ 17 sınırını verir.</td></tr>
  <tr><td>x<sub>1</sub> = 0, x<sub>3</sub> = 0 (LB = 13 iken)</td><td>x<sub>2</sub>, x<sub>4</sub></td><td><b>Bounding:</b> en iyi completion x<sub>2</sub> = x<sub>4</sub> = 1 → z = 5 + 3 = 8 ≤ 13 → daha iyi çözüm yok, düğüm elenir.</td></tr>
  <tr><td>x<sub>1</sub> = 0, x<sub>2</sub> = 1, x<sub>3</sub> = 1 (LB = 13 iken)</td><td>x<sub>4</sub></td><td>Sol taraf zaten 3 + 5 = 8. Bound: 5 + 6 + 3 = 14 &gt; 13, yalnızca bound ile elenemez. Ama x<sub>4</sub> = 1 olursa sol taraf 10 &gt; 8; tek feasible completion x<sub>4</sub> = 0 → z = 11 ≤ 13 → eleme.</td></tr>
</table>
<p>Ağaç her seviyede bir free değişkeni x<sub>i</sub> = 0 / x<sub>i</sub> = 1 diye böler (knapsack ağacı gibi). Bir düğümde f free değişken varken o düğümü elemek, 2<sup>f</sup> completion'ı tek tek denemeden eler: bu "<b>implicit</b>" enumeration'dır.</p>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Fixed ≠ free: fixed değişkenin değeri bellidir; completion yalnızca <b>free</b> değişkenlerin değerlerinin tamamıdır. 2 fixed + 4 free → 2<sup>4</sup> = 16 completion (2<sup>6</sup> değil).</li>
  <li>"En iyi completion" amaç fonksiyonu açısından en iyidir ve <b>feasible olmak zorunda değildir</b>; yine de bound verir (max problemde upper bound). Feasible completion ayrıca aranır.</li>
  <li>Infeasibility testi: her kısıt için free değişkenlere kısıtı <b>en kolay sağlayan</b> değer verilir (≤ ve pozitif katsayı → 0; ≥ ve pozitif katsayı → 1). Bu en iyi halde bile kısıt sağlanmıyorsa tüm completion'lar infeasible'dır.</li>
  <li>Bound'un LB'den büyük olması düğümün işe yarayacağı anlamına gelmez: feasibility kontrolü daha sıkı bir sonuç verebilir (yukarıdaki son satır).</li>
  <li>Implicit enumeration <b>0-1</b> problemlere özgü bir basitleştirmedir; genel integer değişkenli problemler için değildir.</li>
</ul></div>
`;

  OR.content.concepts['2.8'] = [
    {
      q: `<b>Implicit enumeration</b> hangi tür problemleri çözmek için kullanılır ve neyi kullanır?`,
      options: [
        `Genel integer problemler; LP relaxation'ı çözerek.`,
        `Sürekli değişkenli LP'ler; simplex ile.`,
        `0-1 IP'ler; her değişkenin 0 ya da 1 olmasını branching, bounding ve infeasibility kontrolünü basitleştirmek için kullanarak.`,
        `Yalnızca TSP; assignment relaxation ile.`,
      ],
      answer: 2,
      explain: `Notlar: implicit enumeration genellikle 0-1 IP'ler için kullanılır; her değişkenin 0 veya 1 olması, B&amp;B'nin hem branching hem bounding bileşenini basitleştirir ve bir düğümün infeasible olup olmadığını verimli biçimde belirlemeyi sağlar. Ağacı 0-1 knapsack ağacına benzer.`,
    },
    {
      q: `5 değişkenli bir 0-1 IP'de bir düğümde <b>x<sub>1</sub> = 1 ve x<sub>3</sub> = 0</b> fixed'dir. Bu düğümde kaç <b>free değişken</b> ve kaç <b>completion</b> vardır?`,
      options: [`3 free değişken, 8 completion`, `2 free değişken, 4 completion`, `3 free değişken, 6 completion`, `5 free değişken, 32 completion`],
      answer: 0,
      explain: `Free değişkenler x<sub>2</sub>, x<sub>4</sub>, x<sub>5</sub> (3 tane). Completion, bu 3 değişkenin değerlerinin bir belirlenmesidir: 2<sup>3</sup> = <b>8</b>. 6 = 3·2 yanlış büyüme modelidir; 32 hiç değişken fixed değilken (kök) geçerlidir.`,
    },
    {
      q: `Notlara göre bir düğümdeki <b>completion</b> nedir?`,
      options: [
        `Fixed değişkenlerin değerlerinin bir belirlenmesi`,
        `Tüm free değişkenlerin değerlerinin bir belirlenmesi`,
        `Düğümün LP relaxation çözümü`,
        `Düğümün üst bound'u`,
      ],
      answer: 1,
      explain: `Notlar: "For any node, a specification of the values of all the free variables is called a completion of the node." Fixed değişkenlerin değeri zaten bellidir; completion, free olanların değerlerini belirler. Bound ise en iyi completion'ın değerinden elde edilir, completion'ın kendisi değildir.`,
    },
    {
      q: `10 değişkenli bir 0-1 IP'de, derinlik 3'teki (3 değişken fixed) bir düğüm elenirse kaç completion tek tek incelenmeden elenmiş olur?`,
      options: [`7`, `30`, `128`, `1 024`],
      answer: 2,
      hint: `7 free değişken kalır.`,
      explain: `Elenen düğümde 10 − 3 = 7 free değişken vardır; completion sayısı 2<sup>7</sup> = <b>128</b>. 1 024 = 2<sup>10</sup> tüm çözümlerin sayısıdır. İşte "implicit" kelimesi bundandır: 128 olasılık tek tek denenmeden elenir.`,
    },
    {
      q: `Notlardaki implicit enumeration'ın <b>üç ana fikri</b> arasında hangileri vardır?`,
      options: [
        `Fixed değişkenli bir düğümde feasible ve iyi bir completion'ı kolayca bulma yolu`,
        `En iyi completion feasible olmasa da feasible completion'lar için bir bound vermesi`,
        `Bir düğümün tüm completion'larının infeasible olduğunu kolayca belirleme yolu`,
        `Her düğümde simplex ile LP relaxation çözme zorunluluğu`,
      ],
      answer: [0, 1, 2],
      explain: `Üç ana fikir: (1) iyi bir feasible completion bulma, (2) en iyi completion'dan bound elde edip düğümü eleme, (3) tüm completion'ların infeasible olduğunu kolayca anlama. Implicit enumeration'ın amacı tam da her düğümde LP çözmeden bu basit kontrollerle ilerlemektir; LP relaxation zorunluluğu notlardaki fikirler arasında yoktur.`,
    },
    {
      q: `Model: max z = 8x<sub>1</sub> + 5x<sub>2</sub> + 6x<sub>3</sub> + 3x<sub>4</sub>, 4x<sub>1</sub> + 3x<sub>2</sub> + 5x<sub>3</sub> + 2x<sub>4</sub> ≤ 8, x<sub>j</sub> = 0 or 1. Bir düğümde <b>x<sub>1</sub> = 1, x<sub>3</sub> = 1</b> fixed'dir. Doğru karar hangisidir?`,
      options: [
        `x<sub>2</sub> ve x<sub>4</sub> 0 yapılsa bile sol taraf 9 > 8'dir: tüm completion'lar infeasible, düğüm elenir.`,
        `x<sub>4</sub> = 1 yapılarak feasible bir completion bulunur.`,
        `Düğüm dallanır: x<sub>2</sub> = 0 ve x<sub>2</sub> = 1.`,
        `z üst bound'u 22 olduğundan düğüm elenemez.`,
      ],
      answer: 0,
      explain: `Katsayılar pozitif ve kısıt ≤ olduğundan free değişkenlere kısıtı en iyi sağlayan değer 0'dır. Fixed kısmın sol tarafı bile 4 + 5 = 9 &gt; 8 olduğundan tüm completion'lar infeasible: <b>infeasibility testi</b> ile düğüm elenir. Bound (8 + 6 + 5 + 3 = 22) bu durumda anlamsızdır; infeasible düğüm bound'dan bağımsız elenir.`,
    },
    {
      q: `Aynı model. Düğüm: <b>x<sub>1</sub> = 1, x<sub>2</sub> = 1</b> fixed; x<sub>3</sub>, x<sub>4</sub> free. Hangileri doğrudur?`,
      options: [
        `Amaç açısından en iyi completion x<sub>3</sub> = x<sub>4</sub> = 1'dir (z = 17), bu düğüm için bir upper bound verir.`,
        `x<sub>3</sub> = x<sub>4</sub> = 1 completion'ı feasible'dır.`,
        `x<sub>3</sub> = x<sub>4</sub> = 0 feasible bir completion'dır ve z = 13 verir.`,
        `x<sub>3</sub> = 1 içeren her completion feasible'dır.`,
      ],
      answer: [0, 2],
      explain: `En iyi completion (amaç açısından) x<sub>3</sub> = x<sub>4</sub> = 1: z = 8 + 5 + 6 + 3 = 17, ancak sol taraf 4 + 3 + 5 + 2 = 14 &gt; 8 → infeasible; yine de düğümde z ≤ 17 olduğunu söyler (notlardaki 2. fikir). x<sub>3</sub> = x<sub>4</sub> = 0: sol taraf 7 ≤ 8, z = 13, feasible (candidate). x<sub>3</sub> = 1 olduğunda sol taraf ≥ 4 + 3 + 5 = 12 &gt; 8 → hiçbir completion feasible değil.`,
    },
    {
      q: `Aynı model, mevcut en iyi feasible çözüm z = 13 (LB = 13). Düğüm: <b>x<sub>1</sub> = 0, x<sub>3</sub> = 0</b> fixed; x<sub>2</sub>, x<sub>4</sub> free. Karar nedir?`,
      options: [
        `En iyi completion x<sub>2</sub> = x<sub>4</sub> = 1 → z = 8 ≤ 13; bu düğüm 13'ü aşamaz, elenir.`,
        `Bound 8 + 5 + 6 + 3 = 22, düğüm elenemez.`,
        `Düğüm infeasible'dır.`,
        `z = 8 yeni LB olur ve LB 13'ten 8'e düşer.`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> = 0 ve x<sub>3</sub> = 0 sabitken kalan en iyi değer 5 + 3 = 8 (hatta bu completion feasible: sol taraf 5 ≤ 8). 8 ≤ 13 olduğundan bu düğüm mevcut en iyi çözümü geçemez: bounding ile elenir. LB (max problemde en iyi feasible çözüm) hiçbir zaman düşmez. 22 fixed olmayan değişkenleri 1 sayma hatasıdır (x<sub>1</sub> ve x<sub>3</sub> bu düğümde 0'dır).`,
    },
    {
      q: `Aynı model, LB = 13. Düğüm: <b>x<sub>1</sub> = 0, x<sub>2</sub> = 1, x<sub>3</sub> = 1</b> fixed; x<sub>4</sub> free. Doğru analiz hangisidir?`,
      options: [
        `Bound 5 + 6 + 3 = 14 > 13; bu yüzden düğüm kesinlikle 13'ten iyi bir çözüm verir.`,
        `Sol taraf zaten 3 + 5 = 8; x<sub>4</sub> = 1 olursa 10 > 8 infeasible olur, yalnızca x<sub>4</sub> = 0 feasible ve z = 11 ≤ 13: düğüm elenir.`,
        `Düğüm infeasible'dır çünkü sol taraf 8'dir.`,
        `x<sub>4</sub> = 0 ve x<sub>4</sub> = 1 için iki ayrı LP çözülmelidir.`,
      ],
      answer: 1,
      explain: `Bound (en iyi completion x<sub>4</sub> = 1 için 14) yalnızca bir <i>üst sınırdır</i>, ulaşılabilir olduğunu söylemez. Burada x<sub>4</sub> = 1 completion'ı infeasible (sol taraf 10 &gt; 8). Tek feasible completion x<sub>4</sub> = 0: sol taraf 8 ≤ 8, z = 5 + 6 = 11 ≤ 13 → düğüm eleme. Sol taraf = 8 kısıtı tam sağlar; infeasible değildir.`,
    },
    {
      q: `3 değişkenli (x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> ikili) bir 0-1 problemde kısıt <b>x<sub>1</sub> + 2x<sub>2</sub> + x<sub>3</sub> ≥ 4</b> ve düğümde <b>x<sub>1</sub> = 0</b> fixed'dir. Infeasibility testi ne sonuç verir?`,
      options: [
        `Free değişkenlere kısıtı en iyi sağlayan değer (1) verilse bile sol taraf 0 + 2 + 1 = 3 < 4 → tüm completion'lar infeasible.`,
        `Free değişkenlere 0 verilir; sol taraf 0 ≥ 4 sağlanmadığı için infeasible.`,
        `x<sub>2</sub> = 1, x<sub>3</sub> = 0 ile sol taraf 2 olur, bu feasible'dır.`,
        `Düğümde 4 completion vardır ve dördü de feasible'dır.`,
      ],
      answer: 0,
      explain: `"≥" kısıtını (pozitif katsayılar) en iyi sağlayan değer free değişkenler için 1'dir. En iyi durumda bile sol taraf 0 + 2·1 + 1 = 3 &lt; 4: hiçbir completion kısıtı sağlayamaz. 0 vermek ≥ kısıtı için "en iyi sağlayan" değer değildir (≤ kısıtı için olurdu). Düğümde 2 free değişken olduğundan 4 completion vardır ama hiçbiri feasible değildir.`,
    },
    {
      q: `Implicit enumeration ağacında, x<sub>1</sub> = 1 fixed olan bir düğümde free x<sub>3</sub> üzerinden dallanılırsa çocuklar nelerdir?`,
      options: [
        `{x<sub>1</sub> = 1, x<sub>3</sub> = 0} ve {x<sub>1</sub> = 1, x<sub>3</sub> = 1}`,
        `{x<sub>3</sub> ≤ 0} ve {x<sub>3</sub> ≥ 1} yani x<sub>1</sub> serbest bırakılır`,
        `{x<sub>3</sub> = 0.5} tek çocuk`,
        `{x<sub>1</sub> = 0, x<sub>3</sub> = 0} ve {x<sub>1</sub> = 0, x<sub>3</sub> = 1}`,
      ],
      answer: 0,
      explain: `Binary değişkende dallanma, değişkeni 0 ve 1'e sabitlemektir (knapsack ağacında olduğu gibi). Mevcut fixed değerler (x<sub>1</sub> = 1) çocuklarda korunur; yeni fixed değişken x<sub>3</sub> olur ve her çocukta free değişken sayısı 1 azalır. x<sub>1</sub>'i geri serbest bırakmak veya kesirli değerlere dallanmak implicit enumeration'da yoktur.`,
    },
    {
      q: `max z = 8x<sub>1</sub> + 5x<sub>2</sub> + 6x<sub>3</sub> + 3x<sub>4</sub>, 4x<sub>1</sub> + 3x<sub>2</sub> + 5x<sub>3</sub> + 2x<sub>4</sub> ≤ 8, x<sub>j</sub> = 0 or 1 probleminin optimal çözümü hangisidir?`,
      options: [
        `x = (1, 1, 0, 0), z = 13`,
        `x = (1, 0, 0, 1), z = 11`,
        `x = (0, 1, 1, 0), z = 11`,
        `x = (1, 1, 1, 1), z = 22`,
      ],
      answer: 0,
      hint: `Sol tarafları hesaplayın: 7, 6, 8, 14.`,
      explain: `(1, 1, 0, 0): 4 + 3 = 7 ≤ 8, z = 13. (1, 0, 0, 1): 6 ≤ 8, z = 11. (0, 1, 1, 0): 8 ≤ 8, z = 11. Hepsi feasible ama z = 13 en iyisidir (16 olasılığın brute force taramasında 13'ü aşan feasible çözüm yoktur). (1, 1, 1, 1): sol taraf 14 &gt; 8, infeasible; z = 22 yalnızca ignore edilmiş kısıtla elde edilen sayıdır.`,
    },
  ];
})();
