import apiClient from './client'

export interface Player {
  id: number
  name: string
  position: string
  dob: string
  nationality: string
  team_id: number
}

export interface PlayerDetail extends Player {
  team: {
    id: number
    name: string
    short_name: string
    season_id: number
  }
}

export interface StatsSummary {
  id: number
  player_id: number
  season_id: number
  goals: number
  assists: number
  shots: number
  shots_on_target: number
  passes: number
  pass_accuracy: number
  minutes_played: number
  matches_played: number
  distance_covered: number
}

export interface TouchPoint {
  x: number
  y: number
}

export interface ShotPoint {
  x: number
  y: number
  outcome: string
  minute: number
}

export async function fetchPlayers(params?: {
  team_id?: number
  position?: string
  season_id?: number
}): Promise<Player[]> {
  const res = await apiClient.get<Player[]>('/players', { params })
  return res.data
}

export async function fetchPlayer(id: number): Promise<PlayerDetail> {
  const res = await apiClient.get<PlayerDetail>(`/players/${id}`)
  return res.data
}

export async function fetchPlayerStats(id: number): Promise<StatsSummary[]> {
  const res = await apiClient.get<StatsSummary[]>(`/players/${id}/stats`)
  return res.data
}

export async function fetchPlayerHeatmap(id: number): Promise<TouchPoint[]> {
  const res = await apiClient.get<TouchPoint[]>(`/players/${id}/heatmap`)
  return res.data
}

export async function fetchPlayerShots(id: number): Promise<ShotPoint[]> {
  const res = await apiClient.get<ShotPoint[]>(`/players/${id}/shots`)
  return res.data
}
