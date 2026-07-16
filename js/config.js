// Globální konfigurace hry.
export const WIDTH = 960;
export const HEIGHT = 540;

// Fyzika (jednotky: px, sekundy)
export const GRAVITY = 2000;
export const MOVE_SPEED = 230;
export const JUMP_VELOCITY = -680;
export const STUN_TIME = 0.4;       // sekundy omráčení šiškou (kratší)
export const CHASER_DELAY = 2.6;    // základní zpoždění honiče (s)
export const CHASER_STAGGER = 1.0;  // každý další honič na téhož hráče je o tolik s pozadu

// Hráči 1–4: barva + jméno. Pořadí = index hráče.
export const PLAYERS = [
  { id: 0, name: "P1", color: "#e63946", light: "#ff6b76", dark: "#7a1e26" }, // červená
  { id: 1, name: "P2", color: "#3a86ff", light: "#6ea8ff", dark: "#1c4a99" }, // modrá
  { id: 2, name: "P3", color: "#2fbf71", light: "#63e39c", dark: "#176b3d" }, // zelená
  { id: 3, name: "P4", color: "#f4c20d", light: "#ffdb57", dark: "#8a6c04" }, // žlutá
];

export const BEAR_W = 44;
export const BEAR_H = 44;
export const NUT_SIZE = 26;

// Spawn / obtížnost
export const NUT_SPAWN_INTERVAL = 1.6;   // sekundy mezi ořechy
export const MAX_NUTS = 8;
export const SPECIAL_CHANCE = 0.14;      // pravděpodobnost, že ořech bude "!" past
export const OBSTACLE_START_INTERVAL = 3.5;
export const OBSTACLE_MIN_INTERVAL = 1.0;
export const DIFFICULTY_RAMP = 0.02;     // o kolik se zkrátí interval za sekundu

// Sklenice medu: jednou za minutu se objeví nahoře; kdo ji sebere, ztratí jednoho honiče
export const HONEY_INTERVAL = 60;        // sekundy mezi sklenicemi
export const HONEY_LIFE = 20;            // jak dlouho med zůstane, než zmizí
export const HONEY_SIZE = 34;
