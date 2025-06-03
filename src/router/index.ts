import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import SettingsPage from '@/views/SettingsPage.vue'
import CardDetailPage from '@/views/CardDetailPage.vue'
import LibPage from '@/views/LibPage.vue'
import TestSQLitePage from '@/views/TestSQLitePage.vue'
import AddChoosePage from '@/views/AddChoosePage.vue'
import AddGroupPage from '@/views/AddGroupPage.vue'
import AddCardsPage from '@/views/AddCardsPage.vue'
import ReviewPage from '@/views/ReviewPage.vue'
import ReviewDetailPage from '@/views/ReviewDetailPage.vue'

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
      component: ReviewPage,
    },
    {
      path: '/review/detail',
      name: 'review-detail',
      component: ReviewDetailPage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    },
    {
      path: '/home/add-choose',
      name: 'add-choose',
      component: AddChoosePage
    },
    {
      path: '/home/add-group',
      name: 'add-group',
      component: AddGroupPage
    },
    {
      path: '/home/add-cards',
      name: 'add-cards',
      component: AddCardsPage
    },
    {
      path: '/lib/cards/:card_id',
      name: 'cards',
      component: CardDetailPage,
      props: true
    }
  ]
})

export default router