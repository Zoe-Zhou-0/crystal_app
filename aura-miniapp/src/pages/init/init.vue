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

    <view class="identityCard glass-card">
      <view class="identityHead">
        <view class="identityAvatarWrap">
          <image v-if="currentMe?.avatarUrl" class="identityAvatar" :src="currentMe.avatarUrl" mode="aspectFill" />
          <view v-else class="identityAvatar placeholder">
            <text class="identityAvatarText">{{ avatarInitial }}</text>
          </view>
        </view>
        <view class="identityMeta">
          <text class="identityTitle">{{ currentMe?.displayName || "尚未连接 Aura 身份" }}</text>
          <text class="identitySub">
            {{ currentMe ? `Aura ID ${currentMe.id}` : "登录后可同步能量图谱、晶匣与资料" }}
          </text>
          <text class="identityState">{{ currentMe?.isWechatBound ? "已绑定微信身份" : "当前为匿名体验" }}</text>
        </view>
      </view>
      <view class="identityAction" @click="openLoginModal(false)">
        <text class="identityActionText">{{ currentMe ? "更新登录资料" : "先连接身份（推荐）" }}</text>
      </view>
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
      <text class="privacyText">🔒 数据仅用于专属测算与账号同步，Aura 会温柔守护你的隐私</text>
    </view>

    <view class="submit-wrap">
      <view class="submit-btn" @click="handleSubmit">
        <text class="submit-text">凝结能量图谱</text>
      </view>
    </view>

    <view class="skip-btn" @click="skipToChat">
      <text class="skipText">先不校准，直接开启疗愈</text>
    </view>

    <view v-if="showLoginModal" class="modalMask" @click="closeLoginModal">
      <view class="modalPanel glass-card" @click.stop>
        <text class="modalTitle">先连接你的 Aura 身份</text>
        <text class="modalDesc">登录后可同步能量图谱、晶匣与个人资料；你也可以先匿名体验。</text>

        <view class="modeSwitch">
          <view class="modeItem" :class="{ active: loginMode === 'wechat' }" @click="loginMode = 'wechat'">
            <text class="modeText">使用微信头像与昵称</text>
          </view>
          <view class="modeItem" :class="{ active: loginMode === 'custom' }" @click="loginMode = 'custom'">
            <text class="modeText">我自己设置资料</text>
          </view>
        </view>

        <view class="profileForm">
          <view class="avatarRow">
            <image v-if="previewAvatarUrl" class="formAvatar" :src="previewAvatarUrl" mode="aspectFill" />
            <view v-else class="formAvatar placeholder">
              <text class="identityAvatarText">{{ avatarInitial }}</text>
            </view>

            <button
              v-if="loginMode === 'wechat'"
              class="avatarBtn"
              open-type="chooseAvatar"
              @chooseavatar="onChooseWechatAvatar"
            >
              选择微信头像
            </button>
            <view v-else class="avatarBtn custom" @click="chooseCustomAvatar">上传头像</view>
          </view>

          <input
            v-if="loginMode === 'wechat'"
            class="nameInput"
            type="nickname"
            :value="loginDisplayName"
            placeholder="使用微信昵称或手动微调"
            @input="onNicknameInput"
          />
          <input
            v-else
            class="nameInput"
            :value="loginDisplayName"
            placeholder="请输入想展示给 Aura 的昵称"
            @input="onNicknameInput"
          />
        </view>

        <view class="modalActions">
          <view class="ghostBtn" @click="skipLoginAndContinue">
            <text class="ghostBtnText">暂不登录</text>
          </view>
          <view class="primaryBtn" @click="confirmLogin">
            <text class="primaryBtnText">{{ loginLoading ? "连接中..." : "确认并继续" }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";

onShareAppMessage(() => ({
  title: "Aura · 水晶疗愈与全息能量",
  path: "pages/splash/splash",
}));

onShareTimeline(() => ({
  title: "Aura · 水晶疗愈与全息能量",
}));
import {
  apiUrl,
  getCachedMe,
  getDataApiHeaders,
  setAuthUserId,
  setCachedMe,
  type AuraMeProfile,
} from "@/utils/api";

const STORAGE_HAS_ONBOARDED = "AURA_HAS_ONBOARDED";
const STORAGE_PROFILE = "AURA_USER_PROFILE";
const STORAGE_PENDING_ASK = "AURA_PENDING_ASK";

const birthDate = ref("");
const birthTime = ref("");
const birthRegion = ref<string[]>([]);
const topSafeSpacer = ref(44);

const currentMe = ref<AuraMeProfile | null>(getCachedMe());
const showLoginModal = ref(false);
const continueAfterLogin = ref(false);
const loginLoading = ref(false);
const loginMode = ref<"wechat" | "custom">("wechat");
const loginDisplayName = ref(currentMe.value?.displayName || "");
const localAvatarPath = ref("");
const previewAvatarUrl = ref(currentMe.value?.avatarUrl || "");

const regionText = computed(() => {
  if (!birthRegion.value?.length) return "";
  return birthRegion.value.filter(Boolean).join(" ");
});

const avatarInitial = computed(() => {
  const base = (loginDisplayName.value || currentMe.value?.displayName || "A").trim();
  return base.slice(0, 1).toUpperCase();
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

  uni.request({
    url: apiUrl("/api/me"),
    method: "GET",
    header: getDataApiHeaders(),
    success: (res) => {
      const profile = (res.data as any)?.profile;
      if ((res.statusCode ?? 0) === 200 && profile?.id) {
        currentMe.value = profile as AuraMeProfile;
        setCachedMe(currentMe.value);
        previewAvatarUrl.value = currentMe.value.avatarUrl || previewAvatarUrl.value;
        loginDisplayName.value = currentMe.value.displayName || loginDisplayName.value;
      }
    },
    fail: (err) => {
      console.warn("[init] /api/me fetch failed:", err?.errMsg || err);
    },
  });
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

function onNicknameInput(e: any) {
  loginDisplayName.value = (e?.detail?.value ?? "").toString();
}

function onChooseWechatAvatar(e: any) {
  const avatarUrl = (e?.detail?.avatarUrl ?? "").toString();
  if (!avatarUrl) return;
  localAvatarPath.value = avatarUrl;
  previewAvatarUrl.value = avatarUrl;
}

function chooseCustomAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const path = res?.tempFilePaths?.[0] || "";
      if (!path) return;
      localAvatarPath.value = path;
      previewAvatarUrl.value = path;
    },
  });
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
    success: (res) => {
      if ((res.statusCode ?? 0) !== 200) {
        console.warn("[init] /api/profile sync failed, statusCode:", res.statusCode);
      }
    },
    fail: (err) => {
      console.warn("[init] /api/profile request failed:", err?.errMsg || err);
    },
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

