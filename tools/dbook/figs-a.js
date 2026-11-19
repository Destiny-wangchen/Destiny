// 第 2、3 章插图：投影基础与截交线
const { Fig, samples, toPath } = require('./lib')

const D2R = Math.PI / 180

/* ------------------------------------------------------------------ */
/* 图 2-1 直角三角形法求实长与倾角                                     */
/* ------------------------------------------------------------------ */
function figLineTrueLength() {
  const f = new Fig(720, 340)
  const sc = 2 // px/mm
  // 直线 AB：水平投影长 86.6mm，两端高度差 50mm
  const aH = [120, 300]
  const bH = [120 + 86.6 * sc, 300]
  const aV = [aH[0], aH[1] - 100]
  const bV = [bH[0], bH[1] - 200]

  // 投影轴
  f.line(80, 250, 350, 250, 's3')
  f.text(72, 254, 'X', 't', 'end')
  f.text(356, 254, 'O', 't', 'start')

  // V 面投影
  f.line(aV[0], aV[1], bV[0], bV[1], 's0')
  f.pt(aV[0], aV[1], "a′", -12, -6)
  f.pt(bV[0], bV[1], "b′", 10, -6)
  // 投影连线
  f.line(aH[0], aH[1], aV[0], aV[1], 'g0')
  f.line(bH[0], bH[1], bV[0], bV[1], 'g0')

  // H 面投影
  f.line(aH[0], aH[1], bH[0], bH[1], 's0')
  f.pt(aH[0], aH[1], 'a', -12, 14)
  f.pt(bH[0], bH[1], 'b', 10, 14)

  // 直角三角形
  const A0 = [410, 300]
  const B0 = [410 + 86.6 * sc, 300]
  const C0 = [B0[0], B0[1] - 100]
  f.line(A0[0], A0[1], B0[0], B0[1], 's0')
  f.line(B0[0], B0[1], C0[0], C0[1], 's0')
  f.line(C0[0], C0[1], A0[0], A0[1], 's0')
  // 直角符号
  f.line(B0[0] - 12, B0[1], B0[0] - 12, B0[1] - 12, 's1')
  f.line(B0[0] - 12, B0[1] - 12, B0[0], B0[1] - 12, 's1')
  // 角度弧
  f.arc(A0[0], A0[1], 46, 46, 0, 30, 's1')
  f.text(A0[0] + 56, A0[1] - 14, 'α', 't')

  f.text((A0[0] + B0[0]) / 2, A0[1] + 22, '水平投影长 ab', 'tn')
  f.text(B0[0] + 10, (B0[1] + C0[1]) / 2, 'Δz', 't', 'start')
  f.text((A0[0] + C0[0]) / 2 - 34, (A0[1] + C0[1]) / 2 - 12, '实长', 'tn')
  f.text(360, 62, '以水平投影为一直角边、高度差为另一直角边，斜边即实长，斜边与水平边的夹角即 α', 'tn')
  return f
}

/* ------------------------------------------------------------------ */
/* 图 2-2 已知 V、W 投影补画 H 投影                                    */
/* ------------------------------------------------------------------ */
function figThirdProjection() {
  const f = new Fig(720, 440)
  const sc = 2.4
  const A = [0, 0, 10]
  const B = [60, 20, 0]
  const C = [20, 45, 40]
  const ox = 150
  const oy = 220 // 主视图原点（z=0 在 oy 处）
  const oyH = 380 // 俯视图原点（y=0 在 oyH 处）
  const oxL = 610 // 左视图：y=0 在 oxL 处

  const V = (p) => [ox + p[0] * sc, oy - p[2] * sc]
  const H = (p) => [ox + p[0] * sc, oyH - p[1] * sc]
  const W = (p) => [oxL - p[1] * sc, oy - p[2] * sc]

  // 投影轴
  f.line(96, oy, 640, oy, 's3')
  f.line(ox, oy - 96, ox, oyH + 40, 's3')
  f.text(88, oy + 4, 'X', 't', 'end')
  f.text(646, oy + 4, 'Z', 't', 'start')
  f.text(ox - 6, oyH + 52, 'Y', 't', 'end')

  // 45° 辅助线
  f.line(oxL, oyH, oxL - 120, oyH - 120, 'g0')

  // 作图连线（细）
  for (const p of [A, B, C]) {
    const v = V(p)
    const h = H(p)
    const w = W(p)
    f.line(v[0], v[1], h[0], h[1], 'g0')
    f.line(v[0], v[1], w[0], w[1], 'g0')
    // 从俯视图经 45° 线折到左视图
    f.line(h[0], h[1], oxL + (h[1] - oyH), h[1], 'g0')
    f.line(oxL + (h[1] - oyH), h[1], w[0], w[1], 'g0')
  }

  // 已知：V 投影、W 投影
  f.poly([V(A), V(B), V(C)], 's0', true)
  f.poly([W(A), W(B), W(C)], 's0', true)
  // 求得：H 投影（加粗，表示答案）
  f.poly([H(A), H(B), H(C)], 's0', true)

  const nm = [
    ['a', 'a′', 'a″'],
    ['b', 'b′', 'b″'],
    ['c', 'c′', 'c″']
  ]
  const off = [
    [-8, 16],
    [10, 14],
    [-14, -6]
  ]
  const pts = [A, B, C]
  pts.forEach((p, i) => {
    const v = V(p)
    const h = H(p)
    const w = W(p)
    f.pt(v[0], v[1], nm[i][1], off[i][0] * 0.7, -8 + off[i][1] * 0.3)
    f.pt(h[0], h[1], nm[i][0], off[i][0], 14)
    f.pt(w[0], w[1], nm[i][2], 12, 4)
  })

  f.text(ox + 50, oy + 34, '主视图（已知）', 'tn', 'start')
  f.text(ox + 50, oyH + 34, '俯视图（求得）', 'tn', 'start')
  f.text(oxL - 30, oy + 34, '左视图（已知）', 'tn', 'start')
  f.text(oxL - 96, oyH - 96, '45°', 'ts', 'start')
  return f
}

