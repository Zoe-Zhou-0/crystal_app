<template>
  <view class="page">
    <view
      class="custom-nav"
      :style="{ paddingTop: statusBarHeight + 'px' }"
    >
      <text class="navTitle">Aura ✨</text>
    </view>

    <view
      v-if="showDailyCard && dailyCard"
      class="dailyCardMask"
      :class="{ closing: dailyCardClosing }"
      @click="dismissDailyCard"
    >
      <view class="dailyCardStage" :class="{ closing: dailyCardClosing }">
        <image
          class="dailyCardImage"
          :src="dailyCard.image"
          mode="aspectFit"
          @load="onDailyCardLoad"
          @error="onDailyCardError"
        />
      </view>

      <view class="dailyCardSave glass-panel" @click.stop="saveDailyCard">
        <text class="dailyCardSaveText">{{ savingDailyCard ? "保存中…" : "保存到相册" }}</text>
      </view>
    </view>

    <view class="aura-anchor" aria-hidden="true">
      <view class="aura-anchorFloat">
        <view class="aura-orb">
          <view class="aura-orbGlow" />
          <view class="aura-orbCore" />
        </view>
      </view>
    </view>

    <scroll-view
      class="chat"
      scroll-y
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
    >
      <view class="chatInner">
        <view
          v-for="m in messages"
          :key="m.id"
          :id="m.id"
          class="msg"
          :class="{ isAI: m.role === 'ai', isUser: m.role === 'user' }"
        >
          <view v-if="m.role === 'ai'" class="aiText">
            <view v-if="m.loading" class="typingDream" aria-label="Aura 思考中">
              <view class="typingDot" />
              <view class="typingDot" />
              <view class="typingDot" />
            </view>
            <text v-else class="aiTextInner">{{ m.id === 'm1' ? auraGreeting : m.text }}</text>
          </view>

          <view v-else class="bubble userBubble">
            <text class="bubbleText userBubbleText">{{ m.text }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="floating-palette">
      <view class="palette-item" @click="onQuick('能量图谱')">
        <view class="palette-icon icon-wuxing" aria-hidden="true" />
        <text class="palette-text">能量图谱</text>
      </view>
      <view class="palette-item" @click="navigateTo('fortune')">
        <view class="mystic-card-icon" aria-hidden="true">
          <view class="mystic-card-diamond" />
        </view>
        <text class="palette-text">今日探索</text>
      </view>
      <view class="palette-item" @click="navigateTo('fengshui')">
        <view class="palette-icon icon-fengshui" aria-hidden="true" />
        <text class="palette-text">空间布局（隐）</text>
      </view>
    </view>

    <view class="composer">
      <view class="composerInner glass-panel">
        <input
          class="input"
          v-model="draft"
          placeholder="把你此刻的感受告诉 Aura…"
          confirm-type="send"
          @confirm="send()"
        />
        <view class="sendBtn" :class="{ disabled: isReplying }" @click="send()">
          <text class="sendText">{{ isReplying ? "思考中…" : "发送" }}</text>
        </view>
      </view>
    </view>

    <AuraTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import mindfulnessCards from "@/data/mindfulnessCards.json";
import { apiUrl, getDataApiHeaders } from "@/utils/api";
import AuraTabBar from "@/components/AuraTabBar.vue";

type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  loading?: boolean;
};

const GREETING_MORNING = [
  "晨光初现。不用刻意整理思绪，此时此刻脑海里跳出的第一个念头是什么？说给 Aura 听听。",
];
const GREETING_DAY = [
  "光影流转，外面的世界或许有些喧嚣。来这里换口呼吸吧，现在的你，感觉节奏快还是慢？",
];
const GREETING_NIGHT = [
  "夜色沉降。把一天的疲惫都留在门外吧。哪怕只是发泄一句情绪、一声叹息，Aura 都能稳稳接住。",
];
const GREETING_LATE_NIGHT = [
  "万物归藏的时刻。如果思绪还在漂浮，不如挑一件今天最让你在意的小事，我们从那里开始聊。",
];

function getAuraGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return GREETING_MORNING[Math.floor(Math.random() * GREETING_MORNING.length)];
  if (hour >= 9 && hour < 18) return GREETING_DAY[Math.floor(Math.random() * GREETING_DAY.length)];
  if (hour >= 18 && hour < 23) return GREETING_NIGHT[Math.floor(Math.random() * GREETING_NIGHT.length)];
  return GREETING_LATE_NIGHT[Math.floor(Math.random() * GREETING_LATE_NIGHT.length)];
}

