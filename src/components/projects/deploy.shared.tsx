"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, Typography, Modal, Select as AntSelect } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

// 类型定义（统一对外导出）
export interface PodRecord {
  id: string
  name: string
  status: 'running' | 'pending' | 'failed' | 'terminated'
  createdAt: string
}

export interface ReplicaSetRecord {
  id: string
  name: string
  createdAt: string
  podStatus: {
    running: number
    failed: number
    terminated: number
  }
  uptime: string
  isCurrent: boolean
  pods: PodRecord[]
}

export interface DeployRecord {
  id: string
  deployId: string
  commit: {
    hash: string
    author: string
  }
  deployTime: string
  status: 'success' | 'failed' | 'pending' | 'cancelled'
  duration: string
  environment: 'stg' | 'prod'
  replicaSets: ReplicaSetRecord[]
}

// Mock 数据（统一对外导出）
const records: DeployRecord[] = [
  {
    id: 'deploy-102',
    deployId: '#102',
    commit: { hash: 'a1b2c3d', author: 'alice' },
    deployTime: '2025-09-05 15:30',
    status: 'success',
    duration: '2m15s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-1',
        name: 'my-app-6d4f8c7d9',
        createdAt: '2025-09-05 15:32',
        podStatus: { running: 1, failed: 1, terminated: 0 },
        uptime: '3h20m',
        isCurrent: true,
        pods: [
          { id: 'pod-1', name: 'my-app-6d4f8c7d9-abcde', status: 'running', createdAt: '2025-09-05 15:32' },
          { id: 'pod-2', name: 'my-app-6d4f8c7d9-fghij', status: 'failed', createdAt: '2025-09-05 15:33' }
        ]
      },
      {
        id: 'rs-2',
        name: 'my-app-6d4f8c7d9-canary',
        createdAt: '2025-09-05 15:20',
        podStatus: { running: 2, failed: 0, terminated: 0 },
        uptime: '40m',
        isCurrent: false,
        pods: [
          { id: 'pod-3', name: 'my-app-6d4f8c7d9-canary-a', status: 'running', createdAt: '2025-09-05 15:20' },
          { id: 'pod-4', name: 'my-app-6d4f8c7d9-canary-b', status: 'running', createdAt: '2025-09-05 15:20' }
        ]
      },
      {
        id: 'rs-3',
        name: 'my-app-5b7e3f2c8',
        createdAt: '2025-09-04 11:20',
        podStatus: { running: 0, failed: 0, terminated: 2 },
        uptime: '1d12h',
        isCurrent: false,
        pods: [
          { id: 'pod-5', name: 'my-app-5b7e3f2c8-x', status: 'terminated', createdAt: '2025-09-04 11:20' },
          { id: 'pod-6', name: 'my-app-5b7e3f2c8-y', status: 'terminated', createdAt: '2025-09-04 11:21' }
        ]
      }
    ]
  },
  {
    id: 'deploy-101',
    deployId: '#101',
    commit: { hash: '9f8e7d6', author: 'bob' },
    deployTime: '2025-09-04 11:20',
    status: 'failed',
    duration: '5m43s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-4',
        name: 'my-app-5b7e3f2c8',
        createdAt: '2025-09-04 11:20',
        podStatus: { running: 0, failed: 2, terminated: 0 },
        uptime: '1d12h',
        isCurrent: false,
        pods: [
          { id: 'pod-7', name: 'my-app-5b7e3f2c8-xyz12', status: 'failed', createdAt: '2025-09-04 11:20' },
          { id: 'pod-8', name: 'my-app-5b7e3f2c8-abc34', status: 'failed', createdAt: '2025-09-04 11:20' }
        ]
      },
      {
        id: 'rs-5',
        name: 'my-app-5b7e3f2c8-hotfix',
        createdAt: '2025-09-04 10:50',
        podStatus: { running: 1, failed: 1, terminated: 0 },
        uptime: '3h',
        isCurrent: false,
        pods: [
          { id: 'pod-9', name: 'my-app-5b7e3f2c8-hotfix-a', status: 'running', createdAt: '2025-09-04 10:50' },
          { id: 'pod-10', name: 'my-app-5b7e3f2c8-hotfix-b', status: 'failed', createdAt: '2025-09-04 10:51' }
        ]
      },
      {
        id: 'rs-6',
        name: 'my-app-4c2d7a1b6',
        createdAt: '2025-09-04 10:00',
        podStatus: { running: 0, failed: 0, terminated: 2 },
        uptime: '2d3h',
        isCurrent: false,
        pods: [
          { id: 'pod-11', name: 'my-app-4c2d7a1b6-a', status: 'terminated', createdAt: '2025-09-04 10:00' },
          { id: 'pod-12', name: 'my-app-4c2d7a1b6-b', status: 'terminated', createdAt: '2025-09-04 10:01' }
        ]
      }
    ]
  },
  {
    id: 'deploy-100',
    deployId: '#100',
    commit: { hash: '7c6d5e4', author: 'alice' },
    deployTime: '2025-09-03 09:45',
    status: 'success',
    duration: '1m58s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-7',
        name: 'my-app-4c2d7a1b6',
        createdAt: '2025-09-03 09:45',
        podStatus: { running: 2, failed: 0, terminated: 0 },
        uptime: '2d3h',
        isCurrent: false,
        pods: [
          { id: 'pod-13', name: 'my-app-4c2d7a1b6-a', status: 'running', createdAt: '2025-09-03 09:45' },
          { id: 'pod-14', name: 'my-app-4c2d7a1b6-b', status: 'running', createdAt: '2025-09-03 09:45' }
        ]
      },
      {
        id: 'rs-8',
        name: 'my-app-4c2d7a1b6-rc',
        createdAt: '2025-09-03 09:30',
        podStatus: { running: 1, failed: 1, terminated: 0 },
        uptime: '2d4h',
        isCurrent: false,
        pods: [
          { id: 'pod-15', name: 'my-app-4c2d7a1b6-rc-a', status: 'running', createdAt: '2025-09-03 09:30' },
          { id: 'pod-16', name: 'my-app-4c2d7a1b6-rc-b', status: 'failed', createdAt: '2025-09-03 09:31' } 
        ]
      },
      {
        id: 'rs-9',
        name: 'my-app-legacy',
        createdAt: '2025-09-03 09:00',
        podStatus: { running: 0, failed: 0, terminated: 2 },
        uptime: '10d',
        isCurrent: false,
        pods: [
          { id: 'pod-17', name: 'my-app-legacy-a', status: 'terminated', createdAt: '2025-09-03 09:00' },
          { id: 'pod-18', name: 'my-app-legacy-b', status: 'terminated', createdAt: '2025-09-03 09:01' }
        ]
      }
    ]
  }
]

