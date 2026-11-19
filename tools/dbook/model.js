// 教学模型：带槽底板 + 前后立板（平面立体，可用多面体引擎精确消隐）
const S = require('./solid')

// 底板：80×50×12，底部中间开 20 宽通槽
const baseProfile = [
  [0, 0], [30, 0], [30, 12], [50, 12], [50, 0], [80, 0], [80, 12], [0, 12]
]
// 立板：贴后侧，顶部中间开 10 宽通槽
const plateProfile = [
  [15, 12], [65, 12], [65, 46], [45, 46], [45, 30], [35, 30], [35, 46], [15, 46]
]

const bracket = S.merge([S.extrude(baseProfile, 0, 50), S.extrude(plateProfile, 36, 50)])

module.exports = { bracket }
