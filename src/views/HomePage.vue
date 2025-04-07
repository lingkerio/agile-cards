<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from '@/components/TopBar.vue';
import CardGroup from '@/components/CardGroup.vue';
import AddButton from '@/components/AddButton.vue';
import placeholderImage from '@/assets/images/placeholder.svg';

const router = useRouter();

// 模拟卡片组数据
const cardGroups = ref([
  {
    id: 1,
    title: '每日学习',
    subtitle: '努力工作中！',
    image: placeholderImage
  },
  {
    id: 2,
    title: '编程知识',
    subtitle: '代码的世界',
    image: placeholderImage
  },
  {
    id: 3,
    title: '外语学习',
    subtitle: '探索新语言',
    image: placeholderImage
  },
  {
    id: 4,
    title: '数学公式',
    subtitle: '数学的奥秘',
    image: placeholderImage
  }
]);

// 处理卡片组点击
const handleCardClick = (id: number) => {
  router.push(`/card/${id}`);
};

// 处理添加按钮点击
const handleAddClick = () => {
  router.push('/add-card-group');
};

onMounted(() => {
  // 页面加载时的初始化逻辑
  document.title = 'Cards - Home Page';
});
</script>

<template>
  <div class="home-page">
    <TopBar />
    
    <div class="content">
      <div class="card-list">
        <CardGroup 
          v-for="group in cardGroups" 
          :key="group.id"
          :title="group.title"
          :subtitle="group.subtitle"
          :image="group.image"
          class="card-item"
          @click="handleCardClick(group.id)"
        />
      </div>
    </div>
    
    <AddButton @click="handleAddClick" />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  padding-bottom: 80px; /* 为底部导航留出空间 */
}

.content {
  padding: 80px 16px 16px; /* 顶部留出空间给TopBar */
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 20px;
}

.card-item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-item:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

/* 媒体查询，适配不同屏幕尺寸 */
@media (min-width: 768px) {
  .card-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1200px) {
  .card-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>