/**
 * 路由：/projects/[id]
 * 页面：多环境 - 项目详情（薄壳，兼容旧路径）
 * 实现：src/components/environments/project-detail.tsx
 */
'use client'
import React from 'react'
import EnvironmentProjectDetail from '@/components/environments/project-detail'

export default function ProjectDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  return <EnvironmentProjectDetail id={id} />
}

