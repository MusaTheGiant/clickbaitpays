(() => {
  "use strict";

  const progressKey = "cbp-completed-lessons-v1";
  const themeKey = "cbp-theme-v2";
  const totalLessons = 11;
  const lessonPath = [
    [1, "what-is-clickbaitpays.html", "What Is ClickBaitPays?", "Understand the advertising-service model, who the platform connects, and the value it is designed to create."],
    [2, "how-clickbaitpays-works.html", "How ClickBaitPays Works", "Follow the journey from registration and campaign purchase to daily activity and balance release."],
    [3, "advertiser-viewer-benefits.html", "Web Traffic, Advertisers, and Viewers", "Understand traffic, advertising, marketing, and why visits do not guarantee conversions."],
    [4, "platform-sustainability.html", "Platform Sustainability", "See how advertising revenue, activation fees, withdrawal fees, and activity-linked rewards support the model."],
    [5, "campaign-levels.html", "Campaign Levels 1 to 7", "Learn to read campaign costs, activation fees, daily ads, and completion figures correctly."],
    [6, "daily-clicks-earnings.html", "Daily Clicks and the Earnings Lifecycle", "Separate daily activity, campaign completion, the hold, and Available Balance."],
    [7, "referral-rewards.html", "Direct Referral Rewards", "Understand the stated one-level affiliate structure and optional referrals."],
    [8, "staggered-campaign-strategy.html", "Staggered Campaign Strategy", "Explore scheduling while keeping affordability, workload, and platform limits visible."],
    [9, "crypto-deposits-withdrawals.html", "Crypto Deposits and Withdrawals", "Use careful network, address, wallet, and transaction checks."],
    [10, "back-office-walkthrough.html", "Back Office Walkthrough", "Learn where the main account and campaign functions are located."],
    [11, "account-rules-safety.html", "Account Rules and Safety", "Protect the account, follow household rules, and choose responsible next steps."]
  ];

  const readCompleted = () => {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey) || "[]");
      return new Set(Array.isArray(value) ? value.map(Number).filter(number => number >= 1 && number <= totalLessons) : []);
    } catch {
      return new Set();
    }
  };

  const saveCompleted = completed => {
    localStorage.setItem(progressKey, JSON.stringify([...completed].sort((a, b) => a - b)));
  };

  const milestone = count => {
    if (count >= 11) return "Learning journey complete. You stayed with it and earned this moment.";
    if (count >= 8) return "Eight lessons complete. Your consistency is showing.";
    if (count >= 6) return "More than halfway. You are turning information into understanding.";
    if (count >= 3) return "Three lessons complete. Your foundation is getting stronger.";
    if (count >= 1) return "Strong start. You chose understanding before action.";
    return "Every expert starts with one clear lesson.";
  };

  const updateProgress = () => {
    const completed = readCompleted();
    const count = completed.size;
    const percent = Math.round((count / totalLessons) * 100);
    const currentLesson = Number(document.body.dataset.lessonNumber || 0);
    document.querySelectorAll("[data-progress-percent]").forEach(node => { node.textContent = `${percent}%`; });
    document.querySelectorAll("[data-completed-count]").forEach(node => { node.textContent = count; });
    document.querySelectorAll("[data-remaining-count]").forEach(node => { node.textContent = totalLessons - count; });
    document.querySelectorAll("[data-progress-fill]").forEach(node => { node.style.width = `${percent}%`; });
    document.querySelectorAll("[data-progress-ring]").forEach(node => { node.style.strokeDashoffset = String(113.1 * (1 - percent / 100)); });
    document.querySelectorAll("[data-progress-ring-large]").forEach(node => { node.style.strokeDashoffset = String(314.2 * (1 - percent / 100)); });
    document.querySelectorAll(".progress-track").forEach(node => { node.setAttribute("aria-valuenow", String(percent)); });
    document.querySelectorAll("[data-milestone-message]").forEach(node => { node.textContent = milestone(count); });
    document.querySelectorAll("[data-lesson-status]").forEach(node => {
      const lesson = Number(node.dataset.lessonStatus);
      const isComplete = completed.has(lesson);
      const isCurrent = lesson === currentLesson;

      if (node.hasAttribute("data-compact-status")) {
        const state = isCurrent ? "current lesson, unlocked" : (isComplete ? "completed" : "not completed, locked");
        node.textContent = isCurrent ? "🔓" : (isComplete ? "✓" : "🔒");
        node.setAttribute("aria-label", `Lesson ${lesson}: ${state}`);
        node.title = state.charAt(0).toUpperCase() + state.slice(1);
        node.classList.toggle("is-current", isCurrent);
        node.classList.toggle("is-complete", !isCurrent && isComplete);
        node.classList.toggle("is-locked", !isCurrent && !isComplete);
      } else {
        node.textContent = isComplete ? "Completed ✓" : "Not completed";
        node.classList.toggle("is-complete", isComplete);
      }
    });
    document.querySelectorAll("[data-lesson-card]").forEach(node => {
      const lesson = Number(node.dataset.lessonCard);
      const isCurrent = lesson === currentLesson;
      node.classList.toggle("is-complete", completed.has(lesson));
      node.classList.toggle("is-current", isCurrent);
      if (isCurrent) node.setAttribute("aria-current", "page");
      else node.removeAttribute("aria-current");
    });

    const currentNextLesson = document.querySelector("[data-next-lesson]");
    if (currentLesson && completed.has(currentLesson)) {
      unlockNext(currentNextLesson);
    } else if (currentLesson && currentNextLesson) {
      currentNextLesson.classList.add("locked");
      currentNextLesson.setAttribute("aria-disabled", "true");
    }

    const nextLesson = lessonPath.find(([number]) => !completed.has(number));
    const nextTarget = nextLesson || [12, "completion.html", "Journey Completion", "Review what you learned, celebrate your commitment, and choose a responsible next step."];
    document.querySelectorAll("[data-continue-link]").forEach(link => {
      link.href = nextTarget[1];
      if (link.closest(".next-lesson-card")) link.textContent = nextLesson ? "Continue Lesson" : "View Completion";
      else link.innerHTML = nextLesson ? `Continue Learning <span aria-hidden="true">→</span>` : `View My Completion <span aria-hidden="true">→</span>`;
    });
    const nextNumber = document.querySelector("[data-next-number]");
    const nextTitle = document.querySelector("[data-next-title]");
    const nextDescription = document.querySelector("[data-next-description]");
    const nextEyebrow = document.querySelector("[data-next-eyebrow]");
    if (nextNumber) nextNumber.textContent = nextLesson ? String(nextTarget[0]).padStart(2, "0") : "✓";
    if (nextTitle) nextTitle.textContent = nextTarget[2];
    if (nextDescription) nextDescription.textContent = nextTarget[3];
    if (nextEyebrow) nextEyebrow.textContent = nextLesson ? `LESSON ${String(nextTarget[0]).padStart(2, "0")}` : "JOURNEY COMPLETE";

    const completionHeading = document.querySelector("[data-completion-heading]");
    const completionCopy = document.querySelector("[data-completion-copy]");
    if (completionHeading && completionCopy) {
      if (count === totalLessons) {
        completionHeading.textContent = "You did it. You understand the bigger picture.";
        completionCopy.textContent = "You worked through all eleven lessons, tested your understanding, corrected mistakes, and reached the end with more clarity. Not everyone takes time to learn before acting. You did.";
        document.body.classList.add("journey-complete");
      } else {
        completionHeading.textContent = "Your progress is building.";
        completionCopy.textContent = "Complete all eleven lesson quizzes on this device to unlock your full celebration.";
        document.body.classList.remove("journey-complete");
      }
    }
  };

  const unlockNext = node => {
    if (!node) return;
    node.classList.remove("locked");
    node.removeAttribute("aria-disabled");
  };

  const showToast = message => {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 5200);
  };

  const setTheme = theme => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      const isDark = theme === "dark";
      toggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      toggle.querySelector("span").textContent = isDark ? "☼" : "☾";
    }
  };

  const preferredTheme = localStorage.getItem(themeKey) || "dark";
  setTheme(preferredTheme);
  document.querySelector(".theme-toggle")?.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    navigation?.classList.toggle("open", !open);
  });

  const dashboardMenuButton = document.querySelector(".dashboard-menu-toggle");
  const dashboardSidebar = document.querySelector(".dashboard-sidebar");
  const sidebarOverlay = document.querySelector(".sidebar-overlay");
  const closeDashboardMenu = () => {
    dashboardMenuButton?.setAttribute("aria-expanded", "false");
    dashboardSidebar?.classList.remove("open");
    document.body.classList.remove("sidebar-open");
  };
  dashboardMenuButton?.addEventListener("click", () => {
    const open = dashboardMenuButton.getAttribute("aria-expanded") === "true";
    dashboardMenuButton.setAttribute("aria-expanded", String(!open));
    dashboardSidebar?.classList.toggle("open", !open);
    document.body.classList.toggle("sidebar-open", !open);
  });
  sidebarOverlay?.addEventListener("click", closeDashboardMenu);
  dashboardSidebar?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeDashboardMenu));
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeDashboardMenu(); });

  const videoOpenButtons = document.querySelectorAll("[data-video-open]");
  const videoModal = document.querySelector("[data-video-modal]");
  const videoPlayerSlot = document.querySelector("[data-video-player]");
  const videoModalLabel = videoModal?.querySelector("[data-video-modal-label]");
  const videoModalTitle = videoModal?.querySelector("[data-video-modal-title]");
  let videoPlayer = null;
  let videoReturnFocus = null;
  let activeVideo = null;
  let youtubeApiPromise = null;

  const loadYouTubeApi = () => {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === "function") previousReady();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube player could not load"));
      document.head.append(script);
    });
    return youtubeApiPromise;
  };

  const closeVideo = (completed = false) => {
    if (!videoModal || videoModal.hidden) return;
    try { videoPlayer?.destroy(); } catch {}
    videoPlayer = null;
    if (videoPlayerSlot) videoPlayerSlot.innerHTML = "";
    videoModal.hidden = true;
    document.body.classList.remove("video-modal-open");
    videoReturnFocus?.focus();
    if (completed) showToast("Great watch! Continue below when you are ready to learn more.");
  };

  const openVideo = async button => {
    if (!videoModal || !videoPlayerSlot) return;
    const videoId = button.dataset.videoId;
    if (!videoId) return;
    activeVideo = {
      id: videoId,
      title: button.dataset.videoTitle || "ClickBaitPays Video",
      label: button.dataset.videoLabel || "WATCH VIDEO",
      url: button.dataset.videoUrl || `https://www.youtube.com/watch?v=${videoId}`
    };
    videoReturnFocus = button;
    if (videoModalLabel) videoModalLabel.textContent = activeVideo.label;
    if (videoModalTitle) videoModalTitle.textContent = activeVideo.title;
    videoModal.hidden = false;
    document.body.classList.add("video-modal-open");
    videoPlayerSlot.innerHTML = '<div class="video-loading" role="status"><span aria-hidden="true"></span><p>Preparing your video...</p></div>';
    videoModal.querySelector(".video-close")?.focus();
    try {
      const YT = await loadYouTubeApi();
      if (videoModal.hidden) return;
      videoPlayerSlot.innerHTML = '<div id="cbp-youtube-player"></div>';
      videoPlayer = new YT.Player("cbp-youtube-player", {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          fs: 1
        },
        events: {
          onStateChange: event => {
            if (event.data === YT.PlayerState.ENDED) closeVideo(true);
          }
        }
      });
    } catch {
      const safeUrl = activeVideo?.url || "https://www.youtube.com/@clickbaitpaysus";
      videoPlayerSlot.innerHTML = `<div class="video-load-error"><strong>The video could not load here.</strong><p>You can still watch it directly on YouTube.</p><a class="button primary" href="${safeUrl}" target="_blank" rel="noopener">Watch on YouTube</a></div>`;
    }
  };

  videoOpenButtons.forEach(button => button.addEventListener("click", () => openVideo(button)));
  videoModal?.querySelectorAll("[data-video-close]").forEach(button => button.addEventListener("click", () => closeVideo()));
  videoModal?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeVideo();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...videoModal.querySelectorAll('button:not([disabled]), a[href], iframe')].filter(node => !node.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const faqItems = [...document.querySelectorAll(".faq-list details")];
  const syncFaqState = () => {
    faqItems.forEach(item => {
      const summary = item.querySelector("summary");
      const icon = summary?.querySelector("i");
      summary?.setAttribute("aria-expanded", String(item.open));
      if (icon) icon.textContent = item.open ? "✓" : "+";
    });
  };
  faqItems.forEach(item => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) otherItem.open = false;
        });
      }
      syncFaqState();
    });
  });
  syncFaqState();

  const scrollTopButton = document.querySelector("[data-scroll-top]");
  const updateScrollTop = () => scrollTopButton?.classList.toggle("is-visible", window.scrollY > 520);
  updateScrollTop();
  window.addEventListener("scroll", updateScrollTop, { passive: true });
  scrollTopButton?.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  document.querySelectorAll(".flashcard").forEach(card => {
    card.addEventListener("click", () => {
      const flipped = card.getAttribute("aria-pressed") === "true";
      card.setAttribute("aria-pressed", String(!flipped));
      card.classList.toggle("is-flipped", !flipped);
    });
  });

  document.querySelectorAll("[data-quiz]").forEach(quiz => {
    const form = quiz.querySelector("form");
    const submit = quiz.querySelector(".quiz-submit");
    const feedback = quiz.querySelector(".quiz-feedback");
    const lesson = Number(quiz.dataset.lesson);

    form?.addEventListener("change", () => { submit.disabled = !form.querySelector("input:checked"); });
    form?.addEventListener("submit", event => {
      event.preventDefault();
      const selected = form.querySelector("input:checked");
      if (!selected) return;
      const correct = selected.value === quiz.dataset.answer;
      quiz.classList.toggle("is-correct", correct);
      quiz.classList.toggle("is-incorrect", !correct);

      if (correct) {
        const completed = readCompleted();
        completed.add(lesson);
        saveCompleted(completed);
        feedback.innerHTML = `<div class="feedback-success"><strong>You got it! ✨</strong><p>${quiz.dataset.correctMessage}</p><p class="success-note">That clarity is progress. Keep going while the idea is fresh.</p></div>`;
        unlockNext(quiz.querySelector("[data-next-lesson]"));
        updateProgress();
        showToast(milestone(completed.size));
      } else {
        feedback.innerHTML = `<div class="feedback-retry"><strong>Good try. Let us lock this in together.</strong><p><b>Correct answer:</b> ${quiz.dataset.correctLabel}</p><p>${quiz.dataset.explanation}</p><button class="button secondary retry-button" type="button">Try Again</button></div>`;
        feedback.querySelector(".retry-button")?.addEventListener("click", () => {
          form.reset();
          submit.disabled = true;
          feedback.innerHTML = "";
          quiz.classList.remove("is-incorrect");
          quiz.querySelector("input")?.focus();
        });
      }
    });
  });

  document.querySelectorAll("[data-next-lesson]").forEach(link => {
    link.addEventListener("click", event => {
      if (link.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        showToast("Complete this lesson's knowledge check to unlock the guided next step.");
      }
    });
  });

  document.querySelectorAll("[data-reset-progress]").forEach(button => {
    button.addEventListener("click", () => {
      const confirmed = window.confirm("Reset the entire course and start again? All completed lesson quizzes saved in this browser will be cleared.");
      if (!confirmed) return;
      localStorage.removeItem(progressKey);
      document.querySelectorAll("[data-quiz]").forEach(quiz => {
        quiz.querySelector("form")?.reset();
        const submit = quiz.querySelector(".quiz-submit");
        const feedback = quiz.querySelector(".quiz-feedback");
        if (submit) submit.disabled = true;
        if (feedback) feedback.innerHTML = "";
        quiz.classList.remove("is-correct", "is-incorrect");
      });
      document.querySelectorAll(".flashcard").forEach(card => {
        card.setAttribute("aria-pressed", "false");
        card.classList.remove("is-flipped");
      });
      updateProgress();
      closeDashboardMenu();
      showToast("Course reset complete. Returning you to the beginning.");
      window.setTimeout(() => { window.location.href = "start-here.html"; }, 650);
    });
  });

  const glossarySearch = document.querySelector("[data-glossary-search]");
  glossarySearch?.addEventListener("input", () => {
    const query = glossarySearch.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll("[data-glossary-term]").forEach(card => {
      const show = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !show;
      if (show) visible += 1;
    });
    const empty = document.querySelector("[data-glossary-empty]");
    if (empty) empty.hidden = visible > 0;
  });

  const syncAmbientMotion = () => {
    document.body.classList.toggle("ambient-paused", document.hidden);
  };
  document.addEventListener("visibilitychange", syncAmbientMotion);
  syncAmbientMotion();

  updateProgress();
})();

