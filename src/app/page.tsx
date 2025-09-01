/**
 * 路由：/ （根路径）
 * 页面：首页（薄壳）
 * 实现：src/components/repository/repositorypage.tsx
 */
'use client'

import RepositoryPage from '../components/repository/repositorypage'

// 这段代码实现了“薄壳”首页：仅返回业务组件，使用了 Next.js App Router 页面约定
// 代码说明：UI 骨架（Header/Sidebar/卡片外观）由 layout.tsx 统一控制
// 修改原因：避免 page 与 layout 重复定义布局，保持页面关注于业务内容
export default function Home() {
  return <RepositoryPage />
}