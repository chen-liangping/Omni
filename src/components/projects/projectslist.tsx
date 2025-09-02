"use client"
import React, { useEffect, useState } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, Input, Modal, Form, Select as AntSelect } from 'antd'
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
  updatedAt: string
  envs?: Array<{ name: string; url: string }>
  repos?: string[]
}

const initial: ProjectRow[] = [
  { id: 'p1', name: 'Doraemon',  envCount: 3, updatedAt: '2025-09-01' },
  { id: 'p2', name: 'Publisher', envCount: 2, updatedAt: '2025-08-30' },
]

export default function ProjectsList() {
  const [rows, setRows] = useState<ProjectRow[]>(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form] = Form.useForm()

  // 可搜索仓库地址（mock 数据源）
  const repoChoices = [
    'https://github.com/ctw/omni-frontend',
    'https://github.com/ctw/omni-backend',
  ]

  const columns: ColumnsType<ProjectRow> = [
    { title: '项目名称', dataIndex: 'name', key: 'name', render: (t: string, r) => <Link href={`/projects/${r.id}`}>{t}</Link> },
    { title: '环境数量', dataIndex: 'envCount', key: 'envCount', render: (n: number) => <Tag color="blue">{n}</Tag> },
    { title: '最后更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
  ]

  const onAdd = async () => {
    const v = await form.validateFields() as { name: string; repos?: string[]; envs?: Array<{ envName?: string; envUrl?: string }> }
    const id = `p${Date.now()}`
    const updatedAt = new Date().toISOString().slice(0,10)
    const envs = (v.envs || []).map(e => ({ name: (e.envName || '').trim(), url: (e.envUrl || '').trim() })).filter(e => e.name && e.url)
    const envCount = envs.length
    const repos = (v.repos || []).map(u => (u || '').trim()).filter(u => !!u)
    const newRow: ProjectRow = { id, name: v.name, envCount, updatedAt, envs, repos }
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
      const raw = localStorage.getItem(key)
      if (raw) {
        const map = JSON.parse(raw) as Record<string, ProjectRow>
        const restored = Object.values(map).sort((a, b) => (b.updatedAt.localeCompare(a.updatedAt)))
        if (restored.length) {
          setRows(restored)
        } else {
          // localStorage 存在但为空：写入当前 mock 列表，确保详情页可按 id 读取名称
          const seed: Record<string, ProjectRow> = {}
          rows.forEach(r => { seed[r.id] = r })
          localStorage.setItem(key, JSON.stringify(seed))
        }
      } else {
        // 首次无任何数据：写入当前 mock 列表，确保详情页可按 id 读取名称
        const seed: Record<string, ProjectRow> = {}
        rows.forEach(r => { seed[r.id] = r })
        localStorage.setItem(key, JSON.stringify(seed))
      }
    } catch {}
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>项目列表</h1>
        <Space>
          <AntButton type="primary" onClick={() => setShowAdd(true)}>新增项目</AntButton>
        </Space>
      </div>
      <AntTable<ProjectRow> rowKey={(r) => r.id} columns={columns} dataSource={rows} />

      <Modal title="新增项目" open={showAdd} onCancel={() => setShowAdd(false)} onOk={onAdd} okText="创建">
        <Form form={form} layout="vertical" initialValues={{ envs: [{ envName: 'stg', envUrl: '' }], repos: [''] }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="例如 Doraemon" />
          </Form.Item>
          <Form.List name="repos">
            {(fields, { add, remove }) => (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>仓库地址（可多个）</div>
                {fields.map((field) => (
                  <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                    <Form.Item {...field} name={field.name} label={fields.length > 1 ? `仓库地址 ${field.name + 1}` : '仓库地址'}>
                      <AntSelect
                        showSearch
                        placeholder="选择或搜索仓库地址"
                        options={repoChoices.map(u => ({ value: u, label: u }))}
                        optionFilterProp="label"
                        filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                      />
                    </Form.Item>
                    <AntButton danger onClick={() => remove(field.name)}>移除</AntButton>
                  </div>
                ))}
                <AntButton type="dashed" onClick={() => add('')}>+ 增加一个仓库地址</AntButton>
              </div>
            )}
          </Form.List>
          <Form.List name="envs">
            {(fields, { add, remove }) => (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>环境地址（可选，填写则按数量自动计算）</div>
                {fields.map((field) => (
                  <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'end' }}>
                    <Form.Item {...field} name={[field.name, 'envName']} label="环境名称" rules={[{ required: false }]}> 
                      <Input placeholder="例如 stg / pre / prod" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'envUrl']} label="环境地址" rules={[{ required: false }]}> 
                      <Input placeholder="例如 https://stg.example.com" />
                    </Form.Item>
                    <AntButton danger onClick={() => remove(field.name)}>移除</AntButton>
                  </div>
                ))}
                <AntButton type="dashed" onClick={() => add({ envName: '', envUrl: '' })}>+ 增加一个环境地址</AntButton>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </main>
  )
}

