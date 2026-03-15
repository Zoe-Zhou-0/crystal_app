<template>
  <view class="page">
    <view class="aura-bg" aria-hidden="true" />
    <view class="topSafeSpacer" :style="{ height: topSafeSpacer + 'px' }" />

    <view class="hero">
      <text class="heroTitle">校准专属能量场</text>
      <text class="heroSubtitle">
        星象与五行在起点留下了独特印记。请提供基础坐标，Aura 将为你凝结专属能量图谱。
      </text>
    </view>

    <view class="glass-card">
      <view class="row">
        <text class="label">降生之日</text>
        <picker mode="date" :value="birthDate || ''" @change="onDate">
          <view class="value">
            <text class="valueText" :class="{ placeholder: !birthDate }">
              {{ birthDate || "去锚定 >" }}
            </text>
          </view>
        </picker>
      </view>
      <view class="divider" />
      <view class="row">
        <text class="label">具体时辰 (可选)</text>
        <picker mode="time" :value="birthTime || ''" @change="onTime">
          <view class="value">
            <text class="valueText" :class="{ placeholder: !birthTime }">
              {{ birthTime || "去锚定 >" }}
            </text>
          </view>
        </picker>
      </view>
      <view class="divider" />
      <view class="row">
        <text class="label">降生坐标</text>
        <picker mode="region" :value="birthRegion" @change="onRegion">
          <view class="value">
            <text class="valueText" :class="{ placeholder: !regionText }">
              {{ regionText || "去锚定 >" }}
            </text>
          </view>
        </picker>
      </view>
    </view>

    <view class="privacy">
      <text class="privacyText">🔒 数据仅用于本地测算，Aura 绝对守护你的隐私</text>
    </view>

    <view class="submit-wrap">
      <view class="submit-btn" @click="handleSubmit">
        <text class="submit-text">凝结能量图谱</text>
      </view>
    </view>

    <view class="skip-btn" @click="skipToChat">
      <text class="skipText">先不校准，直接开启疗愈</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { apiUrl, getDataApiHeaders } from "@/utils/api";

const STORAGE_HAS_ONBOARDED = "AURA_HAS_ONBOARDED";
const STORAGE_PROFILE = "AURA_USER_PROFILE";
const STORAGE_PENDING_ASK = "AURA_PENDING_ASK";

const birthDate = ref("");
const birthTime = ref("");
const birthRegion = ref<string[]>([]);
const topSafeSpacer = ref(44);

const regionText = computed(() => {
  if (!birthRegion.value?.length) return "";
  return birthRegion.value.filter(Boolean).join(" ");
});

onLoad(() => {
  const sys = uni.getSystemInfoSync();
  const menuRect = uni.getMenuButtonBoundingClientRect?.();
  if (menuRect && sys?.statusBarHeight) {
    topSafeSpacer.value = Math.max(menuRect.bottom - sys.statusBarHeight + 56, 92);
  }

  const existing = uni.getStorageSync(STORAGE_PROFILE);
  if (existing) {
    birthDate.value = (existing?.birthDate ?? "").toString();
    birthTime.value = (existing?.birthTime ?? "").toString();
    const r = existing?.region;
    if (r) {
      birthRegion.value = [r.province, r.city, r.district].filter(Boolean);
    }
  }
});

function onDate(e: any) {
  birthDate.value = (e?.detail?.value ?? "").toString();
}

function onTime(e: any) {
  birthTime.value = (e?.detail?.value ?? "").toString();
}

function onRegion(e: any) {
  const v = e?.detail?.value;
  if (Array.isArray(v)) birthRegion.value = v.map((x) => (x ?? "").toString());
}

function buildProfile() {
  const [province = "", city = "", district = ""] = birthRegion.value;
  return {
    birthDate: birthDate.value,
    birthTime: birthTime.value || undefined,
    region: { province, city, district },
    createdAt: Date.now(),
  };
}

