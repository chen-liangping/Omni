"use client"
import React, { useEffect, useState } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, Input, Modal, Form, Select as AntSelect, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import Link from 'next/link'

/**
 * 这段代码实现了“项目列表”原型页，使用了 AntD Table + 简单表单。
 * 代码说明：展示项目名称、仓库地址、环境数量、最后更新时间；支持“新增项目”（mock）。
 * 修改原因：满足 docs/定时发布.md 的 3.1 项目管理 - 项目列表需求。
 */

interface ProjectRow {
  id: string
  name: string
  envCount: number
  createdAt: string
  repo?: string
  envs?: Array<{ name: string; url: string }>
  repos?: string[]
}

const initial: ProjectRow[] = [
  { 
    id: 'p1', 
    name: 'Doraemon', 
    envCount: 1, 
    createdAt: '2025-09-01 10:30:15',
    repo: 'https://github.com/ctw/omni-Doraemon',
    envs: [
      { name: 'stg', url: 'https://stg.doraemon.com' },
      // { name: 'prod', url: 'https://doraemon.com' }
    ]
  },
  { 
    id: 'p2', 
    name: 'Publisher', 
    envCount: 1, 
    createdAt: '2025-08-30 14:22:30',
    repo: 'https://github.com/ctw/omni-publisher',
    envs: [
      { name: 'stg', url: 'https://stg.publisher.com' },
      // { name: 'prod', url: 'https://publisher.com' }
    ]
  },
]

