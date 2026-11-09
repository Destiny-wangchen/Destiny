<script setup lang="ts">
import { computed, ref } from 'vue'
import bank from '../../../quiz/general.json'

interface Question {
  q: string
  options: string[]
  answer: number
  explain?: string
}

const { title, questions } = bank as { title: string; questions: Question[] }

// —— 本地进度记录：题号 -> 所选选项 ——
const STORE_KEY = 'quiz-general-record'
type RecordMap = Record<number, number>

function load(): RecordMap {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

const record = ref<RecordMap>(load())
const mode = ref<'menu' | 'quiz'>('menu')
const kind = ref<'all' | 'wrong'>('all')
const list = ref<number[]>([])
const cur = ref(0)
const chosen = ref<number | null>(null)

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(record.value))
  } catch {
    /* ignore */
  }
}

const allIdx = () => questions.map((_, i) => i)

const wrongIdx = computed(() =>
  allIdx().filter((i) => record.value[i] !== undefined && record.value[i] !== questions[i].answer)
)

const answeredCount = computed(() => Object.keys(record.value).length)
const correctCount = computed(
  () => allIdx().filter((i) => record.value[i] === questions[i].answer).length
)
const accuracy = computed(() =>
  answeredCount.value
    ? Math.round((correctCount.value / answeredCount.value) * 100)
    : null
)

function start(k: 'all' | 'wrong') {
  const seq = k === 'all' ? allIdx() : wrongIdx.value
  if (!seq.length) return
  kind.value = k
  list.value = seq
  cur.value = 0
  chosen.value = record.value[seq[0]] ?? null
  mode.value = 'quiz'
}

function pick(i: number) {
  if (chosen.value !== null) return
  chosen.value = i
  record.value[list.value[cur.value]] = i
  save()
}

function go(delta: number) {
  const next = cur.value + delta
  if (next < 0) return
  if (next >= list.value.length) {
    mode.value = 'menu'
    return
  }
  cur.value = next
  chosen.value = record.value[list.value[next]] ?? null
}

function reset() {
  if (!confirm('清空全部做题记录？')) return
  record.value = {}
  save()
}

const curQuestion = computed(() => questions[list.value[cur.value]])
const isWrongPick = computed(
  () => chosen.value !== null && chosen.value !== curQuestion.value.answer
)
function letter(i: number) {
  return String.fromCharCode(65 + i)
}
</script>
<template>
  <h1 class="page-title">{{ title }}</h1>

  <!-- 模式选择 -->
  <div v-if="mode === 'menu'" class="menu">
    <div class="stats">
      <span>共 {{ questions.length }} 题</span>
      <span>已作答 {{ answeredCount }} 题</span>
      <span v-if="accuracy !== null">正确率 {{ accuracy }}%</span>
      <span>错题 {{ wrongIdx.length }} 道</span>
    </div>
    <p class="menu-hint">做题记录保存在你自己的浏览器里，下次打开还在。</p>
    <div class="menu-actions">
      <button class="btn" type="button" @click="start('all')">
        {{ answeredCount ? '继续练习' : '开始练习' }}
      </button>
      <button class="btn ghost" type="button" :disabled="!wrongIdx.length" @click="start('wrong')">
        错题重练（{{ wrongIdx.length }}）
      </button>
      <button
        class="btn ghost danger"
        type="button"
        :disabled="!answeredCount"
        @click="reset"
      >
        清空记录
      </button>
    </div>
  </div>

  <!-- 做题界面 -->
  <div v-else class="quiz">
    <div class="quiz-top">
      <span class="quiz-progress">
        {{ kind === 'wrong' ? '错题重练' : '顺序练习' }} · 第 {{ cur + 1 }} / {{ list.length }} 题
      </span>
      <button class="text-btn" type="button" @click="mode = 'menu'">返回目录</button>
    </div>

    <p class="quiz-q">{{ curQuestion.q }}</p>

    <div class="quiz-options">
      <button
        v-for="(opt, i) in curQuestion.options"
        :key="i"
        class="option"
        :class="{
          picked: chosen === i,
          right: chosen !== null && i === curQuestion.answer,
          wrong: chosen === i && chosen !== curQuestion.answer
        }"
        type="button"
        :disabled="chosen !== null"
        @click="pick(i)"
      >
        <span class="opt-letter">{{ letter(i) }}</span>
        {{ opt }}
        <span v-if="chosen !== null && i === curQuestion.answer" class="opt-mark">✓</span>
        <span v-else-if="chosen === i && chosen !== curQuestion.answer" class="opt-mark">✗</span>
      </button>
    </div>

    <div v-if="chosen !== null" class="quiz-feedback">
      <p class="verdict" :class="isWrongPick ? 'bad' : 'good'">
        {{ isWrongPick ? '答错了' : '答对了' }}
      </p>
      <p v-if="curQuestion.explain" class="explain">{{ curQuestion.explain }}</p>
    </div>

    <div class="quiz-nav">
      <button class="btn ghost" type="button" :disabled="cur === 0" @click="go(-1)">上一题</button>
      <button class="btn" type="button" @click="go(1)">
        {{ cur + 1 >= list.length ? '完成' : '下一题' }}
      </button>
    </div>
  </div>
</template>
<style scoped>
.page-title {
  margin: 2.5rem 0 1rem;
  font-size: 1.5rem;
}
.menu-hint {
  color: var(--muted);
  font-size: 0.8125rem;
  margin: 0 0 1.25rem;
}
.stats {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 0.9375rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}
.menu-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.btn {
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--fg);
  border-radius: 6px;
  background: var(--fg);
  color: var(--bg);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.btn.ghost {
  background: none;
  color: var(--fg);
  border-color: var(--border);
}
.btn.ghost:hover:not(:disabled) {
  border-color: var(--muted);
}
.btn.ghost.danger:hover:not(:disabled) {
  color: #c0392b;
  border-color: #c0392b;
}
.text-btn {
  border: none;
  background: none;
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0;
}
.text-btn:hover {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.quiz-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--border);
}
.quiz-progress {
  color: var(--muted);
  font-size: 0.8125rem;
}
.quiz-q {
  font-size: 1.0625rem;
  line-height: 1.7;
  margin: 1.5rem 0 1rem;
}
.quiz-options {
  display: grid;
  gap: 0.6rem;
}
.option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-align: left;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.option:hover:not(:disabled) {
  border-color: var(--muted);
}
.option:disabled {
  cursor: default;
}
.opt-letter {
  color: var(--muted);
  font-size: 0.8125rem;
  flex-shrink: 0;
}
.opt-mark {
  margin-left: auto;
  flex-shrink: 0;
}
.option.right {
  border-color: var(--fg);
}
.option.right .opt-mark {
  color: var(--fg);
}
.option.wrong {
  border-color: #c0392b;
  color: #c0392b;
}
.quiz-feedback {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.7;
}
.verdict {
  margin: 0 0 0.35rem;
  font-weight: 600;
}
.verdict.good {
  color: var(--fg);
}
.verdict.bad {
  color: #c0392b;
}
.explain {
  margin: 0;
  color: var(--muted);
}
.quiz-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
}
</style>
