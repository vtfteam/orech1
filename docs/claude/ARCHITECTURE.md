# Architektura — Medvědi sbírají ořechy

Kooperativní 2D plošinovka v prohlížeči, 1–4 hráči na jedné klávesnici.
Čistý HTML5 Canvas + vanilla JS (ES moduly), bez závislostí a bez build kroku.

## Běh
`index.html` načte `js/main.js` jako `type="module"`. Kvůli ES modulům se musí
servírovat přes HTTP (ne `file://`). Viz `DEV_PROCESS.md`.

## Herní smyčka a stavy (`js/main.js`)
- Fixní krok `1/60 s` (akumulátor), render přes `requestAnimationFrame`.
- Stavy: `MENU` → `PLAY` → `REPLAY` (zpomalený sestřih smrti) → `OVER` → zpět `MENU`.
- **Replay smrti (killcam):** během `PLAY` se do `game.history` ukládá lehký snímek scény
  (`snapshot()`, každý 2. krok, ~2,6 s). Při chycení se přehraje zpomaleně (`REPLAY_SPEED`)
  s interpolací; chycený medvěd je v pulzujícím červeném kruhu (`drawSnapshot()`/`drawReplay()`).
- `main.js` drží centrální objekt `game` a orchestruje moduly níže.
- `window.__game` = debug hook pro automatické testy.

## Moduly (`js/`)
| Soubor | Odpovědnost |
|--------|-------------|
| `config.js` | Konstanty: rozměry, fyzika, barvy hráčů, spawn/obtížnost. |
| `input.js` | Mapování kláves 4 hráčů přes `event.code`; held/edge stav; `preventDefault`. |
| `level.js` | Pevný layout plošin (`platforms`), zem, pozice stromů. |
| `player.js` | `Player`: fyzika, skok, kolize s plošinami (AABB shora), stun. |
| `nut.js` | `NutManager`/`Nut`: barevné ořechy, sběr jen shodnou barvou, `!` past. |
| `chaser.js` | `Chaser`: "stín" — zaznamenává trasu cíle a přehrává ji zpožděně (`CHASER_DELAY`); kolize → game over. |
| `obstacle.js` | `ObstacleManager`: padající šišky, stun, škálování obtížnosti časem. |
| `sprites.js` | Pixel-art sprity na offscreen canvasech (medvěd/ořech/strom/šiška), `blit`. |
| `audio.js` | WebAudio SFX (skok, sběr, stun, past, konec). |
| `hud.js` | Skóre, čas, obtížnost. |
| `menu.js` | Úvodní menu (výběr počtu) + obrazovka game over. |

## Klíčová pravidla mechanik
- **Barevné ořechy:** `Nut.ownerId` = barva hráče; `NutManager.collect()` porovnává
  `player.id === nut.ownerId`. Skóre je **společné** (`game.score`).
- **`!` ořech:** `special=true` → místo skóre `spawnChaser(target)` v `main.js`.
- **Honič (stín):** `Chaser` ukládá polohy spawnera do fronty a přehrává je o `CHASER_DELAY` s
  později (přesně kopíruje trasu vč. skoků a wrapu). Během náskoku (`active=false`) nechytá.
  Po aktivaci chytá **kteréhokoli** hráče (loop v `updatePlay`), ne jen spawnera → `state=OVER`.
- **Wrap okrajů:** `Player` se při přejetí pravého/levého okraje teleportuje na druhou stranu.
- **Ledové plošiny:** plošina s `ice:true` (v `level.js`) → `Player.onIce`; horizontální pohyb
  má setrvačnost (pomalé zrychlení/brzdění = klouzání). Vykreslení světle modré (`drawPlatforms`).
  Honič klouže automaticky (kopíruje polohy hráče).
- **Plynulost:** render interpoluje mezi kroky (`alpha = acc/STEP`); entity drží `px/py`.
  Interpolace se přeskočí při wrapu (skok > půl obrazovky).
- **Výkon — ŽÁDNÉ emoji v per-frame renderu.** Barevné emoji glyfy (`🌰🐻…`) jsou v Canvas
  `fillText` na Linuxu velmi pomalé (rasterují se každý snímek) → seká to. Ikony kresli
  jako sprity (`nutSprite` přes `drawImage`) nebo obyčejný text/tvary. Gradient oblohy je cachovaný.
- **Zvuk:** `audio.js` plánuje tóny přes hodiny WebAudia (bez `setTimeout`) a throttluje stejné
  zvuky (víc hráčů naráz nezahltí). Ztlumení klávesou `M`.
- **Obtížnost:** `ObstacleManager.interval` klesá s `elapsed` (viz `DIFFICULTY_RAMP`).

## Ovládání
P1 WASD · P2 šipky · P3 IJKL · P4 numpad 1/3 pohyb, 5 skok, 2 dolů. Skok = horní klávesa.
Mapa v `input.js` (`MAP`).
