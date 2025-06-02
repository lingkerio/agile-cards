// src/stores/appInitStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppInitStore = defineStore('appInit', () => {
  const isDbInitialized = ref(false);
  const dbInitializationError = ref<string | null>(null);

  function setDbInitialized() {
    isDbInitialized.value = true;
    dbInitializationError.value = null;
    console.log('AppInitStore: DB state set to initialized.');
  }

  function setDbInitializationError(errorMessage: string) {
    dbInitializationError.value = errorMessage;
    isDbInitialized.value = false; 
    console.error('AppInitStore: DB initialization error set:', errorMessage);
  }

  function setDbInitializedAndResolve() {
    isDbInitialized.value = true;
    dbInitializationError.value = null;
    console.log('AppInitStore: DB state set to initialized and promise resolved.');
  }

  return {
    isDbInitialized,
    dbInitializationError,
    setDbInitialized: setDbInitializedAndResolve, // 使用新的函数
    setDbInitializationError,
  };
});
