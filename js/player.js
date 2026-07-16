// Medvěd-hráč: fyzika (gravitace, skok, kolize s plošinami), stun, vykreslení.
import {
  GRAVITY, MOVE_SPEED, JUMP_VELOCITY, STUN_TIME, BEAR_W, BEAR_H, HEIGHT, WIDTH,
} from "./config.js";
import { isDown, justPressed } from "./input.js";
import { platforms, GROUND_Y } from "./level.js";
import { bearSprite, blit } from "./sprites.js";

export class Player {
  constructor(colors, x, y) {
    this.colors = colors;      // { id, name, color, light, dark }
    this.id = colors.id;
    this.x = x; this.y = y;
    this.px = x; this.py = y;   // předchozí poloha (pro render-interpolaci)
    this.vx = 0; this.vy = 0;
    this.w = BEAR_W; this.h = BEAR_H;
    this.onGround = false;
    this.onIce = false;        // stojí na ledové plošině (klouže)
    this.facing = 1;           // 1 = vpravo, -1 = vlevo
    this.stun = 0;             // zbývající čas omráčení
    this.wobble = 0;           // fáze třesení při stunu
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  stunHit() {
    if (this.stun <= 0) this.stun = STUN_TIME;
  }

  update(dt) {
    // ulož předchozí polohu pro plynulé vykreslení mezi kroky
    this.px = this.x; this.py = this.y;

    // vstup (jen když není omráčen)
    if (this.stun > 0) {
      this.stun -= dt;
      this.wobble += dt * 30;
      this.vx = 0;
    } else {
      let dir = 0;
      if (isDown(this.id, "left")) dir -= 1;
      if (isDown(this.id, "right")) dir += 1;
      if (this.onIce) {
        // led: silná setrvačnost – pomalé zrychlování a hlavně pomalé brzdění (dlouhý skluz)
        const target = dir * MOVE_SPEED;
        const rate = dir !== 0 ? 2.2 : 0.45;
        this.vx += (target - this.vx) * Math.min(1, rate * dt);
      } else {
        this.vx = dir * MOVE_SPEED;
      }
      if (dir !== 0) this.facing = dir;
      if (justPressed(this.id, "jump") && this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
      }
    }

    // gravitace
    this.vy += GRAVITY * dt;

    // horizontální pohyb + teleport přes okraje (wrap)
    this.x += this.vx * dt;
    if (this.x + this.w < 0) this.x = WIDTH;
    else if (this.x > WIDTH) this.x = -this.w;

    // vertikální pohyb + kolize s plošinami (jen shora dolů)
    const prevBottom = this.y + this.h - this.vy * dt; // spodek před krokem
    this.y += this.vy * dt;
    this.onGround = false;
    let landedIce = false;

    for (const p of platforms) {
      const withinX = this.x + this.w > p.x + 3 && this.x < p.x + p.w - 3;
      const bottom = this.y + this.h;
      if (
        withinX &&
        this.vy >= 0 &&
        prevBottom <= p.y + 2 &&
        bottom >= p.y &&
        bottom <= p.y + p.h + 6
      ) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
        landedIce = !!p.ice;
      }
    }

    // led si "pamatuj" i ve vzduchu (setrvačnost při seskoku z ledu), přepiš až po dopadu
    if (this.onGround) this.onIce = landedIce;

    // pevná podlaha na úrovni povrchu země přes CELOU šířku (žádné propadnutí do podzemí,
    // ani po teleportu okrajem, kde má zem boční okraj)
    if (this.y + this.h > GROUND_Y) {
      this.y = GROUND_Y - this.h;
      this.vy = 0;
      this.onGround = true;
    }
  }

  draw(ctx, alpha = 1) {
    // interpolace mezi předchozí a aktuální polohou; přeskoč při wrapu (velký skok)
    let rx = Math.abs(this.x - this.px) > WIDTH / 2 ? this.x : this.px + (this.x - this.px) * alpha;
    const ry = this.py + (this.y - this.py) * alpha;

    const sprite = bearSprite(this.colors, false);
    let ox = 0;
    if (this.stun > 0) ox = Math.sin(this.wobble) * 3;
    blit(ctx, sprite, rx + ox, ry, this.w, this.h, this.facing < 0);

    // jmenovka / indikátor barvy nad hlavou
    ctx.fillStyle = this.colors.color;
    ctx.fillRect(rx + this.w / 2 - 3, ry - 8, 6, 4);

    if (this.stun > 0) {
      // omráčení: kreslené "hvězdičky" (žádný glyph/emoji)
      ctx.fillStyle = "#ffd000";
      const cx = rx + this.w / 2;
      for (let i = 0; i < 3; i++) ctx.fillRect(cx - 9 + i * 7, ry - 16 + (i % 2) * 4, 3, 3);
    }
  }
}
