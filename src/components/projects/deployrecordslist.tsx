"use client"
import React, { useState, useEffect } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, message, Drawer, Descriptions, Typography, Collapse, Divider } from 'antd'
import { ReloadOutlined, RollbackOutlined, EyeOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

/**
 * 这段代码实现了"部署记录"页面：采用仿 Vercel 风格的三级展开结构
 * 代码说明：主列表展示commit部署历史，支持展开查看ReplicaSet和Pod详情
 * 修改原因：满足部署列表 3.0 的需求，提供Git commit关联的部署记录管理功能
 */

const { Text } = Typography
const { Panel } = Collapse

// Pod 数据结构（层级三）
export interface PodRecord {
  id: string
  name: string
  status: 'running' | 'pending' | 'failed' | 'terminated'
  node: string
  restartCount: number
  createdAt: string
}

// ReplicaSet 数据结构（层级二）
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

// 部署记录数据结构（层级一，仿 Vercel 风格）
export interface DeployRecord {
  id: string
  deployId: string // #102, #101 等
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

import { getDeployRecordsMock } from './deployrecords.mock'
const mockData: DeployRecord[] = [
  {
    id: 'deploy-102',
    deployId: '#102',
    commit: {
      hash: 'a1b2c3d',
      author: 'alice'
    },
    deployTime: '2025-09-05 15:30',
    status: 'success',
    duration: '2m15s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-1',
        name: 'my-app-6d4f8c7d9',
        createdAt: '15:32',
        podStatus: { running: 3, failed: 0, terminated: 0 },
        uptime: '3h20m',
        isCurrent: true,
        pods: [
          {
            id: 'pod-1',
            name: 'my-app-6d4f8c7d9-abcde',
            status: 'running',
            node: 'node-1',
            restartCount: 0,
            createdAt: '15:32'
          },
          {
            id: 'pod-2',
            name: 'my-app-6d4f8c7d9-fghij',
            status: 'running',
            node: 'node-2',
            restartCount: 0,
            createdAt: '15:32'
          },
          {
            id: 'pod-3',
            name: 'my-app-6d4f8c7d9-klmno',
        status: 'running',
            node: 'node-1',
            restartCount: 1,
            createdAt: '15:32'
          }
        ]
      },
      {
        id: 'rs-2',
        name: 'my-app-5b7e3f2c8',
        createdAt: '09-04 11:20',
        podStatus: { running: 0, failed: 0, terminated: 3 },
        uptime: '1d12h',
        isCurrent: false,
        pods: []
      }
    ]
  },
  {
    id: 'deploy-101',
    deployId: '#101',
    commit: {
      hash: '9f8e7d6',
      author: 'bob'
    },
    deployTime: '2025-09-04 11:20',
    status: 'failed',
    duration: '5m43s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-3',
        name: 'my-app-5b7e3f2c8',
        createdAt: '11:20',
        podStatus: { running: 0, failed: 3, terminated: 0 },
        uptime: '1d12h',
        isCurrent: false,
        pods: [
          {
            id: 'pod-4',
            name: 'my-app-5b7e3f2c8-xyz12',
            status: 'failed',
            node: 'node-1',
            restartCount: 3,
            createdAt: '11:20'
          },
          {
            id: 'pod-5',
            name: 'my-app-5b7e3f2c8-abc34',
            status: 'failed',
            node: 'node-2',
            restartCount: 2,
            createdAt: '11:20'
          }
        ]
      }
    ]
  },
  {
    id: 'deploy-100',
    deployId: '#100',
    commit: {
      hash: '7c6d5e4',
      author: 'alice'
    },
    deployTime: '2025-09-03 09:45',
    status: 'success',
    duration: '1m58s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-4',
        name: 'my-app-4c2d7a1b6',
        createdAt: '09:45',
        podStatus: { running: 0, failed: 0, terminated: 3 },
        uptime: '2d3h',
        isCurrent: false,
        pods: []
      }
    ]
  }
]

