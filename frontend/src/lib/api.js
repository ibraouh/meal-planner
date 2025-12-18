import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

export const api = {
  get: async (endpoint) => {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, { headers })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  },
  
  post: async (endpoint, body) => {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  },

  put: async (endpoint, body) => {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  },

  delete: async (endpoint) => {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  }
}
