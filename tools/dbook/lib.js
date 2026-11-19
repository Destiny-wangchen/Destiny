// 工程制图插图 SVG 生成库
// 约定：坐标单位为浅像素，线型严格按国标区分——粗实线/细实线/细虚线/细点划线/作图辅助线
// 说明：所有图形输出为独立 svg 文件，由 build.js 落盘到 docs/dbook/figs/

const INK = '#141414'
const AUX = '#9a9a9a'

const STYLE = `
.s0{fill:none;stroke:${INK};stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.s1{fill:none;stroke:${INK};stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}
.s2{fill:none;stroke:${INK};stroke-width:1.15;stroke-dasharray:8 4.5;stroke-linecap:butt}
.s3{fill:none;stroke:${INK};stroke-width:1.05;stroke-dasharray:16 3 3 3;stroke-linecap:butt}
.g0{fill:none;stroke:${AUX};stroke-width:.95;stroke-dasharray:5 4}
.g1{fill:none;stroke:${AUX};stroke-width:.95}
.ht{fill:url(#hatch);stroke:${INK};stroke-width:1.15}
.t{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:21px;fill:${INK}}
.tb{font-family:Georgia,'Times New Roman',serif;font-size:19px;fill:${INK}}
.tn{font-family:'Microsoft YaHei','PingFang SC',sans-serif;font-size:15.5px;fill:${INK}}
.ts{font-family:'Microsoft YaHei','PingFang SC',sans-serif;font-size:13.5px;fill:${INK}}
`

const DEFS = `
<defs>
<style>${STYLE}</style>
<marker id="ar" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
  <path d="M0,1.4 L10,5 L0,8.6 z" fill="${INK}"/>
</marker>
<pattern id="hatch" width="5.2" height="5.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="5.2" stroke="${INK}" stroke-width="0.85"/>
</pattern>
</defs>`

const r2 = (v) => Math.round(v * 100) / 100

