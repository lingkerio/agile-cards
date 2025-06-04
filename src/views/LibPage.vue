<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, onUnmounted, watch } from 'vue'
import TopBar from '@/components/TopBar.vue'
import webdavService from '@/services/webDavService'
import { SqliteService } from '@/services/sqliteService'
import { useAppInitStore } from '@/stores/appInitStore'
import router from '@/router'
import cardNotExist from '@/assets/images/cardnotexist.png'
import syncIcon from '@/assets/icons/sync.svg'

const sqlite = new SqliteService();

const props = defineProps<{
  filter?: string
}>()

interface Cards {
  id: number;
  group_id: number;
  group_name: string;
  question: string;
  answer: string;
};

interface Group {
  id: number;
  title: string;
  description: string;
};

const appInit = useAppInitStore();
const cards = ref<Cards[]>([]);
const group = ref<Group[]>([]);

async function loadCardsAndGroup() {
  try {
    const cardsSqlite = await sqlite.getCards();
    // console.log('Loaded cards', cardsSqlite);
    cards.value = await Promise.all(cardsSqlite.map(async card => ({
      id: card.card_id ?? 0,
      group_id: card.group_id,
      group_name: (await sqlite.getGroupByID(card.group_id))?.[0]?.group_name,
      question: card.question,
      answer: card.answer ?? ""
    })));
    const groupSqlite = await sqlite.getGroup();
    group.value = await Promise.all(groupSqlite.map(async group => ({
      id: group.group_id ?? 0,
      title: group.group_name,
      description: group.group_dis ?? ""
    })));
    cardsNum.value = await sqlite.getCardsNum();
    groupNum.value = await sqlite.getGroupNum();
  } catch (error: any) {
    console.error('Failed to load card cards: ', error);
  }
}

const searchQuery = ref('')
const isSearchGroup = ref<boolean>(false);
const searchGroup = ref<Group | null>();

const clearSearch = () => {
  searchQuery.value = '';
  isSearchGroup.value = false;
}

const filteredCards = computed(() => {
  let filtered = cards.value  // 直接使用 cards，解构时已经获取了 value

  if (searchQuery.value && searchQuery.value.startsWith('group::')) {
    const query = searchQuery.value.slice('group::'.length)
    isSearchGroup.value = group.value.some(g => query === g.title);
    if (isSearchGroup.value) {
      searchGroup.value = group.value.find(g => query === g.title);
      filtered = filtered.filter(card => card.group_id === searchGroup.value?.id);
    } else {
      searchGroup.value = null;
      filtered = filtered.filter(card => card.group_name.toLowerCase().includes(query));
    }
  } else {
    searchGroup.value = null;
    isSearchGroup.value = false;
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(card =>
        card.question.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query)
      )
    }
  }

  return filtered
})

onMounted(() => {
  if (props.filter) {
    searchQuery.value = props.filter
  }
  watchEffect(async () => {
    if (appInit.isDbInitialized) {
      // console.log('DB is initialized, proceeding to load card groups.');
      await loadCardsAndGroup();
    } else if (appInit.dbInitializationError) {
      console.error('DB initialization failed. Cannot load card groups. Error:', appInit.dbInitializationError);
    } else {
      // console.log('DB not yet initialized, watchEffect is waiting...');
    }
  });
})

onUnmounted(() => {
  sqlite.closeDB();
});

const handleWebDAVSync = () => {
  // console.log('点击了 WebDAV 同步按钮（预留）');
};

// 添加WebDAV同步相关状态和方法
const showSyncOptions = ref(false);
const isUploading = ref(false);
const isDownloading = ref(false);
const syncMessage = ref('');
const showSyncMessage = ref(false);
const debugInfo = ref<string[]>([]);
const showDebugInfo = ref(false);

// 上传数据库到WebDAV
const uploadDatabase = async () => {
  try {
    isUploading.value = true;
    syncMessage.value = '开始上传流程...';
    showSyncMessage.value = true;

    console.log('开始上传数据库...');
    
    // 实际执行上传
    syncMessage.value = '步骤: 正在传输文件...';
    await webdavService.uploadDatabaseToWebDAV('/backup/data.sql');
    
    console.log('数据库上传完成');
    syncMessage.value = '✅ 数据库上传成功！';
    await MsgBox('数据库上传成功！', false);
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('上传数据库失败:', error);
    await MsgBox('上传数据库失败: ' + String(error), false);
    // 延长错误信息显示时间
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 8000);
  } finally {
    isUploading.value = false;
    showSyncOptions.value = false;
  }
};