export default function DeployRecordsList() {
  const [data, setData] = useState<DeployRecord[]>([])
  useEffect(() => {
    setData(getDeployRecordsMock())
  }, [])
  const [showDeployDetail, setShowDeployDetail] = useState<DeployRecord | null>(null)
  const [expandedReplicaSetId, setExpandedReplicaSetId] = useState<string | null>(null)
  const [showPodLogs, setShowPodLogs] = useState<PodRecord | null>(null)

  // 获取部署状态标签
  const getDeployStatusTag = (status: string) => {
    const statusConfig = {
      success: { color: 'success', text: '✅ 成功' },
      failed: { color: 'error', text: '❌ 失败' },
      pending: { color: 'processing', text: '🔄 部署中' },
      cancelled: { color: 'default', text: '⏹️ 已取消' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 获取Pod状态标签
  const getPodStatusTag = (status: string) => {
    const statusConfig = {
      running: { color: 'success', text: 'Running' },
      pending: { color: 'processing', text: 'Pending' },
      failed: { color: 'error', text: 'Failed' },
      terminated: { color: 'default', text: 'Terminated' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.terminated
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 重新部署
  const handleRedeploy = (deployId: string) => {
    setData(prev => prev.map(deploy => 
      deploy.id === deployId 
        ? { ...deploy, status: 'pending' as const }
        : deploy
    ))
    message.success('正在重新部署...')
    
    setTimeout(() => {
      setData(prev => prev.map(deploy => 
        deploy.id === deployId 
          ? { ...deploy, status: 'success' as const, duration: '2m30s' }
          : deploy
      ))
      message.success('重新部署完成')
    }, 3000)
  }

  // 回滚到指定版本
  const handleRollback = (targetLabel: string) => {
    message.success(`正在回滚到 ${targetLabel}...`)
    
    setTimeout(() => {
      message.success('回滚完成')
    }, 2000)
  }

  // 查看Pod日志
  const handleViewPodLogs = (pod: PodRecord) => {
    setShowPodLogs(pod)
  }

  // 显示部署详情
  const showDeployDetails = (deploy: DeployRecord) => {
    setShowDeployDetail(deploy)
    setExpandedReplicaSetId(null) // 重置ReplicaSet展开状态
  }

  // 切换ReplicaSet展开状态
  const toggleReplicaSetDetails = (replicaSetId: string) => {
    setExpandedReplicaSetId(prev => prev === replicaSetId ? null : replicaSetId)
  }

  // 渲染Pod状态摘要
  const renderPodStatusSummary = (podStatus: ReplicaSetRecord['podStatus']) => {
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

  // 主列表配置（仿 Vercel 风格）
  const columns: ColumnsType<DeployRecord> = [
    {
      title: '部署 ID',
      dataIndex: 'deployId',
      key: 'deployId',
      width: 100,
      render: (deployId: string, record: DeployRecord) => (
        <Space>
          <AntButton type="link" style={{ padding: 0 }} onClick={() => showDeployDetails(record)}>
            <Text strong>{deployId}</Text>
          </AntButton>
          <Tag color={record.environment === 'stg' ? 'blue' : 'gold'}>
            {record.environment.toUpperCase()}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Commit ID',
      key: 'commit',
      width: 220,
      render: (_, record: DeployRecord) => (
        <Text code>{record.commit.hash}</Text>
      )
    },
    {
      title: '提交人',
      dataIndex: ['commit', 'author'],
      key: 'author',
      width: 100
    },
    {
      title: '部署时间',
      dataIndex: 'deployTime',
      key: 'deployTime',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getDeployStatusTag(status)
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, record: DeployRecord) => (
        <Space>
          <AntButton size="small" icon={<ReloadOutlined />} onClick={() => handleRedeploy(record.id)}>
            Redeploy
          </AntButton>
          <AntButton size="small" icon={<RollbackOutlined />} onClick={() => handleRollback(record.deployId)}>
            Rollback
          </AntButton>
        </Space>
      )
    }
  ]


  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>🚀 部署历史列表</h1>
      </div>

      <AntTable<DeployRecord>
        rowKey="id"
        dataSource={data}
        columns={columns}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
      />

      {/* 部署详情Drawer */}
      <Drawer
        title={`部署详情 - ${showDeployDetail?.deployId}`}
        open={!!showDeployDetail}
        onClose={() => setShowDeployDetail(null)}
        width={900}
      >
        {showDeployDetail && (
          <div>
            {/* ReplicaSet 信息 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>ReplicaSet 信息</h3>
              <AntTable
                size="small"
                pagination={false}
                dataSource={showDeployDetail.replicaSets}
                rowKey="id"
                columns={[
                  {
                    title: 'ReplicaSet',
                    dataIndex: 'name',
                    key: 'name',
                    width: 240,
                    render: (name: string) => <Text code>{name}</Text>
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    width: 140
                  },
                  {
                    title: 'Pod 状态',
                    key: 'podStatus',
                    width: 220,
                    render: (_, record: ReplicaSetRecord) => renderPodStatusSummary(record.podStatus)
                  },
                  {
                    title: '存活时间',
                    dataIndex: 'uptime',
                    key: 'uptime',
                    width: 120
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    width: 180,
                    render: (_, record: ReplicaSetRecord) => (
                      <Space>
                        {record.isCurrent ? (
                          <Tag color="success">✅ 当前版本</Tag>
                        ) : (
                          <AntButton size="small" type="link" onClick={() => handleRollback(record.name)}>
                            回滚到此版本
                          </AntButton>
                        )}
                      </Space>
                    )
                  }
                ]}
                expandable={{
                  expandedRowRender: (replicaSet: ReplicaSetRecord) => (
                    <div style={{ padding: '8px 0' }}>
                      <h4 style={{ marginBottom: 12 }}>Pod 列表</h4>
                      {replicaSet.pods.length === 0 ? (
                        <Text type="secondary">无运行中的Pod</Text>
                      ) : (
                        <AntTable
                          size="small"
                          pagination={false}
                          dataSource={replicaSet.pods}
                          rowKey="id"
                          columns={[
                            {
                              title: 'Pod 名称',
                              dataIndex: 'name',
                              key: 'name',
                              render: (name: string) => <Text code>{name}</Text>
                            },
                            {
                              title: '状态',
                              dataIndex: 'status',
                              key: 'status',
                              render: (status: string) => getPodStatusTag(status)
                            },
                            {
                              title: '节点',
                              dataIndex: 'node',
                              key: 'node'
                            },
                            {
                              title: '重启次数',
                              dataIndex: 'restartCount',
                              key: 'restartCount'
                            },
                            {
                              title: '日志',
                              key: 'logs',
                              render: (_, pod: PodRecord) => (
                                <AntButton 
                                  size="small" 
                                  type="link" 
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewPodLogs(pod)}
                                >
                                  查看日志
                                </AntButton>
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
        )}
      </Drawer>

      {/* Pod日志Drawer */}
      <Drawer
        title={`Pod 日志 - ${showPodLogs?.name}`}
        open={!!showPodLogs}
        onClose={() => setShowPodLogs(null)}
        width={800}
      >
        {showPodLogs && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Pod名称">{showPodLogs.name}</Descriptions.Item>
              <Descriptions.Item label="状态">{getPodStatusTag(showPodLogs.status)}</Descriptions.Item>
              <Descriptions.Item label="节点">{showPodLogs.node}</Descriptions.Item>
              <Descriptions.Item label="重启次数">{showPodLogs.restartCount}</Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
              <div style={{ 
                background: '#000', 
                color: '#00ff00', 
                padding: 16, 
                borderRadius: 6, 
                fontFamily: 'monospace',
                fontSize: 12,
              height: 400,
                overflow: 'auto'
              }}>
              <div>2025-09-05 15:32:00 [INFO] Pod starting...</div>
              <div>2025-09-05 15:32:05 [INFO] Container image pulled successfully</div>
              <div>2025-09-05 15:32:10 [INFO] Container started</div>
              <div>2025-09-05 15:32:15 [INFO] Health check passed</div>
              <div>2025-09-05 15:32:20 [INFO] Pod ready</div>
              {showPodLogs.status === 'running' && (
                <div>2025-09-05 15:32:25 [INFO] Service is running normally</div>
              )}
              {showPodLogs.status === 'failed' && (
                <>
                  <div style={{ color: '#ff0000' }}>2025-09-04 11:25:00 [ERROR] Container failed to start</div>
                  <div style={{ color: '#ff0000' }}>2025-09-04 11:25:01 [ERROR] Exit code: 1</div>
                  </>
                )}
            </div>
          </div>
        )}
      </Drawer>
    </main>
  )
}