/**
 * 路由：/commits
 * 页面：Commit 列表
 * 实现：src/components/projects/commitslist.tsx
 */
'use client'

import CommitsList from '../../components/projects/commitslist'

// 这段代码实现了"薄壳"Commit列表页：仅返回业务组件，使用了 Next.js App Router 页面约定
// 代码说明：UI 骨架（Header/Sidebar/卡片外观）由 layout.tsx 统一控制
// 修改原因：避免 page 与 layout 重复定义布局，保持页面关注于业务内容
export default function CommitsPage() {
  return <CommitsList />
}