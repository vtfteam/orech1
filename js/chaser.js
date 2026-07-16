// Honič = "stín": zaznamenává trasu cíle a přehrává ji se zpožděním CHASER_DELAY.
// Přesně opakuje pohyby hráče (včetně skoků a teleportů okrajem), jen o něco později.
import { BEAR_W, BEAR_H, CHASER_DELAY, WIDTH } from "./config.js";
import { bearSprite, blit } from "./sprites.js";

const CHASER_COLORS = { id: -1, color: "#4a4a55", light: "#6a6a78", dark: "#23232b" };
const STEP = 1 / 60;

export class Chaser {
  constructor(target, delaySeconds = CHASER_DELAY) {
    this.target = target;      // hráč, jehož trasu kopíruje
    this.delayFrames = Math.round(delaySeconds / STEP);
    this.w = BEAR_W; this.h = BEAR_H;
    // začíná na aktuální pozici hráče a čeká, než se naplní zpoždění → hráč dostane náskok
    this.x = target.x; this.y = target.y;
    this.px = this.x; this.py = this.y;   // předchozí poloha (render-interpolace)
    this.facing = target.facing;
    this.trail = [];           // fronta zaznamenaných poloh cíle
    this.active = false;       // dokud se nenaplní zpoždění, honič jen čeká (nechytá)
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update() {
    // ulož předchozí polohu pro plynulé vykreslení mezi kroky
    this.px = this.x; this.py = this.y;
    // zaznamenej aktuální stav cíle
    this.trail.push({ x: this.target.x, y: this.target.y, facing: this.target.facing });
    // jakmile máme dost historie, přehrávej polohu spred DELAY_FRAMES snímky
    if (this.trail.length > this.delayFrames) {
      const pos = this.trail.shift();
      this.x = pos.x;
      this.y = pos.y;
      this.facing = pos.facing;
      this.active = true;
    }
  }

  hits(player) {
    if (!this.active) return false;   // během náskoku nechytá
    return this.x < player.x + player.w && this.x + this.w > player.x &&
           this.y < player.y + player.h && this.y + this.h > player.y;
  }

  draw(ctx, alpha = 1) {
    let rx = Math.abs(this.x - this.px) > WIDTH / 2 ? this.x : this.px + (this.x - this.px) * alpha;
    const ry = this.py + (this.y - this.py) * alpha;
    // dokud honič čeká (náskok), vykresli ho poloprůhledně jako "formující se stín"
    ctx.save();
    if (!this.active) ctx.globalAlpha = 0.5;
    const sprite = bearSprite(CHASER_COLORS, true);
    blit(ctx, sprite, rx, ry, this.w, this.h, this.facing < 0);
    ctx.restore();
    // vykřičník nad honičem
    ctx.fillStyle = "#ff2a2a";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", rx + this.w / 2, ry - 6);
  }
}
