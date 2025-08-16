type WgerPaged<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

type WgerExerciseInfo = {
  id: number
  name: string
  category?: { id: number; name: string }
  muscles?: { id: number; name: string }[]
  muscles_secondary?: { id: number; name: string }[]
}

export type SimplifiedExercise = {
  externalId: string
  name: string
  muscleGroup?: string
}

async function resilientGetJson<T>(url: string): Promise<T> {
  const headers = { Accept: 'application/json' }
  try {
    const r = await fetch(url, { headers })
    if (r.ok) return (await r.json()) as T
    throw new Error(`HTTP ${r.status}`)
  } catch {
    const proxies = [
      (u: string) => `https://cors.isomorphic-git.org/${u}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ]
    for (const make of proxies) {
      const proxied = make(url)
      try {
        const r2 = await fetch(proxied, { headers })
        if (r2.ok) return (await r2.json()) as T
      } catch {}
    }
    throw new Error('All fetch attempts failed')
  }
}

export async function fetchWgerExercises(max: number = 300): Promise<SimplifiedExercise[]> {
  const baseUrl = 'https://wger.de/api/v2/exerciseinfo/'
  const params = new URLSearchParams({ language: '2', status: '2', limit: '50' })

  let url = `${baseUrl}?${params.toString()}`
  const collected: SimplifiedExercise[] = []

  while (url && collected.length < max) {
    const data = await resilientGetJson<WgerPaged<WgerExerciseInfo>>(url)
    for (const ex of data.results) {
      const name = (ex as any).name && String((ex as any).name).trim()
      if (!name) continue
      const primary = (ex.muscles && ex.muscles[0]?.name) || ex.category?.name
      collected.push({ externalId: `wger-${ex.id}`, name, muscleGroup: primary || undefined })
      if (collected.length >= max) break
    }
    url = data.next || ''
  }

  return collected
}


