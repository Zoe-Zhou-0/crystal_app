<template>
  <view class="page">
    <view class="hero glass-panel">
      <image class="img" :src="crystal.image" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ crystal.name }}</text>
        <text class="tag">{{ crystal.tag }}</text>
        <text class="healing">{{ crystal.healing }}</text>
      </view>
    </view>

    <view class="cta glass-panel" @click="askAura">
      <text class="ctaText">问问 Aura 我适合戴它吗</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { onLoad } from "@dcloudio/uni-app";

type Crystal = {
  id: string;
  name: string;
  tag: string;
  image: string;
  healing: string;
};

const crystal = reactive<Crystal>({
  id: "",
  name: "",
  tag: "",
  image: "",
  healing: "",
});

onLoad((query) => {
  crystal.id = (query?.id ?? "").toString();
  crystal.name = (query?.name ?? "").toString();
  crystal.tag = (query?.tag ?? "").toString();
  crystal.image = (query?.image ?? "").toString();
  crystal.healing = (query?.healing ?? "").toString();
});

function askAura() {
  const ask = `我适合佩戴${crystal.name}吗？请结合我的状态给我一个温柔但专业的建议，并告诉我它更偏向什么能量。`;
  uni.switchTab({
    url: "/pages/index/index",
    success() {
      // switchTab 不支持直接带 query；用全局缓存传参
      uni.setStorageSync("AURA_PENDING_ASK", ask);
    },
  });
}
</script>

<style>
.page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.hero {
  overflow: hidden;
}

.img {
  width: 100%;
  height: 420rpx;
}

.info {
  padding: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.name {
  font-size: 34rpx;
  color: #222222;
}

.tag {
  font-size: 24rpx;
  color: rgba(51, 51, 51, 0.7);
}

.healing {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.85);
  line-height: 1.6;
}

.cta {
  padding: 22rpx 18rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ctaText {
  font-size: 30rpx;
  color: #2c2c2c;
}
</style>

