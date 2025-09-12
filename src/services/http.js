function buildUrl(inputPath) {
  const path = String(inputPath || '')
  if (/^https?:\/\//i.test(path)) return path
  const baseEnv = import.meta?.env?.VITE_API_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  if (base) return `${base}${path.startsWith('/') ? '' : '/'}${path}`
  return path
}

function getIdentityBaseUrl() {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  return typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
}

async function refreshAccessToken(signal) {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('缺少刷新令牌')
  const base = getIdentityBaseUrl()
  const url = base ? `${base}/api/auth/token` : `/identity/api/auth/token`
  const form = new URLSearchParams()
  form.set('grant_type', 'refresh_token')
  form.set('refresh_token', refreshToken)
  form.set('scope', 'api offline_access')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    signal,
  })
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await res.json() : await res.text()
  if (!res.ok) {
    const message = typeof data === 'string' ? data : (data?.error || data?.message || '刷新令牌失败')
    throw new Error(message)
  }
  const newAccessToken = typeof data === 'string' ? data : (data?.access_token || data?.token || data?.jwt || '')
  const newRefreshToken = typeof data === 'string' ? '' : (data?.refresh_token || '')
  if (!newAccessToken) throw new Error('未返回新的访问令牌')
  localStorage.setItem('auth_token', newAccessToken)
  if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken)
  return newAccessToken
}

export async function httpRequest(path, options = {}) {
  const url = buildUrl(path)
  const headers = new Headers(options.headers || {})
  headers.set('Accept', headers.get('Accept') || 'application/json')
  if (!headers.has('Content-Type') && options.body && typeof options.body !== 'string') {
    headers.set('Content-Type', 'application/json')
  }
  const token = localStorage.getItem('auth_token')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const finalOptions = {
    method: options.method || 'GET',
    headers,
    body: headers.get('Content-Type')?.includes('application/json') && options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
    signal: options.signal,
    credentials: options.credentials || 'same-origin',
  }

  const response = await fetch(url, finalOptions)
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : await response.text()
  if (!response.ok) {
    // 处理 401：尝试用 refresh_token 刷新并重试一次
    if (response.status === 401 && !options._retried) {
      try {
        const newToken = await refreshAccessToken(options.signal)
        const retryHeaders = new Headers(options.headers || {})
        if (!retryHeaders.has('Authorization')) {
          retryHeaders.set('Authorization', `Bearer ${newToken}`)
        } else {
          retryHeaders.set('Authorization', `Bearer ${newToken}`)
        }
        return await httpRequest(path, { ...options, headers: retryHeaders, _retried: true })
      } catch (_) {
        // 刷新失败，清除本地并重定向登录
        try {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
        } catch {}
        const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        if (typeof window !== 'undefined') {
          window.location.href = redirectUrl
        }
      }
    }
    const message = typeof data === 'string' ? data : (data?.message || data?.error || '请求失败')
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const http = {
  get: (path, options = {}) => httpRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => httpRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => httpRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => httpRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => httpRequest(path, { ...options, method: 'DELETE' }),
}


