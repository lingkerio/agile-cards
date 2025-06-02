<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useCardsStore } from '@/stores/cards'
import { useCardGroupsStore } from '@/stores/cardGroups'
import TopBar from '@/components/TopBar.vue'
import webdavService from '@/services/webDavService'
import databaseService from '@/services/__databaseService.ts'
import { SqliteService } from '@/services/sqliteService'
import { useAppInitStore } from '@/stores/appInitStore'
import router from '@/router'

const sqlite = new SqliteService();

const props = defineProps<{
  filter?: string
}>()

interface Cards {
  id:         number;
  group_id:   number;
  group_name: string;
  question:   string;
  answer:     string;
};

const appInit = useAppInitStore();
const cards = ref<Cards[]>([]);

async function loadCards() {
  try {
    const cardsqlite = await sqlite.getCards();
    cards.value = await Promise.all(cardsqlite.map(async card => ({
      id: card.card_id ?? 0,
      group_id: card.group_id,
      group_name: (await sqlite.getGroupByID(card.group_id))?.[0]?.group_name,
      question: card.question,
      answer: card.answer ?? ""
    })));
  } catch (error: any) {
    console.error('Failed to load card cards: ', error);
  }
}

const searchQuery = ref('')

onMounted(() => {
  if (props.filter) {
    searchQuery.value = props.filter
  }
  watchEffect(async () => {
    if (appInit.isDbInitialized) {
      console.log('DB is initialized, proceeding to load card groups.');
      await loadCards();
    } else if (appInit.dbInitializationError) {
      console.error('DB initialization failed. Cannot load card groups. Error:', appInit.dbInitializationError);
    } else {
      console.log('DB not yet initialized, watchEffect is waiting...');
    }
  });
})

const handleWebDAVSync = () => {
  console.log('点击了 WebDAV 同步按钮（预留）');
};

// 添加WebDAV同步相关状态和方法
const showSyncOptions = ref(false);
const isUploading = ref(false);
const isDownloading = ref(false);
const syncMessage = ref('');
const showSyncMessage = ref(false);

// 上传数据库到WebDAV
const uploadDatabase = async () => {
  try {
    isUploading.value = true;
    syncMessage.value = '正在上传数据库...';
    showSyncMessage.value = true;

    // 确保数据库连接已关闭
    if (databaseService.db) {
      await databaseService.db.close();
      databaseService.db = null;
    }

    await webdavService.uploadDatabaseToWebDAV('knowledgeCardsDB', '/backup/database.json');

    // 重新初始化数据库连接
    await databaseService.init();

    syncMessage.value = '数据库上传成功！';
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('上传数据库失败:', error);
    syncMessage.value = '上传失败: ' + (error instanceof Error ? error.message : String(error));
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } finally {
    isUploading.value = false;
    showSyncOptions.value = false;
  }
};

// 从WebDAV下载数据库
const downloadDatabase = async () => {
  try {
    isDownloading.value = true;
    syncMessage.value = '正在下载数据库...';
    showSyncMessage.value = true;

    // 确保数据库连接已关闭
    if (databaseService.db) {
      await databaseService.db.close();
      databaseService.db = null;
    }

    await webdavService.downloadDatabaseFromWebDAV('/backup/database.json', 'knowledgeCardsDB');

    // 重新初始化数据库连接
    await databaseService.init();

    syncMessage.value = '数据库下载成功！';
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('下载数据库失败:', error);
    syncMessage.value = '下载失败: ' + (error instanceof Error ? error.message : String(error));
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } finally {
    isDownloading.value = false;
    showSyncOptions.value = false;
  }
};

// 切换同步选项的显示
const toggleSyncOptions = () => {
  showSyncOptions.value = !showSyncOptions.value;
};

const clearSearch = () => {
  searchQuery.value = '';
}

const filteredCards = computed(() => {
  let filtered = cards.value  // 直接使用 cards，解构时已经获取了 value

  // Then apply search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(card =>
      card.question.toLowerCase().includes(query) ||
      card.answer.toLowerCase().includes(query) ||
      card.group_name.toLowerCase().includes(query)
    )
  }

  return filtered
})

</script>

