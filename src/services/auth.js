export async function loginWithPassword({ username, password, signal }) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/token` : `/identity/api/auth/token`

  const form = new URLSearchParams()
  form.set('grant_type', 'password')
  form.set('username', username)
  form.set('password', password)
  form.set('scope', 'api offline_access')

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    signal,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'string' ? data : (data?.errorMessage || data?.message || data?.error || '登录失败')
    const err = new Error(message)
    err.data = data
    throw err
  }

  const token = typeof data === 'string'
    ? data
    : (data?.access_token || data?.token || data?.jwt || '')
  const refreshToken = typeof data === 'string' ? '' : (data?.refresh_token || '')

  if (!token) {
    // 将完整响应作为兜底原始内容保存，便于后续调试
    return { token: '', refreshToken, raw: data }
  }
  return { token, refreshToken, raw: data }
}

export function logout() {
  localStorage.removeItem('auth_token')
}

export async function serverLogout({ signal } = {}) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/logout` : `/identity/api/auth/logout`
  const token = localStorage.getItem('auth_token')
  await fetch(url, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
    signal,
  })
}

export async function revokeToken({ signal } = {}) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/revoke` : `/identity/api/auth/revoke`
  const token = localStorage.getItem('auth_token')
  await fetch(url, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
    signal,
  })
}

export async function sendSmsVerificationCode({ phoneNumber, purpose = 1, signal } = {}) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/smsVerificationCode` : `/identity/api/auth/smsVerificationCode`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumbers: [phoneNumber], purpose }),
    signal,
  })
  if (!res.ok) {
    let data
    try { data = await res.json() } catch { data = await res.text().catch(() => '') }
    const message = typeof data === 'string' ? data : (data?.errorMessage || data?.message || data?.error || '发送短信验证码失败')
    const err = new Error(message)
    err.data = data
    throw err
  }
}

export async function sendEmailVerificationCode({ email, messageType = 'Login', signal } = {}) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/emails` : `/identity/api/auth/emails`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, messageType }),
    signal,
  })
  if (!res.ok) {
    let data
    try { data = await res.json() } catch { data = await res.text().catch(() => '') }
    const message = typeof data === 'string' ? data : (data?.errorMessage || data?.message || data?.error || '发送邮箱验证码失败')
    const err = new Error(message)
    err.data = data
    throw err
  }
}

export async function loginWithSmsCode({ phoneNumber, code, captchaCode, captchaToken, signal }) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/token` : `/identity/api/auth/token`
  const form = new URLSearchParams()
  form.set('grant_type', 'sms_otp')
  form.set('phone_number', phoneNumber)
  form.set('code', code)
  form.set('scope', 'api offline_access')
  if (captchaToken) form.set('captcha_token', captchaToken)
  if (captchaCode) form.set('captcha_code', captchaCode)
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
    const message = typeof data === 'string' ? data : (data?.errorMessage || data?.message || data?.error || '登录失败')
    const err = new Error(message)
    err.data = data
    throw err
  }
  const token = typeof data === 'string' ? data : (data?.access_token || data?.token || data?.jwt || '')
  const refreshToken = typeof data === 'string' ? '' : (data?.refresh_token || '')
  return { token, refreshToken, raw: data }
}

export async function loginWithEmailCode({ email, code, captchaCode, captchaToken, signal }) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/token` : `/identity/api/auth/token`
  const form = new URLSearchParams()
  form.set('grant_type', 'email_code')
  form.set('email', email)
  form.set('code', code)
  form.set('scope', 'api offline_access')
  if (captchaToken) form.set('captcha_token', captchaToken)
  if (captchaCode) form.set('captcha_code', captchaCode)
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
    const message = typeof data === 'string' ? data : (data?.errorMessage || data?.message || data?.error || '登录失败')
    const err = new Error(message)
    err.data = data
    throw err
  }
  const token = typeof data === 'string' ? data : (data?.access_token || data?.token || data?.jwt || '')
  const refreshToken = typeof data === 'string' ? '' : (data?.refresh_token || '')
  return { token, refreshToken, raw: data }
}


