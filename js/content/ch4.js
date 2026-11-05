/* Chapter 4 (Introduction to Nonlinear Programming) learning content: summaries + concept questions (NO drills).
   Classic script (no ES modules). Attaches to window.OR.content.
   Source: Topcu & Kabak lecture notes, Ch.4 (notes pages 55–79). Topics: 4.1 Graphical analysis, 4.2 Formulating NLP (+4.8 NLP on a PC),
   4.3 Differential calculus, 4.4 Convexity, 4.5 One-variable NLP & Golden Section Search, 4.6 Unconstrained NLP,
   4.7.1 Lagrange multipliers, 4.7.2 KKT conditions.
   Every numeric answer was recomputed by a throwaway node script (GSS table of Ex 4.17, Newton step of Ex 4.22, gradient steps, KKT cases, Lagrange sensitivity).
   Formulas that are images in the PDF (Taylor, Hessian entries, Newton formula) are given in the standard form; anything not in the notes is labeled "notlarda yok". */
(function () {
  const OR = window.OR;

  // small matrix as a table
  const mat = (rows) =>
    '<table class="mtx">' + rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</table>';

  // Graphical-analysis picture for Example 4.1 / 4.2 (feasible region = disk ∩ 2≤x≤13 ∩ x+y≤24)
  const svgEx = (id, P, O, rad, labP, labO) => {
    const X = (x) => 24 + 14 * x;
    const Y = (y) => 272 - 14 * y;
    let g = '';
    for (let t = 0; t <= 18; t += 2) {
      g += `<line x1="${X(t)}" y1="${Y(0)}" x2="${X(t)}" y2="${Y(0) + 4}" stroke="#888"/><text x="${X(t)}" y="${Y(0) + 15}" font-size="9" text-anchor="middle" fill="#888">${t}</text>`;
      g += `<line x1="${X(0)}" y1="${Y(t)}" x2="${X(0) - 4}" y2="${Y(t)}" stroke="#888"/><text x="${X(0) - 7}" y="${Y(t) + 3}" font-size="9" text-anchor="end" fill="#888">${t}</text>`;
    }
    const poly = [[2, 0], [2, 22], [13, 11], [13, 0]].map((p) => X(p[0]) + ',' + Y(p[1])).join(' ');
    return `<svg viewBox="0 0 300 296" style="max-width:340px;width:100%;display:block;margin:8px auto" role="img" aria-label="Graphical analysis">
<defs><clipPath id="clip${id}"><circle cx="${X(8)}" cy="${Y(9)}" r="98"/></clipPath></defs>
<line x1="${X(0)}" y1="${Y(0)}" x2="${X(19)}" y2="${Y(0)}" stroke="#888"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(19)}" stroke="#888"/>${g}
<polygon points="${poly}" clip-path="url(#clip${id})" fill="#4f8cff" fill-opacity="0.22"/>
<circle cx="${X(8)}" cy="${Y(9)}" r="98" fill="none" stroke="#4f8cff" stroke-width="1.5"/>
<line x1="${X(2)}" y1="${Y(0)}" x2="${X(2)}" y2="${Y(19)}" stroke="#4f8cff" stroke-dasharray="4 3"/>
<line x1="${X(13)}" y1="${Y(0)}" x2="${X(13)}" y2="${Y(19)}" stroke="#4f8cff" stroke-dasharray="4 3"/>
<line x1="${X(5)}" y1="${Y(19)}" x2="${X(19)}" y2="${Y(5)}" stroke="#4f8cff" stroke-dasharray="4 3"/>
<text x="${X(14.2)}" y="${Y(8.6)}" font-size="9" fill="#4f8cff">x+y=24</text>
${rad > 0 ? `<circle cx="${X(P[0])}" cy="${Y(P[1])}" r="${rad * 14}" fill="none" stroke="#e0803a" stroke-dasharray="3 3"/>` : ''}
<circle cx="${X(P[0])}" cy="${Y(P[1])}" r="3.5" fill="#d33"/><text x="${X(P[0]) + 6}" y="${Y(P[1]) - 5}" font-size="10" fill="#d33">${labP}</text>
<circle cx="${X(O[0])}" cy="${Y(O[1])}" r="4" fill="#1a9a50"/><text x="${X(O[0]) + 7}" y="${Y(O[1]) + 12}" font-size="10" fill="#1a9a50">${labO}</text>
</svg>`;
  };

  /* ====================================================================== 4.1 */
  OR.content.summaries['4.1'] = `
<h2>4. Introduction to Nonlinear Programming · 4.1 Graphical Analysis</h2>
<h3>Nonlinear program (NLP) nedir?</h3>
<p>Bir matematiksel programlama modelinde <b>amaç fonksiyonu ve/veya herhangi bir kısıt doğrusal değilse</b> model <b>NLP</b>'dir. Genel form (notlardaki gösterim):</p>
<div class="model">max (veya min) z = f(x<sub>1</sub>, x<sub>2</sub>, …, x<sub>n</sub>)
s.t.  g<sub>i</sub>(x<sub>1</sub>, …, x<sub>n</sub>)  (≤, =, veya ≥)  b<sub>i</sub>      i = 1, 2, …, m</div>
<ul>
  <li><b>LP, NLP'nin özel bir halidir</b> (f ve tüm g<sub>i</sub> doğrusal ise).</li>
  <li>f = NLP'nin <b>objective function</b>'ı; g<sub>i</sub> (≤, =, ≥) b<sub>i</sub> = <b>constraints</b>. Kısıtı olmayan NLP = <b>unconstrained NLP</b>.</li>
  <li><b>Feasible region</b> = m kısıtın hepsini sağlayan (x<sub>1</sub>, …, x<sub>n</sub>) noktaları kümesi.</li>
  <li>Max problemde feasible bölgedeki her x için f(x*) ≥ f(x) ise x* <b>optimal solution</b>'dır; min problemde f(x*) ≤ f(x).</li>
  <li>x feasible olsun. Her feasible x' için ("x'e yeterince yakın", yani her j için x<sub>j</sub> − ε &lt; x<sub>j</sub>' &lt; x<sub>j</sub> + ε) f(x) ≥ f(x') ise x bir <b>local maximum</b>'dur. Local max veya local min'e <b>local extremum</b> (relative extremum) denir.</li>
</ul>
<div class="box"><b>LP'den temel fark:</b> Feasible bölge convex olsa bile NLP'nin optimal çözümü bölgenin <b>extreme point'i (köşesi) olmak zorunda değildir</b>. Optimum <i>isocontour</i>'un (f'nin eş-değer eğrisi) feasible bölgeye <b>ilk değdiği</b> nokta olabilir ve bu nokta sınırın ortasında ya da bölgenin <b>içinde</b> bulunabilir. Ayrıca birden fazla <b>local optimum</b> olabilir.</div>
<p>Notlardaki şekil: <code>max f(x) s.t. 0 ≤ x ≤ 1</code>. Eğri üzerinde <b>A, B, C</b> üç local maximum'dur; fakat yalnızca <b>C</b> en büyük f değerine sahiptir, yani <b>global maximum (unique optimal solution)</b>. A ve B local olarak optimaldir ama global değildir.</p>

<h3>Graphical analysis (iki değişkenli NLP)</h3>
<p>LP'deki gibi iki karar değişkenli NLP grafikle çözülebilir: (1) feasible bölgeyi çiz, (2) amaç fonksiyonunun <b>isocontour</b>'larını çiz, (3) iyileşme yönünde isocontour'u kaydır, bölgeyi <b>son</b> (max için en uzak, min için en yakın) kez değdiği noktayı oku. Notlar uyarır: amaç fonksiyonu karmaşıksa her NLP bu şekilde analiz edilemeyebilir.</p>

<h3>Example 4.1</h3>
<div class="model">min  [(x − 14)² + (y − 15)²]<sup>1/2</sup>
s.t. (x − 8)² + (y − 9)² ≤ 49
     x ≥ 2,  x ≤ 13,  x + y ≤ 24</div>
<ol>
  <li><b>Feasible bölge:</b> merkezi (8, 9), yarıçapı 7 olan <b>disk</b>; 2 ≤ x ≤ 13 şeridi; x + y ≤ 24 yarı-düzlemi. (Hepsi convex küme, kesişimi convex.)</li>
  <li><b>Amaç:</b> bölgenin (14, 15) noktasına olan uzaklığını minimize etmek. Isocontour'lar (14, 15) merkezli <b>çemberlerdir</b>; min için çemberi küçültüp bölgeye ilk değdiği noktayı ararız.</li>
  <li>(14, 15) feasible değil: 14 + 15 = 29 &gt; 24. Bölgeye en yakın nokta x + y = 24 doğrusu üzerindedir: (14, 15)'ten doğruya dik inersek <b>(11.5, 12.5)</b> (iki koordinattan 2.5 çıkarıyoruz).</li>
  <li>Kontrol: 11.5 + 12.5 = 24 ✓; x = 11.5 ∈ [2, 13] ✓; (11.5 − 8)² + (12.5 − 9)² = 12.25 + 12.25 = 24.5 ≤ 49 ✓ (disk içinde).</li>
  <li><b>Optimum: (x, y) = (11.5, 12.5)</b>, z* = √(2.5² + 2.5²) = 2.5√2 ≈ <b>3.54</b>.</li>
</ol>
${svgEx('a', [14, 15], [11.5, 12.5], 3.5355, '(14,15)', '(11.5, 12.5)')}
<p>Notların yorumu: <b>optimal çözüm bir corner point değildir</b>; isocontour'un feasible bölgeye ilk değdiği yerdedir (sınır doğrusunun ortasında).</p>

<h3>Example 4.2</h3>
<div class="model">min  [(x − 8)² + (y − 8)²]<sup>1/2</sup>
s.t. aynı kısıtlar: (x − 8)² + (y − 9)² ≤ 49,  2 ≤ x ≤ 13,  x + y ≤ 24</div>
<ol>
  <li>Amaç: bölgenin <b>(8, 8)</b> noktasına uzaklığı. Eğer (8, 8) feasible ise z = 0 ve o noktadan iyisi olamaz (uzaklık ≥ 0).</li>
  <li>Kontrol: (8 − 8)² + (8 − 9)² = 1 ≤ 49 ✓; 2 ≤ 8 ≤ 13 ✓; 8 + 8 = 16 ≤ 24 ✓. Yani (8, 8) <b>feasible bölgenin içindedir</b>.</li>
  <li><b>Optimum: (8, 8), z* = 0.</b> Notlar: <i>"The optimal solution is not on the boundary of the feasible region. It is inside the feasible region."</i></li>
</ol>
${svgEx('b', [8, 8], [8, 8], 0, '', '(8, 8) = optimum')}

<table>
  <tr><th></th><th>LP</th><th>NLP</th></tr>
  <tr><td>Optimum nerede?</td><td>(Bounded ise) en az bir extreme point'te</td><td>Köşe, sınırın ortası ya da <b>iç nokta</b> olabilir</td></tr>
  <tr><td>Local optimum</td><td>Convex yapı: local = global</td><td>Birden fazla local optimum olabilir; local ≠ global</td></tr>
  <tr><td>Feasible bölge</td><td>Her zaman convex</td><td>Doğrusal olmayan kısıtla convex olmayabilir</td></tr>
</table>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li>"NLP'nin optimumu corner point'tedir" <b>yanlıştır</b>; feasible bölge convex olsa bile (notlar). Örnek 4.1: sınır üstünde köşe değil; örnek 4.2: iç nokta.</li>
  <li>Grafikte kısıtları tek tek test edin (nokta hem disk hem x + y ≤ 24 hem x aralığında olmalı). (14, 15) amaç merkezidir ama feasible değildir.</li>
  <li>Local maximum ≠ global maximum: şekildeki A ve B local, yalnızca C global.</li>
</ul></div>
`;

  OR.content.concepts['4.1'] = [
    {
      q: `Notlara göre LP ile NLP arasındaki ilişki hangisidir?`,
      options: [
        `LP, NLP'nin özel bir halidir (f ve tüm g<sub>i</sub> doğrusal olduğunda).`,
        `NLP, LP'nin özel bir halidir.`,
        `Aralarında kapsama ilişkisi yoktur; farklı problem sınıflarıdır.`,
        `NLP'de yalnızca amaç fonksiyonu doğrusal olmayabilir; kısıtlar doğrusal kalır.`,
      ],
      answer: 0,
      explain: `Notlarda "An LP is a special case of nonlinear programming!" denir. NLP'de hem amaç fonksiyonuna hem kısıtlara doğrusal olmayan terimler girebilir ("An NLP is permitted to have non-linear objective and/or constraints"); tüm fonksiyonlar doğrusal olunca LP elde edilir.`,
    },
    {
      q: `Example 4.1: <code>min [(x−14)² + (y−15)²]<sup>1/2</sup></code> s.t. (x−8)² + (y−9)² ≤ 49, 2 ≤ x ≤ 13, x + y ≤ 24. Optimal çözüm hangisidir?`,
      options: [`(11.5, 12.5)`, `(13, 11)`, `(14, 15)`, `(8, 9)`],
      answer: 0,
      hint: `(14, 15) feasible mi? 14 + 15 = 29 ile 24'ü karşılaştırın.`,
      explain: `(14, 15) amaç merkezidir ama 29 &gt; 24 olduğundan feasible değildir. Bölgeye en yakın nokta, (14, 15)'ten x + y = 24 doğrusuna inilen dik ayağı olan <b>(11.5, 12.5)</b>'tir (disk içinde: 12.25 + 12.25 = 24.5 ≤ 49; x aralığında). (13, 11) köşedir ama uzaklığı √(1 + 16) = 4.12 &gt; 3.54; (8, 9) diskin merkezidir, (14, 15)'e 8.49 uzaktadır.`,
    },
    {
      q: `Example 4.1'in optimal amaç değeri (en yakın uzaklık) kaçtır?`,
      options: [`0`, `2.5√2 ≈ 3.54`, `√72 ≈ 8.49`, `7`],
      answer: 1,
      explain: `z* = √((14 − 11.5)² + (15 − 12.5)²) = √(6.25 + 6.25) = 2.5√2 ≈ <b>3.54</b>. √72 ≈ 8.49, (14, 15)'in disk merkezine uzaklığıdır (7 de yarıçaptır); hiçbiri feasible bölgeye olan en kısa uzaklık değildir. z = 0 olması için (14, 15) feasible olmalıydı (değil).`,
    },
    {
      q: `Example 4.2'de amaç merkezi (8, 8)'dir. Optimal çözüm ve değeri nedir?`,
      options: [
        `(8, 8), z* = 0: nokta feasible bölgenin içinde kalır.`,
        `(8, 9), z* = 1: disk merkezi.`,
        `(2, 8), z* = 6: x ≥ 2 sınırı.`,
        `(11.5, 12.5): x + y = 24 doğrusu üzerinde.`,
      ],
      answer: 0,
      explain: `(8, 8) tüm kısıtları sağlar: (0)² + (−1)² = 1 ≤ 49; 2 ≤ 8 ≤ 13; 8 + 8 = 16 ≤ 24. Amaç bir uzaklık (≥ 0) olduğundan z = 0 en iyisidir. Notlar: "The optimal solution is not on the boundary of the feasible region. It is inside the feasible region."`,
    },
    {
      q: `Notlardaki grafik analizlerine (Ex 4.1 ve 4.2) göre aşağıdakilerden hangileri doğrudur?`,
      options: [
        `NLP'nin optimal çözümü feasible bölgenin iç noktası olabilir.`,
        `Feasible bölge convex ise optimal çözüm mutlaka bir extreme point'tir.`,
        `Ex 4.1'de optimum, isocontour'un feasible bölgeye ilk değdiği noktadır ve corner point değildir.`,
        `NLP'nin her local maximum'u aynı zamanda global maximum'dur.`,
      ],
      answer: [0, 2],
      explain: `Ex 4.2'de optimum iç noktadır; Ex 4.1'de sınırın ortasında, köşe olmayan bir noktadır. Notlar açıkça "Even if the feasible region for an NLP is a convex set, the optimal solution need not be an extreme point" der. Birden çok local maximum olabilir (A, B, C şekli), bu yüzden local = global genel olarak yanlıştır.`,
    },
    {
      q: `<code>max f(x) s.t. 0 ≤ x ≤ 1</code> grafiğinde A, B, C üç <b>local maximum</b>'dur ve C en yüksektir. Hangisi doğrudur?`,
      options: [
        `A, B ve C'nin üçü de global maximum'dur.`,
        `C global maximum ve unique optimal solution'dır; A ve B yalnızca local maximum'dur.`,
        `Yalnızca C local maximum'dur.`,
        `Yalnızca A ve B optimaldir.`,
      ],
      answer: 1,
      explain: `Notlar: "A, B, and C are all local maxima, but C is the unique optimal solution (global maximum) to NLP". Local max, yakınındaki feasible noktalardan daha kötü olmayan noktadır; global max ise tüm feasible bölgede en iyi olandır.`,
    },
    {
      q: `Ex 4.1'in amaç fonksiyonu <code>[(x−14)² + (y−15)²]<sup>1/2</sup></code> için <b>isocontour</b>'lar (eş-değer eğrileri) neye benzer?`,
      options: [
        `(14, 15) merkezli eş merkezli çemberler`,
        `Eğimi −1 olan paralel doğrular`,
        `(8, 9) merkezli elipsler`,
        `Eksenlere paralel dikdörtgenler`,
      ],
      answer: 0,
      explain: `f(x, y) = c ⇔ (x − 14)² + (y − 15)² = c², yani yarıçapı c olan, (14, 15) merkezli çemberler. LP'nin isocontour'ları doğrulardır; NLP'de eğri olabilirler ve optimum isocontour'un bölgeye ilk değdiği yerde bulunur.`,
    },
    {
      q: `Ex 4.1'in kısıtlarına göre hangi nokta <b>feasible</b>'dir?`,
      options: [`(10, 12)`, `(13, 12)`, `(1, 9)`, `(8, 17)`],
      answer: 0,
      hint: `Her adayda x + y ≤ 24, 2 ≤ x ≤ 13 ve disk kısıtını kontrol edin.`,
      explain: `(10, 12): 22 ≤ 24 ✓, 2 ≤ 10 ≤ 13 ✓, (2)² + (3)² = 13 ≤ 49 ✓ → feasible. (13, 12): 25 &gt; 24 ✗. (1, 9): x ≥ 2 ihlal ✗. (8, 17): (0)² + (8)² = 64 &gt; 49 (diskin dışında) ✗.`,
    },
  ];

  /* ====================================================================== 4.2 (+ 4.8) */
  OR.content.summaries['4.2'] = `
<h2>4.2 Formulating NLP · 4.8 Solving NLP on a PC</h2>
<p>NLP'ler LP ve IP'lere benzer şekilde formüle edilir: <b>karar değişkenleri tanımlanır, amaç fonksiyonu yazılır, kısıtlar belirtilir</b>. Bazı NLP'lerde hiç kısıt yoktur. Notlara göre en yaygın uygulamalar <b>location problems, portfolio management, regression</b>'dır. "NLP is very general and very hard to solve."</p>

<h3>Example 4.3 – Unconstrained Facility Location</h3>
<p>Düzlemde istenen yere kurulabilecek tek bir depo. A, B, C, D noktaları (8, 2), (3, 10), (8, 15), (14, 13); günlük talepler 19, 7, 2, 5. Maliyet <b>uzaklıkla orantılı</b>. Depo nereye kurulmalı?</p>
<ol>
  <li>Karar değişkenleri: (x, y) = deponun koordinatları.</li>
  <li>Uzaklıklar (Euclidean): d(P, A) = [(x − 8)² + (y − 2)²]<sup>1/2</sup>, d(P, B) = [(x − 3)² + (y − 10)²]<sup>1/2</sup>, d(P, C) = [(x − 8)² + (y − 15)²]<sup>1/2</sup>, d(P, D) = [(x − 14)² + (y − 13)²]<sup>1/2</sup>.</li>
  <li>Amaç: talep ağırlıklı toplam uzaklığı minimize et.</li>
</ol>
<div class="model">min 19[(x−8)² + (y−2)²]<sup>1/2</sup> + 7[(x−3)² + (y−10)²]<sup>1/2</sup> + 2[(x−8)² + (y−15)²]<sup>1/2</sup> + 5[(x−14)² + (y−13)²]<sup>1/2</sup>
s.t. P is unconstrained</div>
<p>Küçük kontrol (bizim hesabımız): P = A = (8, 2) için amaç = 0 + 7·√89 + 2·13 + 5·√157 ≈ 66.04 + 26 + 62.65 = <b>154.69</b>; P = (8, 8) için ≈ 204.75. En büyük talep A'da (19) olduğundan optimum A'ya yakın çıkar.</p>

<h3>Example 4.4 – Constrained Facility Location</h3>
<p>Depo belirli bir bölge içinde olmak zorundaysa <b>amaç aynı kalır</b>, yalnızca kısıtlar eklenir:</p>
<div class="model">min (Ex 4.3'ün amacı)
s.t. x ≥ 7,   5 ≤ y ≤ 11,   x + y ≤ 24</div>

<h3>Example 4.5 – Tire Production (Winston 11.2)</h3>
<p>R, O, C = bir takım (4 lastik) için 100 pound karışımdaki rubber, oil, carbon black miktarları (pound). Maliyetler (cent/pound): 4, 1, 7. İstatistiksel analiz, karışımın sertlik (hardness), esneklik (elasticity) ve çekme dayanımını (tensile strength) <b>doğrusal olmayan</b> fonksiyonlarla verir:</p>
<div class="model">TS = 12.5 − 0.10·O − 0.001·O²
E  = 17 + 0.35·R − 0.04·O − 0.002·R²
H  = 34 + 0.1·R + 0.06·O − 0.3·C + 0.001·R·O + 0.005·O² + 0.001·C²</div>
<p>Gereksinimler: 25 ≤ H ≤ 35, E ≥ 16, TS ≥ 12; karışımdaki rubber 25–60 pound, carbon black ≥ 50 pound, toplam 100 pound. NLP:</p>
<div class="model">min 4R + O + 7C
s.t. TS = 12.5 − .10O − .001O²
     E  = 17 + .35R − .04O − .002R²
     H  = 34 + .1R + .06O − .3C + .001RO + .005O² + .001C²
     R + O + C = 100
     25 ≤ R ≤ 60,  O ≥ 0,  C ≥ 50
     TS ≥ 12,  E ≥ 16,  25 ≤ H ≤ 35</div>
<p>Amaç doğrusaldır, ama TS, E, H tanımları <b>karesel/çarpımsal terimler</b> içerir; bu yüzden model bir NLP'dir. (Notlarda eşitsizlik işaretleri baskıda "&lt;" / "&gt;" görünür; anlam ≤ / ≥'dir.) Örnek: TS ≥ 12 ⇒ 0.1·O + 0.001·O² ≤ 0.5 ⇒ O ≤ ≈ 4.77 (bizim hesabımız).</p>

<h3>Example 4.6 – Engineering Design (Rardin 14.1)</h3>
<p>Kapalı silindirik tank en az 20 ft³ kimyasal taşıyacak. Üst ve yan metal $2/ft², <b>taban</b> (daha ağır metal) $8/ft²; yükseklik çapın en çok 2 katı olmalı.</p>
<ul>
  <li>d = çap, h = yükseklik. Yan alan = πdh, üst alan = taban alanı = πd²/4.</li>
  <li>Maliyet = <b>2(πdh + πd²/4)</b> [üst + yan] + <b>8(πd²/4)</b> [taban].</li>
</ul>
<div class="model">min 2(πdh + πd²/4) + 8(πd²/4)     [metal cost]
s.t. πhd²/4 ≥ 20     [volume]
     h ≤ 2d          [height to diameter ratio]
     h, d ≥ 0</div>
<p>Kontrol (bizim hesabımız): d = 3, h = 3 → hacim 21.2 ≥ 20 ✓, 3 ≤ 6 ✓, maliyet = 40.5π ≈ $127.23.</p>

<h3>0-1 IP'ler NLP olarak</h3>
<div class="model">min Σ<sub>j</sub> c<sub>j</sub> x<sub>j</sub>   s.t. Σ<sub>j</sub> a<sub>ij</sub> x<sub>j</sub> = b<sub>i</sub>,  x<sub>j</sub> ∈ {0, 1}
   "neredeyse eşdeğeri":
min Σ<sub>j</sub> c<sub>j</sub> x<sub>j</sub> + 10<sup>6</sup> Σ<sub>j</sub> x<sub>j</sub>(1 − x<sub>j</sub>)   s.t. Σ<sub>j</sub> a<sub>ij</sub> x<sub>j</sub> = b<sub>i</sub>,  0 ≤ x<sub>j</sub> ≤ 1</div>
<p>x<sub>j</sub>(1 − x<sub>j</sub>) terimi yalnızca x<sub>j</sub> = 0 veya 1 iken sıfırdır; kesirli değerde pozitiftir ve 10<sup>6</sup> ile çarpıldığı için min problem x<sub>j</sub>'leri 0/1'e iter. (Bu ceza terimi concave olduğundan problem convex değildir; notlarda yok, kendi yorumumuz.)</p>

<h3>4.8 Solving NLP on a PC</h3>
<ul>
  <li>NLP'leri <b>LINGO</b> ile çözebiliriz; <b>Excel Solver</b> da kullanılabilir. İkisi de <b>calculus-based</b> yöntemler kullanır.</li>
  <li>Birden fazla local optimum olan NLP'lerde LINGO/Solver <b>global olmayan bir local extremum</b>'a takılıp gerçek optimumu bulamayabilir (başlangıç noktasına bağlıdır).</li>
</ul>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li>Önce karar değişkenlerini tanımlayın; ara büyüklükleri (TS, E, H) ya ayrı değişken + eşitlik kısıtı olarak ya da doğrudan yerine koyarak yazın (notlar eşitlik kısıtı kullanır).</li>
  <li>Tank: taban $8, <b>üst + yan</b> $2. Üstü de $8 yazmak klasik hatadır. Hacim kısıtı ≥ 20 (en az), yükseklik kısıtı h ≤ 2d.</li>
  <li>Ex 4.3'te kısıt yoktur ("P is unconstrained"); Ex 4.4'te yalnızca kısıtlar eklenir.</li>
  <li>PC çözücüsünün bulduğu nokta global optimum olmak zorunda değildir.</li>
</ul></div>
`;

  OR.content.concepts['4.2'] = [
    {
      q: `Notlara göre NLP'nin <b>en yaygın uygulamaları</b> arasında hangileri vardır?`,
      options: [`Location problems`, `Portfolio management`, `Regression`, `Assignment problem (Hungarian method ile)`],
      answer: [0, 1, 2],
      explain: `Notlar: "Most common applications of NLP are location problems, portfolio management, regression…". Assignment problem doğrusal bir modeldir (LP/IP), NLP'nin tipik uygulaması olarak sayılmaz.`,
    },
    {
      q: `Example 4.3'te (tek depo, A=(8,2) talep 19) amaç fonksiyonunda A noktasına ait terim hangisidir?`,
      options: [
        `19·[(x − 8)² + (y − 2)²]<sup>1/2</sup>`,
        `19·[(x − 2)² + (y − 8)²]<sup>1/2</sup>`,
        `[(x − 8)² + (y − 2)²]<sup>1/2</sup> / 19`,
        `19·[(x − 8) + (y − 2)]`,
      ],
      answer: 0,
      explain: `Maliyet uzaklıkla orantılı olduğundan terim = talep × Euclidean uzaklık = 19·d(P, A), d(P, A) = [(x − 8)² + (y − 2)²]<sup>1/2</sup>. Koordinatlar (x, y) ↔ (8, 2) sırasıyla eşleşir; talebe bölmek ya da karekök olmadan doğrusal fark yazmak yanlıştır.`,
    },
    {
      q: `Example 4.3'te depo yerleşimi için verilen <b>kısıtlar</b> nelerdir? Example 4.4'te ne değişir?`,
      options: [
        `Ex 4.3'te kısıt yoktur (unconstrained); Ex 4.4'te amaç aynı kalır, x ≥ 7, 5 ≤ y ≤ 11, x + y ≤ 24 kısıtları eklenir.`,
        `Ex 4.3'te x ≥ 7 vardır; Ex 4.4'te amaç fonksiyonu değişir.`,
        `Her iki örnekte de kısıt yoktur.`,
        `Ex 4.4'te karar değişkenleri 0-1 olur.`,
      ],
      answer: 0,
      explain: `Ex 4.3: "subject to: P is unconstrained". Ex 4.4: "What happens if P must be within a specified region?" → amaç aynı, kısıtlar x ≥ 7, 5 ≤ y ≤ 11, x + y ≤ 24. Karar değişkenleri sürekli (x, y) koordinatlarıdır.`,
    },
    {
      q: `Ex 4.3'ün amaç fonksiyonunun değeri, depo <b>A noktasına (8, 2)</b> kurulursa kaçtır?`,
      options: [`154.69`, `129.00`, `204.75`, `66.04`],
      answer: 0,
      hint: `P = A ise A'ya uzaklık 0'dır. Kalan üç terimi hesaplayın.`,
      explain: `A'ya uzaklık 0 → terim 0. B: 7·√((8−3)² + (2−10)²) = 7·√89 = 66.04. C: 2·√(0 + 13²) = 26. D: 5·√((8−14)² + (2−13)²) = 5·√157 = 62.65. Toplam = 66.04 + 26 + 62.65 = <b>154.69</b>. 204.75 değeri P = (8, 8) içindir; 66.04 yalnızca B teriminin değeridir.`,
    },
    {
      q: `Tire Production (Ex 4.5) modeli neden LP değil de <b>NLP</b>'dir?`,
      options: [
        `TS, E ve H karışım özellikleri O, R, C'nin karesel/çarpımsal (doğrusal olmayan) fonksiyonlarıdır ve kısıtlarda yer alır.`,
        `Amaç fonksiyonu 4R + O + 7C doğrusal olmadığı için.`,
        `Değişkenler tamsayı olduğu için.`,
        `R + O + C = 100 eşitlik kısıtı olduğu için.`,
      ],
      answer: 0,
      explain: `Amaç 4R + O + 7C doğrusaldır; ancak TS = 12.5 − .10O − .001O², E = 17 + .35R − .04O − .002R² ve H (RO, O², C² terimleri) doğrusal olmadığından TS ≥ 12, E ≥ 16, 25 ≤ H ≤ 35 kısıtları nonlinear'dır. Eşitlik kısıtı tek başına NLP yapmaz; tamsayılık da yoktur.`,
    },
    {
      q: `Ex 4.5'te tensile strength kısıtı <code>TS = 12.5 − 0.10·O − 0.001·O² ≥ 12</code> ise, oil miktarı O için üst sınır yaklaşık kaçtır?`,
      options: [`≈ 4.77`, `≈ 5.00`, `≈ 0.50`, `≈ 12.5`],
      answer: 0,
      hint: `0.001·O² + 0.1·O − 0.5 ≤ 0 ikinci derece eşitsizliğini çözün (pozitif kök).`,
      explain: `12.5 − 0.1O − 0.001O² ≥ 12 ⇒ 0.001O² + 0.1O − 0.5 ≤ 0. Pozitif kök: O = (−0.1 + √(0.01 + 0.002)) / 0.002 = (−0.1 + 0.10954)/0.002 ≈ <b>4.77</b>. O = 5 için TS = 12.5 − 0.5 − 0.025 = 11.975 &lt; 12 (ihlal). Böylece doğrusal olmayan bir kısıt tek değişkende bir üst sınır verir.`,
    },
    {
      q: `Tank tasarımı (Ex 4.6): d = 3, h = 3 için <code>2(πdh + πd²/4) + 8(πd²/4)</code> maliyeti kaçtır (yaklaşık)? Bu tasarım feasible midir?`,
      options: [
        `$127.23; feasible (hacim ≈ 21.2 ≥ 20, h ≤ 2d)`,
        `$84.82; feasible`,
        `$127.23; infeasible (hacim &lt; 20)`,
        `$254.47; feasible`,
      ],
      answer: 0,
      hint: `Üst ve taban alanı πd²/4 = 9π/4, yan alan πdh = 9π.`,
      explain: `Maliyet = 2(9π + 9π/4) + 8(9π/4) = 22.5π + 18π = 40.5π ≈ <b>127.23</b>. Hacim = π·h·d²/4 = π·3·9/4 = 21.2 ≥ 20 ✓; h = 3 ≤ 2d = 6 ✓ → feasible. 84.82 = 27π tabanı da $2 hesaplamaktan çıkar (yanlış), 254.47 ise sonucu iki katına çıkarır.`,
    },
    {
      q: `Ex 4.6'da amaç fonksiyonundaki <b>8(πd²/4)</b> terimi neyi temsil eder?`,
      options: [
        `Ağır metalden yapılan tabanın maliyeti ($8/ft² × taban alanı)`,
        `Yan yüzeyin maliyeti`,
        `Üst kapağın maliyeti`,
        `Hacim kısıtının sağ tarafı`,
      ],
      answer: 0,
      explain: `Tabanın alanı πd²/4'tür (daire) ve taban daha ağır metalden olduğu için $8/ft². Üst + yan: 2(πdh + πd²/4) — yan alan πdh, üst alan πd²/4 ve birim maliyet $2. Hacim kısıtı πhd²/4 ≥ 20'dir.`,
    },
    {
      q: `0-1 IP'nin NLP olarak yazılışında amaca eklenen <b>10<sup>6</sup> Σ x<sub>j</sub>(1 − x<sub>j</sub>)</b> terimi ve 0 ≤ x<sub>j</sub> ≤ 1 neden kullanılır?`,
      options: [
        `x<sub>j</sub>(1 − x<sub>j</sub>) yalnızca x<sub>j</sub> = 0 veya 1'de sıfırdır; kesirli değerler çok büyük ceza alır, min problem x<sub>j</sub>'leri 0/1'e iter ("nearly equivalent").`,
        `Terim tüm x<sub>j</sub> değerlerini 1/2'ye zorlar.`,
        `Terim problemi LP'ye çevirir.`,
        `Terim yalnızca max problemlerde çalışır.`,
      ],
      answer: 0,
      explain: `x(1 − x) ≥ 0, [0, 1]'de yalnızca uçlarda sıfır olur; kesirli x için pozitiftir ve 10<sup>6</sup> katsayısı bunu pahalı yapar. Bu yüzden minimizasyon 0/1 değerlerini seçer. Bu terim x² içerdiğinden problem LP olmaz; x = 1/2 en büyük cezayı verir, çözümü oraya çekmez.`,
    },
    {
      q: `Notlara göre LINGO ve Excel Solver ile NLP çözerken hangi risk vardır?`,
      options: [
        `Birden fazla local optimum varsa, calculus-based yöntem global olmayan bir local extremum'u bulup durabilir.`,
        `NLP'leri çözemezler, yalnızca LP çözerler.`,
        `Her zaman global optimumu garanti ederler.`,
        `Yalnızca kısıtsız NLP'leri çözerler.`,
      ],
      answer: 0,
      explain: `Notlar 4.8: "LINGO and Solver use calculus-based methods. For NLPs having multiple local optimal solutions, LINGO and Solver may fail to find the optimal solution as they may pick a local extremum that is not a global extremum." Bu yüzden convexity (4.4) önemlidir: convex program'larda local = global.`,
    },
  ];

  /* ====================================================================== 4.3 */
  OR.content.summaries['4.3'] = `
<h2>4.3 Review of Differential Calculus</h2>
<p>Bu bölüm sonraki konular (convexity, Hessian, gradient, Newton) için gereken kalkülüs araçlarının özetidir. Notlardaki bazı formüller görsel olarak verilmiştir; aşağıda standart gösterimle yazılmıştır.</p>

<h3>Limit, süreklilik, türev</h3>
<ul>
  <li><b>Limit:</b> lim<sub>x→a</sub> f(x) = c, x, a'ya yaklaştıkça (ama a'ya eşit olmadan) f(x)'in c'ye keyfî yakın olması demektir.</li>
  <li><b>Continuity:</b> f(x) a noktasında süreklidir ⇔ lim<sub>x→a</sub> f(x) = f(a). Değilse a'da <b>discontinuous</b> (süreksizlik).</li>
  <li><b>Derivative:</b> f'(a) = lim<sub>Δ→0</sub> [f(a + Δ) − f(a)] / Δ. f'(a), f'nin a'daki <b>eğimi</b>dir.</li>
  <li>a'dan başlayıp x'i küçük bir Δ (pozitif ya da negatif) kadar değiştirirsek f(x) yaklaşık <b>Δ·f'(a)</b> kadar değişir.</li>
  <li>f'(a) &gt; 0 ⇒ f, a'da <b>artan</b>; f'(a) &lt; 0 ⇒ f, a'da <b>azalan</b>.</li>
  <li>f<sup>(2)</sup>(a) = f''(a) = f'(x)'in a'daki türevi; benzer şekilde f<sup>(n)</sup>(a) = f<sup>(n−1)</sup>(x)'in a'daki türevi.</li>
</ul>

<h3>Taylor serisi</h3>
<p>f<sup>(n+1)</sup>(x) [a, b] aralığının her noktasında varsa, 0 ≤ h ≤ b − a için <b>n. dereceden Taylor açılımı</b>:</p>
<div class="model">f(a + h) = f(a) + h·f'(a) + (h²/2!)·f''(a) + … + (h<sup>n</sup>/n!)·f<sup>(n)</sup>(a) + (h<sup>n+1</sup>/(n+1)!)·f<sup>(n+1)</sup>(p)</div>
<p>Eşitlik, a ile a + h arasında <b>bir p sayısı için</b> geçerlidir (son terim kalan terimdir). 1. dereceden kesme f(a + h) ≈ f(a) + h f'(a) verir (gradient search'ün temeli), 2. dereceden kesme f(a) + h f'(a) + h² f''(a)/2 verir (Newton yönteminin temeli).</p>
<p><b>Mini örnek (bizim hesabımız):</b> f(x) = x³, a = 1, h = 0.1. 1. derece: 1 + 0.1·3 = 1.3. 2. derece: 1.3 + (0.01/2)·6 = <b>1.33</b>. Gerçek değer 1.1³ = 1.331.</p>

<h3>Kısmi türevler</h3>
<ul>
  <li>f(x<sub>1</sub>, …, x<sub>n</sub>)'in x<sub>i</sub>'ye göre <b>partial derivative</b>'i ∂f/∂x<sub>i</sub> (veya f<sub>i</sub>): diğer değişkenler sabit tutularak x<sub>i</sub> üzerinden alınan türevdir.</li>
  <li><b>2. mertebe kısmi türev</b> ∂²f/∂x<sub>i</sub>∂x<sub>j</sub> (f<sub>ij</sub>): önce x<sub>i</sub>'ye göre, sonra sonucun x<sub>j</sub>'ye göre türevi alınır.</li>
  <li>2. mertebe türevler <b>var ve her yerde sürekli</b> ise karma türevler eşittir: <b>f<sub>ij</sub> = f<sub>ji</sub></b> (Hessian simetrik).</li>
  <li><b>Gradient</b> ∇f(x) = (∂f/∂x<sub>1</sub>, …, ∂f/∂x<sub>n</sub>), <b>Hessian</b> H(x) = [∂²f/∂x<sub>i</sub>∂x<sub>j</sub>] (n × n) — 4.4 ve 4.6'da kullanılır.</li>
</ul>

<h3>Notlardaki örnek (Ex 4.9'daki fonksiyon) üzerinde</h3>
<p>f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>³ + 2x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>²:</p>
<ul>
  <li>f<sub>1</sub> = 3x<sub>1</sub>² + 2x<sub>2</sub>,  f<sub>2</sub> = 2x<sub>1</sub> + 2x<sub>2</sub> → ∇f = (3x<sub>1</sub>² + 2x<sub>2</sub>, 2x<sub>1</sub> + 2x<sub>2</sub>)</li>
  <li>f<sub>11</sub> = 6x<sub>1</sub>,  f<sub>12</sub> = f<sub>21</sub> = 2,  f<sub>22</sub> = 2</li>
</ul>
${mat([['6x<sub>1</sub>', '2'], ['2', '2']])}
<p>Bu H(x<sub>1</sub>, x<sub>2</sub>) matrisidir (x<sub>1</sub>'e bağlıdır). Principal minor'ları 4.4'te hesaplanır: 6x<sub>1</sub>, 2 ve 12x<sub>1</sub> − 4.</p>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li>Kısmi türevde diğer değişkenleri <b>sabit</b> sayın (x<sub>1</sub>x<sub>2</sub> terimini x<sub>1</sub>'e göre türetince x<sub>2</sub> kalır).</li>
  <li>Taylor'ın kalan terimi p noktasında (bilinmeyen bir p) hesaplanır; a'da değil.</li>
  <li>Süreklilik, türevlenebilirlikten zayıftır: Ex 4.16'daki parçalı fonksiyon x = 3'te süreklidir (her iki parça −2 verir) ama eğimler farklıdır, türev yoktur (4.5).</li>
</ul></div>
`;

  OR.content.concepts['4.3'] = [
    {
      q: `f(x) = x² fonksiyonunda x = 3'ten başlayıp x'i Δ = 0.01 artırırsak f(x) yaklaşık ne kadar artar? (Δ·f'(a) yaklaşımı)`,
      options: [`0.06`, `0.03`, `0.6`, `0.0009`],
      answer: 0,
      explain: `f'(x) = 2x ⇒ f'(3) = 6, değişim ≈ Δ·f'(a) = 0.01 × 6 = <b>0.06</b>. (Gerçek: 3.01² − 3² = 0.0601.) 0.03 yanlışlıkla f'(3) = 3 almaktır; 0.6 ondalık hatasıdır.`,
    },
    {
      q: `Bir a noktasında <b>f'(a) &lt; 0</b> ise ne söylenebilir?`,
      options: [
        `f, a'da azalandır: x biraz artarsa f(x) azalır.`,
        `f, a'da artandır.`,
        `a mutlaka bir local maximum'dur.`,
        `f, a'da süreksizdir.`,
      ],
      answer: 0,
      explain: `Notlar: f'(a) &gt; 0 ise f artan, f'(a) &lt; 0 ise azalandır. a'nın local max olması için f'(a) = 0 (stationary) gerekir; f'(a) ≠ 0 olan bir nokta unconstrained extremum olamaz. Türevin varlığı süreklilik demektir, süreksizlik değil.`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>³ + 2x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² için ∂f/∂x<sub>2</sub> ve bunun (1, 2) noktasındaki değeri nedir?`,
      options: [`2x<sub>1</sub> + 2x<sub>2</sub>; değer 6`, `3x<sub>1</sub>² + 2x<sub>2</sub>; değer 7`, `2x<sub>1</sub> + 2x<sub>2</sub>; değer 4`, `2x<sub>2</sub>; değer 4`],
      answer: 0,
      explain: `x<sub>1</sub> sabit tutulur: ∂(x<sub>1</sub>³)/∂x<sub>2</sub> = 0, ∂(2x<sub>1</sub>x<sub>2</sub>)/∂x<sub>2</sub> = 2x<sub>1</sub>, ∂(x<sub>2</sub>²)/∂x<sub>2</sub> = 2x<sub>2</sub>. f<sub>2</sub> = 2x<sub>1</sub> + 2x<sub>2</sub> ⇒ (1, 2)'de 2 + 4 = <b>6</b>. "3x<sub>1</sub>² + 2x<sub>2</sub>" ∂f/∂x<sub>1</sub>'dir (7 = 3 + 4).`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>²x<sub>2</sub> + 3x<sub>2</sub> için (1, 2) noktasında <b>gradient</b> ve <b>Hessian</b> hangisidir?`,
      options: [
        `∇f = (4, 4);  H = [[4, 2], [2, 0]]`,
        `∇f = (4, 4);  H = [[2, 4], [4, 0]]`,
        `∇f = (2, 4);  H = [[4, 2], [2, 0]]`,
        `∇f = (4, 4);  H = [[4, 2], [2, 2]]`,
      ],
      answer: 0,
      hint: `f<sub>1</sub> = 2x<sub>1</sub>x<sub>2</sub>, f<sub>2</sub> = x<sub>1</sub>² + 3; sonra bunların türevlerini alın.`,
      explain: `f<sub>1</sub> = 2x<sub>1</sub>x<sub>2</sub> = 4, f<sub>2</sub> = x<sub>1</sub>² + 3 = 4 ⇒ ∇f(1, 2) = (4, 4). f<sub>11</sub> = 2x<sub>2</sub> = 4, f<sub>12</sub> = f<sub>21</sub> = 2x<sub>1</sub> = 2, f<sub>22</sub> = 0 (x<sub>2</sub> doğrusal) ⇒ H = [[4, 2], [2, 0]]. f<sub>22</sub> = 0 olduğuna dikkat: x<sub>2</sub> yalnızca doğrusal girer.`,
    },
    {
      q: `f(x) = x³ için a = 1, h = 0.1 noktasında <b>2. dereceden Taylor</b> yaklaşımı f(a + h) ≈ f(a) + h f'(a) + (h²/2) f''(a) kaçtır?`,
      options: [`1.33`, `1.30`, `1.331`, `1.36`],
      answer: 0,
      explain: `f(1) = 1, f'(1) = 3, f''(1) = 6. 1 + 0.1·3 + (0.01/2)·6 = 1 + 0.3 + 0.03 = <b>1.33</b>. 1.30 yalnızca 1. derece, 1.331 ise gerçek değerdir (3. terim h³/6·f'''= 0.001 eklenince tam değer çıkar).`,
    },
    {
      q: `Taylor açılımı hakkında hangileri doğrudur?`,
      options: [
        `n. dereceden açılım için f<sup>(n+1)</sup>(x)'in [a, b]'de var olması gerekir.`,
        `Kalan terimdeki p noktası a ile a + h arasında bir sayıdır.`,
        `Yalnızca polinomlar için geçerlidir.`,
        `Açılım yalnızca h &lt; 0 için tanımlıdır.`,
      ],
      answer: [0, 1],
      explain: `Notlar: "given that f<sup>(n+1)</sup>(x) exists for every point on the interval [a,b], we can write n-th order Taylor series expansion of f(x) about a for any h satisfying 0 ≤ h ≤ b − a. This equation will hold for some number p between a and a + h." Polinomlarla sınırlı değildir; yeterince türevlenebilir her fonksiyon için geçerlidir.`,
    },
    {
      q: `2. mertebe kısmi türevler <b>var ve her yerde sürekli</b> ise ne söylenir?`,
      options: [
        `f<sub>ij</sub> = f<sub>ji</sub>: Hessian simetriktir.`,
        `f<sub>ij</sub> = −f<sub>ji</sub>: Hessian antisimetriktir.`,
        `Hessian'ın determinantı sıfırdır.`,
        `Tüm kısmi türevler sıfırdır.`,
      ],
      answer: 0,
      explain: `Notlar: 2. mertebe türevler varsa ve her yerde sürekliyse karma türevlerin sırası önemsizdir. Bu nedenle Hessian simetriktir; positive/negative definite tanımları da "symmetric n×n matrix" için verilir.`,
    },
    {
      q: `Ex 4.16'daki parçalı fonksiyonda x = 3 noktasında (f<sub>1</sub>(x) = 2 − (x−1)², x &lt; 3; f<sub>2</sub>(x) = −3 + (x−4)², x ≥ 3) ne olur?`,
      options: [
        `f süreklidir (iki parça da −2 verir) ama sol/sağ eğimler −4 ve −2'dir; f'(3) yoktur.`,
        `f süreksizdir ve f'(3) = 0'dır.`,
        `f hem sürekli hem türevlenebilirdir.`,
        `f(3) tanımsızdır.`,
      ],
      answer: 0,
      hint: `Her parçanın x = 3'teki değerini ve türevini hesaplayın.`,
      explain: `f<sub>1</sub>(3⁻) = 2 − 4 = −2, f<sub>2</sub>(3) = −3 + 1 = −2 ⇒ <b>sürekli</b>. f<sub>1</sub>' = −2(x−1) = −4, f<sub>2</sub>' = 2(x−4) = −2 ⇒ eğimler eşit değil, <b>f'(3) yoktur</b>. (Bu yorum bizimdir; notlar x = 3'ü iki parçanın uç noktası olarak ele alır.) Türev olmayan nokta 4.5'te CASE 2'dir.`,
    },
  ];

  /* ====================================================================== 4.4 */
  OR.content.summaries['4.4'] = `
<h2>4.4 Convexity and Extreme Points</h2>
<h3>Convex set ve extreme point</h3>
<ul>
  <li>S bir <b>convex set</b>'tir ⇔ S'deki her x, y ve her λ ∈ [0, 1] için <b>λx + (1 − λ)y ∈ S</b> (iki nokta arasındaki doğru parçası tamamen S içindedir).</li>
  <li>v ∈ S bir <b>extreme point (vertex)</b>'tir ⇔ v, S içinde yer alan hiçbir doğru parçasının <b>orta noktası değildir</b>.</li>
  <li>Tüm kısıtlar doğrusalsa feasible region convex'tir (LP'nin feasible bölgesi convex). Ex 4.7: B, C ve B ∩ C convex kümelerdir.</li>
</ul>
<p>Örnekler (bizim, notlardaki tanımla uyumlu): disk x² + y² ≤ 4 convex'tir ve <b>sınırındaki her nokta</b> extreme point'tir; halka 1 ≤ x² + y² ≤ 4 convex değildir (halkanın karşılıklı iki noktasının orta noktası delikte kalır).</p>

<h3>4.4.1 Convex ve concave fonksiyonlar</h3>
<div class="model">convex  on S:  f[λx' + (1−λ)x''] ≤ λf(x') + (1−λ)f(x'')     (0 ≤ λ ≤ 1)
concave on S:  f[λx' + (1−λ)x''] ≥ λf(x') + (1−λ)f(x'')</div>
<p>Sıkı eşitsizlik (&lt; / &gt;) = <b>strict</b> convexity / concavity. Tek değişkende: iki noktayı birleştiren doğru convex fonksiyon için eğrinin <b>üstünde</b>, concave için <b>altında</b> kalır.</p>
<ul>
  <li><b>Tek değişken:</b> f'' her x ∈ S'de varsa, f convex ⇔ f''(x) ≥ 0 (strict: &gt; 0); f concave ⇔ f''(x) ≤ 0 (strict: &lt; 0).</li>
  <li>Ex 4.8: f(x) = x² → f'' = 2 &gt; 0 (strict convex). f(x) = −ln x (x &gt; 0) → f'' = 1/x² &gt; 0 (convex).</li>
  <li>(Notlarda yok) Doğrusal fonksiyon f'' = 0 olduğundan hem convex hem concave'dir.</li>
</ul>

<h3>n-değişkenli durum: Hessian ve principal minor</h3>
<ul>
  <li><b>Hessian</b>: n × n matris, ij girdisi ∂²f/∂x<sub>i</sub>∂x<sub>j</sub>.</li>
  <li><b>i. principal minor</b>: matristen n − i satır ve <i>aynı numaralı</i> n − i sütun silinerek elde edilen i × i matrisin determinantı (birden çok olabilir).</li>
  <li><b>k. leading principal minor</b> (H<sub>k</sub>): son n − k satır ve sütun silinerek elde edilen k × k matrisin determinantı (tek).</li>
</ul>
<table>
  <tr><th>Simetrik matris</th><th>Koşul (notlar)</th></tr>
  <tr><td><b>Positive definite</b></td><td>tüm principal minor'lar &gt; 0</td></tr>
  <tr><td><b>Positive semidefinite</b></td><td>tüm principal minor'lar ≥ 0</td></tr>
  <tr><td><b>Negative definite</b></td><td>minor'lar sıfırdan farklı ve işaretleri <b>sırayla değişen</b> (ilki negatif): D<sub>1</sub> &lt; 0, D<sub>2</sub> &gt; 0, D<sub>3</sub> &lt; 0, …</td></tr>
  <tr><td><b>Negative semidefinite</b></td><td>k. mertebe minor'ların işareti (−1)<sup>k</sup> ile aynı veya 0: 1. mertebe ≤ 0, 2. mertebe ≥ 0, 3. mertebe ≤ 0 …</td></tr>
</table>
<p><b>Ex 4.9:</b> f = x<sub>1</sub>³ + 2x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² ⇒ H = [[6x<sub>1</sub>, 2], [2, 2]]. 1. principal minor'lar: 6x<sub>1</sub> (leading) ve 2; 2. principal minor: 6x<sub>1</sub>·2 − 2·2 = <b>12x<sub>1</sub> − 4</b>.</p>
<p><b>Ex 4.10:</b> A = [[−2, −1], [−1, −4]]: 1. minor'lar −2 (leading), −4; 2. minor = (−2)(−4) − (−1)(−1) = 7. B = [[−2, 1, 3], [5, −4, 2], [6, 3, 7]]:</p>
<ul>
  <li>1. minor'lar: −2 (leading), −4, 7.</li>
  <li>2. minor'lar: det[[−2,1],[5,−4]] = 3 (leading); satır/sütun 2 silinirse det[[−2,3],[6,7]] = −32; satır/sütun 1 silinirse det[[−4,2],[3,7]] = −34.</li>
  <li>3. minor = det B = 162. Toplam 7 principal minor (3 + 3 + 1).</li>
</ul>

<h3>Convexity / concavity koşulları (f'nin 2. türevleri sürekli, S = R<sup>n</sup>)</h3>
<table>
  <tr><th>Sonuç</th><th>Koşul</th></tr>
  <tr><td>f <b>convex</b></td><td>her x için <b>tüm</b> principal minor'lar ≥ 0</td></tr>
  <tr><td>f <b>strictly convex</b></td><td>tüm principal minor'lar &gt; 0</td></tr>
  <tr><td>f <b>concave</b></td><td>k = 1, …, n için sıfırdan farklı tüm k. mertebe principal minor'lar (−1)<sup>k</sup> ile aynı işaretli: f<sub>11</sub> ≤ 0, 2. mertebe ≥ 0, 3. mertebe ≤ 0, …</td></tr>
  <tr><td>f <b>strictly concave</b></td><td>tüm k. mertebe minor'lar (−1)<sup>k</sup> işaretli (&lt; 0, &gt; 0, &lt; 0, …)</td></tr>
  <tr><td>Hiçbiri</td><td>hem convex hem concave koşulunu bozan minor'lar var</td></tr>
</table>
<p><b>2 × 2 hızlı özet:</b> H = [[a, b], [b, c]] için convex ⇔ a ≥ 0, c ≥ 0, ac − b² ≥ 0; concave ⇔ a ≤ 0, c ≤ 0, ac − b² ≥ 0; ac − b² &lt; 0 ⇒ <b>ne convex ne concave</b> (strict kontroller için ≥ yerine &gt;).</p>

<h3>Notlardaki örnekler</h3>
<ul>
  <li><b>Ex 4.11:</b> f = x<sub>1</sub>² + 2x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² ⇒ H = [[2, 2], [2, 2]]. 1. minor'lar 2, 2 &gt; 0; 2. minor 2·2 − 2·2 = 0. Hepsi ≥ 0 ⇒ <b>convex</b> (strict değil: bir minor 0).</li>
  <li><b>Ex 4.12:</b> f = x<sub>1</sub>² + x<sub>2</sub>² + 2x<sub>3</sub>² − x<sub>1</sub>x<sub>2</sub> − x<sub>1</sub>x<sub>3</sub> − x<sub>2</sub>x<sub>3</sub> ⇒ H = [[2, −1, −1], [−1, 2, −1], [−1, −1, 4]]. 1. minor'lar 2, 2, 4 &gt; 0. 2. minor'lar: 1. satır/sütun silinirse det[[2,−1],[−1,4]] = 7; 2. silinirse 7; 3. silinirse det[[2,−1],[−1,2]] = 3 (hepsi &gt; 0). 3. minor: det H = 2(8−1) + 1(−4−1) − 1(1+2) = 14 − 5 − 3 = 6 &gt; 0. Hepsi pozitif ⇒ <b>strictly convex</b>.</li>
  <li><b>Ex 4.13:</b> f = −x<sub>1</sub>² − x<sub>2</sub>² − 2x<sub>3</sub>² + 0.5x<sub>1</sub>x<sub>2</sub> ⇒ H = [[−2, 0.5, 0], [0.5, −2, 0], [0, 0, −4]]. Leading minor'lar: D<sub>1</sub> = −2 &lt; 0; D<sub>2</sub> = 4 − 0.25 = 3.75 &gt; 0; D<sub>3</sub> = −4·3.75 = −15 &lt; 0 ⇒ işaretler sırayla değişiyor ⇒ H negative definite ⇒ <b>strictly concave</b>.</li>
  <li><b>Ex 4.14:</b> f = x<sub>1</sub>² + 2x<sub>2</sub>² − 3x<sub>1</sub>x<sub>2</sub> ⇒ H = [[2, −3], [−3, 4]]. 1. minor'lar 2, 4 &gt; 0 ⇒ concave olamaz. 2. minor 2·4 − (−3)(−3) = −1 &lt; 0 ⇒ convex olamaz ⇒ <b>neither</b>.</li>
</ul>

<h3>4.4.2 Local optima ve saddle point</h3>
<ul>
  <li><b>Stationary (critical) point:</b> ∇f(x) = 0 (tüm 1. kısmi türevler sıfır).</li>
  <li>2. kısmi türevleri sürekli ve a bir stationary point ise: H(a) <b>negative definite</b> ⇒ <b>local max</b>; H(a) <b>positive definite</b> ⇒ <b>local min</b>.</li>
  <li><b>Saddle point:</b> local max de local min de olmayan stationary point.</li>
  <li><b>Ex 4.15:</b> f = x<sub>1</sub>² − 2x<sub>1</sub> − x<sub>2</sub>², x = (1, 0): ∇f = (2x<sub>1</sub> − 2, −2x<sub>2</sub>) = (0, 0) ✓. H = [[2, 0], [0, −2]]; principal minor'lar 2, −2 ve −4 ⇒ ne positive semidefinite (−2 &lt; 0) ne negative semidefinite (2 &gt; 0) ⇒ ne local max ne local min ⇒ <b>saddle point</b>.</li>
</ul>

<h3>4.4.3 Convexity'nin önemi</h3>
<ul>
  <li>Feasible region <b>convex</b> ve amaç fonksiyonu bu bölgede <b>concave</b> ise (max problem) her <b>local maximum global maximum</b>'dur. Strict concavity ⇒ global max <b>tekdir</b>.</li>
  <li>Min problemde amaç <b>convex</b> ise her local minimum global minimum'dur; strict convexity ⇒ global min tektir.</li>
</ul>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li>Convex/concave kontrolünde <b>tüm</b> principal minor'lar (leading olmayanlar da) kontrol edilir. Örn. H = [[0, 0], [0, −1]]: leading minor'lar 0 ve 0 (≥ 0) gibi görünür, ama 1. mertebe minor −1 &lt; 0 ⇒ convex değil (notlarda yok). Definite durumlarda leading minor'lar yeterlidir (Ex 4.13 gibi).</li>
  <li>Concave için işaret kuralı (−1)<sup>k</sup>: 1. mertebe ≤ 0, 2. mertebe ≥ 0, 3. mertebe ≤ 0. "Tüm minor'lar negatif" yanlıştır (2 × 2 determinant pozitif olmalı).</li>
  <li>Bir minor 0 ise strict olmaz (Ex 4.11: convex, strictly convex değil).</li>
  <li>Hem 1. mertebe minor'lar pozitif hem determinant negatifse <b>neither</b> (Ex 4.14).</li>
  <li>Hessian x'e bağlıysa (Ex 4.9) convexity yalnızca bazı bölgelerde olabilir: 6x<sub>1</sub> ≥ 0 ve 12x<sub>1</sub> − 4 ≥ 0 ⇒ x<sub>1</sub> ≥ 1/3 olan convex kümede f convex (bizim hesabımız).</li>
</ul></div>
`;

  OR.content.concepts['4.4'] = [
    {
      q: `<b>Convex set</b> tanımı hangisidir?`,
      options: [
        `S'deki her x, y ve her λ ∈ [0, 1] için λx + (1 − λ)y de S'dedir.`,
        `S'deki her x, y için x + y de S'dedir.`,
        `S'nin sınırındaki her nokta bir extreme point'tir.`,
        `S'nin içi boş değildir ve sınırlıdır.`,
      ],
      answer: 0,
      explain: `Notlar: iki nokta arasındaki tüm doğru parçası kümede kalıyorsa küme convex'tir. Sınırlılık, kapalılık ya da toplama altında kapalı olmak convexity tanımının parçası değildir.`,
    },
    {
      q: `Aşağıdaki kümelerden hangileri <b>convex</b>'tir?`,
      options: [
        `Disk: {(x, y) : x² + y² ≤ 4}`,
        `{(x, y) : x + y ≤ 3, x ≥ 0, y ≥ 0} (LP'nin feasible bölgesi)`,
        `Halka: {(x, y) : 1 ≤ x² + y² ≤ 4}`,
        `İki ayrık diskin birleşimi`,
      ],
      answer: [0, 1],
      explain: `Doğrusal kısıtların bölgesi convex'tir (LP feasible region); disk iki noktasını birleştiren her doğru parçasını içerir. Halkada (−1.5, 0) ve (1.5, 0) kümededir ama orta noktaları (0, 0) delikte kalır; iki ayrık diskin birleşiminde de iki diskin noktalarını birleştiren parça boşluktan geçer.`,
    },
    {
      q: `Notlardaki tanıma göre bir v ∈ S noktası ne zaman <b>extreme point</b>'tir? Disk x² + y² ≤ 4 için hangi noktalar extreme point'tir?`,
      options: [
        `v, S'deki hiçbir doğru parçasının orta noktası değilse; diskte sınır çemberinin her noktası extreme point'tir.`,
        `v kümenin merkeziyse; diskte yalnızca (0, 0).`,
        `v, kümenin herhangi bir noktasıysa; diskte tüm noktalar.`,
        `v, kümenin sınırında bir köşe ise; diskte hiçbir nokta extreme point değildir.`,
      ],
      answer: 0,
      explain: `"v is not the midpoint of any line segment contained in S". Diskte merkez ve iç noktalar bir doğru parçasının orta noktasıdır (ör. (0,0) = (−1,0) ile (1,0)'ın orta noktası); çember üzerindeki bir nokta ise hiçbir parçanın orta noktası olamaz. Köşe bulunmaması, extreme point bulunmaması demek değildir.`,
    },
    {
      q: `Bir fonksiyon <b>convex</b> ise, S üzerindeki iki noktasını birleştiren doğru parçası eğriye göre nerede yer alır ve hangi eşitsizlik geçerlidir?`,
      options: [
        `Eğrinin üstünde; f[λx' + (1−λ)x''] ≤ λf(x') + (1−λ)f(x'')`,
        `Eğrinin altında; f[λx' + (1−λ)x''] ≥ λf(x') + (1−λ)f(x'')`,
        `Eğrinin üstünde; f[λx' + (1−λ)x''] ≥ λf(x') + (1−λ)f(x'')`,
        `Eğrinin altında; f[λx' + (1−λ)x''] ≤ λf(x') + (1−λ)f(x'')`,
      ],
      answer: 0,
      explain: `Notlar: "Line joining any two points of the convex function is above the curve; of the concave function is below the curve." Convex: eğri akoru geçmez ⇒ f(λx'+(1−λ)x'') ≤ λf(x')+(1−λ)f(x''). Concave için eşitsizlik ve konum tersine döner.`,
    },
    {
      q: `Tek değişkenli test: Aşağıdakilerden hangileri R (veya x &gt; 0) üzerinde <b>convex</b>'tir?`,
      options: [
        `f(x) = x²   (f'' = 2)`,
        `f(x) = −ln x, x &gt; 0   (f'' = 1/x²)`,
        `f(x) = x³, x ∈ R   (f'' = 6x)`,
        `f(x) = −x²   (f'' = −2)`,
      ],
      answer: [0, 1],
      explain: `Convex ⇔ f'' ≥ 0 her yerde. x² için 2 &gt; 0, −ln x için 1/x² &gt; 0 (notlardaki Ex 4.8). x³ için f'' = 6x işaret değiştirir (x &lt; 0'da negatif) ⇒ R'de ne convex ne concave (x ≥ 0 kümesinde convex). −x² concave'dir (f'' = −2 &lt; 0).`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>² + x<sub>1</sub>x<sub>2</sub> + 2x<sub>2</sub>² fonksiyonu R² üzerinde nedir?`,
      options: [
        `Strictly convex`,
        `Convex ama strictly convex değil`,
        `Strictly concave`,
        `Ne convex ne concave`,
      ],
      answer: 0,
      hint: `H = [[2, 1], [1, 4]]; 1. mertebe minor'ları ve determinantı hesaplayın.`,
      explain: `H = [[2, 1], [1, 4]]. 1. mertebe minor'lar 2 ve 4 &gt; 0; 2. mertebe minor = 2·4 − 1·1 = 7 &gt; 0. Tüm principal minor'lar pozitif ⇒ H positive definite ⇒ <b>strictly convex</b>. İlk minor'ların pozitifliği concave olmayı zaten eler.`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>² + 3x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² için doğru sonuç hangisidir?`,
      options: [
        `Ne convex ne concave (H = [[2, 3], [3, 2]], det = −5 &lt; 0)`,
        `Strictly convex`,
        `Convex ama strict değil`,
        `Strictly concave`,
      ],
      answer: 0,
      explain: `H = [[2, 3], [3, 2]]. 1. mertebe minor'lar 2, 2 &gt; 0 ⇒ concave olamaz. 2. mertebe minor = 4 − 9 = −5 &lt; 0 ⇒ convex olamaz (Ex 4.14'teki mantık). Sonuç: <b>neither</b>.`,
    },
    {
      q: `Ex 4.11: f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>² + 2x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² = (x<sub>1</sub> + x<sub>2</sub>)². Doğru ifade hangisidir?`,
      options: [
        `Convex'tir fakat strictly convex değildir; çünkü H = [[2, 2], [2, 2]]'nin 2. minor'u 0'dır.`,
        `Strictly convex'tir.`,
        `Concave'tir.`,
        `Ne convex ne concave'dir.`,
      ],
      answer: 0,
      explain: `Principal minor'lar: 2, 2 ve 2·2 − 2·2 = 0. Hepsi ≥ 0 ⇒ convex (positive semidefinite). Bir minor sıfır olduğu için "hepsi &gt; 0" şartı sağlanmaz ⇒ strict değil. Nitekim x<sub>1</sub> + x<sub>2</sub> = sabit doğrusu boyunca f sabittir.`,
    },
    {
      q: `Ex 4.12 (f = x<sub>1</sub>² + x<sub>2</sub>² + 2x<sub>3</sub>² − x<sub>1</sub>x<sub>2</sub> − x<sub>1</sub>x<sub>3</sub> − x<sub>2</sub>x<sub>3</sub>) için H = [[2,−1,−1],[−1,2,−1],[−1,−1,4]]. <b>3. principal minor</b> (det H) kaçtır ve sonuç nedir?`,
      options: [
        `6; tüm minor'lar pozitif ⇒ strictly convex`,
        `14; strictly convex`,
        `−6; strictly concave`,
        `0; convex ama strict değil`,
      ],
      answer: 0,
      explain: `det H = 2·(2·4 − (−1)(−1)) − (−1)·((−1)·4 − (−1)(−1)) + (−1)·((−1)(−1) − 2·(−1)) = 2·7 + 1·(−5) − 1·3 = 14 − 5 − 3 = <b>6</b>. 1. mertebe minor'lar 2, 2, 4; 2. mertebe 7, 7, 3; 3. mertebe 6 — hepsi &gt; 0 ⇒ strictly convex. 14 yalnızca ilk terimdir.`,
    },
    {
      q: `Ex 4.13: H = [[−2, 0.5, 0], [0.5, −2, 0], [0, 0, −4]]. Leading principal minor'lar D<sub>1</sub>, D<sub>2</sub>, D<sub>3</sub> ve sonuç nedir?`,
      options: [
        `−2, 3.75, −15; işaretler sırayla değişir ⇒ negative definite ⇒ strictly concave`,
        `−2, 4.25, −17; strictly concave`,
        `−2, 3.75, 15; strictly convex`,
        `−2, −3.75, −15; strictly concave`,
      ],
      answer: 0,
      explain: `D<sub>1</sub> = −2; D<sub>2</sub> = (−2)(−2) − 0.5·0.5 = 4 − 0.25 = 3.75; D<sub>3</sub> = −4·D<sub>2</sub> = −15 (blok köşegen). Negative definite için işaretler −, +, − olmalı: ✓ ⇒ strictly concave. D<sub>2</sub> = −3.75 olsaydı (4 + 0.25 ya da işaret hatası) alterne olmazdı.`,
    },
    {
      q: `Üç satırlı (3×3) bir matristen elde edilebilecek <b>toplam principal minor</b> sayısı kaçtır? (Ex 4.10'daki matris için sayın.)`,
      options: [`3`, `6`, `7`, `9`],
      answer: 2,
      explain: `1. mertebe: 3 (köşegen elemanlar), 2. mertebe: 3 (bir satır/sütun çifti silinerek), 3. mertebe: 1 (det) ⇒ 3 + 3 + 1 = <b>7</b>. Bunların yalnızca 3'ü <i>leading</i>'dir (−2; 3; 162). Ex 4.10'da: −2, −4, 7 | 3, −32, −34 | 162.`,
    },
    {
      q: `Ex 4.10'daki B = [[−2, 1, 3], [5, −4, 2], [6, 3, 7]] matrisinde <b>satır ve sütun 2 silinerek</b> elde edilen 2. principal minor kaçtır?`,
      options: [`−32`, `3`, `−34`, `162`],
      answer: 0,
      hint: `Kalan matris: [[−2, 3], [6, 7]].`,
      explain: `Satır 2 ve sütun 2 silinince [[−2, 3], [6, 7]] kalır: (−2)(7) − (3)(6) = −14 − 18 = <b>−32</b>. 3 → leading minor ([[−2,1],[5,−4]]); −34 → 1. satır/sütun silinince [[−4,2],[3,7]]; 162 → 3. mertebe (det B).`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>³ + 2x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² için H = [[6x<sub>1</sub>, 2], [2, 2]] (Ex 4.9). Hangi x<sub>1</sub> değerleri için H tüm principal minor'ları ≥ 0 yapar (yani f o bölgede convex)?`,
      options: [`x<sub>1</sub> ≥ 1/3`, `x<sub>1</sub> ≥ 0`, `x<sub>1</sub> ≥ 3`, `Her x<sub>1</sub>`],
      answer: 0,
      explain: `Minor'lar: 6x<sub>1</sub>, 2 ve 12x<sub>1</sub> − 4. 6x<sub>1</sub> ≥ 0 ⇒ x<sub>1</sub> ≥ 0; 12x<sub>1</sub> − 4 ≥ 0 ⇒ x<sub>1</sub> ≥ 1/3. İkisi birlikte x<sub>1</sub> ≥ <b>1/3</b>. x<sub>1</sub> ≥ 0 yetmez: x<sub>1</sub> = 0.2 için determinant 12(0.2) − 4 = −1.6 &lt; 0. (Convex küme x<sub>1</sub> ≥ 1/3 yarı düzlemidir; bu yorum bizimdir.)`,
    },
    {
      q: `Ex 4.15: f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>² − 2x<sub>1</sub> − x<sub>2</sub>² için x = (1, 0) stationary point'i nasıl sınıflanır?`,
      options: [
        `Saddle point: H = [[2, 0], [0, −2]] ne positive ne negative semidefinite`,
        `Local minimum`,
        `Local maximum`,
        `Global minimum`,
      ],
      answer: 0,
      hint: `∇f = (2x<sub>1</sub> − 2, −2x<sub>2</sub>). Sonra H'nin principal minor'larına bakın: 2, −2, −4.`,
      explain: `H(1, 0) = [[2, 0], [0, −2]] ⇒ 1. mertebe minor'lar 2 (&gt; 0) ve −2 (&lt; 0), 2. mertebe −4. Positive semidefinite olmak için hepsi ≥ 0, negative semidefinite olmak için 1. mertebe hepsi ≤ 0 olmalı; ikisi de sağlanmaz ⇒ x ne local min ne local max ⇒ <b>saddle</b>. x<sub>1</sub> yönünde f artar, x<sub>2</sub> yönünde azalır.`,
    },
    {
      q: `Feasible region <b>convex</b> bir kümedir. Hangi ifadeler doğrudur?`,
      options: [
        `Max problemde amaç concave ise her local maximum global maximum'dur.`,
        `Min problemde amaç convex ise her local minimum global minimum'dur.`,
        `Strictly concave amaç (max) global maximum'un tek olmasını sağlar.`,
        `Amaç convex ise (max problemde) her local maximum global'dir.`,
      ],
      answer: [0, 1, 2],
      explain: `Notlar 4.4.3: convex S + concave f ⇒ local max = global max (strict ⇒ unique); convex f ⇒ local min = global min (strict ⇒ unique). Max problemde convex amaç bu garantiyi vermez (örn. f = x² [−1,1] üzerinde max: x = ±1 iki ayrı local max ve ikisi de aynı değerde).`,
    },
    {
      q: `(Notlarda yok, tanımlardan) <b>Doğrusal</b> bir fonksiyon f(x) = c<sup>T</sup>x convex mi concave mi?`,
      options: [
        `Hem convex hem concave (eşitlik her zaman sağlanır; Hessian = 0)`,
        `Yalnızca convex`,
        `Yalnızca concave`,
        `Ne convex ne concave`,
      ],
      answer: 0,
      explain: `Doğrusal f için f[λx'+(1−λ)x''] = λf(x')+(1−λ)f(x'') eşitliği geçerlidir; hem ≤ hem ≥ sağlanır. Hessian sıfır matristir, tüm minor'lar 0 olduğundan hem "≥ 0" hem de "(−1)<sup>k</sup> işaretli veya 0" koşulları sağlanır (ama strict değildir). Bu yüzden LP, hem convex hem concave bir amaçla convex bir bölgede çözülür.`,
    },
  ];

  /* ====================================================================== 4.5 */
  OR.content.summaries['4.5'] = `
<h2>4.5 Solving NLPs with One Variable</h2>
<p>Tek değişkenli NLP: <code>max (veya min) f(x)  s.t.  a ≤ x ≤ b</code>. İki yaklaşım: <b>local extremum analizi</b> veya sayısal yöntem, örn. <b>Golden Section Search (GSS)</b>.</p>

<h3>4.5.1 Local extremum'ları analiz etmek</h3>
<p>Local maksimum/minimumların hepsi bulunur; optimal çözüm, f(x) değeri en büyük (veya en küçük) olan local max (min)'dir. Local extremum olabilecek üç tür nokta (<b>extremum candidates</b>):</p>
<ul>
  <li><b>CASE 1:</b> a &lt; x &lt; b ve f'(x) = 0 (<b>stationary point</b>).</li>
  <li><b>CASE 2:</b> f'(x)'in <b>var olmadığı</b> noktalar.</li>
  <li><b>CASE 3:</b> aralığın <b>uç noktaları</b> a ve b.</li>
</ul>
<h4>Example 4.16</h4>
<div class="model">f(x) = 2 − (x − 1)²      0 ≤ x &lt; 3
f(x) = −3 + (x − 4)²     3 ≤ x ≤ 6
max f(x)  s.t. 0 ≤ x ≤ 6</div>
<table>
  <tr><th>Parça</th><th>Aday</th><th>Değer</th></tr>
  <tr><td rowspan="3">1. parça</td><td>stationary: f<sub>1</sub>' = −2(x−1) = 0 ⇒ x = 1</td><td>f<sub>1</sub>(1) = <b>2</b></td></tr>
  <tr><td>uç: x = 0</td><td>f<sub>1</sub>(0) = 1</td></tr>
  <tr><td>uç: x → 3 (3'e ulaşmaz)</td><td>f<sub>1</sub> → −2 (notlar: "approaches −2 but doesn't reach it on this piece")</td></tr>
  <tr><td rowspan="3">2. parça</td><td>stationary: f<sub>2</sub>' = 2(x−4) = 0 ⇒ x = 4</td><td>f<sub>2</sub>(4) = −3</td></tr>
  <tr><td>uç: x = 3</td><td>f<sub>2</sub>(3) = −2</td></tr>
  <tr><td>uç: x = 6</td><td>f<sub>2</sub>(6) = 1</td></tr>
</table>
<p>En büyük değer <b>2</b> ⇒ <b>x* = 1, f* = 2</b>. (Bizim ek: problem min olsaydı en küçük değer −3 ile x = 4 olurdu.)</p>

<h3>4.5.2 Golden Section Search</h3>
<p>f'(x) yoksa ya da f'(x) = 0'ı çözmek zorsa GSS kullanılır; f'nin <b>unimodal</b> olması gerekir.</p>
<ul>
  <li><b>Unimodal:</b> en çok bir local maximum (veya en çok bir local minimum). Convexity/concavity'den <b>daha zayıf</b> bir koşuldur; unimodal fonksiyon convex ya da concave olmak zorunda değildir. Max'ta strict concave, min'de strict convex amaç unimodaldır. Max için: [a, b] üzerinde bir x' vardır, f [a, x']'de kesin artan, [x', b]'de kesin azalan.</li>
  <li>x<sub>1</sub> &lt; x<sub>2</sub> iki noktada f hesaplanınca (max problem) x' şu aralıktadır:
    <table>
      <tr><th>Durum</th><th>x' nerede?</th><th>Yeni <i>interval of uncertainty</i></th></tr>
      <tr><td>Case 1: f(x<sub>1</sub>) &lt; f(x<sub>2</sub>)</td><td>x' ∈ (x<sub>1</sub>, b]</td><td>sol kısmı at: <b>(x<sub>1</sub>, b]</b></td></tr>
      <tr><td>Case 2: f(x<sub>1</sub>) = f(x<sub>2</sub>)</td><td>x' ∈ [a, x<sub>2</sub>] (notlar)</td><td><b>[a, x<sub>2</sub>]</b></td></tr>
      <tr><td>Case 3: f(x<sub>1</sub>) &gt; f(x<sub>2</sub>)</td><td>x' ∈ [a, x<sub>2</sub>)</td><td>sağ kısmı at: <b>[a, x<sub>2</sub>)</b></td></tr>
    </table></li>
  <li>GSS iki noktayla başlar:
    <div class="model">x<sub>1</sub> = b − r(b − a)      (LH point)
x<sub>2</sub> = a + r(b − a)      (RH point)
r = 0.618     [r² + r = 1'in tek pozitif kökü]</div>
    Yeni LH noktası: <b>sağ uçtan</b> mevcut belirsizlik aralığının r katı kadar sola; yeni RH noktası: <b>sol uçtan</b> r katı kadar sağa. Her iterasyonda aralık 0.618 katına iner; önceki noktalardan biri <b>yeniden kullanılır</b> (yalnızca 1 yeni f hesabı gerekir).</li>
  <li><b>Yeniden kullanım:</b> Case 1 (sol atıldı) ⇒ eski x<sub>2</sub> yeni LH nokta olur; Case 3 (sağ atıldı) ⇒ eski x<sub>1</sub> yeni RH nokta olur. (Ex 4.17 satırlarında x<sub>3</sub> = x<sub>2</sub>, x<sub>6</sub> = x<sub>3</sub>, x<sub>8</sub> = x<sub>5</sub>, x<sub>9</sub> = x<sub>8</sub>.)</li>
</ul>

<h4>Example 4.17 (Winston 11.5)</h4>
<div class="model">max −x² − 1   s.t. −1 ≤ x ≤ 0.75      son belirsizlik aralığı uzunluğu &lt; 0.25</div>
<p>a = −1, b = 0.75, b − a = 1.75. İterasyon sayısı k: 1.75·(0.618)<sup>k</sup> &lt; 0.25 ⇒ k &gt; ln(1/7)/ln(0.618) ⇒ k &gt; 4.04 (notlarda 4.06 yazar; sonuç aynı) ⇒ <b>5 iterasyon</b>.</p>
<table>
  <tr><th>It.</th><th>x<sub>LH</sub></th><th>x<sub>RH</sub></th><th>f(x<sub>LH</sub>)</th><th>f(x<sub>RH</sub>)</th><th>Karar</th><th>Yeni aralık</th><th>Uzunluk</th></tr>
  <tr><td>I</td><td>x<sub>1</sub> = 0.75 − 0.618·1.75 = −0.3315</td><td>x<sub>2</sub> = −1 + 0.618·1.75 = 0.0815</td><td>−1.1099</td><td>−1.0066</td><td>f(x<sub>1</sub>) &lt; f(x<sub>2</sub>)</td><td>(−0.3315, 0.75]</td><td>1.0815</td></tr>
  <tr><td>II</td><td>x<sub>3</sub> = x<sub>2</sub> = 0.0815</td><td>x<sub>4</sub> = −0.3315 + 0.618·1.0815 = 0.3369</td><td>−1.0066</td><td>−1.1135</td><td>f(x<sub>3</sub>) &gt; f(x<sub>4</sub>)</td><td>[−0.3315, 0.3369)</td><td>0.6684</td></tr>
  <tr><td>III</td><td>x<sub>5</sub> = 0.3369 − 0.618·0.6684 = −0.0762</td><td>x<sub>6</sub> = x<sub>3</sub> = 0.0815</td><td>−1.0058</td><td>−1.0066</td><td>f(x<sub>5</sub>) &gt; f(x<sub>6</sub>)</td><td>[−0.3315, 0.0815)</td><td>0.4130</td></tr>
  <tr><td>IV</td><td>x<sub>7</sub> = 0.0815 − 0.618·0.413 = −0.1737</td><td>x<sub>8</sub> = x<sub>5</sub> = −0.0762</td><td>−1.0302</td><td>−1.0058</td><td>f(x<sub>8</sub>) &gt; f(x<sub>7</sub>)</td><td>(−0.1737, 0.0815]</td><td>0.2552</td></tr>
  <tr><td>V</td><td>x<sub>9</sub> = x<sub>8</sub> = −0.0762</td><td>x<sub>10</sub> = −0.1737 + 0.618·0.2552 = −0.016</td><td>−1.0058</td><td>−1.0003</td><td>f(x<sub>10</sub>) &gt; f(x<sub>9</sub>)</td><td>(−0.0762, 0.0815]</td><td>0.1577 &lt; 0.25 ✓</td></tr>
</table>
<p>Optimum, <b>(−0.0762, 0.0815]</b> aralığındadır (gerçek maksimum x = 0'dadır). Toplam yalnızca <b>6</b> farklı f hesabı yapıldı (I'de 2, sonraki her iterasyonda 1 yeni nokta).</p>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li>Uç noktaları (CASE 3) unutmayın: tek değişkenli NLP'de optimum çoğu zaman stationary point değil, uç noktadır. Mini örnek (bizim): max x³ − 3x, 0 ≤ x ≤ 3 ⇒ stationary x = 1 (f = −2, bu bir minimum adayıdır); uçlar f(0) = 0, f(3) = 18 ⇒ <b>max x = 3, f = 18</b>.</li>
  <li>Hangi noktayı yeniden kullandığınızı doğru seçin: <b>x<sub>1</sub> = b − r(b − a)</b> (sağ uçtan), <b>x<sub>2</sub> = a + r(b − a)</b> (sol uçtan). Mevcut aralığın uzunluğuyla yeniden hesaplayın.</li>
  <li>Max için: f(x<sub>1</sub>) &lt; f(x<sub>2</sub>) ⇒ <b>sol atılır</b>; f(x<sub>1</sub>) &gt; f(x<sub>2</sub>) ⇒ <b>sağ atılır</b>; eşitlikte notlar [a, x<sub>2</sub>]'yi alır. Min problemde (notlarda yok, ayna) yönler tersine döner.</li>
  <li>İterasyon sayısı: <b>L<sub>0</sub>·0.618<sup>k</sup> &lt; ε</b> eşitsizliğinden bulunur, k yukarı yuvarlanır.</li>
  <li>GSS yalnızca <b>unimodal</b> fonksiyonda garantilidir ve bir <i>aralık</i> verir, nokta değil.</li>
</ul></div>
`;

  OR.content.concepts['4.5'] = [
    {
      q: `Tek değişkenli NLP'de <code>a ≤ x ≤ b</code> üzerinde local extremum olabilecek noktalar (extremum candidates) hangileridir?`,
      options: [
        `a &lt; x &lt; b ve f'(x) = 0 olan stationary point'ler (CASE 1)`,
        `f'(x)'in var olmadığı noktalar (CASE 2)`,
        `Aralığın uç noktaları a ve b (CASE 3)`,
        `f''(x) = 0 olan tüm noktalar`,
      ],
      answer: [0, 1, 2],
      explain: `Notlar üç durumu sayar: CASE 1 stationary point (a &lt; x &lt; b, f'(x) = 0), CASE 2 türevin olmadığı noktalar, CASE 3 uç noktalar. f'' = 0 (inflection adayı) ayrı bir aday sınıfı değildir; örn. f = x³'te x = 0 stationary ama local extremum değildir.`,
    },
    {
      q: `Ex 4.16'daki NLP'nin (max f(x), 0 ≤ x ≤ 6; f = 2 − (x−1)² [0 ≤ x &lt; 3], f = −3 + (x−4)² [3 ≤ x ≤ 6]) optimal çözümü nedir?`,
      options: [`x* = 1, f = 2`, `x* = 4, f = −3`, `x* = 0 ve x* = 6, f = 1`, `x* = 3, f = −2`],
      answer: 0,
      hint: `Adaylar: 1, 0, 3⁻, 4, 3, 6. Hepsinin f değerini yazın.`,
      explain: `Değerler: f(1) = 2, f(0) = 1, f(3⁻) → −2, f(4) = −3, f(3) = −2, f(6) = 1. En büyüğü <b>2</b> (x = 1). Uç noktalar (0 ve 6) yalnızca 1 değerini verir; x = 4 ikinci parçanın stationary noktasıdır ama bir <i>minimum</i>dur (−3).`,
    },
    {
      q: `Ex 4.16 problemi <b>min</b> f(x) olsaydı (aynı veri) optimal çözüm ne olurdu? (Notlarda yok; aynı aday listesi.)`,
      options: [`x* = 4, f = −3`, `x* = 1, f = 2`, `x* = 3, f = −2`, `x* = 0, f = 1`],
      answer: 0,
      explain: `Aynı aday değerler: 2, 1, −2, −3, −2, 1. En küçüğü <b>−3</b> ve x = 4'te (2. parçanın stationary noktası). x = 3 (−2) daha büyüktür. Uç ve stationary noktalardan en iyisi, amaç yönüne göre seçilir.`,
    },
    {
      q: `<code>max f(x) = x³ − 3x  s.t. 0 ≤ x ≤ 3</code> probleminin çözümü nedir? (Bizim örnek.)`,
      options: [`x* = 3, f = 18`, `x* = 1, f = −2`, `x* = 0, f = 0`, `x* = −1, f = 2`],
      answer: 0,
      hint: `f' = 3x² − 3 = 0 ⇒ x = ±1; x = −1 aralık dışında. Uçları unutmayın.`,
      explain: `Stationary: 3x² − 3 = 0 ⇒ x = 1 (x = −1 aralık dışında), f(1) = 1 − 3 = −2. Uçlar: f(0) = 0, f(3) = 27 − 9 = 18. Max <b>18</b> ve uç noktada (CASE 3). x = −1 aralığın dışında olduğundan aday değildir; x = 1 minimum adayıdır.`,
    },
    {
      q: `Bir fonksiyon <b>unimodal</b> ise hangi ifade doğrudur?`,
      options: [
        `En çok bir local maximum (veya en çok bir local minimum) vardır; convex/concave olmak zorunda değildir (convexity'den daha zayıf bir koşuldur).`,
        `Mutlaka convex'tir.`,
        `Mutlaka birden fazla local optimum içerir.`,
        `Türevlenebilir olmak zorundadır.`,
      ],
      answer: 0,
      explain: `Notlar: "Unimodality is a weaker requirement than convexity or concavity. A unimodal objective function need not be either convex or concave." Strict concave (max) ve strict convex (min) amaçlar unimodaldır. GSS'nin avantajı türev gerektirmemesidir.`,
    },
    {
      q: `GSS'de [a, b] = [0, 10] ve r = 0.618 için ilk iki nokta nedir?`,
      options: [
        `x<sub>1</sub> = 3.82,  x<sub>2</sub> = 6.18`,
        `x<sub>1</sub> = 6.18,  x<sub>2</sub> = 3.82`,
        `x<sub>1</sub> = 3.09,  x<sub>2</sub> = 6.91`,
        `x<sub>1</sub> = 5.00,  x<sub>2</sub> = 6.18`,
      ],
      answer: 0,
      explain: `x<sub>1</sub> = b − r(b − a) = 10 − 0.618·10 = <b>3.82</b>; x<sub>2</sub> = a + r(b − a) = 0 + 6.18 = <b>6.18</b>. x<sub>1</sub> &lt; x<sub>2</sub> olmalıdır (6.18 ve 3.82 yer değiştirmiş seçenek yanlış). 3.09 / 6.91 r = 0.691 gibi farklı bir oran gerektirir.`,
    },
    {
      q: `GSS'deki <b>r = 0.618</b> sayısı nereden gelir?`,
      options: [
        `r² + r = 1 denkleminin tek pozitif kökünden`,
        `r² = 1/2'den`,
        `r + 1 = 2'den`,
        `ln 2'den`,
      ],
      answer: 0,
      explain: `Notlar: "r = 0.618 [unique positive root of r² + r = 1]". r² + r − 1 = 0 ⇒ r = (−1 + √5)/2 = 0.618. Bu özellik sayesinde eski noktalardan biri yeni aralıkta da "golden" konumdadır ve yeniden kullanılabilir.`,
    },
    {
      q: `Max problemde GSS'de <b>f(x<sub>1</sub>) &lt; f(x<sub>2</sub>)</b> (x<sub>1</sub> &lt; x<sub>2</sub>) bulunursa yeni belirsizlik aralığı ve yeniden kullanılacak nokta nedir?`,
      options: [
        `(x<sub>1</sub>, b]; eski x<sub>2</sub> yeni LH nokta olur.`,
        `[a, x<sub>2</sub>); eski x<sub>1</sub> yeni RH nokta olur.`,
        `[a, x<sub>1</sub>); hiçbir nokta yeniden kullanılmaz.`,
        `(x<sub>2</sub>, b]; eski x<sub>2</sub> yeni sol uç olur ve yeniden kullanılmaz.`,
      ],
      answer: 0,
      explain: `Case 1: f(x<sub>1</sub>) &lt; f(x<sub>2</sub>) ⇒ x' ∈ (x<sub>1</sub>, b]; sol parça atılır. Eski x<sub>2</sub> yeni aralığın içindedir ve (golden özelliği sayesinde) yeni LH nokta konumundadır (Ex 4.17: x<sub>3</sub> = x<sub>2</sub>). Case 3'te (f(x<sub>1</sub>) &gt; f(x<sub>2</sub>)) sağ atılır ve eski x<sub>1</sub> yeni RH nokta olur.`,
    },
    {
      q: `Max problemde GSS'de <b>f(x<sub>1</sub>) = f(x<sub>2</sub>)</b> çıkarsa notlara göre x' hangi aralıkta aranır?`,
      options: [`[a, x<sub>2</sub>]`, `(x<sub>1</sub>, b]`, `[a, x<sub>1</sub>)`, `(x<sub>2</sub>, b]`],
      answer: 0,
      explain: `Notlar (Case 2): f(x<sub>1</sub>) = f(x<sub>2</sub>) ve x' ∈ [a, x<sub>2</sub>]. (Unimodal fonksiyonda eşit değerli iki nokta arasında maksimum vardır, yani aralığı sağdan kırpmak güvenlidir.)`,
    },
    {
      q: `<code>max −(x−2)²  s.t. 0 ≤ x ≤ 5</code> için GSS'nin 1. iterasyonu: x<sub>1</sub>, x<sub>2</sub>, f değerleri ve yeni aralık nedir? (r = 0.618)`,
      options: [
        `x<sub>1</sub> = 1.91, x<sub>2</sub> = 3.09, f(x<sub>1</sub>) = −0.0081, f(x<sub>2</sub>) = −1.1881; f(x<sub>1</sub>) &gt; f(x<sub>2</sub>) ⇒ [0, 3.09)`,
        `x<sub>1</sub> = 1.91, x<sub>2</sub> = 3.09; f(x<sub>1</sub>) &gt; f(x<sub>2</sub>) ⇒ (1.91, 5]`,
        `x<sub>1</sub> = 3.09, x<sub>2</sub> = 1.91; yeni aralık [0, 1.91)`,
        `x<sub>1</sub> = 1.91, x<sub>2</sub> = 3.09; f(x<sub>1</sub>) &lt; f(x<sub>2</sub>) ⇒ (1.91, 5]`,
      ],
      answer: 0,
      hint: `x<sub>1</sub> = 5 − 0.618·5, x<sub>2</sub> = 0.618·5; sonra f(x) = −(x−2)² değerlerini karşılaştırın.`,
      explain: `b − a = 5. x<sub>1</sub> = 5 − 3.09 = 1.91; x<sub>2</sub> = 0 + 3.09 = 3.09. f(1.91) = −(−0.09)² = −0.0081; f(3.09) = −(1.09)² = −1.1881. f(x<sub>1</sub>) &gt; f(x<sub>2</sub>) ⇒ Case 3: x' ∈ [a, x<sub>2</sub>) = <b>[0, 3.09)</b> (gerçek optimum x = 2 bu aralıktadır). Aralık uzunluğu 5 → 3.09 (= 0.618·5).`,
    },
    {
      q: `Önceki sorudaki problemin (max −(x−2)², [0, 5]) <b>2. iterasyonunda</b> aralık [0, 3.09) olur ve eski x<sub>1</sub> = 1.91 yeniden kullanılır. Hesaplanacak <b>yeni nokta</b> yaklaşık kaçtır?`,
      options: [`1.18  (= 3.09 − 0.618·3.09)`, `2.18`, `1.91`, `1.55`],
      answer: 0,
      explain: `Case 3 ⇒ eski x<sub>1</sub> = 1.91 yeni RH nokta (x<sub>2</sub>) olur. Yeni LH nokta: b' − r(b' − a') = 3.09 − 0.618·3.09 = 3.09 − 1.91 = <b>1.18</b>. f(1.18) = −0.6718, f(1.91) = −0.0081 ⇒ f(x<sub>LH</sub>) &lt; f(x<sub>RH</sub>) ⇒ sol atılır, yeni aralık (1.18, 3.09).`,
    },
    {
      q: `Ex 4.17'de ilk aralık [−1, 0.75] (uzunluk 1.75) ve hedef uzunluk &lt; 0.25 ise gereken GSS iterasyon sayısı kaçtır?`,
      options: [`5`, `4`, `6`, `7`],
      answer: 0,
      hint: `1.75·0.618<sup>k</sup> &lt; 0.25.`,
      explain: `0.618<sup>k</sup> &lt; 0.25/1.75 = 1/7 ⇒ k &gt; ln(1/7)/ln(0.618) = 4.04 (notlarda 4.06) ⇒ k = <b>5</b>. Kontrol: k = 4 için 1.75·0.618⁴ = 0.2553 &gt; 0.25 (yetmez), k = 5 için 0.1577 &lt; 0.25 ✓. Uzunluklar tablosu: 1.0815, 0.6684, 0.4130, 0.2552, 0.1577.`,
    },
    {
      q: `GSS ile ilk aralık uzunluğu 10 olan bir aralığı <b>1'den kısa</b> yapmak için en az kaç iterasyon gerekir?`,
      options: [`5`, `4`, `6`, `10`],
      answer: 0,
      explain: `10·0.618<sup>k</sup> &lt; 1 ⇒ k &gt; ln(0.1)/ln(0.618) = 4.78 ⇒ <b>5</b>. k = 4 → 10·0.1459 = 1.459 (yetmez); k = 5 → 0.902 &lt; 1 ✓.`,
    },
    {
      q: `Ex 4.17'nin (5 iterasyon) tamamında kaç <b>farklı</b> f(x) hesabı yapılır?`,
      options: [`6`, `10`, `5`, `9`],
      answer: 0,
      explain: `I. iterasyonda iki nokta (x<sub>1</sub>, x<sub>2</sub>) hesaplanır; II–V'de her seferinde bir nokta eskiden kalır (x<sub>3</sub> = x<sub>2</sub>, x<sub>6</sub> = x<sub>3</sub>, x<sub>8</sub> = x<sub>5</sub>, x<sub>9</sub> = x<sub>8</sub>), yalnızca bir yeni nokta hesaplanır: 2 + 4 = <b>6</b>. Notlardaki x<sub>1</sub>…x<sub>10</sub> gösterimi 10 etiket kullanır ama dört tanesi tekrar kullanılmış noktadır.`,
    },
    {
      q: `GSS hangi durumlarda tercih edilir ve hangi koşula ihtiyaç duyar?`,
      options: [
        `f'(x) yoksa ya da f'(x) = 0 çözmek zorsa; f'nin [a, b]'de unimodal olması gerekir.`,
        `Yalnızca çok değişkenli problemlerde; f'nin convex olması gerekir.`,
        `Yalnızca f'(x) = 0 kolay çözülüyorsa.`,
        `Yalnızca tamsayı değişkenlerde.`,
      ],
      answer: 0,
      explain: `Notlar: "It may be that f'(x) does not exist, or it may be difficult to solve the equation f'(x) = 0. In this case, the Golden Section Method can be used to solve NLP if the function is a unimodal function." GSS tek değişkenli, türev gerektirmeyen, aralık daraltan bir yöntemdir.`,
    },
    {
      q: `(Notlarda yok, ayna mantık) <b>Min</b> problemde GSS'de f(x<sub>1</sub>) &lt; f(x<sub>2</sub>) bulunursa hangi parça atılır?`,
      options: [
        `Sağ parça: yeni aralık [a, x<sub>2</sub>)`,
        `Sol parça: yeni aralık (x<sub>1</sub>, b]`,
        `Hiçbir parça atılmaz.`,
        `Her iki uç da atılır.`,
      ],
      answer: 0,
      explain: `Notlardaki Case 1–3 max içindir. Min için f yerine −f düşünülür: f(x<sub>1</sub>) &lt; f(x<sub>2</sub>) ise minimum x<sub>1</sub> tarafındadır, yani x' ∈ [a, x<sub>2</sub>); sağ parça (x<sub>2</sub>, b] atılır. Yönler max'takinin tersidir.`,
    },
  ];

  /* ====================================================================== 4.6 */
  OR.content.summaries['4.6'] = `
<h2>4.6 Solving Unconstrained NLP</h2>
<p>Kısıtsız NLP'de analiz edilen şey amaç fonksiyonunun kendisidir. Analitik yaklaşımlar (4.6.1) ve sayısal yöntemler (gradient search 4.6.2, Newton 4.6.3) kullanılır.</p>

<h3>4.6.1 Local extremum analizi</h3>
<table>
  <tr><th>Koşul</th><th>İfade (notlar)</th></tr>
  <tr><td><b>First order necessary</b></td><td>Smooth (türevlenebilir) f'nin her unconstrained local optimumu bir <b>stationary point</b>'tir (∇f = 0).</td></tr>
  <tr><td><b>Second order necessary</b></td><td>Her unconstrained local <b>max</b>'ta H <b>negative semidefinite</b>; her local <b>min</b>'de H <b>positive semidefinite</b>.</td></tr>
  <tr><td><b>Sufficient (local)</b></td><td>Stationary point'te H <b>negative definite</b> ⇒ local max; H <b>positive definite</b> ⇒ local min.</td></tr>
  <tr><td><b>Sufficient (global)</b></td><td>f <b>convex</b> ⇒ her unconstrained local min global min; f <b>concave</b> ⇒ her local max global max.</td></tr>
</table>
<p><b>Yöntem:</b> (1) ∇f = 0'ı çöz → stationary point'ler. (2) Her birinde H'yi hesapla. (3) H'nin principal minor'larıyla sınıfla: PD → local min, ND → local max, 1. ve 2. mertebe işaretleri karışıksa (örn. det &lt; 0) → saddle. Minor'lar sıfır çıkarsa (semidefinite) sufficient koşul sağlanmaz: bu testle karar verilemez (bizim not: f = x⁴ ve f = x³ için x = 0'da H = 0, birincisi min, ikincisi extremum değil).</p>

<h4>Example 4.18</h4>
<p>f(x) = 20 − x² + 6x. f'(x) = −2x + 6 = 0 ⇒ x = 3 stationary. f''(x) = −2 &lt; 0 ⇒ f strictly concave ⇒ <b>x = 3 global maximum</b> (f(3) = 20 − 9 + 18 = 29).</p>

<h4>Example 4.19</h4>
<p>f(x, y) = x² − x²y + (y + 1)². Tüm local max, local min ve saddle point'leri bul.</p>
<ol>
  <li>f<sub>x</sub> = 2x − 2xy = 2x(1 − y) = 0;  f<sub>y</sub> = −x² + 2(y + 1) = 0.</li>
  <li>1. denklemden x = 0 veya y = 1. x = 0 ⇒ 2(y + 1) = 0 ⇒ y = −1: <b>(0, −1)</b>. y = 1 ⇒ x² = 4 ⇒ x = ±2: <b>(2, 1)</b> ve <b>(−2, 1)</b>.</li>
  <li>Hessian: f<sub>xx</sub> = 2(1 − y), f<sub>yy</sub> = 2, f<sub>xy</sub> = f<sub>yx</sub> = −2x ⇒ det H = 4(1 − y) − 4x² = 4 − 4y − 4x².</li>
</ol>
<table>
  <tr><th>Nokta</th><th>f<sub>xx</sub></th><th>det H</th><th>Sonuç</th></tr>
  <tr><td>(0, −1)</td><td>4 &gt; 0</td><td>4 + 4 − 0 = 8 &gt; 0</td><td><b>Local min</b> (f = 0)</td></tr>
  <tr><td>(2, 1)</td><td>0</td><td>4 − 4 − 16 = −16 &lt; 0</td><td><b>Saddle</b></td></tr>
  <tr><td>(−2, 1)</td><td>0</td><td>−16 &lt; 0</td><td><b>Saddle</b></td></tr>
</table>

<h4>Example 4.20 – Monopolistic Pricing (Winston 11.6)</h4>
<p>Müşteri 1 için fiyat 70 − 4q<sub>1</sub>, müşteri 2 için 150 − 15q<sub>2</sub>; q &gt; 0 için üretim maliyeti 100 + 15q. Kâr:</p>
<div class="model">f(q<sub>1</sub>, q<sub>2</sub>) = q<sub>1</sub>(70 − 4q<sub>1</sub>) + q<sub>2</sub>(150 − 15q<sub>2</sub>) − 100 − 15q<sub>1</sub> − 15q<sub>2</sub></div>
<ul>
  <li>f<sub>q1</sub> = 70 − 8q<sub>1</sub> − 15 = 0 ⇒ <b>q<sub>1</sub> = 55/8</b>;  f<sub>q2</sub> = 150 − 30q<sub>2</sub> − 15 = 0 ⇒ <b>q<sub>2</sub> = 9/2</b>.</li>
  <li>H = [[−8, 0], [0, −30]]: 1. minor'lar −8, −30 &lt; 0; 2. minor 240 &gt; 0 ⇒ negative definite ⇒ <b>local max</b> (f concave olduğu için global).</li>
  <li>Kâr = 292.1875 + 371.25 − 100 − 103.125 − 67.5 = <b>$392.81</b>.</li>
</ul>

<h3>4.6.2 Gradient Search (steepest ascent / descent)</h3>
<ul>
  <li><b>Gradient:</b> ∇f(x) = (∂f/∂x<sub>1</sub>, …, ∂f/∂x<sub>n</sub>). ∇f(x) ≠ 0 iken <b>Δx = ∇f(x)</b> max için, <b>Δx = −∇f(x)</b> min için <b>improving direction</b>'dır (1. derece Taylor, yeterince küçük adımda iyileşmeyi garanti eder).</li>
  <li>||x|| = (x<sub>1</sub>² + … + x<sub>n</sub>²)<sup>1/2</sup>; x/||x|| normalleştirilmiş vektör. Küçük bir δ mesafesinde f'nin en çok arttığı yön d = ∇f/||∇f||'dir (steepest ascent; min için steepest descent).</li>
  <li>Dezavantaj: stationary point'e yaklaşırken <b>zigzag</b> yapar, yavaş ve güvenilmez olabilir.</li>
</ul>
<div class="model">1. v<sub>0</sub>'dan başla.
2. v<sub>1</sub> = v<sub>0</sub> + t<sub>0</sub>∇f(v<sub>0</sub>),  t<sub>0</sub> çözümü:  max f(v<sub>0</sub> + t∇f(v<sub>0</sub>))  s.t. t ≥ 0     (min için −∇f ve min f)
3. ||∇f(v<sub>1</sub>)|| küçükse (&lt; 0.01) dur; v<sub>1</sub> stationary point'e yakın.
4. Değilse v<sub>1</sub>'den ∇f(v<sub>1</sub>) yönünde t<sub>1</sub> kadar git; ... ||∇f(v<sub>k</sub>)|| yeterince küçük olana kadar sürdür.</div>
<h4>Example 4.21 (Winston 11.7)</h4>
<p>max z = −(x<sub>1</sub> − 3)² − (x<sub>2</sub> − 2)², v<sub>0</sub> = (1, 1).</p>
<ol>
  <li>∇f = (−2(x<sub>1</sub> − 3), −2(x<sub>2</sub> − 2)) ⇒ ∇f(1, 1) = (4, 2).</li>
  <li>f(t<sub>0</sub>) = f(1 + 4t, 1 + 2t) = −(−2 + 4t)² − (−1 + 2t)².</li>
  <li>f'(t) = −8(−2 + 4t) − 4(−1 + 2t) = 20 − 40t = 0 ⇒ <b>t<sub>0</sub> = 0.5</b>.</li>
  <li>v<sub>1</sub> = (1, 1) + 0.5(4, 2) = <b>(3, 2)</b>; ∇f(3, 2) = (0, 0) ⇒ dur. f concave ⇒ <b>v* = (3, 2), z = 0</b>.</li>
</ol>
<p><b>Ek örnek (bizim, zigzag):</b> max −x<sub>1</sub>² − 2x<sub>2</sub>², v<sub>0</sub> = (2, 1). ∇f = (−2x<sub>1</sub>, −4x<sub>2</sub>) = (−4, −4). f(t) = −(2 − 4t)² − 2(1 − 4t)², f'(t) = 32 − 96t = 0 ⇒ t = 1/3 ⇒ v<sub>1</sub> = (2/3, −1/3). ∇f(v<sub>1</sub>) = (−4/3, 4/3) ≠ 0 ⇒ devam; v<sub>2</sub> = (2/9, 1/9): her adımda x<sub>2</sub> işaret değiştirir (zigzag), optimum (0, 0)'a yavaşça yaklaşır.</p>

<h3>4.6.3 Newton's Method</h3>
<ul>
  <li>Gradient search'ün yavaş zigzag ilerleyişini düzeltmek için 2. derece Taylor yaklaşımı kullanılır. <b>Newton step</b> Δx, f'nin 2. derece Taylor yaklaşımının stationary point'ine gider ve şu lineer sistemin çözümüdür:
    <div class="model">H(x<sup>(t)</sup>) Δx = −∇f(x<sup>(t)</sup>)       x<sup>(t+1)</sup> = x<sup>(t)</sup> + Δx</div></li>
  <li><b>Tek değişken:</b> Δx = −f'(x)/f''(x) (notlardaki formülde eksi işareti baskıda kaybolmuş; H Δx = −∇f'den çıkar).</li>
  <li>Durma: ||∇f(x<sup>(t)</sup>)|| &lt; toleransı.</li>
  <li>Local optimuma yakınsarsa genellikle gradient search'ten <b>çok daha az adımda</b> yakınsar. Dezavantaj: her iterasyonda hem 1. hem 2. türevleri hesaplamak ve lineer sistem çözmek gerekir; boyut büyüdükçe <b>hesap yükü</b> artar.</li>
</ul>
<h4>Example 4.22</h4>
<p>min f(x, y) = (x + 1)⁴ + xy + (y + 1)⁴, x<sup>0</sup> = (0, 1). Notlarda yalnızca problem verilir; aşağıdaki adımlar bizim hesabımızdır:</p>
<ul>
  <li>∇f = (4(x + 1)³ + y, x + 4(y + 1)³);  H = [[12(x + 1)², 1], [1, 12(y + 1)²]].</li>
  <li>x<sup>0</sup> = (0, 1): ∇f = (5, 32), H = [[12, 1], [1, 48]]; det = 575. 12Δ<sub>1</sub> + Δ<sub>2</sub> = −5, Δ<sub>1</sub> + 48Δ<sub>2</sub> = −32 ⇒ Δx = (−208/575, −379/575) ≈ (−0.3617, −0.6591) ⇒ <b>x<sup>1</sup> ≈ (−0.3617, 0.3409)</b>.</li>
  <li>Devam: x<sup>2</sup> ≈ (−0.5581, −0.0802), x<sup>3</sup> ≈ (−0.5640, −0.3313), x<sup>4</sup> ≈ (−0.5079, −0.4595), x<sup>5</sup> ≈ (−0.5010, −0.4968), x<sup>6</sup> ≈ (−0.5, −0.5): ∇f(−0.5, −0.5) = (4·0.125 − 0.5, −0.5 + 4·0.125) = (0, 0), H = [[3, 1], [1, 3]] positive definite ⇒ <b>local min</b>, f = 0.375.</li>
</ul>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li><b>Necessary</b> ≠ <b>sufficient</b>: stationary olmak yetmez (saddle olabilir); H'nin definite olması gerekir. Semidefinite (minor'lar 0) ise bu testle karar verilemez.</li>
  <li>Local min için H <b>positive</b> definite, local max için <b>negative</b> definite. 2 değişkenli pratik kural: det H &gt; 0 ve f<sub>xx</sub> &gt; 0 ⇒ min; det H &gt; 0 ve f<sub>xx</sub> &lt; 0 ⇒ max; det H &lt; 0 ⇒ saddle (Ex 4.19).</li>
  <li>Gradient search: max için <b>+∇f</b>, min için <b>−∇f</b>; adım uzunluğu t line search ile (tek değişkenli problem) bulunur; ∇f(v<sub>1</sub>) ⊥ ∇f(v<sub>0</sub>) olduğundan zigzag görülür.</li>
  <li>Newton step'te işarete dikkat: H Δx = <b>−</b>∇f. Kuadratik bir fonksiyonda Newton tek adımda stationary point'e gider (örn. f = (x − 3)² + 1, x<sup>0</sup> = 0: Δx = −(−6)/2 = 3).</li>
  <li>Gradient'in normu çok küçük çıkınca durulur (notlarda 0.01 eşiği); v* tam stationary point olmayabilir, yaklaşıktır.</li>
</ul></div>
`;

  OR.content.concepts['4.6'] = [
    {
      q: `Unconstrained smooth bir f için <b>first order necessary condition</b> nedir?`,
      options: [
        `Her unconstrained local optimum bir stationary point'tir (∇f = 0).`,
        `Her stationary point bir local optimumdur.`,
        `Her local optimumda Hessian positive definite'tir.`,
        `f convex olmalıdır.`,
      ],
      answer: 0,
      explain: `Notlar: "Every unconstrained local optimum of a smooth objective function must be a stationary point." Tersi yanlıştır: stationary point saddle olabilir (Ex 4.15, 4.19). Hessian koşulları 2. mertebe koşullardır; convexity ise global sonuç için gerekir.`,
    },
    {
      q: `<b>Second order necessary</b> koşullar hangileridir?`,
      options: [
        `Local max'ta H negative semidefinite`,
        `Local min'de H positive semidefinite`,
        `Local min'de H negative definite`,
        `Local max'ta H positive semidefinite`,
      ],
      answer: [0, 1],
      explain: `Notlar: "The Hessian matrix of a smooth function f is negative semidefinite at every unconstrained local maximum. The Hessian matrix is positive semidefinite at every unconstrained local minimum." Bunlar zorunlu koşullardır (≥ / ≤ ile); yeterli koşul definite (sıkı) olmayı ister. Diğer iki seçenek işaretleri ters verir.`,
    },
    {
      q: `Bir stationary point'te Hessian <b>negative definite</b> ise nokta nedir? <b>Positive definite</b> ise?`,
      options: [
        `Negative definite ⇒ local maximum; positive definite ⇒ local minimum.`,
        `Negative definite ⇒ local minimum; positive definite ⇒ local maximum.`,
        `Her ikisi de saddle point.`,
        `Her ikisi de global optimum.`,
      ],
      answer: 0,
      explain: `Notlardaki sufficient condition: stationary point'te H negative definite ⇒ unconstrained local max; positive definite ⇒ local min. Global olabilmesi için ayrıca f'nin concave (max) / convex (min) olması gerekir.`,
    },
    {
      q: `Ex 4.18: f(x) = 20 − x² + 6x. Unconstrained global optimum nedir?`,
      options: [
        `x = 3 global maximum, f(3) = 29`,
        `x = 3 global minimum, f(3) = 29`,
        `x = −3 global maximum, f = 29`,
        `x = 6 global maximum, f = 20`,
      ],
      answer: 0,
      hint: `f'(x) = −2x + 6, f''(x) = −2.`,
      explain: `f' = 0 ⇒ x = 3. f'' = −2 &lt; 0 ⇒ f strictly concave ⇒ stationary point global max'tır. f(3) = 20 − 9 + 18 = <b>29</b>. Concave fonksiyon için stationary point minimum olamaz.`,
    },
    {
      q: `Ex 4.19: f(x, y) = x² − x²y + (y + 1)². Kaç <b>stationary point</b> vardır ve nasıl sınıflanırlar?`,
      options: [
        `3 nokta: (0, −1) local min; (2, 1) ve (−2, 1) saddle`,
        `3 nokta: üçü de local min`,
        `2 nokta: (0, −1) local max, (2, 1) local min`,
        `1 nokta: (0, −1) global min`,
      ],
      answer: 0,
      hint: `f<sub>x</sub> = 2x(1 − y) = 0, f<sub>y</sub> = −x² + 2(y + 1) = 0.`,
      explain: `x = 0 ⇒ y = −1; y = 1 ⇒ x² = 4 ⇒ x = ±2: üç nokta. det H = 4 − 4y − 4x²: (0, −1) için 8 &gt; 0 ve f<sub>xx</sub> = 2(1 − y) = 4 &gt; 0 ⇒ local min; (±2, 1) için −16 &lt; 0 ⇒ saddle. (0, −1) global min de değildir (f yukarıdan ve aşağıdan sınırsız olabilir; örn. büyük y ve x için f çok negatif olur).`,
    },
    {
      q: `Ex 4.19'da (2, 1) noktasında f<sub>xx</sub>, f<sub>yy</sub>, f<sub>xy</sub> ve det H değerleri nedir?`,
      options: [
        `f<sub>xx</sub> = 0, f<sub>yy</sub> = 2, f<sub>xy</sub> = −4, det H = −16`,
        `f<sub>xx</sub> = 0, f<sub>yy</sub> = 2, f<sub>xy</sub> = 4, det H = 16`,
        `f<sub>xx</sub> = 4, f<sub>yy</sub> = 2, f<sub>xy</sub> = 0, det H = 8`,
        `f<sub>xx</sub> = 2, f<sub>yy</sub> = 2, f<sub>xy</sub> = −4, det H = −12`,
      ],
      answer: 0,
      explain: `f<sub>xx</sub> = 2(1 − y) = 0, f<sub>yy</sub> = 2, f<sub>xy</sub> = −2x = −4. det H = 0·2 − (−4)(−4) = <b>−16</b> ⇒ negatif ⇒ ne local min ne local max ⇒ saddle. (f<sub>xy</sub>² pozitif olduğundan det işareti f<sub>xy</sub>'nin işaretine bağlı değildir.)`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>² + x<sub>2</sub>² − 2x<sub>1</sub> − 4x<sub>2</sub> için stationary point ve sınıfı nedir? (Bizim örnek)`,
      options: [
        `(1, 2), local (ve convex olduğu için global) minimum, f = −5`,
        `(1, 2), local maximum, f = −5`,
        `(2, 4), saddle point`,
        `(1, 2), saddle point, f = 5`,
      ],
      answer: 0,
      explain: `∇f = (2x<sub>1</sub> − 2, 2x<sub>2</sub> − 4) = 0 ⇒ (1, 2). H = [[2, 0], [0, 2]]: minor'lar 2, 2, 4 &gt; 0 ⇒ positive definite ⇒ local min. f convex olduğundan global min; f(1, 2) = 1 + 4 − 2 − 8 = <b>−5</b>.`,
    },
    {
      q: `f(x<sub>1</sub>, x<sub>2</sub>) = x<sub>1</sub>² + 4x<sub>1</sub>x<sub>2</sub> + x<sub>2</sub>² için (0, 0) stationary point'i nedir?`,
      options: [
        `Saddle point (H = [[2, 4], [4, 2]], det = −12 &lt; 0)`,
        `Local minimum`,
        `Local maximum`,
        `Global minimum`,
      ],
      answer: 0,
      explain: `∇f = (2x<sub>1</sub> + 4x<sub>2</sub>, 4x<sub>1</sub> + 2x<sub>2</sub>) = (0, 0) ⇒ (0, 0). H = [[2, 4], [4, 2]] sabit; 1. mertebe minor'lar 2, 2 &gt; 0, ama det = 4 − 16 = −12 &lt; 0 ⇒ H indefinite ⇒ saddle. Gerçekten x<sub>1</sub> = x<sub>2</sub> doğrultusunda f = 6t² artar, x<sub>1</sub> = −x<sub>2</sub> doğrultusunda f = −2t² azalır.`,
    },
    {
      q: `f(x) = x⁴ için x = 0 stationary point'inde f''(0) = 0'dır. Notlardaki koşullarla ne söylenebilir?`,
      options: [
        `Second order necessary koşul (f'' ≥ 0) sağlanır ama sufficient koşul (f'' &gt; 0) sağlanmaz; bu testle karar verilemez (gerçekte x = 0 global min'dir).`,
        `f''(0) = 0 olduğu için x = 0 mutlaka saddle'dır.`,
        `x = 0 kesin olarak local max'tır.`,
        `x = 0 stationary point bile değildir.`,
      ],
      answer: 0,
      explain: `f' = 4x³ = 0 ⇒ x = 0. H = f''(0) = 0 positive semidefinite (necessary koşul tamam) ama positive definite değil ⇒ sufficient koşul çalışmaz. Aynı durum f = x³ için de geçerlidir (f''(0) = 0), fakat orada x = 0 ne min ne max. Bu örnek notlarda yok; semidefinite durumunun neden belirsiz kaldığını gösterir.`,
    },
    {
      q: `Ex 4.20 (Monopolistic Pricing): f = q<sub>1</sub>(70 − 4q<sub>1</sub>) + q<sub>2</sub>(150 − 15q<sub>2</sub>) − 100 − 15q<sub>1</sub> − 15q<sub>2</sub>. Optimal satış miktarları ve kâr nedir?`,
      options: [
        `q<sub>1</sub> = 55/8, q<sub>2</sub> = 9/2, kâr ≈ $392.81`,
        `q<sub>1</sub> = 70/8, q<sub>2</sub> = 5, kâr ≈ $400`,
        `q<sub>1</sub> = 55/8, q<sub>2</sub> = 9/2, kâr ≈ $492.81`,
        `q<sub>1</sub> = 9/2, q<sub>2</sub> = 55/8, kâr ≈ $392.81`,
      ],
      answer: 0,
      hint: `f<sub>q1</sub> = 70 − 8q<sub>1</sub> − 15 = 0, f<sub>q2</sub> = 150 − 30q<sub>2</sub> − 15 = 0.`,
      explain: `q<sub>1</sub> = 55/8 = 6.875, q<sub>2</sub> = 135/30 = 4.5. H = [[−8, 0], [0, −30]]: 1. minor'lar −8, −30 &lt; 0; 2. minor 240 &gt; 0 ⇒ negative definite ⇒ local max (f concave). Kâr: 6.875·42.5 + 4.5·82.5 − 100 − 103.125 − 67.5 = 292.1875 + 371.25 − 270.625 = <b>392.81</b>. Müşteri sırası ters verilirse (9/2, 55/8) yanlış olur.`,
    },
    {
      q: `<b>Gradient search</b> (steepest ascent/descent) için doğru ifadeler hangileridir?`,
      options: [
        `Max problemde improving direction Δx = +∇f(x)`,
        `Min problemde improving direction Δx = −∇f(x)`,
        `Stationary point'e yaklaşırken zigzag yapabilir, yavaştır`,
        `Her iterasyonda Hessian'ın tersini hesaplar`,
      ],
      answer: [0, 1, 2],
      explain: `Notlar: ∇f(x) ≠ 0 iken Δx = ∇f(x) max için, Δx = −∇f(x) min için improving direction'dır; zigzag nedeniyle yöntem çoğu uygulamada çok yavaş/güvenilmezdir. Hessian ve lineer sistem çözümü Newton yöntemine aittir, gradient search'e değil.`,
    },
    {
      q: `Gradient search'te adım uzunluğu t<sub>0</sub> nasıl bulunur ve ne zaman durulur?`,
      options: [
        `max f(v<sub>0</sub> + t∇f(v<sub>0</sub>)) s.t. t ≥ 0 tek değişkenli problemiyle; ||∇f|| yeterince küçükse (&lt; 0.01) durulur.`,
        `t sabit 1 alınır; f değişmeyene kadar sürdürülür.`,
        `t = ||∇f|| alınır.`,
        `t, Hessian'ın özdeğeriyle belirlenir.`,
      ],
      answer: 0,
      explain: `Notlar Step 2: v<sub>1</sub> = v<sub>0</sub> + t<sub>0</sub>∇f(v<sub>0</sub>), t<sub>0</sub> "max f(v<sub>0</sub> + t<sub>0</sub>∇f(v<sub>0</sub>)), s.t. t<sub>0</sub> ≥ 0" probleminin çözümüdür. Step 3–4: ||∇f(v<sub>1</sub>)|| küçükse (&lt; 0.01) algoritma durur.`,
    },
    {
      q: `Ex 4.21: max z = −(x<sub>1</sub> − 3)² − (x<sub>2</sub> − 2)², v<sub>0</sub> = (1, 1). ∇f(v<sub>0</sub>), t<sub>0</sub> ve v<sub>1</sub> nedir?`,
      options: [
        `∇f(1, 1) = (4, 2), t<sub>0</sub> = 0.5, v<sub>1</sub> = (3, 2) (∇f(v<sub>1</sub>) = 0, durur)`,
        `∇f(1, 1) = (−4, −2), t<sub>0</sub> = 0.5, v<sub>1</sub> = (−1, 0)`,
        `∇f(1, 1) = (4, 2), t<sub>0</sub> = 1, v<sub>1</sub> = (5, 3)`,
        `∇f(1, 1) = (2, 1), t<sub>0</sub> = 1, v<sub>1</sub> = (3, 2)`,
      ],
      answer: 0,
      explain: `∇f = (−2(x<sub>1</sub> − 3), −2(x<sub>2</sub> − 2)) ⇒ (4, 2). f(1 + 4t, 1 + 2t) = −(4t − 2)² − (2t − 1)²; f'(t) = 20 − 40t = 0 ⇒ t<sub>0</sub> = 0.5 ⇒ v<sub>1</sub> = (1 + 2, 1 + 1) = (3, 2). Bu noktada ∇f = (0, 0) ⇒ durulur; f concave olduğundan optimum z = 0. Max için −∇f yönüne gitmek (ikinci seçenek) f'yi azaltır.`,
    },
    {
      q: `Gradient search (max): f = −x<sub>1</sub>² − 2x<sub>2</sub>², v<sub>0</sub> = (2, 1). t<sub>0</sub> ve v<sub>1</sub> nedir? (Bizim örnek)`,
      options: [
        `∇f = (−4, −4), t<sub>0</sub> = 1/3, v<sub>1</sub> = (2/3, −1/3)`,
        `∇f = (−4, −4), t<sub>0</sub> = 1/2, v<sub>1</sub> = (0, −1)`,
        `∇f = (4, 4), t<sub>0</sub> = 1/3, v<sub>1</sub> = (10/3, 7/3)`,
        `∇f = (−4, −2), t<sub>0</sub> = 1/3, v<sub>1</sub> = (2/3, 1/3)`,
      ],
      answer: 0,
      hint: `f(t) = −(2 − 4t)² − 2(1 − 4t)²; türevini sıfırlayın.`,
      explain: `∇f = (−2x<sub>1</sub>, −4x<sub>2</sub>) = (−4, −4). f(t) = −(2 − 4t)² − 2(1 − 4t)², f'(t) = 8(2 − 4t) + 16(1 − 4t) = 32 − 96t = 0 ⇒ <b>t = 1/3</b>. v<sub>1</sub> = (2 − 4/3, 1 − 4/3) = (2/3, −1/3). ∇f(v<sub>1</sub>) = (−4/3, 4/3) ≠ 0 ⇒ devam; x<sub>2</sub> işaret değiştirdi: zigzag.`,
    },
    {
      q: `<b>Newton step</b> hangi denklemin çözümüdür ve güncelleme nasıldır?`,
      options: [
        `H(x<sup>(t)</sup>) Δx = −∇f(x<sup>(t)</sup>);  x<sup>(t+1)</sup> = x<sup>(t)</sup> + Δx`,
        `H(x<sup>(t)</sup>) Δx = ∇f(x<sup>(t)</sup>);  x<sup>(t+1)</sup> = x<sup>(t)</sup> − Δx²`,
        `Δx = ∇f(x<sup>(t)</sup>);  x<sup>(t+1)</sup> = x<sup>(t)</sup> + tΔx`,
        `Δx = −H(x<sup>(t)</sup>)∇f(x<sup>(t)</sup>)`,
      ],
      answer: 0,
      explain: `Notlar: Newton step f'nin 2. derece Taylor yaklaşımının stationary point'ine gider; H Δx = −∇f lineer sistemi çözülür ve x<sup>(k+1)</sup> = x<sup>(k)</sup> + Δx alınır. Tek değişkende Δx = −f'(x)/f''(x). Δx = ∇f gradient yöntemidir (ve adım uzunluğu ayrı aranır); H'nin kendisi değil tersi (H⁻¹) gerekir.`,
    },
    {
      q: `Tek değişkenli <code>min f(x) = x⁴</code>, x<sup>(0)</sup> = 1 için ilk <b>Newton adımı</b> sonrası x<sup>(1)</sup> kaçtır?`,
      options: [`2/3`, `1/3`, `0`, `4/3`],
      answer: 0,
      hint: `Δx = −f'/f'' ; f' = 4x³, f'' = 12x².`,
      explain: `f'(1) = 4, f''(1) = 12 ⇒ Δx = −4/12 = −1/3 ⇒ x<sup>(1)</sup> = 1 − 1/3 = <b>2/3</b>. (Her adımda x → 2x/3: yavaş, çünkü x = 0'da f'' = 0.) 4/3 işaret hatası (Δx = +f'/f'') ile çıkar.`,
    },
    {
      q: `f(x) = (x − 3)² + 1, x<sup>(0)</sup> = 0 için Newton yöntemi kaç adımda stationary point'e ulaşır?`,
      options: [
        `1 adımda: Δx = −(−6)/2 = 3 ⇒ x = 3 (kuadratik fonksiyon)`,
        `2 adımda`,
        `Hiç ulaşamaz`,
        `Sonsuz adımda yakınsar`,
      ],
      answer: 0,
      explain: `f' = 2(x − 3) = −6 ve f'' = 2 ⇒ Δx = 6/2 = 3 ⇒ x<sup>(1)</sup> = 3, f'(3) = 0. 2. derece Taylor yaklaşımı kuadratik fonksiyon için tam eşit olduğundan Newton step tam stationary point'e gider.`,
    },
    {
      q: `Ex 4.22'de (min f = (x+1)⁴ + xy + (y+1)⁴, x<sup>0</sup> = (0, 1)) gradient ve Hessian x<sup>0</sup>'da nedir?`,
      options: [
        `∇f = (5, 32);  H = [[12, 1], [1, 48]]`,
        `∇f = (4, 32);  H = [[12, 0], [0, 48]]`,
        `∇f = (5, 32);  H = [[12, 1], [1, 12]]`,
        `∇f = (1, 5);  H = [[48, 1], [1, 12]]`,
      ],
      answer: 0,
      hint: `f<sub>x</sub> = 4(x+1)³ + y, f<sub>y</sub> = x + 4(y+1)³; f<sub>xx</sub> = 12(x+1)², f<sub>xy</sub> = 1, f<sub>yy</sub> = 12(y+1)².`,
      explain: `f<sub>x</sub>(0, 1) = 4·1 + 1 = 5; f<sub>y</sub>(0, 1) = 0 + 4·8 = 32. f<sub>xx</sub> = 12·1 = 12, f<sub>yy</sub> = 12·4 = 48, f<sub>xy</sub> = f<sub>yx</sub> = 1 (xy teriminden). Newton: [[12,1],[1,48]]Δ = (−5, −32) ⇒ Δ = (−208/575, −379/575) ≈ (−0.3617, −0.6591) (bizim hesabımız; notlarda yalnızca problem verilir).`,
    },
    {
      q: `Newton yöntemi gradient search ile karşılaştırıldığında hangisi doğrudur?`,
      options: [
        `Local optimuma yakınsarsa genellikle çok daha az adımda yakınsar; fakat her adımda 2. türevler ve lineer sistem çözümü gerektirdiği için boyut büyüdükçe hesap yükü artar.`,
        `Yalnızca 1. türev kullanır, bu yüzden her zaman daha ucuzdur.`,
        `Zigzag davranışı gradient search'ten daha fazladır.`,
        `Global optimumu garanti eder.`,
      ],
      answer: 0,
      explain: `Notlar: "If Newton's method converges to a local optimum, it usually does so in many fewer steps than first order procedures such as gradient search." Ancak "Computing both first and second partial derivatives plus solving a linear system at each iteration makes Newton's method computationally burdensome as the dimension grows." Global optimum garantisi yoktur (yalnızca bir local optimuma yakınsayabilir).`,
    },
  ];

  /* ====================================================================== 4.7.1 */
  OR.content.summaries['4.7.1'] = `
<h2>4.7 Solving Constrained NLP · 4.7.1 Lagrange Multipliers</h2>
<p>Constrained NLP için literatürde: Lagrange multiplier yöntemleri, KKT koşulları, penalty ve barrier yöntemleri, reduced gradient, quadratic programming, separable programming gibi yöntemler vardır; derste temel olanlar işlenir (Lagrange ve KKT).</p>
<p>Lagrange yöntemi <b>yalnızca eşitlik kısıtlı</b> formatta uygulanır: <code>min veya max f(x)  s.t. g<sub>i</sub>(x) = b<sub>i</sub>,  i = 1, …, m</code> (aktif kabul edilen kısıtlar eşitlik gibi ele alınır).</p>

<h3>Lagrangian fonksiyonu</h3>
<div class="model">L(x, λ) = f(x) + Σ<sub>i</sub> λ<sub>i</sub> [ b<sub>i</sub> − g<sub>i</sub>(x) ]</div>
<p>λ<sub>i</sub> = i. kısıtın <b>Lagrange multiplier</b>'ı. Notlardaki işaret düzeni: (b<sub>i</sub> − g<sub>i</sub>(x)) şeklindedir (g − b değil).</p>

<h3>Lagrangian'ın stationary point'leri</h3>
<p>∇L(x*, λ*) = 0 olan noktalardır. (x*, λ*) şunları sağlıyorsa L'nin stationary point'idir:</p>
<div class="model">g<sub>i</sub>(x*) = b<sub>i</sub>                          her i için      (primal kısıtlar; ∂L/∂λ<sub>i</sub> = 0)
Σ<sub>i</sub> λ<sub>i</sub>* ∂g<sub>i</sub>/∂x<sub>j</sub> = ∂f/∂x<sub>j</sub>          her j için      (∇f = Σ λ<sub>i</sub>∇g<sub>i</sub>; ∂L/∂x<sub>j</sub> = 0)</div>
<ul>
  <li><b>Optimum point:</b> (x*, λ*) L'nin stationary point'i ve x*, L(x, λ*)'ın <b>unconstrained optimum</b>'u ise x*, eşitlik kısıtlı NLP'nin optimumudur. Pratikte: f concave (max) / convex (min) ve kısıtlar doğrusal ise yeter.</li>
  <li><b>λ<sub>i</sub>* yorumu:</b> optimum amaç değerinin b<sub>i</sub> sağ taraf sabitindeki <b>birim artışa</b> göre değişim hızı (shadow price): λ<sub>i</sub>* ≈ ∂z*/∂b<sub>i</sub>. Küçük Δb için z* değişimi ≈ λ*·Δb.</li>
  <li><b>Sınırlama:</b> Stationary koşulları ancak doğrusal ya da çok basit doğrusal-olmayan fonksiyonlar için çözülebilir; aksi halde bu koşulları çözmek orijinal modeli doğrudan aramaktan daha zor olabilir.</li>
</ul>

<h3>Example 4.23 – Advertising (Winston 11.8)</h3>
<p>Firma reklama $10 000 harcayacak. TV $3 000/dakika, radyo $1 000/dakika. x dakika TV, y dakika radyo için gelir (bin $): f(x, y) = −2x² − y² + xy + 8x + 3y. Geliri maksimize et.</p>
<div class="model">max z = −2x² − y² + xy + 8x + 3y
s.t. 3x + y = 10          (bin $)
L(x, y, λ) = −2x² − y² + xy + 8x + 3y + λ(10 − 3x − y)</div>
<ol>
  <li><b>L<sub>x</sub> = 0:</b> −4x + y + 8 − 3λ = 0  ⇒  y = 3λ − 8 + 4x</li>
  <li><b>L<sub>y</sub> = 0:</b> −2y + x + 3 − λ = 0  ⇒  x = λ − 3 + 2y</li>
  <li><b>L<sub>λ</sub> = 0:</b> 10 − 3x − y = 0 (kısıtı geri verir).</li>
  <li>x'i y'de yerine koy: y = 3λ − 8 + 4(λ − 3 + 2y) ⇒ −7y = 7λ − 20 ⇒ <b>y = 20/7 − λ</b>. Sonra x = λ − 3 + 2(20/7 − λ) = <b>19/7 − λ</b>.</li>
  <li>Kısıta koy: 10 − 3(19/7 − λ) − (20/7 − λ) = 0 ⇒ 10 − 77/7 + 4λ = 0 ⇒ 4λ = 1 ⇒ <b>λ = 1/4</b>.</li>
  <li><b>x = 69/28 ≈ 2.464, y = 73/28 ≈ 2.607</b> (kontrol: 3·69/28 + 73/28 = 280/28 = 10 ✓).</li>
  <li>Hessian: H = [[−4, 1], [1, −2]] ⇒ 1. minor'lar −4, −2 &lt; 0; 2. minor (−4)(−2) − 1·1 = 7 &gt; 0 ⇒ f <b>concave</b>; kısıt doğrusal ⇒ Lagrange yöntemi <b>optimal</b> çözümü verir.</li>
  <li><b>z = 15.017857</b> ⇒ gelir $15 017.86. Firma 69/28 dakika TV, 73/28 dakika radyo almalıdır.</li>
</ol>
<div class="box"><b>λ = 1/4 yorumu (bizim ek):</b> bütçe (b = 10, bin $) küçük bir Δb kadar artarsa gelir yaklaşık Δb/4 artar. Örn. b = 10.1 ⇒ z ≈ 15.0179 + 0.025 = 15.043 (tam hesap 15.0416). Büyük değişimde (Δb = 1) gerçek artış 0.125'tir, λ·Δb = 0.25 değildir: λ bir <i>hız</i>dır ve f concave olduğundan z*(b) eğrisi aşağı doğru bükülür.</div>

<h3>Bizim ek örnekler (notlarda yok)</h3>
<table>
  <tr><th>Problem</th><th>Çözüm</th></tr>
  <tr><td>max xy  s.t. x + y = 10</td><td>L = xy + λ(10 − x − y): y = λ, x = λ ⇒ x = y = 5, <b>λ = 5</b>, z = 25. (z*(b) = b²/4 ⇒ dz*/db = b/2 = 5 ✓)</td></tr>
  <tr><td>min x² + y²  s.t. x + y = 4</td><td>2x = λ, 2y = λ ⇒ x = y = 2, <b>λ = 4</b>, z = 8. (z*(b) = b²/2 ⇒ dz*/db = 4 ✓; b = 4.1 ⇒ z ≈ 8.4)</td></tr>
</table>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li>Lagrange yöntemi eşitlik kısıtları içindir; ≤ / ≥ kısıtlar için KKT (4.7.2).</li>
  <li>Notlardaki L: f + λ(<b>b − g</b>). Türev alırken −g'nin işaretine dikkat: Ex 4.23'te L<sub>x</sub> = ... <b>− 3λ</b>.</li>
  <li>Stationary point bulmak yetmez; optimal olduğunu söylemek için concavity (max) / convexity (min) ve kısıtların doğrusallığını kontrol edin (Ex 4.23'ün sonu).</li>
  <li>λ, b<sub>i</sub>'deki değişimin amaç değerine <b>marjinal</b> etkisidir (shadow price); işareti ve birimi kısıtın birimine göredir.</li>
</ul></div>
`;

  OR.content.concepts['4.7.1'] = [
    {
      q: `Notlardaki <b>Lagrangian fonksiyonu</b> eşitlik kısıtları g<sub>i</sub>(x) = b<sub>i</sub> için hangisidir?`,
      options: [
        `L(x, λ) = f(x) + Σ λ<sub>i</sub> [b<sub>i</sub> − g<sub>i</sub>(x)]`,
        `L(x, λ) = f(x) + Σ λ<sub>i</sub> [g<sub>i</sub>(x) − b<sub>i</sub>]`,
        `L(x, λ) = f(x) · Σ λ<sub>i</sub> g<sub>i</sub>(x)`,
        `L(x, λ) = Σ λ<sub>i</sub> [b<sub>i</sub> − g<sub>i</sub>(x)]`,
      ],
      answer: 0,
      explain: `Notlar: "L(x, λ) = f(x) + Σ<sub>i</sub> λ<sub>i</sub> [b<sub>i</sub> − g<sub>i</sub>(x)]". İşaret düzeni (b − g) önemlidir: gradient denklemi Σ λ<sub>i</sub>∇g<sub>i</sub> = ∇f çıkar ve λ, b<sub>i</sub>'deki artışın marjinal etkisi olur.`,
    },
    {
      q: `Lagrange multiplier yöntemi hangi tür modellere uygulanır?`,
      options: [
        `Eşitlik kısıtlı NLP'ler (g<sub>i</sub>(x) = b<sub>i</sub>); ≤ / ≥ kısıtlar için KKT gerekir.`,
        `Yalnızca ≤ kısıtlı NLP'ler.`,
        `Yalnızca kısıtsız NLP'ler.`,
        `Yalnızca tamsayı değişkenli NLP'ler.`,
      ],
      answer: 0,
      explain: `Notlar: "Lagrange multiplier solution techniques are most easily applied to models in equality constrained format… they consider only a set of constraints assumed active, which can be taken as equalities." Eşitsizlikler, complementary slackness ve işaret kısıtlı λ'larla KKT'de ele alınır (4.7.2).`,
    },
    {
      q: `Lagrangian L(x, λ)'nın <b>stationary point</b> koşulları (∇L = 0) hangileridir?`,
      options: [
        `g<sub>i</sub>(x*) = b<sub>i</sub> (her i)`,
        `Σ<sub>i</sub> λ<sub>i</sub>* ∂g<sub>i</sub>/∂x<sub>j</sub> = ∂f/∂x<sub>j</sub> (her j)`,
        `λ<sub>i</sub>* ≥ 0 (her i)`,
        `f(x*) = 0`,
      ],
      answer: [0, 1],
      explain: `∂L/∂λ<sub>i</sub> = b<sub>i</sub> − g<sub>i</sub>(x) = 0 kısıtı verir; ∂L/∂x<sub>j</sub> = ∂f/∂x<sub>j</sub> − Σ λ<sub>i</sub> ∂g<sub>i</sub>/∂x<sub>j</sub> = 0 gradient denklemini verir. Eşitlik kısıtlarında λ'ya işaret kısıtı yoktur (urs); λ ≥ 0 KKT'de eşitsizlikler içindir.`,
    },
    {
      q: `Ex 4.23: L = −2x² − y² + xy + 8x + 3y + λ(10 − 3x − y). <b>∂L/∂x = 0</b> denklemi nedir?`,
      options: [
        `−4x + y + 8 − 3λ = 0`,
        `−4x + y + 8 + 3λ = 0`,
        `−4x + y + 8 − λ = 0`,
        `−2x + y + 8 − 3λ = 0`,
      ],
      answer: 0,
      explain: `∂(−2x²)/∂x = −4x; ∂(xy)/∂x = y; ∂(8x)/∂x = 8; ∂[λ(10 − 3x − y)]/∂x = −3λ. Toplam: −4x + y + 8 − 3λ = 0. (∂L/∂y: −2y + x + 3 − λ = 0.) λ'nın katsayısı g'nin x'e göre türevidir (3), işareti b − g yüzünden negatiftir.`,
    },
    {
      q: `<code>max xy  s.t. x + y = 10</code> problemi için Lagrange yöntemiyle x, y, λ ve z nedir? (Bizim örnek)`,
      options: [
        `x = y = 5, λ = 5, z = 25`,
        `x = y = 5, λ = 10, z = 25`,
        `x = 10, y = 0, λ = 0, z = 0`,
        `x = y = 5, λ = 5, z = 10`,
      ],
      answer: 0,
      hint: `L = xy + λ(10 − x − y); L<sub>x</sub> = y − λ, L<sub>y</sub> = x − λ.`,
      explain: `L<sub>x</sub> = y − λ = 0, L<sub>y</sub> = x − λ = 0 ⇒ x = y = λ. Kısıt: 2λ = 10 ⇒ λ = 5 ⇒ x = y = 5, z = 25. Hessian [[0, 1], [1, 0]] indefinite olduğu için f concave değil, ama kısıt altında (y = 10 − x) f = 10x − x² concave'dir ⇒ nokta gerçekten maksimum. λ = 5 = dz*/db (z* = b²/4).`,
    },
    {
      q: `<code>min x² + y²  s.t. x + y = 4</code> için çözüm ve λ nedir? RHS 4'ten 4.1'e çıkarsa optimum değer <b>yaklaşık</b> ne olur?`,
      options: [
        `x = y = 2, λ = 4, z = 8; yaklaşık 8.4`,
        `x = y = 2, λ = 2, z = 8; yaklaşık 8.2`,
        `x = y = 4, λ = 8, z = 32; yaklaşık 32.8`,
        `x = y = 2, λ = 4, z = 8; yaklaşık 8.04`,
      ],
      answer: 0,
      hint: `2x = λ, 2y = λ. Küçük Δb için Δz ≈ λ·Δb.`,
      explain: `2x − λ = 0, 2y − λ = 0 ⇒ x = y = λ/2; x + y = 4 ⇒ λ = 4, x = y = 2, z = 8. Δb = 0.1 ⇒ Δz ≈ λΔb = 0.4 ⇒ z ≈ <b>8.4</b> (tam değer 4.1²/2 = 8.405).`,
    },
    {
      q: `Optimal Lagrange multiplier λ<sub>i</sub>*'ın notlardaki <b>yorumu</b> nedir?`,
      options: [
        `i. kısıtın sağ tarafı b<sub>i</sub> bir birim arttığında optimal amaç değerindeki değişim hızı (shadow price)`,
        `Optimal çözümde g<sub>i</sub>(x*)'ın değeri`,
        `Amaç fonksiyonunun x*'taki gradient normu`,
        `Kısıtın slack değişkeni`,
      ],
      answer: 0,
      explain: `Notlar: "The optimal Lagrange multiplier λ<sub>i</sub>* associated with constraint g<sub>i</sub>(x) = b<sub>i</sub> can be interpreted as the rate of change in optimal value per unit increase in RHS b<sub>i</sub>." LP'deki shadow price / dual değişkenin NLP'deki karşılığıdır.`,
    },
    {
      q: `Ex 4.23'ün sonucu hangisidir?`,
      options: [
        `λ = 1/4, x = 69/28 (TV), y = 73/28 (radyo), z ≈ 15.0179 (gelir ≈ $15 017.86)`,
        `λ = 1/4, x = 73/28, y = 69/28, z ≈ 15.0179`,
        `λ = 4, x = 69/28, y = 73/28, z ≈ 15.0179`,
        `λ = 1/4, x = 10/3, y = 0, z = 22.2`,
      ],
      answer: 0,
      hint: `3x + y = 10 ile kontrol edin: 3(69/28) + 73/28 = ?`,
      explain: `y = 20/7 − λ, x = 19/7 − λ ve kısıt ⇒ 4λ = 1 ⇒ λ = 1/4; x = 19/7 − 1/4 = 69/28, y = 20/7 − 1/4 = 73/28. 3·69/28 + 73/28 = 280/28 = 10 ✓. z = −2x² − y² + xy + 8x + 3y = 15.017857 (bin $). x ile y yer değiştirirse kısıt (3x + y = 10) bozulur: 3·73/28 + 69/28 = 288/28 ≠ 10.`,
    },
    {
      q: `Ex 4.23'te Lagrange yöntemi bulunan noktanın neden <b>optimal</b> olduğunu garanti eder?`,
      options: [
        `H = [[−4, 1], [1, −2]] için minor'lar −4, −2 &lt; 0 ve 7 &gt; 0 ⇒ f concave; kısıt 3x + y = 10 doğrusal.`,
        `Çünkü λ pozitif çıktı.`,
        `Çünkü x ve y pozitif çıktı.`,
        `Çünkü z = 15 tam sayıya yakın.`,
      ],
      answer: 0,
      explain: `Notlar: "Objective function is concave, Constraint is linear: Lagrange multiplier method yields optimal solution to the NLP." λ'nın işareti ya da x, y > 0 olması optimalite kanıtı değildir (eşitlik kısıtında λ urs'dir).`,
    },
    {
      q: `Lagrange yönteminin <b>sınırlaması</b> (notlar) hangisidir?`,
      options: [
        `Stationary koşulları yalnızca doğrusal ya da çok basit doğrusal olmayan durumlarda çözülebilir; aksi halde orijinal modeli doğrudan aramaktan zor olabilir.`,
        `Yalnızca iki değişkenli problemlerde kullanılabilir.`,
        `Her zaman birden fazla çözüm verir.`,
        `Yalnızca maksimizasyon problemlerinde çalışır.`,
      ],
      answer: 0,
      explain: `Notlar "Limitations of the Lagrangian Approach": "Stationary point conditions can be solved only if they are linear or very simple nonlinear functions. In other cases, solving these conditions may be more difficult than directly searching for an optimal solution to the original model." Değişken sayısı ya da min/max ayrımı bir sınırlama değildir.`,
    },
    {
      q: `"Optimum point" teoremine göre (x*, λ*) ne zaman eşitlik kısıtlı NLP'nin optimumunu verir?`,
      options: [
        `(x*, λ*) L'nin stationary point'i ve x*, L(x, λ*)'ın unconstrained optimum'u ise.`,
        `Yalnızca λ* &gt; 0 ise.`,
        `∇f(x*) = 0 ise.`,
        `Her stationary point için, ek koşul gerekmez.`,
      ],
      answer: 0,
      explain: `Notlar: "If (x*, λ*) is a stationary point of the Lagrangian function L(x, λ) and x* is an unconstrained optimum of L(x, λ*), then x* is an optimum of the corresponding equality constrained NLP." Sadece stationary olmak yetmez (saddle olabilir); ∇f(x*) = 0 koşulu kısıt altında gerekmez.`,
    },
  ];

  /* ====================================================================== 4.7.2 */
  OR.content.summaries['4.7.2'] = `
<h2>4.7.2 KKT Optimality Conditions</h2>
<p>Tarihçe (notlar): KKT koşullarını W. Karush 1939'da yüksek lisans tezinde geliştirdi; W. Kuhn ve A. Tucker bağımsız olarak 1951'de buldu. Lagrange yaklaşımı yalnızca eşitlik kısıtlarıyla ilgilenir; <b>KKT koşulları tam differentiable NLP</b>'yi ele alır:</p>
<div class="model">min veya max f(x)
s.t. g<sub>i</sub>(x) ≥ b<sub>i</sub>   i ∈ G
     g<sub>i</sub>(x) ≤ b<sub>i</sub>   i ∈ L
     g<sub>i</sub>(x) = b<sub>i</sub>   i ∈ E          (f ve tüm g<sub>i</sub> differentiable)</div>

<h3>KKT bileşenleri</h3>
<ol>
  <li><b>Gradient equation:</b> Σ<sub>i</sub> λ<sub>i</sub> ∇g<sub>i</sub>(x) = ∇f(x).</li>
  <li><b>Complementary slackness:</b> eşitsizlik kısıtları için λ<sub>i</sub> [b<sub>i</sub> − g<sub>i</sub>(x)] = 0. Yani kısıt ya aktiftir (g<sub>i</sub> = b<sub>i</sub>) ya da λ<sub>i</sub> = 0.</li>
  <li><b>Sign restrictions</b> (notlardaki tablo):
    <table>
      <tr><th>Amaç</th><th>kısıt ≤</th><th>kısıt ≥</th><th>kısıt =</th></tr>
      <tr><td><b>Minimize</b></td><td>λ<sub>i</sub> ≤ 0</td><td>λ<sub>i</sub> ≥ 0</td><td>urs</td></tr>
      <tr><td><b>Maximize</b></td><td>λ<sub>i</sub> ≥ 0</td><td>λ<sub>i</sub> ≤ 0</td><td>urs</td></tr>
    </table></li>
  <li><b>Primal constraints:</b> orijinal modelin kısıtları (feasibility).</li>
</ol>
<p>Bu dört koşulu sağlayan (x, λ)'ya <b>KKT point</b> denir (x için uygun bir λ bulunması yeterlidir).</p>

<h3>Necessity ve sufficiency</h3>
<ul>
  <li><b>Necessity:</b> constrained differentiable NLP'nin bir local optimumu şu koşullardan biri sağlanıyorsa <b>mutlaka</b> bir KKT point'tir: (a) tüm kısıtlar <b>doğrusal</b>, ya da (b) o noktada aktif kısıtların gradient'leri <b>linearly independent</b> (LICQ, Linear Independence Constraint Qualification). LI: Σ λ<sub>i</sub>x<sub>i</sub> = 0 ⇒ tüm λ<sub>i</sub> = 0.</li>
  <li><b>Sufficiency:</b> <b>convex program</b>'ın KKT point'i <b>global optimum</b>'dur.</li>
  <li><b>Convex program:</b> (i) f: min için <b>convex</b>, max için <b>concave</b>; (ii) ≥ kısıtın g<sub>i</sub>'si <b>concave</b>; (iii) ≤ kısıtın g<sub>i</sub>'si <b>convex</b>; (iv) eşitlik kısıtı <b>doğrusal</b>. (Notlarda baskı hatası: 4. madde "each g<sub>i</sub> of a ≥ constraint is linear" diye basılmıştır; doğrusu "= constraint is linear". Doğrusal fonksiyon hem convex hem concave olduğundan eşitlik kısıtı için doğrusallık gerekir.)</li>
</ul>

<h3>Example 4.24 – Monopolist (Winston 11.9)</h3>
<p>Bir monopolist en çok 20 oz kimyasalı $10/oz'dan alabilir. Kimyasal $3/oz ile ürün 1'e, $5/oz ile ürün 2'ye işlenir. x<sub>1</sub> oz ürün 1 için fiyat 30 − x<sub>1</sub>, x<sub>2</sub> oz ürün 2 için 50 − 2x<sub>2</sub>. x<sub>3</sub> = işlenen kimyasal.</p>
<div class="model">max z = x<sub>1</sub>(30 − x<sub>1</sub>) + x<sub>2</sub>(50 − 2x<sub>2</sub>) − 3x<sub>1</sub> − 5x<sub>2</sub> − 10x<sub>3</sub>
s.t. x<sub>1</sub> + x<sub>2</sub> − x<sub>3</sub> ≤ 0
     x<sub>3</sub> ≤ 20</div>
<p>Max problem, iki ≤ kısıt ⇒ tabloya göre <b>λ<sub>1</sub> ≥ 0, λ<sub>2</sub> ≥ 0</b>.</p>
<ul>
  <li><b>Gradient equation</b> (∇f = λ<sub>1</sub>∇g<sub>1</sub> + λ<sub>2</sub>∇g<sub>2</sub>; ∇f = (27 − 2x<sub>1</sub>, 45 − 4x<sub>2</sub>, −10), ∇g<sub>1</sub> = (1, 1, −1), ∇g<sub>2</sub> = (0, 0, 1)):
    <div class="model">30 − 2x<sub>1</sub> − 3 − λ<sub>1</sub> = 0
50 − 4x<sub>2</sub> − 5 − λ<sub>1</sub> = 0
−10 + λ<sub>1</sub> − λ<sub>2</sub> = 0</div></li>
  <li><b>Complementary slackness:</b> λ<sub>1</sub>(−x<sub>1</sub> − x<sub>2</sub> + x<sub>3</sub>) = 0;  λ<sub>2</sub>(20 − x<sub>3</sub>) = 0.</li>
  <li><b>Sign:</b> λ<sub>1</sub> ≥ 0, λ<sub>2</sub> ≥ 0.  <b>Primal:</b> x<sub>1</sub> + x<sub>2</sub> − x<sub>3</sub> ≤ 0, x<sub>3</sub> ≤ 20.</li>
</ul>
<p>2 eşitsizlik ⇒ <b>4 durum</b> (her λ için "= 0" veya "&gt; 0"):</p>
<table>
  <tr><th>Durum</th><th>Sonuç</th></tr>
  <tr><td>1: λ<sub>1</sub> = λ<sub>2</sub> = 0</td><td>3. denklem −10 = 0 olur ⇒ <b>sağlanamaz</b></td></tr>
  <tr><td>2: λ<sub>1</sub> = 0, λ<sub>2</sub> &gt; 0</td><td>3. denklem: λ<sub>2</sub> = −10 ⇒ λ<sub>2</sub> ≥ 0'ı <b>ihlal</b> eder</td></tr>
  <tr><td>3: λ<sub>1</sub> &gt; 0, λ<sub>2</sub> = 0</td><td>λ<sub>1</sub> = 10; x<sub>1</sub> = (27 − 10)/2 = <b>8.5</b>; x<sub>2</sub> = (45 − 10)/4 = <b>8.75</b>; kısıt 1 aktif ⇒ x<sub>3</sub> = x<sub>1</sub> + x<sub>2</sub> = <b>17.25</b> ≤ 20 ✓ ⇒ <b>KKT point = optimal</b></td></tr>
  <tr><td>4: λ<sub>1</sub> &gt; 0, λ<sub>2</sub> &gt; 0</td><td>x<sub>3</sub> = 20, x<sub>1</sub> = 31/3, x<sub>2</sub> = 29/3, λ<sub>1</sub> = 19/3, λ<sub>2</sub> = −11/3 &lt; 0 ⇒ ihlal (notlar: "no need to consider")</td></tr>
</table>
<p>Optimal: x<sub>1</sub> = 8.5, x<sub>2</sub> = 8.75, x<sub>3</sub> = 17.25, z = 8.5·21.5 + 8.75·32.5 − 3·8.5 − 5·8.75 − 10·17.25 = <b>225.375</b> (bizim hesabımız). f concave (H = diag(−2, −4, 0)), kısıtlar doğrusal ⇒ convex program ⇒ KKT point <b>global</b> optimumdur. λ<sub>1</sub> = 10 = kimyasalın marjinal değeri ($10/oz); λ<sub>2</sub> = 0 ⇒ 20 oz kapasite bağlayıcı değil.</p>

<h3>Bizim ek örnekler (notlarda yok; notlardaki işaret kurallarıyla)</h3>
<table>
  <tr><th>Problem</th><th>KKT çözümü</th></tr>
  <tr><td>min x<sub>1</sub>² + x<sub>2</sub>²  s.t. x<sub>1</sub> + x<sub>2</sub> ≥ 2 &nbsp;(min, ≥ ⇒ λ ≥ 0)</td><td>∇f = (2x<sub>1</sub>, 2x<sub>2</sub>) = λ(1, 1). λ = 0 ⇒ x = 0, infeasible. Aktif ⇒ x<sub>1</sub> = x<sub>2</sub> = λ/2, x<sub>1</sub> + x<sub>2</sub> = 2 ⇒ <b>x = (1, 1), λ = 2 ≥ 0 ✓, z = 2</b></td></tr>
  <tr><td>max −(x − 3)²  s.t. x ≤ 2 &nbsp;(max, ≤ ⇒ λ ≥ 0)</td><td>−2(x − 3) = λ. λ = 0 ⇒ x = 3, infeasible. Aktif x = 2 ⇒ λ = −2(2 − 3) = <b>2 ≥ 0 ✓</b>, z = −1</td></tr>
  <tr><td>min (x − 3)²  s.t. x ≤ 2 &nbsp;(min, ≤ ⇒ λ ≤ 0)</td><td>2(x − 3) = λ. x = 2 ⇒ λ = <b>−2 ≤ 0 ✓</b>, z = 1</td></tr>
  <tr><td>min (x − 1)²  s.t. x ≤ 2</td><td>Kısıt inaktif ⇒ complementary slackness ⇒ λ = 0 ⇒ x = 1, kısıt 1 ≤ 2 ✓</td></tr>
</table>
<div class="warnbox"><b>Sınavda dikkat</b>
<ul>
  <li><b>İşaret tablosu</b> (notlar): Max: ≤ ⇒ λ ≥ 0, ≥ ⇒ λ ≤ 0. Min: ≤ ⇒ λ ≤ 0, ≥ ⇒ λ ≥ 0. Eşitlik ⇒ urs. Hatırlatma: λ = ∂z*/∂b; max-≤'de b artınca bölge büyür, z* artar (λ ≥ 0); min-≥'de b artınca bölge küçülür, min z* artar (λ ≥ 0); min-≤ ve max-≥'de z* azalır (λ ≤ 0). Kısıtı −1 ile çarpıp yönünü çevirirseniz λ'nın işareti de değişir.</li>
  <li>Complementary slackness: λ<sub>i</sub> [b<sub>i</sub> − g<sub>i</sub>(x)] = 0. Kısıt aktif değilse λ = 0; λ &gt; 0 ise kısıt aktif.</li>
  <li>k eşitsizlik kısıtı ⇒ 2<sup>k</sup> durum (λ<sub>i</sub> = 0 ya da aktif). Ex 4.24'te 4 durum; yalnızca Durum 3 geçerli.</li>
  <li>KKT <b>gerekli</b> (LICQ veya doğrusal kısıtlarla) ve convex program için <b>yeterlidir</b>. Convex olmayan problemde KKT point local optimum, saddle ya da hatta optimum olmayan bir nokta olabilir.</li>
  <li>Hangi durumların denenmeyeceğini gerekçelendirin: bir durumda λ işaret kısıtını ihlal ediyorsa o durum elenir.</li>
</ul></div>
`;

  OR.content.concepts['4.7.2'] = [
    {
      q: `Notlardaki KKT <b>işaret kısıtları</b> tablosuna göre hangi eşleşmeler doğrudur?`,
      options: [
        `Maximize, ≤ kısıt ⇒ λ ≥ 0`,
        `Minimize, ≥ kısıt ⇒ λ ≥ 0`,
        `Minimize, ≤ kısıt ⇒ λ ≥ 0`,
        `Maximize, ≥ kısıt ⇒ λ ≥ 0`,
      ],
      answer: [0, 1],
      explain: `Notlar: Minimize: ≤ için λ ≤ 0, ≥ için λ ≥ 0, = için urs. Maximize: ≤ için λ ≥ 0, ≥ için λ ≤ 0, = için urs. Mantık λ = ∂z*/∂b: max-≤'de b artınca bölge büyür ve z* artar (λ ≥ 0); min-≥'de b artınca bölge küçülür ve en küçük z* artar (λ ≥ 0); min-≤ ve max-≥'de z* azalır (λ ≤ 0).`,
    },
    {
      q: `<b>Complementary slackness</b> koşulu nedir ve ne söyler?`,
      options: [
        `λ<sub>i</sub> [b<sub>i</sub> − g<sub>i</sub>(x)] = 0: eşitsizlik kısıtı ya aktiftir ya da λ<sub>i</sub> = 0.`,
        `Σ λ<sub>i</sub> = 0: multiplier'ların toplamı sıfırdır.`,
        `λ<sub>i</sub> = g<sub>i</sub>(x): multiplier kısıt değerine eşittir.`,
        `∇f(x) = 0: gradient sıfırdır.`,
      ],
      answer: 0,
      explain: `Notlar: "Either inequality constraints should be active at a local optimum or the corresponding Lagrange variable should be 0". Aktif olmayan (slack'li) kısıt amaç değerini etkilemez, bu yüzden shadow price'ı (λ) 0'dır. Kısıt aktifse (g = b) λ sıfırdan farklı olabilir.`,
    },
    {
      q: `Notlara göre bir (x, λ) çiftinin <b>KKT point</b> olması için hangileri sağlanmalıdır?`,
      options: [
        `Gradient equation: Σ λ<sub>i</sub>∇g<sub>i</sub>(x) = ∇f(x)`,
        `Complementary slackness koşulları`,
        `Sign restrictions (işaret kısıtları)`,
        `Primal constraints (modelin kısıtları)`,
      ],
      answer: [0, 1, 2, 3],
      explain: `Notlar "KKT Points": complementary slackness, sign restrictions, gradient equation ve primal constraints'in dördü birlikte sağlanmalıdır. Biri bile eksikse nokta KKT point değildir (örn. λ'nın yanlış işareti ya da kısıtı ihlal eden bir x).`,
    },
    {
      q: `Constrained differentiable NLP'nin bir local optimumunun <b>mutlaka KKT point</b> olması (necessity) için notlardaki koşullar hangileridir?`,
      options: [
        `Tüm kısıtlar doğrusal, ya da o noktada aktif kısıtların gradient'leri linearly independent (LICQ)`,
        `Amaç fonksiyonu convex`,
        `Tüm değişkenler pozitif`,
        `Yalnızca bir kısıt bulunması`,
      ],
      answer: 0,
      explain: `Notlar "Necessity of KKT Conditions": all constraints are linear OR the gradients of all constraints active at the local optimum are linearly independent. Convexity ise <b>sufficiency</b> (KKT ⇒ global optimum) için gerekir; necessity için değildir.`,
    },
    {
      q: `Bir KKT point'in <b>global optimum</b> olmasını garanti eden koşul (sufficiency) nedir?`,
      options: [
        `Problem bir convex program'dır: f min için convex / max için concave; ≥ kısıtlarda g concave, ≤ kısıtlarda g convex, eşitlikler doğrusal.`,
        `Problemde en az bir kısıt aktiftir.`,
        `Tüm λ<sub>i</sub> sıfırdır.`,
        `x* tamsayıdır.`,
      ],
      answer: 0,
      explain: `Notlar: "If x is a KKT point of a convex program, x is a global optimum." Convex program: f convex (min) / concave (max); ≥ kısıtlar için g<sub>i</sub> concave; ≤ kısıtlar için g<sub>i</sub> convex; eşitlik kısıtları doğrusal (notlarda son madde baskıda "≥ constraint is linear" olarak geçer; notlarda baskı hatası: doğrusu "= constraint").`,
    },
    {
      q: `Ex 4.24'te (max z, iki ≤ kısıt) gradient equation'ın <b>üçüncü</b> satırı −10 + λ<sub>1</sub> − λ<sub>2</sub> = 0'dır. Bu satır nereden gelir?`,
      options: [
        `x<sub>3</sub>'e göre: ∂f/∂x<sub>3</sub> = −10 = λ<sub>1</sub>·(−1) + λ<sub>2</sub>·(1)`,
        `x<sub>1</sub>'e göre: ∂f/∂x<sub>1</sub> = 27 − 2x<sub>1</sub>`,
        `Complementary slackness'ten`,
        `Sign restriction'dan`,
      ],
      answer: 0,
      hint: `∇g<sub>1</sub> = (1, 1, −1), ∇g<sub>2</sub> = (0, 0, 1).`,
      explain: `Σ λ<sub>i</sub>∇g<sub>i</sub> = ∇f'nin 3. bileşeni: λ<sub>1</sub>(−1) + λ<sub>2</sub>(1) = −10 ⇒ −10 + λ<sub>1</sub> − λ<sub>2</sub> = 0. İlk iki satır: λ<sub>1</sub> = 27 − 2x<sub>1</sub> (= 30 − 2x<sub>1</sub> − 3) ve λ<sub>1</sub> = 45 − 4x<sub>2</sub> (= 50 − 4x<sub>2</sub> − 5).`,
    },
    {
      q: `Ex 4.24'te toplam kaç durum (case) incelenir ve neden?`,
      options: [
        `4: iki eşitsizlik kısıtı için λ<sub>i</sub> = 0 veya λ<sub>i</sub> &gt; 0 kombinasyonları (2²)`,
        `2: her kısıt için bir durum`,
        `3`,
        `8`,
      ],
      answer: 0,
      explain: `Complementary slackness nedeniyle her eşitsizlik kısıtı ya aktif (λ &gt; 0 olabilir) ya da λ = 0'dır. 2 kısıt ⇒ 2² = 4 durum: (0,0), (0,+), (+,0), (+,+). Notlar bunları Case 1–4 diye sıralar.`,
    },
    {
      q: `Ex 4.24'te <b>Case 1</b> (λ<sub>1</sub> = λ<sub>2</sub> = 0) ve <b>Case 2</b> (λ<sub>1</sub> = 0, λ<sub>2</sub> &gt; 0) neden elenir?`,
      options: [
        `Case 1: −10 + λ<sub>1</sub> − λ<sub>2</sub> = 0 denklemi −10 = 0 olur (imkânsız). Case 2: λ<sub>2</sub> = −10 çıkar ve λ<sub>2</sub> ≥ 0 işaret kısıtını ihlal eder.`,
        `Her ikisi de x<sub>3</sub> ≤ 20'yi ihlal eder.`,
        `Case 1: x<sub>1</sub> negatif çıkar. Case 2: λ<sub>2</sub> = 10 çıkar.`,
        `İkisi de optimal çözümü verir.`,
      ],
      answer: 0,
      explain: `3. gradient denklemi −10 + λ<sub>1</sub> − λ<sub>2</sub> = 0: λ<sub>1</sub> = λ<sub>2</sub> = 0 ⇒ −10 = 0 (çelişki). λ<sub>1</sub> = 0 ⇒ λ<sub>2</sub> = −10 &lt; 0, max/≤ için λ<sub>2</sub> ≥ 0 gerekir ⇒ ihlal. Notlar: "Case 1 violates −10 + λ<sub>1</sub> − λ<sub>2</sub> = 0; Case 2: λ<sub>2</sub> = −10 violates λ<sub>2</sub> ≥ 0".`,
    },
    {
      q: `Ex 4.24'ün Case 3'ünde (λ<sub>1</sub> &gt; 0, λ<sub>2</sub> = 0) çözüm nedir?`,
      options: [
        `λ<sub>1</sub> = 10, x<sub>1</sub> = 8.5, x<sub>2</sub> = 8.75, x<sub>3</sub> = 17.25`,
        `λ<sub>1</sub> = 10, x<sub>1</sub> = 8.75, x<sub>2</sub> = 8.5, x<sub>3</sub> = 17.25`,
        `λ<sub>1</sub> = 19/3, x<sub>1</sub> = 31/3, x<sub>2</sub> = 29/3, x<sub>3</sub> = 20`,
        `λ<sub>1</sub> = 0, x<sub>1</sub> = 13.5, x<sub>2</sub> = 11.25, x<sub>3</sub> = 24.75`,
      ],
      answer: 0,
      hint: `λ<sub>2</sub> = 0 ⇒ 3. denklem λ<sub>1</sub> = 10. Sonra 1. ve 2. denklemi x<sub>1</sub>, x<sub>2</sub> için çözün.`,
      explain: `λ<sub>2</sub> = 0 ⇒ −10 + λ<sub>1</sub> = 0 ⇒ λ<sub>1</sub> = 10. 27 − 2x<sub>1</sub> = 10 ⇒ x<sub>1</sub> = 8.5; 45 − 4x<sub>2</sub> = 10 ⇒ x<sub>2</sub> = 8.75. λ<sub>1</sub> &gt; 0 ⇒ kısıt 1 aktif ⇒ x<sub>3</sub> = x<sub>1</sub> + x<sub>2</sub> = 17.25 ≤ 20 ✓ (λ<sub>2</sub> = 0 ile uyumlu: kısıt 2 inaktif). 3. seçenek Case 4'ün ihlalli çözümüdür; 4. seçenek λ<sub>1</sub> = 0 (3. denklemle çelişir).`,
    },
    {
      q: `Ex 4.24'te <b>Case 4</b> (x<sub>3</sub> = 20) için λ<sub>1</sub> = 19/3, λ<sub>2</sub> = −11/3 bulunur. Sonuç nedir?`,
      options: [
        `λ<sub>2</sub> &lt; 0 olduğundan λ<sub>2</sub> ≥ 0 işaret kısıtı ihlal edilir; bu durum KKT point vermez.`,
        `KKT point'tir; daha iyi bir çözüm bulunmuştur.`,
        `Complementary slackness ihlal edilir.`,
        `x<sub>3</sub> ≤ 20 ihlal edilir.`,
      ],
      answer: 0,
      hint: `λ<sub>2</sub> = λ<sub>1</sub> − 10.`,
      explain: `x<sub>3</sub> = 20 ve x<sub>1</sub> + x<sub>2</sub> = 20 iken x<sub>1</sub> = (27 − λ<sub>1</sub>)/2, x<sub>2</sub> = (45 − λ<sub>1</sub>)/4 toplamı 20 olacak şekilde λ<sub>1</sub> = 19/3; x<sub>1</sub> = 31/3, x<sub>2</sub> = 29/3. 3. denklemden λ<sub>2</sub> = λ<sub>1</sub> − 10 = −11/3 &lt; 0. Max/≤ için λ<sub>2</sub> ≥ 0 gerekir ⇒ ihlal. Complementary slackness (x<sub>3</sub> = 20 aktif) ve primal kısıtlar sağlanır; bozulan yalnızca işaret kısıtıdır.`,
    },
    {
      q: `Ex 4.24'ün KKT point'i (8.5, 8.75, 17.25) neden <b>global</b> optimumdur ve z kaçtır?`,
      options: [
        `f concave (H = diag(−2, −4, 0)) ve kısıtlar doğrusal ⇒ convex program; z = 225.375.`,
        `Çünkü λ<sub>1</sub> = 10 tamsayı; z = 225.375.`,
        `Çünkü f convex; z = 225.375.`,
        `Global olduğu garanti edilemez; z = 225.375.`,
      ],
      answer: 0,
      explain: `f = x<sub>1</sub>(30 − x<sub>1</sub>) + x<sub>2</sub>(50 − 2x<sub>2</sub>) − 3x<sub>1</sub> − 5x<sub>2</sub> − 10x<sub>3</sub>; Hessian köşegen (−2, −4, 0) ⇒ negative semidefinite ⇒ concave. İki kısıt doğrusal (hem convex hem concave). Max, concave f ⇒ convex program ⇒ KKT point global optimum. z = 8.5·21.5 + 8.75·32.5 − 25.5 − 43.75 − 172.5 = 225.375.`,
    },
    {
      q: `<code>min x<sub>1</sub>² + x<sub>2</sub>²  s.t. x<sub>1</sub> + x<sub>2</sub> ≥ 2</code> için KKT çözümü nedir? (Bizim örnek; notlardaki min/≥ ⇒ λ ≥ 0.)`,
      options: [
        `x = (1, 1), λ = 2, z = 2`,
        `x = (1, 1), λ = −2, z = 2`,
        `x = (0, 0), λ = 0, z = 0`,
        `x = (2, 0), λ = 4, z = 4`,
      ],
      answer: 0,
      hint: `∇f = λ∇g: (2x<sub>1</sub>, 2x<sub>2</sub>) = λ(1, 1). λ = 0 durumunu da deneyin.`,
      explain: `λ = 0 ⇒ x = (0, 0), 0 + 0 ≥ 2 sağlanmaz (infeasible). Kısıt aktif: 2x<sub>1</sub> = 2x<sub>2</sub> = λ ⇒ x<sub>1</sub> = x<sub>2</sub> = 1, λ = 2 ≥ 0 ✓ (min, ≥). f convex, kısıt doğrusal ⇒ global min, z = 2. (2, 0) için 2x<sub>1</sub> = 4 = λ ve 2x<sub>2</sub> = 0 = λ aynı anda sağlanamaz ⇒ KKT değil.`,
    },
    {
      q: `<code>max −(x−3)²  s.t. x ≤ 2</code> için KKT'de x* ve λ nedir? <code>min (x−3)²  s.t. x ≤ 2</code> için λ'nın işareti ne olur? (Bizim örnek.)`,
      options: [
        `Max: x* = 2, λ = 2 ≥ 0 (max, ≤). Min: x* = 2, λ = −2 ≤ 0 (min, ≤).`,
        `Max: x* = 3, λ = 0. Min: x* = 3, λ = 0.`,
        `Max: x* = 2, λ = −2. Min: x* = 2, λ = 2.`,
        `İkisinde de x* = 2 ve λ = 2.`,
      ],
      answer: 0,
      explain: `Her iki problemde x = 3 infeasible (λ = 0 durumu elenir), kısıt aktif: x = 2. Max: ∇f = −2(x − 3) = 2 = λ·1 ⇒ λ = 2 ≥ 0 ✓ (max, ≤). Min: ∇f = 2(x − 3) = −2 = λ ⇒ λ = −2 ≤ 0 ✓ (min, ≤). Amaç işareti değiştiği için λ'nın işareti de değişir, tablo bunu yansıtır.`,
    },
    {
      q: `<code>min (x − 1)²  s.t. x ≤ 2</code> KKT çözümü nedir?`,
      options: [
        `x = 1, λ = 0 (kısıt inaktif; complementary slackness)`,
        `x = 2, λ = −2`,
        `x = 2, λ = 2`,
        `x = 1, λ = 1`,
      ],
      answer: 0,
      explain: `λ = 0 denenir: 2(x − 1) = 0 ⇒ x = 1, kısıt 1 ≤ 2 sağlanır, λ(2 − 1) = 0 ✓, λ = 0 işaret kısıtını da sağlar (min/≤: λ ≤ 0). Kısıt aktif olmadığı için λ &gt; 0 / λ &lt; 0 olamaz; complementary slackness λ = 0 gerektirir.`,
    },
    {
      q: `<code>min x<sub>1</sub>² + x<sub>2</sub>²  s.t. x<sub>1</sub> + x<sub>2</sub> ≥ 2</code> için x = (2, 0) feasible ve kısıt aktif bir noktadır. KKT point mi?`,
      options: [
        `Hayır: ∇f(2, 0) = (4, 0) = λ(1, 1) hiçbir λ için sağlanamaz.`,
        `Evet: λ = 4.`,
        `Evet: λ = 0.`,
        `Hayır: çünkü x<sub>2</sub> = 0 olamaz.`,
      ],
      answer: 0,
      explain: `Gradient equation: (4, 0) = λ(1, 1) ⇒ λ = 4 ve λ = 0 aynı anda gerekir, imkânsız. Feasible ve aktif olmak yetmez; gradient denklemi sağlanmalıdır. (Nitekim f(2, 0) = 4 &gt; f(1, 1) = 2.) x<sub>2</sub> = 0 bu modelde yasak değildir.`,
    },
    {
      q: `Eşitlik kısıtı (g<sub>i</sub>(x) = b<sub>i</sub>) için KKT'de λ<sub>i</sub> hakkında ne söylenir?`,
      options: [
        `urs (işaret kısıtı yok); complementary slackness da gerekmez çünkü kısıt her zaman aktiftir.`,
        `λ<sub>i</sub> ≥ 0`,
        `λ<sub>i</sub> ≤ 0`,
        `λ<sub>i</sub> = 0`,
      ],
      answer: 0,
      explain: `Notlardaki tabloda eşitlik sütunu hem Minimize hem Maximize için "urs"dur. Eşitlik kısıtı daima aktif olduğundan λ<sub>i</sub>[b<sub>i</sub> − g<sub>i</sub>(x)] = 0 zaten sağlanır; yalnızca eşitsizlikler için yeni bir koşul getirir.`,
    },
    {
      q: `KKT yöntemi ile Lagrange yöntemi arasındaki fark nedir?`,
      options: [
        `Lagrange yalnızca eşitlik kısıtlarını ele alır; KKT eşitsizlikleri de (complementary slackness ve λ işaret kısıtlarıyla) kapsar.`,
        `Lagrange eşitsizlikleri, KKT eşitlikleri ele alır.`,
        `KKT yalnızca kısıtsız problemler içindir.`,
        `İkisi aynıdır.`,
      ],
      answer: 0,
      explain: `Notlar: "Lagrangian Approach deals only with equality constraints. KKT conditions address the full differentiable NLP." Eşitlik kısıtlarında KKT, Lagrange'ın stationary koşullarına iner (λ urs).`,
    },
    {
      q: `LICQ (Linear Independence Constraint Qualification) neyi ifade eder? (Notlardaki tanım)`,
      options: [
        `Aktif kısıtların gradient vektörlerinin linearly independent olması: Σ λ<sub>i</sub>x<sub>i</sub> = 0 ⇒ tüm λ<sub>i</sub> = 0.`,
        `Amaç fonksiyonunun gradient'inin sıfır olması.`,
        `Tüm kısıtların doğrusal olması.`,
        `Hessian'ın positive definite olması.`,
      ],
      answer: 0,
      explain: `Notlar: "A collection of vectors x<sub>1</sub>, …, x<sub>k</sub> is considered LI if Σ λ<sub>i</sub>x<sub>i</sub> = 0 implies that λ<sub>i</sub> = 0 for all i's." LICQ, o noktada aktif kısıtların gradient'lerinin LI olması demektir ve KKT'nin necessity koşullarından biridir (diğeri: tüm kısıtlar doğrusal).`,
    },
  ];

  /* ====================================================================== Cheatsheet Ch.4 */
  OR.content.cheatsheet += `
<h3>Ch.4 – Nonlinear Programming (NLP)</h3>
<table>
  <tr><th>Konu</th><th>Formül / kural</th></tr>
  <tr><td><b>NLP</b></td><td>max/min f(x) s.t. g<sub>i</sub>(x) (≤,=,≥) b<sub>i</sub>; f veya bir g<sub>i</sub> doğrusal değil. LP ⊂ NLP. Optimum köşe olmak zorunda değil (sınırda ya da iç nokta); birden çok local optimum olabilir.</td></tr>
  <tr><td><b>Calculus</b></td><td>f(a+Δ) ≈ f(a) + Δf'(a) · Taylor: f(a+h) = f(a) + h f'(a) + h²/2! f''(a) + … + h<sup>n+1</sup>/(n+1)! f<sup>(n+1)</sup>(p) · ∇f = (∂f/∂x<sub>i</sub>) · H = [∂²f/∂x<sub>i</sub>∂x<sub>j</sub>], f<sub>ij</sub> = f<sub>ji</sub></td></tr>
  <tr><td><b>Convex set</b></td><td>λx + (1−λ)y ∈ S ∀ x,y∈S, λ∈[0,1]. Doğrusal kısıtlar ⇒ convex. Extreme point: hiçbir doğru parçasının orta noktası olmayan nokta.</td></tr>
  <tr><td><b>Convex / concave f</b></td><td>convex: f[λx'+(1−λ)x''] ≤ λf(x')+(1−λ)f(x''); concave: ≥. Tek değişken: f'' ≥ 0 convex, f'' ≤ 0 concave (strict: &gt;, &lt;).</td></tr>
  <tr><td><b>Hessian testi</b></td><td>convex ⇔ <b>tüm</b> principal minor ≥ 0 (strict: &gt; 0). concave ⇔ k. mertebe minor'lar (−1)<sup>k</sup> işaretli (1.: ≤0, 2.: ≥0, 3.: ≤0 …; strict: &lt;0, &gt;0, &lt;0). 2×2 [[a,b],[b,c]]: det &lt; 0 ⇒ neither. n×n'de toplam principal minor sayısı 2<sup>n</sup>−1 (3×3: 7).</td></tr>
  <tr><td><b>Local / saddle</b></td><td>∇f = 0 (stationary). H negative definite ⇒ local max; positive definite ⇒ local min; ne PSD ne NSD ⇒ saddle. Necessary: local max ⇒ H NSD, local min ⇒ H PSD. Convex + convex region ⇒ local min = global min; concave ⇒ local max = global max (strict ⇒ unique).</td></tr>
  <tr><td><b>1-var [a,b]</b></td><td>Adaylar: f'(x)=0 (a&lt;x&lt;b), f' yok, uç noktalar a, b. En iyi f değeri seçilir.</td></tr>
  <tr><td><b>Golden Section</b></td><td>r = 0.618 (r²+r=1); x<sub>1</sub> = b − r(b−a), x<sub>2</sub> = a + r(b−a). max: f(x<sub>1</sub>)&lt;f(x<sub>2</sub>) ⇒ (x<sub>1</sub>,b]; f(x<sub>1</sub>)&gt;f(x<sub>2</sub>) ⇒ [a,x<sub>2</sub>); eşit ⇒ [a,x<sub>2</sub>]. Uzunluk × 0.618/iterasyon; k: L<sub>0</sub>·0.618<sup>k</sup> &lt; ε. Bir nokta yeniden kullanılır (ilk iterasyon 2, sonra 1 yeni f). Ex 4.17: 5 iterasyon, (−0.0762, 0.0815].</td></tr>
  <tr><td><b>Gradient search</b></td><td>max: v<sub>k+1</sub> = v<sub>k</sub> + t∇f(v<sub>k</sub>), t = argmax f(v<sub>k</sub>+t∇f), t ≥ 0 (min: −∇f). Dur: ||∇f|| &lt; 0.01. Zigzag, yavaş. Ex 4.21: t<sub>0</sub> = 0.5 ⇒ (3,2).</td></tr>
  <tr><td><b>Newton</b></td><td>H(x<sup>t</sup>) Δx = −∇f(x<sup>t</sup>); x<sup>t+1</sup> = x<sup>t</sup> + Δx. 1 değişken: Δx = −f'/f''. Az adım, adım başına pahalı. Kuadratik f ⇒ 1 adım.</td></tr>
  <tr><td><b>Lagrange</b></td><td>L = f + Σλ<sub>i</sub>[b<sub>i</sub> − g<sub>i</sub>(x)]; g<sub>i</sub> = b<sub>i</sub>, Σλ<sub>i</sub>∇g<sub>i</sub> = ∇f. λ<sub>i</sub> = ∂z*/∂b<sub>i</sub> (shadow price). Ex 4.23: λ = 1/4, (69/28, 73/28), z = 15.017857.</td></tr>
  <tr><td><b>KKT</b></td><td>(1) Σλ<sub>i</sub>∇g<sub>i</sub> = ∇f; (2) λ<sub>i</sub>[b<sub>i</sub> − g<sub>i</sub>(x)] = 0; (3) işaret: <b>Max</b>: ≤ ⇒ λ≥0, ≥ ⇒ λ≤0; <b>Min</b>: ≤ ⇒ λ≤0, ≥ ⇒ λ≥0; = ⇒ urs; (4) primal kısıtlar. Necessary: kısıtlar doğrusal veya LICQ. Sufficient: convex program (f convex-min / concave-max; ≥ için g concave; ≤ için g convex; = doğrusal) ⇒ KKT = global. k eşitsizlik ⇒ 2<sup>k</sup> durum. Ex 4.24: λ<sub>1</sub>=10, λ<sub>2</sub>=0, x=(8.5, 8.75, 17.25), z=225.375.</td></tr>
  <tr><td><b>PC</b></td><td>LINGO / Excel Solver calculus-based ⇒ local extremum'a takılabilir (global garanti yok).</td></tr>
</table>
<div class="warnbox"><b>Ch.4 tuzakları:</b> NLP optimumu köşede varsaymak · concave için "tüm minor negatif" demek (2×2 det pozitif olmalı) · leading minor'larla semidefinite karar vermek (tüm principal minor'lar gerekir) · stationary = optimum sanmak (saddle) · det H = 0 iken sınıflandırmak · GSS'de x<sub>1</sub>, x<sub>2</sub> formüllerini ve atılan tarafı karıştırmak · Newton'da Δx = H⁻¹∇f (işaret) · gradient search'te min için −∇f unutmak · KKT'de max/min için λ işaret tablosunu ters uygulamak · complementary slackness'ı atlamak · λ'yı büyük Δb için kesin değişim sanmak.</div>
`;
})();
