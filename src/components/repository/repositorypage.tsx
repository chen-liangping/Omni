import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Table as AntTable, Button as AntButton, Modal, Form, Input, Select as AntSelect, Progress as AntProgress, Space, App as AntApp } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type RepoStatus = '初始化完成' | '未初始化' | '初始化中'
interface Repository { id: string; name: string; type: string; status: RepoStatus; project: string }

function CreateRepoDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [form] = Form.useForm()
  const { message: msg } = AntApp.useApp()
  const queryClient = useQueryClient()
  const createRepoMutation = useMutation({
    // 将“分类”映射为列表展示所需的 type 字段；新仓库默认状态为“未初始化”
    mutationFn: async (data: { name: string; type: string; category: string }) => ({
      id: String(Date.now()),
      name: data.name,
      type: data.category,
      status: '未初始化' as RepoStatus,
      project: '未分配'
    }),
    onSuccess: (newRepo: Repository) => {
      // 将新仓库写入本地缓存，触发列表刷新
      // 这里不使用泛型，直接标注参数类型以兼容本项目的最小类型声明
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryClient as any).setQueryData(['repositories'], (prev: Repository[] | undefined) => prev ? [...prev, newRepo] : [newRepo])
      onClose()
      msg.success('仓库已创建')
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
  const { message: msg } = AntApp.useApp()
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
    onSuccess: () => { msg.success('初始化完成'); onClose() }
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
  const { data: repositories = [] } = useQuery<Repository[]>({
    queryKey: ['repositories'],
    queryFn: async () => [
      { id: '1', name: 'omni-frontend', type: 'frontend-micro', status: '初始化完成', project: '项目A' },
      { id: '2', name: 'omni-backend', type: 'backend-micro', status: '初始化中', project: '项目B' },
      { id: '3', name: 'order-service', type: 'backend-micro', status: '未初始化', project: '项目A' },
      { id: '4', name: 'user-service', type: 'backend-micro', status: '初始化完成', project: '项目B' },
      { id: '5', name: 'payment-api', type: 'backend-micro', status: '初始化完成', project: '项目C' },
      { id: '6', name: 'inventory-service', type: 'backend-micro', status: '未初始化', project: '项目A' },
      { id: '7', name: 'notification-service', type: 'backend-micro', status: '未初始化', project: '项目B' },
      { id: '8', name: 'auth-service', type: 'backend-micro', status: '初始化中', project: '项目C' },
      { id: '9', name: 'reporting-ui', type: 'frontend-only', status: '初始化完成', project: '项目A' },
      { id: '10', name: 'marketing-site', type: 'frontend-only', status: '未初始化', project: '项目C' },
      { id: '11', name: 'profile-ui', type: 'frontend-micro', status: '初始化完成', project: '项目A' },
      { id: '12', name: 'checkout-ui', type: 'frontend-micro', status: '初始化中', project: '项目B' },
      { id: '13', name: 'recommendation-service', type: 'backend-micro', status: '初始化完成', project: '项目C' },
      { id: '14', name: 'billing-service', type: 'backend-micro', status: '未初始化', project: '项目B' },
      { id: '15', name: 'search-service', type: 'backend-micro', status: '初始化完成', project: '项目A' },
      { id: '16', name: 'feed-service', type: 'backend-micro', status: '初始化完成', project: '项目C' },
      { id: '17', name: 'cms-ui', type: 'frontend-only', status: '未初始化', project: '项目B' }
    ]
  })

  // 顶部工具条状态：项目筛选 + 状态筛选 + 搜索关键字
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | RepoStatus>('all')
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // 分页状态（受控）
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // 项目与状态筛选项
  const projectOptions: { label: string; value: string }[] = useMemo(() => {
    const set = new Set<string>(repositories.map(r => r.project))
    return [{ label: '全部项目', value: 'all' }, ...Array.from(set).map(p => ({ label: p, value: p })) ]
  }, [repositories])
  const statusOptions: { label: string; value: 'all' | RepoStatus }[] = [
    { label: '全部状态', value: 'all' },
    { label: '初始化完成', value: '初始化完成' },
    { label: '未初始化', value: '未初始化' },
    { label: '初始化中', value: '初始化中' }
  ]

  // 基于项目与搜索的本地筛选
  const filteredRepositories: Repository[] = repositories.filter((repo: Repository) => {
    const inProject = selectedProject === 'all' || repo.project === selectedProject
    const inStatus = selectedStatus === 'all' || repo.status === selectedStatus
    const inSearch = searchKeyword.trim() === '' || repo.name.toLowerCase().includes(searchKeyword.trim().toLowerCase())
    return inProject && inStatus && inSearch
  })

  const totalItems: number = filteredRepositories.length
  const pagedRepositories: Repository[] = filteredRepositories.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleInitialize = (repoId: string) => { setSelectedRepoId(repoId); setShowInitDialog(true) }
  const columns: ColumnsType<Repository> = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Repository) => <Link href={`/repositories/${record.id}`}>{text}</Link>
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: RepoStatus) => s
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
    <main style={{ padding: '24px 24px 24px 10px' }}>
      {/* 顶部：左侧项目选择器+搜索；右侧新增按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <AntSelect
            style={{ width: 200 }}
            options={projectOptions}
            value={selectedProject}
            // 切换项目时重置到第 1 页
            onChange={(value: string) => { setSelectedProject(value); setCurrentPage(1) }}
          />
          <AntSelect
            style={{ width: 160 }}
            options={statusOptions}
            value={selectedStatus}
            // 切换状态时重置到第 1 页
            onChange={(value: 'all' | RepoStatus) => { setSelectedStatus(value); setCurrentPage(1) }}
          />
          <Input
            style={{ width: 320 }}
            placeholder="搜索仓库"
            allowClear
            prefix={<SearchOutlined />}
            value={searchKeyword}
            // 输入搜索时重置到第 1 页
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <div>
          <AntButton icon={<PlusOutlined />} onClick={() => setShowCreateDialog(true)}>新增仓库</AntButton>
        </div>
      </div>
      <AntTable
        rowKey="id"
        columns={columns}
        dataSource={pagedRepositories}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalItems,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (total) => `共 ${total} 个仓库`,
          hideOnSinglePage: false
        }}
        // 同步分页状态
        onChange={(pagination: TablePaginationConfig) => {
          const nextCurrent: number = pagination.current ?? 1
          const nextPageSize: number = pagination.pageSize ?? pageSize
          setCurrentPage(nextCurrent)
          setPageSize(nextPageSize)
        }}
      />
      <CreateRepoDialog visible={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
      <InitializeDialog repoId={selectedRepoId} visible={showInitDialog} onClose={() => setShowInitDialog(false)} />
    </main>
  )
}
  