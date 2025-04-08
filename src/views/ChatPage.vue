<script setup>
import { motion } from "motion-v"
</script>

<template>
    <motion.div
        :animate="{
            scale: [1, 2, 2, 1, 1],
            rotate: [0, 0, 180, 180, 0],
            top: ['200px', '200px', '100px', '100px', '200px'],
            left: ['100px', '100px', '200px', '200px', '100px'],
            borderRadius: ['0%', '0%', '50%', '50%', '0%']
        }"
        :transition="{
            duration: 2,
            ease: 'easeInOut',
            // type: 'spring',
            times: [0, 0.2, 0.5, 0.8, 1],
            repeat: Infinity,
            bounce: 2
            // repeatDelay: 1
        }"
        class="box"
    />
</template>

<style>
.box {
    width: 100px;
    height: 100px;
    background-color: #f5f5f5;
    border-radius: 5px;
    position: fixed;
    top: 200px;
    left: 150px;
}
</style>