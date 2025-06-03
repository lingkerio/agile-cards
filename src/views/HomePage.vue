<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from '@/components/TopBar.vue';
import CardView from '@/components/CardView.vue';
import AddButton from '@/components/AddButton.vue';
import { SqliteService } from '@/services/sqliteService';
import { useAppInitStore } from '@/stores/appInitStore'; // 导入 store
import { groupIMG } from '@/services/placeholder';

const router = useRouter();
const cardGroups = ref<CardGroup[]>([]);
const currentIndex = ref(0);
const sqlite = new SqliteService();
const appInit = useAppInitStore(); // 获取 store 实例
const groupImg = groupIMG();

interface CardGroup {
  id: number;
  title: string;
  subtitle: string;
}

async function loadCardGroups() {
  console.log('Attempting to load card groups...');
  try {
    const groups = await sqlite.getGroup();
    cardGroups.value = groups.map(group => ({
      id:       group.group_id ?? 0,
      title:    group.group_name,
      subtitle: group.group_dis ?? ""
    }));
    console.log('Card groups loaded:', cardGroups.value);
    cardsNum.value = await sqlite.getCardsNum();
  } catch (error: any) {
    console.error('Failed to load card groups:', error);
  } 
}

const handleAddClick = () => {
  router.push('/home/add-choose');
};

const nextCard = () => {
  if (currentIndex.value < cardGroups.value.length - 1) {
    currentIndex.value++;
  }
};

const prevCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const cardsNum = ref<number>(0);

onMounted(() => {
  document.title = 'Cards - Home Page';
  console.log('Component mounted. Waiting for DB initialization...');

  watchEffect(async () => {
    if (appInit.isDbInitialized) {
      console.log('DB is initialized, proceeding to load card groups.');
      await loadCardGroups();
    } else if (appInit.dbInitializationError) {
      console.error('DB initialization failed. Cannot load card groups. Error:', appInit.dbInitializationError);
    } else {
      console.log('DB not yet initialized, watchEffect is waiting...');
    }
  });
});
</script>

<template>
  <div class="home-page">
    <TopBar :info="'电脑玩家'" :status="'在线'" :card_num="cardsNum"/>

    <div class="card-list">
      <div class="title">卡片组列表</div>

      <div class="card-switch-container" v-if="cardGroups.length">
        <button class="arrow left" @click="prevCard" :disabled="currentIndex === 0">‹</button>

        <transition name="fade" mode="out-in">
          <div class="card-wrapper" :key="cardGroups[currentIndex].id">
            <CardView
              :title="cardGroups[currentIndex].title"
              :subtitle="cardGroups[currentIndex].subtitle"
              :image="groupImg[currentIndex]"
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
          @click="currentIndex = index"
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
  padding-bottom: 75px;
  overflow: hidden;
}

.card-list {
  padding: 10vh 0 0;
}

.title {
  height: 8vh;
  margin-bottom: 0;
  font-size: 4vh; 
  font-weight: 500;    
  padding-left: 5vw;  
  text-align: left;    
}

.card-list h1 {
  padding-left: 20px;
  margin-bottom: 10px;
}

.card-switch-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0;
}

.arrow {
  font-size: 32px;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 16px;
  transition: opacity 0.15s ease;
}

.arrow:disabled {
  opacity: 0;
  cursor: not-allowed;
}

.card-wrapper {
  width: 85vw;
  height: 68vh;
  /* max-width: 500px; */
  transition: all 0.15s ease;
}

.card-item {
  width: 100%;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  background: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.pagination-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 4vh;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #555;
  transition: background-color 0.15s ease;
}

.dot.active {
  background-color: #107c10;
  width: 20px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
