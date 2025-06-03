<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
  if (window.confirm("确认要删除该卡片吗？")) {
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
    card_id:  Number(props.card_id),
    group_id: currentLable.value,
    question: question.value,
    answer:   answer.value
  }
  await sqlite.updateCardsOfID(submitCardInfo);
  await loadEverything();
  isFix.value = false;
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
          <div 
            class="group-label" 
            :class="{ active: currentLable === g.group_id }"
            v-for="g in groupSqlite" 
            @click="handleClick(g.group_id ?? 0)"
          >
            {{ g.group_name }}
          </div>
        </div>
      </transition>

      <transition name="fade">
        <button v-if="isFix" @click="submitFix" class="submit-btn">确认修改</button>
      </transition>
    </div>
  </div>
</template>

<style scoped>
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
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.6); 
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
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.6); 
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
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.6); 
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
