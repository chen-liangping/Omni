"use client"
import { Table as AntTable, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React from 'react'

/**
 * 这段代码实现了“接口调用情况”业务组件，使用了 Ant Design 的 Table 与 Tag。
 * 代码说明：展示接口名称、调用结果（成功/失败）、调用时间；数据为组件内的 mock，便于原型自包含与复用。
 * 修改原因：遵循“页面薄壳、实现放 components”的结构要求。
 */

type ApiStatus = 'success' | 'failed'
interface ApiCallRecord {
  id: string
  name: string
  status: ApiStatus
  time: string
}

const mockApiCalls: ApiCallRecord[] = [
  { id: '1', name: 'CreateRepository', status: 'success', time: '2024-09-01 10:00:12' },
  { id: '2', name: 'ListRepositories', status: 'success', time: '2024-09-01 10:01:08' },
  { id: '3', name: 'InitRepository', status: 'failed', time: '2024-09-01 10:02:45' },
  { id: '4', name: 'GetRepositoryDetail', status: 'success', time: '2024-09-01 10:03:30' },
]

export default function RepositoryApiCalls() {
  const columns: ColumnsType<ApiCallRecord> = [
    { title: '接口名称', dataIndex: 'name', key: 'name' },
    {
      title: '调用结果', dataIndex: 'status', key: 'status',
      render: (s: ApiStatus) => (
        <Tag color={s === 'success' ? 'green' : 'red'}>{s === 'success' ? '调用成功' : '调用失败'}</Tag>
      )
    },
    { title: '调用时间', dataIndex: 'time', key: 'time' },
  ]

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ color: 'var(--heading)', marginBottom: 16 }}>接口调用情况</h1>
      <AntTable<ApiCallRecord>
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={mockApiCalls}
        pagination={{ pageSize: 10 }}
      />
    </main>
  )
}

