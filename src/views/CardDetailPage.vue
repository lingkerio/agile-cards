<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const cardId = ref(route.params.id);
const isVisible = ref(false);

onMounted(() => {
  // 添加一个小延迟以确保过渡效果正常显示
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <div class="card-detail-container">
    <transition name="card-expand" appear>
      <div v-if="isVisible" class="card-detail-page">
        <h1>卡片详情页面</h1>
        <p>卡片 ID: {{ cardId }}</p>
        <div class="card-content">
          <p>此页面待实现</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.card-detail-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 0;
}

.card-detail-page {
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.card-content {
  margin-top: 20px;
  width: 100%;
  max-width: 600px;
}
</style>