// Pixel-art sprity kreslené programově na malé offscreen canvasy.
// Hlavní render je pak škáluje s vypnutým vyhlazováním → chunky pixel-art.

const cache = new Map();

function offscreen(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

// ---- Medvěd (native 22x22) ----
function drawBear(ctx, body, light, dark, angry = false) {
  ctx.clearRect(0, 0, 22, 22);
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };

  // uši
  R(3, 2, 4, 4, dark); R(15, 2, 4, 4, dark);
  R(4, 3, 2, 2, body); R(16, 3, 2, 2, body);
  // hlava/tělo
  R(4, 5, 14, 14, dark);
  R(5, 6, 12, 12, body);
  // světlejší bříško
  R(8, 12, 6, 6, light);
  // oči
  if (angry) {
    R(7, 8, 3, 2, "#ffffff"); R(12, 8, 3, 2, "#ffffff");
    R(8, 9, 2, 2, "#c40000"); R(12, 9, 2, 2, "#c40000");
  } else {
    R(7, 8, 2, 2, "#ffffff"); R(13, 8, 2, 2, "#ffffff");
    R(8, 9, 1, 1, "#1a1a1a"); R(13, 9, 1, 1, "#1a1a1a");
  }
  // čumák
  R(9, 12, 4, 3, light);
  R(10, 12, 2, 2, dark); // nos
}

export function bearSprite(colors, angry = false) {
  const key = `bear_${colors.color}_${angry}`;
  if (cache.has(key)) return cache.get(key);
  const { c, ctx } = offscreen(22, 22);
  drawBear(ctx, colors.color, colors.light, colors.dark, angry);
  cache.set(key, c);
  return c;
}

// ---- Ořech (native 16x16), volitelně obarvený rámeček + "!" ----
export function nutSprite(ringColor = null, special = false) {
  const key = `nut_${ringColor}_${special}`;
  if (cache.has(key)) return cache.get(key);
  const { c, ctx } = offscreen(16, 16);
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  // tělo žaludu
  R(4, 6, 8, 8, "#c8842a");
  R(5, 7, 6, 6, "#e0a247");
  R(5, 13, 6, 1, "#8a5a1a");
  // špička
  R(7, 14, 2, 1, "#6b4416");
  // čepička
  R(3, 3, 10, 4, "#6b4416");
  R(4, 2, 8, 2, "#84551f");
  R(7, 1, 2, 2, "#6b4416"); // stopka
  if (ringColor) {
    // stopka a čepička v barvě hráče pro jasné odlišení
    ctx.fillStyle = ringColor;
    ctx.fillRect(6, 0, 4, 2);      // barevná stopka
    ctx.fillRect(2, 5, 12, 1);     // barevný proužek pod čepičkou
  }
  if (special) {
    // vykřičník
    R(7, 3, 2, 6, "#ffffff");
    R(7, 10, 2, 2, "#ffffff");
    R(7, 3, 2, 6, "#d10000");
    R(7, 10, 2, 2, "#d10000");
  }
  cache.set(key, c);
  return c;
}

// ---- Strom (native 40x56) ----
export function treeSprite() {
  const key = "tree";
  if (cache.has(key)) return cache.get(key);
  const { c, ctx } = offscreen(40, 56);
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  // kmen
  R(17, 38, 6, 18, "#5a3a1e");
  R(18, 38, 4, 18, "#6e4a28");
  // koruna
  R(10, 20, 20, 20, "#2f7d3a");
  R(6, 26, 28, 12, "#2f7d3a");
  R(13, 12, 14, 14, "#3a9448");
  R(12, 22, 16, 12, "#3a9448");
  // světla
  R(16, 18, 4, 4, "#57b061");
  R(22, 26, 4, 4, "#57b061");
  cache.set(key, c);
  return c;
}

// ---- Šiška / překážka (native 12x14) ----
export function pineconeSprite() {
  const key = "pinecone";
  if (cache.has(key)) return cache.get(key);
  const { c, ctx } = offscreen(12, 14);
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  R(3, 1, 6, 12, "#7a4a1e");
  R(4, 2, 4, 10, "#9a6430");
  R(2, 4, 8, 2, "#6b3f18");
  R(2, 8, 8, 2, "#6b3f18");
  R(4, 11, 4, 2, "#5a3414");
  cache.set(key, c);
  return c;
}

// ---- Sklenice medu (native 16x18) ----
export function honeySprite() {
  const key = "honey";
  if (cache.has(key)) return cache.get(key);
  const { c, ctx } = offscreen(16, 18);
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  // víko
  R(3, 0, 10, 2, "#b5771f");
  R(2, 2, 12, 2, "#d69a34");
  // sklenice s medem
  R(3, 4, 10, 13, "#f0a81e");
  R(4, 5, 8, 11, "#ffc94d");
  // odlesk
  R(5, 6, 2, 7, "#fff2c0");
  // dno
  R(3, 16, 10, 2, "#a86a1a");
  // bílá etiketa s kapkou
  R(6, 9, 4, 4, "#ffffff");
  R(7, 10, 2, 2, "#e0a020");
  cache.set(key, c);
  return c;
}

// Pomocná: vykreslí sprite škálovaný, případně horizontálně zrcadlený.
export function blit(ctx, sprite, x, y, w, h, flip = false) {
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(sprite, x, y, w, h);
  }
}
