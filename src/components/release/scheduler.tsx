"use client"
import React, { useMemo, useState } from 'react'
import { Table as AntTable, Button as AntButton, Modal, Form, Select as AntSelect, Input, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

/**
 * 这段代码实现了“定时发布/多环境分支管理”原型页面，使用了 Ant Design 的 Table/Modal/Form。
 * 代码说明：
 * - 环境状态展示：环境、分支、Commit、功能说明、更新时间、部署人
 * - 关联分支弹窗：选择环境/分支并填写功能说明，确认后更新表格
 * - 历史记录：简单 mock，一键展示
 * 修改原因：依据 docs/定时发布.md 的 PRD 拆解为 UI 原型，用于快速验证交互。
 */

type Env = 'stg' | 'uat' | 'prod'
interface EnvRow { env: Env; branch: string; commit: string; desc: string; updatedAt: string; operator: string }
interface HistoryRow { time: string; env: Env; action: string; branch: string; commit: string; operator: string }

const initialEnvs: EnvRow[] = [
  { env: 'stg', branch: 'feat/login', commit: 'abc123', desc: '登录优化', updatedAt: '2025-09-01', operator: '张三' },
  { env: 'uat', branch: 'feat/cart',  commit: 'def456', desc: '购物车改造', updatedAt: '2025-08-30', operator: '李四' },
  { env: 'prod', branch: 'main',      commit: 'ghi789', desc: '稳定版本', updatedAt: '2025-08-28', operator: '系统' },
]

const mockBranches = ['feat/login', 'feat/cart', 'hotfix/cve', 'main']

export default function ReleaseScheduler() {
  const [envRows, setEnvRows] = useState<EnvRow[]>(initialEnvs)
  const [showLink, setShowLink] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [form] = Form.useForm()

  const columns: ColumnsType<EnvRow> = [
    { title: '环境', dataIndex: 'env', key: 'env', render: (e: Env) => <Tag color={e==='prod'?'gold': e==='uat'?'cyan':'blue'}>{e}</Tag> },
    { title: '分支', dataIndex: 'branch', key: 'branch' },
    { title: 'Commit', dataIndex: 'commit', key: 'commit', render: (v: string) => <a href="#">{v}</a> },
    { title: '功能说明', dataIndex: 'desc', key: 'desc' },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
    { title: '部署人', dataIndex: 'operator', key: 'operator' },
  ]

  const historyData: HistoryRow[] = useMemo(() => ([
    { time: '2025-09-01', env: 'stg', action: '自动更新', branch: 'feat/login', commit: 'abc123', operator: '系统' },
    { time: '2025-08-30', env: 'uat', action: '手动关联', branch: 'feat/cart', commit: 'def456', operator: '李四' },
  ]), [])

  const onLinkSubmit = async () => {
    const values = await form.validateFields() as { env: Env; branch: string; desc: string }
    const commit = Math.random().toString(16).slice(2,8)
    const updatedAt = new Date().toISOString().slice(0,10)
    setEnvRows(prev => prev.map(r => r.env === values.env ? { ...r, branch: values.branch, desc: values.desc, commit, updatedAt, operator: '你' } : r))
    setShowLink(false)
    form.resetFields()
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>环境状态</h1>
        <Space>
          <AntButton onClick={() => setShowHistory(true)}>查看历史</AntButton>
          <AntButton type="primary" onClick={() => setShowLink(true)}>关联分支</AntButton>
        </Space>
      </div>

      <AntTable rowKey={(r) => r.env} columns={columns} dataSource={envRows} pagination={false} />

      <Modal title="关联分支到环境" open={showLink} onCancel={() => setShowLink(false)} onOk={onLinkSubmit} okText="确认关联">
        <Form form={form} layout="vertical">
          <Form.Item name="env" label="环境" rules={[{ required: true }]}>
            <AntSelect options={[{value:'stg',label:'stg'},{value:'uat',label:'uat'},{value:'prod',label:'prod'}]} />
          </Form.Item>
          <Form.Item name="branch" label="分支" rules={[{ required: true }]}>
            <AntSelect options={mockBranches.map(b => ({ value: b, label: b }))} />
          </Form.Item>
          <Form.Item name="desc" label="功能说明" rules={[{ required: true }]}>
            <Input placeholder="请填写该分支的功能说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="历史记录" open={showHistory} onCancel={() => setShowHistory(false)} footer={null} width={720}>
        <AntTable<HistoryRow>
          rowKey={(r) => r.time + r.env}
          columns={[
            { title: '时间', dataIndex: 'time' },
            { title: '环境', dataIndex: 'env' },
            { title: '操作类型', dataIndex: 'action' },
            { title: '分支', dataIndex: 'branch' },
            { title: 'Commit', dataIndex: 'commit' },
            { title: '操作人', dataIndex: 'operator' },
          ]}
          dataSource={historyData}
          pagination={false}
        />
      </Modal>
    </main>
  )
}