// 从WebDAV下载数据库
const downloadDatabase = async () => {
  try {
    isDownloading.value = true;
    syncMessage.value = '开始下载流程...';
    showSyncMessage.value = true;

    console.log('开始下载数据库...');
    
    // 步骤1：下载并导入数据库
    syncMessage.value = '步骤1: 下载并导入数据库...';
    await webdavService.downloadDatabaseFromWebDAV('/backup/data.sql');
    
    // 步骤2：重新初始化本地数据库连接
    syncMessage.value = '步骤2: 重新初始化数据库连接...';
    console.log('重新初始化数据库连接...');
    
    // 安全地重新初始化数据库
    try {
      // 确保数据库实例重新初始化
      await sqlite.initDB();
    } catch (initError) {
      console.log('重新初始化遇到问题，尝试重新创建连接:', initError);
      // 如果初始化失败，可能需要重新创建实例
      await sqlite.initDB();
    }
    
    // 步骤3：验证导入的数据
    syncMessage.value = '步骤3: 验证导入数据...';
    console.log('验证导入数据...');
    const importedCards = await sqlite.getCards();
    const importedGroups = await sqlite.getGroup();
    console.log(`导入验证: 发现 ${importedGroups.length} 个分组, ${importedCards.length} 张卡片`);
    
    // 步骤4：重新加载界面数据
    syncMessage.value = '步骤4: 重新加载界面数据...';
    await loadCardsAndGroup();
    console.log('数据重新加载完成');

    syncMessage.value = '✅ 数据库下载并导入成功！';
    await MsgBox('数据库下载并导入成功！', false);
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('下载数据库失败:', error);
    
    // 详细的错误分析和显示
    let errorMessage = '下载失败: ';
    let debugInfoArray = [];
    
    if (error instanceof Error) {
      errorMessage += error.message;
      debugInfoArray.push(`错误类型: ${error.name}`);
      debugInfoArray.push(`错误消息: ${error.message}`);
      
      // 分析具体错误类型
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        debugInfoArray.push('网络连接问题');
        debugInfoArray.push('建议: 检查网络连接状态');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        debugInfoArray.push('认证失败');
        debugInfoArray.push('建议: 检查用户名密码配置');
      } else if (error.message.includes('404')) {
        debugInfoArray.push('文件不存在');
        debugInfoArray.push('建议: 先上传数据库文件');
      } else if (error.message.includes('timeout')) {
        debugInfoArray.push('下载超时');
        debugInfoArray.push('建议: 检查网络速度');
      } else if (error.message.includes('Close: No available connection')) {
        debugInfoArray.push('数据库连接问题');
        debugInfoArray.push('建议: 数据库连接已关闭，正在重新初始化');
      }
      
      // 添加配置信息
      debugInfoArray.push(`🌐 目标服务器: https://dav.jianguoyun.com/dav/`);
      debugInfoArray.push(`📂 下载路径: /backup/data.sql`);
      
    } else {
      errorMessage += String(error);
      debugInfoArray.push(`未知错误: ${String(error)}`);
    }
    
    // 保存调试信息到响应式变量
    debugInfo.value = debugInfoArray;
    showDebugInfo.value = true;
    
    // 显示主要错误信息
    syncMessage.value = errorMessage;
    await MsgBox(errorMessage, false);
    
    // 在控制台输出详细调试信息
    console.log('=== 详细调试信息 ===');
    debugInfoArray.forEach((info, index) => {
      console.log(`${index + 1}. ${info}`);
    });
    console.log('==================');
    
    // 延长错误信息显示时间
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 8000);
  } finally {
    isDownloading.value = false;
    showSyncOptions.value = false;
  }
};

// 切换同步选项的显示
const toggleSyncOptions = () => {
  showSyncOptions.value = !showSyncOptions.value;
};

const submitDel = async () => {
  if (await MsgBox('确定要删除该卡片组吗？', true)) {
    if (searchGroup.value?.title === '默认') {
      await MsgBox('您无法删除默认分组!', false);
    } else {
      await sqlite.dropGroupByID(searchGroup.value?.id ?? 0);
      await sqlite.closeDB();
      searchQuery.value = '';
      isFix.value = false;
      await loadCardsAndGroup();
      router.push('/lib');
    }
  }
}

