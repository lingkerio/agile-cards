<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CONFIG } from '../config/config';
import configService from '../services/configService';

const isDark = ref(true);
const webdavUrl = ref('');
const webdavUsername = ref('');
const webdavPassword = ref('');
const llmUrl = ref('');
const llmToken = ref('');

const username = ref('游客');
const avatar = ref('');

// 保存 WebDAV 设置
const saveWebDAVSettings = () => {
  try {
    configService.setConfig('WEBDAV_SERVER_URL', webdavUrl.value);
    const authToken = btoa(`${webdavUsername.value}:${webdavPassword.value}`);
    configService.setConfig('WEBDAV_AUTH_TOKEN', authToken);
    localStorage.setItem('webdavUrl', webdavUrl.value);
    localStorage.setItem('webdavUsername', webdavUsername.value);
    localStorage.setItem('webdavPassword', webdavPassword.value);
    localStorage.setItem('webdavAuthToken', authToken);
    alert('WebDAV 设置已保存');
  } catch (error) {
    console.error('保存 WebDAV 设置失败:', error);
    alert('保存设置失败，请检查输入');
  }
};

// 初始化配置加载
onMounted(() => {
  const savedUrl = localStorage.getItem('webdavUrl');
  const savedUsername = localStorage.getItem('webdavUsername');
  const savedPassword = localStorage.getItem('webdavPassword');
  const savedAuthToken = localStorage.getItem('webdavAuthToken');

  if (savedUrl) webdavUrl.value = savedUrl;
  if (savedUsername) webdavUsername.value = savedUsername;
  if (savedPassword) webdavPassword.value = savedPassword;
  if (savedAuthToken) configService.setConfig('WEBDAV_AUTH_TOKEN', savedAuthToken);

  if (!savedUrl && CONFIG.WEBDAV_SERVER_URL) {
    webdavUrl.value = CONFIG.WEBDAV_SERVER_URL;
  }

  if (savedAuthToken && !savedUsername) {
    try {
      const decoded = atob(savedAuthToken);
      const [usernamePart] = decoded.split(':');
      if (usernamePart) webdavUsername.value = usernamePart;
    } catch (e) {
      console.error('认证令牌解码失败:', e);
    }
  }
});

const onAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    avatar.value = URL.createObjectURL(file);
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.body.style.backgroundColor = isDark.value ? '#1e1e1e' : '#ffffff';
  document.body.style.color = isDark.value ? 'white' : 'black';
};

const clearCache = () => {
  localStorage.clear();
  alert('本地缓存已清除');
};

const resetAll = () => {
  localStorage.clear();
  location.reload();
};
</script>

<template>
  <div class="settings-page">
    <div class="form-container">
      <h1>系统设置</h1>

      <!-- 用户头像与用户名 -->
      <div class="setting-item avatar-block">
        <label for="avatar-upload" class="avatar">
          <img v-if="avatar" :src="avatar" alt="头像" />
          <div v-else class="placeholder">+</div>
          <input id="avatar-upload" type="file" accept="image/*" @change="onAvatarChange" />
        </label>
        <input v-model="username" placeholder="请输入用户名" class="username-input" />
      </div>

      <!-- 通用设置项 -->
      <div class="setting-item clickable" @click="toggleTheme">
        <span>主题设置</span>
        <span>{{ isDark ? '夜间模式 🌙' : '日间模式 ☀️' }}</span>
      </div>

      <div class="setting-item clickable" @click="clearCache">
        <span>清除缓存与本地配置</span>
        <span>🧹</span>
      </div>

      <div class="setting-item clickable danger" @click="resetAll">
        <span>恢复默认设置</span>
        <span>♻️</span>
      </div>

      <!-- WebDAV 设置 -->
      <h2>🔧 WebDAV 设置</h2>
      <input v-model="webdavUrl" placeholder="WebDAV 地址（URL）" />
      <input v-model="webdavUsername" placeholder="WebDAV 用户名" />
      <input v-model="webdavPassword" type="password" placeholder="WebDAV 密码" />
      <button class="add-button" @click="saveWebDAVSettings">保存设置</button>

      <div v-if="webdavUrl || webdavUsername" class="saved-settings">
        <p>URL: {{ webdavUrl || '未设置' }}</p>
        <p>用户名: {{ webdavUsername || '未设置' }}</p>
        <p>密码: {{ webdavPassword ? '******' : '未设置' }}</p>
      </div>

      <!-- LLM 设置 -->
      <h2>🤖 LLM 接口设置</h2>
      <input v-model="llmUrl" placeholder="LLM API 地址" />
      <input v-model="llmToken" placeholder="LLM Token" />
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px 100px;
  box-sizing: border-box;
}

.form-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h1,
h2 {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2a2a2a;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 16px;
}

.clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable:hover {
  background-color: #3a3a3a;
}

.danger {
  color: #ff4d4f;
}

.danger:hover {
  background-color: #5a1f1f;
}

input {
  padding: 10px;
  background-color: #2a2a2a;
  color: white;
  border: none;
  border-radius: 6px;
  width: 100%;
  font-size: 16px;
  box-sizing: border-box;
}

.add-button {
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

.add-button:hover {
  background-color: #0e6a0e;
}

.avatar-block {
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #333;
  margin-bottom: 10px;
  position: relative;
  cursor: pointer;
}

.avatar input {
  display: none;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: #888;
  font-size: 32px;
  text-align: center;
  line-height: 80px;
}

.username-input {
  width: 200px;
  text-align: center;
}

.saved-settings {
  padding: 15px;
  background-color: #2a2a2a;
  border-radius: 6px;
  font-size: 14px;
  color: #aaa;
}
</style>
