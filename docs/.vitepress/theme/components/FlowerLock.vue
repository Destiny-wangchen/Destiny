<script setup lang="ts">
import { ref } from 'vue'
import { useGardenSecret } from '../useGardenSecret'

const { typed, unlocked, press, lock } = useGardenSecret()

const digits = Array.from({ length: 10 }, (_, i) => i)
const shake = ref(false)

// 花朵 n 已点亮的次数 = 该数字在已按对序列中出现的次数（0、1、7 各要按两次，逐次点亮）
function litLevel(n: number) {
  return Math.min(typed.value.filter((d) => d === n).length, 2)
}

function onClick(n: number) {
  const r = press(n)
  if (r === 'wrong') {
    shake.value = false
    requestAnimationFrame(() => (shake.value = true))
  }
}
</script>

<template>
  <div class="flower-lock" :class="{ unlocked, shake }" @animationend="shake = false">
    <button
      v-for="n in digits"
      :key="n"
      class="flower"
      :class="{ 'lit-1': litLevel(n) >= 1, 'lit-2': litLevel(n) >= 2 }"
      type="button"
      :aria-label="`花 ${n}`"
      @click="onClick(n)"
    >
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
        <circle class="petal" cx="16" cy="9" r="5" />
        <circle class="petal" cx="16" cy="23" r="5" />
        <circle class="petal" cx="9" cy="16" r="5" />
        <circle class="petal" cx="23" cy="16" r="5" />
        <circle class="heart" cx="16" cy="16" r="3.4" />
      </svg>
      <span class="num">{{ n }}</span>
    </button>
    <button v-if="unlocked" class="lock-btn" type="button" title="重新上锁" @click="lock">
      锁定
    </button>
  </div>
</template>

<style scoped>
.flower-lock {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 0.4rem;
}
.flower {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--muted);
  opacity: 0.75;
  transition: color 0.2s, opacity 0.2s, transform 0.15s;
}
.flower:hover {
  color: var(--fg);
  opacity: 1;
  transform: scale(1.12);
}
.flower .petal {
  fill: currentColor;
  opacity: 0.28;
  transition: opacity 0.2s, fill 0.2s;
}
.flower .heart {
  fill: var(--bg);
  transition: fill 0.2s;
}
.flower .num {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8px;
  line-height: 1;
  color: var(--muted);
  pointer-events: none;
}
/* 点亮状态：花瓣渐次变实，花心翻色 */
.flower.lit-1 .petal {
  opacity: 0.55;
}
.flower.lit-2 .petal {
  opacity: 1;
}
.flower.lit-2 .num {
  color: var(--bg);
  font-weight: 600;
}
.flower.lit-2 .heart {
  fill: var(--fg);
}
/* 未解锁时整体低调，解锁后完全隐去提示 */
.unlocked .flower {
  opacity: 0.5;
}
.hint {
  margin-left: 0.5rem;
  font-size: 0.6875rem;
  color: var(--muted);
}
.lock-btn {
  margin-left: 0.5rem;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 0.6875rem;
  cursor: pointer;
  padding: 0;
}
.lock-btn:hover {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.shake {
  animation: shake 0.35s;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}
</style>
