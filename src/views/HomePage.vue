<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCardGroupsStore } from '@/stores/cardGroups';
import TopBar from '@/components/TopBar.vue';
import CardView from '@/components/CardView.vue'
import AddButton from '@/components/AddButton.vue';

const router = useRouter();
const { cardGroups } = useCardGroupsStore();

const handleAddClick = () => {
  console.log('Add button clicked.')
  router.push('/home/add-card-group');
};

onMounted(() => {
  document.title = 'Cards - Home Page';
});
</script>

<template>
  <div class="home-page">
    <TopBar />
    
    <div class="card-list">
      <h1>Card List</h1>
      <div class="horizon-list">
        <CardView 
          v-for="group in cardGroups" 
          :key="group.id"
          :title="group.title"
          :subtitle="group.subtitle"
          :image="group.image"
          :id="group.id"
          class="card-item"
          />
      </div>
    </div>

    <!-- <div class="content">
      <div class="card-list">
        <CardView 
          :title="Hello, world!"
          :/>
      </div>
    </div> -->
    
    <AddButton @click="handleAddClick" />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  /* background-color: #1e1e1e; */
  /* background-color: red; */
  color: white;
  padding-bottom: 80px; /* 为底部导航留出空间 */
}

.card-list {
  /* background-color: blue; */
  padding: 80px 0 0; /* 顶部留出空间给TopBar */
}

.card-list h1 {
  padding-left: 20px;
}

.horizon-list {
  display: flex; /* 使用 flexbox 实现横向布局 */
  flex-direction: row;
  overflow-x: scroll; /* 添加水平滚动 */
  gap: 20px; /* 图片间距 */
  padding: 10px; /* 内边距 */
  padding-bottom: 0%;
  /* Customize scrollbar */
  scrollbar-width: thin;  /* For Firefox */
  scrollbar-color: #107c10 transparent;  /* For Firefox */
}

/* For Webkit browsers like Chrome/Safari */
.horizon-list::-webkit-scrollbar {
  height: 6px;
}

.horizon-list::-webkit-scrollbar-track {
  background: transparent;
}

.horizon-list::-webkit-scrollbar-thumb {
  background-color: #107c10;
  border-radius: 6px;
}

.horizon-list::-webkit-scrollbar-thumb:hover {
  background-color: #0e6a0e;
}

.card-item {
  flex: 0 0 auto;
  width: 300px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: none;
}

</style>