function validateBaseProfile(): boolean {
  if (!birthDate.value.trim() || !birthRegion.value?.length) {
    uni.showToast({ title: "请先锚定降生之日与坐标", icon: "none" });
    return false;
  }
  return true;
}

function openLoginModal(continueNext = true) {
  continueAfterLogin.value = continueNext;
  loginDisplayName.value = currentMe.value?.displayName || loginDisplayName.value;
  previewAvatarUrl.value = currentMe.value?.avatarUrl || previewAvatarUrl.value;
  showLoginModal.value = true;
}

function closeLoginModal() {
  if (loginLoading.value) return;
  showLoginModal.value = false;
}

function uploadAvatar(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!filePath || /^https?:\/\//i.test(filePath)) {
      resolve(filePath);
      return;
    }
    uni.uploadFile({
      url: apiUrl("/api/upload/avatar"),
      filePath,
      name: "file",
      header: getDataApiHeaders(),
      success: (res) => {
        try {
          const data = JSON.parse(res.data || "{}");
          if ((res.statusCode ?? 0) !== 200 || !data?.url) {
            reject(new Error(data?.message || "头像上传失败"));
            return;
          }
          resolve((data?.url ?? "").toString());
        } catch (err) {
          reject(err);
        }
      },
      fail: reject,
    });
  });
}

