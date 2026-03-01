<template>
  <view class="card glass-panel" @click="emit('press')">
    <image class="img" :src="crystal.image" mode="aspectFill" />
    <view class="meta">
      <text class="name">{{ crystal.name }}</text>
      <text class="tag">{{ crystal.tag }}</text>
      <text v-if="crystal.healing" class="healing">{{ crystal.healing }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
type Crystal = {
  id: string;
  name: string;
  tag: string;
  image: string;
  healing?: string;
};

defineProps<{
  crystal: Crystal;
}>();

const emit = defineEmits<{
  (e: "press"): void;
}>();
</script>

<style>
.card {
  overflow: hidden;
}

.img {
  width: 100%;
  height: 260rpx;
}

.meta {
  padding: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 30rpx;
  color: #222222;
}

.tag {
  font-size: 24rpx;
  color: rgba(51, 51, 51, 0.7);
}

.healing {
  font-size: 24rpx;
  color: rgba(51, 51, 51, 0.78);
  line-height: 1.5;
}
</style>

