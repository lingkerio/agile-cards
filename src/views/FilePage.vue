<script setup lang="ts">
import { ref } from 'vue';

const isDark = ref(true);
const webdavUrl = ref('');
const webdavToken = ref('');
const llmUrl = ref('');
const llmToken = ref('');

// 用户名与头像
const username = ref('游客');
const avatar = ref('');

const onAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    avatar.value = URL.createObjectURL(file); // 仅前端预览
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.body.style.backgroundColor = isDark.value ? '#1e1e1e' : '#ffffff';
  document.body.style.color = isDark.value ? 'white' : 'black';
};

const clearCache = () => {
  localStorage.clear();
  alert('学习进度与缓存已清除');
};

const logout = () => {
  alert('您已退出账号');
};
</script>

<template>
  <div class="settings-page">
    <div class="title-section">
      <h2 class="title">
        <span class="green-square"></span>
        系统设置
      </h2>
    </div>

    <!-- ✅ 用户头像和用户名 -->
    <div class="profile-section">
      <label for="avatar-upload" class="avatar">
        <img v-if="avatar" :src="avatar" alt="头像" />
        <div v-else class="placeholder">+</div>
        <input id="avatar-upload" type="file" accept="image/*" @change="onAvatarChange" />
      </label>
      <input v-model="username" placeholder="请输入用户名" class="username-input" />
    </div>

    <div class="setting-item">
      <span>界面风格</span>
      <span class="clickable" @click="toggleTheme">{{ isDark ? '夜间模式 🌙' : '日间模式 ☀️' }}</span>
    </div>

    <div class="setting-item clickable" @click="clearCache">
      <span>清除学习数据</span>
      <span>🗑️</span>
    </div>

    <div class="setting-item clickable logout" @click="logout">
      <span>退出当前账号</span>
      <span>📕</span>
    </div>

    <!-- ✅ WebDAV 设置 -->
    <div class="setting-section">
      <h3>🔧 WebDAV 设置</h3>
      <input v-model="webdavUrl" placeholder="WebDAV 地址（URL）" />
      <input v-model="webdavToken" placeholder="WebDAV Token" />
    </div>

    <!-- ✅ LLM 设置 -->
    <div class="setting-section">
      <h3>🤖 LLM 接口设置</h3>
      <input v-model="llmUrl" placeholder="LLM API 地址" />
      <input v-model="llmToken" placeholder="LLM Token" />
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 80px 20px;
  color: white;
  min-height: 100vh;
  background-color: #1e1e1e;
}

.title-section {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 22px;
  font-weight: bold;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.green-square {
  width: 10px;
  height: 10px;
  background-color: #42b983;
  border-radius: 2px;
  margin-bottom: 8px;
}

/* ✅ 用户头像和用户名 */
.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
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
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background-color: #2a2a2a;
  color: white;
  font-size: 16px;
  width: 200px;
  text-align: center;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2a2a2a;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 14px;
}

.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable:hover {
  background-color: #3a3a3a;
}

.logout {
  color: #ff6b6b;
}

.setting-section {
  margin-top: 30px;
  padding: 0 10px;
}

.setting-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
}

.setting-section input {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  background-color: #2a2a2a;
  color: white;
  border: none;
  border-radius: 6px;
}
</style>
