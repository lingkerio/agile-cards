<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCardGroupsStore } from '@/stores/cardGroups';

const title = ref('');
const description = ref('');
const image = ref('');

const router = useRouter();
const store = useCardGroupsStore();

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    image.value = URL.createObjectURL(file);
  }
};

const handleSubmit = () => {
  if (!title.value.trim()) {
    alert('卡片组名称不能为空');
    return;
  }

  const newGroup = {
    title: title.value,
    description: description.value,
    image: image.value || 'https://via.placeholder.com/200x120',
  };

  store.addGroup(newGroup);
  alert('卡片组已创建！');

  // 清空表单
  title.value = '';
  description.value = '';
  image.value = '';

  // 跳转到卡片组列表页
  router.push('/lib');
};
</script>

<template>
  <div class="add-card-group-page">
    <div class="form-container">
      <h1>添加卡片组</h1>

      <input v-model="title" placeholder="请输入卡片组名称" class="input" />

      <textarea
        v-model="description"
        placeholder="请输入描述（可选）"
        class="textarea"
        rows="4"
      />

      <div class="file-upload">
        <input type="file" accept="image/*" @change="handleFileChange" />
        <span v-if="!image">未选择图片</span>
      </div>

      <div v-if="image" class="preview">
        <img :src="image" alt="封面预览" />
      </div>

      <button @click="handleSubmit" class="submit-btn">创建卡片组</button>
    </div>
  </div>
</template>

<style scoped>
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

.input,
.textarea {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  background-color: #2a2a2a;
  color: white;
  transition: border 0.3s;
}

.input:focus,
.textarea:focus {
  outline: none;
  border: 1px solid #42b983;
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
  background-color: #42b983;
  padding: 14px;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
  width: 100%;
}

.submit-btn:hover {
  background-color: #36986f;
}
</style>
