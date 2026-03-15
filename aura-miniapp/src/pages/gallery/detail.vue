<template>
  <view class="page">
    <view class="topBar" :style="{ paddingTop: statusBarH + 'px', height: navBarH + 'px' }">
      <view class="navContent" :style="{ height: navContentH + 'px' }">
        <view class="backBtn" @click="goBack">
          <text class="backArrow">‹</text>
          <text class="backLabel">返回</text>
        </view>
      </view>
    </view>

    <view class="contentArea" :style="{ marginTop: navBarH + 'px' }">
      <text class="pageTitle">水晶详情</text>
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
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const statusBarH = ref(44);
const navContentH = ref(32);
const navBarH = ref(76);

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
  const sys = uni.getSystemInfoSync();
  const menuRect = uni.getMenuButtonBoundingClientRect?.();
  const sbH = sys?.statusBarHeight ?? 44;
  statusBarH.value = sbH;
  if (menuRect) {
    navContentH.value = menuRect.height;
    const gap = menuRect.top - sbH;
    navBarH.value = sbH + gap + menuRect.height + gap;
  } else {
    navContentH.value = 32;
    navBarH.value = sbH + 40;
  }

  const decodeSafe = (v: unknown) => {
    const raw = (v ?? "").toString();
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };

  crystal.id = decodeSafe(query?.id);
  crystal.name = decodeSafe(query?.name);
  crystal.tag = decodeSafe(query?.tag);
  crystal.image = decodeSafe(query?.image);
  crystal.healing = decodeSafe(query?.healing);
});

function goBack() {
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: "/pages/gallery/gallery" });
    },
  });
}

function askAura() {
  const ask = `我适合佩戴${crystal.name}吗？请结合我的状态给我一个温柔但专业的建议，并告诉我它更偏向什么能量。`;
  uni.switchTab({
    url: "/pages/index/index",
    success() {
      uni.setStorageSync("AURA_PENDING_ASK", ask);
    },
  });
}
</script>

<style>
.page {
  padding: 24rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.topBar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: #FDFCF8;
  box-sizing: border-box;
}

.navContent {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.backBtn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px 4px 6px;
  border-radius: 16px;
  background: rgba(182, 147, 214, 0.12);
  margin-right: 12px;
}

.backArrow {
  font-size: 20px;
  color: #8B6BA8;
  line-height: 1;
}

.backLabel {
  font-size: 13px;
  color: #8B6BA8;
  font-weight: 500;
}

.pageTitle {
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 10px 0 20px 0;
}

.contentArea {
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
