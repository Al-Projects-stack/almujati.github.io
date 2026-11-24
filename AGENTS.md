# AGENTS.md — Change Log

## Project: Al Mujati Portfolio (almujati.github.io)

Dual-theme portfolio: **Cyber Edition** + **Vista Edition** with a theme selector at root.

---

### Session 1 — Initial Build
- Moved existing cyber portfolio into `cyber/` folder with all assets (images, CV files)
- Created root `index.html` as dual-theme selector (Cyber + Vista cards)
- Built `vista/index.html` — full Windows Vista desktop simulation:
  - Boot sequence (Vista logo, green loading bar, fade to desktop)
  - Aurora wallpaper via CSS/SVG gradients
  - Aero Glass windows (draggable, resizable, minimize/maximize/close)
  - Desktop icons: My Portfolio, Projects, Skills, Contact, GitHub, Recycle Bin
  - Taskbar with Start orb, open window pills, system tray + clock
  - Start Menu with left/right columns, search bar, power button
  - Right-click context menu on desktop (Refresh, Change Theme, View Source, Properties)
  - Recycle Bin easter egg with right-click context actions
  - Cross-theme "Switch Theme" navigation buttons
- Added favicons to all pages (root, cyber, vista)
- Created README.md documenting both themes

### Session 2 — Polish & Fixes
- Fixed boot sequence (DOMContentLoaded → direct setTimeout call)
- Replaced invalid Google Fonts Segoe UI with Inter
- Removed auto-redirect loop from theme selector
- Fixed CSS custom properties used in inline styles (replaced with concrete values)
- Added Switch Theme buttons: Vista-style on Cyber page, Cyber-style on Vista page
- Positioned switch buttons top-left with auto-hide after 4s, reappear on scroll to top
- Updated theme selector tagline: "Same guy, two vibes. Pick the world that fits how you see it."
- Updated card descriptions (Option A copy)
- Replaced cyber subtitle from "v2.0 // NEURAL INTERFACE" to "ELECTRIC UNFILTERED"

### Session 3 — Project Reorder & Real Logo
- Reordered projects: SewAndGrow moved to position #2 (after CarIQ) in both themes
- Updated Vista projects array to match Cyber projects lineup
- Added real Windows Vista logo images to boot screen (uploaded by user)

### Session 4 — Interactive Elements
- Made Start Menu search bar functional: filters sm-item elements in real time
- Made volume icon (🔊) interactive: shows volume slider popup with percentage
- Made network icon (📶) interactive: shows Wi-Fi status popup with connection info
- Made power button (⏻) functional: shows "Shutting down..." overlay animation, then redirects to theme selector
- Both tray popups close on outside click
- Fixed project button labels: "View on GitHub →" for GitHub URLs, "Visit Site →" for external URLs, hidden for '#'

### Session 5 — Work Preference & Mobile-Friendly Vista
- Updated `cyber/index.html:1663` work preference from "Remote / Hybrid" to "Remote / Hybrid / In office"
- Replaced Vista "desktop only" warning (`vista/index.html:15-44`) with a full mobile layout: Vista-branded header, About, Projects (cards with tags/buttons), Skills (grouped tags), Contact, and theme switch links — populated from same `projects`/`skillGroups` arrays, with `html,body{overflow:auto}` fix so it scrolls

### Session 6 — Rebrand to AI Engineer
- Rewrote hero across both themes from Backend/Cloud to AI focus:
  - `cyber/index.html:1456-1463` hero: "Backend & Cloud Engineer. Reliable systems." → "AI Engineer. Production-ready AI systems." + new hero-desc about LLM integrations, RAG pipelines, vector DBs, AI agents, containerised model deployments on Azure
  - `cyber/index.html:2242` typewriter words: `['Reliable','Scalable',...]` → `['LLM-powered','RAG-native','Agent-driven','Cloud-native','Production-ready']`
  - `vista/index.html:410-412` desktop About window + `vista/index.html:331-332` mobile About: subtitle "Backend Developer & AI Engineer" → "AI Engineer" and matching AI-focused description

### Session 7 — Sewandgrow Past Tense
- Kept Sewandgrow Website as a project in both themes but rewrote to past tense (no longer current employment):
  - `cyber/index.html:1830-1838` + `vista/index.html:548` shortDesc/fullDesc/problem: "maintained under an ongoing client contract" → "built and maintained under a past client contract" (and matching tense fixes)
  - Removed `cyber/index.html:1513-1527` "Currently working remotely at Sewandgrow" paragraph and the `2025 Remote Developer · Sewandgrow` timeline entry