const auraGreeting = ref(getAuraGreeting());
const tarotSystemContext = ref("");

const messages = ref<Message[]>([
  {
    id: "m1",
    role: "ai",
    text: "",
  },
]);

const draft = ref("");
const scrollIntoView = ref("m1");
const isReplying = ref(false);
const statusBarHeight = ref(20);

onLoad(() => {
  const sys = uni.getSystemInfoSync();
  const menuRect = uni.getMenuButtonBoundingClientRect?.();
  if (menuRect && sys?.statusBarHeight) {
    statusBarHeight.value = Math.max(menuRect.bottom - sys.statusBarHeight + 56, 92);
  } else {
    statusBarHeight.value = (sys?.statusBarHeight ?? 20) + 56;
  }
});

type MindfulnessCard = {
  id: string;
  image: string;
};

const cards = mindfulnessCards as MindfulnessCard[];
const showDailyCard = ref(false);
const dailyCard = ref<MindfulnessCard | null>(null);
const dailyCardClosing = ref(false);
const savingDailyCard = ref(false);
const deferredPendingAsk = ref<string>("");
const dailyCardLoaded = ref(false);
const dailyCardTried = ref(0);

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function djb2Hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function pickDailyCard(dateStr: string): MindfulnessCard | null {
  if (!cards?.length) return null;
  const idx = djb2Hash(dateStr) % cards.length;
  return cards[idx] ?? null;
}

function maybeShowDailyCard() {
  const date = todayKey();
  const shown = (uni.getStorageSync("AURA_DAILY_CARD_SHOWN_DATE") || "").toString();
  if (shown === date) return;

  const card = pickDailyCard(date);
  if (!card) return;

  dailyCard.value = card;
  dailyCardLoaded.value = false;
  dailyCardTried.value = 0;
  dailyCardClosing.value = false;
  showDailyCard.value = true;
}

function onDailyCardLoad() {
  dailyCardLoaded.value = true;
}

function onDailyCardError() {
  // 兜底：如果抽到的图片缺失，自动尝试下一张
  if (!cards?.length) return;
  dailyCardTried.value += 1;
  if (dailyCardTried.value >= cards.length) {
    uni.showToast({ title: "卡片资源缺失，请检查图片文件名", icon: "none" });
    return;
  }

  const curId = dailyCard.value?.id;
  const curIdx = curId ? cards.findIndex((c) => c.id === curId) : -1;
  const nextIdx = (Math.max(curIdx, 0) + 1) % cards.length;
  dailyCard.value = cards[nextIdx] ?? cards[0] ?? null;
}

function dismissDailyCard() {
  if (!showDailyCard.value) return;
  const date = todayKey();
  uni.setStorageSync("AURA_DAILY_CARD_SHOWN_DATE", date);

  dailyCardClosing.value = true;
  setTimeout(() => {
    showDailyCard.value = false;
    dailyCardClosing.value = false;
    dailyCard.value = null;

    const pending = deferredPendingAsk.value.trim();
    deferredPendingAsk.value = "";
    if (pending) send(pending);
  }, 240);
}

function uniAuthorize(scope: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.authorize({
      scope,
      success: () => resolve(),
      fail: (err) => reject(err),
    });
  });
}

function uniGetImageInfo(src: string): Promise<UniApp.GetImageInfoSuccessData> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

function uniDownloadFile(url: string): Promise<UniApp.DownloadSuccessData> {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

function uniSaveToAlbum(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: (err) => reject(err),
    });
  });
}

async function ensureAlbumPermission(): Promise<boolean> {
  try {
    await uniAuthorize("scope.writePhotosAlbum");
    return true;
  } catch (_e) {
    const ok = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: "需要相册权限",
        content: "保存图片到相册需要授权。你可以在设置中开启“保存到相册”权限。",
        confirmText: "去设置",
        cancelText: "取消",
        success: (r) => resolve(!!r.confirm),
        fail: () => resolve(false),
      });
    });
    if (!ok) return false;
    await new Promise<void>((resolve) => {
      uni.openSetting({ success: () => resolve(), fail: () => resolve() });
    });
    return true;
  }
}

