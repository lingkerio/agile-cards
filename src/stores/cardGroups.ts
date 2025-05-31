import { defineStore } from 'pinia'
import { ref } from 'vue'
import placeholderImage from '@/assets/images/placeholder.jpg'

export const useCardGroupsStore = defineStore('cardGroups', () => {
  const cardGroups = ref([
    {
      id: 1,
      title: 'Vue Basics',
      subtitle: 'Core Vue.js concepts',
      image: placeholderImage,
      content: [1, 4, 5]  // Vue.js, Pinia, Vue Components
    },
    {
      id: 2,
      title: 'Frontend Tech',
      subtitle: 'Modern web development',
      image: placeholderImage,
      content: [7, 8, 9, 2]  // HTML5, CSS Flexbox, ES6, TypeScript
    },
    {
      id: 3,
      title: 'Development Tools',
      subtitle: 'Essential dev tools',
      image: placeholderImage,
      content: [6, 10, 3]  // Git, npm, Capacitor
    },
    {
      id: 4,
      title: 'Backend & DevOps',
      subtitle: 'Server & deployment',
      image: placeholderImage,
      content: [11, 12, 13, 14, 15]  // REST, Docker, CI/CD, JWT, WebSocket
    }
  ])

  return { cardGroups }
})