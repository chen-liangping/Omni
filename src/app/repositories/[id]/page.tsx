/**
 * 路由：/repositories/[id]
 * 页面：仓库详情（薄壳）
 * 实现：src/components/repository/repositorydetail.tsx
 */
import React from 'react'
import RepositoryDetailPage from '@/components/repository/repositorydetail'

interface Props { params: Promise<{ id: string }> }

export default function RepositoryDetailRoute({ params }: Props) {
  // Next.js 15: params/searchParams 为 Promise，需要使用 React.use 解包
  const { id } = React.use(params)
  return <RepositoryDetailPage repoId={id} />
}

