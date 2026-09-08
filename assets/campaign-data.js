(() => {
  "use strict";

  /*
   * Calculator source of truth.
   * Amounts are stored as integer USDT cents to avoid floating-point money errors.
   * Keep these values aligned with the published tables in index.html and
   * campaign-levels.html. See CALCULATOR-MAINTENANCE.md before changing them.
   */
  const levels = [
    { level: 1, firstTotalCents: 1400, laterCostCents: 1300, activationFeeCents: 100, adsDaily: 3, listedPerClickCents: 48, completionCents: 1908, memberCents: 1717 },
    { level: 2, firstTotalCents: 8400, laterCostCents: 7700, activationFeeCents: 700, adsDaily: 3, listedPerClickCents: 283, completionCents: 11300, memberCents: 10170 },
    { level: 3, firstTotalCents: 16500, laterCostCents: 15000, activationFeeCents: 1500, adsDaily: 3, listedPerClickCents: 540, completionCents: 21600, memberCents: 19440 },
    { level: 4, firstTotalCents: 33000, laterCostCents: 30000, activationFeeCents: 3000, adsDaily: 5, listedPerClickCents: 648, completionCents: 43200, memberCents: 38880 },
    { level: 5, firstTotalCents: 66000, laterCostCents: 60000, activationFeeCents: 6000, adsDaily: 6, listedPerClickCents: 1080, completionCents: 86400, memberCents: 77760 },
    { level: 6, firstTotalCents: 132000, laterCostCents: 120000, activationFeeCents: 12000, adsDaily: 10, listedPerClickCents: 1296, completionCents: 172800, memberCents: 155520 },
    { level: 7, firstTotalCents: 264000, laterCostCents: 240000, activationFeeCents: 24000, adsDaily: 20, listedPerClickCents: 1350, completionCents: 360000, memberCents: 324000 }
  ].map(Object.freeze);

  globalThis.CBP_CAMPAIGN_DATA = Object.freeze({
    currency: "USDT",
    clickDays: 12,
    holdDays: 7,
    maximumActiveCampaigns: 3,
    withdrawalFeePercent: 10,
    levels: Object.freeze(levels)
  });
})();
