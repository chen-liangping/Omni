"use client"
import React, { cache } from 'react'
import Link from 'next/link'
import { USERS } from '@/constants/mock'

// 这段代码实现了部署日志详情页（占位），使用了 React 客户端组件
// 代码说明：展示基本信息与模拟日志，并提供返回、下载、重试操作
export default function ProjectLogDetail({ projectId, logId }: { projectId: string; logId: string }) {
  const repoName: string = projectId === '1' ? 'order-service' : projectId === '2' ? 'user-service' : 'payment-api'
  const branch: string = projectId === '1' ? 'feature/login-fix' : projectId === '2' ? 'release-1.0' : 'hotfix-22'
  const commitId: string = logId === 'log-1' ? 'a1b2c3d' : logId === 'log-2' ? 'z9y8x7w' : 'l4m5n6o'
  const time: string = logId === 'log-1' ? '09/10 14:32' : logId === 'log-2' ? '09/09 19:05' : '09/08 17:03'
  const operator: string = projectId === '1' ? USERS[0] : projectId === '2' ? USERS[1] : USERS[2]
  const status: '成功' | '失败' = logId === 'log-2' ? '失败' : '成功'
  const workflowFile: string = 'ci.yml'
  const lines: string[] = [
    '[17:01:15.735] Running build in Washington, D.C., USA (East) – iad1',
    '[17:01:15.735] Build machine configuration: 2 cores, 8 GB',
    '[17:01:15.780] Cloning github.com/chen-liangping/Publisher_demo (Branch: vercel, Commit: 1b8052b)',
    '[17:01:16.242] Cloning completed: 461.000ms',
    '[17:01:19.199] Restored build cache from previous deployment (DYwMp2ACh3EosSAW4zyPWnbtq1Q1)',
    '[17:01:19.903] Running "vercel build"',
    '[17:01:20.301] Vercel CLI 47.1.1',
    '[17:01:20.778] Installing dependencies...',
    '[17:01:22.247] ',
    '[17:01:22.248] up to date in 1s'
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
          <div>分支：{branch}</div>
          <div>Commit ID：{commitId}</div>
          <div>部署时间：{time}</div>
          <div>部署人：{operator}</div>
          <div>状态：{status}</div>
        </div>
      </div>
      {/* CI 构建区：与部署日志放在一起，便于联动查看 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <span style={{ color: status === '成功' ? '#52c41a' : '#ff4d4f' }}>●</span>
          <span>{status === '成功' ? '构建成功' : '构建失败'}</span>
          <span style={{ fontSize: 12, color: '#666' }}>{`Commit ${commitId}`}</span>
          <a
            href={`https://github.com/company/${repoName}/actions/workflows/${workflowFile}?query=branch:${branch}`}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: 8 }}
          >{workflowFile}</a>
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

