<template>
  <view class="page">
    <view class="fortune-sphere" aria-hidden="true" />

    <view class="topBar">
      <text class="pageTitle">今日潜意识探索</text>
      <view class="backBtn" @click="goBack">
        <text class="backText">返回</text>
      </view>
    </view>

    <view class="timeAnchor">
      <text class="timeAnchorText">{{ energyData.gregorian_date }}</text>
      <text class="timeAnchorDot">·</text>
      <text class="timeAnchorText">{{ energyData.lunar_date }}</text>
      <text class="timeAnchorDot">·</text>
      <text class="timeAnchorText">{{ energyData.ganzhi_info }}</text>
      <text class="timeAnchorDot">·</text>
      <text class="timeAnchorText">{{ energyData.moon_phase }}</text>
    </view>

    <scroll-view class="cards" scroll-y>
      <text class="tarotTip" :class="{ faded: allFlipped }">
        深呼吸，凭直觉翻开属于今日的能量指引
      </text>

      <view class="tarot-container glass-panel">
        <view class="tarot-row">
          <view v-for="card in drawnCards" :key="card.id" class="tarot-card-wrap" @click="flipCard(card.id)">
            <view class="tarot-card" :class="{ flipped: card.isFlipped }">
              <view class="tarot-face tarot-back">
                <text class="tarot-back-aura">AURA</text>
              </view>

              <view class="tarot-face tarot-front">
                <text class="tarot-pos">{{ card.position }}</text>
                <image class="tarot-img" :src="card.pic_url" mode="aspectFill" />
                <text class="tarot-name">{{ card.name_cn }}</text>
                <text class="tarot-dir">{{ card.isReversed ? "逆位" : "正位" }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="allFlipped && isLoadingReading" class="card glass-panel loadingCard">
        <text class="loadingText">✨ Aura 正在融合星象与牌意，生成你的专属解读...</text>
        <view class="loadingSkeleton">
          <view class="skeletonLine w80" />
          <view class="skeletonLine w92" />
          <view class="skeletonLine w65" />
        </view>
      </view>

      <view v-if="allFlipped && !isLoadingReading" class="card glass-panel revealCard readingPanel">
        <text class="forecast">{{ displayedReadingText || energyData.emotional_forecast }}</text>
        <view class="affirmWrap">
          <text class="affirm">{{ energyData.daily_affirmation }}</text>
        </view>
      </view>

      <view v-if="allFlipped && !isLoadingReading" class="card glass-panel revealCard">
        <view class="tags">
          <view v-for="t in displayActionGuide.favorable" :key="'f_' + t" class="tag good">
            <text class="tagText">宜 · {{ t }}</text>
          </view>
          <view v-for="t in displayActionGuide.unfavorable" :key="'u_' + t" class="tag bad">
            <text class="tagText">忌 · {{ t }}</text>
          </view>
        </view>
        <view class="crystalBlock">
          <text class="crystalLabel">守护水晶</text>
          <text class="crystalName">{{ finalCrystal.name || energyData.guardian_crystal.name }}</text>
          <text class="crystalReason">{{
            finalCrystal.reason || energyData.guardian_crystal.match_reason
          }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="allFlipped && !isLoadingReading" class="bottomDock" aria-hidden="false">
      <view class="bottomMask" aria-hidden="true" />
      <view class="bottomInner">
        <view class="dockBtn" @click="chatWithAura">
          <text class="dockBtnText">💬 让 Aura 陪你聊聊今天</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import tarotData from "@/utils/tarot-data.json";
import { apiUrl } from "@/utils/api";
import { onShow } from "@dcloudio/uni-app";

interface DailyEnergy {
  gregorian_date: string;
  lunar_date: string;
  ganzhi_info: string;
  moon_phase: string;

  energy_status: string;
  emotional_forecast: string;
  daily_affirmation: string;

  action_guide: {
    favorable: string[];
    unfavorable: string[];
  };

  guardian_crystal: {
    name: string;
    match_reason: string;
    is_owned: boolean;
  };
}

interface TarotDataItem {
  id: string;
  name_cn: string;
  pic_url: string;
  meaning_up: string;
  meaning_rev: string;
}

interface TarotCard extends TarotDataItem {
  position: "过去/卡点" | "现在/建议" | "未来/演化";
  isReversed: boolean;
  currentMeaning: string;
  isFlipped: boolean;
}

function formatGregorianDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

function getWeekdayCN(date: Date): string {
  const map = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return map[date.getDay()] || "";
}

function getLunarDateCN(date: Date): string {
  try {
    return new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function getGanzhiYearCN(date: Date): string {
  try {
    const raw = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
      year: "numeric",
    }).format(date);
    const matched = raw.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年)/);
    return matched?.[1] || raw;
  } catch {
    return "";
  }
}

