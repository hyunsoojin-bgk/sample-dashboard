import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router';
import BaseIcon from '@/components/BaseIcon.vue';
import '@/styles/global.scss';

createApp(App).component('BaseIcon', BaseIcon).use(router).mount('#app');
