/**
 * 路由：/projects/[id]
 * 页面：多环境 - 项目详情（薄壳，兼容旧路径）
 * 实现：src/components/environments/project-detail.tsx
 */
'use client'
import EnvironmentProjectDetail from '@/components/environments/project-detail'

export default function ProjectDetailRoute({ params }: { params: { id: string } }) {
  return <EnvironmentProjectDetail id={params.id} />
}

