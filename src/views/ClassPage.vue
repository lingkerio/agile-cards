<template>
  <div class="horizontal-list">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="list-item"
      @click="getItemPosition(index)"
    >
      <img :src="item.image" alt="Item Image" class="item-image" />
      <div class="item-text">{{ item.text }}</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { image: "https://picsum.photos/200/300", text: "Item 1" },
        { image: "https://picsum.photos/200/300", text: "Item 2" },
        { image: "https://picsum.photos/200/300", text: "Item 3" },
        { image: "https://picsum.photos/200/300", text: "Item 4" },
      ],
    };
  },
  methods: {
    getItemPosition(index) {
      console.log(index)
      // 获取点击的元素
      const itemElement = this.$el.querySelectorAll(".list-item")[index];
      
      // 获取元素的位置信息
      const rect = itemElement.getBoundingClientRect();

      // 打印位置信息
      console.log("Item Position:", {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
    },
  },
};
</script>

<style scoped>
.horizontal-list {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding: 10px;
  gap: 10px;
}

.list-item {
  position: relative;
  flex: 0 0 auto;
  width: 150px;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.list-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-item .item-text {
  position: absolute;
  bottom: 10px;
  left: 10px;
  color: white;
  font-size: 16px;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>