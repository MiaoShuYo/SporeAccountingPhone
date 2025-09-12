<script setup>
import { useRouter } from 'vue-router'
import { logout, serverLogout, revokeToken } from '../services/auth'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue'

const router = useRouter()

async function handleLogout() {
  try {
    await serverLogout().catch(() => {})
    await revokeToken().catch(() => {})
  } finally {
    logout()
    localStorage.removeItem('refresh_token')
    router.replace({ name: 'Login' })
  }
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>首页</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <p>已登录。</p>
      <IonButton expand="block" color="primary" @click="handleLogout">退出登录</IonButton>
    </IonContent>
  </IonPage>
  
</template>

<style scoped>
.logout {
  margin-top: 16px;
  padding: 8px 12px;
}
</style>


