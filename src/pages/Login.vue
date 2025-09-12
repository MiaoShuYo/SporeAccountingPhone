<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithPassword, loginWithSmsCode, loginWithEmailCode, sendSmsVerificationCode, sendEmailVerificationCode } from '../services/auth'
import CaptchaDialog from '../components/CaptchaDialog.vue'
import { IonPage, IonContent, IonButton, IonItem, IonInput, IonSegment, IonSegmentButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonIcon, IonToast, IonToggle, IonLabel } from '@ionic/vue'
import { personOutline, lockClosedOutline, callOutline, mailOutline, keyOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons'

const mode = ref('username') // username | phone | email
const username = ref('')
const password = ref('')
const phoneNumber = ref('')
const email = ref('')
const smsCode = ref('')
const emailCode = ref('')
const captchaVisible = ref(false)
const captchaImageUrl = ref('')
const captchaToken = ref('')
const captchaCode = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const route = useRoute()
const router = useRouter()

async function handleLogin() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    const controller = new AbortController()
    let token = ''
    let refreshToken = ''
    if (mode.value === 'username') {
      if (!username.value || !password.value) throw new Error('请输入用户名和密码')
      const r = await loginWithPassword({ username: username.value, password: password.value, signal: controller.signal })
      token = r.token; refreshToken = r.refreshToken
    } else if (mode.value === 'phone') {
      if (!phoneNumber.value || !smsCode.value) throw new Error('请输入手机号和验证码')
      const r = await loginWithSmsCode({ phoneNumber: phoneNumber.value, code: smsCode.value, captchaCode: captchaCode.value, captchaToken: captchaToken.value, signal: controller.signal })
      token = r.token; refreshToken = r.refreshToken
    } else if (mode.value === 'email') {
      if (!email.value || !emailCode.value) throw new Error('请输入邮箱和验证码')
      const r = await loginWithEmailCode({ email: email.value, code: emailCode.value, captchaCode: captchaCode.value, captchaToken: captchaToken.value, signal: controller.signal })
      token = r.token; refreshToken = r.refreshToken
    }
    if (token) localStorage.setItem('auth_token', token)
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
    try {
      if (rememberMe.value) {
        const pref = { mode: mode.value, username: username.value, phoneNumber: phoneNumber.value, email: email.value, rememberMe: rememberMe.value }
        localStorage.setItem('login_pref', JSON.stringify(pref))
      } else {
        localStorage.removeItem('login_pref')
      }
    } catch {}
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (err) {
    errorMessage.value = (err?.data?.errorMessage) || err?.message || '登录异常，请稍后重试'
    toastMessage.value = errorMessage.value
    toastColor.value = 'danger'
    toastOpen.value = true
  } finally {
    isSubmitting.value = false
  }
}

const canSendCode = ref(true)
const countdown = ref(0)
let timerId
function startCountdown() {
  countdown.value = 60
  canSendCode.value = false
  clearInterval(timerId)
  timerId = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timerId)
      canSendCode.value = true
    }
  }, 1000)
}

async function openCaptchaAndSend(kind) {
  captchaCode.value = ''
  captchaToken.value = ''
  // 这里假设图形验证码图片地址为 /identity/api/auth/captcha/image?ts=... 返回图片，验证码 token 由后端在登录时校验
  const base = import.meta?.env?.VITE_IDENTITY_BASE_URL?.replace(/\/+$/, '') || ''
  const url = base ? `${base}/api/auth/captcha/image?ts=${Date.now()}` : `/identity/api/auth/captcha/image?ts=${Date.now()}`
  captchaImageUrl.value = url
  captchaVisible.value = true
  // 等用户输入图形验证码后，再真正发送短信/邮箱验证码
  pendingSendKind.value = kind
}

const pendingSendKind = ref('') // 'phone' | 'email'
async function onCaptchaConfirm(inputCode) {
  captchaVisible.value = false
  captchaCode.value = inputCode
  // 真实项目常常需要一个 captcha_token，这里用时间戳代替占位，后端应返回 token
  captchaToken.value = String(Date.now())
  try {
    if (pendingSendKind.value === 'phone') {
      if (!phoneNumber.value) throw new Error('请输入手机号')
      await sendSmsVerificationCode({ phoneNumber: phoneNumber.value })
      startCountdown()
    } else if (pendingSendKind.value === 'email') {
      if (!email.value) throw new Error('请输入邮箱')
      await sendEmailVerificationCode({ email: email.value })
      startCountdown()
    }
    toastMessage.value = '验证码已发送'
    toastColor.value = 'success'
    toastOpen.value = true
  } catch (e) {
    errorMessage.value = e?.message || '发送验证码失败'
    toastMessage.value = errorMessage.value
    toastColor.value = 'danger'
    toastOpen.value = true
  } finally {
    pendingSendKind.value = ''
  }
}

const showPassword = ref(false)
const rememberMe = ref(true)
const toastOpen = ref(false)
const toastMessage = ref('')
const toastColor = ref('medium')

