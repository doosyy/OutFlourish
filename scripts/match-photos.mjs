#!/usr/bin/env node
// One-off: match user-supplied photos (named by plant name) to species ids,
// convert/resize to 720px jpg into public/species/, and patch speciesDb.ts.
// Usage: node scripts/match-photos.mjs [--apply]

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const SRC_FOLDER = '/Users/christopherdoos/Documents/ComfyUI/output/houseplants_mj/best'
const outDir = join(root, 'public', 'species')
const dbPath = join(root, 'src', 'speciesDb.ts')
const APPLY = process.argv.includes('--apply')

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// --- parse speciesDb for {id, name} in file order ---
const db = readFileSync(dbPath, 'utf8')
const lines = db.split('\n')
const species = [] // {id, name}
let curId = null
for (const line of lines) {
  const idM = line.match(/^\s*id:\s*'([^']*)'/)
  if (idM) { curId = idM[1]; continue }
  const nameM = line.match(/^\s*name:\s*(['"])(.*?)\1/)
  if (nameM && curId) { species.push({ id: curId, name: nameM[2] }); curId = null }
}

// normalized name -> [ids]
const byName = new Map()
for (const s of species) {
  const k = norm(s.name)
  if (!byName.has(k)) byName.set(k, [])
  byName.get(k).push(s.id)
}

// --- list photos ---
const files = readdirSync(SRC_FOLDER).filter((f) => /\.(png|jpe?g)$/i.test(f))

const matched = []   // {file, ids:[], photoName}
const unmatched = []
for (const f of files) {
  const stem = basename(f, extname(f))
  const k = norm(stem)
  const ids = byName.get(k)
  if (ids) matched.push({ file: f, ids, stem })
  else unmatched.push(f)
}

const matchedIds = new Set(matched.flatMap((m) => m.ids))
const speciesNoPhoto = species.filter((s) => !matchedIds.has(s.id) && !['monstera-deliciosa','fiddle-leaf-fig','peace-lily','snake-plant-laurentii','golden-pothos','hoya-kerrii'].includes(s.id))

console.log(`\n=== MATCHED ${matched.length} photos -> ${matchedIds.size} species ids ===`)
for (const m of matched) console.log(`  ${m.file}  ->  ${m.ids.join(', ')}`)
console.log(`\n=== UNMATCHED photos (${unmatched.length}) ===`)
for (const f of unmatched) console.log(`  ${f}`)
console.log(`\n=== species still WITHOUT photo (${speciesNoPhoto.length}) ===`)
for (const s of speciesNoPhoto) console.log(`  ${s.id}  (${s.name})`)

if (!APPLY) { console.log('\n(dry run. re-run with --apply to copy + patch)'); process.exit(0) }

// --- convert + copy ---
mkdirSync(outDir, { recursive: true })
const idToJpg = new Map() // id -> '/species/<file>.jpg'
for (const m of matched) {
  // one jpg per source file, named after the FIRST id (shared by dup names)
  const jpgName = `${m.ids[0]}.jpg`
  const outPath = join(outDir, jpgName)
  execFileSync('sips', ['-Z', '720', '-s', 'format', 'jpeg', join(SRC_FOLDER, m.file), '--out', outPath], { stdio: 'ignore' })
  for (const id of m.ids) idToJpg.set(id, `/species/${m.ids[0]}.jpg`)
}
console.log(`\nConverted ${matched.length} photos into ${outDir}`)

// --- clear the original Unsplash placeholders not covered by the AI set ---
const clearIds = ['monstera-deliciosa', 'fiddle-leaf-fig', 'peace-lily', 'snake-plant-laurentii', 'golden-pothos']
for (const id of clearIds) {
  const p = join(outDir, `${id}.jpg`)
  if (existsSync(p)) { rmSync(p); console.log(`  removed ${id}.jpg`) }
}

// --- patch speciesDb.ts: set photo for matched ids, clear originals, preserve others ---
let curId2 = null
const out = lines.map((line) => {
  const idM = line.match(/^\s*id:\s*'([^']*)'/)
  if (idM) { curId2 = idM[1]; return line }
  const photoM = line.match(/^(\s*)photo:\s*('[^']*'|"[^"]*"),?\s*$/)
  if (photoM && curId2 && idToJpg.has(curId2)) {
    return `${photoM[1]}photo: '${idToJpg.get(curId2)}',`
  }
  if (photoM && curId2 && clearIds.includes(curId2)) {
    return `${photoM[1]}photo: '',`
  }
  return line
})
writeFileSync(dbPath, out.join('\n'))
console.log('Patched src/speciesDb.ts')
