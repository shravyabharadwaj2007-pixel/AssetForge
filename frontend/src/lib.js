
export const inr = n => '₹' + Math.round(n || 0).toLocaleString('en-IN')

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = async (path, method = 'GET', body) => {
  const r = await fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (localStorage.tok || '')
    },
    body: body && JSON.stringify(body)
  })

  const d = await r.json()

  if (!r.ok) {
    throw new Error(typeof d.detail === 'string' ? d.detail : 'Please check your inputs.')
  }

  return d
}
