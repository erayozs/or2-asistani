/* Chapter 2 (2.4 – 2.5.3) learning content: Branch & Bound concepts, pure / mixed / binary / knapsack.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, pages 25–33 (Examples 5, 6, 7, 8).
   Extra instances used only in questions (all numbers verified with js/core/lp.js + bnb.js):
     PB  : max 8x1+5x2 s.t. 4x1+5x2<=14, 8x1+4x2<=37, int
     M2  : max 5x1+5x2+4x3 s.t. 5x1+2x2+3x3<=12, x1+5x2+2x3<=17, x1,x2 int, x3 continuous
     BI2 : max 12x1+9x2+10x3+10x4 s.t. 7x1+8x2+2x3+5x4<=12, 2x1+6x2+8x3+4x4<=13, binary
     K1  : knapsack c=(12,9,8,5) a=(7,6,5,4) b=15
     K2  : knapsack c=(10,7,5,3) a=(6,5,4,3) b=12
     K3  : knapsack c=(14,9,10,6) a=(7,5,8,4) b=14 */
(function () {
  const OR = window.OR;

  /* ====================================================================== 2.4 */
  OR.content.summaries['2.4'] = `
<h2>2.4 The Branch-and-Bound Method (B&amp;B) — kavramlar</h2>
<p><b>Branch and bound</b>, en etkili <b>general purpose optimal</b> algoritmadır: LP tabanlı bir <b>tree search</b>. Land ve Doig tarafından 1960'ların başında önerildi. Fikir: uygulanabilir (feasible) çözümleri <b>sistematik ve örtük (implicit)</b> olarak saymak, öyle ki optimal integer çözüm bulunsun.</p>
<ul>
  <li>Enumeration'dan farkı: feasible çözümlerin <b>hepsi</b> değil, (umulur ki küçük) bir kısmı incelenir; yine de optimal integer çözüm <b>garanti</b> edilir.</li>
  <li>Tek bir subproblem'i çözmek, birçok olası çözümü birden eleyebilir.</li>
  <li>Subproblem'ler, optimal çözümde <b>kesirli</b> (fractional) çıkan uygun bir değişken üzerinden <b>branching</b> ile üretilir.</li>
</ul>

<h3>Branching kuralı (genel integer değişken)</h3>
<p>Subp.1'in LP çözümünde x<sub>k</sub> kesirli ve iki ardışık integer arasında (v &lt; x<sub>k</sub> &lt; v+1) ise:</p>
<div class="model">Subp.2 = Subp.1 + "x_k ≥ v+1"
Subp.3 = Subp.1 + "x_k ≤ v"          (örn. x1 = 15/4 = 3.75  →  x1 ≥ 4  ve  x1 ≤ 3)</div>
<p>Bu iki kısıt arasında <b>hiçbir integer nokta kaybolmaz</b>, ama kesirli LP noktası (x<sub>k</sub> = 3.75) <b>ikisinde de</b> bulunmaz; yani aynı LP çözümü tekrar çıkamaz. Çocuk (child) problemler daha kısıtlıdır: <b>max</b> problemde z<sub>child</sub> ≤ z<sub>parent</sub>.</p>

<h3>Candidate, Lower Bound (LB), Upper Bound (UB)</h3>
<ul>
  <li>Bir subproblem'in optimal çözümünde (integer olması gereken) <b>tüm değişkenler integer</b> ise bu çözüm orijinal IP için <b>feasible</b>'dır.</li>
  <li>Bu feasible çözümün z-değeri, daha önce bulunmuş tüm feasible çözümlerden <b>iyiyse</b> <b>candidate solution</b> olur ve z-değeri o anki <b>Lower Bound (LB)</b> (max problem) olur. Candidate, daha iyisi bulunana kadar saklanır.</li>
  <li>Root LR'nin z-değeri <b>Upper Bound (UB)</b>'dur (max). Her zaman: <b>LB ≤ z* ≤ UB</b>. Branching ilerledikçe UB düşer, LB yükselir; amaç boşluğu kapatmaktır.</li>
</ul>

<h3>Fathomed (inactive) — branch etmeye gerek yok</h3>
<table>
  <tr><th>Sebep</th><th>Neden branch gereksiz?</th></tr>
  <tr><td>1. Subproblem <b>infeasible</b></td><td>Çocukları daha kısıtlı, onlar da infeasible. Hiçbir IP çözümü içermez.</td></tr>
  <tr><td>2. Optimal çözümde <b>tüm değişkenler integer</b></td><td>Bu bölgedeki en iyi IP çözümü zaten bulundu (candidate olabilir).</td></tr>
  <tr><td>3. z-değeri <b>mevcut LB'yi aşmıyor</b> (z ≤ LB)</td><td>Bu bölge LB'den daha iyi bir IP çözümü veremez (bounding argument).</td></tr>
</table>

<h3>Bir subproblem çözülünce karar tablosu (max)</h3>
<table>
  <tr><th>Gözlem</th><th>Karar</th></tr>
  <tr><td>Infeasible</td><td>Fathom</td></tr>
  <tr><td>z ≤ LB (kesirli de olsa, integer de olsa)</td><td>Fathom</td></tr>
  <tr><td>z &gt; LB ve tüm değişkenler integer</td><td><b>Yeni candidate</b>, LB := z (eski candidate geçersizleşir); node fathom</td></tr>
  <tr><td>z &gt; LB ve kesirli değişken var</td><td><b>Branch</b> et (aktif kalır)</td></tr>
</table>
<div class="tip"><b>Integer-katsayı notu (Example 8'de kullanılır):</b> amaç fonksiyonu katsayıları ve tüm değişkenler integer ise her integer çözümün z'si integer'dır. O zaman z = 21.67 gibi bir node için "integer çözüm en fazla ⌊21.67⌋ = 21 verir" denir; LB = 21 ise bu node fathom edilebilir. Ondalıklı katsayılarda (Example 7) bu argüman <b>yoktur</b>.</div>

<h3>Sıradaki subproblem nasıl seçilir?</h3>
<table>
  <tr><th>Backtracking (LIFO)</th><th>Jumptracking</th></tr>
  <tr><td>Ağacın bir tarafında aşağı iner, bir candidate bulur; sonra diğer tarafın tepesine geri döner. <b>En son yaratılan</b> çözülmemiş subproblem çözülür.</td><td>Branch'in yarattığı <b>tüm</b> problemleri çözer; sonra <b>en iyi z-değerli</b> node'u branch eder. Ağacın bir ucundan diğerine "sıçrar".</td></tr>
  <tr><td>Derine inerek (genellikle) hızlı bir candidate / LB bulur</td><td>Her zaman en umut verici (en yüksek z'li) node'u genişletir; çok sayıda açık node tutar</td></tr>
</table>
<p>Çocuklardan hangisinin önce çözüleceği (LIFO) ve hangi kesirli değişkenin seçileceği notlarda <i>"arbitrarily"</i> (keyfî) bırakılır; ağaç değişir ama optimal z değişmez.</p>

<h3>Terminoloji</h3>
<ul>
  <li><b>Tree</b>: yaratılan subproblem'lerin gösterimi. <b>Node</b>: her subproblem. <b>Line (arc)</b>: eklenen her ek kısıt; eski ve yeni subproblem'i bağlar.</li>
  <li><b>Fathomed / inactive</b>: branch edilmesine gerek kalmayan node.</li>
  <li><b>Candidate solution</b>: şu ana kadarki en iyi IP-feasible çözüm. <b>LB</b>: onun z-değeri (max).</li>
</ul>
<div class="box"><b>Min problem (notlar max gösterir, mantık ayna):</b> LR değeri <b>lower bound</b>; candidate'ın z'si <b>upper bound (UB)</b>; z ≥ UB olan node fathom edilir.</div>
<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Kesirli çıkan her node branch edilmez: önce <b>z ≤ LB</b> kontrolü yapılır. z <b>= LB</b> de fathom demektir ("aşmıyor").</li>
  <li>Tüm-integer bir node <b>her zaman</b> yeni candidate değildir: z ≤ LB ise sadece fathom olur, LB değişmez.</li>
  <li>LB yalnızca <b>integer-feasible</b> çözümlerden gelir. Kesirli bir node'un z'si (örn. 44) asla LB olmaz; o bir UB'dir.</li>
  <li>Branching kısıtları: x = 3.4 için <b>x ≥ 4 ve x ≤ 3</b>; "x ≥ 3 ve x ≤ 4" yanlıştır (3.4 iki tarafta da kalır).</li>
  <li>Infeasible bir node'dan branch edilmez.</li>
  <li>LIFO: yeni yaratılan çocuklardan biri çözülür, <b>eski kardeş (parent'ın diğer çocuğu) beklemeye alınır</b>. Jumptracking: sonraki node z'ye göre seçilir, yaratılış sırasına göre değil.</li>
</ul></div>
`;

  OR.content.concepts['2.4'] = [
    {
      q: `Bir <b>max</b> IP'nin B&amp;B çözümünde root LR'nin değeri z = 52.6'dır. Şimdiye kadar bulunan en iyi integer-feasible (candidate) çözümün değeri z = 47'dir. IP'nin optimal değeri z* için hangisi kesin doğrudur?`,
      options: [`47 ≤ z* ≤ 52.6`, `z* ≥ 52.6`, `z* ≤ 47`, `z* = 47`],
      answer: 0,
      explain: `Candidate'ın z'si (47) feasible bir çözümden geldiği için max problemde <b>Lower Bound (LB)</b>'dir: z* ≥ 47. Root LR daha az kısıtlı olduğundan 52.6 bir <b>Upper Bound (UB)</b>'dur: z* ≤ 52.6. z* = 47 kesin değildir, daha iyi bir integer çözüm 47 ile 52.6 arasında olabilir.`,
    },
    {
      q: `Max bir IP'nin B&amp;B ağacında bir subproblem'i <b>fathom</b> etmek (branch etmemek) için geçerli sebepler hangileridir?`,
      options: [
        `Subproblem infeasible`,
        `Subproblem'in optimal çözümünde (integer olması gereken) tüm değişkenler integer`,
        `Subproblem'in optimal z-değeri mevcut LB'yi aşmıyor`,
        `Subproblem'in LP çözümünde en az bir değişken kesirli`,
        `Subproblem'in z-değeri mevcut LB'den büyük`,
      ],
      answer: [0, 1, 2],
      explain: `Notlardaki üç fathoming sebebi: (1) infeasible, (2) tüm değişkenler integer, (3) z-değeri LB'yi aşmıyor. "Kesirli değişken var" ve "z &gt; LB" ise tam tersine, node'un <b>branch edilmesi gerektiği</b> durumdur (ikisi birlikte).`,
    },
    {
      q: `Bir subproblem'in LP çözümünde x<sub>2</sub> = 3.4 çıkmış ve x<sub>2</sub>'nin integer olması gerekiyor. Hangi iki yeni subproblem yaratılır?`,
      options: [
        `Subp + "x<sub>2</sub> ≥ 4"  ve  Subp + "x<sub>2</sub> ≤ 3"`,
        `Subp + "x<sub>2</sub> ≥ 3"  ve  Subp + "x<sub>2</sub> ≤ 4"`,
        `Subp + "x<sub>2</sub> = 3"  ve  Subp + "x<sub>2</sub> = 4"`,
        `Subp + "x<sub>2</sub> ≥ 3.4"  ve  Subp + "x<sub>2</sub> ≤ 3.4"`,
      ],
      answer: 0,
      explain: `Kural: v &lt; x &lt; v+1 ise "x ≥ v+1" ve "x ≤ v" → x<sub>2</sub> ≥ 4 ve x<sub>2</sub> ≤ 3. İkinci seçenekte x<sub>2</sub> = 3.4 iki alt problemde de kalır (aynı LP çözümü tekrar çıkar). Üçüncüde x<sub>2</sub> = 5 veya 2 gibi feasible integer noktalar kaybolur. Dördüncüde 3.4 noktası iki tarafta da vardır.`,
    },
    {
      q: `Branching sonrası oluşan iki alt problem için hangileri doğrudur? (max problem)`,
      options: [
        `Hiçbir integer-feasible nokta iki alt problemin dışında kalmaz.`,
        `Kesirli LP optimum noktası iki alt problemde de bulunmaz; aynı çözüm tekrar çıkmaz.`,
        `İki alt problemin feasible bölgeleri birbiriyle kesişir (ortak noktaları vardır).`,
        `Bir çocuğun z-değeri, parent'ın z-değerinden büyük olabilir.`,
      ],
      answer: [0, 1],
      explain: `Branching kısıtları (x ≥ v+1, x ≤ v) integer noktaları korur ve kesirli noktayı iki tarafta da keser. Bölgeler ayrıktır (x ≥ 4 ile x ≤ 3 kesişmez). Çocuk, parent'a ek kısıt eklenmiş halidir; daha kısıtlı olduğu için max problemde z<sub>child</sub> ≤ z<sub>parent</sub>'tir.`,
    },
    {
      q: `Max bir IP'nin B&amp;B ağacının bir kısmı aşağıdadır:
<table>
<tr><th>Node</th><th>Parent</th><th>Eklenen kısıt</th><th>Sonuç</th></tr>
<tr><td>Subp.1</td><td>–</td><td>LR</td><td>z = 60.5, kesirli; branch edildi</td></tr>
<tr><td>Subp.2</td><td>1</td><td>x<sub>1</sub> ≥ 3</td><td>z = 58.2, kesirli; branch edildi</td></tr>
<tr><td>Subp.3</td><td>1</td><td>x<sub>1</sub> ≤ 2</td><td>z = 55.0, tüm değişkenler integer</td></tr>
<tr><td>Subp.4</td><td>2</td><td>x<sub>2</sub> ≥ 4</td><td>z = 57.9, kesirli</td></tr>
<tr><td>Subp.5</td><td>2</td><td>x<sub>2</sub> ≤ 3</td><td>infeasible</td></tr>
</table>
Bu noktada <b>hâlâ branch edilmeyi bekleyen (active)</b> subproblem hangisidir?`,
      options: [`Yalnızca Subp.4`, `Subp.3 ve Subp.4`, `Subp.2 ve Subp.4`, `Hiç subproblem kalmadı; Subp.3 optimaldir`],
      answer: 0,
      explain: `Subp.3 tüm-integer olduğu için candidate'tır (LB = 55.0) ve fathom edilmiştir. Subp.5 infeasible → fathom. Subp.1 ve Subp.2 zaten branch edildi. Subp.4 kesirli ve z = 57.9 &gt; LB = 55.0, dolayısıyla branch edilmelidir. Subp.3'ün optimal olduğu henüz söylenemez: Subp.4 bölgesi 55'ten iyi bir integer çözüm içerebilir.`,
    },
    {
      q: `Önceki sorudaki ağaçla aynı durum (Subp.3 candidate: LB = 55.0; Subp.4: z = 57.9 kesirli ve active; diğerleri fathomed). Bu noktada optimal z* için en dar doğru aralık hangisidir?`,
      options: [`55.0 ≤ z* ≤ 57.9`, `55.0 ≤ z* ≤ 60.5`, `57.9 ≤ z* ≤ 60.5`, `z* = 55.0`],
      answer: 0,
      explain: `LB = 55.0 (candidate). Üst sınır: fathom edilmiş node'lar hiçbir şekilde LB'den iyi bir çözüm veremez; tek açık node Subp.4'tür ve içinde z ≤ 57.9. Root'un 60.5'i artık gevşek bir üst sınırdır. UB, açık (active) node'ların en iyi z-değerine düşer.`,
    },
    {
      q: `Max bir IP'de Subp.1 → {Subp.2, Subp.3} branch edilmiş. <b>LIFO</b> ile önce Subp.2 çözülmüş ve kesirli çıktığı için Subp.4 ve Subp.5'e branch edilmiştir. Çözülmemiş problemler Subp.3, 4 ve 5'tir. LIFO'ya göre <b>sıradaki</b> hangisidir?`,
      options: [`Subp.3`, `Subp.4 veya Subp.5 (en son yaratılanlardan biri)`, `Subp.1'e geri dönülür`, `Sıra tamamen rastgeledir; LIFO bir kural koymaz`],
      answer: 1,
      explain: `LIFO (last in, first out): en son yaratılan çözülmemiş problem çözülür. Subp.4 ve 5 en son yaratılanlardır; hangisinin önce çözüleceği keyfîdir (notlarda Example 5'te Subp.4 seçilir). Subp.3 ancak Subp.2 altındaki dal tamamen bitince (backtrack) çözülür.`,
    },
    {
      q: `<b>Jumptracking</b> kullanılıyor. Çözülmüş ve branch edilmeyi bekleyen (fathom edilmemiş) üç node var; LB = 40:
<table>
<tr><th>Node</th><th>z</th><th>Yaratılış</th></tr>
<tr><td>A</td><td>44.2</td><td>en son yaratılan</td></tr>
<tr><td>B</td><td>47.9</td><td>en eski</td></tr>
<tr><td>C</td><td>46.0</td><td>ortada</td></tr>
</table>
Hangi node branch edilir?`,
      options: [`A (en son yaratılan)`, `B (en iyi z)`, `C`, `Üçü birden`],
      answer: 1,
      explain: `Jumptracking en iyi z-değerli node'u branch eder: B (47.9). A seçmek LIFO mantığıdır (en son yaratılan). Bu yüzden ağacın bir ucundan diğerine "sıçranır".`,
    },
    {
      q: `<b>Backtracking (LIFO)</b> ve <b>jumptracking</b> için hangileri doğrudur?`,
      options: [
        `LIFO ağacın bir tarafında aşağı inip bir candidate bulur, sonra diğer tarafın tepesine geri döner.`,
        `Jumptracking, branch'in yarattığı tüm problemleri çözer ve sonra en iyi z-değerine sahip node'u dallandırır.`,
        `Jumptracking daima en son yaratılan node ile devam eder.`,
        `LIFO her adımda bekleyen tüm node'ları çözüp en iyi z-değerine bakar.`,
      ],
      answer: [0, 1],
      explain: `Notlardaki tanımlar: Backtracking (LIFO) ağacın bir yanını boydan boya iner, candidate bulur, sonra geri döner. Jumptracking ise branch'in ürettiği tüm problemleri çözer, sonra en iyi z'li node'u branch eder. Son iki seçenek rolleri karıştırır.`,
    },
    {
      q: `B&amp;B ağacında "node" ve "line (arc)" terimleri neyi ifade eder?`,
      options: [
        `Her subproblem bir node'dur; subproblem'e eklenen her ek kısıt, eski ve yeni subproblem'i bağlayan bir line (arc)'tir.`,
        `Her ek kısıt bir node'dur; her subproblem bir line'dır.`,
        `Node, bir candidate solution'dır; line ise LB'dir.`,
        `Node yalnızca infeasible subproblem'ler, line ise fathom edilmiş olanlardır.`,
      ],
      answer: 0,
      explain: `Notlar: "A display of the subproblems that have been created is called a tree. Each subproblem is referred to as a node of the tree. Each additional constraint is referred to as a line (arc) connecting two nodes." Yani x<sub>1</sub> ≥ 4 gibi kısıtlar çizgi (kenar etiketi), LP'ler ise node'lardır.`,
    },
    {
      q: `Max bir IP'de başlangıçta LB yoktur. Subproblem'ler şu sırayla çözülüyor: (a) tüm değişkenler integer, z = 37; (b) tüm değişkenler integer, z = 40; (c) tüm değişkenler integer, z = 39; (d) kesirli, z = 44. Dört node da işlendikten sonra LB kaçtır?`,
      options: [`37`, `39`, `40`, `44`],
      answer: 2,
      explain: `(a) ilk feasible çözüm: LB = 37. (b) 40 &gt; 37: yeni candidate, LB = 40 (37'lik çözüm geçersizleşir). (c) 39 ≤ 40: tüm-integer ama LB'yi iyileştirmez → sadece fathom, LB aynı. (d) kesirli bir node LB üretmez; z = 44 &gt; 40 olduğundan branch edilecektir, LB 40'ta kalır. 44 bir UB-tipi bilgidir.`,
    },
    {
      q: `Max bir IP'de LB = 40'tır. Amaç katsayıları ondalıklıdır (örn. 0.2, 0.3, 0.5; "integer z" argümanı yok). Aşağıdaki node'lardan hangileri fathom edilir?`,
      options: [
        `A: z = 40.0, kesirli çözüm`,
        `B: z = 40.4, kesirli çözüm`,
        `C: z = 39.9, tüm değişkenler integer`,
        `D: infeasible`,
      ],
      answer: [0, 2, 3],
      explain: `Kural "z-değeri LB'yi <b>aşmıyorsa</b> (z ≤ LB)" fathom: A (40.0 = LB, aşmıyor) ve C (39.9 &lt; 40; integer olması LB'yi iyileştirmiyor) fathom edilir. D infeasible. B: 40.4 &gt; 40 ve kesirli → branch edilmelidir, çünkü içinde 40'tan iyi bir integer çözüm olabilir.`,
    },
    {
      q: `Bir subproblem <b>infeasible</b> çıktığında neden onun için branching yapılmaz?`,
      options: [
        `Çocukları daha kısıtlıdır; onlar da infeasible olacağından hiçbir IP çözümü içermezler.`,
        `Infeasible bir node'un çocukları her zaman optimal olur.`,
        `Infeasible node LB'yi sıfırlar.`,
        `Infeasible bir node görüldüğünde algoritma durur.`,
      ],
      answer: 0,
      explain: `Çocuk = parent + ek kısıt. Parent'ın hiç feasible noktası yoksa çocuğunki de olmaz. Notlar: "any branches emanating from subp.4 will yield no useful information, it is fruitless to create them." Algoritma durmaz, başka açık node'lara geçilir.`,
    },
    {
      q: `Branch and bound ile enumeration karşılaştırması için hangileri doğrudur?`,
      options: [
        `B&amp;B olası çözümlerin tamamını değil, (umulur ki küçük) bir kısmını örtük olarak inceler; yine de optimal integer çözümü garanti eder.`,
        `Tek bir subproblem'i çözmek birçok olası çözümü birden eleyebilir.`,
        `B&amp;B bir heuristic'tir ve optimalite garantisi vermez.`,
        `B&amp;B her zaman tam olarak 2<sup>n</sup> LP çözer.`,
      ],
      answer: [0, 1],
      explain: `B&amp;B "general purpose optimal" bir algoritmadır; güç kaynağı, bir LP'yi çözüp bütün bir bölgeyi (fathom ederek) elemesidir. Heuristic değildir. LP sayısı problemden probleme değişir: Example 7'de 4 binary değişkenli problemde 16 çözüm yerine 7 LP çözüldü.`,
    },
    {
      q: `Notlar max problem üzerinden anlatır. Bir <b>min</b> IP için B&amp;B'de roller nasıl değişir?`,
      options: [
        `LR değeri bir lower bound'dur; bulunan candidate'ın z'si upper bound (UB) olur; z ≥ UB olan node fathom edilir.`,
        `Hiçbir şey değişmez: LR yine upper bound, candidate yine lower bound'dur.`,
        `Candidate'ın z'si lower bound olur ve z ≤ LB olan node fathom edilir.`,
        `Min problemlerde fathoming kuralı yoktur.`,
      ],
      answer: 0,
      explain: `Min IP'de LR daha az kısıtlı olduğundan z<sub>LR</sub> ≤ z<sub>IP</sub> (lower bound). Feasible bir çözüm z* için üst sınır verir (UB). Dolayısıyla "daha iyi olamaz" kontrolü z ≥ UB ile yapılır. Max'taki kuralın ayna görüntüsüdür.`,
    },
  ];

  /* ====================================================================== 2.5 */
  OR.content.summaries['2.5'] = `
<h2>2.5 B&amp;B — Pure Integer Programming</h2>
<p>Pure IP'de <b>tüm</b> değişkenler integer'dır. Yöntem: LR çöz → kesirli bir integer değişken seç → <b>x ≥ ⌈x*⌉</b> ve <b>x ≤ ⌊x*⌋</b> ile ikiye böl → fathom kurallarını uygula. Notlarda child numaralandırması: önce "≥" (Subp.2), sonra "≤" (Subp.3).</p>

<h3>Example 5 (Winston 9.3, s.513)</h3>
<div class="model">max z = 8x<sub>1</sub> + 5x<sub>2</sub>
s.t.  x<sub>1</sub> + x<sub>2</sub> ≤ 6
      9x<sub>1</sub> + 5x<sub>2</sub> ≤ 45
      x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer</div>

<h3>Adım adım (LIFO)</h3>
<ol>
  <li><b>Subp.1 = LR</b>: z = 165/4 = 41.25, x<sub>1</sub> = 15/4, x<sub>2</sub> = 9/4. Bu, integer çözüm için bir <b>Upper Bound</b>'dur (max'ta gevşetme en az IP kadar iyi bir değer verir). Keyfî olarak x<sub>1</sub> seçilir.</li>
  <li>Branch x<sub>1</sub>: <b>Subp.2</b> = LR + x<sub>1</sub> ≥ 4; <b>Subp.3</b> = LR + x<sub>1</sub> ≤ 3. Hiçbiri x<sub>1</sub> = 15/4 noktasını içermez. Keyfî olarak Subp.2 çözülür: <b>z = 41, x<sub>1</sub> = 4, x<sub>2</sub> = 9/5</b>.</li>
  <li>Branch x<sub>2</sub> (kesirli): <b>Subp.4</b> = Subp.2 + x<sub>2</sub> ≥ 2; <b>Subp.5</b> = Subp.2 + x<sub>2</sub> ≤ 1. Çözülmemişler: Subp.3, 4, 5. LIFO ⇒ Subp.4 veya 5 çözülür (Subp.3 değil). Subp.4 seçilir: <b>infeasible</b> (9·4 + 5·2 = 46 &gt; 45) → fathom.</li>
  <li>Subp.5: <b>z = 365/9 ≈ 40.56, x<sub>1</sub> = 40/9, x<sub>2</sub> = 1</b>. Branch x<sub>1</sub>: <b>Subp.6</b> = Subp.5 + x<sub>1</sub> ≥ 5; <b>Subp.7</b> = Subp.5 + x<sub>1</sub> ≤ 4. Çözülmemişler: 3, 6, 7. LIFO ⇒ 6 veya 7; Subp.7 seçilir.</li>
  <li>Subp.7: <b>z = 37, x = (4, 1)</b> tüm integer → <b>candidate</b>, <b>LB = 37</b> (z* ≥ 37).</li>
  <li>Subp.6: <b>z = 40, x = (5, 0)</b> tüm integer ve 40 &gt; 37 → <b>LB = 40</b>; Subp.7 artık gerekmez (Subp.7 fathomed).</li>
  <li>Kalan tek çözülmemiş: Subp.3: <b>z = 39, x = (3, 3)</b>. 39 ≤ LB = 40 → integer olsa bile LB'yi iyileştirmez → fathom.</li>
</ol>
<div class="box"><b>Sonuç:</b> z* = 40, x<sub>1</sub> = 5, x<sub>2</sub> = 0. Toplam <b>7 LP</b> çözüldü.</div>

<h3>Final B&amp;B ağacı</h3>
<div class="model">Subp.1 (LR)        z = 165/4 = 41.25   x = (15/4, 9/4)        [1. çözüldü]  → branch x1
├─ Subp.2  x1 ≥ 4    z = 41              x = (4, 9/5)           [2.]  → branch x2
│   ├─ Subp.4  x2 ≥ 2    INFEASIBLE                             [3.]  FATHOM (infeasible)
│   └─ Subp.5  x2 ≤ 1    z = 365/9 ≈ 40.56   x = (40/9, 1)      [4.]  → branch x1
│       ├─ Subp.6  x1 ≥ 5    z = 40   x = (5, 0)                [6.]  integer, 40 &gt; 37 → LB = 40  ★ OPTIMAL
│       └─ Subp.7  x1 ≤ 4    z = 37   x = (4, 1)                [5.]  integer → ilk candidate LB = 37; sonra 37 ≤ 40 → FATHOM
└─ Subp.3  x1 ≤ 3    z = 39              x = (3, 3)             [7.]  integer ama 39 ≤ LB = 40 → FATHOM</div>

<h3>Olay günlüğü (LIFO)</h3>
<table>
  <tr><th>Sıra</th><th>Çözülen</th><th>Sonuç</th><th>Karar</th><th>LB</th></tr>
  <tr><td>1</td><td>Subp.1</td><td>41.25, (15/4, 9/4)</td><td>branch x<sub>1</sub></td><td>–</td></tr>
  <tr><td>2</td><td>Subp.2</td><td>41, (4, 9/5)</td><td>branch x<sub>2</sub></td><td>–</td></tr>
  <tr><td>3</td><td>Subp.4</td><td>infeasible</td><td>fathom</td><td>–</td></tr>
  <tr><td>4</td><td>Subp.5</td><td>40.56, (40/9, 1)</td><td>branch x<sub>1</sub></td><td>–</td></tr>
  <tr><td>5</td><td>Subp.7</td><td>37, (4, 1) integer</td><td>candidate</td><td>37</td></tr>
  <tr><td>6</td><td>Subp.6</td><td>40, (5, 0) integer</td><td>yeni candidate</td><td>40</td></tr>
  <tr><td>7</td><td>Subp.3</td><td>39, (3, 3) integer</td><td>39 ≤ 40 fathom</td><td>40</td></tr>
</table>

<h3>Diğer gözlemler</h3>
<ul>
  <li><b>Yuvarlama çalışmaz:</b> LR (15/4, 9/4) → (4, 2) <b>infeasible</b> (46 &gt; 45); aşağı yuvarlama (3, 2) feasible ama z = 34 &lt; 40.</li>
  <li><b>Başka seçim, aynı optimum:</b> root'ta x<sub>2</sub> = 9/4 seçilseydi çocuklar x<sub>2</sub> ≥ 3 ve x<sub>2</sub> ≤ 2 olurdu. x<sub>2</sub> ≥ 3 → (3, 3), z = 39 (tüm integer, candidate LB = 39); x<sub>2</sub> ≤ 2 → (35/9, 2), z = 370/9 ≈ 41.1, branch edilir. Ağaç farklı, sonuç aynı: z* = 40.</li>
  <li><b>Jumptracking</b> ile (z'ye göre): Subp.2 (41) ve Subp.3 (39) birlikte çözülür. Subp.3 tüm-integer olduğundan hemen candidate olur (LB = 39). Açık node Subp.2 (41) branch edilir → Subp.4 infeasible, Subp.5 (40.56 &gt; 39) → Subp.5 branch → Subp.6 (z = 40 &gt; 39, LB = 40; Subp.3 geçersizleşir) ve Subp.7 (z = 37 ≤ LB, fathom). Branch edilenler sırasıyla 1, 2, 5; yine 7 LP.</li>
  <li>Genel integer değişken ağaçta <b>birden çok kez</b> dallanabilir (x<sub>1</sub> hem Subp.1'de hem Subp.5'te); binary'de bu olmaz.</li>
</ul>

<h3>Ek örnek (aynı kurallar): PB</h3>
<div class="model">max 8x<sub>1</sub> + 5x<sub>2</sub>  s.t.  4x<sub>1</sub> + 5x<sub>2</sub> ≤ 14;  8x<sub>1</sub> + 4x<sub>2</sub> ≤ 37;  x<sub>1</sub>, x<sub>2</sub> ≥ 0 integer
LR: z = 28, x = (7/2, 0).  x1 ≥ 4: infeasible.  x1 ≤ 3: z = 26, x = (3, 2/5).
x2 ≥ 1 (Subp.4): z = 23, x = (9/4, 1) ;  x2 ≤ 0 (Subp.5): z = 24, x = (3, 0) integer
Optimum: z* = 24, x = (3, 0)</div>
<p>LIFO (≥ çocuk önce) bu ağaçta önce derine iner, LB'yi 18 → 21 → 24 ile yükseltir, 9 LP çözer; jumptracking ise Subp.4 (23) ve Subp.5 (24) çözüldükten sonra 24 candidate olunca Subp.4'ü (23 ≤ 24) fathom eder: 5 LP.</p>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Fathom sebebini doğru yaz: Subp.7 "integer olduğu için" değil, sonunda <b>37 ≤ LB = 40</b> olduğu için elenir; Subp.3 integer'dır ama <b>39 ≤ 40</b>.</li>
  <li>LIFO'da Subp.2'den branch edince Subp.3 değil, <b>yeni yaratılan</b> çocuklardan biri çözülür.</li>
  <li>LB'yi her yeni integer-feasible çözümde değil, <b>yalnızca daha iyi</b> olanda güncelle.</li>
  <li>Child'ın kısıtı parent'a <b>eklenir</b> (x<sub>1</sub> ≥ 4 durumu Subp.5'te de geçerlidir); Subp.4 = LR + x<sub>1</sub> ≥ 4 <b>ve</b> x<sub>2</sub> ≥ 2.</li>
  <li>LR çözümünü yuvarlama; (4, 2) infeasible.</li>
  <li>Hangi kesirli değişkenin seçileceği keyfîdir; cevap hep aynı z* olmalı, ama node numaraları değişir.</li>
</ul></div>
`;

  OR.content.concepts['2.5'] = [
    {
      q: `Example 5'in LR'si (max 8x<sub>1</sub> + 5x<sub>2</sub>; x<sub>1</sub> + x<sub>2</sub> ≤ 6; 9x<sub>1</sub> + 5x<sub>2</sub> ≤ 45; x ≥ 0) için z = 165/4, x<sub>1</sub> = 15/4, x<sub>2</sub> = 9/4 bulunur. Bu ne anlama gelir?`,
      options: [
        `IP'nin optimal değeri z* ≤ 165/4 = 41.25 (Upper Bound)`,
        `IP'nin optimal değeri z* ≥ 165/4`,
        `(15/4, 9/4) IP için de feasible'dır ve optimaldir`,
        `165/4 bir Lower Bound'dur`,
      ],
      answer: 0,
      explain: `Max problemde LR daha az kısıtlı olduğundan z<sub>LR</sub> ≥ z<sub>IP</sub>: 165/4 bir <b>Upper Bound</b>'dur. Çözüm kesirli olduğu için IP-feasible değildir; LB henüz yoktur.`,
    },
    {
      q: `Example 5'te Subp.1'in çözümü x<sub>1</sub> = 15/4, x<sub>2</sub> = 9/4'tür ve x<sub>1</sub> üzerinden branch edilecektir. Yeni subproblem'ler hangileridir?`,
      options: [
        `Subp.2: LR + x<sub>1</sub> ≥ 4;  Subp.3: LR + x<sub>1</sub> ≤ 3`,
        `Subp.2: LR + x<sub>1</sub> ≥ 3;  Subp.3: LR + x<sub>1</sub> ≤ 4`,
        `Subp.2: LR + x<sub>1</sub> = 3;  Subp.3: LR + x<sub>1</sub> = 4`,
        `Subp.2: LR + x<sub>1</sub> ≥ 15/4;  Subp.3: LR + x<sub>1</sub> ≤ 15/4`,
      ],
      answer: 0,
      explain: `15/4 = 3.75 ∈ (3, 4) ⇒ x<sub>1</sub> ≥ 4 ve x<sub>1</sub> ≤ 3. Böylece 3.75 iki tarafta da kesilir ve hiçbir integer x<sub>1</sub> değeri kaybolmaz. Diğer seçenekler ya 3.75'i içeride bırakır ya da x<sub>1</sub> ≥ 5 gibi feasible integer bölgeleri atar.`,
    },
    {
      q: `Example 5'te Subp.2 (x<sub>1</sub> ≥ 4) çözülünce z = 41, x<sub>1</sub> = 4, x<sub>2</sub> = 9/5 çıkar. Bundan sonra ne yapılır?`,
      options: [
        `x<sub>2</sub> üzerinden branch: Subp.4 = Subp.2 + x<sub>2</sub> ≥ 2, Subp.5 = Subp.2 + x<sub>2</sub> ≤ 1`,
        `x<sub>1</sub> üzerinden tekrar branch: x<sub>1</sub> ≥ 5, x<sub>1</sub> ≤ 3`,
        `x<sub>2</sub> = 9/5 yuvarlanıp 2 yapılır ve (4, 2) candidate alınır`,
        `Subp.2 fathom edilir çünkü z = 41 ≥ 165/4`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> = 4 zaten integer; kesirli olan x<sub>2</sub> = 1.8 ∈ (1, 2) ⇒ x<sub>2</sub> ≥ 2 ve x<sub>2</sub> ≤ 1. (4, 2) yuvarlaması 9·4 + 5·2 = 46 &gt; 45 olduğundan infeasible'dır. z = 41 ≤ 41.25 normaldir (çocuk, parent'tan kötü olur); fathom sebebi değildir (LB henüz yok).`,
    },
    {
      q: `Example 5'te Subp.4 = LR + x<sub>1</sub> ≥ 4 ve x<sub>2</sub> ≥ 2 neden <b>infeasible</b>'dır?`,
      options: [
        `x<sub>1</sub> = 4, x<sub>2</sub> = 2 ikinci kısıtı bozar: 9·4 + 5·2 = 46 &gt; 45 (ve daha büyük değerler daha kötüdür).`,
        `x<sub>1</sub> + x<sub>2</sub> = 6 birinci kısıtı bozar.`,
        `x<sub>2</sub> ≥ 2 ile x<sub>2</sub> ≤ 1 çelişir.`,
        `Çünkü z = 41 ≥ LB.`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> ≥ 4 ve x<sub>2</sub> ≥ 2 için 9x<sub>1</sub> + 5x<sub>2</sub> en az 46 olur; kısıt ≤ 45. Birinci kısıt (4 + 2 = 6 ≤ 6) tam sağlanır. "x<sub>2</sub> ≤ 1" Subp.5'in kısıtıdır, Subp.4'ün değil.`,
    },
    {
      q: `Example 5'te Subp.2 çözülüp Subp.4 ve Subp.5 yaratıldığında çözülmemiş problemler Subp.3, 4 ve 5'tir. <b>LIFO</b> ile sıradaki hangisidir?`,
      options: [`Subp.3`, `Subp.4 veya Subp.5`, `Yalnızca Subp.5 (kural böyle)`, `Subp.1 yeniden çözülür`],
      answer: 1,
      explain: `LIFO en son yaratılan çözülmemiş problemlerden birini seçer: Subp.4 veya Subp.5 (hangisi olduğu keyfî; notlar Subp.4'ü seçer). Subp.3 en eski olduğu için bekler.`,
    },
    {
      q: `Example 5'te Subp.5 çözülünce z = 365/9 ≈ 40.56, x<sub>1</sub> = 40/9, x<sub>2</sub> = 1 bulunur. Hangi branching doğrudur?`,
      options: [
        `x<sub>1</sub> üzerinden: Subp.6 = Subp.5 + x<sub>1</sub> ≥ 5, Subp.7 = Subp.5 + x<sub>1</sub> ≤ 4`,
        `x<sub>2</sub> üzerinden: x<sub>2</sub> ≥ 2, x<sub>2</sub> ≤ 1`,
        `Branch gerekmez; z = 40.56 bir candidate'tır`,
        `x<sub>1</sub> üzerinden: x<sub>1</sub> ≥ 4, x<sub>1</sub> ≤ 3`,
      ],
      answer: 0,
      explain: `40/9 = 4.44 ∈ (4, 5) ⇒ x<sub>1</sub> ≥ 5 ve x<sub>1</sub> ≤ 4. x<sub>2</sub> = 1 integer olduğu için seçilemez. Çözüm kesirli olduğundan candidate değildir. "x<sub>1</sub> ≥ 4, x<sub>1</sub> ≤ 3" Subp.1'in dalıdır; Subp.5 zaten x<sub>1</sub> ≥ 4 içerir. Genel integer değişken ağaçta birden çok kez dallanabilir.`,
    },
    {
      q: `Example 5'te (LIFO) önce Subp.7 çözülür: x = (4, 1), z = 37. Sonra Subp.6 çözülür: x = (5, 0), z = 40. LB'nin sırasıyla aldığı değerler ve Subp.7'nin sonunda durumu nedir?`,
      options: [
        `LB: 37, sonra 40. Subp.7, 37 ≤ 40 olduğundan fathomed (gerekmez).`,
        `LB: 37 kalır; Subp.6 ikinci candidate olarak saklanır.`,
        `LB: 40 hemen; Subp.7 hiç candidate olmaz.`,
        `LB: 37, sonra 77 (37 + 40).`,
      ],
      answer: 0,
      explain: `Subp.7 ilk feasible çözümdür, LB = 37 (z* ≥ 37). Subp.6 integer ve 40 &gt; 37 → LB = 40; (4,1) çözümü artık gereksizdir. Notlar: "It's z-value of 40 is larger than LB. Thus subp.7 cannot yield the optimal solution of the IP. We update our LB to 40."`,
    },
    {
      q: `Example 5'te LB = 40 iken Subp.3 çözülür: x = (3, 3), z = 39 (tüm değişkenler integer). Subp.3 için doğru yorum hangisidir?`,
      options: [
        `Fathom: z = 39 LB = 40'ı aşmıyor; integer olsa da yeni candidate değil.`,
        `Yeni candidate: tüm değişkenler integer olduğu için LB = 39 olur.`,
        `Branch edilir çünkü z = 39 &gt; 37.`,
        `Infeasible olduğu için fathom edilir.`,
      ],
      answer: 0,
      explain: `Tüm-integer bir node yalnızca z-değeri mevcut LB'den <b>iyiyse</b> candidate olur. 39 &lt; 40 → LB değişmez, node fathom. (3,3) bir feasible çözümdür ama (5,0)'dan daha kötüdür. 37 eski LB'dir; geçerli LB 40'tır.`,
    },
    {
      q: `Example 5'in LIFO çözümünde (Subp.4 ve Subp.7 önce çözülür) toplam kaç LP çözülür?`,
      options: [`5`, `6`, `7`, `9`],
      answer: 2,
      explain: `Çözülenler: Subp.1, 2, 4, 5, 7, 6, 3 = <b>7 LP</b>. Ağaçta 7 node vardır ve hepsi çözülmüştür (infeasible olan Subp.4 de bir LP çözümü gerektirir). Fathom edilen node'lar branch edilmez ama yine de çözülür.`,
    },
    {
      q: `Example 5'in LR çözümü (15/4, 9/4) yuvarlanırsa ne olur?`,
      options: [
        `(4, 2) infeasible'dır (9·4 + 5·2 = 46 &gt; 45); (3, 2) feasible'dır ama z = 34 &lt; 40 olduğundan optimal değildir.`,
        `(4, 2) feasible ve optimaldir, z = 42.`,
        `(3, 2) optimaldir, z = 34.`,
        `(4, 3) feasible'dır, z = 47.`,
      ],
      answer: 0,
      explain: `(4,2): 9·4 + 5·2 = 46 &gt; 45 → infeasible. (3,2): 3 + 2 = 5 ≤ 6 ve 27 + 10 = 37 ≤ 45 → feasible, z = 24 + 10 = 34. Gerçek optimum (5, 0), z = 40. (4,3) birinci kısıtı da bozar (7 &gt; 6). Yuvarlama ne feasibility ne optimality garanti eder.`,
    },
    {
      q: `Example 5'te Subp.1'de (x<sub>1</sub> = 15/4, x<sub>2</sub> = 9/4) x<sub>1</sub> yerine <b>x<sub>2</sub></b> üzerinden branch edilseydi, <b>x<sub>2</sub> ≥ 3</b> çocuğunun LP çözümü ne olurdu?`,
      options: [`x = (3, 3), z = 39 (tüm integer)`, `x = (0, 6), z = 30`, `x = (15/4, 9/4), z = 165/4`, `Infeasible`],
      answer: 0,
      hint: `x<sub>2</sub> ≥ 3 iken x<sub>1</sub> + x<sub>2</sub> ≤ 6 ⇒ x<sub>1</sub> ≤ 3; 9x<sub>1</sub> + 5x<sub>2</sub> ≤ 45'i de kontrol edin.`,
      explain: `x<sub>2</sub> ≥ 3 ile birinci kısıttan x<sub>1</sub> ≤ 6 − x<sub>2</sub> ≤ 3 olur. x<sub>1</sub> = 3, x<sub>2</sub> = 3: 27 + 15 = 42 ≤ 45 ✓, z = 24 + 15 = 39. (0, 6) feasible ama z = 30 daha kötü. (15/4, 9/4) x<sub>2</sub> ≥ 3'ü sağlamaz. Bu çocuk integer olduğundan candidate olurdu (LB = 39); diğer çocuk x<sub>2</sub> ≤ 2: (35/9, 2), z = 370/9 ≈ 41.1.`,
    },
    {
      q: `<b>Jumptracking</b> Example 5'e uygulanırsa (Subp.2 ve Subp.3 birlikte çözülür, hep en iyi z'li node branch edilir), hangi node'lar <b>sırasıyla</b> branch edilir?`,
      options: [
        `Subp.1, Subp.2, Subp.5`,
        `Subp.1, Subp.3, Subp.2`,
        `Subp.1, Subp.2, Subp.3, Subp.5`,
        `Subp.1, Subp.2, Subp.4`,
      ],
      answer: 0,
      hint: `Z-değerleri: Subp.2 = 41, Subp.3 = 39, Subp.5 = 365/9 ≈ 40.56.`,
      explain: `Subp.1 branch → Subp.2 (41) ve Subp.3 (39) çözülür. Subp.3 = (3, 3) tüm-integer: candidate, LB = 39 (branch edilmez). Açık node Subp.2 (41) → branch → Subp.4 (infeasible) ve Subp.5 (40.56 &gt; 39) → Subp.5 branch → Subp.6 (z = 40, LB = 40) ve Subp.7 (z = 37 ≤ LB, fathom). Branch edilenler 1, 2, 5; Subp.3 hiç branch edilmez. Toplam yine 7 LP.`,
    },
    {
      q: `Max bir pure IP'de LB = 32'dir. Dört node çözülmüştür:
<table>
<tr><th>Node</th><th>LP sonucu</th></tr>
<tr><td>A</td><td>infeasible</td></tr>
<tr><td>B</td><td>x = (2, 3), z = 31 (integer)</td></tr>
<tr><td>C</td><td>x = (2.5, 3), z = 33.5</td></tr>
<tr><td>D</td><td>x = (4, 1), z = 32 (integer)</td></tr>
</table>
Hangileri fathom edilir?`,
      options: [`A`, `B`, `C`, `D`],
      answer: [0, 1, 3],
      explain: `A: infeasible. B: tüm-integer ama 31 ≤ 32 → LB'yi iyileştirmez. D: tüm-integer, z = 32 = LB, "aşmıyor" → fathom (LB değişmez). C: kesirli ve 33.5 &gt; 32 → x<sub>1</sub> üzerinden x<sub>1</sub> ≥ 3 ve x<sub>1</sub> ≤ 2 ile branch edilir.`,
    },
    {
      q: `Pure IP: <b>max 8x<sub>1</sub> + 5x<sub>2</sub></b> s.t. 4x<sub>1</sub> + 5x<sub>2</sub> ≤ 14; 8x<sub>1</sub> + 4x<sub>2</sub> ≤ 37; x<sub>1</sub>, x<sub>2</sub> ≥ 0 integer. LR: z = 28, x = (7/2, 0). Subp.2 (x<sub>1</sub> ≥ 4) infeasible; Subp.3 (x<sub>1</sub> ≤ 3): x = (3, 2/5), z = 26. Subp.3'ten x<sub>2</sub> üzerinden Subp.4 (x<sub>2</sub> ≥ 1) ve Subp.5 (x<sub>2</sub> ≤ 0) yaratıldı. <b>LIFO, "≥" çocuk önce</b> uygulanırsa LB hangi değerlerden geçer ve nihai çözüm nedir? (Ağaç boyunca yaratılan çocuklarda yine "≥" önce çözülür.)`,
      options: [
        `LB: 18 → 21 → 24; nihai x = (3, 0), z = 24`,
        `LB: 24; nihai x = (3, 0), z = 24 (LB hiç başka değer almaz)`,
        `LB: 18 → 21; nihai x = (2, 1), z = 21`,
        `LB: 21 → 24; nihai x = (3, 0), z = 24`,
      ],
      answer: 0,
      hint: `Subp.4: (9/4, 1), z = 23 → x<sub>1</sub> üzerinden branch; x<sub>1</sub> ≥ 3 infeasible, x<sub>1</sub> ≤ 2 → (2, 6/5), z = 22 → x<sub>2</sub> üzerinden…`,
      explain: `LIFO derine iner: Subp.4 (x<sub>2</sub> ≥ 1): (9/4, 1), z = 23 → x<sub>1</sub> ≥ 3 infeasible (12 + 5 = 17 &gt; 14); x<sub>1</sub> ≤ 2: (2, 6/5), z = 22 → x<sub>2</sub> ≥ 2: (1, 2) z = 18 integer → <b>LB = 18</b>; x<sub>2</sub> ≤ 1: (2, 1) z = 21 integer → <b>LB = 21</b>. Son olarak Subp.5 (x<sub>2</sub> ≤ 0): (3, 0), z = 24 → <b>LB = 24</b>. Toplam 9 LP. Jumptracking aynı problemde Subp.4 (23) ve Subp.5 (24) çözülünce 24 candidate, 23 ≤ 24 → fathom: yalnızca 5 LP.`,
    },
    {
      q: `Pure (genel) integer bir B&amp;B ağacında bir değişken için hangisi doğrudur?`,
      options: [
        `Aynı değişken ağaçta birden fazla kez dallanabilir: Example 5'te x<sub>1</sub> hem Subp.1'de (≥ 4 / ≤ 3) hem Subp.5'te (≥ 5 / ≤ 4) dallanır.`,
        `Bir değişken bir kez dallandıktan sonra o dalın altında artık kesirli olamaz.`,
        `Dallanma yalnızca x<sub>1</sub> üzerinden yapılabilir.`,
        `Dallanma her zaman en büyük kesirli değere sahip değişken üzerinden yapılmak zorundadır.`,
      ],
      answer: 0,
      explain: `Genel integer değişkende x ≥ 4 gibi bir sınır, x'in başka bir kesirli değer (örn. 40/9 = 4.44) almasını engellemez; bu yüzden aynı değişken yeniden dallanabilir. (Binary'de x = 0/1 ile sabitlenir, bir daha kesirli olamaz.) Notlarda değişken seçimi "arbitrarily" yapılır; kural zorunlu değildir.`,
    },
  ];

  /* ====================================================================== 2.5.1 */
  OR.content.summaries['2.5.1'] = `
<h2>2.5.1 B&amp;B — Mixed Integer Programming (MIP)</h2>
<p>MIP'de bazı değişkenler integer olmak zorunda, diğerleri integer veya kesirli olabilir. Yöntemde iki değişiklik:</p>
<div class="box">
<ol>
  <li><b>Yalnızca integer olması gereken</b> değişkenler üzerinden branch edilir. Sürekli (continuous) değişken kesirli olsa da <b>asla</b> dallanmaz.</li>
  <li>Bir subproblem çözümünün <b>candidate</b> olması için, yalnızca integer olması gereken değişkenlerin integer değer alması yeterlidir.</li>
</ol>
</div>
<p>Binary değişken içeren MIP'de (Example 3: x<sub>3</sub> binary) o değişken için x = 0 / x = 1 dallanması yapılır; LR'de ise 0 ≤ x ≤ 1 kullanılır.</p>

<h3>Example 6 (Winston 9.4, s.523)</h3>
<div class="model">max z = 2x<sub>1</sub> + x<sub>2</sub>
s.t.  5x<sub>1</sub> + 2x<sub>2</sub> ≤ 8
      x<sub>1</sub> + x<sub>2</sub> ≤ 3
      x<sub>1</sub>, x<sub>2</sub> ≥ 0;  <b>x<sub>1</sub> integer</b> (x<sub>2</sub> continuous)</div>
<ol>
  <li><b>Subp.1 = LR</b> (x<sub>1</sub> ≥ 0 and integer → x<sub>1</sub> ≥ 0): <b>z = 11/3, x<sub>1</sub> = 2/3, x<sub>2</sub> = 7/3</b>. x<sub>2</sub> kesirli ama sürekli → <b>x<sub>2</sub> üzerinden dallanmaz</b>. x<sub>1</sub> üzerinden:
    <br>Subp.2 = LR + <b>x<sub>1</sub> ≥ 1</b>; Subp.3 = LR + <b>x<sub>1</sub> ≤ 0</b>.</li>
  <li>Subp.2: <b>z = 7/2, x<sub>1</sub> = 1, x<sub>2</sub> = 3/2</b>. Yalnızca x<sub>1</sub> integer olmak zorunda ve integer ⇒ <b>candidate, LB = 7/2</b>.</li>
  <li>Subp.3: <b>z = 3, x<sub>1</sub> = 0, x<sub>2</sub> = 3</b>. 3 ≤ LB = 3.5 → fathom.</li>
</ol>
<div class="model">Subp.1 (LR)          z = 11/3 ≈ 3.67   x = (2/3, 7/3)    → branch x1 (x2 DEĞİL)
├─ Subp.2  x1 ≥ 1    z = 7/2 = 3.5     x = (1, 3/2)      x1 integer → CANDIDATE, LB = 3.5  ★ OPTIMAL
└─ Subp.3  x1 ≤ 0    z = 3             x = (0, 3)        3 ≤ 3.5 → FATHOM</div>
<div class="box"><b>Sonuç:</b> z* = 7/2, x<sub>1</sub> = 1, x<sub>2</sub> = 3/2 (x<sub>2</sub> kesirli kalabilir). 3 LP.</div>

<h3>Ek örnek M2 (aynı kurallar)</h3>
<div class="model">max 5x<sub>1</sub> + 5x<sub>2</sub> + 4x<sub>3</sub>
s.t. 5x<sub>1</sub> + 2x<sub>2</sub> + 3x<sub>3</sub> ≤ 12;  x<sub>1</sub> + 5x<sub>2</sub> + 2x<sub>3</sub> ≤ 17
x<sub>1</sub>, x<sub>2</sub> ≥ 0 and integer;  x<sub>3</sub> ≥ 0 continuous</div>
<div class="model">Subp.1 (LR)          z = 239/11 ≈ 21.73   x = (0, 27/11, 26/11)
│     kesirli: x2 (integer olmalı) ve x3 (sürekli) → SADECE x2 dallanır
├─ Subp.2  x2 ≥ 3    z = 151/7 ≈ 21.57    x = (6/7, 3, 4/7)    → branch x1 (x3 değil)
│   ├─ Subp.4  x1 ≥ 1    z = 237/11 ≈ 21.55   x = (1, 34/11, 3/11)  → branch x2
│   │   ├─ Subp.6  x2 ≥ 4    INFEASIBLE   (5 + 8 = 13 &gt; 12)
│   │   └─ Subp.7  x2 ≤ 3    z = 64/3 ≈ 21.33     x = (1, 3, 1/3)
│   │        x1, x2 integer (x3 = 1/3 kesirli ama sürekli) → CANDIDATE, LB = 64/3  ★ OPTIMAL
│   └─ Subp.5  x1 ≤ 0    z = 19       x = (0, 3, 1)         19 ≤ 64/3 → FATHOM
└─ Subp.3  x2 ≤ 2    z = 62/3 ≈ 20.67     x = (0, 2, 8/3)       20.67 ≤ 21.33 → FATHOM (x3 = 8/3 önemsiz)</div>
<p>LIFO (≥ çocuk önce) çözüm sırası: 1, 2, 4, 6, 7, 5, 3.</p>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Hangi değişkenlerin integer olmak zorunda olduğuna <b>önce bak</b>. Sürekli değişkeni kesirli diye dallandırma.</li>
  <li>Candidate testi sadece integer-zorunlu değişkenlere uygulanır. (1, 3/2) çözümü bu MIP için <b>geçerli</b> candidate'tır; "x<sub>2</sub> kesirli, o hâlde branch" yanlıştır.</li>
  <li>Candidate'ın z'si yine de LB'yi (daha iyiyse) günceller; Subp.3'te (0, 3) integer-uyumlu olsa da z = 3 ≤ 3.5 olduğundan fathom.</li>
  <li>Sürekli değişkeni yuvarlama: optimumda x<sub>2</sub> = 3/2'dir. x<sub>2</sub>'yi tam sayıya çekersen (örn. (1, 1), z = 3) optimum olan z = 3.5'u kaybedersin.</li>
  <li>MIP'te LR değeri yine max için UB'dir; fathom kuralları aynıdır (infeasible, z ≤ LB, integer-uyumlu).</li>
  <li>Binary integer değişken varsa onun için x = 0 / x = 1 branch edilir, "x ≤ 1" LR'de ayrıca yazılmayı unutma (bkz. 2.2).</li>
</ul></div>
`;

  OR.content.concepts['2.5.1'] = [
    {
      q: `Example 6: <b>max 2x<sub>1</sub> + x<sub>2</sub></b>; 5x<sub>1</sub> + 2x<sub>2</sub> ≤ 8; x<sub>1</sub> + x<sub>2</sub> ≤ 3; x ≥ 0; <b>yalnızca x<sub>1</sub> integer</b>. LR çözümü z = 11/3, x<sub>1</sub> = 2/3, x<sub>2</sub> = 7/3'tür. Hangi değişken üzerinden branch edilir?`,
      options: [
        `Yalnızca x<sub>1</sub>: çünkü x<sub>2</sub> integer olmak zorunda değildir.`,
        `Yalnızca x<sub>2</sub>: çünkü 7/3 daha büyüktür.`,
        `Her ikisi de: önce x<sub>1</sub>, sonra x<sub>2</sub>.`,
        `Dallanma yok: LR çözümü zaten candidate'tır.`,
      ],
      answer: 0,
      explain: `MIP'de yalnızca integer olması gereken değişkenler dallanır. x<sub>2</sub> = 7/3 kesirli ama sürekli → dokunulmaz. x<sub>1</sub> = 2/3 integer olmak zorunda olduğu için ihlal var; candidate değildir.`,
    },
    {
      q: `Example 6'da x<sub>1</sub> = 2/3 üzerinden branch edildiğinde yeni subproblem'ler hangileridir?`,
      options: [
        `Subp.2: LR + x<sub>1</sub> ≥ 1;  Subp.3: LR + x<sub>1</sub> ≤ 0`,
        `Subp.2: LR + x<sub>1</sub> ≥ 1;  Subp.3: LR + x<sub>1</sub> ≤ 1`,
        `Subp.2: LR + x<sub>2</sub> ≥ 3;  Subp.3: LR + x<sub>2</sub> ≤ 2`,
        `Subp.2: LR + x<sub>1</sub> = 1;  Subp.3: LR + x<sub>2</sub> = 0`,
      ],
      answer: 0,
      explain: `2/3 ∈ (0, 1) ⇒ x<sub>1</sub> ≥ 1 ve x<sub>1</sub> ≤ 0. "x<sub>1</sub> ≤ 1" 2/3'ü içeride bırakır. x<sub>2</sub> üzerinden dallanmak yanlıştır (sürekli).`,
    },
    {
      q: `Example 6'da Subp.2 (x<sub>1</sub> ≥ 1) çözümü z = 7/2, x<sub>1</sub> = 1, x<sub>2</sub> = 3/2'dir. Bu node için doğru karar hangisidir?`,
      options: [
        `Candidate solution; LB = 7/2. Branch gerekmez.`,
        `x<sub>2</sub> = 3/2 kesirli olduğu için x<sub>2</sub> ≥ 2 ve x<sub>2</sub> ≤ 1 ile branch edilir.`,
        `Çözüm IP için feasible değildir çünkü kesirli bir değer içerir.`,
        `Fathom edilir ama candidate olmaz çünkü x<sub>2</sub> integer değildir.`,
      ],
      answer: 0,
      explain: `Notlar: "As only x<sub>1</sub> assume integer value, this solution is feasible for the original MIP → Candidate solution; LB = 7/2." Candidate olması için yalnızca integer-zorunlu değişkenlerin integer olması yeterlidir. x<sub>2</sub> sürekli olduğundan kesirli kalabilir.`,
    },
    {
      q: `Example 6'da LB = 7/2 iken Subp.3 (x<sub>1</sub> ≤ 0) çözülür: x = (0, 3), z = 3. Subp.3 için hangisi doğrudur?`,
      options: [
        `Fathom: z = 3 ≤ LB = 3.5; bu bölge daha iyi bir MIP çözümü veremez.`,
        `Yeni candidate: z = 3 ve x<sub>1</sub> integer.`,
        `Branch edilir çünkü x<sub>2</sub> = 3 ile x<sub>2</sub> kesirli olabilir.`,
        `Infeasible'dır.`,
      ],
      answer: 0,
      explain: `(0, 3) MIP için feasible'dır (5·0 + 6 = 6 ≤ 8; 0 + 3 ≤ 3) ama z = 3 &lt; 3.5. "Z-değeri LB'yi aşmıyor" ⇒ fathom. Candidate olabilmesi için LB'den iyi olması gerekir.`,
    },
    {
      q: `Example 6'nın optimal çözümü nedir?`,
      options: [
        `z = 7/2, x<sub>1</sub> = 1, x<sub>2</sub> = 3/2`,
        `z = 3, x<sub>1</sub> = 0, x<sub>2</sub> = 3`,
        `z = 11/3, x<sub>1</sub> = 2/3, x<sub>2</sub> = 7/3`,
        `z = 3, x<sub>1</sub> = 1, x<sub>2</sub> = 1 (x<sub>2</sub> yuvarlanmış)`,
      ],
      answer: 0,
      explain: `Candidate Subp.2 (z = 3.5) en iyidir; Subp.3 (z = 3) daha kötü. 11/3 LR'nin değeridir (UB) ve x<sub>1</sub> = 2/3 MIP-feasible değildir. Son seçenek x<sub>2</sub>'yi gereksiz yere yuvarlar; z = 2 + 1 = 3 olur ve optimal değildir.`,
    },
    {
      q: `Bir MIP'de x<sub>1</sub> ve x<sub>3</sub> integer olmak zorunda, x<sub>2</sub> sürekli. Bir subproblem'in LP çözümlerinden hangileri <b>candidate</b> olabilir (z-değerinin LB'den iyi olduğunu varsayın)?`,
      options: [
        `(x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>) = (2, 3.5, 4)`,
        `(x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>) = (2.5, 3, 4)`,
        `(x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>) = (2, 3.5, 4.2)`,
        `(x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>) = (0, 0.7, 1)`,
      ],
      answer: [0, 3],
      explain: `Candidate için yalnızca x<sub>1</sub> ve x<sub>3</sub> integer olmalı. (2, 3.5, 4): x<sub>1</sub>=2, x<sub>3</sub>=4 integer ✓ (x<sub>2</sub> sürekli). (0, 0.7, 1) ✓. (2.5, 3, 4): x<sub>1</sub> kesirli ✗. (2, 3.5, 4.2): x<sub>3</sub> kesirli ✗.`,
    },
    {
      q: `Bir MIP'de x<sub>1</sub> ≥ 0 sürekli, x<sub>2</sub> ≥ 0 integer, x<sub>3</sub> binary (Example 3 yapısı). Bir subproblem çözümü x<sub>1</sub> = 1.3, x<sub>2</sub> = 2.4, x<sub>3</sub> = 0.5 olsun. Geçerli branching seçenekleri hangileridir?`,
      options: [
        `x<sub>2</sub> üzerinden: x<sub>2</sub> ≥ 3 ve x<sub>2</sub> ≤ 2`,
        `x<sub>3</sub> üzerinden: x<sub>3</sub> = 0 ve x<sub>3</sub> = 1`,
        `x<sub>1</sub> üzerinden: x<sub>1</sub> ≥ 2 ve x<sub>1</sub> ≤ 1`,
        `x<sub>3</sub> üzerinden: x<sub>3</sub> ≥ 1 ve x<sub>3</sub> ≤ 0, x<sub>1</sub> da aynı anda yuvarlanır`,
      ],
      answer: [0, 1],
      explain: `Kesirli ve integer-zorunlu olan değişkenler: x<sub>2</sub> (2.4) ve x<sub>3</sub> (0.5). Biri seçilir (keyfî). x<sub>2</sub> için x<sub>2</sub> ≥ 3 / x<sub>2</sub> ≤ 2; x<sub>3</sub> binary → x<sub>3</sub> = 0 / x<sub>3</sub> = 1. x<sub>1</sub> sürekli olduğundan dallanmaz. (x<sub>3</sub> ≥ 1 / ≤ 0 matematiksel olarak x<sub>3</sub> = 1 / x<sub>3</sub> = 0'a denktir; ancak son seçenek x<sub>1</sub>'i de yuvarlamayı öneriyor, bu yanlıştır.)`,
    },
    {
      q: `M2: <b>max 5x<sub>1</sub> + 5x<sub>2</sub> + 4x<sub>3</sub></b> s.t. 5x<sub>1</sub> + 2x<sub>2</sub> + 3x<sub>3</sub> ≤ 12; x<sub>1</sub> + 5x<sub>2</sub> + 2x<sub>3</sub> ≤ 17; x<sub>1</sub>, x<sub>2</sub> ≥ 0 integer; x<sub>3</sub> ≥ 0 sürekli. LR çözümü z = 239/11 ≈ 21.73, x = (0, 27/11, 26/11) ≈ (0, 2.45, 2.36). Hangi değişkenden ve nasıl branch edilir?`,
      options: [
        `x<sub>2</sub> üzerinden: x<sub>2</sub> ≥ 3 ve x<sub>2</sub> ≤ 2`,
        `x<sub>3</sub> üzerinden: x<sub>3</sub> ≥ 3 ve x<sub>3</sub> ≤ 2`,
        `x<sub>2</sub> ve x<sub>3</sub> üzerinden birlikte`,
        `x<sub>1</sub> üzerinden: x<sub>1</sub> ≥ 1 ve x<sub>1</sub> ≤ 0`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> = 0 zaten integer. x<sub>3</sub> = 26/11 kesirli ama sürekli → dallanmaz. Tek ihlal eden integer-zorunlu değişken x<sub>2</sub> = 27/11 = 2.45 ∈ (2, 3) ⇒ x<sub>2</sub> ≥ 3 ve x<sub>2</sub> ≤ 2.`,
    },
    {
      q: `M2'de (LIFO, ≥ çocuk önce) x<sub>2</sub> ≥ 3 çocuğu (Subp.2) çözülür: z = 151/7 ≈ 21.57, x = (6/7, 3, 4/7). Sıradaki branching hangisidir?`,
      options: [
        `x<sub>1</sub> üzerinden: x<sub>1</sub> ≥ 1 ve x<sub>1</sub> ≤ 0`,
        `x<sub>3</sub> üzerinden: x<sub>3</sub> ≥ 1 ve x<sub>3</sub> ≤ 0`,
        `x<sub>2</sub> üzerinden: x<sub>2</sub> ≥ 4 ve x<sub>2</sub> ≤ 3`,
        `Branch gerekmez: x<sub>2</sub> = 3 integer olduğundan çözüm candidate'tır.`,
      ],
      answer: 0,
      explain: `x<sub>2</sub> = 3 artık integer; x<sub>1</sub> = 6/7 ∈ (0, 1) integer olmalı ve ihlal ediyor ⇒ x<sub>1</sub> ≥ 1 ve x<sub>1</sub> ≤ 0. x<sub>3</sub> = 4/7 sürekli → dokunulmaz. Çözüm candidate değil çünkü x<sub>1</sub> kesirli.`,
    },
    {
      q: `M2 ağacında şu çözüm bulunur: Subp.7 (x<sub>2</sub> ≤ 3 ve x<sub>1</sub> ≥ 1 ve x<sub>2</sub> ≥ 3): x = (1, 3, 1/3), z = 64/3 ≈ 21.33. Bu node için doğru karar nedir?`,
      options: [
        `Candidate: x<sub>1</sub>, x<sub>2</sub> integer; x<sub>3</sub> = 1/3 sürekli olduğundan sorun değil. LB = 64/3.`,
        `x<sub>3</sub> = 1/3 kesirli olduğundan x<sub>3</sub> ≥ 1 ve x<sub>3</sub> ≤ 0 ile branch edilir.`,
        `Fathom edilir ama candidate sayılmaz.`,
        `Infeasible: x<sub>3</sub> integer olmadığı için MIP-feasible değildir.`,
      ],
      answer: 0,
      explain: `5·1 + 2·3 + 3/3 = 12 ✓; 1 + 15 + 2/3 = 16.67 ≤ 17 ✓; z = 5 + 15 + 4/3 = 64/3. İntegerlik gereken x<sub>1</sub>, x<sub>2</sub> integer → candidate, LB = 64/3. Sürekli x<sub>3</sub> kesirli kalabilir (Example 6'daki x<sub>2</sub> = 3/2 gibi).`,
    },
    {
      q: `M2'de LB = 64/3 ≈ 21.33 iken iki node daha çözülür: Subp.5 (x<sub>1</sub> ≤ 0 ve x<sub>2</sub> ≥ 3): x = (0, 3, 1), z = 19; Subp.3 (x<sub>2</sub> ≤ 2): x = (0, 2, 8/3), z = 62/3 ≈ 20.67. Sonuçlar ve nihai çözüm?`,
      options: [
        `İkisi de fathom (z ≤ LB); optimum z = 64/3, x = (1, 3, 1/3).`,
        `Subp.3 branch edilir çünkü x<sub>3</sub> = 8/3 kesirli; optimum sonra belli olur.`,
        `Subp.3 yeni candidate olur çünkü x<sub>1</sub>, x<sub>2</sub> integer: LB = 62/3.`,
        `Subp.5 yeni candidate olur çünkü x = (0, 3, 1) tamamen integer.`,
      ],
      answer: 0,
      explain: `Subp.5: z = 19 &lt; 21.33 → fathom (tamamen integer olması fark etmez). Subp.3: x<sub>1</sub>=0, x<sub>2</sub>=2 integer ama 62/3 = 20.67 &lt; 64/3 = 21.33 → fathom; x<sub>3</sub> kesirli olması dallanmayı gerektirmez. Optimum: z = 64/3, x = (1, 3, 1/3).`,
    },
    {
      q: `MIP'lerde B&amp;B için hangileri doğrudur?`,
      options: [
        `Sürekli bir değişken, LP çözümünde kesirli olsa bile branching için seçilemez.`,
        `Candidate olması için yalnızca integer olması gereken değişkenlerin integer olması yeterlidir.`,
        `Tüm değişkenler integer değilse z-değeri LB'yi güncelleyemez.`,
        `LR değeri MIP için (max) hâlâ Upper Bound'dur.`,
      ],
      answer: [0, 1, 3],
      explain: `Notlar: "branching only on variables that are required to be integers" ve "candidate solution need only assign integer values to those variables that are required to be integers". LR daha az kısıtlı olduğundan UB mantığı değişmez. Üçüncü seçenek yanlıştır: MIP candidate'ı da LB'yi günceller (Example 6'da LB = 7/2, x<sub>2</sub> kesirli).`,
    },
  ];

  /* ====================================================================== 2.5.2 */
  OR.content.summaries['2.5.2'] = `
<h2>2.5.2 B&amp;B — Binary IP</h2>
<p>Her değişken 0 veya 1 olduğu için branching çok basittir: x<sub>i</sub> kesirli ise iki yeni problem <b>x<sub>i</sub> = 0</b> ve <b>x<sub>i</sub> = 1</b> (ceil/floor kısıtı yerine <b>sabitleme / fixing</b>). LR'de 0 ≤ x<sub>j</sub> ≤ 1 vardır. Bir değişken sabitlenince o dalda artık <b>kesirli olamaz</b>; ağaç en fazla n seviye derinliğinde olur. Notlarda node'lar P0 (LR), P1, P2, … diye anılır ve burada <b>jumptracking</b> kullanılır; hangi kesirli değişkenin seçileceği keyfîdir.</p>

<h3>Example 7 (binary, 4 değişken)</h3>
<div class="model">max z = 0.2x<sub>1</sub> + 0.3x<sub>2</sub> + 0.5x<sub>3</sub> + 0.1x<sub>4</sub>
s.t.  0.5x<sub>1</sub> + 1.0x<sub>2</sub> + 1.5x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 3.1
      0.3x<sub>1</sub> + 0.8x<sub>2</sub> + 1.5x<sub>3</sub> + 0.4x<sub>4</sub> ≤ 2.5
      0.2x<sub>1</sub> + 0.2x<sub>2</sub> + 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4
      x<sub>j</sub> = 0 or 1</div>
<ol>
  <li><b>LR (0 ≤ x<sub>j</sub> ≤ 1)</b>: <b>z = 0.65, x<sub>2</sub> = 0.5, x<sub>3</sub> = 1, x<sub>1</sub> = x<sub>4</sub> = 0</b>. x<sub>2</sub> kesirli → <b>P1</b> = LR + x<sub>2</sub> = 0, <b>P2</b> = LR + x<sub>2</sub> = 1.</li>
  <li>P1: <b>z = 0.6, x<sub>1</sub> = 0.5, x<sub>3</sub> = 1</b>, x<sub>2</sub> = x<sub>4</sub> = 0. P2: <b>z = 0.63, x<sub>2</sub> = 1, x<sub>3</sub> = 0.67</b>, x<sub>1</sub> = x<sub>4</sub> = 0. (Jumptracking: en iyi z = P2.)</li>
  <li><b>Branch P2 (0.63) üzerinden x<sub>3</sub></b>: P3 = P2 + x<sub>3</sub> = 0: <b>z = 0.5, x<sub>1</sub> = x<sub>2</sub> = 1</b>, x<sub>3</sub> = x<sub>4</sub> = 0 → tüm integer → <b>candidate, LB = 0.5</b>. P4 = P2 + x<sub>3</sub> = 1: <b>infeasible</b> (x<sub>2</sub> = x<sub>3</sub> = 1: 0.2 + 0.3 = 0.5 &gt; 0.4).</li>
  <li>Kalan tek açık node P1 (0.6 &gt; LB = 0.5) → <b>branch x<sub>1</sub></b>: P5 = P1 + x<sub>1</sub> = 0: <b>z = 0.6, x<sub>3</sub> = x<sub>4</sub> = 1</b>, x<sub>1</sub> = x<sub>2</sub> = 0 → integer, 0.6 &gt; 0.5 → <b>yeni candidate, LB = 0.6</b>. P6 = P1 + x<sub>1</sub> = 1: <b>z = 0.53, x<sub>1</sub> = 1, x<sub>3</sub> = 0.67</b> → 0.53 ≤ 0.6 → <b>fathom</b>.</li>
</ol>
<div class="model">P0 (LR)            z = 0.65   x2 = 0.5, x3 = 1, x1 = x4 = 0
├─ P1  x2 = 0      z = 0.60   x1 = 0.5, x3 = 1, x2 = x4 = 0                [branch x1]
│   ├─ P5  x1 = 0  z = 0.60   x3 = x4 = 1, x1 = x2 = 0   integer → LB = 0.6  ★ OPTIMAL
│   └─ P6  x1 = 1  z = 0.53   x1 = 1, x3 = 0.67          0.53 ≤ 0.6 → FATHOM
└─ P2  x2 = 1      z = 0.63   x2 = 1, x3 = 0.67, x1 = x4 = 0               [branch x3]
    ├─ P3  x3 = 0  z = 0.50   x1 = x2 = 1                 integer → candidate, LB = 0.5 (sonra aşıldı)
    └─ P4  x3 = 1  INFEASIBLE</div>
<div class="box"><b>Sonuç:</b> z* = 0.6, x = (0, 0, 1, 1). Çözülen LP sayısı: <b>7</b> (P0 + P1…P6); toplam olası çözüm 2<sup>4</sup> = <b>16</b>. "Tree search'ün işe yarama nedeni: olası çözüm sayısı kadar LP çözmek zorunda değiliz."</div>

<h3>Olay günlüğü (jumptracking)</h3>
<table>
  <tr><th>Adım</th><th>İşlem</th><th>Sonuç</th><th>LB</th></tr>
  <tr><td>1</td><td>LR çöz</td><td>0.65, x<sub>2</sub> = 0.5 → branch x<sub>2</sub></td><td>–</td></tr>
  <tr><td>2</td><td>P1, P2 çöz</td><td>0.60 ve 0.63 → en iyi: P2</td><td>–</td></tr>
  <tr><td>3</td><td>P2'yi branch (x<sub>3</sub>), P3, P4 çöz</td><td>P3: integer 0.5; P4: infeasible</td><td>0.5</td></tr>
  <tr><td>4</td><td>Tek açık node P1 (0.6 &gt; 0.5), branch (x<sub>1</sub>), P5, P6 çöz</td><td>P5: integer 0.6; P6: 0.53 ≤ 0.6 fathom</td><td>0.6</td></tr>
</table>

<h3>Dikkat: alternatif LP optimumu</h3>
<p>P1'in LP'sinde <b>iki eşdeğer optimum</b> vardır, ikisi de z = 0.6: (x<sub>1</sub> = 0.5, x<sub>3</sub> = 1) ve (x<sub>3</sub> = x<sub>4</sub> = 1). Notlar birincisini alır ve x<sub>1</sub>'den dallanır. Bir LP çözücü ikincisini döndürürse P1 zaten tüm-integer olur: LB = 0.6 hemen; P2 (0.63 &gt; 0.6) branch edilir, P3 (0.5) fathom, P4 infeasible. Ağaç daha küçük (5 LP) ama sonuç aynı: z* = 0.6, x = (0, 0, 1, 1).</p>

<h3>Ek örnek BI2 (kendi sayılarıyla, jumptracking)</h3>
<div class="model">max 12x<sub>1</sub> + 9x<sub>2</sub> + 10x<sub>3</sub> + 10x<sub>4</sub>
s.t. 7x<sub>1</sub> + 8x<sub>2</sub> + 2x<sub>3</sub> + 5x<sub>4</sub> ≤ 12;  2x<sub>1</sub> + 6x<sub>2</sub> + 8x<sub>3</sub> + 4x<sub>4</sub> ≤ 13;  x<sub>j</sub> binary
P0: z = 85/3 ≈ 28.33, x = (5/6, 0, 1, 5/6)  → x1 üzerinden
P1 (x1=0): z = 581/26 ≈ 22.35, x = (0, 19/26, 15/26, 1)     P2 (x1=1): z = 28, x = (1, 0, 1, 3/5)
P2 en iyi → x4: P3 (x4=0): z = 203/8 ≈ 25.38, x = (1, 3/8, 1, 0);  P4 (x4=1): z = 22, x = (1, 0, 0, 1) integer, LB = 22
P3 (25.38) en iyi → x2: P5 (x2=0): z = 22, x = (1, 0, 1, 0) integer, 22 ≤ 22 fathom;  P6 (x2=1): infeasible
P1 (22.35 &gt; 22) → x2: z = 20 ve z = 20.56 → ikisi de fathom.  Optimum z* = 22</div>
<p>Burada <b>alternatif optimal çözümler</b> vardır: (1, 0, 0, 1) ve (1, 0, 1, 0), ikisi de z = 22. Jumptracking ilkini (P4), LIFO ("x = 0" çocuk önce) ikincisini bulur.</p>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Binary'de branch = <b>x<sub>i</sub> = 0</b> ve <b>x<sub>i</sub> = 1</b>; "x ≥ ⌈·⌉ / x ≤ ⌊·⌋" yazmak yanlış değil ama gereksiz; sabitlenen değişken sonradan kesirli olamaz.</li>
  <li>LR'de x<sub>j</sub> ≤ 1 unutulmaz (2.2). Sabitleme sonrası alt problemde yalnızca <b>sabitlenmemiş</b> değişkenler 0 ≤ x ≤ 1 aralığında serbesttir; sabitlenmiş olanlar RHS'ye kayar (örn. P6'da x<sub>1</sub> = 1: üçüncü kısıt 0.3x<sub>3</sub> + … ≤ 0.2).</li>
  <li>P3 candidate'tır (LB = 0.5) ama <b>P1 hâlâ 0.6 &gt; 0.5</b> olduğundan P1'in altı taranmalıdır; "P3 integer, bitti" demek yanlıştır.</li>
  <li>P5'te LB 0.5 → 0.6 yükselir; P3 artık gereksizdir (geçersiz candidate). P6: z = 0.53 ≤ 0.6.</li>
  <li>Jumptracking'te branch edilecek node, <b>açık (fathom edilmemiş) tüm node'lar</b> arasından en iyi z'li olandır, yalnızca yeni yaratılanlar arasından değil. P1 (0.6) bekler, P2'nin çocukları bitince açık kalan tek node olarak branch edilir.</li>
  <li>Toplam 2<sup>n</sup> yerine kaç LP çözüldüğü sorulursa node sayısını say (Example 7: 7).</li>
</ul></div>
`;

  OR.content.concepts['2.5.2'] = [
    {
      q: `Binary IP'de bir subproblem'in LP çözümünde x<sub>2</sub> = 0.5 çıkmıştır. Hangi iki subproblem yaratılır?`,
      options: [
        `Subp + "x<sub>2</sub> = 0"  ve  Subp + "x<sub>2</sub> = 1"`,
        `Subp + "x<sub>2</sub> ≥ 1"  ve  Subp + "x<sub>2</sub> ≤ 1"`,
        `Subp + "x<sub>2</sub> ≥ 0.5"  ve  Subp + "x<sub>2</sub> ≤ 0.5"`,
        `Subp + "x<sub>2</sub> = 0.5" ve Subp + "x<sub>2</sub> = 1.5"`,
      ],
      answer: 0,
      explain: `Binary değişken yalnızca 0 veya 1 olabildiği için dallanma x<sub>i</sub> = 0 ve x<sub>i</sub> = 1 olur (sabitleme). Notlar: "branching on x<sub>i</sub> will yield in x<sub>i</sub> = 0 and x<sub>i</sub> = 1". "x ≤ 1" zaten LR'de vardır, dallanma yaratmaz.`,
    },
    {
      q: `Example 7'nin LR'si (0 ≤ x<sub>j</sub> ≤ 1) için z = 0.65, x<sub>2</sub> = 0.5, x<sub>3</sub> = 1, x<sub>1</sub> = x<sub>4</sub> = 0 bulunur. Dallanma sonucu P1 (x<sub>2</sub> = 0) ve P2 (x<sub>2</sub> = 1) için z = 0.6 ve z = 0.63 elde edilir. <b>Jumptracking</b> ile hangi node branch edilir?`,
      options: [`P2 (en iyi z = 0.63)`, `P1 (z = 0.6)`, `Her ikisi birden`, `P2, çünkü en son yaratılan odur`],
      answer: 0,
      explain: `Jumptracking en iyi z-değerli node'u seçer: 0.63 &gt; 0.6 → P2. Son seçenek doğru node'u yanlış sebeple verir: sebep "en iyi z"dir, "en son yaratılan" değil (o LIFO mantığıdır).`,
    },
    {
      q: `Example 7'de P2 (x<sub>2</sub> = 1) üzerinden x<sub>3</sub> ile dallanılır. P4 = P2 + x<sub>3</sub> = 1 neden <b>infeasible</b>'dır?`,
      options: [
        `x<sub>2</sub> = x<sub>3</sub> = 1 iken üçüncü kısıt: 0.2 + 0.3 = 0.5 &gt; 0.4`,
        `x<sub>2</sub> = x<sub>3</sub> = 1 iken birinci kısıt: 1 + 1.5 = 2.5 &gt; 3.1`,
        `x<sub>3</sub> = 1 ile x<sub>3</sub> = 0 çelişir.`,
        `Çünkü P3 candidate olmuştur.`,
      ],
      answer: 0,
      explain: `Üçüncü kısıt: 0.2x<sub>1</sub> + 0.2x<sub>2</sub> + 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4. x<sub>2</sub> = x<sub>3</sub> = 1 yalnız başına 0.5 verir. Birinci seçenek yanlış hesaplanmıştır: 2.5 ≤ 3.1 sağlanır. Diğer iki seçenek de gerekçe değildir.`,
    },
    {
      q: `Example 7'de (jumptracking) P3 (x<sub>2</sub> = 1, x<sub>3</sub> = 0): x = (1, 1, 0, 0), z = 0.5 tüm integer ve P4 infeasible çıkmıştır. Açık kalan tek node P1'dir (z = 0.6). Sıradaki adım nedir?`,
      options: [
        `P1'i branch et (x<sub>1</sub> = 0.5 üzerinden), çünkü 0.6 &gt; LB = 0.5.`,
        `Dur: P3 candidate olduğu için optimaldir.`,
        `P1'i fathom et çünkü P3 integer'dır.`,
        `P4'ten branch et.`,
      ],
      answer: 0,
      explain: `P3 candidate: LB = 0.5. P1'in z-değeri 0.6 &gt; 0.5 olduğundan içinde daha iyi bir integer çözüm olabilir → branch (x<sub>1</sub> = 0.5 → P5: x<sub>1</sub> = 0, P6: x<sub>1</sub> = 1). P4 infeasible, branch edilmez.`,
    },
    {
      q: `Example 7'de P1'i x<sub>1</sub> ile dallayınca: P5 (x<sub>1</sub> = 0) → z = 0.6, x = (0, 0, 1, 1); P6 (x<sub>1</sub> = 1) → z = 0.53, x<sub>1</sub> = 1, x<sub>3</sub> = 0.67. Mevcut LB 0.5'tir. Doğru yorum hangisidir?`,
      options: [
        `P5 yeni candidate (LB = 0.6); P6 fathom (0.53 ≤ 0.6). Optimum z* = 0.6, x = (0, 0, 1, 1).`,
        `P5 ve P6 ikisi de candidate; P3'ün LB'si korunur.`,
        `P6 branch edilir çünkü 0.53 &gt; 0.5.`,
        `P5 fathom (0.6 &gt; LB olduğu için), P6 candidate.`,
      ],
      answer: 0,
      explain: `P5 tüm-integer ve 0.6 &gt; 0.5 ⇒ yeni candidate, LB = 0.6 (P3 geçersizleşir). P6: z = 0.53 ≤ 0.6 ⇒ fathom (notlar: "P6 cannot yield a z-value exceeding the current LB"). Üçüncü seçenek eski LB = 0.5'i kullandığı için yanlıştır: P5 bulunduktan sonra geçerli LB 0.6'dır. Optimum (0, 0, 1, 1), z = 0.6.`,
    },
    {
      q: `Example 7'de toplam kaç LP çözüldü ve karşılaştırma için tam enumeration kaç olasılık inceler?`,
      options: [`7 LP; enumeration 16 olasılık`, `16 LP; enumeration 7 olasılık`, `6 LP; enumeration 8 olasılık`, `7 LP; enumeration 4 olasılık`],
      answer: 0,
      explain: `LR + P1…P6 = 7 LP. 4 binary değişken ⇒ 2<sup>4</sup> = 16 olasılık. Notlar: "we did not enumerate all possible integer solutions (of which there are 16). Instead, here we solved 7 LP's." Tree search'ün işe yarama nedeni budur.`,
    },
    {
      q: `Example 7'de P2 (x<sub>2</sub> = 1) için LP: x<sub>2</sub> = 1, x<sub>3</sub> = 0.67 ve z = 0.63 bulunmuştur. x<sub>3</sub>'ün üst sınırını hangi kısıt belirler?`,
      options: [
        `Üçüncü kısıt: 0.2·1 + 0.3x<sub>3</sub> ≤ 0.4 ⇒ x<sub>3</sub> ≤ 2/3`,
        `Birinci kısıt: 1 + 1.5x<sub>3</sub> ≤ 3.1 ⇒ x<sub>3</sub> ≤ 1.4`,
        `İkinci kısıt: 0.8 + 1.5x<sub>3</sub> ≤ 2.5 ⇒ x<sub>3</sub> ≤ 1.13`,
        `Hiçbir kısıt; x<sub>3</sub> ≤ 1 sınırı bağlayıcıdır`,
      ],
      answer: 0,
      explain: `x<sub>2</sub> = 1 sabitlenince kısıtların RHS'si azalır: 3. kısıtta 0.4 − 0.2 = 0.2 ⇒ 0.3x<sub>3</sub> ≤ 0.2 ⇒ x<sub>3</sub> ≤ 2/3 (en sıkı). 1. ve 2. kısıtlar x<sub>3</sub> ≤ 1.4 ve ≤ 1.13 verir (bağlayıcı değil). z = 0.3 + 0.5·(2/3) = 0.633.`,
    },
    {
      q: `Example 7'de P6 = P1 + x<sub>1</sub> = 1 (yani x<sub>2</sub> = 0, x<sub>1</sub> = 1 sabit): LP'nin çözümü hangisidir?`,
      options: [
        `x<sub>3</sub> = 2/3, x<sub>4</sub> = 0, z = 0.2 + 0.5·(2/3) ≈ 0.53`,
        `x<sub>3</sub> = 1, x<sub>4</sub> = 1, z = 0.8`,
        `x<sub>3</sub> = 0.5, x<sub>4</sub> = 1, z = 0.55`,
        `Infeasible`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> = 1, x<sub>2</sub> = 0: 3. kısıt 0.2 + 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.4 ⇒ 0.3x<sub>3</sub> + 0.1x<sub>4</sub> ≤ 0.2. Amaç 0.5x<sub>3</sub> + 0.1x<sub>4</sub>: x<sub>3</sub> başına kaynak maliyeti 0.3'e 0.5 kazanç (1.67) x<sub>4</sub>'ün 0.1'e 0.1 (1.0)'ından iyi ⇒ x<sub>3</sub> = 2/3, x<sub>4</sub> = 0, z ≈ 0.533. Notlardaki 0.53 budur.`,
    },
    {
      q: `Binary B&amp;B'de bir değişken (örn. x<sub>2</sub>) bir kez x<sub>2</sub> = 0 veya 1 ile sabitlendikten sonra hakkında hangisi doğrudur?`,
      options: [
        `O dalın altındaki hiçbir node'da kesirli olamaz; ağacın her yolunda en fazla bir kez dallanır.`,
        `Alt node'larda yine kesirli çıkabilir ve yeniden dallanır.`,
        `Alt node'larda 0 ≤ x<sub>2</sub> ≤ 1 olarak serbest kalır.`,
        `Sadece LIFO'da sabit kalır.`,
      ],
      answer: 0,
      explain: `Sabitlenen değişken RHS'ye taşınır ve değeri 0 veya 1'dir. Dolayısıyla ağaç derinliği en fazla n'dir. Genel integer problemlerde ise (Example 5'te x<sub>1</sub>) aynı değişken tekrar dallanabilir.`,
    },
    {
      q: `BI2: <b>max 12x<sub>1</sub> + 9x<sub>2</sub> + 10x<sub>3</sub> + 10x<sub>4</sub></b> s.t. 7x<sub>1</sub> + 8x<sub>2</sub> + 2x<sub>3</sub> + 5x<sub>4</sub> ≤ 12; 2x<sub>1</sub> + 6x<sub>2</sub> + 8x<sub>3</sub> + 4x<sub>4</sub> ≤ 13; x binary. LR: z = 85/3 ≈ 28.33, x = (5/6, 0, 1, 5/6). <b>x<sub>1</sub> üzerinden</b> dallanınca: P1 (x<sub>1</sub> = 0): z = 581/26 ≈ 22.35; P2 (x<sub>1</sub> = 1): z = 28, x = (1, 0, 1, 3/5). Jumptracking'te branch edilecek node ve değişken?`,
      options: [
        `P2, x<sub>4</sub> üzerinden (x<sub>4</sub> = 3/5 kesirli tek değişken)`,
        `P1, x<sub>2</sub> üzerinden`,
        `P2, x<sub>3</sub> üzerinden`,
        `P2 fathom edilir çünkü z = 28 tam sayıdır`,
      ],
      answer: 0,
      explain: `En iyi z: P2 (28 &gt; 22.35). P2'de x = (1, 0, 1, 3/5): tek kesirli değişken x<sub>4</sub> = 3/5 ⇒ P3: x<sub>4</sub> = 0, P4: x<sub>4</sub> = 1. z = 28 tam sayı olması çözümün integer olduğu anlamına gelmez (x<sub>4</sub> kesirli).`,
    },
    {
      q: `BI2'de P2'yi x<sub>4</sub> ile dalladık: P3 (x<sub>4</sub> = 0): z = 203/8 ≈ 25.38, x = (1, 3/8, 1, 0); P4 (x<sub>4</sub> = 1): z = 22, x = (1, 0, 0, 1) (tüm integer). Şimdi LB ve sıradaki branch hangisidir? (Açık node'lar: P1 z ≈ 22.35 ve P3.)`,
      options: [
        `LB = 22; sıradaki branch P3 (en iyi z = 25.38), x<sub>2</sub> = 3/8 üzerinden.`,
        `LB = 22; sıradaki branch P1 (z = 22.35, en eski).`,
        `LB = 28; P3 branch edilir.`,
        `LB = 25.38; P4 branch edilir.`,
      ],
      answer: 0,
      explain: `P4 tüm-integer: candidate, LB = 22. P4'ün (1,0,0,1) kontrolü: 7 + 5 = 12 ≤ 12 ✓, 2 + 4 = 6 ≤ 13 ✓, z = 22. Açık node'lar P1 (22.35) ve P3 (25.38) ⇒ en iyi z: P3, kesirli değişken x<sub>2</sub> = 3/8. LB 28 veya 25.38 olamaz: bunlar kesirli çözümlerin değerleridir.`,
    },
    {
      q: `BI2'de LB = 22 iken P3'ün çocukları çözülür: P5 (x<sub>2</sub> = 0): x = (1, 0, 1, 0), z = 22 (tüm integer); P6 (x<sub>2</sub> = 1): infeasible. Sonrasında P1 (z ≈ 22.35) iki çocuğu (z = 20 ve z = 20.56) verir. Nihai sonuç ve P5'in durumu?`,
      options: [
        `P5: z = 22 = LB, "aşmıyor" ⇒ fathom (LB değişmez); optimum z* = 22 ve alternatif optimum çözümler vardır: (1,0,0,1) ve (1,0,1,0).`,
        `P5 yeni candidate olur ve LB = 22 → 44 olur.`,
        `P5 branch edilir çünkü z = LB.`,
        `Optimum z* = 22.35.`,
      ],
      answer: 0,
      explain: `P5 integer ve z = 22, LB = 22'yi aşmıyor ⇒ fathom (jumptracking çözümü P4'teki (1,0,0,1) olarak kalır). (1,0,1,0): 7 + 2 = 9 ≤ 12; 2 + 8 = 10 ≤ 13; z = 12 + 10 = 22 ✓. İki eşit değerli optimal çözümden B&amp;B önce bulunanı raporlar. P1'in çocukları 20 ve 20.56 ≤ 22 olduğundan fathom. z* = 22.35 olamaz (fractional LP değeridir).`,
    },
    {
      q: `BI2'yi <b>LIFO</b> ile ("x = 0" çocuk önce çözülür; her node'da indeksi en küçük kesirli değişken seçilir, root'ta x<sub>1</sub>) çözersek, LB'nin sırasıyla aldığı değerler ve nihai çözüm ne olur?`,
      options: [
        `LB: 20 → 22; nihai x = (1, 0, 1, 0), z = 22`,
        `LB: 22; nihai x = (1, 0, 0, 1), z = 22`,
        `LB: 20 → 22; nihai x = (1, 0, 0, 1), z = 22`,
        `LB: 28 → 22`,
      ],
      answer: 0,
      hint: `LIFO: P1 (x<sub>1</sub> = 0) tarafına önce iner; orada (0, 0, 1, 1) z = 20 integer bulunur. Sonra x<sub>1</sub> = 1 tarafı.`,
      explain: `LIFO ("x = 0" çocuk önce): x<sub>1</sub> = 0 dalı: x<sub>2</sub> = 0 → (0, 0, 1, 1), z = 20 integer ⇒ <b>LB = 20</b>; x<sub>2</sub> = 1 → z = 20.56 kesirli ⇒ x<sub>3</sub> = 0: z = 17, x<sub>3</sub> = 1: infeasible. Sonra x<sub>1</sub> = 1 dalı (z = 28) → x<sub>4</sub> = 0 (z = 25.38) → x<sub>2</sub> = 0 → (1, 0, 1, 0) z = 22 ⇒ <b>LB = 22</b>; x<sub>2</sub> = 1 infeasible; sonra x<sub>4</sub> = 1: (1, 0, 0, 1), z = 22 ≤ LB ⇒ fathom. Bulunan çözüm (1, 0, 1, 0). Toplam 11 LP (jumptracking 9 LP).`,
    },
    {
      q: `Example 7'nin P1'inde (x<sub>2</sub> = 0), LP'nin <b>alternatif optimumu</b> vardır: (x<sub>1</sub> = 0.5, x<sub>3</sub> = 1) ve (x<sub>3</sub> = x<sub>4</sub> = 1), ikisi de z = 0.6. Bir LP çözücü ikincisini verseydi ne olurdu?`,
      options: [
        `P1 tüm-integer olurdu: LB = 0.6 hemen; P1 branch edilmez. P2 (0.63) hâlâ branch edilmeli, sonuç yine z* = 0.6.`,
        `P1 fathom edilirdi ve optimal çözüm kaybolurdu.`,
        `Optimum z* = 0.65 olurdu.`,
        `Algoritma çalışmazdı.`,
      ],
      answer: 0,
      explain: `(0, 0, 1, 1): z = 0.5 + 0.1 = 0.6, tüm kısıtlar sağlanır ⇒ P1 candidate (LB = 0.6). P2 (0.63 &gt; 0.6) branch edilir: P3 (0.5) fathom, P4 infeasible. Sonuç aynı z* = 0.6 ama 7 yerine 5 LP. Alternatif optimumda ağaç çözücüye göre değişebilir; optimal z hiç değişmez.`,
    },
  ];

  /* ====================================================================== 2.5.3 */
  OR.content.summaries['2.5.3'] = `
<h2>2.5.3 B&amp;B — Knapsack Problems</h2>
<p>Knapsack: tek kısıtlı binary IP.</p>
<div class="model">max z = c<sub>1</sub>x<sub>1</sub> + … + c<sub>n</sub>x<sub>n</sub>   s.t.  a<sub>1</sub>x<sub>1</sub> + … + a<sub>n</sub>x<sub>n</sub> ≤ b;   x<sub>i</sub> = 0 or 1</div>
<p>Binary olduğu için branching x<sub>i</sub> = 0 / x<sub>i</sub> = 1'dir (2.5.2). Ek kolaylık: <b>LP relaxation, LP paketi olmadan inspection (inceleme) ile çözülür</b>.</p>

<h3>Inspection (greedy) kuralı</h3>
<ul>
  <li>c<sub>i</sub> = item i'nin kazancı, a<sub>i</sub> = kullandığı kaynak, b = toplam kaynak. <b>Oran r<sub>i</sub> = c<sub>i</sub>/a<sub>i</sub></b> = bir birim kaynak başına kazanç.</li>
  <li>Her subproblem için <b>tüm oranları hesapla</b>, en büyük orandan başlayarak sırayla ekle; sıradaki item sığmayacağı ana kadar devam et; sonra sığmayan item'dan <b>sığabildiği kadar (kesirli)</b> koy.</li>
  <li>Sabitlenmiş değişkenler: x<sub>i</sub> = 1 ⇒ b ← b − a<sub>i</sub> ve z'ye c<sub>i</sub> eklenir; x<sub>i</sub> = 0 ⇒ item çıkar. Kalan item'lar yine orana göre doldurulur.</li>
  <li>Sonuç: LR çözümünde <b>en fazla bir değişken kesirlidir</b> (kritik item); branch o değişken üzerinden yapılır.</li>
  <li>Sabitlenen item'ların toplam ağırlığı zaten b'yi aşıyorsa subproblem <b>infeasible</b>'dir.</li>
</ul>

<h3>Example 8</h3>
<div class="model">max z = 8x<sub>1</sub> + 11x<sub>2</sub> + 6x<sub>3</sub> + 4x<sub>4</sub>
s.t.  5x<sub>1</sub> + 7x<sub>2</sub> + 4x<sub>3</sub> + 3x<sub>4</sub> ≤ 14;   x<sub>j</sub> = 0 or 1</div>
<p>Oranlar: r<sub>1</sub> = 8/5 = <b>1.6</b>, r<sub>2</sub> = 11/7 ≈ <b>1.57</b>, r<sub>3</sub> = 6/4 = <b>1.5</b>, r<sub>4</sub> = 4/3 ≈ <b>1.33</b> ⇒ sıra: 1, 2, 3, 4.</p>
<ol>
  <li><b>LR</b>: x<sub>1</sub> = 1 (5), x<sub>2</sub> = 1 (7) → 12 kullanıldı, kalan 2; x<sub>3</sub> = 2/4 = 0.5. <b>z = 8 + 11 + 3 = 22</b>, x = (1, 1, 0.5, 0). Branch x<sub>3</sub>.</li>
  <li><b>P1 (x<sub>3</sub> = 0)</b>: x<sub>1</sub> = x<sub>2</sub> = 1 (12), kalan 2 → x<sub>4</sub> = 2/3; <b>z = 19 + 8/3 = 21.67</b>. <b>P2 (x<sub>3</sub> = 1)</b>: kalan 14 − 4 = 10; x<sub>1</sub> = 1 (5), kalan 5 → x<sub>2</sub> = 5/7; <b>z = 6 + 8 + 55/7 ≈ 21.85</b>. Jumptracking: en iyi z = P2.</li>
  <li><b>Branch P2 üzerinden x<sub>2</sub></b>: <b>P3 (x<sub>2</sub> = 0)</b>: x = (1, 0, 1, 1), ağırlık 5 + 4 + 3 = 12 ≤ 14, <b>z = 18</b>, tüm integer → <b>candidate, LB = 18</b>. <b>P4 (x<sub>2</sub> = 1)</b>: x<sub>2</sub> = x<sub>3</sub> = 1 (11), kalan 3 → x<sub>1</sub> = 3/5; <b>z = 11 + 6 + 4.8 = 21.8</b>.</li>
  <li>Açıklar: P1 (21.67), P4 (21.8) → <b>Branch P4 üzerinden x<sub>1</sub></b>: <b>P5 (x<sub>1</sub> = 0)</b>: x = (0, 1, 1, 1), ağırlık 7 + 4 + 3 = 14, <b>z = 21</b>, integer → <b>yeni candidate, LB = 21</b>. <b>P6 (x<sub>1</sub> = 1)</b>: x<sub>1</sub> = x<sub>2</sub> = x<sub>3</sub> = 1 ⇒ 5 + 7 + 4 = 16 &gt; 14 ⇒ <b>infeasible</b>.</li>
  <li>Kalan tek açık node P1: z = 21.67. Amaç katsayıları integer olduğundan bu bölgedeki integer çözümler en fazla 21 verebilir; LB = 21 zaten var ⇒ <b>P1 bounding argümanıyla fathom</b>.</li>
</ol>
<div class="model">LR            z = 22      x = (1, 1, 0.5, 0)                  → branch x3
├─ P1  x3 = 0    z = 21.67   x = (1, 1, 0, 2/3)     açık; en sonda: integer z ≤ 21 = LB → FATHOM (bounding)
└─ P2  x3 = 1    z ≈ 21.85   x = (1, 5/7, 1, 0)                          → branch x2
    ├─ P3  x2 = 0    z = 18      x = (1, 0, 1, 1)   integer → candidate LB = 18 (sonra aşıldı)
    └─ P4  x2 = 1    z = 21.8    x = (3/5, 1, 1, 0)                      → branch x1
        ├─ P5  x1 = 0    z = 21      x = (0, 1, 1, 1)  integer → LB = 21  ★ OPTIMAL
        └─ P6  x1 = 1    INFEASIBLE (5 + 7 + 4 = 16 &gt; 14)</div>
<div class="box"><b>Sonuç:</b> z* = 21, x = (0, 1, 1, 1): item 2, 3, 4 sepete konur, toplam değer 21. Toplam 7 LP (LR + P1…P6).</div>

<h3>Olay günlüğü</h3>
<table>
  <tr><th>Adım</th><th>Çözülen</th><th>Sonuç</th><th>Karar</th><th>LB</th></tr>
  <tr><td>1</td><td>LR</td><td>22, x<sub>3</sub> = 0.5</td><td>branch x<sub>3</sub></td><td>–</td></tr>
  <tr><td>2</td><td>P1, P2</td><td>21.67 ve 21.85</td><td>en iyi P2 → branch x<sub>2</sub></td><td>–</td></tr>
  <tr><td>3</td><td>P3, P4</td><td>P3: 18 integer; P4: 21.8</td><td>P3 candidate; açıklar P1 (21.67), P4 (21.8) → P4 branch x<sub>1</sub></td><td>18</td></tr>
  <tr><td>4</td><td>P5, P6</td><td>P5: 21 integer; P6: infeasible</td><td>P5 yeni candidate</td><td>21</td></tr>
  <tr><td>5</td><td>P1</td><td>21.67 → integer çözüm ≤ 21</td><td>fathom (bounding)</td><td>21</td></tr>
</table>

<h3>Ek örnekler (kendi sayılarıyla)</h3>
<div class="model">K1: max 12x<sub>1</sub> + 9x<sub>2</sub> + 8x<sub>3</sub> + 5x<sub>4</sub>;  7x<sub>1</sub> + 6x<sub>2</sub> + 5x<sub>3</sub> + 4x<sub>4</sub> ≤ 15
 oranlar: 1.714 | 1.5 | 1.6 | 1.25  ⇒ sıra 1, 3, 2, 4
 LR: x1 = 1 (7), x3 = 1 (5) → 12, kalan 3 → x2 = 0.5 ⇒ z = 12 + 8 + 4.5 = 24.5
 x2 = 1: (1, 1, 2/5, 0), z = 24.2     x2 = 0: (1, 0, 1, 3/4), z = 23.75

K2: max 10x<sub>1</sub> + 7x<sub>2</sub> + 5x<sub>3</sub> + 3x<sub>4</sub>;  6x<sub>1</sub> + 5x<sub>2</sub> + 4x<sub>3</sub> + 3x<sub>4</sub> ≤ 12
 oranlar: 1.667 | 1.4 | 1.25 | 1.0
 LR: x1 = x2 = 1 (11), kalan 1 → x3 = 1/4 ⇒ z = 17 + 1.25 = 18.25
 P1 (x3 = 0): (1, 1, 0, 1/3), z = 18      P2 (x3 = 1): (1, 2/5, 1, 0), z = 17.8
 P1 → x4: (x4 = 0): (1, 1, 0, 0), z = 17 integer → LB = 17;  (x4 = 1): (1, 3/5, 0, 1), z = 17.2
 Katsayılar integer ⇒ ⌊17.8⌋ = 17 ≤ 17 ve ⌊17.2⌋ = 17 ≤ 17 ⇒ ikisi de fathom. z* = 17, x = (1, 1, 0, 0)

K3: max 14x<sub>1</sub> + 9x<sub>2</sub> + 10x<sub>3</sub> + 6x<sub>4</sub>;  7x<sub>1</sub> + 5x<sub>2</sub> + 8x<sub>3</sub> + 4x<sub>4</sub> ≤ 14
 oranlar: 2 | 1.8 | 1.25 | 1.5  ⇒ sıra 1, 2, 4, 3;  LR: x1 = x2 = 1 (12), kalan 2 → x4 = 0.5, z = 14 + 9 + 3 = 26</div>

<div class="warnbox"><b>Sınav tuzakları</b>
<ul>
  <li>Sıralama <b>c</b>'ye veya <b>a</b>'ya göre değil, <b>oran c/a</b>'ya göre yapılır. K1'de c'ye göre sıralamak z = 24.2 verir (yanlış LR değeri: gerçek 24.5).</li>
  <li>Alt problemde sabitlenen item'ların ağırlığını b'den düş, kazancını z'ye ekle. x<sub>i</sub> = 0 olan item sıralamadan çıkar.</li>
  <li>Kesirli değişken <b>kritik item</b>'dır; branch o değişkenin x = 0 / x = 1 çocuklarıdır. LR'de birden fazla kesirli değişken <b>olmaz</b>.</li>
  <li>P1 (21.67) fathom'u için "21.67 ≤ 21" <b>yanlıştır</b>; gerekçe "katsayılar integer ⇒ integer z ≤ ⌊21.67⌋ = 21 ≤ LB" argümanıdır (ondalıklı katsayıda geçerli olmazdı).</li>
  <li>Jumptracking: P3 (z = 18, integer) candidate olsa da <b>açık node'ların en iyisi</b> (P4, 21.8) branch edilir, çünkü 21.8 &gt; 18.</li>
  <li>P6 infeasible'dır: 5 + 7 + 4 = 16 &gt; 14. Sabit item'ların toplamı b'yi aşıyorsa LP çözmeye gerek yok.</li>
</ul></div>
`;

  OR.content.concepts['2.5.3'] = [
    {
      q: `Example 8: <b>max 8x<sub>1</sub> + 11x<sub>2</sub> + 6x<sub>3</sub> + 4x<sub>4</sub></b>, 5x<sub>1</sub> + 7x<sub>2</sub> + 4x<sub>3</sub> + 3x<sub>4</sub> ≤ 14, x binary. Oranlar r<sub>i</sub> = c<sub>i</sub>/a<sub>i</sub> nelerdir ve hangi sırayla item eklenir?`,
      options: [
        `r = (1.6, 1.57, 1.5, 1.33); sıra 1, 2, 3, 4`,
        `r = (8, 11, 6, 4); sıra 2, 1, 3, 4`,
        `r = (5, 7, 4, 3); sıra 2, 1, 3, 4`,
        `r = (1.6, 1.57, 1.5, 1.33); sıra 4, 3, 2, 1`,
      ],
      answer: 0,
      explain: `r<sub>1</sub> = 8/5 = 1.6, r<sub>2</sub> = 11/7 ≈ 1.57, r<sub>3</sub> = 6/4 = 1.5, r<sub>4</sub> = 4/3 ≈ 1.33. Kaynak başına kazancı en büyük item önce eklenir: 1, 2, 3, 4. Sıralamayı doğrudan c veya a'ya göre yapmak yanlıştır.`,
    },
    {
      q: `Example 8'in LR'sini inspection ile çözün. LR çözümü ve z-değeri nedir?`,
      options: [
        `x = (1, 1, 0.5, 0), z = 22`,
        `x = (1, 1, 1, 0), z = 25`,
        `x = (1, 0.5, 1, 0), z = 19.5`,
        `x = (0, 1, 1, 1), z = 21`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> = 1 (5), x<sub>2</sub> = 1 (7) → kullanılan 12, kalan 2. x<sub>3</sub> tam sığmaz (4 &gt; 2), 2/4 = 0.5 konur. z = 8 + 11 + 0.5·6 = 22. (1,1,1,0) ağırlık 16 &gt; 14 infeasible. (0,1,1,1) bir IP çözümü (z = 21), LR optimumu değil.`,
    },
    {
      q: `Example 8'de LR çözümü (1, 1, 0.5, 0). x<sub>3</sub> üzerinden dallanınca P1 (x<sub>3</sub> = 0) ve P2 (x<sub>3</sub> = 1) için LP z-değerleri nedir?`,
      options: [
        `P1: x = (1, 1, 0, 2/3), z ≈ 21.67;  P2: x = (1, 5/7, 1, 0), z ≈ 21.86`,
        `P1: x = (1, 1, 0, 1), z = 23;  P2: x = (1, 0, 1, 1), z = 18`,
        `P1: z = 22;  P2: z = 22 (aynı)`,
        `P1: x = (1, 1, 0, 2/3), z ≈ 21.67;  P2: infeasible`,
      ],
      answer: 0,
      explain: `P1: x<sub>3</sub> = 0 ⇒ x<sub>1</sub>, x<sub>2</sub> (12), kalan 2 → x<sub>4</sub> = 2/3, z = 19 + 8/3 = 21.67. P2: x<sub>3</sub> = 1 ⇒ kalan 10; x<sub>1</sub> = 1 (5), kalan 5 → x<sub>2</sub> = 5/7, z = 6 + 8 + 55/7 = 153/7 ≈ 21.857 (notlarda 21.85). (1,1,0,1) ağırlığı 15 &gt; 14.`,
    },
    {
      q: `Example 8'de P1 ≈ 21.67 ve P2 ≈ 21.85 çözüldü, LB henüz yok. <b>Jumptracking</b> ile hangisi hangi değişkenden branch edilir?`,
      options: [
        `P2, x<sub>2</sub> üzerinden (x<sub>2</sub> = 5/7)`,
        `P1, x<sub>4</sub> üzerinden (x<sub>4</sub> = 2/3)`,
        `P2, x<sub>1</sub> üzerinden`,
        `Her iki node de aynı anda`,
      ],
      answer: 0,
      explain: `En iyi z: P2 (21.85 &gt; 21.67). P2'nin tek kesirli değişkeni x<sub>2</sub> = 5/7 ⇒ P3 (x<sub>2</sub> = 0), P4 (x<sub>2</sub> = 1). P1 bekler.`,
    },
    {
      q: `Example 8'de P2'yi x<sub>2</sub> ile dallayınca P3 (x<sub>2</sub> = 0) ve P4 (x<sub>2</sub> = 1) çözülür. P3 ve P4'ün sonuçları nedir? (P2: x<sub>3</sub> = 1 sabit)`,
      options: [
        `P3: x = (1, 0, 1, 1), z = 18 (integer); P4: x = (3/5, 1, 1, 0), z = 21.8`,
        `P3: x = (1, 0, 1, 1), z = 18; P4: x = (1, 1, 1, 0), z = 25`,
        `P3: z = 21.8; P4: z = 18`,
        `P3: infeasible; P4: x = (3/5, 1, 1, 0), z = 21.8`,
      ],
      answer: 0,
      explain: `P3: x<sub>2</sub> = 0, x<sub>3</sub> = 1 ⇒ kalan 10: x<sub>1</sub> (5), x<sub>4</sub> (3) = 8 ≤ 10 hepsi sığar ⇒ (1,0,1,1), z = 8 + 6 + 4 = 18, integer. P4: x<sub>2</sub> = x<sub>3</sub> = 1 ⇒ 11, kalan 3 ⇒ x<sub>1</sub> = 3/5, z = 11 + 6 + 4.8 = 21.8. (1,1,1,0) ağırlık 16, infeasible.`,
    },
    {
      q: `Example 8'de P3 candidate (LB = 18); açık node'lar P1 (21.67) ve P4 (21.8). P4'ü x<sub>1</sub> = 3/5 ile dallayınca: P5 (x<sub>1</sub> = 0) ve P6 (x<sub>1</sub> = 1). Sonuçlar nelerdir?`,
      options: [
        `P5: x = (0, 1, 1, 1), z = 21, integer (LB = 21); P6: x<sub>1</sub> = x<sub>2</sub> = x<sub>3</sub> = 1 ⇒ ağırlık 16 &gt; 14, infeasible`,
        `P5: infeasible; P6: x = (1, 1, 1, 0), z = 25`,
        `P5: z = 21.8; P6: z = 21`,
        `P5: x = (0, 1, 1, 1), z = 21; P6: x = (1, 1, 1, 0), z = 25 candidate`,
      ],
      answer: 0,
      explain: `P5: x<sub>2</sub> = x<sub>3</sub> = 1, x<sub>1</sub> = 0 ⇒ 11, kalan 3 → x<sub>4</sub> = 1 (3) ⇒ ağırlık 14, z = 11 + 6 + 4 = 21, integer ⇒ yeni candidate (21 &gt; 18). P6: x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub> = 1 ⇒ 5 + 7 + 4 = 16 &gt; 14 ⇒ infeasible. (Notlarda: "Infeasible (x3=x2=x1=1: LHS=16)".)`,
    },
    {
      q: `Example 8'de LB = 21 olduktan sonra tek açık node P1'dir (x = (1, 1, 0, 2/3), z = 21.67). Neden fathom edilir? Doğru gerekçeyi seçin.`,
      options: [
        `Amaç katsayıları integer olduğundan P1 bölgesindeki her integer çözümün z'si en fazla ⌊21.67⌋ = 21'dir; zaten LB = 21 var.`,
        `21.67 ≤ 21 olduğundan fathom edilir.`,
        `P1 infeasible'dır.`,
        `P1'in çözümü tüm-integer olduğu için fathom edilir.`,
      ],
      answer: 0,
      explain: `Temel kural "z ≤ LB" burada doğrudan sağlanmaz (21.67 &gt; 21). Notlar: "There is no better solution for this subproblem than 21. But we already have a solution with value 21." Bu, c<sub>i</sub> integer ve x<sub>i</sub> binary olduğu için z'nin integer olmasına dayanır. P1 feasible'dır ve çözümü kesirlidir (x<sub>4</sub> = 2/3).`,
    },
    {
      q: `Example 8'in nihai sonucu nedir?`,
      options: [
        `z* = 21, x = (0, 1, 1, 1): item 2, 3, 4 sepete konur`,
        `z* = 22, x = (1, 1, 0.5, 0)`,
        `z* = 21.85, x = (1, 5/7, 1, 0)`,
        `z* = 18, x = (1, 0, 1, 1)`,
      ],
      answer: 0,
      explain: `Son candidate P5: (0, 1, 1, 1), ağırlık 7 + 4 + 3 = 14 ≤ 14, z = 11 + 6 + 4 = 21. 22 ve 21.85 kesirli LP değerleridir (UB'ler); 18 daha önceki, aşılmış candidate'tır (P3).`,
    },
    {
      q: `K1: <b>max 12x<sub>1</sub> + 9x<sub>2</sub> + 8x<sub>3</sub> + 5x<sub>4</sub></b>, 7x<sub>1</sub> + 6x<sub>2</sub> + 5x<sub>3</sub> + 4x<sub>4</sub> ≤ 15, x binary. LR'yi inspection ile çözün: sıra ve çözüm?`,
      options: [
        `Sıra 1, 3, 2, 4 (oranlar 1.71, 1.6, 1.5, 1.25); x = (1, 0.5, 1, 0), z = 24.5`,
        `Sıra 1, 2, 3, 4 (c'ye göre); x = (1, 1, 0.4, 0), z = 24.2`,
        `Sıra 3, 1, 2, 4; x = (1, 0.5, 1, 0), z = 24.5`,
        `Sıra 4, 3, 2, 1; x = (0, 0, 1, 1), z = 13`,
      ],
      answer: 0,
      hint: `r<sub>1</sub> = 12/7, r<sub>2</sub> = 9/6, r<sub>3</sub> = 8/5, r<sub>4</sub> = 5/4.`,
      explain: `Oranlar: 1.714, 1.5, 1.6, 1.25 ⇒ sıra 1, 3, 2, 4. x<sub>1</sub> = 1 (7), x<sub>3</sub> = 1 (5) ⇒ 12, kalan 3 ⇒ x<sub>2</sub> = 3/6 = 0.5. z = 12 + 8 + 4.5 = 24.5. c'ye göre sıralayıp 24.2 bulmak yanlıştır: bu, LP optimumundan (24.5) küçüktür ve geçerli bir UB olmaz. Üçüncü seçenekte sıra yanlış verilmiş (ratio sırası 1,3,2,4'tür).`,
    },
    {
      q: `K1'de x<sub>2</sub> üzerinden dallanınca x<sub>2</sub> = 1 çocuğunun LR çözümü nedir?`,
      options: [
        `x = (1, 1, 2/5, 0), z = 24.2`,
        `x = (1, 1, 1, 0), z = 29`,
        `x = (1, 1, 0, 1/2), z = 23.5`,
        `x = (4/7, 1, 1, 0), z ≈ 23.86`,
      ],
      answer: 0,
      explain: `x<sub>2</sub> = 1 ⇒ ağırlık 6, kalan 9, z'ye +9. Kalan item'lar oranlarına göre: x<sub>1</sub> (1.714) → 7, kalan 2; sıradaki x<sub>3</sub> (1.6): 2/5 = 0.4. z = 9 + 12 + 3.2 = 24.2. (1,1,1,0) ağırlık 18 &gt; 15. (1,1,0,1/2): x<sub>3</sub> yerine x<sub>4</sub> seçmek oran sırasına aykırıdır. (4/7,1,1,0) ise x<sub>2</sub> = 1 ve x<sub>3</sub> = 1 olan bir alt node'un (bir seviye aşağıda) çözümüdür: kalan 4, x<sub>1</sub> = 4/7.`,
    },
    {
      q: `K2: <b>max 10x<sub>1</sub> + 7x<sub>2</sub> + 5x<sub>3</sub> + 3x<sub>4</sub></b>, 6x<sub>1</sub> + 5x<sub>2</sub> + 4x<sub>3</sub> + 3x<sub>4</sub> ≤ 12. LR: x = (1, 1, 1/4, 0), z = 18.25. Jumptracking: P1 (x<sub>3</sub> = 0): z = 18, x = (1, 1, 0, 1/3); P2 (x<sub>3</sub> = 1): z = 17.8, x = (1, 2/5, 1, 0). P1 branch edilip x<sub>4</sub> = 1/3 ile dallanınca (x<sub>4</sub> = 0): x = (1, 1, 0, 0), z = 17 (integer, LB = 17); (x<sub>4</sub> = 1): x = (1, 3/5, 0, 1), z = 17.2. Katsayılar integer olduğundan bu noktada <b>fathom edilebilecek</b> node'lar hangileridir?`,
      options: [
        `P2 (z = 17.8) ve x<sub>4</sub> = 1 çocuğu (z = 17.2): ⌊z⌋ = 17 ≤ LB = 17`,
        `Yalnızca x<sub>4</sub> = 0 çocuğu`,
        `Fathom edilecek node yok; 17.8 ve 17.2 &gt; 17 olduğundan ikisi de branch edilmelidir.`,
        `Yalnızca P2`,
      ],
      answer: 0,
      hint: `Amaç katsayıları integer, değişkenler binary ⇒ her integer çözümün z'si integer.`,
      explain: `x<sub>4</sub> = 0 çocuğu candidate'tır (LB = 17). P2 (17.8) ve x<sub>4</sub> = 1 çocuğu (17.2) için integer çözüm en fazla ⌊17.8⌋ = ⌊17.2⌋ = 17 ≤ LB ⇒ Example 8'deki bounding argümanıyla fathom: z* = 17, x = (1, 1, 0, 0). (Yalnızca "z ≤ LB" temel kuralı kullanılsaydı bu iki node branch edilirdi; sonuç değişmezdi ama daha fazla LP çözülürdü: floor kuralıyla 5 LP, onsuz 9 LP.)`,
    },
    {
      q: `K2'de x<sub>1</sub> = 0 (sabit) olan bir subproblem'in LR'sini bulun (kalan item'lar 2, 3, 4; b = 12).`,
      options: [
        `x = (0, 1, 1, 1), z = 15; tamamı sığar (5 + 4 + 3 = 12) ⇒ tüm integer, candidate`,
        `x = (0, 1, 1, 2/3), z = 14`,
        `x = (0, 1, 1, 1/2), z = 13.5`,
        `x = (0, 1, 0.5, 0), z = 9.5`,
      ],
      answer: 0,
      explain: `Sıra: x<sub>2</sub> (1.4), x<sub>3</sub> (1.25), x<sub>4</sub> (1.0). 5 + 4 + 3 = 12 ≤ 12 ⇒ hepsi tam sığar; kesirli değişken yok. z = 7 + 5 + 3 = 15. LR çözümü tüm-integer ise (naturally integer) o node'un IP optimumudur.`,
    },
    {
      q: `K2'de x<sub>1</sub> = x<sub>2</sub> = x<sub>3</sub> = 1 olarak sabitlenmiş bir subproblem'in durumu nedir (b = 12, a = (6, 5, 4, 3))?`,
      options: [
        `Infeasible: 6 + 5 + 4 = 15 &gt; 12`,
        `Feasible, z = 22`,
        `Feasible; x<sub>4</sub> = 0 ile z = 22`,
        `Feasible; kesirli bir x<sub>4</sub> alır`,
      ],
      answer: 0,
      explain: `Sabitlenen item'ların toplam ağırlığı b'yi aşıyorsa LP çözmeden infeasible denir (Example 8'in P6'sı: 5 + 7 + 4 = 16 &gt; 14). Burada 15 &gt; 12.`,
    },
    {
      q: `Knapsack B&amp;B için hangileri doğrudur?`,
      options: [
        `Subproblem'in LR'si LP paketi gerekmeden, oranlara göre inspection ile çözülür.`,
        `Her subproblem'in LR çözümünde en fazla bir değişken kesirlidir (kritik item).`,
        `Branching x<sub>i</sub> = 0 ve x<sub>i</sub> = 1 ile yapılır.`,
        `Sıralama için en büyük c<sub>i</sub> değeri kullanılır.`,
      ],
      answer: [0, 1, 2],
      explain: `Notlar: "The LP relaxation may be solved by inspection" ve "branching on x<sub>i</sub> will yield in x<sub>i</sub> = 0 and x<sub>i</sub> = 1". Greedy dolum bir tane kritik item'ı kesirli bırakır. Sıralama c'ye göre değil, <b>oran c/a</b>'ya göredir.`,
    },
    {
      q: `K3: <b>max 14x<sub>1</sub> + 9x<sub>2</sub> + 10x<sub>3</sub> + 6x<sub>4</sub></b>, 7x<sub>1</sub> + 5x<sub>2</sub> + 8x<sub>3</sub> + 4x<sub>4</sub> ≤ 14. LR değerini (UB) bulun.`,
      options: [`z = 26, x = (1, 1, 0, 0.5)`, `z = 22.75, x = (1, 0, 0.875, 0)`, `z = 23, x = (1, 1, 0, 0)`, `z = 29, x = (1, 1, 0, 1)`],
      answer: 0,
      hint: `Oranlar: 14/7, 9/5, 10/8, 6/4.`,
      explain: `Oranlar: 2, 1.8, 1.25, 1.5 ⇒ sıra 1, 2, 4, 3. x<sub>1</sub> = 1 (7), x<sub>2</sub> = 1 (5) ⇒ 12, kalan 2 ⇒ x<sub>4</sub> = 2/4 = 0.5. z = 14 + 9 + 3 = 26. (1,0,0.875,0) c'ye göre sıralama sonucudur ve LP optimumundan küçüktür (22.75); (1,1,0,0) integer ama LP optimumu değildir; (1,1,0,1) ağırlık 16 &gt; 14.`,
    },
  ];
})();
