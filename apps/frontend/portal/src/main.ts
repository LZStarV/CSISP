import naive from 'naive-ui';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import i18n from './i18n';
import router from './router';
import { setupAuthGuards } from './router/guards';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(naive);
app.use(i18n);

// 设置认证守卫
setupAuthGuards(router);

app.mount('#app');
