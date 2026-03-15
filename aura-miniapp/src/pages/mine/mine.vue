<template>
  <view class="page">
    <view v-if="userEnergyData" class="energyPanel glass-panel">
      <text class="energyTitle">✨ Aura 能量图谱 | 主导能量：{{ userEnergyData.dominant }}</text>
      <EnergyPillars :scores="userEnergyData.scores" :dominant="userEnergyData.dominant" />
      <view class="energyAction" @click="openResultModal">
        <text class="energyActionText">查看完整疗愈解读</text>
        <text class="energyActionArrow">›</text>
      </view>
    </view>

    <view v-else class="energyGuide glass-panel">
      <text class="guideTitle">尚未建立能量图谱</text>
      <text class="guideHint">先完成五行测算，Aura 会为你生成个性化能量图谱与疗愈建议。</text>
      <view class="guideBtn" @click="goToInitForm">
        <text class="guideBtnText">前往测算</text>
      </view>
    </view>

    <view class="section glass-panel">
      <text class="sectionTitle">我的水晶</text>
      <view class="row">
        <text class="hint">迎请与注入仪式、消磁 SPA（后续开放）。</text>
      </view>
    </view>

    <view class="section glass-panel">
      <text class="sectionTitle">仪式感入口</text>
      <view class="row">
        <text class="hint">满月提醒 / 线上消磁冥想（后续开放）</text>
      </view>
    </view>

    <view v-if="showResultModal" class="resultMask" @click="closeResultModal">
      <view class="resultPanel glass-panel" @click.stop>
        <view class="resultHead">
          <text class="resultTitle">Aura 疗愈解读</text>
          <view class="resultClose" @click="closeResultModal">
            <text class="resultCloseText">关闭</text>
          </view>
        </view>
        <scroll-view class="resultContent" scroll-y>
          <text class="resultText">{{ resultDetailText }}</text>
        </scroll-view>
      </view>
    </view>

    <AuraTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { apiUrl, getDataApiHeaders } from "@/utils/api";
import EnergyPillars from "@/components/EnergyPillars.vue";
import AuraTabBar from "@/components/AuraTabBar.vue";

type EnergyScores = {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
};

type BaziResult = {
  dominant: string;
  scores: EnergyScores;
  detailText?: string;
  reading?: string;
  report?: string;
};

const userEnergyData = ref<BaziResult | null>(null);
const showResultModal = ref(false);

const resultDetailText = computed(() => {
  const data = userEnergyData.value;
  if (!data) return "";
  return (
    data.detailText ||
    data.reading ||
    data.report ||
    `主导能量：${data.dominant}\n五行分布：金 ${data.scores.metal} / 木 ${data.scores.wood} / 水 ${data.scores.water} / 火 ${data.scores.fire} / 土 ${data.scores.earth}`
  );
});

function loadFromLocal() {
  const raw = uni.getStorageSync("baziResult");
  if (!raw) {
    userEnergyData.value = null;
    return;
  }
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed?.scores && parsed?.dominant) {
      userEnergyData.value = parsed as BaziResult;
    } else {
      userEnergyData.value = null;
    }
  } catch {
    userEnergyData.value = null;
  }
}

function loadBaziResultFromStorage() {
  uni.request({
    url: apiUrl("/api/bazi"),
    method: "GET",
    header: getDataApiHeaders(),
    success: (res) => {
      const r = (res.data as any)?.result;
      if ((res.statusCode ?? 0) === 200 && r?.scores && r?.dominant) {
        userEnergyData.value = { dominant: r.dominant, scores: r.scores, detailText: r.detailText };
        uni.setStorageSync("baziResult", userEnergyData.value);
        return;
      }
      loadFromLocal();
    },
    fail: () => loadFromLocal(),
  });
}

function openResultModal() {
  if (!userEnergyData.value) return;
  showResultModal.value = true;
}

function closeResultModal() {
  showResultModal.value = false;
}

function goToInitForm() {
  // 优先按需求跳转 /pages/init/init；若未注册该路由，回退到现有 onboarding 页面
  uni.navigateTo({
    url: "/pages/init/init",
    fail: () => {
      uni.navigateTo({ url: "/pages/onboarding/onboarding" });
    },
  });
}

onShow(() => {
  uni.hideTabBar({ animation: false });
  loadBaziResultFromStorage();
});
</script>

<style>
.page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 116px) 24rpx calc(env(safe-area-inset-bottom) + 132rpx) 24rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.energyPanel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.energyTitle {
  font-size: 30rpx;
  font-weight: 600;
  color: rgba(103, 74, 151, 0.95);
}

.energyAction {
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.energyActionText {
  font-size: 26rpx;
  color: rgba(61, 61, 61, 0.86);
}

.energyActionArrow {
  font-size: 30rpx;
  color: rgba(61, 61, 61, 0.5);
}

.energyGuide {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guideTitle {
  font-size: 30rpx;
  color: rgba(34, 34, 34, 0.92);
  font-weight: 600;
}

.guideHint {
  font-size: 26rpx;
  line-height: 1.65;
  color: rgba(51, 51, 51, 0.72);
}

.guideBtn {
  align-self: flex-start;
  margin-top: 2px;
  padding: 10rpx 18rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.2);
}

.guideBtnText {
  font-size: 25rpx;
  color: rgba(58, 58, 58, 0.9);
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

.resultMask {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(253, 252, 248, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  box-sizing: border-box;
}

.resultPanel {
  width: 100%;
  height: 78vh;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resultHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.resultTitle {
  font-size: 32rpx;
  color: rgba(34, 34, 34, 0.94);
  font-weight: 600;
}

.resultClose {
  padding: 8rpx 14rpx;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
}

.resultCloseText {
  font-size: 24rpx;
  color: rgba(51, 51, 51, 0.84);
}

.resultContent {
  flex: 1;
}

.resultText {
  font-size: 27rpx;
  line-height: 1.8;
  color: rgba(51, 51, 51, 0.86);
  white-space: pre-wrap;
}
</style>

