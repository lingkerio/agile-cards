<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const jumpAddGroup = () => {
  router.push('/home/add-group');
}

const jumpAddCards = () => {
  router.push('/home/add-cards');
}

</script>

<template>
  <div class="add-choose-page">
    <div class="form-container">
      <h1>选择添加类型</h1>
      <button @click="jumpAddGroup" class="add-button">添加卡片组</button>
      <button @click="jumpAddCards" class="add-button">添加卡片</button>
    </div>
  </div>
</template>

<style scoped>
.add-choose-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  box-sizing: border-box;
}

.form-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.add-button {
  background-color: #107c10;
  padding: 14px;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.15s ease;
  width: 100%;
  height: 10vh;
}

.add-button:hover {
  background-color: #0e6a0e;
}
</style>