function getMoonPhaseCN(date: Date): string {
  // 近似月相算法：满足 UI 级别“随日期变化”的展示需求
  const synodicMonth = 2551443; // 秒，平均朔望月
  const knownNewMoon = Date.UTC(1970, 0, 7, 20, 35, 0) / 1000;
  const nowSec = date.getTime() / 1000;
  const phase = ((nowSec - knownNewMoon) % synodicMonth + synodicMonth) % synodicMonth;
  const p = phase / synodicMonth;
  if (p < 0.03 || p >= 0.97) return "新月";
  if (p < 0.22) return "娥眉月";
  if (p < 0.28) return "上弦月";
  if (p < 0.47) return "盈凸月";
  if (p < 0.53) return "满月";
  if (p < 0.72) return "亏凸月";
  if (p < 0.78) return "下弦月";
  return "残月";
}

const energyData = ref<DailyEnergy>({
  gregorian_date: "2026年3月2日",
  lunar_date: "正月十四",
  ganzhi_info: "丙辰月 戊戌日",
  moon_phase: "盈凸月",
  energy_status: "土能量过载",
  emotional_forecast:
    "你可能会感到思维有些停滞或莫名固执，这很正常。不用强求效率，允许自己今天做个“慢动作”的人。",
  daily_affirmation: "IN THIS MOMENT, I AM ENOUGH.",
  action_guide: {
    favorable: ["复盘内省", "泡个热水澡"],
    unfavorable: ["做重大决策"],
  },
  guardian_crystal: {
    name: "海蓝宝",
    match_reason: "温柔的水元素能化解今日土象的固执。",
    is_owned: false,
  },
});

function refreshTimeAnchor() {
  const now = new Date();
  const gregorian = formatGregorianDate(now);
  const lunar = getLunarDateCN(now);
  const ganzhiYear = getGanzhiYearCN(now);
  const weekday = getWeekdayCN(now);
  const moonPhase = getMoonPhaseCN(now);

  energyData.value.gregorian_date = gregorian;
  if (lunar) energyData.value.lunar_date = lunar;
  energyData.value.ganzhi_info = ganzhiYear ? `${ganzhiYear} · ${weekday}` : weekday;
  energyData.value.moon_phase = moonPhase;
}

const drawnCards = ref<TarotCard[]>([]);

const allFlipped = computed(
  () => drawnCards.value.length === 3 && drawnCards.value.every((c) => c.isFlipped)
);

const isLoadingReading = ref(false);
const readingReady = ref(false);
const auraReadingText = ref("");
const displayedReadingText = ref("");
const finalReading = ref("");
const finalCrystal = ref<{ name: string; reason: string }>({
  name: "",
  reason: "",
});
const displayActionGuide = ref<{
  favorable: string[];
  unfavorable: string[];
}>({
  favorable: [...energyData.value.action_guide.favorable],
  unfavorable: [...energyData.value.action_guide.unfavorable],
});

let readingTimer: ReturnType<typeof setTimeout> | null = null;
let typewriterTimer: ReturnType<typeof setInterval> | null = null;