export default function ProjectsList() {
  const [rows, setRows] = useState<ProjectRow[]>(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProjectRow | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  // 可搜索仓库地址（mock 数据源）
  const repoChoices = [
    'https://github.com/ctw/omni-publisher',
    'https://github.com/ctw/omni-doraemon',
    'https://github.com/ctw/omni-backend',
    'https://github.com/ctw/omni-frontend',
    'https://github.com/ctw/omni-mobile',

  ]

  // 删除项目
  const handleDelete = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id))
    // 同步删除 localStorage
    try {
      const key = 'omni-projects'
      const raw = localStorage.getItem(key)
      if (raw) {
        const map = JSON.parse(raw) as Record<string, ProjectRow>
        delete map[id]
        localStorage.setItem(key, JSON.stringify(map))
      }
    } catch {}
  }

  // 编辑项目
  const handleEdit = (record: ProjectRow) => {
    setEditingRecord(record)
    // 预填充表单数据，格式与新增表单保持一致
    editForm.setFieldsValue({
      name: record.name,
      repo: record.repo || '',
      envs: (record.envs || []).map(env => ({
        envName: env.name,
        envUrl: env.url
      }))
    })
    setShowEdit(true)
  }

  // 保存编辑
  const onSaveEdit = async () => {
    try {
      const values = await editForm.validateFields() as { name: string; repo?: string; envs?: Array<{ envName?: string; envUrl?: string }> }
      if (!editingRecord) return

      // 处理环境数据，格式与新增逻辑保持一致
      const envs = (values.envs || []).map((e, index) => ({ 
        name: index === 0 ? 'stg' : 'prod', 
        url: (e.envUrl || '').trim() 
      })).filter(e => e.url)

      const updatedRecord: ProjectRow = {
        ...editingRecord,
        name: values.name,
        envs: envs
      }

      // 更新列表数据
      setRows(prev => prev.map(row => row.id === editingRecord.id ? updatedRecord : row))

      // 同步更新 localStorage
      try {
        const key = 'omni-projects'
        const raw = localStorage.getItem(key)
        if (raw) {
          const map = JSON.parse(raw) as Record<string, ProjectRow>
          map[editingRecord.id] = updatedRecord
          localStorage.setItem(key, JSON.stringify(map))
        }
      } catch {}

      setShowEdit(false)
      setEditingRecord(null)
      editForm.resetFields()
    } catch (error) {
      console.error('编辑项目失败:', error)
    }
  }

  const columns: ColumnsType<ProjectRow> = [
    { 
      title: '项目名称', 
      dataIndex: 'name', 
      key: 'name', 
      render: (t: string, r) => <Link href={`/projects/${encodeURIComponent(r.name)}`} style={{ fontWeight: 600 }}>{t}</Link> 
    },
    { 
      title: '项目仓库地址', 
      dataIndex: 'repo', 
      key: 'repo', 
      render: (repo: string) => repo ? <a href={repo} target="_blank" rel="noreferrer" style={{ color: '#1677ff' }}>{repo}</a> : '-'
    },
    { 
      title: '环境及生效分支', 
      key: 'envInfo', 
      render: (_, record) => (
        <div>
          {(record.envs || []).map(env => (
            <div key={env.name} style={{ marginBottom: 4 }}>
              <Tag color={env.name === 'prod' ? 'gold' : 'blue'}>{env.name.toUpperCase()}</Tag>
              <span style={{ fontSize: 12, color: '#666' }}>main</span>
            </div>
          ))}
        </div>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 160
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑项目">
            <AntButton 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="删除项目"
            description="确定要删除这个项目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除项目">
              <AntButton 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const onAdd = async () => {
    const v = await form.validateFields() as { name: string; repo?: string; envs?: Array<{ envUrl?: string }> }
    const id = `p${Date.now()}`
    const createdAt = new Date().toLocaleString('sv-SE') // 格式：YYYY-MM-DD HH:mm:ss
    // 固定环境名称为 stg 和 prod，只需要填写环境地址
    const envs = (v.envs || []).map((e, index) => ({ 
      name: index === 0 ? 'stg' : 'prod', 
      url: (e.envUrl || '').trim() 
    })).filter(e => e.url)
    const envCount = 2 // 固定为两个环境
    const repo = v.repo ? v.repo.trim() : undefined
    const repos = repo ? [repo] : []
    const newRow: ProjectRow = { id, name: v.name, envCount, createdAt, repo, envs, repos }
    setRows(prev => [newRow, ...prev])
    // 持久化到 localStorage，供详情页读取
    try {
      const key = 'omni-projects'
      const raw = localStorage.getItem(key)
      const map = raw ? JSON.parse(raw) as Record<string, ProjectRow> : {}
      map[id] = newRow
      localStorage.setItem(key, JSON.stringify(map))
    } catch {}
    setShowAdd(false)
    form.resetFields()
  }

  // 首次加载时尝试从 localStorage 恢复列表
  useEffect(() => {
    try {
      const key = 'omni-projects'
      // 临时：清除localStorage强制重新初始化（调试用）
      // localStorage.removeItem(key)
      const raw = localStorage.getItem(key)
      if (raw) {
        const map = JSON.parse(raw) as Record<string, ProjectRow>
        const restored = Object.values(map).sort((a, b) => (b.createdAt.localeCompare(a.createdAt)))
        if (restored.length) {
          setRows(restored)
        } else {
          // localStorage 存在但为空：写入初始 mock 列表，确保详情页可按 id 读取名称
          const seed: Record<string, ProjectRow> = {}
          initial.forEach(r => { seed[r.id] = r })
          // console.log('写入初始数据到localStorage (空数据情况):', seed)
          localStorage.setItem(key, JSON.stringify(seed))
        }
      } else {
        // 首次无任何数据：写入初始 mock 列表，确保详情页可按 id 读取名称
        const seed: Record<string, ProjectRow> = {}
        initial.forEach(r => { seed[r.id] = r })
        // console.log('写入初始数据到localStorage (首次情况):', seed)
        localStorage.setItem(key, JSON.stringify(seed))
      }
    } catch {}
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>项目列表</h1>
        <Space>
          <AntButton type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>新增项目</AntButton>
        </Space>
      </div>
      <AntTable<ProjectRow> rowKey={(r) => r.id} columns={columns} dataSource={rows} />

      <Modal title="新增项目" open={showAdd} onCancel={() => setShowAdd(false)} onOk={onAdd} okText="创建">
        <Form form={form} layout="vertical" initialValues={{ envs: [{ envName: 'stg', envUrl: '' }], repo: '' }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="例如 Doraemon" />
          </Form.Item>
          {/* 仓库地址：单条必填 */}
          <Form.Item name="repo" label="仓库地址" rules={[{ required: true, message: '请填写仓库地址' }]}> 
            <AntSelect
              showSearch
              placeholder="选择或搜索仓库地址"
              options={repoChoices.map(u => ({ value: u, label: u }))}
              optionFilterProp="label"
              filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.List name="envs">
            {(fields) => (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>环境地址（可选：stg）</div>
                {fields.map((field) => {
                  const nameLabel = field.name === 0 ? 'stg' : field.name === 1 ? 'prod' : 'env'
                  return (
                    <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      {/* 隐藏环境名称字段，固定为 stg/prod */}
                      <Form.Item {...field} name={[field.name, 'envName']} hidden initialValue={nameLabel}>
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'envUrl']} label={`${nameLabel.toUpperCase()} 环境地址`}> 
                        <Input placeholder={`例如 https://${nameLabel}.example.com（可选）`} />
                      </Form.Item>
                    </div>
                  )
                })}
                {/* 不提供添加或移除按钮：默认仅 stg */}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 编辑项目对话框 */}
      <Modal 
        title="编辑项目" 
        open={showEdit} 
        onCancel={() => {
          setShowEdit(false)
          setEditingRecord(null)
          editForm.resetFields()
        }} 
        onOk={onSaveEdit} 
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" initialValues={{ envs: [{ envName: 'stg', envUrl: '' }], repo: '' }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="例如 Doraemon" />
          </Form.Item>
          {/* 仓库地址：编辑时禁用 */}
          <Form.Item name="repo" label="仓库地址" rules={[{ required: true, message: '请填写仓库地址' }]}> 
            <AntSelect
              showSearch
              placeholder="选择或搜索仓库地址"
              options={repoChoices.map(u => ({ value: u, label: u }))}
              optionFilterProp="label"
              filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
              disabled={!!editingRecord} // 编辑时禁用
              style={{ 
                opacity: !!editingRecord ? 0.6 : 1,
                cursor: !!editingRecord ? 'not-allowed' : 'pointer'
              }}
            />
          </Form.Item>
          <Form.List name="envs">
            {(fields) => (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>环境地址（可选：stg）</div>
                {fields.map((field) => {
                  const nameLabel = field.name === 0 ? 'stg' : field.name === 1 ? 'prod' : 'env'
                  return (
                    <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      {/* 隐藏环境名称字段，固定为 stg/prod */}
                      <Form.Item {...field} name={[field.name, 'envName']} hidden initialValue={nameLabel}>
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'envUrl']} label={`${nameLabel.toUpperCase()} 环境地址`}> 
                        <Input placeholder={`例如 https://${nameLabel}.example.com（可选）`} />
                      </Form.Item>
                    </div>
                  )
                })}
                {/* 不提供添加或移除按钮：默认仅 stg */}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </main>
  )
}

