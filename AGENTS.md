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
