import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import App from './App.vue';
import router from './router';
import SvgIcon from './components/SvgIcon/SvgIcon.vue';
import './assets/iconfont/iconfont.js';
import './styles/dark/css-vars.css';

const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(naive);
app.component('SvgIcon', SvgIcon);

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('Vue 全局错误:', err);
  console.error('错误信息:', info);
};

app.mount('#app');
