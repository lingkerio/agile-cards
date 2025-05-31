import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqliteDefineCustomElements } from 'jeep-sqlite/loader';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

// 1. 为 Web 平台定义 jeep-sqlite 自定义元素
jeepSqliteDefineCustomElements(window);
console.log('jeep-sqlite custom elements defined.');

const app = createApp(App); // App 组件的模板中包含 <jeep-sqlite>
const pinia = createPinia();

app.use(pinia);
app.use(router);

async function initializeAppAndStore() {
  // 2. 首先挂载 Vue 应用
  // 这会将 App.vue 及其中的 <jeep-sqlite> 元素渲染到 DOM 中
  app.mount('#app');
  console.log('Vue app mounted. <jeep-sqlite> should now be in the DOM.');

  if (Capacitor.getPlatform() === 'web') {
    console.log('Web platform detected. Initializing web store (after Vue app mount)...');
    try {
      // 3. 现在 Vue 应用已挂载, <jeep-sqlite> 已在 DOM 中, 可以安全调用 initWebStore
      // 添加一个微小的延迟，以确保 DOM 更新完全生效 (可选，但有时有帮助)
      await new Promise(resolve => setTimeout(resolve, 0)); 
      
      await CapacitorSQLite.initWebStore();
      console.log('Web store initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize web store:', err);
    }
  }
}

// 调用初始化函数
initializeAppAndStore();