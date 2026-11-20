// node test/logic.test.mjs
import { createRequire } from 'module'; import assert from 'assert'; const require = createRequire(import.meta.url);
const G = require('../logic.js'); let list = G.seed();
assert.equal(G.monthlyTotal(list), Math.round(299 + 119 + 99 + 130 + 1499 + 999 / 12 + 5000 + 8400 / 12 + 1840 + 799 + 49 * 52 / 12));
const kinds = G.insights(list).map(i => i.kind + ':' + i.id);
assert.deepEqual(kinds, ['trial_ending:6', 'price_hike:1', 'big_annual:8', 'high_ceiling:10', 'duplicate:3']);
assert.deepEqual(G.upcoming(list, 7).map(m => m.id), [5, 6, 1, 11, 7]);
const before = G.monthlyTotal(list); list = G.actions.cancel(list, 3);
assert.equal(G.monthlyTotal(list), before - 99); assert.ok(!G.insights(list).some(i => i.kind === 'duplicate'));
list = G.actions.pause(list, 5, 1); assert.equal(list.find(m => m.id === 5).status, 'paused'); assert.equal(list.find(m => m.id === 5).resumeInDays, 31);
list = G.actions.resume(list, 5); assert.equal(list.find(m => m.id === 5).nextInDays, 31);
list = G.actions.lowerCeiling(list, 10); assert.ok(!G.insights(list).some(i => i.kind === 'high_ceiling'));
list = G.actions.remind(list, 8, 3); assert.ok(G.TASKS[3].done(list, []));
assert.equal(G.seed()[0].status, 'active'); // seed is not mutated by actions
console.log('Autopay Guard logic: all tests passed');
