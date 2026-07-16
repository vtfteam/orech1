// Zvukové efekty přes WebAudio pomocí "voice poolu".
// KLÍČOVÉ pro Linux/PulseAudio: oscilátory se vytvoří JEDNOU a běží stále (potichu).
// Zvuk = jen obálka hlasitosti + změna frekvence → během hry se NEVYTVÁŘEJÍ uzly (žádné xruny/sekání).
let ctx = null;
let master = null;
let voices = [];
let vi = 0;                   // round-robin index hlasu
let muted = false;
let lastAnyAt = -1;
const lastAt = new Map();
const THROTTLE = 0.06;        // min. rozestup stejného zvuku (s)
const GLOBAL_GAP = 0.02;      // min. rozestup libovolných dvou zvuků (s)
const NUM_VOICES = 4;

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    // trvalé hlasy — vytvoří se jen teď, dál se už jen modulují
    for (let i = 0; i < NUM_VOICES; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      osc.type = "square";
      osc.frequency.value = 440;
      osc.connect(g).connect(master);
      osc.start();
      voices.push({ osc, g });
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Naplánuje jeden tón na dalším volném hlasu (bez vytváření uzlů).
function noteAt(t0, freq, dur, type, gain) {
  const v = voices[vi];
  vi = (vi + 1) % voices.length;
  v.osc.type = type;
  v.osc.frequency.setValueAtTime(freq, t0);
  const g = v.g.gain;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function play(name, notes) {
  if (muted) return;
  try {
    const a = ac();
    if (a.state !== "running") return;
    const now = a.currentTime;
    if (now - lastAnyAt < GLOBAL_GAP) return;
    if (now - (lastAt.get(name) || -1) < THROTTLE) return;
    lastAnyAt = now;
    lastAt.set(name, now);
    for (const [freq, dur, type, gain, offset] of notes) {
      noteAt(now + (offset || 0), freq, dur, type, gain);
    }
  } catch (e) { /* zvuk nikdy nesmí shodit hru */ }
}

export const sfx = {
  jump()  { play("jump",  [[440, 0.12, "square", 0.06, 0]]); },
  score() { play("score", [[660, 0.08, "square", 0.07, 0], [880, 0.10, "square", 0.07, 0.06]]); },
  stun()  { play("stun",  [[180, 0.25, "sawtooth", 0.08, 0]]); },
  trap()  { play("trap",  [[200, 0.15, "sawtooth", 0.10, 0], [140, 0.30, "sawtooth", 0.10, 0.12]]); },
  over()  { play("over",  [[523, 0.22, "triangle", 0.09, 0], [415, 0.22, "triangle", 0.09, 0.16], [349, 0.22, "triangle", 0.09, 0.32], [262, 0.28, "triangle", 0.09, 0.48]]); },
  start() { play("start", [[392, 0.12, "square", 0.07, 0], [523, 0.12, "square", 0.07, 0.09], [659, 0.12, "square", 0.07, 0.18]]); },
  honey() { play("honey", [[523, 0.1, "sine", 0.09, 0], [659, 0.1, "sine", 0.09, 0.08], [880, 0.16, "sine", 0.09, 0.16]]); },
};

export function unlockAudio() { ac(); }
