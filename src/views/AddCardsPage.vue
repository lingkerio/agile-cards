<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
    alert('问题不能为空!');
    return;
  } 
  if (currentLable.value == 0) {
    alert('请选择卡片所在的卡片组!');
    return;
  }
  const submitCard: Cards = {
    group_id: currentLable.value,
    question: question.value,
    answer: answer.value
  };
  const result = await sqlite.saveCards(submitCard);

  if (result.changes == 0) {
    alert('无法插入卡片!');
  } else {
    alert('卡片已创建!');
    question.value = '';
    answer.value = '';
    router.push('/home');
  }
}

onMounted(async () => {
  if (appInit.isDbInitialized) {
    await loadGroup();
    console.log(group.value);
  } else if (appInit.dbInitializationError) {
    console.error('DB initialization failed. Cannot load card groups. Error:', appInit.dbInitializationError);
  } else {
    console.log('DB not yet initialized, watchEffect is waiting...');
  }
})
</script>

<template>
  <div class="add-card-group-page">
    <div class="return-button" @click="router.back()">< 返回</div>
    <div class="form-container">
      <h1>添加卡片</h1>

      <input v-model="question" placeholder="请输入卡片问题" class="input" />

      <textarea
        v-model="answer"
        placeholder="请输入卡片答案"
        class="textarea"
        rows="8"
      ></textarea>

      <div class="group-select">
        <p class="select-remind">选择卡片组</p>
        <div 
          class="group-label" 
          :class="{ active: currentLable === g.group_id }"
          v-for="g in group" 
          @click="handleClick(g.group_id ?? 0)"
        >
          {{ g.group_name }}
        </div>
      </div>

      <div class="textarea-container">
        <textarea
          v-model="llm_content"
          placeholder="使用大模型自动生成卡片"
          class="textarea"
          rows="8"
        ></textarea>
        <div class="llm-submit-wrapper">
          <div class="llm-submit">
            大模型提取
          </div>
        </div>
      </div>

      <button @click="handleAddCard" class="submit-btn">创建卡片</button>
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
  padding: 5px;
  border-radius: 10px;
  background-color: #da3b01;
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
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  overflow: hidden;
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
