/* Seeded RNG (mulberry32). Every generated exercise is reproducible from its seed. */
(function () {
  const OR = window.OR;
  OR.rng = function (seed) {
    let a = seed >>> 0;
    const r = function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.seed = seed;
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1)); // inclusive
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    r.shuffle = (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    };
    return r;
  };
  OR.newSeed = () => Math.floor(Math.random() * 1e9);
})();