function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: "weixin",
      success: (res) => {
        const code = (res?.code ?? "").toString();
        if (!code) {
          reject(new Error("missing login code"));
          return;
        }
        resolve(code);
      },
      fail: reject,
    });
  });
}

function getErrorMessage(err: unknown): string {
  const message = (err as any)?.message ?? (err as any)?.errMsg ?? "";
  const text = `${message}`.trim();
  if (!text) return "登录暂时失败，请稍后再试";
  if (text.includes("request:fail")) return "网络请求失败，请检查小程序服务器域名配置";
  if (text.includes("uploadFile:fail")) return "头像上传失败，请稍后重试";
  if (text.includes("missing login code")) return "未拿到微信登录凭证，请重新点击确认";
  if (text.includes("login:fail")) return "微信授权失败，请重新尝试";
  return text;
}

function saveRemoteProfile(profile: { displayName?: string; avatarUrl?: string }): Promise<AuraMeProfile> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: apiUrl("/api/me/profile"),
      method: "POST",
      header: { "content-type": "application/json", ...getDataApiHeaders() },
      data: profile,
      success: (res) => {
        const data = (res.data as any) || {};
        if ((res.statusCode ?? 0) !== 200 || !data?.profile) {
          reject(new Error(data?.message || "资料同步失败"));
          return;
        }
        resolve(data.profile as AuraMeProfile);
      },
      fail: reject,
    });
  });
}

async function confirmLogin() {
  loginLoading.value = true;
  try {
    const displayName = loginDisplayName.value.trim() || "Aura 用户";
    const code = await wxLogin();
    const loginAvatarUrl = /^https?:\/\//i.test(previewAvatarUrl.value) ? previewAvatarUrl.value : "";

    await new Promise<void>((resolve, reject) => {
      uni.request({
        url: apiUrl("/api/auth/wechat-login"),
        method: "POST",
        header: { "content-type": "application/json", ...getDataApiHeaders() },
        data: { code, displayName, avatarUrl: loginAvatarUrl },
        success: (res) => {
          const data = (res.data as any) || {};
          if ((res.statusCode ?? 0) !== 200 || !data?.user_id) {
            reject(new Error(data?.message || "login failed"));
            return;
          }
          setAuthUserId(data.user_id);
          currentMe.value = data.profile as AuraMeProfile;
          setCachedMe(currentMe.value);
          previewAvatarUrl.value = currentMe.value?.avatarUrl || loginAvatarUrl;
          loginDisplayName.value = currentMe.value?.displayName || displayName;
          resolve();
        },
        fail: reject,
      });
    });

    const pendingAvatarPath = localAvatarPath.value || previewAvatarUrl.value;
    const shouldUploadAvatar = !!pendingAvatarPath && !/^https?:\/\//i.test(pendingAvatarPath);
    if (shouldUploadAvatar || displayName !== (currentMe.value?.displayName || "")) {
      const uploadedAvatarUrl = shouldUploadAvatar ? await uploadAvatar(pendingAvatarPath) : currentMe.value?.avatarUrl || "";
      const profile = await saveRemoteProfile({
        displayName,
        avatarUrl: uploadedAvatarUrl || currentMe.value?.avatarUrl || "",
      });
      currentMe.value = profile;
      setCachedMe(profile);
      previewAvatarUrl.value = profile.avatarUrl || previewAvatarUrl.value;
      loginDisplayName.value = profile.displayName || loginDisplayName.value;
      localAvatarPath.value = "";
    }

    showLoginModal.value = false;
    uni.showToast({ title: "已连接微信身份", icon: "success" });
    if (continueAfterLogin.value) saveAndNavigate();
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("[init] confirmLogin failed:", err);
    uni.showModal({
      title: "登录失败",
      content: message,
      showCancel: false,
    });
  } finally {
    loginLoading.value = false;
  }
}

