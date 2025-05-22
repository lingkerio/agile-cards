import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import ClassPage from '@/views/ClassPage.vue'
import ChatPage from '@/views/ChatPage.vue'
import FilePage from '@/views/FilePage.vue'
import CardDetailPage from '@/views/CardDetailPage.vue'
import AddCardGroupPage from '@/views/AddCardGroupPage.vue'
import LibPage from '@/views/LibPage.vue'
import TestWebDavPage from '../views/TestWebDavPage.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/test-webdav'
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage
    },
    {
      path: '/test-webdav',
      name: 'TestWebDav',
      component: TestWebDavPage
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
      path: '/class',
      name: 'class',
      component: ClassPage
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatPage
    },
    {
      path: '/file',
      name: 'file',
      component: FilePage
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