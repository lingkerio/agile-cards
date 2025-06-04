<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect, watch } from 'vue';
import { SqliteService } from '@/services/sqliteService';
import { useAppInitStore } from '@/stores/appInitStore'; 
import type { DavConfig, LLMConfig } from '@/services/sqliteService';

const sqlite = new SqliteService();
const appInit = useAppInitStore();

const webdav_address = ref<string>('');
const webdav_username = ref<string>('');
const webdav_password = ref<string>('');

const llm_address = ref<string>('');
const llm_token = ref<string>('');

const submit_webdav_address = ref<string>('');
const submit_webdav_username = ref<string>('');
const submit_webdav_password = ref<string>('');

const submit_llm_address = ref<string>('');
const submit_llm_token = ref<string>('');

const loadConfig = async () => {
  const davConf = await sqlite.getDavConfig();
  console.log('davConf loaded', davConf);
  webdav_address.value  = davConf.address;
  webdav_username.value = davConf.username;
  webdav_password.value = davConf.password;
  const llmConf = await sqlite.getLLMConfig();
  console.log('llmConf loaded', llmConf);
  llm_address.value = llmConf.address;
  llm_token.value   = llmConf.token;
}

onMounted(() => {
  watchEffect(async () => {
    if (appInit.isDbInitialized) {
      // console.log('DB is initialized, proceeding to load card groups.');
      await loadConfig();
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

const submit_dav = async () => {
  const dav_conf: DavConfig = {
    address:  submit_webdav_address.value,
    username: submit_webdav_username.value,
    password: submit_webdav_password.value
  };
  console.log('Auth token:', btoa(`${submit_webdav_username.value}:${submit_webdav_password.value}`));
  await sqlite.saveDavConfig(dav_conf);
  await loadConfig();
}

const submit_llm = async () => {
  const llm_conf: LLMConfig = {
    address: submit_llm_address.value,
    token:   submit_llm_token.value
  };
  console.log('saving llm config', llm_conf);
  await sqlite.saveLLMConfig(llm_conf);
  await loadConfig();
}

const clean_data = async () => {
  if (await MsgBox('您确定要清除本地所有卡片和卡片库吗？', true)) {
    await sqlite.deleteData();
    await loadConfig();
  }
}

const clean_conf = async () => {
  if (await MsgBox('您确定要清除本地所有 WebDAV 和 LLM API 配置吗？', true)) {
    await sqlite.deleteConf();
    await loadConfig();
  }
}

const sqlString = ref<string>('');
const sqlMessage = ref<string>('');

const exportSQL = async () => {
  sqlString.value = await sqlite.exportToSQL();
}

const importSQL = async () => {
  const result = await sqlite.importFromSQL(sqlString.value);
  sqlMessage.value = result.message ?? '';
  await loadConfig();
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
  <div class="settings-page">
    <div class="form-container">

      <h1>系统设置</h1>

      <div class="area">
        <div class="content-title">清理</div>
        <div class="area-bar">
          <div class="area-item" @click="clean_data">
            <div style="margin-left: 5px;">清除本地数据</div>
            <div class="area-item-label">卡片和卡片库</div>
          </div>
          <div class="area-item" @click="clean_conf">
            <div style="margin-left: 5px;">清除本地配置</div>
            <div class="area-item-label">WebDAV 和 LLM 配置</div>
          </div>
        </div>
      </div>

      <div class="area">
        <div class="content-title">WebDAV 设置</div>
        <div class="area-bar">
          <input v-model="submit_webdav_address"  class="textarea" placeholder="请输入 WebDAV 地址"></input>
          <input v-model="submit_webdav_username" class="textarea" placeholder="请输入 WebDAV 账号"></input>
          <input v-model="submit_webdav_password" class="textarea" placeholder="请输入 WebDAV 密码"></input>
          <button class="submit-btn" @click="submit_dav">确认修改</button>
          <div class="display-item">
            <div class="display-title">当前 WebDAV 配置</div>
            <p>地址：{{ (webdav_address != '') ? webdav_address : '无' }}</p>
            <p>账号：{{ (webdav_username != '') ? webdav_username : '无' }}</p>
            <p>密码：{{ (webdav_password != '') ? '**********' : '无' }}</p>
          </div>
        </div>
      </div>

      <div class="area">
        <div class="content-title">LLM API 设置</div>
        <div class="area-bar">
          <input v-model="submit_llm_address" class="textarea" placeholder="请输入 LLM API 地址"></input>
          <input v-model="submit_llm_token" class="textarea" placeholder="请输入 LLM API 令牌"></input>
          <button class="submit-btn" @click="submit_llm">确认修改</button>
          <div class="display-item">
            <div class="display-title">当前 LLM API 配置</div> 
            <p>地址：{{ (llm_address != '') ? llm_address : '无' }}</p>
            <p>令牌：{{ 
              (llm_token != '') 
              ? ((llm_token.length > 4) 
                ? (llm_token.slice(0, 7) + '*'.repeat(16)) 
                : llm_token) 
              : '无' 
            }}</p>
          </div>
        </div>
      </div>

      <div class="area">
        <div class="content-title">SQL 测试</div>
        <div class="area-bar">
          <div class="button-bar">
            <div class="area-button" @click="exportSQL">导出 SQL</div>
            <div class="area-button" @click="importSQL">导入 SQL</div>
          </div>
          <textarea v-model="sqlString" class="textarea-resize" placeholder="SQL 语句" rows="12"></textarea>
          <textarea v-model="sqlMessage" class="textarea-resize" placeholder="返回信息" rows="12"></textarea>
        </div>
      </div>
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

.area-button {
  padding: 10px 15px;
  background-color: #2a2a2a;
  border-radius: 10px;
}

.area-button:hover {
  background-color: #932700;
}

.button-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.display-title {
  font-weight: bold;
  margin-left: 5px;
  margin-top: 5px;
  opacity: 0.6;
  margin-bottom: 5px;
}

.display-item {
  margin-top: 10px;
  background-color: #303030;
  border-radius: 10px;
  padding: 10px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  transition: 0.15s;
}

.display-item p {
  margin-left: 10px;
  opacity: 0.5;
  font-size: 0.9em;
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
  height: 50px;
}

.textarea-resize {
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

.textarea-resize:focus {
  outline: none;
  border: 1px solid #107c10;
}

.textarea-resize::-webkit-scrollbar {
  display: none;
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
  height: 50px;
}

.textarea:focus {
  outline: none;
  border: 1px solid #107c10;
}

.textarea::-webkit-scrollbar {
  display: none;
}

.area-item-label {
  background-color: #da3b01;
  padding: 5px 10px;
  border-radius: 10px;
  margin-right: 5px;
}

.area-bar {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.area-item {
  background-color: #303030;
  border-radius: 10px;
  padding: 10px;
  height: 55px;
  display: flex;
  flex-direction: row;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  font-weight: bold;
  align-items: center;
  justify-content: space-between;
  transition: 0.15s;
}

.area-item:hover {
  background-color: #252525;
}

.content-title {
  margin-top: 5px;
  margin-left: 5px;
  font-size: large;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.area {
  background-color: #353535;
  width: 90vw;
  left: 5vw;
  padding: 15px;
  border-radius: 10px;
}

.settings-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px 105px;
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

</style>
