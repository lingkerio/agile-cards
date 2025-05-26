<template>
  <div class="horizontal-list">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="card-wrapper"
      :class="{ flipped: flippedIndex === index }"
      @click="flipCard(index)"
    >
      <div class="card-inner">
        <!-- 正面 -->
        <div class="card-face card-front">
          <img :src="item.image" alt="img" class="card-image" />
          <div class="card-text">{{ item.front }}</div>
        </div>

        <!-- 背面 -->
        <div class="card-face card-back">
          <img :src="item.image" alt="img" class="card-image" />
          <div class="card-text">{{ item.back }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      flippedIndex: null,
      items: [
        {
          front: 'apple',
          back: '苹果，一种常见的水果',
          image: 'https://picsum.photos/id/1011/200/120',
        },
        {
          front: 'banana',
          back: '香蕉，黄色弯弯的水果',
          image: 'https://picsum.photos/id/1015/200/120',
        },
        {
          front: 'cat',
          back: '猫，一种常见的宠物动物',
          image: 'https://picsum.photos/id/1025/200/120',
        },
        {
          front: 'dog',
          back: '狗，人类忠实的朋友',
          image: 'https://picsum.photos/id/1024/200/120',
        },
      ],
    };
  },
  methods: {
    flipCard(index) {
      this.flippedIndex = this.flippedIndex === index ? null : index;

      const itemElement = this.$el.querySelectorAll(".card-wrapper")[index];
      const rect = itemElement.getBoundingClientRect();
      console.log("Item Position:", rect);
    },
  },
};
</script>

<style scoped>
.horizontal-list {
  display: flex;
  overflow-x: auto;
  padding: 20px;
  gap: 20px;
  scroll-snap-type: x mandatory;
}

.card-wrapper {
  flex: 0 0 auto;
  width: 200px;
  height: 260px;
  perspective: 1000px;
  scroll-snap-align: center;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card-wrapper.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background-color: #2d2d2d;
  color: white;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  overflow: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.card-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.card-text {
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  text-align: center;
}
</style>
