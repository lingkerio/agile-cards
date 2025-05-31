import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import SettingsPage from '@/views/SettingsPage.vue'
import CardDetailPage from '@/views/CardDetailPage.vue'
import AddCardGroupPage from '@/views/AddCardGroupPage.vue'
import LibPage from '@/views/LibPage.vue'
import TestSQLitePage from '@/views/TestSQLitePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage
    },
    {
      path: '/lib',
      name: 'lib',
      component: LibPage
    },
    {
      path: '/lib/groups/:filter',
      name: 'filtered-library',
      component: LibPage,
      props: true
    },
    {
      path: '/review',
      name: 'review',
      component: TestSQLitePage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    },
    {
      path: '/card/:id',
      name: 'card-detail',
      component: CardDetailPage
    },
    {
      path: '/home/add-card-group',
      name: 'add-card-group',
      component: AddCardGroupPage
    }
  ]
})

export default router