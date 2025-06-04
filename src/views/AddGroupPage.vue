<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { SqliteService } from '@/services/sqliteService';
import type { Group } from '@/services/sqliteService';

const title = ref('');
const description = ref('');

const router = useRouter();
const sqlite = new SqliteService();

const handleSubmit = async () => {
  if (!title.value.trim()) {
    await MsgBox('卡片组名称不能为空！!', false);
    return;
  }

  const group: Group = {
    group_name: title.value,
    group_dis: description.value
  };

  const result = await sqlite.saveGroup(group);
  if (result.changes == 0) {
    await MsgBox('无法插入卡片组，可能由于卡片组重名，或卡片组超过 16 个。', false);
  } else {
    await MsgBox('卡片组已创建!', false);
    title.value = '';
    description.value = '';
    router.push('/home');
  }
};

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
  <div class="add-card-group-page">
    <div class="form-container">
      <h1>添加卡片组</h1>

      <div class="return-button" @click="router.back()">< 返回</div>
      <input v-model="title" placeholder="请输入卡片组名称" class="input" />
      <textarea v-model="description" placeholder="请输入描述（可选）" class="textarea" rows="12"></textarea>
      <button @click="handleSubmit" class="submit-btn">创建卡片组</button>
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
  padding-bottom: 55px;
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
