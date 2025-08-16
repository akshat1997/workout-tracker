export type CatalogExercise = {
  id: string
  name: string
  primaryMuscles?: string[]
  category?: string
}

export type SimplifiedExercise = {
  externalId: string
  name: string
  muscleGroup?: string
}

export async function fetchFreeExerciseDb(limit: number = 300): Promise<SimplifiedExercise[]> {
  const url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
  const headers = { Accept: 'application/json' }

  const tryUrls = [
    url,
    `https://cors.isomorphic-git.org/${url}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ]

  let data: CatalogExercise[] | null = null
  for (const u of tryUrls) {
    try {
      const res = await fetch(u, { headers })
      if (res.ok) {
        data = (await res.json()) as CatalogExercise[]
        break
      }
    } catch {}
  }
  if (!data) return []

  const out: SimplifiedExercise[] = []
  for (const ex of data) {
    if (!ex?.name) continue
    const group = ex.primaryMuscles?.[0] || ex.category
    out.push({ externalId: `freeexercise-${ex.id || ex.name}`, name: ex.name, muscleGroup: group || undefined })
    if (out.length >= limit) break
  }
  return out
}


