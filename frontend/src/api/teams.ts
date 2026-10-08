import apiClient from './client'
import type { Player } from './players'

export interface Team {
  id: number
  name: string
  short_name: string
  season_id: number
}

export interface TeamDetail extends Team {
  players: Player[]
}

export async function fetchTeams(): Promise<Team[]> {
  const res = await apiClient.get<Team[]>('/teams')
  return res.data
}

export async function fetchTeam(id: number): Promise<TeamDetail> {
  const res = await apiClient.get<TeamDetail>(`/teams/${id}`)
  return res.data
}
