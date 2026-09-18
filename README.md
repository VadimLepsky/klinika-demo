# demo.clinic — Provize lékařů (UI demo)

Interaktivní demo dashboardu pro výpočet a správu provizí lékařů za doporučení
na placené služby kliniky. Slouží jako ukázka do případové studie — je to plná
kopie produkčního rozhraní, ale bez napojení na CRM a databázi.

## Co je uvnitř

| Sekce | Obsah |
| --- | --- |
| **Přehled** | KPI za měsíc (vč. koeficientu doporučení), vývoj doporučení a provizí, tabulka lékařů s výplatní checkboxem a koeficientem |
| **Karta lékaře** | Grafy po měsících (doporučení, provize, pacienti a koeficient), koláčový rozpad provizí podle kategorií, jednotlivé položky s číslem návštěvy, checkbox „Vyplaceno“ |
| **Vyžaduje pozornost** | Nepřiřazené zdroje doporučení (s návrhem lékaře), zaměstnanci bez označení, nové kategorie bez pravidla, nerozpoznané položky účtenek |
| **Období** | Uzávěrka měsíců — uzavřít lze jen měsíc bez nevyřešených položek |
| **Nastavení** | Pravidla provizí s verzovanými sazbami a historií, kategorie z CRM, výjimky, zdroje, zaměstnanci, uživatelé (role, pozvánky) |
| **Historie změn** | Auditní log každé změny pravidel — kdo, kdy, z čeho na co |

## Jak demo funguje

V produkci data počítá worker nad daty z CRM a ukládá je do Postgresu; aplikace
je jen čte a spravuje nad nimi pravidla. V tomto demu je datová vrstva
nahrazena deterministicky generovaným datasetem v paměti serveru
(`lib/demo/seed.ts`), takže:

- všechna tlačítka, dialogy a filtry fungují a mění stav,
- každá změna se zapisuje do historie změn stejně jako v produkci,
- data jsou smyšlená — jména lékařů, zdroje i částky.

Demo se otevírá rovnou na přehledu, bez přihlášení.

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
