"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console, Date, Intl, Math });
vm.runInContext(fs.readFileSync(path.join(root, "assets/campaign-data.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "assets/profit-calculator.js"), "utf8"), context);

const DATA = context.CBP_CAMPAIGN_DATA;
const { calculatePlan, parseDateValue, addUtcDays } = context.CBPProfitCalculator;
const iso = date => date.toISOString().slice(0, 10);
const plan = (level, count = 1, firstPurchase = true, schedule = "simultaneous", startDate = "") => ({ level, count, firstPurchase, schedule, startDate });

assert.equal(DATA.levels.length, 7, "all seven campaign levels are present");
assert.equal(DATA.maximumActiveCampaigns, 3, "account-wide cap is three");
assert.equal(DATA.clickDays, 12, "campaign has 12 click days");
assert.equal(DATA.holdDays, 7, "campaign has a seven-day hold");

for (const level of DATA.levels) {
  const first = calculatePlan([plan(level.level)]);
  assert.equal(first.valid, true, `Level ${level.level} first purchase calculates`);
  assert.equal(first.totals.capitalCents, level.firstTotalCents);
  assert.equal(first.totals.completionCents, level.completionCents);
  assert.equal(first.totals.memberCents, level.memberCents);
  assert.equal(first.totals.profitCents, level.memberCents - level.firstTotalCents);

  const activated = calculatePlan([plan(level.level, 1, false)]);
  assert.equal(activated.totals.capitalCents, level.laterCostCents);
  assert.equal(activated.totals.profitCents, level.memberCents - level.laterCostCents);
}

const oneLevelThree = calculatePlan([plan(1, 3, true)]);
assert.equal(oneLevelThree.totals.capitalCents, 4000);
assert.equal(oneLevelThree.totals.completionCents, 5724);
assert.equal(oneLevelThree.totals.memberCents, 5151);
assert.equal(oneLevelThree.totals.profitCents, 1151);
assert.deepEqual(Array.from(oneLevelThree.campaigns, item => item.startOffsetDays), [0, 0, 0]);

const twoStaggered = calculatePlan([plan(2, 2, true, "staggered", "2026-09-08")]);
assert.deepEqual(Array.from(twoStaggered.campaigns, item => item.startOffsetDays), [0, 7]);
assert.deepEqual(Array.from(twoStaggered.campaigns, item => iso(item.startDate)), ["2026-09-08", "2026-09-15"]);
assert.deepEqual(Array.from(twoStaggered.campaigns, item => iso(item.availableDate)), ["2026-09-27", "2026-10-04"]);

const threeStaggered = calculatePlan([plan(1, 3, true, "staggered")]);
assert.deepEqual(Array.from(threeStaggered.campaigns, item => item.startOffsetDays), [0, 7, 14]);
assert.deepEqual(Array.from(threeStaggered.campaigns, item => item.clickCompletionOffsetDays), [11, 18, 25]);
assert.deepEqual(Array.from(threeStaggered.campaigns, item => item.availableOffsetDays), [19, 26, 33]);

const mixed = calculatePlan([plan(1), plan(2), plan(7, 1, false)]);
assert.equal(mixed.valid, true);
assert.equal(mixed.totals.campaignCount, 3);
assert.equal(mixed.totals.capitalCents, 249800);
assert.equal(mixed.totals.completionCents, 373208);
assert.equal(mixed.totals.memberCents, 335887);
assert.equal(mixed.totals.profitCents, 86087);
assert.equal(mixed.totals.dailyMemberCents, 27991);
assert.equal(mixed.totals.sevenDayMemberCents, 195934);
assert.equal(mixed.totals.thirtyDayMemberCents, 839718);

const mixedSchedules = calculatePlan([plan(1, 2, true, "staggered", "2026-12-20"), plan(2, 1, true, "simultaneous", "2028-02-20")]);
assert.equal(mixedSchedules.valid, true, "mixed simultaneous and staggered groups calculate together");
assert.deepEqual(Array.from(mixedSchedules.campaigns, item => iso(item.availableDate)), ["2027-01-08", "2027-01-15", "2028-03-10"]);

const rate = calculatePlan([plan(1)]);
assert.equal(rate.totals.dailyMemberCents, 143);
assert.equal(rate.totals.sevenDayMemberCents, 1002);
assert.equal(rate.totals.thirtyDayMemberCents, 4293);

assert.equal(calculatePlan([plan(1, 4)]).valid, false, "more than three at one level is rejected");
assert.equal(calculatePlan([plan(1, 0)]).valid, false, "zero campaigns is rejected");
assert.equal(calculatePlan([plan(1, -1)]).valid, false, "negative campaign count is rejected");
assert.equal(calculatePlan([plan(8)]).valid, false, "unsupported level is rejected");
assert.equal(calculatePlan([plan(1), plan(2, 3)]).valid, false, "more than three campaigns across levels is rejected");
assert.equal(calculatePlan([plan(1), plan(1)]).valid, false, "duplicate level rows are rejected");
assert.equal(calculatePlan([plan(1, 1, true, "other")]).valid, false, "unsupported schedule is rejected");
assert.equal(calculatePlan([plan(1, 1, true, "simultaneous", "2026-02-30")]).valid, false, "impossible date is rejected");
assert.equal(calculatePlan([]).empty, true, "empty plan returns a clean empty state");

assert.equal(iso(addUtcDays(parseDateValue("2026-01-25"), 19)), "2026-02-13", "month-end crossing works");
assert.equal(iso(addUtcDays(parseDateValue("2026-12-20"), 19)), "2027-01-08", "year-end crossing works");
assert.equal(iso(addUtcDays(parseDateValue("2028-02-20"), 19)), "2028-03-10", "leap-year crossing works");

const calculatorSource = fs.readFileSync(path.join(root, "assets/profit-calculator.js"), "utf8");
assert.match(calculatorSource, /localStorage\.removeItem\(STORAGE_KEY\)/, "reset clears calculator storage");
assert.doesNotMatch(calculatorSource, /removeItem\(["']cbp-completed-lessons-v1["']\)/, "calculator reset does not clear course progress");
assert.match(calculatorSource, /state = defaultState\(\)/, "reset restores clean calculator defaults");

console.log("Profit calculator tests passed: 7 levels, plan limits, rates, staggered dates, boundary dates, invalid inputs, empty state, and reset isolation.");
