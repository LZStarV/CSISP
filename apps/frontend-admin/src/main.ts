import naive from 'naive-ui';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import { pinia } from './stores';

// 创建应用
const app = createApp(App);

// 使用插件
app.use(pinia);
app.use(router);
app.use(naive);

// 挂载应用
app.mount('#app');