const isFix = ref<boolean>(false);
const fixTitle = ref<string>('');
const fixDescription = ref<string>('');

const changeIsFix = () => {
  isFix.value = !isFix.value;
}

const submitFix = async () => {
  if (await MsgBox('您确认提交修改吗？', true)) {
    if (searchGroup.value?.title === '默认') {
      await MsgBox('您无法删修改默认分组!', false);
    } else {
      if (fixTitle.value === '') {
        await MsgBox('请输入分组名！!', false);
      } else {
        const submitGroup = {
          group_id: searchGroup.value?.id,
          group_name: fixTitle.value,
          group_dis: fixDescription.value
        };
        await sqlite.updateGroupOfID(submitGroup);
        router.push('/home');
      }
    }
  }
}

const cardsNum = ref<number>(0);
const groupNum = ref<number>(0);

const jumpGroup = (group_name: string) => {
  searchQuery.value = "group::" + group_name;
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
  <div class="lib-page">
    <TopBar :info="'卡片库'" :status="groupNum + ' 个卡片组'" :card_num="cardsNum" />
    <div class="controls">
      <div style="width: 90%; margin: 0 auto;">
        <div class="search-container">
          <div class="input-wrapper">
            <input v-model="searchQuery" type="text" placeholder="搜索卡片或卡片组..." class="search-input" />
            <button v-if="searchQuery" class="clear-button" @click="clearSearch">
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    
    <div class="cards-grid">
      
      <transition name="fade">
        <div v-if="isSearchGroup" class="group-control">
          <div class="group-control-wrapper">
            <p class="group-remind">卡片组：{{ searchGroup?.title }}</p>
            <div class="group-control-fix" @click="changeIsFix" :class="{ active: isFix }">编辑</div>
            <div class="group-control-del" @click="submitDel">删除</div>
          </div>
          <p class="group-control-description">卡片组描述：{{ searchGroup?.description || "无描述..." }}</p>
          <transition name="fade">
            <div v-if="isFix" class="group-control-fixbar">
              <input v-model="fixTitle" class="title" placeholder="请输入更新后的卡片组名称"></input>
              <input v-model="fixDescription" class="description" placeholder="请输入更新后的卡片组描述"></input>
              <div class="submit-btn" @click="submitFix">提交</div>
            </div>
          </transition>
        </div>
      </transition>

      <div v-for="card in filteredCards" :key="card.id" class="card">
        <transition name="fade">
          <div class="card-container" @click="router.push(`/lib/cards/${card.id}`)">
            <h3 class="truncate-h3">{{ card.question }}</h3>
            <p class="truncate-p">{{ card.answer }}</p>
            <div class="card-group-wrapper">
              <div class="card-group" @click.stop="jumpGroup(card.group_name)">
                {{ card.group_name }}
              </div>
            </div>
          </div>
        </transition>
      </div>

      <transition name="fade">
        <div v-if="filteredCards.length == 0" class="not-exist">
          <img :src="cardNotExist" alt="Card Not Exist" width="100%">
          <p>不存在卡片...</p>
        </div>
      </transition>
    </div>

    <!-- 修改后的WebDAV同步按钮 - 移到lib-page内部 -->
    <div class="webdav-sync-container">
      <!-- 同步选项菜单 -->
      <transition name="slide-up">
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
      </transition>
    </div>

      <!-- 主同步按钮 -->
    <button @click="toggleSyncOptions" class="webdav-sync-btn" :class="{ 'active': showSyncOptions }">
      <div class="async-btn-container">
        <img :src="syncIcon">
      </div>
    </button>

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

/* 进入时，初始状态在底部，透明 */
.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

/* 进入时，结束状态正常显示 */
.slide-up-enter-to {
  transform: translateY(0);
  opacity: 1;
}

/* 离开时，初始状态正常显示 */
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 离开时，结束状态往底部移动并透明 */
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 过渡时间和缓动 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.async-btn-container {
  width: 35px;
  height: 35px;
}

.async-btn-container img {
  width: 100%;
  height: 100%;
  filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.group-control-fixbar {
  width: calc(100% - 10px);
  /* padding: 10px; */
  margin: 5px;
  margin-top: 10px;
  /* background-color: red; */
  border-radius: 10px;
  display: grid;
  grid-template-columns: 1fr 50px;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  align-items: stretch;
}

.title {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 100%;
  resize: none;
  padding: 10px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background-color: #2a2a2a;
  color: white;
  transition: border 0.15s;
  overflow: hidden;
  height: 50px;
}

.description {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  width: 100%;
  resize: none;
  padding: 10px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background-color: #2a2a2a;
  color: white;
  transition: border 0.15s;
  overflow: hidden;
  height: 50px;
}

.title:focus,
.description:focus {
  outline: none;
  border: 1px solid #107c10;
}

.submit-btn {
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  /* 跨两行 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #107c10;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  height: 100%;
  /* 填满两行高度 */
}

.group-control-description {
  width: calc(100% - 10px);
  padding: 10px;
  margin: 5px;
  margin-top: 10px;
  border-radius: 10px;
  background-color: #353535;
}

.group-control-wrapper {
  position: relative;
}

.group-control-fix {
  position: absolute;
  top: 5px;
  right: 70px;
  padding: 6px 10px;
  background-color: #353535;
  border-radius: 10px;
  transition: color 0.15s;
}

.group-control-fix.active {
  background-color: #107c10
}

.group-control-del {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 6px 10px;
  background-color: #353535;
  border-radius: 10px;
}

.group-control-del:hover {
  background-color: #da3b01
}

.group-control {
  /* display: flex;
  flex-direction: row;
  gap: 10px;
  overflow-x: auto;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap; */
  padding: 10px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  background: #222222;
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 90vw;
  margin-left: 5vw;
}

.group-remind {
  font-weight: bold;
  color: white;
  border-radius: 10px;
  padding: 10px;
}

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
  width: 50px;
  background: linear-gradient(to right, rgb(53, 53, 53, 0), rgb(53, 53, 53, 1));
  pointer-events: none;
}

.card-group {
  background-color: #da3b01;
  padding: 6px;
  border-radius: 10px;
}

.card-group:hover {
  background-color: #932700;
}

.lib-page {
  /* padding: 20px; */
  background-color: #1e1e1e;
  /* min-height: 100vh; */
  padding-bottom: 105px;
  /* 为底部导航留出空间 */
}

.controls {
  position: fixed;
  top: 10vh;
  width: 100vw;
  height: 6vh;
  /* margin-left: -20px; */
  background-color: #1e1e1e;
  z-index: 10;
  padding-bottom: 2vh;
}

.controls::after {
  content: "";
  position: fixed;
  top: calc(10vh + 6vh - 3px); /* controls 底部位置 */
  left: 0;
  width: 100vw;
  height: 2vh; /* 渐变高度，可自定义 */
  pointer-events: none; /* 不影响鼠标事件 */
  background: linear-gradient(to top, rgba(30, 30 ,30, 0), #1e1e1e);
  z-index: 9; /* 确保在 .controls 下面 */
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
  border: 1px solid #2d2d2d;
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
  padding-top: 2.1vh;
  width: 100%;
  margin-top: 15vh;
  transition: 0.15s;
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

.not-exist {
  padding: 20px;
  color: white;
  cursor: pointer;
  transition: transform 0.15s ease;
  width: 90vw;
  margin-left: 5vw;
}

.not-exist p {
  margin-top: 10px;
  text-align: center;
  font-weight: bold;
  opacity: 0.8;
}

/* 修改WebDAV同步按钮样式 */
.webdav-sync-container {
  position: fixed;
  bottom: 95px;
  right: 100px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.webdav-sync-btn {
  position: fixed;
  bottom: 100px;
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
  padding: 10px;
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
  bottom: 0px;
  right: 0;
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 10px;
  border-radius: 10px;
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
  border-radius: 10px;
}

.sync-option-btn:hover {
  background-color: #da3b01;
}

/* .sync-option-btn:hover:not(:disabled) {
  background-color: #4a4a4a;
} */

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
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  z-index: 1000;
  max-width: 80vw;
  min-width: 200px;
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.debug-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 14px;
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

.debug-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.debug-btn {
  background: none;
  border: none;
  color: white;
  font-size: 14px;
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

.debug-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.debug-panel {
  position: fixed;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  z-index: 1000;
  max-width: 80vw;
  min-width: 200px;
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.close-debug {
  background: none;
  border: none;
  color: white;
  font-size: 14px;
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

.close-debug:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.debug-content {
  margin-bottom: 10px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.debug-index {
  font-weight: bold;
}

.debug-text {
  margin-left: 10px;
}

.debug-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.clear-debug {
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
}

.copy-debug {
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
}
</style>