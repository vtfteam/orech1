// Vstupní bod: game loop, správa stavů (MENU / PLAY / GAME_OVER), vykreslení světa.
import { WIDTH, HEIGHT, PLAYERS, BEAR_W, BEAR_H, NUT_SIZE, CHASER_DELAY, CHASER_STAGGER,
  HONEY_INTERVAL, HONEY_LIFE, HONEY_SIZE } from "./config.js";
import { initInput, clearPressed, isCodePressed } from "./input.js";
import { platforms, trees, GROUND_Y } from "./level.js";
import { treeSprite, bearSprite, nutSprite, pineconeSprite, honeySprite, blit } from "./sprites.js";
import { Player } from "./player.js";
import { NutManager } from "./nut.js";
import { Chaser } from "./chaser.js";
import { ObstacleManager } from "./obstacle.js";
import { drawHud } from "./hud.js";
import { drawMenu, drawGameOver } from "./menu.js";
import { sfx, unlockAudio, toggleMute, isMuted } from "./audio.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const STATE = { MENU: "menu", PLAY: "play", REPLAY: "replay", OVER: "over" };

// Replay smrti (killcam)
const CHASER_COLORS = { id: -1, color: "#4a4a55", light: "#6a6a78", dark: "#23232b" };
const REPLAY_CAPTURE = 2.6;                        // kolik sekund před smrtí zaznamenat
const CAPTURE_EVERY = 2;                           // snímkuj každý 2. krok (méně alokací/GC)
const FRAME_DT = CAPTURE_EVERY / 60;               // časový rozestup snímků
const REPLAY_MAX_FRAMES = Math.round(REPLAY_CAPTURE / FRAME_DT);
const REPLAY_SPEED = 0.35;                         // zpomalení přehrávky
let captureTick = 0;

const game = {
  state: STATE.MENU,
  selectedCount: 2,
  players: [],
  nuts: null,
  obstacles: new ObstacleManager(),
  chasers: [],
  score: 0,
  elapsed: 0,
  caughtName: "",
  caughtId: -1,
  history: [],        // rolující snímky posledních vteřin (pro replay)
  replay: null,       // { frames, t } při přehrávání smrti
  honey: null,        // { x, y, w, h, life } sklenice medu
  honeyTimer: HONEY_INTERVAL,
};

function startGame(count) {
  const xs = [WIDTH * 0.2, WIDTH * 0.4, WIDTH * 0.6, WIDTH * 0.8];
  game.players = [];
  for (let i = 0; i < count; i++) {
    game.players.push(new Player(PLAYERS[i], xs[i], GROUND_Y - BEAR_H));
  }
  const activeIds = game.players.map((p) => p.id);
  game.nuts = new NutManager(activeIds);
  game.obstacles.reset();
  game.chasers = [];
  game.score = 0;
  game.elapsed = 0;
  game.history = [];
  game.replay = null;
  game.caughtId = -1;
  game.honey = null;
  game.honeyTimer = HONEY_INTERVAL;
  game.state = STATE.PLAY;
  sfx.start();
}

// Sklenice medu se objeví úplně nahoře uprostřed (dosažitelná skokem z horní plošiny).
function spawnHoney() {
  game.honey = { x: WIDTH / 2 - HONEY_SIZE / 2, y: 44, w: HONEY_SIZE, h: HONEY_SIZE, life: HONEY_LIFE };
}

// Hráč sebral med → zmizí jeden honič, který honí právě jeho (jinak nejstarší honič).
function takeHoney(player) {
  let idx = game.chasers.findIndex((c) => c.target === player);
  if (idx < 0 && game.chasers.length) idx = 0;
  if (idx >= 0) game.chasers.splice(idx, 1);
  game.honey = null;
  sfx.honey();
}

// Snímek scény pro replay (jen data potřebná k překreslení).
function snapshot() {
  return {
    players: game.players.map((p) => ({ id: p.id, x: p.x, y: p.y, facing: p.facing, stun: p.stun > 0 })),
    chasers: game.chasers.map((c) => ({ x: c.x, y: c.y, facing: c.facing, active: c.active })),
    nuts: game.nuts.nuts.map((n) => ({ x: n.x, y: n.y, ownerId: n.ownerId, special: n.special })),
    obstacles: game.obstacles.items.map((o) => ({ x: o.x, y: o.y, spin: o.spin })),
    score: game.score,
  };
}

function spawnChaser(target) {
  // každý další stín na téhož hráče je víc pozadu → netvoří se hromada na jednom místě
  const sameTarget = game.chasers.filter((c) => c.target === target).length;
  const delay = CHASER_DELAY + sameTarget * CHASER_STAGGER;
  game.chasers.push(new Chaser(target, delay));
}

function difficulty() { return Math.floor(game.elapsed / 20) + 1; }

