/**
 * 路由：/projects/[id]/logs/[logId]
 * 页面：部署日志详情（薄壳）
 * 实现：src/components/projects/project-log-detail.tsx
 */
"use client"
import React from 'react'
import ProjectLogDetail from '@/components/projects/project-log-detail'

interface Props { params: Promise<{ id: string; logId: string }> }

// 这段代码实现了“薄壳”日志详情页，仅返回业务组件
export default function ProjectLogDetailRoute({ params }: Props) {
  const { id, logId } = React.use(params)
  return <ProjectLogDetail projectId={id} logId={logId} />
}

