<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCardsStore } from '@/stores/cards'
import { useCardGroupsStore } from '@/stores/cardGroups'

const props = defineProps<{
  filter?: string
}>()

const cardsStore = useCardsStore()
const cardGroupsStore = useCardGroupsStore()
const { cards } = cardsStore
const { cardGroups } = cardGroupsStore

const searchQuery = ref('')
const activeFilter = ref('all')
const currentSearchTerm = ref('')

onMounted(() => {
  if (props.filter) {
    activeFilter.value = props.filter
  }
})

const handleSearch = () => {
  currentSearchTerm.value = searchQuery.value
}

const clearSearch = () => {
  searchQuery.value = '';
  currentSearchTerm.value = '';
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
  if (currentSearchTerm.value) {
    const query = currentSearchTerm.value.toLowerCase()
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
    <div class="controls">
      <div class="search-container">
        <div class="input-wrapper">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search cards..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button 
            v-if="searchQuery"
            class="clear-button"
            @click="clearSearch"
          >
            ×
          </button>
        </div>
        <button class="search-button" @click="handleSearch">
          Search
        </button>
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

    <div class="cards-grid">
      <div v-for="card in filteredCards" :key="card.id" class="card">
        <h3>{{ card.question }}</h3>
        <p>{{ card.answer }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lib-page {
  padding: 20px;
  background-color: #1e1e1e;
  min-height: 100vh;
}

.controls {
  position: sticky;
  top: 0;
  background-color: #1e1e1e;
  padding: 20px 0;
  z-index: 10;
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
  border-radius: 25px;
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
  border-color: #2196f3;
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
  border-radius: 25px;
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
  margin: 15px 0;
  overflow-x: auto;
  padding: 5px 0;
  /* Customize scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #107c10 transparent;
}

/* For Webkit browsers */
.filter-tabs::-webkit-scrollbar {
  height: 4px;
}

.filter-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.filter-tabs::-webkit-scrollbar-thumb {
  background-color: #107c10;
  border-radius: 6px;
}

.filter-tabs::-webkit-scrollbar-thumb:hover {
  background-color: #0e6a0e;
}

.filter-tab {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.card {
  padding: 20px;
  background-color: #107c10;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: scale(1.02);
}

.card h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.card p {
  margin: 0;
  opacity: 0.9;
}
</style>