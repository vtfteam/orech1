// Pevný ručně navržený layout: plošiny + zem + stromy na pozadí.
import { WIDTH, HEIGHT } from "./config.js";

export const GROUND_Y = HEIGHT - 48;

// Plošiny jako obdélníky {x, y, w, h}. Zem je první.
export const platforms = [
  { x: 0, y: GROUND_Y, w: WIDTH, h: 48 },        // zem
  { x: 90, y: 400, w: 190, h: 20 },
  { x: 380, y: 350, w: 200, h: 20, ice: true },  // prostřední – led
  { x: 690, y: 400, w: 190, h: 20 },
  { x: 210, y: 250, w: 170, h: 20 },
  { x: 560, y: 250, w: 190, h: 20 },
  { x: 390, y: 140, w: 180, h: 20, ice: true },  // prostřední horní – led
];

// Stromy na pozadí {x, baseY, scale}
export const trees = [
  { x: 60,  scale: 1.15 },
  { x: 300, scale: 0.9 },
  { x: 500, scale: 1.05 },
  { x: 720, scale: 0.85 },
  { x: 890, scale: 1.1 },
];

// Vrátí povrchy, na kterých mohou vznikat ořechy (bez země může být volitelné).
export function spawnSurfaces() {
  return platforms;
}
