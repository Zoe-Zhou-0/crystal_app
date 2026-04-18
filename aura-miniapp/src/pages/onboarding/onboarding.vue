<template>
  <view class="page">
    <view class="topSafeSpacer" :style="{ height: `${topSafeSpacer}px` }" />

    <view class="hero glass-panel">
      <text class="title">在开始之前</text>
      <text class="subtitle">
        先做一次五行测算，Aura 才能更懂你。你也可以先跳过，随时在聊愈里补做。
      </text>
    </view>

    <view class="form glass-panel">
      <view class="row">
        <text class="label">出生日期</text>
        <picker mode="date" :value="birthDate || ''" @change="onDate">
          <view class="value">
            <text class="valueText" :class="{ placeholder: !birthDate }">
              {{ birthDate || "请选择" }}
            </text>
          </view>
        </picker>
      </view>

      <view class="divider" />

      <view class="row">
        <text class="label">出生时间（可选）</text>
        <view class="right">
          <view class="miniToggle" @click="toggleTimeEnabled">
            <view class="dot" :class="{ on: timeEnabled }" />
            <text class="miniText">{{ timeEnabled ? "填写" : "不确定" }}</text>
          </view>
        </view>
      </view>

      <view v-if="timeEnabled" class="rowSub">
        <picker mode="time" :value="birthTime || ''" @change="onTime">
          <view class="value">
            <text class="valueText" :class="{ placeholder: !birthTime }">
              {{ birthTime || "请选择" }}
            </text>
          </view>
        </picker>
      </view>

      <view class="divider" />

      <view class="row">
        <text class="label">出生地（省/市/区）</text>
        <picker mode="region" :value="region" @change="onRegion">
          <view class="value">
            <text class="valueText" :class="{ placeholder: !regionText }">
              {{ regionText || "请选择" }}
            </text>
          </view>
        </picker>
      </view>
    </view>

    <view class="actions">
      <view class="primary glass-panel" @click="start">
        <text class="primaryText">开始测算</text>
      </view>
      <view class="ghost" @click="skip">
        <text class="ghostText">先跳过，进入聊愈</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { apiUrl, getDataApiHeaders } from "@/utils/api";

type Region = {
  province: string;
  city: string;
  district: string;
};

type UserProfile = {
  birthDate: string;
  birthTime?: string;
  region: Region;
  createdAt: number;
};

const STORAGE_HAS_ONBOARDED = "AURA_HAS_ONBOARDED";
const STORAGE_PROFILE = "AURA_USER_PROFILE";
const STORAGE_PENDING_ASK = "AURA_PENDING_ASK";

const birthDate = ref("");
const timeEnabled = ref(true);
const birthTime = ref("");
const region = ref<string[]>([]);
const topSafeSpacer = ref(44);

const regionText = computed(() => {
  if (!region.value?.length) return "";
  const [p, c, d] = region.value;
  return [p, c, d].filter(Boolean).join(" ");
});

onLoad(() => {
  const sys = uni.getSystemInfoSync();
  const menuRect = uni.getMenuButtonBoundingClientRect?.();
  if (menuRect && sys?.statusBarHeight) {
    // custom 导航下给胶囊 + 状态栏预留空间，避免顶部内容被压住
    topSafeSpacer.value = Math.max(menuRect.bottom - sys.statusBarHeight + 56, 92);
  }

  const existing = uni.getStorageSync(STORAGE_PROFILE);
  if (!existing) return;

  const birthDateValue = (existing?.birthDate ?? "").toString();
  const birthTimeValue = (existing?.birthTime ?? "").toString();
  const province = (existing?.region?.province ?? "").toString();
  const city = (existing?.region?.city ?? "").toString();
  const district = (existing?.region?.district ?? "").toString();

  if (birthDateValue) birthDate.value = birthDateValue;
  if (birthTimeValue) {
    timeEnabled.value = true;
    birthTime.value = birthTimeValue;
  } else {
    timeEnabled.value = false;
    birthTime.value = "";
  }

  const r = [province, city, district].filter(Boolean);
  if (r.length) region.value = r;
});

function onDate(e: any) {
  birthDate.value = (e?.detail?.value ?? "").toString();
}

function onTime(e: any) {
  birthTime.value = (e?.detail?.value ?? "").toString();
}

function toggleTimeEnabled() {
  timeEnabled.value = !timeEnabled.value;
  if (!timeEnabled.value) birthTime.value = "";
}

function onRegion(e: any) {
  const v = e?.detail?.value;
  if (Array.isArray(v)) region.value = v.map((x) => x?.toString?.() ?? String(x));
}

function start() {
  if (!birthDate.value) {
    uni.showToast({ title: "请先选择出生日期", icon: "none" });
    return;
  }
  if (!region.value?.length) {
    uni.showToast({ title: "请先选择出生地", icon: "none" });
    return;
  }

  const [province = "", city = "", district = ""] = region.value;
  const profile: UserProfile = {
    birthDate: birthDate.value,
    birthTime: timeEnabled.value && birthTime.value ? birthTime.value : undefined,
    region: { province, city, district },
    createdAt: Date.now(),
  };

  uni.setStorageSync(STORAGE_PROFILE, profile);
  uni.setStorageSync(STORAGE_HAS_ONBOARDED, "1");

  uni.request({
    url: apiUrl("/api/profile"),
    method: "POST",
    header: { "content-type": "application/json", ...getDataApiHeaders() },
    data: { profile },
    success: (res) => {
      if ((res.statusCode ?? 0) !== 200) {
        console.warn("[onboarding] /api/profile sync failed, statusCode:", res.statusCode);
      }
    },
    fail: (err) => {
      console.warn("[onboarding] /api/profile request failed:", err?.errMsg || err);
    },
  });

  const timeText = profile.birthTime ? profile.birthTime : "不确定（请按常见时辰推断，并提醒我后续可补充）";
  const locationText = `${province}${city}${district}`;
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

function skip() {
  uni.setStorageSync(STORAGE_HAS_ONBOARDED, "1");
  uni.switchTab({ url: "/pages/index/index" });
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx calc(env(safe-area-inset-bottom) + 24rpx) 24rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.topSafeSpacer {
  width: 100%;
  flex-shrink: 0;
}

.hero {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.title {
  font-size: 36rpx;
  color: #222222;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(51, 51, 51, 0.75);
  line-height: 1.6;
}

.form {
  padding: 6rpx 18rpx;
  display: flex;
  flex-direction: column;
}

.row {
  padding: 18rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.rowSub {
  padding: 0 0 18rpx 0;
  display: flex;
  justify-content: flex-end;
}

.label {
  font-size: 28rpx;
  color: rgba(34, 34, 34, 0.92);
}

.value {
  padding: 10rpx 14rpx;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.valueText {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.92);
}

.valueText.placeholder {
  color: rgba(51, 51, 51, 0.55);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.55);
}

.right {
  display: flex;
  align-items: center;
}

.miniToggle {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 12rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.16);
}

.dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 999px;
  background: rgba(51, 51, 51, 0.25);
}

.dot.on {
  background: rgba(182, 147, 214, 0.95);
}

.miniText {
  font-size: 24rpx;
  color: rgba(51, 51, 51, 0.85);
}

.actions {
  margin-top: auto;
  padding: 12rpx 0 20rpx 0;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.primary {
  padding: 20rpx 18rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.primaryText {
  font-size: 30rpx;
  color: #2c2c2c;
}

.ghost {
  padding: 10rpx 18rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ghostText {
  font-size: 26rpx;
  color: rgba(51, 51, 51, 0.7);
}
</style>

