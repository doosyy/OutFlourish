#!/usr/bin/env node
// Downloads species photos from Unsplash and writes them to public/species/.
// Run via `npm run fetch:photos`. Skips files that already exist.

import { mkdirSync, existsSync, createWriteStream, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'species')

// id → Unsplash photo id (matches data in src/speciesDb.ts)
const PHOTOS = {
  'monstera-deliciosa':     '1614594975525-e45190c55d0b',
  'fiddle-leaf-fig':        '1545241047-6083a3684587',
  'peace-lily':             '1593691509543-c55fb32d8de5',
  'snake-plant-laurentii':  '1593482892290-f54927ae1bb6',
  'golden-pothos':          '1463320726281-696a485928c7',
  'hoya-kerrii':            '1485955900006-10f4d324d411',
}

const URL_FOR = (id) =>
  `https://images.unsplash.com/photo-${id}?w=720&q=80&auto=format&fit=crop`

mkdirSync(outDir, { recursive: true })

let downloaded = 0
let skipped = 0
let failed = 0

for (const [speciesId, photoId] of Object.entries(PHOTOS)) {
  const outPath = join(outDir, `${speciesId}.jpg`)
  if (existsSync(outPath) && statSync(outPath).size > 0) {
    skipped++
    continue
  }
  const url = URL_FOR(photoId)
  process.stdout.write(`  ↓ ${speciesId}.jpg ... `)
  try {
    const res = await fetch(url)
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
    await pipeline(res.body, createWriteStream(outPath))
    const size = statSync(outPath).size
    console.log(`${(size / 1024).toFixed(0)} KB`)
    downloaded++
  } catch (err) {
    console.log(`FAILED: ${err.message}`)
    failed++
  }
}

console.log(`\nDone. ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`)
process.exit(failed > 0 ? 1 : 0)