try {
  const saved = localStorage.getItem('login_pref')
  if (saved) {
    const p = JSON.parse(saved)
    if (p.mode) mode.value = p.mode
    if (p.username) username.value = p.username
    if (p.phoneNumber) phoneNumber.value = p.phoneNumber
    if (p.email) email.value = p.email
    if (typeof p.rememberMe === 'boolean') rememberMe.value = p.rememberMe
  }
} catch {}
</script>

<template>
  <IonPage>
    <IonContent class="auth-wrapper">
      <div class="auth-center">
        <IonCard class="auth-card">
          <IonCardHeader>
            <IonCardTitle class="brand-title">孢子记账</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonSegment :value="mode" @ionChange="(e) => mode = e.detail.value">
              <IonSegmentButton value="username">账号密码</IonSegmentButton>
              <IonSegmentButton value="phone">手机号</IonSegmentButton>
              <IonSegmentButton value="email">邮箱</IonSegmentButton>
            </IonSegment>

            <form @submit.prevent="handleLogin">
              <template v-if="mode==='username'">
                <IonList lines="full">
                  <IonItem>
                    <IonIcon slot="start" :icon="personOutline" />
                    <IonInput v-model="username" autocomplete="username" placeholder="请输入用户名" />
                  </IonItem>
                  <IonItem>
                    <IonIcon slot="start" :icon="lockClosedOutline" />
                    <IonInput :type="showPassword ? 'text' : 'password'" v-model="password" autocomplete="current-password" placeholder="请输入密码" />
                    <IonButton slot="end" fill="clear" size="small" @click="showPassword = !showPassword">
                      <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                    </IonButton>
                  </IonItem>
                </IonList>
              </template>

              <template v-else-if="mode==='phone'">
                <IonList lines="full">
                  <IonItem>
                    <IonIcon slot="start" :icon="callOutline" />
                    <IonInput v-model="phoneNumber" type="tel" inputmode="tel" placeholder="请输入手机号" />
                  </IonItem>
                  <IonItem>
                    <IonIcon slot="start" :icon="keyOutline" />
                    <div class="row-input">
                      <IonInput v-model="smsCode" type="text" inputmode="numeric" placeholder="请输入验证码" />
                      <IonButton type="button" size="small" :disabled="!canSendCode" @click="openCaptchaAndSend('phone')">{{ canSendCode ? '获取验证码' : `${countdown}s` }}</IonButton>
                    </div>
                  </IonItem>
                </IonList>
              </template>

              <template v-else>
                <IonList lines="full">
                  <IonItem>
                    <IonIcon slot="start" :icon="mailOutline" />
                    <IonInput v-model="email" type="email" inputmode="email" placeholder="请输入邮箱" />
                  </IonItem>
                  <IonItem>
                    <IonIcon slot="start" :icon="keyOutline" />
                    <div class="row-input">
                      <IonInput v-model="emailCode" type="text" inputmode="numeric" placeholder="请输入验证码" />
                      <IonButton type="button" size="small" :disabled="!canSendCode" @click="openCaptchaAndSend('email')">{{ canSendCode ? '获取验证码' : `${countdown}s` }}</IonButton>
                    </div>
                  </IonItem>
                </IonList>
              </template>

              <IonItem lines="none" class="remember-row">
                <IonLabel>记住我</IonLabel>
                <IonToggle slot="end" v-model="rememberMe" />
              </IonItem>

              <IonButton class="login-btn" type="submit" expand="block" :disabled="isSubmitting">{{ isSubmitting ? '登录中...' : '登录' }}</IonButton>
              <IonButton class="register-btn" expand="block" fill="outline" routerLink="/register">没有账号？去注册</IonButton>
            </form>
          </IonCardContent>
        </IonCard>
      </div>

      <CaptchaDialog v-model="captchaVisible" :image-url="captchaImageUrl" @confirm="onCaptchaConfirm" @refresh="() => openCaptchaAndSend(pendingSendKind)" />
      <IonToast :is-open="toastOpen" @didDismiss="toastOpen=false" :message="toastMessage" :color="toastColor" duration="2000" position="top" />
    </IonContent>
  </IonPage>
  
</template>

<style scoped>
.auth-wrapper { --background: linear-gradient(135deg, #f0fbf9 0%, #ffffff 100%); }
.auth-center { max-width: 480px; margin: 0; }
.auth-card { box-shadow: 0 8px 20px rgba(0,0,0,.06); border-radius: 16px; }
.row-input { display: flex; gap: 8px; align-items: center; width: 100%; }
.login-btn { margin-top: 16px; --height: 40px; font-size: 14px; }
.register-btn { margin-top: 8px; --height: 40px; font-size: 14px; }
.brand-title {
  text-align: center;
  font-family: var(--brand-title-font);
  font-size: 32px;
  background: var(--brand-title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.auth-card ion-item { --padding-start: 8px; --inner-padding-end: 8px; --min-height: 44px; }
.auth-card ion-input { font-size: 14px; }
.auth-card ion-segment-button { --indicator-height: 2px; --padding-start: 8px; --padding-end: 8px; font-size: 14px; }
.auth-card ion-item ion-icon[slot="start"] { margin-right: 10px; }
</style>


