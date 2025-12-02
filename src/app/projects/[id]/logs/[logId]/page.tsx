/**
 * 路由：/projects/[id]/logs/[logId]
 * 说明：旧版日志详情页已下线，保留兼容提示页
 */
'use client'
import Link from 'next/link'
import { Card as AntCard, Button as AntButton } from 'antd'

export default function ProjectLogDetailRoute({ params }: { params: { id: string; logId: string } }) {
  const { id } = params
  return (
    <div style={{ padding: 16 }}>
      <AntCard>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>日志详情已移除</div>
        <div style={{ color: '#666', marginBottom: 12 }}>请在项目详情页的部署列表中查看相关日志。</div>
        <Link href={`/environments/${id}`}><AntButton type="primary">前往项目详情</AntButton></Link>
      </AntCard>
    </div>
  )
}

