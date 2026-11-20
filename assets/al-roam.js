/*
  AlRoam: lets an <al-mascot> live on a page. Every few seconds he picks something to do and does
  it in a free part of the screen.

  He sits on a layer UNDER the page content with pointer-events off, and every spot he uses is
  checked against the content first (with the room that activity needs), so he never covers or
  blocks anything. He may pass behind cards, but never walks across text. With `watch` on, if
  content ends up over him anyway (the page scrolls, a window is dragged over him) he teleports to a
  free spot; if there is no free spot he stays hidden until one opens up.

    AlRoam.start(alEl, {
      stage:    'fixed' (viewport layer, for scrolling pages) | an element to live inside |
                omitted (absolute layer on the body),
      z:        stage z-index (default 1),
      home:     optional element whose box is his resting place,
      avoid:    selector of everything his activities must stay clear of,
      text:     selector of things he must not walk across,
      bounds:   element / rect / function returning one (or null): keep him inside it instead of the
                screen (strip mode for phones); his activities play even while it is scrolled away,
      floor:    with bounds, his feet always on its bottom edge,
      content:  selector of content roots to scan for what is really on screen (text, images, buttons,
                cards); the empty space inside them becomes free (avoid/text still add to it),
      bump:     [elements] or a selector of things he can walk into,
      worlds:   optional [cyber card, vista card] (glow when he presents them after juggling),
      acts:     activity names to pick from (default: the shared five, see ACTS below),
      teleport: 'glitch' | 'minimize' (how he relocates / appears; default none),
      watch:    true to relocate when covered,
      delay:    ms before he first appears (default 0),
      spinner:  element whose ::before is a square spinning with a CSS rotate (for the 'square' act),
      special:  { act, after, at }: play `act` once, after `after` activities have finished and the
                page has been open `at` ms (it waits for its chance if it can't happen yet),
      fall:     (fixed stage) scrolling shakes his world: he falls, flailing, while the page moves and
                hits the floor at the nearest free spot when it stops,
      bubble:   speech bubble style: 'cyber' | 'vista' (default plain),
      quips:    extra lines he says when clicked (on top of the shared project jokes),
      tip:      a line he says soon after he appears and every few clicks (the "use a laptop" nudge),
      clickPower: true: three quick clicks on him set off his glitched power-up (spiky glowing hair,
                flickering aura); the second click warns you,
      quake:    selector of what shakes during the power-up (the page's content and backdrop layers),
      guide:    { cards, name, onCard }: hover a project card and he comes over, points at it and says something
                about that project (name = selector of the card's title); onCard: true (or a z-index): when
                there's no room near the card he flash-steps onto it, his layer lifted over the page,
      hide:     selector of solid cards he can hide behind for hide and seek (the 'hide' activity),
      cv:       selector of the CV links: opening the CV makes him read it and stamp it HIRED
    });

  Click him and he says something about one of the projects (in a speech bubble over his head).
  With a mouse his eyes follow the cursor; whoosh it past him and he ducks; rest it on him and he gets shy.

  Shared:  wander, pushups, pc, bonk, juggle
  Cyber:   hack (hologram), bug (stomps a bug), hover (hoverboard ride), glitch (teleports),
           flash (flash step with afterimages), clones (shadow clones), lag (lag spike)
  Vista:   uac (Cancel or Allow?), update (Windows Update nap), bsod (PC blue-screens), solitaire

  Returns { leave(pose) } (stops him and plays an exit pose; resolves when it's done), or nothing
  under prefers-reduced-motion. Needs al-mascot.js. AlRoam.next = 'hack' queues one.
*/
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CANCEL = {};
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // how much room each activity needs, in sprite px around his centre line when facing right:
  // [left, right, top]; the box always runs down to his feet
  var EXT = {
    stand: [-14, 14, 12],
    pushup: [-24, 40, 36],
    pc: [-14, 40, 14],
    juggle: [-30, 30, 0],
    bonk: [-50, 8, 0],
    hack: [-14, 40, 12],
    bug: [-14, 48, 4],
    hover: [-18, 18, 8],
    glitch: [-20, 20, 10],
    uac: [-14, 42, 8],
    update: [-14, 48, 2],
    solitaire: [-46, 46, 2],
    clones: [-80, 80, 12],
    lag: [-14, 14, 2],
    land: [-30, 30, 10],
    power: [-24, 24, 0]
  };
  // what he says when clicked: one of these (shuffled, no repeats until all are said) plus the page's own
  var QUIPS = [
    'CarIQ knows more about used car prices than the guy selling you the car.',
    "I asked CarIQ about my hoverboard. It said that's not a car, Al.",
    'The CV Automation Pipeline wrote my CV. It listed "pixel art" as a core skill.',
    'The CV pipeline writes cover letters faster than I can type "To whom it may concern".',
    'Finance Dashboard says most of my budget goes on glasses. Fair.',
    'The Finance Dashboard has a dark theme. So does my bank balance.',
    "URL Shortener makes long links short. Didn't work on me, I was already short.",
    'The Password Generator made me a password so strong I locked myself out.',
    "GitHub Stats Dashboard counts commits. I'm mostly committed to snacks.",
    'AI Fleet Manager predicts when a truck needs a service. Can it do me after push-ups?',
    'Chat System: real-time chat on a live site. Still waiting for someone to say hi to me.',
    'Weather App forecast for today: 100% chance of pixels.',
    "Landing Pages Ideas: five pages, five vibes. I've got one vibe: tiny.",
    "Sewandgrow is a real live site. I'm a real live sprite. Basically colleagues.",
    "The projects are clickable too. Honestly, they're more useful than me."
  ];
  // tour guide: what he says about each project (matched on the card's title)
  var PROJECT_LINES = [
    ['cariq', ['This is CarIQ. Ask it anything about used cars. Except my hoverboard.', 'CarIQ tells you if that "barely driven" car is lying.']],
    ['landing', ['Five landing pages, five personalities. Sounds like my group chat.', 'Each one has its own motion design. I have one move: walking.']],
    ['sewandgrow', ['A real client, a real live site. Go on, have a look.', 'Built it, shipped it, and it\'s still out there working.']],
    ['fleet', ['AI Fleet Manager knows a truck needs a service before the truck does.', 'Telematics plus AI. Basically a fortune teller for trucks.']],
    ['cv automation', ['It writes tailored CVs. A CV generator on a CV site. Very meta.', 'Paste a job description, get a CV and cover letter. Wish it did my push-ups.']],
    ['finance', ['Charts, budgets, forecasts. It knows where the money went. I don\'t want to know.', 'Node and PostgreSQL under a slick dark theme. Like me, but with charts.']],
    ['github', ['Type any GitHub username and it builds a whole profile. Try yours!', 'GitHub data in, dashboard out. My stats: one sprite, zero bugs. OK, some bugs.']],
    ['url', ['Long links in, short links out. With click analytics, so it knows who clicked.', 'It makes links short. I\'m short too. Relatable.']],
    ['password', ['Web Crypto under the hood, so the passwords are properly random. Unlike my dance moves.', 'It scores how strong your password is. Mine scored "please try again".']],
    ['chat', ['Real-time chat inside a live production site. WebSockets doing their thing.', 'Customers chat to the business live. Faster than my replies.']],
    ['weather', ['Real forecasts by location. In here: sunny, with a chance of pixels.', 'It does multi-day outlooks. I can\'t plan past lunch.']]
  ];
  function projectLine(name) {
    name = (name || '').toLowerCase();
    for (var i = 0; i < PROJECT_LINES.length; i++) if (name.indexOf(PROJECT_LINES[i][0]) >= 0) return pick(PROJECT_LINES[i][1]);
    return 'Ooh, good pick. Click it for the details!';
  }
  var FALL_QUIPS = ['AAAAAAAH!', 'Wheeeee!', 'Who turned off gravity?!', 'Scroll slower, I beg you!'];
  var CSS = '.al-say{position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;box-sizing:border-box;max-width:min(240px,calc(100vw - 16px));' +
    'padding:8px 11px;font:500 12.5px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;color:#f2ecff;background:#1c1530;border:1px solid #8f6cff;' +
    'border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;transform:translateY(6px) scale(.96);transform-origin:var(--tail,50%) 100%;' +
    'transition:opacity .16s,transform .16s}' +
    '.al-say.on{opacity:1;transform:none}' +
    '.al-say::after{content:"";position:absolute;left:var(--tail,50%);bottom:-6px;width:10px;height:10px;margin-left:-6px;background:inherit;' +
    'border:inherit;border-width:0 1px 1px 0;border-radius:0;transform:rotate(45deg)}' +
    '.al-say.below{transform-origin:var(--tail,50%) 0}.al-say.below::after{bottom:auto;top:-6px;border-width:1px 0 0 1px}' +
    '.al-say.side-r::after,.al-say.side-l::after{top:14px;bottom:auto;margin-left:0}' +
    '.al-say.side-r{transform-origin:0 20px}.al-say.side-r::after{left:-6px;border-width:0 0 1px 1px}' +
    '.al-say.side-l{transform-origin:100% 20px}.al-say.side-l::after{left:auto;right:-6px;border-width:1px 1px 0 0}' +
    '.al-say--cyber{font-family:ui-monospace,"JetBrains Mono",Consolas,monospace;font-size:12px;color:#d6f6ff;background:#060a14;border-color:#00d4ff;' +
    'border-radius:3px;box-shadow:0 0 14px rgba(0,212,255,.35)}' +
    '.al-say--vista{font-family:"Segoe UI",Inter,sans-serif;color:#1b2a3a;background:#f7faff;border-color:#7da2ce;border-radius:6px;box-shadow:0 3px 10px rgba(0,0,0,.28)}' +
    'html.al-hover,html.al-hover *{cursor:pointer!important}';
  var TELEPORT = { glitch: ['glitch-out', 'glitch-in'], minimize: ['minimize', 'restore'] };

  window.AlRoam = {
    history: [],
    start: function (al, o) {
      if (reduce || !al) return;
      var Mascot = customElements.get('al-mascot');
      var dur = function (p) { return Mascot && Mascot.dur ? Mascot.dur(p) : 1000; };
      var TP = TELEPORT[o.teleport];

      var stage = document.createElement('div');
      stage.className = 'al-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.style.cssText = 'position:' + (o.stage === 'fixed' ? 'fixed' : 'absolute') + ';left:0;top:0;width:0;height:0;z-index:' + (o.z || 1) + ';pointer-events:none';
      (o.stage && o.stage.appendChild ? o.stage : document.body).appendChild(stage);

      var gen = 0, busy = false, last = null, pos = { x: 0, y: 0 }, waveT, kind = 'stand', facing = null;
      var hidden = false, moving = false, lastScroll = 0, coverHits = 0, live = !!o.home;   // live: has made his entrance
      var gone = false;   // left for another page

      function origin() { var r = stage.getBoundingClientRect(); return { x: r.left, y: r.top }; }
      function rel(r, pad) {
        var g = origin(); pad = pad || 0;
        return { l: r.left - g.x - pad, t: r.top - g.y - pad, r: r.right - g.x + pad, b: r.bottom - g.y + pad };
      }
      // where he may be: the bounds (strip mode, e.g. on phones) or else the visible screen
      function bounds() {
        var b = typeof o.bounds === 'function' ? o.bounds() : o.bounds;
        return b && b.getBoundingClientRect ? b.getBoundingClientRect() : b || null;
      }
      function view() {
        var g = origin(), de = document.documentElement, b = bounds();
        if (b) return { l: b.left - g.x + 2, t: b.top - g.y + 2, r: b.right - g.x - 2, b: b.bottom - g.y };
        return { l: -g.x + 6, t: -g.y + 6, r: -g.x + de.clientWidth - 6, b: -g.y + de.clientHeight - 6 };
      }
      function scale() { return al.offsetWidth / 56; }
      function shown(el) {
        if (!el.offsetWidth && !el.offsetHeight) return false;
        var cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && cs.display !== 'none';
      }
      function rects(sel, pad, except) {
        if (!sel) return [];
        return [].slice.call(document.querySelectorAll(sel)).filter(function (el) {
          return el !== except && shown(el);
        }).map(function (el) { return rel(el.getBoundingClientRect(), pad); });
      }
      // content: find what is actually on screen inside these roots (text, images, buttons, anything
      // with a background, border or shadow) instead of avoiding whole sections, so he can use the
      // open space inside them. Text inside a card counts as the card. Cached briefly.
      var auto = { t: 0, all: [], text: [] };
      var REPLACED = /^(IMG|SVG|VIDEO|CANVAS|INPUT|BUTTON|TEXTAREA|SELECT|IFRAME|PICTURE)$/;
      function boxy(cs) {
        var bg = cs.backgroundColor.match(/[\d.]+/g);
        if (bg && (bg.length > 3 ? +bg[3] : 1) > 0.04) return true;
        if (cs.backgroundImage !== 'none' || cs.boxShadow !== 'none') return true;
        var sides = 0;
        ['Top', 'Right', 'Bottom', 'Left'].forEach(function (k) { if (parseFloat(cs['border' + k + 'Width']) > 0) sides++; });
        return sides >= 3;   // a single divider line doesn't make a box
      }
      function scan() {
        if (!o.content) return auto;
        var now = Date.now(); if (now - auto.t < 250) return auto;
        var all = [], text = [], inBox = new Set(), rg = document.createRange();
        [].forEach.call(document.querySelectorAll(o.content), function (root) {
          [].forEach.call(root.querySelectorAll('*'), function (el) {
            if (inBox.has(el.parentElement)) { inBox.add(el); return; }
            var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
            var cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return;
            if (REPLACED.test(el.tagName.toUpperCase())) { all.push({ el: el, r: r }); text.push({ el: el, r: r }); inBox.add(el); }
            else if (boxy(cs)) { all.push({ el: el, r: r }); inBox.add(el); }
          });
          var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
          while ((n = tw.nextNode())) {
            if (!n.nodeValue.trim() || inBox.has(n.parentElement)) continue;
            rg.selectNodeContents(n); var r = rg.getBoundingClientRect(); if (!r.width) continue;
            all.push({ el: n.parentElement, r: r }); text.push({ el: n.parentElement, r: r });
          }
        });
        auto = { t: now, all: all, text: text };
        return auto;
      }
      function scanned(list, pad, except) {
        return list.filter(function (x) { return x.el !== except; }).map(function (x) { return rel(x.r, pad); });
      }
      function avoidRects(pad, except) { return rects(o.avoid, pad, except).concat(scanned(scan().all, pad, except)); }
      function textRects(pad) { return rects(o.text, pad).concat(scanned(scan().text, pad)); }
      function bumps() {
        var list = typeof o.bump === 'string' ? [].slice.call(document.querySelectorAll(o.bump)) : (o.bump || []);
        return list.filter(shown);
      }
      function box(x, y, k, fc) {
        var e = EXT[k] || EXT.stand, s = scale(), cx = x + al.offsetWidth / 2, l = e[0], r = e[1];
        if (fc === 'left') { l = -e[1]; r = -e[0]; }
        return { l: cx + l * s, r: cx + r * s, t: y + e[2] * s, b: y + al.offsetHeight };
      }
      function hits(b, list) {
        for (var i = 0; i < list.length; i++) { var r = list[i]; if (b.l < r.r && b.r > r.l && b.t < r.b && b.b > r.t) return true; }
        return false;
      }
      function inside(b, v) { return b.l >= v.l && b.r <= v.r && b.t >= v.t && b.b <= v.b; }
      // straight trip from (fx,fy): may pass behind cards, never across text
      function pathClear(fx, fy, x, y, text) {
        var dx = x - fx, dy = y - fy, n = Math.ceil(Math.hypot(dx, dy) / 12);
        for (var i = 1; i < n; i++) if (hits(box(fx + dx * i / n, fy + dy * i / n, 'stand'), text)) return false;
        return true;
      }
      function homeSpot() {
        var r = rel(o.home.getBoundingClientRect());
        return { x: r.l + (r.r - r.l - al.offsetWidth) / 2, y: r.b - al.offsetHeight };
      }
      // every free spot on screen big enough for this activity, preferring a different part of the screen;
      // anywhere: skip the reachable-on-foot check (for teleporting)
      function spots(k, anywhere, from) {
        var v = view(), avoid = avoidRects(10), text = textRects(4), w = al.offsetWidth, h = al.offsetHeight;
        var step = Math.max(10, w / 6), out = [], sym = EXT[k][0] === -EXT[k][1];
        from = from || pos;
        var y0 = o.floor && bounds() ? v.b - h : v.t;   // floor: feet on the bottom edge of the bounds
        for (var y = y0; y + h <= v.b; y += step) for (var x = v.l - w; x <= v.r; x += step) {
          for (var f = 0; f < (sym ? 1 : 2); f++) {
            var fc = f ? 'left' : 'right', b = box(x, y, k, fc);
            if (inside(b, v) && !hits(b, avoid) && (anywhere || pathClear(from.x, from.y, x, y, text))) out.push({ x: x, y: y, facing: fc });
          }
        }
        return out;
      }
      function findSpot(k, anywhere) {
        var out = spots(k, anywhere), w = al.offsetWidth;
        var far = out.filter(function (c) { return Math.hypot(c.x - pos.x, c.y - pos.y) > w * 1.2; });
        return (far.length ? pick(far) : out.length ? pick(out) : null);
      }
      // a spot level with an element's outer edge where his nose touches the glass, plus a run-up spot
      function findBonk() {
        var v = view(), s = scale(), w = al.offsetWidth, h = al.offsetHeight, text = textRects(4), out = [];
        bumps().forEach(function (card) {
          var c = rel(card.getBoundingClientRect());
          if (c.r - c.l < 20 || c.b - c.t < h) return;
          var avoid = avoidRects(10, card), all = avoidRects(10);
          [['right', c.l - 6 * s, -1], ['left', c.r + 6 * s, 1]].forEach(function (sd) {
            var x = sd[1] - w / 2, preX = x + sd[2] * 44 * s;
            for (var y = Math.max(c.t, v.t); y + h <= Math.min(c.b, v.b); y += 12) {
              var b = box(x, y, 'bonk', sd[0]), pb = box(preX, y, 'stand');
              if (inside(b, v) && inside(pb, v) && !hits(b, avoid) && !hits(pb, all) && pathClear(pos.x, pos.y, preX, y, text)) {
                out.push({ x: x, y: y, preX: preX, facing: sd[0], card: card });
              }
            }
          });
        });
        return out.length ? pick(out) : null;
      }
      // behind a card, near one of its side edges, so only the front of his head peeks out past the edge
      // (the stage is under the content, so the card hides the rest of him)
      var seeking = null, foundIt = false;
      function hideSpot() {
        var v = view(), s = scale(), w = al.offsetWidth, h = al.offsetHeight, out = [];
        [].slice.call(document.querySelectorAll(o.hide)).filter(shown).forEach(function (card) {
          var c = rel(card.getBoundingClientRect()), y = c.b - h - 3 * s;
          if (c.t > y + 14 * s || y + 14 * s < v.t || c.b > v.b) return;   // the card covers him from the head down, on screen
          // what else is around (not the card, nor boxes it sits inside)
          var others = avoidRects(4, card).filter(function (r) { return !(r.l <= c.l && r.r >= c.r && r.t <= c.t && r.b >= c.b); });
          [['right', c.r, 1], ['left', c.l, -1]].forEach(function (sd) {
            var E = sd[1], cx = E - sd[2] * 6 * s;
            if (c.r - c.l < 30 * s) return;   // too narrow to hide behind
            var pk = sd[2] > 0 ? { l: E, r: E + 12 * s, t: y + 14 * s, b: y + 40 * s } : { l: E - 12 * s, r: E, t: y + 14 * s, b: y + 40 * s };
            if (inside(pk, v) && !hits(pk, others)) out.push({ x: cx - w / 2, y: y, facing: sd[0], card: card });
          });
        });
        return out.length ? pick(out) : null;
      }
      function covered() {
        if (kind === 'bonk' || kind === 'square' || kind === 'hide' || perched) return false;   // touching / behind / on things on purpose
        var b = box(pos.x, pos.y, kind, facing);
        return !inside(b, view()) || hits(b, avoidRects(2));
      }

      function sleep(ms) {
        var g = gen;
        return new Promise(function (res, rej) { setTimeout(function () { g === gen ? res() : rej(CANCEL); }, ms); });
      }
      function pose(p) { al.setAttribute('pose', p); }
      function play(p, times) { pose(p); return sleep(dur(p) * (times || 1)); }
      function face(f) { facing = f; if (f === 'left') al.setAttribute('facing', 'left'); else al.removeAttribute('facing'); }
      function place(x, y) { al.style.transition = 'none'; al.style.left = x + 'px'; al.style.top = y + 'px'; pos = { x: x, y: y }; }
      function hide(on) { hidden = on; al.style.visibility = on ? 'hidden' : ''; }
      // moves at his stride speed (16 sprite px per 4 frames of 80ms) so his feet don't skate;
      // side-on for sideways trips, facing us when the trip is mostly up or down the screen
      function walkTo(x, y, ride) {
        var dx = x - pos.x, dy = y - pos.y, d = Math.hypot(dx, dy);
        if (d < 3) return sleep(0);
        var ms = d / ((ride ? 0.15 : 0.05) * scale());
        if (ride) { face(dx < 0 ? 'left' : 'right'); pose('hover'); }
        else if (Math.abs(dy) > Math.abs(dx) * 1.4) { face(null); pose('walk'); }
        else { face(dx < 0 ? 'left' : 'right'); pose('walk-side'); }
        al.style.transition = 'left ' + ms + 'ms linear,top ' + ms + 'ms linear';
        al.style.left = x + 'px'; al.style.top = y + 'px'; pos = { x: x, y: y };
        moving = true;
        return sleep(ms).then(function () { moving = false; }, function (e) { moving = false; throw e; });
      }
      // walk to a spot found for activity k and face the way it needs
      async function goTo(t, k) { kind = 'stand'; await walkTo(t.x, t.y); kind = k; face(t.facing); }
      function rest() { face(null); pose('idle'); }
      function removeGhosts() { [].forEach.call(stage.querySelectorAll('al-mascot'), function (e) { if (e !== al) e.remove(); }); }
      // another Al next to him on the stage (afterimage, clone); with life set it fades out and is removed
      function ghost(x, y, p, life) {
        var g = document.createElement('al-mascot');
        g.setAttribute('pose', p);
        if (facing === 'left') g.setAttribute('facing', 'left');
        g.style.cssText = 'position:absolute;margin:0;left:' + x + 'px;top:' + y + 'px;width:' + al.offsetWidth + 'px';
        if (!life) g.style.filter = 'drop-shadow(0 0 4px rgba(255,40,170,.45))';
        stage.insertBefore(g, al);
        if (life) {
          var a = g.animate ? g.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: life, easing: 'ease-in' }) : null;
          if (a) a.onfinish = function () { g.remove(); }; else setTimeout(function () { g.remove(); }, life);
        }
        return g;
      }
      function flash(el, cls) {
        if (!el) return;
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        el.addEventListener('animationend', function () { el.classList.remove(cls); }, { once: true });
      }
      // the thing he walked into wobbles (individual `translate` so it never fights the element's own transform)
      function wobble(el, dir) {
        if (!el || !el.animate) return;
        try { el.animate([{ translate: '0 0' }, { translate: 4 * dir + 'px 0', offset: 0.25 }, { translate: -2 * dir + 'px 0', offset: 0.6 }, { translate: '0 0' }], { duration: 420, easing: 'ease' }); } catch (e) { }
      }

      var ACTS = {
        wander: async function () {
          var t = findSpot('stand'); if (!t) return false;
          await goTo(t, 'stand'); rest();
          await sleep(rnd(900, 1600));
          // looks around, sometimes stretches with a big yawn, sometimes waves
          if (Math.random() < 0.6) {
            face('left'); pose('stand-side'); await sleep(rnd(600, 900));
            face('right'); pose('stand-side'); await sleep(rnd(600, 900));
            rest(); await sleep(500);
          }
          if (Math.random() < 0.35) { await play('yawn'); rest(); await sleep(400); }
          if (Math.random() < 0.5) { pose('wave'); await sleep(1400); rest(); }
          return true;
        },
        pushups: async function () {
          var t = findSpot('pushup'); if (!t) return false;
          await goTo(t, 'pushup');
          await play('pushup-in');
          await play('pushup', ri(4, 7));
          await play('pushup-out');
          rest(); return true;
        },
        pc: async function () {
          var t = findSpot('pc'); if (!t) return false;
          await goTo(t, 'pc');
          await play('conjure');
          await play('pc-start');
          pose('work'); await sleep(rnd(2500, 4000));
          pose('think'); await sleep(rnd(1500, 2500));
          pose('work'); await sleep(rnd(2000, 3500));
          await play('pc-stretch');
          await play('unconjure');
          rest(); return true;
        },
        bonk: async function () {
          var t = findBonk(); if (!t) return false;
          kind = 'stand';
          await walkTo(t.preX, t.y);
          await walkTo(t.x, t.y);
          kind = 'bonk';
          pose('bonk'); wobble(t.card, t.facing === 'right' ? 1 : -1);
          await sleep(dur('bonk'));
          pose('dazed'); await sleep(1700);
          await play('getup');
          // he fell back 16 sprite px; move the element there in the same tick as the pose swap
          var back = (t.facing === 'left' ? 16 : -16) * scale();
          place(pos.x + back, pos.y);
          face(null); await play('glasses-on');
          kind = 'stand';
          await walkTo(t.preX, t.y);
          rest(); return true;
        },
        juggle: async function () {
          var t = findSpot('juggle'); if (!t) return false;
          await goTo(t, 'juggle'); rest();
          await play('juggle-in');
          await play('juggle', ri(4, 8) / 2);
          await play('fumble');
          await play('scoop');
          al.setAttribute('worlds', '');
          if (o.worlds) {
            pose('present-l'); flash(o.worlds[0], 'al-glow'); await sleep(1300);
            pose('present-r'); flash(o.worlds[1], 'al-glow'); await sleep(1300);
          } else { pose('cheer'); await sleep(1560); }
          al.removeAttribute('worlds');
          rest(); return true;
        },

        // ── Cyber ──
        hack: async function () {
          var t = findSpot('hack'); if (!t) return false;
          await goTo(t, 'hack');
          await play('holo-in');
          await play('hack');
          await play('holo-grant');
          await play('holo-out');
          rest(); return true;
        },
        bug: async function () {
          var t = findSpot('bug'); if (!t) return false;
          await goTo(t, 'bug');
          pose('stand-side'); await sleep(rnd(400, 900));
          await play('bug-in');
          await sleep(300);
          await play('stomp');
          rest(); return true;
        },
        hover: async function () {
          // somewhere far away he can ride to in a straight line
          var w = al.offsetWidth, text = textRects(4);
          var to = spots('hover', true).filter(function (c) {
            return Math.hypot(c.x - pos.x, c.y - pos.y) > w * 3 && pathClear(pos.x, pos.y, c.x, c.y, text);
          });
          var here = box(pos.x, pos.y, 'hover');
          if (!to.length || !inside(here, view()) || hits(here, avoidRects(10))) return false;
          var t = pick(to);
          kind = 'hover'; face(t.x < pos.x ? 'left' : 'right');
          await play('board-on');
          await walkTo(t.x, t.y, true);
          await play('board-off');
          rest(); return true;
        },
        glitch: async function () {
          var t = findSpot('glitch', true); if (!t) return false;
          kind = 'glitch'; rest(); await sleep(300);
          await play('glitch-out');
          place(t.x, t.y);
          await play('glitch-in');
          rest(); return true;
        },

        // flash step: three or four blink-dashes through free spots, an afterimage left at each one
        flash: async function () {
          var w = al.offsetWidth, v = view(), avoid = avoidRects(10), route = null;
          var free = function (x, y) { var b = box(x, y, 'glitch'); return inside(b, v) && !hits(b, avoid); };
          var cands = spots('glitch', true).filter(function (c) {
            var dx = c.x - pos.x, dy = c.y - pos.y, d = Math.hypot(dx, dy);
            return d > w * 2.5 && d < w * 8 && Math.abs(dy) < Math.abs(dx) * 0.7;
          });
          for (var tries = 0; tries < 40 && cands.length && !route; tries++) {
            var c = cands.splice(Math.floor(Math.random() * cands.length), 1)[0], n = ri(3, 4), pts = [];
            for (var i = 1; i <= n; i++) pts.push({ x: pos.x + (c.x - pos.x) * i / n, y: pos.y + (c.y - pos.y) * i / n });
            if (pts.every(function (q) { return free(q.x, q.y); })) route = pts;
          }
          if (!route) return false;
          kind = 'glitch'; face(route[0].x < pos.x ? 'left' : 'right');
          await play('dash-ready');
          for (var k = 0; k < route.length; k++) {
            ghost(pos.x, pos.y, 'afterimage', 650);
            await play('flash-out');
            place(route[k].x, route[k].y);
            await play('flash-in');
            if (k < route.length - 1) await sleep(rnd(60, 220));
          }
          await play('dash-stop');
          rest(); return true;
        },
        // shadow clones: splits into three, they wave and cheer slightly out of sync, then glitch away
        clones: async function () {
          var t = findSpot('clones'); if (!t) return false;
          await goTo(t, 'clones'); rest(); await sleep(400);
          await play('split');
          var d = 62 * scale(), cl = [ghost(pos.x - d, pos.y, 'glitch-in'), ghost(pos.x + d, pos.y, 'glitch-in')];
          try {
            await sleep(dur('glitch-in'));
            var all = [al, cl[0], cl[1]];
            pose('wave'); await sleep(140); cl[0].setAttribute('pose', 'wave'); await sleep(140); cl[1].setAttribute('pose', 'wave');
            await sleep(1300);
            all.forEach(function (e) { e.setAttribute('pose', 'cheer'); });
            await sleep(1100);
            pose('idle'); cl[1].setAttribute('pose', 'idle'); await sleep(350); cl[0].setAttribute('pose', 'idle');   // one's lagging
            await sleep(500);
            cl.forEach(function (e) { e.setAttribute('pose', 'glitch-out'); });
            await sleep(dur('glitch-out'));
          } finally { cl.forEach(function (e) { e.remove(); }); }
          await play('glasses-on');
          rest(); return true;
        },
        // lag spike: freezes mid-wave with a buffering ring, then catches up at double speed
        lag: async function () {
          var t = findSpot('lag'); if (!t) return false;
          await goTo(t, 'lag'); rest(); await sleep(rnd(500, 900));
          await play('lag');
          rest(); return true;
        },

        // hide and seek: vanishes and turns up behind a card, peeking out of its edge. Click the bit of him
        // that shows to find him (counted in this browser), or after a while he gives up and comes out
        hide: async function () {
          if (!o.hide || !TP) return false;
          var t = hideSpot(); if (!t) return false;
          face(null); await play(TP[0]);
          place(t.x, t.y); face(t.facing); kind = 'hide'; seeking = t.card; foundIt = false;
          await play(TP[1]);
          face(t.facing); pose('peek');
          var until = performance.now() + rnd(12000, 16000);
          while (!foundIt && performance.now() < until) await sleep(150);
          var won = !foundIt; seeking = null; foundIt = false;
          if (!won) {
            // jumps out in front of the card
            var s = scale(), nx = pos.x + (t.facing === 'right' ? 1 : -1) * 26 * s;
            kind = 'stand'; face(null);
            al.style.transition = 'left 160ms ease-out'; al.style.left = nx + 'px'; pos = { x: nx, y: pos.y };
            pose('found');
            var n = 1; try { n = (+localStorage.getItem('alFound') || 0) + 1; localStorage.setItem('alFound', n); } catch (e) { }
            say(n === 1 ? 'You found me! First try, impressive.' : 'You found me! That\'s ' + n + ' times now.', 3200);
            await sleep(dur('found') + 900);
          }
          // back out to a free spot
          kind = 'stand'; face(null); await play(TP[0]);
          var f = findSpot('stand', true);
          if (!f) { hide(true); return true; }
          place(f.x, f.y); hide(false); await play(TP[1]);
          if (won) say(pick(['Nobody found me... I win again.', 'Hide and seek champion. Still undefeated.']), 2600);
          rest(); return true;
        },

        // the CV was opened: conjures it, reads it (more and more impressed), stamps it HIRED, shows it off
        cv: async function () {
          if (hidden) return false;
          cvQueued = false; face(null); kind = 'stand';
          await play('cv-out');
          say(pick(['Reading... impressive... very impressive...', 'Hmm. Hmm! HMM!', 'Let me just check this guy out...']), 2400);
          await play('cv-read');
          await play('cv-stamp');
          say(pick(['HIRED! Obviously.', 'Stamped and approved.', 'Verdict: HIRED.']), 2400);
          await play('cv-show');
          rest(); return true;
        },

        // runs on top of the spinning square, gets carried to the edge, tumbles off, lies dazed, gets up
        square: async function () {
          var el = o.spinner && document.querySelector(o.spinner);
          if (!el || !shown(el)) return false;
          var s = scale(), w = al.offsetWidth, h = al.offsetHeight, v = view(), g0 = gen;
          var sq = function () {
            var r = rel(el.getBoundingClientRect()), m = (getComputedStyle(el, '::before').transform || '').match(/matrix\(([^,]+),([^,]+)/);
            return { cx: (r.l + r.r) / 2, cy: (r.t + r.b) / 2, half: (r.r - r.l) / 2 + 4, a: m ? Math.atan2(+m[2], +m[1]) : 0 };
          };
          // highest point of the rotated square at horizontal offset x from its centre (null = past the edge)
          var surface = function (q, x) {
            var c = Math.cos(q.a), sn = Math.sin(q.a), lo = -Infinity, hi = Infinity;
            [[c, sn], [-sn, c]].forEach(function (k) {
              if (Math.abs(k[1]) < 1e-6) { if (Math.abs(x * k[0]) > q.half) lo = Infinity; return; }
              var y1 = (-q.half - x * k[0]) / k[1], y2 = (q.half - x * k[0]) / k[1];
              lo = Math.max(lo, Math.min(y1, y2)); hi = Math.min(hi, Math.max(y1, y2));
            });
            return lo <= hi ? q.cy + lo : null;
          };
          var q0 = sq(), topY = q0.cy - q0.half * 1.42;
          // room above the square (only things above its flat top count) and a free landing spot to the right
          var body = { l: q0.cx - 20 * s, r: q0.cx + 20 * s, t: topY - h + 12 * s, b: topY };
          var above = avoidRects(4).filter(function (r) { return r.b < q0.cy - q0.half - 2; });
          if (!inside(body, v) || hits(body, above)) return false;
          var lands = spots('bonk', true).filter(function (c) { return c.facing === 'left' && c.x + w / 2 > q0.cx + q0.half && c.y + h > q0.cy; });
          if (!lands.length) return false;
          lands.sort(function (a, b) { return Math.hypot(a.x - q0.cx, a.y - q0.cy) - Math.hypot(b.x - q0.cx, b.y - q0.cy); });
          var land = lands[Math.floor(Math.random() * Math.min(4, lands.length))];

          kind = 'square';
          rest(); await play('glitch-out');
          var xo = 0, t0;
          // keeps his feet on the surface; false once he's past the edge
          var stick = function () {
            var q = sq(), y = surface(q, xo);
            if (y == null) return false;
            place(q.cx + xo - w / 2, y - h * 72 / 74);
            return true;
          };
          stick(); face('left');
          await play('glitch-in');
          var runFor = rnd(2600, 3600);
          pose('run-side'); t0 = performance.now();
          await new Promise(function (res, rej) {
            (function frame(now) {
              if (gen !== g0) return rej(CANCEL);
              var t = now - t0;
              // he can't quite keep up: drifts slowly toward the edge, then fast once he starts flailing
              if (t < runFor) xo += 0.012 * s;
              else { if (al.getAttribute('pose') !== 'run-flail') pose('run-flail'); xo += 0.09 * s; }
              if (t > runFor + 900 || !stick()) return res();
              requestAnimationFrame(frame);
            })(performance.now());
          });
          // off he goes: a tumbling arc down to the landing spot
          var p0 = { x: pos.x, y: pos.y }, ms = 750;
          pose('tumble');
          await new Promise(function (res, rej) {
            var start = performance.now();
            (function frame(now) {
              if (gen !== g0) return rej(CANCEL);
              var k = Math.min(1, (now - start) / ms);
              var x = p0.x + (land.x - p0.x) * k, y = p0.y + (land.y - p0.y) * k * k - Math.sin(k * Math.PI) * 20 * s;
              al.style.transition = 'none'; al.style.left = x + 'px'; al.style.top = y + 'px';
              if (k < 1) requestAnimationFrame(frame); else res();
            })(performance.now());
          });
          place(land.x, land.y); face('left'); kind = 'bonk';
          pose('dazed'); await sleep(1600);
          await play('getup');
          place(pos.x + 16 * s, pos.y);   // facing left he lay 16px to the right
          face(null); await play('glasses-on');
          kind = 'stand';
          rest(); return true;
        },

        // ── Vista ──
        uac: async function () {
          var t = findSpot('uac'); if (!t) return false;
          await goTo(t, 'uac');
          await play('uac'); await play('uac-click'); await sleep(rnd(500, 900));
          await play('uac'); await play('uac-click'); await sleep(rnd(300, 600));
          await play('uac');
          await play('facepalm');
          await play('uac-click');
          rest(); return true;
        },
        update: async function () {
          var t = findSpot('update'); if (!t) return false;
          await goTo(t, 'update');
          await play('sit-down');
          await play('update-wait', 2);
          await play('doze', ri(2, 3));
          await play('update-done');
          await play('stand-up');
          rest(); return true;
        },
        bsod: async function () {
          var t = findSpot('pc'); if (!t) return false;
          await goTo(t, 'pc');
          await play('conjure');
          await play('pc-start');
          pose('work'); await sleep(rnd(1800, 2800));
          await play('bsod');
          pose('work'); await sleep(rnd(1200, 2000));
          await play('pc-stretch');
          await play('unconjure');
          rest(); return true;
        },
        solitaire: async function () {
          var t = findSpot('solitaire'); if (!t) return false;
          await goTo(t, 'solitaire'); rest(); await sleep(300);
          await play('solitaire');
          rest(); return true;
        }
      };
      window.AlRoam.spots = function (k) { return spots(k || 'stand', true); };   // free spots right now (debugging)
      window.AlRoam.why = function () {                                          // what is covering him (debugging)
        var b = box(pos.x, pos.y, kind, facing), v = view();
        return { kind: kind, box: b, inView: inside(b, v), hits: avoidRects(2).filter(function (r) { return hits(b, [r]); }) };
      };
      var names = (o.acts || ['wander', 'pushups', 'pc', 'bonk', 'juggle']).filter(function (n, i, all) { return ACTS[n] && all.indexOf(n) === i; });
      // spWait: when the special has no room, at least one other activity happens before it's tried again
      var sp = o.special && ACTS[o.special.act] ? o.special : null, spDone = false, finished = 0, spWait = 0;

      // shuffle bag: every activity once, in random order, before any of them comes round again.
      // One that can't happen right now (no room for it) goes to the back of this round instead of
      // being dropped, so it still gets its turn before the next round starts.
      var bag = [];
      function shuffled() {
        var a = names.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
        if (a.length > 1 && a[0] === last) a.push(a.shift());   // no back-to-back repeat across rounds
        return a;
      }
      function nextAct() {
        if (cvQueued && !hidden) return 'cv';   // the CV was just opened
        var q = window.AlRoam.next; window.AlRoam.next = null;
        if (!ACTS[q] && sp && !spDone && finished >= Math.max(sp.after || 0, spWait) && performance.now() >= (sp.at || 0)) return sp.act;
        if (ACTS[q]) { var k = bag.indexOf(q); if (k >= 0) bag.splice(k, 1); return q; }   // AlRoam.next = 'hack' (testing)
        if (!bag.length) bag = shuffled();
        return bag.shift();
      }

      async function life(quick) {
        try {
          await sleep(quick || cvQueued ? 500 : rnd(2500, 4000));
          for (;;) {
            var n = nextAct(), hist = window.AlRoam.history;
            busy = true;
            var ok = await ACTS[n]();
            busy = false; kind = 'stand';
            hist.push(ok ? n : n + '?'); if (hist.length > 60) hist.shift();   // what he did ('?' = no room, retried later)
            if (ok) { last = n; finished++; if (sp && n === sp.act) spDone = true; }
            else if (sp && n === sp.act) spWait = finished + 1;
            else if (bag.length && names.indexOf(n) >= 0) bag.push(n);   // try it again later this round
            await sleep(ok ? rnd(3000, 5500) : 1500);
            if (o.home && ok && Math.random() < 0.3) {
              var hm = homeSpot(); busy = true; await walkTo(hm.x, hm.y); rest(); busy = false;
              await sleep(rnd(3000, 5000));
            }
          }
        } catch (e) { if (e !== CANCEL) throw e; }
      }

      // pops out (if showing) and back in at a free spot, then carries on; hides if there is none
      var relocating = false;
      async function relocate() {
        gen++; relocating = true; busy = true;
        try {
          kind = 'stand';
          if (!hidden && TP) { face(null); await play(TP[0]); }
          var t = findSpot('glitch', true) || findSpot('stand', true);
          if (!t) { hide(true); relocating = false; return; }
          place(t.x, t.y); face(null); hide(false);
          if (TP) await play(TP[1]);
          rest(); busy = false; relocating = false;
          life();
        } catch (e) { relocating = false; if (e !== CANCEL) throw e; }
      }
      // back to the resting spot (or a free one) and start over (resize, coming back to the tab)
      function reset() {
        gen++; busy = false; moving = false; kind = 'stand';
        falling = landing = powering = guiding = foundIt = false; seeking = null; clearTimeout(fallStop); al.style.translate = ''; endFx();
        al.removeAttribute('worlds');
        if (!o.home) { if (live) { hide(true); relocate(); } return; }   // before his entrance: leave it to the entrance
        al.style.width = o.home.offsetWidth + 'px';
        var hm = homeSpot(); place(hm.x, hm.y);
        rest(); life();
      }

      // lift him out of the layout onto the stage at exactly the same spot (or start hidden)
      var r0 = o.home && rel(al.getBoundingClientRect());   // measure before taking him out of the layout
      al.style.position = 'absolute'; al.style.margin = '0'; al.style.transform = 'none';
      if (o.home) {
        al.style.width = (r0.r - r0.l) + 'px';
        stage.appendChild(al);
        place(r0.l, r0.t);
        life();
      } else {
        stage.appendChild(al);
        hide(true);
        setTimeout(function () { live = true; if (!document.hidden) relocate(); }, o.delay || 0);
      }

      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(reset, 200); });
      document.addEventListener('visibilitychange', function () { if (document.hidden) gen++; else reset(); });
      if (o.watch) {
        window.addEventListener('scroll', function () { lastScroll = Date.now(); }, { passive: true });
        setInterval(function () {
          if (!live || relocating || falling || landing || powering || guiding || document.hidden || moving || Date.now() - lastScroll < 400) { coverHits = 0; return; }
          // covered on two checks running (so a passing tooltip or ripple doesn't send him off)
          if (hidden || (covered() ? ++coverHits >= 2 : (coverHits = 0))) { coverHits = 0; relocate(); }
        }, 700);
      }
      // ── speech bubble ──
      // over his head, following him; clamped to the screen, flips under his feet near the top
      var bub = null, bubT, bubRaf, qBag = [], taps = 0;
      if (!document.getElementById('al-say-css')) {
        var st = document.createElement('style'); st.id = 'al-say-css'; st.textContent = CSS; document.head.appendChild(st);
      }
      function hush() { if (bub) bub.classList.remove('on'); cancelAnimationFrame(bubRaf); }
      function follow() {
        if (hidden) return hush();
        var r = al.getBoundingClientRect(), de = document.documentElement;
        var cx = r.left + r.width / 2;
        if (o.bounds && bounds()) {
          // strip mode: beside him, inside his strip, so it doesn't sit over the page content
          var roomR = de.clientWidth - 8 - (cx + r.width * 0.32), roomL = cx - r.width * 0.32 - 8, right = roomR >= roomL;
          var room = Math.max(roomR, roomL);
          if (room >= 140) {
            bub.style.maxWidth = Math.min(240, room) + 'px';
            var sx = right ? cx + r.width * 0.32 : cx - r.width * 0.32 - bub.offsetWidth;
            bub.style.left = Math.round(sx) + 'px'; bub.style.top = Math.round(r.top + r.height * 0.1) + 'px';
            bub.classList.remove('below'); bub.classList.toggle('side-r', right); bub.classList.toggle('side-l', !right);
            bubRaf = requestAnimationFrame(follow);
            return;
          }
        }
        bub.classList.remove('side-r', 'side-l'); bub.style.maxWidth = '';
        var bw = bub.offsetWidth, bh = bub.offsetHeight, top = r.top + r.height * 14 / 74 - bh - 10;
        var left = Math.max(8, Math.min(de.clientWidth - bw - 8, cx - bw / 2)), below = top < 8;
        if (below) top = r.bottom + 10;
        bub.style.left = Math.round(left) + 'px'; bub.style.top = Math.round(top) + 'px';
        bub.style.setProperty('--tail', Math.round(Math.max(14, Math.min(bw - 14, cx - left))) + 'px');
        bub.classList.toggle('below', below);
        bubRaf = requestAnimationFrame(follow);
      }
      function say(text, ms) {
        if (hidden || gone) return false;
        if (!bub) {
          bub = document.createElement('div'); bub.className = 'al-say al-say--' + (o.bubble || 'plain');
          bub.setAttribute('aria-hidden', 'true'); document.body.appendChild(bub);
        }
        bub.textContent = text; cancelAnimationFrame(bubRaf); follow();
        void bub.offsetWidth; bub.classList.add('on');
        clearTimeout(bubT); bubT = setTimeout(hush, ms || Math.min(7000, 2200 + text.length * 50));
        return true;
      }
      function quip() {
        if (falling) return pick(FALL_QUIPS);
        if (o.tip && ++taps % 4 === 0) return o.tip;
        if (!qBag.length) {
          qBag = QUIPS.concat(o.quips || []);
          for (var i = qBag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = qBag[i]; qBag[i] = qBag[j]; qBag[j] = t; }
        }
        return qBag.shift();
      }
      // really on screen: inside the viewport and (in strip mode) not under an overlay like a boot screen
      function seen() {
        if (hidden) return false;
        var r = al.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) return false;
        var b = typeof o.bounds === 'function' ? null : o.bounds, hit = document.elementFromPoint(x, y);
        return !b || !b.contains || !!(hit && (b.contains(hit) || hit === al));
      }
      // the nudge, once he has made his entrance and can be seen (waits while he is hidden or covered)
      if (o.tip) (function nudge(n) {
        setTimeout(function () { if (!(seen() && say(o.tip, 7000)) && n < 40) nudge(n + 1); }, n ? 2000 : (o.home ? 2500 : (o.delay || 0) + 2600));
      })(0);

      // clicks pass through him (pointer-events off), so catch the ones that land on his body
      function onHim(x, y) {
        if (hidden) return false;
        var r = al.getBoundingClientRect(), u = r.width / 56;
        return x > r.left + 12 * u && x < r.left + 44 * u && y > r.top + 12 * u && y < r.bottom;
      }
      var CLICKABLE = 'a,button,input,textarea,select,label,summary,[role=button],[onclick]';
      // glitched power-up (clickPower, 3 quick clicks): stops right where he is, charges (shaking),
      // bursts, hair spikes up glowing in a flickering aura, holds it, powers down, carries on
      var powering = false, fxNow = null;
      function endFx() { if (fxNow) { fxNow.stop(); fxNow = null; } }
      // the world can't take it: the page shakes (o.quake elements), cracks spread across the floor from
      // his feet while he charges, and at the burst the screen cracks like glass from his chest (pixel
      // lines with cyan / magenta glitch edges), a white flash, chips flying, nearby cards jolt.
      // Powering down, the cracks glitch and heal away. Stops cleanly if he's interrupted.
      function powerFx(g0) {
        var K = 3, W = Math.ceil(window.innerWidth / K), H = Math.ceil(window.innerHeight / K);
        var cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.setAttribute('aria-hidden', 'true');
        cv.style.cssText = 'position:fixed;left:0;top:0;width:' + W * K + 'px;height:' + H * K + 'px;z-index:2147482990;pointer-events:none;image-rendering:pixelated';
        document.body.appendChild(cv);
        var c = cv.getContext('2d');
        // he stays in front of it all: lifted onto his own layer just above the cracks (under his speech
        // bubble), held steady at his spot while everything behind him shakes and breaks
        var front = document.createElement('div'), home = al.parentNode, next = al.nextSibling;
        front.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147482995;pointer-events:none';
        front.setAttribute('aria-hidden', 'true');
        document.body.appendChild(front);
        var shakers = o.quake ? [].slice.call(document.querySelectorAll(o.quake)).filter(function (el) { return shown(el) && el !== stage; }) : [];
        var holder = null, held = { x: 0, y: 0 };   // the shaking element his stage sits in (phones: the page), and its jolt
        shakers.forEach(function (el) { if (el.contains(stage)) holder = el; });
        function pin() {
          var g = origin();
          al.style.left = (g.x - held.x + pos.x) + 'px'; al.style.top = (g.y - held.y + pos.y) + 'px';
        }
        front.appendChild(al); al.style.transition = 'none'; pin();
        var r = al.getBoundingClientRect(), ox = (r.left + r.width / 2) / K, feet = (r.bottom - r.height * 0.03) / K, chest = (r.top + r.height * 0.5) / K;
        var ground = [], glass = [], chips = [];
        // a jagged crack: short segments, wandering, sometimes branching; t = distance from where it started
        function grow(list, x, y, a, len, depth, t, wob) {
          wob = wob || 0.45;
          while (len > 0) {
            var step = 2 + Math.random() * 3; a += rnd(-wob, wob);
            var nx = x + Math.cos(a) * step, ny = y + Math.sin(a) * step;
            list.push([x, y, nx, ny, t]); t += step; len -= step; x = nx; y = ny;
            if (depth < 3 && Math.random() < (wob < 0.3 ? 0.07 : 0.12)) grow(list, x, y, a + (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 1.1), len * rnd(0.3, 0.6), depth + 1, t, wob);
          }
        }
        for (var i = 0; i < 6; i++) grow(ground, ox, feet, i % 2 ? rnd(-0.2, 0.45) : Math.PI - rnd(-0.2, 0.45), rnd(22, 55), 0, 0);
        // glass: straighter spokes, plus broken rings between them
        for (i = 0; i < 10; i++) grow(glass, ox, chest, i * Math.PI / 5 + rnd(-0.25, 0.25), rnd(60, 170), 0, 0, 0.16);
        [14, 30, 52].forEach(function (rad) {
          for (var a0 = rnd(0, 0.6); a0 < Math.PI * 2; a0 += rnd(0.5, 0.9)) {
            if (Math.random() < 0.35) continue;   // gaps
            var a1 = a0 + rnd(0.25, 0.5), r0 = rad * rnd(0.85, 1.15), r1 = rad * rnd(0.85, 1.15);
            glass.push([ox + Math.cos(a0) * r0, chest + Math.sin(a0) * r0, ox + Math.cos(a1) * r1, chest + Math.sin(a1) * r1, 0]);
          }
        });
        function line(sg, dx, dy, col) {
          c.fillStyle = col;
          var n = Math.max(1, Math.round(Math.max(Math.abs(sg[2] - sg[0]), Math.abs(sg[3] - sg[1]))));
          for (var j = 0; j <= n; j++) c.fillRect(Math.round(sg[0] + (sg[2] - sg[0]) * j / n + dx), Math.round(sg[1] + (sg[3] - sg[1]) * j / n + dy), 1, 1);
        }
        var amp = 0, target = 0, chargeT0 = 0, chargeMs = 0, reveal = 0, broke = false, flash = 0, healT0 = 0, dead = false, clean = false, last = performance.now();
        // the page back to normal (the cracks have healed)
        function tidy() {
          if (clean) return; clean = true;
          shakers.forEach(function (el) { el.style.translate = ''; });
          held = { x: 0, y: 0 };
          cv.remove();
        }
        // and him back on his stage, at the same spot
        function stop() {
          if (dead) return; dead = true;
          tidy();
          home.insertBefore(al, next && next.parentNode === home ? next : null);
          front.remove();
          place(pos.x, pos.y);
        }
        fxNow = { stop: stop };
        (function frame(now) {
          if (dead) return;
          if (gen !== g0) return stop();   // interrupted (he started falling, the tab was hidden...)
          if (clean) { pin(); return requestAnimationFrame(frame); }
          var dt = Math.min(50, now - last); last = now;
          if (chargeMs) {
            var k = Math.min(1, (now - chargeT0) / chargeMs);
            target = 0.8 + 3.2 * k; reveal = 60 * k;
          }
          amp += (target - amp) * 0.12;
          var heal = healT0 ? Math.min(1, (now - healT0) / 550) : 0;
          if (heal >= 1) { tidy(); pin(); return requestAnimationFrame(frame); }
          shakers.forEach(function (el) {
            var x = amp > 0.2 ? rnd(-amp, amp) : 0, y = amp > 0.2 ? rnd(-amp, amp) : 0;
            el.style.translate = x || y ? x.toFixed(1) + 'px ' + y.toFixed(1) + 'px' : '';
            if (el === holder) held = { x: +x.toFixed(1), y: +y.toFixed(1) };
          });
          pin();
          c.clearRect(0, 0, W, H);
          if (!(heal && Math.random() < 0.4)) {   // healing: flickers out
            c.globalAlpha = 1 - heal;
            var jolt = heal || Math.random() < 0.08;
            [[ground, reveal], [glass, broke ? 1e9 : -1]].forEach(function (L) {
              L[0].forEach(function (sg) {
                if (sg[4] > L[1]) return;
                var g = jolt && Math.random() < 0.3 ? Math.round(rnd(-2, 2)) : 0;
                line(sg, g + 1, 0, 'rgba(0,212,255,0.55)'); line(sg, g - 1, 0, 'rgba(255,40,170,0.45)'); line(sg, g, 0, '#e6fdff');
              });
            });
            chips.forEach(function (p) {
              p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.09 * dt / 16;
              c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
            });
            if (flash > 0) { c.fillStyle = 'rgba(230,253,255,' + flash.toFixed(2) + ')'; c.fillRect(0, 0, W, H); flash -= dt / 260; }
            c.globalAlpha = 1;
          }
          requestAnimationFrame(frame);
        })(last);
        return {
          charge: function (ms) { chargeT0 = performance.now(); chargeMs = ms; },
          burst: function () {
            chargeMs = 0; broke = true; reveal = 1e9; amp = 11; target = 2.2; flash = 0.5;
            var cols = ['#e6fdff', '#7fe9ff', 'rgba(255,40,170,0.9)', '#ffe27a'];
            for (var j = 0; j < 46; j++) {
              var a = rnd(0, Math.PI * 2), v = rnd(0.8, 3.2), from = Math.random() < 0.5 ? [ox, feet] : [ox, chest];
              chips.push({ x: from[0], y: from[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, s: Math.random() < 0.3 ? 2 : 1, col: cols[j % 4] });
            }
            // nearby cards take the hit
            var me = al.getBoundingClientRect(), mx = me.left + me.width / 2;
            bumps().forEach(function (el) {
              var b = el.getBoundingClientRect(), d = Math.hypot(Math.max(b.left - mx, 0, mx - b.right), Math.max(b.top - me.bottom, 0, me.top - b.bottom));
              if (d < 420 && el.animate) {
                var dir = (b.left + b.right) / 2 < mx ? -1 : 1, m = 10 * (1 - d / 420) + 3;
                try { el.animate([{ translate: '0 0' }, { translate: dir * m + 'px ' + (-m / 2) + 'px', offset: 0.15 }, { translate: -dir * m * 0.6 + 'px 0', offset: 0.4 }, { translate: dir * m * 0.3 + 'px 0', offset: 0.7 }, { translate: '0 0' }], { duration: 520, easing: 'ease-out' }); } catch (e) { }
              }
            });
          },
          rumble: function () { target = 1.6; },
          heal: function () { target = 0; healT0 = performance.now(); },
          stop: stop
        };
      }
      async function powerUp() {
        gen++; busy = true; powering = true; moving = false; relocating = false; kind = 'power';
        clearTimeout(waveT); al.style.translate = '';
        var r = rel(al.getBoundingClientRect()); place(r.l, r.t);   // stop mid-step
        removeGhosts(); al.removeAttribute('worlds'); face(null);
        var g0 = gen, BURST = 1250;   // 'power-up': 260ms + 9 charge frames of 110ms, then the burst
        var fx = powerFx(g0);
        try {
          pose('power-up'); fx.charge(BURST);
          await sleep(600); say(pick(['HAAAAAAAAA!!', 'Power level: buffering...', 'Compiling... MAX POWER!']), 1600);
          await sleep(BURST - 600);
          fx.burst();
          await sleep(dur('power-up') - BURST);
          pose('powered'); fx.rumble(); await sleep(rnd(2200, 3200));
          fx.heal();
          await play('power-down');
          endFx();
          kind = 'stand'; rest(); busy = false; powering = false;
          life();
        } catch (e) { powering = false; fx.stop(); if (e !== CANCEL) throw e; }
      }
      var clicks = [];
      document.addEventListener('click', function (e) {
        if (seeking) {
          // found: a click on the bit of him peeking out (a click on the card itself still opens the card)
          // (only a sliver of him shows, so anywhere just beside the card where he is counts)
          var c = seeking.getBoundingClientRect(), r = al.getBoundingClientRect(), u = r.width / 56;
          var near = !hidden && e.clientX > r.left - 4 * u && e.clientX < r.right + 4 * u && e.clientY > r.top + 8 * u && e.clientY < r.bottom;
          if (near && (e.clientX < c.left || e.clientX > c.right || e.clientY < c.top || e.clientY > c.bottom)) foundIt = true;
          return;
        }
        if (!onHim(e.clientX, e.clientY) || (e.target.closest && e.target.closest(CLICKABLE))) return;
        if (o.clickPower && !falling && !landing && !powering) {
          var now = Date.now();
          clicks = clicks.filter(function (t) { return now - t < 1800; }); clicks.push(now);
          if (clicks.length >= 3) { clicks = []; hush(); powerUp(); return; }
          if (clicks.length === 2) { say(pick(['Uh oh... one more click and I can\'t hold it in!', 'Careful... I can feel the power glitching up!'])); return; }
        }
        if (powering) return;
        say(quip());
        if (busy) return;
        face(null); pose('wave'); clearTimeout(waveT);
        waveT = setTimeout(function () { if (!busy) rest(); }, 1600);
      });
      // with a mouse: his eyes follow the cursor; whoosh it past him and he ducks; rest it on him and he
      // gets shy (rubs the back of his head), then waves
      var hov = false, shyT, lastM = null, duckAt = 0;
      // calm moments he can be pulled out of (not mid-fall, power-up, hiding, guiding, the square run,
      // lying on the floor or reading the CV)
      function calm() {
        return live && !gone && !hidden && !falling && !landing && !powering && !seeking && !guiding && !relocating &&
          kind !== 'square' && kind !== 'bonk' && !/^cv-/.test(al.getAttribute('pose') || '');
      }
      // stops what he's doing right where he is, plays the poses in turn, then carries on with his day
      function react(list) {
        if (!calm()) return false;
        gen++; freeze(); busy = true; moving = false; kind = 'stand'; face(null);
        var g = gen;
        (function next(i) {
          if (g !== gen) return;
          if (i >= list.length) { rest(); busy = false; life(); return; }
          pose(list[i]); waveT = setTimeout(function () { next(i + 1); }, dur(list[i]));
        })(0);
        return true;
      }
      document.addEventListener('mousemove', function (e) {
        var on = onHim(e.clientX, e.clientY) && !(e.target.closest && e.target.closest(CLICKABLE));
        if (on !== hov) {
          hov = on; document.documentElement.classList.toggle('al-hover', on);
          clearTimeout(shyT);
          if (on) shyT = setTimeout(function () {
            if (hov) react(['shy', 'wave', 'wave', 'wave']);
          }, 1300);
        }
        if (hidden || !al.look) return;
        var r = al.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height * 0.28;
        var dx = e.clientX - hx, dy = e.clientY - hy, d = Math.hypot(dx, dy);
        var dir = d > 380 ? null : dy < -40 && Math.abs(dx) < 60 ? 'u' : dx < -14 ? 'l' : dx > 14 ? 'r' : null;
        if (facing === 'left' && (dir === 'l' || dir === 'r')) dir = dir === 'l' ? 'r' : 'l';   // he's mirrored
        al.look(dir);
        // a fast swipe close past him
        var now = e.timeStamp;
        if (lastM && now > lastM.t) {
          var sx = e.clientX - lastM.x, sy = e.clientY - lastM.y, sl = sx * sx + sy * sy, v = Math.sqrt(sl) / (now - lastM.t);
          // how close the swipe (from the last point to this one) came to his head
          var k = sl ? Math.max(0, Math.min(1, ((hx - lastM.x) * sx + (hy - lastM.y) * sy) / sl)) : 0;
          var near = Math.hypot(lastM.x + k * sx - hx, lastM.y + k * sy - hy);
          if (v > 3 && near < 150 && !hov && performance.now() - duckAt > 5000 && react(['duck'])) duckAt = performance.now();
        }
        lastM = { x: e.clientX, y: e.clientY, t: now };
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', function () { if (al.look) al.look(null); });

      // ── tour guide: hover a project card and he comes over, points at it and talks about it ──
      var guideT, guided = null, guideAt = 0, guiding = false;
      function freeze() {
        clearTimeout(waveT); al.style.translate = '';
        var r = rel(al.getBoundingClientRect()); place(r.l, r.t);
        removeGhosts(); al.removeAttribute('worlds');
      }
      // the free spot closest to the card, level with it (a card in the middle of a grid has no room
      // right beside it, so he points at it from the gutter on its row)
      function guideSpot(card) {
        var c = rel(card.getBoundingClientRect()), best = null, bd = 1e9, cy = (c.t + c.b) / 2;
        spots('stand', true).forEach(function (sp) {
          var b = box(sp.x, sp.y, 'stand');
          var gap = Math.hypot(Math.max(c.l - b.r, 0, b.l - c.r), Math.max(c.t - b.b, 0, b.t - c.b));
          if (gap > 700) return;
          var dd = gap * 2 + Math.abs((b.t + b.b) / 2 - cy) * 1.5 + Math.hypot(sp.x - pos.x, sp.y - pos.y) * 0.3;
          if (dd < bd) { bd = dd; best = sp; best.gap = gap; }
        });
        return best;
      }
      // no room near the card (onCard): dashes and flash-steps onto the card itself, his layer lifted over
      // the page, stands on its top edge (its bottom edge if the top is off screen), points and talks,
      // then flashes back off to a free spot
      var perched = false, stageZ = '';
      function perch(on) {
        if (on === perched) return;
        perched = on;
        if (on) { stageZ = stage.style.zIndex; stage.style.zIndex = o.guide.onCard === true ? 3 : o.guide.onCard; }
        else stage.style.zIndex = stageZ;
      }
      async function onCard(card, name) {
        var c = rel(card.getBoundingClientRect()), v = view(), s = scale(), w = al.offsetWidth, h = al.offsetHeight;
        var right = hidden ? Math.random() < 0.5 : pos.x + w / 2 > (c.l + c.r) / 2;   // the end nearer to him
        var x = (right ? c.r - 18 * s : c.l + 18 * s) - w / 2, y = c.t - h + 2 * s;
        if (y < v.t + 6 * s) y = c.b - h - 4 * s;
        x = Math.max(v.l, Math.min(v.r - w, x));
        try {
          if (!hidden) {
            face(x < pos.x ? 'left' : 'right');
            await play('dash-ready');
            ghost(pos.x, pos.y, 'afterimage', 650);
            await play('flash-out');
          }
          perch(true);
          place(x, y); hide(false); kind = 'stand';
          face(right ? 'left' : 'right');
          await play('flash-in');
          await play('dash-stop');
          var cc = card.getBoundingClientRect(), me = al.getBoundingClientRect();
          face((cc.left + cc.right) / 2 < me.left + me.width / 2 ? 'left' : 'right');
          pose('point');
          say(projectLine(name), 4200);
          await sleep(3400);
          await offCard();
        } finally { perch(false); }
      }
      // flashes off the card he's standing on to the nearest free spot (hides if there's none: the watch
      // brings him back when there is)
      async function offCard() {
        var list = spots('stand', true);
        list.sort(function (a, b) { return Math.hypot(a.x - pos.x, a.y - pos.y) - Math.hypot(b.x - pos.x, b.y - pos.y); });
        ghost(pos.x, pos.y, 'afterimage', 650);
        await play('flash-out');
        perch(false);
        if (list.length) { place(list[0].x, list[0].y); face(null); await play('flash-in'); rest(); }
        else hide(true);
      }
      // falling onto a project card (scrolling, onCard): the card right under him, or else (half the time) the
      // nearest one in view, with room above its top edge to land on
      function cardBelow() {
        var v = view(), s = scale(), w = al.offsetWidth, h = al.offsetHeight, cx = pos.x + w / 2, feet = pos.y + h, best = null;
        [].slice.call(document.querySelectorAll(o.guide.cards)).filter(shown).forEach(function (card) {
          var c = rel(card.getBoundingClientRect());
          if (c.t - h < v.t + 4 * s || c.t > v.b - 30 * s) return;   // its top edge on screen, with room for him
          var dx = cx < c.l + 18 * s ? c.l + 18 * s - cx : cx > c.r - 18 * s ? cx - (c.r - 18 * s) : 0;
          var cost = dx * 2 + Math.abs(c.t - feet) * 0.5;
          if (!best || cost < best.cost) best = { card: card, c: c, dx: dx, cost: cost };
        });
        if (!best || best.dx > 360 * s || (best.dx > 0 && Math.random() < 0.5)) return null;
        return best;
      }
      // lands on it, gets a shock, says his line about that project, flashes off
      async function landOnCard(b) {
        var s = scale(), w = al.offsetWidth, h = al.offsetHeight, c = b.c, cx = pos.x + w / 2;
        var x = Math.max(c.l + 18 * s, Math.min(c.r - 18 * s, cx)) - w / 2, y = c.t - h + 2 * s;
        var name = (b.card.querySelector(o.guide.name) || b.card).textContent.trim();
        guided = b.card; guideAt = performance.now(); guiding = true;
        try {
          perch(true);
          pose(vel > 48 ? 'fall-fast' : 'fall');
          await drop(x, y);
          face(x + w / 2 < (c.l + c.r) / 2 ? 'right' : 'left');
          await play('land');
          kind = 'stand'; face(null);
          await play('shocked');
          var cc = b.card.getBoundingClientRect(), me = al.getBoundingClientRect();
          face((cc.left + cc.right) / 2 < me.left + me.width / 2 ? 'left' : 'right');
          pose('point');
          say(projectLine(name), 4200);
          await sleep(3400);
          await offCard();
        } finally { perch(false); guiding = false; }
      }
      async function guide(card, tries) {
        if (!live || gone || seeking || kind === 'square') return;
        if (falling || landing || powering || relocating) {
          // busy for a moment: comes over once he's done, if you're still on the card
          tries = (tries || 0) + 1;
          if (tries < 10) setTimeout(function () { if (card.matches(':hover')) guide(card, tries); }, 700);
          return;
        }
        if (al.getAttribute('pose') && /^cv-/.test(al.getAttribute('pose'))) return;   // busy reading the CV
        if (performance.now() - guideAt < 1200) return;
        var t = guideSpot(card), hop = o.guide.onCard && (!t || t.gap > 180);
        if (!t && hidden && !hop) return;
        guideAt = performance.now(); guided = card;
        gen++; busy = true; guiding = true; moving = false; kind = 'stand';
        freeze();
        var name = (card.querySelector(o.guide.name) || card).textContent.trim();
        try {
          if (hop) {
            await onCard(card, name);
            guiding = false; busy = false;
            life(); return;
          }
          if (t) {
            var far = hidden || Math.hypot(t.x - pos.x, t.y - pos.y) > 170 * scale();
            if (far && TP) {
              if (!hidden) { face(null); await play(TP[0]); }
              place(t.x, t.y); hide(false); await play(TP[1]);
            } else await walkTo(t.x, t.y);
          }
          var c = card.getBoundingClientRect(), me = al.getBoundingClientRect();
          face((c.left + c.right) / 2 < me.left + me.width / 2 ? 'left' : 'right');
          pose('point');
          say(projectLine(name), 4200);
          await sleep(3200);
          rest(); guiding = false; busy = false;
          life();
        } catch (e) { guiding = false; if (e !== CANCEL) throw e; }
      }
      if (o.guide) {
        document.addEventListener('mouseover', function (e) {
          var card = e.target.closest && e.target.closest(o.guide.cards);
          if (!card || card === guided) return;
          clearTimeout(guideT);
          guideT = setTimeout(function () { if (card.matches(':hover')) guide(card); }, 450);
        });
        // clicking the card he just showed you: he reacts as soon as he can be seen again (the card
        // usually opens something over him, so mostly once you close it)
        var pickT = 0;
        document.addEventListener('click', function (e) {
          var card = e.target.closest && e.target.closest(o.guide.cards);
          if (!card || card !== guided || performance.now() - guideAt > 15000) return;
          clearInterval(pickT);
          var t0 = performance.now();
          pickT = setInterval(function () {
            if (performance.now() - t0 > 60000) return clearInterval(pickT);
            if (performance.now() - t0 < 350 || hidden || gone || falling || landing || powering || seeking || relocating || document.hidden) return;
            if (hits(box(pos.x, pos.y, 'stand', facing), avoidRects(2))) return;
            clearInterval(pickT);
            say(pick(['Good pick!', 'Told you it was good.', 'Great choice. I helped. A bit.']), 2200);
          }, 400);
        });
      }

      // ── the CV: opening it makes him read it and stamp it HIRED (if it opened in a new tab, he does it
      // as soon as you come back) ──
      var cvQueued = false;
      if (o.cv) document.addEventListener('click', function (e) {
        if (!(e.target.closest && e.target.closest(o.cv)) || gone) return;
        cvQueued = true;
        setTimeout(function () {
          if (!cvQueued || document.hidden || !live || falling || landing || powering || seeking || relocating) return;
          gen++; busy = false; moving = false; guiding = false; kind = 'stand';
          freeze();
          if (hidden) relocate(); else life(true);
        }, 150);
      }, true);

      // ── falling while the page scrolls (fixed stage) ──
      var falling = false, landing = false, fallT0 = 0, fallStop, fallAcc = 0, accT, lastY = window.scrollY, vel = 0, fallPose = '', shakeId = 0;
      function startFall() {
        gen++; endFx(); falling = true; landing = false; busy = true; relocating = false; moving = false; kind = 'stand'; powering = guiding = foundIt = false; seeking = null;
        fallT0 = performance.now();
        al.style.translate = '';
        var r = rel(al.getBoundingClientRect()), v = view(), w = al.offsetWidth, h = al.offsetHeight;
        place(Math.max(v.l, Math.min(v.r - w, r.l)), Math.max(v.t, Math.min(v.b - h, r.t)));   // stop mid-step, on screen
        removeGhosts(); al.removeAttribute('worlds'); face(null); hide(false);
        fallPose = 'fall-in'; pose('fall-in');
        var g0 = gen;
        setTimeout(function () { if (falling && gen === g0) { fallPose = 'fall'; pose('fall'); } }, dur('fall-in'));
        shake(++shakeId, 0);
      }
      // his world shakes harder the faster the page moves; scrolling hard switches to the glitchier fall
      function shake(id, last) {
        if (id !== shakeId) return;
        if (!falling) { al.style.translate = ''; return; }
        requestAnimationFrame(function (now) {
          if (id !== shakeId || !falling) { if (id === shakeId) al.style.translate = ''; return; }
          vel *= 0.9;
          if (now - last > 45) {
            last = now;
            var a = Math.min(5, 0.8 + vel * 0.06) * scale();
            al.style.translate = rnd(-a, a).toFixed(1) + 'px ' + (rnd(-a, a) * 0.6).toFixed(1) + 'px';
            if (fallPose !== 'fall-in') {
              var want = vel > 48 ? 'fall-fast' : vel < 28 ? 'fall' : fallPose;
              if (want !== fallPose) { fallPose = want; pose(want); }
            }
          }
          shake(id, last);
        });
      }
      // speeding up as he goes, like a real fall
      function drop(x, y) {
        var x0 = pos.x, y0 = pos.y, d = Math.hypot(x - x0, y - y0), ms = Math.min(700, 140 + Math.sqrt(d) * 22), g0 = gen;
        return new Promise(function (res, rej) {
          var t0 = performance.now();
          (function frame(now) {
            if (gen !== g0) return rej(CANCEL);
            var k = Math.max(0, Math.min(1, (now - t0) / ms));
            al.style.transition = 'none'; al.style.left = (x0 + (x - x0) * k) + 'px'; al.style.top = (y0 + (y - y0) * k * k) + 'px';
            if (k < 1) requestAnimationFrame(frame); else { place(x, y); res(); }
          })(t0);
        });
      }
      // the page stopped: drop onto the nearest free spot (preferring below him) and hit the floor
      async function land() {
        if (!falling) return;
        falling = false; landing = true; gen++; al.style.translate = '';
        var long = performance.now() - fallT0 > 1300;
        try {
          var onto = o.guide && o.guide.onCard ? cardBelow() : null;
          if (onto) {
            await landOnCard(onto);
            landing = false; busy = false;
            life(); return;
          }
          var w = al.offsetWidth, h = al.offsetHeight, s = scale(), v = view();
          var list = spots('land', true);
          if (!list.length) { await play('fall-warp'); hide(true); landing = false; busy = false; return; }   // the watch brings him back
          list.forEach(function (c) { var dy = c.y - pos.y; c.cost = Math.abs(c.x - pos.x) + (dy < 0 ? -dy * 3 : dy * 0.25); });
          list.sort(function (a, b) { return a.cost - b.cost; });
          var t = list[Math.floor(Math.random() * Math.min(3, list.length))];
          if (t.y < pos.y - 10 * s || Math.abs(t.x - pos.x) > 140 * s) {
            // too far or above him: blinks through a glitch to just above it
            await play('fall-warp');
            place(t.x, Math.max(v.t - h * 0.4, t.y - 90 * s));
            await play('fall-in');
          }
          pose(vel > 48 ? 'fall-fast' : 'fall');
          await drop(t.x, t.y);
          // a long fall sometimes ends flat on his back (needs room to lie down)
          var flat = null;
          if (long && Math.random() < 0.55) ['right', 'left'].some(function (f) {
            var b = box(t.x, t.y, 'bonk', f);
            if (inside(b, v) && !hits(b, avoidRects(10))) { flat = f; return true; }
          });
          if (flat) {
            face(flat); kind = 'bonk';
            await play('crash'); pose('dazed'); await sleep(1300);
            await play('getup');
            place(pos.x + (flat === 'left' ? 16 : -16) * s, pos.y);   // he lay 16px behind where he landed
          } else {
            face(t.x + w / 2 < (v.l + v.r) / 2 ? 'right' : 'left');
            await play('land');
          }
          kind = 'stand'; face(null); await play('glasses-on');
          rest(); landing = false; busy = false;
          life();
        } catch (e) { if (e !== CANCEL) throw e; }
      }
      var fallN = 0, docH = 0, intentUntil = 0;
      // only scrolling the visitor does counts (wheel, touch, scroll keys, dragging the scrollbar, a nav
      // link): the page also scrolls by itself when content above changes height (the hero typewriter)
      function intent() { intentUntil = Date.now() + 700; }
      if (o.fall) {
        ['wheel', 'touchmove', 'pointerdown'].forEach(function (t) { window.addEventListener(t, intent, { passive: true, capture: true }); });
        window.addEventListener('keydown', function (e) {
          if (/^(PageDown|PageUp|ArrowDown|ArrowUp|Home|End| |Spacebar)$/.test(e.key)) intent();
        }, true);
      }
      if (o.fall) window.addEventListener('scroll', function () {
        var y = window.scrollY, d = Math.abs(y - lastY), dh = document.documentElement.scrollHeight;
        lastY = y;
        // the page changing height (content growing near the bottom) shifts the scroll by itself: not him
        var shifted = docH && dh !== docH; docH = dh;
        if (!live || gone || document.hidden || shifted) return;
        if (Date.now() > intentUntil) return;
        intentUntil = Math.max(intentUntil, Date.now() + 400);   // smooth / momentum scrolling carries on
        vel = vel * 0.5 + d * 0.5;
        if (!falling) {
          // a real scroll is a burst of events, or one big jump (a wheel without smooth scrolling, Page
          // Down, space, the scrollbar); small nudges (an arrow key, a trackpad twitch) don't count
          fallAcc += d; fallN++;
          clearTimeout(accT); accT = setTimeout(function () { fallAcc = fallN = 0; }, 300);
          if (d < 90 && (fallAcc < 60 || fallN < 3)) return;
          fallAcc = fallN = 0; startFall();
        }
        clearTimeout(fallStop); fallStop = setTimeout(land, 240);
      }, { passive: true });

      return {
        // stop whatever he's doing right where he is and play an exit pose (e.g. on the way to another page)
        leave: function (p) {
          gen++; busy = true; relocating = true; moving = false; gone = true;
          falling = landing = false; clearTimeout(fallStop); al.style.translate = ''; hush(); endFx();
          var r = rel(al.getBoundingClientRect());
          place(r.l, r.t); face(null); al.removeAttribute('worlds');
          removeGhosts();
          pose(p);
          return new Promise(function (res) { setTimeout(res, dur(p)); });
        }
      };
    }
  };
})();
