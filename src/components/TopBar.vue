<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { defineProps } from 'vue';

// const opacity = ref(0);

// const handleScroll = () => {
//   const scrollTop = window.scrollY;
//   opacity.value = Math.min(scrollTop / 30, 1);
// };

// onMounted(() => {
//   window.addEventListener('scroll', handleScroll);
// });

// onUnmounted(() => {
//   window.removeEventListener('scroll', handleScroll);
// });

const props = defineProps<{
  info: string;
  status: string;
}>();
</script>

<template>
  <div class="top-bar">
    <div class="user-info">
      <div class="avatar">
        <img src="@/assets/images/avatar.svg" alt="User Avatar" />
      </div>
      <div class="info">
        <div class="infomation">{{ props.info }}</div>
        <div class="status">{{ props.status }}</div>
      </div>
    </div>
    <div class="card-info">
      <div class="card-count">4 cards</div>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  z-index: 50;
  transition: background-color 0.3s ease;
  background-color: #1e1e1e;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
}

.infomation {
  font-weight: bold;
  color: white;
  font-size: 16px;
}

.status {
  color: #9eff9e;
  font-size: 12px;
}

.lib-topbar {
  font-weight: bold;
  color: white;
  font-size: 20px;
}

.card-info {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 5px;
}

.card-count {
  color: white;
  font-size: 14px;
}
</style>