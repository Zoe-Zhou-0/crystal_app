<template>
  <view class="page">
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
          <view class="avatar" :class="{ ai: m.role === 'ai', user: m.role === 'user' }">
            <text class="avatarText">{{ m.role === 'ai' ? 'A' : '我' }}</text>
          </view>
          <view class="bubble glass-panel">
            <text class="bubbleText">{{ m.text }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="quick" scroll-x show-scrollbar="false">
      <view class="quickInner">
        <view class="pill glass-panel" @click="onQuick('五行排盘')">
          <text class="pillText">五行排盘</text>
        </view>
        <view class="pill glass-panel" @click="onQuick('今日运势')">
          <text class="pillText">今日运势</text>
        </view>
        <view class="pill glass-panel" @click="onQuick('家宅风水')">
          <text class="pillText">家宅风水</text>
        </view>
      </view>
    </scroll-view>

    <view class="composer">
      <view class="composerInner glass-panel">
        <input
          class="input"
          v-model="draft"
          placeholder="把你此刻的感受告诉 Aura…"
          confirm-type="send"
          @confirm="send()"
        />
        <view class="sendBtn" @click="send()">
          <text class="sendText">发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";

type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
};

const messages = ref<Message[]>([
  {
    id: "m1",
    role: "ai",
    text: "欢迎回来。我在这里。今天想从哪里开始说起？",
  },
  {
    id: "m2",
    role: "user",
    text: "我最近有点焦虑，睡得不太好。",
  },
]);

const draft = ref("");
const scrollIntoView = ref("m2");

function bumpScroll() {
  const last = messages.value[messages.value.length - 1];
  if (!last) return;
  scrollIntoView.value = last.id;
}

async function send(text?: string) {
  const content = (text ?? draft.value).trim();
  if (!content) return;

  draft.value = "";
  const userMsg: Message = { id: `m_${Date.now()}_u`, role: "user", text: content };
  messages.value.push(userMsg);
  await nextTick();
  bumpScroll();

  try {
    const { data } = await uni.request<{ reply: string }>({
      url: "http://127.0.0.1:8787/api/chat",
      method: "POST",
      header: { "content-type": "application/json" },
      data: { message: content },
      timeout: 60000,
    });

    const replyText = (data as any)?.reply || "我在。你可以慢慢说，我在听。";
    messages.value.push({ id: `m_${Date.now()}_a`, role: "ai", text: replyText });
  } catch (_e) {
    messages.value.push({
      id: `m_${Date.now()}_a`,
      role: "ai",
      text: "我这边暂时连不上能量源（后端）。请确认 aura-backend 已启动，并在微信开发者工具里关闭“合法域名校验”。",
    });
  }

  await nextTick();
  bumpScroll();
}

function onQuick(label: string) {
  send(`我想看看${label}。`);
}

onShow(() => {
  const pending = (uni.getStorageSync("AURA_PENDING_ASK") || "").toString().trim();
  if (pending) {
    uni.removeStorageSync("AURA_PENDING_ASK");
    send(pending);
  }
});
</script>

<style>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat {
  flex: 1;
  padding: 20rpx 24rpx 0 24rpx;
}

.chatInner {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-bottom: 12rpx;
}

.msg {
  display: flex;
  gap: 12rpx;
  align-items: flex-end;
}

.msg.isUser {
  flex-direction: row-reverse;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.avatar.ai {
  background: rgba(182, 147, 214, 0.22);
}

.avatar.user {
  background: rgba(0, 0, 0, 0.06);
}

.avatarText {
  font-size: 26rpx;
  color: rgba(51, 51, 51, 0.9);
}

.bubble {
  max-width: 520rpx;
  padding: 18rpx 18rpx;
}

.bubbleText {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.92);
  line-height: 1.7;
}

.quick {
  padding: 12rpx 0 0 0;
}

.quickInner {
  display: inline-flex;
  gap: 12rpx;
  padding: 0 24rpx;
}

.pill {
  padding: 12rpx 16rpx;
  border-radius: 999px;
}

.pillText {
  font-size: 26rpx;
  color: rgba(51, 51, 51, 0.9);
}

.composer {
  padding: 14rpx 24rpx 24rpx 24rpx;
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

.sendText {
  font-size: 28rpx;
  color: rgba(51, 51, 51, 0.95);
}
</style>
