/**
 * 路由：/projects/[id]
 * 页面：项目（仓库）详情（薄壳）
 * 实现：src/components/projects/project-detail.tsx
 */
import React from 'react'
import ProjectDetail from '../../../components/projects/project-detail'

interface Props { params: Promise<{ id: string }> }

// 这段代码实现了“薄壳”详情页，仅返回业务组件，使用了 React.use 解包路由参数
export default function ProjectDetailRoute({ params }: Props) {
  const { id } = React.use(params)
  return <ProjectDetail projectId={id} />
}