function clearTypewriterTimer() {
  if (!typewriterTimer) return;
  clearInterval(typewriterTimer);
  typewriterTimer = null;
}

function typewriterEffect(text: string) {
  clearTypewriterTimer();
  displayedReadingText.value = "";
  let cursor = 0;
  typewriterTimer = setInterval(() => {
    cursor += 1;
    displayedReadingText.value = text.slice(0, cursor);
    if (cursor >= text.length) clearTypewriterTimer();
  }, 30);
}

function normalizePicUrl(picUrl: string): string {
  if (!picUrl) return "";
  if (picUrl.startsWith("http")) return picUrl;
  if (picUrl.startsWith("/")) return picUrl;
  return `/static/tarot/${picUrl}`;
}

function shuffleAndDraw() {
  const deck = [...(tarotData as TarotDataItem[])];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const positions: TarotCard["position"][] = ["过去/卡点", "现在/建议", "未来/演化"];
  drawnCards.value = deck.slice(0, 3).map((card, index) => {
    const isReversed = Math.random() > 0.5;
    return {
      ...card,
      pic_url: normalizePicUrl(card.pic_url),
      position: positions[index],
      isReversed,
      currentMeaning: isReversed ? card.meaning_rev : card.meaning_up,
      isFlipped: false,
    };
  });

  isLoadingReading.value = false;
  readingReady.value = false;
  auraReadingText.value = "";
  displayedReadingText.value = "";
  finalReading.value = "";
  finalCrystal.value = { name: "", reason: "" };

  if (readingTimer) {
    clearTimeout(readingTimer);
    readingTimer = null;
  }
}

function buildReadingText(cards: TarotCard[]): string {
  const signs = cards
    .map((c) => `${c.position}：${c.name_cn}${c.isReversed ? "（逆位）" : "（正位）"}`)
    .join("、");
  const meanings = cards.map((c) => `${c.position}${c.currentMeaning}`).join("；");
  return `你今日抽到 ${signs}。${meanings}。这组牌面提示：先放下对完美节奏的执念，把注意力收回到当下可执行的一小步，情绪会在行动中逐渐稳定。`;
}

function buildLocalTarotGuide(cards: TarotCard[]) {
  const joined = cards
    .map((c) => `${c.name_cn} ${c.currentMeaning} ${c.isReversed ? "逆位" : "正位"}`)
    .join(" ");
  const reversedCount = cards.filter((c) => c.isReversed).length;

  const favorable = new Set<string>();
  const unfavorable = new Set<string>();

  if (reversedCount >= 2) {
    favorable.add("放慢节奏");
    favorable.add("复盘内省");
    unfavorable.add("冲动决策");
  } else {
    favorable.add("主动行动");
    favorable.add("推进关键任务");
    unfavorable.add("拖延观望");
  }

  if (/杯|月亮|女祭司|星星|隐者/.test(joined)) {
    favorable.add("情绪梳理");
    favorable.add("安静独处");
    unfavorable.add("过度社交");
  }

  if (/权杖|太阳|战车|力量|皇帝/.test(joined)) {
    favorable.add("运动排压");
    favorable.add("明确边界");
    unfavorable.add("硬碰硬争执");
  }

  if (/宝剑|审判|高塔|死神/.test(joined)) {
    favorable.add("断舍离");
    favorable.add("清理旧计划");
    unfavorable.add("反复纠结");
  }

  if (/星币|皇后|世界|节制/.test(joined)) {
    favorable.add("规律作息");
    favorable.add("稳步积累");
    unfavorable.add("透支精力");
  }

  let crystal = { name: "白水晶", reason: "帮助你理清杂讯，回到清晰稳定的节奏。" };
  if (/杯|月亮|女祭司|星星|隐者/.test(joined)) {
    crystal = { name: "海蓝宝", reason: "温柔安抚情绪起伏，帮助你把感受说清楚。"};
  } else if (/权杖|太阳|战车|力量|皇帝/.test(joined)) {
    crystal = { name: "石榴石", reason: "增强行动力与稳定意志，把热情落到执行。"};
  } else if (/宝剑|审判|高塔|死神/.test(joined)) {
    crystal = { name: "黑曜石", reason: "协助切断内耗与噪音，让你更有边界感。"};
  } else if (/星币|皇后|世界|节制/.test(joined)) {
    crystal = { name: "黄水晶", reason: "带来务实与秩序感，适合稳步推进当日目标。"};
  }

  return {
    favorable: Array.from(favorable).slice(0, 3),
    unfavorable: Array.from(unfavorable).slice(0, 2),
    crystal,
  };
}

