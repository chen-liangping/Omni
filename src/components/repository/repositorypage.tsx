import React, { useState } from 'react'
import Link from 'next/link'
import { Table as AntTable, Button as AntButton, Modal, Form, Input, Select as AntSelect, Progress as AntProgress, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Repository { id: string; name: string; group?: string; type: string }

function CreateRepoDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const createRepoMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; category: string }) => ({ id: String(Date.now()), ...data }),
    onSuccess: (newRepo: Repository) => {
      // 将新仓库写入本地缓存，触发列表刷新
      // 这里不使用泛型，直接标注参数类型以兼容本项目的最小类型声明
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryClient as any).setQueryData(['repositories'], (prev: Repository[] | undefined) => prev ? [...prev, newRepo] : [newRepo])
      onClose()
      message.success('仓库已创建')
    }
  })
  const handleOk = async () => { const values = await form.validateFields(); createRepoMutation.mutate(values) }
  return (
    <Modal title="新增仓库" open={visible} onCancel={onClose} onOk={handleOk} okText="创建">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="仓库名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="type" label="仓库类型" initialValue="private">
          <AntSelect options={[{ label: '公共仓库', value: 'public' }, { label: '私有仓库', value: 'private' }]} />
        </Form.Item>
        <Form.Item name="category" label="仓库分类" initialValue="frontend-micro">
          <AntSelect options={[{ label: '前端微服务', value: 'frontend-micro' }, { label: '后端微服务', value: 'backend-micro' }, { label: '纯前端', value: 'frontend-only' }]} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function InitializeDialog({ repoId, visible, onClose }: { repoId: string; visible: boolean; onClose: () => void }) {
  const [progress, setProgress] = useState({ step: 0, message: '准备初始化...', progress: 0 })
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const steps = [{ message: '注入分支保护规则...', delay: 800 }, { message: '配置 GitHub Workflows...', delay: 1200 }, { message: '完成初始化', delay: 400 }]
      for (let i = 0; i < steps.length; i++) { // simulate
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, steps[i].delay))
        setProgress({ step: i + 1, message: steps[i].message, progress: ((i + 1) / steps.length) * 100 })
      }
      return { ok: true }
    },
    onSuccess: () => { message.success('初始化完成'); onClose() }
  })
  return (
    <Modal title="仓库初始化" open={visible} onCancel={onClose} footer={null}>
      <div style={{ padding: 8 }}>
        <AntProgress percent={Math.round(progress.progress)} />
        <div style={{ marginTop: 12 }}>{progress.message}</div>
        <Space style={{ marginTop: 12 }}>
          <AntButton onClick={onClose} disabled={initializeMutation.isPending}>关闭</AntButton>
          <AntButton type="primary" onClick={() => initializeMutation.mutate()} disabled={initializeMutation.isPending}>{initializeMutation.isPending ? '初始化中' : '开始初始化'}</AntButton>
        </Space>
      </div>
    </Modal>
  )
}

export default function RepositoriesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInitDialog, setShowInitDialog] = useState(false)
  const [selectedRepoId, setSelectedRepoId] = useState('')
  const { data: repositories = [] } = useQuery<Repository[]>({ queryKey: ['repositories'], queryFn: async () => [{ id: '1', name: 'omni-frontend', group: 'team-a', type: 'frontend-micro' }, { id: '2', name: 'omni-backend', group: 'team-b', type: 'backend-micro' }] })

  const handleInitialize = (repoId: string) => { setSelectedRepoId(repoId); setShowInitDialog(true) }
  const columns: ColumnsType<Repository> = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Repository) => <Link href={`/repositories/${record.id}`}>{text}</Link>
    },
    {
      title: '仓库组别',
      dataIndex: 'group',
      key: 'group',
      render: (g: string | undefined) => g ?? '-'
    },
    {
      title: '仓库类型',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => (t === 'frontend-micro' ? '前端微服务' : t === 'backend-micro' ? '后端微服务' : '纯前端')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Repository) => (
        <Space>
          <AntButton type="link" onClick={() => handleInitialize(record.id)}>初始化</AntButton>
          <AntButton type="link">归档</AntButton>
          <AntButton type="link">删除</AntButton>
        </Space>
      )
    }
  ]

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>仓库管理</h1>
        <div>
          <AntButton icon={<PlusOutlined />} onClick={() => setShowCreateDialog(true)}>新增仓库</AntButton>
        </div>
      </div>
      <AntTable rowKey="id" columns={columns} dataSource={repositories} />
      <CreateRepoDialog visible={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
      <InitializeDialog repoId={selectedRepoId} visible={showInitDialog} onClose={() => setShowInitDialog(false)} />
    </main>
  )
}
  