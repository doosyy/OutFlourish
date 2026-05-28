// speciesLoader — lazy access to the species DB (138 unique species).
//
// speciesDb.ts is ~140 kB of source (the bulk is rich care-guide prose).
// Loading it in the initial chunk made the bundle 538 kB. This loader
// dynamic-imports it on first use and caches the resolved module so the
// second caller is synchronous.
//
// Type-only imports (SpeciesProfile, Difficulty, etc.) remain static at
// every call site — `import type` is erased at build time and adds zero
// bytes to any chunk.

import { useEffect, useState } from 'react'
import type * as SpeciesDbModule from './speciesDb'

type Mod = typeof SpeciesDbModule

let cached: Mod | null = null
let loading: Promise<Mod> | null = null

/** Kick off a load. Subsequent calls return the cached module. */
export function loadSpeciesDb(): Promise<Mod> {
  if (cached) return Promise.resolve(cached)
  if (!loading) {
    loading = import('./speciesDb').then(mod => {
      cached = mod
      return mod
    })
  }
  return loading
}

/** Synchronously return the cached module, or null if not loaded yet. */
export function getCachedSpeciesDb(): Mod | null {
  return cached
}

/** Hook that loads the DB on mount and returns the module (or null while loading). */
export function useSpeciesDb(): Mod | null {
  const [mod, setMod] = useState<Mod | null>(cached)
  useEffect(() => {
    if (mod) return
    let alive = true
    loadSpeciesDb().then(m => { if (alive) setMod(m) })
    return () => { alive = false }
  }, [mod])
  return mod
}

/** Convenience hook for a single species lookup. */
export function useSpecies(id: string | undefined): SpeciesDbModule.SpeciesProfile | null {
  const mod = useSpeciesDb()
  if (!mod || !id) return null
  return mod.getSpeciesById(id) ?? null
}
