/* Formül Kartı: Ch.1 + Ch.2.1–2.8 bölümü. ch2d.js … ch6.js kendi bölümlerini OR.content.cheatsheet += ile ekler.
   Classic script (no ES modules). Attaches to window.OR.content.cheatsheet. Source: Topcu & Kabak lecture notes.
*/
(function () {
  const OR = window.OR;

  OR.content.cheatsheet = `
<h3>1. IP tipleri ve LP Relaxation (LR)</h3>
<table>
  <tr><th>Tip</th><th>Tanım</th><th>LR'de karşılığı</th></tr>
  <tr><td><b>Pure IP</b></td><td>Tüm değişkenler integer</td><td>x<sub>i</sub> ≥ 0 and integer → x<sub>i</sub> ≥ 0</td></tr>
  <tr><td><b>Mixed IP</b></td><td>Bir kısmı integer, bir kısmı continuous</td><td>Integer koşulları kalkar</td></tr>
  <tr><td><b>Binary (0-1) IP</b></td><td>Integer değişkenler 0 or 1</td><td>x<sub>i</sub> = 0 or 1 → x<sub>i</sub> ≥ 0 <b>ve</b> x<sub>i</sub> ≤ 1</td></tr>
  <tr><td><b>Knapsack</b></td><td>Tek kısıt, c<sub>i</sub> ve a<sub>i</sub> ≥ 0, x<sub>i</sub> = 0 or 1</td><td>0 ≤ x<sub>i</sub> ≤ 1</td></tr>
</table>
<ul>
  <li>LR = <b>aynı amaç, aynı kısıtlar</b>, yalnızca integrality kalkar. Feasible bölge büyür.</li>
  <li><b>max</b>: z<sub>LR</sub> ≥ z<sub>IP</sub> (LR = <b>upper bound</b>). <b>min</b>: z<sub>LR</sub> ≤ z<sub>IP</sub> (LR = <b>lower bound</b>).</li>
  <li>LR infeasible ⇒ IP infeasible. LR çözümü integer ise IP için de optimal. Yuvarlama garanti vermez (Stock: LR 22, yuvarlama 19, optimal 21).</li>
  <li>Enumeration: n binary için 2<sup>n</sup> olasılık (50 değişken ≈ 1.1 × 10<sup>15</sup>). B&amp;B bir kısmını <i>implicit</i> eler.</li>
</ul>

<h3>2. Formülasyon kalıpları (M constraints)</h3>
<table>
  <tr><th>Kalıp</th><th>Formül</th><th>Not</th></tr>
  <tr><td><b>Budgeting / logical</b></td><td>en çok k: Σx<sub>j</sub> ≤ k &nbsp;·&nbsp; x<sub>2</sub> ⇒ x<sub>4</sub>: x<sub>2</sub> ≤ x<sub>4</sub> &nbsp;·&nbsp; birlikte olmaz: x<sub>1</sub> + x<sub>3</sub> ≤ 1 &nbsp;·&nbsp; tam biri: x<sub>1</sub> + x<sub>2</sub> = 1</td><td>x<sub>1</sub>=1 ⇒ x<sub>3</sub>=0; x<sub>1</sub>=0 iken x<sub>3</sub> serbest</td></tr>
  <tr><td><b>Fixed charge</b></td><td>x<sub>j</sub> ≤ M<sub>j</sub> y<sub>j</sub>; amaçta −K<sub>j</sub> y<sub>j</sub> (min'de +f<sub>i</sub> y<sub>i</sub>)</td><td>x<sub>j</sub> &gt; 0 ⇒ y<sub>j</sub> = 1. M = x<sub>j</sub>'nin kısıtlardan gelen <b>üst sınırı</b> (Gandhi: 40, 53, 25). Çok küçük M gereksiz kısıtlar; kapasite için Σ<sub>j</sub> x<sub>ij</sub> ≤ K<sub>i</sub> y<sub>i</sub></td></tr>
  <tr><td><b>Either-or</b><br><small>f ≤ 0 <b>veya</b> g ≤ 0 (en az biri)</small></td><td>f(x) ≤ M y<br>g(x) ≤ M (1 − y)</td><td>y=0 ⇒ (1) sağlanır; y=1 ⇒ (2) sağlanır. Compact Car: x = 0 or x ≥ 1000 → x ≤ M y, 1000 − x ≤ M(1 − y), M = min(6000/1.5, 60000/30) = 2000</td></tr>
  <tr><td><b>If-then</b><br><small>f &gt; 0 ⇒ g ≥ 0</small></td><td>−g(x) ≤ M y<br>f(x) ≤ M (1 − y)</td><td>f &gt; 0 ise (2) ancak y=0 ile sağlanır, (1) ⇒ g ≥ 0. M, f &lt; M ve −g &lt; M olacak kadar büyük</td></tr>
</table>
<div class="model">Set covering   (her eleman ≥ 1 alt kümede):  Σ<sub>j∈J</sub> x<sub>j</sub> ≥ 1    (örn. Fire Station, min Σx<sub>j</sub>)
Set packing    (her eleman ≤ 1 alt kümede):  Σ<sub>j∈J</sub> x<sub>j</sub> ≤ 1    (örn. oda–dönem başına en çok 1 ders)
Set partitioning (her eleman tam 1 alt kümede): Σ<sub>j∈J</sub> x<sub>j</sub> = 1    (örn. her ders tam bir oda–dönem)</div>

<h3>3. TSP formülasyonu (MTZ subtour elimination)</h3>
<div class="model">min ΣΣ c<sub>ij</sub> x<sub>ij</sub>      (c<sub>ii</sub> = M)
Σ<sub>i</sub> x<sub>ij</sub> = 1 ∀j  (her şehre bir kez gelir)      Σ<sub>j</sub> x<sub>ij</sub> = 1 ∀i  (her şehirden bir kez çıkar)
u<sub>i</sub> − u<sub>j</sub> + N x<sub>ij</sub> ≤ N − 1     i ≠ j;  i, j &gt; 1  (city 1 hariç)
x<sub>ij</sub> = 0 or 1,   u<sub>i</sub> ≥ 0</div>
<ul>
  <li>Subtour içeren her x<sub>ij</sub> kümesi infeasible, tour olan feasible. Örn. N=5, subtour 3-4-3: 5(x<sub>34</sub> + x<sub>43</sub>) ≤ 8 ⇒ x<sub>34</sub> = x<sub>43</sub> = 1 olamaz.</li>
  <li>Büyük TSP'de IP formülasyonu hantaldır ⇒ heuristic kullanılır.</li>
</ul>

<h3>4. Piecewise linear functions</h3>
<p>Break points b<sub>1</sub>, …, b<sub>n</sub>: f(x) yerine Σ z<sub>i</sub> f(b<sub>i</sub>) yaz ve ekle:</p>
<div class="model">x = Σ z<sub>i</sub> b<sub>i</sub>;   Σ z<sub>i</sub> = 1;   Σ y<sub>i</sub> = 1   (i = 1..n−1)
z<sub>1</sub> ≤ y<sub>1</sub>,  z<sub>2</sub> ≤ y<sub>1</sub> + y<sub>2</sub>, …,  z<sub>n−1</sub> ≤ y<sub>n−2</sub> + y<sub>n−1</sub>,  z<sub>n</sub> ≤ y<sub>n−1</sub>
y<sub>i</sub> = 0 or 1 (n−1 adet),  z<sub>i</sub> ≥ 0 (n adet)</div>
<ul>
  <li>y<sub>i</sub> = 1 ise yalnızca z<sub>i</sub> ve z<sub>i+1</sub> pozitif olabilir (bitişik iki break point). Euing: 4 break point (0, 500, 1000, 1500) ⇒ 3 adet y, 4 adet z. x = 800 ⇒ y<sub>2</sub> = 1, z<sub>2</sub> = 2/5, z<sub>3</sub> = 3/5.</li>
  <li><b>Kestirme (Dorian Auto):</b> eğim karar verici için <b>giderek daha az favorable</b> ise (azalan getiri) segment değişkenleri + üst sınırlar yeter (x<sub>1</sub> ≤ 6, x<sub>2</sub> ≤ 4, …), 0-1 değişken gerekmez. Eğim <b>iyileşiyorsa</b> bu formülasyon yanlış sonuç verir (Example 13) ⇒ z/y formülasyonu gerekir.</li>
</ul>

<h3>5. Branch &amp; Bound kuralları (max problem; min için ayna)</h3>
<ul>
  <li><b>Bound:</b> her node'da LR çözülür. Max'ta z<sub>LR</sub> = node için upper bound. <b>LB</b> = en iyi bilinen integer-feasible (candidate) z.</li>
  <li><b>Branching:</b> fractional değeri i ile i+1 arasında olan bir x<sub>i</sub> seç: <b>x<sub>i</sub> ≥ i+1</b> ve <b>x<sub>i</sub> ≤ i</b> (örn. 15/4 ⇒ x<sub>1</sub> ≥ 4 / x<sub>1</sub> ≤ 3). Seçim keyfidir.</li>
  <li><b>Fathomed</b> (inactive; dallanmaya gerek yok):
    <table>
      <tr><th>Neden</th><th>Max</th><th>Min (ayna)</th></tr>
      <tr><td>(1) Infeasible</td><td colspan="2">Subproblem infeasible</td></tr>
      <tr><td>(2) Integer</td><td colspan="2">Tüm (integer olması gereken) değişkenler integer ⇒ candidate; z iyiyse LB güncellenir</td></tr>
      <tr><td>(3) Bound</td><td><b>z ≤ LB</b></td><td><b>z ≥ UB</b> (UB = en iyi integer z)</td></tr>
    </table></li>
  <li><b>Node seçimi:</b> <b>Backtracking (LIFO)</b>: en son yaratılan subproblem'i çöz; ağacın bir tarafında aşağı in, candidate bulunca diğer tarafa dön. <b>Jumptracking</b>: dallanınca oluşan tüm subproblem'leri çöz, sonra <b>en iyi z</b>'ye sahip node'dan dallan (ağacın iki tarafı arasında zıplar).</li>
  <li>Ağaç: subproblem = node, eklenen kısıt = arc. Çözüm: aktif node kalmayınca LB'yi veren candidate optimal'dir.</li>
</ul>
<table>
  <tr><th>Tip</th><th>Özellik</th></tr>
  <tr><td><b>Pure</b></td><td>Her fractional x<sub>i</sub> üzerinde dallanılabilir. Örnek 5: LR z = 165/4 (x = 15/4, 9/4), optimal z = 40 (x = 5, 0)</td></tr>
  <tr><td><b>Mixed</b></td><td>Yalnızca <b>integer olması gereken</b> değişkenlerde dallan; candidate için yalnızca onların integer olması yeter. Örnek 6: x<sub>2</sub> fractional kalabilir, optimal z = 7/2</td></tr>
  <tr><td><b>Binary</b></td><td>Dallanma x<sub>i</sub> = 0 ve x<sub>i</sub> = 1. Örnek 7: 16 çözüm yerine 7 LP, optimal z = 0.6 (x<sub>3</sub> = x<sub>4</sub> = 1)</td></tr>
  <tr><td><b>Knapsack</b></td><td>Binary + LR <b>inspection</b> ile çözülür: r<sub>i</sub> = c<sub>i</sub>/a<sub>i</sub> büyükten küçüğe doldur, sığmayan ilk ürünün kesirli kısmı konur. Örnek 8: r = 1.6, 1.57, 1.5, 1.33; LR z = 22; optimal z = 21 (x<sub>2</sub> = x<sub>3</sub> = x<sub>4</sub> = 1). Önce sabitlenen (x<sub>i</sub> = 1) ürünler kapasiteden düşülür, x<sub>i</sub> = 0 olanlar listeden çıkar</td></tr>
</table>

<h3>6. Combinatorial B&amp;B: scheduling ve TSP</h3>
<ul>
  <li><b>Single machine scheduling:</b> n job, her biri için processing time ve due date; preemption yok; amaç, scheduling cost'u (örn. toplam delay) minimize eden sıra. B&amp;B node'u kısmi sıradır: sabitlenen job'ların delay'i + kalan job'lar için optimistik (lower) bound. Bound ≥ en iyi tam sıranın değeri ise fathom (min problem). Tam sıra = candidate. <small>(Notlar ayrıntıyı yalnızca Winston 9.6'ya havale eder; Example 9 notlarda çözülmemiştir.)</small></li>
  <li><b>TSP B&amp;B (assignment relaxation):</b>
    <ol>
      <li>Subp.1: c<sub>ii</sub> = M ile <b>assignment problem</b> (Hungarian). Subtour kısıtı yoktur ⇒ TSP'nin relaxation'ı.</li>
      <li>Çözüm tek bir tour ise TSP için optimal. Değilse bir subtour seç, örn. 3-4-3.</li>
      <li><b>Subtour branching:</b> subtour'daki her arc için bir subproblem: Subp.2: x<sub>34</sub> = 0 (c<sub>34</sub> = M), Subp.3: x<sub>43</sub> = 0 (c<sub>43</sub> = M). Seçilen subtour tekrar edemez.</li>
      <li>Fathom (min): tour bulundu (candidate, bound = tour uzunluğu); z ≥ en iyi tour; infeasible. Subtour'lu ama z &lt; en iyi tour ise yeniden dallan (LIFO).</li>
    </ol>
    Joe State (Example 10): subp.1 z = 495 (1-5-2-1 ve 3-4-3), subp.2 z = 652, subp.4 tour z = 668 (1-5-2-4-3-1) = optimal, subp.5 z = 704 elenir, subp.3 z = 652 &lt; 668 olduğu için dallanır, subp.6 ve subp.7 ≥ 668.</li>
</ul>

<h3>7. TSP heuristic'leri (special purpose, optimalite garantisi yok)</h3>
<table>
  <tr><th>Nearest-Neighbor (NNH)</th><th>Cheapest-Insertion (CIH)</th></tr>
  <tr><td><ol>
    <li>Herhangi bir şehirden başla, en yakın şehre git.</li>
    <li>Son ziyaret edilen şehre en yakın <b>ziyaret edilmemiş</b> şehre git.</li>
    <li>Tour tamamlanana kadar sürdür (son şehirden başlangıca dön).</li>
    <li>Her şehirden başla, turları ev şehrinden başlayacak şekilde yaz, <b>en iyisini</b> öner.</li>
  </ol></td><td><ol>
    <li>Herhangi bir şehirden başla, en yakın komşusunu bul.</li>
    <li>İkisini birleştiren subtour kur (i→j→i).</li>
    <li>Subtour'daki arc (i, j) yerine, subtour dışındaki k için (i, k) + (k, j) koy; <b>uzunluğu en az artıran</b> (k, arc) seçilir: c<sub>ik</sub> + c<sub>kj</sub> − c<sub>ij</sub> minimum.</li>
    <li>Tour olana kadar sürdür; her şehirden başla, <b>en iyisini</b> öner.</li>
  </ol></td></tr>
</table>
<div class="tip">Joe State: NNH şehir 1'den 668 (1-5-2-4-3-1), 2'den 704, 3'ten 704, 4'ten 668, 5'ten 807; en iyi 668 (optimal). CIH de aynı tourda sonuçlanır (1-3-4-2-5-1), ama genel olarak ikisi de optimal'i garanti etmez.</div>

<h3>8. Implicit enumeration (0-1 IP)</h3>
<ul>
  <li>Binary değişkenlerle B&amp;B'yi hem dallanma hem bounding açısından basitleştirir; ağaç 0-1 knapsack ağacına benzer.</li>
  <li><b>Fixed variables</b>: node'da değeri belirlenmiş; <b>free variables</b>: belirsiz. Free değişkenlere değer atamaya <b>completion</b> denir.</li>
  <li>Üç fikir: (1) node için kolay bir <b>feasible completion</b> bul; (2) en iyi completion feasible olmasa bile node için <b>bound</b> verir ⇒ node elenebilir; (3) node'un <b>tüm completion'ları infeasible</b> mi? Her kısıtta free değişkene o kısıtı en iyi sağlayan değeri ver, hâlâ sağlanmıyorsa node infeasible.</li>
</ul>

<h3>9. Sınıflandırma (2.1) ve sık düşülen tuzaklar</h3>
<ul>
  <li>IP için LP'deki gibi genel amaçlı ve etkili algoritma yoktur. B&amp;B = en etkili <b>general purpose optimal</b> yöntem (Land &amp; Doig, 1960'lar). General purpose heuristic = optimal algoritmayı süre sonunda durdurmak. NNH/CIH = special purpose heuristic.</li>
</ul>
<div class="warnbox"><b>Tuzaklar:</b> binary LR'de x ≤ 1'i unutmak · max'ta fathom koşulu <b>z ≤ LB</b> (eşitlik dahil), min'de <b>z ≥ UB</b>; yönü karıştırmak · mixed IP'de continuous değişkene dallanmak · M'yi gereksiz büyük seçmek ya da çok küçük seçip feasible bölgeyi kesmek · TSP'de subtour'u kırarken yalnızca tek arc'ı yasaklamak (her arc için ayrı subproblem gerekir) · LIFO ile jumptracking'i karıştırmak.</div>
`;
})();
