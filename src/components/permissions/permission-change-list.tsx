"use client"
import React, { useMemo } from 'react'
import { Table as AntTable, Tag, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PROJECTS, USERS } from '@/constants/mock'

/**
 * 这段代码实现了 权限变更记录列表页，使用了 AntD Table（本地 mock 数据）
 * 代码说明：展示 OA 流程名称、流程ID、流程详情、申请人、执行时间、执行结果（成功/失败）。
 * 修改原因：新增“权限变更记录”菜单与页面，便于审计和追踪权限修改。
 * 兼容说明：在 React 19 中使用 React.JSX.Element 替代全局 JSX.Element
 */

type RoleKey = 'admin' | 'writer' | 'reader'
type ExecResult = '成功' | '失败'

interface PermissionChangeRecord {
  processName: string
  processId: string
  projectName: string
  role: RoleKey
  applicant: string
  executedAt: string // YYYY-MM-DD HH:mm:ss
  result: ExecResult
}

const roleLabel: Record<RoleKey, string> = {
  admin: 'admin',
  writer: 'writer',
  reader: 'reader'
}

export default function PermissionChangeList(): React.JSX.Element {
  // mock 数据（原型内同目录就近维护）
  const rows: PermissionChangeRecord[] = useMemo(() => ([
    { processName: '项目权限开通', processId: 'OA-20251112001', projectName: PROJECTS[0], role: 'admin', applicant: USERS[0], executedAt: '2025-11-12 10:15:20', result: '成功' },
    { processName: '项目权限调整', processId: 'OA-20251111022', projectName: PROJECTS[1], role: 'writer', applicant: USERS[1], executedAt: '2025-11-11 09:05:10', result: '失败' },
    { processName: '项目权限开通', processId: 'OA-20251109008', projectName: PROJECTS[2], role: 'reader', applicant: USERS[2], executedAt: '2025-11-09 14:33:48', result: '成功' },
    { processName: '项目权限降级', processId: 'OA-20251030003', projectName: PROJECTS[0], role: 'reader', applicant: USERS[1], executedAt: '2025-10-30 18:02:06', result: '成功' },
  ]), [])

  const columns: ColumnsType<PermissionChangeRecord> = [
    { title: 'OA流程名称', dataIndex: 'processName', key: 'processName' },
    { title: 'OA流程ID', dataIndex: 'processId', key: 'processId' },
    {
      title: '流程详情',
      key: 'detail',
      render: (_: unknown, r) => (
        <span>{`${r.applicant} 申请 “${r.projectName}” - “${roleLabel[r.role]}”`}</span>
      )
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
    { title: '执行时间', dataIndex: 'executedAt', key: 'executedAt' },
    {
      title: '执行结果',
      dataIndex: 'result',
      key: 'result',
      render: (v: ExecResult) => (
        <Space>
          <Tag color={v === '成功' ? 'green' : 'red'}>{v}</Tag>
        </Space>
      )
    }
  ]

  return (
    <main style={{ padding: '24px 24px 24px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>权限变更记录</h1>
      </div>
      <AntTable<PermissionChangeRecord> rowKey={(r) => r.processId} columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} />
    </main>
  )
}


