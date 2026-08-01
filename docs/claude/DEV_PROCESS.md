# Dev proces

## Spuštění (nutný HTTP server kvůli ES modulům)
```
cd orech1
python3 -m http.server 8137
# otevři http://localhost:8137/index.html
```

## Hraní
1. V menu zvol počet hráčů klávesami `1`–`4`.
2. `MEZERNÍK` = start (i restart na obrazovce konce).
3. Ovládání: P1 WASD · P2 šipky · P3 IJKL · P4 numpad 1/3 + 5 skok.
4. Sbírej ořech **své barvy** (jasná barevná svatozář). `!` ořech = past → honič → konec.

## Automatické testy (Playwright přes systémový Chrome)
> **Pozn.:** tyto testy nejsou součástí repozitáře — jde o dočasné skripty psané ad hoc
> do lokálního `tmp` adresáře. Popis níže slouží jako recept, jak si je znovu vytvořit.

Skripty (`orech_test.mjs`, `orech_collect.mjs`, `orech_mech.mjs`) vyžadují běžící server
na portu 8137 a pokrývají:
- načtení stránky, běh smyčky, pohyb 4 hráčů, screenshot
- sběr ořechů: shodná barva sbírá, jiná ne
- `!` past → honič → game over

Chrome se pouští s `executablePath` na systémový prohlížeč (nainstalované PW browsery
mívají nesouhlasnou verzi s lokálním modulem Playwrightu).

## Ladicí hook
`window.__game` odkazuje na centrální stav (state, players, nuts, obstacles, chasers, score).

## Kontrola syntaxe modulů
```
tmp=$(mktemp -d); for f in js/*.js; do cp "$f" "$tmp/$(basename ${f%.js}).mjs"; done
for f in "$tmp"/*.mjs; do node --check "$f" && echo "OK $f"; done; rm -rf "$tmp"
```
