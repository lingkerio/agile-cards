<script setup lang="ts">
import { ref, onMounted, watchEffect, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { SqliteService } from '@/services/sqliteService';
import { useAppInitStore } from '@/stores/appInitStore'; // 导入 store

const router = useRouter();
const cards = ref<Cards[]>([]);
const sqlite = new SqliteService();
const appInit = useAppInitStore();

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
    const reviewCards = await sqlite.getReviewCards();
    cards.value = await Promise.all(reviewCards.map(async card => ({
      card_id: card.card_id ?? 0,
      group_id: card.group_id,
      group_name: (await sqlite.getGroupByID(card.group_id))?.[0]?.group_name,
      question: card.question,
      answer: card.answer ?? ""
    })));
    // console.log('Review card loaded:', cards.value);
    cardsNum.value = cards.value.length;
  } catch (error: any) {
    console.error('Failed to load review cards:', error);
  }
}

const cardsNum = ref<number>(0);
const currentLable = ref<number>(0);
const totalScore = ref<number>(0);

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

const nextCard = async () => {
  if (selectScore.value === 0) {
    await MsgBox('请为该卡片的记忆情况打分！', false);
  } else {
    await sqlite.reviewCards(cards.value[currentLable.value].card_id, selectScore.value);
    totalScore.value += 2 * selectScore.value - 1;
    selectScore.value = 0;
    showAnswer.value = false;
    if (currentLable.value < cards.value.length - 1) {
      currentLable.value++;
    } else if (currentLable.value === cards.value.length - 1) {
      await sqlite.saveRecord(totalScore.value / cardsNum.value);
      router.push('/review');
    }
  }
};

const showAnswer = ref<boolean>(false);
const selectScore = ref<number>(0);

const changeShowAnswer = () => {
  showAnswer.value = !showAnswer.value;
}

onUnmounted(() => {
  sqlite.closeDB();
});

const isConfirmMsg  = ref<boolean>(true);
const showMessage   = ref<boolean>(false);
const msgIsSelected = ref<boolean>(false);
const msgSelection  = ref<boolean>(true);
const msgContent    = ref<string>('');

const handleMsgCancel = async () => {
  msgIsSelected.value = true;
  msgSelection.value  = false;
  showMessage.value   = false;
}

const handleMsgConfirm = async () => {
  msgIsSelected.value = true;
  msgSelection.value  = true;
  showMessage.value   = false;
}

const MsgBox = async (content: string, isConfirm: boolean): Promise<boolean> => {
  isConfirmMsg.value  = isConfirm;
  msgContent.value    = content;
  msgIsSelected.value = false;
  showMessage.value   = true;
  return new Promise((resolve) => {
    const stop = watch(msgIsSelected, (newVal) => {
      if (newVal === true) {
        stop(); 
        resolve(msgSelection.value); 
      }
    });
  });
}
</script>

<template>
  <div class="home-page">
    <div class="form-container">

      <div class="title-container">
        <h1>复习</h1>
        <h2>{{ currentLable + 1 }} <span style="opacity: 0.6;">/ {{ cardsNum }}</span></h2>
      </div>

      <transition name="fade">
        <div v-if="cards[currentLable]">
          <div class="input">
            <h3 class="title">问题</h3>
            <transition name="fade">
              <p class="content">{{ cards[currentLable].question }}</p>
            </transition>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="cards[currentLable]">
          <div class="textarea">
            <div>
              <h3 class="title">答案</h3>
              <p class="content" :class="{ disabled: !showAnswer }">{{ cards[currentLable].answer }}</p>
            </div>
            <transition name="fade">
              <div class="cover" :class="{ disabled: showAnswer }" @click="changeShowAnswer">
                <div class="stop-label">
                  <div class="stop-label-white">
                    <div class="stop-label-line"></div>
                  </div>
                </div>
                <div class="slogan">点击以查看答案</div>
              </div>
            </transition>
          </div>
        </div>
      </transition>

      <div class="score-bar">
        <div class="score-button b1" :class="{ active: selectScore === 1 }" @click="selectScore = 1">
          <div style="font-weight: bold;">一无所知</div>
          <div style="font-size: small;">⭐</div>
        </div>
        <div class="score-button b2" :class="{ active: selectScore === 2 }" @click="selectScore = 2">
          <div style="font-weight: bold;">似曾相识</div>
          <div style="font-size: small;">⭐⭐⭐</div>
        </div>
        <div class="score-button b3" :class="{ active: selectScore === 3 }" @click="selectScore = 3">
          <div style="font-weight: bold;">记忆犹新</div>
          <div style="font-size: small;">⭐⭐⭐⭐⭐</div>
        </div>
      </div>

      <transition name="fade">
        <div class="button-container">
          <button class="jump-button" @click="nextCard" v-if="currentLable < cards.length - 1">下一张 ></button>
          <button class="jump-button" @click="nextCard" v-if="currentLable === cards.length - 1">完成复习</button>
        </div>
      </transition>

      <div class="return-button" @click="router.back()">< 返回</div>
    </div>

    <transition name="slide-horizontal">
      <div v-if="showMessage" class="message-box">
        <div class="message-type">{{ isConfirmMsg ? '确认框' : '警告框' }}</div>
        <div class="message-content">{{ msgContent }}</div>
        <div class="message-button-bar">
          <div v-if="isConfirmMsg" class="message-button cancel" @click="handleMsgCancel">取消</div>
          <div class="message-button confirm" @click="handleMsgConfirm">确认</div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* 进入时，初始状态在左边，透明 */
