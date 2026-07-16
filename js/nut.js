// Barevné ořechy: sebrat je smí jen medvěd shodné barvy. Speciální "!" ořech spawne honiče.
import { NUT_SIZE, NUT_SPAWN_INTERVAL, MAX_NUTS, SPECIAL_CHANCE, PLAYERS } from "./config.js";
import { spawnSurfaces } from "./level.js";
import { nutSprite, blit } from "./sprites.js";

export class Nut {
  constructor(x, y, ownerId, special) {
    this.x = x; this.y = y;
    this.w = NUT_SIZE; this.h = NUT_SIZE;
    this.ownerId = ownerId;        // barva hráče, který smí sebrat
    this.special = special;        // "!" past
    this.t = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  draw(ctx) {
    this.t += 0.05;
    const bob = Math.sin(this.t) * 2;
    const col = PLAYERS[this.ownerId].color;
    // barevná svatozář — jasně ukazuje, čí je ořech
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(this.t * 1.5) * 0.1;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy + bob, this.w * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    blit(ctx, nutSprite(col, this.special), this.x, this.y + bob, this.w, this.h);
  }
}

export class NutManager {
  constructor(activeIds) {
    this.activeIds = activeIds;     // pole id aktivních hráčů (barev, které mohou spawnovat)
    this.nuts = [];
    this.timer = 0.8;
  }

  reset(activeIds) {
    this.activeIds = activeIds;
    this.nuts = [];
    this.timer = 0.8;
  }

  spawn() {
    const surfaces = spawnSurfaces();
    const surf = surfaces[1 + Math.floor(Math.random() * (surfaces.length - 1))]; // ne zem
    const x = surf.x + 10 + Math.random() * (surf.w - 20 - NUT_SIZE);
    const y = surf.y - NUT_SIZE - 2;
    const ownerId = this.activeIds[Math.floor(Math.random() * this.activeIds.length)];
    const special = Math.random() < SPECIAL_CHANCE;
    this.nuts.push(new Nut(x, y, ownerId, special));
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0 && this.nuts.length < MAX_NUTS) {
      this.spawn();
      this.timer = NUT_SPAWN_INTERVAL * (0.7 + Math.random() * 0.6);
    }
  }

  // Kontrola sběru. Vrací pole událostí: {type:'score'|'trap', playerId}
  collect(players) {
    const events = [];
    this.nuts = this.nuts.filter((nut) => {
      for (const pl of players) {
        if (pl.id !== nut.ownerId) continue;       // jen shodná barva
        if (aabb(pl, nut)) {
          events.push({ type: nut.special ? "trap" : "score", playerId: pl.id, nut });
          return false; // sebráno → odstranit
        }
      }
      return true;
    });
    return events;
  }

  draw(ctx) {
    for (const n of this.nuts) n.draw(ctx);
  }
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
