import { ref } from 'vue'

/**
 * 十朵小花密码锁的共享状态。
 * 密码 20071210：按顺序点击对应数字的花朵，点错立即清零（严格模式）。
 * 解锁状态仅保存在 sessionStorage —— 关闭标签页即恢复锁定。
 */

const KEY = 'garden-unlocked'
const CODE = [2, 0, 0, 7, 1, 2, 1, 0]

function initialUnlocked() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** 已按对的数字序列（用于逐朵点亮花朵） */
const typed = ref<number[]>([])
/** 是否已解锁（整站共享） */
const unlocked = ref(initialUnlocked())

/** 返回：'progress' 前进 | 'wrong' 点错清零 | 'done' 解锁成功 */
function press(digit: number): 'progress' | 'wrong' | 'done' {
  if (unlocked.value) return 'done'
  if (digit === CODE[typed.value.length]) {
    typed.value = [...typed.value, digit]
    if (typed.value.length >= CODE.length) {
      unlocked.value = true
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* ignore */
      }
      return 'done'
    }
    return 'progress'
  }
  // 严格模式：点错清零；若点的恰好是密码第一位，则从第一位重新开始
  typed.value = digit === CODE[0] ? [digit] : []
  return 'wrong'
}

/** 重新上锁 */
function lock() {
  unlocked.value = false
  typed.value = []
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function useGardenSecret() {
  return { typed, unlocked, press, lock }
}
