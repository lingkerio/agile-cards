<script setup lang="ts">
import { SqliteService } from '@/services/databaseService' // 确保路径正确

import type { KnowledgeCard, KnowledgeCardGroup, ReviewScore } from '@/services/interfaces/database' // 导入接口

import { ref, onMounted, onUnmounted } from 'vue'

// 实例化数据库服务
const sqliteService = new SqliteService();

// UI 状态变量
const message = ref<string>('点击按钮开始测试...');
const currentCard = ref<KnowledgeCard | null>(null);
const cardsDue = ref<KnowledgeCard[]>([]);
const allGroups = ref<KnowledgeCardGroup[]>([]);
const exportedSQL = ref<string>(''); // 用于存储导出的SQL字符串
const importSQLInput = ref<string>(''); // 用于输入导入的SQL字符串

// 自动初始化并重置数据库服务
onMounted(async () => {
  try {
    message.value = '正在重置数据库...';
    // 在这里调用 resetDatabase，它会确保数据库打开、表创建、并插入初始数据
    await sqliteService.resetDatabase();
    message.value = '数据库重置并初始化成功！点击“加载下一张卡片”开始复习。';
    // console.log('数据库重置并初始化成功！');

    // 可以在初始化后立即加载第一张卡片，以便用户直接开始测试
    await loadDueCards();

  } catch (e: any) {
    message.value = `数据库重置/初始化失败: ${e.message}`;
    console.error('数据库重置/初始化失败:', e);
  }
});

// 组件卸载时关闭数据库连接
onUnmounted(async () => {
  try {
    await sqliteService.close();
    // console.log('数据库连接已关闭。');
  } catch (e: any) {
    console.error('关闭数据库连接失败:', e);
  }
});

/**
 * 加载并显示待复习卡片
 */
const loadDueCards = async () => {
  try {
    cardsDue.value = await sqliteService.getDueCards(1); // 每次加载一张进行测试

    if (cardsDue.value.length > 0) {
      currentCard.value = cardsDue.value[0];
      message.value = `加载到期卡片成功！正在复习卡片 ID: ${currentCard.value.id} - ${currentCard.value.question}`;
    } else {
      const newCards = await sqliteService.getNewCards(1);
      if (newCards.length > 0) {
        currentCard.value = newCards[0];
        message.value = `没有到期卡片，加载新卡片成功！正在学习卡片 ID: ${currentCard.value.id} - ${currentCard.value.question}`;
      } else {
        currentCard.value = null;
        message.value = '所有卡片都已复习或学习中，今天没有到期卡片了。';
      }
    }
    // console.log('当前待复习卡片：', cardsDue.value);
  } catch (e: any) {
    message.value = `加载卡片失败: ${e.message}`;
    console.error('加载卡片失败:', e);
  }
};

/**
 * 模拟复习卡片并更新状态
 * @param score 评分 (0-5)
 */
const reviewCard = async (score: ReviewScore) => {
  if (!currentCard.value || currentCard.value.id === undefined) {
    message.value = '没有当前卡片可供复习。请先加载卡片。';
    return;
  }

  try {
    const cardIdToReview = currentCard.value.id;
    await sqliteService.updateCardReviewStatus(cardIdToReview, score);
    message.value = `卡片 ID ${cardIdToReview} 复习完成，评分为 ${score}。`;
    // console.log(`卡片 ${cardIdToReview} 状态已更新。`);

    await loadDueCards(); // 自动加载下一张卡片

  } catch (e: any) {
    message.value = `复习卡片失败: ${e.message}`;
    console.error('复习卡片失败:', e);
  }
};

/**
 * 添加一张新的测试卡片
 */
const addNewTestCard = async () => {
  try {
    const newCardData = {
      question: '这是测试卡片的问题？' + Math.floor(Math.random() * 100), // 随机化问题防止重复
      answer: '这是测试卡片的答案！',
      group_id: 0, // 默认分组
    };
    const newCardId = await sqliteService.addCard(newCardData);
    message.value = `新卡片添加成功，ID 为 ${newCardId}。`;
    // console.log('新卡片添加成功，ID:', newCardId);
  } catch (e: any) {
    message.value = `添加新卡片失败: ${e.message}`;
    console.error('添加新卡片失败:', e);
  }
};

/**
 * 删除最后一张卡片
 */
const deleteTestCard = async () => {
  try {
    // 查询最后一张卡片的 ID
    const { values: lastCard } = await sqliteService.db?.query(
      `SELECT id FROM knowledge_cards ORDER BY id DESC LIMIT 1`
    );

    if (lastCard && lastCard.length > 0) {
      const cardIdToDelete = lastCard[0].id; // 获取最后一张卡片的 ID
      await sqliteService.deleteCard(cardIdToDelete);
      message.value = `卡片 ID ${cardIdToDelete} 删除成功。`;
      // console.log(`卡片 ${cardIdToDelete} 删除成功。`);

      // 如果删除了当前显示的卡片，清空当前卡片
      if (currentCard.value && currentCard.value.id === cardIdToDelete) {
        currentCard.value = null;
      }
    } else {
      message.value = '没有卡片可删除。';
      // console.log('没有卡片可删除。');
    }
  } catch (e: any) {
    message.value = `删除卡片失败: ${e.message}`;
    console.error('删除卡片失败:', e);
  }
};

