"use client"
import React from 'react'
import Link from 'next/link'

// 这段代码实现了部署日志详情页（占位），使用了 React 客户端组件
// 代码说明：展示基本信息与模拟日志，并提供返回、下载、重试操作
export default function ProjectLogDetail({ projectId, logId }: { projectId: string; logId: string }) {
  const repoName = projectId === '1' ? 'order-service' : projectId === '2' ? 'user-service' : 'payment-api'
  const commitId = logId === 'log-1' ? 'a1b2c3d' : logId === 'log-2' ? 'z9y8x7w' : 'l4m5n6o'
  const time = logId === 'log-1' ? '09/10 14:32' : logId === 'log-2' ? '09/09 19:05' : '09/08 17:03'
  const lines: string[] = [
    '[14:32:01] 开始部署任务',
    '...[14:32:02] 拉取代码：git clone https://git.company.com/order-service.git',
    '...[14:32:05] 检出分支：feature/login-fix (commit a1b2c3d)',
    '...[14:32:10] 构建镜像：docker build -t order-service:a1b2c3d .',
    '...[14:32:30] 推送镜像：registry.company.com/order-service:a1b2c3d',
    '...[14:32:45] 应用部署配置：k8s/order-service-deploy.yaml',
    '...[14:33:00] 等待 Pod 就绪...',
    '...[14:33:10] Pod (order-service-abc123) 启动成功',
    '...[14:33:15] 健康检查通过',
    '...[14:33:16] 部署完成 ✅',
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Link href={`/projects/${projectId}`}>返回仓库详情</Link>
        <div style={{ fontSize: 18, fontWeight: 700 }}>部署日志详情</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div>仓库名：{repoName}</div>
          <div>分支：feature/login-fix</div>
          <div>Commit ID：{commitId}</div>
          <div>部署时间：{time}</div>
          <div>部署人：李铁</div>
          <div>状态：成功 ✅</div>
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', background: '#0d1117', color: '#c9d1d9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {lines.join('\n')}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <button onClick={() => alert('下载日志文件')}>⬇ 下载日志文件</button>
        <button onClick={() => alert('重新部署此 commit')}>🔄 重新部署此 commit</button>
      </div>
    </div>
  )
}

