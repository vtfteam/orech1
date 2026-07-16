# Dev proces

## Spuštění (nutný HTTP server kvůli ES modulům)
```
cd /home/lulin/Working/orech1
python3 -m http.server 8137
# otevři http://localhost:8137/index.html
```

## Hraní
1. V menu zvol počet hráčů klávesami `1`–`4`.
2. `MEZERNÍK` = start (i restart na obrazovce konce).
3. Ovládání: P1 WASD · P2 šipky · P3 IJKL · P4 numpad 1/3 + 5 skok.
4. Sbírej ořech **své barvy** (jasná barevná svatozář). `!` ořech = past → honič → konec.

## Automatické testy (Playwright přes systémový Chrome)
Testy leží v `/tmp/orech_*.mjs` (dočasné). Vyžadují běžící server na portu 8137.
```
node /tmp/orech_test.mjs      # načtení, běh, pohyb 4 hráčů, screenshot /tmp/orech_play.png
node /tmp/orech_collect.mjs   # sběr: shodná barva sbírá, jiná ne
node /tmp/orech_mech.mjs      # ! past → honič → game over
```
Chrome se pouští s `executablePath: '/usr/bin/google-chrome'` (nainstalované PW browsery
mají nesouhlasnou verzi). Modul PW: `/usr/local/lib/node_modules/@playwright/mcp/node_modules/playwright`.

## Ladicí hook
`window.__game` odkazuje na centrální stav (state, players, nuts, obstacles, chasers, score).

## Kontrola syntaxe modulů
```
tmp=$(mktemp -d); for f in js/*.js; do cp "$f" "$tmp/$(basename ${f%.js}).mjs"; done
for f in "$tmp"/*.mjs; do node --check "$f" && echo "OK $f"; done; rm -rf "$tmp"
```
