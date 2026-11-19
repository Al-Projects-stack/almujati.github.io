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
    ]
  };
  var ONCE = {
    conjure: 1, unconjure: 1, 'pc-start': 1, 'pc-stretch': 1, 'pushup-in': 1, 'pushup-out': 1,
    bonk: 1, getup: 1, 'glasses-on': 1, 'juggle-in': 1, fumble: 1, scoop: 1, yawn: 1
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
  function drawPC(p, code, cursorOff) {
    // standing desk
    p.rect(31, 38, 58, 38, '#6b5238'); p.rect(31, 39, 58, 39, '#4a3826');
    p.rect(33, 40, 34, 71, '#3d2f20'); p.rect(55, 40, 56, 71, '#3d2f20'); p.rect(35, 56, 54, 56, '#3d2f20');
    // keyboard
    p.rect(33, 36, 41, 37, '#8a93a6'); for (var x = 34; x <= 40; x += 2) p.px(x, 36, '#c3cad8');
    // monitor (screen turned toward the viewer), with a soft glow
    p.rect(40, 16, 60, 35, 'rgba(0,212,255,0.07)');
    p.rect(42, 18, 58, 33, '#262b36'); p.rect(43, 19, 57, 32, '#071420');
    p.rect(49, 34, 51, 36, '#262b36'); p.rect(46, 37, 54, 37, '#262b36');
    var j = code == null ? 23 : code, total = Math.floor(j / 2) + 1, first = Math.max(0, total - 6);
    for (var r = 0; r < Math.min(6, total); r++) {
      var li = first + r, ln = CODE[li % CODE.length], len = ln[1], y = 20 + 2 * r;
      if (li === total - 1 && j % 2 === 0) len = Math.ceil(len / 2);
      p.rect(44 + ln[0], y, 44 + ln[0] + len - 1, y, CODECOL[ln[2]]);
      if (li === total - 1 && code != null && !cursorOff) p.px(Math.min(56, 45 + ln[0] + len), y, '#eaf6ff');
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
    return Math.round(68 - Math.max(legAt(L[0]).ay, legAt(L[1]).ay));
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
      if (f.pc) drawPC(new Painter(ctx), f.code, f.cursorOff);
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
    if (f.pc) drawPC(p, f.code);
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
    if (f.noglass) for (r in NOGLASS) head[r] = NOGLASS[r];
    else if (f.glint) for (r in GLINT) head[r] = GLINT[r];
    p.map(head, 15, 16, C);

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
    p.oy = 0;
    if (f.hold != null) { ball(p, hands.l[0], hands.l[1] + f.hold, 'h'); ball(p, hands.r[0], hands.r[1] + f.hold, 'o'); }
    if (balls) balls.forEach(function (b) { ball(p, b[0], b[1], b[2]); });
    if (f.sparks) f.sparks.forEach(function (s) { spark(p, s[0], s[1], s[2]); });
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
      this._ctx = root.querySelector('canvas').getContext('2d');
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
      drawFrame(self._ctx, frames[i], worlds);
      if (reduceMotion || frames.length < 2 || (once && i === frames.length - 1)) return;
      self._t = setTimeout(function () { i = (i + 1) % frames.length; tick(); }, frames[i].dur);
    })();
  };

  customElements.define('al-mascot', AlMascot);
})();