function handleSubmit() {
  if (!validateBaseProfile()) return;
  if (currentMe.value?.isWechatBound) {
    uni.showLoading({ title: "能量凝结中...", mask: true });
    setTimeout(() => {
      uni.hideLoading();
      saveAndNavigate();
    }, 600);
    return;
  }
  openLoginModal(true);
}

function skipLoginAndContinue() {
  showLoginModal.value = false;
  if (!continueAfterLogin.value) return;
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
  background: radial-gradient(circle, rgba(140, 120, 180, 0.4) 0%, rgba(158, 212, 240, 0.2) 50%, transparent 70%);
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
  margin-bottom: 32rpx;
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
  margin-bottom: 32rpx;
  position: relative;
  z-index: 1;
}

.identityCard {
  padding: 28rpx 24rpx;
}

.identityHead {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.identityAvatarWrap {
  flex-shrink: 0;
}

.identityAvatar,
.formAvatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.12);
}

.identityAvatar.placeholder,
.formAvatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.identityAvatarText {
  font-size: 34rpx;
  color: #7f69a3;
  font-weight: 600;
}

.identityMeta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.identityTitle {
  font-size: 30rpx;
  color: #2f2940;
  font-weight: 600;
}

.identitySub,
.identityState {
  font-size: 24rpx;
  color: rgba(61, 53, 80, 0.62);
}

.identityAction {
  margin-top: 22rpx;
  align-self: flex-start;
  padding: 10rpx 18rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.16);
  display: inline-flex;
}

.identityActionText {
  font-size: 24rpx;
  color: #7f69a3;
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

.submit-btn,
.primaryBtn {
  width: 100%;
  padding: 28rpx 32rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, rgba(140, 120, 180, 0.9) 0%, rgba(120, 150, 200, 0.85) 100%);
  border-radius: 24px;
  letter-spacing: 2px;
  box-sizing: border-box;
}

.submit-text,
.primaryBtnText {
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

.modalMask {
  position: fixed;
  inset: 0;
  background: rgba(253, 252, 248, 0.78);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  box-sizing: border-box;
}

.modalPanel {
  width: 100%;
  padding: 32rpx 28rpx;
}

.modalTitle {
  font-size: 34rpx;
  color: #2f2940;
  font-weight: 700;
}

.modalDesc {
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.65;
  color: rgba(61, 53, 80, 0.62);
}

.modeSwitch {
  margin-top: 28rpx;
  display: flex;
  gap: 16rpx;
}

.modeItem {
  flex: 1;
  padding: 18rpx;
  border-radius: 18rpx;
  background: rgba(182, 147, 214, 0.08);
  border: 1px solid transparent;
}

.modeItem.active {
  border-color: rgba(182, 147, 214, 0.4);
  background: rgba(182, 147, 214, 0.16);
}

.modeText {
  font-size: 24rpx;
  color: #5c4f77;
  text-align: center;
  display: block;
}

.profileForm {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.avatarRow {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.avatarBtn {
  margin: 0;
  padding: 0 22rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.16);
  color: #7f69a3;
  font-size: 24rpx;
}

.avatarBtn.custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nameInput {
  height: 84rpx;
  padding: 0 24rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.72);
  font-size: 27rpx;
  color: #2f2940;
}

.modalActions {
  margin-top: 28rpx;
  display: flex;
  gap: 16rpx;
}

.ghostBtn,
.primaryBtn {
  flex: 1;
}

.ghostBtn {
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ghostBtnText {
  font-size: 28rpx;
  color: rgba(61, 53, 80, 0.7);
}
</style>
