<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCardGroupsStore } from '@/stores/cardGroups';
import TopBar from '@/components/TopBar.vue';
import CardView from '@/components/CardView.vue';
import AddButton from '@/components/AddButton.vue';

const router = useRouter();
const { cardGroups } = useCardGroupsStore();
const currentIndex = ref(0);

const handleAddClick = () => {
  router.push('/home/add-card-group');
};

const nextCard = () => {
  if (currentIndex.value < cardGroups.length - 1) {
    currentIndex.value++;
  }
};

const prevCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

onMounted(() => {
  document.title = 'Cards - Home Page';
});
</script>

<template>
  <div class="home-page">
    <TopBar :info="'Username'" :status="'Online'" />

    <div class="card-list">
      <h1>Card List</h1>

      <div class="card-switch-container" v-if="cardGroups.length">
        <button class="arrow left" @click="prevCard" :disabled="currentIndex === 0">‹</button>

        <transition name="fade" mode="out-in">
          <div class="card-wrapper" :key="cardGroups[currentIndex].id">
            <CardView
              :title="cardGroups[currentIndex].title"
              :subtitle="cardGroups[currentIndex].subtitle"
              :image="cardGroups[currentIndex].image"
              :id="cardGroups[currentIndex].id"
              class="card-item"
            />
          </div>
        </transition>

        <button class="arrow right" @click="nextCard" :disabled="currentIndex === cardGroups.length - 1">›</button>
      </div>

      <!-- 分页圆点指示器 -->
      <div class="pagination-dots" v-if="cardGroups.length > 1">
        <span
          v-for="(group, index) in cardGroups"
          :key="group.id"
          :class="['dot', { active: index === currentIndex }]"
        ></span>
      </div>
    </div>

    <AddButton @click="handleAddClick" />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  color: white;
  padding-bottom: 80px;
}

.card-list {
  padding: 80px 0 0;
}

.card-list h1 {
  padding-left: 20px;
  margin-bottom: 10px;
}

.card-switch-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
}

.arrow {
  font-size: 32px;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 16px;
  transition: opacity 0.2s ease;
}

.arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.card-wrapper {
  width: 85vw;
  max-width: 500px;
  transition: all 0.3s ease;
}

.card-item {
  width: 100%;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.pagination-dots {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #555;
  transition: background-color 0.3s ease;
}

.dot.active {
  background-color: #42b983;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
