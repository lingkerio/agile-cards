<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps<{
  title: string;
  subtitle: string;
  image: string;
  id: number;
}>();

const handleClick = () => {
  router.push(`/lib/groups/${props.title}`);
};
</script>

<template>
  <div 
    ref="cardRef"
    class="card-view" 
    @click="handleClick"
  >
    <div class="card-image">
      <img :src="image" :alt="title" />
    </div>
    <div class="card-content">
      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.card-view {
  position: relative;
  height: 65vh;
  border-radius: 5px;
  overflow: hidden;
  margin: 0;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); 
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: green;
}

.card-image {
  width: 100%;
  height: 100%;
  transition: height 0.3s ease;
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
  /* background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent); */
  width: 100%;
  transition: all 0.3s ease;
}

.card-content h2 {
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