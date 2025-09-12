import { createRouter, createWebHistory } from '@ionic/vue-router'

const Login = () => import('../pages/Login.vue')
const Home = () => import('../pages/Home.vue')
const Profile = () => import('../pages/Profile.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login },
    { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
    { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('auth_token')
  if (to.meta && to.meta.requiresAuth && !token) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'Login' && token) {
    return { name: 'Home' }
  }
})

export default router


