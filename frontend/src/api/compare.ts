import apiClient from './client'
import type { PlayerDetail, StatsSummary } from './players'

export interface CompareEntry {
  player: PlayerDetail
  stats: StatsSummary | null
}

export interface ComparePayload {
  players: CompareEntry[]
}

/**
 * Fetch a side-by-side comparison payload for two players.
 * @param ids  Array of exactly two player IDs.
 */
export async function fetchCompare(ids: [number, number]): Promise<ComparePayload> {
  const res = await apiClient.get<ComparePayload>('/players/compare', {
    params: { ids: ids.join(',') },
  })
  return res.data
}
