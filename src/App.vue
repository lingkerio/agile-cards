<script setup lang="ts">
import BottomNavigation from './components/BottomNavigation.vue';
</script>

<template>
  <div class="app">
    <!-- <transition name="fade" mode="out-in">
      <router-view />
    </transition> -->
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
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