function sanitizeReadingText(text: string): string {
  return text
    .replace(/<TAROT_DATA>[\s\S]*?<\/TAROT_DATA>/gi, "")
    .replace(/土能量过载[：:，,。]*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fetchTarotInterpretation() {
  if (!allFlipped.value || isLoadingReading.value || readingReady.value) return;
  const localGuide = buildLocalTarotGuide(drawnCards.value);
  displayActionGuide.value = {
    favorable: localGuide.favorable,
    unfavorable: localGuide.unfavorable,
  };

  const systemPrompt = `# Role
你是 Aura，一位充满疗愈感与东方/西方神秘学智慧的全息能量管家。
用户刚刚在“每日运势”中抽取了塔罗【三牌阵】。请你结合这三张牌的牌意，为用户提供一段温柔、洞察、且具有现代心理学视角的解读。

# Output Rules (输出要求)
1. 你的解读必须连贯，不要机械式地分开解释第一张、第二张。要把这三张牌串联成一个关于用户“今天如何度过”的疗愈故事。
2. 即使抽到了传统意义上的“凶牌”（如高塔、死神、宝剑十），严禁使用恐吓性的话语，必须将其转译为正向生长的心理学力量。
3. 结尾：结合这组牌的整体能量，顺理成章地推荐用户晶匣中的一款水晶（或推荐购买），作为今天的能量锚点。
4. 控制在 200-300 字左右，分段清晰，适度使用极简 Emoji。`;

  const userCardsString = drawnCards.value
    .map((card, index) => {
      const [mainPos] = card.position.split("/");
      return `位置${index + 1} [${mainPos}]：${card.name_cn}（${
        card.isReversed ? "逆位" : "正位"
      }） - JSON基础释义：${card.currentMeaning}`;
    })
    .join("\n");

  const userDailyElement = "火";

  const payload = {
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `用户的今日主导五行：${userDailyElement}\n抽牌结果如下：\n${userCardsString}`,
      },
    ],
    temperature: 1,
  };

  isLoadingReading.value = true;
  if (readingTimer) clearTimeout(readingTimer);
  uni.request<{ reply?: string; crystal?: { name?: string; reason?: string } | null }>({
    url: apiUrl("/api/tarot-reading"),
    method: "POST",
    header: { "content-type": "application/json" },
    data: payload,
    timeout: 60000,
    success: ({ data }) => {
      const safeData = data || {};
      const crystalName = (safeData?.crystal?.name ?? "").toString().trim();
      const crystalReason = (safeData?.crystal?.reason ?? "").toString().trim();

      auraReadingText.value = sanitizeReadingText((safeData?.reply ?? "").toString().trim());
      finalReading.value = auraReadingText.value || sanitizeReadingText(buildReadingText(drawnCards.value));
      typewriterEffect(finalReading.value);
      finalCrystal.value = {
        name: crystalName || localGuide.crystal.name || energyData.value.guardian_crystal.name,
        reason: crystalReason || localGuide.crystal.reason || energyData.value.guardian_crystal.match_reason,
      };
      readingReady.value = true;
      isLoadingReading.value = false;
    },
    fail: () => {
      auraReadingText.value =
        "我暂时没连上能量源（Kimi）。先给你一版本地解读：请把注意力放回当下最小行动，先完成一件小事，焦虑会显著下降。";
      finalReading.value = sanitizeReadingText(auraReadingText.value || buildReadingText(drawnCards.value));
      typewriterEffect(finalReading.value);
      finalCrystal.value = {
        name: localGuide.crystal.name || energyData.value.guardian_crystal.name,
        reason: localGuide.crystal.reason || energyData.value.guardian_crystal.match_reason,
      };
      readingReady.value = true;
      isLoadingReading.value = false;
    },
    complete: () => {
      readingTimer = null;
    },
  });
}

