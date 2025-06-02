import { defineStore } from 'pinia'
import { ref } from 'vue'
import placeholderImage from '@/assets/images/placeholder.jpg'
import { SqliteService } from '@/services/sqliteService'

interface CardGroup {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  content: number[];
}

const sqlite = new SqliteService();

export const useCardGroupsStore = defineStore('cardGroups', () => {
  const cardGroups = ref<CardGroup[]>([]) 

  // 异步加载数据的方法
  async function loadCardGroups() {
    const groups = await sqlite.getGroup()
    cardGroups.value = groups.map(group => ({
      id: group.group_id ?? 0,
      title: group.group_name,
      subtitle: group.group_dis ?? "",
      image: placeholderImage,
      content: []
    }))
  }

  return { cardGroups, loadCardGroups }
})