class Fig {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.o = []
  }

  raw(s) {
    this.o.push(s)
    return this
  }

  line(x1, y1, x2, y2, cls = 's0') {
    return this.raw(
      `<line class="${cls}" x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}"/>`
    )
  }

  dashV(x, y1, y2, cls = 's2') {
    return this.line(x, y1, x, y2, cls)
  }

  poly(pts, cls = 's0', close = false) {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])},${r2(p[1])}`).join(' ') + (close ? ' Z' : '')
    return this.raw(`<path class="${cls}" d="${d}"/>`)
  }

  path(d, cls = 's0', extra = '') {
    return this.raw(`<path class="${cls}" d="${d}"${extra ? ' ' + extra : ''}/>`)
  }

  circle(cx, cy, r, cls = 's0') {
    return this.raw(`<circle class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"/>`)
  }

  /** 椭圆弧：a 起角，b 终角（度，逆时针为正，屏幕 y 向下时按数学方向换算） */
  arc(cx, cy, rx, ry, a1, a2, cls = 's0', rot = 0) {
    const p = (deg) => [cx + rx * Math.cos((deg * Math.PI) / 180), cy - ry * Math.sin((deg * Math.PI) / 180)]
    const large = Math.abs(a2 - a1) > 180 ? 1 : 0
    const sweep = a2 > a1 ? 0 : 1
    const s = p(a1)
    const e = p(a2)
    const t = rot ? ` transform="rotate(${rot} ${r2(cx)} ${r2(cy)})"` : ''
    return this.raw(
      `<path class="${cls}"${t} d="M${r2(s[0])},${r2(s[1])} A${r2(rx)},${r2(ry)} 0 ${large} ${sweep} ${r2(e[0])},${r2(e[1])}"/>`
    )
  }

  /** 圆/椭圆整圈，圆用 circle */
  ellipse(cx, cy, rx, ry, cls = 's0') {
    if (Math.abs(rx - ry) < 0.01) return this.circle(cx, cy, rx, cls)
    return this.raw(
      `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"/>`
    )
  }

  text(x, y, s, cls = 't', anchor = 'middle') {
    return this.raw(
      `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}">${esc(s)}</text>`
    )
  }

  /** 点标注：点在 (x,y)，文字在 (x+dx,y+dy)，端点带引线 */
  pt(x, y, s, dx = 0, dy = -8, cls = 't') {
    this.circle(x, y, 1.9, 's1')
    if (dx || dy) this.line(x, y, x + dx * 0.75, y + dy * 0.75, 's1')
    return this.text(x + dx, y + dy, s, cls)
  }

  /** 实心小圆点（作交点用） */
  dot(x, y, rr = 2.4) {
    return this.raw(`<circle cx="${r2(x)}" cy="${r2(y)}" r="${rr}" fill="${INK}"/>`)
  }

  /** 带箭头的直线（尺寸线） */
  arrowLine(x1, y1, x2, y2, cls = 's1') {
    return this.raw(
      `<line class="${cls}" x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" marker-start="url(#ar)" marker-end="url(#ar)"/>`
    )
  }

  hatchPoly(pts) {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])},${r2(p[1])}`).join(' ') + ' Z'
    return this.raw(`<path class="ht" d="${d}"/>`)
  }

  /** 水平尺寸：几何点在 (x1,y),(x2,y)，尺寸线画在 y 处 */
  dimH(x1, x2, y, label, fromY, opts = {}) {
    const gap = opts.gap ?? 6
    const ext = opts.ext ?? 8
    const a = Math.min(x1, x2)
    const b = Math.max(x1, x2)
    if (fromY !== undefined) {
      this.line(a, fromY + (fromY < y ? gap : -gap), a, y + (y < fromY ? -ext : ext), 's1')
      this.line(b, fromY + (fromY < y ? gap : -gap), b, y + (y < fromY ? -ext : ext), 's1')
    }
    const width = b - a
    if (width >= 30) this.arrowLine(a, y, b, y, 's1')
    else {
      this.line(a, y, b, y, 's1')
      this.raw(
        `<line class="s1" x1="${r2(a - 14)}" y1="${r2(y)}" x2="${r2(a)}" y2="${r2(y)}" marker-start="url(#ar)"/>`
      )
      this.raw(
        `<line class="s1" x1="${r2(b)}" y1="${r2(y)}" x2="${r2(b + 14)}" y2="${r2(y)}" marker-end="url(#ar)"/>`
      )
    }
    const ty = opts.below ? y + 14 : y - 5
    return this.text((a + b) / 2, ty, label, 'tb')
  }

  /** 竖直尺寸 */
  dimV(y1, y2, x, label, fromX, opts = {}) {
    const gap = opts.gap ?? 6
    const ext = opts.ext ?? 8
    const a = Math.min(y1, y2)
    const b = Math.max(y1, y2)
    if (fromX !== undefined) {
      this.line(fromX + (fromX < x ? gap : -gap), a, x + (x < fromX ? -ext : ext), a, 's1')
      this.line(fromX + (fromX < x ? gap : -gap), b, x + (x < fromX ? -ext : ext), b, 's1')
    }
    const h = b - a
    if (h >= 30) this.arrowLine(x, a, x, b, 's1')
    else {
      this.line(x, a, x, b, 's1')
      this.raw(`<line class="s1" x1="${r2(x)}" y1="${r2(a - 14)}" x2="${r2(x)}" y2="${r2(a)}" marker-start="url(#ar)"/>`)
      this.raw(`<line class="s1" x1="${r2(x)}" y1="${r2(b)}" x2="${r2(x)}" y2="${r2(b + 14)}" marker-end="url(#ar)"/>`)
    }
    const tx = opts.left ? x - 5 : x + 5
    return this.raw(
      `<text class="tb" x="${r2(tx)}" y="${r2((a + b) / 2)}" text-anchor="${opts.left ? 'end' : 'start'}" ${opts.left ? '' : ''}>${esc(label)}</text>`
    )
  }

  /** 引线标注：从 (x1,y1) 折到 (x2,y2) 再横一小段 */
  leader(x1, y1, x2, y2, label, anchor = 'start') {
    this.dot(x1, y1, 2)
    this.line(x1, y1, x2, y2, 's1')
    const tail = anchor === 'start' ? 8 : -8
    this.line(x2, y2, x2 + tail, y2, 's1')
    return this.text(x2 + tail + (anchor === 'start' ? 2 : -2), y2 + 4, label, 'tb', anchor)
  }

  render() {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" ` +
      `viewBox="0 0 ${this.w} ${this.h}" role="img">${DEFS}${this.o.join('')}</svg>`
    )
  }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 依次取 n+1 个采样点 */
function samples(fn, t0, t1, n) {
  const out = []
  for (let i = 0; i <= n; i++) out.push(fn(t0 + ((t1 - t0) * i) / n))
  return out
}

/** 采样点转 path */
function toPath(pts, close = false) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])},${r2(p[1])}`).join(' ') + (close ? ' Z' : '')
}

/** 圆角矩形轮廓（用于断面、剖视示意） */
function rrectPts(x, y, w, h, r) {
  return [
    [x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r],
    [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]
  ]
}

module.exports = { Fig, esc, samples, toPath, rrectPts, r2, INK, AUX }