watch(allFlipped, (ready) => {
  if (ready) fetchTarotInterpretation();
});

function flipCard(cardId: TarotCard["id"]) {
  const target = drawnCards.value.find((c) => c.id === cardId);
  if (!target || target.isFlipped) return;
  target.isFlipped = true;
}

shuffleAndDraw();
refreshTimeAnchor();

onShow(() => {
  refreshTimeAnchor();
});

onBeforeUnmount(() => {
  if (readingTimer) {
    clearTimeout(readingTimer);
    readingTimer = null;
  }
  clearTypewriterTimer();
});

function goBack() {
  uni.navigateBack();
}

function chatWithAura() {
  const tarotPayload = {
    cards: drawnCards.value.map((card) => ({
      name: card.name_cn,
      position: card.position,
      reversed: card.isReversed,
    })),
    reading: finalReading.value || "",
    crystal: finalCrystal.value.name || "",
  };
  const payload = JSON.stringify(tarotPayload);
  console.log("[fortune] saving AURA_TAROT_CONTEXT, length:", payload.length, payload.slice(0, 100));
  uni.setStorageSync("AURA_TAROT_CONTEXT", payload);
  uni.switchTab({ url: "/pages/index/index" });
}
</script>

<style scoped>
.page {
  height: 100vh;
  background: #fdfcf8;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fortune-sphere {
  position: absolute;
  left: 50%;
  top: 20px;
  width: 260px;
  height: 260px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 187, 153, 0.4) 0%, rgba(255, 230, 204, 0) 70%);
  filter: blur(40px);
  pointer-events: none;
}

.topBar {
  padding: calc(env(safe-area-inset-top) + 92px) 20px 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.pageTitle {
  font-size: 20px;
  color: rgba(34, 34, 34, 0.92);
  letter-spacing: 0.5px;
}

.backBtn {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 187, 153, 0.18);
}

.backBtn:active {
  transform: scale(0.96);
  opacity: 0.92;
}

.backText {
  font-size: 14px;
  color: rgba(51, 51, 51, 0.9);
}

.cards {
  flex: 1;
  min-height: 0;
  padding: 0 20px calc(env(safe-area-inset-bottom) + 148px) 20px;
  box-sizing: border-box;
}

.timeAnchor {
  margin: 2px 20px 10px 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.timeAnchorText {
  font-size: 11px;
  color: rgba(51, 51, 51, 0.62);
}

.timeAnchorDot {
  font-size: 11px;
  color: rgba(51, 51, 51, 0.35);
}

.tarotTip {
  display: block;
  margin: 4px 0 12px 0;
  text-align: center;
  font-size: 13px;
  color: rgba(51, 51, 51, 0.68);
  transition: opacity 0.35s ease;
}

.tarotTip.faded {
  opacity: 0;
}

.tarot-container {
  padding: 16px 14px;
  margin-bottom: 16px;
}

.tarot-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tarot-card-wrap {
  width: 98px;
  height: 150px;
  perspective: 1000px;
}

.tarot-card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.tarot-card.flipped {
  transform: rotateY(180deg);
}

.tarot-face {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.68);
}

.tarot-back {
  background: linear-gradient(
    145deg,
    rgba(182, 147, 214, 0.48) 0%,
    rgba(134, 101, 181, 0.42) 55%,
    rgba(255, 255, 255, 0.34) 100%
  );
  box-shadow: 0 12px 20px rgba(123, 88, 166, 0.2) inset;
}

