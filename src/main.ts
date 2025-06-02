// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqliteDefineCustomElements } from 'jeep-sqlite/loader';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { useAppInitStore } from '@/stores/appInitStore'; // 导入你的新 store

// 1. 为 Web 平台定义 jeep-sqlite 自定义元素
jeepSqliteDefineCustomElements(window);
console.log('jeep-sqlite custom elements defined.');

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 在 Pinia 插件被 use 之后，获取 store 实例
// 注意：这里直接调用 useAppInitStore() 会在 Pinia 未完全集成到 app 实例前执行，
// 更好的做法是在 initializeAppAndStore 内部获取，或者确保 Pinia 先初始化。
// 为了简单，我们假设在 initializeAppAndStore 内部获取 store。

async function initializeAppAndStore() {
  // 2. 首先挂载 Vue 应用
  app.mount('#app');
  console.log('Vue app mounted. <jeep-sqlite> should now be in the DOM.');

  // Pinia 应该已经随着 app.mount() 初始化，或者通过 app.use(pinia) 已经准备好
  // 所以在这里获取 store 是安全的
  const appInit = useAppInitStore(); // 获取 store 实例

  if (Capacitor.getPlatform() === 'web') {
    console.log('Web platform detected. Initializing web store (after Vue app mount)...');
    try {
      await CapacitorSQLite.initWebStore();
      console.log('Web store initialized successfully.');
      appInit.setDbInitialized(); // <--- 通知 Store 初始化完成
    } catch (err: any) {
      console.error('Failed to initialize web store:', err);
      appInit.setDbInitializationError(err.message || 'Unknown error initializing web store'); // <--- 通知 Store 初始化失败
    }
  } else {
    // 对于非 Web 平台，你可能也需要一个初始化步骤，或者直接认为它是 "已初始化"
    // 例如，如果原生平台不需要显式的 initWebStore，但 SQLite 总是可用的
    console.log(`Platform is ${Capacitor.getPlatform()}. Assuming DB is ready or handled by native SQLite plugin.`);
    appInit.setDbInitialized(); // 假设其他平台DB也是就绪的
  }
}

// 调用初始化函数
initializeAppAndStore().catch(err => {
  // 处理 initializeAppAndStore 本身的潜在错误
  console.error("Error during app initialization:", err);
  // 也可以在这里尝试设置 store 的错误状态，如果 appInit store 实例可访问
  // const appInit = useAppInitStore();
  // appInit.setDbInitializationError('Critical app initialization failure');
});
