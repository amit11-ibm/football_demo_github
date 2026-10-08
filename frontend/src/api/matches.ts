import apiClient from './client'
import type { Player } from './players'
import type { Team } from './teams'

export interface PassPoint {
  x: number
  y: number
  end_x: number
  end_y: number
  outcome: string
  player_name: string
}

export interface Match {
  id: number
  season_id: number
  home_team_id: number
  away_team_id: number
  date: string
  home_score: number
  away_score: number
}

export interface LineupEntry {
  id: number
  match_id: number
  player_id: number
  team_id: number
  starting_xi: boolean
  player: Player
}

export interface MatchDetail extends Match {
  home_team: Team
  away_team: Team
  lineups: LineupEntry[]
}

export interface MatchEvent {
  id: number
  match_id: number
  player_id: number
  type: string
  x: number
  y: number
  end_x: number | null
  end_y: number | null
  minute: number
  outcome: string | null
  player: Player
}

export async function fetchMatches(params?: {
  team_id?: number
  season_id?: number
}): Promise<Match[]> {
  const res = await apiClient.get<Match[]>('/matches', { params })
  return res.data
}

export async function fetchMatch(id: number): Promise<MatchDetail> {
  const res = await apiClient.get<MatchDetail>(`/matches/${id}`)
  return res.data
}

export async function fetchMatchEvents(id: number): Promise<MatchEvent[]> {
  const res = await apiClient.get<MatchEvent[]>(`/matches/${id}/events`)
  return res.data
}