### Session 8 — Title to Software Engineer
- Rebranded role titles from "AI Engineer" → "Software Engineer" per request (broader positioning):
  - `cyber/index.html:1458-1459` hero h1: "AI Engineer. Production-ready AI systems." → "Software Engineer. Production-ready systems."
  - `vista/index.html:331-332` mobile About + `vista/index.html:411-412` desktop About window: subtitle + opening line "AI Engineer/engineer" → "Software Engineer" (descriptions kept LLM/RAG/cloud wording)

### Session 9 — Full-stack rebalance + dash cleanup
- `cyber/index.html` hero-desc/about/title/meta + `vista/index.html` About/terminal reworded from AI-only to full-stack (backend, web, DB, Docker, Azure, AI where it adds value); typewriter `twWords` → Thoughtful, Clean, Reliable, Maintainable, Production-ready; removed all en/em dashes in live files (commas instead)

### Session 10 — Vista login + real orb/flag/profile images
- New `vista/profile.jpg` (512px, 58KB, from uploaded photo), `vista/start-orb.jpg`, `vista/vista-flag.webp` (renamed from space-filled uploads)
- Start orb now uses `start-orb.jpg`; boot screen uses `vista-flag.webp`; Start Menu header uses flag bg + `profile.jpg` avatar tile
- New `#loginScreen`: blurred-wallpaper logon with profile avatar, "Al Mujati / Full Stack Software Engineer", fake password (Enter), Welcome spinner, footer clock + Switch user/Restart/Shut down; flow is boot → login → desktop (desktop gated via `body.logged-in`; About auto-opens post-login; mobile skips login)

### Session 11 — Vista bug sweep
- `#logoutOverlay` moved outside `.desktop` so "Shutting down..." shows when shutting down from the login screen
- `#balloonBox` z-index raised above the login screen ("Switch user" balloon was hidden); tip balloons now start after login; balloons skipped on mobile
- Switch Theme button: starts hidden, shows for 4s after login, reappears when the mouse nears the top-left; moved to `left:100px` so it no longer covers the desktop icons
- Desktop right-click menu ignored on mobile and before login (long-press on links works again); context menus clamped to the viewport
- Volume/Wi-Fi popups moved out of `#taskbar` (nested backdrop-filter made them see-through) and given a darker glass background
- Start Menu avatar no longer prints "AM" over the photo; startup chime plays once (on login only); BSOD closes on any key; terminal escapes typed input; clocks tick on the minute; maximized windows sit flush on the 42px taskbar
- Tray "Gadgets" toggles the sidebar; Recycle Bin copy fixed; GitHub "20+ repositories"; Docker de-duplicated in Skills; mobile education matches desktop
- Removed the Hustle Meter (Applications → Interviews) gadget
- Slideshow gadget → "Project Gallery": 8 project screenshots in `vista/gallery/` (480×300 JPGs, ~150 KB total; CarIQ + CV Automation from repo `docs/`, Landing Pages/Sewandgrow/Finance Dashboard/GitHub Dashboard captured with headless Chrome, Chat/Weather resized from `cyber/`), built from a `gallery` array with captions and clickable dots; clicking the image opens Projects filtered to that project. Profile photo no longer in the slideshow

