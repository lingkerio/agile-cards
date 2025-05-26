<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCardsStore } from '@/stores/cards'
import { useCardGroupsStore } from '@/stores/cardGroups'
import TopBar from '@/components/TopBar.vue'

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
    
  </div>


<!-- ✅ 固定底部同步按钮 -->
<div class="webdav-fixed-button">
  <button @click="handleWebDAVSync">WebDAV 同步（预留）</button>
</div>

  
</template>

<style scoped>
.lib-page {
  padding: 20px;
  background-color: #1e1e1e;
  height: 100vh;
  overflow: hidden;  /* 防止页面本身滚动 */
}

.controls {
  position: fixed;
  top: 70px;
  width: 100vw;
  left: 0;
  background-color: #1e1e1e;
  /* padding: 20px 0 0 0; */
  z-index: 300;
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
  /* Customize scrollbar */
  /* scrollbar-width: thin;
  scrollbar-color: #107c10 transparent; */
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
  /* grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); */
  position: fixed;
  top: 200px;
  left: 3vw;
  gap: 20px;
  padding: 0 10px 30px 2vw;
  height: calc(100vh - 260px);  /* 减去顶部控件和底部导航的高度 */
  overflow-y: auto;
  /* scrollbar-width: thin;
  scrollbar-color: #107c10 transparent; */
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
  /* height: 100px; */
  width: calc(90vw - 15px);
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
.webdav-fixed-button {
  position: fixed;
  bottom: 80px; /* 保证不遮住底部导航栏 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
}

.webdav-fixed-button button {
  background-color: #42b983;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.webdav-fixed-button button:hover {
  background-color: #36986f;
}

</style>