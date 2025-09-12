<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'confirm', 'refresh'])

const code = ref('')

watch(() => props.modelValue, (v) => { if (!v) code.value = '' })

function close() { emit('update:modelValue', false) }
function onConfirm() { emit('confirm', code.value) }
function onRefresh() { emit('refresh') }

onMounted(() => {})
</script>

<template>
  <div v-if="modelValue" class="dialog-mask">
    <div class="dialog">
      <div class="header">
        <span>图形验证码</span>
        <button class="close" @click="close">×</button>
      </div>
      <div class="body">
        <img :src="imageUrl" alt="captcha" class="captcha" @click="onRefresh" />
        <input v-model="code" placeholder="请输入图形验证码" />
        <button @click="onRefresh">换一张</button>
      </div>
      <div class="footer">
        <button @click="close">取消</button>
        <button @click="onConfirm" :disabled="!code">确认</button>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.dialog-mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; }
.dialog { width: 360px; background: #fff; border-radius: 8px; overflow: hidden; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #eee; }
.body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 12px; border-top: 1px solid #eee; }
.captcha { width: 100%; height: 120px; object-fit: contain; background: #f8f8f8; cursor: pointer; }
.close { background: transparent; border: none; font-size: 18px; cursor: pointer; }
</style>


