<template>
  <view class="page">
    <view class="custom-nav">
      <text class="navTitle">晶鉴</text>
    </view>

    <view class="grid">
      <view class="col">
        <CrystalCard v-for="c in leftCol" :key="c.id" :crystal="c" @press="goDetail(c)" />
      </view>

      <view class="col">
        <CrystalCard v-for="c in rightCol" :key="c.id" :crystal="c" @press="goDetail(c)" />
      </view>
    </view>

    <AuraTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import CrystalCard from "@/components/CrystalCard.vue";
import AuraTabBar from "@/components/AuraTabBar.vue";
import { onShow } from "@dcloudio/uni-app";

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
    image: "http://129.226.144.3/static/crystals/amethyst.png",
    healing: "安定心绪，帮你在纷扰里找回清明。",
  },
  {
    id: "clear-quartz",
    name: "白水晶",
    tag: "属金 · 净化",
    image: "http://129.226.144.3/static/crystals/clear-quartz.png",
    healing: "像一口清泉，把疲惫与杂念轻轻带走。",
  },
  {
    id: "rose-quartz",
    name: "粉水晶",
    tag: "属火 · 心轮",
    image: "http://129.226.144.3/static/crystals/rose-quartz.png",
    healing: "柔软地拥抱自己，也更容易被世界温柔以待。",
  },
  {
    id: "citrine",
    name: "黄水晶",
    tag: "属土 · 自信",
    image: "http://129.226.144.3/static/crystals/citrine.png",
    healing: "点亮内在的太阳，让行动更坚定。",
  },
  {
    id: "obsidian",
    name: "黑曜石",
    tag: "属水 · 护持",
    image: "http://129.226.144.3/static/crystals/obsidian.png",
    healing: "像护盾一样把你包裹起来，稳稳站住。",
  },
  {
    id: "aquamarine",
    name: "海蓝宝",
    tag: "属水 · 沟通",
    image: "http://129.226.144.3/static/crystals/aquamarine.png",
    healing: "把想说的话变得清晰、温柔而有力量。",
  },
];

const leftCol = crystals.filter((_, idx) => idx % 2 === 0);
const rightCol = crystals.filter((_, idx) => idx % 2 === 1);

onShow(() => {
  uni.hideTabBar({ animation: false });
});

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
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 60px) 24rpx calc(env(safe-area-inset-bottom) + 92px) 24rpx;
  box-sizing: border-box;
}

.custom-nav {
  padding-left: 0;
  padding-bottom: 12px;
}

.navTitle {
  font-size: 22px;
  font-weight: 600;
  color: #333333;
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

