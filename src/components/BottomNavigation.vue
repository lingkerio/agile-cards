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
    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'home' }" 
      @click="setActiveTab('home')"
    >
      <div class="icon">
        <img src="@/assets/icons/home.svg" alt="Home" />
      </div>
      <span>Home</span>
    </div>
    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'lib' }" 
      @click="setActiveTab('lib')"
    >
      <div class="icon">
        <img src="@/assets/icons/lib.svg" alt="Lib" />
      </div>
      <span>Lib</span>
    </div>
    <!-- <div 
      class="nav-item" 
      :class="{ active: activeTab === 'class' }" 
      @click="setActiveTab('class')"
    >
      <div class="icon">
        <img src="@/assets/icons/class.svg" alt="Class" />
      </div>
      <span>Class</span>
    </div>
    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'chat' }" 
      @click="setActiveTab('chat')"
    >
      <div class="icon">
        <img src="@/assets/icons/chat.svg" alt="Chat" />
      </div>
      <span>Chat</span>
    </div>
    <div 
      class="nav-item" 
      :class="{ active: activeTab === 'file' }" 
      @click="setActiveTab('file')"
    >
      <div class="icon">
        <img src="@/assets/icons/file.svg" alt="File" />
      </div>
      <span>File</span>
    </div> -->
  </nav>
</template>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: -1px;
  width: 101%;
  height: 70px;
  background-color: #2d2d2d;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.nav-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #999;
  transition: color 0.3s ease;
  cursor: pointer;
}

.nav-item.active {
  color: #ffffff;
}

.icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
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