async function resolveSavablePath(src: string): Promise<string> {
  if (/^https?:\/\//i.test(src)) {
    const dl = await uniDownloadFile(src);
    const path = (dl as any)?.tempFilePath || "";
    if (!path) throw new Error("download_failed");
    return path;
  }

  // /static/... 或本地路径：尝试转成可保存的本地路径
  const info = await uniGetImageInfo(src);
  const path = (info as any)?.path || "";
  if (!path) throw new Error("image_info_failed");
  return path;
}

async function saveDailyCard() {
  if (!dailyCard.value || savingDailyCard.value) return;
  savingDailyCard.value = true;
  try {
    const ok = await ensureAlbumPermission();
    if (!ok) return;

    const filePath = await resolveSavablePath(dailyCard.value.image);
    await uniSaveToAlbum(filePath);
    uni.showToast({ title: "已保存到相册", icon: "success" });
  } catch (_e) {
    uni.showToast({ title: "保存失败，请稍后再试", icon: "none" });
  } finally {
    savingDailyCard.value = false;
  }
}

function syncBaziToCloud(result: { dominant: string; scores: Record<string, number>; detailText?: string }) {
  uni.request({
    url: apiUrl("/api/bazi"),
    method: "POST",
    header: { "content-type": "application/json", ...getDataApiHeaders() },
    data: { result },
    success: (res) => {
      if ((res.statusCode ?? 0) === 200) console.log("[aura-chat] bazi synced to cloud");
    },
    fail: () => {},
  });
}

function bumpScroll() {
  const last = messages.value[messages.value.length - 1];
  if (!last) return;
  scrollIntoView.value = last.id;
}

function tryExtractBaziResult(replyText: string): { cleanText: string; saved: boolean } {
  const tagged = replyText.match(/<BAZI_DATA>([\s\S]*?)<\/BAZI_DATA>/);
  const fenced = replyText.match(/```json\s*([\s\S]*?)```/i);
  const plain = replyText.match(/\{[\s\S]*?"scores"[\s]*:[\s]*\{[\s\S]*?\}[\s\S]*?\}/);
  const candidate = (tagged?.[1] || fenced?.[1] || plain?.[0] || "").trim();
  if (!candidate) return { cleanText: replyText.trim(), saved: false };

  try {
    const parsed: any = JSON.parse(candidate);
    const scores = parsed?.scores || {};
    const dominantRaw = (parsed?.dominant || parsed?.dominant_energy || "").toString();
    const dominant = (dominantRaw.match(/[金木水火土]/)?.[0] || dominantRaw || "").trim();
    if (!dominant) return { cleanText: replyText.trim(), saved: false };

    const result = {
      dominant,
      scores: {
        metal: Math.min(100, Math.max(0, Number(scores.metal) || 0)),
        wood: Math.min(100, Math.max(0, Number(scores.wood) || 0)),
        water: Math.min(100, Math.max(0, Number(scores.water) || 0)),
        fire: Math.min(100, Math.max(0, Number(scores.fire) || 0)),
        earth: Math.min(100, Math.max(0, Number(scores.earth) || 0)),
      },
      detailText:
        parsed.detailText ||
        [parsed.imbalance_analysis, parsed.conflict_reading, parsed.healing_action].filter(Boolean).join("\n"),
    };
    uni.setStorageSync("baziResult", result);
    console.log("[aura-chat] baziResult saved:", JSON.stringify(result).slice(0, 120));
    syncBaziToCloud(result);

    let cleanText = replyText
      .replace(/<BAZI_DATA>[\s\S]*?<\/BAZI_DATA>/g, "")
      .replace(/```json[\s\S]*?```/gi, "")
      .trim();
    if (!cleanText) cleanText = "你的能量图谱我已经整理好了，我们可以继续细聊你最在意的部分。";
    return { cleanText, saved: true };
  } catch (e) {
    console.warn("[aura-chat] bazi JSON parse failed:", e);
    return { cleanText: replyText.trim(), saved: false };
  }
}

