/**
 * 路由：/projects/[id]
 * 页面：项目详情（薄壳）
 * 实现：src/components/projects/projectdetail.tsx
 */
import React from 'react'
import ProjectDetail from '@/components/projects/projectdetail'

interface Props { params: Promise<{ id: string }> }

export default function ProjectDetailRoute({ params }: Props) {
  const { id } = React.use(params)
  return <ProjectDetail projectId={id} />
}

