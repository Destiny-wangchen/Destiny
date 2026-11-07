let timer: ReturnType<typeof setTimeout> | undefined

/**
 * 加载（或重新加载）不蒜子统计脚本。
 * 不蒜子通过 document 中的固定 id 元素填充数值：
 *   busuanzi_value_page_pv / busuanzi_value_site_pv / busuanzi_value_site_uv
 * SPA 路由切换后需重新注入脚本以刷新当前页的统计。
 */
export function loadBusuanzi() {
  if (typeof document === 'undefined') return
  clearTimeout(timer)
  timer = setTimeout(() => {
    document.getElementById('busuanzi')?.remove()
    const s = document.createElement('script')
    s.id = 'busuanzi'
    s.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
    s.async = true
    document.body.appendChild(s)
  }, 500)
}
