import axios from 'axios'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export async function loginApi(
  username: string,
  password: string,
): Promise<LoginResponse> {
  // Login uses the /auth prefix (not /api/v1)
  const response = await axios.post<LoginResponse>('/auth/login', {
    username,
    password,
  })
  return response.data
}
