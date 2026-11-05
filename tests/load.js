// Loads the browser scripts into a Node vm context (window stub) for logic tests.
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function load(files) {
  const ctx = { console, Math, BigInt, Number, String, Array, Object, Set, Map, JSON, Error, Infinity };
  ctx.window = ctx; ctx.document = undefined;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  return ctx.OR;
};
