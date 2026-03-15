<template>
  <view class="energyPillars glass-panel">
    <view v-for="item in energyRows" :key="item.label" class="row">
      <text class="label">{{ item.label }}</text>
      <view class="barTrack">
        <view
          class="barFill"
          :class="{ dominant: item.isDominant, weakest: item.isWeakest }"
          :style="{
            width: `${item.score}%`,
          }"
        />
        <view v-if="item.isWeakest" class="weakDot" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

type EnergyScores = {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
};

const props = defineProps<{
  scores: EnergyScores;
  dominant: string;
}>();

const energyRows = computed(() => {
  const rows = [
    { label: "金", score: clamp(props.scores.metal) },
    { label: "木", score: clamp(props.scores.wood) },
    { label: "水", score: clamp(props.scores.water) },
    { label: "火", score: clamp(props.scores.fire) },
    { label: "土", score: clamp(props.scores.earth) },
  ];

  const weakest = Math.min(...rows.map((r) => r.score));
  return rows.map((r) => ({
    ...r,
    isDominant: r.label === props.dominant,
    isWeakest: r.score === weakest,
  }));
});

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
</script>

<style scoped>
.energyPillars {
  padding: 14px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 10px 30px rgba(166, 141, 194, 0.12);
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  width: 18px;
  font-size: 14px;
  color: rgba(34, 34, 34, 0.66);
  text-align: left;
}

.barTrack {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.barFill {
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  transition: width 500ms ease;
}

.barFill.dominant {
  background: linear-gradient(
    90deg,
    rgba(146, 128, 225, 0.88) 0%,
    rgba(203, 158, 240, 0.82) 46%,
    rgba(255, 184, 146, 0.78) 100%
  );
  background-size: 180% 100%;
  animation: pulse 2s ease-in-out infinite, flow 3.4s linear infinite;
  box-shadow: 0 0 14px rgba(168, 134, 224, 0.42);
}

.barFill.weakest {
  background: rgba(82, 82, 96, 0.42);
}

.weakDot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 102, 102, 0.75);
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 6px rgba(255, 102, 102, 0.45);
}

@keyframes pulse {
  0%,
  100% {
    transform: scaleY(1);
    opacity: 0.9;
  }
  50% {
    transform: scaleY(1.08);
    opacity: 1;
  }
}

@keyframes flow {
  from {
    background-position: 0% 0%;
  }
  to {
    background-position: 180% 0%;
  }
}
</style>
