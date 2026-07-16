// Vykreslení úvodního menu a obrazovky game over.
import { WIDTH, HEIGHT, PLAYERS } from "./config.js";
import { bearSprite, blit } from "./sprites.js";

const CONTROLS = [
  "P1 červený:  A / D  +  W skok",
  "P2 modrý:    ← / →  +  ↑ skok",
  "P3 zelený:   J / L  +  I skok",
  "P4 žlutý:    num 1 / 3  +  5 skok",
];

export function drawMenu(ctx, selectedCount) {
  bg(ctx);
  ctx.textAlign = "center";

  ctx.fillStyle = "#fff2c4";
  ctx.font = "bold 52px 'Trebuchet MS', sans-serif";
  ctx.fillText("Medvědi sbírají ořechy", WIDTH / 2, 90);

  ctx.font = "22px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#d8e6ff";
  ctx.fillText("Kooperace pro 1–4 hráče na jedné klávesnici", WIDTH / 2, 128);

  // výběr počtu hráčů — náhledy medvědů
  ctx.font = "bold 24px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Počet hráčů: klávesy 1 – 4", WIDTH / 2, 190);

  const startX = WIDTH / 2 - (4 * 90) / 2 + 45;
  for (let i = 0; i < 4; i++) {
    const x = startX + i * 90 - 30;
    const active = i < selectedCount;
    ctx.globalAlpha = active ? 1 : 0.3;
    blit(ctx, bearSprite(PLAYERS[i], false), x, 210, 60, 60);
    ctx.globalAlpha = 1;
    ctx.fillStyle = active ? PLAYERS[i].color : "#555";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(String(i + 1), x + 30, 292);
  }

  // ovládání
  ctx.font = "18px 'Consolas', monospace";
  ctx.fillStyle = "#cfe3ff";
  CONTROLS.forEach((line, i) => {
    ctx.fillText(line, WIDTH / 2, 340 + i * 26);
  });

  // start
  ctx.font = "bold 28px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#9dff9d";
  ctx.fillText("Stiskni MEZERNÍK pro start", WIDTH / 2, 500);
}

export function drawGameOver(ctx, score, time, caughtName) {
  bg(ctx);
  ctx.textAlign = "center";

  ctx.fillStyle = "#ff6b6b";
  ctx.font = "bold 60px 'Trebuchet MS', sans-serif";
  ctx.fillText("Konec hry!", WIDTH / 2, 160);

  ctx.fillStyle = "#fff2c4";
  ctx.font = "26px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Honič chytil hráče ${caughtName}`, WIDTH / 2, 220);

  ctx.font = "bold 40px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffe08a";
  ctx.fillText(`Nasbíráno ořechů: ${score}`, WIDTH / 2, 300);

  ctx.font = "22px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#d8e6ff";
  ctx.fillText(`Čas: ${Math.floor(time)} s`, WIDTH / 2, 345);

  ctx.font = "bold 26px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#9dff9d";
  ctx.fillText("MEZERNÍK = hrát znovu", WIDTH / 2, 440);
}

function bg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  g.addColorStop(0, "#12203a");
  g.addColorStop(1, "#1e3a2a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}
