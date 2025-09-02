// API配置文件
// 支持从环境变量中读取配置

export const API_CONFIG = {
  // 身份认证服务基础URL - 从环境变量读取，如果没有则使用默认值
  IDENTITY_BASE_URL: import.meta.env.VITE_IDENTITY_BASE_URL || 'https://your-api-domain.com',
  
  // 请求超时时间（毫秒）
  TIMEOUT: import.meta.env.VITE_TIMEOUT ? parseInt(import.meta.env.VITE_TIMEOUT) : 10000,
  
  // Token过期前提醒时间（毫秒）- 5分钟
  TOKEN_REFRESH_BEFORE: 5 * 60 * 1000,
  
  // 是否启用调试模式
  DEBUG: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development',
  
  // 应用名称
  APP_NAME: import.meta.env.VITE_APP_NAME || '孢子记账'
}

// 常用的API端点
export const API_ENDPOINTS = {
  // 身份认证相关
  AUTH: {
    TOKEN: '/identity/api/auth/token',
    USER_INFO: '/identity/api/auth/userinfo',
    LOGOUT: '/identity/api/auth/logout',
    REGISTER: '/identity/api/auth/register',
    RESET_PASSWORD: '/identity/api/auth/password/reset'
  }
}
