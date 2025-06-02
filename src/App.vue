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
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #1e1e1e;
  color: white;
}

.app {
  min-height: 100vh;
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
</style>