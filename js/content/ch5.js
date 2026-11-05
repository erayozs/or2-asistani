/* Chapter 5 · Introduction to Interior Point Methods — summary, concept questions, cheatsheet section.
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes pp. 80–82. The affine-scaling formulas are images in the notes and the worked answer of
   Example 5.1 (Frannie's Firewood) is referred to a web page; the iteration shown below was computed with exact fractions
   using the standard affine-scaling formulas (D = diag(x), Ã = AD, c̃ = Dc, P = I − Ãᵀ(ÃÃᵀ)⁻¹Ã, c_p = Pc̃,
   x̃ = 1 + (α/v)c_p, x = Dx̃, α = 0.8) and is labeled as such. */
(function () {
  const OR = window.OR;

  OR.content.summaries['5.0'] = `
<h2>5. Introduction to Interior Point Methods (IPM)</h2>
<p>Interior Point Methods de LP için <b>improving search</b> paradigmasını izler, ama simplex'ten çok farklı hamleler yapar: <b>hamle (iteration) başına çok daha fazla hesap</b> gerekir, buna karşılık <b>hamle sayısı dramatik biçimde azalır</b>.</p>

<h3>Simplex vs IPM</h3>
<table>
  <tr><th></th><th>Simplex</th><th>Interior Point</th></tr>
  <tr><td>Zaman karmaşıklığı</td><td><b>Exponential</b>: boyutu n olan LP en çok <b>a·2<sup>n</sup></b> sürede (a &gt; 0)</td><td><b>Polynomial</b>: en çok <b>b·n<sup>c</sup></b> sürede (b, c &gt; 0)</td></tr>
  <tr><td>Yol</td><td>Feasible bölgenin <b>sınırında</b>, extreme point'ten extreme point'e</td><td>Doğrudan <b>iç bölgeden</b> (interior) geçer; sınıra yalnızca optimal çözümde yaklaşır (converge)</td></tr>
  <tr><td>Hamle başına iş</td><td>Az (bir pivot)</td><td>Çok (projeksiyon, matris tersi)</td></tr>
  <tr><td>Hamle sayısı</td><td>Çok olabilir</td><td>Az</td></tr>
</table>
<p><b>Popüler yöntemler:</b> Karmarkar's Projective Transformation · Affine Scaling · Log Barrier.</p>

<h3>Standart form ve interior point</h3>
<div class="model">max cx
s.t. Ax = b
     x ≥ 0</div>
<p>Standart formdaki bir feasible çözüm, <b>herhangi bir feasible çözümde pozitif olabilen her bileşeni kesinlikle pozitif (&gt; 0)</b> ise bir <b>interior point</b>'tir.</p>

<h3>Projeksiyon (eşitlik kısıtlarını korumak)</h3>
<ul>
  <li>Bir Δx hamle yönü Ax = b için <b>feasible</b>'dır ⇔ <b>AΔx = 0</b>.</li>
  <li>Bir d vektörünün projeksiyonu: kısıtları koruyan ve bileşenleriyle d'ninkiler arasındaki <b>toplam kare farkı minimize eden</b> yön.</li>
  <li><b>Δx = Pd</b>, projection matrix <b>P = I − A<sup>T</sup>(AA<sup>T</sup>)<sup>−1</sup>A</b>.</li>
  <li>Max problemde <b>Δx = Pc</b>, min problemde <b>Δx = −Pc</b> (c ≠ 0 projeksiyonu) her x'te <b>improving direction</b>'dır.</li>
</ul>
<p>Küçük örnek (notlarda yok): A = [1 1 1] (x<sub>1</sub> + x<sub>2</sub> + x<sub>3</sub> = b), d = (3, 0, 0). AA<sup>T</sup> = 3, Ad = 3 → Pd = d − A<sup>T</sup>·(3/3) = (2, −1, −1); bileşenler toplamı 0, yani AΔx = 0 ✓.</p>

<h3>Affine Scaling yaklaşımı</h3>
<ol>
  <li>Mevcut interior çözüm x' = (x<sub>1</sub>', x<sub>2</sub>', x<sub>3</sub>'); <b>D = diag(x<sub>1</sub>', x<sub>2</sub>', x<sub>3</sub>')</b>.</li>
  <li>Yeniden ölçekle: x̃ = D<sup>−1</sup>x → mevcut nokta <b>(1, 1, 1)</b> olur (<b>centering scheme</b>): her sınıra eşit uzaklık.</li>
  <li>Yeni koordinatlarda Ã = AD, c̃ = Dc; projection matrix P = I − Ã<sup>T</sup>(ÃÃ<sup>T</sup>)<sup>−1</sup>Ã; projected gradient <b>c<sub>p</sub> = Pc̃</b>.</li>
  <li>Güncelle: <b>x̃<sub>new</sub> = (1, 1, 1)<sup>T</sup> + (α/v)·c<sub>p</sub></b>; v = c<sub>p</sub>'nin <b>en büyük mutlak değerli negatif bileşeninin mutlak değeri</b>, α = <b>0.8</b> (keyfi seçilmiş).</li>
  <li>Orijinal koordinatlara dön: <b>x<sub>new</sub> = D·x̃<sub>new</sub></b>. Çözüm değeri artık pek değişmiyorsa dur.</li>
</ol>
<p class="note">(Formüller notlarda görsel olarak verilmiştir; burada standart affine scaling yazımıyla yazıldı.)</p>
<div class="box"><b>α'nın rolü:</b> α, feasible bölgeden çıkmadan gidilebilecek mesafenin <b>kullanılan kesridir</b>. 1'e yakın α bu iterasyonda optimale doğru büyük adım verir; ama 1'e <b>çok</b> yakınsa yeni deneme noktası bir kısıt sınırına sıkışır ve sonraki iterasyonlarda büyük iyileştirici adımlar atmak zorlaşır.</div>

<h3>Örnek 5.1 · Frannie's Firewood (Rardin 6.1)</h3>
<div class="model">max 90x<sub>1</sub> + 150x<sub>2</sub>
s.t. 0.5x<sub>1</sub> + x<sub>2</sub> + s<sub>1</sub> = 3,   x<sub>1</sub>, x<sub>2</sub>, s<sub>1</sub> ≥ 0
x<sup>(0)</sup> = (1, 0.5, 2)<sup>T</sup></div>
<p>Notlar cevabı web sayfasına bırakır; aşağıdaki ilk iterasyon yukarıdaki formüllerle tam kesirlerle hesaplanmıştır (notlarda yok):</p>
<table>
  <tr><th>Adım</th><th>Değer</th></tr>
  <tr><td>D</td><td>diag(1, 0.5, 2) (x<sup>(0)</sup> interior: hepsi &gt; 0 ve 0.5 + 0.5 + 2 = 3)</td></tr>
  <tr><td>Ã = AD, c̃ = Dc</td><td>Ã = [0.5 0.5 2], c̃ = (90, 75, 0)</td></tr>
  <tr><td>ÃÃ<sup>T</sup>, Ãc̃</td><td>0.25 + 0.25 + 4 = 4.5; 45 + 37.5 = 82.5 → oran 82.5/4.5 = 55/3</td></tr>
  <tr><td>c<sub>p</sub> = c̃ − Ã<sup>T</sup>(55/3)</td><td>(485/6, 395/6, −110/3) ≈ (80.83, 65.83, −36.67)</td></tr>
  <tr><td>v, α</td><td>v = 110/3 ≈ 36.67, α = 0.8 → α/v = 6/275</td></tr>
  <tr><td>x̃<sub>new</sub> = 1 + (α/v)c<sub>p</sub></td><td>(152/55, 134/55, 0.2) ≈ (2.764, 2.436, 0.2)</td></tr>
  <tr><td>x<sup>(1)</sup> = Dx̃<sub>new</sub></td><td>(152/55, 67/55, 0.4) ≈ (2.764, 1.218, 0.4); kontrol 0.5·2.764 + 1.218 + 0.4 = 3 ✓</td></tr>
</table>
<p>Amaç değeri 165 → 431.5; sonraki iterasyonlar ≈ 494.3, 526.1, … değerleriyle optimum x* = (6, 0, 0), z* = 540'a yaklaşır (sınıra yalnızca limitte varılır). Slack'in ölçeklenmiş değeri tam 1 − α = 0.2 olur: en negatif bileşen tam olarak α oranında ilerler.</p>
<div class="warnbox"><b>Sınavda dikkat:</b> simplex = exponential (a·2<sup>n</sup>), IPM = polynomial (b·n<sup>c</sup>). Max'ta Pc, min'de −Pc. Feasible yön koşulu AΔx = 0 (Ax = b değil). v, c<sub>p</sub>'nin negatif bileşenlerinden mutlak değeri en büyük olanın mutlak değeridir; α = 0.8. Ölçekleme sonrası mevcut nokta (1, 1, 1)'dir.</div>
`;

  OR.content.concepts['5.0'] = [
    {
      q: `Interior Point Methods (IPM) ile simplex karşılaştırıldığında hangisi doğrudur?`,
      options: [
        `IPM hamle başına daha az hesap yapar ama daha çok hamle gerektirir`,
        `IPM hamle başına çok daha fazla hesap yapar ama hamle sayısı dramatik biçimde azalır`,
        `İkisi de extreme point'ten extreme point'e gider`,
        `IPM improving search paradigmasını kullanmaz`,
      ],
      answer: 1,
      explain: `Notlar: "Much more effort turns out to be required per move (iteration) with IPM but the number of moves decreases dramatically." IPM de improving search'ü izler ama iç bölgeden ilerler.`,
    },
    {
      q: `Boyutu n olan bir LP için simplex ve IPM'nin (en kötü durum) süre sınırları notlara göre nedir?`,
      options: [
        `Simplex en çok a·2<sup>n</sup> (exponential), IPM en çok b·n<sup>c</sup> (polynomial)`,
        `Simplex en çok b·n<sup>c</sup>, IPM en çok a·2<sup>n</sup>`,
        `İkisi de polynomial`,
        `İkisi de exponential`,
      ],
      answer: 0,
      explain: `Notlar: simplex "is an exponential time algorithm … at most a2<sup>n</sup>"; IPM "is a polynomial time algorithm … at most bn<sup>c</sup>".`,
    },
    {
      q: `IPM'nin feasible bölgede izlediği yol hangisidir?`,
      options: [
        `Sınırda kalır ve komşu extreme point'lere geçer`,
        `İç bölgede bir dizi interior feasible çözümden geçer; sınıra yalnızca optimal çözümde yaklaşır`,
        `Infeasible noktalardan başlayıp feasible bölgeye girer`,
        `Rastgele interior noktalar örnekler`,
      ],
      answer: 1,
      explain: `"Instead of staying on the boundary … IPM proceed directly across the interior. IPM begin at and move through a sequence of interior feasible solutions, converging to the boundary of the feasible region only at an optimal solution."`,
    },
    {
      q: `Notlarda listelenen popüler IPM yöntemlerinden biri <b>olmayan</b> hangisidir?`,
      options: [`Karmarkar's Projective Transformation`, `Affine Scaling`, `Log Barrier`, `Golden Section Search`],
      answer: 3,
      keepOrder: true,
      explain: `Notlardaki popüler yöntemler: Karmarkar's Projective Transformation, Affine Scaling, Log Barrier. Golden section search tek değişkenli NLP için bir aralık daraltma yöntemidir (Bölüm 4.5).`,
    },
    {
      q: `Standart formdaki (Ax = b, x ≥ 0) bir feasible çözüm ne zaman <b>interior point</b>'tir?`,
      options: [
        `Ax = b'yi sağladığında`,
        `Herhangi bir feasible çözümde pozitif olabilen her bileşeni kesinlikle pozitif olduğunda`,
        `En az bir bileşeni sıfır olduğunda`,
        `Amaç değeri optimal değerden küçük olduğunda`,
      ],
      answer: 1,
      explain: `Notlar: "A feasible solution for an LP in standard form is an interior point if every component of the solution that can be positive in any feasible solution is strictly positive in the given point." Sıfır bileşenli nokta sınırdadır.`,
    },
    {
      q: `Frannie's Firewood standart formunda (0.5x<sub>1</sub> + x<sub>2</sub> + s<sub>1</sub> = 3) hangi nokta bir <b>interior point</b>'tir?`,
      options: [`(1, 0.5, 2)`, `(4, 1, 0)`, `(6, 0, 0)`, `(2, 2, 0)`],
      answer: 0,
      keepOrder: true,
      explain: `(1, 0.5, 2): 0.5 + 0.5 + 2 = 3 ve tüm bileşenler &gt; 0 → interior (notlardaki x<sup>(0)</sup>). (4, 1, 0) ve (6, 0, 0) feasible ama sıfır bileşenleri var (sınırda); (2, 2, 0) ise 1 + 2 = 3 sağlar ama s<sub>1</sub> = 0 → sınırda.`,
    },
    {
      q: `Bir Δx hamle yönü Ax = b eşitlik kısıtları için ne zaman feasible'dır?`,
      options: [`AΔx = b`, `AΔx = 0`, `Δx ≥ 0`, `A<sup>T</sup>Δx = 0`],
      answer: 1,
      keepOrder: true,
      explain: `A(x + λΔx) = Ax + λAΔx = b olması için AΔx = 0 gerekir. Notlar: "A move direction Δx is feasible for equality constraints Ax = b if it satisfies AΔx = 0."`,
    },
    {
      q: `Bir d yönünü AΔx = 0 koşullarına projekte eden <b>projection matrix</b> hangisidir?`,
      options: [
        `P = A<sup>T</sup>(AA<sup>T</sup>)<sup>−1</sup>A`,
        `P = I − A<sup>T</sup>(AA<sup>T</sup>)<sup>−1</sup>A`,
        `P = I − A(A<sup>T</sup>A)<sup>−1</sup>A<sup>T</sup>`,
        `P = (AA<sup>T</sup>)<sup>−1</sup>`,
      ],
      answer: 1,
      explain: `Δx = Pd, P = I − A<sup>T</sup>(AA<sup>T</sup>)<sup>−1</sup>A. Kontrol: AP = A − AA<sup>T</sup>(AA<sup>T</sup>)<sup>−1</sup>A = 0, yani APd = 0. İlk seçenek d'nin satır uzayındaki bileşenini verir (tam tersi).`,
    },
    {
      q: `Min problemi için hangi yön her x'te bir improving direction'dır (c ≠ 0 projeksiyonu)?`,
      options: [`Δx = Pc`, `Δx = −Pc`, `Δx = c`, `Δx = −c`],
      answer: 1,
      keepOrder: true,
      explain: `Notlar: max problemlerde Δx = Pc, min problemlerde Δx = −Pc improving direction'dır. Projekte edilmemiş c (veya −c) genellikle AΔx = 0'ı sağlamaz, eşitlik kısıtlarını bozar.`,
    },
    {
      q: `A = [1 1 1] ve d = (3, 0, 0) için projekte edilmiş yön Pd nedir?`,
      options: [`(2, −1, −1)`, `(3, 0, 0)`, `(1, 1, 1)`, `(1, −1, 0)`],
      answer: 0,
      explain: `AA<sup>T</sup> = 3, Ad = 3 → Pd = d − A<sup>T</sup>(3/3) = (3, 0, 0) − (1, 1, 1) = (2, −1, −1). Bileşenler toplamı 0 → AΔx = 0 ✓. (Örnek notlarda yok; formül notlardaki P'dir.)`,
    },
    {
      q: `Affine scaling'de x̃<sub>new</sub> = 1 + (α/v)c<sub>p</sub> güncellemesinde v nedir ve notlarda α kaç seçilir?`,
      options: [
        `v = c<sub>p</sub>'nin en büyük pozitif bileşeni; α = 1`,
        `v = c<sub>p</sub>'nin en büyük mutlak değerli negatif bileşeninin mutlak değeri; α = 0.8`,
        `v = ||c<sub>p</sub>||; α = 0.5`,
        `v = amaç değeri; α = 0.8`,
      ],
      answer: 1,
      explain: `Notlar: "v is the absolute value of the negative component of c<sub>p</sub> having largest absolute value and α is arbitrarily chosen as 0.8". Böylece o bileşen 1'den 1 − α = 0.2'ye iner, sıfıra (sınıra) değmez.`,
    },
    {
      q: `Affine scaling'de α'yı 1'e <b>çok</b> yakın seçmenin sakıncası nedir?`,
      options: [
        `Çözüm infeasible olur`,
        `Yeni deneme noktası bir kısıt sınırına sıkışır ve sonraki iterasyonlarda büyük iyileştirici adımlar atmak zorlaşır`,
        `Algoritma exponential zamanlı olur`,
        `Projection matrix tanımsız olur`,
      ],
      answer: 1,
      explain: `Notlar: 1'e yakın α bu iterasyonda büyük adım sağlar, "however, the problem with a value too close to 1 is that the next trial solution then is jammed against a constraint boundary, thereby making it difficult to take large improving steps during subsequent iterations."`,
    },
    {
      q: `Affine scaling'de D = diag(x') ile yeniden ölçeklemenin (x̃ = D<sup>−1</sup>x) amacı nedir?`,
      options: [
        `Mevcut noktayı (1, 1, …, 1)'e taşıyıp tüm sınırlara eşit uzaklıkta merkezlemek (centering scheme)`,
        `Amaç fonksiyonunu sıfırlamak`,
        `Kısıt sayısını azaltmak`,
        `Değişkenleri integer yapmak`,
      ],
      answer: 0,
      explain: `x̃ = D<sup>−1</sup>x' = (1, 1, 1): "Centering scheme (1, 1, 1)". Merkezlenmiş noktadan projekte gradyan yönünde, sınıra çarpmadan büyük bir adım atılabilir; sonra x = Dx̃ ile orijinal koordinatlara dönülür.`,
    },
  ];

  OR.content.cheatsheet += `
<section>
<h3>Ch.5 Interior Point Methods</h3>
<table>
  <tr><th>Kavram</th><th>Formül / kural</th></tr>
  <tr><td><b>Simplex vs IPM</b></td><td>Simplex: sınırda, extreme point → extreme point, exponential (a·2<sup>n</sup>). IPM: iç bölgeden, polynomial (b·n<sup>c</sup>); iterasyon başına çok iş, az iterasyon</td></tr>
  <tr><td><b>Yöntemler</b></td><td>Karmarkar's Projective Transformation · Affine Scaling · Log Barrier</td></tr>
  <tr><td><b>Interior point</b></td><td>max cx, Ax = b, x ≥ 0; pozitif olabilen her bileşen &gt; 0</td></tr>
  <tr><td><b>Projeksiyon</b></td><td>Feasible yön: AΔx = 0. Δx = Pd, P = I − A<sup>T</sup>(AA<sup>T</sup>)<sup>−1</sup>A. Max: Pc, min: −Pc</td></tr>
  <tr><td><b>Affine scaling</b></td><td>D = diag(x'), Ã = AD, c̃ = Dc, c<sub>p</sub> = Pc̃ (P, Ã ile); x̃ = 1 + (α/v)c<sub>p</sub>, v = |en negatif c<sub>p</sub> bileşeni|, α = 0.8; x = Dx̃. Değer pek değişmeyince dur</td></tr>
  <tr><td><b>Frannie (x<sup>(0)</sup> = (1, 0.5, 2))</b></td><td>c<sub>p</sub> = (485/6, 395/6, −110/3), x<sup>(1)</sup> ≈ (2.764, 1.218, 0.4), z: 165 → 431.5 (optimum (6, 0, 0), 540)</td></tr>
</table>
</section>
`;
})();
