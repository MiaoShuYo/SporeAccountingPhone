// API配置文件
import { API_CONFIG, API_ENDPOINTS } from '../config/api.config.js'

// 身份认证相关API
export const AUTH_API = {
  // 获取访问令牌
  TOKEN: `${API_CONFIG.IDENTITY_BASE_URL}${API_ENDPOINTS.AUTH.TOKEN}`,
  // 用户信息
  USER_INFO: `${API_CONFIG.IDENTITY_BASE_URL}${API_ENDPOINTS.AUTH.USER_INFO}`,
  // 退出登录
  LOGOUT: `${API_CONFIG.IDENTITY_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`,
  // 注册
  REGISTER: `${API_CONFIG.IDENTITY_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`,
  // 重置密码
  RESET_PASSWORD: `${API_CONFIG.IDENTITY_BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`
}

// HTTP请求封装
export class ApiClient {
  // 获取访问令牌
  static async getToken(username, password) {
    if (API_CONFIG.DEBUG) {
      console.log('正在请求登录token...', { username, url: AUTH_API.TOKEN })
    }
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: AUTH_API.TOKEN,
        method: 'POST',
        timeout: API_CONFIG.TIMEOUT,
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          grant_type: 'password',
          username: username,
          password: password,
          scope: 'api offline_access'
        },
        success: (res) => {
          if (API_CONFIG.DEBUG) {
            console.log('登录响应:', res)
          }
          
          if (res.statusCode === 200) {
            resolve({
              success: true,
              data: res.data
            })
          } else {
            // 优先使用服务端返回的errorMessage
            let errorMessage = this.getErrorMessage(res)
            if (res.data && res.data.errorMessage) {
              errorMessage = res.data.errorMessage
            }
            
            resolve({
              success: false,
              message: errorMessage
            })
          }
        },
        fail: (error) => {
          if (API_CONFIG.DEBUG) {
            console.error('登录请求失败:', error)
          }
          reject(error)
        }
      })
    })
  }
  
  // 刷新令牌
  static async refreshToken(refreshToken) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: AUTH_API.TOKEN,
        method: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: 'api'
        },
        success: (res) => {
          if (API_CONFIG.DEBUG) {
            console.log('刷新token响应:', res)
          }
          
          if (res.statusCode === 200) {
            resolve({
              success: true,
              data: res.data
            })
          } else {
            // 优先使用服务端返回的errorMessage
            let errorMessage = this.getErrorMessage(res)
            if (res.data && res.data.errorMessage) {
              errorMessage = res.data.errorMessage
            }
            
            resolve({
              success: false,
              message: errorMessage
            })
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }
  
  // 获取用户信息
  static async getUserInfo() {
    const token = uni.getStorageSync('access_token')
    if (!token) {
      return { success: false, message: '未找到访问令牌' }
    }
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: AUTH_API.USER_INFO,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          if (API_CONFIG.DEBUG) {
            console.log('获取用户信息响应:', res)
          }
          
          if (res.statusCode === 200) {
            resolve({
              success: true,
              data: res.data
            })
          } else if (res.statusCode === 401) {
            // Token过期，尝试刷新
            this.handleTokenExpired()
            resolve({
              success: false,
              message: '登录已过期，请重新登录'
            })
          } else {
            // 优先使用服务端返回的errorMessage
            let errorMessage = this.getErrorMessage(res)
            if (res.data && res.data.errorMessage) {
              errorMessage = res.data.errorMessage
            }
            
            resolve({
              success: false,
              message: errorMessage
            })
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }
  
  // 退出登录
  static async logout() {
    const token = uni.getStorageSync('access_token')
    
    if (token) {
      try {
        await new Promise((resolve, reject) => {
          uni.request({
            url: AUTH_API.LOGOUT,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: resolve,
            fail: reject
          })
        })
      } catch (error) {
        console.error('退出登录请求失败:', error)
      }
    }
    
    // 清除本地存储的token
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('refresh_token')
    uni.removeStorageSync('token_expires')
    
    // 跳转到登录页
    uni.reLaunch({
      url: '/pages/login/login'
    })
  }
  
  // 处理token过期
  static async handleTokenExpired() {
    const refreshToken = uni.getStorageSync('refresh_token')
    
    if (refreshToken) {
      try {
        const result = await this.refreshToken(refreshToken)
        if (result.success) {
          // 更新token
          uni.setStorageSync('access_token', result.data.access_token)
          uni.setStorageSync('refresh_token', result.data.refresh_token)
          uni.setStorageSync('token_expires', new Date().getTime() + result.data.expires_in * 1000)
          return true
        }
      } catch (error) {
        console.error('刷新token失败:', error)
      }
    }
    
    // 刷新失败，跳转到登录页
    this.logout()
    return false
  }
  
  // 检查token是否有效
  static isTokenValid() {
    const token = uni.getStorageSync('access_token')
    const expires = uni.getStorageSync('token_expires')
    
    if (!token || !expires) {
      return false
    }
    
    // 提前指定时间判断过期
    return new Date().getTime() < (expires - API_CONFIG.TOKEN_REFRESH_BEFORE)
  }
  
  // 获取错误信息
  static getErrorMessage(res) {
    // 优先使用服务端返回的errorMessage
    if (res.data && res.data.errorMessage) {
      return res.data.errorMessage
    } else if (res.data && res.data.title) {
      return res.data.title
    } else if (res.data && res.data.error_description) {
      return res.data.error_description
    } else if (res.data && res.data.message) {
      return res.data.message
    } else if (res.statusCode === 403) {
      return '用户名或密码错误'
    } else if (res.statusCode === 400) {
      return '请求参数错误'
    } else if (res.statusCode === 401) {
      return '身份验证失败'
    } else if (res.statusCode === 500) {
      return '服务器内部错误'
    } else {
      return '请求失败，请重试'
    }
  }
}

// 请求拦截器 - 自动添加token
export function setupRequestInterceptor() {
  const originalRequest = uni.request
  
  uni.request = function(options) {
    // 如果不是登录接口，自动添加token
    if (!options.url.includes('/auth/token') && !options.url.includes('/auth/register')) {
      const token = uni.getStorageSync('access_token')
      if (token) {
        options.header = options.header || {}
        options.header['Authorization'] = `Bearer ${token}`
      }
    }
    
    return originalRequest.call(this, options)
  }
}
