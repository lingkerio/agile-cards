<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { SqliteService } from '@/services/sqliteService';
import type { Group, Cards } from '@/services/sqliteService';

const question = ref<string>("");
const answer = ref<string>("");
const group_name = ref<string>("");
const router = useRouter();

const sqlite = new SqliteService();

const props = defineProps<{
  card_id: string
}>()

const handleClick = async () => {
  if (window.confirm("确认要删除该卡片吗？")) {
    await sqlite.dropCardsByID(Number(props.card_id));
    router.push('/lib');
  } 
}

onMounted(async () => {
  console.log(props.card_id);
  const card: Cards = (await sqlite.getCardsByID(Number(props.card_id)))?.[0];
  const group: Group = (await sqlite.getGroupByID(Number(card.group_id)))?.[0];
  question.value = card.question;
  answer.value = card.answer ?? "";
  group_name.value = group.group_name;
})
</script>

<template>
  <div class="card-page">
    <div class="return-button" @click="router.back()">< 返回</div>
    <div class="form-container">
      <div class="title-container">
        <h1>卡片内容</h1>
        <h2>卡片组：{{ group_name }}</h2>
        <div class="delete-card" @click="handleClick">删除</div>
      </div>

      <div class="input">
        <p class="title">问题</p>
        <p class="content">{{ question }}</p>
      </div>

      <div class="textarea">
        <p class="title">答案</p>
        <p class="content">{{ answer }}</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.return-button {
  position: absolute;
  left: 25px;
  top: 45px;
  background-color: #353535;
  padding: 5px 10px;
  border-radius: 10px;
  z-index: 10;
  transition: color 0.15s;
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
  padding: 5px;
  background-color: #da3b01;
  border-radius: 10px;
}

.delete-card:hover {
  background-color: #a62d00;
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
