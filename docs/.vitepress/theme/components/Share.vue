<script setup lang="ts">
// 文章底部分享组件：按访客环境给出当前条件下最短的真实分享路径
// - 微信内置浏览器：提示右上角「⋯」转发（微信不开放网页一键转发能力，这是微信内的最短路径）
// - 手机浏览器：调起系统分享面板（Web Share API，面板里可选微信）
// - 电脑浏览器：显示二维码（手机扫码打开后再转发）+ 复制链接
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()

const mode = ref<'checking' | 'wechat' | 'native' | 'desktop'>('checking')
const copied = ref(false)
const qrData = ref('')

const shareUrl = () => window.location.href
const shareTitle = () => `${frontmatter.value.title || ''} · Destiny的花园`.trim()

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl())
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // 剪贴板不可用时退回到手动选择复制
    window.prompt('手动复制文章链接：', shareUrl())
  }
}

async function nativeShare() {
  try {
    await navigator.share({ title: frontmatter.value.title || '', text: shareTitle(), url: shareUrl() })
  } catch {
    // 用户取消（AbortError）不处理；API 不可用时退回复制链接
    if (!(navigator.share as unknown)) copyLink()
  }
}

onMounted(() => {
  const ua = navigator.userAgent
  const isWeChat = /MicroMessenger/i.test(ua)
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua)

  if (isWeChat) {
    mode.value = 'wechat'
    return
  }
  if (isMobile && typeof navigator.share === 'function') {
    mode.value = 'native'
    return
  }
  // 桌面端：生成本页二维码
  mode.value = 'desktop'
  import('qrcode')
    .then((QR) =>
      QR.toDataURL(shareUrl(), {
        margin: 1,
        width: 112,
        color: { dark: '#1f2328', light: '#ffffff' }
      })
    )
    .then((data) => (qrData.value = data))
    .catch(() => (qrData.value = ''))
})
</script>

<template>
  <div class="share" :class="`share--${mode}`">
    <!-- 微信内：引导用自带转发 -->
    <template v-if="mode === 'wechat'">
      <p class="share-hint">
        觉得这篇不错？点右上角「<strong>⋯</strong>」
        <span class="share-hint-sub">转发给朋友，或分享到朋友圈</span>
      </p>
      <button class="share-btn" type="button" @click="copyLink">
        {{ copied ? '已复制 ✓' : '复制链接' }}
      </button>
    </template>

    <!-- 手机浏览器：系统分享面板 -->
    <template v-else-if="mode === 'native'">
      <span class="share-label">分享这篇文章</span>
      <button class="share-btn" type="button" @click="nativeShare">分享给朋友</button>
      <button class="share-btn share-btn--ghost" type="button" @click="copyLink">
        {{ copied ? '已复制 ✓' : '复制链接' }}
      </button>
    </template>

    <!-- 电脑：二维码 + 复制链接 -->
    <template v-else-if="mode === 'desktop'">
      <span class="share-label">手机扫码阅读</span>
      <img v-if="qrData" class="share-qr" :src="qrData" alt="文章二维码" width="112" height="112" />
      <button class="share-btn" type="button" @click="copyLink">
        {{ copied ? '已复制 ✓' : '复制链接' }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.share {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: var(--muted);
  font-size: 0.875rem;
}
.share-hint {
  margin: 0;
  display: inline;
}
.share-hint strong {
  color: var(--fg);
}
.share-hint-sub {
  margin-left: 0.5rem;
}
.share-label {
  color: var(--muted);
}
.share-btn {
  appearance: none;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.share-btn:hover {
  border-color: var(--fg);
}
.share-btn--ghost {
  color: var(--muted);
}
.share-qr {
  display: block;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #ffffff;
}
</style>
