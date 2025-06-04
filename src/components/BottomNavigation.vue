<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const activeTab = computed(() => {
  const path = route.path;
  if (!path || path === '/') return '';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanPath.split('/')[0]
});

const setActiveTab = (tab: string) => {
  const path = `/${tab}`;
  router.push(path);
};
</script>

<template>
  <nav class="bottom-navigation">
    <div class="nav-padding"></div>
    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'home' }" 
      @click="setActiveTab('home')"
    >
      <div class="icon">
        <img src="@/assets/icons/home.svg" alt="Home" />
      </div>
      <span>主页</span>
    </div>

    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'lib' }" 
      @click="setActiveTab('lib')"
    >
      <div class="icon">
        <img src="@/assets/icons/lib.svg" alt="Lib" />
      </div>
      <span>卡片</span>
    </div>

    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'review' }" 
      @click="setActiveTab('review')"
    >
      <div class="icon">
        <img src="@/assets/icons/review.svg" alt="Review" />
      </div>
      <span>复习</span>
    </div>

    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'settings' }" 
      @click="setActiveTab('settings')"
    >
      <div class="icon">
        <img src="@/assets/icons/settings.svg" alt="Settings" />
      </div>
      <span>设置</span>
    </div>
    <div class="nav-padding"></div>
  </nav>
</template>

<style scoped>
.bottom-navigation {
  position: fixed;
  left: -1vw;
  bottom: -5px;
  width: 102vw;
  height: 90px;
  background-color: #2d2d2d;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  padding-bottom: 32px;
}

.nav-padding {
  height: 9vh;
  width: 3vw;
}

.nav-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  height: 100%;
  color: #999;
  transition: color 0.15s ease;
  cursor: pointer;
}

.nav-item.active {
  color: #ffffff;
}

.icon {
  width: 25px;
  height: 25px;
  margin-top: -1vh;
  margin-bottom: 3px;
}

.icon img {
  width: 100%;
  height: 100%;
  filter: brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

.nav-item.active .icon img {
  filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

span {
  font-size: 12px;
}
</style>