.tarot-back-aura {
  font-size: 14px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.95);
}

.tarot-front {
  transform: rotateY(180deg);
  background: rgba(255, 255, 255, 0.86);
  gap: 8px;
}

.tarot-pos {
  font-size: 11px;
  color: rgba(51, 51, 51, 0.58);
}

.tarot-name {
  font-size: 18px;
  color: rgba(34, 34, 34, 0.92);
}

.tarot-img {
  width: 56px;
  height: 76px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tarot-dir {
  font-size: 12px;
  color: rgba(134, 101, 181, 0.92);
}

.card {
  padding: 20px;
  margin-bottom: 16px;
}

.loadingCard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.loadingText {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(51, 51, 51, 0.82);
}

.loadingSkeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeletonLine {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(182, 147, 214, 0.12) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(182, 147, 214, 0.12) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.3s ease-in-out infinite;
}

.skeletonLine.w80 {
  width: 80%;
}

.skeletonLine.w92 {
  width: 92%;
}

.skeletonLine.w65 {
  width: 65%;
}

.revealCard {
  animation: fadeInUp 0.8s ease forwards;
}

.readingPanel {
  min-height: 220px;
  overflow: hidden;
  transition: min-height 0.35s ease, padding 0.35s ease;
}

.timeRow {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.timeCol {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeCol.right {
  align-items: flex-end;
}

.timeLabel {
  font-size: 12px;
  color: rgba(51, 51, 51, 0.6);
}

.timeValue {
  font-size: 16px;
  color: rgba(34, 34, 34, 0.92);
}

.timeMeta {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.metaText {
  font-size: 12px;
  color: rgba(51, 51, 51, 0.7);
}

.metaDot {
  font-size: 12px;
  color: rgba(51, 51, 51, 0.35);
}

.energyStatus {
  font-size: 18px;
  color: rgba(34, 34, 34, 0.92);
  letter-spacing: 0.5px;
}

.forecast {
  margin-top: 12px;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(51, 51, 51, 0.78);
  font-family: ui-serif, Georgia, "Times New Roman", serif;
  white-space: pre-wrap;
  word-break: break-all;
}

.affirmWrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.affirm {
  font-size: 14px;
  color: rgba(200, 60, 60, 0.95);
  letter-spacing: 1px;
  text-align: center;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 8px 10px;
  border-radius: 999px;
}

.tag.good {
  background: rgba(255, 187, 153, 0.16);
}

.tag.bad {
  background: rgba(0, 0, 0, 0.06);
}

.tagText {
  font-size: 12px;
  color: rgba(34, 34, 34, 0.82);
}

.crystalBlock {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.crystalLabel {
  font-size: 12px;
  color: rgba(51, 51, 51, 0.6);
}

.crystalName {
  font-size: 18px;
  color: rgba(34, 34, 34, 0.92);
}

.crystalReason {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(51, 51, 51, 0.78);
}

.cta {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

.ctaBtn {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 187, 153, 0.18);
}

.ctaBtn:active {
  transform: scale(0.98);
  opacity: 0.92;
}

.ctaText {
  font-size: 14px;
  color: rgba(34, 34, 34, 0.9);
}

.bottomDock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottomMask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 140px;
  background: linear-gradient(
    to top,
    rgba(253, 252, 248, 1) 0%,
    rgba(253, 252, 248, 0) 100%
  );
  pointer-events: none;
}

.bottomInner {
  position: relative;
  padding: 12px 20px 16px 20px;
}

.dockBtn {
  width: 100%;
  padding: 16px 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(182, 147, 214, 0.22) 0%, rgba(255, 255, 255, 0.68) 100%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dockBtn:active {
  transform: scale(0.98);
  opacity: 0.92;
}

.dockBtnText {
  font-size: 15px;
  color: rgba(34, 34, 34, 0.92);
  letter-spacing: 0.2px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>

