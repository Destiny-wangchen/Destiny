import { h } from 'vue'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import '../style.css'

export default {
  Layout,
  NotFound: () => h('div', { style: { padding: '4rem 0', textAlign: 'center' } }, '404 · 页面不存在')
} satisfies Theme
