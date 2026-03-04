'use client'

import Script from 'next/script'

/**
 * Giscus 评论区
 * 需在仓库 Settings → General → Features 中启用 Discussions
 */
export default function Comments() {
  return (
    <section style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
        评论
      </h3>
      <div className="giscus">
        <Script
        src="https://giscus.app/client.js"
        data-repo="chen-liangping/Omni"
        data-repo-id="R_kgDOPltYAQ"
        data-category="Announcements"
        data-category-id="DIC_kwDOPltYAc4CvHlq"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        data-loading="lazy"
        crossOrigin="anonymous"
        strategy="lazyOnload"
        />
      </div>
    </section>
  )
}
