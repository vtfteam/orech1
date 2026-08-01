# 🐻 Medvědi sbírají ořechy

Kooperativní 2D plošinovka v prohlížeči pro **1–4 hráče na jedné klávesnici**.
Čistý HTML5 Canvas + vanilla JS, bez závislostí a bez build kroku.

## ▶️ Hrát online
**<https://vtfteam.github.io/orech1/>**

## Spuštění lokálně
ES moduly vyžadují HTTP server (ne `file://`):
```bash
cd orech1
python3 -m http.server 8137
# otevři http://localhost:8137/index.html
```

## Ovládání
| Hráč | Vlevo | Vpravo | Skok |
|------|-------|--------|------|
| P1 červený | A | D | W |
| P2 modrý | ← | → | ↑ |
| P3 zelený | J | L | I |
| P4 žlutý | numpad 1 | numpad 3 | numpad 5 |

Menu: klávesy **1–4** zvolí počet hráčů, **mezerník** spustí hru. **M** = ztlumit zvuk.

## Hratelnost
- Sbírej ořechy **své barvy** (barevná svatozář) → společné skóre.
- Ořech s **„!"** = past: spawne **honiče-stín**, který opakuje tvou trasu se zpožděním
  a chytí kohokoli → **konec hry** (se zpomaleným replayem smrti).
- **Prostřední plošiny jsou ledové** — kloužou.
- **Sklenice medu** jednou za minutu nahoře: kdo ji sebere, ztratí jednoho honiče.
- Padající šišky na chvíli omráčí. Obtížnost roste s časem.

## Dokumentace
- Architektura: [`docs/claude/ARCHITECTURE.md`](docs/claude/ARCHITECTURE.md)
- Dev proces / testy: [`docs/claude/DEV_PROCESS.md`](docs/claude/DEV_PROCESS.md)

## Licence
[MIT](LICENSE)
