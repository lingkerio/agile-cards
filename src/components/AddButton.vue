<script setup lang="ts">
const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click');
};
</script>

<template>
  <div class="add-button" @click="handleClick">
    <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
    </svg>
  </div>
</template>

<style scoped>
.add-button {
  position: fixed;
  bottom: 13vh;
  right: 5vw;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #107c10;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 90;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.add-button:hover {
  transform: scale(1.05);
  background-color: #0e6a0e;
}

.add-button:active {
  transform: scale(0.95);
}
</style>