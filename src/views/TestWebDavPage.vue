<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import databaseService from '../services/databaseService';
import webdavService from '../services/webDavService';
import TopBar from '../components/TopBar.vue';
import { Capacitor } from '@capacitor/core';
import { CONFIG } from '../config/config';

// 状态变量
const isInitialized = ref(false);
const isUploading = ref(false);
const isDownloading = ref(false);
const logs = ref<string[]>([]);
const remotePath = ref('/backup/knowledgeCardsDB.json');
const dbName = ref('knowledgeCardsDB');
const showSuccessMessage = ref(false);
const successMessage = ref('');

// 显示WebDAV URL信息
const webdavServerUrl = ref(CONFIG.WEBDAV_SERVER_URL || '未配置');

// 日志函数
function addLog(message: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  console.log(message);
}

// 测试WebDAV连接
async function testWebDavConnection() {
  try {
    addLog('开始测试WebDAV连接...');
    
    // 测试WebDAV连接
    const testContent = `测试连接 ${new Date().toISOString()}`;
    const testPath = '/test-connection.txt';
    
    addLog(`尝试上传测试文件到: ${testPath}`);
    await webdavService.uploadFileToWebDAV(testContent, testPath);
    addLog('WebDAV连接测试成功! 服务器可正常访问。');
    
    showSuccess('WebDAV连接测试成功!');
  } catch (error) {
    addLog(`WebDAV连接测试失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 初始化数据库
async function initDatabase() {
  try {
    addLog('开始初始化数据库...');
    
    // 检查平台
    if (Capacitor.getPlatform() === 'web') {
      addLog('在Web平台上不支持SQLite数据库操作，请在Android/iOS设备上使用此功能');
      return;
    }
    
    await databaseService.init();
    isInitialized.value = true;
    addLog('数据库初始化成功');
    
    // 添加一些测试数据
    await addTestData();
  } catch (error) {
    addLog(`数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 添加测试数据
async function addTestData() {
  try {
    addLog('开始添加测试数据...');
    
    // 添加一个测试分组
    const groupResult = await databaseService.saveGroup({
      group_name: '测试分组' + new Date().getTime()
    });
    
    if (groupResult.changes > 0) {
      addLog('测试分组添加成功');
      
      // 获取所有分组以找到我们刚刚添加的分组
      const groups = await databaseService.getGroups();
      const latestGroup = groups[groups.length - 1];
      
      // 添加一张测试卡片
      const cardResult = await databaseService.saveCard({
        group_id: latestGroup.group_id!,
        question: '这是一个测试问题' + new Date().getTime(),
        answer: '这是一个测试答案',
        created_at: Date.now(),
        last_reviewed_at: Date.now()
      });
      
      if (cardResult.changes > 0) {
        addLog('测试卡片添加成功');
      }
    }
  } catch (error) {
    addLog(`添加测试数据失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 上传数据库
async function uploadDatabase() {
  try {
    isUploading.value = true;
    
    // 确保路径格式正确
    const formattedPath = formatPath(remotePath.value);
    
    addLog(`开始上传数据库到WebDAV: ${formattedPath}`);
    await webdavService.uploadDatabaseToWebDAV(dbName.value, formattedPath);
    addLog('数据库上传成功');
    
    showSuccess('数据库上传成功!');
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`上传数据库失败: ${errorMessage}`);
  } finally {
    isUploading.value = false;
  }
}

// 下载数据库 (直接覆盖原始数据库)
async function downloadDatabase() {
  try {
    isDownloading.value = true;
    
    // 确保路径格式正确
    const formattedPath = formatPath(remotePath.value);
    
    addLog(`开始从WebDAV下载数据库: ${formattedPath} -> ${dbName.value} (覆盖)`);
    
    // 需要先关闭数据库连接
    if (databaseService.db) {
      const isOpen = await databaseService.db.isDBOpen();
      if (isOpen.result) {
        addLog('准备关闭数据库连接以便覆盖...');
        await databaseService.db.close();
        databaseService.db = null; // 清除引用
        addLog('数据库连接已关闭');
      }
    }
    
    // 下载并导入数据，直接覆盖原始数据库
    await webdavService.downloadDatabaseFromWebDAV(formattedPath, dbName.value);
    addLog(`数据库下载成功，已覆盖: ${dbName.value}`);
    
    // 重新初始化数据库连接
    addLog('重新初始化数据库连接...');
    await databaseService.init();
    addLog('数据库连接已重新建立');
    
    showSuccess('数据库下载并覆盖成功!');
  } catch (error) {
    addLog(`下载数据库失败: ${error instanceof Error ? error.message : String(error)}`);
    
    // 出错后也尝试重新初始化数据库连接
    try {
      addLog('尝试在错误处理中重新初始化数据库连接...');
      await databaseService.init();
      addLog('数据库连接已在错误处理中重新初始化');
    } catch (initError) {
      addLog(`重新初始化数据库连接失败: ${initError instanceof Error ? initError.message : String(initError)}`);
    }
  } finally {
    isDownloading.value = false;
  }
}

// 确保路径格式正确
function formatPath(path: string): string {
  // 确保路径以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
}

// 显示成功消息
function showSuccess(message: string) {
  successMessage.value = message;
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 3000);
}

// 组件挂载时
onMounted(() => {
  addLog('测试页面已加载');
  addLog(`当前平台: ${Capacitor.getPlatform()}`);
  addLog(`数据库名称: ${dbName.value}`);
  addLog(`WebDAV服务器URL: ${webdavServerUrl.value}`);
});
</script>

<template>
  <div class="test-webdav-page">
    <TopBar info="WebDAV 测试" status="" />
    
    <div class="container">
      <div class="card test-controls">
        <h2>WebDAV数据库同步</h2>
        
        <div class="form-group">
          <label for="remotePath">远程路径:</label>
          <input 
            id="remotePath" 
            v-model="remotePath" 
            type="text" 
            placeholder="例如: /backup/knowledgeCardsDB.json"
          />
          <div class="help-text">确保以斜杠开始，如: /backup/database.json</div>
        </div>
        
        <div class="form-group">
          <label for="dbName">数据库名称:</label>
          <input 
            id="dbName" 
            v-model="dbName" 
            type="text" 
            placeholder="例如: knowledgeCardsDB"
          />
        </div>
        
        <div class="notice-box">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-text">
            下载操作将直接覆盖当前数据库，请确保您已备份重要数据。
          </div>
        </div>

        <div class="server-info">
          <div>WebDAV服务器: {{ webdavServerUrl }}</div>
          <div>连接模式: 绝对URL + XMLHttpRequest</div>
          <div>数据格式: JSON格式</div>
        </div>
        
        <div class="btn-group">
          <button 
            @click="testWebDavConnection" 
            :disabled="isUploading || isDownloading"
            class="btn btn-secondary"
          >
            测试连接
          </button>
          
          <button 
            @click="initDatabase" 
            :disabled="isUploading || isDownloading"
            class="btn btn-primary"
          >
            1. 初始化数据库
          </button>
          
          <button 
            @click="uploadDatabase" 
            :disabled="!isInitialized || isUploading || isDownloading"
            class="btn btn-success"
          >
            {{ isUploading ? '上传中...' : '2. 上传数据库' }}
          </button>
          
          <button 
            @click="downloadDatabase" 
            :disabled="isUploading || isDownloading"
            class="btn btn-danger"
          >
            {{ isDownloading ? '下载中...' : '3. 下载并覆盖' }}
          </button>
        </div>
      </div>
      
      <div class="card logs-panel">
        <h2>操作日志</h2>
        <div class="logs">
          <div v-if="logs.length === 0" class="empty-logs">
            暂无日志记录
          </div>
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="success-message" v-if="showSuccessMessage">
      <div class="success-content">
        <span class="success-icon">✓</span>
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-webdav-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  padding-bottom: 70px;
}

.container {
  padding: 80px 16px 16px;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.5rem;
  color: #ffffff;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input[type="text"] {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #444;
  background-color: #333;
  color: #fff;
  font-size: 14px;
}

input[disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}

.help-text {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #2c3e50;
  border-left: 4px solid #f39c12;
  padding: 12px;
  border-radius: 4px;
  margin: 16px 0;
}

.notice-icon {
  font-size: 18px;
}

.notice-text {
  font-size: 14px;
  color: #eee;
  flex: 1;
}

.server-info {
  background-color: #222;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.server-info div {
  margin-bottom: 4px;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  flex: 1;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0069d9;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.logs-panel {
  min-height: 300px;
}

.logs {
  background-color: #1a1a1a;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
}

.log-entry {
  padding: 4px 0;
  border-bottom: 1px solid #333;
}

.log-entry:last-child {
  border-bottom: none;
}

.empty-logs {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 20px 0;
}

.success-message {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.success-content {
  background-color: #28a745;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.success-icon {
  font-size: 18px;
  font-weight: bold;
}
</style>