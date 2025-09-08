"use client"
import React, { useState, useEffect } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, message, Drawer, Descriptions, Typography, Divider } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeploymentDetailContent, RollbackModal, getDeployRecordsMock, type DeployRecord, type PodRecord } from './deploy.shared'

/**
 * 这段代码实现了"部署记录"页面：采用仿 Vercel 风格的三级展开结构
 * 代码说明：主列表展示commit部署历史，支持展开查看ReplicaSet和Pod详情
 * 修改原因：满足部署列表 3.0 的需求，提供Git commit关联的部署记录管理功能
 */

const { Text } = Typography


export default function DeployRecordsList() {
  const [data, setData] = useState<DeployRecord[]>([])
  useEffect(() => {
    setData(getDeployRecordsMock())
  }, [])
  const [showDeployDetail, setShowDeployDetail] = useState<DeployRecord | null>(null)
  const [showPodLogs, setShowPodLogs] = useState<PodRecord | null>(null)
  const [showRollback, setShowRollback] = useState<{ open: boolean; target?: string }>(() => ({ open: false }))

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

  // 查看Pod日志
  const handleViewPodLogs = (pod: PodRecord) => {
    setShowPodLogs(pod)
  }

  // 显示部署详情
  const showDeployDetails = (deploy: DeployRecord) => {
    setShowDeployDetail(deploy)
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
            <Text strong style={{ color: '#1677ff' }}>{deployId}</Text>
          </AntButton>
          <Tag 
            color={record.environment === 'stg' ? 'blue' : 'green'} 
            bordered={false}
            style={{ fontSize: 9, height: 16, lineHeight: '14px', padding: '0 6px', borderRadius: 6, transform: 'translateY(-1px)' }}
          >
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
          <AntButton size="small" type="link" style={{ color: '#1677ff' }} onClick={() => handleSync(record.deployId)}>sync</AntButton>
          <AntButton size="small" type="link" style={{ color: '#1677ff' }} onClick={() => openRollback(record.deployId)}>rollback</AntButton>
        </Space>
      )
    }
  ]

  // restart 某个 Deployment（模拟）
  const handleRestart = (deploymentName: string) => {
    message.success(`正在重启 ${deploymentName}...`)
    setTimeout(() => message.success('重启完成'), 1500)
  }

  // sync 某个 Deployment（模拟）
  const handleSync = (deploymentName: string) => {
    message.success(`正在同步 ${deploymentName}...`)
    setTimeout(() => message.success('同步完成'), 1200)
  }

  // rollback：打开弹窗
  const openRollback = (deploymentName: string) => {
    setShowRollback({ open: true, target: deploymentName })
  }

  const confirmRollback = (commitId: string) => {
    message.success(`已回滚到 ${commitId}`)
    setShowRollback({ open: false, target: undefined })
  }


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
          <DeploymentDetailContent 
            deploy={showDeployDetail}
            onSync={(deploymentName: string) => handleSync(deploymentName)}
            onRollback={(deploymentName: string) => openRollback(deploymentName)}
            onViewPodLogs={handleViewPodLogs}
          />
        )}
      </Drawer>

      {/* 回滚弹窗 */}
      <RollbackModal 
        open={showRollback.open}
        onCancel={() => setShowRollback({ open: false })}
        onConfirm={confirmRollback}
        title={showRollback.target ? `回滚 - ${showRollback.target}` : '回滚到指定 Commit'}
      />

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