((global) => {
  "use strict";

  const DATA = global.CBP_CAMPAIGN_DATA;
  if (!DATA) return;

  const STORAGE_KEY = "cbp-profit-calculator-v1";
  const DAY_MS = 86400000;

  const roundDiv = (numerator, denominator) => Math.round(numerator / denominator);
  const levelByNumber = level => DATA.levels.find(item => item.level === Number(level));

  const parseDateValue = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  };

  const addUtcDays = (date, days) => new Date(date.getTime() + (days * DAY_MS));

  const calculatePlan = groups => {
    if (!Array.isArray(groups) || groups.length === 0) {
      return { valid: false, empty: true, errors: [], campaigns: [], totals: null };
    }

    const errors = [];
    const levelsUsed = new Set();
    let campaignCount = 0;

    groups.forEach((group, index) => {
      const level = levelByNumber(group.level);
      const count = Number(group.count);
      if (!level) errors.push(`Plan ${index + 1}: choose a supported campaign level.`);
      if (!Number.isInteger(count) || count < 1 || count > DATA.maximumActiveCampaigns) {
        errors.push(`Plan ${index + 1}: campaign count must be between 1 and ${DATA.maximumActiveCampaigns}.`);
      }
      if (level && levelsUsed.has(level.level)) errors.push(`Level ${level.level} appears more than once.`);
      if (level) levelsUsed.add(level.level);
      if (!['simultaneous', 'staggered'].includes(group.schedule)) errors.push(`Plan ${index + 1}: choose a valid schedule.`);
      if (group.startDate && !parseDateValue(group.startDate)) errors.push(`Plan ${index + 1}: choose a valid start date.`);
      if (Number.isInteger(count)) campaignCount += count;
    });

    if (campaignCount > DATA.maximumActiveCampaigns) {
      errors.push(`A plan may contain no more than ${DATA.maximumActiveCampaigns} active campaigns in total.`);
    }
    if (errors.length) return { valid: false, empty: false, errors, campaigns: [], totals: null };

    const campaigns = [];
    groups.forEach(group => {
      const level = levelByNumber(group.level);
      const baseDate = parseDateValue(group.startDate);
      for (let index = 0; index < Number(group.count); index += 1) {
        const firstAtLevel = Boolean(group.firstPurchase) && index === 0;
        const startOffsetDays = group.schedule === "staggered" ? index * 7 : 0;
        const startDate = baseDate ? addUtcDays(baseDate, startOffsetDays) : null;
        campaigns.push({
          id: `${level.level}-${index + 1}-${campaigns.length + 1}`,
          level: level.level,
          sequence: index + 1,
          adsDaily: level.adsDaily,
          listedPerClickCents: level.listedPerClickCents,
          firstAtLevel,
          costCents: firstAtLevel ? level.firstTotalCents : level.laterCostCents,
          activationFeeCents: firstAtLevel ? level.activationFeeCents : 0,
          completionCents: level.completionCents,
          memberCents: level.memberCents,
          profitCents: level.memberCents - (firstAtLevel ? level.firstTotalCents : level.laterCostCents),
          schedule: group.schedule,
          startOffsetDays,
          startDate,
          clickCompletionOffsetDays: startOffsetDays + DATA.clickDays - 1,
          availableOffsetDays: startOffsetDays + DATA.clickDays + DATA.holdDays,
          clickCompletionDate: startDate ? addUtcDays(startDate, DATA.clickDays - 1) : null,
          availableDate: startDate ? addUtcDays(startDate, DATA.clickDays + DATA.holdDays) : null
        });
      }
    });

    const totals = campaigns.reduce((sum, campaign) => {
      sum.capitalCents += campaign.costCents;
      sum.completionCents += campaign.completionCents;
      sum.memberCents += campaign.memberCents;
      sum.profitCents += campaign.profitCents;
      sum.adsDaily += campaign.adsDaily;
      return sum;
    }, { capitalCents: 0, completionCents: 0, memberCents: 0, profitCents: 0, adsDaily: 0 });

    totals.campaignCount = campaigns.length;
    totals.dailyMemberCents = roundDiv(totals.memberCents, DATA.clickDays);
    totals.sevenDayMemberCents = roundDiv(totals.memberCents * 7, DATA.clickDays);
    totals.thirtyDayMemberCents = roundDiv(totals.memberCents * 30, DATA.clickDays);
    totals.roiPercent = totals.capitalCents ? (totals.profitCents / totals.capitalCents) * 100 : 0;

    return { valid: true, empty: false, errors: [], campaigns, totals };
  };

  global.CBPProfitCalculator = Object.freeze({
    calculatePlan,
    parseDateValue,
    addUtcDays,
    roundDiv
  });

  if (typeof document === "undefined") return;

  const root = document.querySelector("[data-profit-calculator]");
  if (!root) return;

  const defaultState = () => ({
    mode: "quick",
    quick: { level: "", count: 1, firstPurchase: true, schedule: "simultaneous", startDate: "" },
    advanced: []
  });

  let state = defaultState();
  let latestResult = null;

  const money = cents => `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} ${DATA.currency}`;
  const percent = value => `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
  const dateLabel = date => new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeZone: "UTC" }).format(date);
  const escapeHtml = value => String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));

  const safeState = candidate => {
    const clean = defaultState();
    if (!candidate || typeof candidate !== "object") return clean;
    clean.mode = candidate.mode === "advanced" ? "advanced" : "quick";
    if (candidate.quick && typeof candidate.quick === "object") {
      clean.quick.level = levelByNumber(candidate.quick.level) ? String(candidate.quick.level) : "";
      clean.quick.count = [1, 2, 3].includes(Number(candidate.quick.count)) ? Number(candidate.quick.count) : 1;
      clean.quick.firstPurchase = candidate.quick.firstPurchase !== false;
      clean.quick.schedule = candidate.quick.schedule === "staggered" ? "staggered" : "simultaneous";
      clean.quick.startDate = parseDateValue(candidate.quick.startDate) ? candidate.quick.startDate : "";
    }
    if (Array.isArray(candidate.advanced)) {
      const seen = new Set();
      let total = 0;
      candidate.advanced.slice(0, DATA.maximumActiveCampaigns).forEach(group => {
        const level = levelByNumber(group?.level);
        const count = Number(group?.count);
        if (!level || seen.has(level.level) || ![1, 2, 3].includes(count) || total + count > DATA.maximumActiveCampaigns) return;
        seen.add(level.level);
        total += count;
        clean.advanced.push({
          level: level.level,
          count,
          firstPurchase: group.firstPurchase !== false,
          schedule: group.schedule === "staggered" ? "staggered" : "simultaneous",
          startDate: parseDateValue(group.startDate) ? group.startDate : ""
        });
      });
    }
    return clean;
  };

  const loadState = () => {
    try { state = safeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); }
    catch { state = defaultState(); }
  };

  const saveState = () => {
    try {
      if (hasMeaningfulData()) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else localStorage.removeItem(STORAGE_KEY);
    }
    catch { /* Calculations still work when browser storage is unavailable. */ }
  };

  const setText = (selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  };

  const showToast = message => {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 4200);
  };

  const groupsForCurrentMode = () => {
    if (state.mode === "advanced") return state.advanced;
    if (!state.quick.level) return [];
    return [{
      level: Number(state.quick.level),
      count: state.quick.count,
      firstPurchase: state.quick.firstPurchase,
      schedule: state.quick.schedule,
      startDate: state.quick.startDate
    }];
  };

  const hasMeaningfulData = () => Boolean(state.quick.level || state.quick.startDate || state.advanced.length);

  const updateMode = () => {
    root.querySelectorAll("[data-calculator-mode]").forEach(button => {
      const active = button.dataset.calculatorMode === state.mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll("[data-mode-panel]").forEach(panel => {
      panel.hidden = panel.dataset.modePanel !== state.mode;
    });
  };

  const syncQuickForm = () => {
    root.querySelector("#quick-level").value = state.quick.level;
    root.querySelector("#quick-count").value = String(state.quick.count);
    root.querySelector("#quick-purchase-status").value = state.quick.firstPurchase ? "first" : "activated";
    root.querySelector("#quick-schedule").value = state.quick.schedule;
    root.querySelector("#quick-start-date").value = state.quick.startDate;
    const staggerOption = root.querySelector('#quick-schedule option[value="staggered"]');
    if (staggerOption) staggerOption.disabled = state.quick.count === 1;
    if (state.quick.count === 1 && state.quick.schedule === "staggered") {
      state.quick.schedule = "simultaneous";
      root.querySelector("#quick-schedule").value = "simultaneous";
    }
  };

  const advancedRowHtml = (group, index) => {
    const selectedElsewhere = new Set(state.advanced.filter((_, rowIndex) => rowIndex !== index).map(item => Number(item.level)));
    const otherCampaigns = state.advanced.reduce((total, item, rowIndex) => total + (rowIndex === index ? 0 : Number(item.count)), 0);
    const remaining = DATA.maximumActiveCampaigns - otherCampaigns;
    const levelOptions = DATA.levels.map(level => `<option value="${level.level}" ${Number(group.level) === level.level ? "selected" : ""} ${selectedElsewhere.has(level.level) ? "disabled" : ""}>Level ${level.level} · ${money(level.laterCostCents)}</option>`).join("");
    const countOptions = [1, 2, 3].map(count => `<option value="${count}" ${Number(group.count) === count ? "selected" : ""} ${count > remaining ? "disabled" : ""}>${count} campaign${count === 1 ? "" : "s"}</option>`).join("");
    return `<article class="planner-row" data-advanced-row="${index}">
      <div class="planner-row-head"><div><span>PLAN ${index + 1}</span><strong>Campaign level ${escapeHtml(group.level)}</strong></div><button class="calculator-icon-action" type="button" data-remove-plan aria-label="Remove plan ${index + 1}">Remove Campaign</button></div>
      <div class="calculator-field-grid">
        <label><span>Campaign level</span><select data-plan-field="level">${levelOptions}</select></label>
        <label><span>Number of campaigns</span><select data-plan-field="count">${countOptions}</select></label>
        <label><span>Level status</span><select data-plan-field="purchase"><option value="first" ${group.firstPurchase ? "selected" : ""}>First purchase at this level</option><option value="activated" ${!group.firstPurchase ? "selected" : ""}>Level already activated</option></select></label>
        <label><span>Start pattern</span><select data-plan-field="schedule"><option value="simultaneous" ${group.schedule === "simultaneous" ? "selected" : ""}>Start together</option><option value="staggered" ${group.schedule === "staggered" ? "selected" : ""} ${Number(group.count) === 1 ? "disabled" : ""}>Stagger every 7 days</option></select></label>
        <label class="calculator-date-field"><span>Optional start date</span><input type="date" data-plan-field="startDate" value="${escapeHtml(group.startDate)}"></label>
      </div>
    </article>`;
  };

  const renderAdvancedRows = () => {
    const container = root.querySelector("[data-advanced-plans]");
    const empty = root.querySelector("[data-advanced-empty]");
    if (container) container.innerHTML = state.advanced.map(advancedRowHtml).join("");
    if (empty) empty.hidden = state.advanced.length > 0;
    const total = state.advanced.reduce((sum, group) => sum + Number(group.count), 0);
    const addButton = root.querySelector("[data-add-plan]");
    if (addButton) {
      addButton.disabled = total >= DATA.maximumActiveCampaigns || state.advanced.length >= DATA.maximumActiveCampaigns;
      addButton.setAttribute("aria-describedby", "campaign-cap-note");
    }
    setText("[data-advanced-count]", `${total} of ${DATA.maximumActiveCampaigns} campaign slots used`);
  };

  const renderBreakdown = result => {
    const node = root.querySelector("[data-campaign-breakdown]");
    if (!node) return;
    node.innerHTML = result.campaigns.map((campaign, index) => `<article class="campaign-result-card">
      <header><span>CAMPAIGN ${index + 1}</span><strong>Level ${campaign.level}</strong></header>
      <dl>
        <div><dt>Capital</dt><dd>${money(campaign.costCents)}</dd></div>
        <div><dt>Daily ads</dt><dd>${campaign.adsDaily}</dd></div>
        <div><dt>Gross completion</dt><dd>${money(campaign.completionCents)}</dd></div>
        <div><dt>Member amount (90%)</dt><dd>${money(campaign.memberCents)}</dd></div>
        <div><dt>Estimated net profit</dt><dd>${money(campaign.profitCents)}</dd></div>
      </dl>
      <p>${campaign.firstAtLevel ? `Includes the one-time Level ${campaign.level} activation fee.` : `Uses the later Level ${campaign.level} campaign cost.`}</p>
    </article>`).join("");
  };

  const renderTimeline = result => {
    const node = root.querySelector("[data-campaign-timeline]");
    if (!node) return;
    node.innerHTML = result.campaigns.map((campaign, index) => {
      const start = campaign.startDate ? dateLabel(campaign.startDate) : `Plan day ${campaign.startOffsetDays}`;
      const complete = campaign.clickCompletionDate ? dateLabel(campaign.clickCompletionDate) : `Plan day ${campaign.clickCompletionOffsetDays}`;
      const available = campaign.availableDate ? dateLabel(campaign.availableDate) : `Plan day ${campaign.availableOffsetDays}`;
      return `<article class="timeline-card"><div class="timeline-marker" aria-hidden="true">${index + 1}</div><div><span>LEVEL ${campaign.level} · CAMPAIGN ${campaign.sequence}</span><h3>${start}</h3><dl><div><dt>12th click day</dt><dd>${complete}</dd></div><div><dt>Estimated Available Balance</dt><dd>${available}</dd></div></dl></div></article>`;
    }).join("");
  };

  const clearResults = (message = "Choose a campaign level to begin. Your estimate will appear here instantly.") => {
    latestResult = null;
    root.querySelector("[data-results-content]").hidden = true;
    const empty = root.querySelector("[data-results-empty]");
    empty.hidden = false;
    empty.querySelector("p").textContent = message;
    root.querySelector("[data-calculator-errors]").innerHTML = "";
    root.querySelector("[data-results-announcement]").textContent = "";
  };

  const renderResult = result => {
    const errors = root.querySelector("[data-calculator-errors]");
    errors.innerHTML = "";
    if (!result.valid) {
      if (result.empty) {
        clearResults(state.mode === "advanced" ? "Add a campaign plan to begin. You can combine levels while staying within three active campaigns total." : undefined);
        return;
      }
      clearResults("Fix the highlighted planning details to calculate your estimate.");
      errors.innerHTML = `<div class="calculator-error" role="alert"><strong>Please check your plan</strong><ul>${result.errors.map(error => `<li>${escapeHtml(error)}</li>`).join("")}</ul></div>`;
      return;
    }

    latestResult = result;
    root.querySelector("[data-results-empty]").hidden = true;
    root.querySelector("[data-results-content]").hidden = false;
    setText("[data-result-capital]", money(result.totals.capitalCents));
    setText("[data-result-count]", String(result.totals.campaignCount));
    setText("[data-result-daily]", money(result.totals.dailyMemberCents));
    setText("[data-result-seven]", money(result.totals.sevenDayMemberCents));
    setText("[data-result-thirty]", money(result.totals.thirtyDayMemberCents));
    setText("[data-result-gross]", money(result.totals.completionCents));
    setText("[data-result-member]", money(result.totals.memberCents));
    setText("[data-result-profit]", money(result.totals.profitCents));
    setText("[data-result-roi]", percent(result.totals.roiPercent));
    setText("[data-result-ads]", String(result.totals.adsDaily));
    renderBreakdown(result);
    renderTimeline(result);
    root.querySelector("[data-results-announcement]").textContent = `Estimate updated. ${result.totals.campaignCount} campaign${result.totals.campaignCount === 1 ? "" : "s"}, ${money(result.totals.capitalCents)} total capital, and ${money(result.totals.profitCents)} estimated net profit.`;
  };

  const calculateAndRender = () => {
    const result = calculatePlan(groupsForCurrentMode());
    renderResult(result);
    saveState();
    return result;
  };

  const addAdvancedPlan = () => {
    const total = state.advanced.reduce((sum, group) => sum + Number(group.count), 0);
    if (total >= DATA.maximumActiveCampaigns) {
      showToast("The current rule allows three active campaigns per account in total.");
      return;
    }
    const used = new Set(state.advanced.map(group => Number(group.level)));
    const available = DATA.levels.find(level => !used.has(level.level));
    if (!available) return;
    state.advanced.push({ level: available.level, count: 1, firstPurchase: true, schedule: "simultaneous", startDate: "" });
    renderAdvancedRows();
    calculateAndRender();
    root.querySelector(`[data-advanced-row="${state.advanced.length - 1}"] select`)?.focus();
  };

  const resetCalculator = () => {
    state = defaultState();
    latestResult = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    updateMode();
    syncQuickForm();
    renderAdvancedRows();
    clearResults();
    root.querySelector("#quick-level")?.focus();
    showToast("Calculator cleared. Your course progress was not changed.");
  };

  const requestReset = () => {
    if (!hasMeaningfulData()) {
      resetCalculator();
      return;
    }
    const dialog = root.querySelector("[data-reset-dialog]");
    if (typeof dialog?.showModal === "function") dialog.showModal();
    else if (window.confirm("Clear all calculator entries and start over?")) resetCalculator();
  };

  const resultText = result => {
    const lines = [
      "ClickBaitPays Profit Calculator estimate",
      `Campaigns: ${result.totals.campaignCount}`,
      `Total capital: ${money(result.totals.capitalCents)}`,
      `Estimated daily member amount: ${money(result.totals.dailyMemberCents)}`,
      `Estimated 7-day member amount: ${money(result.totals.sevenDayMemberCents)}`,
      `Estimated 30-day pace: ${money(result.totals.thirtyDayMemberCents)}`,
      `Gross completion value: ${money(result.totals.completionCents)}`,
      `Listed member amount (90%): ${money(result.totals.memberCents)}`,
      `Estimated net profit: ${money(result.totals.profitCents)}`,
      `Estimated ROI: ${percent(result.totals.roiPercent)}`,
      "",
      "Estimates only. Actual results may differ if platform terms, performance, fees, or withdrawal conditions change."
    ];
    result.campaigns.forEach((campaign, index) => {
      const start = campaign.startDate ? dateLabel(campaign.startDate) : `Plan day ${campaign.startOffsetDays}`;
      const available = campaign.availableDate ? dateLabel(campaign.availableDate) : `Plan day ${campaign.availableOffsetDays}`;
      lines.push(`Campaign ${index + 1}: Level ${campaign.level}, starts ${start}, estimated Available Balance ${available}.`);
    });
    return lines.join("\n");
  };

  const copyResults = async () => {
    if (!latestResult?.valid) return;
    const text = resultText(latestResult);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("Clipboard API unavailable");
      showToast("Calculator results copied.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      showToast(copied ? "Calculator results copied." : "Copy was unavailable. Please use your browser's copy command.");
    }
  };

  root.querySelectorAll("[data-calculator-mode]").forEach(button => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.calculatorMode;
      updateMode();
      calculateAndRender();
      root.querySelector(`[data-mode-panel="${state.mode}"] select, [data-mode-panel="${state.mode}"] button`)?.focus();
    });
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      state.mode = state.mode === "quick" ? "advanced" : "quick";
      updateMode();
      calculateAndRender();
      root.querySelector(`[data-calculator-mode="${state.mode}"]`)?.focus();
    });
  });

  ["quick-level", "quick-count", "quick-purchase-status", "quick-schedule", "quick-start-date"].forEach(id => {
    root.querySelector(`#${id}`)?.addEventListener("change", event => {
      if (id === "quick-level") state.quick.level = event.target.value;
      if (id === "quick-count") state.quick.count = Number(event.target.value);
      if (id === "quick-purchase-status") state.quick.firstPurchase = event.target.value === "first";
      if (id === "quick-schedule") state.quick.schedule = event.target.value;
      if (id === "quick-start-date") state.quick.startDate = event.target.value;
      syncQuickForm();
      calculateAndRender();
    });
  });

  root.querySelector("[data-add-plan]")?.addEventListener("click", addAdvancedPlan);
  root.querySelector("[data-advanced-plans]")?.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-plan]");
    if (!button) return;
    const row = button.closest("[data-advanced-row]");
    const index = Number(row?.dataset.advancedRow);
    if (!Number.isInteger(index)) return;
    state.advanced.splice(index, 1);
    renderAdvancedRows();
    calculateAndRender();
    root.querySelector("[data-add-plan]")?.focus();
  });

  root.querySelector("[data-advanced-plans]")?.addEventListener("change", event => {
    const field = event.target.closest("[data-plan-field]");
    const row = field?.closest("[data-advanced-row]");
    const index = Number(row?.dataset.advancedRow);
    const group = state.advanced[index];
    if (!field || !group) return;
    if (field.dataset.planField === "level") group.level = Number(field.value);
    if (field.dataset.planField === "count") group.count = Number(field.value);
    if (field.dataset.planField === "purchase") group.firstPurchase = field.value === "first";
    if (field.dataset.planField === "schedule") group.schedule = field.value;
    if (field.dataset.planField === "startDate") group.startDate = field.value;
    if (group.count === 1 && group.schedule === "staggered") group.schedule = "simultaneous";
    renderAdvancedRows();
    calculateAndRender();
  });

  root.querySelector("form")?.addEventListener("submit", event => {
    event.preventDefault();
    const result = calculateAndRender();
    if (result.valid) root.querySelector("[data-results]")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  root.querySelectorAll("[data-reset-calculator]").forEach(button => button.addEventListener("click", requestReset));
  root.querySelector("[data-confirm-reset]")?.addEventListener("click", () => {
    root.querySelector("[data-reset-dialog]")?.close();
    resetCalculator();
  });
  root.querySelector("[data-cancel-reset]")?.addEventListener("click", () => root.querySelector("[data-reset-dialog]")?.close());
  root.querySelector("[data-copy-results]")?.addEventListener("click", copyResults);
  root.querySelector("[data-print-results]")?.addEventListener("click", () => window.print());

  loadState();
  updateMode();
  syncQuickForm();
  renderAdvancedRows();
  calculateAndRender();

})(typeof window !== "undefined" ? window : globalThis);
