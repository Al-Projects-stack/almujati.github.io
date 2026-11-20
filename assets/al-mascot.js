/*
  <al-mascot> : pixel-art Al, reusable across the portfolio.
  Drawn pixel by pixel (navy suit, plum shirt, brown belt and shoes, purple-tinted browline glasses,
  short hair, beard), scaled up with crisp pixels.

  Usage:
    <script src="assets/al-mascot.js"></script>   (../assets/al-mascot.js from cyber/ or vista/)
    <al-mascot pose="idle"></al-mascot>

  Attributes:
    pose    front:  idle | walk | wave | cheer | present-l | present-r | juggle
                    conjure* | unconjure* | juggle-in* | fumble* | scoop* | glasses-on* | yawn*
            side:   walk-side | stand-side | work | think | pc-start* | pc-stretch*
                    pushup | pushup-in* | pushup-out* | bonk* | dazed | getup*
            Cyber:  glitch-out* | glitch-in* | holo-in* | hack* | holo-grant* | holo-out* |
                    bug-in* | stomp* | board-on* | hover | board-off* |
                    fall-in* | fall | fall-fast | fall-warp* | land* | crash* |
                    power-up* | powered | power-down*
            any:    point (side) | peek (side) | found* | shocked* | cv-out* | cv-read* | cv-stamp* | cv-show* | duck* | shy*
    .look(dir)  'l' | 'r' | 'u' | null: his eyes (and head, a pixel) turn that way in front-facing poses
            Vista:  minimize* | restore* | uac* | uac-click* | facepalm* | sit-down* | update-wait |
                    doze | update-done* | stand-up* | bsod* | solitaire*
            (* plays once and holds the last frame; side poses face right)
    worlds  (boolean) shows the Cyber hexagon + Vista orb in the cheer / present poses
    facing  "left" mirrors him

  Size: set a width on the element (default 120px); height follows at 56:74. The drawing overhangs
  that box sideways (push-ups, the desk, dropped worlds) without affecting layout.
  customElements.get('al-mascot').dur(pose) gives one pass of a pose in ms.

  Side frames are articulated: legs are [thigh, shin, foot] angles, `lean` tilts the upper body at the
  hips, `hands` plants a hand on the floor or a knee (the arm bends to reach), `dx` shifts the body.
*/
(function () {
  if (!window.customElements || customElements.get('al-mascot')) return;

  // element box = 56x74 sprite px; the canvas is 103 wide and overhangs it 24px left / 23px right,
  // so the body centre line (x 19.5 in figure coords) sits in the middle of both
  var W = 103, H = 74, XO = 32, DEG = Math.PI / 180;
  var C = {
    H: '#231914', h: '#3d2e23',                  // hair (a touch lighter so it reads on dark pages)
    S: '#6b4029', s: '#55311f', E: '#5c3622',    // skin, skin shadow, ear
    B: '#1b130f',                                 // beard
    G: '#7a5cb8', g: '#3b2a68', w: '#e6dcff',     // lens, lens lower tint, lens highlight
    F: '#a9aeb6',                                 // silver frame / browline rim
    M: '#8f4c3e', T: '#f1ece4', m: '#3a1410',     // lips, teeth, mouth / eyes
    J: '#2c3252', j: '#22273f', L: '#1b1f33',     // jacket, jacket shade, lapel/pocket line
    P: '#4b4170', p: '#3c335c',                   // plum shirt, shirt shade
    b: '#5a3a22', k: '#b08a52',                   // belt, buckle
    N: '#2a3050', n: '#21263f',                   // trousers, trouser shade
    O: '#8a4b24', o: '#b8703f', R: '#3a1f10',     // shoes, shoe shine, sole
    Q: '#6a3819'                                  // far-side shoe (in shadow)
  };

  // front head, 10x11 at x15..24, y16..26. Browline glasses: silver rim over each lens,
  // two separate lenses with a highlight, skin showing between them under the bridge
  var HEAD = [
    '..HHHHHH..',
    '.HHhhhhHH.',
    '.HHHHHHHH.',
    '.FFFSSFFF.',
    'EGwGFFGwGE',
    'ESggSSggSE',
    '.BSSssSSB.',
    '.BSBBBBSB.',
    '.BBMMMMBB.',
    '..BBBBBB..',
    '...BBBB...'
  ];
  var HAPPY = { 8: '.BMTTTTMB.', 9: '..BmMMmB..' };       // open smile
  var SHOCK = { 8: '.BBMmmMBB.', 9: '..BBMMBB..' };       // "oh no" mouth
  var GLINT = { 4: 'EwwGFFwwGE' };
  var LOOKS = { l: { 4: 'EwGGFFwGGE' }, r: { 4: 'EGGwFFGGwE' }, u: { 4: 'EGwGFFGwGE', 5: 'ESggSSggSE' } };
  var LOOK = null;   // set by the element while it renders (where the cursor is)
  var NOGLASS = { 3: '.HSSSSSSH.', 4: 'ESmSSSSmSE', 5: 'ESsSSSSsSE' };
  var GLASSES_FRONT = ['FFF..FFF', 'GwGFFGwG', '.gg..gg.'];

  // side profile head (facing right), 12x11 at x14..25, y16..26: hair at the back, ear,
  // glasses arm running back to the ear, rimmed lens at the front, nose, beard along the jaw
  var SIDE_HEAD = [
    '...HHHHHH...',
    '..HHhhhhHH..',
    '.HHHHHHHHHH.',
    '.HHHHHSSFFF.',
    '.HHHHFFFGwG.',
    '.HHHESSSSggS',
    '.HHHESSSSSSS',
    '..HBBSSSSSS.',
    '..BBBBBBBMM.',
    '...BBBBBBBB.',
    '....BBBBBB..'
  ];
  var SIDE_GLINT = { 4: '.HHHHFFFwwG.' };
  var SIDE_NOGLASS = { 3: '.HHHHHSSSSS.', 4: '.HHHSSSSSmS.', 5: '.HHHESSSSSSS' };
  var GLASSES_SIDE = ['...FFF', 'FFFGwG', '....gg'];

  var HEX = ['.CCC.', 'C...C', 'C.c.C', 'C...C', '.CCC.'];
  var ORB = ['.VVV.', 'VuVVV', 'VVVVV', 'VVVvV', '.VVV.'];
  var ICON = { C: '#00d4ff', c: '#7fe9ff', V: '#5ab8ff', u: '#e6f4ff', v: '#1e4a8a' };

  // side walk cycle, one leg over 8 frames: [thigh, shin, foot] in degrees
  // (thigh/shin from straight down, + = forward; foot + = toe up, 180 = lying flat behind, sole up).
  // contact (heel strike) > loading > mid stance > push > toe-off > swing (knee up) > passing > reach.
  // The other leg runs 4 frames behind; the lower foot is always planted, which gives the body bob.
  var STEP = [[24, 18, 14], [16, 2, 0], [4, 0, 0], [-10, -8, 0], [-20, -28, -25], [-10, -55, -30], [10, -35, -15], [26, 6, 5]];
  var STAND = [[3, 0, 0], [-3, 0, 0]];
  var KNEEL = [[0, -90, 180], [-5, -90, 180]];          // both knees on the floor, feet flat behind
  var LUNGE = [[80, 5, 0], [-5, -90, 180]];             // one foot forward, back knee down
  var RISE = [[45, -5, 0], [-15, -35, -40]];            // pushing up off the front knee
  var SIT = [[90, 90, 90], [88, 90, 90]];               // legs straight out on the floor

  // code on the conjured PC: [indent, length, colour]
  var CODE = [[0, 9, 0], [1, 6, 1], [1, 10, 2], [2, 5, 3], [2, 8, 0], [1, 4, 4], [0, 3, 1], [0, 11, 2], [1, 7, 3], [2, 6, 1], [1, 9, 0], [0, 5, 4]];
  var CODECOL = ['#00d4ff', '#c792ea', '#7fdb8a', '#ffcb6b', '#8ab8ff'];

  function range(n, fn) { var a = []; for (var i = 0; i < n; i++) a.push(fn(i)); return a; }
  function sd(o) { o.side = true; return o; }
  function ext(base, extra) { var f = {}, k; for (k in base) f[k] = base[k]; for (k in extra) f[k] = extra[k]; return f; }

  // front arm: [upper angle, forearm angle, forearm length]; degrees from straight down, + = away from body
  var HANG = [6, 4, 8];
  var UP = { l: [150, 165, 8], r: [150, 165, 8] };
  var RUB = { l: [20, -60, 6], r: [20, -60, 6] }, RUB2 = { l: [22, -42, 6], r: [22, -42, 6] };
  // push-up plank: the whole sprite tilts on the toes; hands stay planted on the ground
  function plank(a, x, dur) { return { dur: dur, side: true, noArms: true, legs: [[0, 0, 0], [2, 0, 0]], rot: { a: a, ps: [25, 70], pd: [x, 70] }, hand: x + 36.5, glow: [x - 2, x + 54] }; }
  // falling backwards: the whole sprite tilts on the heels
  function fall(a, x, y, extra) {
    return ext({ side: true, noglass: true, legs: [[4, 0, 0], [0, 0, 0]], arms: [10, -10], rot: { a: a, ps: [18, 70], pd: [x, y] }, glow: [x - 52, x + 6] }, extra);
  }
  // after the fall he lies (and gets up) 16px behind where he stood
  var DOWN = { side: true, dx: -16, glow: [-30, 30] };
  function down(extra) { return ext(DOWN, extra); }
  var LIE = { legs: SIT, oy: 20, lean: -90, arms: [10, -10], noglass: true };
  var STARS = [[[-8, 56], [-2, 53], [2, 57]], [[-5, 53], [1, 56], [-10, 55]]];
  var B0 = [[5, 68, 'h'], [34, 68, 'o']];               // where the dropped worlds come to rest

  // ── world-specific helpers ──
  var HOVER = [[35, -5, 0], [-28, -20, 0]];             // surf stance on the hoverboard
  var HOVERDIP = [[45, -20, 0], [-35, -35, 0]];         // knees bent (take-off / landing)
  var AIR = [[[70, 90], [66, 86]], [[74, 96], [68, 88]]];   // typing on the hologram
  var TYPE_AT = function (j) { return AIR[j % 2]; };
  // sitting on the floor and getting back up (no fall offset)
  var SITUP = [
    sd({ dur: 220, legs: [[135, 30, 0], [130, 35, 0]], lean: 10, arms: [[60, 80], [55, 75]] }),
    sd({ dur: 200, legs: [[60, -60, -40], [55, -65, -40]], lean: 62, hands: [[34, 69], [32, 69]] }),
    sd({ dur: 220, legs: KNEEL, lean: 75, hands: [[35, 69], [33, 69]] }),
    sd({ dur: 260, legs: LUNGE, lean: 35, hands: [[29.5, 55], [28, 55]] }),
    sd({ dur: 240, legs: RISE, lean: 28, hands: [[26.6, 54.5], [25.5, 55]] }),
    sd({ dur: 220, legs: STAND, lean: 5, arms: [5, -5] })
  ];
  var SEAT = { legs: SIT, oy: 20, lean: 0, arms: [40, 30] };
  function seat(extra) { return sd(ext(SEAT, extra)); }
  // glitch steps: band shift, scan band height, chroma split, pixels kept
  function gl(amp, band, split, keep, seed) { return { amp: amp, band: band, split: split, keep: keep, seed: seed }; }
  var GLITCH_OUT = [
    { dur: 90, glitch: gl(1, 4, 1, 1, 1) },
    { dur: 70, glitch: gl(4, 3, 2, 1, 2) },
    { dur: 60 },
    { dur: 70, glitch: gl(3, 6, 3, 0.85, 3) },
    { dur: 70, glitch: gl(6, 2, 3, 0.6, 4) },
    { dur: 70, glitch: gl(9, 2, 4, 0.35, 5) },
    { dur: 70, glitch: gl(12, 2, 5, 0.12, 6) },
    { dur: 60, hidden: true, line: [6, 34] },
    { dur: 60, hidden: true, line: [14, 26] },
    { dur: 60, hidden: true }
  ];
  // flash step stance: low, leaning in, arms swept back
  var DASH = { legs: [[45, -20, 0], [-35, -35, 0]], lean: 16, arms: [[-60, -40], [-70, -50]] };
  function dash(extra) { return sd(ext(DASH, extra)); }
  var WAVE_A = { happy: true, r: [140, 175, 8] }, WAVE_B = { happy: true, r: [140, 145, 8] };
  // Aero glass window drawn round him when he minimizes
  function mini(s, dur) { return { dur: dur, glass: true, scale: s }; }
  // falling (the page scrolling under him): arms flailing over his head, legs kicking, glasses lifting
  // off his face, wind rushing up past him; fast = scrolled hard, so it glitches all the way down
  function fallF(i, fast) {
    var a = i % 2;
    return {
      dur: fast ? 55 : 80, shock: true, noglass: true, floatGlasses: 2 + (i % 3),
      l: a ? [150, 112, 8] : [118, 162, 8], r: a ? [118, 162, 8] : [150, 112, 8], lift: a ? [5, 1] : [1, 5],
      wind: { k: i, fast: fast },
      glitch: fast ? gl(2 + i % 3, 2 + i % 2, 3, i % 4 === 3 ? 0.8 : 1, 80 + i) : i % 4 === 2 ? gl(2, 3, 2, 1, 90 + i) : null
    };
  }
  // glitched power-up: fists clenched at his hips, a flickering RGB aura, hair spiking up and glowing
  var FLEX = { l: [32, -38, 7], r: [32, -38, 7] };
  function charge(i) {
    return ext(FLEX, {
      dur: 110, crouch: 5, dy: i % 2, shock: true, glint: i % 4 === 1,
      aura: { lv: 0.2 + i * 0.08, k: i }, motes: i, bolt: i >= 5 ? i : null,
      spiky: i >= 6 && i % 2 ? { k: i, lv: 0.5 } : null,   // hair flickers gold before it takes
      glitch: i % 3 === 2 ? gl(1 + Math.floor(i / 3), 3, 2, 1, 100 + i) : null
    });
  }
  // holding the CV in front of him with both hands
  var READ = { l: [25, -55, 6], r: [25, -55, 6] }, DOC = { y: 27, h: 18 };
  // superhero landing: back knee and one hand on the floor, far arm swept back
  var HERO = { legs: [[60, -60, -40], [-5, -90, 180]], lean: 62, hands: [[34, 69], null], arms: [0, [-80, -60]] };
  function hero(extra) { return sd(ext(HERO, extra)); }

  var POSES = {
    idle: [{ dur: 2600 }, { dur: 140, glint: true }],
    // walking toward the viewer: knee lifts alternate, arms swing against the legs, dips on each footfall
    walk: [
      { dur: 95, dy: 1, l: [4, 0, 7], r: [8, 6, 8] },
      { dur: 95, lift: [1, 0], l: [0, -4, 6], r: [11, 9, 8] },
      { dur: 95, lift: [3, 0], l: [0, -6, 5], r: [13, 11, 8] },
      { dur: 95, lift: [1, 0], l: [0, -4, 6], r: [11, 9, 8] },
      { dur: 95, dy: 1, l: [8, 6, 8], r: [4, 0, 7] },
      { dur: 95, lift: [0, 1], l: [11, 9, 8], r: [0, -4, 6] },
      { dur: 95, lift: [0, 3], l: [13, 11, 8], r: [0, -6, 5] },
      { dur: 95, lift: [0, 1], l: [11, 9, 8], r: [0, -4, 6] }
    ],
    wave: [
      { dur: 230, happy: true, r: [140, 175, 8] },
      { dur: 230, happy: true, r: [140, 145, 8] }
    ],
    cheer: [
      { dur: 260, happy: true, orbs: { l: 'tip', r: 'tip' }, l: [155, 172, 8], r: [155, 172, 8] },
      { dur: 260, happy: true, orbs: { l: 'tip', r: 'tip' }, l: [155, 172, 8], r: [155, 172, 8], hop: 1 }
    ],
    'present-l': [
      { dur: 320, happy: true, orbs: { l: 'above' }, l: [80, 95, 8] },
      { dur: 320, happy: true, orbs: { l: 'above' }, l: [80, 101, 8] }
    ],
    'present-r': [
      { dur: 320, happy: true, orbs: { r: 'above' }, r: [80, 95, 8] },
      { dur: 320, happy: true, orbs: { r: 'above' }, r: [80, 101, 8] }
    ],
    // stretch and yawn
    yawn: [
      { dur: 200, l: [100, 140, 8], r: [100, 140, 8] },
      { dur: 220, l: UP.l, r: UP.r, hop: 1 },
      { dur: 700, shock: true, l: UP.l, r: UP.r, hop: 1 },
      { dur: 200, l: [100, 140, 8], r: [100, 140, 8] },
      { dur: 200 }
    ],

    'walk-side': range(8, function (i) { return { dur: 80, side: true, ph: i }; }),
    'stand-side': [
      { dur: 2600, side: true, legs: STAND, arms: [2, -2] },
      { dur: 140, side: true, legs: STAND, arms: [2, -2], glint: true }
    ],

    // ── magic PC ──
    // rubs his hands, raises them, sparkles, poof: a standing desk with a monitor
    conjure: [
      { dur: 160, l: RUB.l, r: RUB.r },
      { dur: 160, l: RUB2.l, r: RUB2.r },
      { dur: 160, l: RUB.l, r: RUB.r },
      { dur: 160, happy: true, l: [100, 140, 8], r: [100, 140, 8] },
      { dur: 170, happy: true, l: UP.l, r: UP.r, sparks: [[44, 30, 1], [50, 22, 1], [38, 44, 1]] },
      { dur: 170, happy: true, l: UP.l, r: UP.r, sparks: [[42, 26, 2], [52, 34, 1], [47, 46, 2], [56, 24, 1]] },
      { dur: 200, happy: true, l: UP.l, r: UP.r, poof: [46, 36], sparks: [[36, 22, 2], [57, 30, 2], [44, 52, 2], [54, 48, 1]] },
      { dur: 320, happy: true, l: UP.l, r: UP.r, pc: true, sparks: [[36, 18, 1], [58, 42, 1]] }
    ],
    // turns to the desk and cracks his knuckles
    'pc-start': [
      sd({ dur: 220, legs: STAND, pc: true, code: 0, arms: [10, 5] }),
      sd({ dur: 160, legs: STAND, pc: true, code: 0, arms: [[80, 85], [78, 85]] }),
      sd({ dur: 130, legs: STAND, pc: true, code: 0, arms: [[86, 100], [84, 100]] }),
      sd({ dur: 160, legs: STAND, pc: true, code: 0, arms: [[80, 85], [78, 85]] }),
      sd({ dur: 130, legs: STAND, pc: true, code: 0, arms: [[86, 100], [84, 100]] }),
      sd({ dur: 180, legs: STAND, pc: true, code: 0, arms: [[48, 93], [48, 97]] })
    ],
    work: range(24, function (j) {
      return sd({ dur: 150, legs: STAND, pc: true, code: j, arms: j % 2 ? [[50, 97], [46, 93]] : [[48, 93], [48, 97]] });
    }),
    // hand on chin, reading what he wrote; cursor blinking
    think: [
      sd({ dur: 500, legs: STAND, pc: true, code: 11, arms: [[40, 195], [46, 93]] }),
      sd({ dur: 500, legs: STAND, pc: true, code: 11, cursorOff: true, arms: [[40, 195], [46, 93]] }),
      sd({ dur: 500, legs: STAND, pc: true, code: 11, arms: [[40, 190], [46, 93]], glint: true }),
      sd({ dur: 500, legs: STAND, pc: true, code: 11, cursorOff: true, arms: [[40, 195], [46, 93]] })
    ],
    // leans back and stretches when he's done
    'pc-stretch': [
      sd({ dur: 200, legs: STAND, pc: true, code: 23, lean: -3, arms: [[120, 140], [115, 135]] }),
      sd({ dur: 650, legs: STAND, pc: true, code: 23, lean: -9, arms: [[170, 178], [165, 175]] }),
      sd({ dur: 200, legs: STAND, pc: true, code: 23, lean: -3, arms: [[120, 140], [115, 135]] }),
      sd({ dur: 220, legs: STAND, pc: true, code: 23, arms: [10, 5] })
    ],
    unconjure: [
      { dur: 160, happy: true, pc: true, l: [100, 140, 8], r: [100, 140, 8] },
      { dur: 200, happy: true, l: UP.l, r: UP.r, pc: true, sparks: [[40, 24, 1], [55, 40, 2]] },
      { dur: 220, l: UP.l, r: UP.r, poof: [46, 36], sparks: [[36, 26, 2], [56, 34, 2], [46, 50, 1]] },
      { dur: 200, l: [100, 140, 8], r: [100, 140, 8], sparks: [[42, 30, 1], [52, 44, 1]] },
      { dur: 200 }
    ],

    // ── push-ups ──
    // bends, squats, hands to the floor, steps one foot back, then the other into a plank
    'pushup-in': [
      sd({ dur: 140, legs: STAND, lean: 12, arms: [20, 10] }),
      sd({ dur: 150, legs: [[60, -20, 0], [55, -25, 0]], lean: 35, arms: [50, 40] }),
      sd({ dur: 200, legs: [[85, -40, 0], [80, -45, 0]], lean: 60, hands: [[36.5, 69], [34, 69]] }),
      sd({ dur: 170, legs: [[-70, -75, -70], [80, -45, 0]], lean: 65, hands: [[36.5, 69], [34, 69]] }),
      plank(72, 0, 200)
    ],
    pushup: [plank(72, 0, 260), plank(76, 0, 110), plank(81, 0, 110), plank(86, 0, 240), plank(81, 0, 110), plank(76, 0, 110)],
    // drops to his knees, sits back, one foot forward, hands on the knee to push himself up, dusts off his hands
    'pushup-out': [
      plank(72, 0, 200),
      sd({ dur: 220, legs: [[-40, -90, 180], [-45, -90, 180]], lean: 72, hands: [[36.5, 69], [34, 69]] }),
      sd({ dur: 220, legs: [[-10, -95, 180], [-15, -95, 180]], lean: 55, hands: [[33, 69], [31, 69]] }),
      sd({ dur: 260, legs: LUNGE, lean: 35, hands: [[29.5, 55], [28, 55]] }),
      sd({ dur: 240, legs: RISE, lean: 28, hands: [[26.6, 54.5], [25.5, 55]] }),
      sd({ dur: 200, legs: STAND, lean: 6, arms: [5, -5] }),
      { dur: 150, l: RUB.l, r: RUB.r },
      { dur: 150, l: RUB2.l, r: RUB2.r },
      { dur: 150, l: RUB.l, r: RUB.r },
      { dur: 200 }
    ],

    // ── walks into a glass pane ──
    // smack, glasses fly off, falls flat (small bounce), sees stars
    bonk: [
      sd({ dur: 90, legs: STAND, lean: 4, arms: [35, 20], stars: [[27, 20]] }),
      fall(-6, 18, 70, { dur: 110, arms: [20, -10], flyGlasses: [26, 14], stars: [[28, 18]] }),
      fall(-25, 20, 70, { dur: 130, arms: [70, 50], flyGlasses: [22, 3] }),
      fall(-55, 23, 69, { dur: 130, arms: [100, 80], flyGlasses: [12, 2] }),
      fall(-90, 26, 67, { dur: 90, arms: [120, 100], flyGlasses: [-2, 22] }),
      fall(-90, 26, 68, { dur: 160, arms: [120, 100], flyGlasses: [-4, 46] }),
      down(ext(LIE, { dur: 200, glassesAt: [6, 61] }))
    ],
    dazed: [
      down(ext(LIE, { dur: 260, glassesAt: [6, 61], stars: STARS[0] })),
      down(ext(LIE, { dur: 260, glassesAt: [6, 61], stars: STARS[1], legs: [[90, 90, 90], [84, 90, 80]] }))
    ],
    // props himself up on an elbow, sits up, rubs his head, finds his glasses in his lap, puts them on,
    // knees up, rolls forward onto hands and knees, one foot forward, pushes up off his knee
    getup: [
      down(ext(LIE, { dur: 240, glassesAt: [6, 61] })),
      down({ dur: 220, legs: SIT, oy: 20, lean: -60, noglass: true, hands: [[4, 69], null], arms: [10, -10], glassesAt: [21, 63] }),
      down({ dur: 220, legs: SIT, oy: 20, lean: -25, noglass: true, hands: [[8, 69], null], arms: [10, -10], glassesAt: [21, 63] }),
      down({ dur: 200, legs: SIT, oy: 20, lean: -10, noglass: true, hands: [null, [12, 69]], arms: [[150, 225], 0], glassesAt: [21, 63] }),
      down({ dur: 200, legs: SIT, oy: 20, lean: -10, noglass: true, hands: [null, [12, 69]], arms: [[150, 242], 0], glassesAt: [21, 63] }),
      down({ dur: 200, legs: SIT, oy: 20, lean: -10, noglass: true, hands: [null, [12, 69]], arms: [[150, 225], 0], glassesAt: [21, 63] }),
      down({ dur: 260, legs: SIT, oy: 20, lean: 20, noglass: true, hands: [[24, 64], null], arms: [0, 10], glassesAt: [21, 63] }),
      down({ dur: 300, legs: SIT, oy: 20, lean: 0, arms: [[40, 195], 10] }),
      down({ dur: 220, legs: [[135, 30, 0], [130, 35, 0]], lean: 10, arms: [[60, 80], [55, 75]] }),
      down({ dur: 200, legs: [[60, -60, -40], [55, -65, -40]], lean: 62, hands: [[34, 69], [32, 69]] }),
      down({ dur: 220, legs: KNEEL, lean: 75, hands: [[35, 69], [33, 69]] }),
      down({ dur: 260, legs: LUNGE, lean: 35, hands: [[29.5, 55], [28, 55]] }),
      down({ dur: 240, legs: RISE, lean: 28, hands: [[26.6, 54.5], [25.5, 55]] }),
      down({ dur: 220, legs: STAND, lean: 5, arms: [5, -5] })
    ],
    // pushes his glasses up his nose and smiles
    'glasses-on': [
      { dur: 300, r: [150, -95, 8] },
      { dur: 160, r: [150, -95, 8], glint: true },
      { dur: 380, happy: true }
    ],

    // ── juggling ──
    // cups his hands, the worlds appear, first throw
    'juggle-in': [
      { dur: 200, l: [20, -50, 6], r: [20, -50, 6], sparks: [[19, 40, 1]] },
      { dur: 220, l: [20, -50, 6], r: [20, -50, 6], sparks: [[16, 35, 2], [23, 36, 1]], balls: [[17, 39, 'h'], [22, 39, 'o']] },
      { dur: 220, happy: true, l: [12, 115, 6], r: [12, 118, 6], hold: -4 },
      { dur: 140, happy: true, l: [12, 140, 6], r: [12, 118, 6], hold: -4, dy: 1 }
    ],
    // one throw every 4 frames, knees give a little on each catch
    juggle: range(8, function (i) { return { dur: 90, happy: true, juggle: i, dy: i % 4 === 3 ? 1 : 0 }; }),
    // loses them: worlds fly off, hit the floor, bounce, roll back in; he scratches his head
    fumble: [
      { dur: 150, shock: true, l: [150, 170, 8], r: [120, 140, 8], balls: [[-2, 4, 'h'], [42, 0, 'o']] },
      { dur: 150, shock: true, l: [110, 130, 8], r: [105, 125, 8], balls: [[-5, 22, 'h'], [44, 18, 'o']], lift: [2, 0] },
      { dur: 150, shock: true, l: [70, 90, 8], r: [70, 90, 8], balls: [[-6, 48, 'h'], [44, 44, 'o']] },
      { dur: 140, shock: true, l: [40, 60, 8], r: [40, 60, 8], balls: [[-5, 68, 'h'], [43, 68, 'o']] },
      { dur: 130, shock: true, balls: [[-3, 60, 'h'], [41, 61, 'o']] },
      { dur: 130, shock: true, balls: [[0, 68, 'h'], [38, 68, 'o']] },
      { dur: 160, shock: true, balls: [[3, 67, 'h'], [36, 68, 'o']] },
      { dur: 500, shock: true, balls: B0 },
      { dur: 220, balls: B0, r: [170, -140, 6] },
      { dur: 220, balls: B0, r: [170, -165, 6] },
      { dur: 220, balls: B0, r: [170, -140, 6] },
      { dur: 220, balls: B0, r: [170, -165, 6] }
    ],
    // crouches down, picks both up, stands back up holding them
    scoop: [
      { dur: 160, crouch: 5, l: [24, 24, 8], r: [24, 24, 8], balls: B0 },
      { dur: 160, crouch: 11, l: [24, 24, 8], r: [24, 24, 8], balls: B0 },
      { dur: 260, crouch: 16, l: [24, 24, 8], r: [24, 24, 8], balls: B0 },
      { dur: 160, crouch: 16, l: [24, 24, 8], r: [24, 24, 8], hold: 2 },
      { dur: 150, crouch: 10, l: [30, 20, 8], r: [30, 20, 8], hold: 2 },
      { dur: 150, crouch: 4, l: [30, 10, 8], r: [30, 10, 8], hold: 2 },
      { dur: 260, happy: true, l: [30, 10, 8], r: [30, 10, 8], hold: 2 }
    ],

    // ════ Cyber world ════
    // glitch teleport: scan bands slip, RGB split, he breaks up into pixels and collapses to a scanline
    'glitch-out': GLITCH_OUT,
    'glitch-in': GLITCH_OUT.slice(0, 9).reverse().map(function (f) { return ext(f, {}); }).concat([{ dur: 200, happy: true }, { dur: 200 }]),

    // hologram hack: snaps his fingers, a holo panel unfolds, types in the air with code rain, ACCESS GRANTED
    'holo-in': [
      sd({ dur: 200, legs: STAND, arms: [2, -2] }),
      sd({ dur: 180, legs: STAND, arms: [[100, 125], -2] }),
      sd({ dur: 160, legs: STAND, arms: [[115, 140], -2], sparks: [[40, 22, 1]] }),
      sd({ dur: 90, legs: STAND, arms: [[110, 128], -2], holo: { o: 0 }, sparks: [[42, 24, 2], [36, 20, 1]] }),
      sd({ dur: 90, legs: STAND, arms: [[100, 118], -2], holo: { o: 0.35 } }),
      sd({ dur: 90, legs: STAND, arms: [[85, 100], 10], holo: { o: 0.7 } }),
      sd({ dur: 160, legs: STAND, arms: AIR[0], holo: { o: 1, j: 0 } })
    ],
    hack: range(22, function (j) {
      return sd({ dur: 140, legs: STAND, arms: TYPE_AT(j), holo: { o: 1, j: j }, glint: j === 15 });
    }),
    'holo-grant': [
      sd({ dur: 220, legs: STAND, arms: AIR[0], holo: { o: 1, j: 21, mode: 'grant' } }),
      sd({ dur: 140, legs: STAND, arms: AIR[0], holo: { o: 1, j: 21 } }),
      sd({ dur: 220, legs: STAND, arms: [10, 5], holo: { o: 1, j: 21, mode: 'grant' } }),
      { dur: 200, happy: true, holo: { o: 1, mode: 'grant' }, r: [100, 150, 7] },
      { dur: 260, happy: true, holo: { o: 1, mode: 'grant' }, r: [160, 178, 7], hop: 2 },
      { dur: 200, happy: true, holo: { o: 1, mode: 'grant' }, r: [150, 170, 7] },
      { dur: 260, happy: true, holo: { o: 1, mode: 'grant' }, r: [160, 178, 7], hop: 2 },
      { dur: 300, happy: true, holo: { o: 1, mode: 'grant' } }
    ],
    'holo-out': [
      { dur: 120, holo: { o: 0.6, mode: 'grant' }, r: [60, 100, 7] },
      { dur: 100, holo: { o: 0.25, mode: 'grant' }, r: [40, 60, 7] },
      { dur: 100, holo: { o: 0, mode: 'grant' }, sparks: [[44, 26, 2]] },
      { dur: 120, sparks: [[38, 26, 1], [52, 25, 1]] },
      { dur: 200 }
    ],

    // squashing a bug: a pixel bug crawls up, he spots it, stomps it, checks it's fixed
    'bug-in': range(13, function (i) {
      var f = sd({ dur: 130, legs: STAND, arms: [2, -2], bug: { x: 64 - i * 10 / 3, k: i } });
      if (i >= 8) { f.bang = [19, 6]; f.lean = 10; f.arms = [12, 6]; f.glint = i === 8; }
      return f;
    }),
    stomp: [
      sd({ dur: 160, legs: STAND, lean: 4, arms: [30, -25], bug: { x: 24, k: 0 } }),
      sd({ dur: 160, legs: [[40, 0, 10], STAND[1]], lean: 2, arms: [45, -40], bug: { x: 24, k: 1 } }),
      sd({ dur: 240, legs: [[60, -5, 15], STAND[1]], lean: 0, arms: [55, -50], bug: { x: 24, k: 0 } }),
      sd({ dur: 90, legs: [[45, -10, 5], STAND[1]], lean: 4, arms: [30, -30], bug: { x: 24, k: 1 } }),
      sd({ dur: 260, legs: [[30, -5, 0], STAND[1]], lean: 8, arms: [20, -15], splat: 0, stars: [[24, 63], [33, 62]] }),
      sd({ dur: 220, legs: [[30, -5, 0], STAND[1]], lean: 12, arms: [10, 0], splat: 1 }),
      sd({ dur: 200, legs: STAND, lean: 14, arms: [10, 0], splat: 1, fixed: true }),
      sd({ dur: 380, legs: STAND, lean: 6, arms: [5, -5], splat: 2, fixed: true }),
      { dur: 150, happy: true, l: RUB.l, r: RUB.r },
      { dur: 150, happy: true, l: RUB2.l, r: RUB2.r },
      { dur: 150, happy: true, l: RUB.l, r: RUB.r },
      { dur: 420, happy: true, r: [100, 150, 6], glint: true }
    ],

    // hoverboard: a board materialises under his feet, he dips and lifts off, rides, lands, it dissolves
    'board-on': [
      sd({ dur: 160, legs: STAND, arms: [2, -2], sparks: [[8, 71, 1], [30, 71, 1]] }),
      sd({ dur: 160, legs: STAND, arms: [2, -2], board: { lift: 0, k: 0 }, sparks: [[4, 70, 2], [34, 70, 1], [19, 73, 1]] }),
      sd({ dur: 200, legs: STAND, arms: [10, -10], board: { lift: 0, k: 0 } }),
      sd({ dur: 200, legs: HOVERDIP, lean: 8, arms: [[40, 60], [-30, -20]], board: { lift: 0, k: 0 } }),
      sd({ dur: 120, legs: HOVER, lean: 4, arms: [[60, 75], [-55, -45]], board: { lift: 2, k: 1 }, lift: 2 }),
      sd({ dur: 160, legs: HOVER, lean: 6, arms: [[60, 75], [-55, -45]], board: { lift: 4, k: 0 }, lift: 4 })
    ],
    hover: range(4, function (i) {
      var up = [4, 5, 5, 4][i];
      return sd({ dur: 120, legs: HOVER, lean: 6, arms: i < 2 ? [[60, 75], [-55, -45]] : [[64, 80], [-50, -42]], board: { lift: up, k: i }, lift: up, glow: [2, 36] });
    }),
    'board-off': [
      sd({ dur: 120, legs: HOVER, lean: 4, arms: [[60, 75], [-55, -45]], board: { lift: 2, k: 1 }, lift: 2 }),
      sd({ dur: 200, legs: HOVERDIP, lean: 8, arms: [[40, 60], [-30, -20]], board: { lift: 0, k: 0 } }),
      sd({ dur: 200, legs: STAND, arms: [10, -10], board: { lift: 0, k: 0 } }),
      sd({ dur: 140, legs: STAND, arms: [2, -2], board: { lift: 0, k: 0, fade: true }, sparks: [[6, 71, 1], [32, 71, 2]] }),
      sd({ dur: 140, legs: STAND, arms: [2, -2], sparks: [[12, 71, 1], [26, 72, 1]] }),
      sd({ dur: 200, legs: STAND, arms: [2, -2] })
    ],

    // flash step: low dash stance, bursts out in an RGB streak, re-forms further along, slides to a stop
    'dash-ready': [
      sd({ dur: 120, legs: STAND, arms: [2, -2] }),
      sd({ dur: 120, legs: HOVERDIP, lean: 8, arms: [[-20, 0], [-30, -10]] }),
      dash({ dur: 200, glint: true })
    ],
    'flash-out': [
      dash({ dur: 50, glitch: gl(2, 3, 3, 1, 7), streak: 6 }),
      dash({ dur: 50, glitch: gl(6, 2, 5, 0.45, 8), streak: 14 }),
      { dur: 40, hidden: true, streak: 22 }
    ],
    'flash-in': [
      { dur: 40, hidden: true, streak: 12 },
      dash({ dur: 50, glitch: gl(4, 2, 4, 0.6, 9), streak: 8 }),
      dash({ dur: 60, glitch: gl(1, 4, 2, 1, 10), streak: 3 }),
      dash({ dur: 90 })
    ],
    'dash-stop': [
      sd({ dur: 160, legs: [[40, -10, 0], [-30, -20, 0]], lean: -8, arms: [[60, 80], [-40, -20]], dust: 1 }),
      sd({ dur: 170, legs: [[22, -5, 0], [-18, -10, 0]], lean: -3, arms: [20, -10], dust: 2 }),
      sd({ dur: 200, legs: STAND, arms: [2, -2], dust: 3 }),
      { dur: 300, happy: true, r: [150, -95, 8], glint: true },
      { dur: 260, happy: true }
    ],
    // what he leaves behind on each step: a cyan ghost of the dash stance
    afterimage: [dash({ dur: 1000, tint: [0, 212, 255] })],

    // shadow clones: he stutters and splits (the clones glitch in beside him)
    split: [
      { dur: 80, glitch: gl(3, 3, 4, 1, 30) },
      { dur: 60 },
      { dur: 90, glitch: gl(5, 2, 7, 1, 31) },
      { dur: 70, glitch: gl(2, 4, 9, 1, 32) },
      { dur: 220, happy: true }
    ],

    // lag spike: waving, freezes mid-wave with a buffering ring over his head, then catches up double speed
    lag: [
      ext(WAVE_A, { dur: 230 }), ext(WAVE_B, { dur: 230 }), ext(WAVE_A, { dur: 230 }),
      ext(WAVE_B, { dur: 90, glitch: gl(3, 3, 2, 1, 11) })
    ].concat(range(12, function (k) {
      return ext(WAVE_B, { dur: 100, spin: k, glitch: k % 5 === 4 ? gl(1, 5, 1, 1, 12 + k) : null });
    })).concat(range(10, function (k) {
      return ext(k % 2 ? WAVE_A : WAVE_B, { dur: 45, dy: k % 2, glitch: k % 3 === 0 ? gl(2, 3, 2, 1, 30 + k) : null });
    })).concat([
      { dur: 120, glitch: gl(2, 4, 3, 1, 50) },
      { dur: 220, glint: true },
      { dur: 300, happy: true }
    ]),

    // running on the spinning square: leaning run, then losing it (arms windmilling), then tumbling off
    'run-side': range(8, function (i) { return sd({ dur: 55, ph: i, lean: 10 }); }),
    'run-flail': range(8, function (i) {
      return sd({ dur: 60, ph: i, lean: i % 4 < 2 ? -6 : 2, arms: i % 2 ? [[160, 175], [110, 130]] : [[120, 140], [165, 178]] });
    }),
    tumble: range(8, function (i) {
      return sd({ dur: 70, noglass: true, legs: [[30, -20, 0], [-10, -30, 0]], arms: [[150, 170], [130, 150]], rot: { a: -45 * i, ps: [19.5, 45], pd: [19.5, 45] }, flyGlasses: i < 4 ? [28 + i * 3, 10 - i * 2] : null, glow: [99, 0] });   // no floor glow mid-air
    }),

    // falling while the page scrolls, then hitting the floor when it stops
    'fall-in': [
      { dur: 60, shock: true, hop: 2, l: [40, 70, 8], r: [40, 70, 8], glitch: gl(3, 3, 3, 1, 77) },
      { dur: 70, shock: true, hop: 1, noglass: true, floatGlasses: 1, l: [100, 140, 8], r: [100, 140, 8], glitch: gl(5, 2, 4, 0.85, 78), wind: { k: 0 } }
    ],
    fall: range(8, function (i) { return fallF(i, false); }),
    'fall-fast': range(8, function (i) { return fallF(i, true); }),
    // blinks through a glitch to above where he'll land
    'fall-warp': [
      ext(fallF(0, true), { dur: 50, glitch: gl(6, 2, 5, 0.5, 95) }),
      ext(fallF(1, true), { dur: 50, glitch: gl(10, 2, 6, 0.2, 96) }),
      { dur: 60, hidden: true, line: [8, 32] }
    ],
    land: [
      hero({ dur: 60, impact: 1, glitch: gl(5, 2, 4, 1, 71) }),
      hero({ dur: 90, impact: 2, glitch: gl(2, 3, 2, 1, 72) }),
      hero({ dur: 380, impact: 3 }),
      hero({ dur: 200, glint: true }),
      sd({ dur: 240, legs: RISE, lean: 28, hands: [[26.6, 54.5], [25.5, 55]] }),
      sd({ dur: 220, legs: STAND, lean: 5, arms: [5, -5] })
    ],
    // a hard fall: flat on his back with a bounce (then dazed / getup)
    crash: [
      down(ext(LIE, { dur: 70, glassesAt: [6, 61], impact: 1, glitch: gl(6, 2, 4, 1, 73) })),
      down(ext(LIE, { dur: 110, glassesAt: [6, 58], impact: 2, oy: 17 })),
      down(ext(LIE, { dur: 220, glassesAt: [6, 61], impact: 3, stars: STARS[0] }))
    ],

    // power-up: crouches and charges (the aura grows, energy motes rise, sparks crackle), bursts in a
    // big glitch, hair spikes up glowing gold with RGB edges, yells, then holds the pose
    'power-up': [
      ext(FLEX, { dur: 260, crouch: 3, aura: { lv: 0.12, k: 0 } })
    ].concat(range(9, charge)).concat([
      ext(FLEX, { dur: 80, crouch: 5, shock: true, spiky: { k: 9, lv: 1 }, aura: { lv: 1, k: 9 }, glitch: gl(8, 2, 6, 0.6, 120) }),
      ext(FLEX, { dur: 70, crouch: 3, shock: true, spiky: { k: 10, lv: 1 }, aura: { lv: 1, k: 10 }, glitch: gl(13, 2, 8, 0.4, 121), motes: 10 }),
      { dur: 260, shock: true, hop: 2, l: [80, 50, 8], r: [80, 50, 8], spiky: { k: 11, lv: 1 }, aura: { lv: 1, k: 11 }, bolt: 11, motes: 11 },
      ext(FLEX, { dur: 320, glint: true, spiky: { k: 12, lv: 1 }, aura: { lv: 1, k: 12 }, motes: 12 })
    ]),
    powered: range(6, function (i) {
      return ext(FLEX, {
        dur: 90, glint: i === 3, spiky: { k: i, lv: 1 }, aura: { lv: 0.88 + 0.12 * (i % 2), k: i + 20 }, motes: i + 20,
        bolt: i % 3 === 0 ? i + 20 : null, glitch: i === 4 ? gl(2, 3, 3, 1, 130 + i) : null
      });
    }),
    'power-down': [
      ext(FLEX, { dur: 110, spiky: { k: 40, lv: 1 }, aura: { lv: 0.6, k: 40 }, glitch: gl(6, 2, 5, 0.8, 140) }),
      ext(FLEX, { dur: 90, spiky: { k: 41, lv: 0.5 }, aura: { lv: 0.3, k: 41 }, glitch: gl(3, 3, 3, 1, 141) }),
      { dur: 160, aura: { lv: 0.1, k: 42 }, l: [12, 6, 8], r: [12, 6, 8] },
      { dur: 220, l: RUB.l, r: RUB.r },
      { dur: 340, happy: true, glint: true }
    ],

    // ════ any world ════
    // pointing at something (a project card): near arm straight out
    point: [
      sd({ dur: 600, legs: STAND, arms: [[86, 94], -5] }),
      sd({ dur: 160, legs: STAND, arms: [[86, 94], -5], glint: true }),
      sd({ dur: 500, legs: STAND, arms: [[90, 100], -5] })
    ],
    // hide and seek: hiding behind a card, leaning out to peek, ducking back now and then
    peek: [
      sd({ dur: 1300, legs: STAND, lean: 14, arms: [[20, 40], -5] }),
      sd({ dur: 160, legs: STAND, lean: 15, arms: [[20, 40], -5], glint: true }),
      sd({ dur: 900, legs: STAND, lean: 14, arms: [[20, 40], -5] }),
      sd({ dur: 140, legs: STAND, lean: 6, arms: [[10, 20], -5] }),
      sd({ dur: 700, legs: STAND, lean: -2, arms: [5, -5] }),
      sd({ dur: 140, legs: STAND, lean: 8, arms: [[10, 20], -5] })
    ],
    // found: jumps, then arms up
    found: [
      { dur: 140, shock: true, hop: 3, l: [100, 140, 8], r: [100, 140, 8] },
      { dur: 220, happy: true, hop: 1, l: UP.l, r: UP.r },
      { dur: 220, happy: true, l: UP.l, r: UP.r },
      { dur: 220, happy: true, hop: 1, l: UP.l, r: UP.r },
      { dur: 300, happy: true }
    ],
    // shocked: jolts, hands up, "!" over his head, then settles
    shocked: [
      { dur: 80, shock: true, hop: 3, l: [100, 140, 8], r: [100, 140, 8], bang: [19, 5] },
      { dur: 120, shock: true, hop: 1, l: [120, 160, 8], r: [120, 160, 8], bang: [19, 5] },
      { dur: 520, shock: true, l: [110, 150, 8], r: [110, 150, 8], bang: [19, 6] },
      { dur: 200, shock: true, l: [60, 90, 7], r: [60, 90, 7] },
      { dur: 260 }
    ],
    // the CV: rubs his hands, conjures it, unrolls it, reads it (more and more impressed), raises a rubber
    // stamp, slams HIRED on it, holds it up over his head, poofs it away
    'cv-out': [
      { dur: 200, l: RUB.l, r: RUB.r },
      { dur: 160, l: RUB2.l, r: RUB2.r, sparks: [[19, 36, 1]] },
      { dur: 140, l: READ.l, r: READ.r, doc: { y: 27, h: 4 }, sparks: [[10, 30, 2], [29, 31, 1]] },
      { dur: 120, l: READ.l, r: READ.r, doc: { y: 27, h: 10 } },
      { dur: 160, l: READ.l, r: READ.r, doc: { y: 27, h: 18 } }
    ],
    'cv-read': [
      { dur: 420, l: READ.l, r: READ.r, doc: DOC, look: 'l' },
      { dur: 420, l: READ.l, r: READ.r, doc: DOC, look: 'r' },
      { dur: 380, l: READ.l, r: READ.r, doc: DOC, look: 'l', glint: true },
      { dur: 480, l: READ.l, r: READ.r, doc: DOC, shock: true },
      { dur: 420, l: READ.l, r: READ.r, doc: DOC, look: 'r' },
      { dur: 520, l: READ.l, r: READ.r, doc: DOC, happy: true, hop: 1 }
    ],
    'cv-stamp': [
      { dur: 260, l: READ.l, r: [150, 165, 8], doc: DOC, stampAt: [33, 7], sparks: [[34, 5, 1]] },
      { dur: 300, l: READ.l, r: [150, 165, 8], doc: DOC, stampAt: [33, 7], glint: true },
      { dur: 70, l: READ.l, r: [30, -80, 8], doc: DOC, stampAt: [22, 30], dy: 1 },
      { dur: 110, l: READ.l, r: [30, -80, 8], doc: ext(DOC, { stamp: 1 }), stampAt: [22, 29], dy: 1, shock: true },
      { dur: 380, l: READ.l, r: [24, -50, 7], doc: ext(DOC, { stamp: 2 }), happy: true }
    ],
    'cv-show': [
      { dur: 700, l: UP.l, r: UP.r, doc: { y: 0, h: 15, stamp: 2 }, happy: true },
      { dur: 220, l: UP.l, r: UP.r, doc: { y: 0, h: 15, stamp: 2 }, happy: true, hop: 2 },
      { dur: 600, l: UP.l, r: UP.r, doc: { y: 0, h: 15, stamp: 2 }, happy: true },
      { dur: 180, l: UP.l, r: UP.r, poof: [20, 8] },
      { dur: 300, happy: true }
    ],
    // the cursor whooshed past: ducks, arms over his head, then peeks up
    duck: [
      { dur: 60, shock: true, crouch: 4, l: [150, 240, 7], r: [150, 240, 7] },
      { dur: 420, shock: true, crouch: 9, l: [160, 262, 7], r: [160, 262, 7] },
      { dur: 220, crouch: 6, l: [150, 250, 7], r: [150, 250, 7], look: 'u' },
      { dur: 200, crouch: 2 },
      { dur: 240 }
    ],
    // the cursor sits on him: shy, rubs the back of his head
    shy: [
      { dur: 220, happy: true, r: [130, 225, 7], look: 'l' },
      { dur: 200, happy: true, r: [130, 240, 7], look: 'l' },
      { dur: 200, happy: true, r: [130, 225, 7], look: 'l' },
      { dur: 200, happy: true, r: [130, 240, 7], look: 'l' },
      { dur: 260, happy: true }
    ],

    // ════ Vista world ════
    // minimize: an Aero window frame wraps round him and genies down to nothing; restore is the reverse
    minimize: [mini(1, 180), mini(0.8, 70), mini(0.58, 70), mini(0.36, 70), mini(0.16, 70), { dur: 80, hidden: true }],
    restore: [{ dur: 60, hidden: true }, mini(0.16, 70), mini(0.36, 70), mini(0.58, 70), mini(0.8, 70), mini(1, 200), { dur: 200, happy: true }],

    // User Account Control: "Cancel or Allow?" pops up, he clicks it, it pops up again...
    uac: [
      sd({ dur: 120, legs: STAND, arms: [2, -2], uac: { s: 0 } }),
      sd({ dur: 500, legs: STAND, arms: [2, -2], uac: { s: 1 } }),
      sd({ dur: 400, legs: STAND, lean: 6, arms: [8, -2], uac: { s: 1 }, glint: true })
    ],
    'uac-click': [
      sd({ dur: 200, legs: STAND, lean: 4, arms: [[60, 80], -2], uac: { s: 1 } }),
      sd({ dur: 180, legs: STAND, lean: 6, hands: [[35, 31], null], uac: { s: 1 } }),
      sd({ dur: 140, legs: STAND, lean: 6, hands: [[36.5, 30.5], null], uac: { s: 1, press: true } }),
      sd({ dur: 110, legs: STAND, lean: 4, arms: [[60, 80], -2], uac: { s: 0 } }),
      sd({ dur: 240, legs: STAND, arms: [2, -2] })
    ],
    facepalm: [
      { dur: 200, uac: { s: 1 }, shock: true },
      { dur: 200, uac: { s: 1 }, r: [120, -40, 8] },
      { dur: 450, uac: { s: 1 }, r: [160, -100, 8], dy: 1 },
      { dur: 220, uac: { s: 1 }, r: [158, -94, 8], dy: 1, l: [10, 8, 8] },
      { dur: 220, uac: { s: 1 }, r: [160, -100, 8], dy: 1 },
      { dur: 220, uac: { s: 1 }, r: [158, -94, 8], dy: 1, l: [10, 8, 8] },
      { dur: 200, uac: { s: 1 }, r: [100, 40, 8] },
      { dur: 200, uac: { s: 1 } }
    ],

    // Windows Update: sits down to wait, nods off (Zzz), the bar finishes with a chime, he jolts awake
    'sit-down': [
      sd({ dur: 160, legs: STAND, lean: 10, arms: [10, 5], upd: { i: 0 } }),
      sd({ dur: 180, legs: [[60, -20, 0], [55, -25, 0]], lean: 25, arms: [30, 20], upd: { i: 1 } }),
      sd({ dur: 200, legs: [[85, -40, 0], [80, -45, 0]], lean: 20, hands: [null, [8, 69]], arms: [30, 0], upd: { i: 2 } }),
      seat({ dur: 200, lean: -12, hands: [[6, 69], [4, 69]], upd: { i: 3 } }),
      seat({ dur: 260, upd: { i: 4 } })
    ],
    'update-wait': range(10, function (i) {
      return seat({ dur: 140, upd: { i: i + 5 }, arms: i < 5 ? [40, 30] : [[40, 195], 30], glint: i === 3 });
    }),
    doze: range(12, function (i) {
      return seat({ dur: 160, lean: i % 6 < 3 ? 14 : 18, arms: [20, 10], upd: { i: i + 15 }, zzz: i });
    }),
    'update-done': [
      seat({ dur: 300, lean: 18, arms: [20, 10], upd: { done: true }, zzz: 4, sparks: [[60, 10, 2]] }),
      seat({ dur: 160, lean: -14, arms: [[150, 170], [140, 165]], upd: { done: true }, bang: [17, 26] }),
      seat({ dur: 260, lean: -6, arms: [[120, 140], [110, 135]], upd: { done: true }, bang: [17, 26] }),
      seat({ dur: 400, lean: 0, arms: [40, 30], upd: { done: true }, glint: true }),
      seat({ dur: 160, lean: 0, arms: [40, 30] })
    ],
    'stand-up': SITUP,

    // blue screen: the PC crashes, he recoils, smacks the monitor, it reboots into Vista
    bsod: [
      sd({ dur: 160, legs: STAND, pc: true, code: 23, screen: 'off', arms: [[48, 93], [48, 97]] }),
      sd({ dur: 260, legs: STAND, pc: true, screen: 'bsod', arms: [[48, 93], [48, 97]] }),
      sd({ dur: 200, legs: STAND, pc: true, screen: 'bsod', lean: -10, arms: [[150, 170], [140, 165]] }),
      sd({ dur: 700, legs: STAND, pc: true, screen: 'bsod', lean: -4, arms: [[40, 195], [10, 5]] }),
      sd({ dur: 160, legs: STAND, pc: true, screen: 'bsod', lean: 6, arms: [[150, 160], 5] }),
      sd({ dur: 110, legs: STAND, pc: true, screen: 'off', lean: 18, hands: [[41, 26], null], stars: [[43, 22]] }),
      sd({ dur: 160, legs: STAND, pc: true, screen: 'bsod', lean: 6, arms: [[150, 160], 5] }),
      sd({ dur: 110, legs: STAND, pc: true, screen: 'off', lean: 18, hands: [[41, 26], null], stars: [[44, 21], [41, 19]] }),
      sd({ dur: 300, legs: STAND, pc: true, screen: 'off', lean: 4, arms: [10, 5] }),
      sd({ dur: 220, legs: STAND, pc: true, screen: 'boot', code: 0, arms: [10, 5] }),
      sd({ dur: 220, legs: STAND, pc: true, screen: 'boot', code: 1, arms: [10, 5] }),
      sd({ dur: 220, legs: STAND, pc: true, screen: 'boot', code: 2, arms: [10, 5], glint: true }),
      sd({ dur: 220, legs: STAND, pc: true, screen: 'boot', code: 3, arms: [10, 5] }),
      sd({ dur: 500, legs: STAND, pc: true, screen: 'desk', arms: [10, 5] }),
      { dur: 450, happy: true, pc: true, screen: 'desk', r: [100, 150, 6] }
    ],

    // solitaire: shuffles a deck, then the winning card cascade bounces out both ways
    solitaire: range(6, function (i) {
      return { dur: 130, l: [20, -50, 6], r: [20, -50, 6], deck: i };
    }).concat(range(22, function (k) {
      return { dur: 90, happy: true, cards: k * 90, l: k < 3 ? [120, 150, 8] : UP.l, r: k < 3 ? [120, 150, 8] : UP.r, hop: k % 4 === 2 ? 1 : 0 };
    })).concat([
      { dur: 500, happy: true, cards: 21 * 90, l: UP.l, r: UP.r },
      { dur: 120, happy: true, l: [100, 140, 8], r: [100, 140, 8], sparks: [[-10, 50, 2], [50, 48, 2], [0, 64, 1], [44, 64, 1]] },
      { dur: 300, happy: true }
    ])
  };
  var ONCE = {
    conjure: 1, unconjure: 1, 'pc-start': 1, 'pc-stretch': 1, 'pushup-in': 1, 'pushup-out': 1,
    bonk: 1, getup: 1, 'glasses-on': 1, 'juggle-in': 1, fumble: 1, scoop: 1, yawn: 1,
    'glitch-out': 1, 'glitch-in': 1, 'holo-in': 1, hack: 1, 'holo-grant': 1, 'holo-out': 1, 'bug-in': 1, stomp: 1,
    'board-on': 1, 'board-off': 1, minimize: 1, restore: 1, uac: 1, 'uac-click': 1, facepalm: 1,
    'sit-down': 1, 'update-done': 1, 'stand-up': 1, bsod: 1, solitaire: 1,
    'dash-ready': 1, 'flash-out': 1, 'flash-in': 1, 'dash-stop': 1, split: 1, lag: 1,
    'fall-in': 1, 'fall-warp': 1, land: 1, crash: 1, 'power-up': 1, 'power-down': 1,
    found: 1, shocked: 1, 'cv-out': 1, 'cv-read': 1, 'cv-stamp': 1, 'cv-show': 1, duck: 1, shy: 1
  };

  function Painter(ctx) { this.c = ctx; this.ox = XO; this.oy = 0; }
  Painter.prototype.px = function (x, y, col) {
    x = Math.round(x + this.ox); y = Math.round(y + this.oy);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    this.c.fillStyle = col; this.c.fillRect(x, y, 1, 1);
  };
  Painter.prototype.rect = function (x0, y0, x1, y1, col) {
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) this.px(x, y, col);
  };
  Painter.prototype.map = function (rows, x0, y0, pal) {
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      var k = rows[y][x]; if (k !== '.' && pal[k]) this.px(x0 + x, y0 + y, pal[k]);
    }
  };
  // square brush of size sz dragged from a to b (pixel-perfect thick line)
  Painter.prototype.stroke = function (ax, ay, bx, by, sz, col) {
    var n = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2)), h = Math.floor(sz / 2);
    for (var i = 0; i <= n; i++) {
      var x = Math.round(ax + (bx - ax) * i / n), y = Math.round(ay + (by - ay) * i / n);
      this.rect(x - h, y - h, x - h + sz - 1, y - h + sz - 1, col);
    }
  };

  // offscreen layers for rotated parts
  var layers = {};
  function layer(name) {
    var l = layers[name];
    if (!l) { l = document.createElement('canvas'); l.width = W; l.height = H; l.ctx = l.getContext('2d', { willReadFrequently: true }); layers[name] = l; }
    l.ctx.clearRect(0, 0, W, H);
    return l;
  }
  // nearest-neighbour rotation (canvas coords) so tilted parts stay crisp pixel art
  function rotated(src, a, psx, psy, pdx, pdy) {
    var c = Math.cos(a * DEG), s = Math.sin(a * DEG), out = layer('rot');
    var sd = src.ctx.getImageData(0, 0, W, H).data, img = out.ctx.createImageData(W, H), d = img.data;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var dx = x + 0.5 - pdx, dy = y + 0.5 - pdy;
      var sx = Math.floor(dx * c + dy * s + psx), sy = Math.floor(-dx * s + dy * c + psy);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      var si = (sy * W + sx) * 4, di = (y * W + x) * 4;
      if (sd[si + 3]) { d[di] = sd[si]; d[di + 1] = sd[si + 1]; d[di + 2] = sd[si + 2]; d[di + 3] = sd[si + 3]; }
    }
    out.ctx.putImageData(img, 0, 0);
    return out;
  }
  function rotAbout(x, y, cx, cy, a) {
    var c = Math.cos(a * DEG), s = Math.sin(a * DEG), dx = x - cx, dy = y - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  }

  // ── props and effects (figure coords) ──
  function ball(p, x, y, kind) {
    x = Math.round(x); y = Math.round(y);
    var glow = kind === 'h' ? 'rgba(0,212,255,' : 'rgba(90,184,255,';
    p.rect(x - 3, y - 2, x + 3, y + 2, glow + '0.16)'); p.rect(x - 2, y - 3, x + 2, y + 3, glow + '0.16)');
    p.rect(x - 4, y - 1, x + 4, y + 1, glow + '0.08)'); p.rect(x - 1, y - 4, x + 1, y + 4, glow + '0.08)');
    p.map(kind === 'h' ? HEX : ORB, x - 2, y - 2, ICON);
  }
  function spark(p, x, y, s) {
    p.px(x, y, '#ffffff');
    for (var i = 1; i <= s; i++) {
      var c = i === s ? 'rgba(127,233,255,0.55)' : '#7fe9ff';
      p.px(x + i, y, c); p.px(x - i, y, c); p.px(x, y + i, c); p.px(x, y - i, c);
    }
  }
  function disc(p, cx, cy, r, col) {
    for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r) p.px(cx + x, cy + y, col);
  }
  function poof(p, x, y) {
    [[0, 0, 7], [-6, 3, 5], [6, 4, 5], [-2, -5, 5], [4, -4, 4]].forEach(function (c) { disc(p, x + c[0], y + c[1], c[2], 'rgba(214,236,255,0.32)'); });
  }
  function star(p, x, y) {
    p.px(x, y, '#fff3b0'); p.px(x - 1, y, '#ffd166'); p.px(x + 1, y, '#ffd166'); p.px(x, y - 1, '#ffd166'); p.px(x, y + 1, '#ffd166');
  }
  function drawPC(p, code, cursorOff, screen) {
    // standing desk
    p.rect(31, 38, 58, 38, '#6b5238'); p.rect(31, 39, 58, 39, '#4a3826');
    p.rect(33, 40, 34, 71, '#3d2f20'); p.rect(55, 40, 56, 71, '#3d2f20'); p.rect(35, 56, 54, 56, '#3d2f20');
    // keyboard
    p.rect(33, 36, 41, 37, '#8a93a6'); for (var x = 34; x <= 40; x += 2) p.px(x, 36, '#c3cad8');
    // monitor (screen turned toward the viewer), with a soft glow
    p.rect(40, 16, 60, 35, screen === 'bsod' ? 'rgba(40,80,255,0.12)' : 'rgba(0,212,255,0.07)');
    p.rect(42, 18, 58, 33, '#262b36'); p.rect(43, 19, 57, 32, '#071420');
    p.rect(49, 34, 51, 36, '#262b36'); p.rect(46, 37, 54, 37, '#262b36');
    if (screen) { drawScreen(p, screen, code); return; }
    var j = code == null ? 23 : code, total = Math.floor(j / 2) + 1, first = Math.max(0, total - 6);
    for (var r = 0; r < Math.min(6, total); r++) {
      var li = first + r, ln = CODE[li % CODE.length], len = ln[1], y = 20 + 2 * r;
      if (li === total - 1 && j % 2 === 0) len = Math.ceil(len / 2);
      p.rect(44 + ln[0], y, 44 + ln[0] + len - 1, y, CODECOL[ln[2]]);
      if (li === total - 1 && code != null && !cursorOff) p.px(Math.min(56, 45 + ln[0] + len), y, '#eaf6ff');
    }
  }

  // other things the PC screen can show (Vista world)
  function drawScreen(p, screen, k) {
    if (screen === 'off') return;
    if (screen === 'bsod') {
      p.rect(43, 19, 57, 32, '#1d36b8');
      [12, 7, 13, 5, 10, 3].forEach(function (n, r) { p.rect(44, 20 + 2 * r, 44 + n, 20 + 2 * r, r === 0 ? '#ffffff' : '#c9d4ff'); });
      return;
    }
    if (screen === 'boot') {
      // black, a little four-colour orb, the green bar sliding along
      var cols = ['#e2513c', '#7cbb3a', '#3a8ee6', '#f5c21b'];
      p.rect(49, 22, 50, 23, cols[0]); p.rect(51, 22, 52, 23, cols[1]); p.rect(49, 24, 50, 25, cols[2]); p.rect(51, 24, 52, 25, cols[3]);
      p.rect(46, 29, 54, 29, '#1e2a20');
      var s = 46 + ((k || 0) * 2) % 9; p.rect(s, 29, Math.min(54, s + 2), 29, '#4fd14f');
      return;
    }
    // desktop: aurora wallpaper, taskbar, orb
    var rows = ['#0d4f5c', '#126a6e', '#1a8a7a', '#2aa37e', '#1c7f8e', '#14607e', '#0f4c72', '#0b3c63', '#0a335a', '#0a2e52', '#0a2a4c', '#0a2646'];
    rows.forEach(function (c, i) { p.rect(43, 19 + i, 57, 19 + i, c); });
    p.rect(43, 31, 57, 32, '#0b0f17'); p.px(44, 31, '#5ab8ff'); p.px(45, 32, '#5ab8ff'); p.px(44, 32, '#7fdb8a');
    p.rect(46, 22, 47, 23, '#ffffff'); p.rect(46, 25, 47, 26, '#ffd166');
  }

  // floating hologram panel in front of him (Cyber world)
  function drawHolo(p, h) {
    var x0 = 31, x1 = 57, cy = 26, half = Math.round(12 * h.o), y0 = cy - half, y1 = cy + half;
    var ok = h.mode === 'grant', edge = ok ? '#7fdb8a' : '#00d4ff', soft = ok ? 'rgba(127,219,138,' : 'rgba(0,212,255,';
    // faint beam from his hand
    if (half < 3) { p.rect(x0, cy, x1, cy, edge); p.rect(x0 + 2, cy - 1, x1 - 2, cy + 1, soft + '0.25)'); return; }
    p.rect(x0, y0, x1, y1, soft + '0.10)');
    for (var y = y0 + 1; y < y1; y += 2) p.rect(x0 + 1, y, x1 - 1, y, soft + '0.05)');
    p.rect(x0, y0, x1, y0, soft + '0.5)'); p.rect(x0, y1, x1, y1, soft + '0.5)');
    p.rect(x0, y0, x0, y1, soft + '0.5)'); p.rect(x1, y0, x1, y1, soft + '0.5)');
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (c) {
      p.px(c[0], c[1], edge); p.px(c[0] + c[2], c[1], edge); p.px(c[0] + 2 * c[2], c[1], edge);
      p.px(c[0], c[1] + c[3], edge); p.px(c[0], c[1] + 2 * c[3], edge);
    });
    if (h.o < 1) return;
    if (ok) {
      // big tick and an ACCESS GRANTED bar
      [[39, 23], [40, 24], [41, 25], [42, 26], [43, 25], [44, 24], [45, 23], [46, 22], [47, 21], [48, 20], [49, 19]].forEach(function (q) {
        p.rect(q[0], q[1], q[0] + 1, q[1] + 1, '#7fdb8a');
      });
      p.rect(35, 31, 53, 33, 'rgba(127,219,138,0.35)');
      for (var x = 36; x <= 52; x += 2) if (x !== 42 && x !== 44) p.px(x, 32, '#eaffef');
      return;
    }
    var j = h.j || 0;
    for (var c = 0; c < 8; c++) {
      var cx = x0 + 2 + c * 3, head = (j * 2 + c * 7 + (c % 3) * 5) % 26;
      for (var t = 0; t < 5; t++) {
        var yy = y0 + 1 + head - t;
        if (yy > y0 && yy < y1 - 3) p.px(cx, yy, t === 0 ? '#eaffff' : 'rgba(0,255,170,' + (0.75 - t * 0.14) + ')');
      }
    }
    // upload bar filling up underneath
    p.rect(x0 + 2, y1 - 2, x1 - 2, y1 - 2, 'rgba(0,212,255,0.2)');
    p.rect(x0 + 2, y1 - 2, x0 + 2 + Math.round(22 * j / 21), y1 - 2, '#00d4ff');
  }

  // a little green bug on the floor, walking toward -x
  function drawBug(p, b) {
    var x = Math.round(b.x), k = b.k % 2;
    p.rect(x + 1, 66, x + 4, 66, '#2e7d4f');
    p.rect(x, 67, x + 5, 68, '#4fbf6a'); p.px(x + 2, 67, '#2e7d4f'); p.px(x + 3, 68, '#2e7d4f');
    p.px(x - 1, 67, '#1f3b2a'); p.px(x - 1, 68, '#1f3b2a'); p.px(x - 2, 66, '#9fffb8');
    [0, 2, 4].forEach(function (d) { p.px(x + d + k, 69, '#1f3b2a'); });
  }
  function drawSplat(p, s) {
    var g = s === 2 ? 'rgba(79,191,106,0.45)' : '#4fbf6a';
    [[20, 70], [22, 71], [29, 71], [31, 70], [25, 71], [27, 71], [18, 71], [33, 71]].forEach(function (q, i) {
      if (s === 0 || i < 6) p.px(q[0] + (s === 0 ? (i % 2 ? 1 : -1) : 0), q[1], g);
    });
    if (s === 0) { p.px(19, 68, g); p.px(34, 68, g); p.px(24, 66, g); }
  }
  // "fixed" tick floating where the bug was
  function drawTick(p) { [[24, 61], [25, 62], [26, 61], [27, 60], [28, 59]].forEach(function (q) { p.px(q[0], q[1], '#7fdb8a'); }); }
  function drawBang(p, b) { p.rect(b[0], b[1], b[0] + 1, b[1] + 4, '#ffd166'); p.rect(b[0], b[1] + 6, b[0] + 1, b[1] + 7, '#ffd166'); }

  function drawBoard(p, b) {
    var y = 72 - b.lift, deck = b.fade ? 'rgba(42,51,70,0.5)' : '#2a3346';
    p.rect(5, y, 33, y, deck); p.px(34, y - 1, deck); p.px(4, y - 1, deck);
    p.rect(6, y + 1, 32, y + 1, b.fade ? 'rgba(0,212,255,0.3)' : '#00d4ff');
    if (b.lift > 1) {
      // thrusters
      [10, 27].forEach(function (tx, i) {
        var len = b.lift - 1 + ((b.k + i) % 2);
        for (var t = 0; t < len; t++) p.rect(tx, y + 2 + t, tx + 1, y + 2 + t, t === 0 ? '#eaffff' : t < 2 ? '#7fe9ff' : 'rgba(0,212,255,0.45)');
      });
    }
  }

  // Aero glass dialog frame (Vista world)
  function glassWin(p, x0, y0, x1, y1) {
    p.rect(x0 + 1, y0, x1 - 1, y1, 'rgba(150,195,235,0.6)'); p.rect(x0, y0 + 1, x1, y1 - 1, 'rgba(150,195,235,0.6)');
    p.rect(x0 + 1, y0 + 1, x1 - 1, y0 + 2, 'rgba(230,242,255,0.55)');
    p.rect(x1 - 6, y0 + 1, x1 - 2, y0 + 3, '#c9473a'); p.px(x1 - 4, y0 + 2, '#ffe9e4');
    p.rect(x0 + 2, y0 + 4, x1 - 2, y1 - 2, '#f5f8fc');
  }
  var SHIELD = ['bbyy', 'bbyy', 'yybb', '.yb.'];
  function drawUAC(p, u) {
    if (!u.s) { glassWin(p, 40, 18, 50, 26); return; }
    var x0 = 30, y0 = 10, x1 = 60, y1 = 34;
    glassWin(p, x0, y0, x1, y1);
    p.rect(x0 + 3, y0 + 1, x0 + 12, y0 + 1, '#1d3557');
    p.rect(x0 + 2, y0 + 4, x1 - 2, y0 + 7, '#ffd76e');                // "unidentified program" band
    p.map(SHIELD, x0 + 4, y0 + 5, { b: '#2f6fd6', y: '#f2c230' });
    p.rect(x0 + 10, y0 + 5, x1 - 5, y0 + 5, '#5a4310');
    p.rect(x0 + 4, y0 + 11, x1 - 5, y0 + 11, '#3b4a5e'); p.rect(x0 + 4, y0 + 13, x1 - 9, y0 + 13, '#7a879a');
    p.rect(x0 + 4, y0 + 15, x1 - 12, y0 + 15, '#7a879a');
    // Allow / Cancel
    [[33, !!u.press], [44, false]].forEach(function (bt) {
      var bx = bt[0];
      p.rect(bx, 28, bx + 8, 31, '#7c8ca3');
      p.rect(bx + 1, 29, bx + 7, 30, bt[1] ? '#9fd0ff' : '#e8edf3');
      p.rect(bx + 2, 29, bx + 6, 29, bt[1] ? '#1d4d80' : '#56657a');
    });
  }
  function drawUpdate(p, u) {
    var x0 = 30, y0 = 4, x1 = 66, y1 = 26;
    glassWin(p, x0, y0, x1, y1);
    p.rect(x0 + 3, y0 + 1, x0 + 14, y0 + 1, '#1d3557');
    // flag icon
    p.rect(x0 + 4, y0 + 6, x0 + 5, y0 + 7, '#e2513c'); p.rect(x0 + 6, y0 + 6, x0 + 7, y0 + 7, '#7cbb3a');
    p.rect(x0 + 4, y0 + 8, x0 + 5, y0 + 9, '#3a8ee6'); p.rect(x0 + 6, y0 + 8, x0 + 7, y0 + 9, '#f5c21b');
    p.rect(x0 + 10, y0 + 6, x1 - 6, y0 + 6, '#3b4a5e'); p.rect(x0 + 10, y0 + 9, x1 - 12, y0 + 9, '#7a879a');
    var bx0 = x0 + 4, bx1 = x1 - 4, by = y1 - 6;
    p.rect(bx0, by, bx1, by + 3, '#8a96a8'); p.rect(bx0 + 1, by + 1, bx1 - 1, by + 2, '#e9edf2');
    if (u.done) {
      p.rect(bx0 + 1, by + 1, bx1 - 1, by + 2, '#38b44a'); p.rect(bx0 + 1, by + 1, bx1 - 1, by + 1, '#7ee08a');
      [[x1 - 9, y0 + 8], [x1 - 8, y0 + 9], [x1 - 7, y0 + 8], [x1 - 6, y0 + 7], [x1 - 5, y0 + 6]].forEach(function (q) { p.px(q[0], q[1], '#38b44a'); });
      return;
    }
    // the endless marquee
    var span = bx1 - bx0 - 1, s = bx0 + 1 + ((u.i || 0) * 3) % (span + 8) - 8;
    for (var x = Math.max(bx0 + 1, s); x <= Math.min(bx1 - 1, s + 7); x++) { p.px(x, by + 1, '#7ee08a'); p.px(x, by + 2, '#38b44a'); }
  }
  // Zzz drifting up and back from his head
  var ZZ = [['###', '.#.', '###'], ['####', '..#.', '.#..', '####']];
  function drawZzz(p, i) {
    for (var n = 0; n < 2; n++) {
      var t = ((i + n * 6) % 12) / 12, big = t > 0.5 ? 1 : 0;
      p.map(ZZ[big], Math.round(16 - 8 * t), Math.round(32 - 16 * t), { '#': t > 0.8 ? 'rgba(230,240,255,0.5)' : '#e6f0ff' });
    }
  }

  // solitaire
  var SUITS = ['#d22c2c', '#1b1b1b', '#d22c2c', '#1b1b1b'];
  function card(p, x, y, k) {
    x = Math.round(x); y = Math.round(y);
    p.rect(x, y, x + 4, y + 6, '#5d6b80'); p.rect(x + 1, y + 1, x + 3, y + 5, '#ffffff');
    p.px(x + 1, y + 1, SUITS[k]); p.px(x + 2, y + 3, SUITS[k]); p.px(x + 2, y + 4, SUITS[k]);
  }
  // each card leaves a trail of copies as it bounces away, like the win screen
  var THROWS = [[0, 1.4, -2.0, 0], [160, -1.3, -2.3, 1], [330, 1.05, -2.7, 2], [500, -1.6, -1.7, 3], [700, 1.7, -1.4, 1], [860, -1.05, -2.6, 0]];
  function drawCascade(p, t) {
    THROWS.forEach(function (c) {
      var ticks = Math.floor((t - c[0]) / 40); if (ticks < 0) return;
      var x = c[1] > 0 ? 29 : 6, y = 34, vx = c[1], vy = c[2];
      for (var n = 0; n <= ticks; n++) {
        if (x < -30 || x > 64) break;
        if (n % 2 === 0) card(p, x - 2, y - 3, c[3]);
        x += vx; vy += 0.32; y += vy;
        if (y > 66) { y = 66; vy *= -0.72; }
      }
    });
  }
  function drawDeck(p, i) {
    p.rect(16, 40, 22, 43, '#5d6b80'); p.rect(17, 40, 21, 42, '#ffffff'); p.rect(17, 43, 21, 43, '#c9d1dc');
    if (i % 3 !== 2) { var x = i % 3 ? 20 : 14, y = i % 3 ? 33 : 35; card(p, x, y, i % 4); }
  }
  // Aero window frame wrapped round him (for minimize / restore)
  function drawGlassFrame(p) {
    p.rect(7, 10, 32, 73, 'rgba(170,210,245,0.13)');
    p.rect(7, 10, 32, 13, 'rgba(200,228,255,0.45)');
    p.rect(7, 10, 32, 10, 'rgba(235,245,255,0.7)'); p.rect(7, 73, 32, 73, 'rgba(170,210,245,0.6)');
    p.rect(7, 11, 7, 72, 'rgba(170,210,245,0.6)'); p.rect(32, 11, 32, 72, 'rgba(170,210,245,0.6)');
    p.rect(27, 11, 31, 12, '#c9473a');
  }

  // props behind him / in front of him (figure coords, no body offset)
  function propsBack(ctx, f) {
    var p = new Painter(ctx);
    if (f.glass) drawGlassFrame(p);
    if (f.aura) drawAura(p, f.aura);
    if (f.pc) drawPC(p, f.code, f.cursorOff, f.screen);
    if (f.holo) drawHolo(p, f.holo);
    if (f.uac) drawUAC(p, f.uac);
    if (f.upd) drawUpdate(p, f.upd);
    if (f.board) drawBoard(p, f.board);
    if (f.wind) drawWind(p, f.wind);
    if (f.bug) drawBug(p, f.bug);
    if (f.splat != null) drawSplat(p, f.splat);
  }
  // speed lines trailing behind him (he faces +x; mirroring flips them)
  function drawStreak(p, n) {
    [[22, '#7fe9ff'], [30, 'rgba(255,40,170,0.7)'], [38, '#7fe9ff'], [47, 'rgba(0,212,255,0.6)'], [56, 'rgba(255,40,170,0.6)'], [64, '#7fe9ff']].forEach(function (l, i) {
      var len = Math.round(n * (1.4 + (i % 3) * 0.5)), x1 = 13 - (i % 2) * 3;
      p.rect(x1 - len, l[0], x1, l[0], l[1]);
    });
  }
  // buffering ring over his head
  function drawSpin(p, k) {
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, d = (k - i + 16) % 8;
      p.px(Math.round(19.5 + 4 * Math.cos(a) - 0.5), Math.round(8 + 4 * Math.sin(a)), d === 0 ? '#ffffff' : d === 1 ? '#7fe9ff' : d === 2 ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.18)');
    }
  }
  function drawDust(p, n) {
    var a = n === 3 ? '0.15' : n === 2 ? '0.28' : '0.4';
    disc(p, 8 - n * 3, 69, 1 + n, 'rgba(214,236,255,' + a + ')');
    disc(p, 14 - n * 2, 70, n, 'rgba(214,236,255,' + a + ')');
  }
  // power-up aura: a flame-shaped glow round him, gold inside, cyan / magenta split at the edges,
  // flickering row by row, with tongues licking up past his head
  function drawAura(p, a) {
    var lv = Math.min(1, a.lv), top = Math.round(6 + (1 - lv) * 30), cx = 19.5;
    for (var y = top; y <= 72; y++) {
      var t = (y - top) / (72 - top);
      var hw = (3 + 15 * Math.sqrt(t)) * (0.45 + lv * 0.55) + (hsh(y * 3.7 + a.k * 11) - 0.5) * 3 * lv;
      if (t > 0.86) hw *= 1 - (t - 0.86) * 2.2;   // tucks in at his feet
      var off = hsh(Math.floor(y / 3) * 5.3 + a.k) < 0.12 ? (hsh(y + a.k) < 0.5 ? -2 : 2) : 0;   // glitch slips
      var l = Math.round(cx - hw) + off, r = Math.round(cx + hw) + off;
      p.rect(l, y, r, y, 'rgba(255,214,74,' + (0.08 + 0.14 * lv).toFixed(2) + ')');
      p.px(l, y, 'rgba(255,240,160,' + (0.6 * lv).toFixed(2) + ')'); p.px(r, y, 'rgba(255,240,160,' + (0.6 * lv).toFixed(2) + ')');
      p.px(l - 1, y, 'rgba(0,230,255,' + (0.55 * lv).toFixed(2) + ')'); p.px(r + 1, y, 'rgba(255,40,170,' + (0.55 * lv).toFixed(2) + ')');
    }
    for (var i = 0; i < 5; i++) {
      var fx = Math.round(cx - 12 + i * 6 + (hsh(i + a.k * 1.7) - 0.5) * 4), fh = Math.round((3 + hsh(i * 5.1 + a.k * 2.3) * 9) * lv);
      p.rect(fx, top - fh, fx, top + 4, 'rgba(255,226,120,' + (0.5 * lv).toFixed(2) + ')');
      p.px(fx - 1, top - fh + 2, 'rgba(0,230,255,' + (0.4 * lv).toFixed(2) + ')');
    }
  }
  // energy motes drifting up round him
  function drawMotes(p, k) {
    for (var i = 0; i < 7; i++) {
      var x = Math.round(19.5 + (hsh(i * 9.1) - 0.5) * 40), y = 72 - ((k * 6 + i * 23) % 64);
      p.px(x, y, i % 3 === 0 ? '#7fe9ff' : i % 3 === 1 ? 'rgba(255,40,170,0.85)' : '#ffe27a');
    }
  }
  // a little lightning crackle at the edge of the aura
  function drawBolt(p, k) {
    var side = hsh(k * 3.3) < 0.5 ? -1 : 1, x = 19.5 + side * (10 + hsh(k) * 6), y = 26 + hsh(k * 7.7) * 30;
    for (var i = 0; i < 5; i++) {
      var nx = x + side * (hsh(k + i * 2.1) < 0.5 ? -2 : 2), ny = y - 3;
      p.stroke(x, y, nx, ny, 1, i % 2 ? '#ffffff' : '#7fe9ff');
      x = nx; y = ny;
    }
  }
  // spiky glowing hair: gold with a pale highlight, edges split cyan / magenta, now and then all cyan
  var SPIKES = [[16, 19, 8, 10, 2], [17.5, 17, 11, 4, 2.5], [19.5, 16, 18.5, 0, 3], [21.5, 17, 27, 3, 2.5], [23, 19, 31, 10, 2]];   // base x, y, tip x, y, half width
  function drawSpikes(p, sp) {
    var cyan = sp.k % 5 === 3, base = cyan ? '#7fe9ff' : '#ffd84a', hi = cyan ? '#e6fdff' : '#fff3b0', lv = sp.lv;
    p.rect(16, 16, 23, 18, base); p.rect(15, 17, 24, 18, base); p.rect(17, 16, 21, 16, hi);
    SPIKES.forEach(function (q, i) {
      var tx = q[0] + (q[2] - q[0]) * lv, ty = q[1] + (q[3] - q[1]) * lv - (hsh(i + sp.k) < 0.3 ? 1 : 0);
      var n = Math.ceil(Math.hypot(tx - q[0], ty - q[1]) * 1.5);
      for (var j = 0; j <= n; j++) {
        var t = j / n, x = q[0] + (tx - q[0]) * t, y = Math.round(q[1] + (ty - q[1]) * t), w = q[4] * (1 - t);
        var l = Math.round(x - w), r = Math.round(x + w);
        p.rect(l, y, r, y, base);
        p.px(l - 1, y, 'rgba(0,230,255,0.7)'); p.px(r + 1, y, 'rgba(255,40,170,0.65)');
        if (t < 0.7) p.px(l, y, hi);
      }
    });
  }
  // the CV: cream paper with a blue header and grey text lines; stamp 1 = just slammed (ink spatter), 2 = HIRED
  var FONT = {
    H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    E: ['###', '#..', '##.', '#..', '###'], D: ['##.', '#.#', '#.#', '#.#', '##.']
  };
  function drawDoc(p, d) {
    var x0 = 8, x1 = 32, y0 = d.y, y1 = d.y + d.h;
    p.rect(x0, y0, x1, y1, '#f4efe2'); p.rect(x0, y1, x1, y1, '#d8d0bc'); p.rect(x1, y0, x1, y1, '#d8d0bc');
    if (d.h >= 6) p.rect(x0 + 2, y0 + 2, x0 + 9, y0 + 2, '#4a90d9');
    for (var y = y0 + 5, k = 0; y < y1 - 1; y += 2, k++) p.rect(x0 + 2, y, x1 - 3 - (k * 7) % 9, y, '#a9b0bf');
    if (d.stamp) {
      var by = Math.max(y0 + 2, y1 - 11), red = d.stamp === 1 ? '#ff3b3b' : '#d22c2c';
      p.rect(x0 + 1, by, x1 - 1, by + 8, 'rgba(244,239,226,0.85)');
      p.rect(x0 + 1, by, x1 - 1, by, red); p.rect(x0 + 1, by + 8, x1 - 1, by + 8, red);
      p.rect(x0 + 1, by, x0 + 1, by + 8, red); p.rect(x1 - 1, by, x1 - 1, by + 8, red);
      'HIRED'.split('').forEach(function (ch, i) { p.map(FONT[ch], x0 + 3 + i * 4, by + 2, { '#': red }); });
      if (d.stamp === 1) [[x0 - 1, by - 2], [x1 + 1, by + 1], [x0 + 4, by + 10], [x1 - 3, by - 2], [x1 + 2, by + 7]].forEach(function (q) { p.px(q[0], q[1], red); });
    }
    if (d.y > 20) { p.rect(x0 - 1, y0 + 6, x0, y0 + 7, C.S); p.rect(x1, y0 + 6, x1 + 1, y0 + 7, C.S); }   // his fingers on the edges
  }
  // rubber stamp (held by its handle): knob, handle, red base
  function drawStamp(p, x, y) {
    p.rect(x - 1, y, x + 1, y + 1, '#8a5a2b'); p.rect(x, y + 2, x, y + 4, '#8a5a2b');
    p.rect(x - 3, y + 5, x + 3, y + 6, '#6b4220'); p.rect(x - 3, y + 7, x + 3, y + 7, '#d22c2c');
    p.rect(x - 1, y + 2, x + 1, y + 3, C.S);   // his hand round it
  }
  // air rushing up past him while he falls (lines over his body only above the head)
  function drawWind(p, w) {
    var cols = ['rgba(127,233,255,0.75)', 'rgba(255,40,170,0.55)', 'rgba(0,212,255,0.5)'];
    [[3, 0], [8, 23], [31, 11], [36, 37], [15, 52], [24, 5], [-2, 61], [41, 44]].forEach(function (l, i) {
      var len = (w.fast ? 8 : 4) + (i % 3) * 2, y = 70 - ((w.k * (w.fast ? 11 : 7) + l[1]) % 80);
      if (l[0] > 10 && l[0] < 29 && y + len > 14) return;
      if (y + len < 0 || y > 73) return;
      p.rect(l[0], Math.max(0, y), l[0], Math.min(73, y + len), cols[i % 3]);
    });
  }
  // hitting the floor: shockwave along the floor, dust both sides, a few bits flying
  function drawImpact(p, n, cx) {
    var a = ['0.6', '0.38', '0.18'][n - 1], r = 3 + n * 5;
    p.rect(Math.round(cx - r - 4), 72, Math.round(cx + r + 4), 72, 'rgba(0,212,255,' + a + ')');
    disc(p, cx - r, 69 - n, 1 + n, 'rgba(214,236,255,' + a + ')');
    disc(p, cx + r, 69 - n, 1 + n, 'rgba(214,236,255,' + a + ')');
    p.px(Math.round(cx - r - 3), 64 - n * 3, '#7fe9ff'); p.px(Math.round(cx + r + 3), 63 - n * 3, 'rgba(255,40,170,0.85)');
    if (n < 3) { p.px(Math.round(cx - r), 60 - n * 4, 'rgba(255,40,170,0.7)'); p.px(Math.round(cx + r + 1), 61 - n * 4, '#7fe9ff'); }
  }
  function propsFront(ctx, f) {
    var p = new Painter(ctx);
    if (f.impact) drawImpact(p, f.impact, 19.5 + (f.dx || 0));
    if (f.doc) drawDoc(p, f.doc);
    if (f.stampAt) drawStamp(p, f.stampAt[0], f.stampAt[1]);
    if (f.motes != null) drawMotes(p, f.motes);
    if (f.bolt != null) drawBolt(p, f.bolt);
    if (f.spin != null) drawSpin(p, f.spin);
    if (f.dust) drawDust(p, f.dust);
    if (f.fixed) drawTick(p);
    if (f.bang) drawBang(p, f.bang);
    if (f.zzz != null) drawZzz(p, f.zzz);
    if (f.deck != null) drawDeck(p, f.deck);
    if (f.cards != null) drawCascade(p, f.cards);
  }

  // glitch: scan bands slip sideways, pixels drop out, cyan/magenta ghosts either side
  function hsh(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function glitchFx(ctx, g) {
    var s = ctx.getImageData(0, 0, W, H).data, out = ctx.createImageData(W, H), d = out.data, base = new Uint8ClampedArray(W * H * 4);
    for (var y = 0; y < H; y++) {
      var b = Math.floor(y / g.band), off = hsh(b + g.seed * 3.1) < 0.55 ? Math.round((hsh(b * 7.3 + g.seed) * 2 - 1) * g.amp) : 0;
      for (var x = 0; x < W; x++) {
        var sx = x - off; if (sx < 0 || sx >= W) continue;
        var si = (y * W + sx) * 4; if (!s[si + 3]) continue;
        if (g.keep < 1 && hsh(x * 13.1 + y * 7.7 + g.seed) > g.keep) continue;
        var di = (y * W + x) * 4; base[di] = s[si]; base[di + 1] = s[si + 1]; base[di + 2] = s[si + 2]; base[di + 3] = s[si + 3];
      }
    }
    function put(x, y, r, gg, bb) { if (x < 0 || x >= W) return; var i = (y * W + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 120; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var i = (y * W + x) * 4; if (!base[i + 3]) continue;
      put(x - g.split, y, 0, 230, 255); put(x + g.split, y, 255, 40, 170);
    }
    for (i = 0; i < d.length; i += 4) if (base[i + 3]) { d[i] = base[i]; d[i + 1] = base[i + 1]; d[i + 2] = base[i + 2]; d[i + 3] = base[i + 3]; }
    ctx.putImageData(out, 0, 0);
  }
  // a frame plus its whole-sprite effects
  function render(ctx, f, worlds) {
    if (f.hidden) {
      ctx.clearRect(0, 0, W, H);
      if (f.line) { var p = new Painter(ctx); p.rect(f.line[0], 45, f.line[1], 45, '#7fe9ff'); p.rect(f.line[0] + 2, 44, f.line[1] - 2, 46, 'rgba(0,212,255,0.3)'); }
      if (f.streak) drawStreak(new Painter(ctx), f.streak);
      return;
    }
    if (f.scale != null && f.scale !== 1) {
      var l = layer('scale'); drawFrame(l.ctx, f, worlds);
      ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
      var s = f.scale, px = 19.5 + XO, py = 73;
      ctx.drawImage(l, 0, 0, W, H, Math.round(px - px * s), Math.round(py - py * s), Math.round(W * s), Math.round(H * s));
      return;
    }
    drawFrame(ctx, f, worlds);
    if (f.glitch) glitchFx(ctx, f.glitch);
    if (f.streak) drawStreak(new Painter(ctx), f.streak);
    if (f.tint) {
      // flat colour ghost, keeping the shape and a little shading from the original brightness
      var img = ctx.getImageData(0, 0, W, H), d = img.data, t = f.tint;
      for (var i = 0; i < d.length; i += 4) if (d[i + 3]) {
        var lum = (d[i] + d[i + 1] + d[i + 2]) / 765, k = 0.55 + lum * 0.6;
        d[i] = t[0] * k; d[i + 1] = t[1] * k; d[i + 2] = t[2] * k; d[i + 3] = d[i + 3] * 0.75;
      }
      ctx.putImageData(img, 0, 0);
    }
  }

  // ── side profile (facing right) ──
  function legAt(a) {
    var kx = 19.5 + Math.sin(a[0] * DEG) * 10, ky = 47 + Math.cos(a[0] * DEG) * 10;
    return { kx: kx, ky: ky, ax: kx + Math.sin(a[1] * DEG) * 11, ay: ky + Math.cos(a[1] * DEG) * 11, foot: a[2] };
  }
  function legsOf(f) { return f.legs || [STEP[f.ph], STEP[(f.ph + 4) % 8]]; }
  // drop the whole body so the lower foot (or knee, when kneeling) sits on the ground at y68
  function plantOy(f) {
    if (f.oy != null) return f.oy;
    var L = legsOf(f);
    return Math.round(68 - Math.max(legAt(L[0]).ay, legAt(L[1]).ay)) - (f.lift || 0);
  }
  // arm: number = swing angle (elbow bends by itself) or [upper, forearm] angles
  function arm(p, a, col, hand) {
    var u = a.length ? a[0] : a, v = a.length ? a[1] : u + 8 + Math.max(0, u) * 0.6;
    var ex = 19.5 + Math.sin(u * DEG) * 9, ey = 31 + Math.cos(u * DEG) * 9;
    var wx = ex + Math.sin(v * DEG) * 8, wy = ey + Math.cos(v * DEG) * 8;
    p.stroke(19.5, 31, ex, ey, 3, col);
    p.stroke(ex, ey, wx, wy, 3, col);
    p.stroke(wx, wy, wx + Math.sin(v * DEG) * 2, wy + Math.cos(v * DEG) * 2, 3, hand);
  }
  // arm from shoulder to a planted hand; bends at the elbow (toward the back) when the reach is short
  function reach(p, sx, sy, hx, hy, col, hand) {
    var dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy), L = 8.5;
    if (d >= 2 * L) {
      hx = sx + dx * 2 * L / d; hy = sy + dy * 2 * L / d;
      p.stroke(sx, sy, hx, hy, 3, col);
    } else {
      var m = Math.sqrt(L * L - d * d / 4), px = -dy / d, py = dx / d;
      if (px > 0) { px = -px; py = -py; }
      var ex = sx + dx / 2 + px * m, ey = sy + dy / 2 + py * m;
      p.stroke(sx, sy, ex, ey, 3, col); p.stroke(ex, ey, hx, hy, 3, col);
    }
    p.rect(Math.round(hx) - 1, Math.round(hy) - 1, Math.round(hx) + 1, Math.round(hy) + 1, hand);
  }
  function leg(p, L, trouser, shoe, shine) {
    p.stroke(19.5, 47, L.kx, L.ky, 5, trouser);
    p.stroke(L.kx, L.ky, L.ax, L.ay, 4, trouser);
    var dx = Math.cos(L.foot * DEG), dy = -Math.sin(L.foot * DEG);   // along the foot
    var nx = -dy, ny = dx;                                           // down through the sole
    var hx = L.ax - 1.5 * dx, hy = L.ay + 1 - 1.5 * dy, tx = L.ax + 4.5 * dx, ty = L.ay + 1 + 4.5 * dy;
    p.stroke(hx, hy, tx, ty, 3, shoe);
    p.stroke(hx + 2 * nx, hy + 2 * ny, tx + 2 * nx, ty + 2 * ny, 1, C.R);
    if (shine) p.px(Math.round(tx - dx - nx), Math.round(ty - dy - ny), shine);
  }
  function sideArms(f) { var L = legsOf(f); return f.arms || [-0.9 * L[0][0], -0.9 * L[1][0]]; }
  function sideLegs(p, f) {
    var L = legsOf(f);
    leg(p, legAt(L[1]), C.n, C.Q);
    leg(p, legAt(L[0]), C.N, C.O, C.o);
    p.rect(17, 44, 22, 47, C.N);               // seat of the trousers
  }
  // torso in profile: jacket, plum shirt at the open front, lapel, pocket, belt; then neck, head, arms
  function sideUpper(p, f, skipNear, skipFar) {
    var arms = sideArms(f);
    if (!skipFar) arm(p, arms[1], C.j, C.s);
    p.rect(17, 28, 22, 28, C.J); p.rect(16, 29, 23, 44, C.J);
    p.rect(16, 29, 16, 44, C.j);
    p.rect(22, 29, 23, 40, C.P); p.rect(22, 29, 22, 40, C.p);
    p.rect(21, 29, 21, 35, C.L);
    p.rect(18, 39, 20, 39, C.L);
    p.rect(21, 41, 23, 41, C.b); p.px(23, 41, C.k);
    p.rect(18, 27, 20, 27, C.s);
    var head = SIDE_HEAD.slice(), r;
    if (f.noglass) for (r in SIDE_NOGLASS) head[r] = SIDE_NOGLASS[r];
    else if (f.glint) for (r in SIDE_GLINT) head[r] = SIDE_GLINT[r];
    p.map(head, 14, 16, C);
    if (!skipNear) arm(p, arms[0], C.J, C.S);
  }
  // upright body: far arm behind the legs, then legs, torso/head, near arm in front
  function sideBody(p, f, oy) {
    p.oy = oy;
    if (!f.noArms) arm(p, sideArms(f)[1], C.j, C.s);
    sideLegs(p, f);
    sideUpper(p, f, f.noArms, true);
    p.oy = 0;
  }

  function drawSide(ctx, f) {
    ctx.clearRect(0, 0, W, H);
    var dx = f.dx || 0, p = new Painter(ctx);
    p.ox = XO + dx;
    propsBack(ctx, f);
    if (f.rot) {
      // whole sprite tilted about a pivot (plank, falling)
      var src = layer('src'); sideBody(new Painter(src.ctx), f, 0);
      ctx.drawImage(rotated(src, f.rot.a, f.rot.ps[0] + XO, f.rot.ps[1], f.rot.pd[0] + XO + dx, f.rot.pd[1]), 0, 0);
      if (f.hand != null) {
        var sh0 = rotAbout(19.5, 31, f.rot.ps[0], f.rot.ps[1], f.rot.a);
        sh0[0] += f.rot.pd[0] - f.rot.ps[0]; sh0[1] += f.rot.pd[1] - f.rot.ps[1];
        reach(p, sh0[0], sh0[1], f.hand, 69, C.J, C.S);
      }
    } else {
      var oy = plantOy(f);
      if (f.lean == null) sideBody(p, f, oy);
      else {
        // legs stay put; the upper body tilts at the hips on its own layer; planted hands reach after
        var hands = f.hands || [], sh = rotAbout(19.5, 31, 19.5, 46, f.lean);
        sh[1] += oy;
        if (hands[1]) reach(p, sh[0], sh[1], hands[1][0], hands[1][1], C.j, C.s);
        p.oy = oy; sideLegs(p, f); p.oy = 0;
        var up = layer('upper'), q = new Painter(up.ctx);
        q.ox = XO + dx; q.oy = oy;
        sideUpper(q, f, !!hands[0], !!hands[1]);
        var px = 19.5 + XO + dx, py = 46 + oy;
        ctx.drawImage(rotated(up, f.lean, px, py, px, py), 0, 0);
        if (hands[0]) reach(p, sh[0], sh[1], hands[0][0], hands[0][1], C.J, C.S);
      }
    }
    var g = f.glow || [11, 28];
    p.ox = XO;
    p.rect(g[0], 72, g[1], 72, 'rgba(0,212,255,0.16)'); p.rect(g[0] + 3, 73, g[1] - 3, 73, 'rgba(0,212,255,0.08)');
    p.ox = XO + dx;
    if (f.flyGlasses) p.map(GLASSES_SIDE, f.flyGlasses[0], f.flyGlasses[1], C);
    if (f.glassesAt) p.map(GLASSES_SIDE, f.glassesAt[0], f.glassesAt[1], C);
    if (f.stars) f.stars.forEach(function (s) { star(p, s[0], s[1]); });
    if (f.sparks) f.sparks.forEach(function (s) { spark(p, s[0], s[1], s[2]); });
    propsFront(ctx, f);
  }

  // ── front view ──
  function drawFrame(ctx, f, worlds) {
    if (f.side) return drawSide(ctx, f);
    var p = new Painter(ctx);
    ctx.clearRect(0, 0, W, H);
    var hop = f.hop || 0, dy = f.dy || 0, lift = f.lift || [0, 0], c = f.crouch || 0;
    var arms = { l: f.l || HANG, r: f.r || HANG }, balls = f.balls, hands = {};

    if (f.juggle != null) {
      // two worlds in a shower pattern: high arc left hand > right hand, quick low pass back
      balls = []; var thrown = false, caught = false;
      for (var q = 0; q < 2; q++) {
        var ph = (f.juggle / 8 + q / 2) % 1, bx, by;
        if (ph < 0.7) { var t = ph / 0.7; bx = 5 + 29 * t; by = 32 - 112 * t * (1 - t); }
        else { var u = (ph - 0.7) / 0.3; bx = 34 - 29 * u; by = 33 + 2 * Math.sin(u * Math.PI); }
        if (ph < 0.13) thrown = true;
        if (ph > 0.6 && ph < 0.78) caught = true;
        balls.push([bx, by + dy, q ? 'o' : 'h']);
      }
      arms.l = [12, thrown ? 140 : 115, 6]; arms.r = [12, caught ? 100 : 118, 6];
    }

    p.rect(14, 72, 25, 72, 'rgba(0,212,255,0.16)'); p.rect(16, 73, 23, 73, 'rgba(0,212,255,0.08)');
    propsBack(ctx, f);
    if (f.poof) poof(p, f.poof[0], f.poof[1]);
    p.oy = -hop;

    // legs + shoes; crouching bends the knees outward and lowers everything above them
    [[13, 18, lift[0], 12, 18], [21, 26, lift[1], 21, 27]].forEach(function (L, i) {
      var bottom = 67 - L[2];
      if (c) {
        var hx = (L[0] + L[1]) / 2, sgn = i ? 1 : -1, hy = 47 + c;
        var kx = hx + sgn * c * 0.45, ky = (hy + bottom) / 2 - c * 0.25;
        p.stroke(hx, hy, kx, ky, 5, C.N); p.stroke(kx, ky, hx, bottom - 1, 5, C.N);
      } else {
        p.rect(L[0], 46, L[1], bottom, C.N);
        p.rect(i ? L[0] : L[1], 47, i ? L[0] : L[1], bottom, C.n);
      }
      p.rect(L[3], bottom + 1, L[4], bottom + 3, C.O);
      p.rect(i ? L[4] - 2 : L[3] + 1, bottom + 1, i ? L[4] - 1 : L[3] + 2, bottom + 1, C.o);
      p.rect(L[3], bottom + 4, L[4], bottom + 4, C.R);
    });
    p.rect(19, 46 + c, 20, 48 + c, C.N);

    // torso (jacket open over the plum shirt)
    p.oy = -hop + dy + c;
    var T = 28;
    p.rect(13, T, 26, T, C.J); p.rect(12, T + 1, 27, T + 17, C.J);
    p.rect(12, T + 1, 12, T + 17, C.j); p.rect(27, T + 1, 27, T + 17, C.j);
    p.rect(17, T, 22, T + 1, C.P); p.rect(18, T + 2, 21, T + 14, C.P);
    p.rect(18, T + 2, 18, T + 14, C.p);
    [T + 4, T + 8, T + 12].forEach(function (y) { p.px(20, y, C.p); });
    p.rect(16, T + 2, 16, T + 5, C.L); p.rect(23, T + 2, 23, T + 5, C.L);
    p.rect(17, T + 2, 17, T + 9, C.L); p.rect(22, T + 2, 22, T + 9, C.L);
    p.rect(13, T + 12, 15, T + 12, C.L); p.rect(24, T + 12, 26, T + 12, C.L);
    p.rect(18, T + 15, 21, T + 15, C.b); p.px(19, T + 15, C.k);
    p.rect(18, T + 16, 21, T + 17, C.N);

    // neck + head
    p.rect(18, 27, 21, 27, C.s);
    var head = HEAD.slice(), r;
    if (f.happy) for (r in HAPPY) head[r] = HAPPY[r];
    if (f.shock) for (r in SHOCK) head[r] = SHOCK[r];
    var look = f.look || LOOK, lx = 0, ly = 0;
    if (f.noglass) for (r in NOGLASS) head[r] = NOGLASS[r];
    else if (f.glint) for (r in GLINT) head[r] = GLINT[r];
    else if (look && LOOKS[look]) {
      for (r in LOOKS[look]) head[r] = LOOKS[look][r];
      lx = look === 'l' ? -1 : look === 'r' ? 1 : 0; ly = look === 'u' ? -1 : 0;   // the head turns a pixel too
    }
    p.map(head, 15 + lx, 16 + ly, C);
    if (f.spiky) drawSpikes(p, f.spiky);

    // arms (drawn last so raised arms sit in front)
    [['l', 13, -1], ['r', 26, 1]].forEach(function (A) {
      var a = arms[A[0]], sx = A[1], sy = T + 2, side = A[2];
      var r1 = a[0] * DEG, r2 = a[1] * DEG;
      var ex = sx + side * Math.sin(r1) * 9, ey = sy + Math.cos(r1) * 9;
      var wx = ex + side * Math.sin(r2) * a[2], wy = ey + Math.cos(r2) * a[2];
      p.stroke(sx, sy, ex, ey, 3, C.J);
      p.stroke(ex, ey, wx, wy, 3, C.J);
      var hx = wx + side * Math.sin(r2) * 2, hy = wy + Math.cos(r2) * 2;
      p.stroke(wx, wy, hx, hy, 3, C.S);
      hands[A[0]] = [hx, hy + p.oy];
      // worlds: Cyber hexagon on the viewer's-left hand, Vista orb on the right; 'tip' = past the raised hand, 'above' = resting over an open palm
      var spot = worlds && f.orbs && f.orbs[A[0]];
      if (spot) {
        ball(p, spot === 'tip' ? hx + side * Math.sin(r2) * 5 : hx, spot === 'tip' ? hy + Math.cos(r2) * 5 : hy - 6, side < 0 ? 'h' : 'o');
      }
    });
    if (f.held) p.map(GLASSES_FRONT, 16, 22, C);
    if (f.floatGlasses) p.map(GLASSES_FRONT, 16, 19 - f.floatGlasses, C);   // lifting off his face
    p.oy = 0;
    if (f.hold != null) { ball(p, hands.l[0], hands.l[1] + f.hold, 'h'); ball(p, hands.r[0], hands.r[1] + f.hold, 'o'); }
    if (balls) balls.forEach(function (b) { ball(p, b[0], b[1], b[2]); });
    if (f.sparks) f.sparks.forEach(function (s) { spark(p, s[0], s[1], s[2]); });
    propsFront(ctx, f);
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = ':host{display:inline-block;position:relative;width:120px;aspect-ratio:56/74;line-height:0;vertical-align:bottom}' +
    'canvas{position:absolute;top:0;left:' + (-24 / 56 * 100) + '%;width:' + (W / 56 * 100) + '%;height:100%;display:block;' +
    'image-rendering:pixelated;image-rendering:crisp-edges;filter:drop-shadow(0 0 5px rgba(0,212,255,.22))}' +
    ':host([facing=left]) canvas{transform:scaleX(-1)}';

  function AlMascot() { return Reflect.construct(HTMLElement, [], AlMascot); }
  AlMascot.prototype = Object.create(HTMLElement.prototype);
  AlMascot.prototype.constructor = AlMascot;
  Object.setPrototypeOf(AlMascot, HTMLElement);
  AlMascot.observedAttributes = ['pose', 'worlds'];
  AlMascot.dur = function (pose) {
    return (POSES[pose] || []).reduce(function (t, f) { return t + f.dur; }, 0);
  };

  AlMascot.prototype.connectedCallback = function () {
    if (!this.shadowRoot) {
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + css + '</style><canvas width="' + W + '" height="' + H + '"></canvas>';
      this._ctx = root.querySelector('canvas').getContext('2d', { willReadFrequently: true });   // glitch frames read pixels back
    }
    if (!this.hasAttribute('pose')) this.setAttribute('pose', 'idle');
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Pixel-art Al');
    this._start();
  };
  AlMascot.prototype.disconnectedCallback = function () { clearTimeout(this._t); };
  AlMascot.prototype.attributeChangedCallback = function () { if (this._ctx) this._start(); };
  AlMascot.prototype._start = function () {
    clearTimeout(this._t);
    var name = this.getAttribute('pose'), frames = POSES[name] || POSES.idle, self = this, i = 0;
    var worlds = this.hasAttribute('worlds'), once = ONCE[name];
    (function tick() {
      self._f = frames[i]; LOOK = self._look || null;
      render(self._ctx, frames[i], worlds);
      LOOK = null;
      if (reduceMotion || frames.length < 2 || (once && i === frames.length - 1)) return;
      self._t = setTimeout(function () { i = (i + 1) % frames.length; tick(); }, frames[i].dur);
    })();
  };

  // turn his eyes toward something without restarting the pose
  AlMascot.prototype.look = function (d) {
    d = d || null;
    if (this._look === d) return;
    this._look = d;
    if (this._ctx && this._f && !this._f.side) {
      LOOK = d; render(this._ctx, this._f, this.hasAttribute('worlds')); LOOK = null;
    }
  };

  customElements.define('al-mascot', AlMascot);
})();
