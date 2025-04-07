<script setup lang="ts">
import BottomNavigation from './components/BottomNavigation.vue';
</script>

<template>
  <div class="app">
    <router-view />
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
</style>
