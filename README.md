# demo.clinic — Provize lékařů (UI demo)

Interaktivní demo dashboardu pro výpočet a správu provizí lékařů za doporučení
na placené služby kliniky. Slouží jako ukázka do případové studie — je to plná
kopie produkčního rozhraní, ale bez napojení na CRM a databázi.

**Demo přihlášení:** `spravce@demo.clinic` / `demo1234`

## Co je uvnitř

| Sekce | Obsah |
| --- | --- |
| **Přehled** | KPI za měsíc, vývoj doporučení a provizí, tabulka lékařů s koeficientem |
| **Karta lékaře** | Grafy po měsících, rozpad provizí podle skupin, jednotlivé položky se stavem |
| **Vyžaduje pozornost** | Nepřiřazené zdroje doporučení (s návrhem lékaře), zaměstnanci bez označení, nové kategorie bez sazby, nerozpoznané položky účtenek |
| **Období** | Uzávěrka měsíců — uzavřít lze jen měsíc bez nevyřešených položek |
| **Nastavení** | Skupiny provizí, verzované sazby s historií, mapování kategorií a služeb, výjimky, zdroje, zaměstnanci |
| **Historie změn** | Auditní log každé změny pravidel — kdo, kdy, z čeho na co |

## Jak demo funguje

V produkci data počítá worker nad daty z CRM a ukládá je do Postgresu; aplikace
je jen čte a spravuje nad nimi pravidla. V tomto demu je datová vrstva
nahrazena deterministicky generovaným datasetem v paměti serveru
(`lib/demo/seed.ts`), takže:

- všechna tlačítka, dialogy a filtry fungují a mění stav,
- každá změna se zapisuje do historie změn stejně jako v produkci,
- data jsou smyšlená — jména lékařů, zdroje i částky.

Stav žije v paměti běžícího procesu, takže se po restartu (nebo studeném startu
serverless funkce) vrátí do výchozí podoby.

## Spuštění lokálně

```bash
npm install
npm run dev
```

## Stack

Next.js 16 (App Router, server actions), React 19, Tailwind CSS 4,
shadcn/ui + Base UI, Recharts.
