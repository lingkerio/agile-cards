<script setup lang="ts">
import { motion } from "motion-v"
import { ref } from 'vue'

const isExpanded = ref(false)

const handleClick = () => {
  console.log('clicked');
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <!-- <div class="content"> -->
    <!-- <motion.div 
      :initial="{ opacity: 0, scale: 0.8 }"
      :animate="{
        opacity: 1,
        scale: 1,
        width: isExpanded ? '100vw' : '200px',
        height: isExpanded ? '100vh' : '200px',
        position: 'fixed',
        // transform: isExpanded ? 'translate(0%, 0%)' : 'translate(-50%, -50%)',
        top: isExpanded ? '0' : '50%',
        left: isExpanded ? '0' : '50%',
        backgroundColor: isExpanded ? '#000000' : '#2196f3',
        borderRadius: isExpanded ? '0px' : '10px'
      }"
      :transition="{
        duration: 1,
        type: 'spring',
        bounce: 0.3
      }"
      class="square"
      @click="handleClick">
      <h1>文件页面</h1>
      <p>点击方块来展开/收起</p>
      <p v-if="isExpanded">nihao</p>
    </motion.div> -->
  <!-- </div> -->

  <div class="content">
    <motion.div
      :initial="{ opacity: 0, scale: 0.8 }"
      :animate="{
        opacity: 1,
        scale: 1,
        width: isExpanded ? '100vw' : '200px',
        height: isExpanded ? '100vh' : '200px',
        // top: isExpanded ? '0' : '50%',
        // left: isExpanded ? '0' : '50%',
        backgroundColor: isExpanded ? '#000000' : '#2196f3',
        borderRadius: isExpanded ? '0px' : '10px'
      }"
      :transition="{
        duration: 0.4,
        type: 'spring',
        bounce: 0.3
      }"
      @click="handleClick"
      class="block"
      >
      <h3>Hello</h3>
      <p>world</p>
    </motion.div>
  </div>

</template>

<style scoped>
.content {
  width: 100vw;
  height: 100vh;
  background-color: red;
}

.square {
  align-items: center;
  color: white;
  cursor: pointer;
}

.block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  background-color: blue;
}
</style>