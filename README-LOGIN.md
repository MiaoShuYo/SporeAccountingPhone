# 孢子记账登录功能说明

## 功能概述
本项目已集成孢子记账身份认证API的登录功能，支持用户名密码登录、token自动刷新、登录状态检查等功能。

## 文件结构
```
SporeAccountingPhone/
├── pages/
│   ├── login/
│   │   └── login.uvue          # 登录页面
│   └── index/
│       └── index.uvue          # 主页（已更新登录检查）
├── utils/
│   └── api.js                  # API客户端封装
├── config/
│   └── api.config.js           # API配置文件
├── pages.json                  # 页面路由配置（已更新）
└── App.uvue                    # 应用入口（已添加请求拦截器）
```

## 配置说明

### 1. 环境变量配置（推荐）
创建 `.env` 文件并配置API地址：

```bash
# 复制 env.example 为 .env
cp env.example .env

# 编辑 .env 文件
VITE_IDENTITY_BASE_URL=https://your-actual-api-domain.com
VITE_APP_NAME=孢子记账
VITE_DEBUG=true
VITE_TIMEOUT=10000
```

### 2. 直接修改配置文件（备选方案）
如果不使用环境变量，可以直接编辑 `config/api.config.js` 文件：

```javascript
export const API_CONFIG = {
  // 修改为实际的API地址
  IDENTITY_BASE_URL: 'https://your-actual-api-domain.com',
  // 其他配置...
}
```

### 3. 环境文件说明
项目支持多环境配置：
- `.env` - 通用环境变量
- `.env.development` - 开发环境（复制 env.development.example）
- `.env.production` - 生产环境（复制 env.production.example）

## 主要功能

#### 登录页面 (`pages/login/login.uvue`)
- 用户名密码输入
- 登录状态显示
- 错误信息提示
- 自动跳转功能
- 登录状态检查（已登录自动跳转）

#### API客户端 (`utils/api.js`)
- **getToken()**: 获取访问令牌
- **refreshToken()**: 刷新令牌
- **getUserInfo()**: 获取用户信息
- **logout()**: 退出登录
- **isTokenValid()**: 检查token有效性
- **handleTokenExpired()**: 处理token过期

#### 主页面 (`pages/index/index.uvue`)
- 登录状态检查
- 用户信息显示
- 退出登录功能

## API接口说明

### 登录接口
- **URL**: `/identity/api/auth/token`
- **方法**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **参数**:
  ```
  grant_type=password
  username=用户名
  password=密码
  scope=api offline_access
  ```

### 返回格式

#### 成功响应
```json
{
  "access_token": "访问令牌",
  "token_type": "Bearer",
  "expires_in": 1800,
  "refresh_token": "刷新令牌",
  ".issued": "颁发时间",
  ".expires": "过期时间"
}
```

#### 失败响应
```json
{
  "errorMessage": "服务端返回的具体错误信息",
  "title": "错误标题",
  "error_description": "OAuth错误描述"
}
```

## 使用流程

1. 用户打开应用，自动跳转到登录页面（如未登录）
2. 输入用户名和密码，点击登录
3. 系统调用孢子记账身份认证API获取token
4. 登录成功后保存token到本地存储
5. 跳转到主页面，显示用户信息
6. 后续请求自动携带token
7. Token过期时自动刷新或跳转到登录页

## 安全特性

- Token自动过期检查
- Token自动刷新机制
- 请求拦截器自动添加Authorization头
- 登录状态持久化存储
- 安全的退出登录流程
- 完善的错误处理机制

## 错误处理

系统按以下优先级处理错误信息：

1. **服务端errorMessage** - 优先显示 `data.errorMessage` 中的错误信息
2. **标准错误字段** - 依次检查 `data.title`、`data.error_description`、`data.message`
3. **HTTP状态码** - 根据状态码返回默认错误信息：
   - 400: 请求参数错误
   - 401: 身份验证失败
   - 403: 用户名或密码错误
   - 500: 服务器内部错误
4. **通用错误** - 其他情况显示"请求失败，请重试"

## 注意事项

1. **修改API地址**: 务必在 `config/api.config.js` 中修改为实际的API地址
2. **网络权限**: 确保应用有网络访问权限
3. **HTTPS**: 生产环境建议使用HTTPS协议
4. **错误处理**: 已包含完整的错误处理机制
5. **调试模式**: 可在配置文件中开启DEBUG模式查看详细日志

## 开发测试

1. **配置环境变量**:
   ```bash
   # 复制环境变量示例文件
   cp env.example .env
   
   # 编辑 .env 文件，设置正确的API地址
   VITE_IDENTITY_BASE_URL=https://your-actual-api-domain.com
   ```

2. **运行应用**: 启动开发服务器或构建应用

3. **测试登录**: 使用有效的用户名密码进行登录测试

4. **验证功能**: 测试token刷新和退出登录功能

5. **查看调试信息**: 在开发环境下，控制台会输出详细的API请求日志

## 扩展功能

可以基于现有架构继续添加：
- 注册功能
- 忘记密码
- 生物识别登录
- 多账户切换
- 离线模式