/* ------------------------------------------------------------------ */
/* 图 3-1 四棱锥被正垂面截切                                           */
/* ------------------------------------------------------------------ */
function figPyramidCut() {
  const f = new Fig(760, 490)
  const sc = 2.2
  const ox = 150
  const oy = 226 // 主视图 z=0
  const oyH = 436 // 俯视图 y=0
  const oxL = 630 // 左视图 y=0

  const V = (p) => [ox + p[0] * sc, oy - p[2] * sc]
  const H = (p) => [ox + p[0] * sc, oyH - p[1] * sc]
  const W = (p) => [oxL - p[1] * sc, oy - p[2] * sc]

  const A = [0, 0, 0]
  const B = [60, 0, 0]
  const C = [60, 60, 0]
  const D = [0, 60, 0]
  const S = [30, 30, 50]

  // 截平面与四条棱的交点（正垂面在 V 面投影为直线 z = 20 + 0.25x）
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]
  const tSA = 20 / 42.5
  const tSB = 35 / 57.5
  const P1 = lerp(S, A, tSA)
  const P2 = lerp(S, B, tSB)
  const P3 = lerp(S, C, tSB)
  const P4 = lerp(S, D, tSA)

  // 三视图轮廓（截切后的形体）
  // 主视图
  f.poly([V(A), V(P1), V(P2), V(B)], 's0', true)
  f.line(V(P1)[0], V(P1)[1], V(P2)[0], V(P2)[1], 's0')
  // 俯视图
  f.poly([H(A), H(B), H(C), H(D)], 's0', true)
  f.line(H(A)[0], H(A)[1], H(P1)[0], H(P1)[1], 's0')
  f.line(H(B)[0], H(B)[1], H(P2)[0], H(P2)[1], 's0')
  f.line(H(C)[0], H(C)[1], H(P3)[0], H(P3)[1], 's0')
  f.line(H(D)[0], H(D)[1], H(P4)[0], H(P4)[1], 's0')
  f.poly([H(P1), H(P2), H(P3), H(P4)], 's0', true)
  // 左视图：外形是六边形（A、C 为底，P1~P4 为截口），内部还有两条棱线
  f.poly([W(A), W(C), W(P4), W(P3), W(P2), W(P1)], 's0', true)
  f.line(W(B)[0], W(B)[1], W(P2)[0], W(P2)[1], 's0') // 棱 SB 剩余段
  f.line(W(P1)[0], W(P1)[1], W(P4)[0], W(P4)[1], 's0') // 截口后边

  // 主视图上的截交线标注
  f.pt(V(P1)[0], V(P1)[1], "1′", -16, -4)
  f.pt(V(P2)[0], V(P2)[1], "2′(3′)", 26, -8)
  f.pt(V(P4)[0], V(P4)[1], "4′", -20, 16)
  f.pt(H(P1)[0], H(P1)[1], '1', -8, -6)
  f.pt(H(P2)[0], H(P2)[1], '2', 12, -4)
  f.pt(H(P3)[0], H(P3)[1], '3', 12, 12)
  f.pt(H(P4)[0], H(P4)[1], '4', -10, 14)
  f.pt(W(P2)[0], W(P2)[1], '2″', 10, -4)
  f.pt(W(P3)[0], W(P3)[1], '3″', -12, -4)

  f.text(ox + 66, oy + 26, '主视图', 'tn')
  f.text(ox + 66, oyH + 22, '俯视图', 'tn')
  f.text(oxL - 66, oy + 26, '左视图', 'tn')
  f.text(60, 36, '截平面为正垂面：V 面投影为直线，先求四点，再按投影规律连成四边形', 'tn', 'start')
  return f
}

