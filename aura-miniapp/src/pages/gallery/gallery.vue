<template>
  <view class="page">
    <view class="grid">
      <view class="col">
        <CrystalCard v-for="c in leftCol" :key="c.id" :crystal="c" @press="goDetail(c)" />
      </view>

      <view class="col">
        <CrystalCard v-for="c in rightCol" :key="c.id" :crystal="c" @press="goDetail(c)" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import CrystalCard from "@/components/CrystalCard.vue";

type Crystal = {
  id: string;
  name: string;
  tag: string;
  image: string;
  healing: string;
};

const crystals: Crystal[] = [
  {
    id: "amethyst",
    name: "紫水晶",
    tag: "属火 · 直觉",
    image: "https://images.unsplash.com/photo-1615485925600-972abbf15674?auto=format&fit=crop&w=1200&q=80",
    healing: "安定心绪，帮你在纷扰里找回清明。",
  },
  {
    id: "clear-quartz",
    name: "白水晶",
    tag: "属金 · 净化",
    image: "https://images.unsplash.com/photo-1612225330228-7d0f0d3a4fe0?auto=format&fit=crop&w=1200&q=80",
    healing: "像一口清泉，把疲惫与杂念轻轻带走。",
  },
  {
    id: "rose-quartz",
    name: "粉晶",
    tag: "属土 · 心轮",
    image: "https://images.unsplash.com/photo-1599391680198-9b3c2ac1699e?auto=format&fit=crop&w=1200&q=80",
    healing: "柔软地拥抱自己，也更容易被世界温柔以待。",
  },
  {
    id: "citrine",
    name: "黄水晶",
    tag: "属土 · 自信",
    image: "https://images.unsplash.com/photo-1615485925672-80d66e4ae79e?auto=format&fit=crop&w=1200&q=80",
    healing: "点亮内在的太阳，让行动更坚定。",
  },
  {
    id: "obsidian",
    name: "黑曜石",
    tag: "属水 · 护持",
    image: "https://images.unsplash.com/photo-1567393528689-65b7b25bfed4?auto=format&fit=crop&w=1200&q=80",
    healing: "像护盾一样把你包裹起来，稳稳站住。",
  },
  {
    id: "aquamarine",
    name: "海蓝宝",
    tag: "属水 · 沟通",
    image: "https://images.unsplash.com/photo-1586351018720-3c0e1ed0e0c5?auto=format&fit=crop&w=1200&q=80",
    healing: "把想说的话变得清晰、温柔而有力量。",
  },
];

const leftCol = crystals.filter((_, idx) => idx % 2 === 0);
const rightCol = crystals.filter((_, idx) => idx % 2 === 1);

function goDetail(c: Crystal) {
  uni.navigateTo({
    url:
      "/pages/gallery/detail?id=" +
      encodeURIComponent(c.id) +
      "&name=" +
      encodeURIComponent(c.name) +
      "&tag=" +
      encodeURIComponent(c.tag) +
      "&image=" +
      encodeURIComponent(c.image) +
      "&healing=" +
      encodeURIComponent(c.healing),
  });
}
</script>

<style>
.page {
  padding: 24rpx;
}

.grid {
  display: flex;
  gap: 18rpx;
}

.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
</style>