function send(text?: string) {
  if (isReplying.value) return;
  const content = (text ?? draft.value).trim();
  if (!content) return;

  draft.value = "";
  const userMsg: Message = { id: `m_${Date.now()}_u`, role: "user", text: content };
  messages.value.push(userMsg);
  const loadingId = `m_${Date.now()}_a_loading`;
  messages.value.push({ id: loadingId, role: "ai", text: "", loading: true });
  isReplying.value = true;
  nextTick(() => bumpScroll());

  function placeReply(replyText: string) {
    const idx = messages.value.findIndex((m) => m.id === loadingId);
    const newMsg: Message = { id: `m_${Date.now()}_a`, role: "ai", text: replyText };
    if (idx >= 0) {
      messages.value[idx] = newMsg;
    } else {
      messages.value.push(newMsg);
    }
    isReplying.value = false;
    nextTick(() => bumpScroll());
  }

  const reqUrl = apiUrl("/api/chat");
  console.log("[aura-chat] >>> sending to:", reqUrl, "message:", content.slice(0, 50));

  uni.request({
    url: reqUrl,
    method: "POST",
    header: { "content-type": "application/json" },
    data: {
      message: content,
      ...(tarotSystemContext.value ? { systemContext: tarotSystemContext.value } : {}),
    },
    timeout: 120000,
    success: (res) => {
      console.log("[aura-chat] <<< success statusCode:", res.statusCode, "data:", JSON.stringify(res.data).slice(0, 200));
      const statusCode = res.statusCode ?? 0;
      const respData: any = res.data ?? {};

      if (statusCode === 200 && respData.reply) {
        const { cleanText, saved } = tryExtractBaziResult(respData.reply);
        placeReply(cleanText);
        tarotSystemContext.value = "";
        if (saved) {
          uni.showToast({ title: "能量图谱已生成", icon: "success", duration: 2000 });
        }
      } else if (statusCode === 429) {
        placeReply("抱歉，此刻向 Aura 倾诉的心声有些多，能量场略显拥挤。请试着深呼吸几次，片刻后再来与我连接好吗？");
      } else if (statusCode >= 500) {
        placeReply("能量通道出现了一点波动，请稍后再试一次。");
      } else {
        placeReply(respData.reply || "我在。你可以慢慢说，我在听。");
      }
    },
    fail: (err) => {
      console.error("[aura-chat] <<< FAIL:", JSON.stringify(err));
      placeReply("与能量源的连接暂时中断了，请稍后再试。");
    },
  });
}

function onQuick(label: string) {
  if (label === "五行排盘") {
    uni.navigateTo({ url: "/pages/onboarding/onboarding?from=quick" });
    return;
  }
  send(`我想看看${label}。`);
}

function navigateTo(key: "fortune" | "fengshui") {
  const routes: Record<"fortune" | "fengshui", string> = {
    fortune: "/pages/fortune/fortune",
    fengshui: "/pages/fengshui/fengshui",
  };
  uni.navigateTo({ url: routes[key] });
}

onShow(() => {
  uni.hideTabBar({ animation: false });

  // 每次页面显示时，根据当前时段更新首条 Aura 问候语
  auraGreeting.value = getAuraGreeting();

  const hasOnboarded = (uni.getStorageSync("AURA_HAS_ONBOARDED") || "").toString() === "1";
  if (!hasOnboarded) {
    uni.navigateTo({ url: "/pages/onboarding/onboarding" });
    return;
  }

  const pending = (uni.getStorageSync("AURA_PENDING_ASK") || "").toString().trim();
  if (pending) {
    uni.removeStorageSync("AURA_PENDING_ASK");
    deferredPendingAsk.value = pending;
  }

  const intent = (uni.getStorageSync("aura_intent") || "").toString().trim();
  if (intent) {
    uni.removeStorageSync("aura_intent");
    deferredPendingAsk.value = deferredPendingAsk.value
      ? `${deferredPendingAsk.value}\n\n${intent}`
      : intent;
  }

  const tarotRaw = (uni.getStorageSync("AURA_TAROT_CONTEXT") || "").toString().trim();
  console.log("[chat] onShow AURA_TAROT_CONTEXT:", tarotRaw ? tarotRaw.slice(0, 100) : "(empty)");
  if (tarotRaw) {
    uni.removeStorageSync("AURA_TAROT_CONTEXT");
    try {
      const tarot = JSON.parse(tarotRaw);
      const cardsSummary = (tarot.cards || [])
        .map((c: any) => `${c.position}：${c.name}（${c.reversed ? "逆位" : "正位"}）`)
        .join("、");
      const cardNames = (tarot.cards || []).map((c: any) => c.name).join("、");

      tarotSystemContext.value = [
        `[塔罗上下文] 用户刚完成今日潜意识探索，抽到的牌阵：${cardsSummary}。`,
        tarot.reading ? `AI 生成的解读摘要：${tarot.reading}` : "",
        tarot.crystal ? `推荐守护水晶：${tarot.crystal}` : "",
        "请结合以上塔罗信息回应用户，体现你已了解抽卡结果。",
      ].filter(Boolean).join("\n");

      const cards = tarot.cards || [];
      const card1 = cards[0]?.name || "未知";
      const card2 = cards[1]?.name || "未知";
      const card3 = cards[2]?.name || "未知";
      const tarotMsg: Message = {
        id: `m_${Date.now()}_tarot`,
        role: "ai",
        text: `我看到了刚才的牌阵：${card1}、${card2}、${card3}。今天的潜意识探索，有给你带来一些新的启发或情绪吗？把此刻最真实的感受告诉 Aura 吧。`,
      };
      messages.value.push(tarotMsg);
      nextTick(() => bumpScroll());

      deferredPendingAsk.value = "";
    } catch (_e) {
      // ignore parse errors
    }
  }

  maybeShowDailyCard();
  if (!showDailyCard.value) {
    const p = deferredPendingAsk.value.trim();
    deferredPendingAsk.value = "";
    if (p) send(p);
  }
});
</script>

