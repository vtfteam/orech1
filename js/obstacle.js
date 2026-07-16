// Padající šišky: omráčí medvěda při zásahu. Frekvence roste s obtížností.
import {
  WIDTH, HEIGHT, GRAVITY, OBSTACLE_START_INTERVAL, OBSTACLE_MIN_INTERVAL, DIFFICULTY_RAMP,
} from "./config.js";
import { pineconeSprite, blit } from "./sprites.js";

const SIZE = 22;

class Pinecone {
  constructor(x) {
    this.x = x; this.y = -SIZE;
    this.py = this.y;
    this.w = SIZE; this.h = SIZE;
    this.vy = 60 + Math.random() * 60;
    this.spin = 0; this.pspin = 0;
  }
  update(dt) {
    this.py = this.y; this.pspin = this.spin;
    this.vy += GRAVITY * 0.35 * dt;
    this.y += this.vy * dt;
    this.spin += dt * 6;
  }
  hits(p) {
    return this.x < p.x + p.w && this.x + this.w > p.x &&
           this.y < p.y + p.h && this.y + this.h > p.y;
  }
  draw(ctx, alpha = 1) {
    const ry = this.py + (this.y - this.py) * alpha;
    const rspin = this.pspin + (this.spin - this.pspin) * alpha;
    ctx.save();
    ctx.translate(this.x + this.w / 2, ry + this.h / 2);
    ctx.rotate(rspin);
    blit(ctx, pineconeSprite(), -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

export class ObstacleManager {
  constructor() { this.reset(); }

  reset() {
    this.items = [];
    this.timer = OBSTACLE_START_INTERVAL;
    this.elapsed = 0;
  }

  get interval() {
    return Math.max(OBSTACLE_MIN_INTERVAL, OBSTACLE_START_INTERVAL - this.elapsed * DIFFICULTY_RAMP);
  }

  update(dt, players, onHit) {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.items.push(new Pinecone(20 + Math.random() * (WIDTH - 40)));
      this.timer = this.interval * (0.7 + Math.random() * 0.6);
    }
    this.items = this.items.filter((it) => {
      it.update(dt);
      for (const p of players) {
        if (p.stun <= 0 && it.hits(p)) { p.stunHit(); onHit && onHit(p); return false; }
      }
      return it.y < HEIGHT + SIZE;
    });
  }

  draw(ctx, alpha = 1) { for (const it of this.items) it.draw(ctx, alpha); }
}
