<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { SqliteService } from '@/services/sqliteService';
import type { Group, Cards } from '@/services/sqliteService';
import { useAppInitStore } from '@/stores/appInitStore'
import { getOpenAIResponse } from '@/services/openaiService';

const question = ref('');
const answer = ref('');
const llm_content = ref('')

const router = useRouter();
const sqlite = new SqliteService();
const appInit = useAppInitStore();

const group = ref<Group[]>([]);
const currentLable = ref(0);

const loadGroup = async () => {
  try {
    group.value = await sqlite.getGroup();
  } catch (error: any) {
    console.error('Failed to load card cards: ', error);
  }
}

const handleClick = (id: number) => {
  currentLable.value = id;
}

const handleAddCard = async () => {
  if (!question.value.trim()) {
    await MsgBox('问题不能为空!', false);
    return;
  }
  if (!answer.value.trim()) {
    await MsgBox('答案不能为空!', false);
    return;
  }
  if (currentLable.value == 0) {
    await MsgBox('请选择卡片所在的卡片组!', false);
    return;
  }
  const submitCard: Cards = {
    group_id: currentLable.value,
    question: question.value,
    answer: answer.value
  };
  const result = await sqlite.saveCards(submitCard);

  if (result.changes == 0) {
    await MsgBox('无法插入卡片!', false);
  } else {
    await MsgBox('卡片已创建!', false);
    question.value = '';
    answer.value = '';
    router.push('/home');
  }
}

onMounted(async () => {
  if (appInit.isDbInitialized) {
    await loadGroup();
    // console.log(group.value);
  } else if (appInit.dbInitializationError) {
    console.error('DB initialization failed. Cannot load card groups. Error:', appInit.dbInitializationError);
  } else {
    // console.log('DB not yet initialized, watchEffect is waiting...');
  }
})

onUnmounted(() => {
  sqlite.closeDB();
});

const showLoadLabel = ref<boolean>(false);

const llmAbstract = async () => {
  showLoadLabel.value = true;

  const resText = await getOpenAIResponse(llm_content.value);
  try {
    const response = JSON.parse(resText);
    // console.log('Response from Deepseek: ', response);
    question.value = response.question;
    answer.value = response.answer;
  } catch {
    await MsgBox(resText, false);
  }
  showLoadLabel.value = false;
}

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
  <div class="add-card-group-page">
    <div class="form-container">
      <h1>添加卡片</h1>

      <div class="return-button" @click="router.back()">
        < 返回</div>
          <textarea v-model="question" placeholder="请输入卡片问题" class="textarea" rows="4"></textarea>

          <textarea v-model="answer" placeholder="请输入卡片答案" class="textarea" rows="8"></textarea>

          <div class="group-select">
            <p class="select-remind">选择卡片组</p>
            <div class="group-label" :class="{ active: currentLable === g.group_id }" v-for="g in group"
              @click="handleClick(g.group_id ?? 0)">
              {{ g.group_name }}
            </div>
          </div>

          <div class="textarea-container">
            <textarea v-model="llm_content" placeholder="使用大模型自动生成卡片" class="textarea" rows="8"></textarea>
            <div class="llm-submit-wrapper">
              <transition name="fade">
                <div class="llm-submit" @click="llmAbstract">
                  <div>大模型提取</div>
                  <div v-if="showLoadLabel" class="spinner"></div>
                </div>
              </transition>
            </div>
          </div>

          <button @click="handleAddCard" class="submit-btn">创建卡片</button>
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
  word-wrap: break-word;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 3px solid #ccc;      /* 灰色边框 */
  border-top-color: #444444;      /* 上边框颜色，形成旋转视觉 */
  border-radius: 50%;          /* 圆形 */
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.group-select {
  display: flex;
  flex-direction: row;
  gap: 10px;
  overflow-x: auto;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  padding: 10px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  background: #222222;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.textarea-container {
  position: relative;
}

.llm-submit-wrapper {
  position: absolute;
  bottom: 20px;
  right: 15px;
}

.group-select::-webkit-scrollbar {
  display: none;
}

.llm-submit {
  padding: 5px 10px;
  border-radius: 10px;
  background-color: #da3b01;
  display: flex;
  flex-direction: row;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

.llm-submit:hover {
  background-color: #a62d00;
}

.select-remind {
  font-weight: bold;
  color: white;
  /* background-color: #222222; */
  border-radius: 10px;
  padding: 10px;
  /* box-shadow: 0 4px 16px rgba(255, 255, 255, 1),  */
}

.group-label {
  color: white;
  background-color: #2d2d2d;
  border-radius: 10px;
  padding: 7px;
  transition: color 0.15s;
}

.group-label.active {
  background-color: #0e6a0e;
}

.add-card-group-page {
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
  position: relative;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 65px;
}

h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background-color: #2a2a2a;
  color: white;
  transition: border 0.15s;
}

.textarea {
  width: 100%;
  resize: none;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background-color: #2a2a2a;
  color: white;
  transition: border 0.15s;
}

.textarea::-webkit-scrollbar {
  display: none;
}

.input:focus,
.textarea:focus {
  outline: none;
  border: 1px solid #107c10;
}

.file-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #aaa;
}

.preview {
  text-align: center;
}

.preview img {
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  border: 1px solid #444;
  margin-top: 10px;
}

.submit-btn {
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
}

.submit-btn:hover {
  background-color: #0e6a0e;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
