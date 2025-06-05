<script setup lang="ts">
import BottomNavigation from './components/BottomNavigation.vue';

// 为 sql.js (通过 jeep-sqlite) 进行配置
const sqlJsConfig = {
  // 这个函数告诉 sql.js 在哪里找到它的 .wasm 文件
  // 假设 sql-wasm.wasm 位于 public/assets/ 目录下
  // Ahead main
  locateFile: (filename: string) => `/assets/${filename}`,
};
</script>

<template>
  <div class="app">
    <jeep-sqlite :sqlJsConfig="sqlJsConfig"></jeep-sqlite>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <BottomNavigation />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-focus-ring-color: transparent;
  outline: none;
}

body {
  font-family: 
    -apple-system,      /* iOS/macOS 系统字体 */
    BlinkMacSystemFont, /* macOS Chrome */
    "Segoe UI",         /* Windows */
    Roboto,             /* Android */
    "Helvetica Neue",   /* 备用无衬线字体 */
    Arial,              /* 备用无衬线字体 */
    sans-serif;         /* 最后兜底无衬线字体 */
  background-color: #1e1e1e;
  color: white;
}

.app {
  /* min-height: 100vh; */
  position: relative;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

html, body {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar, body::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Edge/Android WebView */
}
</style>