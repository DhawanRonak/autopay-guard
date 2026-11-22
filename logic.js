// Autopay Guard logic. Pure functions over a list of mandates. All merchants are fictional.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Guard = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const M = (id, merchant, category, amount, freq, nextInDays, o) => Object.assign({ id, merchant, category, amount, prevAmount: amount, maxAmount: amount, freq, nextInDays, via: 'This app', status: 'active', reminderDays: 1, variable: false, trial: null, essential: false }, o || {});
  function seed() {
    return [
      M(1, 'StreamBox', 'Video', 299, 'monthly', 3, { prevAmount: 199, maxAmount: 499 }),
      M(2, 'TuneLoop', 'Music', 119, 'monthly', 12),
      M(3, 'BeatBay', 'Music', 99, 'monthly', 20, { via: 'Another UPI app' }),
      M(4, 'CloudKeep', 'Storage', 130, 'monthly', 9),
      M(5, 'FitNest Gym', 'Fitness', 1499, 'monthly', 1, { via: 'Another UPI app', maxAmount: 1499 }),
      M(6, 'ReadMore', 'News', 999, 'yearly', 2, { trial: { paid: 2 }, maxAmount: 999 }),
      M(7, 'Meadow Mutual Fund SIP', 'Investments', 5000, 'monthly', 5, { essential: true }),
      M(8, 'SureLife Insurance', 'Insurance', 8400, 'yearly', 25, { essential: true }),
      M(9, 'CityPower electricity', 'Bills', 1840, 'monthly', 15, { variable: true, maxAmount: 5000, essential: true }),
      M(10, 'LearnLadder', 'Education', 799, 'monthly', 18, { maxAmount: 15000 }),
      M(11, 'GameArc', 'Games', 49, 'weekly', 4),
      M(12, 'MealCrate', 'Food', 599, 'monthly', 0, { status: 'paused' })
    ];
  }
  const PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
  const monthly = m => m.amount * PER_MONTH[m.freq];
  const active = list => list.filter(m => m.status === 'active');
  const monthlyTotal = list => Math.round(active(list).reduce((s, m) => s + monthly(m), 0));
  const upcoming = (list, days) => active(list).filter(m => m.nextInDays >= 0 && m.nextInDays <= days).sort((a, b) => a.nextInDays - b.nextInDays);
  const dueTotal = (list, days) => upcoming(list, days).reduce((s, m) => s + m.amount * (1 + Math.floor((days - m.nextInDays) / CYCLE_DAYS[m.freq])), 0);
  function byCategory(list) {
    const out = {}; for (const m of active(list)) out[m.category] = (out[m.category] || 0) + monthly(m);
    return Object.entries(out).map(([category, amt]) => ({ category, amount: Math.round(amt) })).sort((a, b) => b.amount - a.amount);
  }
  // Every insight uses only data a UPI app already has: mandate terms and past debits.
  const DUP_CATEGORIES = ['Music', 'Video', 'Storage', 'News'];
  function insights(list) {
    const out = [], act = active(list);
    for (const m of act) {
      if (m.trial && m.nextInDays >= 0 && m.nextInDays <= 3) out.push({ kind: 'trial_ending', id: m.id, pri: 1, title: `${m.merchant} trial ends in ${m.nextInDays} day${m.nextInDays === 1 ? '' : 's'}`, body: `You paid ₹${m.trial.paid} to start. The first full charge is ₹${m.amount}.` });
      if (m.prevAmount > 0 && m.amount * 100 >= m.prevAmount * 110 && !m.variable) out.push({ kind: 'price_hike', id: m.id, pri: 2, title: `${m.merchant} went up`, body: `₹${m.prevAmount} last time, ₹${m.amount} next. That is ₹${Math.round((m.amount - m.prevAmount) * PER_MONTH[m.freq] * 12)} more a year.` });
      if (m.freq === 'yearly' && m.nextInDays >= 0 && m.nextInDays <= 30 && m.amount >= 1000 && !m.trial) out.push({ kind: 'big_annual', id: m.id, pri: 3, title: `${m.merchant}: yearly ₹${m.amount} in ${m.nextInDays} days`, body: 'Yearly payments are easy to forget. Check your balance or review the plan.' });
      if (!m.variable && m.maxAmount >= m.amount * 5) out.push({ kind: 'high_ceiling', id: m.id, pri: 4, title: `${m.merchant} can take up to ₹${m.maxAmount}`, body: `You are charged ₹${m.amount}, but the mandate allows much more without asking you again.` });
    }
    for (const cat of DUP_CATEGORIES) {
      const same = act.filter(m => m.category === cat);
      if (same.length > 1) { const cheap = same.slice().sort((a, b) => monthly(a) - monthly(b))[0]; out.push({ kind: 'duplicate', id: cheap.id, pri: 5, title: `Two ${cat.toLowerCase()} subscriptions`, body: `${same.map(m => m.merchant).join(' and ')}. Together ₹${Math.round(same.reduce((s, m) => s + monthly(m), 0))} a month.` }); }
    }
    return out.sort((a, b) => a.pri - b.pri);
  }
  // Actions return a new list. Nothing is mutated, so Undo is just "put the old list back".
  const change = (list, id, patch) => list.map(m => m.id === id ? Object.assign({}, m, patch) : m);
  const CYCLE_DAYS = { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 };
  function target(list, id, statuses) {
    const m = list.find(x => x.id === id);
    if (!m) throw new Error('Mandate not found.');
    if (!statuses.includes(m.status)) throw new Error('This action is unavailable for this mandate.');
    return m;
  }
  const actions = {
    pause: (list, id, cycles) => {
      const m = target(list, id, ['active']);
      if (![1, 2, 3].includes(cycles)) throw new Error('Choose 1, 2 or 3 cycles.');
      return change(list, id, { status: 'paused', pausedCycles: cycles, resumeInDays: m.nextInDays + CYCLE_DAYS[m.freq] * cycles });
    },
    resume: (list, id) => {
      target(list, id, ['paused']);
      return change(list, id, { status: 'active', pausedCycles: null, resumeInDays: null });
    },
    cancel: (list, id) => { target(list, id, ['active', 'paused']); return change(list, id, { status: 'cancelled' }); },
    remind: (list, id, days) => {
      target(list, id, ['active', 'paused']);
      if (![1, 3, 7].includes(days)) throw new Error('Choose 1, 3 or 7 days.');
      return change(list, id, { reminderDays: days });
    },
    lowerCeiling: (list, id) => {
      const m = target(list, id, ['active', 'paused']);
      if (m.variable || m.maxAmount <= m.amount) throw new Error('This limit cannot be lowered.');
      return change(list, id, { maxAmount: m.amount });
    }
  };
  function validList(list) {
    return Array.isArray(list) && list.length <= 500 && new Set(list.map(m => m && m.id)).size === list.length && list.every(m => m && Number.isInteger(m.id) && typeof m.merchant === 'string' && m.merchant.length > 0 && typeof m.category === 'string' && typeof m.via === 'string' && ['active','paused','cancelled'].includes(m.status) && Object.hasOwn(PER_MONTH, m.freq) && ['amount','prevAmount','maxAmount','nextInDays'].every(k => Number.isFinite(m[k]) && m[k] >= 0) && m.amount > 0 && m.maxAmount >= m.amount && [1,3,7].includes(m.reminderDays) && (!m.trial || Number.isFinite(m.trial.paid)));
  }
  // Advance saved relative dates and automatically end pauses when their date arrives.
  function advance(list, days) {
    if (!Number.isInteger(days) || days <= 0) return list;
    return list.map(m => {
      if (m.status === 'cancelled') return m;
      let next = (m.status === 'paused' ? (m.resumeInDays ?? m.nextInDays) : m.nextInDays) - days;
      if (m.status === 'paused' && next > 0) return {...m, resumeInDays: next, nextInDays: Math.max(0, m.nextInDays - days)};
      const elapsed = next < 0;
      if (next < 0) next += Math.ceil(-next / CYCLE_DAYS[m.freq]) * CYCLE_DAYS[m.freq];
      return {...m, status: 'active', nextInDays: next, resumeInDays: null, pausedCycles: null, trial: elapsed ? null : m.trial};
    });
  }
  // Scripted usability tasks. `done` checks the state, so success is measured, not self-reported.
  const TASKS = [
    { id: 'T1', text: 'Find out how much leaves your account for autopay in a typical month, by category.', done: (list, ev) => ev.some(e => e.name === 'open_breakdown') },
    { id: 'T2', text: 'A video subscription has raised its price. Cancel its autopay.', target: 1, done: list => list.find(m => m.id === 1)?.status === 'cancelled' },
    { id: 'T3', text: 'You are travelling next month. Pause the gym payment for one month.', target: 5, done: list => list.find(m => m.id === 5)?.status === 'paused' && list.find(m => m.id === 5)?.pausedCycles === 1 },
    { id: 'T4', text: 'Make sure you are reminded 3 days before your insurance renewal.', target: 8, done: list => list.find(m => m.id === 8)?.reminderDays === 3 },
    { id: 'T5', text: 'You are paying for two music apps. Stop the cheaper one.', target: 3, done: list => list.find(m => m.id === 3)?.status === 'cancelled' }
  ];
  return { seed, monthly, monthlyTotal, upcoming, dueTotal, byCategory, insights, actions, validList, advance, TASKS };
});
