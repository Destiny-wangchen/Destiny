<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import bank from '../../../quiz/c-language.json'

interface Question {
  id: string
  type: 'choice' | 'blank'
  q: string
  code?: string
  options?: string[]
  answer: number | string[]
  explain: string
}

interface Category {
  id: string
  name: string
  questions: Question[]
}

const { title, categories } = bank as { title: string; categories: Category[] }

// 全部题目铺平，方便查找
const qMap: Record<string, Question> = {}
for (const cat of categories) for (const q of cat.questions) qMap[q.id] = q
const allIds = Object.keys(qMap)

// —— 本地记录：题号 -> { p: 所选选项/填的文本, ok: 是否正确 } ——
const STORE_KEY = 'quiz-c-record-v1'
interface RecItem { p: number | string; ok: 0 | 1 }

function load(): Record<string, RecItem> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}
const record = ref<Record<string, RecItem>>(load())
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(record.value))
  } catch {
    /* ignore */
  }
}

// 填空判分：忽略全半角逗号差异与所有空白
function norm(s: string) {
  return s.replace(/，/g, ',').replace(/\s+/g, '')
}
function isCorrect(q: Question, picked: number | string) {
  if (q.type === 'choice') return picked === q.answer
  const list = q.answer as string[]
  return list.some((v) => norm(String(v)) === norm(String(picked)))
}
function answerText(q: Question) {
  return q.type === 'choice'
    ? String.fromCharCode(65 + (q.answer as number))
    : (q.answer as string[])[0]
}

// —— 全局统计 ——
const total = allIds.length
const answeredIds = computed(() => allIds.filter((id) => record.value[id]))
const correctCount = computed(() => answeredIds.value.filter((id) => record.value[id].ok).length)
const accuracy = computed(() =>
  answeredIds.value.length ? Math.round((correctCount.value / answeredIds.value.length) * 100) : null
)
const wrongIds = computed(() => answeredIds.value.filter((id) => !record.value[id].ok))

function catStat(cat: Category) {
  let answered = 0
  let correct = 0
  for (const q of cat.questions) {
    const r = record.value[q.id]
    if (r) {
      answered++
      if (r.ok) correct++
    }
  }
  return {
    answered,
    total: cat.questions.length,
    rate: answered ? Math.round((correct / answered) * 100) : null
  }
}

// —— 会话状态 ——
const view = ref<'menu' | 'quiz' | 'result'>('menu')
const practiceMode = ref(true) // true 练习（逐题反馈），false 考试（交卷出分）
const session = reactive({ label: '', ids: [] as string[], exam: false })
const cur = ref(0)
const examAnswers = reactive<Record<string, number | string>>({})

// 练习模式下的单题状态
const practice = reactive({
  picked: null as number | null,
  text: '',
  confirmed: false
})

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function start(label: string, ids: string[], exam: boolean) {
  if (!ids.length) return
  session.label = label
  session.ids = ids
  session.exam = exam
  cur.value = 0
  for (const k of Object.keys(examAnswers)) delete examAnswers[k]
  resetPractice()
  view.value = 'quiz'
}

function startCat(cat: Category, onlyWrong = false) {
  const ids = onlyWrong
    ? cat.questions.filter((q) => record.value[q.id] && !record.value[q.id].ok).map((q) => q.id)
    : cat.questions.map((q) => q.id)
  start(cat.name + (onlyWrong ? ' · 错题' : ''), ids, !practiceMode.value)
}

function startRandom(n: number) {
  start(`随机组卷 ${n} 题`, shuffle(allIds).slice(0, Math.min(n, total)), !practiceMode.value)
}

function startWrong() {
  start('错题重练', wrongIds.value, !practiceMode.value)
}

function resetPractice() {
  practice.picked = null
  practice.text = ''
  practice.confirmed = false
}

const curQ = computed(() => qMap[session.ids[cur.value]])
const curAnswered = computed(() => examAnswers[curQ.value.id] !== undefined)

function pick(i: number) {
  if (session.exam) {
    examAnswers[curQ.value.id] = i
  } else {
    if (practice.confirmed) return
    practice.picked = i
  }
}

function confirmBlank() {
  const t = practice.text.trim()
  if (!t || practice.confirmed) return
  practice.picked = -1
  practice.text = t
  practice.confirmed = true
  record.value[curQ.value.id] = {
    p: t,
    ok: isCorrect(curQ.value, t) ? 1 : 0
  }
  save()
}