### Session 12 — Pixel-art Al mascot (intro)
- New reusable `<al-mascot>` web component in `assets/al-mascot.js`: pixel-art Al drawn pixel by pixel on a 56x74 canvas (no image files), styled after the user's pixel-art portrait: navy suit, plum shirt, brown belt + leather shoes, purple-tinted glasses (occasional glint), short hair, beard. Poses via `pose="idle|walk|wave|cheer|present-l|present-r"` (frame-based: 4-frame walk with leg lifts + body bob, 2-frame wave with open smile, 2-frame cheer hop, one-arm presenting gestures); `worlds` attribute shows the pixel Cyber hexagon (left hand) and Vista orb (right hand) in the cheer and present poses. Arms are thick pixel strokes at any angle. Static first frame under prefers-reduced-motion
- Root `index.html` intro: Al walks in from the left while "HI, MY NAME IS AL" types, waves once he arrives, then raises both hands holding the two worlds for "TWO WORLDS. ONE DEV."; line holds lengthened to 1.2s / 1.5s. Walk-in starts on a timer (not requestAnimationFrame) so background tabs still get it
- Al presents the worlds: the theme cards no longer fade in together. After the intro, Al walks (FLIP animation) to `#alSlot` between the cards (above them on mobile), holds out the hexagon and the Cyber card pops in, then the orb and the Vista card pops in, then he idles (`.shown` / `.settled` card classes, `cyberIn` / `vistaIn` keyframes). Clicking or pressing a key skips straight to the end state; clicking Al afterwards makes him wave. Reduced motion and noscript show both cards immediately
- Side profile + realistic walking: new `walk-side` (8 frames, 80ms: heel strike, loading, mid stance, push, toe-off, knee-up swing, passing, reach; legs/arms are jointed strokes from a `STEP` angle table, the far leg/arm drawn in shadow, and the body drops so the lower foot stays planted, giving a natural bob) and `stand-side` poses with a profile head (hair at the back, ear, glasses arm, nose, beard). `facing="left"` mirrors him. Front `walk` (used when he walks down to the cards) is now 8 frames too
- Intro walk-in is side-on at a constant speed matched to his stride (2.2 to 3.6s depending on screen width, so feet don't skate), then he stops, turns to face the screen and waves; "HI, MY NAME IS AL" stays up until he has waved for 1.6s
- Al lives on the page after the intro (`assets/al-roam.js`, `AlRoam.start(al, {home, avoid, text, bump, worlds})`). Every few seconds he picks an activity: wander (sometimes waves), push-ups, magic PC (conjure sparkles and poof, standing desk + monitor with code typing up the screen, then poof it away), walk into a card's glass (glasses fly off, falls flat, dazed stars, springs up, glasses back on, walks back; the card wobbles), or juggle the worlds 4 to 8 throws, fumble them onto the floor, scoop them up and present Cyber then Vista (each card glows). Sometimes he walks home to the slot between the cards
- Nothing gets blocked: he is moved onto an `.al-stage` layer under the page content (z-index 1, pointer-events off), and each spot is checked against the heading, subtitle, cards, button and footer with the room that activity needs (`EXT`), inside the visible viewport. His walking paths may pass behind the cards but never across text. Clicking on him still makes him wave. Resizing or returning to the tab sends him home and restarts. `AlRoam.next = 'pc'` queues a specific activity (testing). Off under reduced motion
- Mascot canvas is now 103 sprite px wide, overhanging the 56-wide element box (layout unchanged) to fit planks, the desk and dropped worlds. Tilted poses (push-ups, falling) use nearest-neighbour sprite rotation so they stay crisp. New poses: juggle, fumble, scoop, conjure, work, unconjure, pushup-in/pushup/pushup-out, bonk, dazed, getup, glasses-on; one-shot poses hold their last frame; `customElements.get('al-mascot').dur(pose)` gives timings
- More realistic activities: side frames are now articulated (`lean` tilts the upper body at the hips on its own layer, `hands` plants a hand on the floor or a knee and the arm bends to reach, kneeling/sitting leg presets, `dx` body shift); front view got a `crouch` and `hold` (worlds in hands)
  - Push-ups: bend, squat, hands down, step one foot back then plank; reps with in-between frames; then knees down, sit back, one foot forward, both hands on the knee to push up, stand, dust off hands
  - Bonk: smack (stars at the glass), glasses fly, falls with a small bounce; propped on an elbow, sits up, rubs his head, finds glasses in his lap and puts them on, knees up, rolls onto hands and knees, lunge, pushes up off his knee, pushes glasses up his nose (element shifts 16 sprite px to where he fell)
  - PC: rubs hands before conjuring, turns to the desk and cracks his knuckles, types, hand on chin thinking (cursor blinks), types again, leans back and stretches, poofs it away
  - Juggle: cups hands and the worlds appear, knees give on catches; fumble has bounce, roll back in and a head scratch; picks them up with a real squat
  - Wander: looks left and right, sometimes a big stretch-yawn, sometimes waves
- Glasses redrawn as browline glasses: silver rim over each lens, two separate purple lenses with a highlight, rounded bottoms with skin between; side view has a rimmed lens and a short arm to the ear (was reading as a visor)
- To reuse in cyber/ or vista/: `<script src="../assets/al-mascot.js"></script>` then `<al-mascot pose="wave" style="width:100px"></al-mascot>`

### Session 13 — Al across the portfolio, world-specific activities
- `assets/al-roam.js` generalised: `stage` ('fixed' viewport layer for scrolling pages, or an element to live inside), `z`, optional `home`, `bump` as elements or a selector, `acts` (which activities he picks from; repeat a name to weight it), `teleport` ('glitch' | 'minimize'), `watch` (every 0.7s and after scrolling stops, if content or a window ends up over him he teleports to a free spot; if none exists he stays hidden until one opens), `delay`. Bumped elements wobble with the Web Animations API on the individual `translate` property (no CSS classes, so it never restarts a Vista window's open animation); root `index.html` alGlow stays, its old bump keyframes were removed
- New poses in `assets/al-mascot.js` (props drawn per frame, `render()` adds whole-sprite effects: `glitch` band-shift / pixel dropout / cyan-magenta split, `scale` genie shrink, `hidden` + scanline):
  - Cyber: glitch teleport (breaks into RGB-split pixels, collapses to a scanline, re-forms elsewhere); hologram hack (finger snap, holo panel unfolds, types in the air with code rain and an upload bar, ACCESS GRANTED tick, fist pumps, panel folds away); bug squash (pixel bug crawls up, "!" over his head, leans in, knee up, stomp with splat, green tick, dusts his hands, thumbs up); hoverboard (board materialises under his feet, dips and lifts off with thrusters, rides to a far free spot at 3x walking speed, lands, board dissolves)
  - Vista: minimize/restore (Aero glass frame wraps him and genies down to nothing, used for relocating); UAC "Cancel or Allow?" (dialog pops up, he clicks Allow, it pops up again, again, facepalm, clicks once more); Windows Update (sits on the floor, endless green marquee, nods off with Zzz, bar completes, jolts awake, gets up); BSOD (magic PC crashes to a blue screen, he recoils, smacks the monitor twice, Vista boot screen, desktop, thumbs up, back to work); Solitaire (shuffles a deck, then the win cascade bounces out both ways with card trails)
- `cyber/index.html`: Al roams the side gutters on a fixed layer (z 1, under `.container` z 2) after the page loader (or 6s), avoiding `.container > *` and the fixed UI (sticky nav, switch button, location tag, scroll-top, shortcut hint, toast, project modal); walks into sections/header; acts: wander, push-ups, PC, bonk, juggle + hack, bug, hover, glitch. Size `clamp(64px,6vw,84px)`. On phones the content is wall to wall, so he stays hidden
- `vista/index.html`: Al lives inside `#desktop` (z 2: above the wallpaper, under icons z 10 and windows z 1000+) once logged in (desktop only, not the mobile layout); avoids icons, open windows, sidebar, taskbar, Start menu, menus, popups and balloons; walks into open windows; dragging a window over him makes him minimize away and restore somewhere free; acts: wander, push-ups, bonk, juggle + uac, update, bsod, solitaire. Size `clamp(64px,5.5vw,80px)`
- Mascot canvas context uses `willReadFrequently` (glitch frames read pixels back)

### Session 14 — Fair activity order, more room, glitch moves, square run, Al follows you
- Activity order is a shuffle bag: every activity once in random order before any repeats, no back-to-back repeat across rounds; one that has no room right now goes to the back of the round and is retried (the old pick only excluded the last one, and the 2x weighting made some come up far more). Page act lists no longer duplicate names. `AlRoam.history` lists what he did ('?' = no room)
- New `content` option: scans the given roots for what is really on screen (text node boxes, images/buttons/inputs, anything with a background, 3+ borders or a shadow; text inside a card counts as the card) and avoids just that, so the open space inside sections is usable. Cached 250ms (~6ms per scan on Cyber). Cyber uses `content: '.container'` plus `.hero h1` (typewriter word grows) and `.profile-box` as solid blocks; bumpable things are now the actual cards (`.panel, .proj-slideshow, .profile-box, .avail-panel, .proj-card`). Free spots on Cyber's first screen went from just the gutters to ~1000
- He now needs to be covered on two checks running (~1.4s) before teleporting away, so passing tooltips/ripples don't send him off; the cover check waits for his entrance (no double entrance)
- New Cyber glitch moves: flash step (low dash stance, bursts out in an RGB streak and re-forms 3 to 4 times along a free line, a fading cyan afterimage left at each spot, slides to a stop in a puff of dust and pushes his glasses up), shadow clones (stutters and splits, two clones glitch in beside him, they wave and cheer slightly out of sync, one lags, they glitch away), lag spike (freezes mid-wave with a buffering ring over his head, then catches up at double speed). Poses: dash-ready, flash-out, flash-in, dash-stop, afterimage (`tint` recolours the whole frame), split, lag (`spin` ring), plus `streak` speed lines and `dust`
- Cyber profile photo is now `../vista/profile.jpg` (same as Vista)
- Square run (Cyber, once per visit, after two activities and 6s on the page: `special: {act:'square', after:2, at:6000}`, `spinner: '.avatar-wrap'`): he glitches onto the top of the spinning gradient square behind the photo and runs against the spin, his feet following the real surface every frame (angle read from the `::before` computed transform), slowly gets carried to the edge, windmills, tumbles off in an arc to a free spot beside the photo, lies dazed, gets up, glasses on. Poses: run-side, run-flail, tumble
- Al follows you into the world you pick: on the selector page clicking Cyber makes him glitch out, clicking Vista wraps him in a glass window that minimizes (navigation waits for it, max 2s; modifier-clicks open normally). A `sessionStorage` flag makes him glitch in on Cyber as soon as the page is up (450ms after the loader), or restore onto the Vista desktop 0.9s after login. `AlRoam.start` now returns `{ leave(pose) }` for this

### Session 15 — Al on phones: his own strip
- On phones there is no free space beside the content, so he used to pop in, get covered within seconds and vanish for good (Cyber), sit cramped above the cards (world picker), or not exist (Vista). Now each page gives him a reserved strip on phones and he never needs to dodge anything
- `assets/al-roam.js`: new `bounds` (element / rect / function returning one or null) keeps him inside it instead of the screen, and `floor` puts his feet on its bottom edge; activities keep playing while the strip is scrolled away
- World picker (`index.html`, max-width 660px): his slot above the cards gets 34px headroom and his bounds become a full-width band around it; activities there: wander, push-ups, PC, juggle (no walking into cards)
- Cyber (`.al-strip` after the hero, max-width 820px): 118px band with a faint cyan floor line, he lives in it (stage = strip) and makes his glitch-in entrance when it first scrolls into view; all Cyber activities except bonk and the square run
- Vista mobile layout (`.al-strip` after About, max-width 820px): same idea with a blue floor line, minimize/restore entrance; wander, push-ups, juggle, UAC, Windows Update, BSOD, solitaire
- Desktop behaviour unchanged (strips are `display:none` above the breakpoints)

### Session 16 — Al falls when you scroll (Cyber), glitched power-up, talks when clicked, laptop nudge on phones
- Falling on scroll (`fall: true`, Cyber desktop): when the page scrolls (a burst of 3+ scroll events, 60px+), he stops whatever he's doing and falls in place on his fixed layer: arms flailing over his head, legs kicking, glasses lifting off his face, wind lines rushing up, the sprite shaking harder the faster you scroll (switches to a glitchier `fall-fast` past ~48px/frame). 240ms after scrolling stops he drops (accelerating) onto the nearest free spot, preferring below him; if it's above him or far away he blinks there through a glitch first. He hits the floor with a superhero landing (back knee and a hand down, shockwave and dust, then rises) or, after a long fall, about half the time flat on his back (bounce, dazed, gets up), then pushes his glasses up and carries on. Scroll shifts caused by the page changing height (the hero typewriter wraps and unwraps, ~61px) are ignored. New poses: `fall-in`, `fall`, `fall-fast`, `fall-warp`, `land`, `crash` (frame fields `floatGlasses`, `wind`, `impact`)
- Glitched power-up (Cyber desktop and phone strip, `clickPower: true`): only when you click him 3 times within 1.8s (not in his random activities). First click is a joke, the second warns "one more click and I can't hold it in!", the third stops whatever he's doing right where he is and powers up, then he carries on. Fists at his hips, crouches and charges while the sprite shakes, energy motes rise and sparks crackle as a flame-shaped aura grows (gold inside, cyan/magenta split edges, rows slipping like a glitch), yells in a bubble ("HAAAAAAAAA!!" and two others), bursts in a big glitch, hair spikes up glowing gold (flickers cyan now and then), holds it 2 to 3s, powers down and rubs his hands. Poses `power-up`, `powered`, `power-down` (fields `aura`, `spiky`, `motes`, `bolt`)
- The world reacts to the power-up (`quake` option, Cyber: content, nav, backdrop grid/orbs/canvas, fixed buttons and his own layer): the whole page shakes (inline `translate` jitter, building while he charges, a big jolt at the burst, a rumble while he holds it). A full-screen pixel overlay (3x pixels, above the page, pointer-events off) draws cracks: floor cracks spread from his feet while he charges, then at the burst the screen cracks like glass from his chest (straight spokes plus broken rings, white lines with cyan/magenta glitch edges), a white flash and ~46 chips flying out; cards within ~420px jolt away from him. Powering down, the cracks glitch and flicker away and everything is put back. Interrupting it (scrolling starts a fall) removes it all at once. The covered-check leaves him alone while he's powering up
- Al stays in front of the breaking world: for the power-up he is moved onto his own fixed layer (z 2147482995) above the cracks (z 2147482990) and the page, under his speech bubble, pinned to his spot every frame (on phones it follows his strip and ignores the page's shake, so he stays steady while everything behind him shakes). Afterwards (or when interrupted) he goes back onto his stage at the same spot

- Click Al anywhere he is: a speech bubble over his head with a joke about one of the projects (15 shared lines in `assets/al-roam.js` QUIPS, shuffled, no repeats until all are said, plus 2 to 3 per page via `quips`); mid-fall he yells instead. He waves if he's free. The cursor turns into a pointer over him; clicks on links/buttons/cards under him still go to them. Bubble styles: `bubble: 'cyber'` (dark, cyan border, monospace), `'vista'` (white Aero-ish), default plain purple. It follows him, stays on screen, flips under his feet near the top; in strip mode it sits beside him inside his strip so it doesn't cover the page
- Phones (`tip`): shortly after his entrance (once he's actually visible, not behind Vista's boot screen) and every 4th click he says to try it on a laptop: world picker, Cyber strip and Vista strip each have their own line. Vista's phone Al now waits for the boot screen to finish before his entrance

### Session 17 — Tour guide, hide and seek, CV stamp, eyes that follow you
- Tour guide (`guide: {cards, name}`, Cyber `.proj-card`, Vista `#projectsBody .proj-item`): hover a project for 450ms and he walks or teleports beside it, faces it, points (`point` pose) and says that project's line (`PROJECT_LINES`). Clicking the card he showed you gets a "Good pick!" once he can be seen again (usually after the modal closes)
- Hide and seek (`hide` act, selector option): teleports behind a fully visible card/window near a side edge so his head peeks out, for 12 to 16s (`peek` pose). Clicking just beside the card where he peeks finds him: he jumps out (`found`), count kept in `localStorage` `alFound`. Otherwise "Nobody found me... I win again." On Vista he hides behind the frosted glass windows
- CV stamp (`cv`, Cyber `#cv-btn, .cv-dl`): opening or downloading the CV makes him conjure it, read it (more and more impressed), stamp it HIRED and hold it up (`cv-out`, `cv-read`, `cv-stamp`, `cv-show`); if it opened in a new tab he does it when you come back
- Eyes follow the cursor within 380px (`al.look('l'|'r'|'u'|null)`, head shifts a pixel); a fast swipe past his head (checked along the swipe segment) makes him duck; resting the cursor on him makes him shy, then wave (both only between activities)

### Session 18 — Al bug sweep (tested end to end in headless Chromium with real mouse, wheel, keys and touch)
- Stuck idle: when the once-per-visit square run had no room (narrower laptop windows), it was retried forever and he never did anything else. Now at least one other activity happens before it's tried again
- Falling: only scrolling the visitor does counts (wheel, touch, scroll keys, pointer press for the scrollbar / nav links), so the page's own scroll shifts (hero typewriter) can't make him fall; one big jump (Page Down, space, a wheel without smooth scrolling) now counts too, not only bursts of events
- Shy and duck now interrupt calm activities (`react()`: stops where he is, plays the poses, carries on) instead of only firing in the short gaps between activities, so they actually happen; the wave after shy is ~1.4s
- Tour guide: for a card in the middle of a grid (no room right beside it) he goes to the nearest free spot level with its row and points from there; hovering while he's falling / landing / teleporting / powering up now waits and comes over once he's free (if you're still on the card)
- Script tags load `al-mascot.js?v=N` / `al-roam.js?v=N` (now 20) so a browser never mixes a new page with old cached Al scripts after a deploy (bump the number in all three pages whenever either script changes)

### Session 19 — Steady hero, Al on the project cards
- Cyber hero typewriter no longer moves the page: the heading's `min-height` is set to its tallest word (measured on load, after web fonts load, and on resize), so the long words wrapping to an extra line don't push everything below up and down every few seconds
- Tour guide `onCard` (Cyber): when there's no free spot within ~180px of the hovered card (cards in the middle of the grid, or further down the projects), he dashes and flash-steps onto the card itself, his stage lifted to z 3 over the page (under the nav and modal), standing on its top edge at the end nearer to him (its bottom edge if the top is off screen), points, says the project's line, then flash-steps off to the nearest free spot. The covered-watch leaves him alone while guiding / perched
- Falling onto a card (scrolling, `onCard`): when the scroll stops and a project card's top edge is under him (or, half the time, the nearest one within ~360px), he drops onto it, superhero-lands, gets a shock (new `shocked` pose: jolt, hands up, "!" over his head), points and says his line about that project, then flash-steps off
- New pose `shocked*` in `assets/al-mascot.js`

### Session 20 — Parkour on the cards, night shift, bug invasion
- Parkour (`parkour` act, option `parkour: {cards, z}`, `z` a number or `'card'`; Cyber project cards and panels, Vista active window, picker cards on desktop): he crouches, jumps onto a card and sits on its top edge swinging his legs, hangs off its bottom edge doing pull-ups, or vaults to the next card. His stage is lifted while he's up there (`perch(on, by, z)` tracks who lifted it, so a parkour run and the tour guide can't drop each other's layer). If the card moves or closes he gets off (`pkHold` throws `PK_MOVED`). Sit and hang spots may briefly overlap a neighbouring card because grid gaps are small; clear ledges are preferred. Debug: `AlRoam.ledges()`
- Night shift (visitor's local time, `mood()`, rechecked every 30s by `dress()`): night 22:00 to 06:00 = nightcap (`cap` attribute on `<al-mascot>`, all poses), extra yawns, `nap` act with Zzz (not for a minute after he's been woken, `wokeAt`), and any real mouse move, key, scroll or touch jolts him awake (clicking him wakes him without counting toward the power-up). Morning 06:00 to 11:00 = coffee mug (`MUGS` swaps idle/walk poses, `coffee` act). Friday all day = `dance` act. One greeting per visit (`sessionStorage` `alHello`). Phones get all of this
- Bug invasion (option `bugs: {block, bottom}`; desktop only, needs a keyboard): typing "bugs" anywhere outside an input starts a 24-bug swarm on a canvas over the page, with Al on a layer in front. Click bugs to squash them, Al stomps any older than 3.4s. HUD shows bugs left and both scores, Esc / resize / hiding the tab ends it cleanly, clicks on bugs don't reach the page, best score in `localStorage` `alBugBest`. The "g" of "bug" is swallowed so Cyber's G shortcut doesn't open GitHub. Debug: `AlRoam.game()`
- Fixes found while testing: CV reading no longer gets teleported away by the covered-watch (he moves to a free spot first, `kind='cv'`); hovering a card he landed on by himself now still gets the tour (`hoverCard`); hovering a project while he's hiding or on the square run is no longer ignored, he finishes and then comes over if you're still on it; `onCard` / `landOnCard` no longer overwrite their perch owner, which could leave his layer raised
- New poses in `assets/al-mascot.js`: `nap*`, `coffee*`, `idle-mug`, `walk-mug`, `walk-side-mug`, `stand-side-mug`, `dance`, `pk-*`, `ledge-sit`, `ledge-hang`, `pullup`. Script tags now `?v=21`

---

## File Structure
```
almujati.github.io/
├── index.html                     # Theme selector
├── AGENTS.md                      # This file
├── README.md                      # Project docs
├── cyber/
│   ├── index.html                 # Cyber portfolio
│   ├── chatsystem.jpg
│   ├── image_2025-10-30_123547581.png
│   ├── upscaled_image.jpg
│   ├── Weather.jpg
│   ├── Al_Mujati_Master_Portfolio_CV.docx
│   └── Al_Mujati_Master_Portfolio_CV.pdf
├── vista/
│   ├── index.html                 # Vista desktop portfolio
│   ├── windows-vista-logo.jpg
│   └── windows-vista-logo-png_seeklogo-153146.png
└── my-starting-projects/          # Legacy prototypes (unchanged)
```