/* ------------------------------------------------------------------ */
/* 图 3-2 圆柱截交线的三种情况                                         */
/* ------------------------------------------------------------------ */
function figCylinderCases() {
  const f = new Fig(760, 330)
  const panels = [
    { x: 40, label: '① 垂直于轴线', shape: '圆', cut: 'h' },
    { x: 300, label: '② 倾斜于轴线', shape: '椭圆', cut: 'd' },
    { x: 560, label: '③ 平行于轴线', shape: '矩形', cut: 'v' }
  ]
  const r = 24
  const h = 130
  const top = 60
  for (const p of panels) {
    const cx = p.x + 70
    const cy = top + h
    // 主视图形体
    f.line(cx - r, cy, cx - r, top + 20, 's0')
    f.line(cx + r, cy, cx + r, top + 20, 's0')
    f.line(cx - r, cy, cx + r, cy, 's0')
    f.line(cx - r, top + 20, cx + r, top + 20, 's0')
    // 轴线
    f.line(cx, cy + 16, cx, top + 6, 's3')

    if (p.cut === 'h') {
      const y = top + 66
      f.line(cx - r, y, cx + r, y, 's0')
      f.text(cx + r + 10, y - 6, '截平面', 'ts', 'start')
      f.text(cx + r + 10, y + 10, '（垂直于投影面）', 'ts', 'start')
    } else if (p.cut === 'd') {
      f.line(cx - r, top + 90, cx + r, top + 46, 's0')
      f.text(cx + r + 10, top + 52, '截平面倾斜', 'ts', 'start')
    } else {
      f.line(cx - 8, top + 40, cx - 8, cy, 's0')
      f.line(cx + 8, top + 40, cx + 8, cy, 's0')
      f.text(cx + r + 10, top + 80, '截平面平行轴线', 'ts', 'start')
    }

    // 截交线形状
    const sy = 262
    if (p.shape === '圆') f.circle(cx, sy, 22, 's0')
    else if (p.shape === '椭圆') f.ellipse(cx, sy, 32, 18, 's0')
    else f.poly([[cx - 22, sy - 20], [cx + 22, sy - 20], [cx + 22, sy + 20], [cx - 22, sy + 20]], 's0', true)

    f.text(p.x + 70, 40, p.label, 'tn')

    // 名称与引出线
    if (p.shape === '圆') {
      f.text(cx + 32, sy + 4, '圆', 'tb', 'start')
      f.line(cx + 24, sy - 4, cx + 30, sy - 12, 's1')
    } else if (p.shape === '椭圆') {
      f.text(cx + 40, sy + 4, '椭圆', 'tb', 'start')
    } else {
      f.text(cx + 30, sy + 4, '矩形', 'tb', 'start')
    }
    f.text(p.x + 70, 308, '截交线形状：' + p.shape, 'tn')
  }
  return f
}