function confirm() {
  const q = curQ.value
  if (session.exam) {
    if (q.type === 'blank' && !String(examAnswers[q.id] ?? '').trim()) return
    if (q.type === 'choice' && examAnswers[q.id] === undefined) return
    // 记录并前进；最后一题停住等交卷
    if (cur.value < session.ids.length - 1) {
      cur.value++
      resetPractice()
    }
    return
  }
  if (practice.confirmed) return
  const picked: number | string = q.type === 'choice' ? (practice.picked as number) : practice.text.trim()
  if (q.type === 'choice' && picked === null) return
  if (q.type === 'blank' && !String(picked).trim()) return
  practice.confirmed = true
  record.value[q.id] = { p: picked, ok: isCorrect(q, picked) ? 1 : 0 }
  save()
}

function go(delta: number) {
  const next = cur.value + delta
  if (next < 0 || next >= session.ids.length) return
  cur.value = next
  resetPractice()
}

function submitExam() {
  const unanswered = session.ids.filter((id) => examAnswers[id] === undefined || (qMap[id].type === 'blank' && !String(examAnswers[id]).trim()))
  if (unanswered.length && !confirm(`还有 ${unanswered.length} 题未作答，确定交卷？`)) return
  for (const id of session.ids) {
    const q = qMap[id]
    const p = examAnswers[id]
    if (p === undefined) continue
    record.value[id] = { p, ok: isCorrect(q, p) ? 1 : 0 }
  }
  save()
  view.value = 'result'
}

function reset() {
  if (!confirm('清空全部做题记录？')) return
  record.value = {}
  save()
}

const examScore = computed(() => {
  let c = 0
  for (const id of session.ids) {
    const r = record.value[id]
    if (r && r.ok) c++
  }
  return c
})

const progressText = computed(
  () => `${session.label} · 第 ${cur.value + 1} / ${session.ids.length} 题`
)

function letter(i: number) {
  return String.fromCharCode(65 + i)
}
function backToMenu() {
  view.value = 'menu'
}
</script>

