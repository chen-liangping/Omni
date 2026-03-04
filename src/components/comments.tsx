"use client"
import React, { useEffect, useRef } from 'react'

/**
 * 这段代码实现了 在页面底部挂载 Giscus 评论组件，使用了原生 script 注入
 * 代码说明：组件在客户端 mount 时动态创建 <script> 标签并附加到占位容器
 * 修改原因：统一在文章/页面底部接入讨论区，便于协作反馈
 * 兼容说明：在 React 19 中使用 React.JSX.Element 替代全局 JSX.Element
 */
export default function Comments(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 避免重复注入
    if (container.querySelector('script[data-giscus]')) return

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-giscus', 'true')
    script.setAttribute('data-repo', 'chen-liangping/Omni')
    script.setAttribute('data-repo-id', 'R_kgDOPltYAQ')
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', 'DIC_kwDOPltYAc4CvHlq')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', 'zh-CN')
    script.setAttribute('data-loading', 'lazy')

    container.appendChild(script)

    return () => {
      // 清理：删除已注入的 giscus iframe / script
      const iframes = container.querySelectorAll('iframe.giscus-frame')
      iframes.forEach((n) => n.remove())
      const s = container.querySelector('script[data-giscus]')
      if (s) s.remove()
    }
  }, [])

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>讨论区</div>
      <div ref={containerRef} />
    </div>
  )
}

