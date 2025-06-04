<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { SqliteService } from '@/services/sqliteService';
import type { Group, Cards } from '@/services/sqliteService';

const questionReal = ref<string>("");
const answerReal = ref<string>("");
const group_nameReal = ref<string>("");
const question = ref<string>("");
const answer = ref<string>("");
const group_name = ref<string>("");
const router = useRouter();

const sqlite = new SqliteService();

const props = defineProps<{
  card_id: string
}>()

const groupSqlite = ref<Group[]>([]);

const handleDel = async () => {
  if (await MsgBox('确认要删除该卡片吗？', true)) {
    await sqlite.dropCardsByID(Number(props.card_id));
    router.push('/lib');
  }
}

const loadEverything = async () => {
  // console.log(props.card_id);
  const card: Cards = (await sqlite.getCardsByID(Number(props.card_id)))?.[0];
  const group: Group = (await sqlite.getGroupByID(Number(card.group_id)))?.[0];
  questionReal.value = question.value = card.question;
  answerReal.value = answer.value = card.answer ?? "";
  group_nameReal.value = group_name.value = group.group_name;
  groupSqlite.value = await sqlite.getGroup();
  currentLable.value = card.group_id;
}

onMounted(async () => {
  await loadEverything();
})

const isFix = ref<boolean>(false);
const currentLable = ref<number>(0);

const changeFixStatus = () => {
  isFix.value = !isFix.value;
}

const handleClick = (id: number) => {
  currentLable.value = id;
}

const submitFix = async () => {
  const submitCardInfo: Cards = {
    card_id: Number(props.card_id),
    group_id: currentLable.value,
    question: question.value,
    answer: answer.value
  }
  await sqlite.updateCardsOfID(submitCardInfo);
  await loadEverything();
  isFix.value = false;
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
  <div class="card-page">
    <div class="form-container">
      <div class="title-container">
        <h1>卡片内容</h1>
        <h2>卡片组：{{ group_nameReal }}</h2>
        <div class="return-button" @click="router.back()">< 返回</div>
        <div class="delete-card" @click="handleDel">删除</div>
        <div class="fix-card" :class="{ active: isFix }" @click="changeFixStatus">编辑</div>
      </div>

      <div class="input">
        <p class="title">问题</p>
        <p v-if="!isFix" class="content">{{ questionReal }}</p>
        <textarea v-if="isFix" v-model="question" class="textarea-format"></textarea>
      </div>

      <div class="textarea">
        <p class="title">答案</p>
        <p v-if="!isFix" class="content">{{ answerReal }}</p>
        <textarea v-if="isFix" v-model="answer" class="textarea-format"></textarea>
      </div>

      <transition name="fade">
        <div v-if="isFix" class="group-select">
          <p class="select-remind">选择卡片组</p>
          <div class="group-label" :class="{ active: currentLable === g.group_id }" v-for="g in groupSqlite"
            @click="handleClick(g.group_id ?? 0)">
            {{ g.group_name }}
          </div>
        </div>
      </transition>

      <transition name="fade">
        <button v-if="isFix" @click="submitFix" class="submit-btn">确认修改</button>
      </transition>
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

.group-select::-webkit-scrollbar {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
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

.textarea-format {
  width: 100%;
  resize: none;
  padding: 14px;
  margin-top: 10px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #353535;
  background-color: #353535;
  color: white;
  transition: border 0.15s;
  height: 100px;
}

.textarea-format::-webkit-scrollbar {
  display: none;
}

.textarea-format:focus {
  outline: none;
  border: 1px solid #107c10;
}

.return-button:hover {
  background-color: #a62d00;
}

.card-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  box-sizing: border-box;
  padding-bottom: 95px;
}

.title-container {
  position: relative;
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
  margin-bottom: 2px;
  text-align: center;
}

h2 {
  font-size: 16px;
  margin-bottom: 5px;
  text-align: center;
  opacity: 0.6;
}

.delete-card {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px 10px;
  background-color: #353535;
  border-radius: 10px;
  transition: color 0.15s;
}

.fix-card {
  position: absolute;
  top: 5px;
  right: 65px;
  padding: 5px 10px;
  background-color: #353535;
  border-radius: 10px;
  transition: color 0.15s;
}

.delete-card:hover {
  background-color: #da3b01;
}

.fix-card.active {
  background-color: #107c10;
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
</style>
