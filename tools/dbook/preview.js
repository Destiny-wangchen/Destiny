// 把 docs/dbook/figs 下的 SVG 逐个渲染成 PNG，便于检查
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const dir = path.join(__dirname, '..', '..', 'docs', 'dbook', 'figs')
const only = process.argv[2]

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
  if (only && !f.includes(only)) continue
  const svg = fs.readFileSync(path.join(dir, f), 'utf8')
  const m = svg.match(/width="(\d+)" height="(\d+)"/)
  const w = Number(m[1]) + 16
  const h = Number(m[2]) + 16
  const out = path.join(__dirname, 'p_' + f.replace('.svg', '.png'))
  execFileSync(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--screenshot=${out}`,
    `--window-size=${w},${h}`,
    'file:///' + path.join(dir, f).replace(/\\/g, '/')
  ], { stdio: 'ignore' })
  console.log('ok', path.basename(out))
}
