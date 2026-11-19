# 组装工程制图题库：公开题库（纯文字）+ 两份真题卷的图文题
import json
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
RAW = os.path.join(HERE, 'bank_raw.json')
FIG_SRC = os.path.join(HERE, 'figs')
FIG_DST = os.path.join(ROOT, 'docs', 'public', 'quiz-gt')
OUT = os.path.join(ROOT, 'docs', 'quiz', 'engineering-drawing.json')

RULES = [
    ('截交线与相贯线', ['相贯', '柱-柱', '两圆柱', '柱与柱', '圆柱与圆柱']),
    ('截交线与相贯线', ['截切', '截交', '截平面', '平面切', '切圆柱', '切圆锥', '切圆球', '与圆球相交', '与圆锥相交', '与圆柱相交', '截']),
    ('剖视与断面', ['剖', '断面', '剖面']),
    ('尺寸与标准件', ['尺寸', '标注', '螺纹', '螺距', '导程', '配合', '公差', '粗糙度', '键', '销', '轴承', '齿轮', '紧固件', '倒角', '沉孔', '螺孔', 'M20', 'Tr', 'B40']),
    ('读图与补投影', ['视图', '投影', '重影', '第三角', '三面', '左视图', '主视图', '俯视图', '补画', '读图']),
]

FIG_QS = [
    dict(
        file='mock-01-ab-parallel',
        cat='读图与补投影',
        q='下面四组投影图中，哪一组投影中直线 AB 与 CD 平行？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=0,
        explain='空间两直线平行，其同名投影必平行，且同名投影的长度比相同。只有（1）同时满足 a′b′∥c′d′、ab∥cd。',
        src='2025 工图 C 模拟试卷 第 1 题',
    ),
    dict(
        file='mock-02-third-view',
        cat='读图与补投影',
        q='已知立体的 V 面和 H 面投影，正确的 W 面投影是？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=2,
        explain='高平齐、宽相等逐条对：几级台阶的高度取自 V 面，宽度从 H 面经 45° 线转到 W 面，只有（3）两者都对得上。',
        src='2025 工图 C 模拟试卷 第 2 题',
    ),
    dict(
        file='mock-03-cyl-cross',
        cat='截交线与相贯线',
        q='已知柱—柱相贯的 H 面投影，正确的 V 面投影是？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=2,
        explain='相贯线总是向小圆柱一侧凹，并且上下对称。俯视图里小圆柱水平穿过大圆柱，V 面投影的相贯线应在小圆柱轮廓处向内收，故选（3）。',
        src='2025 工图 C 模拟试卷 第 3 题',
    ),
    dict(
        file='mock-04-section-out',
        cat='剖视图与断面',
        q='图中正确的移出断面图为？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=1,
        explain='移出断面图只画切口本身的形状，不画剖切平面后面的轮廓；剖切位置与投射方向也要标出。只有（2）既没有多画后面的轮廓，也标了投射方向。',
        src='2025 工图 C 模拟试卷 第 4 题',
    ),
    dict(
        file='mock-05-section-view',
        cat='剖视图与断面',
        q='图中正确的剖视图为？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=3,
        explain='剖视图要画出剖面线（同一零件方向、间隔一致），并保留剖切平面后方可见的轮廓，未剖到的内部结构不再画虚线。只有（4）符合。',
        src='2025 工图 C 模拟试卷 第 5 题',
    ),
    dict(
        file='prac-01-point-in-plane',
        cat='读图与补投影',
        q='下列哪组投影中点 K 属于平面？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=0,
        explain='点在平面上，等价于点在平面内的一条直线上。图（1）中 K 的两个投影都落在平面内的辅助线上，另外两组都跑到平面外了。',
        src='工图 C 练习卷 第 1 题',
    ),
    dict(
        file='prac-02-third-view',
        cat='读图与补投影',
        q='已知立体的正面投影和水平投影，正确的侧面投影是？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=2,
        explain='按长对正、高平齐、宽相等逐条核对：外形轮廓与内部圆孔的位置，只有（3）与前两个投影完全对得上。',
        src='工图 C 练习卷 第 2 题',
    ),
    dict(
        file='prac-03-third-view',
        cat='读图与补投影',
        q='已知立体的正面投影和水平投影，选择正确的侧面投影。',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=2,
        explain='回转体在 W 面投影上应有中心线，且宽度与 H 面的圆一致；只有（3）的轮廓与中心线位置正确。',
        src='工图 C 练习卷 第 3 题',
    ),
    dict(
        file='prac-04-section-out',
        cat='剖视图与断面',
        q='图中正确的移出断面图为？',
        options=['（1）', '（2）', '（3）', '（4）'],
        answer=1,
        explain='断面图只画切口形状；剖切平面通过孔时断面轮廓要闭合，孔的位置留空但不画后面的轮廓。只有（2）符合。',
        src='工图 C 练习卷 第 4 题',
    ),
]


def categorize(text):
    for name, keys in RULES:
        if any(k in text for k in keys):
            return name
    return '投影基础'


def main():
    raw = json.load(open(RAW, encoding='utf-8'))
    os.makedirs(FIG_DST, exist_ok=True)

    cats = {}
    order = ['读图与补投影', '截交线与相贯线', '剖视图与断面', '尺寸与标准件', '投影基础']

    n = 0
    for q in raw:
        text = q['q']
        if '以上' in text or len(set(q['options'])) < 4:
            continue
        cat = categorize(text)
        n += 1
        letters = [ord(c) - 65 for c in q['answer']]
        cats.setdefault(cat, []).append(
            {
                'id': f'gt-{n:03d}',
                'type': 'multi' if len(letters) > 1 else 'choice',
                'q': text,
                'options': q['options'],
                'answer': letters if len(letters) > 1 else letters[0],
                'explain': '',
            }
        )

    for fq in FIG_QS:
        src = os.path.join(FIG_SRC, fq['file'] + '.png')
        shutil.copyfile(src, os.path.join(FIG_DST, fq['file'] + '.png'))
        cat = fq['cat']
        cats.setdefault(cat, []).append(
            {
                'id': 'gt-fig-' + fq['file'],
                'type': 'choice',
                'q': fq['q'],
                'image': 'quiz-gt/' + fq['file'] + '.png',
                'options': fq['options'],
                'answer': fq['answer'],
                'explain': fq['explain'],
                'src': fq['src'],
            }
        )

    out = {
        'title': '工程制图 C 刷题',
        'note': '题目整理自公开题库与两份课程真题卷，个别表述可能与教材不同，以课堂和课本为准。',
        'categories': [{'id': f'gt-c{i}', 'name': name, 'questions': cats[name]} for i, name in enumerate(order) if name in cats],
    }
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    total = sum(len(c['questions']) for c in out['categories'])
    print('total', total)
    for c in out['categories']:
        print(f"  {c['name']}: {len(c['questions'])}")


if __name__ == '__main__':
    main()
