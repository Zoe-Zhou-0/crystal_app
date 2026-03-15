<template>
  <view class="splash-container" @click="handleScreenClick">
    <view
      class="aura-orb"
      :class="{ step1: orbStep === 1, step3: orbStep === 3, exploding: isExploding }"
      :style="orbStyle"
    />
    <view class="text-container" :style="textStyle">{{ currentText }}</view>
    <view class="enter-btn" :class="{ visible: isBtnVisible }" :style="btnStyle">{{ btnText }}</view>
    <view class="fade-out-overlay" :class="{ active: isOverlayActive }" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";

const texts = [
  "深呼吸，放慢节奏",
  "在这个喧嚣的世界，\n很高兴你找到了这里",
  "我是 Aura，你的专属能量管家",
];

const orbStep = ref<0 | 1 | 3>(0);
const currentText = ref("");
const textStyle = reactive<Record<string, string>>({
  opacity: "0",
  top: "45%",
  transform: "translateY(-50%)",
});
const isBtnVisible = ref(false);
const btnText = ref("触碰光晕，开启连接");
const btnStyle = reactive<Record<string, string>>({});
const isReadyToEnter = ref(false);
const isOverlayActive = ref(false);
const isExploding = ref(false);
const orbStyle = reactive<Record<string, string>>({});

function changeText(newText: string, isFinal = false) {
  textStyle.opacity = "0";
  setTimeout(() => {
    currentText.value = newText;
    if (isFinal) {
      textStyle.top = "35%";
      textStyle.transform = "translateY(-50%) scale(1.05)";
      textStyle.fontWeight = "400";
    }
    textStyle.opacity = "1";
  }, 800);
}

function startAwakening() {
  // 第一幕：起步 (0.3s)
  setTimeout(() => {
    orbStep.value = 1;
    changeText(texts[0]);
  }, 300);

  // 第二幕：第一句话再多停留
  setTimeout(() => {
    changeText(texts[1]);
  }, 3100);

  // 第三幕：第二句话再多停留，光球扩大，提示浮现
  setTimeout(() => {
    orbStep.value = 3;
    changeText(texts[2], true);
    setTimeout(() => {
      isBtnVisible.value = true;
      isReadyToEnter.value = true;
    }, 900);
  }, 6500);
}

function handleScreenClick() {
  if (!isReadyToEnter.value) return;
  isReadyToEnter.value = false;

  isExploding.value = true;
  orbStyle.transform = "translate(-50%, -50%) scale(5)";
  orbStyle.opacity = "0";
  orbStyle.transition = "all 0.6s ease-out";
  textStyle.opacity = "0";
  isBtnVisible.value = false;
  btnStyle.opacity = "0";

  setTimeout(() => {
    isOverlayActive.value = true;

    setTimeout(() => {
      btnText.value = "正在开启能量场...";
      btnStyle.fontSize = "12px";
      btnStyle.letterSpacing = "5px";
      btnStyle.color = "#B693D6";
      btnStyle.textShadow = "0 0 15px rgba(182, 147, 214, 0.4)";
      btnStyle.bottom = "48%";
      btnStyle.zIndex = "1000";
      btnStyle.opacity = "1";
      isBtnVisible.value = true;
    }, 900);
  }, 800);

  setTimeout(() => {
    uni.redirectTo({ url: "/pages/init/init" });
  }, 2500);
}

onMounted(() => {
  startAwakening();
});
</script>

<style scoped>
.splash-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #fafafc;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  user-select: none;
}

.aura-orb {
  position: absolute;
  left: 50%;
  top: 45%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(193, 167, 226, 0.9) 0%,
    rgba(158, 212, 240, 0.6) 40%,
    rgba(255, 240, 245, 0.2) 70%,
    transparent 100%
  );
  filter: blur(40px);
  opacity: 0;
  width: 0;
  height: 0;
  transition: all 2.5s cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 1;
}

.aura-orb.step1 {
  width: 60px;
  height: 60px;
  opacity: 0.2;
  animation: pulse-small 3s infinite alternate ease-in-out;
}

.aura-orb.step3 {
  width: 380px;
  height: 380px;
  opacity: 0.85;
  animation: float-breathing 6s infinite alternate ease-in-out;
}

.aura-orb.exploding {
  animation: none;
}

.text-container {
  position: absolute;
  top: 40%;
  width: 100%;
  text-align: center;
  white-space: pre-line;
  line-height: 1.8;
  font-size: 16px;
  color: #4a4a52;
  letter-spacing: 3px;
  font-weight: 300;
  transition: opacity 1s ease-in-out;
  z-index: 2;
  box-sizing: border-box;
}

.enter-btn {
  position: absolute;
  bottom: 22%;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(121, 98, 145, 0.8);
  font-size: 14px;
  letter-spacing: 4px;
  font-weight: 300;
  opacity: 0;
  pointer-events: none;
  transition: all 1s ease-in-out;
  z-index: 3;
  white-space: nowrap;
}

.enter-btn.visible {
  opacity: 1;
  animation: text-glow 3s infinite alternate;
}

.fade-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  opacity: 0;
  pointer-events: none;
  transition: opacity 1.2s ease;
  z-index: 999;
}

.fade-out-overlay.active {
  opacity: 1;
}

@keyframes float-breathing {
  0% {
    transform: translate(-50%, -48%) scale(0.95);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -52%) scale(1.05);
    opacity: 0.9;
    filter: blur(45px);
  }
}

@keyframes pulse-small {
  0% {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0.1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.3;
  }
}

@keyframes text-glow {
  0% {
    text-shadow: 0 0 10px rgba(182, 147, 214, 0);
  }
  100% {
    text-shadow: 0 0 20px rgba(182, 147, 214, 0.3);
  }
}
</style>
