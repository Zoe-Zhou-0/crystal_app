<template>
  <view class="page">
    <view class="profileCard glass-panel">
      <view class="profileHead">
        <image v-if="me?.avatarUrl" class="avatar" :src="me.avatarUrl" mode="aspectFill" />
        <view v-else class="avatar placeholder">
          <text class="avatarText">{{ avatarInitial }}</text>
        </view>

        <view class="profileMeta">
          <text class="profileName">{{ me?.displayName || "未命名旅人" }}</text>
          <text class="profileId">Aura ID {{ me?.id || "--" }}</text>
          <text class="profileState">{{ me?.isWechatBound ? "已绑定微信身份" : "当前为匿名体验，可前往校准页绑定" }}</text>
        </view>
      </view>

      <view class="profileActions">
        <view class="pillBtn" @click="openEditModal">
          <text class="pillBtnText">编辑资料</text>
        </view>
        <view class="pillBtn ghost" @click="goToInitForm">
          <text class="pillBtnText ghostText">{{ me?.isWechatBound ? "更新校准信息" : "前往绑定微信" }}</text>
        </view>
      </view>
    </view>

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

    <view v-if="showEditModal" class="resultMask" @click="closeEditModal">
      <view class="editPanel glass-panel" @click.stop>
        <view class="resultHead">
          <text class="resultTitle">编辑个人资料</text>
          <view class="resultClose" @click="closeEditModal">
            <text class="resultCloseText">关闭</text>
          </view>
        </view>

        <view class="editBody">
          <view class="avatarRow">
            <image v-if="editAvatarPreview" class="avatar large" :src="editAvatarPreview" mode="aspectFill" />
            <view v-else class="avatar large placeholder">
              <text class="avatarText">{{ avatarInitial }}</text>
            </view>

            <view class="avatarBtnGroup">
              <button class="miniBtn" open-type="chooseAvatar" @chooseavatar="onChooseWechatAvatar">
                使用微信头像
              </button>
              <view class="miniBtn customBtn" @click="chooseCustomAvatar">上传自定义头像</view>
            </view>
          </view>

          <input class="nameInput" :value="editDisplayName" placeholder="请输入你的昵称" @input="onEditNameInput" />

          <view class="saveBtn" @click="saveProfileChanges">
            <text class="saveBtnText">{{ profileSaving ? "保存中..." : "保存资料" }}</text>
          </view>
        </view>
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
import { onShow, onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";

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
  setCachedMe,
  type AuraMeProfile,
} from "@/utils/api";
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
const me = ref<AuraMeProfile | null>(getCachedMe());
const showResultModal = ref(false);
const showEditModal = ref(false);
const profileSaving = ref(false);
const editDisplayName = ref(me.value?.displayName || "");
const editAvatarPreview = ref(me.value?.avatarUrl || "");
const localAvatarPath = ref("");

const avatarInitial = computed(() => {
  const base = (editDisplayName.value || me.value?.displayName || "A").trim();
  return base.slice(0, 1).toUpperCase();
});

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

function loadMe() {
  uni.request({
    url: apiUrl("/api/me"),
    method: "GET",
    header: getDataApiHeaders(),
    success: (res) => {
      const profile = (res.data as any)?.profile;
      if ((res.statusCode ?? 0) === 200 && profile?.id) {
        me.value = profile as AuraMeProfile;
        setCachedMe(me.value);
        editDisplayName.value = me.value?.displayName || "";
        editAvatarPreview.value = me.value?.avatarUrl || "";
      }
    },
    fail: (err) => {
      console.warn("[mine] /api/me fetch failed:", err?.errMsg || err);
    },
  });
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

function openResultModal() {
  if (!userEnergyData.value) return;
  showResultModal.value = true;
}

function closeResultModal() {
  showResultModal.value = false;
}

function openEditModal() {
  editDisplayName.value = me.value?.displayName || "";
  editAvatarPreview.value = me.value?.avatarUrl || "";
  localAvatarPath.value = "";
  showEditModal.value = true;
}

function closeEditModal() {
  if (profileSaving.value) return;
  showEditModal.value = false;
}

function onEditNameInput(e: any) {
  editDisplayName.value = (e?.detail?.value ?? "").toString();
}

function onChooseWechatAvatar(e: any) {
  const path = (e?.detail?.avatarUrl ?? "").toString();
  if (!path) return;
  localAvatarPath.value = path;
  editAvatarPreview.value = path;
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
      editAvatarPreview.value = path;
    },
  });
}

async function saveProfileChanges() {
  profileSaving.value = true;
  try {
    const avatarUrl = await uploadAvatar(localAvatarPath.value || editAvatarPreview.value);
    await new Promise<void>((resolve, reject) => {
      uni.request({
        url: apiUrl("/api/me/profile"),
        method: "POST",
        header: { "content-type": "application/json", ...getDataApiHeaders() },
        data: {
          displayName: editDisplayName.value.trim() || "Aura 用户",
          avatarUrl,
        },
        success: (res) => {
          const profile = (res.data as any)?.profile;
          if ((res.statusCode ?? 0) !== 200 || !profile?.id) {
            reject(new Error("save failed"));
            return;
          }
          me.value = profile as AuraMeProfile;
          setCachedMe(me.value);
          resolve();
        },
        fail: reject,
      });
    });
    showEditModal.value = false;
    uni.showToast({ title: "资料已更新", icon: "success" });
  } catch {
    uni.showToast({ title: "保存失败，请稍后再试", icon: "none" });
  } finally {
    profileSaving.value = false;
  }
}

function goToInitForm() {
  uni.navigateTo({
    url: "/pages/init/init",
    fail: () => {
      uni.navigateTo({ url: "/pages/onboarding/onboarding" });
    },
  });
}

onShow(() => {
  uni.hideTabBar({ animation: false });
  loadMe();
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

.profileCard,
.energyPanel,
.energyGuide,
.section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profileHead {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.14);
  flex-shrink: 0;
}

.avatar.large {
  width: 76px;
  height: 76px;
}

.avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatarText {
  font-size: 24px;
  color: rgba(103, 74, 151, 0.95);
  font-weight: 600;
}

.profileMeta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profileName {
  font-size: 18px;
  font-weight: 600;
  color: rgba(34, 34, 34, 0.94);
}

.profileId,
.profileState {
  font-size: 25rpx;
  color: rgba(51, 51, 51, 0.7);
}

.profileActions {
  margin-top: 2px;
  display: flex;
  gap: 10px;
}

.pillBtn {
  padding: 10rpx 18rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.2);
  align-self: flex-start;
}

.pillBtn.ghost {
  background: rgba(0, 0, 0, 0.06);
}

.pillBtnText {
  font-size: 25rpx;
  color: rgba(58, 58, 58, 0.9);
}

.ghostText {
  color: rgba(58, 58, 58, 0.78);
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

.guideTitle {
  font-size: 30rpx;
  color: rgba(34, 34, 34, 0.92);
  font-weight: 600;
}

.guideHint,
.hint {
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

.sectionTitle {
  font-size: 30rpx;
  color: #2c2c2c;
}

.row {
  display: flex;
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

.resultPanel,
.editPanel {
  width: 100%;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resultPanel {
  height: 78vh;
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

.editBody {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatarRow {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatarBtnGroup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.miniBtn {
  margin: 0;
  padding: 0 18rpx;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.16);
  color: #7f69a3;
  font-size: 24rpx;
}

.customBtn {
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

.saveBtn {
  margin-top: 2px;
  padding: 26rpx 24rpx;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(140, 120, 180, 0.9) 0%, rgba(120, 150, 200, 0.85) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.saveBtnText {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}
</style>