function saveAndNavigate() {
  const profile = buildProfile();
  uni.setStorageSync(STORAGE_PROFILE, profile);
  uni.setStorageSync(STORAGE_HAS_ONBOARDED, "1");

  uni.request({
    url: apiUrl("/api/profile"),
    method: "POST",
    header: { "content-type": "application/json", ...getDataApiHeaders() },
    data: { profile },
  });

  const timeText = profile.birthTime || "不确定（请按常见时辰推断，并提醒我后续可补充）";
  const locationText = [profile.region.province, profile.region.city, profile.region.district].filter(Boolean).join("");
  const ask =
    `[五行排盘]\n` +
    `请帮我做五行能量评估。\n` +
    `- 出生日期：${profile.birthDate}\n` +
    `- 出生时间：${timeText}\n` +
    `- 出生地：${locationText}\n\n` +
    `请给我一段温柔、简洁、可执行的建议。`;

  uni.setStorageSync(STORAGE_PENDING_ASK, ask);
  uni.switchTab({ url: "/pages/index/index" });
}

function handleSubmit() {
  if (!birthDate.value.trim()) {
    uni.showToast({ title: "请先锚定降生之日与坐标", icon: "none" });
    return;
  }
  if (!birthRegion.value?.length) {
    uni.showToast({ title: "请先锚定降生之日与坐标", icon: "none" });
    return;
  }

  uni.showLoading({ title: "能量凝结中...", mask: true });
  setTimeout(() => {
    uni.hideLoading();
    saveAndNavigate();
  }, 600);
}

function skipToChat() {
  uni.setStorageSync(STORAGE_HAS_ONBOARDED, "1");
  uni.switchTab({ url: "/pages/index/index" });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #fafafc;
  box-sizing: border-box;
  padding: 24rpx 32rpx calc(env(safe-area-inset-bottom) + 140rpx) 32rpx;
  position: relative;
  overflow: hidden;
}

.aura-bg {
  position: fixed;
  left: 50%;
  top: 20%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(140, 120, 180, 0.4) 0%,
    rgba(158, 212, 240, 0.2) 50%,
    transparent 70%
  );
  filter: blur(60px);
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.topSafeSpacer {
  width: 100%;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.hero {
  margin-bottom: 48rpx;
  position: relative;
  z-index: 1;
}

.heroTitle {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #3d3550;
  letter-spacing: 4px;
  margin-bottom: 20rpx;
}

.heroSubtitle {
  display: block;
  font-size: 26rpx;
  line-height: 1.6;
  color: rgba(61, 53, 80, 0.65);
}

.glass-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
  padding: 0 24rpx;
  margin-bottom: 48rpx;
  position: relative;
  z-index: 1;
}

.row {
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.label {
  font-size: 28rpx;
  color: rgba(61, 53, 80, 0.85);
  flex-shrink: 0;
}

.value {
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(182, 147, 214, 0.06);
  min-width: 0;
  flex: 1;
  text-align: right;
}

.valueText {
  font-size: 28rpx;
  color: #3d3550;
}

.valueText.placeholder {
  color: rgba(150, 130, 180, 0.6);
}

.divider {
  height: 1px;
  background: rgba(182, 147, 214, 0.12);
  margin: 0 -24rpx;
}

.privacy {
  margin-bottom: 32rpx;
  position: relative;
  z-index: 1;
}

.privacyText {
  font-size: 22rpx;
  color: rgba(61, 53, 80, 0.5);
}

.submit-wrap {
  display: flex;
  justify-content: center;
  padding: 0 40rpx;
}

.submit-btn {
  width: 100%;
  max-width: 100%;
  padding: 28rpx 32rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, rgba(140, 120, 180, 0.9) 0%, rgba(120, 150, 200, 0.85) 100%);
  border-radius: 24px;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.submit-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.skip-btn {
  margin-top: 32rpx;
  padding: 20rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

.skipText {
  font-size: 26rpx;
  color: rgba(61, 53, 80, 0.55);
}

</style>
