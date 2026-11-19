// 第 4、5 章插图：相贯线与读图
const { Fig, samples, toPath } = require('./lib')
const S = require('./solid')

/** 两圆柱正交（大柱轴线竖直、小柱轴线沿 x）相贯线的前半支 */
function crossPath(V, R, r, z0, n = 40) {
  const up = samples((u) => {
    const y = -r * u
    return V(Math.sqrt(R * R - y * y), z0 + Math.sqrt(r * r - y * y))
  }, 0, 1, n)
  const low = samples((u) => {
    const y = -r * (1 - u)
    return V(Math.sqrt(R * R - y * y), z0 - Math.sqrt(r * r - y * y))
  }, 0, 1, n)
  return toPath(up) + ' ' + toPath(low).replace(/^M/, 'L')
}

/* ------------------------------------------------------------------ */
/* 图 4-1 两圆柱正交的相贯线                                           */
/* ------------------------------------------------------------------ */
function figCrossCylinders() {
  const f = new Fig(720, 560)
  const sc = 2
  const R = 30
  const r = 18
  const z0 = 40
  const H2 = 80
  const ox = 150
  const oyF = 280
  const oyT = 440

  const V = (x, z) => [ox + x * sc, oyF - z * sc]
  const T = (x, y) => [ox + x * sc, oyT - y * sc]

  // 主视图
  f.poly([V(-R, 0), V(R, 0), V(R, H2), V(-R, H2)], 's0', true)
  f.line(V(R, z0 + r)[0], V(R, z0 + r)[1], V(85, z0 + r)[0], V(85, z0 + r)[1], 's0')
  f.line(V(R, z0 - r)[0], V(R, z0 - r)[1], V(85, z0 - r)[0], V(85, z0 - r)[1], 's0')
  f.line(V(85, z0 - r)[0], V(85, z0 - r)[1], V(85, z0 + r)[0], V(85, z0 + r)[1], 's0')
  f.line(V(-R - 10, z0)[0], V(-R - 10, z0)[1], V(90, z0)[0], V(90, z0)[1], 's3')
  f.line(V(0, -6)[0], V(0, -6)[1], V(0, H2 + 6)[0], V(0, H2 + 6)[1], 's3')
  f.path(crossPath(V, R, r, z0), 's0')

  f.text(ox + 4, oyF + 26, '主视图', 'tn')

  // 俯视图
  f.circle(T(0, 0)[0], T(0, 0)[1], R * sc, 's0')
  const xa = Math.sqrt(R * R - r * r)
  f.line(T(xa, -r)[0], T(xa, -r)[1], T(85, -r)[0], T(85, -r)[1], 's0')
  f.line(T(xa, r)[0], T(xa, r)[1], T(85, r)[0], T(85, r)[1], 's0')
  f.line(T(85, -r)[0], T(85, -r)[1], T(85, r)[0], T(85, r)[1], 's0')
  f.arc(T(0, 0)[0], T(0, 0)[1], R * sc, R * sc, -36.9, 36.9, 's0')
  f.line(T(0, -R - 8)[0], T(0, -R - 8)[1], T(0, R + 8)[0], T(0, R + 8)[1], 's3')
  f.line(T(-R - 8, 0)[0], T(-R - 8, 0)[1], T(90, 0)[0], T(90, 0)[1], 's3')
  f.text(ox + 4, oyT + R * sc + 24, '俯视图', 'tn')

  // 说明与引出线
  f.text(380, 44, '相贯线总是向小圆柱一侧凹进去', 'tn', 'start')
  f.text(380, 68, '“项链”戴在小头上', 'tn', 'start')
  const mid = V(24.2, z0)
  f.line(mid[0] + 2, mid[1], 372, 150, 's1')
  f.text(378, 154, '相贯线', 'ts', 'start')
  f.text(380, 110, '俯视图中相贯线落在', 'ts', 'start')
  f.text(380, 128, '大圆柱的圆上，不必另画', 'ts', 'start')
  return f
}

