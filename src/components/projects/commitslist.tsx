"use client"
import React, { useState, useEffect } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, Popconfirm, message, Modal, Input } from 'antd'
import { CheckOutlined, CloseOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

/**
 * 这段代码实现了"Commit列表"页面：展示合并代码后生成的commit记录
 * 代码说明：支持审批、拒绝、查看详情等操作，与项目详情页的合并功能联动
 * 修改原因：满足 docs/定时发布.md 的commit管理需求
 */

interface CommitRecord {
  id: string;
  submitter: string;
  branch: string;
  desc: string;
  commitId: string;
  pullUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  createdAt: string;
}

export default function CommitsList() {
  const [commits, setCommits] = useState<CommitRecord[]>([])
  const [showRejectModal, setShowRejectModal] = useState<CommitRecord | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // 从localStorage读取commit数据（模拟与项目详情页的数据同步）
  useEffect(() => {
    const loadCommits = () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('omni-commits') : null
        if (raw) {
          const data = JSON.parse(raw) as CommitRecord[]
          setCommits(Array.isArray(data) ? data : [])
        } else {
          // 初始化示例数据
          const initialCommits: CommitRecord[] = [
            {
              id: '1',
              submitter: 'linjj',
              branch: 'feature/login',
              desc: '登录功能开发完成，包含用户验证、记住密码等功能',
              commitId: 'A1B2C3',
              pullUrl: 'https://github.com/example/repo/pull/123',
              status: 'pending',
              createdAt: '2025-10-15 14:30:00'
            },
            {
              id: '2',
              submitter: 'tom',
              branch: 'feature/payment',
              desc: '2.1.X应用服务及日常优化合并dev',
              commitId: 'D4E5F6',
              pullUrl: 'https://github.com/example/repo/pull/124',
              status: 'approved',
              reviewer: 'miao',
              createdAt: '2025-10-14 16:20:00'
            },
            {
              id: '3',
              submitter: 'jerry',
              branch: 'hotfix/security',
              desc: '修复安全漏洞',
              commitId: 'G7H8I9',
              pullUrl: 'https://github.com/example/repo/pull/125',
              status: 'rejected',
              reviewer: 'miao',
              createdAt: '2025-10-13 09:15:00'
            },
            {
              id: '4',
              submitter: 'jerry',
              branch: 'feature/dashboard',
              desc: '2.1.X应用服务及日常优化合并dev',
              commitId: 'J1K2L3',
              pullUrl: 'https://github.com/example/repo/pull/126',
              status: 'rejected',
              reviewer: 'miao',
              createdAt: '2025-10-12 11:45:00'
            }
          ]
          setCommits(initialCommits)
          localStorage.setItem('omni-commits', JSON.stringify(initialCommits))
        }
      } catch (error) {
        console.error('读取commit数据失败:', error)
        setCommits([])
      }
    }

    loadCommits()
    
    // 监听localStorage变化（当项目详情页添加新commit时自动刷新）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'omni-commits') {
        loadCommits()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleApprove = (record: CommitRecord) => {
    const updatedCommits = commits.map(c => 
      c.id === record.id 
        ? { ...c, status: 'approved' as const, reviewer: '当前用户' }
        : c
    )
    setCommits(updatedCommits)
    localStorage.setItem('omni-commits', JSON.stringify(updatedCommits))
    message.success(`已同意 ${record.branch} 的合并请求`)
  }

  const handleReject = (record: CommitRecord) => {
    setShowRejectModal(record)
  }

  const confirmReject = () => {
    if (!showRejectModal) return
    
    const updatedCommits = commits.map(c => 
      c.id === showRejectModal.id 
        ? { ...c, status: 'rejected' as const, reviewer: '当前用户' }
        : c
    )
    setCommits(updatedCommits)
    localStorage.setItem('omni-commits', JSON.stringify(updatedCommits))
    
    // 同步更新分支状态：拒绝后分支回到completed状态
    try {
      const branchStatusUpdate = {
        action: 'reject',
        branch: showRejectModal.branch,
        timestamp: Date.now()
      }
      localStorage.setItem('omni-branch-status-update', JSON.stringify(branchStatusUpdate))
      
      // 触发storage事件通知其他页面
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'omni-branch-status-update',
        newValue: JSON.stringify(branchStatusUpdate)
      }))
    } catch (error) {
      console.error('同步分支状态失败:', error)
    }
    
    setShowRejectModal(null)
    setRejectReason('')
    message.success(`已拒绝 ${showRejectModal.branch} 的合并请求，分支已回到测试完成状态`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('链接已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  const getStatusTag = (status: CommitRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Tag color="processing">待审批</Tag>
      case 'approved':
        return <Tag color="success">已同意</Tag>
      case 'rejected':
        return <Tag color="error">已拒绝</Tag>
      default:
        return <Tag>未知</Tag>
    }
  }

  const columns: ColumnsType<CommitRecord> = [
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 50,
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch',
      width: 100,
      render: (branch: string, record) => (
        <div>
            <AntButton type="link" size="small" style={{ padding: 0, margin: 0 }}>github.com/ctw/omni/doraemon/tree/{branch}</AntButton>
        </div>
      ),
    },
    {
      title: '功能说明',
      dataIndex: 'desc',
      key: 'desc',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Commit ID',
      dataIndex: 'commitId',
      key: 'commitId',
      width: 40,
      render: (commitId: string) => (
        <span style={{ fontFamily: 'monospace', color: '#666' }}>{commitId}</span>
      ),
    },
    {
      title: 'GitHub Pull链接',
      dataIndex: 'pullUrl',
      key: 'pullUrl',
      width: 60,
      render: (url: string) => (
        <Space>
          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
            查看PR
          </a>
          <AntButton 
            type="text" 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(url)}
            title="复制链接"
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 40,
      render: (status: CommitRecord['status']) => getStatusTag(status),
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 40,
      render: (reviewer?: string) => reviewer || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 80,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="同意合并"
                description={`确定同意 ${record.branch} 的合并请求吗？`}
                onConfirm={() => handleApprove(record)}
                okText="同意"
                cancelText="取消"
              >
                <AntButton 
                  type="primary" 
                  style={{ fontSize: 12, marginRight: 8, padding: '2px 8px' }}
                  size="small" 
                  icon={<CheckOutlined />}
                >
                  同意
                </AntButton>
              </Popconfirm>
              <AntButton 
                danger 
                size="small" 
                type="primary"
                style={{ fontSize: 12, marginRight: 8, padding: '2px 8px' }}
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </AntButton>
            </>
          )}
          {record.status !== 'pending' && (
            <AntButton 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => window.open(record.pullUrl, '_blank')}
            >
              查看
            </AntButton>
          )}
        </Space>
      ),
    },
  ]

  // 动态计算表格总宽度
  const totalWidth = columns.reduce((sum, col) => {
    const width = col.width;
    if (typeof width === 'number') {
      return sum + width + 200;
    }
    return sum;
  }, 0);

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--heading)', margin: 0, marginBottom: 8 }}>Commit 列表</h1>
          <div style={{ color: '#666', fontSize: 14 }}>
            展示&ldquo;合并代码&rdquo;后生成的链接信息，支持审核和管理
          </div>
        </div>
      </div>

      <AntTable<CommitRecord>
        columns={columns}
        dataSource={commits}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          style: { marginRight: 48 } // 添加右边距
        }}
        scroll={{ x: totalWidth }}
      />

      {/* 拒绝Modal */}
      <Modal
        title="拒绝合并请求"
        open={!!showRejectModal}
        onCancel={() => {
          setShowRejectModal(null)
          setRejectReason('')
        }}
        onOk={confirmReject}
        okText="确认拒绝"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>确定要拒绝以下合并请求吗？</p>
          {showRejectModal && (
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div><strong>分支：</strong>{showRejectModal.branch}</div>
              <div><strong>提交人：</strong>{showRejectModal.submitter}</div>
              <div><strong>功能说明：</strong>{showRejectModal.desc}</div>
            </div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            拒绝原因（可选）：
          </label>
          <Input.TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="请输入拒绝原因..."
          />
        </div>
      </Modal>
    </div>
  )
}