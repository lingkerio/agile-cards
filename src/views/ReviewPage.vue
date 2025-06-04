<script setup lang="ts">
import { ref, onMounted, watchEffect, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from '@/components/TopBar.vue';
import { SqliteService } from '@/services/sqliteService';
import { useAppInitStore } from '@/stores/appInitStore'; // 导入 store

const router = useRouter();
const cards = ref<Cards[]>([]);
const sqlite = new SqliteService();
const appInit = useAppInitStore();
const cardsSngl = ref<Cards[]>([]);
const cardsDual = ref<Cards[]>([]);
const reviewRecords = ref<Record[]>([]);

interface Record {
  record_id: number;
  avg_score: number;
}

interface Cards {
  card_id: number;
  group_id: number;
  group_name: string;
  question: string;
  answer: string;
}

async function loadReviewCards() {
  // console.log('Attempting to load review card...');
  try {
    cardsSngl.value = [];
    cardsDual.value = [];
    reviewRecords.value = (await sqlite.getRecord()).map(r => ({
      record_id: r.record_id,
      avg_score: r.avg_score
    })).reverse();
    console.log('Review Records:', reviewRecords.value);
    const reviewCards = await sqlite.getReviewCards();
    cards.value = await Promise.all(reviewCards.map(async card => ({
      card_id: card.card_id ?? 0,
      group_id: card.group_id,
      group_name: (await sqlite.getGroupByID(card.group_id))?.[0]?.group_name,
      question: card.question,
      answer: card.answer ?? ""
    })));
    // console.log('Review card loaded:', cards.value);
    cards.value.forEach((item, i) => {
      if (i % 2 === 0) cardsSngl.value.push(item);
      else cardsDual.value.push(item);
    })
    cardsNum.value = await sqlite.getCardsNum();
  } catch (error: any) {
    console.error('Failed to load review cards:', error);
  }
}

const cardsNum = ref<number>(0);

onMounted(() => {
  document.title = 'Cards - Home Page';
  // console.log('Component mounted. Waiting for DB initialization...');

  watchEffect(async () => {
    if (appInit.isDbInitialized) {
      // console.log('DB is initialized, proceeding to load card groups.');
      await loadReviewCards();
    } else if (appInit.dbInitializationError) {
      console.error('DB initialization failed. Cannot load card groups. Error:', appInit.dbInitializationError);
    } else {
      // console.log('DB not yet initialized, watchEffect is waiting...');
    }
  });
});

onUnmounted(() => {
  sqlite.closeDB();
});
</script>

<template>
  <div class="home-page">
    <TopBar :info="'复习'" :status="cards.length + ' 张卡片待复习'" :card_num="cardsNum" />
    <div class="topbar-shadow"></div>

    <div class="page-list">

      <div class="title">复习总结</div>
      <div class="review-summary">
        <div v-if="reviewRecords.length">
          <div class="content-title">近 <span style="color: #ffffff;"> {{ reviewRecords.length }} </span> 次复习情况。</div> 
          <div class="chart-wrapper">
            <div v-for="record in reviewRecords" class="chart-item">
              <transition name="fade">
                <div class="chart-item-up"></div>
              </transition>
              <transition name="fade">
                <div class="chart-item-dn" :style="{ height: (record.avg_score / 5.0 * 100) + '%' }">
                  <div class="chart-item-word"> {{ record.avg_score.toFixed(1) }} </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
        <div v-if="!reviewRecords.length">
          <div class="content-title">当前不存在复习记录。</div> 
        </div>
      </div>
    
      <div class="title">待复习</div>
      <div class="await-review" v-if="cards.length != 0">
        <div class="content-title">
          您有 <span style="color: #ffffff;"> {{ cards.length }} </span> 张卡片需要复习。
        </div>
        <div class="review-btn" @click="router.push('/review/detail')">开始复习</div>
        <div class="review-cards">
          <div class="review-cards-column">
            <div v-for="card in cardsSngl" :key="card.card_id" class="review-card"
              @click="router.push(`/lib/cards/${card.card_id}`)">
              <div class="group-label" @click.stop="router.push(`/lib/groups/group::${card.group_name}`)">{{
                card.group_name }}</div>
              <h4>{{ card.question }}</h4>
              <p>{{ card.answer ?? "" }}</p>
            </div>
          </div>
          <div class="review-cards-column">
            <div v-for="card in cardsDual" :key="card.card_id" class="review-card"
              @click="router.push(`/lib/cards/${card.card_id}`)">
              <div class="group-label" @click.stop="router.push(`/lib/groups/group::${card.group_name}`)">{{
                card.group_name }}</div>
              <h4>{{ card.question }}</h4>
              <p>{{ card.answer ?? "" }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="await-review" v-if="cards.length == 0">
        <div class="content-title">
          恭喜您，您已完成 <span style="color: #ffffff;"> 所有 </span> 卡片的复习！
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.topbar-shadow {
  position: fixed;
  background-color: red;
  width: 100vw;
  height: 2vh;
  top: calc(10vh - 3px);
  background: linear-gradient(to top, rgba(30, 30 ,30, 0), #1e1e1e);
}

.chart-item-up {
  width: 100%;
  flex-grow: 1;
}

.chart-item-dn {
  width: 100%;
  background-color: #c83500;
  border-radius: 10px;
  overflow: hidden;
}

.chart-item-word {
  text-align: center;
  font-weight: bold;
  font-size: small;
  opacity: 0.8;
}

.chart-item {
  flex: 1 1 0;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  background-color: #932700;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 10px;
  background-color: #303030;
  padding: 15px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  margin-top: 20px;
}

.review-summary {
  background-color: #353535;
  width: 90vw;
  margin-left: 5vw;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.group-label {
  width: 100%;
  background-color: #da3b01;
  padding: 7px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  border-radius: 10px;
  transition: color 0.15s;
}

.group-label:hover {
  background-color: #932700;
}

.review-card p,
.review-card h4 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 5px;
}

.review-card {
  padding: 10px;
  border-radius: 10px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  background-color: #303030;
}

.review-card:hover {
  background-color: #252525;
}

.review-cards {
  width: 100%;
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.review-cards-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: calc(50% - 5px);
}

.review-btn {
  position: absolute;
  right: 15px;
  top: 15px;
  border-radius: 10px;
  background-color: #107c10;
  padding: 6px 10px;
  font-weight: bold;
}

.review-btn:hover {
  background-color: #0e6a0e;
}

.content-title {
  margin-top: 5px;
  margin-left: 5px;
  font-size: large;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.await-review {
  position: relative;
  width: 90vw;
  margin-left: 5vw;
  background-color: #353535;
  padding: 15px;
  border-radius: 10px;
}

.home-page {
  min-height: 100vh;
  color: white;
  padding-bottom: 75px;
  overflow: hidden;
}

.page-list {
  padding-top: 10vh;
  padding-bottom: 20px;
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