<template>
  <div class="lib-page">
    <TopBar :info="'Library'" :status="'4 groups'" />
    <div class="controls">
      <div style="width: 90%; margin: 0 auto;">
        <div class="search-container">
          <div class="input-wrapper">
            <input v-model="searchQuery" type="text" placeholder="Search cards..." class="search-input" />
            <button v-if="searchQuery" class="clear-button" @click="clearSearch">
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="cards-grid">
      <div 
        v-for="card in filteredCards" 
        :key="card.id" 
        class="card"
      >
        <div class="card-container" @click="router.push(`/lib/cards/${card.id}`)">
          <h3 class="truncate-h3">{{ card.question }}</h3>
          <p class="truncate-p">{{ card.answer }}</p>
          <div class="card-group-wrapper">
            <div class="card-group">
              {{ card.group_name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改后的WebDAV同步按钮 - 移到lib-page内部 -->
    <div class="webdav-sync-container">
      <!-- 同步选项菜单 -->
      <div v-if="showSyncOptions" class="sync-options">
        <button @click="uploadDatabase" class="sync-option-btn" :disabled="isUploading || isDownloading">
          <span class="sync-icon">↑</span>
          上传数据库
        </button>
        <button @click="downloadDatabase" class="sync-option-btn" :disabled="isUploading || isDownloading">
          <span class="sync-icon">↓</span>
          下载数据库
        </button>
      </div>

      <!-- 主同步按钮 -->
      <button @click="toggleSyncOptions" class="webdav-sync-btn" :class="{ 'active': showSyncOptions }">
        <span class="sync-icon">⇅</span>
      </button>
    </div>

    <!-- 同步消息提示 - 移到lib-page内部 -->
    <div v-if="showSyncMessage" class="sync-message">
      {{ syncMessage }}
    </div>
  </div>
</template>

<style scoped>
.card-container {
  position: relative;
}

.truncate-h3 {
  white-space: nowrap;
  overflow: hidden; 
  text-overflow: ellipsis; 
}

.truncate-p {
  white-space: nowrap;
  overflow: hidden; 
  text-overflow: ellipsis; 
}

.card-group-wrapper {
  position: absolute;
  bottom: -10px;
  right: -10px;
}

.card-group-wrapper::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  right: 100%;
  width: 30px;
  background: linear-gradient(
    to right, rgb(53, 53, 53, 0), rgb(53, 53, 53, 1)
  );
  pointer-events: none; 
}

.card-group {
  background-color: #da3b01;
  padding: 6px;
  border-radius: 10px;
}

.lib-page {
  /* padding: 20px; */
  background-color: #1e1e1e;
  /* min-height: 100vh; */
  padding-bottom: 95px;
  /* 为底部导航留出空间 */
}

.controls {
  position: fixed;
  top: 10vh;
  width: 100vw;
  height: 7vh;
  /* margin-left: -20px; */
  background-color: #1e1e1e;
  z-index: 10;
  padding-bottom: 2vh;
}

.search-container {
  display: flex;
  gap: 10px;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  height: 5vh;
  padding-right: 40px;
  padding: 12px 20px;
  /* margin: 8px 0; */
  border: 1px solid #333;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s;
  background-color: #2d2d2d;
  color: white;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus {
  border: 1px solid #107c10;
}

.clear-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.15s;
}

.clear-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.search-button {
  margin: 8px 0;
  padding: 0 25px;
  border: none;
  border-radius: 5px;
  background-color: #107c10;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.search-button:hover {
  background-color: #0e6a0e;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin: 5px 0;
  overflow-x: auto;
}

/* For Webkit browsers */
.filter-tabs::-webkit-scrollbar {
  height: 5px;
}

.filter-tabs::-webkit-scrollbar-track {
  background: transparent;
  background: #2d2d2d;
  -webkit-border-radius: 2.5px;
}

.filter-tabs::-webkit-scrollbar-thumb {
  background-color: #535353;
  -webkit-border-radius: 2.5px;
}

.filter-tabs::-webkit-scrollbar-thumb:hover {
  background-color: #797979;
  -webkit-border-radius: 2.5px;
}

.filter-tab {
  padding: 8px 16px;
  border: none;
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: #2d2d2d;
  color: #888;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.filter-tab:hover {
  background-color: #353535;
  color: white;
}

.filter-tab.active {
  background-color: #107c10;
  color: white;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 2vh;
  padding: 2.1vh 0 2vh 0;
  width: 100%;
  margin-top: 15vh;
}

/* Webkit scrollbar styles */
.cards-grid::-webkit-scrollbar {
  width: 5px;
}

.cards-grid::-webkit-scrollbar-track {
  margin: 0 0 30px 0;
  background: #2d2d2d;
  -webkit-border-radius: 2.5px;
}

.cards-grid::-webkit-scrollbar-thumb {
  background-color: #107c10;
  -webkit-border-radius: 2.5px;
}

.cards-grid::-webkit-scrollbar-thumb:hover {
  background-color: #0e6a0e;
  -webkit-border-radius: 2.5px;
}

.card {
  padding: 20px;
  background-color: #353535;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: transform 0.15s ease;
  width: 90vw;
  margin-left: 5vw;
}

.card:hover {
  transform: scale(1.01);
}

.card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-weight: bold;
}

.card p {
  margin: 0;
  opacity: 0.8;
}

/* 修改WebDAV同步按钮样式 */
.webdav-sync-container {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.webdav-sync-btn {
  position: fixed;
  bottom: 13vh;
  right: 5vw;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #107c10;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.15s ease;
}

.webdav-sync-btn:hover {
  background-color: #0e6a0e;
  transform: scale(1.05);
}

.webdav-sync-btn.active {
  background-color: #0e6a0e;
  transform: rotate(180deg);
}

.sync-options {
  position: absolute;
  bottom: 70px;
  right: 0;
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 10px;
}

.sync-option-btn {
  background-color: #3a3a3a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.sync-option-btn:hover:not(:disabled) {
  background-color: #4a4a4a;
}

.sync-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-icon {
  font-size: 18px;
}

.sync-message {
  position: fixed;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1000;
}
</style>