/**
 * 路由：/repositories/[id]
 * 说明：仓库详情页面已下线，此处保留兼容路由并提示跳转
 */
'use client'
import Link from 'next/link'
import { Button as AntButton, Card as AntCard } from 'antd'

export default function RepositoryDetailRoute({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <div style={{ padding: 16 }}>
      <AntCard>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>仓库详情已移除</div>
        <div style={{ color: '#666', marginBottom: 12 }}>仓库 {id} 的详情页已下线，请返回仓库列表查看相关信息。</div>
        <Link href="/repositories"><AntButton type="primary">返回仓库列表</AntButton></Link>
      </AntCard>
    </div>
  )
}

