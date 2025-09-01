/**
 * 路由：/repositories/apis
 * 页面：接口调用情况（薄壳）
 * 实现：src/components/repository/repositoryapicalls.tsx
 */
"use client"
import RepositoryApiCalls from '@/components/repository/repositoryapicalls'

// 薄壳页面：仅返回业务组件，布局骨架由 layout.tsx 控制
export default function RepositoryApiCallsPage() {
  return <RepositoryApiCalls />
}

