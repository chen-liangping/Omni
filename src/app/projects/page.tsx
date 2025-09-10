/**
 * 路由：/projects
 * 页面：仓库有效分支列表（薄壳）
 * 实现：src/components/projects/branches-list.tsx
 */
"use client"
import BranchesList from '@/components/projects/branches-list'

// 这段代码实现了“薄壳”列表页：仅返回业务组件
export default function ProjectsListRoute() {
  return <BranchesList />
}

