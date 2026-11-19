/*
  AlRoam: lets an <al-mascot> live on the page once the intro is over. Every few seconds he picks
  something to do (wander, push-ups, magic PC, walk into a glass card, juggle the worlds) and does it
  in a free part of the screen.

  He is moved onto a layer that sits UNDER the page content with pointer-events off, and every spot
  he uses is checked against the content first, so he never covers or blocks anything. He may pass
  behind the cards, but never walks across text.

    AlRoam.start(alEl, {
      home:   element whose box is his resting place,
      avoid:  selector of everything his activities must stay clear of,
      text:   selector of things he must not walk across,
      bump:   [elements he can walk into],
      worlds: [cyber card, vista card]   (glow when he presents them)
    });

  Needs al-mascot.js. Does nothing under prefers-reduced-motion.
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
    bonk: [-50, 8, 0]
  };

  window.AlRoam = {
    start: function (al, o) {
      if (reduce || !al || !o.home) return;
      var Mascot = customElements.get('al-mascot');
      var dur = function (p) { return Mascot && Mascot.dur ? Mascot.dur(p) : 1000; };

      var stage = document.createElement('div');
      stage.className = 'al-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:1;pointer-events:none';
      document.body.appendChild(stage);

      var gen = 0, busy = false, last = null, pos, waveT;

      function origin() { var r = stage.getBoundingClientRect(); return { x: r.left, y: r.top }; }
      function rel(r, pad) {
        var g = origin(); pad = pad || 0;
        return { l: r.left - g.x - pad, t: r.top - g.y - pad, r: r.right - g.x + pad, b: r.bottom - g.y + pad };
      }
      function view() {
        var g = origin(), de = document.documentElement;
        return { l: -g.x + 6, t: -g.y + 6, r: -g.x + de.clientWidth - 6, b: -g.y + de.clientHeight - 6 };
      }
      function scale() { return al.offsetWidth / 56; }
      function rects(sel, pad, except) {
        if (!sel) return [];
        return [].slice.call(document.querySelectorAll(sel)).filter(function (el) {
          return el !== except && el.offsetWidth;
        }).map(function (el) { return rel(el.getBoundingClientRect(), pad); });
      }
      function box(x, y, kind, facing) {
        var e = EXT[kind], s = scale(), cx = x + al.offsetWidth / 2, l = e[0], r = e[1];
        if (facing === 'left') { l = -e[1]; r = -e[0]; }
        return { l: cx + l * s, r: cx + r * s, t: y + e[2] * s, b: y + al.offsetHeight };
      }
      function hits(b, list) {
        for (var i = 0; i < list.length; i++) { var r = list[i]; if (b.l < r.r && b.r > r.l && b.t < r.b && b.b > r.t) return true; }
        return false;
      }
      function inside(b, v) { return b.l >= v.l && b.r <= v.r && b.t >= v.t && b.b <= v.b; }
      // straight walk from where he is: may pass behind cards, never across text
      function pathClear(x, y, text) {
        var dx = x - pos.x, dy = y - pos.y, n = Math.ceil(Math.hypot(dx, dy) / 12);
        for (var i = 1; i < n; i++) if (hits(box(pos.x + dx * i / n, pos.y + dy * i / n, 'stand'), text)) return false;
        return true;
      }
      function homeSpot() {
        var r = rel(o.home.getBoundingClientRect());
        return { x: r.l + (r.r - r.l - al.offsetWidth) / 2, y: r.b - al.offsetHeight };
      }
      // every free spot on screen big enough for this activity, preferring a different part of the screen
      function findSpot(kind) {
        var v = view(), avoid = rects(o.avoid, 10), text = rects(o.text, 4), w = al.offsetWidth, h = al.offsetHeight;
        var step = Math.max(10, w / 6), out = [];
        for (var y = v.t; y + h <= v.b; y += step) for (var x = v.l - w; x <= v.r; x += step) {
          ['right', 'left'].forEach(function (fc) {
            if (fc === 'left' && EXT[kind][0] === -EXT[kind][1]) return;   // symmetric: one check is enough
            var b = box(x, y, kind, fc);
            if (inside(b, v) && !hits(b, avoid) && pathClear(x, y, text)) out.push({ x: x, y: y, facing: fc });
          });
        }
        var far = out.filter(function (c) { return Math.hypot(c.x - pos.x, c.y - pos.y) > w * 1.2; });
        return (far.length ? pick(far) : out.length ? pick(out) : null);
      }
      // a spot level with a card's outer edge where his nose touches the glass, plus a run-up spot
      function findBonk() {
        var v = view(), s = scale(), w = al.offsetWidth, h = al.offsetHeight, text = rects(o.text, 4), out = [];
        (o.bump || []).forEach(function (card) {
          var c = rel(card.getBoundingClientRect());
          if (c.r - c.l < 20 || c.b - c.t < h) return;
          var avoid = rects(o.avoid, 10, card), all = rects(o.avoid, 10);
          [['right', c.l - 6 * s, -1], ['left', c.r + 6 * s, 1]].forEach(function (sd) {
            var x = sd[1] - w / 2, preX = x + sd[2] * 44 * s;
            for (var y = c.t; y + h <= c.b; y += 12) {
              var b = box(x, y, 'bonk', sd[0]), pb = box(preX, y, 'stand');
              if (inside(b, v) && inside(pb, v) && !hits(b, avoid) && !hits(pb, all) && pathClear(preX, y, text)) {
                out.push({ x: x, y: y, preX: preX, facing: sd[0], card: card });
              }
            }
          });
        });
        return out.length ? pick(out) : null;
      }

      function sleep(ms) {
        var g = gen;
        return new Promise(function (res, rej) { setTimeout(function () { g === gen ? res() : rej(CANCEL); }, ms); });
      }
      function pose(p) { al.setAttribute('pose', p); }
      function face(f) { if (f === 'left') al.setAttribute('facing', 'left'); else al.removeAttribute('facing'); }
      function place(x, y) { al.style.transition = 'none'; al.style.left = x + 'px'; al.style.top = y + 'px'; pos = { x: x, y: y }; }
      // walks at his stride speed (16 sprite px per 4 frames of 80ms) so his feet don't skate;
      // side-on for sideways trips, facing us when the trip is mostly up or down the screen
      function walkTo(x, y) {
        var dx = x - pos.x, dy = y - pos.y, d = Math.hypot(dx, dy);
        if (d < 3) return sleep(0);
        var ms = d / (0.05 * scale());
        if (Math.abs(dy) > Math.abs(dx) * 1.4) { face(null); pose('walk'); }
        else { face(dx < 0 ? 'left' : 'right'); pose('walk-side'); }
        al.style.transition = 'left ' + ms + 'ms linear,top ' + ms + 'ms linear';
        al.style.left = x + 'px'; al.style.top = y + 'px'; pos = { x: x, y: y };
        return sleep(ms);
      }
      function rest() { face(null); pose('idle'); }
      function flash(el, cls) {
        if (!el) return;
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        el.addEventListener('animationend', function () { el.classList.remove(cls); }, { once: true });
      }

      var acts = {
        wander: async function () {
          var t = findSpot('stand'); if (!t) return false;
          await walkTo(t.x, t.y); rest();
          await sleep(rnd(900, 1600));
          // looks around, sometimes stretches with a big yawn, sometimes waves
          if (Math.random() < 0.6) {
            face('left'); pose('stand-side'); await sleep(rnd(600, 900));
            face('right'); pose('stand-side'); await sleep(rnd(600, 900));
            rest(); await sleep(500);
          }
          if (Math.random() < 0.35) { pose('yawn'); await sleep(dur('yawn')); rest(); await sleep(400); }
          if (Math.random() < 0.5) { pose('wave'); await sleep(1400); rest(); }
          return true;
        },
        pushups: async function () {
          var t = findSpot('pushup'); if (!t) return false;
          await walkTo(t.x, t.y); face(t.facing);
          pose('pushup-in'); await sleep(dur('pushup-in'));
          pose('pushup'); await sleep(dur('pushup') * ri(4, 7));
          pose('pushup-out'); await sleep(dur('pushup-out'));
          rest(); return true;
        },
        pc: async function () {
          var t = findSpot('pc'); if (!t) return false;
          await walkTo(t.x, t.y); face(t.facing);
          pose('conjure'); await sleep(dur('conjure'));
          pose('pc-start'); await sleep(dur('pc-start'));
          pose('work'); await sleep(rnd(2500, 4000));
          pose('think'); await sleep(rnd(1500, 2500));
          pose('work'); await sleep(rnd(2000, 3500));
          pose('pc-stretch'); await sleep(dur('pc-stretch'));
          pose('unconjure'); await sleep(dur('unconjure'));
          rest(); return true;
        },
        bonk: async function () {
          var t = findBonk(); if (!t) return false;
          await walkTo(t.preX, t.y);
          await walkTo(t.x, t.y);
          pose('bonk'); flash(t.card, t.facing === 'right' ? 'al-bump-r' : 'al-bump-l');
          await sleep(dur('bonk'));
          pose('dazed'); await sleep(1700);
          pose('getup'); await sleep(dur('getup'));
          // he fell back 16 sprite px; move the element there in the same tick as the pose swap
          var back = (t.facing === 'left' ? 16 : -16) * scale();
          place(pos.x + back, pos.y);
          face(null); pose('glasses-on'); await sleep(dur('glasses-on'));
          await walkTo(t.preX, t.y);
          rest(); return true;
        },
        juggle: async function () {
          var t = findSpot('juggle'); if (!t) return false;
          await walkTo(t.x, t.y); rest();
          pose('juggle-in'); await sleep(dur('juggle-in'));
          pose('juggle'); await sleep(dur('juggle') / 2 * ri(4, 8));
          pose('fumble'); await sleep(dur('fumble'));
          pose('scoop'); await sleep(dur('scoop'));
          al.setAttribute('worlds', '');
          pose('present-l'); flash(o.worlds && o.worlds[0], 'al-glow'); await sleep(1300);
          pose('present-r'); flash(o.worlds && o.worlds[1], 'al-glow'); await sleep(1300);
          al.removeAttribute('worlds');
          rest(); return true;
        }
      };

      async function life() {
        try {
          await sleep(rnd(2500, 4000));
          for (;;) {
            var names = Object.keys(acts).filter(function (n) { return n !== last; });
            var n = acts[window.AlRoam.next] ? window.AlRoam.next : pick(names);   // AlRoam.next = 'juggle' queues one (handy for testing)
            window.AlRoam.next = null;
            busy = true;
            var ok = await acts[n]();
            busy = false;
            if (ok) last = n;
            await sleep(ok ? rnd(3000, 5500) : 1500);
            if (ok && Math.random() < 0.3) {
              var hm = homeSpot(); busy = true; await walkTo(hm.x, hm.y); rest(); busy = false;
              await sleep(rnd(3000, 5000));
            }
          }
        } catch (e) { if (e !== CANCEL) throw e; }
      }
      // back to the resting spot and start over (resize, coming back to the tab)
      function reset() {
        gen++; busy = false;
        al.style.width = o.home.offsetWidth + 'px';
        var hm = homeSpot(); place(hm.x, hm.y);
        al.removeAttribute('worlds'); rest();
        life();
      }

      // lift him out of the layout onto the stage at exactly the same spot
      var r0 = rel(al.getBoundingClientRect());
      al.style.position = 'absolute'; al.style.margin = '0'; al.style.transform = 'none';
      al.style.width = (r0.r - r0.l) + 'px';
      stage.appendChild(al);
      place(r0.l, r0.t);
      life();

      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(reset, 200); });
      document.addEventListener('visibilitychange', function () { if (document.hidden) gen++; else reset(); });
      // clicks pass through him, so wave when a click lands on him (and not on something clickable)
      document.addEventListener('click', function (e) {
        if (busy || (e.target.closest && e.target.closest('a,button'))) return;
        var r = al.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        face(null); pose('wave'); clearTimeout(waveT);
        waveT = setTimeout(function () { if (!busy) rest(); }, 1600);
      });
    }
  };
})();