.slide-horizontal-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

/* 进入时，结束状态正常显示 */
.slide-horizontal-enter-to {
  transform: translateX(0);
  opacity: 1;
}

/* 离开时，初始状态正常显示 */
.slide-horizontal-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 离开时，结束状态移动到右边，透明 */
.slide-horizontal-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 过渡时间和缓动 */
.slide-horizontal-enter-active,
.slide-horizontal-leave-active {
  transition: all 0.3s ease;
}

.message-button {
  padding: 5px;
  width: 30vw;
  background-color: #353535;
  border-radius: 10px;
  text-align: center;
}

.message-button.confirm:hover {
  background-color: #0e6a0e;
}

.message-button.cancel:hover {
  background-color: #a62d00;
}

.message-button-bar {
  display: flex;
  flex-direction: row;
  gap: 3vw;
  justify-content: center;
}

.message-box {
  position: fixed;
  width: 70vw;
  /* height: 120px; */
  background-color: #1e1e1e;
  bottom: 200px;
  left: 15vw;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0px 5px 15px rgba(10, 10, 10, 1);
  z-index: 999;
}

.message-type {
  text-align: center;
  margin-top: -6px;
  font-weight: bold;
}

.message-content {
  box-shadow: inset 0 3px 12px rgba(0, 0, 0, 0.8);
  background-color: white;
  color: black;
  border-radius: 10px;
  padding: 15px;
  font-weight: bold;
}

.score-button {
  padding: 10px 10px;
  border-radius: 10px;
  width: calc((100vw - 70px) / 3);
  background-color: #353535;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: 0.15s;
}

.score-button.b1.active {
  background-color: #932700;
}

.score-button.b2.active {
  background-color: #788800;
}

.score-button.b3.active {
  background-color: #064f06;
}

.score-bar {
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: center;
  justify-content: center;
}

.slogan {
  font-weight: bold;
}

.stop-label-line {
  background-color: #932700;
  height: 110%;
  width: 23%;
  transform: rotate(-45deg)
}

.stop-label-white {
  background-color: #222222;
  height: 70%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stop-label {
  background-color: #932700;
  width: 55%;
  aspect-ratio: 1 / 1;
  max-width: 55%;
  max-height: 55%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover {
  position: absolute;
  background-color: #222222;
  box-shadow: inset 0 1.5px 6px rgba(0, 0, 0, 0.4);
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: 10;
  border-radius: 10px;
  transition: 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 25px;
}

.cover.disabled {
  opacity: 0;
}

.jump-button {
  font-size: medium;
  position: absolute;
  padding: 5px 10px;
  height: 50px;
  border-radius: 10px;
  width: 100%;
  border: none;
  background-color: #107c10;
  color: white;
  transition: 0.15s;
}

.jump-button:hover {
  background-color: #0e6a0e;
}

.button-container {
  position: relative;
}

.input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  background-color: #222222;
  color: white;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  transition: border 0.15s;
}

.textarea {
  min-height: 400px;
  position: relative;
  width: 100%;
  resize: none;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  background-color: #222222;
  color: white;
  transition: border 0.15s;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.title {
  font-size: large;
  font-weight: bold;
  color: white;
  margin-bottom: 10px;
}

.content {
  opacity: 0.6;
  word-break: break-all;
}

.content.disabled {
  opacity: 0;
}

.title-container {
  position: relative;
}

h2 {
  font-size: 16px;
  margin-bottom: 5px;
  text-align: center;
}

h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.form-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 105px;
}

.return-button {
  position: absolute;
  left: 5px;
  top: 5px;
  background-color: #353535;
  padding: 5px 10px;
  border-radius: 10px;
  z-index: 10;
  transition: color 0.15s;
}

.return-button:hover {
  background-color: #a62d00;
}

.home-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  box-sizing: border-box;
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