// ---- Aktualizace stavů ----
function updateMenu() {
  if (isCodePressed("Digit1") || isCodePressed("Numpad1")) game.selectedCount = 1;
  if (isCodePressed("Digit2") || isCodePressed("Numpad2")) game.selectedCount = 2;
  if (isCodePressed("Digit3") || isCodePressed("Numpad3")) game.selectedCount = 3;
  if (isCodePressed("Digit4") || isCodePressed("Numpad4")) game.selectedCount = 4;
  if (isCodePressed("Space") || isCodePressed("Enter")) {
    unlockAudio();
    startGame(game.selectedCount);
  }
}

function updatePlay(dt) {
  if (isCodePressed("KeyM")) toggleMute();
  game.elapsed += dt;

  for (const p of game.players) p.update(dt);

  game.nuts.update(dt);
  const events = game.nuts.collect(game.players);
  for (const e of events) {
    if (e.type === "score") { game.score++; sfx.score(); }
    else if (e.type === "trap") {
      sfx.trap();
      const target = game.players.find((p) => p.id === e.playerId);
      if (target) spawnChaser(target);
    }
  }

  game.obstacles.update(dt, game.players, () => sfx.stun());

  // sklenice medu: spawn jednou za minutu; sběr kterýmkoli medvědem → mínus jeden honič
  if (game.honey) {
    game.honey.life -= dt;
    if (game.honey.life <= 0) { game.honey = null; }
    else {
      const h = game.honey;
      for (const p of game.players) {
        if (p.x < h.x + h.w && p.x + p.w > h.x && p.y < h.y + h.h && p.y + p.h > h.y) {
          takeHoney(p);
          break;
        }
      }
    }
  } else {
    game.honeyTimer -= dt;
    if (game.honeyTimer <= 0) { spawnHoney(); game.honeyTimer = HONEY_INTERVAL; }
  }

  let caught = null;
  for (const c of game.chasers) {
    c.update(dt);
    // honič chytí kteréhokoli hráče, ne jen svého spawnera
    for (const p of game.players) {
      if (c.hits(p)) { caught = p; break; }
    }
    if (caught) break;
  }

  // zaznamenej snímek (řidčeji kvůli výkonu); při chycení vždy, ať je poslední frame přesný
  if (++captureTick % CAPTURE_EVERY === 0 || caught) {
    game.history.push(snapshot());
    if (game.history.length > REPLAY_MAX_FRAMES) game.history.shift();
  }

  if (caught) {
    game.caughtName = caught.colors.name;
    game.caughtId = caught.id;
    game.replay = { frames: game.history.slice(), t: 0 };
    game.state = STATE.REPLAY;
    sfx.over();
  }
}

// Přehrávání smrti; na konci (nebo po stisku) → obrazovka game over.
function updateReplay(dt) {
  const r = game.replay;
  r.t += dt * REPLAY_SPEED;
  const total = (r.frames.length - 1) * FRAME_DT;
  if (r.t >= total || isCodePressed("Space") || isCodePressed("Enter")) {
    game.state = STATE.OVER;
  }
}

function updateOver() {
  if (isCodePressed("Space") || isCodePressed("Enter")) {
    game.state = STATE.MENU;
  }
}

// ---- Vykreslení světa ----
let skyGradient = null;
function drawSky() {
  if (!skyGradient) {
    skyGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGradient.addColorStop(0, "#8fd3f0");
    skyGradient.addColorStop(1, "#cde7c6");
  }
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawTrees() {
  const spr = treeSprite();
  for (const t of trees) {
    const w = 80 * t.scale, h = 112 * t.scale;
    blit(ctx, spr, t.x - w / 2, GROUND_Y - h + 6, w, h);
  }
}

function drawPlatforms() {
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (i === 0) {
      // zem
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#3faa4d";
      ctx.fillRect(p.x, p.y, p.w, 10);
    } else if (p.ice) {
      // ledová plošina
      ctx.fillStyle = "#8fc9e8";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#d6f2ff";
      ctx.fillRect(p.x, p.y, p.w, 7);            // lesklý vršek
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(p.x + 6, p.y + 2, p.w * 0.35, 2);  // odlesk
      ctx.fillStyle = "rgba(90,150,190,0.4)";
      ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
    } else {
      ctx.fillStyle = "#7a4a24";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#3faa4d";
      ctx.fillRect(p.x, p.y, p.w, 7);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
    }
  }
}

// interpolace X s ošetřením wrapu (velký skok = teleport, neinterpolovat)
function lerpX(a, b, f) { return Math.abs(b - a) > WIDTH / 2 ? b : a + (b - a) * f; }

