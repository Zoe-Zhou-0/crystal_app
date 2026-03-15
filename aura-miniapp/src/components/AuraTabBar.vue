<template>
  <view class="aura-tab-bar">
    <view class="tab-inner">
      <view class="tab-item" :class="{ active: current === 0 }" @click="switchTab(0, '/pages/index/index')">
        <view class="icon-wrap">
          <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3L13.7 10.3L21 12L13.7 13.7L12 21L10.3 13.7L3 12L10.3 10.3Z" />
            <path d="M18.2 5.8L18.9 8.4L21.5 9.1L18.9 9.8L18.2 12.4L17.5 9.8L14.9 9.1L17.5 8.4Z" />
          </svg>
        </view>
        <text class="tab-label">聊愈</text>
        <view v-if="current === 0" class="energy-dot" />
      </view>

      <view class="tab-item" :class="{ active: current === 1 }" @click="switchTab(1, '/pages/gallery/gallery')">
        <view class="icon-wrap">
          <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3L19 8V16L12 21L5 16V8Z" />
            <path d="M12 3V21" />
            <path d="M5 8L12 12L19 8" />
            <path d="M5 16L12 12L19 16" />
          </svg>
        </view>
        <text class="tab-label">晶鉴</text>
        <view v-if="current === 1" class="energy-dot" />
      </view>

      <view class="tab-item" :class="{ active: current === 2 }" @click="switchTab(2, '/pages/mine/mine')">
        <view class="icon-wrap">
          <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9L12 6L20 9V18H4Z" />
            <path d="M12 6V3.5" />
            <path d="M10.2 4.8H13.8" />
            <path d="M12 11V15" />
            <path d="M10 13H14" />
          </svg>
        </view>
        <text class="tab-label">晶匣</text>
        <view v-if="current === 2" class="energy-dot" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    current?: number;
  }>(),
  {
    current: 0,
  }
);

function switchTab(index: number, path: string) {
  if (index === props.current) return;
  uni.switchTab({
    url: path,
    fail: () => {
      uni.reLaunch({ url: path });
    },
  });
}
</script>

<style scoped>
.aura-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.tab-inner {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
}

.tab-item {
  position: relative;
  min-width: 98px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  top: -3px;
}

.icon-wrap {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon {
  width: 22px;
  height: 22px;
  stroke: rgba(60, 60, 67, 0.4);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: stroke 0.3s ease;
}

.tab-item.active .tab-icon {
  stroke: rgba(182, 147, 214, 1);
}

.tab-label {
  font-size: 17px;
  margin-top: 2px;
  color: rgba(60, 60, 67, 0.4);
  transition: color 0.3s ease;
  line-height: 1;
}

.tab-item.active .tab-label {
  color: rgba(182, 147, 214, 1);
}

.energy-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #b693d6;
  box-shadow: 0 0 6px #b693d6;
  position: absolute;
  bottom: -8px;
  animation: dotFloatIn 0.28s ease forwards;
}

@keyframes dotFloatIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
