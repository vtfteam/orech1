// HUD: společné skóre, čas, indikátor obtížnosti.
// POZOR: žádné emoji v per-frame renderu (na Linuxu je fillText s emoji pomalý).
import { WIDTH } from "./config.js";
import { nutSprite, blit } from "./sprites.js";

export function drawHud(ctx, score, time, difficulty) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "bold 26px 'Trebuchet MS', sans-serif";

  // skóre (společné) — ikona žaludu je sprite (drawImage), ne emoji
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(12, 10, 220, 40);
  blit(ctx, nutSprite(null, false), 20, 14, 30, 30);
  ctx.fillStyle = "#fff8e1";
  ctx.fillText(`${score}`, 56, 39);

  // čas
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(WIDTH / 2 - 60, 10, 120, 40);
  ctx.fillStyle = "#fff8e1";
  ctx.fillText(fmt(time), WIDTH / 2, 39);

  // obtížnost
  ctx.textAlign = "right";
  ctx.font = "bold 18px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(WIDTH - 180, 12, 168, 34);
  ctx.fillStyle = "#ffd7a0";
  ctx.fillText(`Obtížnost ${difficulty}`, WIDTH - 20, 35);

  ctx.restore();
}

function fmt(t) {
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}
