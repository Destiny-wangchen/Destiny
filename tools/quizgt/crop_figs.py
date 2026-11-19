# 把答案 PPT 里的题目图裁成单题、去白边、统一宽度，并拼一张检查用总览图
import os

from PIL import Image, ImageChops, ImageDraw

RAW = os.path.join(os.path.dirname(__file__), 'raw', 'ans')
OUT = os.path.join(os.path.dirname(__file__), 'figs')
os.makedirs(OUT, exist_ok=True)

# (源文件, 裁剪框, 输出名)
JOBS = [
    ('mock-s01-00-574x211.jpg', (0, 0, 574, 211), 'mock-01-ab-parallel'),
    ('mock-s02-00-576x423.jpg', (0, 0, 576, 178), 'mock-02-third-view'),
    ('mock-s02-00-576x423.jpg', (0, 200, 576, 423), 'mock-03-cyl-cross'),
    ('mock-s03-00-1147x466.png', (0, 12, 1147, 466), 'mock-04-section-out'),
    ('mock-s04-00-1005x396.png', (0, 0, 1005, 396), 'mock-05-section-view'),
    ('prac-s01-00-1017x772.png', (0, 0, 1017, 425), 'prac-01-point-in-plane'),
    ('prac-s01-00-1017x772.png', (0, 450, 1017, 772), 'prac-02-third-view'),
    ('prac-s02-00-996x673.png', (0, 0, 996, 330), 'prac-03-third-view'),
    ('prac-s02-00-996x673.png', (0, 365, 996, 673), 'prac-04-section-out'),
]

MAXW = 980


def trim(im):
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im.convert('RGB'), bg)
    box = diff.getbbox()
    if box:
        pad = 8
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
        im = im.crop(box)
    return im


def main():
    outs = []
    for src, box, name in JOBS:
        im = Image.open(os.path.join(RAW, src)).convert('RGB')
        im = im.crop(box)
        im = trim(im)
        if im.width > MAXW:
            im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
        path = os.path.join(OUT, name + '.png')
        im.save(path, optimize=True)
        outs.append((name, im))
        print(name, im.size, f'{os.path.getsize(path) // 1024}KB')

    # 检查用总览
    cols, cell_w = 3, 460
    rows = (len(outs) + cols - 1) // cols
    cell_h = 300
    sheet = Image.new('RGB', (cols * cell_w, rows * cell_h), (245, 245, 245))
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(outs):
        x, y = (i % cols) * cell_w, (i // cols) * cell_h
        scale = min((cell_w - 20) / im.width, (cell_h - 40) / im.height)
        t = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        sheet.paste(t, (x + 10, y + 26))
        draw.text((x + 10, y + 6), f'{i + 1}. {name}', fill=(0, 0, 0))
    sheet.save(os.path.join(OUT, '_sheet.png'))
    print('sheet', sheet.size)


if __name__ == '__main__':
    main()
