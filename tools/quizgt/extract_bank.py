# 从「工程制图—考试题库及答案.pdf」抽取选择题（含 A-E 五选项的多选题）
import json
import random
import re
import sys

from pypdf import PdfReader

SRC = r'D:\新下载文件\openshare-selection\工程制图—考试题库及答案.pdf'
OUT = r'c:\Users\Bruce\CodeBuddy\20261107174057\tools\quizgt\bank_raw.json'

# 真的需要配图才能作答的题（题库里的图是整页截图，切不出来）
NEED_FIG = ['下图', '上图', '如图', '所示', '图示', '四组', '该图', '下面装配图', '图中正确', '图中哪']


def main():
    reader = PdfReader(SRC)
    lines = []
    for page in reader.pages:
        for ln in (page.extract_text() or '').split('\n'):
            ln = ln.strip()
            if ln:
                lines.append(ln)

    questions = []
    buf = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln == '收藏':
            q_text = ''.join(buf).strip()
            buf = []
            opts, j = [], i + 1
            while j < len(lines) and len(opts) < 5:
                m = re.match(r'^([A-E])[.、]\s*(.*)$', lines[j])
                if m:
                    body = m.group(2).strip()
                    if not body and j + 1 < len(lines) and not re.match(r'^[A-E][.、]', lines[j + 1]) and not lines[j + 1].startswith('回答'):
                        body = lines[j + 1].strip()
                        j += 1
                    opts.append(body)
                elif lines[j].startswith('回答'):
                    break
                j += 1
            ans, k = None, j
            while k < len(lines) and k < j + 3:
                m = re.search(r'正确答案[：:]\s*([A-E](?:\s*[A-E])*)', lines[k])
                if m:
                    ans = re.sub(r'\s+', '', m.group(1))
                    break
                k += 1
            if q_text and 4 <= len(opts) <= 5 and ans and all(opts):
                questions.append({'q': q_text, 'options': opts, 'answer': ans})
            i = k + 1
            continue
        if not ln.startswith('回答'):
            buf.append(ln)
        i += 1

    seen, uniq = set(), []
    for q in questions:
        key = re.sub(r'\s+', '', q['q'])[:30]
        if key in seen:
            continue
        seen.add(key)
        text = q['q']
        if len(text) < 5 or any(k in text for k in NEED_FIG):
            continue
        if len(set(q['options'])) < len(q['options']):
            continue
        uniq.append(q)

    json.dump(uniq, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    multi = [q for q in uniq if len(q['answer']) > 1]
    print('kept:', len(uniq), 'multi:', len(multi))
    random.seed(7)
    for q in random.sample(uniq, 12):
        print(f"  {q['answer']:<5}{'[多]' if len(q['answer']) > 1 else '    '} {q['q'][:44]}")


if __name__ == '__main__':
    sys.exit(main())
