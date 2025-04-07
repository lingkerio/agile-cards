<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const opacity = ref(0);

const handleScroll = () => {
  // 计算透明度，随着滚动增加透明度
  const scrollTop = window.scrollY;
  // 当滚动超过100px时，顶栏完全不透明
  opacity.value = Math.min(scrollTop / 100, 1);
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="top-bar" :style="{ backgroundColor: `rgba(45, 45, 45, ${opacity})` }">
    <div class="user-info">
      <div class="avatar">
        <img src="@/assets/images/avatar.svg" alt="User Avatar" />
      </div>
      <div class="info">
        <div class="username">Username</div>
        <div class="status">Online</div>
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

.username {
  font-weight: bold;
  color: white;
  font-size: 16px;
}

.status {
  color: #9eff9e;
  font-size: 12px;
}

.card-info {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 16px;
}

.card-count {
  color: white;
  font-size: 14px;
}
</style>