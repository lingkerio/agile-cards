<script setup lang="ts">

// const opacity = ref(0);

// const handleScroll = () => {
//   const scrollTop = window.scrollY;
//   opacity.value = Math.min(scrollTop / 30, 1);
// };

// onMounted(() => {
//   window.addEventListener('scroll', handleScroll);
// });

// onUnmounted(() => {
//   window.removeEventListener('scroll', handleScroll);
// });
import avatorHoldPlace from '@/assets/images/avatar.svg'
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<{
  info:     string;
  status:   string;
  card_num: number;
}>();
</script>

<template>
  <div class="top-bar">
      <div class="user-info">
        <div class="avatar">
          <img :src="avatorHoldPlace" alt="User Avatar" />
        </div>
        <div class="info">
          <div class="infomation">{{ props.info }}</div>
          <div class="status">{{ props.status }}</div>
        </div>
      </div>
      <div class="card-info" @click="router.push('/lib')">
        <div class="card-count">{{ card_num }} 张卡片</div>
      </div>
    </div>
</template>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 10vh;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5vw;
  padding-top: 20px;
  z-index: 50;
  transition: background-color 0.15s ease;
  background-color: #1e1e1e;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 5vh;
  height: 5vh;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  padding-left: 1vw;
  display: flex;
  flex-direction: column;
}

.infomation {
  font-weight: bold;
  color: white;
  font-size: 16px;
  padding-bottom: 0.1vh;
}

.status {
  color: #9eff9e;
  font-size: 12px;
}

.lib-topbar {
  font-weight: bold;
  color: white;
  font-size: 20px;
}

.card-info {
  background-color: #353535;
  padding: 8px 12px;
  border-radius: 10px;
  height: 4vh;
  display: flex;
  align-items: center;    
  justify-content: center;
  text-align: center;
  transition: 0.15s;
}

.card-info:hover {
  background-color: #303030;
}

.card-count {
  color: white;
  font-size: 14px;
}


</style>