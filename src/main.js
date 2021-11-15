import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import locale from 'element-plus/lib/locale/lang/zh-cn';
import 'element-plus/dist/index.css';

createApp(App).use(ElementPlus, { locale }).mount('#app');
