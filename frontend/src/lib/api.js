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
    if (!response.ok) {
        const errorText = await response.text()
        console.error('API Get Error:', response.status, errorText)
        throw new Error(`API Error: ${response.status} ${errorText}`)
    }
    return response.json()
  },
  
  post: async (endpoint, body) => {
    const headers = await getHeaders()
    let requestBody = body
    
    if (body instanceof FormData) {
        delete headers['Content-Type']
    } else {
        requestBody = JSON.stringify(body)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: requestBody,
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  },

  put: async (endpoint, body) => {
    const headers = await getHeaders()
    let requestBody = body
    
    if (body instanceof FormData) {
        delete headers['Content-Type']
    } else {
        requestBody = JSON.stringify(body)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: requestBody,
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
