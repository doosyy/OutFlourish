// OutFlourish species library — restructured per designer's data contract.
// To add a species, append an entry to SPECIES_DB. The Plant Detail screen
// renders every field automatically.

import type { LightLevel } from './store'

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type Humidity   = 'Low' | 'Medium' | 'High'
export type ToxicTo    = 'pets' | 'children' | 'both'

export interface CareGuide {
  light:   string
  water:   string
  food:    string
  season:  string
  trouble: string
}

export interface SpeciesProfile {
  /** Stable kebab-case id. Used as a foreign key from Plant.speciesId. Never change once published. */
  id: string
  /** Common name. Displayed in italic across the app. */
  name: string
  /** Latin binomial. Shown beneath the common name. */
  scientificName: string
  /** Alternate names for search (case-insensitive substring match). */
  aliases: string[]
  /** Relative path to bundled photo (e.g. `/species/monstera-deliciosa.jpg`)
   *  OR full Unsplash CDN URL while we bootstrap. The download script in
   *  scripts/fetch-species-photos.mjs will materialise these locally. */
  photo: string
  baseIntervalDays: number
  recommendedMl: number
  winterMl: number
  difficulty: Difficulty
  humidity: Humidity
  light: LightLevel
  toxic: boolean
  toxicTo?: ToxicTo
  careGuide: CareGuide
  /** Optional anthropomorphic line shown when adding this species. */
  defaultMood?: string
}

// ─── The library ─────────────────────────────────────────────────────────────

