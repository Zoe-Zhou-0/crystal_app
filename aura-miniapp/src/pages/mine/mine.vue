<template>
  <view class="page">
    <view class="header glass-panel">
      <text class="title">晶匣</text>
      <text class="subtitle">你的跨品牌水晶资产管家（MVP 占位）</text>
    </view>

    <view class="section glass-panel">
      <text class="sectionTitle">我的水晶</text>
      <view class="row">
        <text class="hint">尚未录入。后续会支持迎请与注入仪式、消磁 SPA。</text>
      </view>
    </view>

    <view class="section glass-panel">
      <text class="sectionTitle">仪式感入口</text>
      <view class="row">
        <text class="hint">满月提醒 / 线上消磁冥想（后续开放）</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts"></script>

<style>
.page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.header {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.title {
  font-size: 36rpx;
  color: #222222;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(51, 51, 51, 0.7);
}

.section {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.sectionTitle {
  font-size: 30rpx;
  color: #2c2c2c;
}

.row {
  display: flex;
}

.hint {
  font-size: 26rpx;
  color: rgba(51, 51, 51, 0.75);
  line-height: 1.6;
}
</style>

