// 简单多面体引擎：把 (x,z) 平面轮廓沿 y 方向拉伸成体，再投影成三视图/轴测图
// 只用于教学模型（平面立体），圆柱面一律走 2D 解析绘制，避免多边形化带来的锯齿
const { Fig, r2 } = require('./lib')

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const norm = (a) => {
  const l = Math.hypot(...a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

/** 轮廓 [(x,z)...] 沿 y 从 y0 拉到 y1 */
function extrude(profile, y0, y1) {
  const faces = []
  const n = profile.length
  // 前端盖（y0）法向 -y；后端盖（y1）法向 +y
  faces.push(profile.map((p) => [p[0], y0, p[1]]).reverse())
  faces.push(profile.map((p) => [p[0], y1, p[1]]))
  for (let i = 0; i < n; i++) {
    const a = profile[i]
    const b = profile[(i + 1) % n]
    faces.push([
      [a[0], y0, a[1]],
      [b[0], y0, b[1]],
      [b[0], y1, b[1]],
      [a[0], y1, a[1]]
    ])
  }
  return { faces }
}

/** 合并多个体，返回去重后的边（面顺序无所谓，遮挡用射线求交） */
function merge(solids) {
  return { faces: solids.flatMap((s) => s.faces) }
}

function faceVerts(f) {
  return f
}

/** 建立投影基：d 为指向观察者的方向 */
function basis(d, up) {
  const dv = norm(d)
  const r = norm(cross(up, dv))
  const u = norm(cross(dv, r))
  return { d: dv, r, u }
}

/** 点是否在三维面内（先把点投到面所在平面） */
function pointInFace(p, face, N) {
  const o = face[0]
  const e1 = norm(sub(face[1], o))
  const e2 = norm(cross(N, e1))
  const rel = sub(p, o)
  const x = dot(rel, e1)
  const y = dot(rel, e2)
  let inside = false
  const pts = face.map((v) => [dot(sub(v, o), e1), dot(sub(v, o), e2)])
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function faceNormal(face) {
  const N = cross(sub(face[1], face[0]), sub(face[2], face[0]))
  return norm(N)
}

/** 遮挡判断：从 q 沿 -d（朝观察者）走，是否先撞到别的面 */
function occluded(q, d, faces, skip) {
  for (let i = 0; i < faces.length; i++) {
    if (skip.has(faces[i])) continue
    const f = faces[i]
    const N = faceNormal(f)
    const dn = dot(d, N)
    if (Math.abs(dn) < 1e-9) continue
    const t = dot(sub(f[0], q), N) / dn
    if (t <= 1e-4) continue
    const hit = [q[0] + d[0] * t, q[1] + d[1] * t, q[2] + d[2] * t]
    if (pointInFace(hit, f, N)) return true
  }
  return false
}

/** 收集所有边，去重（同一条边被两个面共享） */
function edgesOf(solid) {
  const map = new Map()
  const key = (a, b) => {
    const s1 = a.map(r2).join(',')
    const s2 = b.map(r2).join(',')
    return s1 < s2 ? s1 + '|' + s2 : s2 + '|' + s1
  }
  for (const f of solid.faces) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i]
      const b = f[(i + 1) % f.length]
      const k = key(a, b)
      if (!map.has(k)) map.set(k, { a, b, faces: new Set([f]) })
      else map.get(k).faces.add(f)
    }
  }
  return [...map.values()]
}

/**
 * 投影并做隐藏线消隐
 * 返回 { vis:[[p1,p2]...], hid:[[p1,p2]...], project(p)->[x,y] }
 */
function project(solid, opts) {
  const { d, up = [0, 0, 1] } = opts
  const B = basis(d, up)
  const pj = (p) => [dot(p, B.r), -dot(p, B.u)]
  const faces = solid.faces
  const edges = edgesOf(solid)
  const vis = []
  const hid = []
  for (const e of edges) {
    const L = Math.hypot(...sub(e.b, e.a))
    const n = Math.max(2, Math.ceil(L / 2.5))
    const flags = []
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const q = [
        e.a[0] + (e.b[0] - e.a[0]) * t,
        e.a[1] + (e.b[1] - e.a[1]) * t,
        e.a[2] + (e.b[2] - e.a[2]) * t
      ]
      flags.push(!occluded(q, B.d, faces, e.faces))
    }
    // 合并同状态区段
    let start = 0
    for (let i = 1; i <= n; i++) {
      if (i === n || flags[i] !== flags[start]) {
        const t0 = start / n
        const t1 = i / n
        const p0 = [
          e.a[0] + (e.b[0] - e.a[0]) * t0,
          e.a[1] + (e.b[1] - e.a[1]) * t0,
          e.a[2] + (e.b[2] - e.a[2]) * t0
        ]
        const p1 = [
          e.a[0] + (e.b[0] - e.a[0]) * t1,
          e.a[1] + (e.b[1] - e.a[1]) * t1,
          e.a[2] + (e.b[2] - e.a[2]) * t1
        ]
        ;(flags[start] ? vis : hid).push([pj(p0), pj(p1)])
        start = i
      }
    }
  }
  return { vis, hid, project: pj }
}

/** 把投影结果画到 Fig 上，scale 为像素/毫米 */
function draw(fig, proj, ox, oy, scale, opt = {}) {
  const map = (p) => [ox + p[0] * scale, oy + p[1] * scale]
  if (opt.hidden !== false) {
    for (const [a, b] of proj.hid) {
      const p = map(a)
      const q = map(b)
      fig.line(p[0], p[1], q[0], q[1], 's2')
    }
  }
  for (const [a, b] of proj.vis) {
    const p = map(a)
    const q = map(b)
    fig.line(p[0], p[1], q[0], q[1], opt.class || 's0')
  }
  return map
}

const FRONT = { d: [0, -1, 0], up: [0, 0, 1] }
const TOP = { d: [0, 0, 1], up: [0, 1, 0] }
const LEFT = { d: [-1, 0, 0], up: [0, 0, 1] }
const ISO = { d: [1, 1, 1], up: [0, 0, 1] }

/** 投影后的包围盒 */
function bbox(proj) {
  let x0 = 1e9
  let y0 = 1e9
  let x1 = -1e9
  let y1 = -1e9
  for (const seg of [...proj.vis, ...proj.hid]) {
    for (const p of seg) {
      x0 = Math.min(x0, p[0])
      y0 = Math.min(y0, p[1])
      x1 = Math.max(x1, p[0])
      y1 = Math.max(y1, p[1])
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }
}

module.exports = { extrude, merge, project, draw, bbox, FRONT, TOP, LEFT, ISO, Fig }
