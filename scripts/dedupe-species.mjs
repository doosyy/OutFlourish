#!/usr/bin/env node
// Analyze (and optionally remove) duplicate-id species entries in speciesDb.ts.
// Usage: node scripts/dedupe-species.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dbPath = join(root, 'src', 'speciesDb.ts')
const APPLY = process.argv.includes('--apply')
const src = readFileSync(dbPath, 'utf8')
const lines = src.split('\n')

// Find top-level array-element objects: lines that are exactly '  {' ... '  },'
const entries = [] // {start, end, id, text}
let depth = 0, start = -1
for (let i = 0; i < lines.length; i++) {
  const l = lines[i]
  if (/^ {2}\{\s*$/.test(l) && depth === 0) { start = i; depth = 1; continue }
  if (start === -1) continue
  // track braces within entry
  for (const ch of l) { if (ch === '{') depth++; else if (ch === '}') depth-- }
  if (depth === 0) {
    const text = lines.slice(start, i + 1).join('\n')
    const idM = text.match(/^\s*id:\s*'([^']*)'/m)
    entries.push({ start, end: i, id: idM ? idM[1] : '??', text })
    start = -1
  }
}

// group by id
const byId = new Map()
for (const [idx, e] of entries.entries()) {
  if (!byId.has(e.id)) byId.set(e.id, [])
  byId.get(e.id).push({ ...e, idx })
}

const score = (t) => (t.includes('careGuideDeep') ? 100000 : 0) + t.length
const removeIdx = new Set()

console.log(`Total entries: ${entries.length}`)
for (const [id, list] of byId) {
  if (list.length < 2) continue
  console.log(`\n=== ${id} (${list.length}x) ===`)
  const ranked = [...list].sort((a, b) => score(b.text) - score(a.text))
  for (const e of list) {
    const name = (e.text.match(/name:\s*(['"])(.*?)\1/) || [])[2]
    console.log(`  lines ${e.start + 1}-${e.end + 1}  name="${name}"  deep=${e.text.includes('careGuideDeep')}  len=${e.text.length}  keep=${e === ranked[0]}`)
  }
  // keep ranked[0], remove the rest
  for (const e of ranked.slice(1)) removeIdx.add(e.idx)
}

console.log(`\nWould remove ${removeIdx.size} entries.`)
if (!APPLY) { console.log('(dry run, use --apply)'); process.exit(0) }

// Rebuild file: drop removed entries' line ranges.
const drop = new Set()
for (const idx of removeIdx) {
  const e = entries[idx]
  for (let i = e.start; i <= e.end; i++) drop.add(i)
}
const out = lines.filter((_, i) => !drop.has(i))
writeFileSync(dbPath, out.join('\n'))
console.log(`Removed ${removeIdx.size} duplicate entries. New line count: ${out.length}`)
