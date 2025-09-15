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

// 生成图形验证码（返回 { token, imageUrl }），依照身份认证API: GET /identity/api/captcha/create
export async function createCaptcha({ signal } = {}) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/captcha/create` : `/identity/api/captcha/create`
  const res = await fetch(url, { method: 'GET', signal })
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json') || contentType.includes('text/json')
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '')
  if (!res.ok) {
    const message = isJson ? (data?.errorMessage || data?.message || '获取验证码失败') : (data || '获取验证码失败')
    const err = new Error(message)
    err.data = data
    throw err
  }
  // 兼容多种返回形态
  let token = ''
  let imageUrl = ''
  if (typeof data === 'string') {
    // 假设是裸 base64
    token = ''
    imageUrl = data.startsWith('data:') ? data : `data:image/png;base64,${data}`
  } else if (data && typeof data === 'object') {
    token = data.token || data.captcha_token || data.id || data.key || ''
    const img = data.image || data.imageBase64 || data.image_base64 || data.base64 || data.data || ''
    imageUrl = img ? (String(img).startsWith('data:') ? img : `data:image/png;base64,${img}`) : ''
  }
  return { token, imageUrl, raw: data }
}

// 校验图形验证码，依照身份认证API: POST /identity/api/captcha/verify
export async function verifyCaptcha({ token, code, signal }) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/captcha/verify` : `/identity/api/captcha/verify`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, code }),
    signal,
  })
  if (!res.ok) {
    let data
    try { data = await res.json() } catch { data = await res.text().catch(() => '') }
    const message = typeof data === 'string' ? data : (data?.errorMessage || data?.message || '验证码校验失败')
    const err = new Error(message)
    err.data = data
    throw err
  }
  return { ok: true }
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

export async function sendSmsVerificationCode({ phoneNumber, purpose = 2, signal } = {}) {
  const baseEnv = import.meta?.env?.VITE_IDENTITY_BASE_URL || ''
  const base = typeof baseEnv === 'string' ? baseEnv.replace(/\/+$/, '') : ''
  const url = base ? `${base}/api/auth/smsVerificationCode` : `/identity/api/auth/smsVerificationCode`
  const message=''
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumbers: [phoneNumber], purpose,message }),
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


