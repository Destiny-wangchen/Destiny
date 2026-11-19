// 生成工程制图系列的插图：node tools/dbook/build.js
const fs = require('fs')
const path = require('path')
const { Fig } = require('./lib')
const S = require('./solid')
const { bracket } = require('./model')
const A = require('./figs-a')
const B = require('./figs-b')
const C = require('./figs-c')

const OUT = path.join(__dirname, '..', '..', 'docs', 'dbook', 'figs')
const figs = {}

/* ---------------- 图 1-1：三视图的形成与三条规律 ---------------- */
figs['ch1-01-views'] = () => {
  const f = new Fig(820, 430)
  const sc = 2

  // 轴测图（轴测图不画虚线）
  const iso = S.project(bracket, { d: S.ISO.d, up: S.ISO.up })
  const bb = S.bbox(iso)
  S.draw(f, iso, 90 - ((bb.x0 + bb.x1) / 2) * 1.5, 170 - ((bb.y0 + bb.y1) / 2) * 1.5, 1.5, { hidden: false })
  f.text(90, 330, '立体图（轴测图）', 'tn')

  // 三视图布局：主视图、俯视图（其下）、左视图（其右）
  const ox = 320 // 主视图 / 俯视图左边界
  const oyF = 170 // 主视图、左视图下边界
  const oyT = 340 // 俯视图下边界（物体前面）
  const oxL = 660 // 左视图右边界（物体前面）
  const W = 160 // 80mm
  const D = 100 // 50mm
  S.draw(f, S.project(bracket, S.FRONT), ox, oyF, sc)
  S.draw(f, S.project(bracket, S.TOP), ox, oyT, sc)
  S.draw(f, S.project(bracket, S.LEFT), oxL, oyF, sc)

  // 长对正：主、俯视图之间的竖直辅助线
  f.line(ox, oyF + 8, ox, oyT - 22, 'g0')
  f.line(ox + W, oyF + 8, ox + W, oyT - 22, 'g0')
  // 高平齐：主、左视图之间的水平辅助线
  f.line(ox + W + 8, oyF - 92, oxL - D - 8, oyF - 92, 'g0')
  f.line(ox + W + 8, oyF, oxL - D - 8, oyF, 'g0')
  // 宽相等：俯视图深度 → 45° 线 → 左视图宽度
  const apex = 510 // 45° 线过点 (510, 190)
  f.line(apex - 22, 168, oxL, 190 + (oxL - apex), 'g0')
  f.line(ox + W + 6, oyT - D, apex + (oyT - D - 190), oyT - D, 'g0')
  f.line(apex + (oyT - D - 190), oyT - D, apex + (oyT - D - 190), oyF, 'g0')

  // 视图名
  f.text(ox + W / 2, oyF + 24, '主视图', 'tn')
  f.text(ox + W / 2, oyT + 22, '俯视图', 'tn')
  f.text(oxL - D / 2, oyF + 24, '左视图', 'tn')

  // 三条规律
  f.text(ox + W / 2, oyF + 52, '长对正', 'tn')
  f.text(ox + W + 40, oyF - 100, '高平齐', 'tn')
  f.text(apex + 84, 300, '宽相等', 'tn', 'start')

  return f
}

Object.assign(figs, {
  'ch2-01-true-length': A.figLineTrueLength,
  'ch2-02-third-view': A.figThirdProjection,
  'ch3-01-pyramid-cut': A.figPyramidCut,
  'ch3-02-cylinder-cases': A.figCylinderCases,
  'ch3-03-cone-cases': A.figConeCases,
  'ch3-04-card-question': A.figPyramidCutQuestion,
  'ch4-01-cross-cylinders': B.figCrossCylinders,
  'ch4-02-cross-kinds': B.figCrossKinds,
  'ch5-01-split-method': B.figSplitMethod,
  'ch5-02-card-question': B.figSplitQuestion,
  'ch6-01-section-compare': C.figSectionCompare,
  'ch7-01-dimension': C.figDimension
})

/* ---------------- 输出 ---------------- */
if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true })
  let count = 0
  for (const [name, fn] of Object.entries(figs)) {
    const svg = fn().render()
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg, 'utf8')
    count++
    console.log('wrote', name, (svg.length / 1024).toFixed(1) + 'KB')
  }
  console.log('done:', count)
}

module.exports = { figs, bracket }
