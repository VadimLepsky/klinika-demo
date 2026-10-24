// Lists Czech UI strings that have no English entry in lib/i18n/messages/en.ts.
//   node scripts/i18n-check.mjs          → missing keys (exit 1 if any)
//   node scripts/i18n-check.mjs --unused → also catalog keys no longer found in source
//
// Messages are keyed by their Czech text, so "keys" here are: literal arguments of
// t()/tr()/tn(), `label:` values and the values of Czech label maps, every string
// literal with Czech diacritics, and the free-text strings of the demo seed.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = new URL("..", import.meta.url).pathname
const SKIP = ["components/ui/", "lib/i18n/", "node_modules", ".next", "scripts/"]
// Strings with diacritics that are not UI text (transliteration table, regexes, month names handled by format.ts).
const IGNORE_FILES = ["lib/format.ts"]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const rel = relative(root, p)
    if (SKIP.some((s) => rel.startsWith(s) || rel.includes(`/${s}`))) continue
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(rel)
  }
  return out
}

const CZ = /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/
const STR = String.raw`"((?:[^"\\\n]|\\.)*)"`
const SQ = String.raw`'((?:[^'\\\n]|\\.)*)'`

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
}

const keys = new Map() // key -> first location

function add(key, file) {
  const k = JSON.parse(`"${key}"`)
  if (!k.trim() || !keys.has(k)) keys.set(k, file)
}

const SEED = "lib/demo/seed.ts"

for (const file of walk(root).filter((f) => /^(app|components|lib)\//.test(f) && f !== SEED)) {
  const src = stripComments(readFileSync(join(root, file), "utf8"))
  for (const m of src.matchAll(new RegExp(String.raw`\b(?:t|tr)\(\s*${STR}`, "g"))) add(m[1], file)
  for (const m of src.matchAll(new RegExp(String.raw`\b(?:t|tr)\(\s*${SQ}`, "g"))) add(m[1].replace(/"/g, '\\"'), file)
  for (const m of src.matchAll(new RegExp(String.raw`\btn\(\s*[^,]+,\s*${STR},\s*${STR},\s*${STR}`, "g"))) {
    add(m[1], file), add(m[2], file), add(m[3], file)
  }
  if (IGNORE_FILES.includes(file)) continue
  for (const m of src.matchAll(new RegExp(String.raw`\blabel:\s*${STR}`, "g"))) add(m[1], file)
  for (const m of src.matchAll(new RegExp(STR, "g"))) if (CZ.test(m[1])) add(m[1], file)
}

// Label maps whose values carry no diacritics ("Zdroje", "Sazby"…): pick up every value.
for (const file of ["lib/labels.ts", "components/audit/value-diff.tsx", "app/(app)/audit/page.tsx"]) {
  const src = readFileSync(join(root, file), "utf8")
  for (const m of src.matchAll(new RegExp(String.raw`^\s+"?[\w.]+"?:\s*${STR},?$`, "gm"))) add(m[1], file)
}

// Seed: every string literal that reads like text (has a lowercase word of 3+ letters
// and isn't an id, email, date, key or a person's name).
{
  const file = SEED
  const src = stripComments(readFileSync(join(root, file), "utf8"))
  for (const m of src.matchAll(new RegExp(STR, "g"))) {
    const s = m[1]
    if (!/[a-zA-Záčďéěíňóřšťúůýž]{3,}/.test(s)) continue
    if (/^[a-z0-9_.:-]+$/.test(s)) continue // keys, actions
    if (/@|^\d{4}-\d\d|^[./]/.test(s)) continue // emails, dates, import paths
    if (/^(MUDr\.|Mgr\.|Bc\.)/.test(s)) continue // doctor names
    if (/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+ [A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+$/.test(s)) continue // "Jana Dostálová"
    add(s, file)
  }
}

const { en } = await import(join(root, "lib/i18n/messages/en.ts")).catch(async () => {
  // Node without TS support: evaluate the object literal.
  const text = readFileSync(join(root, "lib/i18n/messages/en.ts"), "utf8")
  const body = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
  return { en: Function(`return (${body})`)() }
})

const missing = [...keys].filter(([k]) => !(k in en))
for (const [k, file] of missing) console.log(`missing  ${JSON.stringify(k)}  (${file})`)

if (process.argv.includes("--unused")) {
  for (const k of Object.keys(en)) if (!keys.has(k)) console.log(`unused   ${JSON.stringify(k)}`)
}

console.log(`\n${keys.size} keys, ${missing.length} missing`)
process.exit(missing.length ? 1 : 0)
