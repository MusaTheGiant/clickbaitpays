# Signal Motion 2.0 update

20 September 2026

This complete website package adds clearly visible, cinematic motion to the approved Signal Aurora design. Signal Motion 2.0 replaces the original overly brief timings with longer entrances, wider staggers, depth, glow and controlled blur while keeping reading and navigation immediate.

## What changes

- The homepage introduces its headline, explanation, actions and activity loop in a deliberate cinematic sequence.
- Page headings, selected sections and cards reveal once with slower movement, depth and alternating direction when they enter the viewport.
- Buttons have brief press feedback; primary buttons have a single light sweep on mouse hover.
- Cards and navigation links have small hover movements on devices with a mouse.
- Dashboard menus and expandable sections open smoothly. Quiz feedback and progress updates have short transitions.
- The hero headline carries a slow cyan, violet and magenta light flow, while the activity loop receives a soft breathing halo.
- Supporting browsers use a more noticeable native page transition. Other browsers retain normal page navigation.
- Phone and touch-device entrances remain clearly visible but use shorter movement and timings. Reduced-motion preferences disable animation. Entrances settle immediately when the visitor taps or focuses a control.
- Decorative activity-loop motion pauses offscreen, and animations stop when the tab is hidden.

Only two existing website files changed:

1. `assets/app.js`
2. `assets/styles.css`

This guide is the only added file. All 29 HTML pages, text, brand colors, button dimensions, destinations, lesson content, quiz answers, calculator data and logic, SEO records, social preview images, PDF resources and video configuration are unchanged from the previous complete package. The earlier fourth-video update and Social Media Compliance Deck resource are included.

## Update GitHub

If the current live website already contains the previous resources/video update:

1. Extract this ZIP on your computer.
2. Open the extracted `assets` folder. Keep it open.
3. Open your website repository on GitHub. Select the branch used by GitHub Pages, then open its existing `assets` folder.
4. Click **Add file**, then **Upload files**.
5. Drag only the extracted `app.js` and `styles.css` files into the upload area. Upload the files inside the existing `assets` folder, not a second assets folder.
6. Use a commit message such as `Upgrade to Signal Motion 2.0` and commit the changes to the publishing branch.
7. Wait for the GitHub Pages deployment to finish. Open the website and refresh. If the old styling remains, use a hard refresh or a private browser tab.

If earlier website updates have not yet been uploaded, upload the complete extracted package to the repository root, preserving its folders. `index.html` must be at the repository root. Upload the extracted files, not the ZIP. GitHub's upload action does not remove obsolete files already in the repository.

No live website or repository was changed automatically.

## Verification and remaining visual check

Passed:

- JavaScript syntax checks.
- Existing site integration and calculator test suites, including all 29 pages, local links, 11 lesson quizzes, lesson-status logic and 28 SEO/social records.
- Sixteen additional code-level checks using the real HTML and simulated animation/browser APIs: content stays visible; reveals run once; mobile timings are capped; reduced motion, data saving, missing APIs and animation failures remain usable; focus and taps cancel entrances; tab changes, printing, anchors and history restore settle motion; menu and activity-loop behavior remains safe; the complete stylesheet parses without errors.
- A byte comparison of the previous package confirms that only the two assets changed, and the new guide was added.
- ZIP integrity and packaged-file checks.

The browser security policy blocked local preview. Rendered appearance and actual browser/device performance were not verified in this session. After publishing, check the homepage, dashboard menu, one lesson quiz and the calculator on a phone and a desktop. Also enable your device's Reduce Motion setting and confirm that navigation and content remain immediate.

No animation library, additional network request, scroll hijacking, or link interception was introduced. All content is visible without the new animation script.

Native page-transition reference: [MDN: @view-transition](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition).
