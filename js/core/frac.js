/* Exact rational arithmetic (BigInt) + tolerant user-answer parsing.
   OR.F(x) accepts Frac | number | bigint | "a/b" | "3.75" | "3,75". */
(function () {
  const OR = window.OR;

  const babs = (a) => (a < 0n ? -a : a);
  const gcd = (a, b) => {
    a = babs(a);
    b = babs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  };

  class Frac {
    constructor(n, d = 1n) {
      if (typeof n !== 'bigint') n = BigInt(n);
      if (typeof d !== 'bigint') d = BigInt(d);
      if (d === 0n) throw new Error('Frac: division by zero');
      if (d < 0n) {
        n = -n;
        d = -d;
      }
      const g = gcd(n, d) || 1n;
      this.n = n / g;
      this.d = d / g;
    }
    static of(x) {
      if (x instanceof Frac) return x;
      if (typeof x === 'bigint') return new Frac(x);
      if (typeof x === 'number') {
        if (Number.isInteger(x)) return new Frac(BigInt(x));
        const p = Frac.parse(String(x));
        if (p) return p;
        throw new Error('Frac.of: bad number ' + x);
      }
      if (typeof x === 'string') {
        const p = Frac.parse(x);
        if (p) return p;
      }
      throw new Error('Frac.of: cannot convert ' + x);
    }
    // Parses "15/4", "-3", "3.75", "3,75", "1.5/2". Returns null if invalid.
    static parse(s) {
      if (s == null) return null;
      s = String(s).trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/−/g, '-');
      if (s === '') return null;
      const dec = (t) => {
        const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(t);
        if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return null;
        const sign = m[1] === '-' ? -1n : 1n;
        const ip = m[2] || '0';
        const fp = m[3] || '';
        const n = BigInt(ip + fp) * sign;
        const d = 10n ** BigInt(fp.length);
        return new Frac(n, d);
      };
      if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length !== 2) return null;
        const a = dec(parts[0]);
        const b = dec(parts[1]);
        if (!a || !b || b.n === 0n) return null;
        return a.div(b);
      }
      return dec(s);
    }
    add(o) {
      o = Frac.of(o);
      return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
    }
    sub(o) {
      o = Frac.of(o);
      return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
    }
    mul(o) {
      o = Frac.of(o);
      return new Frac(this.n * o.n, this.d * o.d);
    }
    div(o) {
      o = Frac.of(o);
      if (o.n === 0n) throw new Error('Frac: division by zero');
      return new Frac(this.n * o.d, this.d * o.n);
    }
    neg() {
      return new Frac(-this.n, this.d);
    }
    abs() {
      return new Frac(babs(this.n), this.d);
    }
    cmp(o) {
      o = Frac.of(o);
      const l = this.n * o.d;
      const r = o.n * this.d;
      return l < r ? -1 : l > r ? 1 : 0;
    }
    eq(o) { return this.cmp(o) === 0; }
    lt(o) { return this.cmp(o) < 0; }
    le(o) { return this.cmp(o) <= 0; }
    gt(o) { return this.cmp(o) > 0; }
    ge(o) { return this.cmp(o) >= 0; }
    isZero() { return this.n === 0n; }
    isInt() { return this.d === 1n; }
    floor() {
      let q = this.n / this.d;
      if (this.n < 0n && q * this.d !== this.n) q -= 1n;
      return new Frac(q);
    }
    ceil() {
      return this.isInt() ? this : this.floor().add(1);
    }
    frac() {
      return this.sub(this.floor());
    }
    toNumber() {
      return Number(this.n) / Number(this.d);
    }
    // decimal string, rounded to p places, trailing zeros trimmed
    dec(p = 2) {
      const v = this.toNumber();
      let s = v.toFixed(p);
      if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
      if (s === '-0') s = '0';
      return s;
    }
    toString() {
      return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`;
    }
    // "165/4 (≈41.25)" or "41"
    show(p = 2) {
      return this.isInt() ? this.n.toString() : `${this.n}/${this.d} (≈${this.dec(p)})`;
    }
    // compact HTML form, e.g. 165/4
    html() {
      return this.isInt() ? this.n.toString() : `${this.n}/${this.d}`;
    }
    key() {
      return this.toString();
    }
  }

  OR.Frac = Frac;
  OR.F = (x) => Frac.of(x);

  /* Check a user-typed number against the correct value.
     Accepts exact fractions ("165/4") and decimals ("41.25", "41,25", rounded to ~2 places).
     Returns {ok, parsed:boolean} */
  OR.checkNum = function (userStr, correct, tol) {
    const u = Frac.parse(userStr);
    if (!u) return { ok: false, parsed: false };
    const c = Frac.of(correct);
    if (u.eq(c)) return { ok: true, parsed: true };
    const t = tol != null ? tol : 0.006 + 0.0005 * Math.abs(c.toNumber());
    return { ok: Math.abs(u.toNumber() - c.toNumber()) <= t, parsed: true };
  };
})();
