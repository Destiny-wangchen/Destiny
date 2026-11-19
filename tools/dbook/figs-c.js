// 第 6、7 章插图：剖视图与尺寸标注
const { Fig } = require('./lib')

/* ------------------------------------------------------------------ */
/* 图 6-1 视图、全剖视图、半剖视图                                      */
/* ------------------------------------------------------------------ */
function figSectionCompare() {
  const f = new Fig(760, 330)
  const sc = 2
  const Ro = 45
  const Ri = 25
  const H2 = 60

  const panel = (ox, title, mode) => {
    const oy = 240
    const x0 = ox
    const x1 = ox + 2 * Ro * sc
    const yTop = oy - H2 * sc
    f.poly([[x0, oy], [x1, oy], [x1, yTop], [x0, yTop]], 's0', true)
    f.line(ox + Ro * sc, oy + 14, ox + Ro * sc, yTop - 14, 's3')

    if (mode === 'view') {
      f.line(ox + (Ro - Ri) * sc, oy, ox + (Ro - Ri) * sc, yTop, 's2')
      f.line(ox + (Ro + Ri) * sc, oy, ox + (Ro + Ri) * sc, yTop, 's2')
    } else if (mode === 'full') {
      f.hatchPoly([[x0, oy], [ox + (Ro - Ri) * sc, oy], [ox + (Ro - Ri) * sc, yTop], [x0, yTop]])
      f.hatchPoly([[ox + (Ro + Ri) * sc, oy], [x1, oy], [x1, yTop], [ox + (Ro + Ri) * sc, yTop]])
      f.line(ox + (Ro - Ri) * sc, oy, ox + (Ro - Ri) * sc, yTop, 's0')
      f.line(ox + (Ro + Ri) * sc, oy, ox + (Ro + Ri) * sc, yTop, 's0')
    } else {
      const cx = ox + Ro * sc
      f.hatchPoly([[x0, oy], [ox + (Ro - Ri) * sc, oy], [ox + (Ro - Ri) * sc, yTop], [x0, yTop]])
      f.line(ox + (Ro - Ri) * sc, oy, ox + (Ro - Ri) * sc, yTop, 's0')
      f.line(cx, oy, cx, yTop, 's3')
    }
    f.text(ox + Ro * sc, oy + 34, title, 'tn')
  }

  panel(50, '视图（画虚线）', 'view')
  panel(280, '全剖视图', 'full')
  panel(510, '半剖视图（左半剖）', 'semi')

  f.text(50, 56, '剖切平面通过轴线：假想剖开后，剖到的实体部分画剖面线，孔的位置留空', 'tn', 'start')
  f.text(50, 78, '半剖以对称中心线为界：一半画剖视、一半画外形，外形一侧不再画虚线', 'tn', 'start')
  return f
}

/* ------------------------------------------------------------------ */
/* 图 7-1 尺寸标注：四要素与常见错误                                    */
/* ------------------------------------------------------------------ */
function figDimension() {
  const f = new Fig(760, 480)
  const sc = 2
  const W2 = 100 * sc
  const H2 = 40 * sc

  // （a）正确
  {
    const ox = 90
    const oy = 270
    f.poly([[ox, oy], [ox + W2, oy], [ox + W2, oy - H2], [ox, oy - H2]], 's0', true)
    for (const cx of [25, 75]) {
      f.circle(ox + cx * sc, oy - 20 * sc, 6 * sc, 's0')
      f.line(ox + cx * sc - 9 * sc, oy - 20 * sc, ox + cx * sc + 9 * sc, oy - 20 * sc, 's3')
      f.line(ox + cx * sc, oy - 29 * sc, ox + cx * sc, oy - 11 * sc, 's3')
    }
    f.dimH(ox, ox + W2, oy + 48, '100', oy)
    f.dimV(oy, oy - H2, ox - 46, '40', ox)
    f.dimH(ox + 25 * sc, ox + 75 * sc, oy + 24, '50', oy + 4)
    f.leader(ox + 25 * sc + 4, oy - 20 * sc - 4, ox + 60, oy - H2 - 34, '2×φ12', 'start')

    f.text(ox + W2 / 2, oy + 78, '（a）正确：四要素齐全', 'tn')
    f.text(60, 372, '① 尺寸界线从轮廓、轴线引出，略超出尺寸线', 'tn', 'start')
    f.text(60, 398, '② 尺寸线与所注线段平行，两端画箭头', 'tn', 'start')
    f.text(60, 424, '③ 数字写在尺寸线上方中部，字头向上（竖直尺寸字头朝左）', 'tn', 'start')
  }

  // （b）错误
  {
    const ox = 470
    const oy = 270
    f.poly([[ox, oy], [ox + W2, oy], [ox + W2, oy - H2], [ox, oy - H2]], 's0', true)
    // 错误 1：拿顶边当尺寸线
    f.text(ox + W2 / 2, oy - H2 - 10, '100', 'tb')
    f.text(ox + W2 / 2, oy - H2 - 30, '✗ 用轮廓线当尺寸线', 'ts')
    // 错误 2：尺寸线从数字中间穿过
    f.line(ox - 10, oy + 46, ox + W2 + 10, oy + 46, 's1')
    f.text(ox + W2 / 2, oy + 50, '100', 'tb')
    f.text(ox + W2 / 2, oy + 70, '✗ 尺寸线穿过数字', 'ts')
    // 错误 3：尺寸界线画成斜线
    f.line(ox - 30, oy + 6, ox - 56, oy - H2 - 6, 's1')
    f.line(ox - 30, oy - H2 - 6, ox - 56, oy - H2 - 6, 's1')
    f.text(ox - 44, oy - H2 / 2 + 4, '40', 'tb', 'end')
    f.text(ox - 4, oy - H2 - 24, '✗ 尺寸界线倾斜', 'ts', 'end')

    f.text(ox + W2 / 2, oy + 116, '（b）错误：随手画线当尺寸', 'tn')
    f.text(470, 424, '错法还有：尺寸线互相交叉、同一尺寸重复标注、尺寸数字与轮廓线相交', 'tn', 'start')
  }
  return f
}

module.exports = { figSectionCompare, figDimension }