<style>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.custom-nav {
  padding-left: 24px;
  padding-bottom: 12px;
  background: #FDFCF8;
  position: relative;
  z-index: 2;
}

.navTitle {
  font-size: 22px;
  font-weight: 600;
  color: #333333;
}

.dailyCardMask {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(253, 252, 248, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 240ms ease;
}

.dailyCardMask.closing {
  opacity: 0;
}

.dailyCardStage {
  width: 86vw;
  max-width: 360px;
  height: 78vh;
  max-height: 620px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(1);
  transition: transform 240ms ease;
}

.dailyCardStage.closing {
  transform: scale(0.98);
}

.dailyCardImage {
  width: 100%;
  height: 100%;
  border-radius: 18px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.10);
}

.dailyCardSave {
  position: fixed;
  right: 18px;
  bottom: 28px;
  padding: 12px 14px;
  border-radius: 999px;
  z-index: 21;
}

.dailyCardSave:active {
  transform: scale(0.96);
  opacity: 0.92;
}

.dailyCardSaveText {
  font-size: 14px;
  color: rgba(51, 51, 51, 0.92);
}

.aura-anchor {
  position: fixed;
  left: 50%;
  top: 50%;
  width: 300px;
  height: 300px;
  z-index: 0;
  pointer-events: none;
  animation: auraBreathe 4s ease-in-out infinite alternate;
}

.aura-anchorFloat {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: auraFloat 6s ease-in-out infinite alternate;
}

.aura-orb {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  display: block;
}

.aura-orbGlow {
  position: absolute;
  inset: -8px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 40% 28%, rgba(210, 223, 255, 0.75) 0%, rgba(210, 223, 255, 0) 60%),
    radial-gradient(circle at 30% 52%, rgba(160, 233, 248, 0.70) 0%, rgba(160, 233, 248, 0) 66%),
    radial-gradient(circle at 72% 42%, rgba(214, 197, 255, 0.66) 0%, rgba(214, 197, 255, 0) 66%),
    radial-gradient(circle at 62% 70%, rgba(185, 164, 255, 0.64) 0%, rgba(185, 164, 255, 0) 70%),
    radial-gradient(circle at 40% 78%, rgba(255, 186, 221, 0.66) 0%, rgba(255, 186, 221, 0) 72%),
    radial-gradient(circle at 74% 82%, rgba(245, 211, 253, 0.46) 0%, rgba(245, 211, 253, 0) 74%),
    radial-gradient(circle at 52% 58%, rgba(253, 252, 248, 0.00) 0%, rgba(253, 252, 248, 0) 78%);
  filter: blur(46px);
  opacity: 0.98;
}

.aura-orbCore {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0) 28%),
    radial-gradient(circle at 36% 52%, rgba(160, 233, 248, 0.62) 0%, rgba(160, 233, 248, 0) 62%),
    radial-gradient(circle at 70% 58%, rgba(214, 197, 255, 0.58) 0%, rgba(214, 197, 255, 0) 64%),
    radial-gradient(circle at 44% 78%, rgba(255, 186, 221, 0.60) 0%, rgba(255, 186, 221, 0) 66%),
    radial-gradient(circle at 58% 76%, rgba(185, 164, 255, 0.48) 0%, rgba(185, 164, 255, 0) 70%),
    radial-gradient(circle at 50% 58%, rgba(253, 252, 248, 0.00) 0%, rgba(253, 252, 248, 0) 90%);
  box-shadow:
    inset 0 18px 42px rgba(255, 255, 255, 0.40),
    inset 0 -26px 60px rgba(160, 170, 255, 0.28);
  filter: blur(7px);
}

