import './assets/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { pinia } from './stores/piniaEntry'

const app = createApp(App)
app.use(pinia)
app.use(router)

app.mount('#app')
