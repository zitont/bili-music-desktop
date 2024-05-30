import { createApp } from "vue";
// import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/element/index.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import SvgIcon from './components/SvgIcon/SvgIcon.vue'
import './assets/iconfont/iconfont.js';
// 创建router实例
const pinia = createPinia();

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
app.use(router);
app.use(ElementPlus);
app.use(pinia); 

app.component('SvgIcon', SvgIcon);

app.mount("#app");
