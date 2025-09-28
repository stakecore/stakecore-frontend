export function chainFromRoute(route: string): string | null {
  let chain = null
  if (route.includes('flare')) {
    chain = 'flare'
  } else if (route.includes('songbird')) {
    chain = 'songbird'
  } else if (route.includes('avalanche')) {
    chain = 'avalanche'
  }
  return chain
}