export function getDeployRecordsMock(): DeployRecord[] {
  return records
}

// 工具函数（内部使用）
const { Text } = Typography
function getPodStatusTag(status: string) {
  const statusConfig: Record<string, { color: 'success' | 'processing' | 'error' | 'default'; text: string }> = {
    running: { color: 'success', text: 'Running' },
    pending: { color: 'processing', text: 'Pending' },
    failed: { color: 'error', text: 'Failed' },
    terminated: { color: 'default', text: 'Terminated' },
  }
  const config = statusConfig[status] || statusConfig.terminated
  return <Tag color={config.color}>{config.text}</Tag>
}

function renderPodStatusSummary(podStatus: ReplicaSetRecord['podStatus']) {
  const { running, failed, terminated } = podStatus
  const total = running + failed + terminated
  if (total === 0) return <Text type="secondary">无Pod</Text>
  return (
    <Space size={4}>
      {running > 0 && <Text type="success">{running} running</Text>}
      {failed > 0 && <Text type="danger">{failed} failed</Text>}
      {terminated > 0 && <Text type="secondary">{terminated} terminated</Text>}
    </Space>
  )
}

// 组件：DeploymentDetailContent（统一导出）
export function DeploymentDetailContent({ deploy, onSync, onRestart, onViewPodLogs }: {
  deploy: DeployRecord
  onSync: (deploymentName: string) => void
  onRestart: (deploymentName: string) => void
  onViewPodLogs: (pod: PodRecord) => void
}) {
  const columns: ColumnsType<ReplicaSetRecord> = [
    { title: 'Deployment', dataIndex: 'name', key: 'name', width: 240, render: (name: string) => <Text code>{name}</Text> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
    { title: 'Pod 状态', key: 'podStatus', width: 220, render: (_: unknown, record: ReplicaSetRecord) => renderPodStatusSummary(record.podStatus) },
    { title: '存活时间', dataIndex: 'uptime', key: 'uptime', width: 120 },
    {
      title: '操作', key: 'actions', width: 220,
      render: (_: unknown, record: ReplicaSetRecord) => (
        <Space>
          <AntButton size="small" type="link" style={{ color: '#1677ff' }} onClick={() => onSync(record.name)}>sync</AntButton>
          <AntButton size="small" type="link" style={{ color: '#1677ff' }} onClick={() => onRestart(record.name)}>restart</AntButton>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Deployment 列表</h3>
        <AntTable<ReplicaSetRecord>
          size="small"
          pagination={false}
          dataSource={deploy.replicaSets}
          rowKey="id"
          columns={columns}
          expandable={{
            expandedRowRender: (replicaSet: ReplicaSetRecord) => (
              <div style={{ padding: '8px 0' }}>
                <h4 style={{ marginBottom: 12 }}>Pod 列表</h4>
                {replicaSet.pods.length === 0 ? (
                  <Text type="secondary">无运行中的Pod</Text>
                ) : (
                  <AntTable<PodRecord>
                    size="small"
                    pagination={false}
                    dataSource={replicaSet.pods}
                    rowKey="id"
                    columns={[
                      { title: 'Pod 名称', dataIndex: 'name', key: 'name', render: (name: string) => <Text code>{name}</Text> },
                      { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => getPodStatusTag(status) },
                      { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
                      {
                        title: '日志', key: 'logs',
                        render: (_: unknown, pod: PodRecord) => (
                          <AntButton size="small" type="link" icon={<EyeOutlined />} onClick={() => onViewPodLogs(pod)}>查看日志</AntButton>
                        )
                      }
                    ]}
                  />
                )}
              </div>
            ),
            rowExpandable: (record) => record.pods.length > 0,
          }}
        />
      </div>
    </div>
  )
}

// 组件：RollbackModal（统一导出）
export interface CommitOption { id: string; detail: string }
export function RollbackModal({ open, onCancel, onConfirm, title, commitOptions, defaultCommitId }: {
  open: boolean
  onCancel: () => void
  onConfirm: (commitId: string) => void
  title?: string
  commitOptions?: CommitOption[]
  defaultCommitId?: string
}) {
  const options: CommitOption[] = commitOptions && commitOptions.length > 0 ? commitOptions : [
    {
      id: 'a1b2c3d',
      detail: 'g123-gitops <84442332+g123-gitops@users.noreply.github.com>\n3 months ago (Tue Jun 17 2025 17:21:29 GMT+0800)\nci(staging-g123-cp-publisher): update manifest and create pr for',
    },
    {
      id: '9f8e7d6',
      detail: 'bo.yu <yu.b@ctw.inc>\na month ago (Thu Jul 31 2025 13:55:10 GMT+0800)\nMerge pull request #39397 from G123-jp/chore/pubsliher-stg',
    },
    {
      id: '7c6d5e4',
      detail: 'g123-gitops <84442332+g123-gitops@users.noreply.github.com>\n4 months ago (Tue May 20 2025 09:15:40 GMT+0800)\nchore: housekeeping',
    },
  ]

  const [selectedId, setSelectedId] = useState<string>(defaultCommitId || options[0]?.id || '')
  useEffect(() => { setSelectedId(defaultCommitId || options[0]?.id || '') }, [open, defaultCommitId, options])
  const selectedDetail = useMemo(() => options.find(o => o.id === selectedId)?.detail || '', [options, selectedId])

  return (
    <Modal title={title || '回滚到指定 Commit'} open={open} onCancel={onCancel} onOk={() => selectedId && onConfirm(selectedId)} okText="确认回滚" cancelText="取消" destroyOnClose>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 6 }}>选择 Commit ID</Typography.Text>
          <AntSelect value={selectedId} onChange={setSelectedId} style={{ width: '100%' }} options={options.map(o => ({ label: o.id, value: o.id }))} placeholder="请选择 Commit ID" />
        </div>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 6 }}>Detail</Typography.Text>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 8, marginBottom: 0 }}>
            {selectedDetail || '—'}
          </Typography.Paragraph>
        </div>
      </Space>
    </Modal>
  )
}