/* ------------------------------------------------------------------ */
/* 图 4-2 三种相贯情形                                                 */
/* ------------------------------------------------------------------ */
function figCrossKinds() {
  const f = new Fig(760, 320)
  const sc = 2
  const z0 = 30
  const panels = [
    { ox: 50, R: 22, r: 22, dashed: false, title: '① 两外表面，直径相等', note: '相贯线投影为直线' },
    { ox: 300, R: 24, r: 11, dashed: false, title: '② 外表面与内表面', note: '孔口处为虚线圆弧' },
    { ox: 550, R: 24, r: 11, dashed: true, title: '③ 两内表面（孔与孔）', note: '画法与①相同，全部虚线' }
  ]
  for (const p of panels) {
    const oy = 210
    const V = (x, z) => [p.ox + 26 * sc + x * sc, oy - z * sc]
    // 大圆柱
    f.poly([V(-p.R, -10), V(p.R, -10), V(p.R, 46), V(-p.R, 46)], 's0', true)
    f.line(V(0, -18)[0], V(0, -18)[1], V(0, 54)[0], V(0, 54)[1], 's3')
    f.line(V(-p.R - 8, z0)[0], V(-p.R - 8, z0)[1], V(0, z0)[0], V(0, z0)[1], 's3')
    // 小圆柱
    f.line(V(p.R, z0 + p.r)[0], V(p.R, z0 + p.r)[1], V(p.R + 22, z0 + p.r)[0], V(p.R + 22, z0 + p.r)[1], p.dashed ? 's2' : 's0')
    f.line(V(p.R, z0 - p.r)[0], V(p.R, z0 - p.r)[1], V(p.R + 22, z0 - p.r)[0], V(p.R + 22, z0 - p.r)[1], p.dashed ? 's2' : 's0')
    // 相贯线
    const curve = crossPath(V, p.R, p.r, z0, 30)
    f.path(curve, p.dashed ? 's2' : 's0')
    if (p.R === p.r) {
      // 等径：补出另一半直线
      f.line(V(p.R, z0 + p.r)[0], V(p.R, z0 + p.r)[1], V(-p.R, z0 - p.r)[0], V(-p.R, z0 - p.r)[1], 's0')
      f.line(V(p.R, z0 - p.r)[0], V(p.R, z0 - p.r)[1], V(-p.R, z0 + p.r)[0], V(-p.R, z0 + p.r)[1], 's0')
    }
    f.text(p.ox + 26, 34, p.title, 'tn', 'start')
    f.text(p.ox + 26, 58, p.note, 'ts', 'start')
  }
  return f
}

/* ------------------------------------------------------------------ */
/* 图 5-1 分割法补画左视图                                             */
/* ------------------------------------------------------------------ */
function figSplitMethod() {
  const { bracket } = require('./model')
  const f = new Fig(760, 500)
  const sc = 2
  const ox = 170
  const oyF = 210
  const oyT = 430
  const oxL = 640

  S.draw(f, S.project(bracket, S.FRONT), ox, oyF, sc)
  S.draw(f, S.project(bracket, S.TOP), ox, oyT, sc)
  S.draw(f, S.project(bracket, S.LEFT), oxL, oyF, sc, { class: 's1' })

  // 主视图分框
  for (const [t, x, z] of [['①', 15, 6], ['②', 65, 6], ['③', 25, 34], ['④', 55, 34]]) {
    f.text(ox + x * sc, oyF - z * sc, t, 'tn')
  }
  // 俯视图对应框
  for (const [t, x, y] of [['①', 10, 12], ['②', 70, 12], ['③', 25, 42], ['④', 55, 42]]) {
    f.text(ox + x * sc, oyT - y * sc, t, 'tn')
  }
  // 长对正辅助线
  f.line(ox, oyF + 8, ox, oyT - 110, 'g0')
  f.line(ox + 80 * sc, oyF + 8, ox + 80 * sc, oyT - 110, 'g0')

  f.text(ox, oyF + 40, '主视图（先分框）', 'tn', 'start')
  f.text(ox, oyT + 26, '俯视图（对出投影）', 'tn', 'start')
  f.text(oxL - 100, oyF + 40, '左视图（补画结果）', 'tn', 'start')
  f.text(60, 476, '① ② 是底板的左右两段，③ ④ 是立板被开槽后剩下的两个“爪”', 'tn', 'start')
  return f
}

/* ------------------------------------------------------------------ */
/* 作图卡题面：支座的俯视图（只给主、左视图）                           */
/* ------------------------------------------------------------------ */
function figSplitQuestion() {
  const { bracket } = require('./model')
  const f = new Fig(700, 280)
  const sc = 2
  const ox = 150
  const oy = 215
  const oxL = 560

  S.draw(f, S.project(bracket, S.FRONT), ox, oy, sc)
  S.draw(f, S.project(bracket, S.LEFT), oxL, oy, sc)

  f.text(ox + 80, oy + 28, '主视图', 'tn')
  f.text(oxL - 60, oy + 28, '左视图', 'tn')
  f.text(60, 40, '已知支座的主视图和左视图，画出俯视图（包括虚线）', 'tn', 'start')
  return f
}

module.exports = { figCrossCylinders, figCrossKinds, figSplitMethod, figSplitQuestion }
