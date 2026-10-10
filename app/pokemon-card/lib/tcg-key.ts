export function tcgApiKey() {
  return process.env.POKEMONTCG_API_KEY || process.env.PTCG_KEY || ''
}

export function tcgApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'kuzeykose.com pokemon-card',
  }
  const key = tcgApiKey()
  if (key) headers['X-Api-Key'] = key
  return headers
}