@keyframes auraBreathe {
  from {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
}

@keyframes auraFloat {
  from {
    transform: translateY(-10px);
  }
  to {
    transform: translateY(10px);
  }
}

.chat {
  flex: 1;
  padding: 20rpx 0 0 0;
  position: relative;
  z-index: 1;
}

.chatInner {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 20px;
  margin-bottom: 12rpx;
}

.msg {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  animation: messageFadeInUp 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  will-change: transform, opacity;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.msg.isUser {
  justify-content: flex-start;
  align-items: flex-start;
}

.aiText {
  max-width: 72%;
}

.aiTextInner {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.88);
  line-height: 1.7;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.typingDream {
  min-height: 44rpx;
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 6rpx;
}

.typingDot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(195, 165, 232, 0.95) 0%, rgba(168, 202, 255, 0.65) 75%);
  box-shadow: 0 0 10rpx rgba(181, 153, 225, 0.55);
  animation: dreamDotFloat 1.6s ease-in-out infinite;
}

.typingDot:nth-child(2) {
  animation-delay: 0.22s;
}

.typingDot:nth-child(3) {
  animation-delay: 0.44s;
}

.bubble {
  max-width: 65%;
  padding: 18rpx 18rpx;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
  will-change: transform, opacity;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.msg.isUser {
  justify-content: flex-end;
}

.userBubble {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}

.bubbleText {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.92);
  line-height: 1.7;
}

.userBubbleText {
  color: rgba(0, 0, 0, 0.82);
}

@keyframes messageFadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.floating-palette {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: fit-content;
  margin: 0 auto 16px auto;
  padding: 6px 12px;
  gap: 16px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 100px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
  animation: ethereal-breathe 4s ease-in-out infinite;
}

.palette-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 100px;
  transition: background 0.2s ease;
  line-height: 1;
}

.palette-item:active {
  background: rgba(255, 255, 255, 0.8);
}

.palette-text {
  font-size: 13px;
  font-weight: 500;
  color: rgba(60, 60, 67, 0.8);
}

.palette-icon {
  width: 14px;
  height: 14px;
  position: relative;
  flex-shrink: 0;
}

.icon-wuxing {
  border: 1.5px solid rgba(120, 90, 160, 0.62);
  border-radius: 50%;
}

.icon-wuxing::before,
.icon-wuxing::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(120, 90, 160, 0.42);
  border-radius: 50%;
  top: -1.5px;
}

.icon-wuxing::before {
  left: -4px;
}

.icon-wuxing::after {
  left: 4px;
}

.mystic-card-icon {
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(120, 90, 160, 0.72);
  border-radius: 2.5px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.85;
  transform: translateY(-0.5px);
}

.mystic-card-diamond {
  width: 5px;
  height: 5px;
  background: rgba(120, 90, 160, 0.72);
  transform: rotate(45deg);
}

.icon-fengshui {
  border: 1.5px solid transparent;
}

.icon-fengshui::before {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 6px;
  border: 1.5px solid rgba(80, 80, 88, 0.58);
  border-top: none;
  border-radius: 1px;
}

.icon-fengshui::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  top: 0;
  margin: 0 auto;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(80, 80, 88, 0.58);
}

.composer {
  padding: 14rpx 24rpx calc(env(safe-area-inset-bottom) + 86px) 24rpx;
  position: relative;
  z-index: 1;
}

.composerInner {
  display: flex;
  align-items: center;
  padding: 10rpx 12rpx;
  gap: 10rpx;
}

.input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #333333;
}

.sendBtn {
  padding: 12rpx 14rpx;
  border-radius: 12px;
  background: rgba(182, 147, 214, 0.22);
}

.sendBtn.disabled {
  opacity: 0.58;
  pointer-events: none;
}

.sendText {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.95);
}

@keyframes dreamDotFloat {
  0%,
  100% {
    transform: translateY(0) scale(0.92);
    opacity: 0.42;
    filter: blur(0);
  }
  50% {
    transform: translateY(-5rpx) scale(1);
    opacity: 1;
    filter: blur(0.2rpx);
  }
}

@keyframes ethereal-breathe {
  0% {
    opacity: 0.85;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(182, 147, 214, 0.15);
  }
  100% {
    opacity: 0.85;
    transform: translateY(0);
  }
}
</style>
