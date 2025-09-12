<script setup>
import { ref, onMounted } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton } from '@ionic/vue'
import { http } from '../services/http'

const userinfo = ref(null)
const error = ref('')
const loading = ref(false)

async function loadUserinfo() {
  loading.value = true
  error.value = ''
  try {
    const base = import.meta?.env?.VITE_IDENTITY_BASE_URL?.replace(/\/+$/, '') || ''
    const url = base ? `${base}/api/auth/userinfo` : `/identity/api/auth/userinfo`
    userinfo.value = await http.get(url)
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadUserinfo)
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>个人信息</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonButton size="small" @click="loadUserinfo" :disabled="loading">刷新</IonButton>
      <p v-if="loading">加载中...</p>
      <p v-if="error" style="color:#ef4444">{{ error }}</p>
      <IonList v-if="userinfo">
        <IonItem><IonLabel>sub: {{ userinfo.sub }}</IonLabel></IonItem>
        <IonItem v-if="userinfo.name"><IonLabel>name: {{ userinfo.name }}</IonLabel></IonItem>
        <IonItem v-if="userinfo.email"><IonLabel>email: {{ userinfo.email }}</IonLabel></IonItem>
        <IonItem v-if="userinfo.phone_number"><IonLabel>phone: {{ userinfo.phone_number }}</IonLabel></IonItem>
      </IonList>
    </IonContent>
  </IonPage>
  
</template>