function drawSnapshot(cur, next, frac) {
  // ořechy
  for (const n of cur.nuts) {
    blit(ctx, nutSprite(PLAYERS[n.ownerId].color, n.special), n.x, n.y, NUT_SIZE, NUT_SIZE);
  }
  // překážky
  for (const o of cur.obstacles) {
    ctx.save();
    ctx.translate(o.x + 11, o.y + 11);
    ctx.rotate(o.spin);
    blit(ctx, pineconeSprite(), -11, -11, 22, 22);
    ctx.restore();
  }
  // honiči (párování podle indexu)
  cur.chasers.forEach((c, i) => {
    const nc = next.chasers[i];
    const x = nc ? lerpX(c.x, nc.x, frac) : c.x;
    const y = nc ? c.y + (nc.y - c.y) * frac : c.y;
    ctx.save();
    if (!c.active) ctx.globalAlpha = 0.5;
    blit(ctx, bearSprite(CHASER_COLORS, true), x, y, BEAR_W, BEAR_H, c.facing < 0);
    ctx.restore();
    ctx.fillStyle = "#ff2a2a";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", x + BEAR_W / 2, y - 6);
  });
  // hráči (párování podle id); chycený zvýrazněn
  const pulse = 0.5 + 0.5 * Math.sin(game.replay.t * 12);
  for (const p of cur.players) {
    const np = next.players.find((q) => q.id === p.id);
    const x = np ? lerpX(p.x, np.x, frac) : p.x;
    const y = np ? p.y + (np.y - p.y) * frac : p.y;
    if (p.id === game.caughtId) {
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.4 * pulse;
      ctx.strokeStyle = "#ff2a2a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + BEAR_W / 2, y + BEAR_H / 2, BEAR_W * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    blit(ctx, bearSprite(PLAYERS[p.id], false), x, y, BEAR_W, BEAR_H, p.facing < 0);
  }
}

function drawReplay() {
  const r = game.replay;
  drawSky();
  drawTrees();
  drawPlatforms();

  const fi = r.t / FRAME_DT;
  const i = Math.min(Math.floor(fi), r.frames.length - 1);
  const frac = Math.min(1, fi - i);
  const cur = r.frames[i];
  const next = r.frames[Math.min(i + 1, r.frames.length - 1)];
  drawSnapshot(cur, next, frac);

  // ztmavení okrajů + banner
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, WIDTH, 46);
  ctx.fillStyle = "#ff6b6b";
  ctx.font = "bold 30px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`PŘEHRÁVKA SMRTI — ${game.caughtName}`, WIDTH / 2, 34);

  // progress bar
  const prog = r.t / ((r.frames.length - 1) * FRAME_DT);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(WIDTH / 2 - 200, HEIGHT - 40, 400, 8);
  ctx.fillStyle = "#ffd7a0";
  ctx.fillRect(WIDTH / 2 - 200, HEIGHT - 40, 400 * Math.min(1, prog), 8);

  ctx.fillStyle = "#fff";
  ctx.font = "16px 'Trebuchet MS', sans-serif";
  ctx.fillText("MEZERNÍK = přeskočit", WIDTH / 2, HEIGHT - 14);
}

function drawHoney() {
  const h = game.honey;
  // těsně před zmizením bliká
  if (h.life < 4 && Math.floor(h.life * 6) % 2 === 0) return;
  const pulse = 0.5 + 0.5 * Math.sin(game.elapsed * 6);
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.25 * pulse;
  ctx.fillStyle = "#ffd94d";
  ctx.beginPath();
  ctx.arc(h.x + h.w / 2, h.y + h.h / 2, h.w * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  blit(ctx, honeySprite(), h.x, h.y, h.w, h.h);
  // popisek
  ctx.fillStyle = "#7a4a10";
  ctx.font = "bold 13px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MED", h.x + h.w / 2, h.y - 6);
}

function render(alpha) {
  if (game.state === STATE.MENU) { drawMenu(ctx, game.selectedCount); return; }
  if (game.state === STATE.REPLAY) { drawReplay(); return; }

  drawSky();
  drawTrees();
  drawPlatforms();
  game.nuts && game.nuts.draw(ctx);
  for (const p of game.players) p.draw(ctx, alpha);
  for (const c of game.chasers) c.draw(ctx, alpha);
  game.obstacles.draw(ctx, alpha);
  if (game.honey) drawHoney();
  drawHud(ctx, game.score, game.elapsed, difficulty());
  if (isMuted()) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(WIDTH - 180, 52, 120, 26);
    ctx.fillStyle = "#ffd7a0";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("ZVUK VYP (M)", WIDTH - 20, 71);
  }

  if (game.state === STATE.OVER) {
    drawGameOver(ctx, game.score, game.elapsed, game.caughtName);
  }
}

// ---- Game loop s fixním krokem ----
const STEP = 1 / 60;
let acc = 0;
let last = 0;

function frame(now) {
  if (!last) last = now;
  let delta = (now - last) / 1000;
  last = now;
  if (delta > 0.25) delta = 0.25; // ochrana po přepnutí tabu
  acc += delta;

  while (acc >= STEP) {
    if (game.state === STATE.MENU) updateMenu();
    else if (game.state === STATE.PLAY) updatePlay(STEP);
    else if (game.state === STATE.REPLAY) updateReplay(STEP);
    else if (game.state === STATE.OVER) updateOver();
    clearPressed();
    acc -= STEP;
  }

  // alpha = jak daleko jsme mezi dvěma kroky → plynulá interpolace vykreslení
  render(game.state === STATE.PLAY ? acc / STEP : 1);
  requestAnimationFrame(frame);
}

initInput();
requestAnimationFrame(frame);

// Debug hook (pro automatické testy).
window.__game = game;