/* ------------------------------------------------------------------ */
/* 图 3-3 圆锥截交线的五种情况                                         */
/* ------------------------------------------------------------------ */
function figConeCases() {
  const f = new Fig(760, 340)
  const R = 26
  const Hgt = 96
  const apexY = 56
  const baseY = apexY + Hgt

  // 抛物线：顶点在上，开口向下；双曲线：两支，开口向上
  const parabola = (cx, cy, w, hgt, n = 40) =>
    samples((t) => [cx + (t - 1) * w, cy - hgt * (1 - (t - 1) * (t - 1))], 0, 2, n)
  const hyperbola = (cx, cy, w, hgt, n = 40) => {
    const branch = (sgn) =>
      samples((t) => {
        const dx = w * (0.16 + 0.84 * t)
        return [cx + sgn * dx, cy - hgt * Math.sqrt((dx / w) ** 2 + 0.06)]
      }, 0, 1, n / 2)
    return [branch(-1), branch(1)]
  }

  const cases = [
    { x: 20, name: '圆', cut: '⊥ 轴线', cutY: 96, shape: '圆' },
    { x: 170, name: '椭圆', cut: '与所有素线相交', cutY: 78, shape: '椭圆' },
    { x: 320, name: '抛物线', cut: '平行于一条素线', cutY: 74, shape: '抛物线' },
    { x: 470, name: '双曲线', cut: '平行于轴线', cutY: 80, shape: '双曲线' },
    { x: 620, name: '三角形', cut: '过锥顶', cutY: 66, shape: '三角形' }
  ]

  for (const c of cases) {
    const cx = c.x + 60
    // 圆锥轮廓
    f.poly([[cx - R, baseY], [cx, apexY], [cx + R, baseY]], 's0', true)
    f.ellipse(cx, baseY, R, 8, 's1')
    f.line(cx, baseY + 14, cx, apexY - 14, 's3')
    // 截平面在 V 面的投影
    if (c.shape === '圆') f.line(cx - R, c.cutY + 24, cx + R, c.cutY + 24, 's0')
    else if (c.shape === '椭圆') f.line(cx - R - 6, c.cutY - 16, cx + R + 6, c.cutY + 16, 's0')
    else if (c.shape === '抛物线') f.line(cx - 8, baseY + 6, cx + 16, apexY + 10, 's0')
    else if (c.shape === '双曲线') f.line(cx - 20, baseY + 14, cx - 20, apexY + 22, 's0')
    else f.line(cx - R - 6, baseY + 6, cx + 4, apexY + 6, 's0')

    // 结果形状
    const sy = 296
    const scx = cx
    if (c.shape === '圆') f.ellipse(scx, sy, 34, 13, 's0')
    else if (c.shape === '椭圆') f.ellipse(scx, sy, 36, 14, 's0')
    else if (c.shape === '抛物线') f.path(toPath(parabola(scx, sy + 2, 32, 34)), 's0')
    else if (c.shape === '双曲线') {
      const [l, r] = hyperbola(scx, sy + 18, 32, 34)
      f.path(toPath(l), 's0')
      f.path(toPath(r), 's0')
    } else f.poly([[scx - 30, sy + 8], [scx, sy - 22], [scx + 30, sy + 8]], 's0', true)

    f.text(cx, 30, c.name, 'tn')
    f.text(cx, 330, c.cut, 'ts')
  }
  return f
}

/* ------------------------------------------------------------------ */
/* 作图卡题面：只给主视图和左视图，求俯视图                             */
/* ------------------------------------------------------------------ */
function figPyramidCutQuestion() {
  const f = new Fig(700, 330)
  const sc = 2.2
  const ox = 130
  const oy = 240
  const oxL = 560

  const V = (p) => [ox + p[0] * sc, oy - p[2] * sc]
  const W = (p) => [oxL - p[1] * sc, oy - p[2] * sc]

  const A = [0, 0, 0]
  const B = [60, 0, 0]
  const C = [60, 60, 0]
  const D = [0, 60, 0]
  const S = [30, 30, 50]
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]
  const tSA = 20 / 42.5
  const tSB = 35 / 57.5
  const P1 = lerp(S, A, tSA)
  const P2 = lerp(S, B, tSB)
  const P3 = lerp(S, C, tSB)
  const P4 = lerp(S, D, tSA)

  f.poly([V(A), V(P1), V(P2), V(B)], 's0', true)
  f.line(V(P1)[0], V(P1)[1], V(P2)[0], V(P2)[1], 's0')
  f.poly([W(A), W(C), W(P4), W(P3), W(P2), W(P1)], 's0', true)
  f.line(W(B)[0], W(B)[1], W(P2)[0], W(P2)[1], 's0')
  f.line(W(P1)[0], W(P1)[1], W(P4)[0], W(P4)[1], 's0')

  f.pt(V(P1)[0], V(P1)[1], "1′", -16, -4)
  f.pt(V(P2)[0], V(P2)[1], "2′(3′)", 24, -8)
  f.pt(V(P4)[0], V(P4)[1], "4′", -18, 16)
  f.pt(W(P2)[0], W(P2)[1], '2″', 10, -4)
  f.pt(W(P3)[0], W(P3)[1], '3″', -14, -4)

  f.text(ox + 66, oy + 28, '主视图', 'tn')
  f.text(oxL - 66, oy + 28, '左视图', 'tn')
  f.text(60, 40, '四棱锥被正垂面截切，已知主视图和左视图，求俯视图（保留作图过程）', 'tn', 'start')
  return f
}

module.exports = {
  figLineTrueLength,
  figThirdProjection,
  figPyramidCut,
  figPyramidCutQuestion,
  figCylinderCases,
  figConeCases
}
