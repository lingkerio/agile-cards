<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCardsStore } from '@/stores/cards'
import { useCardGroupsStore } from '@/stores/cardGroups'
import TopBar from '@/components/TopBar.vue'
import webdavService from '@/services/webDavService'
import databaseService from '@/services/databaseService'

const props = defineProps<{
  filter?: string
}>()

const cardsStore = useCardsStore()
const cardGroupsStore = useCardGroupsStore()
const { cards } = cardsStore
const { cardGroups } = cardGroupsStore

const searchQuery = ref('')
const activeFilter = ref('all')

onMounted(() => {
  if (props.filter) {
    activeFilter.value = props.filter
  }
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
  let filtered = cards  // 直接使用 cards，解构时已经获取了 value

  // First apply group filter
  if (activeFilter.value !== 'all') {
    const group = cardGroups.find(g => g.title === activeFilter.value)
    if (group) {
      filtered = filtered.filter(card => group.content.includes(card.id))
    }
  }

  // Then apply search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(card => 
      card.question.toLowerCase().includes(query) || 
      card.answer.toLowerCase().includes(query)
    )
  }

  return filtered
})

const setActiveFilter = (filter: string) => {
  activeFilter.value = filter
}
</script>

<template>
  <div class="lib-page">
    <TopBar 
      :info="'Library'"
      :status="'4 groups'"/>
    <div class="controls">
      <div style="width: 90%; margin: 0 auto;">
        <div class="search-container">
          <div class="input-wrapper">
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search cards..."
              class="search-input"
            />
            <button 
              v-if="searchQuery"
              class="clear-button"
              @click="clearSearch"
            >
              ×
            </button>
          </div>
        </div>
        <div class="filter-tabs">
          <button 
            class="filter-tab"
            :class="{ active: activeFilter === 'all' }"
            @click="setActiveFilter('all')"
          >
            All
          </button>
          <button 
            v-for="group in cardGroups" 
            :key="group.id"
            class="filter-tab"
            :class="{ active: activeFilter === group.title }"
            @click="setActiveFilter(group.title)"
          >
            {{ group.title }}
          </button>
        </div>
      </div>
    </div>

    <div class="cards-grid">
      <div v-for="card in filteredCards" :key="card.id" class="card">
        <h3>{{ card.question }}</h3>
        <p>{{ card.answer }}</p>
      </div>
    </div>
    
    <!-- 修改后的WebDAV同步按钮 - 移到lib-page内部 -->
    <div class="webdav-sync-container">
      <!-- 同步选项菜单 -->
      <div v-if="showSyncOptions" class="sync-options">
        <button 
          @click="uploadDatabase" 
          class="sync-option-btn"
          :disabled="isUploading || isDownloading"
        >
          <span class="sync-icon">↑</span>
          上传数据库
        </button>
        <button 
          @click="downloadDatabase" 
          class="sync-option-btn"
          :disabled="isUploading || isDownloading"
        >
          <span class="sync-icon">↓</span>
          下载数据库
        </button>
      </div>
      
      <!-- 主同步按钮 -->
      <button 
        @click="toggleSyncOptions" 
        class="webdav-sync-btn"
        :class="{ 'active': showSyncOptions }"
      >
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
.lib-page {
  padding: 20px;
  background-color: #1e1e1e;
  min-height: 100vh;
  padding-bottom: 100px; /* 为底部导航留出空间 */
}

.controls {
  position: sticky;
  top: 70px;
  width: 100%;
  background-color: #1e1e1e;
  z-index: 10;
  padding-bottom: 10px;
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
  padding-right: 40px;
  padding: 12px 20px;
  margin: 8px 0;
  border: 2px solid #333;
  border-radius: 5px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  background-color: #2d2d2d;
  color: white;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus {
  border-color: #107c10;
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
  transition: all 0.3s;
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
  transition: background-color 0.3s;
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
  transition: all 0.3s;
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
  gap: 20px;
  padding: 20px 0;
  width: 100%;
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
  background-color: #107c10;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100%;
}

.card:hover {
  transform: scale(1.01);
}

.card h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.card p {
  margin: 0;
  opacity: 0.9;
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #42b983;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.webdav-sync-btn:hover {
  background-color: #36986f;
  transform: scale(1.05);
}

.webdav-sync-btn.active {
  background-color: #36986f;
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
  transition: background-color 0.2s;
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