export const SPECIES_DB: SpeciesProfile[] = [
  {
    id: 'monstera-deliciosa',
    name: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    aliases: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
    photo: '/species/monstera-deliciosa.jpg',
    baseIntervalDays: 10,
    recommendedMl: 240,
    winterMl: 160,
    difficulty: 'Beginner',
    humidity: 'Medium',
    light: 'medium',
    toxic: true,
    toxicTo: 'both',
    careGuide: {
      light: 'Bright indirect light. Morning sun is fine; harsh afternoon sun scorches the leaves. About a metre from an east-facing window is ideal.',
      water: 'When the top 3–4cm of soil is dry. About 240 ml — water steadily until you see drainage from the bottom of the pot. Drowning is the more common death than letting it dry out. Trust the meter, not the calendar.',
      food: 'Half-strength balanced liquid feed every 4 weeks from October to March. Off the menu in autumn and winter.',
      season: 'Peak growth Oct–Mar. Slows in cool months — dial water back to ~160 ml and extend interval by 30% through June and July. Wipe leaves monthly for light.',
      trouble: 'Yellow leaves → overwatered. Brown crispy edges → low humidity or thirst. No fenestrations → wants more light or maturity.',
    },
    defaultMood: 'Brooding magnificently in the corner.',
  },
  {
    id: 'fiddle-leaf-fig',
    name: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    aliases: ['FLF'],
    photo: '/species/fiddle-leaf-fig.jpg',
    baseIntervalDays: 7,
    recommendedMl: 360,
    winterMl: 240,
    difficulty: 'Advanced',
    humidity: 'Medium',
    light: 'bright',
    toxic: true,
    toxicTo: 'both',
    careGuide: {
      light: 'Bright indirect light, consistent placement. Will protest any move with leaf drops. Find a happy spot and leave it.',
      water: 'When the top 3–4cm is dry. About 360 ml — water until drainage. Drooping = thirsty. Spotting + drooping = root rot. The meter tells you which.',
      food: 'High-nitrogen liquid feed monthly Oct–Mar. Essential for the big leaves.',
      season: 'Reduce watering 20% in winter. Clean leaves with a damp cloth monthly — dust shades them unfairly.',
      trouble: 'Brown spots → fungal or root rot. Leaf drop → moved or cold draft. Yellowing → overwatered.',
    },
    defaultMood: 'Stoic. Easily offended.',
  },
  {
    id: 'peace-lily',
    name: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    aliases: ['White Sails'],
    photo: '/species/peace-lily.jpg',
    baseIntervalDays: 5,
    recommendedMl: 250,
    winterMl: 180,
    difficulty: 'Beginner',
    humidity: 'High',
    light: 'low',
    toxic: true,
    toxicTo: 'both',
    careGuide: {
      light: 'Low to medium indirect light. One of the best for darker rooms. Avoid direct sun.',
      water: 'When the leaves just start to droop (before full wilt). About 250 ml until drainage. Likes consistency — keep lightly moist.',
      food: 'Half-strength balanced feed every 6 weeks Oct–Mar. Too much fertiliser = browning leaf tips.',
      season: 'Big drinker in summer (every 3–4 days). Dial back in winter. Filtered water — sensitive to fluoride.',
      trouble: 'Brown leaf tips → tap-water fluoride or low humidity. Drooping despite moist soil → root rot. Not flowering → needs more light.',
    },
    defaultMood: 'Quietly dramatic about hydration.',
  },
  {
    id: 'snake-plant-laurentii',
    name: 'Snake Plant Laurentii',
    scientificName: "Dracaena trifasciata 'Laurentii'",
    aliases: ['Sansevieria', "Mother-in-Law's Tongue"],
    photo: '/species/snake-plant-laurentii.jpg',
    baseIntervalDays: 14,
    recommendedMl: 180,
    winterMl: 100,
    difficulty: 'Beginner',
    humidity: 'Low',
    light: 'low',
    toxic: true,
    toxicTo: 'pets',
    careGuide: {
      light: 'Tolerates almost any light, from very low to bright indirect. Direct sun is possible but causes yellowing.',
      water: 'When the soil is completely dry. About 180 ml. One of the most drought-tolerant houseplants. In winter, water as rarely as once per month.',
      food: 'Once in spring and once in summer with balanced fertiliser. Bare minimum.',
      season: 'Practically dormant in winter — barely water (~100 ml every 3–4 weeks). Resume normal care October.',
      trouble: 'Mushy leaves → overwatered (the only real risk). Brown crispy tips → cold draft. Yellowing → too much sun or too much water.',
    },
    defaultMood: 'Unflappable. Will outlive your lease.',
  },
  {
    id: 'golden-pothos',
    name: 'Golden Pothos',
    scientificName: 'Epipremnum aureum',
    aliases: ["Devil's Ivy", 'Pothos'],
    photo: '/species/golden-pothos.jpg',
    baseIntervalDays: 7,
    recommendedMl: 150,
    winterMl: 90,
    difficulty: 'Beginner',
    humidity: 'Medium',
    light: 'medium',
    toxic: true,
    toxicTo: 'both',
    careGuide: {
      light: 'Tolerates low to bright indirect light. Avoid direct sun — scorches leaves.',
      water: 'When the top 2–3cm of soil is dry. About 150 ml until drainage. Drooping leaves = thirsty (not overwatered).',
      food: 'Balanced liquid fertiliser every 4 weeks in spring/summer. Skip autumn and winter.',
      season: 'Summers: water every 5–6 days. Move away from heating vents in winter — dry air causes brown tips. Reduce to every 10–14 days in winter.',
      trouble: 'Yellow leaves → overwatering. Brown tips → low humidity or fluoride in tap water. Leggy vines → insufficient light.',
    },
    defaultMood: 'Reliably enthusiastic, like a golden retriever.',
  },
  {
    id: 'hoya-kerrii',
    name: 'Hoya Kerrii',
    scientificName: 'Hoya kerrii',
    aliases: ['Sweetheart Hoya', 'Lucky Heart', 'Valentine Hoya'],
    photo: '/species/hoya-kerrii.jpg',
    baseIntervalDays: 14,
    recommendedMl: 120,
    winterMl: 80,
    difficulty: 'Beginner',
    humidity: 'Low',
    light: 'bright',
    toxic: false,
    careGuide: {
      light: 'Bright indirect light. Tolerates a little direct morning sun. Single-leaf cuttings need stable, gentle conditions.',
      water: 'Every 10–14 days. About 120 ml. The waxy leaves store water — overwater and they rot.',
      food: 'Every 4–6 weeks spring/summer with diluted balanced fertiliser.',
      season: 'Very drought tolerant. Reduce to monthly watering in winter. Will survive near a sunny window year-round.',
      trouble: 'Yellowing leaves → overwatering. Wrinkled leaves → underwatered — give a thorough soak. Not growing → single-leaf cuttings lack a node, so growth is impossible.',
    },
    defaultMood: 'Quietly affectionate. Stores water in her hearts.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function searchSpecies(query: string): SpeciesProfile[] {
  const q = query.trim().toLowerCase()
  if (!q) return SPECIES_DB
  return SPECIES_DB.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.scientificName.toLowerCase().includes(q) ||
    s.aliases.some(a => a.toLowerCase().includes(q)),
  )
}

export function getSpeciesById(id: string): SpeciesProfile | undefined {
  return SPECIES_DB.find(s => s.id === id)
}

export function getSpeciesByDifficulty(level: Difficulty): SpeciesProfile[] {
  return SPECIES_DB.filter(s => s.difficulty === level)
}

export function getSpeciesByLight(light: LightLevel): SpeciesProfile[] {
  return SPECIES_DB.filter(s => s.light === light)
}
