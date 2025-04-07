<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  image: string;
}>();
</script>

<template>
  <div class="card-group">
    <div class="card-image">
      <img :src="image" :alt="title" />
    </div>
    <div class="card-content">
      <h3>{{ title }}</h3>
      <p>{{ subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.card-group {
  position: relative;
  width: 95%;
  height: 700px;
  border-radius: 10px;
  overflow: hidden;
  margin: auto;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-group:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.card-image {
  width: 100%;
  height: 100%;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  width: 100%;
}

.card-content h3 {
  color: white;
  margin: 0 0 4px 0;
  font-size: 18px;
}

.card-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 14px;
}
</style>