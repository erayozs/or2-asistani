<img src="assets/icon.svg" width="64" height="64" alt="">

# OR 2 Asistanı

İTÜ Yöneylem Araştırması II (Topcu & Kabak ders notları) için interaktif çalışma platformu.
> **Not:** Bu, Prof. Dr. Y. İlker Topcu & Prof. Dr. Özgür Kabak'ın *Operations Research II* ders notlarına dayanan
> **gayriresmî** bir çalışma aracıdır; hocalar veya İTÜ ile bağlantılı değildir. Notlardaki örneklerin çoğu
> Winston, *Operations Research: Applications and Algorithms* kaynaklıdır. Bu sitedeki özet ve sorularda hata olabilir;
> bir yerde emin olamazsan ders notlarını esas al.

Canlı: https://erayozs.github.io/or2-asistani/

Kapsam: ders notlarının tamamı — **Bölüm 1–2** (IP formülasyonu ve çözümü, Cutting Planes, Branch & Cut/Price), **Bölüm 3** Goal Programming, **Bölüm 4** Nonlinear Programming, **Bölüm 5** Interior Point, **Bölüm 6** Dynamic Programming.

## Açmak

Kurulum gerekmez: `index.html` dosyasını tarayıcıda açman yeterli.
Bağımlılık yok, internet gerekmez.

İstersen yerel sunucu ile de açabilirsin:

```sh
python3 -m http.server 8931   # sonra http://127.0.0.1:8931
```

## İçerik

| Bölüm | Ne var |
| --- | --- |
| 📖 Özet | Her konu için Türkçe özet (terimler İngilizce), notlardaki çözümlü örnekler, sınav tuzakları |
| ✅ Kavram Testi | Konu başına çoktan seçmeli sorular + açıklamalar |
| 🧮 Alıştırma | Her seferinde yeni sayılarla **üretilen** problemler; adım adım çözülür, her adım anında kontrol edilir |
| 🎯 Karışık Quiz | Seçilen konulardan rastgele kavram soruları + üretilmiş problemler |
| 📇 Formül Kartı | Tüm kapsamın tek sayfalık özeti |

Üretilen alıştırmalar: mantıksal 0-1 kısıtlar, fixed charge M değerleri, either-or / if-then, set covering,
piecewise linear (z/y), B&B (pure / mixed / binary / knapsack), B&B ağacı okuma, single-machine scheduling B&B,
TSP B&B (assignment + subtour), Nearest-Neighbor ve Cheapest-Insertion heuristic'leri, implicit enumeration,
Gomory cut + dual simplex, goal programming (formülasyon / grafik / GP simplex), convexity (Hessian minörleri),
tek değişkenli NLP, Hessian ile durağan nokta sınıflandırma, golden section, gradient search, Newton, Lagrange, KKT,
DP: network, resource allocation, knapsack, inventory, equipment replacement, Wagner-Whitin, Silver-Meal.
Çoğu alıştırmada "Ders notundaki örneği kullan" seçeneği notlardaki çözümlü örneği yükler.

Tüm LP çözümleri tam kesirli aritmetikle hesaplanır (`js/core/lp.js`); B&B motoru (`js/core/bnb.js`) notlardaki
örnekleri birebir üretir (Example 5–8). Alternatif optimumu / eşitliği olan problemler üretimde elenir, böylece her
sorunun tek doğru cevabı vardır.

Her problemin bir numarası (#seed) vardır; aynı bağlantı aynı problemi tekrar açar.
İlerleme tarayıcının `localStorage`'ında tutulur.

## Geliştirme / test

```sh
node tests/core.test.js        # LP + B&B motoru, notlardaki örneklerle
node tests/drills.test.js all 60   # tüm üreticiler × tüm seçenekler × 60 seed, yapı kontrolü
node tests/content.test.js     # özet / kavram sorusu / formül kartı kontrolü
```

Created in [T3 Code](https://t3.codes).