/* Signal Motion: progressive enhancement. Content is visible by default;
   nothing depends on an animation finishing to read, click, or navigate. */
(() => {
  "use strict";
  if (!window.matchMedia || !Element.prototype.animate) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const connection = navigator.connection;
  const active = new Map();
  const queued = new WeakMap();
  const seen = new WeakSet();
  const root = document.documentElement;
  const allowed = () => !reduced.matches && !connection?.saveData && !document.hidden;
  let revealObserver;
  let loopObserver;

  const settle = () => {
    active.forEach(animation => animation.cancel());
    active.clear();
  };

  const play = (node, delay = 0, distance = 18, duration = 580) => {
    if (!node || !allowed() || node.closest("[hidden]") || node.contains(document.activeElement)) return;
    // Honour any existing transform (for example, the lesson number orbit).
    const base = getComputedStyle(node).transform;
    const shift = compact.matches ? Math.min(distance, 10) : distance;
    active.get(node)?.cancel();
    try {
      const animation = node.animate([
        { opacity: 0, transform: `translate3d(0, ${shift}px, 0)${base === "none" ? "" : ` ${base}`}` },
        { opacity: 1, transform: base }
      ], {
        duration: compact.matches ? Math.min(duration, 380) : duration,
        delay: compact.matches ? Math.min(delay, 90) : delay,
        easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards"
      });
      animation.id = "cbp-signal-motion";
      active.set(node, animation);
      const release = () => { if (active.get(node) === animation) active.delete(node); };
      animation.addEventListener("finish", release, { once: true });
      animation.addEventListener("cancel", release, { once: true });
    } catch {
      // Native HTML and CSS remain usable if the browser cannot animate.
      active.delete(node);
    }
  };

  const syncPreference = () => {
    root.dataset.motion = allowed() ? "on" : "off";
    if (!allowed()) {
      settle();
      if (reduced.matches || connection?.saveData) revealObserver?.disconnect();
    }
  };
  syncPreference();
  reduced.addEventListener?.("change", syncPreference);
  connection?.addEventListener?.("change", syncPreference);

  // A focus or tap during an entrance immediately settles that element.
  const settleTarget = event => {
    active.forEach((animation, node) => {
      if (node.contains(event.target)) { animation.cancel(); active.delete(node); }
    });
  };
  document.addEventListener("focusin", settleTarget);
  document.addEventListener("pointerdown", settleTarget, { passive: true });
  window.addEventListener("beforeprint", settle);
  window.addEventListener("hashchange", settle);
  window.addEventListener("pagehide", settle);
  window.addEventListener("pageshow", event => { if (event.persisted) settle(); });
  document.addEventListener("visibilitychange", syncPreference);
  // Native cross-page transitions already animate the incoming page. Avoid
  // stacking an unfinished entrance under that snapshot; no link interception.
  window.addEventListener("pagereveal", event => { if (event.viewTransition) settle(); });

  if (allowed() && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.forEach((entry, index) => {
        const node = entry.target;
        revealObserver.unobserve(node);
        if (seen.has(node)) return;
        seen.add(node);
        // Skip elements above a restored scroll position or a direct anchor.
        if (entry.boundingClientRect.bottom < 0) return;
        const options = queued.get(node);
        play(node, Math.min(options.delay ?? index * 55, 280), options.distance, options.duration);
      });
    }, { threshold: 0, rootMargin: "0px 0px 24px 0px" });

    const register = (node, options = {}) => {
      if (!node || queued.has(node)) return;
      // Do not animate both a card and its children.
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (queued.has(parent)) return;
      }
      queued.set(node, options);
      revealObserver.observe(node);
    };

    // The homepage leads with its message, then the action and activity loop.
    const hero = document.querySelector(".hero-copy");
    if (hero) {
      [hero.querySelector(".eyebrow"), ...hero.querySelectorAll("h1 > span"),
        hero.querySelector(".lead"), hero.querySelector(".button-row"), hero.querySelector(".trust-list")]
        .filter(Boolean).forEach((node, index) => register(node, { delay: index * 45, distance: 22, duration: 650 }));
      register(document.querySelector(".hero-cycle-stage"), { delay: 140, distance: 16, duration: 760 });
    }

    document.querySelectorAll(".page-hero, .lesson-hero > div:first-child, .dashboard-welcome > div:first-child, .calculator-hero > div:first-child, .completion-hero")
      .forEach(group => [...group.children].forEach((node, index) => register(node, { delay: index * 55 })));
    document.querySelectorAll(".dashboard-score, .lesson-orbit, .calculator-rule-chip")
      .forEach(node => register(node, { delay: 150 }));

    const groups = ".value-grid, .process-grid, .lesson-preview-grid, .lesson-list, .tool-grid, .platform-access-grid, .dashboard-stats, .resource-grid, .video-grid, .glossary-grid, .contact-grid, .question-grid, .faq-list, .calculator-explainers";
    document.querySelectorAll(groups).forEach(group => {
      [...group.children].forEach(node => register(node));
    });
    document.querySelectorAll(".section-heading, .center-heading, .dashboard-section-head, .campaign-teaser-copy, .landing-path > div:first-child, .transparency > div, .landing-final > div:first-child, .next-lesson-card, .dashboard-note, .community-card, .landing-video-card, .quiz-top, .quiz-card > h2, .lesson-section > h2, .lesson-section > p, .lesson-section > .notice, .legal-content > h2, .legal-content > p")
      .forEach(node => register(node));
  }

  // Native details controls keep their keyboard behaviour and open immediately.
  document.querySelectorAll(".course-nav, .faq-list details, .question-grid details, .calculator-explainers details").forEach(details => {
    details.addEventListener("toggle", () => {
      if (details.open) [...details.children].filter(node => node.tagName !== "SUMMARY")
        .forEach(node => play(node, 0, 6, 260));
    });
  });
  document.querySelector(".dashboard-menu-toggle")?.addEventListener("click", () => {
    if (document.querySelector(".dashboard-sidebar.open")) {
      play(document.querySelector(".dashboard-nav"), 50, 8, 320);
    }
  });

  // Stop the existing decorative wheel once it leaves the viewport.
  const loop = document.querySelector(".hero-cycle-stage");
  if (loop && "IntersectionObserver" in window) {
    loopObserver = new IntersectionObserver(([entry]) => {
      loop.classList.toggle("motion-loop-paused", !entry.isIntersecting);
    });
    loopObserver.observe(loop);
  }
})();