<template>
  <h1 class="page-title">{{ title }}</h1>

  <!-- ============ 目录 ============ -->
  <div v-if="view === 'menu'" class="menu">
    <div class="stats">
      <span>共 {{ total }} 题 · {{ categories.length }} 个分类</span>
      <span>已作答 {{ answeredIds.length }} 题</span>
      <span v-if="accuracy !== null">正确率 {{ accuracy }}%</span>
      <span>错题 {{ wrongIds.length }} 道</span>
    </div>
    <p class="menu-hint">做题记录保存在你自己的浏览器里，下次打开还在。换设备或清缓存会丢失。</p>

    <div class="mode-row">
      <span class="mode-label">答题模式</span>
      <button
        class="mode-btn"
        :class="{ on: practiceMode }"
        type="button"
        @click="practiceMode = true"
      >
        练习模式（逐题看答案）
      </button>
      <button
        class="mode-btn"
        :class="{ on: !practiceMode }"
        type="button"
        @click="practiceMode = false"
      >
        考试模式（交卷出分）
      </button>
    </div>

    <div class="section-title">按知识点刷</div>
    <div class="cat-list">
      <div v-for="cat in categories" :key="cat.id" class="cat-card">
        <div class="cat-head">
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-meta">
            {{ catStat(cat).answered }}/{{ catStat(cat).total }}
            <template v-if="catStat(cat).rate !== null"> · 正确率 {{ catStat(cat).rate }}%</template>
          </span>
        </div>
        <div class="bar">
          <div class="bar-fill" :style="{ width: (catStat(cat).answered / catStat(cat).total) * 100 + '%' }"></div>
        </div>
        <div class="cat-actions">
          <button class="btn small" type="button" @click="startCat(cat)">
            {{ catStat(cat).answered ? '继续' : '开始' }}
          </button>
          <button
            class="btn ghost small"
            type="button"
            :disabled="!cat.questions.some((q) => record[q.id] && !record[q.id].ok)"
            @click="startCat(cat, true)"
          >
            只刷错题
          </button>
        </div>
      </div>
    </div>

    <div class="section-title">整卷演练</div>
    <div class="menu-actions">
      <button class="btn" type="button" @click="startRandom(10)">随机组卷 10 题</button>
      <button class="btn" type="button" @click="startRandom(20)">随机组卷 20 题</button>
      <button class="btn ghost" type="button" :disabled="!wrongIds.length" @click="startWrong">
        错题重练（{{ wrongIds.length }}）
      </button>
      <button class="btn ghost danger" type="button" :disabled="!answeredIds.length" @click="reset">
        清空记录
      </button>
    </div>
  </div>

  <!-- ============ 做题 ============ -->
  <div v-else-if="view === 'quiz'" class="quiz">
    <div class="quiz-top">
      <span class="quiz-progress">{{ progressText }}</span>
      <span class="quiz-top-actions">
        <span v-if="session.exam" class="exam-tag">考试模式</span>
        <button class="text-btn" type="button" @click="backToMenu">返回目录</button>
      </span>
    </div>

    <p class="quiz-q">{{ curQ.q }}</p>
    <pre v-if="curQ.code" class="quiz-code"><code>{{ curQ.code }}</code></pre>

    <div v-if="curQ.type === 'choice'" class="quiz-options">
      <button
        v-for="(opt, i) in curQ.options"
        :key="i"
        class="option"
        :class="{
          picked: session.exam ? examAnswers[curQ.id] === i : practice.picked === i,
          right: practice.confirmed && !session.exam && i === (curQ.answer as number),
          wrong: practice.confirmed && !session.exam && practice.picked === i && i !== (curQ.answer as number)
        }"
        type="button"
        :disabled="practice.confirmed"
        @click="pick(i)"
      >
        <span class="opt-letter">{{ letter(i) }}</span>
        {{ opt }}
        <span
          v-if="practice.confirmed && !session.exam && i === (curQ.answer as number)"
          class="opt-mark"
          >✓</span
        >
        <span
          v-else-if="practice.confirmed && !session.exam && practice.picked === i && i !== (curQ.answer as number)"
          class="opt-mark"
          >✗</span
        >
      </button>
    </div>

    <div v-else class="blank-row">
      <input
        v-model="practice.text"
        class="blank-input"
        type="text"
        placeholder="填入答案后确认（忽略空格差异）"
        :disabled="practice.confirmed"
        @keyup.enter="curQ.type === 'blank' && confirm()"
      />
    </div>

    <div class="confirm-row">
      <!-- 练习模式 -->
      <template v-if="!session.exam">
        <button
          v-if="!practice.confirmed"
          class="btn"
          type="button"
          :disabled="curQ.type === 'choice' ? practice.picked === null : !practice.text.trim()"
          @click="confirm"
        >
          确认作答
        </button>
        <div v-else class="practice-feedback" :class="record[curQ.id]?.ok ? 'good' : 'bad'">
          <p class="verdict">
            {{ record[curQ.id]?.ok ? '答对了' : '答错了' }} · 正确答案：{{ answerText(curQ) }}
          </p>
          <p class="explain">{{ curQ.explain }}</p>
        </div>
      </template>
      <!-- 考试模式 -->
      <template v-else>
        <div class="exam-dots">
          <button
            v-for="(id, i) in session.ids"
            :key="id"
            class="dot"
            :class="{ done: examAnswers[id] !== undefined, here: i === cur }"
            type="button"
            :title="`第 ${i + 1} 题`"
            @click="cur = i; resetPractice()"
          >
            {{ i + 1 }}
          </button>
        </div>
      </template>
    </div>

    <div v-if="session.exam" class="quiz-feedback">
      <p v-if="curAnswered" class="exam-answered">
        已作答，可修改后继续；全部答完点右下角「交卷」。
      </p>
    </div>

    <div class="quiz-nav">
      <button class="btn ghost" type="button" :disabled="cur === 0" @click="go(-1)">上一题</button>
      <template v-if="session.exam">
        <button
          class="btn"
          type="button"
          :disabled="cur === session.ids.length - 1 && !curAnswered"
          @click="cur === session.ids.length - 1 ? submitExam() : go(1)"
        >
          {{ cur === session.ids.length - 1 ? '交卷' : '下一题' }}
        </button>
      </template>
      <template v-else>
        <button
          class="btn"
          type="button"
          :disabled="!practice.confirmed"
          @click="cur + 1 >= session.ids.length ? backToMenu() : go(1)"
        >
          {{ cur + 1 >= session.ids.length ? '完成' : '下一题' }}
        </button>
      </template>
    </div>
  </div>

  <!-- ============ 考试成绩 ============ -->
  <div v-else class="result">
    <div class="result-score">
      <span class="score-num">{{ examScore }}</span>
      <span class="score-total">/ {{ session.ids.length }}</span>
      <span class="score-label">{{ session.label }}</span>
    </div>
    <div v-for="id in session.ids" :key="id" class="review" :class="{ bad: !record[id]?.ok }">
      <p class="review-q">
        <span class="review-tag">{{ record[id]?.ok ? '✓' : '✗' }}</span>
        {{ qMap[id].q }}
      </p>
      <pre v-if="qMap[id].code" class="quiz-code"><code>{{ qMap[id].code }}</code></pre>
      <p class="review-a">
        你的答案：{{ record[id] ? (qMap[id].type === 'choice' ? letter(record[id].p as number) + '. ' + qMap[id].options?.[record[id].p as number] : record[id].p) : '未作答' }}
        <template v-if="!record[id]?.ok">
          <br />正确答案：{{ answerText(qMap[id]) }}
        </template>
      </p>
      <p class="explain">{{ qMap[id].explain }}</p>
    </div>
    <div class="menu-actions">
      <button class="btn" type="button" @click="backToMenu">返回目录</button>
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
.mode-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0 1.5rem;
}
.mode-label {
  color: var(--muted);
  font-size: 0.8125rem;
}
.mode-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: none;
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
}
.mode-btn.on {
  background: var(--fg);
  border-color: var(--fg);
  color: var(--bg);
}
.section-title {
  font-size: 0.8125rem;
  color: var(--muted);
  margin: 1.25rem 0 0.6rem;
}
.cat-list {
  display: grid;
  gap: 0.6rem;
}
.cat-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.8rem 1rem;
}
.cat-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}
.cat-name {
  font-weight: 600;
  font-size: 0.9375rem;
}
.cat-meta {
  color: var(--muted);
  font-size: 0.8125rem;
}
.bar {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin: 0.55rem 0 0.65rem;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--fg);
  transition: width 0.3s;
}
.cat-actions {
  display: flex;
  gap: 0.5rem;
}
.menu-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.6rem;
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
.btn.small {
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
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
.quiz-top-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.quiz-progress {
  color: var(--muted);
  font-size: 0.8125rem;
}
.exam-tag {
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.1rem 0.45rem;
  color: var(--muted);
}
.quiz-q {
  font-size: 1.0625rem;
  line-height: 1.7;
  margin: 1.5rem 0 1rem;
}
.quiz-code {
  margin: 0 0 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--code-bg, rgba(127, 127, 127, 0.08));
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow-x: auto;
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
.option.picked {
  border-color: var(--muted);
}
.option.right {
  border-color: var(--fg);
}
.option.wrong {
  border-color: #c0392b;
  color: #c0392b;
}
.blank-row {
  display: flex;
}
.blank-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  font-size: 0.9375rem;
  font-family: inherit;
}
.blank-input:focus {
  outline: none;
  border-color: var(--muted);
}
.confirm-row {
  margin-top: 1rem;
  min-height: 1rem;
}
.practice-feedback {
  margin-top: 0.25rem;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.7;
}
.practice-feedback.good {
  border-color: var(--fg);
}
.practice-feedback.bad {
  border-color: #c0392b;
}
.verdict {
  margin: 0 0 0.35rem;
  font-weight: 600;
}
.practice-feedback.bad .verdict {
  color: #c0392b;
}
.explain {
  margin: 0;
  color: var(--muted);
}
.exam-dots {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.dot {
  width: 1.7rem;
  height: 1.7rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: none;
  color: var(--muted);
  font-size: 0.75rem;
  cursor: pointer;
}
.dot.done {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--fg);
}
.dot.here {
  border-color: var(--fg);
  color: var(--fg);
}
.dot.done.here {
  color: var(--bg);
}
.quiz-feedback {
  margin-top: 0.75rem;
}
.exam-answered {
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
}
.quiz-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
}
.result-score {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 1.5rem 0;
}
.score-num {
  font-size: 2.5rem;
  font-weight: 700;
}
.score-total {
  color: var(--muted);
  font-size: 1.25rem;
}
.score-label {
  color: var(--muted);
  font-size: 0.8125rem;
  margin-left: 0.75rem;
}
.review {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.9rem 1rem;
  margin-bottom: 0.75rem;
}
.review.bad {
  border-color: #c0392b;
}
.review-q {
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.7;
}
.review-tag {
  font-weight: 700;
}
.review.bad .review-tag {
  color: #c0392b;
}
.review-a {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  line-height: 1.7;
}
.review .quiz-code {
  font-size: 0.75rem;
}
</style>
