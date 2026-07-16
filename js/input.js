// Vstup pro až 4 hráče na jedné klávesnici.
// Mapování přes event.code (fyzická klávesa), aby fungoval numpad i rozložení.

const MAP = [
  // P1: WASD
  { left: "KeyA", right: "KeyD", jump: "KeyW", down: "KeyS" },
  // P2: šipky
  { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", down: "ArrowDown" },
  // P3: IJKL
  { left: "KeyJ", right: "KeyL", jump: "KeyI", down: "KeyK" },
  // P4: numpad 1235
  { left: "Numpad1", right: "Numpad3", jump: "Numpad5", down: "Numpad2" },
];

// Klávesy, u kterých blokujeme výchozí chování prohlížeče (scroll apod.)
const PREVENT = new Set([
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
  "Numpad1", "Numpad2", "Numpad3", "Numpad5",
]);

const held = new Set();      // aktuálně držené klávesy
const pressed = new Set();   // klávesy stisknuté v tomto snímku (edge)

export function initInput() {
  window.addEventListener("keydown", (e) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (!held.has(e.code)) pressed.add(e.code);
    held.add(e.code);
  });
  window.addEventListener("keyup", (e) => {
    held.delete(e.code);
  });
  // ztráta fokusu = pustit vše
  window.addEventListener("blur", () => { held.clear(); pressed.clear(); });
}

// Volat na konci každého snímku, aby se vymazaly edge-stisky.
export function clearPressed() {
  pressed.clear();
}

export function isDown(playerId, action) {
  const code = MAP[playerId]?.[action];
  return code ? held.has(code) : false;
}

// True jen ve snímku, kdy byla klávesa právě stisknuta.
export function justPressed(playerId, action) {
  const code = MAP[playerId]?.[action];
  return code ? pressed.has(code) : false;
}

// Byl v tomto snímku stisknut jakýkoli ovládací klávesa hráče? (pro join/menu)
export function anyKeyPressed() {
  return pressed.size > 0;
}

export function isCodePressed(code) {
  return pressed.has(code);
}
