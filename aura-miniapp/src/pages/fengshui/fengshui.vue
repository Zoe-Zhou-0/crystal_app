<template>
  <view class="page">
    <view class="glow-bg" :style="{ background: currentRoom.glowColor }" aria-hidden="true" />

    <view class="header">
      <view class="headerRow">
        <text class="title">空间能量布局</text>
        <view class="backBtn" @click="goBack">
          <text class="backText">返回</text>
        </view>
      </view>

      <scroll-view class="tabs" scroll-x show-scrollbar="false">
        <view class="tabsInner">
          <view
            v-for="room in roomList"
            :key="room.id"
            class="tab glass-panel"
            :class="{ active: room.id === currentRoomId }"
            @click="switchRoom(room.id)"
          >
            <text class="tabText">{{ room.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="panel glass-panel">
        <view class="panelTitleRow">
          <text class="panelTitle">能量雷达</text>
          <text class="panelSub">财富丰盛 · 身心疗愈 · 情绪流动 · 人际和谐 · 事业专注</text>
        </view>

        <view class="chartsBox">
          <canvas
            canvas-id="radarCanvas"
            id="radarCanvas"
            class="radarCanvas"
            :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
          />
        </view>
      </view>

      <view class="panel glass-panel">
        <view class="arrayHero" />
        <view class="arrayBody">
          <text class="arrayTitle">{{ currentRoom.arrayTitle }}</text>
          <view class="arrayTagPill">
            <text class="arrayTagText">{{ currentRoom.arrayTag }}</text>
          </view>
          <text class="arrayDesc">{{ currentRoom.arrayDesc }}</text>
        </view>

        <view class="arrayAction" @click="openArrayDetail">
          <text class="arrayActionText">✨ 探索阵法详情</text>
        </view>
      </view>
    </scroll-view>

    <view class="bottomDock">
      <view class="bottomMask" aria-hidden="true" />
      <view class="bottomInner">
        <view class="dockBtn" @click="callAura">
          <text class="dockBtnText">💬 呼叫 Aura 帮我堪舆布阵</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { onReady } from "@dcloudio/uni-app";

interface RoomEnergy {
  id: string;
  name: string;
  glowColor: string;
  radarCurrent: [number, number, number, number, number];
  radarExpected: [number, number, number, number, number];
  arrayTitle: string;
  arrayTag: string;
  arrayDesc: string;
}

const roomList: RoomEnergy[] = reactive([
  {
    id: "living",
    name: "客厅 · 聚气",
    glowColor:
      "radial-gradient(circle, rgba(182,147,214,0.4) 0%, rgba(255,204,153,0.2) 40%, rgba(253,252,248,0) 75%)",
    radarCurrent: [50, 60, 55, 65, 50],
    radarExpected: [90, 85, 80, 85, 75],
    arrayTitle: "引流聚气 · 紫晶阵法",
    arrayTag: "客厅能量补强",
    arrayDesc: "用柔和的紫色场域稳定情绪与关系，把散掉的气慢慢收回来。",
  },
  {
    id: "bedroom",
    name: "主卧 · 安眠",
    glowColor:
      "radial-gradient(circle, rgba(168,208,255,0.4) 0%, rgba(246,211,253,0.2) 40%, rgba(253,252,248,0) 75%)",
    radarCurrent: [55, 50, 58, 45, 52],
    radarExpected: [85, 90, 80, 92, 78],
    arrayTitle: "安神助眠 · 粉晶阵法",
    arrayTag: "睡眠与心轮",
    arrayDesc: '让空间更柔软，降低紧绷与内耗，给身体一个"可以休息"的信号。',
  },
  {
    id: "study",
    name: "书房 · 专注",
    glowColor:
      "radial-gradient(circle, rgba(142,197,252,0.4) 0%, rgba(224,195,252,0.2) 40%, rgba(253,252,248,0) 75%)",
    radarCurrent: [48, 62, 50, 58, 46],
    radarExpected: [88, 82, 92, 80, 78],
    arrayTitle: "文昌启智 · 萤石阵法",
    arrayTag: "思维与表达",
    arrayDesc: "把杂念收拢成清晰的路径，让学习与输出都更顺滑。",
  },
]);

const currentRoomId = ref("living");

const currentRoom = computed(() => {
  return roomList.find((r) => r.id === currentRoomId.value) || roomList[0];
});

const labels = ["财富丰盛", "身心疗愈", "情绪流动", "人际和谐", "事业专注"];
const canvasW = 310;
const canvasH = 260;
const maxVal = 100;

let canvasReady = false;

function drawRadar() {
  if (!canvasReady) return;

  const ctx = uni.createCanvasContext("radarCanvas");
  const cx = canvasW / 2;
  const cy = canvasH / 2 + 4;
  const radius = Math.min(cx, cy) - 36;
  const sides = labels.length;
  const step = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;

  function polarToXY(angle: number, r: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // --- background grid (3 layers) ---
  const gridLevels = [0.33, 0.66, 1.0];
  for (const level of gridLevels) {
    const r = radius * level;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const [x, y] = polarToXY(startAngle + step * i, r);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.setStrokeStyle("rgba(0,0,0,0.06)");
    ctx.setLineWidth(1);
    ctx.stroke();
  }

  // --- axis lines ---
  for (let i = 0; i < sides; i++) {
    const [x, y] = polarToXY(startAngle + step * i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.setStrokeStyle("rgba(0,0,0,0.06)");
    ctx.setLineWidth(1);
    ctx.stroke();
  }

  // --- "expected" area (dashed, lighter) ---
  const expected = currentRoom.value.radarExpected;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const r = (expected[i] / maxVal) * radius;
    const [x, y] = polarToXY(startAngle + step * i, r);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.setFillStyle("rgba(182,147,214,0.10)");
  ctx.fill();
  ctx.setLineDash([4, 4]);
  ctx.setStrokeStyle("rgba(182,147,214,0.45)");
  ctx.setLineWidth(1.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // --- "current" area (solid, purple) ---
  const current = currentRoom.value.radarCurrent;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const r = (current[i] / maxVal) * radius;
    const [x, y] = polarToXY(startAngle + step * i, r);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.setFillStyle("rgba(182,147,214,0.22)");
  ctx.fill();
  ctx.setStrokeStyle("#B693D6");
  ctx.setLineWidth(2);
  ctx.stroke();

  // --- data points on "current" ---
  for (let i = 0; i < sides; i++) {
    const r = (current[i] / maxVal) * radius;
    const [x, y] = polarToXY(startAngle + step * i, r);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.setFillStyle("#B693D6");
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.setFillStyle("#fff");
    ctx.fill();
  }

  // --- labels ---
  ctx.setFontSize(11);
  ctx.setFillStyle("rgba(51,51,51,0.72)");
  ctx.setTextAlign("center");
  ctx.setTextBaseline("middle");
  for (let i = 0; i < sides; i++) {
    const [x, y] = polarToXY(startAngle + step * i, radius + 20);
    ctx.fillText(labels[i], x, y);
  }

  ctx.draw();
}

onReady(() => {
  canvasReady = true;
  drawRadar();
});

watch(currentRoomId, () => {
  nextTick(() => drawRadar());
});

function switchRoom(id: string) {
  currentRoomId.value = id;
}

function openArrayDetail() {
  uni.showToast({ title: "阵法详情（占位）", icon: "none" });
}

function callAura() {
  uni.setStorageSync("aura_intent", `风水堪舆（${currentRoomId.value}）`);
  uni.switchTab({ url: "/pages/index/index" });
}

function goBack() {
  uni.navigateBack();
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

.glow-bg {
  position: fixed;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 320px;
  filter: blur(45px);
  z-index: -1;
  transition: background 0.8s ease;
  pointer-events: none;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
}

.header {
  position: relative;
  z-index: 1;
  padding: calc(env(safe-area-inset-top) + 92px) 0 10px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.headerRow {
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 20px;
  color: rgba(34, 34, 34, 0.92);
  letter-spacing: 0.5px;
}

.backBtn {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
}

.backBtn:active {
  transform: scale(0.96);
  opacity: 0.92;
}

.backText {
  font-size: 14px;
  color: rgba(51, 51, 51, 0.9);
}

.tabs {
  padding: 0;
}

.tabsInner {
  display: inline-flex;
  gap: 10px;
  padding: 0 20px;
}

.tab {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
}

.tab:active {
  transform: scale(0.98);
  opacity: 0.92;
}

.tab.active {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 12px rgba(182, 147, 214, 0.2);
}

.tabText {
  font-size: 13px;
  color: rgba(34, 34, 34, 0.88);
}

.tab.active .tabText {
  font-weight: 600;
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  padding: 0 20px calc(env(safe-area-inset-bottom) + 148px) 20px;
  box-sizing: border-box;
}

.panel {
  padding: 20px;
  margin-bottom: 16px;
}

.panelTitleRow {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panelTitle {
  font-size: 16px;
  color: rgba(34, 34, 34, 0.92);
}

.panelSub {
  font-size: 12px;
  color: rgba(51, 51, 51, 0.62);
  line-height: 1.5;
}

.chartsBox {
  margin-top: 14px;
  height: 260px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.03);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radarCanvas {
  display: block;
}

.arrayHero {
  height: 140px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.03);
}

.arrayBody {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.arrayTitle {
  font-size: 18px;
  color: rgba(34, 34, 34, 0.92);
}

.arrayTagPill {
  align-self: flex-start;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(182, 147, 214, 0.14);
}

.arrayTagText {
  font-size: 12px;
  color: rgba(34, 34, 34, 0.78);
}

.arrayDesc {
  font-size: 14px;
  color: rgba(51, 51, 51, 0.78);
  line-height: 1.7;
}

.arrayAction {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

.arrayActionText {
  font-size: 13px;
  color: rgba(51, 51, 51, 0.74);
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
  background: linear-gradient(to top, rgba(253, 252, 248, 1) 0%, rgba(253, 252, 248, 0) 100%);
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
  background: linear-gradient(135deg, rgba(182, 147, 214, 0.28) 0%, rgba(255, 255, 255, 0.76) 100%);
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
</style>