/**
 * 加载所有分组
 */
const loadAllGroups = async () => {
  try {
    allGroups.value = await sqliteService.getAllGroups();
    message.value = `加载所有分组成功。`;
    // console.log('所有分组:', allGroups.value);
  } catch (e: any) {
    message.value = `加载分组失败: ${e.message}`;
    console.error('加载分组失败:', e);
  }
};

/**
 * 添加一个新分组
 */
const addNewGroup = async () => {
  try {
    const newGroupId = await sqliteService.addGroup({
      title: `我的新分组 ${Math.floor(Math.random() * 1000)}`, // 随机化标题防止重复
      subtitle: '这是一个测试分组',
    });
    message.value = `新分组添加成功，ID 为 ${newGroupId}。`;
    // console.log('新分组添加成功，ID:', newGroupId);
    await loadAllGroups(); // 重新加载分组列表
  } catch (e: any) {
    message.value = `添加新分组失败: ${e.message}`;
    console.error('添加新分组失败:', e);
  }
};

/**
 * 导出数据库为 SQL 字符串
 */
const exportDatabase = async () => {
  try {
    exportedSQL.value = await sqliteService.exportToSQL();
    message.value = '数据库已成功导出为 SQL 字符串。请查看下方文本区域。';
    // console.log('导出的 SQL:', exportedSQL.value);
  } catch (e: any) {
    message.value = `导出数据库失败: ${e.message}`;
    console.error('导出数据库失败:', e);
  }
};

/**
 * 从 SQL 字符串导入数据库
 */
const importDatabase = async () => {
  if (!importSQLInput.value) {
    message.value = '请在文本区域输入要导入的 SQL 字符串。';
    return;
  }
  try {
    message.value = '正在导入数据库...';
    await sqliteService.importFromSQL(importSQLInput.value);
    message.value = '数据库导入成功！请重新加载卡片和分组以查看。';
    // console.log('数据库导入成功。');
    // 导入后，需要重新加载数据以刷新UI
    await loadDueCards();
    await loadAllGroups();
  } catch (e: any) {
    message.value = `导入数据库失败: ${e.message}`;
    console.error('导入数据库失败:', e);
  }
};
</script>

<template>
  <div style="padding: 20px;">
    <h1>SQLite 服务测试</h1>

    <p style="font-size: 1.1em; font-weight: bold; color: blue;">{{ message }}</p>

    <hr style="margin: 20px 0;">

    <h2>卡片复习</h2>
    <div v-if="currentCard">
      <h3>问题: {{ currentCard.question }}</h3>
      <p>答案: {{ currentCard.answer }}</p>
      <p>状态: {{ currentCard.status }} | E-Factor: {{ currentCard.easiness_factor.toFixed(2) }} | 复习次数: {{ currentCard.repetitions }} | 间隔: {{ currentCard.interval }}天</p>
      <p>下次复习: {{ currentCard.next_review_at ? new Date(currentCard.next_review_at).toLocaleString() : 'N/A' }}</p>
      <div style="margin-top: 10px;">
        <button @click="reviewCard(5)" style="background-color: green;">评分 5 (完美)</button>
        <button @click="reviewCard(3)" style="background-color: orange;">评分 3 (勉强)</button>
        <button @click="reviewCard(1)" style="background-color: red;">评分 1 (忘记)</button>
      </div>
    </div>
    <div v-else>
      <p>没有卡片待复习。</p>
    </div>
    <button @click="loadDueCards" style="margin-top: 20px;">加载下一张卡片</button>

    <hr style="margin: 20px 0;">

    <h2>卡片管理</h2>
    <button @click="addNewTestCard">添加新测试卡片</button>
    <button @click="deleteTestCard" style="margin-left: 10px;">删除测试卡片</button>

    <hr style="margin: 20px 0;">

    <h2>分组管理</h2>
    <button @click="loadAllGroups">加载所有分组</button>
    <button @click="addNewGroup" style="margin-left: 10px;">添加新分组</button>

    <div v-if="allGroups.length > 0" style="margin-top: 10px;">
      <h3>所有分组列表:</h3>
      <ul>
        <li v-for="group in allGroups" :key="group.id">
          ID: {{ group.id }} - {{ group.title }} ({{ group.subtitle }})
        </li>
      </ul>
    </div>

    <hr style="margin: 20px 0;">

    <h2>导入/导出数据库</h2>
    <button @click="exportDatabase">导出数据库为 SQL</button>
    <div style="margin-top: 10px;">
      <textarea v-model="exportedSQL" rows="10" cols="80" placeholder="导出的 SQL 会显示在这里..."></textarea>
    </div>

    <button @click="importDatabase" style="margin-top: 10px;">从 SQL 导入数据库</button>
    <div style="margin-top: 20px;">
      <textarea v-model="importSQLInput" rows="10" cols="80" placeholder="粘贴要导入的 SQL 语句到这里..."></textarea>
    </div>
  </div>
</template>

<style scoped>
button {
  padding: 10px 15px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  font-size: 16px;
}

button:hover {
  opacity: 0.9;
}

button[style*="background-color: green"] {
  background-color: #28a745;
}
button[style*="background-color: orange"] {
  background-color: #ffc107;
  color: black;
}
button[style*="background-color: red"] {
  background-color: #dc3545;
}

textarea {
  width: calc(100% - 10px);
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>