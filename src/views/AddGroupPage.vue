<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { SqliteService } from '@/services/sqliteService';
import type { Group } from '@/services/sqliteService';

const title = ref('');
const description = ref('');

const router = useRouter();
const sqlite = new SqliteService();

const handleSubmit = async () => {
  if (!title.value.trim()) {
    alert('卡片组名称不能为空！');
    return;
  }

  const group: Group = {
    group_name: title.value,
    group_dis: description.value
  };

  const result = await sqlite.saveGroup(group);
  if (result.changes == 0) {
    alert('无法插入卡片组，可能由于卡片组重名，或卡片组超过 16 个。');
  } else {
    alert('卡片组已创建！');
    title.value = '';
    description.value = '';
    router.push('/home');
  }
};
</script>

<template>
  <div class="add-card-group-page">
    <div class="return-button" @click="router.back()">< 返回</div>
    <div class="form-container">
      <h1>添加卡片组</h1>

      <input v-model="title" placeholder="请输入卡片组名称" class="input" />

      <textarea
        v-model="description"
        placeholder="请输入描述（可选）"
        class="textarea"
        rows="12"
      ></textarea>

      <button @click="handleSubmit" class="submit-btn">创建卡片组</button>
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
