"use client"

import React, { useEffect, useRef } from 'react'
import { Typography } from 'antd'
import { usePathname } from 'next/navigation'

/**
 * 这段代码实现了「Giscus 评论组件」，使用了原生 script 动态注入与 Next.js App Router 的路径监听
 * 代码说明：在组件挂载和 pathname 变化时，清空容器并重新注入 giscus 的官方脚本与 data-* 配置
 * 修改原因：保证在 App Router 客户端路由切换时，评论区能够正确根据 pathname 重新映射与渲染
 */

const { Text } = Typography

export default function GiscusComments() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()

  // 动态注入并在路由切换时重载 giscus
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 清空旧的渲染内容，避免重复挂载
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'

    // 根据用户提供的固定配置设置 data-* 属性
    script.setAttribute('data-repo', 'chen-liangping/Omni')
    script.setAttribute('data-repo-id', 'R_kgDOPltYAQ')
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', 'DIC_kwDOPltYAc4CvHlq')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', 'zh-CN')

    script.crossOrigin = 'anonymous'
    script.async = true

    container.appendChild(script)

    return () => {
      // 清理，防止内存泄漏
      container.innerHTML = ''
    }
  }, [pathname])

  return (
    <div style={{ width: '100%', marginTop: 16 }}>
      {/* 标题与轻提示（可选） */}
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>评论由 Giscus 提供，基于 GitHub Discussions</Text>
      </div>
      <div ref={containerRef} />
    </div>
  )
}