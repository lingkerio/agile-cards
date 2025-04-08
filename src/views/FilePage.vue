<script setup lang="ts">
import { motion } from "motion-v"
import { ref } from 'vue'

const isExpanded = ref(false)

const handleClick = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <!-- <div class="file-page">
    <h1>文件页面</h1>
    <p>此页面待实现</p>
  </div> -->
  <div class="content">
    <motion.div 
      :initial="{ opacity: 0, scale: 0.8 }"
      :animate="{
        opacity: 1,
        scale: isExpanded ? 1 : 1,
        width: isExpanded ? '100%' : '90%',
        height: isExpanded ? '100%' : '90%',
        margin: '0 auto',
        borderRadius: isExpanded ? '0px' : '10px',
        position: 'fixed',
        top: isExpanded ? '0' : 'auto',
        left: isExpanded ? '0' : 'auto',
        // transformOrigin: 'center',
      }"
      :transition="{
        duration: 0.4,
        type: 'spring',
        bounce: 0.3
      }"
      class="square"
      @click="handleClick">
      <h1>文件页面</h1>
      <p>点击方块来展开/收起</p>
    </motion.div>
  </div>
</template>

<style scoped>
.file-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;  
  height: 845px;
  background-color: red;
}

.square {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #4ff0b7;
  cursor: pointer;
  transition: all 0.4s ease;
}

.square h1 {
  margin-bottom: 1rem;
}
</style>